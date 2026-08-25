import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../src/prompt/buildPrompt';
import { Campaign } from '../src/schemas/campaign.schema';
import { Agent } from '../src/schemas/agent.schema';

describe('buildPrompt', () => {
  const mockCampaign: Campaign = {
    id: 'loan-default-30day',
    name: '30-Day Loan Default',
    description: 'Reminder',
    goal: 'Remind payment politely',
    requiredVariables: ['customerName', 'debtAmount'],
    optionalVariables: ['dueDate'],
    scriptFlow: ['Greet customer', 'State purpose'],
    constraints: ['No legal threats'],
    escalationTriggers: ['Disputes debt'],
  };

  const mockAgent: Agent = {
    id: 'polite-reminder',
    name: 'Polite Reminder',
    persona: 'You are a courteous recovery assistant.',
    behavioralRules: ['Address by name', 'Be polite'],
    languageRules: {
      primary: 'hi-IN',
      fallback: 'en-IN',
      tone: 'respectful',
      notes: 'Hinglish style',
    },
    outputRules: {
      format: 'json',
      maxSentences: 3,
      mustInclude: ['Direct acknowledgement'],
      mustAvoid: ['Legal threats'],
    },
  };

  it('assembles sections in the correct deterministic order', () => {
    const { fullPrompt } = buildPrompt(
      mockCampaign,
      mockAgent,
      { customerName: 'Rakesh', debtAmount: 5000 },
      [{ role: 'user', content: 'Haan bolo' }]
    );

    expect(fullPrompt).toContain('# MASTER SYSTEM PROMPT');
    expect(fullPrompt).toContain('# 1. CORE CHARACTER');
    expect(fullPrompt).toContain('# 2. CHARACTER CONSISTENCY');
    expect(fullPrompt).toContain('# 7. PRIMARY CONVERSATION OBJECTIVE');
    expect(fullPrompt).toContain('# 10. SPEAKING STYLE & VOICE PERSONA');
    expect(fullPrompt).toContain('# 11. CUSTOMER FACTS & STATE');
    expect(fullPrompt).toContain('# 12. RECENT CONVERSATION HISTORY');
    expect(fullPrompt).toContain('# 13. OUTPUT CONTRACT');

    // Section ordering verification
    const masterIdx = fullPrompt.indexOf('# MASTER SYSTEM PROMPT');
    const characterIdx = fullPrompt.indexOf('# 1. CORE CHARACTER');
    const historyIdx = fullPrompt.indexOf('# 12. RECENT CONVERSATION HISTORY');

    expect(masterIdx).toBeLessThan(characterIdx);
    expect(characterIdx).toBeLessThan(historyIdx);
  });
});
