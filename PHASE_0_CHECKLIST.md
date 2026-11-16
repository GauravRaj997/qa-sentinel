# QA Sentinel — Phase 0 Checklist

> Tracks decisions, completed work, open questions, risks and approvals for Phase 0 (foundation documents).
> **Phase 0 status: revision 4 written and cross-reviewed. NOT approved. Phase 1 has not started and must not start until you approve Phase 0 and then a Phase 1 plan. No code, dependencies or target connection exists. A git repository exists that this session did not create (your initial commit `ddbb7c6`, containing revision 3); this session ran only read-only git commands and committed nothing.**
> Last updated: 2026-11-16 (revision 4, after the third independent review).

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
| — | `PHASE_0_REVIEW_BUNDLE.md` (revision 4 bundle; not a deliverable) | ✅ | — | — |

## 2. Revision 4: before/after change summary

| Review finding | Before (revision 3) | After (revision 4) |
|----------------|---------------------|--------------------|
| **1. Screenshot redaction overclaim** | §11, FR-061, AC-19/32 and GR-16 said exact secret values are removed from `redacted` **and** `partially_redacted` artifacts, which included screenshots; selector masking cannot guarantee that | Exact-value removal claims now cover **text artifacts labelled `redacted`** (request/response data, console logs, DOM text captures), the database, logs and reports. **Screenshots are `partially_redacted` (selector masking only) and no secret-free claim is made**; the limits are documented (architecture §11); AC-19/32 and GR-16 narrowed; new **AC-48** tests that the limit is labelled and documented, not hidden; Q-28 asks about an optional DOM pre-scan (not designed) |
| **2. Worker-originated WebSockets** | AC-22 and GR-04 claimed worker WebSocket denial; L2 cannot block a WebSocket to an allowed origin inside an HTTPS tunnel; coverage "unverified" | L2 is explicitly **not** the enforcement layer. Mechanism: **deny dedicated and shared workers by default** (constructor removal in every frame **plus** injected `worker-src 'none'` CSP); `workers: allow` is an approved policy choice with **no claim**. AC-22 narrowed to pages, frames and service workers; GR-04 narrowed; new **AC-46** (adversarial) and **GR-31**. AC-46, AC-22 and GR-31 remain **unpassed**; if AC-46 fails the unqualified 0.1 is blocked and nothing may imply worker WebSocket control (D-45, Q-29, R-27) |
| **3. Run status** | Run model listed `completed | partial | aborted`; FR-016/AC-27 already said `errored` | Run `status` is `running | completed | partial | aborted | errored` with `terminalReason`; semantics, immutability, `not_run`, no confirmation rerun after guard failure, exit code `4`, and "policy refusal creates no run" defined (architecture §4, §7.7, §8, §12); new **FR-025**, **AC-47**, **GR-32**; FR-016/017/018, NFR-012, AC-27/44, AGENT_ROLES §3.1/§3.5/§7 and design_system states reconciled (D-46) |
| **4. DNS and AC-38** | "Only in-scope target and loopback" contradicted an external resolver; no definition of who resolves; DNS observation unspecified | New architecture **§7.10**: only the proxy resolves; `dnsMode: pinned` (proposed default; proxy connects to pinned IPs, **no DNS query leaves the machine**) or `system` (DNS leaves the machine, **cannot pass AC-38**, reported "not covered"); independent **system-wide** observation (packet capture or isolated namespace, canary reserved-TLD names; per-process socket listing is insufficient); new **FR-027**, **AC-49**; **AC-38 not weakened**: if no reliable observation exists it stays unpassed and the unqualified 0.1 is blocked (D-47, Q-25, Q-30, R-26) |
| **5. Checklist consistency** | Approval list omitted Q-04 (needed by Phase 2) | §10 now lists **every** question needed by Phase 0, 1 or 2, including Q-04, Q-25 and the new Q-28 to Q-30; a script check enforces it |
| **6. Registers and review** | 30 register entries (29 Designed, 1 not claimed); 45 acceptance criteria; decisions to D-43; risks to R-25; questions to Q-27 | **32** register entries (31 Designed, 1 not claimed); **49** acceptance criteria; decisions D-44 to D-47 added (D-21, D-36, D-38 revised); risks R-26 to R-28 added (R-25 revised); questions Q-28 to Q-30 added (Q-25 revised); fresh cross-review in §6. **Unqualified Release 0.1 blockers, all currently unpassed: AC-22, AC-46, AC-38, AC-39, AC-49** |

