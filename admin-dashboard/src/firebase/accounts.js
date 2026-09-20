// Admin console accounts. Admins join with a super admin's invite code (or are created by a
// super admin), and every admin gets an invite code of their own for onboarding sellers.
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore'
import {
  NOT_CONFIGURED_MESSAGE,
  changeInviteCode,
  fail,
  generateUniqueInviteCode,
  getProfile,
  getServices,
  inviteCodeDoc,
  isFirebaseConfigured,
  lookupInviteCode,
  memberSinceLabel,
} from './core'

export { subscribeAuth, isFirebaseConfigured } from './core'

export const ADMIN_APP = 'admin'
// The super-admin console's Firebase app. The three consoles share one origin, so its persisted
// session is visible here: when a super admin uses "log in as admin", this console reads and
// writes with the *super admin's* identity (which the security rules allow), because the admin
// being impersonated has no Firebase session of their own on this browser.
export const SUPER_APP = 'superadmin'

async function rollbackSignUp(auth, user) {
  try {
    if (user) await deleteUser(user)
  } catch (_) {
    try {
      await signOut(auth)
    } catch (__) {}
  }
}

export async function signInAdminAccount({ email, password, remember = true }) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  const { auth, db } = getServices(ADMIN_APP)
  try {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    const { user } = await signInWithEmailAndPassword(auth, (email || '').trim(), password || '')
    const profile = await getProfile(db, user.uid)
    if (!profile || profile.role !== 'admin') {
      await signOut(auth)
      return fail(
        profile
          ? 'This email is not an admin account. Admins register with a super admin invite code.'
          : 'No admin account found for this email. Register with a super admin invite code.'
      )
    }
    if (profile.removed) {
      await signOut(auth)
      return fail('This admin account has been removed by a super admin.')
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

// Validates the super admin's invite code first, then creates the Auth user and — in one atomic
// batch — the admin's profile and their own invite code. If any step fails the Auth user is removed
// again so the email is never stranded without a profile.
export async function registerAdminAccount({ fullName, email, password, inviteCode }) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  const { auth, db } = getServices(ADMIN_APP)
  let user = null
  try {
    const invite = await lookupInviteCode(db, inviteCode, 'superadmin')
    if (!invite) return fail('That super admin invite code is not valid.')
    ;({ user } = await createUserWithEmailAndPassword(auth, (email || '').trim(), password || ''))
    const name = (fullName || '').trim()
    await updateProfile(user, { displayName: name })
    const ownCode = await generateUniqueInviteCode(db)
    const now = new Date().toISOString()
    const profile = {
      role: 'admin',
      fullName: name,
      email: user.email,
      inviteCode: ownCode,
      superAdminId: invite.ownerUid,
      registeredWithCode: invite.code,
      memberSince: memberSinceLabel(),
      createdAt: now,
      lastLoginAt: now,
      removed: false,
    }
    const batch = writeBatch(db)
    batch.set(doc(db, 'users', user.uid), profile)
    batch.set(doc(db, 'inviteCodes', ownCode), inviteCodeDoc({ uid: user.uid, role: 'admin', fullName: name }))
    await batch.commit()
    return { success: true, user, profile: { id: user.uid, ...profile }, superAdmin: invite }
  } catch (error) {
    await rollbackSignUp(auth, user)
    return fail(error)
  }
}

export async function findSuperAdminByInviteCode(code) {
  if (!isFirebaseConfigured) return null
  try {
    const invite = await lookupInviteCode(getServices(ADMIN_APP).db, code, 'superadmin')
    return invite ? { id: invite.ownerUid, fullName: invite.ownerName, inviteCode: invite.code } : null
  } catch (_) {
    return null
  }
}

export async function loadAdminProfile(uid, appName = ADMIN_APP) {
  try {
    return await getProfile(getServices(appName).db, uid)
  } catch (_) {
    return null
  }
}

// Live view of the signed-in admin's own profile, so a super admin removing them (or changing
// their invite code) takes effect straight away.
export function watchAdminProfile(uid, callback, appName = ADMIN_APP) {
  if (!isFirebaseConfigured) return () => {}
  return onSnapshot(
    doc(getServices(appName).db, 'users', uid),
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    () => {}
  )
}

export function updateOwnInviteCode({ uid, fullName, oldCode, rawNewCode }) {
  if (!isFirebaseConfigured) return Promise.resolve(fail(NOT_CONFIGURED_MESSAGE))
  return changeInviteCode(getServices(ADMIN_APP).db, { uid, role: 'admin', fullName, oldCode, rawNewCode })
}

export const newInviteCode = () => generateUniqueInviteCode(getServices(ADMIN_APP).db)

export async function signOutAdminAccount() {
  if (!isFirebaseConfigured) return
  try {
    await signOut(getServices(ADMIN_APP).auth)
  } catch (_) {}
}

// Sellers' passwords can't be set from here any more (they live in Firebase Auth), so admins send
// the seller a reset link instead.
export async function sendPasswordResetTo(email) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  try {
    await sendPasswordResetEmail(getServices(ADMIN_APP).auth, (email || '').trim())
    return { success: true }
  } catch (error) {
    return fail(error)
  }
}
