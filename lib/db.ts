// Catalogue queries against Supabase. Rows are mapped to the app's rupee-based types here and nowhere else.
import type { Category, Product, Review } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";

type VariantRow = { group_name: string; name: string; swatch: string; delta_paise: number; position: number };
type SizeRow = { name: string; delta_paise: number; position: number };
type ProductRow = {
  slug: string; category_slug: string; name: string; sub: string; material: string; finish: string; colour: string;
  design: string; price_paise: number; mrp_paise: number; rating: number; rating_count: number; ships_fast: boolean;
  deal: boolean; images: string[]; dims: string; summary: string;
  product_variants: VariantRow[]; product_sizes: SizeRow[];
};

const PRODUCT = "*, product_variants(group_name, name, swatch, delta_paise, position), product_sizes(name, delta_paise, position)";
const byPos = (a: { position: number }, b: { position: number }) => a.position - b.position;

function toProduct(r: ProductRow): Product {
  return {
    slug: r.slug, name: r.name, category: r.category_slug, sub: r.sub, material: r.material, finish: r.finish,
    colour: r.colour, design: r.design, price: r.price_paise / 100, mrp: r.mrp_paise / 100, rating: Number(r.rating),
    ratingCount: r.rating_count, shipsFast: r.ships_fast, deal: r.deal, images: r.images, dims: r.dims, summary: r.summary,
    variants: [...r.product_variants].sort(byPos).map((v) => ({ group: v.group_name, name: v.name, swatch: v.swatch, delta: v.delta_paise / 100 })),
    sizes: [...r.product_sizes].sort(byPos).map((s) => ({ name: s.name, delta: s.delta_paise / 100 })),
  };
}

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data as T;
}

export async function getCategories(): Promise<Category[]> {
  return must(await supabase.from("categories").select("slug, name, room, blurb, image, subs").order("position"));
}

export async function getCategory(slug: string): Promise<Category | null> {
  return must(await supabase.from("categories").select("slug, name, room, blurb, image, subs").eq("slug", slug).maybeSingle());
}

export async function productsIn(category: string): Promise<Product[]> {
  const rows = must(await supabase.from("products").select(PRODUCT).eq("category_slug", category).order("position"));
  return (rows as ProductRow[]).map(toProduct);
}

export async function productsBySlugs(slugs: string[]): Promise<Product[]> {
  if (!slugs.length) return [];
  const rows = must(await supabase.from("products").select(PRODUCT).in("slug", slugs));
  return (rows as ProductRow[]).map(toProduct);
}

export async function allProductSlugs(): Promise<string[]> {
  return must(await supabase.from("products").select("slug")).map((r: { slug: string }) => r.slug);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const row = must(await supabase.from("products").select(PRODUCT).eq("slug", slug).maybeSingle());
  return row ? toProduct(row as ProductRow) : null;
}

export async function similarTo(p: Product): Promise<Product[]> {
  const rows = must(await supabase.from("products").select(PRODUCT).eq("category_slug", p.category).neq("slug", p.slug).order("position").limit(4));
  return (rows as ProductRow[]).map(toProduct);
}

export async function bestSellers(category?: string): Promise<Product[]> {
  let q = supabase.from("products").select(PRODUCT).order("rating_count", { ascending: false }).limit(8);
  if (category) q = q.eq("category_slug", category);
  return (must(await q) as ProductRow[]).map(toProduct);
}

export async function reviewsFor(slug: string): Promise<Review[]> {
  const rows = must(await supabase.from("reviews").select("author, city, stars, body, created_at, products!inner(slug)").eq("products.slug", slug).order("created_at", { ascending: false }).limit(6));
  return rows.map((r: { author: string; city: string; stars: number; body: string; created_at: string }) => ({
    author: r.author, city: r.city, stars: r.stars, text: r.body,
    date: new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  }));
}

export async function search(q: string): Promise<Product[]> {
  // Each word must match at least one text column. Strip PostgREST filter syntax from user input.
  const terms = q.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 5);
  if (!terms.length) return [];
  let query = supabase.from("products").select(PRODUCT);
  for (const t of terms) {
    const like = `*${t}*`;
    query = query.or(["name", "sub", "material", "finish", "colour", "design", "category_slug"].map((c) => `${c}.ilike.${like}`).join(","));
  }
  return (must(await query.order("rating_count", { ascending: false }).limit(48)) as ProductRow[]).map(toProduct);
}
