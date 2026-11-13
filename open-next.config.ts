// Cloudflare (OpenNext) settings.
// Shop pages are built once per deploy and served from Workers static assets: free, unlimited and no KV.
// (A KV page cache used up the free plan's 100,000 daily KV reads.) Admin edits reach the shop by
// triggering a rebuild through a Cloudflare deploy hook; see app/api/revalidate/route.ts.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
