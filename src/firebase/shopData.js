// Shop data in Firestore — sellers' shops (balance, guarantee, KYC, limits, catalogue), orders,
// withdrawals, notifications, payout methods, support chat, ledger, view campaigns and the activity
// feeds — shared by the storefront (seller side), the admin console and the super-admin console.
// Each of the three apps keeps its own copy of this file (they are separate npm projects that only
// share an origin) — keep the copies identical (tests/shopData.sync.test.mjs checks).
//
// Every function takes the Firestore instance (`db`) of whichever identity is acting, so a "log in
// as seller" / "log in as admin" session simply passes the impersonator's own `db` and the
// security rules keep applying to them.
//
// Every mutation returns `{ success: true, ... }` or `{ success: false, error }`; nothing here
// throws to the caller. Anything that moves money runs in a transaction / batch that the rules
// cross-check (see firestore.rules).
import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { fail, memberSinceLabel } from './core.js'

export { limit, orderBy, where } from 'firebase/firestore'

export const COL = {
  shops: 'shops',
  kycDocuments: 'kycDocuments',
  orders: 'orders',
  withdrawals: 'withdrawals',
  notifications: 'notifications',
  payoutMethods: 'payoutMethods',
  support: 'supportConversations',
  ledger: 'ledger',
  campaigns: 'campaigns',
  scheduledOrders: 'scheduledOrders',
  loginHistory: 'loginHistory',
  activity: 'activityLogs',
  superLogs: 'superAdminLogs',
  adminLogins: 'adminLoginHistory',
  adminDevices: 'adminDevices',
  security: 'sellerSecurity',
}

export const ORDER_STATUS_FLOW = ['Unpaid', 'Paid', 'Pickup', 'On the way', 'Out for delivery', 'Delivered']
export const ORDER_STATUSES = [...ORDER_STATUS_FLOW, 'Cancelled']

// ---- small helpers --------------------------------------------------------------------------

const nowIso = () => new Date().toISOString()
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100
const newId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
const clean = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined))
const money = (value) => `$${Number(value || 0).toFixed(2)}`

// "Crypto · USDT_TRC20" / "Bank · Awais NBank": how a payout method reads in the admin's feed.
const methodSummary = (method, fallback = '') => {
  if (!method || typeof method !== 'object') return String(method || fallback || '')
  const kind = method.type === 'crypto' ? 'Crypto' : method.type === 'bank' ? 'Bank' : ''
  const detail = method.type === 'crypto' ? method.network || method.label : method.bankName || method.label
  return [kind, detail].filter(Boolean).join(' · ') || String(fallback || '')
}

// A refusal we raise ourselves inside a transaction, so its message reaches the UI as written.
class Refusal extends Error {}
const refuse = (message) => {
  throw new Refusal(message)
}

async function attempt(task) {
  try {
    return await task()
  } catch (error) {
    return fail(error instanceof Refusal ? error.message : error)
  }
}

export function timeAgo(iso, now = Date.now()) {
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return 'Just now'
  const seconds = Math.max(0, Math.floor((now - at) / 1000))
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatDateTime = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? String(iso) : date.toLocaleString()
}

export const clockTime = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ---- shops ----------------------------------------------------------------------------------

const shopDefaults = () => ({
  balance: 0,
  guarantee: 0,
  rating: 5,
  verified: false,
  status: 'Under review',
  deleted: false,
  suspended: false,
  withdrawalsBlocked: false,
  allowProductRemoval: true,
  productLimit: 50,
  viewsBoost: 0,
  kycAckSeen: false,
  productIds: [],
  orderStats: { total: 0, pending: 0, delivered: 0 },
  views: { total: 0, today: 0 },
})

// What a seller writes when their shop is created: identity from their profile, everything else at
// its "new store" default (the rules refuse anything else, so a seller cannot start with a balance
// or as an already-verified shop).
export function newShopRecord(profile, { hasDocuments = false } = {}) {
  const now = nowIso()
  return {
    ...shopDefaults(),
    fullName: profile.fullName || 'Seller',
    ownerName: profile.fullName || 'Seller',
    shopName: profile.shopName || 'My Shop',
    email: profile.email || '',
    adminId: profile.adminId || null,
    inviteCode: profile.inviteCode || '',
    memberSince: profile.memberSince || memberSinceLabel(),
    createdAt: now,
    lastActiveAt: now,
    kyc: {
      status: 'Pending',
      docType: profile.documentType || 'national-id',
      submittedAt: now,
      joined: now,
      country: profile.country || '',
      address: [profile.streetAddress, profile.city, profile.state].filter(Boolean).join(', '),
      hasDocuments,
    },
  }
}

// The shape the UI works with: defaults filled in, dates formatted for display.
export function normalizeShop(id, data) {
  const base = shopDefaults()
  const kyc = data.kyc || {}
  return {
    ...base,
    ...data,
    id,
    ownerName: data.ownerName || data.fullName || '',
    orderStats: { ...base.orderStats, ...(data.orderStats || {}) },
    views: { ...base.views, ...(data.views || {}) },
    productIds: Array.isArray(data.productIds) ? data.productIds : [],
    lastActive: data.lastActiveAt ? timeAgo(data.lastActiveAt) : 'Never',
    kyc: {
      ...kyc,
      status: kyc.status || (data.verified ? 'Approved' : 'Pending'),
      submittedAt: formatDateTime(kyc.submittedAt) || data.memberSince || '',
      joined: formatDateTime(kyc.joined) || data.memberSince || '',
    },
  }
}

const byNewest = (field) => (a, b) => String(b[field] || '').localeCompare(String(a[field] || ''))

// ---- watching -------------------------------------------------------------------------------

// Live list of a query, each doc as `{ id, ...data }` (optionally mapped), or `null`-safe on error.
export function watchList(db, name, constraints, onData, onError = () => {}, map = (row) => row) {
  return onSnapshot(
    query(collection(db, name), ...constraints),
    (snap) => onData(snap.docs.map((d) => map({ id: d.id, ...d.data() }))),
    (error) => onError(error, name)
  )
}

export function watchShop(db, sellerId, onData, onError = () => {}) {
  return onSnapshot(
    doc(db, COL.shops, sellerId),
    (snap) => onData(snap.exists() ? normalizeShop(snap.id, snap.data()) : null),
    (error) => onError(error, COL.shops)
  )
}

export const mapShop = (row) => {
  const { id, ...data } = row
  return normalizeShop(id, data)
}

export const mapLog = (row) => ({ ...row, time: timeAgo(row.at) })

export const mapNotification = (row) => ({ ...row, time: timeAgo(row.createdAt) })

// Ledger and login-history rows carry a full local timestamp; login history also feeds the device columns.
export const mapTimed = (row) => ({ ...row, time: formatDateTime(row.at), deviceType: row.device })

export const mapConversation = (row) => ({
  ...row,
  messages: (row.messages || []).map((message) => ({ ...message, time: clockTime(message.at) })),
})

export const sortNewest = (list, field = 'createdAt') => [...list].sort(byNewest(field))

// ---- activity feeds ---------------------------------------------------------------------------

// Writes an activity entry into a batch / transaction so it commits atomically with what it describes.
// `meta` carries what the admin's feed shows beyond the headline: the products in an "added to shop"
// line, the payout method of a withdrawal, the place and device of a sign-up.
export function stageActivity(db, writer, { adminId, sellerId, actorId, type, title, entity, icon, amount, meta }) {
  const ref = doc(collection(db, COL.activity))
  writer.set(ref, clean({ adminId, sellerId, actorId, type, title, entity, icon, amount, meta: meta && Object.keys(clean(meta)).length ? clean(meta) : undefined, at: nowIso() }))
}

