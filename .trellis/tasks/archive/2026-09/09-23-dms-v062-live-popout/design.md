# v0.6.2 design

## Projection shape

`makePopoutProjection(snapshot, limits, uiState)` remains pure and returns
bounded warnings plus visible projects. Filtering occurs before caps. Each
project contains deterministic groups and task views with:

```text
id, title, state, group, priority,
parentId, parentTitle, childCount,
activeSessionCount, active, pinned
```

Relations are summaries derived from existing IDs. No recursive tree is built.
Unknown/live-path completed states keep their bounded raw label in Other.

## State lifecycle

The widget owns local `pinnedTaskId` and `selectedProjectId` properties.
Component initialization loads both keys. User actions update local state
immediately, then call the documented State API. A plugin-scoped state-change
signal reloads both keys so multiple bar widgets converge.

Empty/reset uses `removePluginStateKey(pluginId, key)` when available, or saves
the empty normalized value for that key only. `clearPluginState` is forbidden
because `discoveredProjects` shares the namespace. State save failures retain
usable local selection and are reported without a fake success toast or
fallback to plugin settings/Trellis data.

## Interaction model

- Filter row: All plus bounded project choices; the selected project is
  visually and textually identified.
- Task row: a Material `push_pin`/unpin control and non-interactive state facts.
- Pin is global and can remain primary while the user temporarily filters a
  different project; the pin token retains its project identity.
- Native controls supply focus, Return/Space activation, hover, and ripple.
  The host's pointer-only pill limitation remains documented.

## Bounded behavior

Selected-project filtering precedes the project cap. Task/group caps preserve
explicit `+N more` copy. Warning text remains length-limited. No session keys,
paths, raw JSON, or Markdown are rendered; every valid session contributes to
the task count and invalid sessions contribute only bounded diagnostics.
