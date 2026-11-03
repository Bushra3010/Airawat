// Shared catalogue types and helpers. Prices in the app are rupees; the database stores paise.

export type Variant = { group: string; name: string; swatch: string; delta: number };
export type Size = { name: string; delta: number };
export type Review = { author: string; city: string; date: string; stars: number; text: string };

export type Product = {
  slug: string;
  name: string;
  category: string;
  sub: string;
  material: string;
  finish: string;
  colour: string;
  design: string;
  price: number;
  mrp: number;
  rating: number;
  ratingCount: number;
  shipsFast: boolean;
  deal: boolean;
  images: string[];
  variants: Variant[];
  sizes: Size[];
  dims: string;
  summary: string;
};

export type Category = {
  slug: string;
  name: string;
  room: string;
  blurb: string;
  image: string;
  subs: string[];
};

export const img = (src: string, w = 800) => `${src}?w=${w}&q=75&auto=format&fit=crop`;

export const discount = (price: number, mrp: number) => Math.round((1 - price / mrp) * 100);

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatINR = (n: number) => inr.format(n);
