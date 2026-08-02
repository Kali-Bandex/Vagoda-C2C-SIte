import { Link } from "@tanstack/react-router";
import { Calendar, Clock, MapPin, Wrench, Phone, Mail, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  Pending: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  Confirmed: "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  "In Progress": "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  Completed: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Cancelled: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export interface BookingData {
  id: string;
  bookingNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceDate: string;
  serviceTime?: string;
  serviceAddress: string;
  notes?: string;
  totalAmount: number;
  createdAt: string;
  serviceId?: string;
  service?: {
    id: string;
    title: string;
    category?: string;
    price: number;
    location: string;
    image: string;
  } | null;
}

export function BookingCard({
  booking,
  onCancelled,
}: {
  booking: BookingData;
  onCancelled?: (id: string) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const service = booking.service;
  const bookingDate = new Date(booking.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const scheduledDate = new Date(booking.serviceDate).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(true);
    try {
      await api.delete(`/bookings/${booking.id}`);
      toast.success("Booking cancelled");
      onCancelled?.(booking.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <article className="rounded-2xl border border-border p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <p className="text-xs text-muted-foreground">Booking Number</p>
          <p className="text-xl font-bold tracking-tight">{booking.bookingNumber}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground">Booked on {bookingDate}</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[booking.status] ?? "border-border text-muted-foreground"}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {booking.status}
          </span>
        </div>
      </div>

      {/* Service Info */}
      {service && (
        <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <img
            src={service.image}
            alt={service.title}
            className="h-20 w-24 rounded-xl object-cover"
          />

          <div className="min-w-0">
            <Link
              to="/services/$id"
              params={{ id: service.id }}
              className="text-lg font-semibold hover:underline"
            >
              {service.title}
            </Link>
            <p className="text-sm font-semibold text-price">${booking.totalAmount}</p>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Date: {scheduledDate}
              </span>
              {booking.serviceTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {booking.serviceTime}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {booking.serviceAddress}
              </span>
            </div>
          </div>

          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
              booking.status === "Completed"
                ? "bg-brand-soft text-price"
                : booking.status === "Cancelled"
                ? "bg-[oklch(0.95_0.04_20)] text-destructive"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {booking.status === "Completed" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : booking.status === "Cancelled" ? (
              <XCircle className="h-5 w-5" />
            ) : (
              <Wrench className="h-5 w-5" />
            )}
          </span>
        </div>
      )}

      {/* Notes if any */}
      {booking.notes && (
        <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Note: </span>
          {booking.notes}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-border pt-4">
        {service && (
          <Link
            to="/services/$id"
            params={{ id: service.id }}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
          >
            View Service
          </Link>
        )}

        {["Pending", "Confirmed"].includes(booking.status) && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="ml-auto flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Cancel Booking
          </button>
        )}
      </div>
    </article>
  );
}
