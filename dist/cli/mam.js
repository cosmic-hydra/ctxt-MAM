/**
 * omc-mam — Multi-Agent Memory CLI
 *
 * Provider-agnostic shell entry point for the cross-agent collaboration
 * primitives that ship with OMC. Codex, Gemini, Ollama, or any other agent
 * harness can shell out to these commands without needing MCP support:
 *
 *   omc-mam context post   --namespace team-alpha --author codex-1 \
 *                          --kind finding --message "flaky test in auth/"
 *   omc-mam context read   --namespace team-alpha --kind blocker
 *   omc-mam context digest --namespace team-alpha
 *
 *   omc-mam brief create   --id b1 --namespace team-alpha \
 *                          --title "Fix flaky auth tests" \
 *                          --goal "Get the suite green on main" \
 *                          --created-by codex-1 \
 *                          --owner codex-1 --owner gemini-2 \
 *                          --success "no quarantined tests" \
 *                          --constraint "must run under 60s"
 *   omc-mam brief status   --id b1 --namespace team-alpha \
 *                          --status in-progress --by codex-1
 *   omc-mam brief get      --id b1 --namespace team-alpha
 *
 *   omc-mam presence announce --namespace team-alpha --agent codex-1 \
 *                             --provider codex --role executor \
 *                             --focus "fixing flaky auth tests" --ttl 600
 *   omc-mam presence list     --namespace team-alpha
 *   omc-mam presence leave    --namespace team-alpha --agent codex-1
 *
 * Output: `--json` flag returns structured JSON for programmatic callers.
 *
 * The CLI imports the same lib functions the MCP tools use, so behavior,
 * validation, and storage paths are identical regardless of caller.
 */
