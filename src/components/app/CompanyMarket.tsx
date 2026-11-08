import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty } from "@/components/app/AppShell";
import { PlanView } from "@/components/app/PlanEditor";
import { lkr, fmt, sqmToSqft } from "@/lib/buildora/units";
import type { Plan, Land } from "@/lib/buildora/types";
import type { Estimate } from "@/lib/buildora/cost";

export function CompanyMarket({ verified }: { verified: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState({ amount: "", duration: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const projects = useQuery({
    queryKey: ["market"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id,name,land,requirements,plans,selected_plan,estimate,updated_at").eq("status", "published").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const quotes = useQuery({
    queryKey: ["my-quotes"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("quotations").select("*").eq("company_id", u.user!.id);
      return data ?? [];
    },
  });
  const proj = projects.data?.find((p) => p.id === open);
  const plan = proj && (proj.plans as unknown as Plan[])[proj.selected_plan ?? 0];
  const mine = (id: string) => quotes.data?.find((x) => x.project_id === id);

  const submit = async () => {
    const amount = Number(q.amount);
    if (!(amount > 0)) return toast.error("Enter a valid quotation amount");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const existing = mine(open!);
    const payload = { amount, duration_months: Number(q.duration) || null, notes: q.notes.slice(0, 2000) };
    const { error } = existing
      ? await supabase.from("quotations").update(payload).eq("id", existing.id)
      : await supabase.from("quotations").insert({ ...payload, project_id: open!, company_id: u.user!.id });
    setBusy(false);
    if (error) return toast.error(error.message.includes("row-level") ? "Only verified companies can submit quotations." : error.message);
    toast.success(existing ? "Quotation updated" : "Quotation submitted");
    qc.invalidateQueries({ queryKey: ["my-quotes"] });
    setOpen(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold">Published projects</h2>
      <div className="mt-4">
        {!projects.data?.length ? <Empty title="No published projects yet" body="Projects appear here when homeowners publish them for quotations." /> : (
          <div className="grid gap-4 md:grid-cols-3">
            {projects.data.map((p) => {
              const land = p.land as unknown as Land;
              const est = p.estimate as unknown as Estimate | null;
              const m = mine(p.id);
              return (
                <button key={p.id} onClick={() => { setOpen(p.id); setQ({ amount: m ? String(m.amount) : "", duration: m?.duration_months ? String(m.duration_months) : "", notes: m?.notes ?? "" }); }} className="rounded-xl border bg-card p-5 text-left shadow-soft transition hover:shadow-lift">
                  <div className="flex justify-between"><h3 className="font-bold">{p.name}</h3>{m && <Badge>{m.status}</Badge>}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{land.district} · {land.location || "Location on request"}</p>
                  <p className="mt-3 font-mono text-sm">{est ? `${fmt(sqmToSqft(est.area), 0)} sq ft · est. ${lkr(est.total)}` : "–"}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{proj?.name}</DialogTitle></DialogHeader>
          {plan && <div className="max-h-72 overflow-auto rounded-lg border"><PlanView plan={plan} land={proj!.land as unknown as Land} floor={0} /></div>}
          {proj?.estimate && <p className="font-mono text-sm">Buildora estimate: {lkr((proj.estimate as unknown as Estimate).total)}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>Quotation amount (LKR)</Label><Input type="number" value={q.amount} onChange={(e) => setQ({ ...q, amount: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Duration (months)</Label><Input type="number" value={q.duration} onChange={(e) => setQ({ ...q, duration: e.target.value })} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Notes & inclusions</Label><Textarea value={q.notes} onChange={(e) => setQ({ ...q, notes: e.target.value })} /></div>
          {!verified && <p className="text-sm text-destructive">Your company must be verified before submitting quotations.</p>}
          <Button disabled={!verified || busy || (mine(open ?? "")?.status === "accepted")} onClick={submit}>{mine(open ?? "") ? "Update quotation" : "Submit quotation"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
