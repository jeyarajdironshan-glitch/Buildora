import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Check, Plus, Save, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { PlanView } from "@/components/app/PlanEditor";
import { House3D } from "@/components/app/House3D";
import { HouseFinishes } from "@/components/app/HouseFinishes";
import { resizePlanFloors } from "@/lib/buildora/viewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEFAULT_FINISHES, DEFAULT_LAND, DEFAULT_REQ, DISTRICTS, type Finishes, type Land, type Plan, type Requirements, type Room } from "@/lib/buildora/types";
import { generatePlans, landWarnings, planWarnings, ROOM_CATALOG } from "@/lib/buildora/planner";
import { estimate } from "@/lib/buildora/cost";
import { fmt, ftToM, lkr, mToFt, sqmToPerch, sqmToSqft } from "@/lib/buildora/units";
import { parseBrief } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({ meta: [{ title: "House design studio – Buildora" }, { name: "description", content: "Design floor plans, explore furnished interiors and choose your home finishes with Buildora." }, { property: "og:title", content: "House design studio – Buildora" }, { property: "og:description", content: "Explore your house plans, furnished 3D interiors and finishes." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Workspace,
});

interface Project {
  id: string; name: string; status: string; land: Land; requirements: Requirements; plans: Plan[];
  selected_plan: number | null; finishes: Finishes; files: string[];
}

function Workspace() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
      if (error) throw error;
      return data as unknown as Project;
    },
  });
  const [p, setP] = useState<Project | null>(null);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState("land");
  useEffect(() => { if (data && !p) setP({ ...data, land: { ...DEFAULT_LAND, ...data.land }, requirements: { ...DEFAULT_REQ, ...data.requirements }, finishes: { ...DEFAULT_FINISHES, ...data.finishes } }); }, [data, p]);

  const update = (patch: Partial<Project>) => { setP((x) => (x ? { ...x, ...patch } : x)); setDirty(true); };
  const plan = p && p.selected_plan != null ? p.plans[p.selected_plan] : null;
  const est = useMemo(() => (plan && p ? estimate(plan, p.finishes, p.land.district) : null), [plan, p]);

  const save = async (extra: Record<string, unknown> = {}) => {
    if (!p) return false;
    const { error } = await supabase.from("projects").update({
      name: p.name, land: p.land as never, requirements: p.requirements as never, plans: p.plans as never,
      selected_plan: p.selected_plan, finishes: p.finishes as never, estimate: est as never, updated_at: new Date().toISOString(), ...extra,
    }).eq("id", p.id);
    if (error) { toast.error(error.message); return false; }
    setDirty(false);
    qc.invalidateQueries({ queryKey: ["projects"] });
    return true;
  };

  if (error) return <AppShell title="Project not found"><Link to="/dashboard" className="text-primary">Back to dashboard</Link></AppShell>;
  if (isLoading || !p) return <AppShell title="Loading project…"><Skeleton className="h-96" /></AppShell>;

  return (
    <AppShell
      title={p.name}
      subtitle={<span className="flex items-center gap-2"><Link to="/dashboard" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="size-3" /> Projects</Link><Badge variant="secondary">{p.status}</Badge></span>}
      actions={<Button onClick={async () => (await save()) && toast.success("Saved")} variant={dirty ? "default" : "outline"}><Save /> {dirty ? "Save changes" : "Saved"}</Button>}
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap">
          {[["land", "1 · Land"], ["req", "2 · Requirements"], ["plans", "3 · AI Plans"], ["edit", "4 · 2D Editor"], ["3d", "5 · 3D"], ["cost", "6 · Cost"], ["publish", "7 · Quotations"]].map(([v, l]) => (
            <TabsTrigger key={v} value={v} disabled={["edit", "3d", "cost", "publish"].includes(v) && !plan}>{l}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="land" className="mt-6"><LandStep p={p} update={update} next={() => setTab("req")} /></TabsContent>
        <TabsContent value="req" className="mt-6"><ReqStep p={p} update={update} next={() => { update({ plans: generatePlans(p.land, p.requirements), selected_plan: null }); setTab("plans"); }} /></TabsContent>
        <TabsContent value="plans" className="mt-6"><PlansStep p={p} update={update} next={() => setTab("3d")} /></TabsContent>
        <TabsContent value="edit" className="mt-6">{plan && <EditStep p={p} plan={plan} update={update} next={() => setTab("3d")} />}</TabsContent>
        <TabsContent value="3d" className="mt-6">{plan && <ThreeStep p={p} plan={plan} update={update} onEdit2D={() => setTab("edit")} />}</TabsContent>
        <TabsContent value="cost" className="mt-6">{est && <CostStep est={est} p={p} />}</TabsContent>
        <TabsContent value="publish" className="mt-6"><PublishStep p={p} save={save} setStatus={(s) => setP({ ...p, status: s })} /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

type StepProps = { p: Project; update: (x: Partial<Project>) => void; next?: () => void };

function F({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}{hint && <span className="font-mono text-xs text-muted-foreground">{hint}</span>}</div>;
}
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card p-6 shadow-soft ${className}`}>{children}</div>;
}
function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>;
}

function LandStep({ p, update, next }: StepProps) {
  const [unit, setUnit] = useState<"m" | "ft">("ft");
  const [uploading, setUploading] = useState(false);
  const land = p.land;
  const set = (patch: Partial<Land>) => update({ land: { ...land, ...patch } });
  const toU = (m: number) => (unit === "ft" ? +mToFt(m).toFixed(2) : +m.toFixed(2));
  const fromU = (v: string) => (unit === "ft" ? ftToM(Number(v)) : Number(v));
  const area = land.width * land.length - (land.shape === "l-shaped" ? (land.cutWidth ?? 0) * (land.cutLength ?? 0) : 0);
  const warns = landWarnings(land);
  const upload = async (files: FileList) => {
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    const paths: string[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} is over 20 MB`); continue; }
      const path = `${u.user!.id}/${p.id}/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("documents").upload(path, f);
      if (error) toast.error(error.message); else paths.push(path);
    }
    if (paths.length) {
      const files2 = [...p.files, ...paths];
      await supabase.from("projects").update({ files: files2 }).eq("id", p.id);
      update({ files: files2 });
      toast.success(`${paths.length} file(s) uploaded`);
    }
    setUploading(false);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <Card className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Land information</h2>
          <div className="flex rounded-md border p-0.5 text-xs">{(["ft", "m"] as const).map((u) => <button key={u} onClick={() => setUnit(u)} className={`rounded px-2 py-1 ${unit === u ? "bg-primary text-primary-foreground" : ""}`}>{u === "ft" ? "feet" : "metres"}</button>)}</div>
        </div>
        <F label="Project name"><Input value={p.name} onChange={(e) => update({ name: e.target.value })} /></F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Shape"><Sel value={land.shape} onChange={(v) => set({ shape: v as Land["shape"], ...(v === "square" ? { length: land.width } : {}), ...(v === "l-shaped" && !land.cutWidth ? { cutWidth: land.width / 3, cutLength: land.length / 3 } : {}) })} options={[["rectangle", "Rectangle"], ["square", "Square"], ["l-shaped", "L-shaped"], ["custom", "Custom (approx. rectangle)"]]} /></F>
          <F label="District"><Sel value={land.district} onChange={(v) => set({ district: v })} options={DISTRICTS.map((d) => [d, d])} /></F>
          <F label={`Width (${unit})`}><Input type="number" value={toU(land.width)} onChange={(e) => set({ width: fromU(e.target.value), ...(land.shape === "square" ? { length: fromU(e.target.value) } : {}) })} /></F>
          <F label={`Length (${unit})`}><Input type="number" disabled={land.shape === "square"} value={toU(land.length)} onChange={(e) => set({ length: fromU(e.target.value) })} /></F>
          {land.shape === "l-shaped" && <>
            <F label={`Cut-out width (${unit})`}><Input type="number" value={toU(land.cutWidth ?? 0)} onChange={(e) => set({ cutWidth: fromU(e.target.value) })} /></F>
            <F label={`Cut-out length (${unit})`}><Input type="number" value={toU(land.cutLength ?? 0)} onChange={(e) => set({ cutLength: fromU(e.target.value) })} /></F>
          </>}
          <F label="Orientation (front faces)"><Sel value={land.orientation} onChange={(v) => set({ orientation: v as Land["orientation"] })} options={[["N", "North"], ["E", "East"], ["S", "South"], ["W", "West"]]} /></F>
          <F label="Road side"><Sel value={land.roadSide} onChange={(v) => set({ roadSide: v as Land["roadSide"] })} options={[["front", "Front"], ["left", "Left"], ["right", "Right"], ["rear", "Rear"]]} /></F>
          <F label={`Road width (${unit})`}><Input type="number" value={toU(land.roadWidth)} onChange={(e) => set({ roadWidth: fromU(e.target.value) })} /></F>
          <F label="Terrain"><Sel value={land.terrain} onChange={(v) => set({ terrain: v as Land["terrain"] })} options={[["flat", "Flat"], ["gentle", "Gentle slope"], ["steep", "Steep"]]} /></F>
          <F label="Slope (%)"><Input type="number" value={land.slope} onChange={(e) => set({ slope: Number(e.target.value) })} /></F>
          <F label="Location / town"><Input value={land.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Maharagama" /></F>
        </div>
        <F label="Soil information (if known)"><Input value={land.soil} onChange={(e) => set({ soil: e.target.value })} placeholder="e.g. lateritic, bearing capacity" /></F>
        <F label="Existing structures"><Input value={land.existingStructures} onChange={(e) => set({ existingStructures: e.target.value })} /></F>
        <F label="Site restrictions"><Textarea value={land.restrictions} onChange={(e) => set({ restrictions: e.target.value })} placeholder="Easements, trees to keep, height limits, drainage…" /></F>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm hover:bg-accent">
          <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload survey plan, photos or site documents"}
          <input type="file" multiple accept=".pdf,image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files && upload(e.target.files)} />
        </label>
        {p.files.length > 0 && <p className="text-xs text-muted-foreground">{p.files.length} document(s) attached</p>}
      </Card>
      <div className="grid content-start gap-4">
        <Card className="blueprint-grid">
          <PlanView plan={{ id: "", name: "", description: "", floors: 1, footprint: { x: 0, y: 0, w: 0, h: 0 }, rooms: [] }} land={land} floor={0} unit={unit} />
          <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-sm">
            <div><div className="text-xs text-muted-foreground">Area</div>{fmt(area)} m²</div>
            <div><div className="text-xs text-muted-foreground">Sq ft</div>{fmt(sqmToSqft(area), 0)}</div>
            <div><div className="text-xs text-muted-foreground">Perches</div>{fmt(sqmToPerch(area), 2)}</div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Gold dashed line shows the buildable zone after setbacks (3 m road side, 1 m sides, 1.5 m rear).</p>
        </Card>
        {warns.length > 0 && <Card><h3 className="flex items-center gap-2 font-bold"><AlertTriangle className="size-4 text-gold" /> Check these</h3><ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">{warns.map((w) => <li key={w}>{w}</li>)}</ul></Card>}
        <Button size="lg" onClick={next} disabled={!(land.width > 0 && land.length > 0)}>Continue to requirements</Button>
      </div>
    </div>
  );
}

const GROUND = ["living", "dining", "kitchen", "bedroom", "bathroom", "parking", "guest", "study", "store"];
const UPPER = ["master", "bedroom", "attached_bath", "family", "balcony", "study", "prayer", "laundry"];

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2 font-mono">
        <button className="size-6 rounded border" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
        <span className="w-4 text-center">{value}</span>
        <button className="size-6 rounded border" onClick={() => onChange(Math.min(6, value + 1))}>+</button>
      </div>
    </div>
  );
}

function ReqStep({ p, update, next }: StepProps) {
  const r = p.requirements;
  const set = (patch: Partial<Requirements>) => update({ requirements: { ...r, ...patch } });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState("");
  const parse = useServerFn(parseBrief);
  const runAi = async () => {
    if (text.trim().length < 5) return toast.error("Describe your home in a sentence or two.");
    setBusy(true);
    try {
      const res = await parse({ data: { text } });
      if (!res.ok) { toast.error(res.error); return; }
      const b = res.brief;
      set({ floors: b.floors, style: b.style || r.style, budget: b.budget ?? r.budget, ground: { ...b.ground, staircase: b.floors > 1 ? 1 : 0 }, upper: b.upper, openKitchen: b.openKitchen, garden: b.garden, accessibility: b.accessibility, privacy: b.privacy, notes: text });
      setSummary(b.summary);
      toast.success("Requirements filled in from your description");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally { setBusy(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-6">
        <Card className="bg-emerald-soft">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="size-5 text-primary" /> Describe your dream home</h2>
          <Textarea className="mt-3 bg-card" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Two storey modern house for a family of five, 4 bedrooms with one master suite upstairs, open kitchen, parking for one car, budget around 3 crore." />
          <Button className="mt-3" onClick={runAi} disabled={busy}><Wand2 /> {busy ? "Understanding…" : "Fill in with AI"}</Button>
          {summary && <p className="mt-3 text-sm text-muted-foreground">{summary}</p>}
        </Card>
        <Card>
          <h3 className="font-bold">Ground floor</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{GROUND.map((k) => <Counter key={k} label={ROOM_CATALOG[k].label} value={r.ground[k] ?? 0} onChange={(n) => set({ ground: { ...r.ground, [k]: n } })} />)}</div>
        </Card>
        {r.floors > 1 && (
          <Card>
            <h3 className="font-bold">Upper floor{r.floors > 2 ? "s (each)" : ""}</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{UPPER.map((k) => <Counter key={k} label={ROOM_CATALOG[k].label} value={r.upper[k] ?? 0} onChange={(n) => set({ upper: { ...r.upper, [k]: n } })} />)}</div>
          </Card>
        )}
      </div>
      <div className="grid content-start gap-6">
        <Card className="grid gap-4">
          <h3 className="font-bold">General</h3>
          <F label="House type"><Sel value={r.houseType} onChange={(v) => set({ houseType: v })} options={[["Single family home", "Single family home"], ["Two-unit house", "Two-unit house"], ["Holiday bungalow", "Holiday bungalow"], ["Annex", "Annex"]]} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Floors"><Sel value={String(r.floors)} onChange={(v) => set({ floors: Number(v), ground: { ...r.ground, staircase: Number(v) > 1 ? 1 : 0 } })} options={[["1", "1"], ["2", "2"], ["3", "3"]]} /></F>
            <F label="Style"><Sel value={r.style} onChange={(v) => set({ style: v })} options={["Modern tropical", "Contemporary", "Minimalist", "Colonial", "Traditional Sri Lankan"].map((s) => [s, s])} /></F>
            <F label="Budget (LKR)" hint={lkr(r.budget)}><Input type="number" value={r.budget} onChange={(e) => set({ budget: Number(e.target.value) })} /></F>
            <F label="Completion (months)"><Input type="number" value={r.completionMonths} onChange={(e) => set({ completionMonths: Number(e.target.value) })} /></F>
          </div>
        </Card>
        <Card className="grid gap-3">
          <h3 className="font-bold">Preferences</h3>
          {([["openKitchen", "Open kitchen (off = closed)"], ["garden", "Garden"], ["naturalLight", "Natural lighting"], ["ventilation", "Natural ventilation"], ["accessibility", "Accessibility requirements"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center justify-between text-sm">{l}<Switch checked={r[k]} onCheckedChange={(v) => set({ [k]: v })} /></label>
          ))}
          <F label="Privacy"><Sel value={r.privacy} onChange={(v) => set({ privacy: v as Requirements["privacy"] })} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"]]} /></F>
        </Card>
        <Button size="lg" onClick={next}><Sparkles /> Generate 4 floor plans</Button>
      </div>
    </div>
  );
}

function PlansStep({ p, update, next }: StepProps) {
  const [floor, setFloor] = useState(0);
  if (!p.plans.length) return <Card className="text-center"><p className="text-muted-foreground">Complete your requirements and generate plans.</p></Card>;
  const floors = p.plans[0].floors;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Four layout strategies generated within your buildable zone. Pick one to refine.</p>
        <div className="flex gap-1">{Array.from({ length: floors }).map((_, f) => <Button key={f} size="sm" variant={floor === f ? "default" : "outline"} onClick={() => setFloor(f)}>{f === 0 ? "Ground" : `Floor ${f}`}</Button>)}</div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {p.plans.map((pl, i) => {
          const area = pl.rooms.reduce((s, r) => s + r.w * r.h, 0);
          const sel = p.selected_plan === i;
          return (
            <div key={pl.id} className={`overflow-hidden rounded-xl border bg-card shadow-soft transition ${sel ? "ring-2 ring-primary" : "hover:shadow-lift"}`}>
              <PlanView plan={pl} land={p.land} floor={floor} />
              <div className="flex items-start justify-between gap-3 border-t p-4">
                <div>
                  <h3 className="font-bold">Plan {i + 1}: {pl.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{pl.description}</p>
                  <p className="mt-2 font-mono text-xs">{fmt(sqmToSqft(area), 0)} sq ft total · {lkr(estimate(pl, p.finishes, p.land.district).total)}</p>
                </div>
                <Button size="sm" variant={sel ? "default" : "outline"} onClick={() => { update({ selected_plan: i }); if (!sel) next?.(); }}>{sel ? <><Check /> Selected</> : "Select"}</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditStep({ p, plan, update, next }: StepProps & { plan: Plan; next: () => void }) {
  const [floor, setFloor] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [unit, setUnit] = useState<"m" | "ft">("m");
  const setRooms = (rooms: Room[]) => update({ plans: p.plans.map((x, i) => (i === p.selected_plan ? { ...x, rooms } : x)) });
  const room = plan.rooms.find((r) => r.id === sel);
  const warns = planWarnings(plan, p.land);
  const patch = (k: keyof Room, v: string) => setRooms(plan.rooms.map((r) => (r.id === sel ? { ...r, [k]: ["x", "y", "w", "h"].includes(k) ? Math.max(0, Number(v)) : v } : r)));
  const add = () => {
    const fp = plan.footprint;
    const r: Room = { id: `r-${Date.now()}`, type: "study", name: "New Room", floor, x: fp.x, y: fp.y + fp.h + 0.5, w: 3, h: 3 };
    setRooms([...plan.rooms, r]); setSel(r.id);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Card className="p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {Array.from({ length: plan.floors }).map((_, f) => <Button key={f} size="sm" variant={floor === f ? "default" : "outline"} onClick={() => setFloor(f)}>{f === 0 ? "Ground" : `Floor ${f}`}</Button>)}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setUnit(unit === "m" ? "ft" : "m")}>Units: {unit}</Button>
            <Button size="sm" variant="outline" onClick={add}><Plus /> Room</Button>
            <Button size="sm" onClick={next}>View in 3D</Button>
          </div>
        </div>
        <PlanView plan={plan} land={p.land} floor={floor} unit={unit} selected={sel} onSelect={setSel} onChange={setRooms} />
        <p className="mt-2 text-xs text-muted-foreground">Drag a room to move it. Select it and drag the green corner to resize. Snaps to 10 cm.</p>
      </Card>
      <div className="grid content-start gap-4">
        <Card className="grid gap-3">
          <h3 className="font-bold">{room ? "Room properties" : "Select a room"}</h3>
          {room && <>
            <F label="Name"><Input value={room.name} onChange={(e) => patch("name", e.target.value)} /></F>
            <F label="Type"><Sel value={room.type} onChange={(v) => patch("type", v)} options={[...Object.entries(ROOM_CATALOG).map(([k, v]) => [k, v.label] as [string, string]), ["staircase", "Staircase"]]} /></F>
            <div className="grid grid-cols-2 gap-2 font-mono">
              {(["x", "y", "w", "h"] as const).map((k) => <F key={k} label={{ x: "X (m)", y: "Y (m)", w: "Width (m)", h: "Depth (m)" }[k]}><Input type="number" step="0.1" value={room[k]} onChange={(e) => patch(k, e.target.value)} /></F>)}
            </div>
            <p className="font-mono text-xs text-muted-foreground">{fmt(room.w * room.h)} m² · {fmt(sqmToSqft(room.w * room.h), 0)} sq ft</p>
            <Button variant="outline" size="sm" onClick={() => { setRooms(plan.rooms.filter((r) => r.id !== sel)); setSel(null); }}><Trash2 /> Delete room</Button>
          </>}
        </Card>
        <Card>
          <h3 className="flex items-center gap-2 font-bold">{warns.length ? <AlertTriangle className="size-4 text-gold" /> : <Check className="size-4 text-primary" />} Validation</h3>
          {warns.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{warns.slice(0, 8).map((w) => <li key={w}>{w}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">No overlaps or setback issues.</p>}
        </Card>
      </div>
    </div>
  );
}

function ThreeStep({ p, plan, update, onEdit2D }: StepProps & { plan: Plan; onEdit2D: () => void }) {
  const f = p.finishes;
  const set = (patch: Partial<Finishes>) => update({ finishes: { ...f, ...patch } });
  return (
    <div className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3 text-sm">
      <span className="text-muted-foreground">Want to move or resize rooms? Edit the 2D plan — the 3D house updates automatically.</span>
      <Button size="sm" variant="outline" onClick={onEdit2D}>Edit 2D plan</Button>
    </div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px]">
      <House3D plan={plan} land={p.land} finishes={f} />
      <HouseFinishes finishes={f} onChange={set} floors={plan.floors} onFloors={count => update({ requirements: { ...p.requirements, floors: count }, plans: p.plans.map(pl => resizePlanFloors(pl, count)) })} />
    </div>
    </div>
  );
}

function CostStep({ est, p }: { est: ReturnType<typeof estimate>; p: Project }) {
  const over = est.total > p.requirements.budget;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <Card className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
          <TableBody className="font-mono text-xs">
            {est.lines.map((l) => <TableRow key={l.item}><TableCell className="font-sans text-sm">{l.item}</TableCell><TableCell className="text-right">{fmt(l.qty, 1)} {l.unit}</TableCell><TableCell className="text-right">{fmt(l.rate, 0)}</TableCell><TableCell className="text-right">{fmt(l.amount, 0)}</TableCell></TableRow>)}
            <TableRow><TableCell className="font-sans text-sm">Labour (32%)</TableCell><TableCell /><TableCell /><TableCell className="text-right">{fmt(est.labour, 0)}</TableCell></TableRow>
            <TableRow><TableCell className="font-sans text-sm">Contingency (8%)</TableCell><TableCell /><TableCell /><TableCell className="text-right">{fmt(est.contingency, 0)}</TableCell></TableRow>
          </TableBody>
          <TableFooter><TableRow><TableCell colSpan={3} className="font-bold">Total estimate</TableCell><TableCell className="text-right font-mono font-bold">{lkr(est.total)}</TableCell></TableRow></TableFooter>
        </Table>
      </Card>
      <div className="grid content-start gap-4">
        <Card>
          <p className="text-xs text-muted-foreground">Estimated total</p>
          <p className="font-mono text-2xl text-primary">{lkr(est.total)}</p>
          <p className="mt-3 font-mono text-sm">{fmt(sqmToSqft(est.area), 0)} sq ft · {lkr(est.perSqft)}/sq ft</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">Regional factor {p.land.district}: ×{est.regional}</p>
          <p className={`mt-3 text-sm ${over ? "text-destructive" : "text-primary"}`}>{over ? `Over budget by ${lkr(est.total - p.requirements.budget)}` : `Within budget (${lkr(p.requirements.budget)})`}</p>
        </Card>
        <p className="text-xs text-muted-foreground">Quantities are calculated from your plan. Rates are sample Sri Lankan reference figures and exclude land, approvals, boundary walls and retaining structures.</p>
      </div>
    </div>
  );
}

function PublishStep({ p, save, setStatus }: { p: Project; save: (x?: Record<string, unknown>) => Promise<boolean>; setStatus: (s: string) => void }) {
  const qc = useQueryClient();
  const { data: quotes } = useQuery({
    queryKey: ["quotes", p.id],
    queryFn: async () => {
      const { data } = await supabase.from("quotations").select("*").eq("project_id", p.id).order("amount");
      const ids = [...new Set((data ?? []).map((q) => q.company_id))];
      const { data: cos } = ids.length ? await supabase.from("profiles").select("id,company_name,phone,verified").in("id", ids) : { data: [] };
      return (data ?? []).map((q) => ({ ...q, company: cos?.find((c) => c.id === q.company_id) }));
    },
  });
  const toggle = async () => {
    const s = p.status === "published" ? "draft" : "published";
    if (await save({ status: s })) { setStatus(s); toast.success(s === "published" ? "Published to verified companies" : "Unpublished"); }
  };
  const accept = async (qid: string) => {
    const { error } = await supabase.from("quotations").update({ status: "accepted" }).eq("id", qid);
    if (error) return toast.error(error.message);
    toast.success("Company selected");
    qc.invalidateQueries({ queryKey: ["quotes", p.id] });
  };
  const accepted = quotes?.find((q) => q.status === "accepted");
  return (
    <div className="grid gap-6">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold">{p.status === "published" ? "Your project is published" : "Publish for quotations"}</h3>
          <p className="text-sm text-muted-foreground">Verified construction companies can view your selected plan, 3D design and estimate, then submit quotations.</p>
        </div>
        <Button onClick={toggle} variant={p.status === "published" ? "outline" : "default"}>{p.status === "published" ? "Unpublish" : "Publish project"}</Button>
      </Card>
      <h3 className="text-lg font-bold">Quotations ({quotes?.length ?? 0})</h3>
      {!quotes?.length ? <p className="text-sm text-muted-foreground">No quotations yet.</p> : (
        <div className="grid gap-3 md:grid-cols-3">
          {quotes.map((q) => (
            <Card key={q.id} className={q.status === "accepted" ? "ring-2 ring-primary" : ""}>
              <div className="flex justify-between"><b>{q.company?.company_name ?? "Company"}</b><Badge variant={q.status === "accepted" ? "default" : "secondary"}>{q.status}</Badge></div>
              <p className="mt-2 font-mono text-xl">{lkr(Number(q.amount))}</p>
              <p className="font-mono text-xs text-muted-foreground">{q.duration_months ? `${q.duration_months} months` : "Duration not given"}</p>
              {q.notes && <p className="mt-2 text-sm text-muted-foreground">{q.notes}</p>}
              {q.status === "accepted" && q.company?.phone && <p className="mt-2 text-sm">Contact: <span className="font-mono">{q.company.phone}</span></p>}
              {!accepted && <Button size="sm" className="mt-3" onClick={() => accept(q.id)}>Select company</Button>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
