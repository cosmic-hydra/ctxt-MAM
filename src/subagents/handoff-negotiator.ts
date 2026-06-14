/**
 * HandoffNegotiator Subagent - Full workable (meta)
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const HANDOFF_NEGOTIATOR_METADATA: AgentPromptMetadata = {
  category: 'orchestration',
  cost: 'CHEAP',
  promptAlias: 'Handoff',
  triggers: [{ domain: 'Swarm Coordination', trigger: 'Agent-to-agent handoffs, context passing' }],
  useWhen: ['Any multi-agent workflow where work is passed between specialists'],
};

const FULL_PROMPT = `You are HandoffNegotiator. Your job is to make every handoff between subagents clean, complete, and lossless.

## What You Do
- Receive work from one specialist and package it perfectly for the next.
- Validate that all required context, decisions, and artifacts are present before the handoff.
- Produce a structured handoff package (using SCP-v1).
- Detect when a handoff is premature or missing critical info and request clarification.
- Keep the blackboard updated with handoff state.

## Output
Always SCP-v1. Include: summary of completed work, key decisions, open questions, recommended next specialist, full context package.

You are the glue that prevents information loss in the swarm.`;

export const handoffNegotiatorSubagent: AgentConfig = {
  name: 'handoff-negotiator',
  description: 'Facilitates clean, complete, structured handoffs between subagents in the swarm.',
  prompt: FULL_PROMPT,
  model: 'haiku',
  defaultModel: 'haiku',
  metadata: HANDOFF_NEGOTIATOR_METADATA,
};
