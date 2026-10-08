import QtQuick
import Quickshell.Io
import qs.Common
import qs.Widgets
import qs.Modules.Plugins
import "lib/trellisPaths.js" as TrellisPaths
import "lib/trellisParser.js" as TrellisParser
import "lib/trellisWatch.js" as TrellisWatch
import "lib/trellisdiscovery.js" as TrellisDiscovery
import "lib/trellisprojection.js" as TrellisProjection
import "lib/trellischanges.js" as TrellisChanges

PluginComponent {
    id: root

    // v0.4 keeps the v0.3 bounded, argv-only scan and adds a daemon-owned
    // known-file watcher registry plus a low-frequency topology rescan.
    readonly property int maxProjects: 32
    readonly property int maxScanRoots: 16
    readonly property int maxTasksPerProject: 128
    readonly property int maxSessionsPerProject: 128
    readonly property int maxDiscoveryDepth: 4
    readonly property int maxAncestorCandidates: 8
    readonly property int maxCommandBytes: 256 * 1024
    readonly property int maxJsonBytes: 1024 * 1024
    readonly property int maxMarkdownBytes: TrellisPaths.markdownByteLimit()
    readonly property var archiveLimits: TrellisPaths.archiveLimits()
    readonly property int maxArchiveMonths: archiveLimits.monthLimit
    readonly property int maxArchiveTaskDirectories: archiveLimits.taskDirectoryLimit
    readonly property int maxArchiveWarnings: archiveLimits.warningLimit
    readonly property int maxWarnings: 256
    readonly property int maxKnownWatchers: 512
    readonly property int maxPendingKnownReloads: 256
    readonly property int knownReloadDebounceMs: 200
    readonly property int warningCooldownMs: 5000
    readonly property var topologyIntervalPolicy: TrellisWatch.topologyIntervalDefaults()
    readonly property int topologyIntervalDefault: topologyIntervalPolicy.defaultValue
    readonly property string verifiedTrellisVersion: "0.6.17"

    property int scanGeneration: 0
    // Publication provenance is independent of scan/reload cancellation.
    property string observationEpoch: new Date().toISOString() + "-" + Math.random().toString(36).slice(2)
    property double publicationGeneration: 0
    property var changeTracker: TrellisChanges.createTracker(observationEpoch)
    property var observationPreferences: null
    property var activeScan: null
    property var ownedProcesses: []
    property var ownedReaders: []
    property var ownedWatchers: []
    property var knownWatchers: ({})
    property var knownFileRegistry: ({})
    property var pendingKnownPaths: ({})
    property var pendingKnownWarnings: []
    property bool knownReloadInFlight: false
    property var currentInputs: []
    property var currentWarnings: []
    property var currentBaseWarnings: []
    property var lastGoodInputs: null
    property var lastGoodSnapshot: null
    property string lastGoodRootsKey: ""
    property string scanStartedAt: ""
    property string lastSuccessfulDiscoveryAt: ""
    property bool snapshotIsCurrent: false
    property bool lastGoodFallbackActive: false
    property var warningLedger: ({})
    property var warningLedgerOrder: []
    property int topologyIntervalSeconds: topologyIntervalDefault
    property var observedTopologySettings: null
    property int detailGeneration: 0
    property string currentDetailRequestId: ""
    property var currentDetailRequest: null
    property string currentDetailRootsKey: ""
    property string currentDetailProjectRoot: ""
    property var ownedDetailProcesses: []
    property var ownedDetailReaders: []
    property int searchGeneration: 0
    property string currentSearchRequestId: ""
    property var searchSession: null
    property var ownedSearchProcesses: []
    property var ownedSearchReaders: []
    property int searchCursorSerial: 0
    readonly property int maxSearchJsonPerBatch: 128
    readonly property int maxSearchListingsPerBatch: 16
    readonly property int maxSearchResults: 64

    property int actionGeneration: 0
    property var currentAction: null
    property var pendingActionRequest: null
    property var ownedActionProcesses: []
    property var ownedActionReaders: []

    PluginGlobalVar {
        id: actionRequestVar
        varName: "actionRequest"
        defaultValue: null
        onValueChanged: {
            var request = value;
            root.pendingActionRequest = request;
            Qt.callLater(function () { root._handleActionRequest(request); });
        }
    }

    PluginGlobalVar {
        id: actionResponseVar
        varName: "actionResponse"
        defaultValue: null
    }

    PluginGlobalVar {
        id: recentChangesVar
        varName: "recentChanges"
        defaultValue: null
    }

    PluginGlobalVar {
        id: detailRequestVar
        varName: "detailRequest"
        defaultValue: null
        onValueChanged: {
            var request = value;
            Qt.callLater(function () { root._handleDetailRequest(request); });
        }
    }

    PluginGlobalVar {
        id: detailResponseVar
        varName: "detailResponse"
        defaultValue: null
    }

    PluginGlobalVar {
        id: searchRequestVar
        varName: "searchRequest"
        defaultValue: null
        onValueChanged: {
            var request = value;
            Qt.callLater(function () { root._handleSearchRequest(request); });
        }
    }

    PluginGlobalVar {
        id: searchResponseVar
        varName: "searchResponse"
        defaultValue: null
    }

    Timer {
        id: topologyTimer
        repeat: false
        interval: root.topologyIntervalSeconds * 1000
        onTriggered: root.startScan("interval")
    }

    Timer {
        id: knownReloadTimer
        repeat: false
        interval: root.knownReloadDebounceMs
        onTriggered: root._flushKnownReload()
    }

    Timer {
        id: settingsRefreshTimer
        repeat: false
        interval: 100
        onTriggered: root.startScan("settings")
    }

    Component {
        id: processComponent

        Process {
            id: proc
            property int generation: 0
            property var callback: null
            property string capturedOutput: ""
            property var ownerRoot: null
            property string ownedList: ""

            stdout: StdioCollector {
                onStreamFinished: proc.capturedOutput = text || ""
            }

            onExited: function (exitCode) {
                var fn = callback;
                var output = capturedOutput;
                callback = null;
                if (ownerRoot)
                    ownerRoot._untrack(ownedList, this);
                Qt.callLater(function () {
                    if (fn)
                        fn(output, exitCode);
                    proc.destroy();
                });
            }
        }
    }

    Component {
        id: fileViewComponent

        FileView {
            id: fv
            property int generation: 0
            property var callback: null
            property var ownerRoot: null
            property string ownedList: ""
            blockWrites: true
            atomicWrites: true
            preload: true
            printErrors: false

            onLoaded: {
                var fn = callback;
                callback = null;
                var value = text();
                var oversized = typeof value === "string" && value.length > root.maxJsonBytes;
                if (ownerRoot)
                    ownerRoot._untrack(ownedList, this);
                Qt.callLater(function () {
                    if (fn)
                        fn(oversized ? "" : value, oversized ? "size_limit" : null);
                    fv.destroy();
                });
            }

            onLoadFailed: function (error) {
                var fn = callback;
                callback = null;
                if (ownerRoot)
                    ownerRoot._untrack(ownedList, this);
                Qt.callLater(function () {
                    if (fn)
                        fn("", "file_load_failed:" + error);
                    fv.destroy();
                });
            }
        }
    }

    Component {
        id: knownWatcherComponent

        FileView {
            id: watcher
            property int generation: 0
            property string watchedPath: ""
            property var ownerRoot: null
            blockWrites: true
            atomicWrites: true
            preload: true
            watchChanges: true
            printErrors: false

            onFileChanged: {
                if (ownerRoot)
                    ownerRoot._onKnownFileChanged(watchedPath, generation);
            }
        }
    }

    Component {
        id: detailFileViewComponent

        FileView {
            id: detailFile
            property int generation: 0
            property string requestId: ""
            property var callback: null
            property var ownerRoot: null
            property string ownedList: "ownedDetailReaders"
            property int byteLimit: root.maxMarkdownBytes
            property string errorPrefix: "markdown"
            blockWrites: true
            atomicWrites: true
            preload: true
            printErrors: false

            onLoaded: {
                var fn = callback;
                callback = null;
                var value = text();
                var error = TrellisPaths.utf8ByteLength(value) > byteLimit
                    ? errorPrefix + "_size_limit" : null;
                if (ownerRoot)
                    ownerRoot._untrack(ownedList, this);
                Qt.callLater(function () {
                    if (fn)
                        fn(error ? "" : value, error);
                    detailFile.destroy();
                });
            }

            onLoadFailed: function (error) {
                var fn = callback;
                callback = null;
                if (ownerRoot)
                    ownerRoot._untrack(ownedList, this);
                Qt.callLater(function () {
                    if (fn)
                        fn("", errorPrefix + "_read_failed:" + error);
                    detailFile.destroy();
                });
            }
        }
    }

    function _isCurrent(generation) {
        return generation === root.scanGeneration && root.activeScan
            && root.activeScan.generation === generation;
    }

    function _isCurrentDetail(generation, requestId) {
        return generation === root.detailGeneration
            && requestId === root.currentDetailRequestId;
    }

    function _cloneValue(value) {
        if (value === null || value === undefined)
            return value;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            return value;
        }
    }

    function _allowWarning(warning) {
        var result = TrellisWatch.recordWarning(root.warningLedger,
            root.warningLedgerOrder, warning, Date.now(),
            root.warningCooldownMs, root.maxWarnings);
        root.warningLedger = result.ledger;
        root.warningLedgerOrder = result.order;
        if (result.suppressedCount)
            warning.suppressedCount = result.suppressedCount;
        return result.accepted;
    }

    function _pushWarning(scan, warning) {
        if (!scan || !warning)
            return;
        if (!scan.warnings)
            scan.warnings = [];
        var accepted = _allowWarning(warning);
        var duplicate = false;
        var warningKey = TrellisWatch.warningKey(warning);
        for (var i = 0; i < scan.warnings.length; i++) {
            if (TrellisWatch.warningKey(scan.warnings[i]) === warningKey) {
                duplicate = true;
                break;
            }
        }
        // Suppression prevents duplicate growth, but every newly built
        // Snapshot still retains one useful diagnostic for the condition.
        if ((accepted || !duplicate) && scan.warnings.length < root.maxWarnings)
            scan.warnings.push(warning);
    }

    function _warning(code, message, extra) {
        var result = {
            code: code || "warning",
            message: (message || "warning").toString().slice(0, 240)
        };
        if (extra) {
            for (var key in extra)
                result[key] = extra[key];
        }
        return result;
    }

    function _pushProjectWarning(scan, project, warning) {
        if (!project || !warning)
            return;
        warning = Object.assign({}, warning);
        if (!warning.projectId)
            warning.projectId = project.id || project.root || "unknown";
        if (!project.warnings)
            project.warnings = [];
        var accepted = _allowWarning(warning);
        // A suppressed repeat is represented at most once in this model. This
        // retains a useful diagnostic without allowing a hot file to fill the
        // per-project warning array with duplicate entries.
        var duplicate = false;
        var warningKey = TrellisWatch.warningKey(warning);
        for (var i = 0; i < project.warnings.length; i++) {
            if (TrellisWatch.warningKey(project.warnings[i]) === warningKey) {
                duplicate = true;
                break;
            }
        }
        if ((accepted || !duplicate) && project.warnings.length < root.maxWarnings)
            project.warnings.push(warning);
    }

    function _destroyOwned() {
        topologyTimer.stop();
        knownReloadTimer.stop();
        settingsRefreshTimer.stop();
        var processes = root.ownedProcesses || [];
        for (var i = 0; i < processes.length; i++) {
            if (processes[i])
                processes[i].destroy();
        }
        var readers = root.ownedReaders || [];
        for (var j = 0; j < readers.length; j++) {
            if (readers[j])
                readers[j].destroy();
        }
        root.ownedProcesses = [];
        root.ownedReaders = [];
        root.pendingKnownPaths = ({});
        root.pendingKnownWarnings = [];
        root.knownReloadInFlight = false;
        _destroyWatchers();
    }

    function _cancelDetailRead(clearResponse) {
        root.detailGeneration += 1;
        root.currentDetailRequestId = "";
        root.currentDetailRequest = null;
        root.currentDetailRootsKey = "";
        root.currentDetailProjectRoot = "";
        var processes = root.ownedDetailProcesses || [];
        for (var i = 0; i < processes.length; i++) {
            if (processes[i])
                processes[i].destroy();
        }
        var readers = root.ownedDetailReaders || [];
        for (var j = 0; j < readers.length; j++) {
            if (readers[j])
                readers[j].destroy();
        }
        root.ownedDetailProcesses = [];
        root.ownedDetailReaders = [];
        if (clearResponse)
            detailResponseVar.set(null);
    }

    function _queueDetailProcess(generation, requestId, command, callback) {
        if (!_isCurrentDetail(generation, requestId))
            return false;
        if (!_detailScopeCurrent()) {
            _rejectDetailScope(generation, requestId);
            return false;
        }
        var process = processComponent.createObject(root, {
            generation: generation,
            ownerRoot: root,
            ownedList: "ownedDetailProcesses",
            command: command,
            callback: function (output, exitCode) {
                if (_isCurrentDetail(generation, requestId)) {
                    if (_detailScopeCurrent()) callback(output, exitCode);
                    else _rejectDetailScope(generation, requestId);
                }
            }
        });
        if (!process)
            return false;
        root.ownedDetailProcesses.push(process);
        process.running = true;
        return true;
    }

    function _queueDetailFile(generation, requestId, path, byteLimit,
            errorPrefix, callback) {
        if (!_isCurrentDetail(generation, requestId))
            return false;
        if (!_detailScopeCurrent()) {
            _rejectDetailScope(generation, requestId);
            return false;
        }
        var reader = detailFileViewComponent.createObject(root, {
            generation: generation,
            requestId: requestId,
            ownerRoot: root,
            path: path,
            byteLimit: byteLimit,
            errorPrefix: errorPrefix,
            callback: function (text, error) {
                if (_isCurrentDetail(generation, requestId)) {
                    if (_detailScopeCurrent()) callback(text, error);
                    else _rejectDetailScope(generation, requestId);
                }
            }
        });
        if (!reader)
            return false;
        root.ownedDetailReaders.push(reader);
        return true;
    }

    function _readBoundedDetailFile(generation, requestId, canonicalPath,
            byteLimit, errorPrefix, callback) {
        if (!_queueDetailProcess(generation, requestId,
                ["test", "-f", canonicalPath], function (testOutput, testExitCode) {
            if (testExitCode !== 0) {
                callback("", errorPrefix + "_not_regular");
                return;
            }
            if (!_queueDetailProcess(generation, requestId,
                    ["stat", "-c", "%s", "--", canonicalPath], function (statOutput, statExitCode) {
                var sizeText = (statOutput || "").trim();
                if (statExitCode !== 0 || !/^\d+$/.test(sizeText)) {
                    callback("", errorPrefix + "_stat_failed");
                    return;
                }
                var size = Number(sizeText);
                if (!isFinite(size) || size < 0 || size > byteLimit) {
                    callback("", errorPrefix + "_size_limit");
                    return;
                }
                if (!_queueDetailFile(generation, requestId, canonicalPath,
                        byteLimit, errorPrefix, callback)) {
                    callback("", errorPrefix + "_reader_failed");
                }
            })) {
                callback("", errorPrefix + "_stat_failed");
            }
        })) {
            callback("", errorPrefix + "_type_check_failed");
        }
    }

    function _detailResponse(request, status, content, format, warnings) {
        var response = {
            requestId: request.requestId,
            kind: request.kind,
            status: status,
            projectId: request.projectId,
            taskId: request.taskId,
            document: request.document,
            content: typeof content === "string" ? content : "",
            format: format === "markdown" ? "markdown" : "plain",
            truncated: false,
            warnings: (warnings || []).slice(0, 4)
        };
        if (request.kind === "archive-task") {
            response.month = request.month;
            response.dirName = request.dirName;
        }
        return response;
    }

    function _publishDetailError(generation, request, code, message) {
        if (!_isCurrentDetail(generation, request.requestId))
            return;
        detailResponseVar.set(_detailResponse(request, "error", "", "plain", [{
            code: code,
            message: (message || "Task document could not be loaded.").toString().slice(0, 160)
        }]));
    }

    function _findLiveTaskRecord(project, taskId) {
        var records = project && project.taskRecords ? project.taskRecords : [];
        var found = null;
        for (var i = 0; i < records.length; i++) {
            var record = records[i];
            if (!record)
                continue;
            var sourceId = record.value && typeof record.value.id === "string"
                ? record.value.id.trim() : "";
            var recordId = sourceId || (typeof record.dirName === "string"
                ? record.dirName.trim() : "");
            if (recordId === taskId) {
                if (found) return null;
                found = record;
            }
        }
        return found;
    }

    function _readMarkdownRequest(generation, request, project, taskRecord,
            archiveTaskResult) {
        var taskResult = archiveTaskResult || TrellisPaths.resolveTaskDir(project.root,
            taskRecord.taskDir, taskRecord.taskDir, {});
        var expectedKind = archiveTaskResult ? "archive" : "live";
        if (!taskResult.ok || taskResult.kind !== expectedKind) {
            _publishDetailError(generation, request, "markdown_task_rejected",
                "The selected task is no longer available.");
            return;
        }

        var lexicalPath = TrellisPaths.joinPath(taskResult.taskDir,
            request.document);
        if (!_queueDetailProcess(generation, request.requestId,
                ["realpath", "-e", "--", lexicalPath], function (output, exitCode) {
            if (exitCode !== 0) {
                _publishDetailError(generation, request, "markdown_missing",
                    "This task document is not available.");
                return;
            }
            var canonical = TrellisPaths.parseCanonicalOutput(output);
            if (!canonical.ok) {
                _publishDetailError(generation, request, "markdown_path_rejected",
                    "This task document path was rejected.");
                return;
            }
            var canonicalPath = canonical.path;
            var resolved = TrellisPaths.resolveMarkdownFile(taskResult.taskDir,
                request.document, canonicalPath);
            if (!resolved.ok) {
                _publishDetailError(generation, request, "markdown_path_rejected",
                    "This task document path was rejected.");
                return;
            }

            _readBoundedDetailFile(generation, request.requestId,
                resolved.path, root.maxMarkdownBytes, "markdown",
                function (text, readError) {
                    if (readError) {
                        _publishDetailError(generation, request,
                            readError.indexOf("markdown_size_limit") === 0
                                ? "markdown_size_limit" : "markdown_read_failed",
                            readError.indexOf("markdown_size_limit") === 0
                                ? "This task document exceeds the safe display limit."
                                : "This task document could not be read.");
                        return;
                    }
                    if (text.length === 0) {
                        detailResponseVar.set(_detailResponse(request,
                            "empty", "", "markdown", []));
                        return;
                    }
                    detailResponseVar.set(_detailResponse(request,
                        "ready", text, "markdown", []));
                });
        })) {
            _publishDetailError(generation, request, "markdown_resolver_failed",
                "This task document path check could not start.");
        }
    }

    function _archiveWarning(context, code, message) {
        if (!context || context.warnings.length >= root.maxArchiveWarnings)
            return;
        context.warnings.push({
            code: code,
            message: (message || "Archive data could not be loaded.").toString().slice(0, 160)
        });
    }

    function _archiveResponse(request, status, months, tasks, hasMore, warnings) {
        return {
            requestId: request.requestId,
            kind: request.kind,
            status: status,
            projectId: request.projectId,
            selectedMonth: request.month || (months && months.length
                ? months[0].month : ""),
            page: request.page || 0,
            pageSize: request.pageSize || root.archiveLimits.pageSizeDefault,
            months: (months || []).slice(0, root.maxArchiveMonths),
            tasks: (tasks || []).slice(0, root.archiveLimits.pageSizeMaximum),
            hasMore: !!hasMore,
            warnings: (warnings || []).slice(0, root.maxArchiveWarnings)
        };
    }

    function _publishArchiveError(generation, request, code, message) {
        if (!_isCurrentDetail(generation, request.requestId))
            return;
        detailResponseVar.set(_archiveResponse(request, "error", [], [], false, [{
            code: code,
            message: (message || "Archive data could not be loaded.").toString().slice(0, 160)
        }]));
    }

    function _canonicalizeDetail(generation, requestId, path, callback) {
        return _queueDetailProcess(generation, requestId,
            ["realpath", "-e", "--", path], function (output, exitCode) {
                if (exitCode !== 0) {
                    callback(null, "realpath_failed");
                    return;
                }
                var parsed = TrellisPaths.parseCanonicalOutput(output);
                callback(parsed.ok ? parsed.path : null,
                    parsed.ok ? null : parsed.reason);
            });
    }

    function _boundedArchiveString(value, fallback, maximum) {
        var text = typeof value === "string" ? value.trim() : "";
        if (!text || TrellisPaths.hasControlCharacters(text))
            text = fallback || "";
        return text.slice(0, maximum);
    }

    function _archiveTaskSummary(value, dirName, month, readError) {
        var objectValue = value && typeof value === "object"
            && !Array.isArray(value) ? value : null;
        var id = objectValue
            ? _boundedArchiveString(objectValue.id, dirName, 256) : dirName;
        var titleSource = objectValue && typeof objectValue.title === "string"
            ? objectValue.title : (objectValue ? objectValue.name : "");
        return {
            id: id,
            dirName: dirName,
            month: month,
            title: _boundedArchiveString(titleSource, dirName, 240),
            storedStatus: readError ? "unreadable"
                : _boundedArchiveString(objectValue ? objectValue.status : "",
                    "unknown", 64),
            priority: readError ? "—"
                : _boundedArchiveString(objectValue ? objectValue.priority : "",
                    "—", 32),
            available: !readError && !!objectValue,
            error: readError ? readError.toString().slice(0, 96) : ""
        };
    }

    function _archiveRowError(context, slot, candidate, code, message) {
        var dirName = TrellisPaths.basename(candidate);
        context.rows[slot] = _archiveTaskSummary(null,
            TrellisPaths.isArchiveTaskDirectoryName(dirName) ? dirName : "Unavailable task",
            context.month, code);
        _archiveWarning(context, code, message);
    }

    function _finishArchivePageRow(context) {
        context.pending -= 1;
        if (context.pending !== 0
                || !_isCurrentDetail(context.generation, context.request.requestId))
            return;
        var tasks = [];
        for (var i = 0; i < context.rows.length; i++) {
            if (context.rows[i])
                tasks.push(context.rows[i]);
        }
        var response = _archiveResponse(context.request,
            tasks.length ? "ready" : "empty", context.months, tasks,
            context.hasMore, context.warnings);
        observeArchiveMetadata(context.project, response);
        detailResponseVar.set(response);
    }

    // Reused by metadata consumers after their own current-request/read guards.
    // No archive reads or watchers are initiated by this observation hook.
    function observeArchiveMetadata(project, response) {
        recentChangesVar.set(TrellisChanges.observeArchivePage(root.changeTracker,
            project, response, new Date().toISOString()));
    }

    function _loadArchivePageRow(context, candidate, slot) {
        var request = context.request;
        var generation = context.generation;
        var dirName = TrellisPaths.basename(candidate);
        if (!TrellisPaths.isArchiveTaskDirectoryName(dirName)) {
            _archiveRowError(context, slot, candidate, "archive_layout_unknown",
                "An archive entry has an unsupported task directory name.");
            _finishArchivePageRow(context);
            return;
        }
        if (!_queueDetailProcess(generation, request.requestId,
                ["test", "-d", candidate], function (testOutput, testExitCode) {
            if (testExitCode !== 0) {
                _archiveRowError(context, slot, candidate, "archive_layout_unknown",
                    "An archive task entry is not a directory.");
                _finishArchivePageRow(context);
                return;
            }
            if (!_canonicalizeDetail(generation, request.requestId, candidate,
                    function (canonicalDir, canonicalError) {
                if (!canonicalDir) {
                    _archiveRowError(context, slot, candidate, "archive_task_read_failed",
                        "An archive task directory could not be resolved.");
                    _finishArchivePageRow(context);
                    return;
                }
                var taskResult = TrellisPaths.resolveArchiveTask(context.project.root,
                    context.month, dirName, candidate, canonicalDir);
                if (!taskResult.ok) {
                    _archiveRowError(context, slot, candidate, "archive_task_rejected",
                        "An archive task directory failed canonical validation.");
                    _finishArchivePageRow(context);
                    return;
                }
                if (!_canonicalizeDetail(generation, request.requestId,
                        taskResult.taskJsonPath, function (canonicalJson, jsonError) {
                    if (!canonicalJson) {
                        _archiveRowError(context, slot, candidate,
                            "archive_task_read_failed", "Archive task.json is unavailable.");
                        _finishArchivePageRow(context);
                        return;
                    }
                    var jsonResult = TrellisPaths.resolveTaskJson(taskResult, canonicalJson);
                    if (!jsonResult.ok) {
                        _archiveRowError(context, slot, candidate,
                            "archive_task_rejected", "Archive task.json failed direct-file validation.");
                        _finishArchivePageRow(context);
                        return;
                    }
                    _readBoundedDetailFile(generation, request.requestId,
                        jsonResult.path, root.maxJsonBytes, "archive_task",
                        function (text, readError) {
                            if (readError) {
                                _archiveRowError(context, slot, candidate,
                                    readError.indexOf("size_limit") !== -1
                                        ? "archive_limit" : "archive_task_read_failed",
                                    "Archive task.json could not be read safely.");
                                _finishArchivePageRow(context);
                                return;
                            }
                            var parsed = TrellisParser.parseJson(text);
                            if (!parsed.ok || !parsed.value
                                    || typeof parsed.value !== "object"
                                    || Array.isArray(parsed.value)) {
                                _archiveRowError(context, slot, candidate,
                                    "archive_task_read_failed", "Archive task.json is malformed.");
                            } else {
                                context.rows[slot] = _archiveTaskSummary(parsed.value,
                                    dirName, context.month, null);
                            }
                            _finishArchivePageRow(context);
                        });
                })) {
                    _archiveRowError(context, slot, candidate,
                        "archive_task_read_failed", "Archive task.json path check could not start.");
                    _finishArchivePageRow(context);
                }
            })) {
                _archiveRowError(context, slot, candidate, "archive_task_read_failed",
                    "Archive task path check could not start.");
                _finishArchivePageRow(context);
            }
        })) {
            _archiveRowError(context, slot, candidate, "archive_task_read_failed",
                "Archive task type check could not start.");
            _finishArchivePageRow(context);
        }
    }

    function _loadArchivePage(generation, request, project, months, monthResult) {
        if (!_queueDetailProcess(generation, request.requestId,
                ["find", monthResult.monthDir, "-mindepth", "1", "-maxdepth", "1", "-print"],
                function (output, exitCode) {
            if (exitCode !== 0) {
                _publishArchiveError(generation, request, "archive_permission",
                    "The selected archive month could not be listed.");
                return;
            }
            var bounded = TrellisPaths.parseBoundedLines(output || "",
                root.maxArchiveTaskDirectories + 1, root.maxCommandBytes);
            var warnings = [];
            var contextForWarning = { warnings: warnings };
            if (request.pageNormalized)
                _archiveWarning(contextForWarning, "archive_limit",
                    "Archive page selectors were normalized to safe bounds.");
            if (bounded.truncated)
                _archiveWarning(contextForWarning, "archive_limit",
                    "Archive task discovery reached its finite cap.");
            var candidates = bounded.lines.slice(0,
                root.maxArchiveTaskDirectories).sort().reverse();
            var normalizedPage = TrellisPaths.normalizeArchivePage(
                request.page, request.pageSize);
            var offset = normalizedPage.offset;
            var selected = candidates.slice(offset,
                offset + normalizedPage.pageSize);
            // The page selector is itself capped.  Once the maximum page is
            // reached, do not advertise a continuation that would normalize
            // the next request back to this same page forever.
            var hasMore = normalizedPage.page < root.archiveLimits.pageMaximum
                && (bounded.truncated
                    || candidates.length > offset + normalizedPage.pageSize);
            for (var m = 0; m < months.length; m++) {
                if (months[m].month === monthResult.month) {
                    months[m].taskCount = candidates.length;
                    months[m].hasMore = hasMore;
                }
            }
            request.month = monthResult.month;
            request.page = normalizedPage.page;
            request.pageSize = normalizedPage.pageSize;
            if (!selected.length) {
                var emptyResponse = _archiveResponse(request, "empty",
                    months, [], hasMore, warnings);
                observeArchiveMetadata(project, emptyResponse);
                detailResponseVar.set(emptyResponse);
                return;
            }
            var context = {
                generation: generation,
                request: request,
                project: project,
                month: monthResult.month,
                months: months,
                rows: new Array(selected.length),
                pending: selected.length,
                hasMore: hasMore,
                warnings: warnings
            };
            for (var i = 0; i < selected.length; i++)
                _loadArchivePageRow(context, selected[i], i);
        })) {
            _publishArchiveError(generation, request, "archive_unavailable",
                "The selected archive month listing could not start.");
        }
    }

    function _openArchiveMonth(generation, request, project, months, month) {
        var lexicalMonth = TrellisPaths.joinPath(
            TrellisPaths.archiveRootPath(project.root), month);
        if (!_canonicalizeDetail(generation, request.requestId, lexicalMonth,
                function (canonicalMonth, canonicalError) {
            if (!canonicalMonth) {
                _publishArchiveError(generation, request, "archive_month_invalid",
                    "The selected archive month is no longer available.");
                return;
            }
            var monthResult = TrellisPaths.resolveArchiveMonth(project.root,
                month, lexicalMonth, canonicalMonth);
            if (!monthResult.ok) {
                _publishArchiveError(generation, request, "archive_month_invalid",
                    "The selected archive month failed canonical validation.");
                return;
            }
            _loadArchivePage(generation, request, project, months, monthResult);
        })) {
            _publishArchiveError(generation, request, "archive_unavailable",
                "The archive month path check could not start.");
        }
    }

    function _loadArchiveIndex(generation, request, project) {
        var archiveRoot = TrellisPaths.archiveRootPath(project.root);
        if (!_canonicalizeDetail(generation, request.requestId, archiveRoot,
                function (canonicalArchive, archiveError) {
            if (!canonicalArchive) {
                _publishArchiveError(generation, request, "archive_unavailable",
                    "This project has no accessible archive directory.");
                return;
            }
            var archiveResult = TrellisPaths.resolveArchive(project.root,
                archiveRoot, canonicalArchive);
            if (!archiveResult.ok) {
                _publishArchiveError(generation, request, "archive_layout_unknown",
                    "The archive root failed canonical validation.");
                return;
            }
            if (!_queueDetailProcess(generation, request.requestId,
                    ["find", archiveResult.path, "-mindepth", "1", "-maxdepth", "1", "-print"],
                    function (output, exitCode) {
                if (exitCode !== 0) {
                    _publishArchiveError(generation, request, "archive_permission",
                        "The archive directory could not be listed.");
                    return;
                }
                var bounded = TrellisPaths.parseBoundedLines(output || "",
                    root.maxArchiveMonths + 1, root.maxCommandBytes);
                var indexContext = {
                    warnings: [],
                    months: [],
                    pending: 0,
                    queueing: true,
                    hadEntries: bounded.lines.length > 0
                };
                if (bounded.truncated)
                    _archiveWarning(indexContext, "archive_limit",
                        "Archive month discovery reached its finite cap.");

                function completeIndex() {
                    if (indexContext.pending !== 0 || indexContext.queueing
                            || !_isCurrentDetail(generation, request.requestId))
                        return;
                    indexContext.months.sort(function (left, right) {
                        return left.month < right.month ? 1
                            : (left.month > right.month ? -1 : 0);
                    });
                    if (!indexContext.months.length) {
                        detailResponseVar.set(_archiveResponse(request,
                            indexContext.hadEntries ? "unknown-layout" : "empty",
                            [], [], false, indexContext.warnings));
                        return;
                    }
                    request.month = indexContext.months[0].month;
                    _openArchiveMonth(generation, request, project,
                        indexContext.months, request.month);
                }

                function finishMonth() {
                    indexContext.pending -= 1;
                    completeIndex();
                }

                var candidates = bounded.lines.slice(0, root.maxArchiveMonths);
                for (var i = 0; i < candidates.length; i++) {
                    var candidate = candidates[i];
                    var month = TrellisPaths.basename(candidate);
                    if (!TrellisPaths.isArchiveMonth(month)) {
                        _archiveWarning(indexContext, "archive_layout_unknown",
                            "An archive entry does not use the YYYY-MM month layout.");
                        continue;
                    }
                    indexContext.pending += 1;
                    (function (monthCandidate, monthValue) {
                        if (!_queueDetailProcess(generation, request.requestId,
                                ["test", "-d", monthCandidate], function (testOutput, testExitCode) {
                            if (testExitCode !== 0) {
                                _archiveWarning(indexContext, "archive_layout_unknown",
                                    "An archive month entry is not a directory.");
                                finishMonth();
                                return;
                            }
                            if (!_canonicalizeDetail(generation, request.requestId,
                                    monthCandidate, function (canonicalMonth, canonicalError) {
                                var resolvedMonth = canonicalMonth
                                    ? TrellisPaths.resolveArchiveMonth(project.root,
                                        monthValue, monthCandidate, canonicalMonth)
                                    : { ok: false };
                                if (resolvedMonth.ok) {
                                    indexContext.months.push({
                                        month: monthValue,
                                        taskCount: null,
                                        hasMore: false
                                    });
                                } else {
                                    _archiveWarning(indexContext, "archive_layout_unknown",
                                        "An archive month failed canonical validation.");
                                }
                                finishMonth();
                            })) {
                                _archiveWarning(indexContext, "archive_unavailable",
                                    "An archive month path check could not start.");
                                finishMonth();
                            }
                        })) {
                            _archiveWarning(indexContext, "archive_unavailable",
                                "An archive month type check could not start.");
                            finishMonth();
                        }
                    })(candidate, month);
                }
                indexContext.queueing = false;
                completeIndex();
            })) {
                _publishArchiveError(generation, request, "archive_unavailable",
                    "The archive listing could not start.");
            }
        })) {
            _publishArchiveError(generation, request, "archive_unavailable",
                "The archive root path check could not start.");
        }
    }

    function _readArchiveTaskRequest(generation, request, project) {
        var lexicalTask = TrellisPaths.joinPath(TrellisPaths.joinPath(
            TrellisPaths.archiveRootPath(project.root), request.month), request.dirName);
        if (!_canonicalizeDetail(generation, request.requestId, lexicalTask,
                function (canonicalTask, canonicalError) {
            var taskResult = canonicalTask
                ? TrellisPaths.resolveArchiveTask(project.root, request.month,
                    request.dirName, lexicalTask, canonicalTask) : { ok: false };
            if (!taskResult.ok) {
                _publishDetailError(generation, request, "archive_task_read_failed",
                    "The selected archived task is no longer available.");
                return;
            }
            if (!_canonicalizeDetail(generation, request.requestId,
                    taskResult.taskJsonPath, function (canonicalJson, jsonError) {
                var jsonResult = canonicalJson
                    ? TrellisPaths.resolveTaskJson(taskResult, canonicalJson) : { ok: false };
                if (!jsonResult.ok) {
                    _publishDetailError(generation, request, "archive_task_read_failed",
                        "The selected archived task identity could not be verified.");
                    return;
                }
                _readBoundedDetailFile(generation, request.requestId,
                    jsonResult.path, root.maxJsonBytes, "archive_task",
                    function (text, readError) {
                        var parsed = readError ? { ok: false }
                            : TrellisParser.parseJson(text);
                        var summary = parsed.ok && parsed.value
                            && typeof parsed.value === "object"
                            && !Array.isArray(parsed.value)
                            ? _archiveTaskSummary(parsed.value, request.dirName,
                                request.month, null) : null;
                        if (!summary || summary.id !== request.taskId) {
                            _publishDetailError(generation, request,
                                "archive_detail_stale",
                                "The selected archived task identity is stale.");
                            return;
                        }
                        _readMarkdownRequest(generation, request, null, null,
                            taskResult);
                    });
            })) {
                _publishDetailError(generation, request, "archive_task_read_failed",
                    "The archived task identity check could not start.");
            }
        })) {
            _publishDetailError(generation, request, "archive_task_read_failed",
                "The archived task path check could not start.");
        }
    }

    function _handleDetailRequest(value) {
        var hadActiveDetail = root.currentDetailRequestId !== "";
        _cancelDetailRead(false);
        if (value === null || value === undefined) {
            if (hadActiveDetail)
                detailResponseVar.set(null);
            return;
        }

        var archiveRequest = value && typeof value === "object"
            && ["archive-index", "archive-page", "archive-task"]
                .indexOf(value.kind) !== -1;
        var validation = archiveRequest
            ? TrellisPaths.validateArchiveRequest(value)
            : TrellisPaths.validateMarkdownRequest(value);
        var generation = root.detailGeneration;
        if (!validation.ok) {
            var rejectedRequest = {
                requestId: validation.requestId || "invalid-request",
                kind: archiveRequest ? value.kind : "markdown",
                projectId: "",
                taskId: "",
                document: ""
            };
            root.currentDetailRequestId = rejectedRequest.requestId;
            if (archiveRequest) {
                _publishArchiveError(generation, rejectedRequest,
                    validation.reason || "archive_request_invalid",
                    "The archive request is invalid.");
            } else {
                _publishDetailError(generation, rejectedRequest,
                    "markdown_request_invalid", "The task document request is invalid.");
            }
            return;
        }

        var request = validation.request;
        root.currentDetailRequestId = request.requestId;
        root.currentDetailRequest = request;
        root.currentDetailRootsKey = JSON.stringify(_configuredRoots());
        var project = _uniqueCurrentProject(request.projectId);
        root.currentDetailProjectRoot = project ? project.root : "";
        _authorizeDetailProject(generation, request.requestId, project, function (authorized) {
            if (!_isCurrentDetail(generation, request.requestId)) return;
            if (!authorized || !_detailScopeCurrent()) {
                _rejectDetailScope(generation, request.requestId);
                return;
            }
            if (request.kind === "archive-index") {
                _loadArchiveIndex(generation, request, project);
                return;
            }
            if (request.kind === "archive-page") {
                _openArchiveMonth(generation, request, project, [], request.month);
                return;
            }
            if (request.kind === "archive-task") {
                _readArchiveTaskRequest(generation, request, project);
                return;
            }
            var taskRecord = _findLiveTaskRecord(project, request.taskId);
            if (!taskRecord) {
                _publishDetailError(generation, request, "markdown_task_missing",
                    "The selected live task is no longer available.");
                return;
            }
            _readMarkdownRequest(generation, request, project, taskRecord);
        });
    }

    function _uniqueCurrentProject(projectId) {
        var inputs = root.currentInputs || [];
        var found = null;
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i] && inputs[i].id === projectId) {
                if (found) return null;
                found = inputs[i];
            }
        }
        return found;
    }

    function _projectAuthorizedByRoots(projectRoot, canonicalRoots) {
        for (var i = 0; i < canonicalRoots.length; i++) {
            if (TrellisPaths.isWithin(projectRoot, canonicalRoots[i], true)
                    || TrellisPaths.ancestorPaths(canonicalRoots[i], root.maxAncestorCandidates).indexOf(projectRoot) !== -1)
                return true;
        }
        return false;
    }

    function _detailScopeCurrent() {
        var request = root.currentDetailRequest;
        var project = request ? _uniqueCurrentProject(request.projectId) : null;
        return !!request && root.currentDetailRootsKey === JSON.stringify(_configuredRoots())
            && !!project && project.root === root.currentDetailProjectRoot;
    }

    function _rejectDetailScope(generation, requestId) {
        if (!requestId || !_isCurrentDetail(generation, requestId)) return;
        var request = root.currentDetailRequest;
        _cancelDetailRead(false);
        if (!request) return;
        var warning = [{ code: "detail_scope_changed",
            message: "The selected project is no longer authorized or available. Retry from the current view." }];
        if (request.kind === "archive-index" || request.kind === "archive-page")
            detailResponseVar.set(_archiveResponse(request, "error", [], [], false, warning));
        else
            detailResponseVar.set(_detailResponse(request, "error", "", "plain", warning));
    }

    function _authorizeDetailProject(generation, requestId, project, callback) {
        if (!project || !TrellisPaths.normalizeProjectRoot(project.root).ok) { callback(false); return; }
        var roots = _configuredRoots();
        var canonicalRoots = [];
        function canonicalDirectory(path, done) {
            if (!_queueDetailProcess(generation, requestId, ["realpath", "-e", "--", path], function (output, code) {
                var parsed = code === 0 ? TrellisPaths.parseCanonicalOutput(output) : { ok: false };
                if (!parsed.ok) { done(""); return; }
                if (!_queueDetailProcess(generation, requestId, ["test", "-d", parsed.path], function (text, exitCode) {
                    done(exitCode === 0 ? parsed.path : "");
                })) done("");
            })) done("");
        }
        function probe(index) {
            if (!_isCurrentDetail(generation, requestId)) return;
            if (index < roots.length) {
                canonicalDirectory(roots[index], function (path) {
                    if (path) canonicalRoots.push(path);
                    probe(index + 1);
                });
                return;
            }
            if (!_projectAuthorizedByRoots(project.root, canonicalRoots)) { callback(false); return; }
            canonicalDirectory(project.root, function (path) {
                if (path !== project.root) { callback(false); return; }
                var trellis = TrellisPaths.joinPath(project.root, ".trellis");
                canonicalDirectory(trellis, function (canonicalTrellis) {
                    callback(canonicalTrellis === trellis && _detailScopeCurrent()
                        && _uniqueCurrentProject(project.id).root === project.root);
                });
            });
        }
        probe(0);
    }

    function _configuredRoots() {
        var input = TrellisDiscovery.selectRootInput(root.pluginData || {}, root.maxScanRoots);
        return TrellisPaths.normalizeRoots(input.value).roots;
    }

    function _searchProjects() {
        // Only current daemon discovery inputs are candidates; State caches have
        // no path authority. Ambiguous identities are excluded, including __proto__.
        var inputs = root.currentInputs || [];
        var projects = [];
        for (var i = 0; i < Math.min(inputs.length, root.maxProjects); i++) {
            var project = inputs[i];
            if (!project || typeof project.id !== "string" || !project.id
                    || project.id.length > 4096 || TrellisPaths.hasControlCharacters(project.id)
                    || !TrellisPaths.normalizeProjectRoot(project.root).ok)
                continue;
            var duplicates = 0;
            for (var j = 0; j < inputs.length; j++) {
                if (inputs[j] && inputs[j].id === project.id)
                    duplicates += 1;
            }
            if (duplicates === 1)
                projects.push({ id: project.id, root: project.root,
                    name: _boundedArchiveString(project.name, "Project", 160) });
        }
        projects.sort(function (a, b) { return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0); });
        return projects;
    }

    function _searchScopeKey() {
        return JSON.stringify([_configuredRoots(), _searchProjects().map(function (p) {
            return [p.id, p.root];
        })]);
    }

    function _isCurrentSearch(generation, requestId) {
        return generation === root.searchGeneration
            && requestId === root.currentSearchRequestId
            && root.searchSession && root.searchSession.scopeKey === _searchScopeKey();
    }

    function _cancelSearchRead(dropSession) {
        root.searchGeneration += 1;
        root.currentSearchRequestId = "";
        var objects = (root.ownedSearchProcesses || []).concat(root.ownedSearchReaders || []);
        root.ownedSearchProcesses = [];
        root.ownedSearchReaders = [];
        for (var i = 0; i < objects.length; i++) {
            if (objects[i]) objects[i].destroy();
        }
        if (dropSession)
            root.searchSession = null;
    }

    function _queueSearchProcess(generation, requestId, command, callback) {
        if (!_isCurrentSearch(generation, requestId)) return false;
        var process = processComponent.createObject(root, {
            generation: generation, ownerRoot: root, ownedList: "ownedSearchProcesses",
            command: command, callback: function (output, exitCode) {
                if (_isCurrentSearch(generation, requestId)) callback(output, exitCode);
                else _invalidateSearchScope(generation, requestId);
            }
        });
        if (!process) return false;
        root.ownedSearchProcesses.push(process);
        process.running = true;
        return true;
    }

    function _queueSearchFile(context, path, callback) {
        if (!_isCurrentSearch(context.generation, context.request.requestId)) return false;
        var reader = detailFileViewComponent.createObject(root, {
            generation: context.generation, requestId: context.request.requestId,
            ownerRoot: root, ownedList: "ownedSearchReaders", path: path,
            byteLimit: root.maxJsonBytes, errorPrefix: "archive_task",
            callback: function (text, error) {
                if (_isCurrentSearch(context.generation, context.request.requestId)) callback(text, error);
                else _invalidateSearchScope(context.generation, context.request.requestId);
            }
        });
        if (!reader) return false;
        root.ownedSearchReaders.push(reader);
        return true;
    }

    function _invalidateSearchScope(generation, requestId) {
        if (generation !== root.searchGeneration || requestId !== root.currentSearchRequestId)
            return;
        var request = root.searchSession.request;
        _cancelSearchRead(true);
        _searchError(request, "search_scope_changed");
    }

    function _searchError(request, code) {
        searchResponseVar.set({ requestId: request.requestId, kind: "archive-search",
            query: request.query || "", status: "error", results: [], partial: true,
            hasMore: false, cursor: "", examinedCount: 0, batchExamined: 0,
            batchListings: 0, truncated: false, sourceSnapshotGeneration: root.publicationGeneration,
            warnings: [{ code: code, message: "Archive search could not continue. Retry the query." }] });
    }

    function _canonicalizeSearch(context, path, callback) {
        if (!_queueSearchProcess(context.generation, context.request.requestId,
                ["realpath", "-e", "--", path], function (output, exitCode) {
            var parsed = exitCode === 0 ? TrellisPaths.parseCanonicalOutput(output) : { ok: false };
            callback(parsed.ok ? parsed.path : "");
        })) callback("");
    }

    function _canonicalizeSearchDirectory(context, path, callback) {
        if (!_queueSearchProcess(context.generation, context.request.requestId,
                ["test", "-d", path], function (output, exitCode) {
            if (exitCode !== 0) { callback(""); return; }
            _canonicalizeSearch(context, path, callback);
        })) callback("");
    }

    function _searchWarn(context, code) {
        context.session.partial = true;
        _archiveWarning(context.session, code, "Some archive metadata could not be searched safely.");
    }

    function _finishSearchBatch(context) {
        if (!_isCurrentSearch(context.generation, context.request.requestId)) {
            _invalidateSearchScope(context.generation, context.request.requestId);
            return;
        }
        var session = context.session;
        var capped = session.results.length >= root.maxSearchResults;
        var more = !capped && session.projectIndex < session.projects.length;
        root.searchCursorSerial += 1;
        session.cursor = more ? "s-" + root.searchCursorSerial + "-"
            + Math.random().toString(36).slice(2, 18) : "";
        searchResponseVar.set({ requestId: context.request.requestId, kind: "archive-search",
            query: session.query, status: session.results.length ? "ready" : "empty",
            results: _cloneValue(session.results), partial: more || session.partial || capped,
            hasMore: more, cursor: session.cursor, examinedCount: session.examined,
            batchExamined: context.examined, batchListings: context.listings,
            truncated: session.truncated || capped,
            sourceSnapshotGeneration: root.publicationGeneration,
            warnings: session.warnings.slice(0, root.maxArchiveWarnings) });
    }

    function _handleSearchRequest(value) {
        // A queued older global write must not supersede a newer widget request.
        var latest = searchRequestVar.value;
        if (value !== latest && (!value || !latest || value.requestId !== latest.requestId)) return;
        if (value === null || value === undefined) {
            _cancelSearchRead(true);
            searchResponseVar.set(null);
            return;
        }
        var validation = TrellisPaths.validateSearchRequest(value);
        if (!validation.ok) {
            _cancelSearchRead(true);
            _searchError({ requestId: validation.requestId || "invalid-request" }, validation.reason);
            return;
        }
        var request = validation.request;
        if (!request.query) {
            _cancelSearchRead(true);
            searchResponseVar.set({ requestId: request.requestId, kind: "archive-search",
                query: "", status: "empty", results: [], partial: false, hasMore: false,
                cursor: "", examinedCount: 0, batchExamined: 0, batchListings: 0,
                truncated: false, sourceSnapshotGeneration: root.publicationGeneration, warnings: [] });
            return;
        }
        var session = root.searchSession;
        if (request.cursor && (!session || session.query !== request.query
                || session.cursor !== request.cursor || session.scopeKey !== _searchScopeKey())) {
            _cancelSearchRead(true);
            _searchError(request, "search_cursor_stale");
            return;
        }
        _cancelSearchRead(!request.cursor);
        if (!request.cursor) {
            session = { query: request.query, scopeKey: _searchScopeKey(),
                projects: _searchProjects(), projectIndex: 0, months: null, monthIndex: 0,
                candidates: null, offset: 0, results: [], warnings: [],
                partial: false, truncated: false, examined: 0, canonicalRoots: null, cursor: "" };
        }
        root.searchSession = session;
        session.cursor = ""; // Each opaque cursor is consumed once.
        session.request = request;
        root.currentSearchRequestId = request.requestId;
        var context = { generation: root.searchGeneration, request: request, session: session,
            listings: 0, examined: 0, roots: [], validatedProjects: [] };
        var roots = _configuredRoots();
        function resolveRoot(index) {
            if (!_isCurrentSearch(context.generation, request.requestId)) {
                _invalidateSearchScope(context.generation, request.requestId);
                return;
            }
            if (index >= roots.length) {
                var key = JSON.stringify(context.roots);
                if (session.canonicalRoots !== null && session.canonicalRoots !== key) {
                    _cancelSearchRead(true);
                    _searchError(request, "search_scope_changed");
                    return;
                }
                session.canonicalRoots = key;
                _advanceSearch(context);
                return;
            }
            _canonicalizeSearchDirectory(context, roots[index], function (path) {
                if (path) context.roots.push(path);
                else _searchWarn(context, "search_root_unavailable");
                resolveRoot(index + 1);
            });
        }
        resolveRoot(0);
    }

    function _nextSearchProject(context) {
        var session = context.session;
        session.projectIndex += 1;
        session.months = null;
        session.monthIndex = 0;
        session.candidates = null;
        session.offset = 0;
        Qt.callLater(function () { _advanceSearch(context); });
    }

    function _advanceSearch(context) {
        if (!_isCurrentSearch(context.generation, context.request.requestId)) {
            _invalidateSearchScope(context.generation, context.request.requestId);
            return;
        }
        var session = context.session;
        if (session.projectIndex >= session.projects.length
                || session.results.length >= root.maxSearchResults
                || context.examined >= root.maxSearchJsonPerBatch) {
            _finishSearchBatch(context);
            return;
        }
        var project = session.projects[session.projectIndex];
        if (context.validatedProjects.indexOf(project.id) === -1) {
            _validateSearchProject(context, project, function (valid) {
                if (!valid) {
                    _searchWarn(context, "search_project_stale");
                    _nextSearchProject(context);
                    return;
                }
                context.validatedProjects.push(project.id);
                _advanceSearch(context);
            });
            return;
        }
        if (session.months === null) {
            if (context.listings >= root.maxSearchListingsPerBatch) {
                _finishSearchBatch(context);
                return;
            }
            _searchProjectIndex(context, project);
            return;
        }
        if (session.monthIndex >= session.months.length) {
            _nextSearchProject(context);
            return;
        }
        if (session.candidates === null) {
            if (context.listings >= root.maxSearchListingsPerBatch) {
                _finishSearchBatch(context);
                return;
            }
            _searchMonthIndex(context, project, session.months[session.monthIndex]);
            return;
        }
        if (session.offset >= session.candidates.length) {
            session.monthIndex += 1;
            session.candidates = null;
            session.offset = 0;
            Qt.callLater(function () { _advanceSearch(context); });
            return;
        }
        _searchPage(context, project);
    }

    function _searchList(context, path, limit, callback) {
        context.listings += 1;
        if (!_queueSearchProcess(context.generation, context.request.requestId,
                ["find", path, "-mindepth", "1", "-maxdepth", "1", "-print"], function (output, exitCode) {
            if (exitCode !== 0) {
                _searchWarn(context, "archive_permission");
                callback(null);
                return;
            }
            var bounded = TrellisPaths.parseBoundedLines(output || "", limit + 1, root.maxCommandBytes);
            if (bounded.truncated || bounded.lines.length > limit) {
                context.session.truncated = true;
                _searchWarn(context, "archive_limit");
            }
            if (bounded.warnings.length) _searchWarn(context, "archive_layout_unknown");
            var lines = bounded.lines.slice(0, limit).sort().reverse();
            // A malformed producer cannot double-read a directory identity.
            callback(lines.filter(function (line, index) { return lines.indexOf(line) === index; }),
                !bounded.truncated && bounded.lines.length <= limit && !bounded.warnings.length);
        })) {
            _searchWarn(context, "archive_unavailable");
            callback(null);
        }
    }

    function _validateSearchProject(context, project, callback) {
        if (!_projectAuthorizedByRoots(project.root, context.roots)) { callback(false); return; }
        _canonicalizeSearchDirectory(context, project.root, function (canonicalProject) {
            if (canonicalProject !== project.root) { callback(false); return; }
            var trellis = TrellisPaths.joinPath(project.root, ".trellis");
            _canonicalizeSearchDirectory(context, trellis, function (canonicalTrellis) {
                callback(canonicalTrellis === trellis);
            });
        });
    }

    function _searchProjectIndex(context, project) {
        var archive = TrellisPaths.archiveRootPath(project.root);
        _canonicalizeSearchDirectory(context, archive, function (canonicalArchive) {
            if (!canonicalArchive) {
                _searchWarn(context, "archive_unavailable");
                _nextSearchProject(context);
                return;
            }
            if (!TrellisPaths.resolveArchive(project.root, archive, canonicalArchive).ok) {
                _searchWarn(context, "archive_layout_unknown");
                _nextSearchProject(context);
                return;
            }
            _searchList(context, archive, root.maxArchiveMonths, function (lines) {
                context.session.months = (lines || []).filter(function (path) {
                    var valid = TrellisPaths.isArchiveMonth(TrellisPaths.basename(path))
                        && TrellisPaths.parentPath(path) === archive;
                    if (!valid) _searchWarn(context, "archive_layout_unknown");
                    return valid;
                });
                _advanceSearch(context);
            });
        });
    }

    function _searchMonthIndex(context, project, candidate) {
        var month = TrellisPaths.basename(candidate);
        _canonicalizeSearchDirectory(context, candidate, function (canonical) {
            if (!TrellisPaths.resolveArchiveMonth(project.root, month, candidate, canonical).ok
                    || !canonical) {
                _searchWarn(context, "archive_month_invalid");
                context.session.monthIndex += 1;
                Qt.callLater(function () { _advanceSearch(context); });
                return;
            }
            _searchList(context, canonical, root.maxArchiveTaskDirectories, function (lines, reliable) {
                context.session.monthReliable = !!reliable;
                context.session.candidates = lines || [];
                context.session.offset = 0;
                // Empty months are complete page observations, but failed listings aren't.
                if (reliable && lines && !lines.length && _isCurrentSearch(context.generation, context.request.requestId))
                    observeArchiveMetadata(project, { kind: "archive-page", status: "empty",
                        selectedMonth: month, page: 0, pageSize: 32, tasks: [], warnings: [] });
                _advanceSearch(context);
            });
        });
    }

    function _searchPage(context, project) {
        var session = context.session;
        var month = TrellisPaths.basename(session.months[session.monthIndex]);
        var offset = session.offset;
        var page = Math.floor(offset / root.archiveLimits.pageSizeMaximum);
        var selected = session.candidates.slice(offset, offset + root.archiveLimits.pageSizeMaximum);
        // Short final pages in earlier months may leave a non-aligned budget.
        // Defer the whole next page so it remains a complete observation unit.
        if (context.examined + selected.length > root.maxSearchJsonPerBatch) {
            _finishSearchBatch(context);
            return;
        }
        var rows = [];
        var complete = session.monthReliable;
        function next(index) {
            if (!_isCurrentSearch(context.generation, context.request.requestId)) {
                _invalidateSearchScope(context.generation, context.request.requestId);
                return;
            }
            if (index >= selected.length) {
                session.offset += selected.length;
                if (complete && page <= root.archiveLimits.pageMaximum)
                    observeArchiveMetadata(project, { kind: "archive-page", status: rows.length ? "ready" : "empty",
                        selectedMonth: month, page: page, pageSize: root.archiveLimits.pageSizeMaximum,
                        tasks: rows, warnings: [] });
                Qt.callLater(function () { _advanceSearch(context); });
                return;
            }
            // Result cap may stop mid-page, which must never create a
            // complete observation.
            if (session.results.length >= root.maxSearchResults) {
                _finishSearchBatch(context);
                return;
            }
            context.examined += 1;
            session.examined += 1;
            _readSearchTask(context, project, month, selected[index], function (row) {
                if (!row) complete = false;
                else {
                    rows.push(row);
                    if (TrellisProjection.searchMetadataMatches(session.query, project.name, row.title, row.id)) {
                        session.results.push({ kind: "archive", projectId: project.id, projectName: project.name,
                            taskId: row.id, title: row.title, storedStatus: row.storedStatus,
                            month: month, dirName: row.dirName });
                    }
                }
                next(index + 1);
            });
        }
        next(0);
    }

    function _readSearchTask(context, project, month, candidate, callback) {
        function fail(code) { _searchWarn(context, code); callback(null); }
        var dirName = TrellisPaths.basename(candidate);
        if (!TrellisPaths.isArchiveTaskDirectoryName(dirName)) {
            fail("archive_task_rejected");
            return;
        }
        if (!_queueSearchProcess(context.generation, context.request.requestId,
                ["test", "-d", candidate], function (output, exitCode) {
            if (exitCode !== 0) { fail("archive_layout_unknown"); return; }
            _canonicalizeSearch(context, candidate, function (canonicalTask) {
                var task = canonicalTask ? TrellisPaths.resolveArchiveTask(project.root,
                    month, dirName, candidate, canonicalTask) : { ok: false };
                if (!task.ok) { fail("archive_task_rejected"); return; }
                _canonicalizeSearch(context, task.taskJsonPath, function (canonicalJson) {
                    var json = canonicalJson ? TrellisPaths.resolveTaskJson(task, canonicalJson) : { ok: false };
                    if (!json.ok) { fail("archive_task_rejected"); return; }
                    if (!_queueSearchProcess(context.generation, context.request.requestId,
                            ["test", "-f", json.path], function (testOutput, testExitCode) {
                        if (testExitCode !== 0) { fail("archive_task_read_failed"); return; }
                        if (!_queueSearchProcess(context.generation, context.request.requestId,
                                ["stat", "-c", "%s", "--", json.path], function (statOutput, statExitCode) {
                            var size = (statOutput || "").trim();
                            if (statExitCode !== 0 || !/^\d+$/.test(size)
                                    || !isFinite(Number(size)) || Number(size) > root.maxJsonBytes) {
                                fail("archive_limit"); return;
                            }
                            if (!_queueSearchFile(context, json.path, function (text, error) {
                                var parsed = error ? { ok: false } : TrellisParser.parseJson(text);
                                if (!parsed.ok || !parsed.value || typeof parsed.value !== "object"
                                        || Array.isArray(parsed.value)) { fail("archive_task_read_failed"); return; }
                                callback(_archiveTaskSummary(parsed.value, dirName, month, null));
                            })) fail("archive_task_read_failed");
                        })) fail("archive_task_read_failed");
                    })) fail("archive_task_read_failed");
                });
            });
        })) fail("archive_task_read_failed");
    }

    function _cancelAction(clearResponse, preserveRequest) {
        var context = root.currentAction;
        var pendingRequest = root.pendingActionRequest;
        root.actionGeneration += 1;
        root.currentAction = null;
        if (!preserveRequest) root.pendingActionRequest = null;
        var objects = (root.ownedActionProcesses || []).concat(root.ownedActionReaders || []);
        root.ownedActionProcesses = [];
        root.ownedActionReaders = [];
        for (var i = 0; i < objects.length; i++) {
            if (objects[i]) objects[i].destroy();
        }
        if (clearResponse) actionResponseVar.set(null);
        if (!preserveRequest) {
            _consumeActionRequest(context ? context.rawRequest : null);
            _consumeActionRequest(pendingRequest);
        }
    }

    function _consumeActionRequest(request) {
        // DMS retains globals across unload/reload; consume only this raw owner.
        if (request && request === actionRequestVar.value) actionRequestVar.set(null);
    }

    function _isCurrentAction(context) {
        return !!context && context === root.currentAction
            && context.generation === root.actionGeneration && !context.finished;
    }

    function _actionScopeCurrent(context) {
        if (!_isCurrentAction(context)) return false;
        if (actionRequestVar.value !== context.rawRequest) return false;
        var latest = TrellisPaths.validateActionRequest(actionRequestVar.value);
        var project = _uniqueCurrentProject(context.request.projectId);
        if (!latest.ok || JSON.stringify(latest.request) !== JSON.stringify(context.request)
                || context.rootsKey !== JSON.stringify(_configuredRoots())
                || !project || project.root !== context.projectRoot) return false;
        if (context.request.kind === "live") {
            var task = _findLiveTaskRecord(project, context.request.taskId);
            if (!task || task.readError || task.taskDir !== context.taskDir) return false;
        }
        return true;
    }

    function _finishAction(context, status, code, value) {
        if (!_isCurrentAction(context)) return;
        var response = Object.assign({}, context.request, { status: status, code: code });
        if ((status === "copied" || status === "accepted") && typeof value === "string")
            response.value = value.slice(0, 4096);
        _cancelAction(false, true);
        actionResponseVar.set(response);
        _consumeActionRequest(context.rawRequest);
    }

    function _guardAction(context) {
        if (!_isCurrentAction(context)) return false;
        if (_actionScopeCurrent(context)) return true;
        _finishAction(context, "error", "action_scope_changed", "");
        return false;
    }

    function _queueActionProcess(context, command, callback) {
        if (!_guardAction(context)) return false;
        var process = null;
        try {
            process = processComponent.createObject(root, {
                generation: context.generation, ownerRoot: root, ownedList: "ownedActionProcesses",
                command: command, callback: function (output, exitCode) {
                    if (_guardAction(context)) {
                        if ((output || "").length > root.maxCommandBytes) callback("", -1);
                        else callback(output || "", exitCode);
                    }
                }
            });
            if (!process) return false;
            root.ownedActionProcesses.push(process);
            // Recheck effective authority after object creation, before launch.
            if (!_guardAction(context)) return false;
            process.running = true;
            return true;
        } catch (error) {
            if (process) process.destroy();
            return false;
        }
    }

    function _checkActionLocation(context, path, directory, callback) {
        var normalized = TrellisPaths.normalizeAbsolutePath(path);
        if (!normalized.ok || normalized.path !== path || path.length > 4096) { callback(false); return; }
        if (!_queueActionProcess(context, ["realpath", "-e", "--", path], function (output, code) {
            var parsed = code === 0 ? TrellisPaths.parseCanonicalOutput(output) : { ok: false };
            if (!parsed.ok || parsed.path !== path) { callback(false); return; }
            if (!_queueActionProcess(context, ["test", directory ? "-d" : "-f", path], function (text, exitCode) {
                callback(exitCode === 0);
            })) callback(false);
        })) callback(false);
    }

    function _authorizeActionProject(context, callback) {
        var roots = _configuredRoots(), canonicalRoots = [];
        function next(index) {
            if (!_guardAction(context)) return;
            if (index >= roots.length) {
                var key = JSON.stringify(canonicalRoots);
                if (!_projectAuthorizedByRoots(context.projectRoot, canonicalRoots)
                        || (context.canonicalRootsKey !== undefined && context.canonicalRootsKey !== key)) {
                    callback(false); return;
                }
                context.canonicalRootsKey = key;
                _checkActionLocation(context, context.projectRoot, true, function (ok) {
                    if (!ok) { callback(false); return; }
                    _checkActionLocation(context, TrellisPaths.joinPath(context.projectRoot, ".trellis"), true, callback);
                });
                return;
            }
            var path = roots[index];
            if (!_queueActionProcess(context, ["realpath", "-e", "--", path], function (output, code) {
                var parsed = code === 0 ? TrellisPaths.parseCanonicalOutput(output) : { ok: false };
                if (!parsed.ok) { next(index + 1); return; }
                if (!_queueActionProcess(context, ["test", "-d", parsed.path], function (text, exitCode) {
                    if (exitCode === 0) canonicalRoots.push(parsed.path);
                    next(index + 1);
                })) callback(false);
            })) callback(false);
        }
        next(0);
    }

    function _readActionIdentity(context, taskResult, callback) {
        var path = taskResult.taskJsonPath;
        _checkActionLocation(context, path, false, function (ok) {
            if (!ok || !TrellisPaths.resolveTaskJson(taskResult, path).ok) { callback(false); return; }
            if (!_queueActionProcess(context, ["stat", "-c", "%s", "--", path], function (output, code) {
                var text = output.trim(), size = Number(text);
                if (code !== 0 || !/^\d+$/.test(text) || !isFinite(size) || size > root.maxJsonBytes) {
                    callback(false); return;
                }
                var reader = null;
                try {
                    if (!_guardAction(context)) return;
                    reader = detailFileViewComponent.createObject(root, {
                        generation: context.generation, requestId: context.request.requestId,
                        ownerRoot: root, ownedList: "ownedActionReaders", path: path,
                        byteLimit: root.maxJsonBytes, errorPrefix: "action_task",
                        callback: function (content, error) {
                            if (!_guardAction(context)) return;
                            if (error || TrellisPaths.utf8ByteLength(content) > root.maxJsonBytes) { callback(false); return; }
                            var value;
                            try { value = JSON.parse(content); } catch (parseError) { callback(false); return; }
                            var id = "";
                            if (context.request.kind === "archive") {
                                var summary = _archiveTaskSummary(value, context.request.dirName, context.request.month, null);
                                if (!summary.available) { callback(false); return; }
                                id = summary.id;
                            } else {
                                id = value && typeof value.id === "string" ? value.id.trim() : "";
                                id = id || context.dirName.trim();
                            }
                            callback(id === context.request.taskId);
                        }
                    });
                    if (!reader) { callback(false); return; }
                    root.ownedActionReaders.push(reader);
                } catch (error) {
                    if (reader) reader.destroy();
                    callback(false);
                }
            })) callback(false);
        });
    }

    function _validateActionTarget(context, callback) {
        if (context.request.kind === "project") { callback(true); return; }
        var projectRoot = context.projectRoot;
        var locations = [TrellisPaths.tasksRootPath(projectRoot)];
        if (context.request.kind === "archive") {
            var archive = TrellisPaths.archiveRootPath(projectRoot);
            var month = TrellisPaths.joinPath(archive, context.request.month);
            context.taskDir = TrellisPaths.joinPath(month, context.request.dirName);
            if (!TrellisPaths.resolveArchive(projectRoot, archive, archive).ok
                    || !TrellisPaths.resolveArchiveMonth(projectRoot, context.request.month, month, month).ok
                    || !TrellisPaths.resolveArchiveTask(projectRoot, context.request.month,
                        context.request.dirName, context.taskDir, context.taskDir).ok) { callback(false); return; }
            locations = locations.concat([archive, month]);
        }
        var taskResult = context.request.kind === "archive"
            ? TrellisPaths.resolveArchiveTask(projectRoot, context.request.month,
                context.request.dirName, context.taskDir, context.taskDir)
            : TrellisPaths.resolveTaskDir(projectRoot, context.taskDir, context.taskDir, {});
        if (!taskResult.ok || taskResult.kind !== context.request.kind) { callback(false); return; }
        context.locations = locations.concat([context.taskDir]);
        function next(index) {
            if (!_guardAction(context)) return;
            if (index >= context.locations.length) {
                _readActionIdentity(context, taskResult, callback);
                return;
            }
            _checkActionLocation(context, context.locations[index], true, function (ok) {
                if (!ok) { callback(false); return; }
                next(index + 1);
            });
        }
        next(0);
    }

    function _revalidateActionLocations(context, callback) {
        var locations = context.locations || [];
        function next(index) {
            if (!_guardAction(context)) return;
            if (index >= locations.length) {
                if (context.request.kind === "project") { callback(true); return; }
                _checkActionLocation(context, TrellisPaths.joinPath(context.taskDir, "task.json"), false, callback);
                return;
            }
            _checkActionLocation(context, locations[index], true, function (ok) {
                if (!ok) { callback(false); return; }
                next(index + 1);
            });
        }
        next(0);
    }

    function _executeAction(context) {
        if (!_guardAction(context)) return;
        var action = context.request.action;
        var value = action === "copy-task-id" ? context.request.taskId
            : (action === "copy-project-path" || action === "open-project-folder")
                ? context.projectRoot : context.taskDir;
        if (!value || value.length > 4096) { _finishAction(context, "error", "action_validation_failed", ""); return; }
        if (action.indexOf("copy-") === 0) {
            if (!_queueActionProcess(context, ["dms", "cl", "copy", "--", value], function (output, code) {
                _finishAction(context, code === 0 ? "copied" : "error",
                    code === 0 ? "action_copied" : "action_host_failed", code === 0 ? value : "");
            })) _finishAction(context, "error", "action_host_failed", "");
            return;
        }
        var url = TrellisPaths.actionFileUrl(value);
        try {
            if (!url || typeof Qt.openUrlExternally !== "function" || !_guardAction(context)) {
                _finishAction(context, "error", "action_host_failed", ""); return;
            }
            var accepted = Qt.openUrlExternally(url);
            _finishAction(context, accepted ? "accepted" : "error",
                accepted ? "action_open_accepted" : "action_host_failed", accepted ? value : "");
        } catch (error) {
            _finishAction(context, "error", "action_host_failed", "");
        }
    }

    function _handleActionRequest(value) {
        // Deferred writes from an older widget never supersede the current owner.
        if (value !== actionRequestVar.value) return;
        if (root.pendingActionRequest === value) root.pendingActionRequest = null;
        if (value === null || value === undefined) {
            if (root.currentAction) _cancelAction(true);
            return;
        }
        _cancelAction(false, true);
        var validation = TrellisPaths.validateActionRequest(value);
        if (!validation.ok) {
            actionResponseVar.set({ requestId: typeof value.requestId === "string"
                && !TrellisPaths.hasControlCharacters(value.requestId) ? value.requestId.slice(0, 128) : "invalid-request",
                status: "error", code: "action_request" });
            _consumeActionRequest(value);
            return;
        }
        var request = validation.request, project = _uniqueCurrentProject(request.projectId);
        var task = request.kind === "live" ? _findLiveTaskRecord(project, request.taskId) : null;
        var context = { generation: root.actionGeneration, request: request, rawRequest: value,
            rootsKey: JSON.stringify(_configuredRoots()), projectRoot: project ? project.root : "",
            taskDir: task ? task.taskDir : "", dirName: task ? task.dirName : "" };
        root.currentAction = context;
        if (!project || !TrellisPaths.normalizeProjectRoot(project.root).ok
                || (request.kind === "live" && (!task || task.readError))) {
            _finishAction(context, "error", "action_validation_failed", ""); return;
        }
        _authorizeActionProject(context, function (authorized) {
            if (!authorized) { _finishAction(context, "error", "action_validation_failed", ""); return; }
            _validateActionTarget(context, function (valid) {
                if (!valid) { _finishAction(context, "error", "action_validation_failed", ""); return; }
                _revalidateActionLocations(context, function (safe) {
                    if (!safe) { _finishAction(context, "error", "action_validation_failed", ""); return; }
                    // Canonical root authority is refreshed again after task I/O.
                    _authorizeActionProject(context, function (current) {
                        if (!current) { _finishAction(context, "error", "action_validation_failed", ""); return; }
                        _executeAction(context);
                    });
                });
            });
        });
    }

    function _untrack(propertyName, object) {
        var current = root[propertyName] || [];
        var retained = [];
        for (var i = 0; i < current.length; i++) {
            if (current[i] && current[i] !== object)
                retained.push(current[i]);
        }
        root[propertyName] = retained;
    }

    function _destroyWatchers() {
        var watchers = root.ownedWatchers || [];
        for (var i = 0; i < watchers.length; i++) {
            if (watchers[i])
                watchers[i].destroy();
        }
        root.ownedWatchers = [];
        root.knownWatchers = ({});
        root.knownFileRegistry = ({});
    }

    function _queueProcess(scan, command, callback) {
        if (!scan || !_isCurrent(scan.generation))
            return;
        scan.pending += 1;
        var process = null;
        process = processComponent.createObject(root, {
            generation: scan.generation,
            ownerRoot: root,
            ownedList: "ownedProcesses",
            command: command,
            callback: function (output, exitCode) {
                var current = _isCurrent(scan.generation);
                if (current)
                    callback(output, exitCode);
                scan.pending -= 1;
                _maybeFinish(scan);
            }
        });
        if (!process) {
            scan.pending -= 1;
            scan.degraded = true;
            _pushWarning(scan, _warning("process_create_failed", "could not create discovery process"));
            _maybeFinish(scan);
            return;
        }
        root.ownedProcesses.push(process);
        process.running = true;
    }

    function _queueFile(scan, path, callback, project, coreInput) {
        if (!scan || !_isCurrent(scan.generation))
            return;
        scan.pending += 1;
        var reader = null;
        reader = fileViewComponent.createObject(root, {
            generation: scan.generation,
            ownerRoot: root,
            ownedList: "ownedReaders",
            path: path,
            callback: function (text, error) {
                var current = _isCurrent(scan.generation);
                if (current)
                    callback(text, error);
                scan.pending -= 1;
                _maybeFinish(scan);
            }
        });
        if (!reader) {
            scan.pending -= 1;
            if (coreInput && project)
                project.coreReadFailed = true;
            _pushWarning(scan, _warning("reader_create_failed", "could not create file reader", {
                path: path,
                projectId: project ? (project.id || project.root) : ""
            }));
            _maybeFinish(scan);
            return;
        }
        root.ownedReaders.push(reader);
    }

    function _boundedLines(output, maxLines) {
        return TrellisPaths.parseBoundedLines(output || "", maxLines, root.maxCommandBytes);
    }

    function _canonicalize(scan, path, callback) {
        _queueProcess(scan, ["realpath", "-e", "--", path], function (output, exitCode) {
            if (exitCode !== 0) {
                callback(null, "realpath_failed");
                return;
            }
            var parsed = TrellisPaths.parseCanonicalOutput(output);
            callback(parsed.ok ? parsed.path : null, parsed.ok ? null : parsed.reason);
        });
    }

    function _projectName(projectRoot) {
        var name = TrellisPaths.basename(projectRoot);
        return name || projectRoot;
    }

    function _newProject(scan, projectRoot, trellisDir) {
        if (scan.projects.length >= root.maxProjects) {
            scan.degraded = true;
            _pushWarning(scan, _warning("project_limit", "project discovery cap reached", {
                root: projectRoot,
                scope: "root"
            }));
            return null;
        }
        for (var i = 0; i < scan.projects.length; i++) {
            if (scan.projects[i].root === projectRoot)
                return scan.projects[i];
        }
        var project = {
            id: projectRoot,
            name: _projectName(projectRoot),
            root: projectRoot,
            trellisDir: trellisDir,
            versionPath: "",
            trellisVersion: null,
            taskRecords: [],
            sessionRecords: [],
            warnings: [],
            errors: [],
            coreReadFailed: false,
            taskDirs: [],
            sessionKeys: [],
            discoveryStarted: false
        };
        scan.projects.push(project);
        return project;
    }

    function _discoverProject(scan, project) {
        var versionPath = TrellisPaths.joinPath(project.trellisDir, ".version");
        _canonicalize(scan, versionPath, function (canonicalVersion, canonicalError) {
            if (!canonicalVersion) {
                _pushProjectWarning(scan, project, _warning("version_unavailable", "could not read .trellis/.version", {
                    reason: canonicalError
                }));
                return;
            }
            var versionResolved = TrellisPaths.resolveVersionFile(project.root, project.trellisDir, canonicalVersion);
            if (!versionResolved.ok) {
                _pushProjectWarning(scan, project, _warning("version_path_rejected", "version path rejected", { reason: versionResolved.reason }));
                return;
            }
            project.versionPath = versionResolved.path;
            _queueFile(scan, versionResolved.path, function (text, error) {
                if (error) {
                    _pushProjectWarning(scan, project, _warning("version_unavailable", "could not read .trellis/.version", { reason: error }));
                    return;
                }
                var version = (text || "").trim();
                if (version && !TrellisPaths.hasControlCharacters(version)) {
                    project.trellisVersion = version;
                    if (version !== root.verifiedTrellisVersion)
                        _pushProjectWarning(scan, project, _warning("version_unverified", "Trellis version is not the verified compatibility baseline", { version: version }));
                } else {
                    _pushProjectWarning(scan, project, _warning("version_invalid", "Trellis version is missing or malformed"));
                }
            }, project, false);
        });

        var tasksRoot = TrellisPaths.tasksRootPath(project.root);
        var archiveRoot = TrellisPaths.archiveRootPath(project.root);
        _canonicalize(scan, archiveRoot, function (canonicalArchive, archiveError) {
            if (!canonicalArchive) {
                _pushProjectWarning(scan, project, _warning("archive_unavailable", "archive directory is unavailable; archive tasks are not loaded", {
                    reason: archiveError
                }));
                return;
            }
            var archiveResolved = TrellisPaths.resolveArchive(project.root, archiveRoot, canonicalArchive);
            if (!archiveResolved.ok)
                _pushProjectWarning(scan, project, _warning("archive_path_rejected", "archive directory path rejected", { reason: archiveResolved.reason }));
        });
        _queueProcess(scan, ["find", tasksRoot, "-mindepth", "1", "-maxdepth", "1", "-type", "d", "!", "-name", "archive", "-print"], function (output, exitCode) {
            if (exitCode !== 0) {
                scan.degraded = true;
                project.coreReadFailed = true;
                _pushWarning(scan, _warning("task_discovery_failed", "could not discover live task directories", {
                    root: project.root,
                    projectId: project.id
                }));
                return;
            }
            var lines = _boundedLines(output, root.maxTasksPerProject);
            if (lines.warnings.length) {
                project.coreReadFailed = true;
                scan.degraded = true;
            }
            for (var warningIndex = 0; warningIndex < lines.warnings.length; warningIndex++)
                _pushProjectWarning(scan, project, lines.warnings[warningIndex]);
            for (var i = 0; i < lines.lines.length; i++)
                _discoverTask(scan, project, lines.lines[i]);
        });

        var sessionsRoot = TrellisPaths.runtimeSessionsPath(project.root);
        _queueProcess(scan, ["find", sessionsRoot, "-mindepth", "1", "-maxdepth", "1", "-type", "f", "-name", "*.json", "-print"], function (output, exitCode) {
            if (exitCode !== 0) {
                scan.degraded = true;
                project.coreReadFailed = true;
                _pushWarning(scan, _warning("session_discovery_failed", "could not discover session pointers", {
                    root: project.root,
                    projectId: project.id
                }));
                return;
            }
            var lines = _boundedLines(output, root.maxSessionsPerProject);
            if (lines.warnings.length) {
                project.coreReadFailed = true;
                scan.degraded = true;
            }
            for (var warningIndex = 0; warningIndex < lines.warnings.length; warningIndex++)
                _pushProjectWarning(scan, project, lines.warnings[warningIndex]);
            for (var i = 0; i < lines.lines.length; i++)
                _discoverSession(scan, project, lines.lines[i], sessionsRoot);
        });
    }

    function _discoverTask(scan, project, candidate) {
        _canonicalize(scan, candidate, function (canonicalDir, error) {
            if (!canonicalDir) {
                project.coreReadFailed = true;
                _pushProjectWarning(scan, project, _warning("task_path_invalid", "task directory could not be canonicalized", { reason: error }));
                return;
            }
            var resolved = TrellisPaths.resolveTaskDir(project.root, candidate, canonicalDir, {});
            if (!resolved.ok) {
                project.coreReadFailed = true;
                _pushProjectWarning(scan, project, _warning("task_path_rejected", "task directory rejected", { reason: resolved.reason }));
                return;
            }
            if (project.taskDirs.indexOf(resolved.taskDir) !== -1)
                return;
            project.taskDirs.push(resolved.taskDir);
            _canonicalize(scan, resolved.taskJsonPath, function (canonicalJson, jsonError) {
                if (!canonicalJson) {
                    project.coreReadFailed = true;
                    _pushProjectWarning(scan, project, _warning("task_json_unavailable", "task.json could not be canonicalized", { reason: jsonError }));
                    return;
                }
                var jsonResolved = TrellisPaths.resolveTaskJson(resolved, canonicalJson);
                if (!jsonResolved.ok) {
                    project.coreReadFailed = true;
                    _pushProjectWarning(scan, project, _warning("task_json_rejected", "task.json path rejected", { reason: jsonResolved.reason }));
                    return;
                }
                _queueFile(scan, jsonResolved.path, function (text, readError) {
                    var record = {
                        dirName: TrellisPaths.basename(resolved.taskDir),
                        taskDir: resolved.taskDir,
                        taskJson: jsonResolved.path,
                        value: null,
                        readError: readError || null
                    };
                    if (!readError) {
                        var parsed = TrellisParser.parseJson(text);
                        if (parsed.ok)
                            record.value = parsed.value;
                        else
                            record.readError = parsed.error;
                    }
                    project.taskRecords.push(record);
                }, project, true);
            });
        });
    }

    function _discoverSession(scan, project, candidate, sessionsRoot) {
        _canonicalize(scan, candidate, function (canonicalPath, error) {
            if (!canonicalPath) {
                project.coreReadFailed = true;
                _pushProjectWarning(scan, project, _warning("session_path_invalid", "session pointer could not be canonicalized", { reason: error }));
                return;
            }
            var resolved = TrellisPaths.resolveSessionFile(project.root, sessionsRoot, candidate, canonicalPath);
            if (!resolved.ok) {
                project.coreReadFailed = true;
                _pushProjectWarning(scan, project, _warning("session_path_rejected", "session file rejected", { reason: resolved.reason }));
                return;
            }
            if (project.sessionKeys.indexOf(resolved.sessionKey) !== -1)
                return;
            project.sessionKeys.push(resolved.sessionKey);
            _queueFile(scan, resolved.path, function (text, readError) {
                var record = {
                    sessionKey: resolved.sessionKey,
                    path: resolved.path,
                    value: null,
                    readError: readError || null,
                    resolution: null
                };
                if (readError) {
                    project.sessionRecords.push(record);
                    return;
                }
                var parsed = TrellisParser.parseJson(text);
                if (!parsed.ok) {
                    record.readError = parsed.error;
                    project.sessionRecords.push(record);
                    return;
                }
                record.value = parsed.value;
                _resolveSessionPointer(scan, project, record);
            }, project, true);
        });
    }

    function _discoverAncestorProject(scan, canonicalRoot) {
        var candidates = TrellisPaths.ancestorPaths(canonicalRoot,
            root.maxAncestorCandidates);
        if (!candidates.length)
            return;

        function probe(index) {
            if (!_isCurrent(scan.generation) || index >= candidates.length)
                return;

            var candidate = candidates[index];
            var candidateTrellis = TrellisPaths.joinPath(candidate, ".trellis");
            // Keep the ancestor probe argv-only and bounded. A configured
            // task/.trellis descendant is promoted only after the real
            // directory has been checked and canonicalized.
            _queueProcess(scan, ["test", "-d", candidateTrellis], function (output, exitCode) {
                if (exitCode !== 0) {
                    probe(index + 1);
                    return;
                }
                _canonicalize(scan, candidateTrellis, function (canonicalTrellis, error) {
                    if (!canonicalTrellis) {
                        probe(index + 1);
                        return;
                    }
                    var projectRoot = TrellisPaths.parentPath(canonicalTrellis);
                    if (!projectRoot
                            || !TrellisPaths.isWithin(canonicalRoot, projectRoot, true)
                            || TrellisPaths.joinPath(projectRoot, ".trellis") !== canonicalTrellis) {
                        probe(index + 1);
                        return;
                    }
                    var project = _newProject(scan, projectRoot, canonicalTrellis);
                    if (project && !project.discoveryStarted) {
                        project.discoveryStarted = true;
                        _discoverProject(scan, project);
                    }
                });
            });
        }

        probe(0);
    }

    function _resolveSessionPointer(scan, project, record, appendRecord) {
        var shouldAppend = appendRecord !== false;
        var pointer = record.value && record.value.current_task;
        if (typeof pointer !== "string" || !pointer.trim()) {
            record.resolution = { ok: false, reason: "malformed_pointer" };
            if (shouldAppend)
                project.sessionRecords.push(record);
            return;
        }
        var relative = TrellisPaths.normalizePointer(pointer);
        if (!relative.ok) {
            record.resolution = relative;
            if (shouldAppend)
                project.sessionRecords.push(record);
            return;
        }
        var lexical = TrellisPaths.joinPath(project.root, relative.relativePath);
        _canonicalize(scan, lexical, function (canonicalDir, error) {
            if (!canonicalDir) {
                record.resolution = { ok: false, reason: "stale_target" };
                if (shouldAppend)
                    project.sessionRecords.push(record);
                return;
            }
            var resolved = TrellisPaths.resolvePointer(project.root, pointer, canonicalDir, {});
            if (!resolved.ok) {
                record.resolution = resolved;
                if (shouldAppend)
                    project.sessionRecords.push(record);
                return;
            }
            _canonicalize(scan, resolved.taskJsonPath, function (canonicalJson, jsonError) {
                if (!canonicalJson) {
                    record.resolution = { ok: false, reason: "task_json_missing" };
                    if (shouldAppend)
                        project.sessionRecords.push(record);
                    return;
                }
                var jsonResolved = TrellisPaths.resolveTaskJson(resolved, canonicalJson);
                record.resolution = jsonResolved.ok ? resolved : { ok: false, reason: jsonResolved.reason };
                if (shouldAppend)
                    project.sessionRecords.push(record);
            });
        });
    }

    function _discoverRoot(scan, configuredRoot, canonicalRoot) {
        if (!TrellisPaths.isWithin(canonicalRoot, configuredRoot, true)) {
            scan.degraded = true;
            _pushWarning(scan, _warning("root_canonicalization", "canonical root escaped its configured root", {
                root: configuredRoot
            }));
            return;
        }
        _discoverAncestorProject(scan, canonicalRoot);
        _queueProcess(scan, ["find", canonicalRoot, "-maxdepth", root.maxDiscoveryDepth.toString(), "-type", "d", "-name", ".trellis", "-print"], function (output, exitCode) {
            if (exitCode !== 0) {
                scan.degraded = true;
                _pushWarning(scan, _warning("project_discovery_failed", "could not discover .trellis directories", { root: configuredRoot }));
                return;
            }
            var lines = _boundedLines(output, root.maxProjects);
            if (lines.warnings.length)
                scan.degraded = true;
            for (var w = 0; w < lines.warnings.length; w++)
                _pushWarning(scan, Object.assign({}, lines.warnings[w], {
                    root: configuredRoot,
                    scope: "root"
                }));
            for (var i = 0; i < lines.lines.length; i++) {
                let candidate = lines.lines[i];
                _canonicalize(scan, candidate, function (canonicalTrellis, error) {
                    if (!canonicalTrellis) {
                        _pushWarning(scan, _warning("project_path_invalid", "discovered .trellis path could not be canonicalized", {
                            root: canonicalRoot,
                            reason: error
                        }));
                        return;
                    }
                    var projectRoot = TrellisPaths.parentPath(canonicalTrellis);
                    if (!TrellisPaths.isWithin(projectRoot, canonicalRoot, true)) {
                        _pushWarning(scan, _warning("project_outside_root", "discovered project is outside configured root", {
                            root: canonicalRoot
                        }));
                        return;
                    }
                    var project = _newProject(scan, projectRoot, canonicalTrellis);
                    if (project && !project.discoveryStarted) {
                        project.discoveryStarted = true;
                        _discoverProject(scan, project);
                    }
                });
            }
        });
    }

    function _onKnownFileChanged(path, generation) {
        if (!_isCurrent(generation) || !path || !root.knownFileRegistry[path])
            return;
        var result = TrellisWatch.addPendingPath(root.pendingKnownPaths, path, root.maxPendingKnownReloads);
        root.pendingKnownPaths = result.pending;
        if (result.dropped) {
            root.pendingKnownWarnings.push(_warning("reload_limit", "known-file reload queue cap reached", {
                path: path,
                projectId: root.knownFileRegistry[path].projectId
            }));
            if (root.pendingKnownWarnings.length > root.maxWarnings)
                root.pendingKnownWarnings.shift();
        }
        knownReloadTimer.restart();
    }

    function _findProjectInput(inputs, projectId) {
        var list = inputs || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i] && (list[i].id === projectId || list[i].root === projectId))
                return list[i];
        }
        return null;
    }

    function _findRecord(records, propertyName, value) {
        var list = records || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i][propertyName] === value)
                return list[i];
        }
        return null;
    }

    function _projectCoreInputsComplete(project) {
        if (!project || project.coreReadFailed)
            return false;
        var taskRecords = project.taskRecords || [];
        for (var t = 0; t < taskRecords.length; t++) {
            var task = taskRecords[t] || {};
            if (task.readError || !task.value || typeof task.value !== "object"
                    || Array.isArray(task.value))
                return false;
        }
        var sessionRecords = project.sessionRecords || [];
        for (var s = 0; s < sessionRecords.length; s++) {
            var session = sessionRecords[s] || {};
            if (session.readError || !session.value || typeof session.value !== "object"
                    || Array.isArray(session.value))
                return false;
        }
        return true;
    }

    function _previousProjectReadAt(project) {
        var candidates = root.currentInputs || [];
        for (var i = 0; i < candidates.length; i++) {
            if (candidates[i] && (candidates[i].id === project.id
                    || candidates[i].root === project.root)
                    && candidates[i].lastSuccessfulReadAt)
                return candidates[i].lastSuccessfulReadAt;
        }
        candidates = root.lastGoodInputs || [];
        for (var j = 0; j < candidates.length; j++) {
            if (candidates[j] && (candidates[j].id === project.id
                    || candidates[j].root === project.root)
                    && candidates[j].lastSuccessfulReadAt)
                return candidates[j].lastSuccessfulReadAt;
        }
        return "";
    }

    function _clearVersionWarnings(project) {
        if (!project || !project.warnings)
            return;
        var retained = [];
        for (var i = 0; i < project.warnings.length; i++) {
            var warning = project.warnings[i];
            if (warning && (warning.code === "version_unavailable"
                    || warning.code === "version_path_rejected"
                    || warning.code === "version_unverified"
                    || warning.code === "version_invalid"))
                continue;
            retained.push(warning);
        }
        project.warnings = retained;
    }

    function _applyKnownReload(reload, path, text, error) {
        var metadata = root.knownFileRegistry[path];
        if (!metadata)
            return;
        var project = _findProjectInput(reload.inputs, metadata.projectId);
        if (!project) {
            _pushWarning(reload, _warning("reload_project_missing", "known-file project is no longer loaded", {
                path: path,
                projectId: metadata.projectId
            }));
            return;
        }
        if (metadata.kind === "version") {
            _clearVersionWarnings(project);
            if (error) {
                _pushWarning(reload, _warning("version_reload_failed", "could not reload .trellis/.version", {
                    path: path,
                    reason: error,
                    projectId: metadata.projectId
                }));
                return;
            }
            var version = (text || "").trim();
            if (version && !TrellisPaths.hasControlCharacters(version)) {
                project.trellisVersion = version;
                if (version !== root.verifiedTrellisVersion)
                    _pushProjectWarning(reload, project, _warning("version_unverified", "Trellis version is not the verified compatibility baseline", {
                        path: path,
                        version: version
                    }));
            } else {
                _pushProjectWarning(reload, project, _warning("version_invalid", "Trellis version is missing or malformed", {
                    path: path
                }));
            }
            return;
        }

        if (metadata.kind === "task") {
            var task = _findRecord(project.taskRecords, "taskJson", path);
            if (!task)
                return;
            if (error) {
                task.readError = error;
                _pushWarning(reload, _warning("task_reload_failed", "task.json reload failed; last valid value retained", {
                    path: path,
                    reason: error,
                    projectId: metadata.projectId
                }));
                return;
            }
            var parsedTask = TrellisParser.parseJson(text);
            if (!parsedTask.ok) {
                task.readError = parsedTask.error;
                _pushWarning(reload, _warning("task_reload_failed", "task.json is malformed; last valid value retained", {
                    path: path,
                    reason: parsedTask.error,
                    projectId: metadata.projectId
                }));
                return;
            }
            if (!parsedTask.value || typeof parsedTask.value !== "object"
                    || Array.isArray(parsedTask.value)) {
                task.readError = "task_data_invalid";
                _pushWarning(reload, _warning("task_reload_failed", "task.json is malformed; last valid value retained", {
                    path: path,
                    reason: "task_data_invalid",
                    projectId: metadata.projectId
                }));
                return;
            }
            task.value = parsedTask.value;
            task.readError = null;
            project.coreReadChanged = true;
            return;
        }

        if (metadata.kind === "session") {
            var session = _findRecord(project.sessionRecords, "path", path);
            if (!session)
                return;
            if (error) {
                session.readError = error;
                _pushWarning(reload, _warning("session_reload_failed", "session pointer reload failed; last valid value retained", {
                    path: path,
                    reason: error,
                    projectId: metadata.projectId
                }));
                return;
            }
            var parsedSession = TrellisParser.parseJson(text);
            if (!parsedSession.ok) {
                session.readError = parsedSession.error;
                _pushWarning(reload, _warning("session_reload_failed", "session pointer is malformed; last valid value retained", {
                    path: path,
                    reason: parsedSession.error,
                    projectId: metadata.projectId
                }));
                return;
            }
            session.value = parsedSession.value;
            session.readError = null;
            session.resolution = null;
            _resolveSessionPointer(reload, project, session, false);
            project.coreReadChanged = true;
        }
    }

    function _publishSnapshot(inputs, warnings) {
        var publishedAt = new Date().toISOString();
        var snapshot = TrellisParser.makeSnapshot(inputs || [], warnings || [], publishedAt, {
            scanStartedAt: root.scanStartedAt,
            lastSuccessfulDiscoveryAt: root.lastSuccessfulDiscoveryAt,
            snapshotIsCurrent: root.snapshotIsCurrent,
            lastGoodFallbackActive: root.lastGoodFallbackActive
        });
        root.publicationGeneration += 1;
        snapshot.runtime.observationEpoch = root.observationEpoch;
        snapshot.runtime.publicationGeneration = root.publicationGeneration;
        var quietSelection = !root.changeTracker.initialized;
        var recent = TrellisChanges.observeSnapshot(root.changeTracker, snapshot,
            TrellisProjection.makeHealthProjection(snapshot),
            root.publicationGeneration, publishedAt);
        // Primary is a UI projection, including when new source facts change
        // its selection. This event does not imply a manual user action.
        if (root.observationPreferences) {
            recent = TrellisChanges.observeSelection(root.changeTracker,
                _selectionSummary(snapshot), publishedAt, quietSelection);
        }
        if (root.pluginService)
            root.pluginService.setGlobalVar(root.pluginId, "snapshot", snapshot);
        recentChangesVar.set(recent);
        root.lastGoodSnapshot = snapshot;
        return snapshot;
    }

    function _selectionSummary(snapshot) {
        var preferences = root.observationPreferences || ({});
        return TrellisChanges.selectionSummary(
            TrellisProjection.parsePinnedTaskToken(preferences.pinnedTaskId),
            TrellisProjection.selectPrimary(snapshot, preferences));
    }

    function _observeSelectionPreferences() {
        if (!root.pluginService || !root.pluginId
                || typeof root.pluginService.loadPluginState !== "function")
            return;
        try {
            // Key-scoped reads only: the output discovery cache is not input.
            var preferences = {
                pinnedTaskId: root.pluginService.loadPluginState(root.pluginId, "pinnedTaskId", ""),
                selectedProjectId: root.pluginService.loadPluginState(root.pluginId, "selectedProjectId", "")
            };
            var quiet = root.observationPreferences === null || !root.lastGoodSnapshot;
            root.observationPreferences = preferences;
            recentChangesVar.set(TrellisChanges.observeSelection(root.changeTracker,
                _selectionSummary(root.lastGoodSnapshot), new Date().toISOString(), quiet));
        } catch (error) {
            // A State read failure is not an observed selection or Health fact.
        }
    }

    function _rememberProjects(inputs) {
        // This cache is output-only: it is never read to authorize or seed a
        // discovery scan. The only write target is this plugin's DMS state.
        if (!root.pluginService
                || typeof root.pluginService.savePluginState !== "function")
            return;
        var remembered = TrellisDiscovery.makeRememberedProjects(inputs,
            new Date().toISOString(), root.maxProjects);
        try {
            root.pluginService.savePluginState(root.pluginId,
                "discoveredProjects", remembered);
        } catch (error) {
            console.warn("Trellis DMS: could not remember discovered projects", error);
        }
    }

    function _finishKnownReload(reload) {
        if (!reload || reload.published || !_isCurrent(reload.generation))
            return;
        reload.published = true;
        root.knownReloadInFlight = false;
        // Keep scan-level diagnostics, but rebuild transient reload warnings
        // from this batch so a recovered file does not retain a stale error
        // forever. Record health errors remain visible through the parser.
        var warnings = (root.currentBaseWarnings || root.currentWarnings || []).slice();
        var extraWarnings = reload.warnings || [];
        for (var i = 0; i < extraWarnings.length && warnings.length < root.maxWarnings; i++)
            warnings.push(extraWarnings[i]);
        var readAt = new Date().toISOString();
        for (var p = 0; p < reload.inputs.length; p++) {
            var project = reload.inputs[p];
            if (project && project.coreReadChanged) {
                if (_projectCoreInputsComplete(project))
                    project.lastSuccessfulReadAt = readAt;
                project.coreReadChanged = false;
            }
        }
        root.currentInputs = reload.inputs;
        root.currentWarnings = warnings;
        root.lastGoodInputs = _cloneValue(reload.inputs);
        // A known-file reload cannot establish that topology discovery recovered.
        // Keep the scan-level fallback state until a later topology scan publishes.
        root.snapshotIsCurrent = !root.lastGoodFallbackActive;
        _publishSnapshot(root.currentInputs, root.currentWarnings);
        if (Object.keys(root.pendingKnownPaths || {}).length)
            knownReloadTimer.restart();
    }

    function _flushKnownReload() {
        if (root.knownReloadInFlight)
            return;
        var paths = TrellisWatch.pendingPaths(root.pendingKnownPaths);
        root.pendingKnownPaths = ({});
        var pendingWarnings = root.pendingKnownWarnings || [];
        root.pendingKnownWarnings = [];
        if (!paths.length || !root.currentInputs || !root.currentInputs.length)
            return;

        var reload = {
            kind: "known-reload",
            generation: root.scanGeneration,
            pending: 0,
            published: false,
            queueing: true,
            inputs: _cloneValue(root.currentInputs),
            warnings: []
        };
        root.knownReloadInFlight = true;
        for (var i = 0; i < pendingWarnings.length; i++)
            _pushWarning(reload, pendingWarnings[i]);
        for (var q = 0; q < paths.length; q++) {
            var changedPath = paths[q];
            if (!root.knownFileRegistry[changedPath])
                continue;
            (function (pathValue) {
                _queueFile(reload, pathValue, function (text, error) {
                    _applyKnownReload(reload, pathValue, text, error);
                });
            })(changedPath);
        }
        reload.queueing = false;
        if (reload.pending === 0)
            _finishKnownReload(reload);
    }

    function _installWatchers(scan, inputs) {
        _destroyWatchers();
        var watcherCount = 0;
        var registry = root.knownFileRegistry;

        function addWatcher(path, metadata) {
            if (!path || registry[path])
                return;
            if (watcherCount >= root.maxKnownWatchers) {
                _pushWarning(scan, _warning("watcher_limit", "known-file watcher cap reached", {
                    path: path,
                    projectId: metadata.projectId
                }));
                return;
            }
            var watcher = knownWatcherComponent.createObject(root, {
                generation: scan.generation,
                ownerRoot: root,
                watchedPath: path,
                path: path
            });
            if (!watcher) {
                _pushWarning(scan, _warning("watcher_create_failed", "could not create known-file watcher", {
                    path: path,
                    projectId: metadata.projectId
                }));
                return;
            }
            metadata.generation = scan.generation;
            registry[path] = metadata;
            root.knownWatchers[path] = watcher;
            root.ownedWatchers.push(watcher);
            watcherCount += 1;
        }

        var projects = inputs || [];
        for (var i = 0; i < projects.length; i++) {
            var project = projects[i];
            if (!project)
                continue;
            addWatcher(project.versionPath, {
                kind: "version",
                projectId: project.id || project.root
            });
            var tasks = project.taskRecords || [];
            for (var t = 0; t < tasks.length; t++) {
                if (tasks[t] && tasks[t].taskJson)
                    addWatcher(tasks[t].taskJson, {
                        kind: "task",
                        projectId: project.id || project.root
                    });
            }
            var sessions = project.sessionRecords || [];
            for (var s = 0; s < sessions.length; s++) {
                if (sessions[s] && sessions[s].path)
                    addWatcher(sessions[s].path, {
                        kind: "session",
                        projectId: project.id || project.root
                    });
            }
        }
    }

    function _maybeFinish(scan) {
        if (!scan || scan.pending !== 0 || scan.published || scan.queueing
                || !_isCurrent(scan.generation))
            return;
        if (scan.kind === "known-reload") {
            _finishKnownReload(scan);
            return;
        }
        scan.published = true;
        if (scan.roots.length && scan.projects.length === 0)
            _pushWarning(scan, _warning("no_projects_found", "no Trellis project was found under the configured root"));
        var inputs = [];
        for (var i = 0; i < scan.projects.length; i++) {
            var project = scan.projects[i];
            var lastSuccessfulReadAt = _previousProjectReadAt(project);
            if (_projectCoreInputsComplete(project))
                lastSuccessfulReadAt = new Date().toISOString();
            inputs.push({
                id: project.id,
                name: project.name,
                root: project.root,
                versionPath: project.versionPath,
                trellisVersion: project.trellisVersion,
                lastSuccessfulReadAt: lastSuccessfulReadAt,
                coreReadFailed: project.coreReadFailed,
                taskRecords: project.taskRecords,
                sessionRecords: project.sessionRecords,
                warnings: project.warnings,
                errors: project.errors
            });
        }

        var rootsKey = scan.roots.join("|");
        var fallbackActive = false;
        if (scan.degraded && scan.roots.length && root.lastGoodInputs
                && root.lastGoodRootsKey === rootsKey) {
            inputs = _cloneValue(root.lastGoodInputs);
            fallbackActive = true;
            _pushWarning(scan, _warning("last_good_snapshot", "discovery was degraded; last valid Trellis snapshot retained"));
        }
        root.currentInputs = inputs;
        root.lastGoodFallbackActive = fallbackActive;
        root.snapshotIsCurrent = !fallbackActive;
        if (!scan.degraded && scan.roots.length)
            root.lastSuccessfulDiscoveryAt = new Date().toISOString();
        if (!scan.degraded || !root.lastGoodInputs) {
            root.lastGoodInputs = _cloneValue(inputs);
            root.lastGoodRootsKey = rootsKey;
        }
        _installWatchers(scan, inputs);
        root.currentBaseWarnings = scan.warnings.slice(0, root.maxWarnings);
        root.currentWarnings = root.currentBaseWarnings.slice();
        _publishSnapshot(root.currentInputs, root.currentWarnings);
        if (!scan.degraded)
            _rememberProjects(inputs);
        _armTopologyTimer();
        root.ownedProcesses = [];
        root.ownedReaders = [];
    }

    function _armTopologyTimer() {
        topologyTimer.interval = root.topologyIntervalSeconds * 1000;
        topologyTimer.restart();
    }

    function _topologySettingsSnapshot(settings) {
        var source = settings || ({});
        return {
            scanRoots: Array.isArray(source.scanRoots)
                ? source.scanRoots.slice() : source.scanRoots,
            projectRoot: source.projectRoot,
            refreshToken: source.refreshToken,
            topologyInterval: source.topologyInterval
        };
    }

    function _observePluginSettingsChange() {
        if (!root.observedTopologySettings)
            return;
        var settings = root.pluginData || ({});
        var changes = TrellisWatch.topologySettingsChanges(
            root.observedTopologySettings, settings,
            root.topologyIntervalDefault, root.maxScanRoots);
        root.observedTopologySettings = root._topologySettingsSnapshot(settings);

        if (changes.intervalChanged) {
            root.topologyIntervalSeconds = changes.intervalSeconds;
            if (topologyTimer.running)
                root._armTopologyTimer();
        }
        if (changes.rootsChanged) {
            _rejectDetailScope(root.detailGeneration, root.currentDetailRequestId);
            _cancelSearchRead(true);
            searchResponseVar.set(null);
            _cancelAction(true);
        }
        if (changes.rootsChanged || changes.refreshRequested)
            settingsRefreshTimer.restart();
    }

    function startScan(reason) {
        root.scanGeneration += 1;
        _destroyOwned();
        root.scanStartedAt = new Date().toISOString();
        var generation = root.scanGeneration;
        var settings = pluginData || {};
        root.observedTopologySettings = root._topologySettingsSnapshot(settings);
        var intervalResult = TrellisWatch.normalizeTopologyInterval(settings.topologyInterval, root.topologyIntervalDefault);
        root.topologyIntervalSeconds = intervalResult.value;
        // An array-valued scanRoots setting is authoritative even when empty.
        // Only an absent/non-array key falls back to the v0.4 projectRoot.
        var rootInput = TrellisDiscovery.selectRootInput(settings, root.maxScanRoots);
        var normalized = TrellisPaths.normalizeRoots(rootInput.value);
        TrellisChanges.resetScope(root.changeTracker, JSON.stringify(normalized.roots || []));
        if (rootInput.truncated > 0) {
            normalized.warnings.push(_warning("scan_root_limit", "trusted scan root cap reached", {
                limit: root.maxScanRoots,
                dropped: rootInput.truncated
            }));
        }
        if (intervalResult.invalid || intervalResult.clamped) {
            normalized.warnings.push(_warning("topology_interval", "topology interval was normalized to the safe 15–300 second range", {
                value: settings.topologyInterval,
                normalized: intervalResult.value
            }));
        }
        var scan = {
            kind: "topology",
            generation: generation,
            pending: 0,
            published: false,
            queueing: true,
            projects: [],
            warnings: normalized.warnings ? normalized.warnings.slice() : [],
            roots: normalized.roots || [],
            reason: reason || "initial",
            degraded: rootInput.truncated > 0
        };
        root.activeScan = scan;
        if (!scan.roots.length) {
            scan.queueing = false;
            _maybeFinish(scan);
            return;
        }
        for (var i = 0; i < scan.roots.length; i++) {
            let configuredRoot = scan.roots[i];
            _canonicalize(scan, configuredRoot, function (canonicalRoot, error) {
                if (!canonicalRoot) {
                    scan.degraded = true;
                    _pushWarning(scan, _warning("root_unavailable", "configured root could not be canonicalized", {
                        root: configuredRoot,
                        reason: error
                    }));
                    return;
                }
                // From this point onward the canonical root is the containment
                // boundary; keeping the lexical symlink path would reject a
                // valid configured symlink before discovery starts.
                _discoverRoot(scan, canonicalRoot, canonicalRoot);
            });
        }
        scan.queueing = false;
        _maybeFinish(scan);
    }

    Connections {
        target: root.pluginService
        enabled: !!root.pluginService

        function onPluginDataChanged(changedPluginId) {
            if (changedPluginId === root.pluginId)
                Qt.callLater(root._observePluginSettingsChange);
        }

        function onPluginStateChanged(changedPluginId) {
            if (changedPluginId === root.pluginId)
                Qt.callLater(root._observeSelectionPreferences);
        }
    }

    Component.onCompleted: Qt.callLater(function () {
        _observeSelectionPreferences();
        startScan("initial");
    })
    onPluginServiceChanged: Qt.callLater(root._observeSelectionPreferences)
    onPluginIdChanged: Qt.callLater(root._observeSelectionPreferences)

    Component.onDestruction: {
        root.scanGeneration += 1;
        root.activeScan = null;
        _cancelDetailRead(false);
        _cancelSearchRead(true);
        _cancelAction(true);
        _destroyOwned();
        root.changeTracker = TrellisChanges.createTracker(root.observationEpoch);
    }
}
