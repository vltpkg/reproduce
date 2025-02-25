![reproduce](https://github.com/user-attachments/assets/cf9f4d5d-b78e-4fda-94d3-34a9271f012e)

# `reproduce`

Can we reproduce a package with the _"origin"_ information provided?

**[Features](#features)**
·
**[How It Works](#how-it-works)**
·
**[Configuration](#configuration)**
·
**[Strategies](#strategies)**
·
**[Examples](#examples)**
·
**[Insights](#insights)**
·
**[Why?](#why-look-into-reproducibility)**

### Features

- determines whether or not a package can be reproduced from it's referenced repository metadata (ie. `repository`, `repository.type`, `repository.url`, `repository.directory` & `gitHead`)
- validates `repository` information against `package.json` if the package referenced lives on a registry (will fallback to `package.json` inside the tarball if the package is not in a registry)
  - mismatching `repository` information is considered [_"manifest confusion"_](https://blog.vlt.sh/blog/the-massive-hole-in-the-npm-ecosystem) & will return `false` for _"reproducibility"_
- runs the preparing/packing in an isolated container
- provides persistent caching of results
- currently only supports `npm` as a `"strategy"` but will expand to support other package managers in the future

### How It Works

1. fetches the package & any corresponding metadata
2. if available, does a clone/checkout of the corresponding source `repository`
3. attempts to prepare & pack the source repository using one or more [strategies](#strategies)
4. validates the integrity value of `#3` against the package fetched in `#1`
5. returns results and caches them for future use


### Usage

```js
import reproduce from 'reproduce'

// Basic usage
const result = await reproduce('package-name')

// With custom configuration
const result = await reproduce('package-name', {
  cache: {},
  cacheDir: './custom-cache',
  cacheFile: 'custom-cache.json'
})
```


#### CLI

```bash
npx reproduce tsc # exit code 0 - reproducible
```

```bash
npx reproduce esbuild # exit code 1 - not reproducible
```

```bash
npx reproduce axios --json  # exit code 1 - not reproducible
{
  "reproduceVersion": "0.0.1-pre.1",
  "timestamp": "2025-02-25T10:40:24.947Z",
  "os": "darwin",
  "arch": "arm64",
  "strategy": "npm:10.9.1",
  "reproduced": false,
  "package": {
    "spec": "axios",
    "location": "https://registry.npmjs.org/axios/-/axios-1.7.9.tgz",
    "integrity": "sha512-LhLcE7Hbiryz8oMDdDptSrWowmB4Bl6RCt6sIJKpRB4XtVf0iEgewX3au/pJqm+Py1kCASkb/FFKjxQaLtxJvw=="
  },
  "source": {
    "spec": "github:axios/axios#b2cb45d5a533a5465c99559b16987e4d5fc08cbc",
    "location": "git+https://github.com/axios/axios.git",
    "integrity": "null"
  }
}
```

```bash
npx reproduce require --json  # exit code 0 - reproducible
{
  "reproduceVersion": "0.0.1-pre.1",
  "timestamp": "2025-02-25T10:22:09.303Z",
  "os": "darwin",
  "arch": "arm64",
  "strategy": "npm:10.9.1",
  "reproduced": true,
  "package": {
    "spec": "sleepover",
    "location": "https://registry.npmjs.org/sleepover/-/sleepover-1.2.3.tgz",
    "integrity": "sha512-yNAIVUqbQifyy5+hfzAzK2Zt21wXjwXqPyWLu+tOvhOcYKG2ffUiSoBXwt/yo4KJ51IcJfUS0Uq0ktOoMWy9Yw=="
  },
  "source": {
    "spec": "github:darcyclarke/sleepover#f2586e91b3faf085583c23ed6e00819916e85c28",
    "location": "git+ssh://git@github.com/darcyclarke/sleepover.git",
    "integrity": "sha512-yNAIVUqbQifyy5+hfzAzK2Zt21wXjwXqPyWLu+tOvhOcYKG2ffUiSoBXwt/yo4KJ51IcJfUS0Uq0ktOoMWy9Yw=="
  }
}
```

### Configuration

The `reproduce` function accepts an options object with the following configuration:

```js
{
  cache: {},                      // Optional in-memory cache object (persisted to disk if provided)
  cacheDir: '~/.cache/reproduce', // OS-specific cache directory
  cacheFile: 'cache.json',        // Cache file name
  strategy: 'npm'                 // Strategy to use
}
```

#### Cache Locations

The cache is stored in OS-specific locations:
- macOS: `~/Library/Caches/reproduce/`
- Windows: `%LOCALAPPDATA%/reproduce/Cache/`
- Linux: `$XDG_CACHE_HOME/reproduce/` or `~/.cache/reproduce/`

### Strategies

A strategy is a set of operations to take to recreate a package. Strategies should represent common patterns for preparing/building/packing packages to cast wide nets. If a set successfully recreates a package then its ID will be stored inside the returned metadata.

| UUID |  Notes |
| --- | --- |
| `npm:<version>` | clones, checks out ref, installs deps, runs prepare scripts & packs |

> Note: one-off/bespoke or complex configurations will not be supported but we will continue to add more strategies as we find common patterns.

### Insights

#### 7,000+ High Impact Packages

> Note: "High Impact" packages are defined as having >=1M downloads per week and/or >=500 dependants. This list was originally generated [here](http://github.com/nodejs/package-maintenance/issues/569#issuecomment-1739532894).

- **xx%** (xxxx) **are** reproducible
- **xx%** (xxxx) do not define a `gitHead`, git tag, git sha or any other explicit reference to the repository's state
  - ie. they are pointing to the latest repository version, likely breaking reproducibility when changes are pushed
- **xx%** (xxxx) have **manifest confusion** & their `repository` manifest information is mismatched with `package.json`

### FAQs

#### Why look into "reproducibility"?

Generally, "reproducible builds" has been a hot topic in the supply chain security world but little has been done to actually achieve this by the major incumbents.

#### Why open source `reproduce`?

We think it's important that the ecoasystem can help contribute to & improve the semantics of reproducible packages in the JavaScript ecosystem. As we add more strategies, we should see the percentatge of reproducible packages grow over time. Feel free to contribute!

### Credits

Big thanks to [@siddharthkp](https://github.com/siddharthkp) for gifting the package name `reproduce` to us!

### Learn More

We wrote a blog post about this project & the results we found which you can read here: https://blog.vlt.sh/blog/reproducibility

<a href="https://blog-git-darcyclarke-reproduce-vlt.vercel.app/blog/reproducibility"><img src="https://github.com/user-attachments/assets/65cb6e3f-8673-49ba-9e5c-94e80925690f" alt="Is your package reproducible?" /></a>
