import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const WishlistContext = createContext(null)

const WISHLIST_KEY = 'uss_wishlist'

const readIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(WISHLIST_KEY))
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch (_) {
    return []
  }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(readIds)

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids))
    } catch (_) {}
  }, [ids])

  // Keep several open tabs in step.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === WISHLIST_KEY) setIds(readIds())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const has = useCallback((id) => ids.includes(String(id)), [ids])

  const toggle = useCallback((id) => {
    const key = String(id)
    setIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]))
  }, [])

  const clear = useCallback(() => setIds([]), [])

  const value = useMemo(() => ({ ids, count: ids.length, has, toggle, clear }), [ids, has, toggle, clear])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
