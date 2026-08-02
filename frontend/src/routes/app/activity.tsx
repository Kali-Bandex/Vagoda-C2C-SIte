import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Loader2, Phone, MessageSquare, Mail, FileDown, ChevronDown } from "lucide-react";
import { useAuth, ROLE_META } from "@/lib/auth";
import { DashHeading } from "@/components/dashboard/DashboardShell";
import { StatusPillBadge } from "@/routes/dashboard";
import { api } from "@/lib/api";

export const Route = createFileRoute("/app/activity")({
  ssr: false,
  component: ActivityPage,
});

// ─── Shared types ────────────────────────────────────────────────────────────

interface SellerOrder {
  id: string;
  orderNumber: string;
  status: "Received" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  totalAmount: number;
  createdAt: string;
  items: Array<{ title: string; price: number; qty: number; image?: string }>;
  buyer?: { id?: string; name: string; avatar?: string; email?: string; phone?: string };
}

interface RecruiterApplication {
  id: string;
  applicationNumber: string;
  status: "Submitted" | "Under Review" | "Shortlisted" | "Rejected" | "Hired";
  name: string;
  email: string;
  phone: string;
  coverLetter: string;
  resumeUrl: string;
  createdAt: string;
  job?: { id: string; title: string; company: string; location: string; type: string };
  applicant?: { id: string; name: string; avatar?: string; email: string; phone?: string };
}

// ─── Status styles ───────────────────────────────────────────────────────────

