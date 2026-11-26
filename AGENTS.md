# AI Factory · Agent 工作规则

本文件对所有在此仓库工作的 agent 生效；与用户级全局规则同时遵循。

## 项目概览

目标：搭建自己的 AI Factory —— 把已有的优秀项目（SpriteKiln / FlixML·Spool / Comic Pipeline / ComfyUI·MCP 等）组合成一个**可组合、可扩展、可由 Agent 自动操作**的统一生产平台。技术栈：React 19 + Vite + TypeScript；后端设计参考 Supabase（Auth / Postgres / Realtime / Storage / Edge Functions）。当前阶段为原型开发，优先把首页功能板块与 AI Factory Manager 做扎实。

## 常用命令

- `npm run dev` — 本地开发
- `npm run build` — tsc 类型检查 + vite 构建（**提交前必须通过**）
- `npm run lint` — ESLint（**提交前必须通过**）

## Git 提交纪律

- **不要主动执行 `git commit` / `git push` 等提交类命令**，只有用户明确要求提交时才执行。
- **commit message 一律用英文**（标题与正文）。
- 不主动创建/删除远程分支、不主动改 remote；涉及远程仓库的操作先与用户确认。

## 代码文件规模

- **尽量每个代码文件不超过 200 行**（含 `.ts` / `.tsx` / `.css`）。新写代码优先拆分模块；修改已接近或超过 200 行的文件时，顺手做低风险拆分（提取子组件、工具函数、样式分段），不引入行为变化。

## 架构与分层

- `src/lib/` — 与 React 无关的数据层与纯逻辑（任务拆解、存储、IME 防护等）。
- `src/components/` — 可复用 UI 组件；`src/pages/` — 页面级组件；`src/styles/` — 分段样式。
- `supabase/schema.sql` — 数据库结构的唯一真实来源；改表结构必须同步更新此文件。
- 数据库设计原则参考成熟做法：`if not exists` 幂等建表、RLS 限定 owner、Realtime 表用 `replica identity full`、服务端定时任务兜底、密钥只放服务端（Edge Function / Vault），绝不进 `VITE_` 变量。
- 新增生产线（game / video / comic / …）时通过注册表/配置扩展，不要改页面结构；工作流引擎提供统一队列、任务状态与错误重试。

## 输入框与输入法（IME）· 强制规则

- **所有文本输入框的 Enter 处理必须防输入法误触**：中文/日文/韩文等有候选词的输入法在组词状态下，按 Enter 是"确认候选词上屏"，绝不能触发业务逻辑（发送/保存/确认/跳转下一字段）。
- 统一使用 `src/lib/ime.ts` 的 `useImeEnter()`：
  ```tsx
  const ime = useImeEnter()
  <input {...ime.imeProps} onKeyDown={(e) => {
    if (ime.imeConsumesEnter(e)) return
    if (e.key !== 'Enter') return
    e.preventDefault()
    // ...业务逻辑...
  }} />
  ```
- 判定必须同时覆盖三种信号：`nativeEvent.isComposing`（标准）、`keyCode === 229`（旧内核组词中）、以及 Safari 时序（compositionend 先于提交 Enter 的 keydown，由 hook 内的 ref 延迟一拍兜住）——不能只查 `isComposing`。
- 新增任何带 Enter 行为的输入框（单行/多行）都必须接这个 hook；review 时把"输入框 Enter 没接 ime 防护"当作 bug。

## 输入框清空按钮（Clear button）· 设计原则

- 文本输入框（任务描述等）在**有内容时**，在输入框内部右侧显示一个 `×` 清空按钮，作为输入框的一部分（绝对定位覆盖在输入框内，不放在输入框外部）。
- 清空按钮点击后清空内容并重新聚焦输入框；点击时必须 `preventDefault`，避免抢走输入框焦点（移动端键盘不收起）。
- 实现时：外层 `position: relative` 容器包裹 `input` 与按钮；`input` 宽度 `100%`，并设置右侧 `padding-right` 为按钮留出空间；按钮 `position: absolute; right; top: 50%; transform: translateY(-50%)`。
- 新增任何带清空功能的输入框都应遵循此布局，review 时把"清空按钮在输入框外部/遮挡文字/点击失焦"当作 bug。

## 移动端列表交互 · 强制规则

- **移动端（触屏）下，手指在列表上滑动时，不得触发列表项的点击态/背景色变化**：`:hover` 在触屏上会粘滞，滑动时会出现"先被点击"的背景色。所有列表项（任务行、步骤行、设置菜单等）在 `@media (hover: none), (pointer: coarse)` 下必须将 `:hover` 背景设为透明，并为滚动容器添加 `touch-action: pan-y` 与 `-webkit-overflow-scrolling: touch`。
- review 时把"移动端滑动列表项出现背景色变化"当作 bug。

## 结构速览

- `src/lib/` — 数据层与纯逻辑（不依赖 React）。
- `src/components/` — UI 组件；`src/pages/` — 路由页面；`src/styles/` — 按段拆分的 CSS。
- `supabase/schema.sql` — 数据库结构（唯一真实来源）。
- `.env.local`（不入库）— 后续接入 Supabase / 模型服务时见 `.env.local.example`。
