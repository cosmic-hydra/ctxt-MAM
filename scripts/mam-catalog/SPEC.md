# MAM Agent Mesh — Catalog Specification

This directory is the single source of truth for the MAM (Multi-Agent Mesh)
hierarchy: **20 domain leads × 10 specialist subagents = 220 agents**, layered
on top of the 19 core OMC agents.

`scripts/generate-mam-agents.mjs` consumes these modules and emits:
- `agents/<name>.md` — one prompt file per agent (house Agent_Prompt XML style)
- `src/agents/mam-catalog.generated.ts` — typed registry consumed by
  `getAgentDefinitions()`

## Module contract

Each domain lives in `scripts/mam-catalog/<domain>.mjs` and default-exports:

```js
{
  domain: 'kebab-id',        // channel becomes `mam-<domain>`
  title: 'Human Title',
  summary: 'One sentence charter.',
  lead: AgentSpec,           // name MUST be `<domain>-lead`
  subagents: [AgentSpec x10] // names MUST start with `<domain>-`
}
```

AgentSpec:

| field | rule |
|---|---|
| `name` | kebab-case, domain-prefixed, globally unique |
| `model` | `haiku` \| `sonnet` \| `opus` |
| `readonly` | `true` ⇒ generated frontmatter gets `disallowedTools: Write, Edit` |
| `description` | one line for registry + frontmatter, ends with `(Haiku)`/`(Sonnet)`/`(Opus)` |
| `mission` | 2–3 sentences. What this agent is THE best at. Specific, confident, no filler. |
| `owns` | 3–5 bullets of concrete end-to-end responsibilities |
| `avoid` | 2–4 bullets of explicit non-responsibilities, each routing to a named agent |
| `coordination` | 2–5 bullets naming SPECIFIC partner agents and when/why to engage them |
| `deliverable` | one sentence: the artifact the caller receives |

Quality bar: see `frontend.mjs` (canonical exemplar). No placeholders, no
generic filler ("collaborate as needed"), every coordination bullet names a
real agent from the taxonomy below and states the trigger condition.

## Coordination fabric (already implemented in this repo)

- **Shared context channels** (`shared_context_post/read` MCP tools, or
  `omc-mam context post/read` CLI): per-domain channel `mam-<domain>`,
  cross-domain channel `mam-mesh`. Entry kinds: note, decision, finding,
  blocker, handoff, question, answer.
- **Task briefs** (`task_brief_*` tools / `omc-mam brief ...`): structured
  goal/constraints/status descriptor per delegated task.
- **Presence** (`agent_presence_*` tools / `omc-mam presence ...`):
  TTL heartbeat showing who is working on what.

The generator injects the standard protocol (announce presence, read brief,
post findings, handoff rules, escalation ladder) into every prompt; the
per-agent `coordination` bullets supply the domain-specific partnerships.

## Full taxonomy

Models: every lead is `sonnet` except `architecture-lead` and `product-lead`
(`opus`). Every `*-scout` is `haiku` + readonly. Read-only subs marked (RO).

### 1. frontend — Frontend Engineering (exemplar, done)
frontend-lead; frontend-component-engineer, frontend-state-specialist,
frontend-styling-expert, frontend-accessibility-auditor (RO),
frontend-performance-tuner, frontend-asset-optimizer, frontend-test-author,
frontend-build-tooling, frontend-api-binder, frontend-scout

### 2. backend — Backend Engineering
- backend-lead — owns server-side delivery, orchestrates the roster
- backend-endpoint-engineer — routes/handlers/controllers, request validation, status semantics
- backend-domain-modeler — business logic layer, entities, invariants, service boundaries
- backend-auth-engineer — authn/authz implementation: sessions, tokens, RBAC wiring
- backend-async-worker — background jobs, queues, schedulers, idempotency, retry semantics
- backend-cache-strategist — server-side caching layers, invalidation, key design, stampede control
- backend-resilience-engineer — timeouts, retries, circuit breakers, graceful degradation, backpressure
- backend-contract-tester — API contract tests, schema validation tests, consumer-driven contracts
- backend-integration-engineer — third-party service integration: SDKs, webhooks inbound, sandbox vs prod config
- backend-perf-profiler — server hot paths, N+1 detection, allocation profiling, latency budgets
- backend-scout (RO, haiku) — fast recon of server code

