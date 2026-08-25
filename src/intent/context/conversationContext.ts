import { ConversationTurn } from '../../schemas/request.schema';
import { IntentTaxonomy } from '../types/intent.types';

export interface ContextSignals {
  lastUserTurnText: string;
  lastAssistantTurnText: string;
  lastAssistantQuestion: string;
  previousIntent: IntentTaxonomy;
  intentHistory: IntentTaxonomy[];
  repeatCount: number;
  repeatedIntent: boolean;
  conversationStuck: boolean;
}

export function extractConversationContext(
  userText: string,
  conversationHistory: ConversationTurn[] = [],
  previousIntentOverride?: string
): ContextSignals {
  const lastUserTurnText = userText.trim();

  // Find last assistant turn
  const assistantTurns = conversationHistory.filter((t) => t.role === 'assistant');
  const lastAssistantTurnText = assistantTurns.length > 0 ? assistantTurns[assistantTurns.length - 1].content : '';

  // Extract last assistant question
  let lastAssistantQuestion = '';
  if (lastAssistantTurnText.includes('?')) {
    const questionMatch = lastAssistantTurnText.match(/[^.!?]+\?/g);
    if (questionMatch && questionMatch.length > 0) {
      lastAssistantQuestion = questionMatch[questionMatch.length - 1].trim();
    } else {
      lastAssistantQuestion = lastAssistantTurnText.trim();
    }
  }

  // Derive intent history from metadata if available in history notes or override
  const previousIntent: IntentTaxonomy = (previousIntentOverride as IntentTaxonomy) || 'UNKNOWN';

  return {
    lastUserTurnText,
    lastAssistantTurnText,
    lastAssistantQuestion,
    previousIntent,
    intentHistory: [previousIntent],
    repeatCount: 1,
    repeatedIntent: false,
    conversationStuck: false,
  };
}

export function updateIntentHistory(
  currentIntent: IntentTaxonomy,
  previousHistory: IntentTaxonomy[] = []
): { repeatCount: number; repeatedIntent: boolean; conversationStuck: boolean; updatedHistory: IntentTaxonomy[] } {
  const updatedHistory = [...previousHistory, currentIntent];
  let repeatCount = 1;

  for (let i = updatedHistory.length - 2; i >= 0; i--) {
    if (updatedHistory[i] === currentIntent && currentIntent !== 'UNKNOWN') {
      repeatCount++;
    } else {
      break;
    }
  }

  return {
    repeatCount,
    repeatedIntent: repeatCount >= 2,
    conversationStuck: repeatCount >= 3,
    updatedHistory,
  };
}
