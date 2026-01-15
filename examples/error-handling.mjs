#!/usr/bin/env node

/**
 * Error Handling (Gemini CLI Agentic)
 *
 * Purpose: Handle auth and general failures gracefully.
 * Run: node examples/error-handling.mjs
 */

import { generateText } from 'ai';
import { geminiCli, isAuthenticationError } from '../dist/index.js';

console.log('=== Error Handling Demo ===\n');

// Test with a valid model
async function testValidRequest() {
  console.log('1. Testing valid request...');
  try {
    const model = geminiCli('auto', {
      approvalMode: 'auto_edit',
    });

    const { text, warnings } = await generateText({
      model,
      prompt: 'Say hello.',
      // These are not supported by Gemini CLI
      temperature: 0.7,
      topP: 0.9,
    });

    console.log('   ✓ Response:', text.slice(0, 50));

    if (warnings && warnings.length > 0) {
      console.log('   ⚠️  Warnings:');
      for (const w of warnings) {
        console.log(`      - ${w.type}: ${w.details || w.message || w.feature}`);
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

// Test authentication error handling
async function testAuthError() {
  console.log('\n2. Testing error classification...');
  try {
    // This would fail if not authenticated
    const model = geminiCli('auto', {
      geminiPath: 'nonexistent-gemini-cli',
    });

    await generateText({
      model,
      prompt: 'Hello',
    });
  } catch (error) {
    if (isAuthenticationError(error)) {
      console.log('   ✓ Detected authentication error');
      console.log('   💡 Run `gemini` once to authenticate');
    } else {
      console.log('   ✓ Caught non-auth error:', error.message.slice(0, 80));
    }
  }
}

await testValidRequest();
await testAuthError();

console.log('\n💡 Tips:');
console.log('- Use isAuthenticationError() to detect auth issues');
console.log('- Check warnings array for unsupported features');
console.log('- Wrap calls in try/catch for graceful degradation');
