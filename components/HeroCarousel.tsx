"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { img } from "@/lib/catalog";
import { IMG } from "@/lib/content";

const slides = [
  { kicker: "Festive Sale", title: "Gather round,\nfor less.", text: "Festive prices on dining sets made from solid sheesham.", cta: "Shop the sale", href: "/sale", image: IMG.diningGreen },
  { kicker: "New in velvet", title: "Sink into\nsomething deep.", text: "The Nila sofa, now in forest, ink and rust.", cta: "Shop sofas", href: "/c/sofas", image: IMG.tealSofa },
  { kicker: "Bedroom edit", title: "Storage you\nwon't see.", text: "Hydraulic and drawer beds, delivered assembled.", cta: "Shop beds", href: "/c/beds", image: IMG.bedroomTufted },
];

export default function HeroCarousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused]);
  const go = (d: number) => setI((n) => (n + d + slides.length) % slides.length);

  return (
    <section
      className="wrap mt-4"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[440px] overflow-hidden rounded-lg md:h-[520px]">
        {slides.map((s, n) => (
          <div
            key={s.title}
            aria-hidden={n !== i}
            className={`absolute inset-0 transition-opacity duration-700 ${n === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(s.image, 1600)} alt="" className="h-full w-full object-cover" fetchPriority={n === 0 ? "high" : "auto"} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center p-7 text-white md:p-14">
              <p className="text-xs uppercase tracking-[0.25em] text-[#e9d3a6]">{s.kicker}</p>
              <h1 className="mt-3 whitespace-pre-line font-display text-4xl leading-[1.05] md:text-6xl">{s.title}</h1>
              <p className="mt-4 text-sm text-white/85 md:text-base">{s.text}</p>
              <Link href={s.href} tabIndex={n === i ? 0 : -1} className="mt-7 w-fit rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-[#e9d3a6]">
                {s.cta}
              </Link>
            </div>
          </div>
        ))}
        <button onClick={() => go(-1)} aria-label="Previous slide" className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink hover:bg-white md:grid"><ChevronLeft size={20} /></button>
        <button onClick={() => go(1)} aria-label="Next slide" className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink hover:bg-white md:grid"><ChevronRight size={20} /></button>
        <div className="absolute bottom-5 left-7 flex gap-2 md:left-14">
          {slides.map((s, n) => (
            <button key={s.title} onClick={() => setI(n)} aria-label={`Go to slide ${n + 1}`} aria-current={n === i} className={`h-1.5 rounded-full transition-all ${n === i ? "w-8 bg-white" : "w-4 bg-white/50"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
