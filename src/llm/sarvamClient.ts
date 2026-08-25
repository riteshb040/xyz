import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface SarvamLLMResponse {
  rawText: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
}

export async function callSarvamLLM(
  promptOrMessages: string | Array<{ role: string; content: string }>,
  systemMessage?: string
): Promise<SarvamLLMResponse> {
  const startTime = Date.now();

  const messages = Array.isArray(promptOrMessages)
    ? promptOrMessages
    : [
        ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
        { role: 'user', content: promptOrMessages },
      ];

  const payload = {
    model: env.SARVAM_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 65,
  };

  let attempts = 0;
  const maxAttempts = 2;
  let lastError: Error | null = null;

  while (attempts < maxAttempts) {
    attempts++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.REQUEST_TIMEOUT_MS);

    try {
      // Mock mode for local testing or when configured with mock key
      if (env.SARVAM_API_KEY === 'mock-sarvam-key-for-testing' || env.SARVAM_API_KEY === 'your-sarvam-key') {
        clearTimeout(timer);
        const latencyMs = Date.now() - startTime;
        logger.info({ latencyMs, attempt: attempts, mock: true }, 'Sarvam AI client operating in mock mode');

        return {
          rawText: JSON.stringify({
            text: "Namaste! Main aapke loan recovery account ke regarding call kar raha hoon. Kya aap aaj payment kar sakte hain?",
            language: "hi-IN",
            suggestedNextAction: "await_customer_reply",
            flags: {
              escalationNeeded: false,
              sentimentDetected: "neutral"
            }
          }),
          latencyMs,
          promptTokens: 450,
          completionTokens: 35,
        };
      }

      const response = await fetch(env.SARVAM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SARVAM_API_KEY}`,
          'api-subscription-key': env.SARVAM_API_KEY,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(
          { status: response.status, errorText, attempt: attempts },
          'Sarvam AI API request returned non-200 status'
        );

        if (response.status >= 500 && attempts < maxAttempts) {
          continue; // Retry once on 5xx
        }

        throw new Error(`Sarvam AI API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as any;
      const rawText =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.text ||
        data.completion ||
        JSON.stringify(data);

      const promptTokens = data.usage?.prompt_tokens;
      const completionTokens = data.usage?.completion_tokens;

      logger.info(
        { latencyMs, promptTokens, completionTokens, attempt: attempts },
        'Sarvam AI LLM call succeeded'
      );

      return {
        rawText,
        latencyMs,
        promptTokens,
        completionTokens,
      };
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      const isAbort = err.name === 'AbortError';
      logger.warn(
        { err: err.message, isTimeout: isAbort, attempt: attempts },
        'Sarvam AI call attempt failed'
      );

      if (attempts < maxAttempts) {
        await new Promise((res) => setTimeout(res, 300));
      }
    }
  }

  throw lastError || new Error('Sarvam AI request failed after retries');
}

export async function callSarvamLLMStream(
  promptOrMessages: string | Array<{ role: string; content: string }>,
  onChunk: (chunk: string) => void,
  systemMessage?: string
): Promise<SarvamLLMResponse> {
  const startTime = Date.now();

  const messages = Array.isArray(promptOrMessages)
    ? promptOrMessages
    : [
        ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
        { role: 'user', content: promptOrMessages },
      ];

  const payload = {
    model: env.SARVAM_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 65,
    stream: true,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.REQUEST_TIMEOUT_MS);

  try {
    if (env.SARVAM_API_KEY === 'mock-sarvam-key-for-testing' || env.SARVAM_API_KEY === 'your-sarvam-key') {
      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;
      const mockText = "Namaste! Main aapke loan recovery account ke regarding call kar raha hoon.";
      onChunk(mockText);
      return {
        rawText: mockText,
        latencyMs,
        promptTokens: 400,
        completionTokens: 20,
      };
    }

    const response = await fetch(env.SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.SARVAM_API_KEY}`,
        'api-subscription-key': env.SARVAM_API_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`Sarvam AI streaming error (${response.status}): ${errorText}`);
    }

    const reader = (response.body as any).getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.text || '';
            if (content) {
              fullText += content;
              onChunk(content);
            }
          } catch (_) {
            // Ignore non-JSON stream ping lines
          }
        }
      }
    }

    const latencyMs = Date.now() - startTime;
    return {
      rawText: fullText,
      latencyMs,
    };
  } catch (err: any) {
    clearTimeout(timer);
    logger.error({ err: err.message }, 'Sarvam AI streaming call failed');
    throw err;
  }
}
