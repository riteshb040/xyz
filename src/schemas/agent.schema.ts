import { z } from 'zod';

export const AgentLanguageRulesSchema = z.object({
  primary: z.string(),
  fallback: z.string(),
  tone: z.string(),
  notes: z.string(),
});

export const AgentOutputRulesSchema = z.object({
  format: z.enum(['json', 'text']).default('json'),
  maxSentences: z.number().int().positive().default(3),
  mustInclude: z.array(z.string()).default([]),
  mustAvoid: z.array(z.string()).default([]),
});

export const AgentVoiceSchema = z.object({
  persona: z.string().optional().default('Professional Indian Voice Agent'),
  speakingPace: z.string().optional().default('Moderate / Conversational'),
  pauseFrequency: z.string().optional().default('Natural pauses between sentences'),
  energy: z.string().optional().default('Calm & Confident'),
  emotionalExpressiveness: z.string().optional().default('Empathetic & Firm'),
  pronunciation: z.string().optional().default('Clear Indian English / Hinglish'),
});

export const AgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().optional().default('Professional Loan Repayment Agent'),
  companyName: z.string().optional().default('Lender Account Services'),
  persona: z.string(),
  background: z.string().optional().default('Experienced financial recovery communication specialist.'),
  personality: z.string().optional().default('Calm, respectful, patient, professional, warm, non-aggressive.'),
  expertise: z.string().optional().default('Loan recovery communication, payment options explanation, de-escalation.'),
  behavioralRules: z.array(z.string()),
  languageRules: AgentLanguageRulesSchema,
  outputRules: AgentOutputRulesSchema,
  voice: AgentVoiceSchema.optional().default({}),
});

export type Agent = z.infer<typeof AgentSchema>;
