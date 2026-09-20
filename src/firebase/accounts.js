// Storefront accounts: customers and sellers, each on their own Firebase app instance.
import {
  EmailAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'
import { doc, setDoc, writeBatch } from 'firebase/firestore'
import {
  ROLE_LABELS,
  fail,
  getProfile,
  getServices,
  isFirebaseConfigured,
  lookupInviteCode,
  memberSinceLabel,
  NOT_CONFIGURED_MESSAGE,
} from './core'
import { COL, createWelcomeConversation, newShopRecord, normalizeShop, stageActivity } from './shopData'

export { subscribeAuth, isFirebaseConfigured } from './core'

export const CUSTOMER_APP = 'customer'
export const SELLER_APP = 'seller'

const wrongRole = (actual, expected) =>
  `This email is registered as a ${ROLE_LABELS[actual] || 'different'} account, not a ${ROLE_LABELS[expected]} account. Use the matching sign-in page.`

// A half-created account (Auth user without a profile) would be unusable and would block the
// email from ever being registered again, so a failed sign-up always removes the Auth user.
async function rollbackSignUp(auth, user) {
  try {
    if (user) await deleteUser(user)
  } catch (_) {
    try {
      await signOut(auth)
    } catch (__) {}
  }
}

// `remember: false` keeps the session for this browser tab only; otherwise it survives restarts.
async function signInAs(appName, role, { email, password, remember = true }) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  const { auth, db } = getServices(appName)
  try {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    const { user } = await signInWithEmailAndPassword(auth, (email || '').trim(), password || '')
    let profile = await getProfile(db, user.uid)
    // A customer account created straight in the Firebase console has no profile yet — adopt it.
    if (!profile && role === 'customer') {
      const fresh = { role: 'customer', fullName: user.displayName || '', email: user.email, createdAt: new Date().toISOString() }
      await setDoc(doc(db, 'users', user.uid), fresh)
      profile = { id: user.uid, ...fresh }
    }
    if (!profile) {
      await signOut(auth)
      return fail('This account has no profile in the store database. Please contact support.')
    }
    if (profile.role !== role) {
      await signOut(auth)
      return fail(wrongRole(profile.role, role))
    }
    return { success: true, user, profile }
  } catch (error) {
    try {
      await signOut(auth)
    } catch (_) {}
    return fail(error)
  }
}

export const signInCustomerAccount = (credentials) => signInAs(CUSTOMER_APP, 'customer', credentials)
export const signInSellerAccount = (credentials) => signInAs(SELLER_APP, 'seller', credentials)

export async function signUpCustomerAccount({ fullName, email, password }) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  const { auth, db } = getServices(CUSTOMER_APP)
  let user = null
  try {
    ;({ user } = await createUserWithEmailAndPassword(auth, (email || '').trim(), password || ''))
    const name = (fullName || '').trim()
    await updateProfile(user, { displayName: name })
    const profile = { role: 'customer', fullName: name, email: user.email, createdAt: new Date().toISOString() }
    await setDoc(doc(db, 'users', user.uid), profile)
    return { success: true, user, profile: { id: user.uid, ...profile } }
  } catch (error) {
    await rollbackSignUp(auth, user)
    return fail(error)
  }
}

// Sellers can only join through a live admin invite code; the code decides which admin they belong to.
// The profile, the shop, the KYC images and a line in the admin's activity feed are written in one
// batch, so a seller never exists half-registered (the rules cross-check the four documents).
// `documents` = { front, back } as compressed data URLs.
export async function signUpSellerAccount({ documents, ...fields }) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  const { auth, db } = getServices(SELLER_APP)
  let user = null
  try {
    const invite = await lookupInviteCode(db, fields.inviteCode, 'admin')
    if (!invite) return fail('That invitation code is not valid. Check it with your admin.')
    ;({ user } = await createUserWithEmailAndPassword(auth, (fields.email || '').trim(), fields.password || ''))
    const name = (fields.fullName || '').trim()
    await updateProfile(user, { displayName: name })
    const profile = {
      role: 'seller',
      fullName: name,
      email: user.email,
      shopName: (fields.shopName || '').trim() || 'My Shop',
      adminId: invite.ownerUid,
      inviteCode: invite.code,
      country: fields.country || '',
      streetAddress: fields.streetAddress || '',
      city: fields.city || '',
      state: fields.state || '',
      documentType: fields.documentType || '',
      createdAt: new Date().toISOString(),
      memberSince: memberSinceLabel(),
    }
    const hasDocuments = !!(documents?.front && documents?.back)
    const shopRecord = newShopRecord(profile, { hasDocuments })
    const batch = writeBatch(db)
    batch.set(doc(db, 'users', user.uid), profile)
    batch.set(doc(db, COL.shops, user.uid), shopRecord)
    if (hasDocuments) {
      batch.set(doc(db, COL.kycDocuments, user.uid), {
        sellerId: user.uid,
        adminId: invite.ownerUid,
        front: documents.front,
        back: documents.back,
        updatedAt: profile.createdAt,
      })
    }
    stageActivity(db, batch, {
      adminId: invite.ownerUid,
      sellerId: user.uid,
      actorId: user.uid,
      type: 'seller_signup',
      title: 'New seller registered',
      entity: name,
      icon: 'signup',
    })
    await batch.commit()
    const shop = normalizeShop(user.uid, shopRecord)
    // The admin's support chat greets the new seller. Best effort and after the registration has
    // committed: a hiccup here must never undo the sign-up (the portal retries it on first load).
    await createWelcomeConversation(db, shop)
    return { success: true, user, profile: { id: user.uid, ...profile }, shop, admin: invite }
  } catch (error) {
    await rollbackSignUp(auth, user)
    return fail(error)
  }
}

