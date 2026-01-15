#!/usr/bin/env node

/**
 * Long Running Tasks (Gemini CLI Agentic)
 *
 * Purpose: Show how to abort long operations cleanly.
 * Run: node examples/long-running-tasks.mjs
 */

import { generateText } from 'ai';
import { geminiCli } from '../dist/index.js';

const model = geminiCli('auto', {
  approvalMode: 'auto_edit',
});

console.log('=== Abort Controller Demo ===\n');

// Create an abort controller with a timeout
const controller = new AbortController();
const timeoutMs = 5000; // 5 seconds

console.log(`Starting request with ${timeoutMs}ms timeout...`);

// Set up timeout
const timeoutId = setTimeout(() => {
  console.log('\n⏱️  Timeout reached, aborting...');
  controller.abort();
}, timeoutMs);

try {
  const { text } = await generateText({
    model,
    prompt: 'Write a very long essay about the history of computing.',
    abortSignal: controller.signal,
  });

  clearTimeout(timeoutId);
  console.log('Response:', text.slice(0, 200) + '...');
} catch (error) {
  clearTimeout(timeoutId);

  if (error.name === 'AbortError' || controller.signal.aborted) {
    console.log('✓ Request was successfully aborted');
  } else {
    console.error('Error:', error.message);
  }
}

console.log('\n💡 Tips:');
console.log('- Use AbortController for user-cancellable operations');
console.log('- Set reasonable timeouts for production use');
console.log('- The CLI process is killed when aborted');
