"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { friendlyError, refreshSite } from "@/lib/admin";
import { browserClient } from "@/lib/supabase-browser";
import { Stars } from "@/components/ui";
import { Notice, PageHeader, Skeleton } from "@/components/admin/ui";

type Review = { id: string; author: string; city: string; stars: number; body: string; created_at: string; products: { name: string; slug: string } | null };

export default function ReviewsPage() {
  const [rows, setRows] = useState<Review[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    browserClient().from("reviews").select("id, author, city, stars, body, created_at, products(name, slug)").order("created_at", { ascending: false }).limit(300)
      .then(({ data, error }) => (error ? setError(error.message) : setRows(data as unknown as Review[])));
  }, []);

  const remove = async (r: Review) => {
    if (!confirm(`Delete this review by ${r.author}? This can't be undone.`)) return;
    const { error } = await browserClient().from("reviews").delete().eq("id", r.id);
    if (error) return setError(friendlyError(error.message));
    setRows((all) => all?.filter((x) => x.id !== r.id) ?? null);
    await refreshSite();
  };

  return (
    <>
      <PageHeader title="Reviews" sub="Remove reviews that are spam, abusive or about the wrong product." />
      {error && <div className="mb-4"><Notice kind="error">{error}</Notice></div>}
      {!rows && !error ? <Skeleton rows={6} /> : (
        <ul className="space-y-3">
          {rows?.map((r) => (
            <li key={r.id} className="flex gap-4 rounded-lg border border-border bg-surface p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <Stars value={r.stars} size={13} />
                  <span className="font-medium">{r.author}{r.city && `, ${r.city}`}</span>
                  <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <p className="mt-2 text-sm leading-6">{r.body}</p>
                {r.products && <a href={`/p/${r.products.slug}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-accent underline">{r.products.name}</a>}
              </div>
              <button onClick={() => remove(r)} aria-label={`Delete review by ${r.author}`} className="h-9 shrink-0 rounded-md px-2 text-danger hover:bg-danger/10"><Trash2 size={16} /></button>
            </li>
          ))}
          {rows && !rows.length && <p className="text-sm text-muted">No reviews yet.</p>}
        </ul>
      )}
    </>
  );
}
