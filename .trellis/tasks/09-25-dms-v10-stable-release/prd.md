# DMS plugin v1.0 stable release

## Goal

Prepare a traceable, installable v1.0 release of the Trellis DMS plugin by freezing the P0/P1 contract, completing final acceptance, and handing off accurate user documentation.

## Confirmed facts

- `PROJECT_PROGRESS.md` defines three ordered v1.0 deliverables: P0/P1 contract freeze, final security/compatibility/runtime acceptance, and release documentation/rollback handoff.
- The current manifest is `0.9.0`, requires DMS `>=1.6.2`, registers the daemon, bar widget, desktop widget, and Launcher, and declares only `settings_read`, `settings_write`, and `process` permissions. It declares no network permission.
- The current host reports Fedora 44, DMS 1.6.2, Quickshell 0.3.1, Qt 6.11.2, and niri 26.04. The DMS process is not running; `qmllint` and `qmlformat` are unavailable.
- Archived v0.8 evidence includes passing fixture/static checks and a user-reported DMS 1.6.2 manual pass for core load/empty state, bar/popout, multi-bar/screen, idle/reload, disable/cleanup, version warnings, and permission-denied recovery. The current session did not replay these UI checks, and no per-case logs or screenshots are attached.
- v0.9 Desktop, i18n, and Launcher code is present and has static checks; target-host runtime checks for those surfaces remain open. Agent Activity Provider was evaluated and deferred; no daemon or hooks are installed.
- By user decision on 2026-09-25, the approved v0.9 Desktop, zh_CN, and Launcher items stay in the v1.0 candidate and receive DMS 1.6.2 runtime checks. A failed optional item will be disabled or deferred individually, without blocking the P0/P1 core.
- External registry publication was not part of v0.9 and requires separate authorization.

## Requirements

- Reconcile the v1.0 release-gate table with archived task evidence without upgrading fixture/static or user-reported claims into independently observed runtime evidence.
- Freeze the P0/P1 Snapshot, progress, path-safety, watcher, projection, UI, Settings/State, permission, and DMS compatibility contracts; make only verified corrections required for consistency or release readiness.
- Verify that release documentation, manifest, tested compatibility baseline, permissions, optional-surface status, and known limits agree.
- Run the repository's relevant contract, syntax, manifest, and Trellis-task checks after implementation; record unavailable DMS/Wayland checks as pending unless supported by fresh evidence.
- Add the v0.9 Desktop, locale, Launcher, and multi-surface lifecycle behaviors to the target-host acceptance gate; disable or defer a failing optional item individually.
- Produce user documentation for setup, trusted-root configuration, status/progress semantics, read-only/privacy boundary, troubleshooting, disable/uninstall, and rollback.
- Keep v1.0 limited to the approved local package and release handoff. Do not publish externally or modify user Trellis data, Agent configuration, hooks, or external daemons.

## Acceptance Criteria

- [ ] All v1.0 child tasks pass in order. Any unavailable required host gate remains pending and prevents a final stable-release claim until evidence is supplied or the affected optional item is disabled/deferred.
- [ ] The frozen local candidate declares `1.0.0` after task 1.0.1; final release status is claimed only after task 1.0.2 gates pass or each optional exception is explicitly disabled/deferred.
- [ ] P0/P1 core state, read-only behavior, nullable progress, safe resolver, empty/error recovery, and compatibility claims agree across code, README, specs, and `PROJECT_PROGRESS.md`.
- [ ] Each v0.9 P2 item is explicitly marked included and verified, disabled, or deferred; no unselected/failed optional surface is a startup dependency.
- [ ] Desktop placement/resize, zh_CN/en locale behavior, Launcher search/selection/popout, and multi-surface reload have DMS 1.6.2 evidence or are individually disabled/deferred in the release package.
- [ ] User-facing docs include install/configuration/use, permission and privacy boundaries, known limitations, disable/uninstall, and rollback instructions.
- [ ] External registry publication, Agent hooks, CodeIsland installation, network access, and Trellis writes remain out of scope.

## Out of scope

- New P0/P1 features, Snapshot schema redesign, visual redesign, or changes to Trellis data.
- Activity-provider runtime integration, Agent hooks/configuration, external daemon installation, external registry review/publication, or push/deploy actions.
- Claiming cross-compositor or unknown-DMS support without evidence.
