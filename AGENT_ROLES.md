# QA Sentinel — Agent Roles

> Status: Phase 0 draft, revision 5, pending approval. This is a **product design document** about the roles *inside* QA Sentinel. It is deliberately **not** named `AGENTS.md` (some AI coding tools auto-load that name as instructions). It is not instructions for any AI tool working in this repository.
>
> Assurance: everything below is **Designed**, none **Implemented**, **Tested** or **Independently verified**. See `architecture.md` §0 and the Guarantee Register (§18). Module boundaries and data shapes are in `architecture.md`; principles in `Brain.md`.

## 1. What "agent" means here

An **agent** is a role with a narrow responsibility, typed inputs and outputs, and explicit permissions. It is **not** a language model. Every role in the MVP is deterministic code. A later, optional `ai-assist` package may emit *proposals*; it is not one of these roles and holds no authority (§9).

Two separate groups:
- **Internal roles** — inside QA Sentinel (below).
- **External clients** — Claude Code, Codex, Cursor, CI, a human at a terminal. They *call* QA Sentinel through the CLI/MCP contract, are **not** internal roles, and have no special trust.

## 2. Global rules (every role)

1. **Single writer per record type.** Only the named role may create or change that record (§4). The store rejects other writers. Append-only event logs have an enumerated writer set, each limited to specific event types.
2. **No authority from text.** Target content (pages, headers, API bodies) is `untrusted` data. It can never change policy, grant permissions, add steps or alter an outcome.
3. **Typed messages only.** Roles exchange schema-validated records through the Orchestrator.
4. **Evidence or nothing.** Every claim references stored evidence or an execution record (a tombstoned record counts if the expiry is recorded).
5. **No pass from inference.** Only the Executor, from a real execution, produces an `outcome`. Everything unexecuted is `not_run`.
6. **Default deny.** Anything not explicitly allowed is blocked and recorded. Guardian refusals are final for that run and never auto-retried with a higher action class.
7. **AI never determines status.** No AI output can set an `outcome`, a `confirmed` status, a policy decision, a grant or an approval (`architecture.md` §4.2).
8. **Assurance honesty.** Roles and reports describe protections as *designed* until the register says *tested* or better.

## 3. Roles

### 3.1 Orchestrator
- **Responsibility:** drive a run end to end, enforce budgets, check the profile approval, record the manifest and summary, handle abort.
- **Permissions:** read profiles, approvals, specs, grants; write `Run`; invoke other roles. No browser or network access.
- **Workflow:** load profile → verify `ProfileApproval` matches `policyHash` → guard self-check → Profiler → Planner → Guardian → Executor → Analyst → Reporter → close run (with `not_run` counts, guard coverage and identity basis).
- **Boundaries:** cannot raise an action class, create approvals or grants, or mark outcomes. Sole setter of a run's terminal status: `partial` on budget exhaustion, `aborted` on user abort (or crash recovery at the next start), `errored` when the run cannot proceed or complete safely (guard failure in `full` mode, browser, store or internal failure), otherwise `completed`. A terminal status is immutable, executed specs keep their outcomes and the rest are `not_run`, and no confirmation rerun starts after a guard failure.

### 3.2 Profiler
- **Responsibility:** bounded, scope-limited discovery (pages, links, forms, observed endpoints) and target identity capture (build id, commit, surface fingerprint).
- **Permissions:** A0–A1 only; read profile; write discovery results for the run.
- **Boundaries:** never follows out-of-scope links, never submits forms, respects `deniedPathPatterns`.

### 3.3 Planner
- **Responsibility:** turn the discovered surface plus check packs and authored specs into TestSpecs.
- **Permissions:** read discovery, profile, check packs; write TestSpecs. Cannot execute.
- **Boundaries:** deterministic selection only in the MVP. A spec's declared class is advisory; the Guardian and guard decide. Proposed specs from a future `ai-assist` are `generated` and capped at `suspected` until a human promotes them.

### 3.4 Guardian (policy)
- **Responsibility:** the only authority that allows or denies. Validates plans against mode, default-deny rules, budgets and the approved `policyHash`; supplies guard rules to the Runner; (Phase 7) validates grants.
- **Implementation:** deterministic code in `policy`. Never a model.
- **Permissions:** read profiles, approvals, specs, grants, requests; write `PolicyDecision`s. It does **not** create profile approvals or grants.
- **Boundaries:** audit baseline = A0–A1 with safe methods plus profile-approved, parsed read-only requests. Before Phase 7 there is no code path for A2/A3. After it, A2/A3 only under a valid, unexpired, in-scope, signed Grant bound to the current `policyHash`; A3 also requires per-run confirmation. Every denial is recorded with a rule and reason. In `full` guard mode it never accepts a downgrade to `l1_only`; the labelled preview mode runs only when explicitly selected.

