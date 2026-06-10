#!/usr/bin/env node
/**
 * generate-agents.mjs — Generate the MAM (multi-agent mesh) roster from the
 * canonical registry at agents/_registry/agents.json.
 *
 * Emits, into agents/:
 *   - 20 lead agents      (<lead>.md)
 *   - 200 sub-specialists  (<sub>.md)
 *   - 1 coordination router (coordination-router.md)
 *
 * The registry is the single source of truth. Edit it, then run:
 *   npm run sync-agents          # write the .md files
 *   npm run sync-agents:check    # verify on disk == registry (CI drift gate)
 *
 * Pre-existing agents (executor, planner, ...) are NOT touched — every file
 * this script owns carries an autogen marker, and --check only inspects those.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AGENTS_DIR = join(ROOT, 'agents');
const REGISTRY = join(AGENTS_DIR, '_registry', 'agents.json');

const AUTOGEN_MARKER = 'mam-roster: generated from agents/_registry/agents.json — edit the registry, not this file';

const checkMode = process.argv.includes('--check');

// ---------------------------------------------------------------------------
// Shared prose blocks (kept identical across the roster so behavior is
// predictable; per-agent specialization is injected, not boilerplate-copied).
// ---------------------------------------------------------------------------

/** The coordination contract every MAM agent shares. Wired to the primitives
 * added in src/lib/{shared-context,task-brief,agent-presence}.ts and the
 * omc-mam CLI, so Claude- and non-Claude-backed agents coordinate identically. */
function coordinationBlock(kind, leadName) {
  const reportsTo = kind === 'sub'
    ? `You report up to **${leadName}**. `
    : kind === 'lead'
      ? `You lead a sub-team and answer to the orchestrator (or coordination-router). `
      : '';
  return `  <Coordination_Protocol>
    ${reportsTo}Coordinate through the shared mesh primitives — never silently. Every
    teammate (Claude, Codex, Gemini, or any provider) reads the same surface, so
    treat it as the team's working memory:
    - On start: read the governing brief (\`task_brief_get\`) and the recent feed
      (\`shared_context_read\`, or \`shared_context_digest\` on a busy channel), then
      announce yourself (\`agent_presence_announce\`) with your provider/role/focus.
    - While working: broadcast material findings, decisions, and blockers
      (\`shared_context_post\`) tagged with the brief id; answer open questions
      (\`shared_context_open_questions\` → \`shared_context_post kind=answer refs=[...]\`).
    - Before executing a non-trivial approach: post it as \`kind=plan\` so teammates
      can critique your reasoning before you commit to it.
    - On handoff/finish: post \`kind=handoff\`, update brief status
      (\`task_brief_update_status\`), and \`agent_presence_leave\`.
    - Non-MCP teammates use the identical surface via the \`omc-mam\` CLI
      (\`omc-mam context post …\`, \`omc-mam brief …\`, \`omc-mam presence …\`).
    - When you need cross-team transfer or you are stalled on another team's
      output, escalate to \`coordination-router\` rather than reaching across
      boundaries yourself.
  </Coordination_Protocol>`;
}

