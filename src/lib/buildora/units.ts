export const FT_PER_M = 3.28084;
export const SQFT_PER_SQM = 10.7639;
/** 1 perch = 25.29285264 m² (Sri Lankan land unit) */
export const SQM_PER_PERCH = 25.29285264;

export const mToFt = (m: number) => m * FT_PER_M;
export const ftToM = (ft: number) => ft / FT_PER_M;
export const sqmToSqft = (a: number) => a * SQFT_PER_SQM;
export const sqmToPerch = (a: number) => a / SQM_PER_PERCH;

export const fmt = (n: number, d = 1) =>
  Number.isFinite(n) ? n.toLocaleString("en-LK", { maximumFractionDigits: d, minimumFractionDigits: 0 }) : "–";

export const lkr = (n: number) => "LKR " + Math.round(n).toLocaleString("en-LK");
