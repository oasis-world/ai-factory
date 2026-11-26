import { PIPELINE_IDS, PIPELINES } from '../lib/taskEngine'
import type { Pipeline, Step, StepStatus, Task } from '../lib/types'
import { Icon } from './Icon'

const STEP_STATUS: Record<StepStatus, string> = {
  pending: '等待中',
  running: '执行中',
  done: '已生成',
  failed: '需重做',
}

interface Props {
  task: Task
  onStart: () => void
  onApprove: (stepId: string) => void
  onReject: (stepId: string) => void
  onRegenerate: (stepId: string) => void
  onSetPipeline: (stepId: string, pipeline: Pipeline) => void
}

function StepRow({ step, index, task, onApprove, onReject, onRegenerate, onSetPipeline }: {
  step: Step
  index: number
  task: Task
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onRegenerate: (id: string) => void
  onSetPipeline: (id: string, pipeline: Pipeline) => void
}) {
  const reviewable = task.status === 'review' || task.status === 'done'
  return (
    <li className="step-row">
      <div className="step-head">
        <span className="step-index">{index + 1}</span>
        <div className="step-main">
          <strong>{step.title}</strong>
          <p>{step.detail}</p>
        </div>
        <span className={`pill status-${step.status}`}>{STEP_STATUS[step.status]}</span>
      </div>
      <div className="step-controls">
        <label className="pipeline-select">
          生产线
          <select
            value={step.pipeline}
            disabled={task.status === 'running'}
            onChange={(event) => onSetPipeline(step.id, event.target.value as Pipeline)}
          >
            {PIPELINE_IDS.map((id) => (
              <option key={id} value={id}>{PIPELINES[id].label}</option>
            ))}
          </select>
        </label>
        {step.status === 'done' && <span className="step-result">{step.result}</span>}
        {step.status === 'failed' && (
          <button type="button" className="btn small ghost" onClick={() => onRegenerate(step.id)}>
            重新生成
          </button>
        )}
        {reviewable && step.status === 'done' && !step.approved && (
          <span className="review-actions">
            <button type="button" className="btn small" onClick={() => onApprove(step.id)}>
              通过
            </button>
            <button type="button" className="btn small ghost" onClick={() => onReject(step.id)}>
              驳回
            </button>
          </span>
        )}
        {step.approved && (
          <span className="approved"><Icon name="check" size={14} /> 已通过</span>
        )}
      </div>
    </li>
  )
}

export function TaskDetail({
  task, onStart, onApprove, onReject, onRegenerate, onSetPipeline,
}: Props) {
  const approved = task.steps.filter((step) => step.approved).length
  const percent = task.steps.length ? (approved / task.steps.length) * 100 : 0

  return (
    <div className="detail-content">
      <div className="detail-head">
        <div>
          <h2 className="panel-title">{task.title}</h2>
          <p className="panel-hint">{task.steps.length} 个步骤 · 检查通过 {approved} 项</p>
        </div>
        {task.status === 'draft' && (
          <button type="button" className="btn" onClick={onStart}>分配到生产线并开始</button>
        )}
        {task.status === 'running' && <span className="pill status-running">执行中…</span>}
        {task.status === 'review' && <span className="pill status-review">请检查下方结果</span>}
        {task.status === 'done' && <span className="pill status-done">已交付</span>}
      </div>
      <div className="detail-track"><span style={{ width: `${percent}%` }} /></div>
      <ol className="steps">
        {task.steps.map((step, index) => (
          <StepRow
            key={step.id}
            step={step}
            index={index}
            task={task}
            onApprove={onApprove}
            onReject={onReject}
            onRegenerate={onRegenerate}
            onSetPipeline={onSetPipeline}
          />
        ))}
      </ol>
    </div>
  )
}
