import { getModule } from '../lib/modules'
import { Icon } from '../components/Icon'
import '../styles/home.css'

export default function ComingSoon({ id }: { id: string }) {
  const module = getModule(id)
  return (
    <main className="page-shell">
      <div className="page-head">
        <a className="back-link" href="#/">
          <Icon name="back" size={16} /> 返回首页
        </a>
      </div>
      <section className={`panel soon-panel tone-${module.tone}`}>
        <span className="flow-icon"><Icon name={module.icon} size={44} /></span>
        <h1>{module.name}</h1>
        <p className="soon-sub">{module.sub || '规划中'}</p>
        <p className="soon-desc">{module.desc}</p>
        <p className="soon-note">
          该生产线尚未接入。当前原型先完成 AI Factory Manager 的
          「拆解 → 分配 → 执行 → 检查」流程。
        </p>
        <a className="btn" href="#/manager">前往 AI Factory Manager</a>
      </section>
    </main>
  )
}