### Previous: revision 3 before/after change summary (kept for history)

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
| D-21 | Network isolation layers | L1 in-browser guard; L2 loopback egress proxy; L3 optional OS isolation. **L2 must pass AC-39 and AC-38 (including DNS) for the unqualified Release 0.1.** L2 cannot block a WebSocket to an allowed origin inside a TLS tunnel (D-45) | L1 only; MITM proxy; firewall only | Independent layers | L2 unproven for HTTPS, QUIC, loopback, DNS; fallback is a labelled preview, not 0.1 | 🟡 🔬 P2 (revised) |
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
| D-36 | Guard modes and release labelling | `full` (L1+L2, default) vs `l1_only` (explicit `--guard l1-only`); unqualified 0.1 requires `full` with **AC-22, AC-38, AC-39, AC-46 and AC-49 passed**; otherwise a **0.1-preview** that claims no containment; no silent downgrade; traffic-class coverage table in `architecture.md` §7.9 | Ship 0.1 L1-only with a footnote; make L2 optional | Directive from review: no equivalent-containment claim without tests | Possible delay or preview-only release; AC-38 needs independent OS-level observation (Q-25) | 🟡 directive (revised) |
| D-37 | Traces | Off by default for every run; `--trace` opt-in; **authenticated traces refused in Release 0.1**; unauthenticated opt-in traces `restricted`, `not_redacted`, encrypted, 7 days, never exported | Traces on failure; claim redaction of traces | Traces cannot be reliably redacted | Less debugging data on authenticated targets (R-24); tested handling strategy needed before ever enabling (Q-26) | 🟡 directive |
| D-38 | Redaction vs encryption | Separate `redactionStatus` and `encrypted`; exact-value secret-removal claims (AC-19/32, GR-16) cover **only `redacted` text artifacts**, DB, logs, reports; screenshots are `partially_redacted` with no claim (D-44); AC-33 is storage-only | One combined "protected" notion | Prevent false assurance | More labels to maintain and display | 🟡 directive (revised) |
| D-39 | Audit-only definition | No intentional, known state-changing actions; **not** state immutability; GET side effects, Set-Cookie sessions, read-only POST side effects, background work stated; every report carries the statement | "No mutations" wording | Accurate; avoids overclaiming | Users must read the limitation; fixture needs a state-changing GET (AC-41) | 🟡 directive |
| D-40 | Build identity bases | `independently_attested` (reserved), `target_reported` (moderate, not proof), `operator_asserted` (low), `surfaceFingerprint` (low, fallback); default `minIdentityBasis` = `target_reported` in policy; result always shows basis and confidence | "Attested" naming; fingerprint-first | Honest strength; prefers explicit identity | Many results `inconclusive` unless target reports a build id | 🟡 directive |
| D-41 | Evidence history | Evidence rows immutable; append-only, hash-chained evidence events; tombstone = event + artifact byte deletion only | Mutable `tombstone` field; row deletion | No silent mutation of history | More tables/logic; `doctor` checks chains | 🟡 directive |
| D-42 | CI approval (interim) | CI requires a pre-approved workspace; fresh CI workspace refused (AC-45); no bypass | Committed approval file now | Safe until a reviewed mechanism exists | Limits CI adoption (R-19); mechanism open (Q-16) | 🟡 directive |
| D-43 | HTML report accessibility | AC-42 in Release 0.1: axe, keyboard, no color-only meaning, contrast, zoom/reflow, print, manual SR pass | Test only the dashboard | Report ships a release earlier than the dashboard | Extra test fixtures | 🟡 directive |
| D-44 | Artifact-type secret-removal claims and screenshot limits | Exact-value scrubbing is claimed only for text artifacts labelled `redacted`, the DB, logs and reports (listed encodings only). Screenshots are `partially_redacted` (configured selectors masked), with documented limits and **no secret-free claim**; AC-19/32 and GR-16 narrowed; AC-48 tests the labelling | Claim secret-free screenshots; pixel or OCR scrubbing now; blur whole pages | Selector masking cannot guarantee a secret is absent from pixels | Screenshots stay sensitive (restricted, encrypted, gated export, short retention); optional DOM pre-scan undecided (Q-28, R-28) | 🟡 directive |
| D-45 | Worker-originated WebSocket enforcement | Deny dedicated and shared workers by default: constructor removal in every frame **plus** injected `worker-src 'none'` CSP; `workers: allow` is an approved policy choice and yields no claim; L2 acknowledged unable to block WebSockets to allowed origins; AC-46, GR-31; AC-22 narrowed; failure of AC-46 blocks the unqualified 0.1 | Filter with CSP `connect-src`; rely on L2; rely on Playwright routing for workers | L2 sees an opaque TLS tunnel; worker routing is undocumented | Targets using workers degrade; response-header injection is a target-visible change (R-27); unproven (Q-29) | 🟡 directive 🔬 P2 |
| D-46 | Run status model | `running | completed | partial | aborted | errored` with `terminalReason`; terminal statuses immutable (trigger); `errored` = could not proceed or complete safely; unexecuted specs `not_run`; no confirmation rerun after guard failure; exit `4`; policy refusal creates no run; run-level `errored` distinct from spec-level; FR-025, AC-47, GR-32 | Keep three statuses and overload `aborted`; allow status edits | A guard failure is neither a user abort nor a budget stop | Trigger and crash-recovery logic to test (AC-47) | 🟡 directive |
| D-47 | DNS modes and the scope of AC-38 | Only the proxy resolves. `dnsMode: pinned` (proposed default; pinned IPs, no resolver call, no DNS leaves the machine) or `system` (DNS may leave the machine; **cannot pass AC-38**; reported "not covered"). Independent system-wide observation with reserved-TLD canaries; AC-49; if no reliable method exists AC-38/49 stay unpassed and the unqualified 0.1 is blocked | Ignore DNS in AC-38; rely on guard logs; per-process socket listing only | An external resolver contradicts "only target and loopback"; resolver-daemon queries are invisible to per-process listing | Operators maintain pins; packet capture may need privileges (R-26, Q-25, Q-30) | 🟡 directive 🔬 P2 |

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

