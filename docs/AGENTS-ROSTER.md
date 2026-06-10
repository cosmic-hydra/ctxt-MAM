<!-- mam-roster: generated from agents/_registry/agents.json — edit the registry, not this file -->

# MAM Roster — Multi-Agent Mesh

The MAM roster is **20 domain leads + 200 sub-specialists + 1 coordination router** (221 agents), generated from [`agents/_registry/agents.json`](../agents/_registry/agents.json).

Edit the registry, then run `npm run sync-agents` (CI gate: `npm run sync-agents:check`). Do not hand-edit the generated `agents/*.md` files — they carry an autogen marker and will be overwritten.

## How it fits together

- **Leads** decompose a sizeable domain request into pieces and delegate to their 10 specialists, then integrate the results.
- **Sub-specialists** go deep on one narrow surface and report back, tagged to a task brief.
- **`coordination-router`** is the cross-communication agent: it transfers work and information *between* teams and sub-agents, detects stalls/duplication, and keeps everyone aligned.

Every agent coordinates through the same provider-agnostic mesh primitives — `shared_context_*`, `task_brief_*`, `agent_presence_*`, and the `omc-mam` CLI — so Claude-, Codex-, and Gemini-backed agents collaborate identically. See [TOOLS.md](./TOOLS.md).

## Leads and their specialists

### `frontend-lead` _(opus)_

browser UI engineering — component design, rendering, accessibility, build pipelines

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `frontend-react` | sonnet | React (hooks, suspense, server components, concurrent rendering); judges when to use context vs. lifted state vs. external store |
| `frontend-vue` | sonnet | Vue 3 (composition API, reactivity transform, Pinia, Nuxt 3); explains reactivity-loss footguns |
| `frontend-svelte` | sonnet | Svelte 4/5 and SvelteKit; runes vs. stores tradeoffs; SSR hydration boundaries |
| `frontend-accessibility` | sonnet | WCAG 2.2 AA conformance, ARIA patterns, screen reader testing, keyboard navigation, focus management |
| `frontend-css` | haiku | Modern CSS (grid, container queries, cascade layers, :has(), color-mix); pragmatic Tailwind/CSS-in-JS judgement |
| `frontend-animation` | sonnet | Web animations (FLIP, CSS transitions, Motion One, GSAP); knows the 60/120fps budget and how to stay inside it |
| `frontend-build-tools` | sonnet | Vite, esbuild, Rollup, Turbopack, SWC; bundle splitting, tree shaking, source map fidelity |
| `frontend-state-management` | sonnet | Redux Toolkit, Zustand, Jotai, TanStack Query, XState; picks the right one for the cardinality of state |
| `frontend-i18n` | haiku | ICU MessageFormat, plural rules, RTL layouts, locale-aware sorting and date/number formatting |
| `frontend-web-perf` | sonnet | Core Web Vitals (LCP, INP, CLS); preloading, code-splitting, image formats, render-blocking elimination |

### `backend-lead` _(opus)_

server engineering — HTTP/RPC services, persistence, integration

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `backend-node` | sonnet | Node.js (Express/Fastify/Hono); event loop pitfalls, streaming, worker_threads, native addon tradeoffs |
| `backend-python` | sonnet | FastAPI/Django/Flask; async vs. WSGI, Pydantic, SQLAlchemy 2.0, gunicorn/uvicorn tuning |
| `backend-go` | sonnet | Go services (net/http, chi, gin, gRPC-Go); context propagation, goroutine leaks, table-driven tests |
| `backend-rust` | sonnet | Rust services (axum, tower, tokio); lifetimes at the API boundary, Result-vs-panic discipline |
| `backend-java` | sonnet | Java/Kotlin (Spring Boot, Micronaut, Quarkus); JVM tuning, virtual threads, native-image considerations |
| `backend-api-design` | opus | REST resource modeling, HTTP semantics, idempotency keys, pagination styles, versioning strategies |
| `backend-graphql` | sonnet | GraphQL (Apollo, urql, Relay); N+1 prevention with DataLoader, persisted queries, federation |
| `backend-grpc` | sonnet | gRPC and Protobuf; streaming patterns, deadlines, retries, interceptor design, codegen ergonomics |
| `backend-message-queue` | sonnet | Kafka, RabbitMQ, NATS, SQS; delivery semantics, partitioning, consumer group rebalances, DLQs |
| `backend-caching` | sonnet | Cache strategies (write-through, write-back, read-through, cache-aside); invalidation, stampede protection, TTL design |

