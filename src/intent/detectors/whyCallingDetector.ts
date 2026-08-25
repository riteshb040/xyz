import { DetectorResult } from '../types/intent.types';

export function detectWhyCalling(textLower: string): DetectorResult {
  const isWhyCalling =
    textLower.includes('kyo call') ||
    textLower.includes('kyon call') ||
    textLower.includes('kyu call') ||
    textLower.includes('kyun call') ||
    textLower.includes('kyu phone') ||
    textLower.includes('kyon phone') ||
    textLower.includes('kya kaam hai') ||
    textLower.includes('kis liye call') ||
    textLower.includes('kya he re') ||
    textLower.includes('kya hai re') ||
    textLower.includes('kya hai') ||
    textLower.includes('kya he') ||
    textLower.includes('kya baat hai') ||
    textLower.includes('bolo kya') ||
    textLower.includes('kya hua');

  if (isWhyCalling) {
    return {
      matched: true,
      intent: 'QUESTION_ABOUT_DEBT',
      confidence: 0.97,
      entities: {},
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer inquired what the call is about or why they were called',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
