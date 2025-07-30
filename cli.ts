#!/usr/bin/env node

import pkg from './package.json' with { type: 'json' };
import { reproduce, ReproduceResult } from './index.js';
import ora from 'ora';
// @ts-ignore
import { minargs } from 'minargs';

const usage = `USAGE: 

  $ reproduce <package> [<options>]
  
OPTIONS:          DESCRIPTION:

-s, --strategy    Choose a strategy (default: "npm")
-f, --force       Ignore cached results
-j, --json        Output result as JSON

-v, --version     Print version information
-h, --help        Print usage information
`;
const opts = {
  alias: {
    s: 'strategy',
    j: 'json',
    h: 'help',
    v: 'version',
    f: 'force'
  }
};
const { positionals, args } = minargs(opts);

// Check if the version flag was passed
if (args.version) {
  console.log(pkg.version);
  process.exit(0);
}

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
  const spinner = ora({ text: 'Reproducing...', discardStdin: false }).start();
  const result = await reproduce(positionals[0], { 
    strategy: args?.strategy?.[0] || 'npm',
    force: !!args.force
  });
  spinner.clear();
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
