---
name: candidate-personalization-at-scale
description: Personalize outreach messages for a sourced candidate list using LinkedIn profile data, GitHub activity, and job description signals. Returns a personalized subject line and first paragraph for each candidate, grounded only in verified public information. Use for sourced outreach at scale — not for inbound applicants, not for roles where personalization can expose protected-class proxies, and not when no public signal exists for the candidate.
---

# Candidate personalization at scale

## When to invoke

Invoke when you have a sourced list of candidates (from Gem, LinkedIn Recruiter, or a CSV export from any sourcing tool) and want to write a personalized first outreach that references something real about each person — a recent project, a company they worked at, a specific skill in their GitHub — rather than sending a mail-merge template that reads like a mail-merge template.

The skill takes a candidate row (name, title, current company, LinkedIn URL, and optionally GitHub handle and the role's JD) and returns a personalized subject line and a 2-3 sentence opening paragraph. The personalization is grounded only in public signals the skill can verify — it never invents details. If no qualifying signal exists for a candidate, the skill returns a clean generic fallback rather than making one up.

Typical entry points:

- A **Gem sequence** where the first touchpoint is personalized per-candidate using this skill before bulk enrollment.
- A **recruiter manual workflow** where the sourcer pastes a CSV, gets personalized drafts back, reviews and edits, then sends.
- A **script over a LinkedIn export** that runs the skill per row and writes the personalized draft to a new column alongside the source data.

Do NOT invoke this skill for:

- **Inbound applicants.** Personalization for applicants should reference their application, not their public profile — a different context and a different skill.
- **Candidates where the only available signal is demographic.** If the only public signal is a name, a photo, or a school associated with a specific demographic group, the skill returns a generic fallback. Do not modify the prompt to override this. See the protected-class proxy guard.
- **Roles where mentioning specific public projects could be legally sensitive** (defense clearance roles, certain financial regulatory roles). The skill generates outreach grounded in public information; if your compliance team has restrictions on using public profile data in hiring communications, don't use this skill without legal sign-off.
- **Mass volume above 500 candidates in a single run without a human review step.** At that volume, errors compound and context-free automation feels automated. Build in a sample-review step.

## Inputs

Required:

- `candidate` — object with fields: `name` (string), `current_title` (string), `current_company` (string), `linkedin_url` (string). Minimum useful input. More fields narrow hallucination risk.
- `jd` — string or path. The job description for the role being sourced. Used to identify which candidate signals are relevant to this specific role. Without the JD, the skill cannot discriminate between a signal that matters for this job and one that does not.

Optional:

- `github_handle` — string. If provided, the skill uses public repository activity (pinned repos, recent commit language, README content) as a personalization source. More specific than LinkedIn for technical roles.
- `candidate_notes` — string. Any recruiter notes about the candidate that should inform the outreach (e.g., "referred by Jane Doe," "spoke at PyConf last year"). These are incorporated as first-priority signals.
- `personalization_config` — path to or inline contents of `references/1-personalization-config.md`. Contains the tone register, maximum message length, fallback template, and the fabrication guard thresholds. If omitted, the skill uses the defaults.
- `batch_candidates` — array of candidate objects. For batch runs, pass the full list. The skill processes each in sequence and returns a parallel array of `{candidate_id, subject_line, opening_paragraph, signal_used, confidence}` objects.

## Reference files

Load these before first use. The config file is the main point where your team's tone and guard thresholds are set.

- `references/1-personalization-config.md` — tone register, message length cap, fallback template, fabrication guard thresholds, and the protected-class proxy field list. Replace the placeholder rows with your org's actual tone guidelines and any fields your legal or HR team has flagged.
- `references/2-signal-hierarchy.md` — defines which signal types the skill prefers when multiple are available, and the minimum specificity each signal type must meet to qualify as a personalization hook. Adjust if your team sources differently.
- `references/3-sample-outputs.md` — literal examples of skill output for 3 fictional candidates (one with strong GitHub signal, one with LinkedIn-only signal, one with insufficient signal triggering the generic fallback). Use when reviewing outputs for quality and when wiring downstream sequence enrollment.

## Method

The skill runs these steps in order.

### 1. Protected-class proxy check

Before any personalization, run a field-level check against the protected-class proxy list in `references/1-personalization-config.md`. Default checks: photo URL, inferred-gender fields, fields derived from name that encode ethnicity, school names that are proxies for demographic groups (HBCUs, women's colleges) if the role selection is not affirmatively designed to use them. If the only available signals are on the proxy list, the skill returns the generic fallback without attempting personalization.

Why: even well-intentioned personalization that references a school or a community affiliation can constitute disparate treatment if it correlates with a protected class and is used selectively. The check is a hard gate, not a soft warning. Teams that want to use school affiliation for specific affirmative programs should configure that explicitly in the config file and document the legal basis.

### 2. Signal extraction

Extract usable personalization signals from the candidate record. Rank signals per the hierarchy in `references/2-signal-hierarchy.md`. Default ranking: (1) recruiter notes, (2) GitHub public repo/README content, (3) LinkedIn recent experience bullets, (4) LinkedIn headline/summary, (5) LinkedIn current title/company. Extract the top 1-2 signals that are (a) specific enough to be meaningful and (b) relevant to the target JD.

Why a hierarchy rather than "use everything": long personalization that lists every credential reads as a data dump, not as a message from a person who knows the candidate. One specific, relevant signal lands better than three generic ones. The hierarchy enforces discipline.

Minimum specificity threshold: a signal must be specific enough that the candidate would recognize themselves from it (not just their job title and company, which every recruiter can see). "You're a senior engineer at Acme" is not a signal. "Your public Redis cluster management library has 340 stars" is a signal.

If no signal meets the minimum specificity threshold, the skill immediately returns the generic fallback. It does not lower the bar to include non-specific signals.

### 3. JD relevance filter

For each extracted signal, assess whether it is relevant to the target role's JD. A strong Python background is a signal; it is not a relevant personalization hook for a design lead role. Irrelevant signals are dropped even if they are specific.

Why: signaling that you researched a candidate but then referencing something unrelated to the role they're being considered for reads as copy-paste. Worse, it signals that the recruiter read the profile but did not understand what the role needs.

### 4. Fabrication guard

Before drafting, verify that each signal used can be traced to a specific field in the input data. The skill does not infer signals that are not explicitly present. "You seem to care about distributed systems" based on two vague LinkedIn bullets is an inference, not a signal. If the candidate mentioned "distributed systems" in a project title or a specific role description, that is a signal.

Why explicit verification: the most common personalization failure is a message that sounds specific but is based on an inference that is plausible but wrong. "I noticed you've been leading the data infrastructure rebuild at Acme" — if this is based on one vague bullet and the ATS doesn't have confirmation, the candidate reads it as flattery that missed the mark. Trust breaks immediately.

### 5. Draft generation

Write the subject line and 2-3 sentence opening paragraph. Rules:

- Subject line: specific to the candidate's signal, not to the role title. "Re: your Redis management library" outperforms "Senior Engineer opportunity at [Company]" in open rate.
- Opening paragraph: reference the signal in sentence 1, connect it to why it's relevant to the role in sentence 2, and state the ask (a brief conversation) in sentence 3. Three sentences. No sell copy in the first touchpoint.
- Tone: match the register in `references/1-personalization-config.md`. Default: direct, professional, no exclamation marks, no "Hope this finds you well."

### 6. Confidence scoring

Emit a confidence score (high / medium / low) based on signal quality:

- **high** — at least one specific, JD-relevant, recruiter-note-or-GitHub-level signal available.
- **medium** — LinkedIn-level signal available; specific enough to pass the threshold but less verifiable.
- **low** — only fallback used. No qualifying signal.

Recruiters reviewing medium-confidence drafts should verify the personalization claim before sending. Low-confidence drafts are the generic fallback and require recruiter editing before send.

## Output format

Literal output the skill emits for a single candidate:

```markdown
# Personalization — Alex Rivera (alex.rivera@example.com)

**Signal used:** GitHub — pinned repo "pgvector-cache" (1,200 stars), Rust implementation
**Confidence:** high
**JD match:** Infrastructure Engineer (vector search, Rust required)

## Subject line

pgvector-cache + what we're building at [Company]

## Opening paragraph

Your pgvector-cache library — specifically the write-through caching layer you shipped in November — solves exactly the read-latency problem we're hitting at [Company] as we scale our embedding store past 100M vectors. We're hiring for the infrastructure engineer role that owns this layer, and I'd like to share what the next 12 months look like before you see another generic LinkedIn message. Worth 25 minutes?

---

_Signal source: GitHub public repo | Confidence: high | Fallback used: no_
```

For batch input, the skill emits one block per candidate separated by `\n---\n`, plus a summary table (`name | confidence | signal_type | fallback_used`).

Generic fallback output (low confidence):

```markdown
# Personalization — Jordan Lee (jordan.lee@example.com)

**Signal used:** none (fallback)
**Confidence:** low
**Reason:** No specific JD-relevant public signal found. LinkedIn profile is private or headline-only.

## Subject line

[Recruiter: edit before send — no signal available]

## Opening paragraph

I came across your background while sourcing for our [Infrastructure Engineer] role and thought your experience at [Current Company] was worth a direct note. I'd like to share what we're working on — it's a short conversation, and I'll keep it specific to what I think would interest you.

---

_Signal source: fallback | Confidence: low | Recruiter action required before send_
```

## Watch-outs

- **Fabricated personalization details.** The most common failure: a message references something the candidate never did. "I noticed you've been leading the migration to microservices at Acme" — if this was inferred from a title change, not stated explicitly, it is wrong often enough to break trust regularly. **Guard:** the skill only uses signals explicitly present in input fields and marks the signal source in the output. Recruiters review the `Signal source` line before sending. Any signal marked as inferred (not directly quoted from a field) requires human verification.
- **Protected-class proxy exposure.** A personalization hook that mentions an HBCU, a women-in-tech community, or a nationality-coded program can constitute disparate treatment if not universally applied. **Guard:** the skill checks the protected-class proxy list from `references/1-personalization-config.md` before generating any personalization. If a signal is on the list, it is not used. The list is configurable; your legal or HR team should review it annually.
- **Generic fallback blindness.** Recruiters under quota pressure send the generic fallback at low confidence without editing it. The fallback contains placeholder text ("[Recruiter: edit before send]") that occasionally ships verbatim. **Guard:** the skill marks low-confidence output with `Recruiter action required before send` in a visible header. Build a review step into the sequence enrollment workflow that blocks enrollment for low-confidence drafts without a human edit.
- **Signal staleness.** A GitHub repo that was active 3 years ago is not a current signal. A LinkedIn role that ended 18 months ago is not a current-context signal. **Guard:** the skill applies a recency filter — signals older than 24 months are excluded unless the candidate's most recent activity references them. The filter threshold is configurable in `references/1-personalization-config.md`.
