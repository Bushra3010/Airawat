"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { ProductGrid } from "@/components/ui";

export type BestSellerTab = { label: string; slug?: string; items: Product[] };

export default function BestSellers({ tabs }: { tabs: BestSellerTab[] }) {
  const [tab, setTab] = useState(0);
  const active = tabs[tab];
  return (
    <section className="wrap mt-16" aria-labelledby="bs-h">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 id="bs-h" className="font-display text-2xl md:text-3xl">Most-loved this season</h2>
        <div role="tablist" aria-label="Filter best sellers" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {tabs.map((t, n) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={tab === n}
              onClick={() => setTab(n)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${tab === n ? "border-accent bg-accent text-on-accent" : "border-border bg-surface hover:border-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <ProductGrid items={active.items} dense />
      {active.slug && (
        <div className="mt-6 text-center">
          <Link href={`/c/${active.slug}`} className="inline-block rounded-full border border-ink px-6 py-2.5 text-sm font-semibold hover:bg-ink hover:text-white">
            See all {active.label.toLowerCase()}
          </Link>
        </div>
      )}
    </section>
  );
}
