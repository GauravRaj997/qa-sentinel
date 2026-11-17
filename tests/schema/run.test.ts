import { describe, expect, it } from "vitest";
import { runSchema } from "@qa-sentinel/schema";
import * as f from "./factories.js";

const ok = (v: unknown) => runSchema.safeParse(v).success;

describe("Run status (architecture.md §4, five values)", () => {
  it("accepts a running run without terminalReason or endedAt", () => {
    expect(ok(f.validRun())).toBe(true);
  });
  it("rejects a status outside the five values", () => {
    expect(ok({ ...f.validRun(), status: "done" })).toBe(false);
    expect(ok({ ...f.validRun(), status: "failed" })).toBe(false);
  });

  const allowed: Array<[string, string]> = [
    ["completed", "completed"],
    ["partial", "budget_exhausted"],
    ["aborted", "user_abort"],
    ["aborted", "crash_detected"],
    ["errored", "guard_unavailable"],
    ["errored", "guard_probe_failed"],
    ["errored", "browser_failure"],
    ["errored", "store_failure"],
    ["errored", "internal_error"],
  ];
  for (const [status, reason] of allowed) {
    it(`accepts ${status} with ${reason}`, () => {
      expect(ok(f.terminalRun(status, reason))).toBe(true);
    });
  }

  const mismatched: Array<[string, string]> = [
    ["completed", "budget_exhausted"],
    ["completed", "guard_probe_failed"],
    ["partial", "completed"],
    ["aborted", "guard_unavailable"],
    ["errored", "user_abort"],
    ["errored", "completed"],
  ];
  for (const [status, reason] of mismatched) {
    it(`rejects ${status} with ${reason}`, () => {
      expect(ok(f.terminalRun(status, reason))).toBe(false);
    });
  }

  it("rejects a terminal run without terminalReason or without endedAt", () => {
    const { terminalReason: _r, ...noReason } = f.terminalRun("completed", "completed");
    const { endedAt: _e, ...noEnd } = f.terminalRun("completed", "completed");
    expect(ok(noReason)).toBe(false);
    expect(ok(noEnd)).toBe(false);
  });
  it("rejects a running run that already has a terminalReason or endedAt", () => {
    expect(ok({ ...f.validRun(), terminalReason: "completed" })).toBe(false);
    expect(ok({ ...f.validRun(), endedAt: f.NOW })).toBe(false);
  });
  it("rejects endedAt before startedAt", () => {
    expect(ok({ ...f.terminalRun("completed", "completed"), endedAt: "2026-11-17T09:00:00.000Z" })).toBe(false);
  });
});

describe("Run: audit-only boundary", () => {
  it("accepts mode audit only", () => {
    expect(ok({ ...f.validRun(), mode: "authorized" })).toBe(false);
    expect(ok({ ...f.validRun(), mode: "anything" })).toBe(false);
  });
  it("has no grantId in Phase 1", () => {
    expect(ok({ ...f.validRun(), grantId: f.uuid(99) })).toBe(false);
  });
  it("accepts guardMode full or l1_only and nothing else", () => {
    expect(ok({ ...f.validRun(), guardMode: "l1_only" })).toBe(true);
    expect(ok({ ...f.validRun(), guardMode: "none" })).toBe(false);
  });
  it("accepts only the four coverage values", () => {
    for (const v of ["active", "unavailable", "untested", "uncontrolled"]) {
      expect(ok({ ...f.validRun(), guardCoverage: { workerWebSocket: v } })).toBe(true);
    }
    expect(ok({ ...f.validRun(), guardCoverage: { websocket: "contained" } })).toBe(false);
  });
  it("requires the manifest policyHash to equal the run policyHash", () => {
    const run = f.validRun();
    const manifest = { ...(run.manifest as f.Obj), policyHash: f.hex("9") };
    expect(ok({ ...run, manifest })).toBe(false);
  });
});
