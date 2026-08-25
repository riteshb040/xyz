import { DetectorResult } from '../types/intent.types';

export function detectCallbackRequest(textLower: string): DetectorResult {
  const isCallbackPhrase =
    textLower.includes('call karna') ||
    textLower.includes('call karo') ||
    textLower.includes('baat karna') ||
    textLower.includes('baat karo') ||
    textLower.includes('call karle') ||
    textLower.includes('busy') ||
    textLower.includes('sone de') ||
    textLower.includes('sone do') ||
    textLower.includes('sore hai') ||
    textLower.includes('later call') ||
    textLower.includes('call later') ||
    textLower.includes('baad mein') ||
    textLower.includes('bad me');

  const hasDateMention =
    textLower.includes('kal') ||
    textLower.includes('parso') ||
    textLower.includes('shaam') ||
    textLower.includes('tomorrow') ||
    textLower.includes('next week') ||
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(textLower);

  if (isCallbackPhrase || (hasDateMention && (textLower.includes('call') || textLower.includes('baat')))) {
    let callbackDate: string | null = null;
    if (textLower.includes('kal')) callbackDate = 'kal (tomorrow)';
    else if (textLower.includes('parso')) callbackDate = 'parso (day after tomorrow)';
    else if (textLower.includes('shaam')) callbackDate = 'shaam (evening)';
    else if (textLower.includes('tomorrow')) callbackDate = 'tomorrow';

    let callbackTime: string | null = null;
    const timeMatch = textLower.match(/\b(\d{1,2})\s*(baje|pm|am)\b/);
    if (timeMatch) {
      callbackTime = `${timeMatch[1]} ${timeMatch[2]}`;
    }

    return {
      matched: true,
      intent: 'CALLBACK_REQUEST',
      confidence: 0.98,
      entities: { callbackDate, callbackTime },
      sentiment: 'neutral',
      conversationControl: 'callback',
      urgency: 'normal',
      reason: 'Customer explicitly requested callback or indicated unavailability',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
