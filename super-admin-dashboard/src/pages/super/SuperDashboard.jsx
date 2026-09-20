import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSuperAuth } from '../../context/AuthContext'
import { Icon, avatarColorFor, initialsOf, money, timeAgo } from '../../components/ui'

const iconFor = (icon) =>
  ({ signin: 'login', signup: 'user-plus', key: 'key', trash: 'trash', shield: 'shield', users: 'users', crown: 'crown' })[icon] || 'activity'

const ArrowButton = ({ onClick }) => (
  <button onClick={onClick} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors">
    <Icon name="arrow-right" className="w-5 h-5" />
  </button>
)

const CardAction = ({ onClick, tone, children }) => (
  <button
    onClick={onClick}
    className={`w-full inline-flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r border transition-all group ${tone}`}
  >
    <span className="font-bold text-[14.5px]">{children}</span>
    <Icon name="arrow-right" className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
  </button>
)

const SuperDashboard = () => {
  const navigate = useNavigate()
  const { superAdmin, superAdmins, admins, superLogs, getAdminStats, loginAsAdmin } = useSuperAuth()
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [loginError, setLoginError] = useState('')

  const myAdmins = admins.filter((a) => a.superAdminId === superAdmin.id && !a.removed)
  const unassigned = admins.filter((a) => !a.removed && !superAdmins.some((s) => s.id === a.superAdminId))

  const perAdmin = myAdmins.map((admin) => ({ admin, stats: getAdminStats(admin.id) }))
  const sum = (key) => perAdmin.reduce((total, { stats }) => total + stats[key], 0)
  const totalSellers = sum('sellers')
  const pendingKYC = sum('pendingKYC')
  const totalBalance = sum('balance')
  const pendingOrders = sum('pendingOrders')
  const inDelivery = sum('inDelivery')
  const delivered = sum('delivered')
  const pendingWithdrawals = sum('pendingWithdrawals')

  const roster = [...perAdmin].sort((a, b) => b.stats.sellers - a.stats.sellers).slice(0, 5)
  const showAlert = !alertDismissed && unassigned.length > 0

  const handleLoginAs = async (admin) => {
    const result = await loginAsAdmin(admin.id)
    if (result.success) window.location.assign('/admin-app/dashboard')
    else setLoginError(result.error)
  }

  const miniStats = [
    ['Pending Orders', pendingOrders, 'bg-amber-50 border-amber-100 text-amber-600', 'clock'],
    ['In Delivery', inDelivery, 'bg-indigo-50 border-indigo-100 text-indigo-600', 'package'],
    ['Completed Orders', delivered, 'bg-sky-50 border-sky-100 text-sky-600', 'check'],
    ['Pending Withdrawals', pendingWithdrawals, 'bg-rose-50 border-rose-100 text-rose-600', 'wallet'],
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {showAlert && (
        <div className="relative bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-3xl p-5 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-300/20 blur-2xl pointer-events-none" />
          <div className="relative flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <Icon name="warn" className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-gray-900 font-bold text-lg leading-tight">
                System Alert: {unassigned.length} admin{unassigned.length === 1 ? ' has' : 's have'} no super admin.
              </p>
              <button
                onClick={() => navigate('/admins?scope=all')}
                className="mt-1.5 text-[15px] font-bold text-amber-900 underline underline-offset-4 decoration-amber-400 hover:decoration-amber-600 inline-flex items-center space-x-1 transition-colors"
              >
                <span>Review and assign</span>
                <Icon name="arrow-right" className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => setAlertDismissed(true)} className="p-2 rounded-xl hover:bg-amber-100/80 text-amber-700 transition-colors shrink-0">
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b2545] to-[#13315c] p-7 lg:p-8 shadow-2xl shadow-slate-900/30">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between mb-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/40">
            <Icon name="wallet" className="w-8 h-8 text-white" />
          </div>
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 backdrop-blur-sm">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
            </span>
            <span className="text-emerald-300 text-sm font-bold tracking-wide">LIVE</span>
          </div>
        </div>

        <p className="relative text-slate-300 font-bold uppercase tracking-[0.18em] text-[13px] mb-3">Network's Total Seller Balance</p>
        <p className="relative text-white font-black text-5xl lg:text-6xl tracking-tight mb-3">{money(totalBalance)}</p>
        <p className="relative text-slate-400 text-[15px] font-medium">
          Combined shop balance across {totalSellers} seller{totalSellers === 1 ? '' : 's'} managed by your {myAdmins.length} admin{myAdmins.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center border border-violet-100">
              <Icon name="users" className="w-6 h-6 text-violet-600" />
            </div>
            <ArrowButton onClick={() => navigate('/admins')} />
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.15em] text-[12.5px] mb-1.5">My Admins</p>
          <p className="text-5xl font-black text-gray-900 tracking-tight mb-4">{myAdmins.length}</p>
          <CardAction onClick={() => navigate('/admins')} tone="from-violet-50 to-indigo-50 hover:from-violet-100 hover:to-indigo-100 border-violet-100 text-violet-900">
            Manage admins
          </CardAction>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100">
              <Icon name="store" className="w-6 h-6 text-sky-600" />
            </div>
            <ArrowButton onClick={() => navigate('/admins')} />
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.15em] text-[12.5px] mb-1.5">Total Sellers</p>
          <p className="text-5xl font-black text-gray-900 tracking-tight mb-4">{totalSellers}</p>
          <CardAction onClick={() => navigate('/admins')} tone="from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border-amber-100 text-amber-900">
            {pendingKYC} pending KYC
          </CardAction>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
              <Icon name="crown" className="w-6 h-6 text-orange-600" />
            </div>
            <ArrowButton onClick={() => navigate('/super-admins')} />
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.15em] text-[12.5px] mb-1.5">Super Admins</p>
          <p className="text-5xl font-black text-gray-900 tracking-tight mb-4">{superAdmins.length}</p>
          <CardAction onClick={() => navigate('/super-admins')} tone="from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-100 text-orange-900">
            Add or remove super admins
          </CardAction>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {miniStats.map(([label, value, tone, icon]) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center space-x-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${tone}`}>
                <Icon name={icon} className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 leading-none">{value}</p>
                <p className="text-[14.5px] text-gray-600 font-semibold mt-1">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[22px] font-black text-gray-900 leading-tight">Your Admins</h2>
            <p className="text-gray-500 font-medium text-[14.5px] mt-0.5">Top admins by seller count · sign in as any of them</p>
          </div>
          <button onClick={() => navigate('/admins')} className="text-indigo-600 font-bold hover:underline">View all</button>
        </div>

        {loginError && <p className="mb-3 text-rose-600 font-semibold text-sm">{loginError}</p>}

        {roster.length ? (
          <div className="space-y-1.5">
            {roster.map(({ admin, stats }) => (
              <div key={admin.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${avatarColorFor(admin.fullName, admin.email)} flex items-center justify-center text-white font-black shrink-0`}>
                  {initialsOf(admin.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-[15px] leading-tight truncate">{admin.fullName}</p>
                  <p className="text-gray-500 font-medium text-[14px] truncate mt-0.5">
                    {stats.sellers} seller{stats.sellers === 1 ? '' : 's'} · {money(stats.balance)}
                  </p>
                </div>
                <button
                  onClick={() => handleLoginAs(admin)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-900 font-bold transition-all shrink-0"
                >
                  <Icon name="login" className="w-5 h-5" />
                  Login
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center font-bold text-gray-400">
            No admins yet. Add one, or share your invite code so they can register.
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="relative flex w-3.5 h-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full w-3.5 h-3.5 bg-emerald-500" />
            </span>
            <h2 className="text-[22px] font-black text-gray-900 leading-tight">Recent Super Admin Activity</h2>
          </div>
          <button onClick={() => navigate('/activity')} className="text-indigo-600 font-bold hover:underline">View all</button>
        </div>

        {superLogs.length ? (
          <div className="space-y-1.5">
            {superLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 text-gray-700">
                  <Icon name={iconFor(log.icon)} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-[15px] leading-tight truncate">{log.title}</p>
                  <p className="text-gray-500 font-medium text-[14px] truncate mt-0.5">
                    {log.entity}
                    {log.actorName ? ` · by ${log.actorName}` : ''}
                  </p>
                </div>
                <p className="text-gray-400 font-semibold text-sm shrink-0">{timeAgo(log.at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center font-bold text-gray-400">
            No activity yet. Actions you take will show up here.
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <h2 className="text-[22px] font-black text-gray-900 mb-2">Quick Action Utilities</h2>
        <p className="text-gray-500 font-medium text-[14.5px] mb-6">Shortcuts to common super admin tasks</p>

        <div className="space-y-3.5">
          {[
            ['/admins', 'Manage Admins', 'Add, remove, reset or sign in as any admin', 'from-indigo-500 to-violet-600 shadow-indigo-500/30', 'hover:border-indigo-200 hover:bg-indigo-50/40', 'users'],
            ['/super-admins', 'Super Admins', 'Make other super admins, each with their own invite code', 'from-amber-300 to-orange-500 shadow-orange-500/30', 'hover:border-amber-200 hover:bg-amber-50/40', 'crown'],
            ['/activity', 'Activity Logs', 'Review everything happening across the network', 'from-violet-500 to-purple-600 shadow-violet-500/30', 'hover:border-violet-200 hover:bg-violet-50/40', 'activity'],
          ].map(([to, title, desc, gradient, hover, icon]) => (
            <button key={to} onClick={() => navigate(to)} className={`w-full flex items-center space-x-4 p-5 rounded-2xl border-2 border-gray-100 transition-all group text-left ${hover}`}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0 ${gradient}`}>
                <Icon name={icon} className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 text-[17px] leading-tight">{title}</p>
                <p className="text-gray-500 font-medium text-[14px] mt-0.5">{desc}</p>
              </div>
              <Icon name="arrow-right" className="w-6 h-6 text-gray-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SuperDashboard
