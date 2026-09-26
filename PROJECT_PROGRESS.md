# Trellis DMS Plugin：v0 → v1.0 项目进度清单

本清单把 [`trellis-dms-plugin-spec-revised.md`](./trellis-dms-plugin-spec-revised.md) 的目标拆成可以独立实现、验证和回退的版本。版本号表示产品成熟度，不代表 Trellis 或 DMS 的版本号。

## 路线图使用约定

- `v0` 是规划与事实冻结阶段；`v0.x` 是可迭代的开发预览；`v1.0` 是 P0/P1 稳定发布版本。
- task 依赖定义实现顺序；进入后续版本不等于此前所有运行态门槛已通过，发布只按下方有来源的证据关闭门槛。
- P0/P1 始终是只读 Trellis observer：只消费 `.trellis/` 产生的数据，不修改 Trellis 数据，不安装 Agent hooks，不依赖 trellis-card 或额外 daemon。
- `progress` 固定为 `number | null`。没有经版本验证的权威进度来源时，不显示或计算虚构百分比。
- 采集只在 composite 的 daemon 中发生；bar widget、popout、desktop 等 surface 只消费同一份 snapshot。
- 最终 UI 必须先通过 UI/UX Design Gate；未经 Gate 确认，不实现最终视觉或自行扩展交互。
- `v0.9` 的 P2 增强可以按项跳过，不阻塞以 P0/P1 为核心的 `v1.0`；Agent activity provider 不是 `v1.0` 的硬依赖。

## 当前基线

- 规格 Stage 0 的调研材料已经写入 `.trellis/tasks/09-17-dms-plugin-prereq-research/research/`。
- 当前 release-candidate 基线：Fedora 44、Wayland、niri 26.04、DMS 1.6.2、Quickshell 0.3.1、Qt 6.11.2、Trellis 0.6.17；v0.8 目标版本由用户确认改为 DMS 1.6.2。
- 已确认安全路径、session pointer、多 session、progress 语义和 Linux `codeIsland-dms` 参考边界。
- `v0` 的 1 个 task 与 `v0.1` 的 3 个 task 已完成并归档；v0.2 已完成静态 composite 骨架实现。
- v0.2 目前有静态 composite 骨架；共享 Snapshot 生命周期、实时 DMS IPC、reload 和多屏/multi-bar 行为仍需在 DMS 运行环境中验收，静态实现不代表这些运行态检查通过。
- v0.3 parser/resolver 与完整 session 保留有后续 fixture/path 测试证据；primary selection 由 v0.6 确定性矩阵覆盖。这些证据不替代实时 watcher 或 DMS 生命周期验收。
- v0.4 的 watcher、拓扑刷新、错误恢复和资源上限代码已完成静态/纯测试基线。
- v0.5 的 UI/UX Gate、紧凑 pill、最小只读 popout、受控多 root 发现与 project 记忆已完成静态实现；`plugin.json` 已更新为 `0.5.0`。
- v0.6 的 project-qualified primary/pin、live task 分组、项目筛选、降级恢复和响应式适配已完成；发布清单区分了已通过的纯/静态/offscreen 门槛与仍待真实 Wayland/DMS restart 验证的门槛。
- v0.7 的按需 Markdown 详情、只读 archive 浏览与懒加载、Settings/State 迁移和恢复流程已完成；发布清单区分了已通过的契约/静态门槛与仍待真实 Wayland/DMS host 验证的门槛。
- v0.4 的精确 watcher 延迟仍未验证；v0.8 用户报告覆盖 topology、reload 和 multi-widget/multi-screen 的部分运行态检查，但本会话未独立复跑且无逐项日志或精确延迟数据。资源上限是实现边界，不是实测性能，因此 v0.4 发布门槛仍未关闭。
- v0.8 core RC 有归档的 fixture/static 证据和用户报告的 DMS 1.6.2 核心检查；该运行态证据未由本会话独立复跑，性能/精确延迟仍未测量。
- v0.9 Desktop、locale 与 Launcher 已作为可选项实现并纳入本地候选；DMS 1.6.2 主机日志先发现 Launcher 缺少 `qs.Widgets` 导入，复制该修复后又发现 `QtObject` 根没有默认子对象属性；v0.9.3 已将根改为 `Item` 并增加回归断言。最新重启日志确认 Trellis bar widget 和 daemon 已加载且无新组件错误；Launcher 触发词尚未在 DMS Launcher UI 中测试，Desktop 和 locale host 检查也仍待完成。
- v1.0.0 候选版已补充仓库 README、MIT 许可证、候选发布说明和仅由 `v1.0.0-rc.N` tag 触发的 GitHub pre-release 工作流；当前未创建 tag 或 Release。DMS 插件在线列表的上游提交流程已核实并记录，但主机验收、截图和支持矩阵仍未完成，因此没有 registry PR 或列表条目。
- 2026-09-26 桌面显示设置与挂载目录入口修正已通过仓库契约测试。用户将最新 `TrellisSettings.qml` 与中文翻译复制到 DMS 插件目录并重启后，确认桌面显示设置及进入 `/run/media`、`/mnt` 的入口正常；此前也报告 archive 警告消失且任务/进度仍正常。此为用户报告，无运行日志；双实例持久化、重置效果、选择后可信目录变化及无效路径警告保留尚未逐项确认。
- 2026-09-25 按用户要求归档了当时全部 7 个 active Trellis task；各归档任务保留归档前状态及行政归档说明。归档不代表未完成的 DMS host gates 已通过，也不代表 v1.0 已正式发布。

# v0（规划基线与范围冻结）

## 版本目标

把规格中的产品目标、技术边界、验收口径和版本依赖变成唯一可追踪的执行基线，确保后续实现不会在数据模型、UI 语义或 P2 范围上漂移。

## 该版本细分 tasks

### task 0.1：目标、范围与验收合同冻结

#### 任务目标

将目标拆成 P0、P1、P2，并为后续每个版本定义可观察的完成条件、明确的 out-of-scope 和回退点。

#### 设计原则

- 先固定用户价值和数据事实，再决定实现细节。
- 数据忠实、只读、可降级优先于视觉压缩和功能数量。
- 所有不能从仓库或运行时证据确认的内容都标记为待验证，不用假设填空。

#### 要求实现

- 维护本路线图，并将规格第 3～7 节映射到版本和 task。
- 固定 snapshot、状态分层、`progress: number | null`、安全 resolver 和 composite daemon 边界。
- 记录环境、DMS API、Trellis 数据、路径安全和 P2 参考项目的证据来源。

#### 不要实现

- 不写生产 QML、parser、watcher 或 hooks。
- 不确定最终视觉、主题色、动效或公开插件名称。
- 不将 mtime、Markdown checkbox、status 或 session 数量冒充总体进度。

#### 验收标准

- 规格中的目标、非目标、P0/P1/P2 优先级和本路线图互相一致。
- 每个后续 task 都有目标、要求、禁止项、验收标准和依赖关系。
- 未决技术事实被列入 v0.1，而不是以默认值静默进入实现。

#### 实现边界、前后 task 依赖

- 本 task 只产生规划文档；完成后进入 v0.1 的事实调研。
- v0.1 未完成前，不得进入任何生产代码 task。

# v0.1（技术事实与数据契约冻结）

## 版本目标

完成规格 Stage 0，把 DMS composite 生命周期、Trellis 文件结构、progress 语义、路径安全和 Linux P2 参考从“待验证”变为带证据的实现契约。

## 该版本细分 tasks

### task 0.1.1：环境与 DMS/Quickshell API 矩阵

#### 任务目标

确认目标机器上的 Fedora、Wayland/niri、DMS、Quickshell、Qt 版本以及 composite manifest、daemon/widget 生命周期和 Theme/Settings/State API。

#### 设计原则

- 以安装运行时源码和真实命令结果为准，不只引用历史文档。
- 区分“源码可确认”和“DMS 运行时已实测”。
- 最低 `requires_dms` 版本必须由实际 API 需要决定。

#### 要求实现

- 形成 `research/environment.md` 和 `research/dms-api.md`。
- 记录 manifest schema、`components`、全局变量、Settings/State、权限和 bar axis/popout 合约。
- 记录 DMS 未运行、缺少 QML lint 工具等限制，不把限制写成已通过。

#### 不要实现

- 不安装或修改 DMS 插件、不启动外部 daemon。
- 不以 `dms --version` 失败推断 DMS 不可用；使用实际支持的版本命令。
- 不在研究阶段锁定超出证据范围的兼容版本。

#### 验收标准

- 能从研究文档回答：daemon 是否单实例、widget 是否多实例、composite 如何共享 snapshot、需要哪些权限。
- 关键版本和未验证项都有命令或源码位置作为依据。
- 后续 manifest 和 QML task 不再依赖未记录的 API 假设。

#### 实现边界、前后 task 依赖

- 依赖 v0/task 0.1；与 task 0.1.2 可并行调研。
- 产出供 v0.2 骨架、v0.5 UI Gate 和 v0.8 环境验收使用。

### task 0.1.2：Trellis 数据模型、生命周期与 progress 契约

