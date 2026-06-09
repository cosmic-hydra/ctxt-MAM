#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/cli/mam.ts
var mam_exports = {};
__export(mam_exports, {
  runMam: () => runMam
});
module.exports = __toCommonJS(mam_exports);

// src/lib/shared-context.ts
var import_fs4 = require("fs");
var import_path3 = require("path");

// src/lib/worktree-paths.ts
var import_crypto = require("crypto");
var import_child_process = require("child_process");
var import_fs = require("fs");
var import_os2 = require("os");
var import_path2 = require("path");

// src/utils/config-dir.ts
var import_path = require("path");
var import_os = require("os");

// src/lib/worktree-paths.ts
var WORKSPACE_MARKER = ".omc-workspace";
var OmcPaths = {
  ROOT: ".omc",
  STATE: ".omc/state",
  SESSIONS: ".omc/state/sessions",
  PLANS: ".omc/plans",
  RESEARCH: ".omc/research",
  NOTEPAD: ".omc/notepad.md",
  PROJECT_MEMORY: ".omc/project-memory.json",
  DRAFTS: ".omc/drafts",
  NOTEPADS: ".omc/notepads",
  LOGS: ".omc/logs",
  SCIENTIST: ".omc/scientist",
  AUTOPILOT: ".omc/autopilot",
  SKILLS: ".omc/skills",
  SHARED_MEMORY: ".omc/state/shared-memory",
  DEEPINIT_MANIFEST: ".omc/deepinit-manifest.json"
};
var MAX_WORKTREE_CACHE_SIZE = 8;
var worktreeCacheMap = /* @__PURE__ */ new Map();
var workspaceCacheMap = /* @__PURE__ */ new Map();
function findWorkspaceRoot(startDir) {
  if (process.env.OMC_DISABLE_MULTIREPO === "1") return null;
  const effectiveStart = startDir || process.cwd();
  let current;
  try {
    current = (0, import_path2.resolve)(effectiveStart);
  } catch {
    return null;
  }
  if (workspaceCacheMap.has(current)) {
    const cached = workspaceCacheMap.get(current) ?? null;
    workspaceCacheMap.delete(current);
    workspaceCacheMap.set(current, cached);
    return cached;
  }
  const home = (() => {
    try {
      return (0, import_path2.resolve)((0, import_os2.homedir)());
    } catch {
      return null;
    }
  })();
  let cursor = current;
  let result = null;
  while (true) {
    if (home && cursor === home) break;
    if ((0, import_fs.existsSync)((0, import_path2.join)(cursor, WORKSPACE_MARKER))) {
      result = cursor;
      break;
    }
    const parent = (0, import_path2.dirname)(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  if (workspaceCacheMap.size >= MAX_WORKTREE_CACHE_SIZE) {
    const oldest = workspaceCacheMap.keys().next().value;
    if (oldest !== void 0) workspaceCacheMap.delete(oldest);
  }
  workspaceCacheMap.set(current, result);
  return result;
}
function readWorkspaceMarkerConfig(workspaceRoot) {
  try {
    const raw = (0, import_fs.readFileSync)((0, import_path2.join)(workspaceRoot, WORKSPACE_MARKER), "utf-8").trim();
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}
function getWorktreeRoot(cwd) {
  const effectiveCwd = cwd || process.cwd();
  if (worktreeCacheMap.has(effectiveCwd)) {
    const root = worktreeCacheMap.get(effectiveCwd);
    worktreeCacheMap.delete(effectiveCwd);
    worktreeCacheMap.set(effectiveCwd, root);
    return root || null;
  }
  try {
    const root = (0, import_child_process.execSync)("git rev-parse --show-toplevel", {
      cwd: effectiveCwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 5e3
    }).trim();
    if (worktreeCacheMap.size >= MAX_WORKTREE_CACHE_SIZE) {
      const oldest = worktreeCacheMap.keys().next().value;
      if (oldest !== void 0) {
        worktreeCacheMap.delete(oldest);
      }
    }
    worktreeCacheMap.set(effectiveCwd, root);
    return root;
  } catch {
    return null;
  }
}
var dualDirWarnings = /* @__PURE__ */ new Set();
function getProjectIdentifier(worktreeRoot) {
  const root = worktreeRoot || getWorktreeRoot() || process.cwd();
  const workspaceRoot = findWorkspaceRoot(root);
  if (workspaceRoot) {
    const cfg = readWorkspaceMarkerConfig(workspaceRoot);
    if (cfg.id && typeof cfg.id === "string" && cfg.id.trim()) {
      const safeId = cfg.id.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
      const hash3 = (0, import_crypto.createHash)("sha256").update(safeId).digest("hex").slice(0, 16);
      return `${safeId}-${hash3}`;
    }
    const hash2 = (0, import_crypto.createHash)("sha256").update(workspaceRoot).digest("hex").slice(0, 16);
    const dirName2 = (0, import_path2.basename)(workspaceRoot).replace(/[^a-zA-Z0-9_-]/g, "_");
    return `${dirName2}-${hash2}`;
  }
  let source;
  try {
    const remoteUrl = (0, import_child_process.execSync)("git remote get-url origin", {
      cwd: root,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
    source = remoteUrl || root;
  } catch {
    source = root;
  }
  let primaryRoot = root;
  try {
    const commonDir = (0, import_child_process.execSync)("git rev-parse --path-format=absolute --git-common-dir", {
      cwd: root,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 5e3
    }).trim();
    const isGitDir = (0, import_path2.basename)(commonDir) === ".git";
    const isSubmodule = commonDir.includes(`${import_path2.sep}.git${import_path2.sep}modules`);
    if (isGitDir && !isSubmodule) {
      const resolved = (0, import_path2.dirname)(commonDir);
      if (resolved && resolved !== root) {
        primaryRoot = resolved;
      }
    }
  } catch {
  }
  const hash = (0, import_crypto.createHash)("sha256").update(source).digest("hex").slice(0, 16);
  const dirName = (0, import_path2.basename)(primaryRoot).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${dirName}-${hash}`;
}
function getOmcRoot(worktreeRoot) {
  const customDir = process.env.OMC_STATE_DIR;
  if (customDir) {
    const root2 = worktreeRoot || getWorktreeRoot() || process.cwd();
    const projectId = getProjectIdentifier(root2);
    const centralizedPath = (0, import_path2.join)(customDir, projectId);
    const legacyPath = (0, import_path2.join)(root2, OmcPaths.ROOT);
    const warningKey = `${legacyPath}:${centralizedPath}`;
    if (!dualDirWarnings.has(warningKey) && (0, import_fs.existsSync)(legacyPath) && (0, import_fs.existsSync)(centralizedPath)) {
      dualDirWarnings.add(warningKey);
      console.warn(
        `[omc] Both legacy state dir (${legacyPath}) and centralized state dir (${centralizedPath}) exist. Using centralized dir. Consider migrating data from the legacy dir and removing it.`
      );
    }
    return centralizedPath;
  }
  const workspaceAnchor = findWorkspaceRoot(worktreeRoot);
  if (workspaceAnchor) {
    return (0, import_path2.join)(workspaceAnchor, OmcPaths.ROOT);
  }
  const root = worktreeRoot || getWorktreeRoot() || process.cwd();
  return (0, import_path2.join)(root, OmcPaths.ROOT);
}

// src/lib/file-lock.ts
var import_fs3 = require("fs");
var path3 = __toESM(require("path"), 1);

// src/lib/atomic-write.ts
var fs = __toESM(require("fs/promises"), 1);
var fsSync = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var crypto = __toESM(require("crypto"), 1);
function ensureDirSync(dir) {
  if (fsSync.existsSync(dir)) {
    return;
  }
  try {
    fsSync.mkdirSync(dir, { recursive: true });
  } catch (err) {
    if (err.code === "EEXIST") {
      return;
    }
    throw err;
  }
}

// src/platform/index.ts
var path2 = __toESM(require("path"), 1);
var import_fs2 = require("fs");

// src/platform/process-utils.ts
var import_child_process2 = require("child_process");
var import_util = require("util");
var fsPromises = __toESM(require("fs/promises"), 1);
var execFileAsync = (0, import_util.promisify)(import_child_process2.execFile);
function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "EPERM") {
      return true;
    }
    return false;
  }
}

// src/platform/index.ts
var PLATFORM = process.platform;

// src/lib/file-lock.ts
var DEFAULT_STALE_LOCK_MS = 3e4;
var DEFAULT_RETRY_DELAY_MS = 50;
function isLockStale(lockPath, staleLockMs) {
  try {
    const stat = (0, import_fs3.statSync)(lockPath);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs < staleLockMs) return false;
    try {
      const raw = (0, import_fs3.readFileSync)(lockPath, "utf-8");
      const payload = JSON.parse(raw);
      if (payload.pid && isProcessAlive(payload.pid)) return false;
    } catch {
    }
    return true;
  } catch {
    return false;
  }
}
function tryAcquireSync(lockPath, staleLockMs) {
  ensureDirSync(path3.dirname(lockPath));
  try {
    const fd = (0, import_fs3.openSync)(
      lockPath,
      import_fs3.constants.O_CREAT | import_fs3.constants.O_EXCL | import_fs3.constants.O_WRONLY,
      384
    );
    try {
      const payload = JSON.stringify({ pid: process.pid, timestamp: Date.now() });
      (0, import_fs3.writeSync)(fd, payload, null, "utf-8");
    } catch (writeErr) {
      try {
        (0, import_fs3.closeSync)(fd);
      } catch {
      }
      try {
        (0, import_fs3.unlinkSync)(lockPath);
      } catch {
      }
      throw writeErr;
    }
    return { fd, path: lockPath };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "EEXIST") {
      if (isLockStale(lockPath, staleLockMs)) {
        try {
          (0, import_fs3.unlinkSync)(lockPath);
        } catch {
        }
        try {
          const fd = (0, import_fs3.openSync)(
            lockPath,
            import_fs3.constants.O_CREAT | import_fs3.constants.O_EXCL | import_fs3.constants.O_WRONLY,
            384
          );
          try {
            const payload = JSON.stringify({ pid: process.pid, timestamp: Date.now() });
            (0, import_fs3.writeSync)(fd, payload, null, "utf-8");
          } catch (writeErr) {
            try {
              (0, import_fs3.closeSync)(fd);
            } catch {
            }
            try {
              (0, import_fs3.unlinkSync)(lockPath);
            } catch {
            }
            throw writeErr;
          }
          return { fd, path: lockPath };
        } catch {
          return null;
        }
      }
      return null;
    }
    throw err;
  }
}
function acquireFileLockSync(lockPath, opts) {
  const staleLockMs = opts?.staleLockMs ?? DEFAULT_STALE_LOCK_MS;
  const timeoutMs = opts?.timeoutMs ?? 0;
  const retryDelayMs = opts?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const handle = tryAcquireSync(lockPath, staleLockMs);
  if (handle || timeoutMs <= 0) return handle;
  const deadline = Date.now() + timeoutMs;
  const sharedBuf = new SharedArrayBuffer(4);
  const sharedArr = new Int32Array(sharedBuf);
  while (Date.now() < deadline) {
    const waitMs = Math.min(retryDelayMs, deadline - Date.now());
    try {
      Atomics.wait(sharedArr, 0, 0, waitMs);
    } catch {
      const waitUntil = Date.now() + waitMs;
      while (Date.now() < waitUntil) {
      }
    }
    const retryHandle = tryAcquireSync(lockPath, staleLockMs);
    if (retryHandle) return retryHandle;
  }
  return null;
}
function releaseFileLockSync(handle) {
  try {
    (0, import_fs3.closeSync)(handle.fd);
  } catch {
  }
  try {
    (0, import_fs3.unlinkSync)(handle.path);
  } catch {
  }
}
function withFileLockSync(lockPath, fn, opts) {
  const handle = acquireFileLockSync(lockPath, opts);
  if (!handle) {
    throw new Error(`Failed to acquire file lock: ${lockPath}`);
  }
  try {
    return fn();
  } finally {
    releaseFileLockSync(handle);
  }
}

// src/lib/shared-context.ts
var CONTEXT_KINDS = [
  "note",
  "decision",
  "finding",
  "blocker",
  "handoff",
  "question",
  "answer",
  "plan"
];
var SHARED_CONTEXT_DIR = "state/shared-context";
var DEFAULT_READ_LIMIT = 50;
var MAX_READ_LIMIT = 500;
var MAX_MESSAGE_LENGTH = 8192;
function validateNamespace(namespace) {
  if (!namespace || namespace.length > 128) {
    throw new Error(`Invalid namespace: must be 1-128 characters (got ${namespace.length})`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(namespace)) {
    throw new Error(`Invalid namespace: must be alphanumeric with hyphens/underscores/dots (got "${namespace}")`);
  }
  if (namespace.includes("..")) {
    throw new Error("Invalid namespace: path traversal not allowed");
  }
}
function validateAuthor(author) {
  if (!author || author.length > 128) {
    throw new Error(`Invalid author: must be 1-128 characters (got ${author.length})`);
  }
  if (/[\r\n]/.test(author)) {
    throw new Error("Invalid author: must not contain newlines");
  }
}
function validateMessage(message) {
  if (!message || message.length === 0) {
    throw new Error("Invalid message: must not be empty");
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Invalid message: must be <= ${MAX_MESSAGE_LENGTH} characters (got ${message.length})`);
  }
}
function getFeedPath(namespace, worktreeRoot) {
  validateNamespace(namespace);
  const omcRoot = getOmcRoot(worktreeRoot);
  return (0, import_path3.join)(omcRoot, SHARED_CONTEXT_DIR, `${namespace}.jsonl`);
}
function ensureContextDir(worktreeRoot) {
  const omcRoot = getOmcRoot(worktreeRoot);
  const dir = (0, import_path3.join)(omcRoot, SHARED_CONTEXT_DIR);
  if (!(0, import_fs4.existsSync)(dir)) {
    (0, import_fs4.mkdirSync)(dir, { recursive: true });
  }
  return dir;
}
var _idCounter = 0;
function generateId() {
  const time = Date.now().toString(36);
  const counter = (_idCounter++ % 1296).toString(36).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6);
  return `c${time}${counter}${rand}`;
}
function postEntry(namespace, author, kind, message, opts, worktreeRoot) {
  validateNamespace(namespace);
  validateAuthor(author);
  validateMessage(message);
  if (!CONTEXT_KINDS.includes(kind)) {
    throw new Error(`Invalid kind: must be one of ${CONTEXT_KINDS.join(", ")} (got "${kind}")`);
  }
  ensureContextDir(worktreeRoot);
  const filePath = getFeedPath(namespace, worktreeRoot);
  const entry = {
    id: generateId(),
    namespace,
    author,
    kind,
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (opts?.tags && opts.tags.length > 0) {
    entry.tags = opts.tags.map(String);
  }
  if (opts?.refs && opts.refs.length > 0) {
    entry.refs = opts.refs.map(String);
  }
  const line = JSON.stringify(entry) + "\n";
  const lockPath = filePath + ".lock";
  const doAppend = () => (0, import_fs4.appendFileSync)(filePath, line, { mode: 384 });
  try {
    withFileLockSync(lockPath, doAppend, { timeoutMs: 500, retryDelayMs: 25 });
  } catch {
    doAppend();
  }
  return entry;
}
function parseFeed(filePath) {
  if (!(0, import_fs4.existsSync)(filePath)) return [];
  let raw;
  try {
    raw = (0, import_fs4.readFileSync)(filePath, "utf-8");
  } catch {
    return [];
  }
  const entries = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.message === "string" && typeof parsed.timestamp === "string") {
        entries.push(parsed);
      }
    } catch {
    }
  }
  return entries;
}
function readFeed(namespace, opts = {}, worktreeRoot) {
  const filePath = getFeedPath(namespace, worktreeRoot);
  let entries = parseFeed(filePath);
  if (opts.author) {
    entries = entries.filter((e) => e.author === opts.author);
  }
  if (opts.kind) {
    entries = entries.filter((e) => e.kind === opts.kind);
  }
  if (opts.since) {
    const sinceMs = new Date(opts.since).getTime();
    if (!Number.isNaN(sinceMs)) {
      entries = entries.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return Number.isNaN(t) ? false : t >= sinceMs;
      });
    }
  }
  if (opts.contains) {
    const needle = opts.contains.toLowerCase();
    entries = entries.filter((e) => e.message.toLowerCase().includes(needle));
  }
  const limit = Math.min(
    Math.max(1, opts.limit ?? DEFAULT_READ_LIMIT),
    MAX_READ_LIMIT
  );
  return entries.length > limit ? entries.slice(entries.length - limit) : entries;
}
function clearFeed(namespace, worktreeRoot) {
  const filePath = getFeedPath(namespace, worktreeRoot);
  if (!(0, import_fs4.existsSync)(filePath)) return { removed: 0 };
  const removed = parseFeed(filePath).length;
  try {
    (0, import_fs4.unlinkSync)(filePath);
  } catch {
    return { removed: 0 };
  }
  try {
    const lockPath = filePath + ".lock";
    if ((0, import_fs4.existsSync)(lockPath)) (0, import_fs4.unlinkSync)(lockPath);
  } catch {
  }
  return { removed };
}
function digestChannel(namespace, highlightLimit = 5, worktreeRoot) {
  const filePath = getFeedPath(namespace, worktreeRoot);
  const entries = parseFeed(filePath);
  const limit = Math.min(Math.max(1, highlightLimit), 20);
  const byKind = {
    note: 0,
    decision: 0,
    finding: 0,
    blocker: 0,
    handoff: 0,
    question: 0,
    answer: 0,
    plan: 0
  };
  const authorCounts = /* @__PURE__ */ new Map();
  const answeredIds = /* @__PURE__ */ new Set();
  const referencedIds = /* @__PURE__ */ new Set();
  for (const e of entries) {
    if (e.kind in byKind) byKind[e.kind]++;
    authorCounts.set(e.author, (authorCounts.get(e.author) ?? 0) + 1);
    if (e.refs && e.refs.length > 0) {
      for (const r of e.refs) {
        referencedIds.add(r);
        if (e.kind === "answer") answeredIds.add(r);
      }
    }
  }
  const openQuestionEntries = entries.filter((e) => e.kind === "question" && !answeredIds.has(e.id));
  const openBlockerEntries = entries.filter((e) => e.kind === "blocker" && !referencedIds.has(e.id));
  const tailByKind = (k) => entries.filter((e) => e.kind === k).slice(-limit).reverse();
  return {
    namespace,
    total: entries.length,
    byKind,
    byAuthor: [...authorCounts.entries()].map(([author, count]) => ({ author, count })).sort((a, b) => b.count - a.count || a.author.localeCompare(b.author)),
    openQuestions: openQuestionEntries.length,
    openBlockers: openBlockerEntries.length,
    firstAt: entries[0]?.timestamp,
    lastAt: entries[entries.length - 1]?.timestamp,
    highlights: {
      decisions: tailByKind("decision"),
      blockers: openBlockerEntries.slice(-limit).reverse(),
      handoffs: tailByKind("handoff"),
      openQuestions: openQuestionEntries.slice(-limit).reverse()
    }
  };
}
function listOpenQuestions(namespace, worktreeRoot) {
  const entries = parseFeed(getFeedPath(namespace, worktreeRoot));
  const answered = /* @__PURE__ */ new Set();
  for (const e of entries) {
    if (e.kind === "answer" && e.refs) {
      for (const r of e.refs) answered.add(r);
    }
  }
  return entries.filter((e) => e.kind === "question" && !answered.has(e.id));
}
function listContextNamespaces(worktreeRoot) {
  const omcRoot = getOmcRoot(worktreeRoot);
  const dir = (0, import_path3.join)(omcRoot, SHARED_CONTEXT_DIR);
  if (!(0, import_fs4.existsSync)(dir)) return [];
  let files;
  try {
    files = (0, import_fs4.readdirSync)(dir).filter((f) => f.endsWith(".jsonl"));
  } catch {
    return [];
  }
  const summaries = [];
  for (const file of files) {
    const namespace = file.slice(0, -".jsonl".length);
    const entries = parseFeed((0, import_path3.join)(dir, file));
    const last = entries[entries.length - 1];
    summaries.push({
      namespace,
      entries: entries.length,
      lastAuthor: last?.author,
      lastKind: last?.kind,
      lastAt: last?.timestamp
    });
  }
  return summaries.sort((a, b) => a.namespace.localeCompare(b.namespace));
}

