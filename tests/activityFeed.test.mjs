// What "Recent Actions" and "My Logs" make of the stored activity, login and device records.
// Pure logic (no Firebase): runs without the emulator.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildFeed,
  buildMyLogs,
  countByCategory,
  countMyLogs,
  dayLabel,
  decodeEntities,
  eventsFromActivity,
  filterFeed,
  filterMyLogs,
  groupByDay,
  logTime,
  relativeTime,
  signedMoney,
  summarize,
} from '../admin-dashboard/src/lib/activityFeed.js'
import { deviceKey } from '../admin-dashboard/src/firebase/shopData.js'

const NOW = new Date(2026, 8, 17, 15, 20, 0).getTime()
const ago = (seconds) => new Date(NOW - seconds * 1000).toISOString()
const seller = { id: 's1', fullName: 'Awais1111', email: 'awais@example.com', shopName: 'Shop', lastActiveAt: ago(30) }

describe('formatting', () => {
  it('words relative times the way the feed does', () => {
    assert.equal(relativeTime(ago(5), NOW), 'just now')
    assert.equal(relativeTime(ago(75), NOW), '1m ago')
    assert.equal(relativeTime(ago(9 * 60), NOW), '9m ago')
    assert.equal(relativeTime(ago(3 * 3600), NOW), '3h ago')
    assert.equal(relativeTime(ago(2 * 86400), NOW), '2d ago')
  })

  it('signs balance lines like the feed does', () => {
    assert.equal(signedMoney(-40), '$-40.00')
    assert.equal(signedMoney(1000), '+$1000.00')
    assert.equal(signedMoney(0), '+$0.00')
  })

  it('groups by day and decodes catalogue entities', () => {
    assert.equal(dayLabel(ago(60), NOW), 'Today')
    assert.equal(dayLabel(ago(86400), NOW), 'Yesterday')
    assert.equal(decodeEntities('Desk with Drawers &amp; Shelves 62&quot;'), 'Desk with Drawers & Shelves 62"')
  })

  it('formats log times as day month year, 24-hour', () => {
    assert.match(logTime(new Date(2026, 8, 17, 15, 17).toISOString()), /^17 Sept?\.? 2026, 15:17$/)
  })
})

