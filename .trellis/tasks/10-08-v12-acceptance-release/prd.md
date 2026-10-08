# v1.2.4 Integration Acceptance and Release

## Goal

Demonstrate that Recent Changes, Search, and Quick Actions preserve the read-only observer and core behavior, then release v1.2.0 when the evidence supports it.

## Background

PROJECT_PROGRESS.md:1901 owns final acceptance. The manifest remains 1.0.0. Archived v1.1 acceptance-evidence.md:24/:77 records unavailable tooling and unverified host gates. Existing .github/workflows/candidate-release.yml:5/:76 supports candidate tags/prereleases; stable publication is not automated.

## Requirements

- AR1: Integrate tasks 1.2.1–1.2.3 and record deterministic no-duplicate history, honest failure/recovery, correct Live/Archive/All search, safe actions, and bounded resource behavior.
- AR2: Verify no-root/no-project/no-task/no-archive, malformed data, unknown status/version, multiple projects with same task identities, and large archives.
- AR3: Regress v1.1 Health/freshness/Diagnostics/Desktop modes and v1.0 bar/popout/archive/detail/project filter/pin/Settings/Launcher.
- AR4: Carry forward settings-save Desktop visibility, manual discovery refresh, configured automatic topology refresh, reload/disable/enable, multi-widget sharing, two Desktop placements, and restart/locale checks.
- AR5: Confirm no new network behavior, Trellis writes, agent hooks, permissions, parser pollution, or duplicate watcher registry. Quick-action errors remain local.
- AR6: Record fixture/static/offscreen/live evidence independently as pass/fail/unverified. Prepare versioned release notes/package and publish v1.2.0 only after required host and release gates pass.

## Acceptance Criteria

- [ ] AR1–AR2: All three children pass their feature fixtures and integration scenarios; identical snapshots and degraded/recovery produce no false completion/recreation history.
- [ ] AR3–AR4: Full existing contract suite passes; each host regression has explicit evidence/status, including the unresolved v1.1 host gates.
- [ ] AR5: Diff/resource review confirms existing permissions, read-only FileViews, argv-only processes, one snapshot publisher/watcher owner, and no network/Trellis mutation.
- [ ] AR6: Package contents, exact-case imports, manifest/version, translations, source ancestry/tag contract, and release notes are verified.
- [ ] AR6: Stable v1.2.0 publication has release evidence. If required host checks remain unverified, the stable-release criterion remains open and the roadmap/task is not marked fully complete.

## Out of Scope

v1.3 Notifications/Control Center, Agent Activity, new features found during acceptance, registry submission without its separate readiness evidence, and replacing runtime evidence with static assertions.

## Dependencies

All three feature children must pass before final integration. Archived task status does not waive any host acceptance criterion.
