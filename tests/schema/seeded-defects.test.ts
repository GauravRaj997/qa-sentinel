import { describe, expect, it } from "vitest";
import {
  CATEGORY_DETECTABLE,
  CATEGORY_ID_TOKEN,
  CATEGORY_OBSERVABLES,
  OBSERVABLES,
  SEEDED_DEFECT_CATEGORIES,
  exportJsonSchemas,
  exportSeededDefectJsonSchema,
  recordSchemas,
  seededDefectManifestSchema,
  seededDefectSchema,
} from "@qa-sentinel/schema";

type Obj = Record<string, unknown>;

const reach = (over: Obj = {}): Obj => ({
  id: "SD-reach-001",
  category: "reachability",
  title: "Archived products link returns 404",
  description: "The navigation links to a page that answers 404.",
  locations: [{ method: "GET", path: "/products/archive" }],
  detectable: true,
  observable: "http-status",
  rationale: "A client following the link sees status 404.",
  ...over,
});
const logic = (over: Obj = {}): Obj => ({
  id: "SD-logic-001",
  category: "business-logic",
  title: "Cart total ignores quantity",
  description: "The total is computed without quantity.",
  locations: [{ method: "GET", path: "/cart" }],
  detectable: false,
  observable: "authored-expectation",
  rationale: "Needs an independent authored expectation.",
  ...over,
});
const manifest = (over: Obj = {}): Obj => ({
  schemaVersion: 1,
  fixture: "demo-shop",
  set: "development",
  checksFrozenAtCommit: null,
  defects: [reach(), logic()],
  ...over,
});
const ok = (m: unknown): boolean => seededDefectManifestSchema.safeParse(m).success;
const entryOk = (e: unknown): boolean => seededDefectSchema.safeParse(e).success;
const HEX40 = "0123456789abcdef0123456789abcdef01234567";

describe("seeded-defect manifest: shape", () => {
  it("accepts a reachability entry and a business-logic entry (the two reference examples)", () => {
    expect(seededDefectManifestSchema.parse(manifest())).toMatchObject({ fixture: "demo-shop", set: "development" });
  });

  it("rejects unknown keys at manifest and entry level, including any expected-result field", () => {
    expect(ok(manifest({ extra: 1 }))).toBe(false);
    expect(entryOk(reach({ extra: 1 }))).toBe(false);
    expect(entryOk(logic({ expected: 42 }))).toBe(false);
    expect(entryOk(reach({ probe: "SD-reach-001" }))).toBe(false); // the redundant probe field was dropped
  });

  it("rejects a wrong schemaVersion, an unknown category and an unknown observable", () => {
    expect(ok(manifest({ schemaVersion: 2 }))).toBe(false);
    expect(entryOk(reach({ category: "performance" }))).toBe(false);
    expect(entryOk(reach({ observable: "screenshot" }))).toBe(false);
  });

  it("rejects empty or oversized text and an empty locations list", () => {
    expect(entryOk(reach({ title: " " }))).toBe(false);
    expect(entryOk(reach({ title: "x".repeat(121) }))).toBe(false);
    expect(entryOk(reach({ description: "x".repeat(501) }))).toBe(false);
    expect(entryOk(reach({ rationale: "" }))).toBe(false);
    expect(entryOk(reach({ locations: [] }))).toBe(false);
  });

  it.each(["/a?x=1", "/a#f", "//host/x", "x", "/a b", "", "/" + "a".repeat(200)])("rejects the location path %j", (path) => {
    expect(entryOk(reach({ locations: [{ method: "GET", path }] }))).toBe(false);
  });

  it.each(["/", "/products/archive", "/js/cart.js", "/reports/daily"])("accepts the location path %j", (path) => {
    expect(entryOk(reach({ locations: [{ method: "GET", path }] }))).toBe(true);
  });

  it("rejects a method other than GET or POST and a duplicate location inside one entry", () => {
    expect(entryOk(reach({ locations: [{ method: "DELETE", path: "/x" }] }))).toBe(false);
    const dup = { method: "GET", path: "/x" };
    expect(entryOk(reach({ locations: [dup, { ...dup }] }))).toBe(false);
    expect(entryOk(reach({ locations: [dup, { method: "POST", path: "/x" }] }))).toBe(true);
  });

  it.each(["SD-reach-1", "sd-reach-001", "SD-reach-0001", "reach-001", "SD--001"])("rejects the id %j", (id) => {
    expect(entryOk(reach({ id }))).toBe(false);
  });
});

