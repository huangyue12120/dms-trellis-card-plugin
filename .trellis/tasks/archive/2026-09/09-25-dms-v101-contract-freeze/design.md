# DMS v1.0.1 P0/P1 contract freeze — design

## Contract owners

- `TrellisDms/plugin.json` owns the package ID, version, component registrations, trigger, minimum DMS version, and permissions.
- The existing parser/resolver and `.trellis/spec/frontend/` contracts own Snapshot, progress, file-boundary, watcher, and failure semantics.
- `docs/ui-*.md` owns approved P0/P1 visual and interaction contracts. The v0.9 task's approved design/research artifacts own the optional Desktop, locale, and Launcher additions.
- `PROJECT_PROGRESS.md` and the release evidence map identify which acceptance gates have evidence and its class.

Do not create a second runtime schema or duplicate path policy in surface code or prose.

## Frozen candidate decisions

- Preserve schema 1, all valid session facts, `progress: number | null`, live/archive separation, canonical path containment, lazy detail reads, and daemon-only collection.
- Set the local candidate manifest version to `1.0.0`, `requires_dms` to `>=1.6.2`, and permissions to the existing `settings_read`, `settings_write`, `process` set. No network permission is added.
- Include the existing Desktop, zh_CN catalog, and `!trellis` Launcher as optional candidate items. Their separate host acceptance is owned by task 1.0.2. Keep the existing English source strings as the locale fallback.
- Define rollback at the package-entry boundary: remove only the failed Desktop/Launcher registration or zh_CN translation catalog; keep the daemon/bar/settings core and rerun its acceptance.

## Data and compatibility behavior

No migration is planned. Existing user settings, plugin State keys, project files, `.trellis` files, and archive layout remain unchanged. The 1.0.1 task may update only manifest/package version and docs needed to align the already approved contracts; a discovered behavior defect returns to the originating v0.x contract rather than being papered over.

## Failure behavior

Unknown DMS/Trellis values and warnings remain visible according to current UI contracts. No source of truth is replaced with a release-specific default, and no failed acceptance row is marked passed. If a P0/P1 contract cannot be reconciled, do not claim a frozen release candidate; return the issue to task 1.0.2 or the owning v0.x repair.
