import { describe, expect, it } from "vitest";
import { profileApprovalSchema, targetProfileSchema, testSpecSchema } from "@qa-sentinel/schema";
import * as f from "./factories.js";

const okProfile = (v: unknown) => targetProfileSchema.safeParse(v).success;
const okApproval = (v: unknown) => profileApprovalSchema.safeParse(v).success;
const okSpec = (v: unknown) => testSpecSchema.safeParse(v).success;
const withNetwork = (patch: f.Obj): f.Obj => {
  const p = f.validTargetProfile();
  return { ...p, network: { ...(p.network as f.Obj), ...patch } };
};

describe("TargetProfile: deny-by-default network policy", () => {
  it("accepts the factory profile", () => {
    expect(okProfile(f.validTargetProfile())).toBe(true);
  });
  it("fills every network switch with its safe default when omitted", () => {
    const { network: _n, ...rest } = f.validTargetProfile();
    const parsed = targetProfileSchema.parse(rest);
    expect(parsed.network).toMatchObject({
      websocket: "deny",
      workers: "deny",
      webrtc: "deny",
      serviceWorkers: "block",
      downloads: "deny",
      permissions: "deny",
      schemes: ["http", "https"],
      dnsMode: "pinned",
      readOnlyRequests: [],
    });
  });
  it("accepts only the documented switch values", () => {
    expect(okProfile(withNetwork({ websocket: "observe" }))).toBe(true);
    expect(okProfile(withNetwork({ workers: "allow" }))).toBe(true);
    expect(okProfile(withNetwork({ websocket: "allow" }))).toBe(false);
    expect(okProfile(withNetwork({ webrtc: "allow" }))).toBe(false);
    expect(okProfile(withNetwork({ serviceWorkers: "allow" }))).toBe(false);
    expect(okProfile(withNetwork({ permissions: "allow" }))).toBe(false);
  });
  it("allows only http and https schemes", () => {
    expect(okProfile(withNetwork({ schemes: ["http", "https", "file"] }))).toBe(false);
    expect(okProfile(withNetwork({ schemes: ["ftp"] }))).toBe(false);
  });
  it("requires origin-form allowedOrigins (no path, no wildcard)", () => {
    const p = f.validTargetProfile();
    const scope = (allowedOrigins: string[]) => ({ ...p, scope: { ...(p.scope as f.Obj), allowedOrigins } });
    expect(okProfile(scope(["http://127.0.0.1:4100/"]))).toBe(true);
    expect(okProfile(scope(["http://127.0.0.1:4100/shop"]))).toBe(false);
    expect(okProfile(scope(["*"]))).toBe(false);
    expect(okProfile(scope(["file:///etc"]))).toBe(false);
    expect(okProfile(scope([]))).toBe(false);
  });
  it("requires deniedPathPatterns to start with /", () => {
    const p = f.validTargetProfile();
    const scope = (deniedPathPatterns: string[]) => ({ ...p, scope: { ...(p.scope as f.Obj), deniedPathPatterns } });
    expect(okProfile(scope(["admin"]))).toBe(false);
  });
});

describe("TargetProfile: DNS pinning (Q-30, AC-49 groundwork)", () => {
  const remote = { allowedOrigins: ["https://shop.example.test"] };
  const profileFor = (patch: f.Obj): f.Obj => {
    const p = withNetwork(patch);
    return { ...p, scope: { ...(p.scope as f.Obj), ...remote } };
  };
  it("needs a pin for each non-loopback allowed host when pinned", () => {
    expect(okProfile(profileFor({ dnsMode: "pinned", dnsPins: {} }))).toBe(false);
    expect(okProfile(profileFor({ dnsMode: "pinned", dnsPins: { "shop.example.test": ["203.0.113.7"] } }))).toBe(true);
  });
  it("accepts a loopback-only target without pins", () => {
    expect(okProfile(f.validTargetProfile())).toBe(true);
  });
  it("accepts system DNS without pins", () => {
    expect(okProfile(profileFor({ dnsMode: "system", dnsPins: {} }))).toBe(true);
  });
  it("rejects a pin that is not an IP address", () => {
    expect(okProfile(profileFor({ dnsPins: { "shop.example.test": ["not-an-ip"] } }))).toBe(false);
  });
});

