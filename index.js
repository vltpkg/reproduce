import { execSync } from 'node:child_process'
import { Spec } from '@vltpkg/spec'
import { manifest as getManifest } from '@vltpkg/package-info'
import pkg from './package.json' with { type: 'json' }
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

// Get OS-specific cache directory
function getDefaultCacheDir() {
  switch (process.platform) {
    case 'darwin':
      return join(homedir(), 'Library', 'Caches', 'reproduce')
    case 'win32':
      return join(homedir(), 'AppData', 'Local', 'reproduce', 'Cache')
    default: // Linux and others follow XDG spec
      return join(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'reproduce')
  }
}

const DEFAULT_CACHE_DIR = getDefaultCacheDir()
const DEFAULT_CACHE_FILE = 'cache.json'
const EXEC_OPTIONS = { stdio: [] }
const STRATEGIES = {
  npm: {
    getVersion: () => execSync('npm --version', EXEC_OPTIONS).toString().trim(),
    install: (dir) => `cd ${dir} && npm install --no-audit --no-fund --silent >/dev/null`,
    pack: (dir) => ({
      command: `cd ${dir} && npm pack --dry-run --json`,
      parseResult: (output) => JSON.parse(output)[0]
    })
  }
}

export async function reproduce (spec, opts={}) {
  
  opts = {
    cache: {},
    cacheDir: DEFAULT_CACHE_DIR,
    cacheFile: DEFAULT_CACHE_FILE,
    strategy: 'npm',
    ...opts
  }

  let skipSetup = false

  if (!existsSync(opts.cacheDir)) {
    mkdirSync(opts.cacheDir, { recursive: true })
  }
  const cacheFilePath = join(opts.cacheDir, opts.cacheFile)
  opts.cache = Object.keys(opts.cache).length > 0 ? opts.cache : JSON.parse(readFileSync(cacheFilePath, 'utf8'))

  try {
    const info = new Spec(spec)
    if (!spec || !info || info.type != 'registry' || info.registry != 'https://registry.npmjs.org/') {
      return false
    }

    // Make cache spec-based by using the full spec as the key
    if (opts.cache.hasOwnProperty(spec)) {
      return opts.cache[spec]
    }

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
    let packed = {}
    
    const strategy = STRATEGIES[opts.strategy]
    const cacheDir = join(opts.cacheDir, sourceSpec.name)

    try {

      // Skip setup if the package is already cached or if the git repository is already cloned
      if (opts.cache.hasOwnProperty(sourceSpec) || existsSync(cacheDir)) {
        skipSetup = true
      }

      // Clone and install
      if (!skipSetup) {
        execSync(`
          rm -rf ${cacheDir} &&
          git clone https://github.com/${location}.git ${cacheDir} --depth 1 >/dev/null &&
          cd ${cacheDir} &&
          git checkout ${ref} >/dev/null
        `, EXEC_OPTIONS)

        // Install dependencies
        execSync(strategy.install(cacheDir), EXEC_OPTIONS)
      }

      // Pack and get integrity
      const packCommand = strategy.pack(cacheDir)
      const packResult = execSync(packCommand.command, EXEC_OPTIONS)
      packed = packCommand.parseResult(packResult.toString())
   
    } catch (e) {
      // swallow reproducibility errors
    }

    const check = opts.cache[spec] = {
      reproduceVersion: pkg.version,
      timestamp: new Date(),
      os: process.platform,
      arch: process.arch,
      strategy: `${opts.strategy}:${strategy.getVersion()}`,
      reproduced: packed?.integrity ? manifest.dist.integrity === packed.integrity : false,
      attested: !!manifest.dist?.attestations?.url,
      package: {
        spec,
        location: manifest.dist.tarball,
        integrity: manifest.dist.integrity,
      },
      source: {
        spec: source,
        location: repo.url,
        integrity: packed?.integrity || 'null',
      }
    }

    // Persist cache
    const cacheFilePath = join(opts.cacheDir, opts.cacheFile)
    writeFileSync(cacheFilePath, JSON.stringify(opts.cache, null, 2))
 
    return check

  } catch (e) {
    return opts.cache[spec] = false
  }
}
