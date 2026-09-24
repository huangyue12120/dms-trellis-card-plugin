# Trellis DMS Plugin — 设计规格与实施指南

> **本文档的用途**：这是一份交给 AI coding agent 的项目规格书。你（agent）应当先完整阅读本文，再开始任何编码。
>
> **最重要的一条规则**：本文档区分了「已核实事实」和「待验证假设」。凡标注 `[待验证]` 的内容，你**必须先实际查证**（读源码、跑命令、看文件），验证结果写入 `.trellis/tasks/<task>/research/` 后再动手实现。**禁止基于本文档的假设直接写代码**。
>
> **平台边界**：本项目的目标环境是 **Fedora 44 + niri + DankMaterialShell (DMS) + Wayland**。`payprays/codeIsland-dms` 是可参考的 Linux/DMS 项目；`rifqiakrm/code-island` 是 macOS/SwiftUI 项目，只能作为概念来源，**不得作为 Fedora/DMS 实现依据**。
>
> **UI/UX 门禁**：真实前端实现开始前，必须完成第 7 节的 UI/UX Design Gate。优先让用户指定的 `ui-ux-pro-max` 与 `taste` agent plugin/skill 基于真实数据状态和 DMS 约束统一设计，并由用户确认后再写最终 QML UI。
>
> 文档初版日期：2026-09-17。修订日期：2026-09-17。若当前日期距此较远，上游 API 可能已变，请先核对参考链接。

---

## 0. 给 Agent 的前置指令

在写生产代码之前，按顺序完成：

1. 阅读本文全部内容。
2. 执行第 7 节「阶段 0：调研」的全部任务，把事实结论落盘。
3. 与用户确认第 3 节范围，尤其是 P0/P1/P2 和非目标。
4. 可以先完成**无视觉承诺的技术骨架**与数据链路，但不得自行决定最终 pill / popout / desktop 的视觉和交互方案。
5. 数据链路打通后，执行「UI/UX Design Gate」：
   - 若 `ui-ux-pro-max` 与 `taste` 在当前 agent 环境可用，调用它们完成统一设计；
   - 若不可用，停止最终前端设计，并让用户先在其环境中运行这两个 plugin/skill，把设计结果写入 `docs/ui-ux-spec.md` 与 `docs/ui-state-matrix.md`；
   - 用户明确验收 UI/UX 方案后，才进入最终 QML UI 实现。
6. 从第 7 节按阶段实施，每个阶段完成后给出可验证产物；涉及数据模型、外部配置或 UI/UX 决策的阶段必须经过用户验收。

不要试图一次性实现全部功能。本项目的首要风险是**数据契约、路径安全、文件监听和多 session 投影**；视觉风险通过 UI/UX Gate 单独控制。

---

## 1. 项目背景：三个互相独立的系统

本项目涉及三个系统。它们分别是什么、谁依赖谁，必须先分清楚，否则架构会做错。

### 1.1 Trellis（数据源，AGPL-3.0）

Trellis 是一个 **AI 编码工程化框架 / agent harness**。它把项目规范、任务、运行时指针和记忆沉淀到仓库的 `.trellis/` 目录里，让不同 Coding Agent 按统一工程流程工作。

- 官网文档：https://docs.trytrellis.app/
- 架构全景：https://docs.trytrellis.app/zh/beta/advanced/architecture
- 文档索引：https://docs.trytrellis.app/llms.txt
- 仓库：https://github.com/mindfold-ai/Trellis
- 安装：`npm install -g @mindfoldhq/trellis@latest`

**本项目 P0/P1 的原则是只消费 Trellis 在工作目录中生成的数据文件，不链接或复制 Trellis 源代码。** 不在本技术规格中对许可证衍生关系作法律结论；若未来复用 Trellis 源码，再单独进行许可证审查。

### 1.2 trellis-card（参考实现，非依赖）

https://github.com/czm15053/trellis-card —— 一个 Tauri 2 + Rust 的跨平台桌面小工具，以「卡片」和「灵动岛胶囊」形态展示 Trellis 任务进度与 Agent 活动。

**重要定位说明：**

- 本项目**不是** trellis-card 的 fork，**不复用**它的任何代码（它的前端是原生 JS/CSS/GSAP，与 QML 零重叠）。
- trellis-card 的价值在于：它是一份**功能参考**和**Agent hook 接入方案的参考实现**。当我们需要「Agent 实时活动」这类 `.trellis/` 文件里没有的数据时，去读它的 `src-tauri/` 源码学习做法。
- ⚠️ **该仓库目前没有 LICENSE 文件**，属于「保留所有权利」状态。因此：**可以阅读学习其思路，禁止复制其代码片段**。如果最终需要复用其 hook 脚本或事件协议，必须先向作者提 issue 取得授权。

它支持的 Agent 接入方式（作为参考）：

| Agent | 接入位置 |
|---|---|
| Codex | `~/.codex/hooks.json` |
| Claude Code | `~/.claude/settings.json` |
| Cursor | `~/.cursor/hooks.json` |
| Pi | `~/.pi/agent/extensions/` |
| OpenCode | `~/.config/opencode/plugins/` |
| DeepSeek Harness | `~/.config/trellis-card/agents/dsh-trellis-bridge/` |

### 1.3 DankMaterialShell / DMS（宿主平台）

一个基于 Quickshell + Go 的 Wayland 桌面 shell，为 niri、Hyprland、Sway 等合成器设计。插件用 QML 编写。

- 主仓库：https://github.com/AvengeMedia/DankMaterialShell （MIT）
- **插件开发文档（最关键的参考页）**：https://danklinux.com/docs/dankmaterialshell/plugin-development
- 插件概览：https://danklinux.com/docs/dankmaterialshell/plugins-overview
- 官方示例插件：https://github.com/AvengeMedia/DankMaterialShell/tree/master/quickshell/PLUGINS
- 第一方插件：https://github.com/AvengeMedia/dms-plugins
- 插件注册表：https://github.com/AvengeMedia/dms-plugin-registry ／ https://plugins.danklinux.com/
- 共享 QML 组件库：https://github.com/AvengeMedia/dank-qml-common
- Quickshell 本体文档：https://quickshell.org/docs/

### 1.4 关键 Linux 参考项目：codeIsland-dms

https://github.com/payprays/codeIsland-dms

**这是与本项目平台最接近的参考实现，应优先阅读。** 它明确面向 **Linux + Wayland + niri + DankMaterialShell**，当前仓库包含：

