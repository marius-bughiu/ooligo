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
- [type:tool] [vertical:legal-ops] new entry: hebbia — Matrix-style document analysis platform used by in-house and Big Law for structured extraction over deal-room corpora; routinely compared with Harvey → slug: hebbia
- [type:tool] [vertical:legal-ops] new entry: brightflag — AI-assisted legal e-billing / matter management; the canonical alternative readers ask about when they reject Onit/SimpleLegal → slug: brightflag
- [type:tool] [vertical:legal-ops] new entry: onit — enterprise legal ops platform (matter management, ELM, contract); needed to anchor brightflag-vs-onit and similar pairwise → slug: onit
- [type:tool] [vertical:revops] new entry: smartlead — cold email infrastructure (deliverability, warmup, unified inbox); high reddit / r/sales mention volume → slug: smartlead
- [type:tool] [vertical:revops] new entry: instantly — cold email sending platform with built-in lead database; commonly paired vs smartlead and lemlist → slug: instantly
- [type:tool] [vertical:revops] new entry: nooks — AI parallel dialer with call coaching and AI assistant on the line; the category-leading parallel-dial entrant readers ask about vs Orum → slug: nooks
- [type:tool] [vertical:revops] new entry: orum — live conversation platform / parallel dialer; established alternative to Nooks and the SDR-productivity story → slug: orum
- [type:tool] [vertical:revops] new entry: 11x — autonomous AI SDR (Alice, Jordan, Mike); high-discussion AI-SDR vendor that needs a sober buyer-side page → slug: 11x
- [type:tool] [vertical:revops] new entry: artisan — Ava AI SDR / outbound AI agent; second pole of the AI-SDR comparison readers want → slug: artisan
- [type:tool] [vertical:revops] new entry: pocus — product-led sales platform (PLS) for SaaS with self-serve motions; needed to anchor PLS stack and PLS comparisons → slug: pocus
- [type:tool] [vertical:revops] new entry: koala — product signals → SDR alerting platform; the PLS counterpart readers most often compare to Pocus → slug: koala
- [type:tool] [vertical:revops] new entry: crossbeam — partner ecosystem / account mapping; needed for partner-led-growth stack and comparisons with Reveal → slug: crossbeam
- [type:tool] [vertical:revops] new entry: pipedrive — SMB-friendly CRM; the missing third pole alongside HubSpot/Salesforce/Attio for SMB readers → slug: pipedrive
- [type:tool] [vertical:recruiting] new entry: karat — interview-as-a-service / technical interview outsourcing; routinely compared with CodeSignal and HackerRank → slug: karat
- [type:tool] [vertical:recruiting] new entry: pillar — interview intelligence platform focused on hiring; the third pole alongside BrightHire and Metaview → slug: pillar
- [type:tool] [vertical:recruiting] new entry: hireflix — async video interviewing; the canonical async-video entry readers ask about → slug: hireflix
- [type:tool] [vertical:recruiting] new entry: maki-people — AI candidate-experience and pre-hire assessments via conversational AI → slug: maki-people
- [type:tool] [vertical:recruiting] new entry: bamboohr — HRIS + light ATS used by SMB recruiting teams; needed for SMB recruiting comparisons → slug: bamboohr
- [type:tool] [vertical:cross] new entry: recall-ai — meeting bot infrastructure (the API behind many AI-notetakers); developer-facing but discussed in RevOps/Recruiting tool stacks → slug: recall-ai
- [type:tool] [vertical:cross] new entry: calendly — meeting scheduling; the missing baseline alongside Chili Piper and GoodTime for routing/scheduling comparisons → slug: calendly
- [type:tool] [vertical:revops] new entry: vidyard — async video for sales; needed to anchor async-video sales comparisons and to support sequence-builder workflows → slug: vidyard
- [type:tool] [vertical:revops] new entry: unify — signal-driven GTM / warm-outbound platform with AI plays; the "signal-driven not fully-autonomous" pole buyers weigh against 11x/Artisan → slug: unify
- [type:tool] [vertical:revops] new entry: aisdr — AI SDR doing email + voice outreach with published pricing; the third pole alongside 11x and Artisan in AI-SDR shortlists → slug: aisdr
- [type:tool] [vertical:revops] new entry: warmly — website visitor de-anonymization + warm-outbound orchestration; high r/sales mention volume, pairs against RB2B → slug: warmly
- [type:tool] [vertical:revops] new entry: revenuehero — inbound lead-to-meeting routing + scheduling; the lower-cost single-product Chili Piper alternative readers ask about → slug: revenuehero
- [type:tool] [vertical:revops] new entry: qualified — Salesforce-native pipeline platform with the Piper AI SDR; the SFDC-native inbound-conversion pole → slug: qualified
- [type:tool] [vertical:recruiting] new entry: seekout — agentic AI recruiting (sourcing + screening + SeekOut Spot slate service); major catalog gap vs hireEZ/Gem → slug: seekout
- [type:tool] [vertical:recruiting] new entry: tezi — autonomous AI recruiter (agent "Max") for sourcing + first-touch outreach; the point-solution AI-recruiter readers evaluate
- [type:tool] [vertical:recruiting] new entry: apriora — AI video interviewer (agent "Alex") for real-time screening with cheat detection; the live/async AI-interview category → slug: apriora
- [type:tool] [vertical:recruiting] new entry: micro1 — AI technical interviewer (agent "Zara") + vetted global talent marketplace; dev-vetting angle vs CodeSignal/Karat → slug: micro1
- [type:tool] [vertical:legal-ops] new entry: legora — legal AI assistant for drafting/review/research; Harvey's chief rival after its 2026 mega-raise, anchors harvey-vs-legora → slug: legora
- [type:tool] [vertical:legal-ops] new entry: eve-legal — plaintiff-side litigation AI (case workup + demand prep); reached $1B valuation in 2026, the plaintiff-firm counterpart to in-house legal AI → slug: eve-legal
- [type:tool] [vertical:legal-ops] new entry: evenup — AI demand-package generation for personal-injury firms; category leader after $150M raise, anchors the PI-law cluster → slug: evenup
- [type:tool] [vertical:legal-ops] new entry: definely — Word-native contract drafting/review add-in (defined terms, navigation, redlining) for transactional and in-house lawyers → slug: definely
- [type:tool] [vertical:cross] new entry: dust — enterprise AI-agent platform to build and govern agents over company tools; deployed across RevOps, Legal, and Recruiting with permissioned data → slug: dust
- [type:tool] [vertical:cross] new entry: relevance-ai — AI agent workforce / orchestration for back-office ops processes; the no-code multi-agent builder ops teams compare to Dust → slug: relevance-ai

