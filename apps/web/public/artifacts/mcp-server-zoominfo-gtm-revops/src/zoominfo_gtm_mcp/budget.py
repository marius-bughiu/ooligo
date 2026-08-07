"""Credit ledger, record cache, and audit log for the ZoomInfo GTM MCP server.

ZoomInfo charges one bulk data credit per *record returned* by an enrich call, unless
that record is already under management. No-match results and errors are not charged.
That asymmetry is the whole reason this module exists: the cost of a call is not known
until the response is parsed, so a budget can only be enforced in two steps.

  1. reserve(n)   — before the call, hold the worst case (every input matches, every
                    match is new). Refuses the call if the worst case would breach the
                    ceiling. Pessimistic on purpose: an agent that discovers its budget
                    mid-batch has already spent the money.
  2. settle(...)  — after the call, replace the reservation with the count actually
                    charged, derived from matchStatus, and release the difference.

Reservations live in memory for the process; the ledger is durable. If the process dies
between reserve and settle, the reservation dies with it and the durable ledger simply
never records the spend — the next run's ceiling is then slightly generous rather than
slightly strict. That is the safer direction to be wrong for a guard that can otherwise
deadlock an agent against a phantom hold.

The cache is keyed on ZoomInfo's own record id with a 365-day TTL, matching the Records
Under Management window during which re-enrichment is free. A hit costs no credit *and*
no HTTP request, which is the difference that matters when an agent re-asks the same
question four times in one session.
"""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

# Records Under Management: ZoomInfo does not re-charge for a record already under
# management. The documented window is 12 months, so a longer local TTL would serve
# stale data while a shorter one throws away free freshness.
CACHE_TTL_SECONDS = 365 * 24 * 60 * 60


class BudgetExceeded(RuntimeError):
    """Raised before any HTTP call when the worst-case cost breaches the daily ceiling."""


@dataclass(frozen=True)
class BudgetState:
    daily_limit: int
    spent_today: int
    reserved: int

    @property
    def available(self) -> int:
        return max(0, self.daily_limit - self.spent_today - self.reserved)


