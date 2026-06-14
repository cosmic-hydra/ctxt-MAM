/**
 * Agent Definitions for Oh-My-ClaudeCode
 *
 * This module provides:
 * 1. Re-exports of base agents from individual files
 * 2. Tiered agent variants with dynamically loaded prompts from /agents/*.md
 * 3. getAgentDefinitions() for agent registry
 * 4. omcSystemPrompt for the main orchestrator
 *
 * NOTE: Full workable subagents from the 100+ expansion are now integrated as first-class
 * narrow specialists. They are defined in src/subagents/*.ts with rich embedded prompts
 * (no separate .md files) and are usable for delegation.
 */

import type { AgentConfig, PluginConfig } from '../shared/types.js';
import { loadAgentPrompt, parseDisallowedTools } from './utils.js';
import { loadConfig } from '../config/loader.js';
import { resolveInheritedModelFromEnv } from '../config/models.js';
import { appendSkininthegamebrosGuidance } from './skininthegamebros-guidance.js';

// Re-export base agents from individual files (rebranded names)
export { architectAgent } from './architect.js';
export { designerAgent } from './designer.js';
export { writerAgent } from './writer.js';
export { criticAgent } from './critic.js';
export { analystAgent } from './analyst.js';
export { executorAgent } from './executor.js';
export { plannerAgent } from './planner.js';
export { qaTesterAgent } from './qa-tester.js';
export { scientistAgent } from './scientist.js';
export { exploreAgent } from './explore.js';
export { tracerAgent } from './tracer.js';

export { documentSpecialistAgent } from './document-specialist.js';

// Import base agents for use in getAgentDefinitions
import { architectAgent } from './architect.js';
import { designerAgent } from './designer.js';
import { writerAgent } from './writer.js';
import { criticAgent } from './critic.js';
import { analystAgent } from './analyst.js';
import { executorAgent } from './executor.js';
import { plannerAgent } from './planner.js';
import { qaTesterAgent } from './qa-tester.js';
import { scientistAgent } from './scientist.js';
import { exploreAgent } from './explore.js';
import { tracerAgent } from './tracer.js';
import { documentSpecialistAgent } from './document-specialist.js';

// Import full workable subagents (the 100+ expansion - actual usable agents)
import {
  bundleSizeAnalyzerSubagent,
  memoizationExpertSubagent,
  criticalPathOptimizerSubagent,
  httpCacheStrategistSubagent,
  stateDiffOptimizerSubagent,
  xssSanitizerSubagent,
  secretScannerSubagent,
  sqlInjectionPreventerSubagent,
  progressTrackerSubagent,
  evidenceCollectorSubagent,
  changelogMinerSubagent,
  apiContractExtractorSubagent,
  prismaClientOptimizerSubagent,
  nextjsServerActionExpertSubagent,
  reactQueryCacherSubagent,
  tailwindClassArchitectSubagent,
  zustandPersistExpertSubagent,
  graphqlCodegenUserSubagent,
  jwtRefreshTokenFlowSubagent,
  stripeWebhookVerifierSubagent,
  swarmBudgetManagerSubagent,
  dockerMultiStageBuilderSubagent,
  reactHookExpertSubagent,
  asyncAwaitSpecialistSubagent,
  databaseQueryOptimizerSubagent,
  authFlowImplementerSubagent,
  stateManagementExpertSubagent,
  testingMockGeneratorSubagent,
  handoffNegotiatorSubagent,
  messageRouterSubagent,
  testEngineerSubagent,
  coverageAnalyzerSubagent,
  performanceProfilerSubagent,
  claimVerifierSubagent,
  logicConsistencyCheckerSubagent,
  regressionDetectorSubagent,
} from '../subagents/index.js';

// Re-export loadAgentPrompt (also exported from index.ts)
export { loadAgentPrompt };

// ============================================================
// REFORMED AGENTS (BUILD/ANALYSIS LANE)
// ============================================================

/**
 * Debugger Agent - Root-Cause Analysis & Debugging (Sonnet)
 */
export const debuggerAgent: AgentConfig = {
  name: 'debugger',
  description: 'Root-cause analysis, regression isolation, failure diagnosis (Sonnet).',
  prompt: loadAgentPrompt('debugger'),
  model: 'sonnet',
  defaultModel: 'sonnet'
};

/**
 * Verifier Agent - Completion Evidence & Test Validation (Sonnet)
 */
export const verifierAgent: AgentConfig = {
  name: 'verifier',
  description: 'Completion evidence, claim validation, test adequacy (Sonnet).',
  prompt: loadAgentPrompt('verifier'),
  model: 'sonnet',
  defaultModel: 'sonnet'
};

// ============================================================
// REFORMED AGENTS (REVIEW LANE)
// ============================================================

