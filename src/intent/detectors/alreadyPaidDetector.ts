import { DetectorResult } from '../types/intent.types';

export function detectAlreadyPaid(textLower: string): DetectorResult {
  const isAlreadyPaid =
    textLower.includes('already paid') ||
    textLower.includes('payment kar diya') ||
    textLower.includes('paise de diye') ||
    textLower.includes('payment ho gaya') ||
    textLower.includes('maine bhar diya') ||
    textLower.includes('pay kar diya') ||
    textLower.includes('pehle se pay');

  if (isAlreadyPaid) {
    return {
      matched: true,
      intent: 'ALREADY_PAID',
      confidence: 0.98,
      entities: {},
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer claims payment has already been completed',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
