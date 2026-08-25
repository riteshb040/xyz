import { callSarvamLLM } from '../src/llm/sarvamClient';
import { buildPrompt, buildCompactVoicePrompt } from '../src/prompt/buildPrompt';
import { postProcessOutput } from '../src/llm/postProcess';
import { Campaign } from '../src/schemas/campaign.schema';
import { Agent } from '../src/schemas/agent.schema';
import { ConversationTurn } from '../src/schemas/request.schema';

const mockCampaign: Campaign = {
  id: 'loan-default-30day',
  name: '30-Day Default',
  description: 'Reminder',
  goal: 'Remind customer of overdue payment and agree on payment date',
  requiredVariables: ['customerName', 'debtAmount'],
  optionalVariables: ['dueDate'],
  scriptFlow: ['Greet customer', 'State pending debt', 'Ask for payment commitment'],
  constraints: ['Be polite, non-aggressive'],
  escalationTriggers: ['Dispute', 'Abuse'],
};

const mockAgent: Agent = {
  id: 'polite-reminder',
  name: 'Polite Reminder Agent',
  companyName: 'ABC Finance',
  persona: 'Courteous recovery agent',
  behavioralRules: ['Be polite and respectful at all times'],
  languageRules: { primary: 'hi-IN', fallback: 'en-IN', tone: 'respectful', notes: 'Hinglish' },
  outputRules: { format: 'json', maxSentences: 3, mustInclude: [], mustAvoid: [] },
};

const vars = {
  customerName: 'Rakesh Sharma',
  debtAmount: 24500,
  currency: 'INR',
  loanId: 'LN-88213',
  dueDate: '2026-08-10',
};

async function runLLMDialogue() {
  console.log('\n--- DIRECT LLM AI AGENT CONVERSATION (START TO FINISH) ---\n');

  const history: ConversationTurn[] = [];

  // TURN 1: Dynamic LLM Greeting
  console.log('🤖 AGENT (Generating initial greeting via LLM...):');
  const greetingPrompt = buildPrompt(mockCampaign, mockAgent, vars, [], 'INITIAL_GREETING');
  
  try {
    const greetingRes = await callSarvamLLM(
      'Generate the opening phone call greeting to customer Rakesh Sharma regarding loan LN-88213.',
      greetingPrompt.fullPrompt
    );

    const processedGreeting = postProcessOutput(greetingRes.rawText, mockAgent);
    console.log(`🤖 AGENT: ${processedGreeting.text} (⚡ ${greetingRes.latencyMs}ms) [intent: ${processedGreeting.intent || 'GREETING'}]`);
    history.push({ role: 'assistant', content: processedGreeting.text });
  } catch (err: any) {
    console.error('LLM Greeting Error:', err.message);
    return;
  }

  // SUBSEQUENT TURNS: Live LLM Conversation
  const customerInputs = [
    'Main aaj payment nahi kar sakta, problem hai.',
    'hello',
    'are kya he re',
    'are bhai call cut kar sale',
    'mera name btao',
    'are bhai me rakhes nhi bol rha',
  ];

  for (const input of customerInputs) {
    console.log(`\n👤 CUSTOMER: ${input}`);
    history.push({ role: 'user', content: input });

    try {
      const turnPrompt = buildCompactVoicePrompt(mockCampaign, mockAgent, vars, history);
      const res = await callSarvamLLM(turnPrompt);
      const processed = postProcessOutput(res.rawText, mockAgent);

      console.log(`🤖 AGENT: ${processed.text} (⚡ ${res.latencyMs}ms)`);
      history.push({ role: 'assistant', content: processed.text });
    } catch (err: any) {
      console.error('LLM Response Error:', err.message);
    }
  }

  console.log('\n--- DIRECT LLM CONVERSATION COMPLETE ---\n');
}

runLLMDialogue();
