// Connecting an admin to a Telegram chat, and what the bot answers when someone talks to it.
//
//   telegramLinks/{code}      a one-time code the dashboard asks for. Only the relay touches it (the
//                             security rules give browsers no access): 15 minutes, used once.
//   adminTelegram/{adminId}   the link itself, written when the code comes back through the bot.
import { randomBytes } from 'node:crypto'
import { DEFAULT_PREFS, prefsOf, startCursors } from './sync.js'

export const LINK_TTL_MS = 15 * 60 * 1000

const iso = (ms) => new Date(ms).toISOString()

// The code goes into a t.me link (`?start=<code>`), so it sticks to the characters Telegram allows there.
export async function createLinkCode({ db, adminId, now = Date.now }) {
  const code = randomBytes(18).toString('base64url')
  await db.collection('telegramLinks').doc(code).set({ adminId, createdAt: iso(now()), expiresAt: iso(now() + LINK_TTL_MS) })
  return { code, expiresAt: iso(now() + LINK_TTL_MS) }
}

const chatName = (chat) =>
  chat.type === 'private' ? [chat.first_name, chat.last_name].filter(Boolean).join(' ') || (chat.username ? `@${chat.username}` : 'Telegram') : chat.title || 'Telegram group'

// Spends a code and links its admin to `chat`. Returns the admin's id, or null for an unknown, used or expired code.
export async function consumeLinkCode({ db, code, chat, now = Date.now }) {
  const linkRef = db.collection('telegramLinks').doc(code)
  const peek = await linkRef.get()
  if (!peek.exists) return null
  const { adminId, expiresAt } = peek.data()
  if (!adminId || String(expiresAt) < iso(now())) {
    await linkRef.delete().catch(() => {})
    return null
  }

  const ref = db.collection('adminTelegram').doc(adminId)
  const existing = await ref.get()
  const prefs = existing.exists ? prefsOf(existing.data()) : { ...DEFAULT_PREFS }
  const { cursor, seen } = await startCursors(db, adminId, prefs, iso(now()))

  return db.runTransaction(async (tx) => {
    // A racing call may have spent it since we looked.
    if (!(await tx.get(linkRef)).exists) return null
    tx.delete(linkRef)
    tx.set(ref, {
      adminId,
      chatId: chat.id,
      chatType: chat.type,
      chatName: chatName(chat),
      enabled: true,
      prefs,
      cursor,
      sent: seen,
      linkedAt: iso(now()),
      lastError: null,
      lastErrorAt: null,
    })
    return adminId
  })
}

export async function disconnectAdmin({ db, adminId }) {
  const ref = db.collection('adminTelegram').doc(adminId)
  const snap = await ref.get()
  if (!snap.exists) return null
  await ref.delete()
  return snap.data()
}

const HELP =
  'Hi! I send you a message here whenever a seller writes to you in support chat.\n\nOpen <b>Telegram Alerts</b> in your admin dashboard and press <b>Connect Telegram</b> to link this chat.'

// One Telegram update (a message someone sent the bot). Never throws for a message it does not understand.
export async function handleUpdate({ db, update, send, now = Date.now }) {
  const message = update?.message
  const text = typeof message?.text === 'string' ? message.text.trim() : ''
  if (!message?.chat || !text.startsWith('/')) return

  const [command, code] = text.split(/\s+/)
  const name = command.split('@')[0].toLowerCase()
  const chat = message.chat

  if (name === '/start' && code) {
    const adminId = await consumeLinkCode({ db, code, chat, now })
    return send(
      chat.id,
      adminId
        ? '✅ <b>Connected.</b>\nYou will get a message here whenever a seller writes to you in support chat. You can pause or disconnect on the Telegram Alerts page.'
        : 'This link has expired or was already used. Open <b>Telegram Alerts</b> in your admin dashboard and press <b>Connect Telegram</b> again.'
    )
  }
  if (name === '/start') return send(chat.id, HELP)

  if (name === '/stop') {
    // Only in a private chat: anybody in a group could otherwise switch the admin's alerts off.
    if (chat.type !== 'private') return send(chat.id, 'To disconnect this chat, use the Telegram Alerts page in your admin dashboard.')
    const found = await db.collection('adminTelegram').where('chatId', '==', chat.id).get()
    await Promise.all(found.docs.map((doc) => doc.ref.delete()))
    return send(chat.id, found.empty ? 'Nothing is connected to this chat.' : '🔕 Disconnected. You will not get support message alerts here any more.')
  }
}
