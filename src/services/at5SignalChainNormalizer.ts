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
  "noise gate": "Noise Gate",
  "gate": "Noise Gate",

  // Overdrives
  "overscream": "OverScream",
  "over scream": "OverScream",
  "over-scream": "OverScream",
  "tube screamer": "OverScream",
  "ts style": "OverScream",
  "ts9": "OverScream",
  "ts 9": "OverScream",

  // Brit / Marshall style amps
  "brit 800": "Brit 8000",
  "brit 8000": "Brit 8000",
  "british lead 800": "Brit 8000",
  "british lead s jcm800": "Brit 8000",
  "british lead s100 jcm800": "British Lead S100",
  "marshall jcm800": "Brit 8000",
  "jcm800": "Brit 8000",
  "jcm 800": "Brit 8000",

  // Other known amp aliases
  "british lead s100": "British Lead S100",
  "british tube lead 1": "British Tube Lead 1",
  "mesa mark v": "Mark V",
  "mark v": "Mark V",

  // Cabs
  "4x12 brit 800": "4x12 Brit 8000",
  "4x12 brit 8000": "4x12 Brit 8000",
  "4x12 modern m 1": "4x12 Brit 8000",
  "4x12 british 30": "4x12 Brit 8000",
  "4x12 british 30 v30 speakers": "4x12 Brit 8000",
  "v30 4x12": "4x12 Brit 8000",

  // EQ / rack aliases
  "graphic eq": "10 Band Graphic",
  "graphic equalizer": "10 Band Graphic",
  "10 band graphic": "10 Band Graphic",
  "parametric eq": "Parametric EQ",

  // Compressor aliases
  "digital comp": "Digital Comp",
  "digital compressor": "Digital Compressor",
  "black 76": "Black 76",
  "fender compressor": "Fender Compressor",
  "tube compressor": "Tube Compressor",
};

const normaliseGearName = (name: string): string => {
  const key = normalise(name);
  return GEAR_NAME_MAP[key] ?? name;
};

const isNumericLike = (value: unknown) =>
  typeof value === "number" ||
  (typeof value === "string" && value.trim().length > 0);

const normaliseTimedValue = (value: unknown): unknown => {
  const raw = String(value).trim().toLowerCase();

  if (raw === "short") return "100 ms";
  if (raw === "medium") return "300 ms";
  if (raw === "long") return "700 ms";

  return value;
};

const normaliseNoiseGateSettings = (
  settings: Record<string, unknown> = {}
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(settings)) {
    const k = normalise(key);

    if (k === "threshold") {
      out["Threshold"] = value;
    } else if (k === "release" || k === "decay") {
      out["Release"] = normaliseTimedValue(value);
    } else if (k === "depth") {
      out["Depth"] = value;
    } else {
      out[key] = value;
    }
  }

  if (out["Depth"] === undefined) {
    out["Depth"] = "-60";
  }

  return out;
};

const normaliseOverScreamSettings = (
  settings: Record<string, unknown> = {}
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(settings)) {
    const k = normalise(key);

    if (k === "drive") out["Drive"] = value;
    else if (k === "tone") out["Tone"] = value;
    else if (k === "level" || k === "volume" || k === "output") out["Level"] = value;
    else out[key] = value;
  }

  return out;
};

const normaliseAmpSettings = (
  settings: Record<string, unknown> = {}
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(settings)) {
    const k = normalise(key);

    if (k === "gain" || k === "preamp" || k === "preamp gain" || k === "pre amp") {
      out["Pre Amp"] = value;
    } else if (k === "mid" || k === "mids" || k === "middle") {
      out["Middle"] = value;
    } else if (k === "volume" || k === "output" || k === "master") {
      out["Master"] = value;
    } else if (k === "bass") {
      out["Bass"] = value;
    } else if (k === "treble") {
      out["Treble"] = value;
    } else if (k === "presence") {
      out["Presence"] = value;
    } else {
      out[key] = value;
    }
  }

  return out;
};

const normaliseGraphicEqSettings = (
  settings: Record<string, unknown> = {}
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(settings)) {
    const k = normalise(key);

    // Keep original frequency labels because at5ParameterManifest /
    // verified override mapping converts these to Band100, Band800, etc.
    if (
      k.includes("hz") ||
      k.includes("khz") ||
      /^[0-9]+$/.test(k)
    ) {
      out[key] = value;
    } else {
      out[key] = value;
    }
  }

  return out;
};

const normaliseCompressorSettings = (
  settings: Record<string, unknown> = {}
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(settings)) {
    const k = normalise(key);

    if (k === "ratio") out["Ratio"] = value;
    else if (k === "threshold") out["Threshold"] = value;
    else if (k === "attack") out["Attack"] = value;
    else if (k === "release" || k === "decay") out["Release"] = normaliseTimedValue(value);
    else if (k === "input") out["Input"] = value;
    else if (k === "output" || k === "level" || k === "volume") out["Output"] = value;
    else out[key] = value;
  }

  return out;
};

const normaliseCabSettings = (
  settings: Record<string, unknown> = {}
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(settings)) {
    const k = normalise(key);

    if (k === "speaker" || k === "speaker swap" || k === "speaker type") {
      out["Speaker"] = value;
    } else if (k === "mic 1" || k === "mic1") {
      out["Mic_1"] = value;
    } else if (k === "mic 2" || k === "mic2") {
      out["Mic_2"] = value;
    } else if (k === "mic 1 level" || k === "mic1 level") {
      out["Mic_1_Level"] = value;
    } else if (k === "mic 2 level" || k === "mic2 level") {
      out["Mic_2_Level"] = value;
    } else if (k === "room" || k === "room type") {
      out["Room"] = value;
    } else if (k === "room level") {
      out["Room_Level"] = value;
    } else if (k === "cab link") {
      out["Cab_Link"] = value;
    } else {
      out[key] = value;
    }
  }

  return out;
};

const normaliseSettings = (
  gearName: string,
  gearType: string,
  settings: Record<string, unknown> = {}
): Record<string, unknown> => {
  const canonicalName = normaliseGearName(gearName);
  const n = normalise(canonicalName);

  if (canonicalName === "Noise Gate") {
    return normaliseNoiseGateSettings(settings);
  }

  if (canonicalName === "OverScream") {
    return normaliseOverScreamSettings(settings);
  }

  if (gearType === "amp") {
    return normaliseAmpSettings(settings);
  }

  if (gearType === "cab") {
    return normaliseCabSettings(settings);
  }

  if (n.includes("graphic")) {
    return normaliseGraphicEqSettings(settings);
  }

  if (
    n.includes("compressor") ||
    n.includes("comp") ||
    n.includes("black 76")
  ) {
    return normaliseCompressorSettings(settings);
  }

  return settings;
};

export function normaliseSignalChain(
  chain: SignalChainElement[]
): SignalChainElement[] {
  return chain.map((gear) => {
    const canonicalName = normaliseGearName(gear.name);

    return {
      ...gear,
      name: canonicalName,
      settings: normaliseSettings(
        canonicalName,
        gear.type,
        gear.settings ?? {}
      ),
    };
  });
}