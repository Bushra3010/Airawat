"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, ExternalLink, ImagePlus, Plus, Trash2 } from "lucide-react";
import { formatINR, img } from "@/lib/catalog";
import { friendlyError, paise, refreshSite, rupees, slugify, uploadImage } from "@/lib/admin";
import { browserClient } from "@/lib/supabase-browser";
import { Button, Card, Field, Notice, PageHeader, Skeleton, inputCls } from "@/components/admin/ui";

type Variant = { group_name: string; name: string; swatch: string; delta: number };
type Size = { name: string; delta: number };
type Form = {
  id: string | null;
  name: string; slug: string; category_slug: string; sub: string;
  material: string; finish: string; colour: string; design: string;
  price: number; mrp: number; ships_fast: boolean; deal: boolean; active: boolean;
  images: string[]; dims: string; summary: string;
  variants: Variant[]; sizes: Size[];
  pkg: { l: number; b: number; h: number; w: number };
};

const blank: Form = {
  id: null, name: "", slug: "", category_slug: "", sub: "", material: "", finish: "", colour: "", design: "",
  price: 0, mrp: 0, ships_fast: false, deal: false, active: true, images: [], dims: "", summary: "",
  variants: [{ group_name: "Finish", name: "Standard", swatch: "#a8743f", delta: 0 }],
  sizes: [{ name: "Standard", delta: 0 }],
  pkg: { l: 0, b: 0, h: 0, w: 0 },
};

