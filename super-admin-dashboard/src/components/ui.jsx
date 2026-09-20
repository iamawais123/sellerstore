import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const avatarColors = [
  'from-violet-500 to-purple-600',
  'from-indigo-500 to-blue-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
]

export const avatarColorFor = (name, email) => {
  const seed = `${name || ''}${email || ''}`.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return avatarColors[seed % avatarColors.length]
}

export const initialsOf = (name) =>
  (name || 'A')
    .split(' ')
    .map((part) => part && part[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)

export const money = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const timeAgo = (iso) => {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return 'Never'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString() : '—')

export const inputClass =
  'w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all'

export const labelClass = 'block text-xs font-bold uppercase tracking-[0.12em] text-gray-500 mb-2'

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-white bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

export const ghostButtonClass = 'px-5 py-3 rounded-2xl font-bold text-gray-700 hover:bg-gray-100 transition-colors'

export const dangerButtonClass =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-white bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

export const Icon = ({ name, className = 'w-5 h-5' }) => {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    viewBox: '0 0 24 24',
    className,
  }
  switch (name) {
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
    case 'login':
      return <svg {...common}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
    case 'logout':
      return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
    case 'dots':
      return <svg {...common}><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
    case 'key':
      return <svg {...common}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
    case 'copy':
      return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
    case 'edit':
      return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
    case 'refresh':
      return <svg {...common}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
    case 'plus':
      return <svg {...common}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    case 'user-plus':
      return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
    case 'trash':
      return <svg {...common}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
    case 'undo':
      return <svg {...common}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
    case 'users':
      return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    case 'shield':
      return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case 'crown':
      return <svg {...common}><path d="M2 20h20" /><path d="M4 20 2 7l5.5 5L12 4l4.5 8L22 7l-2 13" /></svg>
    case 'close':
      return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    case 'check':
      return <svg {...common}><polyline points="20 6 9 17 4 12" /></svg>
    case 'eye':
      return <svg {...common}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
    case 'eye-off':
      return <svg {...common}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    case 'sparkles':
      return <svg {...common}><path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2L12 3z" /><path d="M19 15l.9 2.6L22 18l-2.1.4L19 21l-.9-2.6L16 18l2.1-.4L19 15z" /></svg>
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    case 'warn':
      return <svg {...common}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    case 'info':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
    case 'menu':
      return <svg {...common}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
    case 'link':
      return <svg {...common}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
    case 'wallet':
      return <svg {...common}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
    case 'package':
      return <svg {...common}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
    case 'activity':
      return <svg {...common}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
    case 'grid':
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
    case 'arrow-right':
      return <svg {...common}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
    case 'history':
      return <svg {...common}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
    case 'store':
      return <svg {...common}><path d="M3 9l1-5h16l1 5" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 21V12m14 9V12M3 21h18" /></svg>
    default:
      return null
  }
}

export const Modal = ({ title, subtitle, icon = 'key', iconClass = 'bg-gray-100 text-gray-700', onClose, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Portalled to <body> so parent layout rules (e.g. space-y-* margins) can't offset the overlay.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full ${maxWidth} max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden`} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between p-6 shrink-0">
          <div className="flex items-start space-x-3 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconClass}`}>
              <Icon name={icon} className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-black text-gray-900 truncate">{title}</h3>
              {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors shrink-0">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export const CopyButton = ({ value, label = 'Copy', className = '' }) => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (_) {}
  }
  return (
    <button
      type="button"
      onClick={copy}
      title={label}
      className={`p-2 rounded-xl border transition-all duration-200 ${
        copied
          ? 'bg-green-100 text-green-600 border-green-200'
          : 'bg-white text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border-gray-200'
      } ${className}`}
    >
      <Icon name={copied ? 'check' : 'copy'} className="w-[18px] h-[18px]" />
    </button>
  )
}

export const EmptyState = ({ icon = 'users', title, message }) => (
  <div className="text-center py-20">
    <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
      <Icon name={icon} className="w-10 h-10 text-gray-400" />
    </div>
    <p className="text-xl font-bold text-gray-800">{title}</p>
    {message && <p className="text-gray-500 mt-2">{message}</p>}
  </div>
)

export const PasswordFields = ({ generate, onChange, value, confirm, onConfirmChange, show, onToggleShow }) => (
  <div className="space-y-3">
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Password (min. 6 characters)"
      className={inputClass}
    />
    <input
      type={show ? 'text' : 'password'}
      value={confirm}
      onChange={(event) => onConfirmChange(event.target.value)}
      placeholder="Confirm password"
      className={inputClass}
    />
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={generate}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold transition-colors"
      >
        <Icon name="sparkles" className="w-5 h-5" />
        Generate
      </button>
      <button type="button" onClick={onToggleShow} className="px-3 py-2.5 text-gray-600 hover:text-gray-900 font-semibold transition-colors">
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  </div>
)
