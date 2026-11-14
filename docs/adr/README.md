# docs/adr

The decision records themselves are in [`../ARCHITECTURE_DECISION_LOG.md`](../ARCHITECTURE_DECISION_LOG.md). There is one canonical log, so entries are not duplicated here (DEC-001).

This folder holds **evidence**: one write-up per reference studied, with pinned commits, licences, file:line citations, and the reason each finding was adopted or rejected. Decision entries cite these by source ID (see [`../SOURCES.md`](../SOURCES.md)).

| Write-up | Sources | Used by |
|---|---|---|
| [evidence/meta-dat.md](./evidence/meta-dat.md) | S01–S09 | DEC-003 to DEC-007, DEC-015, DEC-016, DEC-021 to DEC-023 |
| [evidence/gemglasses-visionclaw.md](./evidence/gemglasses-visionclaw.md) | S10, S11 | DEC-005, DEC-006, DEC-011, DEC-012, DEC-017, DEC-018 |
| [evidence/open-instinct.md](./evidence/open-instinct.md) | S12 | DEC-008, DEC-012, DEC-013 |
| [evidence/fyn.md](./evidence/fyn.md) | S13–S17 | DEC-014, DEC-019 |

**Method.**
- Repositories were shallow-cloned into isolated temporary directories and read only. **None of their code was executed.**
- Load-bearing claims were spot-checked a second time against the clone before being cited:
  - the DAT CHANGELOG experimental list;
  - the DAT session-state enum;
  - the "tap pauses stream" note;
  - VisionClaw's auto-approve;
  - GemGlasses' silent mock fallback;
  - Open Instinct's guard and argsHash binding.
