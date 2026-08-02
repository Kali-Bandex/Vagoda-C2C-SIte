import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { session, ready, checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) {
      checkAuth();
    }
  }, [ready, checkAuth]);

  useEffect(() => {
    if (ready && !session) navigate({ to: "/auth", replace: true });
  }, [ready, session, navigate]);

  if (!ready || !session) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <DashboardShell role={session.role}>
      <Outlet />
    </DashboardShell>
  );
}
