const fs = require('fs')
const { reproduce } = require('../index.js')
const cache = require('../cache.json')
const { packages } = require('./packages.json')
// const { packument } = require('pacote')
const subset = packages.slice(0, 36)
const results = {}
const opts = { cache, packumentCache: new Map() }

for (let i = 0; i < subset.length; i++) {
  let pkg = subset[i]
  console.log(`reproducing ${pkg}...`)
  results[pkg] = await reproduce(pkg, opts)
}
console.log(results)
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