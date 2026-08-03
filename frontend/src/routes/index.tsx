import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, Camera, Search, MapPin, Sparkles, Store, Briefcase, Wrench, ShieldCheck, CheckCircle2, Star, TrendingUp } from "lucide-react";
import { SERVICES, JOBS, BRANDS, CATEGORIES } from "@/lib/data";
import { ProductCard } from "@/components/site/ProductCard";
import { JobCard } from "@/components/site/JobCard";
import { useProductStore } from "@/lib/productStore";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Vagoda — Buy Products, Hire Services, Find Jobs" },
      {
        name: "description",
        content:
          "Vagoda connects buyers, sellers, job seekers and trusted service providers in one C2C marketplace.",
      },
      { property: "og:title", content: "Vagoda — Buy Products, Hire Services, Find Jobs" },
      {
        property: "og:description",
        content: "One marketplace for products, jobs and trusted local services.",
      },
    ],
  }),
});

const REASONS = [
  {
    icon: Store,
    title: "Wide Range of Products",
    body: "Find everything you need in one convenient place, from everyday essentials to unique products offered by trusted sellers.",
  },
  {
    icon: Briefcase,
    title: "Find Jobs Opportunities",
    body: "Discover job opportunities that match your skills and career goals, and apply easily to positions that interest you.",
  },
  {
    icon: Wrench,
    title: "Access Trusted Services",
    body: "Connect with reliable service providers for various needs, making it easier to find and apply for the services you need.",
  },
  {
    icon: ShieldCheck,
    title: "Simple, Secure & Convenient",
    body: "Enjoy a seamless experience with easy browsing, applications, and transactions — all designed to save you time.",
  },
];

