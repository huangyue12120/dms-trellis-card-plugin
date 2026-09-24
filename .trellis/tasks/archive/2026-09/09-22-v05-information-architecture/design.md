# Information architecture design

Use three disclosure levels: compact pill, read-only popout, and configuration
settings. The pill projects one salient state; the popout retains the bounded
project/task/session/warning facts; settings explain configuration and recovery.

The matrix treats warnings as additive. A warning glyph never replaces healthy
task/project status. `+N` always means additional items of the same displayed
class. Vertical bars always use icon-scale output.

Source-of-truth documents are `docs/ui-ux-spec.md` and
`docs/ui-state-matrix.md`. Component mechanics belong in
`docs/ui-component-contract.md`.
