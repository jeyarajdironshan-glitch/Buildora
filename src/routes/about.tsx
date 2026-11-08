import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/components/site/SiteHeader";

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
  return (
    <PublicPage title="About Buildora" kicker="Who we are">
      <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
        <p>Buildora helps Sri Lankan families plan homes with confidence. We combine AI-assisted floor planning, 3D visualisation and transparent, quantity-based cost estimates.</p>
        <p>Our marketplace connects homeowners with verified construction companies, so every quotation starts from the same clear design and bill of quantities.</p>
      </div>
    </PublicPage>
  );
}
