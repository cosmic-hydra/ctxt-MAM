/**
 * Shared Context Feed MCP Tools
 *
 * Cross-agent collaboration primitive: an append-only, authored, chronological
 * "team blackboard" that every agent reads as a shared rolling context window.
 *
 * Complements:
 * - shared_memory_* (key-value point lookups, overwrite-in-place)
 * - the team message router (point-to-point delivery)
 *
 * Agents post entries tagged by kind (note/decision/finding/blocker/handoff/
 * question/answer); teammates tail the most recent entries — optionally filtered
 * by author, kind, recency, or substring — to stay aligned.
 *
 * Storage: .omc/state/shared-context/{namespace}.jsonl
 * Config gate: agents.sharedContext.enabled in ~/.claude/.omc-config.json
 */

import { z } from 'zod';
import { validateWorkingDirectory } from '../lib/worktree-paths.js';
import { getClaudeConfigDir } from '../utils/config-dir.js';
import {
  isSharedContextEnabled,
  postEntry,
  readFeed,
  clearFeed,
  listContextNamespaces,
  digestChannel,
  listOpenQuestions,
  CONTEXT_KINDS,
  DEFAULT_READ_LIMIT,
  MAX_READ_LIMIT,
  type ContextEntry,
} from '../lib/shared-context.js';
import type { ToolDefinition } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DISABLED_MSG = `Shared context is disabled. Set agents.sharedContext.enabled = true in ${getClaudeConfigDir()}/.omc-config.json to enable.`;

function disabledResponse() {
  return {
    content: [{ type: 'text' as const, text: DISABLED_MSG }],
    isError: true,
  };
}

function errorResponse(msg: string) {
  return {
    content: [{ type: 'text' as const, text: msg }],
    isError: true,
  };
}

