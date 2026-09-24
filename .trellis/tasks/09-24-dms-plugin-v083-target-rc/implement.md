# v0.8.3 execution plan

## Ordered checklist

1. Review the accepted 0.8.1 and 0.8.2 evidence; verify there is no P0/P1 blocker.
2. Capture current host versions with dms version, qs --version, qtpaths6 --query QT_VERSION, niri --version, /etc/fedora-release, and .trellis/.version. Confirm whether a live DMS process/session is available.
3. Inspect workspace and installed manifest/resources without writing to the installed copy. Confirm permissions, requires_dms, exact-case imports, and no-project startup expectations.
4. If the live check is available and the user-approved environment permits it, preserve the exact installed 0.7.0 copy, install the reviewed candidate, and exercise discovery, enable, reload, popout, bar/screen, warnings, disable, and cleanup. Restore the original copy if the candidate fails.
5. Write RC notes and rollback instructions. Set manifest 0.8.0 and update PROJECT_PROGRESS.md only if all required release gates pass; otherwise record the blocked/unverified rows and leave the release gate open.

## Validation

- Parse TrellisDms/plugin.json and check version and requires_dms.
- python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-24-dms-plugin-v083-target-rc
- Compare installed/workspace files and exact-case paths before and after any live test.
- Use actual DMS UI/runtime evidence for install, reload, disable, multi-bar/screen, popout, and cleanup. The current shell has no running DMS process, so these checks may remain unavailable.

## Rollback

The rollback target is the pre-check installed plugin copy captured before replacement. Restore that copy and its original manifest/resources if load or cleanup fails. Do not alter DMS packages or unrelated plugin/state data.
