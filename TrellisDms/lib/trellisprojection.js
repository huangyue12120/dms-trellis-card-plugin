.pragma library

var DISPLAY_MODES = ["auto", "task", "project", "counts", "icon", "full"];
var MAX_POPOUT_PROJECTS = 8;
var MAX_POPOUT_TASKS_PER_PROJECT = 12;
var MAX_POPOUT_WARNINGS = 8;
var MAX_DESKTOP_WARNINGS = 3;
var MAX_PROJECT_FILTER_OPTIONS = 32;
var MAX_PROJECT_FILTER_LABEL_LENGTH = 10;
var MAX_PREFERENCE_ID_LENGTH = 1024;
var MAX_PIN_TOKEN_LENGTH = 4096;
var MAX_SESSION_TIMESTAMP_LENGTH = 64;
var MAX_PROJECT_NAME_LENGTH = 160;
var MAX_TASK_TITLE_LENGTH = 240;
var MAX_TASK_STATE_LENGTH = 48;
var MAX_TASK_PRIORITY_LENGTH = 24;
var MAX_COLLAPSED_PROJECTS = 32;
var MAX_COLLAPSED_GROUPS = 128;
var MAX_COLLAPSED_TOKEN_LENGTH = 1024;
var MAX_LAUNCHER_RESULTS = 20;
var MAX_LAUNCHER_QUERY_LENGTH = 256;
var MAX_LAUNCHER_ACTION_LENGTH = 4096;
var MAX_HEALTH_INCIDENTS = 256;
var MAX_HEALTH_WARNING_CODES = 16;
var ARCHIVE_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
var TASK_GROUPS = [
    { key: "active", label: "Active" },
    { key: "in_progress", label: "In progress" },
    { key: "planning", label: "Planning" },
    { key: "error", label: "Error" },
    { key: "other", label: "Other" }
];
var DEGRADED_WARNING_CODES = [
    "last_good_snapshot",
    "process_create_failed",
    "reader_create_failed",
    "task_discovery_failed",
    "session_discovery_failed",
    "root_canonicalization",
    "project_discovery_failed",
    "root_unavailable",
    "reload_limit",
    "reload_project_missing",
    "version_reload_failed",
    "task_reload_failed",
    "session_reload_failed"
];

function _array(value) {
    return Array.isArray(value) ? value : [];
}

function _string(value, fallback) {
    if (typeof value === "string" && value.trim())
        return value.trim();
    return fallback || "";
}

function _number(value) {
    var parsed = Number(value);
    return isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function normalizeDisplayMode(value) {
    return typeof value === "string" && DISPLAY_MODES.indexOf(value) !== -1
        ? value
        : "auto";
}

function normalizeBooleanSetting(value, fallback) {
    return typeof value === "boolean" ? value : !!fallback;
}

function _normalizeStringList(value, maximum, validator) {
    if (!Array.isArray(value))
        return [];
    var normalized = [];
    for (var i = 0; i < value.length && normalized.length < maximum; i++) {
        if (typeof value[i] !== "string")
            continue;
        var item = value[i].trim();
        if (!item || item.length > MAX_COLLAPSED_TOKEN_LENGTH
                || /[\u0000-\u001f\u007f]/.test(item)
                || (validator && !validator(item))
                || normalized.indexOf(item) !== -1)
            continue;
        normalized.push(item);
    }
    return normalized;
}

function normalizeCollapsedProjectIds(value) {
    return _normalizeStringList(value, MAX_COLLAPSED_PROJECTS, null);
}

function _isTaskGroupKey(value) {
    for (var i = 0; i < TASK_GROUPS.length; i++) {
        if (TASK_GROUPS[i].key === value)
            return true;
    }
    return false;
}

function normalizeCollapsedTaskGroups(value) {
    return _normalizeStringList(value, MAX_COLLAPSED_GROUPS, function(token) {
        var separator = token.lastIndexOf("/");
        return separator > 0 && _isTaskGroupKey(token.slice(separator + 1));
    });
}

function normalizeSelectedArchiveMonth(value) {
    return typeof value === "string" && ARCHIVE_MONTH_PATTERN.test(value.trim())
        ? value.trim() : "";
}

function isVersionWarning(warning) {
    var code = warning && typeof warning.code === "string"
        ? warning.code : "";
    return code === "version_unavailable" || code === "version_path_rejected"
        || code === "version_unverified" || code === "version_invalid"
        || code === "version_reload_failed";
}

function normalizeUiState(value) {
    var state = value && typeof value === "object" && !Array.isArray(value)
        ? value : {};
    return {
        pinnedTaskId: state.pinnedTaskId,
        selectedProjectId: _preferenceId(state.selectedProjectId),
        collapsedProjectIds: normalizeCollapsedProjectIds(state.collapsedProjectIds),
        collapsedTaskGroups: normalizeCollapsedTaskGroups(state.collapsedTaskGroups),
        selectedArchiveMonth: normalizeSelectedArchiveMonth(state.selectedArchiveMonth),
        showProgress: normalizeBooleanSetting(state.showProgress, true),
        versionWarning: normalizeBooleanSetting(state.versionWarning, true)
    };
}

function _visibleWarnings(warnings, showVersionWarnings) {
    var source = _array(warnings);
    var visible = [];
    for (var i = 0; i < source.length; i++) {
        if (showVersionWarnings || !isVersionWarning(source[i]))
            visible.push(source[i]);
    }
    return visible;
}

function _preferenceId(value) {
    if (typeof value !== "string")
        return "";
    var normalized = value.trim();
    return normalized && normalized.length <= MAX_PREFERENCE_ID_LENGTH
        ? normalized : "";
}

function _hasPreferenceValue(value) {
    return value !== undefined && value !== null && value !== "";
}

function makePinnedTaskToken(projectId, taskId) {
    var normalizedProjectId = _preferenceId(projectId);
    var normalizedTaskId = _preferenceId(taskId);
    if (!normalizedProjectId || !normalizedTaskId)
        return "";
    return JSON.stringify([normalizedProjectId, normalizedTaskId]);
}

function parsePinnedTaskToken(value) {
    if (typeof value !== "string" || !value || value.length > MAX_PIN_TOKEN_LENGTH)
        return null;
    var decoded;
    try {
        decoded = JSON.parse(value);
    } catch (error) {
        return null;
    }
    if (!Array.isArray(decoded) || decoded.length !== 2)
        return null;
    var projectId = _preferenceId(decoded[0]);
    var taskId = _preferenceId(decoded[1]);
    return projectId && taskId ? { projectId: projectId, taskId: taskId } : null;
}

function _timestampMillis(value) {
    if (typeof value !== "string")
        return null;
    var timestamp = value.trim();
    if (!timestamp || timestamp.length > MAX_SESSION_TIMESTAMP_LENGTH)
        return null;
    var millis = Date.parse(timestamp);
    return isFinite(millis) ? millis : null;
}

function isNewerGeneratedAt(candidate, baseline) {
    var candidateMillis = _timestampMillis(candidate);
    if (candidateMillis === null)
        return false;
    var normalizedBaseline = _string(baseline);
    if (!normalizedBaseline)
        return true;
    var baselineMillis = _timestampMillis(normalizedBaseline);
    return baselineMillis !== null && candidateMillis > baselineMillis;
}

function _findProject(projects, projectId) {
    for (var i = 0; i < projects.length; i++) {
        if (_string(projects[i] && projects[i].id) === projectId)
            return projects[i];
    }
    return null;
}

function _findTask(project, taskId) {
    var tasks = _array(project && project.tasks);
    for (var i = 0; i < tasks.length; i++) {
        if (_string(tasks[i] && tasks[i].id) === taskId)
            return tasks[i];
    }
    return null;
}

function _taskSessionRecency(project, taskId) {
    var sessions = _array(project && project.sessions);
    var found = false;
    var latest = null;
    for (var i = 0; i < sessions.length; i++) {
        var session = sessions[i] || {};
        if (session.stale || _string(session.error))
            continue;
        if (_string(session.taskId) !== taskId)
            continue;
        found = true;
        var millis = _timestampMillis(session.lastSeenAt);
        if (millis !== null && (latest === null || millis > latest))
            latest = millis;
    }
    return { found: found, millis: latest };
}

function _latestTaskSessionMillis(project, taskId) {
    return _taskSessionRecency(project, taskId).millis;
}

function _firstActiveTask(project) {
    var tasks = _array(project && project.tasks);
    var selected = null;
    var selectedMillis = null;
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i] || {};
        if (task.runtimeState !== "active")
            continue;
        var millis = _latestTaskSessionMillis(project, _string(task.id));
        if (!selected || (millis !== null
                && (selectedMillis === null || millis > selectedMillis))) {
            selected = task;
            selectedMillis = millis;
        }
    }
    return selected;
}