describe("seeded-defect manifest: text fields", () => {
  const FIELDS: [string, number][] = [["title", 120], ["description", 500], ["rationale", 500]];

  it.each(FIELDS)("%s: whitespace-only strings are rejected (spaces, tab and newline, no-break and em space)", (field) => {
    for (const s of [" ", "   ", "\t\n", " ", " ", " \r\n\t "]) {
      expect(entryOk(reach({ [field]: s })), JSON.stringify(s)).toBe(false);
    }
    expect(entryOk(reach({ [field]: "" }))).toBe(false);
  });

  it.each(FIELDS)("%s: valid text is preserved exactly, including leading and trailing whitespace", (field) => {
    for (const s of ["  padded  ", "\n leading and trailing \t", " a ", "plain", "tab\tinside"]) {
      const parsed = seededDefectSchema.parse(reach({ [field]: s })) as Obj;
      expect(parsed[field]).toBe(s);
    }
  });

  it.each(FIELDS)("%s: the length limit applies to the raw string, whitespace included", (field, max) => {
    expect(entryOk(reach({ [field]: "x".repeat(max) }))).toBe(true);
    expect(entryOk(reach({ [field]: "x".repeat(max + 1) }))).toBe(false);
    expect(entryOk(reach({ [field]: " ".repeat(max - 1) + "x" }))).toBe(true);
    expect(entryOk(reach({ [field]: " " + "x".repeat(max) }))).toBe(false); // would fit only if it were trimmed
  });

  // Agreement between zod and the exported JSON Schema is checked with a real JSON Schema validator (Ajv 2020-12) in
  // seeded-defects-json-schema.test.ts, including code-point boundaries. This test only pins what the schema states.
  it.each(FIELDS)("%s: the exported JSON Schema states the basic text constraints", (field, max) => {
    const json = exportSeededDefectJsonSchema() as { properties: { defects: { items: { properties: Record<string, Obj> } } } };
    const sch = json.properties.defects.items.properties[field] as { type: string; minLength: number; maxLength: number; pattern: string };
    expect(sch).toMatchObject({ type: "string", minLength: 1, maxLength: max });
    expect(sch.pattern).toBe("\\S");
  });
});

describe("seeded-defect manifest: cross-field rules", () => {
  it("detectable must equal the category's fixed flag, in both directions", () => {
    expect(entryOk(reach({ detectable: false }))).toBe(false);
    expect(entryOk(logic({ detectable: true }))).toBe(false);
  });

  it("every category accepts exactly its allowed observables and rejects every other", () => {
    for (const category of SEEDED_DEFECT_CATEGORIES) {
      for (const observable of OBSERVABLES) {
        const entry = reach({
          id: `SD-${CATEGORY_ID_TOKEN[category]}-001`,
          category,
          detectable: CATEGORY_DETECTABLE[category],
          observable,
        });
        const allowed = CATEGORY_OBSERVABLES[category].includes(observable);
        expect(entryOk(entry), `${category} / ${observable}`).toBe(allowed);
      }
    }
  });

  it("the observable is required for every entry", () => {
    const { observable: _o, ...without } = reach();
    expect(entryOk(without)).toBe(false);
  });

  it("the id token must match the category", () => {
    expect(entryOk(reach({ id: "SD-rt-001" }))).toBe(false);
    expect(entryOk(logic({ id: "SD-reach-001" }))).toBe(false);
  });

  it("rejects duplicate ids inside one manifest", () => {
    expect(ok(manifest({ defects: [reach(), reach()] }))).toBe(false);
    expect(ok(manifest({ defects: [reach(), reach({ id: "SD-reach-002" })] }))).toBe(true);
  });

  it("a development manifest records no freeze commit", () => {
    expect(ok(manifest({ checksFrozenAtCommit: HEX40 }))).toBe(false);
  });

  it("a held-out manifest with defects needs a 40-hex freeze commit; an empty one may have null", () => {
    expect(ok(manifest({ set: "heldout", checksFrozenAtCommit: null }))).toBe(false);
    expect(ok(manifest({ set: "heldout", checksFrozenAtCommit: HEX40 }))).toBe(true);
    expect(ok(manifest({ set: "heldout", checksFrozenAtCommit: null, defects: [] }))).toBe(true);
  });

  it.each(["0123", HEX40.toUpperCase(), HEX40 + "0", "g".repeat(40)])("rejects the freeze commit %j", (sha) => {
    expect(ok(manifest({ set: "heldout", checksFrozenAtCommit: sha }))).toBe(false);
  });
});

