// scripts/deny-product-removal.mjs, the one-time switch that turns product removal off for the sellers who
// still have it on from before it became opt-in. Run against the Firestore emulator (`npm run test:rules`).
import { spawnSync } from 'node:child_process'
import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':')
const PROJECT = 'demo-usellerstore'
let env

before(async () => {
  env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { host, port: Number(port) } })
})
after(async () => env?.cleanup())

const shop = (name, extra = {}) => ({ fullName: name, shopName: `${name} Shop`, adminId: 'a1', balance: 25, productIds: ['p1', 'p2'], ...extra })

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'shops/on1'), shop('On One', { allowProductRemoval: true }))
    await setDoc(doc(db, 'shops/on2'), shop('On Two', { allowProductRemoval: true, adminId: 'a2' }))
    await setDoc(doc(db, 'shops/off'), shop('Already Off', { allowProductRemoval: false }))
    await setDoc(doc(db, 'shops/none'), shop('Never Set'))
  })
})

// (`withSecurityRulesDisabled` does not hand back what its callback returns)
const read = async (id) => {
  let data
  await env.withSecurityRulesDisabled(async (ctx) => {
    data = (await getDoc(doc(ctx.firestore(), `shops/${id}`))).data()
  })
  return data
}

const run = (...args) => {
  const environment = { ...process.env, FIRESTORE_EMULATOR_HOST: `${host}:${port}`, GCLOUD_PROJECT: PROJECT }
  return spawnSync(process.execPath, ['scripts/deny-product-removal.mjs', ...args], { env: environment, encoding: 'utf8' })
}

describe('deny-product-removal script', () => {
  it('by default only lists who would change, and changes nothing', async () => {
    const result = run()
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /2 sellers have product removal switched on/)
    assert.match(result.stdout, /On One Shop|On One/)
    assert.match(result.stdout, /On Two Shop|On Two/)
    assert.doesNotMatch(result.stdout, /Already Off|Never Set/)
    assert.match(result.stdout, /Dry run: nothing was changed/)
    assert.equal((await read('on1')).allowProductRemoval, true)
    assert.equal((await read('on2')).allowProductRemoval, true)
  })

  it('with --apply switches it off for exactly those sellers and touches nothing else', async () => {
    const result = run('--apply')
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /product removal is now off for 2 sellers/)
    const [on1, on2, off, none] = await Promise.all(['on1', 'on2', 'off', 'none'].map(read))
    assert.equal(on1.allowProductRemoval, false)
    assert.equal(on2.allowProductRemoval, false)
    assert.equal(off.allowProductRemoval, false)
    assert.equal('allowProductRemoval' in none, false, 'a shop that never had the setting is left alone')
    for (const data of [on1, on2, off, none]) {
      assert.equal(data.balance, 25)
      assert.deepEqual(data.productIds, ['p1', 'p2'])
    }
    assert.equal(on1.shopName, 'On One Shop')
  })

  it('finds nothing to do the second time', async () => {
    run('--apply')
    const again = run('--apply')
    assert.equal(again.status, 0, again.stderr)
    assert.match(again.stdout, /No seller has product removal switched on/)
  })

  it('refuses to start without a service-account key or an emulator, and says what is missing', () => {
    const environment = { ...process.env }
    delete environment.FIRESTORE_EMULATOR_HOST
    delete environment.FIREBASE_SERVICE_ACCOUNT
    const result = spawnSync(process.execPath, ['scripts/deny-product-removal.mjs', '--apply'], { env: environment, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /FIREBASE_SERVICE_ACCOUNT/)
  })
})