#### 任务目标

确认 `.trellis/.version`、live task、archive、session pointer、task status、父子关系和 CLI JSON 的真实结构，并冻结插件内部 domain model。

#### 设计原则

- stored status、runtime state、display state 三层分离。
- 保留全部 session，不以“最新 session”覆盖其他活动任务。
- 未知字段和未知 status 宽容读取，不能因新字段崩溃。

#### 要求实现

- 形成 `research/trellis-data-model.md` 和 `research/progress-semantics.md`。
- 确认 `progress: number | null`；当前没有权威总体百分比时保持 `null`。
- 记录 archive 的真实布局、`task.py list/current --json` 能力、stale/malformed pointer 行为。

#### 不要实现

- 不把 implement checklist、child counter、mtime 或 status 映射成总体百分比。
- 不写回 task.json，不移动任务，不清理 session 文件。
- 没有真实 archive 样本时不伪造“已验证的 archive 行为”。

#### 验收标准

- 研究文档给出可实现的 Snapshot、ProjectSnapshot、TaskSnapshot、SessionSnapshot 字段契约。
- 至少覆盖 planning、in_progress、未知 status、stale pointer、malformed JSON 和 multi-session fixture。
- 明确哪些行为在本机已验证、哪些必须留到运行态验收。

#### 实现边界、前后 task 依赖

- 依赖 v0/task 0.1；与 task 0.1.1 可并行。
- 是 v0.2 骨架之外的 v0.3 parser、v0.4 watcher 和 v0.6 UI 状态映射的唯一数据依据。

### task 0.1.3：安全路径与 P2 边界证据

#### 任务目标

冻结 task/session/archive/Markdown 的 safe resolver 规则，并明确 `codeIsland-dms` 仅是后续 Linux P2 activity provider 参考。

#### 设计原则

- 先 canonicalize，再做 containment 检查；不信任 runtime pointer 字符串。
- 最小权限、最小数据、无副作用。
- Linux 实现事实与 macOS 概念参考严格分离。

#### 要求实现

- 形成 `research/path-safety.md` 和 `research/codeisland-linux.md`。
- 覆盖绝对路径、`..`、symlink escape、stale/malformed pointer、Markdown 白名单和大小上限。
- 定义未来统一的 `ActivityEvent`/`ActivitySnapshot` 接口方向。

#### 不要实现

- 不安装 CodeIsland daemon，不安装或修改 Codex/Claude/OpenCode hooks。
- 不把 macOS `rifqiakrm/code-island` 当作 Linux/DMS 技术实现来源。
- 不让 P2 socket、网络或外部 daemon 成为 P0/P1 启动硬依赖。

#### 验收标准

- traversal、external absolute path、symlink escape、stale pointer 和非白名单 Markdown 均被拒绝。
- 研究文档写明 socket 不存在时必须降级到 Trellis-only。
- 后续 parser/Markdown/activity task 都能引用同一 resolver 和 provider 边界。

#### 实现边界、前后 task 依赖

- 依赖 task 0.1.2 的路径与 session 事实；可与 task 0.1.1 并行。
- 是 v0.3 resolver、v0.7 Markdown 和 v0.9 activity 评估的前置条件。

# v0.2（Composite 技术骨架）

## 版本目标

证明 DMS composite 插件可以被启用，daemon 只创建一次并发布全局 snapshot，多个 bar widget 能安全消费；此版本允许丑陋调试 UI，不定义最终视觉。

## 该版本细分 tasks

### task 0.2.1：Manifest 与 surface 最小实现

#### 任务目标

建立 `TrellisDms/`、`plugin.json`、daemon、widget 和 settings 的最小可加载结构。

#### 设计原则

- 目录名使用 PascalCase，plugin id 使用 camelCase；遵循真实 schema。
- 只申请当前基础模式需要的 settings 权限。
- 让未来的数据层和 UI 层有清晰边界，不把业务逻辑塞进 widget。

#### 要求实现

- 创建 composite manifest，包含 `daemon`、`widget`、`settings` components。
- 使用 v0.1.1 已验证的 `requires_dms` 和权限声明。
- 让 settings 能加载并保存可扩展的 root 配置占位。

#### 不要实现

- 不实现最终 pill、popout、desktop、launcher 或 Markdown 视觉。
- 不扫描 `$HOME`，不依赖 `fd`、shell 字符串或额外网络服务。
- 不加入 P2 hooks、CodeIsland socket 或 trellis-card 依赖。

#### 验收标准

- DMS 能发现并启用插件，manifest schema 校验通过。
- settings surface 能打开；没有 Trellis project 时插件仍可加载。
- 失败时有明确日志或 empty state，不让 shell 崩溃。

#### 实现边界、前后 task 依赖

- 依赖 v0.1 全部 research 产出。
- task 0.2.2 可在此 task 后执行；v0.3 parser 不得反向依赖最终 UI。

### task 0.2.2：Daemon 单实例与 GlobalVar 骨架

#### 任务目标

验证 daemon→widget 的单一 snapshot 数据通路和多 bar/多屏生命周期。

#### 设计原则

- 所有 filesystem 工作属于 daemon；surface 只做投影。
- snapshot 一次性发布，避免多组变量短暂不一致。
- 先验证生命周期，再接入真实 Trellis 数据。

#### 要求实现

- daemon 发布硬编码或最小 schema-valid 的调试 snapshot。
- widget 通过 `PluginGlobalVar` 响应式消费 snapshot。
- 在多个 bar/widget 实例下确认不会复制 watcher 或采集逻辑。

#### 不要实现

- 不在 widget 中直接读 `.trellis/`。
- 不做真实状态分组、进度、archive 或最终动画。
- 不以多 widget 实例数量推导业务状态。

#### 验收标准

- daemon 只存在一个采集实例，多个 widget 都能显示同一 snapshot。
- plugin reload/hot reload 后没有残留 timer、watcher 或重复 global var。
- DMS 重载失败时有可定位错误，且不破坏宿主 shell。

#### 实现边界、前后 task 依赖

- 依赖 task 0.2.1 和 v0.1.1 的生命周期结论。
- 完成后才能进入 v0.3；v0.3 用真实 parser 替换调试 snapshot，但保持通路契约。

# v0.3（Trellis 数据链路与安全解析）

## 版本目标

把用户配置的可信 project/scan roots 转换为统一、可验证、完整保留多 session 的 Snapshot；本版本不追求最终 UI，只验证数据正确性。

## 该版本细分 tasks

### task 0.3.1：Project discovery 与版本识别

#### 任务目标

发现用户明确配置范围内的 Trellis project，读取 `.trellis/.version`，并为每个 project 建立稳定标识。

#### 设计原则

- 默认不扫描整个 `$HOME`；扫描范围必须由用户信任和配置。
- 限制深度、数量和单轮成本；发现结果可缓存。
- 目录拓扑发现采用 v0.1 验证过的原生方案。

#### 要求实现

- 支持 `projectRoots[]/scanRoots[]` 数据模型，即使首版 settings 先提供单 root。
- 识别 `.trellis` 和 `.version`，对未测试版本给 non-fatal warning。
- 为无 project、无 `.trellis`、权限不足和超限情况返回可展示 warning。

#### 不要实现

- 不自动修改项目目录或生成 `.trellis` 文件。
- 不把未知 Trellis 版本直接当成兼容或直接阻止整个插件启动。
- 不使用未声明的外部命令或拼接 shell 命令。

#### 验收标准

- 配置可信 root 后能发现 project；清空配置后显示 empty state。
- 多 project 能同时进入 snapshot，且 project id/root 不混淆。
- 未知版本、权限错误和扫描超限不会让 daemon 崩溃。

#### 实现边界、前后 task 依赖

- 依赖 v0.2 和 v0.1.1 的 API/数据事实。
- 是 task 0.3.2、v0.4 topology rescan 和 v0.6 project filter 的前置任务。

### task 0.3.2：Task、Session 与状态分层 parser

#### 任务目标

解析所有 live task、session pointer、父子关系、priority、archive summary 和数据健康状态，形成统一 Snapshot。

#### 设计原则

- `storedStatus`、`runtimeState`、`displayState` 不混为一个枚举。
- snapshot 先保留完整事实，再由 projection 决定 pill/popout 显示什么。
- 未知字段、未知 status、坏文件单项降级，不连带丢失其他 project/task。

#### 要求实现

- 输出 `projects[]`、`tasks[]`、`sessions[]`、`activeTaskIds[]`、warnings/errors 和 primary selection 所需字段。
- 读取全部 session，建立 session→task 与 task→activeSessionCount 关系。
- `progress` 保持 `null`，child summary 与 progress 分开；实现用户 pin、active task、recent session 的 primary policy。

#### 不要实现

- 不只保留最新 session，不把多个 active task 隐式覆盖。
- 不将 planning/in_progress/mtime/checkbox 计算成百分比。
- 不修改 task.json、session pointer 或 archive。

#### 验收标准