### `mobile-lead` _(sonnet)_

mobile engineering — iOS, Android, cross-platform, app-store realities

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `mobile-ios-swift` | sonnet | Swift, SwiftUI, UIKit interop, Combine; app lifecycle, background modes, Xcode signing |
| `mobile-android-kotlin` | sonnet | Kotlin, Jetpack Compose, Hilt, Coroutines/Flow; lifecycle-aware components, ProGuard/R8 |
| `mobile-react-native` | sonnet | React Native (new architecture: Fabric, TurboModules); bridging native code, Hermes tuning |
| `mobile-flutter` | sonnet | Flutter (Dart); widget tree perf, platform channels, freezed/riverpod patterns |
| `mobile-perf` | sonnet | Mobile perf — cold start, frame pacing, jank profiling (Instruments, systrace, perfetto) |
| `mobile-offline` | sonnet | Offline-first patterns; conflict resolution, sync queues, CRDTs, SQLite/Realm choice |
| `mobile-notification` | haiku | APNs and FCM; payload limits, silent notifications, notification grouping, deep-link routing |
| `mobile-accessibility` | sonnet | Mobile a11y — VoiceOver/TalkBack semantics, dynamic type, contrast, switch control |
| `mobile-deeplink` | haiku | Universal Links, App Links, deferred deep links, deep-link attribution; route fallback design |
| `mobile-release` | haiku | App Store / Play Store release flow; phased rollouts, kill switches, review-rejection patterns |

### `data-lead` _(opus)_

data engineering — databases, ETL, warehousing, modeling

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `data-postgres` | sonnet | PostgreSQL — indexes (B-tree/GIN/GiST/BRIN), MVCC/vacuum tuning, partitioning, logical replication |
| `data-mysql` | sonnet | MySQL/MariaDB — InnoDB internals, replication topologies (semi-sync/group), online DDL with gh-ost/pt-osc |
| `data-mongodb` | sonnet | MongoDB — schema design for document stores, aggregation pipelines, sharded cluster operations |
| `data-redis` | haiku | Redis — data structure choice, persistence (RDB/AOF) tradeoffs, cluster slot rebalancing, Lua scripting safety |
| `data-clickhouse` | sonnet | ClickHouse — MergeTree family, sort-key design, materialized views, partitioning at OLAP scale |
| `data-snowflake` | sonnet | Snowflake — warehouse sizing, micro-partitions, clustering keys, cost attribution |
| `data-etl-pipeline` | sonnet | ETL/ELT pipelines (Airflow, Dagster, dbt); idempotent tasks, backfill design, lineage tracking |
| `data-modeling` | sonnet | Dimensional modeling, Kimball star schemas, slowly-changing dimensions, data vault tradeoffs |
| `data-migration` | sonnet | Schema migrations — zero-downtime patterns, expand/contract, dual-write rollback design |
| `data-quality` | sonnet | Data quality — Great Expectations, dbt tests, anomaly detection, freshness SLAs |

### `ml-lead` _(opus)_

machine learning — training, serving, evaluation, ops

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `ml-pytorch` | sonnet | PyTorch — autograd internals, distributed training (DDP/FSDP), mixed precision, compile graph capture |
| `ml-tensorflow` | sonnet | TensorFlow/Keras — tf.data input pipelines, TF Serving, TFLite, XLA compilation |
| `ml-transformers` | opus | Transformer architecture — attention variants (FlashAttention, MQA, GQA), positional encodings, KV cache |
| `ml-data-prep` | sonnet | ML data prep — sampling strategies, label noise handling, class imbalance, feature stores |
| `ml-model-serving` | sonnet | Model serving — vLLM, TGI, Triton; batching, quantization (GPTQ/AWQ), throughput-vs-latency tuning |
| `ml-evaluation` | sonnet | Eval frameworks — held-out splits, LLM-as-judge pitfalls, calibration, statistical significance of benchmarks |
| `ml-fine-tuning` | sonnet | Fine-tuning — LoRA/QLoRA/full SFT, instruction tuning, RLHF/DPO/IPO tradeoffs, catastrophic forgetting |
| `ml-retrieval-rag` | sonnet | Retrieval and RAG — chunking strategies, hybrid (BM25 + dense), reranking, citation grounding |
| `ml-ops` | sonnet | MLOps — experiment tracking (MLflow/W&B), model registries, drift detection, shadow deploys |
| `ml-embeddings` | sonnet | Embeddings — model choice for domain/cost, dimensionality, vector DB (pgvector/Qdrant/Weaviate) selection |

