// End-to-end test of the shop data layer (src/firebase/shopData.js) against the security rules:
// the real functions the three apps call, run as the real identities (seller, admin, super admin)
// on the Firestore emulator. Run with `npm run test:rules` (needs Java for the emulator).
//
// The happy path is the whole business flow — KYC, funding, an order, delivery, a withdrawal — and
// the rest is what a malicious seller or a neighbouring admin would try.
import { readFileSync } from 'node:fs'
import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import * as shop from '../src/firebase/shopData.js'

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':')
let env

const now = '2026-09-19T00:00:00.000Z'
const SUPER = { role: 'superadmin', fullName: 'Sam Super', email: 'sa1@x.com', inviteCode: 'SUPERONE', createdAt: now }
const adminProfile = (name) => ({ role: 'admin', fullName: name, email: `${name}@x.com`, inviteCode: `CODE${name}`.toUpperCase(), superAdminId: 'sa1', registeredWithCode: 'SUPERONE', createdAt: now, removed: false })
const sellerProfile = (name, adminId) => ({ role: 'seller', fullName: name, email: `${name}@x.com`, shopName: `${name} Shop`, adminId, inviteCode: 'CODE', createdAt: now, memberSince: 'Sep 2026' })

const db = (uid) => env.authenticatedContext(uid, { email: `${uid}@x.com` }).firestore()

// Seeds users only (the shops are created through the app code under test).
async function seed() {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.firestore()
    await setDoc(doc(s, 'users/sa1'), SUPER)
    await setDoc(doc(s, 'users/a1'), adminProfile('a1'))
    await setDoc(doc(s, 'users/a2'), adminProfile('a2'))
    await setDoc(doc(s, 'users/s1'), sellerProfile('s1', 'a1'))
    await setDoc(doc(s, 'users/s2'), sellerProfile('s2', 'a2'))
    await setDoc(doc(s, 'users/c1'), { role: 'customer', fullName: 'Cy', email: 'c1@x.com', createdAt: now })
  })
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-usellerstore',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) },
  })
})
after(async () => env?.cleanup())
beforeEach(seed)

const ITEM = { catalogId: 'p1', name: 'Widget', qty: 2, cost: 15, sell: 25 } // cost 30, sell 50, profit 20

// A verified, funded seller shop for s1 under a1, built through the same calls the apps make.
async function verifiedShop({ balance = 100 } = {}) {
  const sellerDb = db('s1')
  const record = await shop.ensureShop(sellerDb, 's1', { id: 's1', ...sellerProfile('s1', 'a1') })
  assert.ok(record, 'the seller can create their own shop')
  const target = { ...record, id: 's1' }
  assert.equal((await shop.reviewKyc(db('a1'), target, true, 'a1')).success, true)
  if (balance) assert.equal((await shop.adjustBalance(db('a1'), target, balance, 'add', 'a1')).success, true)
  return { ...target, verified: true, status: 'Active' }
}

const read = async (s, path) => (await getDoc(doc(s, path))).data()
const orderId = async () => (await getDocs(query(collection(db('a1'), 'orders'), where('adminId', '==', 'a1')))).docs[0].id

describe('the shop lifecycle', () => {
  it('creates an empty shop for a seller, and the admin sees it', async () => {
    const record = await shop.ensureShop(db('s1'), 's1', { id: 's1', ...sellerProfile('s1', 'a1') })
    assert.equal(record.balance, 0)
    assert.equal(record.verified, false)
    assert.equal(record.adminId, 'a1')
    const mine = await getDocs(query(collection(db('a1'), 'shops'), where('adminId', '==', 'a1')))
    assert.deepEqual(mine.docs.map((d) => d.id), ['s1'])
  })

  it('refuses a shop that starts with money, pre-verified, or under someone else\'s admin', async () => {
    const good = shop.newShopRecord(sellerProfile('s1', 'a1'))
    await assertFails(setDoc(doc(db('s1'), 'shops/s1'), { ...good, balance: 500 }))
    await assertFails(setDoc(doc(db('s1'), 'shops/s1'), { ...good, verified: true }))
    await assertFails(setDoc(doc(db('s1'), 'shops/s1'), { ...good, productLimit: 5000 }))
    await assertFails(setDoc(doc(db('s1'), 'shops/s1'), { ...good, adminId: 'a2' }))
    await assertFails(setDoc(doc(db('s1'), 'shops/s1'), { ...good, kyc: { ...good.kyc, status: 'Approved' } }))
    await assertSucceeds(setDoc(doc(db('s1'), 'shops/s1'), good))
  })

  it('only lets a seller create their own shop, and only if they really are a seller', async () => {
    const good = shop.newShopRecord(sellerProfile('s1', 'a1'))
    await assertFails(setDoc(doc(db('s2'), 'shops/s1'), good))
    await assertFails(setDoc(doc(db('c1'), 'shops/c1'), { ...good, adminId: null }))
    await assertFails(setDoc(doc(db('a1'), 'shops/a1'), good))
  })

  it('registers a seller atomically: profile + shop + KYC images + a log line', async () => {
    await env.clearFirestore()
    await env.withSecurityRulesDisabled(async (ctx) => {
      const admin = ctx.firestore()
      await setDoc(doc(admin, 'users/a1'), adminProfile('a1'))
      await setDoc(doc(admin, 'inviteCodes/CODEA1'), { ownerUid: 'a1', ownerRole: 'admin', ownerName: 'a1', disabled: false, createdAt: now })
    })
    const s = db('new1')
    const profile = { ...sellerProfile('new1', 'a1'), inviteCode: 'CODEA1' }
    const batch = writeBatch(s)
    batch.set(doc(s, 'users/new1'), profile)
    batch.set(doc(s, 'shops/new1'), shop.newShopRecord(profile, { hasDocuments: true }))
    batch.set(doc(s, 'kycDocuments/new1'), { sellerId: 'new1', adminId: 'a1', front: 'data:image/jpeg;base64,AAAA', back: 'data:image/jpeg;base64,BBBB', updatedAt: now })
    shop.stageActivity(s, batch, { adminId: 'a1', sellerId: 'new1', actorId: 'new1', type: 'seller_signup', title: 'New seller registered', entity: 'new1', icon: 'signup' })
    await assertSucceeds(batch.commit())

    // The reviewing admin can open the documents; another admin and strangers cannot.
    assert.equal((await shop.loadKycDocuments(db('a1'), 'new1')).front, 'data:image/jpeg;base64,AAAA')
    assert.equal(await shop.loadKycDocuments(db('a2'), 'new1'), null)
    assert.equal(await shop.loadKycDocuments(db('s1'), 'new1'), null)
    await assertFails(getDocs(collection(db('a1'), 'kycDocuments')))
  })

  it('rejects oversized KYC documents', async () => {
    await shop.ensureShop(db('s1'), 's1', { id: 's1', ...sellerProfile('s1', 'a1') })
    const huge = 'x'.repeat(470000)
    await assertFails(setDoc(doc(db('s1'), 'kycDocuments/s1'), { sellerId: 's1', adminId: 'a1', front: huge, back: 'y', updatedAt: now }))
  })
})

