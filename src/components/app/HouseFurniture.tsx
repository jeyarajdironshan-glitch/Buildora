import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { Box3, Vector3, Mesh } from "three";
import type { Room } from "@/lib/buildora/types";
import bed from "@/assets/models/bedDouble.glb.asset.json";
import sofa from "@/assets/models/loungeSofa.glb.asset.json";
import table from "@/assets/models/table.glb.asset.json";
import chair from "@/assets/models/chair.glb.asset.json";
import sink from "@/assets/models/kitchenSink.glb.asset.json";
import stove from "@/assets/models/kitchenStove.glb.asset.json";
import toilet from "@/assets/models/toilet.glb.asset.json";
import desk from "@/assets/models/desk.glb.asset.json";
import plant from "@/assets/models/pottedPlant.glb.asset.json";
import coffee from "@/assets/models/tableCoffee.glb.asset.json";
import shower from "@/assets/models/shower.glb.asset.json";

const models = { bed, sofa, table, chair, sink, stove, toilet, desk, plant, coffee, shower };
function Item({ kind, x, z, width, rotation = 0 }: { kind: keyof typeof models; x: number; z: number; width: number; rotation?: number }) {
  const { scene } = useGLTF(models[kind].url);
  const object = useMemo(() => {
    const copy = scene.clone(true);
    const bounds = new Box3().setFromObject(copy), size = bounds.getSize(new Vector3()), center = bounds.getCenter(new Vector3());
    const scale = width / Math.max(size.x, size.z, 0.01);
    copy.scale.setScalar(scale);
    copy.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    copy.traverse((o) => { if (o instanceof Mesh) { o.castShadow = true; o.receiveShadow = true; } });
    return copy;
  }, [scene, width]);
  return <group position={[x, 0, z]} rotation-y={rotation}><primitive object={object} /></group>;
}

export function HouseFurniture({ room }: { room: Room }) {
  const w = room.w, h = room.h, s = Math.min(1, (w - 0.4) / 3, (h - 0.4) / 3);
  if (s <= 0) return null;
  const center = { x: w / 2, z: h / 2 };
  return <group position={[room.x, 0.18, room.y]}>
    {["bedroom", "master", "guest"].includes(room.type) && <><Item kind="bed" {...center} width={2.3 * s} /><Item kind="plant" x={w - 0.45} z={h - 0.45} width={0.45 * s} /></>}
    {["living", "family"].includes(room.type) && <><Item kind="sofa" x={w / 2} z={h * 0.27} width={2.3 * s} /><Item kind="coffee" {...center} width={1.1 * s} /><Item kind="plant" x={w - 0.45} z={h - 0.45} width={0.55 * s} /></>}
    {room.type === "dining" && <><Item kind="table" {...center} width={1.7 * s} />{[-1, 1].map((side) => <Item key={side} kind="chair" x={w / 2} z={h / 2 + side * s} width={0.6 * s} rotation={side < 0 ? Math.PI : 0} />)}</>}
    {room.type === "kitchen" && <><Item kind="sink" x={w * 0.3} z={h * 0.3} width={1.1 * s} /><Item kind="stove" x={w * 0.7} z={h * 0.3} width={1.1 * s} /></>}
    {["bathroom", "attached_bath"].includes(room.type) && <><Item kind="toilet" x={w * 0.28} z={h * 0.35} width={0.7 * s} /><Item kind="shower" x={w * 0.7} z={h * 0.65} width={0.9 * s} /></>}
    {room.type === "study" && <><Item kind="desk" x={w / 2} z={h * 0.3} width={1.5 * s} /><Item kind="chair" {...center} width={0.6 * s} /></>}
  </group>;
}