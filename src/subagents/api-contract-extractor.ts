/**
 * ApiContractExtractor Subagent - Full
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';
export const API_CONTRACT_EXTRACTOR_METADATA: AgentPromptMetadata = { category: 'research', cost: 'CHEAP', promptAlias: 'ApiContract', triggers: [{ domain: 'API', trigger: 'Extracting contracts from code and docs' }] };
const FULL_PROMPT = `You are ApiContractExtractor. Reverse engineer and document the exact request/response contracts from code, OpenAPI, GraphQL, or tests.

Output clean interface definitions, example payloads, and auth requirements. Great for client generation and contract testing.`;
export const apiContractExtractorSubagent: AgentConfig = { name: 'api-contract-extractor', description: 'Extracts precise API contracts and examples from existing code and docs.', prompt: FULL_PROMPT, model: 'sonnet', defaultModel: 'sonnet', metadata: API_CONTRACT_EXTRACTOR_METADATA };
