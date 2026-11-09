import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Home, Layers, Eye, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HouseFurniture } from "./HouseFurniture";
import { ModernFacade } from "./ModernFacade";
import { wallEdges } from "@/lib/buildora/viewer";
import type { Finishes, Land, Plan, Room } from "@/lib/buildora/types";

type View = "cutaway" | "exterior" | "room";
const H = 3, T = 0.16;
function useScenePalette() {
  const [palette, setPalette] = useState<Record<string, string>>({});
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    setPalette(Object.fromEntries(["background", "ground", "road", "slab", "window", "frame", "wood", "tile", "cladding", "stone", "hedge", "paving", "metal"].map(k => [k, css.getPropertyValue(`--scene-${k}`).trim()])));
  }, []);
  return palette;
}
function FloorMaterial({ colour, tile }: { colour: string; tile: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = colour; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 2;
      if (tile) { for (let n = 0; n <= 256; n += 64) { ctx.beginPath(); ctx.moveTo(n, 0); ctx.lineTo(n, 256); ctx.moveTo(0, n); ctx.lineTo(256, n); ctx.stroke(); } }
      else { for (let n = 0; n < 256; n += 32) { ctx.strokeRect(n, 0, 32, 256); for (let y = 0; y < 256; y += 8) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(n + 3, y); ctx.lineTo(n + 28, y + 3); ctx.stroke(); } ctx.globalAlpha = 1; } }
    }
    const t = new CanvasTexture(canvas); t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(2, 2); return t;
  }, [colour, tile]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <meshStandardMaterial map={texture} roughness={tile ? 0.45 : 0.8} />;
}
function CameraRig({ plan, view, room, reset, animate, ready }: { plan: Plan; view: View; room?: Room; reset: number; animate: boolean; ready: () => void }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const fp = plan.footprint;
  useEffect(() => {
    const c = controls.current; if (!c) return;
    const span = Math.max(fp.w, fp.h);
    const aspect = size.width / size.height;
    const fit = Math.max(1, 1 / aspect);
    if (view === "room" && room) {
      c.target.set(room.x + room.w / 2 - fp.x - fp.w / 2, 1.4, room.y + room.h / 2 - fp.y - fp.h / 2);
      camera.position.copy(c.target).add(new Vector3(room.w * 0.38, 0.45, room.h * 0.38));
    } else {
      c.target.set(0, view === "exterior" ? plan.floors * H / 2 : 0, 0);
      const exteriorScale = view === "exterior" ? 1.5 + plan.floors * 0.12 : 1;
      camera.position.set(span * 0.72 * fit * exteriorScale, span * (view === "exterior" ? 0.85 : 1.3) * fit * exteriorScale, span * 0.9 * fit * exteriorScale);
    }
    camera.lookAt(c.target); c.update();
  }, [camera, fp, view, room, reset, plan.floors, size.width, size.height]);
  const signalled = useRef(false);
  useFrame(() => { if (!signalled.current) { signalled.current = true; ready(); } });
  return <OrbitControls ref={controls} makeDefault enableDamping autoRotate={animate && view !== "room"} autoRotateSpeed={0.45} minDistance={view === "room" ? 0.3 : 5} maxDistance={100} maxPolarAngle={Math.PI / 2.02} />;
}

