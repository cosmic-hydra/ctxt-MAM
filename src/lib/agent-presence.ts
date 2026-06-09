/**
 * Agent Presence State Layer
 *
 * Lightweight, TTL-bounded "who's working what right now" beacon.
 *
 * Each agent (Claude, Codex, Gemini, etc.) posts a presence entry naming
 * itself, its provider, its role, and what it's currently focused on.
 * Teammates list presence for a channel to discover live collaborators
 * without having to read the entire context feed. Entries auto-expire after
 * `ttlSeconds` (default 5 min) so dead workers don't linger.
 *
 * This is intentionally provider-agnostic: presence is plain JSON files an
 * agent can write via the MCP tool or shell out to via the `omc-mam` CLI.
 *
 * Storage: .omc/state/agent-presence/{namespace}/{agent}.json
 *
 * Config gate: agents.presence.enabled in ~/.claude/.omc-config.json
 * (defaults to enabled).
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  readdirSync,
  renameSync,
} from 'fs';
import { join } from 'path';
import { getOmcRoot } from './worktree-paths.js';
import { withFileLockSync } from './file-lock.js';
import { getClaudeConfigDir } from '../utils/config-dir.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PresenceEntry {
  /** Stable agent name (e.g. "executor", "worker-2", "codex-1"). */
  agent: string;
  namespace: string;
  /** Free-form provider id ("claude", "codex", "gemini", "ollama:llama3", etc.). */
  provider: string;
  /** Role the agent is playing in this team (e.g. "planner", "reviewer"). */
  role?: string;
  /** Short human-readable description of current focus (e.g. "fixing flaky auth tests"). */
  focus?: string;
  /** Optional brief id this agent is working on. */
  briefId?: string;
  /** ISO timestamp of last announce/heartbeat. */
  lastSeen: string;
  /** TTL in seconds — entry is considered stale once Date.now() > lastSeen + ttl. */
  ttlSeconds: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG_FILE_NAME = '.omc-config.json';

