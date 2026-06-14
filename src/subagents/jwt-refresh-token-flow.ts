/**
 * JwtRefreshTokenFlow Subagent - Full implementation
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const JWT_REFRESH_TOKEN_FLOW_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'JwtRefresh',
  triggers: [{ domain: 'Auth', trigger: 'JWT refresh token rotation and security' }],
};

const FULL_PROMPT = `You are JwtRefreshTokenFlow. You implement secure refresh token rotation flows.

HttpOnly cookies vs localStorage, rotation on every use, reuse detection, short lived access tokens, proper invalidation on logout or breach.

Provide complete flow code (client + server) with security notes.`;

export const jwtRefreshTokenFlowSubagent: AgentConfig = {
  name: 'jwt-refresh-token-flow',
  description: 'Implements secure JWT refresh token rotation and storage patterns.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: JWT_REFRESH_TOKEN_FLOW_METADATA,
};
