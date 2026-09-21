// What the admin's Orders page and Schedules window make of orders and schedules: stage rules, counts,
// filters, bulk moves, countdowns and the date inputs. Pure logic (no Firebase): runs without the emulator.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { FILTERS, STAGES, bulkTargets, canMoveTo, filterOrders, nextStages, orderAge, orderCounts, planBulkMove, statusCounts } from '../admin-dashboard/src/lib/orders.js'
import { countdown, dueSchedules, filterSchedules, fromLocalInput, quickTimes, splitSchedules, toLocalInput, whenLabel } from '../admin-dashboard/src/lib/schedules.js'

const NOW = new Date(2026, 8, 21, 15, 20, 0).getTime()
const ago = (minutes) => new Date(NOW - minutes * 60000).toISOString()
const ahead = (minutes) => new Date(NOW + minutes * 60000).toISOString()
const order = (id, status, extra = {}) => ({ id, status, customer: { fullName: 'Parker Brown', city: 'Boston' }, items: [{ name: 'Wicker Patio Set' }], ...extra })

describe('order stages', () => {
  it('only moves an order forward, and holds an unpaid one until the seller pays', () => {
    assert.deepEqual(nextStages(order('a', 'Unpaid')), [])
    assert.deepEqual(nextStages(order('a', 'Paid')), ['Pickup', 'On the way', 'Out for delivery', 'Delivered'])
    assert.deepEqual(nextStages(order('a', 'Out for delivery')), ['Delivered'])
    assert.deepEqual(nextStages(order('a', 'Delivered')), [])
    assert.deepEqual(nextStages(order('a', 'Cancelled')), [])
  })

  it('lets any open order be cancelled, and nothing move once it is closed', () => {
    assert.equal(canMoveTo(order('a', 'Unpaid'), 'Cancelled'), true)
    assert.equal(canMoveTo(order('a', 'Pickup'), 'Cancelled'), true)
    assert.equal(canMoveTo(order('a', 'Unpaid'), 'Pickup'), false)
    assert.equal(canMoveTo(order('a', 'Pickup'), 'Paid'), false)
    assert.equal(canMoveTo(order('a', 'Pickup'), 'Pickup'), false)
    assert.equal(canMoveTo(order('a', 'Delivered'), 'Cancelled'), false)
    assert.equal(canMoveTo(order('a', 'Cancelled'), 'Delivered'), false)
  })
})

describe('counts and filters', () => {
  const orders = [order('1', 'Unpaid'), order('2', 'Paid'), order('3', 'Delivered'), order('4', 'Cancelled', { customer: { fullName: 'Casey Diaz' } })]

  it('counts what a seller card shows', () => {
    assert.deepEqual(orderCounts(orders), { total: 4, pending: 2, delivered: 1, cancelled: 1 })
    assert.deepEqual(orderCounts([]), { total: 0, pending: 0, delivered: 0, cancelled: 0 })
  })

  it('counts every pill, leaving cancelled out of All until shown', () => {
    const counts = statusCounts(orders)
    assert.deepEqual([counts.All, counts.Unpaid, counts.Paid, counts.Delivered, counts.Cancelled, counts.Pickup], [3, 1, 1, 1, 1, 0])
    assert.equal(statusCounts(orders, true).All, 4)
    assert.deepEqual(FILTERS, ['All', 'Unpaid', ...STAGES, 'Cancelled'])
  })

  it('hides cancelled orders until asked, or until they are the chosen status', () => {
    assert.deepEqual(filterOrders(orders).map((o) => o.id), ['1', '2', '3'])
    assert.deepEqual(filterOrders(orders, { showCancelled: true }).map((o) => o.id), ['1', '2', '3', '4'])
    assert.deepEqual(filterOrders(orders, { status: 'Cancelled' }).map((o) => o.id), ['4'])
    assert.deepEqual(filterOrders(orders, { status: 'Paid' }).map((o) => o.id), ['2'])
  })

  it('searches customer, city, product and status', () => {
    assert.deepEqual(filterOrders(orders, { term: 'casey', showCancelled: true }).map((o) => o.id), ['4'])
    assert.deepEqual(filterOrders(orders, { term: ' wicker ' }).map((o) => o.id), ['1', '2', '3'])
    assert.deepEqual(filterOrders(orders, { term: 'boston', status: 'Delivered' }).map((o) => o.id), ['3'])
    assert.deepEqual(filterOrders(orders, { term: 'nothing' }), [])
  })

  it('words how long ago an order was given', () => {
    assert.equal(orderAge(ago(0), NOW), '0m')
    assert.equal(orderAge(ago(12), NOW), '12m')
    assert.equal(orderAge(ago(190), NOW), '3h')
    assert.equal(orderAge(ago(60 * 50), NOW), '2d')
    assert.equal(orderAge('nope', NOW), '')
    assert.equal(orderAge(ahead(5), NOW), '0m')
  })
})

