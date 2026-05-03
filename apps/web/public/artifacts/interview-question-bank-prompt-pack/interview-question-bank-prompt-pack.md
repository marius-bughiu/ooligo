# Interview Question Bank — Twelve Prompts for Claude

A pack of structured prompts for generating a tiered interview question library from a role rubric. Paste a rubric, paste a prompt, get a question library tagged with rubric dimensions, anchors, and follow-ups.

## How to use this pack

1. Create a Claude project named `interview-questions-<role-slug>` per role.
2. Drop the role rubric in as project knowledge. Every prompt below assumes the rubric is loaded and reads from it.
3. Save each prompt below as a saved prompt within the project, tagged by tier.
4. Run them in order. Most produce 30-90 second outputs at Sonnet 4.6 speed.
5. Review the outputs. Edit for the firm's voice. The pack delivers a competent starter; the hiring manager owns the final library.

## Rubric input shape

The pack assumes a rubric with this shape (the same shape used by the screening, take-home, and reference workflows):

```json
{
  "role": "Senior Backend Engineer",
  "level": "Senior IC (L5)",
  "dimensions": [
    {
      "id": "skill_match",
      "label": "Production Go or Rust experience and distributed-systems depth",
      "anchors": {
        "1": "...",
        "2": "...",
        "3": "...",
        "4": "...",
        "5": "..."
      }
    },
    ...
  ]
}
```

If the rubric doesn't load, the prompts halt and ask for the rubric file.

---

# Tier 1 — Behavioral

## B1. Three behavioral questions per rubric dimension

```
Role: You are a structured-interviewing question author. Write behavioral
questions in STAR shape (Situation, Task, Action, Result) calibrated to
a specific rubric dimension and anchor.

Context: The rubric is loaded as project knowledge. Every dimension has
five anchors (1-5) describing observable behaviors at increasing depth.

Task: For each dimension in the rubric, write THREE behavioral questions.
Each question must:
  - Probe past behavior (NOT hypothetical — that's tier 2)
  - Be calibrated to discriminate between two named anchors (e.g. "this
    question discriminates anchor 3 from anchor 4")
  - Be answerable in 3-5 minutes by a candidate at the role's level
  - Avoid leading language ("tell me about a successful project" is leading;
    "tell me about a project that didn't go as planned" is neutral)

For each question, output:
  - The question text
  - The dimension it probes
  - The anchors it discriminates between
  - The signal you're listening for in a strong answer
  - The signal you're listening for in a weak answer

Things to avoid:
  - Questions that probe traits ("are you a team player?") — probe behavior.
  - Questions that have a single right answer — questions that probe the
    candidate's framing of the problem.
  - "Culture fit" questions without behavioral anchors.
  - Questions about protected-class topics or proxies (school name, employment
    gaps, family status, etc.).

Output format: Markdown, grouped by dimension, with a level-2 heading per
dimension and a level-3 heading per question.
```

## B2. Drill-down questions for rehearsed answers

```
Role: You are a structured-interviewing question author. The candidate has
clearly prepped the behavioral question — they answered too fluidly, with
named outcomes and a clean STAR structure. The drill-down asks for a
different example, a counter-factual, or a step they skipped.

Context: The rubric is loaded as project knowledge. Tier-1 behavioral
questions (B1 output) are loaded too.

Task: For each B1 question, produce ONE drill-down. Each drill-down must:
  - Ask for a different example, the same dimension ("walk me through a
    different time you had to do that")
  - Or ask for a counter-factual ("what would you have done differently?")
  - Or probe a step the candidate skipped ("what happened between steps 2
    and 3? You moved fast there")
  - Land in 30-60 seconds — drill-downs are quick probes, not new questions

For each drill-down, output:
  - The drill-down question
  - The B1 question it pairs with
  - What the rehearsed-answer pattern looks like (so the panelist knows
    when to use the drill-down)

Things to avoid:
  - Aggressive or interrogator-style framings — the drill-down is curiosity,
    not confrontation
  - Drill-downs that probe a different dimension than the B1 question
  - Drill-downs that ask the candidate to defend their original answer

Output format: Markdown, paired with the B1 question.
```

## B3. Behavioral questions probing failure / negative cases

