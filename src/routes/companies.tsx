import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";

export const Route = createFileRoute("/companies")({
  head: () => ({
    meta: [
      { title: "Construction Companies – Buildora" },
      { name: "description", content: "Register your company, submit your business registration number, and get verified by the Buildora team." },
      { property: "og:title", content: "Construction Companies – Buildora" },
      { property: "og:description", content: "Register your company, submit your business registration number, and get verified by the Buildora team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  return (
    <PublicPage title="For Construction Companies" kicker="Partners">
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>Register your company, submit your business registration number, and get verified by the Buildora team.</p>
        <p>Once verified, browse published projects in your service districts, review 2D/3D designs and estimates, and submit official quotations.</p>
        <p>Unverified companies can browse but cannot submit quotations.</p>
      </div>
    </PublicPage>
  );
}
