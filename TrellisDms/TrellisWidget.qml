import QtQuick
import qs.Common
import qs.Services
import qs.Widgets
import qs.Modules.Plugins
import "lib/trellisprojection.js" as TrellisProjection

PluginComponent {
    id: root

    layerNamespacePlugin: "trellis-dms"
    readonly property real availableScreenWidth: parentScreen && parentScreen.width > 0
        ? parentScreen.width : 420 + Theme.spacingL * 2
    readonly property real availableScreenHeight: parentScreen && parentScreen.height > 0
        ? parentScreen.height : 480 + Theme.spacingL * 2

    popoutWidth: Math.max(1, Math.min(420,
        availableScreenWidth - Theme.spacingL * 2))
    popoutHeight: Math.max(1, Math.min(480,
        availableScreenHeight - Theme.spacingL * 2))

    property var pinnedTaskId: ""
    property var selectedProjectId: ""
    property var collapsedProjectIds: []
    property var collapsedTaskGroups: []
    property string selectedArchiveMonth: ""
    property string preferenceStateWarning: ""
    property string stateWarning: ""
    property string recoveryActionWarning: ""
    property bool refreshPending: false
    property string refreshBaselineGeneratedAt: ""
    property int refreshRequestSerial: 0
    property bool detailMode: false
    property string detailProjectId: ""
    property string detailTaskId: ""
    property string detailTitle: ""
    property string detailDocument: "prd.md"
    property string detailRequestId: ""
    property int detailRequestSerial: 0
    property string detailStatus: "idle"
    property string detailContent: ""
    property string detailFormat: "plain"
    property string detailError: ""
    property bool detailArchive: false
    property string detailMonth: ""
    property string detailDirName: ""
    property bool archiveMode: false
    property string archiveProjectId: ""
    property string archiveProjectName: ""
    property string archiveRequestId: ""
    property string archiveStatus: "idle"
    property string archiveSelectedMonth: ""
    property int archivePage: 0
    readonly property int archivePageSize: 16
    property var archiveMonths: []
    property var archiveTasks: []
    property bool archiveHasMore: false
    property var archiveWarnings: []
    property string archiveError: ""
    readonly property int maxDetailCharacters: 256 * 1024
    readonly property bool nativeMarkdownAvailable: typeof Text.MarkdownText !== "undefined"
    readonly property var detailDocuments: [
        { document: "prd.md", label: I18n.trFor("trellisDms", "PRD") },
        { document: "design.md", label: I18n.trFor("trellisDms", "Design") },
        { document: "implement.md", label: I18n.trFor("trellisDms", "Implement") }
    ]

    readonly property var snapshot: snapshotVar.value || ({})
    readonly property string pillMode: TrellisProjection.normalizeDisplayMode(
        root.pluginData && root.pluginData.pillMode !== undefined
            ? root.pluginData.pillMode
            : (root.pluginData ? root.pluginData.displayMode : ""))
    readonly property bool showProgress: TrellisProjection.normalizeBooleanSetting(
        root.pluginData ? root.pluginData.showProgress : undefined, true)
    readonly property bool showArchive: TrellisProjection.normalizeBooleanSetting(
        root.pluginData ? root.pluginData.showArchive : undefined, true)
    readonly property bool versionWarning: TrellisProjection.normalizeBooleanSetting(
        root.pluginData ? root.pluginData.versionWarning : undefined, true)
    readonly property var uiState: ({
        pinnedTaskId: root.pinnedTaskId,
        selectedProjectId: root.selectedProjectId,
        collapsedProjectIds: root.collapsedProjectIds,
        collapsedTaskGroups: root.collapsedTaskGroups,
        selectedArchiveMonth: root.selectedArchiveMonth,
        showProgress: root.showProgress,
        versionWarning: root.versionWarning
    })
    readonly property var pillProjection: TrellisProjection.makePillProjection(
        snapshot, root.pillMode, uiState)
    readonly property var popoutProjection: TrellisProjection.makePopoutProjection(
        snapshot, {}, uiState)
    readonly property var projectFilterOptions: [{ id: "", name: I18n.trFor("trellisDms", "All") }]
        .concat(popoutProjection.projectOptions || [])

    function projectCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 project").arg(count)
            : I18n.trFor("trellisDms", "%1 projects").arg(count);
    }

    function taskCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 task").arg(count)
            : I18n.trFor("trellisDms", "%1 tasks").arg(count);
    }

    function warningCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 warning").arg(count)
            : I18n.trFor("trellisDms", "%1 warnings").arg(count);
    }

    function sessionCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 session").arg(count)
            : I18n.trFor("trellisDms", "%1 sessions").arg(count);
    }

    function childCountLabel(count) {
        return count === 1
            ? I18n.trFor("trellisDms", "%1 child").arg(count)
            : I18n.trFor("trellisDms", "%1 children").arg(count);
    }

    function localizedTaskGroup(key) {
        switch (key) {
        case "active": return I18n.trFor("trellisDms", "Active");
        case "in_progress": return I18n.trFor("trellisDms", "In progress");
        case "planning": return I18n.trFor("trellisDms", "Planning");
        case "error": return I18n.trFor("trellisDms", "Error");
        case "other": return I18n.trFor("trellisDms", "Other");
        default: return key;
        }
    }

    function localizedTaskState(state) {
        switch (state) {
        case "active": return I18n.trFor("trellisDms", "Active");
        case "in_progress": return I18n.trFor("trellisDms", "In progress");
        case "planning": return I18n.trFor("trellisDms", "Planning");
        case "error": return I18n.trFor("trellisDms", "Error");
        default: return state;
        }
    }

    function localizedDocumentName(document) {
        switch (document) {
        case "prd.md": return I18n.trFor("trellisDms", "PRD");
        case "design.md": return I18n.trFor("trellisDms", "Design");
        case "implement.md": return I18n.trFor("trellisDms", "Implement");
        default: return document;
        }
    }

    function relationLabel(task) {
        var parts = [];
        if (task.parentTitle)
            parts.push(I18n.trFor("trellisDms", "Parent: %1").arg(task.parentTitle));
        if (task.childCount > 0)
            parts.push(childCountLabel(task.childCount));
        return parts.join(" · ");
    }

    function fullPillLabel() {
        return projectCountLabel(root.pillProjection.projectCount)
            + " · " + taskCountLabel(root.pillProjection.taskCount)
            + " · " + warningCountLabel(root.pillProjection.warningCount);
    }

    function pillLabel() {
        if (root.pillProjection.kind === "full")
            return fullPillLabel();
        if (root.pillProjection.mode === "task"
                && !root.pillProjection.primaryTaskId)
            return I18n.trFor("trellisDms", "No active task");
        if (root.pillProjection.mode === "project"
                && !root.pillProjection.primaryProjectId)
            return I18n.trFor("trellisDms", "No project");
        return root.pillProjection.label;
    }

    function localizedWarningMessage(value) {
        var message = typeof value === "string" ? value : "";
        var parentPrefix = "unknown parent relation: ";
        if (message.indexOf(parentPrefix) === 0)
            return I18n.trFor("trellisDms", "Unknown %1 relation: %2")
                .arg(I18n.trFor("trellisDms", "parent"))
                .arg(message.slice(parentPrefix.length));
        var childPrefix = "unknown child relation: ";
        if (message.indexOf(childPrefix) === 0)
            return I18n.trFor("trellisDms", "Unknown %1 relation: %2")
                .arg(I18n.trFor("trellisDms", "child"))
                .arg(message.slice(childPrefix.length));
        var rootPrefix = "project root rejected: ";
        if (message.indexOf(rootPrefix) === 0)
            return I18n.trFor("trellisDms", "Project root rejected: %1")
                .arg(message.slice(rootPrefix.length));

        switch (message) {
        case "warning": return I18n.trFor("trellisDms", "warning");
        case "Warning": return I18n.trFor("trellisDms", "Warning");
        case "DMS State is unavailable; UI choices will remain local.": return I18n.trFor("trellisDms", "DMS State is unavailable; UI choices will remain local.");
        case "DMS State could not load saved Trellis preferences; local choices remain usable.": return I18n.trFor("trellisDms", "DMS State could not load saved Trellis preferences; local choices remain usable.");
        case "Preference changed locally, but DMS State is unavailable.": return I18n.trFor("trellisDms", "Preference changed locally, but DMS State is unavailable.");
        case "Preference changed locally, but DMS State could not save it.": return I18n.trFor("trellisDms", "Preference changed locally, but DMS State could not save it.");
        case "Saved pin was invalid and was ignored.": return I18n.trFor("trellisDms", "Saved pin was invalid and was ignored.");
        case "Saved project filter was invalid and was ignored.": return I18n.trFor("trellisDms", "Saved project filter was invalid and was ignored.");
        case "Some saved project collapse choices were invalid and were ignored.": return I18n.trFor("trellisDms", "Some saved project collapse choices were invalid and were ignored.");
        case "Some saved group collapse choices were invalid and were ignored.": return I18n.trFor("trellisDms", "Some saved group collapse choices were invalid and were ignored.");
        case "Saved archive month was invalid and was ignored.": return I18n.trFor("trellisDms", "Saved archive month was invalid and was ignored.");
        case "Trellis refresh is unavailable in this DMS session.": return I18n.trFor("trellisDms", "Trellis refresh is unavailable in this DMS session.");
        case "Trellis refresh could not be requested from DMS.": return I18n.trFor("trellisDms", "Trellis refresh could not be requested from DMS.");
        case "DMS Settings are unavailable in this session.": return I18n.trFor("trellisDms", "DMS Settings are unavailable in this session.");
        case "DMS Settings could not be opened.": return I18n.trFor("trellisDms", "DMS Settings could not be opened.");
        case "The task document response was invalid or stale.": return I18n.trFor("trellisDms", "The task document response was invalid or stale.");
        case "The archive response was invalid or stale.": return I18n.trFor("trellisDms", "The archive response was invalid or stale.");
        case "Task document could not be loaded.": return I18n.trFor("trellisDms", "Task document could not be loaded.");
        case "This task document could not be loaded.": return I18n.trFor("trellisDms", "This task document could not be loaded.");
        case "Archive data could not be loaded.": return I18n.trFor("trellisDms", "Archive data could not be loaded.");
        case "The archive could not be loaded.": return I18n.trFor("trellisDms", "The archive could not be loaded.");
        case "could not create discovery process": return I18n.trFor("trellisDms", "could not create discovery process");
        case "could not create file reader": return I18n.trFor("trellisDms", "could not create file reader");
        case "project discovery cap reached": return I18n.trFor("trellisDms", "project discovery cap reached");
        case "could not read .trellis/.version": return I18n.trFor("trellisDms", "could not read .trellis/.version");
        case "version path rejected": return I18n.trFor("trellisDms", "version path rejected");
        case "Trellis version is not the verified compatibility baseline": return I18n.trFor("trellisDms", "Trellis version is not the verified compatibility baseline");
        case "Trellis version is missing or malformed": return I18n.trFor("trellisDms", "Trellis version is missing or malformed");
        case "archive directory is unavailable; archive tasks are not loaded": return I18n.trFor("trellisDms", "archive directory is unavailable; archive tasks are not loaded");
        case "archive directory path rejected": return I18n.trFor("trellisDms", "archive directory path rejected");
        case "could not discover live task directories": return I18n.trFor("trellisDms", "could not discover live task directories");
        case "could not discover session pointers": return I18n.trFor("trellisDms", "could not discover session pointers");
        case "task directory could not be canonicalized": return I18n.trFor("trellisDms", "task directory could not be canonicalized");
        case "task directory rejected": return I18n.trFor("trellisDms", "task directory rejected");
        case "task.json could not be canonicalized": return I18n.trFor("trellisDms", "task.json could not be canonicalized");
        case "task.json path rejected": return I18n.trFor("trellisDms", "task.json path rejected");
        case "session pointer could not be canonicalized": return I18n.trFor("trellisDms", "session pointer could not be canonicalized");
        case "session file rejected": return I18n.trFor("trellisDms", "session file rejected");
        case "canonical root escaped its configured root": return I18n.trFor("trellisDms", "canonical root escaped its configured root");
        case "could not discover .trellis directories": return I18n.trFor("trellisDms", "could not discover .trellis directories");
        case "discovered .trellis path could not be canonicalized": return I18n.trFor("trellisDms", "discovered .trellis path could not be canonicalized");
        case "discovered project is outside configured root": return I18n.trFor("trellisDms", "discovered project is outside configured root");
        case "known-file reload queue cap reached": return I18n.trFor("trellisDms", "known-file reload queue cap reached");
        case "known-file project is no longer loaded": return I18n.trFor("trellisDms", "known-file project is no longer loaded");
        case "could not reload .trellis/.version": return I18n.trFor("trellisDms", "could not reload .trellis/.version");
        case "task.json reload failed; last valid value retained": return I18n.trFor("trellisDms", "task.json reload failed; last valid value retained");
        case "task.json is malformed; last valid value retained": return I18n.trFor("trellisDms", "task.json is malformed; last valid value retained");
        case "session pointer reload failed; last valid value retained": return I18n.trFor("trellisDms", "session pointer reload failed; last valid value retained");
        case "session pointer is malformed; last valid value retained": return I18n.trFor("trellisDms", "session pointer is malformed; last valid value retained");
        case "known-file watcher cap reached": return I18n.trFor("trellisDms", "known-file watcher cap reached");
        case "could not create known-file watcher": return I18n.trFor("trellisDms", "could not create known-file watcher");
        case "no Trellis project was found under the configured root": return I18n.trFor("trellisDms", "no Trellis project was found under the configured root");
        case "discovery was degraded; last valid Trellis snapshot retained": return I18n.trFor("trellisDms", "discovery was degraded; last valid Trellis snapshot retained");
        case "trusted scan root cap reached": return I18n.trFor("trellisDms", "trusted scan root cap reached");
        case "topology interval was normalized to the safe 15–300 second range": return I18n.trFor("trellisDms", "topology interval was normalized to the safe 15–300 second range");
        case "configured root could not be canonicalized": return I18n.trFor("trellisDms", "configured root could not be canonicalized");
        case "no project root is configured": return I18n.trFor("trellisDms", "no project root is configured");
        case "duplicate project root ignored": return I18n.trFor("trellisDms", "duplicate project root ignored");
        case "discovery output exceeded its byte limit": return I18n.trFor("trellisDms", "discovery output exceeded its byte limit");
        case "discovery line contains a control character": return I18n.trFor("trellisDms", "discovery line contains a control character");
        case "discovery result cap reached": return I18n.trFor("trellisDms", "discovery result cap reached");
        case "parent/child relation conflict": return I18n.trFor("trellisDms", "parent/child relation conflict");
        case "session JSON must contain an object": return I18n.trFor("trellisDms", "session JSON must contain an object");
        case "session current_task is not a non-empty string": return I18n.trFor("trellisDms", "session current_task is not a non-empty string");
        case "session pointer does not resolve to a task": return I18n.trFor("trellisDms", "session pointer does not resolve to a task");
        case "session pointer resolved outside loaded task records": return I18n.trFor("trellisDms", "session pointer resolved outside loaded task records");
        case "The selected task is no longer available.": return I18n.trFor("trellisDms", "The selected task is no longer available.");
        case "This task document is not available.": return I18n.trFor("trellisDms", "This task document is not available.");
        case "This task document path was rejected.": return I18n.trFor("trellisDms", "This task document path was rejected.");
        case "This task document exceeds the safe display limit.": return I18n.trFor("trellisDms", "This task document exceeds the safe display limit.");
        case "This task document could not be read.": return I18n.trFor("trellisDms", "This task document could not be read.");
        case "This task document path check could not start.": return I18n.trFor("trellisDms", "This task document path check could not start.");
        case "The selected archive month could not be listed.": return I18n.trFor("trellisDms", "The selected archive month could not be listed.");
        case "Archive page selectors were normalized to safe bounds.": return I18n.trFor("trellisDms", "Archive page selectors were normalized to safe bounds.");
        case "Archive task discovery reached its finite cap.": return I18n.trFor("trellisDms", "Archive task discovery reached its finite cap.");
        case "The selected archive month listing could not start.": return I18n.trFor("trellisDms", "The selected archive month listing could not start.");
        case "The selected archive month is no longer available.": return I18n.trFor("trellisDms", "The selected archive month is no longer available.");
        case "The selected archive month failed canonical validation.": return I18n.trFor("trellisDms", "The selected archive month failed canonical validation.");
        case "The archive month path check could not start.": return I18n.trFor("trellisDms", "The archive month path check could not start.");
        case "This project has no accessible archive directory.": return I18n.trFor("trellisDms", "This project has no accessible archive directory.");
        case "The archive root failed canonical validation.": return I18n.trFor("trellisDms", "The archive root failed canonical validation.");
        case "The archive directory could not be listed.": return I18n.trFor("trellisDms", "The archive directory could not be listed.");
        case "Archive month discovery reached its finite cap.": return I18n.trFor("trellisDms", "Archive month discovery reached its finite cap.");
        case "An archive month failed canonical validation.": return I18n.trFor("trellisDms", "An archive month failed canonical validation.");
        case "An archive month path check could not start.": return I18n.trFor("trellisDms", "An archive month path check could not start.");
        case "An archive month type check could not start.": return I18n.trFor("trellisDms", "An archive month type check could not start.");
        case "The archive listing could not start.": return I18n.trFor("trellisDms", "The archive listing could not start.");
        case "The archive root path check could not start.": return I18n.trFor("trellisDms", "The archive root path check could not start.");
        case "The selected archived task is no longer available.": return I18n.trFor("trellisDms", "The selected archived task is no longer available.");
        case "The selected archived task identity could not be verified.": return I18n.trFor("trellisDms", "The selected archived task identity could not be verified.");
        case "The selected archived task identity is stale.": return I18n.trFor("trellisDms", "The selected archived task identity is stale.");
        case "The archived task identity check could not start.": return I18n.trFor("trellisDms", "The archived task identity check could not start.");
        case "The archived task path check could not start.": return I18n.trFor("trellisDms", "The archived task path check could not start.");
        case "Archive task path check could not start.": return I18n.trFor("trellisDms", "Archive task path check could not start.");
        case "Archive task type check could not start.": return I18n.trFor("trellisDms", "Archive task type check could not start.");
        case "The archive request is invalid.": return I18n.trFor("trellisDms", "The archive request is invalid.");
        case "The task document request is invalid.": return I18n.trFor("trellisDms", "The task document request is invalid.");
        case "The selected project is no longer available.": return I18n.trFor("trellisDms", "The selected project is no longer available.");
        case "The selected live task is no longer available.": return I18n.trFor("trellisDms", "The selected live task is no longer available.");
        default: return message;
        }
    }

    function localizedWarningMessages(value) {
        if (typeof value !== "string" || value === "")
            return "";
        var messages = value.split("\n");
        var localized = [];
        for (var i = 0; i < messages.length; i++) {
            if (messages[i] !== "")
                localized.push(root.localizedWarningMessage(messages[i]));
        }
        return localized.join(" ").slice(0, 240);
    }

    function loadPreferenceState() {
        if (!root.pluginService || !root.pluginId
                || typeof root.pluginService.loadPluginState !== "function") {
            root.preferenceStateWarning = "";
            root.stateWarning = "DMS State is unavailable; UI choices will remain local.";
            return;
        }
        try {
            var loadedPin = root.pluginService.loadPluginState(
                root.pluginId, "pinnedTaskId", "");
            var loadedProject = root.pluginService.loadPluginState(
                root.pluginId, "selectedProjectId", "");
            var loadedCollapsedProjects = root.pluginService.loadPluginState(
                root.pluginId, "collapsedProjectIds", []);
            var loadedCollapsedGroups = root.pluginService.loadPluginState(
                root.pluginId, "collapsedTaskGroups", []);
            var loadedArchiveMonth = root.pluginService.loadPluginState(
                root.pluginId, "selectedArchiveMonth", "");
            var warnings = [];
            var parsedPin = TrellisProjection.parsePinnedTaskToken(loadedPin);
            if (loadedPin !== undefined && loadedPin !== null && loadedPin !== ""
                    && !parsedPin)
                warnings.push("Saved pin was invalid and was ignored.");
            root.pinnedTaskId = parsedPin
                ? TrellisProjection.makePinnedTaskToken(parsedPin.projectId, parsedPin.taskId)
                : "";

            var normalizedProject = TrellisProjection.normalizeUiState({
                selectedProjectId: loadedProject
            }).selectedProjectId;
            if (loadedProject !== undefined && loadedProject !== null
                    && loadedProject !== "" && !normalizedProject)
                warnings.push("Saved project filter was invalid and was ignored.");
            root.selectedProjectId = normalizedProject;

            var normalizedProjects = TrellisProjection.normalizeCollapsedProjectIds(
                loadedCollapsedProjects);
            if ((loadedCollapsedProjects !== undefined && loadedCollapsedProjects !== null)
                    && (!Array.isArray(loadedCollapsedProjects)
                    || normalizedProjects.length !== loadedCollapsedProjects.length)
                    )
                warnings.push("Some saved project collapse choices were invalid and were ignored.");
            root.collapsedProjectIds = normalizedProjects;

            var normalizedGroups = TrellisProjection.normalizeCollapsedTaskGroups(
                loadedCollapsedGroups);
            if ((loadedCollapsedGroups !== undefined && loadedCollapsedGroups !== null)
                    && (!Array.isArray(loadedCollapsedGroups)
                    || normalizedGroups.length !== loadedCollapsedGroups.length)
                    )
                warnings.push("Some saved group collapse choices were invalid and were ignored.");
            root.collapsedTaskGroups = normalizedGroups;

            var normalizedMonth = TrellisProjection.normalizeSelectedArchiveMonth(
                loadedArchiveMonth);
            if (loadedArchiveMonth !== undefined && loadedArchiveMonth !== null
                    && loadedArchiveMonth !== "" && !normalizedMonth)
                warnings.push("Saved archive month was invalid and was ignored.");
            root.selectedArchiveMonth = normalizedMonth;
            root.preferenceStateWarning = warnings.join("\n");
            root.stateWarning = "";
        } catch (error) {
            root.preferenceStateWarning = "";
            root.stateWarning = "DMS State could not load saved Trellis preferences; local choices remain usable.";
        }
    }

    function persistPreference(key, value) {
        if (!root.pluginService || !root.pluginId) {
            root.preferenceStateWarning = "";
            root.stateWarning = "Preference changed locally, but DMS State is unavailable.";
            return false;
        }
        try {
            if (value === "" && typeof root.pluginService.removePluginStateKey === "function") {
                root.pluginService.removePluginStateKey(root.pluginId, key);
            } else if (typeof root.pluginService.savePluginState === "function") {
                root.pluginService.savePluginState(root.pluginId, key, value);
            } else {
                root.preferenceStateWarning = "";
                root.stateWarning = "Preference changed locally, but DMS State is unavailable.";
                return false;
            }
            root.preferenceStateWarning = "";
            root.stateWarning = "";
            return true;
        } catch (error) {
            root.preferenceStateWarning = "";
            root.stateWarning = "Preference changed locally, but DMS State could not save it.";
            return false;
        }
    }

    function selectProject(projectId) {
        var nextProjectId = typeof projectId === "string" ? projectId.trim() : "";
        var currentProjectId = typeof root.selectedProjectId === "string"
            ? root.selectedProjectId.trim() : "";
        if (!root.popoutProjection.invalidSelectedProject
                && currentProjectId === nextProjectId)
            return;
        root.selectedProjectId = nextProjectId;
        root.persistPreference("selectedProjectId", nextProjectId);
    }

    function togglePinnedTask(projectId, taskId) {
        var token = TrellisProjection.makePinnedTaskToken(projectId, taskId);
        if (!token)
            return;
        var currentPin = TrellisProjection.parsePinnedTaskToken(root.pinnedTaskId);
        var pinnedHere = currentPin && currentPin.projectId === projectId
            && currentPin.taskId === taskId;
        var nextToken = pinnedHere ? "" : token;
        root.pinnedTaskId = nextToken;
        root.persistPreference("pinnedTaskId", nextToken);
    }

    function toggleProjectCollapsed(projectId) {
        var normalized = TrellisProjection.normalizeCollapsedProjectIds(
            root.collapsedProjectIds);
        var index = normalized.indexOf(projectId);
        if (index === -1)
            normalized.push(projectId);
        else
            normalized.splice(index, 1);
        root.collapsedProjectIds = TrellisProjection.normalizeCollapsedProjectIds(normalized);
        root.persistPreference("collapsedProjectIds", root.collapsedProjectIds);
    }

    function toggleTaskGroupCollapsed(projectId, groupKey) {
        var token = projectId + "/" + groupKey;
        var normalized = TrellisProjection.normalizeCollapsedTaskGroups(
            root.collapsedTaskGroups);
        var index = normalized.indexOf(token);
        if (index === -1)
            normalized.push(token);
        else
            normalized.splice(index, 1);
        root.collapsedTaskGroups = TrellisProjection.normalizeCollapsedTaskGroups(normalized);
        root.persistPreference("collapsedTaskGroups", root.collapsedTaskGroups);
    }

    function requestRefresh() {
        if (!root.pluginService || !root.pluginId
                || typeof root.pluginService.savePluginData !== "function") {
            root.recoveryActionWarning = "Trellis refresh is unavailable in this DMS session.";
            return false;
        }
        try {
            root.refreshBaselineGeneratedAt = root.popoutProjection.generatedAt || "";
            root.refreshPending = true;
            root.refreshRequestSerial += 1;
            root.pluginService.savePluginData(root.pluginId, "refreshToken",
                Date.now() + "-" + root.refreshRequestSerial);
            root.recoveryActionWarning = "";
            return true;
        } catch (error) {
            root.refreshPending = false;
            root.recoveryActionWarning = "Trellis refresh could not be requested from DMS.";
            return false;
        }
    }

    function openPluginSettings() {
        try {
            if (PopoutService.settingsModal
                    && typeof PopoutService.settingsModal.openPluginSettings === "function") {
                PopoutService.settingsModal.openPluginSettings(root.pluginId);
                PopoutService.settingsModal.show();
            } else if (typeof PopoutService.openSettingsWithTab === "function") {
                PopoutService.openSettingsWithTab("plugins");
            } else if (typeof PopoutService.openSettings === "function") {
                PopoutService.openSettings();
            } else {
                root.recoveryActionWarning = "DMS Settings are unavailable in this session.";
                return false;
            }
            root.recoveryActionWarning = "";
            return true;
        } catch (error) {
            root.recoveryActionWarning = "DMS Settings could not be opened.";
            return false;
        }
    }

    function observeRefreshSnapshot() {
        if (!root.refreshPending || !root.popoutProjection.ready
                || root.popoutProjection.degraded)
            return;
        var generatedAt = root.popoutProjection.generatedAt || "";
        if (TrellisProjection.isNewerGeneratedAt(
                generatedAt, root.refreshBaselineGeneratedAt)) {
            root.refreshPending = false;
            root.refreshBaselineGeneratedAt = "";
        }
    }

    function _isAllowedDetailDocument(document) {
        return document === "prd.md" || document === "design.md"
            || document === "implement.md";
    }

    function openTaskDetail(projectId, taskId, title) {
        if (typeof projectId !== "string" || !projectId
                || typeof taskId !== "string" || !taskId)
            return;
        root.detailMode = true;
        root.detailArchive = false;
        root.detailMonth = "";
        root.detailDirName = "";
        root.detailProjectId = projectId;
        root.detailTaskId = taskId;
        root.detailTitle = typeof title === "string" && title
            ? title.slice(0, 240) : taskId.slice(0, 240);
        root.requestDetailDocument("prd.md");
    }

    function requestDetailDocument(document) {
        if (!root.detailMode || !_isAllowedDetailDocument(document))
            return;
        root.detailDocument = document;
        root.detailRequestSerial += 1;
        root.detailRequestId = "markdown-" + Date.now() + "-"
            + root.detailRequestSerial + "-"
            + Math.floor(Math.random() * 1000000);
        root.detailStatus = "loading";
        root.detailContent = "";
        root.detailFormat = "plain";
        root.detailError = "";
        if (root.detailArchive) {
            detailRequestVar.set({
                requestId: root.detailRequestId,
                kind: "archive-task",
                projectId: root.detailProjectId,
                month: root.detailMonth,
                taskId: root.detailTaskId,
                dirName: root.detailDirName,
                document: document
            });
        } else {
            detailRequestVar.set({
                requestId: root.detailRequestId,
                kind: "markdown",
                projectId: root.detailProjectId,
                taskId: root.detailTaskId,
                document: document
            });
        }
    }

    function closeTaskDetail() {
        root.detailRequestSerial += 1;
        root.detailRequestId = "";
        root.detailMode = false;
        root.detailArchive = false;
        root.detailMonth = "";
        root.detailDirName = "";
        root.detailProjectId = "";
        root.detailTaskId = "";
        root.detailTitle = "";
        root.detailStatus = "idle";
        root.detailContent = "";
        root.detailFormat = "plain";
        root.detailError = "";
        detailRequestVar.set(null);
    }

    function observeDetailResponse() {
        var response = detailResponseVar.value;
        if (!response || typeof response !== "object")
            return;
        if (root.detailMode && response.requestId === root.detailRequestId) {
            var expectedKind = root.detailArchive ? "archive-task" : "markdown";
            if (response.kind !== expectedKind
                || response.projectId !== root.detailProjectId
                || response.taskId !== root.detailTaskId
                || response.document !== root.detailDocument
                || (root.detailArchive && (response.month !== root.detailMonth
                    || response.dirName !== root.detailDirName))
                || ["ready", "empty", "error"].indexOf(response.status) === -1
                || ["markdown", "plain"].indexOf(response.format) === -1
                || typeof response.content !== "string"
                || response.content.length > root.maxDetailCharacters) {
                root.detailStatus = "error";
                root.detailContent = "";
                root.detailFormat = "plain";
                root.detailError = "The task document response was invalid or stale.";
                return;
            }

            root.detailStatus = response.status;
            root.detailContent = response.status === "ready" ? response.content : "";
            root.detailFormat = response.format;
            root.detailError = "";
            if (response.status === "error") {
                var warning = Array.isArray(response.warnings) && response.warnings.length
                    ? response.warnings[0] : null;
                var message = warning && typeof warning.message === "string"
                    ? warning.message.slice(0, 160) : "This task document could not be loaded.";
                root.detailError = message;
            }
            return;
        }

        if (!root.archiveMode || response.requestId !== root.archiveRequestId)
            return;
        if (["archive-index", "archive-page"].indexOf(response.kind) === -1
                || response.projectId !== root.archiveProjectId
                || ["ready", "empty", "error", "unknown-layout"].indexOf(response.status) === -1
                || !Array.isArray(response.months) || response.months.length > 48
                || !Array.isArray(response.tasks) || response.tasks.length > 32
                || !Array.isArray(response.warnings) || response.warnings.length > 8) {
            root.archiveStatus = "stale";
            root.archiveError = "The archive response was invalid or stale.";
            return;
        }
        root.archiveStatus = response.status;
        var responseMonth = typeof response.selectedMonth === "string"
            ? response.selectedMonth : "";
        var preferredMonth = TrellisProjection.normalizeSelectedArchiveMonth(
            root.selectedArchiveMonth);
        var preferredAvailable = false;
        for (var monthIndex = 0; monthIndex < response.months.length; monthIndex++) {
            if (response.months[monthIndex]
                    && response.months[monthIndex].month === preferredMonth) {
                preferredAvailable = true;
                break;
            }
        }
        if (response.kind === "archive-index" && response.status === "ready"
                && preferredAvailable && preferredMonth !== responseMonth) {
            root.archiveMonths = response.months;
            root.archiveSelectedMonth = preferredMonth;
            root.requestArchivePage(preferredMonth, 0);
            return;
        }
        root.archiveSelectedMonth = responseMonth;
        root.archivePage = typeof response.page === "number" ? response.page : 0;
        if (response.kind === "archive-index" || response.months.length)
            root.archiveMonths = response.months;
        root.archiveTasks = response.tasks;
        root.archiveHasMore = !!response.hasMore;
        root.archiveWarnings = response.warnings;
        root.archiveError = "";
        if (response.status === "error" || response.status === "unknown-layout") {
            var archiveWarning = response.warnings.length ? response.warnings[0] : null;
            root.archiveError = archiveWarning
                && typeof archiveWarning.message === "string"
                ? archiveWarning.message.slice(0, 160)
                : "The archive could not be loaded.";
        }
    }

    function _archiveProject() {
        var projects = root.popoutProjection.projects || [];
        if (!projects.length)
            return null;
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].id === root.popoutProjection.selectedProjectId)
                return projects[i];
        }
        return projects[0];
    }

    function _nextArchiveRequestId(prefix) {
        root.detailRequestSerial += 1;
        return prefix + "-" + Date.now() + "-" + root.detailRequestSerial
            + "-" + Math.floor(Math.random() * 1000000);
    }

    function openArchive() {
        var project = _archiveProject();
        if (!project)
            return;
        root.archiveMode = true;
        root.archiveProjectId = project.id;
        root.archiveProjectName = project.name;
        root.archiveMonths = [];
        root.archiveTasks = [];
        root.archiveSelectedMonth = TrellisProjection.normalizeSelectedArchiveMonth(
            root.selectedArchiveMonth);
        root.archivePage = 0;
        root.requestArchiveIndex();
    }

    function requestArchiveIndex() {
        if (!root.archiveMode || !root.archiveProjectId)
            return;
        root.archiveRequestId = _nextArchiveRequestId("archive-index");
        root.archiveStatus = "loading";
        root.archiveError = "";
        detailRequestVar.set({
            requestId: root.archiveRequestId,
            kind: "archive-index",
            projectId: root.archiveProjectId,
            page: 0,
            pageSize: root.archivePageSize
        });
    }

    function requestArchivePage(month, page) {
        if (!root.archiveMode || typeof month !== "string" || !month)
            return;
        var normalizedMonth = TrellisProjection.normalizeSelectedArchiveMonth(month);
        if (!normalizedMonth)
            return;
        root.archiveSelectedMonth = normalizedMonth;
        root.selectedArchiveMonth = normalizedMonth;
        root.persistPreference("selectedArchiveMonth", normalizedMonth);
        var numericPage = Number(page);
        root.archivePage = isFinite(numericPage) ? Math.max(0, Math.floor(numericPage)) : 0;
        root.archiveRequestId = _nextArchiveRequestId("archive-page");
        root.archiveStatus = "loading";
        root.archiveError = "";
        detailRequestVar.set({
            requestId: root.archiveRequestId,
            kind: "archive-page",
            projectId: root.archiveProjectId,
            month: normalizedMonth,
            page: root.archivePage,
            pageSize: root.archivePageSize
        });
    }

    function openArchiveTask(task) {
        if (!root.archiveMode || !task || !task.available)
            return;
        root.detailArchive = true;
        root.detailMode = true;
        root.detailProjectId = root.archiveProjectId;
        root.detailTaskId = task.id;
        root.detailMonth = task.month;
        root.detailDirName = task.dirName;
        root.detailTitle = task.title;
        root.requestDetailDocument("prd.md");
    }

    function closeArchive() {
        if (root.detailMode)
            root.closeTaskDetail();
        root.detailRequestSerial += 1;
        root.archiveRequestId = "";
        root.archiveMode = false;
        root.archiveProjectId = "";
        root.archiveProjectName = "";
        root.archiveStatus = "idle";
        root.archiveSelectedMonth = "";
        root.archivePage = 0;
        root.archiveMonths = [];
        root.archiveTasks = [];
        root.archiveHasMore = false;
        root.archiveWarnings = [];
        root.archiveError = "";
        detailRequestVar.set(null);
    }

    Component.onCompleted: loadPreferenceState()
    onPluginServiceChanged: loadPreferenceState()
    onPluginIdChanged: loadPreferenceState()
    onPluginDataChanged: {
        if (!root.showArchive && root.archiveMode)
            root.closeArchive();
    }
    onShowArchiveChanged: {
        if (!root.showArchive && root.archiveMode)
            root.closeArchive();
    }
    onPopoutProjectionChanged: observeRefreshSnapshot()

    Connections {
        target: root.pluginService
        enabled: !!root.pluginService

        function onPluginStateChanged(changedPluginId) {
            if (changedPluginId === root.pluginId)
                root.loadPreferenceState();
        }
    }

    PluginGlobalVar {
        id: snapshotVar
        varName: "snapshot"
        defaultValue: null
    }

    PluginGlobalVar {
        id: detailRequestVar
        varName: "detailRequest"
        defaultValue: null
    }

    PluginGlobalVar {
        id: detailResponseVar
        varName: "detailResponse"
        defaultValue: null
        onValueChanged: root.observeDetailResponse()
    }

    horizontalBarPill: Component {
        Row {
            spacing: Theme.spacingXS

            DankIcon {
                visible: root.pillProjection.kind === "label"
                    || root.pillProjection.kind === "icon"
                    || root.pillProjection.kind === "full"
                anchors.verticalCenter: parent.verticalCenter
                name: root.pillProjection.iconName
                size: root.iconSize
                color: Theme.surfaceText
            }

            Row {
                visible: root.pillProjection.kind === "counts"
                anchors.verticalCenter: parent.verticalCenter
                spacing: Theme.spacingS

                Row {
                    spacing: Theme.spacingXXS

                    DankIcon {
                        anchors.verticalCenter: parent.verticalCenter
                        name: "account_tree"
                        size: root.iconSize
                        color: Theme.surfaceText
                    }

                    StyledText {
                        anchors.verticalCenter: parent.verticalCenter
                        text: root.pillProjection.projectCount
                        font.pixelSize: Theme.fontSizeMedium
                        color: Theme.surfaceText
                    }
                }

                Row {
                    spacing: Theme.spacingXXS

                    DankIcon {
                        anchors.verticalCenter: parent.verticalCenter
                        name: "task_alt"
                        size: root.iconSize
                        color: Theme.surfaceText
                    }

                    StyledText {
                        anchors.verticalCenter: parent.verticalCenter
                        text: root.pillProjection.taskCount
                        font.pixelSize: Theme.fontSizeMedium
                        color: Theme.surfaceText
                    }
                }

                Row {
                    visible: root.pillProjection.warningCount > 0
                    spacing: Theme.spacingXXS

                    DankIcon {
                        anchors.verticalCenter: parent.verticalCenter
                        name: "warning"
                        size: root.iconSize
                        color: Theme.warning
                    }

                    StyledText {
                        anchors.verticalCenter: parent.verticalCenter
                        text: root.pillProjection.warningCount
                        font.pixelSize: Theme.fontSizeMedium
                        color: Theme.warning
                    }
                }
            }

            StyledText {
                visible: root.pillProjection.kind === "label"
                    || root.pillProjection.kind === "full"
                anchors.verticalCenter: parent.verticalCenter
                width: Math.min(implicitWidth, 180)
                text: root.pillLabel()
                font.pixelSize: Theme.fontSizeMedium
                color: Theme.surfaceText
                wrapMode: Text.NoWrap
                elide: Text.ElideRight
            }

            StyledText {
                visible: root.pillProjection.extraCount > 0
                anchors.verticalCenter: parent.verticalCenter
                text: "+" + root.pillProjection.extraCount
                font.pixelSize: Theme.fontSizeMedium
                color: Theme.surfaceVariantText
            }

            DankIcon {
                visible: root.pillProjection.warningCount > 0
                    && root.pillProjection.kind !== "counts"
                anchors.verticalCenter: parent.verticalCenter
                name: "warning"
                size: root.iconSize
                color: Theme.warning
            }
        }
    }

    verticalBarPill: Component {
        Column {
            spacing: Theme.spacingXXS

            DankIcon {
                anchors.horizontalCenter: parent.horizontalCenter
                name: "account_tree"
                size: root.iconSize
                color: Theme.surfaceText
            }

            DankIcon {
                visible: root.pillProjection.warningCount > 0
                anchors.horizontalCenter: parent.horizontalCenter
                name: "warning"
                size: Math.max(12, root.iconSize - 4)
                color: Theme.warning
            }
        }
    }

    popoutContent: Component {
        PopoutComponent {
            id: popoutPanel

            readonly property real targetHeight: root.popoutHeight - Theme.spacingS * 2

            width: parent ? parent.width : root.popoutWidth - Theme.spacingS * 2
            headerText: "Trellis"
            detailsText: root.detailMode
                ? (root.detailArchive
                    ? I18n.trFor("trellisDms", "Archive · Read only") + " · " : "")
                    + root.detailTitle
                : (root.archiveMode
                ? root.archiveProjectName + " · "
                    + I18n.trFor("trellisDms", "Historical / read only")
                : (root.popoutProjection.ready
                ? root.projectCountLabel(root.popoutProjection.projectCount)
                    + " / " + root.taskCountLabel(root.popoutProjection.taskCount)
                : I18n.trFor("trellisDms", "Loading status")))
            showCloseButton: true

            DankFlickable {
                width: parent.width
                height: Math.max(0, popoutPanel.targetHeight
                    - popoutPanel.headerHeight - popoutPanel.detailsHeight)
                contentWidth: width
                contentHeight: popoutBody.implicitHeight
                clip: true

                Column {
                    id: popoutBody

                    width: parent.width
                    spacing: Theme.spacingM

                    Column {
                        visible: root.detailMode
                        width: parent.width
                        spacing: Theme.spacingM

                        DankButton {
                            width: Math.min(120, parent.width)
                            clip: true
                            text: I18n.trFor("trellisDms", "Back")
                            iconName: "arrow_back"
                            buttonHeight: 40
                            onClicked: root.closeTaskDetail()
                        }

                        Flow {
                            id: detailDocumentTabs

                            width: parent.width
                            height: childrenRect.height
                            spacing: Theme.spacingXS

                            Repeater {
                                model: root.detailDocuments

                                DankButton {
                                    required property var modelData

                                    readonly property bool selected: root.detailDocument
                                        === modelData.document

                                    width: Math.min(120, detailDocumentTabs.width)
                                    clip: true
                                    text: modelData.label
                                    buttonHeight: 40
                                    horizontalPadding: Theme.spacingM
                                    backgroundColor: selected
                                        ? Theme.primary : Theme.surfaceVariant
                                    textColor: selected
                                        ? Theme.primaryText : Theme.surfaceVariantText
                                    onClicked: root.requestDetailDocument(modelData.document)
                                }
                            }
                        }

                        StyledText {
                            visible: root.detailStatus === "loading"
                            width: parent.width
                            text: I18n.trFor("trellisDms", "Loading %1...")
                                .arg(root.localizedDocumentName(root.detailDocument))
                            font.pixelSize: Theme.fontSizeMedium
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }

                        StyledText {
                            visible: root.detailStatus === "empty"
                            width: parent.width
                            text: I18n.trFor("trellisDms", "This task document is empty.")
                            font.pixelSize: Theme.fontSizeMedium
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }

                        StyledText {
                            visible: root.detailStatus === "error"
                            width: parent.width
                            text: root.localizedWarningMessage(root.detailError)
                            font.pixelSize: Theme.fontSizeMedium
                            color: Theme.warning
                            wrapMode: Text.WordWrap
                        }

                        StyledText {
                            visible: root.detailStatus === "ready"
                                && (root.detailFormat === "plain"
                                    || !root.nativeMarkdownAvailable)
                            width: parent.width
                            text: I18n.trFor("trellisDms", "Shown as plain text because native Markdown rendering is unavailable.")
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }

                        StyledText {
                            visible: root.detailStatus === "ready"
                            width: parent.width
                            text: root.detailContent
                            textFormat: root.nativeMarkdownAvailable
                                && root.detailFormat === "markdown"
                                ? Text.MarkdownText : Text.PlainText
                            font.pixelSize: Theme.fontSizeMedium
                            color: Theme.surfaceText
                            wrapMode: Text.WordWrap
                            elide: Text.ElideNone
                        }
                    }

                    Column {
                        visible: root.archiveMode && !root.detailMode
                        width: parent.width
                        spacing: Theme.spacingM

                        Flow {
                            id: archiveHeaderActions

                            width: parent.width
                            height: childrenRect.height
                            spacing: Theme.spacingS

                            DankButton {
                                width: Math.min(140, archiveHeaderActions.width)
                                clip: true
                                text: I18n.trFor("trellisDms", "Back to live")
                                iconName: "arrow_back"
                                buttonHeight: 40
                                onClicked: root.closeArchive()
                            }

                            DankButton {
                                width: Math.min(120, archiveHeaderActions.width)
                                clip: true
                                text: I18n.trFor("trellisDms", "Reload")
                                iconName: "refresh"
                                buttonHeight: 40
                                onClicked: root.requestArchiveIndex()
                            }
                        }

                        StyledText {
                            width: parent.width
                            text: I18n.trFor("trellisDms", "Historical Archive · Read only")
                            font.pixelSize: Theme.fontSizeMedium
                            font.weight: Font.DemiBold
                            color: Theme.surfaceText
                            wrapMode: Text.WordWrap
                        }

                        StyledText {
                            width: parent.width
                            text: I18n.trFor("trellisDms", "Archived tasks are loaded on demand and never enter the live task list.")
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }

                        StyledText {
                            visible: root.archiveStatus === "loading"
                            width: parent.width
                            text: I18n.trFor("trellisDms", "Loading archive index...")
                            font.pixelSize: Theme.fontSizeMedium
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }

                        StyledText {
                            visible: root.archiveStatus === "empty"
                            width: parent.width
                            text: root.archiveSelectedMonth
                                ? I18n.trFor("trellisDms", "No archived tasks are available on this page.")
                                : I18n.trFor("trellisDms", "This project has no archived task months.")
                            font.pixelSize: Theme.fontSizeMedium
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }

                        StyledText {
                            visible: root.archiveStatus === "error"
                                || root.archiveStatus === "unknown-layout"
                                || root.archiveStatus === "stale"
                            width: parent.width
                            text: root.localizedWarningMessage(root.archiveError)
                            font.pixelSize: Theme.fontSizeMedium
                            color: Theme.warning
                            wrapMode: Text.WordWrap
                        }

                        Column {
                            visible: root.archiveMonths.length > 0
                            width: parent.width
                            spacing: Theme.spacingXS

                            StyledText {
                                width: parent.width
                                text: I18n.trFor("trellisDms", "Month")
                                font.pixelSize: Theme.fontSizeSmall
                                font.weight: Font.DemiBold
                                color: Theme.surfaceVariantText
                            }

                            Flow {
                                id: archiveMonthFlow

                                width: parent.width
                                height: childrenRect.height
                                spacing: Theme.spacingXS

                                Repeater {
                                    model: root.archiveMonths

                                    DankButton {
                                        required property var modelData

                                        readonly property bool selected: modelData.month
                                            === root.archiveSelectedMonth
                                        width: Math.min(112, archiveMonthFlow.width)
                                        clip: true
                                        text: modelData.month
                                        buttonHeight: 40
                                        horizontalPadding: Theme.spacingM
                                        backgroundColor: selected
                                            ? Theme.primary : Theme.surfaceVariant
                                        textColor: selected
                                            ? Theme.primaryText : Theme.surfaceVariantText
                                        onClicked: root.requestArchivePage(modelData.month, 0)
                                    }
                                }
                            }
                        }

                        Flow {
                            id: archivePageControls

                            visible: root.archiveSelectedMonth !== ""
                            width: parent.width
                            height: childrenRect.height
                            spacing: Theme.spacingS

                            DankButton {
                                width: Math.min(112, archivePageControls.width)
                                clip: true
                                text: I18n.trFor("trellisDms", "Previous")
                                iconName: "chevron_left"
                                buttonHeight: 40
                                enabled: root.archivePage > 0
                                    && root.archiveStatus !== "loading"
                                onClicked: root.requestArchivePage(
                                    root.archiveSelectedMonth, root.archivePage - 1)
                            }

                            StyledText {
                                height: 40
                                verticalAlignment: Text.AlignVCenter
                                text: I18n.trFor("trellisDms", "Page %1")
                                    .arg(root.archivePage + 1)
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.surfaceVariantText
                            }

                            DankButton {
                                width: Math.min(96, archivePageControls.width)
                                clip: true
                                text: I18n.trFor("trellisDms", "Next")
                                iconName: "chevron_right"
                                buttonHeight: 40
                                enabled: root.archiveHasMore
                                    && root.archiveStatus !== "loading"
                                onClicked: root.requestArchivePage(
                                    root.archiveSelectedMonth, root.archivePage + 1)
                            }
                        }

                        Repeater {
                            model: root.archiveTasks

                            Item {
                                id: archiveTaskRow
                                required property var modelData

                                width: parent.width
                                height: Math.max(52, archiveTaskFacts.implicitHeight
                                    + Theme.spacingXS * 2, archiveTaskOpen.height)

                                DankIcon {
                                    id: archiveTaskIcon

                                    anchors.left: parent.left
                                    anchors.leftMargin: Theme.spacingM
                                    anchors.verticalCenter: parent.verticalCenter
                                    name: archiveTaskRow.modelData.available
                                        ? "inventory_2" : "error"
                                    size: Theme.iconSize - 4
                                    color: archiveTaskRow.modelData.available
                                        ? Theme.surfaceVariantText : Theme.warning
                                }

                                Column {
                                    id: archiveTaskFacts

                                    anchors.left: archiveTaskIcon.right
                                    anchors.leftMargin: Theme.spacingXS
                                    anchors.right: archiveTaskOpen.left
                                    anchors.rightMargin: Theme.spacingS
                                    anchors.verticalCenter: parent.verticalCenter
                                    spacing: Theme.spacingXXS

                                    StyledText {
                                        width: parent.width
                                        text: archiveTaskRow.modelData.title
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.surfaceText
                                        wrapMode: Text.NoWrap
                                        elide: Text.ElideRight
                                    }

                                    StyledText {
                                        width: parent.width
                                        text: root.localizedTaskState(
                                                archiveTaskRow.modelData.storedStatus) + " · "
                                            + archiveTaskRow.modelData.priority + " · "
                                            + archiveTaskRow.modelData.month
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: archiveTaskRow.modelData.available
                                            ? Theme.surfaceVariantText : Theme.warning
                                        wrapMode: Text.NoWrap
                                        elide: Text.ElideRight
                                    }
                                }

                                DankActionButton {
                                    id: archiveTaskOpen

                                    anchors.right: parent.right
                                    anchors.verticalCenter: parent.verticalCenter
                                    visible: archiveTaskRow.modelData.available
                                    buttonSize: 40
                                    iconSize: Theme.iconSize - 4
                                    iconName: "description"
                                    iconColor: Theme.surfaceVariantText
                                    backgroundColor: "transparent"
                                    tooltipText: I18n.trFor("trellisDms", "Open archived task details (read only)")
                                    tooltipSide: "left"
                                    onClicked: root.openArchiveTask(archiveTaskRow.modelData)
                                }
                            }
                        }

                        Column {
                            visible: root.archiveWarnings.length > 0
                            width: parent.width
                            spacing: Theme.spacingXS

                            Repeater {
                                model: root.archiveWarnings

                                StyledText {
                                    required property var modelData

                                    width: parent.width
                                    text: modelData.code + ": "
                                        + root.localizedWarningMessage(modelData.message)
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.warning
                                    wrapMode: Text.WordWrap
                                }
                            }
                        }
                    }

                    StyledText {
                        visible: !root.detailMode && !root.archiveMode
                            && !root.popoutProjection.ready
                        width: parent.width
                        text: I18n.trFor("trellisDms", "Loading Trellis status...")
                        font.pixelSize: Theme.fontSizeMedium
                        color: Theme.surfaceVariantText
                        wrapMode: Text.WordWrap
                    }

                    StyledText {
                        visible: !root.detailMode && !root.archiveMode
                            && root.preferenceStateWarning !== ""
                        width: parent.width
                        text: root.localizedWarningMessages(root.preferenceStateWarning)
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.warning
                        wrapMode: Text.WordWrap
                    }

                    StyledText {
                        visible: !root.detailMode && !root.archiveMode
                            && root.stateWarning !== ""
                        width: parent.width
                        text: root.localizedWarningMessage(root.stateWarning)
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.warning
                        wrapMode: Text.WordWrap
                    }

                    StyledText {
                        visible: !root.detailMode && !root.archiveMode
                            && root.popoutProjection.ready
                            && (root.popoutProjection.invalidPinnedTask
                                || root.popoutProjection.invalidSelectedProject)
                        width: parent.width
                        text: root.popoutProjection.invalidPinnedTask
                            && root.popoutProjection.invalidSelectedProject
                            ? I18n.trFor("trellisDms", "The saved pin and project filter are unavailable; showing the current live data.")
                            : (root.popoutProjection.invalidPinnedTask
                                ? I18n.trFor("trellisDms", "The saved pin is unavailable; showing the current primary task.")
                                : I18n.trFor("trellisDms", "The saved project filter is unavailable; showing all projects."))
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.surfaceVariantText
                        wrapMode: Text.WordWrap
                    }

                    Column {
                        visible: !root.detailMode && !root.archiveMode
                            && root.popoutProjection.ready
                        width: parent.width
                        spacing: Theme.spacingXS

                        Flow {
                            id: recoveryActions

                            width: parent.width
                            height: childrenRect.height
                            spacing: Theme.spacingS

                            DankButton {
                                width: Math.min(120, recoveryActions.width)
                                clip: true
                                text: I18n.trFor("trellisDms", "Refresh")
                                iconName: "refresh"
                                buttonHeight: 40
                                onClicked: root.requestRefresh()
                            }

                            DankButton {
                                width: Math.min(120, recoveryActions.width)
                                clip: true
                                text: I18n.trFor("trellisDms", "Settings")
                                iconName: "settings"
                                buttonHeight: 40
                                onClicked: root.openPluginSettings()
                            }

                            DankButton {
                                visible: root.showArchive
                                    && root.popoutProjection.projectCount > 0
                                width: Math.min(120, recoveryActions.width)
                                clip: true
                                text: I18n.trFor("trellisDms", "Archive")
                                iconName: "inventory_2"
                                buttonHeight: 40
                                onClicked: root.openArchive()
                            }
                        }

                        StyledText {
                            visible: root.refreshPending
                            width: parent.width
                            text: I18n.trFor("trellisDms", "Refresh requested. Current data stays visible until a new coherent snapshot arrives.")
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }

                        StyledText {
                            visible: root.recoveryActionWarning !== ""
                            width: parent.width
                            text: root.localizedWarningMessage(root.recoveryActionWarning)
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.warning
                            wrapMode: Text.WordWrap
                        }
                    }

                    Column {
                        visible: !root.detailMode && !root.archiveMode
                            && root.popoutProjection.ready
                            && root.popoutProjection.projectCount > 0
                        width: parent.width
                        spacing: Theme.spacingXS

                        StyledText {
                            text: I18n.trFor("trellisDms", "Project filter")
                            font.pixelSize: Theme.fontSizeSmall
                            font.weight: Font.DemiBold
                            color: Theme.surfaceVariantText
                        }

                        Flow {
                            id: projectFilterFlow

                            width: parent.width
                            height: childrenRect.height
                            spacing: Theme.spacingXS

                            Repeater {
                                model: root.projectFilterOptions

                                DankButton {
                                    required property var modelData

                                    readonly property bool selected: root.popoutProjection.selectedProjectId
                                        === modelData.id

                                    width: modelData.id === ""
                                        ? Math.min(80, projectFilterFlow.width)
                                        : Math.min(180, projectFilterFlow.width)
                                    clip: true
                                    text: modelData.id === "" ? modelData.name : modelData.label
                                    buttonHeight: 40
                                    horizontalPadding: Theme.spacingM
                                    backgroundColor: selected
                                        ? Theme.primary : Theme.surfaceVariant
                                    textColor: selected
                                        ? Theme.primaryText : Theme.surfaceVariantText
                                    onClicked: root.selectProject(modelData.id)
                                }
                            }
                        }

                        StyledText {
                            visible: root.popoutProjection.hiddenProjectOptionCount > 0
                            width: parent.width
                            text: I18n.trFor("trellisDms", "%1 more project filters are outside the visual limit")
                                .arg(root.popoutProjection.hiddenProjectOptionCount)
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }
                    }

                    Column {
                        visible: !root.detailMode && !root.archiveMode
                            && root.popoutProjection.ready
                            && root.popoutProjection.warningCount > 0
                        width: parent.width
                        spacing: Theme.spacingS

                        Row {
                            spacing: Theme.spacingXS

                            DankIcon {
                                anchors.verticalCenter: parent.verticalCenter
                                name: "warning"
                                size: Theme.iconSize
                                color: Theme.warning
                            }

                            StyledText {
                                anchors.verticalCenter: parent.verticalCenter
                                text: root.warningCountLabel(root.popoutProjection.warningCount)
                                font.pixelSize: Theme.fontSizeMedium
                                font.weight: Font.DemiBold
                                color: Theme.warning
                            }
                        }

                        Repeater {
                            model: root.popoutProjection.warnings

                            StyledText {
                                required property var modelData

                                width: parent.width
                                text: modelData.code + ": "
                                    + root.localizedWarningMessage(modelData.message)
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.surfaceVariantText
                                wrapMode: Text.WordWrap
                            }
                        }

                        StyledText {
                            visible: root.popoutProjection.hiddenWarningCount > 0
                            width: parent.width
                            text: I18n.trFor("trellisDms", "%1 more warnings")
                                .arg(root.popoutProjection.hiddenWarningCount)
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.surfaceVariantText
                        }

                        StyledText {
                            width: parent.width
                            text: I18n.trFor("trellisDms", "Rescan from Settings after correcting the path or file.")
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.surfaceVariantText
                            wrapMode: Text.WordWrap
                        }

                        Rectangle {
                            width: parent.width
                            height: 1
                            color: Theme.outlineMedium
                        }
                    }

                    StyledText {
                        visible: !root.detailMode && !root.archiveMode
                            && root.popoutProjection.ready
                            && root.popoutProjection.projectCount === 0
                            && root.popoutProjection.unconfigured
                        width: parent.width
                        text: I18n.trFor("trellisDms", "Add a trusted scan folder in Trellis DMS Settings.")
                        font.pixelSize: Theme.fontSizeMedium
                        color: Theme.surfaceVariantText
                        wrapMode: Text.WordWrap
                    }

                    StyledText {
                        visible: !root.detailMode && !root.archiveMode
                            && root.popoutProjection.ready
                            && root.popoutProjection.projectCount === 0
                            && !root.popoutProjection.unconfigured
                        width: parent.width
                        text: I18n.trFor("trellisDms", "No Trellis projects were found under the trusted scan folders.")
                        font.pixelSize: Theme.fontSizeMedium
                        color: Theme.surfaceVariantText
                        wrapMode: Text.WordWrap
                    }

                    Repeater {
                        model: root.detailMode || root.archiveMode
                            ? [] : root.popoutProjection.projects

                        Column {
                            id: projectSection
                            required property var modelData

                            width: parent.width
                            spacing: Theme.spacingS

                            Item {
                                width: parent.width
                                height: Math.max(projectName.implicitHeight,
                                    projectVersion.implicitHeight, projectCollapse.height)

                                StyledText {
                                    id: projectName

                                    anchors.left: parent.left
                                    anchors.right: projectVersion.left
                                    anchors.rightMargin: Theme.spacingS
                                    text: projectSection.modelData.name
                                    font.pixelSize: Theme.fontSizeMedium
                                    font.weight: Font.DemiBold
                                    color: Theme.surfaceText
                                    wrapMode: Text.NoWrap
                                    elide: Text.ElideRight
                                }

                                StyledText {
                                    id: projectVersion

                                    anchors.right: projectCollapse.left
                                    anchors.rightMargin: Theme.spacingXS
                                    width: Math.min(implicitWidth, 120,
                                        parent.width * 0.35)
                                    text: projectSection.modelData.version
                                        ? projectSection.modelData.version
                                        : I18n.trFor("trellisDms", "Version unknown")
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.surfaceVariantText
                                    wrapMode: Text.NoWrap
                                    elide: Text.ElideRight
                                }

                                DankActionButton {
                                    id: projectCollapse

                                    anchors.right: parent.right
                                    anchors.verticalCenter: parent.verticalCenter
                                    buttonSize: 40
                                    iconSize: Theme.iconSize - 4
                                    iconName: projectSection.modelData.collapsed
                                        ? "expand_more" : "expand_less"
                                    iconColor: Theme.surfaceVariantText
                                    backgroundColor: "transparent"
                                    tooltipText: projectSection.modelData.collapsed
                                        ? I18n.trFor("trellisDms", "Expand project")
                                        : I18n.trFor("trellisDms", "Collapse project")
                                    tooltipSide: "left"
                                    onClicked: root.toggleProjectCollapsed(
                                        projectSection.modelData.id)
                                }
                            }

                            StyledText {
                                visible: projectSection.modelData.collapsed
                                width: parent.width
                                leftPadding: Theme.spacingM
                                text: I18n.trFor("trellisDms", "Project collapsed.")
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.surfaceVariantText
                            }

                            StyledText {
                                visible: projectSection.modelData.groups.length === 0
                                width: parent.width
                                leftPadding: Theme.spacingM
                                text: I18n.trFor("trellisDms", "No live tasks in this project.")
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.surfaceVariantText
                            }

                            Repeater {
                                // A collapsed project must remove the group
                                // delegates too; Repeater visibility does not
                                // hide delegates that it parents alongside
                                // itself.
                                model: projectSection.modelData.collapsed
                                    ? [] : projectSection.modelData.groups

                                Column {
                                    id: taskGroup
                                    required property var modelData

                                    width: parent.width
                                    spacing: Theme.spacingXS

                                    Item {
                                        width: parent.width
                                        height: Math.max(taskGroupLabel.implicitHeight,
                                            taskGroupCollapse.height)

                                        StyledText {
                                            id: taskGroupLabel

                                            anchors.left: parent.left
                                            anchors.right: taskGroupCollapse.left
                                            anchors.rightMargin: Theme.spacingXS
                                            anchors.verticalCenter: parent.verticalCenter
                                            leftPadding: Theme.spacingM
                                            text: root.localizedTaskGroup(taskGroup.modelData.key) + " · "
                                                + taskGroup.modelData.taskCount
                                            font.pixelSize: Theme.fontSizeSmall
                                            font.weight: Font.DemiBold
                                            color: Theme.surfaceVariantText
                                            wrapMode: Text.NoWrap
                                            elide: Text.ElideRight
                                        }

                                        DankActionButton {
                                            id: taskGroupCollapse

                                            anchors.right: parent.right
                                            anchors.verticalCenter: parent.verticalCenter
                                            buttonSize: 32
                                            iconSize: Theme.iconSize - 6
                                            iconName: taskGroup.modelData.collapsed
                                                ? "expand_more" : "expand_less"
                                            iconColor: Theme.surfaceVariantText
                                            backgroundColor: "transparent"
                                            tooltipText: taskGroup.modelData.collapsed
                                                ? I18n.trFor("trellisDms", "Expand task group")
                                                : I18n.trFor("trellisDms", "Collapse task group")
                                            tooltipSide: "left"
                                            onClicked: root.toggleTaskGroupCollapsed(
                                                projectSection.modelData.id,
                                                taskGroup.modelData.key)
                                        }
                                    }

                                    Repeater {
                                        // Repeater delegates are parented alongside the
                                        // Repeater, so hiding the Repeater itself does
                                        // not reliably hide its delegates. Use an empty
                                        // model for collapsed groups instead.
                                        model: projectSection.modelData.collapsed
                                            || taskGroup.modelData.collapsed
                                            ? [] : taskGroup.modelData.tasks

                                        Item {
                                            id: taskRow
                                            required property var modelData

                                            width: parent.width
                                            height: Math.max(48, taskDetails.implicitHeight
                                                + Theme.spacingXS * 2, taskPin.height)

                                            DankIcon {
                                                id: taskIcon

                                                anchors.left: parent.left
                                                anchors.leftMargin: Theme.spacingM
                                                anchors.verticalCenter: parent.verticalCenter
                                                name: taskRow.modelData.state === "error"
                                                    ? "error"
                                                    : (taskRow.modelData.active
                                                        ? "play_circle" : "task_alt")
                                                size: Theme.iconSize - 4
                                                color: taskRow.modelData.state === "error"
                                                    ? Theme.warning : Theme.surfaceVariantText
                                            }

                                            Column {
                                                id: taskDetails

                                                anchors.left: taskIcon.right
                                                anchors.leftMargin: Theme.spacingXS
                                                anchors.right: taskOpen.left
                                                anchors.rightMargin: Theme.spacingS
                                                anchors.verticalCenter: parent.verticalCenter
                                                spacing: Theme.spacingXXS

                                                StyledText {
                                                    width: parent.width
                                                    text: taskRow.modelData.title
                                                    font.pixelSize: Theme.fontSizeSmall
                                                    color: Theme.surfaceText
                                                    wrapMode: Text.NoWrap
                                                    elide: Text.ElideRight
                                                }

                                                StyledText {
                                                    width: parent.width
                                                    text: root.localizedTaskState(taskRow.modelData.state) + " · "
                                                        + taskRow.modelData.priority
                                                        + (taskRow.modelData.activeSessionCount > 0
                                                            ? " · "
                                                                + root.sessionCountLabel(taskRow.modelData.activeSessionCount)
                                                            : "")
                                                    font.pixelSize: Theme.fontSizeSmall
                                                    color: taskRow.modelData.state === "error"
                                                        ? Theme.warning : Theme.surfaceVariantText
                                                    wrapMode: Text.NoWrap
                                                    elide: Text.ElideRight
                                                }

                                                StyledText {
                                                    visible: taskRow.modelData.progress !== null
                                                    width: parent.width
                                                    text: I18n.trFor("trellisDms", "Progress %1%")
                                                        .arg(Math.round(taskRow.modelData.progress))
                                                    font.pixelSize: Theme.fontSizeSmall
                                                    color: Theme.surfaceVariantText
                                                    wrapMode: Text.NoWrap
                                                    elide: Text.ElideRight
                                                }

                                                StyledText {
                                                    visible: taskRow.modelData.relationText !== ""
                                                    width: parent.width
                                                    text: root.relationLabel(taskRow.modelData)
                                                    font.pixelSize: Theme.fontSizeSmall
                                                    color: Theme.surfaceVariantText
                                                    wrapMode: Text.NoWrap
                                                    elide: Text.ElideRight
                                                }
                                            }

                                            DankActionButton {
                                                id: taskOpen

                                                anchors.right: taskPin.left
                                                anchors.verticalCenter: parent.verticalCenter
                                                buttonSize: 40
                                                iconSize: Theme.iconSize - 4
                                                iconName: "description"
                                                iconColor: Theme.surfaceVariantText
                                                backgroundColor: "transparent"
                                                tooltipText: I18n.trFor("trellisDms", "Open task details")
                                                tooltipSide: "left"
                                                onClicked: root.openTaskDetail(
                                                    projectSection.modelData.id,
                                                    taskRow.modelData.id,
                                                    taskRow.modelData.title)
                                            }

                                            DankActionButton {
                                                id: taskPin

                                                anchors.right: parent.right
                                                anchors.verticalCenter: parent.verticalCenter
                                                buttonSize: 40
                                                iconSize: Theme.iconSize - 4
                                                iconName: taskRow.modelData.pinned
                                                    ? "keep_off" : "push_pin"
                                                iconColor: taskRow.modelData.pinned
                                                    ? Theme.primary : Theme.surfaceVariantText
                                                backgroundColor: "transparent"
                                                tooltipText: taskRow.modelData.pinned
                                                    ? I18n.trFor("trellisDms", "Unpin task")
                                                    : I18n.trFor("trellisDms", "Pin task")
                                                tooltipSide: "left"
                                                onClicked: root.togglePinnedTask(
                                                    projectSection.modelData.id,
                                                    taskRow.modelData.id)
                                            }
                                        }
                                    }

                                    StyledText {
                                        visible: !projectSection.modelData.collapsed
                                            && !taskGroup.modelData.collapsed
                                            && taskGroup.modelData.hiddenTaskCount > 0
                                        width: parent.width
                                        leftPadding: Theme.spacingM
                                        text: I18n.trFor("trellisDms", "%1 more in %2")
                                            .arg(taskGroup.modelData.hiddenTaskCount)
                                            .arg(root.localizedTaskGroup(taskGroup.modelData.key))
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.surfaceVariantText
                                    }
                                }
                            }

                            Rectangle {
                                width: parent.width
                                height: 1
                                color: Theme.outlineMedium
                            }
                        }
                    }

                    StyledText {
                        visible: !root.detailMode && !root.archiveMode
                            && root.popoutProjection.hiddenProjectCount > 0
                        width: parent.width
                        text: I18n.trFor("trellisDms", "%1 more projects")
                            .arg(root.popoutProjection.hiddenProjectCount)
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.surfaceVariantText
                    }
                }
            }
        }
    }
}
