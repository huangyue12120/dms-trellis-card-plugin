.pragma library

// This module is the only owner of path policy for the plugin.  It is kept
// free of QML and filesystem APIs so that the contract can be exercised by a
// small Node fixture harness as well as by the daemon.

var MARKDOWN_BASENAMES = ["prd.md", "design.md", "implement.md"];
var MARKDOWN_MAX_BYTES = 256 * 1024;
var MARKDOWN_REQUEST_KEYS = ["requestId", "kind", "projectId", "taskId", "document"];
var ARCHIVE_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
var ARCHIVE_LIMITS = {
    monthLimit: 48,
    taskDirectoryLimit: 2048,
    pageSizeDefault: 16,
    pageSizeMaximum: 32,
    pageMaximum: 63,
    warningLimit: 8
};

function _failure(reason, message, extra) {
    var result = {
        ok: false,
        reason: reason,
        message: message || reason
    };
    if (extra) {
        for (var key in extra)
            result[key] = extra[key];
    }
    return result;
}

function _success(path, extra) {
    var result = {
        ok: true,
        path: path
    };
    if (extra) {
        for (var key in extra)
            result[key] = extra[key];
    }
    return result;
}

function _string(value) {
    return typeof value === "string" ? value : "";
}

function hasControlCharacters(value) {
    return /[\u0000-\u001f\u007f]/.test(_string(value));
}

function markdownByteLimit() {
    return MARKDOWN_MAX_BYTES;
}

function utf8ByteLength(value) {
    var text = _string(value);
    var length = 0;
    for (var i = 0; i < text.length; i++) {
        var code = text.charCodeAt(i);
        if (code < 0x80) {
            length += 1;
        } else if (code < 0x800) {
            length += 2;
        } else if (code >= 0xd800 && code <= 0xdbff
                && i + 1 < text.length) {
            var next = text.charCodeAt(i + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
                length += 4;
                i += 1;
            } else {
                length += 3;
            }
        } else {
            length += 3;
        }
    }
    return length;
}

function _requestString(value, maximum, reason) {
    if (typeof value !== "string")
        return _failure(reason, "Request field must be text");
    var text = value.trim();
    if (!text || text.length > maximum || hasControlCharacters(text))
        return _failure(reason, "Request field is invalid");
    return { ok: true, value: text };
}

function validateMarkdownRequest(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return _failure("markdown_request", "Markdown request must be an object");

    for (var key in value) {
        if (MARKDOWN_REQUEST_KEYS.indexOf(key) === -1)
            return _failure("markdown_request_field", "Markdown request contains an unsupported field");
    }

    var requestId = _requestString(value.requestId, 128, "markdown_request_id");
    if (!requestId.ok)
        return requestId;
    if (value.kind !== "markdown")
        return _failure("markdown_request_kind", "Markdown request kind is invalid", {
            requestId: requestId.value
        });
    var projectId = _requestString(value.projectId, 4096, "markdown_project_id");
    if (!projectId.ok)
        return _failure(projectId.reason, projectId.message, { requestId: requestId.value });
    var taskId = _requestString(value.taskId, 256, "markdown_task_id");
    if (!taskId.ok)
        return _failure(taskId.reason, taskId.message, { requestId: requestId.value });
    var document = _requestString(value.document, 32, "markdown_document");
    if (!document.ok || MARKDOWN_BASENAMES.indexOf(document.value) === -1) {
        return _failure("markdown_name", "Markdown basename is not allowed", {
            requestId: requestId.value
        });
    }

    return {
        ok: true,
        request: {
            requestId: requestId.value,
            kind: "markdown",
            projectId: projectId.value,
            taskId: taskId.value,
            document: document.value
        }
    };
}

function archiveLimits() {
    return {
        monthLimit: ARCHIVE_LIMITS.monthLimit,
        taskDirectoryLimit: ARCHIVE_LIMITS.taskDirectoryLimit,
        pageSizeDefault: ARCHIVE_LIMITS.pageSizeDefault,
        pageSizeMaximum: ARCHIVE_LIMITS.pageSizeMaximum,
        pageMaximum: ARCHIVE_LIMITS.pageMaximum,
        warningLimit: ARCHIVE_LIMITS.warningLimit
    };
}

function isArchiveMonth(value) {
    return typeof value === "string"
        && ARCHIVE_MONTH_PATTERN.test(value)
        && !hasControlCharacters(value);
}

function isArchiveTaskDirectoryName(value) {
    return typeof value === "string" && value.length > 0 && value.length <= 256
        && value !== "." && value !== ".."
        && value.indexOf("/") === -1 && value.indexOf("\\") === -1
        && !hasControlCharacters(value);
}

function normalizeArchivePage(page, pageSize) {
    var numericPage = Number(page);
    var numericSize = Number(pageSize);
    var invalid = false;
    var clamped = false;

    if (!isFinite(numericPage) || Math.floor(numericPage) !== numericPage) {
        numericPage = 0;
        invalid = true;
    }
    if (numericPage < 0) {
        numericPage = 0;
        clamped = true;
    } else if (numericPage > ARCHIVE_LIMITS.pageMaximum) {
        numericPage = ARCHIVE_LIMITS.pageMaximum;
        clamped = true;
    }

    if (!isFinite(numericSize) || Math.floor(numericSize) !== numericSize) {
        numericSize = ARCHIVE_LIMITS.pageSizeDefault;
        invalid = true;
    }
    if (numericSize < 1) {
        numericSize = 1;
        clamped = true;
    } else if (numericSize > ARCHIVE_LIMITS.pageSizeMaximum) {
        numericSize = ARCHIVE_LIMITS.pageSizeMaximum;
        clamped = true;
    }

    return {
        page: numericPage,
        pageSize: numericSize,
        offset: numericPage * numericSize,
        invalid: invalid,
        clamped: clamped
    };
}

function _hasOnlyKeys(value, allowed) {
    for (var key in value) {
        if (allowed.indexOf(key) === -1)
            return false;
    }
    return true;
}

function validateArchiveRequest(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return _failure("archive_request", "Archive request must be an object");

    var requestId = _requestString(value.requestId, 128, "archive_request_id");
    if (!requestId.ok)
        return requestId;
    var kind = value.kind;
    if (["archive-index", "archive-page", "archive-task"].indexOf(kind) === -1) {
        return _failure("archive_request_kind", "Archive request kind is invalid", {
            requestId: requestId.value
        });
    }
    var allowed = kind === "archive-index"
        ? ["requestId", "kind", "projectId", "page", "pageSize"]
        : (kind === "archive-page"
            ? ["requestId", "kind", "projectId", "month", "page", "pageSize"]
            : ["requestId", "kind", "projectId", "month", "taskId", "dirName", "document"]);
    if (!_hasOnlyKeys(value, allowed)) {
        return _failure("archive_request_field", "Archive request contains an unsupported field", {
            requestId: requestId.value
        });
    }

    var projectId = _requestString(value.projectId, 4096, "archive_project_id");
    if (!projectId.ok)
        return _failure(projectId.reason, projectId.message, { requestId: requestId.value });
    var request = {
        requestId: requestId.value,
        kind: kind,
        projectId: projectId.value
    };

    if (kind === "archive-index") {
        var indexPage = normalizeArchivePage(value.page, value.pageSize);
        request.page = indexPage.page;
        request.pageSize = indexPage.pageSize;
        request.pageNormalized = indexPage.invalid || indexPage.clamped;
        return { ok: true, request: request };
    }

    if (!isArchiveMonth(value.month)) {
        return _failure("archive_month_invalid", "Archive month must use YYYY-MM", {
            requestId: requestId.value
        });
    }
    request.month = value.month;
    if (kind === "archive-page") {
        var page = normalizeArchivePage(value.page, value.pageSize);
        request.page = page.page;
        request.pageSize = page.pageSize;
        request.pageNormalized = page.invalid || page.clamped;
        return { ok: true, request: request };
    }

    var taskId = _requestString(value.taskId, 256, "archive_task_id");
    if (!taskId.ok)
        return _failure(taskId.reason, taskId.message, { requestId: requestId.value });
    if (!isArchiveTaskDirectoryName(value.dirName)) {
        return _failure("archive_task_directory", "Archive task directory name is invalid", {
            requestId: requestId.value
        });
    }
    var document = _requestString(value.document, 32, "archive_document");
    if (!document.ok || MARKDOWN_BASENAMES.indexOf(document.value) === -1) {
        return _failure("markdown_name", "Markdown basename is not allowed", {
            requestId: requestId.value
        });
    }
    request.taskId = taskId.value;
    request.dirName = value.dirName;
    request.document = document.value;
    return { ok: true, request: request };
}

