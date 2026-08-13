# 1 — Pre-registration template

Fill this in **before the first send**. Commit it. The skill hashes it and refuses to score against a version that changed afterwards.

Replace every `<…>` placeholder. Do not delete fields you think do not apply — set them explicitly, because a missing threshold and a threshold of "we did not care" are different claims and the memo distinguishes them.

```yaml
registered_at: <YYYY-MM-DD>          # must precede window_start
registered_by: <name, role>
vendor: <11x | artisan | aisdr | unify | homegrown | other>
plan_and_meter: <e.g. "Growth, 2,000 new prospects/mo, 5 end users">

window_start: <YYYY-MM-DD>           # first send
window_end: <YYYY-MM-DD>             # last send
tail_days: 14                        # do not lower; see reputation note below

min_held_meetings: <integer>         # see sizing note below

thresholds:
  max_cost_per_qualified_meeting: <number>      # your currency
  min_reply_to_meeting_rate: <decimal>          # meetings per positive reply
  max_rework_hours_per_meeting: <number>
  max_spam_rate: 0.0030                         # absolute line; see note

qualification_gate:
  require_held: true
  require_stage_advance_by_days: 30

exclusion_rules:
  exclude_open_opp_at_booking: true
  exclude_prior_human_touch_within_days: 90
  excluded_named_account_lists:
    - <list name or CRM view id>

loaded_hourly_rate: <number>         # fully loaded, not salary/2080
```

## Sizing `min_held_meetings`

Set it so that one meeting moving in or out changes cost per qualified meeting by less than the margin between your threshold and your expected value. The arithmetic: with `n` qualified meetings, adding or removing one moves the per-meeting cost by roughly `1/n`. At `n = 8` that is 12.5%; at `n = 20` it is 5%; at `n = 40` it is 2.5%.

If your threshold is 750 and you expect to land near 700, your margin is about 7% and `n = 20` is the floor. If you expect to land near 400 against a threshold of 750, the margin is wide and `n = 12` is defensible.

If the pilot cannot plausibly produce your `n` in the window, the honest move is to lengthen the window before starting, not to score a short one. Write the required `n` down anyway — an `insufficient_sample` return at the end is a real finding, and it is the finding that the pilot was not designed to answer the question.

## The four thresholds

**`max_cost_per_qualified_meeting`.** Anchor it to what the same meeting costs you today through your existing motion, not to the vendor's list price. Published entry prices give you the floor of the subscription line only: AiSDR publishes 250 per month for 200 AI-researched contacts, 900 for 800, and 2,500 for 2,500, with the middle and top tiers on a quarterly commitment. 11x publishes 3,750 per month billed annually for its Growth plan, covering 2,000 new prospects per month and up to five end users, and states it charges per lead rather than per send. Artisan publishes no price and scopes its tiers at roughly 2,500 and roughly 6,000 leads contacted per month. Those are subscription lines, not costs per meeting — the cost model in `2-cost-model.md` adds the four other lines that turn one into the other.

**`min_reply_to_meeting_rate`.** Meetings per *positive* reply, not per reply. Set it from your own historical rate on the same segment if you have one. If you do not, set it and note that you do not — an unanchored threshold you registered is still better than a rate you interpret after the fact.

**`max_rework_hours_per_meeting`.** The hours a human spends editing drafts, correcting bad targeting, cleaning the CRM after the agent, and handling replies the agent mishandled. This is the line that is never in the business case. Instrument it from day one, even crudely: a weekly self-reported number from the two people doing it beats a precise number you reconstruct at the end.

**`max_spam_rate`.** The default of 0.0030 is Google's published bulk-sender requirement for senders of more than 5,000 messages per day to Gmail accounts, which is to keep the spam rate reported in Postmaster Tools under 0.30%. Google separately recommends staying under 0.10% so that an ordinary complaint spike does not push you over. If your recipient mix is Gmail-heavy, set the threshold at 0.0010 and treat 0.0030 as the hard stop. Do not raise this field. It is not a preference; it is the line above which a mailbox provider starts making decisions about your domain.

## The exclusion rules

These decide what counts as the agent's meeting. Set them now, because after the pilot every excluded meeting is an argument.

`exclude_open_opp_at_booking` and `exclude_prior_human_touch_within_days: 90` are the two that matter most. An agent that books a meeting on an account your AE has been working for a month did not source that meeting; it scheduled it. Both defaults are deliberately strict — if you want them looser, loosen them here, in writing, before you know which way it cuts.

`excluded_named_account_lists` exists for the top-of-house accounts you would never let an agent source into. If that list is empty, say so explicitly by leaving the key with an empty list rather than deleting it.

## Amending

You may amend. Re-register with a new `registered_at`, commit, and re-hash. The skill will score against the new file and stamp `retrospective: true` on the memo permanently. That stamp is not a punishment — it is the correct label for a number produced against criteria chosen with partial knowledge of the outcome, and a reader of the memo six months from now needs it.
