/**
 * Shared Context Feed State Layer
 *
 * Append-only, authored, chronological "team blackboard" for cross-agent
 * collaboration. Where shared-memory.ts is a key-value store (point lookups,
 * overwrite-in-place) and message-router.ts delivers point-to-point messages,
 * the shared context feed is a broadcast channel that *every* agent reads as a
 * shared rolling context window.
 *
 * Agents post timestamped, authored entries tagged by kind (note, decision,
 * finding, blocker, handoff, question, answer). Teammates tail the most recent
 * entries — optionally filtered by author, kind, recency, or substring — to
 * stay aligned without re-deriving what others already discovered.
 *
 * Storage: .omc/state/shared-context/{namespace}.jsonl
 *
 * Each line is one JSON-encoded {@link ContextEntry}. The append-only JSONL
 * layout mirrors the team inbox/outbox files (src/team/message-router.ts) and
 * keeps concurrent posts cheap (one locked append, no read-modify-write).
 *
 * Config gate: agents.sharedContext.enabled in ~/.claude/.omc-config.json
 * (defaults to enabled, mirroring agents.sharedMemory.enabled).
 */
import { existsSync, mkdirSync, readFileSync, appendFileSync, unlinkSync, readdirSync, } from 'fs';
import { join } from 'path';
import { getOmcRoot } from './worktree-paths.js';
import { withFileLockSync } from './file-lock.js';
import { getClaudeConfigDir } from '../utils/config-dir.js';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
/**
 * Kind of a context entry. Drives how teammates triage the feed:
 * - `note`     — general observation or progress update
 * - `decision` — a choice that others should treat as settled
 * - `finding`  — something discovered (a bug, a constraint, a fact)
 * - `blocker`  — work is stuck; someone may need to unblock it
 * - `handoff`  — work is being passed to another agent/role
 * - `question` — a request for input from teammates
 * - `answer`   — a response to an earlier question (often via `refs`)
 * - `plan`     — a proposed approach, posted for teammates to critique
 *               before execution (lets agents share *how they think*
 *               without committing to the approach yet)
 */
export const CONTEXT_KINDS = [
    'note',
    'decision',
    'finding',
    'blocker',
    'handoff',
    'question',
    'answer',
    'plan',
];
// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CONFIG_FILE_NAME = '.omc-config.json';
/**
 * Check if the shared context feed is enabled via config.
 *
 * Reads `agents.sharedContext.enabled` from
 * `[$CLAUDE_CONFIG_DIR|~/.claude]/.omc-config.json`.
 * Defaults to true when the config key is absent (opt-out, mirroring
 * shared memory).
 */
