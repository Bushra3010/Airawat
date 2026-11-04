import Link from "next/link";
import { Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Category } from "@/lib/catalog";
import { BUSINESS } from "@/lib/business";
import SocialLinks from "@/components/Social";

const help = [["Track your order", "/track"], ["Returns & refunds", "/help"], ["Care guides", "/help"], ["Our showroom", "/stores"], ["About us", "/about"], ["Bulk & trade", "/trade"], ["Privacy policy", "/privacy"], ["Terms of use", "/terms"]];

export default function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-20 bg-ink font-footer text-white/80">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.3fr_0.8fr_0.8fr_1.3fr]">
        <div>
          <Link href="/" aria-label="Airawat Handicraft home" className="inline-block rounded-lg bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-full.png" alt="Airawat Handicraft" width={230} height={281} className="h-24 w-auto" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6">{BUSINESS.tagline}</p>
          <SocialLinks className="mt-5" />
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold text-white">Shop</p>
          <ul className="space-y-2.5 text-sm">
            {categories.map((c) => <li key={c.slug}><Link href={`/c/${c.slug}`} className="hover:text-white">{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold text-white">Help</p>
          <ul className="space-y-2.5 text-sm">
            {help.map(([l, h]) => <li key={l}><Link href={h} className="hover:text-white">{l}</Link></li>)}
          </ul>
        </div>
        <address className="not-italic">
          <p className="mb-4 text-sm font-semibold text-white">Visit or call us</p>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={BUSINESS.mapsHref} target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-white">
                <MapPin size={17} className="mt-0.5 shrink-0 text-[#e9d3a6]" />
                <span>{BUSINESS.address.lines.map((l) => <span key={l} className="block">{l}</span>)}</span>
              </a>
            </li>
            <li><a href={BUSINESS.phoneHref} className="flex gap-3 hover:text-white"><Phone size={17} className="shrink-0 text-[#e9d3a6]" />{BUSINESS.phone}</a></li>
            <li><a href={BUSINESS.whatsappHref} target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-white"><MessageCircle size={17} className="shrink-0 text-[#e9d3a6]" />Chat on WhatsApp</a></li>
            <li><a href={`mailto:${BUSINESS.email}`} className="flex gap-3 break-all hover:text-white"><Mail size={17} className="shrink-0 text-[#e9d3a6]" />{BUSINESS.email}</a></li>
            <li><Link href="/" className="flex gap-3 hover:text-white"><Globe size={17} className="shrink-0 text-[#e9d3a6]" />airawathandicraft.com</Link></li>
          </ul>
        </address>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-2 py-5 text-xs text-white/60 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} {BUSINESS.name}, Baner, Pune. All rights reserved.</p>
          <p>Product photos: Unsplash contributors</p>
        </div>
      </div>
    </footer>
  );
}
