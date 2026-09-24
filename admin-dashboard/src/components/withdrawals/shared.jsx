import { useEffect } from 'react'

export const money = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// 17 Sept 2026
export const formatDate = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// 17/09/2026, 15:15:50
export const formatDateTime = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-GB', { hour12: false })
}

const ICONS = {
  cash: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  card: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M5 13l4 4L19 7',
  x: 'M6 18L18 6M6 6l12 12',
  inbox: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  plus: 'M12 4v16m8-8H4',
  bank: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  select: 'M8 9l4-4 4 4m0 6l-4 4-4-4',
  chevron: 'M9 5l7 7-7 7',
  hash: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  note: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
  wallet: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
}

export const Icon = ({ name, className = 'h-4 w-4', stroke = 1.8 }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d={ICONS[name]} />
  </svg>
)

// The database keeps `Completed` for a paid-out withdrawal; the console calls it "Approved".
export const STATUS = {
  Pending: { label: 'Pending', pill: 'bg-amber-100 text-amber-700' },
  Completed: { label: 'Approved', pill: 'bg-emerald-100 text-emerald-700' },
  Rejected: { label: 'Rejected', pill: 'bg-rose-100 text-rose-700' },
}

export const StatusPill = ({ status }) => {
  const style = STATUS[status] || { label: status, pill: 'bg-slate-100 text-slate-600' }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.pill}`}>{style.label}</span>
}

export const Avatar = ({ name, className = 'h-9 w-9 text-sm', online }) => (
  <span className="relative inline-block shrink-0">
    <span className={`flex items-center justify-center rounded-full bg-indigo-600 font-bold text-white ${className}`}>
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
    {online != null && (
      <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
    )}
  </span>
)

export const isOnline = (shop) => {
  const at = Date.parse(shop?.lastActiveAt || '')
  return !Number.isNaN(at) && Date.now() - at < 5 * 60 * 1000
}

export const NETWORKS = [
  ['USDT_TRC20', 'USDT (TRC20)'],
  ['USDT_ERC20', 'USDT (ERC20)'],
]

const networkLabel = (network) => NETWORKS.find(([value]) => value === network)?.[1] || network || ''

// "•••• 3456" — enough to recognise a saved account without spelling it out.
export const maskAccount = (value) => {
  const text = String(value || '')
  return text.length > 4 ? `•••• ${text.slice(-4)}` : text
}

// What the payout card shows for a withdrawal's payout method: a heading, a tag and label/value rows.
// Older requests only carry a text label, so that is the fallback.
export const describePayout = (withdrawal) => {
  const method = withdrawal.payoutMethod
  if (method && method.type === 'crypto') {
    return {
      icon: 'wallet',
      title: 'Crypto wallet',
      tag: method.label,
      rows: [['Network', networkLabel(method.network)], ['Wallet address', method.walletAddress, 'break']],
    }
  }
  if (method && (method.type === 'bank' || method.accountNumber || method.bankName)) {
    return {
      icon: 'bank',
      title: 'Bank account',
      tag: method.label,
      rows: [
        ['Bank', method.bankName || method.label],
        ['Account holder', method.holderName],
        ['Account #', method.accountNumber, 'mono'],
        ['Routing / IFSC', method.routingNumber, 'mono'],
      ],
    }
  }
  return { icon: 'card', title: 'Payout method', tag: '', rows: [['Method', withdrawal.method || 'Not set']] }
}

// Modal frame: dimmed, blurred backdrop, a header, a scrolling body and a pinned footer.
export const ModalShell = ({ title, subtitle, icon, onClose, busy, footer, children }) => {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [busy, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[calc(100vh-2rem)] w-full max-w-[430px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          {icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Icon name={icon} className="h-[18px] w-[18px]" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold leading-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="-mr-1 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <Icon name="x" className="h-4 w-4" stroke={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-3.5">{footer}</div>
      </div>
    </div>
  )
}

export const FieldLabel = ({ children, tiny }) => (
  <label className={tiny ? 'mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500' : 'mb-1.5 block text-xs font-semibold text-slate-700'}>{children}</label>
)

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10'
