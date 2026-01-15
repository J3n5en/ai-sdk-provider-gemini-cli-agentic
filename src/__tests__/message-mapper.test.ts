import { describe, it, expect } from 'vitest';
import { mapMessagesToPrompt } from '../message-mapper.js';

describe('mapMessagesToPrompt', () => {
  it('maps simple user message', () => {
    const { promptText } = mapMessagesToPrompt([{ role: 'user', content: 'Hello' }]);
    expect(promptText).toContain('Human: Hello');
  });

  it('maps assistant message', () => {
    const { promptText } = mapMessagesToPrompt([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
    ]);
    expect(promptText).toContain('Human: Hi');
    expect(promptText).toContain('Assistant: Hello!');
  });

  it('maps system message as prefix', () => {
    const { promptText } = mapMessagesToPrompt([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hi' },
    ]);
    expect(promptText).toMatch(/^You are helpful\./);
    expect(promptText).toContain('Human: Hi');
  });

  it('handles array content with text parts', () => {
    const { promptText } = mapMessagesToPrompt([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: 'Second part' },
        ],
      },
    ]);
    expect(promptText).toContain('First part');
    expect(promptText).toContain('Second part');
  });

  it('handles tool messages', () => {
    const { promptText } = mapMessagesToPrompt([
      {
        role: 'tool',
        content: [
          {
            toolName: 'calculator',
            output: { type: 'text', value: '42' },
          },
        ],
      },
    ] as any);
    expect(promptText).toContain('Tool Result (calculator): 42');
  });

  it('handles tool message with JSON output', () => {
    const { promptText } = mapMessagesToPrompt([
      {
        role: 'tool',
        content: [
          {
            toolName: 'api',
            output: { type: 'json', value: { result: 'success' } },
          },
        ],
      },
    ] as any);
    expect(promptText).toContain('Tool Result (api):');
    expect(promptText).toContain('"result":"success"');
  });

  it('returns empty string for empty messages', () => {
    const { promptText } = mapMessagesToPrompt([]);
    expect(promptText).toBe('');
  });

  it('handles multi-turn conversation', () => {
    const { promptText } = mapMessagesToPrompt([
      { role: 'system', content: 'Be concise.' },
      { role: 'user', content: 'What is 2+2?' },
      { role: 'assistant', content: '4' },
      { role: 'user', content: 'Thanks!' },
    ]);
    expect(promptText).toMatch(/^Be concise\./);
    expect(promptText).toContain('Human: What is 2+2?');
    expect(promptText).toContain('Assistant: 4');
    expect(promptText).toContain('Human: Thanks!');
  });
});
