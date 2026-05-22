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
  "noise filter": "Noise Gate",
  "noise reducer": "Noise Gate",
  "noise reduction": "Noise Gate",

  // Overdrives
  "overscream": "OverScream",
  "over scream": "OverScream",
  "over-scream": "OverScream",
  "tube screamer": "OverScream",
  "diode overdrive": "OverScream",
  "diode od": "OverScream",
  "ts style": "OverScream",
  "ts9": "OverScream",
  "ts 9": "OverScream",
  "ts808": "OverScream",
  "ts 808": "OverScream",
  "blues driver": "Blues Driver",
  "bd-2": "Blues Driver",
  "bd2": "Blues Driver",
  "metal zone": "Metal Zone",
  "mt-2": "Metal Zone",
  "mt2": "Metal Zone",
  "revv g3": "Revv G3",
  "g3": "Revv G3",
  "centaur": "Centaur",
  "klon": "Centaur",
  "pro co rat": "The RAT",
  "rat": "The RAT",
  "fulltone ocd": "OCD",
  "ocd": "OCD",
  "morning glory": "Morning Glory",
  "mxr distortion +": "Distortion +",
  "distortion+": "Distortion +",
  "mxr carbon copy": "Carbon Copy",
  "carbon copy": "Carbon Copy",
  "reverb": "Digital Reverb", // Mapping RV-6 style requests
  "tremolo": "Tremolo",

  // Fuzz
  "fuzz face": "Tone Bender", // Mapping to Tone Bender or similar if Fuzz Face isn't explicit
  "germanium fuzz": "Tone Bender",
  "big muff": "Big Pig",
  "big pig": "Big Pig",

  // Brit / Marshall style amps
  "brit 800": "Brit 8000",
  "brit 8000": "Brit 8000",
  "british lead 800": "Brit 8000",
  "british lead s jcm800": "Brit 8000",
  "british lead s100 jcm800": "British Lead S100",
  "marshall jcm800": "Brit 8000",
  "jcm800": "Brit 8000",
  "jcm 800": "Brit 8000",
  "jazz 120": "Jazz Amp 120",
  "jc120": "Jazz Amp 120",
  "jc 120": "Jazz Amp 120",
  "jazz amp": "Jazz Amp 120",
  "plexi": "British Lead S100",
  "super lead": "British Lead S100",
  "marshall plexi": "British Lead S100",

  // Vox style
  "ac30": "British Copper 30 TB",
  "ac 30": "British Copper 30 TB",
  "vox ac30": "British Copper 30 TB",

  // Mesa / Modern High Gain
  "rectifier": "Dual Rectifier",
  "dual rec": "Dual Rectifier",
  "triple rec": "Dual Rectifier",
  "mesa rectifier": "Dual Rectifier",
  "modern lead": "Dual Rectifier",
  "4x12 recto traditional": "4x12 Recto Traditional Slant",
  "4x12 recto": "4x12 Recto Traditional Slant",
  "4x12 recto slant": "4x12 Recto Traditional Slant",
  "4x12 recto traditional slant": "4x12 Recto Traditional Slant",
  "mesa recto 4x12": "4x12 Recto Traditional Slant",
  "4x12 mesa recto traditional": "4x12 Recto Traditional Slant",
  "4x12 mesa recto traditional slant": "4x12 Recto Traditional Slant",
  "4x12 standard recto": "4x12 Standard Rectifier",
  "4x12 oversize": "4x12 Standard Rectifier",
  "4x12 mesa boogie": "4x12 Standard Rectifier",

  // Fender style
  "twin reverb": "Twin Reverb",
  "fender twin": "Twin Reverb",
  "deluxe reverb": "Deluxe Reverb",
  "fender deluxe": "Deluxe Reverb",
  "princeton": "Princeton",
  "bassman": "Bassman",

  // Brit / Marshall style amps (New verified aliases)
  "british lead s100": "British Lead S100",
  "british tube lead 1": "British Tube Lead 1",
  "british lead s": "British Tube Lead 1",
  "british lead s (jcm800)": "British Tube Lead 1",
  "british lead s100 (jcm800)": "British Tube Lead 1",
  "british lead 100": "British Tube Lead 1",
  "marshall s100": "British Tube Lead 1",

  // Other known amp aliases
  "mesa mark v": "Mark V",
  "mark v": "Mark V",

  // Cabs
  "4x12 british lead s100": "4x12 British Lead S100",
  "4x12 british tube lead 1": "Cabinet British Tube Lead 1",
  "4x12 brit 800": "4x12 Brit 8000",
  "4x12 brit 8000": "4x12 Brit 8000",
  "4x12 modern m 1": "4x12 Brit 8000",
  "4x12 british 30": "4x12 Brit 8000",
  "4x12 british 30 v30 speakers": "4x12 Brit 8000",
  "v30 4x12": "4x12 Brit 8000",
  "greenbacks": "4x12 Brit 8000", // Generic mapping for greenback cabs if needed

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

const normaliseTimedValue = (value: unknown): string | number => {
  const raw = String(value).trim().toLowerCase();

  if (raw === "short") return "100 ms";
  if (raw === "medium") return "300 ms";
  if (raw === "long") return "700 ms";

  return value as string | number;
};

const normaliseNoiseGateSettings = (
  settings: Record<string, any> = {}
): Record<string, string | number> => {
  const out: Record<string, string | number> = {};

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

  if (out["Release"] === undefined) {
    out["Release"] = "200 ms";
  }

  if (out["Depth"] === undefined) {
    out["Depth"] = "-60";
  }

  return out;
};

const normaliseOverScreamSettings = (
  settings: Record<string, any> = {}
): Record<string, string | number> => {
  const out: Record<string, string | number> = {};

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
  settings: Record<string, any> = {}
): Record<string, string | number> => {
  const out: Record<string, string | number> = {};

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
  settings: Record<string, any> = {}
): Record<string, string | number> => {
  const out: Record<string, string | number> = {};

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
  settings: Record<string, any> = {}
): Record<string, string | number> => {
  const out: Record<string, string | number> = {};

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
  settings: Record<string, any> = {}
): Record<string, string | number> => {
  const out: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(settings)) {
    const k = normalise(key);

    if (k === "speaker" || k === "speaker swap" || k === "speaker type" || k === "speakers") {
      out["Speaker"] = value;
    } else if (k === "speaker a") {
      // AI sometimes confuses mic A with speaker A
      if (/(57|87|414|421|121|mic|condenser|dynamic|ribbon)/i.test(String(value))) {
        out["Mic_1"] = value;
      } else {
        out["Speaker"] = value;
      }
    } else if (k === "speaker b") {
      if (/(57|87|414|421|121|mic|condenser|dynamic|ribbon)/i.test(String(value))) {
        out["Mic_2"] = value;
      }
    } else if (k === "mic 1" || k === "mic1" || k === "mic a") {
      out["Mic_1"] = value;
    } else if (k === "mic 2" || k === "mic2" || k === "mic b") {
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
  settings: Record<string, any> = {}
): Record<string, string | number> => {
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