function _currentProject(snapshot, projects, selectedProject) {
    if (selectedProject)
        return selectedProject;
    var snapshotProjectId = _preferenceId(snapshot && snapshot.primaryProjectId);
    var snapshotProject = snapshotProjectId
        ? _findProject(projects, snapshotProjectId) : null;
    if (snapshotProject)
        return snapshotProject;
    for (var i = 0; i < projects.length; i++) {
        if (_firstActiveTask(projects[i]))
            return projects[i];
    }
    return projects.length ? projects[0] : null;
}

function _recentSessionTask(projects) {
    var selectedProject = null;
    var selectedTask = null;
    var selectedMillis = null;
    for (var i = 0; i < projects.length; i++) {
        var project = projects[i] || {};
        var tasks = _array(project.tasks);
        for (var j = 0; j < tasks.length; j++) {
            var task = tasks[j] || {};
            var recency = _taskSessionRecency(project, _string(task.id));
            if (!recency.found)
                continue;
            if (!selectedTask || (recency.millis !== null
                    && (selectedMillis === null || recency.millis > selectedMillis))) {
                selectedProject = project;
                selectedTask = task;
                selectedMillis = recency.millis;
            }
        }
    }
    return selectedTask ? { project: selectedProject, task: selectedTask } : null;
}

function selectPrimary(snapshot, uiState) {
    var facts = _snapshotFacts(snapshot);
    var state = uiState && typeof uiState === "object" && !Array.isArray(uiState)
        ? uiState : {};
    var rawSelectedProjectId = state.selectedProjectId;
    var selectedProjectId = _preferenceId(rawSelectedProjectId);
    var invalidSelectedProject = _hasPreferenceValue(rawSelectedProjectId)
        && !selectedProjectId;
    var selectedProject = facts.ready && selectedProjectId
        ? _findProject(facts.projects, selectedProjectId) : null;
    if (facts.ready && selectedProjectId && !selectedProject)
        invalidSelectedProject = true;

    var rawPinnedTaskId = state.pinnedTaskId;
    var pin = parsePinnedTaskToken(rawPinnedTaskId);
    var invalidPinnedTask = _hasPreferenceValue(rawPinnedTaskId) && !pin;
    var pinnedProject = facts.ready && pin
        ? _findProject(facts.projects, pin.projectId) : null;
    var pinnedTask = pinnedProject && pin
        ? _findTask(pinnedProject, pin.taskId) : null;
    if (facts.ready && pin && !pinnedTask)
        invalidPinnedTask = true;

    if (pinnedTask) {
        return {
            projectId: _string(pinnedProject.id),
            taskId: _string(pinnedTask.id),
            reason: "pinned",
            invalidPinnedTask: invalidPinnedTask,
            invalidSelectedProject: invalidSelectedProject
        };
    }

    var currentProject = facts.ready
        ? _currentProject(snapshot, facts.projects, selectedProject) : null;
    var activeTask = _firstActiveTask(currentProject);
    if (activeTask) {
        return {
            projectId: _string(currentProject.id),
            taskId: _string(activeTask.id),
            reason: "active",
            invalidPinnedTask: invalidPinnedTask,
            invalidSelectedProject: invalidSelectedProject
        };
    }

    var recent = facts.ready ? _recentSessionTask(facts.projects) : null;
    if (recent) {
        return {
            projectId: _string(recent.project.id),
            taskId: _string(recent.task.id),
            reason: "recent_session",
            invalidPinnedTask: invalidPinnedTask,
            invalidSelectedProject: invalidSelectedProject
        };
    }

    return {
        projectId: currentProject ? _string(currentProject.id) : null,
        taskId: null,
        reason: currentProject ? "project" : "no_project",
        invalidPinnedTask: invalidPinnedTask,
        invalidSelectedProject: invalidSelectedProject
    };
}

