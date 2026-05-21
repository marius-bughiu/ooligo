# Topic queue

State file consumed by the daily authoring slots (`ooligo-author-am`, `ooligo-author-pm`) and the `ooligo-evergreen-refresh` weekly slot. Refilled weekly by `ooligo-topic-refill`. Append-only — never reorder, never remove. Items are consumed by appending `→ slug: <canonical-slug>` to the line.

Format per item:

```
- [type:tool|comparison|workflow|learn|stack] [vertical:revops|legal-ops|recruiting|cross] <one-line page spec>
```

`refresh:` items live in the top `## Refresh queue` section, prepended by the weekly freshness sweep. New-content items live under `## Tools`, `## Comparisons`, `## Workflows`, `## Learn`, `## Stacks`.

`last-swept:` (no value yet — first sweep will set it).

## Refresh queue

(Empty — the first freshness sweep will populate this.)

## Tools

- [type:tool] [vertical:cross] new entry: glean — enterprise AI work assistant / unified search; cross-vertical because RevOps, Legal, and Recruiting all touch it as a search-and-summarize layer over their SaaS data → slug: glean
- [type:tool] [vertical:legal-ops] new entry: hebbia — Matrix-style document analysis platform used by in-house and Big Law for structured extraction over deal-room corpora; routinely compared with Harvey
- [type:tool] [vertical:legal-ops] new entry: brightflag — AI-assisted legal e-billing / matter management; the canonical alternative readers ask about when they reject Onit/SimpleLegal
- [type:tool] [vertical:legal-ops] new entry: onit — enterprise legal ops platform (matter management, ELM, contract); needed to anchor brightflag-vs-onit and similar pairwise
- [type:tool] [vertical:revops] new entry: smartlead — cold email infrastructure (deliverability, warmup, unified inbox); high reddit / r/sales mention volume
- [type:tool] [vertical:revops] new entry: instantly — cold email sending platform with built-in lead database; commonly paired vs smartlead and lemlist
- [type:tool] [vertical:revops] new entry: nooks — AI parallel dialer with call coaching and AI assistant on the line; the category-leading parallel-dial entrant readers ask about vs Orum
- [type:tool] [vertical:revops] new entry: orum — live conversation platform / parallel dialer; established alternative to Nooks and the SDR-productivity story
- [type:tool] [vertical:revops] new entry: 11x — autonomous AI SDR (Alice, Jordan, Mike); high-discussion AI-SDR vendor that needs a sober buyer-side page
- [type:tool] [vertical:revops] new entry: artisan — Ava AI SDR / outbound AI agent; second pole of the AI-SDR comparison readers want
- [type:tool] [vertical:revops] new entry: pocus — product-led sales platform (PLS) for SaaS with self-serve motions; needed to anchor PLS stack and PLS comparisons
- [type:tool] [vertical:revops] new entry: koala — product signals → SDR alerting platform; the PLS counterpart readers most often compare to Pocus
- [type:tool] [vertical:revops] new entry: crossbeam — partner ecosystem / account mapping; needed for partner-led-growth stack and comparisons with Reveal
- [type:tool] [vertical:revops] new entry: pipedrive — SMB-friendly CRM; the missing third pole alongside HubSpot/Salesforce/Attio for SMB readers
- [type:tool] [vertical:recruiting] new entry: karat — interview-as-a-service / technical interview outsourcing; routinely compared with CodeSignal and HackerRank
- [type:tool] [vertical:recruiting] new entry: pillar — interview intelligence platform focused on hiring; the third pole alongside BrightHire and Metaview
- [type:tool] [vertical:recruiting] new entry: hireflix — async video interviewing; the canonical async-video entry readers ask about
- [type:tool] [vertical:recruiting] new entry: maki-people — AI candidate-experience and pre-hire assessments via conversational AI
- [type:tool] [vertical:recruiting] new entry: bamboohr — HRIS + light ATS used by SMB recruiting teams; needed for SMB recruiting comparisons
- [type:tool] [vertical:cross] new entry: recall-ai — meeting bot infrastructure (the API behind many AI-notetakers); developer-facing but discussed in RevOps/Recruiting tool stacks
- [type:tool] [vertical:cross] new entry: calendly — meeting scheduling; the missing baseline alongside Chili Piper and GoodTime for routing/scheduling comparisons
- [type:tool] [vertical:revops] new entry: vidyard — async video for sales; needed to anchor async-video sales comparisons and to support sequence-builder workflows