```text
plugin.json
CodeIslandWidget.qml
CodeIslandSettings.qml
components/
assets/
lib/
preview/
linux-skeleton/
```

当前已核实的关键事实：

- DMS 侧当前 manifest 是 `type: "widget"`，不是 composite；它证明了 bar widget + popout + settings 的实现方式。
- QML 侧通过 Unix socket 消费 Linux daemon 的 `snapshot.full` / `snapshot.patch`，业务状态不塞进 QML。
- `linux-skeleton/` 是 Python 编写的 **Linux/Wayland reference runtime**，包含 daemon、socket server、OpenCode/Codex/Claude adapter、可选 hook installer 和测试。
- 默认 socket 约定是 `$XDG_RUNTIME_DIR/codeislandd.sock`，无 `XDG_RUNTIME_DIR` 时退化到用户隔离的 `/tmp/codeisland-<uid>/codeislandd.sock`。
- 该仓库是 MIT，可作为 Linux/DMS 架构与 QML 模式参考；若直接复制代码，仍需遵守 MIT 版权声明要求。

**必须与另一个项目区分：**

- `https://github.com/rifqiakrm/code-island` 是原始 **macOS 14+ / SwiftUI + AppKit** 应用。
- 它可以解释 Code Island 的交互理念和事件模型，但**不是 Fedora、Wayland、niri 或 DMS 的技术实现参考**。
- 本项目不得因为 macOS Code Island 的行为而假设 Linux 上存在相同 daemon、hook installer、窗口系统或 IPC 语义。

**我们与 codeIsland-dms 的差异**：它以 AI agent session 为中心；本项目以 **Trellis project / task / session pointer** 为中心。P0/P1 不依赖 CodeIsland daemon。P2 若要接入 Agent 实时活动，可研究它的 Linux daemon 协议，但必须先确认该 `linux-skeleton` 在用户机器上的部署和协议稳定性。

## 2. 用户环境（目标运行环境）

| 项 | 值 |
|---|---|
| 发行版 | Fedora 44 |
| 合成器 | niri |
| Shell | DankMaterialShell (DMS) |
| DMS 版本 | `[待验证]` 跑 `dms --version`；2026-09 当前上游最新稳定版已到 1.6.x |
| Quickshell 版本 | `[待验证]` 跑 `qs --version` / 实际 DMS bundled shell 信息 |
| Qt 版本 | `[待验证]` 预期 Qt 6 |
| Trellis 版本 | `[待验证]` 读取项目 `.trellis/.version` + `trellis --version` |

**已知本机事实**：

- 官方 trellis-card AppImage 在 Fedora 44 + niri 环境表现为黑屏后退出。
- 同一源码在本机执行 `npm run dev` **可以正常运行**，因此不能简单归因为 Trellis Card 本身不兼容 Fedora/niri。
- AppImage 的具体崩溃根因尚未在本项目中通过 stderr / backtrace 精确确认；Tauri AppImage 在纯 Wayland/niri 和较新 Linux 图形栈上的已知问题可能相关，但这不是本 DMS 插件的实现前提。
- **RPM 是否已经成功构建和运行必须以用户本机实测为准，不在本文档中预设。**

本插件选择 DMS 原生形态的原因不是“只有这样才能在 Fedora 运行”，而是：在 niri + DMS 工作流中，bar pill、popout 和可选 desktop widget 比独立 Tauri 浮窗更符合 shell 原生交互。

## 3. 目标与范围

### 3.1 一句话目标

做一个 DMS composite 插件，在 DankBar 上以 pill 形态显示 Trellis 当前项目/任务状态，点击展开 popout 查看多项目、多任务与 session；可选提供 desktop widget。**P0/P1 是纯只读 Trellis observer，Agent tool activity 属于后续独立增强。**

### 3.2 目标（按优先级）

| 优先级 | 目标 |
|---|---|
| **P0** | Bar pill：状态 + 主显示任务名；若存在可靠进度源则显示进度，否则不伪造百分比 |
| **P0** | 配置一个或多个可信项目/扫描根目录，发现 Trellis project |
| **P0** | 保存完整 `projects / tasks / sessions / activeTaskIds`，不因 pill 空间有限而丢失多 session 信息 |
| **P0** | 已知文件变化快速反映；新增/删除任务通过 topology rescan 在可接受时间内反映 |
| **P0** | 设置页 + 无项目/无任务/损坏数据等降级状态 |
| **P1** | Popout：项目筛选、live task 列表、多个 active session、父子关系、priority |
| **P1** | Popout：按需读取 `prd.md` / `design.md` / `implement.md`，Markdown 基础渲染 |
| **P1** | Archive 浏览（与 live tasks 分开） |
| **P2** | Agent 实时活动（provider、tool、permission 等），必须通过独立 activity provider 设计 |
| **P2** | Desktop widget |
| **P2** | i18n（zh_CN + en） |
| **P2** | Launcher surface（例如 `!trellis`） |

### 3.3 非目标（明确不做）

- ❌ **不做独立主题系统**。遵循 DMS `Theme` / Material 3，不能硬编码产品主题色。
- ❌ **不复刻 trellis-card 的关联网络、规范地图等重量级全屏页面**。
- ❌ **P0/P1 不修改任何 `.trellis/` 文件**；插件设置/state 写到 DMS 自己的命名空间。
- ❌ **P0/P1 不安装 Agent hooks、不修改 Codex/Claude/OpenCode 配置**。
- ❌ **不 fork trellis-card，不复制其无明确许可证的代码**。
- ❌ **不把 macOS `rifqiakrm/code-island` 当成 Linux 实现参考**。
- ❌ 首版不针对 Hyprland/Sway 做专门验收；若 DMS 抽象天然兼容可以工作，但目标环境仍是 Fedora 44 + niri。

### 3.4 设计原则

1. **只读、无副作用**：P0/P1 不能影响正在工作的 Trellis / agent。
2. **数据忠实优先于 UI 压缩**：daemon 保存完整 project/task/session 状态；pill 只是其中一个投影视图。
3. **降级可用**：不存在 Trellis project、无 active task、损坏 JSON、未知 status、stale pointer 都要有明确 empty/error state，不能让 shell 崩溃。
4. **事件驱动优先、拓扑扫描兜底**：已知文件用 watcher；新建/删除目录用低频 topology rescan。不要假装存在目录级 `FileView` watcher。
5. **路径安全**：任何 runtime pointer / symlink / markdown path 都必须 canonicalize 并验证仍位于允许的项目/Trellis 范围内。
6. **视觉属于 DMS**：使用 DMS Theme、spacing、字体、圆角、popout 习惯；最终 UI 必须通过 UI/UX Design Gate。
7. **不伪造“实时 Agent 活跃”**：文件 mtime 只能叫 `recentlyChanged`，不能等价于“agent 正在调用工具”。
8. **兼容未知字段和新版本**：解析未知字段宽容，未知 status 可显示但不崩；读取 `.trellis/.version` 并对未验证版本给 warning。

