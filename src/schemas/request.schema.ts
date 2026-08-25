import { z } from 'zod';

export const ConversationTurnSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;

export const GenerateRequestSchema = z.object({
  callId: z.string().optional(),
  campaignId: z.string().min(1, 'campaignId is required'),
  agentId: z.string().min(1, 'agentId is required'),
  currentState: z.string().optional(),
  language: z.string().optional().default('hi-IN'),
  variables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  conversationHistory: z.array(ConversationTurnSchema).optional().default([]),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const LLMOutputSchema = z.object({
  text: z.string(),
  language: z.string().default('hi-IN'),
  intent: z.string().optional(),
  confidence: z.number().optional(),
  entities: z.record(z.string(), z.unknown()).optional(),
  suggestedNextAction: z.string().default('await_customer_reply'),
  flags: z.object({
    escalationNeeded: z.boolean().default(false),
    sentimentDetected: z.string().default('neutral'),
  }).default({
    escalationNeeded: false,
    sentimentDetected: 'neutral',
  }),
});

export type LLMOutput = z.infer<typeof LLMOutputSchema>;

export const GenerateResponseSchema = z.object({
  success: z.boolean(),
  response: LLMOutputSchema,
  meta: z.object({
    campaignId: z.string(),
    agentId: z.string(),
    latencyMs: z.number(),
    promptTokens: z.number().optional(),
    completionTokens: z.number().optional(),
  }),
  error: z.string().optional(),
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

export const ChatCompletionsRequestSchema = z.object({
  model: z.string().optional(),
  messages: z.array(ConversationTurnSchema),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  stream: z.boolean().optional().default(false),
  metadata: z.object({
    campaignId: z.string().optional(),
    agentId: z.string().optional(),
    variables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  }).optional(),
});

export type ChatCompletionsRequest = z.infer<typeof ChatCompletionsRequestSchema>;
