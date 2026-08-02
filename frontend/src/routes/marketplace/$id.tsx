import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DetailPage } from "@/components/site/DetailPage";
import { SERVICES, type Product } from "@/lib/data";
import { useProductStore } from "@/lib/productStore";

export const Route = createFileRoute("/marketplace/$id")({
  component: ProductDetail,
  head: () => ({
    meta: [
      { title: "Product Detail — Vagoda Marketplace" },
      {
        name: "description",
        content: "Browse quality products from trusted sellers on Vagoda.",
      },
    ],
  }),
});

function ProductDetail() {
  const { id } = Route.useParams();
  const fetchProductById = useProductStore((state) => state.fetchProductById);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First check services fallback
    const serviceMatch = SERVICES.find((s) => s.id === id);
    if (serviceMatch) {
      setProduct(serviceMatch);
      setLoading(false);
      return;
    }

    // Fetch live product document from Mongo DB
    fetchProductById(id).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [id, fetchProductById]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-20 text-center text-muted-foreground">
        Loading product details…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-20 text-center">
        <h2 className="text-xl font-semibold">Product Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The product you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <DetailPage
      item={product}
      crumbs={[
        { label: "Marketplace", to: "/marketplace" },
        { label: product.category, to: "/marketplace" },
      ]}
    />
  );
}
