import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ListingPage } from "@/components/site/ListingPage";
import heroIllustration from "@/assets/marketplace-hero.png";

export const Route = createFileRoute("/marketplace/")({
  validateSearch: z.object({ q: z.string().optional() }),
  component: Marketplace,
  head: () => ({
    meta: [
      { title: "Marketplace — Find the Best Deals on Quality Products" },
      {
        name: "description",
        content:
          "Browse thousands of quality products from trusted sellers across Ghana. Filter by category, location and price.",
      },
      { property: "og:title", content: "Marketplace — Find the Best Deals on Quality Products" },
      {
        property: "og:description",
        content: "Shop electronics, fashion, vehicles and more on the Vagoda marketplace.",
      },
    ],
  }),
});

function Marketplace() {
  const { q } = Route.useSearch();
  return (
    <ListingPage
      title={
        <>
          Find the Best Deals
          <br />
          on Quality Products
        </>
      }
      subtitle="Seamlessly connects our C2C Marketplace, Jobs, and Services"
      searchPlaceholder="Find Products"
      illustration={heroIllustration}
      illustrationAlt="Person shopping online with a laptop"
      initialQuery={q ?? ""}
      isLiveMarketplace={true}
    />
  );
}
