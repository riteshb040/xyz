import { describe, it, expect } from 'vitest';
import { PromptOrchestratorClient } from '../src/sdk/client';

describe('PromptOrchestratorClient SDK', () => {
  it('instantiates cleanly with options', () => {
    const client = new PromptOrchestratorClient({
      baseUrl: 'http://localhost:4000',
      apiKey: 'orchestrator-secret-key-123',
    });

    expect(client).toBeDefined();
    expect(client.generate).toBeDefined();
    expect(client.chatCompletions).toBeDefined();
  });
});
