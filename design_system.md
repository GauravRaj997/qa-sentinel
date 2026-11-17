# QA Sentinel — Design System

> Status: Phase 0, revision 11, approved by the owner on 2026-11-17 (record: `PHASE_0_CHECKLIST.md` §10; the approval passes no gate and does not approve Phase 1). Applies to the HTML reports (Release 0.1), the dashboard (Release 0.3) and, in spirit, CLI output. Product rules: `prd.md`. Architecture: `architecture.md`. Roles: `AGENT_ROLES.md`. No UI is built yet; accessibility and security properties named here are **Designed**, not Tested (`architecture.md` §0).

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
- **RunStatusBadge** — run status `running`, `completed`, `partial`, `aborted`, `errored`, always with text. `errored` uses the errored token with ⚠; `partial` and `aborted` use neutral hatching; `completed` never reads as "passed", "healthy" or "safe" and is shown beside the coverage bar.
- **SeverityPill** — critical / high / medium / low / none, text always present.
- **CoverageBar** — segmented bar of passed / failed / errored / skipped / not_run with counts; shown on every run card before any "healthy" language.
- **RunCard / RunTimeline** — build id, mode, manifest hash, duration, summary, step-by-step timeline with blocked-by-policy markers.
- **FindingRow / FindingDetail** — title, status, severity, lifecycle, first/last seen, reproductions (`k/k`), evidence list, repro spec link, event history.
- **EvidenceCard / EvidenceViewer** — thumbnail, kind, hash, redaction status badge (traces always "Not redacted"), download, trace viewer link for opt-in traces.
- **VerificationPanel** — claim (actor, build, commit), result, the **identity basis and confidence** (`target_reported` moderate — reported by the target, not proof · `operator_asserted` low — a statement · `surfaceFingerprint` low — fallback only; `independently_attested` reserved), always shown with the result and never as a bare "verified"; the gating checks (`freshContext`, `buildChanged` on the same basis) each with pass/fail/unknown and a short explanation of limits, plus the informational `sameActorAsClaim`.
- **AssuranceBadge** — Designed / Implemented / Tested / Independently verified, with text and a distinct shape per level; links to the Guarantee Register entry and the commit for Tested and above. Never colored as "success" below Tested.
- **GuardCoveragePanel** — the guard mode (`full` / `l1_only`), then per traffic class (WebSocket, worker creation and worker WebSocket, WebRTC, service workers, downloads, proxy, schemes, DNS mode) `active`, `unavailable`, `untested` or `uncontrolled` (`workers: allow`, `dnsMode: system`), with the run's `websocket-restricted` and "guard coverage incomplete" notices; in `l1_only` it shows "not equivalent to full mode" and AC-38, AC-39 and AC-49 as not evaluated.
- **EvidenceClassBadge / RedactionBadge / RevealGate** — `public` vs `restricted`; a separate redaction badge (`redacted`, `partially redacted`, **`NOT REDACTED`** for traces and downloads; screenshots always read `partially redacted` with a visible "masks configured elements only; may still contain secrets" note and never "secret-free" or "sanitized") and a separate encryption lock; restricted items show retention expiry and a "Reveal" action that confirms and appends an access event.
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
| Partial / Aborted / Errored | Prominent banner with the run status and terminal reason (`RUN PARTIAL`, `RUN ABORTED`, `RUN ERRORED`); `errored` never uses success styling; unexecuted checks listed as `not_run` |
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
