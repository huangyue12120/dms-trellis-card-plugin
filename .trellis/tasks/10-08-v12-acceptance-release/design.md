# Integration and Release Design

## Evidence model

Use an acceptance-evidence.md matrix with separate fixture, static, offscreen, and live columns/statuses. Every row records command/source/log or a precise unavailable reason. User reports retain their evidence class and do not become independently measured results.

## Required matrices

- Recent Changes: baseline, repeated facts/timestamps, all event types, project/session partial reads, fallback, recovery, archive observations, primary/pin selection, caps, reload.
- Search: all scopes, project context, task-ID/title/name matches, empty-query zero-I/O, large/malformed archives, limits/partial continuation, stale response/cursor, Back/focus/scroll.
- Actions: all copy/open variants, exact clipboard values, encoded directory URLs, removed roots, symlink/traversal/stale identity, missing APIs, local errors.
- Core: bar modes/orientation, popout, groups/filter/pin, live/archive Markdown, archive warnings, settings restore/save, manual refresh/new tasks, topology interval, Launcher trigger/navigation.
- v1.1: health incidents/freshness/last-good/recovery, redacted Diagnostics and copy, Desktop Overview/Tasks/Health, two independent placements, settings reload, locale, restart and disable/enable.
- Resources: shared publication/watchers across surfaces, no added watchers/scanner/network, bounded event/search/action tracking, cancellation and resource cleanup.

## Package and version decision

Prepare docs/releases/v1.2.0-candidate.md and a reproducible ZIP from TrellisDms plus license/README; exclude task/workspace/private evidence. Extend the existing generic candidate contract only as needed for v1.2 tests/notes.

Before the version decision, local draft packages retain/report the current manifest version and are labeled unreleased integration artifacts. Rebuild a matching v1.2 package after the version decision; do not create a candidate tag with a mismatched manifest.

Keep stable publication conditional on passing the matrix. Once ready, set manifest version 1.2.0 and add/reuse a separately explicit stable tag/release path that validates version/source/package before publishing; candidate tags remain prereleases. Do not publish or mark v1.2.0 complete on fixture/static evidence alone.

No host startup, installation, configuration overwrite, tag, or publication occurs during this planning phase. Runtime unavailable conditions are recorded and do not prevent completing independent implementation/check work.

## Compatibility and rollback

Retain DMS >=1.6.2, existing permissions/capabilities, schema compatibility, and honest README limits. Update only v1.2-relevant docs/spec/progress. A failed gate leaves a locally reviewable candidate and explicit remaining checks; revert only acceptance/release edits if needed, preserving feature and user changes.
