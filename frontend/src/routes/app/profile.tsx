import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  User,
  Phone,
  Building2,
  MapPin,
  Globe,
  FileText,
  Loader2,
  Save,
  Camera,
} from "lucide-react";
import { DashHeading } from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/app/profile")({
  ssr: false,
  component: ProfilePage,
});

function ProfilePage() {
  const { session, updateProfile } = useAuth();
  const isSeller = session?.role !== "buyer";

  const [form, setForm] = useState({
    name: session?.name || "",
    phone: session?.phone || "",
    companyName: session?.companyName || "",
    bio: session?.bio || "",
    location: session?.location || "",
    website: session?.website || "",
  });
  const [avatarUrl, setAvatarUrl] = useState(session?.avatar || "");
  const [companyLogoUrl, setCompanyLogoUrl] = useState(session?.companyLogo || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (
    file: File,
    setUrl: (u: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/products/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUrl(res.data.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone,
        avatar: avatarUrl,
        companyName: form.companyName,
        companyLogo: companyLogoUrl,
        bio: form.bio,
        location: form.location,
        website: form.website,
      });
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Please sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashHeading
        title="My Profile"
        subtitle={isSeller ? "Manage your business identity and public profile." : "Update your personal information and profile photo."}
      />

      <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
        {/* Avatar / Logo Section */}
        <div className="rounded-2xl border border-border p-6 space-y-5">
          <h2 className="text-base font-semibold">
            {isSeller ? "Brand Identity" : "Profile Photo"}
          </h2>

          {/* User Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div
                onClick={() => avatarRef.current?.click()}
                className="h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-border bg-muted flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : uploadingAvatar ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-ink text-ink-foreground cursor-pointer" onClick={() => avatarRef.current?.click()}>
                <Camera className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">{isSeller ? "Profile Photo" : "Your Photo"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG up to 5MB</p>
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                {avatarUrl ? "Change" : "Upload"}
              </button>
              {avatarUrl && (
                <button type="button" onClick={() => setAvatarUrl("")} className="ml-2 mt-2 text-xs text-destructive">
                  Remove
                </button>
              )}
            </div>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadImage(f, setAvatarUrl, setUploadingAvatar);
              }}
            />
          </div>

          {/* Company Logo — sellers only */}
          {isSeller && (
            <div className="flex items-center gap-5 pt-4 border-t border-border">
              <div
                onClick={() => logoRef.current?.click()}
                className="h-16 w-16 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center hover:border-foreground/30 transition-colors"
              >
                {companyLogoUrl ? (
                  <img src={companyLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : uploadingLogo ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Company Logo</p>
                <p className="text-xs text-muted-foreground mt-0.5">Shown on product listings and chat</p>
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  {companyLogoUrl ? "Change Logo" : "Upload Logo"}
                </button>
                {companyLogoUrl && (
                  <button type="button" onClick={() => setCompanyLogoUrl("")} className="ml-2 text-xs text-destructive">
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, setCompanyLogoUrl, setUploadingLogo);
                }}
              />
            </div>
          )}
        </div>

        {/* Personal Info */}
        <div className="rounded-2xl border border-border p-6 space-y-5">
          <h2 className="text-base font-semibold">Personal Information</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Full Name"
              Icon={User}
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Kalifa Mensah"
            />
            <Field
              label="Phone Number"
              Icon={Phone}
              type="tel"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="0544324094"
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Email</p>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5">
              <span className="text-sm text-muted-foreground">{session.email}</span>
              <span className="ml-auto text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">Cannot change</span>
            </div>
          </div>
        </div>

        {/* Business Info — sellers only */}
        {isSeller && (
          <div className="rounded-2xl border border-border p-6 space-y-5">
            <h2 className="text-base font-semibold">Business Information</h2>

            <Field
              label="Company / Business Name"
              Icon={Building2}
              value={form.companyName}
              onChange={(v) => setForm({ ...form, companyName: v })}
              placeholder="Vagoda Official Store"
            />
            <Field
              label="Business Location"
              Icon={MapPin}
              value={form.location}
              onChange={(v) => setForm({ ...form, location: v })}
              placeholder="Accra, Ghana"
            />
            <Field
              label="Website"
              Icon={Globe}
              value={form.website}
              onChange={(v) => setForm({ ...form, website: v })}
              placeholder="https://yourstore.com"
            />
            <div>
              <label className="block">
                <span className="text-sm font-medium">Bio / Description</span>
                <div className="mt-2 flex items-start gap-3 rounded-xl border border-border px-4 py-3.5">
                  <FileText className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Describe your business, products, and what makes you unique…"
                    rows={4}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground"
                  />
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-ink px-8 py-4 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
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
  Icon: typeof User;
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
