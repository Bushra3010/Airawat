import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BUSINESS } from "@/lib/business";

// Short info pages linked from the header and footer.
const pages: Record<string, { title: string; body: React.ReactNode }> = {
  track: {
    title: "Track your order",
    body: <>Signed in? Every order you place is listed under <Link href="/account" className="text-accent underline">Your account</Link>. Guest orders open from the confirmation page in the browser you ordered on. For delivery updates, call <a href={BUSINESS.phoneHref} className="text-accent underline">{BUSINESS.phone}</a>.</>,
  },
  help: {
    title: "Help centre",
    body: <>Questions about an order, delivery, returns or care? Call <a href={BUSINESS.phoneHref} className="text-accent underline">{BUSINESS.phone}</a>, <a href={BUSINESS.whatsappHref} className="text-accent underline">message us on WhatsApp</a> or email <a href={`mailto:${BUSINESS.email}`} className="text-accent underline">{BUSINESS.email}</a>.</>,
  },
  about: {
    title: `About ${BUSINESS.name}`,
    body: <>{BUSINESS.about} Since {BUSINESS.since}, our showroom in Baner, Pune has been the place to see the pieces up close. <Link href="/stores" className="text-accent underline">Visit us</Link>.</>,
  },
  trade: {
    title: "Bulk & custom orders",
    body: <>Furnishing a home, hotel or office, or need a piece made to your size and wood? Email <a href={`mailto:${BUSINESS.email}`} className="text-accent underline">{BUSINESS.email}</a> or call <a href={BUSINESS.phoneHref} className="text-accent underline">{BUSINESS.phone}</a>.</>,
  },
};

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(pages).map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const p = pages[(await params).page];
  return p ? { title: p.title } : {};
}

export default async function InfoPage({ params }: { params: Promise<{ page: string }> }) {
  const p = pages[(await params).page];
  if (!p) notFound();
  return (
    <div className="wrap max-w-2xl py-20 text-center">
      <h1 className="font-display text-4xl">{p.title}</h1>
      <p className="mt-4 leading-7 text-muted">{p.body}</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-on-accent">Back to home</Link>
    </div>
  );
}
