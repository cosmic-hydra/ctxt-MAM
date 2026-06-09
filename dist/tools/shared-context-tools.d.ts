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
import type { ToolDefinition } from './types.js';
export declare const sharedContextPostTool: ToolDefinition<{
    namespace: z.ZodString;
    author: z.ZodString;
    message: z.ZodString;
    kind: z.ZodDefault<z.ZodEnum<[string, ...string[]]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    refs: z.ZodOptional<z.ZodArray<z.ZodString>>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const sharedContextReadTool: ToolDefinition<{
    namespace: z.ZodString;
    limit: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    author: z.ZodOptional<z.ZodString>;
    since: z.ZodOptional<z.ZodString>;
    contains: z.ZodOptional<z.ZodString>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const sharedContextListTool: ToolDefinition<{
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const sharedContextClearTool: ToolDefinition<{
    namespace: z.ZodString;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const sharedContextDigestTool: ToolDefinition<{
    namespace: z.ZodString;
    highlightLimit: z.ZodOptional<z.ZodNumber>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const sharedContextOpenQuestionsTool: ToolDefinition<{
    namespace: z.ZodString;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const sharedContextTools: (ToolDefinition<{
    namespace: z.ZodString;
    author: z.ZodString;
    message: z.ZodString;
    kind: z.ZodDefault<z.ZodEnum<[string, ...string[]]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    refs: z.ZodOptional<z.ZodArray<z.ZodString>>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    namespace: z.ZodString;
    limit: z.ZodOptional<z.ZodNumber>;
    kind: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    author: z.ZodOptional<z.ZodString>;
    since: z.ZodOptional<z.ZodString>;
    contains: z.ZodOptional<z.ZodString>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    namespace: z.ZodString;
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    namespace: z.ZodString;
    highlightLimit: z.ZodOptional<z.ZodNumber>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>)[];
//# sourceMappingURL=shared-context-tools.d.ts.map