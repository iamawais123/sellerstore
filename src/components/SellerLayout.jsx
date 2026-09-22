import { useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SupportChatWidget from './SupportChatWidget'

const SellerLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { seller, sellerReady, sellerError, logoutSeller, getSellerNotifications } = useAuth()
  // The mobile drawer only. On desktop (lg+) the sidebar is always shown and the content always makes room for it.
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Picking a page on a phone should reveal it, not leave the drawer covering it.
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // The session and the shop arrive from Firestore, so wait for them instead of bouncing a
  // signed-in seller to the login page on every reload.
  if (!sellerReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#0a3d62]" />
          <p className="text-sm font-semibold">Loading your shop…</p>
        </div>
      </div>
    )
  }

  if (!seller?.id) {
    if (sellerError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-black text-gray-900">We couldn't load your shop</h1>
            <p className="mt-2 text-gray-500">{sellerError}</p>
            <button onClick={() => window.location.reload()} className="mt-6 w-full rounded-2xl bg-gray-900 px-5 py-3 font-bold text-white hover:bg-gray-800">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return <Navigate to="/seller/login" replace />
  }

  if (seller.deleted || seller.suspended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-gray-900">
            {seller.deleted ? 'This store has been deleted' : 'Your account is suspended'}
          </h1>
          <p className="mt-2 text-gray-500">
            {seller.deleted
              ? 'This seller store is no longer active. Contact support if you believe this is a mistake.'
              : 'Access to your seller dashboard has been temporarily suspended. Contact support for more information.'}
          </p>
          <button
            onClick={() => { logoutSeller(); navigate('/') }}
            className="mt-6 w-full rounded-2xl bg-gray-900 px-5 py-3 font-bold text-white hover:bg-gray-800"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  const unreadNotifications = getSellerNotifications().filter((item) => !item.read).length

  const navItems = [
    {
      to: '/seller/dashboard',
      label: 'Dashbord',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      to: '/seller/products',
      label: 'Products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      to: '/seller/orders',
      label: 'Orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      to: '/seller/withdraw',
      label: 'Withdraw',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: '/seller/notifications',
      label: 'Notifications',
      badge: unreadNotifications,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      to: '/seller/profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  const handleSignOut = () => {
    logoutSeller()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-40 shadow-xl lg:shadow-none transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#0a3d62]/10 flex items-center justify-center text-[#0a3d62] shadow-sm shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{seller.shopName}</p>
              <p className="text-sm text-gray-500 truncate">{seller.fullName}</p>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 shrink-0"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-gradient-to-br from-[#0a3d62] to-[#0f4c81] rounded-2xl p-4 text-white shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
              Shop Balance
            </p>
            <p className="text-2xl font-bold mb-1">
              ${seller.balance.toFixed(2)}
            </p>
            <p className="text-xs text-blue-200">
              Guarantee: ${seller.guarantee.toFixed(2)}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <span className="text-gray-500">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="min-w-[1.25rem] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 lg:ml-64">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-100 bg-white/95 px-4 py-3 lg:hidden">
          <button
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="min-w-0 flex-1 truncate font-semibold text-gray-900">{seller.shopName}</p>
        </div>
        <div className="p-6 lg:p-8">
          <Outlet context={{ seller }} />
        </div>
      </main>

      <SupportChatWidget />
    </div>
  )
}

export default SellerLayout
