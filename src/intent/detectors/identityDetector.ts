import { DetectorResult } from '../types/intent.types';

export function detectIdentityQuery(textLower: string): DetectorResult {
  const isNameQuery =
    textLower.includes('mera name') ||
    textLower.includes('mera naam') ||
    textLower.includes('name kya') ||
    textLower.includes('naam kya');

  const isWhoIsCalling =
    textLower.includes('kaun bol raha') ||
    textLower.includes('kaun hai') ||
    textLower.includes('kaha se') ||
    textLower.includes('who is this');

  if (isNameQuery) {
    return {
      matched: true,
      intent: 'IDENTITY_QUESTION',
      confidence: 0.98,
      entities: {},
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer asked what their registered name is in the system',
    };
  }

  if (isWhoIsCalling) {
    return {
      matched: true,
      intent: 'WHO_IS_CALLING',
      confidence: 0.97,
      entities: {},
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer asked who is calling or representing which organization',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