### 3. database — Database & Storage
- database-lead
- database-schema-designer — table/collection design, normalization decisions, constraints
- database-migration-engineer — safe migrations: expand/contract, zero-downtime, rollback paths
- database-query-optimizer — slow query analysis, EXPLAIN plans, rewrite strategies
- database-index-strategist — index design/pruning, write-amplification tradeoffs
- database-integrity-auditor (RO) — constraint coverage, orphan detection, consistency checks
- database-orm-specialist — ORM mapping correctness, lazy/eager strategy, escape hatches to raw SQL
- database-replication-engineer — read replicas, failover, consistency level choices
- database-backup-engineer — backup/restore strategy, PITR, restore drills
- database-seed-engineer — fixtures, seed data, anonymized production-like datasets
- database-scout (RO, haiku)

### 4. data-platform — Data Engineering & Analytics
- data-platform-lead
- data-pipeline-engineer — batch pipeline construction, dependency graphs, reruns/backfills
- data-ingestion-specialist — connectors, CDC, API ingestion, schema-on-read vs write
- data-transform-engineer — dbt/SQL/dataframe transforms, incremental models, tests on transforms
- data-quality-auditor (RO) — data contracts, freshness/completeness/distribution checks
- data-warehouse-modeler — dimensional modeling, marts, slowly changing dimensions
- data-orchestration-engineer — DAG/scheduler design (Airflow/Dagster/etc.), retries, SLAs
- data-streaming-engineer — Kafka/streaming topologies, exactly-once concerns, windowing
- data-catalog-curator — dataset documentation, lineage, ownership metadata
- data-viz-engineer — dashboards and reporting layers fed by the warehouse
- data-platform-scout (RO, haiku)

### 5. ml — ML/AI Engineering
- ml-lead
- ml-feature-engineer — feature extraction/stores, leakage prevention
- ml-training-engineer — training loops, hyperparameter sweeps, reproducibility
- ml-evaluation-analyst (RO) — eval design, metrics, slice analysis, regression detection
- ml-inference-optimizer — serving latency/throughput, quantization, batching
- ml-prompt-engineer — prompt design/versioning for LLM features, structured outputs
- ml-rag-engineer — retrieval pipelines: chunking, embeddings, rerank, grounding checks
- ml-dataset-curator — dataset collection/cleaning/labeling strategy and splits
- ml-experiment-tracker — experiment metadata, run comparison, artifact lineage
- ml-safety-auditor (RO) — model-output risk review: injection, leakage, bias surfaces
- ml-scout (RO, haiku)

### 6. mobile — Mobile Engineering
- mobile-lead
- mobile-ios-engineer — Swift/SwiftUI/UIKit implementation and platform idioms
- mobile-android-engineer — Kotlin/Compose implementation and platform idioms
- mobile-crossplatform-engineer — React Native/Flutter shared-code architecture
- mobile-ui-adapter — platform-adaptive UI, safe areas, density, navigation patterns
- mobile-offline-engineer — local persistence, sync engines, conflict resolution
- mobile-notifications-engineer — push pipelines, deep links, permission UX
- mobile-release-packager — signing, store metadata, build flavors, phased rollout configs
- mobile-perf-profiler — startup time, jank, memory, battery profiling
- mobile-test-author — unit/UI tests on simulators-emulators, snapshot strategy
- mobile-scout (RO, haiku)

### 7. devops — CI/CD & Delivery Automation
- devops-lead
- devops-pipeline-engineer — CI workflows: stages, caching, matrices, flaky-step hardening
- devops-release-automation — CD: promotion gates, automated versioning hooks, deploy scripts
- devops-container-engineer — Dockerfiles, image diet, multi-stage builds, registries
- devops-iac-engineer — Terraform/Pulumi modules, plan review discipline, drift detection
- devops-secrets-manager — secret stores, rotation, injection patterns, leak prevention
- devops-environment-wrangler — dev/stage/prod parity, ephemeral preview environments
- devops-artifact-curator — artifact retention, provenance, SBOM, dependency caching
- devops-runner-optimizer — CI cost/speed: parallelization, runner sizing, cache hit rates
- devops-rollback-engineer — rollback/roll-forward mechanics, deploy health checks
- devops-scout (RO, haiku)

