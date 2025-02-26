#!/usr/bin/env node

import { reproduce } from './index.js'
import { minargs } from 'minargs'
const { positionals, args } = minargs()

const result = await reproduce(positionals[0])
if (result && args.json) {
  console.log(JSON.stringify(result, null, 2))
}
process.exit(result ? result.reproduced ? 0 : 1 : 2)