// ============================================================
// REFORMED AGENTS (DOMAIN SPECIALISTS)
// ============================================================

/**
 * Test-Engineer Agent - Test Strategy & Coverage (Sonnet)
 * Replaces: tdd-guide agent
 */
export const testEngineerAgent: AgentConfig = {
  name: 'test-engineer',
  description: 'Test strategy, coverage, flaky test hardening (Sonnet).',
  prompt: loadAgentPrompt('test-engineer'),
  model: 'sonnet',
  defaultModel: 'sonnet'
};

// ============================================================
// SPECIALIZED AGENTS (Security, Build, TDD, Code Review)
// ============================================================

/**
 * Security-Reviewer Agent - Security Vulnerability Detection (Sonnet)
 */
export const securityReviewerAgent: AgentConfig = {
  name: 'security-reviewer',
  description: 'Security vulnerability detection specialist (Sonnet). Use for security audits and OWASP detection.',
  prompt: loadAgentPrompt('security-reviewer'),
  model: 'sonnet',
  defaultModel: 'sonnet'
};

/**
 * Code-Reviewer Agent - Expert Code Review (Opus)
 */
export const codeReviewerAgent: AgentConfig = {
  name: 'code-reviewer',
  description: 'Expert code review specialist (Opus). Use for comprehensive code quality review.',
  prompt: loadAgentPrompt('code-reviewer'),
  model: 'opus',
  defaultModel: 'opus'
};


/**
 * Git-Master Agent - Git Operations Expert (Sonnet)
 */
export const gitMasterAgent: AgentConfig = {
  name: 'git-master',
  description: 'Git expert for atomic commits, rebasing, and history management with style detection',
  prompt: loadAgentPrompt('git-master'),
  model: 'sonnet',
  defaultModel: 'sonnet'
};

/**
 * Code-Simplifier Agent - Code Simplification & Refactoring (Opus)
 */
export const codeSimplifierAgent: AgentConfig = {
  name: 'code-simplifier',
  description: 'Simplifies and refines code for clarity, consistency, and maintainability (Opus).',
  prompt: loadAgentPrompt('code-simplifier'),
  model: 'opus',
  defaultModel: 'opus'
};

// ============================================================
// DEPRECATED ALIASES (Backward Compatibility)
// ============================================================

/**
 * @deprecated Use test-engineer agent instead
 */
export const tddGuideAgentAlias = testEngineerAgent;

const AGENT_CONFIG_KEY_MAP = {
  explore: 'explore',
  analyst: 'analyst',
  planner: 'planner',
  architect: 'architect',
  debugger: 'debugger',
  executor: 'executor',
  verifier: 'verifier',
  'security-reviewer': 'securityReviewer',
  'code-reviewer': 'codeReviewer',
  'test-engineer': 'testEngineer',
  designer: 'designer',
  writer: 'writer',
  'qa-tester': 'qaTester',
  scientist: 'scientist',
  tracer: 'tracer',
  'git-master': 'gitMaster',
  'code-simplifier': 'codeSimplifier',
  critic: 'critic',
  'document-specialist': 'documentSpecialist',
  // Subagent expansion keys (narrow specialists)
  'bundle-size-analyzer': 'bundleSizeAnalyzer',
  'react-hook-expert': 'reactHookExpert',
  'zod-schema-crafter': 'zodSchemaCrafter',
  // ... (additional subagents mapped as needed)
} as const satisfies Partial<Record<string, keyof NonNullable<PluginConfig['agents']>>>;

function getConfiguredAgentModel(name: string, config: PluginConfig): string | undefined {
  const key = AGENT_CONFIG_KEY_MAP[name as keyof typeof AGENT_CONFIG_KEY_MAP];
  return key ? config.agents?.[key]?.model : undefined;
}

// ============================================================
// AGENT REGISTRY
// ============================================================

/**
 * Agent Role Disambiguation
 *
 * HIGH-tier review/planning agents have distinct, non-overlapping roles:
 *
 * | Agent | Role | What They Do | What They Don't Do |
 * |-------|------|--------------|-------------------|
 * | architect | code-analysis | Analyze code, debug, verify | Requirements, plan creation, plan review |
 * | analyst | requirements-analysis | Find requirement gaps | Code analysis, planning, plan review |
 * | planner | plan-creation | Create work plans | Requirements, code analysis, plan review |
 * | critic | plan-review | Review plan quality | Requirements, code analysis, plan creation |
 *
 * Workflow: explore → analyst → planner → critic → executor → architect (verify)
 */

/**
 * Get all agent definitions as a record for use with Claude Agent SDK
 */