function _snapshotFacts(snapshot) {
    var ready = !!snapshot && (snapshot.schemaVersion === 1
        || snapshot.schemaVersion === 2)
        && Array.isArray(snapshot.projects) && Array.isArray(snapshot.warnings);
    var projects = ready ? snapshot.projects : [];
    var warnings = ready ? snapshot.warnings : [];
    var taskCount = 0;
    var activeTasks = [];

    for (var i = 0; i < projects.length; i++) {
        var project = projects[i] || {};
        var tasks = _array(project.tasks);
        taskCount += tasks.length;
        for (var j = 0; j < tasks.length; j++) {
            var task = tasks[j] || {};
            if (task.runtimeState === "active") {
                activeTasks.push({
                    projectId: _string(project.id),
                    taskId: _string(task.id),
                    title: _string(task.title, "unknown")
                });
            }
        }
    }

    return {
        ready: ready,
        projects: projects,
        warnings: warnings,
        projectCount: projects.length,
        taskCount: taskCount,
        warningCount: warnings.length,
        activeTasks: activeTasks
    };
}

function _healthText(value, fallback, maximum) {
    var text = typeof value === "string" ? value : "";
    text = text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
    if (!text)
        text = fallback || "";
    if (text.length > maximum)
        text = text.slice(0, Math.max(0, maximum - 1)) + "…";
    return text;
}

function _healthProjectIndex(projects, projectId, rootPath) {
    for (var i = 0; i < projects.length; i++) {
        var project = projects[i] || {};
        if (projectId && (project.id === projectId || project.root === projectId))
            return i;
    }
    if (rootPath) {
        for (var j = 0; j < projects.length; j++) {
            var candidate = _string(projects[j] && projects[j].root);
            if (candidate && candidate === rootPath)
                return j;
        }
    }
    return -1;
}

function _healthWarningDescriptor(code, requestedScope) {
    var source = typeof code === "string" ? code : "";
    var descriptor = {
        category: "other",
        rootCause: source || "unknown_warning",
        scope: requestedScope || "project",
        severity: "warning",
        title: "Additional diagnostic",
        impact: "A diagnostic was reported.",
        fallbackBehavior: "Current task and session facts remain available."
    };
    if (source === "last_good_snapshot" || source === "root_empty")
        return null;
    if (source === "task_discovery_failed") {
        descriptor.category = "discovery";
        descriptor.rootCause = "task_discovery";
        descriptor.severity = "degraded";
        descriptor.title = "Live task discovery failed";
        descriptor.impact = "Some live task records may be missing.";
        descriptor.fallbackBehavior = "Previously published task facts are retained when available.";
    } else if (source === "session_discovery_failed") {
        descriptor.category = "discovery";
        descriptor.rootCause = "session_discovery";
        descriptor.severity = "degraded";
        descriptor.title = "Session discovery failed";
        descriptor.impact = "Some active session pointers may be missing.";
        descriptor.fallbackBehavior = "Previously published session facts are retained when available.";
    } else if (["root_unavailable", "root_canonicalization", "project_discovery_failed",
                "project_path_invalid", "project_outside_root", "malformed_discovery_line"].indexOf(source) !== -1) {
        descriptor.category = "discovery";
        descriptor.rootCause = "root_discovery";
        descriptor.scope = "root";
        descriptor.severity = "degraded";
        descriptor.title = "Project discovery failed";
        descriptor.impact = "Projects under a configured root may be missing.";
        descriptor.fallbackBehavior = "The previous complete Snapshot is retained when available.";
    } else if (["task_read_failed", "task_data_invalid", "task_reload_failed",
                "task_json_unavailable", "task_json_rejected", "task_path_invalid",
                "task_path_rejected"].indexOf(source) !== -1) {
        descriptor.category = "live_read";
        descriptor.rootCause = "task_input";
        descriptor.scope = "project";
        descriptor.severity = "degraded";
        descriptor.title = "Live task data is incomplete";
        descriptor.impact = "One or more live task records could not be used.";
        descriptor.fallbackBehavior = "Readable task records remain available; failed reads are reported.";
    } else if (["session_read_failed", "session_data_invalid", "malformed_pointer",
                "stale_pointer", "session_reload_failed", "session_path_invalid",
                "session_path_rejected", "task_not_loaded"].indexOf(source) !== -1) {
        descriptor.category = "live_read";
        descriptor.rootCause = "session_input";
        descriptor.scope = "project";
        descriptor.severity = "degraded";
        descriptor.title = "Session data is incomplete";
        descriptor.impact = "One or more session pointers could not be used.";
        descriptor.fallbackBehavior = "Readable task and session facts remain available.";
    } else if (["malformed_json", "size_limit"].indexOf(source) !== -1) {
        descriptor.category = "malformed_data";
        descriptor.rootCause = source;
        descriptor.scope = "project";
        descriptor.severity = "degraded";
        descriptor.title = "Trellis data could not be parsed";
        descriptor.impact = "One or more source records could not be used.";
        descriptor.fallbackBehavior = "Other readable task and session facts remain available.";
    } else if (source.indexOf("archive_") === 0) {
        descriptor.category = "archive_read";
        descriptor.rootCause = "archive_input";
        descriptor.scope = "archive";
        descriptor.severity = "degraded";
        descriptor.title = "Archive data is unavailable";
        descriptor.impact = "Historical archive facts may be incomplete.";
        descriptor.fallbackBehavior = "Live task and session facts remain available.";
    } else if (["project_limit", "scan_root_limit", "watcher_limit", "reload_limit",
                "archive_limit", "command_output_limit", "discovery_limit",
                "task_limit", "session_limit"].indexOf(source) !== -1) {
        descriptor.category = "discovery_limit";
        descriptor.rootCause = source;
        descriptor.severity = "degraded";
        descriptor.title = "A discovery limit was reached";
        descriptor.impact = "Some records or roots may be omitted.";
        descriptor.fallbackBehavior = "The published data remains bounded and readable.";
        if (source === "archive_limit") {
            descriptor.scope = "archive";
            descriptor.fallbackBehavior = "Live task and session facts remain available.";
        } else if (source === "project_limit" || source === "scan_root_limit") {
            descriptor.scope = "root";
        }
    } else if (["process_create_failed", "reader_create_failed",
                "reload_project_missing"].indexOf(source) !== -1) {
        descriptor.category = "discovery";
        descriptor.rootCause = source;
        descriptor.scope = requestedScope || "root";
        descriptor.severity = "degraded";
        descriptor.title = "A discovery or reload operation failed";
        descriptor.impact = "Some source facts may not reflect the latest scan.";
        descriptor.fallbackBehavior = "Previously published facts remain visible when available.";
    } else if (source.indexOf("version_") === 0) {
        descriptor.category = "compatibility";
        descriptor.rootCause = "version_compatibility";
        descriptor.scope = "project";
        descriptor.title = "Trellis version could not be verified";
        descriptor.impact = "Compatibility could not be confirmed.";
        descriptor.fallbackBehavior = "Readable live task and session facts remain available.";
    } else if (source === "no_projects_found" || source === "topology_interval") {
        descriptor.category = "configuration";
        descriptor.rootCause = source;
        descriptor.severity = "warning";
        descriptor.title = source === "no_projects_found"
            ? "No projects were discovered" : "Scan interval was adjusted";
        descriptor.impact = source === "no_projects_found"
            ? "No Trellis project was found under the configured root." : "The configured scan interval was outside the supported range.";
    }
    return descriptor;
}

