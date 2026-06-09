/**
 * Task Brief MCP Tools
 *
 * Structured task descriptors so any agent can grasp a task deterministically:
 * goal, success criteria, constraints, owners, status, related context.
 * Designed to be provider-agnostic — the backing lib is pure file-based JSON
 * and is also exposed via the `omc-mam` CLI for Codex/Gemini/etc.
 *
 * Config gate: agents.taskBrief.enabled in ~/.claude/.omc-config.json
 */
import { z } from 'zod';
import { validateWorkingDirectory } from '../lib/worktree-paths.js';
import { getClaudeConfigDir } from '../utils/config-dir.js';
import { isTaskBriefEnabled, createBrief, getBrief, updateStatus, amendBrief, listBriefs, deleteBrief, TASK_STATUSES, } from '../lib/task-brief.js';
const DISABLED_MSG = `Task briefs are disabled. Set agents.taskBrief.enabled = true in ${getClaudeConfigDir()}/.omc-config.json to enable.`;
function disabledResponse() {
    return { content: [{ type: 'text', text: DISABLED_MSG }], isError: true };
}
function errorResponse(msg) {
    return { content: [{ type: 'text', text: msg }], isError: true };
}
function renderBrief(brief) {
    const lines = [];
    lines.push(`## Task Brief: ${brief.title}`);
    lines.push('');
    lines.push(`- **id:** ${brief.briefId}`);
    lines.push(`- **namespace:** ${brief.namespace}`);
    lines.push(`- **status:** ${brief.status}`);
    lines.push(`- **owners:** ${brief.owners.length > 0 ? brief.owners.join(', ') : '_unassigned_'}`);
    lines.push(`- **created by:** ${brief.createdBy} at ${brief.createdAt}`);
    lines.push(`- **updated:** ${brief.updatedAt}`);
    if (brief.tags?.length)
        lines.push(`- **tags:** ${brief.tags.join(', ')}`);
    lines.push('');
    lines.push('### Goal');
    lines.push(brief.goal);
    lines.push('');
    if (brief.successCriteria.length > 0) {
        lines.push('### Success Criteria');
        for (const sc of brief.successCriteria)
            lines.push(`- [ ] ${sc}`);
        lines.push('');
    }
    if (brief.constraints.length > 0) {
        lines.push('### Constraints');
        for (const c of brief.constraints)
            lines.push(`- ${c}`);
        lines.push('');
    }
    if (brief.relatedKeys?.length) {
        lines.push('### Related shared_memory keys');
        for (const k of brief.relatedKeys)
            lines.push(`- ${k}`);
        lines.push('');
    }
    if (brief.relatedEntries?.length) {
        lines.push('### Related shared_context entries');
        for (const e of brief.relatedEntries)
            lines.push(`- ${e}`);
        lines.push('');
    }
    lines.push('### Status History');
    for (const ev of brief.statusHistory) {
        let line = `- \`${ev.at}\` ${ev.by} → ${ev.status}`;
        if (ev.summary)
            line += ` (${ev.summary})`;
        lines.push(line);
    }
    return lines.join('\n');
}
// ---------------------------------------------------------------------------
// task_brief_create
// ---------------------------------------------------------------------------
export const taskBriefCreateTool = {
    name: 'task_brief_create',
    description: 'Create a structured task brief. Captures goal, success criteria, constraints, owners, and pointers to related context so any agent (Claude, Codex, Gemini, etc.) can grasp the task deterministically.',
    schema: {
        briefId: z.string().min(1).max(128).describe('Stable unique id for the brief (alphanumeric/.-_). Used as a reference from other entries.'),
        namespace: z.string().min(1).max(128).describe('Channel/team to scope the brief to'),
        title: z.string().min(1).max(256).describe('Short human-readable title'),
        goal: z.string().min(1).max(4096).describe('One-paragraph statement of what to accomplish'),
        createdBy: z.string().min(1).max(128).describe('Author (your agent name)'),
        successCriteria: z.array(z.string()).optional().describe('Explicit "done when..." checklist items'),
        constraints: z.array(z.string()).optional().describe('Hard rules the work must respect'),
        owners: z.array(z.string()).optional().describe('Agent names/roles responsible for the brief'),
        relatedKeys: z.array(z.string()).optional().describe('shared_memory keys (namespace:key) that hold related state'),
        relatedEntries: z.array(z.string()).optional().describe('shared_context entry ids relevant to this brief'),
        tags: z.array(z.string()).optional().describe('Optional freeform tags'),
        workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
    },
    handler: async (args) => {
        if (!isTaskBriefEnabled())
            return disabledResponse();
        try {
            const root = validateWorkingDirectory(args.workingDirectory);
            const brief = createBrief({
                briefId: args.briefId,
                namespace: args.namespace,
                title: args.title,
                goal: args.goal,
                createdBy: args.createdBy,
                successCriteria: args.successCriteria,
                constraints: args.constraints,
                owners: args.owners,
                relatedKeys: args.relatedKeys,
                relatedEntries: args.relatedEntries,
                tags: args.tags,
            }, root);
            return { content: [{ type: 'text', text: `Created task brief.\n\n${renderBrief(brief)}` }] };
        }
        catch (error) {
            return errorResponse(`Error creating task brief: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
// ---------------------------------------------------------------------------
// task_brief_get
// ---------------------------------------------------------------------------
export const taskBriefGetTool = {
    name: 'task_brief_get',
    description: 'Read a task brief — the structured artifact an agent loads at start of work to grasp what to do.',
    schema: {
        briefId: z.string().min(1).max(128).describe('Brief id to read'),
        namespace: z.string().min(1).max(128).describe('Channel/team the brief lives in'),
        workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
    },
    handler: async (args) => {
        if (!isTaskBriefEnabled())
            return disabledResponse();
        try {
            const root = validateWorkingDirectory(args.workingDirectory);
            const brief = getBrief(args.namespace, args.briefId, root);
            if (!brief) {
                return { content: [{ type: 'text', text: `Brief "${args.briefId}" not found in namespace "${args.namespace}".` }] };
            }
            return { content: [{ type: 'text', text: renderBrief(brief) }] };
        }
        catch (error) {
            return errorResponse(`Error reading task brief: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
// ---------------------------------------------------------------------------
// task_brief_update_status
// ---------------------------------------------------------------------------
export const taskBriefUpdateStatusTool = {
    name: 'task_brief_update_status',
    description: 'Append a status transition to a task brief (open/in-progress/blocked/done/cancelled). Status history is append-only so the audit trail is complete.',
    schema: {
        briefId: z.string().min(1).max(128).describe('Brief id'),
        namespace: z.string().min(1).max(128).describe('Channel/team the brief lives in'),
        status: z.enum(TASK_STATUSES).describe('New status'),
        by: z.string().min(1).max(128).describe('Agent posting the transition'),
        summary: z.string().min(1).max(1024).optional().describe('Optional short summary of the transition'),
        workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
    },
    handler: async (args) => {
        if (!isTaskBriefEnabled())
            return disabledResponse();
        try {
            const root = validateWorkingDirectory(args.workingDirectory);
            const brief = updateStatus({
                namespace: args.namespace,
                briefId: args.briefId,
                status: args.status,
                by: args.by,
                summary: args.summary,
            }, root);
            return { content: [{ type: 'text', text: `Status updated.\n\n${renderBrief(brief)}` }] };
        }
        catch (error) {
            return errorResponse(`Error updating task brief status: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
// ---------------------------------------------------------------------------
// task_brief_amend
// ---------------------------------------------------------------------------
export const taskBriefAmendTool = {
    name: 'task_brief_amend',
    description: 'Additively amend a task brief\'s lists (success criteria, constraints, owners, related keys/entries, tags). Concurrent-safe — only adds/removes the specified items, never overwrites whole lists.',
    schema: {
        briefId: z.string().min(1).max(128).describe('Brief id'),
        namespace: z.string().min(1).max(128).describe('Channel/team the brief lives in'),
        by: z.string().min(1).max(128).describe('Agent posting the amendment'),
        addSuccessCriteria: z.array(z.string()).optional().describe('Success criteria items to add'),
        addConstraints: z.array(z.string()).optional().describe('Constraint items to add'),
        addOwners: z.array(z.string()).optional().describe('Owner agents to add'),
        removeOwners: z.array(z.string()).optional().describe('Owner agents to remove'),
        addRelatedKeys: z.array(z.string()).optional().describe('Related shared_memory keys to add'),
        addRelatedEntries: z.array(z.string()).optional().describe('Related shared_context entry ids to add'),
        addTags: z.array(z.string()).optional().describe('Tags to add'),
        workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
    },
    handler: async (args) => {
        if (!isTaskBriefEnabled())
            return disabledResponse();
        try {
            const root = validateWorkingDirectory(args.workingDirectory);
            const brief = amendBrief({
                namespace: args.namespace,
                briefId: args.briefId,
                by: args.by,
                addSuccessCriteria: args.addSuccessCriteria,
                addConstraints: args.addConstraints,
                addOwners: args.addOwners,
                removeOwners: args.removeOwners,
                addRelatedKeys: args.addRelatedKeys,
                addRelatedEntries: args.addRelatedEntries,
                addTags: args.addTags,
            }, root);
            return { content: [{ type: 'text', text: `Amended.\n\n${renderBrief(brief)}` }] };
        }
        catch (error) {
            return errorResponse(`Error amending task brief: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
// ---------------------------------------------------------------------------
// task_brief_list
// ---------------------------------------------------------------------------
export const taskBriefListTool = {
    name: 'task_brief_list',
    description: 'List task briefs in a namespace, sorted by most recently updated. Filter by status, owner, or tag.',
    schema: {
        namespace: z.string().min(1).max(128).describe('Channel/team to list briefs from'),
        status: z.enum(TASK_STATUSES).optional().describe('Filter by status'),
        owner: z.string().min(1).max(128).optional().describe('Filter to briefs owned by this agent'),
        tag: z.string().min(1).max(64).optional().describe('Filter by tag'),
        workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
    },
    handler: async (args) => {
        if (!isTaskBriefEnabled())
            return disabledResponse();
        try {
            const root = validateWorkingDirectory(args.workingDirectory);
            const briefs = listBriefs(args.namespace, {
                status: args.status,
                owner: args.owner,
                tag: args.tag,
            }, root);
            if (briefs.length === 0) {
                return { content: [{ type: 'text', text: `No briefs in namespace "${args.namespace}" matching filters.` }] };
            }
            const lines = briefs.map(b => `- **${b.briefId}** [${b.status}] — ${b.title} (owners: ${b.owners.join(', ') || '_unassigned_'}, updated: ${b.updatedAt})`);
            return { content: [{ type: 'text', text: `## Task Briefs: ${args.namespace}\n\n${briefs.length} ${briefs.length === 1 ? 'brief' : 'briefs'}:\n\n${lines.join('\n')}` }] };
        }
        catch (error) {
            return errorResponse(`Error listing task briefs: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
// ---------------------------------------------------------------------------
// task_brief_delete
// ---------------------------------------------------------------------------
export const taskBriefDeleteTool = {
    name: 'task_brief_delete',
    description: 'Delete a task brief. Use when cleaning up a finished pipeline run; status="done" is usually preferable to deletion so the audit trail is preserved.',
    schema: {
        briefId: z.string().min(1).max(128).describe('Brief id'),
        namespace: z.string().min(1).max(128).describe('Channel/team the brief lives in'),
        workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
    },
    handler: async (args) => {
        if (!isTaskBriefEnabled())
            return disabledResponse();
        try {
            const root = validateWorkingDirectory(args.workingDirectory);
            const removed = deleteBrief(args.namespace, args.briefId, root);
            if (!removed) {
                return { content: [{ type: 'text', text: `Brief "${args.briefId}" not found in "${args.namespace}".` }] };
            }
            return { content: [{ type: 'text', text: `Deleted brief "${args.briefId}".` }] };
        }
        catch (error) {
            return errorResponse(`Error deleting task brief: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
export const taskBriefTools = [
    taskBriefCreateTool,
    taskBriefGetTool,
    taskBriefUpdateStatusTool,
    taskBriefAmendTool,
    taskBriefListTool,
    taskBriefDeleteTool,
];
//# sourceMappingURL=task-brief-tools.js.map