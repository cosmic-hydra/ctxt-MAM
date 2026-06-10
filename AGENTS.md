---
# Subagent Swarm Addition (feature/200-subagent-swarm branch)

**New Capability**: 200+ specialized cross-communicating subagents with SCP protocol, shared blackboard, registry-driven discovery, and `$subswarm` invocation.

## Subagent Swarm Integration

For narrow, high-precision, or highly parallel work, delegate to the Subagent Swarm instead of (or in addition to) the standard agent catalog.

### When to Use Subagents
- Tasks with many independent or loosely coupled micro-tasks
- Heavy verification or consensus needs
- Token optimization is critical
- You want maximum specialization (e.g., a dedicated TypeScript type guard expert instead of general executor)

### How to Activate
- Use the `$subswarm` skill: `$subswarm <high-level goal>`
- The swarm automatically decomposes, matches subagents from the registry, coordinates via SCP, uses the blackboard, and verifies results.

### Subagent Communication Protocol (SCP v1)
All subagent communication uses structured JSON (see `docs/subagent-swarm.md` and `skills/subswarm/SKILL.md` for full schema).

Key subagents available (growing toward 200):
- Efficiency: context-compressor, token-optimizer, parallelism-finder, ...
- Verification: hallucination-guard, fact-checker, consistency-verifier, ...
- Communication: handoff-negotiator, blackboard-manager, consensus-builder, ...
- Meta: task-decomposer, swarm-coordinator, agent-matcher, ...
- Coding Micro: typescript-type-guard, ...

Full list and discovery logic: `subagents/registry.json` and `subagents/registry.md`.

### Child Agent Protocol Extension
When spawning child agents for subagent roles, include the SCP context and registry reference in the message so the child operates under swarm rules.

See `docs/subagent-swarm.md` for complete integration details.
---

