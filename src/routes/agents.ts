import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAllAgents, getAgent, saveAgent, deleteAgent } from '../config/loader';
import { AgentSchema } from '../schemas/agent.schema';

export async function agentsRoute(fastify: FastifyInstance): Promise<void> {
  // GET /v1/agents
  fastify.get('/v1/agents', async (_request: FastifyRequest, reply: FastifyReply) => {
    const agents = getAllAgents();
    return reply.status(200).send({
      success: true,
      count: agents.length,
      agents,
    });
  });

  // GET /v1/agents/:id
  fastify.get('/v1/agents/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const agent = getAgent(id);

    if (!agent) {
      return reply.status(404).send({
        success: false,
        error: `Agent persona not found: ${id}`,
      });
    }

    return reply.status(200).send({
      success: true,
      agent,
    });
  });

  // POST /v1/agents (Create or Update agent persona JSON)
  fastify.post('/v1/agents', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = AgentSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid agent configuration',
        details: result.error.errors,
      });
    }

    saveAgent(result.data);

    return reply.status(201).send({
      success: true,
      message: 'Agent persona configuration saved successfully',
      agent: result.data,
    });
  });

  // DELETE /v1/agents/:id
  fastify.delete('/v1/agents/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const deleted = deleteAgent(id);

    if (!deleted) {
      return reply.status(404).send({ success: false, error: `Agent persona not found: ${id}` });
    }

    return reply.status(200).send({
      success: true,
      message: `Agent persona ${id} deleted successfully`,
    });
  });
}
