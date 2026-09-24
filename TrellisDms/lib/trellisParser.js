.pragma library

// The parser owns the JSON-to-Snapshot contract. It intentionally has no
// filesystem, QML, or DMS dependencies so the data model can be fixture-tested
// without starting a shell.

var MAX_JSON_BYTES = 1024 * 1024;
var MAX_WARNING_LENGTH = 240;
var MAX_WARNINGS = 256;
var MAX_SESSION_TIMESTAMP_LENGTH = 64;

function _string(value) {
    return typeof value === "string" ? value : "";
}

function _warning(code, message, extra) {
    var result = {
        code: _string(code) || "warning",
        message: (_string(message) || "warning").slice(0, MAX_WARNING_LENGTH)
    };
    if (extra) {
        for (var key in extra)
            result[key] = extra[key];
    }
    return result;
}

function _array(value) {
    return Array.isArray(value) ? value : [];
}

function _timestamp(value) {
    if (typeof value !== "string")
        return null;
    var timestamp = value.trim();
    if (!timestamp || timestamp.length > MAX_SESSION_TIMESTAMP_LENGTH)
        return null;
    return isFinite(Date.parse(timestamp)) ? timestamp : null;
}

function _uniqueStrings(value) {
    var result = [];
    var values = _array(value);
    for (var i = 0; i < values.length; i++) {
        if (typeof values[i] !== "string")
            continue;
        var item = values[i].trim();
        if (item && result.indexOf(item) === -1)
            result.push(item);
    }
    return result;
}

function _idFrom(value) {
    if (typeof value === "string")
        return value.trim();
    if (value && typeof value === "object") {
        if (typeof value.id === "string")
            return value.id.trim();
        if (typeof value.taskId === "string")
            return value.taskId.trim();
        if (typeof value.name === "string")
            return value.name.trim();
    }
    return "";
}

function _parseJson(text) {
    if (typeof text !== "string")
        return { ok: false, error: "not_text" };
    if (text.length > MAX_JSON_BYTES)
        return { ok: false, error: "size_limit" };
    var raw = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    try {
        return { ok: true, value: JSON.parse(raw) };
    } catch (error) {
        return { ok: false, error: "malformed_json" };
    }
}

function parseJson(text) {
    return _parseJson(text);
}

function _recordError(record, code, message) {
    var errors = record.errors || [];
    errors.push(_warning(code, message));
    record.errors = errors;
}

function _taskBase(input) {
    var source = input && input.value && typeof input.value === "object" ? input.value : {};
    var dirName = _string(input && input.dirName).trim();
    var taskId = _string(source.id).trim() || dirName || "unknown";
    var title = _string(source.title).trim() || _string(source.name).trim() || "unknown";
    var storedStatus = _string(source.status).trim() || "unknown";
    var priority = _string(source.priority).trim() || "P2";
    var parentRaw = _idFrom(source.parent);
    var childrenRaw = _uniqueStrings(source.children);
    var subtasksRaw = _uniqueStrings(source.subtasks);
    var children = childrenRaw.concat(subtasksRaw);

    var task = {
        id: taskId,
        dirName: dirName || taskId,
        title: title,
        storedStatus: storedStatus,
        runtimeState: input && input.readError ? "error" : "inactive",
        displayState: storedStatus,
        priority: priority,
        parentId: parentRaw || null,
        childIds: _uniqueStrings(children),
        activeSessionCount: 0,
        progress: null,
        recentlyChanged: false,
        paths: {
            taskDir: _string(input && input.taskDir),
            taskJson: _string(input && input.taskJson)
        },
        errors: []
    };

    if (input && input.readError)
        _recordError(task, "task_read_failed", input.readError);
    if (!input || !input.value || typeof input.value !== "object" || Array.isArray(input.value))
        _recordError(task, "task_data_invalid", "task.json must contain an object");
    return task;
}

function _taskIdentityMap(tasks) {
    var map = {};
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (!map[task.id])
            map[task.id] = task;
        if (task.dirName && !map[task.dirName])
            map[task.dirName] = task;
    }
    return map;
}

function _relationId(map, task, candidate, kind, warnings) {
    if (!candidate)
        return null;
    var target = map[candidate];
    if (!target) {
        warnings.push(_warning("unknown_relation", "unknown " + kind + " relation: " + candidate, {
            taskId: task.id,
            relation: kind,
            target: candidate
        }));
        return null;
    }
    return target.id;
}

