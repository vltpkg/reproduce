import fs from 'node:fs'
import os from 'node:os'
import { reproduce } from '../index.js'
import cache from '../cache.json' with { type: 'json' }
import packages from './packages.json' with { type: 'json' }
import PQueue from 'p-queue'
const cpus = os.cpus().length - 1
const queue = new PQueue({ concurrency: cpus })
console.log('go this fast:', cpus)

// const { packument } = require('pacote')
const subset = packages.packages.slice(0, 5)
const results = {}
const opts = { cache, packumentCache: new Map() }
for (let i = 0; i < subset.length; i++) {
  queue.add(((pkg) => { 
    return () => {
      return new Promise(async (resolve) => {
        console.log(`reproducing ${pkg}...`)
        results[pkg] = await reproduce(pkg, opts)
        resolve()
      })
    }
  })(subset[i]))
}

await queue.onIdle()
console.log('results:', results)
fs.writeFileSync('./cache.json', JSON.stringify(results, null, 2))

// for (const pkg of subset) {
//   test(`can reproduce ${pkg.name}`, async (t) => {
//     assert.strictEqual(true, await reproduce(pkg.name))
//   })
// }

// test('can reproduce with only git repo', async (t) => {
//   assert.strictEqual(true, await reproduce('migrate'))
// })

// test('supports git repo & gitHead', async (t) => {

// })

// test('supports git repo & gitHead', async (t) => {

// })

// test('supports git repo, directory for monorepos', async (t) => {

// })

// test('fails to reproduce when git repo missing', async (t) => {
  
// })

// test('fails when contents mismatch', async (t) => {
  
// })