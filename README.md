# qa-sentinel

Independent, evidence-first QA auditor for any application. Standalone product; not connected to any existing project.

**Status: Phase 0 (foundation documents), revision 5, pending approval. No code yet. Every protective mechanism is Designed only (not Implemented, Tested or Independently verified).**

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
