# QA Sentinel — Architecture

> Status: Phase 0 draft, revision 5, pending approval. Implements the principles in `Brain.md`. Requirements: `prd.md`. Agent roles: `AGENT_ROLES.md`. Dashboard visuals: `design_system.md`. **Nothing here is implemented yet.**

## 0. How to read this document (assurance language)

Every protective mechanism in this document has an **assurance level**:

| Level | Meaning |
|-------|---------|
| **Designed** | Described in these documents. No code exists. |
| **Implemented** | Code exists in the repository. Not necessarily tested. |
| **Tested** | Automated tests, including adversarial fixtures, exist and pass, with the result recorded against a commit (`prd.md` acceptance criteria are the tests that move a mechanism here). |
| **Independently verified** | Reviewed or attacked by a party independent of the implementer (a human security reviewer, or a separate tool/agent not used to write it), with a written report against a pinned commit. |

**Language convention.** Present-tense sentences below ("the guard aborts the request") describe the **design**. A mechanism may be called a *guarantee* or *enforced* only when the Guarantee Register (§18) lists it at **Tested** or above. Until then the accurate wording is "designed to". As of this revision, **every entry in the register is Designed**; none is Implemented, Tested or Independently verified.

**Terms that must not be conflated.**
- **Redacted is not encrypted.** Redaction removes data before storage; encryption protects stored bytes. An encrypted artifact that was never redacted still contains all of its secrets once decrypted. Every artifact carries a separate `redactionStatus` and `encrypted` flag, and no document, report or UI may use one to imply the other (§11).
- **Reported is not attested.** A build id served by the target (header, endpoint, meta tag) is *reported by the target*. It is not cryptographic proof. The basis is therefore named `target_reported`; `independently_attested` is reserved for a future mechanism with a verifiable signature (§10).
- **Audit-only is not state-immutable.** Audit-only means no intentional, known state-changing actions (§5.1). It is not a guarantee that server-side state cannot change.
- **Full containment is not an L1-only preview.** Containment claims need both guard layers to pass their tests; an L1-only run is a labelled preview with incomplete guard coverage (§7.9).

## 1. Architectural goals

1. A **deterministic core** owns execution, policy and status assignment.
2. **Clients are thin.** CLI, dashboard, MCP and IDE commands translate requests to core calls and hold no business logic.
3. **Black-box first.** Targets are driven through a browser and HTTP; no access to the target's source or repository is needed.
4. **Everything is a record.** Runs, executions, evidence, findings, verifications, grants and approvals are persisted and typed; history tables are append-only.
5. **No AI or vendor coupling.** The execution engine has no AI dependency of any kind (§4.2).
6. **Capability absent beats capability disabled.** Features that widen risk (modifying actions, grants) ship in a later release; before then the code path does not exist.
7. **Privacy first.** Evidence is minimized, classified, redacted where redaction is reliable (and labelled `partially_redacted` or `not_redacted` where it is not), encrypted at rest when restricted, retained for a bounded time, and not exported by default (§11). Encryption is never presented as redaction.

## 2. System overview

```
 Clients (no business logic)                       Core (deterministic, no AI imports)
 ┌────────────────────────┐   ┌──────────────────────────────────────────────┐
 │ CLI  `qa-sentinel …`   │   │ Orchestrator                                 │
 │ Claude Code commands ──┼──►│   ├─ Profiler    (target discovery)          │
 │ MCP adapter (any tool) │   │   ├─ Planner     (checks → test specs)       │
 │ Dashboard (via API)    │   │   ├─ Guardian    (policy, grants) ◄── gate   │
 │ CI                     │   │   ├─ Executor    (runner + network guard)    │
 └────────────────────────┘   │   ├─ Analyst     (findings, confirmation)    │
                              │   ├─ Verifier    (independent fix checks)    │
        optional, post-MVP:   │   └─ Reporter    (reports, exports)          │
        ai-assist ──proposals─┤                                              │
        (never outcomes)      └───────────┬──────────────────┬───────────────┘
                                          │                  │
                                  ┌───────▼──────┐   ┌───────▼────────┐   ┌─────────────┐
                                  │ Store +      │   │ Runner         │──►│ Egress proxy│──► Target app
                                  │ Evidence     │   │ Playwright     │   │ (loopback)  │    (any stack)
                                  └──────────────┘   └────────────────┘   └─────────────┘
```

Agent roles are defined in `AGENT_ROLES.md`. Here they are modules with typed inputs and outputs.

## 3. Module boundaries

Proposed monorepo layout (created in Phase 1, not now). Dependencies point downward only.

| Package | Responsibility | May depend on |
|---------|----------------|---------------|
| `schema` | zod schemas and TS types for every record; JSON Schema export; `schemaVersion` | — |
| `store` | SQLite access, migrations, append-only enforcement, hash chains | `schema` |
| `evidence` | Redaction, classification, hashing, encryption, retention, export | `schema`, `store` |
| `policy` | Action classes, default-deny rules, scope checks, profile approval, grants (later), budgets | `schema`, `store` |
| `runner-api` | `Runner` interface only (types) | `schema` |
| `runner-playwright` | Playwright `Runner`, network guard, egress proxy, evidence capture | `runner-api`, `policy`, `evidence`, `schema` |
| `core` | Orchestrator, Profiler, Planner, Analyst, Verifier, Reporter, check packs | `schema`, `store`, `evidence`, `policy`, `runner-api` |
| `cli` | `qa-sentinel` command; reference client | `core` |
| `api` | Local HTTP API for the dashboard | `core` |
| `dashboard` | UI (optional package, Phase 5) | `api` (over HTTP only) |
| `adapter-mcp` | MCP server exposing a safe subset | `core` |
| `adapter-claude-code` | Command files that call the CLI with `--json` | CLI contract only |
| `ai-assist` | **Optional, post-MVP.** Produces `Proposal` records only | `schema` only |
| `fixtures/*` | Synthetic demo apps and `seeded-defects.json` | none (standalone) |

Rules (checked mechanically in CI once code exists):
- `core`, `policy`, `evidence`, `runner-*` and `store` import **no AI SDK and no `ai-assist`**. A dependency check fails the build otherwise (AC-15).
- `core` never imports `runner-playwright`; the runner is injected.
- No package imports from `adapter-*` or `ai-assist`. They depend on the core, never the reverse.
- `adapter-claude-code` depends only on the CLI/JSON contract (§12), so adapters for other tools are the same shape.

## 4. Data model

All records carry `id`, `schemaVersion`, `createdAt`. Types are conceptual; the zod schemas in `schema` are authoritative.

**TargetProfile** — one application under test.
`id, name, kind (web | api), baseUrls[], scope{allowedOrigins[], deniedPathPatterns[]}, network{websocket, workers (deny | allow), downloads, dnsMode (pinned | system), dnsPins{host: [ip]}, …}, auth{profiles[{id, type: none|storageState|header|cookie, secretRefs}]}, identity{source: header|endpoint|meta|manual|surfaceFingerprint, key?, fingerprintUrls[], fingerprintIgnore[]}, verification{minIdentityBasis}, stateIsolation (none | declared-reset), evidence{class overrides, retention overrides, sensitiveSelectors[], traces}, limits{maxPages, maxRequests, maxDurationSec}, stackHints?`
`network` holds the policy-relevant switches (§7): `websocket (deny*|observe)`, `webrtc (deny*)`, `serviceWorkers (block*)`, `downloads (deny*|quarantine)`, `permissions (deny*)`, `schemes ([http, https]*)`, `readOnlyRequests[]`. (`*` = default.)
Secrets are **references** (environment variable names), never values. The **policy section** (scope, network, deniedPathPatterns, auth refs, limits, stateIsolation, verification) is hashed into `policyHash`.

**ProfileApproval** — human acknowledgement of a profile's policy section.
`id, profileId, policyHash, approvedBy{label, osUser, method (tty|dashboard), assurance (L1|L2)}, approvedAt, policyDiff`. A run requires an approval whose `policyHash` equals the profile's current `policyHash` (§7.6).

**TestSpec** — one check, declarative and stack-neutral.
`id, version, title, origin (builtin | authored | generated), steps[], assertions[], tags[], confirmation{maxStatus, k, match, isolation}, contentHash`
`generated` specs (post-MVP, from `ai-assist`) are capped at `suspected` until a human promotes them to `authored`.

**Run** — one execution of a plan.
`id, targetId, identity{basis, buildId?, commit?, surfaceFingerprint}, policyHash, profileApprovalId, mode (audit | authorized), guardMode (full | l1_only), grantId?, guardCoverage{websocket, webrtc, serviceWorkers, downloads, proxy, …}, status (running | completed | partial | aborted | errored), terminalReason?, startedAt, endedAt, manifest`
`manifest = {qaSentinelVersion, nodeVersion, playwrightVersion, browserName, browserVersion, os, profileHash, policyHash, specHashes[], seed, flags}`; `manifestHash` is stored. `guardMode` is `full` (L1+L2) or `l1_only` (explicit, labelled preview, §7.9). `guardCoverage` records, per traffic class, whether the guard was active and verified at run start (`active | unavailable | untested`); the report shows it.

**Run status.** `status` is exactly one of five values. `running` is the only non-terminal value; the other four are terminal.

