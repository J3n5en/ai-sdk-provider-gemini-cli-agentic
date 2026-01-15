#!/usr/bin/env node

/**
 * Custom Config (Gemini CLI Agentic)
 *
 * Purpose: Show how to customize CWD and settings per run.
 * Run: node examples/custom-config.mjs
 */

import { generateText } from 'ai';
import { geminiCli } from '../dist/index.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Create a model with custom configuration
const model = geminiCli('gemini-2.5-flash', {
  // Working directory - Gemini CLI will operate in this folder
  cwd: projectRoot,

  // Approval mode: 'default' | 'auto_edit' | 'yolo'
  approvalMode: 'auto_edit',

  // Sandbox mode for restricted execution
  sandbox: true,

  // Include additional directories for context
  includeDirectories: ['./src', './examples'],

  // Environment variables
  env: {
    MY_CUSTOM_VAR: 'hello',
  },
});

const { text } = await generateText({
  model,
  prompt: 'What directory are you working in? List the package.json name field.',
});

console.log('Response:', text);
