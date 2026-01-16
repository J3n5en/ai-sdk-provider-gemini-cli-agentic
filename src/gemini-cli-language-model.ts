import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  SharedV3Warning,
  LanguageModelV3FinishReason,
  LanguageModelV3StreamPart,
  LanguageModelV3Usage,
  LanguageModelV3Content,
} from '@ai-sdk/provider';
import { NoSuchModelError } from '@ai-sdk/provider';
import { generateId, parseProviderOptions } from '@ai-sdk/provider-utils';
import type {
  GeminiCliSettings,
  GeminiCliProviderOptions,
  Logger,
} from './types.js';
import {
  parseStreamJsonLine,
  isInitEvent,
  isMessageEvent,
  isToolUseEvent,
  isToolResultEvent,
  isResultEvent,
  isErrorEvent,
  convertStatsToUsage,
  createEmptyUsage,
} from './stream-parser.js';
import { mapMessagesToPrompt } from './message-mapper.js';
import { getLogger, createVerboseLogger } from './logger.js';
import { createAPICallError, createAuthenticationError } from './errors.js';
import { z } from 'zod';

export interface GeminiLanguageModelOptions {
  id: string;
  settings?: GeminiCliSettings;
}

const geminiCliProviderOptionsSchema: z.ZodType<GeminiCliProviderOptions> = z
  .object({
    approvalMode: z.enum(['default', 'auto_edit', 'yolo']).optional(),
    yolo: z.boolean().optional(),
    sandbox: z.boolean().optional(),
    includeDirectories: z.array(z.string().min(1)).optional(),
    allowedTools: z.array(z.string().min(1)).optional(),
    allowedMcpServerNames: z.array(z.string().min(1)).optional(),
  })
  .strict();

function mapGeminiFinishReason(status?: string): LanguageModelV3FinishReason {
  switch (status) {
    case 'success':
      return { unified: 'stop', raw: status };
    case 'error':
      return { unified: 'error', raw: status };
    default:
      return { unified: 'stop', raw: status };
  }
}

function resolveGeminiPath(
  explicitPath?: string,
  allowNpx?: boolean,
): { cmd: string; args: string[] } {
  if (explicitPath) {
    // `geminiPath` may be either a JS entrypoint (e.g. `.../bin/gemini.js`) or an executable
    // (e.g. `/usr/local/bin/gemini`). Only force `node` for explicit JS files.
    const lower = explicitPath.toLowerCase();
    if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) {
      return { cmd: 'node', args: [explicitPath] };
    }
    return { cmd: explicitPath, args: [] };
  }

  // Use npx if allowed, otherwise fall back to PATH
  if (allowNpx) return { cmd: 'npx', args: ['-y', '@google/gemini-cli'] };
  return { cmd: 'gemini', args: [] };
}

export class GeminiCliLanguageModel implements LanguageModelV3 {
  readonly specificationVersion = 'v3' as const;
  readonly provider = 'gemini-cli';
  readonly defaultObjectGenerationMode = 'json' as const;
  readonly supportsImageUrls = false;
  readonly supportedUrls = {};
  readonly supportsStructuredOutputs = false;

  readonly modelId: string;
  readonly settings: GeminiCliSettings;

  private logger: Logger;
  private sessionId?: string;

  constructor(options: GeminiLanguageModelOptions) {
    this.modelId = options.id;
    this.settings = options.settings ?? {};
    const baseLogger = getLogger(this.settings.logger);
    this.logger = createVerboseLogger(baseLogger, this.settings.verbose ?? false);

    if (!this.modelId || this.modelId.trim() === '') {
      throw new NoSuchModelError({ modelId: this.modelId, modelType: 'languageModel' });
    }
  }

  private mergeSettings(providerOptions?: GeminiCliProviderOptions): GeminiCliSettings {
    if (!providerOptions) return this.settings;

    return {
      ...this.settings,
      approvalMode: providerOptions.approvalMode ?? this.settings.approvalMode,
      yolo: providerOptions.yolo ?? this.settings.yolo,
      sandbox: providerOptions.sandbox ?? this.settings.sandbox,
      includeDirectories:
        providerOptions.includeDirectories ?? this.settings.includeDirectories,
      allowedTools: providerOptions.allowedTools ?? this.settings.allowedTools,
      allowedMcpServerNames:
        providerOptions.allowedMcpServerNames ?? this.settings.allowedMcpServerNames,
    };
  }

