// What the admin's support inbox makes of a seller: are they online, when were they last seen, where are
// they, and how a thread reads (day separators, which of the admin's messages the seller has read).
// Pure logic (no Firebase, no React): runs without the emulator.

// The seller app beats every 2 minutes while it is open, so a quiet 5 minutes means they have gone.
export const ONLINE_WINDOW = 5 * 60 * 1000

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const clock = (date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

// 17 Sept 2026
export const dayHeading = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const isOnline = (shop, now = Date.now()) => {
  const at = Date.parse(shop?.lastActiveAt || '')
  return !Number.isNaN(at) && now - at < ONLINE_WINDOW
}

// "15:01" today, "Yesterday 15:01", "17 Sept 15:01" further back (and the year once it is another one).
export function lastSeenLabel(shop, now = Date.now()) {
  const date = new Date(shop?.lastActiveAt || '')
  if (Number.isNaN(date.getTime())) return 'Never'
  const today = new Date(now)
  if (sameDay(date, today)) return clock(date)
  const yesterday = new Date(now)
  yesterday.setDate(today.getDate() - 1)
  if (sameDay(date, yesterday)) return `Yesterday ${clock(date)}`
  const day = date.toLocaleDateString('en-GB', date.getFullYear() === today.getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })
  return `${day} ${clock(date)}`
}

// "Online" or "Last seen 15:01".
export const presenceText = (shop, now = Date.now()) => (isOnline(shop, now) ? 'Online' : `Last seen ${lastSeenLabel(shop, now)}`)

const REAL_LOGIN = (entry) => entry && entry.ip !== 'Admin impersonation' && entry.device !== 'Admin Panel'

// Where a seller is and what they are on: what their open storefront last reported (`lastLocation`,
// `lastIp`, `lastDevice`, stamped `locationAt`), or — when that is older, or they have not reported yet —
// their latest real sign-in. `logins` are the seller's login-history rows in any order.
export function resolvePresence(shop = {}, logins = []) {
  const latest = logins.filter(REAL_LOGIN).reduce((best, entry) => (!best || String(entry.at) > String(best.at) ? entry : best), null)
  const reported = shop.lastLocation || shop.lastIp || shop.lastDevice ? { location: shop.lastLocation, ip: shop.lastIp, device: shop.lastDevice, at: shop.locationAt } : null
  const fromLogin = latest ? { location: latest.location, ip: latest.ip, device: latest.device, at: latest.at } : null
  const newest = reported && (!fromLogin || String(reported.at || '') >= String(fromLogin.at || '')) ? reported : fromLogin || reported
  const other = newest === reported ? fromLogin : reported
  // The newest report may lack a piece (a sign-in whose place lookup failed): borrow it from the other source.
  return {
    location: newest?.location || other?.location || '',
    ip: newest?.ip || other?.ip || '',
    device: newest?.device || other?.device || '',
    at: newest?.at || '',
  }
}

// Marks each of the admin's messages as read or not. The seller's unread counter counts the admin's
// newest messages, so that many admin messages from the end are unread and everything before is read.
export function withReadState(messages = [], unreadForSeller = 0) {
  let remaining = Math.max(0, unreadForSeller || 0)
  const read = new Set()
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].sender !== 'admin') continue
    if (remaining > 0) remaining -= 1
    else read.add(messages[index].id)
  }
  return messages.map((message) => ({ ...message, read: message.sender === 'admin' ? read.has(message.id) : true }))
}

// The thread as a flat list: a `day` item whenever the date changes, then each `message`.
export function threadItems(messages = [], unreadForSeller = 0) {
  const items = []
  let lastDay = null
  withReadState(messages, unreadForSeller).forEach((message) => {
    const date = new Date(message.at)
    if (!Number.isNaN(date.getTime()) && (!lastDay || !sameDay(lastDay, date))) {
      items.push({ type: 'day', key: `day:${message.id}`, label: dayHeading(message.at) })
      lastDay = date
    }
    items.push({ type: 'message', key: message.id, message })
  })
  return items
}

// The conversations for one tab, filtered by what the admin typed (shop, name, email, place).
export function filterConversations(conversations, { tab, term = '', location = () => '' }) {
  const needle = term.trim().toLowerCase()
  return conversations
    .filter((item) => item.status === tab)
    .filter((item) => !needle || [item.seller.shopName, item.seller.fullName, item.seller.email, location(item)].join(' ').toLowerCase().includes(needle))
}

const TONES = [
  'from-amber-200 to-orange-300 text-orange-900',
  'from-emerald-200 to-teal-300 text-emerald-900',
  'from-sky-200 to-blue-300 text-blue-900',
  'from-violet-200 to-purple-300 text-purple-900',
  'from-rose-200 to-pink-300 text-rose-900',
  'from-lime-200 to-green-300 text-green-900',
]

// The same seller always gets the same soft colour.
export const avatarTone = (seed) => TONES[[...String(seed || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TONES.length]

// "dc4bf23f…": enough of the conversation's seller id to quote in a bug report.
export const shortThreadId = (conversationId) => {
  const id = String(conversationId || '').replace(/^support-/, '')
  return id.length > 8 ? `${id.slice(0, 8)}…` : id
}
