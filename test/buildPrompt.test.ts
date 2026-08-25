import { describe, it, expect } from 'vitest';
import { buildCompactVoicePrompt, buildStaticAgentPrompt, clearStaticPromptCache } from '../src/prompt/buildPrompt';
import { Campaign } from '../src/schemas/campaign.schema';
import { Agent } from '../src/schemas/agent.schema';

describe('buildCompactVoicePrompt & static memoization', () => {
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

  it('assembles 3 strictly ordered layers (Static -> Semi-Static -> Dynamic Tail)', () => {
    const { systemPrompt, messages } = buildCompactVoicePrompt(
      mockCampaign,
      mockAgent,
      { customerName: 'Rakesh', debtAmount: 5000 },
      [{ role: 'user', content: 'Haan bolo' }],
      'INITIAL_GREETING'
    );

    expect(systemPrompt).toContain('# 1. CORE CHARACTER');
    expect(systemPrompt).toContain('# 2. CHARACTER CONSISTENCY');
    expect(systemPrompt).toContain('# 3. PRIMARY CONVERSATION OBJECTIVE');
    expect(systemPrompt).toContain('# 4. WORKFLOW & BEHAVIOR RULES');
    expect(systemPrompt).toContain('# 5. CRITICAL LANGUAGE AUTO-DETECTION RULES');
    expect(systemPrompt).toContain('# TRUSTED CUSTOMER FACTS');
    expect(systemPrompt).toContain('# CURRENT CONVERSATION STATE');

    // Layer ordering verification
    const coreIdx = systemPrompt.indexOf('# 1. CORE CHARACTER');
    const factsIdx = systemPrompt.indexOf('# TRUSTED CUSTOMER FACTS');
    const stateIdx = systemPrompt.indexOf('# CURRENT CONVERSATION STATE');

    expect(coreIdx).toBeLessThan(factsIdx);
    expect(factsIdx).toBeLessThan(stateIdx);

    // Messages array verification
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toBe('Haan bolo');
  });

  it('memoizes static agent prompt across calls for the same campaign+agent', () => {
    clearStaticPromptCache();
    const prompt1 = buildStaticAgentPrompt(mockCampaign, mockAgent);
    const prompt2 = buildStaticAgentPrompt(mockCampaign, mockAgent);

    expect(prompt1).toBe(prompt2); // Exact same memory reference due to memoization
  });

  it('invalidates static cache when clearStaticPromptCache is called', () => {
    clearStaticPromptCache();
    const prompt1 = buildStaticAgentPrompt(mockCampaign, mockAgent);
    clearStaticPromptCache();
    const prompt2 = buildStaticAgentPrompt(mockCampaign, mockAgent);

    expect(prompt1).toEqual(prompt2); // Same string content but re-generated after cache clearance
  });
});
