import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV = [
  { to: "/how-it-works", key: "nav_how" },
  { to: "/features", key: "nav_features" },
  { to: "/companies", key: "nav_companies" },
  { to: "/about", key: "nav_about" },
  { to: "/contact", key: "nav_contact" },
] as const;

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-lg bg-emerald-gradient font-display text-sm font-extrabold text-primary-foreground">B</span>
      <span className={cn("font-display text-lg font-extrabold tracking-tight", light ? "text-navy-foreground" : "text-foreground")}>BUILDORA</span>
    </Link>
  );
}

export function SiteHeader({ overlay }: { overlay?: boolean }) {
  const { user } = useUser();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <header className={cn("z-40 w-full", overlay ? "absolute inset-x-0 top-0" : "sticky top-0 border-b bg-background/85 backdrop-blur")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
        <Logo light={overlay} />
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={cn("text-sm font-medium transition-colors", overlay ? "text-navy-foreground/80 hover:text-navy-foreground" : "text-muted-foreground hover:text-foreground")} activeProps={{ className: overlay ? "text-navy-foreground" : "text-foreground" }}>
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher overlay={overlay} />
          {user ? (
            <>
              <Button asChild variant={overlay ? "glass" : "outline"} size="sm"><Link to="/dashboard">{t("dashboard")}</Link></Button>
              <Button variant={overlay ? "glass" : "ghost"} size="sm" onClick={signOut}>{t("sign_out")}</Button>
            </>
          ) : (
            <>
              <Button asChild variant={overlay ? "glass" : "ghost"} size="sm"><Link to="/auth">{t("sign_in")}</Link></Button>
              <Button asChild variant={overlay ? "gold" : "default"} size="sm"><Link to="/auth" search={{ mode: "signup" }}>{t("start_designing")}</Link></Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher overlay={overlay} />
          <button className={cn(overlay && "text-navy-foreground")} onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t bg-background px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {NAV.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="text-sm font-medium">{t(n.key)}</Link>)}
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-semibold text-primary">{t("dashboard")}</Link>
                <button onClick={signOut} className="text-left text-sm">{t("sign_out")}</button>
              </>
            ) : (
              <Link to="/auth" className="text-sm font-semibold text-primary">{t("sign_in_register")}</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-3 max-w-sm text-sm text-navy-foreground/70">{t("footer_tagline")}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-navy-foreground/70">
          <span className="font-display font-bold text-navy-foreground">{t("footer_platform")}</span>
          <Link to="/how-it-works">{t("nav_how")}</Link>
          <Link to="/features">{t("nav_features")}</Link>
          <Link to="/companies">{t("footer_companies")}</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm text-navy-foreground/70">
          <span className="font-display font-bold text-navy-foreground">{t("footer_company")}</span>
          <Link to="/about">{t("footer_about")}</Link>
          <Link to="/contact">{t("nav_contact")}</Link>
          <Link to="/privacy">{t("footer_privacy")}</Link>
          <Link to="/terms">{t("footer_terms")}</Link>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10 py-5 text-center text-xs text-navy-foreground/50">© {new Date().getFullYear()} Buildora. {t("footer_rights")}</div>
    </footer>
  );
}

export function PublicPage({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="blueprint-grid border-b">
        <div className="mx-auto max-w-4xl px-5 py-16 animate-rise">
          {kicker && <p className="font-mono text-xs uppercase tracking-widest text-primary">{kicker}</p>}
          <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">{title}</h1>
        </div>
      </section>
      <main className="mx-auto max-w-4xl px-5 py-14">{children}</main>
      <SiteFooter />
    </div>
  );
}
