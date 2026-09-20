// The storefront, admin console and super-admin console are separate npm projects, so each carries
// its own copy of the shared Firebase modules. They must stay byte-for-byte identical: edit
// src/firebase/<file> and copy it over the other two.
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const APPS = ['src', 'admin-dashboard/src', 'super-admin-dashboard/src']
const SHARED = ['core.js', 'shopData.js']

describe('shared firebase modules', () => {
  for (const file of SHARED) {
    it(`${file} is identical in all three apps`, () => {
      const [first, ...rest] = APPS.map((app) => readFileSync(new URL(`../${app}/firebase/${file}`, import.meta.url), 'utf8'))
      rest.forEach((copy, index) => assert.equal(copy, first, `${APPS[index + 1]}/firebase/${file} differs from ${APPS[0]}/firebase/${file}`))
    })
  }
})