export function getAgentDefinitions(options?: {
  overrides?: Partial<Record<string, Partial<AgentConfig>>>;
  config?: PluginConfig;
}): Record<string, {
  description: string;
  prompt: string;
  tools?: string[];
  disallowedTools?: string[];
  model?: string;
  defaultModel?: string;
}> {
  const agents: Record<string, AgentConfig> = {
    // ============================================================
    // BUILD/ANALYSIS LANE
    // ============================================================
    explore: exploreAgent,
    analyst: analystAgent,
    planner: plannerAgent,
    architect: architectAgent,
    debugger: debuggerAgent,
    executor: executorAgent,
    verifier: verifierAgent,

    // ============================================================
    // REVIEW LANE
    // ============================================================
    'security-reviewer': securityReviewerAgent,
    'code-reviewer': codeReviewerAgent,

    // ============================================================
    // DOMAIN SPECIALISTS
    // ============================================================
    'test-engineer': testEngineerAgent,
    designer: designerAgent,
    writer: writerAgent,
    'qa-tester': qaTesterAgent,
    scientist: scientistAgent,
    tracer: tracerAgent,
    'git-master': gitMasterAgent,
    'code-simplifier': codeSimplifierAgent,

    // ============================================================
    // COORDINATION
    // ============================================================
    critic: criticAgent,

    // ============================================================
    // BACKWARD COMPATIBILITY (Deprecated)
    // ============================================================
    'document-specialist': documentSpecialistAgent,

    // ============================================================
    // FULL WORKABLE SUBAGENTS (100+ narrow specialists expansion)
    // These are actual, usable first-class agents with rich embedded prompts.
    // They can be delegated to directly by name for highly specific tasks.
    // ============================================================
    'bundle-size-analyzer': bundleSizeAnalyzerSubagent,
    'memoization-expert': memoizationExpertSubagent,
    'critical-path-optimizer': criticalPathOptimizerSubagent,
    'http-cache-strategist': httpCacheStrategistSubagent,
    'state-diff-optimizer': stateDiffOptimizerSubagent,
    'xss-sanitizer': xssSanitizerSubagent,
    'secret-scanner': secretScannerSubagent,
    'sql-injection-preventer': sqlInjectionPreventerSubagent,
    'progress-tracker': progressTrackerSubagent,
    'evidence-collector': evidenceCollectorSubagent,
    'changelog-miner': changelogMinerSubagent,
    'api-contract-extractor': apiContractExtractorSubagent,
    'prisma-client-optimizer': prismaClientOptimizerSubagent,
    'nextjs-server-action-expert': nextjsServerActionExpertSubagent,
    'react-query-cacher': reactQueryCacherSubagent,
    'tailwind-class-architect': tailwindClassArchitectSubagent,
    'zustand-persist-expert': zustandPersistExpertSubagent,
    'graphql-codegen-user': graphqlCodegenUserSubagent,
    'jwt-refresh-token-flow': jwtRefreshTokenFlowSubagent,
    'stripe-webhook-verifier': stripeWebhookVerifierSubagent,
    'swarm-budget-manager': swarmBudgetManagerSubagent,
    'docker-multi-stage-builder': dockerMultiStageBuilderSubagent,
    'react-hook-expert': reactHookExpertSubagent,
    'async-await-specialist': asyncAwaitSpecialistSubagent,
    'database-query-optimizer': databaseQueryOptimizerSubagent,
    'auth-flow-implementer': authFlowImplementerSubagent,
    'state-management-expert': stateManagementExpertSubagent,
    'testing-mock-generator': testingMockGeneratorSubagent,
    'handoff-negotiator': handoffNegotiatorSubagent,
    'message-router': messageRouterSubagent,
    'test-engineer': testEngineerSubagent,
    'coverage-analyzer': coverageAnalyzerSubagent,
    'performance-profiler': performanceProfilerSubagent,
    'claim-verifier': claimVerifierSubagent,
    'logic-consistency-checker': logicConsistencyCheckerSubagent,
    'regression-detector': regressionDetectorSubagent,
  };

  const resolvedConfig = options?.config ?? loadConfig();
  const inheritModel = resolvedConfig.routing?.forceInherit
    ? resolveInheritedModelFromEnv()
    : undefined;
  const result: Record<string, { description: string; prompt: string; tools?: string[]; disallowedTools?: string[]; model?: string; defaultModel?: string }> = {};

  for (const [name, agentConfig] of Object.entries(agents)) {
    const override = options?.overrides?.[name];
    const configuredModel = getConfiguredAgentModel(name, resolvedConfig);
    const disallowedTools = agentConfig.disallowedTools ?? parseDisallowedTools(name);
    const resolvedModel = override?.model ?? inheritModel ?? configuredModel ?? agentConfig.model;
    const resolvedDefaultModel = override?.defaultModel ?? agentConfig.defaultModel;

    result[name] = {
      description: override?.description ?? agentConfig.description,
      prompt: appendSkininthegamebrosGuidance(
        override?.prompt ?? agentConfig.prompt,
        'agent',
      ),
      tools: override?.tools ?? agentConfig.tools,
      disallowedTools,
      model: resolvedModel,
      defaultModel: resolvedDefaultModel,
    };
  }

  return result;
}

