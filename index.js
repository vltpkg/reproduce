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
    install: (dir) => `cd ${dir} && npm install`,
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

  // Validate package manager
  if (!STRATEGIES[opts.strategy]) {
    throw new Error(`Unsupported package manager: ${opts.strategy}`)
  }

  // Ensure cache directory exists
  mkdirSync(opts.cacheDir, { recursive: true })
  const cacheFilePath = join(opts.cacheDir, opts.cacheFile)
  if (existsSync(cacheFilePath)) {
    try {
      opts.cache = JSON.parse(readFileSync(cacheFilePath, 'utf8'))
    } catch (e) {
      console.warn('Failed to load cache file:', e)
    }
  }

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
      // Clone and install
      execSync(`
        rm -rf ${cacheDir} &&
        git clone https://github.com/${location}.git ${cacheDir} &&
        cd ${cacheDir} &&
        git checkout ${ref}
      `, EXEC_OPTIONS)

      // Apply any package manager specific config
      if (opts.packageManagerConfig) {
        const configPath = join(cacheDir, `.${opts.packageManager}rc`)
        writeFileSync(configPath, JSON.stringify(opts.packageManagerConfig, null, 2))
      }

      // Install dependencies
      execSync(strategy.install(cacheDir), EXEC_OPTIONS)

      // Pack and get integrity
      const packCommand = strategy.pack(cacheDir)
      const packResult = execSync(packCommand.command, EXEC_OPTIONS)
      packed = packCommand.parseResult(packResult.toString())
    } catch (e) {
      console.error('Failed to reproduce package:', e)
    }

    const check = opts.cache[spec] = {
      reproduceVersion: pkg.version,
      timestamp: new Date(),
      os: process.platform,
      arch: process.arch,
      strategy: `${opts.strategy}:${strategy.getVersion()}`,
      reproduced: packed?.integrity ? manifest.dist.integrity === packed.integrity : false,
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

    const cacheFilePath = join(opts.cacheDir, opts.cacheFile)
    writeFileSync(cacheFilePath, JSON.stringify(opts.cache, null, 2))
 
    return check

  } catch (e) {
    return opts.cache[spec] = false
  }
}
