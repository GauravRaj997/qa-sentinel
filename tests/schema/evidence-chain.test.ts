import { describe, expect, it } from "vitest";
import { evidenceEventSchema, evidenceSchema, policyDecisionSchema } from "@qa-sentinel/schema";
import * as f from "./factories.js";

const okEvidence = (v: unknown) => evidenceSchema.safeParse(v).success;
const okEvent = (v: unknown) => evidenceEventSchema.safeParse(v).success;
const okDecision = (v: unknown) => policyDecisionSchema.safeParse(v).success;

describe("Evidence: labels follow the Guarantee Register (GR-16, GR-17, GR-26)", () => {
  it("accepts the factory evidence and requires a sha256 id", () => {
    expect(okEvidence(f.validEvidence())).toBe(true);
    expect(okEvidence({ ...f.validEvidence(), id: f.uuid(6) })).toBe(false);
  });
  it("requires restricted evidence to be encrypted", () => {
    expect(okEvidence({ ...f.validEvidence(), class: "restricted", encrypted: false })).toBe(false);
    expect(okEvidence({ ...f.validEvidence(), class: "restricted", encrypted: true })).toBe(true);
  });
  it("makes traces and downloads restricted and not_redacted", () => {
    for (const kind of ["trace", "download"]) {
      const base = { ...f.validEvidence(), kind, class: "restricted", encrypted: true };
      expect(okEvidence({ ...base, redactionStatus: "not_redacted" }), kind).toBe(true);
      expect(okEvidence({ ...base, redactionStatus: "redacted" }), kind).toBe(false);
      expect(okEvidence({ ...base, redactionStatus: "partially_redacted" }), kind).toBe(false);
      expect(okEvidence({ ...base, redactionStatus: "not_redacted", class: "public", encrypted: false }), kind).toBe(false);
    }
  });
  it("never labels a screenshot fully redacted", () => {
    const shot = { ...f.validEvidence(), kind: "screenshot", mime: "image/png" };
    expect(okEvidence({ ...shot, redactionStatus: "partially_redacted" })).toBe(true);
    expect(okEvidence({ ...shot, redactionStatus: "redacted" })).toBe(false);
  });
  it("rejects unknown kinds, classes and redaction labels", () => {
    expect(okEvidence({ ...f.validEvidence(), kind: "video" })).toBe(false);
    expect(okEvidence({ ...f.validEvidence(), class: "secret" })).toBe(false);
    expect(okEvidence({ ...f.validEvidence(), redactionStatus: "clean" })).toBe(false);
  });
});

describe("EvidenceEvent: append-only history shape (AC-43)", () => {
  it("accepts a created event with a null first prevHash", () => {
    expect(okEvent(f.validEvidenceEvent())).toBe(true);
  });
  it("requires a hash and a prevHash field", () => {
    const { hash: _h, ...noHash } = f.validEvidenceEvent();
    const { prevHash: _p, ...noPrev } = f.validEvidenceEvent();
    expect(okEvent(noHash)).toBe(false);
    expect(okEvent(noPrev)).toBe(false);
  });
  it("requires the full detail record on tombstoned events", () => {
    const tomb = { ...f.validEvidenceEvent(), type: "tombstoned" };
    expect(okEvent(tomb)).toBe(false);
    const detail = {
      hash: f.hex("f"),
      kind: "console",
      size: 128,
      deletedAt: f.NOW,
      reason: "retention expired",
      method: "prune",
    };
    expect(okEvent({ ...tomb, detail })).toBe(true);
    const { reason: _r, ...incomplete } = detail;
    expect(okEvent({ ...tomb, detail: incomplete })).toBe(false);
  });
  it("rejects an event type outside the five values", () => {
    expect(okEvent({ ...f.validEvidenceEvent(), type: "deleted" })).toBe(false);
  });
});

describe("PolicyDecision: audit-only boundary", () => {
  it("accepts a denied A2 request", () => {
    expect(okDecision(f.validPolicyDecision())).toBe(true);
  });
  for (const actionClass of ["A2", "A3"]) {
    it(`rejects an allow decision for ${actionClass}`, () => {
      expect(okDecision({ ...f.validPolicyDecision(), decision: "allow", actionClass })).toBe(false);
    });
  }
  for (const actionClass of ["A0", "A1"]) {
    it(`accepts an allow decision for ${actionClass}`, () => {
      expect(okDecision({ ...f.validPolicyDecision(), decision: "allow", actionClass })).toBe(true);
    });
  }
  it("has no grant subject in Phase 1", () => {
    expect(okDecision({ ...f.validPolicyDecision(), subject: "grant" })).toBe(false);
    expect(okDecision({ ...f.validPolicyDecision(), subject: "profile" })).toBe(true);
  });
});