describe("seeded-defect manifest: any fixture, and the category tables", () => {
  it.each(["demo-shop", "py-notes", "second-app", "ab"])("accepts the fixture id %j", (fixture) => {
    expect(ok(manifest({ fixture }))).toBe(true);
  });

  it.each(["Demo", "1x", "a", "demo_shop", "x".repeat(33), ""])("rejects the fixture id %j", (fixture) => {
    expect(ok(manifest({ fixture }))).toBe(false);
  });

  it("the three category tables cover exactly the declared categories", () => {
    const sorted = (xs: readonly string[]): string[] => [...xs].sort();
    expect(sorted(Object.keys(CATEGORY_DETECTABLE))).toEqual(sorted(SEEDED_DEFECT_CATEGORIES));
    expect(sorted(Object.keys(CATEGORY_OBSERVABLES))).toEqual(sorted(SEEDED_DEFECT_CATEGORIES));
    expect(sorted(Object.keys(CATEGORY_ID_TOKEN))).toEqual(sorted(SEEDED_DEFECT_CATEGORIES));
  });

  it("allowed observables are a subset of the vocabulary, every observable is used, and id tokens are unique", () => {
    const used = new Set<string>();
    for (const category of SEEDED_DEFECT_CATEGORIES) {
      expect(CATEGORY_OBSERVABLES[category].length).toBeGreaterThan(0);
      for (const o of CATEGORY_OBSERVABLES[category]) {
        expect(OBSERVABLES).toContain(o);
        used.add(o);
      }
    }
    expect([...used].sort()).toEqual([...OBSERVABLES].sort());
    expect(new Set(Object.values(CATEGORY_ID_TOKEN)).size).toBe(SEEDED_DEFECT_CATEGORIES.length);
  });

  it("the approved category tables are pinned literally (a change here is a reviewed change)", () => {
    expect([...SEEDED_DEFECT_CATEGORIES]).toEqual([
      "reachability", "runtime-error", "accessibility", "security-headers", "response-size-time", "form-structure", "business-logic",
    ]);
    expect([...OBSERVABLES]).toEqual([
      "http-status", "script-evaluation", "html-structure", "response-header", "response-size", "response-time", "authored-expectation",
    ]);
    expect(CATEGORY_DETECTABLE).toEqual({
      reachability: true, "runtime-error": true, accessibility: true, "security-headers": true,
      "response-size-time": true, "form-structure": true, "business-logic": false,
    });
    expect(CATEGORY_OBSERVABLES).toEqual({
      reachability: ["http-status"],
      "runtime-error": ["script-evaluation", "http-status"],
      accessibility: ["html-structure"],
      "security-headers": ["response-header"],
      "response-size-time": ["response-size", "response-time"],
      "form-structure": ["html-structure"],
      "business-logic": ["authored-expectation"],
    });
    expect(CATEGORY_ID_TOKEN).toEqual({
      reachability: "reach", "runtime-error": "rt", accessibility: "a11y", "security-headers": "sec",
      "response-size-time": "perf", "form-structure": "form", "business-logic": "logic",
    });
  });

  it("only business-logic is outside the detectable denominator, and it allows only the authored expectation", () => {
    expect(SEEDED_DEFECT_CATEGORIES.filter((c) => !CATEGORY_DETECTABLE[c])).toEqual(["business-logic"]);
    expect(CATEGORY_OBSERVABLES["business-logic"]).toEqual(["authored-expectation"]);
  });
});

