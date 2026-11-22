import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CATEGORY_DETECTABLE, seededDefectManifestSchema, type SeededDefectManifest } from "@qa-sentinel/schema";

// The development manifest of the demo-shop fixture. The probes that back each entry (a later checkpoint) establish
// structural ground truth only: the defect is planted in the defective variant and absent in the clean one. They do not
// show that any QA Sentinel check detects it (AC-01 is measured in later phases, and no AC is marked passed here).

const root = new URL("../../../fixtures/demo-shop/", import.meta.url);
const raw = readFileSync(fileURLToPath(new URL("seeded-defects.json", root)), "utf8");
const manifest: SeededDefectManifest = seededDefectManifestSchema.parse(JSON.parse(raw));

/** The approved inventory: id, category, observable, locations. A change here is a reviewed change. */
const INVENTORY: [string, string, string, string[]][] = [
  ["SD-reach-001", "reachability", "http-status", ["GET /products/archive"]],
  ["SD-reach-002", "reachability", "http-status", ["GET /checkout/confirm"]],
  ["SD-rt-001", "runtime-error", "script-evaluation", ["GET /js/cart.js"]],
  ["SD-rt-002", "runtime-error", "script-evaluation", ["GET /js/promo.js"]],
  ["SD-rt-003", "runtime-error", "http-status", ["GET /assets/missing.css"]],
  ["SD-a11y-001", "accessibility", "html-structure", ["GET /products"]],
  ["SD-a11y-002", "accessibility", "html-structure", ["GET /"]],
  ["SD-sec-001", "security-headers", "response-header", ["GET /"]],
  ["SD-sec-002", "security-headers", "response-header", ["GET /products"]],
  ["SD-perf-001", "response-size-time", "response-size", ["GET /catalog/export"]],
  ["SD-perf-002", "response-size-time", "response-time", ["GET /reports/daily"]],
  ["SD-form-001", "form-structure", "html-structure", ["GET /newsletter"]],
  ["SD-logic-001", "business-logic", "authored-expectation", ["GET /cart"]],
  ["SD-logic-002", "business-logic", "authored-expectation", ["GET /cart/summary"]],
];

const keysDeep = (v: unknown): string[] =>
  Array.isArray(v) ? v.flatMap(keysDeep) : v !== null && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => [k, ...keysDeep(x)]) : [];

describe("demo-shop development manifest", () => {
  it("validates against the shared schema, names its fixture after its directory, and is the development set", () => {
    expect(manifest.fixture).toBe("demo-shop");
    expect(manifest.set).toBe("development");
    expect(manifest.checksFrozenAtCommit).toBeNull();
  });

  it("is exactly the approved 14-entry inventory", () => {
    expect(manifest.defects.map((d) => [d.id, d.category, d.observable, d.locations.map((l) => `${l.method} ${l.path}`)])).toEqual(INVENTORY);
  });

  it("has 12 detectable entries and 2 outside the denominator, which are the business-logic ones", () => {
    expect(manifest.defects.filter((d) => d.detectable)).toHaveLength(12);
    const rest = manifest.defects.filter((d) => !d.detectable);
    expect(rest.map((d) => d.id)).toEqual(["SD-logic-001", "SD-logic-002"]);
    expect(rest.every((d) => d.category === "business-logic" && d.observable === "authored-expectation")).toBe(true);
    for (const d of manifest.defects) expect(d.detectable).toBe(CATEGORY_DETECTABLE[d.category]);
  });

  it("covers the categories as approved (the distribution is uneven by design)", () => {
    const counts: Record<string, number> = {};
    for (const d of manifest.defects) counts[d.category] = (counts[d.category] ?? 0) + 1;
    expect(counts).toEqual({
      reachability: 2,
      "runtime-error": 3,
      accessibility: 2,
      "security-headers": 2,
      "response-size-time": 2,
      "form-structure": 1,
      "business-logic": 2,
    });
  });

  it("carries no expected-result field anywhere: a probe cannot read its own correct answer from the manifest", () => {
    const forbidden = keysDeep(JSON.parse(raw)).filter((k) => /^(expect|oracle|answer|correct)/i.test(k));
    expect(forbidden).toEqual([]);
  });

  it("claims no mixed-content defect (a documented, unseeded limitation: the fixture is plain-HTTP loopback)", () => {
    for (const d of manifest.defects) expect(`${d.title} ${d.description}`.toLowerCase()).not.toContain("mixed content");
  });

  it("accessibility entries claim structural ground truth only, with axe-core detection stated as unconfirmed", () => {
    const a11y = manifest.defects.filter((d) => d.category === "accessibility");
    expect(a11y).toHaveLength(2);
    for (const d of a11y) {
      expect(d.rationale).toContain("Structural ground truth only");
      expect(d.rationale).toContain("unconfirmed");
      expect(d.rationale).toContain("@axe-core/playwright");
    }
  });

  it("script-evaluation entries state that they do not show browser behaviour, and name node:vm as no security boundary", () => {
    const scripts = manifest.defects.filter((d) => d.observable === "script-evaluation");
    expect(scripts.map((d) => d.id)).toEqual(["SD-rt-001", "SD-rt-002"]);
    for (const d of scripts) expect(d.rationale).toContain("does not show that a browser");
    expect(scripts[0]!.rationale).toContain("not a security boundary");
  });

  it("the response-time entry states its clock, margin and load sensitivity, and makes no general performance claim", () => {
    const time = manifest.defects.find((d) => d.observable === "response-time")!;
    expect(time.rationale).toContain("monotonic");
    expect(time.rationale).toContain("sensitive to machine load");
    expect(time.rationale).toContain("not a claim about general performance reliability");
  });

  it("business-logic entries state that they sit outside the AC-01 denominator and carry no expected value", () => {
    for (const d of manifest.defects.filter((x) => x.category === "business-logic")) {
      expect(d.rationale).toContain("outside the AC-01 detectable denominator");
      expect(d.rationale).toContain("carries no expected value");
    }
  });
});