### `devops-lead` _(opus)_

CI/CD, infrastructure-as-code, container orchestration, cloud platforms

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `devops-kubernetes` | sonnet | Kubernetes — workload APIs, networking (CNI/Service/Ingress), CRDs/operators, resource requests/limits |
| `devops-docker` | haiku | Docker — multi-stage builds, layer caching, slim base images, BuildKit features, OCI compliance |
| `devops-terraform` | sonnet | Terraform/OpenTofu — module design, state isolation, drift remediation, plan/apply safety |
| `devops-aws` | sonnet | AWS — IAM, VPC design, EKS/ECS, RDS, S3 lifecycle, cost guardrails, AWS WAF |
| `devops-gcp` | sonnet | GCP — IAM, VPC peering, GKE, Cloud Run, BigQuery, Cloud Functions, Workload Identity |
| `devops-azure` | sonnet | Azure — Entra ID, AKS, Container Apps, Key Vault, ARM/Bicep, managed identities |
| `devops-github-actions` | haiku | GitHub Actions — reusable workflows, matrix strategy, OIDC to clouds, runner sizing, caching |
| `devops-helm` | haiku | Helm — chart structure, values layering, library charts, hook ordering, sub-chart pitfalls |
| `devops-observability` | sonnet | Observability — OpenTelemetry, Prometheus, Grafana, Loki, Tempo; RED/USE metrics, SLOs, alert design |
| `devops-secrets-management` | sonnet | Secrets — Vault, KMS, External Secrets Operator, sealed-secrets, rotation policy design |

### `security-lead` _(opus)_

application and infrastructure security — appsec, vuln research, threat modeling

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `security-authn` | sonnet | Authentication — OAuth 2.1 / OIDC, passkeys/WebAuthn, session management, MFA design |
| `security-authz` | sonnet | Authorization — RBAC/ABAC/ReBAC; Zanzibar-style models, OPA/Rego, policy testing |
| `security-crypto` | opus | Applied crypto — AEAD choice, key derivation, nonce hygiene, PKI, post-quantum migration paths |
| `security-owasp` | sonnet | OWASP Top 10 patterns — injection, SSRF, IDOR, XSS, deserialization; remediation diff review |
| `security-supply-chain` | sonnet | Supply chain — SLSA levels, dependency confusion, lockfile integrity, SBOM (SPDX/CycloneDX), Sigstore |
| `security-container` | sonnet | Container security — image scanning, distroless bases, rootless, seccomp/AppArmor, runtime escape patterns |
| `security-cloud` | sonnet | Cloud security — IAM least-privilege analysis, public-bucket detection, key rotation, GuardDuty/SCC tuning |
| `security-threat-modeling` | opus | Threat modeling — STRIDE/LINDDUN/PASTA, data flow diagrams, asset valuation, threat library upkeep |
| `security-fuzzing` | sonnet | Fuzzing — libFuzzer, AFL++, structure-aware fuzzing, oss-fuzz integration, corpus curation |
| `security-incident-response` | sonnet | Incident response — triage, containment, forensic preservation, customer comms, blameless postmortems |

### `qa-lead` _(sonnet)_

test strategy — what to test, at what layer, with what oracle

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `qa-unit-test` | sonnet | Unit tests — test boundaries, mock vs fake choice, AAA structure, fast-feedback loops |
| `qa-integration-test` | sonnet | Integration tests — testcontainers, in-memory substitutes, transactional rollback, fixture lifecycle |
| `qa-e2e-test` | sonnet | E2E tests — Playwright/Cypress; flakiness root-causing, test pyramid balance, page object pragmatism |
| `qa-property-based` | sonnet | Property-based testing — fast-check/Hypothesis/QuickCheck; invariant discovery, shrinking strategy |
| `qa-mutation` | sonnet | Mutation testing — Stryker/PIT/cosmic-ray; reading mutation scores, equivalent mutant triage |
| `qa-perf-test` | sonnet | Perf testing — k6/Locust/Gatling; load profiles, percentile targets, baseline-vs-regression comparison |
| `qa-accessibility-test` | sonnet | A11y testing — axe-core, pa11y, manual SR sweeps; rule customization, false-positive triage |
| `qa-visual-regression` | haiku | Visual regression — Percy, Chromatic, Playwright snapshots; viewport/font normalization, diff thresholds |
| `qa-contract-test` | sonnet | Contract testing — Pact, Spring Cloud Contract; consumer-driven contracts, broker workflow |
| `qa-test-data` | sonnet | Test data — factories vs fixtures, anonymization for prod-like data, golden file management |

