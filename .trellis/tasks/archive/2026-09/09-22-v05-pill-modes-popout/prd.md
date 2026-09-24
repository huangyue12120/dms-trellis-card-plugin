# v0.5 compact pill modes and read-only popout

## Goal

Make the bar widget compact and useful on click while keeping the Snapshot
truthful and the implementation native to DMS.

## Requirements

- Implement `auto`, `task`, `project`, `counts`, `icon`, and `full` modes with
  `auto` as default.
- Use DMS Material Symbols, warning semantics, one-line elision, and `+N` rules
  from the approved UI documents.
- Always use icon-scale output on vertical bars.
- Add `popoutContent` showing bounded project/task/session/warning facts and
  useful unconfigured/empty/error copy.
- Do not load Markdown, archive bodies, or add any write/action to Trellis data.

## Acceptance criteria

- [ ] Settings changes select every mode and invalid values fall back to `auto`.
- [ ] Long labels do not make the horizontal pill unbounded or wrap.
- [ ] Warnings remain discoverable in compact/icon modes.
- [ ] Clicking the pill opens the popout; DMS Escape behavior remains intact.
- [ ] Popout output preserves all represented states without fake progress.
