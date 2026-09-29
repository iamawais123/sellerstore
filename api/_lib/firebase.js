// Firebase Admin access for the relay. The service-account key (Firebase console → Project settings →
// Service accounts → Generate new private key) goes into the FIREBASE_SERVICE_ACCOUNT environment
// variable, as the JSON itself or base64 of it. It bypasses the security rules, so it lives only here.
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { requireSetting } from './http.js'

const readServiceAccount = () => {
  const raw = requireSetting('FIREBASE_SERVICE_ACCOUNT')
  try {
    const account = JSON.parse(raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'))
    // Pasted into an environment variable, the key's line breaks turn into a literal "\n".
    if (typeof account.private_key === 'string') account.private_key = account.private_key.replace(/\\n/g, '\n')
    return account
  } catch (_) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.')
  }
}

let db = null

export function adminServices() {
  if (!getApps().length) initializeApp({ credential: cert(readServiceAccount()) })
  if (!db) {
    db = getFirestore()
    db.settings({ ignoreUndefinedProperties: true })
  }
  return { db, auth: getAuth() }
}