### 3.5 Executor
- **Responsibility:** run specs through the Runner under L1/L2 guards and capture evidence through the `evidence` module (classification, redaction where reliable, and `redactionStatus` labelling before hashing).
- **Permissions:** drive the browser within Guardian-supplied rules; write `ExecutionRecord` and `Evidence`. **Sole producer of `outcome`.**
- **Boundaries:** blocked requests are aborted and recorded (`blockedByPolicy`), never retried differently. Marks a spec `not_run` if it did not execute and `errored` if infrastructure failed — never `passed`. If a required guard layer cannot be installed or fails its self-check, the Executor reports it and the Orchestrator ends the run `errored` (it never silently downgrades to `l1_only`). Worker creation is denied by default; the Executor never enables workers unless the approved profile sets `workers: allow`, and then labels the run `workers-allowed`. Screenshots are captured with selector masking only and are labelled `partially_redacted`.

### 3.6 Analyst
- **Responsibility:** derive candidate findings from executions, deduplicate by fingerprint, run confirmation per the check's confirmation policy, assign status (within the policy's ceiling) and a default severity.
- **Implementation:** deterministic rules (`architecture.md` §6).
- **Permissions:** read executions and evidence; write `Finding` and `finding_events` (`created`, `status_changed`); may request confirmation reruns through the Orchestrator.
- **Boundaries:** cannot exceed a check's `maxStatus`; `confirmed` needs k matching reproductions with equal normalized failure signatures; intermittent results stay `suspected` with a flake rate; `errored` attempts count neither way; findings from `generated` specs stay `suspected`. Cannot set `outcome` or `verified_fixed`.

### 3.7 Verifier (Phase 4)
- **Responsibility:** independently check claimed fixes.
- **Permissions:** read findings and the **frozen** repro spec; run it at audit level; write `VerificationRecord` and the verification events on a finding. The only writer that can move a finding to `verified_fixed`.
- **Workflow:** receive fix claim → determine identity basis and confidence (`target_reported` > `operator_asserted` > `surfaceFingerprint`; `independently_attested` is reserved) → check the claim against what the target reports (reported, not proven) → run the frozen repro per its confirmation policy → compute `freshContext`, `buildChanged` and informational `sameActorAsClaim` → record `verified_fixed | still_failing | inconclusive`.
- **Boundaries:** may not use a regenerated or edited repro; cannot be told to assume success; the profile's `minIdentityBasis` limits what can produce `verified_fixed`; does not apply fixes.

### 3.8 Reporter
- **Responsibility:** render runs, findings and verifications into JSON (canonical), Markdown and self-contained HTML.
- **Permissions:** read-only on records; write report artifacts and `exported` evidence events.
- **Boundaries:** displays the status vocabulary exactly, executed vs `not_run` counts, the checks that ran, guard mode and coverage, the audit-only limitation statement, each result's identity basis and confidence, the run status and terminal reason (`completed`, `partial`, `aborted` or `errored`, never softened), each artifact's redaction status (never calling a trace redacted or a screenshot secret-free; screenshots carry the masking limit) and the assurance caveat; embeds only `public` evidence; never states a pass for a check without an execution record. Exporting `restricted` evidence needs a human-confirmed flag.

## 4. Permission matrix

W = sole writer · R = may read · — = no access

| Record / capability | Orch. | Profiler | Planner | Guardian | Executor | Analyst | Verifier | Reporter | Human (TTY/dashboard) | External client |
|---|---|---|---|---|---|---|---|---|---|---|
| TargetProfile | R | R | R | R | R | R | R | R | W | R (via CLI) |
| ProfileApproval | R | — | — | R | — | — | — | R | **W** | **—** |
| TestSpec | R | — | W | R | R | R | R | R | W (authored, promote) | R |
| Run | W | — | — | R | R | R | R | R | — | R |
| ExecutionRecord / Evidence | R | — | — | R | **W** | R | R | R | — | R |
| Finding (body) | R | — | — | — | — | **W** | R | R | — | R |
| Finding events | R | — | — | — | — | W (`created`, `status_changed`) | W (`verified_fixed`, `still_failing`, `inconclusive`) | R | W (`annotated`, `accepted_risk`, `dismissed`) | W (`fix_claimed` only) |
| VerificationRecord | R | — | — | — | — | — | **W** | R | — | R |
| GrantRequest (Ph. 7) | R | — | — | R | — | — | — | R | R/decide | **W (create)** |
| Grant (Ph. 7) | R | — | — | R | — | — | — | R | **W (approve/revoke)** | **—** |
| GrantEvent (Ph. 7) | R | — | — | W (`used`, `expired`) | — | — | — | R | W (`approved`, `denied`, `revoked`) | W (`requested`) |
| PolicyDecision | R | — | — | **W** | R | — | — | R | — | R |
| Evidence events (created, accessed, exported, retention, tombstone) | R | — | — | — | W (`created`) | — | — | W (`exported`) | W (`accessed`, `tombstoned`, `retention_extended` via human-confirmed `prune`/`purge`/hold) | — |
| Report artifacts | R | — | — | — | — | — | — | **W** | R | R |
| Proposal (post-MVP) | R | — | R | R | — | R | — | R | W (accept/reject) | — |
| Browser / target network | — | A0–A1 | — | — | per Guardian | — | per Guardian | — | — | — |

