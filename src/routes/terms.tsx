import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";
import { useT } from "@/lib/i18n";

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
  const { t } = useT();
  return (
    <PublicPage title={t("footer_terms")} kicker={t("legal")}>
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>{t("terms_p1")}</p>
        <p>{t("terms_p2")}</p>
        <p>{t("terms_p3")}</p>
      </div>
    </PublicPage>
  );
}
