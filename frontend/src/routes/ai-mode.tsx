import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Search,
  Sparkles,
  Flame,
  ArrowRight,
  Star,
  ShoppingCart,
  Eye,
  Bookmark,
  Briefcase,
  Package,
  Wrench,
  Brain,
  CheckCircle2,
} from "lucide-react";
import { useAiSearchStore, type AiSearchResultItem } from "@/lib/aiSearchStore";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-mode")({
  component: AiMode,
  head: () => ({
    meta: [
      { title: "AI Mode — Smart Sourcing With Vagoda AI" },
      {
        name: "description",
        content:
          "Ask Vagoda AI plain language questions to discover matching products, services and jobs across the marketplace.",
      },
      { property: "og:title", content: "AI Mode — Smart Sourcing With Vagoda AI" },
      {
        property: "og:description",
        content: "One ask, all tasks. AI-powered global search across Vagoda.",
      },
    ],
  }),
});

const QUICK_PROMPTS = [
  "Wireless noise-cancelling headphones",
  "Web developer for React project",
  "Ergonomic office desk & chair",
  "Electrician for home rewiring",
  "Figma mobile UI designer job",
];

function MatchBadge({ score }: { score: number }) {
  let badgeStyle = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (score < 85) badgeStyle = "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (score < 75) badgeStyle = "bg-amber-500/10 text-amber-600 border-amber-500/20";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur ${badgeStyle}`}
    >
      <Sparkles className="h-3 w-3" />
      {score}% Match
    </span>
  );
}

function ProductResultCard({ item }: { item: AiSearchResultItem }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const isSaved = wishlist.includes(item.id);

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-card">
      <div>
        <div className="relative overflow-hidden rounded-lg bg-muted">
          <Link to="/marketplace/$id" params={{ id: item.id }}>
            <img
              src={item.image || "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80"}
              alt={item.title}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
          <div className="absolute left-3 top-3">
            <MatchBadge score={item.matchScore} />
          </div>
          <button
            onClick={() => toggleWishlist(item.id)}
            aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/85 backdrop-blur transition-colors hover:bg-background"
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
          </button>
        </div>

        <div className="mt-3">
          <span className="inline-block rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {item.category || "Product"}
          </span>
          <Link
            to="/marketplace/$id"
            params={{ id: item.id }}
            className="mt-1 line-clamp-2 block text-base font-semibold hover:underline"
          >
            {item.title}
          </Link>

          {item.matchReason && (
            <p className="mt-1.5 text-xs italic text-muted-foreground">
              "{item.matchReason}"
            </p>
          )}

          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-foreground font-medium">
              <Star className="h-3.5 w-3.5 fill-star text-star" />
              {item.rating || 5.0}
            </span>
            <span>{item.location}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div>
          <span className="text-base font-bold text-price">${item.price}</span>
          {item.oldPrice && (
            <span className="ml-2 text-xs text-muted-foreground line-through">
              ${item.oldPrice}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            addToCart({
              id: item.id,
              title: item.title,
              image: item.image || "",
              price: item.price || 0,
            });
          }}
          className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground transition-opacity hover:opacity-90"
        >
          <ShoppingCart className="h-3.5 w-3.5" /> Cart
        </button>
      </div>
    </article>
  );
}

function ServiceResultCard({ item }: { item: AiSearchResultItem }) {
  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-card">
      <div>
        <div className="relative overflow-hidden rounded-lg bg-muted">
          <Link to="/services/$id" params={{ id: item.id }}>
            <img
              src={item.image || "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80"}
              alt={item.title}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
          <div className="absolute left-3 top-3">
            <MatchBadge score={item.matchScore} />
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-background/85 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
            Service
          </span>
        </div>

        <div className="mt-3">
          <span className="inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            {item.category || "Service"}
          </span>
          <Link
            to="/services/$id"
            params={{ id: item.id }}
            className="mt-1 line-clamp-2 block text-base font-semibold hover:underline"
          >
            {item.title}
          </Link>

          {item.matchReason && (
            <p className="mt-1.5 text-xs italic text-muted-foreground">
              "{item.matchReason}"
            </p>
          )}

          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div>
          <span className="text-base font-bold text-price">${item.price}</span>
          <span className="text-xs text-muted-foreground"> / service</span>
        </div>
        <Link
          to="/services/$id"
          params={{ id: item.id }}
          className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground transition-opacity hover:opacity-90"
        >
          <Eye className="h-3.5 w-3.5" /> Book Service
        </Link>
      </div>
    </article>
  );
}

