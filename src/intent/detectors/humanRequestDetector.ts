import { DetectorResult } from '../types/intent.types';

export function detectHumanRequest(textLower: string): DetectorResult {
  const isHuman =
    textLower.includes('manager') ||
    textLower.includes('human') ||
    textLower.includes('supervisor') ||
    textLower.includes('senior') ||
    textLower.includes('aadmi') ||
    textLower.includes('bande se') ||
    textLower.includes('baat karao') ||
    textLower.includes('baat karvao') ||
    textLower.includes('transfer karo');

  if (isHuman) {
    return {
      matched: true,
      intent: 'CUSTOMER_REQUESTS_HUMAN',
      confidence: 0.99,
      entities: {},
      sentiment: 'neutral',
      conversationControl: 'human_handoff',
      urgency: 'high',
      reason: 'Customer explicitly requested a human supervisor or manager',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