| Status | Meaning | `terminalReason` values | Unexecuted specs | Exit code |
|--------|---------|-------------------------|------------------|-----------|
| `running` | In progress | — | — | — |
| `completed` | Every planned spec reached a recorded outcome inside the budget, with the guard coverage recorded at start. **Not** "no defects" and not "contained" | `completed` | none | `0` or `1` (by `--fail-on`) |
| `partial` | Stopped by the per-run budget (FR-017) | `budget_exhausted` | `not_run` | `4` |
| `aborted` | Stopped by the user, or found by a later start to have died without closing (crash recovery) | `user_abort`, `crash_detected` | `not_run` | `4` |
| `errored` | The run could not proceed or complete **safely**: a required guard layer failed to install or failed its start-of-run probe in `full` mode, or the browser, the store or QA Sentinel itself failed | `guard_unavailable`, `guard_probe_failed`, `browser_failure`, `store_failure`, `internal_error` | `not_run` | `4` |

- **Terminal statuses are immutable.** A run moves `running` → one terminal status exactly once. A database trigger rejects any later change to `status` or `terminalReason`, in the same way it rejects history updates (AC-31, AC-47). Crash recovery is that single transition, performed by the next start of QA Sentinel.
- **`errored` keeps what happened.** Specs that executed keep their recorded outcomes; the rest are `not_run`; confirmation reruns are **not** started after a guard failure; the report, CLI summary and JSON print `RUN ERRORED` with the `terminalReason`. An `errored` run is never described as clean, contained or compared as a baseline.
- **Run-level versus spec-level.** Run `status: errored` (the run could not safely continue) is a different thing from an `ExecutionRecord` `outcome: errored` (one check could not complete). A run can be `completed` with some specs `errored`; a spec-level `errored` never changes the run status by itself.
- **Policy refusal before start creates no `Run`.** A missing or stale `ProfileApproval`, a refused flag or an invalid profile exits `2` or `3` before any run row exists (§7.6). A run row exists only once the guard self-check starts, so a guard failure is a recorded `errored` run, not a silent refusal.

**ExecutionRecord** — what actually happened for one spec attempt.
`id, runId, specHash, attempt, outcome (passed | failed | errored | skipped | not_run), failureSignature?, steps[{n, action, actionClass, result, blockedByPolicy?, durationMs}], evidenceIds[], error?`
Written only by the Executor. **`passed` can only exist on a record whose steps and assertions all ran.**

**Evidence** — hash-addressed artifact (§11).
`id (sha256 of the stored plaintext), kind (screenshot | trace | har | console | response | dom | axe | download), bytes, mime, class (public | restricted), redactionStatus (redacted | partially_redacted | not_redacted), encrypted, redactions[], expiresAt (as set at creation), executionRecordId`
The evidence row is **immutable**. Later history (access, export, retention extension, tombstone) is appended as `EvidenceEvent`s and never edits this row (§11).

**Finding** — a claim, with an honest status.
`id, targetId, fingerprint, title, summary, category, checkId, status (confirmed | suspected | informational), severity (critical | high | medium | low | none), confirmationPolicyId, failureSignature, reproSpecHash, reproductions{attempts, matching, differing, errored}, flakeRate?, stateDependent, evidenceIds[], firstSeenRunId, lastSeenRunId, failingIdentity{basis, buildId?}, lifecycle, provenance (deterministic | model-assisted)`
`lifecycle ∈ open | fix_claimed | verified_fixed | accepted_risk | dismissed`; every change is appended to `finding_events` and never edited.

**VerificationRecord** — independent re-check.
`id, findingId, fixClaim{actor, claimedAt, claimedBuildId?, claimedCommit?}, runId, outcome (verified_fixed | still_failing | inconclusive), identity{basis (target_reported | operator_asserted | surfaceFingerprint; independently_attested reserved), confidence (moderate | low), before, after}, checks{freshContext, buildChanged, claimMatchesReported?}, triggeredBy, sameActorAsClaim`
`freshContext` and `buildChanged` (on the same basis) **gate** `verified_fixed`; the basis and confidence are part of the result and are always displayed with it; `sameActorAsClaim` is **informational only** (actor identity is self-declared, see §9).

**Grant** — human authorization above audit level (introduced in Phase 7; absent before).
`id, targetId, policyHash, actionClasses[A2|A3], scope{originPatterns, pathPatterns, methods, specIds?, maxMutatingRequests}, reason, createdBy{label, osUser, method, assurance}, createdAt, notBefore, expiresAt, maxRuns, runsUsed, revokedAt?, signature`

**GrantRequest** — what an agent or client may create instead of a Grant: `id, targetId, requestedClasses, scope, justification, requestedBy (client label), status (pending | approved | denied | expired)`.

**GrantEvent** — append-only, hash-chained audit log: `id, grantId, type (requested | approved | denied | used | expired | revoked), actor{label, osUser, method, assurance}, runId?, requestRef?, at, prevHash, hash`.

**PolicyDecision** — Guardian/guard verdict (append-only, hash-chained): `id, runId, subject (spec | request | grant | profile), decision (allow | deny), actionClass, rule, reason, at, prevHash, hash`. Every denial and every blocked request has one.

**EvidenceEvent** — append-only, hash-chained history of each artifact: `id, evidenceId, type (created | accessed | exported | retention_extended | tombstoned), actor{label, osUser, method}, detail (for `tombstoned`: hash, kind, size, deletedAt, reason, method), at, prevHash, hash`.

**Proposal** (post-MVP, from `ai-assist`) — `id, kind (spec | hypothesis | summary), payload, model, createdAt, status (pending | accepted | rejected)`. A Proposal is **not** an execution result and has no field that can express an outcome.

### 4.1 Status rules (normative)

- **Outcome vocabulary.** `passed | failed | errored | skipped | not_run`. `errored` = the check could not complete (infrastructure or script error); it is never counted as pass or as defect evidence.
- **Finding status** is decided by the finding's **check-specific confirmation policy** (§6): `confirmed` requires the policy's k matching reproductions; the policy's `maxStatus` is a hard ceiling.
- **Run summary** always reports counts of `passed / failed / errored / skipped / not_run`, the guard mode and coverage, the identity basis and confidence, and the audit-only statement (§5.1). A clean run states exactly which checks ran; nothing is implied beyond them.
- **No pass from inference.** Only the Executor, from a real execution, sets an `outcome`.

### 4.2 AI independence (normative)

1. `outcome`, `failureSignature`, `confirmed` status, policy decisions, grants and approvals are produced only by deterministic code from runner observations and human actions.
2. AI components (`ai-assist`, post-MVP) may only create `Proposal` records. Proposals become effective only by passing deterministic schema validation and the Guardian, and `generated` specs are capped at `suspected` until a human promotes them.
3. No AI SDK or network call to a model provider exists in the engine packages (§3). The MVP ships no AI component at all and is fully functional without one.
4. Content from the target is untrusted data in any model prompt; model output that fails schema validation is discarded and logged, with no relaxed retry.
5. No evidence is sent to a model provider unless the profile opts in explicitly, and then only redacted text.

## 5. Action classes

| Class | Meaning | Available in |
|-------|---------|--------------|
| **A0 Observe** | Navigate (GET), read DOM, screenshot, read console/network | audit |
| **A1 Interact** | Click, type, scroll, client-side interaction; network limited to safe methods and approved read-only requests (§7.5) | audit |
| **A2 Mutate** | Any other HTTP method, form submit, creating or updating data | only with a Grant (Phase 7) |
| **A3 Destructive** | Deleting data, irreversible or payment-like operations, resets | only with a Grant that includes A3, plus per-run confirmation (Phase 7) |

Classes are assigned statically when a spec is validated, but **the network guard is the authority** and does not trust a spec's declared class.

### 5.1 What audit-only means, and does not mean

**Definition.** Audit-only means QA Sentinel takes **no intentional, known state-changing actions** against the target. It sends only requests the guard classifies as safe (`GET`, `HEAD`, `OPTIONS`, and profile-approved read-only POST rules), submits no forms, and performs no destructive interaction.

**It is not a guarantee that the target's server-side state cannot change.** Known ways state can still change:
- **`GET` side effects:** hit counters, audit and analytics logs, lazily populated caches, one-time tokens or links consumed on first view, and endpoints that wrongly change state on `GET`. QA Sentinel cannot detect these from outside; `deniedPathPatterns` can exclude known ones.
- **`Set-Cookie` and sessions:** responses may create or refresh server-side sessions or update "last seen" records, even for read-only browsing, especially with a pre-provisioned authenticated session.
- **Approved read-only POST requests:** a rule such as "GraphQL queries only" is parsed and enforced by the guard, but whether the server handles that request without side effects is the profile owner's attestation, not something QA Sentinel verifies.
- **Server background work:** rate limiters, caches, queues and jobs triggered by traffic.
- **Everything outside the browser:** other users, timers and deployments change state independently of the audit.

**Reporting.** Every report, CLI summary and dashboard run view carries this standard statement: "Audit-only: no intentional state-changing requests were sent. This does not guarantee the target's server-side state was unchanged (GET side effects, Set-Cookie sessions and approved read-only POST rules can still change it)." Reports also list the read-only POST rules and `deniedPathPatterns` that were in force.

## 6. Defect confirmation and reproduction

### 6.1 Confirmation policy (per check)

Every check carries a `ConfirmationPolicy`:
`{ maxStatus, k, match, minAttempts, maxAttempts, isolation }`
- **maxStatus** — hard ceiling: `confirmed | suspected | informational`.
- **k** — number of matching reproductions required (default 2).
- **match** — how the *failure signature* is computed (§6.2).
- **isolation** — `client-fresh` (new browser context per attempt; the only isolation available in audit mode) or `declared-reset` (a target-side reset the profile owner provides; authorized runs only).

