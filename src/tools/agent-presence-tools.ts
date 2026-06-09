/**
 * Agent Presence MCP Tools
 *
 * Provider-agnostic "who's working what right now" beacon. Agents announce
 * themselves with provider/role/focus/briefId and a TTL; teammates list
 * presence to discover live collaborators without reading the full feed.
 *
 * Config gate: agents.presence.enabled in ~/.claude/.omc-config.json
 */

import { z } from 'zod';
import { validateWorkingDirectory } from '../lib/worktree-paths.js';
import { getClaudeConfigDir } from '../utils/config-dir.js';
import {
  isPresenceEnabled,
  announcePresence,
  listPresence,
  leavePresence,
  reapStale,
  DEFAULT_PRESENCE_TTL_SECONDS,
  MAX_PRESENCE_TTL_SECONDS,
  type PresenceEntry,
} from '../lib/agent-presence.js';
import type { ToolDefinition } from './types.js';

const DISABLED_MSG = `Agent presence is disabled. Set agents.presence.enabled = true in ${getClaudeConfigDir()}/.omc-config.json to enable.`;

function disabledResponse() {
  return { content: [{ type: 'text' as const, text: DISABLED_MSG }], isError: true };
}

function errorResponse(msg: string) {
  return { content: [{ type: 'text' as const, text: msg }], isError: true };
}

function formatPresence(e: PresenceEntry): string {
  const bits = [`- **${e.agent}** (${e.provider})`];
  if (e.role) bits.push(`role=${e.role}`);
  if (e.briefId) bits.push(`brief=${e.briefId}`);
  bits.push(`lastSeen=${e.lastSeen}`);
  bits.push(`ttl=${e.ttlSeconds}s`);
  let line = bits.join(' · ');
  if (e.focus) line += `\n  focus: ${e.focus}`;
  return line;
}

// ---------------------------------------------------------------------------
// agent_presence_announce
// ---------------------------------------------------------------------------