export function House3D({ plan, land, finishes }: { plan: Plan; land: Land; finishes: Finishes }) {
  const [view, setView] = useState<View>("exterior");
  const [floor, setFloor] = useState(0), [selected, setSelected] = useState("");
  const [animate, setAnimate] = useState(false), [reset, setReset] = useState(0), [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => { const m = matchMedia("(prefers-reduced-motion: reduce)"); const sync = () => setReduced(m.matches); sync(); m.addEventListener("change", sync); return () => m.removeEventListener("change", sync); }, []);
  const palette = useScenePalette(), fp = plan.footprint;
  const activeFloor = Math.min(floor, plan.floors - 1);
  const rooms = plan.rooms.filter(r => r.floor === activeFloor);
  const room = rooms.find(r => r.id === selected) ?? rooms.find(r => r.type === "living") ?? rooms[0];
  const walls = useMemo(() => wallEdges(plan), [plan]);
  const cut = view !== "exterior";
  return <section className="min-w-0">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold">Your home in 3D</h2>
      <div className="flex flex-wrap gap-1" role="group" aria-label="3D view">
        {([["cutaway", Layers, "Floor plan"], ["exterior", Home, "Exterior"], ["room", Eye, "Inside room"]] as const).map(([v, Icon, label]) => <Button key={v} size="sm" variant={view === v ? "default" : "outline"} onClick={() => setView(v)}><Icon />{label}</Button>)}
      </div>
    </div>
    <div className="relative h-[620px] min-h-[420px] w-full overflow-hidden rounded-lg border bg-secondary max-sm:h-[480px]" data-scene-ready={ready || undefined} data-view={view} data-floor={activeFloor}>
      {palette["background"] && <Canvas shadows dpr={[1, 1.5]} camera={{ position: [15, 20, 15], fov: 42 }}>
        <color attach="background" args={[palette["background"]]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[-8, 18, 8]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} />
        <Environment resolution={32}><Lightformer intensity={2} position={[0, 8, 0]} scale={[18, 18, 1]} rotation-x={Math.PI / 2} /></Environment>
        <group position={[-fp.x - fp.w / 2, 0, -fp.y - fp.h / 2]}>
          {!cut && <><mesh position={[land.width / 2, -0.12, land.length / 2]} receiveShadow><boxGeometry args={[land.width, 0.15, land.length]} /><meshStandardMaterial color={palette["ground"]} /></mesh><mesh position={[land.width / 2, -0.13, -2]} receiveShadow><boxGeometry args={[land.width + 4, 0.1, 4]} /><meshStandardMaterial color={palette["road"]} /></mesh></>}
          {Array.from({ length: cut ? 1 : plan.floors }, (_, i) => cut ? activeFloor : i).map(f => <group key={f} position={[0, cut ? 0 : f * H, 0]}>
            <mesh position={[fp.x + fp.w / 2, 0.05, fp.y + fp.h / 2]} receiveShadow><boxGeometry args={[fp.w + 0.25, 0.1, fp.h + 0.25]} /><meshStandardMaterial color={palette["slab"]} /></mesh>
            {plan.rooms.filter(r => r.floor === f).map(r => <group key={r.id}>
              <mesh position={[r.x + r.w / 2, 0.12, r.y + r.h / 2]} receiveShadow onClick={(e) => { e.stopPropagation(); setSelected(r.id); }}><boxGeometry args={[Math.max(0.1, r.w - 0.03), 0.04, Math.max(0.1, r.h - 0.03)]} /><FloorMaterial colour={finishes.floor} tile={finishes.floorMaterial === "tile" || ["bathroom", "attached_bath"].includes(r.type)} /></mesh>
              {finishes.furniture !== false && <Suspense fallback={null}><HouseFurniture room={r} /></Suspense>}
            </group>)}
            {walls.filter(w => w.floor === f).map((w, i) => {
              const height = view === "cutaway" ? 0.85 : H - 0.12;
              const colour = w.exterior && !cut ? finishes.wall : finishes.interiorWall ?? finishes.wall;
              const opening = w.length > 1.8;
              const gap = opening ? Math.min(w.exterior ? 1.3 : 0.85, w.length * 0.45) : 0;
              const piece = (length: number, y: number, h: number, offset = 0) => <mesh position={[w.x + (w.axis === "x" ? offset : 0), y, w.z + (w.axis === "z" ? offset : 0)]} castShadow receiveShadow><boxGeometry args={[w.axis === "x" ? length : T, h, w.axis === "z" ? length : T]} /><meshStandardMaterial color={colour} roughness={0.9} /></mesh>;
              return <group key={i}>
                {opening ? <>{[-1, 1].map(side => <group key={side}>{piece((w.length - gap) / 2, height / 2 + 0.15, height, side * (w.length + gap) / 4)}</group>)}
                  {w.exterior && <>{piece(gap, 0.48, 0.65)}{height > 1 && <><mesh position={[w.x, 1.55, w.z]}><boxGeometry args={[w.axis === "x" ? gap : 0.06, 1.5, w.axis === "z" ? gap : 0.06]} /><meshPhysicalMaterial color={palette["window"]} transparent opacity={0.3} roughness={0.08} metalness={0.1} /></mesh>{piece(gap, 2.62, 0.7)}</>}</>}
                  {!w.exterior && height > 1 && piece(gap, 2.7, 0.55)}
                </> : piece(w.length, height / 2 + 0.15, height)}
              </group>;
            })}
          </group>)}
          {!cut && <ModernFacade plan={plan} land={land} finishes={finishes} palette={palette} />}
          {!cut && (finishes.roofType === "flat" ? <mesh position={[fp.x + fp.w / 2, plan.floors * H + 0.15, fp.y + fp.h / 2]} castShadow><boxGeometry args={[fp.w + 0.8, 0.25, fp.h + 0.8]} /><meshStandardMaterial color={finishes.roof} /></mesh> : <mesh position={[fp.x + fp.w / 2, plan.floors * H + 0.9, fp.y + fp.h / 2]} rotation-y={Math.PI / 4} scale={[(fp.w + 1) / Math.SQRT2, 1, (fp.h + 1) / Math.SQRT2]} castShadow><coneGeometry args={[1, 1.8, 4]} /><meshStandardMaterial color={finishes.roof} roughness={0.85} /></mesh>)}
        </group>
        <CameraRig plan={plan} view={view} room={room} reset={reset} animate={animate && !reduced} ready={() => setReady(true)} />
      </Canvas>}
      <div className="viewer-glass absolute left-3 top-3 flex max-w-[calc(100%-24px)] flex-wrap gap-1 rounded-lg p-1.5">
        {Array.from({ length: plan.floors }, (_, f) => <Button key={f} size="sm" variant={activeFloor === f ? "default" : "ghost"} onClick={() => { setFloor(f); if (view === "exterior") setView("cutaway"); }}>{f === 0 ? "Ground" : `Floor ${f}`}</Button>)}
      </div>
      <div className="viewer-glass absolute bottom-3 right-3 flex gap-1 rounded-lg p-1.5">
        <Button size="icon" variant="ghost" title={animate ? "Pause rotation" : "Animate rotation"} aria-label={animate ? "Pause rotation" : "Animate rotation"} disabled={reduced || view === "room"} onClick={() => setAnimate(!animate)}>{animate ? <Pause /> : <Play />}</Button>
        <Button size="icon" variant="ghost" title="Reset camera" aria-label="Reset camera" onClick={() => setReset(reset + 1)}><RotateCcw /></Button>
      </div>
    </div>
    {view === "room" && <div className="mt-3 flex flex-wrap gap-2">{rooms.map(r => <Button key={r.id} size="sm" variant={room?.id === r.id ? "default" : "outline"} onClick={() => setSelected(r.id)}>{r.name}</Button>)}</div>}
  </section>;
}