describe("TargetProfile: secrets are references, never values", () => {
  const withAuth = (secretRefs: string[]): f.Obj => ({
    ...f.validTargetProfile(),
    auth: { profiles: [{ id: "user", type: "header", secretRefs }] },
  });
  it("accepts environment-variable-style names", () => {
    expect(okProfile(withAuth(["DEMO_TOKEN"]))).toBe(true);
  });
  it("rejects values that cannot be a variable name", () => {
    expect(okProfile(withAuth(["Bearer abc.def"]))).toBe(false);
    expect(okProfile(withAuth(["p@ss word"]))).toBe(false);
    expect(okProfile(withAuth([""]))).toBe(false);
  });
});

describe("TargetProfile: read-only request rules and limits", () => {
  const rule = {
    id: "gql-read",
    origin: "http://127.0.0.1:4100",
    pathPattern: "/graphql",
    method: "POST",
    kind: "graphql-query",
    bodyRule: {},
    attestedBy: "owner",
    reason: "Read-only GraphQL queries",
  };
  it("accepts a POST read-only rule and rejects any other method", () => {
    expect(okProfile(withNetwork({ readOnlyRequests: [rule] }))).toBe(true);
    expect(okProfile(withNetwork({ readOnlyRequests: [{ ...rule, method: "DELETE" }] }))).toBe(false);
    expect(okProfile(withNetwork({ readOnlyRequests: [{ ...rule, method: "PUT" }] }))).toBe(false);
  });
  it("requires positive integer limits", () => {
    const p = f.validTargetProfile();
    expect(okProfile({ ...p, limits: { maxPages: 0, maxRequests: 10, maxDurationSec: 10 } })).toBe(false);
    expect(okProfile({ ...p, limits: { maxPages: 1.5, maxRequests: 10, maxDurationSec: 10 } })).toBe(false);
  });
  it("keeps traces off by default and retention within the 180-day cap", () => {
    const { evidence: _e, ...rest } = f.validTargetProfile();
    expect(targetProfileSchema.parse(rest).evidence.traces).toBe(false);
    const ev = (retentionDaysOverrides: f.Obj) => ({
      ...f.validTargetProfile(),
      evidence: { classOverrides: {}, retentionDaysOverrides, sensitiveSelectors: [], traces: false },
    });
    expect(okProfile(ev({ screenshot: 30 }))).toBe(true);
    expect(okProfile(ev({ screenshot: 181 }))).toBe(false);
  });
});

describe("ProfileApproval", () => {
  it("accepts a tty or dashboard approval", () => {
    expect(okApproval(f.validApproval())).toBe(true);
    const by = { label: "owner", osUser: "someuser", method: "dashboard", assurance: "L1" };
    expect(okApproval({ ...f.validApproval(), approvedBy: by })).toBe(true);
  });
  it("rejects any other approval method (adapters cannot approve)", () => {
    const by = { label: "agent", osUser: "someuser", method: "adapter", assurance: "L1" };
    expect(okApproval({ ...f.validApproval(), approvedBy: by })).toBe(false);
  });
  it("requires a sha256 policyHash", () => {
    expect(okApproval({ ...f.validApproval(), policyHash: "abc" })).toBe(false);
  });
});

describe("TestSpec", () => {
  it("accepts the factory spec", () => {
    expect(okSpec(f.validTestSpec())).toBe(true);
  });
  it("caps generated specs below confirmed", () => {
    const conf = (maxStatus: string) => ({
      ...f.validTestSpec(),
      origin: "generated",
      confirmation: { maxStatus, k: 2, match: "x", isolation: "client-fresh" },
    });
    expect(okSpec(conf("confirmed"))).toBe(false);
    expect(okSpec(conf("suspected"))).toBe(true);
  });
  it("requires k when the ceiling is confirmed", () => {
    const c = { maxStatus: "confirmed", k: null, match: "x", isolation: "client-fresh" };
    expect(okSpec({ ...f.validTestSpec(), confirmation: c })).toBe(false);
    expect(okSpec({ ...f.validTestSpec(), confirmation: { ...c, maxStatus: "suspected" } })).toBe(true);
  });
  it("rejects an unknown origin, isolation or action class", () => {
    expect(okSpec({ ...f.validTestSpec(), origin: "imported" })).toBe(false);
    const c = { maxStatus: "confirmed", k: 2, match: "x", isolation: "shared" };
    expect(okSpec({ ...f.validTestSpec(), confirmation: c })).toBe(false);
    expect(okSpec({ ...f.validTestSpec(), steps: [{ action: "goto", actionClass: "A9", params: {} }] })).toBe(false);
  });
});
