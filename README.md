# qa-sentinel

Independent, evidence-first QA auditor for any application. Standalone product; not connected to any existing project.

**Status: Phase 0 (foundation documents) approved by the owner on 2026-11-17 (revision 11). Phase 1 is in progress: D1 (workspace skeleton) and D2 (`@qa-sentinel/schema` with its tests) are done and on `main`; D3 (`packages/store`) is blocked until the SQLite spike is reported and the owner chooses the driver and Node floor. The only code is the schema package and its tests: no store, runner, guard, CLI or fixtures exist yet. Every protective mechanism is Designed only (not Implemented, Tested or Independently verified), and AC-22, AC-38, AC-39, AC-46 and AC-49 remain unpassed.**

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
- `packages/schema/` zod schemas and types for the records (Phase 1, D2)
- `tests/` tests of QA Sentinel itself (not of target apps); `tests/schema/` covers the schema package
- `reports/` exported run reports

Run the checks with `npm install` (install scripts are disabled in `.npmrc`) and `npm run check`. Supported Node versions are `^22.12.0 || ^24.0.0 || >=26.0.0`, the range the pinned Vitest requires; only Node 24 has been exercised so far.

Further folders (`packages/store`, `fixtures/`, `specs/`, `data/`) are defined in `architecture.md` and are created in later Phase 1 steps or later phases.
