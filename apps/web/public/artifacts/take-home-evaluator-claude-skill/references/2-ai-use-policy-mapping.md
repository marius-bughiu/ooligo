# AI-use policy mapping

The take-home evaluator runs pattern checks calibrated against the disclosed AI-use policy. The same submission produces different signal interpretation under different policies; this file documents the mapping.

The intent: surface signals to the panel debrief, not to make a determination. AI-use detection is well-known to be unreliable as a forensic tool; the right framing is "discuss with the candidate against the disclosed policy."

## Policy values

### `none-allowed`

The take-home brief told the candidate: "Do not use AI tools (Claude, ChatGPT, Copilot, Cursor, etc.) at any point during this assessment."

Pattern checks:

- **Verbatim public matches** — surface as `signal: verbatim_public_match` if any chunk ≥3 lines matches a known public AI-generated boilerplate exactly.
- **Style consistency vs. complexity** — surface as `signal: uniform_style` if comment style and naming idioms are suspiciously consistent across files of varying complexity.
- **Generic comments without engagement** — surface as `signal: generic_comments` if comments explain what the code does without engaging with the problem-specific decisions, beyond a per-file threshold (default: >40% of comments are generic).

Panel debrief framing: "Signals suggest possible AI use. Discuss with the candidate. The skill does not determine; the panel does, against the disclosed policy."

### `syntax-help-only`

The take-home brief told the candidate: "AI tools are allowed for syntax help (looking up the right method name, checking a regex, formatting). They are NOT allowed for solution generation (asking 'how would I implement this?', 'write me the function for X')."

Pattern checks: same as `none-allowed`, but with different framing. AI-generated boilerplate at the function level is a signal worth discussing; AI-completed identifier names are not.

Panel debrief framing: "AI use was permitted within bounds. Signals indicate where the candidate may have crossed the bounds. Discuss with the candidate."

### `ai-tools-allowed`

The take-home brief told the candidate: "AI tools are allowed throughout. Tell us what tools you used and how, in the README."

Pattern checks: still run, but signals are surfaced as informational only.

Panel debrief framing: "AI use was permitted. The signals are informational. The panel evaluates the SUBMISSION against the rubric; the question is what the candidate built and why, not which tools they used."

In the `ai-tools-allowed` policy, the panel should be ready to evaluate "the candidate's prompting and tool-use judgment" as a positive dimension if the rubric calls it out — many roles in 2026 explicitly want to see how candidates work with AI tools.

## What the skill does NOT do

- **Run a third-party AI-detection model** (GPTZero, Originality, etc.). Those tools have well-documented false-positive rates that climb to 30-50% on technical writing. Their findings do not survive a panel debrief.
- **Output a confidence score for "this was AI-generated."** No such confidence can be honestly assigned; the patterns are signals, not proof.
- **Block the report on signals.** Signals appear in the report. The panel decides. If `none-allowed` and the signals are strong, the panel typically schedules a follow-up conversation rather than auto-rejecting.

## Calibration

The skill's pattern thresholds (e.g. "40% generic comments") are tunable per take-home format. If your team's take-home format produces a lot of boilerplate naturally (e.g. it asks for a CRUD API), the threshold should be raised; if your format produces little boilerplate (e.g. it asks for a custom algorithm), the threshold should be lowered.

The defaults are calibrated against general-engineering take-homes. Tune in `config.json` per take-home format. Document the tuning in the rubric file's notes section.

## Why surfaced as notes, not as a verdict

1. **False-positive cost is asymmetric.** Auto-rejecting a candidate based on an AI-use signal that turns out to be wrong damages the firm's brand and risks a discrimination claim if the signal correlates with disparate impact. Surfacing for discussion costs nothing.
2. **The disclosed policy is the contract.** What matters is whether the candidate followed the policy they were told about. The signal helps the panel ask; it does not answer.
3. **AI-use detection is unreliable.** Even the best-known detectors have unacceptable error rates. The skill does not pretend otherwise.
4. **Hire decisions involve more than this one signal.** A candidate with a strong submission and a possible AI-use signal under `syntax-help-only` is a candidate to talk to, not a candidate to drop.
