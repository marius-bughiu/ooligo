# Custodian Interview Question Library — TEMPLATE

> Replace this template's contents with questions calibrated to your firm's actual platforms, matter types, and typical custodian roles. The ediscovery-custodian-questionnaire skill reads this file on every invocation. Questions that reference tools your organization doesn't use will confuse custodians and reduce the quality of responses.
>
> This library is a starting point — not a complete set for any specific matter. Consult counsel before finalizing questions for any specific hold.

**last_updated:** {YYYY-MM-DD} — bump on every update. The skill warns when this date is more than 12 months old.

---

## Base module — Data locations

> Used on every questionnaire regardless of role or matter type.

### Q-DL-01
Please list all locations where you store work-related documents and files. Include: email accounts (company and personal), shared drives (SharePoint, Google Drive, Box, Dropbox), local folders on your computer, USB drives, and any external hard drives.

**Rationale:** Open-ended first question to inventory all obvious sources before probing specific platforms. Intentionally broad.

### Q-DL-02
Do you use any personal cloud storage (Dropbox personal, Google Drive personal, iCloud Drive, OneDrive personal) to store work-related files or email attachments?

**Rationale:** Custodians often move files to personal cloud for convenience; this is a common gap in corporate holds.

### Q-DL-03
Do you have access to shared network drives or departmental SharePoint/Teams sites? If yes, please list the drive paths or site names.

**Rationale:** Shared drives hold the custodian's contributions to collaborative work and may hold documents relevant to the matter that are not in their personal email.

### Q-DL-04
Have you ever stored work-related files on a device that is no longer in your possession (e.g. a prior company laptop, a device you returned to IT, a personally-owned device you no longer use)?

**Rationale:** Captures devices that may have been wiped or disposed of and is an early spoliation-risk indicator.

---

## Base module — Communication channels

> Used on every questionnaire.

### Q-CC-01
What platforms do you use for work-related communications? Please list every platform, including those used informally: Slack, Microsoft Teams, Zoom chat, Google Chat, WhatsApp, iMessage, SMS, personal email, LinkedIn messages, and any others.

**Rationale:** Informal channels are routinely underreported. Asking by name significantly improves completeness.

### Q-CC-02
Do you use any encrypted or ephemeral messaging apps for work-related communications? Examples include Signal, Telegram, Wickr, Confide, or Snapchat.

**Rationale:** Off-channel apps are a significant e-discovery gap and may be subject to preservation obligations. Consult counsel if custodian confirms use.

### Q-CC-03
Have you ever used a personal email account (not your company-issued address) to send, receive, or forward work-related communications? If yes, which account(s)?

**Rationale:** Personal email use for work is common; these accounts are outside corporate archive and require separate preservation steps. Consult counsel on collection approach.

### Q-CC-04
Are you aware of any communications on any platform that you believe may be relevant to the matter described in your legal-hold notice?

**Rationale:** Open-ended cue that encourages the custodian to surface items they believe are relevant, which may include platforms or topics not covered by earlier questions.

---

## Base module — Device inventory

> Used on every questionnaire.

### Q-DV-01
List all devices — company-issued and personal — that you used for work-related activities during the relevant period: laptops, desktop computers, tablets, smartphones, and any other devices.

**Rationale:** Complete device inventory is required before IT can issue appropriate preservation instructions.

### Q-DV-02
Have any of the devices listed above been replaced, repaired, wiped, or disposed of since [HOLD_DATE_START]? If yes, what happened to the data on that device?

**Rationale:** Key spoliation-risk indicator. [HOLD_DATE_START] is automatically populated from the hold scope.

### Q-DV-03
Do you use a mobile device management (MDM) profile on your personal phone for company email or apps? Do you know whether your company email is backed up by the company system on your personal device?

**Rationale:** MDM enrollment means IT may already have visibility into the device; the answer determines whether separate custodian action is needed.

---

## Base module — Data retention practices

> Used on every questionnaire.

### Q-RT-01
Do you have any auto-delete or auto-archive settings configured on any of your email accounts? If yes, after how many days are messages deleted?

**Rationale:** Auto-delete settings during the relevant period are a primary spoliation flag.

### Q-RT-02
Do you regularly clear your instant-messaging history on any platform (Slack, Teams, etc.)? If yes, which platforms and how often?

**Rationale:** Manual deletion during the hold period may be spoliation depending on notice date; captures the custodian's retention habits.

### Q-RT-03
Did you receive a legal-hold notice for this matter? When did you receive it? Did you take any steps in response to the notice?

