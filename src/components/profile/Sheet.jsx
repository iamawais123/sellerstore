import { useEffect, useState } from 'react'

const PATHS = {
  shop: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  key: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  shieldAlert: 'M12 9v2m0 4h.01M12 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016A11.955 11.955 0 0112 2.944z',
  check: 'M5 13l4 4L19 7',
  checkCircle: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  eyeOff: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21',
  save: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
  upload: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  x: 'M6 18L18 6M6 6l12 12',
  chevronDown: 'M19 9l-7 7-7-7',
  alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  wallet: 'M3 7a2 2 0 012-2h12a2 2 0 012 2v1h1a1 1 0 011 1v6a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm14 5h.01',
  card: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
}

export const Icon = ({ name, className = 'w-4 h-4', strokeWidth = 2 }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={PATHS[name]} />
  </svg>
)

export const Spinner = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
)

export const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#0a3d62] focus:outline-none focus:ring-4 focus:ring-[#0a3d62]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500'

const TONES = {
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-100 text-blue-600',
  orange: 'bg-orange-100 text-orange-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  purple: 'bg-purple-100 text-purple-600',
}

// "SHOP IDENTITY" — the small uppercase heading that starts each group of fields.
export const SectionLabel = ({ icon, tone = 'slate', children }) => (
  <div className="mb-2 flex items-center gap-2">
    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${TONES[tone]}`}>
      <Icon name={icon} className="h-3 w-3" />
    </span>
    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{children}</span>
  </div>
)

export const CharCount = ({ value, max }) => <p className="mt-1 text-right text-[11px] text-gray-400">{value.length}/{max}</p>

export const PasswordField = ({ label, hint, value, onChange, autoComplete = 'off', inputMode, disabled }) => {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} className="h-4 w-4" />
        </button>
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-gray-500">{hint}</p>}
    </div>
  )
}

// An inline result line under a form ("Password updated" / the reason it failed).
export const Notice = ({ tone = 'error', children }) =>
  children ? (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${tone === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}
    >
      <Icon name={tone === 'error' ? 'alert' : 'checkCircle'} className="mt-px h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  ) : null

export const PrimaryButton = ({ icon, busy, children, className = '', disabled, ...props }) => (
  <button
    type="button"
    {...props}
    disabled={busy || disabled}
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0a3d62] to-[#1a6fb0] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-[#0f4c81] hover:to-[#2b7fc0] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
  >
    {busy ? <Spinner /> : icon ? <Icon name={icon} /> : null}
    <span>{children}</span>
  </button>
)

export const GhostButton = ({ children, className = '', ...props }) => (
  <button
    type="button"
    {...props}
    className={`rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60 ${className}`}
  >
    {children}
  </button>
)

export const OutlineButton = ({ children, className = '', ...props }) => (
  <button
    type="button"
    {...props}
    className={`rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60 ${className}`}
  >
    {children}
  </button>
)

// A bottom sheet over the whole page: Escape or a tap on the dimmed area closes it.
export const Sheet = ({ title, subtitle, onClose, children, footer }) => {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="animate-sheet-up flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl">
        <div className="flex justify-center pb-1 pt-3">
          <span className="h-2 w-24 rounded-full bg-gray-100" />
        </div>
        <div className="border-b border-gray-100 px-4 pb-3 pt-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="border-t border-gray-100 px-4 py-3">{footer}</div>}
      </div>
    </div>
  )
}
