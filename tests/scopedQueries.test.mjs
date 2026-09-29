// The super admin console reads only its own branch, in small groups of admins (the security rules can
// afford only a few lookups per query). This runs the console's own `watchForAdmins` against the rules
// with a super admin who has more admins than fit in one query.
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { after, before, beforeEach, describe, it } from 'node:test'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, doc, getDocs, limit, orderBy, query, setDoc, where, writeBatch } from 'firebase/firestore'

// The console has its own copy of the Firebase SDK, and a Firestore instance only works with the copy
// that created it. Point the console's Firebase imports at the SDK the test environment uses.
const rootFile = new URL('../package.json', import.meta.url).href
register(
  'data:text/javascript,' +
    encodeURIComponent(`export async function resolve(specifier, context, next) {
      if (/^@?firebase(\\/|$)/.test(specifier) && (context.parentURL || '').includes('/super-admin-dashboard/')) {
        return next(specifier, { ...context, parentURL: ${JSON.stringify(rootFile)} })
      }
      return next(specifier, context)
    }`)
)
const { ADMINS_PER_QUERY, newestFirst, watchForAdmins, watchWithIndexFallback } = await import('../super-admin-dashboard/src/firebase/scoped.js')
const consoleData = await import('../super-admin-dashboard/src/firebase/shopData.js')

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':')
let env
const now = '2026-09-19T00:00:00.000Z'
const db = (uid) => env.authenticatedContext(uid, { email: `${uid}@x.com` }).firestore()

// sa1 is the owner; sa2 has more admins than one query can name; sa3 has one.
const MINE = Array.from({ length: ADMINS_PER_QUERY * 2 + 3 }, (_, i) => `m${String(i).padStart(2, '0')}`)
const day = (i) => `2026-03-${String(i + 1).padStart(2, '0')}`

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-usellerstore',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) },
  })
})
after(async () => env?.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.firestore()
    const superAdmin = (fullName, createdBy) => ({ role: 'superadmin', fullName, email: `${fullName}@x.com`, inviteCode: fullName.toUpperCase(), createdAt: now, createdBy })
    await setDoc(doc(s, 'meta/bootstrap'), { superAdminUid: 'sa1', createdAt: now })
    await setDoc(doc(s, 'users/sa1'), superAdmin('one', null))
    await setDoc(doc(s, 'users/sa2'), superAdmin('two', 'sa1'))
    await setDoc(doc(s, 'users/sa3'), superAdmin('three', 'sa1'))
    const admins = [...MINE.map((id) => [id, 'sa2']), ['other', 'sa3'], ['ownerAdmin', 'sa1']]
    for (const [index, [id, superAdminId]] of admins.entries()) {
      await setDoc(doc(s, `users/${id}`), { role: 'admin', fullName: id, email: `${id}@x.com`, inviteCode: id.toUpperCase(), superAdminId, createdAt: now })
      await setDoc(doc(s, `shops/shop-${id}`), { adminId: id, shopName: id, fullName: id, balance: 0 })
      await setDoc(doc(s, `activityLogs/act-${id}`), { adminId: id, title: id, at: day(index) })
      await setDoc(doc(s, `adminLoginHistory/login-${id}`), { adminId: id, at: day(index), via: 'Admin console' })
    }
    for (const [index, id] of ['sa1', 'sa2', 'sa3'].entries()) {
      await setDoc(doc(s, `superAdminLogs/log-${id}`), { superAdminId: id, actorId: id, actorName: id, type: 't', title: id, entity: 'e', icon: 'key', at: day(index) })
    }
  })
})

// Resolves with the first merged list, then stops listening.
const firstList = (name, ids, options) =>
  new Promise((resolve, reject) => {
    let stop // may not be assigned yet if the answer arrives synchronously (no admins)
    stop = watchForAdmins(
      db('sa2'),
      name,
      ids,
      options,
      (rows) => {
        stop?.()
        resolve(rows)
      },
      (error) => {
        stop?.()
        reject(error)
      }
    )
  })