### `product-lead` _(opus)_

product strategy — PRDs, requirements, user research, prioritization

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `product-user-research` | sonnet | User research — qualitative/quantitative methods, recruiting, screener design, synthesis |
| `product-prd-author` | sonnet | PRD authoring — problem framing, success metrics, scope cuts, non-goals, decision log |
| `product-roadmap` | sonnet | Roadmapping — now/next/later, RICE prioritization, dependency mapping, theme communication |
| `product-okr` | haiku | OKRs — objective framing, leading-vs-lagging KRs, cascading vs decoupled, scoring conventions |
| `product-competitive-analysis` | sonnet | Competitive analysis — feature matrices, pricing tiers, positioning gaps, signal triangulation |
| `product-pricing` | sonnet | Pricing — value metric selection, packaging, willingness-to-pay research, grandfathering policy |
| `product-user-interview` | sonnet | User interviews — Mom Test discipline, laddering, behavior over preference, transcript synthesis |
| `product-survey-design` | haiku | Survey design — question wording, scale choice, branching logic, sample size sufficiency |
| `product-metrics` | sonnet | Product metrics — North Star choice, AARRR, cohort analysis, leading indicators |
| `product-story-mapping` | haiku | Story mapping — backbone, walking skeleton, slice prioritization, MVP definition |

### `design-lead` _(sonnet)_

visual and interaction design — design systems, wireframes, mockups, usability

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `design-ux-research` | sonnet | UX research — task analysis, journey mapping, heuristic evaluation, research repositories |
| `design-wireframe` | haiku | Wireframing — low/mid-fidelity, information hierarchy, content-first thinking |
| `design-mockup` | sonnet | High-fidelity mockups — Figma craft, auto-layout, components, variants, dev-handoff specs |
| `design-system` | sonnet | Design systems — token architecture, component governance, contribution model, versioning |
| `design-iconography` | haiku | Iconography — grid systems, optical alignment, stroke consistency, accessible labels |
| `design-typography` | haiku | Typography — type scale, line-height/measure, variable fonts, web-font loading strategy |
| `design-color-system` | haiku | Color systems — perceptual scales (OKLCH), contrast pairs, color-blind safe palettes |
| `design-interaction-pattern` | sonnet | Interaction patterns — empty states, error states, optimistic UI, undo design, microcopy |
| `design-prototyping` | sonnet | Prototyping — Figma prototype constraints, motion specs, code-prototypes for high-fidelity validation |
| `design-usability-testing` | sonnet | Usability testing — task design, think-aloud protocol, severity rating, finding synthesis |

### `docs-lead` _(sonnet)_

technical writing — API docs, tutorials, reference, release notes, diagrams

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `docs-api-docs` | sonnet | API docs — OpenAPI/AsyncAPI authoring, example sufficiency, error catalog, auth flow docs |
| `docs-tutorial-writer` | sonnet | Tutorials — Divio's Diátaxis framework, scaffolded examples, copy-pasteable code, success checks |
| `docs-reference` | sonnet | Reference docs — symbol-complete coverage, parameter/return precision, edge-case notes |
| `docs-release-notes` | haiku | Release notes — user-facing language, grouping by impact, migration callouts, deprecation timelines |
| `docs-changelog` | haiku | Changelogs — Keep a Changelog format, conventional commits to entries, breaking change discipline |
| `docs-style-guide` | haiku | Style guides — voice/tone, inclusive language, term consistency, code-sample conventions |
| `docs-diagram` | sonnet | Diagrams — Mermaid/PlantUML/Excalidraw; sequence vs flow vs C4 selection, accessible alt text |
| `docs-video-script` | sonnet | Video scripts — hook/payoff structure, B-roll callouts, timing, accessibility (captions, transcripts) |
| `docs-localization` | sonnet | Localization — translation memory, glossaries, context for translators, pseudolocalization QA |
| `docs-onboarding` | sonnet | Onboarding docs — golden path setup, day-1/week-1 sequencing, contributor ramp |

