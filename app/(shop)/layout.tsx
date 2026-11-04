import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toast } from "@/components/ui";
import WhatsAppSticky from "@/components/WhatsAppSticky";
import SignupOffer from "@/components/SignupOffer";
import { getCategories } from "@/lib/db";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:p-3">Skip to content</a>
      <Header categories={categories} />
      <main id="main">{children}</main>
      <Footer categories={categories} />
      <Toast />
      <WhatsAppSticky />
      <SignupOffer />
    </>
  );
}
