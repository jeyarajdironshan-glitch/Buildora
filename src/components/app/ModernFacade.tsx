import type { Finishes, Land, Plan } from "@/lib/buildora/types";

const H = 3;

/** Real-world contemporary façade dressing: cantilevered slabs, glass balconies, cladding, boundary wall, gate and landscaping. */
export function ModernFacade({ plan, land, finishes, palette }: { plan: Plan; land: Land; finishes: Finishes; palette: Record<string, string> }) {
  const fp = plan.footprint;
  const front = fp.y;
  const cx = fp.x + fp.w / 2;
  const top = plan.floors * H;
  const gateW = Math.min(3.6, land.width * 0.3);
  const gateX = land.width - gateW / 2 - 0.8;
  const Box = ({ p, s, c, r = 0.8, m = 0 }: { p: [number, number, number]; s: [number, number, number]; c?: string; r?: number; m?: number }) => (
    <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={r} metalness={m} /></mesh>
  );
  const glassW = fp.w * 0.58, glassX = fp.x + fp.w - glassW / 2 - 0.2;
  return <group>
    {/* floor-by-floor façade */}
    {Array.from({ length: plan.floors }, (_, f) => <group key={f}>
      {f > 0 && <>
        <Box p={[cx + 0.2, f * H + 0.05, front + fp.h / 2 - 0.55]} s={[fp.w + 0.7, 0.32, fp.h + 1.5]} c={palette["frame"]} r={0.6} />
        <mesh position={[glassX, f * H + 0.75, front - 1.25]}><boxGeometry args={[glassW, 1, 0.04]} /><meshPhysicalMaterial color={palette["window"]} transparent opacity={0.35} roughness={0.05} /></mesh>
        <Box p={[glassX, f * H + 1.27, front - 1.25]} s={[glassW, 0.05, 0.07]} c={palette["metal"]} r={0.3} m={0.8} />
      </>}
      <mesh position={[glassX, f * H + 1.55, front - 0.1]}><boxGeometry args={[glassW - 0.6, 2, 0.05]} /><meshPhysicalMaterial color={palette["stone"]} transparent opacity={0.75} roughness={0.05} metalness={0.4} /></mesh>
    </group>)}
    <Box p={[fp.x + fp.w * 0.18, top / 2 + 0.1, front - 0.12]} s={[fp.w * 0.34, top - 0.2, 0.12]} c={palette["cladding"]} r={0.7} />
    <Box p={[fp.x + fp.w - 0.15, top / 2 + 0.1, front - 0.15]} s={[0.45, top + 0.3, 0.45]} c={palette["stone"]} r={0.9} />
    {/* roof canopy */}
    <Box p={[cx + 0.3, top + 0.35, front + fp.h / 2 - 0.7]} s={[fp.w + 1.2, 0.22, fp.h + 1.9]} c={palette["frame"]} r={0.6} />
    <Box p={[cx + 0.3, top + 0.22, front + fp.h / 2 - 0.7]} s={[fp.w + 1, 0.05, fp.h + 1.7]} c={palette["cladding"]} />
    {/* boundary wall + sliding wooden gate */}
    <Box p={[(land.width - gateW - 1) / 2, 0.6, 0.15]} s={[land.width - gateW - 1, 1.2, 0.2]} c={finishes.wall} />
    <Box p={[land.width - 0.4, 0.6, 0.15]} s={[0.8, 1.2, 0.2]} c={palette["stone"]} />
    {Array.from({ length: Math.floor(gateW / 0.25) }, (_, i) => <Box key={i} p={[gateX - gateW / 2 + 0.12 + i * 0.25, 0.75, 0.15]} s={[0.14, 1.5, 0.06]} c={palette["wood"]} />)}
    {/* driveway, hedges and street lamps */}
    <Box p={[gateX, -0.03, front / 2 + 0.2]} s={[gateW, 0.04, Math.max(0.5, front - 0.2)]} c={palette["paving"]} r={0.95} />
    <Box p={[(land.width - gateW - 1) / 2, 0.35, 0.6]} s={[land.width - gateW - 1.4, 0.7, 0.55]} c={palette["hedge"]} r={1} />
    {[1.5, land.width - 1.5].map(x => <group key={x} position={[x, 0, -1.2]}>
      <Box p={[0, 2, 0]} s={[0.12, 4, 0.12]} c={palette["metal"]} r={0.4} m={0.7} />
      <mesh position={[0, 4, 0.2]}><sphereGeometry args={[0.18, 12, 12]} /><meshStandardMaterial color={palette["frame"]} emissive={palette["frame"]} emissiveIntensity={0.6} /></mesh>
    </group>)}
  </group>;
}
