import { MODULES, type FactoryModule } from '../lib/modules'
import { Icon } from './Icon'

function FlowCard({ module, full = false }: { module: FactoryModule; full?: boolean }) {
  return (
    <a
      href={`#/${module.id}`}
      className={`flow-card tone-${module.tone}${full ? ' flow-full' : ''}`}
      aria-label={`进入 ${module.name}`}
    >
      <span className="flow-icon"><Icon name={module.icon} size={full ? 30 : 27} /></span>
      <strong className="flow-name">{module.name}</strong>
      <span className="flow-sub">{module.sub}</span>
      {full && <span className="flow-desc">{module.desc}</span>}
      <span className="flow-enter">进入 →</span>
    </a>
  )
}

function FlowArrow() {
  return (
    <div className="flow-arrow" aria-hidden="true">
      <span className="flow-arrow-line" />
      <span className="flow-arrow-head" />
    </div>
  )
}

export function FactoryMap() {
  return (
    <section className="factory-map">
      <FlowCard module={MODULES.manager} full />
      <FlowArrow />
      <div className="flow-grid">
        <FlowCard module={MODULES.game} />
        <FlowCard module={MODULES.video} />
        <FlowCard module={MODULES.comic} />
      </div>
      <FlowArrow />
      <FlowCard module={MODULES.engine} full />
      <FlowArrow />
      <FlowCard module={MODULES.assets} full />
    </section>
  )
}
