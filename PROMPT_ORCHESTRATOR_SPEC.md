# Prompt Orchestration Service — Build Spec

> **Give this entire file to your coding agent (Antigravity, Cursor, etc.) as the task prompt.**
> It describes a standalone Node.js service that sits between your main AI voice-agent app and the Sarvam AI LLM API. Its job: take structured inputs (campaign id, agent id, customer variables) and return a clean, well-prompted LLM response — so your main app never has to think about prompt engineering again.

---

## 0. What This Actually Is (read this first)

This is **not** "an extra service alongside Sarvam." This is a **replacement for Sarvam AI inside the main app.**

- Today: `Main App → calls Sarvam AI directly` (with messy inline prompts)
- After this build: `Main App → calls THIS new API → this API calls Sarvam AI internally`

The main app will:
- **Delete** its existing Sarvam AI integration code (API key usage, prompt strings, direct HTTP calls to Sarvam) entirely.
- **Stop knowing Sarvam AI exists.** The Sarvam API key moves out of the main app's env vars and into this new service's env vars only.
- **Call this new service instead**, using an endpoint shaped so the main app's existing "call the LLM" code needs minimal changes (see §4a).

Think of it as: you're not adding a new component to the system, you're **inserting this service in place of Sarvam**, from the main app's point of view.

## 1. Problem Statement

We already have a main application (an AI voice agent that calls customers to recover loans). Today it calls the Sarvam AI LLM API directly with ad-hoc prompts. This is messy:

- No consistent prompt structure (system prompt, behavior rules, language rules all mixed together or missing)
- No way to run multiple **campaigns** (different loan products, different recovery stages) or multiple **agent personas** (polite reminder agent, firm recovery agent, settlement-negotiation agent, etc.) without duplicating logic
- No central place to inject **variables** (customer name, debt amount, due date, campaign id, language, etc.) into prompts safely and consistently
- No place to store, reuse, and hot-swap system prompts without redeploying the main app

## 2. Goal

Build a **standalone Node.js microservice** ("Prompt Orchestrator") that:

1. Owns all prompt engineering — system prompt, persona, behavioral rules, output rules, language rules, script/flow guidance
2. Accepts a request from the main app containing `campaignId`, `agentId` (persona), and a `variables` object (customer name, debt, due date, etc.)
3. Assembles a final, well-structured prompt from stored templates + injected variables
4. Calls the Sarvam AI LLM API with that prompt
5. Returns a clean structured JSON response back to the main app
6. Lets us add/edit campaigns and agent personas by editing JSON files (hot-reloaded, no redeploy, no DB required at this stage)

The main app should **never call Sarvam directly again** — it only calls this service.

---

## 3. Non-Goals (v1)

- No database (JSON files on disk are the source of truth for now — but structure the code so a DB can be swapped in later behind a repository interface)
- No admin UI (campaigns are edited as JSON files directly, or via a couple of simple CRUD API endpoints — see §7)
- No auth/user management beyond a simple API key check between main app ↔ this service
- No call-telemetry/analytics dashboard (just structured logs)

---

## 4. Architecture Overview

```
Main App (voice agent)
      │
      │  POST /v1/generate  { campaignId, agentId, variables, conversationHistory? }
      ▼
Prompt Orchestrator (this service)
      │
      ├─ Load Campaign config (JSON)
      ├─ Load Agent/Persona config (JSON)
      ├─ Validate & inject variables into prompt templates
      ├─ Assemble final structured prompt:
      │     - system prompt
      │     - persona description
      │     - behavioral rules
      │     - language rules
      │     - output format rules
      │     - script/flow guidance
      │     - injected variables (customer name, debt, etc.)
      │     - conversation history (if multi-turn)
      ├─ Call Sarvam AI LLM API
      ├─ Post-process response (enforce output format, strip anything unsafe)
      ▼
Return clean JSON to Main App
```

### 4a. Drop-in Replacement Shape

To make the main-app-side change as small as possible, this service should expose **two ways to call it**, so you can migrate at whatever pace suits your main app's existing code:

