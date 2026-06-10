# Subagent Registry — oh-my-claudecode Subagent Swarm

**Total Planned: 200+ specialized cross-communicating subagents**

This registry enables discovery, matching, and orchestration. Use it with the `$subswarm` skill or directly in team pipelines.

## Quick Stats (v1.0)
- **Efficiency**: 25 planned | 5 implemented
- **Verification**: 35 planned | 5 implemented
- **Communication**: 20 planned | 5 implemented
- **Research**: 30 planned | 3 implemented
- **Coding Micro-Specialists**: 55 planned | 3 implemented
- **Meta-Orchestration**: 20 planned | 4 implemented
- **Domain-Specific**: 15 planned | 0 implemented

## Implemented Subagents

### Efficiency
- `context-compressor` — Compresses context while preserving critical information (haiku)

### Verification
- (To be added in next batch)

### Communication
- (To be added in next batch)

### Research
- (To be added in next batch)

### Coding Micro
- (To be added in next batch)

### Meta-Orchestration
- (To be added in next batch)

## Planned Subagents (Selected Highlights — Full list in registry.json)

### Efficiency (25 total)
- token-optimizer
- redundancy-eliminator
- parallelism-finder
- cost-estimator
- prompt-minifier
- context-window-manager
- batch-optimizer
- async-parallelizer
- memory-footprint-analyzer
- ... (20 more)

### Verification (35 total)
- hallucination-guard
- fact-checker
- consistency-verifier
- security-micro-auditor
- test-gap-finder
- claim-verifier
- logic-consistency-checker
- regression-detector
- coverage-analyzer
- performance-profiler
- ... (25 more)

### Communication (20 total)
- handoff-negotiator
- message-router
- consensus-builder
- conflict-resolver
- blackboard-manager
- broadcast-coordinator
- query-dispatcher
- result-aggregator
- status-reporter
- ... (11 more)

### Research (30 total)
- web-researcher
- codebase-miner
- pattern-recognizer
- dependency-analyzer
- api-doc-miner
- error-log-analyzer
- design-pattern-hunter
- ... (23 more)

### Coding Micro-Specialists (55 total)
- typescript-type-guard
- api-error-handler-specialist
- react-hook-expert
- async-await-specialist
- database-query-optimizer
- auth-flow-implementer
- state-management-expert
- testing-mock-generator
- ... (47 more narrow specialists)

### Meta-Orchestration (20 total)
- task-decomposer
- agent-matcher
- swarm-coordinator
- learning-extractor
- self-improver
- workflow-optimizer
- dependency-resolver
- ... (13 more)

### Domain-Specific (15+ total)
- web-frontend-specialist
- backend-api-architect-micro
- data-pipeline-optimizer
- ml-model-evaluator
- security-auditor-narrow
- devops-ci-cd-expert
- ... (9 more)

## Discovery & Matching Logic

1. Orchestrator (or `$subswarm`) reads `registry.json` or scans `subagents/`.
2. Uses `agent-matcher` subagent + keyword/specialization matching.
3. Spawns selected subagents via existing `spawn_agent` with SCP-wrapped prompt.
4. Subagents communicate via **SCP v1** (structured JSON with from/to/type/payload/confidence/evidence/next_steps).
5. Results posted to shared blackboard (`.omc/state/subagent-blackboard/{task_id}/`).
6. Lead agent or `result-aggregator` synthesizes final output.

## How to Add New Subagents

1. Use the generator script: `node scripts/generate-subagent.mjs <name> <category> "short specialization"`
2. Or copy `subagents/template.md` and customize.
3. Update `registry.json` and `registry.md`.
4. Test with `$subswarm` or in a team pipeline.

Full machine-readable registry: [registry.json](./registry.json)

**Status**: Foundation committed. Expanding implemented count rapidly.
