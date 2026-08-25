import { z } from 'zod';

export const CampaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  goal: z.string(),
  secondaryGoals: z.array(z.string()).optional().default([]),
  requiredVariables: z.array(z.string()),
  optionalVariables: z.array(z.string()).default([]),
  scriptFlow: z.array(z.string()),
  constraints: z.array(z.string()),
  escalationTriggers: z.array(z.string()),
});

export type Campaign = z.infer<typeof CampaignSchema>;
