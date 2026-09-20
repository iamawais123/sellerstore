import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COL, limit, orderBy, where } from '../../firebase/shopData'
import { Icon } from '../../components/activity/icons'
import {
  CATEGORIES,
  SUMMARY_ROWS,
  buildFeed,
  countByCategory,
  decodeEntities,
  filterFeed,
  groupByDay,
  money,
  relativeTime,
  summarize,
} from '../../lib/activityFeed'

// How many of the newest activity lines are kept live; sign-ins come from the (already live) login history.
const FEED_LIMIT = 500
const PAGE_SIZE = 100

// Full class names, so Tailwind can see them.
const TONES = {
  emerald: { pill: 'bg-emerald-50 text-emerald-700', active: 'bg-emerald-600 text-white', icon: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  sky: { pill: 'bg-sky-50 text-sky-700', active: 'bg-sky-600 text-white', icon: 'bg-sky-100 text-sky-600', bar: 'bg-sky-500', dot: 'bg-sky-500' },
  violet: { pill: 'bg-violet-50 text-violet-700', active: 'bg-violet-600 text-white', icon: 'bg-violet-100 text-violet-600', bar: 'bg-violet-500', dot: 'bg-violet-500' },
  amber: { pill: 'bg-amber-50 text-amber-700', active: 'bg-amber-500 text-white', icon: 'bg-amber-100 text-amber-600', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  orange: { pill: 'bg-orange-50 text-orange-700', active: 'bg-orange-500 text-white', icon: 'bg-orange-100 text-orange-500', bar: 'bg-orange-500', dot: 'bg-orange-500' },
  green: { pill: 'bg-green-50 text-green-700', active: 'bg-green-600 text-white', icon: 'bg-green-100 text-green-600', bar: 'bg-green-500', dot: 'bg-green-500' },
  rose: { pill: 'bg-rose-50 text-rose-700', active: 'bg-rose-500 text-white', icon: 'bg-rose-100 text-rose-500', bar: 'bg-rose-500', dot: 'bg-rose-500' },
  teal: { pill: 'bg-teal-50 text-teal-700', active: 'bg-teal-600 text-white', icon: 'bg-teal-100 text-teal-600', bar: 'bg-teal-500', dot: 'bg-teal-500' },
  indigo: { pill: 'bg-indigo-50 text-indigo-700', active: 'bg-indigo-600 text-white', icon: 'bg-indigo-100 text-indigo-600', bar: 'bg-indigo-500', dot: 'bg-indigo-500' },
  slate: { pill: 'bg-slate-100 text-slate-600', active: 'bg-slate-600 text-white', icon: 'bg-slate-100 text-slate-500', bar: 'bg-slate-300', dot: 'bg-slate-300' },
}

const CATEGORY_LOOK = {
  signin: { icon: 'key', tone: 'emerald' },
  signup: { icon: 'userPlus', tone: 'sky' },
  product: { icon: 'box', tone: 'violet' },
  payout: { icon: 'card', tone: 'amber' },
  withdrawal_requested: { icon: 'arrowUp', tone: 'orange' },
  withdrawal_approved: { icon: 'banknote', tone: 'green' },
  withdrawal_rejected: { icon: 'xCircle', tone: 'rose' },
  deposit: { icon: 'arrowDown', tone: 'teal' },
  balance: { icon: 'dollar', tone: 'indigo' },
  other: { icon: 'pulse', tone: 'slate' },
}

// A clock that ticks, so "just now" turns into "1m ago" without anything else happening.
function useNow(interval) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(timer)
  }, [interval])
  return now
}

