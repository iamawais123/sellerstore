import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import NewWithdrawalModal from '../../components/withdrawals/NewWithdrawalModal'
import ProcessWithdrawalModal from '../../components/withdrawals/ProcessWithdrawalModal'
import { Avatar, Icon, StatusPill, formatDate, money } from '../../components/withdrawals/shared'

const FILTERS = [
  { id: 'Pending', label: 'Pending', icon: 'clock', active: 'border-amber-300 bg-amber-50 text-amber-700' },
  { id: 'Completed', label: 'Approved', icon: 'check', active: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { id: 'Rejected', label: 'Rejected', icon: 'x', active: 'border-rose-300 bg-rose-50 text-rose-700' },
  { id: 'All', label: 'All', icon: 'inbox', active: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
]

const EMPTY_TEXT = {
  Pending: ['No pending withdrawal requests.', 'New requests appear here automatically.'],
  Completed: ['No approved withdrawals yet.', 'Payouts you confirm are listed here.'],
  Rejected: ['No rejected withdrawals.', 'Requests you reject are listed here.'],
  All: ['No withdrawal requests yet.', 'New requests appear here automatically.'],
}

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  const ok = toast.kind !== 'error'
  return (
    <div className="fixed right-4 top-4 z-[60] max-w-[calc(100vw-2rem)]" role="status">
      <div className={`relative flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          <Icon name={ok ? 'check' : 'x'} className="h-3 w-3" stroke={3} />
        </span>
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className={`absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border bg-white shadow-sm ${ok ? 'border-emerald-200 text-emerald-600' : 'border-rose-200 text-rose-600'}`}
        >
          <Icon name="x" className="h-3 w-3" stroke={2.5} />
        </button>
      </div>
    </div>
  )
}

const ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_110px_110px_120px_16px]'

const AdminWithdrawals = () => {
  const { admin, getSellersForAdmin, getAllWithdrawalsForAdmin, processWithdrawal } = useAuth()
  const [filter, setFilter] = useState('Pending')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [toast, setToast] = useState(null)

  const shops = getSellersForAdmin(admin.id)
  const shopById = new Map(shops.map((shop) => [shop.id, shop]))
  const all = getAllWithdrawalsForAdmin(admin.id)
    .map((withdrawal) => ({ ...withdrawal, seller: shopById.get(withdrawal.sellerId) }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))

  const counts = {
    Pending: all.filter((w) => w.status === 'Pending').length,
    Completed: all.filter((w) => w.status === 'Completed').length,
    Rejected: all.filter((w) => w.status === 'Rejected').length,
    All: all.length,
  }

  const needle = search.trim().toLowerCase()
  const visible = all.filter((w) => {
    if (filter !== 'All' && w.status !== filter) return false
    if (!needle) return true
    return [w.shopName, w.sellerName, w.seller?.email, w.id, w.reference, String(w.amount)].some((part) => String(part || '').toLowerCase().includes(needle))
  })

  // The modal follows the live record, so a decision made elsewhere shows up (or closes it) at once.
  const open = openId ? all.find((w) => w.id === openId) : null
  useEffect(() => {
    if (openId && !open) setOpenId(null)
  }, [openId, open])

  const notify = (message, kind = 'ok') => setToast({ message, kind, at: Date.now() })
  const clearToast = useMemo(() => () => setToast(null), [])

  const [emptyTitle, emptySub] = needle ? [`No withdrawals match “${search.trim()}”.`, 'Try a different shop, owner or email.'] : EMPTY_TEXT[filter]

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3 border-l-[3px] border-indigo-600 pl-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon name="cash" className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-lg font-bold leading-tight text-slate-900">Withdrawals</h1>
                <p className="max-w-[300px] text-xs leading-snug text-slate-500">Review and process seller withdrawal requests, manage withdrawal access.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {FILTERS.map((item) => {
                const on = filter === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? item.active : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Icon name={item.icon} className="h-3.5 w-3.5" stroke={2} />
                    <span>{item.label}</span>
                    <span className="ml-auto pl-1.5">{counts[item.id]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 xl:w-56 xl:flex-none">
              <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search shop, owner, email…"
                className="w-full min-w-0 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                aria-label="Search withdrawals"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <Icon name="plus" className="h-4 w-4" stroke={2.2} />
              New withdrawal
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <Icon name="inbox" className="h-5 w-5" />
              </span>
              <p className="text-sm font-bold text-slate-900">{emptyTitle}</p>
              <p className="mt-1 text-xs text-slate-500">{emptySub}</p>
            </div>
          ) : (
            <div>
              <div className={`hidden border-b border-slate-100 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid ${ROW_GRID}`}>
                <span>Shop / Owner</span>
                <span>Status</span>
                <span className="text-right">Amount</span>
                <span>Requested</span>
                <span />
              </div>
              <div className="p-1.5">
                {visible.map((w) => {
                  const name = w.seller?.shopName || w.shopName || w.sellerName
                  return (
                    <button
                      key={w.id}
                      type="button"

                      onClick={() => setOpenId(w.id)}
                      className={`${ROW_GRID} w-full rounded-xl px-3.5 py-3 text-left transition-colors hover:bg-indigo-50/60 focus:outline-none focus-visible:bg-indigo-50/60 focus-visible:ring-2 focus-visible:ring-indigo-500/30`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={name} className="h-9 w-9 text-sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-900">{name}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {w.sellerName}
                            {w.seller?.email ? ` • ${w.seller.email}` : ''}
                          </span>
                        </span>
                      </span>
                      <span className="hidden md:block">
                        <StatusPill status={w.status} />
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-bold text-slate-900">{money(w.amount)}</span>
                        <span className="mt-0.5 block md:hidden">
                          <StatusPill status={w.status} />
                        </span>
                      </span>
                      <span className="hidden text-xs text-slate-500 md:block">{formatDate(w.createdAt)}</span>
                      <span className="hidden text-slate-300 md:block">
                        <Icon name="chevron" className="h-4 w-4" />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Outside the spaced container: a fixed overlay must not pick up its sibling margins. */}
      {toast && <Toast key={toast.at} toast={toast} onClose={clearToast} />}
      {open && (
        <ProcessWithdrawalModal
          key={open.id}
          withdrawal={open}
          onClose={() => setOpenId(null)}
          onProcess={(approve, details) => processWithdrawal(open.sellerId, open.id, approve, details)}
          onDone={(message) => notify(message)}
        />
      )}
      {showNew && <NewWithdrawalModal onClose={() => setShowNew(false)} onCreated={(message) => notify(message)} />}
    </>
  )
}

export default AdminWithdrawals
