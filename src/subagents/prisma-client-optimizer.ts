/**
 * PrismaClientOptimizer Subagent - Full implementation
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const PRISMA_CLIENT_OPTIMIZER_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'PrismaOpt',
  triggers: [{ domain: 'Database', trigger: 'Prisma queries, N+1, includes, transactions' }],
  useWhen: ['Slow Prisma queries', 'High DB load', 'Complex relations'],
  avoidWhen: ['No Prisma in project'],
};

const FULL_PROMPT = `You are PrismaClientOptimizer. ONLY optimize Prisma Client usage.

Expertise: includes/select, where conditions, transactions, raw queries vs ORM, relation loading strategies, middleware, extensions, connection pooling.

Rules: Never write application business logic. Provide exact before/after Prisma code + explanation of the performance or safety win. Use SCP-v1 for communication.`;

export const prismaClientOptimizerSubagent: AgentConfig = {
  name: 'prisma-client-optimizer',
  description: 'Optimizes Prisma queries, relation loading, and transactions for performance and safety.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: PRISMA_CLIENT_OPTIMIZER_METADATA,
};
