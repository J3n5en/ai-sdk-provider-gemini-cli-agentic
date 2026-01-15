#!/usr/bin/env node

/**
 * Custom Logger (Gemini CLI Agentic)
 *
 * Purpose: Integrate with external logging systems.
 * Run: node examples/logging-custom-logger.mjs
 */

import { generateText } from 'ai';
import { geminiCli } from '../dist/index.js';

// Custom logger that adds timestamps and prefixes
const customLogger = {
  debug: (msg) => console.log(`[DEBUG ${new Date().toISOString()}] 🔍 ${msg}`),
  info: (msg) => console.log(`[INFO  ${new Date().toISOString()}] ℹ️  ${msg}`),
  warn: (msg) => console.warn(`[WARN  ${new Date().toISOString()}] ⚠️  ${msg}`),
  error: (msg) => console.error(`[ERROR ${new Date().toISOString()}] ❌ ${msg}`),
};

console.log('=== Custom Logger Demo ===\n');

const model = geminiCli('auto', {
  approvalMode: 'auto_edit',
  verbose: true, // Enable all log levels
  logger: customLogger,
});

try {
  const { text } = await generateText({
    model,
    prompt: 'Say hello briefly.',
  });

  console.log('\nResponse:', text);
  console.log('\n✓ Custom logger captured all provider logs');
} catch (error) {
  console.error('Failed:', error.message);
}
