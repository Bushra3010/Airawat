import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allProductSlugs, getCategory, getProduct, reviewsFor, similarTo } from "@/lib/db";
import { Breadcrumb, ProductGrid, Stars } from "@/components/ui";
import BuyBox from "@/components/BuyBox";
import Gallery from "@/components/Gallery";
import InfoTabs from "@/components/InfoTabs";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await allProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return p ? { title: p.name, description: p.summary } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const [c, reviews, similar] = await Promise.all([getCategory(p.category), reviewsFor(p.slug), similarTo(p)]);
  const dist = [78, 14, 5, 2, 1];

  return (
    <div className="wrap">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: c?.name ?? "Shop", href: `/c/${p.category}` }, { label: p.name }]} />

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <Gallery images={p.images} name={p.name} />
        <BuyBox p={p} />
      </div>

      <InfoTabs p={p} />

      <section className="mt-14" aria-labelledby="rev-h">
        <h2 id="rev-h" className="mb-6 font-display text-2xl">What owners say</h2>
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="font-display text-5xl">{p.rating}</p>
            <Stars value={p.rating} />
            <p className="mt-1 text-sm text-muted">{p.ratingCount} ratings</p>
            <ul className="mt-5 space-y-2">
              {dist.map((pct, i) => (
                <li key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-3">{5 - i}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-alt"><span className="block h-full rounded-full bg-star" style={{ width: `${pct}%` }} /></span>
                  <span className="w-8 text-right text-muted">{pct}%</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.author} className="rounded-lg border border-border bg-surface p-5">
                <Stars value={r.stars} size={13} />
                <p className="mt-3 text-sm leading-6">{r.text}</p>
                <p className="mt-3 text-xs text-muted">{r.author}, {r.city} · Verified purchase · {r.date}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14" aria-labelledby="sim-h">
        <h2 id="sim-h" className="mb-6 font-display text-2xl">You might also like</h2>
        <ProductGrid items={similar} dense />
      </section>
    </div>
  );
}
