#!/usr/bin/env node

import { reproduce } from './index.js'
import { minargs } from 'minargs'
const { positionals } = minargs()

process.exit(await reproduce(positionals[0]) ? 0 : 1)