/** Render a single entry as a compact markdown bullet for the read view. */
function formatEntry(entry: ContextEntry): string {
  const parts = [`- \`${entry.timestamp}\` **${entry.author}** [${entry.kind}]`];
  if (entry.tags && entry.tags.length > 0) {
    parts.push(`(${entry.tags.map(t => `#${t}`).join(' ')})`);
  }
  let line = parts.join(' ');
  line += `\n  ${entry.message.replace(/\n/g, '\n  ')}`;
  line += `\n  _id: ${entry.id}_`;
  if (entry.refs && entry.refs.length > 0) {
    line += ` _refs: ${entry.refs.join(', ')}_`;
  }
  return line;
}

// ---------------------------------------------------------------------------
// shared_context_post
// ---------------------------------------------------------------------------

export const sharedContextPostTool: ToolDefinition<{
  namespace: z.ZodString;
  author: z.ZodString;
  message: z.ZodString;
  kind: z.ZodDefault<z.ZodEnum<[string, ...string[]]>>;
  tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
  refs: z.ZodOptional<z.ZodArray<z.ZodString>>;
  workingDirectory: z.ZodOptional<z.ZodString>;
}> = {
  name: 'shared_context_post',
  description: 'Post an entry to the shared context feed — a broadcast "team blackboard" all agents read. Use for findings, decisions, blockers, handoffs, and questions so teammates stay aligned without re-deriving work.',
  schema: {
    namespace: z.string().min(1).max(128).describe('Channel to post to (e.g., team name, pipeline run ID, session group)'),
    author: z.string().min(1).max(128).describe('Your agent name or role (e.g., "executor", "planner", "worker-2")'),
    message: z.string().min(1).max(8192).describe('The context to share with teammates'),
    kind: z.enum(CONTEXT_KINDS as unknown as [string, ...string[]]).default('note').describe('Entry kind: note, decision, finding, blocker, handoff, question, or answer'),
    tags: z.array(z.string()).optional().describe('Optional freeform tags for filtering/grouping'),
    refs: z.array(z.string()).optional().describe('Optional ids of related entries (lightweight threading, e.g. answering a question)'),
    workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
  },
  handler: async (args) => {
    if (!isSharedContextEnabled()) return disabledResponse();

    try {
      const root = validateWorkingDirectory(args.workingDirectory);
      const entry = postEntry(
        args.namespace,
        args.author,
        args.kind as ContextEntry['kind'],
        args.message,
        { tags: args.tags, refs: args.refs },
        root,
      );

      const text = [
        `Posted to shared context feed **${entry.namespace}**.`,
        '',
        `- **id:** ${entry.id}`,
        `- **author:** ${entry.author}`,
        `- **kind:** ${entry.kind}`,
        `- **at:** ${entry.timestamp}`,
      ].join('\n');

      return { content: [{ type: 'text' as const, text }] };
    } catch (error) {
      return errorResponse(`Error posting to shared context: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// ---------------------------------------------------------------------------
// shared_context_read
// ---------------------------------------------------------------------------

export const sharedContextReadTool: ToolDefinition<{
  namespace: z.ZodString;
  limit: z.ZodOptional<z.ZodNumber>;
  kind: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
  author: z.ZodOptional<z.ZodString>;
  since: z.ZodOptional<z.ZodString>;
  contains: z.ZodOptional<z.ZodString>;
  workingDirectory: z.ZodOptional<z.ZodString>;
}> = {
  name: 'shared_context_read',
  description: 'Read the shared context window for a channel — the most recent entries posted by teammates, in chronological order. Filter by kind, author, recency (since), or substring to focus the window.',
  schema: {
    namespace: z.string().min(1).max(128).describe('Channel to read from'),
    limit: z.number().int().min(1).max(MAX_READ_LIMIT).optional().describe(`Max entries to return, newest tail (default ${DEFAULT_READ_LIMIT}, max ${MAX_READ_LIMIT})`),
    kind: z.enum(CONTEXT_KINDS as unknown as [string, ...string[]]).optional().describe('Only entries of this kind'),
    author: z.string().min(1).max(128).optional().describe('Only entries from this author'),
    since: z.string().optional().describe('Only entries at or after this ISO timestamp (e.g., 2026-06-09T00:00:00.000Z)'),
    contains: z.string().min(1).max(256).optional().describe('Only entries whose message contains this substring (case-insensitive)'),
    workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
  },
  handler: async (args) => {
    if (!isSharedContextEnabled()) return disabledResponse();

    try {
      const root = validateWorkingDirectory(args.workingDirectory);
      const entries = readFeed(
        args.namespace,
        {
          limit: args.limit,
          kind: args.kind as ContextEntry['kind'] | undefined,
          author: args.author,
          since: args.since,
          contains: args.contains,
        },
        root,
      );

      if (entries.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No entries in shared context channel "${args.namespace}" (or none match the filters).`,
          }],
        };
      }

      const body = entries.map(formatEntry).join('\n');
      return {
        content: [{
          type: 'text' as const,
          text: `## Shared Context: ${args.namespace}\n\nShowing ${entries.length} most recent ${entries.length === 1 ? 'entry' : 'entries'} (oldest first):\n\n${body}`,
        }],
      };
    } catch (error) {
      return errorResponse(`Error reading shared context: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// ---------------------------------------------------------------------------
// shared_context_list
// ---------------------------------------------------------------------------

export const sharedContextListTool: ToolDefinition<{
  workingDirectory: z.ZodOptional<z.ZodString>;
}> = {
  name: 'shared_context_list',
  description: 'List shared context channels (namespaces) with entry counts and the latest activity in each.',
  schema: {
    workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
  },
  handler: async (args) => {
    if (!isSharedContextEnabled()) return disabledResponse();

    try {
      const root = validateWorkingDirectory(args.workingDirectory);
      const channels = listContextNamespaces(root);

      if (channels.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No shared context channels found.' }],
        };
      }

      const lines = channels.map(c => {
        let line = `- **${c.namespace}** — ${c.entries} ${c.entries === 1 ? 'entry' : 'entries'}`;
        if (c.lastAt) {
          line += ` (last: ${c.lastKind} by ${c.lastAuthor} at ${c.lastAt})`;
        }
        return line;
      });

      return {
        content: [{
          type: 'text' as const,
          text: `## Shared Context Channels\n\n${lines.join('\n')}`,
        }],
      };
    } catch (error) {
      return errorResponse(`Error listing shared context: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// ---------------------------------------------------------------------------
// shared_context_clear
// ---------------------------------------------------------------------------

export const sharedContextClearTool: ToolDefinition<{
  namespace: z.ZodString;
  workingDirectory: z.ZodOptional<z.ZodString>;
}> = {
  name: 'shared_context_clear',
  description: 'Clear (delete) all entries in a shared context channel. Use when a team/pipeline run is finished to keep the feed tidy.',
  schema: {
    namespace: z.string().min(1).max(128).describe('Channel to clear'),
    workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
  },
  handler: async (args) => {
    if (!isSharedContextEnabled()) return disabledResponse();

    try {
      const root = validateWorkingDirectory(args.workingDirectory);
      const result = clearFeed(args.namespace, root);

      if (result.removed === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `Channel "${args.namespace}" was already empty (nothing to clear).`,
          }],
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: `Cleared shared context channel "${args.namespace}" (${result.removed} ${result.removed === 1 ? 'entry' : 'entries'} removed).`,
        }],
      };
    } catch (error) {
      return errorResponse(`Error clearing shared context: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// ---------------------------------------------------------------------------
// shared_context_digest
// ---------------------------------------------------------------------------

export const sharedContextDigestTool: ToolDefinition<{
  namespace: z.ZodString;
  highlightLimit: z.ZodOptional<z.ZodNumber>;
  workingDirectory: z.ZodOptional<z.ZodString>;
}> = {
  name: 'shared_context_digest',
  description: 'Compress a shared context channel into a triage summary: totals by kind, top authors, open questions, open blockers, plus a few highlight entries per category. Use this before doing deep reads — it lets you orient on a busy channel in O(1) tokens.',
  schema: {
    namespace: z.string().min(1).max(128).describe('Channel to summarize'),
    highlightLimit: z.number().int().min(1).max(20).optional().describe('Entries per highlight section (default 5)'),
    workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
  },
  handler: async (args) => {
    if (!isSharedContextEnabled()) return disabledResponse();

    try {
      const root = validateWorkingDirectory(args.workingDirectory);
      const digest = digestChannel(args.namespace, args.highlightLimit, root);

      if (digest.total === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `Channel "${args.namespace}" is empty — nothing to digest.`,
          }],
        };
      }

      const kindLines = (Object.entries(digest.byKind) as Array<[string, number]>)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `  - ${k}: ${n}`)
        .join('\n');

      const authorLines = digest.byAuthor
        .slice(0, 8)
        .map(a => `  - ${a.author}: ${a.count}`)
        .join('\n');

      const section = (title: string, list: ContextEntry[]) => {
        if (list.length === 0) return `### ${title}\n\n_none_`;
        return `### ${title}\n\n${list.map(formatEntry).join('\n')}`;
      };

      const text = [
        `## Shared Context Digest: ${digest.namespace}`,
        '',
        `- **total entries:** ${digest.total}`,
        `- **open questions:** ${digest.openQuestions}`,
        `- **open blockers:** ${digest.openBlockers}`,
        digest.firstAt ? `- **first at:** ${digest.firstAt}` : '',
        digest.lastAt ? `- **last at:** ${digest.lastAt}` : '',
        '',
        '### By kind',
        kindLines || '  _none_',
        '',
        '### Top authors',
        authorLines || '  _none_',
        '',
        section('Latest decisions', digest.highlights.decisions),
        '',
        section('Open blockers', digest.highlights.blockers),
        '',
        section('Latest handoffs', digest.highlights.handoffs),
        '',
        section('Open questions', digest.highlights.openQuestions),
      ].filter(Boolean).join('\n');

      return { content: [{ type: 'text' as const, text }] };
    } catch (error) {
      return errorResponse(`Error digesting shared context: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// ---------------------------------------------------------------------------
// shared_context_open_questions
// ---------------------------------------------------------------------------

export const sharedContextOpenQuestionsTool: ToolDefinition<{
  namespace: z.ZodString;
  workingDirectory: z.ZodOptional<z.ZodString>;
}> = {
  name: 'shared_context_open_questions',
  description: 'List unanswered questions in a shared context channel — questions whose id is not referenced by any later answer entry. Use to find what teammates need from you before continuing.',
  schema: {
    namespace: z.string().min(1).max(128).describe('Channel to scan'),
    workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
  },
  handler: async (args) => {
    if (!isSharedContextEnabled()) return disabledResponse();

    try {
      const root = validateWorkingDirectory(args.workingDirectory);
      const open = listOpenQuestions(args.namespace, root);

      if (open.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No open questions in channel "${args.namespace}".`,
          }],
        };
      }

      const body = open.map(formatEntry).join('\n');
      return {
        content: [{
          type: 'text' as const,
          text: `## Open Questions: ${args.namespace}\n\n${open.length} unanswered (answer via shared_context_post with kind="answer" and refs=["<id>"]):\n\n${body}`,
        }],
      };
    } catch (error) {
      return errorResponse(`Error listing open questions: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// ---------------------------------------------------------------------------
// Export all tools
// ---------------------------------------------------------------------------

export const sharedContextTools = [
  sharedContextPostTool,
  sharedContextReadTool,
  sharedContextListTool,
  sharedContextClearTool,
  sharedContextDigestTool,
  sharedContextOpenQuestionsTool,
];
