// src/services/at5ParameterManifest.ts
// Maps AI/debug-friendly gear settings into AT5 XML-safe parameter attributes.

import {
  AMP_MANIFEST,
  STOMP_MANIFEST,
  CAB_MANIFEST,
  RACK_MANIFEST,
  ROOM_MANIFEST,
  TONEX_MANIFEST,
  GearItem,
  KnobDefinition,
} from "./gearManifest";
import { AT5_VERIFIED_GEAR, VerifiedGearDef, VerifiedParamDef } from "./at5VerifiedParameterOverrides";

export interface ResolvedParameter {
  friendlyName: string;
  xmlName: string;
  min: number;
  max: number;
  unit?: string;
  aliases?: string[];
  defaultValue?: number | string;
  transform?: VerifiedParamDef["transform"];
}

const ALL_GEAR: GearItem[] = [
  ...AMP_MANIFEST,
  ...STOMP_MANIFEST,
  ...CAB_MANIFEST,
  ...RACK_MANIFEST,
  ...ROOM_MANIFEST,
  ...TONEX_MANIFEST,
];

export const normalise = (value: string) =>
  String(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const compact = (value: string) => String(value).replace(/[^a-zA-Z0-9]/g, "");

const escapeXmlAttr = (value: unknown) =>
  String(value).replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case '"': return "&quot;";
      case "'": return "&apos;";
      default: return c;
    }
  });

const isKnobDefinition = (knob: string | KnobDefinition): knob is KnobDefinition =>
  typeof knob !== "string";

const scoreTextMatch = (query: string, candidates: string[]) => {
  const q = normalise(query);
  let score = 0;

  for (const rawCandidate of candidates) {
    const candidate = normalise(rawCandidate);
    if (!candidate) continue;

    if (candidate === q) score += 1000;
    if (candidate.includes(q)) score += 300;
    if (q.includes(candidate)) score += 180;

    for (const token of q.split(" ")) {
      if (token.length >= 3 && candidate.includes(token)) score += 20;
    }
  }

  return score;
};

