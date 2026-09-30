// One-time: switch product removal OFF for every seller who still has it on from before it became opt-in.
//
// Until now every new shop was created with `allowProductRemoval: true`, so every existing seller has it
// stored as on — a default, not a choice an admin made. From now on a seller can only remove products when
// their admin switches it on (Sellers → ⋮ → Allow Product Removal), and new shops start with it off. This
// brings the existing sellers in line.
//
// Run it ONCE, before admins start allowing removal on purpose: it cannot tell a default `true` from one an
// admin chose, so running it later would switch those off too.
//
//   FIREBASE_SERVICE_ACCOUNT=<same value as on Vercel> node scripts/deny-product-removal.mjs            dry run: lists who would change
//   FIREBASE_SERVICE_ACCOUNT=<same value as on Vercel> node scripts/deny-product-removal.mjs --apply    does it
//
// With FIRESTORE_EMULATOR_HOST set it talks to the emulator instead (no key needed) — that is how it is tested.
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readServiceAccount } from '../api/_lib/firebase.js'

const apply = process.argv.includes('--apply')
const BATCH = 400

try {
  initializeApp(process.env.FIRESTORE_EMULATOR_HOST ? { projectId: process.env.GCLOUD_PROJECT || 'demo-usellerstore' } : { credential: cert(readServiceAccount()) })
} catch (error) {
  console.error(`Could not start: ${error?.message || error}`)
  process.exit(1)
}
const db = getFirestore()

const found = await db.collection('shops').where('allowProductRemoval', '==', true).get()
if (found.empty) {
  console.log('No seller has product removal switched on. Nothing to do.')
  process.exit(0)
}

console.log(`${found.size} seller${found.size === 1 ? ' has' : 's have'} product removal switched on:`)
for (const doc of found.docs) {
  const shop = doc.data()
  console.log(`  - ${shop.shopName || shop.fullName || '(unnamed)'}  [${doc.id}]  admin ${shop.adminId || '—'}`)
}

if (!apply) {
  console.log('\nDry run: nothing was changed. Run again with --apply to switch product removal off for all of them.')
  process.exit(0)
}

for (let i = 0; i < found.docs.length; i += BATCH) {
  const batch = db.batch()
  found.docs.slice(i, i + BATCH).forEach((doc) => batch.update(doc.ref, { allowProductRemoval: false }))
  await batch.commit()
}
console.log(`\nDone: product removal is now off for ${found.size} seller${found.size === 1 ? '' : 's'}. Admins can allow it again per seller in the Sellers menu.`)
