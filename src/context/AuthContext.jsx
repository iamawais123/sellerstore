import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const SELLER_KEY = 'uss_seller_auth'
const CUSTOMER_KEY = 'uss_customer_auth'

const defaultSeller = {
  fullName: 'Awais Shafique',
  shopName: 'Dock11',
  email: '',
  balance: 0.0,
  guarantee: 0.0,
  rating: 5.0,
  orderCount: 0,
  verified: false,
  status: 'Under review',
  memberSince: 'Sep 2026',
}

const defaultCustomer = null

export function AuthProvider({ children }) {
  const [seller, setSeller] = useState(() => {
    try {
      const raw = localStorage.getItem(SELLER_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        return { ...defaultSeller, ...parsed }
      }
    } catch (_) {}
    return defaultSeller
  })

  const [customer, setCustomer] = useState(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY)
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    return defaultCustomer
  })

  useEffect(() => {
    try {
      localStorage.setItem(SELLER_KEY, JSON.stringify(seller))
    } catch (_) {}
  }, [seller])

  useEffect(() => {
    try {
      if (customer) localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer))
      else localStorage.removeItem(CUSTOMER_KEY)
    } catch (_) {}
  }, [customer])

  const loginSeller = (payload) => {
    setSeller((prev) => ({
      ...prev,
      ...payload,
    }))
  }

  const logoutSeller = () => {
    try {
      localStorage.removeItem(SELLER_KEY)
    } catch (_) {}
    setSeller(defaultSeller)
  }

  const loginCustomer = (payload) => {
    setCustomer(payload || { email: '', fullName: '' })
  }

  const logoutCustomer = () => {
    try {
      localStorage.removeItem(CUSTOMER_KEY)
    } catch (_) {}
    setCustomer(defaultCustomer)
  }

  return (
    <AuthContext.Provider
      value={{
        seller,
        loginSeller,
        logoutSeller,
        customer,
        loginCustomer,
        logoutCustomer,
        isCustomerLoggedIn: !!customer,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
