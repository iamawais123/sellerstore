import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

const CART_KEY = 'uss_cart'
const CART_UI_KEY = 'uss_cart_ui_open'

const EmptyBag = () => (
  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (_) {}
    return []
  })

  const [isOpen, setIsOpen] = useState(() => {
    try {
      return localStorage.getItem(CART_UI_KEY) === '1'
    } catch (_) {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch (_) {}
  }, [items])

  useEffect(() => {
    try {
      localStorage.setItem(CART_UI_KEY, isOpen ? '1' : '0')
    } catch (_) {}
  }, [isOpen])

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const toggleCart = () => setIsOpen((v) => !v)

  const addItem = (product, qty = 1) => {
    if (!product || !product.id) return
    const q = Math.max(1, Math.floor(Number(qty) || 1))
    setItems((prev) => {
      const key = String(product.id)
      const idx = prev.findIndex((it) => String(it.id) === key)
      if (idx >= 0) {
        const next = [...prev]
        const existing = next[idx]
        next[idx] = {
          ...existing,
          qty: Math.max(1, (Number(existing.qty) || 0) + q),
          price: Number(product.price ?? existing.price ?? 0),
          image: product.image ?? existing.image,
          name: product.name ?? existing.name,
        }
        return next
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          image: product.image,
          price: Number(product.price ?? 0),
          qty: q,
        },
      ]
    })
    setIsOpen(true)
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => String(it.id) !== String(id)))
  }

  const updateQty = (id, qty) => {
    const q = Math.max(1, Math.floor(Number(qty) || 1))
    setItems((prev) =>
      prev.map((it) => (String(it.id) === String(id) ? { ...it, qty: q } : it))
    )
  }

  const incrementQty = (id, delta = 1) => {
    setItems((prev) =>
      prev.map((it) =>
        String(it.id) === String(id)
          ? { ...it, qty: Math.max(1, (Number(it.qty) || 0) + Math.floor(Number(delta) || 1)) }
          : it
      )
    )
  }

  const decrementQty = (id, delta = 1) => {
    setItems((prev) =>
      prev.map((it) => {
        if (String(it.id) !== String(id)) return it
        const q = Math.max(1, (Number(it.qty) || 1) - Math.floor(Number(delta) || 1))
        return { ...it, qty: q }
      })
    )
  }

  const clearCart = () => setItems([])

  const totals = useMemo(() => {
    const itemCount = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0)
    const subtotal = items.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0),
      0
    )
    return {
      itemCount,
      lineCount: items.length,
      subtotal,
    }
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        updateQty,
        incrementQty,
        decrementQty,
        clearCart,
        itemCount: totals.itemCount,
        lineCount: totals.lineCount,
        subtotal: totals.subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export { EmptyBag }
