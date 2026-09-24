# Safe project discovery settings design

`scanRoots` is the only new discovery input. The daemon chooses a non-empty
array first and otherwise passes the legacy `projectRoot` to the existing
`TrellisPaths.normalizeRoots` policy. No default root is synthesized.

The settings surface uses DMS `FileBrowserModal` in folder mode and a labelled
list with Remove controls. Safety copy is visible above the list.

After a coherent non-degraded scan, the daemon writes bounded summaries to
DMS plugin state. That cache supports remembering/display only. It is never
read as a trusted root or candidate path. Degraded scans retain prior state.

This separation prevents a stale remembered path from silently widening the
current user's trust boundary.