function _healthTimestamp(value) {
    if (value === "")
        return "";
    if (typeof value !== "string" || value.length > MAX_SESSION_TIMESTAMP_LENGTH
            || !isFinite(Date.parse(value)))
        return null;
    return value;
}

function _hasWarningCode(warnings, code) {
    var source = _array(warnings);
    for (var i = 0; i < source.length; i++) {
        if (source[i] && source[i].code === code)
            return true;
    }
    return false;
}

function makeHealthProjection(snapshot, detailResponse) {
    var facts = _snapshotFacts(snapshot);
    var sourceProjects = facts.projects;
    var runtime = facts.ready && snapshot.schemaVersion === 2
        && snapshot.runtime && typeof snapshot.runtime === "object"
        ? snapshot.runtime : null;
    var scanStartedAt = runtime ? _healthTimestamp(runtime.scanStartedAt) : null;
    var lastSuccessfulDiscoveryAt = runtime
        ? _healthTimestamp(runtime.lastSuccessfulDiscoveryAt) : null;
    var runtimeAvailable = !!runtime && scanStartedAt !== null
        && lastSuccessfulDiscoveryAt !== null
        && typeof runtime.snapshotIsCurrent === "boolean"
        && typeof runtime.lastGoodFallbackActive === "boolean";
    var fallbackFromWarning = facts.ready
        && _hasWarningCode(facts.warnings, "last_good_snapshot");
    var fallbackActive = runtimeAvailable
        ? runtime.lastGoodFallbackActive : fallbackFromWarning;
    var freshness = {
        available: runtimeAvailable,
        scanStartedAt: runtimeAvailable ? scanStartedAt : "",
        lastSuccessfulDiscoveryAt: runtimeAvailable ? lastSuccessfulDiscoveryAt : "",
        snapshotIsCurrent: runtimeAvailable ? runtime.snapshotIsCurrent : null,
        lastGoodFallbackActive: runtimeAvailable ? runtime.lastGoodFallbackActive
            : (fallbackFromWarning ? true : null)
    };
    var groups = [];
    var rawWarningCount = facts.warnings.length;
    var rawErrorCount = 0;

    function addWarning(warning, detailProjectId, detailScope) {
        if (!warning || typeof warning !== "object")
            return;
        var code = _healthText(warning.code, "unknown_warning", 64);
        var descriptor = _healthWarningDescriptor(code, detailScope || warning.scope);
        if (!descriptor)
            return;
        var projectId = _string(detailProjectId) || _string(warning.projectId);
        var rootPath = _string(warning.root);
        var projectIndex = _healthProjectIndex(sourceProjects, projectId, rootPath);
        var scope = descriptor.scope;
        if (projectIndex >= 0 && ["process_create_failed", "reader_create_failed",
                "watcher_limit", "watcher_create_failed", "reload_limit"].indexOf(code) !== -1)
            scope = "project";
        if (scope === "project" && projectIndex < 0 && rootPath)
            scope = "root";
        else if (scope === "project" && projectIndex < 0)
            scope = "snapshot";
        var identity = scope === "root" && rootPath
            ? "root:" + rootPath
            : (projectIndex >= 0
            ? "project:" + _string(sourceProjects[projectIndex].id || sourceProjects[projectIndex].root)
            : (rootPath ? "root:" + rootPath : "snapshot"));
        var groupKey = identity + "|" + scope + "|" + descriptor.rootCause;
        var group = null;
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].groupKey === groupKey) {
                group = groups[i];
                break;
            }
        }
        if (!group) {
            if (groups.length >= MAX_HEALTH_INCIDENTS)
                return;
            var projectName = projectIndex >= 0
                ? _healthText(sourceProjects[projectIndex].name, "Project", MAX_PROJECT_NAME_LENGTH)
                : (scope === "root" ? "Configured root" : "Snapshot");
            group = {
                groupKey: groupKey,
                rootPath: rootPath,
                projectIndex: projectIndex,
                projectName: projectName,
                category: descriptor.category,
                rootCause: descriptor.rootCause,
                scope: scope,
                severity: descriptor.severity,
                title: descriptor.title,
                impact: descriptor.impact,
                fallbackBehavior: descriptor.fallbackBehavior,
                warningCodes: [],
                count: 0
            };
            groups.push(group);
        }
        group.count += 1;
        if (group.warningCodes.indexOf(code) === -1
                && group.warningCodes.length < MAX_HEALTH_WARNING_CODES)
            group.warningCodes.push(code);
    }

    for (var p = 0; p < sourceProjects.length; p++) {
        var sourceProject = sourceProjects[p] || {};
        var projectErrors = _array(sourceProject.errors);
        rawErrorCount += projectErrors.length;
        for (var pe = 0; pe < projectErrors.length; pe++)
            addWarning(projectErrors[pe], sourceProject.id, "project");
        var tasks = _array(sourceProject.tasks);
        for (var t = 0; t < tasks.length; t++) {
            var taskErrors = _array(tasks[t] && tasks[t].errors);
            rawErrorCount += taskErrors.length;
        }
        var sessions = _array(sourceProject.sessions);
        for (var s = 0; s < sessions.length; s++) {
            if (sessions[s] && sessions[s].error)
                rawErrorCount += 1;
        }
    }
    for (var w = 0; w < facts.warnings.length; w++)
        addWarning(facts.warnings[w]);

    var archiveKinds = ["archive-index", "archive-page", "archive-task"];
    if (detailResponse && typeof detailResponse === "object"
            && archiveKinds.indexOf(detailResponse.kind) !== -1) {
        var detailWarnings = _array(detailResponse.warnings);
        rawWarningCount += detailWarnings.length;
        if (detailResponse.status === "error" && !detailWarnings.length) {
            addWarning({ code: "archive_detail_failed", scope: "archive" },
                detailResponse.projectId, "archive");
            rawWarningCount += 1;
        } else {
            for (var dw = 0; dw < detailWarnings.length; dw++) {
                var detailWarning = detailWarnings[dw] || {};
                addWarning({ code: detailWarning.code, scope: "archive" },
                    detailResponse.projectId, "archive");
            }
        }
    }

    var projectHealth = [];
    for (var ph = 0; ph < sourceProjects.length; ph++) {
        var project = sourceProjects[ph] || {};
        projectHealth.push({
            projectIndex: ph,
            name: _healthText(project.name, "Project", MAX_PROJECT_NAME_LENGTH),
            status: "healthy",
            incidentCount: 0,
            archiveIncidentCount: 0,
            lastSuccessfulReadAt: _healthTimestamp(project.lastSuccessfulReadAt) || ""
        });
    }
    var incidents = [];
    for (var g = 0; g < groups.length; g++) {
        var current = groups[g];
        var incident = {
            id: "incident-" + (g + 1),
            projectIndex: current.projectIndex >= 0 ? current.projectIndex : null,
            projectName: current.projectName,
            scope: current.scope,
            category: current.category,
            rootCause: current.rootCause,
            severity: current.severity,
            title: current.title,
            impact: current.impact,
            fallbackBehavior: current.fallbackBehavior,
            warningCodes: current.warningCodes.slice(),
            count: current.count
        };
        incidents.push(incident);
        if (current.projectIndex >= 0) {
            var health = projectHealth[current.projectIndex];
            health.incidentCount += 1;
            if (current.scope === "archive")
                health.archiveIncidentCount += 1;
            if (current.severity === "degraded" && current.scope !== "archive")
                health.status = "degraded";
            else if (health.status === "healthy")
                health.status = "warning";
        } else if (current.scope === "root" && current.rootPath) {
            for (var rp = 0; rp < sourceProjects.length; rp++) {
                var projectRoot = _string(sourceProjects[rp] && sourceProjects[rp].root);
                var rootPrefix = current.rootPath.replace(/[\\/]$/, "") + "/";
                if (projectRoot && (projectRoot === current.rootPath
                        || projectRoot.indexOf(rootPrefix) === 0)) {
                    projectHealth[rp].incidentCount += 1;
                    projectHealth[rp].status = "degraded";
                }
            }
        }
    }

    var rawWarningCodes = [];
    for (var rw = 0; rw < facts.warnings.length; rw++) {
        var rawCode = _healthText(facts.warnings[rw] && facts.warnings[rw].code,
            "unknown_warning", 64);
        if (rawWarningCodes.indexOf(rawCode) === -1 && rawWarningCodes.length < MAX_HEALTH_WARNING_CODES)
            rawWarningCodes.push(rawCode);
    }
    if (detailResponse && typeof detailResponse === "object"
            && archiveKinds.indexOf(detailResponse.kind) !== -1) {
        var detailCodeWarnings = _array(detailResponse.warnings);
        for (var dc = 0; dc < detailCodeWarnings.length; dc++) {
            var detailCode = _healthText(detailCodeWarnings[dc] && detailCodeWarnings[dc].code,
                "unknown_warning", 64);
            if (rawWarningCodes.indexOf(detailCode) === -1
                    && rawWarningCodes.length < MAX_HEALTH_WARNING_CODES)
                rawWarningCodes.push(detailCode);
        }
    }
    return {
        ready: facts.ready,
        freshness: freshness,
        fallbackActive: fallbackActive,
        fallbackMessage: fallbackActive
            ? "Showing the last complete Snapshot; discovery is still degraded." : "",
        projectCount: sourceProjects.length,
        projects: projectHealth,
        incidents: incidents,
        incidentCount: incidents.length,
        rawWarningCount: rawWarningCount,
        rawErrorCount: rawErrorCount,
        rawWarningCodes: rawWarningCodes
    };
}

