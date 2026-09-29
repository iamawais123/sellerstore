// What a Telegram alert looks like. Pure functions: a Firestore record in, Telegram HTML out.
// Sellers type their own names and messages, so every dynamic piece is escaped before it is sent.

export const escapeHtml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const money = (value) => `$${Number(value).toFixed(2)}`
const has = (value) => value !== undefined && value !== null && value !== ''

const ACTIVITY_EMOJI = {
  seller_signup: '🆕',
  kyc_submitted: '🪪',
  order_paid: '💳',
  withdrawal_requested: '💸',
  payout_method_added: '🏦',
  seller_products_added: '📦',
  seller_product_removed: '🗑️',
  seller_products_cleared: '🗑️',
}

const productNames = (items) =>
  items
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .filter(Boolean)
    .slice(0, 3)
    .join(', ')

// Something a seller did: "New seller registered", "Seller requested withdrawal", ...
export function renderActivity(row) {
  const meta = row.meta && typeof row.meta === 'object' ? row.meta : {}
  const lines = []
  if (has(row.entity)) lines.push(['👤', row.entity])
  if (has(row.amount) && Number.isFinite(Number(row.amount))) lines.push(['💵', money(row.amount)])
  if (has(meta.method)) lines.push(['🏦', meta.method])
  if (Array.isArray(meta.items) && meta.items.length) {
    const names = productNames(meta.items)
    lines.push(['📦', `${meta.items.length} product${meta.items.length === 1 ? '' : 's'}${names ? `: ${names}` : ''}`])
  }
  if (has(meta.email)) lines.push(['✉️', meta.email])
  if (has(meta.location)) lines.push(['📍', meta.location])
  if (has(meta.device)) lines.push(['📱', meta.device])
  return { emoji: ACTIVITY_EMOJI[row.type] || '🔔', title: row.title || 'New activity', lines }
}

// A message from a seller in support chat (the bell in the dashboard).
export function renderSupport(row) {
  return { emoji: '💬', title: row.title || 'New support message', lines: has(row.message) ? [['', row.message]] : [] }
}

// A seller signing in. `name` is the shop's owner or shop, looked up by the caller.
export function renderLogin(row, name) {
  const lines = []
  if (has(name)) lines.push(['👤', name])
  if (has(row.location)) lines.push(['📍', row.location])
  if (has(row.device)) lines.push(['📱', row.device])
  return { emoji: '🔑', title: 'Seller signed in', lines }
}

const block = ({ emoji, title, lines }) =>
  [`${emoji} <b>${escapeHtml(title)}</b>`, ...lines.map(([icon, text]) => `${icon ? `${icon} ` : ''}${escapeHtml(text)}`)].join('\n')

const MAX_MESSAGE = 3900 // Telegram allows 4096 characters

// One alert reads as itself; several read as a digest, split into as many messages as they need.
// `dashboardUrl`, when set, adds an "Open dashboard" link to the last message.
export function composeMessages(items, { dashboardUrl = '' } = {}) {
  if (!items.length) return []
  const blocks = items.map(block)
  const heading = items.length > 1 ? `🔔 <b>${items.length} new notifications</b>` : ''
  const footer = dashboardUrl ? `<a href="${escapeHtml(dashboardUrl)}">Open dashboard</a>` : ''

  const messages = []
  let current = heading
  for (const part of blocks) {
    const clipped = part.length > MAX_MESSAGE ? `${part.slice(0, MAX_MESSAGE - 1)}…` : part
    if (current && current.length + clipped.length + 2 > MAX_MESSAGE) {
      messages.push(current)
      current = ''
    }
    current = current ? `${current}\n\n${clipped}` : clipped
  }
  if (current) messages.push(current)
  if (footer) messages[messages.length - 1] += `\n\n${footer}`
  return messages
}

export const TEST_MESSAGE = '✅ <b>Telegram alerts are on</b>\nThis is a test. New activity from your sellers will show up here.'
