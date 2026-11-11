import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { PublicPage } from "@/components/site/SiteHeader";
import { useT, type MsgKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact – Buildora" },
      { name: "description", content: "Get in touch with the Buildora team." },
      { property: "og:title", content: "Contact – Buildora" },
      { property: "og:description", content: "Get in touch with the Buildora team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "v_name").max(100),
  email: z.string().trim().email("v_email").max(255),
  message: z.string().trim().min(1, "v_message").max(2000),
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const { t } = useT();
  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const p = schema.safeParse(form);
    if (!p.success) return toast.error(t(p.error.issues[0].message as MsgKey));
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert(p.data);
    setBusy(false);
    if (error) return toast.error(t("contact_failed"));
    toast.success(t("contact_sent"));
    setForm({ name: "", email: "", message: "" });
  };
  return (
    <PublicPage title={t("contact_title")} kicker={t("contact_kicker")}>
      <form onSubmit={submit} className="grid max-w-xl gap-4">
        <div className="grid gap-2"><Label>{t("name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid gap-2"><Label>{t("email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="grid gap-2"><Label>{t("message")}</Label><Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
        <Button disabled={busy} className="w-fit">{busy ? t("sending") : t("send_message")}</Button>
      </form>
    </PublicPage>
  );
}