function _countSentence(projectCount, taskCount, warningCount) {
    return projectCount + " project" + (projectCount === 1 ? "" : "s")
        + " · " + taskCount + " task" + (taskCount === 1 ? "" : "s")
        + " · " + warningCount + " warning" + (warningCount === 1 ? "" : "s");
}

function makePillProjection(snapshot, configuredMode, uiState) {
    var facts = _snapshotFacts(snapshot);
    var state = normalizeUiState(uiState);
    var visibleWarnings = _visibleWarnings(facts.warnings, state.versionWarning);
    var primary = selectPrimary(snapshot, state);
    var primaryProject = primary.projectId
        ? _findProject(facts.projects, primary.projectId) : null;
    var primaryTask = primaryProject && primary.taskId
        ? _findTask(primaryProject, primary.taskId) : null;
    var primaryIsActive = !!primaryTask && primaryTask.runtimeState === "active";
    var additionalActiveCount = Math.max(0,
        facts.activeTasks.length - (primaryIsActive ? 1 : 0));
    var mode = normalizeDisplayMode(configuredMode);
    var kind = "icon";
    var label = "";
    var extraCount = 0;
    var iconName = "account_tree";

    if (facts.ready) {
        if (mode === "auto") {
            if (primaryTask && (primary.reason === "pinned"
                    || facts.activeTasks.length === 1)) {
                kind = "label";
                label = _string(primaryTask.title, "unknown");
                extraCount = additionalActiveCount;
                iconName = "task_alt";
            } else {
                kind = "counts";
            }
        } else if (mode === "task") {
            kind = "label";
            label = primaryTask ? _string(primaryTask.title, "unknown") : "No active task";
            extraCount = additionalActiveCount;
            iconName = "task_alt";
        } else if (mode === "project") {
            kind = "label";
            label = primaryProject
                ? _string(primaryProject.name, "unknown")
                : "No project";
            extraCount = Math.max(0, facts.projectCount - 1);
        } else if (mode === "counts") {
            kind = "counts";
        } else if (mode === "full") {
            kind = "full";
            label = _countSentence(facts.projectCount, facts.taskCount,
                visibleWarnings.length);
        }
    }

    return {
        ready: facts.ready,
        mode: mode,
        kind: kind,
        label: label,
        extraCount: extraCount,
        iconName: iconName,
        projectCount: facts.projectCount,
        taskCount: facts.taskCount,
        warningCount: visibleWarnings.length,
        activeTaskCount: facts.activeTasks.length,
        primaryProjectId: primary.projectId,
        primaryTaskId: primary.taskId,
        primaryReason: primary.reason,
        invalidPinnedTask: primary.invalidPinnedTask,
        invalidSelectedProject: primary.invalidSelectedProject
    };
}

