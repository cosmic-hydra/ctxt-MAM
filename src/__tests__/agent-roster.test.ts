import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Drift gate + structural validation for the MAM (multi-agent mesh) roster.
 *
 * The roster (20 leads + 200 subs + 1 router) is generated from
 * agents/_registry/agents.json by scripts/generate-agents.mjs. These tests
 * assert the registry is well-formed and that the generated .md files exist,
 * are valid, and carry the autogen marker. Run `npm run sync-agents` if the
 * "every registry agent has a file" test fails.
 */

const ROOT = join(__dirname, '..', '..');
const AGENTS_DIR = join(ROOT, 'agents');
const REGISTRY_PATH = join(AGENTS_DIR, '_registry', 'agents.json');
const AUTOGEN_MARKER = 'mam-roster: generated from agents/_registry/agents.json';

interface Sub { name: string; model: string; specialty: string; }
interface Lead { name: string; model: string; domain: string; delegates_to: string; subs: Sub[]; }
interface Registry { version: number; leads: Lead[]; router: { name: string; model: string; summary: string }; }

const registry: Registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));

const VALID_MODELS = new Set(['opus', 'sonnet', 'haiku']);

function allAgentNames(): string[] {
  const names: string[] = [];
  for (const lead of registry.leads) {
    names.push(lead.name);
    for (const sub of lead.subs) names.push(sub.name);
  }
  names.push(registry.router.name);
  return names;
}

describe('MAM agent registry', () => {
  it('has exactly 20 leads', () => {
    expect(registry.leads).toHaveLength(20);
  });

  it('has exactly 200 sub-specialists (10 per lead)', () => {
    const total = registry.leads.reduce((n, l) => n + l.subs.length, 0);
    expect(total).toBe(200);
    for (const lead of registry.leads) {
      expect(lead.subs.length, `${lead.name} should have 10 subs`).toBe(10);
    }
  });

  it('defines a coordination router', () => {
    expect(registry.router.name).toBe('coordination-router');
    expect(VALID_MODELS.has(registry.router.model)).toBe(true);
  });

  it('has 221 total uniquely-named agents', () => {
    const names = allAgentNames();
    expect(names).toHaveLength(221);
    expect(new Set(names).size).toBe(221);
  });

  it('every agent name is kebab-case and filesystem-safe', () => {
    for (const name of allAgentNames()) {
      expect(name, `"${name}" must be kebab-case`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('every agent has a valid model', () => {
    for (const lead of registry.leads) {
      expect(VALID_MODELS.has(lead.model), `${lead.name}: ${lead.model}`).toBe(true);
      for (const sub of lead.subs) {
        expect(VALID_MODELS.has(sub.model), `${sub.name}: ${sub.model}`).toBe(true);
      }
    }
  });

  it('every sub has a non-trivial specialty string', () => {
    for (const lead of registry.leads) {
      for (const sub of lead.subs) {
        expect(sub.specialty.length, `${sub.name} specialty too short`).toBeGreaterThan(20);
      }
    }
  });

  it('no MAM agent name collides with a pre-existing core agent', () => {
    const core = new Set(
      readdirSync(AGENTS_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => f.slice(0, -3))
        .filter(name => {
          const content = readFileSync(join(AGENTS_DIR, `${name}.md`), 'utf-8');
          return !content.includes(AUTOGEN_MARKER);
        }),
    );
    for (const name of allAgentNames()) {
      expect(core.has(name), `MAM agent "${name}" collides with a core agent`).toBe(false);
    }
  });
});

describe('MAM roster files (run `npm run sync-agents` if these fail)', () => {
  it('every registry agent has a generated .md file', () => {
    for (const name of allAgentNames()) {
      const path = join(AGENTS_DIR, `${name}.md`);
      expect(existsSync(path), `missing agents/${name}.md`).toBe(true);
    }
  });

  it('every generated file has valid frontmatter and the autogen marker', () => {
    for (const name of allAgentNames()) {
      const content = readFileSync(join(AGENTS_DIR, `${name}.md`), 'utf-8');
      expect(content.startsWith('---\n'), `${name}: missing frontmatter`).toBe(true);
      expect(content.includes(`name: ${name}`), `${name}: name mismatch`).toBe(true);
      expect(content.includes(AUTOGEN_MARKER), `${name}: missing autogen marker`).toBe(true);
      expect(content.includes('<Agent_Prompt>'), `${name}: missing prompt body`).toBe(true);
    }
  });

  it('leads reference their sub-specialists by name', () => {
    for (const lead of registry.leads) {
      const content = readFileSync(join(AGENTS_DIR, `${lead.name}.md`), 'utf-8');
      for (const sub of lead.subs) {
        expect(content.includes(sub.name), `${lead.name} should list ${sub.name}`).toBe(true);
      }
    }
  });

  it('subs name their lead', () => {
    for (const lead of registry.leads) {
      for (const sub of lead.subs) {
        const content = readFileSync(join(AGENTS_DIR, `${sub.name}.md`), 'utf-8');
        expect(content.includes(lead.name), `${sub.name} should reference ${lead.name}`).toBe(true);
      }
    }
  });

  it('every MAM agent wires the coordination primitives', () => {
    // The whole point of the roster is that agents coordinate through the
    // shared mesh — assert the prompts actually reference it.
    for (const name of allAgentNames()) {
      const content = readFileSync(join(AGENTS_DIR, `${name}.md`), 'utf-8');
      const mentionsMesh =
        content.includes('shared_context') ||
        content.includes('task_brief') ||
        content.includes('agent_presence') ||
        content.includes('omc-mam');
      expect(mentionsMesh, `${name} should wire coordination primitives`).toBe(true);
    }
  });

  it('the router bridges every lead and exposes the transfer surface', () => {
    const content = readFileSync(join(AGENTS_DIR, 'coordination-router.md'), 'utf-8');
    for (const lead of registry.leads) {
      expect(content.includes(lead.name), `router should bridge ${lead.name}`).toBe(true);
    }
    expect(content.includes('SendMessage')).toBe(true);
    expect(content.includes('shared_context')).toBe(true);
  });
});
