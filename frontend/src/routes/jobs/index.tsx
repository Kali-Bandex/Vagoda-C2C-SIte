import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState, useCallback } from "react";
import { Search, MapPin, Briefcase } from "lucide-react";
import { useJobStore, type JobFilters } from "@/lib/jobStore";
import { JobCard } from "@/components/site/JobCard";
import { Pager } from "@/components/site/Pager";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";
import { FilterSidebar, DEFAULT_FILTERS, type Filters } from "@/components/site/FilterSidebar";
import { CategoryChips } from "@/components/site/CategoryChips";
import jobsHero from "@/assets/jobs-hero.png";

const HERO_IMG = jobsHero;

export const Route = createFileRoute("/jobs/")({
  validateSearch: z.object({ q: z.string().optional(), category: z.string().optional() }),
  component: JobsPage,
  head: () => ({
    meta: [
      { title: "Jobs — Discover Your Next Career Opportunity" },
      {
        name: "description",
        content:
          "Search full-time, remote and on-site job openings from companies hiring across Ghana on Vagoda.",
      },
      { property: "og:title", content: "Jobs — Discover Your Next Career Opportunity" },
      {
        property: "og:description",
        content: "Browse and apply to curated job opportunities on Vagoda.",
      },
    ],
  }),
});

const JOB_CATEGORIES = ["Design", "Engineering", "Marketing", "Finance", "HR", "Sales", "Legal", "Medical", "Operations"];
const JOB_TYPES = ["All", "Full-time", "Part-time", "Contract", "Remote", "Internship"];
const SORT_OPTIONS = ["Newest", "Most Applied", "Salary", "Trending"];
const PER_PAGE = 9;

function JobsPage() {
  const { q: initialQ, category: initialCat } = Route.useSearch();
  const { jobs, total, pages, loadingJobs, fetchJobs } = useJobStore();

  const [query, setQuery] = useState(initialQ ?? "");
  const [term, setTerm] = useState(initialQ ?? "");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState(initialCat ?? "");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const doFetch = useCallback(() => {
    const filtersPayload: JobFilters = {
      search: term || undefined,
      category: category ? category : undefined,
      type: type !== "All" ? type : undefined,
      location: (location || (filters.locations.length > 0 ? filters.locations[0] : undefined)) || undefined,
      sort,
      page,
      limit: PER_PAGE,
    };
    fetchJobs(filtersPayload);
  }, [term, category, type, location, filters, sort, page, fetchJobs]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-hero">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:gap-16 px-5 py-12 lg:grid-cols-2 lg:px-14 lg:py-20">
          <div className="my-auto lg:my-6 lg:py-6 lg:pr-10">
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight lg:text-5xl">
              Discover Your Next
              <br />
              Career Opportunity
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              Browse thousands of opportunities from top companies across Ghana and beyond.
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
                placeholder="Job title or keyword"
                aria-label="Job title or keyword"
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
                aria-label="Search jobs"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
          <img
            src={HERO_IMG}
            alt="Job opportunities vector illustration"
            style={{ filter: "grayscale(70%)" }}
            className="mx-auto max-h-[480px] lg:max-h-[540px] w-full max-w-[640px] object-contain drop-shadow-md grayscale-[70%] transition-all duration-300 hover:grayscale-0 hover:scale-[1.02]"
          />
        </div>
      </section>

      {/* ── Listing Structure Matching ListingPage ── */}
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-12 lg:flex-row lg:px-14">
        {/* Left Filter Sidebar */}
        <FilterSidebar
          mode="jobs"
          value={filters}
          categories={JOB_CATEGORIES}
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
            categories={JOB_CATEGORIES}
            active={category}
            onChange={(c) => {
              setCategory(c);
              setPage(1);
            }}
            className="mt-4"
          />

          {/* Job Type Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {JOB_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setPage(1); }}
                className={
                  type === t
                    ? "rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-price"
                    : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* Results Sub-bar */}
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="min-w-0 truncate text-sm">
              <span className="font-medium">{loadingJobs ? "…" : total.toLocaleString()}</span> results found for {term ? `“${term}”` : `“${category || "All"}”`}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                to="/jobs/new"
                className="hidden items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-ink-foreground sm:flex"
              >
                <Briefcase className="h-3.5 w-3.5" /> Post a Job
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

          {/* Job Grid matching ListingPage grid */}
          {loadingJobs ? (
            <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="mt-16 rounded-xl border border-dashed border-border py-20 text-center">
              <p className="font-semibold">No jobs match your search</p>
              <p className="mt-2 text-sm text-muted-foreground">Try different keywords, category or location.</p>
              <button
                onClick={() => { setTerm(""); setQuery(""); setCategory(""); setType("All"); setPage(1); }}
                className="mt-6 rounded-xl bg-ink px-6 py-3 text-sm font-medium text-ink-foreground"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j as any} />
              ))}
            </div>
          )}

          <Pager page={page} pages={pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </div>
      </div>
    </>
  );
}
