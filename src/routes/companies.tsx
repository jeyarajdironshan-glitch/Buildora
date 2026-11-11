import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PublicPage } from "@/components/site/SiteHeader";
import { useT } from "@/lib/i18n";

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
  const { t } = useT();
  return (
    <PublicPage title={t("companies_title")} kicker={t("companies_kicker")}>
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>{t("cp1")}</p>
        <p>{t("cp2")}</p>
        <p>{t("cp3")}</p>
      </div>
      <Button asChild size="lg" className="mt-8"><Link to="/auth" search={{ mode: "signup", kind: "company" }}>{t("cp_cta")}</Link></Button>
    </PublicPage>
  );
}
