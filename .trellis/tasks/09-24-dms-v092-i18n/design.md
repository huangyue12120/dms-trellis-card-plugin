# DMS v0.9.2 i18n — design

## Locale ownership

- Use the DMS plugin translation system, not a plugin-specific selector. The user's active DMS locale is the locale for all Trellis DMS surfaces and changes retranslate through DMS.
- Keep English literals as QML source strings and add `TrellisDms/translations/zh_CN.json`. Do not add `en.json`.
- Use a literal plugin ID at every call site, for example `I18n.trFor("trellisDms", "No live tasks")`; DMS's extractor requires the literal ID.
- Missing locale entries fall through the DMS global catalog and then the English source. Unsupported locales therefore remain usable in English.

## Translation boundary

- Translate plugin-authored labels, instructions, status-group labels, loading/empty/recovery copy, settings labels/help, archive controls, stable warnings/errors, and approved desktop/Launcher copy.
- Keep task titles, project names, file paths, Markdown bodies, raw/unknown Trellis statuses, IDs, and stored data unchanged. Known status/group labels may have localized presentation while their underlying values remain exact.
- Use DMS placeholder substitution for counts and dynamic text. Provide explicit singular/plural source terms where English grammar requires it; do not parse or modify Snapshot data for translation.
- Translate stable warning messages only at the QML boundary. If a message contains an unrecognized dynamic system/parser detail, preserve its original text; never rewrite warning data in the Snapshot.
- DMS 1.6.2 is the locally verified target API. The desktop integration already raised `requires_dms` to `>=1.6.2`; this task does not change the manifest or permissions.

## Failure behavior

- Missing or malformed zh_CN entries leave English source text visible; DMS owns translation file loading and warning behavior.
- A locale switch updates labels without rescanning Trellis or changing Snapshot, pins, filters, archive pages, or launcher results.
- Localization does not gate daemon/parser startup. No string catalog is imported by the data layer.
