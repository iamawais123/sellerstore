// Security-rules tests for firestore.rules. Run with `npm run test:rules` (needs Java for the
// Firestore emulator). The interesting cases are the privilege-escalation ones: can a visitor make
// themselves an admin, a super admin, or a seller of an admin they were never invited by?
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, beforeEach, describe, it } from 'node:test'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':')
let env

const now = '2026-09-19T00:00:00.000Z'
const SUPER = { role: 'superadmin', fullName: 'Sam Super', email: 'sam@x.com', inviteCode: 'SUPERONE', createdAt: now }
const ADMIN = { role: 'admin', fullName: 'Ada Admin', email: 'ada@x.com', inviteCode: 'ADMINONE', superAdminId: 'sa1', registeredWithCode: 'SUPERONE', createdAt: now, removed: false }
const inviteDoc = (uid, role, fullName, extra = {}) => ({ ownerUid: uid, ownerRole: role, ownerName: fullName, disabled: false, createdAt: now, ...extra })

const db = (uid, email) => (uid ? env.authenticatedContext(uid, { email: email || `${uid}@x.com` }).firestore() : env.unauthenticatedContext().firestore())

async function seed() {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.firestore()
    await setDoc(doc(s, 'users/sa1'), SUPER)
    await setDoc(doc(s, 'inviteCodes/SUPERONE'), inviteDoc('sa1', 'superadmin', SUPER.fullName))
    await setDoc(doc(s, 'meta/bootstrap'), { superAdminUid: 'sa1', createdAt: now })
    await setDoc(doc(s, 'users/a1'), ADMIN)
    await setDoc(doc(s, 'inviteCodes/ADMINONE'), inviteDoc('a1', 'admin', ADMIN.fullName))
    await setDoc(doc(s, 'users/s1'), { role: 'seller', fullName: 'Sue Seller', email: 's1@x.com', shopName: 'Sue Shop', adminId: 'a1', inviteCode: 'ADMINONE', createdAt: now })
    await setDoc(doc(s, 'users/c1'), { role: 'customer', fullName: 'Cy Customer', email: 'c1@x.com', createdAt: now })
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

describe('bootstrap: the first super admin', () => {
  const register = (s, uid) => {
    const batch = writeBatch(s)
    batch.set(doc(s, `users/${uid}`), { role: 'superadmin', fullName: 'New Super', email: `${uid}@x.com`, inviteCode: 'NEWSUPER', createdAt: now })
    batch.set(doc(s, 'inviteCodes/NEWSUPER'), inviteDoc(uid, 'superadmin', 'New Super'))
    batch.set(doc(s, 'meta/bootstrap'), { superAdminUid: uid, createdAt: now })
    return batch.commit()
  }

  it('is open while no super admin exists', async () => {
    await env.clearFirestore()
    await assertSucceeds(register(db('first'), 'first'))
  })

  it('is closed once meta/bootstrap exists', async () => {
    await assertFails(register(db('late'), 'late'))
  })

  it('cannot be claimed without also writing meta/bootstrap', async () => {
    await env.clearFirestore()
    const s = db('sneaky')
    await assertFails(setDoc(doc(s, 'users/sneaky'), { role: 'superadmin', fullName: 'S', email: 'sneaky@x.com', inviteCode: 'SNEAKY99' }))
  })

  it('anyone can read the bootstrap flag, but nobody can rewrite it', async () => {
    await assertSucceeds(getDoc(doc(db(), 'meta/bootstrap')))
    await assertFails(setDoc(doc(db('sa1'), 'meta/bootstrap'), { superAdminUid: 'sa1', createdAt: now }))
    await assertFails(deleteDoc(doc(db('sa1'), 'meta/bootstrap')))
  })
})

describe('invite codes', () => {
  it('can be fetched by exact code, even signed out', async () => {
    await assertSucceeds(getDoc(doc(db(), 'inviteCodes/ADMINONE')))
  })
  it('cannot be listed', async () => {
    await assertFails(getDocs(collection(db(), 'inviteCodes')))
    await assertFails(getDocs(collection(db('a1'), 'inviteCodes')))
  })
  it('lets an admin swap their code atomically', async () => {
    const s = db('a1')
    const batch = writeBatch(s)
    batch.delete(doc(s, 'inviteCodes/ADMINONE'))
    batch.set(doc(s, 'inviteCodes/MYNEWCODE'), inviteDoc('a1', 'admin', ADMIN.fullName))
    batch.update(doc(s, 'users/a1'), { inviteCode: 'MYNEWCODE' })
    await assertSucceeds(batch.commit())
  })
  it("refuses a code that the owner's profile does not point at", async () => {
    const s = db('a1')
    await assertFails(setDoc(doc(s, 'inviteCodes/ORPHAN99'), inviteDoc('a1', 'admin', ADMIN.fullName)))
  })
  it('refuses a code created in somebody else\'s name', async () => {
    const s = db('c1')
    const batch = writeBatch(s)
    batch.set(doc(s, 'inviteCodes/FORGED99'), inviteDoc('a1', 'admin', ADMIN.fullName))
    await assertFails(batch.commit())
  })
  it('does not let a removed admin mint a fresh working code', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => updateDoc(doc(ctx.firestore(), 'users/a1'), { removed: true }))
    const s = db('a1')
    const batch = writeBatch(s)
    batch.set(doc(s, 'inviteCodes/COMEBACK'), inviteDoc('a1', 'admin', ADMIN.fullName))
    batch.update(doc(s, 'users/a1'), { inviteCode: 'COMEBACK' })
    await assertFails(batch.commit())
  })
  it('lets a super admin disable and re-enable a code, but nobody else', async () => {
    await assertSucceeds(updateDoc(doc(db('sa1'), 'inviteCodes/ADMINONE'), { disabled: true }))
    await assertFails(updateDoc(doc(db('a1'), 'inviteCodes/ADMINONE'), { disabled: true }))
  })
})

