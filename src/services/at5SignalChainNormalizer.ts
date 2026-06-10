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

  // Guide-derived amplifier aliases
  "bogner ecstasy": "German 34",
  "bogner xtc": "German 34",
  "bogner 3534": "German 34",
  "bogner": "German 34",
  "german 34": "German 34",

  "friedman pink taco": "MiniPlex 20",
  "pink taco": "MiniPlex 20",
  "miniplex 20": "MiniPlex 20",
  "friedman pt20": "MiniPlex 20",
  "friedman": "MiniPlex 20",

  "peavey 5150": "Metal Lead V",
  "5150": "Metal Lead V",
  "evh 5150": "Metal Lead V",
  "metal lead v": "Metal Lead V",

  "soldano slo100": "SLD 100",
  "soldano slo-100": "SLD 100",
  "slo-100": "SLD 100",
  "slo100": "SLD 100",
  "sld 100": "SLD 100",

  "diezel vh4": "VHandcraft 4",
  "diezel vh-4": "VHandcraft 4",
  "vh4": "VHandcraft 4",
  "vhandcraft 4": "VHandcraft 4",
  "diezel": "VHandcraft 4",

  "randall warhead": "Metal Lead W",
  "warhead": "Metal Lead W",
  "metal lead w": "Metal Lead W",

  "orange dual terror": "Orange Dual Terror",
  "dual terror": "Orange Dual Terror",

  "mesa mark iii": "American Clean MKIII",
  "mark iii combo": "American Clean MKIII",
  "american clean mkiii": "American Clean MKIII",
  "american lead mkiii": "American Lead MKIII",

  "vox ac30 top boost": "British Blue Tube 30TB",
  "vox ac30 blue panel": "British Blue Tube 30TB",
  "ac30 blue panel": "British Blue Tube 30TB",
  "british blue tube 30tb": "British Blue Tube 30TB",

  "vox ac30 copper panel": "British Copper 30TB",
  "ac30 copper panel": "British Copper 30TB",
  "british copper 30tb": "British Copper 30TB",
  "british copper": "British Copper 30TB",

  "aguilar db750": "New York B750",
  "aguilar": "New York B750",
  "new york b750": "New York B750",

  "ampeg ba500": "SVX-500",
  "svx 500": "SVX-500",

  "ampeg b15r": "SVX-15R",
  "portaflex": "SVX-15R",
  "svx 15r": "SVX-15R",

  "ampeg svt classic": "SVX-CL",
  "svt classic": "SVX-CL",
  "svx cl": "SVX-CL",

  "ampeg svt 4 pro": "SVX-PRO",
  "svt 4 pro": "SVX-PRO",
  "svx pro": "SVX-PRO",

  "ampeg svt vr": "SVX-VR",
  "svt vr": "SVX-VR",
  "svx vr": "SVX-VR",

  "ampeg v 4b": "SVX-4B",
  "v 4b": "SVX-4B",
  "svx 4b": "SVX-4B",

  "ampeg heritage b 15n": "SVX-15N",
  "ampeg heritage": "SVX-15N",
  "svx 15n": "SVX-15N",

  "carvin v3m": "V3M",
  "v3m": "V3M",

  "randall rg 100 es": "Darrell 100",
  "randall rg100": "Darrell 100",
  "darrell 100": "Darrell 100",

  "dr z maz 18": "MAZ 18 Jr.",
  "maz 18 jr": "MAZ 18 Jr.",
  "maz 18": "MAZ 18 Jr.",

  "dr z wreck": "Z Wreck",
  "z wreck": "Z Wreck",

  "engl e650": "E650",
  "e650": "E650",

  "engl powerball": "Powerball",
  "powerball": "Powerball",

  "tonex": "AmpliTube TONEX",
  "amplitube tonex": "AmpliTube TONEX",

  // Cabs
  "4x12 british lead s100": "4x12 British Lead S100",
  "4x12 british tube lead 1": "Cabinet British Tube Lead 1",
  "4x12 brit 800": "4x12 Brit 8000",
  "4x12 brit 8000": "4x12 Brit 8000",
  "4x12 british 30": "4x12 Brit 8000",
  "4x12 british 30 v30 speakers": "4x12 Brit 8000",
  "v30 4x12": "4x12 Brit 8000",
  "greenbacks": "4x12 Brit 8000", // Generic mapping for greenback cabs if needed

  // Detailed Cabinet & Combo mappings
  "4x12 closed 75 c": "4x12 Closed 75 C",
  "4x12 closed 75c": "4x12 Closed 75 C",
  "4x12 modern closed": "4x12 Modern Closed",
  "4x12 standard rectifier": "4x12 Standard Rectifier",
  "2x12 jazz": "2x12 Jazz",
  "1x12 65 deluxe reverb": "1x12 '65 Deluxe Reverb",
  "1x12 deluxe reverb": "1x12 '65 Deluxe Reverb",
  "2x12 65 twin reverb": "2x12 '65 Twin Reverb",
  "2x12 twin reverb": "2x12 '65 Twin Reverb",
  "1x10 65 princeton": "1x10 '65 Princeton",
  "1x10 princeton": "1x10 '65 Princeton",
  "4x10 59 bassman": "4x10 '59 Bassman",
  "4x10 bassman": "4x10 '59 Bassman",
  "4x12 closed vintage": "4x12 Closed Vintage",

  // Speaker normalizations
  "brit green": "Brit Green",
  "greenback": "Brit Green",
  "celestion greenback": "Brit Green",
  "brit v1": "Brit V1",
  "brit v2": "Brit V2",
  "vintage 30": "Brit V1",
  "celestion vintage 30": "Brit V1",
  "v30": "Brit V1",
  "brit 75": "Brit 75",
  "g12t 75": "Brit 75",
  "g12t-75": "Brit 75",
  "celestion g12t-75": "Brit 75",
  "american 12c": "American 12C",
  "jensen c12q": "American 12C",
  "american 12k": "American 12K",
  "jensen c12k": "American 12K",
  "ev darkness": "EV Darkness",
  "evm 12l": "EV Darkness",
  "evm-12l": "EV Darkness",
  "electro voice evm 12l": "EV Darkness",
  "electro-voice evm-12l": "EV Darkness",
  "jazz 12": "Jazz 12",

  // EQ / rack aliases
  "graphic eq": "10 Band Graphic",
  "graphic equalizer": "10 Band Graphic",
  "10 band graphic": "10 Band Graphic",
  "parametric eq": "Parametric EQ",
  "eq pg": "EQ PG",
  "eq-pg": "EQ PG",
  "pg graphic eq": "EQ PG",
  "pg graphic": "EQ PG",
  "pg equalizer": "EQ PG",
  "eq-pg rack": "EQ PG",
  "eq pg rack": "EQ PG",

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

  if (raw === "short" || raw === "fast") return "20 ms";
  if (raw === "medium") return "300 ms";
  if (raw === "long" || raw === "slow") return "700 ms";

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

  if (n.includes("graphic") || n === "eq pg") {
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