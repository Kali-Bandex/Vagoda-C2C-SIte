import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Search } from "lucide-react";
import { activityFor, useListings } from "@/lib/listings";
import { useAuth } from "@/lib/auth";
import { DashHeading } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/app/customers")({
  ssr: false,
  component: CustomersPage,
});

function CustomersPage() {
  const { session } = useAuth();
  const role = session?.role ?? "product";
  const { items } = useListings(role);
  const [q, setQ] = useState("");
  const customers = activityFor(items).filter((c) =>
    c.person.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <DashHeading title="Customers" subtitle="Everyone who bought from or booked you." />

      <div className="flex items-center gap-3 rounded-xl border border-border px-5 py-3.5 sm:max-w-[420px]">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search customers"
          placeholder="Search customers"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="font-semibold">No customers found</p>
          <p className="mt-2 text-sm text-muted-foreground">Try another name.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {customers.map((c) => (
            <article key={c.id} className="rounded-2xl border border-border p-5">
              <div className="flex items-center gap-4">
                <img
                  src={c.avatar}
                  alt={c.person}
                  loading="lazy"
                  className="h-14 w-14 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{c.person}</p>
                  <p className="text-sm text-muted-foreground">Since {c.date}</p>
                </div>
              </div>
              <p className="mt-4 truncate text-sm text-muted-foreground">Last: {c.listing}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => toast.success(`Email sent to ${c.person}`)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm"
                >
                  <Mail className="h-4 w-4" /> Email
                </button>
                <a
                  href="tel:0544324094"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm text-ink-foreground"
                >
                  <Phone className="h-4 w-4" /> Call
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