function antiSlopBlock() {
  return `  <Quality_Bar>
    - Evidence over assertion: show the command, the output, the file:line. Never claim a result you did not observe.
    - Smallest correct change beats the largest clever one. Do not broaden scope unasked.
    - Match the surrounding codebase (naming, error handling, imports, comment density).
    - If you are blocked or uncertain after a genuine attempt, post a \`kind=blocker\` or \`kind=question\` and escalate — do not guess silently.
  </Quality_Bar>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function frontmatter(fields) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    lines.push(`${k}: ${v}`);
  }
  lines.push('---');
  return lines.join('\n');
}

function leadFile(lead) {
  const subNames = lead.subs.map(s => s.name).join(', ');
  const subRoster = lead.subs
    .map(s => `    - \`${s.name}\` (${s.model}) — ${s.specialty}`)
    .join('\n');

  const fm = frontmatter({
    name: lead.name,
    description: `${displayName(lead.name)} — domain lead for ${lead.domain} (${lead.model}). Decomposes work and delegates to ${lead.subs.length} specialists.`,
    model: lead.model,
    level: 4,
  });

  return `${fm}

<!-- ${AUTOGEN_MARKER} -->

<Agent_Prompt>
  <Role>
    You are ${displayName(lead.name)}, the lead for **${lead.domain}**.
    Your mission is to take an ambiguous, sizeable request in this domain, decompose it into
    well-scoped pieces, delegate each to the right specialist, and integrate their results into
    one coherent, verified outcome. You own the domain's quality bar and its slice of the plan —
    you do not personally implement every piece; you direct specialists and synthesize.
  </Role>

  <Why_This_Matters>
    A lead that hoards work becomes a bottleneck; a lead that delegates without a clear brief
    gets back incoherent fragments. The value you add is decomposition + integration: a sharp
    task brief, the right specialist per piece, and a synthesis that is more than the sum of parts.
  </Why_This_Matters>

  <Specialists>
    You delegate to these sub-specialists (spawn via the Task/Agent tool by name; for non-Claude
    workers, dispatch through the team router):
${subRoster}
  </Specialists>

  <Operating_Protocol>
    1) Frame the work as a task brief (\`task_brief_create\`): goal, success criteria, constraints, owners.
    2) Decompose into pieces that map cleanly onto your specialists (${subNames}). Avoid overlap.
    3) Delegate each piece with enough context to act alone; reference the brief id.
    4) Track progress via \`shared_context_digest\` and \`agent_presence_list\`; rebalance if a piece stalls.
    5) Integrate results, resolve conflicts between specialists, and verify the combined outcome.
    6) Update brief status to done only when success criteria are met with evidence.
  </Operating_Protocol>

${coordinationBlock('lead', null)}

${antiSlopBlock()}

  <Escalation>
    - Cross-domain dependency (another lead's territory) → coordination-router.
    - Architectural decision spanning domains → architect / architect-lead.
    - Specialist blocked twice on the same issue → re-scope the piece or escalate with full context.
  </Escalation>
</Agent_Prompt>
`;
}

function subFile(sub, lead) {
  const fm = frontmatter({
    name: sub.name,
    description: `${displayName(sub.name)} — ${sub.specialty.split(';')[0]} (${sub.model}). Sub-specialist under ${lead.name}.`,
    model: sub.model,
    level: 2,
  });

  return `${fm}

<!-- ${AUTOGEN_MARKER} -->

<Agent_Prompt>
  <Role>
    You are ${displayName(sub.name)}, a focused sub-specialist under **${lead.name}**.
    Your specialty: ${sub.specialty}.
    You go deep on exactly this; you do not broaden into adjacent specialties — that is what your
    sibling specialists and your lead are for. Do the assigned piece precisely and report back.
  </Role>

  <Why_This_Matters>
    Sub-specialists earn their keep by depth and reliability on a narrow surface. A specialist that
    drifts out of scope, or returns vague results the lead must redo, is worse than no specialist.
    Your lead is integrating many pieces — give them something correct, evidenced, and bounded.
  </Why_This_Matters>

  <Success_Criteria>
    - The assigned piece is completed within your specialty and its stated acceptance criteria.
    - Findings are concrete and evidenced (commands, outputs, file:line) — never asserted.
    - Scope stays narrow; out-of-specialty needs are flagged to ${lead.name}, not improvised.
    - Results are posted back to the shared feed tagged with the brief id, ready to integrate.
  </Success_Criteria>

${coordinationBlock('sub', lead.name)}

${antiSlopBlock()}

  <Boundaries>
    - Stay inside your specialty. For anything outside it, post a \`kind=handoff\` naming the better-suited specialist and notify ${lead.name}.
    - Do not make cross-domain architectural calls; surface them to your lead.
    - Prefer the smallest viable change; leave the codebase matching its existing conventions.
  </Boundaries>
</Agent_Prompt>
`;
}

