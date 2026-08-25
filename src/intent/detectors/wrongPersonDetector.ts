import { DetectorResult } from '../types/intent.types';

export function detectWrongPerson(textLower: string): DetectorResult {
  // Avoid false positives like "free nahi hu", "ready nahi hu", "pareshan nahi hu"
  const isExcluded =
    textLower.includes('free nahi') ||
    textLower.includes('free nhi') ||
    textLower.includes('busy') ||
    textLower.includes('ready nahi') ||
    textLower.includes('ready nhi') ||
    textLower.includes('pareshan') ||
    textLower.includes('problem');

  if (isExcluded) {
    return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
  }

  // Explicit wrong person statements
  const isWrongPerson =
    textLower.includes('nhi bol rha') ||
    textLower.includes('nahi bol rha') ||
    textLower.includes('nhi bol raha') ||
    textLower.includes('nahi bol raha') ||
    textLower.includes('main rakesh nahi') ||
    textLower.includes('me rakesh nahi') ||
    textLower.includes('me rakesh nhi') ||
    textLower.includes('rakesh nahi bol') ||
    textLower.includes('rakesh nhi bol') ||
    textLower.includes('not rakesh') ||
    textLower.includes('galat aadmi') ||
    textLower.includes('galat vyakti') ||
    textLower.includes('main nahi hoon rakesh') ||
    textLower.includes('me nhi hu rakesh') ||
    textLower.includes('dost hu') ||
    textLower.includes('dost bol') ||
    textLower.includes('papa hu') ||
    textLower.includes('papa bol') ||
    textLower.includes('bhai bol') ||
    textLower.includes('beta bol') ||
    textLower.includes('relative bol') ||
    textLower.includes('wrong person') ||
    textLower.includes('woh yahan nahi') ||
    textLower.includes('wo yahan nhi');

  const isWrongNumber =
    textLower.includes('wrong number') ||
    textLower.includes('galat number') ||
    textLower.includes('galat no') ||
    textLower.includes('wrong no');

  if (isWrongNumber) {
    return {
      matched: true,
      intent: 'WRONG_NUMBER',
      confidence: 0.99,
      entities: {},
      sentiment: 'neutral',
      conversationControl: 'end_call',
      urgency: 'high',
      reason: 'Customer reported wrong phone number',
    };
  }

  if (isWrongPerson) {
    return {
      matched: true,
      intent: 'WRONG_PERSON',
      confidence: 0.98,
      entities: {},
      sentiment: 'neutral',
      conversationControl: 'end_call',
      urgency: 'high',
      reason: 'Customer stated they are not the target borrower or are a relative/third party',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
