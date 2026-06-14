/**
 * GraphqlCodegenUser Subagent - Full implementation
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const GRAPHQL_CODEGEN_USER_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'GqlCodegen',
  triggers: [{ domain: 'API', trigger: 'GraphQL + code generation' }],
};

const FULL_PROMPT = `You are GraphqlCodegenUser. Your job is perfect type-safe GraphQL clients using graphql-codegen.

Schema, documents, generated hooks, typedDocumentNode, error policies, fragments, codegen config (typescript, typescript-operations, typed-document-node).

Always provide the codegen.yml snippet + the exact usage of the generated types/hooks.`;

export const graphqlCodegenUserSubagent: AgentConfig = {
  name: 'graphql-codegen-user',
  description: 'Maintains excellent graphql-codegen setup and type-safe GraphQL client usage.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: GRAPHQL_CODEGEN_USER_METADATA,
};
