# DMS hot-reload compatibility implementation plan

## Ordered checklist

1. **Freeze the resource graph.** Search the workspace for every
   `trellisDiscovery.js` and `trellisProjection.js` reference, record the
   expected target path, and confirm that no product or install files are being
   edited.
2. **Normalize the v0.5 helper names.** Rename both helper files to their
   lowercase forms and update the imports in `TrellisDaemon.qml`,
   `TrellisSettings.qml`, `TrellisWidget.qml`, and
   `tests/test_trellis_contract.mjs` in one change set. Remove no unrelated
   code and do not leave duplicate aliases.
3. **Strengthen static coverage.** Add a small exact-case import/resource check
   to the existing Node contract test (or the nearest existing test section),
   while preserving all current projection, discovery, watcher, and safety
   assertions.
4. **Run repository checks.** Execute the Node contract test, parse the manifest,
   enumerate imports against the filesystem, and run the existing offscreen DMS
   component/type harness if it is available. Inspect the resulting file list
   and targeted diff/content before any runtime copy.
5. **Validate the real reload path.** After the user copies the complete
   workspace plugin directory into the DMS plugin directory, invoke the DMS
   plugin reload and check logs for the absence of `File name case mismatch`.
   Confirm that the settings page still exposes `Bar display`, six modes, and
   trusted-folder controls; confirm the configured pill and click-to-popout.
6. **Check repeated lifecycle behavior.** Repeat reload at least once and
   verify the daemon is recreated once, the v0.5 snapshot still arrives, and no
   duplicate timer/watcher/global-var symptoms appear. If runtime tools are not
   available, record the exact gate as unverified.
7. **Contingency only if required.** If the same runtime error names one of the
   older mixed-case helper files, normalize that file and all of its references
   mechanically, rerun steps 3–6, and document why the scope expanded. Do not
   change DMS or introduce a duplicate compatibility file.

## Validation commands

```bash
rtk node tests/test_trellis_contract.mjs
rtk rg -n 'trellis(Discovery|Projection)\.js' TrellisDms tests
rtk find TrellisDms/lib -maxdepth 1 -type f | sort
rtk sha256sum TrellisDms/plugin.json
```

For a running DMS session, the host-side check is the documented plugin reload
operation (or the equivalent Settings → Plugins → Reload action). Runtime
commands must be read-only with respect to Trellis data; do not script a copy
into `/home/yue/.config/DankMaterialShell/plugins/TrellisDms` from this task.

## Risk points and rollback

- Rename/import edits must be atomic from the loader's perspective. A missing
  import or an old installed copy can reproduce a component error, so verify
  the copied directory contains the complete new resource graph.
- Do not conclude that reload succeeded from a still-visible widget: DMS can
  retain the previous generation after a failed load. Use the settings surface,
  popout, and DMS log together.
- If the resource migration is reverted, restore the two original filenames and
  all exact-case import/test references together, then rerun the static test.

## Current execution status

- Completed: lowercase resource rename, all QML/test reference updates, and
  exact-case import/resource uniqueness assertions.
- Passed: Node contract fixtures, Node syntax check, manifest parsing, and
  resource-graph review.
- Passed: the installed plugin matches the workspace; repeated DMS 1.6.2
  unload/load cycles complete with one daemon load per cycle and no later
  `File name case mismatch`; the user confirmed click-to-popout rendering.
- Unavailable: standalone `qmllint`/QML type-check tooling. Live DMS component
  loading provides the runtime gate for the renamed resource graph.
