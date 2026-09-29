// The Telegram relay's logic (api/_lib): what gets sent to an admin, once, and how they connect.
// Runs against an in-memory Firestore, so it needs neither Java nor the emulators:
//   npm run test:telegram
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { runAction } from '../api/_lib/actions.js'
import { composeMessages, escapeHtml, renderActivity } from '../api/_lib/format.js'
import { LINK_TTL_MS, consumeLinkCode, createLinkCode, handleUpdate } from '../api/_lib/link.js'
import { syncAdmin } from '../api/_lib/sync.js'
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
    prefs: { activity: true, support: true, logins: false },
    cursor: { activity: at(0), support: at(0), logins: null },
    sent: [],
    ...extra,
  })

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
    activity('x1')
    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 0)
  })

  it('sends a seller\'s action to the admin\'s chat, once', async () => {
    connect()
    activity('x1', { amount: 40, meta: { method: 'Bank · Awais NBank' } })
    assert.deepEqual(await sync(), { sent: 1 })
    assert.equal(sent.length, 1)
    assert.equal(sent[0].chatId, 4242)
    assert.match(sent[0].html, /Paid to process order/)
    assert.match(sent[0].html, /Sue Seller/)
    assert.match(sent[0].html, /\$40\.00/)
    assert.match(sent[0].html, /Bank · Awais NBank/)

    assert.deepEqual(await sync(), { sent: 0 })
    assert.equal(sent.length, 1)
  })

  it('never sends what the admin did themselves, or another admin\'s network', async () => {
    connect()
    activity('mine', { actorId: 'a1' })
    activity('theirs', { adminId: 'a2' })
    assert.deepEqual(await sync(), { sent: 0 })
  })

  it('sends a support message, and not the notes the admin wrote to a seller', async () => {
    connect()
    db.seed('notifications', 'n1', { adminId: 'a1', sellerId: 's1', type: 'chat', recipient: 'admin', title: 'New message from Sue Shop', message: 'Where is my payout?', createdAt: at(20), read: false })
    db.seed('notifications', 'n2', { adminId: 'a1', sellerId: 's1', type: 'order', title: 'New order assigned', message: 'Pay $10', createdAt: at(21), read: false })
    assert.deepEqual(await sync(), { sent: 1 })
    assert.match(sent[0].html, /New message from Sue Shop/)
    assert.match(sent[0].html, /Where is my payout\?/)
  })

  it('does not send seller sign-ins unless asked to, and then names the seller', async () => {
    connect()
    db.seed('shops', 's1', { fullName: 'Sue Seller' })
    db.seed('loginHistory', 'l1', { adminId: 'a1', sellerId: 's1', at: at(30), device: 'Desktop • Windows • Chrome', location: 'Lahore, Pakistan' })
    assert.deepEqual(await sync(), { sent: 0 })

    // Switching them on starts from now: the sign-in above is history and stays unsent.
    db.seed('adminTelegram', 'a1', { ...db.read('adminTelegram', 'a1'), prefs: { activity: true, support: true, logins: true } })
    assert.deepEqual(await sync(), { sent: 0 })
    clock += 60_000
    db.seed('loginHistory', 'l2', { adminId: 'a1', sellerId: 's1', at: at(100), device: 'Mobile • iOS • Safari', location: 'Karachi, Pakistan' })
    assert.deepEqual(await sync(), { sent: 1 })
    assert.match(sent[0].html, /Seller signed in/)
    assert.match(sent[0].html, /Sue Seller/)
    assert.match(sent[0].html, /Karachi/)
  })

  it('ignores the log line an admin leaves when they open a seller\'s portal', async () => {
    connect({ prefs: { activity: true, support: true, logins: true }, cursor: { activity: at(0), support: at(0), logins: at(0) } })
    db.seed('loginHistory', 'l1', { adminId: 'a1', sellerId: 's1', at: at(30), ip: 'Admin impersonation', device: 'Admin Panel' })
    assert.deepEqual(await sync(), { sent: 0 })
  })

  it('turns several at once into one digest, oldest first', async () => {
    connect()
    activity('x1', { title: 'First', at: at(10) })
    activity('x2', { title: 'Second', at: at(20) })
    activity('x3', { title: 'Third', at: at(30) })
    assert.deepEqual(await sync(), { sent: 3 })
    assert.equal(sent.length, 1)
    assert.match(sent[0].html, /3 new notifications/)
    assert.ok(sent[0].html.indexOf('First') < sent[0].html.indexOf('Second') && sent[0].html.indexOf('Second') < sent[0].html.indexOf('Third'))
  })
})

