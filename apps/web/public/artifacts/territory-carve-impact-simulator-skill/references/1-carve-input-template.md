# Carve input template

Replace the contents below with your real proposed carve. Two sections are required: `rules` (ordered) and `roster`. The example values are a mid-market/enterprise split for a US SaaS org — overwrite them, do not extend them.

## Metadata

```yaml
carve_name: FY27 Enterprise realignment
effective_date: 2026-11-01
carve_status: draft          # draft | reviewed | socialized
owner: revops@example.com
routing_engine: salesforce-territory-management   # or leandata, fullcast, custom-apex
```

`carve_status` changes how the report opens. Set it honestly: `socialized` means reps have already seen the map, and the simulator will say so in the header because revisions after that point cost credibility as well as effort.

## Rules — ordered, first match wins

The simulator evaluates these top to bottom and stops at the first match, because that is what the routing engine does at go-live. **Order is load-bearing.** If you reorder rules here, re-run the simulation; the assignment map changes.

Each rule needs `id`, `territory`, and `match`. `match` is a list of conditions, all of which must hold (AND). Use Salesforce API field names, not labels.

```yaml
rules:
  - id: 1
    territory: ENT-STRATEGIC
    match:
      - field: Account.Strategic_Account__c
        op: equals
        value: true

  - id: 2
    territory: ENT-WEST-1
    match:
      - field: Account.AnnualRevenue
        op: gte
        value: 500000000
      - field: Account.BillingState
        op: in
        value: [CA, WA, OR, NV, AZ]

  - id: 3
    territory: ENT-WEST-2
    match:
      - field: Account.AnnualRevenue
        op: gte
        value: 100000000
      - field: Account.BillingState
        op: in
        value: [CA, WA, OR, NV, AZ]

  - id: 4
    territory: MM-WEST
    match:
      - field: Account.BillingState
        op: in
        value: [CA, WA, OR, NV, AZ]

  - id: 99
    territory: UNASSIGNED-POOL
    match:
      - field: Account.Id
        op: exists
```

Supported `op` values: `equals`, `not_equals`, `gte`, `lte`, `in`, `not_in`, `contains`, `exists`, `is_null`.

**On the catch-all.** Rule 99 above catches everything the earlier rules missed. Including one means your `no_rule_matched` count will always be zero and the coverage report shifts from "which accounts have no owner" to "how big is the pool." Both are valid designs; pick deliberately. Omit the catch-all if you want the simulator to surface genuine rule gaps by name.

**On nulls.** A rule condition against a null field does not match. If `Account.AnnualRevenue` is null on 400 accounts, those accounts skip rules 2 and 3 and fall through to rule 4 — silently landing in mid-market. The simulator reports these separately as `null_input_field` so you can tell a data problem from a design problem, but only if you have not masked them with a catch-all.

## Roster

One entry per quota-carrying rep in the carve. `start_date` is the rep's quota-carrying start date, not their hire date — the ramp factor is computed from it against the effective date.

```yaml
roster:
  - user_id: 0053000000ABCDE
    name: A. Okafor
    territory: ENT-WEST-1
    start_date: 2023-02-13
    assigned_quota: 3800000
    productivity_band: high      # high | mid | low | unproven

  - user_id: 0053000000FGHIJ
    name: J. Reyes
    territory: ENT-WEST-2
    start_date: 2026-09-15
    assigned_quota: 2100000
    productivity_band: unproven

  - user_id: 0053000000KLMNO
    name: S. Baptiste
    territory: ENT-WEST-2
    start_date: 2026-09-01
    assigned_quota: 2100000
    productivity_band: unproven
```

`productivity_band` maps to a multiplier in the thresholds file. Use `unproven` for anyone without four full quarters of attainment history at this company — assigning them a band from their previous employer's numbers is how a capacity model gets optimistic.

## Territories with no roster entry

A territory that appears in `rules` but not in `roster` is reported as an empty territory, not as an error. That is a real and sometimes intentional state (an open req you plan to fill). The simulator counts its accounts as uncovered capacity and says so.