## 5. Work completed (revision 4, then revision 3)

**Revision 4**

- ✅ Screenshot redaction narrowed and limits documented across architecture §11/§7.8, FR-061, AC-19/32/48, GR-16, Brain principle 9 and glossary, design_system RedactionBadge (D-44).
- ✅ Worker-originated WebSocket mechanism defined and gated across architecture §7.3/§7.9/§17, FR-011/012/026, AC-06/22/46, GR-04/31, design_system GuardCoveragePanel (D-45).
- ✅ Run status enumeration and semantics across architecture §4/§7.7/§8/§12, FR-016/025, NFR-012, AC-27/47, GR-10/32, AGENT_ROLES §3.1/§3.5/§7, design_system states and RunStatusBadge (D-46).
- ✅ DNS and AC-38 semantics in architecture §7.9/§7.10/§17, FR-015/027, AC-38/49, GR-25, Q-25/Q-30 (D-47).
- ✅ Approval checklist covers every question needed by Phase 0 to 2; script-enforced.
- ✅ Fresh cross-document review (§6). Constraints respected: Phase 1 not started; nothing installed; no git write command run (the repository found here was created by you, commit `ddbb7c6`; see Q-01); no code; no real target; no sibling project written to by this session.

**Revision 3**

- ✅ L1/L2 reconciliation across PRD FR-015/016/019, architecture §7.2/§7.7/§7.9/§17, AC-27/38/39/44, Q-23.
- ✅ Evidence/trace reconciliation across FR-060–065, AC-19/32/33/40, architecture §11 and the register.
- ✅ Audit-only definition across Brain principle 5, FR-010/024, architecture §5.1/§6.3/§7.8, AC-05/41.
- ✅ Identity terminology across architecture §4/§10, FR-052–055, AC-12/30, design_system, AGENT_ROLES, Q-20.
- ✅ design_system CLI name, HTML report accessibility criterion, CI wording, append-only evidence events.
- ✅ Decision register (D-36 to D-43 added), risk register (R-22 to R-25 added; R-02, R-03, R-08, R-09, R-14, R-19 revised), Guarantee Register (30 entries).
- ✅ Fresh cross-document review (§6).
- ✅ Constraints respected at the time: Phase 1 not started; nothing installed; no git (the repository appeared later, created by you); no code; no real target; no other project touched.

