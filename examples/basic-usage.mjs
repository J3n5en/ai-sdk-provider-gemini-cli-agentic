#!/usr/bin/env node

/**
 * Basic Usage (Gemini CLI Agentic)
 *
 * Purpose: Minimal generation to prove setup works.
 * Run: node examples/basic-usage.mjs
 */

import { generateText } from 'ai';
import { geminiCli } from '../dist/index.js';

const model = geminiCli('auto', {
  approvalMode: 'auto_edit',
});

const { text } = await generateText({
  model,
  prompt: 'Reply with a single word: hello.',
});

console.log('Result:', text);
