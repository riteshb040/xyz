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

  it('parses valid JSON string output correctly', () => {
    const raw = JSON.stringify({
      text: 'Namaste Rakesh ji, aapka payment baki hai.',
      language: 'hi-IN',
      suggestedNextAction: 'await_customer_reply',
      flags: { escalationNeeded: false, sentimentDetected: 'neutral' },
    });

    const result = postProcessOutput(raw, mockAgent);
    expect(result.text).toBe('Namaste Rakesh ji, aapka payment baki hai.');
    expect(result.flags.escalationNeeded).toBe(false);
  });

  it('wraps plain text string into structured shape if model fails to output valid JSON', () => {
    const raw = 'Namaste Rakesh ji, please pay today.';
    const result = postProcessOutput(raw, mockAgent);
    expect(result.text).toBe('Namaste Rakesh ji, please pay today.');
    expect(result.language).toBe('hi-IN');
  });

  it('strips markdown code block formatting automatically', () => {
    const raw = `\`\`\`json
{
  "text": "Hello Rakesh",
  "language": "hi-IN",
  "suggestedNextAction": "await_customer_reply",
  "flags": { "escalationNeeded": false, "sentimentDetected": "neutral" }
}
\`\`\``;

    const result = postProcessOutput(raw, mockAgent);
    expect(result.text).toBe('Hello Rakesh');
  });
});
