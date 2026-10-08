.pragma library

// Runtime observation only. Callers supply the existing Health and primary
// projections; this helper never reads files, stores history, or mutates facts.
var LIMITS = { events: 200, projects: 32, tasks: 128, sessions: 128,
    archiveUnits: 128, archiveRows: 4096, identity: 1024 };
// Within one observation, sort by qualified identity, then this kind order.
var EVENT_KINDS = ["project_discovered", "project_unavailable", "project_recovered",
    "task_discovered", "task_status_changed", "task_state_changed",
    "session_detached", "session_attached", "active_session_count_changed",
    "archive_item_observed", "pin_changed", "primary_changed",
    "health_degraded", "health_recovered"];
var ROOT_ERRORS = ["root_unavailable", "root_canonicalization",
    "project_discovery_failed", "project_path_invalid", "project_outside_root",
    "project_limit", "scan_root_limit", "discovery_limit", "command_output_limit",
    "process_create_failed", "reader_create_failed", "reload_project_missing"];
var TASK_ERRORS = ["task_discovery_failed", "task_limit", "task_path_invalid",
    "task_path_rejected", "task_json_missing", "task_json_rejected", "task_json_unavailable"];
var SESSION_ERRORS = ["session_discovery_failed", "session_limit",
    "session_path_invalid", "session_path_rejected"];

function limits() { return Object.assign({}, LIMITS); }
function _array(value) { return Array.isArray(value) ? value : []; }
function _text(value, maximum) {
    return typeof value === "string"
        ? value.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, maximum) : "";
}
function _id(value) {
    return typeof value === "string" && value.length > 0
        && value.length <= LIMITS.identity && !/[\u0000-\u001f\u007f]/.test(value)
        ? value : "";
}
function _find(rows, key, id) {
    for (var i = 0; i < rows.length; i++) {
        if (rows[i][key] === id)
            return rows[i];
    }
    return null;
}
function _unique(rows, key, maximum) {
    // Arrays avoid prototype keys and delimiter collisions. Ambiguous IDs are
    // excluded altogether, rather than selecting whichever row came first.
    var result = [];
    var source = _array(rows);
    for (var i = 0; i < source.length && i < maximum; i++) {
        var id = _id(source[i] && source[i][key]);
        if (!id)
            continue;
        var duplicate = false;
        for (var j = 0; j < source.length; j++) {
            if (j !== i && source[j] && source[j][key] === id) {
                duplicate = true;
                break;
            }
        }
        if (!duplicate)
            result.push(source[i]);
    }
    return result.sort(function(a, b) { return _compare(a[key], b[key]); });
}
function _compare(a, b) { return a < b ? -1 : (a > b ? 1 : 0); }
function _same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

function createTracker(epoch) {
    return { epoch: _id(epoch) || "runtime", generation: 0, sequence: 0,
        initialized: false, scopeKey: null, projects: [], health: [],
        archiveUnits: [], selection: null, events: [] };
}

function resetScope(state, scopeKey) {
    if (state.scopeKey === scopeKey)
        return;
    // Configured roots changing is not a data deletion. Retire baselines;
    // retain session-only history and the monotonic provenance counter.
    state.scopeKey = scopeKey;
    state.initialized = false;
    state.projects = [];
    state.health = [];
    state.archiveUnits = [];
    state.selection = null;
}

function _event(project, task, session, kind, before, after, source) {
    return { project_id: project ? project.id : null,
        project_name: project ? project.name : "",
        task_id: task ? task.id : null, task_title: task ? task.title : "",
        session_key: session || null, event_type: kind,
        source: source || "trellis_data", before: before, after: after };
}
function _commit(state, events, observedAt) {
    events.sort(function(a, b) {
        return _compare(a.project_id || "", b.project_id || "")
            || _compare(a.task_id || "", b.task_id || "")
            || _compare(a.session_key || "", b.session_key || "")
            || EVENT_KINDS.indexOf(a.event_type) - EVENT_KINDS.indexOf(b.event_type);
    });
    for (var i = 0; i < events.length; i++) {
        state.sequence += 1;
        state.events.push(Object.assign({}, events[i], {
            event_id: state.epoch + ":" + state.generation + ":" + state.sequence,
            observed_at: _text(observedAt, 64), epoch: state.epoch,
            source_snapshot_generation: state.generation
        }));
    }
    state.events = state.events.slice(-LIMITS.events);
}
function history(state) {
    // Copy only the allowlisted records; consumers cannot mutate baselines.
    return JSON.parse(JSON.stringify({ epoch: state.epoch,
        source_snapshot_generation: state.generation, events: state.events }));
}

