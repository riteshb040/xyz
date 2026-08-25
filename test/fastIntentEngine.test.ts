import { describe, it, expect } from 'vitest';
import { matchFastIntent } from '../src/prompt/fastIntentEngine';
import { Campaign } from '../src/schemas/campaign.schema';
import { Agent } from '../src/schemas/agent.schema';

describe('Fast Intent Engine (Refactored Modular Engine)', () => {
  const mockCampaign: Campaign = {
    id: 'loan-default-30day',
    name: '30-Day Default',
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
    persona: 'Courteous recovery assistant',
    behavioralRules: ['Be polite'],
    languageRules: {
      primary: 'hi-IN',
      fallback: 'en-IN',
      tone: 'respectful',
      notes: 'Hinglish style',
    },
    outputRules: {
      format: 'json',
      maxSentences: 3,
      mustInclude: [],
      mustAvoid: [],
    },
  };

  const mockVars = { customerName: 'Rakesh Sharma', debtAmount: 24500 };

  it('classifies callback requests accurately', () => {
    const res1 = matchFastIntent('kal call karna', mockCampaign, mockAgent, mockVars);
    expect(res1.intent).toBe('CALLBACK_REQUEST');
    expect(res1.suggestedNextAction).toBe('request_callback');

    const res2 = matchFastIntent('nhi re kal call karna muje sone de', mockCampaign, mockAgent, mockVars);
    expect(res2.intent).toBe('CALLBACK_REQUEST');
  });

  it('classifies end call and do not call requests', () => {
    const res1 = matchFastIntent('are call rakh muje bat nhi karni', mockCampaign, mockAgent, mockVars);
    expect(res1.intent).toBe('END_CALL_REQUEST');
    expect(res1.suggestedNextAction).toBe('close_call');

    const res2 = matchFastIntent('kabhi call mat karna', mockCampaign, mockAgent, mockVars);
    expect(res2.intent).toBe('DO_NOT_CALL');
  });

  it('classifies wrong person and relative responses', () => {
    const res1 = matchFastIntent('main Rakesh nahi hoon', mockCampaign, mockAgent, mockVars);
    expect(res1.intent).toBe('WRONG_PERSON');
    expect(res1.suggestedNextAction).toBe('close_call');

    const res2 = matchFastIntent('are me rakhesh ka papa bol rha hu', mockCampaign, mockAgent, mockVars);
    expect(res2.intent).toBe('WRONG_PERSON');
  });

  it('classifies consequence questions without converting to refusal', () => {
    const res = matchFastIntent('payment na karu to kya karoge?', mockCampaign, mockAgent, mockVars);
    expect(res.intent).toBe('QUESTION_ABOUT_NON_PAYMENT_CONSEQUENCES');
    expect(res.text).not.toContain('fake SMS');
  });

  it('classifies discount requests without claiming approval', () => {
    const res = matchFastIntent('mujhe discount mil sakta hai?', mockCampaign, mockAgent, mockVars);
    expect(res.intent).toBe('DISCOUNT_REQUEST');
    expect(res.text).not.toContain('SMS kar diya');
  });

  it('classifies sarcasm and invalid past years', () => {
    const res = matchFastIntent('me 2020 me tuje call karta hu', mockCampaign, mockAgent, mockVars);
    expect(res.intent).toBe('CUSTOMER_SARCASM');
  });

  it('classifies negation phrase commitment correctly', () => {
    const res = matchFastIntent('nahi nahi, Friday ko kar dunga', mockCampaign, mockAgent, mockVars);
    expect(res.intent).toBe('PAYMENT_COMMITMENT');
    expect(res.suggestedNextAction).toBe('close_call');
  });

  it('handles the exact critical sequence from Task Rule 42', () => {
    // 1. "nhi re kal call karna muje sone de" -> CALLBACK_REQUEST
    const turn1 = matchFastIntent('nhi re kal call karna muje sone de', mockCampaign, mockAgent, mockVars);
    expect(turn1.intent).toBe('CALLBACK_REQUEST');

    // 2. "are call rakh muje bat nhi karni" -> END_CALL_REQUEST
    const turn2 = matchFastIntent('are call rakh muje bat nhi karni', mockCampaign, mockAgent, mockVars);
    expect(turn2.intent).toBe('END_CALL_REQUEST');

    // 3. "me 2020 me tuje call karta hu" -> CUSTOMER_SARCASM
    const turn3 = matchFastIntent('me 2020 me tuje call karta hu', mockCampaign, mockAgent, mockVars);
    expect(turn3.intent).toBe('CUSTOMER_SARCASM');

    // 4. "payment na karu to kya karoge?" -> QUESTION_ABOUT_NON_PAYMENT_CONSEQUENCES
    const turn4 = matchFastIntent('payment na karu to kya karoge?', mockCampaign, mockAgent, mockVars);
    expect(turn4.intent).toBe('QUESTION_ABOUT_NON_PAYMENT_CONSEQUENCES');

    // 5. "mujhe discount mil sakta hai?" -> DISCOUNT_REQUEST
    const turn5 = matchFastIntent('mujhe discount mil sakta hai?', mockCampaign, mockAgent, mockVars);
    expect(turn5.intent).toBe('DISCOUNT_REQUEST');
  });
});
