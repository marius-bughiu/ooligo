#!/usr/bin/env node
// lane-lock.mjs — cross-lane mutex so only one autonomous content lane runs in a git tree at a time.
//
//   node scripts/lane-lock.mjs acquire <lane-id> [--pid <n>]   exit 0 = you hold it, 1 = someone else does
//   node scripts/lane-lock.mjs release <lane-id>               exit 0 = released, 1 = you did not hold it
//   node scripts/lane-lock.mjs status                          prints the current holder, or "free"
//
// The lock lives at <repo-root>/.tmp/lane-lock.json. `.tmp/` is gitignored (.gitignore:40), so the lock
// can never be committed. Override with OOLIGO_LANE_LOCK=<absolute path> — e.g. to share one lock across
// worktrees, or to point a test somewhere harmless.
//
// ---------------------------------------------------------------------------------------------------
// WHICH PID GETS WATCHED — read this before wiring a lane up, it decides how fast a crash recovers.
//
// `acquire` runs in its own node process that exits in milliseconds, so its own pid is worthless as a
// liveness signal. The pid worth watching is the lane runner that stays alive for the whole run, and
// only the caller knows it. Measured on this machine:
//
//   PowerShell : process.ppid is stable across invocations and equals $PID   -> durable, watchable
//   Git Bash   : process.ppid is a different, already-dead intermediate on every single invocation
//                (durable shell $$=35092, three consecutive node runs saw ppid 28700 / 36124 / 35628,
//                each ESRCH moments later)
//
// So ppid cannot be trusted by default: under Git Bash every lock would look dead instantly and every
// lane would steal from every other lane. A mutex that always steals is worse than no mutex. Therefore:
//
//   * --pid <n> (or OOLIGO_LANE_LOCK_PID) marks the pid TRUSTED. A trusted pid that stops running makes
//     the lock stale immediately. Pass the runner's own pid:
//         PowerShell   --pid $PID
//         Git Bash     --pid $(cat /proc/$$/winpid)      NOT --pid $$ — see below
//     Git Bash's $$ is an MSYS pseudo-pid that Windows has never heard of (measured: $$=35186 is ESRCH,
//     the real pid is /proc/$$/winpid=30920, "bash.exe"). Passing it would write a lock that is stale
//     the instant it is created, so acquire rejects a --pid that is not currently running.
//   * With no flag we still record process.ppid, but only for diagnostics; it can NOT trigger a steal,
//     because a dead unwatchable parent tells us nothing about whether the lane is still working.
//
// STALENESS — the reason this file exists. On acquire an existing lock is stolen when either:
//   * its pid is trusted and no longer running, or
//   * the lock is older than 6 hours (always, trusted or not).
// Both are logged loudly. There is prior art for getting this wrong in this repo:
// .claude/scheduled_tasks.lock sat for 23 days holding pid 53932, long dead, while tasks kept firing.
// A lock that outlives its process must never wedge the pipeline — the 6h cap is the backstop that
// guarantees it, with or without a trusted pid.
//
// Liveness is decided by process.kill(pid, 0), which has correct errno semantics here (verified: alive
// -> returns true; dead -> throws ESRCH; alive-but-protected -> throws EPERM). On win32 we additionally
// ask `tasklist` whether the pid still maps to the image name recorded at acquire time, because Windows
// recycles pids fast and an unrelated new process must not inherit a lock. tasklist is a secondary check
// only — if it is missing or errors, the process.kill verdict stands.
// ---------------------------------------------------------------------------------------------------

import { execFileSync } from "node:child_process";
import {
  closeSync, fsyncSync, mkdirSync, openSync, readFileSync,
  renameSync, statSync, unlinkSync, writeSync,
} from "node:fs";
import { hostname } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LOCK_PATH = process.env.OOLIGO_LANE_LOCK || join(ROOT, ".tmp", "lane-lock.json");

const STALE_HOURS = 6;
const STALE_MS = STALE_HOURS * 60 * 60 * 1000;
// A fresh unparseable lock file means another lane is mid-claim, not that the file is garbage.
const TORN_GRACE_MS = 5000;
const MAX_ATTEMPTS = 3;

