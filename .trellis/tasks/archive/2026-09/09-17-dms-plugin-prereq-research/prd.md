# Trellis DMS plugin prerequisite research

## Goal

Turn the revised `trellis-dms-plugin-spec-revised.md` Stage 0 assumptions into
evidence-backed facts before any production plugin code is written. The output
is a research record that a later implementation task can treat as the source
of truth for the Trellis data contract, DMS/Quickshell API boundary, progress
semantics, path-safety rules, and optional CodeIsland activity integration.

## Background and confirmed constraints

- The repository currently contains Trellis scaffolding and the revised
  specification, but no production DMS plugin source or test suite.
- The target platform in the specification is Fedora 44 + niri + DankMaterialShell
  + Wayland. Local command availability and versions must be reported as facts;
  unavailable commands or inaccessible upstream sources must be reported as
  limitations rather than guessed.
- Stage 0 is research-only. It must not create production plugin code, modify
  `.trellis/` data that is being observed, install agent hooks, or modify user
  agent configuration.
- External projects are references only: `payprays/codeIsland-dms` is the
  Linux/DMS reference; `rifqiakrm/code-island` is macOS-only and must not be
  used as a Linux implementation contract. `trellis-card` has no confirmed
  license in the specification and must not be copied.

## Requirements

1. Read the complete revised specification and enumerate all Stage 0 checks
   (0.1–0.16) in the research record.
2. Capture the local environment: DMS version/API discovery, Quickshell and
   Qt information, niri context, and Trellis project/CLI versions. Distinguish
   a command that exists but uses a different version syntax from a missing or
   unverified dependency.
3. Inspect the real `.trellis/` tree, task records, runtime session pointers,
   archive layout, `task_store.py`, and active-task resolver. Record field names,
   types, optionality, status/lifecycle behavior, malformed/stale cases, and
   multi-session behavior using actual samples.
4. Verify CLI machine-readable capabilities by running the current help and
   relevant `list`/`current` commands; do not infer support from an upstream
   issue alone.
5. Establish progress semantics from actual task records and implementation
   checklists. If no authoritative overall progress exists, record
   `number | null` and prohibit fabricated percentages.
6. Investigate DMS/Quickshell plugin APIs, `FileView.watchChanges` scope,
   directory-topology discovery options, manifest/composite/global-var/
   Settings/State/Theme conventions, and the minimum compatible DMS version.
7. Review the Linux CodeIsland reference protocol and separately document the
   macOS Code Island project as non-implementation reference. Identify what,
   if anything, is suitable for a later optional P2 adapter.
8. Design and exercise a safe resolver test matrix covering traversal,
   absolute paths, symlink escape, stale pointers, allowed task/archive paths,
   and fixed Markdown filenames. Store only research fixtures/results, not
   production resolver code.
9. Write the required research files under this task's `research/` directory:
   `environment.md`, `trellis-data-model.md`, `dms-api.md`,
   `progress-semantics.md`, `path-safety.md`, and `codeisland-linux.md`.
   Include command/source provenance, timestamps where useful, and explicit
   unknowns or blocked checks.
10. Keep later implementation scope aligned with the specification: P0/P1 are
    read-only Trellis observation; P2 activity is optional and isolated behind
    an internal provider contract; final QML visual design remains gated on
    the user-approved UI/UX artifacts.

## Acceptance Criteria

- [x] All Stage 0 items 0.1–0.16 have a recorded result, including explicit
      `unverified`/`blocked` status where the environment cannot prove a fact.
- [x] The six required deliverables exist under
      `.trellis/tasks/09-17-dms-plugin-prereq-research/research/` and cite the
      inspected files, commands, or source locations.
- [x] Trellis schema notes are based on multiple real `task.json`/session
      samples plus `task_store.py` and active-task resolver code, preserving
      unknown/custom fields and multi-session pointers.
- [x] DMS/Quickshell notes do not claim a plugin API, `requires_dms` version,
      Theme surface, or directory watcher behavior that was not verified from
      the installed runtime or authoritative source.
- [x] Progress notes explicitly state whether an authoritative percentage
      exists and define the safe fallback when it does not.
- [x] Path-safety notes show positive and negative resolver cases, including a
      symlink containment check and stale/malformed pointer handling.
- [x] CodeIsland notes distinguish Linux `codeIsland-dms` from macOS
      `code-island`, avoid copying code, and state whether the socket protocol
      is suitable only as a deferred P2 experiment.
- [x] No production plugin code, UI design artifacts, hooks, or agent config
      changes are introduced by this prerequisite task.

## Out of scope

- Implementing `TrellisDms/`, parser/watcher code, QML surfaces, tests for the
  future plugin, packaging, or registry publication.
- Choosing or implementing final pill/popout/desktop UI before the UI/UX Design
  Gate and user approval.
- Installing hooks, running a CodeIsland daemon, or changing any external
  agent configuration.

## Open questions / deferred decisions

- The product-level P0/P1/P2 implementation scope and final UI/UX choices remain
  subject to user confirmation after the prerequisite findings; this task only
  establishes the technical facts needed for that decision.
- This checkout has no archived task. The original 2026-09-17 capture had one
  runtime session; the 2026-09-21 validation has two real session pointers,
  both targeting this task, so context-less `current --json` correctly refuses
  to guess an owner. DMS was not running for live IPC/multi-display checks;
  the reports mark those observations as blocked or unverified instead of
  inventing samples.
- The lower compatible DMS version for the composite API remains unverified;
  DMS 1.6.1 is the tested development baseline only.
- Any external upstream source that cannot be fetched or inspected in this
  environment remains explicitly deferred and must not be treated as a fact.
