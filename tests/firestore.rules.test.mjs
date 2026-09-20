// Security-rules tests for firestore.rules. Run with `npm run test:rules` (needs Java for the
// Firestore emulator). The interesting cases are the privilege-escalation ones: can a visitor make
// themselves an admin, a super admin, or a seller of an admin they were never invited by?
import { readFileSync } from 'node:fs'
import { after, before, beforeEach, describe, it } from 'node:test'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'

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
    batch.set(doc(s, `users/${uid}`), { role, fullName: 'Provisioned', email: `${uid}@x.com`, inviteCode: code, superAdminId: 'sa1', createdAt: now, removed: false })
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
