import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { exportSeededDefectJsonSchema, seededDefectManifestSchema } from "@qa-sentinel/schema";

// Zod and JSON Schema are two validation interfaces for the same manifest. JSON Schema `minLength` and `maxLength` count
// Unicode code points; JavaScript `String.length` counts UTF-16 code units. These tests compare the zod schema with an
// independent JSON Schema validator (Ajv, draft 2020-12) running the schema that `exportSeededDefectJsonSchema()` really
// returns, at exact code-point boundaries, using astral characters (two UTF-16 units, one code point each).
//
// Not covered, and not a compatibility guarantee: strings that are not well-formed Unicode (lone surrogates). What a JSON
// Schema validator does with one depends on how its input was produced and decoded, so it is an interoperability detail
// of the surrounding tooling. It is neither tested nor promised here.

type Obj = Record<string, unknown>;

const ASTRAL = "\u{1F600}"; // one code point, two UTF-16 units
const cp = (s: string): number => [...s].length;

const entry = (over: Obj = {}, location: Obj = { method: "GET", path: "/products" }): Obj => ({
  id: "SD-reach-001",
  category: "reachability",
  title: "Archived products link returns 404",
  description: "The navigation links to a page that answers 404.",
  locations: [location],
  detectable: true,
  observable: "http-status",
  rationale: "A client following the link sees status 404.",
  ...over,
});
const manifestOf = (defect: Obj): Obj => ({ schemaVersion: 1, fixture: "demo-shop", set: "development", checksFrozenAtCommit: null, defects: [defect] });

const ajv = new Ajv2020({ strict: true, allErrors: true });
const exported = exportSeededDefectJsonSchema() as Obj;
const validate = ajv.compile(exported);
const ajvOk = (m: unknown): boolean => validate(m) === true;
const zodOk = (m: unknown): boolean => seededDefectManifestSchema.safeParse(m).success;

/** Zod and Ajv must give the same verdict for the same input; the message names the case and Ajv's reason. */
const agree = (label: string, m: Obj): boolean => {
  const z1 = zodOk(m);
  const a1 = ajvOk(m);
  expect(a1, `${label}: zod=${String(z1)} ajv=${String(a1)} ${a1 ? "" : ajv.errorsText(validate.errors)}`).toBe(z1);
  return z1;
};

describe("seeded-defect manifest: the validator itself and the exported schema", () => {
  it("Ajv 2020-12 compiles the exported schema in strict mode, and the schema is a valid 2020-12 schema", () => {
    expect(ajv.validateSchema(exported)).toBe(true);
    expect(exported["$schema"]).toBe("https://json-schema.org/draft/2020-12/schema");
  });

  it("Ajv counts Unicode code points for minLength and maxLength (not UTF-16 units)", () => {
    const max3 = ajv.compile({ type: "string", maxLength: 3 });
    expect(max3(ASTRAL.repeat(3))).toBe(true); // 3 code points, 6 units
    expect(max3(ASTRAL.repeat(4))).toBe(false); // 4 code points, 8 units
    const min2 = ajv.compile({ type: "string", minLength: 2 });
    expect(min2(ASTRAL)).toBe(false); // 1 code point, 2 units
    expect(min2(ASTRAL + "a")).toBe(true);
  });

  it("a real valid manifest passes both validators", () => {
    expect(agree("baseline", manifestOf(entry()))).toBe(true);
  });
});

const TEXT_FIELDS: [string, number][] = [["title", 120], ["description", 500], ["rationale", 500]];

describe.each(TEXT_FIELDS)("%s (max %i): zod and Ajv agree at code-point boundaries", (field, max) => {
  const ofField = (s: string): Obj => manifestOf(entry({ [field]: s }));
  const half = Math.floor(max / 2);

  // [label, input, expected verdict, code-point length the case relies on (null when not a length case)]
  const cases: [string, string, boolean, number | null][] = [
    ["exactly max astral characters", ASTRAL.repeat(max), true, max],
    ["max + 1 astral characters", ASTRAL.repeat(max + 1), false, max + 1],
    ["one below max astral characters", ASTRAL.repeat(max - 1), true, max - 1],
    ["max - 1 astral + 1 BMP (exactly max)", ASTRAL.repeat(max - 1) + "a", true, max],
    ["max - 1 astral + 2 BMP (max + 1)", ASTRAL.repeat(max - 1) + "ab", false, max + 1],
    ["half astral + half BMP (exactly max)", ASTRAL.repeat(half) + "a".repeat(max - half), true, max],
    ["half astral + half BMP, one more (max + 1)", ASTRAL.repeat(half) + "a".repeat(max - half + 1), false, max + 1],
    ["BMP only, exactly max", "a".repeat(max), true, max],
    ["BMP only, max + 1", "a".repeat(max + 1), false, max + 1],
    ["BMP only, one below max", "a".repeat(max - 1), true, max - 1],
    ["leading space + max - 1 astral (exactly max)", " " + ASTRAL.repeat(max - 1), true, max],
    ["leading space + max astral (max + 1)", " " + ASTRAL.repeat(max), false, max + 1],
    ["leading newline + max - 2 astral + 1 BMP (exactly max)", "\n" + ASTRAL.repeat(max - 2) + "a", true, max],
    ["two leading spaces + max - 1 astral (max + 1)", "  " + ASTRAL.repeat(max - 1), false, max + 1],
    ["a single astral character (min boundary)", ASTRAL, true, 1],
    ["empty string (below min)", "", false, 0],
    ["whitespace only, exactly max", " ".repeat(max), false, max],
    ["whitespace only, max + 1", " ".repeat(max + 1), false, max + 1],
  ];

  it.each(cases)("%s", (label, s, expected, codePoints) => {
    // The table states the code-point length each case relies on, so a wrong table fails here and not silently.
    if (codePoints !== null) expect(cp(s)).toBe(codePoints);
    expect(agree(label, ofField(s))).toBe(expected);
  });

  it("an astral string over max in UTF-16 units but exactly max in code points is accepted by both", () => {
    const s = ASTRAL.repeat(max);
    expect(s.length).toBe(2 * max);
    expect(cp(s)).toBe(max);
    expect(agree("units vs code points", ofField(s))).toBe(true);
  });

  it("keeps the string it accepted exactly (no transformation), so both interfaces judge the same value", () => {
    const s = " " + ASTRAL.repeat(max - 1);
    const parsed = seededDefectManifestSchema.parse(ofField(s)) as { defects: Obj[] };
    expect(parsed.defects[0]![field]).toBe(s);
  });
});

