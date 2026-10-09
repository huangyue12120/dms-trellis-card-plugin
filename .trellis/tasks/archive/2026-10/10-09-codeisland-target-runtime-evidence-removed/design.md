# v1.4.1 Target Runtime Evidence Collection — Design

## Evidence layers

1. **Host identity** — Fedora release, kernel, Wayland/niri, UID, runtime
   directory, DMS/Quickshell/Qt/Trellis versions, and package ownership.
2. **Service ownership** — read-only user-systemd state for \`dms.service\` and
   \`niri.service\`, unit files, enablement links, main PIDs, and runtime socket
   metadata.
3. **DMS integration** — installed Trellis manifest/checksum, plugin files,
   settings references, and the read-only \`dms ipc call plugins list\` result.
4. **Provider presence** — provider package/binary/config/process/socket checks
   for CodeIsland, OpenCode, Codex, and Claude, with no payload reads.
5. **Optional provider handshake** — only if an already-running documented
   provider socket exists; collect non-sensitive version/capability metadata,
   never interaction or activity payloads.
6. **Gate inference** — map each v1.4.1 blocker to \`closed\`, \`partially
   evidenced\`, \`target-runtime required\`, or \`not available\`; source tests
   and host evidence remain separate.

## Boundaries and data flow

Read-only shell commands → temporary redacted evidence notes → task-local
report. No command writes the project, DMS settings, agent configuration,
provider state, socket, or Trellis data. Raw paths, tokens, prompts, assistant
text, tool input/output, and permission answers are not copied into the report.

The current sandbox may hide host processes or user buses. A successful
elevated read-only systemd/IPC query is stronger target-host evidence; a
permission or namespace failure is recorded as a limitation, never as absence.

## Blocker mapping

- Deployment/lifecycle: service unit, enablement, active state, owner, socket
  metadata, and package records can close only the host-install portion.
- Protocol/reconnect: no socket means no live protocol evidence; source-level
  gaps remain. An existing socket permits a bounded metadata-only handshake,
  not payload or mutation tests.
- Mapping/privacy: host installation cannot prove a safe Trellis mapping or
  metadata-only provider design; these remain source/design evidence gaps.
- Support matrix: installed agent versions establish presence only; live agent
  session behavior is not asserted without an already-running provider path.
- Failure isolation: DMS plugin loaded status proves host loading only, not
  provider failure isolation inside the future adapter.

## Safety and rollback

No rollback is needed because the task performs no mutation. If any command
would install, start, stop, restart, configure, or write, stop and record it as
out of scope. The final report must preserve the product \`NO-GO\` unless every
required blocker is independently closed.
