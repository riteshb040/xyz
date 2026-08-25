import { DetectorResult } from '../types/intent.types';

export function detectPaymentIntent(textLower: string): DetectorResult {
  // Check for negation phrase override e.g. "nahi nahi, Friday ko kar dunga"
  const hasCommitmentPhrase =
    textLower.includes('kar dunga') ||
    textLower.includes('kar dungi') ||
    textLower.includes('pay kar dunga') ||
    textLower.includes('de dunga') ||
    textLower.includes('bher dunga') ||
    textLower.includes('clear kar dunga');

  const hasDelayHardshipPhrase =
    textLower.includes('salary nahi aayi') ||
    textLower.includes('paise nahi hain') ||
    textLower.includes('problem hai') ||
    textLower.includes('shayad') ||
    textLower.includes('koshish karunga');

  const isRefusalPhrase =
    textLower.includes('payment nahi karunga') ||
    textLower.includes('nhi dunga') ||
    textLower.includes('nahi dena') ||
    textLower.includes('ek rupya nahi');

  // Extracts payment amount if stated e.g. "5000 de dunga", "5 hazaar"
  let paymentAmount: string | null = null;
  const amountMatch = textLower.match(/\b(\d{3,6}|5 hazaar|10 hazaar)\b/);
  if (amountMatch) {
    paymentAmount = amountMatch[1];
  }

  // Extract payment date if stated e.g. "Friday", "kal", "parso"
  let paymentDate: string | null = null;
  const dateMatch = textLower.match(/\b(kal|parso|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|\d{1,2}\s*(august|september|october|november|december|january|february|march|april|may|june|july))\b/);
  if (dateMatch) {
    paymentDate = dateMatch[1];
  }

  // 1. Explicit Commitment takes precedence even if "nahi" is present as filler ("nahi nahi, Friday ko kar dunga")
  if (hasCommitmentPhrase) {
    return {
      matched: true,
      intent: 'PAYMENT_COMMITMENT',
      confidence: 0.97,
      entities: { paymentDate, paymentAmount },
      sentiment: 'positive',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer explicitly committed to a payment date or action',
    };
  }

  // 2. Explicit Refusal
  if (isRefusalPhrase) {
    return {
      matched: true,
      intent: 'PAYMENT_REFUSAL',
      confidence: 0.95,
      entities: {},
      sentiment: 'negative',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer explicitly refused payment',
    };
  }

  // 3. Payment Delay / Financial Hardship
  if (hasDelayHardshipPhrase) {
    return {
      matched: true,
      intent: 'PAYMENT_DELAY',
      confidence: 0.94,
      entities: { paymentDate, paymentAmount },
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer indicated financial hardship or uncertain payment delay',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
