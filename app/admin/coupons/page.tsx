"use client";

import { useEffect, useState } from "react";
import { Copy, Dices, Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/catalog";
import { friendlyError, paise, rupees } from "@/lib/admin";
import { browserClient } from "@/lib/supabase-browser";
import { Badge, Button, Card, Field, Notice, PageHeader, Skeleton, inputCls } from "@/components/admin/ui";

type Coupon = {
  id: string; code: string; description: string; kind: "percent" | "flat"; value: number;
  min_order_paise: number; max_discount_paise: number | null; starts_at: string | null; ends_at: string | null;
  usage_limit: number | null; used_count: number; active: boolean; created_at: string;
};

// No 0/O or 1/I so codes are easy to read out over the phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(prefix: string, length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  const p = prefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  return p ? `${p}-${body}` : body;
}

const describe = (c: Pick<Coupon, "kind" | "value" | "min_order_paise" | "max_discount_paise">) =>
  [
    c.kind === "percent" ? `${c.value}% off` : `${formatINR(rupees(c.value))} off`,
    c.min_order_paise ? `orders above ${formatINR(rupees(c.min_order_paise))}` : "",
    c.kind === "percent" && c.max_discount_paise ? `up to ${formatINR(rupees(c.max_discount_paise))}` : "",
  ].filter(Boolean).join(", ");

function statusOf(c: Coupon): { label: string; tone: "good" | "warn" | "bad" | "neutral" } {
  const now = Date.now();
  if (!c.active) return { label: "Off", tone: "neutral" };
  if (c.ends_at && new Date(c.ends_at).getTime() < now) return { label: "Expired", tone: "bad" };
  if (c.usage_limit && c.used_count >= c.usage_limit) return { label: "Used up", tone: "bad" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: "Scheduled", tone: "warn" };
  return { label: "Live", tone: "good" };
}

const blank = { prefix: "AIRA", code: "", kind: "percent" as "percent" | "flat", value: 10, min: 0, max: 0, starts: "", ends: "", limit: 0, quantity: 1, description: "" };

