import pacote from 'pacote'
import Arborist from '@npmcli/arborist'
export async function reproduce (spec, opts={}) {
  opts = {
    cache: {},
    pacote: {
      cache: './cache/',
      registry: 'https://registry.npmjs.org',
      Arborist,
      pacumentCache: opts?.packumentCache ? opts.packumentCache : new Map()
    },
    ...opts
  }
  // return early when cache is warm
  if (opts.cache.hasOwnProperty(spec)) {
    return opts.cache[spec]
  }
  const manifest = await pacote.manifest(spec, opts.pacote)
  if (!manifest) {
    return false
  }
  const source = `${opts.pacote.registry}/${manifest.name}/${manifest.version}`
  const data = await fetch(source)
  const packument = await data.json()
  if (!packument.repository || !packument.repository.url) {
    return false
  }
  const repo = packument.repository.url
  const head = packument.gitHead ? packument.gitHead : 'HEAD'
  const ref = repo.indexOf('#') > 0 ? repo.substring(0, uri.indexOf('#')) : repo
  const url = `${ref}#${head}`
  try {
    const repkg = await pacote.tarball(url, opts.pacote)
    return (packument.dist.integrity === repkg.integrity)
  } catch (e) {
    return false
  }
}
