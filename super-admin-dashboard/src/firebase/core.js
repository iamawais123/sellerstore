// Firebase core shared by the storefront, admin console and super-admin console.
// Each of the three apps keeps its own copy of this file (they are separate npm projects that
// only share an origin) — keep the copies identical.
//
// Every role signs in through its own *named* Firebase app, so sessions don't overwrite each
// other: a customer and a seller can be signed in side by side in one browser, exactly like the
// separate localStorage sessions they replace.
import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  initializeFirestore,
  writeBatch,
} from 'firebase/firestore'

const env = import.meta.env ?? {}

export const useEmulator = env.VITE_FIREBASE_USE_EMULATOR === 'true'

const firebaseConfig = useEmulator
  ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-usellerstore', appId: 'demo-app' }
  : {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
    }

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)

export const NOT_CONFIGURED_MESSAGE =
  'Firebase is not configured yet. Copy .env.example to .env, fill in your Firebase web app settings and restart the dev server.'

const services = new Map()

// Lazily creates (once) the Auth + Firestore pair for a named app. Nothing touches Firebase at
// import time, so an unconfigured build still renders and reports a readable error on sign-in.
export function getServices(name, { firestore = true, persistent = true } = {}) {
  if (!isFirebaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE)
  if (services.has(name)) return services.get(name)
  const app = initializeApp(firebaseConfig, name)
  const auth = persistent ? getAuth(app) : initializeAuth(app, { persistence: inMemoryPersistence })
  if (useEmulator) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  let db = null
  if (firestore) {
    // Long-polling auto-detection keeps sign-in working behind proxies that block websockets.
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
    if (useEmulator) connectFirestoreEmulator(db, '127.0.0.1', 8080)
  }
  const result = { app, auth, db }
  services.set(name, result)
  return result
}

// Calls back with the Firebase user (or null) for a named app. A no-op when Firebase isn't
// configured, so callers never mistake "not configured" for "signed out".
export function subscribeAuth(name, callback) {
  if (!isFirebaseConfigured) return () => {}
  return onAuthStateChanged(getServices(name).auth, callback)
}

export const ROLE_LABELS = {
  customer: 'customer',
  seller: 'seller',
  admin: 'admin',
  superadmin: 'super admin',
}

export function describeError(error) {
  const code = error?.code || ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead, or use a different email — one email can only belong to one account type.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/missing-password':
      return 'Please enter your password.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes or reset your password, then try again.'
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.'
    case 'auth/requires-recent-login':
      return 'For security, sign out and sign back in, then try again.'
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Email/password sign-in is not enabled in the Firebase console (Authentication → Sign-in method).'
    case 'auth/configuration-not-found':
      return 'Authentication is not set up in the Firebase project yet (Firebase console → Authentication → Get started).'
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'The Firebase API key in .env is not valid.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised for Firebase Auth (Firebase console → Authentication → Settings → Authorized domains).'
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'The request was rejected by the Firestore security rules. Publish firestore.rules to your Firebase project, then try again.'
    case 'unavailable':
    case 'firestore/unavailable':
      return 'Could not reach Firestore. Check your connection, and that a Firestore database has been created for the project.'
    case 'not-found':
    case 'firestore/not-found':
      return 'The Firestore database was not found. Create it in the Firebase console (Build → Firestore Database).'
    default:
      return error?.message || 'Something went wrong. Please try again.'
  }
}

export const fail = (error) => ({ success: false, error: typeof error === 'string' ? error : describeError(error) })

// ---- Profiles ---------------------------------------------------------------------------

export async function getProfile(db, uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const memberSinceLabel = () => new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

// ---- Invite codes -----------------------------------------------------------------------
// `inviteCodes/{CODE}` is readable by exact code (so a sign-up form can validate one before the
// visitor has an account) but can't be listed. Its id is the code, which also makes codes unique
// across admins and super admins.

export const normalizeInviteCode = (code) => (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const generateInviteCode = () => {
  let code = ''
  for (let i = 0; i < 8; i++) code += INVITE_ALPHABET.charAt(Math.floor(Math.random() * INVITE_ALPHABET.length))
  return code
}

export async function isInviteCodeTaken(db, code) {
  return (await getDoc(doc(db, 'inviteCodes', code))).exists()
}

export async function generateUniqueInviteCode(db) {
  for (let i = 0; i < 20; i++) {
    const code = generateInviteCode()
    if (!(await isInviteCodeTaken(db, code))) return code
  }
  throw new Error('Could not generate a unique invite code. Please try again.')
}

// Returns { code, ownerUid, ownerName, ownerRole } for a live code owned by `ownerRole`, else null.
export async function lookupInviteCode(db, rawCode, ownerRole) {
  const code = normalizeInviteCode(rawCode)
  if (code.length < 4) return null
  const snap = await getDoc(doc(db, 'inviteCodes', code))
  if (!snap.exists()) return null
  const data = snap.data()
  if (data.disabled || (ownerRole && data.ownerRole !== ownerRole)) return null
  return { code, ownerUid: data.ownerUid, ownerName: data.ownerName || '', ownerRole: data.ownerRole }
}

export const inviteCodeDoc = ({ uid, role, fullName }) => ({
  ownerUid: uid,
  ownerRole: role,
  ownerName: fullName,
  disabled: false,
  createdAt: new Date().toISOString(),
})

// Moves an admin/super admin to a new invite code atomically: the old code stops working, the new
// one starts, and their profile points at it.
export async function changeInviteCode(db, { uid, role, fullName, oldCode, rawNewCode }) {
  const code = normalizeInviteCode(rawNewCode)
  if (code.length < 4) return fail('Invite code must be at least 4 characters')
  if (code === oldCode) return { success: true, code }
  if (await isInviteCodeTaken(db, code)) return fail('Invite code already in use')
  const batch = writeBatch(db)
  if (oldCode) batch.delete(doc(db, 'inviteCodes', oldCode))
  batch.set(doc(db, 'inviteCodes', code), inviteCodeDoc({ uid, role, fullName }))
  batch.update(doc(db, 'users', uid), { inviteCode: code })
  try {
    await batch.commit()
  } catch (error) {
    return fail(error)
  }
  return { success: true, code }
}
