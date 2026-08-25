import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAllCampaigns, getCampaign, saveCampaign, deleteCampaign } from '../config/loader';
import { CampaignSchema } from '../schemas/campaign.schema';

export async function campaignsRoute(fastify: FastifyInstance): Promise<void> {
  // GET /v1/campaigns
  fastify.get('/v1/campaigns', async (_request: FastifyRequest, reply: FastifyReply) => {
    const campaigns = getAllCampaigns();
    return reply.status(200).send({
      success: true,
      count: campaigns.length,
      campaigns,
    });
  });

  // GET /v1/campaigns/:id
  fastify.get('/v1/campaigns/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const campaign = getCampaign(id);

    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: `Campaign not found: ${id}`,
      });
    }

    return reply.status(200).send({
      success: true,
      campaign,
    });
  });

  // POST /v1/campaigns (Create or Update campaign JSON)
  fastify.post('/v1/campaigns', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = CampaignSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid campaign configuration',
        details: result.error.errors,
      });
    }

    saveCampaign(result.data);

    return reply.status(201).send({
      success: true,
      message: 'Campaign configuration saved successfully',
      campaign: result.data,
    });
  });

  // DELETE /v1/campaigns/:id
  fastify.delete('/v1/campaigns/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const deleted = deleteCampaign(id);

    if (!deleted) {
      return reply.status(404).send({ success: false, error: `Campaign not found: ${id}` });
    }

    return reply.status(200).send({
      success: true,
      message: `Campaign ${id} deleted successfully`,
    });
  });
}
