# Health Incident and Freshness Execution Plan

## Checklist

1. Load the frontend State-Matrix/Recovery contracts, cross-layer guide, and parent runtime research before editing.
2. Add project/root context to raw warnings at their source while preserving raw warning codes/messages and limits.
3. Add schema-2 runtime metadata and per-project last-success time in the daemon/parser; keep schema-1 projection compatibility and `progress: null`.
4. Add pure health/freshness projection and archive response handling using only structured archive facts.
5. Add fixtures for the PRD matrix, recovery, immutability, and privacy-safe identifiers. Update static contracts only where the new metadata contract requires it.
6. Run `node tests/test_trellis_contract.mjs`, `git diff --check`, and `python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-29-v11-health-freshness`; inspect all warning mappings and diff before handing off.

## Risks / rollback

- `generatedAt` currently means publication time; do not silently change it. Add separate fields and tests.
- Raw warning paths/reasons must remain diagnostic facts but must not become UI identifiers or copied report text.
- If one-project failures disappear into a global-only status, fix warning context before accepting the projection.
- Revert only this child's code/test/docs chunk if schema compatibility or raw-warning retention fails.