Built-in check ceilings (initial; authored specs declare their own, default `confirmed`, k=2):

| Check | maxStatus | k | Failure signature (normalized) |
|-------|-----------|---|--------------------------------|
| Broken in-scope link / 4xx-5xx on GET | confirmed | 2 | method + normalized URL (query values dropped) + status code |
| Uncaught exception | confirmed | 2 | error type + message with numbers/hashes/URLs masked + top in-app frame (path only) |
| Mixed content | confirmed | 2 | resource URL (normalized) + page path |
| Accessibility rule violation (axe) | confirmed for rules axe reports as violations; informational for "incomplete/needs review" | 2 | rule id + normalized target selector + page path |
| Read-only form structure (missing label, etc.) | confirmed | 2 | rule id + element path + page path |
| `console.error` | suspected | – | message (masked) + source path |
| Network failure that is not a 4xx/5xx (DNS/reset/abort) | suspected | – | normalized URL + failure class |
| Missing/weak security headers | suspected | – | header name + page path |
| Slow request / large response over threshold | suspected | – | normalized URL + metric bucket |
| Client-side validation behavior | suspected | – | field + rule |
| Authored specs | author-declared (default confirmed) | author-declared | assertion id + normalized message |

"Confirmed" means *an automated check reproducibly failed*. For accessibility it never means WCAG conformance or non-conformance overall.

### 6.2 Failure matching and attempts

1. A failure **signature** is the canonical tuple defined by the check (table above), normalized so volatile parts (numbers, hashes, query values, timestamps, nonces) cannot cause false mismatches.
2. An attempt **matches** only if it fails with a signature **equal** to the original's. An attempt that fails differently is `differing`; one that passes is a non-reproduction; one that errors (infrastructure) is `errored` and does **not** count either way.
3. The Analyst runs up to `maxAttempts` (default 5) to obtain at least `minAttempts` (default k) valid attempts. If it cannot, the finding stays `suspected` with reason `unconfirmable`.
4. Outcomes:
   - all valid attempts match and count ≥ k, and the ceiling allows → **confirmed**;
   - some match and some pass → **suspected**, `flakeRate = matching / valid`, labelled `intermittent` once ≥ 5 valid attempts exist;
   - none reproduce → **suspected** (`not reproduced`);
   - the ceiling is below `confirmed` → never above the ceiling, whatever the attempts show.
5. Determinism controls for every attempt: fixed viewport, locale, timezone, reduced motion, recorded seed, same browser build; the run records them.

### 6.3 Server-side state

A black-box tool cannot isolate server state. The design is explicit about it:
- **Audit mode** sends no intentional state-changing requests (§5.1), so repeated attempts *usually* observe the same server state, which helps reproducibility. It does not guarantee it: side effects, sessions and other users can change state between attempts. Findings carry `stateDependent` if the signature depends on server-held data, and the report states that server state was shared and not controlled. `isolation` is `client-fresh` only.
- Identity is read before and after each confirmation attempt; if the build identity changes mid-confirmation, confirmation stops and the finding is `suspected` with reason `target changed during confirmation`.
- **Authorized runs** (Phase 7) that mutate state cannot reach `confirmed` unless the profile declares `declared-reset` isolation and the reset ran between attempts; otherwise their ceiling is `suspected`. QA Sentinel does not reset anything itself.

## 7. Network isolation and audit-only enforcement (design)

**Principle: default deny.** Everything not explicitly allowed is blocked, recorded as a `PolicyDecision`, and surfaced in the report. All switches below are in the profile's `network` block and are part of the approved `policyHash`.

### 7.1 Default-deny table

| Traffic / capability | Audit default | How it can change |
|----------------------|---------------|-------------------|
| Origins | Only `scope.allowedOrigins` (exact host and port; no wildcards) | Edit profile → needs re-approval (§7.6) |
| URL schemes | `http`, `https` only (no `file`, `ftp`, extension schemes; top-level `data:` navigation blocked) | Not changeable in audit mode |
| HTTP methods | `GET`, `HEAD`, `OPTIONS` | Read-only requests (§7.5); grants (Phase 7) |
| Redirects out of scope | Blocked | — |
| WebSockets | **Denied** | `websocket: observe` (§7.3) |
| WebRTC | **Denied** | — |
| Service workers | **Blocked** | — |
| Dedicated and shared workers | **Denied** (`network.workers: deny`, §7.3) | `workers: allow` is an approved profile choice; worker traffic is then **uncontrolled** and labelled |
| DNS resolution | **Not performed by QA Sentinel** in `dnsMode: pinned`; the proxy connects to pinned IPs (§7.10) | `dnsMode: system` (approved profile choice); DNS then leaves the machine and is **not covered** by any containment claim |
| Downloads | **Denied** | `downloads: quarantine` (§7.4) |
| Browser permissions (camera, mic, geolocation, notifications, clipboard) | **Denied** | — |
| Popups / new windows | Allowed only to in-scope origins; context-level rules apply | — |
| Form submission (`POST` navigation) | Blocked (a non-safe method) | Grants (Phase 7) |

### 7.2 Layers

1. **L1 — in-browser guard.** A context-level request interceptor (`context.route`) installed before any page loads checks origin, scheme, method, path and body policy for every request, aborts violations, and records them. WebSocket routing, service-worker blocking, download denial and permission denial are configured on the same context.
2. **L2 — egress proxy.** The browser is launched with all traffic routed to a QA Sentinel loopback proxy (Node standard library) that refuses any destination not in `allowedOrigins` (host and port), including direct IPs and other ports. For HTTPS it sees only the destination (CONNECT), not the method, so **method enforcement stays in L1**; L2 provides a browser-wide default-deny on destinations that does not depend on Playwright routing, which covers service workers, worker-originated requests and anything routing misses at the TCP level. Chromium bypasses proxies for loopback by default, so loopback targets need the bypass override. Name resolution is defined in §7.10: in `dnsMode: pinned` the proxy never calls a resolver. These details are to be confirmed in the Phase 2 spike. Chromium may also use QUIC/HTTP3 over UDP, which a TCP proxy does not see; QUIC is disabled at launch (to be verified by AC-39 and AC-38). **Acceptance gate:** L2 counts toward Release 0.1's containment claim only if it passes AC-39 and AC-38. If it does not, there is no unqualified Release 0.1: only a clearly labelled **0.1-preview** in L1-only mode may be released, with incomplete guard coverage reported and no equivalent-containment claim (§7.9).
3. **L3 — OS isolation (optional, post-MVP).** Run the browser in a container or network namespace or as a dedicated OS user with an egress firewall allowlist. Recommended for authorized (A2/A3) runs against non-local targets and for high-assurance use.

Each layer is independent: a gap in one is meant to be caught by another, and the run report lists which layers were active.

### 7.3 WebSockets and WebRTC

- **WebSockets: denied by default.** The L1 WebSocket route closes any connection immediately (policy-violation close code) without contacting the server, and records it. Playwright's docs confirm a handler can close a socket without connecting.
- Client-to-server WebSocket frames cannot be classified as read-only from outside, so audit mode never forwards them. The alternative `websocket: observe` connects to an in-scope origin, forwards **server→page** frames, **drops and records every page→server frame**, and marks the run `websocket-restricted`. Apps whose rendering depends on sending frames will be partly untestable in audit mode; that limitation is reported, not hidden.
- **WebRTC: denied.** Defense in depth: constructors for peer connections and data channels are removed by an init script in every frame; the browser is launched with its WebRTC IP-handling policy set to disable non-proxied UDP. Playwright has no routing for WebRTC, so this protection rests on those two measures and on L2/L3; its effectiveness is **unproven** until tested (AC-23).
- **Worker-originated WebSockets: enforcement mechanism (Designed; unproven until AC-46 runs).** Playwright routing is not documented to cover sockets opened from workers, and **L2 cannot block a WebSocket to an allowed origin**: after `CONNECT` the proxy sees only an opaque TLS tunnel, so a `wss://` connection to an in-scope host is indistinguishable from other HTTPS traffic to it. L2 is therefore **not** an enforcement layer for this class and nothing in this design pretends it is. The mechanism is to **prevent workers from existing** rather than to filter their sockets:
  1. **Default `network.workers: deny`**, enforced by two independent in-browser measures. (a) An init script, installed with the context before any page script and running in every frame, removes the `Worker` and `SharedWorker` constructors and `navigator.serviceWorker`. (b) L1 adds a second `Content-Security-Policy` header with `worker-src 'none'` to every in-scope document response (an additional CSP header can only tighten the effective policy). Measure (b) also blocks `blob:` and `data:` workers that never touch the network. Service workers stay blocked by the context option (§7.4).
  2. **CSP `connect-src` is not used to filter WebSockets.** It matches by scheme and host and is not expected to distinguish a WebSocket from an HTTP request to the same in-scope host; that behavior is unverified, so no claim rests on it. CSP is used here only for `worker-src`.
  3. **Page-originated WebSockets** remain handled by the L1 close-without-connect route (AC-22).
  4. **`workers: allow`** is a profile option inside `policyHash` (human re-approval required). When set, worker-originated HTTP traffic is limited only by L2 destination refusal, **worker-originated WebSockets are uncontrolled**, the run is labelled `workers-allowed`, `guardCoverage.workerWebSocket` reads `uncontrolled`, `websocket: observe` is not supported for worker sockets, and no worker-WebSocket claim (GR-31) may be made for that run.
  5. **Adversarial test (AC-46).** The fixture tries `new Worker(url)`, module workers, `SharedWorker`, `blob:` and `data:` workers, workers created inside same-origin iframes, `about:blank` and `srcdoc` frames, nested workers and `importScripts`, and from any worker that starts, a WebSocket to an allowed origin. The pass condition is that no worker executes and the fixture server's own log shows no WebSocket upgrade from any of them (observation independent of the guard).
  6. **If AC-46 fails or has not been executed**, AC-46, AC-22's worker coverage and GR-31 stay **unpassed**, the unqualified Release 0.1 is blocked, and no report, README, release note or CLI text may state or imply that worker-originated WebSocket traffic is controlled. No reliable L2 backstop exists; the only stronger option is OS-level isolation (L3), which is post-MVP.
  7. **Cost of the mechanism.** Targets that need workers will render or behave differently under `deny`; that is reported per run and never hidden. Injecting `worker-src 'none'` changes response headers, which is the only target-visible modification QA Sentinel makes and is listed in the run manifest.
