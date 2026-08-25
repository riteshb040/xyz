import { buildPrompt } from '../src/prompt/buildPrompt';
import { callSarvamLLM } from '../src/llm/sarvamClient';
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
  persona: 'Courteous loan recovery representative',
  behavioralRules: [
    'Be polite and empathetic to customer problems',
    'Never threaten legal or police action',
    'Focus on agreeing a repayment commitment date',
  ],
  languageRules: { primary: 'hi-IN', fallback: 'en-IN', tone: 'respectful', notes: 'Hinglish' },
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
const inputs = [
  'Main aaj payment nahi kar sakta, problem hai.',
  'hello',
  'are kya he re',
  'are bhai call cut kar sale',
  'mera name btao',
  'are bhai me rakhes nhi bol rha',
  'are me rakesh ka dost hu bhai shab',
];

async function main() {
  console.log('\n--- 100% DIRECT LLM AI AGENT DIALOGUE (FROM STARTING GREETING) ---\n');

  // TURN 1: Dynamic LLM Greeting generated from agent & campaign system prompt
  const start = Date.now();
  const greetingPrompt = buildPrompt(mockCampaign, mockAgent, vars, [], 'INITIAL_GREETING');
  
  try {
    const greetingRes = await callSarvamLLM(greetingPrompt.messages);
    const processedGreeting = postProcessOutput(greetingRes.rawText, mockAgent);
    const latency = Date.now() - start;
    console.log(`🤖 AGENT (LLM): ${processedGreeting.text} (⚡ ${latency}ms)`);
    history.push({ role: 'assistant', content: processedGreeting.text });
  } catch (err: any) {
    console.error('LLM Greeting Error:', err.message);
  }

  // SUBSEQUENT TURNS: Live LLM Agent Conversation using messages array & history
  for (const input of inputs) {
    console.log(`\n👤 CUSTOMER: ${input}`);
    history.push({ role: 'user', content: input });

    const turnStart = Date.now();
    try {
      const fullPromptResult = buildPrompt(mockCampaign, mockAgent, vars, history);
      const res = await callSarvamLLM(fullPromptResult.messages);
      const processed = postProcessOutput(res.rawText, mockAgent);
      const latency = Date.now() - turnStart;

      console.log(`🤖 AGENT (LLM): ${processed.text} (⚡ ${latency}ms)`);
      history.push({ role: 'assistant', content: processed.text });
    } catch (err: any) {
      console.error('LLM Turn Error:', err.message);
    }
  }

  console.log('\n--- DIRECT LLM DIALOGUE COMPLETE ---\n');
}

main();
