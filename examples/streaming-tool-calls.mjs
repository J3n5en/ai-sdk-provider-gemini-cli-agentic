#!/usr/bin/env node

/**
 * Streaming Tool Calls (Gemini CLI Agentic)
 *
 * Purpose: Demonstrate tool streaming with Gemini CLI tool execution.
 * Run: node examples/streaming-tool-calls.mjs
 */

import { streamText } from 'ai';
import { geminiCli } from '../dist/index.js';

const model = geminiCli('auto', {
  approvalMode: 'yolo', // Auto-approve for demo
  sandbox: true, // Run in sandbox for safety
});

console.log('🔧 Gemini CLI Tool Streaming Demo');
console.log('Prompt: "List the current directory and summarize"\n');

try {
  const result = await streamText({
    model,
    prompt:
      'List the files in the current directory. Print the command output and include a short summary.',
  });

  const textBuffer = [];

  for await (const part of result.fullStream) {
    switch (part.type) {
      case 'response-metadata': {
        console.log(`📎 Model: ${part.modelId}`);
        break;
      }
      case 'tool-call':
        console.log(`🚀 Executing tool: ${part.toolName} (${part.toolCallId})`);
        if (part.input) {
          const inputStr = typeof part.input === 'string' ? part.input : JSON.stringify(part.input);
          console.log(`   Input: ${inputStr.slice(0, 100)}${inputStr.length > 100 ? '...' : ''}`);
        }
        break;
      case 'tool-result': {
        let resultStr = '';
        if (part.result != null) {
          resultStr = typeof part.result === 'string' ? part.result : JSON.stringify(part.result, null, 2);
        }
        const preview = resultStr.length > 200 ? resultStr.slice(0, 200) + '...' : resultStr;
        console.log(`✅ Tool result (${part.toolCallId}):${preview ? '\n' + preview : ' (empty)'}`);
        break;
      }
      case 'text-delta': {
        const textDelta = part.text ?? part.delta;
        if (typeof textDelta === 'string') {
          textBuffer.push(textDelta);
          process.stdout.write(textDelta);
        }
        break;
      }
      case 'finish': {
        const usage = part.totalUsage || part.usage;
        const inputTotal = usage?.inputTokens?.total ?? 0;
        const outputTotal = usage?.outputTokens?.total ?? 0;
        console.log(`\n🏁 Finished (inputTokens=${inputTotal}, outputTokens=${outputTotal})`);
        break;
      }
      default:
        break;
    }
  }

  if (textBuffer.length === 0) {
    console.log('⚠️  No text received from model');
  } else {
    process.stdout.write('\n');
  }
} catch (error) {
  console.error('❌ Demo failed:', error);
  process.exitCode = 1;
}
