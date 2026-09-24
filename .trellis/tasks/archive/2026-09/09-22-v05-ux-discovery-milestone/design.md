# v0.5 UX and discovery design

## Design read

Redesign-preserve of a compact DMS developer-tool widget for desktop users,
using native Material 3, high information efficiency, and restrained feedback
motion.

- Design variance: 3. Predictable native layout is more valuable than novelty.
- Motion intensity: 2. Keep only host hover/ripple/popout transitions.
- Visual density: 8. The bar is scarce space; the popout uses compact rows and
  separators instead of nested cards.
- Design system: the installed DMS Theme and widget library only.

`design-taste-frontend` and `gpt-taste` are intentionally limited to their
redesign audit, copy, density, empty-state, and motion guardrails. Their landing
page, hero, image, React, Tailwind, and GSAP guidance does not apply to QML.

## Stable data boundary

The v0.4 Snapshot remains the only widget data source:

```text
trusted scan roots (settings)
  -> daemon bounded discovery and safe resolver
  -> unchanged Snapshot schema
  -> compact pill projection + read-only popout
```

The new settings/state contract is:

| Key | Store | Type | Purpose |
|---|---|---|---|
| `displayMode` | DMS Settings | string | `auto`, `task`, `project`, `counts`, `icon`, `full` |
| `scanRoots` | DMS Settings | string[] | User-selected trusted discovery boundaries |
| `projectRoot` | DMS Settings | string | Legacy fallback only when `scanRoots` is empty |
| `topologyInterval` | DMS Settings | number | Existing bounded rescan interval |
| `refreshToken` | DMS Settings | number | Existing immediate-rescan trigger |
| `discoveredProjects` | DMS State | object[] | Bounded last-success summaries, never scan authority |

Each remembered project record contains only `root`, `name`, and `lastSeenAt`.
It contains no task bodies, session content, Markdown, or secrets. A successful
coherent scan replaces the cache. A degraded scan leaves the last successful
cache intact. Startup and every rescan still canonicalize configured roots and
discover projects normally.

## Pill projection

All modes include a Trellis/account-tree icon. Warning information uses a
warning icon and visible count where the chosen mode permits it.

- `auto`: horizontal bars show one active task label when exactly one task is
  active; otherwise compact icon/count groups. Vertical bars use `icon`.
- `task`: active task title with `+N` for additional active tasks. When none is
  active, show `No active task`.
- `project`: first project name with `+N` for additional projects. When none is
  loaded, show `No project`.
- `counts`: icon-number groups for projects and tasks; append warning icon and
  count only when warnings exist.
- `icon`: account-tree icon, plus a warning icon when warnings exist.
- `full`: the v0.4 diagnostic wording with project/task/warning nouns.

Horizontal labels are single-line and elided. The icon and count remain stable
when a long title changes. Vertical content never rotates or wraps text.

## Popout structure

The minimal v0.5 popout is a read-only inspection surface:

```text
Trellis                                      [summary]
warning summary (only when non-zero)
---------------------------------------------
project name                                 version
  task title                            state / sessions
  task title                            state
---------------------------------------------
additional projects...
```

It uses one scrollable content region, caps rendered rows defensively, and
shows clear unconfigured/empty/error recovery copy. The pill never attempts to
render every warning. Warning details remain in the popout.

## Settings structure

1. Intro and explicit safety explanation.
2. Display-mode dropdown with a concise description of each projection.
3. Trusted scan folders list with Add folder and Remove actions.
4. Remembered-project count/list, labelled as a cache rather than configuration.
5. Existing topology interval and manual rescan.

The folder picker runs in folder mode. Typed paths are not required for the
primary flow. Legacy `projectRoot` is read and migrated at runtime, but the new
surface avoids presenting two competing sources of truth.

## Accessibility and host limits

- DMS semantic colors provide light/dark adaptation; no raw product color is
  introduced.
- Icons accompanying visible labels are decorative. Icon-only projections
  retain semantic warning glyphs and expose full information on click.
- Settings buttons and dropdowns use DMS controls and preserve native focus.
- Popout visual order is its focus order; Escape is provided by
  `PluginPopout.qml`.
- Installed DMS 1.6.1 `BasePill.qml` is MouseArea-driven and exposes no plugin
  accessible-name or keyboard-activation property. The plugin must not claim
  to repair that host-level limitation; v0.5 ensures keyboard behavior inside
  surfaces that DMS makes focusable and records the limitation for upstream.

## Compatibility and rollback

- The daemon reads `scanRoots` first, then falls back to `projectRoot`.
- Removing all roots returns to the normal unconfigured Snapshot; it never
  triggers a home-directory fallback.
- If multi-root settings or state persistence fails at runtime, rollback to
  legacy `projectRoot` reading while retaining pill modes/popout.
- If popout rendering is unstable, keep compact pill modes and remove only the
  `popoutContent` binding. Data discovery remains independent.
