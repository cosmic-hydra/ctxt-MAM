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
import type { ToolDefinition } from './types.js';
export declare const taskBriefCreateTool: ToolDefinition<{
    briefId: z.ZodString;
    namespace: z.ZodString;
    title: z.ZodString;
    goal: z.ZodString;
    createdBy: z.ZodString;
    successCriteria: z.ZodOptional<z.ZodArray<z.ZodString>>;
    constraints: z.ZodOptional<z.ZodArray<z.ZodString>>;
    owners: z.ZodOptional<z.ZodArray<z.ZodString>>;
    relatedKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
    relatedEntries: z.ZodOptional<z.ZodArray<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const taskBriefGetTool: ToolDefinition<{
    briefId: z.ZodString;
    namespace: z.ZodString;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const taskBriefUpdateStatusTool: ToolDefinition<{
    briefId: z.ZodString;
    namespace: z.ZodString;
    status: z.ZodEnum<[string, ...string[]]>;
    by: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const taskBriefAmendTool: ToolDefinition<{
    briefId: z.ZodString;
    namespace: z.ZodString;
    by: z.ZodString;
    addSuccessCriteria: z.ZodOptional<z.ZodArray<z.ZodString>>;
    addConstraints: z.ZodOptional<z.ZodArray<z.ZodString>>;
    addOwners: z.ZodOptional<z.ZodArray<z.ZodString>>;
    removeOwners: z.ZodOptional<z.ZodArray<z.ZodString>>;
    addRelatedKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
    addRelatedEntries: z.ZodOptional<z.ZodArray<z.ZodString>>;
    addTags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const taskBriefListTool: ToolDefinition<{
    namespace: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    owner: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const taskBriefDeleteTool: ToolDefinition<{
    briefId: z.ZodString;
    namespace: z.ZodString;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>;
export declare const taskBriefTools: (ToolDefinition<{
    briefId: z.ZodString;
    namespace: z.ZodString;
    title: z.ZodString;
    goal: z.ZodString;
    createdBy: z.ZodString;
    successCriteria: z.ZodOptional<z.ZodArray<z.ZodString>>;
    constraints: z.ZodOptional<z.ZodArray<z.ZodString>>;
    owners: z.ZodOptional<z.ZodArray<z.ZodString>>;
    relatedKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
    relatedEntries: z.ZodOptional<z.ZodArray<z.ZodString>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    briefId: z.ZodString;
    namespace: z.ZodString;
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    briefId: z.ZodString;
    namespace: z.ZodString;
    status: z.ZodEnum<[string, ...string[]]>;
    by: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    briefId: z.ZodString;
    namespace: z.ZodString;
    by: z.ZodString;
    addSuccessCriteria: z.ZodOptional<z.ZodArray<z.ZodString>>;
    addConstraints: z.ZodOptional<z.ZodArray<z.ZodString>>;
    addOwners: z.ZodOptional<z.ZodArray<z.ZodString>>;
    removeOwners: z.ZodOptional<z.ZodArray<z.ZodString>>;
    addRelatedKeys: z.ZodOptional<z.ZodArray<z.ZodString>>;
    addRelatedEntries: z.ZodOptional<z.ZodArray<z.ZodString>>;
    addTags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}> | ToolDefinition<{
    namespace: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    owner: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    workingDirectory: z.ZodOptional<z.ZodString>;
}>)[];
//# sourceMappingURL=task-brief-tools.d.ts.map