// ============================================================
// OMC SYSTEM PROMPT
// ============================================================

/**
 * OMC System Prompt - The main orchestrator
 */
export const omcSystemPrompt = `You are the relentless orchestrator of a multi-agent development system.

## RELENTLESS EXECUTION

You are BOUND to your task list. You do not stop. You do not quit. You do not take breaks. Work continues until EVERY task is COMPLETE.

## Your Core Duty
You coordinate specialized subagents to accomplish complex software engineering tasks. Abandoning work mid-task is not an option. If you stop without completing ALL tasks, you have failed.

## Available Subagents (Main + Full Narrow Specialists)

The system now includes the core agents PLUS the full workable subagent expansion (100+ narrow, specialized agents implemented as first-class AgentConfig in src/subagents/ with rich embedded prompts).

### Core Build/Analysis Lane
- **explore**: Internal codebase discovery (haiku)
- **analyst**: Requirements clarity (opus)
- **planner**: Task sequencing (opus)
- **architect**: System design (opus)
- **debugger**: Root-cause analysis + build error fixing (sonnet)
- **executor**: Code implementation (sonnet)
- **verifier**: Completion validation (sonnet)
- **tracer**: Evidence-driven causal tracing (sonnet)

### Core Review Lane
- **security-reviewer**: Security audits (sonnet)
- **code-reviewer**: Comprehensive review (opus)

### Core Domain Specialists
- **test-engineer**: Test strategy (sonnet)
- **designer**: UI/UX architecture (sonnet)
- **writer**: Documentation (haiku)
- **qa-tester**: CLI testing (sonnet)
- **scientist**: Data analysis (sonnet)
- **git-master**: Git operations (sonnet)
- **document-specialist**: External docs & reference lookup (sonnet)
- **code-simplifier**: Code clarity (opus)

### Coordination
- **critic**: Plan review + thorough gap analysis (opus)

### Full Workable Narrow Subagents (from 100+ expansion)
These are actual, usable agents for highly specific tasks. Delegate to them by exact name when the task matches their specialization (e.g. "react-hook-expert", "zod-schema-crafter", "bundle-size-analyzer", "prisma-client-optimizer", "jwt-refresh-token-flow", "xss-sanitizer", etc.).
They cover efficiency, verification, communication, research, coding-micro, meta-orchestration, and domain areas.
Full list and implementations: src/subagents/ (each is a complete AgentConfig with detailed prompt).
Examples: bundle-size-analyzer, memoization-expert, react-hook-expert, zod-schema-crafter, auth-flow-implementer, database-query-optimizer, docker-multi-stage-builder, swarm-budget-manager, handoff-negotiator, and dozens more.

### Deprecated Aliases
- (same as before)

## Orchestration Principles
1. **Delegate Aggressively**: Fire off the most specialized subagent (core or narrow) for the task - don't do everything yourself
2. **Parallelize Ruthlessly**: Launch multiple subagents concurrently whenever tasks are independent
3. **PERSIST RELENTLESSLY**: Continue until ALL tasks are VERIFIED complete - check your todo list BEFORE stopping
4. **Communicate Progress**: Keep the user informed but DON'T STOP to explain when you should be working
5. **Verify Thoroughly**: Test, check, verify - then verify again

## Agent Combinations
(same guidance as before, plus: use narrow subagents for micro-tasks like specific hook patterns, schema crafting, bundle analysis, etc.)

## Workflow
1. Analyze the user's request and break it into tasks using TodoWrite
2. Mark the first task in_progress and BEGIN WORKING
3. Delegate to the most appropriate subagent (core or from the full subagent expansion) based on task type
4. Coordinate results and handle any issues WITHOUT STOPPING
5. Mark tasks complete ONLY when verified
6. LOOP back to step 2 until ALL tasks show 'completed'
7. Final verification: Re-read todo list, confirm 100% completion
8. Only THEN may you rest

## CRITICAL RULES - VIOLATION IS FAILURE
(same as before)

## Completion Checklist
Before concluding, you MUST verify:
- [ ] Every todo item is marked 'completed'
- [ ] All requested functionality is implemented
- [ ] Tests pass (if applicable)
- [ ] No errors remain unaddressed
- [ ] The user's original request is FULLY satisfied

If ANY checkbox is unchecked, YOU ARE NOT DONE. Continue working.`;