- 两个 session 指向不同 task 时，snapshot 同时保留两个 task/session。
- malformed task、未知 status、stale pointer 可产生局部 error/warning，DMS 仍可运行。
- primary task 只是 pill 选择；popout 数据仍包含全部 active task/session。

#### 实现边界、前后 task 依赖

- 依赖 task 0.3.1、v0.1.2 和 v0.1.3。
- 是 task 0.3.3、v0.4 watcher、v0.6 UI projection 和 v0.7 detail 的数据前置。

### task 0.3.3：统一 Safe Path Resolver

#### 任务目标

为 task directory、session pointer、archive 和固定 Markdown 文件提供唯一安全解析入口。

#### 设计原则

- candidate 和允许根都 canonicalize/resolve 后再做 containment 检查。
- 明确 live task 与 archive read-only 的边界。
- 失败返回结构化 warning/error，不通过异常击穿 shell。

#### 要求实现

- 拒绝未经规范化的 `..` 越界、未经允许的绝对路径和 symlink escape。
- 要求 task directory 存在可读 `task.json`；Markdown 只允许 `prd.md`、`design.md`、`implement.md`。
- 对 JSON、Markdown、task/project 数量设置保护上限。

#### 不要实现

- 不把不可信 pointer 直接拼接进 shell 或外部命令。
- 不允许任意文件路径读取，不把 `.trellis/spec/` 或 journal 全文作为 P0/P1 数据源。
- 不为了绕过 resolver 而在 UI 层再写一份路径逻辑。

#### 验收标准

- v0.1.3 的 traversal、absolute、symlink、stale、malformed 和 Markdown 白名单用例全部通过。
- live/archive 合法路径能读取；tasks 根目录本身和外部目录被拒绝。
- 所有 parser/detail 入口只调用这一 resolver。

#### 实现边界、前后 task 依赖

- 依赖 v0.1.3 和 task 0.3.2 的数据路径定义。
- 完成后才能开放 v0.4 watcher 和 v0.7 Markdown；该 task 不负责 UI 展示。

# v0.4（Watcher、拓扑、错误恢复与性能底座）

## 版本目标

让 snapshot 在文件内容变化、目录拓扑变化、设置变化和手动刷新时可靠更新，同时在坏数据、大量任务和多 widget 场景下保持 DMS 可用。

## 该版本细分 tasks

### task 0.4.1：Known-file watcher 与增量 reload

#### 任务目标

监听已知 `task.json` 和 session pointer 的内容变化，并在可接受延迟内更新 snapshot。

#### 设计原则

- 只监听已知文件；不假设 `FileView` 可以可靠监听目录创建/删除。
- watcher 属于 daemon，reload 结果以完整一致 snapshot 发布。
- debounce 和错误限流优先于高频重复刷新。

#### 要求实现

- 对现有 task/session 文件实现内容变化 reload。
- 同一文件连续变化时合并刷新，单个坏文件只限流记录 warning。
- watcher 生命周期随 daemon 创建/销毁清理。

#### 不要实现

- 不把轮询间隔当成内容 watcher 的替代品。
- 不在每个 widget 建 watcher，不对每个变化单独写多组 global var。
- 不把 mtime 映射成“Agent 正在工作”。

#### 验收标准

- 修改已有 `task.json` 后 snapshot 在目标 ≤2 秒内反映。
- session pointer 修改后 active session 计数和 primary policy 正确更新。
- reload/hot reload 后无重复回调、残留 timer 或 watcher。

#### 实现边界、前后 task 依赖

- 依赖 v0.3 全部 parser/resolver；与 task 0.4.2 可先定义接口后并行。
- 是 v0.6 live 状态和 v0.8 性能验收的前置。

### task 0.4.2：Topology rescan、设置刷新与手动刷新

#### 任务目标

补齐新建/删除 task、archive move、新增/删除 session 等目录拓扑变化的发现机制。

#### 设计原则

- 事件驱动优先，低频 topology rescan 兜底。
- 默认 rescan 15–30 秒；设置变化和手动刷新立即执行。
- 扫描有界、可取消、不会阻塞 QML shell。

#### 要求实现

- 使用 v0.1 验证的 `FolderListModel` 或等价目录方案。
- 支持 topology interval 合法范围（建议 15–300 秒）。
- 新建/删除 task、archive move、新增/删除 session 后重建一致 snapshot。

#### 不要实现

- 不用高频全盘轮询，不扫描未配置的 `$HOME`。
- 不假设目录 watcher 一定存在，也不依赖未安装的 `fd`。
- 不为 topology 变化修改 Trellis 文件。

#### 验收标准

- 新建/删除 task 在配置的 topology interval 内出现/消失。
- archive move 后 live/archive 归类正确，session stale warning 不导致崩溃。
- 手动刷新和 root/interval 设置变化立即重新扫描。

#### 实现边界、前后 task 依赖

- 依赖 task 0.4.1 和 task 0.3.1/0.3.2。
- 完成后 v0.6 才能承诺实时列表；v0.7 archive lazy load 使用同一拓扑契约。

### task 0.4.3：错误恢复、资源上限与 idle 性能

#### 任务目标

定义和验证坏 JSON、未知字段、权限错误、大量 archive、多 widget 和设置变更下的稳定行为。

#### 设计原则

- 降级可用，不因单个坏文件让 shell 退出。
- global snapshot 不携带 Markdown 全文；archive 默认懒加载。
- 真实成本可测，避免“看起来事件驱动、实际高频轮询”。

#### 要求实现

- 为单文件、单 Markdown、task/project 数量和 archive 扫描定义上限及 warning。
- 清理旧 watcher/timer，复用单一 daemon 资源。
- 为 malformed JSON、权限不足、未知 Trellis 版本和 stale pointer 提供稳定错误模型。

#### 不要实现

- 不吞掉错误、不静默丢 task、不重试到无限循环。
- 不因当前无 Trellis project 让 startupCheck 失败；应显示 empty state。
- 不把未来 P2 daemon 当作 P0/P1 硬依赖。

#### 验收标准

- DMS idle 时没有高频轮询；大量 archive 不默认加载全文。
- 多 widget 实例不会复制 filesystem watcher。
- 任一坏文件只影响对应记录，设置修改后无残留资源。

#### 实现边界、前后 task 依赖

- 依赖 task 0.4.1、0.4.2；其结果是 v0.8 稳定性回归基线。
- 不负责最终 UI 文案，错误字段由 v0.6/v0.7 按设计映射。

## v0.4 当前执行状态（2026-09-22）

### 已完成：静态与纯测试基线

- [x] daemon 单实例拥有 known-file `FileView` watcher；watcher 使用
  `watchChanges`、`blockWrites`、`atomicWrites` 和 generation guard。
- [x] task/session/version 事件通过 200 ms debounce 和 bounded pending map
  合并，完成一批 reload 后只走一次完整 Snapshot 发布。
- [x] topology timer 使用 30 秒默认值和 15–300 秒统一策略；root/interval
  设置变化及 settings-level manual refresh 会启动立即扫描。
- [x] last-good input/snapshot、坏记录局部降级、warning cooldown、watcher
  和 pending-work 上限、generation/销毁清理已落地。
- [x] `node tests/test_trellis_contract.mjs`、manifest JSON 校验、
  `task.py validate 09-22-v04-implementation` 和 forbidden-surface/static
  checks 已通过。

### 未验证：需要运行态环境的 gate

- [ ] 在真实或确定性 DMS watcher fixture 中确认已有 `task.json` 和 session
  pointer 修改于目标两秒内更新 Snapshot，并确认没有重复回调。
- [ ] 在运行中的 DMS 中确认 topology interval、手动刷新、创建/删除 task、
  session 增删和 archive move 的实际行为。
- [ ] 在 plugin reload、daemon destruction、multi-widget/multi-screen 场景中
  确认没有残留 reader、watcher、timer、process 或旧 generation 发布。
- [ ] `qmllint`/`qmlformat` 与完整 DMS IPC gate：当前 checkout 缺少可用工具或
  运行时，不能以静态检查替代这些验收。

因此，v0.4 目前是“静态实现完成、运行态 gate 待验证”，不提前宣称版本发布门槛已通过。

# v0.5（UI/UX Design Gate + 可用性增量）

## 版本目标

在真实 DMS Theme/API、真实 Snapshot schema、horizontal/vertical bar、niri 多屏场景基础上，冻结最终 UI 信息架构、状态矩阵和组件契约；Gate 通过后，先落地用户实测暴露的紧凑展示和受控项目发现能力，完整筛选与详情交互仍留在后续版本。

## 该版本细分 tasks

### task 0.5.1：信息架构与状态矩阵

#### 任务目标

设计 pill、popout、筛选、task detail、archive 和 settings 的信息层级，确保完整数据不因空间限制被隐式丢弃。

#### 设计原则

- DMS 原生 Material 3 语言优先，数据忠实优先于装饰。
- 状态必须可读，不能只依赖颜色。
- primary task 是投影策略，不是删除其他 task/session 的理由。

#### 要求实现