```
Role: You are a structured-interviewing question author. Standard behavioral
questions probe success. Strong candidates have practiced "tell me about a
weakness" answers ("I'm a perfectionist"). The negative-case questions probe
failure without the rehearsal-friendly framing.

Context: Rubric loaded as project knowledge.

Task: For each rubric dimension, write THREE behavioral questions that probe
the candidate's behavior when they FAILED at the dimension. Each question
must:
  - Probe a real failure ("tell me about a time you misjudged X")
  - NOT be the "weakness" question
  - Calibrate to the rubric — failure on a dimension at level 3 looks
    different from failure at level 5 (a junior engineer's worst day is
    a senior engineer's normal day)
  - Be answerable without the candidate having to disclose a confidential
    incident — the question should work even if the example is sanitized

For each question, output:
  - The question text
  - The dimension it probes
  - The signal of a healthy failure narrative (named cause, named
    correction, named lesson)
  - The signal of an unhealthy narrative (blame on others, no specific
    cause, no lesson, "I'm a perfectionist" pattern)

Things to avoid:
  - Asking the candidate to disclose a regulated or proprietary incident
  - Probing for failures that are protected-class adjacent (gaps, etc.)
  - Stress-test framings ("describe your biggest professional regret")

Output format: Markdown, grouped by dimension.
```

---

# Tier 2 — Situational

## S1. Two situational scenarios per rubric dimension

```
Role: You are a structured-interviewing question author. Situational
questions probe how the candidate would handle a hypothetical, calibrated
to the role's level.

Context: Rubric loaded as project knowledge. Pay attention to the role's
level — Senior IC scope problems are different from Manager scope problems.

Task: For each rubric dimension, write TWO situational scenarios. Each
scenario must:
  - Be calibrated to the role's level (a Senior IC scenario probes
    cross-team-system tradeoffs; a Staff IC scenario probes org-wide
    architectural tradeoffs)
  - Be answerable in 5-8 minutes
  - Have multiple defensible answers — the scenario probes the candidate's
    framing, not a "right answer"
  - Stay grounded in real situations the candidate would plausibly hit —
    not contrived puzzles

For each scenario, output:
  - The scenario as a paragraph (set the stage in 50-100 words)
  - The opening question
  - Two follow-up probes (drill-downs based on the candidate's first
    response — "if they answer X, ask Y; if they answer Z, ask W")

Things to avoid:
  - Trick questions or gotchas
  - Scenarios that depend on the candidate having seen this exact stack
  - Scenarios with a single "smart" answer — those probe pattern-matching,
    not judgment

Output format: Markdown, grouped by dimension.
```

## S2. Listening dimensions per scenario

```
Role: You are a structured-interviewing notetaker primer. Panelists listen
for specific things in each scenario answer. Without the listening
dimensions, panelists collect anecdotes; with them, they collect signal.

Context: Rubric loaded as project knowledge. S1 scenarios loaded too.

Task: For each S1 scenario, list the FIVE answer dimensions the panelist
should listen for. Each dimension must:
  - Be observable in the candidate's spoken answer (NOT something only
    visible in their resume or in code)
  - Map to a specific rubric anchor

For each scenario, output:
  - "What strong answers do" (3 bullets — name the moves, the questions
    asked back, the criteria stated)
  - "What weak answers do" (3 bullets — name the failure patterns: jumping
    to solution without clarifying, ignoring constraints, generic framing)
  - "What to write down" (the concrete notes the panelist takes that anchor
    the debrief later)

Output format: Markdown, paired with each S1 scenario.
```

---

# Tier 3 — Technical / craft deep-dive

## T1. Five deep-dive questions per must-have skill

```
Role: You are a craft-deep-dive question author. The role's rubric names
must-have skills. The deep-dive probes whether the candidate has the skill
at depth — not just whether they can name it.

Context: Rubric loaded as project knowledge. Focus on the must_have skills.

Task: For each must-have skill in the rubric, write FIVE deep-dive
questions. Label each as:
  - SHALLOW: sanity check the candidate has the skill at all (e.g. "explain
    how Go's goroutines differ from threads")
  - DEEP: probe the edges of the skill (e.g. "walk me through the time you
    debugged a goroutine leak — what symptoms led you to suspect it, what
    tools did you use, what was the fix")

The mix should be 1 shallow + 4 deep per skill. The deep questions are
the differentiators; shallow questions are gates.

For each question, output:
  - The question text
  - SHALLOW or DEEP label
  - The skill it probes
  - The signal of a 4-anchor answer (depth, but not edge-case awareness)
  - The signal of a 5-anchor answer (depth + named edge cases + cited
    failure modes the candidate has personally hit)

Things to avoid:
  - Trivia questions ("what's the keyword in Rust for X?") — probe usage,
    not memorization
  - Questions whose answer changes between language versions (probe
    fundamentals, not the latest framework's API)
  - Whiteboard-coding questions framed as discussion — those are a
    different format

Output format: Markdown, grouped by skill.
```

