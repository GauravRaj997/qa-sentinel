import { describe, expect, it } from "vitest";
import { exportJsonSchemas, recordSchemas, SCHEMA_VERSION } from "@qa-sentinel/schema";
import * as f from "./factories.js";

type Schema = { safeParse(v: unknown): { success: boolean } };
const schemas = recordSchemas as unknown as Record<string, Schema>;

const valid: Record<string, () => f.Obj> = {
  TargetProfile: f.validTargetProfile,
  ProfileApproval: f.validApproval,
  TestSpec: f.validTestSpec,
  Run: f.validRun,
  ExecutionRecord: f.validExecutionRecord,
  Evidence: f.validEvidence,
  Finding: f.validFinding,
  EvidenceEvent: f.validEvidenceEvent,
  PolicyDecision: f.validPolicyDecision,
};

describe("Phase 1 record set", () => {
  it("covers exactly the nine records and no Grant, Proposal or Verification type", () => {
    expect(Object.keys(recordSchemas).sort()).toEqual(Object.keys(valid).sort());
  });
});

for (const [name, make] of Object.entries(valid)) {
  describe(`${name}: base fields`, () => {
    const schema = schemas[name] as Schema;
    it("accepts the factory value", () => {
      expect(schema.safeParse(make()).success).toBe(true);
    });
    for (const key of ["id", "schemaVersion", "createdAt"]) {
      it(`rejects a record without ${key}`, () => {
        const { [key]: _removed, ...rest } = make();
        expect(schema.safeParse(rest).success).toBe(false);
      });
    }
    it("rejects another schemaVersion", () => {
      expect(schema.safeParse({ ...make(), schemaVersion: SCHEMA_VERSION + 1 }).success).toBe(false);
    });
    it("rejects unknown keys", () => {
      expect(schema.safeParse({ ...make(), surprise: true }).success).toBe(false);
    });
  });
}

describe("JSON Schema export", () => {
  const out = exportJsonSchemas();
  it("exports one schema per record", () => {
    expect(Object.keys(out).sort()).toEqual(Object.keys(recordSchemas).sort());
  });
  it("every export is an object schema requiring the base fields", () => {
    for (const [name, js] of Object.entries(out)) {
      const s = js as { type?: string; required?: string[] };
      expect(s.type, name).toBe("object");
      for (const key of ["id", "schemaVersion", "createdAt"]) {
        expect(s.required, `${name}.${key}`).toContain(key);
      }
    }
  });
  it("matches the committed snapshot", () => {
    expect(out).toMatchSnapshot();
  });
});
