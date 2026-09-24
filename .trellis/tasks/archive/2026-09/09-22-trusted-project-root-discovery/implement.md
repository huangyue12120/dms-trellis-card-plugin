# Trusted project root discovery implementation plan

## Ordered checklist

1. **Freeze current contracts.** Read the v0.3–v0.5 path/discovery tests and
   record the current `scanRoots`/legacy fallback, empty-root, output-cache, and
   one-publisher assertions. Do not change the hot-reload helper naming fix.
2. **Add pure ancestor candidates.** Implement and test a bounded
   `TrellisPaths.ancestorPaths` helper. It must normalize absolute input,
   preserve nearest-first order, stop at `/`/the cap, and reject invalid input.
3. **Probe in-project roots in the daemon.** Add a bounded nearest-first
   ancestor probe using argv-only `test -d <candidate>/.trellis` (the
   normalized candidate is absolute) followed by the existing `realpath -e --`
   path validation. Feed the first valid project
   into `_discoverProject`; retain downward discovery for configured parent
   folders and dedupe both paths through the existing project registry.
4. **Keep topology timing unchanged.** Ensure new direct task directories are
   found by the existing 15–300 second interval or manual refresh, without
   high-frequency polling, unbounded watchers, or remembered-root authority.
5. **Clarify Settings.** Update trusted-folder and remembered-project copy to
   explain task-descendant promotion, sibling-task discovery timing, and the
   one-time trust requirement for a completely new project. Preserve the safety
   copy and explicit `scanRoots: []` semantics.
6. **Expand static/pure tests.** Add ancestor path fixtures, daemon source checks
   for the bounded argv-only probe, and updated copy assertions. Re-run all
   existing discovery, safety, parser, projection, watcher, and manifest tests.
7. **Run runtime gate.** With the updated plugin installed, select a task
   descendant, refresh or wait one topology interval, verify the canonical
   project and sibling tasks appear, create a new sibling task, and verify it
   appears without another path entry. Repeat with an entirely new project to
   confirm it remains undiscovered until its containing trusted folder is added.
8. **Review scope and rollback.** Inspect changed paths and ensure no DMS
   install, Trellis data, hook, socket, network, or UI projection files were
   modified outside the stated scope.

## Validation commands

```bash
rtk node tests/test_trellis_contract.mjs
rtk node --check tests/test_trellis_contract.mjs
rtk rg -n "ancestorPaths|test -d|project ancestor|scan_root|Remembered|trusted" TrellisDms tests
rtk node -e 'JSON.parse(require("node:fs").readFileSync("TrellisDms/plugin.json", "utf8")); console.log("manifest: ok")'
```

The live gate must use a complete copied plugin directory and the DMS Settings
refresh/reload path; do not script writes to the installed plugin directory in
this task.

## Risk points and rollback

- An ancestor probe that starts above the selected path or runs without a cap
  could turn one trusted folder into a broad filesystem scan. Keep the
  nearest-first bound and canonical containment checks explicit.
- A failed `test -d`/`realpath` probe must not make a healthy downward scan
  degraded or discard its last-good Snapshot.
- If the new probe causes a regression, remove the helper/callback and its
  assertions, leaving existing downward discovery and settings keys intact;
  persisted roots and remembered summaries require no migration.