### 8. cloud — Cloud Infrastructure
- cloud-lead
- cloud-network-architect — VPCs, subnets, load balancers, DNS, service mesh edges
- cloud-compute-rightsizer — instance/container sizing, autoscaling policies
- cloud-storage-architect — object/block/file storage tiers, lifecycle policies
- cloud-iam-engineer — least-privilege roles, service accounts, policy boundaries
- cloud-cost-analyst (RO) — spend attribution, waste detection, savings plans
- cloud-serverless-engineer — functions, event wiring, cold-start management
- cloud-kubernetes-operator — cluster config, workloads, HPA, pod disruption budgets
- cloud-dr-planner — multi-region/DR posture, RTO/RPO design, failover drills
- cloud-edge-engineer — CDN, edge functions, geo routing, TLS at the edge
- cloud-scout (RO, haiku)

### 9. security — Application & Infrastructure Security
- security-lead
- security-threat-modeler (RO) — STRIDE-style models, trust boundaries, abuse cases
- security-sast-auditor (RO) — code-level vuln review: injection, deserialization, SSRF, path traversal
- security-dependency-auditor (RO) — CVE triage, supply-chain risk, upgrade urgency calls
- security-secrets-scanner (RO) — credential leak detection in code/history/configs
- security-authz-reviewer (RO) — permission model review: IDOR, privilege escalation, tenant isolation
- security-input-hardener — implements validation/encoding/sanitization fixes
- security-crypto-reviewer (RO) — crypto usage review: algorithms, key handling, randomness
- security-compliance-mapper (RO) — control mapping (SOC2/GDPR-style), evidence gaps
- security-incident-responder — containment/remediation steps for active findings
- security-scout (RO, haiku)

### 10. quality — Testing & QA
- quality-lead
- quality-unit-test-author — fast isolated tests, boundary cases, mutation-resistant assertions
- quality-integration-test-author — service/module seam tests with real wiring
- quality-e2e-test-author — browser/API end-to-end journeys, stable selectors
- quality-fuzz-engineer — property-based and fuzz testing harnesses
- quality-regression-hunter — turns every fixed bug into a pinned regression test
- quality-flake-fixer — diagnoses and eliminates nondeterministic tests
- quality-coverage-analyst (RO) — coverage gap analysis weighted by risk, not raw %
- quality-test-data-fabricator — factories, builders, realistic fixture pipelines
- quality-acceptance-validator (RO) — verifies deliverables against acceptance criteria with evidence
- quality-scout (RO, haiku)

### 11. performance — Performance Engineering
- performance-lead
- performance-profiler (RO) — CPU/wall profiling, flamegraph reading, hotspot ranking
- performance-memory-analyst — heap analysis, leak hunting, allocation reduction
- performance-algorithm-optimizer — complexity reduction, data-structure swaps with benchmarks
- performance-io-optimizer — disk/network IO batching, serialization cost, compression tradeoffs
- performance-concurrency-tuner — parallelism, contention, lock granularity, async correctness
- performance-load-tester — load/stress/soak test design and execution
- performance-benchmark-author — micro/macro benchmark suites guarded against noise
- performance-regression-sentinel (RO) — perf CI gates, baseline tracking, regression bisection
- performance-capacity-planner (RO) — headroom modeling, scaling-limit predictions
- performance-scout (RO, haiku)

### 12. observability — Monitoring & Operations Insight
- observability-lead
- observability-logging-engineer — structured logging, levels, sampling, PII scrubbing
- observability-metrics-engineer — metric taxonomy, cardinality control, RED/USE coverage
- observability-tracing-engineer — distributed tracing, span design, context propagation
- observability-alert-designer — alert rules that page on symptoms, not noise
- observability-dashboard-builder — dashboards answering "is it healthy, what changed"
- observability-slo-engineer — SLI/SLO definitions, error budgets, burn-rate alerts
- observability-incident-analyst (RO) — postmortem analysis, timeline reconstruction
- observability-log-miner (RO) — log forensics: pattern extraction across incidents
- observability-cost-tamer — telemetry spend control: sampling, retention, cardinality diets
- observability-scout (RO, haiku)

### 13. api — API Design & Integration
- api-lead
- api-contract-designer — resource modeling, OpenAPI/schema-first design
- api-rest-specialist — REST semantics: methods, status codes, pagination, idempotency keys
- api-graphql-specialist — schema design, resolvers, N+1 defenses, persisted queries
- api-grpc-specialist — proto design, streaming RPCs, deadline/retry policy
- api-versioning-strategist — compatibility policy, deprecation timelines, sunset mechanics
- api-sdk-generator — client SDK generation/publishing pipelines, ergonomics review
- api-webhook-engineer — outbound webhook design: signing, retries, ordering, replay
- api-gateway-configurer — rate limits, auth at the edge, routing, request shaping
- api-docs-author — reference docs, examples, changelogs for API consumers
- api-scout (RO, haiku)

