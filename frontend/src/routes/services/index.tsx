import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Search, MapPin, Wrench } from "lucide-react";
import { useServiceStore, type ServiceFilters } from "@/lib/serviceStore";
import { ProductCard } from "@/components/site/ProductCard";
import { Pager } from "@/components/site/Pager";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";
import { FilterSidebar, DEFAULT_FILTERS, type Filters } from "@/components/site/FilterSidebar";
import { CategoryChips } from "@/components/site/CategoryChips";
import servicesHero from "@/assets/services-hero.png";

export const Route = createFileRoute("/services/")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services — Find Trusted Service Providers Near You" },
      {
        name: "description",
        content:
          "Book verified electricians, welders, mechanics, stays and more from trusted local service providers on Vagoda.",
      },
      { property: "og:title", content: "Services — Find Trusted Service Providers Near You" },
      {
        property: "og:description",
        content: "Discover and book trusted local service providers on Vagoda.",
      },
    ],
  }),
});

const SERVICE_CATEGORIES = ["Electronic", "Fashion", "Vehicle", "Home", "Gaming", "Furniture", "Electrical", "Welding", "Automotive", "Plumbing", "Cleaning", "IT & Repair"];
const SORT_OPTIONS = ["Newest", "Popular", "Rating", "Price: Low to High", "Price: High to Low"];
const PER_PAGE = 9;

function ServicesPage() {
  const { services, total, pages, loadingServices, fetchServices } = useServiceStore();

  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("Newest");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const doFetch = useCallback(() => {
    const filtersPayload: ServiceFilters = {
      search: term || undefined,
      category: category ? category : undefined,
      location: (location || (filters.locations.length > 0 ? filters.locations[0] : undefined)) || undefined,
      sort,
      page,
      limit: PER_PAGE,
    };
    fetchServices(filtersPayload);
  }, [term, category, location, filters, sort, page, fetchServices]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return (
    <>
      {/* ── Hero Banner ── */}
      <section className="bg-hero">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:gap-16 px-5 py-12 lg:grid-cols-2 lg:px-14 lg:py-20">
          <div className="my-auto lg:my-6 lg:py-6 lg:pr-10">
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight lg:text-5xl">
              Find Trusted Service
              <br />
              Providers Near You
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              Book verified electricians, welders, mechanics, stay reservations and experts across Ghana.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setTerm(query);
                setPage(1);
              }}
              className="mt-8 flex max-w-[480px] items-center rounded-full bg-background py-2 pl-5 pr-2 shadow-sm ring-1 ring-border"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services nearby…"
                aria-label="Search services nearby"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <span className="mx-3 hidden h-6 w-px bg-border sm:block" />
              <span className="mr-2 hidden shrink-0 items-center gap-1.5 text-sm text-muted-foreground sm:flex">
                <MapPin className="h-4 w-4" />
                <PlacesAutocomplete
                  value={location}
                  onChange={(val) => { setLocation(val); setPage(1); }}
                  placeholder="Location"
                  aria-label="Location"
                  className="w-28 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </span>
              <button
                type="submit"
                aria-label="Search services"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
          <img
            src={servicesHero}
            alt="Service providers vector illustration"
            style={{ filter: "grayscale(70%)" }}
            className="mx-auto max-h-[480px] lg:max-h-[540px] w-full max-w-[640px] object-contain drop-shadow-md grayscale-[70%] transition-all duration-300 hover:grayscale-0 hover:scale-[1.02]"
          />
        </div>
      </section>

      {/* ── Main Listing Area matching ListingPage ── */}
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-12 lg:flex-row lg:px-14">
        {/* Left Filter Sidebar */}
        <FilterSidebar
          mode="services"
          value={filters}
          categories={SERVICE_CATEGORIES}
          selectedCategory={category}
          onCategoryChange={(c) => {
            setCategory(c);
            setPage(1);
          }}
          onApply={(f) => {
            setFilters(f);
            setPage(1);
          }}
          onReset={() => {
            setFilters(DEFAULT_FILTERS);
            setCategory("");
            setPage(1);
          }}
        />

        {/* Right Content Area */}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Categories</h2>
          <CategoryChips
            categories={SERVICE_CATEGORIES}
            active={category}
            onChange={(c) => {
              setCategory(c);
              setPage(1);
            }}
            className="mt-4"
          />

          {/* Results Sub-bar */}
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="min-w-0 truncate text-sm">
              <span className="font-medium">{loadingServices ? "…" : total.toLocaleString()}</span> results found for {term ? `“${term}”` : `“${category || "All"}”`}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                to="/services/new"
                className="hidden items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-ink-foreground sm:flex"
              >
                <Wrench className="h-3.5 w-3.5" /> Post a Service
              </Link>
              <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                Sort by:
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                >
                  {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            </div>
          </div>

          {/* Services Grid matching ListingPage grid */}
          {loadingServices ? (
            <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="mt-16 rounded-xl border border-dashed border-border py-20 text-center">
              <p className="font-semibold">No services match your search</p>
              <p className="mt-2 text-sm text-muted-foreground">Try different keywords, category or location.</p>
              <button
                onClick={() => { setTerm(""); setQuery(""); setCategory(""); setPage(1); }}
                className="mt-6 rounded-xl bg-ink px-6 py-3 text-sm font-medium text-ink-foreground"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((item) => (
                <ProductCard key={item.id} item={item as any} />
              ))}
            </div>
          )}

          <Pager page={page} pages={pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </div>
      </div>
    </>
  );
}
