//
// TODO:
//
// 0. add the release workspaces script to run alongside the client's publish workflow
//
// 1. refactor (typescript + use vlt libraries)
//   1.1. run on all our own packages (ie. workspaces)
//   1.2. distribute our internal workspaces/packages
//
// 2. test with / for the top ~10k packages
//   2.1. use in blog post for rough %s of packages that can be reproduced
//   2.2. need to caveat the environment + time of testing factors into reporducibility
//
// 3. put into a service which returns results (lazily)
//
// POTENTIAL BLOCKERS:
//
// 1. our packages fail to reproduce
//   1.1. likely because we have immauture git package resolution
//   1.2. our workflow for publishing isn't accounted for (ie. we use pnpm workspaces)
//

import pacote from 'pacote' // @vltpkg/package-info
import Arborist from '@npmcli/arborist' // this is a hack... don't need this
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
