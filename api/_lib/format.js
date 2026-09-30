// What a Telegram alert looks like. Pure functions: a Firestore record in, Telegram HTML out.
// Sellers type their own names and messages, so every dynamic piece is escaped before it is sent.
// The only alert there is is a seller's support message (see sync.js).

export const escapeHtml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const has = (value) => value !== undefined && value !== null && value !== ''

// A message from a seller in support chat (the bell in the dashboard).
export function renderSupport(row) {
  return { emoji: '💬', title: row.title || 'New support message', lines: has(row.message) ? [['', row.message]] : [] }
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

export const TEST_MESSAGE = '✅ <b>Telegram alerts are on</b>\nThis is a test. A message a seller writes to you in support chat will show up here.'
