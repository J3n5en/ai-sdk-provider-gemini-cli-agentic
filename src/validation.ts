import { z } from 'zod';
import type { GeminiCliSettings } from './types.js';

const loggerFunctionSchema = z.object({
  debug: z.function(),
  info: z.function(),
  warn: z.function(),
  error: z.function(),
});

const settingsSchema = z
  .object({
    geminiPath: z.string().optional(),
    cwd: z.string().optional(),
    includeDirectories: z.array(z.string().min(1)).optional(),
    approvalMode: z.enum(['default', 'auto_edit', 'yolo']).optional(),
    yolo: z.boolean().optional(),
    sandbox: z.boolean().optional(),
    allowedTools: z.array(z.string().min(1)).optional(),
    allowedMcpServerNames: z.array(z.string().min(1)).optional(),
    resume: z.union([z.string(), z.boolean()]).optional(),
    model: z.string().optional(),
    env: z.record(z.string(), z.string()).optional(),
    verbose: z.boolean().optional(),
    logger: z.union([z.literal(false), loggerFunctionSchema]).optional(),
  })
  .strict();

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateSettings(settings: unknown): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const result = settingsSchema.safeParse(settings);

  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      errors.push(`${path}: ${issue.message}`);
    }
    return { valid: false, warnings, errors };
  }

  const s = settings as GeminiCliSettings;

  // Warn about redundant settings
  if (s.yolo && s.approvalMode && s.approvalMode !== 'yolo') {
    warnings.push('Both yolo and approvalMode are set. yolo takes precedence.');
  }

  return { valid: true, warnings, errors };
}

export function validateModelId(modelId: string): string | undefined {
  if (!modelId || modelId.trim() === '') {
    return 'Model ID cannot be empty';
  }
  return undefined;
}
