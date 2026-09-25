# DMS plugin v1.0 stable release — design

## Task ownership and order

The parent task owns version-wide requirements, cross-child evidence reconciliation, and the final release-readiness decision. Three child tasks own independent deliverables and must run in this order:

1. `09-25-dms-v101-contract-freeze` — freeze the candidate package and P0/P1/P2 contract.
2. `09-25-dms-v102-final-acceptance` — run automated checks and target-host acceptance against that exact candidate.
3. `09-25-dms-v103-release-handoff` — document the final accepted package, limitations, and rollback.

The dependency is written in each child's PRD. Parent/child links are organizational only. Start the next child after the preceding child is checked; start the parent only for final integration review.

## Release scope and boundaries

- P0/P1 Trellis observer remains read-only. The daemon owns all filesystem/process work and publishes the shared Snapshot; surfaces only project that data.
- Preserve schema-1 Snapshot semantics, all valid sessions, stored/runtime/display state separation, `progress: number | null`, canonical safe-path containment, and lazy read-only Markdown/archive channels.
- The local candidate includes the already approved v0.9 Desktop, zh_CN catalog, and `!trellis` Launcher. Each remains optional and must pass its DMS 1.6.2 host check. If an item fails, remove/disable only that item's registration or locale catalog, document the post-v1 disposition, and rerun the core gate.
- The v1.0 manifest contract is version `1.0.0`, `requires_dms >=1.6.2`, permissions `settings_read`, `settings_write`, `process`, and no network permission. Agent Activity Provider runtime, hooks, Control Center, and registry publication are excluded.

## Evidence flow

```text
Archived v0.x evidence + current source contracts
                    ↓
          1.0.1 frozen candidate
                    ↓
  1.0.2 fixture/static + target-host evidence
                    ↓
        1.0.3 docs and handoff
                    ↓
          parent integration gate
```

Record evidence as fixture, static, offscreen, independently observed host, or user-reported host. Do not promote evidence to a stronger class. The archived v0.8 host report is useful historical evidence, but does not replace v0.9 surface checks selected for this candidate.

## Compatibility and data migration

- Keep DMS 1.6.2 as the tested baseline and minimum declaration, matching the current manifest and inspected platform APIs.
- Do not change Snapshot schema, stored user State keys, permission set, trusted-root rules, or Trellis file layout.
- Keep English source copy as fallback if the zh_CN catalog is disabled. Desktop and Launcher can be disabled through their existing manifest registrations.
- The manifest is a local candidate. No external distribution or upgrade has occurred until a separately authorized release action.

## Host gate and failure behavior

The current host has the target DMS binaries but no running DMS/Quickshell process, and `qmllint`/`qmlformat` are unavailable. Do not launch or replace the user's DMS installation as part of this plan. Complete fixtures/static checks locally; prepare a concise DMS 1.6.2 checklist for the user's existing GUI session if live evidence cannot be captured in-session. Keep the v1.0 release claim pending until required core checks and retained P2 checks have evidence.

## Rollback

- Revert only the manifest version/component or translation entry that caused a regression, preserving the P0/P1 daemon/widget/settings core.
- Restore the pre-change manifest and docs if contract or automated checks fail; keep the package at candidate/unreleased status.
- If an optional surface fails host validation, disable/defer it individually and rerun the core tests. Do not edit Trellis data or user DMS/Agent configuration.
