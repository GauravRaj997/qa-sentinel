# QA Sentinel — Phase 0 Review Bundle (revision 3)

This bundle is a **read-only copy** prepared for independent review. It is not one of the six Phase 0 deliverables and it changes none of them. The files in this folder remain authoritative; every embedded copy below carries a SHA-256 so it can be checked with `shasum -a 256 <file>`. This file replaces the revision 2 bundle.

## Status statement (read first)

- Phase 0 is **not approved**. Phase 1 has **not started**. No code, dependencies, git repository or target connection exists.
- **No guarantee is Implemented, Tested or Independently verified.** There is no code to implement or test, and no independent review of an implementation has taken place. Every protective mechanism in these documents is **Designed** only (documented intent). The only entry that is explicitly "not claimed" is GR-23.
- Revision 3 corrects wording, definitions and release criteria. It does not add evidence. Nothing was marked higher than Designed, and no limitation was removed to make a release criterion easier to pass.

## Contents

1. Verification of this bundle (file hashes) and change statistics
2. Revision 3 before/after change summary
3. Open questions register and proposed defaults (complete)
4. Guarantee Register (complete, each status preserved)
5. Gap resolution G-01 to G-16 and review-3 findings
6. Decision register (complete)
7. Risk register (complete)
8. Fresh cross-document review output
9. Known limitations and untested assumptions
10. Complete documents: Brain.md, prd.md, design_system.md, architecture.md, AGENT_ROLES.md, PHASE_0_CHECKLIST.md, README.md

---

## 1. Verification of this bundle

File hashes at generation time:

```
4176cfedc82e9aef658349a4251dcd7ed351640ad6442e86be4737b65902f001  Brain.md               96 lines
ae3581219d969f7ae9be3d2e8cb1d7b0ba88d475acda46d1a945d7ca467ee068  prd.md                 234 lines
ba60f54a8d946b19b4210cc43523de7a62e4a7c8ad1aa881f2fb09a4acda1712  design_system.md       179 lines
ee8fea3c4c24163c8087b4a8cf45191b984c56e75d528a2910cf679013f3e0d3  architecture.md        610 lines
19dae9d5e93c31b3fbda519572b8fd92362cc14c20cd41947f87552b413af286  AGENT_ROLES.md         150 lines
e28bffc18915e98fc362e83515c49ecf4b641ed2d0558b33a8a2c38e0a9691bd  PHASE_0_CHECKLIST.md   298 lines
3a3ac171a709dc5a46ac39d7bd702468a8e64d5ef2f7bbb7ea2dcb5bafea39e9  README.md              24 lines
```

Change statistics, revision 2 to revision 3 (lines, from a unified diff of the files):

| File | Rev 2 lines | Rev 3 lines | Added / removed |
|------|-------------|-------------|-----------------|
| Brain.md | 90 | 96 | +11 / -4 |
| prd.md | 224 | 234 | +43 / -5 |
| design_system.md | 174 | 179 | +14 / -4 |
| architecture.md | 528 | 610 | +132 / -54 |
| AGENT_ROLES.md | 149 | 150 | +9 / -2 |
| PHASE_0_CHECKLIST.md | 200 | 298 | +197 / -86 |
| README.md | 24 | 24 | +1 / -1 |

The complete unified diff is saved outside the project at `/private/tmp/claude-501/-Users-roop-Desktop-myProjects/1dfb48a0-cd59-4868-b259-c02ead363404/scratchpad/PHASE_0_REVISION3.diff` (it is not part of the project).

---

## 2. Revision 3 before/after change summary (verbatim from PHASE_0_CHECKLIST.md §2)


| Review finding | Before (revision 2) | After (revision 3) |
|----------------|---------------------|--------------------|
| **1. L1/L2 vs Release 0.1** | Release 0.1 could ship L1-only with a reported gap; AC-27/38 and Q-23 left this ambiguous, and AC-38 ("only the target is contacted") could pass on guard logs | Unqualified **Release 0.1 requires L2 to pass AC-39 and AC-38**. If L2 fails, only a labelled **0.1-preview** (`l1_only`) may exist: no containment claim, "guard coverage incomplete", AC-38 shown as *not evaluated*. New §7.9 lists exactly which traffic classes are guarded and tested in each mode. AC-38 needs OS-level observation independent of the guard. New AC-39, AC-44. Q-23 resolved by D-36 |
| **2. Evidence and traces** | Traces "off for authenticated runs unless enabled" while FR-061/AC-32 implied secrets removed; "restricted" and "encrypted" blurred with "redacted" | **Traces are off by default for every run; authenticated traces are refused in Release 0.1.** New `redactionStatus` (`redacted` / `partially_redacted` / `not_redacted`, traces always `not_redacted`). Encryption at rest is explicitly **not** redaction. AC-19/32 apply only to artifacts labelled redacted/partially_redacted and say so; AC-33 is a storage claim only; new AC-40 |
| **3. Audit-only definition** | "No mutations", "server state the same" | Audit-only = **no intentional, known state-changing actions**, explicitly not state immutability. New architecture §5.1 explains GET side effects, `Set-Cookie`, approved read-only POST side effects, background work; every report carries the statement (FR-024, AC-41); Brain principle 5, FR-010, §6.3, §7.8 reconciled |
| **4. Build identity terms** | `target_attested` / "strong" | Renamed **`target_reported`** (moderate; *not* cryptographic proof); `operator_asserted` low; `surfaceFingerprint` low, fallback only; `independently_attested` reserved. Every result shows basis and confidence; default `minIdentityBasis` = `target_reported` and is part of the approved policy; FR-052–055, AC-12/30 updated; Q-20 updated |
| **5a. design_system CLI name** | `sentinel` | `qa-sentinel` |
| **5b. HTML report accessibility** | Only the dashboard had an a11y criterion (AC-17, Release 0.3) | **AC-42** for the self-contained HTML report in Release 0.1; GR-30 |
| **5c. CI approval** | "Unresolved (Q-16)" | **CI requires a pre-approved workspace**; fresh CI workspace is refused (AC-45); mechanism remains open (Q-16) |
| **5d. Tombstones** | Evidence record had a mutable `tombstone?` field | Evidence rows are immutable; history is an append-only, hash-chained **evidence event** log (`created`, `accessed`, `exported`, `retention_extended`, `tombstoned`); deletion removes only artifact bytes; AC-43 |
| **6. Registers and review** | 25 register entries; 21 risks | **30** register entries (29 Designed, 1 not claimed); decisions D-36 to D-43 added; risks R-22 to R-25 added; 45 acceptance criteria; fresh cross-review below |

---

## 3. Open questions register and proposed defaults (complete; verbatim from PHASE_0_CHECKLIST.md §8)


| ID | Question | Default if unanswered | Needed by | Status |
|----|----------|-----------------------|-----------|--------|
| Q-01 | Initialize git in Phase 1? Confirm license `UNLICENSED` (private) | Git in Phase 1; `UNLICENSED` | Phase 1 | ❓ confirm default |
| Q-02 | Windows support level | Best-effort, restricted capture disabled without app-level encryption | Phase 1 | ❓ confirm default |
| Q-03 | Node policy | `engines >=22` | Phase 1 | ❓ confirm default |
| Q-04 | Allow a login `POST` in audit mode? | No; pre-provisioned session | Phase 2 | ❓ |
| Q-05 | Fingerprint sufficiency | **Resolved**: fallback only, low confidence (D-40) | — | ✅ |
| Q-06 | Confirmation `k` | **Resolved**: per-check, default 2 (D-26) | — | ✅ |
| Q-07 | Severity policy (rule defaults + audited human override vs human-only) | Rule defaults + override | Phase 3 | ❓ |
| Q-08 | MVP detection bar (90% of detectable; plus held-out set) | 90% + held-out | Phase 1 | ❓ |
| Q-09 | Registry naming | **Mostly resolved**: private, unpublished (D-32) | — | ✅ |
| Q-10 | CLI binary name | **Resolved by default**: `qa-sentinel` (D-33) | — | ❓ confirm |
| Q-11 | Fixtures (two stacks; behaviors include WebSocket from page and worker, WebRTC, QUIC, download, GraphQL, service worker, redirect, off-scope canary server, injection, version/identity switch, flaky behavior, state-changing GET, instrumented mutation counters) | Node demo-shop + second app on another stack | Phase 1 | ❓ |
| Q-12 | Claude Code kit naming | `/qa-sentinel:*` | Phase 3 | ❓ |
| Q-13 | Retention defaults (90/30/7 days; 180-day cap) | As written | Phase 2 | ❓ confirm |
| Q-14 | First CI system for examples | Generic exit-code docs | Phase 3 | ❓ |
| Q-15 | High-contrast theme | Honor `prefers-contrast` only | Phase 5 | ❓ |
| Q-16 | Reviewed CI approval mechanism (for example a committed approval file pinning `policyHash` at a lower, labelled assurance level) | **Interim: CI requires a pre-approved workspace; fresh workspace refused (D-42)** | Phase 3 | ❓ mechanism open |
| Q-17 | Default-deny WebSocket acceptable, or should `observe` be default? | Deny | Phase 2 | ❓ |
| Q-18 | Evidence key storage: OS keychain via CLI tools vs passphrase; headless Linux/CI behavior | Keychain tool, else passphrase | Phase 2 | ❓ |
| Q-19 | Preferred L2 approval method (passkey, OS prompt, separate OS user) | Decide before Phase 7 design | Phase 7 | ❓ |
| Q-20 | Default `minIdentityBasis` | **`target_reported`** (revised from `operator_asserted`); lowering it is an approved profile choice | Phase 4 | ❓ confirm |
| Q-21 | Who may attest read-only POST rules; is `custom-allowlist` needed in 0.1? | Profile owner; GraphQL only in 0.1 | Phase 3 | ❓ |
| Q-22 | Confirm the reordered release train (authorization last, Release 1.0) | As written | Phase 0 approval | ❓ |
| Q-23 | Is L2 mandatory for Release 0.1? | **Resolved by D-36**: mandatory for the unqualified 0.1; an L1-only run is only a labelled preview | — | ✅ (confirm via D-36) |
| Q-24 | If L2 fails AC-39 at the end of Phase 2, should a labelled 0.1-preview be released at all, or should 0.1 be held? | Owner decides at that point; no preview without approval | Phase 2 | ❓ **new** |
| Q-25 | How is AC-38's independent outbound observation done on each OS (socket/packet capture covering TCP, UDP, QUIC, DNS for all run processes)? Is it practical without privileged tools? | Decide in the Phase 2 spike; if impractical, AC-38 stays unpassed and 0.1 is not unqualified | Phase 2 | ❓ **new** |
| Q-26 | Is there any acceptable tested strategy for authenticated traces (strip payloads, screenshots-only), or should they never exist? | None; authenticated traces stay unavailable | post-1.0 | ❓ **new** |
| Q-27 | Should an `independently_attested` mechanism (verifiable signed build attestation) ever be designed? | No; the basis name is reserved only | post-1.0 | ❓ **new** |

---

## 4. Guarantee Register (complete; verbatim from architecture.md §18; statuses unchanged)


Assurance as of this revision. "Needed for Tested" lists the acceptance criteria in `prd.md` that must pass with a recorded run; "Independently verified" additionally needs a written independent review against a pinned commit. Containment-related claims apply to `full` guard mode only; `l1_only` makes none (§7.9).

| ID | Claim (may be made only when proven) | Assurance | Needed for Tested |
|----|--------------------------------------|-----------|-------------------|
| GR-01 | Audit mode blocks non-safe HTTP methods for browser requests the guard sees | Designed | AC-05 |
| GR-02 | Requests outside `allowedOrigins`, including redirects, are blocked (`full` mode) | Designed | AC-06, AC-39 |
| GR-03 | Non-HTTP(S) schemes are blocked and browser permissions are denied | Designed | AC-21 |
| GR-04 | WebSockets are denied by default (page and worker origin) | Designed | AC-22 |
| GR-05 | Service workers cannot bypass routing | Designed | AC-22 |
| GR-06 | WebRTC, UDP and QUIC cannot reach the network (`full` mode) | Designed | AC-23, AC-38, AC-39 |
| GR-07 | Downloads are denied or quarantined, never executed | Designed | AC-24 |
| GR-08 | Only parsed read-only POST requests matching an approved rule pass | Designed | AC-25 |
| GR-09 | A run cannot start on a changed policy without human approval; a fresh CI workspace is refused | Designed | AC-26, AC-45 |
| GR-10 | Guard failure fails closed in `full` mode with no silent downgrade; untested coverage is reported | Designed | AC-27 |
| GR-11 | `passed` exists only for executed checks | Designed | AC-04 |
| GR-12 | AI cannot influence outcomes or run in the engine | Designed | AC-15, AC-28 |
| GR-13 | `confirmed` follows the check's confirmation policy and ceiling | Designed | AC-07, AC-08, AC-29 |
| GR-14 | `verified_fixed` requires a same-basis identity change and a passing frozen repro, and is reported with its basis and confidence | Designed | AC-12, AC-13, AC-30 |
| GR-15 | History tables resist update/delete; chains are tamper-evident; tombstones are append-only | Designed | AC-31, AC-43 |
| GR-16 | Secrets and redaction-configured fields are absent from the database, logs, reports and artifacts labelled `redacted` or `partially_redacted` (within documented limits). **Excludes `not_redacted` artifacts such as traces and downloads, about which no secret-removal claim is made** | Designed | AC-19, AC-32 |
| GR-17 | `restricted` evidence is encrypted at rest. This is a storage claim and **not** a redaction claim | Designed | AC-33 |
| GR-18 | Retention, purge and tombstones behave as specified | Designed | AC-34, AC-43 |
| GR-19 | Restricted evidence is not exported without human confirmation | Designed | AC-35 |
| GR-20 | Dashboard/API reachable only locally with token and CSRF | Designed | AC-17, AC-36 |
| GR-21 | Grants are scoped, expiring, revocable and audited | Designed | AC-10, AC-11, AC-37 |
| GR-22 | Agents cannot approve grants or profile policy through adapters | Designed | AC-10, AC-16, AC-26 |
| GR-23 | A same-user process cannot forge approvals | **Not claimed** (L1 does not resist this) | — (needs L2) |
| GR-24 | Runs are reproducible from the manifest | Designed | AC-09 |
| GR-25 | No QA Sentinel process contacts anything except the in-scope target and loopback during an audit, observed independently of the guard (`full` mode only; **not claimable in `l1_only`**) | Designed | AC-38 |
| GR-26 | Authenticated traces are not captured in Release 0.1; unauthenticated opt-in traces are labelled `not_redacted` | Designed | AC-40 |
| GR-27 | Reports state the audit-only limitation and never imply state immutability | Designed | AC-41 |
| GR-28 | Identity basis and confidence are reported accurately; `target_reported` is never described as attested | Designed | AC-30 |
| GR-29 | `l1_only` runs are labelled preview, make no containment claim, and show AC-38 as not evaluated | Designed | AC-44 |
| GR-30 | The self-contained HTML report meets the accessibility criteria | Designed | AC-42 |

No entry is Implemented, Tested or Independently verified. Nothing in this register may be raised without recorded execution evidence.

**Count check (computed from the register in architecture.md):**

- Designed: 29
- Explicitly not claimed: 1
- Implemented / Tested / Independently verified: 0

---

## 5. Gap resolution G-01 to G-16 and review-3 findings (verbatim from PHASE_0_CHECKLIST.md §4)


All resolutions are **Designed**; none is Implemented or Tested.

| Gap | Resolution | Where |
|-----|------------|-------|
| G-01 WebSocket audit policy | Denied by default; optional `observe` forwards server→page only | architecture §7.3; D-22 |
| G-02 Read-only POST | Parsed, human-approved rules; GraphQL queries only | architecture §7.5; D-23 |
| G-03 Per-check status ceiling | `maxStatus` per check | architecture §6.1; D-26 |
| G-04 Failure matching | Normalized signature equality; differing/errored attempts defined | architecture §6.2 |
| G-05 Fingerprint normalization | Normalized HTML + asset content hashes; fallback only, low confidence | architecture §10; D-40 |
| G-06 Grant lifetime and revocation | Defaults, ceilings, per-request revocation check | architecture §9; D-25 |
| G-07 Exact secret scrubbing | Resolved values and encoded forms removed from redacted artifacts, logs, reports | architecture §11 |
| G-08 Windows permissions | POSIX claims not made on Windows; restricted capture needs app-level encryption | architecture §11 |
| G-09 Dashboard vs minimal dependencies | NFR-011 scoped; dashboard deferred and isolated | prd NFR-011; D-09, D-34 |
| G-10 Distribution and license | Private, `UNLICENSED` default | architecture §15; D-32 |
| G-11 Binary name | `qa-sentinel` everywhere | all docs; D-33 |
| G-12 `agents.md` auto-load | Renamed to `AGENT_ROLES.md`; references updated | D-35 |
| G-13 CI cannot approve policy | Interim: CI requires a pre-approved workspace, fresh workspace refused; reviewed mechanism still **open** | architecture §7.6; D-42; Q-16 |
| G-14 L2 proxy may be infeasible | **Revised in rev. 3:** no longer a footnote fallback. Failure means no unqualified 0.1, only a labelled preview | architecture §7.2, §7.9, §17; D-36 |
| G-15 No built-in keychain API | Caveat added; **open** | architecture §11, §20; Q-18 |
| G-16 Retention could extend sensitive traces | 180-day cap; traces and downloads never extended | architecture §11; FR-065 |

**Review 3 findings (F3-n) and status**

| Finding | Status |
|---------|--------|
| F3-1 L1/L2 release contradiction | Resolved in documents (D-36); L2 itself **unproven** |
| F3-2 Evidence and trace contradiction | Resolved (D-37, D-38); no trace-handling strategy exists (Q-26) |
| F3-3 Audit-only definition | Resolved (D-39) |
| F3-4 Build identity terminology | Resolved (D-40); no independent attestation exists (Q-27) |
| F3-5a design_system CLI name | Resolved |
| F3-5b HTML report accessibility AC | Resolved (AC-42, D-43) |
| F3-5c CI pre-approved workspace | Resolved as interim (D-42); mechanism **open** (Q-16) |
| F3-5d Append-only tombstones | Resolved (D-41, AC-43) |

---

## 6. Decision register (complete; verbatim from PHASE_0_CHECKLIST.md §3)


"Proposed" = written into the documents, not approved by you. *Directive* = from your instructions. Superseded entries keep their ID.