- 产出 `docs/ui-ux-spec.md`、`docs/ui-state-matrix.md`、`docs/ui-component-contract.md`。
- 覆盖 no project、no active task、planning、in_progress、多 task/session、长名称、stale、malformed/version warning、loading/rescan、archive、横/竖 bar、窄/正常/宽 popout、键盘选择。
- 为 `+N`、stack 或 summary 明确多 active task 的表达方式。

#### 不要实现

- 不复制 trellis-card 的关联网络、规范地图或独立主题系统。
- 不把 Markdown detail 放在 pill 主层级。
- 不在没有用户确认前进入 v0.6 的最终 QML。

#### 验收标准

- 每个 Snapshot 状态都有确定的可见投影、操作和降级文案。
- horizontal/vertical/narrow 场景不会造成内容跳变或隐式丢失。
- 用户确认设计方案，明确记录保留项、舍弃项和 P2 预留槽位。

#### 实现边界、前后 task 依赖

- 依赖 v0.3 Snapshot 和 v0.4 更新/错误语义；可与 task 0.5.2 并行产出草案。
- 是 v0.6、v0.7 任何最终前端实现的硬前置；未确认不得绕过。

### task 0.5.2：视觉、可访问性与动效契约

#### 任务目标

把 Theme、spacing、typography、radius、focus、reduced-motion 和错误层级落实为组件级约束。

#### 设计原则

- 只用 DMS semantic colors/Theme，不自建主题 picker。
- 动画克制，`recentlyChanged` 不表达强语义的“Agent 正在工作”。
- 键盘焦点、对比度、长文本和窄宽度是正常状态，不是事后补丁。

#### 要求实现

- 定义 compact/normal/wide 的尺寸和 fallback。
- 定义 loading、warning、error、empty 的视觉优先级和 focus/selection 行为。
- 若保留 desktop 或 activity 预留，先写出对应状态而不承诺实现。

#### 不要实现

- 不硬编码产品主题色，不添加持续高频动画。
- 不把 error/warning 抢占正常任务的主视觉。
- 不在本 task 安装 P2 agent provider。

#### 验收标准

- 组件契约能被 QML 实现直接引用，且与 DMS Theme API 一致。
- reduced-motion 或等价降级行为有明确规则。
- 长 task/project 名称、键盘操作和状态颜色之外的文本/图标语义可读。

#### 实现边界、前后 task 依赖

- 依赖 task 0.5.1 和 v0.1.1 的 Theme/API 事实。
- 与 task 0.5.3 形成 Gate；Gate 通过后才进入 v0.6。

### task 0.5.3：Design Gate 评审与批准

#### 任务目标

由用户确认最终设计基线，并锁定 v0.6/v0.7 的实现范围。

#### 设计原则

- 评审设计产物，而不是凭实现结果反向补规范。
- 任何新增状态先更新矩阵，再进入代码。
- P2 只保留明确的预留位，不偷偷扩大首版范围。

#### 要求实现

- 提供可阅读的 UI spec、state matrix、component contract 以及必要 wireframe。
- 记录用户确认、未采纳方案、已知限制和验收映射。
- 将 Gate 结论写回 task/设计文档，作为 v0.6 实现输入。

#### 不要实现

- 未获得确认时不写最终 pill/popout QML。
- 不以“能运行”替代视觉、可访问性和状态覆盖验收。
- 不在 Gate 中新增未规划的 desktop、launcher 或 Agent activity 功能。

#### 验收标准

- 用户明确确认设计方案，所有阻塞 UI 决策为空。
- v0.6/v0.7 的每个 UI task 都能指向已批准的 state matrix 条目。
- Gate 未通过时，项目停留在 v0.5，不进入最终前端。

#### 实现边界、前后 task 依赖

- 依赖 task 0.5.1 和 0.5.2；这是 v0.6 的硬门槛。
- Gate 只批准设计，不等于批准启动生产实现任务；实现仍需遵守 Trellis task 状态流程。

### task 0.5.4：可选紧凑 Pill 与最小只读 Popout

#### 任务目标

解决完整计数字符串在小屏/拥挤 bar 上过长、点击 widget 无反馈的问题，同时保持 Snapshot 数据忠实。

#### 设计原则

- 默认模式应自动适配常见状态，用户仍可选择 task、project、counts、icon 或完整文字。
- 使用 DMS Material Symbols，不使用 emoji，不制造 progress。
- popout 只提供当前 Snapshot 的只读检查，不提前实现完整筛选和 Markdown 详情。

#### 要求实现

- 提供 `auto`、`task`、`project`、`counts`、`icon`、`full` 六种展示模式，默认 `auto`。
- 横向长文字单行截断；vertical bar 固定使用图标级投影；warning 始终有非颜色语义。
- 添加最小只读 popout，展示 project、task state、active session count、version 和 bounded warning。

#### 不要实现

- 不在 widget 中读取文件、重写 parser 或写 Trellis 数据。
- 不实现项目筛选、Markdown、archive 正文、task 操作或 Agent activity。
- 不增加自定义主题、emoji 或装饰性动效。

#### 验收标准

- 所有模式可配置，非法值回退 `auto`，长名称不导致 pill 无界增长。
- 点击 pill 可打开 popout，empty/error/warning 均有明确文案。
- 纯投影测试和只读边界检查通过。

#### 实现边界、前后 task 依赖

- 依赖 task 0.5.1-0.5.3 的已批准契约和 v0.4 Snapshot。
- v0.6 在此基础上增加 primary policy、项目筛选、关系和 priority，不重复搭建基础 popout。

### task 0.5.5：受控自动发现与 Project 记忆

#### 任务目标

用一个或多个用户选择的可信目录替代必须手填单项目路径的主流程，并记录最近成功发现的 project。

#### 设计原则

- 自动发现只发生在用户明确选择的 trusted roots 内，安全边界不能由缓存或猜测扩大。
- project 记忆属于 DMS State 缓存，不是新的扫描授权。
- settings 必须清楚解释扫描深度、范围、记忆、重验证和只读边界。

#### 要求实现

- 使用 DMS folder picker 添加/删除 `scanRoots`，最多保留 16 个；显式空列表表示关闭发现。
- 继续使用 depth 4、canonical resolver 和现有 project/task/session/resource caps。
- 新键不存在时兼容旧 `projectRoot`；配置新列表后由新列表完全接管。
- 成功、非 degraded 扫描后，将 bounded `{root,name,lastSeenAt}` 写入插件自身 DMS State；后续扫描重新验证并替换缓存。

#### 不要实现

- 不隐式扫描 `$HOME`、`/`、mount、`/proc`，不从进程参数猜 project。
- 不从 remembered project 反向生成 trusted root。
- 不写任何 project 或 `.trellis` 文件。

#### 验收标准

- 多 trusted roots、显式空列表、legacy fallback、重复/非法 root 均有确定行为和测试。
- settings 显示完整安全说明，remembered list 明确标注为只读缓存。
- degraded scan 不清空上一次成功缓存；成功空扫描可清空缓存。

#### 实现边界、前后 task 依赖

- 依赖 v0.4 bounded discovery 和 task 0.5.1-0.5.3 Gate。
- 后续项目筛选只消费已验证 Snapshot，不改变 trusted-root 授权模型。

## v0.5 实现状态（2026-09-22）

- [x] `docs/ui-ux-spec.md`、`docs/ui-state-matrix.md`、`docs/ui-component-contract.md` 已完成，Design Gate 结论已记录。
- [x] 六种 pill 模式、vertical fallback、warning 语义和最小只读 popout 已实现。
- [x] trusted folder picker/list、legacy fallback、bounded project state cache 和重验证数据流已实现。
- [x] Node 契约测试、manifest JSON 和 Trellis context 校验通过。
- [x] `qmllint`/`qmlformat` 与完整 DMS 运行态视觉/点击/folder picker gate：当前 checkout 缺少对应工具或独立预览环境，需在实际 DMS 中验证。

# v0.6（完整 Bar Pill + Popout 交互）

## 版本目标

在 v0.5 已实现的紧凑 pill 与最小只读 popout 上，严格按已批准的 UI spec 完成 P0/P1 主交互：primary policy、项目筛选、完整 live task、多 session、关系/priority、状态降级以及横/竖 bar 验收。

## 该版本细分 tasks

### task 0.6.1：Primary task Bar Pill

#### 任务目标

将 snapshot 投影为稳定、可预测的 pill，显示 project/task 状态和经批准的多 task 聚合提示。

#### 设计原则

- pill 是 snapshot 的投影视图，不重新解析业务规则。
- 无权威 progress 时不显示百分比；状态/计数/child summary 必须语义明确。
- 在极窄宽度下优先保证可识别和可点击。

#### 要求实现

- 实现 pin task → 当前项目 active task → 最近 session → project/no active task 的 primary policy。
- 按 state matrix 展示 planning、in_progress、inactive、warning、empty、error 和 version warning。
- 支持 horizontal/vertical bar 以及长名称 fallback。

#### 不要实现

- 不把 primary task 当成唯一 task，不隐藏 `+N` 或其他 active session。
- 不将 mtime/checkbox/status 显示为总体百分比。
- 不自定义 DMS 主题、颜色或脱离 spec 的动效。

