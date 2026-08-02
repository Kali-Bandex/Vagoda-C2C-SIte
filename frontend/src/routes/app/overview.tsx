import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowUpRight, Download, ShoppingBag, TrendingUp, Star, AlertCircle } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState, useEffect } from "react";
import { useAuth, ROLE_META } from "@/lib/auth";
import { useOverview } from "@/lib/overview";
import { DashHeading } from "@/components/dashboard/DashboardShell";
import { api } from "@/lib/api";
import { RealOrderCard, type RealOrder } from "@/routes/dashboard";

export const Route = createFileRoute("/app/overview")({
  ssr: false,
  component: Overview,
});

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n}`;
}

function Overview() {
  const { session } = useAuth();
  const role = session?.role ?? "product";
  const meta = ROLE_META[role];
  const { stats, chartData, recentTransactions, ready, error } = useOverview();

  const isBuyer = role === "buyer";
  const isJob = role === "job";
  const isService = role === "service";

  const [buyerOrders, setBuyerOrders] = useState<RealOrder[]>([]);
  const [loadingBuyerOrders, setLoadingBuyerOrders] = useState(isBuyer);

  useEffect(() => {
    if (!isBuyer) return;
    api.get("/orders/buyer")
      .then((res) => setBuyerOrders(res.data.orders || []))
      .catch(() => setBuyerOrders([]))
      .finally(() => setLoadingBuyerOrders(false));
  }, [isBuyer]);

  const statCards = [
    {
      label: isBuyer ? "Total Purchases" : isJob ? "Jobs Posted" : isService ? "Services Listed" : `Total ${meta.listings}`,
      value: ready ? String(stats.totalProducts) : null,
      tone: "bg-[oklch(0.95_0.05_50)] text-[oklch(0.6_0.19_40)]",
      icon: ShoppingBag,
      up: true,
    },
    {
      label: isBuyer ? "Total Spent" : isJob ? "Total Applications" : "Total Earnings",
      value: ready ? (isJob ? String(stats.totalEarnings) : fmt(stats.totalEarnings)) : null,
      tone: "bg-brand-soft text-price",
      icon: TrendingUp,
      up: true,
    },
    {
      label: isBuyer ? "Saved Items" : isJob ? "Total Hired" : isService ? "Total Bookings" : `Total ${meta.activity}`,
      value: ready ? String(stats.totalOrders) : null,
      tone: "bg-[oklch(0.95_0.04_20)] text-destructive",
      icon: ShoppingBag,
      up: true,
    },
    {
      label: isBuyer ? "Delivered Orders" : isJob ? "Total Views" : isService ? "Total Views" : "Total Ratings",
      value: ready ? String(stats.totalRatings) : null,
      tone: "bg-[oklch(0.94_0.04_285)] text-[oklch(0.5_0.18_285)]",
      icon: Star,
      up: true,
    },
  ];

  // total chart revenue for badge
  const totalChartRevenue = chartData.reduce((a, b) => a + b.value, 0);
  const prevChartRevenue  = chartData.reduce((a, b) => a + b.compare, 0);
  const growthPct =
    prevChartRevenue > 0
      ? (((totalChartRevenue - prevChartRevenue) / prevChartRevenue) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-8">
      <DashHeading
        title={`Welcome Back${session?.name ? `, ${session.name.split(" ")[0]}` : ""}!`}
        subtitle={
          isBuyer
            ? "Here's your order history and spending overview."
            : isJob
            ? "Here's how your job postings and applications are performing."
            : isService
            ? "Here's how your service offerings and bookings are performing."
            : "Here's how your store is performing today."
        }
      />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-[oklch(0.97_0.02_20)] px-5 py-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <Link
                  to="/app/listings"
                  aria-label={`Open ${s.label}`}
                  className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${s.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                {s.value !== null ? (
                  <p className="truncate text-4xl font-semibold">{s.value}</p>
                ) : (
                  <span className="h-9 w-20 animate-pulse rounded bg-muted" />
                )}
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs">
                <TrendingUp className={`h-3.5 w-3.5 ${s.up ? "text-price" : "text-destructive"}`} />
                <span className={s.up ? "text-price" : "text-destructive"}>
                  {stats.avgRating > 0 ? `${stats.avgRating}★` : "—"}
                </span>
                <span className="text-muted-foreground">avg rating</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Area Chart ── */}
      <div className="rounded-2xl border border-border p-5">
        <div className="h-[320px] w-full">
          {!ready ? (
            <div className="flex h-full items-center justify-center">
              <span className="h-full w-full animate-pulse rounded-xl bg-muted" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 16, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="oklch(0.75 0.22 145)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.75 0.22 145)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="currentColor" className="text-border" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={50}
                  tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="compare"
                  stroke="oklch(0.85 0.1 145)"
                  fill="url(#fill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(0.65 0.22 145)"
                  fill="url(#fill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            onClick={() => toast.success("Report downloaded")}
            className="flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium"
          >
            Download Report <Download className="h-4 w-4" />
          </button>
          {ready && (
            <>
              <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-price">
                {Number(growthPct) >= 0 ? "+" : ""}{growthPct}%
              </span>
              <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                Last 8 Months
              </span>
            </>
          )}
          <p className="ml-auto text-3xl font-semibold">
            {ready ? fmt(totalChartRevenue) : <span className="inline-block h-8 w-28 animate-pulse rounded bg-muted" />}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {isBuyer ? "Total Spending" : "Total Revenue"}
            </span>
          </p>
        </div>
      </div>

      {/* ── Recent Transactions / Orders & Tracking ── */}
      <div className="rounded-2xl border border-border p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {isBuyer ? "Active Orders & Tracking" : "Latest Transactions"}
          </h2>
          <Link
            to={isBuyer ? "/dashboard" : "/app/activity"}
            search={isBuyer ? { tab: "orders" } : undefined}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            View All →
          </Link>
        </div>

        {isBuyer ? (
          loadingBuyerOrders ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : buyerOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center">
              <p className="font-semibold">No recent orders found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse our marketplace to place your first order.
              </p>
              <Link
                to="/marketplace"
                className="mt-4 inline-block rounded-xl bg-ink px-5 py-2.5 text-xs font-medium text-ink-foreground"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {buyerOrders.map((order) => (
                <RealOrderCard key={order.id} order={order} />
              ))}
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-3 font-normal">Customer</th>
                  <th className="py-3 font-normal">{meta.listing}</th>
                  <th className="py-3 font-normal">Price</th>
                  <th className="py-3 font-normal">Qty</th>
                  <th className="py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {!ready
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-t border-border">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="py-4">
                            <span className="inline-block h-4 w-28 animate-pulse rounded bg-muted" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : recentTransactions.length === 0
                  ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No transactions yet. Add your first listing to get started.
                        </td>
                      </tr>
                    )
                  : recentTransactions.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="py-4">{r.person}</td>
                        <td className="max-w-[240px] truncate py-4">{r.listing}</td>
                        <td className="py-4 text-muted-foreground">${r.price.toLocaleString()}</td>
                        <td className="py-4 text-muted-foreground">{r.qty}</td>
                        <td className="py-4">
                          <StatusPill status={r.status as "Done" | "Pending" | "Cancelled"} />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Done" || status === "Delivered"
      ? "bg-brand-soft text-price"
      : status === "Pending" || status === "Processing" || status === "In Transit" || status === "Shipped"
        ? "bg-[oklch(0.95_0.08_75)] text-[oklch(0.55_0.17_60)]"
        : "bg-[oklch(0.95_0.04_20)] text-destructive";
  return <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${tone}`}>{status}</span>;
}