### `performance-lead` _(opus)_

performance engineering — profiling, budgeting, optimization across the stack

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `perf-cpu-profiling` | sonnet | CPU profiling — perf, pprof, async-profiler; flamegraphs, hot-path attribution, inlining/devirtualization |
| `perf-memory-profiling` | sonnet | Memory profiling — heap dumps, allocation tracking, leak detection, GC tuning across runtimes |
| `perf-latency-budgeting` | sonnet | Latency budgeting — p50/p95/p99 decomposition, tail-tolerant design, hedged requests |
| `perf-db-query` | sonnet | DB query tuning — EXPLAIN reading, index selection, plan stability, statistics freshness |
| `perf-cache-tuning` | sonnet | Cache tuning — hit ratio targets, eviction policy choice, key cardinality, warmup strategies |
| `perf-network` | sonnet | Network perf — HTTP/2 vs HTTP/3, head-of-line blocking, congestion control, connection pooling |
| `perf-frontend-loading` | sonnet | Frontend loading — critical CSS, preload/prefetch, image strategy, font-display, third-party script governance |
| `perf-throughput` | sonnet | Throughput — batching, vectorization, SIMD opportunities, contention reduction |
| `perf-concurrency` | sonnet | Concurrency tuning — lock-free patterns, false sharing, work stealing, runtime parameters |
| `perf-regression` | sonnet | Perf regression — microbench isolation (noise floor), CI gating with confidence intervals |

### `systems-lead` _(opus)_

low-level systems — OS, kernels, drivers, embedded, virtualization

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `systems-linux-kernel` | sonnet | Linux kernel — scheduler, mm, namespaces, cgroups v2, eBPF, syscall design |
| `systems-bsd` | sonnet | BSD (FreeBSD/OpenBSD) — jails, pf, ZFS, kqueue, dtrace |
| `systems-windows` | sonnet | Windows internals — NT object manager, ETW, WinDbg, kernel-mode driver model |
| `systems-embedded-rtos` | sonnet | Embedded RTOS — FreeRTOS/Zephyr; ISR design, priority inversion, deterministic scheduling |
| `systems-driver-development` | sonnet | Drivers — character/block/net device interfaces, DMA mapping, locking discipline |
| `systems-firmware` | sonnet | Firmware — bring-up, bootloaders (U-Boot, EDK II), secure boot, OTA update design |
| `systems-filesystem` | sonnet | Filesystems — ext4/xfs/btrfs/zfs tradeoffs; journaling, COW, fsync semantics, corruption recovery |
| `systems-network-stack` | sonnet | Network stack — TCP tuning, BBR, GRO/GSO, XDP/AF_XDP, eBPF networking |
| `systems-virtualization` | sonnet | Virtualization — KVM/QEMU, hypervisors, vIOMMU, paravirtualized devices, nested virt |
| `systems-container-runtime` | sonnet | Container runtimes — runc, crun, containerd; OCI runtime spec, rootless considerations |

### `distributed-lead` _(opus)_

distributed systems — consensus, coordination, fault tolerance, observability

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `dist-consensus` | opus | Consensus — Raft, Paxos, Multi-Paxos; quorum sizing, log compaction, joint consensus reconfiguration |
| `dist-event-sourcing` | sonnet | Event sourcing — event design, snapshotting, upcasting, projector rebuilds |
| `dist-cqrs` | sonnet | CQRS — command/query separation; eventual consistency UX, read-model freshness guarantees |
| `dist-service-mesh` | sonnet | Service mesh — Istio/Linkerd; mTLS rollout, traffic shifting, ambient mode, control-plane scaling |
| `dist-circuit-breaker` | sonnet | Circuit breakers, bulkheads, timeouts; failure modes for retry storms |
| `dist-saga` | sonnet | Sagas — orchestration vs choreography, compensation design, idempotency keys |
| `dist-tracing` | sonnet | Distributed tracing — W3C trace context, sampling strategies, span attribute discipline |
| `dist-backpressure` | sonnet | Backpressure — reactive streams, token buckets, queueing theory basics, load shedding |
| `dist-leader-election` | sonnet | Leader election — leases, fencing tokens, split-brain detection, recovery semantics |
| `dist-partition-tolerance` | sonnet | Partition tolerance — CAP positioning, AP-vs-CP tradeoffs, hinted handoff, anti-entropy |

