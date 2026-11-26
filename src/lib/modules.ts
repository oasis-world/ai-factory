import type { IconName } from '../components/Icon'

export interface FactoryModule {
  id: string
  name: string
  sub: string
  desc: string
  icon: IconName
  tone: string
}

export const MODULES: Record<string, FactoryModule> = {
  manager: {
    id: 'manager',
    name: 'AI Factory Manager',
    sub: 'Codex / Claude Code / 本地 Agent',
    desc: '理解任务、拆解任务、分配生产线、检查结果',
    icon: 'robot',
    tone: 'mint',
  },
  game: {
    id: 'game',
    name: 'Game Factory',
    sub: 'SpriteKiln',
    desc: '游戏素材生产：角色 sprite、图块、UI 与动画帧',
    icon: 'game',
    tone: 'blue',
  },
  video: {
    id: 'video',
    name: 'Video Factory',
    sub: 'FlixML / Spool',
    desc: '短剧、广告与宣传视频的生产线',
    icon: 'video',
    tone: 'violet',
  },
  comic: {
    id: 'comic',
    name: 'Comic Factory',
    sub: 'Comic Pipeline',
    desc: '分镜、页面与连载漫画的生产线',
    icon: 'comic',
    tone: 'cream',
  },
  engine: {
    id: 'engine',
    name: 'ComfyUI + MCP + Workflow Engine',
    sub: '统一模型调用、工作流执行、队列、任务状态、错误重试',
    desc: '所有生产线共享的执行底座',
    icon: 'engine',
    tone: 'mint',
  },
  assets: {
    id: 'assets',
    name: 'Unified Asset Library',
    sub: '统一素材管理、版本控制、质量审核、元数据、导出',
    desc: '所有产出的统一归宿',
    icon: 'assets',
    tone: 'white',
  },
}

export function getModule(id: string): FactoryModule {
  return MODULES[id] ?? {
    id, name: id, sub: '', desc: '该模块正在规划中', icon: 'spark', tone: 'white',
  }
}
