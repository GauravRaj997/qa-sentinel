# QA Sentinel — Phase 0 Checklist

> Tracks decisions, completed work, open questions, risks and approvals for Phase 0 (foundation documents).
> **Phase 0 status: revision 11. APPROVED by the owner (Gaurav Raj) on 2026-11-17; the approval is recorded in §10. Phase 1 has not started and must not start until a Phase 1 plan is separately approved. The five release blockers (AC-22, AC-38, AC-39, AC-46, AC-49) remain unpassed: approving Phase 0 approves the documents and decisions only; it passes no gate, and every protective mechanism is still Designed only. No code, dependencies or target connection exists. Commit chain `ddbb7c6` → `4aa540c` → `7863d3a` → `7ae6732` → `20915d3` → `c5f48e5` → `9ad6f05` → `5659e22` → `02bb21b` → `97c59e9`; at the start of revision 11 `main`, `changes`, `origin/main` and `origin/changes` were identical at `97c59e9` (`changes` checked out). The GitHub repository is public and `UNLICENSED` (all rights reserved), as recorded in D-32. This document records only the observed state and makes no statement about the commit state of the revision 11 edits: a document cannot reliably contain the SHA of the commit that holds its own latest edits (details in §11).**
> Last updated: 2026-11-17 (revision 11: license and visibility wording resolved, Phase 0 decisions accepted, Phase 0 approved by the owner).

**Status legend:** ✅ done or approved (Phase 0 approved by the owner 2026-11-17) · 🟡 proposed (written, not approved; none remain among the Phase 0 decisions) · 🔬 needs a spike in a later phase · ❓ open question · ⛔ blocked / not allowed yet
**Assurance vocabulary:** Designed (documented only) · Implemented (code exists) · Tested (passing automated tests against a recorded commit) · Independently verified (independent review against a pinned commit). See `architecture.md` §0. **Nothing is above Designed.**

## 1. Deliverables

| # | File | Written (latest revision) | Cross-checked by script (rev. 10.1) | Approved |
|---|------|---------------------------|----------------------------------|----------|
| 1 | `Brain.md` | ✅ (edited; rev. 4: screenshot limit in principle 9, release note naming AC-46/38/49, glossary: run status, worker denial, DNS mode) | ✅ | ✅ approved 2026-11-17 |
| 2 | `prd.md` | ✅ (edited; rev. 4: FR-025 run status, FR-026 worker denial, FR-027 DNS, AC-46 to AC-49, narrowed AC-19/22/32/38) | ✅ | ✅ approved 2026-11-17 |
| 3 | `design_system.md` | ✅ (edited; rev. 4: RunStatusBadge, Errored state, screenshot masking note, `uncontrolled` coverage state) | ✅ | ✅ approved 2026-11-17 |
| 4 | `architecture.md` | ✅ (edited; new §5.1 audit-only, §7.9 guard modes, **§7.10 DNS and name resolution**; rev. 4 additions: §4 run status model and `workers`/`dnsMode`/`dnsPins` profile fields, §7.3 worker-denial mechanism, §7.8 limits, §11 screenshot masking limits and text-only scrubbing, §17 blocking items, §18 register of 32 entries incl. GR-31 and GR-32, §20 revision 4 open items; §10, §11, §17, §18 rewritten earlier) | ✅ | ✅ approved 2026-11-17 |
| 5 | `AGENT_ROLES.md` | ✅ (edited; rev. 4: run-status ownership, worker and screenshot rules, Reporter status display) | ✅ | ✅ approved 2026-11-17 |
| 6 | `PHASE_0_CHECKLIST.md` | ✅ (rewritten; rev. 11: header, §1, §2, §3 (D-32 and statuses), §5, §6, §8, §9 (R-29), §10 approval record, §11) | ✅ | ✅ approved 2026-11-17 |
| — | `README.md` | ✅ (status line) | ✅ | — |
| — | `PHASE_0_REVIEW_BUNDLE.md` (revision 11 bundle; not a deliverable) | ✅ | — | — |

"Cross-checked by script" means the mechanical review in §6. It is **not** an independent review and no row claims one. Independent review is recorded only as you reported it: the reviews of revision 4 (commit `4aa540c`), revision 5 (commit `7863d3a`) and revision 6 (commit `7ae6732`) revision 7 (commit `20915d3`), revision 8 (commit `c5f48e5`) and revision 9 (commit `9ad6f05`) found the four technical findings substantially addressed; the revision 5 review found the release-condition inconsistency, which revision 6 fixed and the revision 6 review accepted; the revision 6 review found the repository audit-trail inconsistency, which revision 7 fixed; the revision 7 review found one remaining audit-trail inconsistency (revision 7 was described as uncommitted and unpushed although it is committed and pushed as `20915d3`), fixed in revision 8; the revision 8 review found the same class of inconsistency again (revision 8 was described as uncommitted although it is committed and pushed as `c5f48e5`, and `main` was described as behind `changes`), fixed in revision 9; on your instruction after the revision 9 review, `main` was brought forward to the reviewed revision 9 (`9ad6f05`) and the audit trail updated in revision 10. No per-document independent sign-off is recorded, and no document is approved.

## 2. Revision 11: before/after change summary

**Revision 11 (approval revision).** Records the owner's instruction of 2026-11-17 (quoted in §10): resolve the repository visibility and license mismatch, accept or decide the §10 questions and decisions, and approve Phase 0. Documentation only. No acceptance criterion, requirement, release condition, technical limitation, architecture mechanism or register assurance level was changed; no gate was passed or waived. Phase 1 has not started; no dependency or code was added; no history was rewritten.

| Item | Before (revision 10.1, as committed in `97c59e9`) | After (revision 11) |
|------|---------------------------------------------------|---------------------|
| **Repository visibility and license** | D-32, Q-01, `Brain.md` NG5, `prd.md` NFR-014 and the `architecture.md` distribution row said "private", while GitHub reports the repository as public with no license | Owner decision: keep it public. Those places now say unpublished, `UNLICENSED` (all rights reserved), source repository public. D-32 revised, R-29 added. This session's attempt to set the repository private was denied by the permission classifier and was not retried; no GitHub setting was changed |
| **Owner decisions** | Q-01, Q-02, Q-03, Q-04, Q-08, Q-11, Q-13, Q-16, Q-17, Q-18, Q-22, Q-24, Q-25, Q-28, Q-29, Q-30 open; decision rows proposed | Q-01 decided; defaults accepted for the other fifteen. Q-16, Q-24 and Q-25 accepted as interim or deferred handling only. Every proposed decision row approved |
| **Approval** | "Approved by: pending"; §1 "awaiting you" | Recorded in §10 with the exact instruction and what is not approved; §1 shows the six documents approved |
| **Status lines** | "revision 10, pending approval" in six documents | "revision 11, approved by the owner on 2026-11-17" in all seven |
| **Release gates and assurance** | AC-22, AC-38, AC-39, AC-46, AC-49 unpassed; everything Designed | Unchanged: nothing waived, weakened or described as implemented or tested |
| **Regression checks** | Required "not approved" wording and the revision 10.1 git scope | Require the approval record, approved statuses and the new visibility wording; fail on any live "not approved" or "pending approval" claim; allow only the documented lines to differ from `97c59e9` in the six other documents; the gates, preview conditions and register stay byte-identical |

**Revision 10.1 and earlier (kept for history; the "Before" columns below describe the state before each revision).**

**Revision 10.1 (audit-trail correction only).** Only `PHASE_0_CHECKLIST.md` and `PHASE_0_REVIEW_BUNDLE.md` were edited. `Brain.md`, `prd.md`, `design_system.md`, `architecture.md`, `AGENT_ROLES.md` and `README.md` are byte-identical to the committed `5659e22` (checked by script). No acceptance criterion, requirement, design, release condition, technical limitation or register assurance level was changed; no history was rewritten and nothing was force-pushed. Phase 0 remains **not approved**; the five release blockers (AC-22, AC-38, AC-39, AC-46, AC-49) remain **unpassed**; Phase 1 has not started; no dependency or code was added.

