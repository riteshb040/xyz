import { Agent } from '../schemas/agent.schema';
import { LLMOutput, LLMOutputSchema } from '../schemas/request.schema';
import { logger } from '../utils/logger';

export function postProcessOutput(
  rawText: string,
  agent: Agent,
  mode: 'voice' | 'structured' = 'voice'
): LLMOutput {
  let cleanedText = rawText.trim();

  // Strip markdown code block wrappers if present
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  // Strip surrounding quotes if present
  if ((cleanedText.startsWith('"') && cleanedText.endsWith('"')) || (cleanedText.startsWith("'") && cleanedText.endsWith("'"))) {
    cleanedText = cleanedText.slice(1, -1).trim();
  }

  let finalOutput: LLMOutput;

  if (mode === 'voice') {
    // Direct voice turn processing: treat rawText directly as spoken text without trying JSON.parse
    finalOutput = {
      text: cleanedText,
      language: agent.languageRules?.primary || 'hi-IN',
      suggestedNextAction: 'await_customer_reply',
      flags: {
        escalationNeeded: false,
        sentimentDetected: 'neutral',
      },
    };
  } else {
    // Structured processing (e.g. call disposition/summary): attempt JSON parse & schema validation
    let parsedObject: unknown;
    try {
      parsedObject = JSON.parse(cleanedText);
    } catch (parseErr) {
      logger.warn({ rawText }, 'LLM output was not valid JSON; wrapping raw string into structured shape');
      parsedObject = {
        text: cleanedText,
        language: agent.languageRules?.primary || 'hi-IN',
        suggestedNextAction: 'await_customer_reply',
        flags: {
          escalationNeeded: false,
          sentimentDetected: 'neutral',
        },
      };
    }

    const validationResult = LLMOutputSchema.safeParse(parsedObject);
    if (validationResult.success) {
      finalOutput = validationResult.data;
    } else {
      logger.warn(
        { errors: validationResult.error.errors, parsedObject },
        'LLM output failed schema validation; using standard fallback wrapper'
      );
      finalOutput = {
        text: typeof (parsedObject as any)?.text === 'string' ? (parsedObject as any).text : cleanedText,
        language: agent.languageRules?.primary || 'hi-IN',
        suggestedNextAction: 'await_customer_reply',
        flags: {
          escalationNeeded: false,
          sentimentDetected: 'neutral',
        },
      };
    }
  }

  // Apply mustAvoid keyword redaction rules
  if (agent.outputRules && agent.outputRules.mustAvoid) {
    for (const avoidRule of agent.outputRules.mustAvoid) {
      const keywords = avoidRule.split(/[,/|]+/).map((k: string) => k.trim()).filter(Boolean);
      for (const keyword of keywords) {
        if (keyword.length >= 3) {
          const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, 'gi');
          finalOutput.text = finalOutput.text.replace(regex, '[redacted]');
        }
      }
    }
  }

  return finalOutput;
}