const shortAgo = (seconds) => (seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m` : `${Math.floor(seconds / 3600)}h`)

const LastUpdate = ({ at }) => {
  const now = useNow(1000)
  return <>last {shortAgo(Math.max(0, Math.floor((now - at) / 1000)))} ago</>
}

const ProductThumb = ({ product }) => {
  const [broken, setBroken] = useState(false)
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white">
      {product?.image && !broken ? (
        <img src={product.image} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-contain" />
      ) : (
        <Icon name="box" className="h-5 w-5 text-slate-300" />
      )}
    </span>
  )
}

const EventRow = ({ event, now, last }) => {
  const look = CATEGORY_LOOK[event.category] || CATEGORY_LOOK.other
  const tone = TONES[look.tone]
  const product = event.product
  return (
    <li className="relative flex gap-4 px-5 py-3.5">
      {!last && <span className="absolute bottom-[-14px] left-[42px] top-[58px] w-px bg-slate-200" />}
      <span className={`z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
        <Icon name={look.icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="text-[17px] font-bold text-slate-900">{event.name}</span>
          {event.online && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          )}
          {event.email && <span className="truncate text-sm text-slate-400">{event.email}</span>}
        </div>
        {product ? (
          <div className="mt-1.5 flex items-center gap-3">
            <ProductThumb product={product} />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium text-slate-700" title={decodeEntities(product.name)}>
                {decodeEntities(product.name) || 'Product'}
              </p>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
                {event.text}
                {product.price != null && <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-700">{money(product.price)}</span>}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-[15px] font-medium text-slate-700">{event.text}</p>
        )}
        {event.detail && <p className="mt-0.5 text-sm text-slate-400">{event.detail}</p>}
        {event.category === 'signup' && event.location && <p className="mt-0.5 text-sm text-slate-400">Signed up from {event.location}</p>}
      </div>
      <time dateTime={event.at} className="shrink-0 pt-1 text-sm font-medium text-slate-400">
        {relativeTime(event.at, now)}
      </time>
    </li>
  )
}

const HOUR_TICKS = ['00', '06', '12', '18', '23']

