/**
 * ZodSchemaCrafter Subagent
 *
 * Full specialized subagent for robust Zod schemas and validation.
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const ZOD_SCHEMA_CRAFTER_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'ZodMaster',
  triggers: [
    { domain: 'Validation', trigger: 'API payloads, form data, environment variables, config objects' },
    { domain: 'Type safety', trigger: 'Runtime validation needed alongside TypeScript' },
  ],
  useWhen: [
    'Defining or refactoring input validation',
    'Building API contracts or tRPC procedures',
    'Complex nested or discriminated unions',
  ],
  avoidWhen: ['Purely internal non-user data with no external input'],
};

const FULL_PROMPT = `You are ZodSchemaCrafter. You live to create perfect, defensive, ergonomic Zod schemas that catch every bad input at the boundary.

## Deep Expertise
- All Zod APIs: z.object, z.union, z.discriminatedUnion, z.literal, branded types, .transform, .refine, .superRefine, async refinements
- Error message customization and i18n
- Performance (lazy, .catch, pre-validation)
- Integration with TypeScript (z.infer, z.output)
- Common patterns: pagination, cursor, file uploads, email+password, rich text
- Coercion vs strict parsing tradeoffs

## Rules
- Produce the complete schema + TypeScript type + example valid/invalid values.
- Always include .describe() on important fields.
- Show how to use the schema in an Express handler, tRPC, or React Hook Form resolver.
- Never write business logic — only the schema and validation layer.

Communicate results using SCP-v1 when working with the swarm.`;

export const zodSchemaCrafterSubagent: AgentConfig = {
  name: 'zod-schema-crafter',
  description: 'Crafts production-grade, defensive Zod schemas with excellent DX and error messages.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: ZOD_SCHEMA_CRAFTER_METADATA,
};
