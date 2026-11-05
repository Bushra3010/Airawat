"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ChevronDown, Mail, MessageCircle, Phone, Truck } from "lucide-react";
import { formatINR, img } from "@/lib/catalog";
import { friendlyError, ORDER_STATUSES, rupees, STATUS_LABEL } from "@/lib/admin";
import { INDIAN_STATES } from "@/lib/india";
import { browserClient } from "@/lib/supabase-browser";
import { trackingUrl } from "@/lib/tracking";
import { Badge, Button, Field, Notice, PageHeader, Skeleton, inputCls } from "@/components/admin/ui";

type Pkg = { pkg_length_cm: number | null; pkg_breadth_cm: number | null; pkg_height_cm: number | null; pkg_weight_kg: number | null };
type Line = { product_name: string; image: string; variant_name: string; size_name: string; qty: number; unit_price_paise: number; warranty: boolean; products: Pkg | null };
type Order = {
  id: string; code: string; status: string; name: string; phone: string; email: string;
  address: { address: string; city: string; state?: string; pincode: string }; payment_method: string; coupon: string | null;
  subtotal_paise: number; bundle_paise: number; coupon_paise: number; total_paise: number; created_at: string; user_id: string | null;
  awb: string | null; courier: string | null; shipment_id: number | null;
  order_lines: Line[];
};

const tone = (s: string) => (s === "pending" ? "warn" : s === "cancelled" ? "bad" : "good") as "warn" | "bad" | "good";

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Packed size of the whole order from each product's shipping box: widest footprint, boxes stacked, weights added. */
function packedBox(lines: Line[]) {
  if (!lines.length || lines.some((l) => !l.products?.pkg_weight_kg || !l.products.pkg_length_cm || !l.products.pkg_breadth_cm || !l.products.pkg_height_cm)) return null;
  const n = (v: number | null) => Number(v);
  return {
    length: round1(Math.max(...lines.map((l) => n(l.products!.pkg_length_cm)))),
    breadth: round1(Math.max(...lines.map((l) => n(l.products!.pkg_breadth_cm)))),
    height: round1(lines.reduce((t, l) => t + n(l.products!.pkg_height_cm) * l.qty, 0)),
    weight: round1(lines.reduce((t, l) => t + n(l.products!.pkg_weight_kg) * l.qty, 0)),
  };
}

