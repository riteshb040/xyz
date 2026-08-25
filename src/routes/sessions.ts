import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAllSessions, getSessionById } from '../services/sessionStore';

export async function sessionsRoute(fastify: FastifyInstance): Promise<void> {
  // GET /v1/sessions (List all active/saved call sessions)
  fastify.get('/v1/sessions', async (_request: FastifyRequest, reply: FastifyReply) => {
    const sessions = getAllSessions();
    return reply.status(200).send({
      success: true,
      count: sessions.length,
      sessions,
    });
  });

  // GET /v1/sessions/:callId (Get transcript & session details for a specific callId)
  fastify.get('/v1/sessions/:callId', async (request: FastifyRequest<{ Params: { callId: string } }>, reply: FastifyReply) => {
    const { callId } = request.params;
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