function _under(path, root) {
    return path === root || path.indexOf(root.replace(/\/$/, "") + "/") === 0;
}
function _blocked(snapshot, project, codes) {
    if (snapshot.runtime && snapshot.runtime.lastGoodFallbackActive)
        return true;
    var warnings = _array(snapshot.warnings).concat(_array(project && project.errors));
    for (var i = 0; i < warnings.length; i++) {
        var warning = warnings[i] || {};
        if (warning.code === "last_good_snapshot")
            return true;
        if (codes.indexOf(warning.code) === -1)
            continue;
        if (warning.projectId) {
            if (project && warning.projectId === project.id)
                return true;
        } else if (warning.root) {
            if (project && _under(project.root || "", warning.root))
                return true;
        } else {
            return true;
        }
    }
    return false;
}
function _retain(rows, value, key, maximum, observedIds) {
    var previous = _find(rows, key, value[key]);
    if (previous)
        rows.splice(rows.indexOf(previous), 1);
    rows.push(value);
    if (rows.length > maximum) {
        // Do not evict a record that this observation has yet to compare.
        // Prefer absent identities, then retire the oldest retained record.
        var retired = 0;
        if (observedIds) {
            for (var i = 0; i < rows.length; i++) {
                if (observedIds.indexOf(rows[i][key]) === -1) {
                    retired = i;
                    break;
                }
            }
        }
        rows.splice(retired, 1);
    }
}
function _taskSummary(task) {
    return { id: task.id, title: _text(task.title, 240),
        status: _text(task.storedStatus, 48), state: _text(task.displayState, 48),
        count: Math.min(LIMITS.sessions, Math.max(0, Math.floor(Number(task.activeSessionCount) || 0))) };
}
function _sessionReliable(session, tasks) {
    var task = _find(tasks, "id", session.taskId);
    return !session.error && !session.stale && !!task && !_array(task.errors).length;
}
function _observeProject(snapshot, project, baseline, quiet, events) {
    var tasks = _unique(project.tasks, "id", LIMITS.tasks);
    var sessions = _unique(project.sessions, "sessionKey", LIMITS.sessions);
    var taskIds = _array(project.tasks).map(function(row) { return row && row.id; });
    var sessionKeys = _array(project.sessions).map(function(row) { return row && row.sessionKey; });
    var tasksComplete = tasks.length === _array(project.tasks).length
        && !_blocked(snapshot, project, TASK_ERRORS);
    var sessionsComplete = sessions.length === _array(project.sessions).length
        && !_blocked(snapshot, project, SESSION_ERRORS);
    for (var t = 0; t < tasks.length; t++) {
        if (_array(tasks[t].errors).length)
            tasksComplete = false;
    }
    for (var s = 0; s < sessions.length; s++) {
        if (!_sessionReliable(sessions[s], tasks))
            sessionsComplete = false;
    }
    if (sessionsComplete && tasksComplete) {
        for (var k = baseline.sessions.length - 1; k >= 0; k--) {
            var missing = baseline.sessions[k];
            if (_find(sessions, "sessionKey", missing.key))
                continue;
            if (!quiet)
                events.push(_event(baseline, _find(baseline.tasks, "id", missing.taskId),
                    missing.key, "session_detached", { attached: true }, { attached: false }));
            baseline.sessions.splice(k, 1);
        }
    }
    // Runtime task state/count depends on *all* session pointers. Stored task
    // status can still be compared during an unrelated session read failure.
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (_array(task.errors).length)
            continue;
        var old = _find(baseline.tasks, "id", task.id);
        var current = _taskSummary(task);
        if (!quiet && !old)
            events.push(_event(baseline, current, null, "task_discovered", null,
                { status: current.status }));
        if (!quiet && old && old.status !== current.status)
            events.push(_event(baseline, current, null, "task_status_changed",
                { status: old.status }, { status: current.status }));
        if (sessionsComplete) {
            if (!quiet && old && old.state !== null && old.state !== current.state)
                events.push(_event(baseline, current, null, "task_state_changed",
                    { state: old.state }, { state: current.state }));
            if (!quiet && old && old.count !== null && old.count !== current.count)
                events.push(_event(baseline, current, null, "active_session_count_changed",
                    { count: old.count }, { count: current.count }));
        } else {
            current.state = old ? old.state : null;
            current.count = old ? old.count : null;
        }
        _retain(baseline.tasks, current, "id", LIMITS.tasks, taskIds);
    }
    for (var j = 0; j < sessions.length; j++) {
        var session = sessions[j];
        if (!_sessionReliable(session, tasks))
            continue;
        var prior = _find(baseline.sessions, "key", session.sessionKey);
        var target = _find(tasks, "id", session.taskId);
        var priorTarget = prior ? _find(tasks, "id", prior.taskId) : null;
        // Reassignment needs reliable facts for both targets. Keep the old
        // attachment through a failed prior-target read, then compare recovery.
        if (prior && prior.taskId !== session.taskId
                && (!priorTarget || _array(priorTarget.errors).length || !tasksComplete))
            continue;
        if (!quiet && prior && prior.taskId !== session.taskId)
            events.push(_event(baseline, _find(baseline.tasks, "id", prior.taskId),
                session.sessionKey, "session_detached", { attached: true }, { attached: false }));
        if (!quiet && (!prior || prior.taskId !== session.taskId))
            events.push(_event(baseline, _taskSummary(target), session.sessionKey,
                "session_attached", { attached: false }, { attached: true }));
        _retain(baseline.sessions, { key: session.sessionKey, taskId: session.taskId },
            "key", LIMITS.sessions, sessionKeys);
    }
}

