import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const money = (value) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const statusStyle = (status) =>
  ({
    Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Pending Review', dot: 'bg-amber-500' },
    Completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Completed', dot: 'bg-emerald-500' },
    Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Rejected', dot: 'bg-rose-500' },
  })[status] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: status, dot: 'bg-gray-400' }

const AdminWithdrawals = () => {
  const { admin, getAllWithdrawalsForAdmin, processWithdrawal } = useAuth()
  const [tab, setTab] = useState('Pending')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const withdrawals = getAllWithdrawalsForAdmin(admin.id)

  const counts = useMemo(() => ({
    Pending: withdrawals.filter((w) => w.status === 'Pending').length,
    Completed: withdrawals.filter((w) => w.status === 'Completed').length,
    Rejected: withdrawals.filter((w) => w.status === 'Rejected').length,
  }), [withdrawals])

  const totals = useMemo(() => ({
    Pending: withdrawals.filter((w) => w.status === 'Pending').reduce((sum, w) => sum + w.amount, 0),
    Completed: withdrawals.filter((w) => w.status === 'Completed').reduce((sum, w) => sum + w.amount, 0),
    Rejected: withdrawals.filter((w) => w.status === 'Rejected').reduce((sum, w) => sum + w.amount, 0),
  }), [withdrawals])

  const tabs = [
    { id: 'Pending', label: 'Pending', count: counts.Pending, dot: 'bg-amber-500' },
    { id: 'Completed', label: 'Completed', count: counts.Completed, dot: 'bg-emerald-500' },
    { id: 'Rejected', label: 'Rejected', count: counts.Rejected, dot: 'bg-rose-500' },
  ]

  const visible = withdrawals
    .filter((w) => w.status === tab)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const handleDecision = async (withdrawal, approve) => {
    if (busyId) return
    setBusyId(withdrawal.id)
    setError('')
    const result = await processWithdrawal(withdrawal.sellerId, withdrawal.id, approve)
    setBusyId(null)
    if (!result.success) setError(result.error)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Withdrawals</h1>
          <p className="text-gray-500 font-medium mt-1">Review and process seller payout requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700 mb-2">Pending Review</p>
          <p className="text-5xl font-black text-gray-900 mb-1">{counts.Pending}</p>
          <p className="text-amber-900 font-bold">{money(totals.Pending)} pending</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl border border-emerald-100 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 mb-2">Total Paid</p>
          <p className="text-4xl font-black text-gray-900 mb-1">{money(totals.Completed)}</p>
          <p className="text-emerald-900 font-bold">{counts.Completed} payout{counts.Completed === 1 ? '' : 's'} · all time</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl border border-gray-200 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600 mb-2">Rejected</p>
          <p className="text-5xl font-black text-gray-900 mb-1">{counts.Rejected}</p>
          <p className="text-gray-700 font-bold">{money(totals.Rejected)} returned</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-2">
        <div className="flex p-2 space-x-1.5 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${t.dot}`} />
              <span>{t.label}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                tab === t.id ? 'bg-white text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-2xl bg-rose-50 p-3.5 text-center font-bold text-rose-700">{error}</p>}

      {visible.length > 0 && tab === 'Pending' && (
        <div className="p-5 rounded-3xl border-2 bg-amber-50 border-amber-200 flex items-center justify-between gap-4">
          <div>
            <p className="font-black text-lg text-amber-900">{visible.length} pending withdrawal{visible.length !== 1 ? 's' : ''}</p>
            <p className="text-sm font-semibold text-amber-800">Total: {money(totals.Pending)}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {visible.length ? visible.map((w) => {
          const st = statusStyle(w.status)
          return (
            <div key={w.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0a3d62] to-[#1a6fb0] flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-1">
                      <p className="font-black text-xl text-gray-900">{money(w.amount)}</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border ${st.bg} ${st.text} ${st.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot} mr-1.5`} />
                        {st.label}
                      </span>
                      <span className="font-mono text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg">{w.id}</span>
                    </div>
                    <p className="font-bold text-gray-900">{w.sellerName} · <span className="text-gray-600 font-semibold">{w.shopName}</span></p>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">{w.method || 'Payout method not set'}</p>
                    <p className="text-xs text-gray-400 font-semibold mt-1">{new Date(w.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {w.status === 'Pending' && (
                  <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center gap-3 shrink-0">
                    <button
                      disabled={busyId === w.id}
                      onClick={() => handleDecision(w, true)}
                      className="flex-1 sm:flex-none px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all inline-flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Approve</span>
                    </button>
                    <button
                      disabled={busyId === w.id}
                      onClick={() => handleDecision(w, false)}
                      className="flex-1 sm:flex-none px-5 py-3 bg-white text-rose-600 hover:bg-rose-50 font-bold rounded-2xl border-2 border-rose-100 transition-all inline-flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        }) : (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center font-bold text-gray-400">
            No {tab.toLowerCase()} withdrawal requests.
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminWithdrawals
