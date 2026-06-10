#!/usr/bin/env node
/**
 * MAM Agent Mesh generator.
 *
 * Reads scripts/mam-catalog/*.mjs (20 domains × 11 agents) and emits:
 *   1. agents/<name>.md                       — prompt file per agent
 *   2. src/agents/mam-catalog.generated.ts    — typed registry for getAgentDefinitions()
 *
 * Usage:
 *   node scripts/generate-mam-agents.mjs           # generate
 *   node scripts/generate-mam-agents.mjs --check   # validate catalog + verify outputs are current
 *
 * The generated .md files are checked in (the runtime loads agents/<name>.md
 * directly). Edit the catalog modules, not the generated files.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AGENTS_DIR = join(ROOT, 'agents');
const GENERATED_TS = join(ROOT, 'src', 'agents', 'mam-catalog.generated.ts');

const { MAM_DOMAINS } = await import('./mam-catalog/index.mjs');

const MODELS = new Set(['haiku', 'sonnet', 'opus']);
const NAME_RE = /^[a-z0-9-]+$/;
const CORE_AGENTS = new Set([
  'analyst', 'architect', 'code-reviewer', 'code-simplifier', 'critic',
  'debugger', 'designer', 'document-specialist', 'executor', 'explore',
  'git-master', 'planner', 'qa-tester', 'scientist', 'security-reviewer',
  'test-engineer', 'tracer', 'verifier', 'writer',
]);

// ============================================================
// VALIDATION
// ============================================================

function validate(domains) {
  const errors = [];
  const seen = new Set();
  if (domains.length !== 20) {
    errors.push(`Expected 20 domains, got ${domains.length}`);
  }
  for (const d of domains) {
    const ctx = `[${d?.domain ?? '?'}]`;
    if (!d.domain || !NAME_RE.test(d.domain)) errors.push(`${ctx} invalid domain id`);
    if (!d.title) errors.push(`${ctx} missing title`);
    if (!d.summary) errors.push(`${ctx} missing summary`);
    if (!d.lead) errors.push(`${ctx} missing lead`);
    if (!Array.isArray(d.subagents) || d.subagents.length !== 10) {
      errors.push(`${ctx} must have exactly 10 subagents, got ${d.subagents?.length ?? 0}`);
    }
    const agents = [d.lead, ...(d.subagents ?? [])].filter(Boolean);
    if (d.lead && d.lead.name !== `${d.domain}-lead`) {
      errors.push(`${ctx} lead must be named ${d.domain}-lead, got ${d.lead.name}`);
    }
    // Optional `prefix` lets a domain use a shorter agent-name prefix
    // (e.g. domain `data-platform` with prefix `data`).
    const prefix = d.prefix ?? d.domain;
    for (const a of agents) {
      const actx = `${ctx} ${a?.name ?? '?'}`;
      if (!a.name || !NAME_RE.test(a.name)) errors.push(`${actx} invalid name`);
      if (a.name && !a.name.startsWith(`${prefix}-`) && a.name !== `${d.domain}-lead`) {
        errors.push(`${actx} name must be prefixed with ${prefix}-`);
      }
      if (seen.has(a.name)) errors.push(`${actx} duplicate agent name`);
      seen.add(a.name);
      if (CORE_AGENTS.has(a.name)) errors.push(`${actx} collides with a core OMC agent`);
      if (!MODELS.has(a.model)) errors.push(`${actx} invalid model: ${a.model}`);
      if (typeof a.readonly !== 'boolean') errors.push(`${actx} readonly must be boolean`);
      if (!a.description) errors.push(`${actx} missing description`);
      if (!a.mission || a.mission.length < 80) errors.push(`${actx} mission missing or too thin`);
      if (!Array.isArray(a.owns) || a.owns.length < 3) errors.push(`${actx} owns needs >=3 bullets`);
      if (!Array.isArray(a.avoid) || a.avoid.length < 2) errors.push(`${actx} avoid needs >=2 bullets`);
      if (!Array.isArray(a.coordination) || a.coordination.length < 2) {
        errors.push(`${actx} coordination needs >=2 bullets`);
      }
      if (!a.deliverable) errors.push(`${actx} missing deliverable`);
    }
  }
  return errors;
}

// ============================================================
// PROMPT TEMPLATE
// ============================================================

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const bullets = (items, indent = '    ') => items.map((i) => `${indent}- ${esc(i)}`).join('\n');

function coordinationSection(agent, domain, allDomains, isLead) {
  const channel = `mam-${domain.domain}`;
  const peerLeads = allDomains
    .filter((d) => d.domain !== domain.domain)
    .map((d) => `\`${d.lead.name}\` (${d.title})`)
    .join(', ');

  const common = `    You operate inside the MAM mesh. Coordination is not optional — undeclared work is invisible work.
    Tools: shared_context_post / shared_context_read (MCP) or \`omc-mam context post|read\` (CLI);
    task_brief_* tools or \`omc-mam brief ...\`; agent_presence_* tools or \`omc-mam presence ...\`.
    If coordination tooling is unavailable in your session, degrade gracefully: state assumptions inline and continue.

    Protocol:
    1) On start: announce presence (your agent name, focus, brief id if given) and read your task brief.
    2) Tail \`${channel}\` for recent decisions/findings before deriving anything a teammate may have posted.
    3) During work: post \`finding\` for reusable discoveries, \`decision\` for choices others must follow,
       \`blocker\` the moment you are stuck, \`handoff\` with refs when passing work.
    4) On finish: post a summary entry, update the task brief status, and leave presence.

    Escalation ladder: sibling subagent (via \`${channel}\` handoff) → ${domain.lead.name} → peer domain lead via \`mam-mesh\` → core OMC agents (architect/critic/analyst) for judgment calls outside the mesh.`;

  const leadExtra = `

    Lead-specific duties:
    - You own routing: every task you delegate gets a task brief (goal, success criteria, constraints, owner).
    - Arbitrate overlap disputes between your subagents; record the ruling as a \`decision\` on \`${channel}\`.
    - Cross-domain needs go lead-to-lead on \`mam-mesh\` with a brief id — never let a subagent silently depend on another domain's unconfirmed behavior.
    - Peer leads: ${peerLeads}.
    - Cross-domain read-only recon may be requested directly from any domain's \`*-scout\`.`;

  const domainSpecific = `

    Domain-specific partnerships:
${bullets(agent.coordination)}`;

  return common + (isLead ? leadExtra : domainSpecific + `

    You may delegate read-only recon to \`${domain.domain}-scout\`. For anything beyond your charter, hand off via the ladder above instead of stretching your scope.`);
}

function rosterSection(domain) {
  const rows = domain.subagents
    .map((s) => `    | \`${s.name}\` | ${s.model}${s.readonly ? ', read-only' : ''} | ${esc(s.description)} |`)
    .join('\n');
  return `  <Team_Roster>
    Your 10 specialists. Delegate with Task(subagent_type="oh-my-claudecode:&lt;name&gt;").

    | Agent | Model | Specialty |
    |-------|-------|-----------|
${rows}

    Routing rules:
    - Match the task to the narrowest specialist that fully covers it; split tasks that span two charters.
    - Read-only specialists audit and report; pair them with a writing specialist to apply fixes.
    - Run independent specialists in parallel; serialize only where one's output is another's input.
    - Use \`${domain.domain}-scout\` first when a task needs codebase recon before real work can be scoped.
  </Team_Roster>
`;
}

function buildPrompt(agent, domain, allDomains, isLead) {
  const channel = `mam-${domain.domain}`;
  const fm = [
    '---',
    `name: ${agent.name}`,
    `description: ${agent.description}`,
    `model: ${agent.model}`,
    `level: ${isLead ? 2 : 3}`,
    ...(agent.readonly ? ['disallowedTools: Write, Edit'] : []),
    'x-mam: generated — edit scripts/mam-catalog/' + domain.domain + '.mjs, then run node scripts/generate-mam-agents.mjs',
    '---',
  ].join('\n');

  const role = `  <Role>
    You are ${agent.name}, ${isLead ? `the domain lead for ${domain.title}` : `a ${domain.title} specialist`} in the MAM mesh (channel \`${channel}\`).
    ${esc(agent.mission)}
    You are responsible for:
${bullets(agent.owns)}
    You are NOT responsible for:
${bullets(agent.avoid)}
  </Role>`;

  const why = isLead
    ? `  <Why_This_Matters>
    A lead that does the work itself becomes the bottleneck and produces unreviewed output; a lead that routes carelessly produces fragments that don't integrate. Your value is decomposition, routing, arbitration, and integration — the mesh only beats a single agent when its lead does these well.
  </Why_This_Matters>`
    : `  <Why_This_Matters>
    Specialists exist so each subprocess is done by the agent best at it — but a specialist that drifts out of charter, duplicates a sibling's work, or fails to post findings destroys that advantage. Stay narrow, go deep, and make your results visible to the mesh.
  </Why_This_Matters>`;

  const success = `  <Success_Criteria>
${bullets(isLead
    ? [
        'Every delegated task has a brief with goal, success criteria, and a named owner',
        'Specialist outputs integrate into one coherent change — no conflicting patterns',
        'All cross-domain dependencies were confirmed lead-to-lead, not assumed',
        `Decisions and handoffs are recorded on \`${channel}\` / \`mam-mesh\``,
        'Final result verified with fresh evidence before reporting completion',
      ]
    : [
        'The deliverable below is produced exactly, with evidence (file:line refs, command output, or measurements)',
        'Work stays inside the charter above; out-of-scope needs were handed off, not absorbed',
        `Reusable findings and decisions were posted to \`${channel}\``,
        'Task brief status updated and presence cleared on completion',
      ])}
    Deliverable: ${esc(agent.deliverable)}
  </Success_Criteria>`;

  const coordination = `  <Coordination>
${coordinationSection(agent, domain, allDomains, isLead)}
  </Coordination>`;

  const constraints = `  <Constraints>
${bullets(isLead
    ? [
        'Delegate implementation work; only glue, arbitration, and trivial fixes are yours to write directly',
        'Never let two specialists edit the same files concurrently — serialize or split by file boundary',
        'Prefer the smallest team that covers the task; do not wake all 10 specialists for a one-specialist job',
        'After 3 failed attempts by a specialist on the same issue, re-route or escalate to core architect with full context',
        'Plan files (.omc/plans/*.md) are read-only',
      ]
    : [
        'Stay within your charter; route adjacent work via the escalation ladder instead of absorbing it',
        'Prefer the smallest viable change; match existing codebase patterns over personal preference',
        ...(agent.readonly
          ? ['You are READ-ONLY (no Write/Edit): produce findings and precise remediation steps for writing agents']
          : ['Verify your own changes (diagnostics, build, or tests as appropriate) before handing off']),
        'After 3 failed attempts on the same issue, escalate to your lead with full context — do not loop silently',
        'Plan files (.omc/plans/*.md) are read-only',
      ])}
  </Constraints>`;

  const workflow = isLead
    ? `  <Workflow>
    1) Intake: restate the goal, constraints, and acceptance criteria; create or read the task brief.
    2) Recon: send \`${domain.domain}-scout\` (and peer scouts via \`mam-mesh\` if cross-domain) to map the territory.
    3) Decompose: split into specialist-sized tasks with explicit file/topic boundaries; create a brief per task.
    4) Delegate: launch independent specialists in parallel; serialize dependent chains.
    5) Monitor: watch \`${channel}\` for blockers/questions; arbitrate fast, re-route stuck work.
    6) Integrate: reconcile outputs, resolve conflicts, run domain-level verification.
    7) Report: summarize what each specialist produced, with evidence, and close the briefs.
  </Workflow>`
    : `  <Workflow>
    1) Orient: read your task brief; announce presence; tail \`${channel}\` for prior findings touching your task.
    2) Recon: gather only the context your charter needs (use \`${domain.domain}-scout\` for broad searches).
    3) Execute: do the work your charter defines, smallest viable change first${agent.readonly ? ' (analysis and findings only — no edits)' : ''}.
    4) Verify: ${agent.readonly ? 'cross-check findings against the actual code/data before reporting' : 'run diagnostics/build/tests relevant to your change and capture the output'}.
    5) Publish: post findings/decisions/handoffs to \`${channel}\`, update the brief, report in the output format below.
  </Workflow>`;

  const output = `  <Output_Format>
    ## Result
    [What was ${agent.readonly ? 'found' : 'done'} — lead with the outcome]

    ## Evidence
    [file:line refs, command output, measurements, or audit citations]

    ## Coordination
    [Entries posted, handoffs made, briefs updated — or "none needed" with why]

    ## Open Items
    [Anything left for siblings, your lead, or other domains — with the suggested owner]
  </Output_Format>`;

  const failures = `  <Failure_Modes_To_Avoid>
${bullets(isLead
    ? [
        'Doing the work yourself: if you wrote most of the diff, you failed as a lead',
        'Fan-out theater: spawning specialists whose outputs you never integrate or verify',
        'Assumed contracts: letting work proceed on an unconfirmed cross-domain dependency',
        'Silent arbitration: resolving an overlap dispute without recording the decision',
      ]
    : [
        'Charter creep: absorbing adjacent work instead of handing it off',
        'Invisible work: finishing without posting findings — the mesh cannot reuse what it cannot see',
        'Duplicate derivation: re-discovering something already on the channel because you never read it',
        agent.readonly
          ? 'Vague findings: reporting problems without exact locations and remediation steps'
          : 'Unverified completion: claiming done without fresh diagnostics/test output',
      ])}
  </Failure_Modes_To_Avoid>`;

  const checklist = `  <Final_Checklist>
${bullets(isLead
    ? [
        'Does every delegated task have a brief and a named owner?',
        'Did I verify integrated results with fresh evidence?',
        'Are all decisions/handoffs recorded on the channel?',
        'Did I report per-specialist attribution in my summary?',
      ]
    : [
        'Did I stay inside my charter and hand off the rest?',
        'Is my evidence fresh and specific (file:line, output, numbers)?',
        'Did I post reusable findings to the channel and close out my brief?',
        'Can the caller act on my output without follow-up questions?',
      ])}
  </Final_Checklist>`;

  return [
    fm,
    '',
    '<Agent_Prompt>',
    role,
    '',
    why,
    '',
    success,
    '',
    ...(isLead ? [rosterSection(domain)] : []),
    coordination,
    '',
    constraints,
    '',
    workflow,
    '',
    output,
    '',
    failures,
    '',
    checklist,
    '</Agent_Prompt>',
    '',
  ].join('\n');
}

// ============================================================
// GENERATED TS REGISTRY
// ============================================================

function buildGeneratedTs(domains) {
  const entries = [];
  for (const d of domains) {
    for (const a of [d.lead, ...d.subagents]) {
      const isLead = a.name === d.lead.name;
      entries.push(
        `  { name: ${JSON.stringify(a.name)}, domain: ${JSON.stringify(d.domain)}, tier: ${JSON.stringify(isLead ? 'lead' : 'subagent')}, model: ${JSON.stringify(a.model)}, readonly: ${a.readonly}, description: ${JSON.stringify(a.description)} },`
      );
    }
  }
  return `/**
 * MAM Agent Mesh catalog — GENERATED FILE, DO NOT EDIT.
 *
 * Source of truth: scripts/mam-catalog/*.mjs
 * Regenerate with:  node scripts/generate-mam-agents.mjs
 *
 * 20 domain leads × 10 specialist subagents = ${entries.length} agents.
 * Prompts live in agents/<name>.md (also generated).
 */

