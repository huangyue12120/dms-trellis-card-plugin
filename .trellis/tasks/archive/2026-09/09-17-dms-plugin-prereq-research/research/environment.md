# Stage 0 environment evidence

Observed on `2026-09-17T17:21:47+08:00` from the project working directory.
`verified` means the command or installed source produced the fact below;
`unverified` means the local evidence is insufficient; `blocked` means the
check could not run in this environment.

The complete `trellis-dms-plugin-spec-revised.md` was read (1,021 lines,
48,067 bytes); the Stage 0 table is at lines 523–538 and the implementation
boundary is at section 7.

## Stage 0 result matrix

| Item | Status | Result and evidence |
|---|---|---|
| 0.1 | verified with limitation | `dms version` reports `dms v1.6.1`; `dms --version` is unsupported (`unknown flag`). The installed schema and source support composite manifests. `dms ipc call plugins list` is blocked because DMS is not running. |
| 0.2 | verified / unverified | `qs --version` is Quickshell `0.3.1`; `qtpaths6 --query QT_VERSION` is `6.11.2`; `/usr/share/quickshell/dms/VERSION` is `1.6.1`. The DMS bundle is installed, but a running shell process was not available to prove which binary was launched at runtime. |
| 0.3 | verified | `.trellis/.version` and `trellis --version` both report `0.6.17`. |
| 0.4 | verified | The bounded `.trellis` inventory shows `spec/`, `tasks/`, `.runtime/sessions/`, `scripts/`, `workspace/`, and an empty `tasks/archive/`; see `trellis-data-model.md`. |
| 0.5 | verified / blocked | The original capture read two real live `task.json` records (`planning` and `in_progress`); the research task is now `in_progress` after task start. No real archived/completed sample exists in this checkout, so that sample requirement is blocked rather than fabricated. |
| 0.6 | verified | `task_store.py`, `tasks.py`, `task_utils.py`, `paths.py`, `task_context.py`, and `active_task.py` were inspected; see `trellis-data-model.md`. |
| 0.7 | verified | The original capture read one real session pointer; validation on 2026-09-21 found two real session pointers, both targeting this task. Stale, malformed, single-fallback, and multi-session behavior was exercised with disposable fixtures; no real sample has different tasks per session. |
| 0.8 | verified | `task.py --help`, `list --help`, `current --help`, `list --json`, and `current --json` were run. `list` and `current` support JSON; `list-archive` does not advertise `--json`. |
| 0.9 | verified | No `progress` field occurs in the two task records or any task JSON. The only progress-like value is the child counter emitted by `children_progress`; see `progress-semantics.md`. |
| 0.10 | verified / blocked | Source confirms `tasks/archive/<YYYY-MM>/<task>` and archive listing works, but this checkout contains no archived task directory to validate at scale. |
| 0.11 | verified | `FileView` exposes a `path` plus `watchChanges`; DMS comments state a nonexistent path cannot be watched. DMS uses `FolderListModel` for directory topology discovery; see `dms-api.md`. |
| 0.12 | verified / unverified | Installed plugin README, schema, `ExampleCompositePlugin`, `PluginService`, and component wrappers were read. The lower compatible DMS version for this plugin is not proven. |
| 0.13 | verified | Installed `Theme`, `SettingsData`, and `SpringMotion` expose the semantic colors, spacing, typography, radius, durations, easing, and reduced-motion surfaces used below. |
| 0.14 | verified | The local MIT checkout of `payprays/codeIsland-dms` and its complete `linux-skeleton/README.md` were read. No daemon or hook was installed or run. |
| 0.15 | verified | The local `rifqiakrm/code-island` checkout identifies itself as macOS 14+ SwiftUI/AppKit under GPLv3; it is recorded only as a conceptual reference. |
| 0.16 | verified | A disposable matrix accepted live/archive paths and rejected traversal, external absolute paths, symlink escapes, stale/malformed pointers, ambiguous fallback, and non-whitelisted Markdown paths; see `path-safety.md`. |

## Runtime version matrix

| Component | Observed value | Command/source | Status |
|---|---|---|---|
| Distribution | Fedora 44 (Forty Four) | `cat /etc/fedora-release` | verified |
| Session/compositor context | `XDG_SESSION_TYPE=wayland`, `WAYLAND_DISPLAY=wayland-1`, `niri 26.04` | environment and `niri --version` | verified |
| DMS CLI | `dms v1.6.1` | `dms version` | verified |
| DMS bundled shell tree | `1.6.1` | `/usr/share/quickshell/dms/VERSION` | verified |
| Quickshell executable | `0.3.1` | `qs --version` | verified, but not a substitute for the bundled-shell check |
| Qt | `6.11.2` | `qtpaths6 --query QT_VERSION` | verified |
| Trellis project | `0.6.17` | `.trellis/.version` | verified |
| Trellis CLI | `0.6.17` | `trellis --version` | verified |
| Python | `3.14.7` | `python3 --version` | verified |

RPM ownership confirms `/usr/bin/dms` is from `dms-cli-1.6.1-1.fc44.x86_64`,
the DMS bundle is from `dms-1.6.1-1.fc44.x86_64`, and Quickshell is from
`quickshell-0.3.1-5.fc44.x86_64`.

`qmake6`, `qml6`, `qmllint6`, and `qmllint-qt6` are not installed. This is a
tooling limitation, not evidence that the Qt/QML runtime is absent.

## DMS availability and repository limitation

No DMS/Quickshell process was running when checked. Consequently
`dms ipc call plugins list` failed with `QLocalSocket::SocketAccessError` and
exit status 255. The installed files are sufficient for source/API inspection,
but live plugin reload, IPC status, and multi-screen instance behavior remain
unverified.

The working directory is not a usable Git repository: `git status` reports
`fatal: not a git repository`. Therefore `git diff --check` and
`git diff --stat` are not valid verification gates for this checkout and are
not claimed as passed.

## Provenance commands

The primary commands were:

```text
cat /etc/fedora-release
niri --version
dms --version                 # unsupported; records the syntax mismatch
dms version
qs --version
qtpaths6 --query QT_VERSION
cat /usr/share/quickshell/dms/VERSION
trellis --version
cat .trellis/.version
python3 ./.trellis/scripts/get_context.py --mode packages
tree -a -L 4 .trellis
python3 ./.trellis/scripts/task.py --help
python3 ./.trellis/scripts/task.py list --json
python3 ./.trellis/scripts/task.py current --json
```

No production plugin, QML surface, hook, or agent configuration was changed
for these checks.

## Validation-session update (2026-09-21)

The task was subsequently started, so its current `task.json` status is
`in_progress`; the 2026-09-17 matrix above intentionally preserves the status
values observed during the original research run. There are now two real
session files under `.trellis/.runtime/sessions/`, both pointing at this task.
With no matching session identity supplied to the validation shell,
`python3 ./.trellis/scripts/task.py current --json` returned
`{"current_task": null, "source": "none", "stale": false}` and exited with
status 1. This is the
resolver's safe multi-session behavior, not evidence that either pointer is
missing. The absence of an archived task and the lack of a running DMS process
remain unchanged.
