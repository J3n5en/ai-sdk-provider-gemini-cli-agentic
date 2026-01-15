import { describe, it, expect } from 'vitest';
import {
  parseStreamJsonLine,
  isInitEvent,
  isMessageEvent,
  isToolUseEvent,
  isToolResultEvent,
  isResultEvent,
  isErrorEvent,
  createEmptyUsage,
  convertStatsToUsage,
} from '../stream-parser.js';

describe('stream-parser', () => {
  describe('parseStreamJsonLine', () => {
    it('parses valid JSON with type field', () => {
      const event = parseStreamJsonLine('{"type":"init","session_id":"abc"}');
      expect(event).not.toBeNull();
      expect(event?.type).toBe('init');
    });

    it('returns null for invalid JSON', () => {
      expect(parseStreamJsonLine('not json')).toBeNull();
    });

    it('returns null for JSON without type field', () => {
      expect(parseStreamJsonLine('{"foo":"bar"}')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseStreamJsonLine('')).toBeNull();
    });
  });

  describe('type guards', () => {
    it('isInitEvent', () => {
      expect(isInitEvent({ type: 'init', session_id: 'abc' } as any)).toBe(true);
      expect(isInitEvent({ type: 'message' } as any)).toBe(false);
    });

    it('isMessageEvent', () => {
      expect(isMessageEvent({ type: 'message', role: 'assistant', content: 'hi' } as any)).toBe(true);
      expect(isMessageEvent({ type: 'init' } as any)).toBe(false);
    });

    it('isToolUseEvent', () => {
      expect(
        isToolUseEvent({ type: 'tool_use', tool_name: 'ls', tool_id: '1', parameters: {} } as any),
      ).toBe(true);
      expect(isToolUseEvent({ type: 'message' } as any)).toBe(false);
    });

    it('isToolResultEvent', () => {
      expect(
        isToolResultEvent({ type: 'tool_result', tool_id: '1', status: 'success', output: '' } as any),
      ).toBe(true);
      expect(isToolResultEvent({ type: 'tool_use' } as any)).toBe(false);
    });

    it('isResultEvent', () => {
      expect(isResultEvent({ type: 'result', status: 'success' } as any)).toBe(true);
      expect(isResultEvent({ type: 'error' } as any)).toBe(false);
    });

    it('isErrorEvent', () => {
      expect(isErrorEvent({ type: 'error', error: 'boom' } as any)).toBe(true);
      expect(isErrorEvent({ type: 'result' } as any)).toBe(false);
    });
  });

  describe('createEmptyUsage', () => {
    it('returns zero usage', () => {
      const usage = createEmptyUsage();
      expect(usage.inputTokens.total).toBe(0);
      expect(usage.outputTokens.total).toBe(0);
    });
  });

  describe('convertStatsToUsage', () => {
    it('converts stats with input_tokens and output_tokens', () => {
      const usage = convertStatsToUsage({
        input_tokens: 100,
        output_tokens: 50,
        cached: 20,
      });
      expect(usage.inputTokens.total).toBe(100);
      expect(usage.inputTokens.cacheRead).toBe(20);
      expect(usage.inputTokens.noCache).toBe(80);
      expect(usage.outputTokens.total).toBe(50);
    });

    it('handles missing cached field', () => {
      const usage = convertStatsToUsage({
        input_tokens: 100,
        output_tokens: 50,
      });
      expect(usage.inputTokens.cacheRead).toBe(0);
      expect(usage.inputTokens.noCache).toBe(100);
    });

    it('handles legacy input field', () => {
      const usage = convertStatsToUsage({
        input: 75,
        output_tokens: 25,
      });
      expect(usage.inputTokens.total).toBe(75);
    });
  });
});