// A log entry on its own (best effort: a failed log never fails the action it describes).
export async function pushActivity(db, entry) {
  try {
    const ref = doc(collection(db, COL.activity))
    await setDoc(ref, clean({ ...entry, at: nowIso() }))
  } catch (_) {}
}

export async function pushSuperLog(db, entry) {
  try {
    await setDoc(doc(db, COL.superLogs, newId('sal')), clean({ ...entry, at: nowIso() }))
  } catch (_) {}
}

// `details` (optional, may be a promise) is what `sessionDetails()` returns: the device, its id and
// where it is. The time is taken now, so a slow location lookup never back-dates or delays the entry.
export async function logAdminLogin(db, adminId, via, details) {
  const at = nowIso()
  try {
    const session = (await details) || {}
    await setDoc(
      doc(db, COL.adminLogins, newId('alh')),
      clean({ adminId, via, at, ip: session.ip || undefined, location: session.location || undefined, device: session.device || undefined, deviceId: session.deviceId || undefined })
    )
  } catch (_) {}
}

// ---- where a sign-in comes from -------------------------------------------------------------------
// The place is worked out from the public IP address (city level — a browser cannot know more without
// asking for GPS). Free lookup services are tried in turn; any failure just means "no location".

const LOOKUP_TIMEOUT = 4000
const LOOKUP_BUDGET = 8000
const OWN_LOOKUP_TTL = 5 * 60 * 1000

const readLocation = (parts) => {
  const seen = []
  for (const part of parts) {
    const value = String(part || '').trim()
    if (value && !seen.includes(value)) seen.push(value)
  }
  return seen.join(', ')
}

async function fetchJson(url, timeout = LOOKUP_TIMEOUT) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeout) : null
  try {
    const response = await fetch(url, { signal: controller?.signal, cache: 'no-store' })
    return response.ok ? await response.json() : null
  } catch (_) {
    return null
  } finally {
    if (timer) clearTimeout(timer)
  }
}

const LOOKUPS = [
  async (ip) => {
    const data = await fetchJson(`https://ipwho.is/${ip || ''}`)
    if (!data || data.success === false) return null
    return { ip: data.ip, location: readLocation([data.city, data.region, data.country]) }
  },
  async (ip) => {
    const data = await fetchJson(`https://ipapi.co/${ip ? `${ip}/` : ''}json/`)
    if (!data || data.error) return null
    return { ip: data.ip, location: readLocation([data.city, data.region, data.country_name]) }
  },
  async (ip) => {
    if (ip) return null
    const data = await fetchJson('https://api.ipify.org?format=json')
    return data?.ip ? { ip: data.ip, location: '' } : null
  },
]

let ownLookup = null

// `{ ip, location }` for the given IP (or for this device's own public IP), or `null` when it cannot be
// worked out — offline, blocked by an extension, or not in a browser at all (tests, server tools).
// A device's own answer is reused for a few minutes unless `fresh` asks for a new one (the network changed).
export async function lookupLocation(ip, { fresh = false } = {}) {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return null
  const own = !ip
  if (own && !fresh && ownLookup && Date.now() - ownLookup.at < OWN_LOOKUP_TTL) return ownLookup.result
  let result = null
  const deadline = Date.now() + LOOKUP_BUDGET
  for (const lookup of LOOKUPS) {
    if (Date.now() > deadline) break
    const found = await lookup(ip)
    if (found && (found.ip || found.location)) {
      result = { ip: found.ip || ip || '', location: found.location || '' }
      if (result.location) break
    }
  }
  if (own && result) ownLookup = { at: Date.now(), result }
  return result
}

// A random id for this browser, kept in local storage: lets the admin's login history say which of
// the listed devices is the one they are on, and lets them name it.
export function deviceId() {
  try {
    let id = localStorage.getItem('uss_device_id')
    if (!id) {
      id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem('uss_device_id', id)
    }
    return id
  } catch (_) {
    return ''
  }
}

// Everything worth noting about the browser that is signing in right now.
export async function sessionDetails() {
  const found = await lookupLocation()
  return { device: describeDevice(), deviceId: deviceId(), ip: found?.ip || '', location: found?.location || '' }
}

// ---- admin: naming devices, filling in missing places --------------------------------------------

// The key a device is filed under: its id, or (for sign-ins from before ids existed) its address + description.
export const deviceKey = (entry) => String(entry.deviceId || `${entry.ip || ''}|${entry.device || ''}`).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120)

export function watchDeviceLabels(db, adminId, onData, onError = () => {}) {
  return onSnapshot(
    doc(db, COL.adminDevices, adminId),
    (snap) => onData(snap.exists() ? snap.data().labels || {} : {}),
    (error) => onError(error, COL.adminDevices)
  )
}

// An empty name removes the label ("Unknown device" again).
export const saveDeviceLabel = (db, adminId, key, label) =>
  attempt(async () => {
    const name = text(label, 40)
    await setDoc(doc(db, COL.adminDevices, adminId), { adminId, labels: { [key]: name || deleteField() } }, { merge: true })
    return { success: true, label: name }
  })

// Entries that have an address but no place (the lookup failed at the time, or the service was down):
// look the address up now and store the place on the entry. `rows` are `{ collection, id, ip }`.
export async function backfillLocations(db, rows) {
  const places = new Map()
  let updated = 0
  let unresolved = 0
  let failed = 0
  for (const row of rows) {
    if (!row.ip || /[^0-9a-fA-F:.]/.test(row.ip)) {
      unresolved += 1
      continue
    }
    if (!places.has(row.ip)) places.set(row.ip, (await lookupLocation(row.ip))?.location || '')
    const location = places.get(row.ip)
    if (!location) {
      failed += 1
      continue
    }
    try {
      await updateDoc(doc(db, row.collection, row.id), { location })
      updated += 1
    } catch (_) {
      failed += 1
    }
  }
  return { success: true, updated, unresolved, failed }
}

// ---- seller: shop lifecycle ---------------------------------------------------------------------

// A seller whose profile predates shop data (or whose shop was never written) gets an empty shop.
export async function ensureShop(db, uid, profile) {
  try {
    const ref = doc(db, COL.shops, uid)
    const existing = await getDoc(ref)
    if (existing.exists()) return normalizeShop(uid, existing.data())
    const record = newShopRecord(profile)
    await setDoc(ref, record)
    return normalizeShop(uid, record)
  } catch (_) {
    return null
  }
}

// "Desktop • Windows • Chrome" — what the admin sees in a seller's login history.
export function describeDevice() {
  if (typeof navigator === 'undefined') return 'Seller portal'
  const ua = navigator.userAgent || ''
  const type = /Mobi|Android|iPhone/.test(ua) ? 'Mobile' : 'Desktop'
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ''
  return [type, os, browser].filter(Boolean).join(' • ')
}

// Notes that the seller signed in: last-active stamp + a line in the admin's login history, with the
// address and place the sign-in came from. `where` is `{ ip, location }`; left out, it is looked up now.
export async function recordSellerLogin(db, shop, { device = describeDevice(), where } = {}) {
  const at = nowIso()
  try {
    const found = where === undefined ? await lookupLocation() : where
    const batch = writeBatch(db)
    batch.update(doc(db, COL.shops, shop.id), { lastActiveAt: at })
    batch.set(doc(collection(db, COL.loginHistory)), clean({ sellerId: shop.id, adminId: shop.adminId, at, device, ip: found?.ip || undefined, location: found?.location || undefined }))
    await batch.commit()
  } catch (_) {}
}

