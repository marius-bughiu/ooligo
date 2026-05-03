# Channel-specific query formats

This file documents how to author queries for each of the three supported channels. The Boolean search builder skill uses these conventions; if the user wants to swap or add a channel, this file is what changes.

Per-channel notes are written as the channel's own quirks would be: hireEZ's Boolean is permissive, Google X-ray is brittle, Juicebox PeopleGPT prefers natural language. The skill respects each.

## hireEZ

### Boolean operators

- `AND`, `OR`, `NOT` — uppercase, with parentheses for grouping.
- `"exact phrase"` — double quotes for multi-word matches.
- `*` wildcard — supported but degrades ranking; avoid.
- Field qualifiers: hireEZ exposes title, skill, location, education, current-company, past-company. Use the per-field input rather than cramming everything into one Boolean string.

### Quirks

- Synonym expansion is server-side. hireEZ runs its own synonym map; if you list "Senior Engineer" it will silently include "Sr. Engineer" and "Sr Engineer." Don't double-count.
- Location goes in the structured location filter, NOT in the Boolean. Free-text location in the Boolean returns inconsistent results.
- Boolean strings over ~15 terms degrade relevance ranking. Cap synonyms at 5 per dimension; if you need more, split into multiple saved searches.

### Output shape from the skill

```
Title field:
  "Senior Backend Engineer" OR "Staff Engineer" OR "Senior Software Engineer"

Skill field:
  ("Go" OR "Golang" OR "Rust") AND ("distributed systems" OR "microservices" OR "event-driven")

Exclude field:
  "contractor" OR "freelance"

Location filter (structured):
  Time zones: US Pacific Time, US Mountain Time
  Remote OK: yes
```

## Google X-ray

### Operators

- `site:linkedin.com/in` — restricts to LinkedIn member profiles.
- `site:github.com` — for engineering roles where the GitHub signal is stronger than LinkedIn.
- `"exact phrase"` — double quotes work.
- `OR` — uppercase, otherwise treated as a literal.
- `-term` — exclusion.
- `inurl:` — useful for narrowing to specific subdomains.

### Quirks

- LinkedIn's `robots.txt` excludes a large share of profiles from Google indexing. X-ray surfaces a fraction of the actual LinkedIn population (estimate: 10-30% of US member profiles are X-ray-indexable).
- Google index lag on profile updates is 1-3 months. Recently-updated profiles are systematically under-represented.
- Result page count is unreliable above 500. Above ~50 page-fetches per query the source IP starts seeing CAPTCHAs; production sourcing through this channel violates LinkedIn ToS.
- The skill annotates X-ray output with a "manual use only" warning and a recommended max of 50 page-fetches per query.

### Output shape from the skill

```
⚠️ Manual use only. Cap at ~50 result-page fetches per query.

site:linkedin.com/in "Senior Backend Engineer" OR "Staff Engineer"
("Go" OR "Golang" OR "Rust") "distributed systems"
-"contractor" -"freelance"
```

## Juicebox PeopleGPT

### Format

- Natural-language prompt that names the role, level, and key signals in plain English.
- Structured filters (level, location, time zone, current-company size band) used in addition to the prompt — these are reliable.
- Anti-signals are described in the prompt ("exclude contractors and freelancers") rather than encoded as Boolean NOT.

### Quirks

- PeopleGPT runs its own synonym expansion. Listing 5+ synonyms in the prompt produces over-narrow pools; the model interprets the listing as a tighter intent than a single canonical term plus reliance on its own expansion.
- Behavioral signals ("led a migration") are picked up loosely — PeopleGPT will surface candidates whose profiles describe ownership work, but exact-phrase matching is not guaranteed.
- Pool sizes tend to be tighter than hireEZ for the same intake (estimate: ~50% of hireEZ volume).

### Output shape from the skill

```
Find Senior Backend Engineers in the US Pacific or Mountain time zones
who own production Go or Rust services in distributed systems contexts.
Prefer candidates who have led a service rewrite or migration with named
outcomes. Exclude contractors and freelancers. Senior IC scope.

Structured filters:
  Level: Senior IC
  Location: US Pacific, US Mountain
  Currently employed: yes
  Profile updated within: 90 days
```

## Adding a new channel

To add a fourth channel (e.g. SeekOut, AmazingHiring, Loxo):

1. Add a section to this file with the operators, quirks, and output shape.
2. Update the `channels` parameter in `SKILL.md` to include the new channel name.
3. Update the example output in `SKILL.md` to show what a query for the new channel looks like.

The skill will pick up the new channel automatically once it can read the format from this file.
