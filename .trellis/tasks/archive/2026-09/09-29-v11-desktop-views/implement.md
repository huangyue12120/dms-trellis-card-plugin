# Desktop View Modes Execution Plan

## Checklist

1. Read the Desktop projection, settings-state, recovery-responsive contracts, parent runtime research, and `ui-gate.md`; the gate must be approved before final UI work.
2. Extend the pure Desktop projection to expose Overview, Tasks, and Health inputs while reusing the shared Health projection.
3. Add a per-placement `viewMode` selector to Desktop-instance Settings and save it through DMS instance config. Default invalid/missing config to Overview.
4. Render all three modes in the existing Desktop widget with one scroll region, explicit empty/loading/healthy/degraded/last-good states, and translated labels.
5. Add fixtures/static checks for modes, independent instances, no rescan, same Snapshot, and minimum/default/larger layout structure.
6. Run `node tests/test_trellis_contract.mjs`, translation JSON validation, `git diff --check`, and the task validator. Keep offscreen results separate from DMS host results.

## Risks / rollback

- `TrellisSettings.qml` is also edited by the Diagnostics child; keep tasks sequential and preserve its integrated changes.
- If `instanceData.config` does not update/react after DMS config writes or does not persist on restart, stop release work and record the failing API gate.
- Do not add DMS State writes, desktop scanners, mode-specific timers, or per-placement snapshots. Revert only the view-mode control/rendering if instance isolation fails.
