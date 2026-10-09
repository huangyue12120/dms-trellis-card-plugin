# Target Runtime Evidence Preflight — 2026-10-09

This planning preflight used read-only commands only. It establishes the host
scope and does not replace the final task report.

## Host and service facts

- Fedora Linux 44 Workstation; kernel \`7.2.8-200.fc44.x86_64\`; UID 1000.
- \`XDG_SESSION_TYPE=wayland\`, \`XDG_CURRENT_DESKTOP=niri\`,
  \`WAYLAND_DISPLAY=wayland-1\`; niri \`26.04\`.
- DMS \`1.6.3\`; Quickshell \`0.3.1\`; Qt \`6.11.2\`; Trellis \`0.6.17\`.
- RPM ownership: \`dms-1.6.3-1.fc44\`, \`dms-cli-1.6.3-1.fc44\`,
  \`quickshell-0.3.1-8.fc44\`, \`niri-26.04-1.fc44\`.
- Read-only elevated systemd query: \`dms.service\` and \`niri.service\` are
  active/running; DMS is enabled with main PID 107227, niri is static with
  main PID 107121. Unit files are \`/usr/lib/systemd/user/dms.service\` and
  \`/usr/lib/systemd/user/niri.service\`.
- DMS runtime artifacts include \`/run/user/1000/danklinux-107227.sock\`
  (mode 600, user-owned) and niri's Wayland socket. The documented
  CodeIsland sockets are absent.
- Read-only \`dms ipc call plugins list\` reports \`trellisDms [loaded]\` plus
  the other installed DMS plugins.
- The installed Trellis manifest matches the project manifest byte-for-byte
  (SHA-256 \`ef648b2340d6aac63dfe45774a27c5539d128414000c163a9a677c46b7da8362\`)
  and declares DMS \`>=1.6.2\`.

## Provider facts

- No CodeIsland package, binary, process, or documented socket was found.
- OpenCode RPM \`2.0.24\` is installed, but no \`opencode\` command is in
  \`PATH\`; its desktop entry points to \`/opt/OpenCode/ai.opencode.desktop\`.
- \`codex --version\` reports \`codex-cli 0.162.0\`; \`claude --version\` reports
  \`2.1.295 (Claude Code)\`. No active agent process was visible in the current
  process namespace.
- The sandbox's ordinary \`systemctl\`, \`loginctl\`, and DMS IPC calls cannot
  access the user/system buses; the elevated read-only systemd and DMS IPC
  queries succeeded. This distinction must be retained in the final report.

## Safety

No package, service, socket, hook, configuration, prompt, assistant, tool, or
permission payload was written or captured. The final report must still treat
provider protocol/reconnect, mapping, privacy, and fail-open behavior as
unproven unless a separate permitted source or target test closes them.
