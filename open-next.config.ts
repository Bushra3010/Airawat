// Cloudflare (OpenNext) settings. Cached shop pages live in Workers KV, which the free plan includes.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import kvNextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/kv-next-tag-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

// Same KV cache, under a name the deploy step doesn't recognise, so deploys don't pre-fill ~185 pages into KV.
// The free plan allows 1,000 KV writes a day; pre-filling on every deploy used them up. Pages are saved on first visit instead.
const lazyKvIncrementalCache = Object.create(kvIncrementalCache, {
  name: { value: "kv-incremental-cache-lazy" },
}) as typeof kvIncrementalCache;

export default defineCloudflareConfig({
  incrementalCache: lazyKvIncrementalCache,
  tagCache: kvNextTagCache,
  queue: memoryQueue,
});