describe('KYC review', () => {
  it('lets the admin approve, notifying the seller — and never the seller themself', async () => {
    const record = await shop.ensureShop(db('s1'), 's1', { id: 's1', ...sellerProfile('s1', 'a1') })
    const target = { ...record, id: 's1' }
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { verified: true }))
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { 'kyc.status': 'Approved' }))
    assert.equal((await shop.reviewKyc(db('a1'), target, true, 'a1')).success, true)
    const data = await read(db('s1'), 'shops/s1')
    assert.equal(data.verified, true)
    assert.equal(data.kyc.status, 'Approved')
    assert.equal(data.status, 'Active')
    const notes = await getDocs(query(collection(db('s1'), 'notifications'), where('sellerId', '==', 's1')))
    assert.equal(notes.docs[0].data().title, 'KYC Approved')
    assert.equal(notes.docs[0].data().read, false)
  })

  it('does not let another admin review someone else\'s seller', async () => {
    const record = await shop.ensureShop(db('s1'), 's1', { id: 's1', ...sellerProfile('s1', 'a1') })
    const result = await shop.reviewKyc(db('a2'), { ...record, id: 's1' }, true, 'a2')
    assert.equal(result.success, false)
    assert.equal((await read(db('s1'), 'shops/s1')).verified, false)
  })

  it('records a rejection', async () => {
    const record = await shop.ensureShop(db('s1'), 's1', { id: 's1', ...sellerProfile('s1', 'a1') })
    await shop.reviewKyc(db('a1'), { ...record, id: 's1' }, false, 'a1')
    const data = await read(db('a1'), 'shops/s1')
    assert.equal(data.verified, false)
    assert.equal(data.kyc.status, 'Rejected')
  })
})

describe('balances', () => {
  it('lets the admin credit and debit a balance, with a ledger trail', async () => {
    const target = await verifiedShop({ balance: 0 })
    assert.equal((await shop.adjustBalance(db('a1'), target, 50.1, 'add', 'a1')).newBalance, 50.1)
    assert.equal((await shop.adjustBalance(db('a1'), target, 0.2, 'add', 'a1')).newBalance, 50.3)
    assert.equal((await shop.adjustBalance(db('a1'), target, 1000, 'deduct', 'a1')).newBalance, 0)
    assert.equal((await shop.adjustBalance(db('a1'), target, -5, 'add', 'a1')).success, false)
    const ledger = await getDocs(query(collection(db('a1'), 'ledger'), where('adminId', '==', 'a1')))
    assert.equal(ledger.size, 3)
  })

  it('never lets a seller raise their own balance', async () => {
    await verifiedShop({ balance: 10 })
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { balance: 1000000 }))
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { guarantee: 5 }))
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { rating: 1, productLimit: 9999 }))
  })

  it('keeps balances scoped to the owning admin', async () => {
    const target = await verifiedShop({ balance: 10 })
    assert.equal((await shop.adjustBalance(db('a2'), target, 999, 'add', 'a2')).success, false)
    assert.equal((await read(db('a1'), 'shops/s1')).balance, 10)
  })

  it('applies the guarantee, rating and limit edits and refuses bad values', async () => {
    const target = await verifiedShop({ balance: 0 })
    assert.equal((await shop.adjustGuarantee(db('a1'), target, 40, 'add', 'a1')).newGuarantee, 40)
    assert.equal((await shop.setRating(db('a1'), target, 4.257, 'a1')).newRating, 4.26)
    assert.equal((await shop.setRating(db('a1'), target, 9, 'a1')).success, false)
    assert.equal((await shop.setProductLimit(db('a1'), target, 12, 'a1')).newLimit, 12)
    const data = await read(db('s1'), 'shops/s1')
    assert.deepEqual([data.guarantee, data.rating, data.productLimit], [40, 4.26, 12])
  })
})

describe('orders', () => {
  it('runs the whole flow: assign, pay, deliver — profit credited exactly once', async () => {
    const target = await verifiedShop({ balance: 100 })
    const given = await shop.createOrder(db('a1'), target, { items: [ITEM], customer: { fullName: 'Buyer' } }, 'a1')
    assert.equal(given.success, true)
    assert.deepEqual([given.order.total, given.order.cost, given.order.profit], [50, 30, 20])

    // the seller sees it and pays
    const id = await orderId()
    assert.equal((await getDoc(doc(db('s1'), `orders/${id}`))).data().status, 'Unpaid')
    assert.equal((await shop.payOrder(db('s1'), 's1', id)).success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).balance, 70)
    assert.equal((await shop.payOrder(db('s1'), 's1', id)).success, false, 'cannot pay twice')

    // the admin moves it along and delivers
    assert.equal((await shop.setOrderStatus(db('a1'), target, id, 'Pickup', 'a1')).success, true)
    assert.equal((await shop.setOrderStatus(db('a1'), target, id, 'Delivered', 'a1')).success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).balance, 90)
    // moving it back and delivering again must not pay the profit a second time
    await shop.setOrderStatus(db('a1'), target, id, 'Out for delivery', 'a1')
    await shop.setOrderStatus(db('a1'), target, id, 'Delivered', 'a1')
    const after = await read(db('s1'), 'shops/s1')
    assert.equal(after.balance, 90)
    assert.deepEqual(after.orderStats, { total: 1, pending: 0, delivered: 1 })
  })

  it('refuses payment when the balance is too low', async () => {
    const target = await verifiedShop({ balance: 10 })
    await shop.createOrder(db('a1'), target, { items: [ITEM] }, 'a1')
    const result = await shop.payOrder(db('s1'), 's1', await orderId())
    assert.equal(result.success, false)
    assert.match(result.error, /balance is too low/)
    assert.equal((await read(db('s1'), 'shops/s1')).balance, 10)
  })

  it('cannot be paid for less than its cost, or without paying at all', async () => {
    const target = await verifiedShop({ balance: 100 })
    await shop.createOrder(db('a1'), target, { items: [ITEM] }, 'a1')
    const id = await orderId()
    // marking it paid with no balance change
    await assertFails(updateDoc(doc(db('s1'), `orders/${id}`), { status: 'Paid', paidAt: now }))
    // paying 1 instead of 30
    const s = db('s1')
    const cheat = writeBatch(s)
    cheat.update(doc(s, `orders/${id}`), { status: 'Paid', paidAt: now })
    cheat.update(doc(s, 'shops/s1'), { balance: 99 })
    await assertFails(cheat.commit())
    // and a seller can't tamper with the order's price or status otherwise
    await assertFails(updateDoc(doc(s, `orders/${id}`), { cost: 0 }))
    await assertFails(updateDoc(doc(s, `orders/${id}`), { status: 'Delivered' }))
    assert.equal((await read(s, 'shops/s1')).balance, 100)
  })

  it('only assigns orders to verified sellers of the calling admin', async () => {
    const record = await shop.ensureShop(db('s1'), 's1', { id: 's1', ...sellerProfile('s1', 'a1') })
    const unverified = { ...record, id: 's1' }
    assert.equal((await shop.createOrder(db('a1'), unverified, { items: [ITEM] }, 'a1')).success, false)
    // even bypassing the client check, the rules refuse
    const forced = { ...unverified, verified: true }
    assert.equal((await shop.createOrder(db('a1'), forced, { items: [ITEM] }, 'a1')).success, false)
    const target = await verifiedShop({ balance: 0 })
    assert.equal((await shop.createOrder(db('a2'), { ...target, adminId: 'a2' }, { items: [ITEM] }, 'a2')).success, false)
    assert.equal((await shop.createOrder(db('s1'), target, { items: [ITEM] }, 's1')).success, false, 'a seller cannot give themself orders')
  })

  it('hides orders from other sellers and other admins', async () => {
    const target = await verifiedShop({ balance: 0 })
    await shop.createOrder(db('a1'), target, { items: [ITEM] }, 'a1')
    assert.equal((await getDocs(query(collection(db('s2'), 'orders'), where('sellerId', '==', 's2')))).size, 0)
    await assertFails(getDocs(query(collection(db('s2'), 'orders'), where('sellerId', '==', 's1'))))
    await assertFails(getDocs(query(collection(db('a2'), 'orders'), where('adminId', '==', 'a1'))))
    assert.equal((await getDocs(query(collection(db('sa1'), 'orders')))).size, 1)
  })

  it('lets only the owning admin change an order\'s status', async () => {
    const target = await verifiedShop({ balance: 0 })
    await shop.createOrder(db('a1'), target, { items: [ITEM] }, 'a1')
    const id = await orderId()
    assert.equal((await shop.setOrderStatus(db('a2'), { ...target, adminId: 'a2' }, id, 'Delivered', 'a2')).success, false)
    assert.equal((await shop.setOrderStatus(db('a1'), target, id, 'Nonsense', 'a1')).success, false)
    assert.equal((await shop.setOrderStatus(db('s1'), target, id, 'Delivered', 's1')).success, false)
  })
})

