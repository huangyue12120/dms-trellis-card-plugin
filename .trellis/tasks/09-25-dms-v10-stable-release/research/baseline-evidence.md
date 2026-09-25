# v1.0 planning baseline and evidence map

Captured on 2026-09-25 from the current worktree and archived v0.8/v0.9 task records. This is planning evidence; no product tests or DMS UI checks were run in this session.

## Current package and host

- Workspace package: `TrellisDms/`; manifest is `0.9.0`, requires DMS `>=1.6.2`, registers daemon/bar/desktop/Launcher, and declares `settings_read`, `settings_write`, and `process`; no network permission is declared.
- Host commands report Fedora 44, DMS 1.6.2 (`dms version`), Quickshell 0.3.1 (`qs --version`), Qt 6.11.2 (`qtpaths6 --query QT_VERSION`), and niri 26.04 (`niri --version`).
- No `dms` or `quickshell` process is running. `qmllint` and `qmlformat` are not installed on `PATH`.
- User selected DMS 1.6.2 as the target baseline for the v0.8 RC and selected the v0.9 Desktop, zh_CN localization, and Launcher work for inclusion in the v1.0 candidate with host verification. A failing optional item is to be disabled or deferred individually.

## Existing evidence

| Area | Source | Evidence class / limit |
|---|---|---|
| v0.8 core state matrix | `.trellis/tasks/archive/2026-09/09-24-dms-plugin-v081-state-matrix/research/state-matrix-results.md` | Disposable fixtures, pure projection, static source checks, and Node contract suite. Not live UI evidence. |
| v0.8 security/lifecycle | `.trellis/tasks/archive/2026-09/09-24-dms-plugin-v082-stability-security/stability-security-evidence.md` | Fixture/static checks; resource numbers are code limits, not measured performance. |
| v0.8 target RC | `.trellis/tasks/archive/2026-09/09-24-dms-plugin-v083-target-rc/rc-validation.md` | User-reported DMS 1.6.2 checks for core loading, empty state, bar/popout, multi-bar/screen, idle/reload, disable/cleanup, version warnings, and permission-denied recovery. No raw per-case logs/screenshots and no independent replay in this session. |
| v0.9 product decisions and APIs | `.trellis/tasks/09-24-dms-v09-optional-p2/prd.md`, `design.md`, and `research/v09-platform-apis.md` | Desktop overview, DMS locale, and `!trellis` Launcher decisions were approved; local code/static checks exist. |
| v0.9 runtime gates | `.trellis/tasks/09-24-dms-v09-optional-p2/implement.md` and `PROJECT_PROGRESS.md` | Desktop placement/resize/multi-display, locale switch/layout, Launcher search/selection/popout/State persistence, and multi-surface reload remain unverified. |
| UI contract | `docs/ui-ux-spec.md`, `docs/ui-state-matrix.md`, `docs/ui-component-contract.md` | Approved design inputs for the P0/P1 surfaces. v0.9 additions are documented in `.trellis/tasks/09-24-dms-v09-optional-p2/` artifacts. |

## Planning implications

- Reconcile the roadmap checkboxes against these source records; never promote a user report, fixture, static check, or unmeasured limit into a stronger evidence class.
- Final acceptance must add target-host evidence for the v0.9 surfaces because the user selected them for the v1.0 candidate. If a surface fails, disable or defer only that optional item, rerun the core checks, and record the resulting package contents.
- Keep the 1.0 candidate read-only and local. Do not install or start DMS, replace an installed plugin copy, publish to an external registry, modify Trellis data, or install hooks/daemons as part of this task.
- If a required live gate cannot be exercised in the current session, provide a bounded host checklist and keep the release status at candidate/pending until evidence is supplied.
