import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, User, Mail, Phone, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlacesAutocomplete } from "@/components/ui/PlacesAutocomplete";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { LiveService } from "@/lib/serviceStore";

const TIME_SLOTS = ["Morning (8am – 12pm)", "Afternoon (12pm – 4pm)", "Evening (4pm – 8pm)"];

export function BookingModal({ service }: { service: LiveService }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: session?.name ?? "",
    customerEmail: session?.email ?? "",
    customerPhone: session?.phone ?? "",
    serviceDate: "",
    serviceTime: TIME_SLOTS[0],
    serviceAddress: session?.location ?? "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.customerName.trim()) next.customerName = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.customerEmail)) next.customerEmail = "Enter a valid email";
    if (!form.customerPhone.trim()) next.customerPhone = "Phone number is required";
    if (!form.serviceDate) next.serviceDate = "Select a preferred service date";
    if (!form.serviceAddress.trim()) next.serviceAddress = "Service address is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please sign in to book a service");
      navigate({ to: "/auth" });
      return;
    }
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        serviceId: service.id,
        ...form,
      });
      toast.success("Booking request sent! Track it in your dashboard.");
      setOpen(false);
      navigate({ to: "/dashboard", search: { tab: "bookings" } as any });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-4 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90">
          Book Service Now (${service.price})
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book Service: {service.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Provided by {service.provider?.companyName || service.provider?.name || "Verified Provider"} · ${service.price}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4" noValidate>
          <Field
            label="Full Name *"
            Icon={User}
            value={form.customerName}
            error={errors.customerName}
            placeholder="John Doe"
            onChange={(v) => set("customerName", v)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Email *"
              Icon={Mail}
              type="email"
              value={form.customerEmail}
              error={errors.customerEmail}
              placeholder="john@example.com"
              onChange={(v) => set("customerEmail", v)}
            />
            <Field
              label="Phone Number *"
              Icon={Phone}
              type="tel"
              value={form.customerPhone}
              error={errors.customerPhone}
              placeholder="+233 50 123 4567"
              onChange={(v) => set("customerPhone", v)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Preferred Date *</label>
              <span className={`mt-1.5 flex items-center gap-2 rounded-xl border px-3 py-2.5 ${errors.serviceDate ? "border-destructive" : "border-border"}`}>
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.serviceDate}
                  onChange={(e) => set("serviceDate", e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </span>
              {errors.serviceDate && <p className="mt-1 text-xs text-destructive">{errors.serviceDate}</p>}
            </div>

            <div>
              <label className="text-xs font-medium">Time Slot</label>
              <select
                value={form.serviceTime}
                onChange={(e) => set("serviceTime", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs outline-none"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Service Address / Location *</label>
            <span
              className={`mt-1.5 flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                errors.serviceAddress ? "border-destructive" : "border-border"
              }`}
            >
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <PlacesAutocomplete
                value={form.serviceAddress}
                onChange={(v) => set("serviceAddress", v)}
                placeholder="Plot 42, Spintex Road, Accra"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </span>
            {errors.serviceAddress && <p className="mt-1 text-xs text-destructive">{errors.serviceAddress}</p>}
          </div>

          <div>
            <label className="text-xs font-medium">Additional Job Notes (optional)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Describe any specific requirements, access details, or urgency…"
              className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-foreground"
            />
          </div>

          <div className="rounded-xl bg-muted p-4 space-y-1 text-xs">
            <div className="flex justify-between font-semibold">
              <span>Total Payable</span>
              <span className="text-price">${service.price}</span>
            </div>
            <p className="text-muted-foreground">Payment is arranged directly with the provider upon service completion.</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-ink py-3.5 text-sm font-medium text-ink-foreground disabled:opacity-60"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting Booking…
              </span>
            ) : (
              "Confirm & Send Booking Request"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, Icon, value, onChange, error, type = "text", placeholder,
}: {
  label: string; Icon: typeof User; value: string;
  onChange: (v: string) => void; error?: string; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <span className={`mt-1.5 flex items-center gap-2 rounded-xl border px-3 py-2.5 ${error ? "border-destructive" : "border-border"}`}>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </span>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
