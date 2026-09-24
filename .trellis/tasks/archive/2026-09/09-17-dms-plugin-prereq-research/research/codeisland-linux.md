# CodeIsland references: Linux protocol and macOS boundary

Status: **verified** by local source inspection on `2026-09-17`. The checkouts
are temporary references, not product dependencies, and no daemon, hook
installer, or external configuration was run.

## Linux/DMS reference (0.14)

Local checkout:

```text
/tmp/trellis-dms-refs.jfDbfs/codeIsland-dms/
commit f6143cecc61c5edd9c31bf4862ce48423fbdc975
license MIT (copyright wxtsky)
```

The manifest is a DMS widget, not a composite:

```json
{
  "id": "codeIsland",
  "type": "widget",
  "component": "./CodeIslandWidget.qml",
  "settings": "./CodeIslandSettings.qml",
  "requires_dms": ">=1.4.0",
  "permissions": ["settings_read", "settings_write"]
}
```

Its QML imports `Quickshell.Io`, `qs.Common`, and `qs.Modules.Plugins`, then
uses a `Socket` with a line splitter. `lib/CodeIslandProtocol.js:44-57`
defines the default path:

1. `$XDG_RUNTIME_DIR/codeislandd.sock` when the runtime directory exists;
2. `/tmp/codeisland-<uid>/codeislandd.sock` when only a UID is available;
3. `/tmp/codeislandd.sock` as the final source-code fallback.

`CodeIslandWidget.qml:130-151` subscribes to `sessions`, `tasks`, and
`interactions`, accepts `snapshot.full`, and applies `snapshot.patch` only
after a full snapshot. The protocol library serializes newline-delimited JSON
envelopes and provides `subscribe`, `interaction_respond`, and
`focus_session` requests. This is a useful transport and reconnect pattern,
not a Trellis schema.

The complete `linux-skeleton/README.md` identifies a Python daemon/server,
in-memory store, Unix socket RPC/subscription flow, synthetic fixtures, and
OpenCode/Codex/Claude adapters. It documents `snapshot.full`/patch delivery,
the same socket defaults, and optional hook installers. It also warns about
duplicate global/project hooks and fail-open behavior when the daemon is
unavailable. Those details make it a useful Linux/Wayland/DMS architecture
reference, but not a P0/P1 dependency for this Trellis observer.

## P2 suitability decision

The protocol is suitable for a later **optional P2 activity provider** only:

- define an internal `ActivityEvent`/`ActivitySnapshot` contract first;
- isolate the socket client in an adapter, never in the Trellis parser;
- use feature detection/reconnect and degrade to Trellis-only when the socket
  is absent;
- verify cwd/session-to-project/task mapping before displaying activity;
- default to minimal metadata and do not persist prompts, assistant text, tool
  input/output, or permission responses;
- do not install hooks in Stage 0 or P0/P1.

The installed runtime has no CodeIsland daemon, so live protocol compatibility
and deployment stability are **unverified**. The source README's “Phase 0
reference skeleton” wording is not a production availability guarantee.

## macOS Code Island is non-implementation reference (0.15)

Local checkout:

```text
/tmp/trellis-dms-refs.jfDbfs/code-island/
commit f65e2699184a9474f389aecc1fe20345059e4eb5
license GPLv3
```

Its README and `Package.swift` specify macOS 14+, Swift 5.9+, SwiftUI/AppKit,
Swift Package Manager, and a macOS notch/menu-bar application. Its bridge uses
`/tmp/code-island.sock` and macOS agent hooks. These facts explain the
interaction concept only. They do not establish Fedora, Wayland, niri, DMS,
Quickshell, Linux window, daemon, or hook semantics and must not be copied into
the implementation plan.

## Provenance and license boundary

The Linux checkout is MIT and may be read as an architectural reference with
its license obligations if code is ever reused; this task copied no code. The
macOS checkout is GPLv3 and is concept-only. The future product remains
Trellis-file-first and should not depend on either external project for P0/P1.
