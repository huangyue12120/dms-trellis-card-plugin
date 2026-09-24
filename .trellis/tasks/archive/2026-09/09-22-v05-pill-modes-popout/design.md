# Compact pill and popout design

Projection logic is pure and deterministic where practical, so QML delegates
render a small view model instead of reimplementing state rules. The widget
derives counts and active-task order from the immutable Snapshot.

Horizontal content is a compact Row. Label modes cap title width at 180 logical
px. Counts use icon-number pairs. Vertical content is an account-tree icon plus
a warning glyph when needed.

`PluginComponent.popoutContent` owns one scrollable read-only surface. Project
headers show name/version. Task rows show title/display state and non-zero
active-session count. Warnings are bounded and additive.

No custom click handler is needed; adding `popoutContent` enables the native
PluginComponent click-to-toggle path.
