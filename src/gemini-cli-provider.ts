import type { LanguageModelV3, ProviderV3 } from '@ai-sdk/provider';
import { NoSuchModelError } from '@ai-sdk/provider';
import { GeminiCliLanguageModel } from './gemini-cli-language-model.js';
import type { GeminiCliProviderSettings, GeminiCliSettings } from './types.js';
import { getLogger } from './logger.js';
import { validateSettings } from './validation.js';

export interface GeminiCliProvider extends ProviderV3 {
  (modelId: string, settings?: GeminiCliSettings): LanguageModelV3;
  languageModel(modelId: string, settings?: GeminiCliSettings): LanguageModelV3;
  chat(modelId: string, settings?: GeminiCliSettings): LanguageModelV3;
  embeddingModel(modelId: string): never;
  imageModel(modelId: string): never;
}

export function createGeminiCli(options: GeminiCliProviderSettings = {}): GeminiCliProvider {
  const logger = getLogger(options.defaultSettings?.logger);

  if (options.defaultSettings) {
    const v = validateSettings(options.defaultSettings);
    if (!v.valid) {
      throw new Error(`Invalid default settings: ${v.errors.join(', ')}`);
    }
    for (const w of v.warnings) logger.warn(`Gemini CLI Provider: ${w}`);
  }

  const createModel = (modelId: string, settings: GeminiCliSettings = {}): LanguageModelV3 => {
    const merged: GeminiCliSettings = { ...options.defaultSettings, ...settings };
    const v = validateSettings(merged);
    if (!v.valid) throw new Error(`Invalid settings: ${v.errors.join(', ')}`);
    for (const w of v.warnings) logger.warn(`Gemini CLI: ${w}`);
    return new GeminiCliLanguageModel({ id: modelId, settings: merged });
  };

  const provider = function (modelId: string, settings?: GeminiCliSettings) {
    if (new.target) throw new Error('The Gemini CLI provider function cannot be called with new.');
    return createModel(modelId, settings);
  } as GeminiCliProvider;

  provider.languageModel = createModel;
  provider.chat = createModel;
  provider.embeddingModel = ((modelId: string) => {
    throw new NoSuchModelError({ modelId, modelType: 'embeddingModel' });
  }) as never;
  provider.imageModel = ((modelId: string) => {
    throw new NoSuchModelError({ modelId, modelType: 'imageModel' });
  }) as never;

  return provider;
}

export const geminiCli = createGeminiCli();
