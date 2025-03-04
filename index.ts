import { execSync } from 'node:child_process';
import { Spec } from '@vltpkg/spec';
import { manifest as getManifest } from '@vltpkg/package-info';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

interface PackageManifest {
  name: string
  version: string
  repository?: {
    url: string
    type?: string
    directory?: string
  }
  gitHead?: string
  dist: {
    tarball: string
    integrity: string
    attestations?: {
      url: string
    }
  }
}

interface PackedResult {
  integrity?: string
  [key: string]: any
}

interface Strategy {
  getVersion: () => string
  install: (dir: string) => string
  pack: (dir: string) => {
    command: string
    parseResult: (output: string) => PackedResult
  }
}

export interface ReproduceOptions {
  cache?: Record<string, any>
  cacheDir?: string
  cacheFile?: string
  strategy?: 'npm'
}

export interface ReproduceResult {
  reproduceVersion: string
  timestamp: Date
  os: string
  arch: string
  strategy: string
  reproduced: boolean
  attested: boolean
  package: {
    name: string
    version: string
    spec: string
    location: string
    integrity: string
  }
  source: {
    spec: string
    location: string
    integrity: string
  }
  diff?: string
}

// Parse a URL to get the name and version of the package
function parseURL(url: string): { name: string; version: string } {
  // Split the URL by "/"
  const parts = url.split('/');

  // Find the tarball filename (last part of the URL)
  const tarball = parts[parts.length - 1];

  // Ensure it ends with `.tgz`
  if (!tarball.endsWith('.tgz')) {
    throw new Error('Invalid npm tarball URL');
  }

  // Remove the `.tgz` extension
  const baseName = tarball.slice(0, -4);

  // Find the last `-` to split the name and version
  const lastDashIndex = baseName.lastIndexOf('-');
  if (lastDashIndex === -1) {
    throw new Error('Invalid tarball filename structure');
  }

  const namePart = baseName.slice(0, lastDashIndex);
  const version = baseName.slice(lastDashIndex + 1);

  // Determine if it's a scoped package
  let name = namePart;
  const scopeIndex = parts.indexOf('-');
  if (scopeIndex > 0 && parts[scopeIndex - 1].startsWith('@')) {
    name = `${parts[scopeIndex - 1]}/${namePart}`;
  }

  return { name, version };
}

// Get OS-specific cache directory
function getDefaultCacheDir(): string {
  switch (process.platform) {
  case 'darwin':
    return join(homedir(), 'Library', 'Caches', 'reproduce');
  case 'win32':
    return join(homedir(), 'AppData', 'Local', 'reproduce', 'Cache');
  default: // Linux and others follow XDG spec
    return join(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'reproduce');
  }
}

const DEFAULT_CACHE_DIR = getDefaultCacheDir();
const DEFAULT_CACHE_FILE = 'cache.json';
const EXEC_OPTIONS = { stdio: [] };
const STRATEGIES: Record<string, Strategy> = {
  npm: {
    getVersion: () => execSync('npm --version', EXEC_OPTIONS).toString().trim(),
    install: (dir: string) => `cd ${dir} && npm install --no-audit --no-fund --silent >/dev/null`,
    pack: (dir: string) => ({
      command: `
        cd ${dir} && 
        npm pack --dry-run --json`,
      parseResult: (output: string) => JSON.parse(output)[0]
    })
  }
};

