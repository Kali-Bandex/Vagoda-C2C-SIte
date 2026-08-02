import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Home,
  Bookmark,
  Briefcase,
  CalendarDays,
  MessageSquare,
  LogOut,
  RefreshCw,
  SlidersHorizontal,
  Search,
  ShoppingBag,
  Trash2,
  MapPin,
  Phone,
  Columns2,
  Package,
} from "lucide-react";
import { SERVICES, JOBS, type Product } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useProductStore } from "@/lib/productStore";
import { useServiceStore } from "@/lib/serviceStore";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ApplicationCard, type ApplicationData } from "@/components/site/ApplicationCard";
import { BookingCard, type BookingData } from "@/components/site/BookingCard";
import { DashboardShell, DashHeading } from "@/components/dashboard/DashboardShell";

const TABS = ["orders", "saved", "applications", "bookings", "message"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/dashboard")({
  validateSearch: z.object({ tab: z.enum(TABS).optional() }),
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Your Dashboard — Orders, Saved & Applications | Vagoda" },
      {
        name: "description",
        content:
          "Track your product orders, saved items, service bookings and job applications in one place.",
      },
      { property: "og:title", content: "Your Dashboard — Vagoda" },
      {
        property: "og:description",
        content: "Manage orders, bookings and applications on your Vagoda account.",
      },
    ],
  }),
});

const NAV: { key: Tab; label: string; Icon: typeof Home }[] = [
  { key: "orders", label: "Orders", Icon: Home },
  { key: "saved", label: "Saved", Icon: Bookmark },
  { key: "applications", label: "Applications", Icon: Briefcase },
  { key: "bookings", label: "Bookings", Icon: CalendarDays },
  { key: "message", label: "Message", Icon: MessageSquare },
];

export interface RealOrder {
  id: string;
  orderNumber: string;
  status: "Received" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  totalAmount: number;
  shippingAddress: string;
  createdAt: string;
  items: Array<{
    productId?: string;
    title: string;
    price: number;
    qty: number;
    image?: string;
    selectedSize?: string;
    selectedColour?: string;
  }>;
  seller?: {
    id?: string;
    name: string;
    avatar?: string;
    location?: string;
    phone?: string;
  };
}

