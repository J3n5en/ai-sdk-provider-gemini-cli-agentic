# Gemini CLI Agentic Provider Examples

This folder showcases how to use the AI SDK Gemini CLI Agentic provider in practical scenarios. Each example is small, focused, and explains why it matters.

## Prerequisites

- Install and authenticate the Gemini CLI:
  - `npm i -g @anthropic-ai/gemini` or use `npx @google/gemini-cli`
  - Run `gemini` once to authenticate via OAuth
- Build the provider: `npm run build`

The provider is Node-only (it spawns a process), so run these in a Node environment (not Edge).

## How To Run

Run any example from the repo root:

```bash
npm run build
node examples/<file>.mjs
```

## Core Usage

- **basic-usage.mjs:** Minimal generation
  - Purpose: Prove setup works and show the smallest possible call.
  - Demonstrates: `generateText`, provider wiring, safe defaults.
  - Value: Quick sanity check to confirm your environment is correct.

- **streaming.mjs:** Stream responses
  - Purpose: Show the AI SDK streaming API shape.
  - Demonstrates: Reading `textStream` and rendering as chunks.
  - Value: Build responsive UIs with real-time output.

- **conversation-history.mjs:** Maintain context
  - Purpose: Keep multi-turn state using a message array.
  - Demonstrates: AI SDK message roles (`user`, `assistant`).
  - Value: Realistic chat patterns where prior turns matter.

- **custom-config.mjs:** Configure runtime
  - Purpose: Customize CWD and autonomy/sandbox policies per run.
  - Demonstrates: `cwd`, `approvalMode`, `sandbox`, `includeDirectories`.
  - Value: Balance safety vs. friction for local dev or CI use.

- **permissions-and-sandbox.mjs:** Compare modes
  - Purpose: Understand autonomy levels and sandbox modes.
  - Demonstrates: `default`, `auto_edit`, `yolo` approval modes and `sandbox` option.
  - Value: Pick the right guardrails for your workflow.

## Tool Streaming

**Note:** Gemini CLI executes tools autonomously, so the provider sets `providerExecuted: true` on all tool calls. This means the AI SDK will not attempt to execute tools—it simply receives the results from Gemini CLI.

- **streaming-tool-calls.mjs:** Tool streaming with Gemini CLI
  - Purpose: Demonstrate tool streaming API with Gemini CLI tool execution.
  - Demonstrates: `tool-call`, `tool-result` events for shell commands and file operations.
  - Value: See how tool invocation and results flow through the AI SDK streaming interface.

## Reliability & Operations

- **long-running-tasks.mjs:** Abort and timeouts
  - Purpose: Cancel long operations cleanly.
  - Demonstrates: `AbortController` with AI SDK calls.
  - Value: Keep apps responsive and prevent runaway tasks.

- **error-handling.mjs:** Catch and classify errors
  - Purpose: Handle auth and general failures gracefully.
  - Demonstrates: Using `isAuthenticationError`, reading provider warnings.
  - Value: User-friendly errors and robust UX.

- **check-cli.mjs:** Troubleshoot setup
  - Purpose: Verify Gemini CLI binary and authentication status.
  - Demonstrates: Calling `gemini --version` and checking auth.
  - Value: Quick diagnosis for PATH/auth issues.

## Logging

- **logging-default.mjs:** Default logging behavior
  - Purpose: Show the default non-verbose logging mode.
  - Demonstrates: Only warn and error messages are logged.
  - Value: Clean output for production.

- **logging-verbose.mjs:** Verbose mode for debugging
  - Purpose: Enable detailed execution logs for troubleshooting.
  - Demonstrates: All log levels with full visibility.
  - Value: Development and debugging.

- **logging-custom-logger.mjs:** Custom logger integration
  - Purpose: Integrate with external logging systems.
  - Demonstrates: Custom logger object with timestamps.
  - Value: Route logs to your observability stack.

- **logging-disabled.mjs:** Silent operation
  - Purpose: Completely disable all provider logging.
  - Demonstrates: Setting `logger: false`.
  - Value: Production scenarios where logs interfere with output.

## Suggested Run Order

1. `check-cli.mjs` → Verify setup
2. `basic-usage.mjs` → `streaming.mjs` → `conversation-history.mjs`
3. `custom-config.mjs` → `permissions-and-sandbox.mjs`
4. `streaming-tool-calls.mjs` → Tool streaming
5. `logging-verbose.mjs` → `logging-custom-logger.mjs` → `logging-disabled.mjs`
6. `long-running-tasks.mjs` → `error-handling.mjs`

## Troubleshooting

- Not getting output? Run `node examples/check-cli.mjs`.
- Auth failures? Run `gemini` once to authenticate via OAuth.
- Model not found? Use `auto` or a valid Gemini model like `gemini-2.5-flash`.

## Approval Modes

| Mode | Description |
|------|-------------|
| `default` | Prompt for approval on potentially dangerous operations |
| `auto_edit` | Auto-approve file edits, prompt for shell commands |
| `yolo` | Auto-approve everything (use with caution!) |

## Sandbox Mode

When `sandbox: true` is set, Gemini CLI runs in a restricted environment that limits file system access and command execution. This is recommended for untrusted prompts.
