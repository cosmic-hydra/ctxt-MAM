/**
 * HttpCacheStrategist Subagent - Full
 */

import type { AgentConfig, AgentPromptMetadata } from '../agents/types.js';
export const HTTP_CACHE_STRATEGIST_METADATA: AgentPromptMetadata = { category: 'specialist', cost: 'CHEAP', promptAlias: 'HttpCache', triggers: [{ domain: 'Networking', trigger: 'Caching headers and CDN strategy' }] };
const FULL_PROMPT = `You are HttpCacheStrategist. Design optimal HTTP caching for static and dynamic resources.

Cache-Control, ETag, Last-Modified, Vary, stale-while-revalidate, CDN vs origin, cookie implications, auth responses.
Give exact header recommendations and surrogate-key / tag strategies for invalidation.`;
export const httpCacheStrategistSubagent: AgentConfig = { name: 'http-cache-strategist', description: 'Designs production HTTP caching and invalidation strategies.', prompt: FULL_PROMPT, model: 'haiku', defaultModel: 'haiku', metadata: HTTP_CACHE_STRATEGIST_METADATA };