describe('pausing and preferences', () => {
  it('sends nothing while paused, and no backlog when resumed', async () => {
    connect({ enabled: false })
    activity('while-paused')
    assert.deepEqual(await sync(), { sent: 0 })
    assert.deepEqual(db.read('adminTelegram', 'a1').cursor, { activity: null, support: null, logins: null })

    db.seed('adminTelegram', 'a1', { ...db.read('adminTelegram', 'a1'), enabled: true })
    assert.deepEqual(await sync(), { sent: 0 })
    clock += 60_000
    activity('after', { at: at(100) })
    assert.deepEqual(await sync(), { sent: 1 })
    assert.match(sent[0].html, /Paid to process order/)
  })

  it('leaves out a kind that is switched off', async () => {
    connect({ prefs: { activity: false, support: true, logins: false }, cursor: { activity: null, support: at(0), logins: null } })
    activity('x1')
    assert.deepEqual(await sync(), { sent: 0 })
  })
})

describe('sellers\' clocks', () => {
  it('still sends an event stamped a few minutes in the past', async () => {
    connect({ cursor: { activity: at(300), support: at(300), logins: null } })
    clock = T0 + 320_000
    activity('late', { at: at(100) }) // 200 s behind the cursor
    assert.deepEqual(await sync(), { sent: 1 })
  })

  it('does not let a clock running ahead hide what happens next', async () => {
    connect()
    activity('future', { at: at(86_400) }) // a day ahead
    assert.deepEqual(await sync(), { sent: 1 })
    assert.ok(db.read('adminTelegram', 'a1').cursor.activity <= at(60), 'the cursor stays at the present')

    clock += 120_000
    activity('real', { at: at(150), title: 'A real one' })
    assert.deepEqual(await sync(), { sent: 1 })
    assert.match(sent[1].html, /A real one/)
  })
})

describe('races and failures', () => {
  it('sends an event once even when two calls look at the same moment', async () => {
    connect()
    activity('x1')
    const [a, b] = await Promise.all([sync(), sync()])
    assert.equal(a.sent + b.sent, 1)
    assert.equal(sent.length, 1)
  })

  it('tries again next time when Telegram is briefly unavailable', async () => {
    connect()
    activity('x1')
    failWith = Object.assign(new Error('Too Many Requests'), { code: 429 })
    await assert.rejects(sync(), /Too Many Requests/)
    assert.equal(sent.length, 0)

    failWith = null
    assert.deepEqual(await sync(), { sent: 1 })
    assert.equal(sent.length, 1)
  })

  it('switches itself off, and says why, once the chat has blocked the bot', async () => {
    connect()
    activity('x1')
    failWith = Object.assign(new Error('Forbidden: bot was blocked by the user'), { code: 403 })
    assert.deepEqual(await sync(), { sent: 0 })
    const link = db.read('adminTelegram', 'a1')
    assert.equal(link.enabled, false)
    assert.match(link.lastError, /Connect again/)
  })

  it('clears an earlier error after a good delivery', async () => {
    connect({ lastError: 'old trouble' })
    activity('x1')
    await sync()
    assert.equal(db.read('adminTelegram', 'a1').lastError, null)
  })
})

