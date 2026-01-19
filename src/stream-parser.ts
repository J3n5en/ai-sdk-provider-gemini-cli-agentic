import type {
  GeminiStreamEvent,
  GeminiStats,
  GeminiInitEvent,
  GeminiMessageEvent,
  GeminiToolUseEvent,
  GeminiToolResultEvent,
  GeminiResultEvent,
  GeminiErrorEvent,
} from './types.js';
import type { LanguageModelV3Usage, JSONObject } from '@ai-sdk/provider';

/**
 * Parse a single line of Gemini CLI stream-json output.
 */
export function parseStreamJsonLine(line: string): GeminiStreamEvent | null {
  try {
    const event: unknown = JSON.parse(line);
    if (
      !event ||
      typeof event !== 'object' ||
      !('type' in event) ||
      typeof event.type !== 'string'
    ) {
      return null;
    }
    return event as GeminiStreamEvent;
  } catch {
    return null;
  }
}

/**
 * Type guard for init event.
 */
export function isInitEvent(event: GeminiStreamEvent): event is GeminiInitEvent {
  return event.type === 'init';
}

/**
 * Type guard for message event.
 */
export function isMessageEvent(event: GeminiStreamEvent): event is GeminiMessageEvent {
  return event.type === 'message';
}

/**
 * Type guard for tool use event.
 */
export function isToolUseEvent(event: GeminiStreamEvent): event is GeminiToolUseEvent {
  return event.type === 'tool_use';
}

/**
 * Type guard for tool result event.
 */
export function isToolResultEvent(event: GeminiStreamEvent): event is GeminiToolResultEvent {
  return event.type === 'tool_result';
}

/**
 * Type guard for result event.
 */
export function isResultEvent(event: GeminiStreamEvent): event is GeminiResultEvent {
  return event.type === 'result';
}

/**
 * Type guard for error event.
 */
export function isErrorEvent(event: GeminiStreamEvent): event is GeminiErrorEvent {
  return event.type === 'error';
}

/**
 * Create empty usage object.
 */
export function createEmptyUsage(): LanguageModelV3Usage {
  return {
    inputTokens: {
      total: 0,
      noCache: 0,
      cacheRead: 0,
      cacheWrite: 0,
    },
    outputTokens: {
      total: 0,
      text: undefined,
      reasoning: undefined,
    },
    raw: undefined,
  };
}

/**
 * Convert Gemini stats to AI SDK usage format.
 */
export function convertStatsToUsage(stats: GeminiStats): LanguageModelV3Usage {
  const inputTotal = stats.input_tokens ?? stats.input ?? 0;
  const outputTotal = stats.output_tokens ?? 0;
  const cached = stats.cached ?? 0;

  return {
    inputTokens: {
      total: inputTotal,
      noCache: inputTotal - cached,
      cacheRead: cached,
      cacheWrite: 0,
    },
    outputTokens: {
      total: outputTotal,
      text: undefined,
      reasoning: undefined,
    },
    raw: stats as unknown as JSONObject,
  };
}
