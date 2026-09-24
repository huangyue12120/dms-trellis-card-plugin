# v0.8.2 execution plan

## Ordered checklist

1. Consume the v0.8.1 failure/evidence ledger and inspect existing watcher, path, archive, Markdown, and parser contracts.
2. Map each roadmap requirement to its existing pure/static assertion or a live check. Re-run the exact traversal, absolute path, symlink, stale/malformed, size, and archive matrices using temporary fixtures.
3. Inspect daemon ownership and generation cleanup; add only missing assertions and fix reproduced leaks, duplicate subscriptions, or unbounded work.
4. Record idle and large-data measurements against current limits. State which observations are static/offscreen and which were live.
5. Run child validation and document every unavailable host gate.

## Validation

- node tests/test_trellis_contract.mjs
- node --check tests/test_trellis_contract.mjs
- python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-24-dms-plugin-v082-stability-security
- When available, repeat plugin reload, settings changes, bar/screen count changes, and daemon disable/destruction in DMS; verify no residual objects or repeated publications.

## Rollback

Keep each lifecycle/security fix scoped to its owning module and assertion. Never roll back containment, read-only flags, session retention, warning visibility, or generation guards to improve a measurement.
