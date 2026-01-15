import { describe, it, expect } from 'vitest';
import { createAPICallError, createAuthenticationError, isAuthenticationError } from '../errors.js';

describe('errors', () => {
  it('creates API call error with metadata', () => {
    const err = createAPICallError({
      message: 'boom',
      code: 'EFAIL',
      exitCode: 2,
      stderr: 'oops',
      promptExcerpt: 'hi',
    });
    expect((err as any).data).toMatchObject({
      code: 'EFAIL',
      exitCode: 2,
      stderr: 'oops',
      promptExcerpt: 'hi',
    });
  });

  it('creates API call error without optional fields', () => {
    const err = createAPICallError({
      message: 'simple error',
    });
    expect(err.message).toBe('simple error');
    expect((err as any).data).toBeDefined();
  });

  it('authentication error helper is detected', () => {
    const err = createAuthenticationError('auth');
    expect(isAuthenticationError(err)).toBe(true);
  });

  it('default authentication error message', () => {
    const err = createAuthenticationError();
    expect(err.message).toContain('Authentication failed');
  });

  it('API call error is not authentication error', () => {
    const err = createAPICallError({ message: 'not auth' });
    expect(isAuthenticationError(err)).toBe(false);
  });

  it('API call error with 401 exit code is authentication error', () => {
    const err = createAPICallError({
      message: 'unauthorized',
      exitCode: 401,
    });
    expect(isAuthenticationError(err)).toBe(true);
  });
});