export function findVerifiedGear(
  gearNameOrId: string | undefined,
  category?: string
): VerifiedGearDef | undefined {
  if (!gearNameOrId) return undefined;

  return AT5_VERIFIED_GEAR
    .filter((gear) => !category || gear.category === category)
    .map((gear) => ({
      gear,
      score: scoreTextMatch(gearNameOrId, [gear.name, gear.realId ?? "", ...(gear.aliases ?? [])]),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.gear;
}

export function findManifestGear(
  gearNameOrId: string | undefined,
  category?: string
): GearItem | undefined {
  if (!gearNameOrId) return undefined;

  return ALL_GEAR
    .filter((gear) => !category || gear.category === category)
    .map((gear) => ({
      gear,
      score: scoreTextMatch(gearNameOrId, [gear.id, gear.name, gear.realId ?? ""]),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.gear;
}

export function resolveVerifiedOrManifestRealId(
  gearNameOrId: string | undefined,
  category?: string
): string | undefined {
  return (
    findVerifiedGear(gearNameOrId, category)?.realId ??
    findManifestGear(gearNameOrId, category)?.realId
  );
}

export function getParameterDefinitions(
  gearNameOrId: string | undefined,
  category?: string
): ResolvedParameter[] {
  const verified = findVerifiedGear(gearNameOrId, category);
  if (verified) return verified.params;

  const gear = findManifestGear(gearNameOrId, category);
  if (!gear?.knobs) return [];

  return gear.knobs.filter(isKnobDefinition).map((knob) => {
    const baseXmlName = compact(knob.name);
    return {
      friendlyName: knob.name,
      xmlName: gear.category === "amp" && gear.paramSuffix ? `${baseXmlName}${gear.paramSuffix}` : baseXmlName,
      min: knob.min,
      max: knob.max,
      unit: knob.unit,
    };
  });
}

const parseSettingValue = (
  value: unknown,
  transform?: VerifiedParamDef["transform"]
): string | number | undefined => {
  if (value === undefined || value === null) return undefined;
  
  const text = String(value).trim().toLowerCase();
  if (text === "" || text === "undefined" || text === "null") return undefined;
  
  if (transform === "black76Ratio") {
    if (text.includes("20")) return "_20";
    if (text.includes("12")) return "_12";
    if (text.includes("8")) return "_8";
    if (text.includes("4")) return "_4";
    if (text.includes("all")) return "All";
    
    const num = parseFloat(text);
    if (num === 20) return "_20";
    if (num === 12) return "_12";
    if (num === 8) return "_8";
    if (num === 4) return "_4";
    
    return "_4";
  }

  if (typeof value === "number") return value;

  let n: number | undefined;

  // Compressor Ratio mapping (Generic fallback - legacy)
  if (text.includes("ratio") && !transform) {
    if (text.includes("4:1") || text === "4" || text === "_4") n = 0;
    else if (text.includes("8:1") || text === "8" || text === "_8") n = 1;
    else if (text.includes("12:1") || text === "12" || text === "_12") n = 2;
    else if (text.includes("20:1") || text === "20" || text === "_20") n = 3;
    else if (text.includes("all")) n = 4;
  }

  if (n === undefined) {
    const first = text.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/i)?.[0];
    if (!first) {
      // If no numeric data found, but it's a non-empty alphanumeric string,
      // treat it as a potential enum value (e.g. "Low", "All").
      if (text.length > 0 && /^[a-z0-9_\s]+$/i.test(text)) {
        return String(value).trim();
      }
      return undefined;
    }
    n = parseFloat(first);
  }
  if (!Number.isFinite(n)) return undefined;

  if (transform === "dbThresholdToLinear") {
    if (text.includes("db") || n < 0) n = Math.pow(10, n / 20);
  }

  if (transform === "khzToHzIfNeeded") {
    if (text.includes("khz")) n *= 1000;
  }

  if (transform === "noiseGateDepth") {
    // If input is 0..10 and not explicitly dB, convert to AT5 dB range: -100..-20
    if (!text.includes("db") && n >= 0 && n <= 10) {
      // 0 -> -100, 10 -> -20. Linear mapping: -100 + (n * 8)
      n = -100 + n * 8;
    }
    // Clamp to AT5 range
    n = Math.min(-20, Math.max(-100, n));
  }

  if (transform === "black76InputOutput") {
    // Treat values as dB if they include dB or are numeric.
    // UI range is -99.0 dB to 0.0 dB.
    // Convert to linear: linear = Math.pow(10, db / 20)
    
    let db = n;
    if (db > 0) db = 0; // Clamp positive to 0 dB
    if (db < -99) db = -99; // Clamp lower bound
    
    n = Math.pow(10, db / 20);
  }

  return n;
};

export function resolveParameterValue(
  value: unknown,
  min: number,
  max: number,
  transform?: VerifiedParamDef["transform"]
): string | number | undefined {
  const v = parseSettingValue(value, transform);
  if (typeof v === "string") return v;
  if (v === undefined || !Number.isFinite(v)) return undefined;
  return Math.min(max, Math.max(min, v as number));
}

export function buildMappedParameterAttrs(
  gearNameOrId: string | undefined,
  category: string,
  settings: Record<string, unknown> = {}
): string {
  const defs = getParameterDefinitions(gearNameOrId, category);

  const normalisedSettings = new Map(
    Object.entries(settings || {}).map(([key, value]) => [normalise(key), value])
  );

  // Noise Gate Depth safety
  if (normalise(gearNameOrId || "") === "noise gate") {
    const hasDepth = ["depth", "reduction"].some(alias => normalisedSettings.has(normalise(alias)));
    if (!hasDepth) {
      normalisedSettings.set("depth", "-60");
    }
  }

  if (!defs.length) {
    return Object.entries(settings || {})
      .map(([key, value]) => `${compact(key)}="${escapeXmlAttr(value)}"`)
      .join(" ");
  }

  return defs
    .map((def) => {
      const lookupNames = [def.friendlyName, def.xmlName, ...(def.aliases ?? [])];
      let raw = lookupNames
        .map((name) => normalisedSettings.get(normalise(name)))
        .find((value) => value !== undefined);

      if (raw === undefined && def.defaultValue !== undefined) {
        raw = def.defaultValue;
      }

      const resolved = resolveParameterValue(raw, def.min, def.max, def.transform);
      if (resolved === undefined) return null;

      if (typeof resolved === "string") {
        return `${def.xmlName}="${escapeXmlAttr(resolved)}"`;
      }

      return `${def.xmlName}="${Number(resolved.toFixed(6))}"`;
    })
    .filter(Boolean)
    .join(" ");
}