## 4. 核心架构决策

### 4.1 决策：P0/P1 直接读 `.trellis/`，不依赖 trellis-card

Trellis 的任务事实、session pointer 和版本信息都以本地文件形式存在。P0/P1 直接读取这些文件：

- 不要求 trellis-card 正在运行；
- 不需要修改 agent hook；
- 不引入额外 daemon；
- Fedora/niri 下安装成本最低。

**代价**：插件会耦合 Trellis 的磁盘数据契约。因此必须：

- 读取 `.trellis/.version`；
- 把解析集中在 parser 层；
- 用真实项目 + Trellis 自身脚本交叉验证；
- 对未测试版本显示 non-fatal warning。

如果当前 Trellis 已支持 machine-readable CLI（例如 `task.py ... --json`），阶段 0 要验证其实际存在和 schema；它可以作为 parser oracle 或未来 backend，但不能仅因为某个 issue 已关闭就假设当前用户安装版本一定支持。

### 4.2 决策：使用 composite 插件类型

目标结构：

| surface | 根组件 | 职责 |
|---|---|---|
| `daemon` | `PluginComponent` | 唯一数据采集实例：发现项目、解析、watch、topology rescan、构建 snapshot |
| `widget` | `PluginComponent` | DankBar pill + popout，只消费 snapshot |
| `desktop` | `DesktopPluginComponent` | P2 可选桌面部件 |
| `launcher` | launcher object | P2 可选任务搜索 |

**为什么必须把采集放 daemon**：widget 可能因多屏/多 bar 创建多个实例。所有 filesystem 工作应只发生一次。

surface 之间通过 global var 共享**单一一致 snapshot**，而不是分别写多组可能短暂不一致的变量：

```text
pluginService.setGlobalVar(pluginId, "snapshot", snapshot)
```

widget 用 `PluginGlobalVar` 响应式读取。用户偏好用 Settings；上次选择项目、固定任务、折叠状态等用 State。

`requires_dms` 的最低版本必须在阶段 0 根据用户当前 DMS 和 composite API 实测确认；不要只抄文档中的历史版本号。

### 4.3 数据流

```text
用户配置的 project/scan roots
          │
          ├── topology discovery（低频 / 设置变化 / 手动刷新）
          │
          ▼
  已发现 Trellis projects
          │
          ├── .trellis/.version
          ├── tasks/*/task.json
          ├── .runtime/sessions/*.json
          └── archive/（P1 懒加载）
                    │
                    ├── known-file watchers
                    └── safe path resolver
                              │
                              ▼
                     [daemon] ProjectSnapshot[]
                              │
                              │ setGlobalVar("snapshot", ...)
                              ▼
                     [widget] 纯投影
                         ┌────┴─────┐
                       pill       popout
```

**两类更新必须区分：**

- **内容变化**：已知 `task.json` / session pointer 文件可用 `FileView.watchChanges` 或验证后的等价 watcher，变化后 reload。
- **拓扑变化**：新建/删除 task、archive move、新增/删除 session 文件不能假设 `FileView` 能监听目录；用 topology rescan 或阶段 0 验证出的目录模型。

建议验收目标：

- 已知文件内容变化：≤ 2 s；
- 新增/删除目录或文件：默认 ≤ 15–30 s；
- 手动刷新：立即重新扫描。

### 4.4 内部数据模型：完整状态先于 UI

daemon 至少输出以下概念模型（字段名可在实现时微调）：

```text
Snapshot
├── generatedAt
├── projects[]
├── primaryProjectId
├── primaryTaskId
└── warnings[]

ProjectSnapshot
├── id
├── name
├── root
├── trellisVersion
├── tasks[]
├── sessions[]
├── activeTaskIds[]
├── archiveSummary
└── errors[]

TaskSnapshot
├── id / dirName
├── title
├── storedStatus
├── runtimeState
├── displayState
├── priority
├── parentId
├── childIds[]
├── activeSessionCount
├── progress: number|null
├── recentlyChanged
└── paths (validated, internal only)

SessionSnapshot
├── sessionKey
├── taskId|null
├── source
├── mtime
└── stale/error metadata
```

**primary task 是 UI 选择策略，不是数据事实。** 建议优先级：

1. 用户 pin 的 task（仍有效时）；
2. 当前选中项目中的 active task；
3. 多 active task 时取最近 session pointer，仅作为 pill 的 primary；
4. 没有 active task 时显示项目状态/“无活动任务”。

其余 active tasks 仍必须留在 snapshot，并在 pill 上可用 `+N` 或 popout 展示。

### 4.5 安全路径解析

所有 session pointer、task directory、archive path 和 markdown 文件访问必须经过同一个安全 resolver：

1. 拒绝绝对路径（除非它正是用户显式配置的 project root）；
2. 拒绝未经规范化的 `..` 越界；
3. canonicalize / resolve symlink；
4. 验证最终路径仍位于对应 project 的允许 `.trellis/tasks/` 或 `.trellis/archive/` 内；
5. task directory 必须包含可读取 `task.json`；
6. Markdown 只能访问已验证 task directory 下固定允许文件名；
7. 设置文件大小、任务数、Markdown 读取上限，超限返回 warning，不阻塞 shell。

不要把 runtime pointer 直接字符串拼接到 project root 后读取。

## 5. 数据模型：Trellis 文件结构

> 以下来自 Trellis 官方架构文档，**目录结构和状态值是已核实事实**；`task.json` 内部的**具体字段名标注为 `[待验证]`**，必须用真实文件确认。

### 5.1 任务目录

每个任务是一个目录：

```
.trellis/tasks/<MM-DD-slug>/
├── task.json          # 状态、优先级、负责人、分支、PR URL、父子任务关系和扩展元数据
├── prd.md             # 需求、约束、验收标准和 out-of-scope
├── design.md          # 复杂任务的技术设计：边界、contract、数据流、兼容性、取舍
├── implement.md       # 复杂任务的执行计划：有序 checklist、验证命令、review gate、回滚点
├── implement.jsonl    # 实现上下文使用的 spec / research manifest
├── check.jsonl        # Review 和验证上下文使用的 spec / research manifest
└── research/          # trellis-research 或规划流程写入的调研产物
```

