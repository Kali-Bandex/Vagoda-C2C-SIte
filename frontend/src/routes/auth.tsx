import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Mail,
  Lock,
  Store,
  Wrench,
  User,
  ShoppingBag,
  Phone,
  Building2,
  MapPin,
  Globe,
  FileText,
  Image,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuth, ROLE_META, type Role } from "@/lib/auth";
import { Logo } from "@/components/site/Header";
import { api } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in to Vagoda — Buyer, Seller, Recruiter & Provider Dashboards" },
      {
        name: "description",
        content:
          "Sign in or create a Vagoda account and pick your account: buyer, marketplace seller, job recruiter or service provider.",
      },
    ],
  }),
});

const ROLES: { key: Role; Icon: typeof Store }[] = [
  { key: "buyer", Icon: ShoppingBag },
  { key: "product", Icon: Store },
  { key: "job", Icon: Briefcase },
  { key: "service", Icon: Wrench },
];

const isSeller = (role: Role) => role !== "buyer";

function AuthPage() {
  const { session, ready, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && session) {
      navigate({ to: "/app/overview", replace: true });
    }
  }, [ready, session, navigate]);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("buyer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [sellerForm, setSellerForm] = useState({
    companyName: "",
    bio: "",
    location: "",
    website: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File, onUrl: (url: string) => void, setUploading: (v: boolean) => void) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/products/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUrl(res.data.url);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const validateStep1 = () => {
    const next: Record<string, string> = {};
    if (mode === "signup" && form.name.trim().length < 2) next.name = "Enter your full name";
    if (mode === "signup" && form.phone.trim().length < 6) next.phone = "Enter a valid contact number";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (form.password.length < 6) next.password = "Password must be at least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = () => {
    const next: Record<string, string> = {};
    if (isSeller(role) && !sellerForm.companyName.trim()) {
      next.companyName = "Company name is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signin") {
      handleFinalSubmit();
      return;
    }
    if (validateStep1()) setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (mode === "signup" && step === 2 && !validateStep2()) return;
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn({ email: form.email, password: form.password, role });
      } else {
        await signUp({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role,
          avatar: avatarUrl,
          companyName: isSeller(role) ? sellerForm.companyName : "",
          companyLogo: companyLogoUrl,
          bio: sellerForm.bio,
          location: sellerForm.location,
          website: sellerForm.website,
        });
      }
      toast.success(`Welcome to your ${ROLE_META[role].dashboard}!`);
      navigate({ to: "/app/overview" });
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    try {
      await signIn({ email: "demo@vagoda.com", password: "Password123!", role });
      toast.success(`Welcome to your ${ROLE_META[role].dashboard}!`);
      navigate({ to: "/app/overview" });
    } catch (err: any) {
      toast.error(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  const resetMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setStep(1);
    setErrors({});
    setAvatarUrl("");
    setCompanyLogoUrl("");
  };

  return (
    <div className="flex min-h-[calc(100vh-100px)] w-full items-center justify-center py-10 lg:py-16">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-5 lg:grid-cols-2 lg:px-10">
        {/* Left panel */}
        <div className="hidden rounded-3xl bg-ink p-12 text-ink-foreground lg:block">
        <Logo />
        <h2 className="mt-16 text-5xl font-semibold leading-tight">
          One account.
          <br />
          Multiple ways to grow.
        </h2>
        <p className="mt-6 max-w-md text-ink-foreground/70">
          Buy products, sell your brand, post jobs or offer services — your dashboard is shaped by the account type you choose.
        </p>
        <div className="mt-12 space-y-4">
          {ROLES.map(({ key, Icon }) => (
            <div
              key={key}
              className="flex items-center gap-4 rounded-2xl border border-ink-foreground/15 p-5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-brand-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium">{ROLE_META[key].dashboard}</p>
                <p className="text-sm text-ink-foreground/60">{ROLE_META[key].label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="mx-auto w-full max-w-[480px]">
        <h1 className="text-4xl font-semibold tracking-tight">
          {mode === "signin" ? "Welcome back" : step === 1 ? "Create your account" : isSeller(role) ? "Business details" : "Your profile"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "signin"
            ? "Sign in and pick the dashboard you want to manage."
            : step === 1
            ? "Choose your account type — it decides which dashboard you land in."
            : isSeller(role)
            ? "Tell buyers about your business. Only Company Name is required."
            : "Add a profile photo — completely optional but recommended."}
        </p>

        {/* Step indicator for signup */}
        {mode === "signup" && (
          <div className="mt-5 flex items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-ink" : "bg-muted"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-ink" : "bg-muted"}`} />
          </div>
        )}

        {/* Role selector — only on step 1 */}
        {step === 1 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ROLES.map(({ key, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                aria-pressed={role === key}
                className={
                  role === key
                    ? "rounded-2xl border-2 border-brand bg-brand-soft p-4 text-left"
                    : "rounded-2xl border border-border p-4 text-left transition-colors hover:bg-muted"
                }
              >
                <Icon className={`h-5 w-5 ${role === key ? "text-price" : "text-muted-foreground"}`} />
                <p className="mt-3 text-sm font-medium leading-tight">{ROLE_META[key].listings}</p>
                <p className="mt-1 text-xs text-muted-foreground">{ROLE_META[key].dashboard}</p>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 1: Base signup/login form ── */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="mt-8 space-y-5" noValidate>
            {mode === "signup" && (
              <>
                <Field
                  label="Full name"
                  Icon={User}
                  value={form.name}
                  error={errors.name}
                  placeholder="Kalifa Mensah"
                  onChange={(v) => setForm({ ...form, name: v })}
                />
                <Field
                  label="Contact / Phone number"
                  Icon={Phone}
                  type="tel"
                  value={form.phone}
                  error={errors.phone}
                  placeholder="0544324094"
                  onChange={(v) => setForm({ ...form, phone: v })}
                />
              </>
            )}
            <Field
              label="Email"
              Icon={Mail}
              type="email"
              value={form.email}
              error={errors.email}
              placeholder="you@example.com"
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Field
              label="Password"
              Icon={Lock}
              type="password"
              value={form.password}
              error={errors.password}
              placeholder="••••••••"
              onChange={(v) => setForm({ ...form, password: v })}
            />

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-4 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signin" ? (
                `Sign in · ${ROLE_META[role].dashboard}`
              ) : (
                <>
                  Next step <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {mode === "signin" && (
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                Sign in with Demo Account
              </button>
            )}
          </form>
        )}

        {/* ── STEP 2: Profile / Business details ── */}
        {step === 2 && mode === "signup" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFinalSubmit();
            }}
            className="mt-8 space-y-5"
            noValidate
          >
            {isSeller(role) ? (
              <>
                {/* Company Logo upload */}
                <div>
                  <p className="mb-2 text-sm font-medium">Company Logo <span className="text-muted-foreground text-xs">(optional)</span></p>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center hover:border-foreground/30 transition-colors"
                    >
                      {companyLogoUrl ? (
                        <img src={companyLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                      ) : uploadingLogo ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <Image className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Upload your logo</p>
                      <p>PNG, JPG up to 5MB</p>
                      {companyLogoUrl && (
                        <button type="button" onClick={() => setCompanyLogoUrl("")} className="text-destructive text-xs mt-1">Remove</button>
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadImage(f, setCompanyLogoUrl, setUploadingLogo);
                      }}
                    />
                  </div>
                </div>

                <Field
                  label="Company / Business Name"
                  Icon={Building2}
                  value={sellerForm.companyName}
                  error={errors.companyName}
                  placeholder="Vagoda Official Store"
                  onChange={(v) => setSellerForm({ ...sellerForm, companyName: v })}
                />
                <Field
                  label="Business Location"
                  Icon={MapPin}
                  value={sellerForm.location}
                  placeholder="Accra, Ghana"
                  onChange={(v) => setSellerForm({ ...sellerForm, location: v })}
                />
                <Field
                  label="Bio / Description"
                  Icon={FileText}
                  value={sellerForm.bio}
                  placeholder="We sell premium electronics and tech accessories…"
                  onChange={(v) => setSellerForm({ ...sellerForm, bio: v })}
                />
                <Field
                  label="Website (optional)"
                  Icon={Globe}
                  value={sellerForm.website}
                  placeholder="https://yourstore.com"
                  onChange={(v) => setSellerForm({ ...sellerForm, website: v })}
                />
              </>
            ) : (
              // Buyer: profile picture upload
              <div>
                <p className="mb-2 text-sm font-medium">Profile Photo <span className="text-muted-foreground text-xs">(optional)</span></p>
                <div className="flex items-center gap-5">
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center hover:border-foreground/30 transition-colors"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : uploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      {avatarUrl ? "Change photo" : "Upload photo"}
                    </button>
                    <p className="mt-1.5 text-xs text-muted-foreground">PNG, JPG up to 5MB. Skip to use default.</p>
                    {avatarUrl && (
                      <button type="button" onClick={() => setAvatarUrl("")} className="mt-1 text-xs text-destructive">Remove</button>
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(f, setAvatarUrl, setUploadingAvatar);
                    }}
                  />
                </div>
                <p className="mt-6 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                  Your profile photo helps sellers identify you more easily. You can always change it later from your profile page.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-xl border border-border px-5 py-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-6 py-4 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Create account · ${ROLE_META[role].dashboard}`
                )}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          {mode === "signin" ? "New to Vagoda?" : "Already have an account?"}{" "}
          <button onClick={resetMode} className="font-medium text-price underline">
            {mode === "signin" ? "Create an account" : "Sign in instead"}
          </button>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link to="/" className="underline">Back to marketplace</Link>
        </p>
      </div>
    </div>
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
  Icon: typeof Mail;
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
