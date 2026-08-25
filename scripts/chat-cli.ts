import readline from 'readline';
import { PromptOrchestratorClient } from '../src/sdk/client';
import { ConversationTurn } from '../src/schemas/request.schema';

async function startCliChat() {
  const client = new PromptOrchestratorClient({
    baseUrl: 'http://localhost:4000',
    apiKey: 'orchestrator-secret-key-123',
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n======================================================');
  console.log('  📞 PROMPT ORCHESTRATOR — TERMINAL CHAT SIMULATOR');
  console.log('======================================================\n');

  let campaignId = 'loan-default-30day';
  let agentId = 'polite-reminder';

  const variables = {
    customerName: 'Rakesh Sharma',
    debtAmount: 24500,
    currency: 'INR',
    dueDate: '2026-08-10',
    daysOverdue: 15,
    loanId: 'LN-88213',
  };

  const history: ConversationTurn[] = [];

  console.log(`Campaign: ${campaignId}`);
  console.log(`Agent Persona: ${agentId}`);
  console.log(`Customer: ${variables.customerName} | Debt: ₹${variables.debtAmount} | Loan: ${variables.loanId}\n`);

  // Start Call
  try {
    console.log('⏳ Initiating call sequence...');
    const initialRes = await client.generate({
      campaignId,
      agentId,
      variables,
      conversationHistory: history,
    });

    const agentOpening = initialRes.response.text;
    console.log(`\n🤖 AGENT: ${agentOpening}`);
    console.log(`[latency: ${initialRes.meta.latencyMs}ms | action: ${initialRes.response.suggestedNextAction}]\n`);

    history.push({ role: 'assistant', content: agentOpening });

    const promptUser = () => {
      rl.question('👤 CUSTOMER (You): ', async (userText) => {
        const text = userText.trim();
        if (text.toLowerCase() === 'exit' || text.toLowerCase() === 'quit') {
          console.log('\n📞 Call Ended.');
          rl.close();
          process.exit(0);
        }

        if (!text) {
          promptUser();
          return;
        }

        history.push({ role: 'user', content: text });
        console.log('⏳ Sarvam AI thinking...');

        try {
          const res = await client.generate({
            campaignId,
            agentId,
            variables,
            conversationHistory: history,
          });

          const agentReply = res.response.text;
          console.log(`\n🤖 AGENT: ${agentReply}`);
          console.log(
            `[latency: ${res.meta.latencyMs}ms | tokens: ${res.meta.promptTokens}/${res.meta.completionTokens} | action: ${res.response.suggestedNextAction}]\n`
          );

          history.push({ role: 'assistant', content: agentReply });
        } catch (err: any) {
          console.error(`❌ Error: ${err.message}\n`);
        }

        promptUser();
      });
    };

    promptUser();
  } catch (err: any) {
    console.error(`❌ Failed to start call: ${err.message}`);
    console.log('Make sure the server is running on http://localhost:4000 (npm run dev)');
    process.exit(1);
  }
}

startCliChat();