// src/lib/task-brief.ts
var import_fs5 = require("fs");
var import_path4 = require("path");
var TASK_STATUSES = [
  "open",
  "in-progress",
  "blocked",
  "done",
  "cancelled"
];
var TASK_BRIEFS_DIR = "state/task-briefs";
var MAX_TITLE_LENGTH = 256;
var MAX_GOAL_LENGTH = 4096;
var MAX_ITEM_LENGTH = 1024;
var MAX_ITEMS_PER_LIST = 64;
function validateIdentifier(value, kind) {
  if (!value || value.length > 128) {
    throw new Error(`Invalid ${kind}: must be 1-128 characters (got ${value.length})`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value)) {
    throw new Error(`Invalid ${kind}: must be alphanumeric with hyphens/underscores/dots (got "${value}")`);
  }
  if (value.includes("..")) {
    throw new Error(`Invalid ${kind}: path traversal not allowed`);
  }
}
function validateText(value, field, max) {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}: must be a string`);
  }
  if (value.length === 0) {
    throw new Error(`Invalid ${field}: must not be empty`);
  }
  if (value.length > max) {
    throw new Error(`Invalid ${field}: must be <= ${max} characters (got ${value.length})`);
  }
}
function validateList(items, field, max) {
  if (!items) return [];
  if (!Array.isArray(items)) {
    throw new Error(`Invalid ${field}: must be an array of strings`);
  }
  if (items.length > MAX_ITEMS_PER_LIST) {
    throw new Error(`Invalid ${field}: must have at most ${MAX_ITEMS_PER_LIST} items (got ${items.length})`);
  }
  for (const item of items) {
    if (typeof item !== "string" || item.length === 0) {
      throw new Error(`Invalid ${field}: items must be non-empty strings`);
    }
    if (item.length > max) {
      throw new Error(`Invalid ${field}: items must be <= ${max} characters`);
    }
  }
  return items.map(String);
}
function getNamespaceDir(namespace, worktreeRoot) {
  validateIdentifier(namespace, "namespace");
  return (0, import_path4.join)(getOmcRoot(worktreeRoot), TASK_BRIEFS_DIR, namespace);
}
function getBriefPath(namespace, briefId, worktreeRoot) {
  validateIdentifier(briefId, "briefId");
  return (0, import_path4.join)(getNamespaceDir(namespace, worktreeRoot), `${briefId}.json`);
}
function ensureNamespaceDir(namespace, worktreeRoot) {
  const dir = getNamespaceDir(namespace, worktreeRoot);
  if (!(0, import_fs5.existsSync)(dir)) {
    (0, import_fs5.mkdirSync)(dir, { recursive: true });
  }
  return dir;
}
function createBrief(args, worktreeRoot) {
  validateIdentifier(args.namespace, "namespace");
  validateIdentifier(args.briefId, "briefId");
  validateText(args.title, "title", MAX_TITLE_LENGTH);
  validateText(args.goal, "goal", MAX_GOAL_LENGTH);
  validateText(args.createdBy, "createdBy", 128);
  const successCriteria = validateList(args.successCriteria, "successCriteria", MAX_ITEM_LENGTH);
  const constraints = validateList(args.constraints, "constraints", MAX_ITEM_LENGTH);
  const owners = validateList(args.owners, "owners", 128);
  for (const owner of owners) validateIdentifier(owner, "owner");
  const relatedKeys = validateList(args.relatedKeys, "relatedKeys", MAX_ITEM_LENGTH);
  const relatedEntries = validateList(args.relatedEntries, "relatedEntries", 128);
  const tags = validateList(args.tags, "tags", 64);
  for (const tag of tags) validateIdentifier(tag, "tag");
  ensureNamespaceDir(args.namespace, worktreeRoot);
  const filePath = getBriefPath(args.namespace, args.briefId, worktreeRoot);
  if ((0, import_fs5.existsSync)(filePath)) {
    throw new Error(`Brief "${args.briefId}" already exists in namespace "${args.namespace}". Use updateBrief to amend.`);
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const brief = {
    briefId: args.briefId,
    namespace: args.namespace,
    title: args.title,
    goal: args.goal,
    successCriteria,
    constraints,
    owners,
    status: "open",
    statusHistory: [{ at: now, by: args.createdBy, status: "open", summary: "created" }],
    createdBy: args.createdBy,
    createdAt: now,
    updatedAt: now
  };
  if (relatedKeys.length > 0) brief.relatedKeys = relatedKeys;
  if (relatedEntries.length > 0) brief.relatedEntries = relatedEntries;
  if (tags.length > 0) brief.tags = tags;
  writeBriefAtomic(filePath, brief);
  return brief;
}
function getBrief(namespace, briefId, worktreeRoot) {
  validateIdentifier(namespace, "namespace");
  validateIdentifier(briefId, "briefId");
  const filePath = getBriefPath(namespace, briefId, worktreeRoot);
  if (!(0, import_fs5.existsSync)(filePath)) return null;
  try {
    return JSON.parse((0, import_fs5.readFileSync)(filePath, "utf-8"));
  } catch {
    return null;
  }
}
function updateStatus(args, worktreeRoot) {
  validateIdentifier(args.namespace, "namespace");
  validateIdentifier(args.briefId, "briefId");
  validateText(args.by, "by", 128);
  if (!TASK_STATUSES.includes(args.status)) {
    throw new Error(`Invalid status: must be one of ${TASK_STATUSES.join(", ")} (got "${args.status}")`);
  }
  if (args.summary !== void 0) {
    validateText(args.summary, "summary", MAX_ITEM_LENGTH);
  }
  const filePath = getBriefPath(args.namespace, args.briefId, worktreeRoot);
  if (!(0, import_fs5.existsSync)(filePath)) {
    throw new Error(`Brief "${args.briefId}" not found in namespace "${args.namespace}".`);
  }
  const lockPath = filePath + ".lock";
  const mutate = () => {
    const current = JSON.parse((0, import_fs5.readFileSync)(filePath, "utf-8"));
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const event = { at: now, by: args.by, status: args.status };
    if (args.summary) event.summary = args.summary;
    current.statusHistory = [...current.statusHistory ?? [], event];
    current.status = args.status;
    current.updatedAt = now;
    writeBriefAtomic(filePath, current);
    return current;
  };
  try {
    return withFileLockSync(lockPath, mutate, { timeoutMs: 500, retryDelayMs: 25 });
  } catch {
    return mutate();
  }
}
function amendBrief(args, worktreeRoot) {
  validateIdentifier(args.namespace, "namespace");
  validateIdentifier(args.briefId, "briefId");
  validateText(args.by, "by", 128);
  const addSC = validateList(args.addSuccessCriteria, "addSuccessCriteria", MAX_ITEM_LENGTH);
  const addC = validateList(args.addConstraints, "addConstraints", MAX_ITEM_LENGTH);
  const addO = validateList(args.addOwners, "addOwners", 128);
  for (const o of addO) validateIdentifier(o, "owner");
  const removeO = validateList(args.removeOwners, "removeOwners", 128);
  for (const o of removeO) validateIdentifier(o, "owner");
  const addRK = validateList(args.addRelatedKeys, "addRelatedKeys", MAX_ITEM_LENGTH);
  const addRE = validateList(args.addRelatedEntries, "addRelatedEntries", 128);
  const addT = validateList(args.addTags, "addTags", 64);
  for (const t of addT) validateIdentifier(t, "tag");
  const filePath = getBriefPath(args.namespace, args.briefId, worktreeRoot);
  if (!(0, import_fs5.existsSync)(filePath)) {
    throw new Error(`Brief "${args.briefId}" not found in namespace "${args.namespace}".`);
  }
  const lockPath = filePath + ".lock";
  const mutate = () => {
    const current = JSON.parse((0, import_fs5.readFileSync)(filePath, "utf-8"));
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const dedupe = (arr) => Array.from(new Set(arr));
    if (addSC.length > 0) current.successCriteria = dedupe([...current.successCriteria, ...addSC]);
    if (addC.length > 0) current.constraints = dedupe([...current.constraints, ...addC]);
    if (addO.length > 0) current.owners = dedupe([...current.owners, ...addO]);
    if (removeO.length > 0) current.owners = current.owners.filter((o) => !removeO.includes(o));
    if (addRK.length > 0) {
      current.relatedKeys = dedupe([...current.relatedKeys ?? [], ...addRK]);
    }
    if (addRE.length > 0) {
      current.relatedEntries = dedupe([...current.relatedEntries ?? [], ...addRE]);
    }
    if (addT.length > 0) {
      current.tags = dedupe([...current.tags ?? [], ...addT]);
    }
    current.statusHistory = [
      ...current.statusHistory ?? [],
      { at: now, by: args.by, status: current.status, summary: "amended" }
    ];
    current.updatedAt = now;
    writeBriefAtomic(filePath, current);
    return current;
  };
  try {
    return withFileLockSync(lockPath, mutate, { timeoutMs: 500, retryDelayMs: 25 });
  } catch {
    return mutate();
  }
}
function listBriefs(namespace, opts = {}, worktreeRoot) {
  validateIdentifier(namespace, "namespace");
  const dir = getNamespaceDir(namespace, worktreeRoot);
  if (!(0, import_fs5.existsSync)(dir)) return [];
  let files;
  try {
    files = (0, import_fs5.readdirSync)(dir).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const items = [];
  for (const file of files) {
    try {
      const brief = JSON.parse((0, import_fs5.readFileSync)((0, import_path4.join)(dir, file), "utf-8"));
      if (opts.status && brief.status !== opts.status) continue;
      if (opts.owner && !brief.owners.includes(opts.owner)) continue;
      if (opts.tag && !(brief.tags ?? []).includes(opts.tag)) continue;
      items.push({
        briefId: brief.briefId,
        title: brief.title,
        status: brief.status,
        owners: brief.owners,
        updatedAt: brief.updatedAt
      });
    } catch {
    }
  }
  return items.sort((a, b) => a.updatedAt > b.updatedAt ? -1 : a.updatedAt < b.updatedAt ? 1 : 0);
}
function deleteBrief(namespace, briefId, worktreeRoot) {
  const filePath = getBriefPath(namespace, briefId, worktreeRoot);
  if (!(0, import_fs5.existsSync)(filePath)) return false;
  try {
    (0, import_fs5.unlinkSync)(filePath);
    return true;
  } catch {
    return false;
  }
}
function writeBriefAtomic(filePath, brief) {
  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  (0, import_fs5.writeFileSync)(tmpPath, JSON.stringify(brief, null, 2), { mode: 384 });
  (0, import_fs5.renameSync)(tmpPath, filePath);
}

// src/lib/agent-presence.ts
var import_fs6 = require("fs");
var import_path5 = require("path");
var PRESENCE_DIR = "state/agent-presence";
var DEFAULT_PRESENCE_TTL_SECONDS = 5 * 60;
var MAX_PRESENCE_TTL_SECONDS = 60 * 60;
function validateIdentifier2(value, kind) {
  if (!value || value.length > 128) {
    throw new Error(`Invalid ${kind}: must be 1-128 characters (got ${value.length})`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value)) {
    throw new Error(`Invalid ${kind}: must be alphanumeric with hyphens/underscores/dots/colons (got "${value}")`);
  }
  if (value.includes("..")) {
    throw new Error(`Invalid ${kind}: path traversal not allowed`);
  }
}
function getNamespaceDir2(namespace, worktreeRoot) {
  validateIdentifier2(namespace, "namespace");
  return (0, import_path5.join)(getOmcRoot(worktreeRoot), PRESENCE_DIR, namespace);
}
function getEntryPath(namespace, agent, worktreeRoot) {
  validateIdentifier2(agent, "agent");
  const safeAgent = agent.replace(/:/g, "_");
  return (0, import_path5.join)(getNamespaceDir2(namespace, worktreeRoot), `${safeAgent}.json`);
}
function ensureNamespaceDir2(namespace, worktreeRoot) {
  const dir = getNamespaceDir2(namespace, worktreeRoot);
  if (!(0, import_fs6.existsSync)(dir)) {
    (0, import_fs6.mkdirSync)(dir, { recursive: true });
  }
  return dir;
}
function isStale(entry, now = Date.now()) {
  const lastSeen = new Date(entry.lastSeen).getTime();
  if (Number.isNaN(lastSeen)) return true;
  const ttl = (entry.ttlSeconds ?? DEFAULT_PRESENCE_TTL_SECONDS) * 1e3;
  return now > lastSeen + ttl;
}
function announcePresence(args, worktreeRoot) {
  validateIdentifier2(args.namespace, "namespace");
  validateIdentifier2(args.agent, "agent");
  validateIdentifier2(args.provider, "provider");
  let ttl = args.ttlSeconds ?? DEFAULT_PRESENCE_TTL_SECONDS;
  if (!Number.isFinite(ttl) || ttl <= 0) ttl = DEFAULT_PRESENCE_TTL_SECONDS;
  if (ttl > MAX_PRESENCE_TTL_SECONDS) ttl = MAX_PRESENCE_TTL_SECONDS;
  if (args.role !== void 0 && args.role.length > 128) {
    throw new Error("Invalid role: must be <= 128 characters");
  }
  if (args.focus !== void 0 && args.focus.length > 512) {
    throw new Error("Invalid focus: must be <= 512 characters");
  }
  if (args.briefId !== void 0) validateIdentifier2(args.briefId, "agent");
  ensureNamespaceDir2(args.namespace, worktreeRoot);
  const filePath = getEntryPath(args.namespace, args.agent, worktreeRoot);
  const entry = {
    agent: args.agent,
    namespace: args.namespace,
    provider: args.provider,
    lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
    ttlSeconds: ttl
  };
  if (args.role !== void 0 && args.role.length > 0) entry.role = args.role;
  if (args.focus !== void 0 && args.focus.length > 0) entry.focus = args.focus;
  if (args.briefId !== void 0) entry.briefId = args.briefId;
  const lockPath = filePath + ".lock";
  const doWrite = () => {
    const tmp = `${filePath}.tmp.${process.pid}.${Date.now()}`;
    (0, import_fs6.writeFileSync)(tmp, JSON.stringify(entry, null, 2), { mode: 384 });
    (0, import_fs6.renameSync)(tmp, filePath);
  };
  try {
    withFileLockSync(lockPath, doWrite, { timeoutMs: 500, retryDelayMs: 25 });
  } catch {
    doWrite();
  }
  return entry;
}
function listPresence(namespace, opts = {}, worktreeRoot) {
  validateIdentifier2(namespace, "namespace");
  const dir = getNamespaceDir2(namespace, worktreeRoot);
  if (!(0, import_fs6.existsSync)(dir)) return [];
  let files;
  try {
    files = (0, import_fs6.readdirSync)(dir).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const now = Date.now();
  const entries = [];
  for (const file of files) {
    const filePath = (0, import_path5.join)(dir, file);
    let entry = null;
    try {
      entry = JSON.parse((0, import_fs6.readFileSync)(filePath, "utf-8"));
    } catch {
      try {
        (0, import_fs6.unlinkSync)(filePath);
      } catch {
      }
      continue;
    }
    if (isStale(entry, now)) {
      if (!opts.includeStale) {
        try {
          (0, import_fs6.unlinkSync)(filePath);
        } catch {
        }
        continue;
      }
    }
    entries.push(entry);
  }
  return entries.sort((a, b) => a.agent.localeCompare(b.agent));
}
function leavePresence(namespace, agent, worktreeRoot) {
  const filePath = getEntryPath(namespace, agent, worktreeRoot);
  if (!(0, import_fs6.existsSync)(filePath)) return false;
  try {
    (0, import_fs6.unlinkSync)(filePath);
    return true;
  } catch {
    return false;
  }
}
function reapStale(worktreeRoot) {
  const root = (0, import_path5.join)(getOmcRoot(worktreeRoot), PRESENCE_DIR);
  if (!(0, import_fs6.existsSync)(root)) return { removed: 0 };
  let namespaces;
  try {
    namespaces = (0, import_fs6.readdirSync)(root, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return { removed: 0 };
  }
  const now = Date.now();
  let removed = 0;
  for (const ns of namespaces) {
    const dir = (0, import_path5.join)(root, ns);
    let files;
    try {
      files = (0, import_fs6.readdirSync)(dir).filter((f) => f.endsWith(".json"));
    } catch {
      continue;
    }
    for (const file of files) {
      const filePath = (0, import_path5.join)(dir, file);
      try {
        const entry = JSON.parse((0, import_fs6.readFileSync)(filePath, "utf-8"));
        if (isStale(entry, now)) {
          (0, import_fs6.unlinkSync)(filePath);
          removed++;
        }
      } catch {
        try {
          (0, import_fs6.unlinkSync)(filePath);
          removed++;
        } catch {
        }
      }
    }
  }
  return { removed };
}

// src/lib/shared-memory.ts
var import_fs7 = require("fs");
var import_path6 = require("path");
var SHARED_MEMORY_DIR = "state/shared-memory";
function validateNamespace2(namespace) {
  if (!namespace || namespace.length > 128) {
    throw new Error(`Invalid namespace: must be 1-128 characters (got ${namespace.length})`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(namespace)) {
    throw new Error(`Invalid namespace: must be alphanumeric with hyphens/underscores/dots (got "${namespace}")`);
  }
  if (namespace.includes("..")) {
    throw new Error("Invalid namespace: path traversal not allowed");
  }
}
function validateKey(key) {
  if (!key || key.length > 128) {
    throw new Error(`Invalid key: must be 1-128 characters (got ${key.length})`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(key)) {
    throw new Error(`Invalid key: must be alphanumeric with hyphens/underscores/dots (got "${key}")`);
  }
  if (key.includes("..")) {
    throw new Error("Invalid key: path traversal not allowed");
  }
}
function getNamespaceDir3(namespace, worktreeRoot) {
  validateNamespace2(namespace);
  const omcRoot = getOmcRoot(worktreeRoot);
  return (0, import_path6.join)(omcRoot, SHARED_MEMORY_DIR, namespace);
}
function getEntryPath2(namespace, key, worktreeRoot) {
  validateKey(key);
  return (0, import_path6.join)(getNamespaceDir3(namespace, worktreeRoot), `${key}.json`);
}
function ensureNamespaceDir3(namespace, worktreeRoot) {
  const dir = getNamespaceDir3(namespace, worktreeRoot);
  if (!(0, import_fs7.existsSync)(dir)) {
    (0, import_fs7.mkdirSync)(dir, { recursive: true });
  }
  return dir;
}
function isExpired(entry) {
  if (!entry.expiresAt) return false;
  return new Date(entry.expiresAt).getTime() <= Date.now();
}
function writeEntry(namespace, key, value, ttl, worktreeRoot) {
  ensureNamespaceDir3(namespace, worktreeRoot);
  const filePath = getEntryPath2(namespace, key, worktreeRoot);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const lockPath = filePath + ".lock";
  const doWrite = () => {
    let existingCreatedAt = now;
    if ((0, import_fs7.existsSync)(filePath)) {
      try {
        const existing = JSON.parse((0, import_fs7.readFileSync)(filePath, "utf-8"));
        existingCreatedAt = existing.createdAt || now;
      } catch {
      }
    }
    const entry = {
      key,
      value,
      namespace,
      createdAt: existingCreatedAt,
      updatedAt: now
    };
    if (ttl && ttl > 0) {
      entry.ttl = ttl;
      entry.expiresAt = new Date(Date.now() + ttl * 1e3).toISOString();
    }
    const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
    (0, import_fs7.writeFileSync)(tmpPath, JSON.stringify(entry, null, 2), "utf-8");
    (0, import_fs7.renameSync)(tmpPath, filePath);
    try {
      const legacyTmp = filePath + ".tmp";
      if ((0, import_fs7.existsSync)(legacyTmp)) (0, import_fs7.unlinkSync)(legacyTmp);
    } catch {
    }
    return entry;
  };
  try {
    return withFileLockSync(lockPath, doWrite, { timeoutMs: 500, retryDelayMs: 25 });
  } catch {
    return doWrite();
  }
}
function readEntry(namespace, key, worktreeRoot) {
  validateNamespace2(namespace);
  validateKey(key);
  const filePath = getEntryPath2(namespace, key, worktreeRoot);
  if (!(0, import_fs7.existsSync)(filePath)) return null;
  try {
    const entry = JSON.parse((0, import_fs7.readFileSync)(filePath, "utf-8"));
    if (isExpired(entry)) {
      try {
        (0, import_fs7.unlinkSync)(filePath);
      } catch {
      }
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}
function listEntries(namespace, worktreeRoot) {
  validateNamespace2(namespace);
  const dir = getNamespaceDir3(namespace, worktreeRoot);
  if (!(0, import_fs7.existsSync)(dir)) return [];
  const items = [];
  try {
    const files = (0, import_fs7.readdirSync)(dir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const filePath = (0, import_path6.join)(dir, file);
        const entry = JSON.parse((0, import_fs7.readFileSync)(filePath, "utf-8"));
        if (!isExpired(entry)) {
          items.push({
            key: entry.key,
            updatedAt: entry.updatedAt,
            expiresAt: entry.expiresAt
          });
        }
      } catch {
      }
    }
  } catch {
  }
  return items.sort((a, b) => a.key.localeCompare(b.key));
}
function deleteEntry(namespace, key, worktreeRoot) {
  validateNamespace2(namespace);
  validateKey(key);
  const filePath = getEntryPath2(namespace, key, worktreeRoot);
  if (!(0, import_fs7.existsSync)(filePath)) return false;
  try {
    (0, import_fs7.unlinkSync)(filePath);
    return true;
  } catch {
    return false;
  }
}
function listNamespaces(worktreeRoot) {
  const omcRoot = getOmcRoot(worktreeRoot);
  const sharedMemDir = (0, import_path6.join)(omcRoot, SHARED_MEMORY_DIR);
  if (!(0, import_fs7.existsSync)(sharedMemDir)) return [];
  try {
    const entries = (0, import_fs7.readdirSync)(sharedMemDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

// src/cli/mam.ts
var REPEATABLE_FLAGS = /* @__PURE__ */ new Set([
  "owner",
  "success",
  "constraint",
  "related-key",
  "related-entry",
  "tag",
  "ref",
  "add-owner",
  "remove-owner",
  "add-success",
  "add-constraint",
  "add-related-key",
  "add-related-entry",
  "add-tag"
]);
function parseArgs(argv) {
  const positional = [];
  const flags = {};
  const multi = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      let name;
      let value;
      if (eq !== -1) {
        name = a.slice(2, eq);
        value = a.slice(eq + 1);
      } else {
        name = a.slice(2);
        const peek = argv[i + 1];
        if (peek !== void 0 && !peek.startsWith("--")) {
          value = peek;
          i++;
        }
      }
      if (REPEATABLE_FLAGS.has(name)) {
        if (value === void 0) {
          throw new Error(`Flag --${name} requires a value`);
        }
        multi[name] = [...multi[name] ?? [], value];
      } else if (value === void 0) {
        flags[name] = true;
      } else {
        flags[name] = value;
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags, multi };
}
function requireFlag(parsed, name) {
  const v = parsed.flags[name];
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`Missing required --${name}`);
  }
  return v;
}
function optionalFlag(parsed, name) {
  const v = parsed.flags[name];
  return typeof v === "string" && v.length > 0 ? v : void 0;
}
function optionalNumber(parsed, name) {
  const v = optionalFlag(parsed, name);
  if (v === void 0) return void 0;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`--${name} must be a number (got "${v}")`);
  return n;
}
function jsonOutput(parsed) {
  return parsed.flags.json === true || parsed.flags.json === "true";
}
function out(parsed, structured, human) {
  if (jsonOutput(parsed)) {
    process.stdout.write(JSON.stringify(structured, null, 2) + "\n");
  } else {
    process.stdout.write(human + "\n");
  }
}
function contextCmd(action, parsed) {
  switch (action) {
    case "post": {
      const namespace = requireFlag(parsed, "namespace");
      const author = requireFlag(parsed, "author");
      const message = requireFlag(parsed, "message");
      const kindArg = optionalFlag(parsed, "kind") ?? "note";
      if (!CONTEXT_KINDS.includes(kindArg)) {
        throw new Error(`Invalid --kind. Must be one of: ${CONTEXT_KINDS.join(", ")}`);
      }
      const tags = parsed.multi["tag"];
      const refs = parsed.multi["ref"];
      const entry = postEntry(namespace, author, kindArg, message, { tags, refs });
      out(parsed, entry, `posted ${entry.id} (${entry.kind}) by ${entry.author} @ ${entry.timestamp}`);
      return;
    }
    case "read": {
      const namespace = requireFlag(parsed, "namespace");
      const limit = optionalNumber(parsed, "limit");
      const kindArg = optionalFlag(parsed, "kind");
      if (kindArg !== void 0 && !CONTEXT_KINDS.includes(kindArg)) {
        throw new Error(`Invalid --kind. Must be one of: ${CONTEXT_KINDS.join(", ")}`);
      }
      const entries = readFeed(namespace, {
        limit,
        kind: kindArg,
        author: optionalFlag(parsed, "author"),
        since: optionalFlag(parsed, "since"),
        contains: optionalFlag(parsed, "contains")
      });
      const human = entries.length === 0 ? "(no entries)" : entries.map((e) => `${e.timestamp} [${e.kind}] ${e.author}: ${e.message.split("\n")[0]}`).join("\n");
      out(parsed, entries, human);
      return;
    }
    case "digest": {
      const namespace = requireFlag(parsed, "namespace");
      const limit = optionalNumber(parsed, "highlight-limit") ?? 5;
      const digest = digestChannel(namespace, limit);
      const human = [
        `digest ${digest.namespace}: total=${digest.total} open-q=${digest.openQuestions} open-b=${digest.openBlockers}`,
        `byKind: ${Object.entries(digest.byKind).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(" ")}`,
        `top authors: ${digest.byAuthor.slice(0, 5).map((a) => `${a.author}(${a.count})`).join(" ")}`
      ].join("\n");
      out(parsed, digest, human);
      return;
    }
    case "open-questions": {
      const namespace = requireFlag(parsed, "namespace");
      const open2 = listOpenQuestions(namespace);
      const human = open2.length === 0 ? "(no open questions)" : open2.map((q) => `${q.timestamp} [${q.id}] ${q.author}: ${q.message.split("\n")[0]}`).join("\n");
      out(parsed, open2, human);
      return;
    }
    case "list": {
      const channels = listContextNamespaces();
      const human = channels.length === 0 ? "(no channels)" : channels.map((c) => `${c.namespace}	${c.entries}	${c.lastKind ?? "-"}	${c.lastAuthor ?? "-"}	${c.lastAt ?? "-"}`).join("\n");
      out(parsed, channels, human);
      return;
    }
    case "clear": {
      const namespace = requireFlag(parsed, "namespace");
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
    case "create": {
      const brief = createBrief({
        briefId: requireFlag(parsed, "id"),
        namespace: requireFlag(parsed, "namespace"),
        title: requireFlag(parsed, "title"),
        goal: requireFlag(parsed, "goal"),
        createdBy: requireFlag(parsed, "created-by"),
        successCriteria: parsed.multi["success"],
        constraints: parsed.multi["constraint"],
        owners: parsed.multi["owner"],
        relatedKeys: parsed.multi["related-key"],
        relatedEntries: parsed.multi["related-entry"],
        tags: parsed.multi["tag"]
      });
      out(parsed, brief, `created brief ${brief.briefId} in ${brief.namespace} (${brief.status})`);
      return;
    }
    case "get": {
      const brief = getBrief(requireFlag(parsed, "namespace"), requireFlag(parsed, "id"));
      if (!brief) {
        out(parsed, null, "(not found)");
        process.exitCode = 1;
        return;
      }
      const human = `${brief.briefId} [${brief.status}] ${brief.title}