function stripFileScheme(value) {
    var text = _string(value);
    if (text.indexOf("file:///") === 0)
        return text.slice("file://".length);
    if (text.indexOf("file://") === 0)
        return null;
    return text;
}

function isAbsolutePath(value) {
    var text = _string(value);
    return text.charAt(0) === "/"
        || /^[A-Za-z]:[\\/]/.test(text)
        || text.indexOf("\\\\") === 0;
}

function _normalizePath(value, requireAbsolute, rejectTraversal) {
    var stripped = stripFileScheme(value);
    if (stripped === null)
        return _failure("unsupported_uri", "only file:/// paths are supported");
    if (!stripped)
        return _failure("empty", "path is empty");
    if (hasControlCharacters(stripped))
        return _failure("control_character", "path contains a control character");

    // Discovery output is always POSIX, while session pointers can be written
    // by tools that use either separator.  Normalizing here keeps the policy
    // identical for both inputs without invoking a shell or host path API.
    var text = stripped.replace(/\\/g, "/");
    var absolute = isAbsolutePath(stripped) || text.charAt(0) === "/";
    if (requireAbsolute && !absolute)
        return _failure("not_absolute", "path must be absolute");
    if (!requireAbsolute && absolute)
        return _failure("absolute", "path must be relative");

    var parts = text.split("/");
    var stack = [];
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (!part || part === ".")
            continue;
        if (part === "..") {
            if (rejectTraversal)
                return _failure("traversal", "parent traversal is not allowed");
            if (!stack.length) {
                if (absolute)
                    continue;
                return _failure("traversal", "path escapes its root");
            }
            stack.pop();
            continue;
        }
        stack.push(part);
    }

    if (!stack.length && !absolute)
        return _failure("empty", "path is empty after normalization");

    var normalized = (absolute ? "/" : "") + stack.join("/");
    if (absolute && normalized === "")
        normalized = "/";
    return _success(normalized, {
        absolute: absolute
    });
}

function normalizeAbsolutePath(value) {
    return _normalizePath(value, true, false);
}

function ancestorPaths(value, maxCount) {
    var normalized = normalizeAbsolutePath(value);
    if (!normalized.ok)
        return [];

    var limit = Number(maxCount);
    if (!isFinite(limit) || limit < 1)
        return [];
    limit = Math.floor(limit);
    if (limit < 1)
        return [];

    var candidates = [];
    var current = normalized.path;
    while (candidates.length < limit) {
        candidates.push(current);
        if (current === "/")
            break;
        var parent = parentPath(current);
        if (!parent || parent === current)
            break;
        current = parent;
    }
    return candidates;
}

function normalizeProjectRoot(value) {
    return normalizeAbsolutePath(value);
}

function normalizeProjectRoots(value) {
    var values;
    if (Array.isArray(value))
        values = value;
    else
        values = [value];

    var roots = [];
    var warnings = [];
    if (!values.length)
        warnings.push({ code: "root_empty", message: "no project root is configured" });

    for (var i = 0; i < values.length; i++) {
        var normalized = normalizeProjectRoot(values[i]);
        if (!normalized.ok) {
            warnings.push({
                code: values[i] ? "root_invalid" : "root_empty",
                message: "project root rejected: " + normalized.reason,
                reason: normalized.reason
            });
            continue;
        }
        if (roots.indexOf(normalized.path) === -1)
            roots.push(normalized.path);
        else
            warnings.push({ code: "root_duplicate", message: "duplicate project root ignored" });
    }

    return {
        roots: roots,
        warnings: warnings
    };
}

function normalizeRelativePointer(pointer) {
    var normalized = _normalizePath(pointer, false, true);
    if (!normalized.ok)
        return normalized;
    if (!normalized.path)
        return _failure("empty", "pointer is empty");
    return {
        ok: true,
        relativePath: normalized.path,
        path: normalized.path
    };
}

