import { allProductSlugs, getCategories, productsBySlugs } from "@/lib/db";
import type { SearchIndex } from "@/lib/search-suggest";

// Small catalogue snapshot for search suggestions. Rebuilt at most every 5 minutes.
export const revalidate = 300;

export async function GET() {
  const [categories, products] = await Promise.all([getCategories(), allProductSlugs().then(productsBySlugs)]);
  const index: SearchIndex = {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name, subs: c.subs })),
    products: products
      .sort((a, b) => b.ratingCount - a.ratingCount)
      .map((p) => ({
        slug: p.slug, name: p.name, category: p.category, sub: p.sub, material: p.material,
        finish: p.finish, colour: p.colour, design: p.design, price: p.price, image: p.images[0],
      })),
  };
  return Response.json(index);
}
