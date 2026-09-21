// What the Schedules window makes of the stored scheduled orders: which are still upcoming and which are
// history, how far away one is, and the date/time inputs. Pure logic (no Firebase, no React).

const time = (date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

// "Mon, 21 Sept · 15:30" (and the year once it is another one).
export function whenLabel(iso, now = Date.now()) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  const day = date.toLocaleDateString('en-GB', sameYear ? { weekday: 'short', day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  return `${day} · ${time(date)}`
}

// "in 12m", "in 2h 10m", "in 3d 4h", or "Due now" once the time has come.
export function countdown(iso, now = Date.now()) {
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return { text: '', due: false }
  const minutes = Math.ceil((at - now) / 60000)
  if (at - now <= 0) return { text: 'Due now', due: true }
  if (minutes < 60) return { text: `in ${Math.max(1, minutes)}m`, due: false }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return { text: `in ${hours}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`, due: false }
  const days = Math.floor(hours / 24)
  return { text: `in ${days}d${hours % 24 ? ` ${hours % 24}h` : ''}`, due: false }
}

// Upcoming: still waiting, soonest first. History: everything that ended, latest first.
export function splitSchedules(list = []) {
  const upcoming = list.filter((item) => item.status === 'Scheduled').sort((a, b) => String(a.scheduledFor).localeCompare(String(b.scheduledFor)))
  const history = list.filter((item) => item.status !== 'Scheduled').sort((a, b) => String(b.closedAt || b.scheduledFor).localeCompare(String(a.closedAt || a.scheduledFor)))
  return { upcoming, history }
}

// Search (customer, seller, shop, product) and, in History, a status filter.
export function filterSchedules(list = [], { term = '', status = 'All' } = {}) {
  const needle = term.trim().toLowerCase()
  return list.filter((item) => {
    if (status !== 'All' && item.status !== status) return false
    if (!needle) return true
    return [item.customer?.fullName, item.sellerName, item.shopName, item.customer?.city, ...(item.items || []).map((entry) => entry.name)].join(' ').toLowerCase().includes(needle)
  })
}

// Schedules that have come due and are still waiting, oldest first.
export const dueSchedules = (list = [], now = Date.now()) =>
  list.filter((item) => item.status === 'Scheduled' && Date.parse(item.scheduledFor) <= now).sort((a, b) => String(a.scheduledFor).localeCompare(String(b.scheduledFor)))

// A <input type="datetime-local"> works in local time without a zone: "2026-09-21T15:30".
const pad = (value) => String(value).padStart(2, '0')
export const toLocalInput = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
export const fromLocalInput = (value) => {
  const date = new Date(value)
  return !value || Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

// One-tap choices for "when": [{ label, value }] with `value` as a datetime-local string.
export function quickTimes(now = Date.now()) {
  const at = (offsetMs) => toLocalInput(new Date(now + offsetMs).toISOString())
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  return [
    { label: 'In 1 hour', value: at(3600e3) },
    { label: 'In 3 hours', value: at(3 * 3600e3) },
    { label: 'Tomorrow 09:00', value: toLocalInput(tomorrow.toISOString()) },
    { label: 'In 3 days', value: at(3 * 86400e3) },
  ]
}
