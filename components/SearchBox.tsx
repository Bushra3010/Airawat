"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { formatINR, img } from "@/lib/catalog";
import { buildPhrases, highlight, suggest, type Phrase, type SearchIndex } from "@/lib/search-suggest";

// One fetch per page load, shared by every search box on the page.
let indexPromise: Promise<SearchIndex> | null = null;
const loadIndex = () =>
  (indexPromise ??= fetch("/api/search-index").then((r) => (r.ok ? r.json() : Promise.reject())).catch(() => {
    indexPromise = null;
    return { categories: [], products: [] } as SearchIndex;
  }));

type Item = { kind: "phrase"; phrase: Phrase } | { kind: "product"; product: SearchIndex["products"][number] };

const RESET_EVENT = "airawat:reset-search";
/** Clear every search box on the page (used by the logo link). */
export const resetSearch = () => window.dispatchEvent(new Event(RESET_EVENT));

function Marked({ text, query }: { text: string; query: string }) {
  return <>{highlight(text, query).map((p, i) => (p.hit ? <b key={i} className="font-semibold text-ink">{p.text}</b> : <span key={i}>{p.text}</span>))}</>;
}

export default function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const phrases = useMemo(() => (index ? buildPhrases(index) : []), [index]);
  const result = useMemo(() => (index ? suggest(index, phrases, q) : { phrases: [], products: [] }), [index, phrases, q]);
  const items: Item[] = useMemo(
    () => [...result.phrases.map((phrase) => ({ kind: "phrase" as const, phrase })), ...result.products.map((product) => ({ kind: "product" as const, product }))],
    [result],
  );

  // Start fresh on every page change, and when the logo is clicked on the page you're already on.
  useEffect(() => {
    setOpen(false);
    setQ("");
  }, [pathname]);
  useEffect(() => {
    const reset = () => { setOpen(false); setQ(""); inputRef.current?.blur(); };
    window.addEventListener(RESET_EVENT, reset);
    return () => window.removeEventListener(RESET_EVENT, reset);
  }, []);
  useEffect(() => { setActive(-1); }, [q]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openBox = () => {
    setOpen(true);
    if (!index) loadIndex().then(setIndex);
  };
  const go = (href: string) => {
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
    router.push(href);
  };
  const hrefOf = (it: Item) => (it.kind === "phrase" ? it.phrase.href : `/p/${it.product.slug}`);
  const submit = () => {
    if (active >= 0 && items[active]) return go(hrefOf(items[active]));
    const text = q.trim();
    if (!text) return;
    // An exact phrase ("dining chairs") goes to its filtered category; anything else to search results.
    const exact = phrases.find((p) => p.text.toLowerCase() === text.toLowerCase());
    go(exact ? exact.href : `/search?q=${encodeURIComponent(text)}`);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); openBox(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Escape") { setOpen(false); setActive(-1); }
  };

  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;
  const showList = open && index && (items.length > 0 || q.trim());
  const firstProduct = result.phrases.length;

  return (
    <form
      ref={boxRef}
      role="search"
      className="relative w-full"
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
      <label htmlFor={`${id}-input`} className="sr-only">Search furniture</label>
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="search"
        role="combobox"
        aria-expanded={!!showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? optId(active) : undefined}
        autoComplete="off"
        enterKeyHint="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); openBox(); }}
        onFocus={openBox}
        onKeyDown={onKey}
        placeholder="Search sofas, beds, teak, velvet…"
        className="h-11 w-full rounded-full border border-border bg-surface-alt/60 pl-5 pr-20 text-sm placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {q && (
        <button type="button" onClick={() => { setQ(""); inputRef.current?.focus(); }} aria-label="Clear search" className="absolute right-11 top-1 grid h-9 w-9 place-items-center rounded-full text-muted hover:text-ink">
          <X size={16} />
        </button>
      )}
      <button type="submit" aria-label="Search" className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-accent text-on-accent hover:bg-accent-hover">
        <Search size={16} />
      </button>

      {showList && (
        <div id={listId} role="listbox" aria-label="Search suggestions" className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface py-2 shadow-pop">
          {!q.trim() && result.phrases.length > 0 && <p className="px-4 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Popular searches</p>}
          {result.phrases.map((p, i) => (
            <div
              key={p.text}
              id={optId(i)}
              role="option"
              aria-selected={active === i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(p.href)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[15px] text-muted ${active === i ? "bg-surface-alt" : ""}`}
            >
              <Search size={16} className="shrink-0 text-muted" aria-hidden />
              <span className="truncate"><Marked text={p.text} query={q} /></span>
            </div>
          ))}

          {result.products.length > 0 && (
            <>
              <p className={`px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted ${result.phrases.length ? "mt-1 border-t border-border pt-3" : "pt-1"}`}>
                {q.trim() ? "Products" : "Best sellers"}
              </p>
              {result.products.map((p, j) => {
                const i = firstProduct + j;
                return (
                  <div
                    key={p.slug}
                    id={optId(i)}
                    role="option"
                    aria-selected={active === i}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(`/p/${p.slug}`)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2 ${active === i ? "bg-surface-alt" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img(p.image, 96)} alt="" className="h-10 w-12 shrink-0 rounded object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink"><Marked text={p.name} query={q} /></span>
                      <span className="font-display text-xs font-semibold text-muted">{formatINR(p.price)}</span>
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {q.trim() && (
            <div
              role="option"
              aria-selected={false}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)}
              className="mt-1 cursor-pointer border-t border-border px-4 pt-3 text-sm font-medium text-accent hover:underline"
            >
              {items.length ? <>See all results for “{q.trim()}”</> : <>No quick matches. Search for “{q.trim()}”</>}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
