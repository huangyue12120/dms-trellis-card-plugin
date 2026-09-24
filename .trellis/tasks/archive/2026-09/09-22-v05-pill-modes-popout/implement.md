# Compact pill and popout implementation plan

1. Add/test display-mode normalization and deterministic projection helpers.
2. Add the display-mode `SelectionSetting`.
3. Replace full-text-only horizontal/vertical delegates with approved modes.
4. Add the read-only popout and all empty/warning states.
5. Check Theme/icon use, bounds, no writes, and existing Snapshot compatibility.

Validate with Node contracts, QML source contracts, manifest JSON, and live DMS
click/orientation checks when available.
