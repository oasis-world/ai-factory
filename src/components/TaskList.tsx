import type { Task, TaskStatus } from '../lib/types'
import { Icon } from './Icon'

const STATUS_TEXT: Record<TaskStatus, string> = {
  draft: '待分配',
  running: '执行中',
  review: '待检查',
  done: '已完成',
}

interface Props {
  tasks: Task[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskList({ tasks, selectedId, onSelect, onDelete }: Props) {
  return (
    <section className="panel task-list">
      <div className="list-head">
        <h2 className="panel-title">任务列表</h2>
        <span className="count">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="empty">还没有任务，先在上方描述一个目标吧。</p>
      ) : (
        <div className="list-scroll">
          {tasks.map((task) => {
            const approved = task.steps.filter((step) => step.approved).length
            const percent = task.steps.length
              ? Math.round((approved / task.steps.length) * 100) : 0
            return (
              <div
                key={task.id}
                className={`task-row${task.id === selectedId ? ' selected' : ''}`}
              >
                <button
                  type="button"
                  className="task-select"
                  onClick={() => onSelect(task.id)}
                >
                  <span className="task-row-top">
                    <strong>{task.title}</strong>
                    <span className={`pill status-${task.status}`}>
                      {STATUS_TEXT[task.status]}
                    </span>
                  </span>
                  <span className="task-meta">
                    {task.steps.length} 个步骤 · {new Date(task.createdAt).toLocaleString('zh-CN')}
                  </span>
                  <span className="mini-track">
                    <span className="mini-fill" style={{ width: `${percent}%` }} />
                  </span>
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`删除任务：${task.title}`}
                  onClick={() => onDelete(task.id)}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
