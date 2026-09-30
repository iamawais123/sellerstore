// The money of an order: what the products sell for is split exactly into what the seller pays and the
// seller's profit, and delivery hands the seller back the whole total. Pure functions of
// src/firebase/shopData.js, so this runs without the emulator (`node --test tests/orderTotals.test.mjs`).
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_PROFIT_RANGE, computeOrderTotals, hasProfitRatio, itemProfitRatio, orderPayout, rollProfitRatio } from '../src/firebase/shopData.js'

const cents = (value) => Math.round(value * 100)
const sum = (a, b) => cents(a) + cents(b)

// The order from the admin's review screen: one product, $43.19 to the customer, catalogue cost $34.55.
const TOY = { catalogId: 'toy', qty: 1, sell: 43.19, cost: 34.55 }

describe('the default profit range', () => {
  it('is 18%-22%', () => {
    assert.deepEqual(DEFAULT_PROFIT_RANGE, [0.18, 0.22])
  })

  it('rolls inside the range, and reaches well past the old 20% ceiling', () => {
    const rolls = Array.from({ length: 4000 }, rollProfitRatio)
    assert.ok(rolls.every((ratio) => ratio >= 0.18 && ratio <= 0.22), 'every roll stays within 18%-22%')
    assert.ok(Math.max(...rolls) > 0.21, 'rolls above 21% happen')
    assert.ok(Math.min(...rolls) < 0.19, 'rolls below 19% happen')
  })
})

describe('which profit ratio applies', () => {
  it('treats a missing, zero, negative or nonsense ratio as "use the default"', () => {
    for (const ratio of [undefined, null, 0, -0.1, 1.5, NaN, '0.25']) assert.equal(hasProfitRatio(ratio), false, String(ratio))
    for (const ratio of [0.01, 0.25, 1]) assert.equal(hasProfitRatio(ratio), true, String(ratio))
  })

  it('uses the seller\'s ratio when set, else the ratio already rolled for the product, else rolls one', () => {
    assert.equal(itemProfitRatio({ defaultRatio: 0.19 }, 0.25), 0.25)
    assert.equal(itemProfitRatio({ defaultRatio: 0.19 }, 0), 0.19)
    assert.equal(itemProfitRatio({ defaultRatio: 0.19 }, undefined), 0.19)
    const fresh = itemProfitRatio({}, 0)
    assert.ok(fresh >= 0.18 && fresh <= 0.22)
  })
})

describe('computeOrderTotals: total = seller pays + profit', () => {
  it('splits the review-screen order at the seller\'s 25%', () => {
    assert.deepEqual(computeOrderTotals([TOY], 0.25), { total: 43.19, cost: 32.39, profit: 10.8 })
  })

  it('always adds up to the cent, for any ratio, quantity and mix of products', () => {
    const items = [
      { qty: 3, sell: 19.99 },
      { qty: 1, sell: 43.19 },
      { qty: 7, sell: 5.45 },
      { qty: 2, sell: 0.99 },
    ]
    for (const ratio of [undefined, 0, 0.05, 0.18, 0.2, 0.22, 0.333, 0.25, 0.5, 1]) {
      for (let run = 0; run < 50; run += 1) {
        const { total, cost, profit } = computeOrderTotals(items, ratio)
        assert.equal(sum(cost, profit), cents(total), `ratio ${ratio}: ${cost} + ${profit} should be ${total}`)
        assert.ok(cost >= 0 && profit >= 0)
      }
    }
  })

  it('gives a seller with a ratio of 0 the default 18%-22%, the same as one with no ratio', () => {
    for (const ratio of [0, undefined]) {
      for (let run = 0; run < 200; run += 1) {
        const { total, profit } = computeOrderTotals([TOY], ratio)
        assert.ok(profit >= total * 0.18 - 0.01 && profit <= total * 0.22 + 0.01, `profit ${profit} on ${total} is 18%-22%`)
      }
    }
  })

  it('lets a product keep the default share it was rolled, so a reviewed order comes out as reviewed', () => {
    const pinned = { ...TOY, defaultRatio: 0.2 }
    const first = computeOrderTotals([pinned], 0)
    assert.deepEqual(first, { total: 43.19, cost: 34.55, profit: 8.64 })
    for (let run = 0; run < 20; run += 1) assert.deepEqual(computeOrderTotals([pinned], 0), first)
    // ...but a ratio the admin set wins over it
    assert.equal(computeOrderTotals([pinned], 0.25).profit, 10.8)
  })

  it('rounds each product\'s profit to the cent, so the lines the admin reviews sum to the order', () => {
    const items = [
      { qty: 1, sell: 10.03, defaultRatio: 0.185 },
      { qty: 1, sell: 10.03, defaultRatio: 0.185 },
      { qty: 1, sell: 10.03, defaultRatio: 0.185 },
    ]
    const lines = items.map((item) => computeOrderTotals([item], 0))
    const order = computeOrderTotals(items, 0)
    assert.equal(cents(order.profit), lines.reduce((acc, line) => acc + cents(line.profit), 0))
    assert.equal(cents(order.cost), lines.reduce((acc, line) => acc + cents(line.cost), 0))
  })
})

describe('orderPayout: what delivery pays into the seller\'s balance', () => {
  const order = { total: 43.19, cost: 32.39, profit: 10.8 }

  it('hands back the cost the seller paid and adds the profit: the order\'s whole total', () => {
    assert.equal(orderPayout({ ...order, status: 'Out for delivery', paidAt: '2026-09-30T00:00:00.000Z' }), 43.19)
    assert.equal(orderPayout({ ...order, status: 'Paid' }), 43.19, 'an older paid order without a paidAt still counts as paid')
  })

  it('pays a whole-order total even when the order came from the ratio flow', () => {
    const { total, cost, profit } = computeOrderTotals([TOY], 0.25)
    assert.equal(orderPayout({ total, cost, profit, status: 'Paid', paidAt: 'x' }), total)
  })

  it('does not hand back a cost that was never paid', () => {
    assert.equal(orderPayout({ ...order, status: 'Unpaid' }), 10.8)
    assert.equal(orderPayout({ ...order, status: 'Cancelled' }), 10.8)
  })

  it('copes with orders that have no cost or profit', () => {
    assert.equal(orderPayout({ status: 'Paid', paidAt: 'x' }), 0)
  })
})
