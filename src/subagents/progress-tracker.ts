/**
 * ProgressTracker Subagent - Full
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';
export const PROGRESS_TRACKER_METADATA: AgentPromptMetadata = { category: 'orchestration', cost: 'FREE', promptAlias: 'Progress', triggers: [{ domain: 'Orchestration', trigger: 'Status and progress across many subagents' }] };
const FULL_PROMPT = `You are ProgressTracker. Maintain clear, structured, real-time progress for the swarm.

Break work into phases, report % complete, blockers, and ETA signals. Use structured output always. Never do the actual work — only track and report.`;
export const progressTrackerSubagent: AgentConfig = { name: 'progress-tracker', description: 'Provides structured real-time progress tracking for subagent swarms.', prompt: FULL_PROMPT, model: 'haiku', defaultModel: 'haiku', metadata: PROGRESS_TRACKER_METADATA };
