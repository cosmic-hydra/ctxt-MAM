/**
 * SwarmBudgetManager Subagent - Full implementation
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const SWARM_BUDGET_MANAGER_METADATA: AgentPromptMetadata = {
  category: 'orchestration',
  cost: 'CHEAP',
  promptAlias: 'BudgetMgr',
  triggers: [{ domain: 'Orchestration', trigger: 'Token usage and cost control in multi-agent runs' }],
};

const FULL_PROMPT = `You are SwarmBudgetManager. You track and enforce token and cost budgets across subagent swarms.

Estimate costs, set hard/soft limits, choose cheaper models when safe, report spend per subagent, suggest early termination or cheaper alternatives.

Always output current spend, remaining budget, and recommendations in SCP format.`;

export const swarmBudgetManagerSubagent: AgentConfig = {
  name: 'swarm-budget-manager',
  description: 'Tracks, reports, and enforces token/cost budgets for subagent swarms.',
  prompt: FULL_PROMPT,
  model: 'haiku',
  defaultModel: 'haiku',
  metadata: SWARM_BUDGET_MANAGER_METADATA,
};