function _reconcileRelations(tasks, warnings) {
    var map = _taskIdentityMap(tasks);
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        task.parentId = _relationId(map, task, task.parentId, "parent", warnings);
        var childIds = [];
        for (var j = 0; j < task.childIds.length; j++) {
            var childId = _relationId(map, task, task.childIds[j], "child", warnings);
            if (childId && childIds.indexOf(childId) === -1)
                childIds.push(childId);
        }
        task.childIds = childIds;
    }

    // Add inverse links only for relations that resolve to a known task. This
    // preserves a consistent graph without inventing IDs for unknown fields.
    for (var k = 0; k < tasks.length; k++) {
        var parentTask = tasks[k];
        for (var c = 0; c < parentTask.childIds.length; c++) {
            var child = map[parentTask.childIds[c]];
            if (child && (!child.parentId || child.parentId === parentTask.id))
                child.parentId = parentTask.id;
            else if (child && child.parentId !== parentTask.id)
                warnings.push(_warning("relation_conflict", "parent/child relation conflict", {
                    taskId: child.id,
                    parentId: child.parentId,
                    childOf: parentTask.id
                }));
        }
    }

    // A child may declare its parent without the parent repeating the child in
    // `children`. Keep both directions in the normalized graph so consumers do
    // not have to reimplement relation reconciliation.
    for (var p = 0; p < tasks.length; p++) {
        var childTask = tasks[p];
        if (!childTask.parentId)
            continue;
        var declaredParent = map[childTask.parentId];
        if (declaredParent && declaredParent.childIds.indexOf(childTask.id) === -1)
            declaredParent.childIds.push(childTask.id);
    }
}

function _taskByPath(tasks) {
    var map = {};
    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].paths.taskDir)
            map[tasks[i].paths.taskDir] = tasks[i];
    }
    return map;
}

function _sessionRecord(input, taskMap, warnings) {
    var sessionKey = _string(input && input.sessionKey).trim() || "unknown";
    var session = {
        sessionKey: sessionKey,
        taskId: null,
        source: "session",
        lastSeenAt: null,
        mtime: null,
        stale: false,
        error: null,
        path: _string(input && input.path)
    };

    if (input && input.readError) {
        session.error = "session_read_failed";
        session.stale = true;
        warnings.push(_warning("session_read_failed", input.readError, { sessionKey: sessionKey }));
        return session;
    }
    var parsed = input && input.value && typeof input.value === "object" ? input.value : null;
    if (!parsed || Array.isArray(parsed)) {
        session.error = "session_data_invalid";
        warnings.push(_warning("session_data_invalid", "session JSON must contain an object", { sessionKey: sessionKey }));
        return session;
    }
    session.lastSeenAt = _timestamp(parsed.last_seen_at);
    var pointer = parsed.current_task;
    if (typeof pointer !== "string" || !pointer.trim()) {
        session.error = "malformed_pointer";
        warnings.push(_warning("malformed_pointer", "session current_task is not a non-empty string", { sessionKey: sessionKey }));
        return session;
    }

    var resolution = input.resolution || null;
    if (!resolution || !resolution.ok) {
        session.stale = true;
        session.error = resolution && resolution.reason ? resolution.reason : "stale_pointer";
        warnings.push(_warning("stale_pointer", "session pointer does not resolve to a task", {
            sessionKey: sessionKey,
            reason: session.error
        }));
        return session;
    }

    var resolvedTask = taskMap[resolution.taskDir || resolution.path];
    if (!resolvedTask && resolution.taskId)
        resolvedTask = taskMap[resolution.taskId];
    if (!resolvedTask) {
        session.stale = true;
        session.error = "task_not_loaded";
        warnings.push(_warning("task_not_loaded", "session pointer resolved outside loaded task records", { sessionKey: sessionKey }));
        return session;
    }
    session.taskId = resolvedTask.id;
    return session;
}

