import { Link } from "@tanstack/react-router";
import { Bookmark, Globe, LayoutGrid, Clock, Users } from "lucide-react";
import type { Job } from "@/lib/data";
import type { LiveJob } from "@/lib/jobStore";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

// Accept both static Job (data.ts) and live LiveJob (jobStore.ts)
type JobCardJob = (Job | LiveJob) & {
  id: string;
  title: string;
  company: string;
  location: string;
  posted?: string;
  color?: string;
  description?: string;
  type?: string;
  mode?: string;
  tag?: string;
  category?: string;
  salary?: string;
  studio?: string;
  applicantCount?: number;
  createdAt?: string;
};

export function JobCard({ job }: { job: JobCardJob }) {
  const { wishlist, toggleWishlist } = useStore();
  const isSaved = wishlist.includes(job.id);

  const postedLabel =
    job.posted ??
    (job.createdAt
      ? timeAgo(new Date(job.createdAt))
      : "Recently");

  const tagLabel = job.tag ?? job.category ?? "";
  const applicantCount = (job as LiveJob).applicantCount ?? 0;

  return (
    <article className="rounded-xl border border-border p-4 transition-shadow hover:shadow-card">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {(job as LiveJob).companyLogo ? (
            <img
              src={(job as LiveJob).companyLogo}
              alt={job.company}
              className="h-10 w-10 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span
              className="h-10 w-10 shrink-0 rounded-md"
              style={{ backgroundColor: job.color ?? "#4F46E5" }}
              aria-hidden
            />
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
              {job.company}
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {job.studio ?? `${job.company} • ${job.location}`}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />• {postedLabel}
        </span>
      </div>

      <Link
        to="/jobs/$id"
        params={{ id: job.id }}
        className="mt-4 block text-lg font-semibold hover:underline"
      >
        {job.title}
      </Link>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {job.description ?? ""}
      </p>

      <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{job.type ?? "Full-time"}</span>
        <span className="text-muted-foreground/50">•</span>
        <span>{job.mode ?? "On-site"}</span>
        {tagLabel && (
          <>
            <span className="text-muted-foreground/50">•</span>
            <span>{tagLabel}</span>
          </>
        )}
      </p>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex items-center gap-3">
          {/* Applicant avatars (decorative) */}
          <div className="flex -space-x-2">
            {[21, 32, 45].map((n) => (
              <img
                key={n}
                src={`https://i.pravatar.cc/48?img=${n}`}
                alt=""
                loading="lazy"
                className="h-7 w-7 rounded-full object-cover ring-2 ring-background"
              />
            ))}
          </div>
          {applicantCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {applicantCount}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label={isSaved ? "Unsave job" : "Save job"}
            onClick={() => {
              toggleWishlist(job.id);
              toast.success(isSaved ? "Removed from saved" : "Job saved to your dashboard");
            }}
            className={`grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-muted ${
              isSaved ? "text-price" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
          </button>
          <Link
            to="/jobs/$id"
            params={{ id: job.id }}
            aria-label="View job details"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}