// The seller has the storefront open: keeps "Online" in the admin console honest.
export async function touchLastActive(db, sellerId) {
  try {
    await updateDoc(doc(db, COL.shops, sellerId), { lastActiveAt: nowIso() })
  } catch (_) {}
}

// Where the seller is right now, for the admin's support chat: the place their connection resolves to
// (city level, from the IP address — no GPS prompt), the address and the device. Written only when it
// differs from `last` (what this tab wrote before), so a heartbeat costs nothing extra while they stay
// put. Returns the presence key it now considers current: pass it back as `last` on the next call.
export async function reportPresence(db, sellerId, { last = '', fresh = false } = {}) {
  try {
    const found = await lookupLocation(undefined, { fresh })
    if (!found || !(found.ip || found.location)) return last
    const device = describeDevice()
    const key = [found.ip, found.location, device].join('|')
    if (key === last) return last
    await updateDoc(doc(db, COL.shops, sellerId), clean({ lastLocation: found.location || undefined, lastIp: found.ip || undefined, lastDevice: device, locationAt: nowIso() }))
    return key
  } catch (_) {
    return last
  }
}

// An admin / super admin opening the seller's portal ("log in as seller").
export async function recordImpersonation(db, shop, actorId) {
  try {
    const batch = writeBatch(db)
    batch.set(doc(collection(db, COL.loginHistory)), { sellerId: shop.id, adminId: shop.adminId, at: nowIso(), ip: 'Admin impersonation', device: 'Admin Panel' })
    stageActivity(db, batch, { adminId: shop.adminId, sellerId: shop.id, actorId, type: 'seller_impersonate', title: 'Admin logged in as seller', entity: shop.fullName, icon: 'signin' })
    await batch.commit()
  } catch (_) {}
}

export const acknowledgeKyc = (db, sellerId) =>
  attempt(async () => {
    await updateDoc(doc(db, COL.shops, sellerId), { kycAckSeen: true })
    return { success: true }
  })

export async function loadKycDocuments(db, sellerId) {
  try {
    const snap = await getDoc(doc(db, COL.kycDocuments, sellerId))
    return snap.exists() ? snap.data() : null
  } catch (_) {
    return null
  }
}

// ---- seller: profile, security, verification ------------------------------------------------------
// Everything on the seller's Profile page that lives in Firestore. (Sign-in email and password live in
// Firebase Auth — see accounts.js.)

const text = (value, max) => String(value ?? '').trim().slice(0, max)

// Shop name, contact phone, address and the SEO title/description shown for the shop.
export const saveShopSettings = (db, sellerId, settings) =>
  attempt(async () => {
    const shopName = text(settings.shopName, 80)
    if (!shopName) return { success: false, error: 'Enter a shop name.' }
    const phone = text(settings.phone, 30)
    const digits = phone.replace(/\D/g, '')
    if (phone && (/[^\d\s()+\-.]/.test(phone) || digits.length < 6 || digits.length > 15)) return { success: false, error: 'Enter a valid phone number.' }
    const changes = {
      shopName,
      phone,
      phoneCountry: text(settings.phoneCountry, 2).toUpperCase(),
      address: {
        street: text(settings.street, 200),
        city: text(settings.city, 80),
        state: text(settings.state, 80),
        country: text(settings.country, 80),
        postalCode: text(settings.postalCode, 20),
      },
      metaTitle: text(settings.metaTitle, 60),
      metaDescription: text(settings.metaDescription, 160),
    }
    await updateDoc(doc(db, COL.shops, sellerId), changes)
    return { success: true, changes }
  })

// The seller's own name: on the shop (what admins see) and on their profile.
export const saveSellerName = (db, sellerId, fullName) =>
  attempt(async () => {
    const name = text(fullName, 80)
    if (!name) return { success: false, error: 'Enter your name.' }
    const batch = writeBatch(db)
    batch.update(doc(db, COL.shops, sellerId), { fullName: name, ownerName: name })
    batch.update(doc(db, 'users', sellerId), { fullName: name })
    await batch.commit()
    return { success: true, fullName: name }
  })

// `avatar` is a small JPEG data URL (see src/data/avatar.js), kept on the shop document.
export const saveSellerAvatar = (db, sellerId, avatar) =>
  attempt(async () => {
    if (typeof avatar !== 'string' || avatar.length > 75000) return { success: false, error: 'That photo is too large.' }
    await updateDoc(doc(db, COL.shops, sellerId), { avatar })
    return { success: true }
  })

// Firebase Auth owns the sign-in email; once it changes (after the seller confirms the new address)
// the shop and profile copies are brought in step with it. Best effort.
export async function syncAccountEmail(db, sellerId, email) {
  try {
    const batch = writeBatch(db)
    batch.update(doc(db, COL.shops, sellerId), { email })
    batch.update(doc(db, 'users', sellerId), { email })
    await batch.commit()
    return true
  } catch (_) {
    return false
  }
}

// ---- transaction password ----
// A PIN the seller types to confirm a withdrawal. Only a salted PBKDF2 hash is stored, in a document
// nobody but the seller can read (not even their admin). It is a guard against someone using an
// unattended signed-in session; the rules cannot check a PIN, so it is enforced by the app.

const PIN_ITERATIONS = 150000

const toHex = (buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
const fromHex = (hex) => Uint8Array.from(String(hex).match(/.{2}/g) || [], (pair) => parseInt(pair, 16))

const secureCrypto = () => {
  const api = globalThis.crypto
  if (!api?.subtle) throw new Error('Your browser cannot protect passwords here. Open the store over HTTPS and try again.')
  return api
}

async function hashPin(pin, salt, iterations) {
  const { subtle } = secureCrypto()
  const key = await subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  return toHex(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256))
}

export function watchSecurity(db, sellerId, onData, onError = () => {}) {
  return onSnapshot(
    doc(db, COL.security, sellerId),
    (snap) => onData(snap.exists() ? snap.data() : null),
    (error) => onError(error, COL.security)
  )
}

export const saveTransactionPassword = (db, sellerId, pin) =>
  attempt(async () => {
    const value = String(pin ?? '')
    if (value.length < 4 || value.length > 32) return { success: false, error: 'Use 4 to 32 characters for the transaction password.' }
    const salt = secureCrypto().getRandomValues(new Uint8Array(16))
    const hash = await hashPin(value, salt, PIN_ITERATIONS)
    await setDoc(doc(db, COL.security, sellerId), { sellerId, salt: toHex(salt), hash, iterations: PIN_ITERATIONS, updatedAt: nowIso() })
    return { success: true }
  })

// `{ success: true, set: false }` when the seller has not set one (nothing to check).
export const verifyTransactionPassword = (db, sellerId, pin) =>
  attempt(async () => {
    const snap = await getDoc(doc(db, COL.security, sellerId))
    if (!snap.exists()) return { success: true, set: false }
    const { salt, hash, iterations } = snap.data()
    const candidate = await hashPin(String(pin ?? ''), fromHex(salt), iterations)
    return candidate === hash ? { success: true, set: true } : { success: false, error: 'Incorrect transaction password.' }
  })

