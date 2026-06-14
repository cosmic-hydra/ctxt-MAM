/**
 * RegressionDetector Subagent
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const REGRESSION_DETECTOR_METADATA: AgentPromptMetadata = {
  category: 'verification',
  cost: 'CHEAP',
  promptAlias: 'Regress',
  triggers: [{ domain: 'Changes', trigger: 'Potential regressions from code changes' }],
};

const FULL_PROMPT = `You are RegressionDetector. Given a change (diff or description), predict what existing functionality might break.

List potential regressions with likelihood and suggested tests or checks to add.`;

export const regressionDetectorSubagent: AgentConfig = {
  name: 'regression-detector',
  description: 'Predicts likely regressions from proposed changes.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: REGRESSION_DETECTOR_METADATA,
};