class CreditGovernor:
    """Durable credit ledger + record cache + append-only audit log, backed by SQLite."""

    def __init__(self, db_path: str | Path, daily_limit: int, run_id: str, audit_path: str | Path | None = None):
        self.db_path = str(db_path)
        self.daily_limit = daily_limit
        self.run_id = run_id
        self.audit_path = Path(audit_path) if audit_path else None
        self._reserved = 0
        self._lock = threading.Lock()
        self._init_db()

    # ----- schema -----

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        # The ledger is read on every enrich call and written on every settle. WAL keeps
        # a concurrent reader from blocking the writer when two agents share a state file.
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def _init_db(self) -> None:
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS credit_ledger (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts          TEXT    NOT NULL,
                    day         TEXT    NOT NULL,
                    run_id      TEXT    NOT NULL,
                    tool        TEXT    NOT NULL,
                    requested   INTEGER NOT NULL,
                    cache_hits  INTEGER NOT NULL,
                    charged     INTEGER NOT NULL,
                    no_match    INTEGER NOT NULL
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_ledger_day ON credit_ledger(day)")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS record_cache (
                    entity     TEXT NOT NULL,
                    zi_id      TEXT NOT NULL,
                    payload    TEXT NOT NULL,
                    fetched_at REAL NOT NULL,
                    PRIMARY KEY (entity, zi_id)
                )
                """
            )

    # ----- budget -----

    def state(self) -> BudgetState:
        return BudgetState(self.daily_limit, self.spent_today(), self._reserved)

    def spent_today(self) -> int:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COALESCE(SUM(charged), 0) FROM credit_ledger WHERE day = ?",
                (_today(),),
            ).fetchone()
        return int(row[0])

    def reserve(self, worst_case: int) -> int:
        """Hold `worst_case` credits. Raises BudgetExceeded rather than partially reserving.

        Partial reservation would let an agent silently enrich the first 8 of 25 accounts
        and report success, which reads as a complete answer and is not one.
        """
        with self._lock:
            st = self.state()
            if worst_case > st.available:
                raise BudgetExceeded(
                    f"This call could charge up to {worst_case} bulk data credits and only "
                    f"{st.available} remain in today's ceiling of {st.daily_limit} "
                    f"({st.spent_today} already spent, {st.reserved} held by calls in flight). "
                    "Narrow the batch, raise ZI_DAILY_CREDIT_LIMIT deliberately, or wait for "
                    "the ceiling to roll over at UTC midnight."
                )
            self._reserved += worst_case
            return worst_case

    def settle(self, *, tool: str, reserved: int, requested: int, charged: int, cache_hits: int, no_match: int) -> None:
        """Release the reservation and record what was actually charged."""
        with self._lock:
            self._reserved = max(0, self._reserved - reserved)
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO credit_ledger (ts, day, run_id, tool, requested, cache_hits, charged, no_match) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (_now_iso(), _today(), self.run_id, tool, requested, cache_hits, charged, no_match),
            )
        self._audit(
            {
                "ts": _now_iso(),
                "run_id": self.run_id,
                "tool": tool,
                "requested": requested,
                "cache_hits": cache_hits,
                "charged": charged,
                "no_match": no_match,
                "spent_today_after": self.spent_today(),
                "daily_limit": self.daily_limit,
            }
        )

    def release(self, reserved: int) -> None:
        """Drop a reservation without charging — used when the HTTP call itself fails."""
        with self._lock:
            self._reserved = max(0, self._reserved - reserved)

    def spend_by_tool(self, days: int = 7) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT day, tool, SUM(charged), SUM(cache_hits) FROM credit_ledger "
                "WHERE day >= date('now', ?) GROUP BY day, tool ORDER BY day DESC, tool",
                (f"-{int(days)} days",),
            ).fetchall()
        return [
            {"day": d, "tool": t, "credits_charged": int(c), "cache_hits": int(h)}
            for d, t, c, h in rows
        ]

    # ----- cache -----

    def cache_get(self, entity: str, zi_ids: Iterable[str]) -> dict[str, Any]:
        ids = [str(i) for i in zi_ids]
        if not ids:
            return {}
        cutoff = time.time() - CACHE_TTL_SECONDS
        placeholders = ",".join("?" for _ in ids)
        with self._connect() as conn:
            rows = conn.execute(
                f"SELECT zi_id, payload FROM record_cache "
                f"WHERE entity = ? AND fetched_at >= ? AND zi_id IN ({placeholders})",
                (entity, cutoff, *ids),
            ).fetchall()
        return {zid: json.loads(payload) for zid, payload in rows}

    def cache_put(self, entity: str, records: dict[str, Any]) -> None:
        if not records:
            return
        now = time.time()
        with self._connect() as conn:
            conn.executemany(
                "INSERT OR REPLACE INTO record_cache (entity, zi_id, payload, fetched_at) VALUES (?, ?, ?, ?)",
                [(entity, str(k), json.dumps(v), now) for k, v in records.items()],
            )

    # ----- audit -----

    def _audit(self, event: dict[str, Any]) -> None:
        if not self.audit_path:
            return
        self.audit_path.parent.mkdir(parents=True, exist_ok=True)
        with self.audit_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(event, ensure_ascii=False) + "\n")


def _today() -> str:
    # The ceiling rolls at UTC midnight, not local midnight, so a team spread across
    # time zones sees one shared boundary rather than an argument about whose day it is.
    return datetime.now(timezone.utc).date().isoformat()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def governor_from_env(run_id: str) -> CreditGovernor:
    return CreditGovernor(
        db_path=os.environ.get("ZI_STATE_PATH", "./zi_state.db"),
        daily_limit=int(os.environ.get("ZI_DAILY_CREDIT_LIMIT", "250")),
        run_id=run_id,
        audit_path=os.environ.get("ZI_AUDIT_LOG"),
    )
