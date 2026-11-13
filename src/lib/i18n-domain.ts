// Shows planner/cost data (stored in English) in the customer's language.
import type { Lang, MsgKey, Vars } from "./i18n";
import type { LandWarning, PlanWarning } from "./buildora/planner";
import { ROOM_CATALOG } from "./buildora/planner";

type T = (key: MsgKey, vars?: Vars) => string;

const EXTRA_ROOMS: Record<string, MsgKey> = {
  Staircase: "room_staircase",
  "Stairs & Hall": "room_stairs_hall",
  "Stairs & Landing": "room_stairs_landing",
  "New Room": "room_new",
};
const ROOM_BY_LABEL: Record<string, MsgKey> = {
  ...Object.fromEntries(Object.entries(ROOM_CATALOG).map(([type, c]) => [c.label, `room_${type}` as MsgKey])),
  ...EXTRA_ROOMS,
};

/** Generated room names ("Bedroom 2") are translated; names the customer typed stay as written. */
export function roomName(t: T, name: string): string {
  const m = /^(.*?)(?: (\d+))?$/.exec(name.trim());
  const key = m && ROOM_BY_LABEL[m[1]];
  if (!key) return name;
  return m[2] ? `${t(key)} ${m[2]}` : t(key);
}

export function roomTypeLabel(t: T, type: string): string {
  return type === "staircase" ? t("room_staircase") : ROOM_CATALOG[type] ? t(`room_${type}` as MsgKey) : type;
}

const PLAN_KEYS: Record<string, "plan_linear" | "plan_side" | "plan_garden" | "plan_service"> = {
  "Linear Flow": "plan_linear",
  "Side Zoning": "plan_side",
  "Garden Court": "plan_garden",
  "Service Front": "plan_service",
};
export function planText(t: T, plan: { name: string; description: string }) {
  const key = PLAN_KEYS[plan.name];
  return key ? { name: t(key), description: t(`${key}_d` as MsgKey) } : { name: plan.name, description: plan.description };
}

export function floorLabel(t: T, floor: number) {
  return floor === 0 ? t("ground") : t("floor_n", { n: floor });
}

export function landWarningText(t: T, w: LandWarning) {
  return t(`lw_${w}` as MsgKey);
}
export function planWarningText(t: T, w: PlanWarning) {
  return t(`pw_${w.code}` as MsgKey, { room: roomName(t, w.room), other: w.other ? roomName(t, w.other) : "", floor: floorLabel(t, w.floor) });
}

export function quoteStatus(t: T, status: string) {
  return status === "submitted" || status === "accepted" || status === "rejected" ? t(`q_${status}` as MsgKey) : status;
}

const DISTRICT_NAMES: Record<Exclude<Lang, "en">, Record<string, string>> = {
  si: {
    Colombo: "කොළඹ", Gampaha: "ගම්පහ", Kalutara: "කළුතර", Kandy: "මහනුවර", Matale: "මාතලේ", "Nuwara Eliya": "නුවරඑළිය",
    Galle: "ගාල්ල", Matara: "මාතර", Hambantota: "හම්බන්තොට", Jaffna: "යාපනය", Kilinochchi: "කිලිනොච්චිය", Mannar: "මන්නාරම",
    Vavuniya: "වවුනියාව", Mullaitivu: "මුලතිව්", Batticaloa: "මඩකලපුව", Ampara: "අම්පාර", Trincomalee: "ත්‍රිකුණාමලය",
    Kurunegala: "කුරුණෑගල", Puttalam: "පුත්තලම", Anuradhapura: "අනුරාධපුරය", Polonnaruwa: "පොළොන්නරුව", Badulla: "බදුල්ල",
    Monaragala: "මොණරාගල", Ratnapura: "රත්නපුර", Kegalle: "කෑගල්ල",
  },
  ta: {
    Colombo: "கொழும்பு", Gampaha: "கம்பஹா", Kalutara: "களுத்துறை", Kandy: "கண்டி", Matale: "மாத்தளை", "Nuwara Eliya": "நுவரெலியா",
    Galle: "காலி", Matara: "மாத்தறை", Hambantota: "அம்பாந்தோட்டை", Jaffna: "யாழ்ப்பாணம்", Kilinochchi: "கிளிநொச்சி", Mannar: "மன்னார்",
    Vavuniya: "வவுனியா", Mullaitivu: "முல்லைத்தீவு", Batticaloa: "மட்டக்களப்பு", Ampara: "அம்பாறை", Trincomalee: "திருகோணமலை",
    Kurunegala: "குருநாகல்", Puttalam: "புத்தளம்", Anuradhapura: "அனுராதபுரம்", Polonnaruwa: "பொலன்னறுவை", Badulla: "பதுளை",
    Monaragala: "மொனராகலை", Ratnapura: "இரத்தினபுரி", Kegalle: "கேகாலை",
  },
};
/** District values stay in English in the database; only the label changes. */
export function districtName(lang: Lang, district: string | null | undefined): string {
  if (!district) return "";
  return lang === "en" ? district : DISTRICT_NAMES[lang][district] ?? district;
}