export function isSharedContextEnabled() {
    try {
        const configPath = join(getClaudeConfigDir(), CONFIG_FILE_NAME);
        if (!existsSync(configPath))
            return true; // default enabled
        const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
        const enabled = raw?.agents?.sharedContext?.enabled;
        if (typeof enabled === 'boolean')
            return enabled;
        return true; // default enabled when key absent
    }
    catch {
        return true;
    }
}
// ---------------------------------------------------------------------------
// Path + validation helpers
// ---------------------------------------------------------------------------
const SHARED_CONTEXT_DIR = 'state/shared-context';
/** Default number of entries returned by {@link readFeed}. */
export const DEFAULT_READ_LIMIT = 50;
/** Hard ceiling on entries returned by {@link readFeed}. */
export const MAX_READ_LIMIT = 500;
const MAX_MESSAGE_LENGTH = 8192;
/** Validate namespace: alphanumeric, hyphens, underscores, dots. Max 128 chars. */
function validateNamespace(namespace) {
    if (!namespace || namespace.length > 128) {
        throw new Error(`Invalid namespace: must be 1-128 characters (got ${namespace.length})`);
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(namespace)) {
        throw new Error(`Invalid namespace: must be alphanumeric with hyphens/underscores/dots (got "${namespace}")`);
    }
    if (namespace.includes('..')) {
        throw new Error('Invalid namespace: path traversal not allowed');
    }
}
/** Validate author: non-empty, max 128 chars, no newlines. */
function validateAuthor(author) {
    if (!author || author.length > 128) {
        throw new Error(`Invalid author: must be 1-128 characters (got ${author.length})`);
    }
    if (/[\r\n]/.test(author)) {
        throw new Error('Invalid author: must not contain newlines');
    }
}
/** Validate message: non-empty, bounded length. */
function validateMessage(message) {
    if (!message || message.length === 0) {
        throw new Error('Invalid message: must not be empty');
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Invalid message: must be <= ${MAX_MESSAGE_LENGTH} characters (got ${message.length})`);
    }
}
/** Get the JSONL file path for a namespace's feed. */
function getFeedPath(namespace, worktreeRoot) {
    validateNamespace(namespace);
    const omcRoot = getOmcRoot(worktreeRoot);
    return join(omcRoot, SHARED_CONTEXT_DIR, `${namespace}.jsonl`);
}
/** Ensure the shared-context directory exists. */
function ensureContextDir(worktreeRoot) {
    const omcRoot = getOmcRoot(worktreeRoot);
    const dir = join(omcRoot, SHARED_CONTEXT_DIR);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    return dir;
}
// ---------------------------------------------------------------------------
// Id generation
// ---------------------------------------------------------------------------
let _idCounter = 0;
/**
 * Generate a short, time-sortable, collision-resistant id.
 * Format: c<base36 time><base36 counter><base36 random>.
 * The leading time component keeps ids roughly chronological, which helps
 * when a human scans `refs`.
 */
function generateId() {
    const time = Date.now().toString(36);
    const counter = (_idCounter++ % 1296).toString(36).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 6);
    return `c${time}${counter}${rand}`;
}
// ---------------------------------------------------------------------------
// Core operations
// ---------------------------------------------------------------------------
/**
 * Append an entry to a namespace's shared context feed.
 *
 * Appends are serialized with a best-effort file lock so concurrent posters
 * never interleave partial lines. Returns the stored entry (including its
 * generated id and timestamp).
 */
export function postEntry(namespace, author, kind, message, opts, worktreeRoot) {
    validateNamespace(namespace);
    validateAuthor(author);
    validateMessage(message);
    if (!CONTEXT_KINDS.includes(kind)) {
        throw new Error(`Invalid kind: must be one of ${CONTEXT_KINDS.join(', ')} (got "${kind}")`);
    }
    ensureContextDir(worktreeRoot);
    const filePath = getFeedPath(namespace, worktreeRoot);
    const entry = {
        id: generateId(),
        namespace,
        author,
        kind,
        message,
        timestamp: new Date().toISOString(),
    };
    if (opts?.tags && opts.tags.length > 0) {
        entry.tags = opts.tags.map(String);
    }
    if (opts?.refs && opts.refs.length > 0) {
        entry.refs = opts.refs.map(String);
    }
    // JSON.stringify removes any embedded newlines from strings via escaping,
    // so each entry stays on exactly one JSONL line.
    const line = JSON.stringify(entry) + '\n';
    const lockPath = filePath + '.lock';
    const doAppend = () => appendFileSync(filePath, line, { mode: 0o600 });
    try {
        withFileLockSync(lockPath, doAppend, { timeoutMs: 500, retryDelayMs: 25 });
    }
    catch {
        // Best-effort: fall back to an unlocked append rather than dropping context.
        doAppend();
    }
    return entry;
}
/** Parse a feed file into entries, skipping blank/corrupt lines. */
function parseFeed(filePath) {
    if (!existsSync(filePath))
        return [];
    let raw;
    try {
        raw = readFileSync(filePath, 'utf-8');
    }
    catch {
        return [];
    }
    const entries = [];
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed.message === 'string' && typeof parsed.timestamp === 'string') {
                entries.push(parsed);
            }
        }
        catch {
            // Skip corrupt line
        }
    }
    return entries;
}
/**
 * Read a namespace's feed as a shared context window.
 *
 * Applies the supplied filters, then returns the most recent `limit` entries
 * in chronological order (oldest first within the returned tail). This is the
 * natural shape for an agent reading "what has the team learned recently".
 */
export function readFeed(namespace, opts = {}, worktreeRoot) {
    const filePath = getFeedPath(namespace, worktreeRoot);
    let entries = parseFeed(filePath);
    if (opts.author) {
        entries = entries.filter(e => e.author === opts.author);
    }
    if (opts.kind) {
        entries = entries.filter(e => e.kind === opts.kind);
    }
    if (opts.since) {
        const sinceMs = new Date(opts.since).getTime();
        if (!Number.isNaN(sinceMs)) {
            entries = entries.filter(e => {
                const t = new Date(e.timestamp).getTime();
                return Number.isNaN(t) ? false : t >= sinceMs;
            });
        }
    }
    if (opts.contains) {
        const needle = opts.contains.toLowerCase();
        entries = entries.filter(e => e.message.toLowerCase().includes(needle));
    }
    const limit = Math.min(Math.max(1, opts.limit ?? DEFAULT_READ_LIMIT), MAX_READ_LIMIT);
    // Return the tail (most recent `limit`) in chronological order.
    return entries.length > limit ? entries.slice(entries.length - limit) : entries;
}
/** Count entries in a namespace's feed (after no filtering). */
export function countEntries(namespace, worktreeRoot) {
    return parseFeed(getFeedPath(namespace, worktreeRoot)).length;
}
/**
 * Clear (delete) a namespace's feed entirely.
 *
 * Returns the number of entries that were removed.
 */
export function clearFeed(namespace, worktreeRoot) {
    const filePath = getFeedPath(namespace, worktreeRoot);
    if (!existsSync(filePath))
        return { removed: 0 };
    const removed = parseFeed(filePath).length;
    try {
        unlinkSync(filePath);
    }
    catch {
        return { removed: 0 };
    }
    // Best-effort cleanup of a stale lock file.
    try {
        const lockPath = filePath + '.lock';
        if (existsSync(lockPath))
            unlinkSync(lockPath);
    }
    catch {
        /* ignore */
    }
    return { removed };
}
/**
 * Compute a digest of a channel.
 *
 * Open question = a question entry whose id is not referenced by any answer
 * entry's `refs` (lightweight unresolved-thread detection).
 * Open blocker  = a blocker entry whose id is not referenced by any later
 * entry's `refs` (i.e. nothing claims to have addressed it).
 *
 * @param highlightLimit Number of entries to include per highlight section.
 *                       Defaults to 5, clamped to [1, 20].
 */
export function digestChannel(namespace, highlightLimit = 5, worktreeRoot) {
    const filePath = getFeedPath(namespace, worktreeRoot);
    const entries = parseFeed(filePath);
    const limit = Math.min(Math.max(1, highlightLimit), 20);
    const byKind = {
        note: 0, decision: 0, finding: 0, blocker: 0, handoff: 0, question: 0, answer: 0, plan: 0,
    };
    const authorCounts = new Map();
    const answeredIds = new Set();
    const referencedIds = new Set();
    for (const e of entries) {
        if (e.kind in byKind)
            byKind[e.kind]++;
        authorCounts.set(e.author, (authorCounts.get(e.author) ?? 0) + 1);
        if (e.refs && e.refs.length > 0) {
            for (const r of e.refs) {
                referencedIds.add(r);
                if (e.kind === 'answer')
                    answeredIds.add(r);
            }
        }
    }
    const openQuestionEntries = entries.filter(e => e.kind === 'question' && !answeredIds.has(e.id));
    const openBlockerEntries = entries.filter(e => e.kind === 'blocker' && !referencedIds.has(e.id));
    // Most recent first within each highlight (so the freshest entries lead).
    const tailByKind = (k) => entries.filter(e => e.kind === k).slice(-limit).reverse();
    return {
        namespace,
        total: entries.length,
        byKind,
        byAuthor: [...authorCounts.entries()]
            .map(([author, count]) => ({ author, count }))
            .sort((a, b) => b.count - a.count || a.author.localeCompare(b.author)),
        openQuestions: openQuestionEntries.length,
        openBlockers: openBlockerEntries.length,
        firstAt: entries[0]?.timestamp,
        lastAt: entries[entries.length - 1]?.timestamp,
        highlights: {
            decisions: tailByKind('decision'),
            blockers: openBlockerEntries.slice(-limit).reverse(),
            handoffs: tailByKind('handoff'),
            openQuestions: openQuestionEntries.slice(-limit).reverse(),
        },
    };
}
/**
 * Return all unanswered questions in a channel — questions whose id is not
 * referenced by any later answer entry. Useful for "what does the team need
 * from me before I move on".
 */
export function listOpenQuestions(namespace, worktreeRoot) {
    const entries = parseFeed(getFeedPath(namespace, worktreeRoot));
    const answered = new Set();
    for (const e of entries) {
        if (e.kind === 'answer' && e.refs) {
            for (const r of e.refs)
                answered.add(r);
        }
    }
    return entries.filter(e => e.kind === 'question' && !answered.has(e.id));
}
/**
 * List all namespaces (channels) that have a shared context feed, with a
 * lightweight summary of each.
 */
export function listContextNamespaces(worktreeRoot) {
    const omcRoot = getOmcRoot(worktreeRoot);
    const dir = join(omcRoot, SHARED_CONTEXT_DIR);
    if (!existsSync(dir))
        return [];
    let files;
    try {
        files = readdirSync(dir).filter(f => f.endsWith('.jsonl'));
    }
    catch {
        return [];
    }
    const summaries = [];
    for (const file of files) {
        const namespace = file.slice(0, -'.jsonl'.length);
        const entries = parseFeed(join(dir, file));
        const last = entries[entries.length - 1];
        summaries.push({
            namespace,
            entries: entries.length,
            lastAuthor: last?.author,
            lastKind: last?.kind,
            lastAt: last?.timestamp,
        });
    }
    return summaries.sort((a, b) => a.namespace.localeCompare(b.namespace));
}
//# sourceMappingURL=shared-context.js.map