目录名格式为 `<MM-DD-slug>`（例：`09-17-add-rpm-packaging`）。

JSONL 每行是一个普通文件引用，形如 `{"file": ".trellis/spec/xxx.md", "reason": "..."}`；**没有 `file` 字段的 seed row 应当跳过**。

### 5.2 状态模型：持久状态与运行时状态分层

当前 Trellis 的磁盘 task status 与 runtime pseudo-state 不是同一个概念，不应混成一个 enum。

**A. `storedStatus`：来自 `task.json.status`**

当前常见主流程：

| storedStatus | 含义 |
|---|---|
| `planning` | planning artifact 阶段 |
| `in_progress` | 已 start，实施/检查阶段 |
| `completed` | archive 命令写入的瞬时状态，随后任务被移动到 archive；正常 live 列表里通常不会长期存在 |
| `<custom/unknown>` | Trellis workflow 允许 fork/custom status；插件要宽容显示 |

**B. `runtimeState`：由 session pointer / 数据健康推导**

建议至少：

| runtimeState | 含义 |
|---|---|
| `active` | 至少一个有效 session pointer 指向该 task |
| `inactive` | task 存在，但当前无 session pointer |
| `none` | 当前项目没有活动 task |
| `stale` | session pointer 指向不存在/已移动 task |
| `error` | task.json 缺失、损坏或无可用 status |

Trellis workflow runtime 还存在 `no_task`、`task_error`、`stale_<source>` 等 pseudo-state；这些属于运行时解析结果，而不是应写回 task.json 的 task status。

**C. `displayState`：UI 投影**

`displayState` 只能由 `storedStatus + runtimeState (+ P2 activity)` 投影。P0/P1 不要创造“等待授权/正在调用工具”等状态；那需要真实 agent event。

`completed` 在正常流程中应归入 **Archive** 视图，不作为 live list 的长期第三组。

### 5.3 当前活动任务指针：必须保留多 session

```text
.trellis/.runtime/sessions/<session-key>.json
```

Trellis 支持 session-scoped active task。**同一仓库可能同时有多个 AI session，且指向不同 task。**

因此 daemon 必须：

- 读取全部 session pointer；
- 建立 `session -> task` 和 `task -> activeSessionCount`；
- 不在数据层只保留“最新一个 session”；
- 对 stale / malformed session 单独记录 warning；
- pill 需要一个主显示 task 时，按 4.4 的 primary policy 选择，但 popout 仍展示全部 active tasks/sessions。

`.trellis/.current-task` 若用户安装版本仍存在，只能作为 `[待验证]` 的 legacy / CLI fallback，阶段 0 必须根据真实 Trellis 版本确认，不能写死为永久接口。

### 5.4 其他相关路径

| 路径 | 内容 / 用途 |
|---|---|
| `.trellis/.version` | **必须读取**；记录项目模板版本，做兼容 warning |
| `.trellis/workflow.md` | workflow-state contract，可用于理解 custom status |
| `.trellis/spec/` | 团队规范库；本插件 P0/P1 不读取全文 |
| `.trellis/workspace/<developer>/journal-*.md` | session journal；本插件 P0/P1 默认不解析 |
| `.trellis/scripts/task.py` | 任务 CLI；阶段 0 用 `--help` 验证当前 machine-readable 能力 |
| `.trellis/scripts/common/task_store.py` | task.json schema 的重要实现来源，阶段 0 与真实文件交叉验证 |
| `.trellis/config.yaml` | 项目配置；仅在真正需要时读取 |
| `.trellis/archive/<YYYY-MM>/...` | `[待验证]` 当前版本归档布局；P1 懒加载 |

### 5.5 任务生命周期事件

当前主流程可按以下事实理解：

| 事件 | 结果 |
|---|---|
| create | 创建 task；在有 session identity 时可建立 session pointer；status 为 `planning` |
| start | status → `in_progress`，确保当前 session pointer 指向 task |
| finish | 清当前 session pointer；status 通常保持不变 |
| archive | status 写为 `completed`，随后移动到 archive，并清理仍指向它的 session pointer |

本插件 P0/P1 **不注册 Trellis lifecycle hooks**，而是观察文件结果。表格用于解释为什么某些文件会变化。

### 5.6 Progress 语义

`progress` 必须定义成 `number | null`。

阶段 0 要验证：

1. 当前 `task.json` 是否有权威 progress 字段；
2. `implement.md` checklist 是否在用户的真实任务中稳定存在、且是否代表整体任务完成度；
3. parent/child task 是否需要独立计算。

在没有可靠语义前：

- pill **不显示虚构百分比**；
- 可以显示 status、active session 数或可解释的 checklist `x/y`；
- 若采用 checklist 算法，必须在 UI/README 明确其含义是“implement checklist completion”，不是“Agent 总体完成百分比”。

## 6. P2：Agent 实时活动 — 独立 Activity Provider 层

`.trellis/` 可以告诉我们任务和 session pointer，但不能可靠告诉我们“agent 此刻正在调用哪个 tool / 等权限 / 已停止”。**P0/P1 不解决这个问题。**

### 路径 A：Trellis-only（默认、零副作用）

只显示：

- task stored/runtime state；
- session pointer；
- `recentlyChanged`（如果文件最近发生变化）。

**禁止把 mtime 映射成“Agent 正在工作”。** 它只能表示 Trellis 数据最近变化。

这是 P0/P1 的默认模式。

### 路径 B：接入 `codeIsland-dms` 的 Linux daemon（P2 候选，需验证）

这里指的是：

- `payprays/codeIsland-dms`
- 它的 `linux-skeleton/` Python daemon / adapters
- `$XDG_RUNTIME_DIR/codeislandd.sock`

**不是** macOS 的 `rifqiakrm/code-island`。

Linux skeleton 已展示 OpenCode、Codex、Claude 的 adapter/hook + Unix socket 模型；DMS widget 消费 `snapshot.full` / `snapshot.patch`。它可以成为一个可选 activity source，但必须注意：