**Rationale:** Confirms actual receipt of the hold and the custodian's response — both are important for the hold-compliance record and for identifying any deletions that postdate notice.

---

## Role module — Executive

> Add to questionnaire when `custodian_role` = `executive`.

### Q-EXEC-01
Do you use any board-communication platforms (Diligent, Boardvantage, OnBoard) or board-meeting-minutes systems? If yes, do you retain copies of board materials on your devices?

### Q-EXEC-02
Does an executive assistant or administrative support staff manage your calendar, email, or documents? If yes, what platforms does your assistant use on your behalf?

### Q-EXEC-03
Do you use any apps configured specifically to avoid corporate archiving — for example, apps with automatic message deletion or end-to-end encryption not covered by the corporate archive?

---

## Role module — Sales operations

> Add to questionnaire when `custodian_role` = `sales_ops`.

### Q-SALES-01
Which CRM system(s) do you use to manage customer records, deal pipelines, and communications? (e.g. Salesforce, HubSpot, Dynamics)

### Q-SALES-02
Do you export CRM data to local spreadsheets, Google Sheets, or Excel files? If yes, where are those files stored?

### Q-SALES-03
Are you involved in pricing approvals, contract modifications, or discount authorizations? If yes, where are those approval records maintained?

### Q-SALES-04
Do you maintain contact with customers or prospects outside the CRM using personal email or messaging apps?

---

## Role module — Finance

> Add to questionnaire when `custodian_role` = `finance`.

### Q-FIN-01
Which financial systems do you use for transaction processing, reporting, or approvals? (e.g. NetSuite, SAP, QuickBooks, Coupa)

### Q-FIN-02
Do you retain local copies of financial reports, budget models, or reconciliation files on your device or personal cloud storage?

### Q-FIN-03
Are you involved in wire approvals, vendor payment authorizations, or intercompany transfers? Where are those approval records maintained?

---

## Role module — Engineering

> Add to questionnaire when `custodian_role` = `engineering`.

### Q-ENG-01
Which version-control repositories do you have access to (GitHub, GitLab, Bitbucket, Azure DevOps)? Are any repositories hosted outside the company organization?

### Q-ENG-02
Do you use project or issue-tracking tools (Jira, Linear, Asana, GitHub Issues)? Are your comments, assignments, and history in those tools?

### Q-ENG-03
Do you have copies of source code, technical designs, or API specifications on personal devices or personal cloud storage?

---

## Role module — IT

> Add to questionnaire when `custodian_role` = `it`.

### Q-IT-01
What email archiving and e-discovery platforms does the company use? Are you the administrator?

### Q-IT-02
What is the company's current email retention policy? Have there been any changes to the retention policy in the past 24 months?

### Q-IT-03
Has the company's email archive configuration or backup schedule changed since [HOLD_DATE_START]?

### Q-IT-04
Are any IT systems scheduled for decommission, migration, or replacement in the next 90 days?

---

## Matter-type module — Commercial litigation

> Add to questionnaire when `matter_type` = `commercial_litigation`.

### Q-LIT-01
Are you aware of any communications with [COUNTERPARTY_NAME] or its employees during the relevant period? On which platforms?

### Q-LIT-02
Do you have any documents related to [KEY_ISSUES_SUMMARY]? Where are those documents located?

### Q-LIT-03
Were you involved in the negotiation, approval, or performance of the contract or transaction at issue? If yes, describe your role.

---

## Matter-type module — Regulatory

> Add to questionnaire when `matter_type` = `regulatory`.

### Q-REG-01
Have you ever received a request for documents or information from any government agency, regulator, or law enforcement related to the subject matter of this hold?

### Q-REG-02
Are you aware of any prior compliance reviews, internal audits, or investigations related to the subject matter?

### Q-REG-03
Have you communicated with external legal counsel specifically about regulatory compliance in the relevant area? On which platforms?

---

## Matter-type module — Internal investigation

> Add to questionnaire when `matter_type` = `internal_investigation`. Consult counsel before using — internal investigations may have distinct privilege and employment-law considerations that affect which questions are appropriate.

### Q-INV-01
Are you aware of any complaints, concerns, or incidents related to the subject matter of this investigation that were reported to HR, legal, or management?

### Q-INV-02
Have you communicated with any individual about the subject matter of this investigation outside of normal business channels?

### Q-INV-03
Are there any documents, communications, or records related to the subject matter that you believe the investigating team should be aware of?
