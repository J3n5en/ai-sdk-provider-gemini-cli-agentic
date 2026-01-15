#!/usr/bin/env node

/**
 * Disabled Logging (Gemini CLI Agentic)
 *
 * Purpose: Completely disable all provider logging.
 * Run: node examples/logging-disabled.mjs
 */

import { generateText } from 'ai';
import { geminiCli } from '../dist/index.js';

console.log('=== Disabled Logging Mode ===\n');
console.log('Expected behavior:');
console.log('- No provider logs at all');
console.log('- Only your application output appears\n');

const model = geminiCli('auto', {
  approvalMode: 'auto_edit',
  logger: false, // Completely disable logging
});

try {
  const { text } = await generateText({
    model,
    prompt: 'Say hello in one word.',
  });

  console.log('Response:', text);
  console.log('\n✓ No provider logs appeared above');
  console.log('  (Only this application output is visible)');
} catch (error) {
  console.error('Failed:', error.message);
}

console.log('\n⚠️  Warning: With logging disabled, you won\'t see');
console.log('   any warnings or errors from the provider!');