- Whether `addInitScript` reaches every frame type (`about:blank`, `srcdoc`, sandboxed iframes) before page scripts, and the side effects of the injected `worker-src` header, are measured in the Phase 2 spike; they are unproven (§20).

### 7.4 Service workers and downloads

- Contexts are created with service workers **blocked** (Playwright docs: registration is blocked), so no request bypasses routing through a service worker.
- Downloads are denied (`acceptDownloads: false`). With `downloads: quarantine`, files are written to a quarantine directory (`0700`), size-capped, hashed, classified `restricted`, **never opened or executed**, and expire with traces (§11).

### 7.5 Read-only POST policy

Some read APIs use `POST` (GraphQL queries, JSON-RPC reads, search). By default they are blocked. A profile may list `readOnlyRequests[]` entries:
`{ id, origin, pathPattern, method: POST, kind: graphql-query | json-rpc-read | search | custom-allowlist, bodyRule, attestedBy, reason }`
- The guard **parses the body** and applies the rule: `graphql-query` allows only a document whose operations are all `query` (rejects `mutation`/`subscription`, rejects batches containing any non-query, rejects persisted-query ids unless mapped by the profile); unparsable bodies are denied; `custom-allowlist` matches a profile-declared body schema.
- The rule is **part of `policyHash`**, so adding or widening it requires human re-approval (§7.6). `attestedBy` is a self-declared label; it records responsibility, not proof.
- Every allowed read-only request still produces a `PolicyDecision` with the rule id. These entries do not make a target safe: a server that implements a "query" with side effects is outside what QA Sentinel can detect.

### 7.6 Profile policy lock

An agent that can edit files could widen a profile (`allowedOrigins`, `network`, `readOnlyRequests`). To prevent silent widening:
- The profile's policy section is hashed to `policyHash`.
- `qa-sentinel target approve <id>` (human-only: TTY or dashboard) shows the policy diff since the last approval and records a `ProfileApproval`.
- A run refuses to start (exit code 3) unless an approval matching the current `policyHash` exists. Changing non-policy fields (name, notes, stack hints) does not invalidate it.
- This inherits the limits in §9: it stops accidental or non-interactive widening, not a malicious same-user process.
- **CI requires a pre-approved workspace.** Approvals live in the workspace and need a human TTY or dashboard. A fresh CI workspace has no approval and is **refused** (exit code 3, AC-45); no flag, environment variable or repository file bypasses this in Release 0.1. A reviewed CI approval mechanism (for example a committed approval file pinning the `policyHash` at a lower, labelled assurance level) is an open question (Q-16) and does not exist until it is designed, reviewed and approved. Until then CI can only run in a workspace where a human has already approved the current policy.

### 7.7 Fail closed

In the default `full` guard mode every required layer (L1 and L2) must install and pass the start-of-run self-check (a probe request to an out-of-scope origin, a probe non-safe request, a probe WebSocket, a probe worker creation that must be denied, a probe to a non-proxied destination). If any fails, the run ends `errored` with `terminalReason: guard_unavailable` or `guard_probe_failed` (§4); **it never silently downgrades**. `l1_only` is selected only by the explicit option `--guard l1-only`, is recorded in the manifest, and is used for the labelled preview (§7.9). In either mode, a traffic class that is unavailable or untested is recorded in `guardCoverage` and the report prints "guard coverage incomplete". A run is never described as contained unless its mode is `full` **and** the Guarantee Register shows the relevant entries Tested; reports print the register's assurance levels.

### 7.8 Known limits

- Audit-only is not a state-immutability guarantee (§5.1): `GET` side effects, `Set-Cookie` sessions, approved read-only POST rules and server background work can change server state. `deniedPathPatterns` reduce but cannot remove the risk, and every report states the limitation.
- Blocking `POST` means login forms cannot be used in audit mode; authentication uses a pre-provisioned session (Q-04).
- **Worker-originated WebSockets** are prevented only by denying workers (§7.3). With `workers: allow` they are uncontrolled, and L2 cannot block a WebSocket to an allowed origin.
- **DNS** is not performed by QA Sentinel in `dnsMode: pinned`; in `dnsMode: system` the OS resolver may query a resolver outside the machine, which no containment claim covers (§7.10).
- **Screenshots** mask only configured selectors and may still contain secrets (§11).

### 7.9 Guard modes and traffic-class coverage

Two modes exist. The mode is recorded on every run (`guardMode`) and printed in every report, CLI summary and JSON result.

| Mode | Layers | Used for | Containment claim |
|------|--------|----------|-------------------|
| **`full`** (default) | L1 + L2 (+ L3 optional) | Release 0.1 and later | Allowed per traffic class **only** where the Guarantee Register shows that class Tested |
| **`l1_only`** (explicit `--guard l1-only`) | L1 only | A clearly labelled **0.1-preview** if L2 fails AC-39; local experimentation | **None.** Reports state "L1-only preview: guard coverage incomplete; containment is not equivalent to full mode", and AC-38 is shown as *not evaluated* |

Traffic-class coverage by mode. Every entry is **Designed** today; "Required test" is what must pass before the claim may be made.

| Traffic class | `l1_only` guard | `full` adds | Required test |
|---------------|-----------------|-------------|---------------|
| Page HTTP(S) requests (navigation, fetch, XHR, subresources): origin, scheme, method, path | L1 request interception | L2 destination refusal | AC-05, AC-06, AC-21, AC-39 |
| Redirects out of scope | L1 | L2 | AC-06 |
| Service-worker registration and requests | L1 context option (block) | L2 destination refusal | AC-22 |
| Dedicated/shared worker **creation** | L1 init-script constructor removal plus injected `worker-src 'none'` (two independent in-browser measures, **unverified**) | L2 destination refusal for anything that slips through | AC-46 |
| Dedicated/shared worker HTTP requests (only with `workers: allow`) | L1 coverage **unverified** | L2 destination refusal (host and port only) | AC-06, AC-39 |
| WebSocket opened from a page | L1 close-without-connect | same (L2 cannot see frames or TLS upgrades) | AC-22 |
| WebSocket opened from a worker | Prevented **only** by worker denial; no direct control | **None**: L2 cannot block a WebSocket to an allowed origin inside a TLS tunnel | AC-46 |
| WebRTC, UDP, QUIC | L1 init script (page frames only) plus browser WebRTC policy | L2 does not carry UDP; QUIC disabled at launch | AC-23, AC-38, AC-39 |
| Downloads | L1 option | — | AC-24 |
| Browser permissions and non-HTTP(S) schemes | L1 | — | AC-21 |
| DNS and any other non-proxied outbound connection | **not controlled** | L2 forces proxying; `dnsMode: pinned` means no resolver is called (§7.10); `dnsMode: system` is **not covered**; verified by independent observation | AC-38, AC-49 |
| Method enforcement over HTTPS | L1 only (L2 sees the destination, not the method) | same | AC-05 |

In `l1_only` mode the following are **not claimable at all**: that outbound traffic is restricted (AC-38), that workers, DNS or non-proxied traffic are controlled, and equivalence with `full` mode. In `full` mode a class is claimable only after its test is Tested; classes with unverified coverage stay `untested` in `guardCoverage`.

**AC-38 evidence rule.** Outbound traffic must be observed at a layer **independent of the guard**, system-wide, covering TCP, UDP, QUIC and DNS, for every process the run starts and for resolver processes acting on their behalf, while the fixture exercises each class adversarially. Guard logs alone are not evidence. AC-38 can be passed only in `full` mode with `dnsMode: pinned` (or loopback-only targets); a `dnsMode: system` run cannot pass it. If no reliable independent observation exists on a supported OS, AC-38 is **not passed** and the unqualified Release 0.1 is blocked. The criterion is not narrowed to make this easier.

### 7.10 DNS and name resolution

This section resolves the apparent contradiction between "only the in-scope target and loopback" and an external DNS resolver: **in the claimed configuration no DNS query is made at all.**

