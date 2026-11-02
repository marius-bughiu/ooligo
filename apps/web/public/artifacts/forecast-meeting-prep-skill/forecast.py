"""Compare two local pipeline snapshots and print a Markdown meeting briefing."""

import argparse
import csv
from dataclasses import dataclass
from datetime import date
import html
from pathlib import Path
import re
import sys


FIELDS = ("snapshot_date", "rep_id", "opportunity_id", "account", "category", "amount", "currency", "close_date")
CATEGORIES = ("commit", "best_case", "upside")
EXAMPLES = Path(__file__).resolve().parent / "examples"


@dataclass(frozen=True)
class Opportunity:
    account: str
    category: str
    cents: int
    close_date: date


@dataclass(frozen=True)
class Snapshot:
    as_of: date
    rep: str
    deals: dict


def parse_date(value):
    if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", value):
        raise ValueError("dates must use YYYY-MM-DD")
    return date.fromisoformat(value)


def parse_id(value):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,79}", value):
        raise ValueError("IDs must contain 1–80 letters, digits, periods, underscores or hyphens and start with a letter or digit")
    return value


def parse_cents(value):
    if not re.fullmatch(r"[0-9]{1,15}(?:\.[0-9]{1,2})?", value):
        raise ValueError("amount must be nonnegative plain USD with up to 15 integer digits and two decimal places")
    whole, _, fraction = value.partition(".")
    return int(whole) * 100 + int((fraction + "00")[:2])


def read_snapshot(path):
    deals = {}
    as_of = None
    rep = None
    with path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.reader(source, strict=True)
        header = next(reader, [])
        if len(header) != len(FIELDS) or set(header) != set(FIELDS):
            raise ValueError(f"{path.name}: expected exactly these CSV columns: {', '.join(FIELDS)}")
        for values in reader:
            if len(values) != len(header):
                raise ValueError(f"{path.name}, line {reader.line_num}: wrong number of fields")
            row = dict(zip(header, values))
            try:
                row_date = parse_date(row['snapshot_date'])
                row_rep = parse_id(row['rep_id'])
                key = parse_id(row['opportunity_id'])
                if as_of is not None and (row_date != as_of or row_rep != rep):
                    raise ValueError("each snapshot must contain one date and one rep")
                if key in deals:
                    raise ValueError(f"duplicate opportunity_id {key}")
                if row['category'] not in CATEGORIES:
                    raise ValueError("category must be commit, best_case or upside")
                if row['currency'] != 'USD':
                    raise ValueError("only USD is supported")
                account = row['account'].strip()
                if not account or not account.isprintable():
                    raise ValueError("account must be nonempty, printable single-line text")
                deals[key] = Opportunity(account, row['category'], parse_cents(row['amount']), parse_date(row['close_date']))
                as_of, rep = row_date, row_rep
            except ValueError as error:
                raise ValueError(f"{path.name}, line {reader.line_num}: {error}") from error
    if not deals:
        raise ValueError(f"{path.name}: an empty file cannot establish a rep or snapshot date")
    return Snapshot(as_of, rep, deals)


def dollars(cents, signed=False):
    whole, fraction = divmod(abs(cents), 100)
    sign = '-' if cents < 0 else '+' if signed and cents > 0 else ''
    return f"{sign}${whole:,}" + (f".{fraction:02d}" if fraction else '')


def label(account):
    # Account names are data. Escape Markdown constructs and raw HTML in output.
    return re.sub(r"([\\`*_\[\]|~])", r"\\\1", html.escape(account, quote=False))


def movement(before, after):
    if before is None:
        return [f"appears in current snapshot ({after.category}, {dollars(after.cents)}, close {after.close_date})"], ["What brought this opportunity into the current export?"]
    if after is None:
        return [f"absent from current snapshot (previously {before.category}, {dollars(before.cents)})"], ["Check the CRM status and export scope. What explains the absence?"]
    facts, questions = [], []
    if before.category != after.category:
        facts.append(f"category {before.category} → {after.category}")
        questions.append("Which customer evidence supports the category change?")
    if before.cents != after.cents:
        facts.append(f"amount {dollars(before.cents)} → {dollars(after.cents)}")
        questions.append("Which scope or pricing detail explains the amount change?")
    if before.close_date != after.close_date:
        days = (after.close_date - before.close_date).days
        facts.append(f"close {before.close_date} → {after.close_date} ({days:+d} days)")
        questions.append("Who confirmed the revised close date, and what is the next milestone?")
    if before.account != after.account:
        facts.append(f"account label {label(before.account)} → {label(after.account)}")
        questions.append("Confirm that the stable opportunity ID still refers to the intended account.")
    return facts, questions


def briefing(prior, current):
    if prior.rep != current.rep:
        raise ValueError("snapshots must describe the same rep")
    gap = (current.as_of - prior.as_of).days
    if not 1 <= gap <= 10:
        raise ValueError("current snapshot must be 1–10 days after prior snapshot")
    lines = ["# Weekly forecast meeting prep", "", f"Rep `{prior.rep}` · {prior.as_of} → {current.as_of}", "",
             "## Pipeline by category (USD)", "", "| Category | Previous | Current | Change |", "|---|---:|---:|---:|"]
    for category in CATEGORIES:
        old = sum(d.cents for d in prior.deals.values() if d.category == category)
        new = sum(d.cents for d in current.deals.values() if d.category == category)
        lines.append(f"| {category} | {dollars(old)} | {dollars(new)} | {dollars(new - old, signed=True)} |")
    lines += ["", "## Changed opportunities", ""]
    questions = []
    unchanged = 0
    for key in sorted(prior.deals.keys() | current.deals.keys()):
        before, after = prior.deals.get(key), current.deals.get(key)
        facts, prompts = movement(before, after)
        if not facts:
            unchanged += 1
            continue
        lines.append(f"- `{key}` · {label((after or before).account)} · " + " · ".join(facts) + ".")
        questions.extend(f"- `{key}` {prompt}" for prompt in prompts)
    if not questions:
        lines.append("No opportunity fields changed.")
    lines += ["", f"{unchanged} unchanged {'opportunity' if unchanged == 1 else 'opportunities'}.", "", "## Questions for the rep", ""]
    lines.extend(questions or ["No movement questions from this pair of snapshots."])
    lines += ["", "The totals describe the supplied open pipeline. Confirm causes and outcomes with the rep before using the briefing."]
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("demo", help="verify the fictional snapshots against the expected briefing and print it")
    compare = commands.add_parser("compare", help="compare a pair of local, authorized CSV exports")
    compare.add_argument("previous", type=Path)
    compare.add_argument("current", type=Path)
    args = parser.parse_args()
    if args.command == "demo":
        previous, current = EXAMPLES / 'pipeline-2026-10-16.csv', EXAMPLES / 'pipeline-2026-10-23.csv'
    else:
        previous, current = args.previous, args.current
    try:
        output = briefing(read_snapshot(previous), read_snapshot(current))
        if args.command == "demo" and output != (EXAMPLES / 'expected-briefing.md').read_text(encoding='utf-8'):
            raise ValueError("demo output differs from examples/expected-briefing.md")
    except (ValueError, OSError, csv.Error) as error:
        parser.exit(2, f"Input or fixture error: {error}\n")
    sys.stdout.write(output)


if __name__ == '__main__':
    main()