function joinPath(base, child) {
    var baseText = _string(base);
    var left = baseText.replace(/[\\/]+$/, "");
    var right = _string(child).replace(/^[\\/]+/, "");
    if (!left)
        return baseText.charAt(0) === "/" ? "/" + right : right;
    if (!right)
        return left;
    return left + "/" + right;
}

function basename(path) {
    var text = _string(path).replace(/[\\/]+$/, "");
    var index = text.lastIndexOf("/");
    return index === -1 ? text : text.slice(index + 1);
}

function parentPath(path) {
    var text = _string(path).replace(/[\\/]+$/, "");
    var index = text.lastIndexOf("/");
    if (index <= 0)
        return index === 0 ? "/" : "";
    return text.slice(0, index);
}

function isWithin(path, parent, allowEqual) {
    var childResult = normalizeAbsolutePath(path);
    var parentResult = normalizeAbsolutePath(parent);
    if (!childResult.ok || !parentResult.ok)
        return false;
    var child = childResult.path;
    var ancestor = parentResult.path;
    if (child === ancestor)
        return !!allowEqual;
    if (ancestor === "/")
        return child.charAt(0) === "/";
    return child.indexOf(ancestor + "/") === 0;
}

function tasksRootPath(projectRoot) {
    return joinPath(projectRoot, ".trellis/tasks");
}

function archiveRootPath(projectRoot) {
    return joinPath(tasksRootPath(projectRoot), "archive");
}

function runtimeSessionsPath(projectRoot) {
    return joinPath(projectRoot, ".trellis/.runtime/sessions");
}

function _candidatePath(candidate, canonicalCandidate) {
    return canonicalCandidate || candidate;
}

function resolveTaskDirectory(projectRoot, candidate, canonicalCandidate, options) {
    var root = normalizeProjectRoot(projectRoot);
    if (!root.ok)
        return _failure("project_root", "project root is invalid");

    var candidateResult = normalizeAbsolutePath(_candidatePath(candidate, canonicalCandidate));
    if (!candidateResult.ok)
        return _failure(candidateResult.reason, "task directory is not canonical absolute path");
    var taskPath = candidateResult.path;
    var tasksRoot = tasksRootPath(root.path);
    var archiveRoot = archiveRootPath(root.path);
    var allowArchive = !!(options && options.allowArchive);
    var kind = "live";

    if (taskPath === tasksRoot || taskPath === archiveRoot)
        return _failure("tasks_root", "tasks directory itself is not a task");

    if (isWithin(taskPath, archiveRoot, false)) {
        if (!allowArchive)
            return _failure("archive_not_enabled", "archive paths require explicit read-only opt-in");
        kind = "archive";
    } else if (isWithin(taskPath, tasksRoot, false)) {
        kind = "live";
    } else {
        return _failure("outside_tasks", "task directory is outside the allowed tasks subtree");
    }

    return _success(taskPath, {
        kind: kind,
        taskDir: taskPath,
        taskJsonPath: joinPath(taskPath, "task.json")
    });
}

function resolveArchiveRoot(projectRoot, candidate, canonicalCandidate) {
    var root = normalizeProjectRoot(projectRoot);
    if (!root.ok)
        return _failure("project_root", "project root is invalid");
    var candidateResult = normalizeAbsolutePath(_candidatePath(candidate, canonicalCandidate));
    if (!candidateResult.ok)
        return _failure(candidateResult.reason, "archive root is not canonical absolute path");
    if (candidateResult.path !== archiveRootPath(root.path))
        return _failure("archive_root", "archive root is not the project archive directory");
    return _success(candidateResult.path, { kind: "archive-root" });
}

function resolveArchiveMonth(projectRoot, month, candidate, canonicalCandidate) {
    var root = normalizeProjectRoot(projectRoot);
    if (!root.ok)
        return _failure("project_root", "project root is invalid");
    if (!isArchiveMonth(month))
        return _failure("archive_month_invalid", "archive month must use YYYY-MM");

    var expected = joinPath(archiveRootPath(root.path), month);
    var lexical = normalizeAbsolutePath(candidate || expected);
    var canonical = normalizeAbsolutePath(_candidatePath(expected, canonicalCandidate));
    if (!lexical.ok || lexical.path !== expected)
        return _failure("archive_month_location", "archive month must be directly inside the archive root");
    if (!canonical.ok || canonical.path !== expected)
        return _failure("archive_month_canonical", "archive month canonical path escaped its direct location");
    return _success(expected, {
        kind: "archive-month",
        month: month,
        monthDir: expected
    });
}

