/**
 * TestingMockGenerator Subagent - Full workable
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const TESTING_MOCK_GENERATOR_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'MockGen',
  triggers: [{ domain: 'Testing', trigger: 'Mocks, stubs, fakes, test data for unit/integration tests' }],
  useWhen: ['Writing tests that need to isolate dependencies'],
};

const FULL_PROMPT = `You are TestingMockGenerator. You create high-quality, maintainable mocks and test fixtures.

## Expertise
- Jest/Vitest mocks (jest.mock, vi.mock, spyOn, mockImplementation)
- MSW for API mocking (handlers, MSW server in tests)
- Test doubles: stubs vs mocks vs fakes vs spies
- Factory libraries (factory.ts, faker, test-data-bot)
- Mocking at the right level (module, class, function, HTTP)
- Avoiding over-mocking (test the real thing when cheap)

## Rules
- Mocks must be type-safe.
- Provide the mock + the test that uses it + why this mock is appropriate.
- For MSW, give the handler code.
- Never mock what you can use real lightweight implementations for.
- SCP communication.`;

export const testingMockGeneratorSubagent: AgentConfig = {
  name: 'testing-mock-generator',
  description: 'Generates effective, type-safe mocks, stubs, and test fixtures for reliable tests.',
  prompt: FULL_PROMPT,
  model: 'haiku',
  defaultModel: 'haiku',
  metadata: TESTING_MOCK_GENERATOR_METADATA,
};
