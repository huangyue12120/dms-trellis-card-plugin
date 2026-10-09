# Health Notification Child Implementation Plan

## Checklist

1. Add the pure bounded transition helper and focused fixture tests.
2. Add `notificationsEnabled` to Settings, Restore Defaults, and `zh_CN` copy.
3. Integrate transition evaluation after existing Recent Changes observation;
   keep Snapshot publication ordering and failure behavior unchanged.
4. Add an isolated argv-only DMS notification process with bounded text and
   teardown handling.
5. Add static assertions for no raw paths/content, no new permissions, no
   extra watcher/scanner, and disabled behavior.
6. Run the Node contract suite, syntax/JSON checks, task validation, and
   `git diff --check`.
7. Record supported-host results or precise unverified limits.

## Focused checks

- `node --check TrellisDms/lib/trellisnotifications.js`
- `node tests/test_trellis_contract.mjs`
- JSON parse manifest and translations
- `python3 ./.trellis/scripts/task.py validate .trellis/tasks/10-09-v131-health-notification`
- `git diff --check`

## Rollback

Remove only the helper, adapter, setting, translations, tests, and child
documentation if a check fails. Preserve the existing Snapshot, Health,
Recent Changes, and watcher implementation.
