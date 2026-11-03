import Link from "next/link";
import { img } from "@/lib/catalog";
import { getCategories } from "@/lib/db";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Unknown URLs render outside the (shop) group, so this page brings its own header and footer.
export default async function NotFound() {
  const categories = await getCategories();
  return (
    <>
    <Header categories={categories} />
    <main id="main">
    <div className="wrap py-20 text-center">
      <p className="font-display text-7xl text-brass">404</p>
      <h1 className="mt-3 font-display text-3xl">This room is still empty</h1>
      <p className="mt-2 text-sm text-muted">The page you were looking for has moved or never existed.</p>
      <Link href="/" className="mt-7 inline-block rounded-full bg-accent px-7 py-3 font-semibold text-on-accent">Back to home</Link>
      <ul className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-5 md:grid-cols-7">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/c/${c.slug}`} className="flex flex-col items-center gap-2 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(c.image, 160)} alt="" className="aspect-square w-full rounded-full object-cover" />
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
    </main>
    <Footer categories={categories} />
    </>
  );
}
