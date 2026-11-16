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