describe('the console\'s branch queries', () => {
  it('reads every admin of a super admin who has more admins than fit in one query', async () => {
    assert.ok(MINE.length > ADMINS_PER_QUERY * 2)
    const shops = await firstList('shops', MINE)
    assert.deepEqual(shops.map((s) => s.adminId).sort(), [...MINE].sort())
  })

  it('merges the newest rows across the groups', async () => {
    const rows = await firstList('activityLogs', MINE, { newest: { field: 'at', count: 5 } })
    // The MINE admins hold days 1..15, so the newest five are the last five of them, newest first.
    assert.deepEqual(rows.map((r) => r.adminId), MINE.slice(-5).reverse())
  })

  it('reads the sign-in history the same way', async () => {
    const rows = await firstList('adminLoginHistory', MINE, { newest: { field: 'at', count: 500 } })
    assert.equal(rows.length, MINE.length)
  })

  it('answers straight away when there are no admins yet', async () => {
    assert.deepEqual(await firstList('shops', []), [])
  })

  it('never returns another branch\'s data: naming somebody else\'s admin is refused outright', async () => {
    await assert.rejects(firstList('shops', [...MINE.slice(0, 2), 'other']), { code: 'permission-denied' })
    await assert.rejects(firstList('shops', ['ownerAdmin']), { code: 'permission-denied' })
    await assert.rejects(firstList('activityLogs', ['other'], { newest: { field: 'at', count: 5 } }), { code: 'permission-denied' })
  })

  it('finds a super admin\'s own admins with the query the console runs for accounts', async () => {
    const users = collection(db('sa2'), 'users')
    const mine = await getDocs(query(users, where('role', '==', 'admin'), where('superAdminId', '==', 'sa2')))
    assert.deepEqual(mine.docs.map((d) => d.id).sort(), [...MINE].sort())
  })

  it('leaves the owner free to read everything in one go', async () => {
    const shops = await getDocs(collection(db('sa1'), 'shops'))
    assert.equal(shops.size, MINE.length + 2)
  })

  // The owner's console runs unfiltered queries; each must return every super admin's branch.
  it('shows the owner every super admin, every admin and all of their activity', async () => {
    const owner = db('sa1')
    const everyone = await getDocs(query(collection(owner, 'users'), where('role', 'in', ['admin', 'superadmin'])))
    assert.deepEqual(
      everyone.docs.map((d) => d.id).sort(),
      [...MINE, 'other', 'ownerAdmin', 'sa1', 'sa2', 'sa3'].sort()
    )
    const activity = await getDocs(query(collection(owner, 'activityLogs'), orderBy('at', 'desc'), limit(200)))
    assert.equal(activity.size, MINE.length + 2)
    const signIns = await getDocs(query(collection(owner, 'adminLoginHistory'), orderBy('at', 'desc'), limit(500)))
    assert.equal(signIns.size, MINE.length + 2)
    const audit = await getDocs(query(collection(owner, 'superAdminLogs'), orderBy('at', 'desc'), limit(200)))
    assert.deepEqual(audit.docs.map((d) => d.id).sort(), ['log-sa1', 'log-sa2', 'log-sa3'])
  })

  it('shows a scoped super admin only their own activity, in the same setup', async () => {
    const mine = await getDocs(query(collection(db('sa2'), 'superAdminLogs'), where('superAdminId', '==', 'sa2')))
    assert.deepEqual(mine.docs.map((d) => d.id), ['log-sa2'])
    await assert.rejects(getDocs(query(collection(db('sa2'), 'superAdminLogs'), where('superAdminId', '==', 'sa3'))), { code: 'permission-denied' })
    await assert.rejects(getDocs(query(collection(db('sa2'), 'superAdminLogs'), where('superAdminId', '==', 'sa1'))), { code: 'permission-denied' })
  })
})

