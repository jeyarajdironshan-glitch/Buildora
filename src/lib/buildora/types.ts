export type LengthUnit = "m" | "ft";

export interface Land {
  width: number; // metres (canonical)
  length: number; // metres (canonical)
  shape: "rectangle" | "square" | "l-shaped" | "custom";
  orientation: "N" | "E" | "S" | "W";
  roadSide: "front" | "left" | "right" | "rear";
  roadWidth: number; // metres
  location: string;
  district: string;
  terrain: "flat" | "gentle" | "steep";
  slope: number; // percent
  soil: string;
  existingStructures: string;
  restrictions: string;
  /** L-shape cut-out in metres from the rear-right corner */
  cutWidth?: number;
  cutLength?: number;
}

export interface Requirements {
  houseType: string;
  floors: number;
  style: string;
  budget: number; // LKR
  completionMonths: number;
  ground: Record<string, number>;
  upper: Record<string, number>;
  openKitchen: boolean;
  garden: boolean;
  naturalLight: boolean;
  ventilation: boolean;
  accessibility: boolean;
  privacy: "low" | "medium" | "high";
  notes: string;
}

export interface Room {
  id: string;
  type: string;
  name: string;
  floor: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  floors: number;
  footprint: { x: number; y: number; w: number; h: number };
  rooms: Room[];
}

export interface Finishes {
  level: "standard" | "premium" | "luxury";
  wall: string;
  interiorWall?: string;
  furniture?: boolean;
  floorMaterial?: "wood" | "tile";
  roof: string;
  floor: string;
  roofType: "flat" | "pitched";
}

export const DEFAULT_LAND: Land = {
  width: 15,
  length: 25,
  shape: "rectangle",
  orientation: "N",
  roadSide: "front",
  roadWidth: 6,
  location: "",
  district: "Colombo",
  terrain: "flat",
  slope: 0,
  soil: "",
  existingStructures: "",
  restrictions: "",
};

export const DEFAULT_REQ: Requirements = {
  houseType: "Single family home",
  floors: 2,
  style: "Modern tropical",
  budget: 25000000,
  completionMonths: 12,
  ground: { living: 1, dining: 1, kitchen: 1, bedroom: 1, bathroom: 1, parking: 1, staircase: 1, store: 0, guest: 0, study: 0 },
  upper: { master: 1, bedroom: 2, attached_bath: 2, family: 1, balcony: 1, study: 0, prayer: 0, laundry: 0 },
  openKitchen: true,
  garden: true,
  naturalLight: true,
  ventilation: true,
  accessibility: false,
  privacy: "medium",
  notes: "",
};

export const DEFAULT_FINISHES: Finishes = {
  level: "standard",
  wall: "#f3efe6",
  roof: "#5b4636",
  floor: "#d9cbb2",
  roofType: "flat",
};

export const DISTRICTS = [
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle","Matara","Hambantota","Jaffna",
  "Kilinochchi","Mannar","Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee","Kurunegala","Puttalam",
  "Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle",
];