## Comparisons

- [type:comparison] [vertical:revops] pairwise: clari-vs-aviso — forecasting and revenue intelligence; routing rule resolves on whether the buyer wants RevDB depth (Clari) vs guided AI forecast scenarios (Aviso) → slug: clari-vs-aviso
- [type:comparison] [vertical:revops] pairwise: clari-vs-boostup — forecasting; routes on roll-up rigor and CRM-data hygiene posture vs lighter mid-market adoption → slug: clari-vs-boostup
- [type:comparison] [vertical:revops] pairwise: gainsight-vs-churnzero — CS platforms; routes on enterprise CS-Ops depth vs mid-market time-to-value → slug: gainsight-vs-churnzero
- [type:comparison] [vertical:revops] pairwise: gainsight-vs-vitally — CS platforms; routes on configurability and PX bundle vs Notion-native modern UX → slug: gainsight-vs-vitally
- [type:comparison] [vertical:revops] pairwise: catalyst-vs-vitally — CS platforms; routes on workflow-customization needs vs modern collaboration surface → slug: catalyst-vs-vitally
- [type:comparison] [vertical:revops] pairwise: amplemarket-vs-apollo — outbound platform with data; routes on AI sequencing depth vs data-pricing leverage → slug: amplemarket-vs-apollo
- [type:comparison] [vertical:revops] pairwise: lavender-vs-regie-ai — AI for outbound copy; routes on rep-side coaching vs full-sequence generation → slug: lavender-vs-regie-ai
- [type:comparison] [vertical:revops] pairwise: lusha-vs-cognism — B2B contact data; routes on EU-coverage / GDPR posture vs broader-but-shallower US data → slug: lusha-vs-cognism
- [type:comparison] [vertical:revops] pairwise: sales-navigator-vs-zoominfo — prospect-discovery surface; routes on LinkedIn-graph freshness vs structured firmographic depth → slug: sales-navigator-vs-zoominfo
- [type:comparison] [vertical:recruiting] pairwise: icims-vs-greenhouse — enterprise ATS; routes on enterprise compliance + complex req workflows vs structured-hiring philosophy → slug: icims-vs-greenhouse
- [type:comparison] [vertical:recruiting] pairwise: smartrecruiters-vs-greenhouse — enterprise ATS; routes on global hiring + CRM bundle vs purist ATS with strong integrations → slug: smartrecruiters-vs-greenhouse
- [type:comparison] [vertical:recruiting] pairwise: avature-vs-beamery — talent CRM at enterprise; routes on configurability/complex enterprise vs AI-first talent intelligence → slug: avature-vs-beamery
- [type:comparison] [vertical:recruiting] pairwise: phenom-vs-beamery — talent experience / CRM; routes on candidate-side CX automation vs sourcer-side intelligence → slug: phenom-vs-beamery
- [type:comparison] [vertical:recruiting] pairwise: hackerrank-vs-codesignal — technical assessment; routes on bulk-screening cost-per-candidate vs proctored / role-based standardization → slug: hackerrank-vs-codesignal
- [type:comparison] [vertical:recruiting] pairwise: testgorilla-vs-hackerrank — skills assessments; routes on broad skills library + SMB pricing vs developer-only depth → slug: testgorilla-vs-hackerrank
- [type:comparison] [vertical:recruiting] pairwise: vervoe-vs-testgorilla — skills assessments; routes on simulation-based scoring vs validated question library → slug: vervoe-vs-testgorilla
- [type:comparison] [vertical:recruiting] pairwise: holly-vs-hireez — AI sourcing; routes on conversational AI-agent sourcing vs structured search + diversity insights → slug: holly-vs-hireez
- [type:comparison] [vertical:recruiting] pairwise: modernloop-vs-goodtime — interview scheduling at scale; routes on workflow flexibility vs CS-grade reliability and reporting → slug: modernloop-vs-goodtime
- [type:comparison] [vertical:recruiting] pairwise: bullhorn-vs-loxo — recruiting CRM (staffing); routes on enterprise staffing-firm workflows vs modern UX + built-in sourcing → slug: bullhorn-vs-loxo
- [type:comparison] [vertical:legal-ops] pairwise: harvey-vs-thomson-reuters-cocounsel — legal AI for in-house and BigLaw; routes on workflow-suite breadth vs Westlaw-grounded answer fidelity → slug: harvey-vs-thomson-reuters-cocounsel
- [type:comparison] [vertical:legal-ops] pairwise: lexisnexis-protege-vs-thomson-reuters-cocounsel — legal AI assistants; routes on Lexis-grounded research depth vs Westlaw + Practical-Law workflow integration → slug: lexisnexis-protege-vs-thomson-reuters-cocounsel
- [type:comparison] [vertical:legal-ops] pairwise: ironclad-vs-docusign-iam — CLM vs agreement intelligence; routes on full-lifecycle workflow vs signature-anchored agreement data → slug: ironclad-vs-docusign-iam
- [type:comparison] [vertical:legal-ops] pairwise: pandadoc-vs-concord — SMB CLM / proposals; routes on sales-doc + e-sig motion vs lightweight CLM repository → slug: pandadoc-vs-concord
- [type:comparison] [vertical:legal-ops] pairwise: spellbook-vs-draftwise — AI drafting assistants in Word; routes on broad drafting/redline coverage vs precedent-grounded clause retrieval → slug: spellbook-vs-draftwise
- [type:comparison] [vertical:legal-ops] pairwise: reveal-vs-relativity — ediscovery platforms; routes on AI-native review (Reveal-Brainspace) vs Relativity ecosystem and partner depth → slug: reveal-vs-relativity
- [type:comparison] [vertical:revops] pairwise: 11x-vs-artisan — AI SDR head-to-head; routes on multi-agent suite (Alice/Jordan/Mike) vs single-rep Ava with email focus → slug: 11x-vs-artisan
- [type:comparison] [vertical:legal-ops] pairwise: harvey-vs-legora — legal AI rivals; routes on workflow-suite breadth + US grounding vs European-origin collaborative drafting/review → slug: harvey-vs-legora
- [type:comparison] [vertical:recruiting] pairwise: seekout-vs-hireez — AI sourcing / talent intelligence; routes on agentic slate delivery (Spot) vs structured boolean search + diversity insights → slug: seekout-vs-hireez
- [type:comparison] [vertical:recruiting] pairwise: seekout-vs-gem — sourcing + outreach; routes on agentic sourcing depth vs all-in-one recruiting CRM + sequencing → slug: seekout-vs-gem
- [type:comparison] [vertical:revops] pairwise: default-vs-chili-piper — inbound routing/scheduling; routes on lightweight orchestration + enrichment layer vs four-product demand-conversion suite → slug: default-vs-chili-piper
- [type:comparison] [vertical:revops] pairwise: revenuehero-vs-chili-piper — inbound lead-to-meeting; routes on single-product cost efficiency vs incumbent feature breadth
- [type:comparison] [vertical:recruiting] pairwise: brighthire-vs-metaview — interview intelligence; routes on structured-hiring + ATS depth vs notes + coaching UX
- [type:comparison] [vertical:legal-ops] pairwise: icertis-vs-sirionlabs — enterprise CLM; routes on contract-intelligence platform breadth vs obligation / SRM management depth
- [type:comparison] [vertical:revops] pairwise: gainsight-vs-catalyst — CS platforms; routes on enterprise CS-Ops depth vs lean workflow customization and time-to-value
- [type:comparison] [vertical:revops] pairwise: unify-vs-11x — signal-driven vs autonomous AI SDR; routes on warm signal-led pipeline + control vs fully-autonomous outbound volume

