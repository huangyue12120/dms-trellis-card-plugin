.pragma library

var DISPLAY_MODES = ["auto", "task", "project", "counts", "icon", "full"];
var MAX_POPOUT_PROJECTS = 8;
var MAX_POPOUT_TASKS_PER_PROJECT = 12;
var MAX_POPOUT_WARNINGS = 8;
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
    var ready = !!snapshot && snapshot.schemaVersion === 1
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
