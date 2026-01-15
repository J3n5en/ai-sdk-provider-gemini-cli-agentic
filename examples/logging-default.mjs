#!/usr/bin/env node

/**
 * Default Logging (Gemini CLI Agentic)
 *
 * Purpose: Show the default non-verbose logging mode.
 * Run: node examples/logging-default.mjs
 */

import { generateText } from 'ai';
import { geminiCli } from '../dist/index.js';

console.log('=== Default Logging Mode ===\n');
console.log('Expected behavior:');
console.log('- Only warn and error messages appear');
console.log('- Debug and info logs are suppressed');
console.log('- Clean output for production use\n');

// Default: verbose is false, so only warn/error logs appear
const model = geminiCli('auto', {
  approvalMode: 'auto_edit',
  // verbose: false is the default
});

try {
  const { text } = await generateText({
    model,
    prompt: 'Say hello in one word.',
  });

  console.log('Response:', text);
  console.log('\n✓ Only essential logs appeared (if any)');
  console.log('  Default mode keeps output clean');
} catch (error) {
  console.error('Failed:', error.message);
}
