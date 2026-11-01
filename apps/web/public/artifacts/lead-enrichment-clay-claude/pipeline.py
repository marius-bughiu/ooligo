#!/usr/bin/env python3
"""Offline evidence checks and deterministic scoring. No network or AI client."""
import argparse
from collections import Counter
from datetime import date
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
FIELDS = ("industry", "headcount", "region", "value_prop")


def load_jsonl(path):
    rows = []
    for line_no, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if line.strip():
            try:
                row = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_no}: invalid JSON") from exc
            if not isinstance(row, dict):
                raise ValueError(f"{path}:{line_no}: expected an object")
            rows.append(row)
    return rows


def indexed(rows, label):
    result = {}
    for row in rows:
        key = row.get("row_id")
        if not isinstance(key, str) or not key.strip() or key in result:
            raise ValueError(f"{label}: missing, invalid or duplicate row_id")
        result[key] = row
    return result


def check_rubric(rubric):
    required = {"rubric_id", "configured", "industries", "regions", "headcount_min",
                "headcount_max", "threshold", "max_source_age_days"}
    if not isinstance(rubric, dict) or set(rubric) != required:
        raise ValueError("rubric: use the exact keys in rubric.example.json")
    if rubric["configured"] is not True or not isinstance(rubric["rubric_id"], str) or not rubric["rubric_id"].strip():
        raise ValueError("rubric: set configured=true and a nonempty rubric_id after review")
    for key in ("industries", "regions"):
        values = rubric[key]
        if not isinstance(values, list) or not values or any(not isinstance(v, str) or not v.strip() for v in values):
            raise ValueError(f"rubric: {key} needs a nonempty string list")
    for key in ("headcount_min", "headcount_max", "threshold", "max_source_age_days"):
        if type(rubric[key]) is not int or rubric[key] < 0:
            raise ValueError(f"rubric: {key} must be a nonnegative integer")
    if rubric["headcount_min"] > rubric["headcount_max"] or rubric["threshold"] > 10:
        raise ValueError("rubric: invalid headcount range or threshold outside 0–10")


def check_lead(lead, as_of):
    if set(lead) != {"row_id", "domain", "fetch_status", "sources"}:
        raise ValueError(f"{lead.get('row_id')}: lead keys do not match the documented contract")
    domain = lead["domain"]
    if not isinstance(domain, str) or not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?", domain) or "." not in domain:
        raise ValueError(f"{lead['row_id']}: domain must be a bare hostname")
    if lead["fetch_status"] not in ("ok", "unreachable") or not isinstance(lead["sources"], list):
        raise ValueError(f"{lead['row_id']}: invalid fetch_status or sources")
    sources = {}
    for source in lead["sources"]:
        if not isinstance(source, dict) or set(source) != {"source_id", "url", "text", "checked_at"}:
            raise ValueError(f"{lead['row_id']}: invalid source fields")
        sid = source["source_id"]
        if not isinstance(sid, str) or not sid or sid in sources:
            raise ValueError(f"{lead['row_id']}: missing or duplicate source_id")
        if not isinstance(source["text"], str) or not source["text"].strip() or not isinstance(source["url"], str):
            raise ValueError(f"{lead['row_id']}: source text and URL are required")
        try:
            url = urlsplit(source["url"])
            checked = date.fromisoformat(source["checked_at"])
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{lead['row_id']}: invalid source URL or date") from exc
        if url.scheme not in ("https", "http") or not url.hostname or checked > as_of:
            raise ValueError(f"{lead['row_id']}: source must have an HTTP(S) URL and nonfuture checked_at")
        sources[sid] = source
    return sources


def evidence_errors(extraction, sources):
    errors = []
    if not isinstance(extraction, dict) or set(extraction) != {"row_id", *FIELDS, "evidence"}:
        return ["extraction fields do not match extraction.schema.json"]
    evidence = extraction["evidence"]
    if not isinstance(evidence, dict) or set(evidence) != set(FIELDS):
        return ["evidence must contain exactly industry, headcount, region and value_prop"]
    for field in FIELDS:
        value, citation = extraction[field], evidence[field]
        if value is None:
            if citation is not None:
                errors.append(f"{field}: null value requires null evidence")
            continue
        if field == "headcount":
            valid_type = type(value) is int and value >= 0
        else:
            valid_type = isinstance(value, str) and bool(value.strip())
        if not valid_type:
            errors.append(f"{field}: invalid value type")
            continue
        if not isinstance(citation, dict) or set(citation) != {"source_id", "quote"}:
            errors.append(f"{field}: a source_id and literal quote are required")
            continue
        sid, quote = citation["source_id"], citation["quote"]
        if not isinstance(sid, str) or sid not in sources or not isinstance(quote, str) or not quote.strip():
            errors.append(f"{field}: missing source or quote")
            continue
        if quote not in sources[sid]["text"]:
            errors.append(f"{field}: quote is not present verbatim in the supplied source")
        if field == "headcount":
            numeric_quote = quote.replace(",", "")
            has_range = re.search(r"\d+(?:\.\d+)?\s*(?:[-–—]|to)\s*\d", numeric_quote, re.IGNORECASE)
            supported = not has_range and re.search(r"(?<![\d.])" + str(value) + r"(?!\d|\.\d)", numeric_quote) is not None
        elif field in ("industry", "region"):
            supported = re.search(r"(?<!\w)" + re.escape(value) + r"(?!\w)", quote, re.IGNORECASE) is not None
        else:
            supported = value.casefold() in quote.casefold()
        if not supported:
            errors.append(f"{field}: extracted value is not present in its quote")
    return errors


