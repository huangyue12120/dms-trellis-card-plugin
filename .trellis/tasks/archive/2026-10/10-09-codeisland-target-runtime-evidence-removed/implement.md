# v1.4.1 Target Runtime Evidence Collection — Implementation Plan

1. Re-read the original and revalidation reports, parent defer note, current
   roadmap, and this task's PRD/design; preserve all existing \`NO-GO\` reasons.
2. Capture read-only host identity and version evidence with exact commands:
   Fedora/kernel, Wayland/niri, DMS/Quickshell/Qt/Trellis, package ownership,
   unit files, enablement, and runtime artifacts.
3. Query user-systemd state and DMS plugin loading using approved read-only
   access. Record successful target-host results separately from sandbox
   failures and namespace limitations.
4. Inspect installed Trellis manifest/checksum and agent/provider package,
   binary, config-name, process-name, and documented-socket presence without
   reading sensitive activity payloads.
5. If an already-running CodeIsland socket exists, perform only the approved
   non-sensitive handshake/version/owner probe. Otherwise record provider
   runtime evidence as unavailable; do not install or start it.
6. Write \`research/target-runtime-evidence-2026-10.md\` with timestamped
   command/result tables, target-host scope, privacy redactions, and an
   evidence delta for all eight blockers.
7. Keep the product disposition \`NO-GO\` unless all blockers are closed; update
   \`PROJECT_PROGRESS.md\` and the v1.4 defer note only when wording changes
   are directly supported by host evidence.
8. Run task validation, report coverage/final-disposition checks, \`git diff
   --check\`, and the existing Trellis contract test. Confirm only task/report
   documentation changed.

## Validation commands

\`\`\`bash
python3 ./.trellis/scripts/task.py validate .trellis/tasks/archive/2026-10/10-09-codeisland-target-runtime-evidence-removed
git diff --check
node tests/test_trellis_contract.mjs
\`\`\`

## Out-of-scope / rollback

Do not install packages, start/restart/stop services, install hooks, modify
agent or DMS configuration, send provider writes, or collect prompts/tool
payloads. If a target fact remains inaccessible, label it explicitly instead
of widening scope.
