# Trellis DMS

Trellis DMS provides read-only Trellis project status in DankMaterialShell.

## Interface language

The plugin follows the active locale selected in DMS Settings. The plugin
includes Simplified Chinese (`zh_CN`); English QML source text is the fallback
for unsupported locales and any untranslated entry. Change the locale in DMS;
there is no plugin-specific language selector.

Project names, task titles, file paths, Markdown documents, IDs, and unknown
Trellis status values remain as stored. Long bar labels are elided to fit the
available width. Explanatory copy wraps in the popout, Settings, and desktop
widget, which uses a single vertical scroll region.

The Launcher surface uses the same DMS locale and plugin translation catalog.
Search results keep project names, task titles, and unknown status values in
their original form.

This package is a v1.0.0 candidate. DMS 1.6.2 host acceptance is still pending
for core lifecycle behavior and the retained Desktop, locale, and Launcher
surfaces; in particular, `!trellis` still needs to be tried in the DMS Launcher
search field. See the repository [README](../README.md) for installation,
permissions, rollback, and release status.
