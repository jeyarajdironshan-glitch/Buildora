import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";
import { useT } from "@/lib/i18n";

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
  const { t } = useT();
  return (
    <PublicPage title={t("features_page_title")} kicker={t("features_kicker")}>
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>{t("fp1")}</p>
        <p>{t("fp2")}</p>
        <p>{t("fp3")}</p>
        <p>{t("fp4")}</p>
        <p>{t("fp5")}</p>
        <p>{t("fp6")}</p>
      </div>
    </PublicPage>
  );
}
