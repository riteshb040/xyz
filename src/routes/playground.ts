import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { playgroundHtml } from '../views/playgroundHtml';
import { adminDashboardHtml } from '../views/adminDashboardHtml';

export async function playgroundRoute(fastify: FastifyInstance): Promise<void> {
  // Playground UI
  fastify.get('/playground', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.type('text/html').send(playgroundHtml);
  });

  // Admin Dashboard UI
  const adminHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.type('text/html').send(adminDashboardHtml);
  };

  fastify.get('/', adminHandler);
  fastify.get('/admin', adminHandler);
}