## 6. Cross-review results (revision 4)

**Method.** A script (`xreview.py`, kept in the session scratchpad, not part of the project) ran 119 mechanical checks across all seven documents and the folder: stale terms and old wording, acceptance-criteria and release-table coverage, Guarantee Register counts and statuses, ID and section references, trace/redaction/audit-only/identity wording, the revision 4 chains (run status, screenshots, workers, DNS), the approval-list coverage of every question needed by Phase 0 to 2, and filesystem safety. The revision 3 script no longer existed in the scratchpad, so this script was **rebuilt**; its regular expressions carry self-tests that must fire on bad sentences before the run, and it was **mutation-tested** (below).

**First complete run: 116 checks, 15 failed.** One was a real finding, three led to document corrections, and eleven were defects in the script itself:
- *Real finding (not a document defect):* a git repository exists in this folder (`.git`, `.gitignore`). It holds one commit, `ddbb7c6` "Initial commit", 2026-11-16 11:28, by your identity; this session never ran a git write command. The checklist header, §5, Q-01, §10 and §11 previously said no git repository existed; they are corrected, and a check now guards the wording.
- *Document corrections:* `AGENT_ROLES.md` Reporter now names the run status and terminal reason and forbids calling a screenshot secret-free; the checklist statements about git; Q-01.
- *Script defects fixed, no check weakened:* the history scope for old wording (the checklist legitimately quotes old terms in its before/after tables, decision alternatives, gap tables and in this pasted output); the approval-list check rejected Q-16 as "extra" (it is Phase 3 but its interim default D-42 is confirmed at Phase 0 approval, so it is kept and reported as an INFO line); two audit-only wording patterns missed "audit-only limitation" and "not guaranteed unchanged"; an identity-basis pattern matched "attested" inside `independently_attested`; a window too short for `minIdentityBasis`; the worker-WebSocket detector matched only one word order (caught by its own self-test); a transcript scan that read an unset field.
- *Observation, not a failure:* a sibling project (`Git/jeevanpulse`) shows file changes and its own commits by your identity. This session issued no Write or Edit there (verified from the transcript); modification times alone cannot prove authorship.

**Mutation test.** Six planted regressions were each caught: AC-27 losing `errored`; the old three-status Run model restored; screenshots grouped with `redacted` again; an unqualified "Worker WebSockets are denied" line; Q-04 removed from the approval list; AC-38's DNS requirement removed.

**Final run: 119 checks, 0 failed.**

