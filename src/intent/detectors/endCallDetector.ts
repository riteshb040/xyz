import { DetectorResult } from '../types/intent.types';

export function detectEndCallRequest(textLower: string): DetectorResult {
  const isEndCall =
    textLower.includes('call rakh') ||
    textLower.includes('phone rakh') ||
    textLower.includes('rakh phone') ||
    textLower.includes('rakh call') ||
    textLower.includes('phone kat') ||
    textLower.includes('call kat') ||
    textLower.includes('phone cut') ||
    textLower.includes('call cut') ||
    textLower.includes('cut kar') ||
    textLower.includes('kat kar') ||
    textLower.includes('kat do') ||
    textLower.includes('cut do') ||
    textLower.includes('cut kardo') ||
    textLower.includes('kat kardo') ||
    textLower.includes('baat nahi karni') ||
    textLower.includes('baat nhi karni') ||
    textLower.includes('baat mat karo') ||
    textLower.includes("don't call") ||
    textLower.includes('dont call') ||
    textLower.includes('stop calling') ||
    textLower.includes('bas rakho') ||
    textLower.includes('phone band') ||
    textLower.includes('disconnect') ||
    textLower.includes('hang up') ||
    textLower === 'bye' ||
    textLower === 'goodbye' ||
    textLower === 'alvida';

  const isDoNotCall =
    textLower.includes('do not call') ||
    textLower.includes('dnc') ||
    textLower.includes('kabhi call mat karna') ||
    textLower.includes('dobara call mat karna') ||
    textLower.includes('phir se call mat karna');

  if (isDoNotCall) {
    return {
      matched: true,
      intent: 'DO_NOT_CALL',
      confidence: 0.99,
      entities: {},
      sentiment: 'negative',
      conversationControl: 'end_call',
      urgency: 'high',
      reason: 'Customer explicitly demanded to be put on Do Not Call list',
    };
  }

  if (isEndCall) {
    return {
      matched: true,
      intent: 'END_CALL_REQUEST',
      confidence: 0.98,
      entities: {},
      sentiment: 'negative',
      conversationControl: 'end_call',
      urgency: 'high',
      reason: 'Customer requested to end the phone call immediately',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