#### 验收标准

- 每个 pill 状态能在 state matrix 找到对应设计和测试样例。
- 多 active task 时用户能知道还有其他 task/session，并可进入 popout。
- 无项目、无活动任务、坏数据时 pill 不崩溃且文案/图标不误导。

#### 实现边界、前后 task 依赖

- 依赖 v0.5 Gate、v0.3 projection contract 和 v0.4 snapshot 更新语义。
- task 0.6.2 可并行开发但必须复用同一 projection 字段；不在 widget 里另写 parser。

### task 0.6.2：Live Task Popout 与项目筛选

#### 任务目标

展示完整 live task/session 数据，并提供项目筛选、状态分组、父子关系、priority 和 session count。

#### 设计原则

- popout 承担完整信息，pill 只承担快速识别。
- live 列表按真实状态和路径边界分组；live 路径中的 `completed`/自定义状态保留在 Other，只有 archive 路径数据才不进入主列表。
- 多项目、多 session 和 warning 可追溯到具体来源。

#### 要求实现

- 实现项目筛选、live task 列表、active session 数、父子关系和 priority 展示。
- 保留 stale/malformed/version warning 的可见但不喧宾夺主的入口。
- 支持键盘焦点、选择和 popout 宽高契约。

#### 不要实现

- 不丢弃非 primary task/session，不直接把全文 Markdown 塞进 global snapshot。
- 不把 archive 混入 live task 主列表。
- 不引入 Agent tool/permission 交互。

#### 验收标准

- 两个 project、多个 active session、parent/child 和 priority 都能按 spec 查看。
- live/archive 边界与真实 `storedStatus`/runtimeState 一致。
- 项目筛选、空列表、加载、错误和 warning 状态都可操作且可返回。

#### 实现边界、前后 task 依赖

- 依赖 task 0.6.1、v0.5 Gate 和 v0.3.2 snapshot。
- 是 v0.7 task detail/archive 入口的前置；archive 正文读取不在本 task 实现。

### task 0.6.3：状态降级与响应式 bar 适配

#### 任务目标

将 loading/rescan、empty/error/version warning 以及 horizontal/vertical/narrow 适配做成完整交互闭环。

#### 设计原则

- 降级状态仍可恢复，错误不阻断正常任务查看。
- 正常任务视觉优先于 warning；颜色不是唯一信号。
- 同一 snapshot 在不同 surface 上保持语义一致。

#### 要求实现

- 提供 loading、手动 refresh、无 root、无 project、坏 JSON、stale pointer 和未知版本的 UI 行为。
- 遵守 popout 最小/最大尺寸、长文本截断/展开和 vertical bar 约束。
- 将错误操作限制为重新扫描、进入设置或查看详情等只读动作。

#### 不要实现

- 不在错误界面静默修复或删除 Trellis 文件。
- 不为了显示错误而隐藏可用任务。
- 不把持续动画当作活动状态指示。

#### 验收标准

- state matrix 的所有 P0/P1 状态可从真实 fixture 复现。
- 设置 root 后 empty state 能恢复为 project/task 视图，无需重启 DMS。
- horizontal、vertical、narrow bar 和正常 popout 均无溢出或不可达操作。

#### 实现边界、前后 task 依赖

- 依赖 task 0.6.1、0.6.2 及 v0.4 错误/刷新语义。
- 完成后进入 v0.7 详情/设置；P2 surface 仍不得插入主流程。

## v0.6 实现状态（2026-09-23）

- [x] project-qualified pin、selected/current project active、可信 session recency 与确定性 fallback 已由纯投影统一实现；`last_seen_at` 不被冒充为 activity/progress。
- [x] All/单项目筛选、固定 task 分组、priority、扁平关系摘要、多 session 计数、live-path custom/completed 和两个 DMS State key 已实现。
- [x] loading、无 root、无 project、无 task、无 active、坏 JSON/read error、stale session、未知版本、healthy warning 与 last-good degraded 均有确定 fixture、pill/popout 和恢复预期。
- [x] Refresh 只写既有 `refreshToken`，Settings 只进入 DMS 设置面；刷新期间保留一致数据，直到更新且非 degraded 的 Snapshot 才结束 pending feedback。
- [x] horizontal 文本统一限制为 180 logical px；vertical 只渲染图标；420 x 480 popout 会按 screen 缩小，filter 自动换行，内容只有一个纵向 scroll region。
- [x] Node 契约/语法、manifest JSON、exact-case resource、read-only/path/discovery/watcher 静态门槛、offscreen installed-module load 与 Trellis task context 校验通过；`plugin.json` 在这些 blocking gate 后更新为 `0.6.0`。
- [ ] workspace v0.6.3 尚未复制到已安装插件，因此真实 Wayland 视觉、pointer、焦点/滚动、Settings 定位和完整 DMS restart persistence 未验证。现有 host 日志已观察到两 widget/每代一 daemon 的 reload 行为，同时记录 DMS State 异步落盘错误 `Property 'connect' of object false is not a function`；不添加不安全 fallback，也不声称 restart 后 pin/filter 已持久化。

# v0.7（Markdown 详情、Archive 与 Settings）

## 版本目标

完成 P1 的按需详情、archive 浏览和可恢复设置，让插件在无项目、坏数据和大量历史任务场景下仍可配置、可阅读、可恢复。

## 该版本细分 tasks

### task 0.7.1：Task Markdown 按需详情

#### 任务目标

点击 task 后按需阅读 `prd.md`、`design.md`、`implement.md`，并在 QML 能力不足时优雅降级。

#### 设计原则

- 文件按需读取，正文不长期放进 global snapshot。
- 先保证安全、响应和可读性，再追求完整 GFM。
- 所有详情内容都追溯到已验证 task directory。

#### 要求实现

- 通过 safe resolver 读取固定允许文件名，并设置单文件大小上限。
- 验证 DMS/dank-qml-common Markdown 组件；若能力有限，提供基础 Markdown 和纯文本 fallback。
- 大文件读取不冻结 shell，读取失败有局部错误状态。

#### 不要实现

- 不允许任意文件浏览，不读 `.trellis/spec/`、journal 或 task 外部路径。
- 不为了 GFM 表格/task list 引入重型 WebView。
- 不把 Markdown checkbox 解释为总体进度。

#### 验收标准

- 真实 PRD、Design、Implement 均可打开、切换和返回。
- traversal、symlink、非白名单文件和超大文件按 resolver 规则拒绝或降级。
- 大文件或坏 Markdown 不导致 DMS 卡死或退出。

#### 实现边界、前后 task 依赖

- 依赖 v0.6.2、task 0.3.3 和 v0.6 component contract。
- 与 task 0.7.2 可并行；不改变 snapshot schema 或 Trellis 文件。

### task 0.7.2：Archive 浏览与懒加载

#### 任务目标

将 archive 与 live task 分开展示，并以懒加载方式支持历史任务浏览。

#### 设计原则

- archive 是历史只读视图，不伪装成当前活动任务。
- 默认只加载摘要/索引，进入具体 task 后再读取详情。
- 对 archive 布局和缺失样本保持版本兼容和 warning。

#### 要求实现

- 支持已验证布局 `.trellis/tasks/archive/<YYYY-MM>/...` 的月份/任务索引和单 task 详情入口；不额外授权 `.trellis/archive`。
- 将 archived/completed 从 live list 明确分离。
- archive 数量大时分页、限量或按需加载，并展示加载/错误状态。

#### 不要实现

- 不移动、恢复、删除或修改 archive task。
- 不默认加载所有 archive Markdown 全文。
- 不因 archive 为空或布局未知而让 startupCheck 失败。

#### 验收标准

- 真实或受控 fixture 中 archive 任务不出现在 live 列表，且可从 archive 入口阅读。
- archive 空、权限不足、未知月份布局和大量任务都有明确降级行为。
- archive 读取沿用 v0.3.3 resolver 和 v0.4 资源上限。

#### 实现边界、前后 task 依赖

- 依赖 v0.6.2、task 0.7.1、v0.1.2 archive 契约。
- archive 失败不阻塞 live task；v0.8 负责大规模归档性能回归。

### task 0.7.3：Settings、State 与恢复流程

#### 任务目标

提供 project/scan roots、topology interval、progress/archive/pill 等用户设置，并保证修改后立即生效且可恢复。

#### 设计原则

- 设置写入 DMS 自己的命名空间，不写 `.trellis/`。
- 没有 project 是合法 empty state，不是插件启动失败。
- 设置变化要重扫并清理旧资源。

#### 要求实现

- 实现可信 root(s)、15–300 秒 topology interval、showProgress、showArchive、pillMode、versionWarning 等 spec 允许设置。
- 用 State 保存用户 pin task、上次选中 project、折叠/筛选状态等 UI 偏好。
- 提供手动刷新、恢复默认和错误提示（不自动修复 Trellis 数据）。

#### 不要实现

- 不将 setting/state 作为 Trellis task 数据写回。
- `showProgress` 不能在 `progress === null` 时制造进度。
- 不增加未经 UI Gate 批准的高级配置或主题 picker。