describe('customer accounts', () => {
  it('can register and read their own profile', async () => {
    const s = db('newcust')
    await assertSucceeds(setDoc(doc(s, 'users/newcust'), { role: 'customer', fullName: 'N', email: 'newcust@x.com', createdAt: now }))
    await assertSucceeds(getDoc(doc(s, 'users/newcust')))
  })
  it('cannot register with a mismatched email', async () => {
    await assertFails(setDoc(doc(db('newcust'), 'users/newcust'), { role: 'customer', fullName: 'N', email: 'someone-else@x.com' }))
  })
  it('cannot register with extra privileged fields', async () => {
    await assertFails(setDoc(doc(db('newcust'), 'users/newcust'), { role: 'customer', fullName: 'N', email: 'newcust@x.com', removed: false, adminId: 'a1' }))
  })
  it('cannot register for somebody else', async () => {
    await assertFails(setDoc(doc(db('newcust'), 'users/other'), { role: 'customer', fullName: 'N', email: 'newcust@x.com' }))
  })
  it("cannot read other people's profiles", async () => {
    await assertFails(getDoc(doc(db('c1'), 'users/a1')))
    await assertFails(getDocs(collection(db('c1'), 'users')))
  })
  it('cannot promote themselves', async () => {
    await assertFails(updateDoc(doc(db('c1'), 'users/c1'), { role: 'superadmin' }))
    await assertFails(updateDoc(doc(db('c1'), 'users/c1'), { role: 'admin' }))
  })
  it('cannot register as an admin or a super admin', async () => {
    await assertFails(setDoc(doc(db('c2'), 'users/c2'), { role: 'admin', fullName: 'N', email: 'c2@x.com', inviteCode: 'HACKED99', superAdminId: 'sa1', registeredWithCode: 'WRONG' }))
    await assertFails(setDoc(doc(db('c2'), 'users/c2'), { role: 'superadmin', fullName: 'N', email: 'c2@x.com', inviteCode: 'HACKED99' }))
  })
})

describe('seller sign-up', () => {
  const seller = (over = {}) => ({ role: 'seller', fullName: 'New Seller', email: 'ns@x.com', shopName: 'Shop', adminId: 'a1', inviteCode: 'ADMINONE', createdAt: now, ...over })
  it('works with a live invite code of the claimed admin', async () => {
    await assertSucceeds(setDoc(doc(db('ns'), 'users/ns'), seller()))
  })
  it('is refused for an unknown code', async () => {
    await assertFails(setDoc(doc(db('ns'), 'users/ns'), seller({ inviteCode: 'NOPE1234' })))
  })
  it('is refused when the code belongs to a different admin', async () => {
    await assertFails(setDoc(doc(db('ns'), 'users/ns'), seller({ adminId: 'someone-else' })))
  })
  it('is refused with a super admin code (only admin codes recruit sellers)', async () => {
    await assertFails(setDoc(doc(db('ns'), 'users/ns'), seller({ adminId: 'sa1', inviteCode: 'SUPERONE' })))
  })
  it('is refused once the admin has been removed (code disabled)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => updateDoc(doc(ctx.firestore(), 'inviteCodes/ADMINONE'), { disabled: true }))
    await assertFails(setDoc(doc(db('ns'), 'users/ns'), seller()))
  })
})

