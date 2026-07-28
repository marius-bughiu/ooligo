# Evidence pack index

Every control graded `evidenced` needs a citation from this pack: a file path or URL plus the passage that does the work. A control with no artifact is `unevidenced`, and `unevidenced` sorts into remediation next to real gaps — because the difference between "we do this" and "we can show we do this" only matters on the day someone asks, and on that day there is no time to build the artifact.

## Part A — Artifact inventory

Fill in the path or URL. Leave `MISSING` where it is missing; that is the point of the exercise.

| # | Artifact | Satisfies | Side | Location |
|---|---|---|---|---|
| 1 | Published AEDT bias-audit summary page | NYC LL 144 publication + metrics | employer | REPLACE_URL |
| 2 | Independent auditor's report and engagement letter | NYC LL 144 audit + independence | employer | REPLACE_PATH |
| 3 | Candidate AEDT notice text, with the send trigger documented | NYC LL 144 notice + contents | employer | REPLACE_PATH |
| 4 | Timestamp export: notice sent vs tool first run, per candidate | NYC LL 144 10-business-day lead | employer | REPLACE_PATH |
| 5 | Illinois video notice + explanation text | 820 ILCS 42 Section 5 | employer | REPLACE_PATH |
| 6 | Consent capture records with timestamps | 820 ILCS 42 Section 5 ordering | employer | REPLACE_PATH |
| 7 | Sub-processor list for video and audio | 820 ILCS 42 Section 10 sharing limit | employer | REPLACE_PATH |
| 8 | Deletion runbook naming downstream recipients and backups | 820 ILCS 42 destruction, 30 days | employer | REPLACE_PATH |
| 9 | Sole-reliance determination memo | 820 ILCS 42 reporting trigger | employer | REPLACE_PATH |
| 10 | Illinois HRA AI-use notice text | IL HRA as amended | employer | REPLACE_PATH |
| 11 | ADS records retention schedule showing four years | CA FEHA ADS | employer | REPLACE_PATH |
| 12 | Anti-bias testing results, if any were run | CA FEHA ADS defense | employer | REPLACE_PATH |
| 13 | Vendor DPA with retraining and access terms | supports 7, 8, 11 | vendor | REPLACE_PATH |
| 14 | Vendor's own bias-audit summary | vendor-side rows only | vendor | REPLACE_URL |
| 15 | Data-retention policy published on the careers site | NYC LL 144 disclosure on request | employer | REPLACE_URL |

**Row 14 cannot satisfy rows 1 or 2.** A vendor's audit of its model is not the employer's audit of the employer's use. The NYC duty sits with the employer or employment agency. Vendors sell attestation packets that read as if they close the employer's obligation; they close the vendor's.

## Part B — Notice scaffolding

Adapt; do not paste. The bracketed values are the ones that make a notice specific enough to be worth anything, and a notice that omits them is the most common `gap` finding.

### NYC AEDT notice — at least 10 business days before use

> We use an automated employment decision tool to help evaluate applications for [JOB TITLE]. The tool assesses the following job qualifications and characteristics: [LIST THEM — the actual assessed dimensions, not "fit"]. The results of our most recent bias audit and our data-retention policy are published at [URL]. You may request an alternative selection process or an accommodation by contacting [ADDRESS]. To request information about the data we collect for this tool, its source, and our retention policy, contact [ADDRESS]; we will respond within 30 days.

Send it on the application-confirmation event, not on the assessment invite. Invite-time sending is what fails the 10-business-day count on fast-moving reqs, and it is the single most common lead-time failure.

### Illinois video interview — notice, explanation, and consent, all before the interview

> This interview will be recorded and may be analyzed by artificial intelligence to consider your fitness for [JOB TITLE]. How it works: [PLAIN-LANGUAGE EXPLANATION — what the system does with the recording]. The general types of characteristics it uses to evaluate applicants are: [LIST THEM]. Your video will be shared only with people whose expertise or technology is necessary to evaluate your fitness for this position. You may request that we delete your interview at any time by contacting [ADDRESS]; we will delete it, and instruct everyone who received a copy to delete theirs including backups, within 30 days.
>
> [ ] I consent to being evaluated by artificial intelligence as described above.

The consent checkbox must be reachable and actionable before the recording starts. If a candidate can begin recording without passing the consent control, that is a `counsel-review` at best.

### Illinois HRA AI-use notice

Notice mechanics are in open rulemaking as of the `checked:` date in `1-jurisdiction-matrix.md`. Give notice that AI is used in the decision, keep the text versioned, and grade the mechanics row as `counsel-review` until the rules land.

## Part C — Evidence hygiene

- **Version the notice text and keep the diffs.** The question is never "what does the notice say," it is "what did it say on the day this candidate applied."
- **Timestamps beat policies.** A policy saying notice goes out 10 days ahead is weaker evidence than an export showing it did.
- **Keep the negative determinations.** The memo explaining why a tool is out of scope is an artifact. An undocumented determination reads later as an oversight.
- **Watch the retention conflict.** The four-year California floor and a candidate's Illinois deletion request point opposite ways on the same record. Decide it with counsel once, write the decision down, and cite that memo rather than re-deciding per request.
