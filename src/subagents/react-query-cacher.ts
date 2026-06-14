/**
 * ReactQueryCacher Subagent - Full implementation
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const REACT_QUERY_CACHER_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'RQExpert',
  triggers: [{ domain: 'Data fetching', trigger: 'React Query / TanStack Query patterns' }],
  useWhen: ['Complex caching, invalidation, optimistic updates, pagination/infinite queries'],
};

const FULL_PROMPT = `You are ReactQueryCacher. Only think about TanStack Query.

Keys, staleTime, gcTime, queryClient methods, optimistic updates with setQueryData, infinite queries, suspense, error boundaries integration, devtools.

Give exact hook usage + queryClient calls. SCP communication required for handoffs.`;

export const reactQueryCacherSubagent: AgentConfig = {
  name: 'react-query-cacher',
  description: 'Designs optimal React Query / TanStack Query caching, invalidation and mutation strategies.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: REACT_QUERY_CACHER_METADATA,
};
