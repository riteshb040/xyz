import { describe, it, expect } from 'vitest';
import { postProcessOutput } from '../src/llm/postProcess';
import { Agent } from '../src/schemas/agent.schema';

describe('postProcessOutput', () => {
  const mockAgent: Agent = {
    id: 'polite-reminder',
    name: 'Polite Reminder',
    persona: 'Polite agent',
    behavioralRules: ['Polite'],
    languageRules: {
      primary: 'hi-IN',
      fallback: 'en-IN',
      tone: 'respectful',
      notes: 'Hinglish',
    },
    outputRules: {
      format: 'json',
      maxSentences: 3,
      mustInclude: [],
      mustAvoid: ['legal threats'],
    },
  };

  it('voice mode treats rawText directly as spoken text without trying JSON.parse', () => {
    const raw = 'Namaste Rakesh ji, aapka payment baki hai.';
    const result = postProcessOutput(raw, mockAgent, 'voice');
    expect(result.text).toBe('Namaste Rakesh ji, aapka payment baki hai.');
    expect(result.language).toBe('hi-IN');
  });

  it('voice mode redacts mustAvoid keywords from plain spoken text', () => {
    const raw = 'Namaste Rakesh ji, legal threats nahi karenge.';
    const result = postProcessOutput(raw, mockAgent, 'voice');
    expect(result.text).toBe('Namaste Rakesh ji, [redacted] nahi karenge.');
  });

  it('structured mode parses valid JSON string output correctly', () => {
    const raw = JSON.stringify({
      text: 'Namaste Rakesh ji, aapka payment baki hai.',
      language: 'hi-IN',
      suggestedNextAction: 'await_customer_reply',
      flags: { escalationNeeded: false, sentimentDetected: 'neutral' },
    });

    const result = postProcessOutput(raw, mockAgent, 'structured');
    expect(result.text).toBe('Namaste Rakesh ji, aapka payment baki hai.');
    expect(result.flags.escalationNeeded).toBe(false);
  });
});
