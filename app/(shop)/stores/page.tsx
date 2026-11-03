import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { BUSINESS } from "@/lib/business";
import SocialLinks from "@/components/Social";

export const metadata: Metadata = {
  title: "Showroom & contact",
  description: `Visit ${BUSINESS.name} in Baner, Pune. ${BUSINESS.address.oneLine}. Call ${BUSINESS.phone}.`,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FurnitureStore",
  name: BUSINESS.name,
  url: BUSINESS.website,
  telephone: BUSINESS.phone,
  email: BUSINESS.email,
  foundingDate: String(BUSINESS.since),
  address: {
    "@type": "PostalAddress",
    streetAddress: "Sr no 116/2A, near KFC, opp. Icon Tower, Baner",
    addressLocality: "Pune",
    addressRegion: "Maharashtra",
    postalCode: "411045",
    addressCountry: "IN",
  },
};

export default function ShowroomPage() {
  return (
    <div className="wrap py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-xs uppercase tracking-[0.2em] text-brass">Since {BUSINESS.since}</p>
      <h1 className="mt-2 font-display text-4xl">Visit our showroom</h1>
      <p className="mt-3 max-w-2xl text-muted">See the carving up close, feel the finishes and talk to us about a piece made to your size. We&apos;re in Baner, opposite Icon Tower.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-semibold">{BUSINESS.name}</h2>
          <address className="mt-4 space-y-4 text-sm not-italic">
            <p className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-brass" /><span>{BUSINESS.address.lines.map((l) => <span key={l} className="block">{l}</span>)}</span></p>
            <p><a href={BUSINESS.phoneHref} className="flex gap-3 hover:text-accent"><Phone size={18} className="shrink-0 text-brass" />{BUSINESS.phone}</a></p>
            <p><a href={`mailto:${BUSINESS.email}`} className="flex gap-3 break-all hover:text-accent"><Mail size={18} className="shrink-0 text-brass" />{BUSINESS.email}</a></p>
          </address>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={BUSINESS.mapsHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover"><Navigation size={15} /> Get directions</a>
            <a href={BUSINESS.whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-accent px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/5"><MessageCircle size={15} /> WhatsApp us</a>
          </div>
          <div className="mt-8 rounded-lg bg-ink p-4">
            <p className="mb-3 text-xs uppercase tracking-wider text-white/70">Follow us</p>
            <SocialLinks />
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-surface-alt">
          <iframe
            title={`Map showing ${BUSINESS.name}, Baner, Pune`}
            src={BUSINESS.mapEmbed}
            className="h-[360px] w-full lg:h-full lg:min-h-[460px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