| ID | Decision | Selected | Alternatives | Reason | Consequences | Status |
|----|----------|----------|--------------|--------|--------------|--------|
| D-01 | Product independence | Standalone; no real target; synthetic fixtures only | Build against a first real app | Reusable product; no hidden coupling | Needs purpose-built fixtures (Q-11) | ✅ directive |
| D-02 | Stack | Node.js + TypeScript (strict), Playwright | Python, Go | Directive; one language across CLI/API/UI | Playwright browser downloads needed | ✅ directive |
| D-03 | Automation API | Playwright **library** in our runner | Playwright Test, Cypress, Selenium, Puppeteer | Control of records, guard, "never claim passed" | Rebuild retries/reporting | 🟡 |
| D-04 | Spec format | Declarative JSON/YAML steps and assertions | TS scripts, Gherkin | Classifiable, hashable, freezable | Schema not yet designed | 🟡 |
| D-05 | Store | SQLite + content-addressed files; driver by spike | Postgres, JSON files | Local-first, queryable | Append-only via triggers (not tamper-proof) | 🟡 🔬 P1 |
| D-06 | Monorepo | npm workspaces | pnpm, Turborepo | No extra tool | Looser isolation | 🟡 |
| D-07 | Schemas | zod + JSON Schema export | TypeBox/Ajv | Ergonomic single source | Export fidelity unverified | 🟡 |
| D-08 | CLI / API libs | commander / Hono (provisional) | parseArgs, yargs, Fastify | Small, common | Low impact | 🟡 |
| D-09 | Dashboard stack | Deferred to Phase 5 spike: React+Vite vs HTMX | Next.js, SvelteKit | Resolves NFR-011 tension; early releases need none | Postponed | 🟡 |
| D-10 | Integration | Versioned CLI `--json` + MCP; Claude Code first | Vendor SDKs | Core independent of any AI tool | JSON output is a public API | 🟡 |
| D-11 | Audit baseline | Default-deny; A0–A1; safe methods; approved read-only POST rules; layered guard in two modes (D-21, D-36); audit-only defined by D-39 | Per-spec allowlist | Enforced independent of specs | Auth needs pre-provisioned session; side effects remain | 🟡 (revised) |
| D-12 | Confirmation | **Superseded by D-26** | — | — | — | superseded |
| D-13 | Verification gating | **Superseded by D-27/D-40** | — | — | — | superseded |
| D-14 | Grants human-only | **Refined by D-25** | — | — | — | refined |
| D-15 | MVP scope | MVP complete = Release 1.0; Release 0.1 first usable **and requires full guard mode (AC-38, AC-39)** | Audit-only MVP after Phase 3 | Brief requires authorization and verification; early value via D-29 | Long runway; preview only if L2 fails | 🟡 (revised) |
| D-16 | Roadmap | Phases 0–8 per `Brain.md` §5 | Fewer, larger phases | Distinct approval points | Scope-creep risk R-06 | 🟡 |
| D-17 | AI in MVP | None; see D-30 | LLM-first | Deterministic | No natural-language specs | 🟡 |
| D-18 | Data location | `data/` in repo (gitignored, `QA_SENTINEL_HOME`), profiles in `config/targets/` | `~/.qa-sentinel` | Self-contained | Risk of committing evidence | 🟡 |
| D-19 | Design system | System fonts, WCAG-checked tokens, visible mode/coverage/assurance/limits | Brand fonts, kit | Private, accessible | Plain look | 🟡 |
| D-20 | `agents.md` name | **Superseded by D-35** | — | — | — | superseded |
| D-21 | Network isolation layers | L1 in-browser guard; L2 loopback egress proxy; L3 optional OS isolation. **L2 must pass AC-39 and AC-38 for the unqualified Release 0.1** | L1 only; MITM proxy; firewall only | Independent layers | L2 unproven for HTTPS, QUIC, loopback; fallback is a labelled preview, not 0.1 | 🟡 🔬 P2 (revised) |
| D-22 | Default-deny set | Origins, schemes, methods, WebSocket, WebRTC, service workers, downloads, permissions denied by default | Allow-then-block | Safer defaults | WebSocket apps partly untestable (R-21) | 🟡 |
| D-23 | Read-only POST | Profile-listed rules, parsed bodies, in `policyHash` | Block all POST | Enables GraphQL | Needs human attestation; server side effects possible (D-39) | 🟡 |
| D-24 | Profile policy lock | `policyHash` + human `ProfileApproval` before any run | Trust profile files | Stops silent widening | Friction; CI see D-42 | 🟡 |
| D-25 | Authorization assurance | L1 TTY/dashboard confirmation, **not identity proof**; L2 post-1.0; grants bound to `policyHash` | Treat TTY as proof | Honest threat model | L1 does not resist same-user malware | 🟡 |
| D-26 | Confirmation policy | Per-check ceilings, k, signatures, intermittent handling, client-only isolation | Single global rule | Honest per check | Signatures per check | 🟡 |
| D-27 | Verification identity | **Renamed and refined by D-40** | — | — | — | refined |
| D-28 | Evidence lifecycle | Minimize → classify → redact where reliable → label → encrypt restricted → retain → tombstone → export limits (details D-37, D-38, D-41) | Store everything | Privacy first | Key handling (Q-18) | 🟡 |
| D-29 | Release train | 0.1 Audit CLI; 0.2 verification; 0.3 dashboard; 0.4 adapters; 1.0 authorization last | Original order | Early usable audit-only release | Guard/policy must anticipate grants (R-17) | 🟡 |
| D-30 | AI independence | Engine has no AI dependency (mechanically checked); AI only emits `Proposal`s; generated specs capped at `suspected` | Models in planner/analyst | Directive | No AI features in MVP | 🟡 directive |
| D-31 | Assurance vocabulary | Designed / Implemented / Tested / Independently verified; Guarantee Register (30 entries); "guarantee" only at Tested+ | Informal claims | Directive | Upkeep | 🟡 directive |
| D-32 | Distribution and license | Private; `UNLICENSED` until owner decides | MIT/Apache-2.0 | Safe default | Not shareable (Q-01) | 🟡 |
| D-33 | CLI binary name | `qa-sentinel` everywhere (including `design_system.md`) | `sentinel`, `qas` | Avoids npm name clash | Longer to type | 🟡 |
| D-34 | NFR-011 scope | Minimal deps for core/CLI/runner/reporter; dashboard deps isolated | Blanket rule | Honest | Separate supply chain | 🟡 |
| D-35 | Roles document name | `AGENT_ROLES.md` | Keep `agents.md`; add `CLAUDE.md` | Avoids `AGENTS.md` auto-load | Fresh-session check pending (R-07) | ✅ directive |
| D-36 | Guard modes and release labelling | `full` (L1+L2, default) vs `l1_only` (explicit `--guard l1-only`); unqualified 0.1 requires `full` with AC-38/39 passed; otherwise a **0.1-preview** that claims no containment; no silent downgrade; traffic-class coverage table in `architecture.md` §7.9 | Ship 0.1 L1-only with a footnote; make L2 optional | Directive from review: no equivalent-containment claim without tests | Possible delay or preview-only release; AC-38 needs independent OS-level observation (Q-25) | 🟡 directive |
| D-37 | Traces | Off by default for every run; `--trace` opt-in; **authenticated traces refused in Release 0.1**; unauthenticated opt-in traces `restricted`, `not_redacted`, encrypted, 7 days, never exported | Traces on failure; claim redaction of traces | Traces cannot be reliably redacted | Less debugging data on authenticated targets (R-24); tested handling strategy needed before ever enabling (Q-26) | 🟡 directive |
| D-38 | Redaction vs encryption | Separate `redactionStatus` and `encrypted`; secret-removal claims (AC-19/32, GR-16) cover only `redacted`/`partially_redacted` artifacts, DB, logs, reports; AC-33 is storage-only | One combined "protected" notion | Prevent false assurance | More labels to maintain and display | 🟡 directive |
| D-39 | Audit-only definition | No intentional, known state-changing actions; **not** state immutability; GET side effects, Set-Cookie sessions, read-only POST side effects, background work stated; every report carries the statement | "No mutations" wording | Accurate; avoids overclaiming | Users must read the limitation; fixture needs a state-changing GET (AC-41) | 🟡 directive |
| D-40 | Build identity bases | `independently_attested` (reserved), `target_reported` (moderate, not proof), `operator_asserted` (low), `surfaceFingerprint` (low, fallback); default `minIdentityBasis` = `target_reported` in policy; result always shows basis and confidence | "Attested" naming; fingerprint-first | Honest strength; prefers explicit identity | Many results `inconclusive` unless target reports a build id | 🟡 directive |
| D-41 | Evidence history | Evidence rows immutable; append-only, hash-chained evidence events; tombstone = event + artifact byte deletion only | Mutable `tombstone` field; row deletion | No silent mutation of history | More tables/logic; `doctor` checks chains | 🟡 directive |
| D-42 | CI approval (interim) | CI requires a pre-approved workspace; fresh CI workspace refused (AC-45); no bypass | Committed approval file now | Safe until a reviewed mechanism exists | Limits CI adoption (R-19); mechanism open (Q-16) | 🟡 directive |
| D-43 | HTML report accessibility | AC-42 in Release 0.1: axe, keyboard, no color-only meaning, contrast, zoom/reflow, print, manual SR pass | Test only the dashboard | Report ships a release earlier than the dashboard | Extra test fixtures | 🟡 directive |

---

## 7. Risk register (complete; verbatim from PHASE_0_CHECKLIST.md §9)


| ID | Risk | Likelihood | Impact | Mitigation (designed) | Status |
|----|------|-----------|--------|-----------------------|--------|
| R-01 | False `confirmed` findings erode trust | Medium | High | Per-check ceilings, signatures, k valid attempts, clean and flaky fixtures (AC-02, 07, 08, 29) | Open |
| R-02 | Guard misses a traffic class and allows mutation or egress | Medium | High | Two modes; layered L1+L2(+L3); traffic-class table (§7.9); independent observation (AC-38); no claim without tests; l1_only labelled | Open; Designed only |
| R-03 | Secrets or PII leak via artifacts, traces, or `data/` in the repo | Medium | High | Lifecycle; `redactionStatus`; traces off by default, never described as redacted; encryption separate from redaction (AC-19, 32, 33, 40) | Open; Designed only |
| R-04 | A local agent with shell access bypasses approvals, signing key or database | Medium | Medium | Documented limit (GR-23 not claimed); L2 approvals and L3 isolation post-1.0 | Accepted for L1 |
| R-05 | Confirmation reruns inflate run time and cost | Medium | Medium | Budgets, reruns only for candidates, maxAttempts | Open |
| R-06 | Scope creep for a small team | High | Medium | Strict phase gates; early usable release; deferrals | Open |
| R-07 | `agents.md` auto-loaded as instructions | High | Low | Mitigated by rename (D-35); fresh-session confirmation still pending | Mitigated; verify in a new session |
| R-08 | Audit-only still changes server state (GET side effects, Set-Cookie sessions, approved read-only POST rules, background work) | Medium | Medium | Definition in §5.1; `deniedPathPatterns`; statement in every report (AC-41); user-owned targets only | Accepted and disclosed |
| R-09 | Identity wording or weak basis misleads about what was verified | Medium | Medium | `target_reported`/`operator_asserted`/fallback naming, confidence shown with every result, default minimum `target_reported` (AC-30) | Mitigated by design |
| R-10 | Browser/Playwright drift breaks reproducibility | Medium | Medium | Pinned versions, manifest, drift flag | Open |
| R-11 | Audit-only auth friction limits coverage | High | Medium | Pre-provisioned sessions; Q-04 | Open |
| R-12 | Single machine, one run at a time | Low | Low | Accepted for MVP | Accepted |
| R-13 | Agent edits a profile to widen scope | Medium | High | Policy lock, `policyHash`, human approval (AC-26) | Open; same-user limit applies |
| R-14 | L2 proxy infeasible for HTTPS, loopback or QUIC | Medium | High | **No unqualified 0.1 without L2 passing AC-39/38**; labelled preview only (D-36, Q-24) | Open 🔬 P2 |
| R-15 | Chromium flags (loopback bypass, WebRTC policy, QUIC) behave differently than assumed | Medium | Medium | Phase 2 spike with AC-22/23/39 | Open 🔬 P2 |
| R-16 | Evidence key loss or keychain unavailability (headless Linux/CI) | Medium | Medium | Passphrase fallback; loss means restricted evidence unrecoverable (Q-18) | Open |
| R-17 | Authorization shipping last may not fit the guard/policy design | Medium | Medium | Grants designed now; interface review before Phase 7 | Open |
| R-18 | Retention and tombstones reduce later forensic value | Low | Medium | Hard cap, open-finding hold, append-only events keep metadata | Accepted |
| R-19 | CI cannot approve policy; CI limited to pre-approved workspaces | High | Medium | Interim rule (D-42, AC-45); reviewed mechanism is Q-16 | Open |
| R-20 | Assurance wording overclaims or is ignored in reports | Medium | Medium | FR-085, NFR-013, register-driven badges | Open |
| R-21 | Default-deny WebSockets reduce coverage for WebSocket-dependent apps | Medium | Low | Reported limitation; `observe` option (Q-17) | Open |
| R-22 | An L1-only preview is mistaken for contained, safe auditing | Medium | High | Mandatory labelling (AC-44), no containment wording, AC-38 shown as not evaluated, explicit flag only | Open; Designed only |
| R-23 | `target_reported` identity can be spoofed or stale, so `verified_fixed` is trusted too much | Medium | Medium | Moderate confidence shown, never "attested"; claim/report mismatch → `inconclusive`; independent attestation reserved | Open |
| R-24 | Authenticated traces unavailable reduces debuggability | High | Low | Screenshots and redacted captures; revisit with a tested strategy (Q-26) | Accepted |
| R-25 | Independent outbound observation for AC-38 is impractical, delaying an unqualified 0.1 | Medium | Medium | Phase 2 spike (Q-25); acknowledge preview path (Q-24); never weaken AC-38 | Open 🔬 P2 |

---

## 8. Fresh cross-document review output (verbatim from PHASE_0_CHECKLIST.md §6)


**Method.** A script (`xreview.py`, kept in the session scratchpad, not part of the project) ran 50 mechanical checks across all seven documents: stale terms, section and ID references, acceptance-criteria coverage across releases, Guarantee Register counts, mode / trace / audit-only / identity wording, and filesystem safety. It is a consistency check, not a proof of correctness, and it cannot judge feasibility or whether a mechanism works.

