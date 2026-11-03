import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Rebuild the shop's cached pages after an admin edit. Only signed-in admins may trigger it.
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Sign in first." }, { status: 401 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: isAdmin, error } = await sb.rpc("is_admin");
  if (error || !isAdmin) return Response.json({ error: "Not allowed." }, { status: 403 });

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
