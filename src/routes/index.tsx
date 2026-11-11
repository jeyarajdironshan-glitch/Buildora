import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, Calculator, Building2, Sparkles, PenTool, ShieldCheck, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import hero from "@/assets/hero-house.jpg";
import { useT, type MsgKey } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buildora – Your Dream Home Starts With a Smarter Plan" },
      { name: "description", content: "Design your home with AI, explore it in 3D, understand construction costs and connect with trusted builders across Sri Lanka." },
      { property: "og:title", content: "Buildora – Imagine. Design. Build." },
      { property: "og:description", content: "AI floor plans, 3D homes and Sri Lankan construction cost estimates in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = [1, 2, 3, 4, 5].map((n) => ({ n: `0${n}`, t: `step${n}_t`, d: `step${n}_d` }) as { n: string; t: MsgKey; d: MsgKey });

const FEATURES = [Sparkles, PenTool, Box, Calculator, Building2, ShieldCheck].map((i, k) => ({ i, t: `feat${k + 1}_t`, d: `feat${k + 1}_d` }) as { i: typeof Sparkles; t: MsgKey; d: MsgKey });

const FAQ = [1, 2, 3, 4].map((n) => [`faq${n}_q`, `faq${n}_a`] as [MsgKey, MsgKey]);

const QUOTES: [string, string, MsgKey][] = [["Nimal P.", "Kandy", "quote1"], ["Ayesha R.", "Colombo", "quote2"], ["Kasun W.", "Galle", "quote3"]];

function Index() {
  const { t } = useT();
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[92vh] overflow-hidden">
        <img src={hero} alt="Modern tropical two-storey house in Sri Lanka" width={1600} height={1008} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <SiteHeader overlay />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-5 pb-20 pt-32">
          <p className="animate-rise font-mono text-xs uppercase tracking-[0.3em] text-gold">{t("tagline")}</p>
          <h1 className="animate-rise mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] text-navy-foreground md:text-6xl">{t("hero_title")}</h1>
          <p className="animate-rise mt-5 max-w-2xl text-lg text-navy-foreground/80">{t("hero_body")}</p>
          <div className="animate-rise mt-8 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg" className="h-auto min-h-11 max-w-full whitespace-normal py-2 text-center"><Link to="/auth" search={{ mode: "signup" }}>{t("start_designing")} <ArrowRight /></Link></Button>
            <Button asChild variant="glass" size="lg" className="h-auto min-h-11 max-w-full whitespace-normal py-2 text-center"><Link to="/how-it-works">{t("explore_how")}</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">{t("how_kicker")}</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-extrabold md:text-4xl">{t("how_title")}</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
              <span className="font-mono text-sm text-gold">{s.n}</span>
              <h3 className="mt-3 font-bold">{t(s.t)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(s.d)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-5">
          <p className="font-mono text-xs uppercase tracking-widest text-gold">{t("features_kicker")}</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold md:text-4xl">{t("features_title")}</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-navy-foreground/10 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.t} className="bg-navy p-7">
                <f.i className="size-6 text-gold" />
                <h3 className="mt-4 text-lg font-bold">{t(f.t)}</h3>
                <p className="mt-2 text-sm text-navy-foreground/70">{t(f.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 md:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">2D ⇄ 3D</p>
          <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">{t("sync_title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("sync_body")}</p>
          <div className="mt-6 grid grid-cols-3 gap-3 font-mono text-sm">
            {([["4", "stat_layouts"], ["LKR", "stat_rates"], ["25", "stat_districts"]] as [string, MsgKey][]).map(([a, b]) => (
              <div key={b} className="rounded-lg border bg-card p-4"><div className="text-2xl font-medium text-primary">{a}</div><div className="text-xs text-muted-foreground">{t(b)}</div></div>
            ))}
          </div>
        </div>
        <div className="blueprint-grid rounded-2xl border bg-card p-6 shadow-soft">
          <svg viewBox="0 0 300 200" className="w-full">
            {[[10,10,120,90,"Living"],[130,10,80,90,"Kitchen"],[210,10,80,90,"Dining"],[10,100,100,90,"Bedroom"],[110,100,60,90,"Stairs"],[170,100,120,90,"Master"]].map(([x,y,w,h,n]) => (
              <g key={n as string}>
                <rect x={x as number} y={y as number} width={w as number} height={h as number} fill="var(--plan-public)" stroke="var(--navy)" strokeWidth="2" />
                <text x={(x as number) + 8} y={(y as number) + 18} fontSize="10" fill="var(--navy)" fontFamily="Manrope" fontWeight="700">{n}</text>
              </g>
            ))}
          </svg>
        </div>
      </section>

      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">{t("testimonials")}</p>
              <h2 className="mt-2 text-3xl font-extrabold">{t("testimonials_title")}</h2>
            </div>
            <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">{t("sample_note")}</span>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {QUOTES.map(([n, d, q]) => (
              <figure key={n} className="rounded-xl bg-card p-6 shadow-soft">
                <blockquote className="text-sm">“{t(q)}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-2 text-sm font-semibold">{n}<span className="flex items-center gap-1 font-normal text-muted-foreground"><MapPin className="size-3" />{d}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-24">
        <h2 className="text-3xl font-extrabold">{t("faq_title")}</h2>
        <Accordion type="single" collapsible className="mt-8">
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left">{t(q)}</AccordionTrigger><AccordionContent className="text-muted-foreground">{t(a)}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
        <div className="mt-14 rounded-2xl bg-emerald-gradient p-10 text-center text-primary-foreground">
          <h3 className="text-2xl font-extrabold">{t("cta_title")}</h3>
          <Button asChild variant="gold" size="lg" className="mt-6"><Link to="/auth" search={{ mode: "signup" }}>{t("start_designing")}</Link></Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
