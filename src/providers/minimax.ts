import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Provider, ProviderRunOptions, ProviderMessage, ProviderAuthStatus, ProviderQueryResult } from './types.js';

// ── File paths ──────────────────────────────────────────────────────
const DORABOT_DIR = join(homedir(), '.dorabot');
const KEY_FILE = join(DORABOT_DIR, '.minimax-key');

const DEFAULT_BASE_URL = 'https://api.minimax.io/v1';
const DEFAULT_MODEL = 'MiniMax-M1';

// ── API key helpers ─────────────────────────────────────────────────
function loadPersistedKey(): string | undefined {
  try {
    if (existsSync(KEY_FILE)) {
      const key = readFileSync(KEY_FILE, 'utf-8').trim();
      if (key) return key;
    }
  } catch { /* ignore */ }
  return undefined;
}

function persistKey(apiKey: string): void {
  try {
    mkdirSync(DORABOT_DIR, { recursive: true });
    writeFileSync(KEY_FILE, apiKey, { mode: 0o600 });
    chmodSync(KEY_FILE, 0o600);
  } catch (err) {
    console.error('[minimax] failed to persist API key:', err);
  }
}

function getApiKey(): string | undefined {
  return process.env.MINIMAX_API_KEY || loadPersistedKey();
}

async function validateApiKey(apiKey: string, baseUrl: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (res.status === 200) return { valid: true };
    if (res.status === 401) return { valid: false, error: 'Invalid API key' };
    if (res.status === 403) return { valid: false, error: 'API key lacks permissions' };
    // Some OpenAI-compatible APIs don't have /models - treat as valid if we get any response
    if (res.status === 404) return { valid: true };
    return { valid: false, error: `Unexpected status ${res.status}` };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export function hasMiniMaxAuth(): boolean {
  return !!getApiKey();
}

// ── SSE stream parser ───────────────────────────────────────────────

async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<Record<string, unknown>, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          yield JSON.parse(data);
        } catch { /* skip malformed chunks */ }
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith('data: ') && trimmed.slice(6) !== '[DONE]') {
      try {
        yield JSON.parse(trimmed.slice(6));
      } catch { /* skip */ }
    }
  }
}

// ── Provider ────────────────────────────────────────────────────────

export class MiniMaxProvider implements Provider {
  readonly name = 'minimax';

  constructor() {
    // Load persisted API key into env if not already set
    if (!process.env.MINIMAX_API_KEY) {
      const saved = loadPersistedKey();
      if (saved) process.env.MINIMAX_API_KEY = saved;
    }
  }

  async checkReady(): Promise<{ ready: boolean; reason?: string }> {
    const status = await this.getAuthStatus();
    if (!status.authenticated) {
      return { ready: false, reason: status.error || 'Not authenticated.' };
    }
    return { ready: true };
  }

  async getAuthStatus(): Promise<ProviderAuthStatus> {
    const apiKey = getApiKey();
    if (apiKey) {
      return { authenticated: true, method: 'api_key', identity: 'MiniMax API key' };
    }
    return { authenticated: false, error: 'Not authenticated. Provide a MiniMax API key via provider.auth.apiKey or MINIMAX_API_KEY env.' };
  }

  async loginWithApiKey(apiKey: string): Promise<ProviderAuthStatus> {
    const baseUrl = DEFAULT_BASE_URL;
    const v = await validateApiKey(apiKey, baseUrl);
    if (!v.valid) {
      return { authenticated: false, method: 'api_key', error: v.error };
    }
    process.env.MINIMAX_API_KEY = apiKey;
    persistKey(apiKey);
    return { authenticated: true, method: 'api_key', identity: 'MiniMax API key' };
  }

  // MiniMax doesn't support OAuth
  // loginWithOAuth and completeOAuthLogin intentionally not implemented

  async *query(opts: ProviderRunOptions): AsyncGenerator<ProviderMessage, ProviderQueryResult, unknown> {
    const mmConfig = opts.config.provider?.minimax;
    const model = mmConfig?.model || DEFAULT_MODEL;
    const baseUrl = mmConfig?.baseUrl || DEFAULT_BASE_URL;
    const apiKey = getApiKey();

    if (!apiKey) {
      yield {
        type: 'result',
        subtype: 'error_max_turns',
        result: 'MiniMax API key not configured.',
        session_id: '',
      } as ProviderMessage;
      return { result: 'MiniMax API key not configured.', sessionId: '', usage: { inputTokens: 0, outputTokens: 0, totalCostUsd: 0 } };
    }

    const sessionId = `minimax-${Date.now()}`;

    // Emit init event
    yield {
      type: 'system',
      subtype: 'init',
      session_id: sessionId,
      model,
    } as ProviderMessage;

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [];
    if (opts.systemPrompt) {
      messages.push({ role: 'system', content: opts.systemPrompt });
    }
    messages.push({ role: 'user', content: opts.prompt });

    // Build request body - OpenAI-compatible with MiniMax extensions
    const body: Record<string, unknown> = {
      model,
      messages,
      stream: true,
    };

    console.log(`[minimax] starting query: model=${model} baseUrl=${baseUrl}`);

    const abort = opts.abortController || new AbortController();

    let result = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let reasoningText = '';

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: abort.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        const errMsg = `MiniMax API error: ${res.status} ${errBody}`;
        console.error(`[minimax] ${errMsg}`);
        yield {
          type: 'result',
          subtype: 'error_max_turns',
          result: errMsg,
          session_id: sessionId,
        } as ProviderMessage;
        return { result: errMsg, sessionId, usage: { inputTokens: 0, outputTokens: 0, totalCostUsd: 0 } };
      }

