# v0.8 release-candidate design

## Boundaries

The parent integrates three verification deliverables; children own their concrete checks and any narrowly scoped fix. Keep the existing daemon -> parser/resolver -> Snapshot -> projection -> QML flow. No new runtime component or Snapshot field is planned.

## Evidence flow

Disposable fixture inputs and, when already configured, read-only real project input feed the existing parser and safe resolver. Assertions then check Snapshot invariants, pure projections, static QML/daemon boundaries, and available offscreen/live behavior. A result is recorded with its evidence class and host version.

Evidence classes:

- Pure/fixture: deterministic Node contract assertions using disposable data.
- Static: manifest, source-boundary, import-case, or task-artifact inspection.
- Offscreen: installed-module QML component/type loading without a running user shell.
- Live: actual DMS/Wayland interaction, reload, focus, topology, or restart behavior.

These classes are complementary; lower-level evidence never substitutes for a required live gate.

## Compatibility and release boundary

The user-selected v0.8 target is DMS 1.6.2. Keep `requires_dms` at >=1.6.1 unless direct API evidence proves the minimum must change; the tested target and declared minimum are distinct. Follow prior milestone practice and use manifest version 0.8.0 only after all release-candidate gates are reviewed. Do not change version metadata during 0.8.1 or 0.8.2.

## Operational and rollback shape

All parser/path fixtures use temporary directories and are removed by their owning test. Real Trellis data remains read-only. Before any later host installation/reload check, inspect the exact installed target and preserve a recoverable copy; workspace planning itself does not touch that copy. If runtime evidence cannot be collected, retain the limitation and leave the gate open.

Rollback each fix at the smallest child boundary: fixture-only changes can be reverted with that test addition; daemon/resolver fixes stay within the affected module and contract; release notes and manifest changes are reverted together if the candidate is not accepted.