- `linux-skeleton` 自己把定位写成 Phase 0 / reference skeleton，不能先验当作稳定公共 API；
- 当前 codeIsland-dms manifest 是 widget，daemon 不是 DMS 自动内嵌 surface；用户是否实际运行 daemon 必须检测；
- 我们只需要最小字段：provider、sessionId、cwd/project、event/tool、timestamp、permission state；
- 默认**不采集、不持久化 prompt、assistant text、tool input/output**；
- 必须验证如何把 CodeIsland session 的 cwd/session 映射到 Trellis project/task；
- socket 不存在时无错误降级到 Trellis-only。

如果走这条路，在 `lib/activity/CodeIslandAdapter.*` 中隔离协议，不得污染 Trellis parser。

### 路径 C：自己安装 Linux Agent hooks（P2，高维护成本）

若未来确实需要，不应再假设“hooks 只能指向一处”。不同 agent 配置方式不同，正确目标是：

- 幂等 merge，保留用户已有 hooks/plugins；
- 安装前 backup；
- 卸载时只删除本插件自己的条目；
- 避免 global + project 双重安装造成重复事件；
- Codex/Claude 的 trust / permission 行为必须实测；
- daemon 不可用或 interaction timeout 时 fail-open，不阻断 agent 原生流程；
- hook 功能默认关闭，由用户明确启用。

`codeIsland-dms/linux-skeleton` 可以作为 Linux 合并策略和 socket bridge 的参考；macOS Code Island 只能作概念对照。

### 路径 D：未来的 trellis-card headless / IPC

如果 trellis-card 上游未来提供稳定 headless/IPC，可以增加 adapter。当前不能把这个不存在的接口作为 P0/P1 依赖。

### P2 决策

1. P0/P1：只做 A。
2. P2 首先评估 B，前提是 Linux daemon 在用户环境可稳定运行并且协议足够明确。
3. B 不满足时再评估 C。
4. 所有 P2 provider 都必须实现相同内部 `ActivityEvent` 接口，UI 不直接依赖某个 agent 或某个 daemon。

## 7. 任务分块与实施计划

原则：技术事实先验证；数据链路先于真实 UI；**UI/UX 设计先于最终前端实现**；Agent activity 最后单独做。

---

### 阶段 0：调研（不写生产代码）

**目标**：把 P0/P1 的 `[待验证]` 变成真实事实。

| # | 调研任务 | 产出 |
|---|---|---|
| 0.1 | `dms --version`，确认用户真实 DMS 版本、plugin API、composite 支持 | `research/environment.md` |
| 0.2 | 确认 Quickshell/Qt 版本及 DMS 1.6 是否 bundled shell，不能假设独立 `qs` 版本就是实际运行版本 | 同上 |
| 0.3 | 读取真实项目 `.trellis/.version` + `trellis --version` | Trellis version matrix |
| 0.4 | `tree -a .trellis/`（控制输出量），确认 tasks/runtime/archive 实际布局 | `research/trellis-data-model.md` |
| 0.5 | 读取多个 `task.json`：planning、in_progress、archive/completed 样本；记录字段、类型、可选性 | schema |
| 0.6 | 读当前项目 `.trellis/scripts/common/task_store.py` 与相关 active-task resolver | schema + pointer contract |
| 0.7 | 读取全部 `.trellis/.runtime/sessions/*.json` 样例；确认 stale / multi-session 情况 | session schema |
| 0.8 | `python3 ./.trellis/scripts/task.py --help`，实际验证 `list/current` 是否支持 `--json` 或其他 machine-readable 输出；**不要仅凭 issue #395 已关闭推断** | CLI capability |
| 0.9 | 验证 progress：task.json 字段 / implement checklist / 无权威来源 | `research/progress-semantics.md` |
| 0.10 | 验证 archive 路径和大量归档任务布局 | archive contract |
| 0.11 | 核实 Quickshell `FileView.watchChanges` 只针对已知文件；调查目录拓扑发现方案（FolderListModel / 其他 QML API / Proc+find） | watcher decision |
| 0.12 | 读当前 DMS plugin skill/docs 和 ExampleCompositePlugin；核实 directory naming、manifest、global vars、Settings/State | `research/dms-api.md` |
| 0.13 | 核实 `Theme` 可用语义色、spacing、字体、圆角、motion 相关 API | UI constraints |
| 0.14 | 完整阅读 `payprays/codeIsland-dms` 的 DMS QML 与 `linux-skeleton/README.md`；明确它是 Linux 参考；记录 socket protocol 是否值得 P2 使用 | `research/codeisland-linux.md` |
| 0.15 | 明确 `rifqiakrm/code-island` 是 macOS 项目，只记录“非实现参考”，避免后续 agent 混用 | research note |
| 0.16 | 设计并测试安全 path resolver：`..`、absolute、symlink escape、stale pointer | `research/path-safety.md` |

**阶段 0 验收**：

- `research/trellis-data-model.md`
- `research/dms-api.md`
- `research/progress-semantics.md`
- `research/path-safety.md`
- `research/codeisland-linux.md`

所有后续代码只能引用这些调研后的真实 schema。

---

### 阶段 1：技术骨架（允许丑，但不能先定 UI）

**目标**：确认 composite 生命周期和 daemon→widget 数据共享可用。

1. 开发目录建议使用 `TrellisDms/`（PascalCase），plugin id 使用 `trellisDms`（camelCase）；二者**不要求完全一致**。
2. working product name 用 `Trellis DMS`，最终公开名称可在 UI/UX Gate 决定，避免与独立项目 `trellis-card` 混淆。
3. 建最小：
   - `plugin.json`
   - `TrellisDaemon.qml`
   - `TrellisWidget.qml`
   - `TrellisSettings.qml`
4. daemon 写一个硬编码 `snapshot` global var。
5. widget 只显示调试文本，例如 `Trellis DMS · skeleton`，**不做最终 pill 视觉**。
6. 多显示器下验证 daemon 只有一个采集实例、widget 可有多个实例。
7. 验证 hot reload / plugin reload。

`plugin.json` 示例（字段最低版本以阶段 0 实测为准）：

```json
{
  "id": "trellisDms",
  "name": "Trellis DMS",
  "description": "Read-only Trellis task observer for DankMaterialShell",
  "version": "0.1.0",
  "author": "<your name>",
  "icon": "dashboard",
  "type": "composite",
  "capabilities": ["daemon", "dankbar-widget"],
  "components": {
    "daemon": "./TrellisDaemon.qml",
    "widget": "./TrellisWidget.qml"
  },
  "settings": "./TrellisSettings.qml",
  "requires_dms": ">=<verified-version>",
  "permissions": ["settings_read", "settings_write"]
}
```