function _taskGroup(task) {
    task = task || {};
    var runtimeState = _string(task.runtimeState, "inactive");
    var state = _string(task.displayState,
        _string(task.storedStatus, "unknown"));
    if (runtimeState === "active")
        return "active";
    if (runtimeState === "error")
        return "error";
    if (state === "in_progress")
        return "in_progress";
    if (state === "planning")
        return "planning";
    if (state === "error")
        return "error";
    return "other";
}

function _taskMap(tasks) {
    var map = {};
    for (var i = 0; i < tasks.length; i++) {
        var taskId = _string(tasks[i] && tasks[i].id);
        if (taskId && !map[taskId])
            map[taskId] = tasks[i];
    }
    return map;
}

function _relationText(parentTitle, childCount) {
    var parts = [];
    if (parentTitle)
        parts.push("Parent: " + parentTitle);
    if (childCount > 0)
        parts.push(childCount + " child" + (childCount === 1 ? "" : "ren"));
    return parts.join(" · ");
}

function _taskView(task, projectId, taskMap, pin, showProgress) {
    task = task || {};
    var runtimeState = _string(task.runtimeState, "inactive");
    var state = runtimeState === "error"
        ? "error"
        : _string(task.displayState,
            _string(task.storedStatus, "unknown")).slice(0, MAX_TASK_STATE_LENGTH);
    var parentId = _string(task.parentId);
    var parentTask = parentId ? taskMap[parentId] : null;
    var parentTitle = parentTask
        ? _string(parentTask.title, "unknown").slice(0, MAX_TASK_TITLE_LENGTH)
        : "";
    var childCount = _array(task.childIds).length;
    var taskId = _string(task.id, "unknown");
    var progress = typeof task.progress === "number" && isFinite(task.progress)
        ? Math.max(0, Math.min(100, task.progress)) : null;
    return {
        id: taskId,
        title: _string(task.title, "unknown").slice(0, MAX_TASK_TITLE_LENGTH),
        state: state,
        group: _taskGroup(task),
        priority: _string(task.priority, "P2").slice(0, MAX_TASK_PRIORITY_LENGTH),
        parentId: parentId || null,
        parentTitle: parentTitle || null,
        childCount: childCount,
        relationText: _relationText(parentTitle, childCount),
        activeSessionCount: _number(task.activeSessionCount),
        progress: showProgress ? progress : null,
        active: runtimeState === "active",
        pinned: !!pin && pin.projectId === projectId && pin.taskId === taskId
    };
}

function _projectView(project, taskLimit, pin, state) {
    project = project || {};
    var tasks = _array(project.tasks);
    var taskMap = _taskMap(tasks);
    var projectId = _string(project.id, "unknown");
    var buckets = {
        active: [],
        in_progress: [],
        planning: [],
        error: [],
        other: []
    };
    for (var i = 0; i < tasks.length; i++) {
        var view = _taskView(tasks[i], projectId, taskMap, pin, state.showProgress);
        buckets[view.group].push(view);
    }

    var groups = [];
    var ordered = [];
    var remaining = taskLimit;
    for (var g = 0; g < TASK_GROUPS.length; g++) {
        var descriptor = TASK_GROUPS[g];
        var groupTasks = buckets[descriptor.key];
        if (!groupTasks.length)
            continue;
        var visibleCount = Math.min(groupTasks.length, remaining);
        var visibleTasks = groupTasks.slice(0, visibleCount);
        ordered = ordered.concat(visibleTasks);
        remaining -= visibleCount;
        groups.push({
            key: descriptor.key,
            label: descriptor.label,
            tasks: visibleTasks,
            taskCount: groupTasks.length,
            hiddenTaskCount: groupTasks.length - visibleCount,
            collapsed: state.collapsedTaskGroups.indexOf(
                projectId + "/" + descriptor.key) !== -1
        });
    }

    return {
        id: projectId,
        name: _string(project.name, "unknown").slice(0, MAX_PROJECT_NAME_LENGTH),
        version: _string(project.trellisVersion).slice(0, 32),
        tasks: ordered,
        groups: groups,
        hiddenTaskCount: Math.max(0, tasks.length - ordered.length),
        collapsed: state.collapsedProjectIds.indexOf(projectId) !== -1
    };
}

function _projectOptions(projects, selectedProject) {
    var candidates = projects.slice(0, MAX_PROJECT_FILTER_OPTIONS);
    if (selectedProject) {
        var selectedIncluded = false;
        for (var i = 0; i < candidates.length; i++) {
            if (_string(candidates[i] && candidates[i].id)
                    === _string(selectedProject.id)) {
                selectedIncluded = true;
                break;
            }
        }
        if (!selectedIncluded) {
            if (candidates.length >= MAX_PROJECT_FILTER_OPTIONS)
                candidates.pop();
            candidates.push(selectedProject);
        }
    }

    var options = [];
    for (var p = 0; p < candidates.length; p++) {
        var project = candidates[p] || {};
        var name = _string(project.name, "unknown").slice(0, MAX_PROJECT_NAME_LENGTH);
        options.push({
            id: _string(project.id),
            name: name,
            label: name.length > MAX_PROJECT_FILTER_LABEL_LENGTH
                ? name.slice(0, MAX_PROJECT_FILTER_LABEL_LENGTH - 1) + "…"
                : name,
            selected: !!selectedProject
                && _string(project.id) === _string(selectedProject.id)
        });
    }
    return options;
}