```
INFO  approval list also includes later-phase question(s) deliberately: ['Q-16'] (Q-16 is Phase 3, but its interim default D-42 is part of Phase 0 approval)
INFO  a git repository exists in qa-sentinel. It was NOT created by this session (this session ran only read-only git commands). Commits: ['ddbb7c6 Gaurav Raj 2026-11-16 11:28:13 +0530 Initial commit']
INFO  sibling project file changed recently (mtime only; cannot show who changed it): ('Git', '/Users/roop/Desktop/myProjects/Git/jeevanpulse/infra/terraform/environments/dev/outputs.tf')
INFO  Write/Edit attempt outside qa-sentinel and the scratchpad (blocked by a hook; path exists on disk: False): /private/tmp/claude-501/-Users-roop/Desktop-myProjects/placeholder.txt
PASS  no stale term: target_attested
PASS  no stale term: claimMatchesTarget
PASS  no stale term: AccessEvent
PASS  no stale term: ExportEvent
PASS  no stale term: access_events
PASS  no stale term: export_events
PASS  no stale term: `tombstone?`
PASS  no stale term: Release 0.1 ships with L1
PASS  no stale term: revision 3, pending approval
PASS  no stale term: revision 2
PASS  no stale term: Non-interactive and CI use is unresolved
PASS  no stale term: status (completed | partial | aborted)
PASS  no stale term: `aborted`/`partial`
PASS  no claim scope that groups `redacted` with `partially_redacted`
PASS  no lowercase agents.md outside checklist
PASS  no old CLI name "sentinel <verb>"
PASS  design_system uses qa-sentinel as CLI name
PASS  AC-01..AC-49 all defined exactly once
PASS  release table (non-preview rows) covers AC-01..AC-49 exactly
PASS  prd 0.1 row names all five blockers
PASS  architecture §17 blocking-items paragraph names all five blockers
PASS  checklist revision summary names all five blockers
PASS  preview row excludes AC-38, AC-39, AC-49
PASS  register has 32 entries GR-01..GR-32
PASS  register status counts: 31 Designed, 1 not claimed, 0 above Designed
PASS  every AC named in the register exists
PASS  every AC id referenced in any document is defined
PASS  every GR id referenced in any document is in the register
PASS  checklist guarantee summary matches register (32 / 31 / 1 / 0)
PASS  checklist states 49 acceptance criteria and 32 register entries
PASS  register footer says nothing above Designed
PASS  checklist defines D-01..D-47
PASS  checklist defines Q-01..Q-30
PASS  checklist defines R-01..R-28
PASS  checklist defines G-01..G-16
PASS  every D/Q/R/G id referenced anywhere is defined in the checklist
PASS  every unresolved question needed by Phase 0, 1 or 2 is in the approval list
PASS  approval list names only defined, unresolved questions
PASS  Q-04 is in the approval list
PASS  approval list covers decisions through D-47
PASS  architecture self section references resolve
PASS  references to architecture.md sections in other docs resolve
PASS  new sections exist: §5.1, §7.9, §7.10
PASS  AC-38 shown as not evaluated in l1_only (prd, arch, design)
PASS  no line claims traces are redacted
PASS  trace default off stated in prd, arch, checklist
PASS  authenticated --trace refusal in prd FR-062, arch §11, AC-40
PASS  redactionStatus used in arch, prd, design, AGENT_ROLES; Brain defines Redaction status
PASS  encryption is distinguished from redaction in architecture.md
PASS  encryption is distinguished from redaction in prd.md
PASS  encryption is distinguished from redaction in design_system.md
PASS  audit-only limitation stated in Brain.md
PASS  audit-only limitation stated in prd.md
PASS  audit-only limitation stated in architecture.md
PASS  audit-only limitation stated in design_system.md
PASS  audit-only limitation stated in AGENT_ROLES.md
PASS  no "performs no mutations" / "mutates nothing" overclaims (checklist may quote them only as history)
PASS  target_reported used in arch, prd, design, AGENT_ROLES, Brain; independently_attested reserved
PASS  default minIdentityBasis = target_reported in arch, prd, checklist (Q-20)
PASS  operator_asserted never described as strong or attested
PASS  no "strong" confidence label for identity
PASS  CI pre-approved workspace stated in prd, arch, AGENT_ROLES, checklist
PASS  evidence rows immutable, events append-only, no mutable tombstone field
PASS  AC-42 present in prd, design_system, arch register
PASS  no stale phase refs (checklist may quote them only in history)
PASS  release names present in prd and arch
PASS  all seven docs say revision 4 in their status line
PASS  architecture Run model lists the five statuses and terminalReason
PASS  all nine terminalReason values defined in architecture §4
PASS  every `ends the run X` names one of the four terminal statuses
PASS  FR-016, AC-27, AC-44 name `errored`; NFR-012 names `aborted` and not `partial`
PASS  FR-025 defines terminal statuses, immutability, not_run, exit 4, no run on refusal
PASS  AC-47 defines induced faults, immutability rejection, exit codes, no run row
PASS  AGENT_ROLES Orchestrator and Executor handle `errored`; §7 distinguishes it from `aborted`
PASS  design_system states table and RunStatusBadge cover Errored
PASS  architecture exit-code line covers partial, aborted, errored
PASS  run-level versus spec-level errored distinguished (arch §4, prd FR-025)
PASS  GR-10 and GR-32 reference AC-47
PASS  no line claims screenshots are secret-free, sanitized or redacted without negation
PASS  AC-19 and AC-32 exclude screenshots and state no claim
PASS  GR-16 excludes screenshots, states no secret-free claim, lists AC-48
PASS  AC-48 defined and states it documents the limit
PASS  architecture §11 documents screenshot masking limits and forbids secret-free claims
PASS  redactionStatus table assigns screenshots to partially_redacted and text artifacts to redacted
PASS  FR-061 and exact-value item are text-only and state screenshots are partial
PASS  Brain and design_system carry the screenshot limit
PASS  Q-28 defined with default no
PASS  architecture §7.3 states L2 cannot block a WebSocket to an allowed origin
PASS  worker denial uses two independent measures (init script and worker-src CSP)
PASS  §7.9 worker WebSocket row says no L2 control
PASS  AC-22 excludes worker-originated WebSockets and points to AC-46
PASS  GR-04 narrowed and points to GR-31; GR-31 says no L2 backstop
PASS  AC-46 is adversarial, unpassed until executed, and blocks the unqualified 0.1
PASS  workers: allow yields no claim and is policy-locked (arch, FR-026)
PASS  no line claims worker WebSockets are denied or blocked without a qualifier
PASS  §20 and §7.8 keep the worker WebSocket limitation
PASS  unpassed worker items are not presented as available (checklist, arch §17)
PASS  Q-29 defined
PASS  probe worker creation is part of the start-of-run self-check
PASS  architecture §7.10 defines who resolves, pinned, system and observation
PASS  AC-38 requires no DNS leaving the machine, excludes system DNS, and is not weakened
PASS  AC-38 still names TCP, UDP, QUIC and DNS and independent observation
PASS  AC-49, FR-027 defined; GR-25 scoped to pinned DNS and lists AC-49
PASS  every 'only the in-scope target and loopback' claim also mentions DNS
PASS  profile network schema lists workers, dnsMode, dnsPins
PASS  FR-026 and FR-027 keep the new fields inside policyHash
PASS  per-process socket listing is stated as insufficient for DNS
PASS  Q-25 revised and Q-30 defined (default pinned)
PASS  R-26, R-27, R-28 defined and R-25 revised
PASS  D-44..D-47 defined; D-21/36/38 revised
PASS  unverified Chromium DNS flags are labelled unverified in arch §7.10 and §20
PASS  design_system GuardCoveragePanel covers workers, DNS mode and `uncontrolled`
PASS  no live checklist text claims 'no git repository' (one exists, created by the user)
PASS  README and the six documents do not claim the absence of git
PASS  git history is a single user-authored commit that this session did not create (no commit newer than the revision 3 bundle by a non-user identity)
PASS  no file matches auto-load names (AGENTS.md, CLAUDE.md, CLAUDE.local.md; case-insensitive)
PASS  no code or dependency artifacts in qa-sentinel (only .md files plus .gitignore; no node_modules)
PASS  config/targets, tests, reports are still empty
PASS  no Write/Edit this session issued targeted a sibling project, and no stray-path attempt created a file

TOTAL: 119 checks, 0 failed
```

