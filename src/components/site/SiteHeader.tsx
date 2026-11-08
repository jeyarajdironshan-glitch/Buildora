import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/how-it-works", label: "How It Works" },
  { to: "/features", label: "Features" },
  { to: "/companies", label: "Companies" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Logo light={overlay} />
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={cn("text-sm font-medium transition-colors", overlay ? "text-navy-foreground/80 hover:text-navy-foreground" : "text-muted-foreground hover:text-foreground")} activeProps={{ className: overlay ? "text-navy-foreground" : "text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button asChild variant={overlay ? "glass" : "outline"} size="sm"><Link to="/dashboard">Dashboard</Link></Button>
              <Button variant={overlay ? "glass" : "ghost"} size="sm" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild variant={overlay ? "glass" : "ghost"} size="sm"><Link to="/auth">Sign in</Link></Button>
              <Button asChild variant={overlay ? "gold" : "default"} size="sm"><Link to="/auth" search={{ mode: "signup" }}>Start Designing</Link></Button>
            </>
          )}
        </div>
        <button className={cn("md:hidden", overlay && "text-navy-foreground")} onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-background px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="text-sm font-medium">{n.label}</Link>)}
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-semibold text-primary">Dashboard</Link>
                <button onClick={signOut} className="text-left text-sm">Sign out</button>
              </>
            ) : (
              <Link to="/auth" className="text-sm font-semibold text-primary">Sign in / Register</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-3 max-w-sm text-sm text-navy-foreground/70">Imagine. Design. Build. AI-assisted house design and construction marketplace for Sri Lanka.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-navy-foreground/70">
          <span className="font-display font-bold text-navy-foreground">Platform</span>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/features">Features</Link>
          <Link to="/companies">Construction Companies</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm text-navy-foreground/70">
          <span className="font-display font-bold text-navy-foreground">Company</span>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10 py-5 text-center text-xs text-navy-foreground/50">© {new Date().getFullYear()} Buildora. All rights reserved.</div>
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
