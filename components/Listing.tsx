"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, Grid2x2, Grid3x3, SlidersHorizontal, X } from "lucide-react";
import { discount, formatINR, type Product } from "@/lib/catalog";
import { ProductGrid } from "@/components/ui";

const SORTS = [
  ["recommended", "Recommended"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["rating", "Top rated"],
  ["discount", "Biggest discount"],
] as const;

type Facet = "material" | "finish" | "colour";
const FACETS: { key: Facet; label: string }[] = [
  { key: "material", label: "Material" },
  { key: "finish", label: "Finish" },
  { key: "colour", label: "Colour" },
];

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border py-4">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider">
        {title}
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3 space-y-2.5">{children}</div>}
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1.5 text-sm">
      {label}
      <input type="checkbox" checked={on} onChange={onChange} className="peer sr-only" />
      <span className="relative h-5 w-9 rounded-full bg-border transition peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
    </label>
  );
}

export default function Listing({ items, subs }: { items: Product[]; subs: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [dense, setDense] = useState(false);

  const priceBounds = useMemo(() => [Math.min(...items.map((p) => p.price)), Math.max(...items.map((p) => p.price))], [items]);
  const state = {
    sub: sp.get("sub") ?? "",
    sort: sp.get("sort") ?? "recommended",
    fast: sp.get("fast") === "1",
    deal: sp.get("deal") === "1",
    min: Number(sp.get("min") ?? priceBounds[0]),
    max: Number(sp.get("max") ?? priceBounds[1]),
    material: list(sp.get("material")),
    finish: list(sp.get("finish")),
    colour: list(sp.get("colour")),
  };
  const [minDraft, setMinDraft] = useState(String(state.min));
  const [maxDraft, setMaxDraft] = useState(String(state.max));

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const toggleIn = (key: Facet, value: string) => {
    const cur = state[key];
    const nextVals = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
    set({ [key]: nextVals.join(",") || null });
  };
  const reset = () => {
    setMinDraft(String(priceBounds[0]));
    setMaxDraft(String(priceBounds[1]));
    router.replace(pathname, { scroll: false });
  };

  const options = (key: Facet) => {
    const counts = new Map<string, number>();
    for (const p of items) counts.set(p[key], (counts.get(p[key]) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const shown = useMemo(() => {
    const r = items.filter((p) =>
      (!state.sub || p.sub === state.sub) &&
      (!state.fast || p.shipsFast) &&
      (!state.deal || p.deal) &&
      p.price >= state.min && p.price <= state.max &&
      (!state.material.length || state.material.includes(p.material)) &&
      (!state.finish.length || state.finish.includes(p.finish)) &&
      (!state.colour.length || state.colour.includes(p.colour)),
    );
    const by: Record<string, (a: Product, b: Product) => number> = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      discount: (a, b) => discount(b.price, b.mrp) - discount(a.price, a.mrp),
    };
    return by[state.sort] ? [...r].sort(by[state.sort]) : r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sp]);

  const active = state.material.length + state.finish.length + state.colour.length + (state.fast ? 1 : 0) + (state.deal ? 1 : 0) + (sp.get("min") || sp.get("max") ? 1 : 0);

  const filters = (
    <div>
      <div className="flex items-center justify-between pb-2">
        <p className="font-semibold">Filters {active > 0 && <span className="text-muted">({active})</span>}</p>
        {active > 0 && <button onClick={reset} className="text-sm text-accent underline">Clear all</button>}
      </div>
      <div className="border-b border-border pb-3">
        <Toggle label="Ships in 48 hours" on={state.fast} onChange={() => set({ fast: state.fast ? null : "1" })} />
        <Toggle label="On sale this week" on={state.deal} onChange={() => set({ deal: state.deal ? null : "1" })} />
      </div>
      <FilterGroup title="Price">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); set({ min: minDraft, max: maxDraft }); }}
        >
          <label className="flex-1 text-xs text-muted">Min
            <input inputMode="numeric" value={minDraft} onChange={(e) => setMinDraft(e.target.value.replace(/\D/g, ""))} className="mt-1 h-9 w-full rounded-sm border border-border-input bg-surface px-2 text-sm text-ink" />
          </label>
          <label className="flex-1 text-xs text-muted">Max
            <input inputMode="numeric" value={maxDraft} onChange={(e) => setMaxDraft(e.target.value.replace(/\D/g, ""))} className="mt-1 h-9 w-full rounded-sm border border-border-input bg-surface px-2 text-sm text-ink" />
          </label>
          <button className="h-9 rounded-sm bg-accent px-3 text-sm font-semibold text-on-accent">Go</button>
        </form>
        <p className="text-xs text-muted">{formatINR(priceBounds[0])} – {formatINR(priceBounds[1])}</p>
      </FilterGroup>
      {FACETS.map((f) => (
        <FilterGroup key={f.key} title={f.label}>
          {options(f.key).map(([value, n]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" checked={state[f.key].includes(value)} onChange={() => toggleIn(f.key, value)} className="h-4 w-4 accent-[var(--color-accent)]" />
              <span className="flex-1">{value}</span>
              <span className="text-xs text-muted">{n}</span>
            </label>
          ))}
        </FilterGroup>
      ))}
    </div>
  );

  return (
    <div>
      {/* Sub-category chips */}
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {["", ...subs].map((s) => (
          <button
            key={s || "all"}
            onClick={() => set({ sub: s || null })}
            aria-pressed={state.sub === s}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${state.sub === s ? "border-accent bg-accent text-on-accent" : "border-border bg-surface hover:border-ink"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden self-start rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-40 lg:block" aria-label="Filters">
          {filters}
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{shown.length} of {items.length} products</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setDrawer(true)} className="flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm lg:hidden">
                <SlidersHorizontal size={15} /> Filters{active > 0 && ` (${active})`}
              </button>
              <label className="sr-only" htmlFor="sort">Sort by</label>
              <select id="sort" value={state.sort} onChange={(e) => set({ sort: e.target.value === "recommended" ? null : e.target.value })} className="h-10 rounded-full border border-border bg-surface px-4 text-sm">
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <div className="hidden overflow-hidden rounded-full border border-border bg-surface lg:flex" role="group" aria-label="Grid density">
                <button onClick={() => setDense(false)} aria-pressed={!dense} aria-label="3 per row" className={`grid h-10 w-10 place-items-center ${!dense ? "bg-surface-alt" : ""}`}><Grid2x2 size={16} /></button>
                <button onClick={() => setDense(true)} aria-pressed={dense} aria-label="4 per row" className={`grid h-10 w-10 place-items-center ${dense ? "bg-surface-alt" : ""}`}><Grid3x3 size={16} /></button>
              </div>
            </div>
          </div>

          {shown.length ? (
            <ProductGrid items={shown} dense={dense} />
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
              <p className="font-display text-xl">Nothing matches all of that</p>
              <p className="mt-2 text-sm text-muted">Try loosening a filter or two.</p>
              <button onClick={reset} className="mt-5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent">Clear filters</button>
            </div>
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-black/40" aria-label="Close filters" onClick={() => setDrawer(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface p-5">
            <div className="mb-2 flex justify-end"><button onClick={() => setDrawer(false)} aria-label="Close filters" className="p-1"><X size={20} /></button></div>
            {filters}
            <button onClick={() => setDrawer(false)} className="sticky bottom-0 mt-4 h-12 w-full rounded-full bg-accent font-semibold text-on-accent">Show {shown.length} products</button>
          </div>
        </div>
      )}
    </div>
  );
}