function SectionHeader({ title, action, to }: { title: string; action: string; to: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <h2 className="truncate text-2xl font-semibold tracking-tight">{title}</h2>
      <Link
        to={to}
        className="flex shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {action} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const products = useProductStore((state) => state.products);

  const [searchMode, setSearchMode] = useState<"marketplace" | "jobs" | "services">("marketplace");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetchProducts({ limit: 4, sort: "Trending" });
  }, [fetchProducts]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === "jobs") {
      navigate({ to: "/jobs", search: { q: query } as any });
    } else if (searchMode === "services") {
      navigate({ to: "/services", search: { q: query } as any });
    } else {
      navigate({ to: "/marketplace", search: { q: query } as any });
    }
  };

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="bg-hero relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-[1440px] px-5 py-16 text-center lg:px-14 lg:py-24">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-price animate-pulse" />
            <span>AI-Powered Sourcing & C2C Marketplace</span>
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            All Tasks In One Ask.
            <br />
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-price bg-clip-text text-transparent">
              Products, Jobs & Services.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Connect directly with verified local sellers, top employers, and skilled service professionals in one seamless platform.
          </p>

          {/* Interactive Search Box */}
          <div className="mx-auto mt-10 w-full max-w-3xl rounded-3xl border border-border bg-background p-3 shadow-xl backdrop-blur">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-3 px-2">
              {[
                { key: "marketplace", label: "Shop Products", Icon: Store },
                { key: "jobs", label: "Find Jobs", Icon: Briefcase },
                { key: "services", label: "Book Services", Icon: Wrench },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSearchMode(key as any)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                    searchMode === key
                      ? "bg-ink text-ink-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}

              <Link
                to="/ai-mode"
                className="ml-auto hidden items-center gap-1.5 rounded-xl bg-brand-soft px-3 py-1.5 text-xs font-medium text-price transition-colors hover:bg-brand/20 sm:flex"
              >
                <Sparkles className="h-3.5 w-3.5" /> Ask AI Assistant
              </Link>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleHeroSearch} className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchMode === "jobs"
                      ? "Job title, keyword, or company…"
                      : searchMode === "services"
                      ? "Service required (e.g. Plumbing, Cleaning, Tech)…"
                      : "Search electronics, fashion, vehicles, home decor…"
                  }
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div className="hidden min-w-[160px] items-center gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3 sm:flex">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <PlacesAutocomplete
                  value={location}
                  onChange={setLocation}
                  placeholder="Accra, Ghana"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-7 py-3.5 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
              >
                Search <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Popular Category Chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Popular:</span>
            {CATEGORIES.slice(1, 7).map((cat) => (
              <button
                key={cat}
                onClick={() => navigate({ to: "/marketplace", search: { q: cat } as any })}
                className="rounded-full border border-border bg-background px-3.5 py-1.5 transition-colors hover:border-foreground hover:bg-muted"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Stats Badges */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto border-t border-border pt-8 text-left">
            <div className="p-2">
              <p className="text-2xl font-bold tracking-tight">15,400+</p>
              <p className="text-xs text-muted-foreground mt-0.5">Active Products & Services</p>
            </div>
            <div className="p-2">
              <p className="text-2xl font-bold tracking-tight">99.4%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Verified Merchants</p>
            </div>
            <div className="p-2">
              <p className="text-2xl font-bold tracking-tight">24/7</p>
              <p className="text-xs text-muted-foreground mt-0.5">AI Smart Matching</p>
            </div>
            <div className="p-2">
              <p className="text-2xl font-bold tracking-tight">4.9 ★</p>
              <p className="text-xs text-muted-foreground mt-0.5">Community Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Marquee ── */}
      <section className="overflow-hidden border-b border-border py-6 bg-muted/20">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-8 px-5 lg:px-14">
          {BRANDS.map((b, i) => (
            <span key={i} className="text-sm font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {b}
            </span>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:px-14">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-brand">Why Vagoda</span>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Why clients and sellers trust Vagoda
            </h2>
            <p className="mt-4 text-sm text-ink-foreground/70 leading-relaxed">
              We connect everyday consumers directly with local businesses, job recruiters, and certified service professionals in one unified marketplace.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {REASONS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-ink-foreground/15 p-6 transition-colors hover:border-ink-foreground/30">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-foreground/60">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Products ── */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 lg:px-14">
        <SectionHeader title="Trending Products" action="Explore All Products" to="/marketplace" />
        <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} item={p} />
          ))}
        </div>
      </section>

      {/* ── Top Jobs Opportunities ── */}
      <section className="mx-auto max-w-[1440px] px-5 pb-16 lg:px-14">
        <SectionHeader title="Top Job Opportunities" action="Browse All Jobs" to="/jobs" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr_0.8fr]">
          {JOBS.slice(0, 2).map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
          <div className="overflow-hidden rounded-2xl border border-border bg-background p-6 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-brand-soft grid place-items-center text-price">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Recruiting Talent?</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Post job vacancies on Vagoda and reach thousands of qualified applicants across Ghana.
              </p>
            </div>
            <Link
              to="/jobs/new"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-xs font-medium text-ink-foreground transition-opacity hover:opacity-90"
            >
              Post a Job Listing <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Promoted Banner ── */}
      <section className="mx-auto max-w-[1440px] px-5 pb-16 lg:px-14">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-ink via-ink/95 to-ink/90 p-8 text-ink-foreground sm:p-12">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-price">
              <Sparkles className="h-3.5 w-3.5" /> Direct Contact & Instant Bookings
            </span>
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
              Are you a Service Provider or Marketplace Seller?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-ink-foreground/70 leading-relaxed">
              Create your business profile today and showcase your services or products to thousands of active local buyers.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-xs font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              Get Started Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recommended Services ── */}
      <section className="mx-auto max-w-[1440px] px-5 pb-20 lg:px-14">
        <SectionHeader title="Recommended Services" action="Explore All Services" to="/services" />
        <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.slice(0, 4).map((s) => (
            <ProductCard key={s.id} item={s} />
          ))}
        </div>
      </section>
    </>
  );
}
