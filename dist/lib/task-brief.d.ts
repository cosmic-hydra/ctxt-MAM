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
export declare const TASK_STATUSES: readonly ["open", "in-progress", "blocked", "done", "cancelled"];
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
export declare function isTaskBriefEnabled(): boolean;
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
export declare function createBrief(args: CreateBriefArgs, worktreeRoot?: string): TaskBrief;
/** Read a brief. Returns null if not found. */
export declare function getBrief(namespace: string, briefId: string, worktreeRoot?: string): TaskBrief | null;
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
export declare function updateStatus(args: UpdateStatusArgs, worktreeRoot?: string): TaskBrief;
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
export declare function amendBrief(args: AmendBriefArgs, worktreeRoot?: string): TaskBrief;
export interface ListBriefsOptions {
    status?: TaskStatus;
    owner?: string;
    tag?: string;
}
export declare function listBriefs(namespace: string, opts?: ListBriefsOptions, worktreeRoot?: string): TaskBriefListItem[];
/** Delete a brief. Returns true if the brief existed and was removed. */
export declare function deleteBrief(namespace: string, briefId: string, worktreeRoot?: string): boolean;
//# sourceMappingURL=task-brief.d.ts.map