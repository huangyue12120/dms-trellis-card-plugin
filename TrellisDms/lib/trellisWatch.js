.pragma library

// Keep the scheduling/resource policy in one small, deterministic module so
// the QML coordinator and the contract fixtures agree on the same bounds.
var MIN_TOPOLOGY_INTERVAL_SECONDS = 15;
var DEFAULT_TOPOLOGY_INTERVAL_SECONDS = 30;
var MAX_TOPOLOGY_INTERVAL_SECONDS = 300;

function topologyIntervalDefaults() {
    return {
        minimum: MIN_TOPOLOGY_INTERVAL_SECONDS,
        defaultValue: DEFAULT_TOPOLOGY_INTERVAL_SECONDS,
        maximum: MAX_TOPOLOGY_INTERVAL_SECONDS
    };
}

function normalizeTopologyInterval(value, fallback) {
    var defaultValue = Number(fallback);
    if (!isFinite(defaultValue))
        defaultValue = DEFAULT_TOPOLOGY_INTERVAL_SECONDS;
    defaultValue = Math.round(defaultValue);
    defaultValue = Math.max(MIN_TOPOLOGY_INTERVAL_SECONDS,
        Math.min(MAX_TOPOLOGY_INTERVAL_SECONDS, defaultValue));

    var numeric = Number(value);
    var valid = value !== null && value !== undefined && value !== ""
        && isFinite(numeric);
    if (!valid)
        return {
            value: defaultValue,
            clamped: false,
            invalid: value !== null && value !== undefined && value !== ""
        };

    var rounded = Math.round(numeric);
    var clamped = rounded < MIN_TOPOLOGY_INTERVAL_SECONDS
        || rounded > MAX_TOPOLOGY_INTERVAL_SECONDS;
    var normalized = Math.max(MIN_TOPOLOGY_INTERVAL_SECONDS,
        Math.min(MAX_TOPOLOGY_INTERVAL_SECONDS, rounded));
    return {
        value: normalized,
        clamped: clamped,
        invalid: false
    };
}

function addPendingPath(pending, path, limit) {
    var result = {};
    var source = pending || {};
    for (var existing in source)
        result[existing] = true;

    var candidate = typeof path === "string" ? path : "";
    var max = Number(limit);
    if (!isFinite(max) || max < 1)
        max = 1;
    max = Math.floor(max);
    var accepted = true;
    if (!candidate || !result[candidate]) {
        var count = 0;
        for (var key in result)
            count += 1;
        if (!candidate || count >= max)
            accepted = false;
        else
            result[candidate] = true;
    }
    return {
        pending: result,
        accepted: accepted,
        dropped: accepted ? 0 : 1
    };
}

function pendingPaths(pending) {
    var paths = [];
    var source = pending || {};
    for (var path in source)
        paths.push(path);
    paths.sort();
    return paths;
}

function warningKey(warning) {
    if (!warning)
        return "warning";
    return [warning.code || "warning", warning.path || "", warning.reason || "", warning.root || ""].join("|");
}

function recordWarning(ledger, order, warning, now, cooldown, limit) {
    var table = ledger || {};
    var sequence = order || [];
    var key = warningKey(warning);
    var timestamp = Number(now);
    if (!isFinite(timestamp))
        timestamp = 0;
    var windowMs = Number(cooldown);
    if (!isFinite(windowMs) || windowMs < 0)
        windowMs = 0;
    var entry = table[key];
    if (entry && timestamp - entry.lastAt < windowMs) {
        entry.suppressed = (entry.suppressed || 0) + 1;
        return {
            accepted: false,
            ledger: table,
            order: sequence,
            suppressedCount: entry.suppressed,
            sample: entry.sample || warning
        };
    }
    var suppressed = entry ? (entry.suppressed || 0) : 0;
    for (var i = sequence.length - 1; i >= 0; i--) {
        if (sequence[i] === key)
            sequence.splice(i, 1);
    }
    table[key] = {
        lastAt: timestamp,
        suppressed: 0,
        sample: warning
    };
    sequence.push(key);
    var max = Number(limit);
    if (!isFinite(max) || max < 1)
        max = 1;
    while (sequence.length > Math.floor(max)) {
        var oldest = sequence.shift();
        delete table[oldest];
    }
    return {
        accepted: true,
        ledger: table,
        order: sequence,
        suppressedCount: suppressed
    };
}
