"""Tool policy for the Workable MCP gateway.

Workable's hosted server exposed 94 tools as of 2026-07-20. This module decides
which of them reach the model, and which of the survivors need a human to say yes
before they run.

Three tiers plus a redaction list:

  DENY      never forwarded, never listed. Identity, org structure, approvals,
            payroll records, HRIS reads, and the irreversible review writes.
  CONFIRM   forwarded only after a dry-run the human approved. See
            server.workable_stage_move_review.
  ALLOW     forwarded as-is. Reads plus one additive write (add_comment).
  REDACT    applies to every forwarded response: named fields are stripped
            before the payload reaches model context.

Edit RECRUITER_PROFILE for your own org. The assignments below are the
recruiter / recruiting-ops profile: 33 of 94 tools exposed, 61 withheld.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class Tier(str, Enum):
    ALLOW = "allow"
    CONFIRM = "confirm"
    DENY = "deny"


# ---------------------------------------------------------------------------
# DENY - the surface an assistant never gets, on any profile.
# ---------------------------------------------------------------------------

# Members: an agent that can grant a permission set can widen its own reach on
# the next session, because the hosted server inherits the signed-in user's role.
DENY_IDENTITY = {
    "invite_member",
    "update_member",
    "enable_member",
    "delete_member",
}

# Departments: merge_department has no inverse. Recruiting reporting is cut by
# department, so a bad merge silently rewrites every historical funnel report.
DENY_ORG_STRUCTURE = {
    "create_department",
    "update_department",
    "delete_department",
    "merge_department",
}

# Approvals are an act of authority by a named human. Delegating them to an
# assistant destroys the only evidence that a person made the decision.
DENY_APPROVALS = {
    "approve_offer",
    "reject_offer",
    "approve_requisition",
    "reject_requisition",
    "update_timeoff_approval",
}

# Payroll-adjacent. A wrong or duplicated time entry becomes a pay error, and
# bulk_create_time_entries makes that a bulk pay error.
DENY_TIME_TRACKING = {
    "list_time_entries",
    "create_time_entry",
    "clock_in",
    "clock_out",
    "bulk_create_time_entries",
    "update_time_entry",
}

# submit_review is final - Workable's docs note a second submit fails - and
# sign_review is an attestation. An agent retrying a timed-out call must not be
# able to reach either. The reads go too: review content is manager-confidential
# and has no recruiting use.
DENY_PERFORMANCE = {
    "get_review_cycle_templates",
    "get_review_cycle_template",
    "create_review_cycle_template",
    "get_review_cycles",
    "get_review_cycle",
    "list_review_tasks",
    "get_review_form",
    "update_review_form",
    "mark_review_task_ready",
    "get_review",
    "submit_review",
    "share_review",
    "sign_review",
    "get_review_aggregate",
    "list_review_cycle_answers",
}

# HR reads that are not recruiting reads. Employee documents hold contracts, comp
# letters, and visa or medical paperwork. Time-off records are absence data. The
# profile-update feed is a change log over personal data.
DENY_HRIS_READS = {
    "get_employees",
    "get_employee",
    "get_employee_documents",
    "get_employee_fields",
    "get_employee_filter_options",
    "search_employees",
    "get_profile_update_fields",
    "get_profile_update_filter_options",
    "search_profile_updates",
    "get_timeoff_requests",
    "get_timeoff_balances",
    "get_timeoff_categories",
    "create_timeoff_request",
    "get_work_schedules",
}

DENY: set[str] = (
    DENY_IDENTITY
    | DENY_ORG_STRUCTURE
    | DENY_APPROVALS
    | DENY_TIME_TRACKING
    | DENY_PERFORMANCE
    | DENY_HRIS_READS
)

# ---------------------------------------------------------------------------
# CONFIRM - reachable, but each call needs an explicit human yes first.
# ---------------------------------------------------------------------------

CONFIRM: set[str] = {
    "move_candidate",
    "disqualify_candidate",
    "revert_disqualification",
    "relocate_candidate",
    "copy_candidate",
    "create_candidate",
    "create_talent_pool_candidate",
    "update_candidate",
    "update_candidate_tags",
    "upsert_candidate_rating",
    "add_review",
    "create_requisition",
    "update_requisition",
}

# ---------------------------------------------------------------------------
# ALLOW - the recruiter profile. 33 tools: 32 reads plus add_comment.
# ---------------------------------------------------------------------------

ALLOW: set[str] = {
    # Accounts. get_accounts is the only tool that takes no account parameter.
    "get_accounts",
    # Jobs (9)
    "get_jobs",
    "search_jobs",
    "get_job",
    "get_job_activities",
    "get_job_application_form",
    "get_job_custom_attributes",
    "get_job_members",
    "get_job_recruiters",
    "get_job_stages",
    # Candidate reads (6)
    "get_candidates",
    "get_candidate",
    "get_candidate_activities",
    "get_candidate_activity",
    "get_candidate_offer",
    "get_candidate_files",
    # Offers, requisitions, members - read only (5)
    "get_offer",
    "get_requisitions",
    "get_requisition",
    "get_members",
    "get_permission_sets",
    # Pipeline and account config (3)
    "get_stages",
    "get_disqualification_reasons",
    "get_account_custom_attributes",
    # Org context (2)
    "get_orgchart",
    "get_departments",
    # Advanced search over candidates - Premier+ and Enterprise plans only (3)
    "get_candidate_detailed_fields",
    "get_candidate_detailed_filter_options",
    "search_candidates_detailed",
    # Remaining context reads (3)
    "get_legal_entities",
    "get_events",
    "get_event",
    # The one additive write. Appends to the candidate activity feed: visible to
    # the recruiter, attributable, and removable in the Workable UI.
    "add_comment",
}

# ---------------------------------------------------------------------------
# REDACT - response fields stripped before the payload enters model context.
# ---------------------------------------------------------------------------
#
# Workable candidate records can carry self-identification data collected for
# EEO/OFCCP reporting. That data has a lawful purpose and a hiring conversation
# is not it. Field names vary by account: confirm yours with
# get_account_custom_attributes and get_candidate_detailed_fields, then edit.

REDACT_FIELDS: set[str] = {
    "ethnicity",
    "race",
    "gender",
    "veteran_status",
    "disability_status",
    "date_of_birth",
    "national_id",
    "social_security_number",
    "salary",
    "current_salary",
    "salary_expectations",
}


@dataclass(frozen=True)
class Policy:
    """Resolved policy for one gateway process."""

    allow: set[str] = field(default_factory=lambda: set(ALLOW))
    confirm: set[str] = field(default_factory=lambda: set(CONFIRM))
    deny: set[str] = field(default_factory=lambda: set(DENY))
    redact_fields: set[str] = field(default_factory=lambda: set(REDACT_FIELDS))

    def tier(self, tool_name: str) -> Tier:
        if tool_name in self.deny:
            return Tier.DENY
        if tool_name in self.confirm:
            return Tier.CONFIRM
        if tool_name in self.allow:
            return Tier.ALLOW
        # Default-deny. Workable added 37 tools in a single release on
        # 2026-07-20; anything that appears upstream after this file was written
        # stays dark until a human classifies it.
        return Tier.DENY

    def is_exposed(self, tool_name: str) -> bool:
        return self.tier(tool_name) in (Tier.ALLOW, Tier.CONFIRM)


RECRUITER_PROFILE = Policy()
