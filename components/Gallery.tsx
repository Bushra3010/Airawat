"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { img } from "@/lib/catalog";

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const go = (d: number) => setI((n) => (n + d + images.length) % images.length);
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row lg:sticky lg:top-40 lg:self-start">
      <ul className="no-scrollbar flex gap-3 overflow-x-auto md:flex-col" aria-label="Product images">
        {images.map((src, n) => (
          <li key={src}>
            <button onClick={() => setI(n)} aria-label={`Show image ${n + 1}`} aria-current={n === i} className={`block h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 ${n === i ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(src, 200)} alt="" className="h-full w-full object-cover" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative aspect-[4/3] flex-1 overflow-hidden rounded-lg bg-surface-alt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img(images[i], 1400)} alt={`${name}, view ${i + 1}`} className="h-full w-full object-cover" />
        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-card"><ChevronLeft size={18} /></button>
            <button onClick={() => go(1)} aria-label="Next image" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-card"><ChevronRight size={18} /></button>
          </>
        )}
      </div>
    </div>
  );
}
