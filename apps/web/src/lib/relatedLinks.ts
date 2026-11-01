/** Editorial starting points for reader tasks, not vendor rankings. */
export const VERTICAL_LINKS: Record<string, {
  tools: readonly string[];
  workflows: readonly string[];
  comparisons: readonly string[];
  learn: readonly string[];
}> = {
  revops: {
    // Evaluate enrichment, inspect the runnable example, then connect CRM and routing.
    tools: ["clay", "apollo", "claude", "hubspot", "salesforce", "n8n"],
    workflows: ["lead-enrichment-clay-claude", "lead-scoring-icp-rubric-skill", "hubspot-agent-cli-crm-cleanup-skill", "inbound-lead-triage-n8n", "weekly-pipeline-report-skill", "enrichment-credit-burn-monitor-n8n"],
    comparisons: ["clay-vs-apollo", "apollo-vs-zoominfo", "hubspot-vs-salesforce", "n8n-vs-zapier"],
    learn: ["data-enrichment-strategies", "waterfall-enrichment", "crm-hygiene", "lead-scoring"],
  },
  "legal-ops": {
    // Contract review, intake, evidence checking and matter operations.
    tools: ["spellbook", "ironclad", "harvey", "everlaw", "clio", "claude"],
    workflows: ["contract-redline-claude-skill", "clause-extraction-claude-skill", "legal-request-intake-router-n8n", "citation-verification-claude-skill", "privilege-review-batch-skill", "matter-status-digest-claude"],
    comparisons: ["harvey-vs-spellbook", "ironclad-vs-juro", "everlaw-vs-relativity", "clio-vs-mycase"],
    learn: ["contract-review-sop", "clm-vs-cms", "legal-ai-grounding-vs-hallucination", "legal-intake"],
  },
  recruiting: {
    // Sourcing, ATS selection and structured interview decisions.
    tools: ["gem", "seekout", "ashby", "greenhouse", "metaview", "claude"],
    workflows: ["candidate-sourcing-claude-skill", "inbound-applicant-triage-n8n", "interview-loop-builder-skill", "interview-debrief-summary-skill", "screening-score-variance-audit-skill", "reference-check-summary-skill"],
    comparisons: ["seekout-vs-gem", "ashby-vs-greenhouse", "brighthire-vs-metaview", "gem-vs-hireez"],
    learn: ["ai-sourcing", "ats-vs-recruiting-crm", "structured-interviewing", "ai-screening-bias"],
  },
  "customer-success": {
    // Customer health, churn review, renewal preparation and onboarding.
    tools: ["gainsight", "churnzero", "vitally", "hubspot", "gong", "claude"],
    workflows: ["customer-health-score-n8n", "churn-risk-summarizer-claude", "cs-renewal-playbook-skill", "qbr-prep-skill", "usage-drop-alert-n8n", "expansion-signal-detection-claude"],
    comparisons: ["gainsight-vs-churnzero", "churnzero-vs-vitally", "gainsight-vs-vitally", "rocketlane-vs-arrows"],
    learn: ["customer-health-score", "renewal-management", "quarterly-business-review", "customer-onboarding"],
  },
};

export const TOOL_LINKS: Record<string, {
  alternatives: readonly string[];
  workflows: readonly string[];
  comparisons: readonly string[];
  learn: readonly string[];
}> = {
  clay: {
    alternatives: ["apollo", "zoominfo", "cognism"],
    workflows: ["lead-enrichment-clay-claude", "icp-account-list-builder-clay", "lead-scoring-icp-rubric-skill", "enrichment-credit-burn-monitor-n8n"],
    comparisons: ["clay-vs-apollo", "clay-vs-zoominfo", "alternatives-to-clay", "best-data-enrichment-tools"],
    learn: ["data-enrichment-strategies", "waterfall-enrichment", "lead-scoring"],
  },
  apollo: {
    alternatives: ["clay", "zoominfo", "cognism"],
    // This includes an alternative enrichment workflow, not a claim that it uses Apollo.
    workflows: ["lead-enrichment-clay-claude", "mcp-server-apollo-revops", "lead-scoring-icp-rubric-skill", "icp-account-list-builder-clay"],
    comparisons: ["clay-vs-apollo", "apollo-vs-zoominfo", "apollo-vs-outreach", "amplemarket-vs-apollo"],
    learn: ["data-enrichment-strategies", "waterfall-enrichment", "lead-scoring"],
  },
  claude: {
    alternatives: ["chatgpt", "mistral", "perplexity"],
    // One concrete use case per vertical, led by the inspected offline example.
    workflows: ["lead-enrichment-clay-claude", "contract-redline-claude-skill", "candidate-sourcing-claude-skill", "churn-risk-summarizer-claude"],
    comparisons: ["claude-vs-chatgpt", "claude-vs-cursor", "claude-vs-perplexity", "alternatives-to-claude"],
    learn: ["data-enrichment-strategies", "claude-skill-vs-mcp-server", "prompt-pack-vs-claude-skill"],
  },
};

interface LinkData {
  slug: string;
  locale: string;
  verticals?: readonly string[];
  category?: string;
  subcategories?: readonly string[];
  type?: string;
  tool_a?: string;
  tool_b?: string;
  tools?: readonly string[];
  tools_used?: readonly string[];
  related_tools?: readonly string[];
  related_workflows?: readonly string[];
}
interface Entry { data: LinkData; }
interface Catalog<T extends Entry, W extends Entry, C extends Entry, L extends Entry> {
  tools: readonly T[];
  workflows: readonly W[];
  comparisons: readonly C[];
  learn: readonly L[];
}

