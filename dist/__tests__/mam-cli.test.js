import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
const mockGetOmcRoot = vi.fn();
vi.mock('../lib/worktree-paths.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getOmcRoot: (...args) => mockGetOmcRoot(...args),
        validateWorkingDirectory: (dir) => dir || '/tmp',
    };
});
import { runMam } from '../cli/mam.js';
/** Capture stdout/stderr and exit code from a runMam invocation. */
function capture(argv) {
    const origStdoutWrite = process.stdout.write.bind(process.stdout);
    const origStderrWrite = process.stderr.write.bind(process.stderr);
    const origExitCode = process.exitCode;
    let stdout = '';
    let stderr = '';
    process.stdout.write = ((chunk) => {
        stdout += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
        return true;
    });
    process.stderr.write = ((chunk) => {
        stderr += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
        return true;
    });
    process.exitCode = undefined;
    let code;
    try {
        code = runMam(argv);
    }
    finally {
        process.stdout.write = origStdoutWrite;
        process.stderr.write = origStderrWrite;
        process.exitCode = origExitCode;
    }
    return { stdout, stderr, code };
}
describe('omc-mam CLI', () => {
    let testDir;
    let omcDir;
    beforeEach(() => {
        testDir = join(tmpdir(), `mam-cli-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        omcDir = join(testDir, '.omc');
        mkdirSync(omcDir, { recursive: true });
        mockGetOmcRoot.mockReturnValue(omcDir);
    });
    afterEach(() => {
        if (existsSync(testDir))
            rmSync(testDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });
    describe('help', () => {
        it('prints usage with no args', () => {
            const result = capture([]);
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('omc-mam');
            expect(result.stdout).toContain('context');
            expect(result.stdout).toContain('brief');
            expect(result.stdout).toContain('presence');
        });
        it('--help exits 0', () => {
            expect(capture(['--help']).code).toBe(0);
        });
    });
    describe('context post + read', () => {
        it('posts and reads back an entry', () => {
            const postResult = capture([
                'context', 'post',
                '--namespace', 'team-a',
                '--author', 'codex-1',
                '--kind', 'finding',
                '--message', 'flaky test in auth/',
            ]);
            expect(postResult.code).toBe(0);
            expect(postResult.stdout).toContain('posted');
            const readResult = capture(['context', 'read', '--namespace', 'team-a']);
            expect(readResult.code).toBe(0);
            expect(readResult.stdout).toContain('flaky test in auth/');
            expect(readResult.stdout).toContain('codex-1');
        });
        it('--json returns structured output', () => {
            capture(['context', 'post', '--namespace', 'team-a', '--author', 'a', '--message', 'm']);
            const result = capture(['context', 'read', '--namespace', 'team-a', '--json']);
            const parsed = JSON.parse(result.stdout);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed[0].message).toBe('m');
        });
        it('supports repeatable --tag and --ref', () => {
            const result = capture([
                'context', 'post',
                '--namespace', 'team-a',
                '--author', 'a',
                '--message', 'm',
                '--tag', 'auth',
                '--tag', 'security',
                '--ref', 'cref1',
                '--ref', 'cref2',
            ]);
            expect(result.code).toBe(0);
            const readResult = capture(['context', 'read', '--namespace', 'team-a', '--json']);
            const parsed = JSON.parse(readResult.stdout);
            expect(parsed[0].tags).toEqual(['auth', 'security']);
            expect(parsed[0].refs).toEqual(['cref1', 'cref2']);
        });
        it('rejects invalid kind', () => {
            const result = capture([
                'context', 'post',
                '--namespace', 'ns', '--author', 'a', '--kind', 'gossip', '--message', 'm',
            ]);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain('Invalid --kind');
        });
        it('reports missing required flags', () => {
            const result = capture(['context', 'post', '--namespace', 'ns', '--message', 'm']);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain('Missing required --author');
        });
    });
    describe('context digest', () => {
        it('reports totals and by-kind counts as JSON', () => {
            capture(['context', 'post', '--namespace', 'ns', '--author', 'a', '--kind', 'decision', '--message', 'd1']);
            capture(['context', 'post', '--namespace', 'ns', '--author', 'b', '--kind', 'blocker', '--message', 'b1']);
            const result = capture(['context', 'digest', '--namespace', 'ns', '--json']);
            const parsed = JSON.parse(result.stdout);
            expect(parsed.total).toBe(2);
            expect(parsed.byKind.decision).toBe(1);
            expect(parsed.byKind.blocker).toBe(1);
        });
    });
    describe('brief lifecycle', () => {
        it('create + get + status + list works end-to-end', () => {
            const create = capture([
                'brief', 'create',
                '--id', 'b1',
                '--namespace', 'team-a',
                '--title', 'Fix auth',
                '--goal', 'green tests',
                '--created-by', 'codex-1',
                '--owner', 'codex-1',
                '--owner', 'gemini-2',
                '--success', 'no quarantines',
                '--constraint', 'under 60s',
            ]);
            expect(create.code).toBe(0);
            expect(create.stdout).toContain('created brief b1');
            const get = capture(['brief', 'get', '--namespace', 'team-a', '--id', 'b1', '--json']);
            const brief = JSON.parse(get.stdout);
            expect(brief.briefId).toBe('b1');
            expect(brief.owners).toEqual(['codex-1', 'gemini-2']);
            expect(brief.successCriteria).toEqual(['no quarantines']);
            expect(brief.constraints).toEqual(['under 60s']);
            expect(brief.status).toBe('open');
            const status = capture([
                'brief', 'status',
                '--namespace', 'team-a', '--id', 'b1',
                '--status', 'in-progress', '--by', 'codex-1',
            ]);
            expect(status.code).toBe(0);
            expect(status.stdout).toContain('-> in-progress');
            const list = capture(['brief', 'list', '--namespace', 'team-a', '--json']);
            const items = JSON.parse(list.stdout);
            expect(items).toHaveLength(1);
            expect(items[0].status).toBe('in-progress');
        });
        it('brief get returns exit 1 for missing brief', () => {
            const result = capture(['brief', 'get', '--namespace', 'team-a', '--id', 'nope']);
            expect(result.code).toBe(1);
        });
    });
    describe('presence lifecycle', () => {
        it('announce + list + leave works for cross-provider agents', () => {
            capture([
                'presence', 'announce',
                '--namespace', 'team-a', '--agent', 'codex-1', '--provider', 'codex',
                '--role', 'executor', '--focus', 'fixing auth tests',
            ]);
            capture([
                'presence', 'announce',
                '--namespace', 'team-a', '--agent', 'gemini-2', '--provider', 'gemini',
                '--role', 'reviewer',
            ]);
            const list = capture(['presence', 'list', '--namespace', 'team-a', '--json']);
            const entries = JSON.parse(list.stdout);
            expect(entries).toHaveLength(2);
            expect(entries.map((e) => e.agent).sort()).toEqual(['codex-1', 'gemini-2']);
            expect(entries.find((e) => e.agent === 'codex-1').provider).toBe('codex');
            expect(entries.find((e) => e.agent === 'gemini-2').provider).toBe('gemini');
            const leave = capture(['presence', 'leave', '--namespace', 'team-a', '--agent', 'codex-1']);
            expect(leave.code).toBe(0);
            const after = capture(['presence', 'list', '--namespace', 'team-a', '--json']);
            const remaining = JSON.parse(after.stdout);
            expect(remaining).toHaveLength(1);
        });
    });
    describe('memory commands', () => {
        it('write + read + delete works', () => {
            capture(['memory', 'write', '--namespace', 'ns', '--key', 'k', '--value', '{"x":1}']);
            const read = capture(['memory', 'read', '--namespace', 'ns', '--key', 'k', '--json']);
            const entry = JSON.parse(read.stdout);
            expect(entry.value).toEqual({ x: 1 });
            const del = capture(['memory', 'delete', '--namespace', 'ns', '--key', 'k']);
            expect(del.code).toBe(0);
        });
        it('plain string values are accepted', () => {
            capture(['memory', 'write', '--namespace', 'ns', '--key', 'k', '--value', 'hello']);
            const read = capture(['memory', 'read', '--namespace', 'ns', '--key', 'k', '--json']);
            const entry = JSON.parse(read.stdout);
            expect(entry.value).toBe('hello');
        });
    });
    describe('argument parsing', () => {
        it('accepts --flag=value syntax', () => {
            const result = capture([
                'context', 'post',
                '--namespace=ns', '--author=a', '--message=hello',
            ]);
            expect(result.code).toBe(0);
        });
        it('aliases work (ctx, mem, briefs)', () => {
            expect(capture(['ctx', 'list', '--json']).code).toBe(0);
            expect(capture(['mem', 'list', '--json']).code).toBe(0);
            expect(capture(['briefs', 'list', '--namespace', 'ns', '--json']).code).toBe(0);
        });
        it('unknown group errors out', () => {
            const result = capture(['nope', 'foo']);
            expect(result.code).toBe(2);
            expect(result.stderr).toContain('unknown group');
        });
        it('unknown action errors out', () => {
            const result = capture(['context', 'launder']);
            expect(result.code).toBe(1);
            expect(result.stderr).toContain('Unknown context action');
        });
    });
});
//# sourceMappingURL=mam-cli.test.js.map