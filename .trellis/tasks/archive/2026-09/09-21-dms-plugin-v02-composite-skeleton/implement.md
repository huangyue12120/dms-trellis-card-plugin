# v0.2 Composite Skeleton Implementation Plan

## Ordered checklist

1. Re-read the approved Stage 0 DMS API/environment research and the v0.2 PRD.
2. Create `TrellisDms/plugin.json` with the verified composite manifest shape,
   development version `0.2.0`, and settings-only permissions.
3. Create `TrellisDms/TrellisDaemon.qml`:
   - import only the DMS/QML modules needed for a `PluginComponent` and global
     service;
   - publish the hard-coded debug snapshot once on completion;
   - log creation and destruction;
   - contain no FileView, FolderListModel, Proc, Process, Timer, Socket, or
     filesystem access.
4. Create `TrellisDms/TrellisWidget.qml`:
   - consume `snapshot` through `PluginGlobalVar`;
   - expose horizontal and vertical diagnostic components;
   - keep the visual deliberately skeletal and readable;
   - do not implement the final pill/popout design.
5. Create `TrellisDms/TrellisSettings.qml` with the `trellisDms` plugin
   settings namespace and one explicitly reserved placeholder setting or
   equivalent loadable settings content.
6. Run static validation:
   - JSON parse and manifest field/relative-path checks;
   - compare manifest fields with the installed DMS schema;
   - search v0.2 source for forbidden filesystem/process/network/hook/Trellis
     write paths;
   - check that daemon publishes `snapshot` and widget consumes it through
     `PluginGlobalVar`.
7. If DMS is running and a safe plugin installation path is available, perform
   manual discovery/enable/reload checks and inspect daemon/widget lifecycle
   logs. Do not silently install outside the workspace without explicit
   runtime permission; if DMS is unavailable, record the limitation.
8. Validate multiple widget instances if the DMS runtime permits multiple bar
   placements. Evidence must show one daemon publication path, not merely two
   visible widgets.
9. Run task context validation and focused JSON/QML checks. Report absent
   `qmllint`/live DMS tooling as limitations rather than failures of static
   implementation.

At implementation time `dms version` reports 1.6.2, while the archived Stage 0
capture reports 1.6.1. Keep the historical capture unchanged and record the
current runtime in the final task summary; `requires_dms: ">=1.6.1"` is still
compatible.

## Validation commands

```bash
python3 -m json.tool TrellisDms/plugin.json
python3 ./.trellis/scripts/task.py validate 09-21-dms-plugin-v02-composite-skeleton
python3 - <<'PY'
import json
from pathlib import Path

manifest = json.loads(Path("TrellisDms/plugin.json").read_text(encoding="utf-8"))
assert manifest["type"] == "composite"
assert manifest["components"] == {
    "daemon": "./TrellisDaemon.qml",
    "widget": "./TrellisWidget.qml",
}
assert manifest["settings"] == "./TrellisSettings.qml"
assert set(manifest["permissions"]) == {"settings_read", "settings_write"}
for rel in [*manifest["components"].values(), manifest["settings"]]:
    assert (Path("TrellisDms") / rel.removeprefix("./")).is_file(), rel
print("manifest contract: ok")
PY
rg -n "FileView|FolderListModel|Proc|Process|Socket|Quickshell\.exec|network|\.trellis|hook|setPluginData|savePluginData" TrellisDms
```

The final `rg` command is expected to return no forbidden implementation use;
its search terms may appear only in comments/documentation if those comments
are necessary and do not describe executable behavior. If `qmllint6` or a
running DMS is unavailable, state that explicitly in the task result.

## Risky files and rollback points

- `TrellisDms/plugin.json`: schema and component paths; rollback by restoring or
  removing this file.
- `TrellisDms/TrellisDaemon.qml`: global snapshot publication; rollback by
  removing the daemon component and manifest reference.
- `TrellisDms/TrellisWidget.qml`: host-facing bar component; keep diagnostic
  only so final UI work can replace it after the UI Gate.
- `TrellisDms/TrellisSettings.qml`: settings namespace; do not write directly
  to user settings during tests.

## Completion criteria before `task.py start`

- `prd.md`, `design.md`, and this `implement.md` are converged and contain no
  blocking open question.
- Both JSONL manifests contain real spec/research entries.
- The user has approved this final planning summary.

## Completion criteria after implementation

- All PRD acceptance criteria are checked or explicitly marked unverified due
  to the documented DMS/Git environment limitation.
- No production file outside `TrellisDms/` is changed by the implementation.
- Quality review confirms manifest/QML boundary, singleton intent, reactive
  global snapshot consumption, settings namespace, and forbidden-surface
  exclusions.

## Execution result

- Implemented the four files under `TrellisDms/` and no other production
  surface.
- Manifest, component paths, settings-only permissions, global snapshot flow,
  forbidden-surface scan, delimiter sanity check, and task context validation
  passed.
- Current DMS 1.6.2 / Quickshell 0.3.1 was observed; the archived Stage 0
  capture remains historically 1.6.1. Live DMS IPC/reload/multi-display
  behavior is unverified because the shell is not running.
- `qmllint`/`qmlformat` are unavailable, and Git diff/commit checks cannot run
  in this workspace because it is not a usable Git repository.
