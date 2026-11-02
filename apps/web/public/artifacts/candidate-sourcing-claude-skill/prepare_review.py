#!/usr/bin/env python3
"""Format locally cleared candidate excerpts into an unranked evidence worksheet."""
import argparse
import json
from pathlib import Path


def unique_fields(pairs):
    record = {}
    for key, value in pairs:
        if key in record:
            raise ValueError("Duplicate field in JSON input")
        record[key] = value
    return record


def require_fields(record, fields, label):
    if not isinstance(record, dict) or set(record) != set(fields):
        raise ValueError(f"{label} must contain exactly {', '.join(fields)}")


def required_text(value, label):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label} must be nonempty text")
    return value.strip()


def prepare(brief):
    require_fields(brief, ("role", "criterion", "profiles"), "brief")
    role = required_text(brief["role"], "role")
    criterion = required_text(brief["criterion"], "criterion")
    if not isinstance(brief["profiles"], list):
        raise ValueError("profiles must be a list")

    seen = set()
    cards = []
    held = 0
    for position, profile in enumerate(brief["profiles"], start=1):
        label = f"record {position}"
        require_fields(profile, ("id", "use", "source", "excerpt"), label)
        record_id = required_text(profile["id"], f"{label} id")
        if record_id in seen:
            raise ValueError(f"{label} has a duplicate id")
        seen.add(record_id)
        if profile["use"] == "hold":
            held += 1
            continue
        if profile["use"] != "review":
            raise ValueError(f"{label} requires an explicit review or hold marker")
        source, excerpt = profile["source"], profile["excerpt"]
        if not isinstance(source, str) or not isinstance(excerpt, str):
            raise ValueError(f"{label} source and excerpt must be text")
        quoted = bool(excerpt.strip())
        if quoted and not source.strip():
            raise ValueError(f"{label} requires a source for its excerpt")
        cards.append({
            "id": record_id,
            "source": source.strip() or None,
            "excerpt": excerpt if quoted else None,
            "next_step": "verify_quote" if quoted else "request_evidence",
        })
    return {"role": role, "criterion": criterion, "held_count": held, "review_cards": cards}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("brief", type=Path)
    args = parser.parse_args()
    try:
        brief = json.loads(args.brief.read_text(encoding="utf-8"), object_pairs_hook=unique_fields)
        result = prepare(brief)
    except (OSError, ValueError) as error:
        parser.exit(2, f"Input error: {error}\n")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
