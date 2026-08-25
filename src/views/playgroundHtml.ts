export const playgroundHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prompt Orchestrator — Live Chat Playground</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #0a0c10;
      --bg-surface: rgba(18, 22, 31, 0.75);
      --bg-card: rgba(28, 35, 49, 0.6);
      --border-color: rgba(255, 255, 255, 0.1);
      --accent-primary: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.35);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --user-msg-bg: linear-gradient(135deg, #4f46e5, #4338ca);
      --agent-msg-bg: rgba(30, 41, 59, 0.8);
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --danger-color: #ef4444;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg-primary);
      color: var(--text-main);
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 40%);
      overflow: hidden;
    }

    /* Header */
    header {
      padding: 16px 28px;
      border-bottom: 1px solid var(--border-color);
      background: rgba(10, 12, 16, 0.8);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #6366f1, #10b981);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      box-shadow: 0 0 15px var(--accent-glow);
    }

    .brand-title h1 {
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .brand-title p {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 0.78rem;
      font-weight: 500;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }

    /* Layout */
    .container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Sidebar Controls */
    .sidebar {
      width: 360px;
      border-right: 1px solid var(--border-color);
      background: var(--bg-surface);
      backdrop-filter: blur(16px);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
    }

    .panel-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .panel-group label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    select, input {
      width: 100%;
      padding: 10px 14px;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-family: inherit;
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;
    }
    select:focus, input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 10px var(--accent-glow);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .btn {
      padding: 11px 18px;
      border-radius: 8px;
      border: none;
      font-family: inherit;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #fff;
      box-shadow: 0 4px 15px var(--accent-glow);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-main);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    /* Main Chat Section */
    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: rgba(10, 12, 16, 0.4);
    }

    .chat-messages {
      flex: 1;
      padding: 24px 32px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      max-width: 78%;
      display: flex;
      flex-direction: column;
      gap: 6px;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message-user {
      align-self: flex-end;
    }
    .message-user .bubble {
      background: var(--user-msg-bg);
      color: #fff;
      border-radius: 16px 16px 2px 16px;
      padding: 12px 18px;
      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.2);
    }

    .message-agent {
      align-self: flex-start;
    }
    .message-agent .bubble {
      background: var(--agent-msg-bg);
      border: 1px solid var(--border-color);
      color: #f3f4f6;
      border-radius: 16px 16px 16px 2px;
      padding: 14px 20px;
      backdrop-filter: blur(8px);
    }

    .meta-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    .pill {
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    .pill-highlight {
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      border-color: rgba(99, 102, 241, 0.4);
    }
    .pill-alert {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.4);
    }

    /* Input Bar */
    .chat-input-area {
      padding: 18px 28px;
      border-top: 1px solid var(--border-color);
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(12px);
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .chat-input-area input {
      flex: 1;
      font-size: 0.95rem;
      padding: 13px 18px;
    }

    /* Preset Scenarios */
    .presets {
      display: flex;
      gap: 8px;
      padding: 10px 28px;
      background: rgba(10, 12, 16, 0.6);
      border-top: 1px solid var(--border-color);
      overflow-x: auto;
    }
    .preset-chip {
      font-size: 0.75rem;
      padding: 6px 12px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .preset-chip:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--accent-primary);
      color: var(--text-main);
    }

    /* Loading Spinner */
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 6px 0;
    }
    .dot {
      width: 6px;
      height: 6px;
      background: #818cf8;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <div class="brand-logo">AI</div>
      <div class="brand-title">
        <h1>Prompt Orchestrator Playground</h1>
        <p>Interactive Chat Simulator for Voice Loan Recovery Agent</p>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <a href="/admin" style="text-decoration: none; padding: 6px 14px; border-radius: 10px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.35); color: #818cf8; font-size: 0.82rem; font-weight: 600; transition: all 0.2s ease;">⚙️ Admin Dashboard ➔</a>
      <div class="badge-status">
        <span class="status-dot"></span>
        Sarvam AI Connected (sarvam-105b)
      </div>
    </div>
  </header>

  <div class="container">

    <!-- Left Controls Sidebar -->
    <div class="sidebar">

      <div class="panel-group">
        <label>Campaign Strategy</label>
        <select id="campaignSelect">
          <option value="loan-default-30day">30-Day Default Reminder</option>
          <option value="loan-default-90day">90-Day Urgent Recovery</option>
          <option value="settlement-offer">One-Time Settlement (OTS)</option>
        </select>
      </div>

      <div class="panel-group">
        <label>Agent Persona</label>
        <select id="agentSelect">
          <option value="polite-reminder">Polite Reminder Agent</option>
          <option value="firm-recovery">Firm Recovery Officer</option>
          <option value="settlement-negotiator">Settlement Specialist</option>
        </select>
      </div>

      <div class="panel-group">
        <label>Customer Name</label>
        <input type="text" id="varCustomerName" value="Rakesh Sharma">
      </div>

      <div class="grid-2">
        <div class="panel-group">
          <label>Debt Amount (₹)</label>
          <input type="number" id="varDebtAmount" value="24500">
        </div>
        <div class="panel-group">
          <label>Days Overdue</label>
          <input type="number" id="varDaysOverdue" value="15">
        </div>
      </div>

      <div class="grid-2">
        <div class="panel-group">
          <label>Loan ID</label>
          <input type="text" id="varLoanId" value="LN-88213">
        </div>
        <div class="panel-group">
          <label>Due Date</label>
          <input type="text" id="varDueDate" value="2026-08-10">
        </div>
      </div>

      <div class="panel-group" id="otsSection" style="display:none;">
        <label>Settlement Amount (₹)</label>
        <input type="number" id="varSettlementAmount" value="15000">
      </div>

      <div class="grid-2" style="margin-top: 10px;">
        <button class="btn btn-primary" id="btnStartCall">
          📞 Start Call
        </button>
        <button class="btn btn-secondary" id="btnClearChat">
          🗑️ Clear
        </button>
      </div>

    </div>

    <!-- Main Chat Window -->
    <div class="chat-container">

      <!-- Chat Messages -->
      <div class="chat-messages" id="chatMessages">
        <div class="message message-agent">
          <div class="bubble">
            👋 Welcome to the <strong>Prompt Orchestrator Playground</strong>.
            <br><br>
            Click <strong>"Start Call"</strong> on the left to initiate the automated call sequence, or type a customer message below to test turn-by-turn recovery dialogue with Sarvam AI!
          </div>
        </div>
      </div>

      <!-- Quick Preset Chips -->
      <div class="presets">
        <span class="preset-chip" onclick="sendPreset('Haan bolo, kaun bol raha hai?')">"Haan bolo, kaun bol raha hai?"</span>
        <span class="preset-chip" onclick="sendPreset('Main aaj payment nahi kar sakta, problem hai.')">"Main aaj payment nahi kar sakta"</span>
        <span class="preset-chip" onclick="sendPreset('Mujhe thoda discount mil sakta hai kya?')">"Discount mil sakta hai?"</span>
        <span class="preset-chip" onclick="sendPreset('Mere manager se baat karao.')">"Manager se baat karao"</span>
      </div>

      <!-- Chat Input Bar -->
      <div class="chat-input-area">
        <input type="text" id="userMessageInput" placeholder="Type customer reply (e.g. 'Haan, main kal payment kar dunga')..." onkeydown="if(event.key==='Enter') sendMessage()">
        <button class="btn btn-primary" onclick="sendMessage()">
          Send ➔
        </button>
      </div>

    </div>

  </div>

  <script>
    let conversationHistory = [];

    // Toggle settlement inputs
    document.getElementById('campaignSelect').addEventListener('change', (e) => {
      const ots = document.getElementById('otsSection');
      ots.style.display = e.target.value === 'settlement-offer' ? 'flex' : 'none';
    });

    document.getElementById('btnStartCall').addEventListener('click', () => {
      conversationHistory = [];
      document.getElementById('chatMessages').innerHTML = '';
      sendGenerateRequest();
    });

    document.getElementById('btnClearChat').addEventListener('click', () => {
      conversationHistory = [];
      document.getElementById('chatMessages').innerHTML = \`
        <div class="message message-agent">
          <div class="bubble">Chat cleared. Click "Start Call" to initiate a new dialogue turn.</div>
        </div>
      \`;
    });

    function sendPreset(text) {
      document.getElementById('userMessageInput').value = text;
      sendMessage();
    }

    async function sendMessage() {
      const input = document.getElementById('userMessageInput');
      const text = input.value.trim();
      if (!text) return;

      // Append user message
      appendMessage('user', text);
      conversationHistory.push({ role: 'user', content: text });
      input.value = '';

      await sendGenerateRequest();
    }

    async function sendGenerateRequest() {
      const messagesContainer = document.getElementById('chatMessages');

      // Append loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'message message-agent';
      loadingDiv.id = 'loadingMsg';
      loadingDiv.innerHTML = \`
        <div class="bubble">
          <div class="typing-indicator">
            <div class="dot"></div><div class="dot"></div><div class="dot"></div>
          </div>
        </div>
      \`;
      messagesContainer.appendChild(loadingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      const campaignId = document.getElementById('campaignSelect').value;
      const agentId = document.getElementById('agentSelect').value;

      const variables = {
        customerName: document.getElementById('varCustomerName').value,
        debtAmount: Number(document.getElementById('varDebtAmount').value),
        currency: 'INR',
        dueDate: document.getElementById('varDueDate').value,
        daysOverdue: Number(document.getElementById('varDaysOverdue').value),
        loanId: document.getElementById('varLoanId').value,
      };

      if (campaignId === 'settlement-offer') {
        variables.settlementAmount = Number(document.getElementById('varSettlementAmount').value || 15000);
        variables.discountPercentage = '35%';
        variables.validUntilDate = '2026-08-30';
      }

      try {
        const response = await fetch('/v1/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'orchestrator-secret-key-123'
          },
          body: JSON.stringify({
            campaignId,
            agentId,
            language: 'hi-IN',
            variables,
            conversationHistory
          })
        });

        const data = await response.json();
        document.getElementById('loadingMsg')?.remove();

        if (data.success) {
          const agentText = data.response.text;
          conversationHistory.push({ role: 'assistant', content: agentText });
          appendMessage('agent', agentText, data.meta, data.response.flags, data.response.suggestedNextAction);
        } else {
          appendMessage('agent', '⚠️ Error: ' + (data.error || 'Request failed'));
        }
      } catch (err) {
        document.getElementById('loadingMsg')?.remove();
        appendMessage('agent', '❌ Connection Error: ' + err.message);
      }
    }

    function appendMessage(sender, text, meta, flags, action) {
      const container = document.getElementById('chatMessages');
      const div = document.createElement('div');
      div.className = \`message message-\${sender}\`;

      let metaHtml = '';
      if (meta) {
        metaHtml = \`
          <div class="meta-pills">
            <span class="pill pill-highlight">⚡ \${meta.latencyMs}ms</span>
            <span class="pill">tokens: \${meta.promptTokens || 0}/\${meta.completionTokens || 0}</span>
            <span class="pill">action: \${action || 'next'}</span>
            \${flags?.escalationNeeded ? '<span class="pill pill-alert">🚨 ESCALATION NEEDED</span>' : ''}
            \${flags?.sentimentDetected ? \`<span class="pill">sentiment: \${flags.sentimentDetected}</span>\` : ''}
          </div>
        \`;
      }

      div.innerHTML = \`
        <div class="bubble">\${escapeHtml(text)}</div>
        \${metaHtml}
      \`;

      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }

    function escapeHtml(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  </script>
</body>
</html>`;
