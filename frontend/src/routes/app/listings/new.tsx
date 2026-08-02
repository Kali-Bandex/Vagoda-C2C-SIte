import { createFileRoute } from "@tanstack/react-router";
import { useAuth, ROLE_META } from "@/lib/auth";
import { DashHeading } from "@/components/dashboard/DashboardShell";
import { ListingForm } from "@/components/dashboard/ListingForm";
import { JobPostingForm } from "@/components/dashboard/JobPostingForm";
import { ServicePostingForm } from "@/components/dashboard/ServicePostingForm";

export const Route = createFileRoute("/app/listings/new")({
  ssr: false,
  component: NewListing,
});

function NewListing() {
  const { session } = useAuth();
  const role = session?.role ?? "product";
  const meta = ROLE_META[role] || ROLE_META.product;
  const isJob = role === "job";
  const isService = role === "service";

  return (
    <div className="space-y-8">
      <DashHeading
        title={isJob ? "Post a New Job" : isService ? "Post a New Service" : `New ${meta.listing}`}
        subtitle={
          isJob
            ? "Fill in the details below to post a new job opening."
            : isService
            ? "Fill in the details below to offer a new service."
            : `Create a new ${meta.listing.toLowerCase()} listing.`
        }
      />
      {isJob ? (
        <JobPostingForm />
      ) : isService ? (
        <ServicePostingForm />
      ) : (
        <ListingForm role={role} />
      )}
    </div>
  );
}
