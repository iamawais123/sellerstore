import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { DEFAULT_TELEGRAM_PREFS } from '../../firebase/shopData'
import { Icon } from '../../components/activity/icons'

// What can be switched on and off, in the order shown. The keys are the ones the relay understands (api/_lib/sync.js).
const KINDS = [
  { key: 'activity', title: 'Seller activity', hint: "New sign-ups and KYC resubmissions (with the seller's details and their ID photos and PDFs), order payments, withdrawal requests, payout methods and product changes." },
  { key: 'support', title: 'Support messages', hint: 'A message a seller writes to you in support chat.' },
  { key: 'logins', title: 'Seller sign-ins', hint: 'Every time a seller logs in. Handy, but it can get chatty.' },
]

const failureText = (failure) =>
  failure?.code === 'permission-denied' ? 'You do not have access to your Telegram settings. Deploy the latest firestore.rules and try again.' : failure?.message || 'Could not load your Telegram settings.'

const clock = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const Switch = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
  >
    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
  </button>
)

const Step = ({ number, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">{number}</span>
    <span className="pt-0.5 text-[15px] text-slate-600">{children}</span>
  </li>
)

const AdminTelegram = () => {
  const { admin, dataReady, impersonation, watchTelegram, saveTelegramSettings, telegramAction } = useAuth()
  // undefined while loading, null when nothing is connected.
  const [link, setLink] = useState(undefined)
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const locked = !!impersonation

  useEffect(() => {
    if (!admin.id || !dataReady) return undefined
    return watchTelegram(
      (data) => {
        setLink(data)
        // Pressing Start in Telegram is what creates the link: the waiting state ends by itself.
        if (data) setPending(null)
      },
      (failure) => {
        setLink(null)
        setError(failureText(failure))
      }
    )
  }, [admin.id, dataReady])

  const run = async (name, task, done) => {
    setBusy(name)
    setError('')
    setNotice('')
    const result = await task()
    setBusy('')
    if (!result.success) return setError(result.error || 'Something went wrong. Try again.')
    done?.(result)
  }

  const connect = () =>
    run('link', () => telegramAction('link'), (result) => {
      setPending(result)
      // Some browsers refuse a tab opened after a network call; the button on the page is the fallback.
      window.open(result.url, '_blank', 'noopener')
    })

  const sendTest = () => run('test', () => telegramAction('test'), () => setNotice('Test message sent. Check Telegram.'))

  const disconnect = () => {
    if (!window.confirm('Stop sending notifications to this Telegram chat?')) return
    run('disconnect', () => telegramAction('disconnect'), () => setNotice('Disconnected.'))
  }

  const prefs = { ...DEFAULT_TELEGRAM_PREFS, ...(link?.prefs || {}) }
  const save = (changes) => run('save', () => saveTelegramSettings({ enabled: link.enabled !== false, prefs, ...changes }))

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="flex items-center gap-3">
        <Icon name="send" className="h-7 w-7 text-indigo-600" strokeWidth={2} />
        <h1 className="text-3xl font-black leading-tight text-slate-900">Telegram Alerts</h1>
      </div>
      <p className="mt-1 text-[15px] text-slate-500">Get your dashboard notifications on Telegram, so you hear about a new seller or withdrawal even when this page is closed.</p>

      {locked && (
        <p className="mt-4 rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
          You are viewing this console as the admin, so their Telegram settings are read-only.
        </p>
      )}
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</p>}
      {link?.lastError && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{link.lastError}</p>}

      {link === undefined && <div className="mt-6 h-40 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />}

      {link === null && (
        <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Connect your Telegram</h2>
          <ol className="mt-4 space-y-3">
            <Step number="1">Press <b>Connect Telegram</b> below. Telegram opens with our bot.</Step>
            <Step number="2">Press <b>Start</b> in Telegram.</Step>
            <Step number="3">Come back here: this page turns to “Connected” by itself.</Step>
          </ol>

          {!pending ? (
            <button
              type="button"
              onClick={connect}
              disabled={busy === 'link' || locked}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              <Icon name="send" className="h-4 w-4" />
              {busy === 'link' ? 'Getting your link…' : 'Connect Telegram'}
            </button>
          ) : (
            <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <Icon name="refresh" className="h-4 w-4 animate-spin" />
                Waiting for you to press Start in Telegram…
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href={pending.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  <Icon name="send" className="h-4 w-4" />
                  Open Telegram
                </a>
                <a href={pending.groupUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-700 hover:underline">
                  Send to a group instead
                </a>
                <button type="button" onClick={() => setPending(null)} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                  Cancel
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">This link works once{pending.expiresAt ? `, until ${clock(pending.expiresAt)}` : ''}. Need a new one? Cancel and connect again.</p>
            </div>
          )}
        </section>
      )}

      {link && (
        <>
          <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                  <Icon name="send" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-bold text-slate-900">{link.chatName || 'Telegram'}</p>
                  <p className="text-sm text-slate-500">
                    {link.chatType === 'private' ? 'Private chat' : 'Group'}
                    {link.linkedAt ? ` · connected ${new Date(link.linkedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={sendTest}
                  disabled={!!busy || locked}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  {busy === 'test' ? 'Sending…' : 'Send test message'}
                </button>
                <button
                  type="button"
                  onClick={disconnect}
                  disabled={!!busy || locked}
                  className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-[17px] font-bold text-slate-900">Send notifications</h2>
                <p className="text-sm text-slate-500">{link.enabled !== false ? 'On: new activity is sent to Telegram.' : 'Paused: nothing is sent, and nothing is stored up for later.'}</p>
              </div>
              <Switch checked={link.enabled !== false} disabled={!!busy || locked} label="Send notifications to Telegram" onChange={(enabled) => save({ enabled })} />
            </div>
            <ul>
              {KINDS.map((kind) => (
                <li key={kind.key} className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 last:border-0">
                  <div>
                    <p className="font-bold text-slate-900">{kind.title}</p>
                    <p className="text-sm text-slate-500">{kind.hint}</p>
                  </div>
                  <Switch
                    checked={prefs[kind.key]}
                    disabled={!!busy || locked || link.enabled === false}
                    label={kind.title}
                    onChange={(value) => save({ prefs: { ...prefs, [kind.key]: value } })}
                  />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <p className="mt-6 text-xs leading-relaxed text-slate-400">
        Alerts are short summaries: who did what, and any amount. The exception is a new seller's KYC: their details and ID photos or PDFs are sent too (they come with Seller activity; switch that off to stop them). Telegram bot messages are not end-to-end encrypted, so use a private chat rather than a group for this. Passwords and PINs are never sent. Send /stop to the bot in a private chat to disconnect from Telegram itself.
      </p>
    </div>
  )
}

export default AdminTelegram
