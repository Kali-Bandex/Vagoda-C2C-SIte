import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({
    meta: [
      { title: "Contact & Help — Vagoda Support" },
      {
        name: "description",
        content:
          "Get help with orders, bookings and job applications, or send the Vagoda team a message.",
      },
      { property: "og:title", content: "Contact & Help — Vagoda Support" },
      { property: "og:description", content: "Reach the Vagoda support team." },
    ],
  }),
});

const FAQS = [
  [
    "How do I cancel my reservation for a stay?",
    "You can cancel a reservation any time before or during your trip from your dashboard bookings tab.",
  ],
  [
    "When do I get paid as a seller?",
    "Payouts are released 24 hours after the buyer confirms delivery.",
  ],
  [
    "How are service providers verified?",
    "Every provider submits a government ID and business proof before being listed.",
  ],
];

function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    if (!String(d.get("name") || "").trim()) next.name = "Please enter your name";
    if (!/^\S+@\S+\.\S+$/.test(String(d.get("email") || ""))) next.email = "Enter a valid email";
    if (String(d.get("message") || "").trim().length < 10) next.message = "Message is too short";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      (e.target as HTMLFormElement).reset();
      toast.success("Message sent — we'll reply within 24 hours");
    }, 700);
  };

  return (
    <div className="mx-auto grid max-w-[1100px] gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold">Help & Contact</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Questions about an order, a booking or a job application? Send us a note.
        </p>
        <dl className="mt-10 space-y-6">
          {FAQS.map(([q, a]) => (
            <div key={q}>
              <dt className="text-sm font-semibold">{q}</dt>
              <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-border p-6" noValidate>
        {[
          { name: "name", label: "Your name", type: "text" },
          { name: "email", label: "Email", type: "email" },
        ].map((f) => (
          <div key={f.name} className="mb-4">
            <label htmlFor={f.name} className="text-xs font-medium">
              {f.label}
            </label>
            <input
              id={f.name}
              name={f.name}
              type={f.type}
              className="mt-1.5 w-full rounded-md border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
            />
            {errors[f.name] && <p className="mt-1 text-xs text-destructive">{errors[f.name]}</p>}
          </div>
        ))}
        <label htmlFor="message" className="text-xs font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          className="mt-1.5 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
        />
        {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-md bg-ink py-3.5 text-sm font-medium text-ink-foreground disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
