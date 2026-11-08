import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy – Buildora" },
      { name: "description", content: "We collect the account, land and design information you provide to deliver the service." },
      { property: "og:title", content: "Privacy Policy – Buildora" },
      { property: "og:description", content: "We collect the account, land and design information you provide to deliver the service." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicPage title="Privacy Policy" kicker="Legal">
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>We collect the account, land and design information you provide to deliver the service.</p>
        <p>Published projects are visible only to registered construction companies. Contact details are shared only with companies you select.</p>
        <p>You can request deletion of your account and data by contacting us.</p>
      </div>
    </PublicPage>
  );
}