### 14. architecture — System Architecture (lead = opus)
- architecture-lead (opus)
- architecture-boundary-mapper (RO) — module/service boundary analysis, coupling metrics
- architecture-dependency-untangler — breaking cycles, layering enforcement, import hygiene
- architecture-pattern-advisor (RO) — pattern fit assessment: when NOT to use one too
- architecture-scalability-planner (RO) — bottleneck prediction, scaling strategy per tier
- architecture-event-designer — event-driven design: topics, schemas, ordering, outbox
- architecture-monolith-splitter — strangler-fig extraction plans and seam construction
- architecture-debt-assessor (RO) — tech-debt inventory ranked by interest rate
- architecture-adr-author — architecture decision records: context, options, consequences
- architecture-integration-planner (RO) — cross-system integration design, failure-mode mapping
- architecture-scout (RO, haiku)

### 15. refactoring — Code Health & Modernization
- refactoring-lead
- refactoring-dead-code-reaper — unused code/flags/deps removal with reference proof
- refactoring-duplication-merger — consolidating copy-paste into shared abstractions (only when ≥3 call sites)
- refactoring-naming-surgeon — rename campaigns for clarity, consistency sweeps
- refactoring-type-strengthener — eliminating any/unsafe casts, tightening signatures
- refactoring-dependency-upgrader — major-version migrations with codemods and changelog diligence
- refactoring-api-migrator — internal API migrations: deprecate, dual-write, switch, remove
- refactoring-complexity-reducer — function/module decomposition, guard-clause flattening
- refactoring-style-normalizer — formatting/lint-rule alignment, mechanical consistency
- refactoring-safety-verifier (RO) — proves behavior preservation: test runs, diff review
- refactoring-scout (RO, haiku)

### 16. debugging — Diagnosis & Root Cause
- debugging-lead
- debugging-repro-builder — minimal deterministic reproductions from vague reports
- debugging-bisector — git bisect campaigns, regression-window narrowing
- debugging-stack-analyst (RO) — crash/stack-trace interpretation, symbolication
- debugging-race-hunter — concurrency bug isolation: interleavings, TSan-style reasoning
- debugging-leak-hunter — resource leak diagnosis: memory, handles, connections
- debugging-heisenbug-isolator — environment-sensitive bug isolation, observability-effect control
- debugging-log-forensics (RO) — evidence extraction from logs/traces around failure windows
- debugging-env-differ (RO) — works-on-my-machine analysis: config/version/data diffs
- debugging-fix-implementer — implements the verified root-cause fix with a pinned regression test
- debugging-scout (RO, haiku)

### 17. docs — Documentation
- docs-lead
- docs-api-reference-author — reference documentation generated from and verified against code
- docs-tutorial-author — task-oriented guides with tested, copy-pasteable steps
- docs-readme-curator — README accuracy: quickstart that actually works
- docs-changelog-author — human-readable change communication from commit history
- docs-architecture-scribe — system overviews, diagrams-as-text, onboarding maps
- docs-runbook-author — operational runbooks: symptoms → checks → actions
- docs-style-editor — voice/terminology consistency, jargon control
- docs-link-auditor (RO) — dead link/stale screenshot/drifted-example detection
- docs-information-architect — doc-site structure, navigation, findability
- docs-scout (RO, haiku)

### 18. research — External Research & Evaluation
- research-lead
- research-sdk-investigator (RO) — official SDK/API doc deep-dives, version-accurate usage
- research-standards-reader (RO) — RFCs/specs/W3C reading, compliance interpretation
- research-benchmark-comparator (RO) — tool/library comparisons with reproducible criteria
- research-licensing-checker (RO) — license compatibility, obligation analysis
- research-vendor-evaluator (RO) — build-vs-buy, vendor capability and lock-in analysis
- research-paper-distiller (RO) — academic paper synthesis into engineering guidance
- research-changelog-tracker (RO) — upstream release monitoring, breaking-change radar
- research-community-scanner (RO) — issue trackers/forums signal: known bugs, workarounds
- research-prototype-builder — throwaway spikes proving feasibility (clearly marked non-prod)
- research-scout (RO, haiku)

