import fs from 'fs';
import path from 'path';
import { ConversationTurn } from '../schemas/request.schema';
import { logger } from '../utils/logger';

export interface CallSession {
  callId: string;
  campaignId: string;
  agentId: string;
  startTime: string;
  updatedTime: string;
  variables: Record<string, unknown>;
  history: ConversationTurn[];
}

// Use process.cwd() so the path is stable whether running from src/ (tsx) or dist/ (production build)
const DATA_DIR = path.resolve(process.cwd(), 'src', 'data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
const MAX_RAM_SESSIONS = 5000; // Cap active RAM sessions to prevent memory leaks during 90k calls/day
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes active TTL
const WRITE_DEBOUNCE_MS = 2000; // Debounce disk writes per callId (2 seconds)

// Fast in-memory map for active calls
const sessionsMap = new Map<string, CallSession>();

// Debounce timers per callId to prevent I/O storm at 90k calls/day
const pendingWrites = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Ensures the session storage directory exists
 */
function ensureSessionsDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

/**
 * Loads an existing call session or creates a new one
 */
export function getOrCreateSession(
  callId: string,
  campaignId: string,
  agentId: string,
  variables: Record<string, unknown>
): CallSession {
  ensureSessionsDir();

  // 1. Check RAM Cache
  if (sessionsMap.has(callId)) {
    const session = sessionsMap.get(callId)!;
    session.updatedTime = new Date().toISOString();
    return session;
  }

  // 2. RAM Memory Management (Evict oldest session if RAM cap reached)
  if (sessionsMap.size >= MAX_RAM_SESSIONS) {
    const oldestKey = sessionsMap.keys().next().value;
    if (oldestKey) {
      flushPendingWrite(oldestKey); // Flush any pending write before eviction
      sessionsMap.delete(oldestKey);
    }
  }

  // 3. Check Disk Storage
  const filePath = path.join(SESSIONS_DIR, `${callId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const session = JSON.parse(content) as CallSession;
      sessionsMap.set(callId, session);
      return session;
    } catch (err) {
      logger.warn({ callId, filePath }, 'Failed to parse disk session; starting new session');
    }
  }

  // 4. Create New Call Session
  const newSession: CallSession = {
    callId,
    campaignId,
    agentId,
    startTime: new Date().toISOString(),
    updatedTime: new Date().toISOString(),
    variables,
    history: [],
  };

  sessionsMap.set(callId, newSession);
  saveSessionToDiskAsync(newSession);
  return newSession;
}

/**
 * Gets a session by callId, checking RAM first then disk fallback.
 * Used for disposition/summary after sessions may have been evicted from RAM.
 */
export function getSessionById(callId: string): CallSession | undefined {
  // 1. Check RAM
  const ramSession = sessionsMap.get(callId);
  if (ramSession) return ramSession;

  // 2. Disk fallback
  ensureSessionsDir();
  const filePath = path.join(SESSIONS_DIR, `${callId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const session = JSON.parse(content) as CallSession;
      sessionsMap.set(callId, session); // Re-cache in RAM
      return session;
    } catch (err) {
      logger.warn({ callId }, 'Failed to read session from disk');
    }
  }

  return undefined;
}

/**
 * Appends a conversation turn and triggers debounced background disk save
 */
export function appendSessionTurn(callId: string, turn: ConversationTurn): void {
  const session = sessionsMap.get(callId);
  if (!session) return;

  session.history.push(turn);
  session.updatedTime = new Date().toISOString();
  debouncedSave(session);
}

/**
 * Immediately flush a pending debounced write for a specific callId
 */
function flushPendingWrite(callId: string): void {
  const timer = pendingWrites.get(callId);
  if (timer) {
    clearTimeout(timer);
    pendingWrites.delete(callId);
    const session = sessionsMap.get(callId);
    if (session) {
      writeSessionToDisk(session);
    }
  }
}

/**
 * Debounced disk save — prevents I/O storm at 90k calls/day (~450k turns).
 * Only writes once every WRITE_DEBOUNCE_MS per callId.
 */
function debouncedSave(session: CallSession): void {
  const existing = pendingWrites.get(session.callId);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    pendingWrites.delete(session.callId);
    writeSessionToDisk(session);
  }, WRITE_DEBOUNCE_MS);

  pendingWrites.set(session.callId, timer);
}

/**
 * Non-blocking asynchronous disk write (prevents Event Loop blocking during 90k calls/day)
 */
export function saveSessionToDiskAsync(session: CallSession): void {
  // Cancel any pending debounced write and write immediately
  const existing = pendingWrites.get(session.callId);
  if (existing) {
    clearTimeout(existing);
    pendingWrites.delete(session.callId);
  }
  writeSessionToDisk(session);
}

function writeSessionToDisk(session: CallSession): void {
  setImmediate(async () => {
    try {
      ensureSessionsDir();
      const filePath = path.join(SESSIONS_DIR, `${session.callId}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
    } catch (err) {
      logger.error({ callId: session.callId, err }, 'Failed background disk write for call session');
    }
  });
}

/**
 * Periodic RAM Garbage Collection (Cleans inactive call sessions older than 30 mins)
 */
const gcInterval = setInterval(() => {
  const now = Date.now();
  for (const [callId, session] of sessionsMap.entries()) {
    const lastUpdated = new Date(session.updatedTime).getTime();
    if (now - lastUpdated > SESSION_TTL_MS) {
      flushPendingWrite(callId); // Flush before eviction
      sessionsMap.delete(callId); // Evict from RAM (disk file remains permanent)
    }
  }
}, 5 * 60 * 1000); // Runs every 5 minutes

// Prevent the GC interval from keeping the process alive during graceful shutdown
if (gcInterval.unref) gcInterval.unref();

export function getAllSessions(): CallSession[] {
  return Array.from(sessionsMap.values());
}
