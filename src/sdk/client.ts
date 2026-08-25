import { GenerateRequest, GenerateResponse, ChatCompletionsRequest } from '../schemas/request.schema';

export interface ClientOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

export class PromptOrchestratorClient {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs || 10000;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
  }

  /**
   * Main structured prompt generation endpoint.
   */
  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v1/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorJson = (await response.json()) as any;
        throw new Error(errorJson.error || `Request failed with status ${response.status}`);
      }

      return (await response.json()) as GenerateResponse;
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  }

  /**
   * Sarvam AI / OpenAI drop-in compatible chat completions call.
   */
  async chatCompletions(req: ChatCompletionsRequest): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorJson = (await response.json()) as any;
        throw new Error(errorJson.error?.message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  }
}
