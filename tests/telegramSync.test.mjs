// The Telegram relay's logic (api/_lib): what gets sent to an admin, once, and how they connect.
// The only thing that is ever sent is a seller's support message — never KYC, sign-ups, withdrawals,
// orders, sign-ins, or the photo a seller attaches to a chat message.
// Runs against an in-memory Firestore, so it needs neither Java nor the emulators:
//   npm run test:telegram
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { runAction } from '../api/_lib/actions.js'
import { composeMessages, escapeHtml, renderSupport } from '../api/_lib/format.js'
import { LINK_TTL_MS, consumeLinkCode, createLinkCode, handleUpdate } from '../api/_lib/link.js'
import { DEFAULT_PREFS, prefsOf, syncAdmin } from '../api/_lib/sync.js'
import { createFakeFirestore } from './helpers/fakeAdminFirestore.mjs'

const T0 = Date.parse('2026-09-30T10:00:00.000Z')
const at = (offsetSeconds) => new Date(T0 + offsetSeconds * 1000).toISOString()

let db
let clock
let sent
let failWith

const send = async (chatId, html) => {
  if (failWith) throw failWith
  sent.push({ chatId, html })
}
const sync = (adminId = 'a1') => syncAdmin({ db, adminId, send, now: () => clock })

const connect = (extra = {}) =>
  db.seed('adminTelegram', 'a1', {
    adminId: 'a1',
    chatId: 4242,
    chatName: 'Ada',
    chatType: 'private',
    enabled: true,
    prefs: { support: true },
    cursor: { support: at(0) },
    sent: [],
    ...extra,
  })

// A link made before alerts were narrowed to support messages: it still carries the old choices and cursors.
const connectLegacy = (extra = {}) =>
  connect({ prefs: { activity: true, support: true, logins: true }, cursor: { activity: at(0), support: at(0), logins: at(0) }, ...extra })

// What the app writes when a seller messages their admin: a `chat` note for the admin.
const support = (id, secondsAt = 30, extra = {}) =>
  db.seed('notifications', id, { adminId: 'a1', sellerId: 's1', type: 'chat', recipient: 'admin', title: 'New message from Sue Shop', message: 'Where is my payout?', createdAt: at(secondsAt), read: false, ...extra })

// Things sellers do that used to be forwarded and must not be any more.
const activity = (id, extra = {}) =>
  db.seed('activityLogs', id, { adminId: 'a1', sellerId: 's1', actorId: 's1', type: 'order_paid', title: 'Paid to process order', entity: 'Sue Seller', at: at(30), ...extra })

beforeEach(() => {
  db = createFakeFirestore()
  clock = T0 + 60_000
  sent = []
  failWith = null
})

describe('what is sent', () => {
  it('sends nothing for an admin who has not connected Telegram', async () => {
    support('n1')
    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 0)
  })

  it('sends a seller\'s support message to the admin\'s chat, once', async () => {
    connect()
    support('n1')
    assert.deepEqual(await sync(), { sent: 1 })
    assert.equal(sent.length, 1)
    assert.equal(sent[0].chatId, 4242)
    assert.match(sent[0].html, /New message from Sue Shop/)
    assert.match(sent[0].html, /Where is my payout\?/)

    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 1)
  })

  it('sends the admin\'s replies and other notes to nobody, and never another admin\'s network', async () => {
    connect()
    // the admin's reply is a note for the seller (no `recipient: admin`), an order note is not a chat message
    support('reply', 20, { recipient: undefined, title: 'New message from Customer Support' })
    db.seed('notifications', 'order', { adminId: 'a1', sellerId: 's1', type: 'order', recipient: 'admin', title: 'New order assigned', message: 'Pay $10', createdAt: at(21), read: false })
    support('theirs', 22, { adminId: 'a2' })
    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 0)
  })

  it('turns several at once into one digest, oldest first', async () => {
    connect()
    support('n1', 10, { message: 'First' })
    support('n2', 20, { message: 'Second' })
    support('n3', 30, { message: 'Third' })
    assert.deepEqual(await sync(), { sent: 3 })
    assert.equal(sent.length, 1)
    assert.match(sent[0].html, /3 new notifications/)
    assert.ok(sent[0].html.indexOf('First') < sent[0].html.indexOf('Second') && sent[0].html.indexOf('Second') < sent[0].html.indexOf('Third'))
  })
})

