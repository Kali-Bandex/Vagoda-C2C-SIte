import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Star, MapPin, Phone, ShieldCheck, CheckCircle2, Bookmark, Globe, Eye, Calendar, Wrench, MessageSquare
} from "lucide-react";
import { useServiceStore, type LiveService } from "@/lib/serviceStore";
import { BookingModal } from "@/components/site/BookingModal";
import { ProductCard } from "@/components/site/ProductCard";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/services/$id")({
  component: ServiceDetail,
  head: () => ({
    meta: [
      { title: "Service Detail — Vagoda Services" },
      { name: "description", content: "Book trusted service providers on Vagoda." },
    ],
  }),
});

function ServiceDetail() {
  const { id } = Route.useParams();
  const { fetchServiceById, fetchServices, services } = useServiceStore();
  const [service, setService] = useState<LiveService | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const { wishlist, toggleWishlist } = useStore();
  const isSaved = wishlist.includes(id);

  useEffect(() => {
    setLoading(true);
    fetchServiceById(id).then((s) => {
      setService(s);
      if (s?.image) setActiveImage(s.image);
      setLoading(false);
    });
    fetchServices({ limit: 4 });
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4 px-5 py-16">
        <div className="h-96 w-full animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-20 text-center">
        <h2 className="text-xl font-semibold">Service Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This service listing has been removed or is no longer available.
        </p>
        <Link to="/services" className="mt-6 inline-block rounded-xl bg-ink px-6 py-3 text-sm font-medium text-ink-foreground">
          Browse all services
        </Link>
      </div>
    );
  }

  const related = services.filter((s) => s.id !== id).slice(0, 3);
  const gallery = service.gallery && service.gallery.length > 0 ? service.gallery : [service.image];

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 lg:px-8 space-y-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">Home</Link>
        <span>›</span>
        <Link to="/services" className="hover:underline">Services</Link>
        <span>›</span>
        <span className="text-foreground font-medium">{service.category}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        {/* Left Column: Gallery & Description */}
        <div className="space-y-8">
          {/* Main Image View */}
          <div className="overflow-hidden rounded-2xl border border-border bg-muted">
            <img
              src={activeImage || service.image}
              alt={service.title}
              className="aspect-[16/10] w-full object-cover"
            />
          </div>

          {/* Thumbnail Gallery */}
          {gallery.length > 1 && (
            <div className="flex flex-wrap gap-3">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`h-20 w-24 overflow-hidden rounded-xl border-2 transition-all ${
                    activeImage === img ? "border-brand ring-2 ring-brand/30" : "border-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Title & Info */}
          <div>
            <h1 className="text-3xl font-semibold">{service.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {service.rating} ({service.reviewsCount} reviews)
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {service.location}
              </span>
              <span className="flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5" /> {service.bookingsCount} completed bookings
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {service.views} views
              </span>
            </p>
          </div>

          {/* Description */}
          <div className="border-t border-border pt-6 space-y-3">
            <h2 className="text-xl font-semibold">Service Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {service.description}
            </p>
          </div>

          {/* Specs / Features */}
          {service.specs && service.specs.length > 0 && (
            <div className="border-t border-border pt-6 space-y-4">
              <h2 className="text-xl font-semibold">Service Highlights & Features</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {service.specs.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-border p-3.5 text-sm">
                    <span className="text-muted-foreground">{s.key}</span>
                    <span className="font-semibold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Booking Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-price">${service.price}</span>
                {service.oldPrice && (
                  <span className="text-base text-muted-foreground line-through">${service.oldPrice}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Standard Service Fee</p>
            </div>

            {/* Booking Modal */}
            <BookingModal service={service} />

            <button
              onClick={() => {
                toggleWishlist(id);
                toast.success(isSaved ? "Removed from saved" : "Service saved to your wishlist");
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3.5 text-sm font-medium transition-colors ${
                isSaved ? "bg-brand-soft text-price" : "hover:bg-muted"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved to Wishlist" : "Save to Wishlist"}
            </button>

            <div className="border-t border-border pt-5 space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Verified Provider & Guaranteed Service Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>No cancellation fee before appointment confirmation</span>
              </div>
            </div>
          </div>

          {/* Provider Card */}
          {service.provider && (
            <div className="rounded-2xl border border-border p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Service Provider</h3>
              <div className="flex items-center gap-3">
                {service.provider.companyLogo ? (
                  <img src={service.provider.companyLogo} alt={service.provider.companyName} className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <span className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand to-price" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold truncate">{service.provider.companyName || service.provider.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{service.provider.location}</p>
                </div>
              </div>

              {service.provider.phone && (
                <a href={`tel:${service.provider.phone}`} className="flex items-center gap-2 text-sm text-price">
                  <Phone className="h-4 w-4" /> {service.provider.phone}
                </a>
              )}
              {service.provider.website && (
                <a href={service.provider.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-price">
                  <Globe className="h-4 w-4" /> {service.provider.website}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Services */}
      {related.length > 0 && (
        <section className="border-t border-border pt-10">
          <h2 className="text-2xl font-semibold mb-6">Similar Services</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((s) => (
              <ProductCard key={s.id} item={s as any} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
