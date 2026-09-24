# v0.5 implementation plan

## Ordered work

1. Create the information architecture, state matrix, and component contract.
   Verify all Snapshot and orientation states have an explicit projection.
2. Freeze native visual, accessibility, copy, density, and motion decisions.
   Record the user's Design Gate approval and known DMS host limitations.
3. Add deterministic pure helpers for display-mode normalization/projection
   and remembered-project summaries where doing so avoids duplicating logic in
   QML. Extend contract tests first.
4. Implement `displayMode` settings, compact horizontal/vertical pill content,
   and the minimal read-only `popoutContent`.
5. Replace the single-path settings flow with a trusted-folder picker/list,
   while preserving legacy `projectRoot` fallback and the existing interval/
   refresh controls.
6. Teach the daemon to consume bounded `scanRoots`, persist only successful
   bounded project summaries in DMS state, and never use the state cache as a
   scan authority.
7. Bump the plugin version to `0.5.0`, update roadmap evidence, and validate
   manifest, Node contracts, Trellis artifacts, source boundaries, and any
   available QML/live-DMS checks.

## Validation commands

```bash
python3 -m json.tool TrellisDms/plugin.json
node tests/test_trellis_contract.mjs
python3 ./.trellis/scripts/task.py validate 09-22-v05-ux-discovery-milestone
rg -n "displayMode|scanRoots|discoveredProjects|popoutContent|folderMode" TrellisDms tests docs
rg -n "find.*(/|HOME|/proc)|Quickshell.exec|Socket|network|CodeIsland|hook|setText|save\\(" TrellisDms
```

Run `qmllint`/`qmlformat` and live DMS click/folder-picker/multi-screen checks
only when the relevant runtime/tools are available. Report unavailable checks
without substituting static confidence.

## Review gates

- Design files agree before production QML changes.
- The user statements approving bounded trusted-root discovery, clear settings
  explanation, and completion of the five v0.5 items are recorded as the Gate.
- No child implementation broadens into Markdown, mutation, filters, or P2
  integrations.
- Final review checks state coverage, source-to-settings-to-daemon data flow,
  backward compatibility, and read-only/security boundaries.
