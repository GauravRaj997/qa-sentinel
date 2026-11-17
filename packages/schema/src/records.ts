// Record schemas for architecture.md §4. Cross-field rules encode statements the
// documents already make; they are not claims that any guarantee is Implemented.
// Deferred records: Grant* (Phase 7), VerificationRecord (Phase 4), Proposal (post-1.0),
// finding_events (shape not specified).
import { z } from "zod";
import {
  actionClass,
  baseFields,
  evidenceClass,
  evidenceKind,
  hex64,
  identityBasis,
  isoDateTime,
  maxStatus,
} from "./common.js";

const nonEmpty = z.string().min(1);
const positiveInt = z.number().int().min(1);
const pathPattern = z.string().startsWith("/");
// Secrets are references (environment variable names), never values. A name and a
// value cannot be told apart by shape alone; stronger checks belong to the policy package.
const secretRef = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "expected an environment variable name");
const httpUrl = z.string().refine((s) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}, "expected an http(s) URL");
const originString = z.string().refine((s) => {
  try {
    const u = new URL(s);
    return (u.protocol === "http:" || u.protocol === "https:") && s.replace(/\/$/, "") === u.origin;
  } catch {
    return false;
  }
}, "expected an http(s) origin without a path");

// ---------------------------------------------------------------- TargetProfile

const readOnlyRequest = z.strictObject({
  id: nonEmpty,
  origin: originString,
  pathPattern,
  method: z.literal("POST"),
  kind: z.enum(["graphql-query", "json-rpc-read", "search", "custom-allowlist"]),
  bodyRule: z.record(z.string(), z.unknown()),
  attestedBy: nonEmpty,
  reason: nonEmpty,
});

const network = z
  .strictObject({
    websocket: z.enum(["deny", "observe"]).default("deny"),
    workers: z.enum(["deny", "allow"]).default("deny"),
    webrtc: z.literal("deny").default("deny"),
    serviceWorkers: z.literal("block").default("block"),
    downloads: z.enum(["deny", "quarantine"]).default("deny"),
    permissions: z.literal("deny").default("deny"),
    schemes: z.array(z.enum(["http", "https"])).min(1).default(["http", "https"]),
    dnsMode: z.enum(["pinned", "system"]).default("pinned"),
    dnsPins: z
      .record(nonEmpty, z.array(z.union([z.ipv4(), z.ipv6()])).min(1))
      .default({}),
    readOnlyRequests: z.array(readOnlyRequest).default([]),
  })
  .prefault({});

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export const targetProfileSchema = z
  .strictObject({
    ...baseFields,
    name: nonEmpty,
    kind: z.enum(["web", "api"]),
    baseUrls: z.array(httpUrl).min(1),
    scope: z.strictObject({
      allowedOrigins: z.array(originString).min(1),
      deniedPathPatterns: z.array(pathPattern).default([]),
    }),
    network,
    auth: z
      .strictObject({
        profiles: z
          .array(
            z.strictObject({
              id: nonEmpty,
              type: z.enum(["none", "storageState", "header", "cookie"]),
              secretRefs: z.array(secretRef).default([]),
            }),
          )
          .default([]),
      })
      .prefault({}),
    identity: z
      .strictObject({
        source: z.enum(["header", "endpoint", "meta", "manual", "surfaceFingerprint"]).default("surfaceFingerprint"),
        key: nonEmpty.optional(),
        fingerprintUrls: z.array(pathPattern).default([]),
        fingerprintIgnore: z.array(nonEmpty).default([]),
      })
      .prefault({}),
    verification: z
      .strictObject({ minIdentityBasis: identityBasis.default("target_reported") })
      .prefault({}),
    stateIsolation: z.enum(["none", "declared-reset"]).default("none"),
    evidence: z
      .strictObject({
        classOverrides: z.partialRecord(evidenceKind, evidenceClass).default({}),
        retentionDaysOverrides: z.partialRecord(evidenceKind, z.number().int().min(1).max(180)).default({}),
        sensitiveSelectors: z.array(nonEmpty).default([]),
        traces: z.boolean().default(false),
      })
      .prefault({}),
    limits: z.strictObject({
      maxPages: positiveInt,
      maxRequests: positiveInt,
      maxDurationSec: positiveInt,
    }),
    stackHints: z.array(nonEmpty).optional(),
  })
  .superRefine((p, ctx) => {
    if (p.network.dnsMode !== "pinned") return;
    for (const origin of p.scope.allowedOrigins) {
      // An unparseable origin is already reported by its own check; this rule must not throw on it.
      if (!URL.canParse(origin)) continue;
      const host = new URL(origin).hostname;
      if (!LOOPBACK_HOSTS.has(host) && !p.network.dnsPins[host]?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["network", "dnsPins", host],
          message: "dnsMode pinned needs at least one pinned IP for every non-loopback allowed host",
        });
      }
    }
  });