const APP_STATUS_STYLES: Record<string, string> = {
  Submitted: "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  "Under Review": "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  Shortlisted: "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  Hired: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Rejected: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

const ORDER_STATUS_OPTIONS = ["Received", "Processing", "Shipped", "Delivered", "Cancelled"];
const APP_STATUS_OPTIONS = ["Submitted", "Under Review", "Shortlisted", "Hired", "Rejected"];
const BOOKING_STATUS_OPTIONS = ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"];

const BOOKING_STATUS_STYLES: Record<string, string> = {
  Pending: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  Confirmed: "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  "In Progress": "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  Completed: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Cancelled: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

// ─── Main component ───────────────────────────────────────────────────────────

function ActivityPage() {
  const { session } = useAuth();
  const role = session?.role ?? "product";
  const meta = ROLE_META[role] || ROLE_META.product;
  const isJob = role === "job";
  const isService = role === "service";
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  return (
    <div className="space-y-8">
      <DashHeading
        title={isJob ? "Applications" : isService ? "Service Bookings" : meta.activity}
        subtitle={
          isJob
            ? "Review and manage applications submitted for your job postings."
            : isService
            ? "Review and manage incoming booking requests from clients."
            : "Manage incoming orders and update delivery status for buyers."
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border px-5 py-3.5 sm:max-w-[420px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={`Search ${isJob ? "applications" : isService ? "bookings" : meta.activity}`}
            placeholder={
              isJob
                ? "Search by applicant or job title…"
                : isService
                ? "Search by customer, service or booking #"
                : "Search by buyer, product or order #"
            }
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {(isJob || isService) && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
          >
            <option value="All">All statuses</option>
            {(isJob ? APP_STATUS_OPTIONS : BOOKING_STATUS_OPTIONS).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {isJob ? (
        <ApplicationsTab q={q} statusFilter={statusFilter} />
      ) : isService ? (
        <ProviderBookingsTab q={q} statusFilter={statusFilter} />
      ) : (
        <OrdersTab q={q} meta={meta} />
      )}
    </div>
  );
}

// ─── Applications Tab (job role) ──────────────────────────────────────────────

function ApplicationsTab({ q, statusFilter }: { q: string; statusFilter: string }) {
  const [apps, setApps] = useState<RecruiterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchApps = async () => {
    try {
      const params = statusFilter !== "All" ? `?status=${statusFilter}` : "";
      const res = await api.get(`/applications/recruiter${params}`);
      setApps(res.data.applications || []);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [statusFilter]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    setUpdatingId(appId);
    try {
      await api.patch(`/applications/${appId}/status`, { status: newStatus });
      setApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus as any } : a))
      );
      toast.success(`Application updated to "${newStatus}"`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = apps.filter(
    (a) =>
      a.name?.toLowerCase().includes(q.toLowerCase()) ||
      a.email?.toLowerCase().includes(q.toLowerCase()) ||
      (a.job?.title || "").toLowerCase().includes(q.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="font-semibold">No applications yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          When candidates apply for your job postings, they will appear here.
        </p>
        <Link to="/app/listings" className="mt-6 inline-block rounded-xl bg-ink px-6 py-3 text-sm font-medium text-ink-foreground">
          View my job postings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((app) => {
        const avatar =
          app.applicant?.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=random`;
        const isExpanded = expanded === app.id;

        return (
          <article
            key={app.id}
            className="rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            {/* Main row */}
            <div className="grid gap-4 p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
              <img
                src={avatar}
                alt={app.name}
                loading="lazy"
                className="h-14 w-14 rounded-full object-cover"
              />

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold">{app.name}</p>
                  <span className="text-xs font-mono text-muted-foreground">{app.applicationNumber}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${APP_STATUS_STYLES[app.status] ?? ""}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {app.status}
                  </span>
                </div>

                {app.job && (
                  <p className="truncate text-sm text-muted-foreground">
                    Applied for:{" "}
                    <Link to="/jobs/$id" params={{ id: app.job.id }} className="font-medium text-foreground hover:underline">
                      {app.job.title}
                    </Link>
                    {" "}· {app.job.location}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <a href={`mailto:${app.email}`} className="flex items-center gap-1 text-price">
                    <Mail className="h-3 w-3" /> {app.email}
                  </a>
                  {app.phone && (
                    <a href={`tel:${app.phone}`} className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {app.phone}
                    </a>
                  )}
                  <span className="text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {app.resumeUrl && (
                  <a
                    href={app.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download CV"
                    className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
                  >
                    <FileDown className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => setExpanded(isExpanded ? null : app.id)}
                  title="View cover letter"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {/* Status dropdown */}
                <div className="relative">
                  <select
                    value={app.status}
                    disabled={updatingId === app.id}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground outline-none transition-colors hover:border-foreground/40 disabled:opacity-50"
                  >
                    {APP_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>Set: {st}</option>
                    ))}
                  </select>
                  {updatingId === app.id && (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded cover letter */}
            {isExpanded && app.coverLetter && (
              <div className="border-t border-border/60 bg-muted/30 px-5 py-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cover Letter</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {app.coverLetter}
                </p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

// ─── Orders Tab (product/service role) ───────────────────────────────────────

function OrdersTab({ q, meta }: { q: string; meta: any }) {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/orders/seller")
      .then((res) => setOrders(res.data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      );
      toast.success(`Order updated to "${newStatus}"`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(q.toLowerCase()) ||
      o.buyer?.name.toLowerCase().includes(q.toLowerCase()) ||
      o.items.some((i) => i.title.toLowerCase().includes(q.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="font-semibold">No orders received yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          When buyers order your products, they will appear here for you to process.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((order) => (
        <article
          key={order.id}
          className="grid gap-4 rounded-2xl border border-border p-6 shadow-sm md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
        >
          <img
            src={order.buyer?.avatar ?? "https://i.pravatar.cc/80?img=12"}
            alt={order.buyer?.name ?? "Buyer"}
            loading="lazy"
            className="h-14 w-14 rounded-full object-cover"
          />

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold">{order.buyer?.name ?? "Customer"}</p>
              <span className="text-xs font-mono text-muted-foreground">{order.orderNumber}</span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {order.items.map((i) => `${i.title} (${i.qty})`).join(", ")}
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-price">${order.totalAmount.toFixed(2)}</span>
              <span className="text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              {order.buyer?.phone && (
                <a href={`tel:${order.buyer.phone}`} className="flex items-center gap-1 text-price">
                  <Phone className="h-3 w-3" /> {order.buyer.phone}
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-self-end">
            <StatusPillBadge status={order.status} />
            <div className="relative">
              <select
                value={order.status}
                disabled={updatingId === order.id}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none disabled:opacity-50"
              >
                {ORDER_STATUS_OPTIONS.map((st) => <option key={st} value={st}>Set: {st}</option>)}
              </select>
              {updatingId === order.id && (
                <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

// ─── Provider Bookings Tab (service role) ────────────────────────────────────

interface ProviderBooking {
  id: string;
  bookingNumber: string;
  status: "Pending" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceDate: string;
  serviceTime?: string;
  serviceAddress: string;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  service?: { id: string; title: string; category: string; price: number; location: string; image: string };
  customer?: { id: string; name: string; avatar?: string; email: string; phone?: string };
}

function ProviderBookingsTab({ q, statusFilter }: { q: string; statusFilter: string }) {
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const params = statusFilter !== "All" ? `?status=${statusFilter}` : "";
      const res = await api.get(`/bookings/provider${params}`);
      setBookings(res.data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as any } : b))
      );
      toast.success(`Booking updated to "${newStatus}"`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = bookings.filter(
    (b) =>
      b.customerName?.toLowerCase().includes(q.toLowerCase()) ||
      b.customerEmail?.toLowerCase().includes(q.toLowerCase()) ||
      b.bookingNumber?.toLowerCase().includes(q.toLowerCase()) ||
      (b.service?.title || "").toLowerCase().includes(q.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="font-semibold">No service bookings yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          When clients book your services, their booking requests will appear here.
        </p>
        <Link to="/app/listings" className="mt-6 inline-block rounded-xl bg-ink px-6 py-3 text-sm font-medium text-ink-foreground">
          View my services
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((b) => {
        const avatar =
          b.customer?.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(b.customerName)}&background=random`;

        return (
          <article
            key={b.id}
            className="rounded-2xl border border-border shadow-sm overflow-hidden p-5"
          >
            <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
              <img
                src={avatar}
                alt={b.customerName}
                loading="lazy"
                className="h-14 w-14 rounded-full object-cover"
              />

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold">{b.customerName}</p>
                  <span className="text-xs font-mono text-muted-foreground">{b.bookingNumber}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${BOOKING_STATUS_STYLES[b.status] ?? ""}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {b.status}
                  </span>
                </div>

                {b.service && (
                  <p className="truncate text-sm text-muted-foreground">
                    Service:{" "}
                    <Link to="/services/$id" params={{ id: b.service.id }} className="font-medium text-foreground hover:underline">
                      {b.service.title}
                    </Link>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="font-semibold text-price">${b.totalAmount}</span>
                  <span>Date: {new Date(b.serviceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  {b.serviceTime && <span>Time: {b.serviceTime}</span>}
                  <a href={`tel:${b.customerPhone}`} className="flex items-center gap-1 text-price">
                    <Phone className="h-3 w-3" /> {b.customerPhone}
                  </a>
                  <a href={`mailto:${b.customerEmail}`} className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" /> {b.customerEmail}
                  </a>
                </div>

                <p className="text-xs text-muted-foreground">Address: {b.serviceAddress}</p>
                {b.notes && <p className="text-xs italic text-muted-foreground">" {b.notes} "</p>}
              </div>

              {/* Status Change Dropdown */}
              <div className="flex flex-wrap items-center gap-3 md:justify-self-end">
                <div className="relative">
                  <select
                    value={b.status}
                    disabled={updatingId === b.id}
                    onChange={(e) => handleStatusChange(b.id, e.target.value)}
                    className="cursor-pointer rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground outline-none transition-colors hover:border-foreground/40 disabled:opacity-50"
                  >
                    {BOOKING_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>Set: {st}</option>
                    ))}
                  </select>
                  {updatingId === b.id && (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
