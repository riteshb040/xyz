import { z } from 'zod';

export const InitiateCallSchema = z.object({
  callId: z.string().min(1, 'callId is required'),
  campaignId: z.string().min(1, 'campaignId is required'),
  agentId: z.string().min(1, 'agentId is required'),
  customerPhone: z.string().optional(),
  language: z.string().optional().default('hi-IN'),
  variables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export type InitiateCallRequest = z.infer<typeof InitiateCallSchema>;

export const DispositionCallSchema = z.object({
  callId: z.string().min(1, 'callId is required'),
  disposition: z.enum([
    'PTP_PROMISED_TO_PAY',
    'DISPUTE_DEBT',
    'HARDSHIP_FINANCIAL',
    'SETTLEMENT_ACCEPTED',
    'HUMAN_ESCALATION',
    'WRONG_NUMBER',
    'CALL_DROPPED',
    'OTHER_NO_COMMITMENT',
  ]).default('OTHER_NO_COMMITMENT'),
  durationSeconds: z.number().optional().default(0),
  endReason: z.string().optional().default('NORMAL_CLEARING'),
  generateSummary: z.boolean().optional().default(true),
});

export type DispositionCallRequest = z.infer<typeof DispositionCallSchema>;

export const CallSummarySchema = z.object({
  callId: z.string(),
  campaignId: z.string(),
  agentId: z.string(),
  customerName: z.string(),
  disposition: z.string(),
  durationSeconds: z.number(),
  summary: z.string(),
  commitmentDate: z.string().nullable().optional(),
  commitmentAmount: z.string().nullable().optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'hostile']).default('neutral'),
  escalationNeeded: z.boolean().default(false),
  completedAt: z.string(),
});

export type CallSummary = z.infer<typeof CallSummarySchema>;
