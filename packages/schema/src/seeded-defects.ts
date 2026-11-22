import { z } from "zod";

/**
 * Seeded-defect manifest (one per fixture, `fixtures/<fixture>/seeded-defects.json`). Not a stored record: it has no
 * id or createdAt and is deliberately NOT part of `recordSchemas`.
 *
 * "Detectable" means detectable by the built-in deterministic check packs (architecture.md §16) without an authored
 * expectation. It is fixed per category here, before any check exists (prd.md AC-01). The fixture probes that back
 * each entry establish structural ground truth (the defect is planted in the defective variant and absent in the clean
 * one); they do not show that any QA Sentinel check detects it. That measurement belongs to later phases.
 *
 * JSON Schema cannot express the cross-field rules below, so a JSON Schema match is not full validation.
 */
export const SEEDED_DEFECT_CATEGORIES = [
  "reachability",
  "runtime-error",
  "accessibility",
  "security-headers",
  "response-size-time",
  "form-structure",
  "business-logic",
] as const;
export type SeededDefectCategory = (typeof SEEDED_DEFECT_CATEGORIES)[number];

export const OBSERVABLES = [
  "http-status",
  "script-evaluation",
  "html-structure",
  "response-header",
  "response-size",
  "response-time",
  "authored-expectation",
] as const;
export type Observable = (typeof OBSERVABLES)[number];

// `Readonly` and `readonly` types protect only at compile time, and the validation below reads these tables dynamically.
// So the tables, their nested arrays and the two vocabularies are frozen at runtime as well.
Object.freeze(SEEDED_DEFECT_CATEGORIES);
Object.freeze(OBSERVABLES);

function freezeTable<T extends object>(table: T): Readonly<T> {
  for (const value of Object.values(table)) if (Array.isArray(value)) Object.freeze(value);
  return Object.freeze(table);
}

// Exhaustive Records: adding a category without every mapping is a compile error.
export const CATEGORY_DETECTABLE: Readonly<Record<SeededDefectCategory, boolean>> = freezeTable<Record<SeededDefectCategory, boolean>>({
  reachability: true,
  "runtime-error": true,
  accessibility: true,
  "security-headers": true,
  "response-size-time": true,
  "form-structure": true,
  "business-logic": false,
});

export const CATEGORY_OBSERVABLES: Readonly<Record<SeededDefectCategory, readonly Observable[]>> = freezeTable<
  Record<SeededDefectCategory, readonly Observable[]>
>({
  reachability: ["http-status"],
  "runtime-error": ["script-evaluation", "http-status"],
  accessibility: ["html-structure"],
  "security-headers": ["response-header"],
  "response-size-time": ["response-size", "response-time"],
  "form-structure": ["html-structure"],
  "business-logic": ["authored-expectation"],
});

export const CATEGORY_ID_TOKEN: Readonly<Record<SeededDefectCategory, string>> = freezeTable<Record<SeededDefectCategory, string>>({
  reachability: "reach",
  "runtime-error": "rt",
  accessibility: "a11y",
  "security-headers": "sec",
  "response-size-time": "perf",
  "form-structure": "form",
  "business-logic": "logic",
});

/** Any fixture, present or future (for example "demo-shop"); only the format is checked here. */
const FIXTURE_ID = /^[a-z][a-z0-9-]{1,31}$/;
// No .trim(): that would transform parsed values, and JSON Schema cannot express a transformation. The constraints are
// plain: 1..max characters of the raw string, at least one non-whitespace character. Valid strings are kept as given.
// Lengths are Unicode code points: zod's min/max count code points in the pinned zod, which is what JSON Schema
// minLength/maxLength count, and tests/schema/seeded-defects-json-schema.test.ts checks the two against an independent
// JSON Schema validator. A zod upgrade must re-run that test. Strings that are not well-formed Unicode (lone surrogates)
// are outside that check and are not part of any compatibility guarantee.
const text = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .regex(/\S/, "must contain a non-whitespace character");

export const seededDefectLocationSchema = z.strictObject({
  method: z.enum(["GET", "POST"]),
  path: z
    .string()
    .max(200)
    .regex(/^\/(?!\/)[^\s?#]*$/, "an absolute path without query, fragment, whitespace or a leading //"),
});

export const seededDefectSchema = z
  .strictObject({
    id: z.string().regex(/^SD-[a-z0-9]+-\d{3}$/),
    category: z.enum(SEEDED_DEFECT_CATEGORIES),
    title: text(120),
    description: text(500),
    locations: z.array(seededDefectLocationSchema).min(1),
    detectable: z.boolean(),
    observable: z.enum(OBSERVABLES),
    rationale: text(500),
  })
  .superRefine((d, ctx) => {
    const bad = (path: string, message: string): void => ctx.addIssue({ code: "custom", path: [path], message });
    if (d.detectable !== CATEGORY_DETECTABLE[d.category]) {
      bad("detectable", `category ${d.category} is fixed as detectable=${String(CATEGORY_DETECTABLE[d.category])}`);
    }
    if (!CATEGORY_OBSERVABLES[d.category].includes(d.observable)) bad("observable", `${d.observable} is not allowed for ${d.category}`);
    if (d.id.split("-")[1] !== CATEGORY_ID_TOKEN[d.category]) bad("id", `the id token must be ${CATEGORY_ID_TOKEN[d.category]} for ${d.category}`);
    const keys = d.locations.map((l) => `${l.method} ${l.path}`);
    if (new Set(keys).size !== keys.length) bad("locations", "duplicate location");
  });

export const seededDefectManifestSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    fixture: z.string().regex(FIXTURE_ID),
    set: z.enum(["development", "heldout"]),
    checksFrozenAtCommit: z
      .string()
      .regex(/^[0-9a-f]{40}$/)
      .nullable(),
    defects: z.array(seededDefectSchema),
  })
  .superRefine((m, ctx) => {
    const bad = (path: (string | number)[], message: string): void => ctx.addIssue({ code: "custom", path, message });
    const ids = m.defects.map((d) => d.id);
    if (new Set(ids).size !== ids.length) bad(["defects"], "duplicate defect id");
    if (m.set === "development" && m.checksFrozenAtCommit !== null) {
      bad(["checksFrozenAtCommit"], "a development manifest records no freeze commit");
    }
    if (m.set === "heldout" && m.defects.length > 0 && m.checksFrozenAtCommit === null) {
      bad(["checksFrozenAtCommit"], "a held-out defect needs the commit at which the checks were frozen");
    }
  });

/** JSON Schema (draft 2020-12) of the manifest. Cross-field rules are enforced by the zod schemas only. */
export function exportSeededDefectJsonSchema(): unknown {
  return z.toJSONSchema(seededDefectManifestSchema);
}