const log = (...parts) => console.log("[lane-lock]", ...parts);
const err = (...parts) => console.error("[lane-lock]", ...parts);

// ---------------------------------------------------------------- lock file I/O

function readLock() {
  let raw;
  try {
    raw = readFileSync(LOCK_PATH, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return { state: "free" };
    return { state: "unreadable", why: `${e.code || e.message}` };
  }
  let mtimeMs = Date.now();
  try { mtimeMs = statSync(LOCK_PATH).mtimeMs; } catch { /* raced away; keep now */ }
  if (!raw.trim()) return { state: "corrupt", raw, mtimeMs, why: "file is empty" };
  let lock;
  try { lock = JSON.parse(raw); } catch (e) {
    return { state: "corrupt", raw, mtimeMs, why: `unparseable JSON (${e.message})` };
  }
  if (!lock || typeof lock !== "object" || typeof lock.lane !== "string" || !Number.isInteger(lock.pid)) {
    return { state: "corrupt", raw, mtimeMs, why: "missing lane/pid fields" };
  }
  return { state: "held", lock, raw, mtimeMs };
}

// Identity of a lock read, so we can tell "still the same lock" from "someone moved under us".
function fingerprint(res) {
  if (res.state === "held") return `held|${res.lock.lane}|${res.lock.pid}|${res.lock.acquiredAt}|${res.lock.token}`;
  if (res.state === "corrupt") return `corrupt|${res.raw.length}|${Math.round(res.mtimeMs)}`;
  return res.state;
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Atomic exclusive create. Winning this is what actually grants the lock on a free tree.
function tryCreateSentinel() {
  mkdirSync(dirname(LOCK_PATH), { recursive: true });
  try {
    closeSync(openSync(LOCK_PATH, "wx"));
    return true;
  } catch (e) {
    if (e.code === "EEXIST") return false;
    throw e;
  }
}

// Write to a temp file, fsync, then rename over the lock. rename replaces atomically (MoveFileEx with
// REPLACE_EXISTING on Windows), so a concurrent reader sees either the old lock or the new one, never a
// half-written one.
function writeLockAtomic(payload) {
  mkdirSync(dirname(LOCK_PATH), { recursive: true });
  const tmp = `${LOCK_PATH}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  const fd = openSync(tmp, "wx");
  try {
    writeSync(fd, `${JSON.stringify(payload, null, 2)}\n`);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  // Windows hands out transient EPERM/EBUSY when an indexer or AV has the target open; retry briefly.
  for (let attempt = 1; ; attempt++) {
    try { renameSync(tmp, LOCK_PATH); return; } catch (e) {
      if (attempt >= 3 || !["EPERM", "EBUSY", "EACCES"].includes(e.code)) {
        try { unlinkSync(tmp); } catch { /* best effort */ }
        throw e;
      }
      sleepSync(50);
    }
  }
}

// ---------------------------------------------------------------- liveness

// "" = no such pid, null = tasklist unusable, otherwise the image name.
function tasklistImage(pid) {
  try {
    const out = execFileSync("tasklist", ["/FI", `PID eq ${pid}`, "/NH", "/FO", "CSV"], {
      encoding: "utf8", timeout: 5000, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    });
    const m = out.match(/^"([^"]+)","(\d+)"/m);
    if (!m) return "";
    return Number(m[2]) === pid ? m[1] : "";
  } catch {
    return null;
  }
}

function pidLiveness(pid, image) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return { alive: false, how: `pid ${pid} is not a valid process id` };
  }
  let how;
  try {
    process.kill(pid, 0);
    how = "process.kill(pid, 0) succeeded";
  } catch (e) {
    if (e.code === "ESRCH") return { alive: false, how: "process.kill(pid, 0) -> ESRCH (no such process)" };
    if (e.code === "EPERM") how = "process.kill(pid, 0) -> EPERM (process exists, owned by someone else)";
    // Anything else is a check we do not understand. Assume alive so we never steal from a live lane;
    // the 6h age cap is the backstop that keeps that from wedging anything.
    else how = `process.kill(pid, 0) -> ${e.code || e.message} (unrecognised; assuming alive, ${STALE_HOURS}h cap still applies)`;
  }
  if (process.platform === "win32" && typeof image === "string" && image) {
    const seen = tasklistImage(pid);
    if (seen === null) how += "; tasklist unavailable, kept the kill() verdict";
    else if (seen === "") return { alive: false, how: `${how}, but tasklist reports no such pid` };
    else if (seen.toLowerCase() !== image.toLowerCase()) {
      return { alive: false, how: `${how}, but the pid was recycled (locked as ${image}, tasklist now says ${seen})` };
    } else how += `; tasklist confirms ${seen}`;
  }
  return { alive: true, how };
}

// ---------------------------------------------------------------- helpers

// Locks written by this script always carry pidTrusted. A lock without it came from somewhere else
// (hand-written, another tool), and its pid is taken at face value.
const lockPidTrusted = (lock) => lock.pidTrusted !== false;

function lockAgeMs(res) {
  const t = Date.parse(res.lock?.acquiredAt ?? "");
  return Date.now() - (Number.isFinite(t) ? t : res.mtimeMs);
}

function fmtAge(ms) {
  const v = ms < 0 ? 0 : ms;
  const s = Math.round(v / 1000);
  if (s < 90) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 90) return `${m}m`;
  const h = v / 3600000;
  return h < 48 ? `${h.toFixed(1)}h` : `${(h / 24).toFixed(1)}d`;
}

function watchedPidFor(argv) {
  const i = argv.indexOf("--pid");
  const raw = i !== -1 ? argv[i + 1] : process.env.OOLIGO_LANE_LOCK_PID;
  const source = i !== -1 ? "--pid" : "OOLIGO_LANE_LOCK_PID";
  if (raw !== undefined && raw !== "") {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
      err(`${source} needs a positive integer, got ${JSON.stringify(raw)}`);
      process.exit(2);
    }
    return { pid: n, source, trusted: true };
  }
  // Fallback: recorded for diagnostics only. See the header — ppid is durable under PowerShell but not
  // under Git Bash, so it must never be allowed to make a lock look stale.
  if (Number.isInteger(process.ppid) && process.ppid > 0) {
    return { pid: process.ppid, source: "parent process, unverified", trusted: false };
  }
  return { pid: process.pid, source: "this process, unverified", trusted: false };
}

function makePayload(lane, watched, stolenFrom) {
  const payload = {
    lane,
    pid: watched.pid,
    pidTrusted: watched.trusted,
    image: (process.platform === "win32" && tasklistImage(watched.pid)) || basename(process.execPath),
    acquiredAt: new Date().toISOString(),
    token: `${process.pid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    host: hostname(),
    tree: ROOT,
    acquiredBy: { pid: process.pid, watching: watched.source, cwd: process.cwd() },
  };
  if (stolenFrom) payload.stolenFrom = stolenFrom;
  return payload;
}

function confirmOurs(payload) {
  const res = readLock();
  return res.state === "held" && res.lock.token === payload.token;
}

const describe = (lock) =>
  `lane=${lock.lane} pid=${lock.pid}${lock.image ? ` (${lock.image})` : ""}${lockPidTrusted(lock) ? "" : " [unwatched]"} since=${lock.acquiredAt}`;

// Everything the staleness decision depends on, in one place.
function judge(res) {
  const lock = res.lock;
  const age = lockAgeMs(res);
  const trusted = lockPidTrusted(lock);
  const live = pidLiveness(lock.pid, lock.image);
  const deadHolder = trusted && !live.alive;
  const tooOld = age > STALE_MS;
  let reason = null;
  if (deadHolder) reason = `holder pid ${lock.pid} is not running — ${live.how}`;
  else if (tooOld) {
    reason = `lock is ${fmtAge(age)} old, past the ${STALE_HOURS}h cap`
      + (trusted ? ` (holder pid ${lock.pid} is still alive: ${live.how})` : " (its pid was never watchable)");
  }
  return { age, trusted, live, stale: Boolean(reason), reason };
}

// ---------------------------------------------------------------- commands

function acquire(lane, argv) {
  const watched = watchedPidFor(argv);
  // A trusted pid that is already dead would produce a lock stale on arrival — the next lane would steal
  // it instantly and we would be back to no mutex at all. Refuse loudly instead.
  if (watched.trusted) {
    const live = pidLiveness(watched.pid, null);
    if (!live.alive) {
      err(`ERROR ${watched.source} ${watched.pid} is not a running process (${live.how}).`);
      err("      Refusing to write a lock that would be stale the moment it is created.");
      err("      PowerShell: --pid $PID | Git Bash: --pid $(cat /proc/$$/winpid), because $$ is an");
      err("      MSYS pseudo-pid that Windows does not know about.");
      return 2;
    }
  }
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (tryCreateSentinel()) {
      const payload = makePayload(lane, watched, null);
      writeLockAtomic(payload);
      if (confirmOurs(payload)) {
        log(`ACQUIRED lane=${lane} pid=${watched.pid} (${watched.source}) lock=${LOCK_PATH}`);
        if (!watched.trusted) {
          log(`      note: no --pid given, so a crash of this lane is only reclaimed by the ${STALE_HOURS}h cap.`);
          log("      for immediate crash recovery pass the runner's pid: PowerShell --pid $PID,");
          log("      Git Bash --pid $(cat /proc/$$/winpid).");
        }
        return 0;
      }
      log("lost a race immediately after claiming; re-evaluating");
      continue;
    }

    const cur = readLock();
    let reason;

    if (cur.state === "free") continue;                       // vanished under us; try to claim again
    if (cur.state === "unreadable") {
      err(`ERROR cannot read ${LOCK_PATH}: ${cur.why} — refusing to guess, not acquiring`);
      return 1;
    }
    if (cur.state === "corrupt") {
      const age = Date.now() - cur.mtimeMs;
      if (age < TORN_GRACE_MS) {
        log(`BUSY lock file is mid-write (${cur.why}, ${fmtAge(age)} old) — another lane is claiming it right now`);
        return 1;
      }
      reason = `lock file is unusable (${cur.why}) and ${fmtAge(age)} old`;
    } else {
      const held = cur.lock;
      const v = judge(cur);
      if (!v.stale) {
        if (held.lane === lane && v.trusted && watched.trusted && held.pid === watched.pid) {
          log(`ALREADY HELD by this run: ${describe(held)} — treating as acquired`);
          return 0;
        }
        log(`BUSY held by ${describe(held)} for ${fmtAge(v.age)} — ${v.live.how}`);
        log(`      not acquiring lane=${lane};`
          + (v.trusted
            ? ` the holder is alive and under the ${STALE_HOURS}h cap`
            : ` its pid is unwatchable, so only the ${STALE_HOURS}h cap can free it (${fmtAge(STALE_MS - v.age)} left)`));
        return 1;
      }
      reason = v.reason;
    }

    // Make sure the lock we judged is still the lock on disk before we replace it.
    const again = readLock();
    if (fingerprint(again) !== fingerprint(cur)) {
      log("lock changed while we were deciding; re-evaluating");
      continue;
    }

    const stolenFrom = cur.state === "held"
      ? { lane: cur.lock.lane, pid: cur.lock.pid, acquiredAt: cur.lock.acquiredAt, reason }
      : { lane: null, pid: null, acquiredAt: new Date(cur.mtimeMs).toISOString(), reason };
    log(`STEALING lock: ${reason}`);
    const payload = makePayload(lane, watched, stolenFrom);
    writeLockAtomic(payload);
    if (confirmOurs(payload)) {
      log(`ACQUIRED lane=${lane} pid=${watched.pid} (${watched.source}) by stealing a stale lock — see stolenFrom in ${LOCK_PATH}`);
      return 0;
    }
    log("lost the race to steal this lock; another lane got there first");
    return 1;
  }
  err(`ERROR lock state kept changing; gave up after ${MAX_ATTEMPTS} attempts`);
  return 1;
}

function release(lane, argv) {
  const watched = watchedPidFor(argv);
  const cur = readLock();

  if (cur.state === "free") {
    err(`ERROR release lane=${lane}: no lock file at ${LOCK_PATH}. Nothing was released — either this lane never acquired, or something already removed the lock.`);
    return 1;
  }
  if (cur.state === "unreadable") {
    err(`ERROR release lane=${lane}: cannot read ${LOCK_PATH} (${cur.why}). Nothing was released.`);
    return 1;
  }
  if (cur.state === "corrupt") {
    err(`ERROR release lane=${lane}: lock file is unusable (${cur.why}). Leaving it in place — a later acquire will steal it. Nothing was released.`);
    return 1;
  }
  if (cur.lock.lane !== lane) {
    err(`ERROR release lane=${lane}: lock is held by ${describe(cur.lock)}. Refusing to release someone else's lock — your lane was most likely stolen from after going stale.`);
    return 1;
  }
  // Only meaningful when both sides watched a real pid; comparing unverified ppids is noise.
  if (lockPidTrusted(cur.lock) && watched.trusted && cur.lock.pid !== watched.pid) {
    log(`WARN release lane=${lane}: lock records pid ${cur.lock.pid}, this run passed pid ${watched.pid}. Releasing on lane-id match — but something re-acquired under your lane id.`);
  }
  try {
    unlinkSync(LOCK_PATH);
  } catch (e) {
    if (e.code !== "ENOENT") {
      err(`ERROR release lane=${lane}: could not remove ${LOCK_PATH}: ${e.code || e.message}`);
      return 1;
    }
    log(`WARN release lane=${lane}: lock disappeared before we removed it`);
  }
  log(`RELEASED lane=${lane} (held since ${cur.lock.acquiredAt}, ${fmtAge(lockAgeMs(cur))})`);
  return 0;
}

function status() {
  const cur = readLock();
  if (cur.state === "free") {
    log(`free (no lock at ${LOCK_PATH})`);
    return 0;
  }
  if (cur.state === "unreadable") {
    log(`UNREADABLE ${LOCK_PATH}: ${cur.why}`);
    return 0;
  }
  if (cur.state === "corrupt") {
    const age = Date.now() - cur.mtimeMs;
    log(`CORRUPT ${LOCK_PATH}: ${cur.why}, ${fmtAge(age)} old`);
    log(age < TORN_GRACE_MS ? "        probably a lock being written right now" : "        the next acquire will steal it");
    return 0;
  }
  const held = cur.lock;
  const v = judge(cur);
  log(`held by ${describe(held)} for ${fmtAge(v.age)} on ${held.host || "?"}`);
  log(`        pid check: ${v.live.how}${v.trusted ? "" : " (advisory only — this pid was never watchable)"}`);
  log(`        ${v.stale
    ? `STALE — the next acquire will steal it: ${v.reason}`
    : `live — acquires refused for up to another ${fmtAge(STALE_MS - v.age)}`}`);
  if (held.stolenFrom) log(`        note: this lock was itself stolen (${held.stolenFrom.reason})`);
  log(`        lock: ${LOCK_PATH}`);
  return 0;
}

function usage() {
  err([
    "usage:",
    "  node scripts/lane-lock.mjs acquire <lane-id> [--pid <n>]   exit 0 acquired, exit 1 someone else holds it",
    "  node scripts/lane-lock.mjs release <lane-id> [--pid <n>]   exit 0 released, exit 1 you did not hold it",
    "  node scripts/lane-lock.mjs status",
    "",
    `lock file:   ${LOCK_PATH}`,
    `stale after: ${STALE_HOURS}h — or immediately once a --pid holder stops running`,
    "--pid:       the lane runner's own long-lived pid. PowerShell: --pid $PID.",
    "             Git Bash: --pid $(cat /proc/$$/winpid) — $$ alone is an MSYS pseudo-pid, not a Windows one.",
    "             Without it the lock is still exclusive, but a crashed lane is only reclaimed by the age cap.",
  ].join("\n"));
  return 2;
}

// ---------------------------------------------------------------- entry

const argv = process.argv.slice(2);
const [cmd, lane] = argv;

let code;
if (cmd === "status") code = status();
else if (cmd === "acquire" || cmd === "release") {
  if (!lane || lane.startsWith("--")) {
    err(`${cmd} needs a lane id, e.g. \`node scripts/lane-lock.mjs ${cmd} translations-de\``);
    code = usage();
  } else code = cmd === "acquire" ? acquire(lane, argv) : release(lane, argv);
} else code = usage();

process.exit(code);