describe('message format', () => {
  it('escapes what sellers type', () => {
    const [message] = composeMessages([renderActivity({ title: 'Order <b>paid</b>', entity: 'A & B <script>', type: 'order_paid' })])
    assert.doesNotMatch(message, /<script>/)
    assert.match(message, /A &amp; B &lt;script&gt;/)
    assert.match(message, /Order &lt;b&gt;paid&lt;\/b&gt;/)
    assert.equal(escapeHtml('a < b'), 'a &lt; b')
  })

  it('splits a long digest across messages under Telegram\'s limit and puts the link last', () => {
    const items = Array.from({ length: 200 }, (_, i) => renderActivity({ title: `Seller ${i} requested a withdrawal`, entity: 'Somebody With A Long Name', type: 'withdrawal_requested', amount: 100 + i }))
    const messages = composeMessages(items, { dashboardUrl: 'https://example.com/admin-app/recent-actions' })
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
    assert.deepEqual(link.prefs, { activity: true, support: true, logins: false })
    assert.deepEqual(link.cursor, { activity: at(60), support: at(60), logins: null })

    assert.equal(await consumeLinkCode({ db, code, chat, now: () => clock }), null, 'a code works once')
  })

  it('refuses an expired or unknown code', async () => {
    const { code } = await createLinkCode({ db, adminId: 'a1', now: () => clock })
    assert.equal(await consumeLinkCode({ db, code, chat, now: () => clock + LINK_TTL_MS + 1000 }), null)
    assert.equal(await consumeLinkCode({ db, code: 'nope', chat, now: () => clock }), null)
    assert.equal(db.read('adminTelegram', 'a1'), undefined)
  })

  it('keeps the admin\'s choices when they connect a new chat', async () => {
    connect({ prefs: { activity: false, support: true, logins: true } })
    const { code } = await createLinkCode({ db, adminId: 'a1', now: () => clock })
    await consumeLinkCode({ db, code, chat: { id: -100, type: 'supergroup', title: 'Ops team' }, now: () => clock })
    const link = db.read('adminTelegram', 'a1')
    assert.equal(link.chatId, -100)
    assert.equal(link.chatName, 'Ops team')
    assert.deepEqual(link.prefs, { activity: false, support: true, logins: true })
  })

  const say = (text, chatOverride = chat) => handleUpdate({ db, update: { message: { text, chat: chatOverride } }, send, now: () => clock })

  it('answers /start <code> in the chat, and connects', async () => {
    const { code } = await createLinkCode({ db, adminId: 'a1', now: () => clock })
    await say(`/start ${code}`)
    assert.match(sent[0].html, /Connected/)
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

  it('lets a seller\'s action reach their own admin\'s Telegram', async () => {
    connect()
    activity('x1')
    assert.deepEqual(await runAction('sync', seller, services()), { sent: 1 })
    assert.equal(sent[0].chatId, 4242)
  })

  it('has nobody to report for when a customer pings', async () => {
    connect()
    activity('x1')
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

describe('when one kind cannot be read', () => {
  it('still sends the others, and picks the broken one up again once it works', async () => {
    connect()
    activity('x1')
    db.seed('notifications', 'n1', { adminId: 'a1', sellerId: 's1', type: 'chat', recipient: 'admin', title: 'New message from Sue Shop', message: 'hi', createdAt: at(20), read: false })

    const original = db.collection
    db.collection = (name) => (name === 'notifications' ? { where: () => { throw new Error('FAILED_PRECONDITION: the query requires an index') } } : original(name))
    const quiet = console.error
    console.error = () => {}
    try {
      assert.deepEqual(await sync(), { sent: 1 })
    } finally {
      console.error = quiet
    }
    assert.match(sent[0].html, /Paid to process order/)
    assert.equal(db.read('adminTelegram', 'a1').cursor.support, at(0), 'its cursor did not move')

    db.collection = original
    assert.deepEqual(await sync(), { sent: 1 })
    assert.match(sent[1].html, /New message from Sue Shop/)
  })
})
