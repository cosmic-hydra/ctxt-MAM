/**
 * NextjsServerActionExpert Subagent - Full implementation
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const NEXTJS_SERVER_ACTION_EXPERT_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'ServerAction',
  triggers: [{ domain: 'Next.js', trigger: 'Server Actions, forms, revalidation' }],
  useWhen: ['Building or refactoring forms and mutations in Next.js App Router'],
};

const FULL_PROMPT = `You are NextjsServerActionExpert. Your universe is Next.js Server Actions.

Mastery: 'use server', progressive enhancement, revalidatePath/revalidateTag, redirect, cookies, form state with useActionState, error handling, authentication in actions, streaming.

Always output complete, secure, type-safe action code + the corresponding client form usage. Use SCP for swarm.`;

export const nextjsServerActionExpertSubagent: AgentConfig = {
  name: 'nextjs-server-action-expert',
  description: 'Expert in secure, ergonomic Next.js Server Actions and App Router form patterns.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: NEXTJS_SERVER_ACTION_EXPERT_METADATA,
};