def evaluate(lead, extraction, rubric, as_of, mode):
    sources = check_lead(lead, as_of)
    output = {
        "row_id": lead["row_id"], "domain": lead["domain"], "status": "needs_review",
        "icp_fit_score": None, "score_reason": "", "opener_draft": None,
        "validation_errors": [], "sources": [], "review_required": True,
        "rubric_id": rubric["rubric_id"], "evaluated_at": as_of.isoformat(), "mode": mode,
    }
    if lead["fetch_status"] == "unreachable":
        output.update(status="unreachable", score_reason="Upstream input reports an unreachable source; no fetch was attempted here.")
        return output
    if extraction is None:
        output["score_reason"] = "No extraction supplied."
        return output
    errors = evidence_errors(extraction, sources)
    if errors:
        output.update(status="invalid_evidence", score_reason="Extraction failed the local contract checks.", validation_errors=errors)
        return output
    cited_ids = sorted({c["source_id"] for c in extraction["evidence"].values() if c is not None})
    output["sources"] = [{key: sources[sid][key] for key in ("source_id", "url", "checked_at")} for sid in cited_ids]
    stale = [sid for sid in cited_ids if (as_of - date.fromisoformat(sources[sid]["checked_at"])).days > rubric["max_source_age_days"]]
    if stale:
        output["score_reason"] = "Source age exceeds configured limit: " + ", ".join(stale)
        return output
    missing = [field for field in FIELDS if extraction[field] is None]
    if missing:
        output["score_reason"] = "Missing supported fields: " + ", ".join(missing)
        return output
    points = {
        "industry": 4 if extraction["industry"].casefold() in {s.casefold() for s in rubric["industries"]} else 0,
        "headcount": 3 if rubric["headcount_min"] <= extraction["headcount"] <= rubric["headcount_max"] else 0,
        "region": 3 if extraction["region"].casefold() in {s.casefold() for s in rubric["regions"]} else 0,
    }
    score = sum(points.values())
    output["icp_fit_score"] = score
    output["score_reason"] = f"industry {points['industry']}/4 + headcount {points['headcount']}/3 + region {points['region']}/3; threshold {rubric['threshold']}/10"
    if score < rubric["threshold"]:
        output["status"] = "below_threshold"
        return output
    # This is a fixed quoted-source template, not model-generated personalization.
    draft = f"Your site says, “{extraction['value_prop']}” Would a conversation about that work be useful?"
    if len(draft.split()) > 50:
        output["score_reason"] += "; quoted template exceeds 50 words, shorten manually without changing the fact"
        return output
    output.update(status="ready_for_review", opener_draft=draft)
    return output


def run(leads, extractions, rubric, as_of, mode="validated_extraction"):
    check_rubric(rubric)
    lead_map = indexed(leads, "leads")
    extraction_map = indexed(extractions, "extractions")
    if set(extraction_map) - set(lead_map):
        raise ValueError("extractions contain row_ids absent from leads")
    return [evaluate(lead, extraction_map.get(lead["row_id"]), rubric, as_of, mode) for lead in leads]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("demo", help="check 20 synthetic fixtures against expected output; no API calls")
    validate = commands.add_parser("validate", help="validate saved extraction JSONL and emit scored JSONL")
    validate.add_argument("--leads", required=True)
    validate.add_argument("--extractions", required=True)
    validate.add_argument("--rubric", required=True)
    validate.add_argument("--as-of", required=True, help="evaluation date YYYY-MM-DD; does not claim a fresh fetch")
    args = parser.parse_args()
    try:
        if args.command == "demo":
            output = run(load_jsonl(ROOT / "examples/leads.jsonl"), load_jsonl(ROOT / "examples/extractions.jsonl"),
                         json.loads((ROOT / "rubric.example.json").read_text()), date(2026, 11, 1), "offline_demo")
            expected = load_jsonl(ROOT / "examples/expected-output.jsonl")
            if output != expected:
                raise ValueError("demo output differs from checked-in expected output")
            print(json.dumps({"result": "PASS", "rows": len(output), "statuses": dict(sorted(Counter(r["status"] for r in output).items())),
                              "network_calls": 0, "model_calls": 0, "note": "Synthetic fixture validation only; no live integration tested."}, indent=2))
        else:
            output = run(load_jsonl(args.leads), load_jsonl(args.extractions), json.loads(Path(args.rubric).read_text()), date.fromisoformat(args.as_of))
            for row in output:
                print(json.dumps(row, ensure_ascii=False))
        return 0
    except (ValueError, OSError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
