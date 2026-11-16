# QA Sentinel — Brain

> Status: Phase 0 draft, revision 8, pending approval. Source of truth for *why* QA Sentinel exists and what it will never become. Other documents implement this one; if they conflict, this file wins and the conflict is a bug.

## 1. Vision

QA Sentinel is an independent, evidence-first quality auditor for software. It examines an application from the outside, the way a skeptical user or a security-minded tester would, and reports what it can **prove**, what it only **suspects**, and what it **did not check**.

It exists because the people and tools that build software are poorly placed to judge it. An AI coding assistant that writes a feature and then declares "all tests pass" is grading its own homework. QA Sentinel is the second pair of eyes: it does not care who or what built the target, and it has no stake in the answer.

## 2. Core principles

1. **Independence.** QA Sentinel is not coupled to the AI, IDE, framework, language or team that produced the target. Claude Code is the *first* integration, never a dependency of the core.
2. **Evidence or silence.** Every finding carries reproducible evidence (steps, artifacts, run manifest). No evidence, no finding.
3. **Honest vocabulary.** A *confirmed defect* (reproduced under its check's confirmation policy, with evidence) is never conflated with a *suspected risk* or an *informational* note. The UI, reports and APIs keep these visibly distinct.
4. **Never claim what was not executed.** "Passed" is a status that only an execution record can set. Anything not run is `not_run`.
5. **Audit-only and default-deny.** Out of the box QA Sentinel takes **no intentional, known state-changing actions**: it observes and performs only non-mutating interaction, and everything not explicitly allowed is blocked and recorded. This is **not** a promise that the target's server state cannot change (`GET` side effects, session cookies and approved read-only POST rules can still change it), and reports say so. Anything that modifies or destroys state requires an explicit, scoped, expiring, human-granted authorization — and that capability does not exist in the code until the release that introduces it.
6. **Reproducibility.** Each run records enough (tool version, target profile and policy, test specs, browser version, seeds, environment) to be re-run and compared. History is append-only.
7. **Independent fix verification.** A claimed fix is verified by a separate run against the original frozen reproduction, on a target identity that changed, with the basis of that identity (target-reported, operator-asserted or fallback fingerprint, each with its confidence) stated and weak bases never presented as strong — never by the actor who made the fix, and never by assumption.
8. **Technology neutrality.** Targets are described by profiles, not hard-coded. Black-box testing through browsers and HTTP is the common denominator; stack-specific knowledge is an optional plugin.
9. **Privacy first.** Data stays on the user's machine by default. Evidence is minimized, classified, redacted where redaction is reliable (and labelled where it is not), encrypted at rest when sensitive, retained for a bounded time and not exported by default. Redaction and encryption are different protections and are never conflated; traces are off by default and never described as redacted; screenshots only have configured elements masked and are never claimed secret-free. QA Sentinel never writes into a target's repository.
10. **AI never determines status.** Execution, policy and status assignment are deterministic code with no AI dependency. AI, if ever added, may only propose; it can never set a test outcome, a confirmation, a policy decision, a grant or an approval.
11. **Boring and inspectable.** Prefer plain files, SQLite, JSON schemas and a CLI that a human can read and a script can drive.
12. **Assurance honesty.** Every protective claim carries an assurance level: **Designed** (documented only), **Implemented** (code exists), **Tested** (automated tests, including adversarial fixtures, pass against a recorded commit), **Independently verified** (reviewed or attacked by an independent party against a pinned commit). QA Sentinel says "guarantee" only at Tested or above, and says plainly what a mechanism does *not* resist.
13. **Useful early.** The first release is a usable audit-only CLI with reports. Dashboard, adapters and modifying tests come later and are never prerequisites for value.

## 3. Goals

- G1. Audit a web application (UI and its HTTP APIs) with no knowledge of its implementation and produce evidence-backed findings.
- G2. Support many projects and stacks side by side through target profiles.
- G3. Provide IDE-driven commands and a separate QA dashboard over the same engine.
- G4. Keep a reproducible history of runs, findings and verifications.
- G5. Verify fixes independently and record the outcome with its identity basis.
- G6. Be integrable from any AI coding tool or CI via a stable CLI/JSON contract and an MCP adapter.
- G7. Validate itself against synthetic demo applications with seeded, known defects.
- G8. Ship a usable audit-only release (Release 0.1) before the dashboard and advanced integrations.
- G9. Report assurance honestly: what is designed, implemented, tested and independently verified.

## 4. Non-goals

- NG1. Not a code generator or auto-fixer. It reports; others fix.
- NG2. Not a replacement for unit tests or a developer's own test suite.
- NG3. Not a vulnerability scanner for hostile use, and never to be pointed at systems the user does not own or lack permission to test. Scope allowlists are mandatory.
- NG4. Not a load or performance benchmarking platform.
- NG5. Not a hosted multi-tenant SaaS. Distribution is **private** (packages marked private, license `UNLICENSED`) until the owner decides otherwise.
- NG6. Not tied to any specific target project. No real application is connected during Phase 0 or while QA Sentinel itself is being built.
- NG7. No proof of absence of bugs. A clean run means "nothing found by these checks", and reports say exactly which checks ran and which protections were active.
- NG8. Not a proof of human identity. Human approvals record how they were given, and are not identity verification.
- NG9. Not a guarantee that a target's server-side state is unchanged by an audit, and not proof of containment unless the full guard mode has passed its tests.

## 5. Long-term direction

Proposed phases and releases (to be approved; Phase 0 approval does not approve later phases):

| Phase | Theme | Release |
|-------|-------|---------|
| 0 | Foundation documents | — |
| 1 | Skeleton, schemas, store, fixtures with seeded defects | — |
| 2 | Runner, default-deny guard, evidence pipeline | — |
| 3 | Findings, confirmation policies, reports, CLI, Claude Code command kit | **0.1 Audit CLI** (first usable) |
| 4 | Independent fix verification | 0.2 |
| 5 | Local dashboard | 0.3 |
| 6 | MCP and other-tool adapters, CI polish | 0.4 |
| 7 | Authorization: grants and modifying/destructive tests | **1.0** (MVP complete) |
| 8 | Breadth and hardening: more target kinds, plugin interface, stronger approvals, OS-level isolation, optional AI proposals | post-1.0 |

Authorization is deliberately last: the riskiest capability ships when the guard, evidence and verification layers already exist and have been tested. Before 1.0 there is no code path that allows a non-safe request other than profile-approved, parsed read-only entries. Details: `architecture.md` §17.

Release 0.1 needs the **full guard mode** (in-browser guard plus egress proxy) to pass its acceptance tests, including worker denial (AC-46) and DNS-free egress observed independently (AC-38, AC-49); each is currently unpassed. **Release 0.1 is blocked if any of AC-22, AC-38, AC-39, AC-46 or AC-49 remains unpassed.** A clearly labelled **0.1-preview** (L1 only, incomplete guard coverage, no containment claim) is permitted only when the blocker is the egress or DNS layer (AC-38, AC-39 or AC-49) **and** AC-22, AC-46 and every other preview criterion have passed **and** the owner approves; if AC-22 or AC-46 is unpassed, neither a 0.1 nor a preview ships (`architecture.md` §7.9, §17).

Later horizons, not committed: additional runners (API contract, accessibility, visual regression), other AI-tool adapters, CI gating, comparison across builds, team sharing of reports.

## 6. Success looks like

A developer using any AI tool points QA Sentinel at an app they own, gets a report where every claim links to evidence, can tell at a glance what is confirmed versus suspected versus unchecked and which protections were active, and can re-run the same audit later and trust the diff.

## 7. Glossary (shared vocabulary)

- **Target profile** — declarative description of one application under test, including its network policy.
- **Policy lock** — human approval (`ProfileApproval`) of a profile's policy section; runs refuse to start if the policy changed since approval.
- **Test spec** — stack-neutral, declarative description of one check.
- **Run** — one execution of a plan against a target at a recorded identity.
- **Execution record** — what the runner actually did and observed for one spec attempt.
- **Finding** — a claim about the target with a status (`confirmed`, `suspected`, `informational`) and evidence.
- **Confirmation policy** — per-check rules (ceiling, k, failure-signature matching, isolation) deciding how far a finding may be promoted.
- **Evidence** — hash-addressed artifacts (screenshot, trace, HAR-like data, console log, response body) tied to an execution record, classified `public` or `restricted`, and labelled with a `redactionStatus`.
- **Redaction status** — `redacted`, `partially_redacted` or `not_redacted`; independent of encryption. Text artifacts are `redacted`; screenshots are `partially_redacted` (selector masking only, no secret-free claim); traces and downloads are `not_redacted`.
- **Audit-only** — no intentional, known state-changing actions; not a guarantee that server state is unchanged.
- **Guard mode** — `full` (in-browser guard plus egress proxy) or `l1_only` (labelled preview, incomplete coverage).
- **Guard coverage** — which traffic classes (WebSocket, WebRTC, service workers, downloads, proxy) were actively guarded and verified in a run.
- **Run status** — `running`, then exactly one terminal status: `completed`, `partial` (budget), `aborted` (user abort or crash found later) or `errored` (could not proceed or complete safely); terminal statuses are immutable.
- **Worker denial** — dedicated and shared workers are denied by default so worker-originated WebSockets cannot exist; the egress proxy cannot block a WebSocket to an allowed origin.
- **DNS mode** — `pinned` (the proxy connects to pinned IPs and resolves nothing) or `system` (the OS resolver is used; DNS may leave the machine and is not covered by any containment claim).
- **Grant** — explicit, scoped, expiring, use-limited human authorization above audit level (Release 1.0).
- **Identity basis** — how a target's build identity was established, with a stated confidence: `target_reported` (reported by the target; not cryptographic proof), `operator_asserted` (a statement), or `surfaceFingerprint` (fallback only); `independently_attested` is reserved for a future verifiable mechanism.
- **Verification record** — outcome of an independent re-run of a finding's frozen reproduction.
- **Assurance level** — Designed, Implemented, Tested, Independently verified (principle 12).

Authoritative definitions of data shapes live in `architecture.md`.