export default function CouponsPage() {
  const [rows, setRows] = useState<Coupon[] | null>(null);
  const [f, setF] = useState({ ...blank, code: randomCode(blank.prefix) });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [copied, setCopied] = useState("");

  const load = () =>
    browserClient().from("coupons").select("*").order("created_at", { ascending: false })
      .then(({ data, error }) => (error ? setMsg({ kind: "error", text: error.message }) : setRows(data as Coupon[])));
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!(f.value > 0)) return setMsg({ kind: "error", text: "Enter the discount." });
    if (f.kind === "percent" && f.value > 90) return setMsg({ kind: "error", text: "Percentage discounts can be at most 90%." });
    if (f.ends && f.starts && f.ends < f.starts) return setMsg({ kind: "error", text: "The end date is before the start date." });
    const qty = Math.min(Math.max(Math.round(f.quantity) || 1, 1), 200);
    const codes = qty === 1 ? [f.code.trim().toUpperCase()] : Array.from({ length: qty }, () => randomCode(f.prefix));
    if (codes.some((c) => !/^[A-Z0-9-]{3,24}$/.test(c))) return setMsg({ kind: "error", text: "Codes use 3–24 letters, numbers or dashes." });

    const base = {
      kind: f.kind,
      value: f.kind === "percent" ? Math.round(f.value) : paise(f.value),
      min_order_paise: paise(f.min || 0),
      max_discount_paise: f.kind === "percent" && f.max > 0 ? paise(f.max) : null,
      starts_at: f.starts ? new Date(`${f.starts}T00:00:00+05:30`).toISOString() : null,
      ends_at: f.ends ? new Date(`${f.ends}T23:59:59+05:30`).toISOString() : null,
      usage_limit: f.limit > 0 ? Math.round(f.limit) : null,
    };
    const description = f.description.trim() || describe({ kind: base.kind, value: base.value, min_order_paise: base.min_order_paise, max_discount_paise: base.max_discount_paise });
    setBusy(true);
    const { error } = await browserClient().from("coupons").insert(codes.map((code) => ({ ...base, code, description })));
    setBusy(false);
    if (error) return setMsg({ kind: "error", text: /duplicate key/.test(error.message) ? "That code already exists. Generate another." : friendlyError(error.message) });
    setMsg({ kind: "ok", text: qty === 1 ? `Created ${codes[0]}.` : `Created ${qty} codes.` });
    setF({ ...f, code: randomCode(f.prefix) });
    load();
  };

  const toggle = async (c: Coupon) => {
    const { error } = await browserClient().from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (error) return setMsg({ kind: "error", text: friendlyError(error.message) });
    setRows((r) => r?.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)) ?? null);
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete ${c.code}? Past orders keep their discount. To stop new uses but keep the record, switch it off instead.`)) return;
    const { error } = await browserClient().from("coupons").delete().eq("id", c.id);
    if (error) return setMsg({ kind: "error", text: friendlyError(error.message) });
    setRows((r) => r?.filter((x) => x.id !== c.id) ?? null);
  };

  const copy = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(""), 1500); } catch {}
  };

  return (
    <>
      <PageHeader title="Coupons" sub="Create discount codes for customers to enter in their cart. Discounts apply after the buy-2 bonus." />

      <Card title="Create coupons" className="mb-6">
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="How many codes" hint="1 for a shared code, or up to 200 one-off codes.">
            <input type="number" min={1} max={200} value={f.quantity} onChange={(e) => setF({ ...f, quantity: Number(e.target.value) })} className={inputCls} />
          </Field>
          {f.quantity > 1 ? (
            <Field label="Code prefix" hint={`e.g. ${randomCode(f.prefix || "AIRA")}`}>
              <input value={f.prefix} onChange={(e) => setF({ ...f, prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })} className={inputCls} />
            </Field>
          ) : (
            <Field label="Code">
              <div className="flex gap-2">
                <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24) })} className={`${inputCls} font-mono`} />
                <Button type="button" variant="outline" onClick={() => setF({ ...f, code: randomCode(f.prefix) })} aria-label="Generate a random code"><Dices size={16} /></Button>
              </div>
            </Field>
          )}
          <Field label="Discount type">
            <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as "percent" | "flat" })} className={inputCls}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Fixed amount (₹)</option>
            </select>
          </Field>
          <Field label={f.kind === "percent" ? "Discount %" : "Discount ₹"}>
            <input type="number" min={1} value={f.value || ""} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} className={inputCls} />
          </Field>
          <Field label="Minimum order ₹" hint="0 for no minimum.">
            <input type="number" min={0} value={f.min || ""} onChange={(e) => setF({ ...f, min: Number(e.target.value) })} className={inputCls} />
          </Field>
          {f.kind === "percent" && (
            <Field label="Maximum discount ₹" hint="Optional cap.">
              <input type="number" min={0} value={f.max || ""} onChange={(e) => setF({ ...f, max: Number(e.target.value) })} className={inputCls} />
            </Field>
          )}
          <Field label="Uses allowed (each code)" hint="0 for unlimited.">
            <input type="number" min={0} value={f.limit || ""} onChange={(e) => setF({ ...f, limit: Number(e.target.value) })} className={inputCls} />
          </Field>
          <Field label="Starts" hint="Optional.">
            <input type="date" value={f.starts} onChange={(e) => setF({ ...f, starts: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Ends" hint="Optional. Ends at midnight.">
            <input type="date" value={f.ends} onChange={(e) => setF({ ...f, ends: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Note shown to customer" hint="Optional, e.g. “Diwali offer”." className="sm:col-span-2 lg:col-span-3">
            <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full"><Plus size={16} /> {busy ? "Creating…" : f.quantity > 1 ? `Create ${Math.min(f.quantity, 200)} codes` : "Create coupon"}</Button>
          </div>
        </form>
        {msg && <div className="mt-4"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      </Card>

      {!rows ? <Skeleton rows={4} /> : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Valid</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => {
                const st = statusOf(c);
                const d = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : null);
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <button onClick={() => copy(c.code)} className="inline-flex items-center gap-1.5 font-mono font-semibold hover:text-accent" aria-label={`Copy ${c.code}`}>
                        {c.code} <Copy size={13} className="text-muted" />
                      </button>
                      {copied === c.code && <span className="ml-2 text-xs text-success">Copied</span>}
                    </td>
                    <td className="px-4 py-3">{describe(c)}</td>
                    <td className="px-4 py-3 text-muted">{d(c.starts_at) || d(c.ends_at) ? `${d(c.starts_at) ?? "Now"} – ${d(c.ends_at) ?? "no end"}` : "Always"}</td>
                    <td className="px-4 py-3 tabular-nums">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                    <td className="px-4 py-3"><Badge tone={st.tone}>{st.label}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => toggle(c)}>{c.active ? "Switch off" : "Switch on"}</Button>
                      <button onClick={() => remove(c)} aria-label={`Delete ${c.code}`} className="ml-1 rounded p-2 text-danger hover:bg-danger/10"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No coupons yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
