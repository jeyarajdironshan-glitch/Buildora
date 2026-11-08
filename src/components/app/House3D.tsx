import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, ContactShadows } from "@react-three/drei";
import { useMemo } from "react";
import type { Finishes, Land, Plan } from "@/lib/buildora/types";

const H = 3; // storey height (m)
const T = 0.2; // wall thickness

/** Builds walls from room rectangles; shared edges collapse into one wall. */
function useWalls(plan: Plan) {
  return useMemo(() => {
    const walls: { x: number; z: number; w: number; d: number; floor: number }[] = [];
    const seen = new Set<string>();
    for (const r of plan.rooms) {
      if (r.type === "balcony") continue;
      const edges = [
        [r.x, r.y, r.w, 0], [r.x, r.y + r.h, r.w, 0], [r.x, r.y, 0, r.h], [r.x + r.w, r.y, 0, r.h],
      ];
      for (const [x, y, w, h] of edges) {
        const key = `${r.floor}:${x.toFixed(1)}:${y.toFixed(1)}:${w.toFixed(1)}:${h.toFixed(1)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        walls.push({ x: x + w / 2, z: y + h / 2, w: Math.max(w, T), d: Math.max(h, T), floor: r.floor });
      }
    }
    return walls;
  }, [plan]);
}

export function House3D({ plan, land, finishes }: { plan: Plan; land: Land; finishes: Finishes }) {
  const walls = useWalls(plan);
  const fp = plan.footprint;
  const cx = land.width / 2, cz = land.length / 2;
  const roofY = plan.floors * H;
  return (
    <div className="h-[520px] w-full overflow-hidden rounded-xl border bg-secondary" data-scene-ready>
      <Canvas shadows camera={{ position: [land.width * 1.1, land.length * 0.9, land.length * 1.1], fov: 40 }}>
        <color attach="background" args={["#e9efe9"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[20, 30, 10]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 10, 0]} scale={[20, 20, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={1} color="#cfe3d8" position={[-10, 2, 0]} rotation-y={Math.PI / 2} scale={[30, 3, 1]} />
        </Environment>
        <group position={[-cx, 0, -cz]}>
          {/* land */}
          <mesh rotation-x={-Math.PI / 2} position={[cx, 0, cz]} receiveShadow>
            <planeGeometry args={[land.width, land.length]} />
            <meshStandardMaterial color="#7fa36b" roughness={1} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[cx, -0.01, -3]}>
            <planeGeometry args={[land.width + 6, 6]} />
            <meshStandardMaterial color="#4b4f55" roughness={0.9} />
          </mesh>
          {/* slabs */}
          {Array.from({ length: plan.floors }).map((_, f) => (
            <mesh key={f} position={[fp.x + fp.w / 2, f * H + 0.075, fp.y + fp.h / 2]} receiveShadow castShadow>
              <boxGeometry args={[fp.w + 0.3, 0.15, fp.h + 0.3]} />
              <meshStandardMaterial color={f === 0 ? "#cfc8bb" : finishes.floor} />
            </mesh>
          ))}
          {/* floors per room */}
          {plan.rooms.map((r) => (
            <mesh key={r.id} position={[r.x + r.w / 2, r.floor * H + 0.16, r.y + r.h / 2]} receiveShadow>
              <boxGeometry args={[r.w - 0.05, 0.02, r.h - 0.05]} />
              <meshStandardMaterial color={r.type === "staircase" ? "#bdb6aa" : finishes.floor} roughness={0.6} />
            </mesh>
          ))}
          {/* walls */}
          {walls.map((w, i) => (
            <mesh key={i} position={[w.x, w.floor * H + H / 2, w.z]} castShadow receiveShadow>
              <boxGeometry args={[w.w, H - 0.15, w.d]} />
              <meshStandardMaterial color={finishes.wall} roughness={0.85} />
            </mesh>
          ))}
          {/* roof */}
          {finishes.roofType === "flat" ? (
            <mesh position={[fp.x + fp.w / 2, roofY + 0.1, fp.y + fp.h / 2]} castShadow>
              <boxGeometry args={[fp.w + 1.2, 0.2, fp.h + 1.2]} />
              <meshStandardMaterial color={finishes.roof} />
            </mesh>
          ) : (
            <mesh position={[fp.x + fp.w / 2, roofY + 1, fp.y + fp.h / 2]} rotation-y={Math.PI / 4} castShadow scale={[(fp.w + 1.5) / Math.SQRT2, 1, (fp.h + 1.5) / Math.SQRT2]}>
              <coneGeometry args={[1, 2, 4, 1]} />
              <meshStandardMaterial color={finishes.roof} roughness={0.7} flatShading />
            </mesh>
          )}
        </group>
        <ContactShadows position={[0, 0.01, 0]} opacity={0.3} scale={60} blur={2} />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} target={[0, 2, 0]} />
      </Canvas>
    </div>
  );
}
