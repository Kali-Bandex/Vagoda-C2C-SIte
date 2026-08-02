import { createFileRoute } from "@tanstack/react-router";
import { JobPostingForm } from "@/components/dashboard/JobPostingForm";

export const Route = createFileRoute("/jobs/new")({
  component: NewJob,
  head: () => ({
    meta: [
      { title: "Post a Job — Vagoda Jobs" },
      {
        name: "description",
        content: "Post a job opening on Vagoda and reach thousands of qualified candidates.",
      },
      { property: "og:title", content: "Post a Job — Vagoda Jobs" },
      { property: "og:description", content: "Publish a job opening to the Vagoda talent pool." },
    ],
  }),
});

function NewJob() {
  return (
    <div className="mx-auto max-w-[860px] px-5 py-16">
      <h1 className="text-3xl font-semibold">Post a Job</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Share the role details and reach qualified candidates across the Vagoda network.
      </p>
      <div className="mt-10">
        <JobPostingForm />
      </div>
    </div>
  );
}
