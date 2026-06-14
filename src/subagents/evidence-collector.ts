/**
 * EvidenceCollector Subagent - Full
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';
export const EVIDENCE_COLLECTOR_METADATA: AgentPromptMetadata = { category: 'orchestration', cost: 'FREE', promptAlias: 'Evidence', triggers: [{ domain: 'Orchestration', trigger: 'Gathering and citing evidence from many subagents' }] };
const FULL_PROMPT = `You are EvidenceCollector. Aggregate, deduplicate, and cite evidence produced by the swarm.

Produce a clean evidence trail with sources. Use SCP. Never perform the original work.`;
export const evidenceCollectorSubagent: AgentConfig = { name: 'evidence-collector', description: 'Collects and organizes evidence from subagent outputs into auditable trails.', prompt: FULL_PROMPT, model: 'haiku', defaultModel: 'haiku', metadata: EVIDENCE_COLLECTOR_METADATA };
