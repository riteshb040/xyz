import { describe, it, expect } from 'vitest';
import { generateCallSummary } from '../src/llm/summarizeCall';
import { CallSession } from '../src/services/sessionStore';

describe('Call Lifecycle & Webhooks', () => {
  it('generates structured call summary report correctly', async () => {
    const mockSession: CallSession = {
      callId: 'call_lifecycle_test_1',
      campaignId: 'loan-default-30day',
      agentId: 'polite-reminder',
      startTime: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
      variables: {
        customerName: 'Rakesh Sharma',
        debtAmount: 24500,
        currency: 'INR',
      },
      history: [
        { role: 'assistant', content: 'Namaste Rakesh ji, aapka ₹24,500 overdue hai.' },
        { role: 'user', content: 'Main kal payment kar dunga.' },
      ],
    };

    const summary = await generateCallSummary(mockSession, 'PTP_PROMISED_TO_PAY', 45);

    expect(summary.callId).toBe('call_lifecycle_test_1');
    expect(summary.disposition).toBe('PTP_PROMISED_TO_PAY');
    expect(summary.customerName).toBe('Rakesh Sharma');
    expect(summary.durationSeconds).toBe(45);
  });
});