## Comparisons

- [type:comparison] [vertical:revops] pairwise: clari-vs-aviso — forecasting and revenue intelligence; routing rule resolves on whether the buyer wants RevDB depth (Clari) vs guided AI forecast scenarios (Aviso)
- [type:comparison] [vertical:revops] pairwise: clari-vs-boostup — forecasting; routes on roll-up rigor and CRM-data hygiene posture vs lighter mid-market adoption
- [type:comparison] [vertical:revops] pairwise: gainsight-vs-churnzero — CS platforms; routes on enterprise CS-Ops depth vs mid-market time-to-value
- [type:comparison] [vertical:revops] pairwise: gainsight-vs-vitally — CS platforms; routes on configurability and PX bundle vs Notion-native modern UX
- [type:comparison] [vertical:revops] pairwise: catalyst-vs-vitally — CS platforms; routes on workflow-customization needs vs modern collaboration surface
- [type:comparison] [vertical:revops] pairwise: amplemarket-vs-apollo — outbound platform with data; routes on AI sequencing depth vs data-pricing leverage
- [type:comparison] [vertical:revops] pairwise: lavender-vs-regie-ai — AI for outbound copy; routes on rep-side coaching vs full-sequence generation
- [type:comparison] [vertical:revops] pairwise: lusha-vs-cognism — B2B contact data; routes on EU-coverage / GDPR posture vs broader-but-shallower US data
- [type:comparison] [vertical:revops] pairwise: sales-navigator-vs-zoominfo — prospect-discovery surface; routes on LinkedIn-graph freshness vs structured firmographic depth
- [type:comparison] [vertical:recruiting] pairwise: icims-vs-greenhouse — enterprise ATS; routes on enterprise compliance + complex req workflows vs structured-hiring philosophy
- [type:comparison] [vertical:recruiting] pairwise: smartrecruiters-vs-greenhouse — enterprise ATS; routes on global hiring + CRM bundle vs purist ATS with strong integrations
- [type:comparison] [vertical:recruiting] pairwise: avature-vs-beamery — talent CRM at enterprise; routes on configurability/complex enterprise vs AI-first talent intelligence
- [type:comparison] [vertical:recruiting] pairwise: phenom-vs-beamery — talent experience / CRM; routes on candidate-side CX automation vs sourcer-side intelligence
- [type:comparison] [vertical:recruiting] pairwise: hackerrank-vs-codesignal — technical assessment; routes on bulk-screening cost-per-candidate vs proctored / role-based standardization
- [type:comparison] [vertical:recruiting] pairwise: testgorilla-vs-hackerrank — skills assessments; routes on broad skills library + SMB pricing vs developer-only depth
- [type:comparison] [vertical:recruiting] pairwise: vervoe-vs-testgorilla — skills assessments; routes on simulation-based scoring vs validated question library
- [type:comparison] [vertical:recruiting] pairwise: holly-vs-hireez — AI sourcing; routes on conversational AI-agent sourcing vs structured search + diversity insights
- [type:comparison] [vertical:recruiting] pairwise: modernloop-vs-goodtime — interview scheduling at scale; routes on workflow flexibility vs CS-grade reliability and reporting
- [type:comparison] [vertical:recruiting] pairwise: bullhorn-vs-loxo — recruiting CRM (staffing); routes on enterprise staffing-firm workflows vs modern UX + built-in sourcing
- [type:comparison] [vertical:legal-ops] pairwise: harvey-vs-thomson-reuters-cocounsel — legal AI for in-house and BigLaw; routes on workflow-suite breadth vs Westlaw-grounded answer fidelity
- [type:comparison] [vertical:legal-ops] pairwise: lexisnexis-protege-vs-thomson-reuters-cocounsel — legal AI assistants; routes on Lexis-grounded research depth vs Westlaw + Practical-Law workflow integration
- [type:comparison] [vertical:legal-ops] pairwise: ironclad-vs-docusign-iam — CLM vs agreement intelligence; routes on full-lifecycle workflow vs signature-anchored agreement data
- [type:comparison] [vertical:legal-ops] pairwise: pandadoc-vs-concord — SMB CLM / proposals; routes on sales-doc + e-sig motion vs lightweight CLM repository
- [type:comparison] [vertical:legal-ops] pairwise: spellbook-vs-draftwise — AI drafting assistants in Word; routes on broad drafting/redline coverage vs precedent-grounded clause retrieval
- [type:comparison] [vertical:legal-ops] pairwise: reveal-vs-relativity — ediscovery platforms; routes on AI-native review (Reveal-Brainspace) vs Relativity ecosystem and partner depth
- [type:comparison] [vertical:revops] pairwise: 11x-vs-artisan — AI SDR head-to-head; routes on multi-agent suite (Alice/Jordan/Mike) vs single-rep Ava with email focus

