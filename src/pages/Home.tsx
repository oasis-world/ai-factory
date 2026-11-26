import { FactoryMap } from '../components/FactoryMap'
import { Icon } from '../components/Icon'
import '../styles/home.css'

export default function Home() {
  return (
    <main className="page-shell home-shell">
      <header className="home-hero">
        <div className="home-brand">
          <span className="brand-mark"><Icon name="spark" size={20} /></span>
          <span className="brand-name">AI Factory</span>
          <span className="hero-badge">实验原型 · v0.1</span>
        </div>
        <h1>搭建自己的 AI Factory</h1>
        <p className="hero-lead">
          不寻找一个已经实现所有功能的项目——把优秀项目组合起来，
          构建一个可组合、可扩展、由 Agent 驱动的生产平台。
        </p>
        <p className="hero-en">
          Build your own AI Factory: compose the best tools into one unified,
          agent-operable production platform.
        </p>
      </header>

      <FactoryMap />

      <footer className="home-foot">
        点击任意板块进入 · Click any module to explore
      </footer>
    </main>
  )
}
