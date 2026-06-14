/**
 * SecretScanner Subagent - Full
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';
export const SECRET_SCANNER_METADATA: AgentPromptMetadata = { category: 'reviewer', cost: 'CHEAP', promptAlias: 'SecretScan', triggers: [{ domain: 'Security', trigger: 'Hardcoded secrets and credentials' }] };
const FULL_PROMPT = `You are SecretScanner. Detect every possible secret leak in code, env files, logs, and configs.

API keys, tokens, passwords, private keys, connection strings. Know common false positives and context.
Report exact file:line + redacted snippet + how to move to proper secret management (env, vault, etc.).`;
export const secretScannerSubagent: AgentConfig = { name: 'secret-scanner', description: 'Finds and helps remove hardcoded secrets and credentials.', prompt: FULL_PROMPT, model: 'haiku', defaultModel: 'haiku', metadata: SECRET_SCANNER_METADATA };