const overlap = (left: readonly string[] = [], right: readonly string[] = []) =>
  new Set(left.filter(value => right.includes(value))).size;
const comparisonTools = (data: LinkData): readonly string[] => data.type === "pairwise"
  ? [data.tool_a, data.tool_b].filter((value): value is string => Boolean(value))
  : data.tools ?? [];

/** Stable tie-breaking never depends on filesystem order, dates or editorial scores. */
export function prioritizeLinks<T extends Entry>(entries: readonly T[], options: {
  locale: string;
  preferred?: readonly string[];
  eligible?: (entry: T) => boolean;
  relevance?: (entry: T) => number;
  limit: number;
}): T[] {
  const preferred = options.preferred ?? [];
  const priority = (slug: string) => {
    const index = preferred.indexOf(slug);
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  const seen = new Set<string>();
  return entries
    .filter(entry => entry.data.locale === options.locale && (!options.eligible || options.eligible(entry)))
    .slice()
    .sort((a, b) => priority(a.data.slug) - priority(b.data.slug)
      || (options.relevance?.(b) ?? 0) - (options.relevance?.(a) ?? 0)
      || (a.data.slug < b.data.slug ? -1 : a.data.slug > b.data.slug ? 1 : 0))
    .filter(entry => {
      if (seen.has(entry.data.slug)) return false;
      seen.add(entry.data.slug);
      return true;
    })
    .slice(0, Math.max(0, options.limit));
}

export function selectVerticalLinks<T extends Entry, W extends Entry, C extends Entry, L extends Entry>(
  catalog: Catalog<T, W, C, L>, locale: string, vertical: string, starterTools: readonly string[],
) {
  const curated = VERTICAL_LINKS[vertical];
  const belongs = (entry: Entry) => (entry.data.verticals ?? []).includes(vertical);
  const contextTools = curated?.tools ?? starterTools;
  const workflows = prioritizeLinks<W>(catalog.workflows, {
    locale, preferred: curated?.workflows, eligible: belongs, limit: 6,
    relevance: entry => overlap(entry.data.tools_used, contextTools),
  });
  const workflowSlugs = workflows.map(entry => entry.data.slug);
  return {
    tools: prioritizeLinks<T>(catalog.tools, {
      locale, preferred: [...contextTools, ...starterTools], eligible: belongs, limit: 6,
      relevance: entry => workflows.filter(workflow => workflow.data.tools_used?.includes(entry.data.slug)).length,
    }),
    workflows,
    comparisons: prioritizeLinks<C>(catalog.comparisons, {
      locale, preferred: curated?.comparisons, eligible: belongs, limit: 4,
      relevance: entry => overlap(comparisonTools(entry.data), contextTools),
    }),
    learn: prioritizeLinks<L>(catalog.learn, {
      locale, preferred: curated?.learn, eligible: belongs, limit: 4,
      relevance: entry => 2 * overlap(entry.data.related_workflows, workflowSlugs) + overlap(entry.data.related_tools, contextTools),
    }),
  };
}

export function selectToolLinks<T extends Entry, W extends Entry, C extends Entry, L extends Entry>(
  catalog: Catalog<T, W, C, L>, tool: LinkData,
) {
  const curated = TOOL_LINKS[tool.slug];
  const sharedVertical = (entry: Entry) => overlap(entry.data.verticals, tool.verticals) > 0;
  const counterparts = catalog.comparisons
    .filter(entry => entry.data.locale === tool.locale && entry.data.type === "pairwise" && comparisonTools(entry.data).includes(tool.slug))
    .flatMap(entry => comparisonTools(entry.data)).filter(slug => slug !== tool.slug);
  const alternatives = prioritizeLinks<T>(catalog.tools, {
    locale: tool.locale, preferred: curated?.alternatives, limit: 3,
    eligible: entry => entry.data.slug !== tool.slug && (entry.data.category === tool.category
      || sharedVertical(entry) && (counterparts.includes(entry.data.slug) || Boolean(curated?.alternatives.includes(entry.data.slug)))),
    relevance: entry => (counterparts.includes(entry.data.slug) ? 100 : 0)
      + 2 * overlap(entry.data.subcategories, tool.subcategories) + overlap(entry.data.verticals, tool.verticals),
  });
  const workflows = prioritizeLinks<W>(catalog.workflows, {
    locale: tool.locale, preferred: curated?.workflows, limit: 4,
    eligible: entry => (entry.data.tools_used ?? []).includes(tool.slug)
      || Boolean(curated?.workflows.includes(entry.data.slug) && sharedVertical(entry)),
    relevance: entry => overlap(entry.data.verticals, tool.verticals)
      + overlap(entry.data.tools_used, alternatives.map(alternative => alternative.data.slug)),
  });
  return {
    alternatives,
    workflows,
    comparisons: prioritizeLinks<C>(catalog.comparisons, {
      locale: tool.locale, preferred: curated?.comparisons, limit: 4,
      eligible: entry => comparisonTools(entry.data).includes(tool.slug),
      relevance: entry => (entry.data.type === "pairwise" ? 100 : 0)
        + overlap(comparisonTools(entry.data), alternatives.map(alternative => alternative.data.slug)),
    }),
    learn: prioritizeLinks<L>(catalog.learn, {
      locale: tool.locale, preferred: curated?.learn, limit: 3,
      eligible: entry => (entry.data.related_tools ?? []).includes(tool.slug)
        || Boolean(curated?.learn.includes(entry.data.slug) && sharedVertical(entry)),
      relevance: entry => 2 * overlap(entry.data.related_workflows, workflows.map(workflow => workflow.data.slug))
        + overlap(entry.data.verticals, tool.verticals),
    }),
  };
}
