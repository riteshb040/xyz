import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatCompletionsRequestSchema, ConversationTurn } from '../schemas/request.schema';
import { getCampaign, getAgent, getAllCampaigns, getAllAgents } from '../config/loader';
import { buildPrompt, buildCompactVoicePrompt } from '../prompt/buildPrompt';
import { callSarvamLLM, callSarvamLLMStream } from '../llm/sarvamClient';
import { postProcessOutput } from '../llm/postProcess';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export async function chatCompletionsRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post('/v1/chat/completions', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = ChatCompletionsRequestSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          message: 'Invalid Chat Completions payload',
          type: 'invalid_request_error',
          code: 'bad_request',
        },
      });
    }

    const { messages, metadata } = parseResult.data;

    // Extract headers or metadata overrides
    const campaignId =
      metadata?.campaignId ||
      (request.headers['x-campaign-id'] as string) ||
      getAllCampaigns()[0]?.id ||
      'loan-default-30day';

    const agentId =
      metadata?.agentId ||
      (request.headers['x-agent-id'] as string) ||
      getAllAgents()[0]?.id ||
      'polite-reminder';

    const variables = metadata?.variables || {
      customerName: 'Valued Customer',
      debtAmount: 10000,
      currency: 'INR',
      dueDate: 'Today',
      daysOverdue: 15,
      loanId: 'LN-COMPAT',
    };

    const campaign = getCampaign(campaignId);
    const agent = getAgent(agentId);

    if (!campaign || !agent) {
      return reply.status(400).send({
        error: {
          message: `Campaign (${campaignId}) or Agent (${agentId}) not found`,
          type: 'invalid_request_error',
        },
      });
    }

    const history: ConversationTurn[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const voicePromptResult = buildCompactVoicePrompt(campaign, agent, variables, history);

      if (parseResult.data.stream) {
        reply.raw.setHeader('Content-Type', 'text/event-stream');
        reply.raw.setHeader('Cache-Control', 'no-cache');
        reply.raw.setHeader('Connection', 'keep-alive');

        const chunkId = `chatcmpl-${Date.now()}`;

        await callSarvamLLMStream(voicePromptResult.messages, (chunk: string) => {
          const chunkPayload = {
            id: chunkId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: parseResult.data.model || 'sarvam-105b-conversations',
            choices: [
              {
                index: 0,
                delta: { content: chunk },
                finish_reason: null,
              },
            ],
          };
          reply.raw.write(`data: ${JSON.stringify(chunkPayload)}\n\n`);
        });

        reply.raw.write('data: [DONE]\n\n');
        return reply.raw.end();
      }

      const llmResult = await callSarvamLLM(voicePromptResult.messages);
      const processed = postProcessOutput(llmResult.rawText, agent, 'voice');

      logger.info({ campaignId, agentId, compatibility: true }, 'Processed Chat Completions request');

      return reply.status(200).send({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: parseResult.data.model || env.SARVAM_MODEL,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: processed.text,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: llmResult.promptTokens || 500,
          completion_tokens: llmResult.completionTokens || 50,
          total_tokens: (llmResult.promptTokens || 500) + (llmResult.completionTokens || 50),
        },
        orchestration_metadata: {
          campaignId,
          agentId,
          suggestedNextAction: processed.suggestedNextAction,
          flags: processed.flags,
        },
      });
    } catch (err: any) {
      logger.error({ err: err.message }, 'Chat completions compatibility endpoint failed');
      return reply.status(500).send({
        error: {
          message: err.message || 'Internal prompt orchestration error',
          type: 'api_error',
        },
      });
    }
  });
}
