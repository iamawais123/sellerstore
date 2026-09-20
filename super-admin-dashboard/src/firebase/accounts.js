// Super-admin console accounts. The very first super admin registers themselves (which closes
// registration for good); every later super admin and every admin can also be created from inside
// this console.
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where, writeBatch } from 'firebase/firestore'
import {
  NOT_CONFIGURED_MESSAGE,
  changeInviteCode,
  describeError,
  fail,
  generateUniqueInviteCode,
  getProfile,
  getServices,
  inviteCodeDoc,
  isFirebaseConfigured,
  memberSinceLabel,
} from './core'

export { subscribeAuth, isFirebaseConfigured, NOT_CONFIGURED_MESSAGE } from './core'

export const SUPER_APP = 'superadmin'
// A second, in-memory Firebase app used only to create other people's Auth accounts: creating a
// user signs that user in, which would otherwise sign the super admin out of their own console.
const PROVISIONER_APP = 'provisioner'

const services = () => getServices(SUPER_APP)

async function rollbackSignUp(auth, user) {
  try {
    if (user) await deleteUser(user)
  } catch (_) {
    try {
      await signOut(auth)
    } catch (__) {}
  }
}

// Registration is open only until the first super admin exists (meta/bootstrap is created by them).
export async function getBootstrapState() {
  if (!isFirebaseConfigured) return { open: false, error: NOT_CONFIGURED_MESSAGE }
  try {
    const snap = await getDoc(doc(services().db, 'meta', 'bootstrap'))
    return { open: !snap.exists(), error: '' }
  } catch (error) {
    return { open: false, error: describeError(error) }
  }
}

export async function signInSuperAdminAccount({ email, password, remember = true }) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  const { auth, db } = services()
  try {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    const { user } = await signInWithEmailAndPassword(auth, (email || '').trim(), password || '')
    const profile = await getProfile(db, user.uid)
    if (!profile || profile.role !== 'superadmin') {
      await signOut(auth)
      return fail('This email is not a super admin account.')
    }
    if (profile.removed) {
      await signOut(auth)
      return fail('This super admin account has been removed.')
    }
    const lastLoginAt = new Date().toISOString()
    updateDoc(doc(db, 'users', user.uid), { lastLoginAt }).catch(() => {})
    return { success: true, user, profile: { ...profile, lastLoginAt } }
  } catch (error) {
    try {
      await signOut(auth)
    } catch (_) {}
    return fail(error)
  }
}

export async function registerSuperAdminAccount({ fullName, email, password }) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  const { auth, db } = services()
  let user = null
  try {
    if ((await getDoc(doc(db, 'meta', 'bootstrap'))).exists()) {
      return fail('Registration is closed. Ask an existing super admin to add you.')
    }
    ;({ user } = await createUserWithEmailAndPassword(auth, (email || '').trim(), password || ''))
    const name = (fullName || '').trim()
    await updateProfile(user, { displayName: name })
    const code = await generateUniqueInviteCode(db)
    const now = new Date().toISOString()
    const profile = {
      role: 'superadmin',
      fullName: name,
      email: user.email,
      inviteCode: code,
      memberSince: memberSinceLabel(),
      createdAt: now,
      lastLoginAt: now,
      createdBy: null,
      removed: false,
    }
    // One atomic batch: the profile, the invite code and the flag that closes registration. The
    // security rules only accept the profile if the bootstrap flag is created alongside it.
    const batch = writeBatch(db)
    batch.set(doc(db, 'users', user.uid), profile)
    batch.set(doc(db, 'inviteCodes', code), inviteCodeDoc({ uid: user.uid, role: 'superadmin', fullName: name }))
    batch.set(doc(db, 'meta', 'bootstrap'), { superAdminUid: user.uid, createdAt: now })
    await batch.commit()
    return { success: true, user, profile: { id: user.uid, ...profile } }
  } catch (error) {
    await rollbackSignUp(auth, user)
    return fail(error)
  }
}

