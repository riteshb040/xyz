import { DetectorResult } from '../types/intent.types';

export function detectJokeOrSarcasm(textLower: string): DetectorResult {
  // Check for past year mentions (e.g. 2020, 2021)
  const pastYearMatch = textLower.match(/\b(20[0-2][0-5]|19\d\d)\b/);

  // Check for absurd future timelines (e.g. 100 saal, 50 saal, agle janam)
  const absurdTimeMatch = textLower.includes('100 saal') || textLower.includes('agle janam') || textLower.includes('duniya khatam');

  if (pastYearMatch || absurdTimeMatch) {
    return {
      matched: true,
      intent: 'CUSTOMER_SARCASM',
      confidence: 0.95,
      entities: { mentionedYear: pastYearMatch ? pastYearMatch[1] : null },
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer used sarcasm or invalid timeline (e.g. past year or extreme delay)',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
