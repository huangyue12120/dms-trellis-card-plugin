# v0.5 information architecture and state matrix

## Goal

Define how every current Snapshot fact is progressively disclosed across the
pill, minimal popout, and settings without silent data loss.

## Requirements

- Write the information architecture in `docs/ui-ux-spec.md`.
- Write the complete projection/recovery table in `docs/ui-state-matrix.md`.
- Cover horizontal/vertical bars, narrow screens, long names, empty/loading,
  multi-project/task/session, archive summary, stale/malformed, and warnings.
- Define `+N` precisely and keep primary/active projections separate from data
  retention.
- Keep Markdown, rich detail, filters, and mutation outside this task.

## Acceptance criteria

- [ ] Every requested state has a pill, popout, and recovery projection.
- [ ] No projection invents progress/activity or deletes Snapshot records.
- [ ] Orientation and constrained-width fallbacks are explicit.
- [ ] The three UI documents use the same state and mode vocabulary.
