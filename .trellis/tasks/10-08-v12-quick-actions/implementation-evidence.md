# Quick Actions Implementation Evidence

Recorded 2026-10-08. Repository fixtures and source/API inspection are distinct from supported-host acceptance. No clipboard contents were read or written and no folder was opened during implementation.

## Change boundary

The approved child adds identity-only Copy task ID, Copy project/task path, and Open project/task folder actions. Task controls also work in archive detail. Existing Recent Changes, Search, detail, Snapshot/Health, preferences, Diagnostics copy, permissions, and watchers are preserved. Main owns specs, planning/context, README/progress, deployment, and releases; this implementer edited none of those files.

Files changed for this child:

- `TrellisDms/lib/trellisPaths.js`: pure allowlisted request validation and encoded local-file URL generation.
- `TrellisDms/TrellisDaemon.qml`: independent serialized action generation, Process/FileView ownership, fresh configured-root authority, canonical project/.trellis/task/archive/task.json validation, execution and bounded local response codes.
- `TrellisDms/lib/trellisprojection.js`: current unique project/live-task identity context for controls; archive identity retains month/directory selectors. It grants no filesystem authority.
- `TrellisDms/TrellisWidget.qml`: native Actions disclosures in project headers and task detail, displayed task ID, wrapping native 40px controls, existing scroll/focus integration, independent transient pending/ownership/feedback, owned cancellation on Back/close/destruction.
- `TrellisDms/translations/zh_CN.json`: corresponding English-source/Chinese UI strings.
- `tests/test_trellis_contract.mjs`: pure/action-daemon/action-widget and coupled root-change fixtures; existing Search harness accommodates the new action channel without changing its expected behavior.
- This task-local evidence file.

## Implemented protocol and authority

Requests contain only `requestId`, allowlisted `action`, `kind` (`project`, `live`, `archive`), and `projectId`. Task kinds additionally require `taskId`; archive additionally requires `month` and `dirName`. Extra fields including paths, commands, executables, documents, or URLs are rejected. Bounds are requestId 128, projectId 4096, taskId/directory 256, canonical execution value 4096; archive month/directory use the existing exact identity validators. Raw textual controls are rejected before trimming. Metadata task identity still follows existing trimmed stored ID / directory fallback semantics.

Responses echo the validated request identity, bounded `status` and `code`; successful responses additionally include the verified value. Status is `copied` only after clipboard Process exit zero, `accepted` only after an accepted opener request, or `error`. The widget owns pending state and renders fixed localized feedback, including cancellation/supersession. Response identity and ownership are checked before ending pending; stale detail keeps its local failure copy even when current Snapshot identity no longer enables its buttons.

The daemon freshly reads effective roots through `_configuredRoots()` and uses `_projectAuthorizedByRoots()` with action-owned canonical directory probes. This preserves containment and the existing eight-candidate descendant promotion policy. State cache/retained discovery identities do not authorize an action. Duplicate current projects/live IDs reject via array lookup, including prototype-like IDs. Archive identity is project/task/month/direct directory; no duplicate archive search is introduced.

It canonicalizes selected project and `.trellis`, live task subtree/directory or archive root/month/direct directory, and direct regular `task.json`. Canonical locations must equal their validated lexical identity; symlink redirection is rejected. JSON is stat-limited and UTF-8 byte-limited to 1 MiB, then parsed to check the current displayed effective ID. Live fallback remains compatible with the parser, including valid JSON with absent/non-string/blank stored IDs; archive uses its existing available-object summary semantics. Malformed/unreadable/oversized/mismatched identity rejects locally.

After task I/O, locations and canonical configured-root authority are refreshed again. Every queue launch and callback checks operation generation, exact current request identity, effective roots, unique current project, and live identity/directory. Clipboard object creation is followed by another guard immediately before launching. Root-setting changes/destruction clear only action-owned pools and publish null; the current widget stops pending. Older requests/callbacks cannot replace newer work.

Clipboard argv is exactly `["dms", "cl", "copy", "--", value]`; new actions do not change existing Diagnostics argv. The required separator keeps valid flag-like IDs such as `--help`, `-d`, and `--type` as data. Folder URLs percent-encode each path segment, so spaces, Unicode, `%`, `#`, and `?` retain their target meaning. `Qt.openUrlExternally` acceptance never claims an external window appeared. No terminal/editor, shell, write to Trellis, network, permission, timer, or watcher was added.