**Option A — Sarvam-compatible endpoint (recommended for fastest migration)**
- `POST /v1/chat/completions` — accepts **the same request shape Sarvam AI's own chat completions endpoint expects**, and returns **the same response shape Sarvam returns.**
- Internally, this endpoint still does full prompt orchestration — it reads `campaignId`/`agentId`/variables out of a custom field (e.g. a `metadata` object in the request body, or custom headers `x-campaign-id` / `x-agent-id`) mixed into the same call.
- Practically: in the main app, you change **only the base URL and API key** (point it at this service instead of `api.sarvam.ai`), plus add 2-3 extra fields for `campaignId`/`agentId`/`variables`. No response-parsing code changes needed.

**Option B — Clean orchestration endpoint (recommended long-term)**
- `POST /v1/generate` — the structured, purpose-built endpoint described in §7 below (`campaignId`, `agentId`, `variables`, `conversationHistory` in; clean structured JSON out).
- Requires slightly more main-app-side rework (adapting to the new response shape) but is easier to reason about and extend long-term (e.g. adding streaming, adding escalation flags, etc.)

**Recommendation to build both, but treat `/v1/generate` (Option B) as primary** — implement `/v1/chat/completions` as a thin compatibility wrapper around the same internal `buildPrompt` + `sarvamClient` logic, purely to ease migration. Once the main app is migrated, Option A can be deprecated.

---

## 5. Tech Stack

