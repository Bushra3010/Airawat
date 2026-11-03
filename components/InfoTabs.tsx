"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";

export default function InfoTabs({ p }: { p: Product }) {
  const tabs = [
    {
      label: "Specifications",
      body: (
        <dl className="grid gap-x-10 sm:grid-cols-2">
          {[
            ["Material", p.material],
            ["Finish", p.finish],
            ["Colour", p.colour],
            ["Style", p.design],
            ["Dimensions", p.dims],
            ["Sizes available", p.sizes.map((s) => s.name).join(", ")],
            ["Assembly", "Done by our crew on delivery"],
            ["Warranty", "3 years on frame and joinery"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-border py-3 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    { label: "About this piece", body: <p className="max-w-3xl text-sm leading-7 text-muted">{p.summary}</p> },
    {
      label: "Care",
      body: (
        <ul className="max-w-3xl list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          <li>Dust weekly with a dry, soft cloth. Skip polishes with silicone.</li>
          <li>Keep out of direct afternoon sun to stop the finish from fading unevenly.</li>
          <li>Blot spills on fabric straight away; never rub.</li>
          <li>Use coasters and felt pads. Wood moves with the seasons; small gaps are normal.</li>
        </ul>
      ),
    },
    {
      label: "Delivery & returns",
      body: (
        <ul className="max-w-3xl list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          <li>Delivered and assembled by our own team. We call to book a slot before dispatch.</li>
          <li>Returns and refunds follow our refund &amp; return policy. Call or WhatsApp us and we&apos;ll help.</li>
          <li>Something damaged on arrival? Send us photos and we&apos;ll sort it out.</li>
        </ul>
      ),
    },
  ];
  const [i, setI] = useState(0);
  return (
    <section className="mt-14 rounded-lg border border-border bg-surface">
      <div role="tablist" aria-label="Product information" className="no-scrollbar flex overflow-x-auto border-b border-border">
        {tabs.map((t, n) => (
          <button
            key={t.label}
            role="tab"
            id={`tab-${n}`}
            aria-selected={i === n}
            aria-controls={`panel-${n}`}
            onClick={() => setI(n)}
            className={`shrink-0 border-b-2 px-5 py-4 text-sm font-medium ${i === n ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${i}`} aria-labelledby={`tab-${i}`} className="p-6">{tabs[i].body}</div>
    </section>
  );
}
