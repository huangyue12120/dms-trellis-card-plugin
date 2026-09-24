.pragma library

// Keep trust selection and remembered-project projection independent from QML
// so their migration and bounding contracts can be exercised in Node tests.

function selectRootInput(settings, maxRoots) {
    var data = settings && typeof settings === "object" ? settings : {};
    if (Array.isArray(data.scanRoots)) {
        var limit = _boundedLimit(maxRoots, 16);
        return {
            value: data.scanRoots.slice(0, limit),
            source: "scanRoots",
            truncated: Math.max(0, data.scanRoots.length - limit)
        };
    }
    return {
        value: typeof data.projectRoot === "string" ? data.projectRoot : "",
        source: "projectRoot",
        truncated: 0
    };
}

function _boundedLimit(value, fallback) {
    var parsed = Number(value);
    if (!isFinite(parsed) || parsed < 0)
        parsed = fallback;
    return Math.max(0, Math.floor(parsed));
}

function _validRoot(value) {
    return typeof value === "string" && value.charAt(0) === "/"
        && !/[\u0000-\u001f\u007f]/.test(value);
}

function _summary(record, lastSeenAt) {
    if (!record || !_validRoot(record.root))
        return null;
    var name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) {
        var trimmedRoot = record.root.replace(/\/+$/, "");
        var separator = trimmedRoot.lastIndexOf("/");
        name = separator === -1 ? trimmedRoot : trimmedRoot.slice(separator + 1);
    }
    return {
        root: record.root,
        name: name || record.root,
        lastSeenAt: lastSeenAt
    };
}

function makeRememberedProjects(projects, lastSeenAt, maxProjects) {
    var values = Array.isArray(projects) ? projects : [];
    var timestamp = typeof lastSeenAt === "string" ? lastSeenAt : "";
    var limit = _boundedLimit(maxProjects, 32);
    var result = [];
    var seen = {};
    for (var i = 0; i < values.length && result.length < limit; i++) {
        var summary = _summary(values[i], timestamp);
        if (!summary || seen[summary.root])
            continue;
        seen[summary.root] = true;
        result.push(summary);
    }
    return result;
}

function normalizeRememberedProjects(value, maxProjects) {
    var values = Array.isArray(value) ? value : [];
    var limit = _boundedLimit(maxProjects, 32);
    var result = [];
    var seen = {};
    for (var i = 0; i < values.length && result.length < limit; i++) {
        var record = values[i];
        var timestamp = record && typeof record.lastSeenAt === "string"
            ? record.lastSeenAt : "";
        var summary = _summary(record, timestamp);
        if (!summary || seen[summary.root])
            continue;
        seen[summary.root] = true;
        result.push(summary);
    }
    return result;
}
