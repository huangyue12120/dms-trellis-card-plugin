# DMS Notification API Evidence

## Inspection date

2026-10-09, local Fedora host. The installed CLI reports `dms v1.6.3`; the
project's release baseline remains DMS 1.6.2.

## Observed facts

- `dms notify --help` exposes a local desktop notification command with
  `dms notify <summary> [body]` and optional `--app`, `--icon`, and `--timeout`
  arguments. It does not document a plugin callback or notification-action
  registration API.
- The installed DMS source contains `qs.Services.NotificationService`, which
  owns the incoming `NotificationServer`, history, and popup rendering. The
  service has no public `send()` method for plugin-originated notifications.
- The plugin README documents `ToastService.showInfo/showWarning/showError`
  for in-shell feedback. Toasts are not the DMS notification-center path.
- DMS source uses argv-based `notify-send`/`dms` process calls for local alerts;
  the plugin manifest already declares `process` permission and does not
  declare `network`.
- The plugin API and manifest permit process execution but do not make an
  outbound notification click-action contract available to this plugin.

## Planning consequence

The v1.3 implementation may use one daemon-owned argv-only local DMS command
with bounded text and isolated failure handling. It must record click routing
as unavailable unless a supported DMS 1.6.2 host proves a stable API. The
installed 1.6.3 inspection is source evidence only; host runtime compatibility
and actual popup/history behavior remain acceptance checks.
