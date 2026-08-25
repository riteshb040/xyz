import { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env';

export async function apiKeyAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Allow health, playground & admin dashboard endpoints without API key header
  const url = request.routeOptions?.url || request.url;
  if (url === '/health' || url === '/' || url === '/playground' || url === '/admin') {
    return;
  }

  const apiKeyHeader = request.headers['x-api-key'] as string;
  const authHeader = request.headers['authorization'] as string;

  let token = apiKeyHeader;

  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token || token !== env.MAIN_APP_API_KEY) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized: Invalid or missing API key',
    });
  }
}
