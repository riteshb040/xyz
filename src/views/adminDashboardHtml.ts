export const adminDashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voice AI Orchestrator — Admin Control Panel</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #07090e;
      --bg-surface: rgba(15, 20, 30, 0.8);
      --bg-card: rgba(22, 29, 44, 0.7);
      --bg-card-hover: rgba(30, 40, 60, 0.85);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(99, 102, 241, 0.6);
      --accent-primary: #6366f1;
      --accent-hover: #4f46e5;
      --accent-glow: rgba(99, 102, 241, 0.3);
      --accent-emerald: #10b981;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --danger-color: #ef4444;
      --warning-color: #f59e0b;
      --success-color: #10b981;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg-primary);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-image: 
        radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.08) 0%, transparent 45%);
    }

    /* Top Navigation Bar */
    header {
      padding: 14px 28px;
      border-bottom: 1px solid var(--border-color);
      background: rgba(10, 13, 19, 0.85);
      backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #6366f1, #10b981);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.2rem;
      box-shadow: 0 0 20px var(--accent-glow);
    }

    .brand-title h1 {
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand-title p {
      font-size: 0.76rem;
      color: var(--text-muted);
    }

    .nav-tabs {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      gap: 4px;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 8px 18px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.88rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-btn:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.06);
    }

    .tab-btn.active {
      background: var(--accent-primary);
      color: #fff;
      box-shadow: 0 0 14px var(--accent-glow);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 20px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 0.78rem;
      font-weight: 500;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
    }

    /* Main Container */
    main {
      flex: 1;
      padding: 24px 32px;
      max-width: 1500px;
      width: 100%;
      margin: 0 auto;
    }

    .tab-content {
      display: none;
      animation: fadeIn 0.25s ease-out forwards;
    }
    .tab-content.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Section Header */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .section-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .section-header p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      border-radius: 10px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
      color: #fff;
      box-shadow: 0 0 16px var(--accent-glow);
    }
    .btn-primary:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      border-color: var(--border-color);
      color: var(--text-main);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.25);
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
      border-radius: 8px;
    }

    /* Grid layout for cards */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 22px;
      backdrop-filter: blur(12px);
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .card:hover {
      border-color: rgba(99, 102, 241, 0.4);
      background: var(--bg-card-hover);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .card-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.12);
      padding: 2px 8px;
      border-radius: 6px;
      margin-top: 4px;
      display: inline-block;
    }

    .card-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.45;
      margin-bottom: 16px;
    }

    .pill-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }

    .tag-pill {
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }

    .tag-pill.highlight {
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.3);
      color: #34d399;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 14px;
      border-top: 1px solid var(--border-color);
      margin-top: auto;
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal-backdrop.open {
      display: flex;
    }

    .modal {
      background: #0f141e;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      max-width: 780px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      animation: modalSlide 0.25s ease-out forwards;
    }

    @keyframes modalSlide {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.4rem;
      cursor: pointer;
      line-height: 1;
    }
    .modal-close:hover { color: #fff; }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .form-group {
      margin-bottom: 18px;
    }
    .form-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .form-group .hint {
      font-size: 0.74rem;
      color: var(--text-dim);
      margin-top: 4px;
    }

    .form-control {
      width: 100%;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s ease;
    }
    .form-control:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 10px var(--accent-glow);
    }
    textarea.form-control {
      min-height: 80px;
      resize: vertical;
      line-height: 1.45;
    }
    .form-control.code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.84rem;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .modal-footer {
      padding: 18px 24px;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.9);
      color: #fff;
      font-weight: 500;
      font-size: 0.88rem;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      display: none;
      z-index: 2000;
      animation: toastIn 0.3s ease-out forwards;
    }
    .toast.error {
      background: rgba(239, 68, 68, 0.9);
    }

    @keyframes toastIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>

  <!-- Top Header Navigation -->
  <header>
    <div class="brand">
      <div class="brand-logo">⚡</div>
      <div class="brand-title">
        <h1>Voice AI Orchestrator</h1>
        <p>Dynamic Campaign & Persona Control Panel</p>
      </div>
    </div>

    <div class="nav-tabs">
      <button class="tab-btn active" onclick="switchTab('campaignsTab')">
        🎯 Campaigns
      </button>
      <button class="tab-btn" onclick="switchTab('agentsTab')">
        🎭 Agent Personas
      </button>
      <button class="tab-btn" onclick="switchTab('analyticsTab')">
        📊 Call Analytics
      </button>
      <a href="/playground" class="tab-btn" style="text-decoration: none;">
        💬 Live Playground ➔
      </a>
    </div>

    <div class="header-actions">
      <div class="badge-status">
        <div class="status-dot"></div>
        <span>Hot-Reload Active</span>
      </div>
    </div>
  </header>

  <!-- Main Views Container -->
  <main>

    <!-- 1. CAMPAIGNS TAB -->
    <div id="campaignsTab" class="tab-content active">
      <div class="section-header">
        <div>
          <h2>Campaign Scripts & Business Goals</h2>
          <p>Configure script flows, repayment rules, escalation triggers, and variables on the fly.</p>
        </div>
        <button class="btn btn-primary" onclick="openCampaignModal()">
          ➕ Create New Campaign
        </button>
      </div>

      <div class="cards-grid" id="campaignsGrid">
        <!-- Injected via JavaScript -->
      </div>
    </div>

    <!-- 2. AGENTS TAB -->
    <div id="agentsTab" class="tab-content">
      <div class="section-header">
        <div>
          <h2>Agent Personas & Voice Characters</h2>
          <p>Define tone, Hinglish speaking styles, personality, empathy rules, and language code-switching.</p>
        </div>
        <button class="btn btn-primary" onclick="openAgentModal()">
          ➕ Create New Agent Persona
        </button>
      </div>

      <div class="cards-grid" id="agentsGrid">
        <!-- Injected via JavaScript -->
      </div>
    </div>

    <!-- 3. ANALYTICS TAB -->
    <div id="analyticsTab" class="tab-content">
      <div class="section-header">
        <div>
          <h2>Live Call Sessions & Disposition Analytics</h2>
          <p>Real-time metrics, payment promises, and disposition breakdown across all daily calls.</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="loadAnalytics()">
          🔄 Refresh Metrics
        </button>
      </div>

      <div id="analyticsContent">
        <!-- Injected via JavaScript -->
      </div>
    </div>

  </main>

  <!-- CAMPAIGN MODAL -->
  <div class="modal-backdrop" id="campaignModal">
    <div class="modal">
      <div class="modal-header">
        <h3 id="campaignModalTitle">Create Campaign</h3>
        <button class="modal-close" onclick="closeModal('campaignModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="campaignForm">
          <div class="grid-2">
            <div class="form-group">
              <label>Campaign ID</label>
              <input type="text" class="form-control code" id="campId" placeholder="e.g. credit-card-60day" required>
              <div class="hint">Unique identifier used in API requests</div>
            </div>
            <div class="form-group">
              <label>Campaign Name</label>
              <input type="text" class="form-control" id="campName" placeholder="e.g. 60-Day Credit Card Recovery" required>
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <input type="text" class="form-control" id="campDesc" placeholder="Brief summary of the campaign" required>
          </div>

          <div class="form-group">
            <label>Primary Campaign Goal</label>
            <textarea class="form-control" id="campGoal" placeholder="e.g. Secure immediate payment promise or offer 15% settlement discount if paid today." required></textarea>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>Required Variables (comma separated)</label>
              <input type="text" class="form-control code" id="campReqVars" placeholder="customerName, debtAmount" required>
            </div>
            <div class="form-group">
              <label>Optional Variables (comma separated)</label>
              <input type="text" class="form-control code" id="campOptVars" placeholder="dueDate, cardLast4, loanId">
            </div>
          </div>

          <div class="form-group">
            <label>Script Flow Steps (One step per line)</label>
            <textarea class="form-control" id="campScriptFlow" style="min-height: 100px;" placeholder="Step 1: Confirm borrower identity&#10;Step 2: Inform overdue amount and interest charges&#10;Step 3: Negotiate repayment commitment" required></textarea>
          </div>

          <div class="form-group">
            <label>Behavioral Constraints (One per line)</label>
            <textarea class="form-control" id="campConstraints" placeholder="Never threaten police or legal action&#10;Keep answers to 1-2 spoken sentences"></textarea>
          </div>

          <div class="form-group">
            <label>Escalation Triggers (One per line)</label>
            <textarea class="form-control" id="campEscalations" placeholder="Customer reports fraud&#10;Customer demands manager"></textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('campaignModal')">Cancel</button>
        <button class="btn btn-primary" onclick="saveCampaignFromForm()">💾 Save Campaign</button>
      </div>
    </div>
  </div>

  <!-- AGENT PERSONA MODAL -->
  <div class="modal-backdrop" id="agentModal">
    <div class="modal">
      <div class="modal-header">
        <h3 id="agentModalTitle">Create Agent Persona</h3>
        <button class="modal-close" onclick="closeModal('agentModal')">&times;</button>
      </div>
      <div class="modal-body">
        <form id="agentForm">
          <div class="grid-2">
            <div class="form-group">
              <label>Agent ID</label>
              <input type="text" class="form-control code" id="agId" placeholder="e.g. polite-reminder" required>
              <div class="hint">Identifier used in API calls</div>
            </div>
            <div class="form-group">
              <label>Agent Name</label>
              <input type="text" class="form-control" id="agName" placeholder="e.g. Priya Sharma" required>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>Role</label>
              <input type="text" class="form-control" id="agRole" placeholder="e.g. Empathetic Loan Repayment Specialist">
            </div>
            <div class="form-group">
              <label>Company / Organization Name</label>
              <input type="text" class="form-control" id="agCompany" placeholder="e.g. ABC Finance Care">
            </div>
          </div>

          <div class="form-group">
            <label>Persona Summary</label>
            <input type="text" class="form-control" id="agPersona" placeholder="e.g. A polite, warm, and helpful Indian voice agent" required>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>Personality Traits</label>
              <input type="text" class="form-control" id="agPersonality" placeholder="Warm, patient, respectful, non-aggressive">
            </div>
            <div class="form-group">
              <label>Tone</label>
              <input type="text" class="form-control" id="agTone" placeholder="Polite, respectful, empathetic">
            </div>
          </div>

          <div class="form-group">
            <label>Hinglish & Language Rules</label>
            <input type="text" class="form-control" id="agLangNotes" placeholder="e.g. Use natural Indian Hindi/Hinglish ('Samajh gaya ji', 'Aap batayein')">
          </div>

          <div class="form-group">
            <label>Behavioral Rules (One per line)</label>
            <textarea class="form-control" id="agBehaviorRules" placeholder="Acknowledge the customer's difficulty before asking for payment&#10;Never argue or speak aggressively&#10;Keep answers to 1-2 spoken sentences"></textarea>
          </div>

          <div class="form-group">
            <label>Must Avoid / Redacted Terms (comma separated)</label>
            <input type="text" class="form-control" id="agMustAvoid" placeholder="court, jail, police, legal notice">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('agentModal')">Cancel</button>
        <button class="btn btn-primary" onclick="saveAgentFromForm()">💾 Save Agent Persona</button>
      </div>
    </div>
  </div>

  <!-- Toast Element -->
  <div id="toast" class="toast"></div>

  <script>
    const API_KEY = 'orchestrator-secret-key-123';
    let allCampaigns = [];
    let allAgents = [];

    // Tab Switching
    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

      event.target.classList.add('active');
      document.getElementById(tabId).classList.add('active');

      if (tabId === 'campaignsTab') loadCampaigns();
      if (tabId === 'agentsTab') loadAgents();
      if (tabId === 'analyticsTab') loadAnalytics();
    }

    function showToast(msg, isError = false) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.className = isError ? 'toast error' : 'toast';
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 3000);
    }

    function openModal(id) {
      document.getElementById(id).classList.add('open');
    }
    function closeModal(id) {
      document.getElementById(id).classList.remove('open');
    }

    // -------------------------------------------------------------
    // CAMPAIGN MANAGEMENT
    // -------------------------------------------------------------
    async function loadCampaigns() {
      try {
        const res = await fetch('/v1/campaigns', { headers: { 'x-api-key': API_KEY } });
        const data = await res.json();
        allCampaigns = data.campaigns || [];
        renderCampaigns();
      } catch (err) {
        showToast('Failed to load campaigns: ' + err.message, true);
      }
    }

    function renderCampaigns() {
      const grid = document.getElementById('campaignsGrid');
      grid.innerHTML = allCampaigns.map(c => \`
        <div class="card">
          <div>
            <div class="card-top">
              <div>
                <div class="card-title">\${c.name}</div>
                <div class="card-id">\${c.id}</div>
              </div>
            </div>
            <p class="card-desc">\${c.description || 'No description'}</p>
            <div style="font-size: 0.8rem; color: #818cf8; margin-bottom: 8px; font-weight: 600;">GOAL:</div>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px; line-height: 1.4;">\${c.goal}</p>
            
            <div class="pill-group">
              <span class="tag-pill highlight">\${c.requiredVariables.length} Required Vars</span>
              <span class="tag-pill">\${(c.scriptFlow || []).length} Script Steps</span>
              <span class="tag-pill">\${(c.escalationTriggers || []).length} Escalation Rules</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-secondary btn-sm" onclick="editCampaign('\${c.id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCampaign('\${c.id}')">🗑️ Delete</button>
          </div>
        </div>
      \`).join('');
    }

    function openCampaignModal(c = null) {
      document.getElementById('campaignModalTitle').innerText = c ? 'Edit Campaign: ' + c.name : 'Create New Campaign';
      document.getElementById('campId').value = c ? c.id : '';
      document.getElementById('campId').disabled = !!c;
      document.getElementById('campName').value = c ? c.name : '';
      document.getElementById('campDesc').value = c ? c.description : '';
      document.getElementById('campGoal').value = c ? c.goal : '';
      document.getElementById('campReqVars').value = c ? c.requiredVariables.join(', ') : 'customerName, debtAmount';
      document.getElementById('campOptVars').value = c ? (c.optionalVariables || []).join(', ') : 'dueDate, loanId';
      document.getElementById('campScriptFlow').value = c ? (c.scriptFlow || []).join('\\n') : 'Step 1: Confirm borrower identity\\nStep 2: Ask for payment confirmation';
      document.getElementById('campConstraints').value = c ? (c.constraints || []).join('\\n') : 'Keep answers to 1-2 spoken sentences\\nNever threaten legal action';
      document.getElementById('campEscalations').value = c ? (c.escalationTriggers || []).join('\\n') : 'Dispute\\nDemands senior supervisor';

      openModal('campaignModal');
    }

    function editCampaign(id) {
      const c = allCampaigns.find(item => item.id === id);
      if (c) openCampaignModal(c);
    }

    async function saveCampaignFromForm() {
      const id = document.getElementById('campId').value.trim();
      const name = document.getElementById('campName').value.trim();
      const description = document.getElementById('campDesc').value.trim();
      const goal = document.getElementById('campGoal').value.trim();

      if (!id || !name || !goal) {
        showToast('Please fill all required fields', true);
        return;
      }

      const payload = {
        id,
        name,
        description,
        goal,
        requiredVariables: document.getElementById('campReqVars').value.split(',').map(s => s.trim()).filter(Boolean),
        optionalVariables: document.getElementById('campOptVars').value.split(',').map(s => s.trim()).filter(Boolean),
        scriptFlow: document.getElementById('campScriptFlow').value.split('\\n').map(s => s.trim()).filter(Boolean),
        constraints: document.getElementById('campConstraints').value.split('\\n').map(s => s.trim()).filter(Boolean),
        escalationTriggers: document.getElementById('campEscalations').value.split('\\n').map(s => s.trim()).filter(Boolean),
      };

      try {
        const res = await fetch('/v1/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          closeModal('campaignModal');
          showToast('Campaign ' + id + ' saved successfully!');
          loadCampaigns();
        } else {
          showToast('Error: ' + (data.error || 'Failed to save'), true);
        }
      } catch (err) {
        showToast('Failed to save: ' + err.message, true);
      }
    }

    async function deleteCampaign(id) {
      if (!confirm('Are you sure you want to delete campaign ' + id + '?')) return;
      try {
        const res = await fetch('/v1/campaigns/' + id, {
          method: 'DELETE',
          headers: { 'x-api-key': API_KEY }
        });
        const data = await res.json();
        if (data.success) {
          showToast('Campaign deleted');
          loadCampaigns();
        } else {
          showToast('Delete failed: ' + data.error, true);
        }
      } catch (err) {
        showToast('Error: ' + err.message, true);
      }
    }

    // -------------------------------------------------------------
    // AGENT PERSONA MANAGEMENT
    // -------------------------------------------------------------
    async function loadAgents() {
      try {
        const res = await fetch('/v1/agents', { headers: { 'x-api-key': API_KEY } });
        const data = await res.json();
        allAgents = data.agents || [];
        renderAgents();
      } catch (err) {
        showToast('Failed to load agents: ' + err.message, true);
      }
    }

    function renderAgents() {
      const grid = document.getElementById('agentsGrid');
      grid.innerHTML = allAgents.map(a => \`
        <div class="card">
          <div>
            <div class="card-top">
              <div>
                <div class="card-title">\${a.name}</div>
                <div class="card-id">\${a.id}</div>
              </div>
            </div>
            <div style="font-size: 0.82rem; color: #34d399; margin-bottom: 6px; font-weight: 500;">\${a.role || 'Voice Agent'} · \${a.companyName || 'Lender'}</div>
            <p class="card-desc">\${a.persona}</p>
            
            <div style="font-size: 0.78rem; color: var(--text-dim); margin-bottom: 10px;">
              <strong>Tone:</strong> \${a.languageRules?.tone || 'Professional'} | <strong>Lang:</strong> \${a.languageRules?.primary || 'hi-IN'}
            </div>

            <div class="pill-group">
              <span class="tag-pill highlight">\${(a.behavioralRules || []).length} Behavior Rules</span>
              <span class="tag-pill">\${(a.outputRules?.mustAvoid || []).length} Redacted Words</span>
              <span class="tag-pill">\${a.voice?.persona || 'Natural Voice'}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-secondary btn-sm" onclick="editAgent('\${a.id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteAgent('\${a.id}')">🗑️ Delete</button>
          </div>
        </div>
      \`).join('');
    }

    function openAgentModal(a = null) {
      document.getElementById('agentModalTitle').innerText = a ? 'Edit Agent: ' + a.name : 'Create New Agent Persona';
      document.getElementById('agId').value = a ? a.id : '';
      document.getElementById('agId').disabled = !!a;
      document.getElementById('agName').value = a ? a.name : '';
      document.getElementById('agRole').value = a ? (a.role || '') : 'Loan Repayment Specialist';
      document.getElementById('agCompany').value = a ? (a.companyName || '') : 'Lender Account Services';
      document.getElementById('agPersona').value = a ? a.persona : 'A polite, warm, and empathetic Indian voice agent';
      document.getElementById('agPersonality').value = a ? (a.personality || '') : 'Warm, patient, respectful, non-aggressive';
      document.getElementById('agTone').value = a ? (a.languageRules?.tone || '') : 'Polite, respectful, empathetic';
      document.getElementById('agLangNotes').value = a ? (a.languageRules?.notes || '') : 'Use natural Indian Hindi/Hinglish';
      document.getElementById('agBehaviorRules').value = a ? (a.behavioralRules || []).join('\\n') : 'Acknowledge difficulty before asking for payment\\nKeep answers to 1-2 spoken sentences';
      document.getElementById('agMustAvoid').value = a ? (a.outputRules?.mustAvoid || []).join(', ') : 'court, jail, police, legal notice';

      openModal('agentModal');
    }

    function editAgent(id) {
      const a = allAgents.find(item => item.id === id);
      if (a) openAgentModal(a);
    }

    async function saveAgentFromForm() {
      const id = document.getElementById('agId').value.trim();
      const name = document.getElementById('agName').value.trim();
      const persona = document.getElementById('agPersona').value.trim();

      if (!id || !name || !persona) {
        showToast('Please fill all required fields', true);
        return;
      }

      const payload = {
        id,
        name,
        role: document.getElementById('agRole').value.trim(),
        companyName: document.getElementById('agCompany').value.trim(),
        persona,
        personality: document.getElementById('agPersonality').value.trim(),
        behavioralRules: document.getElementById('agBehaviorRules').value.split('\\n').map(s => s.trim()).filter(Boolean),
        languageRules: {
          primary: 'hi-IN',
          fallback: 'en-IN',
          tone: document.getElementById('agTone').value.trim(),
          notes: document.getElementById('agLangNotes').value.trim()
        },
        outputRules: {
          format: 'json',
          maxSentences: 2,
          mustInclude: [],
          mustAvoid: document.getElementById('agMustAvoid').value.split(',').map(s => s.trim()).filter(Boolean)
        },
        voice: {
          persona: 'Professional Indian Voice Agent',
          speakingPace: 'Moderate / Conversational',
          energy: 'Calm & Confident',
          pronunciation: 'Clear Indian English / Hinglish'
        }
      };

      try {
        const res = await fetch('/v1/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          closeModal('agentModal');
          showToast('Agent persona ' + id + ' saved successfully!');
          loadAgents();
        } else {
          showToast('Error: ' + (data.error || 'Failed to save'), true);
        }
      } catch (err) {
        showToast('Failed to save: ' + err.message, true);
      }
    }

    async function deleteAgent(id) {
      if (!confirm('Are you sure you want to delete agent persona ' + id + '?')) return;
      try {
        const res = await fetch('/v1/agents/' + id, {
          method: 'DELETE',
          headers: { 'x-api-key': API_KEY }
        });
        const data = await res.json();
        if (data.success) {
          showToast('Agent deleted');
          loadAgents();
        } else {
          showToast('Delete failed: ' + data.error, true);
        }
      } catch (err) {
        showToast('Error: ' + err.message, true);
      }
    }

    // -------------------------------------------------------------
    // ANALYTICS MANAGEMENT
    // -------------------------------------------------------------
    async function loadAnalytics() {
      try {
        const res = await fetch('/v1/calls/analytics', { headers: { 'x-api-key': API_KEY } });
        const data = await res.json();
        const container = document.getElementById('analyticsContent');

        const stats = data.analyticsByCampaign || {};
        let campaignsHtml = '';

        for (const [campId, campData] of Object.entries(stats)) {
          let dispBadges = '';
          for (const [disp, count] of Object.entries(campData.dispositions || {})) {
            dispBadges += \`<span class="tag-pill highlight" style="margin-right: 6px;">\${disp}: <strong>\${count}</strong></span>\`;
          }
          campaignsHtml += \`
            <div class="card" style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="font-size: 1.1rem;">Campaign: <span style="color: #818cf8;">\${campId}</span></h4>
                <span class="tag-pill" style="font-size: 0.82rem;">Total Calls: <strong>\${campData.totalCalls}</strong></span>
              </div>
              <div style="margin-top: 10px;">
                \${dispBadges || '<span style="color: var(--text-dim);">No completed calls yet</span>'}
              </div>
            </div>
          \`;
        }

        container.innerHTML = \`
          <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 14px; padding: 18px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.8rem; text-transform: uppercase; color: #818cf8; font-weight: 700;">Total Tracked Daily Call Sessions</div>
              <div style="font-size: 2rem; font-weight: 800; color: #fff;">\${data.totalActiveOrSavedCalls || 0}</div>
            </div>
            <div class="badge-status">Real-time Telephony Telemetry</div>
          </div>
          <div>\${campaignsHtml || '<p style="color: var(--text-muted);">No active campaign sessions found.</p>'}</div>
        \`;
      } catch (err) {
        showToast('Failed to load analytics: ' + err.message, true);
      }
    }

    // Initial load
    loadCampaigns();
  </script>
</body>
</html>`;
