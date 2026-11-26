import type { Pipeline, Step } from './types'

export const PIPELINES: Record<Pipeline, { label: string; hint: string }> = {
  general: { label: '通用', hint: '分析与编排' },
  game: { label: 'Game Factory', hint: 'SpriteKiln' },
  video: { label: 'Video Factory', hint: 'FlixML / Spool' },
  comic: { label: 'Comic Factory', hint: 'Comic Pipeline' },
  engine: { label: 'Workflow Engine', hint: 'ComfyUI + MCP' },
}

export const PIPELINE_IDS = Object.keys(PIPELINES) as Pipeline[]

const ROUTES: { words: string[]; pipeline: Pipeline }[] = [
  { words: ['漫画', 'comic', 'manga', '分镜'], pipeline: 'comic' },
  { words: ['视频', '短片', '短剧', 'video', '广告'], pipeline: 'video' },
  { words: ['游戏', 'sprite', '角色图', '像素', 'game'], pipeline: 'game' },
  { words: ['工作流', '模型', 'comfyui', '批量'], pipeline: 'engine' },
]

/** Very small keyword router — replaced later by an LLM-powered planner. */
export function detectPipeline(text: string): Pipeline {
  const lower = text.toLowerCase()
  for (const route of ROUTES) {
    if (route.words.some((word) => lower.includes(word.toLowerCase()))) {
      return route.pipeline
    }
  }
  return 'game'
}

export const newId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`

/** Decompose a goal into four concrete production steps (prototype planner). */
export function decomposeTask(title: string): Step[] {
  const pipeline = detectPipeline(title)
  const specs: { title: string; detail: string; pipeline: Pipeline }[] = [
    {
      title: '理解需求并确认目标',
      detail: '提取主题、风格、产出格式与验收标准，形成任务规格。',
      pipeline: 'general',
    },
    {
      title: '生成规格与提示词',
      detail: `按 ${PIPELINES[pipeline].label} 的模板生成参数、提示词与参考素材清单。`,
      pipeline,
    },
    {
      title: '分配生产线并执行',
      detail: `提交到 ${PIPELINES[pipeline].hint} 工作流，生成第一批素材。`,
      pipeline,
    },
    {
      title: '质量检查与结果汇总',
      detail: '逐项核对规格，记录通过/驳回结论并汇总交付物。',
      pipeline: 'engine',
    },
  ]
  return specs.map((spec) => ({
    id: newId(),
    title: spec.title,
    detail: spec.detail,
    pipeline: spec.pipeline,
    status: 'pending',
    approved: false,
    result: '',
  }))
}

export function fakeResult(step: Step): string {
  const outputs: Record<Pipeline, string> = {
    general: '已输出任务规格：3 项验收标准 + 风格关键词清单。',
    game: 'SpriteKiln 生成完成：4 个角色帧（256×256）+ 1 张图块集预览。',
    video: 'FlixML 渲染完成：3 个分镜片段 + 1 段 12s 预览视频。',
    comic: 'Comic Pipeline 完成：4 格分镜草图 + 1 页排版预览。',
    engine: '工作流执行完成：队列已清空，任务状态与重试记录已写入。',
  }
  return `${outputs[step.pipeline]}（原型模拟结果）`
}