#### 验收标准

- 首次安装、root 为空、root 无 project、root 有多个 project 均能进入设置和 empty state。
- 修改 root/interval 后 watcher、timer、snapshot 无残留且立即刷新。
- 设置重启后保留预期偏好；无效路径被安全拒绝并可继续使用。

#### 实现边界、前后 task 依赖

- 依赖 v0.4 刷新契约、v0.5 Gate 和 v0.6 surface。
- 完成后进入 v0.8 P1 回归；不阻塞 v0.9 可选增强的独立设计。

## v0.7 实现状态（2026-09-23）

- [x] v0.7.1 已实现固定白名单 Markdown 的 daemon-only 按需读取：`prd.md`、`design.md`、`implement.md` 均通过 canonical resolver、常规文件/大小门控和异步只读 `FileView`；详情响应带 request/generation 防旧结果覆盖，Snapshot 与 live projection 保持无正文。
- [x] v0.7.2 已实现独立的只读 archive 入口和懒加载：仅使用 `.trellis/tasks/archive/<YYYY-MM>/<task-dir>`，月份/任务索引有页大小与最大页上限，archive 行不会进入 live inputs、watcher、Snapshot、pin 或刷新状态；最高页不再错误地暴露 `hasMore`。
- [x] v0.7.3 已实现 `pillMode`/旧 `displayMode` 迁移、`showProgress`/`showArchive`/`versionWarning`、可信 roots 与 interval、bounded UI State、key-scoped restore defaults、刷新和局部错误恢复；真实 numeric progress 之外不会显示伪造百分比。
- [x] `node tests/test_trellis_contract.mjs`、Node 语法检查、全部 JS helper VM 语法检查、Manifest JSON 检查、父任务和三个已归档子任务的 Trellis context 校验通过；静态安全边界、单一 Snapshot publisher、资源上限、exact-case 资源和 no-widget-reader 门槛已通过。
- [ ] `qmllint`/`qmlformat` 未安装；直接 workspace QuickShell 加载缺少可用的 `qs.*` 模块，无法把 offscreen/旧 harness 结果当作当前 runtime 证据。
- [ ] 真实 Wayland 视觉、pointer/focus/scroll、Settings 定位、native Markdown 渲染、真实 detail/archive 通道、双 widget State 收敛和 DMS 重启后的 State 落盘仍需目标 host 验证；现有 host 曾报告异步 State 写入错误 `Property 'connect' of object false is not a function`，插件不添加不安全 fallback。
- [ ] 恢复默认会写权威 `scanRoots: []`；后续 daemon 的正常空扫描可能按 v0.5 输出缓存契约将 `discoveredProjects` 替换为 `[]`。这不是 namespace-wide 清理，也未改为直接删除 output-only cache；边界已记录在 Settings/State 规范和父 PRD。

# v0.8（P1 稳定性、兼容性与 Release Candidate）

## 版本目标

将 P0/P1 汇总为可发布候选版本，在目标 Fedora 44 + Wayland + niri + DMS 1.6.2 环境中完成真实运行态、跨状态、性能和安全回归。

## 该版本细分 tasks

### task 0.8.1：端到端状态矩阵回归

#### 任务目标

用真实项目和受控 fixture 覆盖 project/task/session/archive/Markdown 的全链路。

#### 设计原则

- 验收以可观察行为为准，不以代码路径或日志数量为准。
- 真实数据优先，缺失样本明确标注 fixture 验证。
- 所有状态必须从 parser 到 snapshot、projection、UI 一致传递。

#### 要求实现

- 覆盖 no project、no active、planning、in_progress、unknown status、多 session、stale、malformed、长名称、archive、Markdown、横/竖 bar。
- 验证 task.json ≤2 秒更新、topology interval 更新、手动刷新和设置恢复。
- 检查 `progress` 永不被伪造，live/archive 分类和 primary policy 正确。

#### 不要实现

- 不因测试方便修改生产 Trellis 数据或添加隐式 fallback。
- 不把通过单一 happy path 当成 P1 完成。
- 不在 RC 阶段加入未评审的新功能。

#### 验收标准

- UI state matrix 每个条目有通过证据、失败复现和修复记录。
- live task、archive、session 与安全 resolver 的端到端路径均通过。
- 所有已知 limitation 写入发布说明，而不是被测试忽略。

#### 实现边界、前后 task 依赖

- 依赖 v0.7 全部 task、v0.5 Gate 和 v0.4 资源底座。
- 是 task 0.8.2/0.8.3 的共同输入；失败时回退到对应 v0.x task 修复。

### task 0.8.2：性能、生命周期与安全回归

#### 任务目标

验证 daemon 单实例、idle 资源、目录拓扑、重复 reload、路径边界和大规模数据下的稳定性。

#### 设计原则

- 测量真实行为，避免只检查静态代码。
- 失败应局部降级并可恢复；安全失败优先于“尽量显示”。
- 不为了性能牺牲数据完整性或 resolver 约束。

#### 要求实现

- 检查多 widget 不复制 watcher、设置变化无残留、idle 无高频轮询、archive lazy load、snapshot 不含 Markdown 全文。
- 重新跑 traversal、absolute、symlink、stale/malformed 和大小上限矩阵。
- 记录 DMS 无进程、QML lint 缺失等环境限制对验证的影响。

#### 不要实现

- 不通过放宽 path check、减少 session 或丢弃 warning 来“优化”指标。
- 不把未实测的多屏/IPC 行为标成通过。
- 不在此 task 引入新的外部 daemon 或网络依赖。

#### 验收标准

- 安全矩阵全部通过；性能目标和资源上限有可复现记录。
- reload、screen/bar 数变化和设置更新后没有残留对象或重复订阅。
- DMS shell 在坏数据、空数据和拓扑变化下持续运行。

#### 实现边界、前后 task 依赖

- 依赖 task 0.8.1；发现问题时回退到 v0.3/v0.4/v0.7 修复。
- 是 v1.0 发布冻结的硬前置；P2 不得混入本验收范围。

### task 0.8.3：目标环境安装与兼容性验证

#### 任务目标

确认插件在目标环境的安装、启用、重载、卸载/禁用和版本声明行为，并固定首个 release candidate。

#### 设计原则

- 目标环境是 Fedora 44 + Wayland + niri + DMS 1.6.2；其他 compositor 只做非承诺兼容。
- 运行时实测优先于静态 manifest 检查。
- 版本兼容 warning 要清晰，不用过宽版本声明掩盖风险。

#### 要求实现

- 在目标 DMS 运行态验证插件发现、启用、bar/widget、多屏和 popout。
- 验证安装目录、manifest、权限、`requires_dms` 和版本升级/未知 Trellis warning。
- 形成 RC 变更记录、已知问题和回滚/禁用步骤。

#### 不要实现

- 不为 Hyprland/Sway 做首版专门验收。
- 不把 AppImage/Tauri trellis-card 的 Fedora 黑屏问题当成 DMS 插件依赖或修复目标。
- 不在 RC 中安装 Agent hooks 或强制 CodeIsland daemon。

#### 验收标准

- 目标 DMS 能加载插件，且无 project 时也不触发 startupCheck 失败。
- 多屏/多 bar、reload、禁用后资源清理有真实证据；未能运行的项目明确标注未验证。
- RC 版本可作为 v1.0 冻结候选，不再存在阻塞 P0/P1 未决决策。

#### 实现边界、前后 task 依赖

- 依赖 task 0.8.1、0.8.2 和 v0.1.1 API 证据。
- 完成后进入 v1.0；若仅有 P2 未完成，不阻塞 P0/P1 发布。

## v0.8 Release Candidate 状态（2026-09-24）

- [x] v0.8.1 状态矩阵契约测试通过；fixture/static 证据已归档。
- [x] v0.8.2 安全、生命周期与边界测试通过；用户补充报告本机 DMS 1.6.2 手动运行检查全部通过。
- [x] v0.8.3 目标环境手测通过（用户报告）：Fedora 44、Wayland、niri 26.04、DMS 1.6.2、Quickshell 0.3.1、Qt 6.11.2、Trellis 0.6.17。
- [x] Manifest 升至 `0.8.0`；`requires_dms >=1.6.1` 与权限集合保持不变。
- 手测覆盖本轮计划的插件加载/无项目启动、bar/popout、多屏/多 bar、idle/reload、禁用及资源清理；用户另确认 permission-denied 场景恢复正常，且支持版/未知较新 Trellis 版本 warning 均通过。该证据来自用户确认，未附逐项日志或截图，未由本会话独立复跑。
- 性能边界仍按源码与 fixture 验证：峰值内存、吞吐、同时存在的 process/reader 数和精确 refresh latency 没有独立测量；不要把资源上限写成实测吞吐结果。
- v0.8 目标已由用户明确从 DMS 1.6.1 改为 1.6.2；manifest 的最低声明仍为 `>=1.6.1`，不据此单独声称在 1.6.1 上完成 live 验收。

# v0.9（可选 P2 增强与独立 provider 评估）

## 版本目标

