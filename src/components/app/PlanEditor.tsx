import { useRef, useState } from "react";
import type { Land, Plan, Room } from "@/lib/buildora/types";
import { buildableRect, ROOM_CATALOG, overlaps } from "@/lib/buildora/planner";
import { fmt, mToFt } from "@/lib/buildora/units";

const zoneFill = (type: string) => {
  if (type === "staircase") return "var(--plan-core)";
  const z = ROOM_CATALOG[type]?.zone;
  return z === "private" ? "var(--plan-private)" : z === "service" ? "var(--plan-service)" : "var(--plan-public)";
};
const snap = (n: number) => Math.round(n * 10) / 10;

function landPolygon(land: Land) {
  const { width: W, length: L } = land;
  if (land.shape === "l-shaped" && land.cutWidth && land.cutLength) {
    const cw = land.cutWidth, cl = land.cutLength;
    return `0,0 ${W},0 ${W},${L - cl} ${W - cw},${L - cl} ${W - cw},${L} 0,${L}`;
  }
  return `0,0 ${W},0 ${W},${L} 0,${L}`;
}

interface Props {
  plan: Plan;
  land: Land;
  floor: number;
  unit?: "m" | "ft";
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (rooms: Room[]) => void;
}

export function PlanView({ plan, land, floor, unit = "m", selected, onSelect, onChange }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ id: string; mode: "move" | "resize"; ox: number; oy: number; r: Room } | null>(null);
  const editable = !!onChange;
  const pad = 2;
  const rooms = plan.rooms.filter((r) => r.floor === floor);
  const b = buildableRect(land);
  const d = (m: number) => (unit === "ft" ? `${fmt(mToFt(m), 1)}'` : `${fmt(m, 1)}m`);

  const pt = (e: React.PointerEvent) => {
    const s = svg.current!;
    const p = s.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    const t = p.matrixTransform(s.getScreenCTM()!.inverse());
    return { x: t.x, y: t.y };
  };

  const down = (e: React.PointerEvent, r: Room, mode: "move" | "resize") => {
    onSelect?.(r.id);
    if (!editable) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = pt(e);
    setDrag({ id: r.id, mode, ox: p.x, oy: p.y, r: { ...r } });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag || !onChange) return;
    const p = pt(e);
    const dx = p.x - drag.ox, dy = p.y - drag.oy;
    const next = plan.rooms.map((r) => {
      if (r.id !== drag.id) return r;
      if (drag.mode === "move") return { ...r, x: snap(drag.r.x + dx), y: snap(drag.r.y + dy) };
      return { ...r, w: Math.max(1, snap(drag.r.w + dx)), h: Math.max(1, snap(drag.r.h + dy)) };
    });
    onChange(next);
  };

  return (
    <svg
      ref={svg}
      viewBox={`${-pad} ${-pad - 1.5} ${land.width + pad * 2} ${land.length + pad * 2 + 1.5}`}
      className="block w-full touch-none select-none bg-card"
      style={{ maxHeight: "70vh" }}
      onPointerMove={move}
      onPointerUp={() => setDrag(null)}
      onPointerDown={() => onSelect?.(null)}
    >
      <defs>
        <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="var(--border)" strokeWidth="0.03" /></pattern>
      </defs>
      <polygon points={landPolygon(land)} fill="url(#grid)" stroke="var(--primary)" strokeWidth="0.12" />
      <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none" stroke="var(--gold)" strokeWidth="0.06" strokeDasharray="0.3 0.2" />
      <text x={land.width / 2} y={-0.6} textAnchor="middle" fontSize="0.6" fill="var(--muted-foreground)" fontFamily="Roboto Mono">
        {land.roadSide === "front" ? "▲ ROAD" : "FRONT"} · {d(land.width)}
      </text>
      <text x={-0.6} y={land.length / 2} textAnchor="middle" fontSize="0.6" fill="var(--muted-foreground)" fontFamily="Roboto Mono" transform={`rotate(-90 ${-0.6} ${land.length / 2})`}>{d(land.length)}</text>
      {rooms.map((r) => {
        const bad = rooms.some((o) => o.id !== r.id && overlaps(o, r));
        const sel = selected === r.id;
        const fs = Math.min(0.55, r.w / 7, r.h / 3);
        return (
          <g key={r.id}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={zoneFill(r.type)}
              stroke={bad ? "var(--destructive)" : sel ? "var(--primary)" : "var(--navy)"} strokeWidth={sel ? 0.16 : 0.1}
              className={editable ? "cursor-move" : ""} onPointerDown={(e) => down(e, r, "move")} />
            {r.type === "staircase" && Array.from({ length: Math.floor(Math.max(r.w, r.h) / 0.3) }).map((_, i) => r.w > r.h
              ? <line key={i} x1={r.x + i * 0.3} x2={r.x + i * 0.3} y1={r.y + r.h * 0.2} y2={r.y + r.h * 0.8} stroke="var(--muted-foreground)" strokeWidth="0.02" pointerEvents="none" />
              : <line key={i} y1={r.y + i * 0.3} y2={r.y + i * 0.3} x1={r.x + r.w * 0.2} x2={r.x + r.w * 0.8} stroke="var(--muted-foreground)" strokeWidth="0.02" pointerEvents="none" />)}
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 - fs * 0.2} textAnchor="middle" fontSize={fs} fontWeight="700" fill="var(--navy)" fontFamily="Manrope" pointerEvents="none">{r.name}</text>
            <text x={r.x + r.w / 2} y={r.y + r.h / 2 + fs * 1.1} textAnchor="middle" fontSize={fs * 0.8} fill="var(--muted-foreground)" fontFamily="Roboto Mono" pointerEvents="none">{d(r.w)} × {d(r.h)}</text>
            {editable && sel && <rect x={r.x + r.w - 0.35} y={r.y + r.h - 0.35} width={0.5} height={0.5} fill="var(--primary)" className="cursor-nwse-resize" onPointerDown={(e) => down(e, r, "resize")} />}
          </g>
        );
      })}
    </svg>
  );
}
