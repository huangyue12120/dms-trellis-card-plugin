# Evidence expansion plan (2026-10-09)

This planning note preserves the previous `NO-GO` report and identifies what a follow-up can safely investigate.

## Can be supplemented without target-host access

- Release/tag/revision metadata and public release absence.
- Source-level protocol envelope, limits, full/patch payload shape, sequence use, write methods, socket modes, and client reconnect code.
- Upstream test inventory and isolated source-test results, clearly labelled non-production.
- Local shell command/package/process/socket/service observations.
- Mapping and privacy analysis against this repository's canonical resolver and read-only contracts.

## Requires target-host or user evidence

- A real Fedora/DMS/Wayland/niri daemon installation and service owner.
- Live socket permissions and provider session behavior.
- Agent/provider version matrix and real reconnect/patch-gap recovery.
- Demonstrated cwd-to-trusted-project and explicit task mapping in the target workflow.
- Host-level proof that disabled/absent/malformed/disconnected provider states do not affect startup or Trellis Snapshot publication.

The follow-up may close source/local gaps, but it must not claim `GO` while the target-runtime set remains unverified.