### `research-lead` _(opus)_

open-ended research — literature, experiments, statistical rigor

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `research-literature-search` | sonnet | Literature search — arXiv/Semantic Scholar/Google Scholar workflows, snowball sampling, relevance ranking |
| `research-paper-summarizer` | sonnet | Paper summarization — extracts claims, methods, evidence; flags weak claims and missing baselines |
| `research-comparative-study` | sonnet | Comparative studies — controlled comparisons, confounders, effect-size reporting |
| `research-benchmark-design` | sonnet | Benchmark design — task selection, contamination checks, evaluation protocol robustness |
| `research-experiment-design` | sonnet | Experiment design — DoE, ANOVA, factorial designs, blocking, randomization |
| `research-statistical-analysis` | sonnet | Statistical analysis — frequentist vs Bayesian, multiple-comparison corrections, bootstrap CIs |
| `research-citation-management` | haiku | Citation management — BibTeX/CSL, DOI hygiene, deduplication, reference completeness |
| `research-reproducibility` | sonnet | Reproducibility — code+data+env pinning, seed discipline, container snapshots, ML cards |
| `research-peer-review` | sonnet | Peer review — strengths/weaknesses balance, reviewer rubrics, constructive critique norms |
| `research-open-questions` | sonnet | Open questions — gap analysis across literature, follow-up agenda generation |

### `compliance-lead` _(sonnet)_

regulatory and standards compliance — privacy, security, audit

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `compliance-gdpr` | sonnet | GDPR — lawful basis selection, DSAR workflow, DPIA when needed, processor/controller distinction |
| `compliance-ccpa` | sonnet | CCPA/CPRA — consumer rights mapping, sale/share opt-out, sensitive PI handling, cure period |
| `compliance-hipaa` | sonnet | HIPAA — covered entity vs BA, PHI minimization, ePHI safeguards, breach notification windows |
| `compliance-soc2` | sonnet | SOC 2 — TSC scoping (security/availability/...), control mapping, evidence collection, gap remediation |
| `compliance-pci-dss` | sonnet | PCI DSS v4 — scope reduction via tokenization, segmentation testing, SAQ selection |
| `compliance-iso27001` | sonnet | ISO 27001 — ISMS scope, Annex A controls, risk treatment plan, internal audit cadence |
| `compliance-data-retention` | haiku | Data retention — schedule design, legal hold workflow, deletion verification, backup tier rules |
| `compliance-dpa` | haiku | Data processing agreements — SCCs, sub-processor management, cross-border transfer assessments |
| `compliance-cookie-consent` | haiku | Cookie consent — categorization (strictly necessary/preferences/...), consent UX, IAB TCF integration |
| `compliance-audit-trail` | sonnet | Audit trail design — what to log, tamper-evidence (hash chains), retention, access controls |

### `growth-lead` _(sonnet)_

growth engineering — experimentation, analytics, lifecycle marketing

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `growth-ab-test` | sonnet | A/B testing — power analysis, peeking corrections, CUPED, novelty effects, network interference |
| `growth-funnel-analysis` | sonnet | Funnel analysis — step definition, conversion windows, comparative cohorts, drop-off attribution |
| `growth-retention` | sonnet | Retention analysis — N-day curves, magic moment detection, cohort comparison, survival analysis |
| `growth-attribution` | sonnet | Attribution — first/last/multi-touch, Markov/Shapley models, post-iOS14 limitations, MMM basics |
| `growth-seo` | sonnet | SEO — technical SEO (crawl/index/render), Core Web Vitals impact, content strategy, structured data |
| `growth-email-marketing` | haiku | Email marketing — list hygiene, deliverability (SPF/DKIM/DMARC), segmentation, A/B subject lines |
| `growth-push-engagement` | haiku | Push/in-app engagement — frequency caps, opt-in timing, deep-link landing, fatigue metrics |
| `growth-analytics-instrumentation` | sonnet | Analytics instrumentation — event taxonomy, identity stitching, consent enforcement, schema versioning |
| `growth-modeling` | sonnet | Growth modeling — growth accounting, viral coefficient, payback period, LTV/CAC sensitivity |
| `growth-churn-analysis` | sonnet | Churn analysis — voluntary vs involuntary, signal precursors, intervention design, retention experiments |

### `support-lead` _(sonnet)_

