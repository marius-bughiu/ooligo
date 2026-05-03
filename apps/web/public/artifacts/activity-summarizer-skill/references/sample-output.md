# Sample output — TEMPLATE

> Replace the example below with one or two of your team's best
> historical reports (anonymized). The activity-summarizer skill
> conditions on this file for tone, length, and formatting. Edit
> when you want to nudge the voice — blunter, less hedged, shorter
> bullets, etc.

## Tone calibration notes

- Bullets are one sentence. If you need two sentences, the bullet is
  doing too much.
- Cite the source inline. "Gong call 2026-04-29" beats "according to
  recent activity."
- The suggestion line names a person if possible: "propose a 30-min
  exec brief with their CFO" beats "engage the executive sponsor."
- Avoid hedging adverbs: `seems`, `appears`, `potentially`. The skill
  has the data; either say it or don't include the bullet.

## Example

```markdown
# Week of 2026-04-26 — Sam

## Heating
1. **Acme Robotics** — moved to Proposal after technical evaluator
   joined the demo. Signal: Gong call 2026-04-29, CTO asked about
   SAML rollout timeline and pricing for 200 seats.
2. **Northwind Health** — champion forwarded the security questionnaire
   without prompting. Signal: inbound email 2026-04-30 from
   j.lee@northwind.example with attached SIG Lite.
3. **Globex Logistics** — second meeting set with Director of Ops
   joining. Signal: Calendar event 2026-05-02, three external
   attendees (champion + two new contacts).

## Stuck
1. **Initech Corp** — in Qualification for 38 days (team median: 21).
   Missing: Economic Buyer field empty. Champion (Marcus, Ops Lead)
   has not been able to surface budget owner.
2. **Stark Industries** — in Negotiation for 22 days (team median: 10).
   Missing: Paper Process — procurement timeline never mapped.

## Suggestion for next week
On Initech, ask Marcus directly in Monday's sync: "Who signs off on a
$50k Ops tooling spend this fiscal year?" If he can't name the person,
escalate to a paid pilot path that bypasses procurement.

## Sources
- Salesforce activities: 47 tasks, 12 events, 4 stage changes
- Gong calls: 9 (filtered 3 below 300s)
- Window: 2026-04-26 → 2026-05-02
```

## What a bad sample looks like (for contrast)

The skill should NEVER produce output like this — keep this in the
reference file as a negative example so the model conditions away from it:

```markdown
# Weekly Update

## Things That Are Going Well
- Several deals appear to be progressing
- The rep was active across multiple accounts this week
- Engagement seems strong

## Areas of Focus
- Some deals could use attention
- Consider following up with stale leads

## Suggestion
Continue the great work and keep the momentum going!
```

Failure modes shown above: vague accounts ("several"), hedging
("appears", "seems"), generic suggestion ("keep the momentum"), no
citations, no specifics. The signal rubric and rendering guards in
the skill exist to refuse output like this.

## Last edited

{YYYY-MM-DD}