## Workflows

- [type:workflow] [vertical:revops] mcp-server-clari-revops — MCP server exposing Clari forecast and pipeline data to Claude for natural-language forecast Q&A; artifact_type: mcp-server → slug: mcp-server-clari-revops
- [type:workflow] [vertical:revops] mcp-server-vitally-cs — MCP server exposing Vitally accounts + health into Claude for CS conversations; artifact_type: mcp-server → slug: mcp-server-vitally-cs
- [type:workflow] [vertical:legal-ops] mcp-server-clio-legal — MCP server exposing Clio matter and time data to Claude for in-house / small-firm legal queries; artifact_type: mcp-server → slug: mcp-server-clio-legal
- [type:workflow] [vertical:legal-ops] mcp-server-relativity-ediscovery — MCP server exposing Relativity workspace + review-set metadata to Claude for review-batch triage; artifact_type: mcp-server → slug: mcp-server-relativity-ediscovery
- [type:workflow] [vertical:revops] signal-bundler-account-execs-claude-skill — claude skill that bundles intent + engagement + product signals into one daily AE digest per named account; artifact_type: claude-skill → slug: signal-bundler-account-execs-claude-skill
- [type:workflow] [vertical:revops] lost-deal-postmortem-claude-skill — claude skill that turns closed-lost notes + call recordings into a structured postmortem ready for Gong/Salesforce; artifact_type: claude-skill → slug: lost-deal-postmortem-claude-skill
- [type:workflow] [vertical:revops] abm-list-quality-audit-skill — claude skill that audits an ABM list against ICP rubric and flags weak accounts with a defect taxonomy; artifact_type: claude-skill → slug: abm-list-quality-audit-skill
- [type:workflow] [vertical:revops] intent-spike-handler-n8n — n8n flow that takes an intent spike (6sense/Bombora/Common Room) and assigns + notifies + drafts first-touch outreach; artifact_type: n8n-flow → slug: intent-spike-handler-n8n
- [type:workflow] [vertical:recruiting] interview-scheduling-resolver-n8n — n8n flow that resolves recruiter↔panel↔candidate time conflicts using Google Calendar + Greenhouse data; artifact_type: n8n-flow → slug: interview-scheduling-resolver-n8n
- [type:workflow] [vertical:recruiting] candidate-personalization-at-scale-skill — claude skill that personalizes outreach to a sourced list using LinkedIn + GitHub + JD signals; artifact_type: claude-skill → slug: candidate-personalization-at-scale-skill
- [type:workflow] [vertical:legal-ops] nda-clause-redline-prompt-pack — prompt pack of paired prompts for redlining the 12 most-negotiated NDA clauses; artifact_type: prompt → slug: nda-clause-redline-prompt-pack
- [type:workflow] [vertical:legal-ops] ediscovery-custodian-questionnaire-skill — claude skill that generates a custodian interview questionnaire from a legal-hold scope; artifact_type: claude-skill → slug: ediscovery-custodian-questionnaire-skill
- [type:workflow] [vertical:cross] cursor-rules-data-engineer-ops — cursor rules tailored for an ops-adjacent data engineer (dbt + reverse-ETL + warehouse hygiene); artifact_type: cursor-rule → slug: cursor-rules-data-engineer-ops
- [type:workflow] [vertical:revops] email-deliverability-monitor-n8n — n8n flow watching DMARC failures, spam-complaint rate, and blocklist status across sending domains and alerting before suppression; artifact_type: n8n-flow → slug: email-deliverability-monitor-n8n
- [type:workflow] [vertical:revops] ai-sdr-draft-qa-skill — claude skill that QAs AI-SDR-generated outreach (claim accuracy, personalization, compliance) before it sends; artifact_type: claude-skill → slug: ai-sdr-draft-qa-skill
- [type:workflow] [vertical:recruiting] candidate-rediscovery-n8n — n8n flow that re-surfaces silver-medalist and past applicants from the ATS against a newly opened req; artifact_type: n8n-flow
- [type:workflow] [vertical:legal-ops] demand-letter-drafter-claude-skill — claude skill that drafts a personal-injury demand letter from medical records + case facts (attorney review required); artifact_type: claude-skill

