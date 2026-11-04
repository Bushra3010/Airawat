import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="5 November 2026">
      <p>These terms apply when you use this website or place an order with {BUSINESS.name}, {BUSINESS.address.oneLine}.</p>

      <h2>Orders and prices</h2>
      <ul>
        <li>Prices are in Indian rupees and include taxes unless shown otherwise. The price that applies is the one confirmed when you place your order.</li>
        <li>An order is a request to buy. We confirm it by phone or message before dispatch, and may cancel it, with a full refund of anything paid, if an item is unavailable or a price was shown in error.</li>
        <li>Wood is a natural material: grain, colour and finish vary slightly from photos and between pieces.</li>
      </ul>

      <h2>Coupons and offers</h2>
      <ul>
        <li>Each coupon has its own conditions (minimum order, maximum discount, dates and number of uses), shown when you apply it. One coupon per order.</li>
        <li>The sign-up offer is for new customers, once per mobile number. Coupons have no cash value and can&apos;t be exchanged.</li>
        <li>We may end or change an offer at any time; orders already placed keep their discount.</li>
      </ul>

      <h2>Delivery and returns</h2>
      <p>We share delivery estimates in good faith; actual dates are confirmed before dispatch. For returns, refunds or damage on arrival, contact us within 48 hours of delivery at {BUSINESS.phone} or <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.</p>

      <h2>Your details</h2>
      <p>How we use your information is explained in our <Link href="/privacy">Privacy Policy</Link>.</p>

      <h2>Contact</h2>
      <p>{BUSINESS.name}, {BUSINESS.address.oneLine}. {BUSINESS.phone} · <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p>
    </LegalPage>
  );
}