**验收**：plugin 可启用；daemon 发布 snapshot；多个 bar widget 只消费 snapshot。

---

### 阶段 2：数据链路（P0 核心）

**目标**：真实 Trellis 状态进入统一 Snapshot，不做最终视觉。

1. 项目来源：
   - 默认**不要扫整个 `$HOME`**；
   - 用户配置可信 root；
   - 内部统一为 `projectRoots[] / scanRoots[]`；
   - 首版 Settings 若不方便编辑数组，可以用一项 root + 后续多 root 增强，但数据层不要绑定单值假设。
2. 项目发现：
   - 限深度；
   - 缓存结果；
   - 目录枚举优先使用阶段 0 验证的原生 QML 方案；
   - 若必须 `Proc`，用参数数组调用系统工具，不拼接 shell 字符串，不依赖非默认安装的 `fd`；同时添加 `process` permission。
3. 每个 project 读取 `.trellis/.version`。
4. 解析 tasks、全部 session pointers。
5. 实现 safe path resolver。
6. 构建单一 immutable-ish `Snapshot`，一次性 `setGlobalVar("snapshot", snapshot)`。
7. watcher：
   - 已知文件内容变化立即 reload；
   - topology rescan 默认 15–30 s；
   - 设置变化和手动刷新立即 rescan。
8. 错误限流：同一损坏文件不要每轮刷 console。
9. 设置上限：单 JSON 文件、单 Markdown、task 数、project 数均需合理保护值。

**验收**：

- 修改现有 `task.json` 后 ≤2s 更新 snapshot；
- 新建/删除 task 在 topology interval 内出现/消失；
- 两个 session 指向不同 task 时 snapshot 同时保留；
- stale pointer / malformed JSON 不让 DMS 崩溃；
- `../` / symlink escape fixture 被拒绝。

---

### 阶段 2.5：UI/UX Design Gate（必须完成后才能写最终前端）

**这是正式 gate，不是可选建议。**

输入必须包括：

- 阶段 0 的真实 DMS Theme/API 限制；
- 阶段 2 的真实 Snapshot schema；
- DMS bar 的 horizontal / vertical 两种轴向；
- niri + 多屏使用场景；
- DMS 原生 Material 3 视觉语言；
- 用户希望“比独立 Trellis Card 浮窗更方便”的核心目标。

优先使用用户指定的两个设计 agent plugin/skill：

1. `ui-ux-pro-max`：负责信息架构、状态层级、布局、可访问性、响应式尺寸。
2. `taste`：负责视觉一致性、节奏、细节、动效克制、去除“AI UI”感。

两者应共同产出并统一，而不是各做一套：

- `docs/ui-ux-spec.md`
- `docs/ui-state-matrix.md`
- `docs/ui-component-contract.md`
- 可选 wireframe / mockup / screenshot reference

**至少覆盖以下 UI 状态：**

1. no project configured
2. project discovered, no active task
3. planning task
4. one active in-progress task
5. multiple active tasks / multiple sessions
6. long project/task names
7. stale session pointer
8. malformed task / version warning
9. loading/rescan
10. archive view
11. horizontal bar
12. vertical bar
13. narrow/normal/wide popout
14. keyboard focus/selection
15. desktop widget（若 P2 决定做）
16. P2 agent activity card（只定义预留槽位，不要求首版实现）

**设计约束：**

- 只能使用 DMS Theme / semantic colors；
- 不自建主题 picker；
- 状态不能只靠颜色区分；
- 动画必须支持 reduced-motion / 至少避免持续高频动画；
- `recentlyChanged` 不得画成“agent 正在工作”的强语义呼吸灯；
- pill 必须在极窄宽度下有可预测 fallback；
- 多 active task 不得被 UI 隐式丢失，应有 `+N`/stack/summary 方案；
- error/warning 不能抢占正常任务的主视觉；
- Markdown 详情不是主层级，按需进入二级视图。

**验收**：用户明确确认最终设计方案。未验收，不进入阶段 3。

---

### 阶段 3：真实 Bar Pill + Popout（P0/P1）

严格按已批准 `docs/ui-ux-spec.md` 实现，不自行再设计。

功能：

1. pill 显示 primary task/project 投影；
2. 多 active task 用已批准的聚合方式提示；
3. popout 显示项目筛选 + live task；
4. live task 分组基于真实状态（例如 active / planning / inactive），**不要固定“已完成”组**；
5. archive 是单独入口；
6. parent/child、priority、session count 按设计展示；
7. empty/error/version-warning 状态全部实现；
8. 支持 horizontal / vertical bar。

**验收**：逐项对照 UI state matrix。

---

### 阶段 4：任务详情与 Markdown（P1）

1. 点击 task 后按需读取 `prd.md` / `design.md` / `implement.md`。
2. 文件路径必须经过 safe resolver。
3. Markdown 读取有大小上限，不把全文长期塞进 global snapshot。
4. `[待验证]` DMS/dank-qml-common 是否已有 Markdown component；否则验证 `Text.MarkdownText` 的可接受范围。
5. GFM 表格、task list 等超出 QML 基础能力时优先做 graceful fallback，不为了完整 Markdown 引入重型 WebView。

**验收**：真实 PRD/Design/Implement 可阅读；大文件不冻结 shell。

---

### 阶段 5：设置、错误恢复与性能（P1）

建议设置：

| setting | 说明 |
|---|---|
| project/scan root(s) | 用户可信扫描范围；UI 表达由 UX spec 决定 |
| topology interval | 15–300 s；已知文件 watcher 不依赖它 |
| showProgress | 仅 progress 非 null 时有意义 |
| showArchive | archive 入口/加载 |
| pillMode | compact / normal（若 UX Gate 保留） |
| versionWarning | 是否显示未测试 Trellis version warning |

**不要**因为“当前没有 Trellis project”而让 `startupCheck` 失败。正确行为是插件正常加载并显示 empty state，用户仍能进入设置配置 root。

`startupCheck` 仅用于真正的**硬依赖**，例如未来某个 P2 provider 明确要求的外部 daemon/binary；而且 P2 provider 应尽量可选，不应阻止 Trellis-only 模式启动。

性能验收：

- DMS idle 时无高频轮询；
- 大量 archive 默认不加载；
- global snapshot 不包含 Markdown 全文；
- 多 widget 实例不会复制 filesystem watcher；
- 设置改变后无残留 timer/watcher。