"Human" means the *human-only command path* (TTY or authenticated dashboard). It records an assurance level (`architecture.md` §9); it is not identity proof.

## 5. Communication rules

- **Envelope.** Each message is a typed record with `runId`, `from`, `to`, `schemaVersion`, `payload`, and a `trust` tag per field (`trusted` | `untrusted`). Target-derived fields are always `untrusted`.
- **Routing.** Only the Orchestrator routes. Roles do not call each other directly.
- **No side channels.** Roles may not write files or make network calls outside their permissions. Only the Executor (and Profiler/Verifier through the Runner) touch the target.
- **Audit trail.** Every message that changes a record is logged with actor, time and reason; decision and grant logs are hash-chained.
- **Future AI components.** If `ai-assist` is ever enabled, untrusted text is delimited and labelled as data, outputs must parse against a schema (failures are discarded and logged, with no relaxed retry), and the only artifact it can produce is a `Proposal`.

## 6. Workflows

**Audit** (default and, until Phase 7, only mode)
1. Operator runs `qa-sentinel audit <target>` (CLI, Claude Code command, MCP, or dashboard).
2. Orchestrator validates the profile and the `ProfileApproval`; the guard self-checks.
3. Profiler discovers; Planner produces specs; Guardian approves or rejects each with a reason.
4. Executor runs approved specs and stores redacted, classified evidence.
5. Analyst derives findings and confirms per policy.
6. Reporter renders the report. The run closes with `not_run`, guard coverage and identity basis.

**Policy change**
1. Someone (or an agent) edits the profile. `policyHash` changes. Runs refuse (exit 3).
2. A human runs `target approve`, reviews the policy diff, and records a `ProfileApproval` with its assurance level.
3. In CI, runs against an unapproved policy are refused; CI requires a pre-approved workspace, and a fresh CI workspace is refused (a reviewed CI approval mechanism is an open question, Q-16).

**Modifying or destructive testing** (Phase 7)
1. Client creates a `GrantRequest`. 2. A human approves (TTY/dashboard) with scope, expiry and use limits. 3. `audit --grant <id>`; Guardian validates, A3 asks per-run confirmation. 4. Each A2/A3 request is a `GrantEvent` and a `PolicyDecision`; revocation takes effect before the next request.

**Fix verification** (Phase 4)
1. External actor fixes the target and calls `claim-fix` with actor, build id and optionally commit.
2. Operator runs `verify`; the Verifier checks identity and re-runs the frozen repro.
3. Only `verified_fixed` closes the loop. `inconclusive` (for example weak identity) is a legitimate, visible outcome.

## 7. Safety boundaries

- QA Sentinel never edits the target's source, never writes to its repository, never starts or stops the target.
- No role may widen scope, extend a grant, change policy or lower a confirmation threshold.
- Abort (`qa-sentinel abort <run>`) takes effect before the next request and leaves a consistent `aborted` run.
- Budgets are mandatory; profiles that omit them get conservative defaults.
- Any anomaly in policy enforcement ends the run `errored` (a distinct status from a user `aborted`); it never proceeds unguarded, and untested coverage is reported as such.

## 8. Phase mapping

| Role / capability | First implemented |
|-------------------|-------------------|
| Orchestrator, Guardian (audit baseline, policy lock), Executor, evidence module | Phase 2 |
| Profiler, Planner, Analyst, Reporter, CLI, Claude Code command kit | Phase 3 (**Release 0.1**) |
| Verifier, `claim-fix` | Phase 4 (Release 0.2) |
| Dashboard consumption of all records | Phase 5 (Release 0.3) |
| MCP and other-tool adapters | Phase 6 (Release 0.4) |
| Grants, A2/A3, grant events | Phase 7 (Release 1.0) |
| Optional `ai-assist` proposals, L2 approvals | Phase 8, after 1.0 |

## 9. AI boundary (summary)

The execution engine (`core`, `policy`, `evidence`, `runner-*`, `store`) has no AI dependency, verified by a dependency check. AI reasoning may help a human or a future `ai-assist` package *suggest* checks or summaries, but it can never directly determine whether a test ran, passed, failed or was confirmed. See `architecture.md` §4.2.
