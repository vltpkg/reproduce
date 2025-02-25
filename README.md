<img alt="reproduce logo" src="https://private-user-images.githubusercontent.com/65996263/414899900-cf9f4d5d-b78e-4fda-94d3-34a9271f012e.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDAzMjg0NzQsIm5iZiI6MTc0MDMyODE3NCwicGF0aCI6Ii82NTk5NjI2My80MTQ4OTk5MDAtY2Y5ZjRkNWQtYjc4ZS00ZmRhLTk0ZDMtMzRhOTI3MWYwMTJlLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTAyMjMlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUwMjIzVDE2MjkzNFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTRlN2Y0NmI0N2YwZjZiZTNlZjk1NjJhMTFiYTkxZTUwZWNiMzE4Y2QyNDAxNTFkYTMyMzk3Mzg4MmRhOTRhOGMmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.XhIC-BG3wFKiG1NJwSvdpbEARtS2LihWF_7Oy1DRm84" />

## TODO:
- [ ] make sure `vlt` repository information is accurate
//
// TODO:
//
// 0. add the release workspaces script to run alongside the client's publish workflow
//
// 1. refactor (typescript + use vlt libraries)
//  1.1. run on all our own packages (ie. workspaces)
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
3. attempts to prepare & pack the source repository in a container using one or more [strategies](#stategies)
4. validates the integrity value of `#3` against the package fetched in `#1`
5. returns results

### Strategies

A strategy is a set of operations to take to recreate a package. Strategies should represent common patterns for preparing/building/packing packages to cast wide nets. If a set successfully recreates a package then its ID will be stored inside the returned metadata. These strastegies are sequentially checked until one works.

| Order ID |  UUID | Equivalent Commands | Notes |
| :-: | --- | --- | --- |
| 1 | `npm:pacote:<version>` | `<version>` defaults to `latest` - `"pacote"` is `npm`'s internal utility for downloading, packing & unpacking packages |

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