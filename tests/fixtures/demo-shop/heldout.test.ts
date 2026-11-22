import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { seededDefectManifestSchema } from "@qa-sentinel/schema";

// Held-out separation, manifest level. The held-out set is a separate file and stays empty until the checks are frozen:
// a held-out defect cannot be added without recording the commit at which the checks were frozen (schema rule).
// The repository is public, so this is procedural separation, not secrecy; git history is the proof of order.

const load = (name: string) => seededDefectManifestSchema.parse(JSON.parse(readFileSync(fileURLToPath(new URL(`../../../fixtures/demo-shop/${name}`, import.meta.url)), "utf8")));
const development = load("seeded-defects.json");
const heldout = load("seeded-defects.heldout.json");

describe("demo-shop held-out manifest", () => {
  it("is a valid, separate, held-out manifest of the same fixture", () => {
    expect(heldout.set).toBe("heldout");
    expect(heldout.fixture).toBe(development.fixture);
  });

  it("ships empty, with no freeze commit recorded: nothing is held out yet, so the held-out measure is not evaluable", () => {
    expect(heldout.defects).toEqual([]);
    expect(heldout.checksFrozenAtCommit).toBeNull();
  });

  it("shares no defect id with the development manifest", () => {
    const dev = new Set(development.defects.map((d) => d.id));
    expect(heldout.defects.filter((d) => dev.has(d.id))).toEqual([]);
  });

  it("the development manifest never contains a held-out set marker or entries", () => {
    expect(development.set).toBe("development");
  });
});