function buildProjectSnapshot(input) {
    input = input || {};
    var warnings = _array(input.warnings).slice();
    var errors = _array(input.errors).slice();
    var taskInputs = _array(input.taskRecords);
    var tasks = [];

    for (var i = 0; i < taskInputs.length; i++) {
        var taskInput = taskInputs[i] || {};
        var parsed = taskInput.value !== undefined ? taskInput : null;
        if (!parsed) {
            parsed = Object.assign({}, taskInput);
            var parsedText = parseJson(taskInput.text);
            parsed.value = parsedText.ok ? parsedText.value : null;
            if (!parsedText.ok)
                parsed.readError = parsed.readError || parsedText.error;
        }
        var task = _taskBase(parsed);
        tasks.push(task);
        if (task.errors.length)
            warnings = warnings.concat(task.errors);
    }
    _reconcileRelations(tasks, warnings);

    var taskMap = _taskByPath(tasks);
    var taskIdentity = _taskIdentityMap(tasks);
    for (var identity in taskIdentity) {
        if (!taskMap[identity])
            taskMap[identity] = taskIdentity[identity];
    }
    var sessionInputs = _array(input.sessionRecords);
    var sessions = [];
    var activeTaskIds = [];
    for (var s = 0; s < sessionInputs.length; s++) {
        var sessionInput = sessionInputs[s] || {};
        if (sessionInput.value === undefined && sessionInput.text !== undefined) {
            var sessionParsed = parseJson(sessionInput.text);
            sessionInput = Object.assign({}, sessionInput, {
                value: sessionParsed.ok ? sessionParsed.value : null,
                readError: sessionParsed.ok ? sessionInput.readError : (sessionInput.readError || sessionParsed.error)
            });
        }
        var session = _sessionRecord(sessionInput, taskMap, warnings);
        sessions.push(session);
        if (session.taskId) {
            var activeTask = taskIdentity[session.taskId];
            if (activeTask) {
                activeTask.activeSessionCount += 1;
                if (!activeTask.errors.length) {
                    activeTask.runtimeState = "active";
                    activeTask.displayState = "active";
                }
                if (activeTaskIds.indexOf(activeTask.id) === -1)
                    activeTaskIds.push(activeTask.id);
            }
        }
    }
    for (var t = 0; t < tasks.length; t++) {
        if (tasks[t].runtimeState !== "active")
            tasks[t].runtimeState = tasks[t].errors.length ? "error" : "inactive";
        if (tasks[t].runtimeState !== "active" && tasks[t].displayState === "active")
            tasks[t].displayState = tasks[t].storedStatus;
    }

    var root = _string(input.root);
    var projectId = _string(input.id) || root || "unknown";
    var project = {
        id: projectId,
        name: _string(input.name) || (root ? root.split(/[\\/]/).filter(Boolean).pop() : "unknown"),
        root: root,
        trellisVersion: _string(input.trellisVersion) || null,
        tasks: tasks,
        sessions: sessions,
        activeTaskIds: activeTaskIds,
        archiveSummary: {
            loaded: false,
            taskCount: null
        },
        errors: errors
    };
    return {
        project: project,
        warnings: warnings
    };
}

function buildSnapshot(projectInputs, globalWarnings, generatedAt) {
    var projects = [];
    var warnings = _array(globalWarnings).slice();
    var inputs = _array(projectInputs);
    for (var i = 0; i < inputs.length; i++) {
        var result = buildProjectSnapshot(inputs[i]);
        projects.push(result.project);
        warnings = warnings.concat(result.warnings);
    }
    warnings = warnings.slice(0, MAX_WARNINGS);
    return {
        schemaVersion: 1,
        generatedAt: _string(generatedAt) || new Date().toISOString(),
        projects: projects,
        primaryProjectId: null,
        primaryTaskId: null,
        warnings: warnings
    };
}

function parseTaskRecord(text, metadata) {
    var parsed = parseJson(text);
    var input = Object.assign({}, metadata || {}, {
        text: text,
        value: parsed.ok ? parsed.value : null,
        readError: parsed.ok ? (metadata && metadata.readError) : (parsed.error)
    });
    return _taskBase(input);
}

function parseSessionRecord(text, metadata) {
    var parsed = parseJson(text);
    return Object.assign({}, metadata || {}, {
        text: text,
        value: parsed.ok ? parsed.value : null,
        readError: parsed.ok ? (metadata && metadata.readError) : (parsed.error)
    });
}

// Explicit aliases make the module contract easy to consume from QML and the
// Node vm-based fixture tests without exposing raw JSON to the widget.
var parseTask = parseTaskRecord;
var parseSession = parseSessionRecord;
var makeProjectSnapshot = buildProjectSnapshot;
var makeSnapshot = buildSnapshot;
