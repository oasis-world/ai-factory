import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useImeEnter } from '../lib/ime'

const EXAMPLES = [
  '生成一套赛博朋克角色的游戏 sprite',
  '把短篇故事做成 4 格漫画',
  '制作一支 15 秒的广告短片',
]

export function TaskComposer({ onAdd }: { onAdd: (title: string) => void }) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const ime = useImeEnter()

  const submit = () => {
    const title = text.trim()
    if (!title) return
    onAdd(title)
    setText('')
  }

  const clear = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault() // keep focus (mobile keyboard stays open)
    setText('')
    inputRef.current?.focus()
  }

  return (
    <section className="panel composer">
      <h2 className="panel-title">新任务</h2>
      <p className="panel-hint">描述目标，Manager 会拆解为步骤并分配到生产线。</p>
      <div className="composer-row">
        <div className="input-wrap">
          <input
            ref={inputRef}
            {...ime.imeProps}
            value={text}
            placeholder="例如：生成一套赛博朋克角色 sprite…"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (ime.imeConsumesEnter(event)) return
              if (event.key === 'Enter') { event.preventDefault(); submit() }
            }}
          />
          {text && (
            <button
              type="button"
              className="clear-btn"
              aria-label="清空输入"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
            >
              ×
            </button>
          )}
        </div>
        <button type="button" className="btn" disabled={!text.trim()} onClick={submit}>
          拆解任务
        </button>
      </div>
      <div className="examples">
        <span>试试：</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="chip"
            onClick={() => setText(example)}
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  )
}
