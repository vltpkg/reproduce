#!/usr/bin/env node

import { reproduce, ReproduceResult } from './index.js';
// @ts-ignore
import { minargs } from 'minargs';

const usage = `USAGE: 

  $ reproduce <package> [<options>]
  
OPTIONS:          DESCRIPTION:

-s, --strategy    Choose a strategy (default: "npm")
-j, --json        Output result as JSON
-f, --force       Force revalidation, bypass cache
-h, --help        Print usage information

`;
const opts = {
  alias: {
    s: 'strategy',
    j: 'json',
    f: 'force',
    h: 'help'
  }
};
const { positionals, args } = minargs(opts);

// Check if the help flag was passed
if (args.help) {
  printUsage();
  process.exit(0);
}

// Check if a positional argument was passed
if (positionals.length === 0) {
  printUsage();
  process.exit(1);
}

// Run the reproduce function
async function main() {
  const result = await reproduce(positionals[0], { 
    strategy: args?.strategy?.[0] || 'npm',
    force: !!args.force
  });
  
  if (result && args.json) {
    console.log(JSON.stringify(result, null, 2));
  }
  
  process.exit(result ? (result as ReproduceResult).reproduced ? 0 : 1 : 2);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(2);
});

// Print usage information
function printUsage(): void {
  console.log(usage);
}