## Learn

- [type:learn] [vertical:cross] definition: claude-skill-vs-mcp-server — what each is, when each fits, and how they compose for ops workflows → slug: claude-skill-vs-mcp-server
- [type:learn] [vertical:cross] definition: prompt-pack-vs-claude-skill — when a prompt library is enough vs when to package a skill → slug: prompt-pack-vs-claude-skill
- [type:learn] [vertical:cross] definition: mcp-server-explained — Model Context Protocol primer aimed at non-engineer ops leaders evaluating vendors that claim "MCP support" → slug: mcp-server-explained
- [type:learn] [vertical:cross] definition: ai-agent-for-ops — what makes an AI "agent" for ops vs a workflow; the diagnostic questions a buyer should ask vendors → slug: ai-agent-for-ops
- [type:learn] [vertical:revops] definition: ai-sdr — what AI SDR vendors actually do, the four common architectures, and how to evaluate them → slug: ai-sdr
- [type:learn] [vertical:revops] definition: product-led-sales-pls — PLS primer, the signal stack (intent, product, fit), and where Pocus/Koala/Endgame fit → slug: product-led-sales-pls
- [type:learn] [vertical:revops] concept: signal-orchestration — orchestrating buyer signals across intent, product, engagement, and ecosystem to drive plays → slug: signal-orchestration
- [type:learn] [vertical:revops] concept: forecast-categories-explained — Commit/Best/Pipeline/Omitted categories and how Clari/Aviso/BoostUp differ in defaults → slug: forecast-categories-explained
- [type:learn] [vertical:revops] policy: ai-policy-for-revops-teams — a one-page AI-use policy template for RevOps (data residency, vendor review, allowed tasks) → slug: ai-policy-for-revops-teams
- [type:learn] [vertical:recruiting] policy: ai-policy-for-recruiting-teams — AI-use policy for TA (NYC LL144 awareness, bias audits, candidate notification, vendor due-diligence) → slug: ai-policy-for-recruiting-teams
- [type:learn] [vertical:recruiting] regulation: nyc-local-law-144 — what NYC LL144 requires for AEDTs and how recruiting teams comply → slug: nyc-local-law-144
- [type:learn] [vertical:recruiting] concept: talent-intelligence-platform — what a TI platform is vs a CRM vs an ATS; vendor map and buying criteria → slug: talent-intelligence-platform
- [type:learn] [vertical:legal-ops] concept: contract-data-extraction — how AI extracts structured clause data from contracts; precision/recall tradeoffs and validation patterns → slug: contract-data-extraction
- [type:learn] [vertical:legal-ops] concept: legal-hold-process — the end-to-end legal-hold lifecycle (issue → custodian → preservation → release) and where automation helps → slug: legal-hold-process
- [type:learn] [vertical:legal-ops] concept: data-room-vs-deal-room — distinctions for legal/finance buyers and where AI document analysis applies → slug: data-room-vs-deal-room
- [type:learn] [vertical:recruiting] regulation: colorado-ai-act-sb205 — what SB 205 requires for high-risk hiring AI, the delayed timeline (enforcement paused 2026, effective Jan 2027), and what deployers should do now → primary target_question: does the Colorado AI Act apply to our hiring tools? → slug: colorado-ai-act-sb205
- [type:learn] [vertical:recruiting] concept: interview-intelligence — what interview-intelligence platforms do vs simple call recording (BrightHire/Metaview/Pillar) → primary target_question: what is interview intelligence? → slug: interview-intelligence
- [type:learn] [vertical:revops] definition: signal-driven-vs-autonomous-ai-sdr — the two AI-outbound architectures and how reply-rate and cost-per-meeting differ → primary target_question: signal-driven vs autonomous AI SDR — which is better?
- [type:learn] [vertical:revops] concept: email-deliverability-for-cold-outreach — SPF/DKIM/DMARC, one-click unsubscribe, the 0.1% complaint threshold, and warmup under 2026 Google/Microsoft sender rules → primary target_question: how do I keep cold email out of spam in 2026?
- [type:learn] [vertical:revops] definition: cpq-configure-price-quote — what CPQ is, where it sits in quote-to-cash, and when RevOps actually needs it → primary target_question: what is CPQ?
- [type:learn] [vertical:cross] concept: ai-agent-vs-rpa — how AI agents differ from RPA / workflow automation for ops, and the diagnostic questions to ask vendors → primary target_question: AI agent vs RPA — what's the difference?
- [type:learn] [vertical:cross] concept: retrieval-augmented-generation-rag — RAG explained for non-engineer ops buyers evaluating vendors that claim "grounded" answers → primary target_question: what is RAG and why does it matter for AI tools?
- [type:learn] [vertical:legal-ops] concept: legal-ai-grounding-vs-hallucination — why "grounded" legal AI (Westlaw/Lexis-backed) matters and how to evaluate citation fidelity → primary target_question: how do I know a legal AI tool won't hallucinate citations?

