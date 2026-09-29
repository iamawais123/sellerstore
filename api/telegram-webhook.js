// Where Telegram delivers what people send the bot (`/start <code>` when someone connects, `/stop`).
// Register it once with `node scripts/set-telegram-webhook.mjs <https://your-domain>`; Telegram then
// includes TELEGRAM_WEBHOOK_SECRET in a header, which is how this knows the call is really Telegram's.
import { timingSafeEqual } from 'node:crypto'
import { adminServices } from './_lib/firebase.js'
import { handleUpdate } from './_lib/link.js'
import { HttpError, readBody, requireSetting, route } from './_lib/http.js'
import { sendMessage } from './_lib/telegram.js'

const sameSecret = (given, expected) => {
  const a = Buffer.from(String(given || ''))
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default route(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'POST only.')
  if (!sameSecret(req.headers['x-telegram-bot-api-secret-token'], requireSetting('TELEGRAM_WEBHOOK_SECRET'))) throw new HttpError(401, 'Not Telegram.')

  try {
    await handleUpdate({ db: adminServices().db, update: readBody(req), send: sendMessage })
  } catch (error) {
    // Answered 200 regardless: a failing update that Telegram keeps re-sending would only pile up.
    console.error('telegram update failed:', error?.message || error)
  }
  res.status(200).json({ success: true })
})