// ---- identity verification (KYC) ----
// First submission for a seller who signed up without documents, or a resubmission after a rejection.
// The shop goes back to "Pending" for the admin's review in the same batch.
export const submitKyc = (db, shop, { docType, front, back }) =>
  attempt(async () => {
    if (shop.verified) return { success: false, error: 'Your identity is already verified.' }
    if (!front || !back) return { success: false, error: 'Upload both the front and the back of your document.' }
    const at = nowIso()
    const batch = writeBatch(db)
    batch.set(doc(db, COL.kycDocuments, shop.id), { sellerId: shop.id, adminId: shop.adminId, front, back, updatedAt: at })
    batch.update(doc(db, COL.shops, shop.id), { 'kyc.status': 'Pending', 'kyc.docType': docType, 'kyc.submittedAt': at, 'kyc.hasDocuments': true })
    stageActivity(db, batch, { adminId: shop.adminId, sellerId: shop.id, actorId: shop.id, type: 'kyc_submitted', title: 'Seller submitted KYC documents', entity: shop.fullName, icon: 'shield' })
    await batch.commit()
    return { success: true }
  })

// ---- seller: orders, wallet, catalogue ----------------------------------------------------------

// The seller pays an order's cost out of their shop balance; the order becomes "Paid".
export const payOrder = (db, sellerId, orderId, actorId = sellerId) =>
  attempt(() =>
    runTransaction(db, async (tx) => {
      const shopRef = doc(db, COL.shops, sellerId)
      const orderRef = doc(db, COL.orders, orderId)
      const [shopSnap, orderSnap] = [await tx.get(shopRef), await tx.get(orderRef)]
      if (!shopSnap.exists()) refuse('Seller not found')
      if (!orderSnap.exists() || orderSnap.data().sellerId !== sellerId) refuse('Order not found')
      const shop = shopSnap.data()
      const order = orderSnap.data()
      if (order.status !== 'Unpaid') refuse('This order has already been processed')
      if ((shop.balance || 0) < order.cost) refuse('Your shop balance is too low. Top up your wallet to process this order.')
      tx.update(orderRef, { status: 'Paid', paidAt: nowIso() })
      tx.update(shopRef, { balance: round2((shop.balance || 0) - order.cost) })
      stageActivity(db, tx, { adminId: shop.adminId, sellerId, actorId, type: 'order_paid', title: 'Paid to process order', entity: shop.fullName, icon: 'pay', amount: order.cost })
      return { success: true }
    })
  )

// The seller asks to withdraw part of their balance: the amount leaves the balance immediately and
// waits as a pending request (it is returned if the admin rejects it).
//
// `onBehalf` is the admin console filing the request for a seller ("New withdrawal"): the request is
// marked `initiatedBy: 'admin'`, may carry the admin's `note`, and `notify` tells the seller about it.
export const requestWithdrawal = (db, sellerId, amount, method, actorId = sellerId, { onBehalf = false, note = '', notify = false } = {}) =>
  attempt(() =>
    runTransaction(db, async (tx) => {
      const value = round2(amount)
      const shopRef = doc(db, COL.shops, sellerId)
      const shopSnap = await tx.get(shopRef)
      if (!shopSnap.exists()) refuse('Seller not found')
      const shop = shopSnap.data()
      if (shop.deleted || shop.suspended) refuse(onBehalf ? 'This seller\'s account is not active.' : 'Your account is not active. Contact support for help.')
      if (shop.withdrawalsBlocked) refuse(onBehalf ? 'Withdrawals are blocked for this seller. Allow them from the Sellers page first.' : 'Withdrawals are currently blocked by admin for your store')
      if (!Number.isFinite(value) || value <= 0 || value > (shop.balance || 0)) refuse(onBehalf ? 'Enter an amount within the seller\'s available balance' : 'Enter an amount within your available balance')
      const request = clean({
        sellerId,
        adminId: shop.adminId,
        amount: value,
        method: method?.label || (typeof method === 'string' ? method : ''),
        payoutMethod: method && typeof method === 'object' ? method : null,
        status: 'Pending',
        createdAt: nowIso(),
        initiatedBy: onBehalf ? 'admin' : undefined,
        note: onBehalf ? text(note, 240) || undefined : undefined,
      })
      const requestRef = doc(collection(db, COL.withdrawals))
      tx.set(requestRef, request)
      tx.update(shopRef, { balance: round2((shop.balance || 0) - value) })
      stageActivity(db, tx, {
        adminId: shop.adminId,
        sellerId,
        actorId,
        type: onBehalf ? 'withdrawal_initiated' : 'withdrawal_requested',
        title: onBehalf ? 'Admin filed a withdrawal for seller' : 'Seller requested withdrawal',
        entity: shop.fullName,
        icon: 'wallet',
        amount: value,
        meta: { method: methodSummary(method) },
      })
      if (onBehalf && notify) {
        stageNotification(db, tx, { id: sellerId, adminId: shop.adminId }, {
          type: 'withdrawal',
          title: 'Withdrawal requested',
          message: `A withdrawal of ${money(value)} was filed for you by your admin. ${money(value)} was moved out of your shop balance and the request is now pending review.`,
        })
      }
      return { success: true, request: { id: requestRef.id, ...request } }
    })
  )

// `replaceIds`: the previous default method(s) a new default supersedes.
export const savePayoutMethod = (db, shop, method, replaceIds = [], actorId = shop.id) =>
  attempt(async () => {
    const saved = clean({
      sellerId: shop.id,
      adminId: shop.adminId,
      type: method.type,
      label: method.label,
      bankName: method.bankName,
      holderName: method.holderName,
      accountNumber: method.accountNumber,
      routingNumber: method.routingNumber,
      network: method.network,
      walletAddress: method.walletAddress,
      isDefault: !!method.isDefault,
      createdAt: nowIso(),
    })
    const ref = doc(collection(db, COL.payoutMethods))
    const batch = writeBatch(db)
    batch.set(ref, saved)
    if (saved.isDefault) replaceIds.forEach((id) => batch.delete(doc(db, COL.payoutMethods, id)))
    stageActivity(db, batch, {
      adminId: shop.adminId,
      sellerId: shop.id,
      actorId,
      type: 'payout_method_added',
      title: 'Payout method added',
      entity: shop.fullName,
      icon: 'wallet',
      meta: { method: methodSummary(saved) },
    })
    await batch.commit()
    return { success: true, method: { id: ref.id, ...saved } }
  })

export const removePayoutMethod = (db, methodId) =>
  attempt(async () => {
    await deleteDoc(doc(db, COL.payoutMethods, methodId))
    return { success: true }
  })

// Adds master-catalogue products to the seller's shop, up to their product limit.
// `details` maps a catalogue id to what the admin's feed shows for it: `{ name, image, price }`.
const productLine = (id, details) =>
  clean({
    id,
    name: text(details?.[id]?.name, 140) || undefined,
    image: text(details?.[id]?.image, 300) || undefined,
    price: Number.isFinite(Number(details?.[id]?.price)) ? round2(details[id].price) : undefined,
  })

