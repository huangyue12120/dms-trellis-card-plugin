# v0.5 UX and discovery milestone

## Goal

Freeze and implement a DMS-native UI baseline for Trellis status while solving
the two runtime usability problems found in the first live test: the bar pill
is too long on constrained screens, and project setup depends on entering one
project path manually.

## User value

Users can choose a compact projection that fits their bar, click the widget to
inspect the read-only facts behind it, and configure one or more trusted
folders from which Trellis projects are discovered and remembered. The plugin
remains explicit about what it scans and never writes to a Trellis project.

## Requirements

### R1. Information architecture and UI state coverage

- Produce `docs/ui-ux-spec.md`, `docs/ui-state-matrix.md`, and
  `docs/ui-component-contract.md`.
- Cover unconfigured, loading, empty, active, inactive, multiple-project,
  multiple-task/session, long-name, warning, malformed, stale, archive-summary,
  horizontal-bar, vertical-bar, and constrained-width states.
- Preserve every project/task/session in the Snapshot. Compact projections may
  summarize but must not silently delete facts from the popout or data model.

### R2. Selectable compact pill modes

- Add `auto`, `task`, `project`, `counts`, `icon`, and `full` modes in plugin
  settings. `auto` is the recommended default.
- Use DMS Material Symbols, short numbers, elision, and `+N` aggregation. Do
  not use emoji or fabricated progress.
- Vertical bars always use the icon-scale projection. Long labels stay on one
  line and are bounded.

### R3. Minimal read-only popout

- Clicking the pill opens a DMS-native popout that shows project, live task,
  session activity, and warning facts already present in the Snapshot.
- The popout has useful unconfigured, empty, warning, and malformed states,
  and closes with the host's Escape behavior.
- Markdown rendering, task mutation, archive body loading, filters, and rich
  detail navigation remain deferred to v0.6/v0.7.

### R4. Safe automatic project discovery and remembering

- Users select one or more absolute trusted scan folders. Discovery remains
  bounded to depth 4 under those roots and preserves existing project/task/
  session/resource caps.
- Never scan all of `$HOME`, filesystem mounts, `/`, or `/proc` implicitly.
- Remember the last successfully discovered projects in DMS plugin state and
  revalidate them through normal trusted-root scans. Remembered paths never
  become an authority that bypasses current scan roots.
- Migrate the existing single `projectRoot` setting as a fallback when the new
  `scanRoots` list has not been configured.
- Settings help text must explain scope, depth, remembering, revalidation, and
  read-only behavior in plain language.

### R5. Native visual, accessibility, and motion contract

- Reuse DMS Theme colors, spacing, typography, radius, icons, popout, settings,
  and file browser APIs. Do not add a theme system or visual dependency.
- State is communicated with text and/or icons, never color alone.
- Interactive settings controls retain visible labels and native focus. The
  popout follows visual order for keyboard focus and avoids hover-only facts.
- Motion is limited to existing DMS pill/popout feedback. No decorative or
  continuous animation is added.

### R6. Design Gate and compatibility

- Record the approved baseline, rejected alternatives, known DMS host limits,
  and acceptance mapping before production QML changes.
- Preserve the v0.4 Snapshot schema and daemon-only filesystem ownership.
- Keep the plugin read-only and network-free. DMS plugin-state writes may only
  store this plugin's discovered-project cache.

## Acceptance criteria

- [x] All three v0.5 UI/UX documents exist and agree on state names, display
      modes, copy, sizes, focus, and degradation behavior.
- [x] The design record captures the user's approval of trusted bounded roots,
      remembered/revalidated projects, compact modes, and clear settings copy.
- [x] Every display mode renders from the same Snapshot without computing fake
      progress or hiding warnings from the popout.
- [x] Pill/popout wiring loads against the installed DMS API and uses the host
      click/Escape path; live Wayland interaction remains a separately reported
      runtime gate.
- [x] Settings support adding/removing trusted folders, legacy-root fallback,
      immediate rescan, and explicit safety guidance.
- [x] Successful discovery stores only bounded project summary records in DMS
      state; scans never use remembered paths outside configured roots.
- [x] Existing parser/path/watcher contracts and new mode/discovery contracts
      pass the Node test suite and manifest validation.
- [x] Live DMS checks are reported separately if they cannot be executed in
      this checkout.

## Child task map and order

1. `09-22-v05-information-architecture`
2. `09-22-v05-visual-accessibility-contract`
3. `09-22-v05-ui-ux-gate`
4. `09-22-v05-pill-modes-popout`
5. `09-22-v05-project-discovery-settings`

Tasks 1-3 freeze the design. Tasks 4-5 implement it. The parent owns final
cross-child consistency and validation.

## Out of scope

- Markdown detail, task/archive mutation, archive body loading, filters, search,
  desktop widgets, launcher integration, Agent activity, hooks, sockets, or
  CodeIsland dependencies.
- Automatic whole-home or mount-wide discovery, implicit environment/process
  scraping, and any write under a discovered project's `.trellis` directory.
- React, Tailwind, GSAP, generated imagery, marketing-page layouts, or a second
  design system.
