import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const mockGetOmcRoot = vi.fn<(worktreeRoot?: string) => string>();
vi.mock('../lib/worktree-paths.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/worktree-paths.js')>();
  return {
    ...actual,
    getOmcRoot: (...args: [string?]) => mockGetOmcRoot(...args),
    validateWorkingDirectory: (dir?: string) => dir || '/tmp',
  };
});

import {
  announcePresence,
  listPresence,
  leavePresence,
  reapStale,
  isPresenceEnabled,
  DEFAULT_PRESENCE_TTL_SECONDS,
  MAX_PRESENCE_TTL_SECONDS,
} from '../lib/agent-presence.js';

describe('Agent Presence', () => {
  let testDir: string;
  let omcDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `presence-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    omcDir = join(testDir, '.omc');
    mkdirSync(omcDir, { recursive: true });
    mockGetOmcRoot.mockReturnValue(omcDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('announcePresence', () => {
    it('writes a presence entry with defaults', () => {
      const entry = announcePresence({ namespace: 'team-a', agent: 'codex-1', provider: 'codex' });
      expect(entry.agent).toBe('codex-1');
      expect(entry.provider).toBe('codex');
      expect(entry.namespace).toBe('team-a');
      expect(entry.ttlSeconds).toBe(DEFAULT_PRESENCE_TTL_SECONDS);
      expect(entry.lastSeen).toBeTruthy();
    });

    it('persists to disk as JSON', () => {
      announcePresence({ namespace: 'ns', agent: 'a', provider: 'p' });
      const filePath = join(omcDir, 'state', 'agent-presence', 'ns', 'a.json');
      expect(existsSync(filePath)).toBe(true);
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(parsed.agent).toBe('a');
    });

    it('records role, focus, briefId when provided', () => {
      const entry = announcePresence({
        namespace: 'ns', agent: 'a', provider: 'p',
        role: 'executor', focus: 'fixing tests', briefId: 'b1',
      });
      expect(entry.role).toBe('executor');
      expect(entry.focus).toBe('fixing tests');
      expect(entry.briefId).toBe('b1');
    });

    it('acts as heartbeat — re-announce bumps lastSeen', async () => {
      const first = announcePresence({ namespace: 'ns', agent: 'a', provider: 'p', focus: 'old' });
      await new Promise(r => setTimeout(r, 10));
      const second = announcePresence({ namespace: 'ns', agent: 'a', provider: 'p', focus: 'new' });
      expect(new Date(second.lastSeen).getTime()).toBeGreaterThan(new Date(first.lastSeen).getTime());
      expect(second.focus).toBe('new');
    });

    it('clamps TTL to MAX_PRESENCE_TTL_SECONDS', () => {
      const entry = announcePresence({
        namespace: 'ns', agent: 'a', provider: 'p',
        ttlSeconds: MAX_PRESENCE_TTL_SECONDS + 10000,
      });
      expect(entry.ttlSeconds).toBe(MAX_PRESENCE_TTL_SECONDS);
    });

    it('rejects invalid agent identifiers', () => {
      expect(() => announcePresence({ namespace: 'ns', agent: '', provider: 'p' })).toThrow('Invalid agent');
      expect(() => announcePresence({ namespace: 'ns', agent: '../etc', provider: 'p' })).toThrow('Invalid agent');
    });

    it('accepts provider names with colons (e.g. ollama:llama3)', () => {
      const entry = announcePresence({ namespace: 'ns', agent: 'a', provider: 'ollama:llama3' });
      expect(entry.provider).toBe('ollama:llama3');
    });

    it('rejects oversized focus', () => {
      const big = 'x'.repeat(600);
      expect(() => announcePresence({ namespace: 'ns', agent: 'a', provider: 'p', focus: big })).toThrow('Invalid focus');
    });
  });

  describe('listPresence', () => {
    it('returns [] for missing namespace', () => {
      expect(listPresence('nope')).toEqual([]);
    });

    it('lists live entries sorted by agent name', () => {
      announcePresence({ namespace: 'ns', agent: 'charlie', provider: 'p' });
      announcePresence({ namespace: 'ns', agent: 'alice', provider: 'p' });
      announcePresence({ namespace: 'ns', agent: 'bob', provider: 'p' });
      const entries = listPresence('ns');
      expect(entries.map(e => e.agent)).toEqual(['alice', 'bob', 'charlie']);
    });

    it('auto-evicts stale entries on read', () => {
      // Manually write an entry with an old lastSeen and short TTL
      const dir = join(omcDir, 'state', 'agent-presence', 'ns');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'stale.json'), JSON.stringify({
        agent: 'stale', namespace: 'ns', provider: 'p',
        lastSeen: '2020-01-01T00:00:00.000Z', ttlSeconds: 1,
      }));

      announcePresence({ namespace: 'ns', agent: 'live', provider: 'p' });

      const entries = listPresence('ns');
      expect(entries.map(e => e.agent)).toEqual(['live']);
      expect(existsSync(join(dir, 'stale.json'))).toBe(false);
    });

    it('keeps stale entries when includeStale=true', () => {
      const dir = join(omcDir, 'state', 'agent-presence', 'ns');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'stale.json'), JSON.stringify({
        agent: 'stale', namespace: 'ns', provider: 'p',
        lastSeen: '2020-01-01T00:00:00.000Z', ttlSeconds: 1,
      }));

      const entries = listPresence('ns', { includeStale: true });
      expect(entries.map(e => e.agent)).toEqual(['stale']);
      // File should still exist
      expect(existsSync(join(dir, 'stale.json'))).toBe(true);
    });

    it('removes corrupt files', () => {
      const dir = join(omcDir, 'state', 'agent-presence', 'ns');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'bad.json'), 'not-json');

      announcePresence({ namespace: 'ns', agent: 'good', provider: 'p' });

      const entries = listPresence('ns');
      expect(entries.map(e => e.agent)).toEqual(['good']);
      expect(existsSync(join(dir, 'bad.json'))).toBe(false);
    });
  });

  describe('leavePresence', () => {
    it('removes an existing entry', () => {
      announcePresence({ namespace: 'ns', agent: 'a', provider: 'p' });
      expect(leavePresence('ns', 'a')).toBe(true);
      expect(listPresence('ns')).toEqual([]);
    });

    it('returns false for missing entry', () => {
      expect(leavePresence('ns', 'nope')).toBe(false);
    });
  });

  describe('reapStale', () => {
    it('removes stale entries across all namespaces', () => {
      for (const ns of ['n1', 'n2']) {
        const dir = join(omcDir, 'state', 'agent-presence', ns);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'stale.json'), JSON.stringify({
          agent: 'stale', namespace: ns, provider: 'p',
          lastSeen: '2020-01-01T00:00:00.000Z', ttlSeconds: 1,
        }));
      }
      announcePresence({ namespace: 'n1', agent: 'live', provider: 'p' });

      const result = reapStale();
      expect(result.removed).toBe(2);
      expect(listPresence('n1', { includeStale: true })).toHaveLength(1);
      expect(listPresence('n2', { includeStale: true })).toHaveLength(0);
    });

    it('returns 0 with no presence dir', () => {
      expect(reapStale()).toEqual({ removed: 0 });
    });
  });

  describe('isPresenceEnabled', () => {
    it('defaults to true', () => {
      expect(isPresenceEnabled()).toBe(true);
    });
  });
});