function JobResultCard({ item }: { item: AiSearchResultItem }) {
  const { wishlist, toggleWishlist } = useStore();
  const isSaved = wishlist.includes(item.id);

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-card">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {item.companyLogo ? (
              <img
                src={item.companyLogo}
                alt={item.company}
                className="h-10 w-10 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand font-bold">
                {item.company?.[0] || "J"}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{item.company || "Hiring Company"}</p>
              <Link
                to="/jobs/$id"
                params={{ id: item.id }}
                className="text-base font-semibold hover:underline line-clamp-1"
              >
                {item.title}
              </Link>
            </div>
          </div>
          <MatchBadge score={item.matchScore} />
        </div>

        {item.matchReason && (
          <p className="mt-2.5 text-xs italic text-muted-foreground">
            "{item.matchReason}"
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-2 py-0.5">{item.type || "Full-time"}</span>
          <span className="rounded bg-muted px-2 py-0.5">{item.mode || "Remote"}</span>
          <span>{item.location}</span>
        </div>

        {item.skills && item.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.skills.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px]">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div>
          <span className="text-sm font-semibold text-price">
            {item.salaryLabel || (item.salaryMin ? `$${item.salaryMin.toLocaleString()}/yr` : "Competitive")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              toggleWishlist(item.id);
              toast.success(isSaved ? "Removed from saved" : "Job saved to dashboard");
            }}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border transition-colors hover:bg-muted"
            aria-label="Save Job"
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current text-price" : "text-muted-foreground"}`} />
          </button>
          <Link
            to="/jobs/$id"
            params={{ id: item.id }}
            className="flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground transition-opacity hover:opacity-90"
          >
            Apply Now <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function AiMode() {
  const {
    query,
    loading,
    error,
    aiSummary,
    intentCategory,
    keywords,
    suggestedQueries,
    products,
    services,
    jobs,
    totalMatches,
    activeTab,
    setQuery,
    setActiveTab,
    performAiSearch,
  } = useAiSearchStore();

  useEffect(() => {
    // Initial fetch on mount if no search done yet
    if (products.length === 0 && services.length === 0 && jobs.length === 0 && !loading) {
      performAiSearch("");
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) {
      performAiSearch();
    }
  };

  const handlePromptClick = (promptText: string) => {
    setQuery(promptText);
    performAiSearch(promptText);
  };

  // Combine top matches for "All" tab
  const allMatches = [...products, ...services, ...jobs].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <>
      {/* Hero Section */}
      <section className="relative mx-auto max-w-[1440px] px-5 py-12 text-center lg:px-14 lg:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> AI-Powered Semantic Search Engine
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight lg:text-5xl">
          One Ask, All Tasks across Vagoda Marketplace
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground lg:text-base">
          Describe your requirement in natural language. Vagoda AI parses your intent and finds matching products, services, and career opportunities simultaneously.
        </p>

        {/* Search Input Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="mx-auto mt-8 flex max-w-[740px] items-center rounded-full border border-border bg-card p-2 pl-6 shadow-sm transition-all focus-within:border-brand focus-within:shadow-md"
        >
          <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "Wireless noise cancelling headphones" or "Web developer for React"'
            aria-label="Ask Vagoda AI"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground lg:text-base"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex shrink-0 items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-ink-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Brain className="h-4 w-4 animate-spin" /> Thinking...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-star" /> Ask AI
              </>
            )}
          </button>
        </form>

        {/* Quick Prompts Chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-xs text-muted-foreground font-medium">Quick Prompts:</span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handlePromptClick(prompt)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
            >
              <Flame className="h-3.5 w-3.5 text-amber-500" /> {prompt}
            </button>
          ))}
        </div>
      </section>

      {/* Main Results Section */}
      <section className="mx-auto max-w-[1440px] px-5 pb-24 lg:px-14">
        {/* AI Insight & Intent Summary Banner */}
        {(aiSummary || loading) && (
          <div className="relative mb-10 overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-r from-brand-soft/60 via-card to-background p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                    Vagoda AI Search Summary
                    {loading && <span className="text-xs font-normal text-muted-foreground">(Analyzing query...)</span>}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {loading ? "Parsing your query with Gemini AI model to extract key specs and matching criteria..." : aiSummary}
                  </p>

                  {!loading && keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-foreground">Detected Intent:</span>
                      <span className="rounded-full bg-brand/10 px-2.5 py-0.5 font-medium text-brand">
                        Category: {intentCategory}
                      </span>
                      {keywords.map((kw, i) => (
                        <span key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!loading && (
                <div className="shrink-0 text-right md:border-l md:border-border md:pl-6">
                  <div className="text-2xl font-bold text-foreground">{totalMatches}</div>
                  <div className="text-xs text-muted-foreground">Semantic Matches</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs & Domain Filters */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "all"
                  ? "bg-ink text-ink-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4" /> All Top Matches ({allMatches.length})
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "products"
                  ? "bg-ink text-ink-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="h-4 w-4" /> Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "services"
                  ? "bg-ink text-ink-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wrench className="h-4 w-4" /> Services ({services.length})
            </button>
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "jobs"
                  ? "bg-ink text-ink-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Briefcase className="h-4 w-4" /> Jobs ({jobs.length})
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading State Skeletons */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border p-4">
                <div className="aspect-[4/3] w-full rounded-lg bg-muted" />
                <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* All Tab View */}
            {activeTab === "all" && (
              <div className="space-y-12">
                {products.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-xl font-bold">
                        <Package className="h-5 w-5 text-brand" /> Matched Products ({products.length})
                      </h3>
                      <button
                        onClick={() => setActiveTab("products")}
                        className="text-xs font-semibold text-muted-foreground hover:underline"
                      >
                        View all products
                      </button>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {products.slice(0, 4).map((p) => (
                        <ProductResultCard key={p.id} item={p} />
                      ))}
                    </div>
                  </div>
                )}

                {services.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-xl font-bold">
                        <Wrench className="h-5 w-5 text-emerald-600" /> Matched Services ({services.length})
                      </h3>
                      <button
                        onClick={() => setActiveTab("services")}
                        className="text-xs font-semibold text-muted-foreground hover:underline"
                      >
                        View all services
                      </button>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {services.slice(0, 4).map((s) => (
                        <ServiceResultCard key={s.id} item={s} />
                      ))}
                    </div>
                  </div>
                )}

                {jobs.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-xl font-bold">
                        <Briefcase className="h-5 w-5 text-blue-600" /> Matched Opportunities ({jobs.length})
                      </h3>
                      <button
                        onClick={() => setActiveTab("jobs")}
                        className="text-xs font-semibold text-muted-foreground hover:underline"
                      >
                        View all jobs
                      </button>
                    </div>
                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                      {jobs.slice(0, 4).map((j) => (
                        <JobResultCard key={j.id} item={j} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Products Tab View */}
            {activeTab === "products" && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((p) => (
                  <ProductResultCard key={p.id} item={p} />
                ))}
                {products.length === 0 && (
                  <p className="col-span-full py-12 text-center text-muted-foreground">
                    No matching products found for your query. Try adjusting terms.
                  </p>
                )}
              </div>
            )}

            {/* Services Tab View */}
            {activeTab === "services" && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {services.map((s) => (
                  <ServiceResultCard key={s.id} item={s} />
                ))}
                {services.length === 0 && (
                  <p className="col-span-full py-12 text-center text-muted-foreground">
                    No matching services found for your query.
                  </p>
                )}
              </div>
            )}

            {/* Jobs Tab View */}
            {activeTab === "jobs" && (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {jobs.map((j) => (
                  <JobResultCard key={j.id} item={j} />
                ))}
                {jobs.length === 0 && (
                  <p className="col-span-full py-12 text-center text-muted-foreground">
                    No matching job opportunities found for your query.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Suggested Queries Footer */}
        {suggestedQueries.length > 0 && !loading && (
          <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
            <h4 className="text-sm font-semibold text-foreground">Suggested Follow-up Searches:</h4>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {suggestedQueries.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(sq)}
                  className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
                >
                  🔍 {sq}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