// -------------------------------------------------------------- ProfileApproval

export const profileApprovalSchema = z.strictObject({
  ...baseFields,
  profileId: z.uuid(),
  policyHash: hex64,
  approvedBy: z.strictObject({
    label: nonEmpty,
    osUser: nonEmpty,
    // Only a human at a terminal or the dashboard can approve; adapters cannot (GR-22).
    method: z.enum(["tty", "dashboard"]),
    assurance: z.enum(["L1", "L2"]),
  }),
  approvedAt: isoDateTime,
  policyDiff: z.string(),
});

// ------------------------------------------------------------------- TestSpec

const confirmationPolicy = z
  .strictObject({
    maxStatus,
    k: positiveInt.nullable(),
    match: nonEmpty,
    minAttempts: positiveInt.optional(),
    maxAttempts: positiveInt.optional(),
    isolation: z.enum(["client-fresh", "declared-reset"]),
  })
  .refine((c) => c.maxStatus !== "confirmed" || c.k !== null, {
    message: "a confirmed ceiling needs k matching reproductions",
    path: ["k"],
  });

export const testSpecSchema = z
  .strictObject({
    ...baseFields,
    version: positiveInt,
    title: nonEmpty,
    origin: z.enum(["builtin", "authored", "generated"]),
    steps: z
      .array(z.strictObject({ action: nonEmpty, actionClass, params: z.record(z.string(), z.unknown()).default({}) }))
      .min(1),
    assertions: z
      .array(z.strictObject({ id: nonEmpty, kind: nonEmpty, params: z.record(z.string(), z.unknown()).default({}) }))
      .default([]),
    tags: z.array(nonEmpty).default([]),
    confirmation: confirmationPolicy,
    contentHash: hex64,
  })
  .superRefine((s, ctx) => {
    // architecture.md §4: generated specs are capped at suspected.
    if (s.origin === "generated" && s.confirmation.maxStatus === "confirmed") {
      ctx.addIssue({ code: "custom", path: ["confirmation", "maxStatus"], message: "generated specs cannot reach confirmed" });
    }
  });

// ------------------------------------------------------------------------ Run

export const RUN_STATUSES = ["running", "completed", "partial", "aborted", "errored"] as const;
export const TERMINAL_REASONS = {
  completed: ["completed"],
  partial: ["budget_exhausted"],
  aborted: ["user_abort", "crash_detected"],
  errored: ["guard_unavailable", "guard_probe_failed", "browser_failure", "store_failure", "internal_error"],
} as const;

const allTerminalReasons = Object.values(TERMINAL_REASONS).flat() as [string, ...string[]];

