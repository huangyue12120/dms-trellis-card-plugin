# Clipboard Argument Preflight

Observed 2026-10-08 against DMS 1.6.2. `rtk proxy dms cl copy --help` exposes
download/foreground/paste-once/type/help/config flags. A valid task ID such as
`--help` cannot safely be passed as the first unseparated copy argument: it is
an option, and an exit-zero help response does not establish clipboard copying.

Use argv `["dms", "cl", "copy", "--", value]` for every new Quick Action copy.
No shell or user-provided option is allowed. This corrects the original design's
four-argument example; the existing Diagnostics report starts with fixed text
and is outside this change's scope.

An isolated probe ran the exact argv with value `--help`, a fresh `/tmp` runtime,
`WAYLAND_DISPLAY=trellis-v12-no-wayland`, and empty DISPLAY. It reached copy
transport rather than help and exited 1 with `waiting for clipboard ready: EOF`.
The host clipboard was unreachable; no real clipboard copy is claimed.

Fixtures must assert the full argv for `--help`, `-d`, `--type`, spaces and Unicode,
and report success only after a zero process exit. Real clipboard values remain
a host acceptance gate.
