/**
 * Task Brief State Layer
 *
 * A **task brief** is a structured task descriptor — the artifact any agent
 * (Claude, Codex, Gemini, or any other provider) reads at the start of work to
 * deterministically grasp a task: goal, success criteria, constraints, owners,
 * status, and pointers to related context.
 *
 * Where shared-context.ts is a flowing chronological feed (what's happening
 * right now), a task brief is the stable, structured "spec card" for a unit of
 * work. Together they form a productivity loop:
 *
 *   brief → agents post plans/findings/blockers tagged with the brief id
 *         → status updates close the loop on the brief itself
 *
 * The lib is pure file-based JSON storage — callable from MCP tools, from the
 * `omc-mam` CLI bridge, or from any other harness without provider lock-in.
 *
 * Storage: .omc/state/task-briefs/{namespace}/{briefId}.json
 *
 * Config gate: agents.taskBrief.enabled in ~/.claude/.omc-config.json
 * (defaults to enabled, mirroring shared memory + shared context).
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

export const TASK_STATUSES = [
  'open',
  'in-progress',
  'blocked',
  'done',
  'cancelled',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskStatusEvent {
  at: string;
  by: string;
  status: TaskStatus;
  summary?: string;
}

export interface TaskBrief {
  /** Caller-supplied unique id. Stable so other entries can refer to it. */
  briefId: string;
  namespace: string;
  title: string;
  /** One-paragraph statement of what the task is. */
  goal: string;
  /** Explicit "done when..." checklist items. */
  successCriteria: string[];
  /** Hard rules the work must respect (security, perf, compat, etc.). */
  constraints: string[];
  /** Agent names/roles responsible for the brief (empty = unassigned). */
  owners: string[];
  status: TaskStatus;
  /** Append-only audit trail of status transitions. */
  statusHistory: TaskStatusEvent[];
  /** shared_memory keys (namespace:key) that hold related state. */
  relatedKeys?: string[];
  /** shared_context entry ids relevant to this brief. */
  relatedEntries?: string[];
  /** Optional freeform tags. */
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskBriefListItem {
  briefId: string;
  title: string;
  status: TaskStatus;
  owners: string[];
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG_FILE_NAME = '.omc-config.json';

export function isTaskBriefEnabled(): boolean {
  try {
    const configPath = join(getClaudeConfigDir(), CONFIG_FILE_NAME);
    if (!existsSync(configPath)) return true;
    const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
    const enabled = raw?.agents?.taskBrief?.enabled;
    if (typeof enabled === 'boolean') return enabled;
    return true;
  } catch {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Path + validation helpers
// ---------------------------------------------------------------------------

const TASK_BRIEFS_DIR = 'state/task-briefs';

const MAX_TITLE_LENGTH = 256;
const MAX_GOAL_LENGTH = 4096;
const MAX_ITEM_LENGTH = 1024;
const MAX_ITEMS_PER_LIST = 64;

function validateIdentifier(value: string, kind: 'namespace' | 'briefId' | 'owner' | 'tag'): void {
  if (!value || value.length > 128) {
    throw new Error(`Invalid ${kind}: must be 1-128 characters (got ${value.length})`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value)) {
    throw new Error(`Invalid ${kind}: must be alphanumeric with hyphens/underscores/dots (got "${value}")`);
  }
  if (value.includes('..')) {
    throw new Error(`Invalid ${kind}: path traversal not allowed`);
  }
}

function validateText(value: string, field: string, max: number): void {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${field}: must be a string`);
  }
  if (value.length === 0) {
    throw new Error(`Invalid ${field}: must not be empty`);
  }
  if (value.length > max) {
    throw new Error(`Invalid ${field}: must be <= ${max} characters (got ${value.length})`);
  }
}

function validateList(items: string[] | undefined, field: string, max: number): string[] {
  if (!items) return [];
  if (!Array.isArray(items)) {
    throw new Error(`Invalid ${field}: must be an array of strings`);
  }
  if (items.length > MAX_ITEMS_PER_LIST) {
    throw new Error(`Invalid ${field}: must have at most ${MAX_ITEMS_PER_LIST} items (got ${items.length})`);
  }
  for (const item of items) {
    if (typeof item !== 'string' || item.length === 0) {
      throw new Error(`Invalid ${field}: items must be non-empty strings`);
    }
    if (item.length > max) {
      throw new Error(`Invalid ${field}: items must be <= ${max} characters`);
    }
  }
  return items.map(String);
}

function getNamespaceDir(namespace: string, worktreeRoot?: string): string {
  validateIdentifier(namespace, 'namespace');
  return join(getOmcRoot(worktreeRoot), TASK_BRIEFS_DIR, namespace);
}

function getBriefPath(namespace: string, briefId: string, worktreeRoot?: string): string {
  validateIdentifier(briefId, 'briefId');
  return join(getNamespaceDir(namespace, worktreeRoot), `${briefId}.json`);
}

function ensureNamespaceDir(namespace: string, worktreeRoot?: string): string {
  const dir = getNamespaceDir(namespace, worktreeRoot);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// ---------------------------------------------------------------------------
// Core operations
// ---------------------------------------------------------------------------

export interface CreateBriefArgs {
  briefId: string;
  namespace: string;
  title: string;
  goal: string;
  createdBy: string;
  successCriteria?: string[];
  constraints?: string[];
  owners?: string[];
  relatedKeys?: string[];
  relatedEntries?: string[];
  tags?: string[];
}

/**
 * Create a new task brief. Fails if a brief with the same id already exists
 * in the namespace (so creation is unambiguous; use updateBrief to amend).
 */
export function createBrief(args: CreateBriefArgs, worktreeRoot?: string): TaskBrief {
  validateIdentifier(args.namespace, 'namespace');
  validateIdentifier(args.briefId, 'briefId');
  validateText(args.title, 'title', MAX_TITLE_LENGTH);
  validateText(args.goal, 'goal', MAX_GOAL_LENGTH);
  validateText(args.createdBy, 'createdBy', 128);

  const successCriteria = validateList(args.successCriteria, 'successCriteria', MAX_ITEM_LENGTH);
  const constraints = validateList(args.constraints, 'constraints', MAX_ITEM_LENGTH);
  const owners = validateList(args.owners, 'owners', 128);
  for (const owner of owners) validateIdentifier(owner, 'owner');
  const relatedKeys = validateList(args.relatedKeys, 'relatedKeys', MAX_ITEM_LENGTH);
  const relatedEntries = validateList(args.relatedEntries, 'relatedEntries', 128);
  const tags = validateList(args.tags, 'tags', 64);
  for (const tag of tags) validateIdentifier(tag, 'tag');

  ensureNamespaceDir(args.namespace, worktreeRoot);
  const filePath = getBriefPath(args.namespace, args.briefId, worktreeRoot);

  if (existsSync(filePath)) {
    throw new Error(`Brief "${args.briefId}" already exists in namespace "${args.namespace}". Use updateBrief to amend.`);
  }

  const now = new Date().toISOString();
  const brief: TaskBrief = {
    briefId: args.briefId,
    namespace: args.namespace,
    title: args.title,
    goal: args.goal,
    successCriteria,
    constraints,
    owners,
    status: 'open',
    statusHistory: [{ at: now, by: args.createdBy, status: 'open', summary: 'created' }],
    createdBy: args.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  if (relatedKeys.length > 0) brief.relatedKeys = relatedKeys;
  if (relatedEntries.length > 0) brief.relatedEntries = relatedEntries;
  if (tags.length > 0) brief.tags = tags;

  writeBriefAtomic(filePath, brief);
  return brief;
}

/** Read a brief. Returns null if not found. */
export function getBrief(
  namespace: string,
  briefId: string,
  worktreeRoot?: string,
): TaskBrief | null {
  validateIdentifier(namespace, 'namespace');
  validateIdentifier(briefId, 'briefId');

  const filePath = getBriefPath(namespace, briefId, worktreeRoot);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as TaskBrief;
  } catch {
    return null;
  }
}

export interface UpdateStatusArgs {
  namespace: string;
  briefId: string;
  status: TaskStatus;
  by: string;
  summary?: string;
}

/**
 * Append a status transition. The transition is recorded in statusHistory
 * (append-only) and the top-level status is set to the new value.
 */
export function updateStatus(args: UpdateStatusArgs, worktreeRoot?: string): TaskBrief {
  validateIdentifier(args.namespace, 'namespace');
  validateIdentifier(args.briefId, 'briefId');
  validateText(args.by, 'by', 128);
  if (!TASK_STATUSES.includes(args.status)) {
    throw new Error(`Invalid status: must be one of ${TASK_STATUSES.join(', ')} (got "${args.status}")`);
  }
  if (args.summary !== undefined) {
    validateText(args.summary, 'summary', MAX_ITEM_LENGTH);
  }

  const filePath = getBriefPath(args.namespace, args.briefId, worktreeRoot);
  if (!existsSync(filePath)) {
    throw new Error(`Brief "${args.briefId}" not found in namespace "${args.namespace}".`);
  }

  const lockPath = filePath + '.lock';
  const mutate = (): TaskBrief => {
    const current = JSON.parse(readFileSync(filePath, 'utf-8')) as TaskBrief;
    const now = new Date().toISOString();
    const event: TaskStatusEvent = { at: now, by: args.by, status: args.status };
    if (args.summary) event.summary = args.summary;

    current.statusHistory = [...(current.statusHistory ?? []), event];
    current.status = args.status;
    current.updatedAt = now;

    writeBriefAtomic(filePath, current);
    return current;
  };

  try {
    return withFileLockSync(lockPath, mutate, { timeoutMs: 500, retryDelayMs: 25 });
  } catch {
    return mutate();
  }
}

export interface AmendBriefArgs {
  namespace: string;
  briefId: string;
  by: string;
  addSuccessCriteria?: string[];
  addConstraints?: string[];
  addOwners?: string[];
  removeOwners?: string[];
  addRelatedKeys?: string[];
  addRelatedEntries?: string[];
  addTags?: string[];
}

/**
 * Amend (additively) a brief's lists. Designed to be safe for concurrent
 * callers — only adds/removes the specified items, never overwrites entire
 * lists. Returns the updated brief.
 */
export function amendBrief(args: AmendBriefArgs, worktreeRoot?: string): TaskBrief {
  validateIdentifier(args.namespace, 'namespace');
  validateIdentifier(args.briefId, 'briefId');
  validateText(args.by, 'by', 128);

  const addSC = validateList(args.addSuccessCriteria, 'addSuccessCriteria', MAX_ITEM_LENGTH);
  const addC = validateList(args.addConstraints, 'addConstraints', MAX_ITEM_LENGTH);
  const addO = validateList(args.addOwners, 'addOwners', 128);
  for (const o of addO) validateIdentifier(o, 'owner');
  const removeO = validateList(args.removeOwners, 'removeOwners', 128);
  for (const o of removeO) validateIdentifier(o, 'owner');
  const addRK = validateList(args.addRelatedKeys, 'addRelatedKeys', MAX_ITEM_LENGTH);
  const addRE = validateList(args.addRelatedEntries, 'addRelatedEntries', 128);
  const addT = validateList(args.addTags, 'addTags', 64);
  for (const t of addT) validateIdentifier(t, 'tag');

  const filePath = getBriefPath(args.namespace, args.briefId, worktreeRoot);
  if (!existsSync(filePath)) {
    throw new Error(`Brief "${args.briefId}" not found in namespace "${args.namespace}".`);
  }

  const lockPath = filePath + '.lock';
  const mutate = (): TaskBrief => {
    const current = JSON.parse(readFileSync(filePath, 'utf-8')) as TaskBrief;
    const now = new Date().toISOString();

    const dedupe = (arr: string[]) => Array.from(new Set(arr));

    if (addSC.length > 0) current.successCriteria = dedupe([...current.successCriteria, ...addSC]);
    if (addC.length > 0) current.constraints = dedupe([...current.constraints, ...addC]);
    if (addO.length > 0) current.owners = dedupe([...current.owners, ...addO]);
    if (removeO.length > 0) current.owners = current.owners.filter(o => !removeO.includes(o));
    if (addRK.length > 0) {
      current.relatedKeys = dedupe([...(current.relatedKeys ?? []), ...addRK]);
    }
    if (addRE.length > 0) {
      current.relatedEntries = dedupe([...(current.relatedEntries ?? []), ...addRE]);
    }
    if (addT.length > 0) {
      current.tags = dedupe([...(current.tags ?? []), ...addT]);
    }

    // Record an amendment marker in statusHistory so the audit trail is complete.
    current.statusHistory = [
      ...(current.statusHistory ?? []),
      { at: now, by: args.by, status: current.status, summary: 'amended' },
    ];
    current.updatedAt = now;

    writeBriefAtomic(filePath, current);
    return current;
  };

  try {
    return withFileLockSync(lockPath, mutate, { timeoutMs: 500, retryDelayMs: 25 });
  } catch {
    return mutate();
  }
}

export interface ListBriefsOptions {
  status?: TaskStatus;
  owner?: string;
  tag?: string;
}

export function listBriefs(
  namespace: string,
  opts: ListBriefsOptions = {},
  worktreeRoot?: string,
): TaskBriefListItem[] {
  validateIdentifier(namespace, 'namespace');

  const dir = getNamespaceDir(namespace, worktreeRoot);
  if (!existsSync(dir)) return [];

  let files: string[];
  try {
    files = readdirSync(dir).filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }

  const items: TaskBriefListItem[] = [];
  for (const file of files) {
    try {
      const brief = JSON.parse(readFileSync(join(dir, file), 'utf-8')) as TaskBrief;
      if (opts.status && brief.status !== opts.status) continue;
      if (opts.owner && !brief.owners.includes(opts.owner)) continue;
      if (opts.tag && !(brief.tags ?? []).includes(opts.tag)) continue;
      items.push({
        briefId: brief.briefId,
        title: brief.title,
        status: brief.status,
        owners: brief.owners,
        updatedAt: brief.updatedAt,
      });
    } catch {
      // Skip corrupt brief
    }
  }

  return items.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : a.updatedAt < b.updatedAt ? 1 : 0));
}

/** Delete a brief. Returns true if the brief existed and was removed. */
export function deleteBrief(
  namespace: string,
  briefId: string,
  worktreeRoot?: string,
): boolean {
  const filePath = getBriefPath(namespace, briefId, worktreeRoot);
  if (!existsSync(filePath)) return false;
  try {
    unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Internal: atomic write
// ---------------------------------------------------------------------------

function writeBriefAtomic(filePath: string, brief: TaskBrief): void {
  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  writeFileSync(tmpPath, JSON.stringify(brief, null, 2), { mode: 0o600 });
  renameSync(tmpPath, filePath);
}