export const runSchema = z
  .strictObject({
    ...baseFields,
    targetId: z.uuid(),
    identity: z.strictObject({
      basis: identityBasis,
      buildId: nonEmpty.optional(),
      commit: nonEmpty.optional(),
      surfaceFingerprint: nonEmpty,
    }),
    policyHash: hex64,
    profileApprovalId: z.uuid(),
    // Audit only before Release 1.0; there is no grantId in Phase 1.
    mode: z.literal("audit"),
    guardMode: z.enum(["full", "l1_only"]),
    guardCoverage: z.record(nonEmpty, z.enum(["active", "unavailable", "untested", "uncontrolled"])),
    status: z.enum(RUN_STATUSES),
    terminalReason: z.enum(allTerminalReasons).optional(),
    startedAt: isoDateTime,
    endedAt: isoDateTime.optional(),
    manifest: z.strictObject({
      qaSentinelVersion: nonEmpty,
      nodeVersion: nonEmpty,
      playwrightVersion: nonEmpty,
      browserName: nonEmpty,
      browserVersion: nonEmpty,
      os: nonEmpty,
      profileHash: hex64,
      policyHash: hex64,
      specHashes: z.array(hex64),
      seed: z.number().int(),
      flags: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    }),
    manifestHash: hex64,
  })
  .superRefine((r, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    if (r.status === "running") {
      if (r.terminalReason !== undefined) issue("terminalReason", "a running run has no terminalReason");
      if (r.endedAt !== undefined) issue("endedAt", "a running run has no endedAt");
    } else {
      const allowed: readonly string[] = TERMINAL_REASONS[r.status];
      if (r.terminalReason === undefined || !allowed.includes(r.terminalReason)) {
        issue("terminalReason", `status ${r.status} needs one of: ${allowed.join(", ")}`);
      }
      if (r.endedAt === undefined) issue("endedAt", "a terminal run needs endedAt");
      else if (Date.parse(r.endedAt) < Date.parse(r.startedAt)) issue("endedAt", "endedAt precedes startedAt");
    }
    if (r.manifest.policyHash !== r.policyHash) issue("manifest", "manifest policyHash differs from the run policyHash");
  });

// ------------------------------------------------------------ ExecutionRecord

export const executionRecordSchema = z
  .strictObject({
    ...baseFields,
    runId: z.uuid(),
    specHash: hex64,
    attempt: positiveInt,
    outcome: z.enum(["passed", "failed", "errored", "skipped", "not_run"]),
    failureSignature: nonEmpty.optional(),
    steps: z.array(
      z.strictObject({
        n: positiveInt,
        action: nonEmpty,
        actionClass,
        result: z.enum(["ok", "failed", "blocked", "errored", "not_run"]),
        blockedByPolicy: z.boolean().optional(),
        durationMs: z.number().int().min(0),
      }),
    ),
    evidenceIds: z.array(hex64).default([]),
    error: z.string().optional(),
  })
  .superRefine((e, ctx) => {
    // `passed` can only exist on a record whose steps all ran (architecture.md §4, GR-11).
    if (e.outcome === "passed" && (e.steps.length === 0 || e.steps.some((s) => s.result !== "ok" || s.blockedByPolicy === true))) {
      ctx.addIssue({ code: "custom", path: ["outcome"], message: "passed requires at least one step and every step ok and not blocked" });
    }
  });

// ------------------------------------------------------------------- Evidence

export const evidenceSchema = z
  .strictObject({
    ...baseFields,
    id: hex64, // sha256 of the stored plaintext
    kind: evidenceKind,
    bytes: z.number().int().min(0),
    mime: nonEmpty,
    class: evidenceClass,
    redactionStatus: z.enum(["redacted", "partially_redacted", "not_redacted"]),
    encrypted: z.boolean(),
    redactions: z.array(nonEmpty).default([]),
    expiresAt: isoDateTime,
    executionRecordId: z.uuid(),
  })
  .superRefine((ev, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    if (ev.class === "restricted" && !ev.encrypted) issue("encrypted", "restricted evidence is encrypted at rest (GR-17)");
    if (ev.kind === "trace" || ev.kind === "download") {
      if (ev.class !== "restricted") issue("class", `${ev.kind} evidence is restricted`);
      if (ev.redactionStatus !== "not_redacted") issue("redactionStatus", `${ev.kind} evidence is not_redacted (GR-16, GR-26)`);
    }
    if (ev.kind === "screenshot" && ev.redactionStatus === "redacted") {
      issue("redactionStatus", "screenshots are at most partially_redacted (GR-16)");
    }
  });

// -------------------------------------------------------------------- Finding

