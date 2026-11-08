import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { lkr } from "@/lib/buildora/units";

export function AdminPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin"],
    queryFn: async () => {
      const [roles, profiles, projects, quotes, msgs] = await Promise.all([
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("profiles").select("*"),
        supabase.from("projects").select("id,name,status"),
        supabase.from("quotations").select("id,amount,status"),
        supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      return { roles: roles.data ?? [], profiles: profiles.data ?? [], projects: projects.data ?? [], quotes: quotes.data ?? [], msgs: msgs.data ?? [] };
    },
  });
  const companyIds = new Set(data?.roles.filter((r) => r.role === "company").map((r) => r.user_id));
  const companies = data?.profiles.filter((p) => companyIds.has(p.id)) ?? [];
  const decide = async (id: string, ok: boolean) => {
    const { error } = await supabase.from("profiles").update({ verified: ok, verification_status: ok ? "approved" : "rejected" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(ok ? "Company verified" : "Verification rejected");
    qc.invalidateQueries({ queryKey: ["admin"] });
  };
  const viewDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };
  const stats = [
    ["Customers", data?.roles.filter((r) => r.role === "customer").length],
    ["Companies", companies.length],
    ["Projects", data?.projects.length],
    ["Published", data?.projects.filter((p) => p.status === "published").length],
    ["Quotations", data?.quotes.length],
  ];
  return (
    <AppShell title="Admin" subtitle="Platform overview and company verification">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {stats.map(([k, v]) => <div key={k} className="rounded-xl border bg-card p-5 shadow-soft"><p className="text-xs text-muted-foreground">{k}</p><p className="font-mono text-2xl">{v ?? "–"}</p></div>)}
      </div>
      <h2 className="mt-10 text-xl font-bold">Construction companies</h2>
      <div className="mt-3 rounded-xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Reg. no.</TableHead><TableHead>Status</TableHead><TableHead>Document</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.company_name}<div className="text-xs text-muted-foreground">{c.full_name} · {c.phone}</div></TableCell>
                <TableCell className="font-mono">{c.registration_number}</TableCell>
                <TableCell><Badge variant={c.verified ? "default" : "secondary"}>{c.verified ? "verified" : c.verification_status}</Badge></TableCell>
                <TableCell>{c.verification_doc ? <Button size="sm" variant="link" onClick={() => viewDoc(c.verification_doc!)}>View</Button> : "–"}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button size="sm" onClick={() => decide(c.id, true)} disabled={c.verified}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decide(c.id, false)}>Reject</Button>
                </TableCell>
              </TableRow>
            ))}
            {!companies.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No companies yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <h2 className="mt-10 text-xl font-bold">Quotations</h2>
      <p className="mt-1 font-mono text-sm text-muted-foreground">Total quoted: {lkr(data?.quotes.reduce((s, q) => s + Number(q.amount), 0) ?? 0)}</p>
      <h2 className="mt-10 text-xl font-bold">Contact messages</h2>
      <div className="mt-3 space-y-2">
        {data?.msgs.map((m) => <div key={m.id} className="rounded-lg border bg-card p-4 text-sm"><b>{m.name}</b> <span className="text-muted-foreground">{m.email}</span><p className="mt-1">{m.message}</p></div>)}
      </div>
    </AppShell>
  );
}