- **Who resolves.** Only the QA Sentinel egress proxy process may resolve names, and in `pinned` mode it does not. The browser sends hostnames to the proxy and must not resolve destinations itself; browser-side resolution paths (DNS prefetch, built-in secure DNS, a local resolver for proxy-bypass hosts) are disabled at launch. Which flags achieve that is **unverified** and decided in the Phase 2 spike. No other QA Sentinel process resolves names for the target.
- **`dnsMode: pinned` (proposed default, Q-30).** The profile carries `dnsPins: {host: [ip, …]}` inside `policyHash`, so adding or changing a pin needs human approval. For each allowed `host:port` the proxy connects to a **pinned IP literal** and never calls `dns.lookup`, `dns.resolve` or any resolver. `localhost` and loopback literals map to `127.0.0.1`/`::1` without any lookup. An allowed host with no pin is refused and recorded. TLS still uses the hostname for SNI and certificate checks. The operator owns pin accuracy.
- **`dnsMode: system`.** The proxy process calls the OS resolver (`getaddrinfo`; on macOS this goes through the system resolver daemon, and it may use encrypted DNS). That can send queries to a resolver outside the machine, which is a connection to a third party, so a `system` run **cannot pass AC-38 and cannot claim GR-25**. Its reports say "DNS via system resolver: not covered" and make no outbound-restriction claim.
- **Independent DNS observation.** Per-process socket listing is not sufficient, because a lookup made through the system resolver daemon is sent by that daemon, not by a QA Sentinel process. Observation therefore uses packet capture on the machine's interfaces (UDP and TCP 53, TCP 853, UDP/TCP 5353, UDP 443 for QUIC, plus any non-loopback connection by a run process), or an isolated network namespace or firewall that denies everything except loopback and logs attempts (L3). The fixture uses unique reserved-TLD canary names (`*.test`, `*.invalid`) in links, redirects, fetches and `dns-prefetch` hints; AC-38 requires zero queries or connections for them. Encrypted DNS appears as a non-loopback connection and is caught that way, not by content. Packet capture normally needs elevated privileges; whether this is practical on each OS is Q-25.
- **If no reliable design can be established**, AC-38 and AC-49 stay unpassed and the unqualified Release 0.1 is blocked (§17). Nothing in this section is Implemented or Tested.

## 8. Data flows

**Audit**
1. `qa-sentinel audit <target>` → Orchestrator loads the profile and checks the `ProfileApproval` against `policyHash`.
2. Start-of-run guard self-check (§7.7); `guardCoverage` is recorded. In `full` mode a failed layer or probe ends the Run `errored` here: no spec executes, all are `not_run`, no confirmation rerun starts (§4).
3. Profiler performs a bounded, scope-limited discovery.
4. Planner selects check packs and authored specs → TestSpecs.
5. Guardian pre-checks the plan (classes vs mode, budgets). Over-class specs are rejected with a recorded reason, not downgraded silently.
6. Executor runs each spec under L1/L2 → ExecutionRecords + Evidence (redacted before hashing, §11).
7. Analyst derives candidate findings, deduplicates by fingerprint, runs confirmation per the check's policy (§6).
8. Reporter renders reports (JSON canonical, Markdown, self-contained HTML) into `reports/<runId>/`.
9. Orchestrator closes the Run with exactly one terminal status (`completed`, `partial`, `aborted` or `errored`, §4), the `terminalReason`, a summary including `not_run`, guard coverage and identity basis. The status is immutable afterwards.

**Fix claim and verification** (Phase 4)
1. An external actor calls `qa-sentinel finding claim-fix <id> --actor <label> --build <build-id> [--commit <sha>]`; the finding becomes `fix_claimed` (not fixed).
2. `qa-sentinel verify <finding>` → the Verifier runs the **frozen** repro spec per the check's confirmation policy against the current build (§10).
3. A `VerificationRecord` stores identity basis, `freshContext` and `buildChanged`. Only a VerificationRecord can move a finding to `verified_fixed`.

**Authorization** (Phase 7)
1. A client creates a `GrantRequest`. 2. A human approves (§9). 3. The Guardian validates at plan time and the guard at request time. 4. Each use is a `GrantEvent`.

## 9. Human authorization: threat model and grants (Phase 7)

**What TTY confirmation is and is not.** A TTY prompt with a typed confirmation is a **friction and intent signal**. It makes accidental or non-interactive use by an agent fail. It is **not proof of human identity**: a process running as the same OS user can allocate a pseudo-terminal, read the signing key, or edit the database. QA Sentinel therefore records *how* an approval happened and does not claim more.

**Assurance levels of an approval**

| Level | Mechanism | Resists | Does not resist |
|-------|-----------|---------|-----------------|
| **L1 (default)** | Interactive TTY (stdin and stdout) with typed confirmation, or authenticated dashboard session with confirmation dialog; key in a `0600` file outside the workspace | Accidental use, non-interactive agents, model error, prompt injection | A same-user process with shell access (pseudo-terminal, key theft, DB edit) |
| **L2 (post-MVP option)** | Approval and signing performed by a separate privileged helper or OS user, with out-of-band confirmation (OS authentication prompt or a passkey/WebAuthn in the dashboard); signing key not readable by the agent's user | Same-user agents | A compromised administrator or the human being deceived |

Every approval records its level. Reports and the dashboard show the level; L1 is never presented as identity verification.

**Grant properties (all enforced by the Guardian at plan time and by the guard at request time)**
- **Binding:** a grant stores the `policyHash` it was approved against; changing the profile policy invalidates it.
- **Scope:** target, origin patterns, path patterns, methods, optional spec ids, `maxMutatingRequests`.
- **Expiry:** `notBefore` and `expiresAt`. Defaults: A2 60 minutes, A3 15 minutes; configurable ceiling 24 hours. No auto-renewal; renewal is a new approval.
- **Use limits:** `maxRuns` (default 1) and `maxMutatingRequests`; counters are updated transactionally before each mutating request.
- **A3:** additionally requires typed per-run confirmation naming the target; unattended CI cannot run A3.
- **Revocation:** `qa-sentinel grant revoke` (human-only) writes a `revoked` event. The guard reads the grant state from the store **before every A2/A3 request**, so revocation applies from the next request; a request already in flight is not recalled.
- **Signature:** HMAC-SHA-256 over the canonical grant JSON with a key outside the workspace. This detects accidental or partial tampering of rows; at L1 it does **not** stop a same-user process that can read the key.
- **Audit records:** `GrantEvent`s (requested, approved, denied, used per request, expired, revoked) with actor label, OS user, method, assurance level, run id and request reference; hash-chained so a removed or edited event breaks the chain (tamper-evident, not tamper-proof), plus a `PolicyDecision` per A2/A3 request.
- **Absent before Phase 7:** no grant code ships in Releases 0.1–0.4, so non-safe requests are unreachable by construction apart from the profile-approved read-only entries (§7.5).

## 10. Fix verification

**Identity and confidence.** Verification compares the target's identity before and after a fix, always with a stated **basis** and **confidence**:

| Basis | Source | Confidence | What it is *not* |
|-------|--------|------------|------------------|
| `independently_attested` | **Reserved; not designed in detail.** A signed build attestation verified against a trusted key the target does not control | High, if ever implemented | — |
| `target_reported` | The target reports a build id or commit (response header, version endpoint or meta tag per `identity.source`) and it equals the claimed `--build`/`--commit` | Moderate | **Not cryptographic proof.** The target, a proxy or cache in front of it, or a mistaken deploy can report any value |
| `operator_asserted` | The operator supplies `--build-id`; nothing independent confirms it | Low | A statement of what a person says happened, not evidence that the target changed |
| `surfaceFingerprint` | Hash of normalized served content (below) | Low; **fallback evidence only** | Cannot see backend-only changes; can change for unrelated reasons |

- The profile's `verification.minIdentityBasis` (part of the approved policy section) is the minimum basis that may produce `verified_fixed`. **Default: `target_reported`.** Lowering it to `operator_asserted` or `surfaceFingerprint` is an explicit, human-approved profile choice and is stated in every result. Below the minimum the result is `inconclusive`.
- Every result carries its basis and confidence and is never displayed or exported as a bare "verified". Example: "verified_fixed (basis: target_reported, confidence: moderate)". Results on `operator_asserted` never use wording that suggests the target confirmed the change.
- A claim whose `--build`/`--commit` does not match what the target reports gives `inconclusive` (`claim does not match reported identity`).
- Identities on different bases are never compared with each other.
- `buildChanged` means the identity differs from the finding's `failingIdentity` **on the same basis**. Under `operator_asserted` it records only that the operator said so. It is necessary, not sufficient: the frozen repro must also pass in all required valid attempts under its confirmation policy.

**Surface fingerprint (fallback).** SHA-256 over: for each URL in `identity.fingerprintUrls` (default: the base URL), the HTML after normalization (collapse whitespace, remove comments, drop `nonce` attributes, CSRF/meta token values, and anything matched by `fingerprintIgnore` selectors or patterns), plus for every same-origin script and stylesheet the SHA-256 of its **content** (not only its URL). Backend-only changes are invisible to it, and dynamic content not covered by the ignore rules can cause false "changed" results; both are reported as limits, and its confidence is always shown as low.

**Independence.** The Verifier is QA Sentinel code, not the fixer. It must use the frozen repro (the spec hash stored at confirmation) and cannot be told to assume success. Actor identity is self-declared, so `sameActorAsClaim` is informational.

## 11. Evidence lifecycle (privacy first)

Stages: **capture → classify → redact (where reliable) → label → hash → (encrypt) → store → access → export → retain → tombstone.**

**Redaction and encryption are different protections.** *Redaction* removes data before storage. *Encryption* protects stored bytes from other readers. An encrypted artifact that was never redacted still contains all of its secrets once decrypted. Every artifact therefore carries two independent facts, `redactionStatus` and `encrypted`, and no document, report or UI may use one to imply the other.

**`redactionStatus` values**

| Value | Meaning | Examples |
|-------|---------|----------|
| `redacted` | All configured redaction rules were applied, including **exact-value scrubbing of text**. This is **not** proof that nothing sensitive remains | **Text artifacts only**: captured request/response data, console logs, DOM text captures, reports |
| `partially_redacted` | Only masking was applied; other content, including **pixels**, is unmodified and may contain secrets | **Screenshots** (configured selectors masked only) |
| `not_redacted` | No reliable redaction exists | **Traces**, quarantined downloads, any raw capture |