// Creates an admin or a further super admin: the Auth user via the provisioner app, then (as the
// signed-in super admin) their profile and invite code in one batch.
export async function provisionAccount({ role, fullName, email, password, superAdminId, createdBy }) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  const { db } = services()
  const { auth: provisioner } = getServices(PROVISIONER_APP, { firestore: false, persistent: false })
  let user = null
  try {
    ;({ user } = await createUserWithEmailAndPassword(provisioner, (email || '').trim(), password || ''))
    const name = (fullName || '').trim()
    await updateProfile(user, { displayName: name })
    const code = await generateUniqueInviteCode(db)
    const now = new Date().toISOString()
    const profile = {
      role,
      fullName: name,
      email: user.email,
      inviteCode: code,
      memberSince: memberSinceLabel(),
      createdAt: now,
      lastLoginAt: null,
      removed: false,
      ...(role === 'admin' ? { superAdminId } : { createdBy }),
    }
    const batch = writeBatch(db)
    batch.set(doc(db, 'users', user.uid), profile)
    batch.set(doc(db, 'inviteCodes', code), inviteCodeDoc({ uid: user.uid, role, fullName: name }))
    await batch.commit()
    await signOut(provisioner)
    return { success: true, record: { id: user.uid, ...profile } }
  } catch (error) {
    await rollbackSignUp(provisioner, user)
    return fail(error)
  }
}

// Live view of the signed-in super admin's own profile.
//
// While the profile is being created (registration), the SDK first reports it straight from this
// client's own uncommitted write. That is not proof the server can see it yet, and everything that
// starts listening because "the profile exists" (the whole network's data, protected by rules that
// look this profile up) would be refused. So such snapshots are skipped: metadata changes are
// included so the callback still fires the moment the write is committed.
export function watchOwnProfile(uid, callback) {
  if (!isFirebaseConfigured) return () => {}
  return onSnapshot(
    doc(services().db, 'users', uid),
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.metadata.hasPendingWrites) return
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    },
    () => callback(null)
  )
}

// Live list of every admin and super admin.
export function watchAccounts(callback, onError = () => {}) {
  if (!isFirebaseConfigured) return () => {}
  return onSnapshot(
    query(collection(services().db, 'users'), where('role', 'in', ['admin', 'superadmin'])),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => onError(describeError(error))
  )
}

export function updateOwnInviteCode({ uid, fullName, oldCode, rawNewCode }) {
  if (!isFirebaseConfigured) return Promise.resolve(fail(NOT_CONFIGURED_MESSAGE))
  return changeInviteCode(services().db, { uid, role: 'superadmin', fullName, oldCode, rawNewCode })
}

export const newInviteCode = () => generateUniqueInviteCode(services().db)

// Removing an account blocks its sign-in (profile.removed) and switches its invite code off, so
// nobody can join through it; restoring reverses both. Nothing is deleted.
export async function setAccountRemoved({ target, removed, actorUid, reassignAdminsTo = null, adminIdsToReassign = [] }) {
  const { db } = services()
  const batch = writeBatch(db)
  batch.update(
    doc(db, 'users', target.id),
    removed ? { removed: true, removedAt: new Date().toISOString(), removedBy: actorUid } : { removed: false, removedAt: null, removedBy: null }
  )
  if (target.inviteCode) batch.update(doc(db, 'inviteCodes', target.inviteCode), { disabled: removed })
  // A removed super admin's admins are handed to whoever removed them, so none is left ownerless.
  if (removed && reassignAdminsTo) {
    adminIdsToReassign.forEach((adminId) => batch.update(doc(db, 'users', adminId), { superAdminId: reassignAdminsTo }))
  }
  try {
    await batch.commit()
    return { success: true }
  } catch (error) {
    return fail(error)
  }
}

export async function assignAdmin(adminId, superAdminId) {
  try {
    await updateDoc(doc(services().db, 'users', adminId), { superAdminId })
    return { success: true }
  } catch (error) {
    return fail(error)
  }
}

export async function sendPasswordResetTo(email) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  try {
    await sendPasswordResetEmail(services().auth, (email || '').trim())
    return { success: true }
  } catch (error) {
    return fail(error)
  }
}

export async function changeOwnPasswordTo(newPassword) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  const user = services().auth.currentUser
  if (!user) return fail('Not logged in')
  try {
    await updatePassword(user, newPassword)
    return { success: true }
  } catch (error) {
    return fail(error)
  }
}

export async function signOutSuperAdminAccount() {
  if (!isFirebaseConfigured) return
  try {
    await signOut(services().auth)
  } catch (_) {}
}
