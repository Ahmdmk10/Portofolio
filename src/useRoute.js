import { useEffect, useState } from 'react'

export const ROUTES = ['home', 'code', 'design', 'learning']

const read = () => {
  const r = window.location.hash.replace(/^#\/?/, '').split('/')[0]
  return ROUTES.includes(r) ? r : 'home'
}

export default function useRoute() {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => setRoute(read()) // scrolling to the top is done by App, once the loading cover hides the swap
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
