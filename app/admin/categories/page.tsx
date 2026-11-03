"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { img } from "@/lib/catalog";
import { friendlyError, refreshSite, slugify, uploadImage } from "@/lib/admin";
import { browserClient } from "@/lib/supabase-browser";
import { Button, Card, Field, Notice, PageHeader, Skeleton, inputCls } from "@/components/admin/ui";

type Cat = { slug: string; name: string; room: string; blurb: string; image: string; subs: string[]; position: number; isNew?: boolean };

function CategoryCard({ c, onSaved, onDeleted }: { c: Cat; onSaved: (c: Cat) => void; onDeleted: (slug: string) => void }) {
  const [f, setF] = useState({ ...c, subsText: c.subs.join(", ") });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    if (f.name.trim().length < 2) return setMsg({ kind: "error", text: "Give the category a name." });
    if (!f.image) return setMsg({ kind: "error", text: "Add a category photo." });
    setBusy(true);
    const row = {
      slug: c.isNew ? slugify(f.name) : c.slug,
      name: f.name.trim(), room: f.room.trim() || "Living", blurb: f.blurb.trim(), image: f.image,
      subs: f.subsText.split(",").map((s) => s.trim()).filter(Boolean), position: f.position,
    };
    const sb = browserClient();
    const { error } = c.isNew ? await sb.from("categories").insert(row) : await sb.from("categories").update(row).eq("slug", c.slug);
    if (error) {
      setBusy(false);
      return setMsg({ kind: "error", text: /duplicate key/.test(error.message) ? "A category with this name already exists." : friendlyError(error.message) });
    }
    const refreshed = await refreshSite();
    setBusy(false);
    setMsg({ kind: "ok", text: refreshed ? "Saved. The shop is updated." : "Saved." });
    onSaved({ ...row });
  };

  const remove = async () => {
    if (c.isNew) return onDeleted(c.slug);
    if (!confirm(`Delete the “${c.name}” category? Only possible when it has no products.`)) return;
    setBusy(true);
    const { error } = await browserClient().from("categories").delete().eq("slug", c.slug);
    setBusy(false);
    if (error) return setMsg({ kind: "error", text: friendlyError(error.message) });
    await refreshSite();
    onDeleted(c.slug);
  };

  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
        <div className="w-28 md:w-auto">
          <button onClick={() => fileRef.current?.click()} className="group relative block aspect-square w-full overflow-hidden rounded-full border border-border bg-surface-alt" aria-label="Change category photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {f.image && <img src={img(f.image, 300)} alt="" className="h-full w-full object-cover" />}
            <span className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100"><ImagePlus size={22} /></span>
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try { setF({ ...f, image: await uploadImage(file) }); } catch (err) { setMsg({ kind: "error", text: err instanceof Error ? err.message : "Upload failed." }); }
          }} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
          <Field label="Room" hint="Shown in the breadcrumb, e.g. Living, Bedroom"><input value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} className={inputCls} /></Field>
          <Field label="Short description" className="sm:col-span-2"><input value={f.blurb} onChange={(e) => setF({ ...f, blurb: e.target.value })} className={inputCls} /></Field>
          <Field label="Sub-categories" hint="Comma separated. These become the filter chips." className="sm:col-span-2"><input value={f.subsText} onChange={(e) => setF({ ...f, subsText: e.target.value })} className={inputCls} /></Field>
          <Field label="Menu order" hint="Lower numbers appear first."><input type="number" value={f.position} onChange={(e) => setF({ ...f, position: Number(e.target.value) })} className={inputCls} /></Field>
          <div className="flex items-end gap-2">
            <Button onClick={save} disabled={busy} className="flex-1">{busy ? "Saving…" : c.isNew ? "Create" : "Save"}</Button>
            <Button variant="danger" onClick={remove} disabled={busy} aria-label={`Delete ${c.name || "category"}`}><Trash2 size={16} /></Button>
          </div>
          {msg && <div className="sm:col-span-2"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
        </div>
      </div>
    </Card>
  );
}

export default function CategoriesPage() {
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    browserClient().from("categories").select("slug, name, room, blurb, image, subs, position").order("position")
      .then(({ data, error }) => (error ? setError(error.message) : setCats(data as Cat[])));
  }, []);

  const add = () => setCats((c) => [...(c ?? []), { slug: `new-${Date.now()}`, name: "", room: "", blurb: "", image: "", subs: [], position: (c?.length ?? 0), isNew: true }]);

  return (
    <>
      <PageHeader title="Categories" sub="These appear in the menu, on the home page and as shop sections." action={<Button onClick={add}><Plus size={16} /> New category</Button>} />
      {error && <Notice kind="error">{error}</Notice>}
      {!cats && !error ? <Skeleton /> : (
        <div className="space-y-4">
          {cats?.map((c, i) => (
            <CategoryCard
              key={c.slug}
              c={c}
              onSaved={(saved) => setCats((all) => all?.map((x, j) => (j === i ? saved : x)) ?? null)}
              onDeleted={(slug) => setCats((all) => all?.filter((x) => x.slug !== slug) ?? null)}
            />
          ))}
        </div>
      )}
    </>
  );
}