export const addProductsToShop = (db, sellerId, catalogIds, actorId = sellerId, details = {}) =>
  attempt(() =>
    runTransaction(db, async (tx) => {
      const shopRef = doc(db, COL.shops, sellerId)
      const shopSnap = await tx.get(shopRef)
      if (!shopSnap.exists()) refuse('Seller not found')
      const shop = shopSnap.data()
      if (!shop.verified) refuse('Your store is not verified yet')
      const limit = shop.productLimit ?? 50
      const existing = Array.isArray(shop.productIds) ? shop.productIds : []
      const have = new Set(existing)
      const toAdd = []
      for (const id of catalogIds) {
        if (have.has(id) || toAdd.includes(id)) continue
        if (existing.length + toAdd.length >= limit) break
        toAdd.push(id)
      }
      if (!toAdd.length) refuse('No slots remaining')
      tx.update(shopRef, { productIds: [...existing, ...toAdd] })
      stageActivity(db, tx, {
        adminId: shop.adminId,
        sellerId,
        actorId,
        type: 'seller_products_added',
        title: `${toAdd.length} product${toAdd.length === 1 ? '' : 's'} added to shop`,
        entity: shop.fullName,
        icon: 'package',
        // One line however many products: the feed lists each product from `meta.items`.
        meta: { items: toAdd.map((id) => productLine(id, details)) },
      })
      return { success: true, added: toAdd.length }
    })
  )

export const removeProductFromShop = (db, sellerId, catalogId, actorId = sellerId, details = {}) =>
  attempt(() =>
    runTransaction(db, async (tx) => {
      const shopRef = doc(db, COL.shops, sellerId)
      const shopSnap = await tx.get(shopRef)
      if (!shopSnap.exists()) refuse('Seller not found')
      const shop = shopSnap.data()
      if (shop.allowProductRemoval === false) refuse('Product removal is disabled by admin for your store')
      tx.update(shopRef, { productIds: (shop.productIds || []).filter((id) => id !== catalogId) })
      stageActivity(db, tx, {
        adminId: shop.adminId,
        sellerId,
        actorId,
        type: 'seller_product_removed',
        title: 'Product removed from shop',
        entity: shop.fullName,
        icon: 'package',
        meta: { items: [productLine(catalogId, details)] },
      })
      return { success: true }
    })
  )

// Wipes every product from the seller's shop in one go — the "clear all" a seller reaches for once
// their slots are full and they want to restock from scratch instead of removing products one at a time.
export const clearShopProducts = (db, sellerId, actorId = sellerId) =>
  attempt(() =>
    runTransaction(db, async (tx) => {
      const shopRef = doc(db, COL.shops, sellerId)
      const shopSnap = await tx.get(shopRef)
      if (!shopSnap.exists()) refuse('Seller not found')
      const shop = shopSnap.data()
      if (shop.allowProductRemoval === false) refuse('Product removal is disabled by admin for your store')
      const existing = Array.isArray(shop.productIds) ? shop.productIds : []
      if (!existing.length) refuse('Your shop is already empty')
      tx.update(shopRef, { productIds: [] })
      stageActivity(db, tx, {
        adminId: shop.adminId,
        sellerId,
        actorId,
        type: 'seller_products_cleared',
        title: `All ${existing.length} product${existing.length === 1 ? '' : 's'} removed from shop`,
        entity: shop.fullName,
        icon: 'package',
      })
      return { success: true, removed: existing.length }
    })
  )

export const markNotificationsRead = (db, ids) =>
  attempt(async () => {
    if (!ids.length) return { success: true }
    const batch = writeBatch(db)
    ids.forEach((id) => batch.update(doc(db, COL.notifications, id), { read: true }))
    await batch.commit()
    return { success: true }
  })

// ---- support chat -------------------------------------------------------------------------------
// One conversation per seller (id `support-<sellerId>`); messages are only ever appended.

export const conversationId = (sellerId) => `support-${sellerId}`

export const WELCOME_MESSAGE = 'Welcome to your store! How can I help you today?'

const preview = (text) => (text.length > 120 ? `${text.slice(0, 117)}…` : text)

// The note the other side gets for a chat message (type `chat`): a seller's message notifies their
// admin (`recipient: 'admin'`), the admin's reply notifies the seller. Best effort — a failed note
// never fails the message it describes.
async function pushChatNotification(db, shop, sender, body) {
  try {
    const toAdmin = sender === 'seller'
    await setDoc(
      doc(collection(db, COL.notifications)),
      clean({
        sellerId: shop.id,
        adminId: shop.adminId,
        type: 'chat',
        title: toAdmin ? `New message from ${shop.shopName || 'a seller'}` : 'New message from Customer Support',
        message: preview(body),
        read: false,
        createdAt: nowIso(),
        recipient: toAdmin ? 'admin' : undefined,
      })
    )
  } catch (_) {}
}

// Every new seller's inbox starts with the admin's welcome, so support is open from the first
// minute. Creating (never overwriting) is what the rules allow, so if a conversation already exists
// — another tab got there first — this is refused and nothing changes.
export const createWelcomeConversation = (db, shop) =>
  attempt(async () => {
    const at = nowIso()
    await setDoc(doc(db, COL.support, conversationId(shop.id)), {
      sellerId: shop.id,
      adminId: shop.adminId,
      status: 'active',
      updatedAt: at,
      messages: [{ id: 'welcome', sender: 'admin', text: WELCOME_MESSAGE, at }],
      unreadForAdmin: 0,
      unreadForSeller: 1,
    })
    await pushChatNotification(db, shop, 'admin', WELCOME_MESSAGE)
    return { success: true }
  })

export const sendSupportMessage = (db, shop, sender, text) =>
  attempt(async () => {
    const body = (text || '').trim()
    if (!body) return { success: false, error: 'Message cannot be empty' }
    const message = { id: newId('message'), sender, text: body, at: nowIso() }
    await setDoc(
      doc(db, COL.support, conversationId(shop.id)),
      {
        sellerId: shop.id,
        adminId: shop.adminId,
        status: 'active',
        updatedAt: message.at,
        messages: arrayUnion(message),
        unreadForAdmin: increment(sender === 'seller' ? 1 : 0),
        unreadForSeller: increment(sender === 'admin' ? 1 : 0),
      },
      { merge: true }
    )
    await pushChatNotification(db, shop, sender, body)
    return { success: true }
  })

// Reading a conversation also reads the chat notifications it raised (`notificationIds`).
export const markSupportRead = (db, id, role, notificationIds = []) =>
  attempt(async () => {
    const batch = writeBatch(db)
    batch.update(doc(db, COL.support, id), role === 'admin' ? { unreadForAdmin: 0 } : { unreadForSeller: 0 })
    notificationIds.forEach((notificationId) => batch.update(doc(db, COL.notifications, notificationId), { read: true }))
    await batch.commit()
    return { success: true }
  })

// `archived: false` puts a conversation back in the active inbox.
export const archiveSupportConversation = (db, id, archived = true) =>
  attempt(async () => {
    await updateDoc(doc(db, COL.support, id), { status: archived ? 'archived' : 'active' })
    return { success: true }
  })

// ---- admin: seller management -------------------------------------------------------------------
// `target` is the seller's shop as the UI holds it (its `id` and `adminId` are what matter).

// Sets shop fields and writes the log line in one batch.
async function editShop(db, target, changes, log, actorId) {
  const batch = writeBatch(db)
  batch.update(doc(db, COL.shops, target.id), changes)
  stageActivity(db, batch, { adminId: target.adminId, sellerId: target.id, actorId, entity: target.fullName, ...log })
  await batch.commit()
}

const adjustAmount = (value) => {
  const num = parseFloat(value)
  return Number.isNaN(num) || num <= 0 ? null : num
}

