# Proposed v1.2 Commit Batch

The user approved these three batches and separately chose to retain the
original installed plugin for later manual acceptance. Reinstallation and DMS
restart are excluded from this execution.

Prepared for one-shot confirmation under workflow Phase 3.4. No files have
been staged or committed. No amend, push, tag, or release is included.

## 1. `feat: add v1.2 changes search and quick actions`

- `TrellisDms/TrellisDaemon.qml`
- `TrellisDms/TrellisWidget.qml`
- `TrellisDms/lib/trellisPaths.js`
- `TrellisDms/lib/trellisprojection.js`
- `TrellisDms/lib/trellischanges.js`
- `TrellisDms/translations/zh_CN.json`
- `tests/test_trellis_contract.mjs`
- `.trellis/spec/frontend/index.md`
- `.trellis/spec/frontend/recent-changes-contract.md`
- `.trellis/spec/frontend/global-search-contract.md`
- `.trellis/spec/frontend/quick-actions-contract.md`
- `.trellis/spec/frontend/archive-browsing-contract.md`
- `.trellis/spec/frontend/markdown-detail-contract.md`

Shared source changes are one coherent feature commit because the three children
use the same daemon/widget/test files. The manifest stays `1.0.0`.

## 2. `docs: record v1.2 candidate and acceptance evidence`

- `README.md`
- `docs/releases/v1.2.0-candidate.md`
- `PROJECT_PROGRESS.md`: only the new top-level v1.2 execution-status block.
- `.trellis/tasks/10-08-v12-observation-search-navigation/`: task metadata,
  approved plans/context, and research.
- `.trellis/tasks/10-08-v12-recent-changes/`: task metadata, plans/context,
  implementation/check evidence.
- `.trellis/tasks/10-08-v12-global-search/`: task metadata, plans/context,
  implementation/check evidence.
- `.trellis/tasks/10-08-v12-quick-actions/`: task metadata, plans/context,
  clipboard research, implementation/check evidence.
- `.trellis/tasks/10-08-v12-acceptance-release/`: task metadata, plans/context,
  acceptance/host/final-check evidence and this commit plan.

The roadmap's pre-existing 957 added lines are explicitly excluded. They remain
in the working tree, with original bytes preserved (SHA-256
`a6c386bebbe0bece3f6bced42961b889806962d78c7f2d882c5aa514010ce57d`).
Use the prepared `/tmp/trellis-v12-progress-only.patch` against the index for
the status block; do not `git add PROJECT_PROGRESS.md` as a whole.

## 3. `chore: record journal`

After the work commits, use `add_session.py` to record their hashes and the
remaining candidate load/runtime/release gates under
`.trellis/workspace/huangyue12120/`. Do not archive the unfinished acceptance
or claim the stable release complete. No task archive is included in this batch.

## Separate host continuation

The candidate hot reload failed and the installed original baseline is restored.
A complete new DMS engine is still needed to verify the candidate. The supported
`dms restart` affects the whole shell, with no plugin-only target flag; it is
separate from this commit batch. Reinstallation must verify the baseline first
and preserve the existing backup before any approved whole-shell restart.