## Repository verification: PASS

- `rtk proxy node tests/test_trellis_contract.mjs`: full prior regressions and new pure, actual daemon, actual widget, and channel-isolation fixtures pass.
- `rtk proxy node --check tests/test_trellis_contract.mjs`: syntax pass.
- Node VM syntax check: both changed pure JavaScript modules and all 104 daemon / 50 widget root JavaScript methods parse. This is not a QML component load.
- Translation JSON parsing, all widget translation keys, and exact-case QML resource checks pass through the full harness.
- UTF-8/LF checks pass for changed product sources/translations.
- Scoped `rtk proxy git diff --check -- <owned product/test paths>`: pass.
- `rtk proxy python3 .trellis/scripts/task.py validate .trellis/tasks/10-08-v12-quick-actions`: pass (implement.jsonl 9 entries, check.jsonl 10 entries).

Actual daemon fixtures mock only host Process/FileView/opener. They cover live/archive/project copies/opens; exact separated argv for flag-like/prototype/Unicode IDs; canonical and URL-sensitive paths; parser/archive identity fallback; removed/redirected roots; trusted-descendant ancestor promotion and cap rejection; duplicate/current identity changes; traversal and project/.trellis/tasks/live/archive/month/task/task.json symlink escape; direct file/directory types; malformed/oversized/unreadable JSON; stat versus actual UTF-8 byte limits; root/JSON/target changes during I/O; request changes and just-before-launch configuration guards; missing APIs, exceptions and nonzero exits; cancellation while reading or while clipboard is queued; stale callbacks and deferred requests; serialized supersession; unchanged parser inputs/Snapshot/Health.

Actual widget fixtures cover project/live/archive request shapes, no arbitrary fields, pending duplicate prevention, stale/malformed/wrong-identity replies, localized success/failure/accepted feedback, two-widget supersession and owned close/Back cancellation, unchanged pin/filter, and detail failure feedback after Snapshot identity disappears. A coupled daemon-settings/widget test retains the old global request, publishes null on root change, ends pending, destroys action pools, and ignores the obsolete reader. Actual Search and detail handlers still successfully run during an action failure/cancel with their generations unchanged.

Native supported DMS source inspection confirms `DankButton` supplies tab focus, Return/Space activation and FocusRing, and `PluginGlobalVar.value` returns the stored object reference. Controls reuse DMS Theme/native components, share the existing single screen-clamped scroll area and reveal focused controls. Static/native API inspection does not establish rendered keyboard behavior.

## Host acceptance: UNVERIFIED

`qmllint` and `qmlformat` are unavailable in the known environment. A supported DMS 1.6.2 host exists with the installed baseline, but the complete candidate has not been deployed or loaded by this child. Real clipboard output, local-folder launching, focus/Tab/Shift-Tab/Return/Space and scroll, normal/narrow rendering, two visible widgets, disable/enable and reload remain acceptance work owned by main. Existing isolated clipboard argument preflight remains parsing evidence only; it did not touch the host clipboard.

Product and tests were frozen after repository checks passed and the main session was notified. The counts/results above describe that implementation freeze. Independent Trellis/security review and any later coordinated fixes are subsequent evidence, not claimed here.

## Post-freeze reload finding and ownership

Read-only inspection after freeze found a lifecycle gap: completed `actionRequest` remains in plugin global variables. Installed DMS `PluginService.unloadPlugin()` (`/usr/share/quickshell/dms/Services/PluginService.qml:552`) destroys component/daemon instances but does not clear `globalVars`; `setGlobalVar()` preserves those globals. A retained operation must not be treated as a fresh click by a recreated daemon, regardless of startup ordering. Completed/cancelled requests therefore need owned consumption, and completion-versus-null notification ordering must preserve truthful widget feedback.

The implementer reported this finding immediately and made no post-freeze product/test edits. Main assigned exclusive product/test verification, correction, and actual daemon/widget recreation regression coverage to `v12_check`. The proposed correction is to publish completion before consuming only the still-owned request, consume pending requests on cancellation/root change/destruction, and have widget ownership observation recognize an already-matching completion before treating a cleared request as superseded. The checker owns the final design and regression result. Do not claim the frozen implementation alone satisfies reload replay prevention; use the checker's evidence for that gate.

All valid live JSON directory-name fallback cases above retain the approved existing parser effective-ID behavior. This post-freeze lifecycle correction does not require a new task JSON schema.

