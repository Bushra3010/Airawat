import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BUSINESS } from "@/lib/business";
import { img, type Product } from "@/lib/catalog";
import type { Room, RoomItem } from "@/lib/content";
import { ICON_PATHS } from "@/lib/social-icons";

function count(item: RoomItem, products: Product[]) {
  return products.filter((p) => {
    if (item.cat && p.category === item.cat && (!item.sub || p.sub === item.sub)) return true;
    const text = `${p.name} ${p.sub} ${p.material} ${p.design}`.toLowerCase();
    return item.keywords.some((k) => text.includes(k));
  }).length;
}

const enquire = (item: RoomItem, room: Room) =>
  `${BUSINESS.whatsappHref}?text=${encodeURIComponent(`Hi Airawat Handicraft! I'm looking for ${item.label.toLowerCase()} for my ${room.name.toLowerCase()}. What do you have?`)}`;

const chip = "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs leading-none transition";

/** "Furnish a whole room": room photos with what goes in each room underneath. */
export default function RoomCards({ rooms, products }: { rooms: Room[]; products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-5">
      {rooms.map((r) => (
        <div key={r.name}>
          <Link href={`/c/${r.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(r.image, 600)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white">
              <span className="font-display text-xl leading-tight">{r.name}</span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur transition group-hover:bg-white group-hover:text-ink"><ArrowRight size={16} /></span>
            </span>
          </Link>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`What you'll need: ${r.name}`}>
            {r.items.map((item) => {
              const n = count(item, products);
              const href = n ? item.href ?? `/search?q=${encodeURIComponent(item.label)}` : null;
              return (
                <li key={item.label}>
                  {href ? (
                    <Link href={href} className={`${chip} border-border bg-surface text-ink hover:border-accent hover:text-accent`}>
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={enquire(item, r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ask us on WhatsApp"
                      aria-label={`${item.label}: ask us on WhatsApp (opens in a new tab)`}
                      className={`${chip} border-dashed border-border-input text-muted hover:border-[#25d366] hover:text-ink`}
                    >
                      {item.label}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#1fa855" aria-hidden="true"><path d={ICON_PATHS.whatsapp} /></svg>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
