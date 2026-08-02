import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Eye, Pencil, Plus, Trash2, Users, Briefcase, Clock,
  CheckCircle2, CircleDot, Archive,
} from "lucide-react";
import { useAuth, ROLE_META } from "@/lib/auth";
import { useListings } from "@/lib/listings";
import { useJobStore } from "@/lib/jobStore";
import { useServiceStore } from "@/lib/serviceStore";
import { DashHeading } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/app/listings/")({
  ssr: false,
  component: ListingsPage,
});

const STATUS_COLORS: Record<string, string> = {
  Open: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Closed: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  Draft: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

function ListingsPage() {
  const { session } = useAuth();
  const role = session?.role ?? "product";
  const meta = ROLE_META[role] || ROLE_META.product;
  const isJob = role === "job";
  const isService = role === "service";
  const { items, ready, remove } = useListings(role);
  const { recruiterJobs, updateJob } = useJobStore();
  const { providerServices, updateService } = useServiceStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = items.filter((i) => i.title.toLowerCase().includes(q.toLowerCase()));

  const handleDelete = async (id: string, title: string) => {
    setDeletingId(id);
    try {
      await remove(id);
      toast.success(`${meta.listing} deleted`);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Open" ? "Closed" : "Open";
    try {
      await updateJob(id, { status: newStatus as any });
      toast.success(`Job marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <DashHeading
          title={isJob ? "Job Postings" : isService ? "Services" : `${meta.listing} Listings`}
          subtitle={
            isJob
              ? "Manage your active job postings and track applicants."
              : isService
              ? "Manage your service offerings, pricing, and availability."
              : "Here's how your store is performing today."
          }
        />
        <Link
          to="/app/listings/new"
          className="flex items-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-medium text-ink-foreground"
        >
          <Plus className="h-4 w-4" /> {isJob ? "Post New Job" : isService ? "Post New Service" : `New ${meta.listing.toLowerCase()}`}
        </Link>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={isJob ? "Search your job postings…" : `Search your ${meta.listings.toLowerCase()}`}
        aria-label={`Search ${meta.listings}`}
        className="w-full rounded-xl border border-border px-5 py-3.5 text-sm outline-none placeholder:text-muted-foreground sm:max-w-[420px]"
      />

      {/* ── Summary Stats (job / service role) ── */}
      {isJob && ready && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Jobs",
              value: recruiterJobs.length,
              tone: "bg-[oklch(0.95_0.05_50)] text-[oklch(0.6_0.19_40)]",
              Icon: Briefcase,
            },
            {
              label: "Open Positions",
              value: recruiterJobs.filter((j) => j.status === "Open").length,
              tone: "bg-brand-soft text-price",
              Icon: CheckCircle2,
            },
            {
              label: "Total Applicants",
              value: recruiterJobs.reduce((s, j) => s + (j.applicantCount || 0), 0),
              tone: "bg-[oklch(0.94_0.04_285)] text-[oklch(0.5_0.18_285)]",
              Icon: Users,
            },
          ].map(({ label, value, tone, Icon }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-border p-5">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-3xl font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isService && ready && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Services Listed",
              value: providerServices.length,
              tone: "bg-[oklch(0.95_0.05_50)] text-[oklch(0.6_0.19_40)]",
              Icon: Briefcase,
            },
            {
              label: "Active Services",
              value: providerServices.filter((s) => s.status === "Active").length,
              tone: "bg-brand-soft text-price",
              Icon: CheckCircle2,
            },
            {
              label: "Total Bookings",
              value: providerServices.reduce((sum, s) => sum + (s.bookingsCount || 0), 0),
              tone: "bg-[oklch(0.94_0.04_285)] text-[oklch(0.5_0.18_285)]",
              Icon: Users,
            },
          ].map(({ label, value, tone, Icon }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-border p-5">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-3xl font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!ready ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="font-semibold">No {meta.listings.toLowerCase()} yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isJob
              ? "Post your first job to start receiving applications."
              : `Create your first ${meta.listing.toLowerCase()} to start receiving ${meta.activity.toLowerCase()}.`}
          </p>
          <Link
            to="/app/listings/new"
            className="mt-6 inline-block rounded-xl bg-ink px-6 py-3 text-sm font-medium text-ink-foreground"
          >
            {isJob ? "Post a Job" : `Create ${meta.listing.toLowerCase()}`}
          </Link>
        </div>
      ) : isJob ? (
        /* ── Job role: table-style cards ── */
        <div className="space-y-4">
          {filtered.map((item) => {
            const liveJob = recruiterJobs.find((j) => j.id === item.id);
            const status = liveJob?.status ?? "Open";
            return (
              <article
                key={item.id}
                className="grid gap-4 rounded-2xl border border-border p-5 shadow-sm md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
              >
                {/* Color dot / logo */}
                <div
                  className="h-14 w-14 shrink-0 rounded-xl bg-muted"
                  style={{ backgroundColor: liveJob?.color ?? "#4F46E5", opacity: 0.8 }}
                />

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? ""}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.location} · {liveJob?.type ?? "Full-time"}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {liveJob?.applicantCount ?? 0} applicants
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {liveJob?.views ?? 0} views
                    </span>
                    {liveJob?.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Deadline: {new Date(liveJob.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    title={status === "Open" ? "Close job" : "Reopen job"}
                    onClick={() => handleToggleStatus(item.id, status)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted"
                  >
                    {status === "Open" ? <Archive className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
                  </button>
                  <button
                    aria-label={`Edit ${item.title}`}
                    onClick={() => navigate({ to: "/app/listings/$id/edit", params: { id: item.id } })}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label={`Delete ${item.title}`}
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id, item.title)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-border text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link
                    to="/jobs/$id"
                    params={{ id: item.id }}
                    aria-label="View job publicly"
                    className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-ink-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* ── Product / Service role: original grid ── */
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article key={item.id}>
              <div className="relative overflow-hidden rounded-xl">
                <img src={item.image} alt={item.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold leading-snug">{item.title}</h3>
                <p className="shrink-0 text-lg font-semibold text-price">${item.price}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.location}</p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  aria-label={`Edit ${item.title}`}
                  onClick={() => navigate({ to: "/app/listings/$id/edit", params: { id: item.id } })}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  aria-label={`Delete ${item.title}`}
                  onClick={() => { remove(item.id); toast.success(`${meta.listing} deleted`); }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
