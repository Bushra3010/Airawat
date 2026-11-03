import { serviceability, shiprocketConfigured, ShiprocketError } from "@/lib/shiprocket";

// Pincode check on the product page. Uses Shiprocket when connected; otherwise the page falls back to its own estimate.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pincode = url.searchParams.get("pincode") ?? "";
  const weight = Math.min(Math.max(Number(url.searchParams.get("weight")) || Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG) || 20, 0.5), 200);
  if (!/^[1-9]\d{5}$/.test(pincode)) return Response.json({ error: "Enter a valid 6-digit pincode." }, { status: 400 });
  if (!shiprocketConfigured()) return Response.json({ configured: false });

  try {
    const couriers = await serviceability(pincode, weight, false);
    if (!couriers.length) return Response.json({ configured: true, serviceable: false });
    const days = couriers
      .map((c) => Number(c.estimated_delivery_days))
      .filter((n) => Number.isFinite(n) && n > 0);
    const fastest = days.length ? Math.min(...days) : null;
    const cod = couriers.some((c) => Number(c.cod) === 1);
    return Response.json(
      { configured: true, serviceable: true, days: fastest, cod },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    console.error("Delivery check failed:", err instanceof Error ? err.message : err);
    const status = err instanceof ShiprocketError && err.status === 503 ? 200 : 502;
    return Response.json(status === 200 ? { configured: false } : { error: "Couldn't check right now." }, { status });
  }
}
