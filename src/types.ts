/**
 * Logger interface for provider diagnostics and debugging.
 */
export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/**
 * Approval mode for Gemini CLI operations.
 * - 'default': Prompt for approval on each operation
 * - 'auto_edit': Auto-approve edit tools
 * - 'yolo': Auto-approve all tools
 */
export type ApprovalMode = 'default' | 'auto_edit' | 'yolo';

/**
 * Configuration settings for Gemini CLI agentic provider.
 */
export interface GeminiCliSettings {
  /**
   * Path to the Gemini CLI executable.
   * @default 'gemini' (uses system PATH)
   */
  geminiPath?: string;

  /**
   * Allow falling back to `npx @google/gemini-cli` if the binary cannot be resolved.
   */
  allowNpx?: boolean;

  /**
   * Working directory for CLI operations.
   */
  cwd?: string;

  /**
   * Additional directories to include in the workspace.
   * Maps to --include-directories flag.
   */
  includeDirectories?: string[];

  /**
   * Approval mode for tool operations.
   * Maps to --approval-mode flag.
   */
  approvalMode?: ApprovalMode;

  /**
   * Auto-approve all operations (YOLO mode).
   * Maps to -y or --yolo flag.
   */
  yolo?: boolean;

  /**
   * Enable sandbox mode.
   * Maps to -s or --sandbox flag.
   */
  sandbox?: boolean;

  /**
   * Tools allowed to run without confirmation.
   * Maps to --allowed-tools flag.
   */
  allowedTools?: string[];

  /**
   * MCP server names allowed to be used.
   * Maps to --allowed-mcp-server-names flag.
   */
  allowedMcpServerNames?: string[];

  /**
   * Resume a previous session.
   * Maps to -r or --resume flag.
   * Use 'latest' for most recent or session index number.
   */
  resume?: string | boolean;

  /**
   * Model to use.
   * Maps to -m or --model flag.
   */
  model?: string;

  /**
   * Additional environment variables for the CLI process.
   */
  env?: Record<string, string>;

  /**
   * Enable verbose logging.
   */
  verbose?: boolean;

  /**
   * Custom logger or false to disable logging.
   */
  logger?: Logger | false;
}

/**
 * Provider-level settings with defaults for all models.
 */
export interface GeminiCliProviderSettings {
  defaultSettings?: GeminiCliSettings;
}

/**
 * Per-call provider options that can override settings.
 */
export interface GeminiCliProviderOptions {
  approvalMode?: ApprovalMode;
  yolo?: boolean;
  sandbox?: boolean;
  includeDirectories?: string[];
  allowedTools?: string[];
  allowedMcpServerNames?: string[];
}

// ===== Stream JSON Event Types =====

/**
 * Base interface for Gemini CLI stream events.
 */
export interface GeminiStreamEventBase {
  type: string;
  timestamp: string;
}

/**
 * Init event - session initialization.
 */
export interface GeminiInitEvent extends GeminiStreamEventBase {
  type: 'init';
  session_id: string;
  model: string;
}

/**
 * Message event - user or assistant message.
 */
export interface GeminiMessageEvent extends GeminiStreamEventBase {
  type: 'message';
  role: 'user' | 'assistant' | 'system';
  content: string;
  delta?: boolean;
}

/**
 * Tool use event - tool invocation.
 */
export interface GeminiToolUseEvent extends GeminiStreamEventBase {
  type: 'tool_use';
  tool_name: string;
  tool_id: string;
  parameters: Record<string, unknown>;
}

/**
 * Tool result event - tool execution result.
 */
export interface GeminiToolResultEvent extends GeminiStreamEventBase {
  type: 'tool_result';
  tool_id: string;
  status: 'success' | 'error';
  output: string;
  error?: string;
}

/**
 * Result event - final result with statistics.
 */
export interface GeminiResultEvent extends GeminiStreamEventBase {
  type: 'result';
  status: 'success' | 'error';
  stats: GeminiStats;
}

/**
 * Error event - error during execution.
 */
export interface GeminiErrorEvent extends GeminiStreamEventBase {
  type: 'error';
  error: string;
}

/**
 * Union type for all stream events.
 */
export type GeminiStreamEvent =
  | GeminiInitEvent
  | GeminiMessageEvent
  | GeminiToolUseEvent
  | GeminiToolResultEvent
  | GeminiResultEvent
  | GeminiErrorEvent;

/**
 * Statistics from Gemini CLI execution.
 */
export interface GeminiStats {
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  cached?: number;
  input?: number;
  duration_ms?: number;
  tool_calls?: number;
}

/**
 * Error metadata for API call errors.
 */
export interface GeminiErrorMetadata {
  code?: string;
  exitCode?: number;
  stderr?: string;
  promptExcerpt?: string;
}