describe('recent actions', () => {
  it('expands one withdrawal request into the request and the funds held', () => {
    const events = eventsFromActivity({ id: 'a1', type: 'withdrawal_requested', amount: 40, at: ago(10), sellerId: 's1', meta: { method: 'Crypto · USDT_TRC20' } }, seller)
    assert.deepEqual(events.map((event) => [event.category, event.text]), [
      ['withdrawal_requested', 'Requested a withdrawal — $40.00 — Crypto · USDT_TRC20'],
      ['balance', 'Withdrawal requested — funds held — $-40.00 (shop_balance)'],
    ])
  })

  it('expands an approval and a rejection', () => {
    const approved = eventsFromActivity({ id: 'a2', type: 'withdrawal_approved', amount: 100, at: ago(10), sellerId: 's1', meta: { method: 'Bank · Awais NBank' } })
    assert.equal(approved[0].text, 'Withdrawal approved — $100.00 — Bank · Awais NBank')
    assert.equal(approved[1].text, 'Withdrawal approved — paid out — +$0.00 (shop_balance)')
    const rejected = eventsFromActivity({ id: 'a3', type: 'withdrawal_rejected', amount: 25, at: ago(10), sellerId: 's1' })
    assert.equal(rejected[0].text, 'Withdrawal rejected — $25.00')
    assert.equal(rejected[1].text, 'Withdrawal rejected — funds returned — +$25.00 (shop_balance)')
  })

  it('lists every product of an "added to shop" line', () => {
    const items = [
      { id: 'cat-1', name: 'Bakers Rack', image: '/a.jpg', price: 99.99 },
      { id: 'cat-2', name: 'Desk &amp; Shelves', image: '/b.jpg', price: 89.99 },
    ]
    const events = eventsFromActivity({ id: 'a4', type: 'seller_products_added', at: ago(5), sellerId: 's1', meta: { items } })
    assert.equal(events.length, 2)
    assert.ok(events.every((event) => event.category === 'product' && event.text === 'Added a product'))
    assert.equal(events[1].product.price, 89.99)
    assert.equal(new Set(events.map((event) => event.key)).size, 2)
  })

  it('still shows an "added to shop" line saved before products were listed', () => {
    const events = eventsFromActivity({ id: 'a5', type: 'seller_products_added', title: '3 products added to shop', at: ago(5), sellerId: 's1' })
    assert.deepEqual(events.map((event) => event.text), ['3 products added to shop'])
  })

  it('keeps the place and device of a sign-up', () => {
    const [event] = eventsFromActivity(
      { id: 'a6', type: 'seller_signup', at: ago(5), sellerId: 's1', entity: 'Awais', meta: { email: 'awais@example.com', location: 'Shahkot, Punjab, Pakistan', ip: '162.4.16.175', device: 'Desktop • Windows • Chrome' } },
      seller
    )
    assert.equal(event.category, 'signup')
    assert.equal(event.text, 'New seller registered — awais@example.com')
    assert.equal(event.location, 'Shahkot, Punjab, Pakistan')
    assert.equal(event.detail, 'Desktop • Windows • Chrome — 162.4.16.175')
  })

  it('files deposits, order payments and everything else', () => {
    const one = (row) => eventsFromActivity({ id: 'x', at: ago(1), sellerId: 's1', ...row })[0]
    assert.equal(one({ type: 'seller_balance_add', amount: 1000 }).category, 'deposit')
    assert.equal(one({ type: 'seller_balance_deduct', amount: 5 }).category, 'balance')
    assert.equal(one({ type: 'order_paid', amount: 44.64 }).text, 'Paid to process order — $-44.64 (shop_balance)')
    assert.equal(one({ type: 'order_paid' }).text, 'Paid to process order')
    assert.equal(one({ type: 'payout_method_added', meta: { method: 'Crypto · USDT_TRC20' } }).category, 'payout')
    assert.equal(one({ type: 'kyc_approved', title: 'KYC Approved' }).category, 'other')
    assert.equal(one({ type: 'invite_change', title: 'Invite code updated', entity: 'ABCD2345', sellerId: '' }).text, 'Invite code updated — ABCD2345')
  })

  const activity = [
    { id: 'w1', type: 'withdrawal_requested', amount: 40, at: ago(60), sellerId: 's1', meta: { method: 'Crypto · USDT_TRC20' } },
    { id: 'p1', type: 'seller_products_added', at: ago(600), sellerId: 's1', meta: { items: [{ id: 'c1', name: 'Roku Remote', price: 19.88 }] } },
    { id: 'r1', type: 'seller_signup', at: ago(3 * 86400), sellerId: 's1', meta: { email: 'awais@example.com' } },
  ]
  const logins = [
    { id: 'l1', sellerId: 's1', at: ago(30), device: 'Desktop • Windows • Chrome', ip: '162.4.16.175', location: 'Shahkot, Punjab, Pakistan' },
    { id: 'l2', sellerId: 's1', at: ago(20), device: 'Admin Panel', ip: 'Admin impersonation' },
  ]

  it('merges activity and sign-ins, newest first, with the seller attached', () => {
    const feed = buildFeed({ activity, logins, shops: [seller], now: NOW })
    assert.deepEqual(feed.map((event) => event.category), ['signin', 'withdrawal_requested', 'balance', 'product', 'signup'])
    assert.equal(feed[0].text, 'Seller signed in — Shahkot, Punjab, Pakistan')
    assert.equal(feed[0].detail, 'Desktop • Windows • Chrome — 162.4.16.175')
    assert.equal(feed[0].name, 'Awais1111')
    assert.equal(feed[0].email, 'awais@example.com')
    assert.equal(feed[0].online, true)
  })

  it('does not list a "log in as seller" session as a seller sign-in', () => {
    assert.ok(!buildFeed({ activity: [], logins: [logins[1]], shops: [seller], now: NOW }).length)
  })

  it('counts each event once so the pills add up to All', () => {
    const feed = buildFeed({ activity, logins, shops: [seller], now: NOW })
    const counts = countByCategory(feed)
    const { all, ...rest } = counts
    assert.equal(all, 5)
    assert.equal(Object.values(rest).reduce((sum, value) => sum + value, 0), all)
    assert.equal(counts.signin, 1)
    assert.equal(counts.product, 1)
  })

  it('filters by category and by search', () => {
    const feed = buildFeed({ activity, logins, shops: [seller], now: NOW })
    assert.equal(filterFeed(feed, { category: 'product' }).length, 1)
    assert.equal(filterFeed(feed, { query: 'roku' }).length, 1)
    assert.equal(filterFeed(feed, { query: 'shahkot' }).length, 1)
    assert.equal(filterFeed(feed, { query: 'AWAIS@example' }).length, feed.length)
    assert.equal(filterFeed(feed, { query: 'nothing like this' }).length, 0)
  })

  it("summarizes today's events into the four buckets and by hour", () => {
    const feed = buildFeed({ activity, logins, shops: [seller], now: NOW })
    const summary = summarize(feed, NOW)
    assert.equal(summary.total, 4) // the sign-up three days ago is not today
    assert.deepEqual(summary.counts, { logins: 1, products: 1, financial: 2, other: 0 })
    assert.equal(summary.hours[15], 4)
    assert.equal(summary.peak, 4)
  })

  it('groups events into days', () => {
    const feed = buildFeed({ activity, logins, shops: [seller], now: NOW })
    const groups = groupByDay(feed, NOW)
    assert.equal(groups[0].label, 'Today')
    assert.equal(groups[0].events.length, 4)
    assert.equal(groups.length, 2)
  })

  it('treats a seller idle for a while as offline', () => {
    const feed = buildFeed({ activity, logins: [], shops: [{ ...seller, lastActiveAt: ago(3600) }], now: NOW })
    assert.equal(feed[0].online, false)
  })
})

