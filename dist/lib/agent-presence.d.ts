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
export declare function isPresenceEnabled(): boolean;
export declare const DEFAULT_PRESENCE_TTL_SECONDS: number;
export declare const MAX_PRESENCE_TTL_SECONDS: number;
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
export declare function announcePresence(args: AnnounceArgs, worktreeRoot?: string): PresenceEntry;
export interface ListPresenceOptions {
    /** Include stale entries (default false). */
    includeStale?: boolean;
}
/**
 * List live presence in a channel. Stale entries are auto-evicted from disk
 * on read so the channel stays tidy.
 */
export declare function listPresence(namespace: string, opts?: ListPresenceOptions, worktreeRoot?: string): PresenceEntry[];
/** Remove an agent's presence entry. Returns true if it existed. */
export declare function leavePresence(namespace: string, agent: string, worktreeRoot?: string): boolean;
/** Sweep stale entries across all namespaces. Returns count removed. */
export declare function reapStale(worktreeRoot?: string): {
    removed: number;
};
//# sourceMappingURL=agent-presence.d.ts.map