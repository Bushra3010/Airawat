import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatINR, img } from "@/lib/catalog";
import { getCategories, getCategory, productsIn } from "@/lib/db";
import { Breadcrumb } from "@/components/ui";
import Listing from "@/components/Listing";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getCategory((await params).slug);
  return c ? { title: `${c.name} — Buy Online`, description: c.blurb } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getCategory((await params).slug);
  if (!c) notFound();
  const items = await productsIn(c.slug);

  return (
    <div className="wrap">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: c.room }, { label: c.name }]} />

      <section className="relative mb-8 overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img(c.image, 1600)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/10" />
        <div className="relative px-6 py-12 text-white md:px-12 md:py-16">
          <h1 className="font-display text-4xl md:text-5xl">{c.name}</h1>
          <p className="mt-3 max-w-md text-sm text-white/85">{c.blurb}</p>
          <p className="mt-4 text-xs uppercase tracking-wider text-[#e9d3a6]">{items.length} designs</p>
        </div>
      </section>

      <Suspense>
        <Listing items={items} subs={c.subs} />
      </Suspense>

      <section className="mt-16 rounded-lg border border-border bg-surface p-6" aria-labelledby="pl-h">
        <h2 id="pl-h" className="mb-4 font-display text-xl">{c.name} price list</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-muted"><tr><th className="py-2 font-medium">Design</th><th className="py-2 text-right font-medium">Price</th></tr></thead>
          <tbody className="divide-y divide-border">
            {items.map((p) => (
              <tr key={p.slug}><td className="py-2.5">{p.name}</td><td className="py-2.5 text-right tabular-nums">{formatINR(p.price)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