production support — incident response, on-call, reliability operations

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `support-runbook` | sonnet | Runbook authoring — symptom → diagnostic → action structure, escalation paths, drill testing |
| `support-incident-commander` | sonnet | Incident command — IC role, comms cadence, scribe/SME assignment, severity calibration |
| `support-postmortem` | sonnet | Postmortems — blameless framing, contributing factors, action items with owners, follow-up tracking |
| `support-status-page` | haiku | Status pages — component model, incident lifecycle messaging, customer-readable wording |
| `support-log-triage` | sonnet | Log triage — query patterns, log levels, structured fields, sampling, retention windows |
| `support-alert-tuning` | sonnet | Alert tuning — symptom vs cause alerts, multi-window multi-burn-rate SLO alerts, on-call load |
| `support-customer-comms` | haiku | Customer comms during incidents — acknowledge / impact / mitigation / ETA cadence |
| `support-paging` | haiku | Paging policy — rotations, override calendars, escalation chains, pager fatigue mitigation |
| `support-capacity-planning` | sonnet | Capacity planning — growth forecasting, headroom targets, scaling event drills |
| `support-dr` | sonnet | Disaster recovery — RTO/RPO targets, runbook testing, region failover, restoring from cold storage |

### `architect-lead` _(opus)_

cross-cutting system architecture — boundaries, evolution, migration

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `arch-system-design` | opus | System design — interview-style decomposition, capacity estimation, tradeoff articulation |
| `arch-api-versioning` | sonnet | API versioning — URL/header/content-negotiation tradeoffs, deprecation policy, client-impact analysis |
| `arch-data-flow` | sonnet | Data flow architecture — sources, transformations, sinks; backfill story; schema evolution |
| `arch-multi-tenant` | sonnet | Multi-tenancy — pool vs silo, noisy-neighbor mitigation, per-tenant feature flags, isolation testing |
| `arch-zero-downtime-migration` | sonnet | Zero-downtime migrations — expand/contract, dual reads/writes, cutover criteria, rollback plan |
| `arch-caching` | sonnet | Caching architecture — layer placement, coherence, invalidation contracts, multi-region |
| `arch-queue` | sonnet | Queue architecture — at-least-once design, exactly-once enabling patterns, DLQ workflow |
| `arch-read-replica` | sonnet | Read replicas — replication lag tolerance, read-your-writes, replica routing strategies |
| `arch-sharding` | sonnet | Sharding — key choice, resharding strategies, cross-shard joins, hot-shard mitigation |
| `arch-service-decomposition` | sonnet | Service decomposition — domain boundaries, anti-pattern detection (distributed monolith), team topology fit |

### `automation-lead` _(sonnet)_

workflow automation — scripts, RPA, orchestration, scheduled jobs

| Sub-specialist | Model | Specialty |
| --- | --- | --- |
| `auto-shell-script` | haiku | Shell scripting — POSIX vs bash/zsh, robust error handling (set -euo pipefail), arg parsing, idempotency |
| `auto-python` | sonnet | Python automation — Typer/Click CLIs, pathlib, subprocess hygiene, pipx packaging |
| `auto-browser` | sonnet | Browser automation — Playwright/Puppeteer for non-test workflows; selector resilience, headed/headless |
| `auto-desktop-rpa` | sonnet | Desktop RPA — UI-Vision/UIAutomation/AutoHotkey; brittle-vs-stable selector strategy |
| `auto-webhook-orchestration` | sonnet | Webhook orchestration — Zapier/Make/n8n/Pipedream tradeoffs, idempotency keys, retries |
| `auto-cron-job` | haiku | Cron and scheduled jobs — crontab vs systemd timer vs k8s CronJob; missed-run policy |
| `auto-workflow-engine` | sonnet | Workflow engines — Temporal/Airflow/Step Functions; durable execution, signal/query patterns |
| `auto-data-scraping` | sonnet | Data scraping — politeness, structured extraction, anti-bot tolerance, schema drift handling |
| `auto-iac-automation` | sonnet | IaC automation — Atlantis/Spacelift, drift detection automation, plan-on-PR workflows |
| `auto-release-automation` | sonnet | Release automation — semantic-release, changesets, multi-package release graphs, post-release verification |

## Coordination router

`coordination-router` _(opus)_ — Cross-team coordination — uses shared_context + task_brief + agent_presence + the team message router to bridge agents and sub-agents.