function _observeHealth(state, snapshot, health, events, quiet) {
    // Only Health's stable status is semantic; warning order/count/time is not.
    var rows = [];
    var projects = _array(snapshot.projects);
    var uniqueProjects = _unique(projects, "id", LIMITS.projects);
    var healthProjects = _array(health && health.projects);
    for (var i = 0; i < healthProjects.length && i < LIMITS.projects; i++) {
        var hp = healthProjects[i];
        var project = projects[hp.projectIndex];
        if (project && _find(uniqueProjects, "id", project.id))
            rows.push({ id: project.id, name: _text(project.name, 160),
                degraded: hp.status === "degraded" });
    }
    var globalDegraded = !!(health && health.fallbackActive);
    var incidents = _array(health && health.incidents);
    for (var j = 0; j < incidents.length; j++) {
        if (incidents[j].projectIndex === null && incidents[j].severity === "degraded")
            globalDegraded = true;
    }
    rows.push({ id: null, name: "", degraded: globalDegraded });
    var healthIds = rows.map(function(row) { return row.id; });
    for (var r = 0; r < rows.length; r++) {
        var current = rows[r];
        var prior = _find(state.health, "id", current.id);
        if (!quiet && prior && prior.degraded !== current.degraded)
            events.push(_event(current.id === null ? null : current, null, null,
                current.degraded ? "health_degraded" : "health_recovered",
                { degraded: prior.degraded }, { degraded: current.degraded }));
        _retain(state.health, current, "id", LIMITS.projects + 1, healthIds);
    }
}

function observeSnapshot(state, snapshot, health, generation, observedAt) {
    if (!snapshot || !Array.isArray(snapshot.projects) || generation <= state.generation)
        return history(state);
    state.generation = generation;
    var quiet = !state.initialized;
    var events = [];
    var projects = _unique(snapshot.projects, "id", LIMITS.projects);
    var projectIds = snapshot.projects.map(function(row) { return row && row.id; });
    // Observe absence before bounded retention can retire a missing project.
    // Failed/ambiguous projects keep their reliable task/session baselines.
    for (var p = 0; p < state.projects.length; p++) {
        var absent = state.projects[p];
        if (projectIds.indexOf(absent.id) !== -1)
            continue;
        if (!quiet && absent.available)
            events.push(_event(absent, null, null, "project_unavailable",
                { available: true }, { available: false }));
        absent.available = false;
    }
    for (var i = 0; i < projects.length; i++) {
        var project = projects[i];
        var prior = _find(state.projects, "id", project.id);
        var blocked = _blocked(snapshot, project, ROOT_ERRORS);
        if (!prior) {
            prior = { id: project.id, name: _text(project.name, 160),
                available: !blocked, initialized: false,
                tasks: [], sessions: [] };
            if (!quiet && !blocked)
                events.push(_event(prior, null, null, "project_discovered", null, { available: true }));
        } else {
            prior.name = _text(project.name, 160);
            if (!quiet && prior.available !== !blocked)
                events.push(_event(prior, null, null,
                    blocked ? "project_unavailable" : "project_recovered",
                    { available: prior.available }, { available: !blocked }));
            prior.available = !blocked;
        }
        if (!blocked) {
            _observeProject(snapshot, project, prior, quiet || !prior.initialized, events);
            prior.initialized = true;
        }
        _retain(state.projects, prior, "id", LIMITS.projects, projectIds);
    }
    _observeHealth(state, snapshot, health, events, quiet);
    state.initialized = true;
    _commit(state, events, observedAt);
    return history(state);
}

