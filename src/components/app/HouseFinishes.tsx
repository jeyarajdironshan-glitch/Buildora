import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Paintbrush } from "lucide-react";
import type { Finishes } from "@/lib/buildora/types";

const colours = [
  ["Ivory", "#f3efe6", "--paint-ivory"], ["White", "#ffffff", "--paint-white"],
  ["Sage", "#aebfad", "--paint-sage"], ["Mist", "#c4d5df", "--paint-mist"],
  ["Clay", "#d9b4a3", "--paint-clay"], ["Graphite", "#4c545b", "--paint-graphite"],
];
export function HouseFinishes({ finishes: f, onChange, floors, onFloors }: { finishes: Finishes; onChange: (patch: Partial<Finishes>) => void; floors: number; onFloors: (count: number) => void }) {
  return <aside className="grid content-start gap-5 border-t pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
    <h3 className="flex items-center gap-2 font-bold"><Paintbrush className="size-4 text-primary" /> Colours & materials</h3>
    <div className="grid gap-2"><Label>Total floors</Label><Select value={String(floors)} onValueChange={v => onFloors(Number(v))}><SelectTrigger aria-label="Total floors"><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "floor" : "floors"}</SelectItem>)}</SelectContent></Select></div>
    {(["wall", "interiorWall", "roof", "floor"] as const).map(key => {
      const value = f[key] ?? f.wall;
      const label = { wall: "Exterior paint", interiorWall: "Interior paint", roof: "Roof colour", floor: "Floor colour" }[key];
      return <div key={key} className="grid gap-2"><Label>{label}</Label>
        <div className="flex flex-wrap gap-1.5">{colours.map(([name, colour, token]) => <Button key={name} variant="outline" size="icon" aria-label={`${label}: ${name}`} title={`${label}: ${name}`} aria-pressed={value === colour} className={value === colour ? "ring-2 ring-primary ring-offset-2" : ""} style={{ backgroundColor: `var(${token})` }} onClick={() => onChange({ [key]: colour })}>{value === colour && <Check className={name === "Graphite" ? "text-primary-foreground" : "text-foreground"} />}</Button>)}</div>
        <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Custom colour</span><Input type="color" aria-label={`Custom ${label.toLowerCase()}`} value={value} onChange={e => onChange({ [key]: e.target.value })} className="h-8 w-14 cursor-pointer p-1" /></div>
      </div>;
    })}
    <div className="grid gap-2"><Label>Floor material</Label><div className="flex gap-2">{(["wood", "tile"] as const).map(v => <Button key={v} size="sm" variant={(f.floorMaterial ?? "wood") === v ? "default" : "outline"} onClick={() => onChange({ floorMaterial: v })}>{v === "wood" ? "Timber" : "Tile"}</Button>)}</div></div>
    <div className="grid gap-2"><Label>Roof style</Label><Select value={f.roofType} onValueChange={v => onChange({ roofType: v as Finishes["roofType"] })}><SelectTrigger aria-label="Roof style"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pitched">Pitched</SelectItem><SelectItem value="flat">Flat slab</SelectItem></SelectContent></Select></div>
    <div className="grid gap-2"><Label>Finish level</Label><Select value={f.level} onValueChange={v => onChange({ level: v as Finishes["level"] })}><SelectTrigger aria-label="Finish level"><SelectValue /></SelectTrigger><SelectContent>{["standard", "premium", "luxury"].map(v => <SelectItem key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</SelectItem>)}</SelectContent></Select></div>
    <label className="flex items-center justify-between text-sm">Furniture<Switch checked={f.furniture !== false} onCheckedChange={v => onChange({ furniture: v })} /></label>
  </aside>;
}