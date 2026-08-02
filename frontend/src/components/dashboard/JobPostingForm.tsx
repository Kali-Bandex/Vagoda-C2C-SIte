import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Building2, FileText, Globe, Image, Loader2, Mail, MapPin,
  Plus, Tag, Trash2, X, Calendar, DollarSign, Briefcase, Monitor,
} from "lucide-react";
import { useJobStore, type LiveJob } from "@/lib/jobStore";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";

const JOB_CATEGORIES = ["Design", "Engineering", "Marketing", "Finance", "HR", "Sales", "Legal", "Medical", "Operations", "Education", "Other"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Internship"] as const;
const JOB_MODES = ["On-site", "Remote", "Hybrid"] as const;
const COLOR_PRESETS = ["#4F46E5", "#EF4444", "#F97316", "#EAB308", "#4ADE80", "#06B6D4", "#EC4899", "#8B5CF6"];

interface FormState {
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: string;
  mode: string;
  industry: string;
  category: string;
  salaryMin: string;
  salaryMax: string;
  salaryLabel: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  email: string;
  deadline: string;
  status: string;
  color: string;
}

export function JobPostingForm({ existing }: { existing?: Partial<LiveJob> }) {
  const { createJob, updateJob, uploadJobImage } = useJobStore();
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    title: existing?.title ?? "",
    company: existing?.company ?? "",
    companyLogo: existing?.companyLogo ?? "",
    location: existing?.location ?? "",
    type: existing?.type ?? "Full-time",
    mode: existing?.mode ?? "On-site",
    industry: existing?.industry ?? "",
    category: existing?.category ?? "Engineering",
    salaryMin: existing?.salaryMin ? String(existing.salaryMin) : "",
    salaryMax: existing?.salaryMax ? String(existing.salaryMax) : "",
    salaryLabel: existing?.salaryLabel ?? "",
    description: existing?.description ?? "",
    responsibilities: existing?.responsibilities ?? [""],
    skills: existing?.skills ?? [],
    email: existing?.email ?? "",
    deadline: existing?.deadline ? existing.deadline.slice(0, 10) : "",
    status: existing?.status ?? "Open",
    color: existing?.color ?? "#4F46E5",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const set = (key: keyof FormState, val: any) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ── Logo upload ──────────────────────────────────────────────────────────
  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadJobImage(file);
      set("companyLogo", url);
      toast.success("Logo uploaded!");
    } catch {
      toast.error("Logo upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ── Responsibilities ─────────────────────────────────────────────────────
  const addResponsibility = () =>
    set("responsibilities", [...form.responsibilities, ""]);

  const updateResponsibility = (idx: number, val: string) =>
    set(
      "responsibilities",
      form.responsibilities.map((r, i) => (i === idx ? val : r))
    );

  const removeResponsibility = (idx: number) =>
    set(
      "responsibilities",
      form.responsibilities.filter((_, i) => i !== idx)
    );

  // ── Skills ───────────────────────────────────────────────────────────────
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || form.skills.includes(trimmed)) return;
    set("skills", [...form.skills, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) =>
    set("skills", form.skills.filter((s) => s !== skill));

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Job title is required";
    if (!form.company.trim()) next.company = "Company name is required";
    if (!form.location.trim()) next.location = "Location is required";
    if (form.description.trim().length < 30)
      next.description = "Description should be at least 30 characters";
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      next.email = "Enter a valid contact email";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : 0,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : 0,
        responsibilities: form.responsibilities.filter((r) => r.trim()),
        deadline: form.deadline || null,
      };

      if (existing?.id) {
        await updateJob(existing.id, payload as any);
        toast.success("Job posting updated!");
      } else {
        await createJob(payload as any);
        toast.success("Job posted successfully!");
      }
      navigate({ to: "/app/listings" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save job posting");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10" noValidate>
      {/* ── Company Logo ── */}
      <section>
        <h2 className="text-lg font-semibold">Company Branding</h2>
        <div className="mt-4 flex items-center gap-5">
          <div
            onClick={() => logoInputRef.current?.click()}
            className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/30"
          >
            {form.companyLogo ? (
              <img src={form.companyLogo} alt="Logo" className="h-full w-full object-cover" />
            ) : uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Image className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {form.companyLogo ? "Change logo" : "Upload company logo"}
            </button>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
            {form.companyLogo && (
              <button
                type="button"
                onClick={() => set("companyLogo", "")}
                className="mt-1 text-xs text-destructive"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleLogoUpload(f);
            }}
          />
        </div>
      </section>

      {/* ── Basic Info ── */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Job Details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Job Title *"
            Icon={Briefcase}
            value={form.title}
            error={errors.title}
            placeholder="Senior Frontend Developer"
            onChange={(v) => set("title", v)}
          />
          <Field
            label="Company / Organisation *"
            Icon={Building2}
            value={form.company}
            error={errors.company}
            placeholder="Vagoda Technologies"
            onChange={(v) => set("company", v)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Location *</label>
            <span
              className={`mt-2 flex items-center gap-3 rounded-xl border px-4 py-3.5 ${
                errors.location ? "border-destructive" : "border-border"
              }`}
            >
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <PlacesAutocomplete
                value={form.location}
                onChange={(v) => set("location", v)}
                placeholder="Accra, Ghana"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </span>
            {errors.location && (
              <p className="mt-1 text-xs text-destructive">{errors.location}</p>
            )}
          </div>

          <Field
            label="Industry"
            Icon={Globe}
            value={form.industry}
            placeholder="Information Technology"
            onChange={(v) => set("industry", v)}
          />
        </div>

        <Field
          label="Contact Email *"
          Icon={Mail}
          type="email"
          value={form.email}
          error={errors.email}
          placeholder="jobs@yourcompany.com"
          onChange={(v) => set("email", v)}
        />
      </section>

      {/* ── Job Type & Mode ── */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Employment Type</h2>

        <div>
          <label className="text-sm font-medium">Job Type</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {JOB_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("type", t)}
                className={
                  form.type === t
                    ? "rounded-full border-2 border-brand bg-brand-soft px-4 py-2 text-sm font-medium text-price"
                    : "rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Work Mode</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {JOB_MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set("mode", m)}
                className={
                  form.mode === m
                    ? "rounded-full border-2 border-brand bg-brand-soft px-4 py-2 text-sm font-medium text-price"
                    : "rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Category / Department</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {JOB_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("category", c)}
                className={
                  form.category === c
                    ? "rounded-full border-2 border-brand bg-brand-soft px-4 py-2 text-sm font-medium text-price"
                    : "rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Salary & Deadline ── */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Compensation & Deadline</h2>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label="Min Salary ($/yr)"
            Icon={DollarSign}
            type="number"
            value={form.salaryMin}
            placeholder="50000"
            onChange={(v) => set("salaryMin", v)}
          />
          <Field
            label="Max Salary ($/yr)"
            Icon={DollarSign}
            type="number"
            value={form.salaryMax}
            placeholder="80000"
            onChange={(v) => set("salaryMax", v)}
          />
          <Field
            label="Salary Label (optional)"
            Icon={Tag}
            value={form.salaryLabel}
            placeholder="$50k–$80k/yr"
            onChange={(v) => set("salaryLabel", v)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Application Deadline</label>
            <span className="mt-2 flex items-center gap-3 rounded-xl border border-border px-4 py-3.5">
              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </span>
          </div>

          <div>
            <label className="text-sm font-medium">Posting Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none"
            >
              <option value="Open">Open — Accepting applications</option>
              <option value="Draft">Draft — Not visible publicly</option>
              <option value="Closed">Closed — No longer accepting</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Description ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Job Description *</h2>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={6}
          placeholder="Describe the role, team, and what a typical day looks like…"
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground ${
            errors.description ? "border-destructive" : "border-border"
          }`}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </section>

      {/* ── Responsibilities ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Responsibilities</h2>
          <button
            type="button"
            onClick={addResponsibility}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {form.responsibilities.map((r, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
              <input
                value={r}
                onChange={(e) => updateResponsibility(idx, e.target.value)}
                placeholder={`Responsibility ${idx + 1}`}
                className="min-w-0 flex-1 rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
              />
              <button
                type="button"
                onClick={() => removeResponsibility(idx)}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Skills ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Required Skills</h2>
        <div className="flex items-center gap-3">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="e.g. React, TypeScript, Figma…"
            className="min-w-0 flex-1 rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          />
          <button
            type="button"
            onClick={addSkill}
            className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        {form.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.skills.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── Brand Color ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Brand Color</h2>
        <div className="flex flex-wrap items-center gap-3">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("color", c)}
              style={{ backgroundColor: c }}
              className={`h-9 w-9 rounded-full transition-transform hover:scale-110 ${
                form.color === c ? "ring-4 ring-offset-2 ring-foreground" : ""
              }`}
            />
          ))}
          <input
            type="color"
            value={form.color}
            onChange={(e) => set("color", e.target.value)}
            className="h-9 w-9 cursor-pointer rounded-full border border-border bg-transparent"
          />
        </div>
        <div
          className="h-2 w-full max-w-xs rounded-full"
          style={{ backgroundColor: form.color }}
        />
      </section>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-4 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : existing?.id ? (
          "Save changes"
        ) : (
          "Publish job posting"
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  Icon,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
}: {
  label: string;
  Icon: typeof Briefcase;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <span
        className={`mt-2 flex items-center gap-3 rounded-xl border px-4 py-3.5 ${
          error ? "border-destructive" : "border-border"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </span>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