describe('admin sign-up', () => {
  const admin = (over = {}) => ({ role: 'admin', fullName: 'New Admin', email: 'na@x.com', inviteCode: 'NEWADMIN', superAdminId: 'sa1', registeredWithCode: 'SUPERONE', createdAt: now, removed: false, ...over })
  const register = (uid, profile) => {
    const s = db(uid)
    const batch = writeBatch(s)
    batch.set(doc(s, `users/${uid}`), profile)
    batch.set(doc(s, `inviteCodes/${profile.inviteCode}`), inviteDoc(uid, 'admin', profile.fullName))
    return batch.commit()
  }
  it('works with a live super admin invite code', async () => {
    await assertSucceeds(register('na', admin()))
  })
  it('is refused with an unknown code', async () => {
    await assertFails(register('na', admin({ registeredWithCode: 'NOPE1234' })))
  })
  it('is refused with an admin code (only super admin codes recruit admins)', async () => {
    await assertFails(register('na', admin({ superAdminId: 'a1', registeredWithCode: 'ADMINONE' })))
  })
  it('is refused when claiming a different super admin than the code belongs to', async () => {
    await assertFails(register('na', admin({ superAdminId: 'sa2' })))
  })
  it('is refused with a disabled code', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => updateDoc(doc(ctx.firestore(), 'inviteCodes/SUPERONE'), { disabled: true }))
    await assertFails(register('na', admin()))
  })
  it('cannot be created with fields the form does not write', async () => {
    await assertFails(register('na', admin({ isOwner: true })))
  })
})

describe('accounts provisioned by a super admin', () => {
  const provision = (uid, role, code) => {
    const s = db('sa1')
    const batch = writeBatch(s)
    // Admins belong to a super admin; a further super admin records who created them.
    const owner = role === 'admin' ? { superAdminId: 'sa1' } : { createdBy: 'sa1' }
    batch.set(doc(s, `users/${uid}`), { role, fullName: 'Provisioned', email: `${uid}@x.com`, inviteCode: code, ...owner, createdAt: now, removed: false })
    batch.set(doc(s, `inviteCodes/${code}`), inviteDoc(uid, role, 'Provisioned'))
    return batch.commit()
  }
  it('lets a super admin create admins and further super admins', async () => {
    await assertSucceeds(provision('pa', 'admin', 'PROVADM1'))
    await assertSucceeds(provision('ps', 'superadmin', 'PROVSUP1'))
  })
  it('does not let an admin create other admins', async () => {
    const s = db('a1')
    await assertFails(setDoc(doc(s, 'users/x'), { role: 'admin', fullName: 'X', email: 'x@x.com', inviteCode: 'XCODE123', superAdminId: 'sa1', removed: false }))
  })
  it('does not let a removed super admin create accounts', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => updateDoc(doc(ctx.firestore(), 'users/sa1'), { removed: true }))
    await assertFails(provision('pa2', 'admin', 'PROVADM2'))
  })
})

