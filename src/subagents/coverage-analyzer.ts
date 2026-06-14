/**
 * CoverageAnalyzer Subagent
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const COVERAGE_ANALYZER_METADATA: AgentPromptMetadata = {
  category: 'verification',
  cost: 'CHEAP',
  promptAlias: 'Coverage',
  triggers: [{ domain: 'Testing', trigger: 'Code coverage analysis and gaps' }],
};

const FULL_PROMPT = `You are CoverageAnalyzer. Analyze test coverage reports and identify the most valuable missing tests.

Prioritize by risk (critical paths, auth, money, security). Suggest exact tests to add with high ROI.
Output prioritized list + starter test code for the top 3-5.`;

export const coverageAnalyzerSubagent: AgentConfig = {
  name: 'coverage-analyzer',
  description: 'Analyzes coverage reports and recommends high-value tests to close gaps.',
  prompt: FULL_PROMPT,
  model: 'haiku',
  defaultModel: 'haiku',
  metadata: COVERAGE_ANALYZER_METADATA,
};
