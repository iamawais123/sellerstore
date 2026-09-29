// Turns what happened in an admin's network into Telegram messages, once each.
//
// There is no server to react to Firestore writes (free Spark plan), so the apps tell the relay
// "something may have happened" after a seller acts (see flushTelegramSync in shopData.js) and this
// looks for what is new:
//
//   adminTelegram/{adminId}   the admin's link: chat, on/off, which kinds to send, and the bookkeeping
//                             below. The relay writes it; the admin can only change `enabled` / `prefs`.
//   cursor.<kind>             how far into that kind of record we have already looked (ISO time), or
//                             null while the kind is switched off. Switching it on starts from "now": what
//                             is already there is marked as seen (`sent`), never sent as a backlog.
//   sent                      the ids of the last few hundred records already sent. Records are dated by
//                             the seller's own clock, so each look reaches back a little past the cursor
//                             and this list is what stops those from going out twice.
//
// A lost ping is harmless: the next one finds everything after the cursor.
import { composeMessages, renderActivity, renderLogin, renderSupport } from './format.js'
import { sendChatPhoto } from './chatPhoto.js'
import { KYC_TYPES, sendKyc } from './kyc.js'
import { isChatGone, sendStoredFile } from './telegram.js'

export const DEFAULT_PREFS = { activity: true, support: true, logins: false }
export const PREF_KEYS = Object.keys(DEFAULT_PREFS)

const LOOKBACK_MS = 10 * 60 * 1000
const FETCH_LIMIT = 40
const REMEMBER = 300

// What a record brings along besides its alert: a sign-up or KYC resubmission brings the seller's KYC (details and
// identity documents), a support message may bring the photo the seller attached. Each is sent, retried and
// remembered on its own (its own id in the list of sent ids), so a failure never repeats the alert.
const EXTRAS = {
  activity: (row) => (KYC_TYPES.has(row.type) ? 'kyc' : null),
  support: () => 'photo',
}
const extraOf = (source, row) => EXTRAS[source.key]?.(row) || null

// The ids one record is remembered by.
const idsOf = (source, id, row) => [`${source.key}:${id}`, ...(extraOf(source, row) ? [`${extraOf(source, row)}:${id}`] : [])]

const byAdmin = (collection, adminId) => collection.where('adminId', '==', adminId)

const SOURCES = [
  {
    key: 'activity',
    collection: 'activityLogs',
    time: 'at',
    // What the seller did themselves; what the admin (or a super admin) did is not news to them.
    keep: (row) => !!row.sellerId && row.actorId === row.sellerId,
    query: (collection, adminId, since) => byAdmin(collection, adminId).where('at', '>', since).orderBy('at', 'desc').limit(FETCH_LIMIT),
  },
  {
    key: 'support',
    collection: 'notifications',
    time: 'createdAt',
    keep: (row) => row.type === 'chat',
    query: (collection, adminId, since) =>
      byAdmin(collection, adminId).where('recipient', '==', 'admin').where('createdAt', '>', since).orderBy('createdAt', 'desc').limit(FETCH_LIMIT),
  },
  {
    key: 'logins',
    collection: 'loginHistory',
    time: 'at',
    keep: (row) => row.ip !== 'Admin impersonation',
    query: (collection, adminId, since) => byAdmin(collection, adminId).where('at', '>', since).orderBy('at', 'desc').limit(FETCH_LIMIT),
  },
]

export const prefsOf = (link) => ({ ...DEFAULT_PREFS, ...(link?.prefs || {}) })

const later = (a, b) => (a && b ? (a > b ? a : b) : a || b || null)

const lookbackFrom = (iso) => new Date(Math.max(0, Date.parse(iso) - LOOKBACK_MS)).toISOString()

// The ids of what a kind already holds at the moment it is switched on. Each look reaches a little back
// past its cursor (see the top of the file), so without this the last few minutes of history would go
// out as if new; marked as seen, they never do.
async function alreadyThere(db, source, adminId, nowIso) {
  const found = await source.query(db.collection(source.collection), adminId, lookbackFrom(nowIso)).get()
  return found.docs.flatMap((doc) => idsOf(source, doc.id, doc.data()))
}

// A fresh start for every kind that is switched on: it counts from now, and what is there already is history.
export async function startCursors(db, adminId, prefs, nowIso) {
  const cursor = {}
  const seen = []
  for (const source of SOURCES) {
    cursor[source.key] = null
    if (!prefs[source.key]) continue
    try {
      seen.push(...(await alreadyThere(db, source, adminId, nowIso)))
      cursor[source.key] = nowIso
    } catch (error) {
      // Left unstarted: the first sync after this one starts it.
      console.error(`telegram: could not read ${source.collection}:`, error?.message || error)
    }
  }
  return { cursor, seen }
}

