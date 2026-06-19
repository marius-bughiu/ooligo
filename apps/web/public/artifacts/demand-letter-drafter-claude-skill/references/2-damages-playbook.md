# Damages playbook (firm methodology — fill before first use)

The skill computes the general-damages range from this file and nothing else. If a band is not here, the skill refuses to produce a range rather than guessing. Fill every section with the firm's actual methodology and review it against current law per matter.

**This is methodology, not legal advice.** Multiplier bands, caps, and notice rules vary by jurisdiction and change. The attorney confirms the numbers in this file against current rules before they drive a demand.

## 1. Method selection

Choose the firm's default and when it switches:

- **Multiplier method** (default for most soft-tissue to moderate cases): general damages = band × medical specials.
- **Per-diem method** (use when the recovery period is long and well-documented, or when the firm prefers it for a venue): general damages = daily rate × documented recovery days.

State the rule for which method applies to which case type. The skill follows it.

## 2. Multiplier bands by injury severity

Common practice puts the multiplier in the 1.5–5× range, higher for severe or disfiguring injuries. Replace these placeholders with the firm's calibrated bands:

| Severity tier | Definition (firm's criteria) | Band (× specials) |
|---|---|---|
| Minor | Soft-tissue, full resolution < 90 days, no injections/surgery | 1.5 – 2.0 |
| Moderate | Soft-tissue with injections or extended PT, resolution 3–9 months | 2.5 – 4.0 |
| Serious | Fracture, surgery, or documented lasting limitation | 4.0 – 5.0 |
| Severe / catastrophic | Permanent impairment, disfigurement, TBI, spinal | attorney-set; multiplier insufficient |

For the severe/catastrophic tier the skill does NOT output a multiplier range — it flags the case as requiring attorney valuation. A multiplier on specials understates these.

## 3. Per-diem rate

- Daily rate: `${{per_diem_rate}}` (the firm's chosen rate; some firms anchor to the client's daily wage, others to a fixed figure — state which and why).
- Recovery period: documented start (date of loss) to documented end (release from care / maximum medical improvement as the records state it). The skill uses documented dates only — it does not estimate an end date.

## 4. Billed vs. paid

State the firm's position, because it changes the specials total the multiplier runs on:

- [ ] Use **billed** amounts (gross charges).
- [ ] Use **paid/adjusted** amounts.
- [ ] Per jurisdiction — note the rule and the venues where each applies.

Collateral-source rules and billed-vs-paid admissibility vary by jurisdiction. This is an attorney call; the skill applies whatever this section states.

## 5. Jurisdiction notes (attorney-maintained)

The skill cites this section; it does not assert the law. Maintain per venue the firm practices in:

- **Damages caps** — non-economic caps, if any, and the case types they apply to.
- **Pre-suit notice** — required notice periods (e.g. claims against government entities), and the deadline math.
- **Comparative fault** — the rule (pure / modified / contributory) and how the firm reflects it in the demand.
- **Statute of limitations** — for the deadline-awareness flag, not for legal advice.

## 6. Gap threshold

- Treatment-gap flag threshold: `{{gap_days}}` days (default 30). Gaps at or above this are flagged in the checklist for the attorney.

## How to update

Review §2 and §5 at least annually and whenever the firm enters a new venue. The skill's output is only as current as this file; a stale playbook produces a stale range.