## Stacks

- [type:stack] [vertical:legal-ops] new entry: enterprise-clm-stack — Ironclad + DocuSign IAM + Spellbook + Litera; use case: enterprise contract lifecycle with AI-assisted drafting → slug: enterprise-clm-stack
- [type:stack] [vertical:legal-ops] new entry: ediscovery-stack — Relativity + Reveal + Logikcull (smaller matters) + Everlaw alternatives; use case: AmLaw-grade discovery review → slug: ediscovery-stack
- [type:stack] [vertical:legal-ops] new entry: legal-ops-team-of-one-stack — Ironclad-or-Juro + Spellbook + Brightflag + Notion; use case: solo in-house counsel running ops single-handed → slug: legal-ops-team-of-one-stack
- [type:stack] [vertical:recruiting] new entry: high-volume-recruiting-stack — Fountain + Paradox + Workable; use case: hourly / frontline at-scale hiring → slug: high-volume-recruiting-stack
- [type:stack] [vertical:revops] new entry: gtm-engineering-stack — Clay + n8n + HubSpot + Common Room; use case: small GTM-engineering team automating signal-to-action loops → slug: gtm-engineering-stack
- [type:stack] [vertical:revops] new entry: pls-product-led-sales-stack — Pocus + Koala + Salesforce + Slack; use case: PLG SaaS layering sales motion onto self-serve usage → slug: pls-product-led-sales-stack
- [type:stack] [vertical:revops] new entry: partner-ecosystem-stack — Crossbeam + Reveal + Salesforce + Common Room; use case: partner-led growth with ecosystem account-mapping → slug: partner-ecosystem-stack
- [type:stack] [vertical:revops] new entry: ai-sdr-stack — 11x-or-Artisan + Clay + Salesforce/HubSpot + Smartlead; use case: AI-led outbound pipeline with human QA in the loop → slug: ai-sdr-stack
- [type:stack] [vertical:revops] new entry: cold-email-infrastructure-stack — Smartlead/Instantly + secondary domains + Clay + warmup tooling; use case: deliverability-safe high-volume cold outreach
- [type:stack] [vertical:revops] new entry: inbound-conversion-stack — Default-or-Chili-Piper + Qualified + Salesforce + Slack; use case: instant inbound lead-to-meeting conversion
- [type:stack] [vertical:recruiting] new entry: ai-sourcing-stack — SeekOut/hireEZ + Gem + LinkedIn + ATS; use case: AI-assisted passive-candidate sourcing at scale
- [type:stack] [vertical:recruiting] new entry: technical-hiring-stack — CodeSignal/HackerRank + Karat + Greenhouse; use case: standardized technical screening pipeline
