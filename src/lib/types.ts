export type Pipeline = 'general' | 'game' | 'video' | 'comic' | 'engine'
export type StepStatus = 'pending' | 'running' | 'done' | 'failed'
export type TaskStatus = 'draft' | 'running' | 'review' | 'done'

export interface Step {
  id: string
  title: string
  detail: string
  pipeline: Pipeline
  status: StepStatus
  approved: boolean
  result: string
}

export interface Task {
  id: string
  title: string
  createdAt: number
  status: TaskStatus
  steps: Step[]
}
