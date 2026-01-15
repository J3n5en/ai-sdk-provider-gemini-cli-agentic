export { createGeminiCli, geminiCli } from './gemini-cli-provider.js';
export type { GeminiCliProvider } from './gemini-cli-provider.js';

export type {
  GeminiCliSettings,
  GeminiCliProviderSettings,
  GeminiCliProviderOptions,
  Logger,
  ApprovalMode,
  GeminiStreamEvent,
  GeminiInitEvent,
  GeminiMessageEvent,
  GeminiToolUseEvent,
  GeminiToolResultEvent,
  GeminiResultEvent,
  GeminiErrorEvent,
  GeminiStats,
} from './types.js';

export { GeminiCliLanguageModel } from './gemini-cli-language-model.js';

// Error helpers
export { isAuthenticationError, createAPICallError, createAuthenticationError } from './errors.js';

// Validation helpers
export { validateSettings, validateModelId } from './validation.js';
