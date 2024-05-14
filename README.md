# reproduce

Can we reproduce a package with the _"origin"_ information provided...

### Features

- determines whether or not a package can be reproduced from it's referenced repository metadata (ie. `repository`, `repository.type`, `repositoru.url`, `repository.directory` & `gitHead`)
- validates `repository` information against `package.json` if the package referenced lives on a registry (will fallback to `package.json` inside the tarball if the package is not in a registry)
  - mismatching `repository` information is considered [_"manifest confusion"_](https://blog.vlt.sh/blog/the-massive-hole-in-the-npm-ecosystem) & will return `false` for _"reproducibility"_
- runs the preparing/packing in an isolated container

### How it works

1. fetches the package & any corresponding metadata
2. if available, does a clone/checkout of the corresponding source `repository`
3. attempts to prepare & pack the source repository in a container using one or more [strategies](#stategies)
4. validates the integrity value of `#3` against the package fetched in `#1`
5. returns results

### Strategies

A strategy is a set of operations to take to recreate a package. Strategies should represent common patterns for preparing/building/packing packages to cast wide nets. If a set successfully recreates a package then its ID will be stored inside the returned metadata. These strastegies are sequentially checked until one works.

> Warning: currently, only linux envs are supported
> Note: one-off/bespoke or complex configurations will not be supported

| Order ID |  UUID | Command | Notes |
| :-: | --- | --- | --- |
| 1 | `npm:<version>:root` | `cd ./ && npx npm@<version> pack` | `npm` defaults to `latest` |
| 2 | `npm:<version>:path` |  `cd ./<directory>/ && npx npm@<verion> pack` | when `repository.directory` is defined we `cd` there |

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
  "lodash@1.2.3": {
    "passed": false,
    "error": [ ... ]
  }
}
```

```bash
npx reproduce require --json
{
  "require@0.9.1": {
    "passed": "npm:10.9.1:root"
  }
}
```

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
