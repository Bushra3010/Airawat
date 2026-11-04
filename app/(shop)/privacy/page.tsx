import type { Metadata } from "next";
import { BUSINESS } from "@/lib/business";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="5 November 2026">
      <p>
        This explains what {BUSINESS.name} (“we”), {BUSINESS.address.oneLine}, collects through this website and how we use it.
        Questions: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or {BUSINESS.phone}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Orders:</strong> your name, mobile number, email and delivery address, and what you ordered.</li>
        <li><strong>Accounts:</strong> your email, name and password (stored securely by our login provider; we never see your password).</li>
        <li><strong>Sign-up offer:</strong> your mobile number when you claim a discount code from the pop-up.</li>
        <li><strong>On your device:</strong> your cart, wishlist and whether you have seen the offer are kept in your browser.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To process, deliver and support your orders, including sharing your name, phone and address with our delivery partner (such as Shiprocket and its couriers).</li>
        <li>To contact you about your order, and, if you claimed the sign-up offer, to send you occasional offers from {BUSINESS.name} by phone, SMS or WhatsApp.</li>
        <li>We do not sell your information.</li>
      </ul>

      <h2>Where it is stored</h2>
      <p>Orders, accounts and sign-ups are stored with our hosting and database providers (Netlify and Supabase), who process it on our behalf.</p>

      <h2>Your choices</h2>
      <ul>
        <li>To stop offers, or to see, correct or delete your details, email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call {BUSINESS.phone}. We will act on it promptly.</li>
        <li>You can clear your cart, wishlist and offer settings by clearing this site&apos;s data in your browser.</li>
      </ul>

      <h2>Changes</h2>
      <p>If we change this policy, we will update this page and the date above.</p>
    </LegalPage>
  );
}
