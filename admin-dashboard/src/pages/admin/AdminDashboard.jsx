import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const money = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const AdminDashboard = () => {
  const navigate = useNavigate()
  const {
    admin, adminLogs, getPendingKYCCount, getSellersForAdmin, getAllSellersCount,
    getAllSellerOrders, getAllWithdrawalsForAdmin, getSupportConversations,
  } = useAuth()
  const [alertDismissed, setAlertDismissed] = useState(false)

  const assignedSellers = getSellersForAdmin()
  const totalSellerBalance = assignedSellers.reduce((sum, s) => sum + (s.balance || 0), 0)
  const totalSellersCount = getAllSellersCount()
  const pendingKYC = getPendingKYCCount()

  const sellerIds = useMemo(() => new Set(assignedSellers.map((s) => s.id)), [assignedSellers])
  const orders = useMemo(() => getAllSellerOrders().filter((o) => sellerIds.has(o.sellerId)), [getAllSellerOrders, sellerIds])
  const pendingOrders = orders.filter((o) => ['Unpaid', 'Paid'].includes(o.status)).length
  const inDeliveryOrders = orders.filter((o) => ['Pickup', 'On the way', 'Out for delivery'].includes(o.status)).length
  const completedOrders = orders.filter((o) => o.status === 'Delivered').length
  const totalRevenue = orders.filter((o) => o.status === 'Delivered').reduce((sum, o) => sum + (o.total || 0), 0)

  const withdrawals = getAllWithdrawalsForAdmin(admin.id)
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'Pending').length

  const activeTickets = getSupportConversations('admin').filter((c) => c.status === 'active')
  const unreadTickets = activeTickets.reduce((sum, c) => sum + (c.unreadForAdmin || 0), 0)

  const revenueData = useMemo(() => {
    const days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today)
      day.setDate(today.getDate() - i)
      const dayKey = day.toDateString()
      const dayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === dayKey)
      const rev = dayOrders.filter((o) => o.status === 'Delivered').reduce((sum, o) => sum + (o.total || 0), 0)
      days.push({ d: day.toLocaleDateString('en-US', { weekday: 'narrow' }), rev, orders: dayOrders.length })
    }
    return days
  }, [orders])

  const weekRevenue = revenueData.reduce((sum, d) => sum + d.rev, 0)
  const weekOrders = revenueData.reduce((sum, d) => sum + d.orders, 0)
  const maxRev = Math.max(1, ...revenueData.map((d) => d.rev))
  const maxOrd = Math.max(1, ...revenueData.map((d) => d.orders))
  const chartH = 240
  const chartW = 660
  const padL = 54
  const padR = 46
  const padT = 20
  const padB = 44
  const plotW = chartW - padL - padR
  const plotH = chartH - padT - padB

  const xAt = (i) => padL + (i / (revenueData.length - 1)) * plotW
  const yAt = (v) => padT + plotH - (v / maxRev) * plotH
  const yAtOrd = (v) => padT + plotH - (v / maxOrd) * plotH

  const buildPath = (pts) => pts.reduce((d, p, i, a) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`
    const pr = a[i - 1], pp = i > 1 ? a[i - 2] : pr, nx = i < a.length - 1 ? a[i + 1] : p, t = 0.25
    return `${d} C ${(pr[0] + (p[0] - pp[0]) * t).toFixed(1)},${(pr[1] + (p[1] - pp[1]) * t).toFixed(1)} ${(p[0] - (nx[0] - pr[0]) * t).toFixed(1)},${(p[1] - (nx[1] - pr[1]) * t).toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`
  }, '')

  const revPts = revenueData.map((d, i) => [xAt(i), yAt(d.rev)])
  const ordPts = revenueData.map((d, i) => [xAt(i), yAtOrd(d.orders)])
  const linePath = buildPath(revPts)
  const ordPath = buildPath(ordPts)
  const baseline = padT + plotH
  const areaPath = `${linePath} L ${xAt(revenueData.length - 1).toFixed(1)} ${baseline} L ${xAt(0).toFixed(1)} ${baseline} Z`
  const ordAreaPath = `${ordPath} L ${xAt(revenueData.length - 1).toFixed(1)} ${baseline} L ${xAt(0).toFixed(1)} ${baseline} Z`
  const fmtRev = (v) => v >= 10000 ? `$${Math.round(v / 1000)}k` : v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`

  const getLogIcon = (icon) => {
    switch (icon) {
      case 'signin':
      case 'signup':
        return (
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        )
      case 'pay':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'key':
        return (
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
    }
  }

  const showAlert = !alertDismissed && pendingWithdrawals > 0

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {showAlert && (
        <div className="relative bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-3xl p-5 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-300/20 blur-2xl pointer-events-none" />
          <div className="relative flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-gray-900 font-bold text-lg leading-tight">
                System Alert: {pendingWithdrawals} Pending Withdrawal{pendingWithdrawals === 1 ? '' : 's'} need{pendingWithdrawals === 1 ? 's' : ''} review.
              </p>
              <button onClick={() => navigate('/withdrawals')} className="mt-1.5 text-[15px] font-bold text-amber-900 underline underline-offset-4 decoration-amber-400 hover:decoration-amber-600 inline-flex items-center space-x-1 transition-colors">
                <span>Review now</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setAlertDismissed(true)}
              className="p-2 rounded-xl hover:bg-amber-100/80 text-amber-700 transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b2545] to-[#13315c] p-7 lg:p-8 shadow-2xl shadow-slate-900/30">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between mb-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/40">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 backdrop-blur-sm">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
            </span>
            <span className="text-emerald-300 text-sm font-bold tracking-wide">LIVE</span>
          </div>
        </div>

        <p className="relative text-slate-300 font-bold uppercase tracking-[0.18em] text-[13px] mb-3">
          Sellers' Total Balance
        </p>
        <p className="relative text-white font-black text-5xl lg:text-6xl tracking-tight mb-3">
          {money(totalSellerBalance)}
        </p>
        <p className="relative text-slate-400 text-[15px] font-medium">
          Combined shop balance across your {totalSellersCount} store{totalSellersCount === 1 ? '' : 's'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100">
              <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <button onClick={() => navigate('/sellers')} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.15em] text-[12.5px] mb-1.5">
            Total Sellers
          </p>
          <p className="text-5xl font-black text-gray-900 tracking-tight mb-4">{totalSellersCount}</p>
          <button onClick={() => navigate('/kyc')} className="w-full inline-flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-100 transition-all group">
            <span className="text-amber-900 font-bold text-[14.5px]">
              {pendingKYC} pending KYC
            </span>
            <svg className="w-5 h-5 text-amber-700 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <button onClick={() => navigate('/orders')} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.15em] text-[12.5px] mb-1.5">
            Active Deliveries
          </p>
          <p className="text-5xl font-black text-gray-900 tracking-tight mb-4">{pendingOrders + inDeliveryOrders}</p>
          <button onClick={() => navigate('/orders')} className="w-full inline-flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-100 transition-all group">
            <span className="text-orange-900 font-bold text-[14.5px]">
              {pendingOrders} pending · {inDeliveryOrders} in transit
            </span>
            <svg className="w-5 h-5 text-orange-700 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center border border-violet-100">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <button onClick={() => navigate('/support')} className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.15em] text-[12.5px] mb-1.5">
            Active Tickets
          </p>
          <p className="text-5xl font-black text-gray-900 tracking-tight mb-4">{activeTickets.length}</p>
          <button onClick={() => navigate('/support')} className="w-full inline-flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-100 transition-all group">
            <span className="text-amber-900 font-bold text-[14.5px]">
              {unreadTickets} unread message{unreadTickets === 1 ? '' : 's'}
            </span>
            <svg className="w-5 h-5 text-amber-700 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div onClick={() => navigate('/orders')} role="button" tabIndex={0} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
              <svg className="w-5.5 h-5.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 leading-none">{pendingOrders}</p>
              <p className="text-[14.5px] text-gray-600 font-semibold mt-1">Pending Orders</p>
            </div>
          </div>
        </div>

        <div onClick={() => navigate('/orders')} role="button" tabIndex={0} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
              <svg className="w-5.5 h-5.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 leading-none">{inDeliveryOrders}</p>
              <p className="text-[14.5px] text-gray-600 font-semibold mt-1">In Delivery</p>
            </div>
          </div>
        </div>

        <div onClick={() => navigate('/orders')} role="button" tabIndex={0} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100 shrink-0">
              <svg className="w-5.5 h-5.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 leading-none">{completedOrders}</p>
              <p className="text-[14.5px] text-gray-600 font-semibold mt-1">Completed Orders</p>
            </div>
          </div>
        </div>

        <div onClick={() => navigate('/withdrawals')} role="button" tabIndex={0} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100 shrink-0">
              <svg className="w-5.5 h-5.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 leading-none">{pendingWithdrawals}</p>
              <p className="text-[14.5px] text-gray-600 font-semibold mt-1">Pending Withdrawals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 className="text-[22px] font-black text-gray-900 leading-tight">
                Daily Revenue & Order Volume
              </h2>
              <p className="text-gray-500 font-medium text-[14.5px] mt-0.5">
                Past 7 days · revenue from delivered orders
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 lg:gap-10 mb-6">
          <div>
            <p className="text-gray-500 font-bold uppercase tracking-[0.18em] text-[12.5px] mb-1.5">
              Revenue
            </p>
            <p className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
              {money(weekRevenue)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 font-bold uppercase tracking-[0.18em] text-[12.5px] mb-1.5">
              Orders
            </p>
            <p className="text-4xl lg:text-5xl font-black text-indigo-600 tracking-tight">
              {weekOrders}
            </p>
          </div>
        </div>

        {/* HTML legend */}
        <div className="flex items-center gap-5 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="20" height="12" className="shrink-0">
              <line x1="0" y1="6" x2="20" y2="6" stroke="#f97316" strokeWidth="2" strokeDasharray="5 3" />
              <circle cx="10" cy="6" r="3" fill="white" stroke="#f97316" strokeWidth="1.5" />
            </svg>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Orders</span>
          </div>
        </div>

        {weekOrders === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center font-bold text-gray-400">
            No orders in the past 7 days yet.
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.chart-scroll::-webkit-scrollbar{display:none}`}</style>
            <div className="chart-scroll" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-auto" style={{ width: '100%', minWidth: '520px', display: 'block' }}>
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="ordArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow-indigo">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="glow-orange">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <line
                    key={t}
                    x1={padL} x2={chartW - padR}
                    y1={padT + plotH * t} y2={padT + plotH * t}
                    stroke={t === 1 ? '#d1d5db' : '#f3f4f6'}
                    strokeWidth={t === 1 ? 1 : 1}
                  />
                ))}

                {/* Left Y-axis (revenue) */}
                {[maxRev, maxRev * 0.75, maxRev * 0.5, maxRev * 0.25, 0].map((v, i) => (
                  <text key={i} x={padL - 8} y={yAt(v) + 4} textAnchor="end" fill="#9ca3af" style={{ fontSize: '10px', fontWeight: 700 }}>
                    {fmtRev(v)}
                  </text>
                ))}

                {/* Right Y-axis (orders) */}
                {[maxOrd, maxOrd * 0.75, maxOrd * 0.5, maxOrd * 0.25, 0].map((v, i) => (
                  <text key={i} x={chartW - padR + 8} y={yAtOrd(v) + 4} textAnchor="start" fill="#fb923c" style={{ fontSize: '10px', fontWeight: 700 }}>
                    {Math.round(v)}
                  </text>
                ))}

                {/* Order area + line */}
                <path d={ordAreaPath} fill="url(#ordArea)" />
                <path d={ordPath} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" opacity="0.85" />

                {/* Revenue area + line */}
                <path d={areaPath} fill="url(#revArea)" />
                <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-indigo)" />

                {/* Data points & labels */}
                {revenueData.map((d, i) => {
                  const ox = xAt(i), oy = yAtOrd(d.orders)
                  const rx = xAt(i), ry = yAt(d.rev)
                  const ordLabelY = Math.max(padT + 11, oy - 9)
                  const revLabelY = Math.max(padT + 11, ry - 9)
                  return (
                    <g key={i}>
                      {/* Order dot */}
                      <circle cx={ox} cy={oy} r="6" fill="#f97316" opacity="0.12" />
                      <circle cx={ox} cy={oy} r="3.5" fill="#fff" stroke="#f97316" strokeWidth="2" />
                      {d.orders > 0 && (
                        <text x={ox} y={ordLabelY} textAnchor="middle" fill="#ea6f0a" style={{ fontSize: '9.5px', fontWeight: 800 }}>
                          {d.orders}
                        </text>
                      )}
                      {/* Revenue dot */}
                      <circle cx={rx} cy={ry} r="7" fill="#6366f1" opacity="0.1" />
                      <circle cx={rx} cy={ry} r="4" fill="#fff" stroke="#4f46e5" strokeWidth="2.5" />
                      {d.rev > 0 && (
                        <text x={rx} y={revLabelY} textAnchor="middle" fill="#4338ca" style={{ fontSize: '9.5px', fontWeight: 800 }}>
                          {fmtRev(d.rev)}
                        </text>
                      )}
                      {/* Day label at bottom */}
                      <text x={xAt(i)} y={chartH - 16} textAnchor="middle" fill="#9ca3af" style={{ fontSize: '11px', fontWeight: 700 }}>
                        {d.d}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
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
            <h2 className="text-[22px] font-black text-gray-900 leading-tight">
              Real-time Logs
            </h2>
          </div>
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-700 text-sm font-bold tracking-wide">LIVE</span>
          </div>
        </div>

        {adminLogs.length ? (
          <div className="space-y-1.5">
            {adminLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                  {getLogIcon(log.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-[15px] leading-tight truncate">
                    {log.title}
                  </p>
                  <p className="text-gray-500 font-medium text-[14px] truncate mt-0.5">
                    {log.entity}
                  </p>
                </div>
                <p className="text-gray-400 font-semibold text-sm shrink-0">{log.time}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center font-bold text-gray-400">
            No activity yet. Actions you take will show up here in real time.
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
        <h2 className="text-[22px] font-black text-gray-900 mb-2">Quick Action Utilities</h2>
        <p className="text-gray-500 font-medium text-[14.5px] mb-6">
          Shortcuts to common admin tasks
        </p>

        <div className="space-y-3.5">
          <button onClick={() => navigate('/orders')} className="w-full flex items-center space-x-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-[17px] leading-tight">Give Order</p>
              <p className="text-gray-500 font-medium text-[14px] mt-0.5">
                Assign a new order to one of your verified sellers
              </p>
            </div>
            <svg className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <button onClick={() => navigate('/support')} className="w-full flex items-center space-x-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-amber-200 hover:bg-amber-50/40 transition-all group text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-[17px] leading-tight">Support Inbox</p>
              <p className="text-gray-500 font-medium text-[14px] mt-0.5">
                Reply to seller conversations
              </p>
            </div>
            <svg className="w-6 h-6 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <button onClick={() => navigate('/sellers')} className="w-full flex items-center space-x-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-violet-200 hover:bg-violet-50/40 transition-all group text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-[17px] leading-tight">System Configurations</p>
              <p className="text-gray-500 font-medium text-[14px] mt-0.5">
                Manage sellers, KYC, balances and access
              </p>
            </div>
            <svg className="w-6 h-6 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
