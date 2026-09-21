// What the admin's support inbox makes of a seller and a thread: online state, last seen, the live
// location and device, day separators and read ticks. Pure logic (no Firebase): runs without the emulator.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  filterConversations,
  isOnline,
  lastSeenLabel,
  presenceText,
  resolvePresence,
  shortThreadId,
  threadItems,
  withReadState,
} from '../admin-dashboard/src/lib/supportChat.js'

const NOW = new Date(2026, 8, 21, 15, 20, 0).getTime()
const ago = (seconds) => new Date(NOW - seconds * 1000).toISOString()
const at = (day, hour, minute) => new Date(2026, 8, day, hour, minute, 0).toISOString()

describe('online and last seen', () => {
  it('counts a seller as online for 5 minutes after their last heartbeat', () => {
    assert.equal(isOnline({ lastActiveAt: ago(30) }, NOW), true)
    assert.equal(isOnline({ lastActiveAt: ago(4 * 60) }, NOW), true)
    assert.equal(isOnline({ lastActiveAt: ago(6 * 60) }, NOW), false)
    assert.equal(isOnline({}, NOW), false)
    assert.equal(isOnline({ lastActiveAt: 'garbage' }, NOW), false)
  })

  it('words last seen by how long ago it was', () => {
    assert.equal(lastSeenLabel({ lastActiveAt: at(21, 15, 1) }, NOW), '15:01')
    assert.equal(lastSeenLabel({ lastActiveAt: at(20, 9, 5) }, NOW), 'Yesterday 09:05')
    assert.match(lastSeenLabel({ lastActiveAt: at(17, 15, 1) }, NOW), /^17 Sept?\.? 15:01$/)
    assert.equal(lastSeenLabel({}, NOW), 'Never')
  })

  it('says Online or Last seen', () => {
    assert.equal(presenceText({ lastActiveAt: ago(10) }, NOW), 'Online')
    assert.equal(presenceText({ lastActiveAt: at(21, 15, 1) }, NOW), 'Last seen 15:01')
  })
})

describe('where the seller is', () => {
  const login = { sellerId: 's1', at: at(20, 10, 0), ip: '1.1.1.1', location: 'Lahore, Punjab, Pakistan', device: 'Desktop • Windows • Chrome' }

  it('uses what the open storefront reported when it is newer than the last sign-in', () => {
    const shop = { lastLocation: 'Shahkot, Punjab, Pakistan', lastIp: '2.2.2.2', lastDevice: 'Mobile • Android • Chrome', locationAt: at(21, 15, 0) }
    assert.deepEqual(resolvePresence(shop, [login]), { location: 'Shahkot, Punjab, Pakistan', ip: '2.2.2.2', device: 'Mobile • Android • Chrome', at: at(21, 15, 0) })
  })

  it('falls back to the latest real sign-in until the seller has reported anything', () => {
    const older = { ...login, at: at(19, 8, 0), location: 'Karachi, Sindh, Pakistan' }
    assert.equal(resolvePresence({}, [older, login]).location, 'Lahore, Punjab, Pakistan')
    assert.equal(resolvePresence({}, [older, login]).device, 'Desktop • Windows • Chrome')
  })

  it('prefers a sign-in newer than the last report', () => {
    const shop = { lastLocation: 'Old place', lastIp: '3.3.3.3', locationAt: at(18, 9, 0) }
    assert.equal(resolvePresence(shop, [login]).location, 'Lahore, Punjab, Pakistan')
  })

  it('never shows an admin impersonation as where the seller is', () => {
    const fake = { sellerId: 's1', at: at(21, 15, 10), ip: 'Admin impersonation', device: 'Admin Panel' }
    assert.equal(resolvePresence({}, [login, fake]).location, 'Lahore, Punjab, Pakistan')
    assert.deepEqual(resolvePresence({}, [fake]), { location: '', ip: '', device: '', at: '' })
  })

  it('borrows a missing place from the other source (a sign-in whose lookup failed)', () => {
    const noPlace = { ...login, at: at(21, 15, 0), location: undefined, ip: '4.4.4.4' }
    const shop = { lastLocation: 'Shahkot, Punjab, Pakistan', locationAt: at(21, 9, 0) }
    const found = resolvePresence(shop, [noPlace])
    assert.equal(found.location, 'Shahkot, Punjab, Pakistan')
    assert.equal(found.ip, '4.4.4.4')
  })

  it('has nothing to show for a seller who has never been seen', () => {
    assert.deepEqual(resolvePresence({}, []), { location: '', ip: '', device: '', at: '' })
    assert.deepEqual(resolvePresence(undefined, undefined), { location: '', ip: '', device: '', at: '' })
  })
})

describe('the thread', () => {
  const messages = [
    { id: 'm1', sender: 'admin', text: 'Welcome', at: at(20, 23, 58) },
    { id: 'm2', sender: 'seller', text: 'Hi', at: at(21, 0, 3) },
    { id: 'm3', sender: 'admin', text: 'One', at: at(21, 0, 4) },
    { id: 'm4', sender: 'admin', text: 'Two', at: at(21, 0, 5) },
  ]

  it('marks the admin messages the seller has not opened yet as unread, newest first', () => {
    const state = Object.fromEntries(withReadState(messages, 2).map((m) => [m.id, m.read]))
    assert.deepEqual(state, { m1: true, m2: true, m3: false, m4: false })
    assert.equal(withReadState(messages, 0).every((m) => m.read), true)
    assert.equal(withReadState(messages, 99).find((m) => m.id === 'm1').read, false)
  })

  it('starts a new day heading when the date changes', () => {
    const list = threadItems(messages, 0)
    assert.deepEqual(list.map((item) => item.type), ['day', 'message', 'day', 'message', 'message', 'message'])
    assert.match(list[0].label, /^20 Sept?\.? 2026$/)
    assert.match(list[2].label, /^21 Sept?\.? 2026$/)
  })

  it('handles an empty thread', () => {
    assert.deepEqual(threadItems([], 0), [])
  })
})

describe('the seller list', () => {
  const conversation = (id, status, seller) => ({ id, status, seller })
  const list = [
    conversation('a', 'active', { shopName: 'Awais1111', fullName: 'Awais Shafique', email: 'awais@x.com' }),
    conversation('b', 'active', { shopName: 'Dock11', fullName: 'Dana', email: 'dana@x.com' }),
    conversation('c', 'archived', { shopName: 'Old shop', fullName: 'Olly', email: 'olly@x.com' }),
  ]

  it('shows one tab at a time', () => {
    assert.deepEqual(filterConversations(list, { tab: 'active' }).map((item) => item.id), ['a', 'b'])
    assert.deepEqual(filterConversations(list, { tab: 'archived' }).map((item) => item.id), ['c'])
  })

  it('searches shop, name, email and place', () => {
    assert.deepEqual(filterConversations(list, { tab: 'active', term: ' dock' }).map((item) => item.id), ['b'])
    assert.deepEqual(filterConversations(list, { tab: 'active', term: 'shafique' }).map((item) => item.id), ['a'])
    assert.deepEqual(filterConversations(list, { tab: 'active', term: 'shahkot', location: (item) => (item.id === 'b' ? 'Shahkot, Punjab' : '') }).map((item) => item.id), ['b'])
  })

  it('quotes a short thread id', () => {
    assert.equal(shortThreadId('support-dc4bf23f9a1b2c3d'), 'dc4bf23f…')
    assert.equal(shortThreadId('support-abc'), 'abc')
  })
})
