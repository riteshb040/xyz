import { Campaign } from '../schemas/campaign.schema';
import { Agent } from '../schemas/agent.schema';
import { LLMOutput, ConversationTurn } from '../schemas/request.schema';
import { sanitizeValue } from './injectVariables';
import { extractConversationContext } from '../intent/context/conversationContext';
import { scoreAndSelectIntent } from '../intent/scoring/intentScorer';
import { FastIntentResult } from '../intent/types/intent.types';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function matchFastIntent(
  userText: string,
  campaign: Campaign,
  agent: Agent,
  variables: Record<string, unknown>,
  conversationHistory: ConversationTurn[] = [],
  previousIntentOverride?: string
): LLMOutput {
  const customerName = sanitizeValue(variables.customerName || 'Ji');
  const debtAmount = variables.debtAmount ? `₹${Number(variables.debtAmount).toLocaleString('en-IN')}` : 'pending amount';
  const turnCount = conversationHistory.length;

  // 1. Extract context signals and turn history stats
  const contextSignals = extractConversationContext(userText, conversationHistory, previousIntentOverride);

  // 2. Score and select dominant intent via modular detectors & priority hierarchy
  const classification: FastIntentResult = scoreAndSelectIntent(userText, contextSignals);

  // 3. Map intent result to deterministic spoken responses
  let spokenResponse = '';
  let suggestedAction: 'await_customer_reply' | 'escalate_to_human' | 'close_call' | 'request_callback' = 'await_customer_reply';
  let escalationNeeded = false;

  switch (classification.intent) {
    case 'GREETING': {
      // Handles 'ok', 'theek hai', 'haan', 'bolo', 'suno'
      if (turnCount >= 2) {
        const ackFollowups = [
          `Ji ${customerName} ji, toh kya main aapke number par direct payment link SMS kar doon?`,
          `Haan ji ${customerName} ji, aap batayiye kya aaj shaam tak is payment ko complete kar payenge?`,
          `Ji ${customerName} ji, agar aaj clear karenge toh koi extra late charges nahi lagenge. Kya main payment options bataun?`,
        ];
        spokenResponse = pickRandom(ackFollowups);
      } else {
        spokenResponse = `Ji ${customerName} ji, aapke account par ${debtAmount} ki payment pending hai. Kya aap aaj isko pay kar paayenge?`;
      }
      suggestedAction = 'await_customer_reply';
      break;
    }

    case 'QUESTION_ABOUT_DEBT': {
      // Handles 'kyo call kiya', 'kyu call kar rhe ho'
      spokenResponse = `Ji ${customerName} ji, aapke loan account par ${debtAmount} ki payment overdue hai, usi ki reminder aur assistance ke liye call kiya hai. Kya aap aaj pay kar sakte hain?`;
      suggestedAction = 'await_customer_reply';
      break;
    }

    case 'CUSTOMER_ANGER': {
      // Handles 'bhaad me gya', 'pareshan mat karo'
      spokenResponse = `Dekhiye ${customerName} ji, main aapki pareshaani samajhta hoon. Hum bas aapka late charges bachane ke liye call kar rahe hain. Kya hum aaram se baat kar sakte hain?`;
      suggestedAction = 'await_customer_reply';
      break;
    }

    case 'CALLBACK_REQUEST': {
      const dateText = (classification.entities.callbackDate as string) || 'baad mein';
      spokenResponse = `Theek hai ${customerName} ji, main aapke liye ${dateText} ka callback note kar raha hoon. Dhanyawad!`;
      suggestedAction = 'request_callback';
      break;
    }

    case 'END_CALL_REQUEST':
    case 'DO_NOT_CALL': {
      spokenResponse = `Theek hai ${customerName} ji, aapki baat samajh gaya. Dhanyawad!`;
      suggestedAction = 'close_call';
      break;
    }

    case 'WRONG_PERSON':
    case 'WRONG_NUMBER': {
      spokenResponse = `Samajh gaya ji. Kripya ${customerName} ji se bol dijiyega ki humare number par contact kar lein. Dhanyawad!`;
      suggestedAction = 'close_call';
      break;
    }

    case 'CUSTOMER_REQUESTS_HUMAN': {
      spokenResponse = `Ji ${customerName} ji, main aapka call senior supervisor ko transfer kar raha hoon. Kripya thoda hold kijiye.`;
      suggestedAction = 'escalate_to_human';
      escalationNeeded = true;
      break;
    }

    case 'IDENTITY_QUESTION': {
      spokenResponse = `System records ke according aapka naam ${customerName} registered hai.`;
      suggestedAction = 'await_customer_reply';
      break;
    }

    case 'WHO_IS_CALLING': {
      spokenResponse = `Ji ${customerName} ji, main ${agent.companyName || 'loan recovery team'} se bol raha hoon. Aapke pending amount ${debtAmount} ke baare mein baat karni thi.`;
      suggestedAction = 'await_customer_reply';
      break;
    }

    case 'ALREADY_PAID': {
      spokenResponse = `Samajh gaya ${customerName} ji. Main system mein aapka payment verification update note kar raha hoon. Dhanyawad!`;
      suggestedAction = 'close_call';
      break;
    }

    case 'QUESTION_ABOUT_NON_PAYMENT_CONSEQUENCES': {
      spokenResponse = `Is account ke next steps aapke loan agreement terms aur company policy ke according honge. Kya main payment options bataun?`;
      suggestedAction = 'await_customer_reply';
      break;
    }

    case 'DISCOUNT_REQUEST':
    case 'SETTLEMENT_REQUEST': {
      spokenResponse = `${customerName} ji, discount available hai ya nahi, ye aapke account ke applicable policy par depend karta hai. Main option check karne mein help kar sakta hoon.`;
      suggestedAction = 'await_customer_reply';
      break;
    }

    case 'CUSTOMER_SARCASM':
    case 'CUSTOMER_JOKE': {
      spokenResponse = `Lagta hai aap abhi payment ko lekar ready nahi hain. Aap bataiye, realistically kab tak payment kar paayenge?`;
      suggestedAction = 'await_customer_reply';
      break;
    }

    case 'PAYMENT_COMMITMENT': {
      const dateVal = (classification.entities.paymentDate as string) || 'soon';
      spokenResponse = `Theek hai ${customerName} ji, main system mein ${dateVal} ka payment commitment note kar raha hoon. Dhanyawad!`;
      suggestedAction = 'close_call';
      break;
    }

    case 'PAYMENT_REFUSAL':
    case 'PAYMENT_DELAY': {
      if (classification.conversationStuck) {
        spokenResponse = `${customerName} ji, lagta hai abhi issue resolve nahi ho pa raha. Kya main aapke liye supervisor call ya callback note karun?`;
        suggestedAction = 'await_customer_reply';
      } else {
        const politeVariations = [
          `Dekhiye ${customerName} ji, main aapki pareshaani samajhta hoon. Late fees se bachne ke liye koi date batayiye?`,
          `${customerName} ji, thoda co-operate kijiye. Agar aaj nahi ho sakta, toh parso tak thoda payment kar paayenge?`,
          `Samajh raha hoon ${customerName} ji. Lekin batayiye toh sahi ki dikkat kya aa rahi hai?`,
        ];
        spokenResponse = pickRandom(politeVariations);
        suggestedAction = 'await_customer_reply';
      }
      break;
    }

    default: {
      const contextualDefaults = [
        `Ji ${customerName} ji, aapke loan par ${debtAmount} pending hai. Aap batayiye kab tak clear kar paayenge?`,
        `${customerName} ji, kya aap aaj online link ke through payment complete kar sakte hain?`,
        `Ji ${customerName} ji, main aapko payment link SMS kar sakta hoon. Kya aap abhi pay karenge?`,
      ];
      spokenResponse = pickRandom(contextualDefaults);
      suggestedAction = 'await_customer_reply';
      break;
    }
  }

  return {
    text: spokenResponse,
    language: agent.languageRules?.primary || 'hi-IN',
    intent: classification.intent,
    confidence: classification.confidence,
    entities: classification.entities as Record<string, unknown>,
    suggestedNextAction: suggestedAction as any,
    flags: {
      escalationNeeded,
      sentimentDetected: classification.sentiment,
    },
  };
}

export { extractConversationContext, scoreAndSelectIntent };
