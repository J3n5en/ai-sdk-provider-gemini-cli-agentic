import { APICallError, LoadAPIKeyError } from '@ai-sdk/provider';
import type { GeminiErrorMetadata } from './types.js';

export function createAPICallError({
  message,
  code,
  exitCode,
  stderr,
  promptExcerpt,
  isRetryable = false,
}: GeminiErrorMetadata & { message: string; isRetryable?: boolean }): APICallError {
  const data: GeminiErrorMetadata = { code, exitCode, stderr, promptExcerpt };
  return new APICallError({
    message,
    isRetryable,
    url: 'gemini-cli://exec',
    requestBodyValues: promptExcerpt ? { prompt: promptExcerpt } : undefined,
    data,
  });
}

export function createAuthenticationError(message?: string): LoadAPIKeyError {
  return new LoadAPIKeyError({
    message: message || 'Authentication failed. Run "gemini" to authenticate.',
  });
}

export function isAuthenticationError(err: unknown): boolean {
  if (err instanceof LoadAPIKeyError) return true;
  if (err instanceof APICallError) {
    const data = err.data as GeminiErrorMetadata | undefined;
    if (data?.exitCode === 401) return true;
  }
  return false;
}
