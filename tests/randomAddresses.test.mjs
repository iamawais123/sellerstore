// The 1,000 random US customers behind the "Random USA" button on the Give Order screen.
// Pure logic (no Firebase): runs without the emulator.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ADDRESS_POOL_SIZE, randomAddressPool, randomUSACustomer } from '../admin-dashboard/src/data/randomAddresses.js'

const pool = randomAddressPool()

describe('the random address pool', () => {
  it('holds exactly 1,000 addresses', () => {
    assert.equal(ADDRESS_POOL_SIZE, 1000)
    assert.equal(pool.length, 1000)
  })

  it('never repeats a street address', () => {
    const keys = new Set(pool.map((entry) => `${entry.address1}|${entry.city}|${entry.state}`))
    assert.equal(keys.size, 1000)
  })

  it('is the same pool every time it is built', () => {
    assert.strictEqual(randomAddressPool(), pool)
  })

  it('gives every entry a complete, well-formed US customer', () => {
    for (const entry of pool) {
      assert.match(entry.fullName, /^\S+ \S+$/, entry.fullName)
      assert.match(entry.phone, /^\+1 [2-9]\d\d-[2-9]\d\d-\d{4}$/, entry.phone)
      assert.match(entry.address1, /^\d{3,4} (?:[NSEW] )?[\w-]+(?: [\w-]+)? [A-Za-z]+$/, entry.address1)
      assert.ok(entry.address2 === '' || /^(?:Apt|Unit) \d{1,2}[A-D]?$/.test(entry.address2), entry.address2)
      assert.ok(entry.city, 'city')
      assert.match(entry.state, /^[A-Z]{2}$/, entry.state)
      assert.match(entry.postalCode, /^\d{5}$/, entry.postalCode)
    }
  })

  it('keeps the exchange of a phone number a real one (never N11)', () => {
    for (const entry of pool) assert.notEqual(Number(entry.phone.split('-')[1]) % 100, 11, entry.phone)
  })

  it('agrees with itself: the ZIP and the phone area code belong to the city and state', () => {
    // Spot-check well-known places against what they really use.
    const known = {
      'Boston|MA': { zip: /^021\d\d$/, area: '617' },
      'Chicago|IL': { zip: /^606\d\d$/, area: '312' },
      'Seattle|WA': { zip: /^981\d\d$/, area: '206' },
      'Miami|FL': { zip: /^331\d\d$/, area: '305' },
      'Austin|TX': { zip: /^787\d\d$/, area: '512' },
      'Denver|CO': { zip: /^802\d\d$/, area: '303' },
    }
    let checked = 0
    for (const entry of pool) {
      const expected = known[`${entry.city}|${entry.state}`]
      if (!expected) continue
      checked += 1
      assert.match(entry.postalCode, expected.zip, `${entry.city} ${entry.postalCode}`)
      assert.equal(entry.phone.split(' ')[1].split('-')[0], expected.area, `${entry.city} ${entry.phone}`)
    }
    assert.ok(checked >= 20, `only ${checked} of the well-known places turned up`)
  })

  it('covers many cities and states, not a handful', () => {
    assert.ok(new Set(pool.map((entry) => `${entry.city}|${entry.state}`)).size >= 100)
    assert.ok(new Set(pool.map((entry) => entry.state)).size >= 40)
  })
})

describe('the Random USA button', () => {
  it('fills every field the Give Order form has', () => {
    const customer = randomUSACustomer()
    assert.deepEqual(Object.keys(customer).sort(), ['address1', 'address2', 'city', 'country', 'fullName', 'phone', 'postalCode', 'state'])
    assert.equal(customer.country, 'United States')
    assert.ok(customer.fullName && customer.address1 && customer.city && customer.state && customer.postalCode && customer.phone)
  })

  it('deals all 1,000 addresses once each before any comes round again', () => {
    // Deals may start part-way through a deck (earlier tests drew from it), so look for the one full deck
    // inside 2,000 deals: some run of exactly 1,000 consecutive deals holds every address once.
    const deals = Array.from({ length: 2000 }, () => {
      const customer = randomUSACustomer()
      return `${customer.address1}|${customer.city}|${customer.state}`
    })
    const fullDeck = Array.from({ length: 1001 }, (_, start) => start).find((start) => new Set(deals.slice(start, start + 1000)).size === 1000)
    assert.notEqual(fullDeck, undefined, 'no run of 1,000 deals covered all 1,000 addresses')
  })

  it('never deals the same customer twice in a row', () => {
    let previous = randomUSACustomer()
    for (let i = 0; i < 2500; i += 1) {
      const next = randomUSACustomer()
      assert.notDeepEqual(next, previous)
      previous = next
    }
  })

  it('is not in the same order every time', () => {
    const first = Array.from({ length: 30 }, () => randomUSACustomer().address1).join('|')
    const second = Array.from({ length: 30 }, () => randomUSACustomer().address1).join('|')
    assert.notEqual(first, second)
  })
})
