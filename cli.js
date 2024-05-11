#!/usr/bin/env node

import reproduce from './index.js'
import minargs from 'minargs'

const usage = {
  recursive: {
    multiple: true,
    short: 'r',
    usage: 'reproduce --recursive',
    description: 'Default: false - Define whether to recursively check all deps'
  },
}
const options = {
  positionalValues: true,
  alias: Object.keys(usage).filter(arg => usage[arg].short).reduce((o, k) => {
    o[usage[k].short] = k
    return o
  }, {})
}
const { args, values, positionals } = minargs({ options })
process.exit(reproduce(positionals[0]))
