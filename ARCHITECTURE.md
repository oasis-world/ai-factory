# AI Factory 架构说明

> 本文是**设计参考**，借鉴 one-hour 项目的分层方式、Supabase 幂等建表 / RLS / Realtime / 服务端兜底等实践，用于指导本仓库后续开发；不是已完成实现清单。

## 一、定位

把已有的单点项目（SpriteKiln、FlixML / Spool、Comic Pipeline、ComfyUI + MCP）组合成一个统一生产平台：

- 上层：**AI Factory Manager**，由 Codex / Claude Code / 本地 Agent 理解、拆解、分配、验收任务。
- 中层：各条**生产线**（game / video / comic / …），各自注册模型与工作流。
- 底层：**Workflow Engine**（统一模型调用、工作流执行、队列、任务状态、错误重试）与 **Unified Asset Library**（素材管理、版本、审核、元数据、导出）。

目标：新增一条产线或一个新模型时，只做注册/配置，不改平台主干。

## 二、分层（参考 one-hour 的 UI → facade → 远端/本地 → 数据库分层）

```text
┌──────────────────────────────────────────────┐
│ UI 层  src/pages + src/components             │
│ 首页功能图 / Manager / 各生产线 / 素材库       │
└──────────────┬───────────────────────────────┘
               │ typed API（任务 / 步骤 / 运行 / 素材）
┌──────────────▼───────────────────────────────┐
│ 领域层 src/lib                                │
│ taskEngine（拆解/分配/验收） · store · ime      │
└──────────────┬───────────────────────────────┘
               │ Supabase / 本地 IndexedDB
┌──────────────▼───────────────────────────────┐
│ 数据层 supabase/schema.sql                    │
│ factory_tasks / steps / workflow_runs / assets│
│ RLS + Realtime + 定时重试兜底                 │
└──────────────────────────────────────────────┘
```

## 三、核心数据模型（`supabase/schema.sql`）

- `factory_tasks`：一个用户目标 = 一行；`status: draft → running → review → done`。
- `factory_steps`：任务拆解出的步骤，`pipeline` 指向生产线，`status` + `attempt/max_attempts` 支撑重试。
- `workflow_runs`：工作流执行记录（输入/输出 JSON、耗时、错误）；工作流引擎按 `queued` 顺序领取。
- `assets` / `asset_versions`：统一素材及版本，带 `kind`、`metadata`、`qa_status`；一次生成对应一个版本。

设计惯例（来自 one-hour 经验）：`create table if not exists` + `alter ... add column if not exists` 保持脚本可重复执行；RLS 限定 owner，服务端角色用 `SECURITY DEFINER` 函数做兜底；Realtime 表 `replica identity full` 才能拿到完整 UPDATE/DELETE 载荷；密钥只放服务端。

## 四、状态机与重试

```text
task:   draft ──拆解──> draft(steps) ──分配──> running ──全部执行──> review ──人工/Agent验收──> done
step:   pending ─> running ─> done ─(驳回)─> failed ─(重试)─> pending
run:    queued ─> running ─> succeeded | failed ─(attempt < max_attempts)─> queued
```

- 前端原型用定时器模拟执行；接后端后由 `workflow_runs` 队列驱动，前端只订阅状态。
- 失败重试在服务端做幂等（幂等键 + 乐观锁 `version`），避免多客户端重复领取同一任务。

## 五、扩展方式

- **新生产线**：在 `PIPELINES` 注册表增加 id / 名称 / 颜色 / 默认工作流，页面与数据结构不变。
- **新模型/工作流**：只改该产线的适配层；Workflow Engine 提供统一调用接口与队列。
- **新 Agent**：通过 Manager 的结构化接口读写任务与步骤，不直接操作 UI。

## 六、当前原型与后续路径

当前原型（本地状态 + localStorage，无后端）：首页功能图 → Manager 拆解/分配/执行/检查。
后续：接入 Supabase（Auth + 上述表）→ Workflow Engine（ComfyUI / MCP 适配器）→ Asset Library → 三条真实产线 → Agent 自动化。

## 七、开发规约

详见 `AGENTS.md`：提交前 `npm run build` 与 `npm run lint` 必须通过；不主动 commit/push；单文件尽量 ≤200 行；输入框 Enter 必须接 `useImeEnter`；移动端列表 hover 不粘滞。