describe('my logs', () => {
  const thisDevice = 'dev-me'
  const loginEntries = [
    { id: 'a', adminId: 'a1', at: ago(60), via: 'Admin console', ip: '162.4.16.175', location: 'Shahkot, Punjab, Pakistan', device: 'Desktop • Windows • Chrome', deviceId: 'dev-me' },
    { id: 'b', adminId: 'a1', at: ago(86400 * 10), via: 'Admin console', ip: '119.73.96.111', device: 'Desktop • Windows • Chrome', deviceId: 'dev-other' },
    { id: 'c', adminId: 'a1', at: ago(86400 * 5), via: 'Super admin: Sam' },
  ]
  const actionRows = [
    { id: 'x1', type: 'withdrawal_approved', amount: 40, at: ago(30), entity: 'Awais', sellerId: 's1' },
    { id: 'x2', type: 'seller_balance_add', amount: 1000, at: ago(600), entity: 'Awais', sellerId: 's1' },
    { id: 'x3', type: 'seller_balance_deduct', amount: 5, at: ago(700), entity: 'Awais', sellerId: 's1' },
    { id: 'x4', type: 'kyc_approved', title: 'KYC Approved', at: ago(900), entity: 'Awais', sellerId: 's1' },
  ]
  const rows = buildMyLogs({ logins: loginEntries, actions: actionRows, labels: { 'dev-other': 'Office PC' }, thisDevice, deviceKeyOf: deviceKey })

  it('words admin actions the way My Logs does', () => {
    const byId = Object.fromEntries(rows.map((row) => [row.id, row]))
    assert.equal(byId.x1.title, 'Approved a withdrawal')
    assert.equal(byId.x1.subtitle, '$40.00')
    assert.equal(byId.x1.kind, 'action')
    assert.equal(byId.x2.title, 'Deposited to seller balance')
    assert.equal(byId.x2.badge, '+$1000.00')
    assert.equal(byId.x2.subtitle, '+$1000.00 (shop_balance) — Admin adjustment')
    assert.equal(byId.x2.kind, 'balance')
    assert.equal(byId.x3.badge, '-$5.00')
    assert.equal(byId.x4.title, 'KYC Approved')
  })

  it('shows where and on what a sign-in happened, and which device is this one', () => {
    const first = rows.find((row) => row.id === 'a')
    assert.equal(first.title, 'Signed in')
    assert.equal(first.location, 'Shahkot, Punjab, Pakistan')
    assert.equal(first.ip, '162.4.16.175')
    assert.equal(first.device, 'Desktop · Windows · Chrome')
    assert.equal(first.thisDevice, true)
    assert.equal(first.needsLocation, false)
    const other = rows.find((row) => row.id === 'b')
    assert.equal(other.thisDevice, false)
    assert.equal(other.needsLocation, true)
    assert.equal(other.deviceLabel, 'Office PC')
  })

  it('does not let the admin name a super admin\'s sign-in', () => {
    const bySuper = rows.find((row) => row.id === 'c')
    assert.equal(bySuper.title, 'Signed in by super admin Sam')
    assert.equal(bySuper.nameable, false)
    assert.equal(bySuper.needsLocation, false)
  })

  it('sorts newest first and counts per tab', () => {
    assert.deepEqual(rows.slice(0, 2).map((row) => row.id), ['x1', 'a'])
    assert.deepEqual(countMyLogs(rows), { all: 7, login: 3, action: 2, balance: 2 })
  })

  it('filters by tab and search', () => {
    assert.equal(filterMyLogs(rows, { tab: 'login' }).length, 3)
    assert.equal(filterMyLogs(rows, { tab: 'balance' }).length, 2)
    assert.equal(filterMyLogs(rows, { query: 'shahkot' }).length, 1)
    assert.equal(filterMyLogs(rows, { query: 'office pc' }).length, 1)
    assert.equal(filterMyLogs(rows, { query: '1000' }).length, 1)
  })
})

describe('device keys', () => {
  it('uses the device id, or address + description for older sign-ins, and stays a safe field name', () => {
    assert.equal(deviceKey({ deviceId: 'dev-abc-123' }), 'dev-abc-123')
    assert.equal(deviceKey({ ip: '1.2.3.4', device: 'Desktop • Windows' }), '1_2_3_4_Desktop___Windows')
    assert.match(deviceKey({ deviceId: 'a.b/c' }), /^[A-Za-z0-9_-]+$/)
  })
})
