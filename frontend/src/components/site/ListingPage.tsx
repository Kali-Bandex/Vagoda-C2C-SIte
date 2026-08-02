import { useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";
import type { Product } from "@/lib/data";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { CategoryChips } from "./CategoryChips";
import { FilterSidebar, DEFAULT_FILTERS, type Filters } from "./FilterSidebar";
import { Pager } from "./Pager";
import { useProductStore } from "@/lib/productStore";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";

export function ListingPage({
  title,
  subtitle,
  searchPlaceholder,
  illustration,
  illustrationAlt,
  items: initialItems = [],
  initialQuery = "",
  isLiveMarketplace = true,
}: {
  title: React.ReactNode;
  subtitle: string;
  searchPlaceholder: string;
  illustration: string;
  illustrationAlt: string;
  items?: Product[];
  initialQuery?: string;
  isLiveMarketplace?: boolean;
}) {
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const liveProducts = useProductStore((state) => state.products);
  const total = useProductStore((state) => state.total);
  const totalPages = useProductStore((state) => state.pages);
  const storeLoading = useProductStore((state) => state.loading);

  const [query, setQuery] = useState(initialQuery);
  const [term, setTerm] = useState(initialQuery);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState("Trending");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isLiveMarketplace) {
      fetchProducts({
        search: term,
        category: category || undefined,
        minPrice: filters.price[0] > 0 ? filters.price[0] : undefined,
        maxPrice: filters.price[1] < 10000 ? filters.price[1] : undefined,
        location: location.trim() || undefined,
        topRated: filters.topRated,
        sort,
        page,
        limit: 9,
      });
    }
  }, [isLiveMarketplace, fetchProducts, term, category, filters, sort, page, location]);

  const displayProducts = isLiveMarketplace ? liveProducts : initialItems;
  const pages = isLiveMarketplace ? totalPages : Math.max(1, Math.ceil(initialItems.length / 9));

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTerm(query);
    setPage(1);
  };

  return (
    <>
      <section className="bg-hero">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:gap-16 px-5 py-12 lg:grid-cols-2 lg:px-14 lg:py-20">
          <div className="my-auto lg:my-6 lg:py-6 lg:pr-10">
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-base text-muted-foreground">{subtitle}</p>
            <form
              onSubmit={runSearch}
              className="mt-8 flex max-w-[420px] items-center rounded-full bg-background py-2 pl-5 pr-2"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
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
                aria-label="Search"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
          <img
            src={illustration}
            alt={illustrationAlt}
            loading="lazy"
            style={{ filter: "grayscale(70%)" }}
            className="mx-auto max-h-[480px] lg:max-h-[540px] w-full max-w-[640px] object-contain drop-shadow-md grayscale-[70%] transition-all duration-300 hover:grayscale-0 hover:scale-[1.02]"
          />
        </div>
      </section>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-12 lg:flex-row lg:px-14">
        <FilterSidebar
          mode="products"
          value={filters}
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

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Categories</h2>
          <CategoryChips
            active={category}
            onChange={(c) => {
              setCategory(c);
              setPage(1);
            }}
            className="mt-4"
          />

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="min-w-0 truncate text-sm">
              <span className="font-medium">
                {isLiveMarketplace ? total.toLocaleString() : displayProducts.length.toLocaleString()}
              </span>{" "}
              results found for {term ? `“${term}”` : `“${category || "All"}”`}
            </p>
            <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              Sort by:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
              >
                <option>Trending</option>
                <option>Top Rated</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </label>
          </div>

          {storeLoading && isLiveMarketplace ? (
            <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="mt-16 rounded-xl border border-dashed border-border py-20 text-center">
              <p className="font-semibold">No products found</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a different keyword, category or widen your price range.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {displayProducts.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}

          <Pager page={page} pages={pages} onChange={setPage} />
        </div>
      </div>
    </>
  );
}