  private buildArgs(
    promptText: string,
    settings: GeminiCliSettings = this.settings
  ): { cmd: string; args: string[]; env: NodeJS.ProcessEnv; cwd?: string; shell: boolean } {
    const base = resolveGeminiPath(settings.geminiPath, settings.allowNpx);
    const cmd = base.cmd;
    const args: string[] = [...base.args];
    // Use shell on Windows for commands that need .cmd resolution (gemini, npx)
    const shell = process.platform === 'win32' && (base.cmd === 'npx' || base.cmd === 'gemini');

    // Output format: always use stream-json
    args.push('--output-format', 'stream-json');

    // Model
    if (this.modelId && this.modelId !== 'auto') {
      args.push('-m', this.modelId);
    }

    // Approval mode
    if (settings.yolo) {
      args.push('--yolo');
    } else if (settings.approvalMode) {
      args.push('--approval-mode', settings.approvalMode);
    }

    // Sandbox mode
    if (settings.sandbox) {
      args.push('--sandbox');
    }

    // Include directories
    if (settings.includeDirectories?.length) {
      for (const dir of settings.includeDirectories) {
        args.push('--include-directories', dir);
      }
    }

    // Allowed tools
    if (settings.allowedTools?.length) {
      args.push('--allowed-tools', ...settings.allowedTools);
    }

    // MCP server names
    if (settings.allowedMcpServerNames?.length) {
      args.push('--allowed-mcp-server-names', ...settings.allowedMcpServerNames);
    }

    // Resume session
    if (settings.resume) {
      if (typeof settings.resume === 'string') {
        args.push('--resume', settings.resume);
      } else {
        args.push('--resume', 'latest');
      }
    }

    // Prompt as positional argument
    args.push(promptText);

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      ...(settings.env || {}),
    };