| Item | Before (revision 10, as committed in `5659e22`) | After (revision 10.1) |
|------|------------------------------------------------|-----------------------|
| **Committed state of revision 10** | Header and §11 said revision 9 (`9ad6f05`) is the latest commit and the revision 10 edits are uncommitted | **Revision 10 is committed and pushed as `5659e22`** (parent `9ad6f05`; 8 Markdown files; author and committer Gaurav Raj, Claude only as a `Co-Authored-By` trailer). Eight commits in a line |
| **Branch pointers** | `main`, `changes`, `origin/main` and `origin/changes` described as all at `9ad6f05` | Observed at the start of revision 10.1: `HEAD`, `main`, `changes`, `origin/main`, `origin/changes` and the remote's `refs/heads/main`, `refs/heads/changes` and default `HEAD` all equal `5659e22`; `main...changes` is 0 behind and 0 ahead; working tree clean |
| **This session's git writes** | Two commands (push `9ad6f05` to `main`, fast-forward fetch of local `main`), no commit | Revision 10 round: those two commands, unchanged. Afterwards, each on your explicit instruction and none forced: "Commit and push" → `git add` of eight Markdown files, `git commit` (`5659e22`), `git push origin changes` (`9ad6f05..5659e22`); "Fast-forward main" → `git push origin changes:main` (`9ad6f05..5659e22`) and `git fetch origin main:main` (fast-forward only) |
| **Self-reference** | "A document cannot record the SHA of the commit that will contain it"; each round left its newest edits as a claim of being uncommitted, and the next round had to correct that | Documents record only the state observed at the start of the round and make **no claim about whether their own latest edits are committed**; the reason (a commit's SHA depends on the file content, so the file cannot contain it) and the commands to observe the live state are stated in §11 |
| **Historical records** | Revision 9 and earlier records | Preserved unchanged (revisions 3 to 9 summaries, and the revision 10 observation kept in §11 as a labelled historical bullet) |
| **Regression checks** | Required every ref to equal `9ad6f05` and a dirty tree if and only if the documents said the edits were uncommitted | Compare against eight commits with `5659e22` containing revision 10 and not `9ad6f05`; require the refs to be at or after `5659e22` (so a later commit does not make the record wrong); fail if any live text calls the revision 10 or 10.1 edits uncommitted or names a SHA for the commit holding its own edits; require the six other documents to equal `5659e22` byte for byte |

**Revision 10 (as committed in `5659e22`).**

Documentation-only (repository audit trail) plus one git action that you instructed. No acceptance criterion, requirement, design, release condition, technical limitation or register assurance level was changed. No history was rewritten and nothing was force-pushed. Phase 0 remains **not approved**; the five release blockers (AC-22, AC-38, AC-39, AC-46, AC-49) remain **unpassed**; Phase 1 has not started.

| Item | Before (revision 9, as committed in `9ad6f05`) | After (revision 10) |
|------|-----------------------------------------------|---------------------|
| **Git audit trail** | Said `c5f48e5` (revision 8) is the latest commit, `main` is checked out, all refs equal `c5f48e5`, and the revision 9 edits are uncommitted | Observed: seven commits; **revision 9 is committed and pushed as `9ad6f05`** (parent `c5f48e5`) on `changes` (checked out). At the start of revision 10 `main` and `origin/main` were 1 commit behind at `c5f48e5` |
| **`main` brought forward** | `main` and `origin/main` at `c5f48e5` | **On your explicit instruction** this session ran two git write commands: `git push origin 9ad6f05:refs/heads/main` (not forced, `c5f48e5..9ad6f05`) and `git fetch origin main:main` (fast-forward only). `main`, `changes`, `origin/main`, `origin/changes` and all three remote refs now equal `9ad6f05`. No commit, merge, branch creation, history rewrite, force-push or staging |
| **Statements about this session's git use** | \"Read-only git commands only\" | Exact: those two write commands, otherwise read-only; the checks verify the wording matches this |
| **Regression checks** | Compared the documents with six commits and `main` checked out | Compare against seven commits, `changes` checked out, all refs equal to `9ad6f05`, revision 9 contained in `9ad6f05` and not in `c5f48e5`, all four revisions' commits being ancestors of `main`, and require the two write commands to be named exactly; revision 9 wording fails the check |

Unchanged and re-verified: all 32 register entries are Designed (31) or not claimed (1); the acceptance criteria, the 0.1-preview conditions and every register row are byte-identical to revision 9; every limitation and open question is preserved.

### Previous: revision 9 before/after change summary (kept for history)

Documentation-only (repository audit trail). No acceptance criterion, requirement, design, release condition, technical limitation or register assurance level was changed. No history was rewritten, nothing was force-pushed, and no commit was made to make the documents look consistent.

| Review finding | Before (revision 8, as committed in `c5f48e5`) | After (revision 9) |
|----------------|-----------------------------------------------|--------------------|
| **Git audit trail** | Said the revision 8 edits are uncommitted, `20915d3` (revision 7) is the latest commit, `changes` is checked out, and `main` (`7863d3a`) is 2 commits behind and lacks revisions 6 and 7 | Observed facts only: six commits; **revision 8 is committed and pushed as `c5f48e5`** (parent `20915d3`); `main` is now checked out and `HEAD`, `main`, `changes`, `origin/main`, `origin/changes` and the remote's `main`, `changes` and default `HEAD` all equal `c5f48e5`, so `main` and `changes` are identical and `main` now contains revisions 6 to 8; the working tree was clean, nothing staged. Revision 7 (`20915d3`) is recorded as the previous commit and as the tip of `changes` at the start of revision 8. The revision 9 edits are uncommitted and unpushed, awaiting your decision |
| **Regression checks** | Compared the documents with five commits, `changes` checked out and ahead of `main` | Compare against six commits, all five local refs and the three remote refs equal to `c5f48e5`, `main` checked out, containment of each revision in its own commit (6 in `7ae6732`, 7 in `20915d3`, 8 in `c5f48e5`) and ancestry of all three in `main`; revision 8 wording (\"revision 8 edits are uncommitted\", `main` at `7863d3a` as current, `changes` ahead of `main`) fails the check |

Unchanged and re-verified: all 32 register entries are Designed (31) or not claimed (1); **AC-22, AC-46, AC-38, AC-39 and AC-49 remain unpassed**; the acceptance criteria, the 0.1-preview conditions and every register row are byte-identical to revision 8; every limitation and open question is preserved; Phase 1 has not started.

### Previous: revision 8 before/after change summary (kept for history)

Documentation-only (repository audit trail). No acceptance criterion, requirement, design, release condition, technical limitation or register assurance level was changed. No history was rewritten, nothing was force-pushed, and no commit was made to make the documents look consistent.

| Review finding | Before (revision 7, as committed in `20915d3`) | After (revision 8) |
|----------------|-----------------------------------------------|--------------------|
| **Git audit trail** | Said revision 7 edits are uncommitted and unpushed, `changes` is at `7ae6732`, and four commits exist | Observed facts only: five commits; **revision 7 is committed and pushed as `20915d3` on `changes`** (checked out; `HEAD` = `origin/changes` = remote `refs/heads/changes`; parent `7ae6732`); working tree was clean and nothing staged; `changes` is 2 commits ahead of `main` and 1 ahead of `7ae6732`; `main`, `origin/main` and remote `HEAD` stay at `7863d3a` and contain neither revision 6 nor revision 7. The revision 8 edits are uncommitted and unpushed, awaiting your decision |
| **Regression checks** | Compared the documents with the repository for four commits and a pending revision 7 | Compare against five commits, the new pointers, containment of revision 7 in `20915d3` and not in `7ae6732`, and the \"2 commits ahead\" fact; revision 7 wording (\"revision 7 edits are uncommitted\", \"`changes` at `7ae6732`\") fails the check |

Unchanged and re-verified: all 32 register entries are Designed (31) or not claimed (1); **AC-22, AC-46, AC-38, AC-39 and AC-49 remain unpassed**; the acceptance criteria, the 0.1-preview conditions and every register row are byte-identical to revision 7; every limitation and open question is preserved; Phase 1 has not started.

### Previous: revision 7 before/after change summary (kept for history)

Documentation-only (repository audit trail). No acceptance criterion, requirement, design, release condition or register assurance level was changed.

| Review finding | Before (revision 6, as committed in `7ae6732`) | After (revision 7) |
|----------------|-----------------------------------------------|--------------------|
| **Git audit trail** | Said `main`, `changes` and both `origin` branches all point at `7863d3a`, that `main` is the checked-out branch, and that revision 6 edits are uncommitted | Observed facts only: four commits; **revision 6 is committed and pushed as `7ae6732` on `changes`** (checked out; equals `origin/changes`); `main` and `origin/main` (and the remote default `HEAD`) are at `7863d3a` = revision 5, so `main` does **not** contain revision 6; working tree was clean at the start of revision 7; the revision 7 edits are uncommitted and not pushed, awaiting your decision. History was not rewritten and nothing was committed, pushed, branched or merged by this session |
| **Regression checks** | Documented git state compared with the repository by commit chain only | The documented branch pointers, checked-out branch, containing commit for each revision, and clean-tree/uncommitted statements are checked against the repository; wording from revision 6 (\"all branches at 7863d3a\", \"checked-out branch is `main`\", \"revision 6 edits are uncommitted\") fails the check |

Unchanged and re-verified: all 32 register entries are Designed (31) or not claimed (1); **AC-22, AC-46, AC-38, AC-39 and AC-49 remain unpassed**; the Release 0.1 and 0.1-preview conditions of revision 6 are untouched and the five acceptance criteria are byte-identical to revision 6; every limitation and open question is preserved; Phase 1 has not started.

### Previous: revision 6 before/after change summary (kept for history)

Documentation-only. No acceptance criterion, requirement, design or register assurance level was changed or weakened.

| Review finding | Before (revision 5) | After (revision 6) |
|----------------|---------------------|--------------------|
| **Release 0.1 preview conditions** | Several places said a 0.1-preview was available "only if L2 fails AC-39"; AC-38 and AC-49 (also mandatory L2/DNS criteria) and the L1 criteria AC-22 and AC-46 were not part of the condition | **One rule, stated identically everywhere (Brain §5, prd F3/FR-019/release table/usable test/AC-38/AC-44, architecture §7.7/§7.9/§17/GR-29, design_system, checklist D-15/D-36/Q-24):** the unqualified 0.1 requires all five of AC-22, AC-38, AC-39, AC-46, AC-49 and is blocked if any is unpassed. A preview is permitted only if (1) the blocker is AC-38, AC-39 or AC-49, (2) AC-22, AC-46 and every other preview criterion have passed, so if AC-22 or AC-46 is unpassed **nothing ships**, (3) the owner approves (Q-24), (4) it runs only in `l1_only`, (5) wording claims no containment, shows AC-38/39/49 as not evaluated and implies nothing about worker denial or worker-WebSocket control beyond recorded AC-22/AC-46 results |
| **Regression checks** | Five blockers checked in the release row and §17 only | New checks fail on any remaining "only if L2 fails" wording, require the five-criteria rule and the preview conditions in the same terms in every document, require AC-46 in the preview row and AC-44, and forbid preview wording that implies worker denial or WebSocket control |
| **Git description** | Two-commit state (`4aa540c`) | Three commits; `7863d3a` ("Bump Phase 0 docs to revision 5") is on `main`, `changes` and both `origin` branches; author and committer Gaurav Raj; Claude only as `Co-Authored-By` |

Unchanged and re-verified: all 32 register entries are Designed (31) or not claimed (1); **AC-22, AC-46, AC-38, AC-39 and AC-49 remain unpassed**; every unresolved limitation and open question is preserved; Phase 1 has not started.

### Previous: revision 5 before/after change summary (kept for history)

Documentation-only. No design, requirement, acceptance criterion or register entry was changed.

| Review finding | Before (revision 4) | After (revision 5) |
|----------------|---------------------|--------------------|
| **1. §11 git history** | "A git repository exists with one commit (`ddbb7c6`)" | Two commits: `main` at `ddbb7c6`; `changes` at `4aa540c` (revision 4, parent `ddbb7c6`); both on `origin`. Author and committer Gaurav Raj; Claude Sonnet 5.5 only as a `Co-Authored-By` trailer. Header, Q-01 and §11 agree; revision 5 edits are uncommitted |
| **2. §1 cross-review labels** | Column "Cross-reviewed (rev. 3)" | Column "Cross-checked by script (rev. 5)" with a note that this is not independent review; independent review is recorded only as you reported it for `4aa540c`; no approval implied |
| **3. §1 architecture description** | Mentioned §5.1 and §7.9 only | Lists §7.10 DNS and name resolution and the revision 4 additions (§4 run status and profile fields, §7.3 worker denial, §7.8, §11 screenshot limits, §17 blocking items, 32-entry register, §20); other documents' rows list their revision 4 additions |
| **4. Consistency check** | 119 checks | Re-run with new checks (git description, no independent-review overclaim, five blockers unpassed, no Implemented/Tested wording for worker denial, DNS containment or L2 enforcement); results in §6 |

Unchanged and re-verified: all 32 register entries are Designed (31) or not claimed (1); **AC-22, AC-46, AC-38, AC-39 and AC-49 remain unpassed**; every unresolved limitation and open question is preserved.

### Previous: revision 4 before/after change summary (kept for history)

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

"Proposed" = written into the documents, not approved by you (every Phase 0 decision was approved on 2026-11-17; see §10). *Directive* = from your instructions. Superseded entries keep their ID.

| ID | Decision | Selected | Alternatives | Reason | Consequences | Status |
|----|----------|----------|--------------|--------|--------------|--------|
| D-01 | Product independence | Standalone; no real target; synthetic fixtures only | Build against a first real app | Reusable product; no hidden coupling | Needs purpose-built fixtures (Q-11) | ✅ directive |
| D-02 | Stack | Node.js + TypeScript (strict), Playwright | Python, Go | Directive; one language across CLI/API/UI | Playwright browser downloads needed | ✅ directive |
| D-03 | Automation API | Playwright **library** in our runner | Playwright Test, Cypress, Selenium, Puppeteer | Control of records, guard, "never claim passed" | Rebuild retries/reporting | ✅ approved |
| D-04 | Spec format | Declarative JSON/YAML steps and assertions | TS scripts, Gherkin | Classifiable, hashable, freezable | Schema not yet designed | ✅ approved |
| D-05 | Store | SQLite + content-addressed files; driver by spike | Postgres, JSON files | Local-first, queryable | Append-only via triggers (not tamper-proof) | ✅ approved 🔬 P1 |
| D-06 | Monorepo | npm workspaces | pnpm, Turborepo | No extra tool | Looser isolation | ✅ approved |
| D-07 | Schemas | zod + JSON Schema export | TypeBox/Ajv | Ergonomic single source | Export fidelity unverified | ✅ approved |
| D-08 | CLI / API libs | commander / Hono (provisional) | parseArgs, yargs, Fastify | Small, common | Low impact | ✅ approved |
| D-09 | Dashboard stack | Deferred to Phase 5 spike: React+Vite vs HTMX | Next.js, SvelteKit | Resolves NFR-011 tension; early releases need none | Postponed | ✅ approved |
| D-10 | Integration | Versioned CLI `--json` + MCP; Claude Code first | Vendor SDKs | Core independent of any AI tool | JSON output is a public API | ✅ approved |
| D-11 | Audit baseline | Default-deny; A0–A1; safe methods; approved read-only POST rules; layered guard in two modes (D-21, D-36); audit-only defined by D-39 | Per-spec allowlist | Enforced independent of specs | Auth needs pre-provisioned session; side effects remain | ✅ approved (revised) |
| D-12 | Confirmation | **Superseded by D-26** | — | — | — | superseded |
| D-13 | Verification gating | **Superseded by D-27/D-40** | — | — | — | superseded |
| D-14 | Grants human-only | **Refined by D-25** | — | — | — | refined |
| D-15 | MVP scope | MVP complete = Release 1.0; Release 0.1 first usable **and requires full guard mode (AC-22, AC-38, AC-39, AC-46, AC-49)** | Audit-only MVP after Phase 3 | Brief requires authorization and verification; early value via D-29 | Long runway; preview only if L2 fails | ✅ approved (revised) |
| D-16 | Roadmap | Phases 0–8 per `Brain.md` §5 | Fewer, larger phases | Distinct approval points | Scope-creep risk R-06 | ✅ approved |
| D-17 | AI in MVP | None; see D-30 | LLM-first | Deterministic | No natural-language specs | ✅ approved |
| D-18 | Data location | `data/` in repo (gitignored, `QA_SENTINEL_HOME`), profiles in `config/targets/` | `~/.qa-sentinel` | Self-contained | Risk of committing evidence | ✅ approved |
| D-19 | Design system | System fonts, WCAG-checked tokens, visible mode/coverage/assurance/limits | Brand fonts, kit | Private, accessible | Plain look | ✅ approved |
| D-20 | `agents.md` name | **Superseded by D-35** | — | — | — | superseded |
| D-21 | Network isolation layers | L1 in-browser guard; L2 loopback egress proxy; L3 optional OS isolation. **L2 must pass AC-39 and AC-38 (including DNS) for the unqualified Release 0.1.** L2 cannot block a WebSocket to an allowed origin inside a TLS tunnel (D-45) | L1 only; MITM proxy; firewall only | Independent layers | L2 unproven for HTTPS, QUIC, loopback, DNS; fallback is a labelled preview, not 0.1 | ✅ approved 🔬 P2 (revised) |
| D-22 | Default-deny set | Origins, schemes, methods, WebSocket, WebRTC, service workers, downloads, permissions denied by default | Allow-then-block | Safer defaults | WebSocket apps partly untestable (R-21) | ✅ approved |
| D-23 | Read-only POST | Profile-listed rules, parsed bodies, in `policyHash` | Block all POST | Enables GraphQL | Needs human attestation; server side effects possible (D-39) | ✅ approved |
| D-24 | Profile policy lock | `policyHash` + human `ProfileApproval` before any run | Trust profile files | Stops silent widening | Friction; CI see D-42 | ✅ approved |
| D-25 | Authorization assurance | L1 TTY/dashboard confirmation, **not identity proof**; L2 post-1.0; grants bound to `policyHash` | Treat TTY as proof | Honest threat model | L1 does not resist same-user malware | ✅ approved |
| D-26 | Confirmation policy | Per-check ceilings, k, signatures, intermittent handling, client-only isolation | Single global rule | Honest per check | Signatures per check | ✅ approved |
| D-27 | Verification identity | **Renamed and refined by D-40** | — | — | — | refined |
| D-28 | Evidence lifecycle | Minimize → classify → redact where reliable → label → encrypt restricted → retain → tombstone → export limits (details D-37, D-38, D-41) | Store everything | Privacy first | Key handling (Q-18) | ✅ approved |
| D-29 | Release train | 0.1 Audit CLI; 0.2 verification; 0.3 dashboard; 0.4 adapters; 1.0 authorization last | Original order | Early usable audit-only release | Guard/policy must anticipate grants (R-17) | ✅ approved |
| D-30 | AI independence | Engine has no AI dependency (mechanically checked); AI only emits `Proposal`s; generated specs capped at `suspected` | Models in planner/analyst | Directive | No AI features in MVP | ✅ approved directive |
| D-31 | Assurance vocabulary | Designed / Implemented / Tested / Independently verified; Guarantee Register (30 entries); "guarantee" only at Tested+ | Informal claims | Directive | Upkeep | ✅ approved directive |
| D-32 | Distribution, source visibility and license (revised 2026-11-17) | Unpublished (packages marked `private`, no registry publishing); license `UNLICENSED` (all rights reserved, no `LICENSE` file); **source repository public on GitHub** (owner decision 2026-11-17, resolving the mismatch with the earlier "Private" wording) | Private repository; MIT/Apache-2.0 | The repository was observed to be public; the owner chose to keep it public and named no license, so the existing no-license state is recorded | Readers can read the design but have no right to reuse it; the documented weaknesses are visible (R-29); the owner may change visibility or add a license at any time | ✅ approved (revised) |
| D-33 | CLI binary name | `qa-sentinel` everywhere (including `design_system.md`) | `sentinel`, `qas` | Avoids npm name clash | Longer to type | ✅ approved |
| D-34 | NFR-011 scope | Minimal deps for core/CLI/runner/reporter; dashboard deps isolated | Blanket rule | Honest | Separate supply chain | ✅ approved |
| D-35 | Roles document name | `AGENT_ROLES.md` | Keep `agents.md`; add `CLAUDE.md` | Avoids `AGENTS.md` auto-load | Fresh-session check pending (R-07) | ✅ directive |
| D-36 | Guard modes and release labelling | `full` (L1+L2, default) vs `l1_only` (explicit `--guard l1-only`). The unqualified 0.1 requires **AC-22, AC-38, AC-39, AC-46 and AC-49 to pass and is blocked if any remains unpassed**. A **0.1-preview** (l1_only) is permitted only when AC-38, AC-39 or AC-49 cannot be passed **and** AC-22, AC-46 and every other preview criterion have passed **and** the owner approves (Q-24); if AC-22 or AC-46 is unpassed nothing ships. A preview claims no containment, shows AC-38/39/49 as not evaluated, and implies nothing about worker denial or worker-WebSocket control beyond recorded results. No silent downgrade; coverage table in `architecture.md` §7.9; conditions in §17 | Ship 0.1 L1-only with a footnote; make L2 optional; allow a preview whenever L2 fails AC-39 only | Directive from review: no equivalent-containment claim without tests; AC-38 and AC-49 are equally mandatory | Possible delay or no release; AC-38 and AC-49 need independent system-wide observation (Q-25) | 🟡 directive (revised)
| D-37 | Traces | Off by default for every run; `--trace` opt-in; **authenticated traces refused in Release 0.1**; unauthenticated opt-in traces `restricted`, `not_redacted`, encrypted, 7 days, never exported | Traces on failure; claim redaction of traces | Traces cannot be reliably redacted | Less debugging data on authenticated targets (R-24); tested handling strategy needed before ever enabling (Q-26) | ✅ approved directive |
| D-38 | Redaction vs encryption | Separate `redactionStatus` and `encrypted`; exact-value secret-removal claims (AC-19/32, GR-16) cover **only `redacted` text artifacts**, DB, logs, reports; screenshots are `partially_redacted` with no claim (D-44); AC-33 is storage-only | One combined "protected" notion | Prevent false assurance | More labels to maintain and display | ✅ approved directive (revised) |
| D-39 | Audit-only definition | No intentional, known state-changing actions; **not** state immutability; GET side effects, Set-Cookie sessions, read-only POST side effects, background work stated; every report carries the statement | "No mutations" wording | Accurate; avoids overclaiming | Users must read the limitation; fixture needs a state-changing GET (AC-41) | ✅ approved directive |
| D-40 | Build identity bases | `independently_attested` (reserved), `target_reported` (moderate, not proof), `operator_asserted` (low), `surfaceFingerprint` (low, fallback); default `minIdentityBasis` = `target_reported` in policy; result always shows basis and confidence | "Attested" naming; fingerprint-first | Honest strength; prefers explicit identity | Many results `inconclusive` unless target reports a build id | ✅ approved directive |
| D-41 | Evidence history | Evidence rows immutable; append-only, hash-chained evidence events; tombstone = event + artifact byte deletion only | Mutable `tombstone` field; row deletion | No silent mutation of history | More tables/logic; `doctor` checks chains | ✅ approved directive |
| D-42 | CI approval (interim) | CI requires a pre-approved workspace; fresh CI workspace refused (AC-45); no bypass | Committed approval file now | Safe until a reviewed mechanism exists | Limits CI adoption (R-19); mechanism open (Q-16) | ✅ approved directive |
| D-43 | HTML report accessibility | AC-42 in Release 0.1: axe, keyboard, no color-only meaning, contrast, zoom/reflow, print, manual SR pass | Test only the dashboard | Report ships a release earlier than the dashboard | Extra test fixtures | ✅ approved directive |
| D-44 | Artifact-type secret-removal claims and screenshot limits | Exact-value scrubbing is claimed only for text artifacts labelled `redacted`, the DB, logs and reports (listed encodings only). Screenshots are `partially_redacted` (configured selectors masked), with documented limits and **no secret-free claim**; AC-19/32 and GR-16 narrowed; AC-48 tests the labelling | Claim secret-free screenshots; pixel or OCR scrubbing now; blur whole pages | Selector masking cannot guarantee a secret is absent from pixels | Screenshots stay sensitive (restricted, encrypted, gated export, short retention); optional DOM pre-scan undecided (Q-28, R-28) | ✅ approved directive |
| D-45 | Worker-originated WebSocket enforcement | Deny dedicated and shared workers by default: constructor removal in every frame **plus** injected `worker-src 'none'` CSP; `workers: allow` is an approved policy choice and yields no claim; L2 acknowledged unable to block WebSockets to allowed origins; AC-46, GR-31; AC-22 narrowed; failure of AC-46 blocks the unqualified 0.1 | Filter with CSP `connect-src`; rely on L2; rely on Playwright routing for workers | L2 sees an opaque TLS tunnel; worker routing is undocumented | Targets using workers degrade; response-header injection is a target-visible change (R-27); unproven (Q-29) | ✅ approved directive 🔬 P2 |
| D-46 | Run status model | `running | completed | partial | aborted | errored` with `terminalReason`; terminal statuses immutable (trigger); `errored` = could not proceed or complete safely; unexecuted specs `not_run`; no confirmation rerun after guard failure; exit `4`; policy refusal creates no run; run-level `errored` distinct from spec-level; FR-025, AC-47, GR-32 | Keep three statuses and overload `aborted`; allow status edits | A guard failure is neither a user abort nor a budget stop | Trigger and crash-recovery logic to test (AC-47) | ✅ approved directive |
| D-47 | DNS modes and the scope of AC-38 | Only the proxy resolves. `dnsMode: pinned` (proposed default; pinned IPs, no resolver call, no DNS leaves the machine) or `system` (DNS may leave the machine; **cannot pass AC-38**; reported "not covered"). Independent system-wide observation with reserved-TLD canaries; AC-49; if no reliable method exists AC-38/49 stay unpassed and the unqualified 0.1 is blocked | Ignore DNS in AC-38; rely on guard logs; per-process socket listing only | An external resolver contradicts "only target and loopback"; resolver-daemon queries are invisible to per-process listing | Operators maintain pins; packet capture may need privileges (R-26, Q-25, Q-30) | ✅ approved directive 🔬 P2 |

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
| G-10 Distribution and license | Unpublished, `UNLICENSED`; repository public (owner decision 2026-11-17) | architecture §15; D-32 |
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

## 5. Work completed (revision 11, then 10.1, 10, 9, 8, 7, 6, 5, 4, 3)

**Revision 11**

- ✅ Repository visibility and license mismatch resolved by owner decision (keep public, `UNLICENSED`): D-32, G-10, Q-01, Q-09, `Brain.md` NG5, `prd.md` NFR-014 and the `architecture.md` distribution row updated; R-29 added.
- ✅ §10 questions and decisions accepted or decided as recorded in §3 and §8; Phase 0 approved by the owner on 2026-11-17 and recorded in §10; status lines of all seven documents updated.
- ✅ Regression checks updated (§6) and run against the live repository; fresh cross-document review.
- ✅ Constraints respected: no acceptance criterion, release condition, limitation, architecture mechanism or assurance level changed; AC-22, AC-38, AC-39, AC-46 and AC-49 remain unpassed; Phase 1 not started; nothing installed; no code; no real target; no git write command and no GitHub setting change by this session during revision 11.

**Revision 10.1**

- ✅ Audit trail corrected in `PHASE_0_CHECKLIST.md` (header, §1, §2, §5, §6, §11, Q-01) and the review bundle: revision 10 recorded as committed and pushed as `5659e22`; `main`, `changes`, `origin/main` and `origin/changes` recorded as identical at `5659e22` as observed at the start of revision 10.1; the revision 9 and earlier commit records preserved; the statement that revision 10 was not yet committed removed; the self-reference limit explained instead of claiming a final SHA.
- ✅ Regression checks updated (§6) and run against the live repository; fresh cross-document review.
- ✅ Constraints respected: only the checklist and the bundle were edited; no acceptance criterion, release condition, limitation, architecture or assurance level changed; Phase 1 not started; nothing installed; no code; no real target; no git write command by this session during revision 10.1.

**Revision 10**

- ✅ `main` brought forward to the reviewed revision 9 (`9ad6f05`) on your instruction: one non-forced fast-forward push and one fast-forward-only local update; audit trail updated in the header, Q-01 and §11; regression checks updated; fresh cross-document review (§6). Constraints respected during the revision 10 round: Phase 1 not started; nothing installed; no code; no real target; no commit, merge, branch, history rewrite or force-push by this session (the commit `5659e22` was made afterwards, on your instruction; see §11).

**Revision 9**

- ✅ Git audit trail corrected in the header, Q-01 and §11 from observed facts (revision 8 is on `main` and `changes` at `c5f48e5`; revision 7 is `20915d3`, the previous commit); regression checks updated; fresh cross-document review (§6). Constraints respected: Phase 1 not started; nothing installed; no code; no real target; no git write command, history rewrite, force-push or extra commit by this session.

**Revision 8**

- ✅ Git audit trail corrected in the header, Q-01 and §11 from observed facts (revision 7 is on `changes` at `20915d3`; `main` at `7863d3a`); regression checks updated; fresh cross-document review (§6). Constraints respected: Phase 1 not started; nothing installed; no code; no real target; no git write command, history rewrite, force-push or extra commit by this session.

**Revision 7**

- ✅ Git audit trail corrected in the header, Q-01 and §11 from observed facts (revision 6 is on `changes` at `7ae6732`; `main` is at `7863d3a`); regression checks added; fresh cross-document review (§6). Constraints respected: Phase 1 not started; nothing installed; no code; no real target; no git write command, history rewrite or push by this session.

**Revision 6**

- ✅ Release 0.1 / 0.1-preview conditions made identical across Brain §5, prd, architecture §7.7/§7.9/§17/GR-29, design_system and the checklist; regression checks added; git description updated to three commits.
- ✅ Fresh cross-document review (§6). Constraints respected: Phase 1 not started; nothing installed; no code; no real target; no git write command by this session.

**Revision 5**

- ✅ §11 git history, header and Q-01 corrected to the two-commit state with author versus co-author kept distinct.
- ✅ §1 deliverables table relabelled (script cross-check, no independent-review claim) and architecture/other descriptions extended with the revision 4 additions including §7.10.
- ✅ Fresh cross-document review with new guard checks (§6). Constraints respected: Phase 1 not started; nothing installed; no code; no real target; no git write command by this session.

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

## 6. Cross-review results (revision 10)

**Method.** The mechanical review script (`xreview.py`, kept in the session scratchpad, not part of the project) was updated for the observed repository state and re-run across all seven documents and the folder, together with every earlier check (stale terms, acceptance-criteria and release-table coverage, register counts and statuses, ID and section references, wording chains for traces, redaction, audit-only, identity, run status, screenshots, workers, DNS, the release and preview conditions, filesystem safety). This is a script check, **not** an independent review.

**Revision 10.1 run:** 159 checks, 0 failed (the documents committed as `97c59e9`).

**Checks updated or added (revision 11), run against the live repository:**
- Ten commits with their parent links, author and committer (Gaurav Raj) and the `Co-Authored-By` trailer match the documentation; `97c59e9` has parent `02bb21b` and `02bb21b` has parent `5659e22`; the refs each equal `97c59e9` or descend from it.
- All seven documents say revision 11 and "approved by the owner on 2026-11-17" in their status line; no live text says Phase 0 is \"not approved\", \"pending approval\" or \"awaiting you\".
- The §10 approval record names the approver, the date, the instruction, what the record does not approve, and ticks every item; every question in the approval list is recorded as decided or accepted; every proposed decision row is approved.
- The public/private mismatch is gone: no live text calls the distribution or repository \"private\" (only packages marked `private`), and D-32, Q-01, `Brain.md` NG5, `prd.md` NFR-014, the `architecture.md` distribution row and R-29 agree that the repository is public and `UNLICENSED`.
- The six other documents differ from the committed `97c59e9` only in the status line and the three distribution lines; AC-22, AC-38, AC-39, AC-44, AC-46, AC-49, the 0.1-preview conditions and every Guarantee Register row are byte-identical to revision 10.1.
- AC-22, AC-38, AC-39, AC-46 and AC-49 are still listed as unpassed in every document that lists them, and no guarantee is above Designed.
- The §11 revision 11 bullet carries the ten commits, the identical refs, every git write by this session in all rounds, the repository visibility observation and the denied visibility change.

**Revision 11 development of the checks.** Four defects were found on the way and are disclosed. (1) My first patch to the checker aborted without writing because an anchor line was indented; I fixed the lookup and re-ran. (2) The first full run failed six checks that were stale expectations or my own wording: the register count (now 29 risks), two checks that required the old \"revised\" status markers on Q-24 and Q-25 (replaced by stronger checks that require the accepted-with-limits wording), a 0.1-preview line in the new approval table that lacked a conditioning qualifier (the document was wrong; I added the qualifier), and a stale-approval pattern that matched the case-insensitive phrase \"Not approved by this record\" (the pattern is now case-sensitive for the uppercase form). (3) The revision 11 §11 bullet used escaped quotes where the checker expected plain ones; I unescaped them. (4) A planted regression (a SHA claimed for the commit holding revision 11) was first missed because the stale-claim pattern covered revision 10.1 only; it now covers revision 11 too. No check was weakened to pass; checks whose expectation was obsolete were replaced by stricter ones.

**Revision 11, run: 168 checks, 0 failed.**

**Mutation test (revision 11).** Sixteen planted regressions were each caught: the header saying Phase 0 is not approved again; the README status back to pending approval; `Brain.md` NG5 back to a private distribution; D-32 losing the public-repository statement; the approval item left unticked in §10; \"any release gate\" dropped from the not-approved row; one document shown as awaiting approval in §1; a decision row (D-05) left proposed; Q-02 back to unconfirmed; Q-24 claiming a preview is approved; the header saying the five blockers have passed; the header claiming a SHA for its own commit; the denied visibility change dropped from §11; R-29 removed; `architecture.md` edited beyond the allowed lines; AC-38 weakened in `prd.md`. **Positive control:** committing the revision 11 edits on top of `97c59e9` in a throw-away copy leaves every check passing.

**Earlier runs and checks, kept for history (revision 10.1, then revision 10; they described the state before each revision and the checks above replace them):**

**Revision 10 run:** 157 checks, 0 failed (the documents committed as `5659e22`; the revision 10 checks are kept below as history).

**Checks updated or added (revision 10.1, historical), run against the live repository:**
- Eight commits with their parent links, author and committer (Gaurav Raj) and the `Co-Authored-By` trailer match the documentation; `5659e22` has parent `9ad6f05`; `5659e22` carries revision 10 content in the six other documents and `9ad6f05` does not.
- The refs are consistent with the record without fixing the tip: `main`, `changes`, `origin/main` and `origin/changes` each equal `5659e22` or descend from it, and `git ls-remote origin` agrees with the local remote-tracking refs. A commit made after `5659e22` therefore does not make the record wrong.
- No live text claims that the revision 10 or revision 10.1 edits are not yet committed, and no live text names a SHA for the commit that holds revision 10.1; the self-reference limit is stated in §11.
- The six other documents (`Brain.md`, `prd.md`, `design_system.md`, `architecture.md`, `AGENT_ROLES.md`, `README.md`) are byte-identical to `5659e22` (read from git), so revision 10.1 touched no acceptance criterion, release or preview condition, architecture text, limitation or register row.
- The §11 revision 10.1 bullet carries the eight commits, the refs, the exact git writes of this session (both rounds), the `main...changes` comparison and the self-reference explanation; the revision 10 observation is kept as a labelled historical bullet.

**Revision 10.1, development of the checks.** Four defects were found on the way and are disclosed. (1) My patch to the checker left an indentation error, which I repaired and re-ran. (2) The mutation harness first reported every planted regression as caught partly because one check (the transcript scope check) compares session Write paths with the project root and therefore fails in a temp copy; the harness now ignores that single check, and the real run still includes it. (3) Two planted regressions were first missed: one anchor occurred twice and hit the §2 history instead of §11, and a Q-01 check passed because the new commit id also appeared elsewhere in that row; the mutation now targets §11 and the check requires the commit chain itself. (4) The new stale-claim patterns found one real stale sentence in the old "Semantic review" paragraph (it still said the revision 10 edits were not committed) and one in my own §5 wording; both were rewritten. One blanket clause ("the word uncommitted appears nowhere in live text") was replaced by specific patterns, because the blanket form also matched the checklist's own quoted history; the specific patterns are exercised by the mutation test. No check was otherwise weakened to pass.

**Revision 10.1, run: 159 checks, 0 failed.**

**Mutation test (revision 10.1).** Eleven planted regressions were each caught: the header saying the revision 10 edits are uncommitted again; the header claiming a SHA for the commit that holds revision 10.1; the sentence disclaiming the edits' own commit state removed from §11; the self-reference explanation removed; §11 saying the refs equal the old tip `9ad6f05`; the push to `main` dropped from the git-write record; the `main...changes` branch comparison dropped; `5659e22` removed from the Q-01 chain; the revision 8 commit removed from the header chain; `README.md` edited after `5659e22`; AC-38 weakened in `prd.md`. **Positive control:** committing the revision 10.1 edits on top of `5659e22` in a throw-away copy leaves every check passing, so a later commit does not make the record wrong.

**Revision 10 checks, kept for history (they described the state before `5659e22`; the revision 10.1 checks above replace them):**

- Seven commits, their parent links, author and committer (Gaurav Raj) and the `Co-Authored-By` trailer matched the documentation; `HEAD` was on `changes`; `HEAD`, `main`, `changes`, `origin/main` and `origin/changes` all equalled `9ad6f05`; `git ls-remote origin` agreed (`refs/heads/main`, `refs/heads/changes` and remote `HEAD` all `9ad6f05`).
- Repository evidence that revision 6 is in `7ae6732`, 7 in `20915d3`, 8 in `c5f48e5` and 9 in `9ad6f05` (each absent from its parent), that all four are ancestors of `main`, and that `main` and `changes` are 0 commits ahead and 0 behind.
- The §11 bullet carries every required fact, **including the historical records** (`20915d3`, revision 7, the tip of `changes` at the start of revision 8; `c5f48e5`, revision 8, the tip of `main` and `origin/main` at the start of revision 10) and the exact wording of this session's git writes.
- **This session's git writes are stated exactly:** on the user's explicit instruction, `git push origin 9ad6f05:refs/heads/main` (not forced, fast-forward `c5f48e5..9ad6f05`) and `git fetch origin main:main` (fast-forward only), and nothing else; the earlier \"read-only only\" wording fails the check.
- The documented working-tree status matched the tree at that time, and nothing was staged.
- No live document carries the stale claims (`main` at `7863d3a` or `c5f48e5` as current, `main` checked out, `main` moved outside this session, revision 6 to 9 uncommitted).
- No acceptance criterion changed (AC-22, AC-38, AC-39, AC-44, AC-46, AC-49 byte-identical to revision 9); the 0.1-preview conditions in `architecture.md` §17 and every Guarantee Register row are byte-identical to revision 9.

**Revision 10, development of the checks.** Three defects were fixed on the way and are disclosed: a patch to the checker mis-matched a bracket and left a syntax error, which I repaired and re-ran; an obsolete stale-claim pattern also matched the now-correct wording that lists the four refs, so it was narrowed to the actual stale claims (\"all equal `7863d3a`\" and the like); and a sentence \"one commit behind\" tripped the \"repository has one commit\" check, so the wording became \"1 commit behind\". No check was weakened to pass.

**Revision 10, run: 157 checks, 0 failed.**

**Mutation test.** Ten planted regressions were each caught: the \"read-only only\" claim restored (which would hide the push); the push command not named; \"not forced\" dropped; the revision 9 \"uncommitted\" claim restored; \"all equal `c5f48e5`\" restored; \"`main` moved outside this session\" restored; the newest commit id removed from Q-01; the revision 8 history removed; a Guarantee Register row weakened; AC-38 changed.

**Limit of this check.** The documentation describes the repository as observed at the start of the round. A document cannot reliably contain the SHA of the commit that holds its own latest edits (the SHA is computed from the file content, so writing it into the file changes the SHA), and revision 10.1 therefore makes no claim about the commit state of its own edits; the checks fail, as intended, if the recorded history, the refs or the other documents disagree with the repository, and they stay valid after later commits because they test containment and ancestry, not a fixed tip.

**Final run (revision 11): 168 checks, 0 failed.**

```
INFO  approval list also includes later-phase question(s) deliberately: ['Q-16'] (Q-16 is Phase 3, but its interim default D-42 is part of Phase 0 approval)
INFO  a git repository exists in qa-sentinel. It was NOT created by this session (this session ran only read-only git commands). Commits: ['97c59e9 Gaurav Raj 2026-11-16 20:28:30 +0530 Label §1 cross-check column as revision 10.1', '02bb21b Gaurav Raj 2026-11-16 20:03:55 +0530 Correct Phase 0 audit trail (revision 10.1)', '5659e22 Gaurav Raj 2026-11-16 15:53:18 +0530 Bump Phase 0 docs to revision 10', '9ad6f05 Gaurav Raj 2026-11-16 15:44:57 +0530 Bump Phase 0 docs to revision 9', 'c5f48e5 Gaurav Raj 2026-11-16 15:37:25 +0530 Bump Phase 0 docs to revision 8', '20915d3 Gaurav Raj 2026-11-16 15:31:07 +0530 Bump Phase 0 docs to revision 7', '7ae6732 Gaurav Raj 2026-11-16 13:36:20 +0530 Bump Phase 0 docs to revision 6', '7863d3a Gaurav Raj 2026-11-16 13:24:20 +0530 Bump Phase 0 docs to revision 5', '4aa540c Gaurav Raj 2026-11-16 13:14:20 +0530 Update project docs', 'ddbb7c6 Gaurav Raj 2026-11-16 11:28:13 +0530 Initial commit']
INFO  sibling project file changed recently (mtime only; cannot show who changed it): ('Git', '/Users/roop/Desktop/myProjects/Git/jeevanpulse/clinic/media/.staging/.import-worker-heartbeat')
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
PASS  no stale term: revision 4, pending approval
PASS  no stale term: revision 5, pending approval
PASS  no stale term: revision 6, pending approval
PASS  no stale term: revision 7, pending approval
PASS  no stale term: revision 8, pending approval
PASS  no stale term: revision 9, pending approval
PASS  no stale term: revision 10, pending approval
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
PASS  checklist defines R-01..R-29
PASS  checklist defines G-01..G-16
PASS  every D/Q/R/G id referenced anywhere is defined in the checklist
PASS  every unresolved question needed by Phase 0, 1 or 2 is in the approval list
PASS  approval list names only defined questions, each recorded as decided or accepted on 2026-11-17
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
PASS  all seven docs say revision 11 and that Phase 0 is approved by the owner on 2026-11-17 in their status line
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
PASS  Q-25 is accepted only as a deferred Phase 2 spike decision and Q-30 is defined (default pinned)
PASS  R-26, R-27, R-28 defined and R-25 revised
PASS  D-44..D-47 defined; D-21/36/38 revised
PASS  unverified Chromium DNS flags are labelled unverified in arch §7.10 and §20
PASS  design_system GuardCoveragePanel covers workers, DNS mode and `uncontrolled`
PASS  no live checklist text claims 'no git repository' (one exists, created by the user)
PASS  README and the six documents do not claim the absence of git
PASS  §1 deliverables table is labelled as script cross-check for revision 5 and keeps no 'rev. 3' label
PASS  §1 makes no independent-review claim for any document (each mention is a negation or attributed to the user's report)
PASS  §1 architecture row lists §7.10 DNS and name resolution and the revision 4 additions
PASS  §1 marks the six deliverable documents approved on 2026-11-17 and no 'awaiting you' remains
PASS  revision 5 summary exists, is documentation-only, and keeps the blockers unpassed
PASS  no document claims worker denial, DNS containment or L2 enforcement is implemented, tested, verified or passed
PASS  no document marks AC-22, AC-46, AC-38, AC-39 or AC-49 as passed
PASS  the five blockers are still described as unpassed in prd and architecture
PASS  no remaining 'preview only if L2 fails' wording (the old, incomplete condition)
PASS  unqualified 0.1 is blocked if any of the five is unpassed: Brain §5, prd release row, prd usable test, architecture §17, D-36
PASS  prd and architecture preview rows: blocker is AC-38/39/49, AC-22 and AC-46 required, owner approval
PASS  architecture §17 defines five numbered preview conditions covering blocker, L1 criteria, owner, l1_only and wording
PASS  preview conditions agree across Brain, prd FR-019, checklist D-36/Q-24 (blocker set, L1 criteria, owner, nothing ships when AC-22/AC-46 unpassed)
PASS  AC-44 shows AC-38, AC-39 and AC-49 as not evaluated and forbids implying worker denial was tested or worker WebSockets are controlled
PASS  FR-019, GR-29, §7.9 mode row, release rows and design_system list AC-38, AC-39 and AC-49 as not evaluated
PASS  no preview line mentions workers without a limiting qualifier
PASS  no line says a preview gives full containment, equivalent guard coverage, tested worker denial or controlled worker WebSockets
PASS  every line naming the 0.1-preview carries a conditioning qualifier
PASS  Q-24 is accepted with the owner decision kept for the Phase 2 end point (no preview pre-approved) and D-36 is marked revised
PASS  no acceptance criterion weakened: AC-22, AC-39, AC-46, AC-49 byte-identical to revision 5; AC-38 differs only by the added 'like AC-39 and AC-49' clause
PASS  AC-44 only gained requirements (every revision 5 clause still present)
PASS  no live document carries the stale git claims (main at 7863d3a or c5f48e5 as current, main checked out, main moved outside this session, revision 6 to 10.1 uncommitted, a SHA claimed for the commit holding revision 10.1, all refs at 9ad6f05 as current)
PASS  no live text (header, §5 onwards, the six other documents) claims that Phase 0 still awaits approval; earlier statements survive only as dated history
PASS  §10 approval record: four items ticked and none open; approver Gaurav Raj, date 2026-11-17, the owner's instruction quoted, the visibility answer, what is NOT approved (Phase 1, every gate, assurance above Designed, any 0.1-preview), and that no re-review is recorded
PASS  no decision row is left proposed (🟡) and 38 decision rows were approved with the documents
PASS  the public/private mismatch is resolved: no live text calls the distribution or the repository private; D-32, Q-01, Brain NG5, prd NFR-014 and the architecture distribution row agree (unpublished, `UNLICENSED`, repository public) and R-29 records the exposure
PASS  approval did not pass, waive or weaken any gate: the header lists AC-22, AC-38, AC-39, AC-46 and AC-49 as remaining unpassed and says the approval passes no gate; no live text calls any of them passed, met or waived
PASS  documents state that revision 11 is approved by the owner, the ten-commit chain, that the refs pointed at `97c59e9`, that revision 11 makes no claim about its own commit state, and why
PASS  the revision 10 and 10.1 git records are preserved as labelled history (5659e22 committed with refs identical; revision 10.1 makes no claim about its own commit state)
PASS  this session's git writes are stated exactly for both rounds (revision 10: push 9ad6f05 to main and fast-forward fetch; after it, on instruction: add, commit 5659e22, push changes, push changes:main, fast-forward fetch), none forced, none during revisions 10.1 (while being written) or 11; the label-correction commit and its push; no other 'pushed/committed' claim
PASS  revision 11 changed no acceptance criterion: AC-22, AC-38, AC-39, AC-44, AC-46, AC-49 byte-identical to revision 10.1
PASS  revision 11 left the 0.1-preview conditions (architecture §17) byte-identical to revision 10.1
PASS  revision 11 left every Guarantee Register row byte-identical to revision 10.1
PASS  actual git state matches the documentation: the ten recorded commits with their parent links, author=committer=user, Claude only as Co-Authored-By, and 97c59e9 an ancestor of (or equal to) HEAD, main, changes, origin/main and origin/changes (so a later commit does not falsify the record)
PASS  repository evidence: revision 6 is in 7ae6732, 7 in 20915d3, 8 in c5f48e5, 9 in 9ad6f05, 10 in 5659e22 (each not in its parent); all five are ancestors of main; at the time of the record main and changes were 0 behind and 0 ahead (checked only while HEAD is 97c59e9)
PASS  working-tree changes, if any, are confined to the seven documents and PHASE_0_REVIEW_BUNDLE.md (revision 11 scope), nothing is staged, 
PASS  the six documents other than the checklist and the bundle differ from the committed 97c59e9 only in the status line and the distribution wording (README 1 line, Brain NG5, prd NFR-014, architecture distribution row); nothing else changed
PASS  git ls-remote origin agrees with the local origin/main and origin/changes, which equal or descend from 5659e22 (at the recorded state all three remote refs were 5659e22)
PASS  checklist §11 historical (revision 10) git bullet names both commits, parent link, author/committer versus Co-Authored-By, branches, and read-only git use
PASS  no live document says the repository has one/a single commit (checklist header and live sections, other docs)
PASS  checklist §11 revision 10.1 git bullet names the eight commits, 5659e22 with parent 9ad6f05, the identical refs and remote refs, the branch comparison, author/committer versus Co-Authored-By, the exact git writes, and the self-reference explanation
PASS  checklist §11 revision 11 bullet names the ten commits, 97c59e9 with parent 02bb21b, the identical refs and remote refs, the branch comparison, author/committer versus Co-Authored-By, every git write of this session, the visibility observation and the denied visibility change
PASS  checklist header, Q-01 and the §11 revision 11 bullet agree on all ten commit ids
PASS  checklist header, Q-01 and §11 agree on the commit ids (eight, including 5659e22)
PASS  no code or dependency artifacts in qa-sentinel (only .md files plus .gitignore; no node_modules)
PASS  config/targets, tests, reports are still empty
PASS  no Write/Edit this session issued targeted a sibling project, and no stray-path attempt created a file

TOTAL: 168 checks, 0 failed
```

**Semantic review (manual re-read, revision 11).** The header, §1, §2, §3 (D-32), §5, §8 (Q-01 and the accepted defaults), §9 (R-29), §10 and §11 now say one thing: the repository is public and `UNLICENSED` (all rights reserved) by owner decision; the §10 questions and decisions are decided or accepted as recorded; and Phase 0 was approved by the owner on 2026-11-17. The approval approves the documents and decisions only: AC-22, AC-38, AC-39, AC-46 and AC-49 remain unpassed, every guarantee is still Designed, Q-16, Q-24 and Q-25 are accepted only as interim or deferred handling, no 0.1-preview is approved, and Phase 1 has not started. No technical content changed.

**Previous semantic review (revision 10.1, kept for history).** The header, Q-01, §1 note, §2 summary, §5 and §11 now say one thing: revision 10 is committed and pushed as `5659e22` (parent `9ad6f05`); `main` was brought forward to it on your instruction by a non-forced fast-forward push plus a fast-forward-only local update, and at the start of revision 10.1 `main`, `changes`, `origin/main` and `origin/changes` were identical at `5659e22`; revision 9 (`9ad6f05`), revision 8 (`c5f48e5`) and revision 7 (`20915d3`) are preserved as history; the documents make no claim about the commit state of the revision 10.1 edits and explain why (a document cannot reliably contain the SHA of the commit that holds its own latest edits). At that time Phase 0 was not yet approved, the five release blockers were unpassed, and Phase 1 had not started. No technical content changed; the six other documents are byte-identical to `5659e22`.

**Previous semantic review (revision 10, kept for history; it described the state before `5659e22`).** The header, Q-01, §1 note, §2 summary, §5 and §11 now say one thing: revision 9 is committed and pushed as `9ad6f05`; `main` was brought forward to it on your instruction by one non-forced fast-forward push plus a fast-forward-only local update; `main`, `changes`, `origin/main` and `origin/changes` all equalled `9ad6f05` at that time; revision 8 (`c5f48e5`) and revision 7 (`20915d3`) are preserved as history; the revision 10 edits were not yet committed at that time. At that time Phase 0 was not yet approved, the five release blockers were unpassed, and Phase 1 had not started. No technical content changed.

**Remaining weaknesses the review could not close** are listed in §8 (open questions) and in `architecture.md` §20. Every register entry is still Designed; worker denial, the DNS design, screenshot masking limits, run-status immutability and crash recovery are untested; AC-22, AC-46, AC-38, AC-39 and AC-49 remain unpassed.

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
| Q-01 | Git already exists: `ddbb7c6` → `4aa540c` → `7863d3a` → `7ae6732` → `20915d3` → `c5f48e5` → `9ad6f05` → `5659e22` (revision 10) → `02bb21b` and `97c59e9` (revision 10.1), all commits by your identity; on your instruction this session fast-forwarded `main` to each reviewed revision (non-forced pushes plus fast-forward-only local updates), and at the start of revision 11 `main`, `changes`, `origin/main` and `origin/changes` were identical at `97c59e9`. Repository visibility and license: GitHub reports the repository as **public** with no license, which contradicted the earlier "private" wording. **Decision (2026-11-17, owner):** keep this history and branch layout; the repository stays **public**; license `UNLICENSED` (all rights reserved, no `LICENSE` file). You did not name a license, so the existing no-license state is recorded; it grants nothing and you may change it, or make the repository private, at any time | Keep it; public repository; `UNLICENSED` | Phase 1 | ✅ decided 2026-11-17 |
| Q-02 | Windows support level | Best-effort, restricted capture disabled without app-level encryption | Phase 1 | ✅ default accepted 2026-11-17 |
| Q-03 | Node policy | `engines >=22` *(Phase 1 compatibility note, 2026-11-17: the pinned toolchain (Vitest 5.1.0, Vite, rolldown) supports `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`, which is now the `engines` range in the root `package.json`; toolchain compatibility only; no assurance level, release gate or SQLite decision is affected)* | Phase 1 | ✅ default accepted 2026-11-17 |
| Q-04 | Allow a login `POST` in audit mode? | No; pre-provisioned session | Phase 2 | ✅ default accepted 2026-11-17 |
| Q-05 | Fingerprint sufficiency | **Resolved**: fallback only, low confidence (D-40) | — | ✅ |
| Q-06 | Confirmation `k` | **Resolved**: per-check, default 2 (D-26) | — | ✅ |
| Q-07 | Severity policy (rule defaults + audited human override vs human-only) | Rule defaults + override | Phase 3 | ❓ |
| Q-08 | MVP detection bar (90% of detectable; plus held-out set) | 90% + held-out | Phase 1 | ✅ default accepted 2026-11-17 |
| Q-09 | Registry naming | **Mostly resolved**: unpublished, `UNLICENSED`, repository public (D-32) | — | ✅ |
| Q-10 | CLI binary name | **Resolved by default**: `qa-sentinel` (D-33) | — | ❓ confirm |
| Q-11 | Fixtures (two stacks; behaviors include WebSocket from page and worker, WebRTC, QUIC, download, GraphQL, service worker, redirect, off-scope canary server, injection, version/identity switch, flaky behavior, state-changing GET, instrumented mutation counters) | Node demo-shop + second app on another stack | Phase 1 | ✅ default accepted 2026-11-17 |
| Q-12 | Claude Code kit naming | `/qa-sentinel:*` | Phase 3 | ❓ |
| Q-13 | Retention defaults (90/30/7 days; 180-day cap) | As written | Phase 2 | ✅ default accepted 2026-11-17 |
| Q-14 | First CI system for examples | Generic exit-code docs | Phase 3 | ❓ |
| Q-15 | High-contrast theme | Honor `prefers-contrast` only | Phase 5 | ❓ |
| Q-16 | Reviewed CI approval mechanism (for example a committed approval file pinning `policyHash` at a lower, labelled assurance level) | **Interim: CI requires a pre-approved workspace; fresh workspace refused (D-42)** | Phase 3 | ✅ interim default accepted 2026-11-17; the CI approval mechanism is still open (Phase 3) |
| Q-17 | Default-deny WebSocket acceptable, or should `observe` be default? | Deny | Phase 2 | ✅ default accepted 2026-11-17 |
| Q-18 | Evidence key storage: OS keychain via CLI tools vs passphrase; headless Linux/CI behavior | Keychain tool, else passphrase | Phase 2 | ✅ default accepted 2026-11-17 |
| Q-19 | Preferred L2 approval method (passkey, OS prompt, separate OS user) | Decide before Phase 7 design | Phase 7 | ❓ |
| Q-20 | Default `minIdentityBasis` | **`target_reported`** (revised from `operator_asserted`); lowering it is an approved profile choice | Phase 4 | ❓ confirm |
| Q-21 | Who may attest read-only POST rules; is `custom-allowlist` needed in 0.1? | Profile owner; GraphQL only in 0.1 | Phase 3 | ❓ |
| Q-22 | Confirm the reordered release train (authorization last, Release 1.0) | As written | Phase 0 approval | ✅ default accepted 2026-11-17 |
| Q-23 | Is L2 mandatory for Release 0.1? | **Resolved by D-36**: mandatory for the unqualified 0.1; an L1-only run is only a labelled preview | — | ✅ (confirm via D-36) |
| Q-24 | If the unqualified 0.1 is blocked at the end of Phase 2 because AC-38, AC-39 or AC-49 cannot be passed (and AC-22, AC-46 and the other preview criteria have passed), should a labelled 0.1-preview in `l1_only` mode be released at all, or should 0.1 be held? (If AC-22 or AC-46 is unpassed nothing ships.) | Owner decides at that point; no preview without approval | Phase 2 | ✅ default accepted 2026-11-17: the decision stays with the owner at that point; no preview is pre-approved |
| Q-25 | How is AC-38's independent, system-wide outbound observation (packet capture or an isolated namespace, covering TCP, UDP, QUIC **and DNS**, for all run processes and resolver processes acting for them) done on each OS? Is it practical without privileged tools? Per-process socket listing is not sufficient for DNS (§7.10) | Decide in the Phase 2 spike; if impractical, AC-38 and AC-49 stay unpassed and 0.1 is not unqualified | Phase 2 | ✅ default accepted 2026-11-17: the Phase 2 spike decides; AC-38 and AC-49 stay unpassed until it passes |
| Q-26 | Is there any acceptable tested strategy for authenticated traces (strip payloads, screenshots-only), or should they never exist? | None; authenticated traces stay unavailable | post-1.0 | ❓ **new** |
| Q-27 | Should an `independently_attested` mechanism (verifiable signed build attestation) ever be designed? | No; the basis name is reserved only | post-1.0 | ❓ **new** |
| Q-28 | Should an optional DOM pre-scan (mask any node whose visible text contains a resolved secret before a screenshot) be designed to reduce, though never eliminate, secrets in pixels? | No; screenshots stay `partially_redacted` with documented limits and no secret-free claim | Phase 2 | ✅ default accepted 2026-11-17 |
| Q-29 | Is denying dedicated and shared workers by default acceptable (some targets will degrade), with `workers: allow` as an approved, unclaimed policy choice? | Yes, deny by default | Phase 2 | ✅ default accepted 2026-11-17 |
| Q-30 | Default `network.dnsMode`: `pinned` (needs `dnsPins` per non-loopback host; no DNS leaves the machine) or `system` (easier; DNS leaves the machine and no containment claim)? | `pinned` | Phase 2 | ✅ default accepted 2026-11-17 |

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
| R-29 | The source repository is public on GitHub, so the design documents (security model, honest limits, unpassed gates and documented weaknesses) are world-readable, and a public repository without a license is easily mistaken for open source | High | Medium | Phase 0 holds documents only: no secrets, credentials or target data are kept in the repository; the documents state every limit and every unpassed gate, so nothing relies on obscurity; `UNLICENSED` (all rights reserved) is stated in D-32, Q-01, Brain NG5, prd NFR-014 and the architecture distribution row; the owner may add a license or notice file, or make the repository private, at any time | Open |

## 10. Approval requirements

Phase 0 was approved by the owner on 2026-11-17 (revision 11). Each item below is ticked with what was done; nothing is assumed beyond it.

- [x] Review and approve each document (or list changes): Brain, prd, design_system, architecture, AGENT_ROLES, this checklist. Approved as a block at revision 11, on the instruction quoted below.
- [x] Confirm or change the revised and new decisions D-09, D-11, D-15, D-21 to D-47 (or approve them as a block). Approved as a block; the other proposed decision rows in §3 are approved with the documents. D-32 was revised first to record that the repository is public.
- [x] Answer, or accept the defaults for, every question needed by Phase 0, 1 or 2: Q-01, Q-02, Q-03, Q-04, Q-08, Q-11, Q-13, Q-16, Q-17, Q-18, Q-22, Q-24, Q-25, Q-28, Q-29, Q-30. Q-01 was decided (the repository stays public, `UNLICENSED`); the defaults were accepted for the rest. Accepting the defaults for Q-16, Q-24 and Q-25 accepts only the stated interim or deferred handling: it does not choose a CI approval mechanism, does not approve any 0.1-preview, and does not pass AC-38 or AC-49.
- [x] Say "Phase 0 approved". The owner's instruction of 2026-11-17 was: "resolve the public/private-license mismatch, accept or decide every §10 question and listed decisions, then explicitly approve Phase 0"; to the visibility question the owner answered "2" (keep the repository public). The literal phrase "Phase 0 approved" was not typed; this instruction is recorded as the approval, and the owner may amend or withdraw it after reviewing revision 11 by saying so.

After approval, **Phase 1 still requires its own plan and approval** before any scaffold, dependency install or code.

| Approval record | |
|-----------------|--|
| Approved by | Gaurav Raj (project owner), by explicit instruction in chat |
| Date | 2026-11-17 |
| Changes requested | None by the owner beyond resolving the public/private mismatch. The independent review's CHANGES REQUIRED items 1 to 3 are addressed in revision 11; no re-review by the independent reviewer is recorded |
| Approved document set | The revision 11 documents (SHA-256 hashes in `PHASE_0_REVIEW_BUNDLE.md` §1) |
| Not approved by this record | Phase 1 (needs its own plan and approval); any release gate (AC-22, AC-38, AC-39, AC-46 and AC-49 remain unpassed); any assurance level above Designed; any 0.1-preview (a preview is permitted only under the conditions in `architecture.md` §17 and needs its own owner approval) |

## 11. What was and was not verified

- **Verified (documents):** cross-references, numbering and vocabulary by script (§6); file rename and absence of stale references; that every register claim is Designed; that no document states a guarantee above Designed.
- **Verified (public docs, earlier this session):** Playwright documents `serviceWorkers: 'block'`, WebSocket routing since v1.48 with close-without-connect, and no redaction option in HAR recording.
- **Verified (this folder, revision 11):** Git and repository state, observed at the start of revision 11 with `git rev-parse` of `HEAD`, `main`, `changes`, `origin/main` and `origin/changes`, `git ls-remote origin`, `git log`, `git status`, `git rev-list --left-right --count main...changes` and, read-only, `gh repo view GauravRaj997/qa-sentinel --json visibility,isPrivate,licenseInfo`: ten commits in a line, `ddbb7c6` → `4aa540c` → `7863d3a` → `7ae6732` → `20915d3` → `c5f48e5` → `9ad6f05` → `5659e22` (revision 10) → `02bb21b` ("Correct Phase 0 audit trail (revision 10.1)", parent `5659e22`) → **`97c59e9` ("Label §1 cross-check column as revision 10.1", parent `02bb21b`)**. `HEAD`, `main`, `changes`, `origin/main`, `origin/changes` and the remote's `refs/heads/main`, `refs/heads/changes` and default `HEAD` **all pointed at the same commit, `97c59e9`** (`main...changes`: 0 behind, 0 ahead); `changes` was checked out; the working tree was clean. The **author and committer** of all ten commits is Gaurav Raj; Claude Sonnet 5.5 appears only as a **`Co-Authored-By` trailer** (co-author, not author). **Git write commands run by this session after the revision 10 round, each on your explicit instruction and none forced:** on "Commit and push", `git add` of the two audit-trail files, `git commit` (`02bb21b`) and `git push origin changes` (`5659e22..02bb21b`); for the label correction, `git add` and `git commit` (`97c59e9`), then on "Push it" `git push origin changes` (`02bb21b..97c59e9`); on "merge in main", `git push origin changes:main` (`5659e22..97c59e9`) and `git fetch origin main:main` (fast-forward only). It created no branch, made no merge commit, rewrote no history, force-pushed nothing, and ran no git write command during revision 11. **Repository visibility:** on 2026-11-17 GitHub reported `visibility: PUBLIC`, `isPrivate: false` and no license, which contradicted the earlier D-32 wording ("Private"). This session attempted `gh repo edit … --visibility private`; the permission classifier denied the call, it was not retried or worked around, and this session changed no GitHub setting. You then chose to keep the repository public and named no license, so D-32, Q-01, `Brain.md` NG5, `prd.md` NFR-014 and the `architecture.md` distribution row now say: unpublished, `UNLICENSED` (all rights reserved, no `LICENSE` file), source repository public (R-29 records the exposure). **Self-reference:** a document cannot reliably contain the SHA of the commit that holds its own latest edits, so this document names no SHA for the commit that contains revision 11 and makes **no statement about whether the revision 11 edits are committed**; run `git status`, `git log -1` and `git rev-parse HEAD main changes origin/main origin/changes` for the live state. A commit made after `97c59e9` is later than the state recorded here and does not make this record wrong.
- **Historical (revision 10.1 observation, kept; superseded by the revision 11 bullet above):** Git state, observed with `git rev-parse` of `HEAD`, `main`, `changes`, `origin/main` and `origin/changes`, `git ls-remote origin`, `git log`, `git status` and `git rev-list --left-right --count main...changes`, at the start of revision 10.1: eight commits in a line, `ddbb7c6` → `4aa540c` → `7863d3a` → `7ae6732` → `20915d3` → `c5f48e5` → `9ad6f05` (each as recorded in the historical bullet below) → **`5659e22` ("Bump Phase 0 docs to revision 10", parent `9ad6f05`, 8 Markdown files changed)**. **Revision 10 is committed and pushed as `5659e22`.** `HEAD`, `main`, `changes`, `origin/main` and `origin/changes`, and the remote's `refs/heads/main`, `refs/heads/changes` and default `HEAD`, **all pointed at the same commit, `5659e22`**; `main` and `changes` were identical (`main...changes`: 0 behind, 0 ahead); branch `changes` was checked out; the working tree was clean. On all eight commits the **author and committer** is Gaurav Raj (your identity); Claude Sonnet 5.5 appears only as a **`Co-Authored-By` trailer** (co-author, not author). **Git write commands run by this session, each on your explicit instruction and none forced:** in the revision 10 round, only `git push origin 9ad6f05:refs/heads/main` (fast-forward `c5f48e5..9ad6f05`) and `git fetch origin main:main` (fast-forward only); afterwards, on "Commit and push", `git add` of exactly the eight modified Markdown files, `git commit` (creating `5659e22`, under your configured git identity) and `git push origin changes` (`9ad6f05..5659e22`); then, on "Fast-forward main", `git push origin changes:main` (`9ad6f05..5659e22`) and `git fetch origin main:main` (fast-forward only). It created no branch, made no merge, rewrote no history, force-pushed nothing, and ran no git write command while the revision 10.1 documents were being written (the later commits are recorded in the revision 11 bullet). Commits `7863d3a` to `9ad6f05` were made outside this session's tool calls. **Why this document does not name the commit that contains revision 10.1:** a document cannot reliably contain the SHA of the commit that holds its own latest edits, because the SHA is computed from the file content, so writing the SHA into the file changes the content and therefore the SHA. This document therefore records only the state observed at the start of revision 10.1 (tip `5659e22`) and makes **no statement about whether the revision 10.1 edits are committed**. To see the current state, run `git status`, `git log -1`, `git rev-parse HEAD main changes origin/main origin/changes` and `git rev-list --left-right --count main...changes`; a commit made after `5659e22` is later than the state recorded here, which is expected and does not make this record wrong. The revision 10.1 edits touch only this checklist and the review bundle.
- **Historical (revision 10 observation, kept unchanged in substance; it described the state before `5659e22` and is superseded by the bullet above):** Git history, observed with `git status`, `git branch -vv`, `git log --oneline --decorate -8`, `git rev-parse` of `HEAD`, `main`, `changes`, `origin/main` and `origin/changes`, and `git ls-remote origin`, at the start and again at the end of revision 10: seven commits in a line. `ddbb7c6` ("Initial commit", 2026-11-16 11:28 +0530, revision 3 content) → `4aa540c` ("Update project docs", 13:14, revision 4) → `7863d3a` ("Bump Phase 0 docs to revision 5", 13:24) → `7ae6732` ("Bump Phase 0 docs to revision 6", 13:36) → `20915d3` ("Bump Phase 0 docs to revision 7", 15:31, parent `7ae6732`; the tip of `changes` at the start of revision 8) → `c5f48e5` ("Bump Phase 0 docs to revision 8", 15:37, parent `20915d3`; the tip of `main` and `origin/main` at the start of revision 10) → **`9ad6f05` ("Bump Phase 0 docs to revision 9", 15:44, parent `c5f48e5`, revision 9 content)**. At the start of revision 10, `changes` and `origin/changes` were at `9ad6f05` and `main` and `origin/main` were 1 commit behind at `c5f48e5`; the working tree was clean. **On your explicit instruction this session then brought `main` forward with exactly two git write commands:** (1) `git push origin 9ad6f05:refs/heads/main` (not forced; fast-forward `c5f48e5..9ad6f05`, accepted by `origin`) and (2) `git fetch origin main:main` (a fast-forward-only update of local `main`, same range). It made no commit, no merge, created no branch, rewrote no history, force-pushed nothing and staged nothing. Result at that time: branch `changes` was **checked out**; `HEAD`, `main`, `changes`, `origin/main`, `origin/changes` and the remote's `refs/heads/main`, `refs/heads/changes` and default `HEAD` **all equalled `9ad6f05`** at that time, so **revision 9 was committed and pushed on both `main` and `changes`**, and `main` and `changes` are identical (0 commits ahead of or behind each other). On all seven commits the **author and committer** is Gaurav Raj (your identity); Claude Sonnet 5.5 appears only as a **`Co-Authored-By` trailer**, i.e. co-author, not author; the commits themselves were made outside this session's tool calls. Apart from the two commands above this session ran only read-only git commands (`status`, `branch`, `log`, `rev-parse`, `ls-remote`, `show`, `diff`, `merge-base`, `rev-list`). **At the time of that observation the revision 10 edits were still working-tree changes; they were committed afterwards as `5659e22` (see the revision 10.1 bullet above).** A document cannot record the SHA of the commit that will contain it, so this description is accurate only for the state observed above. No file other than Markdown (plus `.gitignore`) exists; `config/targets`, `tests` and `reports` are empty; the transcript shows no Write or Edit by this session outside this folder and the scratchpad (one mistaken write to a stray `/private/tmp` path was blocked by a hook and created nothing). A sibling project (`Git/jeevanpulse`) shows recent file changes and its own commits by your identity; this session did not touch it, but a modification time cannot prove who made a change.
- **Not verified (nothing is built):** every guarantee in the register; Chromium proxy, WebRTC and QUIC flags; worker denial (AC-46) and therefore worker-originated WebSocket prevention; DNS pinning and system-wide DNS observation (AC-38, AC-49); screenshot masking limits (AC-48); run-status immutability and crash recovery (AC-47); `sendBeacon` routing; independent outbound observation for AC-38; keychain access without a native module; redaction completeness; confirmation on real flaky targets; that `AGENT_ROLES.md` is not auto-loaded in a fresh session.