export const findingSchema = z
  .strictObject({
    ...baseFields,
    targetId: z.uuid(),
    fingerprint: nonEmpty,
    title: nonEmpty,
    summary: nonEmpty,
    category: nonEmpty,
    checkId: nonEmpty,
    status: maxStatus,
    severity: z.enum(["critical", "high", "medium", "low", "none"]),
    confirmationPolicyId: nonEmpty,
    failureSignature: nonEmpty,
    reproSpecHash: hex64,
    reproductions: z.strictObject({
      attempts: z.number().int().min(0),
      matching: z.number().int().min(0),
      differing: z.number().int().min(0),
      errored: z.number().int().min(0),
    }),
    flakeRate: z.number().min(0).max(1).optional(),
    stateDependent: z.boolean(),
    // Every finding links to evidence (a tombstoned artifact keeps its row), AC-03.
    evidenceIds: z.array(hex64).min(1),
    firstSeenRunId: z.uuid(),
    lastSeenRunId: z.uuid(),
    failingIdentity: z.strictObject({ basis: identityBasis, buildId: nonEmpty.optional() }),
    lifecycle: z.enum(["open", "fix_claimed", "verified_fixed", "accepted_risk", "dismissed"]),
    provenance: z.enum(["deterministic", "model-assisted"]),
  })
  .superRefine((f, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    const r = f.reproductions;
    if (r.matching + r.differing + r.errored > r.attempts) issue("reproductions", "counts exceed attempts");
    if (f.status === "confirmed") {
      if (r.matching < 1) issue("status", "confirmed needs at least one matching reproduction");
      // architecture.md §4.2: `confirmed` is produced only by deterministic code.
      if (f.provenance !== "deterministic") issue("provenance", "only deterministic findings can be confirmed");
    }
  });

// -------------------------------------------------------------- EvidenceEvent

const tombstoneDetail = z.strictObject({
  hash: hex64,
  kind: evidenceKind,
  size: z.number().int().min(0),
  deletedAt: isoDateTime,
  reason: nonEmpty,
  method: nonEmpty,
});

export const evidenceEventSchema = z
  .strictObject({
    ...baseFields,
    evidenceId: hex64,
    type: z.enum(["created", "accessed", "exported", "retention_extended", "tombstoned"]),
    actor: z.strictObject({ label: nonEmpty, osUser: nonEmpty, method: nonEmpty }),
    detail: z.record(z.string(), z.unknown()).optional(),
    at: isoDateTime,
    prevHash: hex64.nullable(),
    hash: hex64,
  })
  .superRefine((e, ctx) => {
    if (e.type === "tombstoned" && !tombstoneDetail.safeParse(e.detail).success) {
      ctx.addIssue({ code: "custom", path: ["detail"], message: "tombstoned needs hash, kind, size, deletedAt, reason and method" });
    }
  });

// ------------------------------------------------------------- PolicyDecision

export const policyDecisionSchema = z
  .strictObject({
    ...baseFields,
    runId: z.uuid(),
    subject: z.enum(["spec", "request", "profile"]), // no grant subject before Phase 7
    decision: z.enum(["allow", "deny"]),
    actionClass,
    rule: nonEmpty,
    reason: nonEmpty,
    at: isoDateTime,
    prevHash: hex64.nullable(),
    hash: hex64,
  })
  .superRefine((d, ctx) => {
    // Audit only: no allow decision exists for A2/A3 before grants (Release 1.0).
    if (d.decision === "allow" && (d.actionClass === "A2" || d.actionClass === "A3")) {
      ctx.addIssue({ code: "custom", path: ["decision"], message: "A2/A3 cannot be allowed in audit mode" });
    }
  });

export const recordSchemas = {
  TargetProfile: targetProfileSchema,
  ProfileApproval: profileApprovalSchema,
  TestSpec: testSpecSchema,
  Run: runSchema,
  ExecutionRecord: executionRecordSchema,
  Evidence: evidenceSchema,
  Finding: findingSchema,
  EvidenceEvent: evidenceEventSchema,
  PolicyDecision: policyDecisionSchema,
} as const;