**Semantic review (manual re-read of the five revision 4 chains).** (1) Screenshots: architecture §11, FR-061, AC-19/32/48, GR-16, Brain principle 9 and the glossary, and design_system RedactionBadge all say that exact-value removal is claimed for text artifacts only and that screenshots are `partially_redacted` with no secret-free claim. (2) Workers: architecture §7.3/§7.8/§7.9, FR-011/012/026, AC-06/22/46, GR-04/31 and §17 agree that L2 cannot block a WebSocket to an allowed origin, that denial of workers is the only mechanism, and that AC-46 is unpassed and blocks the unqualified 0.1. (3) Run status: architecture §4/§7.7/§8/§12, FR-016/017/018/025, NFR-012, AC-27/44/47, GR-10/32, AGENT_ROLES §3.1/§3.5/§3.8/§7 and design_system states use the same five values. (4) DNS: architecture §7.2/§7.9/§7.10/§17, FR-015/027, AC-38/49 and GR-25 agree that only the proxy resolves, that `pinned` makes no DNS query, that `system` cannot pass AC-38, and that missing reliable observation leaves AC-38 and AC-49 unpassed. (5) The approval list contains every unresolved question needed by Phase 0, 1 or 2.

**Remaining weaknesses the review could not close** are listed in §8 (open questions) and in `architecture.md` §20. In particular: every register entry is still Designed; the worker-denial mechanism, the DNS design and its observation method, screenshot masking limits, run-status immutability and crash recovery are all untested; and no document can show that Chromium flags or Playwright behavior match the design until the Phase 2 spike.

