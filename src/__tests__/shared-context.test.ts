import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { basename, join } from 'path';
import { homedir, tmpdir } from 'os';

// Mock getOmcRoot to use our test directory
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
  postEntry,
  readFeed,
  clearFeed,
  countEntries,
  listContextNamespaces,
  digestChannel,
  listOpenQuestions,
  isSharedContextEnabled,
  CONTEXT_KINDS,
  DEFAULT_READ_LIMIT,
  MAX_READ_LIMIT,
} from '../lib/shared-context.js';

describe('Shared Context Feed', () => {
  const originalConfigDir = process.env.CLAUDE_CONFIG_DIR;
  let testDir: string;
  let omcDir: string;
  let tildeConfigDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `shared-context-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    omcDir = join(testDir, '.omc');
    tildeConfigDir = join(homedir(), `.omc-test-shared-context-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(omcDir, { recursive: true });
    mockGetOmcRoot.mockReturnValue(omcDir);
    delete process.env.CLAUDE_CONFIG_DIR;
  });

  afterEach(() => {
    if (originalConfigDir === undefined) {
      delete process.env.CLAUDE_CONFIG_DIR;
    } else {
      process.env.CLAUDE_CONFIG_DIR = originalConfigDir;
    }
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    if (existsSync(tildeConfigDir)) {
      rmSync(tildeConfigDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  // =========================================================================
  // postEntry + readFeed
  // =========================================================================

  describe('postEntry / readFeed', () => {
    it('posts an entry and reads it back', () => {
      const posted = postEntry('team-alpha', 'planner', 'decision', 'Use JWT for auth');
      expect(posted.id).toMatch(/^c[a-z0-9]+/);
      expect(posted.author).toBe('planner');
      expect(posted.kind).toBe('decision');
      expect(posted.message).toBe('Use JWT for auth');
      expect(posted.namespace).toBe('team-alpha');
      expect(posted.timestamp).toBeTruthy();

      const entries = readFeed('team-alpha');
      expect(entries).toHaveLength(1);
      expect(entries[0].message).toBe('Use JWT for auth');
      expect(entries[0].id).toBe(posted.id);
    });

    it('appends in chronological order', () => {
      postEntry('ns', 'a1', 'note', 'first');
      postEntry('ns', 'a2', 'note', 'second');
      postEntry('ns', 'a3', 'note', 'third');

      const entries = readFeed('ns');
      expect(entries.map(e => e.message)).toEqual(['first', 'second', 'third']);
    });

    it('stores entries as JSONL — one line per entry', () => {
      postEntry('ns', 'a', 'note', 'one');
      postEntry('ns', 'a', 'note', 'two');

      const filePath = join(omcDir, 'state', 'shared-context', 'ns.jsonl');
      expect(existsSync(filePath)).toBe(true);
      const raw = readFileSync(filePath, 'utf-8');
      const lines = raw.split('\n').filter(l => l.trim());
      expect(lines).toHaveLength(2);

      for (const line of lines) {
        const parsed = JSON.parse(line);
        expect(parsed).toHaveProperty('id');
        expect(parsed).toHaveProperty('namespace', 'ns');
        expect(parsed).toHaveProperty('timestamp');
      }
    });

    it('escapes newlines in messages so each entry stays on one line', () => {
      postEntry('ns', 'a', 'finding', 'line1\nline2\nline3');
      const entries = readFeed('ns');
      expect(entries).toHaveLength(1);
      expect(entries[0].message).toBe('line1\nline2\nline3');

      const filePath = join(omcDir, 'state', 'shared-context', 'ns.jsonl');
      const lineCount = readFileSync(filePath, 'utf-8').split('\n').filter(l => l.trim()).length;
      expect(lineCount).toBe(1);
    });

    it('records optional tags and refs', () => {
      const first = postEntry('ns', 'planner', 'question', 'JWT or session?');
      const second = postEntry(
        'ns',
        'architect',
        'answer',
        'JWT — see decision',
        { tags: ['auth', 'security'], refs: [first.id] },
      );

      expect(second.tags).toEqual(['auth', 'security']);
      expect(second.refs).toEqual([first.id]);

      const entries = readFeed('ns');
      const stored = entries.find(e => e.id === second.id)!;
      expect(stored.tags).toEqual(['auth', 'security']);
      expect(stored.refs).toEqual([first.id]);
    });

    it('omits empty tags/refs when none provided', () => {
      const posted = postEntry('ns', 'a', 'note', 'plain');
      expect(posted.tags).toBeUndefined();
      expect(posted.refs).toBeUndefined();
    });

    it('returns empty array for missing namespace', () => {
      expect(readFeed('does-not-exist')).toEqual([]);
    });

    it('generates unique ids across rapid posts', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const entry = postEntry('ns', 'a', 'note', `msg-${i}`);
        ids.add(entry.id);
      }
      expect(ids.size).toBe(100);
    });
  });

  // =========================================================================
  // readFeed filters and tail behavior
  // =========================================================================

  describe('readFeed filters', () => {
    beforeEach(() => {
      postEntry('ns', 'planner', 'decision', 'use postgres');
      postEntry('ns', 'executor', 'finding', 'flaky test in auth/');
      postEntry('ns', 'executor', 'blocker', 'need DB credentials');
      postEntry('ns', 'planner', 'handoff', 'over to executor');
      postEntry('ns', 'verifier', 'note', 'green CI');
    });

    it('filters by author', () => {
      const entries = readFeed('ns', { author: 'executor' });
      expect(entries.map(e => e.message)).toEqual([
        'flaky test in auth/',
        'need DB credentials',
      ]);
    });

    it('filters by kind', () => {
      const entries = readFeed('ns', { kind: 'decision' });
      expect(entries.map(e => e.message)).toEqual(['use postgres']);
    });

    it('filters by substring (case-insensitive)', () => {
      const entries = readFeed('ns', { contains: 'DB' });
      expect(entries.map(e => e.message)).toEqual(['need DB credentials']);

      const ci = readFeed('ns', { contains: 'db' });
      expect(ci.map(e => e.message)).toEqual(['need DB credentials']);
    });

    it('respects limit and returns the tail (most recent)', () => {
      const entries = readFeed('ns', { limit: 2 });
      expect(entries).toHaveLength(2);
      expect(entries.map(e => e.message)).toEqual([
        'over to executor',
        'green CI',
      ]);
    });

    it('applies default limit when omitted', () => {
      expect(DEFAULT_READ_LIMIT).toBeGreaterThan(0);
      const entries = readFeed('ns');
      expect(entries.length).toBeLessThanOrEqual(DEFAULT_READ_LIMIT);
    });

    it('clamps limit to MAX_READ_LIMIT', () => {
      const entries = readFeed('ns', { limit: MAX_READ_LIMIT + 1000 });
      // Only 5 entries posted in beforeEach; should return them all.
      expect(entries).toHaveLength(5);
    });

    it('filters by since (ISO timestamp)', async () => {
      const cutoff = new Date().toISOString();
      // Small delay so subsequent posts have a strictly later timestamp.
      await new Promise(r => setTimeout(r, 10));
      postEntry('ns', 'late', 'note', 'after-cutoff');

      const entries = readFeed('ns', { since: cutoff });
      expect(entries.map(e => e.message)).toContain('after-cutoff');
      expect(entries.every(e => new Date(e.timestamp).getTime() >= new Date(cutoff).getTime())).toBe(true);
    });

    it('combines filters (author + kind)', () => {
      const entries = readFeed('ns', { author: 'planner', kind: 'decision' });
      expect(entries.map(e => e.message)).toEqual(['use postgres']);
    });

    it('returns empty when filter matches nothing', () => {
      expect(readFeed('ns', { author: 'no-such-agent' })).toEqual([]);
    });
  });

  // =========================================================================
  // Corrupt line handling
  // =========================================================================

  describe('corrupt entries', () => {
    it('skips malformed JSON lines', () => {
      postEntry('ns', 'a', 'note', 'good-1');

      const filePath = join(omcDir, 'state', 'shared-context', 'ns.jsonl');
      appendFileSync(filePath, 'not-json-{{}\n');
      appendFileSync(filePath, JSON.stringify({ partial: 'no message' }) + '\n');

      postEntry('ns', 'a', 'note', 'good-2');

      const entries = readFeed('ns');
      expect(entries.map(e => e.message)).toEqual(['good-1', 'good-2']);
    });
  });

  // =========================================================================
  // countEntries / clearFeed / listContextNamespaces
  // =========================================================================

  describe('countEntries', () => {
    it('reports zero for missing namespace', () => {
      expect(countEntries('absent')).toBe(0);
    });

    it('counts posted entries', () => {
      postEntry('ns', 'a', 'note', '1');
      postEntry('ns', 'a', 'note', '2');
      postEntry('ns', 'a', 'note', '3');
      expect(countEntries('ns')).toBe(3);
    });
  });

  describe('clearFeed', () => {
    it('removes the feed file and returns the count', () => {
      postEntry('ns', 'a', 'note', '1');
      postEntry('ns', 'a', 'note', '2');

      const filePath = join(omcDir, 'state', 'shared-context', 'ns.jsonl');
      expect(existsSync(filePath)).toBe(true);

      const result = clearFeed('ns');
      expect(result.removed).toBe(2);
      expect(existsSync(filePath)).toBe(false);
      expect(readFeed('ns')).toEqual([]);
    });

    it('returns 0 when channel does not exist', () => {
      expect(clearFeed('never-existed')).toEqual({ removed: 0 });
    });

    it('cleans up the lock file alongside the feed', () => {
      postEntry('ns', 'a', 'note', '1');
      const lockPath = join(omcDir, 'state', 'shared-context', 'ns.jsonl.lock');
      writeFileSync(lockPath, JSON.stringify({ pid: process.pid }));

      clearFeed('ns');
      expect(existsSync(lockPath)).toBe(false);
    });
  });

  describe('listContextNamespaces', () => {
    it('returns empty list when no feeds exist', () => {
      expect(listContextNamespaces()).toEqual([]);
    });

    it('returns a sorted summary per channel', () => {
      postEntry('zeta-team', 'a', 'note', 'z');
      postEntry('alpha-team', 'planner', 'decision', 'a');
      postEntry('alpha-team', 'executor', 'finding', 'a2');

      const list = listContextNamespaces();
      expect(list.map(c => c.namespace)).toEqual(['alpha-team', 'zeta-team']);

      const alpha = list.find(c => c.namespace === 'alpha-team')!;
      expect(alpha.entries).toBe(2);
      expect(alpha.lastAuthor).toBe('executor');
      expect(alpha.lastKind).toBe('finding');
      expect(alpha.lastAt).toBeTruthy();
    });
  });

  // =========================================================================
  // Namespace isolation
  // =========================================================================

  describe('namespace isolation', () => {
    it('keeps channels independent', () => {
      postEntry('team-a', 'p', 'note', 'a-only');
      postEntry('team-b', 'p', 'note', 'b-only');

      expect(readFeed('team-a').map(e => e.message)).toEqual(['a-only']);
      expect(readFeed('team-b').map(e => e.message)).toEqual(['b-only']);

      clearFeed('team-a');
      expect(readFeed('team-a')).toEqual([]);
      expect(readFeed('team-b').map(e => e.message)).toEqual(['b-only']);
    });
  });

  // =========================================================================
  // Validation
  // =========================================================================

  describe('validation', () => {
    it('rejects path-traversal namespace', () => {
      expect(() => postEntry('../etc', 'a', 'note', 'x')).toThrow('Invalid namespace');
    });

    it('rejects empty namespace', () => {
      expect(() => postEntry('', 'a', 'note', 'x')).toThrow('Invalid namespace');
    });

    it('rejects namespace with slashes', () => {
      expect(() => postEntry('foo/bar', 'a', 'note', 'x')).toThrow('Invalid namespace');
    });

    it('rejects empty author', () => {
      expect(() => postEntry('ns', '', 'note', 'x')).toThrow('Invalid author');
    });

    it('rejects author with newline', () => {
      expect(() => postEntry('ns', 'a\nb', 'note', 'x')).toThrow('Invalid author');
    });

    it('rejects empty message', () => {
      expect(() => postEntry('ns', 'a', 'note', '')).toThrow('Invalid message');
    });

    it('rejects unknown kind', () => {
      // @ts-expect-error — exercising runtime validation
      expect(() => postEntry('ns', 'a', 'gossip', 'x')).toThrow('Invalid kind');
    });

    it('accepts all canonical kinds', () => {
      for (const kind of CONTEXT_KINDS) {
        expect(() => postEntry('ns', 'a', kind, `msg-${kind}`)).not.toThrow();
      }
    });

    it('accepts namespace with dots, hyphens, underscores', () => {
      const entry = postEntry('my-team.run_1', 'a', 'note', 'ok');
      expect(entry.namespace).toBe('my-team.run_1');
    });
  });

  // =========================================================================
  // Config gate
  // =========================================================================

  describe('isSharedContextEnabled', () => {
    it('defaults to true when no config file exists', () => {
      expect(isSharedContextEnabled()).toBe(true);
    });

    it('reads enabled=false from CLAUDE_CONFIG_DIR/.omc-config.json', () => {
      const claudeConfigDir = join(testDir, 'claude-config');
      mkdirSync(claudeConfigDir, { recursive: true });
      writeFileSync(join(claudeConfigDir, '.omc-config.json'), JSON.stringify({
        agents: { sharedContext: { enabled: false } },
      }));
      process.env.CLAUDE_CONFIG_DIR = claudeConfigDir;

      expect(isSharedContextEnabled()).toBe(false);
    });

    it('expands ~-prefixed CLAUDE_CONFIG_DIR', () => {
      mkdirSync(tildeConfigDir, { recursive: true });
      writeFileSync(join(tildeConfigDir, '.omc-config.json'), JSON.stringify({
        agents: { sharedContext: { enabled: false } },
      }));
      process.env.CLAUDE_CONFIG_DIR = `~/${basename(tildeConfigDir)}`;

      expect(isSharedContextEnabled()).toBe(false);
    });

    it('defaults to true when key is missing from config', () => {
      const claudeConfigDir = join(testDir, 'claude-config-2');
      mkdirSync(claudeConfigDir, { recursive: true });
      writeFileSync(join(claudeConfigDir, '.omc-config.json'), JSON.stringify({
        agents: { sharedMemory: { enabled: false } },
      }));
      process.env.CLAUDE_CONFIG_DIR = claudeConfigDir;

      expect(isSharedContextEnabled()).toBe(true);
    });
  });

  // =========================================================================
  // digestChannel
  // =========================================================================

  describe('digestChannel', () => {
    it('returns an empty digest for missing channel', () => {
      const digest = digestChannel('nope');
      expect(digest.total).toBe(0);
      expect(digest.openQuestions).toBe(0);
      expect(digest.openBlockers).toBe(0);
      expect(digest.highlights.decisions).toEqual([]);
    });

    it('counts entries by kind and author', () => {
      postEntry('ns', 'planner', 'decision', 'd1');
      postEntry('ns', 'planner', 'decision', 'd2');
      postEntry('ns', 'executor', 'finding', 'f1');
      postEntry('ns', 'executor', 'blocker', 'b1');
      postEntry('ns', 'verifier', 'note', 'n1');

      const digest = digestChannel('ns');
      expect(digest.total).toBe(5);
      expect(digest.byKind.decision).toBe(2);
      expect(digest.byKind.finding).toBe(1);
      expect(digest.byKind.blocker).toBe(1);
      expect(digest.byKind.note).toBe(1);
      expect(digest.byKind.question).toBe(0);

      // Sorted by count desc, then author asc.
      expect(digest.byAuthor[0]).toEqual({ author: 'executor', count: 2 });
      expect(digest.byAuthor[1]).toEqual({ author: 'planner', count: 2 });
      expect(digest.byAuthor[2]).toEqual({ author: 'verifier', count: 1 });
    });

    it('identifies open questions (those without an answer ref)', () => {
      const q1 = postEntry('ns', 'planner', 'question', 'Use JWT?');
      const q2 = postEntry('ns', 'planner', 'question', 'TTL?');
      postEntry('ns', 'architect', 'answer', 'Yes', { refs: [q1.id] });

      const digest = digestChannel('ns');
      expect(digest.openQuestions).toBe(1);
      expect(digest.highlights.openQuestions[0].id).toBe(q2.id);
    });

    it('identifies open blockers (those not referenced by later entries)', () => {
      const b1 = postEntry('ns', 'executor', 'blocker', 'need db creds');
      const b2 = postEntry('ns', 'executor', 'blocker', 'no staging env');
      postEntry('ns', 'planner', 'note', 'creds ack', { refs: [b1.id] });

      const digest = digestChannel('ns');
      expect(digest.openBlockers).toBe(1);
      expect(digest.highlights.blockers.map(e => e.id)).toEqual([b2.id]);
    });

    it('caps highlight sections at highlightLimit (default 5, clamped to [1,20])', () => {
      for (let i = 0; i < 8; i++) {
        postEntry('ns', 'planner', 'decision', `d${i}`);
      }

      const def = digestChannel('ns');
      expect(def.highlights.decisions).toHaveLength(5);

      const small = digestChannel('ns', 2);
      expect(small.highlights.decisions).toHaveLength(2);

      const huge = digestChannel('ns', 999);
      expect(huge.highlights.decisions.length).toBeLessThanOrEqual(20);
    });

    it('records firstAt and lastAt timestamps', () => {
      postEntry('ns', 'a', 'note', 'first');
      postEntry('ns', 'a', 'note', 'last');
      const digest = digestChannel('ns');
      expect(digest.firstAt).toBeTruthy();
      expect(digest.lastAt).toBeTruthy();
      expect(new Date(digest.lastAt!).getTime()).toBeGreaterThanOrEqual(
        new Date(digest.firstAt!).getTime(),
      );
    });
  });

  // =========================================================================
  // listOpenQuestions
  // =========================================================================

  describe('listOpenQuestions', () => {
    it('returns [] for missing channel', () => {
      expect(listOpenQuestions('nope')).toEqual([]);
    });

    it('returns only questions without a matching answer ref', () => {
      const q1 = postEntry('ns', 'planner', 'question', 'q1');
      const q2 = postEntry('ns', 'planner', 'question', 'q2');
      const q3 = postEntry('ns', 'planner', 'question', 'q3');
      postEntry('ns', 'architect', 'answer', 'a1', { refs: [q1.id] });
      postEntry('ns', 'architect', 'answer', 'a3', { refs: [q3.id] });

      const open = listOpenQuestions('ns');
      expect(open.map(e => e.id)).toEqual([q2.id]);
    });

    it('non-answer entries referencing a question do not close it', () => {
      const q = postEntry('ns', 'planner', 'question', 'still open?');
      postEntry('ns', 'noter', 'note', 'thinking about it', { refs: [q.id] });

      expect(listOpenQuestions('ns').map(e => e.id)).toEqual([q.id]);
    });
  });
});
