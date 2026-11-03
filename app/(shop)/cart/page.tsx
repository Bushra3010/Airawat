import CartView from "@/components/CartView";
import { getCategories } from "@/lib/db";

export default async function CartPage() {
  return <CartView categories={await getCategories()} />;
}
