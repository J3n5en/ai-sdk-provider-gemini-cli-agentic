#!/usr/bin/env node

/**
 * Check Gemini CLI Installation
 *
 * Purpose: Verify Gemini CLI binary and authentication status.
 * Run: node examples/check-cli.mjs
 */

import { spawnSync } from 'node:child_process';

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8' });
  return { code: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

console.log('🔍 Checking Gemini CLI install...');
let result = run('gemini', ['--version']);

if (result.code === 0) {
  console.log('✔️  Gemini CLI OK');
  process.stdout.write(result.stdout);
} else {
  console.error('❌ Gemini CLI not available.');
  console.error('   Install with: npm i -g @google/gemini-cli');
  console.error('   Or use npx: npx @google/gemini-cli');
  process.exit(1);
}

console.log('\n🔐 Checking auth status...');
console.log('   Run `gemini` once to authenticate via OAuth if needed.');

// Test a simple prompt to verify auth
console.log('\n🧪 Testing with a simple prompt...');
const test = run('gemini', ['--output-format', 'stream-json', 'Say hello']);

if (test.code === 0) {
  console.log('✔️  Authentication OK - Gemini CLI is ready to use!');
} else {
  console.error('⚠️  Authentication may be needed.');
  console.error('   Run `gemini` interactively to authenticate.');
  if (test.stderr) {
    console.error('   Error:', test.stderr.slice(0, 200));
  }
}