export async function reproduce(spec: string, opts: ReproduceOptions = {}): Promise<ReproduceResult | false> {
  
  opts = {
    cache: {},
    cacheDir: DEFAULT_CACHE_DIR,
    cacheFile: DEFAULT_CACHE_FILE,
    strategy: 'npm',
    ...opts
  };

  if (!opts.strategy || !STRATEGIES[opts.strategy]) {
    throw new Error(`Invalid strategy: ${opts.strategy}`);
  }

  let skipSetup = false;

  const cacheFilePath = join(opts.cacheDir!, opts.cacheFile!);
  if (!existsSync(cacheFilePath)) {
    mkdirSync(opts.cacheDir!, { recursive: true });
    writeFileSync(cacheFilePath, JSON.stringify(opts.cache));
  }
  opts.cache = Object.keys(opts.cache!).length > 0 ? opts.cache : JSON.parse(readFileSync(cacheFilePath, 'utf8'));

  try {
    const info = new Spec(spec);
    if (!spec || !info || info.type != 'registry' || info.registry != 'https://registry.npmjs.org/') {
      return false;
    }

    // Make cache spec-based by using the full spec as the key
    if (opts.cache && opts.cache.hasOwnProperty(spec)) {
      // If the package name was never set, parse the URL and set it & version (useful for old caches)
      const cacheEntry = opts.cache[spec];
      if (cacheEntry?.package && !cacheEntry.package.name) {
        const { name, version } = parseURL(cacheEntry.package.location);
        cacheEntry.package.name = name;
        cacheEntry.package.version = version;
      }
      return cacheEntry;
    }

    const manifest = await getManifest(spec) as unknown as PackageManifest;
    if (!manifest || !manifest?.repository?.url) {
      return false;
    }

    const repo = manifest.repository!;
    const url = repo.url;
    const parsed = new URL(url);
    const location = parsed.pathname.replace('.git', '').split('/').slice(1, 3).join('/');
    const path = repo.directory ? `::path:${repo.directory}` : '';
    const explicitRef = url.indexOf('#') > 0 ? url.substring(0, url.indexOf('#')) : '';
    const implicitRef = manifest.gitHead || 'HEAD';
    const ref = explicitRef || implicitRef || '';
    const host = parsed.host;

    if (host !== 'github.com') {
      return false;
    }

    const source = `github:${location}#${ref}${path}`;
    const sourceSpec = new Spec(`${manifest.name}@${source}`);
    let packed: PackedResult = {};
    
    const strategy = STRATEGIES[opts.strategy!];
    const cacheDir = join(opts.cacheDir!, sourceSpec.name);

    try {
      // Skip setup if the package is already cached or if the git repository is already cloned
      if (opts.cache!.hasOwnProperty(sourceSpec.toString()) || existsSync(cacheDir)) {
        skipSetup = true;
      }

      // Clone and install
      if (!skipSetup) {
        execSync(`
          rm -rf ${cacheDir} &&
          git clone https://github.com/${location}.git ${cacheDir} --depth 1 >/dev/null &&
          cd ${cacheDir} &&
          git checkout ${ref} >/dev/null
        `, EXEC_OPTIONS);

        // Install dependencies
        execSync(strategy.install(cacheDir), EXEC_OPTIONS);
      }

      // Pack and get integrity
      const packCommand = strategy.pack(cacheDir);
      const packResult = execSync(packCommand.command, EXEC_OPTIONS);
      packed = packCommand.parseResult(packResult.toString());
   
    } catch (e) {
      // swallow reproducibility errors
    }

    const check: ReproduceResult = opts.cache![spec] = {
      reproduceVersion: pkg.version,
      timestamp: new Date(),
      os: process.platform,
      arch: process.arch,
      strategy: `${opts.strategy}:${strategy.getVersion()}`,
      reproduced: packed?.integrity ? manifest.dist.integrity === packed.integrity : false,
      attested: !!manifest.dist?.attestations?.url,
      package: {
        spec,
        name: manifest.name,
        version: manifest.version,
        location: manifest.dist.tarball,
        integrity: manifest.dist.integrity,
      },
      source: {
        spec: source,
        location: repo.url,
        integrity: packed?.integrity || 'null',
      }
    };

    // Persist cache
    writeFileSync(cacheFilePath, JSON.stringify(opts.cache, null, 2));
 
    return check;

  } catch (e) {
    return opts.cache![spec] = false;
  }
} 