owners: ${brief.owners.join(", ") || "(none)"}
goal: ${brief.goal}`;
      out(parsed, brief, human);
      return;
    }
    case "status": {
      const brief = updateStatus({
        namespace: requireFlag(parsed, "namespace"),
        briefId: requireFlag(parsed, "id"),
        status: requireFlag(parsed, "status"),
        by: requireFlag(parsed, "by"),
        summary: optionalFlag(parsed, "summary")
      });
      out(parsed, brief, `${brief.briefId} -> ${brief.status}`);
      return;
    }
    case "amend": {
      const brief = amendBrief({
        namespace: requireFlag(parsed, "namespace"),
        briefId: requireFlag(parsed, "id"),
        by: requireFlag(parsed, "by"),
        addSuccessCriteria: parsed.multi["add-success"],
        addConstraints: parsed.multi["add-constraint"],
        addOwners: parsed.multi["add-owner"],
        removeOwners: parsed.multi["remove-owner"],
        addRelatedKeys: parsed.multi["add-related-key"],
        addRelatedEntries: parsed.multi["add-related-entry"],
        addTags: parsed.multi["add-tag"]
      });
      out(parsed, brief, `amended ${brief.briefId}`);
      return;
    }
    case "list": {
      const items = listBriefs(requireFlag(parsed, "namespace"), {
        status: optionalFlag(parsed, "status"),
        owner: optionalFlag(parsed, "owner"),
        tag: optionalFlag(parsed, "tag")
      });
      const human = items.length === 0 ? "(no briefs)" : items.map((b) => `${b.briefId}	[${b.status}]	${b.title}	(${b.owners.join(",") || "-"})	${b.updatedAt}`).join("\n");
      out(parsed, items, human);
      return;
    }
    case "delete": {
      const removed = deleteBrief(requireFlag(parsed, "namespace"), requireFlag(parsed, "id"));
      out(parsed, { removed }, removed ? `deleted` : `(not found)`);
      if (!removed) process.exitCode = 1;
      return;
    }
    default:
      throw new Error(`Unknown brief action "${action}". Try: create, get, status, amend, list, delete`);
  }
}
function presenceCmd(action, parsed) {
  switch (action) {
    case "announce": {
      const entry = announcePresence({
        namespace: requireFlag(parsed, "namespace"),
        agent: requireFlag(parsed, "agent"),
        provider: requireFlag(parsed, "provider"),
        role: optionalFlag(parsed, "role"),
        focus: optionalFlag(parsed, "focus"),
        briefId: optionalFlag(parsed, "brief"),
        ttlSeconds: optionalNumber(parsed, "ttl")
      });
      out(parsed, entry, `announced ${entry.agent} (${entry.provider}) in ${entry.namespace} ttl=${entry.ttlSeconds}s`);
      return;
    }
    case "list": {
      const includeStale = parsed.flags["include-stale"] === true;
      const entries = listPresence(requireFlag(parsed, "namespace"), { includeStale });
      const human = entries.length === 0 ? "(no presence)" : entries.map((e) => `${e.agent}	${e.provider}	${e.role ?? "-"}	${e.briefId ?? "-"}	${e.lastSeen}	${e.focus ?? ""}`).join("\n");
      out(parsed, entries, human);
      return;
    }
    case "leave": {
      const removed = leavePresence(requireFlag(parsed, "namespace"), requireFlag(parsed, "agent"));
      out(parsed, { removed }, removed ? "left" : "(was not present)");
      if (!removed) process.exitCode = 1;
      return;
    }
    case "reap": {
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
    case "write": {
      const namespace = requireFlag(parsed, "namespace");
      const key = requireFlag(parsed, "key");
      const rawValue = requireFlag(parsed, "value");
      let value = rawValue;
      try {
        value = JSON.parse(rawValue);
      } catch {
      }
      const ttl = optionalNumber(parsed, "ttl");
      const entry = writeEntry(namespace, key, value, ttl);
      out(parsed, entry, `wrote ${entry.namespace}:${entry.key}`);
      return;
    }
    case "read": {
      const entry = readEntry(requireFlag(parsed, "namespace"), requireFlag(parsed, "key"));
      if (!entry) {
        out(parsed, null, "(not found or expired)");
        process.exitCode = 1;
        return;
      }
      out(parsed, entry, typeof entry.value === "string" ? entry.value : JSON.stringify(entry.value, null, 2));
      return;
    }
    case "list": {
      const namespace = optionalFlag(parsed, "namespace");
      if (!namespace) {
        const namespaces = listNamespaces();
        out(parsed, namespaces, namespaces.join("\n") || "(no namespaces)");
        return;
      }
      const items = listEntries(namespace);
      const human = items.length === 0 ? "(no entries)" : items.map((i) => `${i.key}	${i.updatedAt}${i.expiresAt ? `	expires=${i.expiresAt}` : ""}`).join("\n");
      out(parsed, items, human);
      return;
    }
    case "delete": {
      const removed = deleteEntry(requireFlag(parsed, "namespace"), requireFlag(parsed, "key"));
      out(parsed, { removed }, removed ? "deleted" : "(not found)");
      if (!removed) process.exitCode = 1;
      return;
    }
    default:
      throw new Error(`Unknown memory action "${action}". Try: write, read, list, delete`);
  }
}
var USAGE = `omc-mam \u2014 Multi-Agent Memory CLI (provider-agnostic)

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
  brief --status:   ${TASK_STATUSES.join(", ")}
  context --kind:   ${CONTEXT_KINDS.join(", ")}
