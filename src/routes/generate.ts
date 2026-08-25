import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GenerateRequestSchema } from '../schemas/request.schema';
import { getCampaign, getAgent } from '../config/loader';
import { buildPrompt, buildFastGreeting, buildCompactVoicePrompt } from '../prompt/buildPrompt';
import { matchFastIntent } from '../prompt/fastIntentEngine';
import { getOrCreateSession, appendSessionTurn } from '../services/sessionStore';
import { MissingVariablesError, InvalidVariableError, VariableSizeExceededError } from '../prompt/injectVariables';
import { callSarvamLLM } from '../llm/sarvamClient';
import { postProcessOutput } from '../llm/postProcess';
import { logger } from '../utils/logger';

export async function generateRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post('/v1/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = GenerateRequestSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid request body',
        details: parseResult.error.errors,
      });
    }

    const { callId, campaignId, agentId, currentState, variables, conversationHistory, language } = parseResult.data;

    const campaign = getCampaign(campaignId);
    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: `Campaign not found: ${campaignId}`,
      });
    }

    const agent = getAgent(agentId);
    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: `Agent persona not found: ${agentId}`,
      });
    }

    try {
      const startTimer = Date.now();
      let activeHistory = conversationHistory || [];

      // Auto-session logging & history loading if callId is provided
      let session;
      if (callId) {
        session = getOrCreateSession(callId, campaignId, agentId, variables);
        if (!conversationHistory || conversationHistory.length === 0) {
          activeHistory = session.history;
        }
      }

      const isInitialTurn = !activeHistory || activeHistory.length === 0;
      const modeParam = (request.body as any)?.mode;
      const useLLMParam = (request.body as any)?.useLLM;
      const isLLMRequested = modeParam === 'cloud' || modeParam === 'llm' || useLLMParam === true;

      // Save user turn BEFORE processing
      const lastUserText = activeHistory.length > 0 ? activeHistory[activeHistory.length - 1]?.content || '' : '';
      if (callId && !isInitialTurn && activeHistory.length > 0) {
        const lastTurn = activeHistory[activeHistory.length - 1];
        if (lastTurn && lastTurn.role === 'user') {
          appendSessionTurn(callId, { role: 'user', content: lastTurn.content });
        }
      }

      let responseOutput;
      let promptTokens = 0;
      let completionTokens = 0;
      let usedFastPath = false;

      // 100% Direct LLM AI Agent Generation (using campaign & agent prompt)
      try {
        if (isInitialTurn) {
          // Turn 1: Dynamic LLM Opening Greeting generated from 3-layer compact voice prompt
          const greetingPrompt = buildCompactVoicePrompt(campaign, agent, variables, [], 'INITIAL_GREETING');
          const llmResult = await callSarvamLLM(greetingPrompt.messages);
          responseOutput = postProcessOutput(llmResult.rawText, agent, 'voice');
          promptTokens = llmResult.promptTokens || 0;
          completionTokens = llmResult.completionTokens || 0;
        } else {
          // Subsequent Turns: Dynamic ChatCompletion messages array from 3-layer compact voice prompt
          const voicePromptResult = buildCompactVoicePrompt(campaign, agent, variables, activeHistory, currentState);
          const llmResult = await callSarvamLLM(voicePromptResult.messages);
          responseOutput = postProcessOutput(llmResult.rawText, agent, 'voice');
          promptTokens = llmResult.promptTokens || 0;
          completionTokens = llmResult.completionTokens || 0;
        }
      } catch (llmErr: any) {
        logger.warn({ err: llmErr.message, campaignId, agentId }, 'Direct LLM call failed; applying safety fallback');
        responseOutput = isInitialTurn
          ? buildFastGreeting(campaign, agent, variables)
          : matchFastIntent(lastUserText, campaign, agent, variables, activeHistory);
        usedFastPath = true;
      }

      if (language) {
        responseOutput.language = language;
      }

      const latencyMs = Date.now() - startTimer;

      // Save assistant response turn to disk session log
      if (callId) {
        appendSessionTurn(callId, { role: 'assistant', content: responseOutput.text });
      }

      logger.info({ campaignId, agentId, callId, latencyMs, fastPath: usedFastPath }, 'Processed generate request');

      return reply.status(200).send({
        success: true,
        response: responseOutput,
        meta: {
          callId: callId || null,
          campaignId,
          agentId,
          latencyMs,
          promptTokens,
          completionTokens,
          fastPath: usedFastPath,
        },
      });
    } catch (err: any) {
      if (err instanceof MissingVariablesError) {
        return reply.status(400).send({
          success: false,
          error: err.message,
          missingVariables: err.missing,
        });
      }

      if (err instanceof InvalidVariableError) {
        return reply.status(400).send({
          success: false,
          error: err.message,
          invalidKeys: err.invalidKeys,
        });
      }

      if (err instanceof VariableSizeExceededError) {
        return reply.status(400).send({
          success: false,
          error: err.message,
        });
      }

      logger.error({ err: err.message, campaignId, agentId }, 'Failed to generate response');

      return reply.status(502).send({
        success: false,
        error: 'Generation failed',
        details: err.message,
      });
    }
  });
}
