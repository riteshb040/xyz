import { Agent } from '../schemas/agent.schema';
import { LLMOutput, LLMOutputSchema } from '../schemas/request.schema';
import { logger } from '../utils/logger';

export function postProcessOutput(rawText: string, agent: Agent): LLMOutput {
  let cleanedText = rawText.trim();

  // Strip markdown code block wrappers if model outputted ```json ... ```
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  let parsedObject: unknown;

  try {
    parsedObject = JSON.parse(cleanedText);
  } catch (parseErr) {
    logger.warn({ rawText }, 'LLM output was not valid JSON; wrapping raw string into structured shape');
    parsedObject = {
      text: cleanedText,
      language: agent.languageRules.primary || 'hi-IN',
      suggestedNextAction: 'await_customer_reply',
      flags: {
        escalationNeeded: false,
        sentimentDetected: 'neutral',
      },
    };
  }

  // Validate with Zod schema
  const validationResult = LLMOutputSchema.safeParse(parsedObject);
  let finalOutput: LLMOutput;

  if (validationResult.success) {
    finalOutput = validationResult.data;
  } else {
    logger.warn(
      { errors: validationResult.error.errors, parsedObject },
      'LLM output failed schema validation; using standard fallback wrapper'
    );
    finalOutput = {
      text: typeof (parsedObject as any)?.text === 'string' ? (parsedObject as any).text : cleanedText,
      language: agent.languageRules.primary || 'hi-IN',
      suggestedNextAction: 'await_customer_reply',
      flags: {
        escalationNeeded: false,
        sentimentDetected: 'neutral',
      },
    };
  }

  // Apply mustAvoid sanitization rules — generic filter for any configured keywords
  if (agent.outputRules && agent.outputRules.mustAvoid) {
    for (const avoidRule of agent.outputRules.mustAvoid) {
      // Create a case-insensitive regex from the avoidRule keywords
      const keywords = avoidRule.split(/[,/|]+/).map((k: string) => k.trim()).filter(Boolean);
      for (const keyword of keywords) {
        if (keyword.length >= 3) { // Avoid matching tiny fragments
          const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, 'gi');
          finalOutput.text = finalOutput.text.replace(regex, '[redacted]');
        }
      }
    }
  }

  return finalOutput;
}
