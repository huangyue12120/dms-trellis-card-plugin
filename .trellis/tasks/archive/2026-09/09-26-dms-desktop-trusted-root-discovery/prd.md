# DMS v1.0 desktop and discovery corrections

## Goal

Restore the missing desktop instance settings, eliminate the recurring false task-path warning, and make mounted Trellis roots reachable through the explicit trusted-folder picker.

## Confirmed behavior and constraints

- DMS 1.6.2 uses the manifest `settings` component as a desktop widget's custom instance-settings component. `TrellisSettings.qml` currently replaces the generic DMS display selector and position/size reset controls, and does not provide those instance controls. Evidence: DMS `PluginService.qml:345-384`, `DesktopWidgetRegistry.qml:172-186`, `PluginDesktopWidgetSettings.qml:68-128`; `TrellisDms/plugin.json`.
- Live task discovery enumerates direct child directories under `.trellis/tasks`, including the reserved `archive` root. That root is then rejected by `resolveTaskDir` and published as `task_path_rejected`. Other live tasks are processed separately, which is why their status and progress can still appear. Evidence: `TrellisDms/TrellisDaemon.qml:1233-1245,1265-1274`; `TrellisDms/lib/trellisPaths.js:480-505`.
- DMS's built-in file browser starts at `$HOME`, offers home subfolders as quick access, and clamps upward navigation at `$HOME`. Its path field accepts a manually entered absolute path, but mounted roots are not reachable by ordinary upward browsing. Evidence: DMS `FileBrowserContent.qml:136-140,175-195,271-307,309-319`; `FileBrowserNavigation.qml:82-104`.
- Trusted scan roots are explicit user authorization. Discovery is bounded to configured roots; remembered projects do not grant scan authority. The user has decided Codex workdir/task autodiscovery is out of scope for this work.

## Requirements

### R1. Desktop instance settings

- Provide the DMS display selector for each desktop widget instance, with an all-displays default and independently persisted per-instance preferences.
- Keep DMS's standard position and size reset actions available.
- Keep plugin-wide Trellis settings separate from per-instance desktop settings; opening an instance settings card must not initialize or write global plugin settings through DMS's instance-scoped service.

### R2. Reserved archive directory

- Do not enumerate `.trellis/tasks/archive` as a live task candidate or report it as `task_path_rejected`.
- Preserve the existing archive discovery flow and security rejection of genuinely invalid or escaping task paths.

### R3. Mounted trusted-folder selection

- Allow users to browse to and explicitly add a folder under locations such as `/run/media/<user>` and `/mnt/<mount>`.
- Add only the folder the user selects, subject to the existing root, depth, canonical-path, and result caps.
- Keep discovery disabled when the configured trusted-root list is empty. Do not automatically add or scan `$HOME`, `/`, `/proc`, all mounts, or any Codex-derived path.

## Child task map

- `09-26-desktop-settings-and-mounted-folder-picker`: R1 and R3; owns `TrellisSettings.qml` and the DMS folder-picker integration.
- `09-26-exclude-archive-root-from-live-task-scan`: R2; owns live task enumeration in the daemon.
- Child implementations must be coordinated serially because both update the shared contract-test file. The parent owns cross-child review and the final DMS acceptance pass; it is not the implementation target.

## Acceptance criteria

- [ ] Each desktop instance exposes the DMS display selector and reset actions; display preferences persist per instance and do not overwrite plugin-wide settings.
- [ ] A project with `.trellis/tasks/archive` has no `task_path_rejected` warning for that reserved directory; live tasks, progress, and the existing archive view continue to work.
- [ ] An invalid or escaping task path remains rejected and diagnosable.
- [ ] A user can browse to `/run/media/...` or `/mnt/...`, select a folder, and see only that explicit folder added to the trusted-root list.
- [ ] Browsing mounted locations does not expand scan scope by itself; an empty trusted-root list still disables discovery.
- [ ] No behavior attempts to discover or trust a Codex current task/workdir.
- [x] Planning and implementation records distinguish static checks from DMS 1.6.2 runtime acceptance; unavailable runtime checks remain explicitly unverified.

## Out of scope

- Codex process/session/workdir autodiscovery, hooks, or automatic trusted-root additions.
- Automatic scans of `$HOME`, `/`, `/proc`, or all mounted filesystems.
- Changes to DMS/Quickshell source outside this repository, Trellis project data, or a release/publish operation.
