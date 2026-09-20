// Turns the raw Firestore records behind "Recent Actions" and "My Logs" into the lines those pages show.
// Pure functions only (no React, no Firebase) so the rules for what reads as what are easy to test.

// ---- formatting ---------------------------------------------------------------------------------

const cents = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0)

export const money = (value) => `$${Math.abs(cents(value)).toFixed(2)}`

// "+$1000.00" / "$-40.00": the sign convention of the balance lines in the feed.
export const signedMoney = (value) => (cents(value) < 0 ? `$-${Math.abs(cents(value)).toFixed(2)}` : `+$${cents(value).toFixed(2)}`)

// Catalogue names were scraped as HTML ("Desks &amp; Shelves", "62&quot; Crate"); show them as text.
export const decodeEntities = (text) =>
  String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')

export function relativeTime(iso, now = Date.now()) {
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return ''
  const seconds = Math.max(0, Math.floor((now - at) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// "17 Sept 2026, 15:17"
export function logTime(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

export function dayLabel(iso, now = Date.now()) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Earlier'
  const diff = Math.round((dayStart(new Date(now)) - dayStart(date)) / 86400000)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

export const isToday = (iso, now = Date.now()) => dayLabel(iso, now) === 'Today'

// "Desktop • Windows • Chrome" reads as "Desktop · Windows · Chrome" in My Logs.
export const dotted = (device) => String(device || '').replace(/\s*•\s*/g, ' · ')

// ---- Recent Actions -----------------------------------------------------------------------------

// Every event belongs to exactly one of these, so the counts on the pills add up to "All".
export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'signin', label: 'Seller Logins', tone: 'emerald' },
  { id: 'signup', label: 'Registrations', tone: 'sky' },
  { id: 'product', label: 'Products', tone: 'violet' },
  { id: 'payout', label: 'Payout Methods', tone: 'amber' },
  { id: 'withdrawal_requested', label: 'Withdrawals Requested', tone: 'orange' },
  { id: 'withdrawal_approved', label: 'Withdrawals Approved', tone: 'green' },
  { id: 'withdrawal_rejected', label: 'Withdrawals Rejected', tone: 'rose' },
  { id: 'deposit', label: 'Deposits', tone: 'teal' },
  { id: 'balance', label: 'Balance Changes', tone: 'indigo' },
]

// The four buckets of the "Today's Action Breakdown" panel.
const SUMMARY_OF = {
  signin: 'logins',
  product: 'products',
  payout: 'financial',
  withdrawal_requested: 'financial',
  withdrawal_approved: 'financial',
  withdrawal_rejected: 'financial',
  deposit: 'financial',
  balance: 'financial',
}

export const SUMMARY_ROWS = [
  { id: 'logins', label: 'Logins', tone: 'emerald' },
  { id: 'products', label: 'Product changes', tone: 'violet' },
  { id: 'financial', label: 'Financial', tone: 'teal' },
  { id: 'other', label: 'Other', tone: 'slate' },
]

const withMethod = (text, method) => (method ? `${text} — ${method}` : text)

// One stored activity line can describe several things at once (a withdrawal request also holds funds;
// "3 products added" is three products), so it fans out into the events the feed lists.
export function eventsFromActivity(row, seller) {
  const meta = row.meta || {}
  const amount = row.amount
  const base = { at: row.at, sellerId: row.sellerId || '', source: `a:${row.id}` }
  const out = []
  const push = (event) => out.push({ ...base, ...event, key: `${base.source}:${out.length}` })

  switch (row.type) {
    case 'seller_signup':
      push({
        category: 'signup',
        text: `New seller registered — ${meta.email || seller?.email || row.entity || ''}`.replace(/ — $/, ''),
        location: meta.location,
        detail: [meta.device, meta.ip].filter(Boolean).join(' — '),
      })
      break
    case 'seller_products_added':
      if (Array.isArray(meta.items) && meta.items.length) {
        meta.items.forEach((item) => push({ category: 'product', text: 'Added a product', product: item }))
      } else {
        push({ category: 'product', text: row.title || 'Products added' })
      }
      break
    case 'seller_product_removed':
      push({ category: 'product', text: 'Removed a product', product: meta.items?.[0] })
      break
    case 'payout_method_added':
      push({ category: 'payout', text: withMethod('Added a payout method', meta.method) })
      break
    case 'withdrawal_requested':
    case 'withdrawal_initiated':
      push({
        category: 'withdrawal_requested',
        text: withMethod(`${row.type === 'withdrawal_initiated' ? 'Withdrawal filed by admin' : 'Requested a withdrawal'} — ${money(amount)}`, meta.method),
      })
      push({ category: 'balance', text: `Withdrawal requested — funds held — ${signedMoney(-cents(amount))} (shop_balance)` })
      break
    case 'withdrawal_approved':
      push({ category: 'withdrawal_approved', text: withMethod(`Withdrawal approved — ${money(amount)}`, meta.method) })
      push({ category: 'balance', text: 'Withdrawal approved — paid out — +$0.00 (shop_balance)' })
      break
    case 'withdrawal_rejected':
      push({ category: 'withdrawal_rejected', text: withMethod(`Withdrawal rejected — ${money(amount)}`, meta.method) })
      push({ category: 'balance', text: `Withdrawal rejected — funds returned — ${signedMoney(cents(amount))} (shop_balance)` })
      break
    case 'order_paid':
      push({ category: 'balance', text: amount != null ? `Paid to process order — ${signedMoney(-cents(amount))} (shop_balance)` : 'Paid to process order' })
      break
    case 'seller_balance_add':
      push({ category: 'deposit', text: `Deposited to seller balance — ${signedMoney(cents(amount))} (shop_balance)` })
      break
    case 'seller_balance_deduct':
      push({ category: 'balance', text: `Deducted from seller balance — ${signedMoney(-cents(amount))} (shop_balance)` })
      break
    case 'order_status_changed':
      if (meta.credited) push({ category: 'balance', text: `Order delivered — profit credited — ${signedMoney(cents(amount))} (shop_balance)` })
      else push({ category: 'other', text: row.title })
      break
    case 'seller_impersonate':
      push({ category: 'signin', text: row.title || 'Admin logged in as seller' })
      break
    default:
      // A line without a seller is the admin's own (an invite code change): say what it was about.
      push({ category: 'other', text: !row.sellerId && row.entity ? `${row.title} — ${row.entity}` : row.title || 'Activity' })
  }
  return out
}

// A seller signing in (login history rows written by the storefront). "Log in as seller" sessions are
// recorded as activity lines already, so they are not listed twice.
export function eventFromLogin(row) {
  if (row.ip === 'Admin impersonation' || row.device === 'Admin Panel') return null
  return {
    key: `l:${row.id}`,
    source: `l:${row.id}`,
    at: row.at,
    sellerId: row.sellerId || '',
    category: 'signin',
    text: row.location ? `Seller signed in — ${row.location}` : 'Seller signed in',
    detail: [row.device, row.ip].filter(Boolean).join(' — '),
  }
}

const isOnline = (shop, now) => {
  const at = Date.parse(shop?.lastActiveAt || '')
  return !Number.isNaN(at) && now - at < 5 * 60 * 1000
}

// `shops` are the admin's sellers; a line about a seller carries their name, email and whether they are online.
export function buildFeed({ activity = [], logins = [], shops = [], now = Date.now() }) {
  const byId = new Map(shops.map((shop) => [shop.id, shop]))
  const events = []
  activity.forEach((row) => events.push(...eventsFromActivity(row, byId.get(row.sellerId))))
  logins.forEach((row) => {
    const event = eventFromLogin(row)
    if (event) events.push(event)
  })
  return events
    .map((event) => {
      const shop = byId.get(event.sellerId)
      return {
        ...event,
        time: Date.parse(event.at) || 0,
        name: shop ? shop.fullName || shop.shopName : event.sellerId ? 'Seller' : 'You',
        email: shop?.email || '',
        online: shop ? isOnline(shop, now) : false,
      }
    })
    .sort((a, b) => b.time - a.time)
}

export const countByCategory = (events) => {
  const counts = { all: events.length }
  CATEGORIES.forEach((category) => {
    if (category.id !== 'all') counts[category.id] = 0
  })
  events.forEach((event) => {
    counts[event.category] = (counts[event.category] || 0) + 1
  })
  return counts
}

export function filterFeed(events, { category = 'all', query = '' } = {}) {
  const needle = query.trim().toLowerCase()
  return events.filter((event) => {
    if (category !== 'all' && event.category !== category) return false
    if (!needle) return true
    const haystack = [event.name, event.email, event.text, event.location, event.detail, event.product?.name, dayLabel(event.at)].join(' ').toLowerCase()
    return haystack.includes(needle)
  })
}

// Today's breakdown for the side panel: totals per bucket and events per hour of the day.
export function summarize(events, now = Date.now()) {
  const today = events.filter((event) => isToday(event.at, now))
  const counts = { logins: 0, products: 0, financial: 0, other: 0 }
  const hours = Array.from({ length: 24 }, () => 0)
  today.forEach((event) => {
    counts[SUMMARY_OF[event.category] || 'other'] += 1
    hours[new Date(event.time).getHours()] += 1
  })
  return { total: today.length, counts, hours, peak: Math.max(0, ...hours) }
}

// Newest first, in the day groups the page shows.
export function groupByDay(events, now = Date.now()) {
  const groups = []
  events.forEach((event) => {
    const label = dayLabel(event.at, now)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.events.push(event)
    else groups.push({ label, events: [event] })
  })
  return groups
}

// ---- My Logs -------------------------------------------------------------------------------------

export const LOG_TABS = [
  { id: 'all', label: 'All' },
  { id: 'login', label: 'Logins' },
  { id: 'action', label: 'Actions' },
  { id: 'balance', label: 'Balance' },
]

// `via` is "Admin console" for the admin's own sign-ins; anything else names who signed in as them.
const signedInBy = (via) => (via && via !== 'Admin console' ? via : '')

export function loginRow(entry, { labels = {}, thisDevice = '', deviceKeyOf }) {
  const key = deviceKeyOf(entry)
  const by = signedInBy(entry.via)
  return {
    key: `login:${entry.id}`,
    id: entry.id,
    kind: 'login',
    at: entry.at,
    time: Date.parse(entry.at) || 0,
    title: by ? `Signed in by ${by.replace(/^Super admin:\s*/i, 'super admin ')}` : 'Signed in',
    subtitle: '',
    location: entry.location || '',
    ip: entry.ip || '',
    device: dotted(entry.device),
    deviceKey: key,
    deviceLabel: labels[key] || '',
    // A sign-in made by someone else has no device of yours to name.
    nameable: !by,
    thisDevice: !!(thisDevice && entry.deviceId && entry.deviceId === thisDevice),
    needsLocation: !entry.location && !by,
    collection: 'adminLoginHistory',
  }
}

// What the admin did, worded the way My Logs words it (the activity feed words it from the seller's side).
export function actionRow(row) {
  const amount = row.amount
  const base = { key: `action:${row.id}`, id: row.id, at: row.at, time: Date.parse(row.at) || 0, location: '', ip: '', device: '' }
  switch (row.type) {
    case 'withdrawal_approved':
      return { ...base, kind: 'action', title: 'Approved a withdrawal', subtitle: money(amount) }
    case 'withdrawal_rejected':
      return { ...base, kind: 'action', title: 'Rejected a withdrawal', subtitle: money(amount) }
    case 'withdrawal_initiated':
      return { ...base, kind: 'action', title: 'Filed a withdrawal for a seller', subtitle: [money(amount), row.entity].filter(Boolean).join(' — ') }
    case 'seller_balance_add':
      return { ...base, kind: 'balance', tone: 'up', title: 'Deposited to seller balance', badge: `+${money(amount)}`, subtitle: `+${money(amount)} (shop_balance) — Admin adjustment` }
    case 'seller_balance_deduct':
      return { ...base, kind: 'balance', tone: 'down', title: 'Deducted from seller balance', badge: `-${money(amount)}`, subtitle: `-${money(amount)} (shop_balance) — Admin adjustment` }
    case 'seller_guarantee_add':
      return { ...base, kind: 'balance', tone: 'up', title: 'Added to seller guarantee', badge: `+${money(amount)}`, subtitle: `+${money(amount)} (guarantee) — Admin adjustment` }
    case 'seller_guarantee_deduct':
      return { ...base, kind: 'balance', tone: 'down', title: 'Deducted from seller guarantee', badge: `-${money(amount)}`, subtitle: `-${money(amount)} (guarantee) — Admin adjustment` }
    default:
      return { ...base, kind: 'action', title: row.title || 'Activity', subtitle: row.entity || '' }
  }
}

export function buildMyLogs({ logins = [], actions = [], labels = {}, thisDevice = '', deviceKeyOf }) {
  return [...logins.map((entry) => loginRow(entry, { labels, thisDevice, deviceKeyOf })), ...actions.map(actionRow)].sort((a, b) => b.time - a.time)
}

export function filterMyLogs(rows, { tab = 'all', query = '' } = {}) {
  const needle = query.trim().toLowerCase()
  return rows.filter((row) => {
    if (tab !== 'all' && row.kind !== tab) return false
    if (!needle) return true
    return [row.title, row.subtitle, row.badge, row.location, row.ip, row.device, row.deviceLabel, logTime(row.at)].join(' ').toLowerCase().includes(needle)
  })
}

export const countMyLogs = (rows) => ({
  all: rows.length,
  login: rows.filter((row) => row.kind === 'login').length,
  action: rows.filter((row) => row.kind === 'action').length,
  balance: rows.filter((row) => row.kind === 'balance').length,
})
