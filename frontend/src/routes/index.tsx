import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Bookmark, Camera } from "lucide-react";
import { SERVICES, JOBS, BRANDS } from "@/lib/data";
import { ProductCard } from "@/components/site/ProductCard";
import { JobCard } from "@/components/site/JobCard";
import { useProductStore } from "@/lib/productStore";

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
    title: "Wide Range of Products",
    body: "Find everything you need in one convenient place, from everyday essentials to unique products offered by trusted sellers.",
  },
  {
    title: "Find Jobs Opportunities",
    body: "Discover job opportunities that match your skills and career goals, and apply easily to positions that interest you.",
  },
  {
    title: "Access Trusted Services",
    body: "Connect with reliable service providers for various needs, making it easier to find and apply for the services you need.",
  },
  {
    title: "Simple, Secure & Convenient",
    body: "Enjoy a seamless experience with easy browsing, applications, and transactions — all designed to save you time.",
  },
];

function SectionHeader({ title, action, to }: { title: string; action: string; to: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <h2 className="truncate text-2xl font-semibold">{title}</h2>
      <Link
        to={to}
        className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {action} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Home() {
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const products = useProductStore((state) => state.products);

  useEffect(() => {
    fetchProducts({ limit: 4, sort: "Trending" });
  }, [fetchProducts]);

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 py-20 text-center lg:px-14 lg:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
          <span className="text-star">✳</span> AI-Powered Global Search
        </span>
        <h1 className="mx-auto mt-8 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight lg:text-6xl">
          All Tasks In One Ask, Smart Sourcing With AI
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          Search products, services and jobs across the whole marketplace with a single question.
        </p>
        <Link
          to="/ai-mode"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
        >
          <span className="text-star">✳</span> Ask Ai
        </Link>
      </section>

      <section className="overflow-hidden border-y border-border py-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-8 px-5 lg:px-14">
          {BRANDS.map((b, i) => (
            <span key={i} className="text-lg font-semibold text-muted-foreground/70">
              {b}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 lg:grid-cols-[1fr_2fr] lg:px-14">
          <h2 className="text-3xl font-semibold leading-tight">
            Why Our Clients choose us as partners
          </h2>
          <div className="grid gap-10 sm:grid-cols-2">
            {REASONS.map((r) => (
              <div key={r.title}>
                <span className="block h-10 w-10 rounded-sm bg-ink-foreground/25" aria-hidden />
                <h3 className="mt-5 text-base font-semibold">{r.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-foreground/60">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-16 lg:px-14">
        <SectionHeader title="Trending Products" action="View All Shop" to="/marketplace" />
        <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} item={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-16 lg:px-14">
        <SectionHeader title="Top Jobs Opportunities" action="Explore Jobs" to="/jobs" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_0.8fr]">
          {JOBS.slice(0, 2).map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="h-32 bg-gradient-to-br from-[#7C3AED] via-[#DB2777] to-[#F59E0B]" />
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 p-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">Create a Job Post</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Join our dynamic team to lead the design process for a range of client projects.
                </p>
              </div>
              <Link
                to="/jobs/new"
                aria-label="Create a job post"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-ink text-ink-foreground"
              >
                <Camera className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-16 lg:px-14">
        <div className="grid h-[180px] place-items-center rounded-xl bg-muted text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" /> Promoted placement space
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-20 lg:px-14">
        <SectionHeader title="Recommended Services" action="All Services" to="/services" />
        <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.slice(0, 4).map((s) => (
            <ProductCard key={s.id} item={s} />
          ))}
        </div>
      </section>
    </>
  );
}
