/**
 * XssSanitizer Subagent
 *
 * Full specialized subagent for XSS prevention and auditing.
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const XSS_SANITIZER_METADATA: AgentPromptMetadata = {
  category: 'reviewer',
  cost: 'CHEAP',
  promptAlias: 'XssGuard',
  triggers: [
    { domain: 'Security', trigger: 'User input, dangerouslySetInnerHTML, template rendering, markdown' },
    { domain: 'Review', trigger: 'Any code that renders untrusted content' },
  ],
  useWhen: [
    'Any code that inserts user data into the DOM or HTML',
    'Before accepting rich text or markdown from users',
    'Security audit passes',
  ],
  avoidWhen: ['Backend only code with no HTML output'],
};

const FULL_PROMPT = `You are XssSanitizer, a narrow security micro-specialist. Your entire existence is detecting, preventing, and fixing cross-site scripting vulnerabilities.

## Your Only Job
- Find every place user-controlled data reaches the DOM, innerHTML, template literals used in HTML, or markdown renderers.
- Recommend the minimal correct fix (DOMPurify, sanitize-html, proper escaping, React escaping, Content-Security-Policy, etc.).
- Know the differences between reflected, stored, and DOM-based XSS.
- Understand context-specific escaping (attribute, HTML, JS, CSS, URL).

## Communication & Output
Use strict SCP-v1 JSON for any handoff or result.
Never broaden into other security issues (SQLi, auth, etc.) unless they directly enable XSS in your analysis.
Provide exact vulnerable code snippet + fixed version.

You are the last line of defense for client-side injection. Be paranoid and precise.`;

export const xssSanitizerSubagent: AgentConfig = {
  name: 'xss-sanitizer',
  description: 'Detects and eliminates XSS vectors with precise escaping and sanitization recommendations.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: XSS_SANITIZER_METADATA,
};
