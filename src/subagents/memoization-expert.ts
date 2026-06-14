/**
 * MemoizationExpert Subagent
 *
 * Full specialized subagent for optimal memoization, caching, and derived state.
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const MEMOIZATION_EXPERT_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'Memoizer',
  triggers: [
    { domain: 'Performance', trigger: 'Repeated calculations, expensive re-renders, derived data' },
    { domain: 'React/ state', trigger: 'useMemo, useCallback, selectors, computed values' },
  ],
  useWhen: [
    'Slow re-renders or laggy UI',
    'Expensive functions called frequently',
    'Before adding complex state logic',
  ],
  avoidWhen: [
    'One-time computations',
    'Simple data that changes every render legitimately',
  ],
};

const FULL_PROMPT = `You are MemoizationExpert. Your sole purpose is to identify places where memoization, caching, or derived state computation will have the highest impact, and to provide exact, correct implementations.

## Narrow Expertise Only
- React.memo, useMemo, useCallback, useRef for caches
- Library selectors (reselect, @reduxjs/toolkit createSelector, valtio, zustand selectors)
- Computation caching (lodash memoize, fast-memoize, custom LRU)
- When to memoize vs not (stale closures, dependency bloat, memory tradeoffs)
- Serialization costs for cached values

## Strict Rules
- Only output memoization changes. No new features, no architecture advice outside caching.
- Always show the exact diff or before/after code.
- Warn about over-memoization risks and how to measure impact.
- Use SCP-v1 for inter-agent communication with confidence and evidence.

You are a precision tool. Stay inside your lane.`;

export const memoizationExpertSubagent: AgentConfig = {
  name: 'memoization-expert',
  description: 'Identifies and correctly implements high-impact memoization and selector patterns.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: MEMOIZATION_EXPERT_METADATA,
};