// The activity log of a super admin who is not the owner: everything their console records as they work,
// readable by them alone. (`pushSuperLog` swallows failures so a log line never breaks an action — which
// is exactly why the rules accepting every entry has to be checked here.)
describe('a super admin\'s own activity log', () => {
  // Each action a non-owner can take, exactly as the console's `pushLog` records it (AuthContext.jsx).
  const ACTIONS = [
    { type: 'super_admin_login', title: 'Signed in', entity: 'Sid Second', icon: 'signin' },
    { type: 'invite_change', title: 'Invite code updated', entity: 'NEWCODE1', icon: 'key' },
    { type: 'password_change', title: 'Your password was changed', entity: 'Sid Second', icon: 'key' },
    { type: 'admin_added', title: 'Admin added', entity: 'Ada New', icon: 'signup' },
    { type: 'admin_removed', title: 'Admin removed', entity: 'Ada New', icon: 'trash' },
    { type: 'admin_restored', title: 'Admin restored', entity: 'Ada New', icon: 'shield' },
    { type: 'admin_password_reset', title: 'Password reset email sent to admin', entity: 'Ada New', icon: 'key' },
    { type: 'admin_impersonate', title: 'Signed in as admin', entity: 'Ada New', icon: 'signin' },
  ]
  const record = (uid, name, entry) => consoleData.pushSuperLog(db(uid), { superAdminId: uid, actorId: uid, actorName: name, ...entry })
  // The query the console runs for a super admin's own log.
  const ownLog = (uid) => getDocs(query(collection(db(uid), 'superAdminLogs'), where('superAdminId', '==', uid), orderBy('at', 'desc'), limit(200)))

  it('records everything a super admin does, and shows it back to them', async () => {
    for (const action of ACTIONS) await record('sa2', 'Sid Second', action)
    const shown = await ownLog('sa2')
    // Every action landed (the extra 't' is the entry seeded for sa2).
    assert.deepEqual(shown.docs.map((d) => d.data().type).sort(), [...ACTIONS.map((a) => a.type), 't'].sort())
    for (const row of shown.docs) {
      assert.equal(row.data().actorId, 'sa2')
      assert.equal(row.data().superAdminId, 'sa2')
    }
  })

  it('keeps each super admin\'s log to themself, the owner\'s included', async () => {
    await record('sa2', 'Sid Second', ACTIONS[3])
    await record('sa3', 'Thea Third', ACTIONS[3])
    await record('sa1', 'Sam Owner', ACTIONS[3])
    for (const uid of ['sa1', 'sa2', 'sa3']) {
      const shown = await ownLog(uid)
      assert.equal(shown.size, 2) // the one seeded for them + the one just recorded
      assert.ok(shown.docs.every((d) => d.data().superAdminId === uid))
    }
    // Nobody can ask for somebody else's, and the owner (who reads it all) sees all three.
    await assert.rejects(getDocs(query(collection(db('sa2'), 'superAdminLogs'), where('superAdminId', '==', 'sa3'))), { code: 'permission-denied' })
    const all = await getDocs(query(collection(db('sa1'), 'superAdminLogs'), orderBy('at', 'desc'), limit(200)))
    assert.equal(all.size, 6)
  })

  // The console adds an admin in one batch (profile + invite code), as `provisionAccount` does.
  const addAdmin = async () => {
    const s = db('sa2')
    const batch = writeBatch(s)
    batch.set(doc(s, 'users/newadmin'), { role: 'admin', fullName: 'Ada New', email: 'newadmin@x.com', inviteCode: 'ADANEW01', superAdminId: 'sa2', createdAt: now, removed: false })
    batch.set(doc(s, 'inviteCodes/ADANEW01'), { ownerUid: 'newadmin', ownerRole: 'admin', ownerName: 'Ada New', disabled: false, createdAt: now })
    await batch.commit()
    await record('sa2', 'Sid Second', ACTIONS[3])
  }

  it('logs adding an admin, and an admin registering with the super admin\'s invite code', async () => {
    await addAdmin()
    // An admin registers with sa2's code: the admin console leaves sa2 a note in sa2's log.
    await consoleData.pushSuperLog(db('m00'), {
      superAdminId: 'sa2', actorId: 'm00', actorName: 'm00', type: 'admin_registered', title: 'Admin registered with your invite code', entity: 'm00', icon: 'signup',
    })
    const mine = await ownLog('sa2')
    // …next to the entry seeded for sa2 (type 't').
    assert.deepEqual(mine.docs.map((d) => d.data().type).sort(), ['admin_added', 'admin_registered', 't'])
    // Neither is visible to any other super admin.
    assert.deepEqual((await ownLog('sa3')).docs.map((d) => d.data().type), ['t'])
    await assert.rejects(getDocs(query(collection(db('sa3'), 'superAdminLogs'), where('superAdminId', '==', 'sa2'))), { code: 'permission-denied' })
  })

  it('brings a freshly added admin\'s own activity into the feed straight away', async () => {
    await addAdmin()
    await setDoc(doc(db('newadmin'), 'activityLogs/newadmin-1'), {
      adminId: 'newadmin', actorId: 'newadmin', type: 'order_created', title: 'Gave an order', entity: 'x', icon: 'package', at: '2026-04-01',
    })
    const feed = await firstList('activityLogs', [...MINE, 'newadmin'], { newest: { field: 'at', count: 200 } })
    assert.equal(feed[0].id, 'newadmin-1') // the newest entry of the whole branch
    assert.equal(feed.length, MINE.length + 1)
    // Another super admin cannot read that admin's activity.
    await assert.rejects(getDocs(query(collection(db('sa3'), 'activityLogs'), where('adminId', '==', 'newadmin'))), { code: 'permission-denied' })
  })
})

describe('the log views without their composite index', () => {
  it('switches to the plain query when Firestore says the index is missing', async () => {
    const started = []
    const stopped = []
    let failFirst
    const stop = watchWithIndexFallback((indexed, onError) => {
      started.push(indexed)
      if (indexed) failFirst = () => onError({ code: 'failed-precondition', message: 'The query requires an index' }, 'superAdminLogs')
      return () => stopped.push(indexed)
    })
    assert.deepEqual(started, [true])
    failFirst()
    assert.deepEqual(started, [true, false]) // the plain one takes over…
    assert.deepEqual(stopped, [true]) // …and the failed one is let go
    stop()
    assert.deepEqual(stopped, [true, false])
  })

  it('passes every other error on instead of masking it', () => {
    const seen = []
    let fail
    watchWithIndexFallback(
      (indexed, onError) => {
        fail = onError
        return () => {}
      },
      (error) => seen.push(error.code)
    )
    fail({ code: 'permission-denied' }, 'superAdminLogs')
    assert.deepEqual(seen, ['permission-denied'])
  })

  it('sorts newest first and cuts the list', () => {
    const rows = [{ at: '2026-01-02' }, { at: '2026-01-04' }, { at: '2026-01-03' }, { at: '2026-01-01' }]
    assert.deepEqual(newestFirst(rows, 'at', 3).map((r) => r.at), ['2026-01-04', '2026-01-03', '2026-01-02'])
  })
})