export const agentPresenceAnnounceTool: ToolDefinition<{
  namespace: z.ZodString;
  agent: z.ZodString;
  provider: z.ZodString;
  role: z.ZodOptional<z.ZodString>;
  focus: z.ZodOptional<z.ZodString>;
  briefId: z.ZodOptional<z.ZodString>;
  ttlSeconds: z.ZodOptional<z.ZodNumber>;
  workingDirectory: z.ZodOptional<z.ZodString>;
}> = {
  name: 'agent_presence_announce',
  description: 'Announce or heartbeat presence in a channel. Tell teammates who you are (provider/role) and what you are focused on right now. Call again periodically to refresh the TTL.',
  schema: {
    namespace: z.string().min(1).max(128).describe('Channel/team to announce in'),
    agent: z.string().min(1).max(128).describe('Your agent name (stable id)'),
    provider: z.string().min(1).max(128).describe('Provider id (claude, codex, gemini, ollama:llama3, etc.)'),
    role: z.string().min(1).max(128).optional().describe('Role you are playing (planner, executor, reviewer, etc.)'),
    focus: z.string().min(1).max(512).optional().describe('Short description of current focus'),
    briefId: z.string().min(1).max(128).optional().describe('Optional task brief id you are working on'),
    ttlSeconds: z.number().int().min(10).max(MAX_PRESENCE_TTL_SECONDS).optional().describe(`TTL in seconds before this entry is considered stale (default ${DEFAULT_PRESENCE_TTL_SECONDS}, max ${MAX_PRESENCE_TTL_SECONDS})`),
    workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
  },
  handler: async (args) => {
    if (!isPresenceEnabled()) return disabledResponse();
    try {
      const root = validateWorkingDirectory(args.workingDirectory);
      const entry = announcePresence({
        namespace: args.namespace,
        agent: args.agent,
        provider: args.provider,
        role: args.role,
        focus: args.focus,
        briefId: args.briefId,
        ttlSeconds: args.ttlSeconds,
      }, root);
      return { content: [{ type: 'text' as const, text: `Presence announced.\n\n${formatPresence(entry)}` }] };
    } catch (error) {
      return errorResponse(`Error announcing presence: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// ---------------------------------------------------------------------------
// agent_presence_list
// ---------------------------------------------------------------------------

export const agentPresenceListTool: ToolDefinition<{
  namespace: z.ZodString;
  includeStale: z.ZodOptional<z.ZodBoolean>;
  workingDirectory: z.ZodOptional<z.ZodString>;
}> = {
  name: 'agent_presence_list',
  description: 'List live agent presence in a channel. Stale entries are auto-evicted on read. Use to see who is currently working on the channel before deciding what to pick up.',
  schema: {
    namespace: z.string().min(1).max(128).describe('Channel/team to list'),
    includeStale: z.boolean().optional().describe('Include stale entries instead of evicting them (default false)'),
    workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
  },
  handler: async (args) => {
    if (!isPresenceEnabled()) return disabledResponse();
    try {
      const root = validateWorkingDirectory(args.workingDirectory);
      const entries = listPresence(args.namespace, { includeStale: args.includeStale }, root);
      if (entries.length === 0) {
        return { content: [{ type: 'text' as const, text: `No live presence in "${args.namespace}".` }] };
      }
      const body = entries.map(formatPresence).join('\n');
      return { content: [{ type: 'text' as const, text: `## Presence: ${args.namespace}\n\n${entries.length} ${entries.length === 1 ? 'agent' : 'agents'} present:\n\n${body}` }] };
    } catch (error) {
      return errorResponse(`Error listing presence: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// ---------------------------------------------------------------------------
// agent_presence_leave
// ---------------------------------------------------------------------------

export const agentPresenceLeaveTool: ToolDefinition<{
  namespace: z.ZodString;
  agent: z.ZodString;
  workingDirectory: z.ZodOptional<z.ZodString>;
}> = {
  name: 'agent_presence_leave',
  description: 'Explicitly leave a presence channel (vs. waiting for the TTL to expire). Use when your work is done.',
  schema: {
    namespace: z.string().min(1).max(128).describe('Channel/team to leave'),
    agent: z.string().min(1).max(128).describe('Your agent name'),
    workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
  },
  handler: async (args) => {
    if (!isPresenceEnabled()) return disabledResponse();
    try {
      const root = validateWorkingDirectory(args.workingDirectory);
      const removed = leavePresence(args.namespace, args.agent, root);
      if (!removed) {
        return { content: [{ type: 'text' as const, text: `Agent "${args.agent}" was not present in "${args.namespace}".` }] };
      }
      return { content: [{ type: 'text' as const, text: `Agent "${args.agent}" left "${args.namespace}".` }] };
    } catch (error) {
      return errorResponse(`Error leaving presence: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

// ---------------------------------------------------------------------------
// agent_presence_reap
// ---------------------------------------------------------------------------

export const agentPresenceReapTool: ToolDefinition<{
  workingDirectory: z.ZodOptional<z.ZodString>;
}> = {
  name: 'agent_presence_reap',
  description: 'Sweep stale presence entries across all channels. Reads already auto-evict stale entries — this is a manual maintenance pass.',
  schema: {
    workingDirectory: z.string().optional().describe('Working directory (defaults to cwd)'),
  },
  handler: async (args) => {
    if (!isPresenceEnabled()) return disabledResponse();
    try {
      const root = validateWorkingDirectory(args.workingDirectory);
      const result = reapStale(root);
      return { content: [{ type: 'text' as const, text: `Reaped ${result.removed} stale presence ${result.removed === 1 ? 'entry' : 'entries'}.` }] };
    } catch (error) {
      return errorResponse(`Error reaping presence: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

export const agentPresenceTools = [
  agentPresenceAnnounceTool,
  agentPresenceListTool,
  agentPresenceLeaveTool,
  agentPresenceReapTool,
];