export default function ProductEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const [f, setF] = useState<Form | null>(isNew ? blank : null);
  const [cats, setCats] = useState<{ slug: string; name: string; subs: string[] }[]>([]);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [imgUrl, setImgUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sb = browserClient();
    sb.from("categories").select("slug, name, subs").order("position").then(({ data }) => setCats(data ?? []));
    if (isNew) return;
    sb.from("products")
      .select("*, product_variants(group_name, name, swatch, delta_paise, position), product_sizes(name, delta_paise, position)")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return setMsg({ kind: "error", text: error?.message ?? "Product not found." });
        const byPos = (a: { position: number }, b: { position: number }) => a.position - b.position;
        setF({
          id: data.id, name: data.name, slug: data.slug, category_slug: data.category_slug, sub: data.sub,
          material: data.material, finish: data.finish, colour: data.colour, design: data.design,
          price: rupees(data.price_paise), mrp: rupees(data.mrp_paise), ships_fast: data.ships_fast, deal: data.deal, active: data.active,
          images: data.images, dims: data.dims, summary: data.summary,
          variants: [...data.product_variants].sort(byPos).map((v: { group_name: string; name: string; swatch: string; delta_paise: number }) => ({ group_name: v.group_name, name: v.name, swatch: v.swatch, delta: rupees(v.delta_paise) })),
          sizes: [...data.product_sizes].sort(byPos).map((s: { name: string; delta_paise: number }) => ({ name: s.name, delta: rupees(s.delta_paise) })),
          pkg: { l: Number(data.pkg_length_cm) || 0, b: Number(data.pkg_breadth_cm) || 0, h: Number(data.pkg_height_cm) || 0, w: Number(data.pkg_weight_kg) || 0 },
        });
      });
  }, [id, isNew]);

  if (!f) return msg ? <Notice kind="error">{msg.text}</Notice> : <Skeleton rows={6} />;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((cur) => (cur ? { ...cur, [k]: v } : cur));
  const subs = cats.find((c) => c.slug === f.category_slug)?.subs ?? [];

  const validate = () => {
    if (f.name.trim().length < 3) return "Give the product a name.";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) return "The web address may use only lowercase letters, numbers and dashes.";
    if (!f.category_slug) return "Choose a category.";
    if (!(f.price > 0)) return "Enter a price above ₹0.";
    if (f.mrp < f.price) return "MRP must be the same as or higher than the price.";
    if (!f.images.length) return "Add at least one photo.";
    if (!f.variants.length || f.variants.some((v) => !v.name.trim() || !v.group_name.trim())) return "Every option needs a group and a name.";
    if (new Set(f.variants.map((v) => v.name.trim())).size !== f.variants.length) return "Option names must be different from each other.";
    if (!f.sizes.length || f.sizes.some((s) => !s.name.trim())) return "Every size needs a name.";
    if (new Set(f.sizes.map((s) => s.name.trim())).size !== f.sizes.length) return "Size names must be different from each other.";
    if (f.variants.some((v) => f.price + v.delta <= 0) || f.sizes.some((s) => f.price + s.delta <= 0)) return "An option or size makes the price ₹0 or less.";
    const box = [f.pkg.l, f.pkg.b, f.pkg.h, f.pkg.w];
    if (box.some((n) => n < 0) || (box.some((n) => n > 0) && box.some((n) => !(n > 0)))) return "Fill in all four shipping box values, or leave them all empty.";
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) return setMsg({ kind: "error", text: problem });
    setBusy(true);
    setMsg(null);
    const { data, error } = await browserClient().rpc("admin_save_product", {
      p: {
        id: f.id, slug: f.slug, category_slug: f.category_slug, name: f.name.trim(), sub: f.sub.trim() || (subs[0] ?? ""),
        material: f.material.trim(), finish: f.finish.trim(), colour: f.colour.trim(), design: f.design.trim(),
        price_paise: paise(f.price), mrp_paise: paise(f.mrp), ships_fast: f.ships_fast, deal: f.deal, active: f.active,
        images: f.images, dims: f.dims.trim(), summary: f.summary.trim(),
        variants: f.variants.map((v) => ({ group_name: v.group_name.trim(), name: v.name.trim(), swatch: v.swatch, delta_paise: paise(v.delta) })),
        sizes: f.sizes.map((s) => ({ name: s.name.trim(), delta_paise: paise(s.delta) })),
      },
    });
    if (error) {
      setBusy(false);
      return setMsg({ kind: "error", text: friendlyError(error.message) });
    }
    const v = (n: number) => (n > 0 ? n : null);
    const { error: boxErr } = await browserClient().from("products")
      .update({ pkg_length_cm: v(f.pkg.l), pkg_breadth_cm: v(f.pkg.b), pkg_height_cm: v(f.pkg.h), pkg_weight_kg: v(f.pkg.w) })
      .eq("id", data as string);
    if (boxErr) {
      setBusy(false);
      return setMsg({ kind: "error", text: `Saved, but the shipping box size wasn't: ${friendlyError(boxErr.message)}` });
    }
    const refreshed = await refreshSite();
    setBusy(false);
    setMsg({ kind: "ok", text: refreshed ? "Saved. The shop is updated." : "Saved. The shop will show the change within 5 minutes." });
    if (isNew) router.replace(`/admin/products/${data}`);
    else setF({ ...f, id: data as string });
  };

  const remove = async () => {
    if (!f.id || !confirm(`Delete “${f.name}” permanently? This can't be undone. To take it off the shop but keep it, use “Hide” instead.`)) return;
    setBusy(true);
    const { error } = await browserClient().from("products").delete().eq("id", f.id);
    if (error) {
      setBusy(false);
      return setMsg({ kind: "error", text: friendlyError(error.message) });
    }
    await refreshSite();
    router.replace("/admin/products");
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMsg(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadImage(file));
      setF((cur) => (cur ? { ...cur, images: [...cur.images, ...urls] } : cur));
    } catch (err) {
      setMsg({ kind: "error", text: err instanceof Error ? friendlyError(err.message) : "Upload failed." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const text = (k: keyof Form, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input value={String(f[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} className={inputCls} />
    </Field>
  );

  return (
    <>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> All products</Link>
      <PageHeader
        title={isNew ? "New product" : f.name || "Edit product"}
        action={!isNew && f.active ? <a href={`/p/${f.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-accent underline">View in shop <ExternalLink size={14} /></a> : undefined}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" className="sm:col-span-2">
                <input value={f.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} className={inputCls} />
              </Field>
              <Field label="Web address" hint={`airawat…/p/${f.slug || "…"}`} className="sm:col-span-2">
                <input value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} className={inputCls} />
              </Field>
              <Field label="Category">
                <select value={f.category_slug} onChange={(e) => { set("category_slug", e.target.value); set("sub", ""); }} className={inputCls}>
                  <option value="">Choose…</option>
                  {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Sub-category" hint="Used for the filter chips on the category page.">
                <input list="subs" value={f.sub} onChange={(e) => set("sub", e.target.value)} className={inputCls} />
                <datalist id="subs">{subs.map((s) => <option key={s} value={s} />)}</datalist>
              </Field>
              {text("material", "Material", "e.g. Sheesham Wood, Velvet")}
              {text("finish", "Finish", "e.g. Natural Teak, Honey Oak")}
              {text("colour", "Colour", "Used by the colour filter")}
              {text("design", "Style", "e.g. Modern, Classic, Rustic")}
              {text("dims", "Dimensions", "e.g. 78 L x 34 W x 32 H in")}
              <Field label="Description" className="sm:col-span-2">
                <textarea value={f.summary} onChange={(e) => set("summary", e.target.value)} rows={4} className={`${inputCls} h-auto py-2`} />
              </Field>
            </div>
          </Card>

          <Card title="Photos">
            <p className="mb-3 text-xs text-muted">The first photo is the main one in listings. JPG, PNG or WebP, up to 5 MB each.</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {f.images.map((src, i) => (
                <li key={src} className="group relative overflow-hidden rounded-md border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(src, 300)} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                  {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">MAIN</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 p-1.5">
                    {i > 0 && <button onClick={() => set("images", [src, ...f.images.filter((x) => x !== src)])} aria-label={`Make photo ${i + 1} the main photo`} className="rounded bg-white/90 p-1.5"><ArrowUp size={14} /></button>}
                    <button onClick={() => set("images", f.images.filter((x) => x !== src))} aria-label={`Remove photo ${i + 1}`} className="rounded bg-white/90 p-1.5 text-danger"><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
              <li>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border text-sm text-muted hover:border-accent hover:text-accent disabled:opacity-60">
                  <ImagePlus size={22} /> {uploading ? "Uploading…" : "Upload photos"}
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => addFiles(e.target.files)} />
              </li>
            </ul>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (/^https:\/\//.test(imgUrl)) { set("images", [...f.images, imgUrl.trim()]); setImgUrl(""); } }}>
              <label htmlFor="imgurl" className="sr-only">Photo link</label>
              <input id="imgurl" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="…or paste a photo link (https://)" className={inputCls} />
              <Button type="submit" variant="outline">Add</Button>
            </form>
          </Card>

          <Card title="Options (fabric, finish or colour)">
            <p className="mb-3 text-xs text-muted">Shown as colour swatches. “Extra” is added to the price; use 0 if it costs the same.</p>
            <div className="space-y-2">
              {f.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_48px_100px_40px] items-end gap-2">
                  <Field label={i === 0 ? "Group" : ""}><input aria-label="Option group" value={v.group_name} onChange={(e) => set("variants", f.variants.map((x, j) => (j === i ? { ...x, group_name: e.target.value } : x)))} className={inputCls} placeholder="Velvet" /></Field>
                  <Field label={i === 0 ? "Name" : ""}><input aria-label="Option name" value={v.name} onChange={(e) => set("variants", f.variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={inputCls} placeholder="Forest Green" /></Field>
                  <Field label={i === 0 ? "Colour" : ""}><input aria-label="Swatch colour" type="color" value={v.swatch} onChange={(e) => set("variants", f.variants.map((x, j) => (j === i ? { ...x, swatch: e.target.value } : x)))} className="h-10 w-12 cursor-pointer rounded-md border border-border-input bg-surface p-1" /></Field>
                  <Field label={i === 0 ? "Extra ₹" : ""}><input aria-label="Extra price in rupees" type="number" value={v.delta} onChange={(e) => set("variants", f.variants.map((x, j) => (j === i ? { ...x, delta: Number(e.target.value) } : x)))} className={inputCls} /></Field>
                  <button onClick={() => set("variants", f.variants.filter((_, j) => j !== i))} disabled={f.variants.length === 1} aria-label="Remove option" className="grid h-10 place-items-center rounded-md text-danger hover:bg-danger/10 disabled:opacity-30"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-3" onClick={() => set("variants", [...f.variants, { group_name: f.variants[0]?.group_name ?? "Finish", name: "", swatch: "#cccccc", delta: 0 }])}><Plus size={15} /> Add option</Button>
          </Card>

          <Card title="Sizes">
            <p className="mb-3 text-xs text-muted">The size with 0 is the one the main price refers to. Use negative numbers for smaller, cheaper sizes.</p>
            <div className="space-y-2">
              {f.sizes.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_40px] items-end gap-2">
                  <Field label={i === 0 ? "Size" : ""}><input aria-label="Size name" value={s.name} onChange={(e) => set("sizes", f.sizes.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={inputCls} placeholder="3 Seater" /></Field>
                  <Field label={i === 0 ? "Price change ₹" : ""}><input aria-label="Price change in rupees" type="number" value={s.delta} onChange={(e) => set("sizes", f.sizes.map((x, j) => (j === i ? { ...x, delta: Number(e.target.value) } : x)))} className={inputCls} /></Field>
                  <button onClick={() => set("sizes", f.sizes.filter((_, j) => j !== i))} disabled={f.sizes.length === 1} aria-label="Remove size" className="grid h-10 place-items-center rounded-md text-danger hover:bg-danger/10 disabled:opacity-30"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-3" onClick={() => set("sizes", [...f.sizes, { name: "", delta: 0 }])}><Plus size={15} /> Add size</Button>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <Card title="Price">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price ₹"><input type="number" min={0} value={f.price || ""} onChange={(e) => set("price", Number(e.target.value))} className={inputCls} /></Field>
              <Field label="MRP ₹"><input type="number" min={0} value={f.mrp || ""} onChange={(e) => set("mrp", Number(e.target.value))} className={inputCls} /></Field>
            </div>
            {f.price > 0 && f.mrp >= f.price && (
              <p className="mt-2 text-xs text-muted">Shows as {formatINR(f.price)} <s>{formatINR(f.mrp)}</s> · {Math.round((1 - f.price / f.mrp) * 100)}% off</p>
            )}
          </Card>

          <Card title="Shipping box">
            <p className="mb-3 text-xs text-muted">Size and weight of one piece, packed. Used to book Shiprocket couriers automatically.</p>
            <div className="grid grid-cols-2 gap-3">
              {([["l", "Length cm"], ["b", "Breadth cm"], ["h", "Height cm"], ["w", "Weight kg"]] as const).map(([k, label]) => (
                <Field key={k} label={label}>
                  <input type="number" min={0} step="0.1" value={f.pkg[k] || ""} onChange={(e) => set("pkg", { ...f.pkg, [k]: Number(e.target.value) })} className={inputCls} />
                </Field>
              ))}
            </div>
          </Card>

          <Card title="Visibility">
            {[
              ["active", "Show in shop", "Hidden products stay in old orders but can't be found or bought."],
              ["deal", "Deal of the week", "Adds the red badge and the countdown on the product page."],
              ["ships_fast", "Ships in 48 hours", "Shows the fast-delivery note and filter."],
            ].map(([k, label, hint]) => (
              <label key={k} className="flex cursor-pointer items-start gap-3 border-b border-border py-3 last:border-0">
                <input type="checkbox" checked={Boolean(f[k as keyof Form])} onChange={(e) => set(k as "active", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" />
                <span className="text-sm"><span className="block font-medium">{label}</span><span className="text-xs text-muted">{hint}</span></span>
              </label>
            ))}
          </Card>

          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          <div className="flex gap-3">
            <Button onClick={save} disabled={busy || uploading} className="flex-1">{busy ? "Saving…" : isNew ? "Create product" : "Save changes"}</Button>
            {!isNew && <Button variant="danger" onClick={remove} disabled={busy} aria-label="Delete product"><Trash2 size={16} /></Button>}
          </div>
        </div>
      </div>
    </>
  );
}
