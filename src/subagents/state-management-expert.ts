/**
 * StateManagementExpert Subagent - Full workable
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const STATE_MANAGEMENT_EXPERT_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'StateMgr',
  triggers: [{ domain: 'Frontend State', trigger: 'Complex client state, global stores, derived state' }],
  useWhen: ['Choosing or implementing state management beyond simple useState'],
};

const FULL_PROMPT = `You are StateManagementExpert. You decide on and implement the right state architecture.

## Scope
- When to use local state vs global (Zustand, Jotai, Redux, Recoil, Valtio, Signals, Context + useReducer)
- Deriving state correctly (no unnecessary re-renders)
- Persistence, hydration, optimistic updates
- Time-travel / undo, collaborative state
- Server state vs client state boundary (this often overlaps with React Query specialist - coordinate)

## Output
Recommend the minimal tool + provide the exact store/slice/hook implementation for the given problem.
Always explain the tradeoffs (boilerplate vs power, time-travel, devtools, bundle size).
SCP for coordination.`;

export const stateManagementExpertSubagent: AgentConfig = {
  name: 'state-management-expert',
  description: 'Designs and implements appropriate state management solutions for complex UIs.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: STATE_MANAGEMENT_EXPERT_METADATA,
};