describe('withdrawals', () => {
  it('moves the money out on request, and back if the admin rejects it', async () => {
    const target = await verifiedShop({ balance: 100 })
    const method = { id: 'm1', label: 'My bank', type: 'bank' }
    const request = await shop.requestWithdrawal(db('s1'), 's1', 40, method)
    assert.equal(request.success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).balance, 60)

    assert.equal((await shop.processWithdrawal(db('a1'), target, request.request.id, false, 'a1')).success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).balance, 100)
    assert.equal((await shop.processWithdrawal(db('a1'), target, request.request.id, true, 'a1')).success, false, 'already processed')
  })

  it('keeps the money out when the admin approves', async () => {
    const target = await verifiedShop({ balance: 100 })
    const request = await shop.requestWithdrawal(db('s1'), 's1', 25.5, { label: 'Wallet' })
    assert.equal((await shop.processWithdrawal(db('a1'), target, request.request.id, true, 'a1')).success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).balance, 74.5)
    const notes = await getDocs(query(collection(db('s1'), 'notifications'), where('sellerId', '==', 's1')))
    assert.ok(notes.docs.some((d) => d.data().title === 'Withdrawal approved'))
  })

  it('refuses amounts beyond the balance, non-positive amounts, and blocked stores', async () => {
    const target = await verifiedShop({ balance: 50 })
    assert.equal((await shop.requestWithdrawal(db('s1'), 's1', 51, { label: 'x' })).success, false)
    assert.equal((await shop.requestWithdrawal(db('s1'), 's1', 0, { label: 'x' })).success, false)
    assert.equal((await shop.requestWithdrawal(db('s1'), 's1', -5, { label: 'x' })).success, false)
    await shop.setWithdrawalsBlocked(db('a1'), target, true, 'a1')
    const blocked = await shop.requestWithdrawal(db('s1'), 's1', 10, { label: 'x' })
    assert.equal(blocked.success, false)
    assert.match(blocked.error, /blocked/)
    assert.equal((await read(db('s1'), 'shops/s1')).balance, 50)
  })

  it('cannot be forged: no withdrawal without paying it out, no self-approval', async () => {
    const target = await verifiedShop({ balance: 100 })
    const s = db('s1')
    const forged = { sellerId: 's1', adminId: 'a1', amount: 60, method: 'x', payoutMethod: null, status: 'Pending', createdAt: now }
    await assertFails(setDoc(doc(s, 'withdrawals/w1'), forged)) // balance untouched
    const half = writeBatch(s)
    half.set(doc(s, 'withdrawals/w1'), forged)
    half.update(doc(s, 'shops/s1'), { balance: 90 }) // only 10 deducted for a 60 request
    await assertFails(half.commit())
    await assertFails(setDoc(doc(s, 'withdrawals/w2'), { ...forged, status: 'Completed' }))

    const real = await shop.requestWithdrawal(s, 's1', 30, { label: 'x' })
    await assertFails(updateDoc(doc(s, `withdrawals/${real.request.id}`), { status: 'Completed' }))
    // a rejection must refund exactly: nothing less
    const admin = db('a1')
    const partial = writeBatch(admin)
    partial.update(doc(admin, `withdrawals/${real.request.id}`), { status: 'Rejected', processedAt: now })
    await assertFails(partial.commit())
    assert.equal(target.id, 's1')
  })

  it('shows requests to the seller and the owning admin only', async () => {
    await verifiedShop({ balance: 100 })
    await shop.requestWithdrawal(db('s1'), 's1', 30, { label: 'x' })
    assert.equal((await getDocs(query(collection(db('a1'), 'withdrawals'), where('adminId', '==', 'a1')))).size, 1)
    assert.equal((await getDocs(query(collection(db('a2'), 'withdrawals'), where('adminId', '==', 'a2')))).size, 0)
    await assertFails(getDocs(query(collection(db('a2'), 'withdrawals'), where('adminId', '==', 'a1'))))
  })

  it('refuses a withdrawal on a suspended store', async () => {
    const target = await verifiedShop({ balance: 100 })
    await shop.setSuspended(db('a1'), target, true, 'a1')
    assert.equal((await shop.requestWithdrawal(db('s1'), 's1', 10, { label: 'x' })).success, false)
  })

  it('records the payout reference and the message the admin sends the seller', async () => {
    const target = await verifiedShop({ balance: 100 })
    const request = await shop.requestWithdrawal(db('s1'), 's1', 40, { label: 'Bank', type: 'bank' })
    const done = await shop.processWithdrawal(db('a1'), target, request.request.id, true, 'a1', { reference: '0x9f12', message: 'Paid, check your bank.' })
    assert.equal(done.success, true)
    const saved = await read(db('s1'), `withdrawals/${request.request.id}`)
    assert.equal(saved.status, 'Completed')
    assert.equal(saved.reference, '0x9f12')
    assert.equal(saved.sellerMessage, 'Paid, check your bank.')
    const notes = await getDocs(query(collection(db('s1'), 'notifications'), where('sellerId', '==', 's1')))
    assert.ok(notes.docs.some((d) => d.data().title === 'Withdrawal approved' && d.data().message === 'Paid, check your bank.'))
  })

  it('lets an admin file a withdrawal for a seller: pending, balance moved, seller told', async () => {
    const target = await verifiedShop({ balance: 100 })
    const method = { type: 'bank', label: 'Chase', bankName: 'Chase', holderName: 'S One', accountNumber: '123456' }
    const filed = await shop.requestWithdrawal(db('a1'), 's1', 35, method, 'a1', { onBehalf: true, note: 'Asked on WhatsApp', notify: true })
    assert.equal(filed.success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).balance, 65)
    const saved = await read(db('a1'), `withdrawals/${filed.request.id}`)
    assert.equal(saved.status, 'Pending')
    assert.equal(saved.initiatedBy, 'admin')
    assert.equal(saved.note, 'Asked on WhatsApp')
    assert.equal(saved.payoutMethod.accountNumber, '123456')
    const notes = await getDocs(query(collection(db('s1'), 'notifications'), where('sellerId', '==', 's1')))
    assert.ok(notes.docs.some((d) => d.data().title === 'Withdrawal requested'))

    // without "notify seller" nothing is sent, and the admin can still decide it afterwards
    const quiet = await shop.requestWithdrawal(db('a1'), 's1', 5, method, 'a1', { onBehalf: true })
    assert.equal(quiet.success, true)
    const after = await getDocs(query(collection(db('s1'), 'notifications'), where('sellerId', '==', 's1')))
    assert.equal(after.size, notes.size)
    assert.equal((await shop.processWithdrawal(db('a1'), target, quiet.request.id, false, 'a1')).success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).balance, 65)
  })

  it('will not let a seller pose as the admin, nor another admin file for their seller', async () => {
    await verifiedShop({ balance: 100 })
    const forged = shop.requestWithdrawal(db('s1'), 's1', 10, { label: 'x' }, 's1', { onBehalf: true })
    assert.equal((await forged).success, false)
    assert.equal((await shop.requestWithdrawal(db('a2'), 's1', 10, { label: 'x' }, 'a2', { onBehalf: true })).success, false)
    assert.equal((await read(db('s1'), 'shops/s1')).balance, 100)
  })
})

