import { describe, it, expect } from 'vitest';
import { createGeminiCli, geminiCli } from '../gemini-cli-provider.js';
import { GeminiCliLanguageModel } from '../gemini-cli-language-model.js';

describe('gemini-cli-provider', () => {
  describe('createGeminiCli', () => {
    it('creates provider with default settings', () => {
      const provider = createGeminiCli();
      expect(provider).toBeDefined();
      expect(typeof provider).toBe('function');
      expect(typeof provider.languageModel).toBe('function');
      expect(typeof provider.chat).toBe('function');
    });

    it('creates model instance', () => {
      const provider = createGeminiCli();
      const model = provider('gemini-2.5-flash');
      expect(model).toBeInstanceOf(GeminiCliLanguageModel);
      expect(model.modelId).toBe('gemini-2.5-flash');
    });

    it('creates model via languageModel method', () => {
      const provider = createGeminiCli();
      const model = provider.languageModel('auto');
      expect(model).toBeInstanceOf(GeminiCliLanguageModel);
    });

    it('creates model via chat method', () => {
      const provider = createGeminiCli();
      const model = provider.chat('auto');
      expect(model).toBeInstanceOf(GeminiCliLanguageModel);
    });

    it('throws for embeddingModel', () => {
      const provider = createGeminiCli();
      expect(() => provider.embeddingModel('any')).toThrow();
    });

    it('throws for imageModel', () => {
      const provider = createGeminiCli();
      expect(() => provider.imageModel('any')).toThrow();
    });

    it('merges default settings with per-call settings', () => {
      const provider = createGeminiCli({
        defaultSettings: {
          approvalMode: 'default',
          sandbox: true,
        },
      });
      const model = provider('auto', { approvalMode: 'yolo' }) as GeminiCliLanguageModel;
      // yolo should override default
      expect(model.settings.approvalMode).toBe('yolo');
      // sandbox should be inherited
      expect(model.settings.sandbox).toBe(true);
    });

    it('throws on invalid default settings', () => {
      expect(() =>
        createGeminiCli({
          defaultSettings: {
            approvalMode: 'invalid' as any,
          },
        }),
      ).toThrow();
    });

    it('cannot be called with new', () => {
      const provider = createGeminiCli();
      expect(() => new (provider as any)('auto')).toThrow();
    });
  });

  describe('geminiCli default instance', () => {
    it('is a valid provider', () => {
      expect(geminiCli).toBeDefined();
      expect(typeof geminiCli).toBe('function');
    });

    it('creates model', () => {
      const model = geminiCli('auto');
      expect(model).toBeInstanceOf(GeminiCliLanguageModel);
    });
  });
});
