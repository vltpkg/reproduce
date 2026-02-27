#!/usr/bin/env node

/**
 * Test runner for reproduce
 * 
 * This script runs all the tests for the reproduce package.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 Running reproduce tests...\n');

// Helper function to run a test file
async function runTest(testFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', ['tsx', '--test', '--no-warnings', testFile], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test failed with exit code ${code}`));
      }
    });
  });
}

// Run all tests
async function runAllTests(): Promise<void> {
  try {
    console.log('📋 Running tests...');
    await runTest(join(__dirname, 'test.ts'));
    console.log('✅ All tests passed!\n');
    console.log('🎉 Test suite completed successfully!');
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

runAllTests();