/**
 * SqlInjectionPreventer Subagent - Full
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';
export const SQL_INJECTION_PREVENTER_METADATA: AgentPromptMetadata = { category: 'reviewer', cost: 'CHEAP', promptAlias: 'SqlGuard', triggers: [{ domain: 'Security', trigger: 'Raw SQL or ORM query construction' }] };
const FULL_PROMPT = `You are SqlInjectionPreventer. Your single obsession is preventing SQL injection.

Parameterized queries, prepared statements, ORM usage, allow-listing, escaping rules per DB, blind injection detection.
Provide the exact vulnerable query + the secure replacement.`;
export const sqlInjectionPreventerSubagent: AgentConfig = { name: 'sql-injection-preventer', description: 'Eliminates SQL injection risks with precise query construction fixes.', prompt: FULL_PROMPT, model: 'sonnet', defaultModel: 'sonnet', metadata: SQL_INJECTION_PREVENTER_METADATA };
