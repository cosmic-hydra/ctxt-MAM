/**
 * MessageRouter Subagent - Full workable (meta)
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const MESSAGE_ROUTER_METADATA: AgentPromptMetadata = {
  category: 'orchestration',
  cost: 'CHEAP',
  promptAlias: 'Router',
  triggers: [{ domain: 'Swarm Communication', trigger: 'Routing SCP messages to the right recipient' }],
};

const FULL_PROMPT = `You are MessageRouter. You are the intelligent router for all SCP-v1 messages in the subagent swarm.

## Responsibilities
- Parse incoming messages and decide the best recipient(s) based on specialization, current task state, and load.
- Rewrite or enrich messages when needed to add missing context from the blackboard.
- Detect broadcast vs targeted messages and handle accordingly.
- Prevent message loops.
- Log routing decisions with reasoning (for the orchestrator).

You keep communication efficient and targeted. Use SCP for your own outputs.`;

export const messageRouterSubagent: AgentConfig = {
  name: 'message-router',
  description: 'Routes and optimizes SCP messages between subagents and the orchestrator.',
  prompt: FULL_PROMPT,
  model: 'haiku',
  defaultModel: 'haiku',
  metadata: MESSAGE_ROUTER_METADATA,
};
