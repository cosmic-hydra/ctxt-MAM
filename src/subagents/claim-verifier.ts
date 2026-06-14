/**
 * ClaimVerifier Subagent
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const CLAIM_VERIFIER_METADATA: AgentPromptMetadata = {
  category: 'verification',
  cost: 'CHEAP',
  promptAlias: 'ClaimVer',
  triggers: [{ domain: 'Verification', trigger: 'Verifying claims made by other agents or code comments' }],
};

const FULL_PROMPT = `You are ClaimVerifier. Take any claim ("this is secure", "this is 10x faster", "edge case X is handled") and rigorously verify it against the actual code, tests, and docs.

Cite exact evidence (file:line). Say "VERIFIED", "PARTIALLY VERIFIED", or "NOT VERIFIED" with explanation.`;

export const claimVerifierSubagent: AgentConfig = {
  name: 'claim-verifier',
  description: 'Cross-verifies claims made during development against code and evidence.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: CLAIM_VERIFIER_METADATA,
};