Exact-value secret-removal claims and acceptance criteria (AC-19, AC-32, GR-16) apply **only** to the database, logs, reports and artifacts labelled `redacted`, that is, text artifacts where exact-value scrubbing is reliable, and only within the documented rules and encodings. They make **no claim** about `partially_redacted` artifacts (screenshots) or `not_redacted` artifacts (traces, downloads), and no report may state or imply that such artifacts are free of secrets. **No document may claim that screenshot contents are secret-free** unless a mechanism for it has been implemented and tested against a recorded commit.

**Screenshot masking limits.** Screenshots use Playwright's `mask` option on the profile's `sensitiveSelectors`. That obscures those elements only. It does **not** guarantee that a resolved secret is absent from the image: a secret rendered outside a masked element (a toast, an error banner, a URL or text shown elsewhere, a canvas, an image, a cross-origin iframe, a shadow-DOM or dynamically inserted node that no selector matches, a secret split across elements) stays in the pixels, and no OCR or pixel analysis is performed. Consequences: screenshots are always `partially_redacted`; screenshots from authenticated runs are `restricted` and encrypted at rest (storage protection, not redaction); retention follows FR-065; viewing and export are gated and logged (§11 events); reports and the UI show the masking limit next to every screenshot and never use "secret-free" or "sanitized" wording for them. An optional mitigation (a DOM pre-scan that masks any node whose visible text contains a resolved secret before capture) is **not designed**; if ever adopted it needs its own requirement, an adversarial planted-secret test, a new register entry and a recorded decision (Q-28) before any pixel-level claim is made. AC-48 tests that the limit is documented and labelled, not that screenshots are clean.

**Capture minimization.** Store only what supports a finding or the run record: response bodies only for failing assertions (size-capped), DOM snapshots only for failing checks, screenshots only on failure or at declared checkpoints. **Traces are off by default for every run.**

**Classification.** `public` = from runs with no auth profile; `restricted` = anything from an authenticated run, all traces, all downloads, and anything the profile marks sensitive.