describe('catalogue', () => {
  it('adds products up to the limit, and stops when removal is denied', async () => {
    const target = await verifiedShop({ balance: 0 })
    await shop.setProductLimit(db('a1'), target, 3, 'a1')
    const added = await shop.addProductsToShop(db('s1'), 's1', ['p1', 'p2', 'p3', 'p4'])
    assert.equal(added.added, 3)
    assert.equal((await shop.addProductsToShop(db('s1'), 's1', ['p5'])).success, false)

    assert.equal((await shop.removeProductFromShop(db('s1'), 's1', 'p1')).success, true)
    await shop.setProductRemoval(db('a1'), target, false, 'a1')
    assert.equal((await shop.removeProductFromShop(db('s1'), 's1', 'p2')).success, false)
    assert.deepEqual((await read(db('s1'), 'shops/s1')).productIds, ['p2', 'p3'])
  })

  it('never lets a seller exceed their limit or add products before verification', async () => {
    await shop.ensureShop(db('s1'), 's1', { id: 's1', ...sellerProfile('s1', 'a1') })
    assert.equal((await shop.addProductsToShop(db('s1'), 's1', ['p1'])).success, false)
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { productIds: ['p1'] }))
    const target = await verifiedShop({ balance: 0 })
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { productIds: Array.from({ length: 51 }, (_, i) => `p${i}`) }))
    assert.equal(target.id, 's1')
  })
})

describe('suspension and deletion', () => {
  it('flags the shop, and the seller sees it live but cannot lift it', async () => {
    const target = await verifiedShop({ balance: 0 })
    assert.equal((await shop.setSuspended(db('a1'), target, true, 'a1')).success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).status, 'Suspended')
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { suspended: false }))
    assert.equal((await shop.setSuspended(db('a1'), { ...target, status: 'Suspended' }, false, 'a1')).success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).status, 'Active')
    assert.equal((await shop.setDeleted(db('a1'), target, true, 'a1')).success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).deleted, true)
  })
})

describe('notifications and payout methods', () => {
  it('delivers admin notifications to the seller, who can mark them read but not forge them', async () => {
    const target = await verifiedShop({ balance: 0 })
    await shop.sendNotification(db('a1'), target, { type: 'warning', title: 'Heads up', message: 'Hi' }, 'a1')
    const list = await getDocs(query(collection(db('s1'), 'notifications'), where('sellerId', '==', 's1')))
    const heads = list.docs.find((d) => d.data().title === 'Heads up')
    assert.ok(heads)
    assert.equal((await shop.markNotificationsRead(db('s1'), [heads.id])).success, true)
    assert.equal((await getDoc(doc(db('s1'), `notifications/${heads.id}`))).data().read, true)
    await assertFails(updateDoc(doc(db('s1'), `notifications/${heads.id}`), { title: 'Edited' }))
    await assertFails(setDoc(doc(db('s1'), 'notifications/fake'), { sellerId: 's1', adminId: 'a1', type: 'info', title: 'Forged', message: '', read: false, createdAt: now }))
    assert.equal((await shop.sendNotification(db('a2'), { ...target, adminId: 'a2' }, { title: 'x' }, 'a2')).success, false)
  })

  it('stores payout methods for the seller and lets their admin read them', async () => {
    const target = await verifiedShop({ balance: 0 })
    const saved = await shop.savePayoutMethod(db('s1'), target, { type: 'bank', label: 'HBL', bankName: 'HBL', accountNumber: '123', isDefault: true })
    assert.equal(saved.success, true)
    assert.equal((await getDocs(query(collection(db('a1'), 'payoutMethods'), where('adminId', '==', 'a1')))).size, 1)
    assert.equal((await getDocs(query(collection(db('a2'), 'payoutMethods'), where('adminId', '==', 'a2')))).size, 0)
    const replaced = await shop.savePayoutMethod(db('s1'), target, { type: 'crypto', label: 'USDT', walletAddress: 'T1', isDefault: true }, [saved.method.id])
    assert.equal(replaced.success, true)
    assert.equal((await shop.removePayoutMethod(db('s2'), replaced.method.id)).success, false)
    assert.equal((await shop.removePayoutMethod(db('s1'), replaced.method.id)).success, true)
  })
})