---

### 阶段 6：可选增强（P2 UI surface）

- `DesktopPluginComponent`；
- Control Center integration；
- i18n；
- launcher surface；
- 发布到 DMS plugin registry。

每增加一个新 surface，先补充 UI/UX spec 对应状态，再实现。

---

### 阶段 7：Agent Activity Provider（P2，独立项目阶段）

顺序：

1. 定义内部 `ActivityEvent` / `ActivitySnapshot` contract；
2. 研究 `codeIsland-dms/linux-skeleton` socket adapter（Linux only）；
3. 若用户环境已有 daemon，做只读 socket adapter prototype；
4. 评估 cwd/session→Trellis project/task 映射准确性；
5. 只有 socket 路线不满足需求时才评估自装 hooks；
6. P2 UI 仍需再次经过 `ui-ux-pro-max` + `taste` 更新设计状态矩阵。

隐私要求：

- 默认不保存 prompt、assistant response、tool input/output；
- 只保留显示实时状态所需最小 metadata；
- 所有 interaction/permission 回写功能默认不做，除非用户后续明确改变“只读 observer”范围。

## 8. DMS 插件 API 速查

> 以当前 DMS 源码/skill 为最终准则；以下内容在阶段 0 必须对用户安装版本复核。

### 8.1 命名与 manifest

当前 DMS 插件开发约定：

- directory：推荐 PascalCase，例如 `TrellisDms/`
- plugin id：camelCase，例如 `trellisDms`
- QML 文件：PascalCase
- JS helper：camelCase
- composite 使用 `components`，不要同时再写 `component`

**目录名与 plugin id 不要求完全相同。**

### 8.2 常用 import

```qml
import QtQuick
import Quickshell
import Quickshell.Io
import qs.Common
import qs.Services
import qs.Widgets
import qs.Modules.Plugins
```

按实际组件最小化 import；不要把不用的模块全部塞给每个文件。

### 8.3 PluginComponent / surface

Widget / daemon 通常基于 `PluginComponent`。常见注入上下文包括 `pluginData`、`pluginService`、`pluginId`，widget 还有 axis/screen/bar 相关属性；**具体属性以当前 DMS skill/source 为准，不重复声明同名注入属性。**

Desktop 使用 `DesktopPluginComponent`。Launcher 有自己的 contract。

### 8.4 Settings / State / Global Var

| 机制 | 用途 |
|---|---|
| Settings | 用户持久偏好，例如 roots、显示选项 |
| State | 插件运行过程中需要跨重启保存的 UI state，例如 pin task、上次项目 |
| Global Var | daemon→widget 的进程内实时 snapshot，不作为持久存储 |

建议只发布一个：

```text
snapshot
```

避免 `tasks`、`sessions`、`activeTask` 分多次 set 导致短暂不一致。

### 8.5 权限

常见 manifest permissions：

- `settings_read`
- `settings_write`
- `process`
- `network`

P0/P1：

- 基础模式只需要 settings 权限；
- 若项目目录发现最终使用 `Proc`/外部 `find`，再添加 `process`；
- 不需要 `network`。

使用外部命令时：

- 参数数组优先；
- 不把用户路径拼成 `sh -c`；
- 不依赖 `fd` 等可能未安装工具，除非 startup dependency 明确声明；
- callback 要绑定 owner，避免组件销毁后回调。

### 8.6 FileView 注意

`FileView.watchChanges` 的目标是 **`path` 指向的已知文件**。它可以用于 task.json / session pointer 文件内容更新，但不能在设计上假装它能递归监听整个 tasks 目录的新建/删除。

blocking read 会冻结 UI，谨慎使用。Markdown 大文件应按需异步/受限读取。

### 8.7 调试命令

```bash
dms ipc call plugins list
dms ipc call plugins status trellisDms
dms ipc call plugins reload trellisDms
dms restart
```

插件开发目录示例：

```bash
mkdir -p ~/.config/DankMaterialShell/plugins
ln -sfn ~/repos/trellis-dms/TrellisDms   ~/.config/DankMaterialShell/plugins/TrellisDms
```

实际扫描/启用行为以本机 DMS 版本为准。

## 9. 风险清单

| 风险 | 影响 | 缓解 |
|---|---|---|
| task.json schema 与假设不符 | 状态解析错误 | 阶段 0 真实样本 + task_store 交叉验证 |
| Trellis 版本升级 / migration | 旧 parser 静默误读 | 读取 `.trellis/.version`；未知版本 warning；fixture regression |
| custom status | UI 崩/错误归类 | storedStatus 允许 unknown/custom；display fallback |
| 多 session 被简化成一个 | 用户看到错误“当前任务” | daemon 永远保存全部 sessions/activeTaskIds；primary 只在 UI 计算 |
| 把 mtime 当 Agent activity | 误导用户 | 只叫 `recentlyChanged`；真实 tool activity 留 P2 |
| FileView 不能监控目录拓扑 | 新任务/归档不出现 | known-file watcher + topology rescan |
| 全盘扫描 `$HOME` | 卡 shell / 权限噪声 | 默认不扫 `$HOME`；可信 roots + 限深 + cache |
| 目录枚举需要外部命令 | 增加 process permission | 阶段 0 优先验证原生 QML；fallback 用安全 argv |
| session pointer `..` / symlink escape | 读取项目外文件 | canonical safe resolver + containment check + fixtures |
| 超大 JSON/Markdown/归档 | shell 卡顿 / 内存涨 | size/count limits；archive/markdown 懒加载 |
| JSON 临时半写 / malformed | 闪烁或 crash | try/catch、短 debounce/retry、保留 last-good snapshot |
| 多显示器 widget 多实例 | 重复 watcher/scan | filesystem 逻辑只放 daemon |
| DMS API 变化 | 插件加载失败 | requires_dms + 当前 source/skill 验证 |
| 无 project 时 startupCheck 阻断 | 用户无法配置 | no-project 作为正常 empty state |
| codeIsland-dms Linux daemon 协议仍偏 reference | P2 adapter 不稳定 | P2 可选、隔离 adapter、protocol version/feature detection |
| 混用 macOS Code Island 代码/假设 | Fedora 实现走错方向 | 文档明确 macOS 非实现参考；review gate |
| Agent hook merge/卸载出错 | 破坏用户配置 | P0/P1 不碰 hooks；P2 backup + idempotent merge + own-entry removal |
| global+project hook 重复 | 同一事件重复上报 | P2 安装检查与去重 |
| UI 自行设计偏离 DMS | 体验割裂 / 返工 | 阶段 2.5 UI/UX Gate + 用户验收 |
| 状态只靠颜色 | 可访问性差 | icon/text/shape 辅助；遵守 UX spec |
| 持续呼吸动画 | 分心/功耗 | 只对有真实语义状态使用；支持低动效策略 |

