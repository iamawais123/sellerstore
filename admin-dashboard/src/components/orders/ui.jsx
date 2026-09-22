import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './icons'

export { money } from '../withdrawals/shared'

// One colour per order status, used by the pill, the timeline and the filter dots.
export const STATUS_STYLE = {
  Unpaid: { pill: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  Paid: { pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  Pickup: { pill: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  'On the way': { pill: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  'Out for delivery': { pill: 'bg-indigo-50 text-indigo-700 ring-indigo-200', dot: 'bg-indigo-500' },
  Delivered: { pill: 'bg-green-50 text-green-700 ring-green-200', dot: 'bg-green-600' },
  Cancelled: { pill: 'bg-slate-100 text-slate-500 ring-slate-200', dot: 'bg-slate-400' },
}

export const StatusPill = ({ status, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${STATUS_STYLE[status]?.pill || STATUS_STYLE.Cancelled.pill} ${className}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLE[status]?.dot || 'bg-slate-400'}`} />
    {status}
  </span>
)

// The seller's shop initial in green, with a presence dot when it is known.
export const ShopAvatar = ({ name, online, className = 'h-11 w-11 text-base' }) => (
  <span className="relative inline-block shrink-0">
    <span className={`flex items-center justify-center rounded-full bg-emerald-600 font-bold text-white ${className}`}>{(name || '?').trim().charAt(0).toUpperCase()}</span>
    {online != null && <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${online ? 'bg-emerald-400' : 'bg-slate-300'}`} />}
  </span>
)

// A floating message (top right) that goes away by itself; `tone` is 'success' or 'error'.
export const Toast = ({ message, tone = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, tone === 'error' ? 7000 : 4500)
    return () => clearTimeout(timer)
  }, [message, tone, onClose])
  const ok = tone === 'success'
  return (
    <div role={ok ? 'status' : 'alert'} className={`fixed right-4 top-4 z-[60] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl sm:right-6 sm:top-6 ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
      <Icon name={ok ? 'checkCircle' : 'alert'} className={`mt-0.5 h-5 w-5 shrink-0 ${ok ? 'text-emerald-600' : 'text-rose-600'}`} />
      <p className="text-sm font-semibold">{message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="-mr-1 shrink-0 rounded-full p-0.5 opacity-60 hover:opacity-100">
        <Icon name="x" className="h-4 w-4" />
      </button>
    </div>
  )
}

// A window over the page: dimmed backdrop, header, scrolling body and an optional pinned footer.
export const Modal = ({ title, subtitle, icon, onClose, wide, footer, children }) => {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Portalled to <body> so parent layout rules (e.g. space-y-* margins) can't offset the overlay.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}>
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          {icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Icon name={icon} className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black leading-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

// "Are you sure?" for the actions that cannot be taken back.
export const ConfirmDialog = ({ title, message, confirmLabel, busy, tone = 'danger', onConfirm, onCancel }) => (
  <Modal
    title={title}
    icon="alert"
    onClose={busy ? () => {} : onCancel}
    footer={
      <>
        <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50">
          Keep it
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 ${tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </>
    }
  >
    <p className="px-5 py-5 text-sm text-slate-600">{message}</p>
  </Modal>
)

// Closes on a click anywhere outside `ref`'s element while `open`.
export const useOutside = (open, onClose) => {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const close = (event) => ref.current && !ref.current.contains(event.target) && onClose()
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open, onClose])
  return ref
}

// A small "copied" flash for copy buttons.
export const useCopy = () => {
  const [copied, setCopied] = useState('')
  const copy = async (value, key = value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(''), 1400)
    } catch (_) {}
  }
  return [copied, copy]
}
