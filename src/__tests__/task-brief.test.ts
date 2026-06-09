import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
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
  createBrief,
  getBrief,
  updateStatus,
  amendBrief,
  listBriefs,
  deleteBrief,
  isTaskBriefEnabled,
  TASK_STATUSES,
} from '../lib/task-brief.js';

describe('Task Brief', () => {
  let testDir: string;
  let omcDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `task-brief-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    omcDir = join(testDir, '.omc');
    mkdirSync(omcDir, { recursive: true });
    mockGetOmcRoot.mockReturnValue(omcDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('createBrief', () => {
    it('creates a brief with all fields populated', () => {
      const brief = createBrief({
        briefId: 'b1',
        namespace: 'team-a',
        title: 'Fix flaky auth tests',
        goal: 'Get the suite green on main without quarantines',
        createdBy: 'planner',
        successCriteria: ['no quarantined tests', 'all auth/* tests pass'],
        constraints: ['must run under 60s'],
        owners: ['executor-1', 'verifier'],
        relatedKeys: ['team-a:auth-spec'],
        relatedEntries: ['c_xyz'],
        tags: ['tests', 'auth'],
      });

      expect(brief.briefId).toBe('b1');
      expect(brief.namespace).toBe('team-a');
      expect(brief.title).toBe('Fix flaky auth tests');
      expect(brief.goal).toBe('Get the suite green on main without quarantines');
      expect(brief.successCriteria).toEqual(['no quarantined tests', 'all auth/* tests pass']);
      expect(brief.constraints).toEqual(['must run under 60s']);
      expect(brief.owners).toEqual(['executor-1', 'verifier']);
      expect(brief.relatedKeys).toEqual(['team-a:auth-spec']);
      expect(brief.relatedEntries).toEqual(['c_xyz']);
      expect(brief.tags).toEqual(['tests', 'auth']);
      expect(brief.status).toBe('open');
      expect(brief.statusHistory).toHaveLength(1);
      expect(brief.statusHistory[0]).toMatchObject({ by: 'planner', status: 'open' });
      expect(brief.createdBy).toBe('planner');
      expect(brief.createdAt).toBe(brief.updatedAt);
    });

    it('writes brief to disk as JSON', () => {
      createBrief({
        briefId: 'b2',
        namespace: 'team-b',
        title: 'X',
        goal: 'Y',
        createdBy: 'planner',
      });
      const filePath = join(omcDir, 'state', 'task-briefs', 'team-b', 'b2.json');
      expect(existsSync(filePath)).toBe(true);
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(parsed.briefId).toBe('b2');
    });

    it('rejects duplicate briefId in same namespace', () => {
      createBrief({ briefId: 'b1', namespace: 'ns', title: 't', goal: 'g', createdBy: 'planner' });
      expect(() => createBrief({
        briefId: 'b1', namespace: 'ns', title: 't', goal: 'g', createdBy: 'planner',
      })).toThrow('already exists');
    });

    it('rejects path-traversal namespace/briefId', () => {
      expect(() => createBrief({
        briefId: 'b1', namespace: '../etc', title: 't', goal: 'g', createdBy: 'planner',
      })).toThrow('Invalid namespace');
      expect(() => createBrief({
        briefId: '../etc', namespace: 'ns', title: 't', goal: 'g', createdBy: 'planner',
      })).toThrow('Invalid briefId');
    });

    it('rejects empty title/goal/createdBy', () => {
      expect(() => createBrief({ briefId: 'b1', namespace: 'ns', title: '', goal: 'g', createdBy: 'p' })).toThrow('Invalid title');
      expect(() => createBrief({ briefId: 'b1', namespace: 'ns', title: 't', goal: '', createdBy: 'p' })).toThrow('Invalid goal');
      expect(() => createBrief({ briefId: 'b1', namespace: 'ns', title: 't', goal: 'g', createdBy: '' })).toThrow('Invalid createdBy');
    });

    it('rejects owner with invalid characters', () => {
      expect(() => createBrief({
        briefId: 'b1', namespace: 'ns', title: 't', goal: 'g', createdBy: 'p',
        owners: ['bad owner!'],
      })).toThrow('Invalid owner');
    });

    it('omits empty optional lists', () => {
      const brief = createBrief({ briefId: 'b1', namespace: 'ns', title: 't', goal: 'g', createdBy: 'p' });
      expect(brief.relatedKeys).toBeUndefined();
      expect(brief.relatedEntries).toBeUndefined();
      expect(brief.tags).toBeUndefined();
      expect(brief.successCriteria).toEqual([]);
      expect(brief.constraints).toEqual([]);
      expect(brief.owners).toEqual([]);
    });
  });

  describe('getBrief', () => {
    it('returns null for missing brief', () => {
      expect(getBrief('ns', 'nope')).toBeNull();
    });

    it('reads back created brief', () => {
      createBrief({ briefId: 'b1', namespace: 'ns', title: 't', goal: 'g', createdBy: 'p' });
      const brief = getBrief('ns', 'b1');
      expect(brief).not.toBeNull();
      expect(brief!.briefId).toBe('b1');
    });
  });

  describe('updateStatus', () => {
    beforeEach(() => {
      createBrief({ briefId: 'b1', namespace: 'ns', title: 't', goal: 'g', createdBy: 'planner' });
    });

    it('appends a status event and updates top-level status', () => {
      const updated = updateStatus({
        namespace: 'ns', briefId: 'b1', status: 'in-progress', by: 'executor', summary: 'started',
      });
      expect(updated.status).toBe('in-progress');
      expect(updated.statusHistory).toHaveLength(2);
      expect(updated.statusHistory[1]).toMatchObject({
        by: 'executor', status: 'in-progress', summary: 'started',
      });
    });

    it('rejects invalid status', () => {
      // @ts-expect-error testing runtime validation
      expect(() => updateStatus({ namespace: 'ns', briefId: 'b1', status: 'bogus', by: 'x' })).toThrow('Invalid status');
    });

    it('accepts all canonical statuses', () => {
      for (const s of TASK_STATUSES) {
        expect(() => updateStatus({ namespace: 'ns', briefId: 'b1', status: s, by: 'x' })).not.toThrow();
      }
    });

    it('throws when brief does not exist', () => {
      expect(() => updateStatus({
        namespace: 'ns', briefId: 'no-such', status: 'done', by: 'x',
      })).toThrow('not found');
    });
  });

  describe('amendBrief', () => {
    beforeEach(() => {
      createBrief({
        briefId: 'b1', namespace: 'ns', title: 't', goal: 'g', createdBy: 'p',
        owners: ['a'],
        successCriteria: ['sc1'],
      });
    });

    it('additively adds items and dedupes', () => {
      const updated = amendBrief({
        namespace: 'ns', briefId: 'b1', by: 'planner',
        addOwners: ['a', 'b'],
        addSuccessCriteria: ['sc1', 'sc2'],
        addConstraints: ['c1'],
        addTags: ['t1', 't2'],
      });
      expect(updated.owners).toEqual(['a', 'b']);
      expect(updated.successCriteria).toEqual(['sc1', 'sc2']);
      expect(updated.constraints).toEqual(['c1']);
      expect(updated.tags).toEqual(['t1', 't2']);
    });

    it('removes owners', () => {
      const updated = amendBrief({
        namespace: 'ns', briefId: 'b1', by: 'p', addOwners: ['b'], removeOwners: ['a'],
      });
      expect(updated.owners).toEqual(['b']);
    });

    it('records an amendment event in statusHistory', () => {
      const updated = amendBrief({
        namespace: 'ns', briefId: 'b1', by: 'p', addTags: ['x'],
      });
      const last = updated.statusHistory[updated.statusHistory.length - 1];
      expect(last.summary).toBe('amended');
      expect(last.by).toBe('p');
    });
  });

  describe('listBriefs', () => {
    beforeEach(() => {
      createBrief({ briefId: 'b1', namespace: 'ns', title: 'one', goal: 'g', createdBy: 'p', owners: ['alice'], tags: ['x'] });
      createBrief({ briefId: 'b2', namespace: 'ns', title: 'two', goal: 'g', createdBy: 'p', owners: ['bob'], tags: ['y'] });
      updateStatus({ namespace: 'ns', briefId: 'b2', status: 'done', by: 'bob' });
    });

    it('returns all briefs sorted by updatedAt desc', () => {
      const items = listBriefs('ns');
      expect(items).toHaveLength(2);
      expect(items[0].briefId).toBe('b2'); // most recently updated
    });

    it('filters by status', () => {
      const items = listBriefs('ns', { status: 'done' });
      expect(items.map(i => i.briefId)).toEqual(['b2']);
    });

    it('filters by owner', () => {
      const items = listBriefs('ns', { owner: 'alice' });
      expect(items.map(i => i.briefId)).toEqual(['b1']);
    });

    it('filters by tag', () => {
      const items = listBriefs('ns', { tag: 'y' });
      expect(items.map(i => i.briefId)).toEqual(['b2']);
    });

    it('returns [] for missing namespace', () => {
      expect(listBriefs('nope')).toEqual([]);
    });
  });

  describe('deleteBrief', () => {
    it('removes a brief and returns true', () => {
      createBrief({ briefId: 'b1', namespace: 'ns', title: 't', goal: 'g', createdBy: 'p' });
      expect(deleteBrief('ns', 'b1')).toBe(true);
      expect(getBrief('ns', 'b1')).toBeNull();
    });

    it('returns false for missing brief', () => {
      expect(deleteBrief('ns', 'nope')).toBe(false);
    });
  });

  describe('isTaskBriefEnabled', () => {
    it('defaults to true when no config', () => {
      expect(isTaskBriefEnabled()).toBe(true);
    });
  });
});
