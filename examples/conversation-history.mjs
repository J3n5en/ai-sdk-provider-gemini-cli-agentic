#!/usr/bin/env node

/**
 * Conversation History (Gemini CLI Agentic)
 *
 * Purpose: Demonstrate maintaining context with message arrays.
 * Run: node examples/conversation-history.mjs
 */

import { generateText } from 'ai';
import { geminiCli } from '../dist/index.js';

const model = geminiCli('auto', {
  approvalMode: 'auto_edit',
});

const messages = [
  { role: 'user', content: 'My name is Alice.' },
  { role: 'assistant', content: 'Hi Alice! How can I help you today?' },
  { role: 'user', content: 'What did I just tell you my name was?' },
];

const { text } = await generateText({ model, messages });
console.log('Assistant:', text);