export function isPresenceEnabled(): boolean {
  try {
    const configPath = join(getClaudeConfigDir(), CONFIG_FILE_NAME);
    if (!existsSync(configPath)) return true;
    const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
    const enabled = raw?.agents?.presence?.enabled;
    if (typeof enabled === 'boolean') return enabled;
    return true;
  } catch {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Path + validation helpers
// ---------------------------------------------------------------------------

const PRESENCE_DIR = 'state/agent-presence';

export const DEFAULT_PRESENCE_TTL_SECONDS = 5 * 60;
export const MAX_PRESENCE_TTL_SECONDS = 60 * 60;

function validateIdentifier(value: string, kind: 'namespace' | 'agent' | 'provider'): void {
  if (!value || value.length > 128) {
    throw new Error(`Invalid ${kind}: must be 1-128 characters (got ${value.length})`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value)) {
    throw new Error(`Invalid ${kind}: must be alphanumeric with hyphens/underscores/dots/colons (got "${value}")`);
  }
  if (value.includes('..')) {
    throw new Error(`Invalid ${kind}: path traversal not allowed`);
  }
}

function getNamespaceDir(namespace: string, worktreeRoot?: string): string {
  validateIdentifier(namespace, 'namespace');
  return join(getOmcRoot(worktreeRoot), PRESENCE_DIR, namespace);
}

function getEntryPath(namespace: string, agent: string, worktreeRoot?: string): string {
  validateIdentifier(agent, 'agent');
  // Files on disk swap ':' for '_' so colon-bearing agent names don't break paths.
  const safeAgent = agent.replace(/:/g, '_');
  return join(getNamespaceDir(namespace, worktreeRoot), `${safeAgent}.json`);
}

function ensureNamespaceDir(namespace: string, worktreeRoot?: string): string {
  const dir = getNamespaceDir(namespace, worktreeRoot);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function isStale(entry: PresenceEntry, now = Date.now()): boolean {
  const lastSeen = new Date(entry.lastSeen).getTime();
  if (Number.isNaN(lastSeen)) return true;
  const ttl = (entry.ttlSeconds ?? DEFAULT_PRESENCE_TTL_SECONDS) * 1000;
  return now > lastSeen + ttl;
}

// ---------------------------------------------------------------------------
// Core operations
// ---------------------------------------------------------------------------

export interface AnnounceArgs {
  namespace: string;
  agent: string;
  provider: string;
  role?: string;
  focus?: string;
  briefId?: string;
  ttlSeconds?: number;
}

/**
 * Announce or heartbeat presence. If the entry already exists, this acts as
 * a heartbeat (bumps lastSeen and overwrites focus/role/briefId/provider).
 */
export function announcePresence(args: AnnounceArgs, worktreeRoot?: string): PresenceEntry {
  validateIdentifier(args.namespace, 'namespace');
  validateIdentifier(args.agent, 'agent');
  validateIdentifier(args.provider, 'provider');

  let ttl = args.ttlSeconds ?? DEFAULT_PRESENCE_TTL_SECONDS;
  if (!Number.isFinite(ttl) || ttl <= 0) ttl = DEFAULT_PRESENCE_TTL_SECONDS;
  if (ttl > MAX_PRESENCE_TTL_SECONDS) ttl = MAX_PRESENCE_TTL_SECONDS;

  if (args.role !== undefined && args.role.length > 128) {
    throw new Error('Invalid role: must be <= 128 characters');
  }
  if (args.focus !== undefined && args.focus.length > 512) {
    throw new Error('Invalid focus: must be <= 512 characters');
  }
  if (args.briefId !== undefined) validateIdentifier(args.briefId, 'agent'); // same charset

  ensureNamespaceDir(args.namespace, worktreeRoot);
  const filePath = getEntryPath(args.namespace, args.agent, worktreeRoot);

  const entry: PresenceEntry = {
    agent: args.agent,
    namespace: args.namespace,
    provider: args.provider,
    lastSeen: new Date().toISOString(),
    ttlSeconds: ttl,
  };
  if (args.role !== undefined && args.role.length > 0) entry.role = args.role;
  if (args.focus !== undefined && args.focus.length > 0) entry.focus = args.focus;
  if (args.briefId !== undefined) entry.briefId = args.briefId;

  const lockPath = filePath + '.lock';
  const doWrite = () => {
    const tmp = `${filePath}.tmp.${process.pid}.${Date.now()}`;
    writeFileSync(tmp, JSON.stringify(entry, null, 2), { mode: 0o600 });
    renameSync(tmp, filePath);
  };

  try {
    withFileLockSync(lockPath, doWrite, { timeoutMs: 500, retryDelayMs: 25 });
  } catch {
    doWrite();
  }

  return entry;
}

export interface ListPresenceOptions {
  /** Include stale entries (default false). */
  includeStale?: boolean;
}

/**
 * List live presence in a channel. Stale entries are auto-evicted from disk
 * on read so the channel stays tidy.
 */
export function listPresence(
  namespace: string,
  opts: ListPresenceOptions = {},
  worktreeRoot?: string,
): PresenceEntry[] {
  validateIdentifier(namespace, 'namespace');

  const dir = getNamespaceDir(namespace, worktreeRoot);
  if (!existsSync(dir)) return [];

  let files: string[];
  try {
    files = readdirSync(dir).filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }

  const now = Date.now();
  const entries: PresenceEntry[] = [];

  for (const file of files) {
    const filePath = join(dir, file);
    let entry: PresenceEntry | null = null;
    try {
      entry = JSON.parse(readFileSync(filePath, 'utf-8')) as PresenceEntry;
    } catch {
      // Corrupt — remove
      try { unlinkSync(filePath); } catch { /* ignore */ }
      continue;
    }

    if (isStale(entry, now)) {
      if (!opts.includeStale) {
        try { unlinkSync(filePath); } catch { /* ignore */ }
        continue;
      }
    }

    entries.push(entry);
  }

  return entries.sort((a, b) => a.agent.localeCompare(b.agent));
}

/** Remove an agent's presence entry. Returns true if it existed. */
export function leavePresence(
  namespace: string,
  agent: string,
  worktreeRoot?: string,
): boolean {
  const filePath = getEntryPath(namespace, agent, worktreeRoot);
  if (!existsSync(filePath)) return false;
  try {
    unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Sweep stale entries across all namespaces. Returns count removed. */
export function reapStale(worktreeRoot?: string): { removed: number } {
  const root = join(getOmcRoot(worktreeRoot), PRESENCE_DIR);
  if (!existsSync(root)) return { removed: 0 };

  let namespaces: string[];
  try {
    namespaces = readdirSync(root, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);
  } catch {
    return { removed: 0 };
  }

  const now = Date.now();
  let removed = 0;
  for (const ns of namespaces) {
    const dir = join(root, ns);
    let files: string[];
    try {
      files = readdirSync(dir).filter(f => f.endsWith('.json'));
    } catch {
      continue;
    }
    for (const file of files) {
      const filePath = join(dir, file);
      try {
        const entry = JSON.parse(readFileSync(filePath, 'utf-8')) as PresenceEntry;
        if (isStale(entry, now)) {
          unlinkSync(filePath);
          removed++;
        }
      } catch {
        try { unlinkSync(filePath); removed++; } catch { /* ignore */ }
      }
    }
  }

  return { removed };
}
