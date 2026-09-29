// The Telegram relay the apps talk to (POST /api/telegram, JSON body `{ action }`, header
// `Authorization: Bearer <Firebase ID token>`). Runs on Vercel, so it costs nothing and needs no
// Blaze plan; the bot token and the service-account key stay in its environment variables.
//
//   sync        a seller just did something: send their admin's Telegram whatever is new
//   link        an admin asks for the link that connects their Telegram
//   test        an admin sends themselves a test message
//   disconnect  an admin unlinks their Telegram
//
// Everything sent is read from Firestore here, never taken from the request, so a caller cannot make
// the bot say anything: the worst a made-up `sync` can do is deliver real news a little early.
import { runAction } from './_lib/actions.js'
import { adminServices } from './_lib/firebase.js'
import { HttpError, readBody, route, setting } from './_lib/http.js'
import { getBotUsername, sendMessage } from './_lib/telegram.js'

// The signed-in caller and their profile, or a refusal.
async function whoIsAsking(req, { auth, db }) {
  const header = String(req.headers.authorization || '')
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw new HttpError(401, 'Sign in first.')
  let uid
  try {
    uid = (await auth.verifyIdToken(token)).uid
  } catch (_) {
    throw new HttpError(401, 'Your session has expired. Sign in again.')
  }
  const snap = await db.collection('users').doc(uid).get()
  const profile = snap.exists ? snap.data() : null
  if (!profile || profile.removed === true) throw new HttpError(403, 'This account has no access.')
  return { uid, profile }
}

export default route(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'POST only.')
  const services = adminServices()
  const caller = await whoIsAsking(req, services)
  const result = await runAction(readBody(req).action, caller, {
    db: services.db,
    send: sendMessage,
    botUsername: getBotUsername,
    dashboardUrl: setting('ADMIN_DASHBOARD_URL'),
  })
  res.status(200).json({ success: true, ...result })
})