function resolveArchiveTask(projectRoot, month, dirName, candidate, canonicalCandidate) {
    if (!isArchiveTaskDirectoryName(dirName))
        return _failure("archive_task_directory", "archive task directory name is invalid");
    var monthResult = resolveArchiveMonth(projectRoot, month,
        joinPath(archiveRootPath(projectRoot), month),
        joinPath(archiveRootPath(projectRoot), month));
    if (!monthResult.ok)
        return monthResult;

    var expected = joinPath(monthResult.monthDir, dirName);
    var lexical = normalizeAbsolutePath(candidate || expected);
    var canonical = normalizeAbsolutePath(_candidatePath(expected, canonicalCandidate));
    if (!lexical.ok || lexical.path !== expected
            || !canonical.ok || canonical.path !== expected) {
        return _failure("archive_task_location", "archive task must be a direct canonical child of its month");
    }
    var task = resolveTaskDirectory(projectRoot, expected, canonical.path, {
        allowArchive: true
    });
    if (!task.ok || task.kind !== "archive"
            || parentPath(task.taskDir) !== monthResult.monthDir) {
        return _failure(task.reason || "archive_task_location",
            "archive task directory was rejected");
    }
    task.month = month;
    task.dirName = dirName;
    return task;
}

function resolveTaskJson(taskResult, canonicalJson) {
    if (!taskResult || !taskResult.ok)
        return _failure("task_directory", "a validated task directory is required");
    var jsonPath = _candidatePath(taskResult.taskJsonPath, canonicalJson);
    var jsonResult = normalizeAbsolutePath(jsonPath);
    if (!jsonResult.ok)
        return _failure(jsonResult.reason, "task.json is not canonical absolute path");
    if (basename(jsonResult.path) !== "task.json"
            || parentPath(jsonResult.path) !== taskResult.taskDir) {
        return _failure("task_json_location", "task.json must be directly inside the task directory");
    }
    return _success(jsonResult.path, {
        taskJson: jsonResult.path
    });
}

function resolveVersionFile(projectRoot, trellisDir, canonicalPath) {
    var root = normalizeProjectRoot(projectRoot);
    var trellis = normalizeAbsolutePath(trellisDir);
    if (!root.ok || !trellis.ok)
        return _failure("project_root", "project or Trellis root is invalid");
    var versionPath = _candidatePath(joinPath(trellis.path, ".version"), canonicalPath);
    var version = normalizeAbsolutePath(versionPath);
    if (!version.ok)
        return _failure(version.reason, "version path is not canonical absolute path");
    if (basename(version.path) !== ".version" || parentPath(version.path) !== trellis.path)
        return _failure("version_location", ".version must be directly inside .trellis");
    if (trellis.path !== joinPath(root.path, ".trellis"))
        return _failure("outside_project", ".trellis is outside the configured project");
    return _success(version.path);
}

function resolveRuntimeSessionsDirectory(projectRoot, trellisDir, canonicalPath) {
    var root = normalizeProjectRoot(projectRoot);
    var trellis = normalizeAbsolutePath(trellisDir);
    var sessions = normalizeAbsolutePath(_candidatePath(joinPath(trellis.path, ".runtime/sessions"), canonicalPath));
    if (!root.ok || !trellis.ok || !sessions.ok)
        return _failure("runtime_root", "runtime sessions path is invalid");
    if (sessions.path !== joinPath(trellis.path, ".runtime/sessions"))
        return _failure("runtime_location", "runtime sessions path is not canonical");
    if (trellis.path !== joinPath(root.path, ".trellis"))
        return _failure("outside_project", "runtime sessions are outside the project");
    return _success(sessions.path);
}

