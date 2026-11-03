"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { formatINR, img } from "@/lib/catalog";
import { rupees } from "@/lib/admin";
import { browserClient } from "@/lib/supabase-browser";
import { Badge, ButtonLink, Notice, PageHeader, Skeleton, inputCls } from "@/components/admin/ui";

type Row = { id: string; slug: string; name: string; category_slug: string; price_paise: number; mrp_paise: number; images: string[]; active: boolean; deal: boolean; updated_at: string };

function Products() {
  const router = useRouter();
  const sp = useSearchParams();
  const show = sp.get("show") ?? "all";
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cats, setCats] = useState<{ slug: string; name: string }[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = browserClient();
    Promise.all([
      sb.from("products").select("id, slug, name, category_slug, price_paise, mrp_paise, images, active, deal, updated_at").order("position"),
      sb.from("categories").select("slug, name").order("position"),
    ]).then(([p, c]) => {
      if (p.error || c.error) return setError((p.error ?? c.error)!.message);
      setRows(p.data as Row[]);
      setCats(c.data ?? []);
    });
  }, []);

  const catName = useMemo(() => Object.fromEntries(cats.map((c) => [c.slug, c.name])), [cats]);
  const shown = (rows ?? []).filter((r) =>
    (show === "all" || (show === "hidden" ? !r.active : r.active)) &&
    (!cat || r.category_slug === cat) &&
    (!q || r.name.toLowerCase().includes(q.toLowerCase())),
  );
  const setShow = (v: string) => router.replace(v === "all" ? "/admin/products" : `/admin/products?show=${v}`);

  return (
    <>
      <PageHeader title="Products" sub={rows ? `${rows.length} products, ${rows.filter((r) => !r.active).length} hidden` : undefined} action={<ButtonLink href="/admin/products/new"><Plus size={16} /> New product</ButtonLink>} />
      {error && <Notice kind="error">{error}</Notice>}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search size={16} className="absolute left-3 top-3 text-muted" />
          <label htmlFor="psearch" className="sr-only">Search products</label>
          <input id="psearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className={`${inputCls} pl-9`} />
        </div>
        <label className="sr-only" htmlFor="pcat">Category</label>
        <select id="pcat" value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <div role="group" aria-label="Visibility" className="flex overflow-hidden rounded-md border border-border bg-surface text-sm">
          {[["all", "All"], ["live", "In shop"], ["hidden", "Hidden"]].map(([v, l]) => (
            <button key={v} onClick={() => setShow(v)} aria-pressed={show === v} className={`px-3 ${show === v ? "bg-accent text-on-accent" : "hover:bg-surface-alt"}`}>{l}</button>
          ))}
        </div>
      </div>

      {!rows && !error ? <Skeleton rows={6} /> : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">MRP</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((r) => (
                <tr key={r.id} className="hover:bg-surface-alt/50">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/products/${r.id}`} className="flex items-center gap-3 font-medium hover:text-accent">
                      <span className="h-11 w-14 shrink-0 overflow-hidden rounded bg-surface-alt">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {r.images[0] && <img src={img(r.images[0], 120)} alt="" className="h-full w-full object-cover" />}
                      </span>
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{catName[r.category_slug] ?? r.category_slug}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(rupees(r.price_paise))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{formatINR(rupees(r.mrp_paise))}</td>
                  <td className="space-x-1 px-4 py-2.5">{r.active ? <Badge tone="good">In shop</Badge> : <Badge>Hidden</Badge>}{r.deal && <Badge tone="warn">Deal</Badge>}</td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No products match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function ProductsPage() {
  return <Suspense><Products /></Suspense>;
}