export interface MamAgentEntry {
  name: string;
  domain: string;
  tier: 'lead' | 'subagent';
  model: 'haiku' | 'sonnet' | 'opus';
  readonly: boolean;
  description: string;
}

export const MAM_AGENT_CATALOG: readonly MamAgentEntry[] = [
${entries.join('\n')}
] as const;

export const MAM_AGENT_COUNT = MAM_AGENT_CATALOG.length;

export const MAM_DOMAIN_LEADS: readonly string[] = MAM_AGENT_CATALOG
  .filter((a) => a.tier === 'lead')
  .map((a) => a.name);
`;
}

// ============================================================
// MAIN
// ============================================================

const checkMode = process.argv.includes('--check');
const errors = validate(MAM_DOMAINS);
if (errors.length > 0) {
  console.error(`MAM catalog validation failed (${errors.length} errors):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const outputs = new Map();
for (const d of MAM_DOMAINS) {
  outputs.set(join(AGENTS_DIR, `${d.lead.name}.md`), buildPrompt(d.lead, d, MAM_DOMAINS, true));
  for (const s of d.subagents) {
    outputs.set(join(AGENTS_DIR, `${s.name}.md`), buildPrompt(s, d, MAM_DOMAINS, false));
  }
}
outputs.set(GENERATED_TS, buildGeneratedTs(MAM_DOMAINS));

if (checkMode) {
  const stale = [];
  for (const [path, content] of outputs) {
    if (!existsSync(path) || readFileSync(path, 'utf-8') !== content) stale.push(path);
  }
  if (stale.length > 0) {
    console.error(`Stale or missing generated files (${stale.length}); run node scripts/generate-mam-agents.mjs:`);
    for (const p of stale.slice(0, 20)) console.error('  - ' + p);
    process.exit(1);
  }
  console.log(`MAM catalog OK: ${outputs.size - 1} agent prompts + registry are current.`);
} else {
  let written = 0;
  for (const [path, content] of outputs) {
    if (!existsSync(path) || readFileSync(path, 'utf-8') !== content) {
      writeFileSync(path, content);
      written++;
    }
  }
  const mdCount = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md') && f !== 'AGENTS.md').length;
  console.log(`MAM generation complete: ${written} files written/updated; agents/ now has ${mdCount} agent prompts.`);
}