describe('bulk moves', () => {
  const picked = [order('1', 'Unpaid'), order('2', 'Paid'), order('3', 'Pickup'), order('4', 'Delivered')]

  it('moves the orders that can make the move and leaves the rest', () => {
    const plan = planBulkMove(picked, 'On the way')
    assert.deepEqual(plan.move.map((o) => o.id), ['2', '3'])
    assert.deepEqual(plan.skip.map((o) => o.id), ['1', '4'])
    assert.deepEqual(planBulkMove(picked, 'Cancelled').move.map((o) => o.id), ['1', '2', '3'])
    assert.deepEqual(planBulkMove(picked, 'Paid').move, [])
  })

  it('offers only moves that at least one selected order can make', () => {
    assert.deepEqual(bulkTargets(picked), ['Pickup', 'On the way', 'Out for delivery', 'Delivered', 'Cancelled'])
    assert.deepEqual(bulkTargets([order('1', 'Unpaid')]), ['Cancelled'])
    assert.deepEqual(bulkTargets([order('1', 'Delivered')]), [])
  })
})

describe('schedules', () => {
  const list = [
    { id: 'a', status: 'Scheduled', scheduledFor: ahead(600), customer: { fullName: 'Late Buyer' }, sellerName: 'Awais', items: [{ name: 'Lamp' }] },
    { id: 'b', status: 'Scheduled', scheduledFor: ahead(30), customer: { fullName: 'Soon Buyer' }, sellerName: 'Dana', shopName: 'Dock11', items: [{ name: 'Chair' }] },
    { id: 'c', status: 'Created', scheduledFor: ago(300), closedAt: ago(299), customer: { fullName: 'Old Buyer' }, sellerName: 'Awais', items: [] },
    { id: 'd', status: 'Failed', scheduledFor: ago(100), closedAt: ago(99), error: 'not verified', customer: { fullName: 'Failed Buyer' }, sellerName: 'Awais', items: [] },
    { id: 'e', status: 'Cancelled', scheduledFor: ago(10), closedAt: ago(200), customer: { fullName: 'Cancelled Buyer' }, sellerName: 'Awais', items: [] },
  ]

  it('splits upcoming (soonest first) from history (latest first)', () => {
    const { upcoming, history } = splitSchedules(list)
    assert.deepEqual(upcoming.map((s) => s.id), ['b', 'a'])
    assert.deepEqual(history.map((s) => s.id), ['d', 'e', 'c'])
  })

  it('searches customer, seller, shop and product, and filters history by status', () => {
    assert.deepEqual(filterSchedules(list, { term: 'dock11' }).map((s) => s.id), ['b'])
    assert.deepEqual(filterSchedules(list, { term: 'lamp' }).map((s) => s.id), ['a'])
    assert.deepEqual(filterSchedules(list, { status: 'Failed' }).map((s) => s.id), ['d'])
    assert.deepEqual(filterSchedules(list, { term: 'awais', status: 'Created' }).map((s) => s.id), ['c'])
  })

  it('finds the schedules that have come due, oldest first', () => {
    const waiting = [{ id: 'x', status: 'Scheduled', scheduledFor: ago(5) }, { id: 'y', status: 'Scheduled', scheduledFor: ago(60) }, { id: 'z', status: 'Scheduled', scheduledFor: ahead(5) }, { id: 'w', status: 'Created', scheduledFor: ago(90) }]
    assert.deepEqual(dueSchedules(waiting, NOW).map((s) => s.id), ['y', 'x'])
    assert.deepEqual(dueSchedules([], NOW), [])
  })

  it('says how far away one is', () => {
    assert.deepEqual(countdown(ahead(0.2), NOW), { text: 'in 1m', due: false })
    assert.deepEqual(countdown(ahead(12), NOW), { text: 'in 12m', due: false })
    assert.deepEqual(countdown(ahead(130), NOW), { text: 'in 2h 10m', due: false })
    assert.deepEqual(countdown(ahead(180), NOW), { text: 'in 3h', due: false })
    assert.deepEqual(countdown(ahead(60 * 28), NOW), { text: 'in 1d 4h', due: false })
    assert.deepEqual(countdown(ago(1), NOW), { text: 'Due now', due: true })
    assert.deepEqual(countdown('nope', NOW), { text: '', due: false })
  })

  it('words the date and time', () => {
    assert.match(whenLabel(new Date(2026, 8, 21, 15, 30).toISOString(), NOW), /^Mon,? 21 Sept? · 15:30$/)
    assert.match(whenLabel(new Date(2027, 0, 5, 9, 5).toISOString(), NOW), /2027 · 09:05$/)
    assert.equal(whenLabel('nope', NOW), '')
  })

  it('round-trips the date-time input', () => {
    const iso = new Date(2026, 8, 21, 15, 30).toISOString()
    assert.equal(toLocalInput(iso), '2026-09-21T15:30')
    assert.equal(fromLocalInput('2026-09-21T15:30'), iso)
    assert.equal(fromLocalInput(''), '')
    assert.equal(fromLocalInput('garbage'), '')
    assert.equal(toLocalInput('garbage'), '')
  })

  it('offers quick times that are all in the future', () => {
    const quick = quickTimes(NOW)
    assert.equal(quick.length, 4)
    quick.forEach((choice) => assert.ok(Date.parse(fromLocalInput(choice.value)) > NOW, choice.label))
    assert.equal(quick[0].value, '2026-09-21T16:20')
    assert.equal(quick[2].value, '2026-09-22T09:00')
  })
})
