// Synthetic, minimal-but-valid records for the schema tests. No real data.
import { SCHEMA_VERSION } from "@qa-sentinel/schema";

export type Obj = Record<string, unknown>;

export const NOW = "2026-11-17T10:00:00.000Z";
export const uuid = (n: number): string =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const hex = (c: string): string => c.repeat(64);

const base = (n: number): Obj => ({ id: uuid(n), schemaVersion: SCHEMA_VERSION, createdAt: NOW });

export const validTargetProfile = (): Obj => ({
  ...base(1),
  name: "demo-shop",
  kind: "web",
  baseUrls: ["http://127.0.0.1:4100"],
  scope: { allowedOrigins: ["http://127.0.0.1:4100"], deniedPathPatterns: ["/admin/*"] },
  network: {
    websocket: "deny",
    workers: "deny",
    webrtc: "deny",
    serviceWorkers: "block",
    downloads: "deny",
    permissions: "deny",
    schemes: ["http", "https"],
    dnsMode: "pinned",
    dnsPins: {},
    readOnlyRequests: [],
  },
  auth: { profiles: [{ id: "anonymous", type: "none", secretRefs: [] }] },
  identity: { source: "surfaceFingerprint", fingerprintUrls: ["/"], fingerprintIgnore: [] },
  verification: { minIdentityBasis: "target_reported" },
  stateIsolation: "none",
  evidence: { classOverrides: {}, retentionDaysOverrides: {}, sensitiveSelectors: [], traces: false },
  limits: { maxPages: 50, maxRequests: 500, maxDurationSec: 600 },
});

export const validApproval = (): Obj => ({
  ...base(2),
  profileId: uuid(1),
  policyHash: hex("a"),
  approvedBy: { label: "owner", osUser: "someuser", method: "tty", assurance: "L1" },
  approvedAt: NOW,
  policyDiff: "+ allowedOrigins: http://127.0.0.1:4100",
});

export const validTestSpec = (): Obj => ({
  ...base(3),
  version: 1,
  title: "Home page loads",
  origin: "authored",
  steps: [{ action: "goto", actionClass: "A0", params: { path: "/" } }],
  assertions: [{ id: "status-200", kind: "status", params: { equals: 200 } }],
  tags: ["smoke"],
  confirmation: { maxStatus: "confirmed", k: 2, match: "method+url+status", isolation: "client-fresh" },
  contentHash: hex("b"),
});

export const validRun = (): Obj => ({
  ...base(4),
  targetId: uuid(1),
  identity: { basis: "surfaceFingerprint", surfaceFingerprint: hex("c") },
  policyHash: hex("a"),
  profileApprovalId: uuid(2),
  mode: "audit",
  guardMode: "full",
  guardCoverage: { websocket: "active", webrtc: "untested", proxy: "active" },
  status: "running",
  startedAt: NOW,
  manifest: {
    qaSentinelVersion: "0.0.0",
    nodeVersion: "24.21.0",
    playwrightVersion: "0.0.0",
    browserName: "chromium",
    browserVersion: "0.0.0",
    os: "darwin",
    profileHash: hex("d"),
    policyHash: hex("a"),
    specHashes: [hex("b")],
    seed: 1,
    flags: {},
  },
  manifestHash: hex("e"),
});

export const terminalRun = (status: string, terminalReason: string): Obj => ({
  ...validRun(),
  status,
  terminalReason,
  endedAt: "2026-11-17T10:05:00.000Z",
});

export const validExecutionRecord = (): Obj => ({
  ...base(5),
  runId: uuid(4),
  specHash: hex("b"),
  attempt: 1,
  outcome: "passed",
  steps: [{ n: 1, action: "goto", actionClass: "A0", result: "ok", durationMs: 12 }],
  evidenceIds: [hex("f")],
});

// Evidence ids are the sha256 of the stored plaintext, not UUIDs.
export const validEvidence = (): Obj => ({
  ...base(6),
  id: hex("f"),
  kind: "console",
  bytes: 128,
  mime: "text/plain",
  class: "public",
  redactionStatus: "redacted",
  encrypted: false,
  redactions: [],
  expiresAt: "2027-02-15T10:00:00.000Z",
  executionRecordId: uuid(5),
});

export const validFinding = (): Obj => ({
  ...base(7),
  targetId: uuid(1),
  fingerprint: "broken-link:/missing",
  title: "Broken in-scope link",
  summary: "GET /missing returned 404",
  category: "reachability",
  checkId: "broken-link",
  status: "confirmed",
  severity: "medium",
  confirmationPolicyId: "broken-link@1",
  failureSignature: "GET /missing 404",
  reproSpecHash: hex("b"),
  reproductions: { attempts: 2, matching: 2, differing: 0, errored: 0 },
  stateDependent: false,
  evidenceIds: [hex("f")],
  firstSeenRunId: uuid(4),
  lastSeenRunId: uuid(4),
  failingIdentity: { basis: "surfaceFingerprint" },
  lifecycle: "open",
  provenance: "deterministic",
});

export const validEvidenceEvent = (): Obj => ({
  ...base(8),
  evidenceId: hex("f"),
  type: "created",
  actor: { label: "runner", osUser: "someuser", method: "cli" },
  at: NOW,
  prevHash: null,
  hash: hex("1"),
});

export const validPolicyDecision = (): Obj => ({
  ...base(9),
  runId: uuid(4),
  subject: "request",
  decision: "deny",
  actionClass: "A2",
  rule: "non-safe-method",
  reason: "POST is not a safe method",
  at: NOW,
  prevHash: null,
  hash: hex("2"),
});