      if (!res.body) {
        const errMsg = 'MiniMax API returned no body';
        yield {
          type: 'result',
          subtype: 'error_max_turns',
          result: errMsg,
          session_id: sessionId,
        } as ProviderMessage;
        return { result: errMsg, sessionId, usage: { inputTokens: 0, outputTokens: 0, totalCostUsd: 0 } };
      }

      const reader = res.body.getReader();
      let textBlockStarted = false;
      let reasoningBlockStarted = false;

      // Helper to emit Claude-compatible stream events
      const se = (ev: Record<string, unknown>): ProviderMessage =>
        ({ type: 'stream_event', event: ev } as ProviderMessage);

      for await (const chunk of parseSSEStream(reader)) {
        const choices = chunk.choices as Array<Record<string, unknown>> | undefined;
        if (!choices?.length) {
          // Check for usage in final chunk
          if (chunk.usage) {
            const u = chunk.usage as Record<string, number>;
            inputTokens = u.prompt_tokens || 0;
            outputTokens = u.completion_tokens || 0;
          }
          continue;
        }

        const choice = choices[0]!;
        const delta = choice.delta as Record<string, unknown> | undefined;
        if (!delta) continue;

        // Handle reasoning content (MiniMax uses reasoning_content field)
        const reasoningDelta = delta.reasoning_content as string | undefined;
        if (reasoningDelta) {
          if (!reasoningBlockStarted) {
            reasoningBlockStarted = true;
            yield se({ type: 'content_block_start', content_block: { type: 'thinking' } });
          }
          reasoningText += reasoningDelta;
          yield se({ type: 'content_block_delta', delta: { type: 'thinking_delta', thinking: reasoningDelta } });
        }

        // Handle text content
        const contentDelta = delta.content as string | undefined;
        if (contentDelta) {
          // Close reasoning block if switching to text
          if (reasoningBlockStarted && !textBlockStarted) {
            yield se({ type: 'content_block_stop' });
            reasoningBlockStarted = false;
            yield {
              type: 'assistant',
              message: { role: 'assistant', content: [{ type: 'thinking', thinking: reasoningText }] },
            } as ProviderMessage;
          }

          if (!textBlockStarted) {
            textBlockStarted = true;
            yield se({ type: 'content_block_start', content_block: { type: 'text' } });
          }
          result += contentDelta;
          yield se({ type: 'content_block_delta', delta: { type: 'text_delta', text: contentDelta } });
        }

        // Handle finish
        if (choice.finish_reason) {
          if (reasoningBlockStarted) {
            yield se({ type: 'content_block_stop' });
            reasoningBlockStarted = false;
            if (reasoningText) {
              yield {
                type: 'assistant',
                message: { role: 'assistant', content: [{ type: 'thinking', thinking: reasoningText }] },
              } as ProviderMessage;
            }
          }
          if (textBlockStarted) {
            yield se({ type: 'content_block_stop' });
            textBlockStarted = false;
          }
        }

        // Usage from chunk
        if (chunk.usage) {
          const u = chunk.usage as Record<string, number>;
          inputTokens = u.prompt_tokens || 0;
          outputTokens = u.completion_tokens || 0;
        }
      }

      // Close any open blocks
      if (reasoningBlockStarted) {
        yield se({ type: 'content_block_stop' });
        if (reasoningText) {
          yield {
            type: 'assistant',
            message: { role: 'assistant', content: [{ type: 'thinking', thinking: reasoningText }] },
          } as ProviderMessage;
        }
      }
      if (textBlockStarted) {
        yield se({ type: 'content_block_stop' });
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.log('[minimax] query aborted');
      } else {
        const errMsg = `MiniMax error: ${err?.message || err}`;
        console.error(`[minimax] ${errMsg}`);
        yield {
          type: 'result',
          subtype: 'error_max_turns',
          result: errMsg,
          session_id: sessionId,
        } as ProviderMessage;
        return { result: errMsg, sessionId, usage: { inputTokens: 0, outputTokens: 0, totalCostUsd: 0 } };
      }
    }

    // Final assistant message
    if (result) {
      yield {
        type: 'assistant',
        message: { role: 'assistant', content: [{ type: 'text', text: result }] },
      } as ProviderMessage;
    }

    // Emit result
    yield {
      type: 'result',
      result,
      session_id: sessionId,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      },
      total_cost_usd: 0,
    } as ProviderMessage;

    return {
      result,
      sessionId,
      usage: {
        inputTokens,
        outputTokens,
        totalCostUsd: 0,
      },
    };
  }
}
