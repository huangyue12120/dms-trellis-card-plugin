# v0.5 visual accessibility and motion contract

## Goal

Define an implementation-ready DMS-native visual, sizing, accessibility, focus,
and motion contract for the compact pill, popout, and settings.

## Requirements

- Use installed DMS Theme, Material Symbols, and control components only.
- Define label bounds, row hierarchy, warning semantics, focus order, empty
  states, and narrow/vertical degradation.
- Use text/icons in addition to color and avoid hover-only information.
- Add no decorative motion and no behavior that depends on animation completion.
- Record the installed DMS host pill's keyboard/accessibility limitation.

## Acceptance criteria

- [ ] `docs/ui-component-contract.md` can be followed directly in QML.
- [ ] Long text, warning/error, light/dark Theme, and focus behavior are explicit.
- [ ] Motion and density dials are stated and appropriate to a bar widget.
- [ ] Web/landing-page patterns are explicitly excluded.
