import { execSync } from 'node:child_process'
import { Spec } from '@vltpkg/spec'
import { manifest as getManifest } from '@vltpkg/package-info'
import pkg from './package.json' with { type: 'json' }

export async function reproduce (spec, opts={}) {

  opts = {
    cache: {},
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
    const sourceSpec = new Spec(`${manifest.name}@${source}`)
    execSync(`
      rm -rf ../cache/${sourceSpec.name} &&
      git clone https://github.com/${location}.git ../cache/${sourceSpec.name} &&
      cd ../cache/${sourceSpec.name} &&
      git checkout ${ref} && 
      npm install
    `, { stdio: 'pipe' })
    const result = execSync(`
      cd ../cache/${sourceSpec.name} &&
      npm pack --dry-run --json
    `, { stdio: 'pipe' })
    const packed = JSON.parse(result.toString())[0]
    const npmVersion = execSync(`npm --version`).toString().trim()
    const check = opts.cache[spec] = {
      reproduceVersion: pkg.version,
      timestamp: new Date(),
      os: process.platform,
      arch: process.arch,
      strategy: `npm:${npmVersion}`,
      reproduced: manifest.dist.integrity === packed.integrity,
      package: {
        spec,
        location: manifest.dist.tarball,
        integrity: manifest.dist.integrity,
      },
      source: {
        spec: source,
        location: repo.url,
        integrity: packed.integrity,
      }
    }
    return check

  } catch (e) {
    console.error(e)
    return false
  }

}
