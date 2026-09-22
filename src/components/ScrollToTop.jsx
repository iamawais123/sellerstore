import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router keeps the old scroll position when the route changes; a new page should start at the top.
const ScrollToTop = () => {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView()
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}

export default ScrollToTop