## 10. 仓库结构建议

```text
trellis-dms/
├── TrellisDms/
│   ├── plugin.json
│   ├── TrellisDaemon.qml
│   ├── TrellisWidget.qml
│   ├── TrellisSettings.qml
│   ├── TrellisDesktop.qml              # P2
│   ├── components/
│   │   ├── StatusIndicator.qml
│   │   ├── TaskCard.qml
│   │   ├── TaskList.qml
│   │   ├── ProjectSwitcher.qml
│   │   ├── EmptyState.qml
│   │   └── MarkdownView.qml
│   ├── lib/
│   │   ├── trellisParser.js            # 纯 schema → model；不做 UI
│   │   ├── trellisPaths.js             # canonicalize / containment / safe resolver
│   │   ├── projection.js               # domain model → display model
│   │   ├── discovery.js                # 若 QML/JS 方案适合则放项目发现
│   │   ├── format.js
│   │   └── activity/                    # P2
│   │       └── codeIslandAdapter.js
│   └── translations/
│       └── zh_CN.json
├── tests/
│   └── fixtures/
│       ├── normal/
│       ├── multi-session/
│       ├── unknown-status/
│       ├── malformed-json/
│       ├── stale-pointer/
│       ├── path-traversal/
│       ├── symlink-escape/
│       ├── archived/
│       └── large-files/
├── research/
│   ├── environment.md
│   ├── trellis-data-model.md
│   ├── dms-api.md
│   ├── progress-semantics.md
│   ├── path-safety.md
│   └── codeisland-linux.md
├── docs/
│   ├── ui-ux-spec.md
│   ├── ui-state-matrix.md
│   └── ui-component-contract.md
├── screenshots/
├── LICENSE
└── README.md
```

关键边界：

- `trellisParser.js`：只处理数据格式；不知道 DMS 视觉。
- `trellisPaths.js`：所有磁盘路径安全集中处理，其他代码不得私自拼 pointer path。
- `projection.js`：把完整 domain state 投影成 pill/popout 所需字段；UI 不重复业务规则。
- `activity/`：P2 外部实时事件 provider，和 P0/P1 Trellis parser 解耦。
- Markdown 正文不要长期存入全局 snapshot。
- 若目录发现最终必须用 QML object/Proc 而不是 JS，保留同样的职责边界即可，不强求文件扩展名。

建议项目自身使用 MIT（与 DMS / codeIsland-dms 生态兼容），但如果复制任何第三方 MIT 代码而不是独立实现，保留其版权/许可证声明。trellis-card 当前无明确 LICENSE，因此只参考行为与公开接口，不复制源码。

## 11. 附录：参考链接汇总

**DMS / Fedora / 插件开发**

- DMS 插件开发：https://danklinux.com/docs/dankmaterialshell/plugin-development
- DMS 仓库：https://github.com/AvengeMedia/DankMaterialShell
- DMS plugin skill（源码中）：https://github.com/AvengeMedia/DankMaterialShell/tree/master/.agents/skills/dms-plugin-dev
- 第一方插件：https://github.com/AvengeMedia/dms-plugins
- plugin registry：https://github.com/AvengeMedia/dms-plugin-registry
- Fedora 安装文档：https://danklinux.com/docs/dankmaterialshell/installation

**Quickshell**

- 文档：https://quickshell.org/docs/
- FileView：https://quickshell.org/docs/v0.3.1/types/Quickshell.Io/FileView/

**Trellis**

- 文档：https://docs.trytrellis.app/
- 架构：https://docs.trytrellis.app/zh/beta/advanced/architecture
- 仓库：https://github.com/mindfold-ai/Trellis
- workflow runtime contract：https://github.com/mindfold-ai/Trellis/blob/main/.trellis/spec/cli/backend/workflow-state-contract.md
- machine-readable CLI 需求历史（只作调查线索，不代表用户版本一定支持）：https://github.com/mindfold-ai/Trellis/issues/395

**Linux / DMS 参考项目（优先）**

- codeIsland-dms：https://github.com/payprays/codeIsland-dms
- Linux skeleton README：https://github.com/payprays/codeIsland-dms/blob/main/linux-skeleton/README.md
- 该项目用于参考 Linux/Wayland/niri 下的 QML、socket、adapter/hook 架构。

**macOS 概念来源（非实现参考）**

- 原始 Code Island：https://github.com/rifqiakrm/code-island
- 这是 macOS 14+ / SwiftUI + AppKit 项目。不要从中推断 Fedora/Wayland/DMS 的运行时、窗口、daemon 或 hook 部署方式。

**trellis-card**

- https://github.com/czm15053/trellis-card
- 功能参考；P0/P1 不依赖；当前无明确 LICENSE 时不复制代码。

---

## 12. 变更记录

| 日期 | 变更 |
|---|---|
| 2026-09-17 | 初版 |
| 2026-09-17 | 二次审查：纠正 macOS `code-island` 与 Linux `codeIsland-dms` 混用；以 Fedora 44 + niri + DMS 为平台边界 |
| 2026-09-17 | 增加 UI/UX Design Gate：`ui-ux-pro-max` + `taste` 统一设计后用户验收，才实现最终 QML |
| 2026-09-17 | 状态模型拆分 stored/runtime/display；completed 移入 archive 语义；保留 custom/unknown status |
| 2026-09-17 | 多 session 改为完整保留，primary task 仅为 UI 投影 |
| 2026-09-17 | FileView 改为 known-file watcher + topology rescan，不再假设目录递归 watcher |
| 2026-09-17 | 增加 `.trellis/.version`、安全 path resolver、size/count limits、last-good snapshot |
| 2026-09-17 | progress 改为 nullable；禁止无权威来源时伪造百分比 |
| 2026-09-17 | 无 Trellis project 改为正常 empty state，不再用 startupCheck 阻断插件启用 |
| 2026-09-17 | P2 重构为 Activity Provider；Linux codeIsland daemon 仅作可选 adapter，hooks 延后 |
| 2026-09-17 | DMS 命名纠正：directory 推荐 PascalCase、plugin id camelCase，不要求相同 |
