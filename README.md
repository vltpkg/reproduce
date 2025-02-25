![reproduce](https://github.com/user-attachments/assets/cf9f4d5d-b78e-4fda-94d3-34a9271f012e)

# `reproduce`

Can we reproduce a package with the _"origin"_ information provided?

**[Features](#features)**
·
**[How It Works](#how-it-works)**
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

### How It Works

1. fetches the package & any corresponding metadata
2. if available, does a clone/checkout of the corresponding source `repository`
3. attempts to prepare & pack the source repository using one or more [strategies](#stategies)
4. validates the integrity value of `#3` against the package fetched in `#1`
5. returns results

### Strategies

A strategy is a set of operations to take to recreate a package. Strategies should represent common patterns for preparing/building/packing packages to cast wide nets. If a set successfully recreates a package then its ID will be stored inside the returned metadata. These strastegies are sequentially checked until one works.

| Order ID |  UUID |  Notes |
| :-: | --- | --- |
| 1 | `npm:<version>` | clones, checks out ref, installs deps, runs prepare scripts & packs |

> Note: one-off/bespoke or complex configurations will not be supported but we will continue to add more strategies as we find common patterns.

### Examples

```js
import reproduce from 'reproduce'

```

#### CLI

```bash
npx reproduce tsc # exit code 0
```

```bash
npx reproduce esbuild # exit code 1
```

```bash
npx reproduce esbuild -r # exit code 0 since a transitive dependency failed to reproduce
```

```bash
npx reproduce lodash --json
{
  reproduceVersion: "0.0.1-pre.1",
  timestamp: 2025-02-25T08:20:33.754Z,
  os: "darwin",
  arch: "arm64",
  strategy: "npm:pacote:21.0.0",
  reproduced: false,
  package: {
    spec: "lodash",
    location: "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
    integrity: "sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg=="
  },
  source: {
    spec: "github:lodash/lodash#c6e281b878b315c7a10d90f9c2af4cdb112d9625",
    location: "git+https://github.com/lodash/lodash.git",
    integrity: "sha512-Y6SfdAURtIZz68COx/AWD2mfSbKCcz6FeFw4SH1xFsmJL1V3MqXEhKEnqU8xO59WfFxa2/V9F6wS7voBVF8ACg=="
  }
}
```

```bash
npx reproduce require --json
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

![Is your package reproducible?](https://github.com/user-attachments/assets/65cb6e3f-8673-49ba-9e5c-94e80925690f)

### Insights

#### Of the top 10,000 most downloaded packages on `registry.npmjs.org`...

> Last ran: June 26th, 2024

- **xx%** (xxxx) **are** reproducible
- **xx%** (xxxx) do not define a `gitHead`, git tag, git sha or any other explicit reference to the repository's state
  - ie. they are pointing to the latest repository version, likely breaking reproducibility when changes are pushed
- **xx%** (xxxx) have **manifest confusion** & their `repository` manifest information is mismatched with `package.json`
- 


### Why look into _"reproducibility"_?

Generally, "reproducible builds" has been a hot topic in the supply chain security world for awhile but little has been done to actually achieve this by the major incumbents.

1. **Capability** - it's important that we continue to strive at bubbling up net-new insights about the package ecosystems & this was low-hanging fruit which felt like the perfect proving ground for our new platform `vlt`
2. **Security** - understanding whether or not you are able to reproduce a package from it's source referenced is arguably more important then either whom authored the code or its origins. Without even controlling the origin of either the package or the source we are able to - at any point in time - validate that one can create the other.
3. **Performance** - this was a test of an ecosystem-wide analysis & put `vlt`'s code & infrastructure to the test

### Why open source `reproduce`?

We think it's important that the ecoasystem can help contribute to & improve the semantics of reproducible packages in the JavaScript ecosystem. As we add more strategies, we should see the percentatge of reproducible packages grow over time.

### Credits

Big thanks to [@siddharthkp](https://github.com/siddharthkp) for gifting the package name `reproduce` to us as well as our friends at [Socket.dev](https://socket.dev/) for their initial review & feedback on the the code.