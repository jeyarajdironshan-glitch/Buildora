import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions – Buildora" },
      { name: "description", content: "Buildora floor plans and estimates are concept tools, not approved architectural or structural drawings." },
      { property: "og:title", content: "Terms & Conditions – Buildora" },
      { property: "og:description", content: "Buildora floor plans and estimates are concept tools, not approved architectural or structural drawings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicPage title="Terms & Conditions" kicker="Legal">
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>Buildora floor plans and estimates are concept tools, not approved architectural or structural drawings.</p>
        <p>Final designs must be certified by qualified professionals and approved by the relevant local authority.</p>
        <p>Quotations are offers between you and the construction company; Buildora is not a party to construction contracts.</p>
      </div>
    </PublicPage>
  );
}