export async function signOutAccount(appName) {
  if (!isFirebaseConfigured) return
  try {
    await signOut(getServices(appName).auth)
  } catch (_) {}
}

export async function sendResetEmail(appName, email) {
  if (!isFirebaseConfigured) return fail(NOT_CONFIGURED_MESSAGE)
  const address = (email || '').trim()
  if (!address) return fail('Enter your email address first.')
  try {
    await sendPasswordResetEmail(getServices(appName).auth, address)
    return { success: true }
  } catch (error) {
    // Don't reveal whether an address is registered.
    if (error?.code === 'auth/user-not-found') return { success: true }
    return fail(error)
  }
}

// Used by the seller sign-up form to show "Invited by <admin>" while the code is being typed.
export async function findAdminByInviteCode(code) {
  if (!isFirebaseConfigured) return null
  try {
    const invite = await lookupInviteCode(getServices(SELLER_APP).db, code, 'admin')
    return invite ? { id: invite.ownerUid, fullName: invite.ownerName, inviteCode: invite.code } : null
  } catch (_) {
    return null
  }
}

export async function loadSellerProfile(uid) {
  try {
    return await getProfile(getServices(SELLER_APP).db, uid)
  } catch (_) {
    return null
  }
}

// ---- seller: their own sign-in details -------------------------------------------------------------
// Firebase asks for a recent sign-in before it changes a password or an email, so the current
// password is checked (re-authenticated) first wherever the form has one.

const sellerUser = () => {
  if (!isFirebaseConfigured) return null
  return getServices(SELLER_APP).auth.currentUser
}

const NO_SESSION = 'Sign in again to change your account details.'

const WRONG_PASSWORD_CODES = ['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials']

// Confirms the seller knows their sign-in password. `{ success: true, user }` on a match.
async function confirmPassword(password) {
  const user = sellerUser()
  if (!user?.email) return fail(NO_SESSION)
  if (!password) return fail('Enter your current password.')
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
    return { success: true, user }
  } catch (error) {
    if (WRONG_PASSWORD_CODES.includes(error?.code)) return fail('Your current password is incorrect.')
    return fail(error)
  }
}

export const verifySellerPassword = async (password) => {
  const result = await confirmPassword(password)
  return result.success ? { success: true } : result
}

export async function changeSellerPassword(currentPassword, newPassword) {
  const confirmed = await confirmPassword(currentPassword)
  if (!confirmed.success) return confirmed
  try {
    await updatePassword(confirmed.user, newPassword)
    return { success: true }
  } catch (error) {
    return fail(error)
  }
}

// Firebase mails a confirmation link to the NEW address; the sign-in email only changes once it is opened.
export async function requestSellerEmailChange(newEmail) {
  const user = sellerUser()
  if (!user) return fail(NO_SESSION)
  const address = (newEmail || '').trim()
  if (!address) return fail('Enter the new email address.')
  if (address.toLowerCase() === (user.email || '').toLowerCase()) return fail('That is already your email address.')
  try {
    await verifyBeforeUpdateEmail(user, address)
    return { success: true }
  } catch (error) {
    return fail(error)
  }
}

export async function sendSellerEmailVerification() {
  const user = sellerUser()
  if (!user) return fail(NO_SESSION)
  try {
    await sendEmailVerification(user)
    return { success: true }
  } catch (error) {
    return fail(error)
  }
}

// Keeps the Auth display name in step with the name saved on the shop. Best effort.
export async function updateSellerDisplayName(name) {
  try {
    const user = sellerUser()
    if (user) await updateProfile(user, { displayName: name })
  } catch (_) {}
}
