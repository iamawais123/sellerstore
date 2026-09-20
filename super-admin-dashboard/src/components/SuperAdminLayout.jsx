import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSuperAuth } from '../context/AuthContext'
import { CopyButton, Icon, initialsOf } from './ui'

const manageItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/admins', label: 'Admins', icon: 'users' },
  { to: '/super-admins', label: 'Super Admins', icon: 'crown' },
]

const activityItems = [{ to: '/activity', label: 'Activity Logs', icon: 'activity' }]

const pageTitles = {
  '/dashboard': ['grid', 'Dashboard'],
  '/admins': ['users', 'Admins'],
  '/super-admins': ['crown', 'Super Admins'],
  '/activity': ['activity', 'Activity Logs'],
}

const SuperAdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { superAdmin, logoutSuperAdmin, updateInviteCode, regenerateInviteCode } = useSuperAuth()
  const [editingInvite, setEditingInvite] = useState(false)
  const [inviteDraft, setInviteDraft] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [titleIcon, title] = pageTitles[location.pathname] || pageTitles['/dashboard']
  const initials = initialsOf(superAdmin.fullName)
  const inviteLink = `${window.location.origin}/admin-app/login?invite=${superAdmin.inviteCode}`

  const handleStartEdit = () => {
    setInviteDraft(superAdmin.inviteCode)
    setInviteError('')
    setEditingInvite(true)
  }

  const handleSaveInvite = async () => {
    const result = await updateInviteCode(inviteDraft)
    if (result.success) {
      setEditingInvite(false)
      setInviteError('')
    } else {
      setInviteError(result.error || 'Invalid code')
    }
  }

  const handleRegenerate = async () => {
    const result = await regenerateInviteCode()
    if (result.success) return
    // Surface the problem in the edit box, which is where invite-code errors are shown.
    setInviteDraft(superAdmin.inviteCode)
    setInviteError(result.error || 'Could not generate a new invite code.')
    setEditingInvite(true)
  }

  const handleSignOut = () => {
    logoutSuperAdmin()
    navigate('/login')
  }

  const iconButton =
    'p-2 rounded-xl bg-white text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 border border-gray-200'

  const renderNavGroup = (heading, items) => (
    <div className="mb-6">
      <p className="px-4 mb-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-400">{heading}</p>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 ${
                  isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-gray-500'}>
                  <Icon name={item.icon} className="w-6 h-6" />
                </span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`w-[280px] bg-white border-r border-gray-100 flex flex-col fixed h-full z-40 shadow-xl lg:shadow-none transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                <Icon name="crown" className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-bold text-gray-900 text-[18px] leading-tight">
                  U Seller <span className="text-indigo-600">Store</span>
                </p>
                <p className="text-[13px] text-gray-500 font-medium">Super Admin Console</p>
              </div>
            </div>
            <button className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100 text-gray-500" onClick={() => setSidebarOpen(false)}>
              <Icon name="close" className="w-5 h-5" />
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
              <p className="font-bold text-gray-900 text-[15px] truncate">{superAdmin.fullName}</p>
              <p className="text-[13px] text-gray-500 font-medium">Super Administrator</p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2.5">Invite</p>
            {!editingInvite ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="flex-1 font-mono font-bold text-[17px] text-gray-900 tracking-wide">{superAdmin.inviteCode}</span>
                  <CopyButton value={superAdmin.inviteCode} label="Copy code" />
                  <button onClick={handleStartEdit} className={iconButton} title="Edit code">
                    <Icon name="edit" className="w-[18px] h-[18px]" />
                  </button>
                  <button onClick={handleRegenerate} className={iconButton} title="Regenerate code">
                    <Icon name="refresh" className="w-[18px] h-[18px]" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <CopyButton value={inviteLink} label="Copy invite link" />
                  <span className="text-xs font-semibold text-gray-500">Copy admin sign-up link</span>
                </div>
              </>
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
                {inviteError && <p className="text-xs font-semibold text-red-600">{inviteError}</p>}
                <div className="flex items-center space-x-2">
                  <button onClick={handleSaveInvite} className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm">
                    Save
                  </button>
                  <button
                    onClick={() => setEditingInvite(false)}
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
          {renderNavGroup('Activity', activityItems)}
          <div className="mb-6">
            <p className="px-4 mb-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-400">Apps</p>
            <ul className="space-y-1">
              <li>
                <a
                  href="/admin-app/login"
                  className="flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                >
                  <span className="text-gray-500"><Icon name="shield" className="w-6 h-6" /></span>
                  <span>Admin Console</span>
                </a>
              </li>
              <li>
                <a
                  href="/"
                  className="flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                >
                  <span className="text-gray-500"><Icon name="store" className="w-6 h-6" /></span>
                  <span>Storefront</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 w-full px-4 py-3.5 rounded-2xl text-[15px] font-bold text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <Icon name="logout" className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 lg:ml-[280px]">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-5 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600" onClick={() => setSidebarOpen(true)}>
                <Icon name="menu" className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-2">
                <Icon name={titleIcon} className="w-6 h-6 text-gray-500" />
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
              {initials}
            </div>
          </div>
        </div>

        <div className="p-5 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default SuperAdminLayout
