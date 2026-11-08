import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/SiteHeader";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password – Buildora" },
      { name: "description", content: "Choose a new password for your Buildora account." },
      { property: "og:title", content: "Reset password – Buildora" },
      { property: "og:description", content: "Choose a new password for your Buildora account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (p.length < 8) return toast.error("Password must be at least 8 characters");
    if (p !== c) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold">Set a new password</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div className="grid gap-1.5"><Label>New password</Label><Input type="password" value={p} onChange={(e) => setP(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label>Confirm password</Label><Input type="password" value={c} onChange={(e) => setC(e.target.value)} /></div>
        <Button disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
      </form>
    </div>
  );
}