    return { cmd, args, env, cwd: settings.cwd, shell };
  }

  private mapWarnings(options: LanguageModelV3CallOptions): SharedV3Warning[] {
    const unsupported: SharedV3Warning[] = [];
    const add = (setting: unknown, name: string) => {
      if (setting !== undefined) {
        unsupported.push({
          type: 'unsupported',
          feature: name,
          details: `Gemini CLI does not support ${name}; it will be ignored.`,
        });
      }
    };
    add(options.temperature, 'temperature');
    add(options.topP, 'topP');
    add(options.topK, 'topK');
    add(options.presencePenalty, 'presencePenalty');
    add(options.frequencyPenalty, 'frequencyPenalty');
    add(options.stopSequences?.length ? options.stopSequences : undefined, 'stopSequences');
    return unsupported;
  }

  private handleSpawnError(err: unknown, promptExcerpt: string): Error {
    const e =
      err && typeof err === 'object'
        ? (err as { message?: unknown; code?: unknown })
        : undefined;
    const message = String((e?.message ?? err) || 'Failed to run Gemini CLI');
    if (/login|auth|unauthorized/i.test(message)) {
      return createAuthenticationError(message);
    }
    return createAPICallError({
      message,
      code: typeof e?.code === 'string' ? e.code : undefined,
      promptExcerpt,
    });
  }

  async doGenerate(
    options: Parameters<LanguageModelV3['doGenerate']>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV3['doGenerate']>>> {
    this.logger.debug(`[gemini-cli] Starting doGenerate request with model: ${this.modelId}`);

    const { promptText, warnings: mappingWarnings } = mapMessagesToPrompt(options.prompt);
    const promptExcerpt = promptText.slice(0, 200);
    const warnings = [
      ...this.mapWarnings(options),
      ...(mappingWarnings?.map((m) => ({ type: 'other' as const, message: m })) || []),
    ] as SharedV3Warning[];

    const providerOptions = await parseProviderOptions<GeminiCliProviderOptions>({
      provider: this.provider,
      providerOptions: options.providerOptions,
      schema: geminiCliProviderOptionsSchema,
    });
    const effectiveSettings = this.mergeSettings(providerOptions);

    const { cmd, args, env, cwd, shell } = this.buildArgs(promptText, effectiveSettings);

    this.logger.debug(`[gemini-cli] Executing: ${cmd} ${args.slice(0, -1).join(' ')} [prompt]`);

    let text = '';
    let usage: LanguageModelV3Usage = createEmptyUsage();
    let finishReason: LanguageModelV3FinishReason = { unified: 'stop', raw: undefined };
    const content: LanguageModelV3Content[] = [];
    const toolResults = new Map<string, { toolName: string }>();

    const child = spawn(cmd, args, { env, cwd, shell, stdio: ['ignore', 'pipe', 'pipe'] });

    // Abort support
    let onAbort: (() => void) | undefined;
    if (options.abortSignal) {
      if (options.abortSignal.aborted) {
        child.kill('SIGTERM');
        throw options.abortSignal.reason ?? new Error('Request aborted');
      }
      onAbort = () => child.kill('SIGTERM');
      options.abortSignal.addEventListener('abort', onAbort, { once: true });
    }

    const startTime = Date.now();

    try {
      await new Promise<void>((resolve, reject) => {
        let stderr = '';
        child.stderr.on('data', (d: Buffer | string) => (stderr += String(d)));
        child.stdout.setEncoding('utf8');

        child.stdout.on('data', (chunk: string) => {
          const lines = chunk.split(/\r?\n/).filter(Boolean);
          for (const line of lines) {
            const event = parseStreamJsonLine(line);
            if (!event) continue;

            this.logger.debug(`[gemini-cli] Event: ${event.type}`);

            if (isInitEvent(event)) {
              this.sessionId = event.session_id;
              this.logger.debug(`[gemini-cli] Session: ${this.sessionId}`);
            }

            if (isMessageEvent(event) && event.role === 'assistant' && event.content) {
              if (event.delta) {
                text += event.content;
              } else {
                text = event.content;
              }
            }

            if (isToolUseEvent(event)) {
              toolResults.set(event.tool_id, { toolName: event.tool_name });
              content.push({
                type: 'tool-call',
                toolCallId: event.tool_id,
                toolName: event.tool_name,
                input: JSON.stringify(event.parameters),
              } as LanguageModelV3Content);
            }

            if (isToolResultEvent(event)) {
              const toolInfo = toolResults.get(event.tool_id);
              content.push({
                type: 'tool-result',
                toolCallId: event.tool_id,
                toolName: toolInfo?.toolName ?? 'unknown',
                result: event.output,
                isError: event.status === 'error',
              } as LanguageModelV3Content);
            }

            if (isResultEvent(event)) {
              if (event.stats) {
                usage = convertStatsToUsage(event.stats);
              }
              finishReason = mapGeminiFinishReason(event.status);
            }

            if (isErrorEvent(event)) {
              reject(
                createAPICallError({
                  message: event.error,
                  stderr,
                  promptExcerpt,
                })
              );
            }
          }
        });

        child.on('error', (e: Error) => {
          this.logger.error(`[gemini-cli] Spawn error: ${String(e)}`);
          reject(this.handleSpawnError(e, promptExcerpt));
        });

        child.on('close', (code: number | null) => {
          const duration = Date.now() - startTime;
          if (code === 0) {
            this.logger.info(`[gemini-cli] Completed in ${duration}ms`);
            resolve();
          } else {
            this.logger.error(`[gemini-cli] Exited with code ${code}`);
            reject(
              createAPICallError({
                message: `Gemini CLI exited with code ${code}`,
                exitCode: code ?? undefined,
                stderr,
                promptExcerpt,
              })
            );
          }
        });
      });
    } finally {
      if (options.abortSignal && onAbort) {
        options.abortSignal.removeEventListener('abort', onAbort);
      }
    }

    // Add text content if present
    if (text) {
      content.unshift({ type: 'text', text });
    }

    return {
      content: content.length > 0 ? content : [{ type: 'text', text: '' }],
      usage,
      finishReason,
      warnings,
      response: { id: generateId(), timestamp: new Date(), modelId: this.modelId },
      request: { body: promptText },
      providerMetadata: {
        'gemini-cli': { ...(this.sessionId ? { sessionId: this.sessionId } : {}) },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV3['doStream']>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV3['doStream']>>> {
    this.logger.debug(`[gemini-cli] Starting doStream request with model: ${this.modelId}`);

    const { promptText, warnings: mappingWarnings } = mapMessagesToPrompt(options.prompt);
    const promptExcerpt = promptText.slice(0, 200);
    const warnings = [
      ...this.mapWarnings(options),
      ...(mappingWarnings?.map((m) => ({ type: 'other' as const, message: m })) || []),
    ] as SharedV3Warning[];

    const providerOptions = await parseProviderOptions<GeminiCliProviderOptions>({
      provider: this.provider,
      providerOptions: options.providerOptions,
      schema: geminiCliProviderOptionsSchema,
    });
    const effectiveSettings = this.mergeSettings(providerOptions);

    const { cmd, args, env, cwd, shell } = this.buildArgs(promptText, effectiveSettings);

    this.logger.debug(`[gemini-cli] Streaming: ${cmd} ${args.slice(0, -1).join(' ')} [prompt]`);

    const model = this;
    const abortSignal = options.abortSignal;

    const stream = new ReadableStream<LanguageModelV3StreamPart>({
      start(controller) {
        const startTime = Date.now();
        const child = spawn(cmd, args, { env, cwd, shell, stdio: ['ignore', 'pipe', 'pipe'] });

        controller.enqueue({ type: 'stream-start', warnings });

        let stderr = '';
        let lastUsage: LanguageModelV3Usage | undefined;
        let textId: string | undefined;
        let lastStatus: string | undefined;
        const toolResults = new Map<string, { toolName: string }>();

        // Abort support
        const onAbort = () => child.kill('SIGTERM');
        if (abortSignal) {
          if (abortSignal.aborted) {
            child.kill('SIGTERM');
            controller.error(abortSignal.reason ?? new Error('Request aborted'));
            return;
          }
          abortSignal.addEventListener('abort', onAbort, { once: true });
        }

        child.stderr.on('data', (d: Buffer | string) => (stderr += String(d)));
        child.stdout.setEncoding('utf8');

        child.stdout.on('data', (chunk: string) => {
          const lines = chunk.split(/\r?\n/).filter(Boolean);
          for (const line of lines) {
            const event = parseStreamJsonLine(line);
            if (!event) continue;

            model.logger.debug(`[gemini-cli] Stream event: ${event.type}`);

            if (isInitEvent(event)) {
              model.sessionId = event.session_id;
              controller.enqueue({
                type: 'response-metadata',
                id: randomUUID(),
                timestamp: new Date(),
                modelId: event.model ?? model.modelId,
              });
              continue;
            }

            if (isMessageEvent(event) && event.role === 'assistant' && event.content) {
              if (!textId) {
                textId = randomUUID();
                controller.enqueue({ type: 'text-start', id: textId });
              }
              controller.enqueue({
                type: 'text-delta',
                id: textId,
                delta: event.content,
              });
              continue;
            }

            if (isToolUseEvent(event)) {
              toolResults.set(event.tool_id, { toolName: event.tool_name });
              controller.enqueue({
                type: 'tool-call',
                toolCallId: event.tool_id,
                toolName: event.tool_name,
                input: JSON.stringify(event.parameters),
                providerExecuted: true,
              });
              continue;
            }

            if (isToolResultEvent(event)) {
              const toolInfo = toolResults.get(event.tool_id);
              controller.enqueue({
                type: 'tool-result',
                toolCallId: event.tool_id,
                toolName: toolInfo?.toolName ?? 'unknown',
                result: event.output as unknown as NonNullable<import('@ai-sdk/provider').JSONValue>,
                isError: event.status === 'error',
              });
              continue;
            }

            if (isResultEvent(event)) {
              if (event.stats) {
                lastUsage = convertStatsToUsage(event.stats);
              }
              lastStatus = event.status;
              continue;
            }

            if (isErrorEvent(event)) {
              controller.error(
                createAPICallError({
                  message: event.error,
                  stderr,
                  promptExcerpt,
                })
              );
              return;
            }
          }
        });

        child.on('error', (e: Error) => {
          model.logger.error(`[gemini-cli] Stream spawn error: ${String(e)}`);
          if (abortSignal) {
            abortSignal.removeEventListener('abort', onAbort);
          }
          controller.error(model.handleSpawnError(e, promptExcerpt));
        });

        child.on('close', (code: number | null) => {
          const duration = Date.now() - startTime;
          if (abortSignal) {
            abortSignal.removeEventListener('abort', onAbort);
          }

          // Close text stream if open
          if (textId) {
            controller.enqueue({ type: 'text-end', id: textId });
          }

          if (code === 0) {
            model.logger.info(`[gemini-cli] Stream completed in ${duration}ms`);
            controller.enqueue({
              type: 'finish',
              finishReason: mapGeminiFinishReason(lastStatus),
              usage: lastUsage ?? createEmptyUsage(),
            });
            controller.close();
          } else {
            model.logger.error(`[gemini-cli] Stream exited with code ${code}`);
            controller.error(
              createAPICallError({
                message: `Gemini CLI exited with code ${code}`,
                exitCode: code ?? undefined,
                stderr,
                promptExcerpt,
              })
            );
          }
        });
      },
      cancel() {
        // Cleanup handled in close event
      },
    });

    return { stream, request: { body: promptText } };
  }
}