function makePopoutProjection(snapshot, limits, uiState) {
    var facts = _snapshotFacts(snapshot);
    limits = limits || {};
    var projectLimit = _number(limits.projects) || MAX_POPOUT_PROJECTS;
    var taskLimit = _number(limits.tasksPerProject) || MAX_POPOUT_TASKS_PER_PROJECT;
    var warningLimit = _number(limits.warnings) || MAX_POPOUT_WARNINGS;
    var state = normalizeUiState(uiState);
    var primary = selectPrimary(snapshot, state);
    var selectedProjectId = _preferenceId(state.selectedProjectId);
    var selectedProject = facts.ready && selectedProjectId
        ? _findProject(facts.projects, selectedProjectId) : null;
    var sourceProjects = selectedProject ? [selectedProject] : facts.projects;
    var pin = parsePinnedTaskToken(state.pinnedTaskId);
    var pinnedProject = facts.ready && pin
        ? _findProject(facts.projects, pin.projectId) : null;
    var validPin = pinnedProject && pin && _findTask(pinnedProject, pin.taskId)
        ? pin : null;
    var projects = [];

    for (var i = 0; i < Math.min(sourceProjects.length, projectLimit); i++)
        projects.push(_projectView(sourceProjects[i], taskLimit, validPin, state));
    
    var warnings = [];
    var visibleWarnings = _visibleWarnings(facts.warnings, state.versionWarning);
    for (var w = 0; w < Math.min(visibleWarnings.length, warningLimit); w++) {
        var warning = visibleWarnings[w] || {};
        warnings.push({
            code: _string(warning.code, "warning").slice(0, 48),
            message: _string(warning.message, "Warning").slice(0, 240)
        });
    }

    var unconfigured = false;
    var degraded = false;
    for (var c = 0; c < facts.warnings.length; c++) {
        if (facts.warnings[c] && facts.warnings[c].code === "root_empty")
            unconfigured = true;
        if (facts.warnings[c]
                && DEGRADED_WARNING_CODES.indexOf(facts.warnings[c].code) !== -1)
            degraded = true;
    }

    return {
        ready: facts.ready,
        generatedAt: facts.ready ? _string(snapshot.generatedAt) : "",
        degraded: degraded,
        projectCount: facts.projectCount,
        taskCount: facts.taskCount,
        warningCount: visibleWarnings.length,
        unconfigured: unconfigured,
        projects: projects,
        projectOptions: _projectOptions(facts.projects, selectedProject),
        hiddenProjectOptionCount: Math.max(0,
            facts.projectCount - MAX_PROJECT_FILTER_OPTIONS),
        selectedProjectId: selectedProject ? _string(selectedProject.id) : "",
        invalidPinnedTask: primary.invalidPinnedTask,
        invalidSelectedProject: primary.invalidSelectedProject,
        hiddenProjectCount: Math.max(0, sourceProjects.length - projectLimit),
        warnings: warnings,
        hiddenWarningCount: Math.max(0, visibleWarnings.length - warningLimit)
    };
}

function makeDesktopProjection(snapshot, uiState) {
    var facts = _snapshotFacts(snapshot);
    var state = normalizeUiState(uiState);
    var projects = [];

    for (var i = 0; i < facts.projects.length; i++) {
        var sourceProject = facts.projects[i] || {};
        var sourceTasks = _array(sourceProject.tasks);
        var activeTasks = [];
        for (var t = 0; t < sourceTasks.length; t++) {
            var sourceTask = sourceTasks[t] || {};
            if (sourceTask.runtimeState !== "active")
                continue;
            activeTasks.push({
                id: _string(sourceTask.id),
                title: _string(sourceTask.title, "unknown").slice(0, MAX_TASK_TITLE_LENGTH),
                activeSessionCount: _number(sourceTask.activeSessionCount)
            });
        }
        projects.push({
            id: _string(sourceProject.id),
            name: _string(sourceProject.name, "unknown").slice(0, MAX_PROJECT_NAME_LENGTH),
            taskCount: sourceTasks.length,
            activeTaskCount: activeTasks.length,
            activeTasks: activeTasks
        });
    }

    var unconfigured = false;
    var degraded = false;
    var degradedWarningIndex = -1;
    for (var c = 0; c < facts.warnings.length; c++) {
        var sourceWarning = facts.warnings[c] || {};
        if (sourceWarning.code === "root_empty")
            unconfigured = true;
        if (DEGRADED_WARNING_CODES.indexOf(sourceWarning.code) !== -1) {
            degraded = true;
        }
    }

    var visibleWarnings = _visibleWarnings(facts.warnings, state.versionWarning);
    for (var d = 0; d < visibleWarnings.length; d++) {
        if (DEGRADED_WARNING_CODES.indexOf(
                (visibleWarnings[d] || {}).code) !== -1) {
            degradedWarningIndex = d;
            break;
        }
    }

    var warnings = [];
    if (degradedWarningIndex !== -1) {
        var degradedWarning = visibleWarnings[degradedWarningIndex] || {};
        warnings.push({
            code: _string(degradedWarning.code, "warning").slice(0, 48),
            message: _string(degradedWarning.message, "Warning").slice(0, 240)
        });
    }
    for (var w = 0; w < visibleWarnings.length
            && warnings.length < MAX_DESKTOP_WARNINGS; w++) {
        if (w === degradedWarningIndex)
            continue;
        var warning = visibleWarnings[w] || {};
        warnings.push({
            code: _string(warning.code, "warning").slice(0, 48),
            message: _string(warning.message, "Warning").slice(0, 240)
        });
    }

    return {
        ready: facts.ready,
        projectCount: facts.projectCount,
        unconfigured: unconfigured,
        degraded: degraded,
        projects: projects,
        warningCount: visibleWarnings.length,
        warnings: warnings,
        hiddenWarningCount: Math.max(0, visibleWarnings.length - warnings.length)
    };
}

function _launcherText(value, fallback, maximum) {
    var text = typeof value === "string" ? value : "";
    text = text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
    if (!text)
        text = fallback || "";
    if (text.length > maximum)
        text = text.slice(0, Math.max(0, maximum - 1)) + "…";
    return text;
}

function _launcherId(value) {
    var id = _preferenceId(value);
    return id && !/[\u0000-\u001f\u007f]/.test(id) ? id : "";
}

function _launcherAction(kind, projectId, taskId) {
    var action;
    if (kind === "project")
        action = { type: kind, projectId: projectId };
    else if (kind === "task")
        action = { type: kind, projectId: projectId, taskId: taskId };
    else
        action = { type: "info", reason: kind };
    var encoded = JSON.stringify(action);
    return encoded.length <= MAX_LAUNCHER_ACTION_LENGTH ? encoded : "";
}

