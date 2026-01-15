#!/usr/bin/env node

/**
 * Verbose Logging (Gemini CLI Agentic)
 *
 * Purpose: Enable detailed execution logs for troubleshooting.
 * Run: node examples/logging-verbose.mjs
 */

import { streamText } from 'ai';
import { geminiCli } from '../dist/index.js';

console.log('=== Verbose Logging Mode ===\n');
console.log('Expected behavior:');
console.log('- Debug logs showing internal details');
console.log('- Info logs about execution flow');
console.log('- Full visibility into what the provider is doing\n');

try {
  const result = streamText({
    model: geminiCli('auto', {
      approvalMode: 'auto_edit',
      verbose: true, // Enable verbose logging
    }),
    prompt: 'Say hello in 5 words',
  });

  console.log('\nResponse:');
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
  console.log('\n');

  const usage = await result.usage;
  console.log('Token usage:', usage);

  console.log('\n✓ Notice: Debug and info logs appeared above');
  console.log('  Verbose mode provides detailed execution information');
} catch (error) {
  console.error('Error:', error);
  console.log('\n💡 Troubleshooting:');
  console.log('1. Run `gemini` once to authenticate');
  console.log('2. Run check-cli.mjs to verify setup');
}
