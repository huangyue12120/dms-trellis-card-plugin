# Visual, accessibility, and motion design

Use redesign-preserve with variance 3, motion 2, and density 8. DMS Theme is
the only design system. Pills use one-line icon/text groups; the popout uses a
single hierarchy and restrained separators rather than nested cards.

Material warning icons provide a non-color signal. DMS controls retain native
focus. The popout host supplies initial focus and Escape. No plugin code claims
keyboard activation for the installed MouseArea-based host pill.

The contract is documented in `docs/ui-component-contract.md`, with state
examples in `docs/ui-state-matrix.md`.
