import type { Metadata } from "next";
import { discount } from "@/lib/catalog";
import { allProductSlugs, productsBySlugs } from "@/lib/db";
import { Breadcrumb, Countdown, ProductGrid } from "@/components/ui";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Festive Sale",
  description: "Festive Sale on wood-carved furniture: deals of the week plus big savings on sofas, beds, dining sets and more.",
};

export default async function SalePage() {
  const products = await allProductSlugs().then(productsBySlugs);
  const byDiscount = (a: (typeof products)[number], b: (typeof products)[number]) => discount(b.price, b.mrp) - discount(a.price, a.mrp);
  const deals = products.filter((p) => p.deal).sort(byDiscount);
  const rest = products.filter((p) => !p.deal).sort(byDiscount);
  const best = Math.max(0, ...products.map((p) => discount(p.price, p.mrp)));

  return (
    <div className="wrap">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Festive Sale" }]} />

      <section className="mb-10 flex flex-col gap-4 rounded-lg bg-sale px-6 py-8 text-white md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] opacity-80">Festive Sale</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">Up to {best}% off, plus an extra 10% on two or more pieces</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-wider opacity-80">Ends in</span>
          <Countdown compact />
        </div>
      </section>

      {deals.length > 0 && (
        <section aria-labelledby="deals-h" className="mb-14">
          <h2 id="deals-h" className="mb-1 font-display text-2xl">Deals of the week</h2>
          <p className="mb-6 text-sm text-muted">{deals.length} pieces at their lowest price, across every room.</p>
          <ProductGrid items={deals} dense />
        </section>
      )}

      <section aria-labelledby="more-h">
        <h2 id="more-h" className="mb-1 font-display text-2xl">More savings</h2>
        <p className="mb-6 text-sm text-muted">Everything else in the sale, biggest discount first.</p>
        <ProductGrid items={rest} dense />
      </section>
    </div>
  );
}
