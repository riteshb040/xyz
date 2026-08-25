import { buildCompactVoicePrompt } from '../src/prompt/buildPrompt';
import { callSarvamLLMStream } from '../src/llm/sarvamClient';
import { postProcessOutput } from '../src/llm/postProcess';
import { Campaign } from '../src/schemas/campaign.schema';
import { Agent } from '../src/schemas/agent.schema';

const mockCampaign: Campaign = {
  id: 'loan-default-30day',
  name: '30-Day Default',
  description: 'Reminder',
  goal: 'Remind payment of overdue loan and agree on a repayment commitment date',
  requiredVariables: ['customerName', 'debtAmount'],
  optionalVariables: ['dueDate'],
  scriptFlow: ['Greet customer', 'State pending debt', 'Ask for payment commitment'],
  constraints: ['Be polite, courteous, respectful at all times'],
  escalationTriggers: ['Dispute'],
};

const mockAgent: Agent = {
  id: 'polite-reminder',
  name: 'Polite Reminder Agent',
  companyName: 'ABC Finance',
  persona: 'Courteous multi-lingual loan recovery representative',
  behavioralRules: [
    'Be polite and empathetic to customer problems',
    'Never threaten legal or police action',
    'Focus on agreeing a repayment commitment date',
    'Auto-detect customer language and respond in the same language',
  ],
  languageRules: { primary: 'hi-IN', fallback: 'en-IN', tone: 'respectful', notes: 'Auto-detect customer language (Hindi, Gujarati, Marathi, Tamil, Telugu, English, etc.)' },
  outputRules: { format: 'json', maxSentences: 2, mustInclude: [], mustAvoid: [] },
};

const vars = {
  customerName: 'Rakesh Sharma',
  debtAmount: 24500,
  currency: 'INR',
  loanId: 'LN-88213',
  dueDate: '2026-08-10',
};

const history: any[] = [];
// Multi-lingual inputs testing mid-call language switching & auto-detection!
const inputs = [
  'Main aaj payment nahi kar sakta, thodi problem hai.',          // Hindi / Hinglish
  'Tamare shun jankari joiye chhe, hu kale paise aapis.',         // Gujarati
  'Can you please confirm what is the total due amount?',        // English
  'Maza naav Rakesh nahi ahe, tumhi konala phone kela?',        // Marathi
];

async function main() {
  console.log('\n--- MULTI-LINGUAL AUTO-DETECTION & LLM STREAMING DIALOGUE ---\n');

  // TURN 1: Dynamic LLM Streaming Greeting
  const start = Date.now();
  const greetingPrompt = buildCompactVoicePrompt(mockCampaign, mockAgent, vars, [], 'INITIAL_GREETING');
  
  try {
    process.stdout.write('🤖 AGENT (LLM Stream): ');
    let firstTokenTime: number | null = null;
    
    const greetingRes = await callSarvamLLMStream(greetingPrompt.messages, (chunk: string) => {
      if (firstTokenTime === null) {
        firstTokenTime = Date.now() - start;
      }
      process.stdout.write(chunk);
    });

    const processedGreeting = postProcessOutput(greetingRes.rawText, mockAgent, 'voice');
    const totalLatency = Date.now() - start;
    console.log(`\n   ⚡ TTFT: ${firstTokenTime || totalLatency}ms | Total: ${totalLatency}ms`);
    history.push({ role: 'assistant', content: processedGreeting.text });
  } catch (err: any) {
    console.error('LLM Streaming Greeting Error:', err.message);
  }

  // SUBSEQUENT TURNS: Multi-lingual Auto-Detection Conversation
  for (const input of inputs) {
    console.log(`\n👤 CUSTOMER: ${input}`);
    history.push({ role: 'user', content: input });

    const turnStart = Date.now();
    try {
      process.stdout.write('🤖 AGENT (LLM Stream): ');
      let firstTokenTime: number | null = null;

      const fullPromptResult = buildCompactVoicePrompt(mockCampaign, mockAgent, vars, history);
      const res = await callSarvamLLMStream(fullPromptResult.messages, (chunk: string) => {
        if (firstTokenTime === null) {
          firstTokenTime = Date.now() - turnStart;
        }
        process.stdout.write(chunk);
      });

      const processed = postProcessOutput(res.rawText, mockAgent, 'voice');
      const totalLatency = Date.now() - turnStart;

      console.log(`\n   ⚡ TTFT: ${firstTokenTime || totalLatency}ms | Total: ${totalLatency}ms`);
      history.push({ role: 'assistant', content: processed.text });
    } catch (err: any) {
      console.error('\nLLM Turn Error:', err.message);
    }
  }

  console.log('\n--- MULTI-LINGUAL DIALOGUE COMPLETE ---\n');
}

main();
