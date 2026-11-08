import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/site/SiteHeader";
import { DISTRICTS } from "@/lib/buildora/types";
import hero from "@/assets/hero-house.jpg";

type Mode = "signin" | "signup" | "forgot";
export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode } => ({
    mode: s.mode === "signup" || s.mode === "forgot" ? (s.mode as Mode) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or register – Buildora" },
      { name: "description", content: "Sign in or create a Buildora customer or construction company account." },
      { property: "og:title", content: "Sign in – Buildora" },
      { property: "og:description", content: "Customer and construction company accounts for Buildora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const pw = z.string().min(8, "Password must be at least 8 characters").max(72);
const customerSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^(\+94|0)\d{9}$/, "Enter a Sri Lankan mobile number, e.g. 0771234567"),
  password: pw,
  confirm: z.string(),
  district: z.string().min(1, "Choose your district"),
  language: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });
const companySchema = z.object({
  company_name: z.string().trim().min(2, "Enter company name").max(150),
  registration_number: z.string().trim().min(3, "Enter registration number").max(50),
  full_name: z.string().trim().min(2, "Enter contact person").max(100),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^(\+94|0)\d{9}$/, "Enter a valid Sri Lankan phone number"),
  address: z.string().trim().min(5, "Enter business address").max(300),
  service_districts: z.array(z.string()).min(1, "Pick at least one service district"),
  password: pw,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(initial ?? "signin");
  const [kind, setKind] = useState<"customer" | "company">("customer");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [f, setF] = useState<Record<string, string>>({ language: "English", district: "" });
  const [districts, setDistricts] = useState<string[]>([]);
  const navigate = useNavigate();
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { setMode(initial ?? "signin"); }, [initial]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/dashboard", replace: true }); });
  }, [navigate]);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: f.email ?? "", password: f.password ?? "" });
    if (error) throw error;
    navigate({ to: "/dashboard" });
  };

  const signUp = async () => {
    let meta: Record<string, unknown>;
    if (kind === "customer") {
      const p = customerSchema.safeParse(f);
      if (!p.success) throw new Error(p.error.issues[0].message);
      meta = { account_type: "customer", full_name: p.data.full_name, phone: p.data.phone, district: p.data.district, language: p.data.language };
    } else {
      const p = companySchema.safeParse({ ...f, service_districts: districts });
      if (!p.success) throw new Error(p.error.issues[0].message);
      meta = { account_type: "company", full_name: p.data.full_name, phone: p.data.phone, company_name: p.data.company_name, registration_number: p.data.registration_number, district: p.data.address, service_districts: p.data.service_districts };
    }
    const { error } = await supabase.auth.signUp({
      email: f.email!.trim(),
      password: f.password!,
      options: { emailRedirectTo: window.location.origin + "/dashboard", data: meta },
    });
    if (error) throw error;
    setSent(f.email!.trim());
  };

  const forgot = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(f.email ?? "", { redirectTo: `${window.location.origin}/reset-password` });
    if (error) throw error;
    toast.success("Check your email for a reset link.");
  };

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") await signIn(); else if (mode === "signup") await signUp(); else await forgot();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={hero} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute bottom-12 left-12 right-12 text-navy-foreground">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">Imagine. Design. Build.</p>
          <h2 className="mt-3 text-4xl font-extrabold">Plan smarter. Build with confidence.</h2>
        </div>
      </div>
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {sent ? (
            <div className="text-center animate-rise">
              <MailCheck className="mx-auto size-12 text-primary" />
              <h1 className="mt-4 text-2xl font-extrabold">Confirm your email</h1>
              <p className="mt-2 text-muted-foreground">We sent a confirmation link to <b>{sent}</b>. Click it to activate your account, then sign in.</p>
              <Button variant="outline" className="mt-6" onClick={() => { setSent(null); setMode("signin"); }}>Back to sign in</Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold">{mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{mode === "signup" ? "Choose the account type that fits you." : mode === "signin" ? "Customers and construction companies sign in here." : "We'll email you a secure reset link."}</p>
              {mode !== "forgot" && (
                <Tabs value={kind} onValueChange={(v) => setKind(v as "customer" | "company")} className="mt-6">
                  <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="customer">Homeowner</TabsTrigger><TabsTrigger value="company">Construction company</TabsTrigger></TabsList>
                </Tabs>
              )}
              <form onSubmit={submit} className="mt-6 grid gap-4">
                {mode === "signup" && kind === "company" && (
                  <>
                    <Field label="Company name"><Input value={f.company_name ?? ""} onChange={set("company_name")} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Registration no."><Input value={f.registration_number ?? ""} onChange={set("registration_number")} /></Field>
                      <Field label="Contact person"><Input value={f.full_name ?? ""} onChange={set("full_name")} /></Field>
                    </div>
                    <Field label="Business address"><Input value={f.address ?? ""} onChange={set("address")} /></Field>
                    <Field label="Service districts">
                      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-auto rounded-md border p-2">
                        {DISTRICTS.map((d) => (
                          <button type="button" key={d} onClick={() => setDistricts(districts.includes(d) ? districts.filter((x) => x !== d) : [...districts, d])}
                            className={`rounded-full border px-2 py-0.5 text-xs ${districts.includes(d) ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{d}</button>
                        ))}
                      </div>
                    </Field>
                    <p className="text-xs text-muted-foreground">You can upload your business registration document from your dashboard after confirming your email.</p>
                  </>
                )}
                {mode === "signup" && kind === "customer" && (
                  <Field label="Full name"><Input value={f.full_name ?? ""} onChange={set("full_name")} /></Field>
                )}
                <Field label="Email"><Input type="email" autoComplete="email" value={f.email ?? ""} onChange={set("email")} /></Field>
                {mode === "signup" && (
                  <Field label={kind === "company" ? "Phone" : "Mobile number"}><Input placeholder="0771234567" value={f.phone ?? ""} onChange={set("phone")} /></Field>
                )}
                {mode === "signup" && kind === "customer" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="District">
                      <Select value={f.district} onValueChange={(v) => setF({ ...f, district: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Language">
                      <Select value={f.language} onValueChange={(v) => setF({ ...f, language: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["English", "Sinhala", "Tamil"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>
                )}
                {mode !== "forgot" && <Field label="Password"><Input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={f.password ?? ""} onChange={set("password")} /></Field>}
                {mode === "signup" && kind === "customer" && <Field label="Confirm password"><Input type="password" value={f.confirm ?? ""} onChange={set("confirm")} /></Field>}
                <Button disabled={busy} size="lg">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}</Button>
              </form>
              <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm">
                {mode === "signin" ? (
                  <>
                    <button className="text-primary" onClick={() => setMode("signup")}>Create an account</button>
                    <button className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>
                  </>
                ) : (
                  <button className="text-primary" onClick={() => setMode("signin")}>Already have an account? Sign in</button>
                )}
              </div>
              <p className="mt-8 text-xs text-muted-foreground">By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}
