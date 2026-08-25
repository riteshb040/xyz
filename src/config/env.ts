import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MAIN_APP_API_KEY: z.string().min(1, 'MAIN_APP_API_KEY is required'),
  SARVAM_API_KEY: z.string().min(1, 'SARVAM_API_KEY is required'),
  SARVAM_API_URL: z.string().url().default('https://api.sarvam.ai/v1/chat/completions'),
  SARVAM_MODEL: z.string().default('sarvam-2b'),
  REQUEST_TIMEOUT_MS: z.string().transform((val) => parseInt(val, 10)).default('8000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export const env = EnvSchema.parse(process.env);