## Workflows

- [type:workflow] [vertical:revops] mcp-server-clari-revops — MCP server exposing Clari forecast and pipeline data to Claude for natural-language forecast Q&A; artifact_type: mcp-server
- [type:workflow] [vertical:revops] mcp-server-vitally-cs — MCP server exposing Vitally accounts + health into Claude for CS conversations; artifact_type: mcp-server
- [type:workflow] [vertical:legal-ops] mcp-server-clio-legal — MCP server exposing Clio matter and time data to Claude for in-house / small-firm legal queries; artifact_type: mcp-server
- [type:workflow] [vertical:legal-ops] mcp-server-relativity-ediscovery — MCP server exposing Relativity workspace + review-set metadata to Claude for review-batch triage; artifact_type: mcp-server
- [type:workflow] [vertical:revops] signal-bundler-account-execs-claude-skill — claude skill that bundles intent + engagement + product signals into one daily AE digest per named account; artifact_type: claude-skill
- [type:workflow] [vertical:revops] lost-deal-postmortem-claude-skill — claude skill that turns closed-lost notes + call recordings into a structured postmortem ready for Gong/Salesforce; artifact_type: claude-skill
- [type:workflow] [vertical:revops] abm-list-quality-audit-skill — claude skill that audits an ABM list against ICP rubric and flags weak accounts with a defect taxonomy; artifact_type: claude-skill
- [type:workflow] [vertical:revops] intent-spike-handler-n8n — n8n flow that takes an intent spike (6sense/Bombora/Common Room) and assigns + notifies + drafts first-touch outreach; artifact_type: n8n-flow
- [type:workflow] [vertical:recruiting] interview-scheduling-resolver-n8n — n8n flow that resolves recruiter↔panel↔candidate time conflicts using Google Calendar + Greenhouse data; artifact_type: n8n-flow
- [type:workflow] [vertical:recruiting] candidate-personalization-at-scale-skill — claude skill that personalizes outreach to a sourced list using LinkedIn + GitHub + JD signals; artifact_type: claude-skill
- [type:workflow] [vertical:legal-ops] nda-clause-redline-prompt-pack — prompt pack of paired prompts for redlining the 12 most-negotiated NDA clauses; artifact_type: prompt
- [type:workflow] [vertical:legal-ops] ediscovery-custodian-questionnaire-skill — claude skill that generates a custodian interview questionnaire from a legal-hold scope; artifact_type: claude-skill
- [type:workflow] [vertical:cross] cursor-rules-data-engineer-ops — cursor rules tailored for an ops-adjacent data engineer (dbt + reverse-ETL + warehouse hygiene); artifact_type: cursor-rule

