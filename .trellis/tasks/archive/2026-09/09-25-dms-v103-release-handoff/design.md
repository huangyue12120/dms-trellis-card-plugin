# DMS v1.0.3 release handoff — design

## Documentation map

- `TrellisDms/README.md` is the concise end-user guide for compatibility, installation, trusted roots, primary views, settings, read-only/privacy scope, troubleshooting, disable, and rollback.
- `docs/release-notes-v1.0.0.md` records the version, target/minimum DMS baseline, permission list, delivered P0/P1 behavior, the final outcome of each v0.9 P2 item, evidence/known limitations, and post-v1 work.
- `docs/registry-readiness.md` stays local-only and reflects the final manifest and optional-surface list; it does not imply external review or publication.
- `PROJECT_PROGRESS.md` remains the version-level roadmap and acceptance checklist. Update it from the archived evidence and `acceptance-evidence.md`; do not copy raw test logs into the roadmap.

## Source-of-truth rules

- The manifest is authoritative for version, surfaces, permissions, and compatibility declaration.
- The acceptance record is authoritative for what was actually checked and by whom.
- The README summarizes supported use and safe recovery; release notes give exact release-scope details; the roadmap links the stage outcome.
- P2 entries are marked included/verified, disabled, or deferred consistently in all relevant docs.

## Rollback and privacy

Document preserving the previous plugin directory before replacement, disabling through DMS, restoring the previous package, and optional cleanup of only Trellis DMS-owned Settings/State. Do not recommend deleting user Trellis files or clearing all DMS plugin State. External registry submission remains a separate action.
