import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COL, deviceId, deviceKey, where } from '../../firebase/shopData'
import { Icon, PinIcon } from '../../components/activity/icons'
import { LOG_TABS, buildMyLogs, countMyLogs, filterMyLogs, logTime } from '../../lib/activityFeed'

const TAB_ICONS = { all: 'pulse', login: 'key', action: 'pulse', balance: 'card' }

const failureText = (failure, what) => (failure?.code === 'permission-denied' ? `You do not have access to ${what}. Deploy the latest firestore.rules and try again.` : failure?.message || `Could not load ${what}.`)

// "Unknown device ✎": click the pencil to name the device; the name follows it on every sign-in from it.
const DeviceChip = ({ row, onRename }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const named = !!row.deviceLabel

  const start = () => {
    setDraft(row.deviceLabel)
    setEditing(true)
  }
  const save = async () => {
    setSaving(true)
    const ok = await onRename(row.deviceKey, draft)
    setSaving(false)
    if (ok) setEditing(false)
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white py-0.5 pl-3 pr-1">
        <input
          autoFocus
          value={draft}
          maxLength={40}
          disabled={saving}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save()
            if (event.key === 'Escape') setEditing(false)
          }}
          placeholder="Name this device"
          className="w-36 bg-transparent text-xs font-semibold text-slate-700 placeholder:font-normal focus:outline-none"
        />
        <button type="button" onClick={save} disabled={saving} aria-label="Save device name" className="rounded-full p-1 text-emerald-600 hover:bg-emerald-50">
          <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
        <button type="button" onClick={() => setEditing(false)} aria-label="Cancel" className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
          <Icon name="x" className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        named ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      <Icon name={named ? 'shieldCheck' : 'shield'} className="h-3.5 w-3.5" />
      {named ? row.deviceLabel : 'Unknown device'}
      {row.nameable && (
        <button type="button" onClick={start} aria-label="Name this device" title="Name this device" className="opacity-60 hover:opacity-100">
          <Icon name="pencil" className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}

const ROW_LOOK = {
  login: { icon: 'key', circle: 'bg-indigo-50 text-indigo-500' },
  action: { icon: 'pulse', circle: 'bg-emerald-50 text-emerald-600' },
  up: { icon: 'arrowUpRight', circle: 'bg-emerald-50 text-emerald-600' },
  down: { icon: 'arrowDown', circle: 'bg-rose-50 text-rose-500' },
}

const LogRow = ({ row, onRename }) => {
  const look = row.kind === 'balance' ? ROW_LOOK[row.tone] : ROW_LOOK[row.kind]
  return (
    <li className="flex items-start gap-4 border-b border-slate-100 px-6 py-4 last:border-0">
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${look.circle}`}>
        <Icon name={look.icon} className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[17px] font-bold text-slate-900">{row.title}</h3>
          {row.badge && (
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${row.tone === 'down' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{row.badge}</span>
          )}
          {row.kind === 'login' && <DeviceChip row={row} onRename={onRename} />}
          {row.thisDevice && <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-sky-700">THIS DEVICE</span>}
        </div>
        {row.subtitle && <p className="mt-0.5 text-[15px] text-slate-500">{row.subtitle}</p>}
        {row.kind === 'login' && (row.location || row.ip) && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <PinIcon />
            {row.location || 'Location unknown'}
            {row.ip && <span className="text-slate-400">· {row.ip}</span>}
          </p>
        )}
        {row.device && <p className="mt-0.5 text-sm text-slate-400">{row.device}</p>}
      </div>
      <time dateTime={row.at} className="shrink-0 pt-0.5 text-sm font-medium text-slate-400">
        {logTime(row.at)}
      </time>
    </li>
  )
}

const AdminMyLogs = () => {
  const { admin, dataReady, sellerLoginHistory, subscribeData, watchDeviceLabels, saveDeviceLabel, backfillLocations } = useAuth()
  const [logins, setLogins] = useState(null)
  const [actions, setActions] = useState(null)
  const [labels, setLabels] = useState({})
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [backfill, setBackfill] = useState({ running: false, message: '', ok: true })
  const thisDevice = useMemo(() => deviceId(), [])

  useEffect(() => {
    if (!admin.id || !dataReady) return undefined
    setError('')
    const fail = (what) => (failure) => setError(failureText(failure, what))
    const stops = [
      subscribeData(COL.adminLogins, [where('adminId', '==', admin.id)], setLogins, fail('your sign-ins')),
      // Only what this admin did themselves (not their sellers, nor a super admin acting for them).
      subscribeData(COL.activity, [where('adminId', '==', admin.id), where('actorId', '==', admin.id)], setActions, fail('your actions')),
      // Device names are optional: without them every device is simply "Unknown device".
      watchDeviceLabels(setLabels, () => {}),
    ]
    return () => stops.forEach((stop) => stop())
  }, [admin.id, dataReady])

  const rows = useMemo(
    () => buildMyLogs({ logins: logins || [], actions: actions || [], labels, thisDevice, deviceKeyOf: deviceKey }),
    [logins, actions, labels, thisDevice]
  )
  const visible = useMemo(() => filterMyLogs(rows, { tab, query }), [rows, tab, query])
  const counts = useMemo(() => countMyLogs(rows), [rows])
  const loading = (logins === null || actions === null) && !error

  const rename = async (key, label) => {
    const result = await saveDeviceLabel(key, label)
    if (!result.success) setError(result.error || 'Could not save the device name.')
    else setError('')
    return result.success
  }

  // Sign-ins recorded without a place (older ones, or a lookup that failed at the time): look their
  // address up now. Entries that never had an address on record cannot be located.
  const runBackfill = async () => {
    const missing = [
      ...rows.filter((row) => row.needsLocation).map((row) => ({ collection: COL.adminLogins, id: row.id, ip: row.ip })),
      ...sellerLoginHistory.filter((entry) => !entry.location && entry.ip !== 'Admin impersonation').map((entry) => ({ collection: COL.loginHistory, id: entry.id, ip: entry.ip })),
    ]
    if (!missing.length) {
      setBackfill({ running: false, ok: true, message: 'Every sign-in already has a location.' })
      return
    }
    setBackfill({ running: true, ok: true, message: '' })
    const result = await backfillLocations(missing)
    const parts = []
    if (result.updated) parts.push(`Added ${result.updated} location${result.updated === 1 ? '' : 's'}.`)
    if (result.failed) parts.push(`${result.failed} could not be looked up right now.`)
    if (result.unresolved) parts.push(`${result.unresolved} older sign-in${result.unresolved === 1 ? ' has' : 's have'} no IP address on record, so their place is unknown.`)
    setBackfill({ running: false, ok: result.failed === 0, message: parts.join(' ') || 'Nothing to update.' })
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Icon name="pulse" className="h-7 w-7 text-indigo-600" strokeWidth={2} />
            <h1 className="text-3xl font-black leading-tight text-slate-900">My Logs</h1>
          </div>
          <p className="mt-1 text-[15px] text-slate-500">Your account activity — logins, actions, and balance adjustments.</p>
        </div>
        <button
          type="button"
          onClick={runBackfill}
          disabled={backfill.running}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <Icon name="refresh" className={`h-4 w-4 ${backfill.running ? 'animate-spin' : ''}`} />
          {backfill.running ? 'Looking up…' : 'Backfill locations'}
        </button>
      </div>

      {backfill.message && (
        <p role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${backfill.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {backfill.message}
        </p>
      )}
      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {LOG_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              title={`${counts[item.id]}`}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                tab === item.id ? 'border border-slate-200 bg-white text-indigo-700 shadow-sm' : 'border border-transparent text-slate-600 hover:bg-white/70'
              }`}
            >
              <Icon name={TAB_ICONS[item.id]} className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-72">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-[15px] text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />
        </label>
      </div>

      <ul className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading &&
          [0, 1, 2].map((row) => (
            <li key={row} className="flex animate-pulse gap-4 border-b border-slate-100 px-6 py-5 last:border-0">
              <div className="h-10 w-10 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>
            </li>
          ))}
        {!loading && visible.map((row) => <LogRow key={row.key} row={row} onRename={rename} />)}
        {!loading && !visible.length && (
          <li className="px-6 py-14 text-center font-medium text-slate-500">{rows.length ? 'No logs match your filters.' : 'No activity yet. Your sign-ins and actions will be listed here.'}</li>
        )}
      </ul>
    </div>
  )
}

export default AdminMyLogs
