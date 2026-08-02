import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, ROLE_META } from "@/lib/auth";
import { useListings } from "@/lib/listings";
import { useJobStore, type LiveJob } from "@/lib/jobStore";
import { useServiceStore, type LiveService } from "@/lib/serviceStore";
import { DashHeading } from "@/components/dashboard/DashboardShell";
import { ListingForm } from "@/components/dashboard/ListingForm";
import { JobPostingForm } from "@/components/dashboard/JobPostingForm";
import { ServicePostingForm } from "@/components/dashboard/ServicePostingForm";

export const Route = createFileRoute("/app/listings/$id/edit")({
  ssr: false,
  component: EditListing,
});

function EditListing() {
  const { id } = Route.useParams();
  const { session } = useAuth();
  const role = session?.role ?? "product";
  const meta = ROLE_META[role] || ROLE_META.product;
  const isJob = role === "job";
  const isService = role === "service";

  const { all, ready } = useListings(role);

  // Job store
  const { recruiterJobs, fetchJobById } = useJobStore();
  const [liveJob, setLiveJob] = useState<LiveJob | null>(null);
  const [loadingJob, setLoadingJob] = useState(isJob);

  // Service store
  const { providerServices, fetchServiceById } = useServiceStore();
  const [liveService, setLiveService] = useState<LiveService | null>(null);
  const [loadingService, setLoadingService] = useState(isService);

  useEffect(() => {
    if (isJob) {
      const found = recruiterJobs.find((j) => j.id === id);
      if (found) {
        setLiveJob(found);
        setLoadingJob(false);
      } else {
        fetchJobById(id).then((j) => {
          setLiveJob(j);
          setLoadingJob(false);
        });
      }
    } else if (isService) {
      const found = providerServices.find((s) => s.id === id);
      if (found) {
        setLiveService(found);
        setLoadingService(false);
      } else {
        fetchServiceById(id).then((s) => {
          setLiveService(s);
          setLoadingService(false);
        });
      }
    }
  }, [id, isJob, isService, recruiterJobs, providerServices, fetchJobById, fetchServiceById]);

  if (isJob) {
    if (loadingJob) return <p className="text-sm text-muted-foreground">Loading…</p>;
    if (!liveJob) {
      return (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="font-semibold">Job posting not found</p>
          <Link to="/app/listings" className="mt-4 inline-block text-sm text-price underline">
            Back to listings
          </Link>
        </div>
      );
    }
    return (
      <div className="space-y-8">
        <DashHeading
          title="Edit Job Posting"
          subtitle="Update the details candidates see when viewing this role."
        />
        <JobPostingForm existing={liveJob} />
      </div>
    );
  }

  if (isService) {
    if (loadingService) return <p className="text-sm text-muted-foreground">Loading…</p>;
    if (!liveService) {
      return (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="font-semibold">Service listing not found</p>
          <Link to="/app/listings" className="mt-4 inline-block text-sm text-price underline">
            Back to listings
          </Link>
        </div>
      );
    }
    return (
      <div className="space-y-8">
        <DashHeading
          title="Edit Service Listing"
          subtitle="Update the details clients see when viewing your service."
        />
        <ServicePostingForm existing={liveService} />
      </div>
    );
  }

  // Product role
  if (!ready) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const existing = all.find((l) => l.id === id);

  if (!existing) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="font-semibold">Listing not found</p>
        <Link to="/app/listings" className="mt-4 inline-block text-sm text-price underline">
          Back to listings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashHeading
        title={`Edit ${meta.listing}`}
        subtitle="Update the details buyers see on your listing."
      />
      <ListingForm role={role} existing={existing} />
    </div>
  );
}
