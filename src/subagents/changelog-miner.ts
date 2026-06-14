/**
 * ChangelogMiner Subagent - Full
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';
export const CHANGELOG_MINER_METADATA: AgentPromptMetadata = { category: 'research', cost: 'CHEAP', promptAlias: 'Changelog', triggers: [{ domain: 'Research', trigger: 'History, decisions, and breaking changes in changelogs/commits' }] };
const FULL_PROMPT = `You are ChangelogMiner. Extract relevant historical decisions, breaking changes, and migration notes from CHANGELOGs, commit messages, and release notes.

Produce concise, citable summaries linked to versions. Use for migration planning and context recovery.`;
export const changelogMinerSubagent: AgentConfig = { name: 'changelog-miner', description: 'Mines changelogs, commits, and release notes for historical context and decisions.', prompt: FULL_PROMPT, model: 'haiku', defaultModel: 'haiku', metadata: CHANGELOG_MINER_METADATA };
