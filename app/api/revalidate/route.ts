import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Publish admin edits to the shop. Shop pages are built once per deploy, so this starts a fresh build
// through a Cloudflare Workers Builds deploy hook (secret DEPLOY_HOOK_URL). Live in about 5 minutes.
// Only signed-in admins may trigger it.
function deployHookUrl(): string | undefined {
  if (process.env.DEPLOY_HOOK_URL) return process.env.DEPLOY_HOOK_URL;
  try {
    const v = (getCloudflareContext().env as unknown as Record<string, unknown>).DEPLOY_HOOK_URL;
    return typeof v === "string" && v ? v : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Sign in first." }, { status: 401 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: isAdmin, error } = await sb.rpc("is_admin");
  if (error || !isAdmin) return Response.json({ error: "Not allowed." }, { status: 403 });

  const hook = deployHookUrl();
  if (!hook) return Response.json({ error: "Publishing isn't set up yet (DEPLOY_HOOK_URL missing)." }, { status: 503 });
  const res = await fetch(hook, { method: "POST" });
  if (!res.ok) return Response.json({ error: `Cloudflare didn't start the update (${res.status}).` }, { status: 502 });
  return Response.json({ ok: true });
}