**Redaction (applied where reliable, before hashing; the stored hash is of the stored content).**
1. Headers: store values only for an allowlist; all others keep the name with the value removed. Cookies and `Set-Cookie` values are always removed.
2. URL query values are removed by default for names matching secret-like patterns and any names the profile lists.
3. JSON/form body fields are removed by configured paths.
4. **Exact-value scrubbing (text only):** every resolved secret value (from the profile's environment references), and its URL-encoded and base64 forms, is removed from every text artifact (captured request/response data, console logs, DOM text captures), the database, logs and reports. This does **not** reach pixels, and other encodings (for example HTML entities, hex or custom encodings) are outside the guarantee.
5. Screenshots mask `sensitiveSelectors` (selector masking only; see the limits above); DOM captures drop input values.
6. A high-entropy-token heuristic **flags** possible leftovers for review; it is not a guarantee.
7. `redactions[]` lists what was applied. Playwright's HAR recording has no redaction option (per its docs), so raw HAR is **never** written to the artifact store; HAR-like data is built from captured events or sanitized before hashing.

**Traces.**
- Off by default; `--trace` is an explicit per-run opt-in.
- **Authenticated runs: unavailable in Release 0.1.** `--trace` on a target with an auth profile is refused (exit code 2, "authenticated traces unavailable: no tested handling strategy"). The capability is absent, not merely disabled.
- Opt-in traces from unauthenticated runs are `restricted`, `not_redacted`, written only if encryption at rest is available, retained 7 days, never embedded in or exported with reports by default, and labelled "NOT REDACTED" wherever shown. They are excluded from every secret-removal criterion.
- Authenticated traces may be introduced only by a later, recorded decision that adds a **tested handling strategy**: a documented approach (for example post-processing trace archives to strip network and DOM payloads, or limiting traces to screenshots) that is implemented and covered by an acceptance criterion which plants secrets and proves their absence from the result, or proves the trace cannot be produced, recorded against a commit. Until then no such strategy exists and no claim is made (Q-26).

**Storage and encryption.**
- Artifacts are stored as `artifacts/sha256/<ab>/<hash>`; directories `0700`, files `0600` on POSIX.
- `restricted` artifacts are encrypted at rest with AES-256-GCM (Node's built-in `crypto`, no dependency) using a per-workspace data key wrapped by a key held in the OS keychain (reached through the platform's command-line tool, `security` on macOS or `secret-tool` on Linux, because Node has no built-in keychain API), or derived from a passphrase (scrypt) (Q-18). Restricted capture is refused when encryption is unavailable. `public` artifacts are not encrypted at rest; full-disk encryption is assumed for the machine.
- Encryption protects against disk loss, backups and other users. It does **not** protect against a same-user process that can reach the keychain or an unlocked key, and it is **not redaction**.
- The SQLite database holds redacted metadata and finding text; it is not encrypted by default (an encrypted SQLite build is a possible later option).
- **Windows:** POSIX permission claims do not apply. On Windows, `restricted` evidence is only written when app-level encryption is configured; otherwise restricted capture is disabled (G-08).

**Access.** Viewing `restricted` evidence in the dashboard or via `evidence show --reveal` appends an `accessed` evidence event.

**Retention (defaults, configurable per profile and globally).**

| Item | Default retention |
|------|-------------------|
| Run manifests, findings, finding events, verification records, policy decisions, grant events, evidence rows and evidence events | Indefinite (small metadata) |
| `public` artifacts | 90 days |
| `restricted` screenshots/response data | 30 days |
| Traces and quarantined downloads | 7 days |
| `public` artifacts and `restricted` screenshots/response data referenced by an **open** finding | Kept until the finding is closed + 30 days, hard cap 180 days. Traces and quarantined downloads are never extended |

**Tombstones and history (append-only).** Evidence history is never edited. The `evidence` row (hash, kind, size, class, `redactionStatus`, `encrypted`, `expiresAt` as set at creation) is immutable. Everything that happens afterwards is an appended, hash-chained **evidence event**: `created`, `accessed`, `exported`, `retention_extended`, `tombstoned`. `prune --apply` and `evidence purge` (both human-confirmed; `prune` is dry-run by default) append a `tombstoned` event (hash, kind, size, deleted-at, reason, method) and then delete **only the artifact bytes**. The evidence row and every earlier event stay byte-for-byte unchanged. "Expired" is derived from the presence of a `tombstoned` event, and the effective retention date is the creation expiry plus any `retention_extended` events. A missing or altered tombstone breaks the hash chain and is detected by `doctor`.

**Export restrictions.** Reports embed only `public` evidence and redacted text. `restricted` evidence is never embedded; exporting it needs `--include-restricted` with a TTY confirmation and appends an `exported` evidence event. Report HTML makes no external requests. Nothing is sent to a model provider by default (§4.2).

## 12. Interfaces

**Core library** — TypeScript facade (`Sentinel`) exposing: `validateTarget`, `approveTargetPolicy`*, `plan`, `audit`, `listRuns`, `getRun`, `compareRuns`, `listFindings`, `getFinding`, `claimFix`, `verify`, `report`, `requestGrant`, and (Phase 7) `approveGrant`*, `revokeGrant`*. Methods marked * are **not** exported to adapters.

**CLI** (binary `qa-sentinel`; `sentinel` is not installed by default, G-11)
```
qa-sentinel init
qa-sentinel doctor                          # environment and guard self-checks
qa-sentinel target add|list|validate <id>
qa-sentinel target approve <id>             # human-only (TTY/dashboard): policy lock
qa-sentinel plan <target>                   # shows what would run; executes nothing
qa-sentinel audit <target> [--fail-on confirmed|suspected|never] [--trace] [--guard full|l1-only]
qa-sentinel runs list|show|compare <run> [<run>]
qa-sentinel findings list|show <id> [--status confirmed|suspected|informational]
qa-sentinel finding claim-fix <id> --actor <label> --build <id> [--commit <sha>]   # Phase 4
qa-sentinel finding set-status <id> accepted_risk|dismissed --reason "<text>"   # human-only
qa-sentinel verify <finding-id>             # Phase 4
qa-sentinel report <run> [--format json|md|html] [--include-restricted]         # restricted: human-only
qa-sentinel evidence show|purge ...         # --reveal and purge are human-only
qa-sentinel prune [--older-than <d>] [--apply]   # --apply is human-only; appends tombstone events
qa-sentinel dashboard [--port <n>]          # Phase 5
qa-sentinel grant request|list|approve|revoke   # Phase 7; approve/revoke human-only
qa-sentinel abort <run>
```
- Human-only commands require an interactive TTY and typed confirmation; non-interactive invocations are refused with exit code `3`. This blocks non-interactive agents; it does not prove human identity (§9).
- Every command supports `--json` (stable, versioned, no ANSI) and respects `NO_COLOR`.
- Exit codes: `0` ok / nothing at or above `--fail-on`; `1` findings at or above `--fail-on`; `2` usage or configuration error; `3` denied by policy; `4` runtime error, or a run that ended `partial`, `aborted` or `errored` (§4).
- The `--json` output is the **integration contract**, versioned by `schemaVersion`.
- `--trace` is off by default and is refused for targets with an auth profile in Release 0.1 (§11). `--guard l1-only` is the only way to run without L2; it produces a labelled preview (§7.9) and is never selected automatically.

**Local HTTP API** (Phase 5) — loopback only, per-session bearer token, `Host`/`Origin` validation, CSRF on writes. Read endpoints for all records; writes limited to starting audit-level runs, annotating findings, and human-confirmed approvals.

**MCP adapter** (Phase 6) — `list_targets`, `plan`, `audit` (audit mode only), `get_findings`, `get_finding`, `claim_fix`, `verify`, `report`, `request_grant` (Phase 7). It does **not** expose any approval, `approveTargetPolicy`, `--include-restricted` or `--reveal`. Target-derived strings are tagged `untrusted`.

**Claude Code integration** — Release 0.1 ships a **command kit**: plain command files (`/qa-sentinel:audit`, `:findings`, `:report`) that run the CLI with `--json`. No MCP or plugin runtime is required. Naming follows the plugin format of the day and is finalized in Phase 3. Other tools get equivalent kits or adapters over the same contract.

**Runner interface** — `Runner.run(spec, context, guard) → ExecutionRecord + Evidence[]`. Playwright is the first implementation.

**AI** — no model interface exists in the MVP. A later `ai-assist` package emits `Proposal` records only (§4.2).

## 13. Storage

- **Workspace** (default `<repo>/data/`, `QA_SENTINEL_HOME` override; gitignored). Never inside a target's repository.
- `sentinel.db` — SQLite (WAL): profiles (snapshots), approvals, specs, runs, execution records, findings, finding events, verification records, grants (later), grant requests (later), grant events (later), policy decisions, evidence index, evidence events (created, accessed, exported, retention extended, tombstoned).
- `artifacts/sha256/<ab>/<hash>` — content-addressed files (§11).
- **Append-only** tables (`execution_records`, `finding_events`, `verification_records`, `evidence`, `evidence_events`, `policy_decisions`, `grant_events`) enforced by SQL triggers that reject `UPDATE`/`DELETE`; `policy_decisions`, `grant_events` and `evidence_events` are additionally hash-chained. Retention pruning never deletes or edits rows: it appends a `tombstoned` evidence event and removes only the artifact **file** through a dedicated, logged path. (Triggers resist mistakes and casual edits; they do not stop a same-user process that replaces the database file.)
- `reports/<runId>/` — rendered exports (gitignored).
- `config/targets/*.yaml` — profiles validated against the `TargetProfile` schema; `*.example.yaml` tracked, real ones gitignored.
- Migrations are versioned and forward-only; every record carries `schemaVersion`.
- **Concurrency:** one run at a time per workspace in the MVP (lock file); readers are always allowed.

## 14. Security model

**Trust boundaries.** (1) Target content is **untrusted data**. (2) Clients, including AI agents, are **untrusted requesters**: they may ask, the Guardian decides. (3) Human approvals are the only source of authorization, recorded with an assurance level (§9).

| Threat | Mitigation (designed) |
|--------|----------------------|
| T1. Prompt injection from target pages | No AI in the engine; any future model emits proposals only; target text delimited and tagged untrusted; policy independent of any model (§4.2) |
| T2. Out-of-scope or unintended requests | Default deny; exact origin allowlist; L1 guard + L2 egress proxy; redirects and schemes restricted (§7) |
| T3. Accidental mutation | Safe-method rule in L1; no grant code before Phase 7; read-only POST only by approved, parsed allowlist (§7.5) |
| T4. Secret and PII leakage into artifacts | Evidence lifecycle (§11): minimization, redaction before hashing where reliable, exact-value scrubbing, `redactionStatus` labels, restricted class, encryption at rest (separate from redaction), retention, export limits. Traces are off by default, refused for authenticated runs in Release 0.1, and never described as redacted |
| T5. Dashboard or API exposure | Loopback bind, bearer token, `Host`/`Origin` checks, CSRF on writes, no wildcard CORS |
| T6. History tampering or silent overwrite | Append-only triggers, hash chains on decisions and grant events, content-addressed artifacts, `manifestHash` |
| T7. Supply chain | Lockfile, pinned versions, small dependency set; engine packages dependency-checked for AI SDKs; dashboard dependencies isolated in an optional package |
| T8. Agent forges or self-approves a grant or profile change | Human-only commands (TTY/dashboard), policy lock, grants bound to `policyHash`; **limited by §9: not resistant to a same-user process** |
| T9. Agent widens a profile by editing YAML | `policyHash` + `ProfileApproval` required before any run (§7.6) |
| T10. Local data theft | Restricted evidence encrypted at rest; `0700/0600` on POSIX; retention limits |
| T11. Overstated containment, state-safety or identity claims | Assurance vocabulary; labelled L1-only preview (§7.9); audit-only statement in every report (§5.1); identity basis and confidence shown with every verification result (§10) |

**Honest limits.** If a client can run arbitrary commands as the same OS user, it can read the signing key, edit the SQLite file, allocate a pseudo-terminal, or run Playwright itself. The mechanisms above address model error, prompt injection and misuse of QA Sentinel's own interfaces. For stronger isolation use L2 approvals and L3 OS isolation (post-MVP). No mechanism in this section is a *guarantee* until the register (§18) says so.

**Data handling.** Local-only by default; no telemetry designed in; no network calls except to in-scope targets (and, post-MVP, a model provider only if the profile opts in). Browser downloads at install time are an exception that `doctor` will report.

## 15. Technology choices and alternatives

| Area | Initial choice | Alternatives and trade-offs |
|------|----------------|------------------------------|
| Language / runtime | TypeScript (strict) on Node.js, `engines >=22` | Python + pytest-playwright (strong QA ecosystem, split-language dashboard); Go (single binary, weak browser tooling). |
| Browser automation | **Playwright library**, used directly | *Playwright Test runner* (built-in reporters/retries/traces, but its execution model makes our records, guard and "never claim passed" control harder); Cypress; Selenium/WebDriver; Puppeteer. |
| Egress proxy | Own small loopback proxy on Node stdlib (`node:http`/`node:net`) | Mature proxy library (more features, bigger supply chain); OS firewall only (L3). HTTPS inspection (MITM CA) rejected for the MVP: needs a trusted CA and enlarges risk. |
| Spec format | Declarative JSON/YAML steps + assertions; scripted escape hatch later | TS scripts (hard to classify/hash); Gherkin. |
| Validation | zod, JSON Schema export | TypeBox/Ajv. |
| Store | SQLite; driver by Phase 1 spike (`better-sqlite3` vs built-in `node:sqlite`) | Postgres; JSON files. |
| Encryption | Node built-in `crypto` (AES-256-GCM, scrypt) | libsodium (extra dependency); SQLCipher for the database. |
| Monorepo | npm workspaces | pnpm; Turborepo. |
| CLI | commander | `util.parseArgs`; yargs; citty. |
| API | Hono on `@hono/node-server` | Fastify; plain `node:http`. |
| Dashboard (Phase 5) | Decided at Phase 5 start by a dependency-count spike: React + Vite SPA (Radix primitives) **or** server-rendered HTML + HTMX | Next.js; SvelteKit. The early releases need neither: they ship CLI plus static HTML reports. |
| A11y checks | `@axe-core/playwright` | Lighthouse. |
| Self-tests | Vitest | node:test. |
| Logging | pino (JSON) | console + own formatter. |
| Reports | JSON canonical; Markdown; self-contained HTML | SARIF/JUnit later. |
| AI integration | None in the engine; optional `ai-assist` proposals post-MVP | Vendor SDKs inside core (rejected). |
| Distribution | **Private**: packages marked `private`, no registry publishing, license `UNLICENSED` (all rights reserved) until the owner decides (G-10) | MIT/Apache-2.0 open source; scoped private registry. |

## 16. Built-in check packs (no model required)

Deterministic checks (ceilings in §6.1): reachability and 4xx/5xx; uncaught exceptions, `console.error`, failed network requests; axe-core accessibility; mixed content, security headers, slow/oversized responses; read-only form structure; authored specs from `specs/<target>/`. Every pack declares its action class and passes through the Guardian and the guard.

## 17. Release plan (usable early)

| Release | Phases | Contents | Not included |
|---------|--------|----------|--------------|
| **0.1 Audit CLI** | 1–3 | Profiles + policy lock; audit mode in **`full` guard mode (L1+L2)** with AC-22, AC-38, AC-39, AC-46 and AC-49 required to pass (each currently unpassed); check packs; findings with confirmation policies; evidence lifecycle; JSON/Markdown/accessible HTML reports; run history and compare; `--json` contract and CI exit codes (CI needs a pre-approved workspace); Claude Code command kit; fixtures that validate it | Dashboard, MCP, verification, grants, any modifying action, authenticated traces |
| 0.1-preview (**only if L2 fails AC-39**) | 1–3 | The same functionality in `l1_only` mode, labelled "preview: guard coverage incomplete" | Everything excluded from 0.1, **plus any containment or outbound-traffic claim**; AC-38 shown as *not evaluated* |
| **0.2 Fix verification** | 4 | `claim-fix`, `verify`, identity bases with confidence | Dashboard, MCP, grants |
| **0.3 Dashboard** | 5 | Local dashboard and API | MCP, grants |
| **0.4 Integrations** | 6 | MCP adapter, other-tool adapters, CI polish | Grants |
| **1.0 Authorization** | 7 | Grants, A2/A3 under human approval; the engine stays AI-free | — |
| Post-1.0 | 8 | More target kinds, plugin interface, L2 approvals, L3 isolation guidance, optional `ai-assist`, possible authenticated-trace strategy | — |

**What an unqualified Release 0.1 requires.** L2 passes AC-39; AC-38 is passed with independent observation covering DNS (§7.9, §7.10); worker denial passes AC-46; DNS behavior passes AC-49; each containment claim is limited to traffic classes whose register entries are Tested; every other 0.1 acceptance criterion in `prd.md` §8 passes with a recorded run. The decision between 0.1 and 0.1-preview is made at the end of Phase 2 from the spike result and recorded as a decision.

**Blocking items for the unqualified Release 0.1.** AC-22 (page, frame and service-worker coverage), AC-46 (worker denial and worker-originated WebSockets), AC-38 (independent observation including DNS), AC-39 (egress proxy) and AC-49 (DNS pinned behavior) are each currently **unpassed**. If any of them cannot be passed, the unqualified Release 0.1 does not ship and no release material may imply the corresponding capability. A worker-WebSocket or DNS capability that cannot be made reliable is documented as unavailable rather than described as partly working.

**If L2 fails.** There is no unqualified Release 0.1. A **0.1-preview** may ship in `l1_only` mode only if every report, CLI summary and JSON result says so (AC-44), claims no containment or outbound restriction, and shows AC-38 as not evaluated. It may not be described as equivalent to full mode. Nothing here weakens the 0.1 criteria to make them easier to pass.

**0.1 is usable on its own.** A developer registers a target, approves its policy, runs an audit from a terminal or from Claude Code commands, and gets a report whose every claim links to (possibly tombstoned) evidence and which states the audit-only limitation, guard mode and coverage. Because grants ship only in 1.0, Releases 0.1–0.4 contain no code path that allows a non-safe request other than profile-approved read-only entries.

## 18. Guarantee Register

Assurance as of this revision. "Needed for Tested" lists the acceptance criteria in `prd.md` that must pass with a recorded run; "Independently verified" additionally needs a written independent review against a pinned commit. Containment-related claims apply to `full` guard mode only; `l1_only` makes none (§7.9).

| ID | Claim (may be made only when proven) | Assurance | Needed for Tested |
|----|--------------------------------------|-----------|-------------------|
| GR-01 | Audit mode blocks non-safe HTTP methods for browser requests the guard sees | Designed | AC-05 |
| GR-02 | Requests outside `allowedOrigins`, including redirects, are blocked (`full` mode) | Designed | AC-06, AC-39 |
| GR-03 | Non-HTTP(S) schemes are blocked and browser permissions are denied | Designed | AC-21 |
| GR-04 | WebSockets opened from a **page or frame** are denied by default (L1 close-without-connect). Worker-originated WebSockets are **not** covered by this entry (see GR-31) | Designed | AC-22 |
| GR-05 | Service workers cannot bypass routing | Designed | AC-22 |
| GR-06 | WebRTC, UDP and QUIC cannot reach the network (`full` mode) | Designed | AC-23, AC-38, AC-39 |
| GR-07 | Downloads are denied or quarantined, never executed | Designed | AC-24 |
| GR-08 | Only parsed read-only POST requests matching an approved rule pass | Designed | AC-25 |
| GR-09 | A run cannot start on a changed policy without human approval; a fresh CI workspace is refused | Designed | AC-26, AC-45 |
| GR-10 | Guard failure fails closed in `full` mode: the run ends `errored`, never silently downgrades; untested coverage is reported | Designed | AC-27, AC-47 |
| GR-11 | `passed` exists only for executed checks | Designed | AC-04 |
| GR-12 | AI cannot influence outcomes or run in the engine | Designed | AC-15, AC-28 |
| GR-13 | `confirmed` follows the check's confirmation policy and ceiling | Designed | AC-07, AC-08, AC-29 |
| GR-14 | `verified_fixed` requires a same-basis identity change and a passing frozen repro, and is reported with its basis and confidence | Designed | AC-12, AC-13, AC-30 |
| GR-15 | History tables resist update/delete; chains are tamper-evident; tombstones are append-only | Designed | AC-31, AC-43 |
| GR-16 | Resolved secret values (within the listed encodings) are absent from the database, logs, reports and artifacts labelled `redacted` (text artifacts). **Excludes `partially_redacted` artifacts (screenshots: masking covers configured selectors only and pixels may contain secrets) and `not_redacted` artifacts (traces, downloads); no secret-free claim is made about any of them** | Designed | AC-19, AC-32, AC-48 |
| GR-17 | `restricted` evidence is encrypted at rest. This is a storage claim and **not** a redaction claim | Designed | AC-33 |
| GR-18 | Retention, purge and tombstones behave as specified | Designed | AC-34, AC-43 |
| GR-19 | Restricted evidence is not exported without human confirmation | Designed | AC-35 |
| GR-20 | Dashboard/API reachable only locally with token and CSRF | Designed | AC-17, AC-36 |
| GR-21 | Grants are scoped, expiring, revocable and audited | Designed | AC-10, AC-11, AC-37 |
| GR-22 | Agents cannot approve grants or profile policy through adapters | Designed | AC-10, AC-16, AC-26 |
| GR-23 | A same-user process cannot forge approvals | **Not claimed** (L1 does not resist this) | — (needs L2) |
| GR-24 | Runs are reproducible from the manifest | Designed | AC-09 |
| GR-25 | No QA Sentinel process contacts anything except the in-scope target and loopback during an audit, and no DNS query leaves the machine, observed independently of the guard (`full` mode with `dnsMode: pinned` only; **not claimable in `l1_only` or with `dnsMode: system`**) | Designed | AC-38, AC-49 |
| GR-26 | Authenticated traces are not captured in Release 0.1; unauthenticated opt-in traces are labelled `not_redacted` | Designed | AC-40 |
| GR-27 | Reports state the audit-only limitation and never imply state immutability | Designed | AC-41 |
| GR-28 | Identity basis and confidence are reported accurately; `target_reported` is never described as attested | Designed | AC-30 |
| GR-29 | `l1_only` runs are labelled preview, make no containment claim, and show AC-38 as not evaluated | Designed | AC-44 |
| GR-30 | The self-contained HTML report meets the accessibility criteria | Designed | AC-42 |
| GR-31 | Worker-originated WebSockets cannot be opened because dedicated and shared workers are denied by two independent in-browser measures. **No L2 backstop exists** (L2 cannot block a WebSocket to an allowed origin in a TLS tunnel). Not claimable with `workers: allow` | Designed | AC-46 |
| GR-32 | A run ends in exactly one of `completed`, `partial`, `aborted`, `errored`; terminal statuses are immutable; a crashed or guard-failed run is never `completed` | Designed | AC-47 |

No entry is Implemented, Tested or Independently verified. Nothing in this register may be raised without recorded execution evidence.

## 19. Extensibility

New runner → implement `Runner`. New target kind (API contract, mobile, CLI) → new profile `kind` + runner. Stack-specific discovery hints → optional profile plugins that never relax policy. New AI tool → thin adapter over the CLI/JSON or MCP contract. AI assistance → `ai-assist` proposals only.

## 20. Feasibility notes and unproven items

- Playwright request interception, tracing, per-context isolation, screenshot masking, service-worker blocking and WebSocket close-without-connect are documented features. Their behavior against our guarantees is untested.
- **Unproven:** worker denial (constructor removal and CSP `worker-src`, including `blob:`/`data:`/nested/iframe workers) and therefore worker-originated WebSocket prevention; worker-originated requests when `workers: allow`; `sendBeacon` routing; WebRTC suppression; Chromium proxy flags (loopback bypass, WebRTC policy); the L2 proxy against HTTPS targets; CSP injection side effects; redaction completeness; confirmation behavior on flaky targets; fingerprint stability.
- `node:sqlite` loads on this machine's Node v24.21.0; its stability for our use is unassessed (Phase 1 spike). Registry versions seen on 2026-11-16: playwright 1.65.1, @axe-core/playwright 4.14.0, better-sqlite3 13.2.0, zod 4.6.7, hono 4.13.18, vitest 5.1.0; pinned in Phase 1, nothing installed now.
- Fresh browser contexts isolate client state only; server state is shared (§6.3).
- Audit-only authentication needs a pre-provisioned session; scale is single-machine, one run at a time.
- **Unproven or open from reviews 2 and 3:** keychain access through `security`/`secret-tool` subprocesses (availability on headless Linux/CI); the L2 proxy on HTTPS targets, loopback bypass and QUIC suppression (AC-39); how to observe all outbound traffic independently of the guard for AC-38 (tooling per OS is undecided, Q-25); whether encryption at rest (AC-33) is achievable without a native dependency; CI approval of profile policy (Q-16); any tested strategy for authenticated traces (Q-26).
- **Identity limits:** `target_reported` is not cryptographic proof, `operator_asserted` is a statement, and `surfaceFingerprint` cannot see backend-only changes; no independent attestation mechanism exists (`independently_attested` is reserved, Q-27).
- **Audit-only limits:** `GET` side effects, `Set-Cookie` sessions and approved read-only POST rules can change server state (§5.1); this is a known, reported limitation, not an open defect.
- **Revision 4 open items:** (1) no mechanism exists to remove secrets from screenshot pixels beyond selector masking, and none is claimed (Q-28); (2) worker-originated WebSockets have no L2 backstop and depend entirely on AC-46 passing (Q-29); (3) the DNS design (`pinned` versus `system`, browser-side resolution suppression, system-wide DNS observation per OS) is unproven and AC-38 and AC-49 are unpassed (Q-25, Q-30); (4) crash-recovery transition of `running` runs to `aborted` and immutability of terminal statuses are untested (AC-47).