function selectionSummary(pin, primary) {
    return { pin: pin && _id(pin.projectId) && _id(pin.taskId)
            ? { project_id: pin.projectId, task_id: pin.taskId } : null,
        primary: primary && _id(primary.projectId)
            ? { project_id: primary.projectId, task_id: _id(primary.taskId) || null } : null };
}
function observeSelection(state, selection, observedAt, quiet) {
    var events = [];
    if (state.selection && !quiet) {
        var keys = ["pin", "primary"];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (_same(state.selection[key], selection[key]))
                continue;
            var selected = selection[key] || state.selection[key];
            var project = selected ? _find(state.projects, "id", selected.project_id) : null;
            var task = project && selected ? _find(project.tasks, "id", selected.task_id) : null;
            if (selected && !project)
                project = { id: selected.project_id, name: "" };
            if (selected && selected.task_id && !task)
                task = { id: selected.task_id, title: "" };
            events.push(_event(project, task, null, key + "_changed",
                state.selection[key], selection[key], "ui_selection"));
        }
    }
    state.selection = selection;
    _commit(state, events, observedAt);
    return history(state);
}

function observeArchivePage(state, project, response, observedAt) {
    // Safe metadata is supplied after the daemon's cancellation/canonical-read
    // guards. A failed/partial coverage unit never replaces its prior baseline.
    if (!project || !_id(project.id) || !response || response.kind !== "archive-page"
            || ["ready", "empty"].indexOf(response.status) === -1
            || !Array.isArray(response.warnings) || response.warnings.length
            || !Array.isArray(response.tasks)
            || !/^\d{4}-(0[1-9]|1[0-2])$/.test(response.selectedMonth || ""))
        return history(state);
    var page = response.page === undefined ? 0 : response.page;
    var pageSize = response.pageSize === undefined ? 16 : response.pageSize;
    if (typeof page !== "number" || page < 0 || page > 63 || Math.floor(page) !== page
            || typeof pageSize !== "number" || pageSize < 1 || pageSize > 32
            || Math.floor(pageSize) !== pageSize)
        return history(state);
    var tasks = _array(response.tasks);
    if (tasks.length > 32 || tasks.some(function(row) {
        return !row || !row.available || row.error || !_id(row.dirName);
    }))
        return history(state);
    var token = JSON.stringify([project.id, response.selectedMonth, page, pageSize]);
    var prior = _find(state.archiveUnits, "token", token);
    var identities = [];
    var events = [];
    var ordered = tasks.slice().sort(function(a, b) { return _compare(a.dirName, b.dirName); });
    for (var i = 0; i < ordered.length; i++) {
        var row = ordered[i];
        var identity = JSON.stringify([project.id, response.selectedMonth, row.dirName]);
        if (identities.indexOf(identity) !== -1)
            continue;
        identities.push(identity);
        var known = false;
        for (var u = 0; u < state.archiveUnits.length; u++) {
            if (state.archiveUnits[u].identities.indexOf(identity) !== -1)
                known = true;
        }
        if (prior && !known)
            events.push(_event({ id: project.id, name: _text(project.name, 160) },
                { id: _id(row.id) || row.dirName, title: _text(row.title, 240) }, null,
                "archive_item_observed", null, { month: _text(response.selectedMonth, 7),
                    dir_name: row.dirName, status: _text(row.storedStatus, 48) }));
    }
    // Retain prior identities, including items that left this page, so page
    // shifts/repeated reads do not announce the same archive item again.
    var retained = prior ? prior.identities.concat(identities.filter(function(id) {
        return prior.identities.indexOf(id) === -1;
    })) : identities;
    _retain(state.archiveUnits, { token: token, identities: retained }, "token", LIMITS.archiveUnits);
    var count = 0;
    for (var c = 0; c < state.archiveUnits.length; c++)
        count += state.archiveUnits[c].identities.length;
    while (count > LIMITS.archiveRows && state.archiveUnits.length) {
        count -= state.archiveUnits[0].identities.length;
        state.archiveUnits.shift();
    }
    _commit(state, events, observedAt);
    return history(state);
}

function makeHistoryProjection(recent, snapshot) {
    var provenance = snapshot && snapshot.runtime || {};
    var ready = !!recent && Array.isArray(recent.events) && _id(recent.epoch);
    var matches = ready && provenance.observationEpoch === recent.epoch
        && provenance.publicationGeneration === recent.source_snapshot_generation;
    return { ready: !!ready, synchronized: !!matches,
        events: ready ? recent.events.slice(-LIMITS.events).reverse() : [] };
}