import { postEntry, readFeed, clearFeed, listContextNamespaces, digestChannel, listOpenQuestions, CONTEXT_KINDS, } from '../lib/shared-context.js';
import { createBrief, getBrief, updateStatus, amendBrief, listBriefs, deleteBrief, TASK_STATUSES, } from '../lib/task-brief.js';
import { announcePresence, listPresence, leavePresence, reapStale, } from '../lib/agent-presence.js';
import { writeEntry as smWriteEntry, readEntry as smReadEntry, listEntries as smListEntries, deleteEntry as smDeleteEntry, listNamespaces as smListNamespaces, } from '../lib/shared-memory.js';
const REPEATABLE_FLAGS = new Set([
    'owner',
    'success',
    'constraint',
    'related-key',
    'related-entry',
    'tag',
    'ref',
    'add-owner',
    'remove-owner',
    'add-success',
    'add-constraint',
    'add-related-key',
    'add-related-entry',
    'add-tag',
]);
function parseArgs(argv) {
    const positional = [];
    const flags = {};
    const multi = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith('--')) {
            const eq = a.indexOf('=');
            let name;
            let value;
            if (eq !== -1) {
                name = a.slice(2, eq);
                value = a.slice(eq + 1);
            }
            else {
                name = a.slice(2);
                const peek = argv[i + 1];
                if (peek !== undefined && !peek.startsWith('--')) {
                    value = peek;
                    i++;
                }
            }
            if (REPEATABLE_FLAGS.has(name)) {
                if (value === undefined) {
                    throw new Error(`Flag --${name} requires a value`);
                }
                multi[name] = [...(multi[name] ?? []), value];
            }
            else if (value === undefined) {
                flags[name] = true;
            }
            else {
                flags[name] = value;
            }
        }
        else {
            positional.push(a);
        }
    }
    return { positional, flags, multi };
}
function requireFlag(parsed, name) {
    const v = parsed.flags[name];
    if (typeof v !== 'string' || v.length === 0) {
        throw new Error(`Missing required --${name}`);
    }
    return v;
}
function optionalFlag(parsed, name) {
    const v = parsed.flags[name];
    return typeof v === 'string' && v.length > 0 ? v : undefined;
}
function optionalNumber(parsed, name) {
    const v = optionalFlag(parsed, name);
    if (v === undefined)
        return undefined;
    const n = Number(v);
    if (!Number.isFinite(n))
        throw new Error(`--${name} must be a number (got "${v}")`);
    return n;
}
function jsonOutput(parsed) {
    return parsed.flags.json === true || parsed.flags.json === 'true';
}
function out(parsed, structured, human) {
    if (jsonOutput(parsed)) {
        process.stdout.write(JSON.stringify(structured, null, 2) + '\n');
    }
    else {
        process.stdout.write(human + '\n');
    }
}
// ---------------------------------------------------------------------------
// Subcommand dispatchers
// ---------------------------------------------------------------------------
function contextCmd(action, parsed) {
    switch (action) {
        case 'post': {
            const namespace = requireFlag(parsed, 'namespace');
            const author = requireFlag(parsed, 'author');
            const message = requireFlag(parsed, 'message');
            const kindArg = (optionalFlag(parsed, 'kind') ?? 'note');
            if (!CONTEXT_KINDS.includes(kindArg)) {
                throw new Error(`Invalid --kind. Must be one of: ${CONTEXT_KINDS.join(', ')}`);
            }
            const tags = parsed.multi['tag'];
            const refs = parsed.multi['ref'];
            const entry = postEntry(namespace, author, kindArg, message, { tags, refs });
            out(parsed, entry, `posted ${entry.id} (${entry.kind}) by ${entry.author} @ ${entry.timestamp}`);
            return;
        }
        case 'read': {
            const namespace = requireFlag(parsed, 'namespace');
            const limit = optionalNumber(parsed, 'limit');
            const kindArg = optionalFlag(parsed, 'kind');
            if (kindArg !== undefined && !CONTEXT_KINDS.includes(kindArg)) {
                throw new Error(`Invalid --kind. Must be one of: ${CONTEXT_KINDS.join(', ')}`);
            }
            const entries = readFeed(namespace, {
                limit,
                kind: kindArg,
                author: optionalFlag(parsed, 'author'),
                since: optionalFlag(parsed, 'since'),
                contains: optionalFlag(parsed, 'contains'),
            });
            const human = entries.length === 0
                ? '(no entries)'
                : entries.map(e => `${e.timestamp} [${e.kind}] ${e.author}: ${e.message.split('\n')[0]}`).join('\n');
            out(parsed, entries, human);
            return;
        }
        case 'digest': {
            const namespace = requireFlag(parsed, 'namespace');
            const limit = optionalNumber(parsed, 'highlight-limit') ?? 5;
            const digest = digestChannel(namespace, limit);
            const human = [
                `digest ${digest.namespace}: total=${digest.total} open-q=${digest.openQuestions} open-b=${digest.openBlockers}`,
                `byKind: ${Object.entries(digest.byKind).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(' ')}`,
                `top authors: ${digest.byAuthor.slice(0, 5).map(a => `${a.author}(${a.count})`).join(' ')}`,
            ].join('\n');
            out(parsed, digest, human);
            return;
        }
        case 'open-questions': {
            const namespace = requireFlag(parsed, 'namespace');
            const open = listOpenQuestions(namespace);
            const human = open.length === 0
                ? '(no open questions)'
                : open.map(q => `${q.timestamp} [${q.id}] ${q.author}: ${q.message.split('\n')[0]}`).join('\n');
            out(parsed, open, human);
            return;
        }
        case 'list': {
            const channels = listContextNamespaces();
            const human = channels.length === 0
                ? '(no channels)'
                : channels.map(c => `${c.namespace}\t${c.entries}\t${c.lastKind ?? '-'}\t${c.lastAuthor ?? '-'}\t${c.lastAt ?? '-'}`).join('\n');
            out(parsed, channels, human);
            return;
        }
        case 'clear': {
            const namespace = requireFlag(parsed, 'namespace');
            const result = clearFeed(namespace);
            out(parsed, result, `removed ${result.removed} entries from ${namespace}`);
            return;
        }
        default:
            throw new Error(`Unknown context action "${action}". Try: post, read, digest, open-questions, list, clear`);
    }
}
function briefCmd(action, parsed) {
    switch (action) {
        case 'create': {
            const brief = createBrief({
                briefId: requireFlag(parsed, 'id'),
                namespace: requireFlag(parsed, 'namespace'),
                title: requireFlag(parsed, 'title'),
                goal: requireFlag(parsed, 'goal'),
                createdBy: requireFlag(parsed, 'created-by'),
                successCriteria: parsed.multi['success'],
                constraints: parsed.multi['constraint'],
                owners: parsed.multi['owner'],
                relatedKeys: parsed.multi['related-key'],
                relatedEntries: parsed.multi['related-entry'],
                tags: parsed.multi['tag'],
            });
            out(parsed, brief, `created brief ${brief.briefId} in ${brief.namespace} (${brief.status})`);
            return;
        }
        case 'get': {
            const brief = getBrief(requireFlag(parsed, 'namespace'), requireFlag(parsed, 'id'));
            if (!brief) {
                out(parsed, null, '(not found)');
                process.exitCode = 1;
                return;
            }
            const human = `${brief.briefId} [${brief.status}] ${brief.title}\nowners: ${brief.owners.join(', ') || '(none)'}\ngoal: ${brief.goal}`;
            out(parsed, brief, human);
            return;
        }
        case 'status': {
            const brief = updateStatus({
                namespace: requireFlag(parsed, 'namespace'),
                briefId: requireFlag(parsed, 'id'),
                status: requireFlag(parsed, 'status'),
                by: requireFlag(parsed, 'by'),
                summary: optionalFlag(parsed, 'summary'),
            });
            out(parsed, brief, `${brief.briefId} -> ${brief.status}`);
            return;
        }
        case 'amend': {
            const brief = amendBrief({
                namespace: requireFlag(parsed, 'namespace'),
                briefId: requireFlag(parsed, 'id'),
                by: requireFlag(parsed, 'by'),
                addSuccessCriteria: parsed.multi['add-success'],
                addConstraints: parsed.multi['add-constraint'],
                addOwners: parsed.multi['add-owner'],
                removeOwners: parsed.multi['remove-owner'],
                addRelatedKeys: parsed.multi['add-related-key'],
                addRelatedEntries: parsed.multi['add-related-entry'],
                addTags: parsed.multi['add-tag'],
            });
            out(parsed, brief, `amended ${brief.briefId}`);
            return;
        }
        case 'list': {
            const items = listBriefs(requireFlag(parsed, 'namespace'), {
                status: optionalFlag(parsed, 'status'),
                owner: optionalFlag(parsed, 'owner'),
                tag: optionalFlag(parsed, 'tag'),
            });
            const human = items.length === 0
                ? '(no briefs)'
                : items.map(b => `${b.briefId}\t[${b.status}]\t${b.title}\t(${b.owners.join(',') || '-'})\t${b.updatedAt}`).join('\n');
            out(parsed, items, human);
            return;
        }
        case 'delete': {
            const removed = deleteBrief(requireFlag(parsed, 'namespace'), requireFlag(parsed, 'id'));
            out(parsed, { removed }, removed ? `deleted` : `(not found)`);
            if (!removed)
                process.exitCode = 1;
            return;
        }
        default:
            throw new Error(`Unknown brief action "${action}". Try: create, get, status, amend, list, delete`);
    }
}
function presenceCmd(action, parsed) {
    switch (action) {
        case 'announce': {
            const entry = announcePresence({
                namespace: requireFlag(parsed, 'namespace'),
                agent: requireFlag(parsed, 'agent'),
                provider: requireFlag(parsed, 'provider'),
                role: optionalFlag(parsed, 'role'),
                focus: optionalFlag(parsed, 'focus'),
                briefId: optionalFlag(parsed, 'brief'),
                ttlSeconds: optionalNumber(parsed, 'ttl'),
            });
            out(parsed, entry, `announced ${entry.agent} (${entry.provider}) in ${entry.namespace} ttl=${entry.ttlSeconds}s`);
            return;
        }
        case 'list': {
            const includeStale = parsed.flags['include-stale'] === true;
            const entries = listPresence(requireFlag(parsed, 'namespace'), { includeStale });
            const human = entries.length === 0
                ? '(no presence)'
                : entries.map(e => `${e.agent}\t${e.provider}\t${e.role ?? '-'}\t${e.briefId ?? '-'}\t${e.lastSeen}\t${e.focus ?? ''}`).join('\n');
            out(parsed, entries, human);
            return;
        }
        case 'leave': {
            const removed = leavePresence(requireFlag(parsed, 'namespace'), requireFlag(parsed, 'agent'));
            out(parsed, { removed }, removed ? 'left' : '(was not present)');
            if (!removed)
                process.exitCode = 1;
            return;
        }
        case 'reap': {
            const result = reapStale();
            out(parsed, result, `reaped ${result.removed} stale entries`);
            return;
        }
        default:
            throw new Error(`Unknown presence action "${action}". Try: announce, list, leave, reap`);
    }
}
function memoryCmd(action, parsed) {
    switch (action) {
        case 'write': {
            const namespace = requireFlag(parsed, 'namespace');
            const key = requireFlag(parsed, 'key');
            const rawValue = requireFlag(parsed, 'value');
            let value = rawValue;
            try {
                value = JSON.parse(rawValue);
            }
            catch {
                // Plain string value
            }
            const ttl = optionalNumber(parsed, 'ttl');
            const entry = smWriteEntry(namespace, key, value, ttl);
            out(parsed, entry, `wrote ${entry.namespace}:${entry.key}`);
            return;
        }
        case 'read': {
            const entry = smReadEntry(requireFlag(parsed, 'namespace'), requireFlag(parsed, 'key'));
            if (!entry) {
                out(parsed, null, '(not found or expired)');
                process.exitCode = 1;
                return;
            }
            out(parsed, entry, typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value, null, 2));
            return;
        }
        case 'list': {
            const namespace = optionalFlag(parsed, 'namespace');
            if (!namespace) {
                const namespaces = smListNamespaces();
                out(parsed, namespaces, namespaces.join('\n') || '(no namespaces)');
                return;
            }
            const items = smListEntries(namespace);
            const human = items.length === 0
                ? '(no entries)'
                : items.map(i => `${i.key}\t${i.updatedAt}${i.expiresAt ? `\texpires=${i.expiresAt}` : ''}`).join('\n');
            out(parsed, items, human);
            return;
        }
        case 'delete': {
            const removed = smDeleteEntry(requireFlag(parsed, 'namespace'), requireFlag(parsed, 'key'));
            out(parsed, { removed }, removed ? 'deleted' : '(not found)');
            if (!removed)
                process.exitCode = 1;
            return;
        }
        default:
            throw new Error(`Unknown memory action "${action}". Try: write, read, list, delete`);
    }
}
// ---------------------------------------------------------------------------
// Top-level dispatch
// ---------------------------------------------------------------------------
const USAGE = `omc-mam — Multi-Agent Memory CLI (provider-agnostic)

Usage:
  omc-mam context  post|read|digest|open-questions|list|clear  [--flags]
  omc-mam brief    create|get|status|amend|list|delete         [--flags]
  omc-mam presence announce|list|leave|reap                    [--flags]
  omc-mam memory   write|read|list|delete                      [--flags]

Add --json to any command for structured JSON output.

Repeatable flags: --owner, --success, --constraint, --related-key,
                  --related-entry, --tag, --ref, --add-owner,
                  --remove-owner, --add-success, --add-constraint,
                  --add-related-key, --add-related-entry, --add-tag.

Examples:
  omc-mam context post --namespace team-alpha --author codex-1 \\
                       --kind finding --message "flaky test in auth/"
  omc-mam brief create --id b1 --namespace team-alpha \\
                       --title "Fix flaky auth tests" \\
                       --goal "Get the suite green on main" \\
                       --created-by codex-1 --owner codex-1 --owner gemini-2
  omc-mam presence announce --namespace team-alpha --agent codex-1 \\
                            --provider codex --role executor --focus "..." --ttl 600

Status enums:
  brief --status:   ${TASK_STATUSES.join(', ')}
  context --kind:   ${CONTEXT_KINDS.join(', ')}
`;
/** Public entry point — exported for testing. Returns the exit code. */
export function runMam(argv) {
    if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
        process.stdout.write(USAGE);
        return 0;
    }
    const [group, action, ...rest] = argv;
    if (!group || !action) {
        process.stderr.write(`error: command required\n\n${USAGE}`);
        return 2;
    }
    let parsed;
    try {
        parsed = parseArgs(rest);
    }
    catch (err) {
        process.stderr.write(`error: ${err.message}\n`);
        return 2;
    }
    try {
        switch (group) {
            case 'context':
            case 'ctx':
                contextCmd(action, parsed);
                break;
            case 'brief':
            case 'briefs':
                briefCmd(action, parsed);
                break;
            case 'presence':
                presenceCmd(action, parsed);
                break;
            case 'memory':
            case 'mem':
                memoryCmd(action, parsed);
                break;
            default:
                process.stderr.write(`error: unknown group "${group}"\n\n${USAGE}`);
                return 2;
        }
    }
    catch (err) {
        process.stderr.write(`error: ${err.message}\n`);
        return 1;
    }
    const ec = process.exitCode;
    return typeof ec === 'number' ? ec : 0;
}
// CLI entry — only runs when invoked directly (not when imported by tests).
// Detect "is this module the program's entry point" without relying on
// import.meta.url (kept undefined in CJS bundles).
const isDirectInvocation = (() => {
    try {
        if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
            return true;
        }
    }
    catch {
        /* not in CJS context */
    }
    return false;
})();
if (isDirectInvocation) {
    process.exit(runMam(process.argv.slice(2)));
}
//# sourceMappingURL=mam.js.map