function _launcherProjectResult(project) {
    project = project || {};
    var projectId = _launcherId(project.id);
    if (!projectId)
        return null;
    var tasks = _array(project.tasks);
    var activeTaskCount = 0;
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i] && tasks[i].runtimeState === "active")
            activeTaskCount += 1;
    }
    return {
        kind: "project",
        name: _launcherText(project.name, "unknown", MAX_PROJECT_NAME_LENGTH),
        projectId: projectId,
        activeTaskCount: activeTaskCount,
        taskCount: tasks.length,
        action: _launcherAction("project", projectId, "")
    };
}

function _launcherTaskResult(project, task) {
    project = project || {};
    task = task || {};
    var projectId = _launcherId(project.id);
    var taskId = _launcherId(task.id);
    if (!projectId || !taskId)
        return null;
    var runtimeState = _string(task.runtimeState, "inactive");
    var state = runtimeState === "error"
        ? "error" : _string(task.displayState, _string(task.storedStatus, "unknown"));
    return {
        kind: "task",
        name: _launcherText(task.title, "unknown", MAX_TASK_TITLE_LENGTH),
        projectName: _launcherText(project.name, "unknown", MAX_PROJECT_NAME_LENGTH),
        state: _launcherText(state, "unknown", MAX_TASK_STATE_LENGTH),
        activeSessionCount: _number(task.activeSessionCount),
        projectId: projectId,
        taskId: taskId,
        action: _launcherAction("task", projectId, taskId)
    };
}

function _launcherInfoResult(reason) {
    return {
        kind: "info",
        reason: reason,
        action: _launcherAction(reason, "", "")
    };
}

function _hasRootEmptyWarning(warnings) {
    for (var i = 0; i < warnings.length; i++) {
        if (warnings[i] && warnings[i].code === "root_empty")
            return true;
    }
    return false;
}

function makeLauncherProjection(snapshot, query) {
    var facts = _snapshotFacts(snapshot);
    if (!facts.ready) {
        return {
            ready: false,
            items: [_launcherInfoResult("loading")],
            overflowCount: 0
        };
    }

    if (!facts.projects.length) {
        var emptyReason = _hasRootEmptyWarning(facts.warnings)
            ? "unconfigured" : "no_projects";
        return {
            ready: true,
            items: [_launcherInfoResult(emptyReason)],
            overflowCount: 0
        };
    }

    var normalizedQuery = typeof query === "string"
        ? query.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().toLowerCase()
        : "";
    if (normalizedQuery.length > MAX_LAUNCHER_QUERY_LENGTH) {
        return { ready: true, items: [], overflowCount: 0 };
    }

    var matches = [];
    var matchCount = 0;
    function addMatch(result) {
        if (!result || !result.action)
            return;
        matchCount += 1;
        if (matches.length < MAX_LAUNCHER_RESULTS)
            matches.push(result);
    }

    for (var p = 0; p < facts.projects.length; p++) {
        var project = facts.projects[p] || {};
        var projectName = _launcherText(project.name, "unknown", MAX_PROJECT_NAME_LENGTH);
        if (!normalizedQuery || projectName.toLowerCase().indexOf(normalizedQuery) !== -1)
            addMatch(_launcherProjectResult(project));
    }

    if (normalizedQuery) {
        for (var projectIndex = 0; projectIndex < facts.projects.length; projectIndex++) {
            var taskProject = facts.projects[projectIndex] || {};
            var tasks = _array(taskProject.tasks);
            for (var t = 0; t < tasks.length; t++) {
                var task = tasks[t] || {};
                var taskTitle = _launcherText(task.title, "unknown", MAX_TASK_TITLE_LENGTH);
                if (taskTitle.toLowerCase().indexOf(normalizedQuery) !== -1)
                    addMatch(_launcherTaskResult(taskProject, task));
            }
        }
    }

    var overflowCount = Math.max(0, matchCount - matches.length);
    if (overflowCount) {
        matches.push({
            kind: "overflow",
            hiddenCount: overflowCount,
            action: ""
        });
    }
    return {
        ready: true,
        items: matches,
        overflowCount: overflowCount
    };
}

function _findUniqueProject(projects, projectId) {
    var found = null;
    for (var i = 0; i < projects.length; i++) {
        if (_launcherId(projects[i] && projects[i].id) !== projectId)
            continue;
        if (found)
            return null;
        found = projects[i];
    }
    return found;
}

function _findUniqueTask(project, taskId) {
    var tasks = _array(project && project.tasks);
    var found = null;
    for (var i = 0; i < tasks.length; i++) {
        if (_launcherId(tasks[i] && tasks[i].id) !== taskId)
            continue;
        if (found)
            return null;
        found = tasks[i];
    }
    return found;
}

function resolveLauncherAction(snapshot, encodedAction) {
    if (typeof encodedAction !== "string" || !encodedAction
            || encodedAction.length > MAX_LAUNCHER_ACTION_LENGTH)
        return null;
    var action;
    try {
        action = JSON.parse(encodedAction);
    } catch (error) {
        return null;
    }
    if (!action || typeof action !== "object" || Array.isArray(action)
            || typeof action.type !== "string")
        return null;

    var facts = _snapshotFacts(snapshot);
    if (action.type === "info") {
        if (!facts.ready && action.reason === "loading")
            return { kind: "info" };
        if (facts.ready && !facts.projects.length) {
            var unconfigured = _hasRootEmptyWarning(facts.warnings);
            if ((unconfigured && action.reason === "unconfigured")
                    || (!unconfigured && action.reason === "no_projects"))
                return { kind: "info" };
        }
        return null;
    }
    if (!facts.ready)
        return null;

    var projectId = _launcherId(action.projectId);
    if (!projectId || action.projectId !== projectId)
        return null;
    var project = _findUniqueProject(facts.projects, projectId);
    if (!project)
        return null;

    if (action.type === "project")
        return { kind: "project", projectId: projectId };
    if (action.type !== "task")
        return null;

    var taskId = _launcherId(action.taskId);
    if (!taskId || action.taskId !== taskId || !_findUniqueTask(project, taskId))
        return null;
    var pinnedTaskId = makePinnedTaskToken(projectId, taskId);
    return pinnedTaskId
        ? { kind: "task", projectId: projectId, taskId: taskId, pinnedTaskId: pinnedTaskId }
        : null;
}
