import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllConfigs, getCampaign, getAgent, getAllCampaigns, getAllAgents } from '../src/config/loader';

describe('config loader', () => {
  beforeAll(() => {
    loadAllConfigs();
  });

  it('loads sample campaigns successfully into memory', () => {
    const campaigns = getAllCampaigns();
    expect(campaigns.length).toBeGreaterThanOrEqual(3);

    const loan30 = getCampaign('loan-default-30day');
    expect(loan30).toBeDefined();
    expect(loan30?.name).toContain('30-Day Loan Default');
  });

  it('loads sample agent personas successfully into memory', () => {
    const agents = getAllAgents();
    expect(agents.length).toBeGreaterThanOrEqual(3);

    const politeAgent = getAgent('polite-reminder');
    expect(politeAgent).toBeDefined();
    expect(politeAgent?.name).toBe('Polite Reminder Agent');
  });
});
