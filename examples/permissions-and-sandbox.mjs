#!/usr/bin/env node

/**
 * Permissions & Sandbox Modes (Gemini CLI Agentic)
 *
 * Purpose: Understand autonomy levels and sandbox options.
 * Run: node examples/permissions-and-sandbox.mjs
 */

import { generateText } from 'ai';
import { geminiCli } from '../dist/index.js';

async function run(label, settings) {
  const model = geminiCli('auto', settings);
  const { text } = await generateText({
    model,
    prompt: `Say the mode label: "${label}". Keep it short.`,
  });
  console.log(`[${label}]`, text.slice(0, 100));
}

console.log('=== Approval Modes ===\n');

// Default: Prompts for approval on dangerous operations
await run('default mode', {
  approvalMode: 'default',
});

// Auto-edit: Auto-approves file edits, prompts for shell commands
await run('auto_edit mode', {
  approvalMode: 'auto_edit',
});

// Yolo: Auto-approves everything (use with caution!)
await run('yolo mode', {
  approvalMode: 'yolo',
});

// Shorthand for yolo
await run('yolo shorthand', {
  yolo: true,
});

console.log('\n=== Sandbox Mode ===\n');

// Sandbox: Restricted execution environment
await run('sandbox enabled', {
  approvalMode: 'yolo',
  sandbox: true,
});

console.log('\n📝 Notes:');
console.log('- default: Safest, requires manual approval');
console.log('- auto_edit: Good for development, auto-approves file changes');
console.log('- yolo: Fast but risky, auto-approves everything');
console.log('- sandbox: Adds additional isolation regardless of approval mode');
