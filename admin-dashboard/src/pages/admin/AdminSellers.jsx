import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isOnline } from '../../lib/supportChat'

const avatarColors = [
  'from-violet-500 to-purple-600',
  'from-indigo-500 to-blue-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
]

const avatarColorFor = (name, email) => {
  const seed = `${name || ''}${email || ''}`.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return avatarColors[seed % avatarColors.length]
}

const initialsOf = (n) =>
  (n || 'S')
    .split(' ')
    .map((x) => x && x[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)

const Icon = ({ name, className = 'w-5 h-5' }) => {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', className }
  switch (name) {
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
    case 'login':
      return <svg {...common}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
    case 'dots':
      return <svg {...common}><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
    case 'key':
      return <svg {...common}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
    case 'bell':
      return <svg {...common}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
    case 'activity':
      return <svg {...common}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
    case 'history':
      return <svg {...common}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
    case 'wallet':
      return <svg {...common}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
    case 'shield':
      return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case 'star':
      return <svg {...common}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
    case 'package':
      return <svg {...common}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
    case 'trending':
      return <svg {...common}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
    case 'ban':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
    case 'credit':
      return <svg {...common}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
    case 'trash':
      return <svg {...common}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
    case 'box':
      return <svg {...common}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
    case 'eye':
      return <svg {...common}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
    case 'eye-off':
      return <svg {...common}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    case 'sparkles':
      return <svg {...common}><path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2L12 3z" /><path d="M19 15l.9 2.6L22 18l-2.1.4L19 21l-.9-2.6L16 18l2.1-.4L19 15z" /></svg>
    case 'close':
      return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    case 'send':
      return <svg {...common}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
    case 'calendar':
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    case 'check':
      return <svg {...common}><polyline points="20 6 9 17 4 12" /></svg>
    case 'warn':
      return <svg {...common}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    case 'info':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
    case 'users':
      return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    case 'menu':
      return <svg {...common}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
    case 'globe':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
    case 'copy':
      return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
    case 'plus':
      return <svg {...common}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    case 'minus':
      return <svg {...common}><line x1="5" y1="12" x2="19" y2="12" /></svg>
    case 'laptop':
      return <svg {...common}><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" /></svg>
    case 'pause':
      return <svg {...common}><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
    case 'stop':
      return <svg {...common}><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
    case 'zap':
      return <svg {...common}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    default:
      return null
  }
}

const groupSeparator = (label) => ({ separator: true, label })

const buildMenu = (seller) => [
  groupSeparator('Account Actions'),
  { id: 'password', label: 'Reset Password', icon: 'key', color: 'text-gray-700', seller },
  { id: 'notification', label: 'Send Notification', icon: 'bell', color: 'text-gray-700', seller },
  { id: 'activity', label: 'Activity Overview', icon: 'activity', color: 'text-gray-700', seller },
  { id: 'loginHistory', label: 'Login History', icon: 'history', color: 'text-gray-700', seller },
  groupSeparator('Financials'),
  { id: 'balance', label: 'Adjust Balance', icon: 'wallet', color: 'text-gray-700', seller },
  { id: 'guarantee', label: 'Guarantee Money', icon: 'shield', color: 'text-gray-700', seller },
  groupSeparator('Shop Settings'),
  { id: 'rating', label: 'Shop Rating', icon: 'star', color: 'text-gray-700', seller },
  { id: 'productLimit', label: 'Product Limit', icon: 'package', color: 'text-gray-700', seller },
  { id: 'views', label: 'Views Booster', icon: 'trending', color: 'text-gray-700', seller },
  groupSeparator('Risk Controls'),
  { id: 'suspend', label: 'Suspend Account', icon: 'ban', color: 'text-amber-600', seller },
  { id: 'blockWd', label: 'Block Withdrawals', icon: 'credit', color: 'text-rose-600', seller },
  { id: 'allowRemove', label: 'Allow Product Removal', icon: 'box', color: 'text-indigo-600', seller },
  { id: 'delete', label: 'Delete Store', icon: 'trash', color: 'text-rose-600', seller },
]

const PasswordModal = ({ seller, onClose }) => {
  const { sendSellerPasswordReset } = useAuth()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const doSend = async () => {
    setError('')
    setSuccess('')
    setSending(true)
    const res = await sendSellerPasswordReset(seller.id)
    setSending(false)
    if (res.success) setSuccess(`Reset link sent to ${seller.email}.`)
    else setError(res.error || 'Could not send the reset email.')
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
              <Icon name="key" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">Password — {seller.fullName}</h3>
              <p className="text-gray-500 mt-1">Passwords are private to each seller. Send them a reset link so they can choose a new one.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-gray-500 mb-2">Reset link will be sent to</label>
            <input
              type="text"
              readOnly
              value={seller.email || 'No email on file'}
              className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-700 font-mono focus:outline-none"
            />
          </div>

          {error && <p role="alert" className="text-rose-600 font-semibold text-sm">{error}</p>}
          {success && <p role="status" className="text-emerald-600 font-semibold text-sm">{success}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-3 rounded-2xl font-bold text-gray-700 hover:bg-gray-100 transition-colors">
              Close
            </button>
            <button
              onClick={doSend}
              disabled={sending || !seller.email}
              className="px-5 py-3 rounded-2xl font-bold text-white bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending…' : 'Send reset email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const NotificationModal = ({ seller, onClose }) => {
  const { sendSellerNotification, getSellerNotifications } = useAuth()
  const [tab, setTab] = useState('send')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [sent, setSent] = useState(false)
  const history = getSellerNotifications(seller.id)

  const typeMeta = {
    info: { label: 'Info', icon: 'info', color: 'bg-blue-50 text-blue-700 border-blue-200', chipActive: 'bg-blue-50 border-blue-200 text-blue-700', previewBg: 'bg-blue-50', previewTitle: 'text-blue-700', previewBody: 'text-blue-600' },
    success: { label: 'Success', icon: 'check', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', chipActive: 'bg-emerald-50 border-emerald-200 text-emerald-700', previewBg: 'bg-emerald-50', previewTitle: 'text-emerald-700', previewBody: 'text-emerald-600' },
    warning: { label: 'Warning', icon: 'warn', color: 'bg-amber-50 text-amber-700 border-amber-200', chipActive: 'bg-amber-50 border-amber-200 text-amber-700', previewBg: 'bg-amber-50', previewTitle: 'text-amber-700', previewBody: 'text-amber-600' },
    alert: { label: 'Alert', icon: 'warn', color: 'bg-rose-50 text-rose-700 border-rose-200', chipActive: 'bg-rose-50 border-rose-200 text-rose-700', previewBg: 'bg-rose-50', previewTitle: 'text-rose-700', previewBody: 'text-rose-600' },
  }
  const tm = typeMeta[type]

  const [sendError, setSendError] = useState('')
  const [sending, setSending] = useState(false)

  const doSend = async () => {
    if (!title.trim() || sending) return
    setSending(true)
    setSendError('')
    const res = await sendSellerNotification(seller.id, { title: title.trim(), message: message.trim(), type })
    setSending(false)
    if (!res.success) { setSendError(res.error || 'Could not send the notification'); return }
    setTitle('')
    setMessage('')
    setSent(true)
    setTimeout(() => { setSent(false); setTab('history') }, 800)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                <Icon name="bell" className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">Notifications</h3>
                <p className="text-gray-500 mt-1 font-medium">{seller.fullName} · {seller.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/70 text-gray-500 hover:text-gray-900 transition-colors">
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 p-1 bg-gray-100/70 rounded-2xl">
            <button
              onClick={() => setTab('send')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${tab === 'send' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Icon name="send" className="w-5 h-5" />
              Send
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${tab === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <Icon name="clock" className="w-5 h-5" />
              History
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {tab === 'send' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-gray-500 mb-2">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                  maxLength={120}
                  placeholder="e.g. KYC documents required"
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                <div className="flex justify-end mt-1.5">
                  <span className="text-xs text-gray-400 font-medium">{title.length}/120</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-gray-500 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  maxLength={1000}
                  rows={4}
                  placeholder="Write the message the seller should read..."
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                />
                <div className="flex justify-end mt-1.5">
                  <span className="text-xs text-gray-400 font-medium">{message.length}/1000</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-gray-500 mb-2">Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(typeMeta).map(([k, m]) => (
                    <button
                      key={k}
                      onClick={() => setType(k)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${type === k ? m.chipActive + ' border-2' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      <Icon name={m.icon} className="w-4 h-4" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.12em] text-gray-500 mb-2">Preview</label>
                <div className={`${tm.previewBg} rounded-2xl border-2 border-white/50 p-4 shadow-inner`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${tm.color} border flex items-center justify-center shrink-0`}>
                      <Icon name={tm.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-black ${tm.previewTitle}`}>{title || 'Notification title'}</p>
                      <p className={`mt-1 font-medium text-sm ${tm.previewBody}`}>{message || 'Message body will appear here.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {sent && <p className="text-emerald-600 font-bold">Notification sent!</p>}
              {sendError && <p className="text-rose-600 font-bold">{sendError}</p>}

              <div className="flex justify-end pt-2">
                <button
                  onClick={doSend}
                  disabled={!title.trim() || sending}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-white bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="send" className="w-5 h-5" />
                  Send notification
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <Icon name="clock" className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="font-bold text-gray-700">No notifications yet</p>
                  <p className="text-sm text-gray-500 mt-1">Sent notifications will appear here</p>
                </div>
              ) : (
                history.map((n) => {
                  const m = typeMeta[n.type] || typeMeta.info
                  return (
                    <div key={n.id} className={`rounded-2xl border-2 border-gray-100 p-4 ${m.previewBg}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl ${m.color} border flex items-center justify-center shrink-0`}>
                          <Icon name={m.icon} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-black ${m.previewTitle}`}>{n.title}</p>
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{n.time}</span>
                          </div>
                          <p className={`mt-1 font-medium text-sm ${m.previewBody}`}>{n.message || <span className="italic opacity-70">No message</span>}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ActivityModal = ({ seller, onClose }) => {
  const { getSellerActivityStats, getSellerLedger, getSellerOrders, getSellerWithdrawals, getSellerCampaigns } = useAuth()
  const [tab, setTab] = useState('ledger')
  const stats = getSellerActivityStats(seller.id)
  const ledger = getSellerLedger(seller.id)
  const orders = getSellerOrders(seller.id)
  const withdrawals = getSellerWithdrawals(seller.id)
  const campaigns = getSellerCampaigns(seller.id)

  const statCards = [
    { key: 'balance', label: 'Shop Balance', value: `$${stats.shopBalance.toFixed(2)}`, icon: 'wallet', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100 text-emerald-600' },
    { key: 'guarantee', label: 'Guarantee', value: `$${stats.guarantee.toFixed(2)}`, icon: 'shield', bg: 'bg-blue-50', iconBg: 'bg-blue-100 text-blue-600' },
    { key: 'revenue', label: 'Revenue', sub: 'completed orders', value: `$${stats.revenue.toFixed(2)}`, icon: 'credit', bg: 'bg-teal-50', iconBg: 'bg-teal-100 text-teal-600' },
    { key: 'profit', label: 'Profit', sub: 'completed orders', value: `$${stats.profit.toFixed(2)}`, icon: 'trending', bg: 'bg-green-50', iconBg: 'bg-green-100 text-green-600' },
    { key: 'withdrawn', label: 'Withdrawn', sub: `${stats.pendingWithdrawals} pending`, value: `$${stats.withdrawn.toFixed(2)}`, icon: 'send', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100 text-indigo-600' },
    { key: 'orders', label: 'Orders', sub: `${stats.ordersCancelled} cancelled`, value: `${stats.ordersCompleted}/${stats.ordersTotal}`, icon: 'package', bg: 'bg-amber-50', iconBg: 'bg-amber-100 text-amber-600' },
    { key: 'totalViews', label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: 'trending', bg: 'bg-violet-50', iconBg: 'bg-violet-100 text-violet-600' },
    { key: 'todayViews', label: "Today's Views", value: stats.todaysViews.toLocaleString(), icon: 'eye', bg: 'bg-purple-50', iconBg: 'bg-purple-100 text-purple-600' },
  ]

  const tabs = [
    { id: 'ledger', label: 'Ledger', count: ledger.length },
    { id: 'orders', label: 'Orders', count: orders.length },
    { id: 'withdrawals', label: 'Withdrawals', count: withdrawals.length },
    { id: 'campaigns', label: 'Campaigns', count: campaigns.length },
  ]

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 px-5 py-4 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                <Icon name="activity" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-white leading-tight truncate">{seller.shopName || seller.fullName}</h3>
                <p className="text-blue-100 text-xs font-semibold">Activity overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white font-bold text-xs border border-white/30">
                {seller.status || 'Active'}
              </span>
              <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {statCards.map((s) => (
              <div key={s.key} className={`rounded-2xl ${s.bg} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                    <Icon name={s.icon} className="w-4 h-4" />
                  </div>
                  {s.sub && (
                    <span className="text-[10px] text-gray-400 font-bold bg-white/70 px-2 py-0.5 rounded-full leading-tight">
                      {s.sub}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-gray-900 leading-none">{s.value}</p>
                <p className="mt-1.5 text-xs font-bold text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex border-b-2 border-gray-100 mb-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 pb-3 px-2 text-lg font-black transition-all relative ${tab === t.id ? 'text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.label} <span className="text-sm opacity-70">({t.count})</span>
                {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full" />}
              </button>
            ))}
          </div>

          <div className="space-y-3 pr-1">
            {tab === 'ledger' && (
              ledger.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-3xl py-16 text-center">
                  <p className="text-2xl font-black text-gray-400">No balance transactions yet.</p>
                </div>
              ) : (
                ledger.map((l) => (
                  <div key={l.id} className="rounded-2xl border-2 border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${l.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        <Icon name={l.type === 'credit' ? 'plus' : 'minus'} className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{l.description}</p>
                        <p className="text-sm text-gray-500 font-medium">{l.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-lg ${l.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {l.type === 'credit' ? '+' : '-'}${l.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">Bal: ${l.balance.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )
            )}

            {tab === 'orders' && (
              orders.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-3xl py-16 text-center">
                  <p className="text-2xl font-black text-gray-400">No orders yet.</p>
                </div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="rounded-2xl border-2 border-gray-100 p-4 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 text-4xl">
                      {o.productImage === 'tablet' ? <Icon name="laptop" className="w-10 h-10 text-gray-500" /> : <Icon name="package" className="w-10 h-10 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xl font-black text-gray-900 truncate">{o.productName}</p>
                        <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-black border ${o.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : o.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-600 font-semibold">
                        <span>{o.customerName}</span>
                        <span className="text-gray-300">•</span>
                        <span>Qty {o.qty}</span>
                        <span className="text-gray-300">•</span>
                        <span>Cost ${o.cost.toFixed(2)}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-emerald-600 font-black">Profit ${o.profit.toFixed(2)}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 font-medium">{o.time}</p>
                    </div>
                  </div>
                ))
              )
            )}

            {tab === 'withdrawals' && (
              withdrawals.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-3xl py-16 text-center">
                  <p className="text-2xl font-black text-gray-400">No withdrawals yet.</p>
                </div>
              ) : (
                withdrawals.map((w) => (
                  <div key={w.id} className="rounded-2xl border-2 border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Icon name="send" className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Withdrawal to {w.method || 'Bank'}</p>
                        <p className="text-sm text-gray-500 font-medium">{w.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-gray-900">-${w.amount?.toFixed(2) || '0.00'}</p>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${w.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : w.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {w.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              )
            )}

            {tab === 'campaigns' && (
              campaigns.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-3xl py-16 text-center">
                  <p className="text-2xl font-black text-gray-400">No campaigns yet.</p>
                </div>
              ) : (
                campaigns.map((c) => {
                  const pct = c.totalViews > 0 ? (c.currentViews / c.totalViews) * 100 : 0
                  return (
                    <div key={c.id} className="rounded-2xl border-2 border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-2xl font-black text-gray-900">{c.currentViews} / {c.totalViews} views</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-2xl font-black text-sm border-2 ${c.status === 'Running' ? 'bg-blue-50 text-blue-700 border-blue-200' : c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                        <div
                          className="h-full bg-gradient-to-r from-slate-700 to-slate-900 rounded-full transition-all"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 font-semibold">
                        <span>Batches {c.batches}</span>
                        <span className="text-gray-300">•</span>
                        <span>Started {c.started}</span>
                        <span className="text-gray-300">•</span>
                        <span>Ends {c.ends}</span>
                      </div>
                    </div>
                  )
                })
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const LoginHistoryModal = ({ seller, onClose }) => {
  const { getSellerLoginHistory } = useAuth()
  const [search, setSearch] = useState('')
  const history = getSellerLoginHistory(seller.id)

  const filtered = history.filter((h) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      (h.ip && h.ip.toLowerCase().includes(q)) ||
      (h.location && h.location.toLowerCase().includes(q)) ||
      (h.city && h.city.toLowerCase().includes(q)) ||
      (h.region && h.region.toLowerCase().includes(q)) ||
      (h.country && h.country.toLowerCase().includes(q)) ||
      (h.browser && h.browser.toLowerCase().includes(q)) ||
      (h.os && h.os.toLowerCase().includes(q)) ||
      (h.deviceType && h.deviceType.toLowerCase().includes(q)) ||
      (h.userAgent && h.userAgent.toLowerCase().includes(q))
    )
  })

  const copyIp = (ip) => {
    try { navigator.clipboard.writeText(ip) } catch (_) {}
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-start space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Icon name="globe" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">Login history</h3>
              <p className="text-gray-500 mt-1 font-medium">Every recorded sign-in for <span className="font-bold text-gray-800">{seller.fullName}</span> with IP, device and approximate location.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="search" className="w-6 h-6" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IP, place or device..."
              className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-3xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          <p className="text-sm font-bold text-gray-500">{filtered.length} of {history.length} events</p>

          <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <Icon name="history" className="w-7 h-7 text-gray-400" />
                </div>
                <p className="font-bold text-gray-700">No login events found</p>
              </div>
            ) : (
              filtered.map((h) => (
                <div key={h.id} className="rounded-2xl border-2 border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="clock" className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-gray-700">{h.time}</span>
                  </div>
                  <div className="flex items-start gap-2 mb-2">
                    <Icon name="info" className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-lg text-gray-900">{h.ip === 'Admin impersonation' ? 'Admin signed in as this seller' : h.location || [h.city, h.region, h.country].filter(Boolean).join(', ') || 'Location unknown'}</span>
                      {h.countryCode && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">{h.countryCode}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
                    <Icon name="laptop" className="w-4 h-4 text-gray-400" />
                    <span>{h.deviceType}{h.os ? ` • ${h.os}` : ''}{h.browser ? ` • ${h.browser}` : ''}</span>
                  </div>
                  {h.ip && h.ip !== 'Admin impersonation' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="globe" className="w-4 h-4 text-gray-400" />
                      <span className="font-mono font-bold text-gray-800">{h.ip}</span>
                      <button onClick={() => copyIp(h.ip)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors" title="Copy IP">
                        <Icon name="copy" className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {h.userAgent && (
                    <p className="text-xs text-gray-500 font-mono leading-relaxed bg-gray-50 rounded-xl p-2 border border-gray-100 break-all">
                      {h.userAgent}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const BalanceModal = ({ seller, onClose }) => {
  const { adjustSellerBalance } = useAuth()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const doAction = async (action) => {
    if (busy) return
    setError('')
    setSuccess('')
    setBusy(true)
    const res = await adjustSellerBalance(seller.id, amount, action)
    setBusy(false)
    if (res.success) {
      setSuccess(`Balance ${action === 'add' ? 'added' : 'deducted'} successfully`)
      setAmount('')
      setTimeout(() => { onClose() }, 900)
    } else {
      setError(res.error || 'Operation failed')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white sm:rounded-3xl rounded-t-[32px] shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Icon name="wallet" className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{seller.shopName || seller.fullName}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">Adjust Shop Balance</h3>
              <p className="text-gray-500 mt-1 font-medium">Current: <span className="font-black text-gray-800">${(seller.balance || 0).toFixed(2)}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-5 py-5 bg-gray-50 border-2 border-gray-100 rounded-3xl text-3xl font-black text-gray-900 placeholder-gray-300 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-rose-600 font-bold">{error}</p>}
          {success && <p className="text-emerald-600 font-bold">{success}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => doAction('add')}
              disabled={!amount || parseFloat(amount) <= 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-white bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="plus" className="w-6 h-6" />
              Add Funds
            </button>
            <button
              onClick={() => doAction('deduct')}
              disabled={!amount || parseFloat(amount) <= 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-gray-900 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="minus" className="w-6 h-6" />
              Deduct
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const GuaranteeModal = ({ seller, onClose }) => {
  const { adjustSellerGuarantee } = useAuth()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const doAction = async (action) => {
    if (busy) return
    setError('')
    setSuccess('')
    setBusy(true)
    const res = await adjustSellerGuarantee(seller.id, amount, action)
    setBusy(false)
    if (res.success) {
      setSuccess(`Guarantee ${action === 'add' ? 'added' : 'deducted'} successfully`)
      setAmount('')
      setTimeout(() => { onClose() }, 900)
    } else {
      setError(res.error || 'Operation failed')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white sm:rounded-3xl rounded-t-[32px] shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Icon name="shield" className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">{seller.shopName || seller.fullName}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">Adjust Guarantee Funds</h3>
              <p className="text-gray-500 mt-1 font-medium">Current: <span className="font-black text-gray-800">${(seller.guarantee || 0).toFixed(2)}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-5 py-5 bg-gray-50 border-2 border-gray-100 rounded-3xl text-3xl font-black text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-rose-600 font-bold">{error}</p>}
          {success && <p className="text-emerald-600 font-bold">{success}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => doAction('add')}
              disabled={!amount || parseFloat(amount) <= 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-white bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="plus" className="w-6 h-6" />
              Add Funds
            </button>
            <button
              onClick={() => doAction('deduct')}
              disabled={!amount || parseFloat(amount) <= 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-gray-900 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="minus" className="w-6 h-6" />
              Deduct
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const RatingModal = ({ seller, onClose }) => {
  const { adjustSellerRating } = useAuth()
  const [rating, setRating] = useState(Number(seller.rating ?? 5).toFixed(2))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const step = (delta) => {
    const cur = parseFloat(rating) || 0
    const next = Math.max(0, Math.min(5, cur + delta))
    setRating(next.toFixed(2))
  }

  const preset = (v) => setRating(v.toFixed(2))

  const save = async () => {
    setError('')
    setSuccess('')
    const res = await adjustSellerRating(seller.id, rating)
    if (res.success) {
      setSuccess('Rating updated')
      setTimeout(() => { onClose() }, 800)
    } else {
      setError(res.error || 'Failed')
    }
  }

  const presets = [5.0, 4.5, 4.0, 3.5, 3.0]

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white sm:rounded-3xl rounded-t-[32px] shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Icon name="star" className="w-7 h-7 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{seller.shopName || seller.fullName}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">Adjust Shop Rating</h3>
              <p className="text-gray-500 mt-1 font-medium">Current: <span className="font-black text-amber-500">⭐ {(seller.rating || 5).toFixed(2)}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">Rating (0.00 — 5.00)</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => step(-0.5)}
                className="w-16 h-16 rounded-2xl bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-900 font-black text-3xl flex items-center justify-center shrink-0 transition-all"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                max="5"
                step="0.01"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="flex-1 px-4 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-4xl font-black text-center text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all"
              />
              <button
                onClick={() => step(0.5)}
                className="w-16 h-16 rounded-2xl bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-900 font-black text-3xl flex items-center justify-center shrink-0 transition-all"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => preset(p)}
                className={`px-2 py-3 rounded-2xl border-2 font-black text-sm transition-all ${parseFloat(rating) === p ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'}`}
              >
                {p.toFixed(1)} <Icon name="star" className="w-3.5 h-3.5 inline -mt-0.5 text-amber-500 fill-amber-400" />
              </button>
            ))}
          </div>

          {error && <p className="text-rose-600 font-bold">{error}</p>}
          {success && <p className="text-emerald-600 font-bold">{success}</p>}

          <button
            onClick={save}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-5 rounded-3xl font-black text-xl text-white bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Icon name="star" className="w-6 h-6" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

const ProductLimitModal = ({ seller, onClose }) => {
  const { adjustSellerProductLimit } = useAuth()
  const [limit, setLimit] = useState(String(seller.productLimit ?? 500))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const step = (delta) => {
    const cur = parseInt(limit, 10) || 0
    const next = Math.max(0, cur + delta)
    setLimit(String(next))
  }

  const save = async () => {
    setError('')
    setSuccess('')
    const res = await adjustSellerProductLimit(seller.id, limit)
    if (res.success) {
      setSuccess('Product limit updated')
      setTimeout(() => { onClose() }, 800)
    } else {
      setError(res.error || 'Failed')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white sm:rounded-3xl rounded-t-[32px] shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <Icon name="box" className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">{seller.shopName || seller.fullName}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">Adjust Product Limit</h3>
              <p className="text-gray-500 mt-1 font-medium">Current: <span className="font-black text-gray-800">{seller.productLimit ?? 500} products</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">Maximum products</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => step(-10)}
                className="w-16 h-16 rounded-2xl bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-900 font-black text-3xl flex items-center justify-center shrink-0 transition-all"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                step="1"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="flex-1 px-4 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-4xl font-black text-center text-gray-900 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
              />
              <button
                onClick={() => step(10)}
                className="w-16 h-16 rounded-2xl bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-900 font-black text-3xl flex items-center justify-center shrink-0 transition-all"
              >
                +
              </button>
            </div>
          </div>

          {error && <p className="text-rose-600 font-bold">{error}</p>}
          {success && <p className="text-emerald-600 font-bold">{success}</p>}

          <button
            onClick={save}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-5 rounded-3xl font-black text-xl text-white bg-gradient-to-br from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/20 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

const ViewsBoosterModal = ({ seller, onClose }) => {
  const { getSellerViews, getSellerCampaigns, startViewsCampaign, pauseViewsCampaign, terminateViewsCampaign, getActiveViewsCampaign, addInstantViews } = useAuth()
  const [tab, setTab] = useState('campaign')
  const views = getSellerViews(seller.id)
  const campaigns = getSellerCampaigns(seller.id)
  const [active, setActive] = useState(getActiveViewsCampaign(seller.id))

  const [totalViews, setTotalViews] = useState('2000')
  const [hours, setHours] = useState('1')
  const [minutes, setMinutes] = useState('0')
  const [batches, setBatches] = useState('20')
  const [instantCount, setInstantCount] = useState('500')
  const [msg, setMsg] = useState('')
  const [msgT, setMsgT] = useState('')

  const n = (v) => parseInt(v, 10) || 0
  const h = n(hours)
  const m = n(minutes)
  const b = Math.max(1, n(batches))
  const tv = n(totalViews)
  const perBatch = Math.max(1, Math.round(tv / b))
  const totalMin = Math.max(0, h * 60 + m)
  const intervalMin = b > 1 ? Math.max(1, Math.round(totalMin / b)) : totalMin
  const intervalH = Math.floor(intervalMin / 60)
  const intervalM = intervalMin % 60

  const progressPct = active && active.totalViews > 0 ? (active.currentViews / active.totalViews) * 100 : 0

  const doStart = async () => {
    setMsg('')
    const res = await startViewsCampaign(seller.id, { totalViews, hours: h, minutes: m, batches: b })
    if (res.success) {
      setActive(res.campaign)
      setMsg(`Campaign started: ${tv} views in ${b} batches`)
      setMsgT('success')
      setTimeout(() => setMsg(''), 2500)
    } else {
      setMsg(res.error || 'Could not start the campaign')
      setMsgT('error')
    }
  }

  const doPause = async () => {
    if (!active) return
    const res = await pauseViewsCampaign(seller.id, active.id, active.status)
    if (res.success) setActive((a) => a ? { ...a, status: a.status === 'Running' ? 'Paused' : 'Running' } : a)
    else { setMsg(res.error || 'Failed'); setMsgT('error') }
  }

  const doTerminate = async () => {
    if (!active) return
    const res = await terminateViewsCampaign(seller.id, active.id)
    if (res.success) setActive((a) => a ? { ...a, status: 'Terminated' } : a)
    else { setMsg(res.error || 'Failed'); setMsgT('error') }
  }

  const doInstant = async () => {
    setMsg('')
    const res = await addInstantViews(seller.id, instantCount)
    if (res.success) {
      setMsg(`+${instantCount} views added instantly`)
      setMsgT('success')
      setTimeout(() => setMsg(''), 2000)
    } else {
      setMsg(res.error || 'Failed')
      setMsgT('error')
    }
  }

  const refreshActive = () => setActive(getActiveViewsCampaign(seller.id))

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-start space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Icon name="trending" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">Store views — {seller.fullName}</h3>
              <p className="text-gray-500 mt-1 font-medium">Boost views instantly, schedule a drip campaign, or review past activity.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl border-2 border-gray-100 bg-gray-50/50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500">Total views</p>
              <p className="mt-1 text-4xl font-black text-gray-900">{views.total}</p>
            </div>
            <div className="rounded-2xl border-2 border-gray-100 bg-gray-50/50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500">Today</p>
              <p className="mt-1 text-4xl font-black text-gray-900">{views.today}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100/70 rounded-2xl mb-5">
            {[{ id: 'campaign', label: 'Campaign' }, { id: 'instant', label: 'Instant' }, { id: 'history', label: `History (${campaigns.length})` }].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-3 rounded-xl font-black transition-all ${tab === t.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'campaign' && (
            <div className="space-y-5">
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">Total views to send</label>
                <input type="number" min="0" value={totalViews} onChange={(e) => setTotalViews(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Hours</label>
                  <input type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2">Minutes</label>
                  <input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">Batches</label>
                <input type="number" min="1" value={batches} onChange={(e) => setBatches(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all" />
              </div>

              <div className="rounded-2xl bg-gray-50 border-2 border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">Per batch</span>
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-black border border-rose-100">~{perBatch} views</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">Interval</span>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-black border border-indigo-100">every {intervalH > 0 ? `${intervalH}h ` : ''}{intervalM}m 0s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-600">Window</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black border border-emerald-100">{totalMin} min total</span>
                </div>
              </div>

              {active && (active.status === 'Running' || active.status === 'Paused') && (
                <div className="rounded-2xl bg-rose-50 border-2 border-rose-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${active.status === 'Running' ? 'bg-rose-600 animate-pulse' : 'bg-gray-400'}`} />
                      <span className="font-black text-lg text-rose-800">Campaign {active.status.toLowerCase()}</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white text-rose-700 font-black border border-rose-200">{progressPct.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-rose-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-slate-800 to-slate-900 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="font-bold text-sm text-rose-700">Batch {active.completedBatches || 0} of {active.batchCount || b} completed • {active.currentViews || 0}/{active.totalViews || tv} views</p>
                </div>
              )}

              {msg && <p className={`font-bold ${msgT === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{msg}</p>}

              <div className="space-y-3 pt-1">
                <button
                  onClick={doStart}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-5 rounded-3xl font-black text-xl text-white bg-gradient-to-br from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-lg shadow-rose-500/20 transition-all"
                >
                  <Icon name="sparkles" className="w-6 h-6" />
                  Start campaign
                </button>
                {active && (active.status === 'Running' || active.status === 'Paused') && (
                  <>
                    <button
                      onClick={doPause}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-amber-700 bg-white border-2 border-amber-300 hover:bg-amber-50 shadow-sm transition-all"
                    >
                      <Icon name={active.status === 'Running' ? 'pause' : 'zap'} className="w-6 h-6" />
                      {active.status === 'Running' ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={doTerminate}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-rose-600 bg-white border-2 border-rose-300 hover:bg-rose-50 shadow-sm transition-all"
                    >
                      <Icon name="stop" className="w-6 h-6" />
                      Terminate
                    </button>
                  </>
                )}
                {(!active || active.status === 'Terminated') && (
                  <p className="text-center text-sm font-semibold text-gray-500 pb-2">Batches run automatically — first tick within ~1 minute.</p>
                )}
              </div>
            </div>
          )}

          {tab === 'instant' && (
            <div className="space-y-5">
              <div>
                <label className="block text-base font-bold text-gray-700 mb-2">Views to add instantly</label>
                <input type="number" min="1" value={instantCount} onChange={(e) => setInstantCount(e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-black text-gray-900 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((v) => (
                  <button key={v} onClick={() => setInstantCount(String(v))} className="px-2 py-3 rounded-xl border-2 font-black text-sm bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-700 transition-all">
                    {v}
                  </button>
                ))}
              </div>
              {msg && <p className={`font-bold ${msgT === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{msg}</p>}
              <button
                onClick={doInstant}
                disabled={!instantCount || n(instantCount) <= 0}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-5 rounded-3xl font-black text-xl text-white bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="zap" className="w-6 h-6" />
                Add +{instantCount} views now
              </button>
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <Icon name="history" className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="font-bold text-gray-700">No campaigns yet</p>
                </div>
              ) : (
                campaigns.map((c) => {
                  const pct = c.totalViews > 0 ? (c.currentViews / c.totalViews) * 100 : 0
                  return (
                    <div key={c.id} className="rounded-2xl border-2 border-gray-100 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xl font-black text-gray-900">{c.currentViews} / {c.totalViews} views</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${c.status === 'Running' ? 'bg-blue-50 text-blue-700 border-blue-200' : c.status === 'Paused' ? 'bg-amber-50 text-amber-700 border-amber-200' : c.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-gradient-to-r from-rose-500 to-pink-600 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 font-semibold text-sm">
                        <span>Batches {c.batches || `${c.completedBatches || 0}/${c.batchCount || 0}`}</span>
                        <span className="text-gray-300">•</span>
                        <span>Started {c.started}</span>
                        <span className="text-gray-300">•</span>
                        <span>Ends {c.ends}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SuspendModal = ({ seller, onClose }) => {
  const { suspendSellerAccount } = useAuth()
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState('')
  const [msgT, setMsgT] = useState('')
  const isSuspended = seller.suspended

  const doToggle = async () => {
    const next = !isSuspended
    const res = await suspendSellerAccount(seller.id, next, reason)
    if (res.success) {
      setMsg(next ? 'Account suspended successfully' : 'Account unsuspended successfully')
      setMsgT('success')
      setTimeout(() => onClose(), 900)
    } else {
      setMsg(res.error || 'Failed')
      setMsgT('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white sm:rounded-3xl rounded-t-[32px] shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-3">
            <div className={`w-14 h-14 rounded-2xl ${isSuspended ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} flex items-center justify-center shrink-0`}>
              <Icon name="ban" className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{seller.shopName || seller.fullName}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{isSuspended ? 'Unsuspend Account' : 'Suspend Account'}</h3>
              <p className="text-gray-500 mt-1 font-medium">Current status: <span className={`font-black ${isSuspended ? 'text-amber-600' : 'text-emerald-600'}`}>{isSuspended ? 'Suspended' : 'Active'}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">Reason (optional)</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe why this action is being taken..."
              className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all resize-none"
            />
          </div>

          {msg && <p className={`font-bold ${msgT === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{msg}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-4 rounded-3xl font-black text-lg text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all">
              Cancel
            </button>
            <button
              onClick={doToggle}
              className={`inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-white shadow-lg transition-all ${isSuspended ? 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20'}`}
            >
              <Icon name="ban" className="w-6 h-6" />
              {isSuspended ? 'Unsuspend' : 'Suspend'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const BlockWithdrawalsModal = ({ seller, onClose }) => {
  const { toggleSellerWithdrawals } = useAuth()
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState('')
  const [msgT, setMsgT] = useState('')
  const blocked = seller.withdrawalsBlocked

  const doToggle = async () => {
    const next = !blocked
    const res = await toggleSellerWithdrawals(seller.id, next, reason)
    if (res.success) {
      setMsg(next ? 'Withdrawals blocked successfully' : 'Withdrawals allowed successfully')
      setMsgT('success')
      setTimeout(() => onClose(), 900)
    } else {
      setMsg(res.error || 'Failed')
      setMsgT('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white sm:rounded-3xl rounded-t-[32px] shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-3">
            <div className={`w-14 h-14 rounded-2xl ${blocked ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center shrink-0`}>
              <Icon name="credit" className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">{seller.shopName || seller.fullName}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{blocked ? 'Unblock Withdrawals' : 'Block Withdrawals'}</h3>
              <p className="text-gray-500 mt-1 font-medium">Withdrawals currently: <span className={`font-black ${blocked ? 'text-rose-600' : 'text-emerald-600'}`}>{blocked ? 'Blocked' : 'Allowed'}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">Reason (optional)</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe why withdrawals are being restricted..."
              className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all resize-none"
            />
          </div>

          {msg && <p className={`font-bold ${msgT === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{msg}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-4 rounded-3xl font-black text-lg text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all">
              Cancel
            </button>
            <button
              onClick={doToggle}
              className={`inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-white shadow-lg transition-all ${blocked ? 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/20'}`}
            >
              <Icon name="credit" className="w-6 h-6" />
              {blocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const AllowProductRemovalModal = ({ seller, onClose }) => {
  const { toggleSellerProductRemoval } = useAuth()
  const [msg, setMsg] = useState('')
  const [msgT, setMsgT] = useState('')
  const allowed = seller.allowProductRemoval ?? true

  const doToggle = async () => {
    const next = !allowed
    const res = await toggleSellerProductRemoval(seller.id, next)
    if (res.success) {
      setMsg(next ? 'Product removal allowed' : 'Product removal denied')
      setMsgT('success')
      setTimeout(() => onClose(), 900)
    } else {
      setMsg(res.error || 'Failed')
      setMsgT('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white sm:rounded-3xl rounded-t-[32px] shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-3">
            <div className={`w-14 h-14 rounded-2xl ${allowed ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center shrink-0`}>
              <Icon name="box" className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">{seller.shopName || seller.fullName}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{allowed ? 'Deny Product Removal' : 'Allow Product Removal'}</h3>
              <p className="text-gray-500 mt-1 font-medium">Product removal currently: <span className={`font-black ${allowed ? 'text-emerald-600' : 'text-rose-600'}`}>{allowed ? 'Allowed' : 'Denied'}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div className="rounded-2xl bg-indigo-50 border-2 border-indigo-100 p-5 space-y-2">
            <p className="font-black text-indigo-800 text-lg">What does this do?</p>
            <p className="font-semibold text-indigo-700">
              {allowed
                ? 'Denying product removal will prevent the seller from deleting any listings. Existing products remain untouched.'
                : 'Allowing product removal lets the seller delete their own products from their inventory.'}
            </p>
          </div>

          {msg && <p className={`font-bold ${msgT === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{msg}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-4 rounded-3xl font-black text-lg text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all">
              Cancel
            </button>
            <button
              onClick={doToggle}
              className={`inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-white shadow-lg transition-all ${allowed ? 'bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/20' : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/20'}`}
            >
              <Icon name="box" className="w-6 h-6" />
              {allowed ? 'Deny' : 'Allow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const DeleteStoreModal = ({ seller, onClose }) => {
  const { toggleSellerDeleted } = useAuth()
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [msgT, setMsgT] = useState('')
  const isDeleted = seller.deleted

  const doToggle = async () => {
    if (!isDeleted && confirm !== seller.fullName.trim()) {
      setMsg(`Type "${seller.fullName.trim()}" to confirm deletion`)
      setMsgT('error')
      return
    }
    const next = !isDeleted
    const res = await toggleSellerDeleted(seller.id, next, reason)
    if (res.success) {
      setMsg(next ? 'Store deleted successfully' : 'Store restored successfully')
      setMsgT('success')
      setTimeout(() => onClose(), 900)
    } else {
      setMsg(res.error || 'Failed')
      setMsgT('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white sm:rounded-3xl rounded-t-[32px] shadow-2xl overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6">
          <div className="flex items-start space-x-3">
            <div className={`w-14 h-14 rounded-2xl ${isDeleted ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center shrink-0`}>
              <Icon name="trash" className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">{seller.shopName || seller.fullName}</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{isDeleted ? 'Restore Store' : 'Delete Store'}</h3>
              <p className="text-gray-500 mt-1 font-medium">Current status: <span className={`font-black ${isDeleted ? 'text-rose-600' : 'text-emerald-600'}`}>{isDeleted ? 'Deleted' : 'Active'}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {!isDeleted && (
            <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 p-5 space-y-2">
              <p className="font-black text-rose-800 text-lg">Irreversible action</p>
              <p className="font-semibold text-rose-700">
                Deleting the store will hide the seller from the default directory. Their data is preserved in case you want to restore them later.
              </p>
            </div>
          )}

          <div>
            <label className="block text-base font-bold text-gray-700 mb-2">Reason (optional)</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Record a reason for this action..."
              className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all resize-none"
            />
          </div>

          {!isDeleted && (
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">Confirm by typing the seller name: <span className="text-rose-600">{seller.fullName.trim()}</span></label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={`Type "${seller.fullName.trim()}"`}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all"
              />
            </div>
          )}

          {msg && <p className={`font-bold ${msgT === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{msg}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-4 rounded-3xl font-black text-lg text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all">
              Cancel
            </button>
            <button
              onClick={doToggle}
              className={`inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-white shadow-lg transition-all ${isDeleted ? 'bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/20'}`}
            >
              <Icon name="trash" className="w-6 h-6" />
              {isDeleted ? 'Restore' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Re-renders every `ms`, so "Online" turns into "Active 5m ago" without any data arriving.
const useNow = (ms) => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(timer)
  }, [ms])
  return now
}

// The seller's account tier as one word and a colour: what needs the admin's attention first.
const tierOf = (seller) => {
  if (seller.deleted) return ['DELETED', 'bg-rose-50 text-rose-700 ring-rose-200']
  if (seller.suspended) return ['SUSPENDED', 'bg-amber-50 text-amber-700 ring-amber-200']
  if (seller.verified) return ['VERIFIED', 'bg-emerald-50 text-emerald-700 ring-emerald-200']
  const kyc = seller.kyc?.status
  return kyc === 'Rejected' ? ['REJECTED', 'bg-rose-50 text-rose-700 ring-rose-200'] : ['UNVERIFIED', 'bg-slate-100 text-slate-600 ring-slate-200']
}

const joinedOn = (seller) => {
  const date = new Date(seller.createdAt || '')
  return Number.isNaN(date.getTime()) ? seller.memberSince || '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const money2 = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const AdminSellers = () => {
  const { sellersRegistry, admin, impersonateSellerLogin } = useAuth()
  // `?q=` opens the directory already narrowed to one seller (e.g. "Open full profile" in support chat).
  const [params] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const [showDeleted, setShowDeleted] = useState(false)
  const [openMenuFor, setOpenMenuFor] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const [passwordModal, setPasswordModal] = useState(null)
  const [notifModal, setNotifModal] = useState(null)
  const [activityModal, setActivityModal] = useState(null)
  const [loginHistoryModal, setLoginHistoryModal] = useState(null)
  const [balanceModal, setBalanceModal] = useState(null)
  const [guaranteeModal, setGuaranteeModal] = useState(null)
  const [ratingModal, setRatingModal] = useState(null)
  const [productLimitModal, setProductLimitModal] = useState(null)
  const [viewsModal, setViewsModal] = useState(null)
  const [suspendModal, setSuspendModal] = useState(null)
  const [blockWdModal, setBlockWdModal] = useState(null)
  const [allowRemoveModal, setAllowRemoveModal] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [loggingInAs, setLoggingInAs] = useState(null)
  const now = useNow(30 * 1000)

  const anyModalOpen = !!(passwordModal || notifModal || activityModal || loginHistoryModal || balanceModal || guaranteeModal || ratingModal || productLimitModal || viewsModal || suspendModal || blockWdModal || allowRemoveModal || deleteModal)
  useEffect(() => {
    if (!anyModalOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [anyModalOpen])

  const menuRef = useRef(null)
  useEffect(() => {
    if (!openMenuFor) return undefined
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuFor(null)
    }
    const onKey = (e) => e.key === 'Escape' && setOpenMenuFor(null)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenuFor])

  // Lock body scroll when the mobile bottom sheet is open
  useEffect(() => {
    if (!openMenuFor || window.innerWidth >= 640) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [openMenuFor])

  const mySellers = sellersRegistry.filter((s) => s.adminId === admin.id)
  const displaySellers = mySellers.filter((s) => (showDeleted ? s.deleted : !s.deleted))
  const deletedCount = mySellers.filter((s) => s.deleted).length

  const q = search.toLowerCase().trim()
  const filtered = displaySellers.filter(
    (s) => !q || [s.fullName, s.shopName, s.email].some((field) => field && field.toLowerCase().includes(q))
  )

  const handleLoginAs = async (seller) => {
    setLoginError('')
    setLoggingInAs(seller.id)
    const r = await impersonateSellerLogin(seller.id)
    if (!r.success) {
      setLoggingInAs(null)
      setLoginError(r.error || 'Could not open the seller portal.')
      return
    }
    // The seller area belongs to the storefront app, so this needs a real page load: navigate()
    // would resolve inside this app's own /admin-app router and land on its catch-all route.
    window.location.assign('/seller/dashboard')
  }

  const handleMenuAction = (item) => {
    setOpenMenuFor(null)
    if (item.id === 'password') setPasswordModal(item.seller)
    else if (item.id === 'notification') setNotifModal(item.seller)
    else if (item.id === 'activity') setActivityModal(item.seller)
    else if (item.id === 'loginHistory') setLoginHistoryModal(item.seller)
    else if (item.id === 'balance') setBalanceModal(item.seller)
    else if (item.id === 'guarantee') setGuaranteeModal(item.seller)
    else if (item.id === 'rating') setRatingModal(item.seller)
    else if (item.id === 'productLimit') setProductLimitModal(item.seller)
    else if (item.id === 'views') setViewsModal(item.seller)
    else if (item.id === 'suspend') setSuspendModal(item.seller)
    else if (item.id === 'blockWd') setBlockWdModal(item.seller)
    else if (item.id === 'allowRemove') setAllowRemoveModal(item.seller)
    else if (item.id === 'delete') setDeleteModal(item.seller)
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-l-4 border-indigo-600 pl-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon name="users" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1 basis-72">
          <h1 className="text-2xl font-black leading-tight text-gray-900">Sellers</h1>
          <p className="text-sm text-gray-500">All sellers who registered with your invitation code. Click a row to manage.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shop, name, or email..."
              aria-label="Search sellers"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500" aria-live="polite">
            Results
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm normal-case tracking-normal text-gray-900">{filtered.length}</span>
          </span>
          <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-700">
            Deleted{deletedCount > 0 && <span className="text-xs font-semibold text-gray-400">({deletedCount})</span>}
            <button
              type="button"
              role="switch"
              aria-checked={showDeleted}
              aria-label="Show deleted sellers"
              onClick={() => setShowDeleted((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${showDeleted ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${showDeleted ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </label>
        </div>
      </div>

      {loginError && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {loginError}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white py-20 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Icon name="users" className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-800">No sellers found</p>
          <p className="mt-2 text-gray-500">{search ? 'Try a different search term.' : showDeleted ? 'No deleted sellers.' : 'Share your invite code to onboard sellers.'}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => {
            const menuOpen = openMenuFor === s.id
            const online = isOnline(s, now)
            const [tier, tierTone] = tierOf(s)
            const items = s.productIds?.length || 0
            return (
              <li key={s.id} className={`relative ${menuOpen ? 'z-30' : ''}`}>
                <div
                  onClick={(e) => {
                    if (!e.target.closest('button, a')) setOpenMenuFor(menuOpen ? null : s.id)
                  }}
                  className={`flex cursor-pointer flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border bg-white p-4 shadow-sm transition sm:p-5 ${menuOpen ? 'border-indigo-200 ring-2 ring-indigo-100' : 'border-gray-100 hover:border-gray-200 hover:shadow'} ${s.deleted ? 'opacity-75' : ''}`}
                >
                  <div className="flex min-w-[260px] flex-1 basis-72 items-center gap-4">
                    <div className="relative shrink-0">
                      <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br ${avatarColorFor(s.fullName, s.email)} text-lg font-black text-white shadow-md`}>
                        {initialsOf(s.fullName)}
                      </div>
                      <span title={online ? 'Online now' : `Active ${s.lastActive || 'never'}`} className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="truncate text-lg font-black leading-tight text-gray-900">{s.fullName}</span>
                        {online ? <span className="text-xs font-bold text-emerald-600">Online</span> : <span className="text-xs font-medium text-gray-400">Active {s.lastActive || 'never'}</span>}
                      </p>
                      <p className="truncate text-sm font-medium text-gray-500">{s.email}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs font-medium text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="calendar" className="h-3.5 w-3.5" />
                          Joined {joinedOn(s)}
                        </span>
                        {s.shopName && <span className="truncate">{s.shopName}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-sm font-bold text-amber-700">
                        <Icon name="star" className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        {Number(s.rating ?? 5).toFixed(2)}
                      </span>
                      <p className="text-xs font-semibold text-gray-500">
                        {items} Active Item{items === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black tracking-wide ring-1 ring-inset ${tierTone}`}>{tier}</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Account tier</p>
                      {s.withdrawalsBlocked && <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Withdrawals blocked</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoginAs(s)}
                      disabled={loggingInAs === s.id}
                      title="Open the seller portal as this seller"
                      className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Icon name="login" className="h-[18px] w-[18px]" />
                      {loggingInAs === s.id ? 'Opening…' : 'Login'}
                    </button>
                    <div ref={menuOpen ? menuRef : undefined}>
                      <button
                        type="button"
                        onClick={(e) => {
                          if (!menuOpen) {
                            const r = e.currentTarget.getBoundingClientRect()
                            setMenuPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
                          }
                          setOpenMenuFor(menuOpen ? null : s.id)
                        }}
                        aria-label={`Manage ${s.fullName}`}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${menuOpen ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                        aria-expanded={menuOpen}
                        aria-haspopup="menu"
                      >
                        <Icon name="dots" className="h-5 w-5" />
                      </button>

                      {menuOpen && (() => {
                        const entries = buildMenu(s)
                        const renderEntries = (entries) => entries.map((entry, idx) => {
                          if (entry.separator) return (
                            <li key={'sep-' + idx} role="presentation">
                              {idx > 0 && <div className="mx-3 my-1 h-px bg-gray-100" />}
                              <p className="px-4 pb-1 pt-2 text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">{entry.label}</p>
                            </li>
                          )
                          return (
                            <li key={entry.id} role="none">
                              <button type="button" role="menuitem" onClick={() => handleMenuAction(entry)} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${entry.color || 'text-gray-700'}`}>
                                <Icon name={entry.icon} className="h-[18px] w-[18px] shrink-0" />
                                <span className="flex-1 text-[15px] font-semibold">{entry.label}</span>
                              </button>
                            </li>
                          )
                        })
                        return (
                          <>
                            {/* Mobile: full-screen bottom sheet */}
                            <div className="sm:hidden fixed inset-0 z-[9999] flex flex-col justify-end" onClick={() => setOpenMenuFor(null)}>
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                              <div className="relative bg-white rounded-t-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-black shrink-0">
                                    {(s.fullName || '?')[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-black text-gray-900 truncate">{s.fullName}</p>
                                    <p className="text-xs text-gray-500">Account actions</p>
                                  </div>
                                  <button onClick={() => setOpenMenuFor(null)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                                <ul className="max-h-[60vh] overflow-y-auto py-2">
                                  {renderEntries(entries)}
                                </ul>
                                <div className="h-safe-bottom" />
                              </div>
                            </div>

                            {/* Desktop: fixed dropdown */}
                            <div role="menu" style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }} className="hidden sm:block w-[280px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                              <ul className="max-h-[70vh] overflow-y-auto py-1.5">
                                {renderEntries(entries)}
                              </ul>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="ml-auto min-w-[120px] text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Balance</p>
                    <p className="text-xl font-black leading-tight text-gray-900">{money2(s.balance)}</p>
                    <p className="text-xs font-medium text-gray-400">Guarantee {money2(s.guarantee)}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {passwordModal && <PasswordModal seller={passwordModal} onClose={() => setPasswordModal(null)} />}
      {notifModal && <NotificationModal seller={notifModal} onClose={() => setNotifModal(null)} />}
      {activityModal && <ActivityModal seller={activityModal} onClose={() => setActivityModal(null)} />}
      {loginHistoryModal && <LoginHistoryModal seller={loginHistoryModal} onClose={() => setLoginHistoryModal(null)} />}
      {balanceModal && <BalanceModal seller={balanceModal} onClose={() => setBalanceModal(null)} />}
      {guaranteeModal && <GuaranteeModal seller={guaranteeModal} onClose={() => setGuaranteeModal(null)} />}
      {ratingModal && <RatingModal seller={ratingModal} onClose={() => setRatingModal(null)} />}
      {productLimitModal && <ProductLimitModal seller={productLimitModal} onClose={() => setProductLimitModal(null)} />}
      {viewsModal && <ViewsBoosterModal seller={viewsModal} onClose={() => setViewsModal(null)} />}
      {suspendModal && <SuspendModal seller={suspendModal} onClose={() => setSuspendModal(null)} />}
      {blockWdModal && <BlockWithdrawalsModal seller={blockWdModal} onClose={() => setBlockWdModal(null)} />}
      {allowRemoveModal && <AllowProductRemovalModal seller={allowRemoveModal} onClose={() => setAllowRemoveModal(null)} />}
      {deleteModal && <DeleteStoreModal seller={deleteModal} onClose={() => setDeleteModal(null)} />}
    </div>
  )
}

export default AdminSellers
