// What each request to /api/telegram does, once we know who is asking. Kept apart from the HTTP handler
// (api/telegram.js) so the rules about who may do what can be tested without a server.
import { HttpError } from './http.js'
import { TEST_MESSAGE } from './format.js'
import { createLinkCode, disconnectAdmin } from './link.js'
import { syncAdmin } from './sync.js'
import { isChatGone } from './telegram.js'

// `caller` is `{ uid, profile }` of the signed-in person; `deps` are the outside world: the Firestore
// instance, the way to send a Telegram message, and the bot's @name.
export async function runAction(action, caller, { db, send, botUsername, dashboardUrl = '', now = Date.now }) {
  if (action === 'sync') {
    // A seller reports for their admin; an admin for themself. Anyone else has nobody to report for.
    const { role, adminId: sellersAdmin } = caller.profile
    const adminId = role === 'admin' ? caller.uid : role === 'seller' ? sellersAdmin : ''
    if (!adminId) return { sent: 0 }
    return syncAdmin({ db, adminId, send, dashboardUrl, now })
  }

  if (caller.profile.role !== 'admin') throw new HttpError(403, 'Only an admin can manage Telegram alerts.')
  const adminId = caller.uid

  if (action === 'link') {
    const [{ code, expiresAt }, bot] = await Promise.all([createLinkCode({ db, adminId, now }), botUsername()])
    return { url: `https://t.me/${bot}?start=${code}`, groupUrl: `https://t.me/${bot}?startgroup=${code}`, expiresAt }
  }

  if (action === 'test') {
    const link = (await db.collection('adminTelegram').doc(adminId).get()).data()
    if (!link?.chatId) throw new HttpError(409, 'Connect Telegram first.')
    try {
      await send(link.chatId, TEST_MESSAGE)
    } catch (error) {
      if (isChatGone(error)) throw new HttpError(409, 'Telegram says the bot can no longer message this chat. Connect again.')
      throw error
    }
    return {}
  }

  if (action === 'disconnect') {
    const link = await disconnectAdmin({ db, adminId })
    if (link?.chatId) await send(link.chatId, '🔕 Disconnected. You will not get admin dashboard notifications here any more.').catch(() => {})
    return {}
  }

  throw new HttpError(400, 'Unknown action.')
}
