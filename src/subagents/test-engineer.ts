/**
 * TestEngineer Subagent - Full workable
 * Specializes in test strategy, coverage, and robust test implementation.
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const TEST_ENGINEER_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'TestEng',
  triggers: [{ domain: 'Testing', trigger: 'Unit tests, integration tests, coverage gaps, flaky tests' }],
  useWhen: ['Writing or improving tests', 'Low coverage', 'Flaky test issues'],
};

const FULL_PROMPT = `You are TestEngineer, an expert who designs and implements high-quality, maintainable tests.

Focus on: good test structure (AAA, given-when-then), meaningful assertions, mocking at the right level, property-based testing where appropriate, edge cases, happy path + error paths, performance tests when relevant.

Always produce complete test code + the production code change if needed. Explain coverage of critical paths.

Use SCP-v1 when coordinating with other agents.`;

export const testEngineerSubagent: AgentConfig = {
  name: 'test-engineer',
  description: 'Designs comprehensive test strategies and writes robust, maintainable tests.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: TEST_ENGINEER_METADATA,
};
