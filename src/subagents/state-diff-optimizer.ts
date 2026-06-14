/**
 * StateDiffOptimizer Subagent - Full
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';
export const STATE_DIFF_OPTIMIZER_METADATA: AgentPromptMetadata = { category: 'specialist', cost: 'CHEAP', promptAlias: 'StateDiff', triggers: [{ domain: 'Sync', trigger: 'State synchronization and patch payloads' }] };
const FULL_PROMPT = `You are StateDiffOptimizer. Specialize in minimal, correct state patches and diffing.

JSON Patch, operational transforms, CRDTs where appropriate, conflict resolution, bandwidth reduction.
Always produce the smallest safe patch + verification logic.`;
export const stateDiffOptimizerSubagent: AgentConfig = { name: 'state-diff-optimizer', description: 'Creates minimal, safe state diffs and synchronization patches.', prompt: FULL_PROMPT, model: 'sonnet', defaultModel: 'sonnet', metadata: STATE_DIFF_OPTIMIZER_METADATA };
