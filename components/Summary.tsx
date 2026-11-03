import { formatINR } from "@/lib/catalog";
import type { summarise } from "@/lib/pricing";

export default function Summary({ s, children }: { s: ReturnType<typeof summarise>; children?: React.ReactNode }) {
  const row = (k: string, v: string, cls = "") => (
    <div className={`flex justify-between py-1.5 text-sm ${cls}`}><dt>{k}</dt><dd className="tabular-nums">{v}</dd></div>
  );
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-3 font-semibold">Order summary</h2>
      <dl>
        {row(`Price (${s.units} item${s.units === 1 ? "" : "s"}, MRP)`, formatINR(s.mrp), "text-muted")}
        {row("Sale discount", `− ${formatINR(s.mrp - s.subtotal)}`, "text-success")}
        {s.bundle > 0 && row("Buy-2 bonus (10%)", `− ${formatINR(s.bundle)}`, "text-success")}
        {s.couponOff > 0 && row("Coupon", `− ${formatINR(s.couponOff)}`, "text-success")}
        {row("Delivery & assembly", "Free", "text-muted")}
        <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatINR(s.total)}</dd></div>
      </dl>
      <p className="mt-3 rounded-md bg-success/10 px-3 py-2 text-xs font-medium text-success">You save {formatINR(s.saved)} on this order</p>
      {children}
    </div>
  );
}
