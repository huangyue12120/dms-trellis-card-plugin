# v0.6.3 implementation plan

1. Expand the state-matrix test fixtures to every P0/P1 row, including raw
   live-path completed/custom status, stale/malformed sessions, version warning,
   degraded last-good data, invalid preferences, and empty recovery.
2. Add only the recovery controls required by the roadmap: manual refresh via
   existing `refreshToken` and settings navigation through the DMS surface.
3. Run static/offscreen checks at horizontal, vertical, long-name, narrow, and
   normal sizes. Fix only integration/responsive defects within v0.6 scope.
4. Install/copy through the user's normal workflow when authorized, then test
   repeated reload, multi-widget sync, click/focus/scroll, filter/pin recovery,
   and empty-to-populated refresh. Observe State after host debounce/restart.
5. Run the complete v0.3-v0.6 regression suite and independent Trellis check.
6. Update UI docs, frontend quality spec, and `PROJECT_PROGRESS.md` with exact
   evidence/limitations; set manifest `0.6.0` last.

## Validation commands

```bash
node tests/test_trellis_contract.mjs
node --check tests/test_trellis_contract.mjs
node -e 'const p=JSON.parse(require("node:fs").readFileSync("TrellisDms/plugin.json","utf8")); if(p.version!=="0.6.0") process.exit(1)'
rg -n 'FileView|Process|setGlobalVar|saveValue' TrellisDms/TrellisWidget.qml
python3 ./.trellis/scripts/task.py validate 09-23-dms-v063-responsive-states
```

The QML source scan is interpreted against the allow/deny contract: the widget
must not own filesystem/process/Snapshot publication or Trellis writes; the
two approved DMS State keys and existing refresh setting are allowed.

## Risk and rollback

- Do not expand this child into core projection redesign; return defects to the
  owning child if its contract is wrong.
- Never bump the manifest before the full regression gate.
- If live DMS/Wayland tooling is unavailable, preserve static results and list
  the exact unverified runtime gates. Do not weaken tests to force release.

## Current execution status

- Implemented: complete deterministic P0/P1 state-matrix coverage, bounded
  warning/degraded projection fields, screen-clamped popout dimensions,
  wrapped project filters, bounded long-name labels, 40-px native controls,
  manual refresh pending semantics, and DMS Settings navigation.
- Passed: Node contracts, Node syntax, manifest parse/version `0.6.0`,
  exact-case resources, read-only/path/discovery/watcher/static lifecycle
  checks, offscreen installed-module component load, and task-context
  validation.
- Observed from the running host: two widget loads and one daemon load per
  generation across unload/reload; the host also reports the known deferred
  State write failure `Property 'connect' of object false is not a function`.
- Unavailable without installing the workspace build: real Wayland visual,
  pointer, focus/scroll, direct Settings-navigation, empty-to-populated scan,
  and successful pin/filter persistence across a full DMS restart. These are
  not reported as successful, and no settings/Trellis fallback was introduced.