在 P0/P1 RC 稳定后，按项实现 Desktop、DMS locale 和 Launcher 本地 registry readiness；每项都必须独立设计、可关闭、可降级，不改变 Trellis-only 核心。Agent activity 本版只做可行性评估；Control Center 延期。

## 该版本细分 tasks

### task 0.9.1：Desktop surface（可选）

#### 任务目标

在不复制数据采集的前提下，为 DMS DesktopPluginComponent 提供与 bar/popout 一致的只读投影。

#### 设计原则

- desktop 是同一 snapshot 的新 surface，不是第二个 daemon。
- 先补 UI state matrix，再实现尺寸、空状态和多项目行为。
- 不让 desktop 影响 P0/P1 启动和资源预算。

#### 要求实现

- 若用户批准，更新 UI spec 后实现 desktop component、尺寸契约和 empty/error 状态。
- 复用 projection、Theme 和 resolver；验证多 display 行为。
- 提供 feature flag/禁用路径。

#### 不要实现

- 不在 desktop 中另扫文件、另建 watcher 或复制完整 Markdown。
- 不将 desktop 变成 trellis-card 的全屏关联图/规范地图。
- 未经批准不把 desktop 设为默认必启 surface。

#### 验收标准

- desktop 与 pill/popout 的 task/session 语义一致，数据更新一致。
- 多屏和禁用 desktop 时无重复采集、残留资源或 P0 回归。
- 没有 desktop 的环境仍能正常启用 v1.0 核心。

#### 实现边界、前后 task 依赖

- 依赖 v0.8 RC 和新增的 UI Gate；可与 task 0.9.2 并行但不修改 parser 契约。
- 不完成时不阻塞 v1.0。

### task 0.9.2：i18n（zh_CN + en，可选）

#### 任务目标

为核心状态、错误、设置和 archive 文案提供中文/英文切换，同时保持数据字段和 warning 语义一致。

#### 设计原则

- 翻译不改变状态含义，不把 unknown/error 翻译成虚假的确定状态。
- 长文本和窄 bar 按 v0.6 响应式规则验证。
- 默认语言和回退策略明确且可复现。

#### 要求实现

- 覆盖 pill、popout、settings、Markdown fallback、archive、warning/error/loading 文案。
- 为缺失翻译提供稳定 fallback，并测试中英文长短差异。
- 更新 UI state matrix 和 README/设置说明。

#### 不要实现

- 不翻译或改写 Trellis 原始 task title、Markdown 正文和路径。
- 不借 i18n 引入独立主题系统或新的状态枚举。
- 不将 locale 作为核心数据解析前置依赖。

#### 验收标准

- zh_CN/en 下所有核心状态可读，窄 bar 不溢出，fallback 不崩溃。
- 语言切换后 snapshot、筛选、详情和 archive 数据不变。
- 未完成时英文核心界面仍可作为 v1.0 可用 fallback。

#### 实现边界、前后 task 依赖

- 依赖 v0.6 UI contract 和 v0.8 状态矩阵；可与 0.9.1 并行。
- 不完成时不阻塞 v1.0；必须在 release notes 中说明支持语言。

### task 0.9.3：Launcher / Registry readiness（可选；Control Center 延期）

#### 任务目标

提供经批准的 `!trellis` Launcher，只做只读搜索与导航；准备本地 DMS plugin registry metadata，不在本 task 发布。

#### 设计原则

- 新 surface 先补规范，再复用现有 projection。
- 发布 metadata、权限和安装方式最小化。
- launcher 只做只读导航/筛选，不变成任务编辑器。

#### 要求实现

- 明确批准的 surface、trigger、搜索字段和空/错误状态。
- 准备本地 manifest、安装/禁用说明、版本和兼容声明；registry 要求的截图/外部材料留待另行审查。
- 验证 feature disabled 时核心 plugin 行为不变。

#### 不要实现

- 不通过 launcher 修改 Trellis task、启动 agent 或写 hooks。
- 不为了 registry 发布而放宽权限或删除安全 warning。
- 未批准的 surface 保持不实现。

#### 验收标准

- 已批准 surface 能从 DMS 进入对应只读视图，并复用一致 snapshot。
- manifest、权限、说明和兼容范围经过检查；可选 surface 失败不阻塞核心。
- 未完成项有明确 post-v1 backlog，而非伪装成已交付。

#### 实现边界、前后 task 依赖

- 依赖 v0.8 RC 和新增 surface 的 UI Gate；与 0.9.1/0.9.2 松耦合。
- Control Center 和实际 registry 发布不在本版范围内；外部发布须单独确认，不作为 v1.0 本地稳定性的必要条件。

### task 0.9.4：Agent Activity Provider 可行性评估（独立、可选）

#### 任务目标

为未来实时 Agent activity 定义 provider contract，评估 Linux `codeIsland-dms` socket 路线；不把它直接纳入 v1.0 P0/P1。

#### 设计原则

- activity 与 Trellis parser 解耦，通过统一 `ActivityEvent`/`ActivitySnapshot` 接口接入。
- 默认只读、最小 metadata、fail-open；socket 不存在时 Trellis-only 正常工作。
- 先验证部署、协议和 cwd/session→project/task 映射，再决定是否实现。

#### 要求实现

- 研究 `$XDG_RUNTIME_DIR/codeislandd.sock`、`snapshot.full/patch`、重连和 provider/session 字段。
- 只保留 provider、sessionId、cwd/project、event/tool、timestamp、permission state 等显示所需最小字段。
- 形成独立评估报告、隐私边界和后续 prototype 计划。

#### 不要实现

- 不把 macOS Code Island 当 Linux daemon 依据。
- 不安装 hooks、修改用户 agent 配置、采集或持久化 prompt/assistant/tool I/O。
- 不实现 interaction/permission 回写，不让 daemon 不可用阻塞原生 agent 或 Trellis-only。

#### 验收标准

- 能明确判断 Linux daemon 在目标环境是否存在、协议是否稳定、映射是否可靠。
- activity provider 可禁用；没有 socket 时 P0/P1 snapshot、UI 和启动行为不变。
- 若证据不足，输出“延期/不采用”的结论，而不是伪造实时活动。

#### 实现边界、前后 task 依赖

- 依赖 v0.8 RC、v0.1.3 P2 边界和新一轮 UI Gate；与 0.9.1～0.9.3 独立。
- 该 task 的评估结果进入 post-v1 backlog；只有另行批准才进入后续版本，不阻塞 v1.0。

## v0.9 实施状态（2026-09-24）

- [x] v0.9.1 Desktop 已实现：只消费共享 Snapshot，单列滚动展示所有 loaded projects 与 active task 摘要，最多展示 3 条 warning 详情并报告余量；默认尺寸 200×200、最小 180×160。`requires_dms` 的兼容下限提升至 `>=1.6.2`，权限集合不变。静态投影/manifest 检查通过；桌面摆放、resize、多屏和禁用后的真实 DMS 行为仍待目标 host 验证。
- [x] v0.9.2 i18n 已实现：plugin-owned UI labels 使用 DMS `I18n.trFor`，随 DMS active locale 加载 `zh_CN` catalog；英文源文案提供 fallback。项目名、task title、路径、Markdown、ID 和未知状态保持原值。231 个 literal source 与 catalog 一一对应，所有 `%1`/`%2` 占位符匹配；真实 locale 切换与中英文布局仍待 DMS host 验证。
- [x] v0.9.3 Launcher 与本地 registry readiness 已实现：`!trellis` 空查询列项目，非空查询只匹配项目名和 live task 标题，最多 20 个匹配并显示溢出提示；项目选择只更新 project filter，任务选择更新项目限定 pin 并请求现有 popout。Manifest 保留 `>=1.6.2` 和现有权限，并声明 `0.9.0` 包版本。安装、禁用和回滚说明已写入本地文档；未发布外部 registry。Launcher 搜索、State 保存、popout 和多 surface reload 仍待目标 DMS host 验证。
- [x] v0.9.4 Agent Activity Provider 评估已完成并归档；由于 daemon 部署、协议兼容、reconnect 与 task mapping 证据不足，建议延期，不安装 daemon/hooks、不改 agent 配置、不采集 prompt 或工具 I/O。
- [ ] v0.9 Desktop、locale 和 Launcher 的真实 DMS 1.6.2 运行态验证仍未完成；本地静态结果不代表 QML load、UI layout、locale reload、popout 或 State restart persistence 已通过。
- [ ] Control Center 延期；外部 registry metadata review、截图准备和发布均待后续单独确认。

# v1.0（稳定发布）

## 当前候选状态（2026-09-26）

本地冻结候选为 `1.0.0`，目标 DMS 为 `>=1.6.2`，权限保持现有集合；Desktop、zh_CN 和 `!trellis` Launcher 仍是可选候选项。task 1.0.2 的最终验收尚未完成：v0.2 共享 Snapshot 生命周期、v0.4 精确 watcher 延迟以及独立确认的 topology 行为、v0.9 三个 surface 的 host 检查仍待验证。v0.8 用户报告覆盖部分核心 DMS 检查并有 fixture/static 证据支持；性能限制未实测。本地候选不代表最终发布就绪。

