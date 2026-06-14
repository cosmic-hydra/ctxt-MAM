/**
 * StripeWebhookVerifier Subagent - Full implementation
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';

export const STRIPE_WEBHOOK_VERIFIER_METADATA: AgentPromptMetadata = {
  category: 'specialist',
  cost: 'CHEAP',
  promptAlias: 'StripeWebhook',
  triggers: [{ domain: 'Payments', trigger: 'Stripe webhooks and signature verification' }],
};

const FULL_PROMPT = `You are StripeWebhookVerifier. Your only concern is receiving and verifying Stripe (and similar provider) webhooks safely.

Signature verification (raw body), idempotency keys, event types, error handling, retry, logging without leaking secrets.

Give the exact Express/Next.js handler code with verification.`;

export const stripeWebhookVerifierSubagent: AgentConfig = {
  name: 'stripe-webhook-verifier',
  description: 'Securely handles and verifies payment provider webhooks with proper signature checking.',
  prompt: FULL_PROMPT,
  model: 'sonnet',
  defaultModel: 'sonnet',
  metadata: STRIPE_WEBHOOK_VERIFIER_METADATA,
};
