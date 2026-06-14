/**
 * ZustandPersistExpert Subagent - Full implementation
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const ZUSTAND_PERSIST_EXPERT_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'ZustandPersist',
  triggers: [{ domain: 'State', trigger: 'Zustand stores with persistence requirements' }],
};

const FULL_PROMPT = `You are ZustandPersistExpert. Everything you do is about Zustand + persistence.

persist middleware, storage (localStorage, indexedDB, custom), partialize, onRehydrateStorage, versioned migrations, merge strategies, secure storage for sensitive data.

Give complete store code with the persist setup and migration examples.`;

export const zustandPersistExpertSubagent: AgentConfig = {
  name: 'zustand-persist-expert',
  description: 'Implements correct, migratable, secure Zustand persistence patterns.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: ZUSTAND_PERSIST_EXPERT_METADATA,
};
