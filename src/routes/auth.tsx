import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { DISTRICTS } from "@/lib/buildora/types";
import { LANGS, langFromProfile, useT, type MsgKey } from "@/lib/i18n";
import { signInKindError } from "@/lib/account";
import hero from "@/assets/hero-house.jpg";

type Mode = "signin" | "signup" | "forgot";
type Kind = "customer" | "company";
export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode; kind?: Kind } => ({
    mode: s.mode === "signup" || s.mode === "forgot" ? (s.mode as Mode) : undefined,
    kind: s.kind === "company" ? "company" : undefined,
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

// Messages are translation keys so errors show in the chosen language.
const phone = z.string().transform((v) => v.replace(/[\s-]/g, "")).pipe(z.string().regex(/^(\+94|0)\d{9}$/, "v_phone"));
const pw = z.string().min(8, "v_password_len").max(72);
const customerSchema = z.object({
  full_name: z.string().trim().min(2, "v_full_name").max(100),
  email: z.string().trim().email("v_email"),
  phone,
  password: pw,
  confirm: z.string(),
  district: z.string().min(1, "v_district"),
  language: z.string(),
}).refine((d) => d.password === d.confirm, { message: "v_password_match", path: ["confirm"] });
const companySchema = z.object({
  company_name: z.string().trim().min(2, "v_company_name").max(150),
  registration_number: z.string().trim().min(2, "v_reg_no").max(50),
  full_name: z.string().trim().min(2, "v_contact").max(100),
  email: z.string().trim().email("v_email"),
  phone,
  address: z.string().trim().min(3, "v_address").max(300),
  service_districts: z.array(z.string()).min(1, "v_service_districts"),
  password: pw,
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "v_password_match", path: ["confirm"] });

class KeyedError extends Error {
  constructor(public key: MsgKey) { super(key); }
}

function AuthPage() {
  const { mode: initial, kind: initialKind } = Route.useSearch();
  const { t, lang, setLang } = useT();
  const [mode, setMode] = useState<Mode>(initial ?? "signin");
  const [kind, setKind] = useState<Kind>(initialKind ?? "customer");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [f, setF] = useState<Record<string, string>>({ district: "" });
  const [districts, setDistricts] = useState<string[]>([]);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const language = LANGS.find((l) => l.code === lang)?.profile ?? "English";

  useEffect(() => { setMode(initial ?? "signin"); }, [initial]);
  useEffect(() => { if (initialKind) setKind(initialKind); }, [initialKind]);
  // Show who is signed in instead of silently forwarding, so a second account can be used.
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrent(data.user?.email ?? null));
  }, []);
  const switchAccount = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    setCurrent(null);
  };

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: (f.email ?? "").trim(), password: f.password ?? "" });
    if (error) {
      if (error.code === "invalid_credentials") throw new KeyedError("err_bad_login");
      if (error.code === "email_not_confirmed") throw new KeyedError("err_not_confirmed");
      throw error;
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const wrong = signInKindError(kind, (roles ?? []).map((r) => r.role));
    if (wrong) {
      await supabase.auth.signOut();
      throw new KeyedError(wrong);
    }
    qc.clear();
    navigate({ to: "/dashboard" });
  };

  const signUp = async () => {
    let meta: Record<string, unknown>;
    if (kind === "customer") {
      const p = customerSchema.safeParse({ ...f, language });
      if (!p.success) throw new KeyedError(p.error.issues[0].message as MsgKey);
      meta = { account_type: "customer", full_name: p.data.full_name, phone: p.data.phone, district: p.data.district, language: p.data.language };
    } else {
      const p = companySchema.safeParse({ ...f, service_districts: districts });
      if (!p.success) throw new KeyedError(p.error.issues[0].message as MsgKey);
      meta = { account_type: "company", full_name: p.data.full_name, phone: p.data.phone, company_name: p.data.company_name, registration_number: p.data.registration_number, district: p.data.address, service_districts: p.data.service_districts, language };
    }
    const email = f.email!.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: f.password!,
      options: { emailRedirectTo: window.location.origin + "/dashboard", data: meta },
    });
    if (error) {
      if (error.code === "user_already_exists") throw new KeyedError("err_email_exists");
      if (error.code === "weak_password") throw new KeyedError("err_weak_password");
      throw error;
    }
    // An already-registered email returns a user with no identities and no email is sent.
    if (data.user && (data.user.identities?.length ?? 0) === 0) throw new KeyedError("err_email_exists");
    setSent(email);
  };

  const forgot = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail((f.email ?? "").trim(), { redirectTo: `${window.location.origin}/reset-password` });
    if (error) throw error;
    toast.success(t("reset_sent"));
  };

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") await signIn(); else if (mode === "signup") await signUp(); else await forgot();
    } catch (err) {
      toast.error(err instanceof KeyedError ? t(err.key) : err instanceof Error ? err.message : t("err_generic"));
    } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={hero} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute bottom-12 left-12 right-12 text-navy-foreground">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{t("tagline")}</p>
          <h2 className="mt-3 text-4xl font-extrabold">{t("auth_hero_title")}</h2>
        </div>
      </div>
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between gap-3"><Logo /><LanguageSwitcher /></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {current ? (
            <div className="text-center animate-rise">
              <p className="text-muted-foreground">{t("signed_in_as")}</p>
              <p className="mt-1 break-all font-semibold">{current}</p>
              <div className="mt-6 flex flex-col gap-3">
                <Button size="lg" onClick={() => navigate({ to: "/dashboard" })}>{t("go_to_dashboard")}</Button>
                <Button size="lg" variant="outline" onClick={switchAccount}>{t("use_other_account")}</Button>
              </div>
            </div>
          ) : sent ? (
            <div className="text-center animate-rise">
              <MailCheck className="mx-auto size-12 text-primary" />
              <h1 className="mt-4 text-2xl font-extrabold">{t("confirm_title")}</h1>
              <p className="mt-2 text-muted-foreground">{t("confirm_sent_to")}</p>
              <p className="mt-1 font-semibold">{sent}</p>
              <p className="mt-2 text-muted-foreground">{t("confirm_next")}</p>
              <Button variant="outline" className="mt-6" onClick={() => { setSent(null); setMode("signin"); }}>{t("back_to_signin")}</Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold">{mode === "signin" ? t("welcome_back") : mode === "signup" ? t("create_account_title") : t("reset_title")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{mode === "signup" ? t("signup_sub") : mode === "signin" ? t("signin_sub") : t("forgot_sub")}</p>
              {mode !== "forgot" && (
                <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)} className="mt-6">
                  <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="customer">{t("homeowner")}</TabsTrigger><TabsTrigger value="company">{t("construction_company")}</TabsTrigger></TabsList>
                </Tabs>
              )}
              <form onSubmit={submit} className="mt-6 grid gap-4">
                {mode === "signup" && kind === "company" && (
                  <>
                    <Field label={t("company_name")}><Input value={f.company_name ?? ""} onChange={set("company_name")} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t("registration_no")}><Input value={f.registration_number ?? ""} onChange={set("registration_number")} /></Field>
                      <Field label={t("contact_person")}><Input value={f.full_name ?? ""} onChange={set("full_name")} /></Field>
                    </div>
                    <Field label={t("business_address")}><Input value={f.address ?? ""} onChange={set("address")} /></Field>
                    <Field label={t("service_districts")}>
                      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-auto rounded-md border p-2">
                        {DISTRICTS.map((d) => (
                          <button type="button" key={d} aria-pressed={districts.includes(d)} onClick={() => setDistricts(districts.includes(d) ? districts.filter((x) => x !== d) : [...districts, d])}
                            className={`rounded-full border px-2 py-0.5 text-xs ${districts.includes(d) ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{d}</button>
                        ))}
                      </div>
                    </Field>
                    <p className="text-xs text-muted-foreground">{t("company_doc_note")}</p>
                  </>
                )}
                {mode === "signup" && kind === "customer" && (
                  <Field label={t("full_name")}><Input value={f.full_name ?? ""} onChange={set("full_name")} /></Field>
                )}
                <Field label={t("email")}><Input type="email" autoComplete="email" value={f.email ?? ""} onChange={set("email")} /></Field>
                {mode === "signup" && (
                  <Field label={kind === "company" ? t("phone") : t("mobile")}><Input inputMode="tel" placeholder="0771234567" value={f.phone ?? ""} onChange={set("phone")} /></Field>
                )}
                {mode === "signup" && kind === "customer" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t("district")}>
                      <Select value={f.district} onValueChange={(v) => setF({ ...f, district: v })}>
                        <SelectTrigger><SelectValue placeholder={t("select")} /></SelectTrigger>
                        <SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label={t("language")}>
                      <Select value={language} onValueChange={(v) => setLang(langFromProfile(v) ?? "en")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{LANGS.map((l) => <SelectItem key={l.code} value={l.profile}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>
                )}
                {mode !== "forgot" && <Field label={t("password")}><Input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={f.password ?? ""} onChange={set("password")} /></Field>}
                {mode === "signup" && <Field label={t("confirm_password")}><Input type="password" autoComplete="new-password" value={f.confirm ?? ""} onChange={set("confirm")} /></Field>}
                <Button disabled={busy} size="lg">{busy ? t("please_wait") : mode === "signin" ? t("sign_in") : mode === "signup" ? t("create_account_btn") : t("send_reset")}</Button>
              </form>
              <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm">
                {mode === "signin" ? (
                  <>
                    <button className="text-primary" onClick={() => setMode("signup")}>{t("create_an_account")}</button>
                    <button className="text-muted-foreground" onClick={() => setMode("forgot")}>{t("forgot_password")}</button>
                  </>
                ) : (
                  <button className="text-primary" onClick={() => setMode("signin")}>{t("have_account")}</button>
                )}
              </div>
              <p className="mt-8 text-xs text-muted-foreground">{t("agree_pre")} <Link to="/terms" className="underline">{t("terms")}</Link> {t("agree_and")} <Link to="/privacy" className="underline">{t("footer_privacy")}</Link>{lang === "en" ? "" : " "}{t("agree_post")}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}