## 7. Guarantee status summary

From `architecture.md` §18 (32 entries):

| Assurance | Count |
|-----------|-------|
| Independently verified | 0 |
| Tested | 0 |
| Implemented | 0 |
| Designed | 31 |
| Explicitly **not claimed** (GR-23) | 1 |

No security guarantee is implemented or tested. Anything in the documents that reads like a protection is design intent. Containment-related entries apply to `full` guard mode only and none is claimable in `l1_only`.

## 8. Open questions (complete)

| ID | Question | Default if unanswered | Needed by | Status |
|----|----------|-----------------------|-----------|--------|
| Q-01 | Git was already initialized by you (initial commit `ddbb7c6`, 2026-11-16 11:28, revision 3 content). Keep that repository as the project's history? Confirm license `UNLICENSED` (private) | Keep it; revision 4 stays uncommitted until you decide; `UNLICENSED` | Phase 1 | ❓ confirm default (revised) |
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
| Q-25 | How is AC-38's independent, system-wide outbound observation (packet capture or an isolated namespace, covering TCP, UDP, QUIC **and DNS**, for all run processes and resolver processes acting for them) done on each OS? Is it practical without privileged tools? Per-process socket listing is not sufficient for DNS (§7.10) | Decide in the Phase 2 spike; if impractical, AC-38 and AC-49 stay unpassed and 0.1 is not unqualified | Phase 2 | ❓ **revised** |
| Q-26 | Is there any acceptable tested strategy for authenticated traces (strip payloads, screenshots-only), or should they never exist? | None; authenticated traces stay unavailable | post-1.0 | ❓ **new** |
| Q-27 | Should an `independently_attested` mechanism (verifiable signed build attestation) ever be designed? | No; the basis name is reserved only | post-1.0 | ❓ **new** |
| Q-28 | Should an optional DOM pre-scan (mask any node whose visible text contains a resolved secret before a screenshot) be designed to reduce, though never eliminate, secrets in pixels? | No; screenshots stay `partially_redacted` with documented limits and no secret-free claim | Phase 2 | ❓ **new** |
| Q-29 | Is denying dedicated and shared workers by default acceptable (some targets will degrade), with `workers: allow` as an approved, unclaimed policy choice? | Yes, deny by default | Phase 2 | ❓ **new** |
| Q-30 | Default `network.dnsMode`: `pinned` (needs `dnsPins` per non-loopback host; no DNS leaves the machine) or `system` (easier; DNS leaves the machine and no containment claim)? | `pinned` | Phase 2 | ❓ **new** |

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
| R-25 | Independent outbound observation (including DNS) for AC-38 is impractical, delaying an unqualified 0.1 | Medium | Medium | Phase 2 spike (Q-25); acknowledge preview path (Q-24); never weaken AC-38 | Open 🔬 P2 (revised) |
| R-26 | DNS cannot be reliably observed or suppressed (browser-side resolution, resolver daemon), or `system` DNS leaves scope, so AC-38/49 cannot pass | Medium | High | `pinned` mode proposed default (§7.10); system-wide capture or isolated namespace; system-DNS runs excluded from claims; AC-38/49 stay unpassed and block the unqualified 0.1; never weakened | Open 🔬 P2 |
| R-27 | Worker denial breaks target apps, the injected `worker-src` header alters behavior, or AC-46 fails (a worker or worker WebSocket gets through), blocking the unqualified 0.1 | Medium | Medium | `workers: allow` is an approved, labelled, unclaimed option; header injection listed in the manifest; adversarial AC-46; no worker-WebSocket claim without it; L3 is the only stronger option (post-MVP) | Open 🔬 P2 |
| R-28 | Screenshots contain secrets despite selector masking and are exposed or exported | Medium | High | Restricted and encrypted when authenticated; short retention; gated, logged export; documented limit and AC-48; no secret-free claim; Q-28 | Open |

