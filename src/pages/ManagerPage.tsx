import { useState } from 'react'
import { Icon } from '../components/Icon'
import { TaskComposer } from '../components/TaskComposer'
import { TaskDetail } from '../components/TaskDetail'
import { TaskList } from '../components/TaskList'
import { useTasks } from '../lib/useTasks'
import '../styles/manager.css'

export default function ManagerPage() {
  const store = useTasks()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = store.tasks.find((task) => task.id === selectedId)
    ?? store.tasks[0] ?? null

  const handleAdd = (title: string) => setSelectedId(store.addTask(title))

  const handleDelete = (id: string) => {
    store.removeTask(id)
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <main className="page-shell manager-shell">
      <header className="page-head manager-head">
        <div>
          <a className="back-link" href="#/">
            <Icon name="back" size={16} /> 返回首页
          </a>
          <div className="page-kicker">AI Factory Manager</div>
          <h1 className="page-title">任务管理中心</h1>
          <p className="page-subtitle">
            Codex / Claude Code / 本地 Agent —— 理解任务、拆解任务、分配生产线、检查结果。
          </p>
        </div>
        <span className="hero-badge">原型</span>
      </header>

      <TaskComposer onAdd={handleAdd} />

      <div className="manager-grid">
        <TaskList
          tasks={store.tasks}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={handleDelete}
        />
        <section className="panel detail-panel">
          {selected ? (
            <TaskDetail
              task={selected}
              onStart={() => store.startTask(selected.id)}
              onApprove={(stepId) => store.approveStep(selected.id, stepId)}
              onReject={(stepId) => store.rejectStep(selected.id, stepId)}
              onRegenerate={(stepId) => store.regenerateStep(selected.id, stepId)}
              onSetPipeline={(stepId, pipeline) => store.setPipeline(selected.id, stepId, pipeline)}
            />
          ) : (
            <div className="detail-empty">
              <span className="empty-icon"><Icon name="robot" size={34} /></span>
              <p>选择一个任务查看拆解结果</p>
              <span>或在上方输入一个新目标，开始第一次生产实验。</span>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
