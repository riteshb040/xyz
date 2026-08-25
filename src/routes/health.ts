import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAllCampaigns, getAllAgents } from '../config/loader';

export async function healthRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'prompt-orchestrator',
      stats: {
        campaignsLoaded: getAllCampaigns().length,
        agentsLoaded: getAllAgents().length,
      },
    });
  });
}
