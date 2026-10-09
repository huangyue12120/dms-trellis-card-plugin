import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadQmlJs(relativePath) {
  const filename = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filename, "utf8")
    .replace(/^\.pragma library\s*/m, "");
  const sandbox = { console, Date, JSON, Object, Array, Math, String, RegExp };
  vm.runInNewContext(source, sandbox, { filename });
  return sandbox;
}

function assertExactCaseResource(relativePath) {
  const parts = relativePath.split(path.sep);
  let directory = repoRoot;
  for (const part of parts) {
    const matches = fs.readdirSync(directory)
      .filter((entry) => entry.toLowerCase() === part.toLowerCase());
    assert.equal(matches.length, 1,
      `expected one case-stable resource entry for ${relativePath}`);
    assert.equal(matches[0], part,
      `resource path must use exact case: ${relativePath}`);
    directory = path.join(directory, part);
  }
  assert.equal(fs.statSync(directory).isFile(), true,
    `expected a file resource: ${relativePath}`);
}

function assertExactCaseQmlImports(qmlRelativePath) {
  const qmlPath = path.join(repoRoot, qmlRelativePath);
  const source = fs.readFileSync(qmlPath, "utf8");
  const imports = Array.from(source.matchAll(/^\s*import\s+"([^\"]+\.js)"\s+as\s+\w+\s*$/gm));
  for (const match of imports)
    assertExactCaseResource(path.join(path.dirname(qmlRelativePath), match[1]));
  return imports.map((match) => match[1]);
}

const expectedQmlImports = {
  "TrellisDms/TrellisDaemon.qml": [
    "lib/trellisPaths.js",
    "lib/trellisParser.js",
    "lib/trellisWatch.js",
    "lib/trellisdiscovery.js",
    "lib/trellisprojection.js",
    "lib/trellischanges.js",
    "lib/trellisnotifications.js"
  ],
  "TrellisDms/TrellisSettings.qml": [
    "lib/trellisdiscovery.js",
    "lib/trellisprojection.js",
    "lib/trellisWatch.js"
  ],
  "TrellisDms/TrellisWidget.qml": ["lib/trellisprojection.js", "lib/trellischanges.js", "lib/trellisPaths.js"],
  "TrellisDms/TrellisDesktopWidget.qml": ["lib/trellisprojection.js"]
};

for (const [qmlRelativePath, expectedImports] of Object.entries(expectedQmlImports)) {
  assert.deepEqual(assertExactCaseQmlImports(qmlRelativePath), expectedImports);
}

assertExactCaseResource("TrellisDms/lib/trellisdiscovery.js");
assertExactCaseResource("TrellisDms/lib/trellisprojection.js");
assertExactCaseResource("TrellisDms/lib/trellisnotifications.js");

const paths = loadQmlJs("TrellisDms/lib/trellisPaths.js");
const parser = loadQmlJs("TrellisDms/lib/trellisParser.js");
const discoveryPolicy = loadQmlJs("TrellisDms/lib/trellisdiscovery.js");
const projection = loadQmlJs("TrellisDms/lib/trellisprojection.js");
const watch = loadQmlJs("TrellisDms/lib/trellisWatch.js");
const changes = loadQmlJs("TrellisDms/lib/trellischanges.js");
const notifications = loadQmlJs("TrellisDms/lib/trellisnotifications.js");

assert.deepEqual(Array.from(paths.ancestorPaths(
  "/workspace/project/.trellis/tasks/live-task", 8
)), [
  "/workspace/project/.trellis/tasks/live-task",
  "/workspace/project/.trellis/tasks",
  "/workspace/project/.trellis",
  "/workspace/project",
  "/workspace",
  "/"
]);
assert.deepEqual(Array.from(paths.ancestorPaths(
  "/workspace/project/.trellis/tasks/live-task", 3
)), [
  "/workspace/project/.trellis/tasks/live-task",
  "/workspace/project/.trellis/tasks",
  "/workspace/project/.trellis"
]);
assert.deepEqual(Array.from(paths.ancestorPaths("/", 8)), ["/"]);
assert.deepEqual(Array.from(paths.ancestorPaths("relative/project", 8)), []);
assert.deepEqual(Array.from(paths.ancestorPaths("/workspace/project\n/task", 8)), []);
assert.deepEqual(Array.from(paths.ancestorPaths("/workspace/project", 0)), []);
assert.equal(paths.joinPath("/", ".trellis"), "/.trellis");

const validMarkdownRequest = paths.validateMarkdownRequest({
  requestId: "detail-1",
  kind: "markdown",
  projectId: "alpha",
  taskId: "build",
  document: "prd.md"
});
assert.equal(validMarkdownRequest.ok, true);
assert.equal(validMarkdownRequest.request.document, "prd.md");
for (const document of ["prd.md", "design.md", "implement.md"])
  assert.equal(paths.validateMarkdownRequest({
    requestId: `detail-${document}`,
    kind: "markdown",
    projectId: "alpha",
    taskId: "build",
    document
  }).ok, true);
assert.equal(paths.validateMarkdownRequest({
  requestId: "detail-bad-name",
  kind: "markdown",
  projectId: "alpha",
  taskId: "build",
  document: "../prd.md"
}).reason, "markdown_name");
assert.equal(paths.validateMarkdownRequest({
  requestId: "detail-extra",
  kind: "markdown",
  projectId: "alpha",
  taskId: "build",
  document: "prd.md",
  path: "/tmp/secret"
}).reason, "markdown_request_field");
assert.equal(paths.validateMarkdownRequest({
  requestId: "detail-control",
  kind: "markdown",
  projectId: "alpha",
  taskId: "build\nother",
  document: "prd.md"
}).reason, "markdown_task_id");
assert.equal(paths.markdownByteLimit(), 256 * 1024);
assert.ok(paths.markdownByteLimit() <= 1024 * 1024);
assert.equal(paths.utf8ByteLength("markdown"), 8);
assert.equal(paths.utf8ByteLength("文档"), 6);
assert.equal(paths.utf8ByteLength("📝"), 4);

const archiveLimits = paths.archiveLimits();
assert.equal(archiveLimits.monthLimit, 48);
assert.equal(archiveLimits.taskDirectoryLimit, 2048);
assert.equal(archiveLimits.pageSizeDefault, 16);
assert.equal(archiveLimits.pageSizeMaximum, 32);
assert.equal(archiveLimits.pageMaximum, 63);
assert.equal(archiveLimits.warningLimit, 8);
for (const month of ["2026-01", "2026-09", "1999-12"])
  assert.equal(paths.isArchiveMonth(month), true);
for (const month of ["2026-00", "2026-13", "26-09", "2026-9", "../2026-09", "2026-09\n"])
  assert.equal(paths.isArchiveMonth(month), false);
for (const dirName of ["09-archived", "task with spaces"])
  assert.equal(paths.isArchiveTaskDirectoryName(dirName), true);
for (const dirName of ["", ".", "..", "nested/task", "..\\task", "task\nother"])
  assert.equal(paths.isArchiveTaskDirectoryName(dirName), false);
assert.deepEqual({ ...paths.normalizeArchivePage(2, 12) }, {
  page: 2, pageSize: 12, offset: 24, invalid: false, clamped: false
});
assert.deepEqual({ ...paths.normalizeArchivePage(-4, 0) }, {
  page: 0, pageSize: 1, offset: 0, invalid: false, clamped: true
});
assert.deepEqual({ ...paths.normalizeArchivePage("bad", 999) }, {
  page: 0, pageSize: 32, offset: 0, invalid: true, clamped: true
});

const validArchiveIndexRequest = paths.validateArchiveRequest({
  requestId: "archive-index-1",
  kind: "archive-index",
  projectId: "alpha",
  page: 0,
  pageSize: 16
});
assert.equal(validArchiveIndexRequest.ok, true);
assert.equal(validArchiveIndexRequest.request.pageSize, 16);
assert.equal(paths.validateArchiveRequest({
  requestId: "archive-page-1",
  kind: "archive-page",
  projectId: "alpha",
  month: "2026-09",
  page: 1,
  pageSize: 16
}).ok, true);
assert.equal(paths.validateArchiveRequest({
  requestId: "archive-task-1",
  kind: "archive-task",
  projectId: "alpha",
  month: "2026-09",
  taskId: "archived",
  dirName: "09-archived",
  document: "design.md"
}).ok, true);
assert.equal(paths.validateArchiveRequest({
  requestId: "archive-bad-month",
  kind: "archive-page",
  projectId: "alpha",
  month: "../2026-09",
  page: 0,
  pageSize: 16
}).reason, "archive_month_invalid");
assert.equal(paths.validateArchiveRequest({
  requestId: "archive-bad-dir",
  kind: "archive-task",
  projectId: "alpha",
  month: "2026-09",
  taskId: "archived",
  dirName: "nested/task",
  document: "prd.md"
}).reason, "archive_task_directory");
assert.equal(paths.validateArchiveRequest({
  requestId: "archive-raw-path",
  kind: "archive-page",
  projectId: "alpha",
  month: "2026-09",
  page: 0,
  pageSize: 16,
  path: "/tmp/secret"
}).reason, "archive_request_field");

assert.deepEqual(Array.from(discoveryPolicy.selectRootInput({
  scanRoots: []
}).value), []);
assert.equal(discoveryPolicy.selectRootInput({ scanRoots: [] }).source, "scanRoots");
assert.deepEqual(Array.from(discoveryPolicy.selectRootInput({
  scanRoots: ["/trusted/a", "/trusted/b"],
  projectRoot: "/legacy"
}).value), ["/trusted/a", "/trusted/b"]);
const cappedRootInput = discoveryPolicy.selectRootInput({
  scanRoots: ["/one", "/two", "/three"]
}, 2);
assert.deepEqual(Array.from(cappedRootInput.value), ["/one", "/two"]);
assert.equal(cappedRootInput.truncated, 1);
assert.equal(discoveryPolicy.selectRootInput({
  projectRoot: "/legacy"
}).value, "/legacy");
assert.equal(discoveryPolicy.selectRootInput({}).value, "");

const rememberedProjects = discoveryPolicy.makeRememberedProjects([
  { root: "/trusted/alpha", name: "Alpha" },
  { root: "/trusted/alpha", name: "Duplicate" },
  { root: "/trusted/beta" },
  { root: "relative/project", name: "Rejected" }
], "2026-09-22T00:00:00.000Z", 2);
assert.equal(rememberedProjects.length, 2);
assert.equal(rememberedProjects[0].name, "Alpha");
assert.equal(rememberedProjects[1].name, "beta");
assert.equal(rememberedProjects[0].lastSeenAt, "2026-09-22T00:00:00.000Z");
assert.equal(discoveryPolicy.makeRememberedProjects([
  { root: "/trusted/alpha", taskRecords: [{ value: { secret: true } }] }
], "now", 32)[0].taskRecords, undefined);
assert.equal(discoveryPolicy.normalizeRememberedProjects([
  { root: "/trusted/alpha", name: "Alpha", lastSeenAt: "then", extra: "drop" },
  { root: "/trusted/alpha", name: "Duplicate" },
  { root: "/trusted/beta", name: "Beta" }
], 1).length, 1);

for (const mode of ["auto", "task", "project", "counts", "icon", "full"])
  assert.equal(projection.normalizeDisplayMode(mode), mode);
assert.equal(projection.normalizeDisplayMode("future-mode"), "auto");
assert.equal(projection.normalizeDisplayMode(null), "auto");
assert.equal(projection.normalizeBooleanSetting(false, true), false);
assert.equal(projection.normalizeBooleanSetting("false", true), true);
assert.equal(projection.normalizeUiState({}).versionWarning, true);
assert.deepEqual(Array.from(projection.normalizeCollapsedProjectIds([
  "alpha", "alpha", "beta", 42, "x".repeat(2048)
])), ["alpha", "beta"]);
assert.deepEqual(Array.from(projection.normalizeCollapsedTaskGroups([
  "/workspace/alpha/planning", "/workspace/alpha/planning",
  "/workspace/alpha/unknown", "bad"
])), ["/workspace/alpha/planning"]);
assert.equal(projection.normalizeSelectedArchiveMonth("2026-09"), "2026-09");
assert.equal(projection.normalizeSelectedArchiveMonth("2026-13"), "");
assert.equal(projection.normalizeUiState({ showProgress: false }).showProgress, false);
assert.equal(projection.normalizeUiState({ versionWarning: false }).versionWarning, false);
assert.equal(projection.isNewerGeneratedAt(
  "2026-09-23T12:01:00.000Z", "2026-09-23T12:00:00.000Z"), true);
assert.equal(projection.isNewerGeneratedAt(
  "2026-09-23T12:00:00.000Z", "2026-09-23T12:00:00.000Z"), false);
assert.equal(projection.isNewerGeneratedAt(
  "2026-09-23T11:59:00.000Z", "2026-09-23T12:00:00.000Z"), false);
assert.equal(projection.isNewerGeneratedAt(
  "2026-09-23T12:01:00.000Z", ""), true);
assert.equal(projection.isNewerGeneratedAt(
  "not-a-timestamp", "2026-09-23T12:00:00.000Z"), false);
assert.equal(projection.isNewerGeneratedAt(
  "2026-09-23T12:01:00.000Z", "not-a-timestamp"), false);

const projectionSnapshot = {
  schemaVersion: 1,
  projects: [
    {
      id: "alpha",
      name: "Alpha",
      trellisVersion: "0.6.17",
      tasks: [
        { id: "plan", title: "Plan", runtimeState: "inactive", displayState: "planning", activeSessionCount: 0 },
        { id: "build", title: "Build", runtimeState: "active", displayState: "active", activeSessionCount: 2 }
      ],
      sessions: [
        { sessionKey: "alpha-build", taskId: "build", lastSeenAt: "2026-09-23T01:00:00Z" },
        { sessionKey: "alpha-stale", taskId: "plan", lastSeenAt: "2026-09-23T02:00:00Z", stale: true }
      ]
    },
    {
      id: "beta",
      name: "Beta",
      tasks: [
        { id: "check", title: "Check", runtimeState: "inactive", displayState: "in_progress", activeSessionCount: 0 }
      ]
    }
  ],
  warnings: [{ code: "fixture", message: "Needs attention" }]
};
const buildPin = projection.makePinnedTaskToken("alpha", "build");
assert.equal(buildPin, '["alpha","build"]');
assert.equal(projection.parsePinnedTaskToken(buildPin).projectId, "alpha");
assert.equal(projection.parsePinnedTaskToken(buildPin).taskId, "build");
assert.equal(projection.parsePinnedTaskToken(' [ "alpha", "build" ] ').taskId, "build");
assert.equal(projection.makePinnedTaskToken("", "build"), "");
assert.equal(projection.parsePinnedTaskToken("not-json"), null);

const defaultPrimary = projection.selectPrimary(projectionSnapshot, {});
assert.equal(defaultPrimary.projectId, "alpha");
assert.equal(defaultPrimary.taskId, "build");
assert.equal(defaultPrimary.reason, "active");
assert.equal(defaultPrimary.invalidPinnedTask, false);
assert.equal(defaultPrimary.invalidSelectedProject, false);

const pinnedPlan = projection.selectPrimary(projectionSnapshot, {
  pinnedTaskId: projection.makePinnedTaskToken("alpha", "plan")
});
assert.equal(pinnedPlan.projectId, "alpha");
assert.equal(pinnedPlan.taskId, "plan");
assert.equal(pinnedPlan.reason, "pinned");
const pinnedPlanPill = projection.makePillProjection(projectionSnapshot, "auto", {
  pinnedTaskId: projection.makePinnedTaskToken("alpha", "plan")
});
assert.equal(pinnedPlanPill.label, "Plan");
assert.equal(pinnedPlanPill.extraCount, 1);

const stalePinPrimary = projection.selectPrimary(projectionSnapshot, {
  pinnedTaskId: projection.makePinnedTaskToken("alpha", "missing")
});
assert.equal(stalePinPrimary.taskId, "build");
assert.equal(stalePinPrimary.invalidPinnedTask, true);

const recentFallback = projection.selectPrimary(projectionSnapshot, {
  selectedProjectId: "beta"
});
assert.equal(recentFallback.projectId, "alpha");
assert.equal(recentFallback.taskId, "build");
assert.equal(recentFallback.reason, "recent_session");

const stableRecentSnapshot = {
  schemaVersion: 1,
  projects: [
    {
      id: "alpha",
      tasks: [
        { id: "first", runtimeState: "inactive" },
        { id: "second", runtimeState: "inactive" }
      ],
      sessions: [
        { taskId: "second", lastSeenAt: "2026-09-23T03:00:00Z" },
        { taskId: "first", lastSeenAt: "2026-09-23T03:00:00Z" }
      ]
    },
    { id: "beta", tasks: [], sessions: [] }
  ],
  warnings: []
};
assert.equal(projection.selectPrimary(stableRecentSnapshot, {
  selectedProjectId: "beta"
}).taskId, "first");
stableRecentSnapshot.projects[0].sessions = [
  { taskId: "second", lastSeenAt: null },
  { taskId: "first" }
];
assert.equal(projection.selectPrimary(stableRecentSnapshot, {
  selectedProjectId: "beta"
}).taskId, "first");
stableRecentSnapshot.projects[0].sessions = [
  { taskId: "first", lastSeenAt: "2026-09-23T05:00:00Z", stale: true },
  { taskId: "first", lastSeenAt: "2026-09-23T05:00:00Z", error: "read_failed" },
  { taskId: "second", lastSeenAt: "2026-09-23T01:00:00Z" }
];
assert.equal(projection.selectPrimary(stableRecentSnapshot, {
  selectedProjectId: "beta"
}).taskId, "second");

const noRecentSnapshot = JSON.parse(JSON.stringify(projectionSnapshot));
noRecentSnapshot.projects[0].sessions = [];
noRecentSnapshot.projects[0].tasks[1].runtimeState = "inactive";
noRecentSnapshot.projects[0].tasks[1].displayState = "in_progress";
const selectedProjectFallback = projection.selectPrimary(noRecentSnapshot, {
  selectedProjectId: "beta"
});
assert.equal(selectedProjectFallback.projectId, "beta");
assert.equal(selectedProjectFallback.taskId, null);
assert.equal(selectedProjectFallback.reason, "project");

const invalidProjectPrimary = projection.selectPrimary(projectionSnapshot, {
  selectedProjectId: "missing-project"
});
assert.equal(invalidProjectPrimary.taskId, "build");
assert.equal(invalidProjectPrimary.invalidSelectedProject, true);
const malformedPreferences = projection.selectPrimary(projectionSnapshot, {
  pinnedTaskId: ["alpha", "build"],
  selectedProjectId: 42
});
assert.equal(malformedPreferences.invalidPinnedTask, true);
assert.equal(malformedPreferences.invalidSelectedProject, true);

const tiedActiveSnapshot = JSON.parse(JSON.stringify(projectionSnapshot));
tiedActiveSnapshot.projects[0].tasks[0].runtimeState = "active";
tiedActiveSnapshot.projects[0].tasks[0].displayState = "active";
tiedActiveSnapshot.projects[0].sessions = [
  { taskId: "plan", lastSeenAt: "2026-09-23T03:00:00Z" },
  { taskId: "build", lastSeenAt: "2026-09-23T03:00:00Z" }
];
assert.equal(projection.selectPrimary(tiedActiveSnapshot, {
  selectedProjectId: "alpha"
}).taskId, "plan");

const duplicateTaskSnapshot = {
  schemaVersion: 1,
  projects: [
    { id: "alpha", tasks: [{ id: "same", title: "Alpha task", runtimeState: "inactive" }], sessions: [] },
    { id: "beta", tasks: [{ id: "same", title: "Beta task", runtimeState: "inactive" }], sessions: [] }
  ],
  warnings: []
};
const duplicatePinPrimary = projection.selectPrimary(duplicateTaskSnapshot, {
  pinnedTaskId: projection.makePinnedTaskToken("beta", "same")
});
assert.equal(duplicatePinPrimary.projectId, "beta");
assert.equal(duplicatePinPrimary.taskId, "same");
assert.equal(duplicatePinPrimary.reason, "pinned");

const emptyPrimary = projection.selectPrimary({
  schemaVersion: 1,
  projects: [],
  warnings: []
}, {});
assert.equal(emptyPrimary.projectId, null);
assert.equal(emptyPrimary.taskId, null);
assert.equal(emptyPrimary.reason, "no_project");

const immutableProjectionSnapshot = JSON.stringify(projectionSnapshot);
projection.selectPrimary(projectionSnapshot, {
  pinnedTaskId: buildPin,
  selectedProjectId: "beta"
});
projection.makePillProjection(projectionSnapshot, "task", {
  pinnedTaskId: buildPin,
  selectedProjectId: "beta"
});
assert.equal(JSON.stringify(projectionSnapshot), immutableProjectionSnapshot);

const autoProjection = projection.makePillProjection(projectionSnapshot, "auto");
assert.equal(autoProjection.kind, "label");
assert.equal(autoProjection.label, "Build");
assert.equal(autoProjection.warningCount, 1);
assert.equal(projection.makePillProjection(projectionSnapshot, "project").extraCount, 1);
assert.equal(projection.makePillProjection(projectionSnapshot, "counts").taskCount, 3);
assert.equal(projection.makePillProjection(projectionSnapshot, "icon").kind, "icon");
assert.equal(projection.makePillProjection(projectionSnapshot, "full").label,
  "2 projects · 3 tasks · 1 warning");
const versionWarningSnapshot = {
  schemaVersion: 1,
  projects: [],
  warnings: [
    { code: "version_unverified", message: "version" },
    { code: "fixture", message: "fixture" }
  ]
};
assert.equal(projection.makePillProjection(versionWarningSnapshot, "counts", {
  versionWarning: false
}).warningCount, 1);
assert.equal(projection.makePopoutProjection(versionWarningSnapshot, {}, {
  versionWarning: false
}).warnings[0].code, "fixture");
const progressSnapshot = {
  schemaVersion: 1,
  projects: [{
    id: "progress-project",
    tasks: [{ id: "progress-task", progress: 37, displayState: "in_progress" }]
  }],
  warnings: []
};
assert.equal(projection.makePopoutProjection(progressSnapshot, {}, {
  showProgress: true
}).projects[0].tasks[0].progress, 37);
assert.equal(projection.makePopoutProjection(progressSnapshot, {}, {
  showProgress: false
}).projects[0].tasks[0].progress, null);
assert.equal(projection.makePopoutProjection({
  schemaVersion: 1,
  projects: [{ id: "null-progress", tasks: [{ id: "task", progress: null }] }],
  warnings: []
}, {}, { showProgress: true }).projects[0].tasks[0].progress, null);
assert.equal(projection.normalizeCollapsedProjectIds(
  Array.from({ length: 40 }, (_, index) => "project-" + index)).length, 32);
assert.equal(projection.normalizeCollapsedTaskGroups(
  Array.from({ length: 140 }, (_, index) => "project-" + index + "/"
    + (index % 5 === 0 ? "active" : "planning"))).length, 128);
assert.equal(projection.makePillProjection({
  schemaVersion: 1,
  projects: [],
  warnings: []
}, "full").label, "0 projects · 0 tasks · 0 warnings");
assert.equal(projection.makePillProjection({}, "task").ready, false);
assert.equal(projection.makePillProjection(projectionSnapshot, "task").extraCount, 0);

const twoActiveSnapshot = JSON.parse(JSON.stringify(projectionSnapshot));
twoActiveSnapshot.projects[1].tasks[0].runtimeState = "active";
twoActiveSnapshot.projects[1].tasks[0].displayState = "active";
twoActiveSnapshot.projects[1].tasks[0].activeSessionCount = 1;
assert.equal(projection.makePillProjection(twoActiveSnapshot, "auto").kind, "counts");
const taskProjection = projection.makePillProjection(twoActiveSnapshot, "task");
assert.equal(taskProjection.label, "Build");
assert.equal(taskProjection.extraCount, 1);

const popoutProjection = projection.makePopoutProjection(projectionSnapshot, {
  projects: 1,
  tasksPerProject: 1,
  warnings: 1
});
assert.equal(popoutProjection.projects.length, 1);
assert.equal(popoutProjection.hiddenProjectCount, 1);
assert.equal(popoutProjection.projects[0].tasks[0].title, "Build");
assert.equal(popoutProjection.projects[0].hiddenTaskCount, 1);
assert.equal(popoutProjection.warnings.length, 1);
const collapsedProjection = projection.makePopoutProjection(projectionSnapshot, {}, {
  collapsedProjectIds: ["alpha"],
  collapsedTaskGroups: ["alpha/planning"]
});
assert.equal(collapsedProjection.projects[0].collapsed, true);
const errorPopout = projection.makePopoutProjection({
  schemaVersion: 1,
  projects: [{
    id: "broken",
    tasks: [{
      id: "broken-task",
      runtimeState: "error",
      displayState: "planning",
      activeSessionCount: 1
    }]
  }],
  warnings: []
});
assert.equal(errorPopout.projects[0].tasks[0].state, "error");
assert.equal(errorPopout.projects[0].tasks[0].activeSessionCount, 1);
assert.equal(projection.makePopoutProjection({
  schemaVersion: 1,
  projects: [],
  warnings: [{ code: "root_empty", message: "no root" }]
}).unconfigured, true);

const groupedPopoutSnapshot = {
  schemaVersion: 1,
  projects: [{
    id: "grouped",
    name: "Grouped project",
    tasks: [
      { id: "other-first", title: "Custom", runtimeState: "inactive", displayState: "custom", priority: "P3" },
      { id: "active-one", title: "Active", runtimeState: "active", displayState: "active", priority: "P1", activeSessionCount: 3 },
      { id: "progress-one", title: "Progress", runtimeState: "inactive", displayState: "in_progress", priority: "P2" },
      { id: "planning-one", title: "Planning", runtimeState: "inactive", displayState: "planning", priority: "P2", parentId: "other-first" },
      { id: "error-one", title: "Error", runtimeState: "error", displayState: "planning", priority: "P0" },
      { id: "completed-live", title: "Completed live", runtimeState: "inactive", displayState: "completed", priority: "P4" },
      { id: "cycle-a", title: "Cycle A", runtimeState: "inactive", displayState: "planning", parentId: "cycle-b", childIds: ["cycle-b"] },
      { id: "cycle-b", title: "Cycle B", runtimeState: "inactive", displayState: "planning", parentId: "cycle-a", childIds: ["cycle-a"] }
    ],
    sessions: []
  }],
  warnings: []
};
const groupedPopout = projection.makePopoutProjection(groupedPopoutSnapshot, {
  tasksPerProject: 20
}, {
  pinnedTaskId: projection.makePinnedTaskToken("grouped", "planning-one")
});
assert.deepEqual(Array.from(groupedPopout.projects[0].groups, group => group.key),
  ["active", "in_progress", "planning", "error", "other"]);
assert.equal(groupedPopout.projects[0].groups[0].tasks[0].activeSessionCount, 3);
assert.equal(groupedPopout.projects[0].groups[2].tasks[0].parentTitle, "Custom");
assert.equal(groupedPopout.projects[0].groups[2].tasks[0].pinned, true);
assert.equal(groupedPopout.projects[0].groups[2].tasks[1].relationText,
  "Parent: Cycle B · 1 child");
assert.equal(groupedPopout.projects[0].groups[3].tasks[0].state, "error");
assert.deepEqual(Array.from(groupedPopout.projects[0].groups[4].tasks, task => task.id),
  ["other-first", "completed-live"]);
assert.equal(groupedPopout.projects[0].groups[4].tasks[1].state, "completed");

const cappedGroups = projection.makePopoutProjection(groupedPopoutSnapshot, {
  tasksPerProject: 3
});
assert.equal(cappedGroups.projects[0].tasks.length, 3);
assert.equal(cappedGroups.projects[0].hiddenTaskCount, 5);
assert.equal(cappedGroups.projects[0].groups.find(group => group.key === "error").hiddenTaskCount, 1);

const manyProjectsSnapshot = {
  schemaVersion: 1,
  projects: Array.from({ length: 10 }, (_, index) => ({
    id: `project-${index}`,
    name: `Project ${index}`,
    tasks: [{
      id: "same",
      title: `Task ${index}`,
      runtimeState: "inactive",
      displayState: "planning",
      priority: "P2"
    }],
    sessions: []
  })),
  warnings: []
};
const filteredBeyondCap = projection.makePopoutProjection(manyProjectsSnapshot, {
  projects: 2
}, {
  selectedProjectId: "project-9",
  pinnedTaskId: projection.makePinnedTaskToken("project-9", "same")
});
assert.equal(filteredBeyondCap.projects.length, 1);
assert.equal(filteredBeyondCap.projects[0].id, "project-9");
assert.equal(filteredBeyondCap.projects[0].tasks[0].pinned, true);
assert.equal(filteredBeyondCap.hiddenProjectCount, 0);
assert.equal(filteredBeyondCap.projectOptions[9].selected, true);
assert.equal(filteredBeyondCap.invalidSelectedProject, false);
assert.equal(filteredBeyondCap.projectOptions[9].label, "Project 9");
const staleFilteredPopout = projection.makePopoutProjection(manyProjectsSnapshot, {
  projects: 2
}, {
  selectedProjectId: "missing-project"
});
assert.equal(staleFilteredPopout.projects.length, 2);
assert.equal(staleFilteredPopout.selectedProjectId, "");
assert.equal(staleFilteredPopout.invalidSelectedProject, true);
assert.equal(staleFilteredPopout.hiddenProjectCount, 8);
const degradedProjection = projection.makePopoutProjection({
  schemaVersion: 1,
  generatedAt: "2026-09-23T12:00:00.000Z",
  projects: projectionSnapshot.projects,
  warnings: [{
    code: "last_good_snapshot",
    message: "discovery was degraded; last valid Trellis snapshot retained"
  }]
});
assert.equal(degradedProjection.degraded, true);
assert.equal(degradedProjection.generatedAt, "2026-09-23T12:00:00.000Z");
assert.equal(degradedProjection.projects.length, 2);
for (const code of [
  "reload_limit",
  "reload_project_missing",
  "version_reload_failed",
  "task_reload_failed",
  "session_reload_failed"
]) {
  assert.equal(projection.makePopoutProjection({
    schemaVersion: 1,
    generatedAt: "2026-09-23T12:01:00.000Z",
    projects: projectionSnapshot.projects,
    warnings: [{ code, message: "reload retained prior data" }]
  }).degraded, true, `${code} must keep refresh feedback pending`);
}
for (const code of ["malformed_json", "stale_pointer", "version_unverified"]) {
  assert.equal(projection.makePopoutProjection({
    schemaVersion: 1,
    generatedAt: "2026-09-23T12:01:00.000Z",
    projects: projectionSnapshot.projects,
    warnings: [{ code, message: "coherent source warning" }]
  }).degraded, false, `${code} must not masquerade as scan/reload degradation`);
}
const longFilterProjection = projection.makePopoutProjection({
  schemaVersion: 1,
  projects: [{
    id: "long-project",
    name: "A project name that cannot fit inside a narrow filter control",
    tasks: [],
    sessions: []
  }],
  warnings: []
});
assert.equal(longFilterProjection.projectOptions[0].name,
  "A project name that cannot fit inside a narrow filter control");
assert.equal(longFilterProjection.projectOptions[0].label, "A project…");

const topologyIntervalDefaults = watch.topologyIntervalDefaults();
assert.equal(topologyIntervalDefaults.minimum, 15);
assert.equal(topologyIntervalDefaults.defaultValue, 30);
assert.equal(topologyIntervalDefaults.maximum, 300);
assert.equal(watch.normalizeTopologyInterval(undefined, 30).value, 30);
assert.equal(watch.normalizeTopologyInterval(1, 30).value, 15);
assert.equal(watch.normalizeTopologyInterval(999, 30).value, 300);
assert.equal(watch.normalizeTopologyInterval("bad", 30).invalid, true);
const scanSettings = {
  scanRoots: ["/workspace"],
  projectRoot: "/legacy",
  refreshToken: "first",
  topologyInterval: 30,
  showArchive: true
};
const cosmeticSettings = { ...scanSettings, showArchive: false };
const cosmeticChanges = watch.topologySettingsChanges(
  scanSettings, cosmeticSettings, 30, 16);
assert.equal(cosmeticChanges.rootsChanged, false,
  "presentation-only changes must not trigger a topology scan");
assert.equal(cosmeticChanges.refreshRequested, false);
assert.equal(cosmeticChanges.intervalChanged, false);
const refreshChanges = watch.topologySettingsChanges(scanSettings,
  { ...scanSettings, refreshToken: "second" }, 30, 16);
assert.equal(refreshChanges.refreshRequested, true,
  "a refresh token update must request a topology scan");
assert.equal(refreshChanges.rootsChanged, false);
const rootChanges = watch.topologySettingsChanges(scanSettings,
  { ...scanSettings, scanRoots: ["/workspace", "/another"] }, 30, 16);
assert.equal(rootChanges.rootsChanged, true,
  "trusted-root changes must request a topology scan");
const intervalChanges = watch.topologySettingsChanges(scanSettings,
  { ...scanSettings, topologyInterval: 15 }, 30, 16);
assert.equal(intervalChanges.intervalChanged, true,
  "topology interval changes must update the running schedule");
assert.equal(intervalChanges.intervalSeconds, 15);
const cappedRootChanges = watch.topologySettingsChanges(
  { scanRoots: Array.from({ length: 17 }, (_, index) => `/root/${index}`) },
  { scanRoots: [...Array.from({ length: 16 }, (_, index) => `/root/${index}`), "/ignored"] },
  30, 16);
assert.equal(cappedRootChanges.rootsChanged, false,
  "roots beyond the scanner cap do not change the effective scan input");