function Dashboard() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const active: Tab = tab ?? "orders";
  const { cart, wishlist } = useStore();
  const { session, ready, signOut } = useAuth();

  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [realOrders, setRealOrders] = useState<RealOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const liveProducts = useProductStore((state) => state.products);
  const liveServices = useServiceStore((state) => state.services);
  const allItems: any[] = [...liveProducts, ...liveServices, ...SERVICES];

  const saved = wishlist
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is any => Boolean(i));

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get("/orders/buyer");
      setRealOrders(res.data.orders || []);
    } catch {
      setRealOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (ready && !session) {
      navigate({ to: "/auth" });
      return;
    }
    if (session) {
      fetchOrders();
      // Fetch applications for applicant
      setLoadingApplications(true);
      api.get("/applications/applicant")
        .then((res) => setApplications(res.data.applications || []))
        .catch(() => setApplications([]))
        .finally(() => setLoadingApplications(false));

      // Fetch bookings for customer
      setLoadingBookings(true);
      api.get("/bookings/customer")
        .then((res) => setBookings(res.data.bookings || []))
        .catch(() => setBookings([]))
        .finally(() => setLoadingBookings(false));
    } else {
      setLoadingOrders(false);
    }
  }, [ready, session?.id, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const filteredRealOrders = realOrders.filter((o) =>
    o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
    o.items.some((i) => i.title.toLowerCase().includes(query.toLowerCase())) ||
    o.seller?.name.toLowerCase().includes(query.toLowerCase())
  );

  const stats = [
    {
      label: "Total Orders",
      value: realOrders.length || cart.length,
      tone: "bg-[oklch(0.95_0.05_50)] text-[oklch(0.6_0.19_40)]",
    },
    {
      label: "Delivered",
      value: realOrders.filter((o) => o.status === "Delivered").length,
      tone: "bg-brand-soft text-price",
    },
    {
      label: "Pending",
      value: realOrders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length,
      tone: "bg-[oklch(0.95_0.04_20)] text-destructive",
    },
    {
      label: "Saved Items",
      value: wishlist.length,
      tone: "bg-[oklch(0.94_0.04_285)] text-[oklch(0.5_0.18_285)]",
    },
  ];

  const tabTitles: Record<Tab, { title: string; subtitle: string }> = {
    orders: { title: "My Orders", subtitle: "Track your product orders and manage your purchases." },
    saved: { title: "Saved Items", subtitle: "View products and services you saved for later." },
    applications: { title: "Job Applications", subtitle: "Track and manage jobs you applied for." },
    bookings: { title: "Service Bookings", subtitle: "Manage your service appointments and bookings." },
    message: { title: "Messages", subtitle: "Chat directly with merchants and providers." },
  };

  const currentTabInfo = tabTitles[active] || tabTitles.orders;

  return (
    <DashboardShell role="buyer">
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <DashHeading title={currentTabInfo.title} subtitle={currentTabInfo.subtitle} />
          <button
            onClick={handleRefresh}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-4 rounded-md border border-border p-5">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-md ${s.tone}`}>
                <Package className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-semibold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search Bar ── */}
        <div className="mt-8 flex gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-border px-5 py-4">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product name, order ID or seller"
              aria-label="Search your orders"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            aria-label="Filter"
            onClick={() => toast("Filter applied")}
            className="grid w-16 shrink-0 place-items-center rounded-md bg-ink text-ink-foreground"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* ── Tab Content ── */}
        <div className="mt-8 space-y-6">
          {active === "orders" && (
            loadingOrders ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : filteredRealOrders.length > 0 ? (
              filteredRealOrders.map((order) => (
                <RealOrderCard key={order.id} order={order} />
              ))
            ) : (
              <EmptyState
                title="No orders found"
                body="Browse the marketplace and add items to your cart to place an order."
                to="/marketplace"
                cta="Go to marketplace"
              />
            )
          )}

          {active === "saved" && (
            saved.length ? (
              saved.map((item) => <SavedItemCard key={item.id} item={item} />)
            ) : (
              <EmptyState
                title="Nothing saved yet"
                body="Tap the heart on any product or service to save it for later."
                to="/marketplace"
                cta="Explore marketplace"
              />
            )
          )}

          {active === "applications" && (
            loadingApplications ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : applications.length > 0 ? (
              applications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onWithdraw={(id) => setApplications((prev) => prev.filter((a) => a.id !== id))}
                />
              ))
            ) : (
              <EmptyState
                title="No applications yet"
                body="Browse job listings and apply to roles you're interested in."
                to="/jobs"
                cta="Browse jobs"
              />
            )
          )}
          {active === "bookings" && (
            loadingBookings ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : bookings.length > 0 ? (
              bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancelled={(id) => setBookings((prev) => prev.filter((b) => b.id !== id))}
                />
              ))
            ) : (
              <EmptyState
                title="No bookings scheduled"
                body="Book a trusted service provider and your appointments will show up here."
                to="/services"
                cta="Find a service"
              />
            )
          )}
          {active === "message" && (
            <EmptyState
              title="Messages"
              body="Talk to sellers and providers directly from the message tab."
              to="/app/message"
              cta="Open messages"
            />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

// ─── Real Order Card Component ────────────────────────────────────────────────

export function StatusPillBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Received: "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    Processing: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    Shipped: "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    Delivered: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    Cancelled: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold ${styles[status] ?? "border-border text-muted-foreground"}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function RealOrderCard({ order }: { order: RealOrder }) {
  const navigate = useNavigate();
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="rounded-xl border border-border p-6 shadow-sm space-y-6">
      {/* Order Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Order ID</p>
          <p className="text-xl font-bold tracking-tight">{order.orderNumber}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground">Placed on {dateStr}</span>
          <StatusPillBadge status={order.status} />
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="grid gap-4 sm:grid-cols-[100px_minmax(0,1fr)_auto] items-center">
            <img
              src={item.image || "https://c2c2.s3.eu-north-1.amazonaws.com/products/placeholder.jpg"}
              alt={item.title}
              className="h-20 w-24 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <h3 className="text-base font-semibold truncate">{item.title}</h3>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Price: <b className="text-foreground">${item.price}</b></span>
                <span>Qty: <b className="text-foreground">{item.qty}</b></span>
                {item.selectedSize && <span>Size: <b className="text-foreground">{item.selectedSize}</b></span>}
                {item.selectedColour && (
                  <span className="flex items-center gap-1">
                    Colour:
                    <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: item.selectedColour }} />
                  </span>
                )}
              </div>
            </div>
            <p className="text-lg font-bold text-price">
              ${(item.price * item.qty).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Seller & Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border pt-4">
        <div className="flex items-center gap-3">
          <img
            src={order.seller?.avatar ?? "https://i.pravatar.cc/96?img=15"}
            alt={order.seller?.name ?? "Seller"}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-semibold">{order.seller?.name ?? "Seller"}</p>
            <a href={`tel:${order.seller?.phone || "0544324094"}`} className="flex items-center gap-1 text-xs text-price">
              <Phone className="h-3 w-3" /> {order.seller?.phone || "0544324094"}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              navigate({
                to: "/app/message",
                search: {
                  userId: order.seller?.id,
                  userName: order.seller?.name,
                  userAvatar: order.seller?.avatar,
                },
              })
            }
            className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-ink-foreground transition-opacity hover:opacity-90"
          >
            <MessageSquare className="h-3.5 w-3.5" /> Message Seller
          </button>
        </div>
      </div>
    </article>
  );
}

function SavedItemCard({ item }: { item: any }) {
  const { toggleWishlist } = useStore();

  const isService = item.kind === "service" || SERVICES.some((s) => s.id === item.id);
  const isJob = item.kind === "job" || JOBS.some((j) => j.id === item.id);

  const targetTo = isService ? "/services/$id" : isJob ? "/jobs/$id" : "/marketplace/$id";

  return (
    <article className="rounded-xl border border-border p-5 flex items-center justify-between gap-4 transition-shadow hover:shadow-card">
      <Link
        to={targetTo as any}
        params={{ id: item.id } as any}
        className="flex items-center gap-4 min-w-0 group flex-1"
      >
        <img
          src={item.image || "https://c2c2.s3.eu-north-1.amazonaws.com/products/placeholder.jpg"}
          alt={item.title}
          className="h-16 w-16 shrink-0 rounded-lg object-cover transition-transform group-hover:scale-105"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base truncate group-hover:underline group-hover:text-price">
            {item.title}
          </h3>
          <p className="text-sm font-semibold text-price mt-0.5">
            ${item.price}
            {item.location && (
              <span className="ml-2 font-normal text-xs text-muted-foreground">
                • {item.location}
              </span>
            )}
          </p>
        </div>
      </Link>
      <button
        onClick={() => toggleWishlist(item.id)}
        className="rounded-lg border border-border p-2.5 text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
        aria-label="Remove saved item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </article>
  );
}


function EmptyState({
  title,
  body,
  to,
  cta,
}: {
  title: string;
  body: string;
  to: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border py-20 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      <Link
        to={to}
        className="mt-6 inline-block rounded-md bg-ink px-6 py-3 text-sm font-medium text-ink-foreground"
      >
        {cta}
      </Link>
    </div>
  );
}
