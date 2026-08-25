import fs from 'fs';
import path from 'path';
import chokidar, { FSWatcher } from 'chokidar';
import { Campaign, CampaignSchema } from '../schemas/campaign.schema';
import { Agent, AgentSchema } from '../schemas/agent.schema';
import { logger } from '../utils/logger';

const campaignsMap = new Map<string, Campaign>();
const agentsMap = new Map<string, Agent>();

let watcher: FSWatcher | null = null;

// Use process.cwd() so paths are stable in both dev (tsx src/) and production (dist/) builds
const CAMPAIGNS_DIR = path.resolve(process.cwd(), 'src', 'data', 'campaigns');
const AGENTS_DIR = path.resolve(process.cwd(), 'src', 'data', 'agents');

export function loadCampaignFile(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);
    const result = CampaignSchema.safeParse(json);
    if (result.success) {
      campaignsMap.set(result.data.id, result.data);
      logger.info({ campaignId: result.data.id, filePath }, 'Loaded campaign configuration');
      return true;
    } else {
      logger.error({ filePath, errors: result.error.errors }, 'Failed to validate campaign schema; retaining previous version if present');
      return false;
    }
  } catch (err) {
    logger.error({ filePath, err }, 'Failed to read/parse campaign file');
    return false;
  }
}

export function loadAgentFile(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);
    const result = AgentSchema.safeParse(json);
    if (result.success) {
      agentsMap.set(result.data.id, result.data);
      logger.info({ agentId: result.data.id, filePath }, 'Loaded agent configuration');
      return true;
    } else {
      logger.error({ filePath, errors: result.error.errors }, 'Failed to validate agent schema; retaining previous version if present');
      return false;
    }
  } catch (err) {
    logger.error({ filePath, err }, 'Failed to read/parse agent file');
    return false;
  }
}

export function loadAllConfigs(): void {
  if (fs.existsSync(CAMPAIGNS_DIR)) {
    const files = fs.readdirSync(CAMPAIGNS_DIR).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      loadCampaignFile(path.join(CAMPAIGNS_DIR, file));
    }
  }

  if (fs.existsSync(AGENTS_DIR)) {
    const files = fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      loadAgentFile(path.join(AGENTS_DIR, file));
    }
  }
}

import { clearStaticPromptCache } from '../prompt/buildPrompt';

export function initLoader(): void {
  loadAllConfigs();

  watcher = chokidar.watch([CAMPAIGNS_DIR, AGENTS_DIR], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  watcher.on('add', (filePath) => {
    if (!filePath.endsWith('.json')) return;
    logger.info({ filePath }, 'Hot-reload: file added');
    clearStaticPromptCache();
    if (filePath.includes('campaigns')) loadCampaignFile(filePath);
    if (filePath.includes('agents')) loadAgentFile(filePath);
  });

  watcher.on('change', (filePath) => {
    if (!filePath.endsWith('.json')) return;
    logger.info({ filePath }, 'Hot-reload: file changed');
    clearStaticPromptCache();
    if (filePath.includes('campaigns')) loadCampaignFile(filePath);
    if (filePath.includes('agents')) loadAgentFile(filePath);
  });

  watcher.on('unlink', (filePath) => {
    if (!filePath.endsWith('.json')) return;
    logger.info({ filePath }, 'Hot-reload: file deleted');
    clearStaticPromptCache();
    const id = path.basename(filePath, '.json');
    if (filePath.includes('campaigns')) campaignsMap.delete(id);
    if (filePath.includes('agents')) agentsMap.delete(id);
  });
}

export function stopLoader(): Promise<void> | void {
  if (watcher) {
    return watcher.close();
  }
}

export function getCampaign(id: string): Campaign | undefined {
  return campaignsMap.get(id);
}

export function getAgent(id: string): Agent | undefined {
  return agentsMap.get(id);
}

export function getAllCampaigns(): Campaign[] {
  return Array.from(campaignsMap.values());
}

export function getAllAgents(): Agent[] {
  return Array.from(agentsMap.values());
}

export function saveCampaign(campaign: Campaign): void {
  const result = CampaignSchema.parse(campaign);
  const filePath = path.join(CAMPAIGNS_DIR, `${result.id}.json`);
  if (!fs.existsSync(CAMPAIGNS_DIR)) {
    fs.mkdirSync(CAMPAIGNS_DIR, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
  campaignsMap.set(result.id, result);
}

export function saveAgent(agent: Agent): void {
  const result = AgentSchema.parse(agent);
  const filePath = path.join(AGENTS_DIR, `${result.id}.json`);
  if (!fs.existsSync(AGENTS_DIR)) {
    fs.mkdirSync(AGENTS_DIR, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
  agentsMap.set(result.id, result);
}

export function deleteCampaign(id: string): boolean {
  const filePath = path.join(CAMPAIGNS_DIR, `${id}.json`);
  campaignsMap.delete(id);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

export function deleteAgent(id: string): boolean {
  const filePath = path.join(AGENTS_DIR, `${id}.json`);
  agentsMap.delete(id);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
