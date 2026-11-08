import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works – Buildora" },
      { name: "description", content: "1. Register and add your land: width, length, shape, road side, terrain and restrictions." },
      { property: "og:title", content: "How It Works – Buildora" },
      { property: "og:description", content: "1. Register and add your land: width, length, shape, road side, terrain and restrictions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <PublicPage title="How Buildora Works" kicker="Process">
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>1. Register and add your land: width, length, shape, road side, terrain and restrictions.</p>
        <p>2. Enter your requirements with the wizard, or describe your home in plain words and let AI fill it in.</p>
        <p>3. Generate four floor plans. Each respects setbacks and keeps the staircase aligned between floors.</p>
        <p>4. Edit rooms in the 2D editor; the 3D model and estimate update automatically.</p>
        <p>5. Choose finishes, review the cost breakdown and publish to receive quotations from verified companies.</p>
      </div>
    </PublicPage>
  );
}