export const adjustBalance = (db, target, amount, action, actorId) =>
  attempt(() => {
    const num = adjustAmount(amount)
    if (num == null) return { success: false, error: 'Invalid amount' }
    if (action !== 'add' && action !== 'deduct') return { success: false, error: 'Invalid action' }
    return runTransaction(db, async (tx) => {
      const shopRef = doc(db, COL.shops, target.id)
      const shopSnap = await tx.get(shopRef)
      if (!shopSnap.exists()) refuse('Seller not found')
      const current = shopSnap.data().balance || 0
      const newBalance = round2(action === 'add' ? current + num : Math.max(0, current - num))
      tx.update(shopRef, { balance: newBalance })
      tx.set(doc(collection(db, COL.ledger)), {
        sellerId: target.id,
        adminId: target.adminId,
        type: action === 'add' ? 'credit' : 'debit',
        amount: num,
        description: action === 'add' ? 'Admin added funds' : 'Admin deducted funds',
        balance: newBalance,
        at: nowIso(),
      })
      stageActivity(db, tx, {
        adminId: target.adminId,
        sellerId: target.id,
        actorId,
        type: `seller_balance_${action}`,
        title: `Balance ${action === 'add' ? 'increased' : 'deducted'} (${action === 'add' ? '+' : '-'}${money(num)})`,
        entity: target.fullName,
        icon: 'wallet',
        amount: num,
      })
      return { success: true, newBalance }
    })
  })

export const adjustGuarantee = (db, target, amount, action, actorId) =>
  attempt(() => {
    const num = adjustAmount(amount)
    if (num == null) return { success: false, error: 'Invalid amount' }
    if (action !== 'add' && action !== 'deduct') return { success: false, error: 'Invalid action' }
    return runTransaction(db, async (tx) => {
      const shopRef = doc(db, COL.shops, target.id)
      const shopSnap = await tx.get(shopRef)
      if (!shopSnap.exists()) refuse('Seller not found')
      const current = shopSnap.data().guarantee || 0
      const newGuarantee = round2(action === 'add' ? current + num : Math.max(0, current - num))
      tx.update(shopRef, { guarantee: newGuarantee })
      stageActivity(db, tx, {
        adminId: target.adminId,
        sellerId: target.id,
        actorId,
        type: `seller_guarantee_${action}`,
        title: `Guarantee ${action === 'add' ? 'increased' : 'deducted'} (${action === 'add' ? '+' : '-'}${money(num)})`,
        entity: target.fullName,
        icon: 'shield',
      })
      return { success: true, newGuarantee }
    })
  })

export const setRating = (db, target, value, actorId) =>
  attempt(async () => {
    const rating = parseFloat(value)
    if (Number.isNaN(rating) || rating < 0 || rating > 5) return { success: false, error: 'Rating must be between 0 and 5' }
    const rounded = Math.round(rating * 100) / 100
    await editShop(db, target, { rating: rounded }, { type: 'seller_rating', title: `Shop rating set to ${rounded.toFixed(2)}`, icon: 'star' }, actorId)
    return { success: true, newRating: rounded }
  })

export const setProductLimit = (db, target, value, actorId) =>
  attempt(async () => {
    const limit = parseInt(value, 10)
    if (Number.isNaN(limit) || limit < 0) return { success: false, error: 'Invalid product limit' }
    await editShop(db, target, { productLimit: limit }, { type: 'seller_product_limit', title: `Product limit set to ${limit}`, icon: 'package' }, actorId)
    return { success: true, newLimit: limit }
  })

export const setSuspended = (db, target, suspended, actorId) =>
  attempt(async () => {
    const status = suspended ? 'Suspended' : target.status === 'Suspended' ? 'Active' : target.status
    await editShop(
      db,
      target,
      { suspended: !!suspended, status },
      { type: `seller_suspend_${suspended ? 'on' : 'off'}`, title: suspended ? 'Account suspended' : 'Account unsuspended', icon: 'ban' },
      actorId
    )
    return { success: true, suspended: !!suspended }
  })

export const setWithdrawalsBlocked = (db, target, blocked, actorId) =>
  attempt(async () => {
    await editShop(
      db,
      target,
      { withdrawalsBlocked: !!blocked },
      { type: `seller_withdrawals_${blocked ? 'blocked' : 'allowed'}`, title: blocked ? 'Withdrawals blocked' : 'Withdrawals allowed', icon: 'credit' },
      actorId
    )
    return { success: true, blocked: !!blocked }
  })

export const setProductRemoval = (db, target, allowed, actorId) =>
  attempt(async () => {
    await editShop(
      db,
      target,
      { allowProductRemoval: !!allowed },
      { type: `seller_product_removal_${allowed ? 'allow' : 'deny'}`, title: allowed ? 'Product removal allowed' : 'Product removal denied', icon: 'box' },
      actorId
    )
    return { success: true, allowProductRemoval: !!allowed }
  })

export const setDeleted = (db, target, deleted, actorId) =>
  attempt(async () => {
    const status = deleted ? 'Deleted' : target.status === 'Deleted' ? 'Active' : target.status
    await editShop(
      db,
      target,
      { deleted: !!deleted, status },
      { type: `seller_store_${deleted ? 'deleted' : 'restored'}`, title: deleted ? 'Store deleted' : 'Store restored', icon: 'trash' },
      actorId
    )
    return { success: true, deleted: !!deleted }
  })

// ---- admin: KYC -----------------------------------------------------------------------------------

export const reviewKyc = (db, target, approve, actorId) =>
  attempt(async () => {
    const batch = writeBatch(db)
    batch.update(
      doc(db, COL.shops, target.id),
      approve ? { verified: true, status: 'Active', 'kyc.status': 'Approved' } : { verified: false, 'kyc.status': 'Rejected' }
    )
    stageNotification(db, batch, target, {
      type: 'kyc',
      title: approve ? 'KYC Approved' : 'KYC Rejected',
      message: approve
        ? 'Your identity verification has been approved. You now have full access to all seller features, including adding products and withdrawals.'
        : 'Your identity verification could not be approved. Please review your submitted documents and resubmit.',
    })
    stageActivity(db, batch, {
      adminId: target.adminId,
      sellerId: target.id,
      actorId,
      type: approve ? 'kyc_approved' : 'kyc_rejected',
      title: approve ? 'KYC Approved' : 'KYC Rejected',
      entity: target.fullName,
      icon: 'shield',
    })
    await batch.commit()
    return { success: true }
  })

// ---- admin: notifications ---------------------------------------------------------------------------

function stageNotification(db, writer, target, { type = 'info', title, message }) {
  const ref = doc(collection(db, COL.notifications))
  writer.set(ref, { sellerId: target.id, adminId: target.adminId, type, title, message: message || '', read: false, createdAt: nowIso() })
}

export const sendNotification = (db, target, notification, actorId) =>
  attempt(async () => {
    const batch = writeBatch(db)
    stageNotification(db, batch, target, notification)
    stageActivity(db, batch, {
      adminId: target.adminId,
      sellerId: target.id,
      actorId,
      type: 'seller_notification',
      title: `Notification sent (${notification.type || 'info'})`,
      entity: target.fullName,
      icon: 'bell',
    })
    await batch.commit()
    return { success: true }
  })

// ---- admin: orders ----------------------------------------------------------------------------------

export const computeOrderTotals = (items) => {
  const total = items.reduce((sum, item) => sum + item.sell * item.qty, 0)
  const cost = items.reduce((sum, item) => sum + item.cost * item.qty, 0)
  return { total: round2(total), cost: round2(cost), profit: round2(total - cost) }
}

