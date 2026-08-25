import { DetectorResult } from '../types/intent.types';

export function detectBusyOrUnavailable(textLower: string): DetectorResult {
  const isBusy =
    textLower.includes('free nahi') ||
    textLower.includes('free nhi') ||
    textLower.includes('busy hu') ||
    textLower.includes('busy hoon') ||
    textLower.includes('driving') ||
    textLower.includes('drive kar') ||
    textLower.includes('meeting') ||
    textLower.includes('office me') ||
    textLower.includes('baad me aayega') ||
    textLower.includes('baad mein aayega') ||
    textLower.includes('2 min ke bad') ||
    textLower.includes('2 minute') ||
    textLower.includes('thodi der me') ||
    textLower.includes('hospital me') ||
    textLower.includes('abhi time nahi');

  if (isBusy) {
    return {
      matched: true,
      intent: 'CALLBACK_REQUEST',
      confidence: 0.96,
      entities: { callbackDate: 'thodi der baad' },
      sentiment: 'neutral',
      conversationControl: 'callback',
      urgency: 'normal',
      reason: 'Customer is currently occupied, driving, or in meeting',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
