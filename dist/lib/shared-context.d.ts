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
export declare const CONTEXT_KINDS: readonly ["note", "decision", "finding", "blocker", "handoff", "question", "answer", "plan"];
export type ContextKind = (typeof CONTEXT_KINDS)[number];
export interface ContextEntry {
    /** Short, sortable, unique id. Referenceable from another entry's `refs`. */
    id: string;
    namespace: string;
    /** Agent name or role that posted the entry. */
    author: string;
    kind: ContextKind;
    message: string;
    /** Optional freeform tags for filtering/grouping. */
    tags?: string[];
    /** Optional ids of related entries (lightweight threading). */
    refs?: string[];
    /** ISO timestamp of when the entry was posted. */
    timestamp: string;
}
export interface ReadFeedOptions {
    /** Max entries to return (the tail). Defaults to 50. */
    limit?: number;
    /** Only entries at or after this ISO timestamp. */
    since?: string;
    /** Only entries from this author. */
    author?: string;
    /** Only entries of this kind. */
    kind?: ContextKind;
    /** Only entries whose message contains this substring (case-insensitive). */
    contains?: string;
}
export interface ContextNamespaceSummary {
    namespace: string;
    entries: number;
    lastAuthor?: string;
    lastKind?: ContextKind;
    lastAt?: string;
}
/**
 * Check if the shared context feed is enabled via config.
 *
 * Reads `agents.sharedContext.enabled` from
 * `[$CLAUDE_CONFIG_DIR|~/.claude]/.omc-config.json`.
 * Defaults to true when the config key is absent (opt-out, mirroring
 * shared memory).
 */
export declare function isSharedContextEnabled(): boolean;
/** Default number of entries returned by {@link readFeed}. */
export declare const DEFAULT_READ_LIMIT = 50;
/** Hard ceiling on entries returned by {@link readFeed}. */
export declare const MAX_READ_LIMIT = 500;
/**
 * Append an entry to a namespace's shared context feed.
 *
 * Appends are serialized with a best-effort file lock so concurrent posters
 * never interleave partial lines. Returns the stored entry (including its
 * generated id and timestamp).
 */
export declare function postEntry(namespace: string, author: string, kind: ContextKind, message: string, opts?: {
    tags?: string[];
    refs?: string[];
}, worktreeRoot?: string): ContextEntry;
/**
 * Read a namespace's feed as a shared context window.
 *
 * Applies the supplied filters, then returns the most recent `limit` entries
 * in chronological order (oldest first within the returned tail). This is the
 * natural shape for an agent reading "what has the team learned recently".
 */
export declare function readFeed(namespace: string, opts?: ReadFeedOptions, worktreeRoot?: string): ContextEntry[];
/** Count entries in a namespace's feed (after no filtering). */
export declare function countEntries(namespace: string, worktreeRoot?: string): number;
/**
 * Clear (delete) a namespace's feed entirely.
 *
 * Returns the number of entries that were removed.
 */
export declare function clearFeed(namespace: string, worktreeRoot?: string): {
    removed: number;
};
/**
 * A rolled-up, compressed view of a channel — counts by kind, top authors,
 * unanswered question count, and a few "headline" entries per category. Lets a
 * teammate get oriented in O(1) tokens instead of reading the full tail.
 */
export interface ChannelDigest {
    namespace: string;
    total: number;
    byKind: Record<ContextKind, number>;
    byAuthor: Array<{
        author: string;
        count: number;
    }>;
    openQuestions: number;
    openBlockers: number;
    firstAt?: string;
    lastAt?: string;
    highlights: {
        decisions: ContextEntry[];
        blockers: ContextEntry[];
        handoffs: ContextEntry[];
        openQuestions: ContextEntry[];
    };
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
export declare function digestChannel(namespace: string, highlightLimit?: number, worktreeRoot?: string): ChannelDigest;
/**
 * Return all unanswered questions in a channel — questions whose id is not
 * referenced by any later answer entry. Useful for "what does the team need
 * from me before I move on".
 */
export declare function listOpenQuestions(namespace: string, worktreeRoot?: string): ContextEntry[];
/**
 * List all namespaces (channels) that have a shared context feed, with a
 * lightweight summary of each.
 */
export declare function listContextNamespaces(worktreeRoot?: string): ContextNamespaceSummary[];
//# sourceMappingURL=shared-context.d.ts.map