`;
function runMam(argv) {
  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") {
    process.stdout.write(USAGE);
    return 0;
  }
  const [group, action, ...rest] = argv;
  if (!group || !action) {
    process.stderr.write(`error: command required

${USAGE}`);
    return 2;
  }
  let parsed;
  try {
    parsed = parseArgs(rest);
  } catch (err) {
    process.stderr.write(`error: ${err.message}
`);
    return 2;
  }
  try {
    switch (group) {
      case "context":
      case "ctx":
        contextCmd(action, parsed);
        break;
      case "brief":
      case "briefs":
        briefCmd(action, parsed);
        break;
      case "presence":
        presenceCmd(action, parsed);
        break;
      case "memory":
      case "mem":
        memoryCmd(action, parsed);
        break;
      default:
        process.stderr.write(`error: unknown group "${group}"

${USAGE}`);
        return 2;
    }
  } catch (err) {
    process.stderr.write(`error: ${err.message}
`);
    return 1;
  }
  const ec = process.exitCode;
  return typeof ec === "number" ? ec : 0;
}
var isDirectInvocation = (() => {
  try {
    if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
      return true;
    }
  } catch {
  }
  return false;
})();
if (isDirectInvocation) {
  process.exit(runMam(process.argv.slice(2)));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runMam
});
