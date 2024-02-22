async function reproduce (spec) {
  const opts = { registry: 'https://registry.npmjs.org', Arborist: require('@npmcli/arborist') }
  const pacote = require('pacote')
  const diff = require('libnpmdiff')
  const manifest = await pacote.manifest(spec, opts)
  if (!manifest) {
    console.log(`No package found for ${spec}`)
    return false
  }
  const data = await fetch(`${opts.registry}/${manifest.name}/${manifest.version}`)
  const packument = await data.json()
  if (!packument.repository || !packument.repository.url) {
    console.log(`No repository defined for ${spec}`)
    return false 
  }
  const repo = packument.repository.url
  const head = packument.gitHead ? packument.gitHead : 'HEAD'
  const ref = repo.indexOf('#') > 0 ? repo.substring(0, uri.indexOf('#')) : repo
  const url = `${ref}#${head}`
  const repkg = await pacote.tarball(url, opts)
  const check = (packument.dist.integrity === repkg.integrity)
  if (!check) {
    const pkg = await pacote.packument(url, opts)
    console.log('Published:', manifest.version, packument.dist.tarball, packument.dist.integrity)
    console.log('Reproduced:', pkg['dist-tags'].latest, repkg.resolved, repkg.integrity)
    console.log(`Integrity mismatch for ${spec}`)
    console.log('Rich diff:') 
    console.log(await diff([spec, url], opts))
    return false
  }
  return true
}
module.exports = reproduce