/** Send the order to Shiprocket: creates the shipment and gets a courier + AWB. */
function ShipPanel({ o, onShipped }: { o: Order; onShipped: (patch: Partial<Order>) => void }) {
  const auto = packedBox(o.order_lines);
  const [box, setBox] = useState({ length: 0, breadth: 0, height: 0, weight: 0, ...auto, state: o.address.state ?? "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  if (o.awb) {
    return (
      <div className="rounded-md border border-border bg-surface p-3 text-sm">
        <p className="flex items-center gap-2 font-semibold"><Truck size={16} className="text-brass" /> Shipped with {o.courier ?? "courier"}</p>
        <p className="mt-1 text-muted">AWB <span className="font-mono text-ink">{o.awb}</span></p>
        <a href={trackingUrl(o.awb)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-accent underline">Track parcel</a>
      </div>
    );
  }
  if (o.status === "cancelled") return null;

  const ship = async () => {
    setMsg(null);
    if ([box.length, box.breadth, box.height, box.weight].some((n) => !(n > 0))) return setMsg({ kind: "error", text: "Enter the packed size (cm) and weight (kg)." });
    if (!box.state) return setMsg({ kind: "error", text: "Choose the customer's state." });
    setBusy(true);
    const { data } = await browserClient().auth.getSession();
    const res = await fetch("/api/admin/ship", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
      body: JSON.stringify({ orderId: o.id, ...box }),
    });
    const r = (await res.json().catch(() => ({}))) as { error?: string; awb?: string; courier?: string; shipmentId?: number; awbError?: string };
    setBusy(false);
    if (!res.ok) return setMsg({ kind: "error", text: r.error ?? "Shiprocket request failed." });
    if (r.awb) {
      onShipped({ awb: r.awb, courier: r.courier ?? null, shipment_id: r.shipmentId ?? null, status: "shipped" });
    } else {
      onShipped({ shipment_id: r.shipmentId ?? null });
      setMsg({ kind: "error", text: `The order is in Shiprocket, but no courier was assigned: ${r.awbError ?? "unknown reason"}. Assign one in the Shiprocket panel.` });
    }
  };

  const num = (k: "length" | "breadth" | "height" | "weight", label: string) => (
    <Field label={label}><input type="number" min={0} step="0.1" value={box[k] || ""} onChange={(e) => setBox({ ...box, [k]: Number(e.target.value) })} className={`${inputCls} h-9`} /></Field>
  );

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Truck size={16} className="text-brass" /> Ship with Shiprocket</p>
      {o.shipment_id && <p className="mb-2 text-xs text-muted">Already sent to Shiprocket (shipment {o.shipment_id}); waiting for a courier.</p>}
      <div className="grid grid-cols-4 gap-2">
        {num("length", "L cm")}{num("breadth", "B cm")}{num("height", "H cm")}{num("weight", "Kg")}
      </div>
      <p className="mt-1 text-xs text-muted">
        {auto ? "Filled from each product's shipping box. Change it if you packed differently." : "Some products here have no shipping box size yet. Add it in Products so this fills itself next time."}
      </p>
      {!o.address.state && (
        <Field label="Customer's state" className="mt-2">
          <select value={box.state} onChange={(e) => setBox({ ...box, state: e.target.value })} className={`${inputCls} h-9`}>
            <option value="">Choose…</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      )}
      <p className="mt-2 text-xs text-muted">{o.status === "paid" ? "Marked Paid: ships as prepaid." : "Not marked Paid: the courier collects cash on delivery."}</p>
      <Button onClick={ship} disabled={busy || !!o.shipment_id} className="mt-2 w-full">{busy ? "Creating shipment…" : "Create shipment"}</Button>
      {msg && <div className="mt-2"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
    </div>
  );
}

function Orders() {
  const router = useRouter();
  const sp = useSearchParams();
  const status = sp.get("status") ?? "";
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [open, setOpen] = useState<string | null>(sp.get("open"));
  const [error, setError] = useState("");

  useEffect(() => {
    let q = browserClient()
      .from("orders")
      .select("id, code, status, name, phone, email, address, payment_method, coupon, subtotal_paise, bundle_paise, coupon_paise, total_paise, created_at, user_id, awb, courier, shipment_id, order_lines(product_name, image, variant_name, size_name, qty, unit_price_paise, warranty, products(pkg_length_cm, pkg_breadth_cm, pkg_height_cm, pkg_weight_kg))")
      .order("created_at", { ascending: false })
      .limit(200);
    if (status) q = q.eq("status", status);
    q.then(({ data, error }) => (error ? setError(error.message) : setOrders(data as unknown as Order[])));
  }, [status]);

  const setStatus = async (o: Order, next: string) => {
    if (next === "cancelled" && !confirm(`Mark order ${o.code} as cancelled?`)) return;
    const prev = o.status;
    setOrders((all) => all?.map((x) => (x.id === o.id ? { ...x, status: next } : x)) ?? null);
    const { error } = await browserClient().from("orders").update({ status: next }).eq("id", o.id);
    if (error) {
      setOrders((all) => all?.map((x) => (x.id === o.id ? { ...x, status: prev } : x)) ?? null);
      setError(friendlyError(error.message));
    }
  };

  return (
    <>
      <PageHeader title="Orders" sub="Newest first. Payment is not collected online yet, so “New” orders need a call to confirm." />
      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...ORDER_STATUSES].map((s) => (
          <button key={s || "all"} onClick={() => router.replace(s ? `/admin/orders?status=${s}` : "/admin/orders")} aria-pressed={status === s}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${status === s ? "border-accent bg-accent text-on-accent" : "border-border bg-surface hover:border-ink"}`}>
            {s ? STATUS_LABEL[s] : "All"}
          </button>
        ))}
      </div>
      {error && <div className="mb-4"><Notice kind="error">{error}</Notice></div>}
      {!orders && !error ? <Skeleton rows={6} /> : orders && !orders.length ? (
        <p className="rounded-lg border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">No orders here yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="w-10" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders?.map((o) => (
                <Fragment key={o.id}>
                  <tr className="hover:bg-surface-alt/50">
                    <td className="px-4 py-3 font-mono font-semibold">{o.code}</td>
                    <td className="px-4 py-3">{o.name}<span className="block text-xs text-muted">{o.address.city}</span></td>
                    <td className="px-4 py-3 text-muted">{new Date(o.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
                    <td className="px-4 py-3 uppercase text-muted">{o.payment_method}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatINR(rupees(o.total_paise))}</td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`st-${o.id}`}>Status of {o.code}</label>
                      <select id={`st-${o.id}`} value={o.status} onChange={(e) => setStatus(o, e.target.value)} className={`${inputCls} h-8 w-32 text-xs`}>
                        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-2">
                      <button onClick={() => setOpen(open === o.code ? null : o.code)} aria-expanded={open === o.code} aria-label={`Details for ${o.code}`} className="rounded p-1.5 hover:bg-surface-alt">
                        <ChevronDown size={16} className={`transition ${open === o.code ? "rotate-180" : ""}`} />
                      </button>
                    </td>
                  </tr>
                  {open === o.code && (
                    <tr className="bg-surface-alt/40">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
                          <ul className="space-y-3">
                            {o.order_lines.map((l, i) => (
                              <li key={i} className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img(l.image, 120)} alt="" className="h-12 w-16 rounded object-cover" />
                                <span className="flex-1">{l.product_name}<span className="block text-xs text-muted">{l.variant_name} · {l.size_name} · Qty {l.qty}{l.warranty && " · +2 yr cover"}</span></span>
                                <span className="tabular-nums">{formatINR(rupees(l.unit_price_paise * l.qty))}</span>
                              </li>
                            ))}
                            <li className="border-t border-border pt-2 text-xs text-muted">
                              Subtotal {formatINR(rupees(o.subtotal_paise))}
                              {o.bundle_paise > 0 && ` · Buy-2 bonus −${formatINR(rupees(o.bundle_paise))}`}
                              {o.coupon_paise > 0 && ` · ${o.coupon} −${formatINR(rupees(o.coupon_paise))}`}
                              {" · "}<strong className="text-ink">Total {formatINR(rupees(o.total_paise))}</strong>
                            </li>
                          </ul>
                          <div className="space-y-2 text-sm">
                            <p className="font-semibold">{o.name} <Badge tone={tone(o.status)}>{STATUS_LABEL[o.status]}</Badge></p>
                            <p className="text-muted">{o.address.address}, {o.address.city}{o.address.state ? `, ${o.address.state}` : ""} {o.address.pincode}</p>
                            <p className="flex flex-wrap gap-3 pt-1">
                              <a href={`tel:+91${o.phone}`} className="inline-flex items-center gap-1.5 text-accent underline"><Phone size={14} /> {o.phone}</a>
                              <a href={`https://wa.me/91${o.phone}?text=${encodeURIComponent(`Hi ${o.name.split(" ")[0]}, this is Airawat Handicraft about your order ${o.code}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-accent underline"><MessageCircle size={14} /> WhatsApp</a>
                              <a href={`mailto:${o.email}?subject=${encodeURIComponent(`Your Airawat Handicraft order ${o.code}`)}`} className="inline-flex items-center gap-1.5 text-accent underline"><Mail size={14} /> {o.email}</a>
                            </p>
                            <p className="text-xs text-muted">{o.user_id ? "Placed while signed in" : "Guest checkout"}</p>
                            <div className="pt-2">
                              <ShipPanel o={o} onShipped={(patch) => setOrders((all) => all?.map((x) => (x.id === o.id ? { ...x, ...patch } : x)) ?? null)} />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function OrdersPage() {
  return <Suspense><Orders /></Suspense>;
}