describe("seeded-defect manifest: runtime immutability of the category tables", () => {
  const tables = { CATEGORY_DETECTABLE, CATEGORY_OBSERVABLES, CATEGORY_ID_TOKEN } as const;

  it("the three tables, every nested array and both vocabularies are frozen", () => {
    for (const [name, table] of Object.entries(tables)) {
      expect(Object.isFrozen(table), name).toBe(true);
      for (const value of Object.values(table)) if (Array.isArray(value)) expect(Object.isFrozen(value), `${name} nested`).toBe(true);
    }
    expect(Object.isFrozen(SEEDED_DEFECT_CATEGORIES)).toBe(true);
    expect(Object.isFrozen(OBSERVABLES)).toBe(true);
  });

  it("changing, adding or deleting a table entry throws and leaves the table unchanged", () => {
    const detectable = CATEGORY_DETECTABLE as Record<string, boolean>;
    const tokens = CATEGORY_ID_TOKEN as Record<string, string>;
    const observables = CATEGORY_OBSERVABLES as unknown as Record<string, string[]>;
    const before = JSON.stringify([detectable, tokens, observables]);
    expect(() => { detectable["business-logic"] = true; }).toThrow(TypeError);
    expect(() => { detectable["new-category"] = true; }).toThrow(TypeError);
    expect(() => { delete detectable["reachability"]; }).toThrow(TypeError);
    expect(() => { tokens["accessibility"] = "ax"; }).toThrow(TypeError);
    expect(() => { observables["accessibility"] = ["http-status"]; }).toThrow(TypeError);
    expect(JSON.stringify([detectable, tokens, observables])).toBe(before);
  });

  it("changing a nested observable array throws, and every mutating array method is refused", () => {
    const list = CATEGORY_OBSERVABLES.accessibility as string[];
    expect(() => list.push("http-status")).toThrow(TypeError);
    expect(() => { list[0] = "http-status"; }).toThrow(TypeError);
    expect(() => list.pop()).toThrow(TypeError);
    expect(() => list.splice(0, 1)).toThrow(TypeError);
    expect(() => list.unshift("http-status")).toThrow(TypeError);
    expect(() => { list.length = 0; }).toThrow(TypeError);
    expect(CATEGORY_OBSERVABLES.accessibility).toEqual(["html-structure"]);
  });

  it("the vocabularies cannot be extended, so validation stays what was approved", () => {
    expect(() => (SEEDED_DEFECT_CATEGORIES as unknown as string[]).push("performance")).toThrow(TypeError);
    expect(() => (OBSERVABLES as unknown as string[]).push("screenshot")).toThrow(TypeError);
    expect(entryOk(logic({ detectable: true }))).toBe(false);
    expect(entryOk(reach({ category: "accessibility", id: "SD-a11y-001", observable: "http-status" }))).toBe(false);
  });
});

describe("seeded-defect manifest: not a stored record", () => {
  it("is not part of recordSchemas, and the record JSON Schema export is unchanged in shape", () => {
    expect(Object.keys(recordSchemas)).not.toContain("SeededDefect");
    expect(Object.keys(recordSchemas)).not.toContain("SeededDefectManifest");
    expect(Object.keys(exportJsonSchemas()).sort()).toEqual(Object.keys(recordSchemas).sort());
  });

  it("matches its own committed JSON Schema snapshot", () => {
    expect(exportSeededDefectJsonSchema()).toMatchSnapshot();
  });
});
