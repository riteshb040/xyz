import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { logger } from './utils/logger';
import { initLoader, stopLoader } from './config/loader';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import { generateRoute } from './routes/generate';
import { chatCompletionsRoute } from './routes/chatCompletions';
import { campaignsRoute } from './routes/campaigns';
import { agentsRoute } from './routes/agents';
import { healthRoute } from './routes/health';
import { playgroundRoute } from './routes/playground';
import { sessionsRoute } from './routes/sessions';
import { callsRoute } from './routes/calls';

async function bootstrap() {
  const server = Fastify({
    logger: false, // We use custom Pino logger
  });

  // Register CORS
  await server.register(cors, {
    origin: '*',
  });

  // Global Auth Hook
  server.addHook('onRequest', apiKeyAuth);

  // Initialize Config Loader & Hot Reload Watcher
  initLoader();

  // Register Routes
  await server.register(healthRoute);
  await server.register(playgroundRoute);
  await server.register(sessionsRoute);
  await server.register(callsRoute);
  await server.register(generateRoute);
  await server.register(chatCompletionsRoute);
  await server.register(campaignsRoute);
  await server.register(agentsRoute);

  // Graceful Shutdown
  const closeHandler = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down Prompt Orchestrator gracefully...`);
    await stopLoader();
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => closeHandler('SIGINT'));
  process.on('SIGTERM', () => closeHandler('SIGTERM'));

  try {
    const address = await server.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`🚀 Prompt Orchestrator microservice running at ${address}`);
  } catch (err) {
    logger.error({ err }, 'Error starting Prompt Orchestrator server');
    process.exit(1);
  }
}

bootstrap();