describe('support chat', () => {
  it('threads seller and admin messages, append-only, with unread counters', async () => {
    const target = await verifiedShop({ balance: 0 })
    assert.equal((await shop.sendSupportMessage(db('s1'), target, 'seller', 'Help me')).success, true)
    assert.equal((await shop.sendSupportMessage(db('a1'), target, 'admin', 'On it')).success, true)
    assert.equal((await shop.sendSupportMessage(db('s1'), target, 'seller', '   ')).success, false)
    const conversation = await read(db('a1'), `supportConversations/${shop.conversationId('s1')}`)
    assert.deepEqual(conversation.messages.map((m) => m.text), ['Help me', 'On it'])
    assert.equal(conversation.unreadForAdmin, 1)
    assert.equal(conversation.unreadForSeller, 1)

    assert.equal((await shop.markSupportRead(db('a1'), shop.conversationId('s1'), 'admin')).success, true)
    assert.equal((await read(db('a1'), `supportConversations/${shop.conversationId('s1')}`)).unreadForAdmin, 0)
    assert.equal((await shop.archiveSupportConversation(db('a1'), shop.conversationId('s1'))).success, true)

    // history cannot be rewritten or deleted by either side
    await assertFails(updateDoc(doc(db('s1'), `supportConversations/${shop.conversationId('s1')}`), { messages: [{ id: 'x', sender: 'seller', text: 'rewritten', at: now }] }))
    // and other sellers / admins cannot read it
    await assertFails(getDoc(doc(db('s2'), `supportConversations/${shop.conversationId('s1')}`)))
    await assertFails(getDoc(doc(db('a2'), `supportConversations/${shop.conversationId('s1')}`)))
  })

  it('greets a new seller with the admin\'s welcome and a notification, and never rewrites the thread', async () => {
    const target = await verifiedShop({ balance: 0 })
    const id = shop.conversationId('s1')
    assert.equal((await shop.createWelcomeConversation(db('s1'), target)).success, true)

    const conversation = await read(db('a1'), `supportConversations/${id}`)
    assert.deepEqual(conversation.messages.map((m) => [m.sender, m.text]), [['admin', shop.WELCOME_MESSAGE]])
    assert.equal(conversation.unreadForSeller, 1)
    assert.equal(conversation.unreadForAdmin, 0)

    const notes = await getDocs(query(collection(db('s1'), 'notifications'), where('sellerId', '==', 's1')))
    const welcome = notes.docs.map((d) => d.data()).find((n) => n.type === 'chat')
    assert.equal(welcome.message, shop.WELCOME_MESSAGE)
    assert.equal(welcome.read, false)
    assert.notEqual(welcome.recipient, 'admin')

    // a second attempt (say, another tab) cannot add to or replace the thread
    await shop.createWelcomeConversation(db('s1'), target)
    assert.equal((await read(db('a1'), `supportConversations/${id}`)).messages.length, 1)
    // and only the seller's own shop can be greeted
    assert.equal((await shop.createWelcomeConversation(db('s2'), target)).success, false)
  })

  it('notifies the other side of each chat message, and reading the chat reads its notifications', async () => {
    const target = await verifiedShop({ balance: 0 })
    const id = shop.conversationId('s1')
    await shop.sendSupportMessage(db('s1'), target, 'seller', 'Help me')
    await shop.sendSupportMessage(db('a1'), target, 'admin', 'On it')

    const chatNotes = async (asDb, field, uid) =>
      (await getDocs(query(collection(asDb, 'notifications'), where(field, '==', uid)))).docs.filter((d) => d.data().type === 'chat')
    const forAdmin = (await chatNotes(db('a1'), 'adminId', 'a1')).filter((d) => d.data().recipient === 'admin')
    const forSeller = (await chatNotes(db('s1'), 'sellerId', 's1')).filter((d) => d.data().recipient !== 'admin')
    assert.deepEqual(forAdmin.map((d) => d.data().message), ['Help me'])
    assert.equal(forAdmin[0].data().title, 'New message from s1 Shop')
    assert.deepEqual(forSeller.map((d) => d.data().message), ['On it'])

    // only the admin can read their note; the seller cannot mark it, and nobody else can see it
    await assertFails(updateDoc(doc(db('s1'), `notifications/${forAdmin[0].id}`), { read: true }))
    await assertFails(getDocs(query(collection(db('a2'), 'notifications'), where('adminId', '==', 'a1'))))

    assert.equal((await shop.markSupportRead(db('a1'), id, 'admin', forAdmin.map((d) => d.id))).success, true)
    assert.equal((await read(db('a1'), `notifications/${forAdmin[0].id}`)).read, true)
    assert.equal((await shop.markSupportRead(db('s1'), id, 'seller', forSeller.map((d) => d.id))).success, true)
    assert.equal((await read(db('s1'), `notifications/${forSeller[0].id}`)).read, true)
    const after = await read(db('a1'), `supportConversations/${id}`)
    assert.equal(after.unreadForAdmin, 0)
    assert.equal(after.unreadForSeller, 0)
  })

  it('lets a seller raise chat notes only for their own admin, and never other kinds', async () => {
    await verifiedShop({ balance: 0 })
    const note = { sellerId: 's1', adminId: 'a1', type: 'chat', title: 'New message', message: 'hi', read: false, createdAt: now, recipient: 'admin' }
    await assertSucceeds(setDoc(doc(db('s1'), 'notifications/chat-ok'), note))
    await assertFails(setDoc(doc(db('s1'), 'notifications/chat-other-seller'), { ...note, sellerId: 's2' }))
    await assertFails(setDoc(doc(db('s2'), 'notifications/chat-someone-else'), note))
    await assertFails(setDoc(doc(db('s1'), 'notifications/chat-wrong-admin'), { ...note, adminId: 'a2' }))
    await assertFails(setDoc(doc(db('s1'), 'notifications/not-chat'), { ...note, type: 'kyc' }))
    await assertFails(setDoc(doc(db('s1'), 'notifications/bad-recipient'), { ...note, recipient: 'everyone' }))
  })
})

describe('views campaigns, ledger and logs', () => {
  it('runs a campaign and adds instant views for the owning admin only', async () => {
    const target = await verifiedShop({ balance: 0 })
    const started = await shop.startViewsCampaign(db('a1'), target, { totalViews: 1000, hours: 1, minutes: 30, batches: 10 }, 'a1')
    assert.equal(started.success, true)
    assert.equal((await shop.setCampaignStatus(db('a1'), started.campaign.id, 'Paused')).success, true)
    assert.equal((await shop.setCampaignStatus(db('s1'), started.campaign.id, 'Terminated')).success, false)
    assert.equal((await shop.addInstantViews(db('a1'), target, 250, 'a1')).success, true)
    assert.deepEqual((await read(db('s1'), 'shops/s1')).views, { total: 250, today: 250 })
    assert.equal((await shop.addInstantViews(db('a1'), target, 0, 'a1')).success, false)
    await assertFails(getDocs(query(collection(db('a2'), 'campaigns'), where('adminId', '==', 'a1'))))
  })

  it('keeps the activity feed append-only and scoped to the admin', async () => {
    const target = await verifiedShop({ balance: 10 })
    const feed = await getDocs(query(collection(db('a1'), 'activityLogs'), where('adminId', '==', 'a1')))
    assert.ok(feed.size >= 2)
    await assertFails(getDocs(query(collection(db('a2'), 'activityLogs'), where('adminId', '==', 'a1'))))
    await assertFails(updateDoc(doc(db('a1'), `activityLogs/${feed.docs[0].id}`), { title: 'edited' }))
    // a seller can log their own activity, but not on behalf of another admin
    await assertSucceeds(setDoc(doc(db('s1'), 'activityLogs/mine'), { adminId: 'a1', sellerId: 's1', actorId: 's1', type: 'x', title: 't', entity: 'e', icon: 'i', at: now }))
    await assertFails(setDoc(doc(db('s1'), 'activityLogs/theirs'), { adminId: 'a2', sellerId: 's1', actorId: 's1', type: 'x', title: 't', entity: 'e', icon: 'i', at: now }))
    await assertFails(setDoc(doc(db('s2'), 'activityLogs/spoof'), { adminId: 'a1', sellerId: 's1', actorId: 's2', type: 'x', title: 't', entity: 'e', icon: 'i', at: now }))
    assert.equal(target.id, 's1')
  })

  it('records seller logins and impersonations for the admin', async () => {
    const target = await verifiedShop({ balance: 0 })
    await shop.recordSellerLogin(db('s1'), target)
    await shop.recordImpersonation(db('a1'), target, 'a1')
    const history = await getDocs(query(collection(db('a1'), 'loginHistory'), where('adminId', '==', 'a1')))
    const rows = history.docs.map((d) => d.data())
    assert.equal(rows.length, 2)
    assert.equal(rows.filter((row) => row.ip === 'Admin impersonation').length, 1)
    assert.equal(rows.filter((row) => row.ip === undefined && row.device).length, 1, 'a real sign-in has a device but no (unknowable) IP')
    await assertFails(getDocs(query(collection(db('a2'), 'loginHistory'), where('adminId', '==', 'a1'))))
  })
})

