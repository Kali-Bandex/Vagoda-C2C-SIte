import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Wrench, Image, Loader2, MapPin, Plus, Trash2, X, DollarSign, Tag, FileText,
} from "lucide-react";
import { useServiceStore, type LiveService } from "@/lib/serviceStore";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";

const SERVICE_CATEGORIES = [
  "Electronic", "Fashion", "Vehicle", "Home", "Gaming", "Furniture",
  "Electrical", "Welding", "Automotive", "Plumbing", "Cleaning", "Beauty & Care", "IT & Repair", "Other",
];

interface FormState {
  title: string;
  category: string;
  price: string;
  oldPrice: string;
  location: string;
  image: string;
  gallery: string[];
  description: string;
  specs: { key: string; value: string }[];
  status: string;
}

export function ServicePostingForm({ existing }: { existing?: Partial<LiveService> }) {
  const { createService, updateService, uploadServiceImage } = useServiceStore();
  const navigate = useNavigate();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    title: existing?.title ?? "",
    category: existing?.category ?? "Home",
    price: existing?.price ? String(existing.price) : "",
    oldPrice: existing?.oldPrice ? String(existing.oldPrice) : "",
    location: existing?.location ?? "",
    image: existing?.image ?? "",
    gallery: existing?.gallery ?? [],
    description: existing?.description ?? "",
    specs: existing?.specs && existing.specs.length > 0 ? existing.specs : [{ key: "", value: "" }],
    status: existing?.status ?? "Active",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof FormState, val: any) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ── Image Uploads ──
  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const url = await uploadServiceImage(file);
      set("image", url);
      if (!form.gallery.includes(url)) {
        set("gallery", [url, ...form.gallery]);
      }
      toast.success("Cover image uploaded!");
    } catch {
      toast.error("Cover image upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (file: File) => {
    setUploadingGallery(true);
    try {
      const url = await uploadServiceImage(file);
      set("gallery", [...form.gallery, url]);
      if (!form.image) set("image", url);
      toast.success("Image added to gallery!");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (idx: number) => {
    const nextGallery = form.gallery.filter((_, i) => i !== idx);
    set("gallery", nextGallery);
    if (form.image === form.gallery[idx]) {
      set("image", nextGallery[0] || "");
    }
  };

  // ── Specs ──
  const addSpec = () => set("specs", [...form.specs, { key: "", value: "" }]);
  const updateSpec = (idx: number, field: "key" | "value", val: string) =>
    set(
      "specs",
      form.specs.map((s, i) => (i === idx ? { ...s, [field]: val } : s))
    );
  const removeSpec = (idx: number) =>
    set(
      "specs",
      form.specs.filter((_, i) => i !== idx)
    );

  // ── Validation ──
  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Service title is required";
    if (!form.price || Number(form.price) <= 0) next.price = "Enter a valid price";
    if (!form.location.trim()) next.location = "Location is required";
    if (!form.image) next.image = "Main cover image is required";
    if (form.description.trim().length < 20)
      next.description = "Description should be at least 20 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        gallery: form.gallery.length > 0 ? form.gallery : [form.image],
        specs: form.specs.filter((s) => s.key.trim() && s.value.trim()),
      };

      if (existing?.id) {
        await updateService(existing.id, payload as any);
        toast.success("Service listing updated!");
      } else {
        await createService(payload as any);
        toast.success("Service listing created!");
      }
      navigate({ to: "/app/listings" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save service listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10" noValidate>
      {/* ── Main Cover Image ── */}
      <section>
        <h2 className="text-lg font-semibold">Service Cover Photo *</h2>
        <div className="mt-4 flex items-center gap-5">
          <div
            onClick={() => coverInputRef.current?.click()}
            className="relative flex h-36 w-48 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/30"
          >
            {form.image ? (
              <img src={form.image} alt="Cover" className="h-full w-full object-cover" />
            ) : uploadingCover ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-center p-3">
                <Image className="mx-auto h-7 w-7 text-muted-foreground" />
                <span className="mt-2 block text-xs text-muted-foreground">Upload cover photo</span>
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {form.image ? "Change cover photo" : "Upload photo"}
            </button>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
            {errors.image && <p className="mt-1 text-xs text-destructive">{errors.image}</p>}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCoverUpload(f);
            }}
          />
        </div>
      </section>

      {/* ── Gallery Images ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Photo Gallery</h2>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add Photo
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleGalleryUpload(f);
            }}
          />
        </div>
        {uploadingGallery && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading photo…
          </p>
        )}
        {form.gallery.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {form.gallery.map((img, idx) => (
              <div key={idx} className="relative h-24 w-28 overflow-hidden rounded-xl border border-border">
                <img src={img} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(idx)}
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-destructive hover:bg-background"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Basic Info ── */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Service Details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Service Title *"
            Icon={Wrench}
            value={form.title}
            error={errors.title}
            placeholder="Certified Electrical Installation"
            onChange={(v) => set("title", v)}
          />
          <div>
            <label className="text-sm font-medium">Category *</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none"
            >
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label="Price ($) *"
            Icon={DollarSign}
            type="number"
            value={form.price}
            error={errors.price}
            placeholder="135"
            onChange={(v) => set("price", v)}
          />
          <Field
            label="Original / Old Price ($)"
            Icon={DollarSign}
            type="number"
            value={form.oldPrice}
            placeholder="160"
            onChange={(v) => set("oldPrice", v)}
          />
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none"
            >
              <option value="Active">Active — Available for booking</option>
              <option value="Paused">Paused — Temporarily unavailable</option>
              <option value="Draft">Draft — Hidden</option>
            </select>
          </div>
        </div>

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
      </section>

      {/* ── Description ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Service Description *</h2>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={6}
          placeholder="Describe your service provision, what is included, tools used, guarantees, etc…"
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground ${
            errors.description ? "border-destructive" : "border-border"
          }`}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </section>

      {/* ── Service Specifications ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Service Features & Highlights</h2>
          <button
            type="button"
            onClick={addSpec}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <Plus className="h-4 w-4" /> Add Feature
          </button>
        </div>
        <div className="space-y-3">
          {form.specs.map((s, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                value={s.key}
                onChange={(e) => updateSpec(idx, "key", e.target.value)}
                placeholder="Feature (e.g. Warranty)"
                className="w-1/3 rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
              />
              <input
                value={s.value}
                onChange={(e) => updateSpec(idx, "value", e.target.value)}
                placeholder="Detail (e.g. 6 Months Full Cover)"
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
              />
              <button
                type="button"
                onClick={() => removeSpec(idx)}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
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
          "Publish service listing"
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
  Icon: typeof Wrench;
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
