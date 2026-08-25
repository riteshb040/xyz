import { Campaign } from '../schemas/campaign.schema';

export class MissingVariablesError extends Error {
  public missing: string[];
  constructor(missing: string[]) {
    super(`Missing required variables for campaign: ${missing.join(', ')}`);
    this.name = 'MissingVariablesError';
    this.missing = missing;
  }
}

export class InvalidVariableError extends Error {
  public invalidKeys: string[];
  constructor(invalidKeys: string[], reason: string) {
    super(`Invalid variable(s) [${invalidKeys.join(', ')}]: ${reason}`);
    this.name = 'InvalidVariableError';
    this.invalidKeys = invalidKeys;
  }
}

export class VariableSizeExceededError extends Error {
  constructor(key: string, limit: number) {
    super(`Variable '${key}' exceeded maximum size limit of ${limit} characters.`);
    this.name = 'VariableSizeExceededError';
  }
}

export type VariableValue = string | number | boolean | null;
export type VariableMap = Record<string, unknown>;

export interface FormatVariablesOptions {
  strictVariables?: boolean;
  maxValLength?: number;
  maxKeyLength?: number;
  maxTotalSize?: number;
}

export interface FormatVariablesResult {
  formattedBlock: string;
  sanitizedVars: Record<string, string>;
  typedVars: Record<string, VariableValue>;
  warnings?: string[];
}

const DANGEROUS_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'system',
  'systemprompt',
  'system_prompt',
]);

const SAFE_KEY_REGEX = /^[a-zA-Z][a-zA-Z0-9_.-]*$/;

/**
 * Sanitizes a variable primitive value into a safe string representation.
 * - Removes non-printable control characters (\x00-\x08, \x0B, \x0C, \x0E-\x1F, \x7F-\x9F)
 * - Preserves normal newlines (\n, \r), tabs (\t), and full Unicode (Hindi, Gujarati, Tamil, Odia, Hinglish)
 * - Neutralizes triple backticks (``` -> ''') to prevent markdown code block breakouts
 * - Does NOT mutate legitimate names/words like "System Kumar" or "User"
 */
export function sanitizeValue(val: unknown): string {
  if (val === null || val === undefined) return '';

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // Remove dangerous control characters while preserving \n, \r, \t and all Unicode
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // Neutralize triple backticks to prevent markdown code-fence breakout
  str = str.replace(/```/g, "'''");

  // Normalize excessive space characters while keeping single newlines
  str = str.replace(/[ \t]{2,}/g, ' ');

  return str.trim();
}

/**
 * Validates, filters, and formats campaign variables into structured XML JSON <APPLICATION_DATA>.
 */
export function formatVariablesBlock(
  campaign: Campaign,
  variables: Record<string, unknown>,
  options: FormatVariablesOptions = {}
): FormatVariablesResult {
  const strictVariables = options.strictVariables ?? true;
  const maxValLength = options.maxValLength ?? 1000;
  const maxKeyLength = options.maxKeyLength ?? 100;
  const maxTotalSize = options.maxTotalSize ?? 10000;

  const warnings: string[] = [];
  const missing: string[] = [];
  const invalidKeys: string[] = [];

  const allowedKeysSet = new Set<string>([
    ...campaign.requiredVariables,
    ...(campaign.optionalVariables || []),
  ]);

  // Use Reflect.ownKeys or Object.getOwnPropertyNames to safely detect __proto__, constructor, etc.
  const rawKeys = Object.keys(variables);

  // 1. Validate Keys & Check Dangerous Prototypes / Arbitrary Unknown Variables
  for (const key of rawKeys) {
    const lowerKey = key.toLowerCase();

    if (key.length > maxKeyLength || !SAFE_KEY_REGEX.test(key) || DANGEROUS_KEYS.has(lowerKey)) {
      invalidKeys.push(key);
      continue;
    }

    if (!allowedKeysSet.has(key)) {
      if (strictVariables) {
        invalidKeys.push(key);
      } else {
        warnings.push(`Unapproved variable key ignored: '${key}'`);
      }
    }
  }

  // Also check if JSON string of variables contains dangerous prototype keys
  const rawJson = JSON.stringify(variables);
  if (rawJson.includes('"__proto__":') || rawJson.includes('"constructor":') || rawJson.includes('"prototype":')) {
    if (!invalidKeys.includes('__proto__')) invalidKeys.push('__proto__');
  }

  if (invalidKeys.length > 0) {
    throw new InvalidVariableError(invalidKeys, 'Unapproved, malformed, or dangerous variable key.');
  }

  // 2. Validate Required Variables
  for (const reqVar of campaign.requiredVariables) {
    const val = variables[reqVar];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      missing.push(reqVar);
    }
  }

  if (missing.length > 0) {
    throw new MissingVariablesError(missing);
  }

  // 3. Populate Typed and Sanitized Variables
  const typedVars: Record<string, VariableValue> = {};
  const sanitizedVars: Record<string, string> = {};

  const processVariable = (key: string) => {
    const rawVal = variables[key];
    if (rawVal === undefined || rawVal === null) return;

    const cleanStr = sanitizeValue(rawVal);

    if (cleanStr.length > maxValLength) {
      throw new VariableSizeExceededError(key, maxValLength);
    }

    sanitizedVars[key] = cleanStr;

    // Preserve Primitive Types
    if (typeof rawVal === 'number' && !isNaN(rawVal)) {
      typedVars[key] = rawVal;
    } else if (typeof rawVal === 'boolean') {
      typedVars[key] = rawVal;
    } else {
      typedVars[key] = cleanStr;
    }
  };

  // Add required variables first
  for (const reqVar of campaign.requiredVariables) {
    processVariable(reqVar);
  }

  // Add optional variables
  for (const optVar of campaign.optionalVariables || []) {
    if (variables[optVar] !== undefined && variables[optVar] !== null) {
      processVariable(optVar);
    }
  }

  // 4. Serialize to Structured XML <APPLICATION_DATA> JSON
  const jsonString = JSON.stringify(typedVars, null, 2);

  if (jsonString.length > maxTotalSize) {
    throw new VariableSizeExceededError('TOTAL_APPLICATION_DATA', maxTotalSize);
  }

  const formattedBlock = `<APPLICATION_DATA>\n${jsonString}\n</APPLICATION_DATA>`;

  return {
    formattedBlock,
    sanitizedVars,
    typedVars,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
