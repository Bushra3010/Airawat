// Shiprocket API (server only). Off until SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD are set.
// These are an API user's details (Shiprocket → Settings → API → Configure), not the panel login.
import "server-only";

const BASE = "https://apiv2.shiprocket.in/v1/external";

export const shiprocketConfigured = () => !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
export const pickupPincode = () => process.env.SHIPROCKET_PICKUP_PINCODE || "411045";
export const pickupLocation = () => process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";

export class ShiprocketError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

// Tokens last 10 days; refresh after 9 to stay clear of the edge.
let token: { value: string; expires: number } | null = null;

async function getToken() {
  if (token && token.expires > Date.now()) return token.value;
  if (!shiprocketConfigured()) throw new ShiprocketError("Shiprocket isn't connected yet.", 503);
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!res.ok || !data.token) throw new ShiprocketError(`Shiprocket sign-in failed: ${data.message ?? res.status}. Check the API user's email and password.`, 502);
  token = { value: data.token, expires: Date.now() + 9 * 864e5 };
  return token.value;
}

async function call<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}`, ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (res.status === 401 && !retried) {
    token = null;
    return call<T>(path, init, true);
  }
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; errors?: Record<string, string[]> };
  if (!res.ok) {
    const detail = data.errors ? Object.values(data.errors).flat().join(" ") : data.message;
    throw new ShiprocketError(`Shiprocket: ${detail || `error ${res.status}`}`, res.status >= 500 ? 502 : 400);
  }
  return data;
}

type Courier = { courier_company_id: number; courier_name: string; etd?: string; estimated_delivery_days?: string | number; rate?: number; cod?: number };

/** Couriers that deliver from the showroom to a pincode. Weight in kg. */
export async function serviceability(deliveryPincode: string, weightKg: number, cod: boolean) {
  const q = new URLSearchParams({
    pickup_postcode: pickupPincode(),
    delivery_postcode: deliveryPincode,
    weight: String(weightKg),
    cod: cod ? "1" : "0",
  });
  const data = await call<{ status?: number; data?: { available_courier_companies?: Courier[] } }>(`/courier/serviceability/?${q}`);
  return data.data?.available_courier_companies ?? [];
}

export type ShipmentInput = {
  orderCode: string;
  orderDate: Date;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  cod: boolean;
  items: { name: string; sku: string; units: number; sellingPrice: number }[]; // rupees
  subTotal: number; // rupees, after discounts
  discount: number; // rupees
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  weightKg: number;
};

const pad = (n: number) => String(n).padStart(2, "0");
const istDate = (d: Date) => {
  const t = new Date(d.getTime() + 330 * 60_000); // Asia/Kolkata
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
};

/** Creates the order in Shiprocket, then asks it to assign a courier (AWB) by the account's courier priority. */
export async function createShipment(s: ShipmentInput) {
  const [first, ...rest] = s.name.trim().split(/\s+/);
  const created = await call<{ order_id?: number; shipment_id?: number; status?: string }>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id: s.orderCode,
      order_date: istDate(s.orderDate),
      pickup_location: pickupLocation(),
      billing_customer_name: first,
      billing_last_name: rest.join(" "),
      billing_address: s.address,
      billing_city: s.city,
      billing_pincode: s.pincode,
      billing_state: s.state,
      billing_country: "India",
      billing_email: s.email,
      billing_phone: s.phone,
      shipping_is_billing: true,
      order_items: s.items.map((i) => ({ name: i.name, sku: i.sku, units: i.units, selling_price: String(i.sellingPrice) })),
      payment_method: s.cod ? "COD" : "Prepaid",
      total_discount: s.discount,
      sub_total: s.subTotal,
      length: s.lengthCm,
      breadth: s.breadthCm,
      height: s.heightCm,
      weight: s.weightKg,
    }),
  });
  if (!created.order_id || !created.shipment_id) throw new ShiprocketError("Shiprocket didn't return an order. Check the pickup location name in Shiprocket settings.");

  let awb = "";
  let courier = "";
  let awbError = "";
  try {
    const assigned = await call<{ awb_assign_status?: number; response?: { data?: { awb_code?: string; courier_name?: string } }; message?: string }>(
      "/courier/assign/awb",
      { method: "POST", body: JSON.stringify({ shipment_id: created.shipment_id }) },
    );
    awb = assigned.response?.data?.awb_code ?? "";
    courier = assigned.response?.data?.courier_name ?? "";
    if (!awb) awbError = assigned.message ?? "No courier was assigned.";
  } catch (err) {
    awbError = err instanceof Error ? err.message : "Courier assignment failed.";
  }
  return { shiprocketOrderId: created.order_id, shipmentId: created.shipment_id, awb, courier, awbError };
}

export const trackingUrl = (awb: string) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