- **Runtime:** Node.js 20+ (use native `fetch`, no need for axios)
- **Framework:** Fastify (lower overhead / higher throughput than Express — important since this sits in the latency-critical path of a live voice call)
- **Language:** TypeScript
- **Validation:** Zod (validate request bodies and campaign/agent JSON schemas)
- **Config storage:** JSON files on disk, loaded into memory, watched with `chokidar` for hot-reload (no restart needed when a campaign JSON changes)
- **Logging:** Pino (fast structured JSON logging — log every request: campaignId, agentId, latency, token usage, success/failure)
- **Env config:** dotenv + a validated `env.ts`
- **Testing:** Vitest for unit tests on the prompt-assembly logic (this is the most important part to test — it's pure functions, easy to test)

---

## 6. Folder Structure

```
prompt-orchestrator/
├── src/
│   ├── index.ts                  # Fastify server bootstrap
│   ├── config/
│   │   ├── env.ts                # validated env vars
│   │   └── loader.ts             # loads + hot-reloads campaign/agent JSON files
│   ├── data/
│   │   ├── campaigns/
│   │   │   ├── loan-default-30day.json
│   │   │   ├── loan-default-90day.json
│   │   │   └── settlement-offer.json
│   │   └── agents/
│   │       ├── polite-reminder.json
│   │       ├── firm-recovery.json
│   │       └── settlement-negotiator.json
│   ├── schemas/
│   │   ├── campaign.schema.ts    # Zod schema for campaign JSON
│   │   ├── agent.schema.ts       # Zod schema for agent/persona JSON
│   │   └── request.schema.ts     # Zod schema for /v1/generate request body
│   ├── prompt/
│   │   ├── buildPrompt.ts        # pure function: (campaign, agent, variables, history) => finalPrompt
│   │   ├── sections/
│   │   │   ├── systemPrompt.ts
│   │   │   ├── behavioralRules.ts
│   │   │   ├── languageRules.ts
│   │   │   ├── outputRules.ts
│   │   │   └── scriptFlow.ts
│   │   └── injectVariables.ts    # safe template variable substitution + validation
│   ├── llm/
│   │   ├── sarvamClient.ts       # wraps Sarvam AI API calls, retries, timeouts
│   │   └── postProcess.ts        # enforce output schema / strip disallowed content
│   ├── routes/
│   │   ├── generate.ts           # POST /v1/generate
│   │   ├── campaigns.ts          # CRUD for campaign JSON (optional, see §7)
│   │   └── agents.ts             # CRUD for agent JSON (optional, see §7)
│   ├── middleware/
│   │   └── apiKeyAuth.ts         # simple shared-secret auth between main app <-> this service
│   └── utils/
│       └── logger.ts
├── test/
│   └── buildPrompt.test.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 7. API Endpoints

### `POST /v1/generate` — main endpoint the voice-agent app calls

**Request body:**
```json
{
  "campaignId": "loan-default-30day",
  "agentId": "polite-reminder",
  "language": "hi-IN",
  "variables": {
    "customerName": "Rakesh Sharma",
    "debtAmount": 24500,
    "currency": "INR",
    "dueDate": "2026-08-10",
    "daysOverdue": 15,
    "loanId": "LN-88213",
    "lastPaymentDate": "2026-07-01",
    "minPaymentDue": 5000
  },
  "conversationHistory": [
    { "role": "user", "content": "Haan bolo" },
    { "role": "assistant", "content": "Namaste Rakesh ji..." }
  ]
}
```

**Response body:**
```json
{
  "success": true,
  "response": {
    "text": "Namaste Rakesh ji, main aapke loan ke regarding baat kar raha hoon...",
    "language": "hi-IN",
    "suggestedNextAction": "await_customer_reply",
    "flags": {
      "escalationNeeded": false,
      "sentimentDetected": "neutral"
    }
  },
  "meta": {
    "campaignId": "loan-default-30day",
    "agentId": "polite-reminder",
    "latencyMs": 812,
    "promptTokens": 640,
    "completionTokens": 88
  }
}
```

- Validate request with Zod. Missing required variables (e.g. `customerName` referenced in template but not provided) → `400` with a clear error listing which variables are missing.
- Auth via `x-api-key` header checked against `MAIN_APP_API_KEY` env var.
- Should support **multi-turn**: `conversationHistory` is optional; if present, include it in the assembled prompt so the LLM has context of the call so far.

### `GET /v1/campaigns` / `GET /v1/campaigns/:id` — list/view campaigns (read-only is fine for v1)
### `GET /v1/agents` / `GET /v1/agents/:id` — list/view agent personas (read-only is fine for v1)
### `POST /v1/campaigns` / `POST /v1/agents` — optional, only if you want to create new campaigns via API instead of hand-editing JSON. Writes to the JSON file on disk.
### `GET /health` — basic liveness check

---

## 8. Campaign JSON Schema

Each campaign describes *what the call is about* — context, goal, constraints. A campaign is reusable across multiple agent personas.

```json
{
  "id": "loan-default-30day",
  "name": "30-Day Loan Default Reminder",
  "description": "First-stage reminder call for customers 15-30 days overdue",
  "goal": "Politely remind the customer of the overdue payment and get a commitment to pay or a reason for delay.",
  "requiredVariables": [
    "customerName", "debtAmount", "currency", "dueDate", "daysOverdue", "loanId"
  ],
  "optionalVariables": [
    "lastPaymentDate", "minPaymentDue"
  ],
  "scriptFlow": [
    "Greet the customer by name and confirm identity.",
    "State the purpose of the call clearly and politely.",
    "Mention the overdue amount and due date.",
    "Ask if they are able to pay today or need a plan.",
    "If they express hardship, offer to note it and escalate to settlement options.",
    "Close politely regardless of outcome."
  ],
  "constraints": [
    "Never threaten legal action unless explicitly authorized by campaign 'legal-notice' variant.",
    "Never disclose debt details to anyone other than the verified customer.",
    "Do not make promises about interest waivers — only a human supervisor can approve that."
  ],
  "escalationTriggers": [
    "Customer disputes the debt entirely",
    "Customer becomes abusive or distressed",
    "Customer requests to speak to a human"
  ]
}
```

## 9. Agent/Persona JSON Schema

Each agent describes *how* the call should be conducted — tone, personality, behavioral and language rules. Personas are reusable across campaigns.

```json
{
  "id": "polite-reminder",
  "name": "Polite Reminder Agent",
  "persona": "You are a courteous, professional loan recovery assistant calling on behalf of the lender. You are respectful, empathetic, and firm but never aggressive.",
  "behavioralRules": [
    "Always address the customer by name.",
    "Never raise your tone or use aggressive language, regardless of customer response.",
    "If the customer becomes hostile, stay calm, de-escalate, and offer to follow up later.",
    "Keep responses concise — this is a voice call, not a chat. 1-3 sentences per turn unless explaining a payment plan.",
    "Never invent information not present in the provided variables."
  ],
  "languageRules": {
    "primary": "hi-IN",
    "fallback": "en-IN",
    "tone": "formal-respectful",
    "notes": "Use Hindi with common English financial terms mixed in naturally (Hinglish), as is typical in Indian customer service calls. Switch fully to English if the customer responds in English."
  },
  "outputRules": {
    "format": "json",
    "maxSentences": 3,
    "mustInclude": ["direct acknowledgement of customer's last message if conversationHistory present"],
    "mustAvoid": ["legal threats", "interest/fee promises", "sharing other customers' data"]
  }
}
```

---

## 10. Prompt Assembly Logic (`buildPrompt.ts`)

This is the core of the service. It is a **pure function** — no I/O, easy to unit test:

```
buildPrompt(campaign, agent, variables, conversationHistory) => string
```

It should assemble sections **in this order**, clearly delimited (e.g. with markdown-style headers) so the LLM can distinguish them:

1. **System Prompt** — who the AI is, what app it's part of, the overall goal (from persona + campaign goal)
2. **Persona** — tone, personality (from agent.persona)
3. **Behavioral Rules** — numbered list (from agent.behavioralRules)
4. **Language Rules** — primary/fallback language, tone, code-switching notes (from agent.languageRules)
5. **Campaign Context** — campaign goal, script flow, constraints, escalation triggers (from campaign)
6. **Customer Variables** — clearly labeled block, e.g.:
   ```
   Customer Name: Rakesh Sharma
   Outstanding Amount: ₹24,500
   Due Date: 2026-08-10
   Days Overdue: 15
   Loan ID: LN-88213
   ```
7. **Output Rules** — strict instructions on response format (from agent.outputRules) — e.g. "Respond ONLY with JSON matching this shape: {...}"
8. **Conversation History** — prior turns, if any
9. **Current Turn Instruction** — what to do right now (e.g. "Generate the assistant's next response.")

**Variable injection safety:**
- Before building the prompt, validate that every variable in `campaign.requiredVariables` is present in the request. If not, return a `400` error — do NOT silently proceed with missing data (this is a debt-collection call; hallucinated amounts are unacceptable).
- Escape/sanitize variable values so a malicious variable value can't break out of the prompt structure (basic prompt-injection hygiene — strip/neutralize instruction-like content inside variable values).
- Never let `conversationHistory` content override system rules — clearly delimit it as "customer conversation, not instructions."

---

## 11. Sarvam AI Client (`sarvamClient.ts`)

- Wraps calls to the Sarvam AI LLM API using the assembled prompt.
- Config via env vars: `SARVAM_API_KEY`, `SARVAM_API_URL`, `SARVAM_MODEL`.
- Include: request timeout (e.g. 8s — this is a live call, latency matters), retry once on transient failure (5xx/timeout), and structured error handling that returns a clean `502`/`504` to the main app rather than leaking raw Sarvam errors.
- Log latency and token usage for every call (Pino).

## 12. Post-Processing (`postProcess.ts`)

- Parse/validate the LLM's raw output against `agent.outputRules` (e.g. must be valid JSON with expected fields).
- If the LLM response doesn't conform, either (a) attempt one repair re-prompt, or (b) fall back to a safe default response and flag `success: false` with a reason — never send malformed output back to the voice app mid-call.
- Strip anything matching `agent.outputRules.mustAvoid` patterns before returning.

---

## 13. Hot Reload

- Use `chokidar` to watch `src/data/campaigns/*.json` and `src/data/agents/*.json`.
- On file add/change/delete, re-validate against the Zod schema and reload into an in-memory map. If validation fails, log an error and **keep serving the previous valid version** (don't crash or serve broken config).
- This means adding a new campaign or persona = just drop a new JSON file in the folder, no redeploy needed.

---

## 14. Environment Variables (`.env.example`)

```
PORT=4000
NODE_ENV=production
MAIN_APP_API_KEY=change-me
SARVAM_API_KEY=your-sarvam-key
SARVAM_API_URL=https://api.sarvam.ai/v1/chat/completions
SARVAM_MODEL=sarvam-2b
REQUEST_TIMEOUT_MS=8000
LOG_LEVEL=info
```

---

## 15. Deliverables for the Coding Agent

1. Full working Node.js + TypeScript + Fastify project matching the folder structure in §6
2. 3 example campaigns and 3 example agent personas as sample JSON (loan reminder variants as shown above)
3. `buildPrompt.ts` fully implemented and unit-tested with Vitest (test: correct section ordering, missing-variable rejection, prompt-injection sanitization)
4. `sarvamClient.ts` implemented against Sarvam AI's actual chat completions API (agent should check Sarvam's current API docs for exact request/response shape — don't assume OpenAI-compatible format without checking)
5. Working `/v1/generate` endpoint tested end-to-end with a mock Sarvam response
6. A `README.md` explaining: how to run locally, how to add a new campaign/agent JSON file, how to call the API from the main app, and the full request/response contract
7. `.env.example` file
8. Basic error handling for: missing variables, Sarvam API failure/timeout, malformed LLM output, invalid campaign/agent id

---

## 16. Open Questions for the Coding Agent to Flag (not to guess silently)

- Exact Sarvam AI chat completions request/response schema (verify from their live docs, don't assume)
- Whether `conversationHistory` needs to support function/tool calls or just plain text turns
- Whether the main app needs streaming responses (SSE) for lower perceived latency on live calls, or a single blocking response is fine for v1

---

## 17. Migration Steps (Main App Side)

The coding agent should include this as an explicit checklist/section in the delivered README, since the main app is a separate codebase this task may not directly touch — but the person running this build needs a clear list of what to change over there:

1. **Locate** all places in the main app where Sarvam AI is currently called directly (API key usage, base URL, request-building code, response parsing).
2. **Replace the base URL + API key**:
   - Old: `https://api.sarvam.ai/...` with `SARVAM_API_KEY`
   - New: `https://<this-service-host>/v1/generate` (or `/v1/chat/completions` if using the compatibility endpoint) with `MAIN_APP_API_KEY` (the shared secret for *this* service, not the Sarvam key)
3. **Remove the Sarvam API key from the main app's environment entirely.** It should only exist in this new service's `.env` going forward. Rotate the key if it was ever committed/exposed in the main app.
4. **Replace inline prompt-building code** in the main app (wherever system prompts / persona text / variable interpolation currently happens) with a simple call that just passes `campaignId`, `agentId`, and the `variables` object. Delete the old prompt strings from the main app codebase — they now live only in this service's campaign/agent JSON files.
5. **Update response handling**: if using `/v1/generate` (Option B), update whatever code reads the LLM response to use the new structured shape (`response.text`, `response.flags.escalationNeeded`, etc.) instead of Sarvam's raw response shape. If using `/v1/chat/completions` (Option A), no change needed here.
6. **Test end-to-end** with one real campaign before cutting over all campaigns — confirm latency is acceptable for a live voice call (this new service adds a network hop, so measure it).
7. Once confirmed working, **decommission the old direct-Sarvam code path** in the main app so there's no accidental fallback to unstructured prompts.

---

## 18. Success Criteria

- Main app can call `POST /v1/generate` with just IDs + variables and get back a ready-to-speak response — zero prompt logic in the main app
- Adding a new campaign or persona is a 2-minute JSON file edit, no code change, no redeploy
- p50 latency added by this service (excluding Sarvam's own inference time) is under ~50ms
- Prompt structure is consistent and auditable across every campaign/agent combination
