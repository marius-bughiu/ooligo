import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const LOCALE = z.enum([
  "en",
  "es",
  "pt-BR",
  "ja",
  "fr",
  "de",
]);
const SLUG = z.string().regex(/^[a-z0-9-]+$/);

const baseFrontmatter = {
  slug: SLUG,
  canonical_slug: SLUG,
  locale: LOCALE,
  translated_from: z.string().optional(),
  translated_at: z.string().optional(),
  translation_model: z.string().optional(),
  source_sha256: z.string().optional(),
};

// Two clocks. `last_updated` is the body re-author date and moves only when the
// prose changes; cheap verification passes move `pricing_checked` / `en_verified`
// instead, so a genuinely current entry stays distinguishable from a date-bumped one.
const freshnessFrontmatter = {
  material_change_at: z.string().optional(),
  en_verified: z.string().optional(),
  superseded_by: SLUG.optional(),
};

const tools = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: "../../content/tools",
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
  }),
  schema: z.object({
    ...baseFrontmatter,
    verticals: z.array(SLUG).min(1),
    name: z.string().min(1),
    category: z.string(),
    subcategories: z.array(z.string()).optional(),
    pricing_model: z.enum(["free", "freemium", "flat", "usage-based", "custom"]),
    pricing_starts_at: z.number().nullable().optional(),
    pricing_url: z.string().url().optional(),
    website: z.string().url(),
    ai_native: z.boolean(),
    mcp_available: z.boolean().optional(),
    api_available: z.boolean().optional(),
    integrations: z.array(SLUG).optional(),
    ooligo_score: z.number().min(0).max(10).optional(),
    ooligo_score_breakdown: z
      .object({
        ux: z.number().min(0).max(10).optional(),
        ai_quality: z.number().min(0).max(10).optional(),
        pricing_value: z.number().min(0).max(10).optional(),
        integrations: z.number().min(0).max(10).optional(),
      })
      .optional(),
    // BODY re-author date only: moves only when the prose changes.
    // A pricing verification moves `pricing_checked` instead.
    last_updated: z.string(),
    pricing_checked: z.string().optional(),
    vendor_status: z.enum(["live", "acquired", "sunset"]).optional(),
    ...freshnessFrontmatter,
    affiliate_link: z.string().url().optional(),
  }),
});

const comparisons = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: "../../content/comparisons",
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
  }),
  schema: z
    .object({
      ...baseFrontmatter,
      type: z.enum(["pairwise", "roundup", "alternatives"]),
      tool_a: SLUG.optional(),
      tool_b: SLUG.optional(),
      tools: z.array(SLUG).optional(),
      verticals: z.array(SLUG).min(1),
      // BODY re-author date only: moves only when the prose changes.
      // A verification pass moves `en_verified` (or `pricing_checked` on tools) instead.
      last_updated: z.string(),
      ...freshnessFrontmatter,
    })
    .superRefine((val, ctx) => {
      if (val.type === "pairwise" && (!val.tool_a || !val.tool_b)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "pairwise comparisons require tool_a and tool_b",
        });
      }
      if (val.type !== "pairwise" && (!val.tools || val.tools.length < 2)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "roundup/alternatives comparisons require tools[] (>=2)",
        });
      }
    }),
});

const workflows = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: "../../content/workflows",
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
  }),
  schema: z.object({
    ...baseFrontmatter,
    verticals: z.array(SLUG).min(1),
    title: z.string().min(1),
    artifact_type: z.enum([
      "prompt",
      "claude-skill",
      "mcp-server",
      "n8n-flow",
      "cursor-rule",
      "agent-template",
      "sop",
    ]),
    tools_used: z.array(SLUG).min(1),
    roles: z.array(SLUG).min(1),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    // BODY re-author date only: moves only when the prose changes.
    // A verification pass moves `en_verified` (or `pricing_checked` on tools) instead.
    last_updated: z.string(),
    ...freshnessFrontmatter,
    time_to_setup: z.string().optional(),
    download_url: z.string().optional(),
    preview_lang: z.string().optional(),
    human_tested: z.boolean().optional(),
  }),
});

const learn = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: "../../content/learn",
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
  }),
  schema: z.object({
    ...baseFrontmatter,
    type: z.enum(["definition", "faq", "how-to", "framework", "glossary"]),
    title: z.string().min(1),
    verticals: z.array(SLUG).optional(),
    related_tools: z.array(SLUG).optional(),
    related_workflows: z.array(SLUG).optional(),
    target_questions: z.array(z.string()).min(1),
    // BODY re-author date only: moves only when the prose changes.
    // A verification pass moves `en_verified` (or `pricing_checked` on tools) instead.
    last_updated: z.string(),
    ...freshnessFrontmatter,
  }),
});

const stacks = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: "../../content/stacks",
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
  }),
  schema: z.object({
    ...baseFrontmatter,
    verticals: z.array(SLUG).min(1),
    title: z.string().min(1),
    tools: z.array(SLUG).min(2),
    use_case: z.string(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    // BODY re-author date only: moves only when the prose changes.
    // A verification pass moves `en_verified` (or `pricing_checked` on tools) instead.
    last_updated: z.string(),
    ...freshnessFrontmatter,
    related_workflows: z.array(SLUG).optional(),
  }),
});

export const collections = { tools, comparisons, workflows, learn, stacks };