const SummaryPanel = ({ summary, syncedAt, now }) => {
  const currentHour = new Date(now).getHours()
  return (
    <aside className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:sticky lg:top-28">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Activity summary</p>
          <h2 className="mt-1 text-lg font-bold leading-tight text-slate-900">Today&apos;s Action Breakdown</h2>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black leading-none text-slate-900">{summary.total}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Events</p>
        </div>
      </div>

      <ul className="mt-5 space-y-3.5">
        {SUMMARY_ROWS.map((row) => {
          const count = summary.counts[row.id]
          const percent = summary.total ? Math.round((count / summary.total) * 100) : 0
          return (
            <li key={row.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  <span className={`h-2 w-2 rounded-full ${TONES[row.tone].dot}`} />
                  {row.label}
                </span>
                <span>
                  <span className="font-bold text-slate-900">{count}</span>
                  <span className="ml-3 text-xs text-slate-400">{percent}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${TONES[row.tone].bar}`} style={{ width: `${percent}%` }} />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-6">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
          <span>By hour</span>
          <span className="normal-case tracking-normal">peak {summary.peak}/h</span>
        </div>
        <div className="mt-3 flex h-16 items-end gap-[3px]">
          {summary.hours.map((count, hour) => (
            <div key={hour} className="flex h-full flex-1 items-end" title={`${String(hour).padStart(2, '0')}:00 — ${count} event${count === 1 ? '' : 's'}`}>
              <div
                className={`w-full rounded-sm ${count ? (hour === currentHour ? 'bg-indigo-600' : 'bg-indigo-300') : 'bg-slate-200'}`}
                style={{ height: count ? `${Math.max(8, (count / summary.peak) * 100)}%` : '2px' }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-400">
          {HOUR_TICKS.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-2 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Streaming live updates
        </span>
        <span className="text-slate-400">
          <LastUpdate at={syncedAt} />
        </span>
      </div>
    </aside>
  )
}

const Skeleton = () => (
  <div className="space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    {[0, 1, 2, 3].map((row) => (
      <div key={row} className="flex animate-pulse gap-4">
        <div className="h-11 w-11 rounded-full bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-slate-100" />
          <div className="h-3 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
)

const AdminRecentActions = () => {
  const { admin, dataReady, sellersRegistry, sellerLoginHistory, subscribeData } = useAuth()
  const [activity, setActivity] = useState(null)
  const [error, setError] = useState('')
  const [syncedAt, setSyncedAt] = useState(Date.now())
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(PAGE_SIZE)
  const now = useNow(15000)

  useEffect(() => {
    if (!admin.id || !dataReady) return undefined
    setError('')
    return subscribeData(
      COL.activity,
      [where('adminId', '==', admin.id), orderBy('at', 'desc'), limit(FEED_LIMIT)],
      (rows) => {
        setActivity(rows)
        setSyncedAt(Date.now())
      },
      (failure) => setError(failure?.code === 'failed-precondition' ? 'The activity index is missing. Deploy firestore.indexes.json and try again.' : failure?.message || 'Could not load activity.')
    )
  }, [admin.id, dataReady])

  // A seller signing in updates the login history, which is what makes "last Ns ago" tick over too.
  useEffect(() => setSyncedAt(Date.now()), [sellerLoginHistory])

  useEffect(() => setShown(PAGE_SIZE), [category, query])

  const events = useMemo(
    () => buildFeed({ activity: activity || [], logins: sellerLoginHistory, shops: sellersRegistry, now }),
    [activity, sellerLoginHistory, sellersRegistry, now]
  )
  const counts = useMemo(() => countByCategory(events), [events])
  const visible = useMemo(() => filterFeed(events, { category, query }), [events, category, query])
  const groups = useMemo(() => groupByDay(visible.slice(0, shown), now), [visible, shown, now])
  const summary = useMemo(() => summarize(events, now), [events, now])
  const loading = activity === null && !error

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30">
            <Icon name="pulse" className="h-6 w-6" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-3xl font-black leading-tight text-slate-900">Recent Actions</h1>
            <p className="text-[15px] text-slate-500">Live timeline of your sellers&apos; activity — logins, registrations, products, payouts, and balance changes.</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${error ? 'border-rose-100 bg-rose-50 text-rose-600' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          <span className="relative flex h-2 w-2">
            {!error && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          </span>
          {error ? 'Offline' : 'Live'}
        </span>
      </div>

      <label className="relative mt-6 block">
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon name="search" className="h-5 w-5" />
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search seller, email, or action..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-14 pr-5 text-[17px] text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {CATEGORIES.map((item) => {
          const active = category === item.id
          const tone = TONES[item.tone]
          const look = item.id === 'all' ? (active ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600') : active ? tone.active : tone.pill
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${look}`}
            >
              {item.label}
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/25' : item.id === 'all' ? 'bg-slate-100' : 'bg-white/70'}`}>{counts[item.id] || 0}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">{error}</div>}
          {loading && <Skeleton />}
          {!loading &&
            groups.map((group) => (
              <section key={group.label}>
                <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">{group.label}</h2>
                <ul className="rounded-3xl border border-slate-100 bg-white py-2 shadow-sm">
                  {group.events.map((event, index) => (
                    <EventRow key={event.key} event={event} now={now} last={index === group.events.length - 1} />
                  ))}
                </ul>
              </section>
            ))}
          {!loading && !visible.length && (
            <div className="flex flex-col items-center rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
              <Icon name="pulse" className="h-10 w-10 text-slate-300" />
              <p className="mt-3 font-medium text-slate-500">{events.length ? 'No actions match your filters.' : 'No activity yet. What your sellers do will show up here as it happens.'}</p>
            </div>
          )}
          {visible.length > shown && (
            <button
              type="button"
              onClick={() => setShown((count) => count + PAGE_SIZE)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Show more ({visible.length - shown} older)
            </button>
          )}
        </div>
        <SummaryPanel summary={summary} syncedAt={syncedAt} now={now} />
      </div>
    </div>
  )
}

export default AdminRecentActions
