English | [한국어](README.ko.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md) | [Português](README.pt.md)

# oh-my-claudecode

[![npm version](https://img.shields.io/npm/v/oh-my-claude-sisyphus?color=cb3837)](https://www.npmjs.com/package/oh-my-claude-sisyphus)
[![npm downloads](https://img.shields.io/npm/dm/oh-my-claude-sisyphus?color=blue)](https://www.npmjs.com/package/oh-my-claude-sisyphus)
[![GitHub stars](https://img.shields.io/github/stars/Yeachan-Heo/oh-my-claudecode?style=flat&color=yellow)](https://github.com/Yeachan-Heo/oh-my-claudecode/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Sponsor](https://img.shields.io/badge/Sponsor-❤️-red?style=flat&logo=github)](https://github.com/sponsors/Yeachan-Heo)
[![Discord](https://img.shields.io/discord/1452487457085063218?color=5865F2&logo=discord&logoColor=white&label=Discord)](https://discord.gg/sj4exxQ9v)

> **For Codex users:** Check out [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex) — the same orchestration experience for OpenAI Codex CLI.

**Multi-agent orchestration for Claude Code. Zero learning curve.**

_Don't learn Claude Code. Just use OMC._

[Get Started](#quick-start) • [Documentation](https://yeachan-heo.github.io/oh-my-claudecode-website) • [CLI Reference](https://yeachan-heo.github.io/oh-my-claudecode-website/docs/#cli-reference) • [Workflows](https://yeachan-heo.github.io/oh-my-claudecode-website/docs/#workflows) • [Migration Guide](docs/MIGRATION.md) • [Discord](https://discord.gg/sj4exxQ9v)

---

## Core Maintainers

| Role           | Name        | GitHub                                         |
| -------------- | ----------- | ---------------------------------------------- |
| Creator & Lead | Yeachan Heo | [@Yeachan-Heo](https://github.com/Yeachan-Heo) |

## Ambassadors

| Name       | GitHub                                           |
| ---------- | ------------------------------------------------ |
| Sigrid Jin | [@sigridjineth](https://github.com/sigridjineth) |

## Document Specialists

| Name    | GitHub                                 |
| ------- | -------------------------------------- |
| devswha | [@devswha](https://github.com/devswha) |

## Top Collaborators

| Name           | GitHub                                         | Commits |
| -------------- | ---------------------------------------------- | ------- |
| JunghwanNA     | [@shaun0927](https://github.com/shaun0927)     | 65      |
| riftzen-bit    | [@riftzen-bit](https://github.com/riftzen-bit) | 52      |
| Seunggwan Song | [@Nathan-Song](https://github.com/Nathan-Song) | 20      |
| BLUE           | [@blue-int](https://github.com/blue-int)       | 20      |
| Junho Yeo      | [@junhoyeo](https://github.com/junhoyeo)       | 15      |

## Quick Start

**Step 1: Install**

Marketplace/plugin install (recommended for most Claude Code users).
These are Claude Code slash commands — enter them **one at a time** (pasting both lines at once will fail):

```bash
/plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode
```

Then:

```bash
/plugin install oh-my-claudecode
```

If you prefer the npm CLI/runtime path instead of the marketplace flow:

```bash
npm i -g oh-my-claude-sisyphus@latest
```

> **Known npm warning:** npm may print `deprecated prebuild-install@7.1.3` during the CLI install.
> This currently comes from the upstream `better-sqlite3` native-addon dependency
> (`better-sqlite3 -> prebuild-install`); `prebuild-install@7.1.3` is still the latest
> published version, so there is no safe repo-side dependency bump or override to remove
> the warning yet. The warning is tracked in [#2913](https://github.com/Yeachan-Heo/oh-my-claudecode/issues/2913)
> and does not by itself mean the OMC CLI install failed.

**Step 2: Setup**

```bash
# Inside a Claude Code / OMC session
/setup
/omc-setup

# From your terminal
omc setup
```

If you run OMC via `omc --plugin-dir <path>` or `claude --plugin-dir <path>`, add `--plugin-dir-mode` to `omc setup` (or export `OMC_PLUGIN_ROOT` before running it) so the installer doesn't duplicate skills/agents that the plugin already provides at runtime. See the [Plugin directory flags section in REFERENCE.md](./docs/REFERENCE.md#plugin-directory-flags) for a complete decision matrix and all available flags.

**Step 3: Build something**

```bash
# Inside a Claude Code / OMC session
/autopilot "build a REST API for managing tasks"

# Natural-language in-session shortcut
autopilot: build a REST API for managing tasks
```

That's it. Everything else is automatic.

### CLI Commands vs In-Session Skills

OMC exposes two different surfaces:

- **Terminal CLI commands**: run `omc ...` from your shell after installing the npm/runtime path (`npm i -g oh-my-claude-sisyphus@latest`) or from a local checkout.
- **In-session skills**: run `/...` inside a Claude Code session after installing the plugin/setup flow.

| Feature                                        | Terminal CLI                                  | In-session skill                                                        | Notes                                                                                                                                |
| ---------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Setup                                          | `omc setup`                                   | `/setup` or `/omc-setup`                                                | Both are real entrypoints. `/setup` is the easiest plugin-first path.                                                                |
| Ask providers                                  | `omc ask codex "review this patch"`           | `/ask codex "review this patch"`                                        | Both route through the same advisor flow. Providers: `claude`, `codex`, `gemini`, `grok`.                                            |
| Team orchestration                             | `omc team 2:codex "review auth flow"`         | `/team 3:executor "fix all TypeScript errors"`                          | Both exist, but they are different runtimes.                                                                                         |
| Autopilot / Ralph / Ultrawork / Deep Interview | —                                             | `/autopilot ...`, `/ralph ...`, `/ultrawork ...`, `/deep-interview ...` | These are in-session skills.                                                                                                         |

### Not Sure Where to Start?

If you're uncertain about requirements, have a vague idea, or want to micromanage the design:

```
/deep-interview "I want to build a task management app"
```

The deep interview uses Socratic questioning to clarify your thinking before any code is written.

## 🚀 New: Subagent Swarm (Major Enhancement)

**200+ specialized, cross-communicating micro-agents** for dramatically higher efficiency, accuracy, and parallelism.

```bash
$subswarm build a production-ready authentication system with tests and security review
```

The swarm automatically:
- Decomposes the task (`task-decomposer`)
- Matches the best subagents from the registry
- Runs specialists in parallel (efficiency + verification layers)
- Communicates via structured **SCP v1** protocol
- Uses shared blackboard for persistent state
- Cross-verifies with `hallucination-guard`, `fact-checker`, etc.
- Delivers verified results with full evidence trail + token savings report

**Key implemented subagents** (growing rapidly toward 200):
- **Efficiency**: `context-compressor`, `token-optimizer`, `parallelism-finder`, `redundancy-eliminator`...
- **Verification**: `hallucination-guard`, `fact-checker`, `consistency-verifier`, `security-micro-auditor`...
- **Communication**: `handoff-negotiator`, `blackboard-manager`, `result-aggregator`, `consensus-builder`...
- **Coding Micro**: `typescript-type-guard`, `api-error-handler-specialist`, `react-hook-expert`...
- **Meta-Orchestration**: `swarm-coordinator`, `agent-matcher`, `task-decomposer`, `self-improver`...

**Quick commands:**
- Launch swarm: `$subswarm <your goal>`
- Generate new subagent: `node scripts/generate-subagent.mjs my-new-expert coding-micro "short description"`
- Full registry & docs: [subagents/registry.md](subagents/registry.md) and [docs/subagent-swarm.md](docs/subagent-swarm.md)

This makes Claude, Codex, Gemini, and Grok significantly more powerful and cost-efficient on complex projects.

---

## Team Mode (Recommended)

Starting in **v4.1.7**, **Team** is the canonical orchestration surface in OMC. The legacy `swarm` keyword/skill has been removed; use `team` directly.

```bash
/team 3:executor "fix all TypeScript errors"
```

Use `/team ...` when you want Claude Code's in-session native team workflow. Use `omc team ...` when you want terminal-launched tmux CLI workers (`claude` / `codex` / `gemini` panes).

Team runs as a staged pipeline:

`team-plan → team-prd → team-exec → team-verify → team-fix (loop)`

Enable Claude Code native teams in `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

> If teams are disabled, OMC will warn you and fall back to non-team execution where possible.

### tmux CLI Workers — Codex & Gemini (v4.4.0+)

**v4.4.0 removes the Codex/Gemini MCP servers** (`x`, `g` providers). Use the CLI-first Team runtime (`omc team ...`) to spawn real tmux worker panes.

For mixed Codex + Gemini work in one command, use the **`/ccg`** skill.

| Surface                   | Workers                  | Best For                                     |
| ------------------------- | ------------------------ | -------------------------------------------- |
| `omc team N:codex "..."`  | N Codex CLI panes        | Code review, security analysis, architecture |
| `omc team N:gemini "..."` | N Gemini CLI panes       | UI/UX design, docs, large-context tasks      |
| `omc team N:grok "..."`   | N Grok Build CLI panes   | Code review, analysis cross-check            |
| `omc team N:claude "..."` | N Claude CLI panes       | General tasks via Claude CLI in tmux         |
| `/ccg`                    | /ask codex + /ask gemini | Tri-model advisor synthesis                  |

Workers spawn on-demand and die when their task completes — no idle resource usage. Requires `codex` / `gemini` CLIs installed and an active tmux session.

---

## Why oh-my-claudecode?

- **Zero configuration required** - Works out of the box with intelligent defaults
- **Team-first orchestration** - Team is the canonical multi-agent surface
- **Natural language interface** - No commands to memorize, just describe what you want
- **Automatic parallelization** - Complex tasks distributed across specialized agents
- **Persistent execution** - Won't give up until the job is verified complete
- **Cost optimization** - Smart model routing saves 30-50% on tokens
- **Learn from experience** - Automatically extracts and reuses problem-solving patterns
- **Real-time visibility** - HUD statusline shows what's happening under the hood
- **Subagent Swarm** — 200+ narrow specialists with structured cross-communication (new major feature)

---

## Features

### Orchestration Modes

Multiple strategies for different use cases — from Team-backed orchestration to token-efficient refactoring.

| Mode                        | What it is                                                                              | Use For                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Team (recommended)**      | Canonical staged pipeline (`team-plan → team-prd → team-exec → team-verify → team-fix`) | Coordinated Claude agents on a shared task list                         |
| **omc team (CLI)**          | tmux CLI workers — real `claude`/`codex`/`gemini`/`grok` processes in split-panes       | Codex/Gemini/Grok CLI tasks; on-demand spawn, die when done             |
| **ccg**                     | Tri-model advisors via `/ask codex` + `/ask gemini`, Claude synthesizes                 | Mixed backend+UI work needing both Codex and Gemini                     |
| **Autopilot**               | Autonomous execution (single lead agent)                                                | End-to-end feature work with minimal ceremony                           |
| **Ultrawork**               | Maximum parallelism (non-team)                                                          | Burst parallel fixes/refactors where Team isn't needed                  |
| **Ralph**                   | Persistent mode with verify/fix loops                                                   | Tasks that must complete fully (no silent partials)                     |
| **UltraQA**                 | QA cycling until tests/build/lint/typecheck goals pass                                  | Quality gates that need repeat diagnose/fix cycles                      |
| **Claude Code `/goal`**     | Native Claude Code cross-turn goal loop                                                 | One measurable session completion condition                             |
| **Pipeline**                | Sequential, staged processing                                                           | Multi-step transformations with strict ordering                         |

### Intelligent Orchestration

- **19+ specialized agents** (with tier variants) for architecture, research, design, testing
- **Subagent Swarm** — 200+ micro-specialists with SCP v1 communication, blackboard, and dynamic composition (new!)
- **Smart model routing** - Haiku for simple tasks, Opus for complex reasoning
- **Automatic delegation** - Right agent/subagent for the job, every time

[Full Subagent Registry →](subagents/registry.md)

### Developer Experience

- **Magic keywords** - `ralph`, `ulw`, `ralplan`, `$subswarm`; Team stays explicit via `/team`
- **HUD statusline** - Real-time orchestration metrics
- **Skill learning** - Extract reusable patterns from your sessions
- **Analytics & cost tracking** - Understand token usage

---

## In-session shortcuts

These shortcuts run **inside a Claude Code / OMC session**.

| In-session form            | Kind                   | Effect                                 | Example                                        |
| -------------------------- | ---------------------- | -------------------------------------- | ---------------------------------------------- |
| `/team`                    | Slash skill            | Canonical Team orchestration           | `/team 3:executor "fix all TypeScript errors"` |
| `$subswarm`                | Skill                  | Launch specialized subagent swarm      | `$subswarm implement robust auth with tests`   |
| `/ccg`                     | Slash skill            | Tri-model synthesis                    | `/ccg review this PR`                          |
| `/autopilot` / `autopilot` | Skill / prompt trigger | Full autonomous execution              | `/autopilot "build a todo app"`                |
| `/ralph` / `ralph`         | Skill / prompt trigger | Persistence mode                       | `/ralph "refactor auth"`                       |
| `/ultrawork` / `ulw`       | Skill / prompt trigger | Maximum parallelism                    | `/ultrawork "fix all errors"`                  |
| `/ralplan` / `ralplan`     | Skill / prompt trigger | Iterative planning consensus           | `/ralplan "plan this feature"`                 |
| `/deep-interview`          | Slash skill            | Socratic requirements clarification    | `/deep-interview "vague idea"`                 |
| `deepsearch`               | Prompt trigger         | Codebase-focused search routing        | `deepsearch for auth middleware`               |
| `ultrathink`               | Prompt trigger         | Deep reasoning mode                    | `ultrathink about this architecture`           |
| `cancelomc`, `stopomc`     | Prompt trigger         | Stop active OMC modes                  | `stopomc`                                      |

**Notes:**
- `ralph` includes `ultrawork`.
- New: `$subswarm` for fine-grained specialist teams.

---

## Documentation

- **[Full Reference](docs/REFERENCE.md)** - Complete feature documentation
- **[Subagent Swarm Guide](docs/subagent-swarm.md)** — New major feature documentation
- **[CLI Reference](https://yeachan-heo.github.io/oh-my-claudecode-website/docs/#cli-reference)**
- **[Recommended Workflows](https://yeachan-heo.github.io/oh-my-claudecode-website/docs/#workflows)**
- **[Website](https://yeachan-heo.github.io/oh-my-claudecode-website)**
- **[Migration Guide](docs/MIGRATION.md)**
- **[Architecture](docs/ARCHITECTURE.md)**
- **[Performance Monitoring](docs/PERFORMANCE-MONITORING.md)**
- **[Model × Agent Compatibility Matrix](docs/agents/model-compatibility.md)**
- **[Security Guide](SECURITY.md)**

---

## Requirements

- [Claude Code](https://docs.anthropic.com/claude-code) CLI
- Claude Max/Pro subscription OR Anthropic API key

### Platform & tmux

OMC features like `omc team` and rate-limit detection require **tmux**.

### Optional: Multi-AI Orchestration

OMC can optionally orchestrate external AI providers (Gemini, Codex, Grok Build) for cross-validation.

**Cost:** 3 Pro plans cover everything for ~$60/month.

---

## License

MIT

---

<div align="center">

**Inspired by:** [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) • [claude-hud](https://github.com/ryanjoachim/claude-hud) • [Superpowers](https://github.com/obra/superpowers) • [everything-claude-code](https://github.com/affaan-m/everything-claude-code) • [Ouroboros](https://github.com/Q00/ouroboros)

**Zero learning curve. Maximum power.**

**Now with Subagent Swarm — even stronger.**

</div>

<!-- OMC:FEATURED-CONTRIBUTORS:START -->
## Featured by OmC Contributors

Top personal non-fork, non-archived repos from all-time OMC contributors (100+ GitHub stars).

- [@Yeachan-Heo](https://github.com/Yeachan-Heo) — [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) (⭐ 36k)
- [@junhoyeo](https://github.com/junhoyeo) — [tokscale](https://github.com/junhoyeo/tokscale) (⭐ 3.6k)
- [@psmux](https://github.com/psmux) — [psmux](https://github.com/psmux/psmux) (⭐ 2.4k)
- [@BowTiedSwan](https://github.com/BowTiedSwan) — [buildflow](https://github.com/BowTiedSwan/buildflow) (⭐ 292)
- [@J-Pster](https://github.com/J-Pster) — [Psters_AI_Workflow](https://github.com/J-Pster/Psters_AI_Workflow) (⭐ 290)
- [@alohays](https://github.com/alohays) — [awesome-visual-representation-learning-with-transformers](https://github.com/alohays/awesome-visual-representation-learning-with-transformers) (⭐ 267)
- [@jcwleo](https://github.com/jcwleo) — [random-network-distillation-pytorch](https://github.com/jcwleo/random-network-distillation-pytorch) (⭐ 262)
- [@MeroZemory](https://github.com/MeroZemory) — [ida-multi-mcp](https://github.com/MeroZemory/ida-multi-mcp) (⭐ 261)
- [@shaun0927](https://github.com/shaun0927) — [openchrome](https://github.com/shaun0927/openchrome) (⭐ 216)
- [@HaD0Yun](https://github.com/HaD0Yun) — [Doyunha-Gopeak](https://github.com/HaD0Yun/Doyunha-Gopeak) (⭐ 205)
- [@emgeee](https://github.com/emgeee) — [mean-tutorial](https://github.com/emgeee/mean-tutorial) (⭐ 200)
- [@anduinnn](https://github.com/anduinnn) — [HiFiNi-Auto-CheckIn](https://github.com/anduinnn/HiFiNi-Auto-CheckIn) (⭐ 171)
- [@devswha](https://github.com/devswha) — [patina](https://github.com/devswha/patina) (⭐ 156)
- [@Znuff](https://github.com/Znuff) — [consolas-powerline](https://github.com/Znuff/consolas-powerline) (⭐ 146)

<!-- OMC:FEATURED-CONTRIBUTORS:END -->

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Yeachan-Heo/oh-my-claudecode&type=date&legend=top-left)](https://www.star-history.com/#Yeachan-Heo/oh-my-claudecode&type=date&legend=top-left)

## 💖 Support This Project

If Oh-My-ClaudeCode helps your workflow, consider sponsoring:

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-❤️-red?style=for-the-badge&logo=github)](https://github.com/sponsors/Yeachan-Heo)

### Why sponsor?

- Keep development active
- Priority support for sponsors
- Influence roadmap & features
- Help maintain free & open source

### Other ways to help

- ⭐ Star the repo
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Contribute code
