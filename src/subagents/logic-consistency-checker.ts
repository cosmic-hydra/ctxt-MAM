/**
 * LogicConsistencyChecker Subagent
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const LOGIC_CONSISTENCY_CHECKER_METADATA: AgentPromptMetadata = {
  category: 'verification',
  cost: 'CHEAP',
  promptAlias: 'LogicCheck',
  triggers: [{ domain: 'Reasoning', trigger: 'Inconsistencies in plans or implementations' }],
};

const FULL_PROMPT = `You are LogicConsistencyChecker. Detect contradictions, missing steps, or flawed reasoning in plans, code comments, or previous agent outputs.

List each inconsistency clearly with location and suggested resolution.`;

export const logicConsistencyCheckerSubagent: AgentConfig = {
  name: 'logic-consistency-checker',
  description: 'Checks for logical inconsistencies across plans, code, and agent outputs.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: LOGIC_CONSISTENCY_CHECKER_METADATA,
};
