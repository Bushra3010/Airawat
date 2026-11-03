"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/catalog";
import { rupees, STATUS_LABEL } from "@/lib/admin";
import { browserClient } from "@/lib/supabase-browser";
import { Badge, Card, Notice, PageHeader, Skeleton } from "@/components/admin/ui";

type Stats = {
  active: number;
  hidden: number;
  categories: number;
  newOrders: number;
  revenue30: number;
  recent: { code: string; name: string; status: string; total_paise: number; created_at: string }[];
};

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = browserClient();
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    Promise.all([
      sb.from("products").select("id", { count: "exact", head: true }).eq("active", true),
      sb.from("products").select("id", { count: "exact", head: true }).eq("active", false),
      sb.from("categories").select("slug", { count: "exact", head: true }),
      sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      sb.from("orders").select("total_paise").gte("created_at", since).neq("status", "cancelled"),
      sb.from("orders").select("code, name, status, total_paise, created_at").order("created_at", { ascending: false }).limit(6),
    ]).then(([a, h, c, n, rev, recent]) => {
      const err = [a, h, c, n, rev, recent].find((r) => r.error)?.error;
      if (err) return setError(err.message);
      setS({
        active: a.count ?? 0,
        hidden: h.count ?? 0,
        categories: c.count ?? 0,
        newOrders: n.count ?? 0,
        revenue30: (rev.data ?? []).reduce((t, o) => t + o.total_paise, 0),
        recent: recent.data ?? [],
      });
    });
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" sub="A quick look at the shop." />
      {error && <Notice kind="error">{error}</Notice>}
      {!s && !error && <Skeleton />}
      {s && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ["Products in shop", s.active, "/admin/products"],
              ["Hidden products", s.hidden, "/admin/products?show=hidden"],
              ["New orders", s.newOrders, "/admin/orders?status=pending"],
              ["Order value, last 30 days", formatINR(rupees(s.revenue30)), "/admin/orders"],
            ].map(([label, value, href]) => (
              <Link key={String(label)} href={String(href)} className="rounded-lg border border-border bg-surface p-5 hover:border-ink">
                <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
                <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
              </Link>
            ))}
          </div>

          <Card title="Latest orders" className="mt-6">
            {s.recent.length ? (
              <ul className="divide-y divide-border">
                {s.recent.map((o) => (
                  <li key={o.code}>
                    <Link href={`/admin/orders?open=${o.code}`} className="flex flex-wrap items-center gap-3 py-3 hover:text-accent">
                      <span className="font-mono text-sm font-semibold">{o.code}</span>
                      <span className="flex-1 text-sm">{o.name}</span>
                      <span className="text-xs text-muted">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      <Badge tone={o.status === "pending" ? "warn" : o.status === "cancelled" ? "bad" : "good"}>{STATUS_LABEL[o.status]}</Badge>
                      <span className="w-24 text-right text-sm font-semibold tabular-nums">{formatINR(rupees(o.total_paise))}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">No orders yet.</p>}
          </Card>
        </>
      )}
    </>
  );
}
