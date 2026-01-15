#!/usr/bin/env node

/**
 * Streaming (Gemini CLI Agentic)
 *
 * Purpose: Show the AI SDK streaming API shape.
 * Run: node examples/streaming.mjs
 */

import { streamText } from 'ai';
import { geminiCli } from '../dist/index.js';

const model = geminiCli('auto', {
  approvalMode: 'auto_edit',
});

const { textStream } = await streamText({
  model,
  prompt: 'Write a short poem about coding (4 lines).',
});

for await (const chunk of textStream) {
  process.stdout.write(chunk);
}
process.stdout.write('\n');