## Learn

- [type:learn] [vertical:cross] definition: claude-skill-vs-mcp-server — what each is, when each fits, and how they compose for ops workflows
- [type:learn] [vertical:cross] definition: prompt-pack-vs-claude-skill — when a prompt library is enough vs when to package a skill
- [type:learn] [vertical:cross] definition: mcp-server-explained — Model Context Protocol primer aimed at non-engineer ops leaders evaluating vendors that claim "MCP support"
- [type:learn] [vertical:cross] definition: ai-agent-for-ops — what makes an AI "agent" for ops vs a workflow; the diagnostic questions a buyer should ask vendors
- [type:learn] [vertical:revops] definition: ai-sdr — what AI SDR vendors actually do, the four common architectures, and how to evaluate them
- [type:learn] [vertical:revops] definition: product-led-sales-pls — PLS primer, the signal stack (intent, product, fit), and where Pocus/Koala/Endgame fit
- [type:learn] [vertical:revops] concept: signal-orchestration — orchestrating buyer signals across intent, product, engagement, and ecosystem to drive plays
- [type:learn] [vertical:revops] concept: forecast-categories-explained — Commit/Best/Pipeline/Omitted categories and how Clari/Aviso/BoostUp differ in defaults
- [type:learn] [vertical:revops] policy: ai-policy-for-revops-teams — a one-page AI-use policy template for RevOps (data residency, vendor review, allowed tasks)
- [type:learn] [vertical:recruiting] policy: ai-policy-for-recruiting-teams — AI-use policy for TA (NYC LL144 awareness, bias audits, candidate notification, vendor due-diligence)
- [type:learn] [vertical:recruiting] regulation: nyc-local-law-144 — what NYC LL144 requires for AEDTs and how recruiting teams comply
- [type:learn] [vertical:recruiting] concept: talent-intelligence-platform — what a TI platform is vs a CRM vs an ATS; vendor map and buying criteria
- [type:learn] [vertical:legal-ops] concept: contract-data-extraction — how AI extracts structured clause data from contracts; precision/recall tradeoffs and validation patterns
- [type:learn] [vertical:legal-ops] concept: legal-hold-process — the end-to-end legal-hold lifecycle (issue → custodian → preservation → release) and where automation helps
- [type:learn] [vertical:legal-ops] concept: data-room-vs-deal-room — distinctions for legal/finance buyers and where AI document analysis applies

## Stacks

- [type:stack] [vertical:legal-ops] new entry: enterprise-clm-stack — Ironclad + DocuSign IAM + Spellbook + Litera; use case: enterprise contract lifecycle with AI-assisted drafting
- [type:stack] [vertical:legal-ops] new entry: ediscovery-stack — Relativity + Reveal + Logikcull (smaller matters) + Everlaw alternatives; use case: AmLaw-grade discovery review
- [type:stack] [vertical:legal-ops] new entry: legal-ops-team-of-one-stack — Ironclad-or-Juro + Spellbook + Brightflag + Notion; use case: solo in-house counsel running ops single-handed
- [type:stack] [vertical:recruiting] new entry: high-volume-recruiting-stack — Fountain + Paradox + Workable; use case: hourly / frontline at-scale hiring
- [type:stack] [vertical:revops] new entry: gtm-engineering-stack — Clay + n8n + HubSpot + Common Room; use case: small GTM-engineering team automating signal-to-action loops
- [type:stack] [vertical:revops] new entry: pls-product-led-sales-stack — Pocus + Koala + Salesforce + Slack; use case: PLG SaaS layering sales motion onto self-serve usage
- [type:stack] [vertical:revops] new entry: partner-ecosystem-stack — Crossbeam + Reveal + Salesforce + Common Room; use case: partner-led growth with ecosystem account-mapping
