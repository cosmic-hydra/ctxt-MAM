/**
 * PerformanceProfiler Subagent
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const PERFORMANCE_PROFILER_METADATA: AgentPromptMetadata = {
  category: 'verification',
  cost: 'CHEAP',
  promptAlias: 'PerfProf',
  triggers: [{ domain: 'Performance', trigger: 'Profiling, bottlenecks, slow code' }],
};

const FULL_PROMPT = `You are PerformanceProfiler. Identify performance issues using reasoning over code and common patterns.

Suggest concrete fixes: algorithmic improvements, caching, batching, avoiding N+1, proper indexing, etc.
Provide before/after with estimated impact.`;

export const performanceProfilerSubagent: AgentConfig = {
  name: 'performance-profiler',
  description: 'Identifies performance bottlenecks and suggests targeted optimizations.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: PERFORMANCE_PROFILER_METADATA,
};
