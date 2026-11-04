import Link from "next/link";
import { ArrowRight, Hammer, MapPin, MessageCircle, Phone, Ruler } from "lucide-react";
import { BUSINESS } from "@/lib/business";
import { discount, img } from "@/lib/catalog";
import { IMG, rooms } from "@/lib/content";
import { allProductSlugs, bestSellers, getCategories, productsBySlugs } from "@/lib/db";
import RoomCards from "@/components/RoomCards";
import { Countdown } from "@/components/ui";
import HeroCarousel from "@/components/HeroCarousel";
import BestSellers from "@/components/BestSellers";

const promises = [
  { icon: Hammer, title: `Hand-carved since ${BUSINESS.since}`, text: "Sheesham, teak and rosewood" },
  { icon: Ruler, title: "Made to your size", text: "Custom furniture to order" },
  { icon: MapPin, title: "Showroom in Baner", text: "Opp. Icon Tower, Pune" },
  { icon: Phone, title: "Talk to us", text: BUSINESS.phone },
];

const voices = [
  { name: "Ritika, Jaipur", text: "The dining table is the first thing guests touch. Every single one asks where it's from." },
  { name: "Arjun, Kochi", text: "Delivery crew carried it up four floors, assembled it, and took the cardboard with them." },
  { name: "Sana, Lucknow", text: "I sent fabric photos back and forth with their stylist for a week. Worth it, the sofa is perfect." },
];

export const revalidate = 300;

const TABS = [
  { label: "All", slug: undefined },
  { label: "Sofas", slug: "sofas" },
  { label: "Beds", slug: "beds" },
  { label: "Dining", slug: "dining" },
  { label: "Chairs", slug: "chairs" },
];

export default async function Home() {
  const [categories, allProducts, ...lists] = await Promise.all([
    getCategories(),
    allProductSlugs().then(productsBySlugs),
    ...TABS.map((t) => bestSellers(t.slug)),
  ]);
  const tabs = TABS.map((t, i) => ({ ...t, items: lists[i] }));
  // The headline discount always matches what's actually in the shop.
  const bestDiscount = Math.max(0, ...allProducts.map((p) => discount(p.price, p.mrp)));
  return (
    <>
      <HeroCarousel />

      {/* Sale strip */}
      <section className="wrap mt-4">
        <Link href="/sale" className="group flex flex-col items-start gap-4 rounded-lg bg-sale px-5 py-4 text-white transition hover:brightness-110 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">Festive Sale</p>
            <p className="font-display text-xl">Up to {bestDiscount}% off, plus an extra 10% on two or more pieces</p>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 group-hover:underline">Shop the sale <ArrowRight size={15} /></span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-wider opacity-80">Ends in</span>
            <Countdown compact />
          </div>
        </Link>
      </section>

      {/* Categories */}
      <section className="wrap mt-14" aria-labelledby="cat-h">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="cat-h" className="font-display text-2xl md:text-3xl">Shop by category</h2>
        </div>
        <ul className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-7 md:px-0">
          {categories.map((c) => (
            <li key={c.slug} className="shrink-0">
              <Link href={`/c/${c.slug}`} className="group flex w-24 flex-col items-center gap-3 text-center md:w-auto">
                <span className="block aspect-square w-24 overflow-hidden rounded-full border-4 border-surface bg-surface-alt shadow-card md:w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(c.image, 300)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </span>
                <span className="text-sm font-medium group-hover:text-accent">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Promises */}
      <section className="wrap mt-14">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 bg-surface p-5">
              <Icon className="mt-0.5 shrink-0 text-brass" size={22} />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Rooms */}
      <section className="wrap mt-16" aria-labelledby="room-h">
        <h2 id="room-h" className="mb-6 font-display text-2xl md:text-3xl">Furnish a whole room</h2>
        <RoomCards rooms={rooms} products={allProducts} />
      </section>

      <BestSellers tabs={tabs} />

      {/* Editorial split */}
      <section className="wrap mt-16 grid gap-5 md:grid-cols-2">
        {[
          { title: "Made for long dinners", text: "Six seats, solid sheesham, room for the extra dish.", href: "/c/dining", cta: "Shop dining", image: IMG.woodDining },
          { title: "Rest, with room for everything", text: "Beds with storage that hide a season's worth of linen.", href: "/c/beds", cta: "Shop bedroom", image: IMG.whiteBed },
        ].map((b) => (
          <Link key={b.title} href={b.href} className="group relative flex min-h-[320px] items-end overflow-hidden rounded-lg p-6 text-white md:min-h-[420px] md:p-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(b.image, 1000)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/0" />
            <span className="relative">
              <span className="block font-display text-3xl md:text-4xl">{b.title}</span>
              <span className="mt-2 block max-w-sm text-sm text-white/85">{b.text}</span>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink">{b.cta} <ArrowRight size={15} /></span>
            </span>
          </Link>
        ))}
      </section>

      {/* Showroom CTA */}
      <section className="wrap mt-16">
        <div className="grid overflow-hidden rounded-lg bg-accent text-on-accent md:grid-cols-2">
          <div className="p-8 md:p-12">
            <p className="text-xs uppercase tracking-[0.2em] text-[#e9d3a6]">Our showroom, Baner</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">See it before you buy it</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/85">
              Visit us opposite Icon Tower in Baner to see the carving up close, feel the finishes and talk to us about a piece made to your size.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/stores" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-accent">Showroom &amp; directions</Link>
              <a href={BUSINESS.whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold"><MessageCircle size={15} /> WhatsApp us</a>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(IMG.sunnyLiving, 1000)} alt="A bright, furnished living room" className="h-64 w-full object-cover md:h-full" />
        </div>
      </section>

      {/* Voices */}
      <section className="wrap mt-16" aria-labelledby="voices-h">
        <h2 id="voices-h" className="mb-6 font-display text-2xl md:text-3xl">From homes we&apos;ve furnished</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {voices.map((v) => (
            <figure key={v.name} className="rounded-lg border border-border bg-surface p-6">
              <blockquote className="font-display text-lg leading-7">&ldquo;{v.text}&rdquo;</blockquote>
              <figcaption className="mt-4 text-sm text-muted">{v.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
