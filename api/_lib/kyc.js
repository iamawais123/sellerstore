// A new seller's KYC, as the admin gets it on Telegram: their details as a message, then the identity
// document(s) they uploaded (front and back) as photos or PDFs. Sent right after the short alert for the
// sign-up / resubmission that brought it in (see syncAdmin).
import { composeMessages, escapeHtml } from './format.js'

// The activity lines that mean "this seller's KYC is now waiting for you".
export const KYC_TYPES = new Set(['seller_signup', 'kyc_submitted'])

const DOCUMENT_TYPES = { 'national-id': 'National ID card', national_id: 'National ID card', passport: 'Passport', 'drivers-license': "Driver's licence", driving_license: "Driver's licence" }
const prettyType = (value) => DOCUMENT_TYPES[value] || String(value || '').replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

const has = (value) => value !== undefined && value !== null && String(value).trim() !== ''

const address = (shop) => {
  if (has(shop.kyc?.address)) return shop.kyc.address
  const place = shop.address && typeof shop.address === 'object' ? shop.address : {}
  return [place.street, place.city, place.state, place.postalCode, place.country].filter(has).join(', ')
}

const when = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

// The seller's details, ready for composeMessages.
export function renderKyc(shop, { hasDocuments }) {
  const kyc = shop.kyc || {}
  const lines = [
    ['🏪', `Shop: ${shop.shopName || '—'}`],
    ['👤', `Owner: ${shop.ownerName || shop.fullName || '—'}`],
    ['✉️', `Email: ${shop.email || '—'}`],
  ]
  if (has(shop.phone)) lines.push(['📞', `Phone: ${shop.phone}`])
  if (has(kyc.country)) lines.push(['🌍', `Country: ${kyc.country}`])
  if (has(address(shop))) lines.push(['📍', `Address: ${address(shop)}`])
  if (has(kyc.docType)) lines.push(['🪪', `Document: ${prettyType(kyc.docType)}`])
  if (has(kyc.submittedAt) && when(kyc.submittedAt)) lines.push(['🕒', `Submitted: ${when(kyc.submittedAt)}`])
  lines.push(['📋', `Status: ${kyc.status || 'Pending'}`])
  if (!hasDocuments) lines.push(['⚠️', 'No identity documents were uploaded.'])
  return { emoji: '🪪', title: `KYC to review: ${shop.shopName || shop.fullName || 'new seller'}`, lines }
}

const slug = (text) => String(text || 'seller').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'seller'

// Sends one seller's KYC to a chat: details first, then front and back. `send` and `sendFile` deliver a
// message / a stored picture or PDF. Nothing is sent when the seller does not belong to `adminId` (a
// sanity check: an admin only ever gets their own sellers' documents).
export async function sendKyc({ db, adminId, sellerId, chatId, send, sendFile, dashboardUrl = '' }) {
  const [shopSnap, docsSnap] = await Promise.all([db.collection('shops').doc(sellerId).get(), db.collection('kycDocuments').doc(sellerId).get()])
  if (!shopSnap.exists) return false
  const shop = shopSnap.data()
  if (shop.adminId !== adminId) return false
  const documents = docsSnap.exists && docsSnap.data().adminId === adminId ? docsSnap.data() : {}
  const sides = [
    ['front', 'Front'],
    ['back', 'Back'],
  ].filter(([key]) => documents[key])

  const [details] = composeMessages([renderKyc(shop, { hasDocuments: sides.length > 0 })], { dashboardUrl })
  await send(chatId, details)
  for (const [key, label] of sides) {
    const caption = `🪪 ${label} · ${escapeHtml(shop.shopName || shop.fullName || 'seller')}`
    await sendFile(chatId, documents[key], { name: `kyc-${key}-${slug(shop.shopName)}`, caption })
  }
  return true
}
