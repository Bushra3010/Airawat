import type { Metadata } from "next";
import { Manrope, Red_Hat_Display, Roboto } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";

// Body: Roboto. Headings and prices: Red Hat Display. Footer: Manrope (free stand-in for a commercial font).
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto" });
const redHat = Red_Hat_Display({ subsets: ["latin"], variable: "--font-red-hat" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: { default: "Airawat Handicraft — Wood-Carved Furniture, Baner, Pune", template: "%s | Airawat Handicraft" },
  description: "Hand-carved sheesham, teak and rosewood furniture and handicrafts from Airawat Handicraft, Baner, Pune. Since 1999.",
};

// Shared shell. The shop's header and footer live in (shop)/layout.tsx; the admin panel has its own in admin/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${roboto.variable} ${redHat.variable} ${manrope.variable}`}>
      <body>
        <AuthProvider>
          <StoreProvider>{children}</StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
