import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  FileText, Heart, ImagePlus, Loader2, MapPin,
  Plus, ShoppingCart, Star, Tag, Trash2, Video, X, Play,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { ROLE_META, type Role } from "@/lib/auth";
import { useListings, type Listing } from "@/lib/listings";
import { useProductStore } from "@/lib/productStore";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const COLOUR_PRESETS = [
  "#111111", "#FFFFFF", "#F5C518", "#F472B6",
  "#C084FC", "#EF4444", "#22D3EE", "#4ADE80",
];

interface FormState {
  title: string;
  category: string;
  price: string;
  location: string;
  description: string;
  image: string;
  gallery: string[];
  video: string;
  sizes: string[];
  colours: string[];
  specs: { key: string; value: string }[];
}

export function ListingForm({ role, existing }: { role: Role; existing?: Listing }) {
  const meta = ROLE_META[role] || ROLE_META.product;
  const { create, update } = useListings(role);
  const uploadImage = useProductStore((state) => state.uploadImage);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    title: existing?.title ?? "",
    category: existing?.category ?? "",
    price: existing ? String(existing.price) : "",
    location: existing?.location ?? "",
    description: existing?.description ?? "",
    image: existing?.image ?? "",
    gallery: (existing as any)?.gallery ?? (existing?.image ? [existing.image] : []),
    video: (existing as any)?.video ?? "",
    sizes: (existing as any)?.sizes ?? [],
    colours: (existing as any)?.colours ?? [],
    specs: (existing as any)?.specs ?? [],
  });

  // Toggles to activate / deactivate optional product features
  const [enableSizes, setEnableSizes] = useState<boolean>(
    Boolean((existing as any)?.sizes && (existing as any).sizes.length > 0)
  );
  const [enableColours, setEnableColours] = useState<boolean>(
    Boolean((existing as any)?.colours && (existing as any).colours.length > 0)
  );
  const [enableSpecs, setEnableSpecs] = useState<boolean>(
    Boolean((existing as any)?.specs && (existing as any).specs.length > 0)
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customColour, setCustomColour] = useState("#3B82F6");

  const handleMultipleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          if (role === "product") {
            const s3Url = await uploadImage(file);
            uploadedUrls.push(s3Url);
          } else {
            uploadedUrls.push(URL.createObjectURL(file));
          }
        }
      }

      if (uploadedUrls.length > 0) {
        setForm((f) => {
          const newGallery = [...f.gallery, ...uploadedUrls];
          return {
            ...f,
            gallery: newGallery,
            image: f.image || newGallery[0],
          };
        });
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload images");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file (MP4, WEBM, MOV)");
      return;
    }
    setUploadingVideo(true);
    try {
      if (role === "product") {
        const s3Url = await uploadImage(file);
        setForm((f) => ({ ...f, video: s3Url }));
        toast.success("Product video uploaded to AWS S3 bucket!");
      } else {
        setForm((f) => ({ ...f, video: URL.createObjectURL(file) }));
        toast.success("Video preview added");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setForm((f) => {
      const nextGallery = f.gallery.filter((_, idx) => idx !== index);
      return {
        ...f,
        gallery: nextGallery,
        image: nextGallery[0] || "",
      };
    });
  };

  const toggleSize = (s: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s],
    }));
  };

  const toggleColour = (c: string) => {
    setForm((f) => ({
      ...f,
      colours: f.colours.includes(c) ? f.colours.filter((x) => x !== c) : [...f.colours, c],
    }));
  };

  const addSpec = () => {
    if (form.specs.length >= 10) return;
    setForm((f) => ({ ...f, specs: [...f.specs, { key: "", value: "" }] }));
  };

  const updateSpec = (i: number, field: "key" | "value", val: string) => {
    setForm((f) => ({
      ...f,
      specs: f.specs.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)),
    }));
  };

  const removeSpec = (i: number) => {
    setForm((f) => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.title.trim().length < 3) next.title = `Enter a ${meta.listing.toLowerCase()} name`;
    if (!form.price || Number(form.price) <= 0) next.price = "Enter a valid price";
    if (!form.location.trim()) next.location = "Enter a location";
    if (!form.image && role === "product") next.image = "Please upload at least one image for your product";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const payload = {
        role,
        title: form.title.trim(),
        category: form.category || CATEGORIES[0],
        price: Number(form.price),
        location: form.location.trim(),
        description: form.description,
        image:
          form.image ||
          "https://c2c2.s3.eu-north-1.amazonaws.com/products/placeholder.jpg",
        gallery: form.gallery.length > 0 ? form.gallery : [form.image],
        video: form.video || "",
        sizes: enableSizes ? form.sizes : [],
        colours: enableColours ? form.colours : [],
        specs: enableSpecs ? form.specs.filter((s) => s.key.trim() && s.value.trim()) : [],
      };

      if (existing) {
        await update(existing.id, payload);
        toast.success(`${meta.listing} updated successfully`);
      } else {
        await create(payload);
        toast.success(`${meta.listing} created successfully`);
      }
      navigate({ to: "/app/listings" });
    } catch (err: any) {
      toast.error(err.message || `Failed to save ${meta.listing.toLowerCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* ── Preview Card ── */}
      <div>
        <p className="text-lg font-medium">{meta.listing} Card Preview</p>
        <div className="mt-4">
          <div className="relative overflow-hidden rounded-xl bg-muted">
            {form.image ? (
              <img src={form.image} alt="Preview" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                No image uploaded
              </div>
            )}
            <span className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-ink/25 text-ink-foreground backdrop-blur">
              <Heart className="h-5 w-5" />
            </span>
          </div>

          {/* Thumbnail preview list */}
          {form.gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {form.gallery.map((g, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, image: g }))}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                    form.image === g ? "border-foreground" : "border-transparent"
                  }`}
                >
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold leading-snug">
              {form.title || `${meta.listing} name`}
            </h3>
            <p className="shrink-0 text-lg font-semibold text-price">${form.price || 0}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{form.location || "Location"}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-star text-star" /> 5.0
              <span className="text-muted-foreground">• 0 Sold</span>
            </p>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-ink-foreground">
              <ShoppingCart className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      {/* ── Form Fields ── */}
      <div className="space-y-6">
        {/* ── Multiple Images Upload ── */}
        <div>
          <p className="text-lg font-medium">Product Images (Multiple Gallery Upload)</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload main product image and additional gallery photos. Click or drop multiple files.
          </p>

          <label className="mt-3 grid cursor-pointer place-items-center rounded-xl border border-dashed border-border px-6 py-8 text-center hover:bg-muted/50 transition-colors">
            {uploadingImage ? (
              <div className="flex flex-col items-center gap-2 py-4 text-brand">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm font-medium">Uploading images to AWS S3 bucket…</span>
              </div>
            ) : (
              <>
                <span className="flex gap-2 text-muted-foreground">
                  <ImagePlus className="h-6 w-6" />
                </span>
                <span className="mt-3 text-sm font-medium">
                  Click to select multiple product images
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Supports PNG, JPG, WEBP (Uploaded to AWS S3)
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={uploadingImage}
              onChange={(e) => handleMultipleImageUpload(e.target.files)}
            />
          </label>
          {errors.image && <span className="mt-1 block text-xs text-destructive">{errors.image}</span>}

          {/* Uploaded Gallery Thumbnails Grid */}
          {form.gallery.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Uploaded Gallery ({form.gallery.length} photos) — Click thumbnail to set as main image:
              </p>
              <div className="flex flex-wrap gap-3">
                {form.gallery.map((imgUrl, index) => (
                  <div key={index} className="relative group h-20 w-20 overflow-hidden rounded-xl border border-border">
                    <img
                      src={imgUrl}
                      alt={`Gallery ${index}`}
                      onClick={() => setForm((f) => ({ ...f, image: imgUrl }))}
                      className={`h-full w-full object-cover cursor-pointer ${
                        form.image === imgUrl ? "ring-2 ring-foreground" : ""
                      }`}
                    />
                    {form.image === imgUrl && (
                      <span className="absolute bottom-1 left-1 bg-ink text-ink-foreground text-[9px] px-1.5 py-0.5 rounded font-semibold">
                        Main
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-destructive text-white opacity-90 hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Product Video Upload ── */}
        <div className="rounded-xl border border-border p-5 space-y-3">
          <div>
            <p className="text-base font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-price" /> Product Video <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a product video (MP4/WEBM/MOV up to 50MB) or enter a video URL for buyers to watch.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <label className="flex flex-col items-center justify-center cursor-pointer rounded-xl border border-dashed border-border p-4 text-center hover:bg-muted/50 transition-colors">
              {uploadingVideo ? (
                <div className="flex items-center gap-2 py-2 text-brand">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs font-medium">Uploading video…</span>
                </div>
              ) : (
                <>
                  <Video className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs font-medium">Upload Video File</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">MP4, WEBM, MOV</span>
                </>
              )}
              <input
                type="file"
                accept="video/*"
                className="sr-only"
                disabled={uploadingVideo}
                onChange={(e) => handleVideoUpload(e.target.files?.[0] || null)}
              />
            </label>

            <div className="flex flex-col justify-center">
              <span className="text-xs font-medium mb-1">Or paste Video URL</span>
              <input
                type="url"
                value={form.video}
                onChange={(e) => setForm({ ...form, video: e.target.value })}
                placeholder="https://example.com/video.mp4"
                className="w-full rounded-xl border border-border px-3.5 py-2.5 text-xs outline-none focus:border-foreground/30"
              />
            </div>
          </div>

          {/* Video Preview */}
          {form.video && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Play className="h-3.5 w-3.5 fill-foreground" /> Video Preview Attached
                </span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, video: "" }))}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove video
                </button>
              </div>
              <video src={form.video} controls className="aspect-video w-full max-h-[220px] rounded-xl object-cover bg-black" />
            </div>
          )}
        </div>

        {/* Basic Fields */}
        <div className="grid gap-6 md:grid-cols-2">
          <Labeled label={`${meta.listing} Name`} required error={errors.title}>
            <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={`Enter ${meta.listing.toLowerCase()} name`}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Labeled>
          <Labeled label={`${meta.listing} Categories`}>
            <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            >
              <option value="">select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Price" required error={errors.price}>
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Enter price (e.g 50)"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Labeled>
          <Labeled label="Location" required error={errors.location}>
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <PlacesAutocomplete
              value={form.location}
              onChange={(val) => setForm({ ...form, location: val })}
              placeholder="Search for a location…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Labeled>
        </div>

        {/* ── Sizes Toggle & Picker ── */}
        <div className="rounded-xl border border-border p-5 space-y-3">
          <ToggleSwitch
            label="Available Sizes"
            subtitle="Toggle to activate or deactivate size options for this product"
            enabled={enableSizes}
            onChange={setEnableSizes}
          />
          {enableSizes && (
            <div className="pt-3 border-t border-border/60">
              <p className="text-xs text-muted-foreground">Select all sizes this product comes in</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`h-9 min-w-[2.5rem] rounded-md px-3 text-sm font-medium transition-colors ${
                      form.sizes.includes(s)
                        ? "bg-ink text-ink-foreground"
                        : "border border-border text-muted-foreground hover:border-foreground/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Colours Toggle & Picker ── */}
        <div className="rounded-xl border border-border p-5 space-y-3">
          <ToggleSwitch
            label="Available Colours"
            subtitle="Toggle to activate or deactivate colour options for this product"
            enabled={enableColours}
            onChange={setEnableColours}
          />
          {enableColours && (
            <div className="pt-3 border-t border-border/60">
              <p className="text-xs text-muted-foreground">Select all colours this product comes in</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {COLOUR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleColour(c)}
                    aria-label={`Colour ${c}`}
                    className={`h-7 w-7 rounded-full ring-offset-2 transition-all ${
                      form.colours.includes(c) ? "ring-2 ring-foreground scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c, border: c === "#FFFFFF" ? "1px solid #e2e8f0" : undefined }}
                  />
                ))}
                {/* Custom colour picker */}
                <label className="relative h-7 w-7 cursor-pointer rounded-full border border-dashed border-border hover:border-foreground/40 overflow-hidden" title="Custom colour">
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: customColour }}
                  />
                  <input
                    type="color"
                    value={customColour}
                    onChange={(e) => setCustomColour(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                {customColour && !COLOUR_PRESETS.includes(customColour) && (
                  <button
                    type="button"
                    onClick={() => toggleColour(customColour)}
                    className={`h-7 w-7 rounded-full ring-offset-2 ${
                      form.colours.includes(customColour) ? "ring-2 ring-foreground" : ""
                    }`}
                    style={{ backgroundColor: customColour }}
                    aria-label="Add custom colour"
                  />
                )}
              </div>
              {form.colours.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Selected: {form.colours.length} colour{form.colours.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Spec Table Toggle & Editor ── */}
        <div className="rounded-xl border border-border p-5 space-y-3">
          <ToggleSwitch
            label="Product Specifications"
            subtitle="Toggle to activate or deactivate product specification table"
            enabled={enableSpecs}
            onChange={setEnableSpecs}
          />
          {enableSpecs && (
            <div className="pt-3 border-t border-border/60">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">
                  Add attributes like Fabric, Fit, Pattern, Style, etc.
                </p>
                <button
                  type="button"
                  onClick={addSpec}
                  disabled={form.specs.length >= 10}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </button>
              </div>
              {form.specs.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Attribute</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Value</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.specs.map((spec, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="px-4 py-2">
                            <input
                              value={spec.key}
                              onChange={(e) => updateSpec(i, "key", e.target.value)}
                              placeholder="e.g. Fabric"
                              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              value={spec.value}
                              onChange={(e) => updateSpec(i, "value", e.target.value)}
                              placeholder="e.g. Cotton"
                              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeSpec(i)}
                              aria-label="Remove row"
                              className="grid h-6 w-6 place-items-center rounded text-destructive/60 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Description ── */}
        <div>
          <p className="text-lg font-medium">Description</p>
          <div className="mt-3 rounded-xl border border-border">
            <div className="flex gap-3 px-4 pt-4 text-muted-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={`Describe your ${meta.listing.toLowerCase()}`}
              rows={6}
              className="w-full resize-none bg-transparent px-4 pb-4 pt-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting || uploadingImage || uploadingVideo}
            className="flex items-center gap-2 rounded-xl bg-ink px-8 py-4 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {existing
              ? `Save ${meta.listing.toLowerCase()}`
              : `Publish ${meta.listing.toLowerCase()}`}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/app/listings" })}
            className="rounded-xl border border-border px-8 py-4 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

function ToggleSwitch({
  label,
  subtitle,
  enabled,
  onChange,
}: {
  label: string;
  subtitle: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-base font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? "bg-price" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Labeled({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-lg font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <span
        className={`mt-2 flex items-center gap-3 rounded-xl border px-4 py-3.5 ${
          error ? "border-destructive" : "border-border"
        }`}
      >
        {children}
      </span>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