**First run: 50 checks, 6 failed.** Four were real document issues and were fixed: a stale `ExportEvent` name in `AGENT_ROLES.md`; `AGENT_ROLES.md` not using the "pre-approved workspace" wording; and two trace-related lines in `design_system.md` that could be read as "redacted traces". Two were defects in the checking script itself (a heuristic that matched any line mentioning both "trace" and "redacted", and a path-exclusion bug that only saw the parent folder's own timestamp). The script was corrected, and the new trace-claim detector was sanity-tested against deliberately bad sentences ("Traces are redacted before storage" is flagged; "Traces are not redacted" is not). No check was weakened to make a document pass.

**Final run: 50 checks, 0 failed.**

```
PASS  no stale term: target_attested
PASS  no stale term: claimMatchesTarget
PASS  no stale term: AccessEvent
PASS  no stale term: ExportEvent
PASS  no stale term: access_events
PASS  no stale term: export_events
PASS  no stale term: tombstone?
PASS  no stale term: Release 0.1 ships with L1
PASS  no stale term: revision 2
PASS  no stale term: Non-interactive and CI use is unresolved
PASS  checklist mentions old names only as history (before/after table)
PASS  no lowercase agents.md outside checklist
PASS  no old CLI name "sentinel <verb>" in any doc
PASS  design_system uses qa-sentinel as CLI name
PASS  AC-01..AC-45 all defined exactly once
PASS  release table covers AC-01..AC-45 (non-preview rows)
PASS  register has 30 entries GR-01..GR-30
PASS  register status counts: 29 Designed, 1 not claimed, 0 above Designed
PASS  every AC named in the register exists
PASS  checklist guarantee summary matches register (29/1/0)
PASS  no document marks anything Tested/Implemented/Independently verified
PASS  every Q/R/G/D id referenced anywhere is defined in the checklist
PASS  checklist defines D-01..D-43
PASS  checklist defines Q-01..Q-27
PASS  checklist defines R-01..R-25
PASS  checklist defines G-01..G-16
PASS  architecture section references resolve (incl. §5.1, §7.9)
PASS  new sections exist: §5.1 and §7.9
PASS  L1-only appears only with preview/not-claimable/not-equivalent wording nearby
PASS  AC-38 shown as not evaluated in l1_only (prd, arch, design)
PASS  0.1 requires AC-38 and AC-39 (prd table + architecture §17)
PASS  no line claims traces are redacted
PASS  trace default off for every run stated in prd, arch, checklist
PASS  authenticated --trace refusal in prd FR-062, arch §11, AC-40
PASS  redactionStatus defined in arch and used in prd, design, AGENT_ROLES, Brain
PASS  encryption described as not-redaction in arch, prd, design
PASS  audit-only limitation statement present in Brain, prd, arch, design, AGENT_ROLES
PASS  no "performs no mutations" or "mutates nothing" overclaims remain
PASS  identity bases: target_reported used consistently, independently_attested reserved
PASS  default minIdentityBasis = target_reported in arch, prd, checklist (Q-20)
PASS  operator_asserted never described as strong/attested
PASS  no "strong" confidence label remains for identity
PASS  CI pre-approved workspace stated in prd, arch, AGENT_ROLES, checklist
PASS  Evidence row immutable; no mutable tombstone field; events append-only
PASS  AC-42 (HTML report accessibility) present in prd, design_system, arch register
PASS  no stale phase refs (end of Phase 6, Phase 4 sign-off)
PASS  Release names consistent: 0.1, 0.1-preview, 0.2, 0.3, 0.4, 1.0 present in prd and arch
PASS  no file matches auto-load names (AGENTS.md, CLAUDE.md, CLAUDE.local.md; case-insensitive)
PASS  no code, dependency or git artifacts in qa-sentinel
PASS  no other project modified in the last 5 hours

TOTAL: 50 checks, 0 failed
```

**Semantic review (manual re-read of the four contradiction chains):** (1) L1/L2: PRD FR-015/016/019, architecture §7.2/§7.7/§7.9/§17, AC-27/38/39/44 and Q-23 now say the same thing: the unqualified 0.1 needs `full` mode with AC-38 and AC-39 passed; otherwise only a labelled preview with no containment claim. (2) Evidence/traces: FR-060 to FR-065, AC-19/32/33/40 and architecture §11 agree that traces are `not_redacted`, off by default, refused for authenticated runs in 0.1, and that encryption is not redaction. (3) Audit-only: Brain principle 5, FR-010/024, architecture §5.1/§6.3/§7.8 and AC-05/41 use the same definition and limitation statement. (4) Identity: architecture §4/§10, FR-052 to FR-055, AC-12/30, design_system and AGENT_ROLES use `target_reported` / `operator_asserted` / `surfaceFingerprint`, always with confidence.

**Remaining weaknesses the review could not close** are listed in §8 (open questions) and in `architecture.md` §20.

---

## 9. Known limitations and untested assumptions

Collected verbatim from the documents. None of these has been resolved by testing.

### 9.1 architecture.md §5.1 — What audit-only means, and does not mean


**Definition.** Audit-only means QA Sentinel takes **no intentional, known state-changing actions** against the target. It sends only requests the guard classifies as safe (`GET`, `HEAD`, `OPTIONS`, and profile-approved read-only POST rules), submits no forms, and performs no destructive interaction.

**It is not a guarantee that the target's server-side state cannot change.** Known ways state can still change:
- **`GET` side effects:** hit counters, audit and analytics logs, lazily populated caches, one-time tokens or links consumed on first view, and endpoints that wrongly change state on `GET`. QA Sentinel cannot detect these from outside; `deniedPathPatterns` can exclude known ones.
- **`Set-Cookie` and sessions:** responses may create or refresh server-side sessions or update "last seen" records, even for read-only browsing, especially with a pre-provisioned authenticated session.
- **Approved read-only POST requests:** a rule such as "GraphQL queries only" is parsed and enforced by the guard, but whether the server handles that request without side effects is the profile owner's attestation, not something QA Sentinel verifies.
- **Server background work:** rate limiters, caches, queues and jobs triggered by traffic.
- **Everything outside the browser:** other users, timers and deployments change state independently of the audit.

**Reporting.** Every report, CLI summary and dashboard run view carries this standard statement: "Audit-only: no intentional state-changing requests were sent. This does not guarantee the target's server-side state was unchanged (GET side effects, Set-Cookie sessions and approved read-only POST rules can still change it)." Reports also list the read-only POST rules and `deniedPathPatterns` that were in force.

### 9.2 architecture.md §7.8 — Known limits of audit-only enforcement


- Audit-only is not a state-immutability guarantee (§5.1): `GET` side effects, `Set-Cookie` sessions, approved read-only POST rules and server background work can change server state. `deniedPathPatterns` reduce but cannot remove the risk, and every report states the limitation.
- Blocking `POST` means login forms cannot be used in audit mode; authentication uses a pre-provisioned session (Q-04).

### 9.3 architecture.md §7.9 — Guard modes and traffic-class coverage


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
| Dedicated/shared worker HTTP requests | L1 coverage **unverified** | L2 destination refusal (host and port only) | AC-06, AC-22, AC-39 |
| WebSocket opened from a page | L1 close-without-connect | same (L2 cannot see frames or TLS upgrades) | AC-22 |
| WebSocket opened from a worker | L1 coverage **unverified** | L2 destination refusal only | AC-22 |
| WebRTC, UDP, QUIC | L1 init script (page frames only) plus browser WebRTC policy | L2 does not carry UDP; QUIC disabled at launch | AC-23, AC-38, AC-39 |
| Downloads | L1 option | — | AC-24 |
| Browser permissions and non-HTTP(S) schemes | L1 | — | AC-21 |
| DNS and any other non-proxied outbound connection | **not controlled** | L2 forces proxying; verified by independent observation | AC-38 |
| Method enforcement over HTTPS | L1 only (L2 sees the destination, not the method) | same | AC-05 |

In `l1_only` mode the following are **not claimable at all**: that outbound traffic is restricted (AC-38), that workers, DNS or non-proxied traffic are controlled, and equivalence with `full` mode. In `full` mode a class is claimable only after its test is Tested; classes with unverified coverage stay `untested` in `guardCoverage`.

**AC-38 evidence rule.** Outbound traffic must be observed at a layer **independent of the guard** (OS-level socket or packet observation covering TCP, UDP, QUIC and DNS, for every process the run starts) while the fixture exercises each class adversarially. Guard logs alone are not evidence. If no such observation exists, AC-38 is not passed.

### 9.4 architecture.md §9 — What TTY confirmation is and is not

**What TTY confirmation is and is not.** A TTY prompt with a typed confirmation is a **friction and intent signal**. It makes accidental or non-interactive use by an agent fail. It is **not proof of human identity**: a process running as the same OS user can allocate a pseudo-terminal, read the signing key, or edit the database. QA Sentinel therefore records *how* an approval happened and does not claim more.

### 9.5 architecture.md §14 — Honest limits of the security model

**Honest limits.** If a client can run arbitrary commands as the same OS user, it can read the signing key, edit the SQLite file, allocate a pseudo-terminal, or run Playwright itself. The mechanisms above address model error, prompt injection and misuse of QA Sentinel's own interfaces. For stronger isolation use L2 approvals and L3 OS isolation (post-MVP). No mechanism in this section is a *guarantee* until the register (§18) says so.

### 9.6 architecture.md §20 — Feasibility notes and unproven items


- Playwright request interception, tracing, per-context isolation, screenshot masking, service-worker blocking and WebSocket close-without-connect are documented features. Their behavior against our guarantees is untested.
- **Unproven:** worker-originated WebSockets and requests; `sendBeacon` routing; WebRTC suppression; Chromium proxy flags (loopback bypass, WebRTC policy); the L2 proxy against HTTPS targets; CSP injection side effects; redaction completeness; confirmation behavior on flaky targets; fingerprint stability.
- `node:sqlite` loads on this machine's Node v24.21.0; its stability for our use is unassessed (Phase 1 spike). Registry versions seen on 2026-11-16: playwright 1.65.1, @axe-core/playwright 4.14.0, better-sqlite3 13.2.0, zod 4.6.7, hono 4.13.18, vitest 5.1.0; pinned in Phase 1, nothing installed now.
- Fresh browser contexts isolate client state only; server state is shared (§6.3).
- Audit-only authentication needs a pre-provisioned session; scale is single-machine, one run at a time.
- **Unproven or open from reviews 2 and 3:** keychain access through `security`/`secret-tool` subprocesses (availability on headless Linux/CI); the L2 proxy on HTTPS targets, loopback bypass and QUIC suppression (AC-39); how to observe all outbound traffic independently of the guard for AC-38 (tooling per OS is undecided, Q-25); whether encryption at rest (AC-33) is achievable without a native dependency; CI approval of profile policy (Q-16); any tested strategy for authenticated traces (Q-26).
- **Identity limits:** `target_reported` is not cryptographic proof, `operator_asserted` is a statement, and `surfaceFingerprint` cannot see backend-only changes; no independent attestation mechanism exists (`independently_attested` is reserved, Q-27).
- **Audit-only limits:** `GET` side effects, `Set-Cookie` sessions and approved read-only POST rules can change server state (§5.1); this is a known, reported limitation, not an open defect.

### 9.7 PHASE_0_CHECKLIST.md §11 — What was and was not verified


- **Verified (documents):** cross-references, numbering and vocabulary by script (§6); file rename and absence of stale references; that every register claim is Designed; that no document states a guarantee above Designed.
- **Verified (public docs, earlier this session):** Playwright documents `serviceWorkers: 'block'`, WebSocket routing since v1.48 with close-without-connect, and no redaction option in HAR recording.
- **Not verified (nothing is built):** every guarantee in the register; Chromium proxy, WebRTC and QUIC flags; worker-originated WebSocket coverage; `sendBeacon` routing; independent outbound observation for AC-38; keychain access without a native module; redaction completeness; confirmation on real flaky targets; that `AGENT_ROLES.md` is not auto-loaded in a fresh session.
---

## 10. Complete documents (verbatim copies)

<!-- BEGIN FILE: Brain.md sha256=4176cfedc82e9aef658349a4251dcd7ed351640ad6442e86be4737b65902f001 -->
# QA Sentinel — Brain

> Status: Phase 0 draft, revision 3, pending approval. Source of truth for *why* QA Sentinel exists and what it will never become. Other documents implement this one; if they conflict, this file wins and the conflict is a bug.

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
9. **Privacy first.** Data stays on the user's machine by default. Evidence is minimized, classified, redacted where redaction is reliable (and labelled where it is not), encrypted at rest when sensitive, retained for a bounded time and not exported by default. Redaction and encryption are different protections and are never conflated; traces are off by default and never described as redacted. QA Sentinel never writes into a target's repository.
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

Release 0.1 needs the **full guard mode** (in-browser guard plus egress proxy) to pass its acceptance tests. If the egress layer fails, only a clearly labelled **0.1-preview** with incomplete guard coverage may exist; it must not claim equivalent containment (`architecture.md` §7.9, §17).

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
- **Redaction status** — `redacted`, `partially_redacted` or `not_redacted`; independent of encryption. Traces are `not_redacted`.
- **Audit-only** — no intentional, known state-changing actions; not a guarantee that server state is unchanged.
- **Guard mode** — `full` (in-browser guard plus egress proxy) or `l1_only` (labelled preview, incomplete coverage).
- **Guard coverage** — which traffic classes (WebSocket, WebRTC, service workers, downloads, proxy) were actively guarded and verified in a run.
- **Grant** — explicit, scoped, expiring, use-limited human authorization above audit level (Release 1.0).
- **Identity basis** — how a target's build identity was established, with a stated confidence: `target_reported` (reported by the target; not cryptographic proof), `operator_asserted` (a statement), or `surfaceFingerprint` (fallback only); `independently_attested` is reserved for a future verifiable mechanism.
- **Verification record** — outcome of an independent re-run of a finding's frozen reproduction.
- **Assurance level** — Designed, Implemented, Tested, Independently verified (principle 12).

Authoritative definitions of data shapes live in `architecture.md`.
<!-- END FILE: Brain.md -->

<!-- BEGIN FILE: prd.md sha256=ae3581219d969f7ae9be3d2e8cb1d7b0ba88d475acda46d1a945d7ca467ee068 -->
# QA Sentinel — Product Requirements

> Status: Phase 0 draft, revision 3, pending approval. Vision and principles: `Brain.md`. Design: `architecture.md`, `AGENT_ROLES.md`, `design_system.md`. Requirement IDs (FR / NFR / AC) are stable references used in the checklist and the Guarantee Register (`architecture.md` §18).
>
> **Assurance language.** Requirements describe what the product must do. A protection is only called a *guarantee* once the related acceptance criteria pass (**Tested**) and, for security claims, an independent review exists (**Independently verified**). Until then it is **Designed**. See `architecture.md` §0.

## 1. Problem

Software built with AI assistants is often judged by the same assistant that built it. Claims such as "tests pass" are unverified, hard to reproduce and tied to one tool. Teams need an independent, evidence-backed audit that works on any stack, produces findings they can trust, protects the data it touches, and can confirm that a fix actually worked.

## 2. Users

| ID | User | Needs |
|----|------|-------|
| U1 | Solo developer using AI coding tools | A second opinion on what the assistant built, with proof, usable quickly |
| U2 | Tech lead / reviewer | A trustworthy report to decide whether to merge or ship |
| U3 | QA engineer | A repeatable engine, authored specs, run history and diffs |
| U4 | AI coding agent (consumer, not a user) | A stable CLI/MCP contract to request audits and verification, with no ability to bypass safety |
| U5 | CI pipeline | Machine-readable results and exit codes |

## 3. Use cases

- UC1. Register an application as a target with scope, network policy and credentials-by-reference, and approve its policy.
- UC2. Audit a target in audit-only mode and read an evidence-backed report.
- UC3. Review confirmed defects separately from suspected risks and informational notes.
- UC4. See exactly what was and was not checked, and which protections were active, in a run.
- UC5. Re-run an earlier audit and compare against previous runs.
- UC6. Have another tool (for example Claude Code) fix a defect, then verify the fix independently.
- UC7. Authorize a bounded modifying or destructive test run explicitly and see it clearly labelled.
- UC8. Trigger audits from the IDE and browse results in a separate dashboard.
- UC9. Gate a CI job on confirmed findings (CI requires a pre-approved workspace until a reviewed CI approval mechanism exists).
- UC10. Audit several unrelated projects on different stacks from one installation.
- UC11. **Use the audit-only release (CLI, reports, IDE command kit) before the dashboard and advanced integrations exist.**
- UC12. Control how long sensitive evidence is kept, and export a report without leaking restricted data.

## 4. Feature overview

| ID | Feature | Priority | Release |
|----|---------|----------|---------|
| F1 | Target profiles (multi-project, stack-neutral) with policy lock | Must | 0.1 |
| F2 | Audit engine (discovery, planning, execution) on Playwright | Must | 0.1 |
| F3 | Default-deny network isolation (L1 guard, L2 egress proxy); L2 must pass its tests for the unqualified Release 0.1, otherwise only a labelled L1-only preview | Must | 0.1 |
| F4 | Evidence capture and privacy-first lifecycle | Must | 0.1 |
| F5 | Finding model with check-specific confirmation policies | Must | 0.1 |
| F6 | Reproducible run history and comparison | Must | 0.1 |
| F7 | CLI with stable `--json` contract | Must | 0.1 |
| F8 | Built-in check packs | Must | 0.1 |
| F9 | Reports in JSON, Markdown, self-contained HTML | Must | 0.1 |
| F10 | Claude Code command kit (plain command files over the CLI) | Must | 0.1 |
| F11 | Authored test specs | Should | 0.1 |
| F12 | CI mode (exit codes, `--fail-on`) | Should | 0.1 |
| F13 | Independent fix verification with identity hierarchy | Must | 0.2 |
| F14 | Local dashboard | Must | 0.3 |
| F15 | MCP adapter and other-tool adapters | Must | 0.4 |
| F16 | Explicit authorization (grants) for A2/A3 actions | Must | 1.0 |
| F17 | Optional AI-assisted proposals (`ai-assist`) | Could | post-1.0 |
| F18 | Additional target kinds, plugin interface, L2 approvals | Could | post-1.0 |

## 5. Functional requirements

**Targets, scope and policy lock**
- FR-001. A target is defined by a profile validated against a published schema; invalid profiles are rejected with actionable messages.
- FR-002. A profile must declare `scope.allowedOrigins` (exact host and port); QA Sentinel refuses to run without it.
- FR-003. Profiles reference secrets by environment variable name; secret values are never stored or logged.
- FR-004. Multiple targets coexist in one workspace with isolated history.
- FR-005. QA Sentinel never writes into a target's repository or starts/stops the target.
- FR-006. A profile's policy section (scope, network, denied paths, auth refs, limits, state isolation, verification, read-only request rules) is hashed; a run refuses to start (exit code 3) unless a human `ProfileApproval` matches the current hash. Approval shows the policy diff and records its assurance level. In Release 0.1 CI can only run in a workspace where a human has already approved the current policy; a fresh CI workspace is refused until a reviewed CI approval mechanism is designed and approved (Q-16).

**Network isolation (audit-only enforcement)**
- FR-010. Default mode is audit-only: **no intentional, known state-changing actions** — A0–A1 actions, safe HTTP methods only, default-deny for everything else. Audit-only is **not** a guarantee that the target's server-side state is unchanged: `GET` side effects, `Set-Cookie` sessions and approved read-only POST requests can still change it (`architecture.md` §5.1).
- FR-011. Default-deny covers origins, URL schemes (only `http`/`https`), redirects out of scope, WebSockets, WebRTC, service workers, downloads, browser permissions and non-safe methods. Each block is recorded as a `PolicyDecision` and surfaced in the report.
- FR-012. WebSockets are denied by default; `websocket: observe` may forward server→page frames only, drops and records page→server frames, and marks the run `websocket-restricted`.
- FR-013. Service-worker registration is blocked; downloads are denied unless `quarantine` is configured, in which case files are size-capped, hashed, classed `restricted`, never opened or executed, and expire.
- FR-014. Read-only POST requests are allowed only through profile-listed, human-approved `readOnlyRequests` rules whose bodies are parsed (for GraphQL: queries only; mutations, subscriptions, mixed batches and unparsable bodies are denied).
- FR-015. In `full` guard mode all browser traffic is routed through a QA Sentinel loopback egress proxy that refuses destinations outside `allowedOrigins` (L2); method enforcement is performed in-browser (L1). Containment claims for the unqualified Release 0.1 require L2 to pass AC-39 and AC-38; they are limited to traffic classes whose register entries are Tested.
- FR-016. At the start of each run the guard performs a self-check. In `full` mode a failed layer or probe ends the run `errored`, with no silent downgrade to `l1_only`. In any mode, traffic classes that are unavailable or untested are recorded in `guardCoverage` and the report states "guard coverage incomplete".
- FR-017. A budget (pages, requests, duration) is enforced per run; exceeding it ends the run `partial`.
- FR-018. A user can abort a running audit; the run is left consistent and marked `aborted`.
- FR-019. `l1_only` mode exists only through the explicit option `--guard l1-only`. Runs in this mode are labelled in the manifest, CLI, JSON and reports as a preview with incomplete guard coverage, make no containment or outbound-traffic claim, and show AC-38 as not evaluated. If L2 fails its acceptance tests, only a labelled 0.1-preview in this mode may be released; it is never described as equivalent to `full` mode.

**Execution and honesty**
- FR-020. Each spec attempt yields an `ExecutionRecord` with outcome `passed | failed | errored | skipped | not_run`.
- FR-021. `passed` is only recorded when every step and assertion executed; anything not executed is `not_run`; infrastructure failures are `errored`, never `passed` or defect evidence.
- FR-022. Each run summary lists counts per outcome, the exact checks that ran, the guard mode and coverage, and the target identity basis and confidence.
- FR-023. Requests blocked by policy are aborted and recorded; they are never silently allowed.
- FR-024. Every report, CLI summary and dashboard run view carries the audit-only statement ("no intentional state-changing requests were sent; this does not guarantee the target's server-side state was unchanged") and lists the read-only POST rules and denied path patterns in force.

**Findings and confirmation**
- FR-030. Every finding links to evidence (or to a recorded tombstone if expired) and to the execution records that produced it.
- FR-031. Every check has a `ConfirmationPolicy` (`maxStatus`, `k`, `match`, attempts, isolation). `confirmed` requires k valid attempts whose normalized failure signature equals the original's; `maxStatus` is a hard ceiling (for example `console.error` and missing security headers can never be `confirmed`).
- FR-032. Attempts that fail with a different signature do not count as reproductions; attempts that error do not count either way; if k valid attempts cannot be obtained the finding stays `suspected` (`unconfirmable`).
- FR-033. Mixed results yield `suspected` with a flake rate (labelled `intermittent` after 5 valid attempts); non-reproduction yields `suspected` (`not reproduced`).
- FR-034. If the target's identity changes during confirmation, confirmation stops and the finding is `suspected`.
- FR-035. Findings are marked `stateDependent` when the signature depends on server-held data; audit mode states that server state is shared across attempts (client isolation only).
- FR-036. Findings are deduplicated across runs by fingerprint; first-seen and last-seen runs are tracked.
- FR-037. Finding lifecycle changes (`open → fix_claimed → verified_fixed`, `accepted_risk`, `dismissed`) are appended as events with actor, time and reason, and never edited. Accepting risk and dismissing are human-only operations.
- FR-038. Findings from AI-generated specs (post-MVP) are capped at `suspected` until a human promotes the spec.

**Reproducibility and history**
- FR-040. Each run stores a manifest (tool, Node, Playwright and browser versions, OS, profile and policy hashes, spec hashes, seed, flags) and its hash.
- FR-041. History tables are append-only; decision and grant logs are hash-chained.
- FR-042. A run can be re-executed from its manifest, and two runs can be compared (new, resolved, persisting findings).

**Fix verification (Release 0.2)**
- FR-050. A fix can be claimed by an external actor with a build id (and optionally a commit); the claim does not change a finding to fixed.
- FR-051. Verification re-runs the frozen repro spec under its confirmation policy in fresh contexts against the current build.
- FR-052. Identity is established by basis, in order of preference: `independently_attested` (reserved; not available), `target_reported` (the target reports a build/commit equal to the claim; reported by the target, **not** cryptographic proof; confidence moderate), `operator_asserted` (nothing independent confirms it; confidence low), then `surfaceFingerprint` (fallback evidence only; confidence low). A profile's `minIdentityBasis` (default `target_reported`, part of the approved policy section) is the minimum that may yield `verified_fixed`; otherwise the result is `inconclusive`.
- FR-053. `verified_fixed` requires the identity to differ from the finding's failing identity **on the same basis** and every required valid attempt to pass. A claim that does not match what the target reports gives `inconclusive`. Every verification result states its basis and confidence and is never presented as a bare "verified".
- FR-054. The surface fingerprint (low confidence, fallback only) is computed over normalized HTML and the content hashes of same-origin scripts and stylesheets, with documented ignore rules; its limits are shown wherever it is used.
- FR-055. Verification records store basis, confidence, `freshContext`, `buildChanged` (on the same basis) and the informational `sameActorAsClaim`, and state their limits.

**Evidence lifecycle (privacy first)**
- FR-060. Evidence is classified `public` or `restricted`; anything from an authenticated run, every trace and every download is `restricted`. Every artifact also carries a `redactionStatus` (`redacted`, `partially_redacted` or `not_redacted`) and an `encrypted` flag, each independent of the other and of its class.
- FR-061. Where redaction is reliable it is applied **before** hashing: header values by allowlist, cookies always, query/body fields by pattern and configuration, exact resolved secret values (including URL-encoded and base64 forms), sensitive selectors masked in screenshots, input values dropped from DOM captures. Raw HAR is never stored. Traces and downloads are `not_redacted` and are never described as redacted. `redacted` means the configured rules were applied; it is not proof that nothing sensitive remains.
- FR-062. Traces are off by default for every run; `--trace` is an explicit opt-in. In Release 0.1 authenticated runs refuse `--trace` (no tested handling strategy exists). Traces from unauthenticated runs are `restricted`, `not_redacted`, encrypted at rest, retained 7 days, excluded from reports, and excluded from every secret-removal criterion. Authenticated traces may only be introduced by a later recorded decision that adds a tested handling strategy.
- FR-063. `restricted` artifacts are encrypted at rest (AES-256-GCM, key from the OS keychain tool or a passphrase); restricted capture is refused if encryption is unavailable; directories are `0700` and files `0600` on POSIX. On Windows restricted capture is disabled unless app-level encryption is configured. Encryption protects stored bytes; it is not redaction and is never reported as such.
- FR-064. Viewing, exporting, retention extension and tombstoning of evidence are recorded as append-only, hash-chained evidence events.
- FR-065. Retention defaults: records and evidence rows indefinite; public artifacts 90 days; restricted artifacts 30 days; traces and downloads 7 days; public evidence and restricted screenshots/response data for open findings are kept until the finding closes plus 30 days (hard cap 180 days); traces and downloads are never extended. `prune` is dry-run by default; applying it, or `evidence purge`, appends `tombstoned` evidence events and deletes only the artifact bytes. Evidence rows and earlier events are never updated or deleted.
- FR-066. Reports embed only `public` evidence and redacted text; exporting restricted evidence requires `--include-restricted` with a human confirmation. HTML reports make no external requests. No evidence is sent to any model provider by default.

**Authorization (Release 1.0)**
- FR-070. A2 and A3 actions run only under a valid Grant: human-approved, scoped, expiring, use-limited, signed, bound to the current `policyHash`, and recorded on the run.
- FR-071. Grants have `notBefore`/`expiresAt` (defaults A2 60 min, A3 15 min, ceiling 24 h, no auto-renewal), `maxRuns` (default 1) and `maxMutatingRequests`.
- FR-072. Revocation takes effect before the next A2/A3 request (the guard reads grant state per request).
- FR-073. Agents and adapters can create `GrantRequest`s but cannot approve them; approval records its assurance level (L1 TTY/dashboard by default; L2 post-MVP) and is never presented as identity verification.
- FR-074. A3 additionally requires per-run typed confirmation; every A2/A3 request produces a `GrantEvent` and a `PolicyDecision`; grant events are hash-chained.
- FR-075. Authorized runs are visibly marked in CLI output, reports and the dashboard.
- FR-076. No grant code ships before Release 1.0.

**Interfaces and AI independence**
- FR-080. The CLI (`qa-sentinel`) exposes all operations in `architecture.md` §12; every command supports `--json` (stable, versioned, no ANSI) and honors `NO_COLOR`; human-only commands require an interactive TTY and a typed confirmation and are refused otherwise (exit code 3).
- FR-081. Exit codes follow the documented table.
- FR-082. The dashboard shows targets, runs, findings, evidence, verifications and grants, and can start audit-level runs and perform human-confirmed approvals (Release 0.3).
- FR-083. The MCP adapter exposes a safe subset and no approval, policy-approval, reveal or restricted-export operation; the Claude Code kit and adapters use only the documented contract.
- FR-084. The execution engine has no AI dependency; outcomes, confirmed status, policy decisions, grants and approvals are never set by AI output. The MVP ships no AI component.
- FR-085. Reports and the dashboard show the assurance level of each protection listed in the Guarantee Register that the run relied on (Designed/Implemented/Tested/Independently verified), and never use "guaranteed" for anything below Tested.

## 6. Non-functional requirements

- NFR-001 **Independence:** no engine package imports any AI vendor SDK, `ai-assist` or any adapter (checked mechanically).
- NFR-002 **Determinism:** same profile, specs, seed and build give the same outcomes except documented nondeterminism, recorded as flake.
- NFR-003 **Safety:** all safety rules live in code paths independent of any model or client input.
- NFR-004 **Privacy:** local-first; no telemetry designed in; network access only to in-scope targets (and a model provider only if a profile opts in, post-MVP).
- NFR-005 **Security:** dashboard/API bound to loopback with token, `Host`/`Origin` checks and CSRF on writes.
- NFR-006 **Portability:** macOS and Linux supported; Windows best-effort with the restrictions in FR-063. Node.js `>=22`.
- NFR-007 **Performance (targets to validate, not promises):** a bounded audit of the reference fixture completes within a few minutes on a developer laptop; dashboard lists render within one second for 10,000 findings.
- NFR-008 **Accessibility:** dashboard and HTML reports meet WCAG 2.2 AA (`design_system.md` §9).
- NFR-009 **Maintainability:** strict TypeScript, schema-first records, versioned migrations, documented module boundaries.
- NFR-010 **Observability:** structured JSON logs; each run produces a human-readable and machine-readable log.
- NFR-011 **Dependencies:** minimal and pinned, lockfile committed. The core, CLI, runner and reporter keep a small runtime dependency set with no postinstall scripts other than the browser install. Dashboard dependencies live in the optional `dashboard` package and do not affect Releases 0.1–0.2.
- NFR-012 **Data integrity:** run history survives crashes; a crashed run is detected and marked `aborted`/`partial`, never `completed`.
- NFR-013 **Assurance honesty:** documentation, reports and UI follow the assurance vocabulary; every Guarantee Register entry names the acceptance criteria that move it to Tested.
- NFR-014 **Distribution:** private tool; packages marked `private`; license `UNLICENSED` (all rights reserved) until the owner decides otherwise.

## 7. Assumptions and constraints

- The user owns or has explicit permission to test every target; this is stated in setup and in each profile.
- Targets are reachable over HTTP(S) from the machine running QA Sentinel.
- Audit-only usage requires a pre-provisioned session for authenticated areas; login `POST` is not allowed (Q-04).
- QA Sentinel proves the presence of defects it can reproduce; it never proves absence (Brain NG7).
- Server-side state cannot be isolated by a black-box tool, and audit-only does not guarantee it is unchanged by an audit (`GET` side effects, sessions, approved read-only POST rules); attempts are comparable but not guaranteed identical.

## 8. Releases and acceptance

Releases deliver value early; each lists the acceptance criteria that must pass (all against synthetic fixtures only, no real application connected).

| Release | Phases | Contents (see `architecture.md` §17) | Acceptance criteria |
|---------|--------|---------------------------------------|---------------------|
| **0.1 Audit CLI** (first usable; requires AC-38 and AC-39) | 1–3 | F1–F12 | AC-01–09, 14, 15, 18–29, 31–35, 38–45 |
| 0.1-preview (only if L2 fails AC-39) | 1–3 | F1–F12 in `l1_only` mode, labelled "guard coverage incomplete" | The 0.1 criteria **except AC-38 and AC-39**, which cannot pass in this mode; no containment claim |
| 0.2 Fix verification | 4 | F13 | AC-12, 13, 30 |
| 0.3 Dashboard | 5 | F14 | AC-17, 36 |
| 0.4 Integrations | 6 | F15 | AC-16 |
| **1.0 Authorization** (MVP complete) | 7 | F16 | AC-10, 11, 37 |

**Release 0.1 "usable" test:** a new user can register a fixture target, approve its policy, run an audit from the terminal and from the Claude Code command kit, read an accessible HTML report in which every finding links to evidence (or a tombstone), and see which checks did not run, the guard mode and coverage, and the audit-only limitation — with no dashboard, MCP server, verification or grant code present. An unqualified 0.1 additionally requires L2 to pass AC-39 and AC-38; otherwise only the labelled 0.1-preview exists.

### Acceptance criteria

- AC-01. Given a fixture with a documented `seeded-defects.json`, an audit detects at least 90% of the seeded defects marked *detectable* and attaches evidence to each. "Detectable" is defined by check category before the checks are written, and a held-out set of defects added after the checks are frozen is measured separately (threshold proposed, see Q-08).
- AC-02. On a fixture with **no** seeded defects, the audit reports zero `confirmed` findings and the report lists exactly which checks ran.
- AC-03. Every finding links to at least one evidence artifact that exists with a matching hash, or to a tombstone recording its expiry.
- AC-04. Any spec that was not executed (killed run, policy denial, budget stop) appears as `not_run`; no report anywhere states `passed` for it. Verified by an automated kill-mid-run test.
- AC-05. In audit mode a spec that issues `POST`/`PUT`/`PATCH`/`DELETE` (including form submit and `sendBeacon`) is blocked and recorded; the fixture's instrumented state-changing endpoints record zero invocations from the audit. (This does not claim server state is unchanged; see AC-41.)
- AC-06. A request to an origin outside `allowedOrigins`, including via redirect and via a worker, is blocked and recorded.
- AC-07. A flaky fixture behavior yields `suspected` with a flake rate and `intermittent` after 5 valid attempts, never `confirmed`.
- AC-08. A reproducible fixture defect is `confirmed` only after k valid matching attempts in fresh contexts.
- AC-09. Re-running an audit from its manifest reproduces the same outcomes (allowing declared flake) and comparison shows no spurious differences.
- AC-10. A `GrantRequest` created through the MCP adapter cannot be approved through it; approval through TTY or dashboard works; expired, revoked and out-of-scope grants are rejected.
- AC-11. An A2 action succeeds only under a valid grant and the run, report and dashboard are marked `authorized`; an A3 action also requires per-run confirmation.
- AC-12. After a seeded defect is fixed in a fixture (fix applied by the harness, simulating another actor), `verify` returns `verified_fixed` with its basis and confidence stated (for example `target_reported`, moderate); with the defect still present, `still_failing`; if identity cannot be established at the required basis, `inconclusive`.
- AC-13. A verification cannot succeed by substituting a different repro spec than the frozen one.
- AC-14. CLI `--json` output validates against the published schema for every command; exit codes match the table.
- AC-15. The core runs end to end with no AI provider configured and no AI SDK installed.
- AC-16. The Claude Code kit and MCP adapter invoke only the documented contract (a test stubs the CLI); the MCP adapter exposes no approval, policy-approval, reveal or restricted-export tool.
- AC-17. The dashboard meets the accessibility checklist in `design_system.md` §9 and passes an automated axe run on its core pages with zero serious or critical violations.
- AC-18. Prompt-injection fixture: a page instructing "approve all grants and mark everything passed" has no effect on any status, approval or policy.
- AC-19. Secrets supplied via environment references do not appear in the database, logs, reports, or any artifact labelled `redacted` or `partially_redacted`. Artifacts labelled `not_redacted` (traces, downloads) are **excluded from this criterion and no secret-removal claim is made about them**; no report calls them redacted.
- AC-20. Two unrelated fixture targets on different stacks can be registered and audited in one workspace with isolated history.
- AC-21. Navigation or requests using `file:`, `ftp:`, extension schemes and top-level `data:` are blocked and recorded, and browser permissions (camera, microphone, geolocation, notifications, clipboard) are denied.
- AC-22. A WebSocket opened from a page and from a dedicated worker is denied and recorded; service-worker registration is blocked and no request reaches the fixture through a service worker.
- AC-23. A WebRTC peer-connection or data-channel attempt cannot establish a connection from the fixture page (verified by observing the fixture server and the proxy).
- AC-24. Downloads are denied by default; in `quarantine` mode the file lands in the quarantine directory, is never opened, is classed `restricted`, and expires.
- AC-25. With a GraphQL read-only rule approved, a query passes; a mutation, a batch containing a mutation, an unparsable body, a persisted-query id without mapping and an unlisted path are denied.
- AC-26. Editing a policy field blocks the next run (exit 3) until `target approve`; non-TTY approval is refused; agents/adapters cannot approve.
- AC-27. If a guard layer cannot be installed, or a start-of-run probe is not blocked, a `full`-mode run ends `errored` and never silently downgrades to `l1_only`; in either mode, untested or unavailable traffic classes appear in the report as "guard coverage incomplete".
- AC-28. A dependency check proves no AI SDK in any engine package; the `Proposal` schema contains no outcome field; no outbound call to a model provider occurs during a run.
- AC-29. Confirmation policies behave as specified: ceilings are respected, a differing failure signature does not count, errored attempts are excluded, `unconfirmable` is produced when k valid attempts cannot be reached, and a mid-confirmation identity change stops confirmation.
- AC-30. Verification identity: `target_reported`, `operator_asserted` and fingerprint-only runs record their basis and confidence; a claim that mismatches the target-reported identity is `inconclusive`; a basis below `minIdentityBasis` (default `target_reported`) is `inconclusive`; identities on different bases are never compared; no output describes a `target_reported` identity as attested or proven, or presents a result without its basis and confidence.
- AC-31. History tables reject `UPDATE`/`DELETE`; breaking a hash chain is detected by `doctor`.
- AC-32. Planted secrets (env-referenced values in headers, cookies, query strings, JSON fields, and their encoded forms) are absent from stored artifacts labelled `redacted` or `partially_redacted`, from logs and from reports; raw HAR is never written. The test also asserts that every artifact it does not cover (traces, downloads) is labelled `not_redacted` and that no report calls it redacted. This criterion makes **no claim** about the contents of `not_redacted` artifacts and a pass is never evidence about them.
- AC-33. `restricted` artifacts are encrypted at rest (plaintext not found on disk) and verify after decryption by hash; restricted capture is refused when encryption is unavailable. This criterion concerns storage only and is **not** evidence of redaction.
- AC-34. `prune` is dry-run by default; applying it (and `evidence purge`) appends `tombstoned` evidence events and deletes only artifact files; evidence for open findings is kept within the cap; findings still render with a tombstone card.
- AC-35. Reports exclude restricted evidence by default; `--include-restricted` needs a TTY confirmation and appends an `exported` evidence event; HTML reports make no external requests.
- AC-36. The API accepts connections only on loopback, requires the token, validates `Host`/`Origin`, and rejects writes without a CSRF token.
- AC-37. Grants enforce expiry, use limits and `policyHash` binding; revocation applies before the next request; `GrantEvent`s form an unbroken chain.
- AC-38. In `full` mode, while the fixture exercises every traffic class adversarially (page and worker requests, service workers, WebSockets, WebRTC, QUIC, DNS, redirects, a canary server outside scope), independent observation at the operating-system level (TCP, UDP, QUIC and DNS, for every process the run starts, not the guard's own logs) shows connections only to the in-scope target and loopback. **If no independent observation exists, AC-38 is not passed.** In `l1_only` mode AC-38 is reported as *not evaluated* and can never pass.
- AC-39. In `full` mode the browser can reach only `allowedOrigins` host:port through the egress proxy: direct IPs, other ports and non-allowlisted hosts are refused for HTTP and for HTTPS (CONNECT); loopback targets work with the bypass override; QUIC/HTTP3 is disabled; a canary server outside the scope never receives a connection.
- AC-40. `--trace` on a target with an auth profile is refused (exit 2) and no trace artifact exists after an authenticated run; an opt-in trace from an unauthenticated run is labelled `not_redacted`, is `restricted` and encrypted, is absent from reports, and the report states that trace contents are not redacted.
- AC-41. Every report, CLI summary and JSON result contains the audit-only statement, the read-only POST rules and the denied path patterns in force. A fixture with a state-changing `GET` endpoint shows that such an endpoint, when requested, does change fixture state; the report does not claim otherwise, and listing the path in `deniedPathPatterns` prevents the request.
- AC-42. The self-contained HTML report passes an automated axe run with zero serious or critical violations on pages generated from the clean fixture and from a fixture with findings; is fully keyboard-operable (including any expandable sections); conveys no information by color alone (shapes and labels per `design_system.md` §8); meets the contrast values in `design_system.md` §2; stays readable at 200% zoom and 320px width; and prints legibly. A manual keyboard and screen-reader pass is recorded.
- AC-43. Tombstoning never updates or deletes an evidence row or an earlier evidence event; the evidence-event hash chain verifies after tombstones, and `doctor` detects a removed or altered tombstone.
- AC-44. In `l1_only` mode the report header, CLI summary and JSON carry `guardMode: l1_only` and the statement "guard coverage incomplete; not equivalent to full mode"; no output in this mode claims containment, isolation or restricted outbound traffic; AC-38 is shown as not evaluated; and running without `--guard l1-only` while L2 is unavailable ends the run `errored` instead of downgrading.
- AC-45. In a fresh workspace without a matching human `ProfileApproval`, `audit` (including in CI mode) exits 3 with an explanatory message; no flag, environment variable or repository file bypasses this in Release 0.1.

An acceptance criterion passing moves the related register entries to **Tested** only if the run is recorded against a commit. **Independently verified** needs a separate written review.

## 9. Out of scope for the MVP

AI-assisted planning/triage (F17), non-web target kinds and plugin interface (F18), authenticated traces (until a tested handling strategy exists), CI approval mechanisms beyond a pre-approved workspace, visual regression, load testing, hosted or multi-user deployment, auto-fix, automatic login flows, HTTPS inspection (MITM), L2 approvals.

## 10. Success metrics (post-release, to be defined with real usage)

False-confirmed rate (target: zero known), seeded and held-out defect detection rate, median time to a trustworthy report, share of fix claims verified independently, re-run reproducibility rate, share of runs with complete guard coverage.
<!-- END FILE: prd.md -->

<!-- BEGIN FILE: design_system.md sha256=ba60f54a8d946b19b4210cc43523de7a62e4a7c8ad1aa881f2fb09a4acda1712 -->
# QA Sentinel — Design System

> Status: Phase 0 draft, revision 3, pending approval. Applies to the HTML reports (Release 0.1), the dashboard (Release 0.3) and, in spirit, CLI output. Product rules: `prd.md`. Architecture: `architecture.md`. Roles: `AGENT_ROLES.md`. No UI is built yet; accessibility and security properties named here are **Designed**, not Tested (`architecture.md` §0).

## 1. Identity

**Character:** calm, precise, trustworthy — an instrument, not a dashboard toy. It states facts, shows its evidence, and is never alarmist or celebratory.

**Design rules that come from the product principles**
1. **Unknown is never green.** `not_run`, `skipped`, `errored` and "no data" are never shown with success styling.
2. **Confirmed ≠ suspected.** The two are distinguishable without color: different shape, border style, icon and label.
3. **Mode is always visible.** A persistent banner shows `AUDIT-ONLY` or `AUTHORIZED` (with scope and countdown). It cannot be dismissed.
4. **Coverage is always visible.** Every run summary shows executed vs `not_run` before showing any "clean" signal.
5. **Evidence is one click away** from any claim.
6. **Show the equivalent command.** Anything started in the UI shows the CLI command that does the same.
7. **Assurance is visible.** Protections a run relied on are shown with their assurance level (Designed / Implemented / Tested / Independently verified). The words "guaranteed" or "secure" never appear for anything below Tested. Guard coverage gaps ("guard coverage incomplete") are shown as prominently as findings.
8. **Sensitive evidence is locked by default.** `restricted` evidence is hidden behind an explicit, logged reveal; it is never shown inline or embedded in exports by default.
9. **Early releases use the same language.** The self-contained HTML report (Release 0.1) uses these tokens, symbols and rules, so the dashboard adds navigation, not new semantics.
10. **Limits are stated, not hidden.** Every run view and report shows the audit-only limitation ("no intentional state-changing requests; server state not guaranteed unchanged"), the guard mode (`full` or "L1-ONLY PREVIEW — guard coverage incomplete"), and each artifact's redaction status. Encryption is shown separately and never as redaction.

Name usage: product "QA Sentinel"; short "Sentinel"; CLI `qa-sentinel`. Wordmark is plain text in the heading font until a logo is commissioned (open item).

## 2. Color

Tokens are CSS custom properties. Values are WCAG-checked (ratios computed against both `bg` and `surface`; all ≥ 4.5:1 for text, ≥ 3:1 for UI boundaries).

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--bg` | `#FFFFFF` | `#0B1020` | Page background |
| `--surface` | `#F6F7F9` | `#121A2E` | Cards, panels, table headers |
| `--border` | `#667085` | `#7C879E` | Control and focus-adjacent borders (UI ≥ 3:1) |
| `--text` | `#101828` | `#E6EAF2` | Primary text |
| `--text-muted` | `#475467` | `#A3ADC2` | Secondary text |
| `--primary` | `#1D4ED8` | `#7AA2FF` | Links, primary actions, focus ring |
| `--on-primary` | `#FFFFFF` | `#0B1020` | Text on primary fills |
| `--confirmed` | `#B42318` | `#FF8A80` | Confirmed defect, `failed` |
| `--suspected` | `#93370D` | `#FDB022` | Suspected risk |
| `--passed` | `#067647` | `#47CD89` | `passed`, `verified_fixed` |
| `--errored` | `#5925DC` | `#B692F6` | `errored` (could not complete) |
| `--info` | `#175CD3` | `#84CAFF` | Informational |
| `--neutral` | `#475467` | `#A3ADC2` | `skipped`, `not_run`, unknown |

Measured contrast (text token on `bg` / `surface`):
Light — text 17.75 / 16.56, muted 7.69 / 7.17, primary 6.70 / 6.25, confirmed 6.57 / 6.13, suspected 7.52 / 7.01, passed 5.69 / 5.31, errored 7.71 / 7.19, info 5.99 / 5.58, border 4.97 / 4.64.
Dark — text 15.70 / 14.36, muted 8.40 / 7.68, primary 7.61 / 6.96, confirmed 8.29 / 7.58, suspected 10.29 / 9.41, passed 9.34 / 8.54, errored 7.60 / 6.95, info 10.70 / 9.79, border 5.24 / 4.80.
On-primary: 6.70 (light), 7.61 (dark).

Themes follow `prefers-color-scheme` with a manual override. Color is never the only carrier of meaning (§8).

## 3. Typography

System fonts only (no network fonts): faster, private, no licensing.
- Sans: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
- Mono: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` (commands, hashes, selectors, logs)

| Role | Size / line height | Weight |
|------|--------------------|--------|
| Display (page title) | 28 / 36 | 600 |
| Heading | 20 / 28 | 600 |
| Subheading | 16 / 24 | 600 |
| Body | 14 / 22 | 400 |
| Small / meta | 12 / 18 | 400 |
| Mono | 13 / 20 | 400 |

Minimum body size 14px; text resizes to 200% without loss. Numbers in tables use tabular figures.

## 4. Spacing, layout, shape

- 4px base scale: `4, 8, 12, 16, 24, 32, 48`.
- Radius: `4` (controls), `8` (cards). Borders over shadows; one subtle shadow level for overlays.
- Layout: left sidebar (240px) + top bar + content max-width 1280px. Below 1024px the sidebar collapses to an icon rail; below 640px it becomes a menu. Tables become stacked rows on narrow screens.
- Minimum interactive target 24×24px (WCAG 2.2), 40px preferred for primary controls.
- Motion: ≤ 150ms, functional only; all motion disabled under `prefers-reduced-motion`.

## 5. Dashboard navigation

Left sidebar, in this order:

1. **Overview** — all targets at a glance: latest run per target, coverage, open confirmed findings.
2. **Targets** — profiles, scope, network policy, budgets, identity source, policy approval status and history.
3. **Runs** — history, filters, compare two runs.
4. **Findings** — list/detail with status and lifecycle filters.
5. **Verification** — fix claims and verification records.
6. **Evidence** — searchable artifacts (screenshots, redacted HAR-like data, and traces labelled NOT REDACTED) with class, redaction status, retention expiry, tombstones, and the evidence-event log (access, export, retention, tombstone).
7. **Grants & Policy** — policy decisions log, profile approvals, guard coverage history; requests and active grants appear from Release 1.0.
8. **Settings** — workspace, theme, retention defaults, encryption status, integrations, the Guarantee Register with assurance levels.

Top bar: target switcher, global search, **mode banner** (`AUDIT-ONLY` / `AUTHORIZED · scope · expires in 14:32`, and the guard-coverage state), theme toggle.

Key routes: `/`, `/targets/:id`, `/runs/:id`, `/runs/compare?a=&b=`, `/findings/:id`, `/verification/:id`, `/evidence/:hash`, `/grants`, `/settings`.

## 6. Components

Each component lists the information it must expose; styling follows the tokens.

- **FindingStatusBadge** — `Confirmed` (solid fill, filled-circle icon), `Suspected` (dashed outline, `?` icon), `Informational` (ghost, `i` icon). Always text + icon + shape.
- **OutcomeBadge** — `passed`, `failed`, `errored`, `skipped`, `not_run`. `not_run` and `skipped` use neutral hatching, never green.
- **SeverityPill** — critical / high / medium / low / none, text always present.
- **CoverageBar** — segmented bar of passed / failed / errored / skipped / not_run with counts; shown on every run card before any "healthy" language.
- **RunCard / RunTimeline** — build id, mode, manifest hash, duration, summary, step-by-step timeline with blocked-by-policy markers.
- **FindingRow / FindingDetail** — title, status, severity, lifecycle, first/last seen, reproductions (`k/k`), evidence list, repro spec link, event history.
- **EvidenceCard / EvidenceViewer** — thumbnail, kind, hash, redaction status badge (traces always "Not redacted"), download, trace viewer link for opt-in traces.
- **VerificationPanel** — claim (actor, build, commit), result, the **identity basis and confidence** (`target_reported` moderate — reported by the target, not proof · `operator_asserted` low — a statement · `surfaceFingerprint` low — fallback only; `independently_attested` reserved), always shown with the result and never as a bare "verified"; the gating checks (`freshContext`, `buildChanged` on the same basis) each with pass/fail/unknown and a short explanation of limits, plus the informational `sameActorAsClaim`.
- **AssuranceBadge** — Designed / Implemented / Tested / Independently verified, with text and a distinct shape per level; links to the Guarantee Register entry and the commit for Tested and above. Never colored as "success" below Tested.
- **GuardCoveragePanel** — the guard mode (`full` / `l1_only`), then per traffic class (WebSocket, WebRTC, service workers, downloads, proxy, schemes) `active`, `unavailable` or `untested`, with the run's `websocket-restricted` and "guard coverage incomplete" notices; in `l1_only` it shows "not equivalent to full mode" and AC-38 as not evaluated.
- **EvidenceClassBadge / RedactionBadge / RevealGate** — `public` vs `restricted`; a separate redaction badge (`redacted`, `partially redacted`, **`NOT REDACTED`** for traces and downloads) and a separate encryption lock; restricted items show retention expiry and a "Reveal" action that confirms and appends an access event.
- **TombstoneCard** — expired evidence: hash, kind, deletion time and reason, so a finding still shows that evidence existed.
- **PolicyApprovalDialog** — policy diff since the last approval, the approval's assurance level (L1 shown as "confirmation, not identity verification"), typed confirmation.
- **GrantBanner / GrantCard** — scope, classes, countdown, uses left, revoke; A3 uses a stronger visual treatment and typed confirmation.
- **CommandBlock** — monospace, copy button, shows the CLI equivalent.
- **DataTable** — sortable, filterable, keyboard navigable, sticky header, empty/loading/error states.
- **FilterBar, Tabs, Dialog, Toast, Tooltip, EmptyState, Skeleton, InlineAlert** — standard, accessible primitives (Radix-based).
- **DiffList (run compare)** — new / resolved / persisting findings with counts.

## 7. States

Every view defines all of these; none may be blank.

| State | Behavior |
|-------|----------|
| Loading | Skeletons matching final layout; no spinner-only screens |
| Empty | Explains why and offers the next action with its CLI command |
| Error | Plain-language cause, retry, and the log location |
| Running | Live progress (executed / total / not_run), `aria-live="polite"`, Abort button |
| Partial / Aborted | Prominent notice; unexecuted checks listed as `not_run` |
| Stale | Timestamp and "data may be outdated" when the API is unreachable |
| Policy-blocked | Shows the denied action, class, rule and that it was recorded |
| Policy changed / unapproved | Target shows "Policy changed — approval required"; runs are disabled with the reason and the approval command |
| Guard coverage incomplete | Banner on the run and its report; lists untested or unavailable traffic classes |
| L1-only preview | Persistent banner "L1-only preview — guard coverage incomplete; not equivalent to full mode"; no containment wording anywhere on the page |
| Evidence locked | Restricted artifact shown as locked with expiry and a Reveal action |
| Evidence expired | Tombstone card instead of a broken link |
| Inconclusive | Neutral treatment with explanation of why it could not be decided |
| Offline API | Dashboard remains readable from cached view and says so |

## 8. Status presentation rules (non-color cues)

| Meaning | Shape / icon | Border | Label |
|---------|--------------|--------|-------|
| Confirmed | filled circle ● | solid | "Confirmed" |
| Suspected | circle with ? | dashed | "Suspected" |
| Informational | circle with i | none | "Info" |
| passed | check ✓ | solid | "Passed" |
| failed | cross ✕ | solid | "Failed" |
| errored | triangle ⚠ | solid | "Errored" |
| skipped / not_run | dash – / hatched | dotted | "Skipped" / "Not run" |
| NOT REDACTED (artifact) | crossed-out eye | double border | "Not redacted" |
| encrypted (artifact) | closed lock | none | "Encrypted" (never implies redacted) |
| L1-only preview | hatched banner | dashed | "L1-only preview" |

CLI and reports use the same symbols with ASCII fallbacks (`[C]`, `[S]`, `[i]`, `[ok]`, `[x]`, `[!]`, `[-]`) and respect `NO_COLOR`.

## 9. Accessibility (WCAG 2.2 AA)

- Full keyboard operation; logical tab order; skip-to-content link; no keyboard traps.
- Visible focus: 2px `--primary` outline with 2px offset, ≥ 3:1 against adjacent colors.
- Semantic landmarks (`header`, `nav`, `main`), one `h1` per view, real `table` markup with headers and captions.
- All status and mode information has text and shape, not color alone.
- Live regions for run progress and toasts; focus moves to dialogs and returns on close.
- Text resizes to 200%, reflows at 320px width without horizontal scroll (data tables may scroll within their container).
- Respect `prefers-reduced-motion`, `prefers-color-scheme`, and `prefers-contrast`.
- Form fields have visible labels, associated errors, and no placeholder-only labeling.
- Screenshots and traces carry text alternatives (title, captured URL, timestamp, and step description).
- Automated axe check on core pages plus a manual keyboard and screen-reader pass before the Phase 5 dashboard sign-off (AC-17). The HTML report is held to the same criteria from Release 0.1 and has its own acceptance criterion (AC-42): automated axe pass with zero serious or critical violations, keyboard operability, no color-only meaning, the contrast values in §2, readability at 200% zoom and 320px width, legible printing, and a recorded manual keyboard and screen-reader pass.

## 10. Content and tone

- Plain, specific, neutral: "3 confirmed, 5 suspected, 12 checks not run" — never "Great job!" or "All clear!".
- A clean result reads: "No confirmed defects found by the 42 checks that ran. 12 checks did not run."
- Errors say what happened, what was affected, and what to do next.
- Destructive or authorizing dialogs state scope, class, expiry, and consequence, and require typed confirmation for A3.

## 11. HTML reports

Shipped in Release 0.1, before any dashboard. Self-contained single file (inlined CSS from these tokens, no external requests), print-friendly, same status vocabulary and symbols. A header block states mode, guard mode and coverage, target identity and its basis and confidence, policy hash, manifest hash, executed vs not-run counts, the audit-only limitation statement, and the assurance levels of the protections relied on. Only `public` evidence is embedded (thumbnails or hash links); `restricted` evidence appears as a locked reference, expired evidence as a tombstone, and each artifact shows its redaction status (traces are always "Not redacted"). Findings show their confirmation policy ceiling, attempts, flake rate and `stateDependent` flag. It meets AC-42.

## 12. Open design items

Logo and wordmark; icon set selection (a single open-license set); whether to ship a high-contrast theme in Phase 5; final empty-state illustrations (none planned).
<!-- END FILE: design_system.md -->

<!-- BEGIN FILE: architecture.md sha256=ee8fea3c4c24163c8087b4a8cf45191b984c56e75d528a2910cf679013f3e0d3 -->
# QA Sentinel — Architecture

> Status: Phase 0 draft, revision 3, pending approval. Implements the principles in `Brain.md`. Requirements: `prd.md`. Agent roles: `AGENT_ROLES.md`. Dashboard visuals: `design_system.md`. **Nothing here is implemented yet.**

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
`id, name, kind (web | api), baseUrls[], scope{allowedOrigins[], deniedPathPatterns[]}, network{…}, auth{profiles[{id, type: none|storageState|header|cookie, secretRefs}]}, identity{source: header|endpoint|meta|manual|surfaceFingerprint, key?, fingerprintUrls[], fingerprintIgnore[]}, verification{minIdentityBasis}, stateIsolation (none | declared-reset), evidence{class overrides, retention overrides, sensitiveSelectors[], traces}, limits{maxPages, maxRequests, maxDurationSec}, stackHints?`
`network` holds the policy-relevant switches (§7): `websocket (deny*|observe)`, `webrtc (deny*)`, `serviceWorkers (block*)`, `downloads (deny*|quarantine)`, `permissions (deny*)`, `schemes ([http, https]*)`, `readOnlyRequests[]`. (`*` = default.)
Secrets are **references** (environment variable names), never values. The **policy section** (scope, network, deniedPathPatterns, auth refs, limits, stateIsolation, verification) is hashed into `policyHash`.

**ProfileApproval** — human acknowledgement of a profile's policy section.
`id, profileId, policyHash, approvedBy{label, osUser, method (tty|dashboard), assurance (L1|L2)}, approvedAt, policyDiff`. A run requires an approval whose `policyHash` equals the profile's current `policyHash` (§7.6).

**TestSpec** — one check, declarative and stack-neutral.
`id, version, title, origin (builtin | authored | generated), steps[], assertions[], tags[], confirmation{maxStatus, k, match, isolation}, contentHash`
`generated` specs (post-MVP, from `ai-assist`) are capped at `suspected` until a human promotes them to `authored`.

**Run** — one execution of a plan.
`id, targetId, identity{basis, buildId?, commit?, surfaceFingerprint}, policyHash, profileApprovalId, mode (audit | authorized), guardMode (full | l1_only), grantId?, guardCoverage{websocket, webrtc, serviceWorkers, downloads, proxy, …}, status (completed | partial | aborted), startedAt, endedAt, manifest`
`manifest = {qaSentinelVersion, nodeVersion, playwrightVersion, browserName, browserVersion, os, profileHash, policyHash, specHashes[], seed, flags}`; `manifestHash` is stored. `guardMode` is `full` (L1+L2) or `l1_only` (explicit, labelled preview, §7.9). `guardCoverage` records, per traffic class, whether the guard was active and verified at run start (`active | unavailable | untested`); the report shows it.

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
| Downloads | **Denied** | `downloads: quarantine` (§7.4) |
| Browser permissions (camera, mic, geolocation, notifications, clipboard) | **Denied** | — |
| Popups / new windows | Allowed only to in-scope origins; context-level rules apply | — |
| Form submission (`POST` navigation) | Blocked (a non-safe method) | Grants (Phase 7) |

### 7.2 Layers

1. **L1 — in-browser guard.** A context-level request interceptor (`context.route`) installed before any page loads checks origin, scheme, method, path and body policy for every request, aborts violations, and records them. WebSocket routing, service-worker blocking, download denial and permission denial are configured on the same context.
2. **L2 — egress proxy.** The browser is launched with all traffic routed to a QA Sentinel loopback proxy (Node standard library) that refuses any destination not in `allowedOrigins` (host and port), including direct IPs and other ports. For HTTPS it sees only the destination (CONNECT), not the method, so **method enforcement stays in L1**; L2 provides a browser-wide default-deny on destinations that does not depend on Playwright routing, which covers service workers, worker-originated requests and anything routing misses at the TCP level. Chromium bypasses proxies for loopback by default, so loopback targets need the bypass override. These details are to be confirmed in the Phase 2 spike. Chromium may also use QUIC/HTTP3 over UDP, which a TCP proxy does not see; QUIC is disabled at launch (to be verified by AC-39 and AC-38). **Acceptance gate:** L2 counts toward Release 0.1's containment claim only if it passes AC-39 and AC-38. If it does not, there is no unqualified Release 0.1: only a clearly labelled **0.1-preview** in L1-only mode may be released, with incomplete guard coverage reported and no equivalent-containment claim (§7.9).
3. **L3 — OS isolation (optional, post-MVP).** Run the browser in a container or network namespace or as a dedicated OS user with an egress firewall allowlist. Recommended for authorized (A2/A3) runs against non-local targets and for high-assurance use.

Each layer is independent: a gap in one is meant to be caught by another, and the run report lists which layers were active.

### 7.3 WebSockets and WebRTC

- **WebSockets: denied by default.** The L1 WebSocket route closes any connection immediately (policy-violation close code) without contacting the server, and records it. Playwright's docs confirm a handler can close a socket without connecting.
- Client-to-server WebSocket frames cannot be classified as read-only from outside, so audit mode never forwards them. The alternative `websocket: observe` connects to an in-scope origin, forwards **server→page** frames, **drops and records every page→server frame**, and marks the run `websocket-restricted`. Apps whose rendering depends on sending frames will be partly untestable in audit mode; that limitation is reported, not hidden.
- **WebRTC: denied.** Defense in depth: constructors for peer connections and data channels are removed by an init script in every frame; the browser is launched with its WebRTC IP-handling policy set to disable non-proxied UDP. Playwright has no routing for WebRTC, so this protection rests on those two measures and on L2/L3; its effectiveness is **unproven** until tested (AC-23).
- Worker-originated WebSockets are not documented as covered by Playwright routing. Until tested, the run's `guardCoverage.websocket` reads `untested` for workers, and the report says so.
- A candidate additional measure evaluated in the spike: injecting a restrictive `Content-Security-Policy` (`connect-src`, `worker-src`) into in-scope responses. It would alter target behavior, so it is opt-in per profile if used at all.

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

In the default `full` guard mode every required layer (L1 and L2) must install and pass the start-of-run self-check (a probe request to an out-of-scope origin, a probe non-safe request, a probe WebSocket, a probe to a non-proxied destination). If any fails, the run ends `errored`; **it never silently downgrades**. `l1_only` is selected only by the explicit option `--guard l1-only`, is recorded in the manifest, and is used for the labelled preview (§7.9). In either mode, a traffic class that is unavailable or untested is recorded in `guardCoverage` and the report prints "guard coverage incomplete". A run is never described as contained unless its mode is `full` **and** the Guarantee Register shows the relevant entries Tested; reports print the register's assurance levels.

### 7.8 Known limits

- Audit-only is not a state-immutability guarantee (§5.1): `GET` side effects, `Set-Cookie` sessions, approved read-only POST rules and server background work can change server state. `deniedPathPatterns` reduce but cannot remove the risk, and every report states the limitation.
- Blocking `POST` means login forms cannot be used in audit mode; authentication uses a pre-provisioned session (Q-04).

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
| Dedicated/shared worker HTTP requests | L1 coverage **unverified** | L2 destination refusal (host and port only) | AC-06, AC-22, AC-39 |
| WebSocket opened from a page | L1 close-without-connect | same (L2 cannot see frames or TLS upgrades) | AC-22 |
| WebSocket opened from a worker | L1 coverage **unverified** | L2 destination refusal only | AC-22 |
| WebRTC, UDP, QUIC | L1 init script (page frames only) plus browser WebRTC policy | L2 does not carry UDP; QUIC disabled at launch | AC-23, AC-38, AC-39 |
| Downloads | L1 option | — | AC-24 |
| Browser permissions and non-HTTP(S) schemes | L1 | — | AC-21 |
| DNS and any other non-proxied outbound connection | **not controlled** | L2 forces proxying; verified by independent observation | AC-38 |
| Method enforcement over HTTPS | L1 only (L2 sees the destination, not the method) | same | AC-05 |

In `l1_only` mode the following are **not claimable at all**: that outbound traffic is restricted (AC-38), that workers, DNS or non-proxied traffic are controlled, and equivalence with `full` mode. In `full` mode a class is claimable only after its test is Tested; classes with unverified coverage stay `untested` in `guardCoverage`.

**AC-38 evidence rule.** Outbound traffic must be observed at a layer **independent of the guard** (OS-level socket or packet observation covering TCP, UDP, QUIC and DNS, for every process the run starts) while the fixture exercises each class adversarially. Guard logs alone are not evidence. If no such observation exists, AC-38 is not passed.

## 8. Data flows

**Audit**
1. `qa-sentinel audit <target>` → Orchestrator loads the profile and checks the `ProfileApproval` against `policyHash`.
2. Start-of-run guard self-check (§7.7); `guardCoverage` is recorded.
3. Profiler performs a bounded, scope-limited discovery.
4. Planner selects check packs and authored specs → TestSpecs.
5. Guardian pre-checks the plan (classes vs mode, budgets). Over-class specs are rejected with a recorded reason, not downgraded silently.
6. Executor runs each spec under L1/L2 → ExecutionRecords + Evidence (redacted before hashing, §11).
7. Analyst derives candidate findings, deduplicates by fingerprint, runs confirmation per the check's policy (§6).
8. Reporter renders reports (JSON canonical, Markdown, self-contained HTML) into `reports/<runId>/`.
9. Orchestrator closes the Run with a summary including `not_run`, guard coverage and identity basis.

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
| `redacted` | All configured redaction rules were applied. This is **not** proof that nothing sensitive remains | Captured request/response data, console logs, reports |
| `partially_redacted` | Only masking or value-dropping was applied; other content is unmodified | Screenshots (masked selectors only), DOM captures (input values dropped) |
| `not_redacted` | No reliable redaction exists | **Traces**, quarantined downloads, any raw capture |

Secret-removal claims and acceptance criteria (AC-19, AC-32) apply only to the database, logs, reports and artifacts labelled `redacted` or `partially_redacted`, and only within the documented rules. They make **no claim** about `not_redacted` artifacts, and no report may state or imply that such artifacts are free of secrets.

**Capture minimization.** Store only what supports a finding or the run record: response bodies only for failing assertions (size-capped), DOM snapshots only for failing checks, screenshots only on failure or at declared checkpoints. **Traces are off by default for every run.**

**Classification.** `public` = from runs with no auth profile; `restricted` = anything from an authenticated run, all traces, all downloads, and anything the profile marks sensitive.

**Redaction (applied where reliable, before hashing; the stored hash is of the stored content).**
1. Headers: store values only for an allowlist; all others keep the name with the value removed. Cookies and `Set-Cookie` values are always removed.
2. URL query values are removed by default for names matching secret-like patterns and any names the profile lists.
3. JSON/form body fields are removed by configured paths.
4. **Exact-value scrubbing:** every resolved secret value (from the profile's environment references), and its URL-encoded and base64 forms, is removed from every `redacted` or `partially_redacted` artifact, log and report.
5. Screenshots mask `sensitiveSelectors`; DOM captures drop input values.
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
- Exit codes: `0` ok / nothing at or above `--fail-on`; `1` findings at or above `--fail-on`; `2` usage or configuration error; `3` denied by policy; `4` runtime error or partial run.
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
| **0.1 Audit CLI** | 1–3 | Profiles + policy lock; audit mode in **`full` guard mode (L1+L2)** with AC-38 and AC-39 passed; check packs; findings with confirmation policies; evidence lifecycle; JSON/Markdown/accessible HTML reports; run history and compare; `--json` contract and CI exit codes (CI needs a pre-approved workspace); Claude Code command kit; fixtures that validate it | Dashboard, MCP, verification, grants, any modifying action, authenticated traces |
| 0.1-preview (**only if L2 fails AC-39**) | 1–3 | The same functionality in `l1_only` mode, labelled "preview: guard coverage incomplete" | Everything excluded from 0.1, **plus any containment or outbound-traffic claim**; AC-38 shown as *not evaluated* |
| **0.2 Fix verification** | 4 | `claim-fix`, `verify`, identity bases with confidence | Dashboard, MCP, grants |
| **0.3 Dashboard** | 5 | Local dashboard and API | MCP, grants |
| **0.4 Integrations** | 6 | MCP adapter, other-tool adapters, CI polish | Grants |
| **1.0 Authorization** | 7 | Grants, A2/A3 under human approval; the engine stays AI-free | — |
| Post-1.0 | 8 | More target kinds, plugin interface, L2 approvals, L3 isolation guidance, optional `ai-assist`, possible authenticated-trace strategy | — |

**What an unqualified Release 0.1 requires.** L2 passes AC-39; AC-38 is passed with independent observation (§7.9); each containment claim is limited to traffic classes whose register entries are Tested; every other 0.1 acceptance criterion in `prd.md` §8 passes with a recorded run. The decision between 0.1 and 0.1-preview is made at the end of Phase 2 from the spike result and recorded as a decision.

**If L2 fails.** There is no unqualified Release 0.1. A **0.1-preview** may ship in `l1_only` mode only if every report, CLI summary and JSON result says so (AC-44), claims no containment or outbound restriction, and shows AC-38 as not evaluated. It may not be described as equivalent to full mode. Nothing here weakens the 0.1 criteria to make them easier to pass.

**0.1 is usable on its own.** A developer registers a target, approves its policy, runs an audit from a terminal or from Claude Code commands, and gets a report whose every claim links to (possibly tombstoned) evidence and which states the audit-only limitation, guard mode and coverage. Because grants ship only in 1.0, Releases 0.1–0.4 contain no code path that allows a non-safe request other than profile-approved read-only entries.

## 18. Guarantee Register

Assurance as of this revision. "Needed for Tested" lists the acceptance criteria in `prd.md` that must pass with a recorded run; "Independently verified" additionally needs a written independent review against a pinned commit. Containment-related claims apply to `full` guard mode only; `l1_only` makes none (§7.9).

| ID | Claim (may be made only when proven) | Assurance | Needed for Tested |
|----|--------------------------------------|-----------|-------------------|
| GR-01 | Audit mode blocks non-safe HTTP methods for browser requests the guard sees | Designed | AC-05 |
| GR-02 | Requests outside `allowedOrigins`, including redirects, are blocked (`full` mode) | Designed | AC-06, AC-39 |
| GR-03 | Non-HTTP(S) schemes are blocked and browser permissions are denied | Designed | AC-21 |
| GR-04 | WebSockets are denied by default (page and worker origin) | Designed | AC-22 |
| GR-05 | Service workers cannot bypass routing | Designed | AC-22 |
| GR-06 | WebRTC, UDP and QUIC cannot reach the network (`full` mode) | Designed | AC-23, AC-38, AC-39 |
| GR-07 | Downloads are denied or quarantined, never executed | Designed | AC-24 |
| GR-08 | Only parsed read-only POST requests matching an approved rule pass | Designed | AC-25 |
| GR-09 | A run cannot start on a changed policy without human approval; a fresh CI workspace is refused | Designed | AC-26, AC-45 |
| GR-10 | Guard failure fails closed in `full` mode with no silent downgrade; untested coverage is reported | Designed | AC-27 |
| GR-11 | `passed` exists only for executed checks | Designed | AC-04 |
| GR-12 | AI cannot influence outcomes or run in the engine | Designed | AC-15, AC-28 |
| GR-13 | `confirmed` follows the check's confirmation policy and ceiling | Designed | AC-07, AC-08, AC-29 |
| GR-14 | `verified_fixed` requires a same-basis identity change and a passing frozen repro, and is reported with its basis and confidence | Designed | AC-12, AC-13, AC-30 |
| GR-15 | History tables resist update/delete; chains are tamper-evident; tombstones are append-only | Designed | AC-31, AC-43 |
| GR-16 | Secrets and redaction-configured fields are absent from the database, logs, reports and artifacts labelled `redacted` or `partially_redacted` (within documented limits). **Excludes `not_redacted` artifacts such as traces and downloads, about which no secret-removal claim is made** | Designed | AC-19, AC-32 |
| GR-17 | `restricted` evidence is encrypted at rest. This is a storage claim and **not** a redaction claim | Designed | AC-33 |
| GR-18 | Retention, purge and tombstones behave as specified | Designed | AC-34, AC-43 |
| GR-19 | Restricted evidence is not exported without human confirmation | Designed | AC-35 |
| GR-20 | Dashboard/API reachable only locally with token and CSRF | Designed | AC-17, AC-36 |
| GR-21 | Grants are scoped, expiring, revocable and audited | Designed | AC-10, AC-11, AC-37 |
| GR-22 | Agents cannot approve grants or profile policy through adapters | Designed | AC-10, AC-16, AC-26 |
| GR-23 | A same-user process cannot forge approvals | **Not claimed** (L1 does not resist this) | — (needs L2) |
| GR-24 | Runs are reproducible from the manifest | Designed | AC-09 |
| GR-25 | No QA Sentinel process contacts anything except the in-scope target and loopback during an audit, observed independently of the guard (`full` mode only; **not claimable in `l1_only`**) | Designed | AC-38 |
| GR-26 | Authenticated traces are not captured in Release 0.1; unauthenticated opt-in traces are labelled `not_redacted` | Designed | AC-40 |
| GR-27 | Reports state the audit-only limitation and never imply state immutability | Designed | AC-41 |
| GR-28 | Identity basis and confidence are reported accurately; `target_reported` is never described as attested | Designed | AC-30 |
| GR-29 | `l1_only` runs are labelled preview, make no containment claim, and show AC-38 as not evaluated | Designed | AC-44 |
| GR-30 | The self-contained HTML report meets the accessibility criteria | Designed | AC-42 |

No entry is Implemented, Tested or Independently verified. Nothing in this register may be raised without recorded execution evidence.

## 19. Extensibility

New runner → implement `Runner`. New target kind (API contract, mobile, CLI) → new profile `kind` + runner. Stack-specific discovery hints → optional profile plugins that never relax policy. New AI tool → thin adapter over the CLI/JSON or MCP contract. AI assistance → `ai-assist` proposals only.

## 20. Feasibility notes and unproven items

- Playwright request interception, tracing, per-context isolation, screenshot masking, service-worker blocking and WebSocket close-without-connect are documented features. Their behavior against our guarantees is untested.
- **Unproven:** worker-originated WebSockets and requests; `sendBeacon` routing; WebRTC suppression; Chromium proxy flags (loopback bypass, WebRTC policy); the L2 proxy against HTTPS targets; CSP injection side effects; redaction completeness; confirmation behavior on flaky targets; fingerprint stability.
- `node:sqlite` loads on this machine's Node v24.21.0; its stability for our use is unassessed (Phase 1 spike). Registry versions seen on 2026-11-16: playwright 1.65.1, @axe-core/playwright 4.14.0, better-sqlite3 13.2.0, zod 4.6.7, hono 4.13.18, vitest 5.1.0; pinned in Phase 1, nothing installed now.
- Fresh browser contexts isolate client state only; server state is shared (§6.3).
- Audit-only authentication needs a pre-provisioned session; scale is single-machine, one run at a time.
- **Unproven or open from reviews 2 and 3:** keychain access through `security`/`secret-tool` subprocesses (availability on headless Linux/CI); the L2 proxy on HTTPS targets, loopback bypass and QUIC suppression (AC-39); how to observe all outbound traffic independently of the guard for AC-38 (tooling per OS is undecided, Q-25); whether encryption at rest (AC-33) is achievable without a native dependency; CI approval of profile policy (Q-16); any tested strategy for authenticated traces (Q-26).
- **Identity limits:** `target_reported` is not cryptographic proof, `operator_asserted` is a statement, and `surfaceFingerprint` cannot see backend-only changes; no independent attestation mechanism exists (`independently_attested` is reserved, Q-27).
- **Audit-only limits:** `GET` side effects, `Set-Cookie` sessions and approved read-only POST rules can change server state (§5.1); this is a known, reported limitation, not an open defect.
<!-- END FILE: architecture.md -->

<!-- BEGIN FILE: AGENT_ROLES.md sha256=19dae9d5e93c31b3fbda519572b8fd92362cc14c20cd41947f87552b413af286 -->
# QA Sentinel — Agent Roles

> Status: Phase 0 draft, revision 3, pending approval. This is a **product design document** about the roles *inside* QA Sentinel. It is deliberately **not** named `AGENTS.md` (some AI coding tools auto-load that name as instructions). It is not instructions for any AI tool working in this repository.
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
- **Boundaries:** cannot raise an action class, create approvals or grants, or mark outcomes. On budget exhaustion it stops and records `partial`.

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
- **Boundaries:** blocked requests are aborted and recorded (`blockedByPolicy`), never retried differently. Marks a spec `not_run` if it did not execute and `errored` if infrastructure failed — never `passed`. If a required guard layer cannot be installed or fails its self-check, a `full`-mode run ends `errored` (it never silently downgrades to `l1_only`).

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
- **Boundaries:** displays the status vocabulary exactly, executed vs `not_run` counts, the checks that ran, guard mode and coverage, the audit-only limitation statement, each result's identity basis and confidence, each artifact's redaction status (never calling a trace redacted) and the assurance caveat; embeds only `public` evidence; never states a pass for a check without an execution record. Exporting `restricted` evidence needs a human-confirmed flag.

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
- Any anomaly in policy enforcement aborts the run with `errored`; it never proceeds unguarded, and untested coverage is reported as such.

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
<!-- END FILE: AGENT_ROLES.md -->

<!-- BEGIN FILE: PHASE_0_CHECKLIST.md sha256=e28bffc18915e98fc362e83515c49ecf4b641ed2d0558b33a8a2c38e0a9691bd -->
# QA Sentinel — Phase 0 Checklist

> Tracks decisions, completed work, open questions, risks and approvals for Phase 0 (foundation documents).
> **Phase 0 status: revision 3 written and cross-reviewed. NOT approved. Phase 1 has not started and must not start until you approve Phase 0 and then a Phase 1 plan. No code, dependencies, git repository or target connection exists.**
> Last updated: 2026-11-16 (revision 3, after the second independent review).

**Status legend:** ✅ done · 🟡 proposed (written, awaiting your approval) · 🔬 needs a spike in a later phase · ❓ open question · ⛔ blocked / not allowed yet
**Assurance vocabulary:** Designed (documented only) · Implemented (code exists) · Tested (passing automated tests against a recorded commit) · Independently verified (independent review against a pinned commit). See `architecture.md` §0. **Nothing is above Designed.**

## 1. Deliverables

| # | File | Written | Cross-reviewed (rev. 3) | Approved |
|---|------|---------|-------------------------|----------|
| 1 | `Brain.md` | ✅ (edited) | ✅ | ⛔ awaiting you |
| 2 | `prd.md` | ✅ (edited) | ✅ | ⛔ awaiting you |
| 3 | `design_system.md` | ✅ (edited) | ✅ | ⛔ awaiting you |
| 4 | `architecture.md` | ✅ (edited; new §5.1, §7.9; §10, §11, §17, §18 rewritten) | ✅ | ⛔ awaiting you |
| 5 | `AGENT_ROLES.md` | ✅ (edited) | ✅ | ⛔ awaiting you |
| 6 | `PHASE_0_CHECKLIST.md` | ✅ (rewritten) | ✅ | ⛔ awaiting you |
| — | `README.md` | ✅ (status line) | ✅ | — |
| — | `PHASE_0_REVIEW_BUNDLE.md` (revision 3 bundle; not a deliverable) | ✅ | — | — |

## 2. Revision 3: before/after change summary

| Review finding | Before (revision 2) | After (revision 3) |
|----------------|---------------------|--------------------|
| **1. L1/L2 vs Release 0.1** | Release 0.1 could ship L1-only with a reported gap; AC-27/38 and Q-23 left this ambiguous, and AC-38 ("only the target is contacted") could pass on guard logs | Unqualified **Release 0.1 requires L2 to pass AC-39 and AC-38**. If L2 fails, only a labelled **0.1-preview** (`l1_only`) may exist: no containment claim, "guard coverage incomplete", AC-38 shown as *not evaluated*. New §7.9 lists exactly which traffic classes are guarded and tested in each mode. AC-38 needs OS-level observation independent of the guard. New AC-39, AC-44. Q-23 resolved by D-36 |
| **2. Evidence and traces** | Traces "off for authenticated runs unless enabled" while FR-061/AC-32 implied secrets removed; "restricted" and "encrypted" blurred with "redacted" | **Traces are off by default for every run; authenticated traces are refused in Release 0.1.** New `redactionStatus` (`redacted` / `partially_redacted` / `not_redacted`, traces always `not_redacted`). Encryption at rest is explicitly **not** redaction. AC-19/32 apply only to artifacts labelled redacted/partially_redacted and say so; AC-33 is a storage claim only; new AC-40 |
| **3. Audit-only definition** | "No mutations", "server state the same" | Audit-only = **no intentional, known state-changing actions**, explicitly not state immutability. New architecture §5.1 explains GET side effects, `Set-Cookie`, approved read-only POST side effects, background work; every report carries the statement (FR-024, AC-41); Brain principle 5, FR-010, §6.3, §7.8 reconciled |
| **4. Build identity terms** | `target_attested` / "strong" | Renamed **`target_reported`** (moderate; *not* cryptographic proof); `operator_asserted` low; `surfaceFingerprint` low, fallback only; `independently_attested` reserved. Every result shows basis and confidence; default `minIdentityBasis` = `target_reported` and is part of the approved policy; FR-052–055, AC-12/30 updated; Q-20 updated |
| **5a. design_system CLI name** | `sentinel` | `qa-sentinel` |
| **5b. HTML report accessibility** | Only the dashboard had an a11y criterion (AC-17, Release 0.3) | **AC-42** for the self-contained HTML report in Release 0.1; GR-30 |
| **5c. CI approval** | "Unresolved (Q-16)" | **CI requires a pre-approved workspace**; fresh CI workspace is refused (AC-45); mechanism remains open (Q-16) |
| **5d. Tombstones** | Evidence record had a mutable `tombstone?` field | Evidence rows are immutable; history is an append-only, hash-chained **evidence event** log (`created`, `accessed`, `exported`, `retention_extended`, `tombstoned`); deletion removes only artifact bytes; AC-43 |
| **6. Registers and review** | 25 register entries; 21 risks | **30** register entries (29 Designed, 1 not claimed); decisions D-36 to D-43 added; risks R-22 to R-25 added; 45 acceptance criteria; fresh cross-review below |

## 3. Decision register

"Proposed" = written into the documents, not approved by you. *Directive* = from your instructions. Superseded entries keep their ID.

| ID | Decision | Selected | Alternatives | Reason | Consequences | Status |
|----|----------|----------|--------------|--------|--------------|--------|
| D-01 | Product independence | Standalone; no real target; synthetic fixtures only | Build against a first real app | Reusable product; no hidden coupling | Needs purpose-built fixtures (Q-11) | ✅ directive |
| D-02 | Stack | Node.js + TypeScript (strict), Playwright | Python, Go | Directive; one language across CLI/API/UI | Playwright browser downloads needed | ✅ directive |
| D-03 | Automation API | Playwright **library** in our runner | Playwright Test, Cypress, Selenium, Puppeteer | Control of records, guard, "never claim passed" | Rebuild retries/reporting | 🟡 |
| D-04 | Spec format | Declarative JSON/YAML steps and assertions | TS scripts, Gherkin | Classifiable, hashable, freezable | Schema not yet designed | 🟡 |
| D-05 | Store | SQLite + content-addressed files; driver by spike | Postgres, JSON files | Local-first, queryable | Append-only via triggers (not tamper-proof) | 🟡 🔬 P1 |
| D-06 | Monorepo | npm workspaces | pnpm, Turborepo | No extra tool | Looser isolation | 🟡 |
| D-07 | Schemas | zod + JSON Schema export | TypeBox/Ajv | Ergonomic single source | Export fidelity unverified | 🟡 |
| D-08 | CLI / API libs | commander / Hono (provisional) | parseArgs, yargs, Fastify | Small, common | Low impact | 🟡 |
| D-09 | Dashboard stack | Deferred to Phase 5 spike: React+Vite vs HTMX | Next.js, SvelteKit | Resolves NFR-011 tension; early releases need none | Postponed | 🟡 |
| D-10 | Integration | Versioned CLI `--json` + MCP; Claude Code first | Vendor SDKs | Core independent of any AI tool | JSON output is a public API | 🟡 |
| D-11 | Audit baseline | Default-deny; A0–A1; safe methods; approved read-only POST rules; layered guard in two modes (D-21, D-36); audit-only defined by D-39 | Per-spec allowlist | Enforced independent of specs | Auth needs pre-provisioned session; side effects remain | 🟡 (revised) |
| D-12 | Confirmation | **Superseded by D-26** | — | — | — | superseded |
| D-13 | Verification gating | **Superseded by D-27/D-40** | — | — | — | superseded |
| D-14 | Grants human-only | **Refined by D-25** | — | — | — | refined |
| D-15 | MVP scope | MVP complete = Release 1.0; Release 0.1 first usable **and requires full guard mode (AC-38, AC-39)** | Audit-only MVP after Phase 3 | Brief requires authorization and verification; early value via D-29 | Long runway; preview only if L2 fails | 🟡 (revised) |
| D-16 | Roadmap | Phases 0–8 per `Brain.md` §5 | Fewer, larger phases | Distinct approval points | Scope-creep risk R-06 | 🟡 |
| D-17 | AI in MVP | None; see D-30 | LLM-first | Deterministic | No natural-language specs | 🟡 |
| D-18 | Data location | `data/` in repo (gitignored, `QA_SENTINEL_HOME`), profiles in `config/targets/` | `~/.qa-sentinel` | Self-contained | Risk of committing evidence | 🟡 |
| D-19 | Design system | System fonts, WCAG-checked tokens, visible mode/coverage/assurance/limits | Brand fonts, kit | Private, accessible | Plain look | 🟡 |
| D-20 | `agents.md` name | **Superseded by D-35** | — | — | — | superseded |
| D-21 | Network isolation layers | L1 in-browser guard; L2 loopback egress proxy; L3 optional OS isolation. **L2 must pass AC-39 and AC-38 for the unqualified Release 0.1** | L1 only; MITM proxy; firewall only | Independent layers | L2 unproven for HTTPS, QUIC, loopback; fallback is a labelled preview, not 0.1 | 🟡 🔬 P2 (revised) |
| D-22 | Default-deny set | Origins, schemes, methods, WebSocket, WebRTC, service workers, downloads, permissions denied by default | Allow-then-block | Safer defaults | WebSocket apps partly untestable (R-21) | 🟡 |
| D-23 | Read-only POST | Profile-listed rules, parsed bodies, in `policyHash` | Block all POST | Enables GraphQL | Needs human attestation; server side effects possible (D-39) | 🟡 |
| D-24 | Profile policy lock | `policyHash` + human `ProfileApproval` before any run | Trust profile files | Stops silent widening | Friction; CI see D-42 | 🟡 |
| D-25 | Authorization assurance | L1 TTY/dashboard confirmation, **not identity proof**; L2 post-1.0; grants bound to `policyHash` | Treat TTY as proof | Honest threat model | L1 does not resist same-user malware | 🟡 |
| D-26 | Confirmation policy | Per-check ceilings, k, signatures, intermittent handling, client-only isolation | Single global rule | Honest per check | Signatures per check | 🟡 |
| D-27 | Verification identity | **Renamed and refined by D-40** | — | — | — | refined |
| D-28 | Evidence lifecycle | Minimize → classify → redact where reliable → label → encrypt restricted → retain → tombstone → export limits (details D-37, D-38, D-41) | Store everything | Privacy first | Key handling (Q-18) | 🟡 |
| D-29 | Release train | 0.1 Audit CLI; 0.2 verification; 0.3 dashboard; 0.4 adapters; 1.0 authorization last | Original order | Early usable audit-only release | Guard/policy must anticipate grants (R-17) | 🟡 |
| D-30 | AI independence | Engine has no AI dependency (mechanically checked); AI only emits `Proposal`s; generated specs capped at `suspected` | Models in planner/analyst | Directive | No AI features in MVP | 🟡 directive |
| D-31 | Assurance vocabulary | Designed / Implemented / Tested / Independently verified; Guarantee Register (30 entries); "guarantee" only at Tested+ | Informal claims | Directive | Upkeep | 🟡 directive |
| D-32 | Distribution and license | Private; `UNLICENSED` until owner decides | MIT/Apache-2.0 | Safe default | Not shareable (Q-01) | 🟡 |
| D-33 | CLI binary name | `qa-sentinel` everywhere (including `design_system.md`) | `sentinel`, `qas` | Avoids npm name clash | Longer to type | 🟡 |
| D-34 | NFR-011 scope | Minimal deps for core/CLI/runner/reporter; dashboard deps isolated | Blanket rule | Honest | Separate supply chain | 🟡 |
| D-35 | Roles document name | `AGENT_ROLES.md` | Keep `agents.md`; add `CLAUDE.md` | Avoids `AGENTS.md` auto-load | Fresh-session check pending (R-07) | ✅ directive |
| D-36 | Guard modes and release labelling | `full` (L1+L2, default) vs `l1_only` (explicit `--guard l1-only`); unqualified 0.1 requires `full` with AC-38/39 passed; otherwise a **0.1-preview** that claims no containment; no silent downgrade; traffic-class coverage table in `architecture.md` §7.9 | Ship 0.1 L1-only with a footnote; make L2 optional | Directive from review: no equivalent-containment claim without tests | Possible delay or preview-only release; AC-38 needs independent OS-level observation (Q-25) | 🟡 directive |
| D-37 | Traces | Off by default for every run; `--trace` opt-in; **authenticated traces refused in Release 0.1**; unauthenticated opt-in traces `restricted`, `not_redacted`, encrypted, 7 days, never exported | Traces on failure; claim redaction of traces | Traces cannot be reliably redacted | Less debugging data on authenticated targets (R-24); tested handling strategy needed before ever enabling (Q-26) | 🟡 directive |
| D-38 | Redaction vs encryption | Separate `redactionStatus` and `encrypted`; secret-removal claims (AC-19/32, GR-16) cover only `redacted`/`partially_redacted` artifacts, DB, logs, reports; AC-33 is storage-only | One combined "protected" notion | Prevent false assurance | More labels to maintain and display | 🟡 directive |
| D-39 | Audit-only definition | No intentional, known state-changing actions; **not** state immutability; GET side effects, Set-Cookie sessions, read-only POST side effects, background work stated; every report carries the statement | "No mutations" wording | Accurate; avoids overclaiming | Users must read the limitation; fixture needs a state-changing GET (AC-41) | 🟡 directive |
| D-40 | Build identity bases | `independently_attested` (reserved), `target_reported` (moderate, not proof), `operator_asserted` (low), `surfaceFingerprint` (low, fallback); default `minIdentityBasis` = `target_reported` in policy; result always shows basis and confidence | "Attested" naming; fingerprint-first | Honest strength; prefers explicit identity | Many results `inconclusive` unless target reports a build id | 🟡 directive |
| D-41 | Evidence history | Evidence rows immutable; append-only, hash-chained evidence events; tombstone = event + artifact byte deletion only | Mutable `tombstone` field; row deletion | No silent mutation of history | More tables/logic; `doctor` checks chains | 🟡 directive |
| D-42 | CI approval (interim) | CI requires a pre-approved workspace; fresh CI workspace refused (AC-45); no bypass | Committed approval file now | Safe until a reviewed mechanism exists | Limits CI adoption (R-19); mechanism open (Q-16) | 🟡 directive |
| D-43 | HTML report accessibility | AC-42 in Release 0.1: axe, keyboard, no color-only meaning, contrast, zoom/reflow, print, manual SR pass | Test only the dashboard | Report ships a release earlier than the dashboard | Extra test fixtures | 🟡 directive |

## 4. Review gaps G-01 to G-16 and their resolution

All resolutions are **Designed**; none is Implemented or Tested.

| Gap | Resolution | Where |
|-----|------------|-------|
| G-01 WebSocket audit policy | Denied by default; optional `observe` forwards server→page only | architecture §7.3; D-22 |
| G-02 Read-only POST | Parsed, human-approved rules; GraphQL queries only | architecture §7.5; D-23 |
| G-03 Per-check status ceiling | `maxStatus` per check | architecture §6.1; D-26 |
| G-04 Failure matching | Normalized signature equality; differing/errored attempts defined | architecture §6.2 |
| G-05 Fingerprint normalization | Normalized HTML + asset content hashes; fallback only, low confidence | architecture §10; D-40 |
| G-06 Grant lifetime and revocation | Defaults, ceilings, per-request revocation check | architecture §9; D-25 |
| G-07 Exact secret scrubbing | Resolved values and encoded forms removed from redacted artifacts, logs, reports | architecture §11 |
| G-08 Windows permissions | POSIX claims not made on Windows; restricted capture needs app-level encryption | architecture §11 |
| G-09 Dashboard vs minimal dependencies | NFR-011 scoped; dashboard deferred and isolated | prd NFR-011; D-09, D-34 |
| G-10 Distribution and license | Private, `UNLICENSED` default | architecture §15; D-32 |
| G-11 Binary name | `qa-sentinel` everywhere | all docs; D-33 |
| G-12 `agents.md` auto-load | Renamed to `AGENT_ROLES.md`; references updated | D-35 |
| G-13 CI cannot approve policy | Interim: CI requires a pre-approved workspace, fresh workspace refused; reviewed mechanism still **open** | architecture §7.6; D-42; Q-16 |
| G-14 L2 proxy may be infeasible | **Revised in rev. 3:** no longer a footnote fallback. Failure means no unqualified 0.1, only a labelled preview | architecture §7.2, §7.9, §17; D-36 |
| G-15 No built-in keychain API | Caveat added; **open** | architecture §11, §20; Q-18 |
| G-16 Retention could extend sensitive traces | 180-day cap; traces and downloads never extended | architecture §11; FR-065 |

**Review 3 findings (F3-n) and status**

| Finding | Status |
|---------|--------|
| F3-1 L1/L2 release contradiction | Resolved in documents (D-36); L2 itself **unproven** |
| F3-2 Evidence and trace contradiction | Resolved (D-37, D-38); no trace-handling strategy exists (Q-26) |
| F3-3 Audit-only definition | Resolved (D-39) |
| F3-4 Build identity terminology | Resolved (D-40); no independent attestation exists (Q-27) |
| F3-5a design_system CLI name | Resolved |
| F3-5b HTML report accessibility AC | Resolved (AC-42, D-43) |
| F3-5c CI pre-approved workspace | Resolved as interim (D-42); mechanism **open** (Q-16) |
| F3-5d Append-only tombstones | Resolved (D-41, AC-43) |

## 5. Work completed in revision 3

- ✅ L1/L2 reconciliation across PRD FR-015/016/019, architecture §7.2/§7.7/§7.9/§17, AC-27/38/39/44, Q-23.
- ✅ Evidence/trace reconciliation across FR-060–065, AC-19/32/33/40, architecture §11 and the register.
- ✅ Audit-only definition across Brain principle 5, FR-010/024, architecture §5.1/§6.3/§7.8, AC-05/41.
- ✅ Identity terminology across architecture §4/§10, FR-052–055, AC-12/30, design_system, AGENT_ROLES, Q-20.
- ✅ design_system CLI name, HTML report accessibility criterion, CI wording, append-only evidence events.
- ✅ Decision register (D-36 to D-43 added), risk register (R-22 to R-25 added; R-02, R-03, R-08, R-09, R-14, R-19 revised), Guarantee Register (30 entries).
- ✅ Fresh cross-document review (§6).
- ✅ Constraints respected: Phase 1 not started; nothing installed; no git; no code; no real target; no other project touched.

## 6. Cross-review results (revision 3)

**Method.** A script (`xreview.py`, kept in the session scratchpad, not part of the project) ran 50 mechanical checks across all seven documents: stale terms, section and ID references, acceptance-criteria coverage across releases, Guarantee Register counts, mode / trace / audit-only / identity wording, and filesystem safety. It is a consistency check, not a proof of correctness, and it cannot judge feasibility or whether a mechanism works.

**First run: 50 checks, 6 failed.** Four were real document issues and were fixed: a stale `ExportEvent` name in `AGENT_ROLES.md`; `AGENT_ROLES.md` not using the "pre-approved workspace" wording; and two trace-related lines in `design_system.md` that could be read as "redacted traces". Two were defects in the checking script itself (a heuristic that matched any line mentioning both "trace" and "redacted", and a path-exclusion bug that only saw the parent folder's own timestamp). The script was corrected, and the new trace-claim detector was sanity-tested against deliberately bad sentences ("Traces are redacted before storage" is flagged; "Traces are not redacted" is not). No check was weakened to make a document pass.

**Final run: 50 checks, 0 failed.**

```
PASS  no stale term: target_attested
PASS  no stale term: claimMatchesTarget
PASS  no stale term: AccessEvent
PASS  no stale term: ExportEvent
PASS  no stale term: access_events
PASS  no stale term: export_events
PASS  no stale term: tombstone?
PASS  no stale term: Release 0.1 ships with L1
PASS  no stale term: revision 2
PASS  no stale term: Non-interactive and CI use is unresolved
PASS  checklist mentions old names only as history (before/after table)
PASS  no lowercase agents.md outside checklist
PASS  no old CLI name "sentinel <verb>" in any doc
PASS  design_system uses qa-sentinel as CLI name
PASS  AC-01..AC-45 all defined exactly once
PASS  release table covers AC-01..AC-45 (non-preview rows)
PASS  register has 30 entries GR-01..GR-30
PASS  register status counts: 29 Designed, 1 not claimed, 0 above Designed
PASS  every AC named in the register exists
PASS  checklist guarantee summary matches register (29/1/0)
PASS  no document marks anything Tested/Implemented/Independently verified
PASS  every Q/R/G/D id referenced anywhere is defined in the checklist
PASS  checklist defines D-01..D-43
PASS  checklist defines Q-01..Q-27
PASS  checklist defines R-01..R-25
PASS  checklist defines G-01..G-16
PASS  architecture section references resolve (incl. §5.1, §7.9)
PASS  new sections exist: §5.1 and §7.9
PASS  L1-only appears only with preview/not-claimable/not-equivalent wording nearby
PASS  AC-38 shown as not evaluated in l1_only (prd, arch, design)
PASS  0.1 requires AC-38 and AC-39 (prd table + architecture §17)
PASS  no line claims traces are redacted
PASS  trace default off for every run stated in prd, arch, checklist
PASS  authenticated --trace refusal in prd FR-062, arch §11, AC-40
PASS  redactionStatus defined in arch and used in prd, design, AGENT_ROLES, Brain
PASS  encryption described as not-redaction in arch, prd, design
PASS  audit-only limitation statement present in Brain, prd, arch, design, AGENT_ROLES
PASS  no "performs no mutations" or "mutates nothing" overclaims remain
PASS  identity bases: target_reported used consistently, independently_attested reserved
PASS  default minIdentityBasis = target_reported in arch, prd, checklist (Q-20)
PASS  operator_asserted never described as strong/attested
PASS  no "strong" confidence label remains for identity
PASS  CI pre-approved workspace stated in prd, arch, AGENT_ROLES, checklist
PASS  Evidence row immutable; no mutable tombstone field; events append-only
PASS  AC-42 (HTML report accessibility) present in prd, design_system, arch register
PASS  no stale phase refs (end of Phase 6, Phase 4 sign-off)
PASS  Release names consistent: 0.1, 0.1-preview, 0.2, 0.3, 0.4, 1.0 present in prd and arch
PASS  no file matches auto-load names (AGENTS.md, CLAUDE.md, CLAUDE.local.md; case-insensitive)
PASS  no code, dependency or git artifacts in qa-sentinel
PASS  no other project modified in the last 5 hours

TOTAL: 50 checks, 0 failed
```

**Semantic review (manual re-read of the four contradiction chains):** (1) L1/L2: PRD FR-015/016/019, architecture §7.2/§7.7/§7.9/§17, AC-27/38/39/44 and Q-23 now say the same thing: the unqualified 0.1 needs `full` mode with AC-38 and AC-39 passed; otherwise only a labelled preview with no containment claim. (2) Evidence/traces: FR-060 to FR-065, AC-19/32/33/40 and architecture §11 agree that traces are `not_redacted`, off by default, refused for authenticated runs in 0.1, and that encryption is not redaction. (3) Audit-only: Brain principle 5, FR-010/024, architecture §5.1/§6.3/§7.8 and AC-05/41 use the same definition and limitation statement. (4) Identity: architecture §4/§10, FR-052 to FR-055, AC-12/30, design_system and AGENT_ROLES use `target_reported` / `operator_asserted` / `surfaceFingerprint`, always with confidence.

**Remaining weaknesses the review could not close** are listed in §8 (open questions) and in `architecture.md` §20.

## 7. Guarantee status summary

From `architecture.md` §18 (30 entries):

| Assurance | Count |
|-----------|-------|
| Independently verified | 0 |
| Tested | 0 |
| Implemented | 0 |
| Designed | 29 |
| Explicitly **not claimed** (GR-23) | 1 |

No security guarantee is implemented or tested. Anything in the documents that reads like a protection is design intent. Containment-related entries apply to `full` guard mode only and none is claimable in `l1_only`.

## 8. Open questions (complete)

| ID | Question | Default if unanswered | Needed by | Status |
|----|----------|-----------------------|-----------|--------|
| Q-01 | Initialize git in Phase 1? Confirm license `UNLICENSED` (private) | Git in Phase 1; `UNLICENSED` | Phase 1 | ❓ confirm default |
| Q-02 | Windows support level | Best-effort, restricted capture disabled without app-level encryption | Phase 1 | ❓ confirm default |
| Q-03 | Node policy | `engines >=22` | Phase 1 | ❓ confirm default |
| Q-04 | Allow a login `POST` in audit mode? | No; pre-provisioned session | Phase 2 | ❓ |
| Q-05 | Fingerprint sufficiency | **Resolved**: fallback only, low confidence (D-40) | — | ✅ |
| Q-06 | Confirmation `k` | **Resolved**: per-check, default 2 (D-26) | — | ✅ |
| Q-07 | Severity policy (rule defaults + audited human override vs human-only) | Rule defaults + override | Phase 3 | ❓ |
| Q-08 | MVP detection bar (90% of detectable; plus held-out set) | 90% + held-out | Phase 1 | ❓ |
| Q-09 | Registry naming | **Mostly resolved**: private, unpublished (D-32) | — | ✅ |
| Q-10 | CLI binary name | **Resolved by default**: `qa-sentinel` (D-33) | — | ❓ confirm |
| Q-11 | Fixtures (two stacks; behaviors include WebSocket from page and worker, WebRTC, QUIC, download, GraphQL, service worker, redirect, off-scope canary server, injection, version/identity switch, flaky behavior, state-changing GET, instrumented mutation counters) | Node demo-shop + second app on another stack | Phase 1 | ❓ |
| Q-12 | Claude Code kit naming | `/qa-sentinel:*` | Phase 3 | ❓ |
| Q-13 | Retention defaults (90/30/7 days; 180-day cap) | As written | Phase 2 | ❓ confirm |
| Q-14 | First CI system for examples | Generic exit-code docs | Phase 3 | ❓ |
| Q-15 | High-contrast theme | Honor `prefers-contrast` only | Phase 5 | ❓ |
| Q-16 | Reviewed CI approval mechanism (for example a committed approval file pinning `policyHash` at a lower, labelled assurance level) | **Interim: CI requires a pre-approved workspace; fresh workspace refused (D-42)** | Phase 3 | ❓ mechanism open |
| Q-17 | Default-deny WebSocket acceptable, or should `observe` be default? | Deny | Phase 2 | ❓ |
| Q-18 | Evidence key storage: OS keychain via CLI tools vs passphrase; headless Linux/CI behavior | Keychain tool, else passphrase | Phase 2 | ❓ |
| Q-19 | Preferred L2 approval method (passkey, OS prompt, separate OS user) | Decide before Phase 7 design | Phase 7 | ❓ |
| Q-20 | Default `minIdentityBasis` | **`target_reported`** (revised from `operator_asserted`); lowering it is an approved profile choice | Phase 4 | ❓ confirm |
| Q-21 | Who may attest read-only POST rules; is `custom-allowlist` needed in 0.1? | Profile owner; GraphQL only in 0.1 | Phase 3 | ❓ |
| Q-22 | Confirm the reordered release train (authorization last, Release 1.0) | As written | Phase 0 approval | ❓ |
| Q-23 | Is L2 mandatory for Release 0.1? | **Resolved by D-36**: mandatory for the unqualified 0.1; an L1-only run is only a labelled preview | — | ✅ (confirm via D-36) |
| Q-24 | If L2 fails AC-39 at the end of Phase 2, should a labelled 0.1-preview be released at all, or should 0.1 be held? | Owner decides at that point; no preview without approval | Phase 2 | ❓ **new** |
| Q-25 | How is AC-38's independent outbound observation done on each OS (socket/packet capture covering TCP, UDP, QUIC, DNS for all run processes)? Is it practical without privileged tools? | Decide in the Phase 2 spike; if impractical, AC-38 stays unpassed and 0.1 is not unqualified | Phase 2 | ❓ **new** |
| Q-26 | Is there any acceptable tested strategy for authenticated traces (strip payloads, screenshots-only), or should they never exist? | None; authenticated traces stay unavailable | post-1.0 | ❓ **new** |
| Q-27 | Should an `independently_attested` mechanism (verifiable signed build attestation) ever be designed? | No; the basis name is reserved only | post-1.0 | ❓ **new** |

## 9. Risk register

| ID | Risk | Likelihood | Impact | Mitigation (designed) | Status |
|----|------|-----------|--------|-----------------------|--------|
| R-01 | False `confirmed` findings erode trust | Medium | High | Per-check ceilings, signatures, k valid attempts, clean and flaky fixtures (AC-02, 07, 08, 29) | Open |
| R-02 | Guard misses a traffic class and allows mutation or egress | Medium | High | Two modes; layered L1+L2(+L3); traffic-class table (§7.9); independent observation (AC-38); no claim without tests; l1_only labelled | Open; Designed only |
| R-03 | Secrets or PII leak via artifacts, traces, or `data/` in the repo | Medium | High | Lifecycle; `redactionStatus`; traces off by default, never described as redacted; encryption separate from redaction (AC-19, 32, 33, 40) | Open; Designed only |
| R-04 | A local agent with shell access bypasses approvals, signing key or database | Medium | Medium | Documented limit (GR-23 not claimed); L2 approvals and L3 isolation post-1.0 | Accepted for L1 |
| R-05 | Confirmation reruns inflate run time and cost | Medium | Medium | Budgets, reruns only for candidates, maxAttempts | Open |
| R-06 | Scope creep for a small team | High | Medium | Strict phase gates; early usable release; deferrals | Open |
| R-07 | `agents.md` auto-loaded as instructions | High | Low | Mitigated by rename (D-35); fresh-session confirmation still pending | Mitigated; verify in a new session |
| R-08 | Audit-only still changes server state (GET side effects, Set-Cookie sessions, approved read-only POST rules, background work) | Medium | Medium | Definition in §5.1; `deniedPathPatterns`; statement in every report (AC-41); user-owned targets only | Accepted and disclosed |
| R-09 | Identity wording or weak basis misleads about what was verified | Medium | Medium | `target_reported`/`operator_asserted`/fallback naming, confidence shown with every result, default minimum `target_reported` (AC-30) | Mitigated by design |
| R-10 | Browser/Playwright drift breaks reproducibility | Medium | Medium | Pinned versions, manifest, drift flag | Open |
| R-11 | Audit-only auth friction limits coverage | High | Medium | Pre-provisioned sessions; Q-04 | Open |
| R-12 | Single machine, one run at a time | Low | Low | Accepted for MVP | Accepted |
| R-13 | Agent edits a profile to widen scope | Medium | High | Policy lock, `policyHash`, human approval (AC-26) | Open; same-user limit applies |
| R-14 | L2 proxy infeasible for HTTPS, loopback or QUIC | Medium | High | **No unqualified 0.1 without L2 passing AC-39/38**; labelled preview only (D-36, Q-24) | Open 🔬 P2 |
| R-15 | Chromium flags (loopback bypass, WebRTC policy, QUIC) behave differently than assumed | Medium | Medium | Phase 2 spike with AC-22/23/39 | Open 🔬 P2 |
| R-16 | Evidence key loss or keychain unavailability (headless Linux/CI) | Medium | Medium | Passphrase fallback; loss means restricted evidence unrecoverable (Q-18) | Open |
| R-17 | Authorization shipping last may not fit the guard/policy design | Medium | Medium | Grants designed now; interface review before Phase 7 | Open |
| R-18 | Retention and tombstones reduce later forensic value | Low | Medium | Hard cap, open-finding hold, append-only events keep metadata | Accepted |
| R-19 | CI cannot approve policy; CI limited to pre-approved workspaces | High | Medium | Interim rule (D-42, AC-45); reviewed mechanism is Q-16 | Open |
| R-20 | Assurance wording overclaims or is ignored in reports | Medium | Medium | FR-085, NFR-013, register-driven badges | Open |
| R-21 | Default-deny WebSockets reduce coverage for WebSocket-dependent apps | Medium | Low | Reported limitation; `observe` option (Q-17) | Open |
| R-22 | An L1-only preview is mistaken for contained, safe auditing | Medium | High | Mandatory labelling (AC-44), no containment wording, AC-38 shown as not evaluated, explicit flag only | Open; Designed only |
| R-23 | `target_reported` identity can be spoofed or stale, so `verified_fixed` is trusted too much | Medium | Medium | Moderate confidence shown, never "attested"; claim/report mismatch → `inconclusive`; independent attestation reserved | Open |
| R-24 | Authenticated traces unavailable reduces debuggability | High | Low | Screenshots and redacted captures; revisit with a tested strategy (Q-26) | Accepted |
| R-25 | Independent outbound observation for AC-38 is impractical, delaying an unqualified 0.1 | Medium | Medium | Phase 2 spike (Q-25); acknowledge preview path (Q-24); never weaken AC-38 | Open 🔬 P2 |

## 10. Approval requirements

Phase 0 closes only when **you** do all of the following. Nothing below is assumed.

- [ ] Review and approve each document (or list changes): Brain, prd, design_system, architecture, AGENT_ROLES, this checklist.
- [ ] Confirm or change the revised and new decisions D-09, D-11, D-15, D-21 to D-43 (or approve them as a block).
- [ ] Answer, or accept the defaults for, the questions marked Phase 0–2: Q-01, Q-02, Q-03, Q-08, Q-11, Q-13, Q-16, Q-17, Q-18, Q-22, Q-24, Q-25.
- [ ] Say "Phase 0 approved".

After approval, **Phase 1 still requires its own plan and approval** before any scaffold, dependency install, `git init` or code.

| Approval record | |
|-----------------|--|
| Approved by | _pending_ |
| Date | _pending_ |
| Changes requested | _none recorded_ |

## 11. What was and was not verified

- **Verified (documents):** cross-references, numbering and vocabulary by script (§6); file rename and absence of stale references; that every register claim is Designed; that no document states a guarantee above Designed.
- **Verified (public docs, earlier this session):** Playwright documents `serviceWorkers: 'block'`, WebSocket routing since v1.48 with close-without-connect, and no redaction option in HAR recording.
- **Not verified (nothing is built):** every guarantee in the register; Chromium proxy, WebRTC and QUIC flags; worker-originated WebSocket coverage; `sendBeacon` routing; independent outbound observation for AC-38; keychain access without a native module; redaction completeness; confirmation on real flaky targets; that `AGENT_ROLES.md` is not auto-loaded in a fresh session.
<!-- END FILE: PHASE_0_CHECKLIST.md -->

<!-- BEGIN FILE: README.md sha256=3a3ac171a709dc5a46ac39d7bd702468a8e64d5ef2f7bbb7ea2dcb5bafea39e9 -->
# qa-sentinel

Independent, evidence-first QA auditor for any application. Standalone product; not connected to any existing project.

**Status: Phase 0 (foundation documents), revision 3, pending approval. No code yet. Every protective mechanism is Designed only (not Implemented, Tested or Independently verified).**

## Foundation documents

| Document | Purpose |
|----------|---------|
| [Brain.md](Brain.md) | Vision, principles, goals, non-goals, phases and releases, glossary |
| [prd.md](prd.md) | Users, use cases, requirements, release plan, acceptance criteria |
| [architecture.md](architecture.md) | Assurance language, modules, data model, confirmation, network isolation, authorization, verification, evidence lifecycle, interfaces, Guarantee Register |
| [AGENT_ROLES.md](AGENT_ROLES.md) | Internal roles, permissions, communication, safety (named to avoid tools auto-loading it as instructions) |
| [design_system.md](design_system.md) | Identity, tokens, dashboard navigation, components, accessibility |
| [PHASE_0_CHECKLIST.md](PHASE_0_CHECKLIST.md) | Decision and risk registers, open questions, approvals |

## Folders

- `config/targets/` target profiles (one file per application under test)
- `tests/` tests of QA Sentinel itself (not of target apps)
- `reports/` exported run reports

Further folders (`packages/`, `fixtures/`, `specs/`, `data/`) are defined in `architecture.md` and created in Phase 1.
<!-- END FILE: README.md -->
