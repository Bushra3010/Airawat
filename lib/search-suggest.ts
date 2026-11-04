// Search-as-you-type suggestions built from the catalogue: phrases like "Dining Chairs" or
// "Velvet Sofas" that open a filtered category, plus matching products.

export type SearchIndex = {
  categories: { slug: string; name: string; subs: string[] }[];
  products: {
    slug: string; name: string; category: string; sub: string; material: string;
    finish: string; colour: string; design: string; price: number; image: string;
  }[];
};

export type Phrase = { text: string; href: string; weight: number };

// How each category reads in a phrase, e.g. "Velvet Sofas", "Teak Dining Sets".
const NOUN: Record<string, string> = {
  sofas: "Sofas", beds: "Beds", dining: "Dining Sets", chairs: "Chairs",
  tables: "Tables", storage: "Storage", study: "Study Furniture",
};

// Sub-categories that need a word added to read naturally on their own.
function subPhrase(cat: string, sub: string) {
  if (/seater|shape/i.test(sub)) return `${sub} ${cat === "dining" ? "Dining Sets" : NOUN[cat] ?? ""}`.trim();
  if (cat === "beds" && /^(king|queen)$/i.test(sub)) return `${sub} Size Beds`;
  if (cat === "beds" && /storage/i.test(sub)) return "Beds with Storage";
  if (cat === "sofas" && /cum bed/i.test(sub)) return "Sofa Cum Beds";
  if (cat === "dining" && /chairs/i.test(sub)) return "Dining Chairs";
  if (cat === "study" && /chairs/i.test(sub)) return "Study Chairs";
  if (cat === "study" && /desks/i.test(sub)) return "Study Desks";
  if (/wingback/i.test(sub)) return "Wingback Chairs";
  return sub;
}

const qs = (p: Record<string, string>) => new URLSearchParams(p).toString();

export function buildPhrases(index: SearchIndex): Phrase[] {
  const seen = new Map<string, Phrase>();
  const add = (text: string, href: string, weight: number) => {
    const key = text.toLowerCase();
    const cur = seen.get(key);
    if (cur) cur.weight += weight;
    else seen.set(key, { text, href, weight });
  };
  const count = (pred: (p: SearchIndex["products"][number]) => boolean) => index.products.filter(pred).length;

  for (const c of index.categories) {
    add(c.name, `/c/${c.slug}`, 10 + count((p) => p.category === c.slug));
    for (const s of c.subs) {
      const n = count((p) => p.category === c.slug && p.sub === s);
      if (n) add(subPhrase(c.slug, s), `/c/${c.slug}?${qs({ sub: s })}`, 5 + n);
    }
  }
  for (const p of index.products) {
    const noun = NOUN[p.category] ?? p.category;
    add(`${p.material} ${noun}`, `/c/${p.category}?${qs({ material: p.material })}`, 2);
    add(`${p.colour} ${noun}`, `/c/${p.category}?${qs({ colour: p.colour })}`, 1);
    add(`${p.finish} ${noun}`, `/c/${p.category}?${qs({ finish: p.finish })}`, 1);
    add(`${p.design} ${noun}`, `/search?${qs({ q: `${p.design} ${p.category}` })}`, 1);
  }
  return [...seen.values()];
}

const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter(Boolean);

// Every typed word must start a word in the text ("din cha" matches "Dining Chairs").
function matches(text: string, q: string[]) {
  const t = words(text);
  return q.every((w) => t.some((x) => x.startsWith(w) || (w.length > 2 && x.startsWith(w.replace(/s$/, "")))));
}

export function suggest(index: SearchIndex, phrases: Phrase[], query: string) {
  const q = words(query);
  if (!q.length) {
    return {
      phrases: [...phrases].sort((a, b) => b.weight - a.weight).slice(0, 6),
      products: index.products.slice(0, 3),
    };
  }
  const starts = (t: string) => t.toLowerCase().startsWith(q[0]);
  const found = phrases
    .filter((p) => matches(p.text, q))
    .sort((a, b) => Number(starts(b.text)) - Number(starts(a.text)) || b.weight - a.weight || a.text.length - b.text.length)
    .slice(0, 6);
  const products = index.products
    .filter((p) => matches(`${p.name} ${p.material} ${p.finish} ${p.colour} ${p.design} ${p.sub} ${NOUN[p.category] ?? ""}`, q))
    .slice(0, 4);
  return { phrases: found, products };
}

/** Split text into parts with the typed words marked, for bolding like "**Din**ing Chairs". */
export function highlight(text: string, query: string): { text: string; hit: boolean }[] {
  const q = words(query);
  if (!q.length) return [{ text, hit: false }];
  const re = new RegExp(`\\b(${q.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const out: { text: string; hit: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index), hit: false });
    out.push({ text: m[0], hit: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), hit: false });
  return out;
}
