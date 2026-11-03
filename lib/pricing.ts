import { lineTotal, type CartLine } from "@/lib/store";

/** Cart totals in rupees. couponOff comes from the database (check_coupon); the server re-checks at order time. */
export function summarise(lines: CartLine[], couponOff = 0) {
  const mrp = lines.reduce((n, l) => n + l.mrp * l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + lineTotal(l), 0);
  const units = lines.reduce((n, l) => n + l.qty, 0);
  const bundle = units >= 2 ? Math.round(subtotal * 0.1) : 0;
  const off = Math.min(couponOff, subtotal - bundle);
  const total = subtotal - bundle - off;
  return { mrp, subtotal, bundle, couponOff: off, total, saved: mrp - total, units };
}

/** Amount a coupon applies to: subtotal after the buy-2 bonus. */
export function couponBase(lines: CartLine[]) {
  const s = summarise(lines);
  return s.subtotal - s.bundle;
}
