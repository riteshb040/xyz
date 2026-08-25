import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { InitiateCallSchema, DispositionCallSchema } from '../schemas/callLifecycle.schema';
import { getCampaign, getAgent } from '../config/loader';
import { getOrCreateSession, getSessionById, appendSessionTurn, saveSessionToDiskAsync, getAllSessions } from '../services/sessionStore';
import { buildFastGreeting, buildPrompt } from '../prompt/buildPrompt';
import { callSarvamLLM } from '../llm/sarvamClient';
import { postProcessOutput } from '../llm/postProcess';
import { generateCallSummary } from '../llm/summarizeCall';
import { logger } from '../utils/logger';

// Shared handler: Call Initiation
async function handleInitiateCall(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parseResult = InitiateCallSchema.safeParse(request.body);

  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'Invalid call initiation payload',
      details: parseResult.error.errors,
    }) as any;
  }

  const { callId, campaignId, agentId, variables } = parseResult.data;

  const campaign = getCampaign(campaignId);
  if (!campaign) {
    return reply.status(404).send({ success: false, error: `Campaign not found: ${campaignId}` }) as any;
  }

  const agent = getAgent(agentId);
  if (!agent) {
    return reply.status(404).send({ success: false, error: `Agent persona not found: ${agentId}` }) as any;
  }

  // Initialize clean isolated session
  const session = getOrCreateSession(callId, campaignId, agentId, variables);

  // Generate dynamic LLM opening greeting using campaign & agent system prompt
  let openingGreetingText = '';
  try {
    const greetingPrompt = buildPrompt(campaign, agent, variables, [], 'INITIAL_GREETING');
    const llmResult = await callSarvamLLM(
      'Generate the initial opening phone call greeting to the customer.',
      greetingPrompt.fullPrompt
    );
    const processed = postProcessOutput(llmResult.rawText, agent);
    openingGreetingText = processed.text;
  } catch (err: any) {
    logger.warn({ err: err.message, callId }, 'LLM opening greeting failed; using safety fallback');
    openingGreetingText = buildFastGreeting(campaign, agent, variables).text;
  }

  // Record opening turn
  appendSessionTurn(callId, { role: 'assistant', content: openingGreetingText });

  logger.info({ callId, campaignId, agentId }, 'Call session initiated via live webhook with LLM greeting');

  return reply.status(201).send({
    success: true,
    callId,
    campaignId,
    agentId,
    openingGreeting: openingGreetingText,
    session,
  }) as any;
}

// Shared handler: Call Disposition
async function handleDispositionCall(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parseResult = DispositionCallSchema.safeParse(request.body);

  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'Invalid call disposition payload',
      details: parseResult.error.errors,
    }) as any;
  }

  const { callId, disposition, durationSeconds } = parseResult.data;

  // Fix #7: Use getSessionById which checks RAM first, then falls back to disk
  const session = getSessionById(callId);

  if (!session) {
    return reply.status(404).send({
      success: false,
      error: `Call session not found: ${callId}`,
    }) as any;
  }

  // Generate AI Summary & Extracted Commitments
  const summaryReport = await generateCallSummary(session, disposition, durationSeconds);

  // Attach summary report to session object and persist
  (session as any).summaryReport = summaryReport;
  saveSessionToDiskAsync(session);

  logger.info({ callId, disposition, durationSeconds }, 'Call disposition and AI summary saved');

  return reply.status(200).send({
    success: true,
    callId,
    disposition,
    summaryReport,
  }) as any;
}

export async function callsRoute(fastify: FastifyInstance): Promise<void> {
  // -------------------------------------------------------------
  // 1. POST /v1/calls/initiate — Webhook called at Call Start
  // -------------------------------------------------------------
  fastify.post('/v1/calls/initiate', handleInitiateCall);

  // Alias: POST /v1/calls/start (Fix #3: uses shared handler, not inject())
  fastify.post('/v1/calls/start', handleInitiateCall);

  // -------------------------------------------------------------
  // 2. POST /v1/calls/disposition — Webhook called at Call End
  // -------------------------------------------------------------
  fastify.post('/v1/calls/disposition', handleDispositionCall);

  // Alias: POST /v1/calls/end (Fix #3: uses shared handler, not inject())
  fastify.post('/v1/calls/end', handleDispositionCall);

  // -------------------------------------------------------------
  // 3. GET /v1/calls/analytics — Aggregate dispositions by campaign
  //    Fix #8: Register BEFORE /:callId to prevent param route from matching "analytics"
  // -------------------------------------------------------------
  fastify.get('/v1/calls/analytics', async (_request: FastifyRequest, reply: FastifyReply) => {
    const sessions = getAllSessions();
    const stats: Record<string, { totalCalls: number; dispositions: Record<string, number> }> = {};

    for (const sess of sessions) {
      const camp = sess.campaignId;
      if (!stats[camp]) {
        stats[camp] = { totalCalls: 0, dispositions: {} };
      }
      stats[camp].totalCalls++;
      const disp = (sess as any).summaryReport?.disposition || 'IN_PROGRESS';
      stats[camp].dispositions[disp] = (stats[camp].dispositions[disp] || 0) + 1;
    }

    return reply.status(200).send({
      success: true,
      totalActiveOrSavedCalls: sessions.length,
      analyticsByCampaign: stats,
    });
  });

  // -------------------------------------------------------------
  // 4. GET /v1/calls/:callId — Get full call lifecycle & summary
  //    Fix #8: Registered AFTER /analytics to prevent conflict
  // -------------------------------------------------------------
  fastify.get('/v1/calls/:callId', async (request: FastifyRequest<{ Params: { callId: string } }>, reply: FastifyReply) => {
    const { callId } = request.params;
    // Fix #7: Use getSessionById with disk fallback
    const session = getSessionById(callId);

    if (!session) {
      return reply.status(404).send({
        success: false,
        error: `Call session not found: ${callId}`,
      });
    }

    return reply.status(200).send({
      success: true,
      session,
    });
  });
}