// What an order is made of, checked and shaped: `{ error }` when it cannot be given, else
// `{ items, customer, total, cost, profit, qty }`. Shared by giving an order now and scheduling one.
function orderContents(target, { items, customer } = {}) {
  if (!items?.length) return { error: 'Select at least one product' }
  if (!target.verified) return { error: 'Orders can only be given to verified sellers' }
  const normalizedItems = items.map((item) =>
    clean({
      // Items of a schedule already carry the id they were given when it was made.
      id: item.id && item.catalogId ? item.id : `${item.catalogId || item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      catalogId: item.catalogId || item.id,
      name: item.name,
      image: item.image,
      qty: item.qty || 1,
      cost: item.cost,
      sell: item.sell,
    })
  )
  const { total, cost, profit } = computeOrderTotals(normalizedItems)
  return { items: normalizedItems, customer: customer || {}, total, cost, profit, qty: normalizedItems.reduce((sum, item) => sum + item.qty, 0) }
}

// The order document for those contents, created now. `scheduledFor` records that it was scheduled.
function orderRecord(target, contents, scheduledFor) {
  const createdAt = nowIso()
  return {
    sellerId: target.id,
    adminId: target.adminId,
    sellerName: target.fullName,
    shopName: target.shopName,
    items: contents.items,
    customer: contents.customer,
    status: 'Unpaid',
    createdAt,
    scheduledFor: scheduledFor || null,
    total: contents.total,
    cost: contents.cost,
    profit: contents.profit,
    // Convenience fields for widgets that show one line per order (e.g. the seller Activity modal).
    productName: contents.items.length === 1 ? contents.items[0].name : `${contents.items.length} items`,
    customerName: contents.customer?.fullName || 'Customer',
    qty: contents.qty,
    time: new Date(createdAt).toLocaleString(),
  }
}

// Everything that giving an order writes, into a batch / transaction: the order, the seller's order
// counters, the note telling them to pay, and the admin's activity line. Returns the new order's ref.
function stageOrder(db, writer, target, order, actorId, title) {
  const orderRef = doc(collection(db, COL.orders))
  writer.set(orderRef, order)
  writer.update(doc(db, COL.shops, target.id), { 'orderStats.total': increment(1), 'orderStats.pending': increment(1) })
  stageNotification(db, writer, target, {
    type: 'order',
    title: 'New order assigned',
    message: `You've been given a new order with ${order.items.length} item${order.items.length === 1 ? '' : 's'} worth ${money(order.total)}. Pay ${money(order.cost)} to start processing it.`,
  })
  stageActivity(db, writer, { adminId: target.adminId, sellerId: target.id, actorId, type: 'order_given', title, entity: target.fullName, icon: 'package' })
  return orderRef
}

// Gives a verified seller an order. It starts "Unpaid": the seller pays its cost to start it.
export const createOrder = (db, target, { items, customer, scheduledFor } = {}, actorId) =>
  attempt(() => {
    const contents = orderContents(target, { items, customer })
    if (contents.error) return { success: false, error: contents.error }
    const order = orderRecord(target, contents, scheduledFor)
    const batch = writeBatch(db)
    const orderRef = stageOrder(db, batch, target, order, actorId, 'Order given to seller')
    return batch.commit().then(() => ({ success: true, order: { id: orderRef.id, ...order } }))
  })

// ---- admin: scheduled orders ------------------------------------------------------------------------
// An order the admin wants created later. It is stored as a schedule (`Scheduled`) and turned into a real
// order by `runScheduledOrder` once its time has come — done by the admin console while it is open (there
// is no server to do it), so a schedule that falls due while the console is closed runs the next time it
// is opened. A schedule ends as `Created` (with the `orderId`), `Cancelled` or `Failed` (with the `error`).

export const SCHEDULE_STATUSES = ['Scheduled', 'Created', 'Cancelled', 'Failed']

const futureTime = (value) => {
  const at = Date.parse(value)
  return Number.isNaN(at) || at <= Date.now() ? null : new Date(at).toISOString()
}

export const scheduleOrder = (db, target, { items, customer, scheduledFor } = {}, actorId) =>
  attempt(async () => {
    const contents = orderContents(target, { items, customer })
    if (contents.error) return { success: false, error: contents.error }
    const when = futureTime(scheduledFor)
    if (!when) return { success: false, error: 'Pick a time in the future.' }
    const schedule = {
      sellerId: target.id,
      adminId: target.adminId,
      sellerName: target.fullName,
      shopName: target.shopName,
      ...contents,
      scheduledFor: when,
      status: 'Scheduled',
      createdAt: nowIso(),
      createdBy: actorId || '',
    }
    const ref = doc(collection(db, COL.scheduledOrders))
    const batch = writeBatch(db)
    batch.set(ref, schedule)
    stageActivity(db, batch, { adminId: target.adminId, sellerId: target.id, actorId, type: 'order_scheduled', title: 'Order scheduled for seller', entity: target.fullName, icon: 'package', meta: { scheduledFor: when } })
    await batch.commit()
    return { success: true, schedule: { id: ref.id, ...schedule } }
  })

// Reads a schedule that must still be waiting, or refuses with what happened to it.
async function openSchedule(tx, db, id) {
  const ref = doc(db, COL.scheduledOrders, id)
  const snap = await tx.get(ref)
  if (!snap.exists()) refuse('This scheduled order no longer exists.')
  const schedule = snap.data()
  if (schedule.status !== 'Scheduled') refuse(`This scheduled order was already ${schedule.status.toLowerCase()}.`)
  return { ref, schedule }
}

export const cancelScheduledOrder = (db, id, actorId) =>
  attempt(() =>
    runTransaction(db, async (tx) => {
      const { ref, schedule } = await openSchedule(tx, db, id)
      tx.update(ref, { status: 'Cancelled', closedAt: nowIso() })
      stageActivity(db, tx, { adminId: schedule.adminId, sellerId: schedule.sellerId, actorId, type: 'order_schedule_cancelled', title: 'Scheduled order cancelled', entity: schedule.sellerName, icon: 'package' })
      return { success: true }
    })
  )

export const rescheduleOrder = (db, id, scheduledFor) =>
  attempt(() => {
    const when = futureTime(scheduledFor)
    if (!when) return { success: false, error: 'Pick a time in the future.' }
    return runTransaction(db, async (tx) => {
      const { ref } = await openSchedule(tx, db, id)
      tx.update(ref, { scheduledFor: when })
      return { success: true, scheduledFor: when }
    })
  })

// Turns a due schedule into the real order, atomically with marking it `Created`; another console that
// got there first makes this a no-op (`skipped`). `force` runs it before its time ("Run now"). A schedule
// whose seller can no longer be given an order is closed as `Failed` with the reason.
export const runScheduledOrder = (db, id, actorId, { force = false } = {}) =>
  attempt(() =>
    runTransaction(db, async (tx) => {
      const ref = doc(db, COL.scheduledOrders, id)
      const snap = await tx.get(ref)
      if (!snap.exists() || snap.data().status !== 'Scheduled') return { success: true, skipped: true }
      const schedule = snap.data()
      if (!force && Date.parse(schedule.scheduledFor) > Date.now()) return { success: true, skipped: true }

      const shopSnap = await tx.get(doc(db, COL.shops, schedule.sellerId))
      const shop = shopSnap.exists() ? { id: shopSnap.id, ...shopSnap.data() } : null
      const problem = !shop
        ? 'The seller no longer exists.'
        : shop.adminId !== schedule.adminId
          ? 'The seller is no longer one of yours.'
          : shop.deleted || shop.suspended
            ? "The seller's account is not active."
            : !shop.verified
              ? 'The seller is not verified.'
              : ''
      if (problem) {
        tx.update(ref, { status: 'Failed', error: problem, closedAt: nowIso() })
        return { success: false, failed: true, error: problem }
      }

      const contents = orderContents(shop, schedule)
      const order = orderRecord(shop, contents, schedule.scheduledFor)
      const orderRef = stageOrder(db, tx, shop, order, actorId, force ? 'Scheduled order given early' : 'Scheduled order given to seller')
      tx.update(ref, { status: 'Created', orderId: orderRef.id, closedAt: order.createdAt })
      return { success: true, orderId: orderRef.id }
    })
  )

const STATUS_MESSAGES = {
  Pickup: () => 'Your order has been picked up and is being prepared for delivery.',
  'On the way': () => 'Your order is on the way to the customer.',
  'Out for delivery': () => 'Your order is out for delivery.',
  Delivered: (order) => `Your order has been delivered. ${money(order.profit)} profit has been added to your shop balance.`,
  Cancelled: () => 'Your order was cancelled by the admin.',
}

// Moves an order through its lifecycle. Delivering it releases the seller's profit into their
// balance — once: a flag on the order stops a second "Delivered" from paying twice.
export const setOrderStatus = (db, target, orderId, status, actorId) =>
  attempt(() => {
    if (!ORDER_STATUSES.includes(status)) return { success: false, error: 'Invalid order status' }
    return runTransaction(db, async (tx) => {
      const shopRef = doc(db, COL.shops, target.id)
      const orderRef = doc(db, COL.orders, orderId)
      const [shopSnap, orderSnap] = [await tx.get(shopRef), await tx.get(orderRef)]
      if (!shopSnap.exists()) refuse('Seller not found')
      if (!orderSnap.exists() || orderSnap.data().sellerId !== target.id) refuse('Order not found')
      const shop = shopSnap.data()
      const order = orderSnap.data()
      const done = (value) => ['Delivered', 'Cancelled'].includes(value)
      const stats = { total: 0, pending: 0, delivered: 0, ...(shop.orderStats || {}) }

      const orderChanges = { status, updatedAt: nowIso() }
      const shopChanges = {
        orderStats: {
          ...stats,
          pending: Math.max(0, stats.pending + (done(order.status) ? 0 : -1) + (done(status) ? 0 : 1)),
          delivered: Math.max(0, stats.delivered + (order.status === 'Delivered' ? -1 : 0) + (status === 'Delivered' ? 1 : 0)),
        },
      }
      if (status === 'Delivered' && !order.profitCredited) {
        orderChanges.profitCredited = true
        shopChanges.balance = round2((shop.balance || 0) + (order.profit || 0))
      }
      tx.update(orderRef, orderChanges)
      tx.update(shopRef, shopChanges)
      // The profit released on delivery is a balance change: it carries its amount so the feed can say so.
      const credited = orderChanges.profitCredited ? order.profit || 0 : undefined
      stageActivity(db, tx, { adminId: target.adminId, sellerId: target.id, actorId, type: 'order_status_changed', title: `Order marked ${status}`, entity: shop.fullName, icon: 'package', amount: credited, meta: credited ? { credited: true } : undefined })
      if (STATUS_MESSAGES[status]) {
        stageNotification(db, tx, target, { type: 'order', title: `Order ${status.toLowerCase()}`, message: STATUS_MESSAGES[status](order) })
      }
      return { success: true }
    })
  })

// ---- admin: withdrawals -----------------------------------------------------------------------------

// `reference` is the bank / blockchain transaction id the admin paid with (internal audit trail and shown
// to the seller); `message` replaces the default note the seller is sent about the decision.
export const processWithdrawal = (db, target, withdrawalId, approve, actorId, { reference = '', message = '' } = {}) =>
  attempt(() =>
    runTransaction(db, async (tx) => {
      const shopRef = doc(db, COL.shops, target.id)
      const requestRef = doc(db, COL.withdrawals, withdrawalId)
      const [shopSnap, requestSnap] = [await tx.get(shopRef), await tx.get(requestRef)]
      if (!shopSnap.exists()) refuse('Seller not found')
      if (!requestSnap.exists() || requestSnap.data().sellerId !== target.id) refuse('Withdrawal not found')
      const shop = shopSnap.data()
      const request = requestSnap.data()
      if (request.status !== 'Pending') refuse('This request has already been processed')
      const nextStatus = approve ? 'Completed' : 'Rejected'
      const ref = approve ? text(reference, 200) : ''
      const note = text(message, 1000)
      tx.update(requestRef, clean({ status: nextStatus, processedAt: nowIso(), reference: ref || undefined, sellerMessage: note || undefined }))
      if (!approve) tx.update(shopRef, { balance: round2((shop.balance || 0) + request.amount) })
      stageActivity(db, tx, {
        adminId: target.adminId,
        sellerId: target.id,
        actorId,
        type: approve ? 'withdrawal_approved' : 'withdrawal_rejected',
        title: `Withdrawal ${nextStatus.toLowerCase()}`,
        entity: shop.fullName,
        icon: 'wallet',
        amount: request.amount,
        meta: { method: methodSummary(request.payoutMethod, request.method) },
      })
      stageNotification(db, tx, target, {
        type: 'withdrawal',
        title: approve ? 'Withdrawal approved' : 'Withdrawal rejected',
        message: note || (approve
          ? `Your withdrawal of ${money(request.amount)} has been approved and sent to your payout method.`
          : `Your withdrawal request of ${money(request.amount)} was rejected and the amount has been returned to your shop balance.`),
      })
      return { success: true }
    })
  )

// ---- admin: views campaigns -------------------------------------------------------------------------

export const startViewsCampaign = (db, target, config, actorId) =>
  attempt(async () => {
    const { totalViews, hours, minutes, batches } = config
    const now = new Date()
    const numBatches = Math.max(1, parseInt(batches, 10) || 1)
    const total = parseInt(totalViews, 10) || 0
    const campaign = {
      sellerId: target.id,
      adminId: target.adminId,
      totalViews: total,
      currentViews: 0,
      status: 'Running',
      batches: `0/${numBatches}`,
      started: now.toLocaleString(),
      ends: new Date(now.getTime() + ((hours || 0) * 60 + (minutes || 0)) * 60 * 1000).toLocaleString(),
      hours: hours || 0,
      minutes: minutes || 0,
      batchCount: numBatches,
      completedBatches: 0,
      perBatch: Math.max(1, Math.round(total / numBatches)),
      config: clean(config),
      createdAt: now.toISOString(),
    }
    const ref = doc(collection(db, COL.campaigns))
    const batch = writeBatch(db)
    batch.set(ref, campaign)
    stageActivity(db, batch, { adminId: target.adminId, sellerId: target.id, actorId, type: 'views_campaign_start', title: `Views campaign started (${total} views)`, entity: target.fullName, icon: 'trending' })
    await batch.commit()
    return { success: true, campaign: { id: ref.id, ...campaign } }
  })

export const setCampaignStatus = (db, campaignId, status) =>
  attempt(async () => {
    await updateDoc(doc(db, COL.campaigns, campaignId), { status })
    return { success: true }
  })

export const addInstantViews = (db, target, count, actorId) =>
  attempt(async () => {
    const n = parseInt(count, 10) || 0
    if (n <= 0) return { success: false, error: 'Invalid views count' }
    await editShop(db, target, { 'views.total': increment(n), 'views.today': increment(n) }, { type: 'views_instant_add', title: `Instant views added (+${n})`, icon: 'eye' }, actorId)
    return { success: true }
  })