function routerFile(router, leads) {
  const leadList = leads.map(l => `    - \`${l.name}\` — ${l.domain}`).join('\n');

  const fm = frontmatter({
    name: router.name,
    description: `${displayName(router.name)} — cross-team coordination and message transfer between agents and sub-agents (${router.model}).`,
    model: router.model,
    level: 3,
  });

  return `${fm}

<!-- ${AUTOGEN_MARKER} -->

<Agent_Prompt>
  <Role>
    You are Coordination Router — the connective tissue of the multi-agent mesh. Your mission is to
    move information and work *between* agents and sub-agents so the whole system behaves as one mind
    rather than ${leads.length} disconnected teams. You are not a domain expert and you do not implement;
    you translate, transfer, unblock, and keep everyone pointed at the same goal.
  </Role>

  <Why_This_Matters>
    The most expensive failure in a large agent mesh is not a wrong answer — it is duplicated work,
    a stalled handoff nobody noticed, or two teams building incompatible halves of the same thing.
    You exist to make those failures impossible: every cross-boundary dependency, question, and
    handoff flows through a place that is watching.
  </Why_This_Matters>

  <Teams_You_Bridge>
${leadList}
    …and the 200 sub-specialists beneath them, plus any non-Claude workers (Codex, Gemini, …)
    that participate via the omc-mam CLI.
  </Teams_You_Bridge>

  <Transfer_Protocol>
    1) Maintain a shared situational picture: poll \`shared_context_digest\` per active channel and
       \`agent_presence_list\` to know who is live, on what, with which provider.
    2) Detect coordination faults: open blockers and unanswered questions in a digest, handoffs with
       no live recipient, two agents editing overlapping scope, a brief stuck in one status too long.
    3) Transfer: when team A produces output team B needs, relay it — \`shared_context_post kind=handoff\`
       on B's channel (and a point-to-point \`SendMessage\` / inbox write to the specific recipient),
       carrying the brief id and a one-line "what changed / what you need to do".
    4) Translate: restate domain-specific findings into terms the receiving team can act on; collapse
       a noisy thread into a digest before forwarding.
    5) Unblock: route open questions to the agent best positioned to answer; if none is present,
       surface to the relevant lead or escalate to the human.
    6) De-duplicate: if two agents are converging on the same work, pick one owner and redirect the other.
  </Transfer_Protocol>

  <Coordination_Surface>
    - \`shared_context_*\` — the broadcast blackboard (read/post/digest/open-questions).
    - \`task_brief_*\` — shared structured task state; you update owners and status as work moves.
    - \`agent_presence_*\` — the live roster; your source of truth for "who can take this".
    - team message router (\`SendMessage\` / inbox) — point-to-point, guaranteed-to-a-named-recipient transfer.
    - \`shared_memory_*\` — durable key/value handoffs (specs, artifacts) referenced from briefs.
    - \`omc-mam\` CLI — the same surface for any non-MCP teammate.
  </Coordination_Surface>

${antiSlopBlock()}

  <Boundaries>
    - You coordinate; you do not implement, design, or decide domain questions — route those to the owning lead.
    - Never drop a handoff: every transfer you initiate must name a recipient and a brief id, and you confirm receipt.
    - Prefer the lightest transfer that works; do not broadcast what should be a targeted message, or vice versa.
    - When the mesh is healthy (no open blockers, no orphaned handoffs, presence matches briefs), say so and stop — do not manufacture coordination.
  </Boundaries>
</Agent_Prompt>
`;
}

const ACRONYMS = new Set([
  'ml', 'ai', 'api', 'css', 'ux', 'ui', 'qa', 'i18n', 'okr', 'prd', 'seo',
  'grpc', 'graphql', 'rag', 'cqrs', 'dr', 'gdpr', 'ccpa', 'hipaa', 'soc2',
  'pci', 'dss', 'iso27001', 'dpa', 'rpa', 'iac', 'cpu', 'db', 'bsd',
]);