let pending = {};
pending = watch.addPendingPath(pending, "/tmp/a", 2).pending;
pending = watch.addPendingPath(pending, "/tmp/a", 2).pending;
pending = watch.addPendingPath(pending, "/tmp/b", 2).pending;
const repeatedPath = watch.addPendingPath(pending, "/tmp/a", 2);
assert.equal(repeatedPath.accepted, true);
assert.equal(repeatedPath.dropped, 0);
const dropped = watch.addPendingPath(pending, "/tmp/c", 2);
assert.equal(Object.keys(dropped.pending).length, 2);
assert.equal(dropped.accepted, false);
assert.equal(dropped.dropped, 1);
assert.deepEqual(Array.from(watch.pendingPaths(pending)), ["/tmp/a", "/tmp/b"]);
let warningLedger = {};
let warningOrder = [];
const firstWarning = { code: "malformed_json", path: "/tmp/task.json" };
let warningResult = watch.recordWarning(warningLedger, warningOrder, firstWarning, 1000, 5000, 2);
warningLedger = warningResult.ledger;
warningOrder = warningResult.order;
assert.equal(warningResult.accepted, true);
warningResult = watch.recordWarning(warningLedger, warningOrder, firstWarning, 1001, 5000, 2);
assert.equal(warningResult.accepted, false);
assert.equal(warningResult.suppressedCount, 1);
warningResult = watch.recordWarning(warningLedger, warningOrder, firstWarning, 7000, 5000, 2);
assert.equal(warningResult.accepted, true);
warningLedger = warningResult.ledger;
warningOrder = warningResult.order;
warningResult = watch.recordWarning(warningLedger, warningOrder,
  { code: "second", path: "/tmp/second" }, 8000, 5000, 2);
warningLedger = warningResult.ledger;
warningOrder = warningResult.order;
warningResult = watch.recordWarning(warningLedger, warningOrder,
  { code: "third", path: "/tmp/third" }, 9000, 5000, 2);
warningLedger = warningResult.ledger;
warningOrder = warningResult.order;
assert.equal(warningOrder.length, 2);
assert.equal(warningLedger[watch.warningKey(firstWarning)], undefined);

const pathsSource = fs.readFileSync(path.join(repoRoot,
  "TrellisDms/lib/trellisPaths.js"), "utf8");
