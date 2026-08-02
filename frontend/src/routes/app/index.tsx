import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  ssr: false,
  component: () => <Navigate to="/app/overview" replace />,
});