## T2. Three follow-ups per deep-dive question

```
Role: You are a deep-dive follow-up author. The candidate's first answer
to a deep question is correct but surface-level. The follow-ups drill
into the edges of the skill where deeper signal lives.

Context: Rubric loaded. T1 questions loaded.

Task: For each T1 deep question, produce THREE follow-ups. Follow-ups
must:
  - Drill into a specific edge of the skill (the failure mode, the limit
    of the technique, the case where the standard answer breaks)
  - Be open-ended — the candidate constructs the answer
  - Be answerable in 2-4 minutes each
  - Surface the candidate's ability to ENGAGE with not-knowing — partial
    answers are signal too

For each follow-up, output:
  - The follow-up question
  - What edge of the skill it probes
  - What an "I don't know but here's how I'd find out" answer looks like

Things to avoid:
  - Follow-ups that assume the candidate already gave a wrong answer
  - Stacked follow-ups that pile pressure rather than probe depth

Output format: Markdown, paired with each T1 question.
```

## T3. Gap-finding questions per skill

```
Role: You are a gap-finding question author. Most technical questions
probe whether the candidate HAS a skill. Gap-finding probes whether the
candidate notices the LIMIT of the skill — when to use a different tool.

Context: Rubric loaded.

Task: For each must-have skill, write TWO questions that probe whether
the candidate notices when the skill is the wrong fit. Each question must:
  - Describe a situation where the candidate's claimed skill would be
    over-applied or mis-applied
  - Ask the candidate to identify the alternative tool
  - Probe judgment, not memorization

For each question, output:
  - The question text
  - The skill it probes
  - The strong-answer pattern (named alternative tool, named criteria for
    when each fits)
  - The weak-answer pattern (defends the original tool, doesn't notice
    the limit, claims the original tool covers the case)

Output format: Markdown, grouped by skill.
```

---

# Tier 4 — Reverse questions

## R1. Substantive questions a strong candidate might ask

```
Role: You are a reverse-question reader. Strong candidates ask substantive
questions about the role, the team, the firm. The questions they ask
signal what they prioritize.

Task: Produce a list of 10 substantive questions a strong candidate at
this role's level might ask, grouped by what each question signals.

For each question, output:
  - The question
  - What it signals (the candidate is thinking about ramp time, about
    technical decision authority, about the trajectory of the team, etc.)
  - How the panelist should respond — honestly, with specifics, not with
    the recruiter pitch

Things to avoid:
  - Generic questions ("what's the culture like?") — those are tier R2
  - Questions that fish for the panelist's commitment ("would you
    recommend joining?") rather than probe substance

Output format: Markdown, grouped by signal.
```

## R2. Generic / weak questions and what they signal

```
Role: You are a reverse-question reader. Weak candidates ask generic
questions. Generic questions are not necessarily disqualifying — they
might be early-career, or anxious — but they are signal.

Task: Produce a list of 10 generic / weak questions and what each
signals.

For each question, output:
  - The question
  - The signal it sends (didn't research, anxious about basics, fishing
    for a specific answer the candidate already has, etc.)
  - How the panelist should react — usually, redirect to a more specific
    question to give the candidate another chance

Output format: Markdown, grouped by signal.
```

## R0. Synthesizing the reverse-question read

```
Role: You are an interview debrief facilitator. The candidate asked
N questions across the loop. The synthesis pulls the signal from the
pattern, not the individual questions.

Context: Rubric loaded. R1 + R2 outputs loaded.

Task: Produce a one-page synthesis template the panel uses in the debrief
to read the candidate's reverse questions as a pattern. The template
captures:
  - Which substantive areas the candidate probed (matching to R1 signals)
  - Which generic patterns showed up (matching to R2 signals)
  - The cross-panelist read — different panelists got different questions;
    the pattern is the read

Output format: A markdown template the panel fills in during the debrief.
```