assert.match(pathsSource, /resolveTaskDirectory\(projectRoot,\s*expected,\s*canonical\.path,\s*\{[\s\S]*?allowArchive:\s*true/);
assert.match(pathsSource, /ARCHIVE_MONTH_PATTERN\s*=\s*\/\^\\d\{4\}-/);
assert.doesNotMatch(pathsSource, /\.trellis\/archive/);
const daemonSource = fs.readFileSync(path.join(repoRoot, "TrellisDms/TrellisDaemon.qml"), "utf8");
const liveTaskDiscoverySource = sourceSection(daemonSource,
  '_queueProcess(scan, ["find", tasksRoot, "-mindepth", "1", "-maxdepth", "1", "-type", "d", "!", "-name", "archive", "-print"]',
  "var sessionsRoot = TrellisPaths.runtimeSessionsPath(project.root);");
assert.match(liveTaskDiscoverySource,
  /\["find",\s*tasksRoot,\s*"-mindepth",\s*"1",\s*"-maxdepth",\s*"1",\s*"-type",\s*"d",\s*"!",\s*"-name",\s*"archive",\s*"-print"\]/,
  "live task enumeration must exclude the reserved direct archive directory before applying the task cap");
assert.match(liveTaskDiscoverySource,
  /for \(var i = 0; i < lines\.lines\.length; i\+\+\)\s+_discoverTask\(scan, project, lines\.lines\[i\]\);/,
  "normal live task candidates must retain the existing discovery and path validation flow");
const widgetSource = fs.readFileSync(path.join(repoRoot, "TrellisDms/TrellisWidget.qml"), "utf8");
const desktopSource = fs.readFileSync(path.join(repoRoot, "TrellisDms/TrellisDesktopWidget.qml"), "utf8");
const launcherSource = fs.readFileSync(path.join(repoRoot, "TrellisDms/TrellisLauncher.qml"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "TrellisDms/plugin.json"), "utf8"));
const daemonLimits = {
  maxProjects: 32,
  maxScanRoots: 16,
  maxTasksPerProject: 128,
  maxSessionsPerProject: 128,
  maxDiscoveryDepth: 4,
  maxAncestorCandidates: 8,
  maxCommandBytes: 256 * 1024,
  maxJsonBytes: 1024 * 1024,
  maxWarnings: 256,
  maxKnownWatchers: 512,
  maxPendingKnownReloads: 256,
  knownReloadDebounceMs: 200,
  warningCooldownMs: 5000
};
for (const [name, value] of Object.entries(daemonLimits)) {
  const sourceValue = name === "maxCommandBytes" ? "256\\s*\\*\\s*1024"
    : name === "maxJsonBytes" ? "1024\\s*\\*\\s*1024"
      : String(value);
  assert.match(daemonSource,
    new RegExp(`readonly\\s+property\\s+int\\s+${name}:\\s*${sourceValue}\\b`),
    `${name} must keep its reviewed v0.8 contract value`);
}
assert.match(daemonSource, /watchChanges\s*:\s*true/);
assert.match(daemonSource, /blockWrites\s*:\s*true/);
assert.match(daemonSource, /atomicWrites\s*:\s*true/);
assert.match(daemonSource, /preload\s*:\s*true/);
assert.match(daemonSource, /import "lib\/trellisnotifications\.js" as TrellisNotifications/);
assert.match(daemonSource, /property var ownedNotificationProcesses: \[\]/);
assert.match(daemonSource, /id: notificationProcessComponent[\s\S]*?Process\s*\{/);
assert.match(daemonSource, /function _publishHealthNotifications\([\s\S]*?TrellisNotifications\.observe/);
assert.match(daemonSource,
  /command:\s*\["dms",\s*"notify",\s*summary,\s*body,\s*"--app",\s*"Trellis DMS",\s*"--icon",\s*"health",\s*"--timeout",\s*"5000"\]/);
assert.match(daemonSource, /recentChangesVar\.set\(recent\);\s*root\._publishHealthNotifications\(recent\);/);
const notificationAdapterSource = daemonSource.match(
  /function _queueNotification\([\s\S]*?\n    }/)[0];
assert.doesNotMatch(notificationAdapterSource, /project_id|task_id|session_key|Markdown|\.root/);
assert.doesNotMatch(notificationAdapterSource, /\["(?:sh|bash)",\s*"-c"/);
assert.match(daemonSource, /_destroyWatchers/);
assert.match(daemonSource, /topologyTimer\.stop\(\)/);
assert.match(daemonSource, /knownReloadTimer\.stop\(\)/);
assert.match(daemonSource, /Timer\s*\{/);
assert.match(daemonSource, /topologyIntervalDefault/);
assert.match(daemonSource, /maxKnownWatchers/);
assert.match(daemonSource, /maxPendingKnownReloads/);
assert.match(daemonSource, /maxAncestorCandidates:\s*8/);
assert.match(daemonSource, /verifiedTrellisVersion:\s*"0\.6\.17"/);
assert.equal((daemonSource.match(/if \(version !== root\.verifiedTrellisVersion\)/g) || []).length, 2,
  "initial discovery and version reload must compare against the verified Trellis version");
assert.equal((daemonSource.match(/_warning\("version_unverified"/g) || []).length, 2,
  "both version-read paths must preserve an explicit compatibility diagnostic");
assert.match(daemonSource, /TrellisPaths\.ancestorPaths\(canonicalRoot,[\s\S]*?root\.maxAncestorCandidates\)/);
assert.match(daemonSource, /\["test",\s*"-d",\s*candidateTrellis\]/);
assert.match(daemonSource, /_discoverAncestorProject\(scan,\s*canonicalRoot\)/);
assert.match(daemonSource, /_canonicalize\(scan,\s*candidateTrellis/);
assert.match(daemonSource, /_onKnownFileChanged/);
assert.match(daemonSource, /_finishKnownReload/);
assert.match(daemonSource, /maxScanRoots:\s*16/);
assert.match(daemonSource, /TrellisDiscovery\.selectRootInput\(settings,\s*root\.maxScanRoots\)/);
assert.match(daemonSource, /scan_root_limit/);
assert.match(daemonSource, /savePluginState\(root\.pluginId,[\s\S]*?"discoveredProjects"/);
assert.match(daemonSource, /if \(!scan\.degraded\)[\s\S]*?_rememberProjects\(inputs\)/);
assert.doesNotMatch(daemonSource, /loadPluginState\([^)]*discoveredProjects/);
assert.match(daemonSource, /kind:\s*"topology",[\s\S]{0,200}?queueing:\s*true/);
assert.match(daemonSource, /scan\.queueing\s*=\s*false;[\s\S]*?_maybeFinish\(scan\)/);
assert.match(daemonSource, /accepted\s*\|\|\s*!duplicate/);
assert.match(daemonSource, /function _pushWarning\([\s\S]*?scan\.warnings\.length < root\.maxWarnings/);
assert.match(daemonSource, /function _pushProjectWarning\([\s\S]*?project\.warnings\.length < root\.maxWarnings/);
assert.match(daemonSource, /pendingKnownWarnings\.length > root\.maxWarnings/);
assert.match(daemonSource, /warningCooldownMs, root\.maxWarnings/);
assert.match(daemonSource, /id:\s*settingsRefreshTimer[\s\S]*?onTriggered:\s*root\.startScan\("settings"\)/);
assert.match(daemonSource, /function _observePluginSettingsChange\(\)[\s\S]*?TrellisWatch\.topologySettingsChanges\([\s\S]*?changes\.rootsChanged \|\| changes\.refreshRequested/);
assert.match(daemonSource, /function onPluginDataChanged\(changedPluginId\)[\s\S]*?changedPluginId === root\.pluginId[\s\S]*?Qt\.callLater\(root\._observePluginSettingsChange\)/);
assert.doesNotMatch(daemonSource, /onPluginDataChanged:\s*settingsRefreshTimer\.restart\(\)/,
  "presentation-only settings must not restart the daemon scan");
assert.match(daemonSource, /if \(changes\.intervalChanged\)[\s\S]*?root\.topologyIntervalSeconds = changes\.intervalSeconds[\s\S]*?if \(topologyTimer\.running\)[\s\S]*?root\._armTopologyTimer\(\)/);
assert.match(daemonSource, /function _armTopologyTimer\(\)[\s\S]*?topologyTimer\.interval = root\.topologyIntervalSeconds \* 1000[\s\S]*?topologyTimer\.restart\(\)/);
assert.match(daemonSource, /Component\.onDestruction:[\s\S]*?_destroyOwned\(\)/);
assert.equal((daemonSource.match(/setGlobalVar\s*\(/g) || []).length, 1);
assert.equal(manifest.components.daemon, "./TrellisDaemon.qml");
assert.equal(manifest.components.widget, "./TrellisWidget.qml");
assert.equal(manifest.components.desktop, "./TrellisDesktopWidget.qml");
assert.equal(manifest.components.launcher, "./TrellisLauncher.qml");
assert.equal(manifest.type, "composite");
assert.deepEqual(Object.keys(manifest.components).sort(), ["daemon", "desktop", "launcher", "widget"]);
assert.equal(manifest.capabilities.includes("launcher"), false,
  "DMS 1.6.2 reloads loaded launcher-capable plugins on pluginDataChanged; the explicit launcher component remains registered without the redundant capability");
assert.equal(manifest.requires_dms, ">=1.6.2");
assert.deepEqual([...manifest.permissions].sort(), ["process", "settings_read", "settings_write"]);
assert.equal(manifest.permissions.includes("network"), false);
assert.deepEqual([...manifest.capabilities].sort(), ["daemon", "dankbar-widget", "desktop-widget"]);
assert.equal(manifest.version, "1.0.0",
  "the frozen v1.0 candidate must report its stable package version");
assert.match(launcherSource, /^Item\s*\{/m,
  "Launcher must use an Item root so PluginGlobalVar can be a child");
assert.match(launcherSource, /^\s*import qs\.Widgets\s*$/m,
  "Launcher must import DMS widgets, including PluginGlobalVar");
assert.match(widgetSource, /varName:\s*"snapshot"/);
assert.match(widgetSource, /readonly property var snapshot:\s*snapshotVar\.value/);
assert.match(widgetSource, /visible:\s*root\.pillProjection\.warningCount > 0/,
  "compatibility warnings remain visible in the pill by default");
assert.match(widgetSource, /visible:\s*!root\.detailMode && !root\.archiveMode[\s\S]{0,160}root\.popoutProjection\.warningCount > 0/,
  "compatibility warnings remain visible in the popout by default");
assert.doesNotMatch(daemonSource, /\b(?:setInterval|setTimeout)\s*\(/);
assert.match(daemonSource, /id:\s*topologyTimer[\s\S]*?repeat:\s*false[\s\S]*?root\.startScan\("interval"\)/);
assert.match(daemonSource, /id:\s*knownReloadTimer[\s\S]*?repeat:\s*false[\s\S]*?root\.knownReloadDebounceMs[\s\S]*?root\._flushKnownReload\(\)/);
assert.match(daemonSource, /id:\s*settingsRefreshTimer[\s\S]*?repeat:\s*false[\s\S]*?interval:\s*100[\s\S]*?root\.startScan\("settings"\)/);
const processQueueSource = sourceSection(daemonSource,
  "function _queueProcess(", "function _queueFile(");
const fileQueueSource = sourceSection(daemonSource,
  "function _queueFile(", "function _boundedLines(");
const taskDiscoverySource = sourceSection(daemonSource,
  "function _discoverTask(", "function _discoverSession(");
const sessionDiscoverySource = sourceSection(daemonSource,
  "function _discoverSession(", "function _discoverAncestorProject(");
const destroyOwnedSource = sourceSection(daemonSource,
  "function _destroyOwned(", "function _cancelDetailRead(");
const destroyWatchersSource = sourceSection(daemonSource,
  "function _destroyWatchers(", "function _queueProcess(");
const startScanSource = sourceSection(daemonSource,
  "function startScan(", "Component.onCompleted: Qt.callLater");
const installWatchersSource = sourceSection(daemonSource,
  "function _installWatchers(", "function _maybeFinish(");
const applyKnownReloadSource = sourceSection(daemonSource,
  "function _applyKnownReload(", "function _publishSnapshot(");
const finishKnownReloadSource = sourceSection(daemonSource,
  "function _finishKnownReload(", "function _flushKnownReload(");
const knownReloadHandlerSource = sourceSection(daemonSource,
  "function _onKnownFileChanged(", "function _findProjectInput(");
const flushKnownReloadSource = sourceSection(daemonSource,
  "function _flushKnownReload(", "function _installWatchers(");
const finishScanSource = sourceSection(daemonSource,
  "function _maybeFinish(", "function _armTopologyTimer(");
const publishSnapshotSource = sourceSection(daemonSource,
  "function _publishSnapshot(", "function _rememberProjects(");
const projectCoreReadSource = sourceSection(daemonSource,
  "function _projectCoreInputsComplete(", "function _previousProjectReadAt(");
const projectWarningSource = sourceSection(daemonSource,
  "function _pushProjectWarning(", "function _destroyOwned(");
const destructionSource = sourceSection(daemonSource,
  "Component.onDestruction:", "\n    }\n}");
assert.match(processQueueSource, /if \(!scan \|\| !_isCurrent\(scan\.generation\)\)\s*return/);
assert.match(processQueueSource, /processComponent\.createObject/);
assert.match(processQueueSource, /root\.ownedProcesses\.push\(process\)/);
assert.match(processQueueSource, /var current = _isCurrent\(scan\.generation\);[\s\S]*?if \(current\)\s*callback\(output, exitCode\)/);
assert.match(processQueueSource, /if \(!process\)[\s\S]*?scan\.pending -= 1;[\s\S]*?_maybeFinish\(scan\)/);
assert.match(fileQueueSource, /if \(!scan \|\| !_isCurrent\(scan\.generation\)\)\s*return/);
assert.match(fileQueueSource, /fileViewComponent\.createObject/);
assert.match(fileQueueSource, /root\.ownedReaders\.push\(reader\)/);
assert.match(fileQueueSource, /var current = _isCurrent\(scan\.generation\);[\s\S]*?if \(current\)\s*callback\(text, error\)/);
assert.match(fileQueueSource, /if \(!reader\)[\s\S]*?scan\.pending -= 1;[\s\S]*?_maybeFinish\(scan\)/);
assert.match(taskDiscoverySource, /TrellisPaths\.resolveTaskJson\(resolved, canonicalJson\)/);
assert.match(taskDiscoverySource, /_queueFile\(scan, jsonResolved\.path/);
assert.match(sessionDiscoverySource, /TrellisPaths\.resolveSessionFile\(project\.root, sessionsRoot, candidate, canonicalPath\)/);
assert.match(sessionDiscoverySource, /_queueFile\(scan, resolved\.path/);
assert.match(destroyOwnedSource, /topologyTimer\.stop\(\)/);
assert.match(destroyOwnedSource, /knownReloadTimer\.stop\(\)/);
assert.match(destroyOwnedSource, /settingsRefreshTimer\.stop\(\)/);
assert.match(destroyOwnedSource, /processes\[i\]\.destroy\(\)/);
assert.match(destroyOwnedSource, /readers\[j\]\.destroy\(\)/);
assert.match(destroyOwnedSource, /root\.pendingKnownPaths = \(\{\}\)/);
assert.match(destroyOwnedSource, /root\.pendingKnownWarnings = \[\]/);
assert.match(destroyOwnedSource, /_destroyWatchers\(\)/);
assert.match(destroyWatchersSource, /watchers\[i\]\.destroy\(\)/);
assert.match(destroyWatchersSource, /root\.knownWatchers = \(\{\}\)/);
assert.match(destroyWatchersSource, /root\.knownFileRegistry = \(\{\}\)/);
assert.match(startScanSource, /root\.scanGeneration \+= 1;[\s\S]*?_destroyOwned\(\)/);
assert.ok(startScanSource.indexOf("queueing: true") < startScanSource.indexOf("for (var i = 0; i < scan.roots.length; i++)"));
assert.ok(startScanSource.indexOf("for (var i = 0; i < scan.roots.length; i++)")
  < startScanSource.lastIndexOf("scan.queueing = false;"));
assert.match(finishScanSource, /scan\.pending !== 0[\s\S]*?scan\.queueing[\s\S]*?!_isCurrent\(scan\.generation\)/);
assert.match(finishScanSource, /_installWatchers\(scan, inputs\)[\s\S]*?_publishSnapshot\(root\.currentInputs, root\.currentWarnings\)/);
assert.match(installWatchersSource, /watcherCount >= root\.maxKnownWatchers/);
assert.match(installWatchersSource, /registry\[path\] = metadata/);
assert.match(installWatchersSource, /tasks\[t\] && tasks\[t\]\.taskJson/);
assert.match(installWatchersSource, /sessions\[s\] && sessions\[s\]\.path/);
assert.match(knownReloadHandlerSource, /!_isCurrent\(generation\)[\s\S]*?!root\.knownFileRegistry\[path\]/);
assert.match(knownReloadHandlerSource, /TrellisWatch\.addPendingPath\(root\.pendingKnownPaths, path, root\.maxPendingKnownReloads\)/);
assert.match(knownReloadHandlerSource, /knownReloadTimer\.restart\(\)/);
assert.doesNotMatch(knownReloadHandlerSource, /_publishSnapshot|setGlobalVar/);
assert.match(flushKnownReloadSource, /TrellisWatch\.pendingPaths\(root\.pendingKnownPaths\)/);
assert.match(flushKnownReloadSource, /_queueFile\(reload, pathValue/);
assert.match(flushKnownReloadSource, /reload\.queueing = false;[\s\S]*?_finishKnownReload\(reload\)/);
assert.match(applyKnownReloadSource, /metadata\.kind === "task"[\s\S]*?task\.readError = error[\s\S]*?TrellisParser\.parseJson\(text\)[\s\S]*?task\.value = parsedTask\.value/);
assert.match(applyKnownReloadSource, /metadata\.kind === "session"[\s\S]*?session\.value = parsedSession\.value[\s\S]*?_resolveSessionPointer\(reload, project, session, false\)/);
assert.match(finishKnownReloadSource, /!_isCurrent\(reload\.generation\)/);
assert.match(finishKnownReloadSource, /_publishSnapshot\(root\.currentInputs, root\.currentWarnings\)/);
assert.match(finishKnownReloadSource, /root\.snapshotIsCurrent = !root\.lastGoodFallbackActive/,
  "a known-file reload must preserve the current scan's fallback state");
assert.doesNotMatch(finishKnownReloadSource, /root\.lastGoodFallbackActive\s*=\s*false/,
  "known-file reloads cannot clear a topology fallback");
assert.match(daemonSource, /function _publishSnapshot\([\s\S]*?TrellisParser\.makeSnapshot\([\s\S]*?setGlobalVar\(root\.pluginId, "snapshot", snapshot\)/);
assert.match(daemonSource, /property string scanStartedAt/);
assert.match(daemonSource, /property string lastSuccessfulDiscoveryAt/);
assert.match(daemonSource, /property bool snapshotIsCurrent/);
assert.match(daemonSource, /property bool lastGoodFallbackActive/);
assert.match(startScanSource, /root\.scanStartedAt = new Date\(\)\.toISOString\(\)/);
assert.match(projectWarningSource, /warning\.projectId = project\.id \|\| project\.root/);
assert.match(projectCoreReadSource, /task\.readError[\s\S]*?session\.readError/);
assert.match(projectCoreReadSource, /Array\.isArray\(task\.value\)/);
assert.match(publishSnapshotSource, /TrellisParser\.makeSnapshot\([\s\S]*?root\.scanStartedAt[\s\S]*?root\.lastGoodFallbackActive/);
assert.match(finishScanSource, /if \(!scan\.degraded && scan\.roots\.length\)[\s\S]*?root\.lastSuccessfulDiscoveryAt = new Date\(\)\.toISOString\(\)/);
assert.match(finishScanSource, /root\.snapshotIsCurrent = !fallbackActive/);
assert.doesNotMatch(finishKnownReloadSource, /root\.lastSuccessfulDiscoveryAt\s*=/,
  "known-file reloads update project reads but are not topology discoveries");
assert.match(destructionSource, /root\.scanGeneration \+= 1;[\s\S]*?root\.activeScan = null;[\s\S]*?_cancelDetailRead\(false\);[\s\S]*?_destroyOwned\(\)/);
const boundedDetailReadSource = sourceSection(daemonSource,
  "function _readBoundedDetailFile(", "function _detailResponse(");
assert.match(boundedDetailReadSource, /\["test",\s*"-f",\s*canonicalPath\]/);
assert.match(boundedDetailReadSource, /\["stat",\s*"-c",\s*"%s",\s*"--",\s*canonicalPath\]/);
assert.ok(boundedDetailReadSource.indexOf("size > byteLimit")
  < boundedDetailReadSource.indexOf("_queueDetailFile"));
assert.match(boundedDetailReadSource, /errorPrefix \+ "_size_limit"/);
const mainFileViewSource = sourceSection(daemonSource,
  "id: fileViewComponent", "id: knownWatcherComponent");
assert.match(mainFileViewSource, /typeof value === "string" && value\.length > root\.maxJsonBytes/);
assert.match(mainFileViewSource, /fn\(oversized \? "" : value, oversized \? "size_limit" : null\)/);
const lineOutputBound = paths.parseBoundedLines("x".repeat(4097), 8, 4096);
assert.equal(lineOutputBound.truncated, true);
assert.equal(lineOutputBound.warnings[0].code, "command_output_limit");
assert.match(daemonSource, /varName:\s*"detailRequest"/);
assert.match(daemonSource, /varName:\s*"detailResponse"/);
assert.match(daemonSource, /TrellisPaths\.validateMarkdownRequest\(/);
assert.match(daemonSource, /TrellisPaths\.resolveTaskDir\([^)]*\{\}\)/);
assert.match(daemonSource, /TrellisPaths\.resolveMarkdownFile\(/);
assert.match(daemonSource, /\["realpath",\s*"-e",\s*"--",\s*lexicalPath\]/);
assert.match(daemonSource, /\["stat",\s*"-c",\s*"%s",\s*"--",\s*canonicalPath\]/);
assert.match(daemonSource, /id:\s*detailFileViewComponent[\s\S]*?blockWrites:\s*true[\s\S]*?atomicWrites:\s*true[\s\S]*?preload:\s*true/);
assert.match(daemonSource, /function _isCurrentDetail\(generation, requestId\)/);
assert.match(daemonSource, /_isCurrentDetail\(generation, requestId\)[\s\S]*?callback/);
assert.match(daemonSource, /detailGeneration\s*\+=\s*1/);
assert.match(daemonSource, /TrellisPaths\.markdownByteLimit\(\)/);
assert.match(daemonSource, /TrellisPaths\.validateArchiveRequest\(/);
assert.match(daemonSource, /TrellisPaths\.archiveLimits\(\)/);
assert.match(daemonSource, /TrellisPaths\.resolveArchiveMonth\(/);
assert.match(daemonSource, /TrellisPaths\.resolveArchiveTask\(/);
for (const kind of ["archive-index", "archive-page", "archive-task"])
  assert.match(daemonSource, new RegExp(`"${kind}"`));
assert.match(daemonSource, /\["find",\s*monthResult\.monthDir,\s*"-mindepth",\s*"1",\s*"-maxdepth",\s*"1",\s*"-print"\]/);
assert.match(daemonSource, /normalizedPage\.page\s*<\s*root\.archiveLimits\.pageMaximum/);
assert.match(daemonSource, /_readBoundedDetailFile\([^)]*root\.maxJsonBytes,\s*"archive_task"/s);
assert.match(daemonSource, /archive_detail_stale/);
assert.match(daemonSource, /archive_layout_unknown/);
assert.match(daemonSource, /archive_permission/);
assert.match(daemonSource, /function _publishArchiveError[\s\S]*?detailResponseVar\.set/);
const archiveErrorFunction = daemonSource.match(
  /function _publishArchiveError[\s\S]*?\n    }/)[0];
assert.doesNotMatch(archiveErrorFunction, /_publishSnapshot|refreshPending|currentInputs|lastGoodInputs/);
assert.doesNotMatch(daemonSource, /detailResponse[\s\S]{0,160}?snapshot/);
assert.doesNotMatch(daemonSource, /\.trellis\/archive/);
assert.doesNotMatch(daemonSource, /\b(?:sh|bash)\s+-c\b/);
assert.doesNotMatch(daemonSource, /\b(?:writeAdapter|setText|save\s*\()/);
const settingsSource = fs.readFileSync(path.join(repoRoot, "TrellisDms/TrellisSettings.qml"), "utf8");
assert.match(settingsSource, /property string instanceId:\s*""/);
assert.match(settingsSource, /property var instanceData:\s*null/);
assert.match(settingsSource, /readonly property string desktopInstanceId:/);
assert.match(settingsSource, /var dataInstanceId = root\.instanceData\?\.id/);
assert.match(settingsSource, /readonly property bool isInstanceScopedPluginService:/);
assert.match(settingsSource, /typeof root\.pluginService\.loadPluginState !== "function"\s*\|\|\s*typeof root\.pluginService\.savePluginState !== "function"/);
assert.match(settingsSource, /readonly property bool isDesktopInstance/);
assert.match(settingsSource, /isDesktopInstance: root\.desktopInstanceId\.length > 0\s*\|\|\s*\(root\.instanceData !== null[\s\S]*?\|\| root\.isInstanceScopedPluginService/);
assert.match(settingsSource, /active:\s*!root\.isDesktopInstance/);
assert.match(settingsSource, /active:\s*root\.isDesktopInstance/);
assert.match(settingsSource, /SettingsDisplayPicker\s*\{/);
assert.match(settingsSource, /visible:\s*!root\.desktopInstanceId/);
assert.match(settingsSource, /text:\s*I18n\.trFor\("trellisDms",\s*"Desktop widget instance ID is unavailable\. Close and reopen these settings\."\)/);
assert.match(settingsSource, /visible:\s*root\.desktopInstanceId\.length > 0\s*displayPreferences:/);
assert.match(settingsSource, /displayPreferences:\s*root\.instanceData\?\.config\?\.displayPreferences\s*\?\?\s*\["all"\]/);
assert.match(settingsSource, /SettingsData\.updateDesktopWidgetInstanceConfig\(root\.desktopInstanceId,\s*\{\s*displayPreferences:\s*preferences/s);
assert.equal((settingsSource.match(/text:\s*I18n\.tr\("Reset (?:Position|Size)"\)/g) || []).length, 2);
assert.match(settingsSource, /function resetDesktopInstanceGeometry\(resetPosition, resetSize\)/);
for (const field of ["x", "y", "width", "height"])
  assert.match(settingsSource, new RegExp(`delete screenPosition\\.${field};`));
assert.match(settingsSource, /SessionData\.set\("desktopWidgetInstancePositions",\s*positionsByInstance\)/);
assert.match(settingsSource, /root\.resetDesktopInstanceGeometry\(true,\s*false\)/);
assert.match(settingsSource, /root\.resetDesktopInstanceGeometry\(false,\s*true\)/);
assert.match(settingsSource, /enabled:\s*!root\.isDesktopInstance && root\.pluginService !== null/);
for (const functionName of ["savePluginSetting", "loadUiSettings", "restoreDefaults",
  "loadDiscoveryData", "requestRefresh"])
  assert.match(settingsSource, new RegExp(`function ${functionName}\\([^)]*\\)\\s*\\{\\s*if \\(root\\.isDesktopInstance\\)`));
assert.match(settingsSource, /settingKey:\s*"pillMode"/);
assert.match(settingsSource, /loadValue\("displayMode",\s*null\)/);
assert.match(settingsSource, /settingKey:\s*"showProgress"/);
assert.match(settingsSource, /settingKey:\s*"showArchive"/);
assert.match(settingsSource, /settingKey:\s*"versionWarning"/);
assert.match(settingsSource, /settingKey:\s*"notificationsEnabled"/);
assert.match(settingsSource, /label:\s*I18n\.trFor\("trellisDms",\s*"Enable Health notifications"\)/);
assert.match(settingsSource, /settingKey:\s*"notificationsEnabled"[\s\S]*?defaultValue:\s*false/);
assert.match(settingsSource, /savePluginSetting\("notificationsEnabled",\s*false\)/);
assert.match(settingsSource, /defaultValue:\s*true/);
for (const mode of ["auto", "task", "project", "counts", "icon", "full"])
  assert.match(settingsSource, new RegExp(`value:\\s*"${mode}"`));
assert.match(settingsSource, /FileBrowserModal\s*\{/);
assert.match(settingsSource, /folderMode:\s*true/);
assert.match(settingsSource, /onContentChanged:\s*\{\s*if \(visible\)\s*globalSettingsView\.scheduleFilesystemRootQuickAccess\(\)/);
assert.match(settingsSource, /onVisibleChanged:\s*\{\s*if \(visible\)\s*globalSettingsView\.scheduleFilesystemRootQuickAccess\(\)/);
assert.match(settingsSource, /function scheduleFilesystemRootQuickAccess\(\)\s*\{\s*Qt\.callLater\(function\(\)/);
assert.match(settingsSource, /name:\s*I18n\.tr\("Computer",\s*"file browser quick access location"\)/);
assert.match(settingsSource, /path:\s*"\/"/);
assert.match(settingsSource, /onFileSelected:\s*path\s*=>\s*\{\s*root\.addScanRoot\(path\)/);
const quickAccessFunction = settingsSource.match(
  /function addFilesystemRootQuickAccess\(\)[\s\S]*?\n                }/)[0];
assert.doesNotMatch(quickAccessFunction, /addScanRoot|saveScanRoots/);
assert.doesNotMatch(quickAccessFunction, /Array\.isArray/);
assert.match(quickAccessFunction, /typeof currentLocations\.length !== "number"/);
assert.match(quickAccessFunction, /browser\.quickAccessLocations = locations/);
assert.match(settingsSource, /loadValue\("scanRoots",\s*null\)/);
assert.match(settingsSource, /savePluginSetting\("scanRoots",\s*unique\)/);
assert.match(settingsSource, /maxScanRoots:\s*16/);
assert.match(settingsSource, /loadState\("discoveredProjects",\s*\[\]\)/);
assert.match(settingsSource, /up to 4 levels deep/);
assert.match(settingsSource, /never selects your entire home, mounted drives, \/, or \/proc automatically/);
assert.match(settingsSource, /broad folder is scanned only if you explicitly add it/);
assert.match(settingsSource, /never writes to Trellis project files/);
assert.match(settingsSource, /remembered in DMS state/);
assert.match(settingsSource, /automatically promotes that selection to its containing Trellis project/);
assert.match(settingsSource, /at most 8 parent candidates/);
assert.match(settingsSource, /next configured topology refresh/);
assert.match(settingsSource, /one-time addition of a containing trusted folder/);
assert.match(settingsSource, /does not infer the current Codex task or working directory globally/);
assert.match(settingsSource, /has no knowledge of Codex's current working directory/);
assert.match(settingsSource, /Discovery is disabled/);
const globalSettingsStart = settingsSource.indexOf("id: globalSettingsLoader");
const desktopSettingsStart = settingsSource.indexOf("id: desktopSettingsLoader");
const globalSettingsSource = settingsSource.slice(globalSettingsStart, desktopSettingsStart);
assert.match(globalSettingsSource, /id: diagnosticsSnapshotVar[\s\S]*?varName:\s*"snapshot"/);
assert.match(globalSettingsSource, /id: diagnosticsDetailResponseVar[\s\S]*?varName:\s*"detailResponse"/);
assert.match(globalSettingsSource, /TrellisProjection\.makeDiagnosticsProjection\(/);
assert.match(globalSettingsSource, /Column\s*\{\s*id:\s*globalSettingsView\s*property string pluginId:\s*root\.pluginId/,
  "PluginGlobalVar children need the plugin ID on their immediate parent");
assert.match(globalSettingsSource, /var service = root\.pluginService;[\s\S]*?service && service\.availablePlugins/,
  "Diagnostics metadata must tolerate the injected plugin service being initially null");
assert.match(globalSettingsSource, /service && typeof service\.isPluginLoaded === "function"/);
assert.doesNotMatch(globalSettingsSource, /\bPluginService\.(?:availablePlugins|isPluginLoaded)/,
  "Diagnostics reads plugin metadata from the injected PluginSettings service");
assert.match(globalSettingsSource, /Qt\.version/);
assert.match(globalSettingsSource, /dmsVersion:\s*""[\s\S]*?quickshellVersion:\s*""/);
assert.match(globalSettingsSource, /text:\s*I18n\.trFor\("trellisDms",\s*"About \/ Diagnostics"\)/);
assert.match(globalSettingsSource, /function copyDiagnostics\(\)[\s\S]*?command\s*=\s*\["dms",\s*"cl",\s*"copy",\s*report\][\s\S]*?running\s*=\s*true/);
assert.match(globalSettingsSource, /onClicked:\s*globalSettingsView\.copyDiagnostics\(\)/);
assert.match(globalSettingsSource, /exitCode === 0[\s\S]*?"copied"\s*:\s*"failed"/);
assert.doesNotMatch(globalSettingsSource, /\["(?:sh|bash)",\s*"-c"/);
assert.doesNotMatch(globalSettingsSource, /JSON\.stringify\(\s*diagnostics(?:Snapshot|Detail)/);
assert.doesNotMatch(settingsSource.slice(desktopSettingsStart), /About \/ Diagnostics/,
  "About / Diagnostics belongs only to plugin-wide Settings");
const desktopSettingsSource = settingsSource.slice(desktopSettingsStart);
assert.match(desktopSettingsSource, /DankDropdown\s*\{[\s\S]*?text:\s*I18n\.trFor\("trellisDms",\s*"Desktop widget view"\)[\s\S]*?currentValue:\s*root\.desktopViewModeLabel\(root\.instanceData\?\.config\?\.viewMode\)[\s\S]*?onValueChanged:\s*value\s*=>\s*root\.saveDesktopViewMode\(value\)/);
assert.match(settingsSource, /function saveDesktopViewMode\(label\)[\s\S]*?SettingsData\.updateDesktopWidgetInstanceConfig\(root\.desktopInstanceId,[\s\S]*?viewMode:/);
assert.doesNotMatch(globalSettingsSource, /Desktop widget view|viewMode/,
  "Desktop view mode remains placement-specific, not a plugin-wide setting");
assert.match(desktopSource, /readonly property string viewMode:\s*TrellisProjection\.normalizeDesktopViewMode\(\s*root\.instanceConfig\?\.viewMode\s*\)/);
assert.match(desktopSource, /makeDesktopProjection\([\s\S]*?root\.detailResponse\)/);
assert.match(desktopSource, /id:\s*detailResponseVar[\s\S]*?varName:\s*"detailResponse"/);
assert.equal((desktopSource.match(/DankFlickable\s*\{/g) || []).length, 1,
  "all Desktop view modes share one vertical scroll region");
assert.match(desktopSource, /visible:\s*root\.viewMode === "overview"/);
assert.match(desktopSource, /visible:\s*root\.viewMode === "tasks" && root\.projection\.ready/);
assert.match(desktopSource, /visible:\s*root\.viewMode === "health" && root\.projection\.ready/);
assert.match(desktopSource, /model:\s*root\.projection\.taskProjects/);
assert.match(desktopSource, /visible:\s*root\.projection\.health\.taskDataDegraded/);
assert.match(desktopSource, /visible:\s*root\.projection\.activeTaskCount === 0/);
for (const taskField of ["displayState", "priority", "activeSessionCount"])
  assert.match(desktopSource, new RegExp(`modelData\\.${taskField}`));
assert.match(desktopSource, /health\.freshness\.lastSuccessfulDiscoveryAt/);
assert.match(desktopSource, /health\.fallbackActive/);
assert.match(desktopSource, /health\.unscopedIncidents/);
assert.match(desktopSource, /incidentCountLabel\(root\.projection\.health\.incidentCount\)/,
  "the Health header must label grouped health incidents accurately");
assert.match(desktopSource, /attentionProjectCount === 1/,
  "the health summary must use the singular English verb for one project");
assert.doesNotMatch(desktopSource, /FileView\s*\{|Process\s*\{|Timer\s*\{|startScan\s*\(|savePluginState\s*\(|setGlobalVar\s*\(/,
  "Desktop view modes must not add readers, processes, timers, scans, or State writes");
const diagnosticsSourceStart = globalSettingsSource.indexOf("function diagnosticsSnapshotState");
const diagnosticsStrings = Array.from(globalSettingsSource.slice(diagnosticsSourceStart)
  .matchAll(/I18n\.trFor\("trellisDms",\s*"([^"]+)"\)/g), (match) => match[1]);
const zhCatalog = JSON.parse(fs.readFileSync(
  path.join(repoRoot, "TrellisDms/translations/zh_CN.json"), "utf8"));
for (const sourceString of diagnosticsStrings)
  assert.ok(zhCatalog[sourceString] && zhCatalog[sourceString][sourceString],
    `About / Diagnostics string must have a Chinese translation: ${sourceString}`);
const desktopStrings = new Set(Array.from(desktopSource.matchAll(
  /I18n\.trFor\("trellisDms",\s*"([^"]+)"\)/g), (match) => match[1]));
for (const sourceString of desktopStrings)
  assert.ok(zhCatalog[sourceString] && zhCatalog[sourceString][sourceString],
    `Desktop string must have a Chinese translation: ${sourceString}`);
for (const sourceString of ["Desktop widget view",
  "This view is saved separately for each Desktop placement.", "Overview", "Tasks", "Health",
  "%1 incident", "%1 incidents", "%1 healthy · %2 need attention",
  "%1 healthy · %2 needs attention"])
  assert.ok(zhCatalog[sourceString] && zhCatalog[sourceString][sourceString],
    `Desktop instance Settings string must have a Chinese translation: ${sourceString}`);
for (const sourceString of ["Enable Health notifications",
  "Notify once when a project becomes degraded or recovers. Notifications are off by default and never include paths, task text, or session details.",
  "Trellis project", "Trellis health degraded", "Trellis health recovered",
  "%1 needs attention. Open Trellis DMS Health or Diagnostics for details.",
  "%1 recovered. Open Trellis DMS Health or Diagnostics for details."])
  assert.ok(zhCatalog[sourceString] && zhCatalog[sourceString][sourceString],
    `Health notification string must have a Chinese translation: ${sourceString}`);
assert.match(settingsSource, /settingKey:\s*"topologyInterval"/);
assert.match(settingsSource, /TrellisWatch\.topologyIntervalDefaults\(\)\.minimum/);
assert.match(settingsSource, /TrellisWatch\.topologyIntervalDefaults\(\)\.maximum/);
assert.match(settingsSource, /refreshToken/);
assert.match(settingsSource, /function restoreDefaults()/);
assert.match(settingsSource, /root\.hasPermission/);
assert.match(settingsSource, /loadPluginState\(root\.pluginId,\s*stateKeys\[loadIndex\]/);
assert.match(settingsSource, /removePluginStateKey\(root\.pluginId,\s*stateKeys\[i\]\)/);
assert.doesNotMatch(settingsSource, /clearPluginState/);
assert.match(settingsSource, /discoveredProjects/);
assert.match(widgetSource, /TrellisProjection\.makePillProjection/);
assert.match(widgetSource, /TrellisProjection\.makePopoutProjection\([\s\S]*?uiState\)/);
assert.match(widgetSource, /popoutContent:\s*Component/);
assert.match(widgetSource, /popoutWidth:\s*Math\.max\(1,\s*Math\.min\(420,/);
assert.match(widgetSource, /popoutHeight:\s*Math\.max\(1,\s*Math\.min\(480,/);
assert.match(widgetSource, /Math\.min\(implicitWidth,\s*180\)/);
assert.match(widgetSource, /Math\.min\(implicitWidth,\s*120,\s*parent\.width \* 0\.35\)/);
assert.match(widgetSource, /anchors\.right:\s*taskPin\.left/);
assert.match(widgetSource, /kind === "icon"[\s\S]*?kind === "full"/);
assert.doesNotMatch(widgetSource, /implicitHeight:\s*root\.popoutHeight/);
assert.match(widgetSource, /wrapMode:\s*Text\.NoWrap/);
assert.match(widgetSource, /elide:\s*Text\.ElideRight/);
assert.match(widgetSource, /name:\s*"warning"/);
assert.match(widgetSource, /loadPluginState\([\s\S]*?"pinnedTaskId"/);
assert.match(widgetSource, /loadPluginState\([\s\S]*?"selectedProjectId"/);
assert.match(widgetSource, /loadPluginState\([\s\S]*?"collapsedProjectIds"/);
assert.match(widgetSource, /loadPluginState\([\s\S]*?"collapsedTaskGroups"/);
assert.match(widgetSource, /loadPluginState\([\s\S]*?"selectedArchiveMonth"/);
assert.match(widgetSource, /savePluginState\(root\.pluginId,\s*key,\s*value\)/);
assert.match(widgetSource, /removePluginStateKey\(root\.pluginId,\s*key\)/);
assert.match(widgetSource, /function onPluginStateChanged\(changedPluginId\)/);
assert.match(widgetSource, /currentProjectId === nextProjectId\)\s*return/);
assert.match(widgetSource, /TrellisProjection\.parsePinnedTaskToken\(root\.pinnedTaskId\)/);
assert.match(widgetSource, /function toggleProjectCollapsed\(projectId\)/);
assert.match(widgetSource, /function toggleTaskGroupCollapsed\(projectId, groupKey\)/);
assert.match(widgetSource, /model:\s*projectSection\.modelData\.collapsed[\s\S]*?\? \[\] : taskGroup\.modelData\.tasks/);
assert.match(widgetSource, /TrellisProjection\.normalizeSelectedArchiveMonth\(/);
assert.match(widgetSource, /root\.showProgress/);
assert.match(widgetSource, /root\.showArchive/);
assert.match(widgetSource, /root\.versionWarning/);
assert.match(widgetSource, /stateWarning/);
assert.match(widgetSource, /currentPin\.projectId === projectId[\s\S]*?currentPin\.taskId === taskId/);
assert.match(widgetSource, /DankButton\s*\{/);
assert.match(widgetSource, /DankActionButton\s*\{/);
assert.match(widgetSource, /id:\s*projectFilterFlow[\s\S]*?Flow\s*\{|Flow\s*\{[\s\S]*?id:\s*projectFilterFlow/);
assert.match(widgetSource, /buttonHeight:\s*40/);
assert.match(widgetSource, /buttonSize:\s*40/);
assert.match(widgetSource, /iconName:\s*taskRow\.modelData\.pinned[\s\S]*?"keep_off"\s*:\s*"push_pin"/);
assert.match(widgetSource, /savePluginData\(root\.pluginId,\s*"refreshToken"/);
const widgetRefreshSource = sourceSection(widgetSource,
  "function requestRefresh()", "function openPluginSettings()");
const settingsRefreshSource = sourceSection(settingsSource,
  "function requestRefresh()", "Component.onCompleted: Qt.callLater(function()");
assert.match(widgetRefreshSource,
  /root\.refreshPending = true;[\s\S]*?savePluginData\(root\.pluginId,\s*"refreshToken",\s*Date\.now\(\)\s*\+\s*"-"\s*\+\s*root\.refreshRequestSerial\)/,
  "widget Refresh must write a changing refresh token");
assert.match(settingsRefreshSource,
  /savePluginData\(root\.pluginId,\s*"refreshToken",\s*Date\.now\(\)\s*\+\s*"-"\s*\+\s*root\.refreshRequestSerial\)/,
  "Settings Refresh must request a scan through the same token");
assert.match(widgetSource,
  /text:\s*I18n\.trFor\("trellisDms",\s*"Refresh"\)[\s\S]{0,220}?onClicked:\s*root\.requestRefresh\(\)/,
  "the widget Refresh button must call its refresh request");
assert.match(settingsSource, /onClicked:\s*root\.requestRefresh\(\)/,
  "Settings Refresh must call its refresh request");
assert.match(widgetSource, /PopoutService\.openSettingsWithTab\("plugins"\)/);
assert.match(widgetSource, /Current data stays visible until a new coherent snapshot arrives\./);
assert.match(widgetSource, /root\.popoutProjection\.degraded/);
assert.match(widgetSource, /TrellisProjection\.isNewerGeneratedAt\(/);
assert.match(widgetSource, /varName:\s*"detailRequest"/);
assert.match(widgetSource, /varName:\s*"detailResponse"/);
assert.match(widgetSource, /detailRequestVar\.set\(\{[\s\S]*?kind:\s*"markdown"[\s\S]*?projectId:[\s\S]*?taskId:[\s\S]*?document:/);
assert.match(widgetSource, /Text\.MarkdownText/);
assert.match(widgetSource, /Text\.PlainText/);
assert.match(widgetSource, /text:\s*I18n\.trFor\("trellisDms",\s*"Back"\)/);
for (const document of ["prd.md", "design.md", "implement.md"])
  assert.match(widgetSource, new RegExp(`document:\\s*"${document.replace(".", "\\.")}"`));
assert.match(widgetSource, /id:\s*detailDocumentTabs[\s\S]*?Flow\s*\{|Flow\s*\{[\s\S]*?id:\s*detailDocumentTabs/);
assert.match(widgetSource, /detailStatus\s*===\s*"loading"/);
assert.match(widgetSource, /detailStatus\s*===\s*"empty"/);
assert.match(widgetSource, /detailStatus\s*===\s*"error"/);
assert.match(widgetSource, /iconName:\s*"description"/);
assert.match(widgetSource, /kind:\s*"archive-index"/);
assert.match(widgetSource, /kind:\s*"archive-page"/);
assert.match(widgetSource, /kind:\s*"archive-task"/);
assert.match(widgetSource, /Historical Archive · Read only/);
assert.match(widgetSource, /Back to live/);
assert.match(widgetSource, /archiveStatus\s*===\s*"loading"/);
assert.match(widgetSource, /archiveStatus\s*===\s*"empty"/);
assert.match(widgetSource, /archiveStatus\s*===\s*"unknown-layout"/);
assert.match(widgetSource, /archiveStatus\s*===\s*"stale"/);
assert.match(widgetSource, /response\.requestId !== root\.archiveRequestId/);
assert.match(widgetSource, /response\.month !== root\.detailMonth/);
assert.equal((widgetSource.match(/DankFlickable\s*\{/g) || []).length, 1);
assert.doesNotMatch(widgetSource, /archive(?:Index|Page|Task)[\s\S]{0,180}?\bpath\s*:/);
assert.doesNotMatch(widgetSource, /Refresh complete|Refresh completed|Refresh succeeded/);
assert.doesNotMatch(widgetSource, /clearPluginState/);
assert.doesNotMatch(widgetSource, /discoveredProjects/);
assert.doesNotMatch(widgetSource, /\b(?:FileView|Process|setGlobalVar|saveValue)\b/);

const matrixProjectNoTasks = {
  schemaVersion: 1,
  generatedAt: "2026-09-23T10:00:00.000Z",
  projects: [{
    id: "matrix-project",
    name: "Matrix project",
    trellisVersion: "0.6.17",
    tasks: [],
    sessions: [],
    archiveSummary: { loaded: false, taskCount: null }
  }],
  warnings: []
};
const matrixPlanning = {
  schemaVersion: 1,
  generatedAt: "2026-09-23T10:01:00.000Z",
  projects: [{
    id: "matrix-project",
    name: "Matrix project",
    trellisVersion: "0.6.17",
    tasks: [{
      id: "planning",
      title: "Planning task",
      runtimeState: "inactive",
      displayState: "planning",
      priority: "P2",
      activeSessionCount: 0
    }],
    sessions: [],
    archiveSummary: { loaded: false, taskCount: null }
  }],
  warnings: []
};
const matrixReadError = {
  schemaVersion: 1,
  generatedAt: "2026-09-23T10:02:00.000Z",
  projects: [{
    id: "matrix-project",
    name: "Matrix project",
    trellisVersion: "0.6.17",
    tasks: [
      {
        id: "healthy",
        title: "Healthy task",
        runtimeState: "active",
        displayState: "active",
        priority: "P1",
        activeSessionCount: 1
      },
      {
        id: "broken",
        title: "broken",
        runtimeState: "error",
        displayState: "planning",
        priority: "unknown",
        activeSessionCount: 0
      }
    ],
    sessions: [{ taskId: "healthy", lastSeenAt: "2026-09-23T10:02:00.000Z" }],
    archiveSummary: { loaded: false, taskCount: null }
  }],
  warnings: [{ code: "malformed_json", message: "task JSON could not be read" }]
};
const matrixStaleSession = {
  schemaVersion: 1,
  generatedAt: "2026-09-23T10:03:00.000Z",
  projects: [{
    id: "matrix-project",
    name: "Matrix project",
    trellisVersion: "0.6.17",
    tasks: matrixPlanning.projects[0].tasks,
    sessions: [{
      sessionKey: "stale",
      taskId: null,
      lastSeenAt: "2026-09-23T10:03:00.000Z",
      stale: true,
      error: "stale_target"
    }],
    archiveSummary: { loaded: false, taskCount: null }
  }],
  warnings: [{ code: "stale_target", message: "session target is stale" }]
};
const matrixUnknownVersion = {
  schemaVersion: 1,
  generatedAt: "2026-09-23T10:04:00.000Z",
  projects: [{
    id: "matrix-project",
    name: "Matrix project",
    trellisVersion: "99.0.0",
    tasks: matrixPlanning.projects[0].tasks,
    sessions: [],
    archiveSummary: { loaded: false, taskCount: null }
  }],
  warnings: [{ code: "version_unverified", message: "Trellis version has not been verified" }]
};
const matrixDegraded = {
  schemaVersion: 1,
  generatedAt: "2026-09-23T10:05:00.000Z",
  projects: matrixReadError.projects,
  warnings: [{
    code: "last_good_snapshot",
    message: "discovery was degraded; last valid Trellis snapshot retained"
  }]
};

function sourceSection(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.ok(startIndex >= 0 && endIndex > startIndex,
    `expected source section from ${start} to ${end}`);
  return source.slice(startIndex, endIndex);
}

const detailObserverSource = sourceSection(widgetSource,
  "function observeDetailResponse()", "function _archiveProject()");
const archiveResponseHandler = detailObserverSource.slice(
  detailObserverSource.indexOf("if (!root.archiveMode"));
const markdownRequestSource = sourceSection(daemonSource,
  "function _readMarkdownRequest(", "function _archiveWarning(");
const archiveIndexSource = sourceSection(daemonSource,
  "function _loadArchiveIndex(", "function _readArchiveTaskRequest(");
const archivePageFinishSource = sourceSection(daemonSource,
  "function _finishArchivePageRow(", "function _loadArchivePageRow(");
const detailErrorPublisherSource = sourceSection(daemonSource,
  "function _publishDetailError(", "function _findLiveTaskRecord(");
const currentDetailGuardSource = sourceSection(daemonSource,
  "function _isCurrentDetail(", "function _cloneValue(");

const stateMatrixFixtures = [
  {
    state: "Startup before first Snapshot",
    pill: "icon with no fabricated counts",
    popout: "Loading Trellis status...",
    recovery: "wait without moving focus",
    evidenceTypes: ["fixture"],
    verify() {
      assert.equal(projection.makePillProjection({}, "auto").ready, false);
      assert.equal(projection.makePopoutProjection({}).ready, false);
    }
  },
  {
    state: "No trusted roots",
    pill: "No project in project mode",
    popout: "unconfigured guidance with settings action",
    recovery: "open DMS plugin settings",
    evidenceTypes: ["fixture"],
    verify() {
      const value = { schemaVersion: 1, projects: [], warnings: [{ code: "root_empty", message: "no root" }] };
      assert.equal(projection.makePillProjection(value, "project").label, "No project");
      assert.equal(projection.makePopoutProjection(value).unconfigured, true);
    }
  },
  {
    state: "Trusted roots, no project found",
    pill: "zero counts",
    popout: "empty discovery message",
    recovery: "manual refresh or settings inspection",
    evidenceTypes: ["fixture"],
    verify() {
      const value = { schemaVersion: 1, projects: [], warnings: [] };
      assert.equal(projection.makePillProjection(value, "counts").projectCount, 0);
      assert.equal(projection.makePopoutProjection(value).unconfigured, false);
    }
  },
  {
    state: "One project, no live tasks",
    pill: "project summary",
    popout: "project header and no-live-task copy",
    recovery: "read-only inspection",
    evidenceTypes: ["fixture"],
    verify() {
      assert.equal(projection.makePillProjection(matrixProjectNoTasks, "project").label, "Matrix project");
      assert.equal(projection.makePopoutProjection(matrixProjectNoTasks).projects[0].groups.length, 0);
    }
  },
  {
    state: "Planning or in-progress task without an active session",
    pill: "No active task unless explicitly pinned",
    popout: "truthful Planning/In progress group",
    recovery: "read-only inspection",
    evidenceTypes: ["fixture"],
    verify() {
      assert.equal(projection.makePillProjection(matrixPlanning, "task").label, "No active task");
      assert.equal(projection.makePopoutProjection(matrixPlanning).projects[0].groups[0].key, "planning");
    }
  },
  {
    state: "One active task and several sessions for that task",
    pill: "one active task title",
    popout: "one row with the real session count",
    recovery: "read-only inspection",
    evidenceTypes: ["fixture"],
    verify() {
      assert.equal(projection.makePillProjection(projectionSnapshot, "auto").label, "Build");
      assert.equal(projection.makePopoutProjection(projectionSnapshot).projects[0].tasks[0].activeSessionCount, 2);
    }
  },
  {
    state: "Several active tasks",
    pill: "counts in auto and title plus additional-task count in task mode",
    popout: "all bounded task rows",
    recovery: "inspect the live list",
    evidenceTypes: ["fixture"],
    verify() {
      assert.equal(projection.makePillProjection(twoActiveSnapshot, "auto").kind, "counts");
      assert.equal(projection.makePillProjection(twoActiveSnapshot, "task").extraCount, 1);
    }
  },
  {
    state: "Pinned planning task, invalid preferences, duplicate IDs, and equal recency",
    pill: "project-qualified deterministic primary fallback",
    popout: "all healthy rows plus invalid-State guidance",
    recovery: "select a current filter or pin",
    evidenceTypes: ["fixture"],
    verify() {
      assert.equal(pinnedPlanPill.label, "Plan");
      assert.equal(staleFilteredPopout.invalidSelectedProject, true);
      assert.equal(duplicatePinPrimary.projectId, "beta");
      assert.equal(projection.selectPrimary(tiedActiveSnapshot, { selectedProjectId: "alpha" }).taskId, "plan");
    }
  },
  {
    state: "Several projects, All filter, and selected project beyond cap",
    pill: "normal global primary",
    popout: "bounded All view or the selected project before caps",
    recovery: "choose All or a project filter",
    evidenceTypes: ["fixture"],
    verify() {
      assert.equal(projection.makePillProjection(projectionSnapshot, "project").extraCount, 1);
      assert.equal(filteredBeyondCap.projects[0].id, "project-9");
    }
  },
  {
    state: "Relationship cycle and live-path custom/completed statuses",
    pill: "normal primary with warning signal when present",
    popout: "flat relation summary and Other group",
    recovery: "repair or archive outside the plugin",
    evidenceTypes: ["fixture"],
    verify() {
      assert.equal(groupedPopout.projects[0].groups[2].tasks[1].relationText, "Parent: Cycle B · 1 child");
      assert.deepEqual(Array.from(groupedPopout.projects[0].groups[4].tasks, task => task.state), ["custom", "completed"]);
    }
  },
  {
    state: "DMS State failure and second-widget State synchronization",
    pill: "local choice remains usable",
    popout: "bounded persistence warning and convergent values",
    recovery: "retry after repairing the DMS State backend",
    evidenceTypes: ["static"],
    verify() {
      assert.match(widgetSource, /Preference changed locally, but DMS State could not save it\./);
      assert.match(widgetSource, /function onPluginStateChanged\(changedPluginId\)/);
    }
  },
  {
    state: "Long names, horizontal/vertical pills, narrow and normal popouts",
    pill: "single-line 180px-bound label or icon-only vertical projection",
    popout: "screen-clamped one-column vertical scroll with wrapping controls",
    recovery: "scroll and use visible controls",
    evidenceTypes: ["fixture", "static"],
    verify() {
      assert.equal(longFilterProjection.projectOptions[0].label.endsWith("…"), true);
      const vertical = widgetSource.match(/verticalBarPill:\s*Component\s*\{[\s\S]*?\n\s*popoutContent:/)?.[0] || "";
      assert.doesNotMatch(vertical, /StyledText/);
      assert.match(widgetSource, /contentWidth:\s*width/);
      assert.match(widgetSource, /id:\s*projectFilterFlow/);
    }
  },
  {
    state: "Warning with healthy data and malformed or unreadable task JSON",
    pill: "healthy task plus warning glyph/count",
    popout: "healthy and error rows remain visible together",
    recovery: "fix the source outside the plugin and refresh",
    evidenceTypes: ["fixture"],
    verify() {
      const pill = projection.makePillProjection(matrixReadError, "auto");
      const popout = projection.makePopoutProjection(matrixReadError);
      assert.equal(pill.label, "Healthy task");
      assert.equal(pill.warningCount, 1);
      assert.deepEqual(Array.from(popout.projects[0].tasks, task => task.state), ["active", "error"]);
    }
  },
  {
    state: "Stale session pointer and unknown Trellis version",
    pill: "warning signal without fabricated activity",
    popout: "bounded warning plus retained task/version facts",
    recovery: "repair outside the plugin and refresh",
    evidenceTypes: ["fixture"],
    verify() {
      assert.equal(projection.makePillProjection(matrixStaleSession, "auto").activeTaskCount, 0);
      assert.equal(projection.makePopoutProjection(matrixStaleSession).taskCount, 1);
      assert.equal(projection.makePopoutProjection(matrixUnknownVersion).projects[0].version, "99.0.0");
      assert.equal(projection.makePillProjection(matrixUnknownVersion, "auto").warningCount, 1,
        "unknown-version diagnostic is visible by default");
      assert.equal(projection.makePillProjection(matrixUnknownVersion, "auto", {
        versionWarning: false
      }).warningCount, 0, "version warnings may be hidden only by explicit opt-out");
      const supportedVersion = {
        ...matrixUnknownVersion,
        projects: matrixUnknownVersion.projects.map(project => ({
          ...project,
          trellisVersion: "0.6.17"
        })),
        warnings: []
      };
      assert.equal(projection.makePillProjection(supportedVersion, "auto").warningCount, 0,
        "supported-version snapshots remain warning-free");
    }
  },
  {
    state: "Degraded scan, archive-unloaded fact, and topology rescan",
    pill: "last-good summary plus warning",
    popout: "retained coherent data while refresh remains pending",
    recovery: "manual refresh without claiming completion early",
    evidenceTypes: ["fixture", "static"],
    verify() {
      const popout = projection.makePopoutProjection(matrixDegraded);
      assert.equal(popout.degraded, true);
      assert.equal(popout.projects[0].tasks.length, 2);
      assert.equal(matrixProjectNoTasks.projects[0].archiveSummary.loaded, false);
      assert.match(widgetSource, /Refresh requested\.[\s\S]*?new coherent snapshot arrives\./);
    }
  },
  {
    state: "Unknown display mode, removed root, and stale remembered project",
    pill: "unknown mode normalizes to auto and removed data disappears",
    popout: "successful replacement Snapshot contains only current projects",
    recovery: "re-add a trusted root only when intended",
    evidenceTypes: ["fixture", "static"],
    verify() {
      assert.equal(projection.makePillProjection(projectionSnapshot, "unknown").mode, "auto");
      assert.equal(projection.makePopoutProjection({ schemaVersion: 1, projects: [], warnings: [] }).projectCount, 0);
      assert.doesNotMatch(daemonSource, /loadPluginState\([^)]*discoveredProjects/);
    }
  },
  {
    state: "Archive index or page is empty",
    pill: "live pill remains independent of archive contents",
    popout: "empty month list or empty-page recovery copy",
    recovery: "reload archive or return to live tasks",
    evidenceTypes: ["static"],
    verify() {
      assert.match(archiveIndexSource,
        /indexContext\.hadEntries\s*\?\s*"unknown-layout"\s*:\s*"empty"/);
      assert.match(archivePageFinishSource,
        /tasks\.length\s*\?\s*"ready"\s*:\s*"empty"/);
      assert.match(widgetSource,
        /visible:\s*root\.archiveStatus === "empty"[\s\S]*?No archived tasks are available on this page\.[\s\S]*?This project has no archived task months\./);
    }
  },
  {
    state: "Archive index or page is loaded",
    pill: "live pill continues to use the live Snapshot only",
    popout: "bounded archive month and task rows are rendered separately",
    recovery: "open a selected archive task or return to live tasks",
    evidenceTypes: ["static"],
    verify() {
      assert.match(archivePageFinishSource,
        /_archiveResponse\(context\.request,[\s\S]*?"ready"/);
      assert.match(archiveResponseHandler,
        /root\.archiveTasks = response\.tasks/);
      assert.match(widgetSource, /model:\s*root\.archiveTasks/);
      assert.match(widgetSource,
        /Archived tasks are loaded on demand and never enter the live task list\./);
    }
  },
  {
    state: "Archive read or permission error",
    pill: "live pill remains available while archive fails",
    popout: "bounded archive error copy with no fabricated rows",
    recovery: "reload or return to live tasks",
    evidenceTypes: ["static"],
    verify() {
      assert.match(archiveErrorFunction,
        /_isCurrentDetail\(generation, request\.requestId\)/);
      assert.match(archiveErrorFunction,
        /_archiveResponse\(request,\s*"error"/);
      assert.match(archiveResponseHandler,
        /response\.status === "error"[\s\S]*?root\.archiveError/);
      assert.match(archiveIndexSource, /archive_permission/);
      assert.match(archiveErrorFunction, /\)\.toString\(\)\.slice\(0, 160\)/);
      assert.match(widgetSource,
        /visible:\s*root\.archiveStatus === "error"[\s\S]*?text:\s*root\.localizedWarningMessage\(root\.archiveError\)/);
    }
  },
  {
    state: "Markdown document is empty",
    pill: "live task projection remains unchanged",
    popout: "local empty-document message with no Snapshot content",
    recovery: "switch document or return to the task list",
    evidenceTypes: ["static"],
    verify() {
      assert.match(markdownRequestSource,
        /text\.length === 0[\s\S]*?_detailResponse\(request,\s*"empty"/);
      assert.match(detailObserverSource,
        /root\.detailContent = response\.status === "ready"\s*\?\s*response\.content\s*:\s*""/);
      assert.match(widgetSource,
        /visible:\s*root\.detailStatus === "empty"[\s\S]*?This task document is empty\./);
    }
  },
  {
    state: "Markdown read or validation error",
    pill: "live task projection remains available",
    popout: "bounded local error message without publishing a Snapshot",
    recovery: "switch document or retry after repairing the source",
    evidenceTypes: ["static"],
    verify() {
      assert.match(detailErrorPublisherSource,
        /_isCurrentDetail\(generation, request\.requestId\)/);
      assert.match(detailErrorPublisherSource,
        /_detailResponse\(request,\s*"error"/);
      assert.match(detailObserverSource,
        /response\.status === "error"[\s\S]*?root\.detailError = message/);
      assert.match(widgetSource,
        /visible:\s*root\.detailStatus === "error"[\s\S]*?text:\s*root\.localizedWarningMessage\(root\.detailError\)/);
    }
  },
  {
    state: "Stale Markdown response or superseded request",
    pill: "live task projection remains independent",
    popout: "ignore old request IDs and reject mismatched task/document identity",
    recovery: "keep the current detail selection or close it",
    evidenceTypes: ["static"],
    verify() {
      assert.match(currentDetailGuardSource,
        /generation === root\.detailGeneration[\s\S]*?requestId === root\.currentDetailRequestId/);
      assert.match(detailObserverSource,
        /root\.detailMode && response\.requestId === root\.detailRequestId/);
      assert.match(detailObserverSource,
        /response\.projectId !== root\.detailProjectId/);
      assert.match(detailObserverSource,
        /response\.taskId !== root\.detailTaskId/);
      assert.match(detailObserverSource,
        /response\.document !== root\.detailDocument/);
    }
  }
];

const stateMatrixResults = [];
const allowedEvidenceTypes = ["fixture", "static", "offscreen", "live"];
for (const fixtureCase of stateMatrixFixtures) {
  assert.ok(fixtureCase.state && fixtureCase.pill
    && fixtureCase.popout && fixtureCase.recovery
    && Array.isArray(fixtureCase.evidenceTypes)
    && fixtureCase.evidenceTypes.length > 0
    && fixtureCase.evidenceTypes.every(type => allowedEvidenceTypes.includes(type)),
  "every state-matrix fixture must document expectations and evidence types");
  try {
    fixtureCase.verify();
    stateMatrixResults.push({ fixtureCase, result: "pass" });
  } catch (error) {
    stateMatrixResults.push({ fixtureCase, result: "fail", error });
  }
}
for (const record of stateMatrixResults) {
  const evidence = record.fixtureCase.evidenceTypes.join(", ");
  const detail = record.error ? `: ${record.error.message}` : "";
  console.log(`state matrix: ${record.fixtureCase.state} [${evidence}] ${record.result}${detail}`);
}
assert.equal(stateMatrixResults.some(record => record.result === "fail"), false,
  "one or more state-matrix fixtures failed");

assert.equal(paths.normalizePointer(".trellis/tasks/live-task").ok, true);
assert.equal(paths.normalizePointer("/tmp/outside").reason, "absolute");
assert.equal(paths.normalizePointer(".trellis/tasks/live/../../outside").reason, "traversal");
assert.equal(paths.normalizePointer(".trellis/tasks/live\nother").reason, "control_character");
assert.equal(paths.normalizeRoots("").roots.length, 0);
assert.equal(paths.normalizeRoots("relative-root").roots.length, 0);

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-dms-v03-"));
const projectRoot = path.join(fixture, "project");
const tasksRoot = path.join(projectRoot, ".trellis", "tasks");
const taskDir = path.join(tasksRoot, "09-live-task");
const outsideDir = path.join(fixture, "outside");
fs.mkdirSync(taskDir, { recursive: true });
fs.mkdirSync(outsideDir, { recursive: true });
fs.writeFileSync(path.join(taskDir, "task.json"), JSON.stringify({ id: "live", title: "Live", status: "in_progress" }));
fs.writeFileSync(path.join(taskDir, "prd.md"), "not exposed");
fs.writeFileSync(path.join(taskDir, "design.md"), "");
fs.writeFileSync(path.join(taskDir, "implement.md"),
  Buffer.alloc(paths.markdownByteLimit() + 1, 0x61));
fs.writeFileSync(path.join(outsideDir, "secret.md"), "secret");
const archiveRoot = path.join(tasksRoot, "archive");
const archiveJuly = path.join(archiveRoot, "2026-07");
const archiveAugust = path.join(archiveRoot, "2026-08");
const archiveSeptember = path.join(archiveRoot, "2026-09");
const archivedAugustTask = path.join(archiveAugust, "08-finished");
const archivedSeptemberTask = path.join(archiveSeptember, "09-finished");
fs.mkdirSync(archivedAugustTask, { recursive: true });
fs.mkdirSync(archivedSeptemberTask, { recursive: true });
fs.mkdirSync(archiveJuly, { recursive: true });
fs.mkdirSync(path.join(archiveRoot, "unknown-layout"), { recursive: true });
fs.writeFileSync(path.join(archivedAugustTask, "task.json"), JSON.stringify({
  id: "august-finished", title: "August finished", status: "completed", priority: "P2"
}));
fs.writeFileSync(path.join(archivedSeptemberTask, "task.json"), JSON.stringify({
  id: "september-finished", title: "September finished", status: "completed", priority: "P1"
}));
fs.writeFileSync(path.join(archivedSeptemberTask, "prd.md"), "# Archived PRD");
const malformedArchiveTask = path.join(archiveSeptember, "malformed-task");
const oversizedArchiveTask = path.join(archiveSeptember, "oversized-task");
fs.mkdirSync(malformedArchiveTask, { recursive: true });
fs.mkdirSync(oversizedArchiveTask, { recursive: true });
fs.writeFileSync(path.join(malformedArchiveTask, "task.json"), "{");
fs.writeFileSync(path.join(oversizedArchiveTask, "task.json"),
  JSON.stringify({ payload: "x".repeat(1024 * 1024) }));
fs.mkdirSync(path.join(archivedSeptemberTask, "nested-task"), { recursive: true });
fs.writeFileSync(path.join(archivedSeptemberTask, "nested-task", "task.json"), "{}");
const archivedSeptemberJson = path.join(archivedSeptemberTask, "task.json");
const archivedBefore = fs.readFileSync(archivedSeptemberJson, "utf8");
const archivedMtimeBefore = fs.statSync(archivedSeptemberJson).mtimeMs;
try {
  fs.symlinkSync(outsideDir, path.join(tasksRoot, "escape-link"), "dir");
} catch {
  // The pure lexical checks below still run on platforms that disallow links.
}
try {
  fs.symlinkSync(path.join(outsideDir, "secret.md"), path.join(taskDir, "escape.md"));
} catch {
  // The canonical containment assertion below is skipped when links are unavailable.
}
try {
  fs.symlinkSync(outsideDir, path.join(archiveSeptember, "escape-link"), "dir");
} catch {
  // Canonical archive selector checks still run where symlinks are supported.
}

const scanRoot = path.join(fixture, "scan-root");
fs.mkdirSync(path.join(scanRoot, ".trellis"), { recursive: true });
fs.mkdirSync(path.join(scanRoot, "a", "b", ".trellis"), { recursive: true });
fs.mkdirSync(path.join(scanRoot, "a", "b", "c", "d", ".trellis"), { recursive: true });
const discovery = spawnSync("find", [scanRoot, "-maxdepth", "4", "-type", "d", "-name", ".trellis", "-print"], { encoding: "utf8" });
assert.equal(discovery.status, 0);
const discovered = discovery.stdout.trim().split(/\r?\n/).filter(Boolean);
assert.equal(discovered.includes(path.join(scanRoot, ".trellis")), true);
assert.equal(discovered.includes(path.join(scanRoot, "a", "b", ".trellis")), true);
assert.equal(discovered.includes(path.join(scanRoot, "a", "b", "c", "d", ".trellis")), false);
const bounded = paths.parseBoundedLines(discovered.concat(["/extra/one", "/extra/two"]).join("\n"), 2, 4096);
assert.equal(bounded.lines.length, 2);
assert.equal(bounded.truncated, true);

const liveTask = paths.resolveTaskDir(projectRoot, taskDir, fs.realpathSync(taskDir), {});
assert.equal(liveTask.ok, true);
assert.equal(paths.resolveTaskDir(projectRoot, tasksRoot, tasksRoot, {}).reason, "tasks_root");
assert.equal(paths.resolveTaskDir(projectRoot, outsideDir, fs.realpathSync(outsideDir), {}).reason, "outside_tasks");
assert.equal(paths.resolveTaskDir(projectRoot, path.join(tasksRoot, "..", "outside"), outsideDir, {}).reason, "outside_tasks");
const archiveTask = path.join(tasksRoot, "archive", "2026-09", "archived");
assert.equal(paths.resolveTaskDir(projectRoot, archiveTask, archiveTask, {}).reason, "archive_not_enabled");
assert.equal(paths.resolveTaskDir(projectRoot, archiveTask, archiveTask, { allowArchive: true }).kind, "archive");
assert.equal(paths.resolveArchive(projectRoot, path.join(tasksRoot, "archive"), path.join(tasksRoot, "archive")).ok, true);
assert.equal(paths.resolveArchive(projectRoot, path.join(tasksRoot, "not-archive"), path.join(tasksRoot, "not-archive")).reason, "archive_root");
assert.equal(paths.resolveArchiveMonth(projectRoot, "2026-09",
  archiveSeptember, fs.realpathSync(archiveSeptember)).ok, true);
assert.equal(paths.resolveArchiveMonth(projectRoot, "2026-13",
  path.join(archiveRoot, "2026-13"), path.join(archiveRoot, "2026-13")).reason,
"archive_month_invalid");
assert.equal(paths.resolveArchiveMonth(projectRoot, "2026-09",
  archiveSeptember, outsideDir).reason, "archive_month_canonical");
const resolvedArchivedTask = paths.resolveArchiveTask(projectRoot, "2026-09",
  "09-finished", archivedSeptemberTask, fs.realpathSync(archivedSeptemberTask));
assert.equal(resolvedArchivedTask.ok, true);
assert.equal(resolvedArchivedTask.kind, "archive");
assert.equal(paths.resolveTaskJson(resolvedArchivedTask,
  fs.realpathSync(archivedSeptemberJson)).ok, true);
assert.equal(paths.resolveArchiveTask(projectRoot, "2026-09", "nested/task",
  path.join(archiveSeptember, "nested/task"),
  path.join(archiveSeptember, "nested/task")).reason, "archive_task_directory");
assert.equal(paths.resolveArchiveTask(projectRoot, "2026-09", "09-finished",
  archivedSeptemberTask, outsideDir).reason, "archive_task_location");
if (fs.existsSync(path.join(archiveSeptember, "escape-link"))) {
  assert.equal(paths.resolveArchiveTask(projectRoot, "2026-09", "escape-link",
    path.join(archiveSeptember, "escape-link"),
    fs.realpathSync(path.join(archiveSeptember, "escape-link"))).reason,
  "archive_task_location");
}

const archiveMonthDiscovery = spawnSync("find", [archiveRoot, "-mindepth", "1",
  "-maxdepth", "1", "-print"], { encoding: "utf8" });
assert.equal(archiveMonthDiscovery.status, 0);
const archiveMonths = archiveMonthDiscovery.stdout.trim().split(/\r?\n/)
  .filter(Boolean).map((entry) => path.basename(entry))
  .filter((entry) => paths.isArchiveMonth(entry)).sort();
assert.deepEqual(archiveMonths, ["2026-07", "2026-08", "2026-09"]);
const archiveTaskDiscovery = spawnSync("find", [archiveSeptember, "-mindepth", "1",
  "-maxdepth", "1", "-print"], { encoding: "utf8" });
assert.equal(archiveTaskDiscovery.status, 0);
const archiveTaskEntries = archiveTaskDiscovery.stdout.trim().split(/\r?\n/).filter(Boolean);
assert.equal(archiveTaskEntries.includes(archivedSeptemberTask), true);
assert.equal(archiveTaskEntries.includes(path.join(archivedSeptemberTask, "nested-task")), false);
if (fs.existsSync(path.join(tasksRoot, "escape-link"))) {
  assert.equal(paths.resolveTaskDir(projectRoot, path.join(tasksRoot, "escape-link"), fs.realpathSync(path.join(tasksRoot, "escape-link")), {}).reason, "outside_tasks");
}
assert.equal(paths.resolveTaskJson(liveTask, fs.realpathSync(path.join(taskDir, "task.json"))).ok, true);
assert.equal(paths.resolveVersionFile(projectRoot, path.join(projectRoot, ".trellis"), path.join(projectRoot, ".trellis", ".version")).ok, true);
assert.equal(paths.resolveVersionFile(projectRoot, path.join(projectRoot, "nested", ".trellis"), path.join(projectRoot, "nested", ".trellis", ".version")).reason, "outside_project");
const sessionsRoot = path.join(projectRoot, ".trellis", ".runtime", "sessions");
fs.mkdirSync(sessionsRoot, { recursive: true });
assert.equal(paths.resolveSessionFile(projectRoot, sessionsRoot, path.join(sessionsRoot, "session.json"), path.join(sessionsRoot, "session.json")).ok, true);
assert.equal(paths.resolveSessionFile(projectRoot, path.join(projectRoot, "other"), path.join(projectRoot, "other", "session.json"), path.join(projectRoot, "other", "session.json")).reason, "outside_project");
const malformedSessionJsonPath = path.join(sessionsRoot, "malformed.json");
fs.writeFileSync(malformedSessionJsonPath, "{");
assert.equal(parser.parseJson(fs.readFileSync(malformedSessionJsonPath, "utf8")).error, "malformed_json");
const staleSessionJsonPath = path.join(sessionsRoot, "stale.json");
fs.writeFileSync(staleSessionJsonPath, JSON.stringify({
  current_task: ".trellis/tasks/stale-target"
}));
const staleSessionJson = parser.parseJson(fs.readFileSync(staleSessionJsonPath, "utf8"));
assert.equal(staleSessionJson.ok, true);
const stalePointer = paths.normalizePointer(staleSessionJson.value.current_task);
assert.equal(stalePointer.ok, true);
assert.notEqual(spawnSync("realpath", ["-e", "--",
  paths.joinPath(projectRoot, stalePointer.relativePath)]).status, 0);
assert.equal(paths.resolveMarkdownFile(taskDir, "prd.md", path.join(taskDir, "prd.md")).ok, true);
for (const name of ["prd.md", "design.md", "implement.md"])
  assert.equal(paths.resolveMarkdownFile(taskDir, name, path.join(taskDir, name)).ok, true);
assert.equal(paths.resolveMarkdownFile(taskDir, "notes.txt", path.join(taskDir, "notes.txt")).reason, "markdown_name");
assert.equal(paths.resolveMarkdownFile(taskDir, "nested/prd.md", path.join(taskDir, "nested/prd.md")).reason, "markdown_name");
assert.notEqual(spawnSync("realpath", ["-e", "--", path.join(taskDir, "missing.md")]).status, 0);
assert.equal(fs.statSync(path.join(taskDir, "design.md")).size, 0);
assert.ok(fs.statSync(path.join(taskDir, "implement.md")).size > paths.markdownByteLimit());
if (fs.existsSync(path.join(taskDir, "escape.md"))) {
  assert.equal(paths.resolveMarkdownFile(taskDir, "prd.md",
    fs.realpathSync(path.join(taskDir, "escape.md"))).reason, "markdown_location");
}

const projectInput = {
  id: projectRoot,
  name: "project",
  root: projectRoot,
  trellisVersion: "0.6.17",
  taskRecords: [
    {
      dirName: "09-live-task",
      taskDir,
      taskJson: path.join(taskDir, "task.json"),
      value: {
        id: "live",
        name: "Fallback title is not used",
        title: "Live task",
        status: "future_custom_status",
        priority: "P1",
        markdown: "not exposed"
      }
    },
    {
      dirName: "child",
      taskDir: path.join(tasksRoot, "child"),
      taskJson: path.join(tasksRoot, "child", "task.json"),
      value: { name: "Child task", parent: "live" }
    },
    {
      dirName: "planning-task",
      taskDir: path.join(tasksRoot, "planning-task"),
      taskJson: path.join(tasksRoot, "planning-task", "task.json"),
      value: { id: "planning-task", title: "Planning task", status: "planning" }
    },
    {
      dirName: "broken",
      taskDir: path.join(tasksRoot, "broken"),
      taskJson: path.join(tasksRoot, "broken", "task.json"),
      value: null,
      readError: "malformed_json"
    }
  ],
  sessionRecords: [
    {
      sessionKey: "valid-session",
      value: {
        current_task: ".trellis/tasks/09-live-task",
        last_seen_at: "2026-09-23T01:02:03Z"
      },
      resolution: { ok: true, taskDir }
    },
    {
      sessionKey: "stale-session",
      value: {
        current_task: ".trellis/tasks/missing",
        last_seen_at: "not-a-timestamp"
      },
      resolution: { ok: false, reason: "stale_target" }
    },
    {
      sessionKey: "resolved-invalid-timestamp",
      value: {
        current_task: ".trellis/tasks/09-live-task",
        last_seen_at: "not-a-timestamp"
      },
      resolution: { ok: true, taskDir }
    },
    {
      sessionKey: "resolved-missing-timestamp",
      value: { current_task: ".trellis/tasks/09-live-task" },
      resolution: { ok: true, taskDir }
    },
    {
      sessionKey: "malformed-session",
      value: { current_task: 42 }
    }
  ]
};
const project = parser.makeProjectSnapshot(projectInput).project;
const liveTaskSnapshot = project.tasks.find(task => task.id === "live");
const childTaskSnapshot = project.tasks.find(task => task.id === "child");
const planningTaskSnapshot = project.tasks.find(task => task.id === "planning-task");

assert.equal(project.trellisVersion, "0.6.17");
assert.equal(project.tasks.length, 4);
assert.equal(liveTaskSnapshot.storedStatus, "future_custom_status");
assert.equal(liveTaskSnapshot.priority, "P1");
assert.equal(liveTaskSnapshot.progress, null);
assert.equal(liveTaskSnapshot.activeSessionCount, 3);
assert.equal(childTaskSnapshot.parentId, "live");
assert.equal(childTaskSnapshot.storedStatus, "unknown");
assert.equal(planningTaskSnapshot.displayState, "planning");
assert.equal(project.sessions.length, 5);
assert.equal(project.sessions[0].taskId, "live");
assert.equal(project.sessions[0].lastSeenAt, "2026-09-23T01:02:03Z");
assert.equal(project.sessions[1].stale, true);
assert.equal(project.sessions[1].lastSeenAt, null);
assert.equal(project.sessions[2].taskId, "live");
assert.equal(project.sessions[2].lastSeenAt, null);
assert.equal(project.sessions[3].taskId, "live");
assert.equal(project.sessions[3].lastSeenAt, null);
assert.equal(project.sessions[4].error, "malformed_pointer");
assert.equal(project.sessions[4].lastSeenAt, null);
assert.equal(Array.from(liveTaskSnapshot.childIds).join(","), "child");
assert.equal(JSON.stringify(project).includes("not exposed"), false);

const brokenActiveProject = parser.makeProjectSnapshot({
  root: projectRoot,
  taskRecords: [{
    dirName: "broken-active",
    taskDir: path.join(tasksRoot, "broken-active"),
    taskJson: path.join(tasksRoot, "broken-active", "task.json"),
    value: null,
    readError: "malformed_json"
  }],
  sessionRecords: [{
    sessionKey: "broken-active-session",
    value: { current_task: ".trellis/tasks/broken-active" },
    resolution: { ok: true, taskDir: path.join(tasksRoot, "broken-active") }
  }]
}).project;
assert.equal(brokenActiveProject.tasks[0].activeSessionCount, 1);
assert.equal(brokenActiveProject.tasks[0].runtimeState, "error");

const oversizedJson = parser.parseJson("{" + "\"x\":\"" + "a".repeat(1024 * 1024) + "\"}");
assert.equal(oversizedJson.ok, false);
assert.equal(oversizedJson.error, "size_limit");

const snapshot = parser.makeSnapshot([projectInput],
  [{ code: "fixture", message: "ok" }], "2026-09-21T00:00:00.000Z", {
    scanStartedAt: "2026-09-21T00:00:01.000Z",
    lastSuccessfulDiscoveryAt: "2026-09-21T00:00:00.500Z",
    snapshotIsCurrent: true,
    lastGoodFallbackActive: false
  });
assert.equal(snapshot.schemaVersion, 2);
assert.equal(snapshot.runtime.scanStartedAt, "2026-09-21T00:00:01.000Z");
assert.equal(snapshot.runtime.lastSuccessfulDiscoveryAt, "2026-09-21T00:00:00.500Z");
assert.equal(snapshot.runtime.snapshotIsCurrent, true);
assert.equal(snapshot.runtime.lastGoodFallbackActive, false);
assert.equal(snapshot.primaryTaskId, null);
assert.equal(snapshot.projects[0].archiveSummary.loaded, false);
assert.equal(snapshot.projects[0].tasks.length, 4);
assert.equal(snapshot.projects[0].sessions.length, 5);
assert.equal(snapshot.projects[0].tasks.find(task => task.id === "live").progress, null);
assert.equal(Object.prototype.hasOwnProperty.call(snapshot.projects[0], "markdown"), false);
assert.equal(JSON.stringify(snapshot).includes("not exposed"), false);
assert.equal(projection.normalizeDesktopViewMode("overview"), "overview");
assert.equal(projection.normalizeDesktopViewMode("tasks"), "tasks");
assert.equal(projection.normalizeDesktopViewMode("health"), "health");
for (const invalidDesktopMode of [null, "", "launcher", 1, {}])
  assert.equal(projection.normalizeDesktopViewMode(invalidDesktopMode), "overview");
const snapshotBeforeDesktopProjection = JSON.stringify(snapshot);
const desktopProjection = projection.makeDesktopProjection(snapshot, {
  versionWarning: true
});
assert.equal(desktopProjection.ready, true);
assert.equal(desktopProjection.projectCount, 1);
assert.equal(desktopProjection.activeTaskCount, 1);
assert.equal(desktopProjection.taskProjects.length, 1);
assert.equal(desktopProjection.taskProjects[0].activeTasks.length, 1);
assert.equal(desktopProjection.taskProjects[0].activeTasks[0].id, "live");
assert.equal(desktopProjection.taskProjects[0].activeTasks[0].displayState, "active");
assert.equal(desktopProjection.taskProjects[0].activeTasks[0].priority, "P1");
assert.equal(desktopProjection.taskProjects[0].activeTasks[0].activeSessionCount, 3);
assert.equal(desktopProjection.health.ready, true);
assert.equal(desktopProjection.health.freshness.lastSuccessfulDiscoveryAt,
  "2026-09-21T00:00:00.500Z");
assert.equal(JSON.stringify(snapshot), snapshotBeforeDesktopProjection,
  "Desktop projection must not mutate the shared Snapshot");
const parserToProjection = projection.makePopoutProjection(snapshot);
assert.equal(parserToProjection.projects.length, 1);
assert.equal(parserToProjection.projects[0].tasks.length, 4);
const projectedTasks = parserToProjection.projects[0].tasks;
assert.equal(projectedTasks.find(task => task.id === "live").activeSessionCount, 3);
assert.equal(projectedTasks.find(task => task.id === "live").state, "active");
assert.equal(projectedTasks.find(task => task.id === "child").state, "unknown");
assert.equal(projectedTasks.find(task => task.id === "planning-task").state, "planning");
assert.equal(projectedTasks.find(task => task.id === "broken").state, "error");
assert.ok(snapshot.warnings.filter(warning => warning.code !== "fixture")
  .every(warning => warning.projectId === projectRoot),
  "parser warnings must retain project context after flattening");
assert.ok(snapshot.projects[0].tasks.find(task => task.id === "broken")
  .errors.every(error => error.projectId === projectRoot),
"task errors must carry the same project context as their warning projection");
assert.equal(projection.makePillProjection(snapshot, "auto").label, "Live task");
assert.equal(JSON.stringify(project).includes("August finished"), false);
assert.equal(JSON.stringify(project).includes("September finished"), false);
assert.equal(parser.parseJson(fs.readFileSync(
  path.join(malformedArchiveTask, "task.json"), "utf8")).ok, false);
assert.equal(parser.parseJson(fs.readFileSync(
  path.join(oversizedArchiveTask, "task.json"), "utf8")).error, "size_limit");

const warningBoundSnapshot = parser.makeSnapshot(Array.from({ length: 300 }, (_, index) => ({
  id: `project-${index}`,
  root: `/tmp/project-${index}`,
  warnings: [{ code: `warning-${index}`, message: "bounded" }]
})), [], "2026-09-21T00:00:00.000Z");
assert.equal(warningBoundSnapshot.warnings.length, 256);

const healthSnapshot = parser.makeSnapshot([
  {
    id: "private-id-alpha",
    root: "/private/projects/alpha",
    name: "Alpha",
    lastSuccessfulReadAt: "2026-09-21T00:01:00.000Z",
    taskRecords: [{ dirName: "healthy", value: { id: "healthy", title: "Alpha task" } }],
    sessionRecords: [],
    warnings: []
  },
  {
    id: "private-id-beta",
    root: "/private/projects/beta",
    name: "Beta",
    taskRecords: [{ dirName: "broken", value: null, readError: "malformed_json" }],
    sessionRecords: [],
    warnings: [
      { code: "task_discovery_failed", message: "failed under /private/projects/beta" },
      { code: "task_discovery_failed", message: "still failed under /private/projects/beta" },
      { code: "session_discovery_failed", message: "failed under /private/projects/beta" },
      { code: "task_data_invalid", message: "private /private/projects/beta/task.json" },
      { code: "discovery_limit", message: "private discovery cap warning" }
    ]
  }
], [{
  code: "last_good_snapshot",
  message: "retained data from /private/projects/beta"
}, {
  code: "future_warning",
  message: "private diagnostic text /private/projects/beta"
}], "2026-09-21T00:02:00.000Z", {
  scanStartedAt: "2026-09-21T00:02:00.000Z",
  lastSuccessfulDiscoveryAt: "2026-09-21T00:01:00.000Z",
  snapshotIsCurrent: false,
  lastGoodFallbackActive: true
});
const desktopAlphaRoot = "/private/projects/desktop-alpha";
const desktopAlphaTaskDir = path.join(desktopAlphaRoot, ".trellis/tasks/alpha-active");
const desktopBetaRoot = "/private/projects/desktop-beta";
const desktopBetaTaskDir = path.join(desktopBetaRoot, ".trellis/tasks/beta-active");
const desktopViewSnapshot = parser.makeSnapshot([
  {
    id: "desktop-alpha",
    root: desktopAlphaRoot,
    name: "Desktop Alpha",
    lastSuccessfulReadAt: "2026-09-21T00:03:00.000Z",
    taskRecords: [{
      dirName: "alpha-active",
      taskDir: desktopAlphaTaskDir,
      taskJson: path.join(desktopAlphaTaskDir, "task.json"),
      value: { id: "alpha-active", title: "Alpha active task", status: "in_progress", priority: "P1" }
    }],
    sessionRecords: [{
      sessionKey: "desktop-alpha-session",
      value: { current_task: ".trellis/tasks/alpha-active" },
      resolution: { ok: true, taskDir: desktopAlphaTaskDir }
    }],
    warnings: []
  },
  {
    id: "desktop-beta",
    root: desktopBetaRoot,
    name: "Desktop Beta",
    lastSuccessfulReadAt: "2026-09-21T00:03:30.000Z",
    taskRecords: [{
      dirName: "beta-active",
      taskDir: desktopBetaTaskDir,
      taskJson: path.join(desktopBetaTaskDir, "task.json"),
      value: { id: "beta-active", title: "Beta active task", status: "active", priority: "P2" }
    }],
    sessionRecords: [{
      sessionKey: "desktop-beta-session",
      value: { current_task: ".trellis/tasks/beta-active" },
      resolution: { ok: true, taskDir: desktopBetaTaskDir }
    }],
    warnings: [
      { code: "task_discovery_failed", message: "private warning /private/projects/desktop-beta" },
      { code: "task_discovery_failed", message: "second warning /private/projects/desktop-beta" }
    ]
  }
], [{ code: "topology_interval", message: "private global warning /private/root" }],
"2026-09-21T00:04:00.000Z", {
  scanStartedAt: "2026-09-21T00:04:00.000Z",
  lastSuccessfulDiscoveryAt: "2026-09-21T00:03:30.000Z",
  snapshotIsCurrent: false,
  lastGoodFallbackActive: true
});
const desktopViewSnapshotBefore = JSON.stringify(desktopViewSnapshot);
const multiProjectDesktop = projection.makeDesktopProjection(desktopViewSnapshot, {
  versionWarning: true
}, {
  kind: "archive-task",
  status: "error",
  projectId: "desktop-beta",
  warnings: [{ code: "archive_task_read_failed", message: "private archive /private/root" }],
  content: "private archive markdown"
});
assert.equal(multiProjectDesktop.projectCount, 2);
assert.equal(multiProjectDesktop.activeTaskCount, 2);
assert.deepEqual(Array.from(multiProjectDesktop.projects, project => project.name),
  ["Desktop Alpha", "Desktop Beta"]);
assert.deepEqual(Array.from(multiProjectDesktop.taskProjects, project => project.name),
  ["Desktop Alpha", "Desktop Beta"],
  "Tasks groups preserve the shared Snapshot project order");
assert.equal(multiProjectDesktop.health.healthyProjectCount, 1);
assert.equal(multiProjectDesktop.health.attentionProjectCount, 1);
assert.equal(multiProjectDesktop.health.projects[0].status, "healthy");
assert.equal(multiProjectDesktop.health.projects[1].status, "degraded");
assert.equal(multiProjectDesktop.health.projects[1].archiveIncidentCount, 1);
assert.ok(multiProjectDesktop.health.projects[1].incidents.some(
  incident => incident.title === "Archive data is unavailable"));
assert.equal(multiProjectDesktop.health.fallbackActive, true);
assert.equal(multiProjectDesktop.health.taskDataDegraded, true);
assert.equal(multiProjectDesktop.health.freshness.lastSuccessfulDiscoveryAt,
  "2026-09-21T00:03:30.000Z");
assert.ok(multiProjectDesktop.health.unscopedIncidents.length > 0);
assert.equal(JSON.stringify(multiProjectDesktop.health).includes("/private/"), false,
  "Desktop Health view data must not expose roots or raw warning messages");
assert.equal(JSON.stringify(multiProjectDesktop.health).includes("private archive markdown"), false,
  "archive content remains outside Desktop Health projection");
assert.equal(JSON.stringify(desktopViewSnapshot), desktopViewSnapshotBefore,
  "mode projections must not mutate the shared multi-project Snapshot");
const healthyDesktopSnapshot = parser.makeSnapshot([{
  id: "desktop-healthy",
  root: "/private/projects/desktop-healthy",
  name: "Healthy project",
  taskRecords: [],
  sessionRecords: [],
  warnings: []
}], [], "2026-09-21T00:05:00.000Z", {
  scanStartedAt: "2026-09-21T00:05:00.000Z",
  lastSuccessfulDiscoveryAt: "2026-09-21T00:05:00.000Z",
  snapshotIsCurrent: true,
  lastGoodFallbackActive: false
});
const healthyDesktop = projection.makeDesktopProjection(healthyDesktopSnapshot);
assert.equal(healthyDesktop.activeTaskCount, 0);
assert.equal(healthyDesktop.taskProjects.length, 0);
assert.equal(healthyDesktop.health.incidentCount, 0);
assert.equal(healthyDesktop.health.healthyProjectCount, 1);
assert.equal(healthyDesktop.health.taskDataDegraded, false);
const warningOnlySnapshot = Object.assign({}, healthyDesktopSnapshot, {
  warnings: [{ code: "topology_interval", message: "scan interval was normalized" }]
});
const warningOnlyDesktop = projection.makeDesktopProjection(warningOnlySnapshot);
assert.ok(warningOnlyDesktop.health.incidentCount > 0);
assert.equal(warningOnlyDesktop.health.taskDataDegraded, false,
  "warning-only configuration incidents must not claim live task details are incomplete");
const taskDegradedSnapshot = Object.assign({}, healthyDesktopSnapshot, {
  warnings: [{ code: "task_discovery_failed", projectId: "desktop-healthy" }]
});
const taskDegradedDesktop = projection.makeDesktopProjection(taskDegradedSnapshot);
assert.equal(taskDegradedDesktop.health.fallbackActive, false);
assert.equal(taskDegradedDesktop.health.taskDataDegraded, true,
  "degraded live-task incidents must appear in the compact Tasks banner");
const archiveOnlyDesktop = projection.makeDesktopProjection(healthyDesktopSnapshot, undefined, {
  kind: "archive-task",
  status: "error",
  projectId: "desktop-healthy",
  warnings: [{ code: "archive_task_read_failed" }]
});
assert.ok(archiveOnlyDesktop.health.incidentCount > 0);
assert.equal(archiveOnlyDesktop.health.taskDataDegraded, false,
  "archive-only incidents must not claim live task details are incomplete");
const emptyDesktop = projection.makeDesktopProjection(parser.makeSnapshot([], [],
  "2026-09-21T00:06:00.000Z"));
assert.equal(emptyDesktop.ready, true);
assert.equal(emptyDesktop.projectCount, 0);
assert.equal(emptyDesktop.activeTaskCount, 0);
assert.equal(emptyDesktop.health.projectCount, 0);
const healthSnapshotBefore = JSON.stringify(healthSnapshot);
const health = projection.makeHealthProjection(healthSnapshot);
assert.equal(health.ready, true);
assert.equal(health.freshness.available, true);
assert.equal(health.freshness.scanStartedAt, "2026-09-21T00:02:00.000Z");
assert.equal(health.freshness.lastSuccessfulDiscoveryAt, "2026-09-21T00:01:00.000Z");
assert.equal(health.freshness.snapshotIsCurrent, false);
assert.equal(health.freshness.lastGoodFallbackActive, true);
assert.equal(health.fallbackActive, true);
assert.equal(health.projects.length, 2);
assert.equal(health.projects[0].status, "healthy",
  "a degraded project must not mark another project degraded");
assert.equal(health.projects[0].lastSuccessfulReadAt, "2026-09-21T00:01:00.000Z");
assert.equal(health.projects[1].status, "degraded");
assert.equal(health.incidents.filter(incident => incident.rootCause === "task_discovery").length, 1,
  "repeated warnings from the same task-discovery cause must group together");
assert.equal(health.incidents.find(incident => incident.rootCause === "task_discovery").count, 2);
assert.ok(health.incidents.some(incident => incident.rootCause === "session_discovery"),
  "an independent session-discovery cause must remain a separate incident");
assert.ok(health.incidents.some(incident => incident.warningCodes.includes("discovery_limit")),
  "bounded discovery caps must produce an incident");
assert.ok(health.incidents.some(incident => incident.warningCodes.includes("task_read_failed")
  && incident.warningCodes.includes("task_data_invalid")),
"task read/data errors from the same input cause must retain both raw codes");
assert.ok(!health.incidents.some(incident => incident.warningCodes.includes("last_good_snapshot")),
  "last-good state is shown by freshness and must not add another incident");
assert.equal(health.rawWarningCount, healthSnapshot.warnings.length);
assert.equal(health.rawErrorCount, 2);
assert.equal(JSON.stringify(healthSnapshot), healthSnapshotBefore,
  "Health projection must not mutate its Snapshot input");
const fallbackAfterKnownReload = parser.makeSnapshot([{
  id: "private-id-beta",
  root: "/private/projects/beta",
  name: "Beta",
  lastSuccessfulReadAt: "2026-09-21T00:02:45.000Z",
  taskRecords: [{ dirName: "reloaded", value: { id: "reloaded", title: "Reloaded task" } }],
  sessionRecords: [],
  warnings: []
}], [{
  code: "last_good_snapshot",
  message: "retained after a degraded topology scan"
}], "2026-09-21T00:03:00.000Z", {
  scanStartedAt: "2026-09-21T00:02:00.000Z",
  lastSuccessfulDiscoveryAt: "2026-09-21T00:01:00.000Z",
  snapshotIsCurrent: false,
  lastGoodFallbackActive: true
});
const fallbackAfterKnownReloadHealth = projection.makeHealthProjection(fallbackAfterKnownReload);
assert.equal(fallbackAfterKnownReloadHealth.freshness.lastSuccessfulDiscoveryAt,
  "2026-09-21T00:01:00.000Z",
  "known-file reloads update project reads without claiming a topology discovery");
assert.equal(fallbackAfterKnownReloadHealth.freshness.snapshotIsCurrent, false);
assert.equal(fallbackAfterKnownReloadHealth.freshness.lastGoodFallbackActive, true);
assert.equal(fallbackAfterKnownReloadHealth.fallbackActive, true);
assert.equal(fallbackAfterKnownReloadHealth.projects[0].lastSuccessfulReadAt,
  "2026-09-21T00:02:45.000Z",
  "a successful known-file read may advance the project's own read timestamp");
const healthJson = JSON.stringify(health);
for (const privateValue of ["private-id-alpha", "private-id-beta", "/private/projects",
  "private diagnostic text", "Alpha task"])
assert.equal(healthJson.includes(privateValue), false,
    `Health projection must not expose raw identifier or diagnostic body: ${privateValue}`);

const compatibilityHealth = projection.makeHealthProjection(parser.makeSnapshot([{
  id: "private-compatibility-id",
  root: "/private/compatibility",
  name: "Compatibility",
  taskRecords: [],
  sessionRecords: [],
  warnings: [{ code: "version_unverified", message: "unsupported version" },
    { code: "version_reload_failed", message: "version read failed" }]
}], [], "2026-09-21T00:02:30.000Z", {
  scanStartedAt: "2026-09-21T00:02:30.000Z",
  lastSuccessfulDiscoveryAt: "2026-09-21T00:02:00.000Z",
  snapshotIsCurrent: true,
  lastGoodFallbackActive: false
}));
assert.equal(compatibilityHealth.projects[0].status, "warning",
  "version compatibility warnings must not degrade readable live task/session facts");

const archiveHealth = projection.makeHealthProjection(healthSnapshot, {
  kind: "archive-page",
  status: "error",
  projectId: "private-id-alpha",
  warnings: [{ code: "archive_page_failed", message: "/private/projects/alpha/private detail" }],
  content: "SECRET MARKDOWN BODY",
  tasks: [{ title: "SECRET ARCHIVE TASK" }]
});
const archiveIncident = archiveHealth.incidents.find(incident => incident.scope === "archive");
assert.ok(archiveIncident);
assert.equal(archiveIncident.projectIndex, 0);
assert.equal(archiveHealth.projects[0].status, "warning",
  "archive-only failures must not describe live task/session data as degraded");
assert.equal(archiveHealth.projects[0].archiveIncidentCount, 1);
assert.equal(JSON.stringify(archiveHealth).includes("SECRET"), false,
  "archive content and rows must stay outside Health projection");
const markdownFailureHealth = projection.makeHealthProjection({
  schemaVersion: 1,
  projects: [],
  warnings: []
}, {
  kind: "markdown",
  status: "error",
  warnings: [{ code: "markdown_read_failed" }]
});
assert.equal(markdownFailureHealth.incidentCount, 0,
  "Markdown detail errors must not be treated as archive incidents");

const recoveredSnapshot = parser.makeSnapshot([{
  id: "private-id-beta",
  root: "/private/projects/beta",
  name: "Beta",
  lastSuccessfulReadAt: "2026-09-21T00:03:00.000Z",
  taskRecords: [{ dirName: "recovered", value: { id: "recovered", title: "Recovered" } }],
  sessionRecords: [],
  warnings: []
}], [], "2026-09-21T00:03:00.000Z", {
  scanStartedAt: "2026-09-21T00:03:00.000Z",
  lastSuccessfulDiscoveryAt: "2026-09-21T00:03:00.000Z",
  snapshotIsCurrent: true,
  lastGoodFallbackActive: false
});
const recoveredHealth = projection.makeHealthProjection(recoveredSnapshot, {
  kind: "archive-page",
  status: "ready",
  projectId: "private-id-alpha",
  warnings: []
});
assert.equal(recoveredHealth.incidentCount, 0,
  "a later coherent scan and successful archive response must clear transient incidents");
assert.equal(recoveredHealth.projects[0].status, "healthy");

const legacyHealthClean = projection.makeHealthProjection({
  schemaVersion: 1,
  generatedAt: "2026-09-21T00:00:00.000Z",
  projects: [{
    id: "private-legacy-id",
    root: "/private/legacy",
    name: "Legacy",
    tasks: [],
    sessions: []
  }],
  warnings: []
});
assert.equal(legacyHealthClean.freshness.available, false);
assert.equal(legacyHealthClean.freshness.scanStartedAt, "");
assert.equal(legacyHealthClean.freshness.lastSuccessfulDiscoveryAt, "");
assert.equal(legacyHealthClean.freshness.snapshotIsCurrent, null);
assert.equal(legacyHealthClean.freshness.lastGoodFallbackActive, null);
assert.equal(legacyHealthClean.fallbackActive, false);
assert.equal(legacyHealthClean.projects[0].lastSuccessfulReadAt, "");
const legacyHealthFallback = projection.makeHealthProjection({
  schemaVersion: 1,
  generatedAt: "2026-09-21T00:00:00.000Z",
  projects: [],
  warnings: [{ code: "last_good_snapshot", message: "old Snapshot retained" }]
});
assert.equal(legacyHealthFallback.freshness.available, false);
assert.equal(legacyHealthFallback.freshness.lastGoodFallbackActive, true);
assert.equal(legacyHealthFallback.fallbackActive, true,
  "schema-v1 fallback warning must remain visible without inventing other metadata");
assert.equal(legacyHealthFallback.incidentCount, 0);
const separateRootHealth = projection.makeHealthProjection(parser.makeSnapshot([], [
  { code: "project_discovery_failed", root: "/private/root-one" },
  { code: "project_discovery_failed", root: "/private/root-two" }
], "2026-09-21T00:04:00.000Z", {
  scanStartedAt: "2026-09-21T00:04:00.000Z",
  lastSuccessfulDiscoveryAt: "",
  snapshotIsCurrent: true,
  lastGoodFallbackActive: false
}));
assert.equal(separateRootHealth.incidentCount, 2,
  "root incidents from separate configured roots must not collapse together");
assert.ok(!JSON.stringify(separateRootHealth).includes("/private/root"),
  "root paths must remain internal to the Health projection");

const diagnosticsSnapshot = {
  schemaVersion: 2,
  generatedAt: "2026-09-21T00:10:00.000Z",
  runtime: {
    scanStartedAt: "2026-09-21T00:09:30.000Z",
    lastSuccessfulDiscoveryAt: "2026-09-21T00:09:00.000Z",
    snapshotIsCurrent: true,
    lastGoodFallbackActive: false
  },
  projects: [
    {
      id: "private-alpha-id",
      root: "/home/alice/projects/alpha",
      name: "Alpha /home/alice/PROJECT_NAME_SECRET",
      trellisVersion: "0.6.17",
      lastSuccessfulReadAt: "2026-09-21T00:08:00.000Z",
      tasks: [{ id: "private-alpha-task-id", title: "TASK_MARKDOWN_SECRET", errors: [] }],
      sessions: [{ id: "private-alpha-session-id", content: "SESSION_CONTENT_SECRET" }],
      errors: []
    },
    {
      id: "private-beta-id",
      root: "/home/alice/projects/beta",
      name: "Beta PROJECT_NAME_SECRET",
      trellisVersion: "/home/alice/version-path-secret",
      lastSuccessfulReadAt: "2026-09-21T00:08:30.000Z",
      tasks: [{ id: "private-beta-task-id", title: "BETA_TASK_SECRET", errors: [] }],
      sessions: [],
      errors: [{ code: "task_read_failed", message: "ERROR_MESSAGE_SECRET /home/alice" }]
    }
  ],
  warnings: [
    { code: "/home/alice/WARNING_CODE_SECRET", projectId: "private-alpha-id",
      message: "WARNING_MESSAGE_SECRET /home/alice/projects/alpha" },
    { code: "task_discovery_failed", projectId: "private-beta-id",
      message: "BETA_WARNING_SECRET /home/alice/projects/beta" }
  ]
};
const diagnosticsSnapshotBefore = JSON.stringify(diagnosticsSnapshot);
const diagnosticsProjection = projection.makeDiagnosticsProjection(diagnosticsSnapshot, {
  kind: "archive-task",
  status: "error",
  projectId: "private-alpha-id",
  warnings: [{ code: "archive_task_read_failed", message: "ARCHIVE_WARNING_SECRET" }],
  content: "ARCHIVE_MARKDOWN_SECRET /home/alice",
  tasks: [{ title: "ARCHIVE_TASK_SECRET" }]
}, {
  pluginVersion: "1.1.0",
  pluginLoaded: true,
  capabilities: ["daemon", "desktop-widget", "/home/alice/secret-capability"],
  surfaces: ["widget", "launcher", "private/path"],
  dmsVersion: "9.9.9-unverified",
  quickshellVersion: "9.9.9-unverified",
  qtVersion: "6.8.2"
});
assert.equal(diagnosticsProjection.ready, true);
assert.equal(diagnosticsProjection.snapshotState, "current");
assert.equal(diagnosticsProjection.projectCount, 2);
assert.equal(diagnosticsProjection.taskCount, 2);
assert.equal(diagnosticsProjection.sessionCount, 1);
assert.equal(diagnosticsProjection.projects[0].trellisVersion, "0.6.17");
assert.equal(diagnosticsProjection.projects[1].trellisVersion, "unavailable",
  "unsafe version strings must stay unavailable");
assert.deepEqual(Array.from(diagnosticsProjection.capabilities), ["daemon", "desktop-widget"]);
assert.deepEqual(Array.from(diagnosticsProjection.surfaces), ["widget", "launcher"]);
assert.equal(diagnosticsProjection.dmsVersion, "unavailable");
assert.equal(diagnosticsProjection.quickshellVersion, "unavailable");
assert.equal(diagnosticsProjection.qtVersion, "6.8.2");
assert.ok(diagnosticsProjection.report.includes("host.dms=unavailable"));
assert.ok(diagnosticsProjection.report.includes("host.quickshell=unavailable"));
assert.ok(diagnosticsProjection.report.includes("host.qt=6.8.2"));
assert.ok(diagnosticsProjection.report.includes("project.1.incident_codes=unknown_warning,archive_task_read_failed"));
assert.ok(diagnosticsProjection.report.includes("project.2.incident_codes=task_read_failed,task_discovery_failed"));
assert.ok(diagnosticsProjection.report.includes("counts.raw_warnings=3"));
assert.ok(diagnosticsProjection.report.includes("counts.raw_errors=1"));
assert.ok(diagnosticsProjection.report.length <= 8192);
for (const privateValue of ["alice", "private-alpha-id", "private-beta-id", "private-alpha-task-id",
  "private-alpha-session-id", "PROJECT_NAME_SECRET", "TASK_MARKDOWN_SECRET", "SESSION_CONTENT_SECRET",
  "WARNING_CODE_SECRET", "WARNING_MESSAGE_SECRET", "ERROR_MESSAGE_SECRET", "ARCHIVE_WARNING_SECRET",
  "ARCHIVE_MARKDOWN_SECRET", "ARCHIVE_TASK_SECRET", "BETA_WARNING_SECRET", "secret-capability",
  "private/path", "version-path-secret"])
  assert.equal(diagnosticsProjection.report.includes(privateValue), false,
    `copied diagnostics must exclude private source data: ${privateValue}`);
assert.equal(JSON.stringify(diagnosticsSnapshot), diagnosticsSnapshotBefore,
  "diagnostics projection must not mutate the shared Snapshot");
const unavailableDiagnostics = projection.makeDiagnosticsProjection(null);
assert.equal(unavailableDiagnostics.ready, false);
assert.equal(unavailableDiagnostics.snapshotState, "unavailable");
assert.equal(unavailableDiagnostics.schemaVersion, null);
assert.equal(unavailableDiagnostics.projectCount, 0);
assert.equal(unavailableDiagnostics.taskCount, 0);
assert.equal(unavailableDiagnostics.sessionCount, 0);
assert.ok(unavailableDiagnostics.report.includes("snapshot.source=unavailable"));
assert.ok(unavailableDiagnostics.report.includes("snapshot.schema_version=unavailable"));
const emptyDiagnostics = projection.makeDiagnosticsProjection({
  schemaVersion: 2,
  generatedAt: "2026-09-21T00:10:00.000Z",
  runtime: {
    scanStartedAt: "2026-09-21T00:09:30.000Z",
    lastSuccessfulDiscoveryAt: "2026-09-21T00:09:00.000Z",
    snapshotIsCurrent: true,
    lastGoodFallbackActive: false
  },
  projects: [],
  warnings: []
});
assert.equal(emptyDiagnostics.ready, true);
assert.equal(emptyDiagnostics.snapshotState, "current");
assert.equal(emptyDiagnostics.schemaVersion, 2);
assert.equal(emptyDiagnostics.projectCount, 0);
assert.equal(emptyDiagnostics.taskCount, 0);
assert.equal(emptyDiagnostics.sessionCount, 0);
assert.ok(emptyDiagnostics.report.includes("snapshot.source=daemon"));
assert.ok(emptyDiagnostics.report.includes("snapshot.schema_version=2"));
assert.ok(emptyDiagnostics.report.includes("counts.projects=0"));
assert.ok(emptyDiagnostics.report.includes("counts.tasks=0"));
assert.ok(emptyDiagnostics.report.includes("counts.sessions=0"));
const unsafeTimestampDiagnostics = projection.makeDiagnosticsProjection(Object.assign({},
  diagnosticsSnapshot, { generatedAt: "2026-09-21T00:10:00.000Z /home/alice/time-secret" }),
null, { qtVersion: "6.8.2" });
assert.ok(unsafeTimestampDiagnostics.report.includes("snapshot.generated_at=unavailable"));
assert.equal(unsafeTimestampDiagnostics.report.includes("time-secret"), false,
  "timestamps must be validated before entering copied diagnostics");

const fallbackDiagnostics = projection.makeDiagnosticsProjection(healthSnapshot, null, {
  pluginVersion: "1.1.0",
  pluginLoaded: true,
  capabilities: ["daemon"],
  surfaces: ["settings"],
  qtVersion: "6.8.2"
});
assert.equal(fallbackDiagnostics.ready, true,
  "diagnostics remain available while a last-good Snapshot is active");
assert.equal(fallbackDiagnostics.snapshotState, "last_good_fallback");
assert.ok(fallbackDiagnostics.report.includes("snapshot.state=last_good_fallback"));

const legacyDiagnostics = projection.makeDiagnosticsProjection({
  schemaVersion: 1,
  generatedAt: "2026-09-21T00:00:00.000Z",
  projects: [],
  warnings: []
}, null, { dmsVersion: "", quickshellVersion: "", qtVersion: "" });
assert.equal(legacyDiagnostics.snapshotState, "freshness_unavailable");
assert.ok(legacyDiagnostics.report.includes("snapshot.state=freshness_unavailable"));
assert.ok(legacyDiagnostics.report.includes("snapshot.last_successful_discovery_at=unavailable"));
assert.ok(legacyDiagnostics.report.includes("host.dms=unavailable"));

// Recent Changes: observations run on actual parser facts, through the same
// Health projection used by the daemon. Times are fixed; no wall-clock waits.
const changesTime = "2026-10-08T00:00:00.000Z";
const changesClone = (value) => JSON.parse(JSON.stringify(value));
function changesInput(id = "alpha", status = "planning", sessionTasks = []) {
  return {
    id, root: `/changes/${id}`, name: `Project ${id}`,
    taskRecords: ["one", "two"].map((taskId) => ({
      dirName: taskId, taskDir: `/changes/${id}/${taskId}`,
      value: { id: taskId, title: `Task ${taskId}`, status }
    })),
    sessionRecords: sessionTasks.map((taskId, index) => ({
      sessionKey: `session-${index}`, value: { current_task: taskId },
      resolution: { ok: true, taskDir: `/changes/${id}/${taskId}` }
    }))
  };
}
function changesSnapshot(inputs, warnings = [], runtime = {}) {
  return parser.makeSnapshot(inputs, warnings, changesTime, Object.assign({
    snapshotIsCurrent: true, lastGoodFallbackActive: false
  }, runtime));
}
function observeChanges(tracker, snapshot, generation) {
  const immutable = JSON.stringify(snapshot);
  const result = changes.observeSnapshot(tracker, snapshot,
    projection.makeHealthProjection(snapshot), generation, changesTime);
  assert.equal(JSON.stringify(snapshot), immutable, "observation must leave shared facts intact");
  return changesClone(result.events);
}
const changeTracker = changes.createTracker("epoch-a");
const initialChanges = changesSnapshot([changesInput()]);
assert.equal(parser.makeProjectSnapshot(changesInput()).project.tasks[0].progress, null);
assert.equal(projection.makePillProjection(initialChanges, "auto").ready, true);
assert.equal(projection.makePopoutProjection(initialChanges).ready, true);
assert.deepEqual(observeChanges(changeTracker, initialChanges, 1), [], "initial facts are quiet");
const timestampNoise = changesClone(initialChanges);
timestampNoise.generatedAt = "2026-10-08T00:00:01.000Z";
timestampNoise.runtime.scanStartedAt = "2026-10-08T00:00:02.000Z";
timestampNoise.projects[0].lastSuccessfulReadAt = "2026-10-08T00:00:03.000Z";
timestampNoise.warnings = [{ code: "version_unverified" }, { code: "topology_interval" }];
assert.deepEqual(observeChanges(changeTracker, timestampNoise, 2), []);
timestampNoise.warnings.reverse();
assert.deepEqual(observeChanges(changeTracker, timestampNoise, 3), [], "warning order is not semantic");
const changeBatch = changesSnapshot([changesInput("alpha", "in_progress", ["one"]), changesInput("beta")]);
changeBatch.projects[0].tasks.push({
  id: "three", title: "New task", storedStatus: "planning", displayState: "planning",
  activeSessionCount: 0, errors: []
});
const changeBatchEvents = observeChanges(changeTracker, changeBatch, 4);
for (const kind of ["project_discovered", "task_discovered", "task_status_changed",
  "task_state_changed", "session_attached", "active_session_count_changed"])
  assert.ok(changeBatchEvents.some((event) => event.event_type === kind), `missing ${kind}`);
const statusEvent = changeBatchEvents.find((event) => event.event_type === "task_status_changed");
assert.deepEqual(statusEvent.before, { status: "planning" });
assert.deepEqual(statusEvent.after, { status: "in_progress" });
assert.equal(statusEvent.project_id, "alpha");
assert.equal(statusEvent.source_snapshot_generation, 4);
assert.equal(statusEvent.epoch, "epoch-a");
assert.equal(new Set(changeBatchEvents.map((event) => event.event_id)).size, changeBatchEvents.length);
assert.deepEqual(observeChanges(changeTracker, changesSnapshot([]), 4), changeBatchEvents,
  "a repeated generation is ignored even with differing payloads");
assert.deepEqual(observeChanges(changeTracker, changeBatch, 5), changeBatchEvents,
  "the same facts at a new generation do not duplicate events");
const reassigned = changesSnapshot([changesInput("alpha", "in_progress", ["two"]), changesInput("beta")]);
const reassignedEvents = observeChanges(changeTracker, reassigned, 6).slice(changeBatchEvents.length);
assert.ok(reassignedEvents.some((event) => event.event_type === "session_detached" && event.task_id === "one"));
assert.ok(reassignedEvents.some((event) => event.event_type === "session_attached" && event.task_id === "two"));
assert.equal(reassignedEvents.filter((event) => event.event_type === "session_attached").length, 1);
assert.equal(reassignedEvents.some((event) => event.event_type === "task_discovered"), false,
  "task absence is retained and never interpreted as completion");
const sessionClockNoise = changesClone(reassigned);
sessionClockNoise.projects.reverse();
for (const project of sessionClockNoise.projects) {
  project.tasks.reverse();
  for (const session of project.sessions) {
    session.lastSeenAt = "2026-10-08T23:00:00.000Z";
    session.mtime = 999999999;
  }
}
const beforeSessionClockNoise = changeTracker.events.length;
observeChanges(changeTracker, sessionClockNoise, 7);
assert.equal(changeTracker.events.length, beforeSessionClockNoise,
  "timestamp-only and input-order changes never become data events");

// Per-record failure retains old facts; another readable project can change.
const recoveryTracker = changes.createTracker("recovery");
observeChanges(recoveryTracker, changesSnapshot([
  changesInput("alpha", "planning", ["one"]), changesInput("beta")
]), 1);
const partial = changesInput("alpha", "planning", ["one"]);
partial.taskRecords[0].readError = "unreadable";
partial.sessionRecords[0].readError = "unreadable";
const failureEvents = observeChanges(recoveryTracker, changesSnapshot([
  partial, changesInput("beta", "in_progress")
]), 2);
assert.ok(failureEvents.some((event) => event.project_id === "beta" && event.event_type === "task_status_changed"));
assert.ok(failureEvents.some((event) => event.project_id === "alpha" && event.event_type === "health_degraded"));
assert.equal(failureEvents.some((event) => event.project_id === "alpha"
  && ["session_detached", "task_state_changed", "active_session_count_changed", "task_discovered"].includes(event.event_type)), false);
const recoveredEvents = observeChanges(recoveryTracker, changesSnapshot([
  changesInput("alpha", "in_progress", ["one"]), changesInput("beta", "in_progress")
]), 3).slice(failureEvents.length);
assert.ok(recoveredEvents.some((event) => event.project_id === "alpha" && event.event_type === "health_recovered"));
assert.ok(recoveredEvents.some((event) => event.project_id === "alpha" && event.event_type === "task_status_changed"));
assert.equal(recoveredEvents.some((event) => ["task_discovered", "session_detached", "session_attached"].includes(event.event_type)), false);
const fallback = changesSnapshot([changesInput("alpha", "completed"), changesInput("beta")],
  [{ code: "last_good_snapshot" }, { code: "root_unavailable", root: "/changes" }],
  { lastGoodFallbackActive: true, snapshotIsCurrent: false });
const fallbackEvents = observeChanges(recoveryTracker, fallback, 4).slice(failureEvents.length + recoveredEvents.length);
assert.ok(fallbackEvents.some((event) => event.event_type === "project_unavailable"));
assert.equal(fallbackEvents.some((event) => ["task_status_changed", "task_state_changed", "session_detached", "task_discovered"].includes(event.event_type)), false);
const beforeRootRecovery = recoveryTracker.events.length;
const rootRecovery = observeChanges(recoveryTracker, changesSnapshot([
  changesInput("alpha", "in_progress", ["one"]), changesInput("beta", "in_progress")
]), 5).slice(beforeRootRecovery);
assert.ok(rootRecovery.some((event) => event.event_type === "project_recovered"));
assert.equal(rootRecovery.some((event) => ["task_discovered", "session_attached", "session_detached"].includes(event.event_type)), false);
const beforeAbsent = recoveryTracker.events.length;
observeChanges(recoveryTracker, changesSnapshot([changesInput("beta", "in_progress")]), 6);
assert.equal(recoveryTracker.events.slice(beforeAbsent).filter((event) => event.event_type === "project_unavailable").length, 1);
const beforeReturn = recoveryTracker.events.length;
observeChanges(recoveryTracker, changesSnapshot([
  changesInput("alpha", "in_progress", ["one"]), changesInput("beta", "in_progress")
]), 7);
assert.deepEqual(changesClone(recoveryTracker.events.slice(beforeReturn)).map((event) => event.event_type), ["project_recovered"]);
const scopedRootTracker = changes.createTracker("scoped-root");
observeChanges(scopedRootTracker, changesSnapshot([changesInput("alpha"), changesInput("beta")]), 1);
const scopedRootEvents = observeChanges(scopedRootTracker, changesSnapshot([
  changesInput("alpha", "completed"), changesInput("beta", "in_progress")
], [{ code: "root_unavailable", root: "/changes/alpha" }]), 2);
assert.ok(scopedRootEvents.some((event) => event.project_id === "alpha" && event.event_type === "project_unavailable"));
assert.equal(scopedRootEvents.some((event) => event.project_id === "alpha" && event.event_type === "task_status_changed"), false);
assert.ok(scopedRootEvents.some((event) => event.project_id === "beta" && event.event_type === "task_status_changed"),
  "a failed root gates its own projects while readable roots still compare");

// Session reassignment needs reliable old/new targets. A failed task may not
// detach its session just because the readable pointer now names another task.
const reassignmentTracker = changes.createTracker("targets");
observeChanges(reassignmentTracker, changesSnapshot([changesInput("alpha", "planning", ["one"])]), 1);
const brokenTarget = changesInput("alpha", "planning", ["two"]);
brokenTarget.taskRecords[0].readError = "broken";
observeChanges(reassignmentTracker, changesSnapshot([brokenTarget]), 2);
assert.equal(reassignmentTracker.events.some((event) => event.event_type === "session_detached"), false);
observeChanges(reassignmentTracker, changesSnapshot([changesInput("alpha", "planning", ["two"])]), 3);
assert.ok(reassignmentTracker.events.some((event) => event.event_type === "session_detached"));
assert.ok(reassignmentTracker.events.some((event) => event.event_type === "session_attached"));
const incompleteSessionTracker = changes.createTracker("session-discovery");
const activeChanges = changesSnapshot([changesInput("alpha", "planning", ["one", "one"])]);
observeChanges(incompleteSessionTracker, activeChanges, 1);
const discoveryError = changesSnapshot([changesInput("alpha", "planning", ["one"])],
  [{ code: "session_discovery_failed", projectId: "alpha" }]);
observeChanges(incompleteSessionTracker, discoveryError, 2);
assert.equal(incompleteSessionTracker.events.some((event) => ["session_detached", "task_state_changed",
  "active_session_count_changed"].includes(event.event_type)), false);
const malformedSession = changesInput("alpha", "planning", ["one", "one"]);
malformedSession.sessionRecords[1].value = { current_task: null };
observeChanges(incompleteSessionTracker, changesSnapshot([malformedSession]), 3);
const duplicateSession = changesClone(activeChanges);
duplicateSession.projects[0].sessions.push(changesClone(duplicateSession.projects[0].sessions[1]));
observeChanges(incompleteSessionTracker, duplicateSession, 4);
const beforeSessionRecovery = incompleteSessionTracker.events.length;
observeChanges(incompleteSessionTracker, activeChanges, 5);
assert.equal(incompleteSessionTracker.events.slice(beforeSessionRecovery).some((event) =>
  ["session_attached", "session_detached", "task_discovered", "active_session_count_changed"].includes(event.event_type)), false);
observeChanges(incompleteSessionTracker, changesSnapshot([changesInput("alpha", "planning", ["one"])]), 6);
assert.equal(incompleteSessionTracker.events.filter((event) => event.event_type === "session_detached").length, 1,
  "a later reliable session absence is a detachment");

const pin = projection.parsePinnedTaskToken(projection.makePinnedTaskToken("alpha", "two"));
const emptySelection = changes.selectionSummary(null, { projectId: "alpha", taskId: null });
const beforeInitialSelection = changeTracker.events.length;
changes.observeSelection(changeTracker, emptySelection, changesTime);
assert.equal(changeTracker.events.length, beforeInitialSelection, "initial DMS preferences are quiet");
const beforeSelection = changeTracker.events.length;
changes.observeSelection(changeTracker, changes.selectionSummary(pin, {
  projectId: "alpha", taskId: "two"
}), changesTime);
const selectionEvents = changesClone(changeTracker.events.slice(beforeSelection));
assert.deepEqual(selectionEvents.map((event) => event.event_type), ["pin_changed", "primary_changed"]);
assert.ok(selectionEvents.every((event) => event.source === "ui_selection" && event.source_snapshot_generation === 7));
assert.deepEqual(selectionEvents[0].after, { project_id: "alpha", task_id: "two" });
changes.observeSelection(changeTracker, changes.selectionSummary(pin, {
  projectId: "alpha", taskId: "two"
}), changesTime);
assert.equal(changeTracker.events.length, beforeSelection + 2);

const archiveTracker = changes.createTracker("archive");
observeChanges(archiveTracker, initialChanges, 1);
const archiveProject = { id: "alpha", name: "Project alpha" };
const archiveRow = (id) => ({ id, dirName: id, title: `Archived ${id}`,
  available: true, storedStatus: "completed", error: "" });
const archivePage = (rows, page = 0) => ({ kind: "archive-page", status: rows.length ? "ready" : "empty",
  selectedMonth: "2026-10", page, pageSize: 16, warnings: [], tasks: rows });
changes.observeArchivePage(archiveTracker, archiveProject, archivePage([archiveRow("old")]), changesTime);
assert.equal(archiveTracker.events.length, 0, "first archive coverage is quiet");
changes.observeArchivePage(archiveTracker, archiveProject, archivePage([archiveRow("old"), archiveRow("new")]), changesTime);
assert.equal(archiveTracker.events.length, 1);
assert.equal(archiveTracker.events[0].event_type, "archive_item_observed");
assert.equal(archiveTracker.events[0].task_id, "new");
assert.equal(archiveTracker.events[0].source_snapshot_generation, 1);
changes.observeArchivePage(archiveTracker, archiveProject, archivePage([archiveRow("old")]), changesTime);
changes.observeArchivePage(archiveTracker, archiveProject, archivePage([archiveRow("new")]), changesTime);
assert.equal(archiveTracker.events.length, 1, "page shifts preserve observed identity deduplication");
const archiveBaseline = JSON.stringify(archiveTracker.archiveUnits);
for (const status of ["error", "cancelled", "loading"])
  changes.observeArchivePage(archiveTracker, archiveProject, { ...archivePage([]), status }, changesTime);
changes.observeArchivePage(archiveTracker, archiveProject,
  { ...archivePage([]), warnings: [{ code: "archive_permission" }] }, changesTime);
for (const invalid of [{ page: {} }, { page: 64 }, { pageSize: 100 }, { selectedMonth: "secret/path" }])
  changes.observeArchivePage(archiveTracker, archiveProject, { ...archivePage([]), ...invalid }, changesTime);
changes.observeArchivePage(archiveTracker, archiveProject,
  archivePage([{ ...archiveRow("unreadable"), available: false, error: "broken" }]), changesTime);
for (const malformed of [{ tasks: undefined }, { tasks: {} }, { tasks: [null] },
  { warnings: undefined }, { warnings: {} }])
  changes.observeArchivePage(archiveTracker, archiveProject, { ...archivePage([]), ...malformed }, changesTime);
assert.equal(JSON.stringify(archiveTracker.archiveUnits), archiveBaseline);
const incompleteArchiveTracker = changes.createTracker("incomplete-archive");
changes.observeArchivePage(incompleteArchiveTracker, archiveProject,
  { ...archivePage([]), tasks: undefined }, changesTime);
assert.equal(incompleteArchiveTracker.archiveUnits.length, 0,
  "incomplete metadata must not establish a false initial coverage baseline");
changes.observeArchivePage(incompleteArchiveTracker, archiveProject, archivePage([archiveRow("first")]), changesTime);
assert.equal(incompleteArchiveTracker.events.length, 0, "first complete archive coverage remains quiet");
changes.observeArchivePage(archiveTracker, archiveProject, archivePage([archiveRow("new")], 1), changesTime);
changes.observeArchivePage(archiveTracker, archiveProject, archivePage([archiveRow("new"), archiveRow("another")], 1), changesTime);
changes.observeArchivePage(archiveTracker, archiveProject, archivePage([archiveRow("another")]), changesTime);
assert.equal(archiveTracker.events.length, 2, "identity deduplication crosses retained coverage units");
for (let unit = 0; unit < 140; unit++)
  changes.observeArchivePage(archiveTracker, { id: `project-${unit}`, name: "bounded" },
    archivePage(Array.from({ length: 32 }, (_, row) => archiveRow(`row-${row}`))), changesTime);
assert.equal(archiveTracker.archiveUnits.length, 128);
assert.equal(archiveTracker.archiveUnits.reduce((total, unit) => total + unit.identities.length, 0), 4096);
const archiveEventCount = archiveTracker.events.length;
changes.observeArchivePage(archiveTracker, archiveProject, archivePage([archiveRow("evicted-unit-new")]), changesTime);
assert.equal(archiveTracker.events.length, archiveEventCount, "evicted coverage rebaselines quietly");
const archiveGrowth = changes.createTracker("archive-growth");
for (let batch = 0; batch < 140; batch++)
  changes.observeArchivePage(archiveGrowth, archiveProject,
    archivePage(Array.from({ length: 32 }, (_, row) => archiveRow(`batch-${batch}-${row}`))), changesTime);
assert.ok(archiveGrowth.archiveUnits.reduce((total, unit) => total + unit.identities.length, 0) <= 4096);
assert.equal(archiveGrowth.events.length, 200);

// Qualified equal IDs, prototype-like keys, invalid/duplicate identities, and
// bounded summaries must not collide or preserve raw task/session payloads.
const pathologicalTracker = changes.createTracker("pathological");
const pathological = changesSnapshot([changesInput("__proto__"), changesInput("constructor")]);
for (const project of pathological.projects) {
  project.tasks[0].id = "__proto__";
  project.tasks[0].title = "x".repeat(600);
  project.tasks[0].secret = "raw-payload-must-not-escape";
}
observeChanges(pathologicalTracker, pathological, 1);
const pathologicalChanged = changesClone(pathological);
for (const project of pathologicalChanged.projects)
  project.tasks[0].storedStatus = "completed";
const pathologicalEvents = observeChanges(pathologicalTracker, pathologicalChanged, 2);
assert.equal(pathologicalEvents.length, 2);
assert.equal(new Set(pathologicalEvents.map((event) => event.project_id)).size, 2);
assert.ok(pathologicalEvents.every((event) => event.task_title.length === 240));
assert.equal(JSON.stringify(pathologicalEvents).includes("raw-payload-must-not-escape"), false);
const duplicates = changesClone(pathologicalChanged);
duplicates.projects[0].tasks.push({ ...duplicates.projects[0].tasks[0], storedStatus: "conflicting" });
observeChanges(pathologicalTracker, duplicates, 3);
observeChanges(pathologicalTracker, pathologicalChanged, 4);
assert.equal(pathologicalTracker.events.length, 2, "ambiguous task IDs never replace reliable facts");
const duplicateProjects = changesClone(pathologicalChanged);
duplicateProjects.projects.push(changesClone(duplicateProjects.projects[0]));
duplicateProjects.projects.at(-1).errors = [{ code: "task_discovery_failed" }];
observeChanges(pathologicalTracker, duplicateProjects, 5);
observeChanges(pathologicalTracker, pathologicalChanged, 6);
assert.equal(pathologicalTracker.events.length, 2, "duplicate projects do not cause unavailability/recreation");
const invalidIdentities = changesClone(pathologicalChanged);
invalidIdentities.projects[0].tasks.push({ id: "x".repeat(1025), storedStatus: "completed" });
invalidIdentities.projects[0].sessions.push({ sessionKey: "bad\nkey", taskId: "__proto__", error: null });
observeChanges(pathologicalTracker, invalidIdentities, 7);
assert.equal(pathologicalTracker.events.length, 2, "invalid IDs do not become observations");
const prototypeSessions = changesClone(pathologicalChanged);
prototypeSessions.projects[0].sessions.push({ sessionKey: "constructor", taskId: "__proto__", error: null, stale: false });
observeChanges(pathologicalTracker, prototypeSessions, 8);
assert.ok(pathologicalTracker.events.some((event) => event.session_key === "constructor" && event.event_type === "session_attached"));

const ringTracker = changes.createTracker("ring");
observeChanges(ringTracker, initialChanges, 1);
for (let generation = 2; generation <= 120; generation++)
  observeChanges(ringTracker, changesSnapshot([changesInput("alpha",
    generation % 2 ? "planning" : "in_progress")]), generation);
assert.equal(ringTracker.events.length, 200);
assert.equal(new Set(ringTracker.events.map((event) => event.event_id)).size, 200);
assert.ok(ringTracker.events[0].source_snapshot_generation > 1);
const hugeSnapshot = changesSnapshot(Array.from({ length: 40 }, (_, i) => changesInput(`bounded-${i}`)));
for (const project of hugeSnapshot.projects) {
  project.tasks = Array.from({ length: 150 }, (_, i) => ({ id: `task-${i}`, title: "bounded",
    storedStatus: "planning", displayState: "active", activeSessionCount: 1, errors: [] }));
  project.sessions = Array.from({ length: 150 }, (_, i) => ({ sessionKey: `session-${i}`,
    taskId: `task-${i}`, error: null, stale: false }));
}
const boundedTracker = changes.createTracker("bounded");
observeChanges(boundedTracker, hugeSnapshot, 1);
assert.equal(boundedTracker.projects.length, 32);
assert.ok(boundedTracker.projects.every((project) => project.tasks.length <= 128 && project.sessions.length <= 128));
assert.ok(boundedTracker.health.length <= 33);
// Full baselines must compare surviving identities before retiring absent
// ones, even when the new identity sorts before every retained record.
for (const [dimension, newId] of ["projects", "tasks", "sessions"].flatMap((dimension) =>
  ["a-new", "zz-new"].map((newId) => [dimension, newId]))) {
  const tracker = changes.createTracker(`turnover-${dimension}-${newId}`);
  const cap = dimension === "projects" ? 32 : 128;
  const oldIds = Array.from({ length: cap }, (_, index) => `z-${String(index).padStart(3, "0")}`);
  function turnoverSnapshot(ids) {
    if (dimension === "projects")
      return changesSnapshot(ids.map((id) => changesInput(id)));
    const input = changesInput("turnover");
    if (dimension === "tasks") {
      input.taskRecords = ids.map((id) => ({ dirName: id, taskDir: `/changes/turnover/${id}`,
        value: { id, title: id, status: "planning" } }));
    } else {
      input.sessionRecords = ids.map((sessionKey) => ({ sessionKey, value: { current_task: "one" },
        resolution: { ok: true, taskDir: "/changes/turnover/one" } }));
    }
    return changesSnapshot([input]);
  }
  observeChanges(tracker, turnoverSnapshot(oldIds), 1);
  const next = turnoverSnapshot([newId, ...oldIds.slice(0, -1)]);
  if (dimension !== "sessions") {
    const project = dimension === "projects"
      ? next.projects.find((project) => project.id === oldIds[0]) : next.projects[0];
    const survivingTask = dimension === "projects" ? project.tasks[0]
      : project.tasks.find((task) => task.id === oldIds[0]);
    survivingTask.storedStatus = "in_progress";
    survivingTask.displayState = "in_progress";
    if (dimension === "projects") {
      project.tasks[1].errors = [{ code: "task_read_failed", projectId: oldIds[0] }];
      next.warnings.push({ code: "task_read_failed", projectId: oldIds[0] });
    }
  }
  const events = observeChanges(tracker, next, 2);
  const discoveryKind = dimension === "projects" ? "project_discovered"
    : dimension === "tasks" ? "task_discovered" : "session_attached";
  assert.equal(events.filter((event) => event.event_type === discoveryKind).length, 1,
    `${dimension}: capacity turnover must not rediscover surviving identities`);
  assert.equal(events.find((event) => event.event_type === discoveryKind)[
    dimension === "projects" ? "project_id" : dimension === "tasks" ? "task_id" : "session_key"
  ], newId);
  if (dimension !== "sessions") {
    assert.equal(events.filter((event) => event.event_type === "task_status_changed").length, 1,
      `${dimension}: a surviving identity still compares against its reliable prior status`);
    assert.deepEqual(events.find((event) => event.event_type === "task_status_changed").before,
      { status: "planning" });
  }
  if (dimension === "projects") {
    assert.equal(events.filter((event) => event.event_type === "health_degraded").length, 1,
      "Health at full capacity must retain surviving project comparisons");
    assert.equal(events.find((event) => event.event_type === "health_degraded").project_id, oldIds[0]);
  }
  if (dimension !== "tasks") {
    const absenceKind = dimension === "projects" ? "project_unavailable" : "session_detached";
    assert.equal(events.filter((event) => event.event_type === absenceKind).length, 1,
      `${dimension}: reliable absence must be observed before bounded retirement`);
    const absent = events.find((event) => event.event_type === absenceKind);
    assert.equal(absent[dimension === "projects" ? "project_id" : "session_key"], oldIds.at(-1));
    if (dimension === "sessions") {
      assert.equal(absent.task_id, "one");
      assert.deepEqual(absent.before, { attached: true });
      assert.deepEqual(absent.after, { attached: false });
    }
  }
  const count = tracker.events.length;
  observeChanges(tracker, next, 3);
  assert.equal(tracker.events.length, count, `${dimension}: repeated turnover facts stay quiet`);
  assert.ok(tracker.projects.length <= 32);
  assert.ok(tracker.projects.every((project) => project.tasks.length <= 128 && project.sessions.length <= 128));
}
const beforeScope = ringTracker.events.length;
changes.resetScope(ringTracker, "new-configured-root-scope");
observeChanges(ringTracker, changesSnapshot([changesInput("new-root")]), 121);
assert.equal(ringTracker.events.length, beforeScope, "configured root change creates a quiet scope baseline");
assert.deepEqual(observeChanges(changes.createTracker("reload"), changeBatch, 1), [], "reload starts quiet");
const provenSnapshot = changesClone(initialChanges);
provenSnapshot.runtime.observationEpoch = "epoch-a";
provenSnapshot.runtime.publicationGeneration = 7;
assert.equal(changes.makeHistoryProjection(changes.history(changeTracker), provenSnapshot).synchronized, true);
provenSnapshot.runtime.publicationGeneration = 8;
const skewedHistory = changes.makeHistoryProjection(changes.history(changeTracker), provenSnapshot);
assert.equal(skewedHistory.synchronized, false);
assert.equal(skewedHistory.events.length, changeTracker.events.length, "publication skew preserves coherent prior history");
assert.equal(changes.makeHistoryProjection(null, initialChanges).ready, false);
const publishedCopy = changes.history(changeTracker);
publishedCopy.events.length = 0;
assert.ok(changeTracker.events.length > 0, "published consumers cannot mutate the daemon's retained history");
const exercisedKinds = new Set([changeTracker, recoveryTracker, reassignmentTracker, archiveTracker]
  .flatMap((tracker) => changesClone(tracker.events).map((event) => event.event_type)));
assert.deepEqual([...exercisedKinds].sort(), Array.from(changes.EVENT_KINDS).sort(),
  "fixtures exercise every approved Recent Changes kind");
assert.equal(exercisedKinds.has("task_completed"), false);
assert.equal(exercisedKinds.has("task_deleted"), false);

const notificationLimits = notifications.limits();
assert.equal(notificationLimits.scopes, 33);
assert.equal(notificationLimits.cooldownMs, 5 * 60 * 1000);
function healthEvent(eventType, projectId = "alpha", projectName = "Project Alpha") {
  return { event_type: eventType, project_id: projectId, project_name: projectName };
}
const notificationInput = [healthEvent("health_degraded", "alpha", "Alpha\nProject")];
const notificationInputBefore = JSON.stringify(notificationInput);
let notificationResult = notifications.observe(notifications.createState(), [], true, 0);
assert.deepEqual(Array.from(notificationResult.requests), [], "initial notification observation is quiet");
const restartedNotification = notifications.observe(notifications.createState(),
  notificationInput, true, 500);
assert.deepEqual(Array.from(restartedNotification.requests), [],
  "restart baseline does not replay an existing incident");
notificationResult = notifications.observe(notificationResult.state,
  notificationInput, true, 1000);
assert.equal(notificationResult.requests.length, 1,
  "a healthy-to-degraded transition sends one notification");
assert.equal(notificationResult.requests[0].eventType, "health_degraded");
assert.equal(notificationResult.requests[0].projectName, "Alpha Project");
assert.equal(JSON.stringify(notificationInput), notificationInputBefore,
  "notification observation must not mutate event inputs");
const notificationAfterDegraded = notificationResult.state;
notificationResult = notifications.observe(notificationAfterDegraded,
  notificationInput, true, 2000);
assert.deepEqual(Array.from(notificationResult.requests), [], "continuous degradation is deduplicated");
notificationResult = notifications.observe(notificationResult.state,
  [healthEvent("health_recovered")], true, 3000);
assert.equal(notificationResult.requests.length, 1,
  "a degraded-to-recovered transition sends one notification");
notificationResult = notifications.observe(notificationResult.state,
  [healthEvent("health_recovered")], true, 4000);
assert.deepEqual(Array.from(notificationResult.requests), [], "continuous recovery is deduplicated");
notificationResult = notifications.observe(notificationResult.state,
  [healthEvent("health_degraded")], true, 5000);
assert.deepEqual(Array.from(notificationResult.requests), [], "same-kind cooldown suppresses a repeat");
assert.equal(notificationResult.state.scopes["project:alpha"].active, true,
  "suppressed transitions still advance the active baseline");
const reservedScopeState = notifications.observe(notifications.createState(), [], true, 0).state;
const reservedScope = notifications.observe(reservedScopeState,
  [healthEvent("health_degraded", "global")], true, 1000);
assert.equal(reservedScope.state.scopes["project:global"].active, true,
  "project IDs cannot collide with the global health scope");
const prototypeScope = notifications.observe(reservedScope.state,
  [healthEvent("health_degraded", "__proto__")], true, 1000);
assert.equal(prototypeScope.state.scopes["project:__proto__"].active, true,
  "prototype-like project IDs remain data-only scope keys");
const disabledNotification = notifications.observe(notifications.createState(),
  [healthEvent("health_degraded")], false, 0);
const reenabledNotification = notifications.observe(disabledNotification.state,
  [healthEvent("health_degraded")], true, notificationLimits.cooldownMs);
assert.deepEqual(Array.from(reenabledNotification.requests), [],
  "re-enabling notifications does not replay a disabled incident");
const boundedNotificationState = notifications.createState();
const boundedEvents = Array.from({ length: 80 }, (_, index) =>
  healthEvent("health_degraded", `bounded-${index}`, `Project ${index}`));
const boundedNotification = notifications.observe(boundedNotificationState,
  boundedEvents, true, 1);
assert.ok(Object.keys(boundedNotification.state.scopes).length <= notificationLimits.scopes,
  "notification scope state remains bounded");
assert.deepEqual(boundedNotificationState, notifications.createState(),
  "notification observation returns cloned state without mutating input state");

// Execute the daemon's actual publisher functions with the host transport
// replaced by bounded in-memory globals. This catches integration omissions
// that separately passing parser/comparator fixtures cannot detect.
const publicationRoot = {
  scanStartedAt: "", lastSuccessfulDiscoveryAt: "", snapshotIsCurrent: true,
  lastGoodFallbackActive: false, publicationGeneration: 0,
  observationEpoch: "publisher", changeTracker: changes.createTracker("publisher"),
  observationPreferences: { pinnedTaskId: "", selectedProjectId: "" }, pluginId: "trellisDms",
  pluginData: {}, notificationState: notifications.createState(),
  notificationsEnabled: false,
  _publishHealthNotifications: recent => { publicationGlobals.notifications = recent; }
};
const publicationGlobals = {};
publicationRoot.pluginService = {
  setGlobalVar: (_pluginId, key, value) => { publicationGlobals[key] = value; }
};
const publisherSandbox = {
  root: publicationRoot, TrellisParser: parser, TrellisProjection: projection, TrellisChanges: changes,
  Date: class extends Date { constructor() { super(changesTime); } },
  recentChangesVar: { set: (value) => { publicationGlobals.recentChanges = value; } }
};
vm.runInNewContext(sourceSection(daemonSource,
  "    function _publishSnapshot(inputs, warnings) {", "    function _rememberProjects(inputs) {"),
publisherSandbox);
publisherSandbox._publishSnapshot([changesInput()], []);
assert.equal(publicationGlobals.recentChanges.events.length, 0,
  "initial primary projection is quiet in the actual daemon publisher");
publisherSandbox._publishSnapshot([changesInput("alpha", "planning", ["one"])], []);
const publishedPrimaryChange = publicationGlobals.recentChanges.events.find((event) => event.event_type === "primary_changed");
assert.ok(publishedPrimaryChange, "Snapshot-driven primary selection changes must be observed centrally");
assert.equal(publishedPrimaryChange.source, "ui_selection");
assert.deepEqual(changesClone(publishedPrimaryChange.before), { project_id: "alpha", task_id: null });
assert.deepEqual(changesClone(publishedPrimaryChange.after), { project_id: "alpha", task_id: "one" });
assert.equal(publicationGlobals.snapshot.runtime.publicationGeneration, 2);
assert.equal(publicationGlobals.recentChanges.source_snapshot_generation, 2);
const beforeDuplicatePublication = publicationGlobals.recentChanges.events.length;
publisherSandbox._publishSnapshot([changesInput("alpha", "planning", ["one"])], []);
assert.equal(publicationGlobals.recentChanges.events.length, beforeDuplicatePublication);
publicationRoot.pluginService.loadPluginState = (_pluginId, key) => key === "pinnedTaskId"
  ? projection.makePinnedTaskToken("alpha", "two") : "";
publisherSandbox._observeSelectionPreferences();
assert.ok(publicationGlobals.recentChanges.events.some((event) => event.event_type === "pin_changed"));
assert.equal(publicationRoot.publicationGeneration, 3, "selection I/O does not publish or scan source facts");
const beforeNewScopePublication = publicationGlobals.recentChanges.events.length;
changes.resetScope(publicationRoot.changeTracker, "different-trusted-roots");
publisherSandbox._publishSnapshot([changesInput("new-project", "planning", ["one"])], []);
assert.equal(publicationGlobals.recentChanges.events.length, beforeNewScopePublication,
  "first primary and data observations of a changed root scope are quiet");
const deterministicTracker = changes.createTracker("epoch-a");
observeChanges(deterministicTracker, initialChanges, 1);
observeChanges(deterministicTracker, timestampNoise, 2);
observeChanges(deterministicTracker, timestampNoise, 3);
const reversedBatch = changesClone(changeBatch);
reversedBatch.projects.reverse();
for (const project of reversedBatch.projects) project.tasks.reverse();
assert.deepEqual(observeChanges(deterministicTracker, reversedBatch, 4), changeBatchEvents,
  "event order and IDs are deterministic across reordered qualified inputs");

// Integration shape checks complement fixtures; they do not establish DMS
// timing, focus, State persistence, reload, or rendered QML behavior.
assert.equal((daemonSource.match(/setGlobalVar\(root\.pluginId, "snapshot", snapshot\)/g) || []).length, 1);
assert.match(daemonSource, /property double publicationGeneration: 0/);
assert.match(daemonSource, /snapshot\.runtime\.observationEpoch = root\.observationEpoch/);
assert.match(daemonSource, /snapshot\.runtime\.publicationGeneration = root\.publicationGeneration/);
assert.match(daemonSource, /TrellisChanges\.observeSnapshot[\s\S]*?TrellisProjection\.makeHealthProjection\(snapshot\)/);
assert.match(daemonSource, /function onPluginStateChanged[\s\S]*?root\._observeSelectionPreferences/);
const selectionObserverSource = sourceSection(daemonSource,
  "    function _observeSelectionPreferences() {", "    function _rememberProjects(inputs) {");
assert.match(selectionObserverSource, /loadPluginState\(root\.pluginId, "pinnedTaskId", ""\)/);
assert.match(selectionObserverSource, /loadPluginState\(root\.pluginId, "selectedProjectId", ""\)/);
assert.doesNotMatch(selectionObserverSource, /startScan|savePluginData|savePluginState/);
const archiveObservationSource = sourceSection(daemonSource,
  "    function _finishArchivePageRow(context) {", "    function _loadArchivePageRow(context, candidate, slot) {");
assert.match(archiveObservationSource, /_isCurrentDetail\(context\.generation, context\.request\.requestId\)/);
assert.match(archiveObservationSource, /observeArchiveMetadata\(context\.project, response\)/);
assert.doesNotMatch(archiveObservationSource, /_queueDetailFile|_queueDetailProcess|watchChanges/);
assert.match(daemonSource, /TrellisChanges\.resetScope\(root\.changeTracker, JSON\.stringify\(normalized\.roots/);
assert.match(widgetSource, /varName: "recentChanges"/);
assert.match(widgetSource, /TrellisChanges\.makeHistoryProjection/);
assert.match(widgetSource, /"Recent Trellis Changes"/);
assert.match(widgetSource, /"UI selection"/);
assert.match(widgetSource, /id: historyBack[\s\S]*?buttonHeight: 40/);
assert.match(widgetSource, /id: recentChangesEntry[\s\S]*?buttonHeight: 40/);
assert.match(widgetSource, /model: root\.recentChangesMode \? root\.recentChangesProjection\.events : \[\]/);
assert.match(widgetSource, /activeFocusOnTab: root\.recentChangesMode/);
assert.match(widgetSource, /popoutFlickable\.revealControl\(this\)/);
assert.match(widgetSource, /border\.width: historyRow\.activeFocus \? 2 : 0/);
assert.match(widgetSource, /model: root\.detailMode \|\| root\.archiveMode \|\| root\.recentChangesMode/);
assert.equal((widgetSource.match(/DankFlickable\s*\{/g) || []).length, 1,
  "history shares the one existing vertical scroll surface");
const changesTranslations = JSON.parse(fs.readFileSync(path.join(repoRoot,
  "TrellisDms/translations/zh_CN.json"), "utf8"));
for (const label of new Set(Array.from(widgetSource.matchAll(
  /I18n\.trFor\("trellisDms", "([^"]+)"\)/g), (match) => match[1])))
  assert.ok(changesTranslations[label]?.[label], `missing history translation: ${label}`);

// Execute actual daemon search handlers/traversal with only host Process/FileView
// transport mocked. These fixtures are repository evidence, not a QML host load.
const searchClone = (value) => JSON.parse(JSON.stringify(value));
const searchInputs = [{ id: "__proto__", root: "/trusted/alpha", name: "Alpha" }];
function searchHarness(inputs = searchInputs) {
  const pending = [], commands = [], reads = [], observations = [], responses = [];
  const dirs = new Map(), files = new Map(), canonical = new Map(), sizes = new Map();
  const host = { currentInputs: searchClone(inputs), pluginData: { scanRoots: ["/trusted"] },
    maxScanRoots: 16, maxProjects: 32, maxAncestorCandidates: 8,
    maxArchiveMonths: 48, maxArchiveTaskDirectories: 2048, maxArchiveWarnings: 8,
    archiveLimits: paths.archiveLimits(), maxCommandBytes: 256 * 1024, maxJsonBytes: 1024 * 1024,
    changeTracker: changes.createTracker("search-harness"), maxSearchJsonPerBatch: 128, maxSearchListingsPerBatch: 16, maxSearchResults: 64,
    actionGeneration: 0, currentAction: null, pendingActionRequest: null, ownedActionProcesses: [], ownedActionReaders: [],
    searchGeneration: 0, currentSearchRequestId: "", searchSession: null,
    ownedSearchProcesses: [], ownedSearchReaders: [], searchCursorSerial: 0, publicationGeneration: 7 };
  dirs.set("/trusted", []);
  for (const project of inputs) {
    dirs.set(project.root, []); dirs.set(`${project.root}/.trellis`, []);
    dirs.set(paths.archiveRootPath(project.root), []);
  }
  const globals = { value: null };
  const sandbox = { root: host, TrellisPaths: paths, TrellisParser: parser, TrellisProjection: projection,
    TrellisChanges: changes, recentChangesVar: { set: () => {} }, TrellisDiscovery: discoveryPolicy, Qt: { callLater: (fn) => pending.push(fn) }, Math, JSON, Date,
    actionRequestVar: { value: null }, actionResponseVar: { set: () => {} },
    searchRequestVar: globals, searchResponseVar: { set: (value) => responses.push(searchClone(value)) },
    observeArchiveMetadata: (project, response) => observations.push(searchClone({ project, response })) };
  function transportObject(options, work) {
    const object = { ...options, destroyed: false, destroy() { this.destroyed = true; } };
    Object.defineProperty(object, "running", { set(value) { if (value) pending.push(() => work(object)); } });
    return object;
  }
  sandbox.processComponent = { createObject: (_parent, options) => transportObject(options, (object) => {
    if (object.destroyed) return;
    const command = options.command; commands.push([...command]);
    const pathArg = command.at(-1); let output = "", code = 0;
    if (command[0] === "realpath") {
      const resolved = canonical.has(pathArg) ? canonical.get(pathArg) : pathArg;
      if (resolved && (dirs.has(resolved) || files.has(resolved))) output = resolved + "\n";
      else code = 1;
    } else if (command[0] === "find") {
      if (dirs.has(command[1])) output = dirs.get(command[1]).join("\n"); else code = 1;
    } else if (command[0] === "test") {
      code = (command[1] === "-d" ? dirs.has(pathArg) : files.has(pathArg)) ? 0 : 1;
    } else if (command[0] === "stat") {
      output = String(sizes.has(pathArg) ? sizes.get(pathArg) : Buffer.byteLength(files.get(pathArg) || ""));
    } else assert.fail(`unexpected search command ${command[0]}`);
    options.callback(output, code);
  }) };
  sandbox.detailFileViewComponent = { createObject: (_parent, options) => {
    const object = transportObject(options, () => {});
    pending.push(() => {
      if (object.destroyed) return;
      reads.push(options.path);
      const text = files.get(options.path) || "";
      options.callback(text, Buffer.byteLength(text) > options.byteLimit ? "archive_task_size_limit" : null);
    });
    return object;
  } };
  vm.runInNewContext(sourceSection(daemonSource, "    function _cloneValue(value) {", "    function _allowWarning(warning) {"), sandbox);
  vm.runInNewContext(sourceSection(daemonSource, "    function _archiveWarning(context, code, message) {", "    function _archiveResponse("), sandbox);
  vm.runInNewContext(sourceSection(daemonSource, "    function _boundedArchiveString(value, fallback, maximum) {", "    function _archiveRowError("), sandbox);
  vm.runInNewContext(sourceSection(daemonSource, "    function _projectAuthorizedByRoots(", "    function _detailScopeCurrent() {"), sandbox);
  vm.runInNewContext(sourceSection(daemonSource, "    function observeArchiveMetadata(", "    function _loadArchivePageRow("), sandbox);
  const actualArchiveObserver = sandbox.observeArchiveMetadata;
  sandbox.observeArchiveMetadata = (project, response) => {
    observations.push(searchClone({ project, response }));
    actualArchiveObserver(project, response);
  };
  vm.runInNewContext(sourceSection(daemonSource, "    function _configuredRoots() {", "    function _untrack("), sandbox);
  let serial = 0;
  const api = { host, sandbox, dirs, files, canonical, sizes, commands, reads, observations, responses, pending,
    request(query, cursor = "") {
      globals.value = { requestId: `widget-${++serial}`, kind: "archive-search", query, cursor };
      sandbox._handleSearchRequest(globals.value); return globals.value;
    }, flush() {
      let count = 0;
      while (pending.length) { assert.ok(++count < 100000, "bounded search must settle"); pending.shift()(); }
      return responses.at(-1);
    }, cancel() { globals.value = null; sandbox._handleSearchRequest(null); },
    month(month, count, title = "Needle", project = inputs[0]) {
      const root = paths.archiveRootPath(project.root), dir = `${root}/${month}`;
      dirs.get(root).push(dir); dirs.set(dir, []);
      for (let i = 0; i < count; i++) {
        const task = `${dir}/task-${String(i).padStart(4, "0")}`;
        dirs.get(dir).push(task); dirs.set(task, []);
        files.set(`${task}/task.json`, JSON.stringify({ id: "shared-id", title: `${title} ${i}`, status: "completed" }));
      }
      return dir;
    }
  };
  return api;
}
const searchFixtureSnapshot = changesSnapshot([
  { ...changesInput("alpha"), name: "ALPHA", taskRecords: [
    { dirName: "one", value: { id: "shared", title: "Needle", status: "planning" } },
    { dirName: "two", value: { id: "ID-MATCH", title: "Something", status: "planning" } }] },
  { ...changesInput("beta"), name: "Beta", taskRecords: [
    { dirName: "one", value: { id: "shared", title: "Needle", status: "planning" } }] }
]);
const searchSnapshotBefore = JSON.stringify(searchFixtureSnapshot);
assert.equal(projection.makeSearchProjection(searchFixtureSnapshot, "nEeDlE", "all").live.length, 2);
assert.deepEqual(searchClone(projection.makeSearchProjection(searchFixtureSnapshot, "shared", "live").live.map(row => row.projectId)), ["alpha", "beta"]);
assert.equal(projection.makeSearchProjection(searchFixtureSnapshot, "id-match", "live").live[0].taskId, "ID-MATCH");
assert.equal(projection.makeSearchProjection(searchFixtureSnapshot, "alpha", "all").live.length, 3,
  "project names match project rows and their metadata tasks globally");
assert.equal(projection.makeSearchProjection(searchFixtureSnapshot, "needle", "archive").live.length, 0);
assert.equal(projection.makeSearchProjection(searchFixtureSnapshot, " \t ", "all").active, false);
assert.equal(projection.normalizeSearchQuery("x".repeat(300)).length, 256);
const largeSearchSnapshot = searchClone(searchFixtureSnapshot);
largeSearchSnapshot.projects[0].tasks = Array.from({ length: 128 }, (_, i) => ({ id: `unique-${i}`, title: "Needle" }));
assert.equal(projection.makeSearchProjection(largeSearchSnapshot, "needle", "all").live.length, 64);
assert.equal(projection.makeSearchProjection(largeSearchSnapshot, "needle", "all").liveOverflow, 65);
const duplicateSearchSnapshot = searchClone(searchFixtureSnapshot);
duplicateSearchSnapshot.projects[0].tasks.push({ ...duplicateSearchSnapshot.projects[0].tasks[0] });
assert.equal(projection.makeSearchProjection(duplicateSearchSnapshot, "needle", "live").live.length, 1,
  "ambiguous live identities are excluded, not silently selected");
assert.equal(JSON.stringify(searchFixtureSnapshot), searchSnapshotBefore);
for (const bad of [{ query: "x".repeat(257) }, { query: "x\n" }, { cursor: "../path" }, { path: "/unsafe" }, { kind: "markdown" }])
  assert.equal(paths.validateSearchRequest({ requestId: "search", kind: "archive-search", query: "q", ...bad }).ok, false);
const blankSearch = searchHarness(); blankSearch.request("   ");
assert.equal(blankSearch.flush().status, "empty");
assert.equal(blankSearch.commands.length + blankSearch.reads.length, 0, "blank query performs zero archive I/O");
const pagedSearch = searchHarness(); pagedSearch.month("2026-10", 300, "Other");
pagedSearch.request("missing"); let batch = pagedSearch.flush();
assert.equal(batch.batchExamined, 128); assert.equal(batch.examinedCount, 128);
assert.equal(batch.hasMore, true); assert.equal(batch.partial, true); assert.equal(batch.results.length, 0);
assert.equal(pagedSearch.observations.length, 4);
assert.equal(pagedSearch.observations[0].response.tasks.length, 32,
  "observer gets complete nonmatching pages, not the empty search subset");
const firstCursor = batch.cursor; pagedSearch.request("missing", batch.cursor); batch = pagedSearch.flush();
assert.equal(batch.examinedCount, 256); assert.notEqual(batch.cursor, firstCursor);
pagedSearch.request("missing", batch.cursor); batch = pagedSearch.flush();
assert.equal(batch.examinedCount, 300); assert.equal(batch.hasMore, false); assert.equal(batch.partial, false);
assert.ok(pagedSearch.reads.every(file => file.endsWith("/task.json")), "search never reads Markdown");
assert.equal(pagedSearch.reads.length, new Set(pagedSearch.reads).size, "continuation advances without rereading rows");
pagedSearch.request("missing", firstCursor); assert.equal(pagedSearch.flush().status, "error");
const mixedPageSearch = searchHarness();
mixedPageSearch.month("2026-11", 1, "Other");
mixedPageSearch.month("2026-10", 256, "Other");
mixedPageSearch.request("missing"); batch = mixedPageSearch.flush();
assert.ok(batch.batchExamined <= 128, "a short page in one month must not let the next month exceed the JSON batch cap");
let mixedContinuations = 0;
while (batch.hasMore) {
  assert.ok(++mixedContinuations <= 3, "mixed month page sizes must make deterministic cursor progress");
  mixedPageSearch.request("missing", batch.cursor); batch = mixedPageSearch.flush();
  assert.ok(batch.batchExamined <= 128);
}
assert.equal(batch.examinedCount, 257);
assert.equal(batch.partial, false);
assert.equal(mixedPageSearch.reads.length, new Set(mixedPageSearch.reads).size);
assert.equal(mixedPageSearch.observations.length, 9, "only complete short/full pages enter Recent Changes across batch boundaries");
const emptyMonthSearch = searchHarness();
for (let month = 1; month <= 20; month++) emptyMonthSearch.month(`2025-${String((month - 1) % 12 + 1).padStart(2, "0")}`.replace("2025", month > 12 ? "2026" : "2025"), 0);
emptyMonthSearch.request("missing"); batch = emptyMonthSearch.flush();
assert.equal(batch.batchListings, 16); assert.equal(batch.batchExamined, 0); assert.equal(batch.hasMore, true);
assert.equal(emptyMonthSearch.observations.length, 15, "empty months consume listing budget and produce complete empty pages");
emptyMonthSearch.request("missing", batch.cursor); batch = emptyMonthSearch.flush(); assert.equal(batch.hasMore, false);
const cappedSearch = searchHarness(); cappedSearch.month("2026-10", 100, "Needle"); cappedSearch.request("needle"); batch = cappedSearch.flush();
assert.equal(batch.results.length, 64); assert.equal(batch.hasMore, false); assert.equal(batch.cursor, ""); assert.equal(batch.truncated, true);
assert.equal(batch.batchExamined, 64); assert.equal(cappedSearch.observations.length, 2);
const directoryCapSearch = searchHarness(); directoryCapSearch.month("2026-10", 2060, "Other"); directoryCapSearch.request("missing"); batch = directoryCapSearch.flush();
let continuations = 0;
while (batch.hasMore) { assert.ok(++continuations <= 16); directoryCapSearch.request("missing", batch.cursor); batch = directoryCapSearch.flush(); }
assert.equal(batch.examinedCount, 2048); assert.equal(batch.truncated, true); assert.equal(batch.partial, true);
assert.equal(directoryCapSearch.observations.length, 0, "capped listings cannot establish complete observation pages");
const malformedSearch = searchHarness(); const malformedMonth = malformedSearch.month("2026-10", 5, "Needle");
const malformedEntries = malformedSearch.dirs.get(malformedMonth);
malformedSearch.files.set(`${malformedEntries[0]}/task.json`, "{");
malformedSearch.sizes.set(`${malformedEntries[1]}/task.json`, 1024 * 1024 + 1);
malformedSearch.canonical.set(malformedEntries[2], "/outside/task"); malformedSearch.dirs.set("/outside/task", []);
malformedSearch.canonical.set(`${malformedEntries[3]}/task.json`, "/outside/task.json"); malformedSearch.files.set("/outside/task.json", "{}");
malformedSearch.request("needle"); batch = malformedSearch.flush();
assert.equal(batch.results.length, 1); assert.equal(batch.partial, true); assert.equal(batch.hasMore, false);
assert.equal(malformedSearch.observations.length, 0, "failed pages do not feed observations");
assert.ok(!malformedSearch.reads.includes("/outside/task.json"));
assert.ok(!malformedSearch.reads.includes(`${malformedEntries[1]}/task.json`), "oversized JSON is rejected before FileView");
const cancelSearch = searchHarness(); cancelSearch.month("2026-10", 20); cancelSearch.request("needle"); cancelSearch.cancel(); cancelSearch.flush();
assert.equal(cancelSearch.reads.length, 0); assert.equal(cancelSearch.responses.at(-1), null); assert.equal(cancelSearch.host.searchSession, null);
const changedRootsSearch = searchHarness(); changedRootsSearch.month("2026-10", 150); changedRootsSearch.request("missing"); batch = changedRootsSearch.flush();
changedRootsSearch.host.pluginData.scanRoots = [];
changedRootsSearch.request("missing", batch.cursor); assert.equal(changedRootsSearch.flush().status, "error");
const midReadRootSearch = searchHarness(); midReadRootSearch.month("2026-10", 1); midReadRootSearch.request("needle");
midReadRootSearch.host.pluginData.scanRoots = []; assert.equal(midReadRootSearch.flush().status, "error"); assert.equal(midReadRootSearch.reads.length, 0);
const supersededSearch = searchHarness(); supersededSearch.month("2026-10", 5); supersededSearch.request("needle"); const newer = supersededSearch.request("other"); batch = supersededSearch.flush();
assert.equal(batch.requestId, newer.requestId); assert.equal(batch.results.length, 0);
assert.ok(supersededSearch.responses.every(response => response.requestId === newer.requestId), "old owner cannot publish after supersession");
const staleProjectsSearch = searchHarness(); staleProjectsSearch.month("2026-10", 2); staleProjectsSearch.request("needle");
staleProjectsSearch.host.currentInputs = []; assert.equal(staleProjectsSearch.flush().status, "error");
assert.equal(staleProjectsSearch.reads.length, 0);
const untrustedSearch = searchHarness([{ id: "escape", name: "Escape", root: "/outside" }]); untrustedSearch.month("2026-10", 1); untrustedSearch.request("needle");
assert.equal(untrustedSearch.flush().results.length, 0); assert.equal(untrustedSearch.reads.length, 0);
const duplicateProjectsSearch = searchHarness([searchInputs[0], searchInputs[0]]); duplicateProjectsSearch.request("q");
assert.equal(duplicateProjectsSearch.flush().examinedCount, 0);
const bridgeSearch = searchHarness(); const bridgeMonth = bridgeSearch.month("2026-10", 10, "Other");
bridgeSearch.request("missing"); bridgeSearch.flush();
assert.equal(changes.history(bridgeSearch.host.changeTracker).events.length, 0,
  "the actual archive observer bridge quietly baselines complete nonmatching metadata pages");
const bridgeNewTask = `${bridgeMonth}/task-9999`;
bridgeSearch.dirs.get(bridgeMonth).push(bridgeNewTask); bridgeSearch.dirs.set(bridgeNewTask, []);
bridgeSearch.files.set(`${bridgeNewTask}/task.json`, JSON.stringify({ id: "new-task", title: "Other", status: "completed" }));
bridgeSearch.request("missing"); bridgeSearch.flush();
assert.equal(changes.history(bridgeSearch.host.changeTracker).events.filter(event => event.event_type === "archive_item_observed").length, 1,
  "a later complete search page feeds newly observed metadata through the real Recent Changes bridge");
const incompleteBridgeSearch = searchHarness();
const incompleteBridgeMonth = incompleteBridgeSearch.month("2026-10", 2, "Other");
incompleteBridgeSearch.request("missing"); incompleteBridgeSearch.flush();
const bridgeCoverageBefore = JSON.stringify(incompleteBridgeSearch.host.changeTracker.archiveUnits);
const delayedArchiveTask = `${incompleteBridgeMonth}/task-9999`;
incompleteBridgeSearch.dirs.get(incompleteBridgeMonth).push(delayedArchiveTask, `${incompleteBridgeMonth}/bad\u0001line`);
incompleteBridgeSearch.dirs.set(delayedArchiveTask, []);
incompleteBridgeSearch.files.set(`${delayedArchiveTask}/task.json`, JSON.stringify({ id: "delayed-new", title: "Other" }));
incompleteBridgeSearch.request("missing"); batch = incompleteBridgeSearch.flush();
assert.equal(batch.partial, true);
assert.equal(JSON.stringify(incompleteBridgeSearch.host.changeTracker.archiveUnits), bridgeCoverageBefore,
  "month-level malformed listing warnings must not become a complete page with empty warnings");
assert.equal(changes.history(incompleteBridgeSearch.host.changeTracker).events.length, 0);
incompleteBridgeSearch.dirs.get(incompleteBridgeMonth).pop();
incompleteBridgeSearch.request("missing"); incompleteBridgeSearch.flush();
assert.equal(changes.history(incompleteBridgeSearch.host.changeTracker).events.filter(event => event.event_type === "archive_item_observed").length, 1,
  "recovered complete page compares with the retained coverage rather than an incomplete baseline");
const monthCapSearch = searchHarness();
for (let i = 0; i < 50; i++) monthCapSearch.month(`${2020 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, "0")}`, 0);
monthCapSearch.request("missing"); batch = monthCapSearch.flush(); continuations = 0;
while (batch.hasMore) { assert.ok(++continuations <= 4); monthCapSearch.request("missing", batch.cursor); batch = monthCapSearch.flush(); }
assert.equal(monthCapSearch.observations.length, 48); assert.equal(batch.truncated, true); assert.equal(batch.partial, true);
assert.equal(batch.hasMore, false, "48-month cap terminates instead of repeating a capped month");
const warningCapSearch = searchHarness(); const warningMonth = warningCapSearch.month("2026-10", 20);
for (const dir of warningCapSearch.dirs.get(warningMonth)) warningCapSearch.files.set(`${dir}/task.json`, "{");
warningCapSearch.request("needle"); batch = warningCapSearch.flush(); assert.equal(batch.warnings.length, 8);
const nonDirectorySearch = searchHarness();
const fileMonth = `${paths.archiveRootPath(searchInputs[0].root)}/2026-10`;
nonDirectorySearch.dirs.get(paths.archiveRootPath(searchInputs[0].root)).push(fileMonth);
nonDirectorySearch.files.set(fileMonth, "not a directory"); nonDirectorySearch.request("needle"); batch = nonDirectorySearch.flush();
assert.equal(batch.partial, true); assert.equal(nonDirectorySearch.observations.length, 0);
const malformedMonthSearch = searchHarness();
malformedMonthSearch.dirs.get(paths.archiveRootPath(searchInputs[0].root)).push("/outside/2026-10", `${paths.archiveRootPath(searchInputs[0].root)}/bad-month`);
malformedMonthSearch.request("needle"); batch = malformedMonthSearch.flush(); assert.equal(batch.partial, true); assert.equal(malformedMonthSearch.reads.length, 0);
const outputCapSearch = searchHarness(); const outputMonth = outputCapSearch.month("2026-10", 1);
outputCapSearch.host.maxCommandBytes = outputMonth.length + 2;
outputCapSearch.dirs.get(paths.archiveRootPath(searchInputs[0].root)).push("x".repeat(200));
outputCapSearch.request("needle"); batch = outputCapSearch.flush(); assert.equal(batch.truncated, true); assert.equal(batch.partial, true);
const retargetRootSearch = searchHarness(); retargetRootSearch.month("2026-10", 150, "Other"); retargetRootSearch.request("missing"); batch = retargetRootSearch.flush();
retargetRootSearch.canonical.set("/trusted", "/retargeted"); retargetRootSearch.dirs.set("/retargeted", []);
retargetRootSearch.request("missing", batch.cursor); batch = retargetRootSearch.flush(); assert.equal(batch.status, "error"); assert.equal(retargetRootSearch.reads.length, 128);
const retargetProjectSearch = searchHarness(); retargetProjectSearch.month("2026-10", 150, "Other"); retargetProjectSearch.request("missing"); batch = retargetProjectSearch.flush();
retargetProjectSearch.canonical.set(searchInputs[0].root, "/outside/project"); retargetProjectSearch.dirs.set("/outside/project", []);
retargetProjectSearch.request("missing", batch.cursor); batch = retargetProjectSearch.flush();
assert.equal(batch.partial, true); assert.equal(batch.hasMore, false); assert.equal(retargetProjectSearch.reads.length, 128);
const cancelFileSearch = searchHarness(); cancelFileSearch.month("2026-10", 1); cancelFileSearch.request("needle");
while (!cancelFileSearch.host.ownedSearchReaders.length) { assert.ok(cancelFileSearch.pending.length); cancelFileSearch.pending.shift()(); }
cancelFileSearch.cancel(); cancelFileSearch.flush(); assert.equal(cancelFileSearch.reads.length, 0); assert.equal(cancelFileSearch.observations.length, 0);
assert.equal(cancelFileSearch.host.ownedSearchProcesses.length + cancelFileSearch.host.ownedSearchReaders.length, 0);
const protoTaskSearchSnapshot = searchClone(searchFixtureSnapshot);
protoTaskSearchSnapshot.projects[0].tasks = [{ id: "__proto__", title: "Needle" }];
assert.equal(projection.makeSearchProjection(protoTaskSearchSnapshot, "__proto__", "live").live[0].taskId, "__proto__");
const duplicateProjectSearchSnapshot = searchClone(searchFixtureSnapshot);
duplicateProjectSearchSnapshot.projects.push(searchClone(duplicateProjectSearchSnapshot.projects[0]));
assert.equal(projection.makeSearchProjection(duplicateProjectSearchSnapshot, "needle", "live").live.length, 1);

function detailAuthorityHarness() {
  const api = searchHarness(); const host = api.host, sandbox = api.sandbox, responses = [];
  Object.assign(host, { detailGeneration: 0, currentDetailRequestId: "", currentDetailRequest: null,
    currentDetailRootsKey: "", currentDetailProjectRoot: "", ownedDetailProcesses: [], ownedDetailReaders: [],
    maxMarkdownBytes: paths.markdownByteLimit() });
  sandbox.detailResponseVar = { set: (response) => responses.push(searchClone(response)) };
  vm.runInNewContext(sourceSection(daemonSource, "    function _isCurrentDetail(", "    function _cloneValue("), sandbox);
  vm.runInNewContext(sourceSection(daemonSource, "    function _cancelDetailRead(", "    function _configuredRoots() {"), sandbox);
  const project = host.currentInputs[0], taskDir = `${project.root}/.trellis/tasks/live-one`;
  project.taskRecords = [{ dirName: "live-one", taskDir, value: { id: "shared-id", title: "Needle" } }];
  api.dirs.set(taskDir, []); api.files.set(`${taskDir}/prd.md`, "Safe Markdown");
  api.detailResponses = responses;
  api.open = (archive = false) => sandbox._handleDetailRequest(archive
    ? { requestId: "archive-detail-authority", kind: "archive-task", projectId: project.id,
        taskId: "shared-id", month: "2026-10", dirName: "task-0000", document: "prd.md" }
    : { requestId: "live-detail-authority", kind: "markdown", projectId: project.id, taskId: "shared-id", document: "prd.md" });
  return api;
}
const acceptedDetail = detailAuthorityHarness(); const acceptedDetailInputsBefore = JSON.stringify(acceptedDetail.host.currentInputs);
acceptedDetail.open(); acceptedDetail.flush(); assert.equal(acceptedDetail.detailResponses.at(-1).status, "ready");
assert.equal(acceptedDetail.detailResponses.at(-1).content, "Safe Markdown");
assert.equal(JSON.stringify(acceptedDetail.host.currentInputs), acceptedDetailInputsBefore);
const removedRootDetail = detailAuthorityHarness(); removedRootDetail.host.pluginData.scanRoots = [];
removedRootDetail.open(); removedRootDetail.flush(); assert.equal(removedRootDetail.detailResponses.at(-1).status, "error");
assert.equal(removedRootDetail.commands.length + removedRootDetail.reads.length, 0,
  "retained Snapshot/input identity never authorizes detail after all roots are removed");
const redirectedRootDetail = detailAuthorityHarness(); redirectedRootDetail.canonical.set("/trusted", "/retargeted"); redirectedRootDetail.dirs.set("/retargeted", []);
redirectedRootDetail.open(); redirectedRootDetail.flush(); assert.equal(redirectedRootDetail.detailResponses.at(-1).status, "error");
assert.equal(redirectedRootDetail.reads.length, 0);
const removedWhileAuthorizing = detailAuthorityHarness(); removedWhileAuthorizing.open(); removedWhileAuthorizing.pending.shift()();
removedWhileAuthorizing.host.pluginData.scanRoots = []; removedWhileAuthorizing.flush();
assert.equal(removedWhileAuthorizing.detailResponses.at(-1).status, "error"); assert.equal(removedWhileAuthorizing.reads.length, 0);
const removedWhileReading = detailAuthorityHarness(); removedWhileReading.open();
while (!removedWhileReading.host.ownedDetailReaders.length) { assert.ok(removedWhileReading.pending.length); removedWhileReading.pending.shift()(); }
removedWhileReading.host.pluginData.scanRoots = []; removedWhileReading.flush();
assert.equal(removedWhileReading.detailResponses.at(-1).status, "error"); assert.ok(!removedWhileReading.detailResponses.some(reply => reply.status === "ready"));
assert.equal(removedWhileReading.host.currentDetailRequestId, "");
const redirectedProjectDetail = detailAuthorityHarness(); redirectedProjectDetail.canonical.set(searchInputs[0].root, "/outside/project"); redirectedProjectDetail.dirs.set("/outside/project", []);
redirectedProjectDetail.open(); redirectedProjectDetail.flush(); assert.equal(redirectedProjectDetail.detailResponses.at(-1).status, "error"); assert.equal(redirectedProjectDetail.reads.length, 0);
const duplicateLiveDetail = detailAuthorityHarness(); duplicateLiveDetail.host.currentInputs[0].taskRecords.push(searchClone(duplicateLiveDetail.host.currentInputs[0].taskRecords[0]));
duplicateLiveDetail.open(); duplicateLiveDetail.flush(); assert.equal(duplicateLiveDetail.detailResponses.at(-1).status, "error"); assert.equal(duplicateLiveDetail.reads.length, 0);
const archivedAuthorityDetail = detailAuthorityHarness(); const archivedAuthorityMonth = archivedAuthorityDetail.month("2026-10", 1);
archivedAuthorityDetail.files.set(`${archivedAuthorityMonth}/task-0000/prd.md`, "Archive Markdown");
archivedAuthorityDetail.open(true); archivedAuthorityDetail.flush(); assert.equal(archivedAuthorityDetail.detailResponses.at(-1).content, "Archive Markdown");
archivedAuthorityDetail.host.pluginData.scanRoots = []; const archiveAuthorityReadsBefore = archivedAuthorityDetail.reads.length;
archivedAuthorityDetail.open(true); archivedAuthorityDetail.flush(); assert.equal(archivedAuthorityDetail.detailResponses.at(-1).status, "error"); assert.equal(archivedAuthorityDetail.reads.length, archiveAuthorityReadsBefore);
const settingsCancelledDetail = detailAuthorityHarness();
settingsCancelledDetail.host.topologyIntervalDefault = 60;
settingsCancelledDetail.sandbox.TrellisWatch = watch;
settingsCancelledDetail.sandbox.topologyTimer = { running: false };
settingsCancelledDetail.sandbox.settingsRefreshTimer = { restarted: false, restart() { this.restarted = true; } };
vm.runInNewContext(sourceSection(daemonSource, "    function _topologySettingsSnapshot(", "    function startScan(reason) {"), settingsCancelledDetail.sandbox);
settingsCancelledDetail.host._topologySettingsSnapshot = settingsCancelledDetail.sandbox._topologySettingsSnapshot;
settingsCancelledDetail.host.observedTopologySettings = settingsCancelledDetail.sandbox._topologySettingsSnapshot(settingsCancelledDetail.host.pluginData);
settingsCancelledDetail.open();
while (!settingsCancelledDetail.host.ownedDetailReaders.length) { assert.ok(settingsCancelledDetail.pending.length); settingsCancelledDetail.pending.shift()(); }
settingsCancelledDetail.host.pluginData.scanRoots = [];
settingsCancelledDetail.sandbox._observePluginSettingsChange();
assert.equal(settingsCancelledDetail.host.ownedDetailProcesses.length + settingsCancelledDetail.host.ownedDetailReaders.length, 0,
  "settings root change destroys owned detail readers/processes immediately");
settingsCancelledDetail.flush();
assert.equal(settingsCancelledDetail.detailResponses.at(-1).status, "error");
assert.equal(settingsCancelledDetail.reads.length, 0, "cancelled old FileView cannot complete or update a detail view");
assert.equal(settingsCancelledDetail.sandbox.settingsRefreshTimer.restarted, true);
const detailSurvivesSearchCancel = detailAuthorityHarness();
detailSurvivesSearchCancel.month("2026-10", 1);
detailSurvivesSearchCancel.open();
while (!detailSurvivesSearchCancel.host.ownedDetailReaders.length) {
  assert.ok(detailSurvivesSearchCancel.pending.length); detailSurvivesSearchCancel.pending.shift()();
}
const independentDetailGeneration = detailSurvivesSearchCancel.host.detailGeneration;
detailSurvivesSearchCancel.request("needle"); detailSurvivesSearchCancel.cancel();
assert.equal(detailSurvivesSearchCancel.host.detailGeneration, independentDetailGeneration);
assert.equal(detailSurvivesSearchCancel.host.ownedDetailReaders.length, 1);
detailSurvivesSearchCancel.flush();
assert.equal(detailSurvivesSearchCancel.detailResponses.at(-1).content, "Safe Markdown",
  "search cancellation must not cancel the independent detail reader");
const searchSurvivesDetailCancel = detailAuthorityHarness(); searchSurvivesDetailCancel.month("2026-10", 1);
searchSurvivesDetailCancel.request("needle");
while (!searchSurvivesDetailCancel.host.ownedSearchReaders.length) {
  assert.ok(searchSurvivesDetailCancel.pending.length); searchSurvivesDetailCancel.pending.shift()();
}
const independentSearchGeneration = searchSurvivesDetailCancel.host.searchGeneration;
searchSurvivesDetailCancel.open(); searchSurvivesDetailCancel.sandbox._cancelDetailRead(false);
assert.equal(searchSurvivesDetailCancel.host.searchGeneration, independentSearchGeneration);
assert.equal(searchSurvivesDetailCancel.host.ownedSearchReaders.length, 1);
assert.equal(searchSurvivesDetailCancel.flush().results.length, 1,
  "detail cancellation must not cancel independent metadata search");
console.log("global search caps and fresh-detail-authority fixtures: ok");

console.log("global search actual-daemon lifecycle fixtures: ok");

// Widget lifecycle functions run against shared in-memory transport, including
// ownership convergence. QML focus/layout remain separate host checks.
function searchWidgetHarness(shared = { value: null }, instance = "search-widget-a") {
  shared.listeners ||= [];
  shared.set ||= function (value) { this.value = value; for (const listener of this.listeners) listener(); };
  const response = { value: null }, detailRequests = [], projectSelections = [];
  const host = { searchMode: true, searchQuery: "needle", searchScope: "all", snapshot: searchClone(searchFixtureSnapshot),
    searchInstanceId: instance, searchRequestSerial: 0, searchRequestId: "", searchStatus: "idle",
    searchArchiveResults: [], searchCursor: "", searchHasMore: false, searchPartial: false,
    searchTruncated: false, searchExamined: 0, searchWarnings: [], detailMode: false,
    detailFromSearch: false, detailRequestSerial: 0, detailArchive: false,
    selectedProjectId: "beta", pinnedTaskId: projection.makePinnedTaskToken("beta", "shared"),
    selectProject: (id) => projectSelections.push(id) };
  Object.defineProperty(host, "searchProjection", { get() { return projection.makeSearchProjection(host.snapshot, host.searchQuery, host.searchScope); } });
  const timer = { running: false, stop() { this.running = false; }, restart() { this.running = true; } };
  const sandbox = { root: host, TrellisProjection: projection, searchDebounceTimer: timer,
    searchRequestVar: shared, searchResponseVar: response,
    detailRequestVar: { set: (value) => detailRequests.push(searchClone(value)) }, Date, Math, JSON };
  host.cancelAction = () => {};
  const functions = sourceSection(widgetSource, "    function cancelSearch(preserveResults) {", "    function observeDetailResponse() {");
  vm.runInNewContext(functions, sandbox);
  for (const match of functions.matchAll(/function (\w+)\(/g)) host[match[1]] = sandbox[match[1]];
  shared.listeners.push(() => host.observeSearchOwnership());
  return { host, sandbox, shared, timer, response, detailRequests, projectSelections,
    deliver(value) { response.value = searchClone(value); host.observeSearchResponse(); } };
}
const widgetSearch = searchWidgetHarness();
const pinnedSearchBefore = widgetSearch.host.pinnedTaskId, selectedSearchBefore = widgetSearch.host.selectedProjectId;
widgetSearch.host.updateSearch(); assert.equal(widgetSearch.timer.running, true);
assert.equal(widgetSearch.shared.value, null, "debounced typing starts no immediate archive I/O");
widgetSearch.host.requestSearch(false); const widgetSearchId = widgetSearch.host.searchRequestId;
assert.equal(widgetSearch.host.pinnedTaskId, pinnedSearchBefore); assert.equal(widgetSearch.host.selectedProjectId, selectedSearchBefore);
const widgetArchiveRow = { kind: "archive", projectId: "alpha", projectName: "Alpha", taskId: "shared-id",
  title: "Needle archive", month: "2026-10", dirName: "task-one" };
const widgetArchiveReply = { requestId: widgetSearchId, kind: "archive-search", query: "needle", status: "ready",
  results: [widgetArchiveRow], partial: true, hasMore: true, cursor: "s-1-opaque",
  examinedCount: 128, warnings: [], truncated: false };
widgetSearch.deliver(widgetArchiveReply); assert.equal(widgetSearch.host.searchHasMore, true);
widgetSearch.host.selectSearchResult(widgetSearch.host.searchArchiveResults[0]);
assert.equal(widgetSearch.host.detailMode, true); assert.equal(widgetSearch.host.detailFromSearch, true);
assert.equal(widgetSearch.detailRequests.at(-1).kind, "archive-task");
assert.equal(widgetSearch.detailRequests.at(-1).dirName, "task-one");
assert.equal(widgetSearch.host.searchCursor, "", "detail cancels the daemon-owned cursor");
assert.equal(widgetSearch.host.searchHasMore, false); assert.equal(widgetSearch.host.searchStatus, "paused");
assert.equal(widgetSearch.host.searchArchiveResults.length, 1, "detail retains only the bounded displayed result view");
assert.equal(widgetSearch.shared.value, null, "owned I/O is cancelled before opening detail");
widgetSearch.host.closeTaskDetail(); assert.equal(widgetSearch.host.detailMode, false);
assert.equal(widgetSearch.host.searchQuery, "needle"); assert.equal(widgetSearch.host.searchScope, "all");
const priorSerial = widgetSearch.host.searchRequestSerial;
widgetSearch.host.requestSearch(true);
assert.equal(widgetSearch.host.searchRequestSerial, priorSerial, "Back cannot reuse a dropped cursor");
widgetSearch.host.snapshot.projects[0].tasks.push({ id: "fresh-live", title: "Needle new", storedStatus: "planning" });
assert.ok(widgetSearch.host.searchProjection.live.some(row => row.taskId === "fresh-live"),
  "Back uses current live Snapshot instead of retaining an obsolete second Snapshot");
widgetSearch.host.requestSearch(false); assert.equal(widgetSearch.shared.value.cursor, "");
assert.equal(widgetSearch.host.searchArchiveResults.length, 0, "explicit Retry starts a new bounded search");
assert.equal(widgetSearch.host.pinnedTaskId, pinnedSearchBefore); assert.equal(widgetSearch.host.selectedProjectId, selectedSearchBefore);
const clearedSearchOldId = widgetSearch.host.searchRequestId;
widgetSearch.host.searchQuery = "   "; widgetSearch.host.updateSearch();
assert.equal(widgetSearch.timer.running, false); assert.equal(widgetSearch.shared.value, null);
assert.equal(widgetSearch.host.searchProjection.active, false);
widgetSearch.deliver({ ...widgetArchiveReply, requestId: clearedSearchOldId });
assert.equal(widgetSearch.host.searchArchiveResults.length, 0, "cleared query ignores late replies");
const widgetOwnerA = searchWidgetHarness(undefined, "search-widget-a");
const widgetOwnerB = searchWidgetHarness(widgetOwnerA.shared, "search-widget-b");
widgetOwnerA.host.requestSearch(false); const oldWidgetOwner = widgetOwnerA.host.searchRequestId;
widgetOwnerB.host.requestSearch(false);
assert.equal(widgetOwnerA.host.searchStatus, "superseded"); assert.equal(widgetOwnerA.host.searchRequestId, "");
assert.notEqual(widgetOwnerB.host.searchRequestId, oldWidgetOwner);
widgetOwnerA.host.cancelSearch(false);
assert.equal(widgetOwnerA.shared.value.requestId, widgetOwnerB.host.searchRequestId,
  "closing an old widget cannot cancel another widget's owned work");
widgetOwnerB.deliver({ ...widgetArchiveReply, requestId: widgetOwnerB.host.searchRequestId, query: "obsolete" });
assert.equal(widgetOwnerB.host.searchStatus, "error"); assert.equal(widgetOwnerB.host.searchHasMore, false);
const liveDetailSearch = searchWidgetHarness(); liveDetailSearch.host.searchScope = "live";
liveDetailSearch.host.selectSearchResult(liveDetailSearch.host.searchProjection.live[0]);
assert.equal(liveDetailSearch.detailRequests.at(-1).kind, "markdown");
assert.equal(liveDetailSearch.host.pinnedTaskId, pinnedSearchBefore); assert.equal(liveDetailSearch.host.selectedProjectId, selectedSearchBefore);
liveDetailSearch.host.closeTaskDetail();
liveDetailSearch.host.selectSearchResult({ kind: "live", projectId: "alpha", taskId: "removed" });
assert.equal(liveDetailSearch.host.searchStatus, "stale"); assert.equal(liveDetailSearch.host.detailMode, false);
const projectSearchNavigation = searchWidgetHarness(); projectSearchNavigation.host.selectSearchResult({ kind: "project", projectId: "alpha" });
assert.deepEqual(projectSearchNavigation.projectSelections, ["alpha"]); assert.equal(projectSearchNavigation.host.searchMode, false);
assert.equal(projectSearchNavigation.host.pinnedTaskId, pinnedSearchBefore);
// Couple the actual daemon settings cancellation and actual widget response
// observer. A null terminal global must end loading even when the shared
// request still holds the old widget's identity and all callbacks are gone.
const settingsSearchDaemon = detailAuthorityHarness(); settingsSearchDaemon.month("2026-10", 1);
const settingsSearchWidget = searchWidgetHarness(settingsSearchDaemon.sandbox.searchRequestVar, "settings-search-widget");
settingsSearchWidget.shared.listeners.push(() => {
  const value = settingsSearchWidget.shared.value;
  settingsSearchDaemon.pending.push(() => settingsSearchDaemon.sandbox._handleSearchRequest(value));
});
const originalSettingsSearchResponse = settingsSearchDaemon.sandbox.searchResponseVar.set;
settingsSearchDaemon.sandbox.searchResponseVar.set = (value) => {
  originalSettingsSearchResponse(value); settingsSearchWidget.deliver(value);
};
settingsSearchDaemon.host.topologyIntervalDefault = 60;
settingsSearchDaemon.sandbox.TrellisWatch = watch;
settingsSearchDaemon.sandbox.topologyTimer = { running: false };
settingsSearchDaemon.sandbox.settingsRefreshTimer = { restart() {} };
vm.runInNewContext(sourceSection(daemonSource, "    function _topologySettingsSnapshot(", "    function startScan(reason) {"), settingsSearchDaemon.sandbox);
settingsSearchDaemon.host._topologySettingsSnapshot = settingsSearchDaemon.sandbox._topologySettingsSnapshot;
settingsSearchDaemon.host.observedTopologySettings = settingsSearchDaemon.sandbox._topologySettingsSnapshot(settingsSearchDaemon.host.pluginData);
const settingsSearchInputsBefore = JSON.stringify(settingsSearchDaemon.host.currentInputs);
settingsSearchWidget.host.requestSearch(false);
while (!settingsSearchDaemon.host.ownedSearchReaders.length) {
  assert.ok(settingsSearchDaemon.pending.length); settingsSearchDaemon.pending.shift()();
}
const obsoleteSettingsReader = settingsSearchDaemon.host.ownedSearchReaders[0];
const retainedSettingsRequestId = settingsSearchWidget.shared.value.requestId;
settingsSearchDaemon.host.pluginData.scanRoots = [];
settingsSearchDaemon.sandbox._observePluginSettingsChange();
assert.equal(settingsSearchWidget.shared.value.requestId, retainedSettingsRequestId);
assert.equal(settingsSearchWidget.host.searchStatus, "superseded");
assert.equal(settingsSearchWidget.host.searchHasMore, false);
assert.equal(settingsSearchWidget.host.searchCursor, "");
assert.equal(settingsSearchDaemon.host.ownedSearchReaders.length + settingsSearchDaemon.host.ownedSearchProcesses.length, 0);
const settingsResponseCount = settingsSearchDaemon.responses.length;
obsoleteSettingsReader.callback('{"id":"obsolete","title":"Needle"}', null);
settingsSearchDaemon.flush();
assert.equal(settingsSearchDaemon.responses.length, settingsResponseCount, "obsolete callbacks cannot undo scope cancellation");
assert.equal(settingsSearchWidget.host.searchStatus, "superseded");
assert.equal(settingsSearchDaemon.reads.length, 0);
assert.equal(JSON.stringify(settingsSearchDaemon.host.currentInputs), settingsSearchInputsBefore);
assert.match(widgetSource, /id: searchInput[\s\S]*?maximumLength: 256/);
assert.match(widgetSource, /onSearchQueryChanged: root\.updateSearch\(\)/);
assert.match(widgetSource, /onShouldBeVisibleChanged[\s\S]*?root\.closeSearch\(\)/);
assert.match(widgetSource, /onAccepted:[\s\S]*?group\.focusFirst\(\)/);
assert.match(widgetSource, /id: searchResultButton[\s\S]*?buttonHeight: 40[\s\S]*?revealControl/);
assert.equal((widgetSource.match(/DankFlickable\s*\{/g) || []).length, 1);
assert.match(daemonSource, /ownedList: "ownedSearchReaders"/);
assert.match(daemonSource, /ownedList: "ownedSearchProcesses"/);
assert.match(daemonSource, /_cancelSearchRead\(true\);[\s\S]*?_destroyOwned\(\);/);
console.log("global search widget lifecycle fixtures: ok");

assert.equal(fs.readFileSync(archivedSeptemberJson, "utf8"), archivedBefore);
assert.equal(fs.statSync(archivedSeptemberJson).mtimeMs, archivedMtimeBefore);

fs.rmSync(fixture, { recursive: true, force: true });
console.log("trellis contract fixtures: ok");

// Identity-only Quick Action policy, before any host execution wiring.
const actionRequest = { requestId: "action-policy", action: "copy-task-id", kind: "live",
  projectId: "__proto__", taskId: "--help" };
assert.equal(paths.validateActionRequest(actionRequest).ok, true);
for (const field of ["path", "command", "url", "executable", "document", "month"])
  assert.equal(paths.validateActionRequest({ ...actionRequest, [field]: "arbitrary" }).ok, false);
for (const taskId of ["bad\n", "bad\0id", "x".repeat(257), "", null])
  assert.equal(paths.validateActionRequest({ ...actionRequest, taskId }).ok, false);
for (const action of ["delete", "start", "terminal", "open-url", "constructor"])
  assert.equal(paths.validateActionRequest({ ...actionRequest, action }).ok, false);
assert.equal(paths.validateActionRequest({ requestId: "project", kind: "project", projectId: "constructor", action: "open-project-folder" }).ok, true);
assert.equal(paths.validateActionRequest({ ...actionRequest, kind: "project" }).ok, false);
for (const dirName of ["../task", "..", "a/b", "a\\b", "bad\n"])
  assert.equal(paths.validateActionRequest({ ...actionRequest, kind: "archive", month: "2026-10", dirName }).ok, false);
assert.equal(paths.actionFileUrl("/trusted/空 格/%#?"), "file:///trusted/%E7%A9%BA%20%E6%A0%BC/%25%23%3F");
for (const unsafe of ["relative", "/bad\n", "/x/../y", "x".repeat(4097)])
  assert.equal(paths.actionFileUrl(unsafe), "");
console.log("quick action pure request and URL fixtures: ok");

// Execute the real Quick Action lifecycle, authority, path checks, JSON reads,
// and launch functions. Only host Process/FileView/opener are replaced.
function actionHarness(taskId = "shared-id") {
  const api = detailAuthorityHarness(), host = api.host, sandbox = api.sandbox;
  const responses = [], launches = [], objects = [];
  sandbox.actionRequestVar = { value: null, set(value) { this.value = value; } };
  sandbox.actionResponseVar = { value: null, set: value => {
    sandbox.actionResponseVar.value = value; responses.push(searchClone(value));
  } };
  const project = host.currentInputs[0], record = project.taskRecords[0];
  record.value.id = taskId;
  api.dirs.set(paths.tasksRootPath(project.root), []);
  api.files.set(`${record.taskDir}/task.json`, JSON.stringify(record.value));
  const controls = { copyExit: 0, openAccepted: true, beforeProcess: null, afterProcess: null,
    beforeFile: null, missingProcess: false, missingReader: false, throwProcess: false, throwOpen: false };
  function untrack(object) {
    const list = host[object.ownedList] || [];
    host[object.ownedList] = list.filter(item => item !== object);
  }
  sandbox.processComponent = { createObject(_parent, options) {
    if (controls.missingProcess || (controls.missingCopy && options.command[0] === "dms")) return null;
    if (controls.throwProcess) throw Error("process absent");
    const object = { ...options, destroyed: false, destroy() { this.destroyed = true; untrack(this); } };
    objects.push(object);
    if (controls.onCreate) controls.onCreate(options);
    Object.defineProperty(object, "running", { set(value) {
      if (!value) return;
      api.pending.push(() => {
        if (object.destroyed) return;
        const command = options.command, pathArg = command.at(-1);
        if (controls.beforeProcess) controls.beforeProcess(command);
        api.commands.push([...command]);
        let text = "", code = 0;
        if (command[0] === "dms") { launches.push([...command]); code = controls.copyExit; }
        else if (command[0] === "realpath") {
          const resolved = api.canonical.has(pathArg) ? api.canonical.get(pathArg) : pathArg;
          if (resolved && (api.dirs.has(resolved) || api.files.has(resolved))) text = resolved + "\n";
          else code = 1;
        } else if (command[0] === "test") {
          code = (command[1] === "-d" ? api.dirs.has(pathArg) : api.files.has(pathArg)) ? 0 : 1;
        } else if (command[0] === "find") {
          if (api.dirs.has(command[1])) text = api.dirs.get(command[1]).join("\n"); else code = 1;
        } else if (command[0] === "stat") {
          text = String(api.sizes.has(pathArg) ? api.sizes.get(pathArg) : Buffer.byteLength(api.files.get(pathArg) || ""));
        } else assert.fail(`unexpected action command ${command[0]}`);
        if (controls.afterProcess) controls.afterProcess(command);
        untrack(object);
        options.callback(text, code);
        object.destroy();
      });
    } });
    return object;
  } };
  sandbox.detailFileViewComponent = { createObject(_parent, options) {
    if (controls.missingReader) return null;
    const object = { ...options, destroyed: false, destroy() { this.destroyed = true; untrack(this); } };
    objects.push(object);
    api.pending.push(() => {
      if (object.destroyed) return;
      if (controls.beforeFile) controls.beforeFile(options);
      api.reads.push(options.path);
      const text = api.files.get(options.path);
      untrack(object);
      options.callback(text || "", text === undefined ? "read_failed"
        : Buffer.byteLength(text) > options.byteLimit ? "size_limit" : null);
      object.destroy();
    });
    return object;
  } };
  sandbox.Qt.openUrlExternally = url => {
    if (controls.throwOpen) throw Error("opener unavailable");
    launches.push(url); return controls.openAccepted;
  };
  let serial = 0;
  api.action = (action = "copy-task-id", kind = "live", extra = {}) => {
    const request = { requestId: `action-${++serial}`, action, kind, projectId: project.id,
      ...(kind !== "project" ? { taskId } : {}),
      ...(kind === "archive" ? { month: "2026-10", dirName: "task-0000" } : {}), ...extra };
    sandbox.actionRequestVar.value = request;
    sandbox._handleActionRequest(request); return request;
  };
  api.cancelAction = () => { sandbox.actionRequestVar.value = null; sandbox._handleActionRequest(null); };
  api.finishAction = () => { api.flush(); return responses.at(-1); };
  Object.assign(api, { actionResponses: responses, launches, objects, controls, project, record });
  return api;
}
for (const taskId of ["--help", "-d", "--type", "constructor", "__proto__", "空 格 % # ?"]) {
  const api = actionHarness(taskId);
  const inputBefore = JSON.stringify(api.host.currentInputs);
  const snapshot = parser.makeSnapshot(api.host.currentInputs, [], changesTime);
  const healthBefore = JSON.stringify(projection.makeHealthProjection(snapshot));
  api.action();
  assert.equal(api.actionResponses.length, 0, "no success at click time");
  assert.equal(api.finishAction().status, "copied");
  assert.deepEqual(api.launches, [["dms", "cl", "copy", "--", taskId]]);
  assert.equal(JSON.stringify(api.host.currentInputs), inputBefore);
  assert.equal(JSON.stringify(projection.makeHealthProjection(snapshot)), healthBefore);
  assert.equal(api.host.ownedActionProcesses.length + api.host.ownedActionReaders.length, 0);
}
for (const [action, kind] of [["copy-project-path", "project"], ["copy-task-path", "live"],
  ["open-project-folder", "project"], ["open-task-folder", "live"],
  ["copy-project-path", "archive"], ["copy-task-path", "archive"], ["open-task-folder", "archive"]]) {
  const api = actionHarness(); api.month("2026-10", 1);
  api.action(action, kind); const response = api.finishAction();
  assert.equal(response.status, action.startsWith("copy") ? "copied" : "accepted");
  const expected = action.includes("project") ? api.project.root
    : kind === "archive" ? `${paths.archiveRootPath(api.project.root)}/2026-10/task-0000` : api.record.taskDir;
  assert.equal(response.value, expected);
  assert.deepEqual(api.launches, [action.startsWith("copy") ? ["dms", "cl", "copy", "--", expected] : paths.actionFileUrl(expected)]);
}
const unicodeAction = actionHarness();
const unicodeDir = `${paths.tasksRootPath(unicodeAction.project.root)}/空 格 % # ?`;
unicodeAction.record.taskDir = unicodeDir; unicodeAction.record.dirName = "空 格 % # ?";
unicodeAction.dirs.set(unicodeDir, []); unicodeAction.files.set(`${unicodeDir}/task.json`, JSON.stringify(unicodeAction.record.value));
unicodeAction.action("open-task-folder"); assert.equal(unicodeAction.finishAction().status, "accepted");
assert.equal(unicodeAction.launches[0], "file:///trusted/alpha/.trellis/tasks/%E7%A9%BA%20%E6%A0%BC%20%25%20%23%20%3F");
// Effective identity follows existing parser/archive semantics rather than a
// newly invented requirement for a stored string id.
for (const value of [{}, { id: "  " }, { id: 4 }, null, [], "primitive", 4, false]) {
  const api = actionHarness("live-one"); api.record.value = value;
  api.files.set(`${api.record.taskDir}/task.json`, JSON.stringify(value));
  api.action(); assert.equal(api.finishAction().status, "copied");
}
const trimmedAction = actionHarness("shared-id"); trimmedAction.record.value.id = "  shared-id  ";
trimmedAction.files.set(`${trimmedAction.record.taskDir}/task.json`, JSON.stringify(trimmedAction.record.value));
trimmedAction.action(); assert.equal(trimmedAction.finishAction().value, "shared-id");
const archiveFallback = actionHarness("task-0000"); archiveFallback.month("2026-10", 1);
archiveFallback.files.set(`${paths.archiveRootPath(archiveFallback.project.root)}/2026-10/task-0000/task.json`, "{}");
archiveFallback.action("copy-task-id", "archive"); assert.equal(archiveFallback.finishAction().value, "task-0000");
function actionRejected(change, action = "copy-task-id", kind = "live") {
  const api = actionHarness(); api.month("2026-10", 1); change(api);
  api.action(action, kind); assert.equal(api.finishAction().status, "error");
  assert.equal(api.launches.length, 0, "rejected authority/identity performs no external execution");
  return api;
}
actionRejected(api => { api.host.pluginData.scanRoots = []; });
actionRejected(api => { api.canonical.set("/trusted", "/outside"); api.dirs.set("/outside", []); });
actionRejected(api => { api.host.currentInputs.push(searchClone(api.project)); });
actionRejected(api => { api.project.taskRecords.push(searchClone(api.record)); });
actionRejected(api => { api.record.taskDir = "/outside/task"; });
actionRejected(api => { api.record.taskDir = `${paths.tasksRootPath(api.project.root)}/../escape`; });
actionRejected(api => { api.record.readError = "read_failed"; });
actionRejected(api => { api.files.set(`${api.record.taskDir}/task.json`, '{"id":"changed"}'); });
actionRejected(api => { api.files.set(`${api.record.taskDir}/task.json`, "malformed"); });
actionRejected(api => { api.sizes.set(`${api.record.taskDir}/task.json`, 1024 * 1024 + 1); });
actionRejected(api => { api.files.set(`${api.record.taskDir}/task.json`, JSON.stringify({ id: "shared-id", text: "界".repeat(400000) })); api.sizes.set(`${api.record.taskDir}/task.json`, 4); });
actionRejected(api => { api.controls.missingReader = true; });
for (const kind of ["live", "archive", "project"]) {
  for (const part of kind === "project" ? ["project", "trellis"]
    : kind === "live" ? ["project", "trellis", "tasks", "task", "json"]
      : ["project", "trellis", "tasks", "archive", "month", "task", "json"]) {
    actionRejected(api => {
      const archive = paths.archiveRootPath(api.project.root), month = `${archive}/2026-10`;
      const task = kind === "archive" ? `${month}/task-0000` : api.record.taskDir;
      const targets = { project: api.project.root, trellis: `${api.project.root}/.trellis`,
        tasks: paths.tasksRootPath(api.project.root), archive, month, task, json: `${task}/task.json` };
      const outside = part === "json" ? "/outside/task.json" : "/outside/directory";
      (part === "json" ? api.files : api.dirs).set(outside, part === "json" ? '{"id":"shared-id"}' : []);
      api.canonical.set(targets[part], outside);
    }, kind === "project" ? "open-project-folder" : "copy-task-id", kind);
  }
}
// Trusted descendants retain discovery's bounded ancestor-promotion policy.
const descendantAction = actionHarness(); descendantAction.host.pluginData.scanRoots = [descendantAction.record.taskDir];
descendantAction.action("copy-project-path", "project"); assert.equal(descendantAction.finishAction().status, "copied");
const tooDeepAction = actionHarness(); const deepRoot = `${tooDeepAction.project.root}/a/b/c/d/e/f/g/h`;
tooDeepAction.dirs.set(deepRoot, []); tooDeepAction.host.pluginData.scanRoots = [deepRoot];
tooDeepAction.action("copy-project-path", "project"); assert.equal(tooDeepAction.finishAction().status, "error");
for (const stage of ["process", "reader", "prelaunch"]) {
  const api = actionHarness(); api.action();
  if (stage === "reader") {
    while (!api.host.ownedActionReaders.length) { assert.ok(api.pending.length); api.pending.shift()(); }
    api.host.pluginData.scanRoots = [];
  } else if (stage === "process") api.host.pluginData.scanRoots = [];
  else api.controls.onCreate = options => { if (options.command[0] === "dms") api.host.pluginData.scanRoots = []; };
  assert.equal(api.finishAction().status, "error"); assert.equal(api.launches.length, 0);
}
const redirectedAfterRead = actionHarness(); redirectedAfterRead.controls.beforeFile = () => {
  redirectedAfterRead.canonical.set("/trusted", "/redirected"); redirectedAfterRead.dirs.set("/redirected", []);
}; redirectedAfterRead.action(); assert.equal(redirectedAfterRead.finishAction().status, "error"); assert.equal(redirectedAfterRead.launches.length, 0);
const staleAtRead = actionHarness(); staleAtRead.controls.beforeFile = options => staleAtRead.files.set(options.path, '{"id":"changed-during-io"}');
staleAtRead.action(); assert.equal(staleAtRead.finishAction().status, "error"); assert.equal(staleAtRead.launches.length, 0);
const retargetAfterRead = actionHarness(); retargetAfterRead.controls.beforeFile = () => {
  retargetAfterRead.canonical.set(retargetAfterRead.record.taskDir, "/elsewhere"); retargetAfterRead.dirs.set("/elsewhere", []);
}; retargetAfterRead.action(); assert.equal(retargetAfterRead.finishAction().status, "error"); assert.equal(retargetAfterRead.launches.length, 0);
for (const settings of [{ copyExit: 1 }, { missingCopy: true }, { throwProcess: true }, { missingProcess: true }]) {
  const api = actionHarness(); Object.assign(api.controls, settings); api.action(); assert.equal(api.finishAction().status, "error");
}
for (const settings of [{ openAccepted: false }, { throwOpen: true }, { missingOpener: true }]) {
  const api = actionHarness(); Object.assign(api.controls, settings);
  if (settings.missingOpener) delete api.sandbox.Qt.openUrlExternally;
  api.action("open-project-folder", "project"); assert.equal(api.finishAction().status, "error");
}
const cancelAction = actionHarness(); cancelAction.action();
while (!cancelAction.host.ownedActionReaders.length) { assert.ok(cancelAction.pending.length); cancelAction.pending.shift()(); }
const obsoleteActionReader = cancelAction.host.ownedActionReaders[0];
cancelAction.cancelAction(); const cancelReplyCount = cancelAction.actionResponses.length;
obsoleteActionReader.callback('{"id":"shared-id"}', null); cancelAction.flush();
assert.equal(cancelAction.actionResponses.length, cancelReplyCount); assert.equal(cancelAction.launches.length, 0);
assert.equal(cancelAction.host.ownedActionProcesses.length + cancelAction.host.ownedActionReaders.length, 0);
const supersededAction = actionHarness(); const olderAction = supersededAction.action();
const obsoleteActionProcess = supersededAction.host.ownedActionProcesses[0];
const newerAction = supersededAction.action("copy-project-path", "project");
supersededAction.sandbox._handleActionRequest(olderAction);
obsoleteActionProcess.callback("/trusted\n", 0);
assert.equal(supersededAction.finishAction().requestId, newerAction.requestId);
assert.equal(supersededAction.launches.length, 1);
const independentAction = actionHarness();
const independentDetailReader = { destroy() { assert.fail("actions must not destroy detail readers"); } };
const independentSearchProcess = { destroy() { assert.fail("actions must not destroy Search processes"); } };
independentAction.host.ownedDetailReaders.push(independentDetailReader);
independentAction.host.ownedSearchProcesses.push(independentSearchProcess);
independentAction.action(); independentAction.cancelAction(); independentAction.flush();
assert.ok(independentAction.host.ownedDetailReaders.includes(independentDetailReader));
assert.ok(independentAction.host.ownedSearchProcesses.includes(independentSearchProcess));
console.log("quick actions actual-daemon lifecycle fixtures: ok");

function actionWidgetHarness(shared = { value: null, listeners: [] }, instance = "action-widget-a") {
  const response = { value: null }, detailRequests = [];
  const host = { snapshot: searchClone(searchFixtureSnapshot), actionInstanceId: instance,
    actionSerial: 0, actionIdentity: null, actionRequestId: "", actionStatus: "idle", actionCode: "",
    pinnedTaskId: "retain-pin", selectedProjectId: "retain-filter", detailMode: true,
    detailProjectId: "alpha", detailTaskId: "shared", detailArchive: false };
  Object.defineProperty(host, "actionPending", { get() { return host.actionStatus === "pending"; } });
  if (!shared.listeners) shared.listeners = [];
  shared.set = value => { shared.value = searchClone(value); shared.listeners.forEach(fn => fn()); };
  const sandbox = { root: host, actionRequestVar: shared, actionResponseVar: response,
    TrellisPaths: paths, TrellisProjection: projection, I18n: { trFor: (_plugin, text) => text } };
  vm.runInNewContext(sourceSection(widgetSource, "    function cancelAction() {", "    function cancelSearch(preserveResults) {"), sandbox);
  vm.runInNewContext(sourceSection(widgetSource, "    function closeTaskDetail() {", "    function observeDetailResponse() {"), sandbox);
  sandbox.detailRequestVar = { set: value => detailRequests.push(value) };
  for (const key of Object.keys(sandbox)) if (typeof sandbox[key] === "function") host[key] = sandbox[key];
  shared.listeners.push(() => host.observeActionOwnership());
  return { host, sandbox, shared, detailRequests, deliver(value) {
    response.value = searchClone(value); host.observeActionResponse();
  } };
}
const actionViewContext = projection.makeActionContext(searchFixtureSnapshot, "live", "alpha", "shared");
assert.deepEqual(searchClone(actionViewContext), { kind: "live", projectId: "alpha", taskId: "shared" });
assert.equal(projection.makeActionContext(searchFixtureSnapshot, "live", "alpha", "removed"), null);
const ambiguousActionSnapshot = searchClone(searchFixtureSnapshot);
ambiguousActionSnapshot.projects[0].tasks.push({ ...ambiguousActionSnapshot.projects[0].tasks[0] });
assert.equal(projection.makeActionContext(ambiguousActionSnapshot, "live", "alpha", "shared"), null);
ambiguousActionSnapshot.projects.push(searchClone(ambiguousActionSnapshot.projects[0]));
assert.equal(projection.makeActionContext(ambiguousActionSnapshot, "project", "alpha"), null);
const actionWidget = actionWidgetHarness(); actionWidget.host.requestAction("copy-task-id", actionViewContext);
assert.equal(actionWidget.host.actionPending, true);
assert.deepEqual(Object.keys(actionWidget.shared.value).sort(), ["action", "kind", "projectId", "requestId", "taskId"]);
const widgetActionRequest = searchClone(actionWidget.shared.value);
actionWidget.host.requestAction("copy-task-path", actionViewContext);
assert.equal(actionWidget.host.actionSerial, 1, "pending controls do not start another action");
actionWidget.deliver({ ...widgetActionRequest, requestId: "obsolete", status: "copied", code: "action_copied" });
assert.equal(actionWidget.host.actionPending, true);
actionWidget.deliver({ ...widgetActionRequest, taskId: "wrong", status: "copied", code: "action_copied" });
assert.equal(actionWidget.host.actionStatus, "error"); assert.equal(actionWidget.host.actionPending, false);
actionWidget.host.requestAction("copy-task-id", actionViewContext);
actionWidget.deliver({ ...actionWidget.shared.value, status: "copied", code: "action_copied" });
assert.equal(actionWidget.host.actionStatus, "copied"); assert.equal(actionWidget.host.actionFeedbackText(), "Copied to clipboard.");
assert.equal(actionWidget.host.pinnedTaskId, "retain-pin"); assert.equal(actionWidget.host.selectedProjectId, "retain-filter");
assert.equal(actionWidget.host.actionFeedbackFor(actionViewContext), true);
assert.equal(actionWidget.host.actionFeedbackFor({ ...actionViewContext, projectId: "beta" }), false);
const archiveActionWidget = actionWidgetHarness();
const archiveActionContext = projection.makeActionContext(searchFixtureSnapshot, "archive", "alpha", "archive-id", "2026-10", "archive-folder");
archiveActionWidget.host.requestAction("open-task-folder", archiveActionContext);
assert.deepEqual(Object.keys(archiveActionWidget.shared.value).sort(), ["action", "dirName", "kind", "month", "projectId", "requestId", "taskId"]);
archiveActionWidget.deliver({ ...archiveActionWidget.shared.value, status: "accepted", code: "action_open_accepted" });
assert.equal(archiveActionWidget.host.actionFeedbackText(), "Folder launch request accepted.");
const invalidActionWidget = actionWidgetHarness(); invalidActionWidget.host.requestAction("copy-task-id", { ...actionViewContext, path: "/arbitrary" });
assert.equal(invalidActionWidget.host.actionStatus, "error"); assert.equal(invalidActionWidget.shared.value, null);
const throwingActionWidget = actionWidgetHarness(); throwingActionWidget.shared.set = () => { throw Error("global API missing"); };
throwingActionWidget.host.requestAction("copy-task-id", actionViewContext);
assert.equal(throwingActionWidget.host.actionStatus, "error"); assert.equal(throwingActionWidget.host.actionPending, false);
const widgetActionOwnerA = actionWidgetHarness(), widgetActionOwnerB = actionWidgetHarness(widgetActionOwnerA.shared, "action-widget-b");
widgetActionOwnerA.host.requestAction("copy-task-id", actionViewContext);
widgetActionOwnerB.host.requestAction("copy-task-path", actionViewContext);
assert.equal(widgetActionOwnerA.host.actionStatus, "superseded"); assert.equal(widgetActionOwnerA.host.actionPending, false);
const widgetActionBRequest = searchClone(widgetActionOwnerB.shared.value);
widgetActionOwnerA.host.cancelAction(); assert.deepEqual(widgetActionOwnerA.shared.value, widgetActionBRequest,
  "closing a superseded widget cannot cancel the current owner");
widgetActionOwnerB.host.closeTaskDetail(); assert.equal(widgetActionOwnerB.shared.value, null);
assert.equal(widgetActionOwnerB.host.actionPending, false); assert.equal(widgetActionOwnerB.host.detailMode, false);
// Couple the actual daemon root-change lifecycle with the actual widget
// observer. Root cancellation consumes the old request and ends pending.
const rootChangedActionDaemon = actionHarness(), rootChangedActionWidget = actionWidgetHarness(rootChangedActionDaemon.sandbox.actionRequestVar, "root-change-action");
rootChangedActionWidget.shared.listeners.push(() => {
  const value = rootChangedActionWidget.shared.value;
  rootChangedActionDaemon.pending.push(() => rootChangedActionDaemon.sandbox._handleActionRequest(value));
});
const publishActionResponse = rootChangedActionDaemon.sandbox.actionResponseVar.set;
rootChangedActionDaemon.sandbox.actionResponseVar.set = value => { publishActionResponse(value); rootChangedActionWidget.deliver(value); };
Object.assign(rootChangedActionDaemon.sandbox, { TrellisWatch: watch, topologyTimer: { running: false }, settingsRefreshTimer: { restart() {} } });
rootChangedActionDaemon.host.topologyIntervalDefault = 60;
vm.runInNewContext(sourceSection(daemonSource, "    function _topologySettingsSnapshot(", "    function startScan(reason) {"), rootChangedActionDaemon.sandbox);
rootChangedActionDaemon.host._topologySettingsSnapshot = rootChangedActionDaemon.sandbox._topologySettingsSnapshot;
rootChangedActionDaemon.host.observedTopologySettings = rootChangedActionDaemon.sandbox._topologySettingsSnapshot(rootChangedActionDaemon.host.pluginData);
const daemonActionContext = { kind: "live", projectId: rootChangedActionDaemon.project.id, taskId: "shared-id" };
rootChangedActionWidget.host.requestAction("copy-task-id", daemonActionContext);
while (!rootChangedActionDaemon.host.ownedActionReaders.length) { assert.ok(rootChangedActionDaemon.pending.length); rootChangedActionDaemon.pending.shift()(); }
const obsoleteRootReader = rootChangedActionDaemon.host.ownedActionReaders[0];
rootChangedActionDaemon.host.pluginData.scanRoots = [];
rootChangedActionDaemon.sandbox._observePluginSettingsChange();
assert.equal(rootChangedActionWidget.shared.value, null);
assert.equal(rootChangedActionWidget.host.actionPending, false); assert.equal(rootChangedActionWidget.host.actionStatus, "superseded");
const rootActionResponseCount = rootChangedActionDaemon.actionResponses.length;
obsoleteRootReader.callback('{"id":"shared-id"}', null); rootChangedActionDaemon.flush();
assert.equal(rootChangedActionDaemon.actionResponses.length, rootActionResponseCount);
assert.equal(rootChangedActionDaemon.launches.length, 0);
assert.equal(rootChangedActionWidget.host.actionPending, false);
assert.match(widgetSource, /id: detailActionsToggle[\s\S]*?buttonHeight: 40/);
assert.match(widgetSource, /model: detailActionsToggle.expanded \? root.taskActions : \[\]/);
assert.match(widgetSource, /id: detailActionsFlow[\s\S]*?enabled: !root.actionPending && !!root.detailActionContext/);
assert.match(widgetSource, /id: projectActionsFlow[\s\S]*?enabled: !root.actionPending && !!projectActionsFlow.context/);
assert.match(widgetSource, /onShouldBeVisibleChanged[\s\S]*?root.cancelAction\(\)/);
assert.match(widgetSource, /Component.onDestruction: \{ root.cancelSearch\(false\); root.cancelAction\(\); \}/);
const actualActionDaemonSource = sourceSection(daemonSource, "    function _cancelAction(", "    function _untrack(");
assert.doesNotMatch(actualActionDaemonSource, /savePlugin|setGlobalVar|watchChanges|currentWarnings|_cancelDetail|_cancelSearch/);
assert.match(actualActionDaemonSource, /\["dms", "cl", "copy", "--", value\]/);
assert.match(actualActionDaemonSource, /typeof Qt.openUrlExternally !== "function"/);
for (const key of ["requestId", "projectId", "taskId"]) {
  for (const control of ["\n", "\t", "\r", "\0", "\x7f"]) {
    for (const atStart of [true, false]) assert.equal(paths.validateActionRequest({ ...actionRequest,
      [key]: atStart ? control + actionRequest[key] : actionRequest[key] + control }).ok, false);
  }
}
console.log("quick actions actual-widget ownership and control fixtures: ok");

// Existing detail and Search execute successfully while an action fails or is
// cancelled; their own generations/resources remain intact.
for (const outcome of ["cancel", "failure"]) {
  const api = actionHarness(); api.month("2026-10", 1);
  api.open(); api.request("needle");
  const detailGeneration = api.host.detailGeneration, searchGeneration = api.host.searchGeneration;
  api.action();
  if (outcome === "cancel") api.cancelAction(); else api.controls.copyExit = 1;
  api.flush();
  assert.equal(api.detailResponses.at(-1).status, "ready");
  assert.equal(api.responses.at(-1).status, "ready");
  assert.equal(api.host.detailGeneration, detailGeneration); assert.equal(api.host.searchGeneration, searchGeneration);
  if (outcome === "failure") assert.equal(api.actionResponses.at(-1).status, "error");
}
const staleArchiveAction = actionRejected(api => {
  api.files.set(`${paths.archiveRootPath(api.project.root)}/2026-10/task-0000/task.json`, '{"id":"changed"}');
}, "copy-task-id", "archive");
assert.equal(staleArchiveAction.reads.length, 1);
for (const value of [null, [], "primitive"])
  actionRejected(api => { api.files.set(`${paths.archiveRootPath(api.project.root)}/2026-10/task-0000/task.json`, JSON.stringify(value)); }, "copy-task-id", "archive");
actionRejected(api => { api.files.delete(`${api.record.taskDir}/task.json`); });
actionRejected(api => { api.dirs.delete(api.record.taskDir); });
actionRejected(api => { api.record.taskDir = `${paths.archiveRootPath(api.project.root)}/2026-10/task-0000`; });
const identityChangeAction = actionHarness(); identityChangeAction.action();
identityChangeAction.record.value.id = "new-id";
assert.equal(identityChangeAction.finishAction().status, "error"); assert.equal(identityChangeAction.launches.length, 0);
const duplicateDuringAction = actionHarness(); duplicateDuringAction.action();
duplicateDuringAction.project.taskRecords.push(searchClone(duplicateDuringAction.record));
assert.equal(duplicateDuringAction.finishAction().status, "error"); assert.equal(duplicateDuringAction.launches.length, 0);
const changedRequestAction = actionHarness(); const currentRequestAction = changedRequestAction.action();
changedRequestAction.sandbox.actionRequestVar.value = { ...currentRequestAction, action: "open-task-folder" };
assert.equal(changedRequestAction.finishAction().status, "error"); assert.equal(changedRequestAction.launches.length, 0);
const cancelClipboardAction = actionHarness(); cancelClipboardAction.action();
while (!cancelClipboardAction.host.ownedActionProcesses.some(object => object.command[0] === "dms")) {
  assert.ok(cancelClipboardAction.pending.length); cancelClipboardAction.pending.shift()();
}
const obsoleteClipboard = cancelClipboardAction.host.ownedActionProcesses.find(object => object.command[0] === "dms");
cancelClipboardAction.cancelAction(); obsoleteClipboard.callback("", 0); cancelClipboardAction.flush();
assert.equal(cancelClipboardAction.launches.length, 0); assert.equal(cancelClipboardAction.actionResponses.at(-1), null);
const invalidActionDaemon = actionHarness();
const invalidActionRaw = { requestId: "invalid-action", action: "open-project-folder", kind: "project", projectId: invalidActionDaemon.project.id, url: "file:///arbitrary" };
invalidActionDaemon.sandbox.actionRequestVar.value = invalidActionRaw;
invalidActionDaemon.sandbox._handleActionRequest(invalidActionRaw);
assert.equal(invalidActionDaemon.finishAction().status, "error"); assert.equal(invalidActionDaemon.commands.length, 0);
console.log("quick actions channel isolation and stale-execution fixtures: ok");
assert.match(widgetSource, /model: projectActionsToggle.expanded \? root.projectActions : \[\]/);
assert.match(widgetSource, /"Task ID: %1"\).arg\(root.detailTaskId\)/);
const staleFeedbackWidget = actionWidgetHarness();
staleFeedbackWidget.host.requestAction("copy-task-id", actionViewContext);
staleFeedbackWidget.host.snapshot.projects[0].tasks = [];
staleFeedbackWidget.deliver({ ...staleFeedbackWidget.shared.value, status: "error", code: "action_scope_changed" });
assert.equal(staleFeedbackWidget.host.detailActionFeedbackVisible(), true,
  "stale task detail retains local failure feedback even when its controls lose current validity");
const jsonRedirectAfterRead = actionHarness();
jsonRedirectAfterRead.controls.beforeFile = options => {
  jsonRedirectAfterRead.files.set("/outside/task.json", '{"id":"shared-id"}');
  jsonRedirectAfterRead.canonical.set(options.path, "/outside/task.json");
};
jsonRedirectAfterRead.action(); assert.equal(jsonRedirectAfterRead.finishAction().status, "error");
assert.equal(jsonRedirectAfterRead.launches.length, 0);
const changedBeforeOpen = actionHarness(); let projectAuthorityChecks = 0;
changedBeforeOpen.controls.afterProcess = command => {
  if (command[0] === "test" && command[1] === "-d" && command.at(-1) === `${changedBeforeOpen.project.root}/.trellis`
      && ++projectAuthorityChecks === 2) changedBeforeOpen.host.pluginData.scanRoots = [];
};
changedBeforeOpen.action("open-project-folder", "project");
assert.equal(changedBeforeOpen.finishAction().status, "error"); assert.equal(changedBeforeOpen.launches.length, 0);

// DMS keeps globalVars after unloadPlugin. Execute the real deferred request
// observer and destruction body, then recreate a daemon against those globals.
const actionGlobalRequestSource = sourceSection(daemonSource,
  '        varName: "actionRequest"', '    PluginGlobalVar {\n        id: actionResponseVar');
const actionDeferredBody = sourceSection(actionGlobalRequestSource,
  "        onValueChanged: {\n", "\n        }\n    }")
  .slice("        onValueChanged: {\n".length);
function coupleActionWidget(api, instance = "reload-action", notifyResponse = true) {
  const widget = actionWidgetHarness(api.sandbox.actionRequestVar, instance);
  api.host._handleActionRequest = api.sandbox._handleActionRequest;
  vm.runInNewContext(`function _testActionRequestChanged(value) {\n${actionDeferredBody}\n}`, api.sandbox);
  widget.shared.listeners.push(() => api.sandbox._testActionRequestChanged(widget.shared.value));
  const publish = api.sandbox.actionResponseVar.set;
  api.sandbox.actionResponseVar.set = value => {
    publish(value);
    widget.sandbox.actionResponseVar.value = searchClone(value);
    if (notifyResponse) widget.host.observeActionResponse();
  };
  return widget;
}
function destroyActionDaemon(api) {
  // Other generations/pools have separate coverage above; keep only the
  // action teardown real here, without requiring a scan/watcher host.
  Object.assign(api.host, { _destroyNotificationProcesses() {} });
  Object.assign(api.sandbox, { _cancelDetailRead() {}, _cancelSearchRead() {}, _destroyOwned() {} });
  vm.runInNewContext(`function _testDaemonDestruction() {\n${destructionSource
    .slice("Component.onDestruction: {".length)}\n}`, api.sandbox);
  api.sandbox._testDaemonDestruction();
}
function assertActionGlobalsDoNotReplay(api) {
  const recreated = actionHarness();
  recreated.sandbox.actionRequestVar.value = api.sandbox.actionRequestVar.value;
  recreated.sandbox.actionResponseVar.value = api.sandbox.actionResponseVar.value;
  recreated.sandbox._handleActionRequest(recreated.sandbox.actionRequestVar.value);
  recreated.flush();
  assert.equal(recreated.commands.length + recreated.reads.length + recreated.launches.length, 0,
    "recreated daemon must not revalidate or execute a completed/cancelled request");
  assert.equal(recreated.host.currentAction, null);
}
for (const notifyResponse of [true, false]) {
  for (const outcome of ["copied", "accepted", "host-error", "validation-error"]) {
    const api = actionHarness(), widget = coupleActionWidget(api, `completion-${outcome}`, notifyResponse);
    if (outcome === "host-error") api.controls.copyExit = 1;
    if (outcome === "validation-error") api.files.set(`${api.record.taskDir}/task.json`, "{broken");
    widget.host.requestAction(outcome === "accepted" ? "open-task-folder" : "copy-task-id", daemonActionContext);
    api.flush();
    const expected = outcome.endsWith("error") ? "error" : outcome;
    assert.equal(widget.host.actionStatus, expected,
      "matching completion survives ownership-null even if its response observer runs later");
    assert.equal(widget.host.actionPending, false);
    assert.equal(widget.shared.value, null);
    assert.equal(api.sandbox.actionResponseVar.value.status, expected,
      "deferred null acknowledgement retains the published completion");
    const replies = api.actionResponses.length, launches = api.launches.length;
    for (const object of api.objects) object.callback("obsolete callback", 0);
    api.flush();
    assert.equal(api.actionResponses.length, replies); assert.equal(api.launches.length, launches);
    assertActionGlobalsDoNotReplay(api);
  }
}
for (const phase of ["deferred", "reader", "clipboard"]) {
  const api = actionHarness(), widget = coupleActionWidget(api, `destroy-${phase}`);
  widget.host.requestAction("copy-task-id", daemonActionContext);
  if (phase !== "deferred") {
    while (phase === "reader" ? !api.host.ownedActionReaders.length
      : !api.host.ownedActionProcesses.some(object => object.command[0] === "dms")) {
      assert.ok(api.pending.length); api.pending.shift()();
    }
  } else assert.equal(api.host.pendingActionRequest, widget.shared.value);
  destroyActionDaemon(api);
  assert.equal(widget.shared.value, null);
  assert.equal(widget.host.actionPending, false);
  assert.equal(widget.host.actionStatus, "superseded");
  assert.equal(api.host.ownedActionProcesses.length + api.host.ownedActionReaders.length, 0);
  const replies = api.actionResponses.length;
  for (const object of api.objects) object.callback("obsolete callback", 0);
  api.flush();
  assert.equal(api.actionResponses.length, replies); assert.equal(api.launches.length, 0);
  assertActionGlobalsDoNotReplay(api);
}
const deferredRootAction = actionHarness(), deferredRootWidget = coupleActionWidget(deferredRootAction);
deferredRootWidget.host.requestAction("copy-task-id", daemonActionContext);
deferredRootAction.host.pluginData.scanRoots = [];
deferredRootAction.sandbox._cancelAction(true);
deferredRootAction.flush();
assert.equal(deferredRootWidget.shared.value, null); assert.equal(deferredRootWidget.host.actionPending, false);
assert.equal(deferredRootAction.commands.length, 0); assertActionGlobalsDoNotReplay(deferredRootAction);

const replacedRawAction = actionHarness(), originalRawAction = replacedRawAction.action();
const replacementRawAction = searchClone(originalRawAction);
replacedRawAction.sandbox.actionRequestVar.value = replacementRawAction;
assert.equal(replacedRawAction.finishAction().code, "action_scope_changed");
assert.equal(replacedRawAction.launches.length, 0);
assert.equal(replacedRawAction.sandbox.actionRequestVar.value, replacementRawAction,
  "an equal-content replacement is a different raw owner and must be retained");

// A newer widget can publish while the previous completion is being delivered.
// Consuming/cancelling the previous raw owner must preserve that newer request.
const completionRaceAction = actionHarness(), completionRaceOwner = coupleActionWidget(completionRaceAction, "race-owner");
const completionRaceNext = actionWidgetHarness(completionRaceOwner.shared, "race-next");
const publishRaceResponse = completionRaceAction.sandbox.actionResponseVar.set;
let raceRequested = false, raceRequest = null;
completionRaceAction.sandbox.actionResponseVar.set = value => {
  publishRaceResponse(value); completionRaceNext.deliver(value);
  if (value?.requestId.startsWith("race-owner") && !raceRequested) {
    raceRequested = true;
    completionRaceNext.host.requestAction("copy-project-path", { kind: "project", projectId: completionRaceAction.project.id });
    raceRequest = completionRaceNext.shared.value;
    assert.equal(completionRaceOwner.host.actionStatus, "copied");
    completionRaceOwner.host.cancelAction();
    assert.equal(completionRaceNext.shared.value, raceRequest);
  }
};
completionRaceOwner.host.requestAction("copy-task-id", daemonActionContext);
completionRaceAction.flush();
assert.equal(completionRaceNext.host.actionStatus, "copied");
assert.equal(completionRaceNext.shared.value, null); assert.equal(completionRaceAction.launches.length, 2);
assert.equal(completionRaceAction.actionResponses.at(-1).requestId, raceRequest.requestId);
assertActionGlobalsDoNotReplay(completionRaceAction);
console.log("quick actions retained-global completion, cancellation and daemon recreation fixtures: ok");
