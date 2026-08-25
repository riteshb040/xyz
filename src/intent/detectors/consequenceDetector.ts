import { DetectorResult } from '../types/intent.types';

export function detectConsequenceQuestion(textLower: string): DetectorResult {
  const isConsequenceQuestion =
    (textLower.includes('na karu') || textLower.includes('nhi karu') || textLower.includes('nahi kiya') || textLower.includes('na du')) &&
    (textLower.includes('kya hoga') || textLower.includes('kya karoge') || textLower.includes('action') || textLower.includes('hoga kya'));

  const isGeneralActionQuery =
    textLower.includes('kya action loge') ||
    textLower.includes('mere against kya') ||
    textLower.includes('police case') ||
    textLower.includes('court case') ||
    textLower.includes('legal action');

  if (isConsequenceQuestion || isGeneralActionQuery) {
    return {
      matched: true,
      intent: 'QUESTION_ABOUT_NON_PAYMENT_CONSEQUENCES',
      confidence: 0.97,
      entities: {},
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'normal',
      reason: 'Customer is asking a question about consequences of non-payment',
    };
  }

  return { matched: false, intent: 'UNKNOWN', confidence: 0, entities: {} };
}
