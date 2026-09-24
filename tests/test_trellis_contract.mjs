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
    "lib/trellisdiscovery.js"
  ],
  "TrellisDms/TrellisSettings.qml": [
    "lib/trellisdiscovery.js",
    "lib/trellisprojection.js",
    "lib/trellisWatch.js"
  ],
  "TrellisDms/TrellisWidget.qml": ["lib/trellisprojection.js"]
};

for (const [qmlRelativePath, expectedImports] of Object.entries(expectedQmlImports)) {
  assert.deepEqual(assertExactCaseQmlImports(qmlRelativePath), expectedImports);
}

assertExactCaseResource("TrellisDms/lib/trellisdiscovery.js");
assertExactCaseResource("TrellisDms/lib/trellisprojection.js");

const paths = loadQmlJs("TrellisDms/lib/trellisPaths.js");
const parser = loadQmlJs("TrellisDms/lib/trellisParser.js");
const discoveryPolicy = loadQmlJs("TrellisDms/lib/trellisdiscovery.js");
const projection = loadQmlJs("TrellisDms/lib/trellisprojection.js");
const watch = loadQmlJs("TrellisDms/lib/trellisWatch.js");

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
let pending = {};
pending = watch.addPendingPath(pending, "/tmp/a", 2).pending;
pending = watch.addPendingPath(pending, "/tmp/a", 2).pending;
pending = watch.addPendingPath(pending, "/tmp/b", 2).pending;
const dropped = watch.addPendingPath(pending, "/tmp/c", 2);
assert.equal(Object.keys(dropped.pending).length, 2);
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
assert.match(daemonSource, /watchChanges\s*:\s*true/);
assert.match(daemonSource, /blockWrites\s*:\s*true/);
assert.match(daemonSource, /atomicWrites\s*:\s*true/);
assert.match(daemonSource, /preload\s*:\s*true/);
assert.match(daemonSource, /_destroyWatchers/);
assert.match(daemonSource, /topologyTimer\.stop\(\)/);
assert.match(daemonSource, /knownReloadTimer\.stop\(\)/);
assert.match(daemonSource, /Timer\s*\{/);
assert.match(daemonSource, /topologyIntervalDefault/);
assert.match(daemonSource, /maxKnownWatchers/);
assert.match(daemonSource, /maxPendingKnownReloads/);
assert.match(daemonSource, /maxAncestorCandidates:\s*8/);
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
assert.match(daemonSource, /id:\s*settingsRefreshTimer[\s\S]*?onTriggered:\s*root\.startScan\("settings"\)/);
assert.match(daemonSource, /onPluginDataChanged:\s*settingsRefreshTimer\.restart\(\)/);
assert.match(daemonSource, /Component\.onDestruction:[\s\S]*?_destroyOwned\(\)/);
assert.equal((daemonSource.match(/setGlobalVar\s*\(/g) || []).length, 1);
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
assert.match(settingsSource, /settingKey:\s*"pillMode"/);
assert.match(settingsSource, /loadValue\("displayMode",\s*null\)/);
assert.match(settingsSource, /settingKey:\s*"showProgress"/);
assert.match(settingsSource, /settingKey:\s*"showArchive"/);
assert.match(settingsSource, /settingKey:\s*"versionWarning"/);
assert.match(settingsSource, /defaultValue:\s*true/);
for (const mode of ["auto", "task", "project", "counts", "icon", "full"])
  assert.match(settingsSource, new RegExp(`value:\\s*"${mode}"`));
assert.match(settingsSource, /FileBrowserModal\s*\{/);
assert.match(settingsSource, /folderMode:\s*true/);
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
const widgetSource = fs.readFileSync(path.join(repoRoot, "TrellisDms/TrellisWidget.qml"), "utf8");
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
assert.match(widgetSource, /PopoutService\.openSettingsWithTab\("plugins"\)/);
assert.match(widgetSource, /Current data stays visible until a new coherent snapshot arrives\./);
assert.match(widgetSource, /root\.popoutProjection\.degraded/);
assert.match(widgetSource, /TrellisProjection\.isNewerGeneratedAt\(/);
assert.match(widgetSource, /varName:\s*"detailRequest"/);
assert.match(widgetSource, /varName:\s*"detailResponse"/);
assert.match(widgetSource, /detailRequestVar\.set\(\{[\s\S]*?kind:\s*"markdown"[\s\S]*?projectId:[\s\S]*?taskId:[\s\S]*?document:/);
assert.match(widgetSource, /Text\.MarkdownText/);
assert.match(widgetSource, /Text\.PlainText/);
assert.match(widgetSource, /text:\s*"Back"/);
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
  warnings: [{ code: "trellis_version", message: "Trellis version has not been verified" }]
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

const stateMatrixFixtures = [
  {
    state: "Startup before first Snapshot",
    pill: "icon with no fabricated counts",
    popout: "Loading Trellis status...",
    recovery: "wait without moving focus",
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
    verify() {
      assert.equal(projection.makePillProjection(matrixStaleSession, "auto").activeTaskCount, 0);
      assert.equal(projection.makePopoutProjection(matrixStaleSession).taskCount, 1);
      assert.equal(projection.makePopoutProjection(matrixUnknownVersion).projects[0].version, "99.0.0");
    }
  },
  {
    state: "Degraded scan, archive-unloaded fact, and topology rescan",
    pill: "last-good summary plus warning",
    popout: "retained coherent data while refresh remains pending",
    recovery: "manual refresh without claiming completion early",
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
    verify() {
      assert.equal(projection.makePillProjection(projectionSnapshot, "unknown").mode, "auto");
      assert.equal(projection.makePopoutProjection({ schemaVersion: 1, projects: [], warnings: [] }).projectCount, 0);
      assert.doesNotMatch(daemonSource, /loadPluginState\([^)]*discoveredProjects/);
    }
  }
];

for (const fixtureCase of stateMatrixFixtures) {
  assert.ok(fixtureCase.state && fixtureCase.pill
    && fixtureCase.popout && fixtureCase.recovery,
  "every state-matrix fixture must document pill, popout, and recovery expectations");
  fixtureCase.verify();
}

const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "TrellisDms/plugin.json"), "utf8"));
assert.equal(manifest.version, "0.7.0");

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
assert.equal(paths.resolveMarkdownFile(taskDir, "prd.md", path.join(taskDir, "prd.md")).ok, true);
assert.equal(paths.resolveMarkdownFile(taskDir, "notes.txt", path.join(taskDir, "notes.txt")).reason, "markdown_name");
assert.equal(paths.resolveMarkdownFile(taskDir, "nested/prd.md", path.join(taskDir, "nested/prd.md")).reason, "markdown_name");
assert.notEqual(spawnSync("realpath", ["-e", "--", path.join(taskDir, "missing.md")]).status, 0);
assert.equal(fs.statSync(path.join(taskDir, "design.md")).size, 0);
assert.ok(fs.statSync(path.join(taskDir, "implement.md")).size > paths.markdownByteLimit());
if (fs.existsSync(path.join(taskDir, "escape.md"))) {
  assert.equal(paths.resolveMarkdownFile(taskDir, "prd.md",
    fs.realpathSync(path.join(taskDir, "escape.md"))).reason, "markdown_location");
}

const project = parser.makeProjectSnapshot({
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
}).project;

assert.equal(project.trellisVersion, "0.6.17");
assert.equal(project.tasks.length, 3);
assert.equal(project.tasks[0].storedStatus, "future_custom_status");
assert.equal(project.tasks[0].priority, "P1");
assert.equal(project.tasks[0].progress, null);
assert.equal(project.tasks[0].activeSessionCount, 3);
assert.equal(project.tasks[1].parentId, "live");
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
assert.equal(Array.from(project.tasks[0].childIds).join(","), "child");
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

const snapshot = parser.makeSnapshot([{
  id: project.id,
  name: project.name,
  root: project.root,
  trellisVersion: project.trellisVersion,
  taskRecords: [],
  sessionRecords: []
}], [{ code: "fixture", message: "ok" }], "2026-09-21T00:00:00.000Z");
assert.equal(snapshot.schemaVersion, 1);
assert.equal(snapshot.primaryTaskId, null);
assert.equal(snapshot.projects[0].archiveSummary.loaded, false);
assert.equal(Object.prototype.hasOwnProperty.call(snapshot.projects[0], "markdown"), false);
assert.equal(JSON.stringify(snapshot).includes("not exposed"), false);
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

assert.equal(fs.readFileSync(archivedSeptemberJson, "utf8"), archivedBefore);
assert.equal(fs.statSync(archivedSeptemberJson).mtimeMs, archivedMtimeBefore);

fs.rmSync(fixture, { recursive: true, force: true });
console.log("trellis contract fixtures: ok");
