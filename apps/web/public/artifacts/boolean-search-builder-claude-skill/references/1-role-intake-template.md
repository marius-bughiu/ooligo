# Role intake template

Copy this file to your sourcing repo as `intake/<role-slug>.md` and fill in every section. The Boolean search builder skill reads this shape; deviations are surfaced as missing fields rather than guessed.

A complete intake takes 20-40 minutes per net-new role. For a role family you've sourced before, you usually start from the previous intake and edit 2-3 fields.

---

## Role title and level

- **Posted title:** {e.g. Senior Backend Engineer (Distributed Systems)}
- **Internal level:** {e.g. L5 / Senior IC / IC4 — be specific to your firm's ladder}
- **Reports to:** {Engineering Manager / Director / etc.}

## Must-haves (binary, used as AND in queries)

These are non-negotiable. If a candidate doesn't have one of these, they don't progress, regardless of strength on other dimensions. Limit to 4-6 — more than that and the pool collapses.

For each must-have, write:
- The capability or experience as the candidate would describe it (resume voice, not internal jargon).
- The minimum threshold (years, scope, scale).
- Why it's a must-have (the failure mode if you hire without it).

Example:
- **Production Go or Rust experience, 3+ years.** This role owns latency-critical services. Without production Go/Rust, ramp time exceeds quarter and the on-call rotation can't absorb a junior pattern.
- **Owned a distributed-system migration end-to-end.** Sequencing changes across services with rollback plans is the daily work; without ownership signal, the candidate hasn't internalized the failure modes.

(your must-haves here)

## Nice-to-haves (additive, used to rank, NOT to filter)

Signals that increase confidence but don't gate. Limit to 5-8.

Example:
- Open-source contribution to a distributed-system project (Kafka, Temporal, NATS, etc.)
- Speaker / writer presence (conference talk, technical blog) — signals communication ability under scrutiny.
- Prior experience at a similar-scale company (10K-100K req/sec).

(your nice-to-haves here)

## Anti-signals (used as NOT — exact match, not expanded)

Things that, when present, lower confidence. Anti-signals are NOT clauses, not silent disqualifications. The skill uses them exact-match to avoid over-eliminating.

Example:
- Resume describes job-hopping (>3 jobs in 4 years without an explanation in the application).
- "Full-stack" as the only architectural framing — this role needs a depth signal, not a breadth one.
- Contractor / freelance current title (W-2 candidates only for this opening).

(your anti-signals here)

## Location policy

- **Geography:** {US Pacific Time + US Mountain Time / EU including UK / EMEA / etc.}
- **Remote / hybrid / onsite:** {fully remote / 2 days in {office} / fully onsite}
- **Work authorization:** {US citizen or green card / will sponsor H-1B / EU work auth required / etc.}
- **Time-zone overlap requirement:** {minimum N hours overlap with {office time zone}}

## Compensation band (for response-likelihood calibration)

- **Base:** {$X-$Y}
- **Equity:** {early-stage % / RSU $ value at strike / not applicable for cash-only roles}
- **Bonus / on-target earnings:** {if applicable}

The Boolean search builder does not include comp in queries (NYC LL 32-A, CO/CA/WA pay-transparency laws — comp belongs in the public posting, not in the search query). It uses the band only to calibrate the response-likelihood synonyms.

## Hiring manager intent (free text, ≤200 words)

What is the hiring manager actually trying to solve? "We need three senior engineers" is the requisition. "We're rebuilding the routing layer because the current synchronous design caps throughput at 8K req/sec and the next quarter's traffic forecast pushes 15K" is the intent.

The intent helps the synonym expansion in step 2: synonyms grounded in the actual problem catch better candidates than synonyms grounded in the title.

## Channels available

- [ ] hireEZ (account, plan tier, monthly query quota)
- [ ] Juicebox PeopleGPT (account, plan)
- [ ] LinkedIn Recruiter (seats available)
- [ ] Public X-ray only (no paid sourcing tool — the X-ray query is the primary output)

The skill generates queries for all three by default; if a channel is unavailable, set the `channels` skill parameter on invocation.
