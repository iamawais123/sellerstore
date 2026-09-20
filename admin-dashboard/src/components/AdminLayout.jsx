import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { conversationId } from '../firebase/shopData'

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    admin,
    logoutAdmin,
    updateAdminInviteCode,
    regenerateAdminInviteCode,
    impersonation,
    getSupportConversations,
    getAdminNotifications,
    markAdminNotificationsRead,
  } = useAuth()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)
  const [editingInvite, setEditingInvite] = useState(false)
  const [inviteDraft, setInviteDraft] = useState(admin.inviteCode || '')
  const [copied, setCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [inviteError, setInviteError] = useState('')

  // What sellers wrote in support chat: unread messages badge the Support link, and each message
  // also raises a notification in the bell.
  const supportUnread = getSupportConversations('admin').reduce((sum, item) => sum + (item.unreadForAdmin || 0), 0)
  const notifications = getAdminNotifications()
  const unreadNotifications = notifications.filter((item) => !item.read)

  useEffect(() => {
    if (!bellOpen) return undefined
    const close = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [bellOpen])

  const openNotification = (notification) => {
    if (!notification.read) markAdminNotificationsRead([notification.id])
    setBellOpen(false)
    navigate(`/support?c=${conversationId(notification.sellerId)}`)
  }

  const initials = (admin.fullName || 'A')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const manageItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      ),
    },
    {
      to: '/sellers',
      label: 'Sellers',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      to: '/kyc',
      label: 'KYC',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      to: '/orders',
      label: 'Orders',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
  ]

  const communicationItems = [
    {
      to: '/support',
      label: 'Support',
      badge: supportUnread,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ]

  const financeItems = [
    {
      to: '/withdrawals',
      label: 'Withdrawals',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
  ]

  const activityItems = [
    {
      to: '/recent-actions',
      label: 'Recent Actions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      to: '/my-logs',
      label: 'My Logs',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ]

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(admin.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {}
  }

  const handleStartEdit = () => {
    setInviteDraft(admin.inviteCode)
    setInviteError('')
    setEditingInvite(true)
  }

  const handleSaveInvite = async () => {
    const result = await updateAdminInviteCode(inviteDraft)
    if (result.success) {
      setEditingInvite(false)
      setInviteError('')
    } else {
      setInviteError(result.error || 'Invalid code')
    }
  }

  const handleCancelEdit = () => {
    setEditingInvite(false)
    setInviteDraft(admin.inviteCode)
    setInviteError('')
  }

  const handleRegenerate = async () => {
    const result = await regenerateAdminInviteCode()
    if (result.success) return
    // Surface the problem in the edit box, which is where invite-code errors are shown.
    setInviteDraft(admin.inviteCode)
    setInviteError(result.error || 'Could not generate a new invite code.')
    setEditingInvite(true)
  }

  const handleSignOut = () => {
    logoutAdmin()
    navigate('/login')
  }

  const renderNavGroup = (title, items) => (
    <div className="mb-6">
      {title && (
        <p className="px-4 mb-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
          {title}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={`flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-gray-500'}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span className="min-w-[1.5rem] rounded-full bg-red-500 px-2 py-0.5 text-center text-xs font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`w-[280px] bg-white border-r border-gray-100 flex flex-col fixed h-full z-40 shadow-xl lg:shadow-none transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-bold text-gray-900 text-[18px] leading-tight">
                  U Seller{' '}
                  <span className="text-indigo-600">Store</span>
                </p>
                <p className="text-[13px] text-gray-500 font-medium">Management Console</p>
              </div>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100 text-gray-500"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 pb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-[15px] truncate">{admin.fullName || 'Administrator'}</p>
              <p className="text-[13px] text-gray-500 font-medium">Administrator</p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2.5">
              Invite
            </p>
            {!editingInvite ? (
              <div className="flex items-center space-x-2">
                <span className="flex-1 font-mono font-bold text-[17px] text-gray-900 tracking-wide">
                  {admin.inviteCode}
                </span>
                <button
                  onClick={handleCopyInvite}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    copied
                      ? 'bg-green-100 text-green-600'
                      : 'bg-white text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200'
                  }`}
                  title="Copy code"
                >
                  {copied ? (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleStartEdit}
                  className="p-2 rounded-xl bg-white text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 border border-gray-200"
                  title="Edit code"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={handleRegenerate}
                  className="p-2 rounded-xl bg-white text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 border border-gray-200"
                  title="Regenerate code"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={inviteDraft}
                  onChange={(e) => setInviteDraft(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 bg-white border-2 border-indigo-200 rounded-xl font-mono font-bold text-gray-900 tracking-wide focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Invite code"
                  autoFocus
                />
                {inviteError && (
                  <p className="text-xs font-semibold text-red-600">{inviteError}</p>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveInvite}
                    className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {renderNavGroup('Manage', manageItems)}
          {renderNavGroup('Communication', communicationItems)}
          {renderNavGroup('Finance', financeItems)}
          {renderNavGroup('Activity', activityItems)}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 w-full px-4 py-3.5 rounded-2xl text-[15px] font-bold text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-[280px]' : 'ml-0'}`}>
        <div className="sticky top-0 z-20">
        {impersonation && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-5 lg:px-8 py-3 text-white">
            <p className="text-sm font-semibold">
              Super admin session — you are viewing this console as <span className="font-black">{admin.fullName}</span>
              {impersonation.superAdminName ? ` (signed in by ${impersonation.superAdminName})` : ''}.
            </p>
            <a
              href="/super-admin-app/admins"
              onClick={() => logoutAdmin()}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25 transition-colors"
            >
              Return to Super Admin
            </a>
          </div>
        )}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-5 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen((open) => !open)}
                  aria-label={unreadNotifications.length ? `Notifications, ${unreadNotifications.length} unread` : 'Notifications'}
                  className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-600 transition-colors relative"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 border-2 border-white text-[11px] font-bold text-white">
                      {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <p className="font-bold text-gray-900">Notifications</p>
                      {unreadNotifications.length > 0 && (
                        <button
                          onClick={() => markAdminNotificationsRead(unreadNotifications.map((item) => item.id))}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet. Seller messages will show up here.</p>}
                      {notifications.slice(0, 20).map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => openNotification(notification)}
                          className={`block w-full border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${notification.read ? '' : 'bg-indigo-50/40'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                            {!notification.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                          </div>
                          <p className="mt-0.5 truncate text-sm text-gray-600">{notification.message}</p>
                          <p className="mt-1 text-xs font-semibold text-gray-400">{notification.time}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                {initials}
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="p-5 lg:p-8">
          <Outlet context={{ admin }} />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
