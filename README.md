<img src="https://github.com/user-attachments/assets/e31faec6-a3b7-48d1-92a3-f88f0a5521f8" alt="reproducible logo" />

# `reproduce`

[![Test](https://github.com/vltpkg/reproduce/actions/workflows/test.yml/badge.svg)](https://github.com/vltpkg/reproduce/actions/workflows/test.yml)

Can we reproduce a package with the _"origin"_ information provided?

**[Features](#features)**
·
**[How It Works](#how-it-works)**
·
**[Configuration](#configuration)**
·
**[Strategies](#strategies)**
·
**[Usage](#usage)**
·
**[Insights](#insights)**
·
**[FAQs](#faqs)**

### Features

- ✅ determines whether or not a package can be reproduced from it's referenced repository metadata (ie. `repository`, `repository.type`, `repository.url`, `repository.directory` & `gitHead`)
- 🔍 validates `repository` information against `package.json` if the package referenced lives on a registry (will fallback to `package.json` inside the tarball if the package is not in a registry)
  - 🔀 mismatching `repository` information is considered [_"manifest confusion"_](https://blog.vlt.sh/blog/the-massive-hole-in-the-npm-ecosystem) & will return `false` for _"reproducibility"_
- 🗄️ provides persistent caching of results
- 🔄 currently only supports `npm` as a `"strategy"` but will expand to support other package managers in the future

#### How It Works

1. ⬇️ fetches the package & any corresponding metadata
2. 📂 if available, does a clone/checkout of the corresponding source `repository`
3. 🔄 attempts to prepare & pack the source repository using one or more [strategies](#strategies)
4. 🔍 validates the integrity value of `#3` against the package fetched in `#1`
5. 📄 returns results and caches them for future use

### Usage

```bash
$ npm i -g reproduce # install globally
$ reproduce axios
```

```bash
$ npx reproduce axios # execute with npx
```

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
reproduce tsc # exit code 0 - reproducible
```

```bash
reproduce esbuild # exit code 1 - not reproducible
```

```bash
reproduce axios --json  # exit code 1 - not reproducible
{
  "reproduceVersion": "0.0.1-pre.1",
  "timestamp": "2025-02-25T10:40:24.947Z",
  "os": "darwin",
  "arch": "arm64",
  "strategy": "npm:10.9.1",
  "reproduced": false,
  "package": {
    "spec": "axios@latest",
    "name": "axios",
    "version": "1.2.3",
    "location": "https://registry.npmjs.org/axios/-/axios-1.7.9.tgz",
    "integrity": "sha512-LhLcE7Hbiryz8oMDdDptSrWowmB4Bl6RCt6sIJKpRB4XtVf0iEgewX3au/pJqm+Py1kCASkb/FFKjxQaLtxJvw=="
  },
  "source": {
    "spec": "github:axios/axios#b2cb45d5a533a5465c99559b16987e4d5fc08cbc",
    "name": "axios",
    "version": "1.2.3",
    "location": "git+https://github.com/axios/axios.git",
    "integrity": "null"
  },
  "diff": "..."
}
```

```bash
reproduce require --json  # exit code 0 - reproducible
{
  "reproduceVersion": "0.0.1-pre.1",
  "timestamp": "2025-02-25T10:22:09.303Z",
  "os": "darwin",
  "arch": "arm64",
  "strategy": "npm:10.9.1",
  "reproduced": true,
  "package": {
    "spec": "sleepover@latest",
    "version": "1.2.3",
    "location": "https://registry.npmjs.org/sleepover/-/sleepover-1.2.3.tgz",
    "integrity": "sha512-yNAIVUqbQifyy5+hfzAzK2Zt21wXjwXqPyWLu+tOvhOcYKG2ffUiSoBXwt/yo4KJ51IcJfUS0Uq0ktOoMWy9Yw=="
  },
  "source": {
    "spec": "github:darcyclarke/sleepover#f2586e91b3faf085583c23ed6e00819916e85c28",
    "version": "1.2.3",
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

| Name | UUID |  Description |
| --- | --- |
| `npm` `npm:<version>` | clones, checks out ref, installs deps & then runs pack |

> Note: one-off/bespoke or complex configurations will not be supported but we will continue to add more strategies as we find common patterns.

### Insights

#### Top 5,000 High Impact Packages

> Note: "High Impact" packages are defined as having >=1M downloads per week and/or >=500 dependants. This list was originally generated [here](http://github.com/nodejs/package-maintenance/issues/569#issuecomment-1739532894). This test was run on 2025-02-26.

- **5.78%** (289) are **reproducible**
- **3.72%** (186) have **provenance**

<details>
<summary>List of reproducible packages</summary>
<pre>
semver
tslib
lru-cache
readable-stream
ansi-regex
commander
minimatch
yallist
glob
string-width
fs-extra
emoji-regex
which
execa
ws
minipass
cross-spawn
micromatch
whatwg-url
tr46
mime
path-type
loader-utils
write-file-atomic
callsites
ini
binary-extensions
is-binary-path
pump
read-pkg
normalize-package-data
open
json-parse-even-better-errors
cli-cursor
yocto-queue
restore-cursor
terser
fastq
sax
ip
log-symbols
reusify
ssri
nopt
normalize-url
@eslint/eslintrc
@humanwhocodes/config-array
mdn-data
mute-stream
import-local
gauge
spdx-license-ids
test-exclude
regjsparser
spdx-exceptions
is-unicode-supported
is-ci
url
source-map-js
regenerate-unicode-properties
minizlib
unicode-match-property-value-ecmascript
data-urls
html-encoding-sniffer
whatwg-mimetype
cli-spinners
xml-name-validator
abbrev
type
unicode-canonical-property-names-ecmascript
unique-slug
unique-filename
w3c-xmlserializer
dot-prop
camelcase-keys
@sindresorhus/is
foreground-child
@npmcli/fs
stream-shift
log-update
make-fetch-happen
boxen
del
tar-fs
@hapi/hoek
p-retry
has-ansi
minipass-fetch
cli-boxes
agentkeepalive
sort-keys
safe-stable-stringify
node-gyp-build
npm-normalize-package-bin
builtins
aws-sdk
elliptic
npm-package-arg
validate-npm-package-name
es5-ext
es6-symbol
strnum
path-scurry
registry-auth-token
crypto-browserify
d
html-tags
moment-timezone
npm-bundled
ignore-walk
npm-packlist
devtools-protocol
get-port
package-json
p-defer
p-event
latest-version
default-browser-id
npm-registry-fetch
compress-commons
zip-stream
lcid
filter-obj
npm-pick-manifest
pacote
read
require-in-the-middle
npm-install-checks
throttleit
@npmcli/run-script
touch
read-package-json-fast
@npmcli/promise-spawn
@npmcli/node-gyp
@npmcli/git
prebuild-install
store2
@npmcli/installed-package-contents
proc-log
postgres-interval
xregexp
webpack-hot-middleware
is-what
copy-anything
set-cookie-parser
p-filter
fast-redact
known-css-properties
remark-slug
is-builtin-module
remark-external-links
is-text-path
text-extensions
memoizee
timers-ext
spawn-command
find-versions
debounce
xmlhttprequest-ssl
pino-abstract-transport
run-applescript
use-callback-ref
use-sidecar
estree-to-babel
default-browser
bundle-name
pretty-ms
postcss-normalize
cli-color
macos-release
windows-release
remark-footnotes
import-in-the-middle
read-cmd-shim
cpy
write-json-file
cron-parser
find-babel-config
lru-memoizer
unzipper
winston-daily-rotate-file
obliterator
csv-parser
mnemonist
set-immediate-shim
through2-filter
init-package-json
winston-logzio
@npmcli/package-json
promzard
s3-streamlogger
bin-links
@npmcli/map-workspaces
@npmcli/name-from-folder
walk-up-path
ast-module-types
union
why-is-node-running
@npmcli/metavuln-calculator
hot-shots
parse-conflict-json
oidc-token-hash
prom-client
marked-terminal
promise-call-limit
node-source-walk
libmime
logzio-nodejs
postcss-sorting
@zeit/schemas
ethereum-cryptography
parse-github-url
light-my-request
detective-stylus
n
comment-json
detective-typescript
@lezer/common
@lezer/lr
precinct
redux-mock-store
detective-postcss
twilio
log
tocbot
@hapi/podium
detective-es6
get-amd-module-type
detective-sass
detective-scss
detective-cjs
generate-object-property
sprintf-kit
highcharts
graphql-subscriptions
@tailwindcss/forms
jspdf
chance
eslint-plugin-react-native
</pre>
</details>

### FAQs

#### Why look into "reproducibility"?

We believe the strategy of leveraging reproducible builds for the purpose of associating artifacts with a source/repository outperforms the current provenance strategy with the added benefit of being backwards compatible.

#### Will reproducibility get better with time?

Yes. As we add more strategies, we should see the percentatge of reproducible packages grow over time both net-new & previously published packages will benefit from the additional strategies. Feel free to contribute!

### Credits

Big thanks to [@siddharthkp](https://github.com/siddharthkp) for gifting the package name `reproduce` to us!

### Learn More

We wrote a blog post about this project & the results we found which you can read here: https://blog.vlt.sh/blog/reproducibility

<a href="https://blog.vlt.sh/blog/reproducibility"><img src="https://github.com/user-attachments/assets/65cb6e3f-8673-49ba-9e5c-94e80925690f" alt="Is your package reproducible?" /></a>
