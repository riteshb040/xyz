import { DetectorResult, FastIntentResult, IntentTaxonomy } from '../types/intent.types';
import { ContextSignals, updateIntentHistory } from '../context/conversationContext';
import { detectCallbackRequest } from '../detectors/callbackDetector';
import { detectEndCallRequest } from '../detectors/endCallDetector';
import { detectWrongPerson } from '../detectors/wrongPersonDetector';
import { detectHumanRequest } from '../detectors/humanRequestDetector';
import { detectConsequenceQuestion } from '../detectors/consequenceDetector';
import { detectDiscountOrSettlement } from '../detectors/discountDetector';
import { detectAlreadyPaid } from '../detectors/alreadyPaidDetector';
import { detectJokeOrSarcasm } from '../detectors/jokeSarcasmDetector';
import { detectPaymentIntent } from '../detectors/paymentDetector';
import { detectIdentityQuery } from '../detectors/identityDetector';
import { detectAcknowledgment } from '../detectors/acknowledgmentDetector';
import { detectBusyOrUnavailable } from '../detectors/busyDetector';
import { detectWhyCalling } from '../detectors/whyCallingDetector';
import { detectAngerOrFrustration } from '../detectors/angerFrustrationDetector';

// Intent Priority Order
const INTENT_PRIORITY_ORDER: IntentTaxonomy[] = [
  'DO_NOT_CALL',
  'END_CALL_REQUEST',
  'WRONG_PERSON',
  'WRONG_NUMBER',
  'CUSTOMER_REQUESTS_HUMAN',
  'CUSTOMER_ANGER',
  'CALLBACK_REQUEST',
  'ALREADY_PAID',
  'IDENTITY_QUESTION',
  'WHO_IS_CALLING',
  'QUESTION_ABOUT_DEBT',
  'QUESTION_ABOUT_NON_PAYMENT_CONSEQUENCES',
  'DISCOUNT_REQUEST',
  'SETTLEMENT_REQUEST',
  'CUSTOMER_SARCASM',
  'PAYMENT_COMMITMENT',
  'PAYMENT_DELAY',
  'PAYMENT_REFUSAL',
  'GREETING',
  'UNKNOWN',
];

export function scoreAndSelectIntent(
  userText: string,
  context: ContextSignals
): FastIntentResult {
  const textLower = userText.toLowerCase().trim();

  // Run all detectors
  const detectorResults: DetectorResult[] = [
    detectEndCallRequest(textLower),
    detectWrongPerson(textLower),
    detectHumanRequest(textLower),
    detectAngerOrFrustration(textLower),
    detectBusyOrUnavailable(textLower),
    detectCallbackRequest(textLower),
    detectAlreadyPaid(textLower),
    detectIdentityQuery(textLower),
    detectWhyCalling(textLower),
    detectConsequenceQuestion(textLower),
    detectDiscountOrSettlement(textLower),
    detectJokeOrSarcasm(textLower),
    detectPaymentIntent(textLower),
    detectAcknowledgment(textLower),
  ];

  // Filter matched results
  const matched = detectorResults.filter((r) => r.matched);

  let selected: DetectorResult;
  const secondaryIntents: IntentTaxonomy[] = [];

  if (matched.length === 0) {
    selected = {
      matched: false,
      intent: 'UNKNOWN',
      confidence: 0.0,
      entities: {},
      sentiment: 'neutral',
      conversationControl: 'continue',
      urgency: 'low',
      reason: 'No explicit fast detector pattern matched',
    };
  } else {
    // Sort by explicit priority hierarchy first, then confidence score
    matched.sort((a, b) => {
      const pA = INTENT_PRIORITY_ORDER.indexOf(a.intent);
      const pB = INTENT_PRIORITY_ORDER.indexOf(b.intent);
      if (pA !== pB) return pA - pB;
      return b.confidence - a.confidence;
    });

    selected = matched[0];

    // Collect secondary intents if multiple detectors matched
    for (let i = 1; i < matched.length; i++) {
      if (matched[i].intent !== selected.intent) {
        secondaryIntents.push(matched[i].intent);
      }
    }
  }

  // Update repeat counts and conversation stuck signals
  const historyStats = updateIntentHistory(selected.intent, context.intentHistory);

  return {
    intent: selected.intent,
    confidence: selected.confidence,
    entities: selected.entities,
    sentiment: selected.sentiment || 'neutral',
    conversationControl: selected.conversationControl || 'continue',
    urgency: selected.urgency || 'normal',
    secondaryIntents,
    repeatCount: historyStats.repeatCount,
    repeatedIntent: historyStats.repeatedIntent,
    conversationStuck: historyStats.conversationStuck,
    needsClarification: selected.confidence < 0.85,
    needsHuman: selected.intent === 'CUSTOMER_REQUESTS_HUMAN',
    reason: selected.reason || 'Intent classified successfully',
  };
}