### 19. product — Product & Requirements (lead = opus)
- product-lead (opus)
- product-requirements-analyst (RO) — extracting testable requirements from vague asks
- product-story-author — user stories with acceptance criteria in given/when/then form
- product-scope-negotiator (RO) — MVP cuts, phasing proposals, scope-creep alarms
- product-edge-case-prospector (RO) — enumeration of boundary/abuse/empty/error cases
- product-acceptance-author — measurable acceptance criteria and definition-of-done
- product-roadmap-sequencer — dependency-aware sequencing of deliverables
- product-risk-assessor (RO) — delivery and product risk register with mitigations
- product-metrics-definer — success metrics, instrumentation requirements
- product-feedback-synthesizer (RO) — clustering user feedback into ranked themes
- product-scout (RO, haiku)

### 20. release — Release & Delivery Management
- release-lead
- release-version-strategist — semver/calver decisions, version bump correctness
- release-notes-author — release notes from change history, audience-tiered
- release-branch-warden — branch strategy enforcement, merge-window management
- release-artifact-publisher — package publishing: registries, checksums, provenance
- release-deploy-coordinator — deploy sequencing across services, dependency ordering
- release-flag-master — feature-flag lifecycle: rollout %, kill switches, flag debt cleanup
- release-hotfix-pilot — expedited patch path: minimal diff, fast verification, backports
- release-compat-checker (RO) — breaking-change detection against public surfaces
- release-rollout-monitor (RO) — post-deploy health watch, rollback recommendation
- release-scout (RO, haiku)

## Cross-domain link map (use these in `coordination` bullets — keep links bidirectional)

- frontend-api-binder ↔ backend-endpoint-engineer / api-contract-designer (contract truth)
- frontend-build-tooling ↔ devops-pipeline-engineer (build commands, artifacts)
- frontend-asset-optimizer ↔ cloud-edge-engineer (CDN/cache headers)
- backend-auth-engineer ↔ security-authz-reviewer (review every authz change)
- backend-async-worker ↔ architecture-event-designer (event schema ownership)
- backend-perf-profiler ↔ performance-profiler (server hotspot handoff)
- database-migration-engineer ↔ devops-release-automation + release-deploy-coordinator (migration windows)
- database-query-optimizer ↔ backend-perf-profiler (N+1 and slow query handoffs)
- data-ingestion-specialist ↔ backend-integration-engineer (source system contracts)
- data-quality-auditor ↔ observability-alert-designer (freshness alerts)
- ml-inference-optimizer ↔ performance-load-tester (serving capacity evidence)
- ml-safety-auditor ↔ security-lead (model-mediated security risks)
- mobile-release-packager ↔ release-lead (store release trains)
- devops-secrets-manager ↔ security-secrets-scanner (leak findings → rotation)
- devops-iac-engineer ↔ cloud-* (all infra changes flow through IaC)
- cloud-cost-analyst ↔ observability-cost-tamer (spend signals both ways)
- security-incident-responder ↔ observability-incident-analyst (timeline + containment)
- quality-acceptance-validator ↔ product-acceptance-author (criteria are the contract)
- quality-e2e-test-author ↔ frontend-test-author / mobile-test-author (coverage split)
- performance-regression-sentinel ↔ devops-pipeline-engineer (perf gates in CI)
- observability-slo-engineer ↔ product-metrics-definer (user-facing SLI alignment)
- api-versioning-strategist ↔ release-compat-checker (breaking-change policy)
- architecture-adr-author ↔ docs-architecture-scribe (ADR → onboarding docs)
- refactoring-dependency-upgrader ↔ research-changelog-tracker (upstream breakage intel)
- debugging-fix-implementer ↔ quality-regression-hunter (every fix gets a pinned test)
- docs-api-reference-author ↔ api-docs-author (internal vs public reference split)
- release-rollout-monitor ↔ observability-dashboard-builder (deploy health views)
- product-edge-case-prospector ↔ quality-fuzz-engineer (edge cases → generators)
- *-scout of any domain ↔ requesting domain's lead via `mam-mesh` (cross-domain recon)

## Escalation ladder (same for every agent; generator injects it)

1. Sibling subagent (direct, via domain channel handoff)
2. Own domain lead (routing, arbitration, cross-domain needs)
3. Peer domain lead via `mam-mesh` (lead-to-lead handoff with task brief)
4. Core OMC agents (architect/critic/analyst) for judgment calls outside the mesh
