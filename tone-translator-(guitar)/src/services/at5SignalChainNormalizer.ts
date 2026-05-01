import { SignalChainElement } from "../types";

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const GEAR_NAME_MAP: Record<string, string> = {
  // Noise gates
  "noise buster": "Noise Gate",
  "noisebuster": "Noise Gate",
  "noise suppressor": "Noise Gate",
  "gate": "Noise Gate",

  // Overdrives
  "overscream": "OverScream",
  "over scream": "OverScream",
  "tube screamer": "OverScream",
  "ts style": "OverScream",

  // Amp aliases
  "british lead s100": "British Lead S100",
  "british lead 800": "Brit 8000",
  "marshall jcm800": "Brit 8000",
  "jcm800": "Brit 8000",
  "brit 8000": "Brit 8000",
  "jcm 800": "Brit 8000",

  // Cabs
  "4x12 modern m 1": "4x12 Brit 8000",
  "4x12 brit 800": "4x12 Brit 8000",
  "4x12 british 30": "4x12 Closed 75 C",
  "v30 4x12": "4x12 Closed 75 C",

  // EQ
  "graphic eq": "10 Band Graphic",
  "graphic equalizer": "10 Band Graphic",
  "parametric eq": "Parametric EQ",

  // Compressors
  "black 76": "Black 76",
  "1176": "Black 76",
  "fet compressor": "Black 76",
  "fender compressor": "Fender Compressor",
  "tube compressor": "Tube Compressor",
  "optical compressor": "Tube Compressor",
  "opto compressor": "Tube Compressor",
};

const normaliseGearName = (name: string): string => {
  const key = normalise(name);

  return GEAR_NAME_MAP[key] ?? name;
};

const normaliseSettings = (
  gearName: string,
  settings: Record<string, string | number> = {}
): Record<string, string | number> => {
  const out: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(settings)) {
    const k = normalise(key);

    // Common amp aliases
    if (k === "gain") out["Pre Amp"] = value;
    else if (k === "mid") out["Middle"] = value;
    else if (k === "volume") out["Master"] = value;

    // Noise gate aliases
    else if (k === "threshold") out["Threshold"] = value;
    else if (k === "decay") out["Release"] = value;
    else if (k === "release") {
      if (String(value).toLowerCase() === "short") out["Release"] = 100;
      else if (String(value).toLowerCase() === "medium") out["Release"] = 300;
      else if (String(value).toLowerCase() === "long") out["Release"] = 700;
      else out["Release"] = value;
    }

    // Overscream
    else if (k === "drive") out["Drive"] = value;
    else if (k === "tone") out["Tone"] = value;
    else if (k === "level") out["Level"] = value;

    else out[key] = value;
  }

  return out;
};

export function normaliseSignalChain(
  chain: SignalChainElement[]
): SignalChainElement[] {
  return chain.map((gear) => {
    const canonicalName = normaliseGearName(gear.name);

    return {
      ...gear,
      name: canonicalName,
      settings: normaliseSettings(canonicalName, gear.settings ?? {}),
    };
  });
}