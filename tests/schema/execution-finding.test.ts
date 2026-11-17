import { describe, expect, it } from "vitest";
import { executionRecordSchema, findingSchema } from "@qa-sentinel/schema";
import * as f from "./factories.js";

const okRecord = (v: unknown) => executionRecordSchema.safeParse(v).success;
const okFinding = (v: unknown) => findingSchema.safeParse(v).success;
const step = (n: number, result: string, extra: f.Obj = {}): f.Obj => ({
  n,
  action: "goto",
  actionClass: "A0",
  result,
  durationMs: 5,
  ...extra,
});

describe("ExecutionRecord: no pass without execution (AC-04, GR-11)", () => {
  it("accepts passed when every step ran ok", () => {
    expect(okRecord(f.validExecutionRecord())).toBe(true);
    expect(okRecord({ ...f.validExecutionRecord(), steps: [step(1, "ok"), step(2, "ok")] })).toBe(true);
  });
  it("rejects passed with no steps", () => {
    expect(okRecord({ ...f.validExecutionRecord(), steps: [] })).toBe(false);
  });
  for (const result of ["not_run", "blocked", "failed", "errored"]) {
    it(`rejects passed when a step is ${result}`, () => {
      expect(okRecord({ ...f.validExecutionRecord(), steps: [step(1, "ok"), step(2, result)] })).toBe(false);
    });
  }
  it("rejects passed when a step was blocked by policy", () => {
    expect(okRecord({ ...f.validExecutionRecord(), steps: [step(1, "ok", { blockedByPolicy: true })] })).toBe(false);
  });
  it("accepts the other four outcomes without passed-only rules", () => {
    for (const outcome of ["failed", "errored", "skipped", "not_run"]) {
      expect(okRecord({ ...f.validExecutionRecord(), outcome, steps: [step(1, "not_run")] }), outcome).toBe(true);
    }
  });
  it("rejects an outcome outside the five values", () => {
    expect(okRecord({ ...f.validExecutionRecord(), outcome: "success" })).toBe(false);
  });
});

describe("Finding: evidence-first (AC-03) and honest status", () => {
  it("accepts the factory finding", () => {
    expect(okFinding(f.validFinding())).toBe(true);
  });
  for (const status of ["confirmed", "suspected", "informational"]) {
    it(`rejects a ${status} finding with no evidence`, () => {
      expect(okFinding({ ...f.validFinding(), status, evidenceIds: [] })).toBe(false);
    });
  }
  it("rejects confirmed with no matching reproduction", () => {
    const reproductions = { attempts: 2, matching: 0, differing: 2, errored: 0 };
    expect(okFinding({ ...f.validFinding(), reproductions })).toBe(false);
    expect(okFinding({ ...f.validFinding(), status: "suspected", reproductions })).toBe(true);
  });
  it("rejects reproduction counts that exceed the attempts", () => {
    const reproductions = { attempts: 2, matching: 2, differing: 1, errored: 0 };
    expect(okFinding({ ...f.validFinding(), reproductions })).toBe(false);
  });
  it("never lets a model-assisted finding be confirmed", () => {
    expect(okFinding({ ...f.validFinding(), provenance: "model-assisted" })).toBe(false);
    expect(okFinding({ ...f.validFinding(), provenance: "model-assisted", status: "suspected" })).toBe(true);
  });
  it("keeps flakeRate within 0..1", () => {
    expect(okFinding({ ...f.validFinding(), status: "suspected", flakeRate: 0.4 })).toBe(true);
    expect(okFinding({ ...f.validFinding(), status: "suspected", flakeRate: 1.2 })).toBe(false);
  });
  it("accepts only the documented status, severity and lifecycle values", () => {
    expect(okFinding({ ...f.validFinding(), status: "verified" })).toBe(false);
    expect(okFinding({ ...f.validFinding(), severity: "urgent" })).toBe(false);
    expect(okFinding({ ...f.validFinding(), lifecycle: "closed" })).toBe(false);
  });
});
