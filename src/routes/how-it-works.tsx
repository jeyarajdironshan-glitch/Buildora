import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";
import { useT } from "@/lib/i18n";

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
  const { t } = useT();
  return (
    <PublicPage title={t("how_page_title")} kicker={t("how_page_kicker")}>
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>{t("hp1")}</p>
        <p>{t("hp2")}</p>
        <p>{t("hp3")}</p>
        <p>{t("hp4")}</p>
        <p>{t("hp5")}</p>
      </div>
    </PublicPage>
  );
}
