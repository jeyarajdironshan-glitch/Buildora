import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, Calculator, Building2, Sparkles, PenTool, ShieldCheck, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import hero from "@/assets/hero-house.jpg";

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

const STEPS = [
  { n: "01", t: "Describe your land", d: "Enter plot size in feet, metres or perches, road side and site conditions." },
  { n: "02", t: "Tell us your needs", d: "Bedrooms, floors, style and budget – or simply describe your dream home." },
  { n: "03", t: "Pick from 4 AI plans", d: "Four distinct layouts that respect setbacks and room sizes." },
  { n: "04", t: "Edit, view in 3D, price it", d: "Refine the 2D plan, walk around in 3D and get a quantity-based estimate." },
  { n: "05", t: "Get quotations", d: "Publish to verified Sri Lankan construction companies and compare offers." },
];

const FEATURES = [
  { i: Sparkles, t: "AI requirement understanding", d: "Write what you want in plain words; Buildora turns it into a structured brief." },
  { i: PenTool, t: "Editable 2D drawings", d: "Move and resize rooms with live dimensions and overlap checks." },
  { i: Box, t: "Synchronised 3D", d: "Every 2D change rebuilds the 3D house instantly." },
  { i: Calculator, t: "Quantity-based costing", d: "Concrete, steel, masonry, finishes and labour at Sri Lankan rates with regional factors." },
  { i: Building2, t: "Construction marketplace", d: "Verified companies review your design and submit official quotations." },
  { i: ShieldCheck, t: "Verified builders only", d: "Companies must pass business registration checks before quoting." },
];

const FAQ = [
  ["Are the AI floor plans approved drawings?", "No. They are concept layouts to help you plan. Final drawings must be prepared and approved by a qualified architect and your local authority."],
  ["How accurate is the cost estimate?", "Estimates are calculated from real quantities of your design using reference Sri Lankan rates. Actual quotations vary with market prices, site conditions and specifications."],
  ["Which units can I use?", "Feet, metres, square feet and perches. Everything is stored internally in metres."],
  ["Who can quote on my project?", "Only construction companies verified by the Buildora team can submit official quotations."],
];

function Index() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[92vh] overflow-hidden">
        <img src={hero} alt="Modern tropical two-storey house in Sri Lanka" width={1600} height={1008} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <SiteHeader overlay />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-5 pb-20 pt-32">
          <p className="animate-rise font-mono text-xs uppercase tracking-[0.3em] text-gold">Imagine. Design. Build.</p>
          <h1 className="animate-rise mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] text-navy-foreground md:text-6xl">Your Dream Home Starts With a Smarter Plan.</h1>
          <p className="animate-rise mt-5 max-w-2xl text-lg text-navy-foreground/80">Design your home with AI, explore it in 3D, understand construction costs, and connect with trusted construction companies across Sri Lanka.</p>
          <div className="animate-rise mt-8 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg"><Link to="/auth" search={{ mode: "signup" }}>Start Designing <ArrowRight /></Link></Button>
            <Button asChild variant="glass" size="lg"><Link to="/how-it-works">Explore How It Works</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">How Buildora works</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-extrabold md:text-4xl">From a plot of land to builder quotations in five steps.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
              <span className="font-mono text-sm text-gold">{s.n}</span>
              <h3 className="mt-3 font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy py-24 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-5">
          <p className="font-mono text-xs uppercase tracking-widest text-gold">Features</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold md:text-4xl">Everything you need before you break ground.</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-navy-foreground/10 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.t} className="bg-navy p-7">
                <f.i className="size-6 text-gold" />
                <h3 className="mt-4 text-lg font-bold">{f.t}</h3>
                <p className="mt-2 text-sm text-navy-foreground/70">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 md:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">2D ⇄ 3D</p>
          <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Draw once. See it everywhere.</h2>
          <p className="mt-4 text-muted-foreground">Rooms you resize in the plan editor become walls, floors and roofs in 3D – and flow straight into your cost estimate.</p>
          <div className="mt-6 grid grid-cols-3 gap-3 font-mono text-sm">
            {[["4", "AI layouts"], ["LKR", "local rates"], ["25", "districts"]].map(([a, b]) => (
              <div key={b} className="rounded-lg border bg-card p-4"><div className="text-2xl font-medium text-primary">{a}</div><div className="text-xs text-muted-foreground">{b}</div></div>
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
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Testimonials</p>
              <h2 className="mt-2 text-3xl font-extrabold">What homeowners say</h2>
            </div>
            <span className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">Sample content for illustration</span>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[["Nimal P.", "Kandy", "Seeing four layouts side by side made the decision easy for our family."],["Ayesha R.", "Colombo", "The cost breakdown helped us talk to builders with real numbers."],["Kasun W.", "Galle", "Three quotations within a week, all from verified companies."]].map(([n, d, q]) => (
              <figure key={n} className="rounded-xl bg-card p-6 shadow-soft">
                <blockquote className="text-sm">“{q}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-2 text-sm font-semibold">{n}<span className="flex items-center gap-1 font-normal text-muted-foreground"><MapPin className="size-3" />{d}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-24">
        <h2 className="text-3xl font-extrabold">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-8">
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
        <div className="mt-14 rounded-2xl bg-emerald-gradient p-10 text-center text-primary-foreground">
          <h3 className="text-2xl font-extrabold">Ready to plan your home?</h3>
          <Button asChild variant="gold" size="lg" className="mt-6"><Link to="/auth" search={{ mode: "signup" }}>Start Designing</Link></Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