// Looks for records newer than the admin's cursors and sends them. `send(chatId, html)` delivers one message.
export async function syncAdmin({ db, adminId, send, sendFile = sendStoredFile, dashboardUrl = '', now = Date.now }) {
  const ref = db.collection('adminTelegram').doc(adminId)
  const snap = await ref.get()
  if (!snap.exists) return { sent: 0 }
  const link = snap.data()
  if (!link.chatId) return { sent: 0 }

  const nowIso = new Date(now()).toISOString()
  const prefs = prefsOf(link)
  const before = link.cursor || {}
  const after = { ...before }
  const candidates = []
  const seenNow = []

  for (const source of SOURCES) {
    const wanted = link.enabled !== false && prefs[source.key]
    if (!wanted) {
      after[source.key] = null
      continue
    }
    // One kind that cannot be read (say its index is still building) must not silence the others:
    // it is skipped, keeps its cursor, and is tried again on the next look.
    let found
    try {
      if (!before[source.key]) {
        seenNow.push(...(await alreadyThere(db, source, adminId, nowIso)))
        after[source.key] = nowIso
        continue
      }
      found = await source.query(db.collection(source.collection), adminId, lookbackFrom(before[source.key])).get()
    } catch (error) {
      console.error(`telegram: could not read ${source.collection}:`, error?.message || error)
      continue
    }
    let newest = before[source.key]
    for (const doc of found.docs) {
      const row = doc.data()
      const at = String(row[source.time] || '')
      // A clock that runs ahead must not push the cursor into the future and hide what comes next.
      newest = later(newest, at > nowIso ? nowIso : at)
      candidates.push({ id: `${source.key}:${doc.id}`, source, row, at })
      const extra = extraOf(source, row)
      if (extra) candidates.push({ id: `${extra}:${doc.id}`, source, row, at, extra })
    }
    after[source.key] = newest
  }

  // Claim the new records: whoever commits first sends them, a racing call finds them already listed.
  const claimed = await db.runTransaction(async (tx) => {
    const latestSnap = await tx.get(ref)
    if (!latestSnap.exists) return []
    const latest = latestSnap.data()
    const seen = new Set(latest.sent || [])
    const fresh = candidates.filter((item) => item.source.keep(item.row) && !seen.has(item.id))
    const current = Object.fromEntries(PREF_KEYS.map((key) => [key, latest.cursor?.[key] ?? null]))
    const cursor = Object.fromEntries(PREF_KEYS.map((key) => [key, after[key] === null ? null : later(after[key], current[key])]))
    const changes = {}
    if (fresh.length || seenNow.length) changes.sent = [...fresh.map((item) => item.id), ...seenNow, ...(latest.sent || [])].slice(0, REMEMBER)
    if (JSON.stringify(cursor) !== JSON.stringify(current)) changes.cursor = cursor
    if (Object.keys(changes).length) tx.update(ref, changes)
    return fresh
  })
  if (!claimed.length) return { sent: 0 }

  const alerts = claimed.filter((item) => !item.extra).sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
  const packages = claimed.filter((item) => item.extra).sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
  const gone = async () => {
    // Blocked the bot or removed it from the group: stop trying, and tell the admin on the page.
    await ref.update({ enabled: false, lastError: 'Telegram says the bot can no longer message this chat. Connect again to keep getting alerts.', lastErrorAt: nowIso })
    return { sent: 0 }
  }

  // First the short alerts.
  if (alerts.length) {
    const names = await sellerNames(db, alerts.filter((item) => item.source.key === 'logins').map((item) => item.row.sellerId))
    const items = alerts.map(({ source, row }) =>
      source.key === 'activity' ? renderActivity(row) : source.key === 'support' ? renderSupport(row) : renderLogin(row, names.get(row.sellerId))
    )
    try {
      for (const message of composeMessages(items, { dashboardUrl })) await send(link.chatId, message)
    } catch (error) {
      if (isChatGone(error)) return gone()
      await giveBack(db, ref, claimed, before)
      throw error
    }
  }

  // Then what came along: a new seller's KYC, a photo from a chat. One that fails is put back on its own, so the
  // alerts above are never sent twice.
  const failed = []
  let firstError = null
  const done = { kyc: 0, photos: 0 }
  for (const item of packages) {
    try {
      if (item.extra === 'kyc') {
        if (await sendKyc({ db, adminId, sellerId: item.row.sellerId, chatId: link.chatId, send, sendFile, dashboardUrl })) done.kyc += 1
      } else if (await sendChatPhoto({ db, adminId, note: item.row, chatId: link.chatId, sendFile })) {
        done.photos += 1
      }
    } catch (error) {
      if (isChatGone(error)) return gone()
      failed.push(item)
      firstError = firstError || error
    }
  }
  if (failed.length) {
    await giveBack(db, ref, failed, before)
    throw firstError
  }

  if (link.lastError) await ref.update({ lastError: null, lastErrorAt: null })
  return { sent: alerts.length, ...(done.kyc ? { kyc: done.kyc } : {}), ...(done.photos ? { photos: done.photos } : {}) }
}

// A send that failed for a passing reason: put the records back so the next look sends them.
async function giveBack(db, ref, claimed, cursorBefore) {
  const ids = new Set(claimed.map((item) => item.id))
  const kinds = [...new Set(claimed.map((item) => item.source.key))]
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) return
      const data = snap.data()
      tx.update(ref, {
        cursor: { ...(data.cursor || {}), ...Object.fromEntries(kinds.map((key) => [key, cursorBefore[key]])) },
        sent: (data.sent || []).filter((id) => !ids.has(id)),
      })
    })
  } catch (_) {}
}

async function sellerNames(db, sellerIds) {
  const names = new Map()
  const unique = [...new Set(sellerIds.filter(Boolean))]
  const shops = await Promise.all(unique.map((id) => db.collection('shops').doc(id).get()))
  shops.forEach((shop, index) => {
    if (shop.exists) names.set(unique[index], shop.data().fullName || shop.data().shopName || '')
  })
  return names
}
