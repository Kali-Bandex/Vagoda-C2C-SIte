import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Star,
  Play,
  MessageSquare,
  Map,
  ThumbsUp,
  Phone,
  BadgeCheck,
  ArrowRight,
  ShieldCheck,
  ShoppingCart,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { SERVICES, type Product } from "@/lib/data";
import { ProductCard } from "./ProductCard";
import { useStore, openCart } from "@/lib/store";
import { useProductStore } from "@/lib/productStore";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const TABS = ["Product description", "Merchant", "Reviews", "Related product"];

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewData = {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  rating: number;
  body: string;
  createdAt: string;
};

type ReviewsResponse = {
  reviews: ReviewData[];
  count: number;
  avgRating: number;
  breakdown: Record<string, number>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function DetailPage({
  item,
  crumbs,
}: {
  item: Product;
  crumbs: { label: string; to: string }[];
}) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const { session } = useAuth();
  const [active, setActive] = useState(item.image);
  const [size, setSize] = useState(item.sizes?.[0] ?? "");
  const [colour, setColour] = useState(item.colours?.[0] ?? "");
  const [tab, setTab] = useState(TABS[0]);
  const [showContact, setShowContact] = useState(false);
  const liveProducts = useProductStore((state) => state.products);
  const related = (liveProducts.length ? liveProducts : SERVICES)
    .filter((i) => i.id !== item.id)
    .slice(0, 8);
  const saved = wishlist.includes(item.id);

  const sizes = item.sizes && item.sizes.length > 0 ? item.sizes : [];
  const colours = item.colours && item.colours.length > 0 ? item.colours : [];
  const specs = item.specs && item.specs.length > 0 ? item.specs : [];

  // Set default selected size/colour when item changes
  useEffect(() => {
    setActive(item.image);
    setSize(item.sizes?.[0] ?? "");
    setColour(item.colours?.[0] ?? "");
  }, [item.id]);

  const handleAddToCart = () => {
    addToCart({
      id: item.id,
      title: item.title,
      image: item.image,
      price: item.price,
      selectedSize: size || undefined,
      selectedColour: colour || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs">
        {crumbs.map((c) => (
          <span key={c.to} className="flex items-center gap-2">
            <Link to={c.to} className="text-price hover:underline">
              {c.label}
            </Link>
            <span className="text-muted-foreground">›</span>
          </span>
        ))}
        <span className="text-muted-foreground">{item.title}</span>
      </nav>

      {/* Product + Actions */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Gallery */}
        <div className="grid gap-4 sm:grid-cols-[92px_minmax(0,1fr)]">
          <div className="flex gap-3 sm:flex-col">
            {item.gallery.map((g) => (
              <button
                key={g}
                onClick={() => setActive(g)}
                aria-label="Show image"
                className={`overflow-hidden rounded-lg border-2 ${active === g ? "border-foreground" : "border-transparent"}`}
              >
                <img src={g} alt="" className="h-20 w-24 object-cover sm:w-full" loading="lazy" />
              </button>
            ))}
          </div>
          <img
            src={active}
            alt={item.title}
            className="aspect-[4/3] w-full rounded-xl object-cover"
          />
        </div>

        {/* Info Panel */}
        <div>
          <p className="text-xs text-muted-foreground">{item.category}</p>
          <h1 className="mt-1 text-2xl font-semibold leading-snug">{item.title}</h1>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            {Array.from({ length: Math.round(item.rating) }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-star text-star" />
            ))}
            <span className="ml-1">
              {item.rating.toFixed(1)} ({item.sold} Reviews)
            </span>
          </p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-semibold">${item.price}</span>
            {item.oldPrice && (
              <span className="text-sm text-muted-foreground line-through">${item.oldPrice}</span>
            )}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {item.description}{" "}
            <button className="font-medium text-foreground underline">Read More</button>
          </p>

          {/* Sizes */}
          {sizes.length > 0 && (
            <>
              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <p className="text-xs font-medium">Select Size</p>
                <button className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  Size Guide <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={
                      size === s
                        ? "h-8 w-9 rounded-md bg-ink text-xs text-ink-foreground"
                        : "h-8 w-9 rounded-md border border-border text-xs text-muted-foreground hover:border-foreground/40"
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Colours */}
          {colours.length > 0 && (
            <>
              <p className="mt-5 text-xs font-medium">Colours Available</p>
              <div className="mt-2 flex gap-2">
                {colours.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColour(c)}
                    aria-label={`Colour ${c}`}
                    className={`h-6 w-6 rounded-full ring-offset-2 ${colour === c ? "ring-2 ring-foreground" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
            >
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </button>
            <button
              onClick={() => {
                handleAddToCart();
                openCart();
              }}
              className="flex items-center justify-center gap-2 rounded-md border border-ink bg-transparent px-4 py-3 text-sm font-medium transition-colors hover:bg-ink hover:text-ink-foreground"
            >
              <ShoppingBag className="h-4 w-4" /> Buy Now
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {showContact ? (
              <a
                href={`tel:${item.seller?.phone || "0544324094"}`}
                className="flex items-center justify-center gap-2 rounded-md border border-price bg-brand-soft px-4 py-3 text-sm font-semibold text-price transition-colors hover:bg-brand/20"
              >
                <Phone className="h-4 w-4" /> {item.seller?.phone || "0544324094"}
              </a>
            ) : (
              <button
                onClick={() => setShowContact(true)}
                className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Phone className="h-4 w-4" /> Show Contact
              </button>
            )}
            <button
              onClick={() => toggleWishlist(item.id)}
              className="rounded-md border border-border py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              {saved ? "Saved to wishlist" : "Save for later"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="mt-14 border-b border-border">
        <div className="flex flex-wrap gap-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "-mb-px border-b-2 border-foreground pb-3 text-sm font-medium"
                  : "-mb-px pb-3 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      {tab === TABS[0] && (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            <h2 className="text-sm font-semibold">{item.title}</h2>
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-muted-foreground">
              {item.description}
            </p>
            {specs.length > 0 && (
              <dl className="mt-6 grid max-w-md grid-cols-3 rounded-md border border-border text-xs">
                {specs.map(({ key, value }) => (
                  <div key={key} className="border border-border/60 p-3">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="mt-1 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <div className="relative overflow-hidden rounded-xl bg-black flex items-center justify-center">
            {item.video ? (
              <video
                src={item.video}
                controls
                className="aspect-video w-full rounded-xl object-cover max-h-[380px]"
                poster={item.image}
              />
            ) : (
              <div className="relative h-full w-full">
                <img
                  src={item.gallery[1] ?? item.image}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover min-h-[260px]"
                />
                <span className="absolute bottom-3 left-4 text-sm font-medium text-white drop-shadow bg-black/40 px-2 py-1 rounded">
                  {item.title}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === TABS[1] && <MerchantBlock item={item} />}
      {tab === TABS[2] && <ReviewsBlock productId={item.id} />}
      {tab === TABS[3] && (
        <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((r) => (
            <ProductCard key={r.id} item={r} />
          ))}
        </div>
      )}

      {/* Always-visible merchant + reviews below tabs */}
      <MerchantBlock item={item} heading />
      <ReviewsBlock productId={item.id} />

      <section className="mt-16">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h2 className="truncate text-xl font-semibold">Related Products</h2>
          <Link
            to="/marketplace"
            className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            View More <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((r) => (
            <ProductCard key={r.id} item={r} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Merchant Block ───────────────────────────────────────────────────────────

function MerchantBlock({ item, heading = false }: { item: Product; heading?: boolean }) {
  const seller = item.seller;
  return (
    <section className={heading ? "mt-16 border-t border-border pt-10" : "mt-8"} id="merchant-section">
      <h2 className="text-xl font-semibold">Merchant Information</h2>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <img
            src={seller?.avatar ?? `https://i.pravatar.cc/120?u=${item.sellerId ?? "default"}`}
            alt={seller?.name ?? "Merchant"}
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{seller?.name ?? "Merchant"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {seller?.location ?? item.location}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-price" /> Verified Merchant
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-price" /> Verified ID
              </span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            to="/app/message"
            search={{
              userId: seller?.id ?? item.sellerId,
              userName: seller?.name ?? "Merchant",
              userAvatar: seller?.avatar ?? "https://i.pravatar.cc/120?img=12",
            }}
            className="flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
          >
            <MessageSquare className="h-4 w-4" /> Message
          </Link>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seller?.location || item.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Map className="h-4 w-4" /> Direction
          </a>
          <button
            onClick={() => {
              const el = document.getElementById("reviews-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ThumbsUp className="h-4 w-4" /> Reviews
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Reviews Block (live from DB) ────────────────────────────────────────────

function ReviewsBlock({ productId }: { productId: string }) {
  const { session } = useAuth();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myBody, setMyBody] = useState("");
  const [hovered, setHovered] = useState(0);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/products/${productId}/reviews`);
      setData(res.data);
    } catch {
      // silently fail — show empty
      setData({ reviews: [], count: 0, avgRating: 0, breakdown: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchReviews();
  }, [productId]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please sign in to leave a review");
      return;
    }
    if (!myBody.trim()) {
      toast.error("Please write a review");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, {
        rating: myRating,
        body: myBody.trim(),
      });
      setMyBody("");
      setMyRating(5);
      toast.success("Review submitted!");
      await fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const avg = data?.avgRating ?? 0;
  const count = data?.count ?? 0;
  const breakdown = data?.breakdown ?? {};

  // Build sorted breakdown bars (5→1)
  const bars = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: breakdown[star] ?? 0,
    pct: count > 0 ? Math.round(((breakdown[star] ?? 0) / count) * 100) : 0,
  }));

  return (
    <section className="mt-12" id="reviews-section">
      {/* Rating Summary */}
      <div className="rounded-xl border border-border p-6">
        <div className="grid items-center gap-8 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-star text-xl font-semibold">
              {avg.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">from {count} Reviews</p>
          </div>
          <div className="space-y-2">
            {bars.map(({ star, pct, count: cnt }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="flex w-8 items-center gap-1 text-xs">
                  {star} <Star className="h-3 w-3 fill-star text-star" />
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-brand"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-6 text-right text-xs text-muted-foreground">{cnt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <h3 className="truncate text-base font-semibold">Customer Reviews</h3>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="mt-5 space-y-6">
          {data?.reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No reviews yet. Be the first to review this product!
            </p>
          )}
          {data?.reviews.map((r) => (
            <li key={r.id} className="flex gap-3">
              <img
                src={r.avatar}
                alt=""
                loading="lazy"
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  {r.name}
                  <span className="text-muted-foreground">
                    •{" "}
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <p className="mt-0.5 text-star">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Write a Review Form */}
      <div className="mt-10 rounded-xl border border-border p-6">
        <h3 className="text-base font-semibold">Write a Review</h3>
        {!session ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Please{" "}
            <a href="/auth/login" className="underline text-price">
              sign in
            </a>{" "}
            to leave a review.
          </p>
        ) : (
          <form onSubmit={submitReview} className="mt-4 space-y-4">
            {/* Star Rating */}
            <div>
              <p className="text-xs font-medium">Your Rating</p>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setMyRating(star)}
                    className="text-2xl leading-none transition-colors"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        (hovered || myRating) >= star
                          ? "fill-star text-star"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Body */}
            <div>
              <p className="text-xs font-medium">Your Review</p>
              <textarea
                value={myBody}
                onChange={(e) => setMyBody(e.target.value)}
                placeholder="Share your experience with this product…"
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground/30"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Review
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