describe("location path (max 200): zod and Ajv agree at code-point boundaries", () => {
  const MAX = 200;
  const ofPath = (path: string): Obj => manifestOf(entry({}, { method: "GET", path }));
  const half = Math.floor((MAX - 1) / 2); // characters after the leading "/"

  // [label, input, expected verdict, code-point length the case relies on (null when not a length case)]
  const cases: [string, string, boolean, number | null][] = [
    ["exactly max: / + 199 astral", "/" + ASTRAL.repeat(MAX - 1), true, MAX],
    ["max + 1: / + 200 astral", "/" + ASTRAL.repeat(MAX), false, MAX + 1],
    ["one below max: / + 198 astral", "/" + ASTRAL.repeat(MAX - 2), true, MAX - 1],
    ["mixed, exactly max: / + 198 astral + 1 BMP", "/" + ASTRAL.repeat(MAX - 2) + "a", true, MAX],
    ["mixed, max + 1: / + 198 astral + 2 BMP", "/" + ASTRAL.repeat(MAX - 2) + "ab", false, MAX + 1],
    ["half astral + half BMP, exactly max", "/" + ASTRAL.repeat(half) + "a".repeat(MAX - 1 - half), true, MAX],
    ["half astral + half BMP, max + 1", "/" + ASTRAL.repeat(half) + "a".repeat(MAX - half), false, MAX + 1],
    ["BMP only, exactly max", "/" + "a".repeat(MAX - 1), true, MAX],
    ["BMP only, max + 1", "/" + "a".repeat(MAX), false, MAX + 1],
    ["BMP only, one below max", "/" + "a".repeat(MAX - 2), true, MAX - 1],
    ["leading space before an otherwise valid path", " /" + ASTRAL.repeat(10), false, null],
    ["leading space at the length boundary", " /" + ASTRAL.repeat(MAX - 2), false, MAX],
    ["a lone slash", "/", true, 1],
    ["astral inside a short path", "/a" + ASTRAL + "b", true, null],
    ["query string with an astral character", "/a?x=" + ASTRAL, false, null],
    ["fragment with an astral character", "/a#" + ASTRAL, false, null],
    ["leading double slash", "//" + ASTRAL, false, null],
    ["whitespace inside an astral path", "/a b" + ASTRAL, false, null],
  ];

  it.each(cases)("%s", (label, path, expected, codePoints) => {
    if (codePoints !== null) expect(cp(path)).toBe(codePoints);
    expect(agree(label, ofPath(path))).toBe(expected);
  });

  it("the verdict does not depend on UTF-16 length", () => {
    const path = "/" + ASTRAL.repeat(MAX - 1);
    expect(path.length).toBe(1 + 2 * (MAX - 1));
    expect(cp(path)).toBe(MAX);
    expect(agree("path units vs code points", ofPath(path))).toBe(true);
  });
});

describe("pinned zod: string length checks count Unicode code points", () => {
  const root = new URL("../../", import.meta.url);
  const read = <T>(rel: string): T => JSON.parse(readFileSync(fileURLToPath(new URL(rel, root)), "utf8")) as T;
  const declared = read<{ dependencies: Record<string, string> }>("packages/schema/package.json").dependencies["zod"];
  const installed = read<{ version: string }>("node_modules/zod/package.json").version;

  it("zod is pinned exactly in the schema package, and the installed version is the pinned one", () => {
    expect(declared).toMatch(/^\d+\.\d+\.\d+$/);
    expect(installed).toBe(declared);
  });

  it("this version counts code points for max and min (verified on the pinned 4.6.7); a zod upgrade must re-check this", () => {
    expect(z.string().max(3).safeParse(ASTRAL.repeat(3)).success).toBe(true); // 6 UTF-16 units, 3 code points
    expect(z.string().max(3).safeParse(ASTRAL.repeat(4)).success).toBe(false);
    expect(z.string().max(3).safeParse(ASTRAL + ASTRAL + "a").success).toBe(true); // 5 units, 3 code points
    expect(z.string().min(2).safeParse(ASTRAL).success).toBe(false); // 2 units, 1 code point
    expect(z.string().min(2).safeParse(ASTRAL + "a").success).toBe(true);
  });
});
