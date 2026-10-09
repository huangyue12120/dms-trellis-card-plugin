# v1.4.1 Activity Provider Evidence Refresh — implementation plan

1. Read the v1.4 roadmap, current Trellis boundaries, and archived provider reports; mark them as historical context.
2. Inspect the current upstream Linux repository and record URL, revision/date, license, daemon/source layout, documented install/deployment path, socket paths, protocol messages, and advertised providers.
3. Run read-only local checks for `codeislandd`/`codeisland`, package metadata, `$XDG_RUNTIME_DIR`, canonical/fallback socket paths, and any existing pinned checkout. Do not connect, install, or start anything.
4. Build a question-by-question evidence table covering deployment, protocol, reconnect, lifecycle/ownership, mapping, permissions/privacy, support matrix, and failure isolation. Explicitly label unknowns and inferences.
5. Issue exactly `GO` or `NO-GO`. Treat insufficient or source-only evidence as `NO-GO`; state the missing proof needed to reopen the gate.
6. Check the diff to ensure only this task's research/planning files changed. Leave product code, plugin settings/manifest, agent configuration, hooks, sockets, and external runtime state untouched.

## Validation targets

- Source claims include a direct URL and access date; a missing pinned revision is recorded as a gap.
- Local facts include commands and scope limitations; no shell result is generalized to a separate target session.
- The final line is an unambiguous gate result and matches the roadmap's conditional follow-up rule.
