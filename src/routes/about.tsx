import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us – Buildora" },
      { name: "description", content: "Buildora helps Sri Lankan families plan homes with confidence. We combine AI-assisted floor planning, 3D visualisation and transparent, quantity-based" },
      { property: "og:title", content: "About Us – Buildora" },
      { property: "og:description", content: "Buildora helps Sri Lankan families plan homes with confidence. We combine AI-assisted floor planning, 3D visualisation and transparent, quantity-based" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useT();
  return (
    <PublicPage title={t("about_title")} kicker={t("about_kicker")}>
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>{t("about_p1")}</p>
        <p>{t("about_p2")}</p>
      </div>
    </PublicPage>
  );
}
