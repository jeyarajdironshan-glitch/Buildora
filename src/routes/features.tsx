import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features – Buildora" },
      { name: "description", content: "AI requirement understanding – plain-language briefs become structured room lists." },
      { property: "og:title", content: "Features – Buildora" },
      { property: "og:description", content: "AI requirement understanding – plain-language briefs become structured room lists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <PublicPage title="Platform Features" kicker="Features">
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>AI requirement understanding – plain-language briefs become structured room lists.</p>
        <p>Four layout strategies: Linear Flow, Side Zoning, Garden Court and Service Front.</p>
        <p>2D editor with drag, resize, snapping, live dimensions and overlap warnings.</p>
        <p>3D house view with customisable wall, roof and floor finishes.</p>
        <p>Quantity-based cost estimation with Sri Lankan reference rates and regional factors.</p>
        <p>Marketplace with verified companies, quotations and comparisons.</p>
      </div>
    </PublicPage>
  );
}
