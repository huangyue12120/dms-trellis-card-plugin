# v0.8.1 execution plan

## Ordered checklist

1. Read the current matrix table and compare every roadmap row with existing assertions; record covered and missing rows before editing.
2. Extend only uncovered fixture/source assertions. Ensure fixture input traverses parser -> Snapshot -> projection, rather than testing only a hand-built presentation object where that would miss the contract.
3. Reproduce and fix only concrete product defects. Preserve multi-session retention, deterministic primary selection, archive/live isolation, safe resolver, and null progress.
4. Run the child validation and record fixture/static/offscreen/live evidence separately.

## Validation

- node tests/test_trellis_contract.mjs
- node --check tests/test_trellis_contract.mjs
- python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-24-dms-plugin-v081-state-matrix
- When available, exercise task.json update latency, topology refresh, manual refresh, Settings recovery, and horizontal/vertical/popout rendering in DMS.

## Rollback

Revert only the failing assertion or minimal source fix introduced for this child. Preserve all pre-existing v0.3-v0.7 contracts and do not remove unrelated fixture coverage.