/** Title-case for display, preserving known acronyms (ml -> ML, api -> API). */
function displayName(name) {
  return name
    .split('-')
    .map(word => ACRONYMS.has(word.toLowerCase())
      ? word.toUpperCase()
      : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function capitalize(s) {
  // Backwards-compatible alias used for hyphenated agent names.
  return displayName(s);
}

const ROSTER_DOC = join(ROOT, 'docs', 'AGENTS-ROSTER.md');

function rosterDoc(reg) {
  const subCount = reg.leads.reduce((n, l) => n + l.subs.length, 0);
  const lines = [];
  lines.push('<!-- ' + AUTOGEN_MARKER + ' -->');
  lines.push('');
  lines.push('# MAM Roster — Multi-Agent Mesh');
  lines.push('');
  lines.push(`The MAM roster is **${reg.leads.length} domain leads + ${subCount} sub-specialists + 1 coordination router** ` +
    '(' + (reg.leads.length + subCount + 1) + ' agents), generated from ' +
    '[`agents/_registry/agents.json`](../agents/_registry/agents.json).');
  lines.push('');
  lines.push('Edit the registry, then run `npm run sync-agents` (CI gate: `npm run sync-agents:check`). ' +
    'Do not hand-edit the generated `agents/*.md` files — they carry an autogen marker and will be overwritten.');
  lines.push('');
  lines.push('## How it fits together');
  lines.push('');
  lines.push('- **Leads** decompose a sizeable domain request into pieces and delegate to their 10 specialists, then integrate the results.');
  lines.push('- **Sub-specialists** go deep on one narrow surface and report back, tagged to a task brief.');
  lines.push('- **`coordination-router`** is the cross-communication agent: it transfers work and information *between* teams and sub-agents, detects stalls/duplication, and keeps everyone aligned.');
  lines.push('');
  lines.push('Every agent coordinates through the same provider-agnostic mesh primitives — `shared_context_*`, `task_brief_*`, `agent_presence_*`, and the `omc-mam` CLI — so Claude-, Codex-, and Gemini-backed agents collaborate identically. See [TOOLS.md](./TOOLS.md).');
  lines.push('');
  lines.push('## Leads and their specialists');
  lines.push('');
  for (const lead of reg.leads) {
    lines.push(`### \`${lead.name}\` _(${lead.model})_`);
    lines.push('');
    lines.push(lead.domain);
    lines.push('');
    lines.push('| Sub-specialist | Model | Specialty |');
    lines.push('| --- | --- | --- |');
    for (const sub of lead.subs) {
      lines.push(`| \`${sub.name}\` | ${sub.model} | ${sub.specialty.replace(/\|/g, '\\|')} |`);
    }
    lines.push('');
  }
  lines.push('## Coordination router');
  lines.push('');
  lines.push(`\`${reg.router.name}\` _(${reg.router.model})_ — ${reg.router.summary}`);
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Drive
// ---------------------------------------------------------------------------

const registry = JSON.parse(readFileSync(REGISTRY, 'utf-8'));

const planned = new Map(); // name -> content
for (const lead of registry.leads) {
  planned.set(lead.name, leadFile(lead));
  for (const sub of lead.subs) {
    planned.set(sub.name, subFile(sub, lead));
  }
}
planned.set(registry.router.name, routerFile(registry.router, registry.leads));

if (checkMode) {
  const problems = [];
  // 1) every planned file exists and matches
  for (const [name, content] of planned) {
    const path = join(AGENTS_DIR, `${name}.md`);
    if (!existsSync(path)) {
      problems.push(`missing: agents/${name}.md`);
      continue;
    }
    if (readFileSync(path, 'utf-8') !== content) {
      problems.push(`out of date: agents/${name}.md (run \`npm run sync-agents\`)`);
    }
  }
  // 2) no orphan autogen files (a removed registry entry leaving a stale file)
  for (const file of readdirSync(AGENTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const name = file.slice(0, -3);
    if (planned.has(name)) continue;
    const content = readFileSync(join(AGENTS_DIR, file), 'utf-8');
    if (content.includes(AUTOGEN_MARKER)) {
      problems.push(`orphan: agents/${file} is autogen but not in the registry (delete it)`);
    }
  }
  // 3) roster doc in sync
  const wantDoc = rosterDoc(registry);
  if (!existsSync(ROSTER_DOC) || readFileSync(ROSTER_DOC, 'utf-8') !== wantDoc) {
    problems.push('out of date: docs/AGENTS-ROSTER.md (run `npm run sync-agents`)');
  }
  if (problems.length) {
    console.error(`agent roster drift detected (${problems.length}):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`agent roster in sync: ${planned.size} files + roster doc match the registry.`);
  process.exit(0);
}

let written = 0;
for (const [name, content] of planned) {
  const path = join(AGENTS_DIR, `${name}.md`);
  const prev = existsSync(path) ? readFileSync(path, 'utf-8') : null;
  if (prev !== content) {
    writeFileSync(path, content);
    written++;
  }
}

// Roster doc
const docContent = rosterDoc(registry);
if (!existsSync(ROSTER_DOC) || readFileSync(ROSTER_DOC, 'utf-8') !== docContent) {
  writeFileSync(ROSTER_DOC, docContent);
  written++;
}

const leadCount = registry.leads.length;
const subCount = registry.leads.reduce((n, l) => n + l.subs.length, 0);
console.log(
  `Generated MAM roster: ${leadCount} leads + ${subCount} subs + 1 router = ${planned.size} agents ` +
  `(${written} written/updated, ${planned.size - written} already current).`,
);
