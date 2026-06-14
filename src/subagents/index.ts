/**
 * Full Subagents (100 specialized micro-agents implemented as first-class AgentConfig)
 *
 * These are "full" subagents: self-contained TypeScript modules with rich, detailed
 * embedded system prompts (no .md files). They follow the same AgentConfig shape
 * as the main agents in src/agents/ so they can be used by the main orchestrator,
 * team pipelines, or the subagent swarm.
 *
 * Created one by one / in small batches on feature/100-subagent-expansion.
 *
 * Usage:
 *   import { bundleSizeAnalyzerSubagent, ... } from './subagents';
 *
 * Each file contains:
 * - Detailed AgentPromptMetadata (triggers, useWhen, avoidWhen)
 * - A long, specialization-specific prompt string
 * - AgentConfig export
 */

export * from './bundle-size-analyzer.js';
export * from './memoization-expert.js';
export * from './critical-path-optimizer.js';
export * from './http-cache-strategist.js';
export * from './xss-sanitizer.js';
export * from './secret-scanner.js';
export * from './progress-tracker.js';
export * from './changelog-miner.js';
export * from './api-contract-extractor.js';
export * from './prisma-client-optimizer.js';
export * from './nextjs-server-action-expert.js';
export * from './react-query-cacher.js';
export * from './tailwind-class-architect.js';
export * from './zustand-persist-expert.js';
export * from './graphql-codegen-user.js';
export * from './jwt-refresh-token-flow.js';
export * from './stripe-webhook-verifier.js';
export * from './swarm-budget-manager.js';
export * from './docker-multi-stage-builder.js';

// ============================================================
// FULL LIST OF 100 SUBAGENTS (the complete set designed for this expansion)
// More .ts files will be added to this directory to reach exactly 100.
// ============================================================

export const FULL_SUBAGENT_NAMES = [
  'bundle-size-analyzer', 'memoization-expert', 'critical-path-optimizer', 'http-cache-strategist', 'state-diff-optimizer',
  'xss-sanitizer', 'sql-injection-preventer', 'authz-policy-enforcer', 'secret-scanner', 'dependency-vuln-checker',
  'progress-tracker', 'evidence-collector', 'handoff-validator', 'context-propagator', 'alert-escalator',
  'changelog-miner', 'api-contract-extractor', 'schema-inferer', 'benchmark-analyzer', 'migration-path-finder',
  'zod-schema-crafter', 'prisma-client-optimizer', 'nextjs-server-action-expert', 'react-query-cacher', 'tailwind-class-architect',
  'zustand-persist-expert', 'graphql-codegen-user', 'stripe-webhook-verifier', 'jwt-refresh-token-flow', 'rbac-permission-modeler',
  'i18n-key-manager', 'error-serializer', 'retry-policy-author', 'feature-toggle-router', 'animation-performance-tuner',
  'virtual-list-implementer', 'drag-drop-accessible', 'canvas-2d-optimizer', 'service-worker-cacher', 'form-validation-specialist',
  'swarm-budget-manager', 'subagent-spawner', 'task-prioritizer', 'failure-recovery-planner', 'evidence-trail-builder',
  'skill-extractor', 'registry-curator', 'swarm-visualizer', 'loop-detector', 'performance-reporter',
  'docker-multi-stage-builder', 'supabase-auth-helper', 'vercel-edge-function', 'k8s-deployment-tuner', 'terraform-module-author',
  'github-actions-reuser', 'playwright-e2e-author', 'sentry-error-reporter', 'analytics-event-designer', 'react-native-bridge-expert',
  // ... (remaining ~40 names follow the same pattern of narrow, different tasks across efficiency/verification/communication/research/coding-micro/meta/domain)
  // Full design list available in previous planning. Additional files added iteratively.
] as const;

console.log(`[subagents] ${FULL_SUBAGENT_NAMES.length} subagent names declared (full implementations added progressively).`);
