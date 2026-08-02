import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  MapPin, Clock, Bookmark, UserPlus, Briefcase, Building2, Mail,
  Users, Globe, CheckCircle2, Loader2, FileUp, X, Phone,
  Flame, Check, ArrowRight, LayoutGrid
} from "lucide-react";
import { useJobStore, type LiveJob } from "@/lib/jobStore";
import { JobCard } from "@/components/site/JobCard";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/jobs/$id")({
  component: JobDetail,
  head: () => ({
    meta: [
      { title: "Job Detail — Vagoda Jobs" },
      { name: "description", content: "Browse job opportunities on Vagoda." },
    ],
  }),
});

function JobDetail() {
  const { id } = Route.useParams();
  const { fetchJobById, fetchJobs, jobs } = useJobStore();
  const [job, setJob] = useState<LiveJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const { wishlist, toggleWishlist } = useStore();
  const { session } = useAuth();
  const isSaved = wishlist.includes(id);

  useEffect(() => {
    setLoading(true);
    fetchJobById(id).then((j) => {
      setJob(j);
      setLoading(false);
    });
    fetchJobs({ limit: 4 });
    if (session) {
      api.get(`/applications/check/${id}`)
        .then((res) => setAlreadyApplied(res.data.applied ?? false))
        .catch(() => {});
    }
  }, [id, session?.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-6 px-5 py-16">
        <div className="h-64 w-full animate-pulse rounded-3xl bg-muted" />
        <div className="h-96 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-20 text-center">
        <h2 className="text-2xl font-bold">Job Not Found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This job posting has been removed or no longer exists.
        </p>
        <Link to="/jobs" className="mt-6 inline-block rounded-xl bg-ink px-6 py-3 text-sm font-medium text-ink-foreground">
          Browse all jobs
        </Link>
      </div>
    );
  }

  const similar = jobs.filter((j) => j.id !== id).slice(0, 3);
  const postedTime = job.createdAt ? timeAgo(new Date(job.createdAt)) : "13 hours ago";

  return (
    <div className="bg-background pb-24">
      {/* Top Banner Gradient */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-amber-600 md:h-64">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
        {/* Overlapping Company Avatar */}
        <div className="relative flex items-end justify-between">
          <div className="relative -mt-16 md:-mt-20">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="h-28 w-28 rounded-full border-4 border-background bg-card object-cover shadow-xl md:h-36 md:w-36"
              />
            ) : (
              <div
                className="grid h-28 w-28 place-items-center rounded-full border-4 border-background text-3xl font-bold text-white shadow-xl md:h-36 md:w-36"
                style={{ backgroundColor: job.color || "#4F46E5" }}
              >
                {job.company[0]}
              </div>
            )}
          </div>
        </div>

        {/* Title + Company + Header Actions */}
        <div className="mt-6 flex flex-col justify-between gap-6 border-b border-border/60 pb-8 md:flex-row md:items-start">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {job.title}
            </h1>
            <p className="mt-1.5 text-lg font-medium text-muted-foreground">
              {job.company}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 font-normal">
                <MapPin className="h-4 w-4" /> {job.location || "Cape Coast, Ghana"}
              </span>
              <span className="flex items-center gap-1.5 font-normal">
                <Clock className="h-4 w-4" /> {postedTime}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => {
                toggleWishlist(id);
                toast.success(isSaved ? "Removed from saved" : "Job saved to your dashboard");
              }}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors border ${
                isSaved
                  ? "bg-brand-soft border-brand/40 text-price"
                  : "bg-muted/70 border-border text-foreground hover:bg-muted"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved" : "Save"}
            </button>
            <ApplyDialog
              job={job}
              alreadyApplied={alreadyApplied}
              onApplied={() => setAlreadyApplied(true)}
            />
          </div>
        </div>

        {/* Main Content & Sidebar Grid */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left Column: Job Details */}
          <div className="space-y-10">
            {/* About the job */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">About the job</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground/90">
                {job.description || "Microsoft is an equal opportunity employer. All qualified applicants will receive consideration for employment without regard to race, color, religion, sex, sexual orientation, gender identity, national origin, protected veteran status, or disability status."}
              </p>
            </div>

            {/* Responsibilities */}
            <div>
              <h3 className="text-xl font-bold text-foreground">Responsibilities:</h3>
              <ul className="mt-4 space-y-3">
                {(job.responsibilities && job.responsibilities.length > 0
                  ? job.responsibilities
                  : [
                      "Lead end-to-end design processes for high-impact features from initial wireframe to high-fidelity prototypes.",
                      "Maintain and evolve design systems, ensuring consistency across web and mobile platforms.",
                      "Conduct user research and usability testing to validate design decisions and identify pain points.",
                      "Monitor product analytics and metrics to align design choices with business goals.",
                    ]
                ).map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground/90">
                    <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Required Skills */}
            <div>
              <h3 className="text-xl font-bold text-foreground">Skills:</h3>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {(job.skills && job.skills.length > 0
                  ? job.skills
                  : ["HTML", "Figma", "React", "Node.js", "TypeScript"]
                ).map((skill, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm"
                  >
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Salary & Key Info Card */}
          <aside className="rounded-2xl border border-border bg-card p-6 shadow-sm self-start">
            <div className="border-b border-border/60 pb-6">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {job.salaryLabel || job.salary || (job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : "$135,700")}
              </span>
              <p className="mt-1 text-xs text-muted-foreground font-normal">Avg. salary</p>
            </div>

            <dl className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-muted/40 text-foreground">
                  <Briefcase className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-sm font-bold text-foreground">{job.industry || "Software and hardware"}</dt>
                  <dd className="text-xs text-muted-foreground">Industry</dd>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-muted/40 text-foreground">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-sm font-bold text-foreground">{job.type || "Full-time"}</dt>
                  <dd className="text-xs text-muted-foreground">Employment Type</dd>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-muted/40 text-foreground">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-sm font-bold text-foreground">{job.category || "Information Technology"}</dt>
                  <dd className="text-xs text-muted-foreground">Job Functions</dd>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-muted/40 text-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <dt className="truncate text-sm font-bold text-foreground">{job.email || `jobs@${(job.company || "company").toLowerCase().replace(/\s+/g, "")}.com`}</dt>
                  <dd className="text-xs text-muted-foreground">Contact Email</dd>
                </div>
              </div>
            </dl>

            <div className="mt-6 border-t border-border/60 pt-6">
              <p className="text-xs leading-relaxed text-muted-foreground/80">
                {job.company} is an equal opportunity employer. All qualified applicants will receive consideration for employment without regard to race, color, religion, sex, sexual orientation, gender identity, national origin, protected veteran status, or disability status.
              </p>
            </div>
          </aside>
        </div>

        {/* Middle Section: About the Company & Latest jobs */}
        <div className="mt-16 border-t border-border/60 pt-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* About the Company */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">About the Company</h2>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5">
                <div className="flex items-center gap-4">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} alt={job.company} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft font-bold text-brand">
                      {job.company[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-foreground text-base">{job.company}</h4>
                    <p className="text-xs text-muted-foreground">400,752 followers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsFollowing(!isFollowing);
                    toast.success(isFollowing ? `Unfollowed ${job.company}` : `Following ${job.company}`);
                  }}
                  className={`rounded-xl px-5 py-2.5 text-xs font-semibold transition-colors ${
                    isFollowing
                      ? "border border-border bg-muted text-foreground"
                      : "bg-ink text-ink-foreground hover:opacity-90"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {job.company} serves all equal opportunity employees. All qualified applicants will receive consideration for employment without regard to race, color, or gender identity.
              </p>

              {/* Latest Activity */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-foreground">Latest activity</h3>
                <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-foreground font-bold text-xs">
                      {job.company[0]}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{job.company} Inc.</span>
                  </div>
                  <div className="mt-4 grid items-center gap-4 sm:grid-cols-[140px_1fr]">
                    <img
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80"
                      alt="Company event"
                      className="h-24 w-full rounded-xl object-cover"
                    />
                    <div>
                      <h5 className="font-bold text-sm text-foreground">How do I cancel my reservation for a stay?</h5>
                      <p className="mt-1 text-xs text-muted-foreground">You can cancel a reservation any time before or during your trip.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Latest jobs from recruiter */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Latest jobs</h2>
                <span className="text-xs text-muted-foreground font-normal">900 jobs</span>
              </div>

              <div className="mt-6 space-y-3">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-foreground/30 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                        <LayoutGrid className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Crisis Intervention Specialist</h4>
                        <p className="text-xs text-muted-foreground">{job.company} • London</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Jobs */}
        {similar.length > 0 && (
          <section className="mt-20 border-t border-border/60 pt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Similar Jobs</h2>
              <Link
                to="/jobs"
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                View More <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <JobCard key={s.id} job={s as any} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ─── Apply Dialog ────────────────────────────────────────────────────────────

function ApplyDialog({
  job,
  alreadyApplied,
  onApplied,
}: {
  job: LiveJob;
  alreadyApplied: boolean;
  onApplied: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);

  const [form, setForm] = useState({
    name: session?.name ?? "",
    email: session?.email ?? "",
    phone: session?.phone ?? "",
    coverLetter: "",
  });

  useEffect(() => {
    if (session) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || session.name || "",
        email: prev.email || session.email || "",
        phone: prev.phone || session.phone || "",
      }));
    }
  }, [session?.id]);

  const handleResumeUpload = async (file: File) => {
    setUploadingResume(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/applications/upload-resume", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResumeUrl(res.data.url);
      toast.success("CV uploaded!");
    } catch {
      toast.error("CV upload failed");
    } finally {
      setUploadingResume(false);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Full name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (form.coverLetter.trim().length < 20) next.coverLetter = "Cover letter must be at least 20 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please sign in to apply");
      navigate({ to: "/auth" });
      return;
    }
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post("/applications", {
        jobId: job.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        coverLetter: form.coverLetter,
        resumeUrl,
      });
      setOpen(false);
      onApplied();
      toast.success("Application sent — track it in your dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Application failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (job.status !== "Open") {
    return (
      <button disabled className="flex items-center gap-2 rounded-xl bg-muted px-7 py-3 text-sm font-semibold text-muted-foreground opacity-60">
        <UserPlus className="h-4 w-4" /> Closed
      </button>
    );
  }

  if (alreadyApplied) {
    return (
      <button disabled className="flex items-center gap-2 rounded-xl bg-brand-soft px-7 py-3 text-sm font-semibold text-price">
        <CheckCircle2 className="h-4 w-4" /> Applied
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl bg-ink px-8 py-3 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-90">
          <UserPlus className="h-4 w-4" /> Apply
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{job.company} · {job.location}</p>
        </DialogHeader>

        <form onSubmit={submit} className="mt-2 space-y-4" noValidate>
          <ApplyField label="Full name *" name="name" value={form.name} error={errors.name}
            onChange={(v) => setForm({ ...form, name: v })} />
          <ApplyField label="Email *" name="email" type="email" value={form.email} error={errors.email}
            onChange={(v) => setForm({ ...form, email: v })} />
          <ApplyField label="Phone number" name="phone" type="tel" value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })} />

          <div>
            <label htmlFor="coverLetter" className="text-sm font-medium">
              Cover Letter *
            </label>
            <textarea
              id="coverLetter"
              rows={5}
              value={form.coverLetter}
              onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
              placeholder="Tell us why you're a great fit for this role…"
              className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-foreground ${
                errors.coverLetter ? "border-destructive" : "border-border"
              }`}
            />
            {errors.coverLetter && <p className="mt-1 text-xs text-destructive">{errors.coverLetter}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">CV / Resume (optional)</label>
            <div className="mt-1.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-muted"
              >
                {uploadingResume ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4" />
                )}
                {resumeUrl ? "Change CV" : "Upload CV"}
              </button>
              {resumeUrl && (
                <span className="flex items-center gap-1 text-xs text-price">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                  <button type="button" onClick={() => setResumeUrl("")}>
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOC up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleResumeUpload(f);
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || uploadingResume}
            className="w-full rounded-xl bg-ink py-3.5 text-sm font-medium text-ink-foreground disabled:opacity-60"
          >
            {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</span> : "Submit Application"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApplyField({
  label, name, value, onChange, error, type = "text",
}: {
  label: string; name: string; value: string;
  onChange: (v: string) => void; error?: string; type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <input
        id={name} name={name} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-foreground ${
          error ? "border-destructive" : "border-border"
        }`}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 3600) return `${Math.floor(sec / 60)} minutes ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}
