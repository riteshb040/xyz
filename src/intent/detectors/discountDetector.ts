import { DetectorResult } from '../types/intent.types';

export function detectDiscountOrSettlement(textLower: string): DetectorResult {
  const isSettlement = textLower.includes('settlement') || textLower.includes('ots') || textLower.includes('one time');

  const isDiscount =
    textLower.includes('discount') ||
    textLower.includes('kam karo') ||
    textLower.includes('kam kar') ||
    textLower.includes('waiver') ||
    textLower.includes('chhoot');

  if (isSettlement) {
    return {
      matched: true,
      intent: 'SETTLEMENT_REQUEST',
      confidence: 0.98,
      entities: { settlementRequested: true },
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer inquired about one-time settlement',
    };
  }

  if (isDiscount) {
    return {
      matched: true,
      intent: 'DISCOUNT_REQUEST',
      confidence: 0.96,
      entities: { discountRequested: true },
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer inquired about payment discount or waiver options',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