function resolveSessionFile(projectRoot, sessionsRoot, candidate, canonicalCandidate) {
    var root = normalizeProjectRoot(projectRoot);
    var sessions = normalizeAbsolutePath(sessionsRoot);
    var candidateResult = normalizeAbsolutePath(_candidatePath(candidate, canonicalCandidate));
    if (!root.ok || !sessions.ok || !candidateResult.ok)
        return _failure("session_file", "session file is not canonical absolute path");
    var sessionPath = candidateResult.path;
    if (parentPath(sessionPath) !== sessions.path || !/^[^/]+\.json$/.test(basename(sessionPath)))
        return _failure("session_location", "session JSON must be directly inside runtime sessions");
    if (sessions.path !== runtimeSessionsPath(root.path))
        return _failure("outside_project", "session file is outside the project");
    return _success(sessionPath, {
        sessionKey: basename(sessionPath).slice(0, -5)
    });
}

function resolveSessionPointer(projectRoot, pointer, canonicalCandidate, options) {
    var root = normalizeProjectRoot(projectRoot);
    if (!root.ok)
        return _failure("project_root", "project root is invalid");
    var relative = normalizeRelativePointer(pointer);
    if (!relative.ok)
        return relative;
    var lexicalPath = joinPath(root.path, relative.relativePath);
    var taskResult = resolveTaskDirectory(root.path, lexicalPath, canonicalCandidate, options);
    if (!taskResult.ok)
        return taskResult;
    return _success(taskResult.path, {
        relativePath: relative.relativePath,
        taskDir: taskResult.taskDir,
        kind: taskResult.kind,
        taskJsonPath: taskResult.taskJsonPath
    });
}

function resolveMarkdownFile(taskDir, name, canonicalPath) {
    var task = normalizeAbsolutePath(taskDir);
    if (!task.ok)
        return _failure("task_directory", "task directory is invalid");
    var basenameValue = _string(name);
    if (MARKDOWN_BASENAMES.indexOf(basenameValue) === -1)
        return _failure("markdown_name", "Markdown basename is not allowed");
    var candidate = _candidatePath(joinPath(task.path, basenameValue), canonicalPath);
    var resolved = normalizeAbsolutePath(candidate);
    if (!resolved.ok)
        return _failure(resolved.reason, "Markdown path is not canonical absolute path");
    if (basename(resolved.path) !== basenameValue || parentPath(resolved.path) !== task.path)
        return _failure("markdown_location", "Markdown must be directly inside the validated task directory");
    return _success(resolved.path, {
        basename: basenameValue
    });
}

function parseCanonicalOutput(output) {
    var text = _string(output).trim();
    if (!text)
        return _failure("empty_output", "canonicalizer returned no path");
    if (/\r?\n/.test(text))
        return _failure("multiple_lines", "canonicalizer returned multiple paths");
    if (hasControlCharacters(text))
        return _failure("control_character", "canonicalizer returned a control character");
    return normalizeAbsolutePath(text);
}

function parseBoundedLines(output, maxLines, maxCharacters) {
    var text = _string(output);
    var lines = [];
    var warnings = [];
    var truncated = false;
    if (text.length > maxCharacters) {
        text = text.slice(0, maxCharacters);
        truncated = true;
        warnings.push({ code: "command_output_limit", message: "discovery output exceeded its byte limit" });
    }
    var rawLines = text.split(/\r?\n/);
    for (var i = 0; i < rawLines.length; i++) {
        var line = rawLines[i].trim();
        if (!line)
            continue;
        if (hasControlCharacters(line)) {
            warnings.push({ code: "malformed_discovery_line", message: "discovery line contains a control character" });
            continue;
        }
        if (lines.length >= maxLines) {
            truncated = true;
            continue;
        }
        lines.push(line);
    }
    if (truncated)
        warnings.push({ code: "discovery_limit", message: "discovery result cap reached" });
    return {
        lines: lines,
        warnings: warnings,
        truncated: truncated
    };
}

function allowedMarkdownNames() {
    return MARKDOWN_BASENAMES.slice();
}

// Short aliases keep the boundary easy to discover for QML callers and tests.
var normalizePointer = normalizeRelativePointer;
var normalizeRoots = normalizeProjectRoots;
var isWithinRoot = isWithin;
var resolveTaskDir = resolveTaskDirectory;
var resolveArchive = resolveArchiveRoot;
var resolvePointer = resolveSessionPointer;
var resolveMarkdown = resolveMarkdownFile;
