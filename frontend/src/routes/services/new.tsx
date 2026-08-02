import { createFileRoute } from "@tanstack/react-router";
import { ServicePostingForm } from "@/components/dashboard/ServicePostingForm";

export const Route = createFileRoute("/services/new")({
  component: NewService,
  head: () => ({
    meta: [
      { title: "Post a Service — Vagoda Services" },
      {
        name: "description",
        content: "Offer your professional services on Vagoda and connect with local clients.",
      },
      { property: "og:title", content: "Post a Service — Vagoda Services" },
      { property: "og:description", content: "Publish a service listing on Vagoda." },
    ],
  }),
});

function NewService() {
  return (
    <div className="mx-auto max-w-[860px] px-5 py-16">
      <h1 className="text-3xl font-semibold">Post a Service Listing</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Fill in your service details, upload photos, set your price, and reach clients across Ghana.
      </p>
      <div className="mt-10">
        <ServicePostingForm />
      </div>
    </div>
  );
}
