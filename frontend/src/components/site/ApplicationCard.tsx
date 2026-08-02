import { Link, useNavigate } from "@tanstack/react-router";
import { MapPin, Briefcase, Phone, Clock, CheckCircle2, XCircle, Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useState } from "react";

const STATUS_STYLES: Record<string, string> = {
  Submitted: "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  "Under Review": "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  Shortlisted: "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  Hired: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Rejected: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export interface ApplicationData {
  id: string;
  applicationNumber: string;
  status: string;
  name: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  resumeUrl?: string;
  createdAt: string;
  jobId?: string;
  job?: {
    id: string;
    title: string;
    company: string;
    companyLogo?: string;
    location: string;
    type: string;
    salary?: string;
    deadline?: string | null;
    status: string;
    color?: string;
  } | null;
}

export function ApplicationCard({
  application,
  onWithdraw,
}: {
  application: ApplicationData;
  onWithdraw?: (id: string) => void;
}) {
  const [withdrawing, setWithdrawing] = useState(false);
  const job = application.job;
  const appliedDate = new Date(application.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleWithdraw = async () => {
    if (!confirm("Withdraw this application?")) return;
    setWithdrawing(true);
    try {
      await api.delete(`/applications/${application.id}`);
      toast.success("Application withdrawn");
      onWithdraw?.(application.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to withdraw application");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <article className="rounded-2xl border border-border p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Application ID</p>
          <p className="text-xl font-bold tracking-tight">{application.applicationNumber}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground">Applied on {appliedDate}</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[application.status] ?? "border-border text-muted-foreground"}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {application.status}
          </span>
        </div>
      </div>

      {/* Job info */}
      {job && (
        <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          {/* Company logo / color dot */}
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="h-16 w-16 rounded-2xl object-cover"
            />
          ) : (
            <span
              className="h-16 w-16 rounded-2xl"
              style={{ backgroundColor: job.color ?? "#4F46E5", opacity: 0.8 }}
            />
          )}

          <div className="min-w-0">
            <Link
              to="/jobs/$id"
              params={{ id: job.id }}
              className="text-xl font-semibold hover:underline"
            >
              {job.title}
            </Link>
            <p className="mt-0.5 text-sm text-muted-foreground">{job.company}</p>
            {job.salary && (
              <p className="mt-1 text-sm font-semibold text-price">{job.salary}</p>
            )}
            <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> {job.type}
              </span>
              {job.deadline && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Expires {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </p>
            {job.status === "Closed" && (
              <span className="mt-2 inline-block rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                Position Closed
              </span>
            )}
          </div>

          {/* Status icon */}
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
            application.status === "Hired"
              ? "bg-brand-soft text-price"
              : application.status === "Rejected"
              ? "bg-[oklch(0.95_0.04_20)] text-destructive"
              : "bg-muted text-muted-foreground"
          }`}>
            {application.status === "Hired" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : application.status === "Rejected" ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <Briefcase className="h-5 w-5" />
            )}
          </span>
        </div>
      )}

      {/* Actions footer */}
      <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-border pt-4">
        {application.resumeUrl && (
          <a
            href={application.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-medium hover:bg-muted"
          >
            <FileDown className="h-3.5 w-3.5" /> View CV
          </a>
        )}
        {job && (
          <Link
            to="/jobs/$id"
            params={{ id: job.id }}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-medium hover:bg-muted"
          >
            View Job
          </Link>
        )}
        {!["Hired", "Rejected"].includes(application.status) && (
          <button
            onClick={handleWithdraw}
            disabled={withdrawing}
            className="ml-auto flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {withdrawing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Withdraw Application
          </button>
        )}
      </div>
    </article>
  );
}
