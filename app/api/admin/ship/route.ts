import { createClient } from "@supabase/supabase-js";
import { createShipment, shiprocketConfigured, ShiprocketError } from "@/lib/shiprocket";

type Body = { orderId?: string; length?: number; breadth?: number; height?: number; weight?: number; state?: string };

// Admin: send an order to Shiprocket and save the courier + AWB on it.
export async function POST(req: Request) {
  const jwt = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return Response.json({ error: "Sign in first." }, { status: 401 });
  // Acts as the signed-in admin, so the database's own rules decide what this request may read and change.
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return Response.json({ error: "Not allowed." }, { status: 403 });
  if (!shiprocketConfigured()) {
    return Response.json({ error: "Shiprocket isn't connected yet. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD (your Shiprocket API user) in Netlify → Site configuration → Environment variables, then redeploy." }, { status: 503 });
  }

  const b = (await req.json().catch(() => ({}))) as Body;
  const dims = [b.length, b.breadth, b.height, b.weight].map(Number);
  if (!b.orderId || dims.some((n) => !Number.isFinite(n) || n <= 0)) {
    return Response.json({ error: "Enter the package length, breadth, height (cm) and weight (kg)." }, { status: 400 });
  }

  const { data: o, error } = await sb
    .from("orders")
    .select("id, code, status, created_at, name, phone, email, address, payment_method, total_paise, bundle_paise, coupon_paise, awb, order_lines(product_name, variant_name, size_name, qty, unit_price_paise, product_id)")
    .eq("id", b.orderId)
    .maybeSingle();
  if (error || !o) return Response.json({ error: "Order not found." }, { status: 404 });
  if (o.awb) return Response.json({ error: `This order already has a shipment (AWB ${o.awb}).` }, { status: 409 });

  const state = (b.state || (o.address as { state?: string }).state || "").trim();
  if (!state) return Response.json({ error: "This order has no state. Choose the customer's state and try again." }, { status: 400 });
  const addr = o.address as { address: string; city: string; pincode: string };

  try {
    const r = await createShipment({
      orderCode: o.code,
      orderDate: new Date(o.created_at),
      name: o.name,
      phone: o.phone,
      email: o.email,
      address: addr.address,
      city: addr.city,
      state,
      pincode: addr.pincode,
      // Online payment isn't collected yet, so the courier collects cash unless an admin marked the order Paid.
      cod: o.status !== "paid",
      items: o.order_lines.map((l: { product_name: string; variant_name: string; size_name: string; qty: number; unit_price_paise: number; product_id: string }) => ({
        name: `${l.product_name} (${l.variant_name}, ${l.size_name})`,
        sku: l.product_id.slice(0, 8),
        units: l.qty,
        sellingPrice: l.unit_price_paise / 100,
      })),
      subTotal: o.total_paise / 100,
      discount: (o.bundle_paise + o.coupon_paise) / 100,
      lengthCm: dims[0],
      breadthCm: dims[1],
      heightCm: dims[2],
      weightKg: dims[3],
    });
    const { error: saveErr } = await sb.rpc("admin_record_shipment", {
      p_order: o.id,
      p: { shiprocket_order_id: r.shiprocketOrderId, shipment_id: r.shipmentId, awb: r.awb, courier: r.courier, state },
    });
    if (saveErr) return Response.json({ error: `Shipment created in Shiprocket (order ${r.shiprocketOrderId}) but not saved here: ${saveErr.message}` }, { status: 500 });
    return Response.json({ ...r, state });
  } catch (err) {
    const e = err instanceof ShiprocketError ? err : new ShiprocketError("Shiprocket request failed.");
    return Response.json({ error: e.message }, { status: e.status });
  }
}
