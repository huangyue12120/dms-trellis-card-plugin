.pragma library

var LIMITS = {
    scopes: 33,
    identity: 1024,
    projectName: 160,
    cooldownMs: 5 * 60 * 1000
};

function limits() {
    return Object.assign({}, LIMITS);
}

function createState() {
    return { initialized: false, scopes: {} };
}

function _text(value, maximum) {
    return typeof value === "string"
        ? value.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, maximum) : "";
}

function _scopeKey(event) {
    var projectId = event && typeof event.project_id === "string"
        ? event.project_id : "";
    if (!projectId || projectId.length > LIMITS.identity
            || /[\u0000-\u001f\u007f]/.test(projectId))
        return "global";
    return "project:" + projectId;
}

function _number(value) {
    var numeric = Number(value);
    return isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function _copyTimestampMap(value) {
    var result = {};
    if (!value || typeof value !== "object")
        return result;
    for (var key in value) {
        if (key !== "health_degraded" && key !== "health_recovered")
            continue;
        var timestamp = _number(value[key]);
        if (timestamp >= 0)
            result[key] = timestamp;
    }
    return result;
}

function _copyState(state) {
    var source = state && typeof state === "object" ? state : createState();
    var result = { initialized: source.initialized === true, scopes: {} };
    var sourceScopes = source.scopes && typeof source.scopes === "object"
        ? source.scopes : {};
    var keys = Object.keys(sourceScopes);
    for (var i = 0; i < keys.length && i < LIMITS.scopes; i++) {
        var key = keys[i];
        var entry = sourceScopes[key];
        if (!entry || typeof entry !== "object")
            continue;
        Object.defineProperty(result.scopes, key, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: {
                active: entry.active === true,
                lastNotifiedAt: _copyTimestampMap(entry.lastNotifiedAt)
            }
        });
    }
    return result;
}

function _scope(state, key) {
    if (Object.prototype.hasOwnProperty.call(state.scopes, key))
        return state.scopes[key];
    if (Object.keys(state.scopes).length >= LIMITS.scopes)
        return null;
    Object.defineProperty(state.scopes, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: { active: false, lastNotifiedAt: {} }
    });
    return state.scopes[key];
}

function _eligible(entry, kind, now) {
    var prior = entry.lastNotifiedAt[kind];
    return prior === undefined || now - prior >= LIMITS.cooldownMs;
}

function _request(event, scopeKey, kind, observedAt) {
    return {
        scopeKey: scopeKey,
        eventType: kind,
        projectName: _text(event && event.project_name, LIMITS.projectName),
        observedAt: _number(observedAt)
    };
}

function observe(state, events, enabled, observedAt) {
    var next = _copyState(state);
    var requests = [];
    var quiet = !next.initialized;
    var now = _number(observedAt);
    var source = Array.isArray(events) ? events : [];

    for (var i = 0; i < source.length; i++) {
        var event = source[i];
        if (!event || (event.event_type !== "health_degraded"
                && event.event_type !== "health_recovered"))
            continue;

        var kind = event.event_type;
        var key = _scopeKey(event);
        var entry = _scope(next, key);
        if (!entry)
            continue;

        if (kind === "health_degraded") {
            if (entry.active)
                continue;
            entry.active = true;
            if (!quiet && enabled === true && _eligible(entry, kind, now)) {
                requests.push(_request(event, key, kind, now));
                entry.lastNotifiedAt[kind] = now;
            }
        } else {
            if (!entry.active)
                continue;
            entry.active = false;
            if (!quiet && enabled === true && _eligible(entry, kind, now)) {
                requests.push(_request(event, key, kind, now));
                entry.lastNotifiedAt[kind] = now;
            }
        }
    }

    next.initialized = true;
    return { state: next, requests: requests };
}

function evaluate(state, events, enabled, observedAt) {
    return observe(state, events, enabled, observedAt);
}
