import { DetectorResult } from '../types/intent.types';

export function detectAcknowledgment(textLower: string): DetectorResult {
  const isAck =
    textLower === 'ok' ||
    textLower === 'okay' ||
    textLower === 'theek hai' ||
    textLower === 'thik h' ||
    textLower === 'thik hai' ||
    textLower === 'haan' ||
    textLower === 'han' ||
    textLower === 'yes' ||
    textLower === 'achha' ||
    textLower === 'acha' ||
    textLower === 'bolo' ||
    textLower === 'suno' ||
    textLower === 'batao' ||
    textLower === 'sure' ||
    textLower === 'hm' ||
    textLower === 'hmm';

  if (isAck) {
    return {
      matched: true,
      intent: 'GREETING',
      confidence: 0.95,
      entities: {},
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'low',
      reason: 'Customer gave neutral acknowledgment to continue conversation',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
