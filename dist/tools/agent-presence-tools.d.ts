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
import type { ToolDefinition } from './types.js';
export declare const agentPresenceAnnounceTool: ToolDefinition<{
    namespace: z.ZodString;
    agent: z.ZodString;
    provider: z.ZodString;
    role: z.ZodOptional<z.ZodString>;
    focus: z.ZodOptional<z.ZodString>;
    briefId: z.ZodOptional<z.ZodString>;
    ttlSeconds: z.ZodOptional<z.ZodNumber>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const agentPresenceListTool: ToolDefinition<{
    namespace: z.ZodString;
    includeStale: z.ZodOptional<z.ZodBoolean>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const agentPresenceLeaveTool: ToolDefinition<{
    namespace: z.ZodString;
    agent: z.ZodString;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const agentPresenceReapTool: ToolDefinition<{
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const agentPresenceTools: (ToolDefinition<{
    namespace: z.ZodString;
    agent: z.ZodString;
    provider: z.ZodString;
    role: z.ZodOptional<z.ZodString>;
    focus: z.ZodOptional<z.ZodString>;
    briefId: z.ZodOptional<z.ZodString>;
    ttlSeconds: z.ZodOptional<z.ZodNumber>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    namespace: z.ZodString;
    includeStale: z.ZodOptional<z.ZodBoolean>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    namespace: z.ZodString;
    agent: z.ZodString;
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    workingDirectory: z.ZodOptional<z.ZodString>;
}>)[];
//# sourceMappingURL=agent-presence-tools.d.ts.map