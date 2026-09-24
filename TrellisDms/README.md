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