describe('what is never sent', () => {
  const realFetch = globalThis.fetch
  let fetched
  beforeEach(() => {
    fetched = []
    // Telegram files go out over fetch: nothing may.
    globalThis.fetch = async (url) => {
      fetched.push(String(url))
      throw new Error('nothing may be fetched')
    }
  })
  afterEach(() => {
    globalThis.fetch = realFetch
  })

  it('never sends a new seller\'s KYC: no alert, no details, no ID documents', async () => {
    connectLegacy()
    db.seed('shops', 's1', { fullName: 'Sue Seller', shopName: 'Sue Shop', email: 'sue@x.com', adminId: 'a1', kyc: { status: 'Pending', docType: 'national-id', submittedAt: at(30) } })
    db.seed('kycDocuments', 's1', { sellerId: 's1', adminId: 'a1', front: 'data:image/jpeg;base64,/9j/', back: 'data:application/pdf;base64,JVBERg==', updatedAt: at(30) })
    activity('signup', { type: 'seller_signup', title: 'New seller registered', meta: { email: 'sue@x.com', location: 'Lahore, Pakistan' } })
    activity('resubmit', { type: 'kyc_submitted', title: 'Seller submitted KYC documents', at: at(40) })
    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 0)
    assert.equal(fetched.length, 0)
  })

  it('never sends withdrawals, order payments, payout methods or product changes', async () => {
    connectLegacy()
    for (const [id, type, title] of [
      ['w', 'withdrawal_requested', 'Seller requested withdrawal'],
      ['p', 'order_paid', 'Paid to process order'],
      ['m', 'payout_method_added', 'Payout method added'],
      ['a', 'seller_products_added', '3 products added to shop'],
      ['r', 'seller_product_removed', 'Product removed from shop'],
    ]) {
      activity(id, { type, title, amount: 25 })
    }
    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 0)
  })

  it('never sends seller sign-ins', async () => {
    connectLegacy()
    db.seed('shops', 's1', { fullName: 'Sue Seller' })
    db.seed('loginHistory', 'l1', { adminId: 'a1', sellerId: 's1', at: at(30), device: 'Desktop • Windows • Chrome', location: 'Lahore, Pakistan' })
    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 0)
  })

  it('still sends only the support message on a link made when activity, KYC and sign-ins were switched on', async () => {
    connectLegacy()
    db.seed('shops', 's1', { fullName: 'Sue Seller', shopName: 'Sue Shop', adminId: 'a1', kyc: { status: 'Pending' } })
    activity('signup', { type: 'seller_signup', title: 'New seller registered' })
    activity('paid')
    db.seed('loginHistory', 'l1', { adminId: 'a1', sellerId: 's1', at: at(30), device: 'Desktop', location: 'Lahore' })
    support('n1')
    assert.deepEqual(await sync(), { sent: 1 })
    assert.equal(sent.length, 1)
    assert.match(sent[0].html, /New message from Sue Shop/)
    assert.doesNotMatch(sent[0].html, /New seller registered|Paid to process order|signed in/)
    assert.equal(fetched.length, 0)
  })

  it('sends a support message that carries a photo as its text alert only — the picture itself is never sent', async () => {
    connect()
    const PHOTO = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0, 9, 9]).toString('base64')}`
    db.seed('supportConversations', 'support-s1', {
      sellerId: 's1',
      adminId: 'a1',
      status: 'active',
      messages: [{ id: 'm1', sender: 'seller', text: '', attachment: { type: 'image', url: PHOTO, name: 'photo.jpg', contentType: 'image/jpeg', size: 100 }, at: at(20) }],
    })
    support('n1', 20.5, { message: '📷 Photo' })
    assert.deepEqual(await sync(), { sent: 1 })
    assert.equal(sent.length, 1)
    assert.match(sent[0].html, /New message from Sue Shop/)
    assert.match(sent[0].html, /📷 Photo/)
    assert.doesNotMatch(sent[0].html, /base64|data:image/)
    assert.equal(fetched.length, 0, 'no file went to Telegram')

    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 1)
  })
})

describe('pausing and preferences', () => {
  it('sends nothing while paused, and no backlog when resumed', async () => {
    connect({ enabled: false })
    support('while-paused')
    assert.deepEqual(await sync(), { sent: 0 })
    assert.deepEqual(db.read('adminTelegram', 'a1').cursor.support, null)

    db.seed('adminTelegram', 'a1', { ...db.read('adminTelegram', 'a1'), enabled: true })
    assert.deepEqual(await sync(), { sent: 0 })
    clock += 60_000
    support('after', 100)
    assert.deepEqual(await sync(), { sent: 1 })
    assert.match(sent[0].html, /Where is my payout\?/)
  })

  it('sends nothing when support messages are switched off, even if old choices are still on', async () => {
    connect({ prefs: { activity: true, support: false, logins: true }, cursor: { activity: at(0), support: null, logins: at(0) } })
    support('n1')
    activity('x1')
    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 0)
  })

  it('knows only one choice, and reads an older link\'s as that one', () => {
    assert.deepEqual(DEFAULT_PREFS, { support: true })
    assert.deepEqual(prefsOf({ prefs: { activity: true, support: false, logins: true } }), { support: false })
    assert.deepEqual(prefsOf({ prefs: { activity: true, logins: true } }), { support: true })
    assert.deepEqual(prefsOf(null), { support: true })
  })
})

describe('sellers\' clocks', () => {
  it('still sends a message stamped a few minutes in the past', async () => {
    connect({ cursor: { support: at(300) } })
    clock = T0 + 320_000
    support('late', 100) // 200 s behind the cursor
    assert.deepEqual(await sync(), { sent: 1 })
  })

  it('does not let a clock running ahead hide what happens next', async () => {
    connect()
    support('future', 86_400) // a day ahead
    assert.deepEqual(await sync(), { sent: 1 })
    assert.ok(db.read('adminTelegram', 'a1').cursor.support <= at(60), 'the cursor stays at the present')

    clock += 120_000
    support('real', 150, { message: 'A real one' })
    assert.deepEqual(await sync(), { sent: 1 })
    assert.match(sent[1].html, /A real one/)
  })
})

describe('races and failures', () => {
  it('sends a message once even when two calls look at the same moment', async () => {
    connect()
    support('n1')
    const [a, b] = await Promise.all([sync(), sync()])
    assert.equal(a.sent + b.sent, 1)
    assert.equal(sent.length, 1)
  })

  it('tries again next time when Telegram is briefly unavailable', async () => {
    connect()
    support('n1')
    failWith = Object.assign(new Error('Too Many Requests'), { code: 429 })
    await assert.rejects(sync(), /Too Many Requests/)
    assert.equal(sent.length, 0)

    failWith = null
    assert.deepEqual(await sync(), { sent: 1 })
    assert.equal(sent.length, 1)
  })

  it('switches itself off, and says why, once the chat has blocked the bot', async () => {
    connect()
    support('n1')
    failWith = Object.assign(new Error('Forbidden: bot was blocked by the user'), { code: 403 })
    assert.deepEqual(await sync(), { sent: 0 })
    const link = db.read('adminTelegram', 'a1')
    assert.equal(link.enabled, false)
    assert.match(link.lastError, /Connect again/)
  })

  it('clears an earlier error after a good delivery', async () => {
    connect({ lastError: 'old trouble' })
    support('n1')
    await sync()
    assert.equal(db.read('adminTelegram', 'a1').lastError, null)
  })

  it('keeps its place and picks the message up once its notes can be read again', async () => {
    connect()
    support('n1')
    const original = db.collection
    db.collection = (name) => (name === 'notifications' ? { where: () => { throw new Error('FAILED_PRECONDITION: the query requires an index') } } : original(name))
    const quiet = console.error
    console.error = () => {}
    try {
      assert.deepEqual(await sync(), { sent: 0 })
    } finally {
      console.error = quiet
    }
    assert.equal(db.read('adminTelegram', 'a1').cursor.support, at(0), 'its cursor did not move')

    db.collection = original
    assert.deepEqual(await sync(), { sent: 1 })
    assert.match(sent[0].html, /New message from Sue Shop/)
  })
})

describe('message format', () => {
  it('escapes what sellers type', () => {
    const [message] = composeMessages([renderSupport({ title: 'New message from <b>A & B</b>', message: 'hi <script>alert(1)</script>' })])
    assert.doesNotMatch(message, /<script>/)
    assert.match(message, /New message from &lt;b&gt;A &amp; B&lt;\/b&gt;/)
    assert.match(message, /hi &lt;script&gt;/)
    assert.equal(escapeHtml('a < b'), 'a &lt; b')
  })

  it('splits a long digest across messages under Telegram\'s limit and puts the link last', () => {
    const items = Array.from({ length: 200 }, (_, i) => renderSupport({ title: `New message from Shop ${i}`, message: 'Somebody With A Long Name wrote a fairly long message here' }))
    const messages = composeMessages(items, { dashboardUrl: 'https://example.com/admin-app/support' })
    assert.ok(messages.length > 1)
    assert.ok(messages.every((message) => message.length <= 4096))
    assert.match(messages.at(-1), /Open dashboard/)
    assert.ok(!messages.slice(0, -1).some((message) => /Open dashboard/.test(message)))
  })
})

describe('connecting', () => {
  const chat = { id: 4242, type: 'private', first_name: 'Ada', last_name: 'Admin' }

  it('links the admin to the chat that opens their code, once', async () => {
    const { code } = await createLinkCode({ db, adminId: 'a1', now: () => clock })
    assert.match(code, /^[A-Za-z0-9_-]{20,64}$/)
    assert.equal(await consumeLinkCode({ db, code, chat, now: () => clock }), 'a1')

    const link = db.read('adminTelegram', 'a1')
    assert.equal(link.chatId, 4242)
    assert.equal(link.chatName, 'Ada Admin')
    assert.equal(link.enabled, true)
    assert.deepEqual(link.prefs, { support: true })
    assert.deepEqual(link.cursor, { support: at(60) })

    assert.equal(await consumeLinkCode({ db, code, chat, now: () => clock }), null, 'a code works once')
  })

  it('refuses an expired or unknown code', async () => {
    const { code } = await createLinkCode({ db, adminId: 'a1', now: () => clock })
    assert.equal(await consumeLinkCode({ db, code, chat, now: () => clock + LINK_TTL_MS + 1000 }), null)
    assert.equal(await consumeLinkCode({ db, code: 'nope', chat, now: () => clock }), null)
    assert.equal(db.read('adminTelegram', 'a1'), undefined)
  })

  it('keeps the admin\'s choice when they connect a new chat', async () => {
    connect({ prefs: { activity: false, support: false, logins: false } })
    const { code } = await createLinkCode({ db, adminId: 'a1', now: () => clock })
    await consumeLinkCode({ db, code, chat: { id: -100, type: 'supergroup', title: 'Ops team' }, now: () => clock })
    const link = db.read('adminTelegram', 'a1')
    assert.equal(link.chatId, -100)
    assert.equal(link.chatName, 'Ops team')
    assert.deepEqual(link.prefs, { support: false })
    assert.deepEqual(link.cursor, { support: null })
  })

  it('does not treat a support message from before it was connected as new', async () => {
    support('old', 30)
    const { code } = await createLinkCode({ db, adminId: 'a1', now: () => clock })
    await consumeLinkCode({ db, code, chat: { id: 4242, type: 'private', first_name: 'Ada' }, now: () => clock })
    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 0)
  })

  const say = (text, chatOverride = chat) => handleUpdate({ db, update: { message: { text, chat: chatOverride } }, send, now: () => clock })

  it('answers /start <code> in the chat, and connects', async () => {
    const { code } = await createLinkCode({ db, adminId: 'a1', now: () => clock })
    await say(`/start ${code}`)
    assert.match(sent[0].html, /Connected/)
    assert.match(sent[0].html, /support chat/)
    assert.equal(db.read('adminTelegram', 'a1').chatId, 4242)
  })

  it('understands the form a group sends, /start@bot <code>', async () => {
    const { code } = await createLinkCode({ db, adminId: 'a1', now: () => clock })
    await say(`/start@SomeBot ${code}`, { id: -7, type: 'group', title: 'Ops' })
    assert.equal(db.read('adminTelegram', 'a1').chatId, -7)
  })

  it('explains a dead code and a bare /start', async () => {
    await say('/start nope')
    assert.match(sent[0].html, /expired/)
    await say('/start')
    assert.match(sent[1].html, /Connect Telegram/)
    assert.match(sent[1].html, /support chat/)
  })

  it('lets /stop disconnect a private chat but not a group', async () => {
    connect()
    await say('/stop', { id: -4242, type: 'group', title: 'Ops' })
    assert.ok(db.read('adminTelegram', 'a1'), 'a group cannot disconnect the admin')
    await say('/stop')
    assert.equal(db.read('adminTelegram', 'a1'), undefined)
  })

  it('ignores plain text', async () => {
    await say('hello')
    assert.equal(sent.length, 0)
  })
})

describe('who may do what', () => {
  const services = () => ({ db, send, botUsername: async () => 'VerifiedSellerBot', now: () => clock })
  const seller = { uid: 's1', profile: { role: 'seller', adminId: 'a1' } }
  const admin = { uid: 'a1', profile: { role: 'admin' } }
  const customer = { uid: 'c1', profile: { role: 'customer' } }

  it('lets a seller\'s support message reach their own admin\'s Telegram', async () => {
    connect()
    support('n1')
    assert.deepEqual(await runAction('sync', seller, services()), { sent: 1 })
    assert.equal(sent[0].chatId, 4242)
  })

  it('has nobody to report for when a customer pings', async () => {
    connect()
    support('n1')
    assert.deepEqual(await runAction('sync', customer, services()), { sent: 0 })
    assert.equal(sent.length, 0)
  })

  it('hands an admin a link that only they can spend, and never a seller', async () => {
    const result = await runAction('link', admin, services())
    const code = new URL(result.url).searchParams.get('start')
    assert.match(result.url, /^https:\/\/t\.me\/VerifiedSellerBot\?start=/)
    assert.match(result.groupUrl, /\?startgroup=/)
    assert.equal(db.read('telegramLinks', code).adminId, 'a1')
    await assert.rejects(runAction('link', seller, services()), (error) => error.status === 403)
    await assert.rejects(runAction('link', customer, services()), (error) => error.status === 403)
  })

  it('sends a test message to the connected chat, and asks to connect first when there is none', async () => {
    await assert.rejects(runAction('test', admin, services()), (error) => error.status === 409)
    connect()
    await runAction('test', admin, services())
    assert.match(sent[0].html, /Telegram alerts are on/)
    assert.match(sent[0].html, /support chat/)
    await assert.rejects(runAction('test', seller, services()), (error) => error.status === 403)
  })

  it('disconnects an admin, and only that admin\'s link', async () => {
    connect()
    db.seed('adminTelegram', 'a2', { adminId: 'a2', chatId: 9 })
    await runAction('disconnect', admin, services())
    assert.equal(db.read('adminTelegram', 'a1'), undefined)
    assert.ok(db.read('adminTelegram', 'a2'))
    assert.match(sent[0].html, /Disconnected/)
    await assert.rejects(runAction('disconnect', seller, services()), (error) => error.status === 403)
  })

  it('refuses an action it does not know', async () => {
    await assert.rejects(runAction('shout', admin, services()), (error) => error.status === 400)
  })
})

describe('the endpoints', () => {
  const call = async (handler, { method = 'POST', headers = {}, body = {} } = {}) => {
    const out = { status: 0, body: null, headers: {} }
    const res = {
      setHeader: (name, value) => (out.headers[name] = value),
      status(code) {
        out.status = code
        return this
      },
      json(payload) {
        out.body = payload
        return this
      },
    }
    await handler({ method, headers, body }, res)
    return out
  }
  const saved = { ...process.env }
  beforeEach(() => {
    for (const name of ['FIREBASE_SERVICE_ACCOUNT', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET']) delete process.env[name]
  })
  afterEach(() => Object.assign(process.env, saved))

  it('only takes POST', async () => {
    const { default: relay } = await import('../api/telegram.js')
    const { default: webhook } = await import('../api/telegram-webhook.js')
    assert.equal((await call(relay, { method: 'GET' })).status, 405)
    assert.equal((await call(webhook, { method: 'GET' })).status, 405)
  })

  it('says what is missing while the server is not set up, without leaking anything else', async () => {
    const { default: relay } = await import('../api/telegram.js')
    const answer = await call(relay, { headers: { authorization: 'Bearer x' }, body: { action: 'sync' } })
    assert.equal(answer.status, 503)
    assert.equal(answer.body.notConfigured, true)
    assert.match(answer.body.error, /FIREBASE_SERVICE_ACCOUNT/)
  })

  it('only listens to Telegram: a wrong or missing secret is refused', async () => {
    const { default: webhook } = await import('../api/telegram-webhook.js')
    assert.equal((await call(webhook)).status, 503, 'no secret configured yet')
    process.env.TELEGRAM_WEBHOOK_SECRET = 'right-secret'
    assert.equal((await call(webhook, { headers: {} })).status, 401)
    assert.equal((await call(webhook, { headers: { 'x-telegram-bot-api-secret-token': 'wrong-secret' } })).status, 401)
  })
})
