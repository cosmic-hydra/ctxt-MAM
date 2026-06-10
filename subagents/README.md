# Subagent Swarm System for oh-my-claudecode

**200+ Specialized, Cross-Communicating Subagents** to supercharge Claude, Codex, Gemini, Grok, and other models.

## Vision

Transform OMC from a powerful multi-agent orchestrator into a **true agentic swarm intelligence** system. Subagents are lightweight, highly specialized micro-experts that:

- Handle narrow, high-precision tasks
- Cross-communicate seamlessly using a standardized protocol
- Enable massive parallelism and verification
- Dramatically reduce token waste, hallucinations, and errors
- Allow dynamic team composition for any task

This makes Claude/Codex/etc. **orders of magnitude more efficient**, reliable, and capable on complex projects.

## Key Benefits

- **Efficiency**: Specialized agents use fewer tokens for their narrow expertise.
- **Accuracy**: Cross-verification and multi-perspective analysis.
- **Scalability**: Easily compose 5-50 subagents for a single high-level task.
- **Learning**: Subagents can contribute to shared memory and skill extraction.
- **Extensibility**: Add new subagents without touching core code.

## Architecture

- `subagents/` : Definitions (one .md per subagent or category subdirs)
- `Subagent Communication Protocol (SCP)` : Structured messages for handoffs, queries, results, alerts.
- Shared Blackboard: `.omc/state/subagent-blackboard/` for persistent cross-agent state.
- Orchestrator Integration: Extended team pipeline and new `$subswarm` skill.
- Registry: `subagents/registry.json` for discovery and matching.

## Subagent Communication Protocol (SCP) v1

All subagents communicate using this JSON schema (passed via spawn_agent message, blackboard, or structured output):

```json
{
  "protocol": "SCP-v1",
  "from": "subagent-id-or-name",
  "to": "target-subagent-or-orchestrator-or-broadcast",
  "type": "handoff" | "query" | "result" | "alert" | "consensus-request",
  "task_id": "uuid",
  "payload": { /* domain specific data */ },
  "confidence": 0.0-1.0,
  "evidence": ["file:line", "output snippet"],
  "next_steps": ["suggested actions for receiver"],
  "timestamp": "ISO8601"
}
```

Orchestrators and subagents parse this for routing, verification, and chaining.

## How to Use

- High-level task -> Orchestrator decomposes -> Spawns relevant subagents in parallel
- Subagents work, communicate via SCP, post to blackboard
- Results synthesized by lead agent or dedicated aggregator subagent
- Verification swarm runs in parallel for quality gates

## Categories (Target: 200+)

- **efficiency/** (20+): Token optimization, context compression, redundancy elimination, parallelism detection, cost modeling.
- **verification/** (30+): Hallucination guard, fact checker, consistency enforcer, security micro-auditor, test gap finder, performance profiler.
- **communication/** (15+): Message router, handoff negotiator, consensus builder, conflict resolver, blackboard manager.
- **research/** (25+): Web researcher, codebase miner, pattern recognizer, dependency analyst, API doc miner.
- **coding-micro/** (50+): Narrow specialists for languages, frameworks, patterns (e.g., typescript-type-guard, react-hook-expert, api-error-handler).
- **meta-orchestration/** (20+): Task decomposer, agent-matcher, swarm-coordinator, learning-extractor, self-improver.
- **domain/** (40+): Web, data, ML, security, DevOps, product, etc.

## Next Steps

This is the foundation. More subagents, the $subswarm skill, blackboard tools, and integration into team/ralph/ultrawork will be added in follow-up commits.

Contributions welcome — use the template to propose new subagents!