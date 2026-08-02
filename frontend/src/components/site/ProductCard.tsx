import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Eye, Star } from "lucide-react";
import type { Product } from "@/lib/data";
import { useStore } from "@/lib/store";

export function ProductCard({ item }: { item: Product }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const saved = wishlist.includes(item.id);
  const detail = item.kind === "service" ? "/services/$id" : "/marketplace/$id";

  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-xl bg-muted">
        <Link to={detail} params={{ id: item.id }} aria-label={item.title}>
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <button
          onClick={() => toggleWishlist(item.id)}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/85 backdrop-blur transition-colors hover:bg-background"
        >
          <Heart
            className={saved ? "h-4 w-4 fill-destructive text-destructive" : "h-4 w-4"}
            strokeWidth={1.8}
          />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <Link
            to={detail}
            params={{ id: item.id }}
            className="line-clamp-2 text-[15px] font-semibold leading-snug hover:underline"
          >
            {item.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{item.location}</p>
          <p className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-foreground">
              <Star className="h-3.5 w-3.5 fill-star text-star" />
              {item.rating}
            </span>
            <span className="text-muted-foreground/50">•</span>
            {item.sold.toLocaleString()} Sold
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <span className="text-[15px] font-semibold text-price">${item.price}</span>
          {item.kind === "service" ? (
            <Link
              to={detail}
              params={{ id: item.id }}
              aria-label={`View ${item.title}`}
              className="grid h-9 w-9 place-items-center rounded-full bg-ink text-ink-foreground transition-opacity hover:opacity-85"
            >
              <Eye className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={() => addToCart({ id: item.id, title: item.title, image: item.image, price: item.price })}
              aria-label={`Add ${item.title} to cart`}
              className="grid h-9 w-9 place-items-center rounded-full bg-ink text-ink-foreground transition-opacity hover:opacity-85"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] w-full rounded-xl bg-muted" />
      <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
    </div>
  );
}
