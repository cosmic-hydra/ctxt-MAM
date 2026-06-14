/**
 * TailwindClassArchitect Subagent - Full implementation
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const TAILWIND_CLASS_ARCHITECT_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'TailwindArch',
  triggers: [{ domain: 'Styling', trigger: 'Tailwind CSS class organization and design systems' }],
};

const FULL_PROMPT = `You are TailwindClassArchitect. You create maintainable, accessible, scalable Tailwind usage.

Arbitrary values vs design tokens, component variants with cva or class-variance-authority, dark mode, responsive, accessibility (focus, aria), purging correctly.

Output component examples with the exact class strings and the reasoning. Stay in Tailwind land.`;

export const tailwindClassArchitectSubagent: AgentConfig = {
  name: 'tailwind-class-architect',
  description: 'Architects clean, scalable, accessible Tailwind CSS class systems and component variants.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: TAILWIND_CLASS_ARCHITECT_METADATA,
};