// sa1 is the owner: the first super admin ever registered (meta/bootstrap points at them). Everyone
// else — even another super admin — is beneath them.
describe('the owner and the other super admins', () => {
  const SUPER_TWO = { role: 'superadmin', fullName: 'Sid Second', email: 'sa2@x.com', inviteCode: 'SUPERTWO', createdBy: 'sa1', createdAt: now, removed: false }
  const SUPER_THREE = { role: 'superadmin', fullName: 'Thea Third', email: 'sa3@x.com', inviteCode: 'SUPERTHR', createdBy: 'sa1', createdAt: now, removed: false }

  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const s = ctx.firestore()
      await setDoc(doc(s, 'users/sa2'), SUPER_TWO)
      await setDoc(doc(s, 'inviteCodes/SUPERTWO'), inviteDoc('sa2', 'superadmin', SUPER_TWO.fullName))
      await setDoc(doc(s, 'users/sa3'), SUPER_THREE)
      await setDoc(doc(s, 'inviteCodes/SUPERTHR'), inviteDoc('sa3', 'superadmin', SUPER_THREE.fullName))
      // sa2's own admin (the owner's is a1).
      await setDoc(doc(s, 'users/a2'), { ...ADMIN, fullName: 'Bea Admin', email: 'a2@x.com', inviteCode: 'ADMINTWO', superAdminId: 'sa2', registeredWithCode: 'SUPERTWO' })
      await setDoc(doc(s, 'inviteCodes/ADMINTWO'), inviteDoc('a2', 'admin', 'Bea Admin'))
    })
  })

  // What the console writes to remove / restore an account: the profile flags and its invite code.
  const setRemoved = (actor, uid, code, removed) => {
    const s = db(actor)
    const batch = writeBatch(s)
    batch.update(doc(s, `users/${uid}`), removed ? { removed: true, removedAt: now, removedBy: actor } : { removed: false, removedAt: null, removedBy: null })
    batch.update(doc(s, `inviteCodes/${code}`), { disabled: removed })
    return batch.commit()
  }
  const provisionSuper = (actor, uid, code, createdBy = actor) => {
    const s = db(actor)
    const batch = writeBatch(s)
    batch.set(doc(s, `users/${uid}`), { role: 'superadmin', fullName: 'Fresh', email: `${uid}@x.com`, inviteCode: code, createdBy, createdAt: now, removed: false })
    batch.set(doc(s, `inviteCodes/${code}`), inviteDoc(uid, 'superadmin', 'Fresh'))
    return batch.commit()
  }
  const superLog = (actor, actorId) =>
    setDoc(doc(db(actor), `superAdminLogs/log-${actor}-as-${actorId}`), { superAdminId: actor, actorId, actorName: 'x', type: 'invite_change', title: 't', entity: 'e', icon: 'key', at: now })

  describe('the owner', () => {
    it('adds further super admins, recorded as their creator', async () => {
      await assertSucceeds(provisionSuper('sa1', 'fresh1', 'FRESHONE'))
    })
    it('cannot add a super admin under somebody else\'s name', async () => {
      await assertFails(provisionSuper('sa1', 'fresh2', 'FRESHTWO', 'sa2'))
    })
    it('removes a super admin, and restores them again', async () => {
      await assertSucceeds(setRemoved('sa1', 'sa2', 'SUPERTWO', true))
      await assertSucceeds(setRemoved('sa1', 'sa2', 'SUPERTWO', false))
    })
    it('hands a removed super admin\'s admins over in the same batch', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => updateDoc(doc(ctx.firestore(), 'users/a1'), { superAdminId: 'sa2' }))
      const s = db('sa1')
      const batch = writeBatch(s)
      batch.update(doc(s, 'users/sa2'), { removed: true, removedAt: now, removedBy: 'sa1' })
      batch.update(doc(s, 'inviteCodes/SUPERTWO'), { disabled: true })
      batch.update(doc(s, 'users/a1'), { superAdminId: 'sa1' })
      await assertSucceeds(batch.commit())
    })
    it('cannot remove themself', async () => {
      await assertFails(setRemoved('sa1', 'sa1', 'SUPERONE', true))
    })
    it('cannot edit another super admin beyond removing / restoring them', async () => {
      await assertFails(updateDoc(doc(db('sa1'), 'users/sa2'), { fullName: 'Renamed' }))
      await assertFails(updateDoc(doc(db('sa1'), 'users/sa2'), { role: 'admin' }))
      await assertFails(updateDoc(doc(db('sa1'), 'users/sa2'), { createdBy: 'sa3' }))
    })
    it('still keeps their own profile editable', async () => {
      await assertSucceeds(updateDoc(doc(db('sa1'), 'users/sa1'), { fullName: 'Sam Renamed', lastLoginAt: now }))
    })
  })

  describe('any other super admin', () => {
    it('cannot remove the owner', async () => {
      await assertFails(setRemoved('sa2', 'sa1', 'SUPERONE', true))
      await assertFails(updateDoc(doc(db('sa2'), 'users/sa1'), { removed: true, removedAt: now, removedBy: 'sa2' }))
    })
    it('cannot switch off the owner\'s invite code, or delete it', async () => {
      await assertFails(updateDoc(doc(db('sa2'), 'inviteCodes/SUPERONE'), { disabled: true }))
      await assertFails(deleteDoc(doc(db('sa2'), 'inviteCodes/SUPERONE')))
    })
    it('cannot change anything else about the owner\'s account', async () => {
      await assertFails(updateDoc(doc(db('sa2'), 'users/sa1'), { fullName: 'Hijacked' }))
      await assertFails(updateDoc(doc(db('sa2'), 'users/sa1'), { inviteCode: 'HIJACK99' }))
      await assertFails(updateDoc(doc(db('sa2'), 'users/sa1'), { lastLoginAt: now }))
      await assertFails(updateDoc(doc(db('sa2'), 'users/sa1'), { role: 'admin' }))
    })
    it('cannot remove or restore their fellow super admins either', async () => {
      await assertFails(setRemoved('sa2', 'sa3', 'SUPERTHR', true))
      await env.withSecurityRulesDisabled(async (ctx) => updateDoc(doc(ctx.firestore(), 'users/sa3'), { removed: true }))
      await assertFails(setRemoved('sa2', 'sa3', 'SUPERTHR', false))
    })
    it('cannot switch off a fellow super admin\'s invite code', async () => {
      await assertFails(updateDoc(doc(db('sa2'), 'inviteCodes/SUPERTHR'), { disabled: true }))
      await assertFails(deleteDoc(doc(db('sa2'), 'inviteCodes/SUPERTHR')))
    })
    it('cannot add super admins', async () => {
      await assertFails(provisionSuper('sa2', 'fresh3', 'FRESHTHR'))
    })
    it('cannot crown someone as a super admin by claiming the owner created them', async () => {
      await assertFails(provisionSuper('sa2', 'fresh4', 'FRESHFOU', 'sa1'))
    })
    it('cannot restore themself after being removed', async () => {
      await assertSucceeds(setRemoved('sa1', 'sa2', 'SUPERTWO', true))
      await assertFails(updateDoc(doc(db('sa2'), 'users/sa2'), { removed: false }))
      await assertFails(updateDoc(doc(db('sa2'), 'users/sa2'), { removed: false, removedAt: null, removedBy: null }))
      await assertFails(updateDoc(doc(db('sa2'), 'inviteCodes/SUPERTWO'), { disabled: false }))
    })
    it('cannot rewrite who the owner is', async () => {
      await assertFails(setDoc(doc(db('sa2'), 'meta/bootstrap'), { superAdminUid: 'sa2', createdAt: now }))
      await assertFails(updateDoc(doc(db('sa2'), 'meta/bootstrap'), { superAdminUid: 'sa2' }))
    })
    it('still works as a super admin: manages their own admins and codes, edits their own profile', async () => {
      await assertSucceeds(setRemoved('sa2', 'a2', 'ADMINTWO', true))
      await assertSucceeds(setRemoved('sa2', 'a2', 'ADMINTWO', false))
      await assertSucceeds(updateDoc(doc(db('sa2'), 'users/sa2'), { fullName: 'Sid Renamed', lastLoginAt: now }))
    })
  })

  // Every super admin works inside their own branch: their admins, those admins' sellers and shop data,
  // and their own activity. The branches of the owner and of the other super admins are out of sight —
  // profiles, admins, sellers, money, logs. Only the owner sees across all of them.
  describe('a super admin\'s own branch', () => {
    const ids = (snap) => snap.docs.map((d) => d.id).sort()
    const logRow = (superAdminId, actorId, at) => ({ superAdminId, actorId, actorName: actorId, type: 't', title: 't', entity: 'e', icon: 'key', at })
    const shopRow = (id, adminId) => ({ fullName: id, shopName: id, email: `${id}@x.com`, adminId, balance: 10, guarantee: 0, rating: 5, productLimit: 50, verified: true, status: 'Active' })
    const orderRow = (sellerId, adminId) => ({ sellerId, adminId, status: 'Paid', items: [{ name: 'x' }], total: 10, cost: 5, profit: 2 })
    const col = (uid, name) => collection(db(uid), name)

    beforeEach(async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        const s = ctx.firestore()
        // sa1 (owner) → a1 → s1;  sa2 → a2 → s2.  sa3 has no admins.
        await setDoc(doc(s, 'users/s2'), { role: 'seller', fullName: 'Sam Seller', email: 's2@x.com', shopName: 'Sam Shop', adminId: 'a2', inviteCode: 'ADMINTWO', createdAt: now })
        for (const [id, admin] of [['s1', 'a1'], ['s2', 'a2']]) {
          await setDoc(doc(s, `shops/${id}`), shopRow(id, admin))
          await setDoc(doc(s, `orders/o-${id}`), orderRow(id, admin))
          await setDoc(doc(s, `withdrawals/w-${id}`), { sellerId: id, adminId: admin, amount: 1, status: 'Pending' })
          await setDoc(doc(s, `activityLogs/act-${id}`), { adminId: admin, sellerId: id, actorId: id, type: 't', title: 't', at: '2026-01-01' })
          await setDoc(doc(s, `adminLoginHistory/login-${admin}`), { adminId: admin, at: '2026-01-01', via: 'Admin console', ip: '', location: '', device: 'x', deviceId: 'd' })
          await setDoc(doc(s, `adminDevices/${admin}`), { adminId: admin, labels: {} })
        }
        await setDoc(doc(s, 'superAdminLogs/own1'), logRow('sa1', 'sa1', '2026-01-01'))
        await setDoc(doc(s, 'superAdminLogs/own2'), logRow('sa1', 'sa1', '2026-01-04'))
        // An admin registered with the owner's code: a note about the owner's branch, filed under the owner.
        await setDoc(doc(s, 'superAdminLogs/note'), logRow('sa1', 'a1', '2026-01-05'))
        await setDoc(doc(s, 'superAdminLogs/two1'), logRow('sa2', 'sa2', '2026-01-02'))
        await setDoc(doc(s, 'superAdminLogs/thr1'), logRow('sa3', 'sa3', '2026-01-03'))
      })
    })

    describe('accounts', () => {
      it('shows a super admin their own profile, their admins and those admins\' sellers', async () => {
        const s = db('sa2')
        await assertSucceeds(getDoc(doc(s, 'users/sa2')))
        await assertSucceeds(getDoc(doc(s, 'users/a2')))
        await assertSucceeds(getDoc(doc(s, 'users/s2')))
        assert.deepEqual(ids(await assertSucceeds(getDocs(query(col('sa2', 'users'), where('role', '==', 'admin'), where('superAdminId', '==', 'sa2'))))), ['a2'])
        assert.deepEqual(ids(await assertSucceeds(getDocs(query(col('sa2', 'users'), where('role', '==', 'seller'), where('adminId', '==', 'a2'))))), ['s2'])
      })
      it('hides the owner, every other super admin, and everybody in their branches', async () => {
        const s = db('sa2')
        for (const uid of ['sa1', 'sa3', 'a1', 's1', 'c1']) await assertFails(getDoc(doc(s, `users/${uid}`)))
      })
      it('refuses any list that could reach outside the branch', async () => {
        const users = col('sa2', 'users')
        await assertFails(getDocs(users))
        await assertFails(getDocs(query(users, where('role', 'in', ['admin', 'superadmin']))))
        await assertFails(getDocs(query(users, where('role', '==', 'admin'))))
        await assertFails(getDocs(query(users, where('role', '==', 'superadmin'))))
        await assertFails(getDocs(query(users, where('role', '==', 'admin'), where('superAdminId', '==', 'sa1'))))
        await assertFails(getDocs(query(users, where('role', '==', 'seller'))))
        await assertFails(getDocs(query(users, where('role', '==', 'seller'), where('adminId', '==', 'a1'))))
      })
      it('shows the owner everything', async () => {
        const s = db('sa1')
        for (const uid of ['sa2', 'sa3', 'a2', 's2', 'a1']) await assertSucceeds(getDoc(doc(s, `users/${uid}`)))
        assert.deepEqual(ids(await assertSucceeds(getDocs(query(col('sa1', 'users'), where('role', 'in', ['admin', 'superadmin']))))), ['a1', 'a2', 'sa1', 'sa2', 'sa3'])
      })
      it('lets a super admin manage only their own admins', async () => {
        await assertSucceeds(updateDoc(doc(db('sa2'), 'users/a2'), { fullName: 'Renamed' }))
        await assertFails(updateDoc(doc(db('sa2'), 'users/a1'), { fullName: 'Renamed' }))
        await assertFails(setRemoved('sa2', 'a1', 'ADMINONE', true))
        await assertFails(updateDoc(doc(db('sa2'), 'inviteCodes/ADMINONE'), { disabled: true }))
        await assertFails(deleteDoc(doc(db('sa2'), 'inviteCodes/ADMINONE')))
      })
      it('does not let a super admin take an admin from another, or give theirs away', async () => {
        await assertFails(updateDoc(doc(db('sa2'), 'users/a1'), { superAdminId: 'sa2' }))
        await assertFails(updateDoc(doc(db('sa2'), 'users/a2'), { superAdminId: 'sa1' }))
        await assertFails(updateDoc(doc(db('sa2'), 'users/a2'), { superAdminId: 'sa3' }))
      })
      it('lets the owner reassign any admin, as when a super admin is removed', async () => {
        await assertSucceeds(updateDoc(doc(db('sa1'), 'users/a2'), { superAdminId: 'sa1' }))
      })
      it('only creates admins under the super admin doing it', async () => {
        const make = (actor, uid, code, superAdminId) => {
          const s = db(actor)
          const batch = writeBatch(s)
          batch.set(doc(s, `users/${uid}`), { role: 'admin', fullName: 'New Admin', email: `${uid}@x.com`, inviteCode: code, superAdminId, createdAt: now, removed: false })
          batch.set(doc(s, `inviteCodes/${code}`), inviteDoc(uid, 'admin', 'New Admin'))
          return batch.commit()
        }
        await assertSucceeds(make('sa2', 'na1', 'NEWADM01', 'sa2'))
        await assertFails(make('sa2', 'na2', 'NEWADM02', 'sa1'))
        await assertFails(make('sa2', 'na3', 'NEWADM03', 'sa3'))
      })
      it('is told apart by having no creator, so the owner cannot be registered with one', async () => {
        await env.clearFirestore()
        const s = db('first')
        const batch = writeBatch(s)
        batch.set(doc(s, 'users/first'), { role: 'superadmin', fullName: 'F', email: 'first@x.com', inviteCode: 'FIRSTCODE', createdAt: now, createdBy: 'someone' })
        batch.set(doc(s, 'inviteCodes/FIRSTCODE'), inviteDoc('first', 'superadmin', 'F'))
        batch.set(doc(s, 'meta/bootstrap'), { superAdminUid: 'first', createdAt: now })
        await assertFails(batch.commit())
      })
    })

    describe('shop data', () => {
      for (const name of ['shops', 'orders', 'withdrawals']) {
        it(`shows ${name} of the super admin's own admins only`, async () => {
          const own = await assertSucceeds(getDocs(query(col('sa2', name), where('adminId', '==', 'a2'))))
          assert.equal(own.size, 1)
          await assertFails(getDocs(query(col('sa2', name), where('adminId', '==', 'a1'))))
          await assertFails(getDocs(query(col('sa2', name), where('adminId', 'in', ['a1', 'a2']))))
          await assertFails(getDocs(col('sa2', name)))
        })
        it(`shows the owner all ${name}`, async () => {
          assert.equal((await assertSucceeds(getDocs(col('sa1', name)))).size, 2)
        })
      }
      it('reads single documents of the branch, and refuses the rest', async () => {
        const s = db('sa2')
        for (const path of ['shops/s2', 'orders/o-s2', 'withdrawals/w-s2']) await assertSucceeds(getDoc(doc(s, path)))
        for (const path of ['shops/s1', 'orders/o-s1', 'withdrawals/w-s1', 'activityLogs/act-s1']) await assertFails(getDoc(doc(s, path)))
      })
      it('lets a super admin act on their own sellers\' shops and orders, not on anyone else\'s', async () => {
        await assertSucceeds(updateDoc(doc(db('sa2'), 'shops/s2'), { guarantee: 5 }))
        await assertFails(updateDoc(doc(db('sa2'), 'shops/s1'), { guarantee: 5 }))
        await assertSucceeds(updateDoc(doc(db('sa2'), 'orders/o-s2'), { status: 'Pickup', updatedAt: now }))
        await assertFails(updateDoc(doc(db('sa2'), 'orders/o-s1'), { status: 'Pickup', updatedAt: now }))
      })
      it('shows the network activity of the own admins only', async () => {
        const feed = (uid, adminId) => getDocs(query(col(uid, 'activityLogs'), where('adminId', '==', adminId), orderBy('at', 'desc'), limit(50)))
        assert.equal((await assertSucceeds(feed('sa2', 'a2'))).size, 1)
        await assertFails(feed('sa2', 'a1'))
        await assertFails(getDocs(query(col('sa2', 'activityLogs'), orderBy('at', 'desc'), limit(50))))
        assert.equal((await assertSucceeds(getDocs(query(col('sa1', 'activityLogs'), orderBy('at', 'desc'), limit(50))))).size, 2)
      })
    })

    describe('sign-in history', () => {
      it('shows the own admins\' sign-ins only, and lets a super admin sign in as them but not as anyone else\'s', async () => {
        const history = (uid, adminId) => getDocs(query(col(uid, 'adminLoginHistory'), where('adminId', '==', adminId), orderBy('at', 'desc'), limit(50)))
        assert.equal((await assertSucceeds(history('sa2', 'a2'))).size, 1)
        await assertFails(history('sa2', 'a1'))
        await assertFails(getDocs(col('sa2', 'adminLoginHistory')))
        await assertSucceeds(getDoc(doc(db('sa2'), 'adminDevices/a2')))
        await assertFails(getDoc(doc(db('sa2'), 'adminDevices/a1')))
        const entry = (adminId) => ({ adminId, at: now, via: 'Super admin: Sid', ip: '', location: '', device: 'x', deviceId: 'd' })
        await assertSucceeds(setDoc(doc(db('sa2'), 'adminLoginHistory/imp-own'), entry('a2')))
        await assertFails(setDoc(doc(db('sa2'), 'adminLoginHistory/imp-other'), entry('a1')))
        // The owner sees every admin's sign-ins: both seeded ones and the one just recorded for a2.
        assert.equal((await assertSucceeds(getDocs(col('sa1', 'adminLoginHistory')))).size, 3)
      })
    })

    describe('activity of the super admins', () => {
      const logsOf = (uid, superAdminId) =>
        getDocs(query(col(uid, 'superAdminLogs'), where('superAdminId', '==', superAdminId), orderBy('at', 'desc'), limit(50)))

      it('shows each super admin their own entries and nobody else\'s', async () => {
        assert.deepEqual((await assertSucceeds(logsOf('sa2', 'sa2'))).docs.map((d) => d.id), ['two1'])
        assert.deepEqual((await assertSucceeds(logsOf('sa3', 'sa3'))).docs.map((d) => d.id), ['thr1'])
        await assertFails(logsOf('sa2', 'sa1'))
        await assertFails(logsOf('sa2', 'sa3'))
        await assertFails(getDocs(query(col('sa2', 'superAdminLogs'), where('superAdminId', 'in', ['sa2', 'sa3']), orderBy('at', 'desc'))))
        await assertFails(getDocs(query(col('sa2', 'superAdminLogs'), orderBy('at', 'desc'), limit(50))))
        await assertFails(getDocs(col('sa2', 'superAdminLogs')))
      })
      it('keeps single entries private too, the owner\'s notes included', async () => {
        const s = db('sa2')
        await assertSucceeds(getDoc(doc(s, 'superAdminLogs/two1')))
        for (const id of ['own1', 'note', 'thr1']) await assertFails(getDoc(doc(s, `superAdminLogs/${id}`)))
      })
      it('shows the owner all of it', async () => {
        const snap = await assertSucceeds(getDocs(query(col('sa1', 'superAdminLogs'), orderBy('at', 'desc'), limit(50))))
        assert.deepEqual(snap.docs.map((d) => d.id), ['note', 'own2', 'thr1', 'two1', 'own1'])
      })
    })
  })

  describe('the super admin activity log', () => {
    it('takes a super admin\'s own entries', async () => {
      await assertSucceeds(superLog('sa2', 'sa2'))
      await assertSucceeds(superLog('sa1', 'sa1'))
    })
    it('refuses entries written in somebody else\'s name', async () => {
      await assertFails(superLog('sa2', 'sa1'))
    })
    it('refuses entries filed under somebody else\'s console', async () => {
      await assertFails(setDoc(doc(db('sa2'), 'superAdminLogs/filed'), { superAdminId: 'sa1', actorId: 'sa2', actorName: 'x', type: 't', title: 't', entity: 'e', icon: 'key', at: now }))
    })
    it('cannot be edited or erased by anyone, the owner included', async () => {
      await env.withSecurityRulesDisabled(async (ctx) =>
        setDoc(doc(ctx.firestore(), 'superAdminLogs/l9'), { superAdminId: 'sa1', actorId: 'sa1', actorName: 'x', type: 'invite_change', title: 't', entity: 'e', icon: 'key', at: now }))
      await assertFails(deleteDoc(doc(db('sa2'), 'superAdminLogs/l9')))
      await assertFails(deleteDoc(doc(db('sa1'), 'superAdminLogs/l9')))
      await assertFails(updateDoc(doc(db('sa2'), 'superAdminLogs/l9'), { title: 'edited' }))
    })
  })
})

