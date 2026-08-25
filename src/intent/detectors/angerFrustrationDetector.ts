import { DetectorResult } from '../types/intent.types';

export function detectAngerOrFrustration(textLower: string): DetectorResult {
  const isAngryOrAbusive =
    textLower.includes('bhaad me') ||
    textLower.includes('bhad me') ||
    textLower.includes('dimag mat kharab') ||
    textLower.includes('dimag kharab') ||
    textLower.includes('pareshan mat karo') ||
    textLower.includes('chup raho') ||
    textLower.includes('bakwas') ||
    textLower.includes('bakwaas') ||
    textLower.includes('pagal ho kya') ||
    textLower.includes('sale') ||
    textLower.includes('saale') ||
    textLower.includes('kamine') ||
    textLower.includes('chutiye') ||
    textLower.includes('gandu') ||
    textLower.includes('shut up') ||
    textLower.includes('gussa');

  if (isAngryOrAbusive) {
    return {
      matched: true,
      intent: 'CUSTOMER_ANGER',
      confidence: 0.95,
      entities: {},
      sentiment: 'negative',
      conversationControl: 'continue',
      urgency: 'high',
      reason: 'Customer expressed frustration, anger, or harsh language',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