describe('what Recent Actions and My Logs read', () => {
  const lastActivity = async (type) => {
    const feed = await getDocs(query(collection(db('a1'), 'activityLogs'), where('adminId', '==', 'a1')))
    return feed.docs.map((d) => d.data()).filter((row) => row.type === type)
  }

  it('keeps where a seller signed in from, and lets only the place be filled in afterwards', async () => {
    const target = await verifiedShop({ balance: 0 })
    await shop.recordSellerLogin(db('s1'), target, { where: { ip: '162.4.16.175', location: 'Shahkot, Punjab, Pakistan' } })
    await shop.recordSellerLogin(db('s1'), target, { where: { ip: '119.73.96.111', location: '' } })
    const history = await getDocs(query(collection(db('a1'), 'loginHistory'), where('adminId', '==', 'a1')))
    const located = history.docs.find((d) => d.data().location)
    const unlocated = history.docs.find((d) => d.data().ip === '119.73.96.111')
    assert.equal(located.data().location, 'Shahkot, Punjab, Pakistan')
    assert.equal(unlocated.data().location, undefined)
    // the admin can add the place to an entry, nothing else about it; the seller cannot touch history
    await assertSucceeds(updateDoc(doc(db('a1'), `loginHistory/${unlocated.id}`), { location: 'Karachi, Sindh, Pakistan' }))
    await assertFails(updateDoc(doc(db('a1'), `loginHistory/${unlocated.id}`), { ip: '1.1.1.1' }))
    await assertFails(updateDoc(doc(db('s1'), `loginHistory/${unlocated.id}`), { location: 'Anywhere' }))
    await assertFails(updateDoc(doc(db('a2'), `loginHistory/${unlocated.id}`), { location: 'Anywhere' }))
  })

  it('lists the products added to a shop, and what was removed', async () => {
    await verifiedShop({ balance: 0 })
    const details = { p1: { name: 'Bakers Rack', image: '/assets/a.jpg', price: 99.99 }, p2: { name: 'Desk', image: '/assets/b.jpg', price: 89.99 } }
    assert.equal((await shop.addProductsToShop(db('s1'), 's1', ['p1', 'p2'], 's1', details)).success, true)
    const [added] = await lastActivity('seller_products_added')
    assert.deepEqual(added.meta.items, [
      { id: 'p1', name: 'Bakers Rack', image: '/assets/a.jpg', price: 99.99 },
      { id: 'p2', name: 'Desk', image: '/assets/b.jpg', price: 89.99 },
    ])
    assert.equal((await shop.removeProductFromShop(db('s1'), 's1', 'p1', 's1', details)).success, true)
    const [removed] = await lastActivity('seller_product_removed')
    assert.equal(removed.meta.items[0].name, 'Bakers Rack')
    assert.equal(removed.actorId, 's1')
  })

  it('notes the payout method on a saved method, a withdrawal request and its decision', async () => {
    const target = await verifiedShop({ balance: 100 })
    const method = { type: 'crypto', label: 'USDT', network: 'USDT_TRC20', walletAddress: 'T1', isDefault: true }
    assert.equal((await shop.savePayoutMethod(db('s1'), target, method)).success, true)
    assert.equal((await lastActivity('payout_method_added'))[0].meta.method, 'Crypto · USDT_TRC20')
    const request = await shop.requestWithdrawal(db('s1'), 's1', 40, method)
    assert.equal(request.success, true)
    const [requested] = await lastActivity('withdrawal_requested')
    assert.equal(requested.amount, 40)
    assert.equal(requested.meta.method, 'Crypto · USDT_TRC20')
    assert.equal((await shop.processWithdrawal(db('a1'), target, request.request.id, true, 'a1')).success, true)
    assert.equal((await lastActivity('withdrawal_approved'))[0].meta.method, 'Crypto · USDT_TRC20')
  })

  it('gives an order payment its amount', async () => {
    const target = await verifiedShop({ balance: 100 })
    const created = await shop.createOrder(db('a1'), target, { items: [ITEM] }, 'a1')
    assert.equal((await shop.payOrder(db('s1'), 's1', created.order.id)).success, true)
    assert.equal((await lastActivity('order_paid'))[0].amount, 30)
  })

  it('carries the place and device of a sign-up in the activity line, and refuses stray fields', async () => {
    await shop.ensureShop(db('s1'), 's1', { id: 's1', ...sellerProfile('s1', 'a1') })
    const line = { adminId: 'a1', sellerId: 's1', actorId: 's1', type: 'seller_signup', title: 'New seller registered', entity: 's1', icon: 'signup', at: now }
    await assertSucceeds(setDoc(doc(db('s1'), 'activityLogs/signup'), { ...line, meta: { email: 's1@x.com', location: 'Shahkot, Punjab, Pakistan', ip: '162.4.16.175', device: 'Desktop • Windows • Chrome' } }))
    await assertFails(setDoc(doc(db('s1'), 'activityLogs/loose'), { ...line, extra: 'nope' }))
    await assertFails(setDoc(doc(db('s1'), 'activityLogs/notamap'), { ...line, meta: 'text' }))
  })

  it('records an admin sign-in with its device and place, and lets only the place be added later', async () => {
    await shop.logAdminLogin(db('a1'), 'a1', 'Admin console', { device: 'Desktop • Windows • Chrome', deviceId: 'dev-1', ip: '162.4.16.175', location: '' })
    await shop.logAdminLogin(db('a1'), 'a1', 'Admin console', Promise.resolve({ device: 'Desktop • Windows • Chrome', deviceId: 'dev-1', ip: '162.4.16.175', location: 'Shahkot, Punjab, Pakistan' }))
    const rows = await getDocs(query(collection(db('a1'), 'adminLoginHistory'), where('adminId', '==', 'a1')))
    assert.equal(rows.size, 2)
    const plain = rows.docs.find((d) => !d.data().location)
    assert.equal(plain.data().deviceId, 'dev-1')
    await assertSucceeds(updateDoc(doc(db('a1'), `adminLoginHistory/${plain.id}`), { location: 'Shahkot, Punjab, Pakistan' }))
    await assertFails(updateDoc(doc(db('a1'), `adminLoginHistory/${plain.id}`), { at: now }))
    await assertFails(updateDoc(doc(db('a2'), `adminLoginHistory/${plain.id}`), { location: 'Anywhere' }))
  })

  it('lets an admin name their devices, privately', async () => {
    assert.equal((await shop.saveDeviceLabel(db('a1'), 'a1', 'dev-1', 'Office PC')).success, true)
    assert.equal((await shop.saveDeviceLabel(db('a1'), 'a1', 'dev-2', 'Laptop')).success, true)
    assert.deepEqual((await read(db('a1'), 'adminDevices/a1')).labels, { 'dev-1': 'Office PC', 'dev-2': 'Laptop' })
    assert.equal((await shop.saveDeviceLabel(db('a1'), 'a1', 'dev-1', '')).success, true)
    assert.deepEqual((await read(db('a1'), 'adminDevices/a1')).labels, { 'dev-2': 'Laptop' })
    assert.equal((await shop.saveDeviceLabel(db('a2'), 'a1', 'dev-1', 'mine now')).success, false)
    assert.equal((await shop.saveDeviceLabel(db('s1'), 'a1', 'dev-1', 'mine now')).success, false)
    await assertFails(getDoc(doc(db('a2'), 'adminDevices/a1')))
    await assertSucceeds(getDoc(doc(db('sa1'), 'adminDevices/a1')))
  })
})

