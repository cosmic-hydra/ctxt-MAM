# Subagent Swarm Integration Guide

**Status**: Implemented on `feature/200-subagent-swarm` branch.

This document explains how the new Subagent Swarm system integrates with existing OMC features (team, ralph, ultrawork, AGENTS.md, CLAUDE.md, etc.).

## Overview

The Subagent Swarm adds a layer of **200+ narrow, cross-communicating micro-agents** on top of the existing multi-agent orchestration. It uses:

- `subagents/` directory + `registry.json` / `registry.md`
- **SCP v1** structured communication protocol
- Shared blackboard (`.omc/state/subagent-blackboard/`)
- `$subswarm` skill for easy invocation
- Generator script for rapid expansion

## Key Files

- `subagents/template.md` — Base template for new subagents
- `subagents/registry.json` — Machine-readable registry with 200 planned entries + discovery logic
- `subagents/registry.md` — Human-readable index
- `skills/subswarm/SKILL.md` — The `$subswarm` invocation skill
- `scripts/generate-subagent.mjs` — One-command generator

## How to Invoke

Inside a Claude Code session:
```
$subswarm build a production-ready user authentication system with tests, security review, and TypeScript strict typing
```

The swarm will automatically:
1. Decompose the task (`task-decomposer`)
2. Match to best subagents (`agent-matcher` + registry)
3. Execute in parallel where possible (`parallelism-finder`, `swarm-coordinator`)
4. Cross-verify continuously (`hallucination-guard`, `fact-checker`, etc.)
5. Coordinate cleanly via handoffs and blackboard
6. Deliver verified result with evidence trail and efficiency report

## Integration with Existing Modes

### With `/team` or `omc team`
- Use `$subswarm` as the execution engine inside team stages for finer-grained work.
- Example: In `team-exec` stage, delegate complex implementation to a subswarm of coding-micro specialists + verifiers.

### With `ralph` / `ultrawork`
- `$subswarm` can be activated inside persistent or parallel modes for deeper specialization.
- Great for high-stakes or token-heavy work.

### With AGENTS.md / CLAUDE.md
- The main orchestrator (Claude) now has explicit guidance to consider subagent delegation for narrow tasks.
- Child agent protocol is extended: when spawning, wrap with SCP context if targeting a subagent.

## Subagent Communication Protocol (SCP v1)

All subagent-to-subagent and subagent-to-orchestrator messages use this format (passed in `spawn_agent` message or blackboard):

```json
{
  "protocol": "SCP-v1",
  "from": "context-compressor",
  "to": "hallucination-guard or orchestrator or broadcast",
  "type": "result" | "handoff" | "query" | "alert",
  "task_id": "auth-system-2026-06-10",
  "payload": { /* narrow, precise output */ },
  "confidence": 0.92,
  "evidence": ["src/auth.ts:45-67", "previous plan section 3"],
  "next_steps": ["Verify this compressed context with fact-checker", "Proceed to implementation"]
}
```

## Blackboard

Location: `.omc/state/subagent-blackboard/{task_id}/`

Managed primarily by `blackboard-manager` subagent.
New or returning subagents should read relevant state first for context.

## Extending to 200 Subagents

1. Run the generator:
   ```bash
   node scripts/generate-subagent.mjs my-new-specialist coding-micro "expert in XYZ pattern"
   ```
2. Update `subagents/registry.json` and `registry.md` with the new entry.
3. Commit and test with `$subswarm`.

## Benefits Over Existing Team Mode

- Much finer specialization (micro-experts vs. broad agents)
- Built-in cross-verification layer
- Explicit, structured communication reduces ambiguity
- Massive parallelism with coordination
- Significant token savings via `token-optimizer` + `context-compressor`
- Easier to audit and improve individual specialists

## Future Work

- Full MCP tools for blackboard read/write
- Native integration into Claude Code child agent spawning
- Visual swarm dashboard in HUD
- Automatic learning extraction from swarm sessions into reusable skills

See also: `subagents/README.md`, `skills/subswarm/SKILL.md`, `AGENTS.md` (updated section), `CLAUDE.md`.
