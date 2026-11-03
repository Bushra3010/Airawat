import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, search } from "@/lib/db";
import { ProductGrid } from "@/components/ui";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 80);
  const [results, categories] = await Promise.all([search(q), getCategories()]);
  return (
    <div className="wrap py-8">
      <h1 className="font-display text-3xl">{q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}</h1>
      <p className="mt-1 text-sm text-muted">{results.length} product{results.length === 1 ? "" : "s"}</p>
      {results.length ? (
        <div className="mt-6"><ProductGrid items={results} dense /></div>
      ) : (
        <div className="mt-10 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
          <p className="font-display text-xl">No matches{q && <> for &ldquo;{q}&rdquo;</>}</p>
          <p className="mt-2 text-sm text-muted">Try a material (teak, velvet), a colour, or browse a category:</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {categories.map((c) => <Link key={c.slug} href={`/c/${c.slug}`} className="rounded-full border border-border px-4 py-2 text-sm hover:border-ink">{c.name}</Link>)}
          </div>
        </div>
      )}
    </div>
  );
}
