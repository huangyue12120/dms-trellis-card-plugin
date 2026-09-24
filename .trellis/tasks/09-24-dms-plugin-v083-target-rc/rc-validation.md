# DMS v0.8 Release Candidate Validation

Captured 2026-09-24 after the local manual test report.

## Target and candidate

- User-selected v0.8 target: Fedora 44, Wayland, niri 26.04, DMS 1.6.2,
  Quickshell 0.3.1, Qt 6.11.2, and Trellis 0.6.17.
- Candidate manifest: version `0.8.0`, composite daemon/widget, settings
  surface, `requires_dms >=1.6.1`, and only `process`, `settings_read`, and
  `settings_write` permissions. No network permission.
- The manifest minimum remains distinct from the user-selected/tested target;
  this RC's live checks were reported on DMS 1.6.2.

## Evidence

- Contract suite: `node tests/test_trellis_contract.mjs` passes with fixture,
  parser, path-safety, archive/detail, watcher, lifecycle-source, state-matrix,
  and manifest assertions.
- Task artifacts: the v0.8.1 state-matrix evidence is archived; the v0.8.2
  stability/security record distinguishes fixture/static checks from runtime
  checks and lists unmeasured resource metrics.
- Live host: the user reports that the planned manual checks passed without
  issues on DMS 1.6.2, including plugin load with no project, bar/popout,
  multi-bar/screen, idle/reload, disable, and resource cleanup. The report is
  user-provided; this session did not independently replay the checks and no
  per-case log or screenshot was supplied. The user separately confirmed that
  the supported Trellis 0.6.17 and unknown/newer-version warning cases both
  displayed and passed.
- QML lint/format tools were not available in the recorded development shell.

## Known limits

- DMS 1.6.1 was the original roadmap target but was superseded by the user's
  explicit 1.6.2 target decision. Live coverage of DMS 1.6.1 is not claimed.
- Peak memory, throughput, exact refresh latency, and simultaneous
  process/reader counts were not captured as numeric measurements.
- The user additionally confirms the permission-denied recovery case passed
  locally; this is user-reported, not independently replayed evidence.
- User-reported manual checks are not independently observed evidence.

## Install, disable, and rollback

1. Before replacing an installed copy, preserve the exact directory, for
   example:
   `cp -a ~/.config/DankMaterialShell/plugins/TrellisDms ~/.config/DankMaterialShell/plugins/TrellisDms.backup-<timestamp>`.
2. Install the reviewed `TrellisDms/` directory at
   `~/.config/DankMaterialShell/plugins/TrellisDms`, then enable it through
   DMS's plugin UI. Verify the version and runtime before normal use.
3. To disable, use the same DMS plugin UI and reload the shell if requested.
4. To roll back, disable the candidate, move it aside, restore the preserved
   directory to `TrellisDms`, and re-enable the prior copy. Do not delete the
   backup until the restored version loads successfully.
