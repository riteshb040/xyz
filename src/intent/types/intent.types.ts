export type ConversationControl = 'continue' | 'callback' | 'end_call' | 'human_handoff';
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'abusive';
export type Urgency = 'low' | 'normal' | 'high';

export type IntentTaxonomy =
  | 'GREETING'
  | 'IDENTITY_QUESTION'
  | 'WHO_IS_CALLING'
  | 'PAYMENT_COMMITMENT'
  | 'PAYMENT_DATE_PROVIDED'
  | 'PAYMENT_AMOUNT_PROVIDED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_DELAY'
  | 'PAYMENT_REFUSAL'
  | 'FINANCIAL_HARDSHIP'
  | 'DISCOUNT_REQUEST'
  | 'SETTLEMENT_REQUEST'
  | 'PAYMENT_LINK_REQUEST'
  | 'PAYMENT_METHOD_QUESTION'
  | 'QUESTION_ABOUT_DEBT'
  | 'QUESTION_ABOUT_NON_PAYMENT_CONSEQUENCES'
  | 'QUESTION_ABOUT_LATE_FEE'
  | 'QUESTION_ABOUT_INTEREST'
  | 'QUESTION_ABOUT_LOAN'
  | 'CALLBACK_REQUEST'
  | 'CALLBACK_DATE_PROVIDED'
  | 'CALLBACK_TIME_PROVIDED'
  | 'END_CALL_REQUEST'
  | 'DO_NOT_CALL'
  | 'WRONG_PERSON'
  | 'WRONG_NUMBER'
  | 'CUSTOMER_REQUESTS_HUMAN'
  | 'CUSTOMER_ANGER'
  | 'CUSTOMER_ABUSIVE'
  | 'CUSTOMER_CONFUSED'
  | 'CUSTOMER_JOKE'
  | 'CUSTOMER_SARCASM'
  | 'OFF_TOPIC'
  | 'REPEAT_REQUEST'
  | 'ALREADY_PAID'
  | 'DISPUTE'
  | 'IDENTITY_CONCERN'
  | 'PRIVACY_CONCERN'
  | 'UNKNOWN';

export interface ExtractedEntities {
  paymentDate?: string | null;
  paymentAmount?: string | null;
  callbackDate?: string | null;
  callbackTime?: string | null;
  discountRequested?: boolean;
  settlementRequested?: boolean;
  customerName?: string | null;
  [key: string]: unknown;
}

export interface DetectorResult {
  matched: boolean;
  intent: IntentTaxonomy;
  confidence: number;
  entities: ExtractedEntities;
  sentiment?: Sentiment;
  conversationControl?: ConversationControl;
  urgency?: Urgency;
  reason?: string;
}

export interface FastIntentResult {
  intent: IntentTaxonomy;
  confidence: number;
  entities: ExtractedEntities;
  sentiment: Sentiment;
  conversationControl: ConversationControl;
  urgency: Urgency;
  secondaryIntents: IntentTaxonomy[];
  repeatCount: number;
  repeatedIntent: boolean;
  conversationStuck: boolean;
  needsClarification: boolean;
  needsHuman: boolean;
  reason: string;
}
