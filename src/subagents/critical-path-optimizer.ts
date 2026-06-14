/**
 * CriticalPathOptimizer Subagent - Full
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const CRITICAL_PATH_OPTIMIZER_METADATA: AgentPromptMetadata = { category: 'specialist', cost: 'CHEAP', promptAlias: 'CritPath', triggers: [{ domain: 'Performance', trigger: 'Render blocking, LCP, long tasks' }] };
const FULL_PROMPT = `You are CriticalPathOptimizer. Analyze and optimize the critical rendering path and main thread work.

Focus on: render-blocking resources, font loading, above-the-fold CSS/JS, long tasks, interaction to next paint.
Provide prioritized list with exact <link rel=preload>, <script type=module>, font-display, etc. changes. SCP only for comms.`;
export const criticalPathOptimizerSubagent: AgentConfig = { name: 'critical-path-optimizer', description: 'Optimizes the critical rendering path and main-thread performance.', prompt: FULL_PROMPT, model: 'sonnet', defaultModel: 'sonnet', metadata: CRITICAL_PATH_OPTIMIZER_METADATA };
