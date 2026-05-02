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

const parseNumericSetting = (value: unknown, transform?: VerifiedParamDef["transform"]): number | undefined => {
  if (typeof value === "number") return value;

  const text = String(value).trim().toLowerCase();
  let n: number | undefined;

  // Compressor Ratio mapping (Black 76 etc)
  if (text.includes("ratio")) {
    if (text.includes("4:1") || text === "4" || text === "_4") n = 0;
    else if (text.includes("8:1") || text === "8" || text === "_8") n = 1;
    else if (text.includes("12:1") || text === "12" || text === "_12") n = 2;
    else if (text.includes("20:1") || text === "20" || text === "_20") n = 3;
    else if (text.includes("all")) n = 4;
  }

  if (n === undefined) {
    const first = text.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/i)?.[0];
    if (!first) return undefined;
    n = parseFloat(first);
  }
  if (!Number.isFinite(n)) return undefined;

  if (transform === "dbThresholdToLinear") {
    if (text.includes("db") || n < 0) n = Math.pow(10, n / 20);
  }

  if (transform === "khzToHzIfNeeded") {
    if (text.includes("khz")) n *= 1000;
  }

  return n;
};

export function clampParameterValue(
  value: unknown,
  min: number,
  max: number,
  transform?: VerifiedParamDef["transform"]
): number | undefined {
  const n = parseNumericSetting(value, transform);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n as number));
}

export function buildMappedParameterAttrs(
  gearNameOrId: string | undefined,
  category: string,
  settings: Record<string, unknown> = {}
): string {
  const defs = getParameterDefinitions(gearNameOrId, category);

  const normalisedSettings = new Map(
    Object.entries(settings).map(([key, value]) => [normalise(key), value])
  );

  // Noise Gate Depth safety
  if (normalise(gearNameOrId || "") === "noise gate") {
    const hasDepth = ["depth", "reduction"].some(alias => normalisedSettings.has(normalise(alias)));
    if (!hasDepth) {
      normalisedSettings.set("depth", "-60");
    }
  }

  if (!defs.length) {
    return Object.entries(settings)
      .map(([key, value]) => `${compact(key)}="${escapeXmlAttr(value)}"`)
      .join(" ");
  }

  return defs
    .map((def) => {
      const lookupNames = [def.friendlyName, def.xmlName, ...(def.aliases ?? [])];
      const raw = lookupNames
        .map((name) => normalisedSettings.get(normalise(name)))
        .find((value) => value !== undefined);

      const clamped = clampParameterValue(raw, def.min, def.max, def.transform);
      if (clamped === undefined) return null;

      return `${def.xmlName}="${Number(clamped.toFixed(6))}"`;
    })
    .filter(Boolean)
    .join(" ");
}