describe('"log in as" sessions use the impersonator\'s identity', () => {
  it('lets an admin act as their seller: pay an order, request a withdrawal, manage the catalogue', async () => {
    const target = await verifiedShop({ balance: 100 })
    await shop.createOrder(db('a1'), target, { items: [ITEM] }, 'a1')
    const id = await orderId()
    assert.equal((await shop.payOrder(db('a1'), 's1', id, 'a1')).success, true)
    assert.equal((await read(db('a1'), 'shops/s1')).balance, 70)
    assert.equal((await shop.requestWithdrawal(db('a1'), 's1', 20, { label: 'x' }, 'a1')).success, true)
    assert.equal((await shop.addProductsToShop(db('a1'), 's1', ['p1'], 'a1')).success, true)
    assert.equal((await shop.sendSupportMessage(db('a1'), target, 'seller', 'from the seller portal')).success, true)
    assert.equal((await read(db('a1'), 'shops/s1')).balance, 50)
  })

  it('lets an admin\'s "log in as seller" session listen to the seller\'s data, if the query names the admin', async () => {
    // Firestore only allows a list query when the query's own filters prove the rule, and for an
    // admin the rule is `adminId == their uid` — so the seller portal must filter by both ids.
    const target = await verifiedShop({ balance: 100 })
    await shop.createOrder(db('a1'), target, { items: [ITEM] }, 'a1')
    await shop.requestWithdrawal(db('s1'), 's1', 10, { label: 'x' })
    await shop.sendSupportMessage(db('s1'), target, 'seller', 'hi')
    await shop.savePayoutMethod(db('s1'), target, { type: 'bank', label: 'HBL' })
    const admin = db('a1')
    for (const name of ['orders', 'withdrawals', 'notifications', 'payoutMethods', 'supportConversations']) {
      const scoped = query(collection(admin, name), where('sellerId', '==', 's1'), where('adminId', '==', 'a1'))
      assert.ok((await getDocs(scoped)).size >= 1, `${name} readable with sellerId + adminId`)
      await assertFails(getDocs(query(collection(admin, name), where('sellerId', '==', 's1'))))
    }
    // a different admin cannot name their way in
    await assertFails(getDocs(query(collection(db('a2'), 'orders'), where('sellerId', '==', 's1'), where('adminId', '==', 'a1'))))
  })

  it('lets a super admin do the same for any seller — but a different admin still cannot', async () => {
    const target = await verifiedShop({ balance: 100 })
    await shop.createOrder(db('a1'), target, { items: [ITEM] }, 'a1')
    const id = await orderId()
    assert.equal((await shop.payOrder(db('sa1'), 's1', id, 'sa1')).success, true)
    assert.equal((await shop.adjustBalance(db('sa1'), target, 5, 'add', 'sa1')).success, true)
    assert.equal((await shop.payOrder(db('a2'), 's1', id, 'a2')).success, false)
    assert.equal((await getDocs(query(collection(db('sa1'), 'shops')))).size, 1)
  })
})

describe('super admin audit trail', () => {
  it('lets a super admin write and read their log, and an admin only leave a registration note', async () => {
    await shop.pushSuperLog(db('sa1'), { superAdminId: 'sa1', actorId: 'sa1', actorName: 'Sam', type: 'admin_added', title: 'Admin added', entity: 'a1', icon: 'signup' })
    await shop.pushSuperLog(db('a1'), { superAdminId: 'sa1', actorId: 'a1', actorName: 'a1', type: 'admin_registered', title: 'Admin registered', entity: 'a1', icon: 'signup' })
    await shop.pushSuperLog(db('a1'), { superAdminId: 'sa1', actorId: 'a1', actorName: 'a1', type: 'admin_removed', title: 'forged', entity: 'a2', icon: 'trash' })
    await shop.pushSuperLog(db('a1'), { superAdminId: 'sa2', actorId: 'a1', actorName: 'a1', type: 'admin_registered', title: 'wrong owner', entity: 'a1', icon: 'signup' })
    const logs = await getDocs(collection(db('sa1'), 'superAdminLogs'))
    assert.deepEqual(logs.docs.map((d) => d.data().type).sort(), ['admin_added', 'admin_registered'])
    await assertFails(getDocs(collection(db('a1'), 'superAdminLogs')))
  })

  it('records admin logins for the super admin (and the admin themself)', async () => {
    await shop.logAdminLogin(db('a1'), 'a1', 'Admin console')
    await shop.logAdminLogin(db('sa1'), 'a1', 'Super admin: Sam')
    await shop.logAdminLogin(db('a2'), 'a1', 'forged')
    const all = await getDocs(collection(db('sa1'), 'adminLoginHistory'))
    assert.equal(all.size, 2)
    assert.equal((await getDocs(query(collection(db('a1'), 'adminLoginHistory'), where('adminId', '==', 'a1')))).size, 2)
    await assertFails(getDocs(query(collection(db('a2'), 'adminLoginHistory'), where('adminId', '==', 'a1'))))
  })

  it('lets a super admin run unfiltered queries even while the collections are still empty', async () => {
    // Regression: the super-admin console subscribes to whole collections on first sign-in, before
    // any seller exists, and a rule that evaluated `resource.data.adminId` eagerly made that fail.
    for (const name of ['shops', 'orders', 'withdrawals', 'notifications', 'activityLogs', 'loginHistory', 'ledger']) {
      await assertSucceeds(getDocs(collection(db('sa1'), name)))
    }
    await assertSucceeds(getDocs(query(collection(db('a1'), 'shops'), where('adminId', '==', 'a1'))))
    await assertFails(getDocs(collection(db('a1'), 'shops')))
  })

  it('lets only the super admin see every shop, order and withdrawal', async () => {
    await verifiedShop({ balance: 10 })
    await shop.ensureShop(db('s2'), 's2', { id: 's2', ...sellerProfile('s2', 'a2') })
    assert.equal((await getDocs(collection(db('sa1'), 'shops'))).size, 2)
    await assertFails(getDocs(collection(db('a1'), 'shops')))
    await assertFails(getDocs(collection(db('s1'), 'shops')))
    await assertFails(getDocs(collection(db('c1'), 'shops')))
  })
})