2026-09-26 的 DMS 修正完成代码实现与 Node 契约检查。最初运行态复测发现安装目录未包含最新设置 QML；用户复制当前 QML 和中文翻译并重启 DMS 1.6.2 后，确认桌面显示设置及文件选择器进入 `/run/media`、`/mnt` 正常。此前用户报告 archive 警告消失且任务/进度显示仍正常。以上是用户报告，没有保存运行日志；双实例持久化、几何重置效果、选择后可信目录变化及无效路径警告保留未单独确认。Codex 当前任务/工作目录自动发现仍不在范围内；v1.0.2 其他 host gates 继续开放。

## 版本目标

发布经过目标环境验证的稳定 Trellis DMS plugin：P0/P1 只读 observer 行为、数据安全、响应式 UI、设置与错误恢复均有可追溯验收；P2 功能若未独立完成则明确保持关闭或延期。

## 该版本细分 tasks

### task 1.0.1：P0/P1 功能与契约冻结

#### 任务目标

冻结 Snapshot/schema、parser/resolver、manifest、projection、UI state matrix、settings 和兼容声明，停止非必要功能变更。

#### 设计原则

- 发布版本优先稳定、可解释、可回退，不在冻结期加入新 surface。
- 任何字段/行为变更都必须有迁移说明和回归用例。
- 继续保持 Trellis-only 默认模式。

#### 要求实现

- 将 v0.8 RC 的通过结果固化到代码、文档、README 和已知限制。
- 设定插件 `1.0.0` 版本、权限、`requires_dms` 和安装说明。
- 标明 v0.9 可选项的已完成、关闭或 post-v1 状态。

#### 不要实现

- 不在冻结期重做 UI、不引入强制 Agent activity、不改变 Trellis 数据。
- 不为了“看起来完整”填入 fabricated progress 或隐藏 warning。
- 不把未验证的 Hyprland/Sway、未知 DMS 版本写成首版承诺。

#### 验收标准

- 发布文档与实际 manifest、schema、permissions、settings 一致。
- P0/P1 未决阻塞项为空；所有延期事项有 owner/后续版本方向。
- 版本升级不会破坏已验证的 root、State、session、archive 和 Markdown 行为。

#### 实现边界、前后 task 依赖

- 依赖 v0.8.1～0.8.3；v0.9 可选 task 只有在要随 1.0 发布时才成为依赖。
- 完成后进入 task 1.0.2 的最终验收，不再扩展核心范围。

### task 1.0.2：最终安全、兼容与运行态验收

#### 任务目标

在目标环境进行最后一轮安装、启用、使用、重载、禁用和异常恢复验收，确认发布候选没有 P0/P1 回归。

#### 设计原则

- 验收观察结果，不以“代码已写”替代运行态证据。
- 安全拒绝、空状态和 warning 是产品行为的一部分。
- 对无法运行的外部环境明确标注未验证，不做无依据的发布声明。

#### 要求实现

- 复跑全状态矩阵、path-safety、watcher/topology、Markdown/archive、settings 和性能检查。
- 在 Fedora 44 + Wayland + niri + DMS 1.6.2 验证多 bar/multi-display（若环境可用）、popout、reload 和禁用清理。
- 分别验收保留的可选项：Desktop 的加载、摆放、resize 与禁用后核心不回归；zh_CN 的 locale 切换、重载、文案覆盖和英文 fallback；Launcher 的空/无匹配搜索、项目/任务选择、popout、State 持久化和多 surface reload。逐项记录证据等级与结果。
- Desktop 的 host 检查还要覆盖实例显示偏好独立持久化、位置/尺寸分别重置、全局设置不被实例卡写入、挂载目录显式选择，以及存在 archive 目录时实时任务 warning 不误报；确认无效/越界 live-task 路径仍会被拒绝。
- 单项失败时仅从候选包移除该项：Desktop 移除 `components.desktop` 与 `desktop-widget` capability；zh_CN 从候选包移除 `translations/zh_CN.json` 并保留英文源文案；Launcher 移除 `components.launcher`、根级 `trigger` 与 `launcher` capability。注明延期项并重跑 P0/P1 核心验收。
- 检查 v1.0 默认不需要 trellis-card、CodeIsland daemon、Agent hooks、网络或 Trellis 写权限。

#### 不要实现

- 不在验收阶段修改用户 Trellis 数据、安装外部 hooks 或使用未声明的恢复脚本。
- 不把未运行 DMS 的静态检查报告写成 live IPC/多屏已通过。
- 不以删除异常记录或放宽 resolver 换取通过。

#### 验收标准

- P0：pill、project discovery、完整 task/session snapshot、更新、设置、empty/error 降级全部通过。
- P1：项目筛选、live task、父子/priority/session count、Markdown detail、archive、性能全部通过。
- `progress` 无权威来源时始终为 `null`/不显示百分比；安全路径矩阵全部通过；shell 不因坏数据退出。
- 每个纳入包的可选项均有对应 host 证据；失败项按上文单独关闭或延期，英文与 P0/P1 核心 fallback 可用，且剩余核心验收通过。

#### 实现边界、前后 task 依赖

- 依赖 task 1.0.1；失败时回退到对应 v0.x 修复，不在 v1.0 直接掩盖问题。
- 通过后进入 task 1.0.3 发布交接；P2 provider 仍可独立延期。

### task 1.0.3：发布交接、文档与后续路线

#### 任务目标

交付可安装、可理解、可禁用和可继续演进的 v1.0，并记录 P2 和未验证环境的后续路线。

#### 设计原则

- 文档必须反映真实能力、限制、权限和恢复方式。
- 发布动作可回退，用户能在不改动 Trellis 数据的情况下禁用插件。
- 后续目标与 v1.0 核心边界分开管理。

#### 要求实现

- 更新 README/安装说明、设置说明、状态语义、progress 语义、隐私说明和故障排查。
- 提供禁用/卸载、清理自身设置和回滚版本的操作说明。
- 记录 v1.1+ 候选：desktop/i18n/launcher、CodeIsland adapter、hooks（若未来明确批准）。

#### 不要实现

- 不把 post-v1 候选写成 v1.0 已支持功能。
- 不在发布交接时顺手修改 Trellis 项目文件、用户 agent 配置或外部 daemon。
- 不省略已知的 DMS 运行态、archive 样本或兼容性限制。

#### 验收标准

- 新用户能按文档安装、配置 root、看到 empty/project/task 状态并进入设置。
- 用户能安全禁用/回滚，且插件没有残留 watcher、timer 或外部 hook。
- 发布说明包含版本号、兼容基线、权限、P0/P1 已交付、P2 延期项和已知未验证项。

#### 实现边界、前后 task 依赖

- 依赖 task 1.0.2 的最终验收；完成后 v1.0 可发布。
- 之后的新功能必须创建新的版本/task，不得直接扩大已冻结的 v1.0 范围。

## v1.0 发布门槛总表

- [x] v0.1 环境、数据模型、progress、path-safety 与 P2 边界研究已归档；这是研究证据，不表示 host runtime 通过。
- [ ] v0.2 共享 Snapshot 生命周期及实时 DMS IPC/reload/multi-surface 验收；现有 evidence 仅支持静态 composite 骨架。
- [x] v0.3 parser/resolver 与完整 multi-session 保留由后续确定性 fixture/path tests 覆盖；primary policy 由 v0.6 矩阵覆盖，不据此推断实时 DMS 行为。
- [ ] v0.4 watcher latency、topology rescan 和错误恢复的 runtime gate；v0.8 用户报告覆盖部分 topology/reload/multi-screen 检查但未独立复跑；精确延迟、idle 性能与资源峰值未测。
- [x] v0.5 UI/UX Design Gate 已由用户确认。
- [x] v0.6 pill/popout 已通过确定性 state-matrix、静态和 offscreen 门槛；真实 Wayland/DMS restart 限制已单列且未冒充通过。
- [x] v0.7 Markdown、archive、settings 和 empty/error recovery 已通过契约/静态门槛；真实 Wayland/DMS host gates 按上方状态单列，未冒充运行态通过。
- [ ] v0.8 fixture/static 核心矩阵与安全证据已归档，DMS 1.6.2 核心 RC 检查有用户报告；本会话未独立复跑，性能/精确延迟未测，因此包含性能回归的完整 RC 门槛仍未关闭。
- [ ] v0.9 Desktop、locale 和 Launcher 的 DMS host 检查仍未验证，状态记录在归档的 v1.0.2 acceptance evidence 中；Desktop 实例显示/重置、挂载目录选择和 archive warning 的静态实现及 Node 契约检查已通过，GUI 运行验收仍待完成；Launcher 的导入和根对象错误已修复，最新启动日志显示 bar/daemon 已加载，但需在 DMS Launcher UI 中输入触发词完成复验；其他项逐项通过或关闭/延期，且不成为核心启动依赖。
- [x] v1.0 候选文档、权限、禁用/回滚路径和已知限制已与 manifest 和验收证据对齐；host acceptance 仍是独立未关闭的发布门槛。