describe('managing admins', () => {
  it('lets a super admin remove, restore, reassign and list admins', async () => {
    const s = db('sa1')
    await assertSucceeds(updateDoc(doc(s, 'users/a1'), { removed: true, removedAt: now, removedBy: 'sa1' }))
    await assertSucceeds(updateDoc(doc(s, 'users/a1'), { removed: false, superAdminId: 'sa1' }))
    await assertSucceeds(getDocs(query(collection(s, 'users'), where('role', 'in', ['admin', 'superadmin']))))
  })
  it('does not let a super admin change an account\'s role', async () => {
    await assertFails(updateDoc(doc(db('sa1'), 'users/a1'), { role: 'superadmin' }))
  })
  it('does not let an admin edit their own removed flag, role or owner', async () => {
    const s = db('a1')
    await assertFails(updateDoc(doc(s, 'users/a1'), { removed: true }))
    await assertFails(updateDoc(doc(s, 'users/a1'), { role: 'superadmin' }))
    await assertFails(updateDoc(doc(s, 'users/a1'), { superAdminId: 'a1' }))
  })
  it('lets an admin record their own last login', async () => {
    await assertSucceeds(updateDoc(doc(db('a1'), 'users/a1'), { lastLoginAt: now }))
  })
  it('does not let a seller change their own admin', async () => {
    await assertFails(updateDoc(doc(db('s1'), 'users/s1'), { adminId: 'someone-else' }))
    await assertFails(updateDoc(doc(db('s1'), 'users/s1'), { inviteCode: 'HIJACK' }))
  })
  it('never lets anyone delete a profile', async () => {
    await assertFails(deleteDoc(doc(db('sa1'), 'users/a1')))
    await assertFails(deleteDoc(doc(db('c1'), 'users/c1')))
  })
})

describe('reading accounts', () => {
  it('lets an admin list only their own sellers', async () => {
    const s = db('a1')
    await assertSucceeds(getDocs(query(collection(s, 'users'), where('role', '==', 'seller'), where('adminId', '==', 'a1'))))
    await assertFails(getDocs(query(collection(s, 'users'), where('role', '==', 'seller'))))
    await assertFails(getDocs(collection(s, 'users')))
  })
  it('lets an admin read the super admin who invited them, but not other admins', async () => {
    await assertSucceeds(getDoc(doc(db('a1'), 'users/sa1')))
    await env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'users/a2'), { ...ADMIN, email: 'a2@x.com', inviteCode: 'ADMINTWO' }))
    await assertFails(getDoc(doc(db('a1'), 'users/a2')))
  })
  it('lets a seller read only themselves', async () => {
    await assertSucceeds(getDoc(doc(db('s1'), 'users/s1')))
    await assertFails(getDoc(doc(db('s1'), 'users/a1')))
  })
  it('gives signed-out visitors nothing', async () => {
    await assertFails(getDoc(doc(db(), 'users/a1')))
    await assertFails(getDocs(collection(db(), 'users')))
  })
})