## 10. Approval requirements

Phase 0 closes only when **you** do all of the following. Nothing below is assumed.

- [ ] Review and approve each document (or list changes): Brain, prd, design_system, architecture, AGENT_ROLES, this checklist.
- [ ] Confirm or change the revised and new decisions D-09, D-11, D-15, D-21 to D-47 (or approve them as a block).
- [ ] Answer, or accept the defaults for, every question needed by Phase 0, 1 or 2: Q-01, Q-02, Q-03, Q-04, Q-08, Q-11, Q-13, Q-16, Q-17, Q-18, Q-22, Q-24, Q-25, Q-28, Q-29, Q-30.
- [ ] Say "Phase 0 approved".

After approval, **Phase 1 still requires its own plan and approval** before any scaffold, dependency install or code.

| Approval record | |
|-----------------|--|
| Approved by | _pending_ |
| Date | _pending_ |
| Changes requested | _none recorded_ |

## 11. What was and was not verified

- **Verified (documents):** cross-references, numbering and vocabulary by script (§6); file rename and absence of stale references; that every register claim is Designed; that no document states a guarantee above Designed.
- **Verified (public docs, earlier this session):** Playwright documents `serviceWorkers: 'block'`, WebSocket routing since v1.48 with close-without-connect, and no redaction option in HAR recording.
- **Verified (this folder, revision 4):** a git repository exists with one commit (`ddbb7c6`, by your identity, 11:28), which this session did not create; this session issued only read-only git commands; no file other than Markdown (plus your `.gitignore`) exists; `config/targets`, `tests` and `reports` are empty; the transcript shows no Write or Edit by this session outside this folder and the scratchpad (one mistaken write to a stray `/private/tmp` path was blocked by a hook and created nothing). A sibling project (`Git/jeevanpulse`) shows recent file changes and its own commits by your identity; this session did not touch it, but a modification time cannot prove who made a change.
- **Not verified (nothing is built):** every guarantee in the register; Chromium proxy, WebRTC and QUIC flags; worker denial (AC-46) and therefore worker-originated WebSocket prevention; DNS pinning and system-wide DNS observation (AC-38, AC-49); screenshot masking limits (AC-48); run-status immutability and crash recovery (AC-47); `sendBeacon` routing; independent outbound observation for AC-38; keychain access without a native module; redaction completeness; confirmation on real flaky targets; that `AGENT_ROLES.md` is not auto-loaded in a fresh session.
