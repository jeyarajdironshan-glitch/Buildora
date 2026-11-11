import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";
import { useT } from "@/lib/i18n";

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
  const { t } = useT();
  return (
    <PublicPage title={t("footer_privacy")} kicker={t("legal")}>
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>{t("privacy_p1")}</p>
        <p>{t("privacy_p2")}</p>
        <p>{t("privacy_p3")}</p>
      </div>
    </PublicPage>
  );
}
