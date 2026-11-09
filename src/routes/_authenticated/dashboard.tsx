import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, FileUp, ShieldCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/session";
import { AppShell, Empty } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_FINISHES, DEFAULT_LAND, DEFAULT_REQ } from "@/lib/buildora/types";
import { lkr } from "@/lib/buildora/units";
import { CompanyMarket } from "@/components/app/CompanyMarket";
import { AdminPanel } from "@/components/app/AdminPanel";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard – Buildora" }, { name: "description", content: "Your Buildora workspace." }, { property: "og:title", content: "Dashboard – Buildora" }, { property: "og:description", content: "Manage your house projects and construction quotations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { account, ready } = useAccount();
  if (!ready || !account) return <AppShell title="Loading…"><Skeleton className="h-40 w-full" /></AppShell>;
  if (account.role === "admin") return <AdminPanel />;
  if (account.role === "company") return <CompanyDashboard />;
  return <CustomerDashboard name={account.profile?.full_name ?? ""} />;
}

function CustomerDashboard({ name }: { name: string }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("projects").select("id,name,status,estimate,updated_at,land").eq("owner_id", u.user!.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const create = async () => {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: p, error } = await supabase.from("projects").insert({ owner_id: u.user!.id, name: "My New Home", land: DEFAULT_LAND as never, requirements: DEFAULT_REQ as never, finishes: DEFAULT_FINISHES as never }).select("id").single();
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/projects/$id", params: { id: p.id } });
  };
  return (
    <AppShell title={`Welcome${name ? ", " + name.split(" ")[0] : ""}`} subtitle="Your house projects" actions={<Button onClick={create} disabled={busy}><Plus /> New project</Button>}>
      {isLoading ? <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}</div> : !data?.length ? (
        <Empty title="No projects yet" body="Start with your land details and let Buildora generate four floor plans for you." action={<Button onClick={create} disabled={busy}><Plus /> Start designing</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {data.map((p) => {
            const est = p.estimate as { total?: number } | null;
            return (
              <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="group rounded-xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-start justify-between"><h3 className="font-bold group-hover:text-primary">{p.name}</h3><Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge></div>
                <p className="mt-3 font-mono text-xs text-muted-foreground">{(p.land as { district?: string })?.district}</p>
                <p className="mt-4 font-mono text-sm">{est?.total ? lkr(est.total) : "No estimate yet"}</p>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function CompanyDashboard() {
  const { account } = useAccount();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const p = account?.profile;
  const upload = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) return toast.error("File must be under 20 MB");
    setUploading(true);
    const path = `${p!.id}/registration-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (!error) await supabase.from("profiles").update({ verification_doc: path, verification_status: "pending" }).eq("id", p!.id);
    setUploading(false);
    if (error) return toast.error(error.message);
    toast.success("Document uploaded. Verification request submitted.");
    qc.invalidateQueries({ queryKey: ["account"] });
  };
  return (
    <AppShell title={p?.company_name ?? "Company"} subtitle={<span className="font-mono">Reg. {p?.registration_number}</span>}>
      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-xl border bg-card p-5 shadow-soft">
        {p?.verified ? <ShieldCheck className="size-8 text-primary" /> : <Clock className="size-8 text-gold" />}
        <div className="flex-1">
          <p className="font-bold">{p?.verified ? "Verified company" : p?.verification_status === "pending" ? "Verification pending review" : p?.verification_status === "rejected" ? "Verification rejected – upload a new document" : "Not verified yet"}</p>
          <p className="text-sm text-muted-foreground">{p?.verified ? "You can submit official quotations." : "Upload your business registration document. Only verified companies can submit quotations."}</p>
        </div>
        {!p?.verified && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">
            <FileUp className="size-4" /> {uploading ? "Uploading…" : "Upload document"}
            <input type="file" accept=".pdf,image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        )}
      </div>
      <CompanyMarket verified={!!p?.verified} />
    </AppShell>
  );
}
