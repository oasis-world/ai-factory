import { useEffect, useState } from 'react'
import ComingSoon from './pages/ComingSoon'
import Home from './pages/Home'
import ManagerPage from './pages/ManagerPage'

type Route =
  | { page: 'home' }
  | { page: 'manager' }
  | { page: 'soon'; id: string }

function parseHash(): Route {
  const id = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]
  if (!id) return { page: 'home' }
  if (id === 'manager') return { page: 'manager' }
  return { page: 'soon', id }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (route.page === 'manager') return <ManagerPage />
  if (route.page === 'soon') return <ComingSoon id={route.id} />
  return <Home />
}
