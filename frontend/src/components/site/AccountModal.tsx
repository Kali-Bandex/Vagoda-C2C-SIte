import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid, LogOut, Store, X } from "lucide-react";
import { useAuth, ROLE_META } from "@/lib/auth";

export function AccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  if (!open) return null;

  const meta = session ? ROLE_META[session.role] : null;
  const Icon = session?.role === "product" ? Store : LayoutGrid;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 px-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[520px] rounded-2xl bg-background p-8 shadow-xl">
        <div className="text-center">
          <div className="relative mx-auto w-fit">
            <img
              src={session?.avatar ?? "https://i.pravatar.cc/240?img=12"}
              alt={session ? `${session.name}'s profile` : "Guest profile"}
              className="h-28 w-28 rounded-full object-cover"
            />
            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-brand ring-4 ring-background" />
          </div>
          <h2 className="mt-5 text-3xl font-semibold">Hi, {session?.name ?? "there"}</h2>
          <p className="mt-1 text-muted-foreground">
            {session ? "Welcome to your account" : "Sign in to manage your listings"}
          </p>
        </div>

        <div className="my-7 border-t border-dashed border-border" />

        <div className="space-y-4">
          {session && meta ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  navigate({ to: "/app/overview" });
                }}
                className="flex w-full items-center gap-4 border border-border px-5 py-5 text-left text-lg text-muted-foreground transition-colors hover:bg-muted"
              >
                <Icon className="h-6 w-6" />
                Go to {meta.dashboard}
                <ArrowRight className="ml-auto h-5 w-5 text-foreground" />
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate({ to: "/dashboard", search: { tab: "orders" } });
                }}
                className="flex w-full items-center gap-4 border border-border px-5 py-5 text-left text-lg text-muted-foreground transition-colors hover:bg-muted"
              >
                <LayoutGrid className="h-6 w-6" />
                Go to My Account
                <ArrowRight className="ml-auto h-5 w-5 text-foreground" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={onClose}
              className="flex w-full items-center gap-4 border border-border px-5 py-5 text-lg text-muted-foreground transition-colors hover:bg-muted"
            >
              <Store className="h-6 w-6" />
              Sign in or create an account
              <ArrowRight className="ml-auto h-5 w-5 text-foreground" />
            </Link>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              signOut();
              onClose();
              navigate({ to: "/" });
            }}
            className="flex items-center justify-center gap-3 bg-muted px-5 py-5 text-lg text-muted-foreground"
          >
            <LogOut className="h-5 w-5" /> Log out
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-3 bg-ink px-5 py-5 text-lg text-ink-foreground"
          >
            <X className="h-5 w-5" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