describe('seller profile, security and identity verification', () => {
  const fresh = async () => {
    const record = await shop.ensureShop(db('s1'), 's1', { id: 's1', ...sellerProfile('s1', 'a1') })
    return { ...record, id: 's1' }
  }

  it('lets a seller edit their own profile details on the shop, and nothing money-related', async () => {
    await fresh()
    const saved = await shop.saveShopSettings(db('s1'), 's1', {
      shopName: 'Dock11', phone: '+1 555 010 2030', phoneCountry: 'us', street: '1 Main St', city: 'Delhi', state: 'DL', country: 'India', postalCode: '110001', metaTitle: 'Dock11', metaDescription: 'A shop',
    })
    assert.equal(saved.success, true)
    const data = await read(db('a1'), 'shops/s1')
    assert.equal(data.shopName, 'Dock11')
    assert.equal(data.phoneCountry, 'US')
    assert.equal(data.address.city, 'Delhi')

    assert.equal((await shop.saveShopSettings(db('s1'), 's1', { shopName: '   ' })).success, false)
    assert.equal((await shop.saveShopSettings(db('s1'), 's1', { shopName: 'X', phone: 'call me' })).success, false)
    assert.equal((await shop.saveShopSettings(db('s2'), 's1', { shopName: 'Hijack' })).success, false)
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { shopName: 'X'.repeat(81) }))
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { shopName: 'ok', balance: 100 }))
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { address: { street: 'x', evil: 'y' } }))
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { avatar: 'a'.repeat(80001) }))
    assert.equal((await read(db('a1'), 'shops/s1')).balance, 0)
  })

  it('renames the seller on both the shop and the profile', async () => {
    await fresh()
    assert.equal((await shop.saveSellerName(db('s1'), 's1', 'New Name')).success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).fullName, 'New Name')
    assert.equal((await read(db('s1'), 'users/s1')).fullName, 'New Name')
    assert.equal((await shop.saveSellerName(db('s1'), 's1', '   ')).success, false)
    assert.equal((await shop.saveSellerName(db('s2'), 's1', 'Hijack')).success, false)
  })

  it('stores a profile photo on the shop', async () => {
    await fresh()
    assert.equal((await shop.saveSellerAvatar(db('s1'), 's1', 'data:image/jpeg;base64,AAAA')).success, true)
    assert.equal((await read(db('s1'), 'shops/s1')).avatar, 'data:image/jpeg;base64,AAAA')
    assert.equal((await shop.saveSellerAvatar(db('s1'), 's1', 'a'.repeat(80000))).success, false)
  })

  it('lets the shop and profile emails follow the Auth email — and only that', async () => {
    await fresh()
    assert.equal(await shop.syncAccountEmail(db('s1'), 's1', 'someone-else@x.com'), false)
    const moved = env.authenticatedContext('s1', { email: 'new@x.com' }).firestore()
    assert.equal(await shop.syncAccountEmail(moved, 's1', 'new@x.com'), true)
    assert.equal((await read(moved, 'shops/s1')).email, 'new@x.com')
    assert.equal((await read(moved, 'users/s1')).email, 'new@x.com')
  })

  it('keeps the transaction password hash private to the seller', async () => {
    await fresh()
    assert.equal((await shop.verifyTransactionPassword(db('s1'), 's1', '1234')).set, false)
    assert.equal((await shop.saveTransactionPassword(db('s1'), 's1', '12')).success, false)
    assert.equal((await shop.saveTransactionPassword(db('s1'), 's1', '4821')).success, true)
    assert.deepEqual(await shop.verifyTransactionPassword(db('s1'), 's1', '4821'), { success: true, set: true })
    assert.equal((await shop.verifyTransactionPassword(db('s1'), 's1', '0000')).success, false)
    assert.equal((await shop.saveTransactionPassword(db('s1'), 's1', '9999')).success, true)
    assert.equal((await shop.verifyTransactionPassword(db('s1'), 's1', '4821')).success, false)

    // Not even the seller's own admin or a super admin can read it; nobody else can write it.
    for (const who of ['a1', 'sa1', 's2']) await assertFails(getDoc(doc(db(who), 'sellerSecurity/s1')))
    await assertFails(getDocs(collection(db('s1'), 'sellerSecurity')))
    await assertFails(setDoc(doc(db('a1'), 'sellerSecurity/s1'), { sellerId: 's1', salt: 'aa', hash: 'bb', iterations: 1, updatedAt: now }))
    await assertFails(setDoc(doc(db('s1'), 'sellerSecurity/s1'), { sellerId: 's1', salt: 'aa', hash: 'bb', iterations: 1, updatedAt: now, plain: '9999' }))
  })

  it('takes identity documents for a first submission, and again only after a rejection', async () => {
    const target = await fresh()
    const documents = { docType: 'passport', front: 'data:image/jpeg;base64,AAAA', back: 'data:image/jpeg;base64,BBBB' }

    // A shop with no documents yet can submit them for review.
    assert.equal((await shop.submitKyc(db('s1'), target, documents)).success, true)
    const submitted = await read(db('a1'), 'shops/s1')
    assert.equal(submitted.kyc.status, 'Pending')
    assert.equal(submitted.kyc.hasDocuments, true)
    assert.equal(submitted.kyc.docType, 'passport')
    assert.equal((await shop.loadKycDocuments(db('a1'), 's1')).front, documents.front)

    // While the review is pending the documents cannot be swapped.
    const swap = { ...documents, front: 'data:image/jpeg;base64,CCCC' }
    assert.equal((await shop.submitKyc(db('s1'), target, swap)).success, false)
    assert.equal((await shop.loadKycDocuments(db('a1'), 's1')).front, documents.front)

    // After a rejection the seller can resubmit, which puts the review back to Pending.
    assert.equal((await shop.reviewKyc(db('a1'), target, false, 'a1')).success, true)
    assert.equal((await shop.submitKyc(db('s1'), target, swap)).success, true)
    assert.equal((await shop.loadKycDocuments(db('a1'), 's1')).front, swap.front)
    assert.equal((await read(db('a1'), 'shops/s1')).kyc.status, 'Pending')

    // Once approved, nothing can reopen it.
    assert.equal((await shop.reviewKyc(db('a1'), target, true, 'a1')).success, true)
    await assertFails(updateDoc(doc(db('s1'), 'shops/s1'), { 'kyc.status': 'Pending' }))
    await assertFails(setDoc(doc(db('s1'), 'kycDocuments/s1'), { sellerId: 's1', adminId: 'a1', front: 'x', back: 'y', updatedAt: now }))
    assert.equal((await shop.submitKyc(db('s1'), { ...target, verified: true }, documents)).success, false)
  })
})
