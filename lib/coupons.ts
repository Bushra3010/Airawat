"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type CouponCheck = { code: string | null; valid: boolean; off: number; message: string; checking: boolean };

/** Checks a coupon against the cart amount (rupees, after the buy-2 bonus); re-checks when either changes. */
export function useCoupon(code: string | null, amount: number): CouponCheck {
  const [state, setState] = useState<CouponCheck>({ code, valid: false, off: 0, message: "", checking: false });

  useEffect(() => {
    if (!code) return setState({ code: null, valid: false, off: 0, message: "", checking: false });
    let live = true;
    setState((s) => ({ ...s, code, checking: true }));
    supabase
      .rpc("check_coupon", { p_code: code, p_amount_paise: Math.round(amount * 100) })
      .then(({ data, error }) => {
        if (!live) return;
        const r = (data ?? {}) as { valid?: boolean; discount_paise?: number; message?: string };
        setState({
          code,
          checking: false,
          valid: !error && !!r.valid,
          off: r.valid ? Math.round((r.discount_paise ?? 0) / 100) : 0,
          message: error ? "Couldn't check the code. Try again." : r.message ?? "",
        });
      });
    return () => { live = false; };
  }, [code, amount]);

  return state;
}
