# v0.8.3 target environment and RC design

## Target and compatibility

The user-selected v0.8 target is Fedora 44, Wayland, niri 26.04, DMS 1.6.2, Quickshell 0.3.1, Qt 6.11.2, and Trellis 0.6.17. Keep CLI version, bundled runtime version, and actual running shell evidence separate.

## Installation flow

First inspect the exact installed plugin directory and compare its manifest/resources with the workspace. If a live installation check is authorized and needed, preserve the current copy before replacing it, test enable/reload/disable, and restore the preserved copy on failure. The live result recorded for this RC is user-reported on DMS 1.6.2; do not imply an independent replay or coverage of other versions.

## RC record

Record the candidate manifest, tested host versions, permissions, warning behavior, actual live checks, known limitations, and precise rollback path in the v0.8 task record and PROJECT_PROGRESS.md. A blocked environment gate remains open; RC naming or version metadata does not turn an unverified result into a pass.

## Out of scope

No AppImage/Tauri fixes, compositor matrix beyond niri, user data migration, external service, hooks, or P2 activity integration.
