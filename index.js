import {
  manifest as getManifest,
  tarball as getTarball
} from '@vltpkg/package-info'
import { readFileSync } from 'node:fs'
import { promisify } from 'node:util'
import { Spec } from '@vltpkg/spec'
import pacote from 'pacote'
import Arborist from '@npmcli/arborist'
import pkg from './package.json' with { type: 'json' }
import enhanced from 'enhanced-resolve'
const enhancedResolve = promisify(enhanced)

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

  try {
    // validate spec
    const info = new Spec(spec)
    if (!spec || !info || info.type != 'registry' || info.registry != 'https://registry.npmjs.org/') {
      return false
    }

    // cache
    if (opts.cache.hasOwnProperty(spec)) {
      return opts.cache[spec]
    }

    // get manifest
    const manifest = await getManifest(spec)
    if (!manifest || !manifest?.repository?.url) {
      return false
    }

    const repo = manifest.repository
    const url = repo.url
    const parsed = new URL(url)
    const location = parsed.pathname.replace('.git', '').split('/').slice(1, 3).join('/')
    const path = repo.directory ? `::path:${repo.directory}` : ''
    const explicitRef = url.indexOf('#') > 0 ? url.substring(0, url.indexOf('#')) : ''
    const implicitRef = manifest.gitHead || 'HEAD'
    const ref = explicitRef || implicitRef || ''
    const host = parsed.host

    if (host !== 'github.com') {
      return false
    }

    const source = `github:${location}#${ref}${path}`

    // npm/pacote-specific build
    const pacotePackgeJSON = await enhancedResolve('./', 'pacote/package.json')
    const pacoteVersion = JSON.parse(readFileSync(pacotePackgeJSON, 'utf8')).version
    const build = await pacote.tarball(source, opts.pacote)

    const check = opts.cache[spec] = {
      reproduceVersion: pkg.version,
      timestamp: new Date(),
      os: process.platform,
      arch: process.arch,
      strategy: `npm:pacote:${pacoteVersion}`,
      reproduced: manifest.dist.integrity === build.integrity,
      package: {
        spec,
        location: manifest.dist.tarball,
        integrity: manifest.dist.integrity,
      },
      source: {
        spec: source,
        location: repo.url,
        integrity: build.integrity,
      }
    }
    return check

  } catch (e) {
    return false
  }

}
