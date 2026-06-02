// src/services/presetExporter.ts
// Deterministic AT5 .at5p XML exporter. Do not call Gemini to serialize presets.

import { normaliseSignalChain } from "./at5SignalChainNormalizer";
import { ToneResult, SignalChainElement } from "../types";
import { AT5_EMPTY_SLOT_GUID, findAT5GearGuid, findAT5Gear, getAt5Catalog } from "./at5Catalog";
import {
  buildMappedParameterAttrs,
  resolveVerifiedOrManifestRealId,
} from "./at5ParameterManifest";

import { getVerifiedCabs, getVerifiedSpeakers, getVerifiedMics } from "./at5VerifiedProtocols";

const DEFAULT_AMP_GUID = "8fe96936-5178-4950-9b80-d89c32534bad"; // Brit 8000 / JCM800
const DEFAULT_CAB_GUID = "7c0b8ce1-cbb4-4e5b-9973-a572143ddb2b"; // 4x12 Brit 8000
const DEFAULT_SPEAKER_GUID = "e372dd04b11d49588c290fbe341e97ca"; // Brit 75
const DEFAULT_MIC0_GUID = "1e41acc4-85af-4e84-bee4-eabc0be5fef1"; // Dynamic 57
const DEFAULT_MIC1_GUID = "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb"; // Condenser 87

const VERIFIED_RACK_NAMES = [
  "parametric eq",
  "graphic eq",
  "10 band graphic",
  "eq pg",
  "eq-pg",
  "black 76",
  "white 2a",
  "white-2a",
  "fender compressor",
  "white 2a (levelling amp)",
  "tube compressor",
];

const generateUUID = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};

const escapeXml = (unsafe: unknown) =>
  String(unsafe ?? "").replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return c;
    }
  });


const cleanXmlAttrString = (attrs: string) => {
  return String(attrs ?? "")
    .replace(/\s*[A-Za-z0-9_]+="undefined"/g, "")
    .replace(/\s*[A-Za-z0-9_]+="null"/g, "")
    .replace(/\s*[A-Za-z0-9_]+=""/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const ensureBrit8000Sensitivity = (ampGuid: string, attrs: string) => {
  let cleaned = cleanXmlAttrString(attrs);

  if (ampGuid === DEFAULT_AMP_GUID) {
    cleaned = cleaned
      .replace(/\s*Sensitivity_JCM800AT4="undefined"/g, "")
      .replace(/\s*Sensitivity_JCM800AT4="null"/g, "")
      .replace(/\s*Sensitivity_JCM800AT4=""/g, "")
      .trim();

    if (!cleaned.includes("Sensitivity_JCM800AT4=")) {
      cleaned = `Sensitivity_JCM800AT4="1" ${cleaned}`.trim();
    }
  }

  return cleaned;
};

const resolveGuid = (
  gearName: string | undefined,
  category: "amp" | "cab" | "stomp" | "rack",
  fallbackGuid: string
): string => {
  // 1. Try to find an exactly mapped ID (verified or manifest)
  const resolved = resolveVerifiedOrManifestRealId(gearName, category) ??
    findAT5GearGuid(gearName, category);
  
  if (resolved && resolved !== "null" && resolved !== "undefined") {
    return resolved;
  }

  // 2. Fallback to a safe GUID to prevent broken XML, but we will catch this in debug
  return fallbackGuid;
};



const isPostAmpRack = (gear: SignalChainElement) => {
  const n = gear.name.toLowerCase();

  return ["delay", "reverb", "eq", "compressor", "limiter", "rack"].some((x) =>
    n.includes(x)
  );
};

const isVerifiedRackGear = (gear: SignalChainElement) => {
  const n = gear.name.toLowerCase();
  if (VERIFIED_RACK_NAMES.some((name) => n.includes(name))) return true;
  
  // Check if we can resolve a GUID from the catalog for this as a rack item
  const rackGuid = resolveGuid(gear.name, "rack", AT5_EMPTY_SLOT_GUID);
  if (rackGuid !== AT5_EMPTY_SLOT_GUID) return true;

  // If it's a pedal being pushed to the rack pool (e.g. a delay pedal), 
  // check if we have a stomp GUID for it.
  if (gear.type === "pedal") {
    const stompGuid = resolveGuid(gear.name, "stomp", AT5_EMPTY_SLOT_GUID);
    return stompGuid !== AT5_EMPTY_SLOT_GUID;
  }

  return false;
};

const emptySlots = (count: number) =>
  Array.from({ length: count }, (_, i) => `        <Slot${i} />`).join("\r\n");

const emptySlotAttrs = (count: number) =>
  Array.from(
    { length: count },
    (_, i) => `Stomp${i}="${AT5_EMPTY_SLOT_GUID}"`
  ).join(" ");

const buildStompSection = (
  sectionName: string,
  gears: SignalChainElement[],
  count: number,
  group: "stomp" | "rack" = "stomp"
) => {
  const slotAttrs = Array.from({ length: count }, (_, i) => {
    const gear = gears[i];
    const guid = gear
      ? resolveGuid(gear.name, group, AT5_EMPTY_SLOT_GUID)
      : AT5_EMPTY_SLOT_GUID;

    return `Stomp${i}="${guid}"`;
  }).join(" ");

  const slots = Array.from({ length: count }, (_, i) => {
    const gear = gears[i];

    if (!gear) return `        <Slot${i} />`;

    const attrs = cleanXmlAttrString(
      buildMappedParameterAttrs(gear.name, group, gear.settings ?? {})
    );

    return `        <Slot${i} Bypass="0" FullScreen="0"${
      attrs ? " " + attrs : ""
    } />`;
  }).join("\r\n");

  return `    <${sectionName} Bypass="0" Mute="0" OutputVolume="1" ${slotAttrs}>\r\n${slots}\r\n    </${sectionName}>`;
};

const buildRackSection = (
  sectionName: string,
  gears: SignalChainElement[],
  count = 2
) => {
  const slotAttrs = Array.from({ length: count }, (_, i) => {
    const gear = gears[i];
    const guid = gear
      ? resolveGuid(gear.name, "rack", AT5_EMPTY_SLOT_GUID)
      : AT5_EMPTY_SLOT_GUID;

    return `Stomp${i}="${guid}"`;
  }).join(" ");

  const slots = Array.from({ length: count }, (_, i) => {
    const gear = gears[i];

    if (!gear) return `        <Slot${i} />`;

    const attrs = cleanXmlAttrString(
      buildMappedParameterAttrs(gear.name, "rack", gear.settings ?? {})
    );

    return `        <Slot${i} Bypass="0" FullScreen="0"${
      attrs ? " " + attrs : ""
    } />`;
  }).join("\r\n");

  return `    <${sectionName} Bypass="0" Mute="0" OutputVolume="1" ${slotAttrs}>\r\n${slots}\r\n    </${sectionName}>`;
};

const buildAmpSection = (
  section: "A" | "B" | "C",
  amp?: SignalChainElement
) => {
  const ampName = amp?.name ?? "Brit 8000";
  const ampGuid = resolveGuid(ampName, "amp", DEFAULT_AMP_GUID);

  let ampAttrs = buildMappedParameterAttrs(
    ampName,
    "amp",
    amp?.settings ?? {}
  );

  if (!ampAttrs && ampGuid === DEFAULT_AMP_GUID) {
    ampAttrs =
      'Sensitivity_JCM800AT4="1" Presence_JCM800AT4="5" Bass_JCM800AT4="5" Middle_JCM800AT4="5" Treble_JCM800AT4="6" Master_JCM800AT4="5" PreAmp_JCM800AT4="5"';
  }

  // Safety: never allow undefined/null XML attributes to be written.
  // Brit 8000/JCM800 presets must always include Sensitivity_JCM800AT4="1".
  ampAttrs = ensureBrit8000Sensitivity(ampGuid, ampAttrs);

  return `    <Amp${section} Bypass="0" Mute="0" OutputVolume="1" Model="${ampGuid}">\r\n        <Amp ${ampAttrs} />\r\n    </Amp${section}>`;
};

const getSettingText = (
  gear: SignalChainElement | undefined,
  keys: string[]
) => {
  if (!gear) return "";

  const found = Object.entries(gear.settings ?? {}).find(([k]) =>
    keys.some((key) =>
      k
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        === key.toLowerCase().replace(/[^a-z0-9]/g, "")
    )
  );

  return String(found?.[1] ?? "");
};

const normalise = (value: string) =>
  String(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const scoreText = (query: string, candidates: string[]): number => {
  const q = normalise(query);
  if (!q) return 0;
  
  let best = 0;
  for (const rawCandidate of candidates) {
    const candidate = normalise(rawCandidate);
    if (!candidate) continue;

    let score = 0;
    
    // 1. Exact match gets massive boost
    if (candidate === q) {
      score += 2000;
    }
    
    // 2. Substring matches
    if (candidate.includes(q)) {
      score += 400 + (candidate.length - q.length) * -2;
    } else if (q.includes(candidate)) {
      score += 200 + (q.length - candidate.length) * -2;
    }

    // 3. Word token matching with generous word match weighting
    const qWords = q.split(" ").filter(w => w.length >= 2);
    const cWords = candidate.split(" ").filter(w => w.length >= 2);
    let matchedWords = 0;
    for (const w of qWords) {
      if (cWords.includes(w)) {
        matchedWords++;
      }
    }

    if (matchedWords > 0) {
      // Scale by percentage of query words matched to reward specificity
      const queryCoverage = matchedWords / qWords.length;
      score += matchedWords * 150 + queryCoverage * 300;
    }

    if (score > best) {
      best = score;
    }
  }

  return best;
};

const scoreNames = (query: string, candidates: string[]) => {
  const score = scoreText(query, candidates);
  return score >= 150 ? 1 : 0;
};

const getUnifiedCabCandidates = () => {
  const map = new Map<string, Set<string>>();
  
  // 1. Load verified cabs
  for (const v of getVerifiedCabs()) {
    if (!v.guid || v.guid === "null") continue;
    const key = v.guid.toLowerCase();
    if (!map.has(key)) map.set(key, new Set<string>());
    const set = map.get(key)!;
    v.aliases.forEach(a => { if (a) set.add(a); });
  }

  // 2. Load general catalog cabs
  const catalog = getAt5Catalog() || [];
  for (const item of catalog) {
    if (item.group !== "cab" || !item.guid || item.guid === "null") continue;
    const key = item.guid.toLowerCase();
    if (!map.has(key)) map.set(key, new Set<string>());
    const set = map.get(key)!;
    if (item.displayName) set.add(item.displayName);
    if (item.otherNames) item.otherNames.forEach(o => { if (o) set.add(o); });
  }

  return Array.from(map.entries()).map(([guid, aliasSet]) => ({
    guid,
    aliases: Array.from(aliasSet)
  }));
};

const getUnifiedSpeakerCandidates = () => {
  const map = new Map<string, Set<string>>();
  
  // 1. Load verified speakers
  for (const v of getVerifiedSpeakers()) {
    if (!v.guid || v.guid === "null") continue;
    const key = v.guid.toLowerCase();
    if (!map.has(key)) map.set(key, new Set<string>());
    const set = map.get(key)!;
    v.aliases.forEach(a => { if (a) set.add(a); });
  }

  // 2. Load general catalog speakers
  const catalog = getAt5Catalog() || [];
  for (const item of catalog) {
    if (item.group !== "speaker" || !item.guid || item.guid === "null") continue;
    const key = item.guid.toLowerCase();
    if (!map.has(key)) map.set(key, new Set<string>());
    const set = map.get(key)!;
    if (item.displayName) set.add(item.displayName);
    if (item.otherNames) item.otherNames.forEach(o => { if (o) set.add(o); });
  }

  return Array.from(map.entries()).map(([guid, aliasSet]) => ({
    guid,
    aliases: Array.from(aliasSet)
  }));
};

const getUnifiedMicCandidates = () => {
  const map = new Map<string, Set<string>>();
  
  // 1. Load verified mics
  for (const v of getVerifiedMics()) {
    if (!v.guid || v.guid === "null") continue;
    const key = v.guid.toLowerCase();
    if (!map.has(key)) map.set(key, new Set<string>());
    const set = map.get(key)!;
    v.aliases.forEach(a => { if (a) set.add(a); });
  }

  // 2. Load general catalog mics
  const catalog = getAt5Catalog() || [];
  for (const item of catalog) {
    if (item.group !== "mic" || !item.guid || item.guid === "null") continue;
    const key = item.guid.toLowerCase();
    if (!map.has(key)) map.set(key, new Set<string>());
    const set = map.get(key)!;
    if (item.displayName) set.add(item.displayName);
    if (item.otherNames) item.otherNames.forEach(o => { if (o) set.add(o); });
  }

  return Array.from(map.entries()).map(([guid, aliasSet]) => ({
    guid,
    aliases: Array.from(aliasSet)
  }));
};

const getMicId = (name: string) => {
  if (!name) return DEFAULT_MIC0_GUID;
  const scored = getUnifiedMicCandidates()
    .map(c => ({ guid: c.guid, score: scoreText(name, c.aliases) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.guid ?? DEFAULT_MIC0_GUID;
};

const resolveCabGuid = (name?: string) => {
  if (!name) return DEFAULT_CAB_GUID;
  
  const scored = getUnifiedCabCandidates()
    .map(c => ({ guid: c.guid, score: scoreText(name, c.aliases) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  
  if (scored.length > 0 && scored[0].score >= 150) {
    return scored[0].guid;
  }
  
  return DEFAULT_CAB_GUID;
};

const resolveSpeakerGuid = (name?: string) => {
  if (!name) return DEFAULT_SPEAKER_GUID;
  
  const scored = getUnifiedSpeakerCandidates()
    .map(c => ({ guid: c.guid, score: scoreText(name, c.aliases) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  
  if (scored.length > 0 && scored[0].score >= 150) {
    return scored[0].guid;
  }
  
  return DEFAULT_SPEAKER_GUID;
};

const getRoomType = (cab?: SignalChainElement) => {
  const room = getSettingText(cab, ["room", "room_type"]);

  if (/small/i.test(room)) return "Small Studio";
  if (/medium|mid/i.test(room)) return "Mid Studio";
  if (/large/i.test(room)) return "Large Studio";

  return "Large Studio";
};

const buildCabSection = (
  section: "A" | "B" | "C",
  cab?: SignalChainElement
) => {
  const cabGuid = resolveCabGuid(cab?.name);
  const speakerGuid = resolveSpeakerGuid(getSettingText(cab, ["speaker", "speaker type", "speaker swap"]));
  
  const mic1Req = getSettingText(cab, ["mic_1", "mic 1", "mic1"]);
  const mic2Req = getSettingText(cab, ["mic_2", "mic 2", "mic2"]);
  
  const mic0 = mic1Req ? getMicId(mic1Req) : "1e41acc4-85af-4e84-bee4-eabc0be5fef1"; // Dynamic 57 fallback
  const mic1 = mic2Req ? getMicId(mic2Req) : "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb"; // Condenser 87 fallback
  const roomType = getRoomType(cab);

  return `    <Cab${section} Bypass="0" Mute="0" CabModel="${cabGuid}" SpeakerModel0="${speakerGuid}" SpeakerModel1="${speakerGuid}" SpeakerModel2="${speakerGuid}" SpeakerModel3="${speakerGuid}" IRDecimation="1">\r\n        <Cab HighLevel="0.77" RoomType="${roomType}" RoomMicType="Condenser 87" Mic0Model="${mic0}" Mic1Model="${mic1}" Mic0Angle="0" Mic1Angle="0" Mic0XAxis="0" Mic1XAxis="0.16" Mic0YAxis="0" Mic1YAxis="0.41" Mic0Distance="0" Mic1Distance="0.13" Mic0Speaker="0" Mic1Speaker="1" GUILoadComplete="0" />\r\n    </Cab${section}>`;
};

const buildStudio = () =>
  `    <Studio Bypass="0" Mute="0" OutputVolume="1" OutputPan="0.5" DI_Level="-3" DI_Pan="0.5" DI_Mute="1" DI_Solo="0" DI_Phase="0" DI_PhaseDelay="0" Cab1_Mic1_Level="0" Cab1_Mic1_Pan="0" Cab1_Mic1_Mute="0" Cab1_Mic1_Solo="0" Cab1_Mic1_Phase="0" Cab1_Mic2_Level="-8" Cab1_Mic2_Pan="0" Cab1_Mic2_Mute="0" Cab1_Mic2_Solo="0" Cab1_Mic2_Phase="0" Cab1_Room_Level="-18" Cab1_Room_Width="50" Cab1_Room_Mute="0" Cab1_Room_Solo="0" Cab1_Room_Phase="0" Cab1_Bus_Level="0" Cab1_Bus_Pan="0.5" Cab1_Bus_Mute="0" Cab1_Bus_Solo="0" Cab1_Bus_Phase="0" Cab2_Mic1_Level="-6" Cab2_Mic1_Pan="0" Cab2_Mic1_Mute="0" Cab2_Mic1_Solo="0" Cab2_Mic1_Phase="0" Cab2_Mic2_Level="-6" Cab2_Mic2_Pan="0" Cab2_Mic2_Mute="0" Cab2_Mic2_Solo="0" Cab2_Mic2_Phase="0" Cab2_Room_Level="-40" Cab2_Room_Width="50" Cab2_Room_Mute="0" Cab2_Room_Solo="0" Cab2_Room_Phase="0" Cab2_Bus_Level="-6" Cab2_Bus_Pan="1" Cab2_Bus_Mute="0" Cab2_Bus_Solo="0" Cab2_Bus_Phase="0" Cab3_Mic1_Level="-6" Cab3_Mic1_Pan="0" Cab3_Mic1_Mute="0" Cab3_Mic1_Solo="0" Cab3_Mic1_Phase="0" Cab3_Mic2_Level="-6" Cab3_Mic2_Pan="0" Cab3_Mic2_Mute="0" Cab3_Mic2_Solo="0" Cab3_Mic2_Phase="0" Cab3_Room_Level="-40" Cab3_Room_Width="50" Cab3_Room_Mute="0" Cab3_Room_Solo="0" Cab3_Room_Phase="0" Cab3_Bus_Level="-6" Cab3_Bus_Pan="0" Cab3_Bus_Mute="0" Cab3_Bus_Solo="0" Cab3_Bus_Phase="0" />`;

const generateXML = (result: ToneResult): string => {
  const chain = normaliseSignalChain(result.signal_chain ?? []);

  const pedals = chain.filter((g) => g.type === "pedal");
  const amps = chain.filter((g) => g.type === "amp");
  const cab = chain.find((g) => g.type === "cab");
  const explicitRacks = chain.filter((g) => g.type === "rack");

  const preAmpPedals = pedals.filter((g) => !isPostAmpRack(g));
  const stompA1 = preAmpPedals.slice(0, 6);
  const stompB1 = preAmpPedals.slice(6, 12);
  const stompStereo: SignalChainElement[] = [];

  const rackA = [...explicitRacks, ...pedals.filter(isPostAmpRack)]
    .filter(isVerifiedRackGear)
    .slice(0, 6);

  const description = escapeXml(
    result.engineering_notes?.gain_strategy ??
      result.tone_summary?.style ??
      "Tone Translator preset"
  );

  const style = escapeXml(result.tone_summary?.style ?? "Rock");

  return [
    `<?xml version="1.0" ?>`,
    `<Preset Version="2" Format="at5p" GUID="${generateUUID()}" PresetBPM="120" ProgramChange="${result.midiPC ?? -1}">`,
    `    <Chain Preset="Chain11" DIBeforeAmp="0" />`,
    `    <Input Input="1" />`,
    `    <Tuner Bypass="1" Mute="0" OutputVolume="1" TunerType="354eca51-457a-41b7-917d-ce6117586905">`,
    `        <Tuner Reference="440" NoteReferemce="A" Transpose="0" Temperament="Equal" />`,
    `    </Tuner>`,

    buildStompSection("StompA1", stompA1, 6),
    `    <StompA2 Bypass="0" Mute="0" OutputVolume="1" ${emptySlotAttrs(6)}>\r\n${emptySlots(6)}\r\n    </StompA2>`,
    buildStompSection("StompStereo", stompStereo, 3),
    buildStompSection("StompB1", stompB1, 6),
    `    <StompB2 Bypass="0" Mute="0" OutputVolume="1" ${emptySlotAttrs(6)}>\r\n${emptySlots(6)}\r\n    </StompB2>`,
    `    <StompB3 Bypass="0" Mute="0" OutputVolume="1" ${emptySlotAttrs(6)}>\r\n${emptySlots(6)}\r\n    </StompB3>`,

    buildAmpSection("A", amps[0]),
    buildAmpSection("B", amps[1]),
    buildAmpSection("C", amps[2]),

    `    <LoopFxA Bypass="0" Mute="0" OutputVolume="1" ${emptySlotAttrs(4)}>\r\n${emptySlots(4)}\r\n    </LoopFxA>`,
    `    <LoopFxB Bypass="0" Mute="0" OutputVolume="1" ${emptySlotAttrs(4)}>\r\n${emptySlots(4)}\r\n    </LoopFxB>`,
    `    <LoopFxC Bypass="0" Mute="0" OutputVolume="1" ${emptySlotAttrs(4)}>\r\n${emptySlots(4)}\r\n    </LoopFxC>`,

    buildCabSection("A", cab),
    buildCabSection("B"),
    buildCabSection("C"),

    buildStudio(),
    buildRackSection("RackA", rackA.slice(0, 2), 2),
    buildRackSection("RackB", rackA.slice(2, 4), 2),
    buildRackSection("RackC", rackA.slice(4, 6), 2),

    `    <RackDI Bypass="0" Mute="0" OutputVolume="1" Stomp0="${AT5_EMPTY_SLOT_GUID}" Stomp1="${AT5_EMPTY_SLOT_GUID}">\r\n        <Slot0 />\r\n        <Slot1 />\r\n    </RackDI>`,
    `    <RackMaster Bypass="0" Mute="0" OutputVolume="1" ${emptySlotAttrs(6)}>\r\n${emptySlots(6)}\r\n    </RackMaster>`,

    `    <Output Output="1" />`,
    `    <MidiAssignments />`,
    `    <MetaInfo Description="${description}" Style="${style}" SoundCharacter="None" Instrument="None" Body="Solid Body" PickUpPosition="Bridge" Artist="" Band="" Song="" Album="" SongStructureElement="None" KeyWords="Tone Translator" Type="Electric Guitar" />`,
    `</Preset>`,
  ].join("\r\n");
};

export interface ExportDebugItem {
  original_name: string;
  normalized_name: string;
  type: string;
  resolved_guid: string;
  slot_section: string;
  slot_index: number;
  original_index: number;
  original_settings: Record<string, unknown>;
  normalized_settings: Record<string, unknown>;
  exported_settings: string;
  exported: boolean;
  reason: string;
}

export interface ExportDebugData {
  raw_input_chain: SignalChainElement[];
  exported_chain: ExportDebugItem[];
  skipped_gear: ExportDebugItem[];
  exported_xml_summary: string;
}

type ChainPair = {
  raw: SignalChainElement;
  normalized: SignalChainElement;
  originalIndex: number;
};

const getFallbackGuidForGroup = (group: "amp" | "cab" | "stomp" | "rack") => {
  if (group === "amp") return DEFAULT_AMP_GUID;
  if (group === "cab") return DEFAULT_CAB_GUID;
  return AT5_EMPTY_SLOT_GUID;
};

const buildCabDebugAttrs = (cab?: SignalChainElement) => {
  if (!cab) return "";
  const cabGuid = resolveCabGuid(cab.name);
  const speakerGuid = resolveSpeakerGuid(getSettingText(cab, ["speaker", "speaker type", "speaker swap"]));
  
  const mic1Req = getSettingText(cab, ["mic_1", "mic 1", "mic1"]);
  const mic2Req = getSettingText(cab, ["mic_2", "mic 2", "mic2"]);
  
  const mic0 = mic1Req ? getMicId(mic1Req) : "1e41acc4-85af-4e84-bee4-eabc0be5fef1";
  const mic1 = mic2Req ? getMicId(mic2Req) : "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb";
  const roomType = getRoomType(cab);

  const attrs = [
    `CabModel="${cabGuid}"`,
    `SpeakerModel0="${speakerGuid}"`,
    `SpeakerModel1="${speakerGuid}"`,
    `SpeakerModel2="${speakerGuid}"`,
    `SpeakerModel3="${speakerGuid}"`,
    `Mic0Model="${mic0}"`,
    `Mic1Model="${mic1}"`,
    `RoomType="${roomType}"`,
  ];

  return attrs.join(" ");
};

const makeDebugItem = (
  pair: ChainPair,
  section: string,
  index: number,
  group: "amp" | "cab" | "stomp" | "rack",
  exported: boolean,
  reason: string
): ExportDebugItem => {
  const gear = pair.normalized;
  
  // Strict Catalogue Lookup
  const catalogMatch = findAT5Gear(gear.name, group);
  const guid = group === "cab" 
    ? resolveCabGuid(gear.name) 
    : resolveGuid(gear.name, group, getFallbackGuidForGroup(group));

  let attrs = "";
  let finalReason = reason;

  // Validation Logic
  const isTypeMismatch = gear.type === "rack" && group === "stomp";
  const isMissingFromCatalog = !catalogMatch;
  const isMissingGuid = catalogMatch && (!catalogMatch.guid || catalogMatch.guid === "");

  if (isTypeMismatch) {
    finalReason = `Check: TYPE MISMATCH. Requested "${gear.name}" (RACK) in a ${group.toUpperCase()} slot. Use Rack section instead.`;
  } else if (isMissingFromCatalog) {
    finalReason = `Check: "${gear.name}" not found in Gear Catalogue. Added with placeholder GUID.`;
  } else if (isMissingGuid) {
    finalReason = `Check: "${gear.name}" found in Catalogue but lacks a verified GUID mapping.`;
  } else if (exported) {
    finalReason = "Included"; // This will trigger the "PASS" state in the UI
  }

  if (group === "cab") {
    attrs = buildCabDebugAttrs(gear);

    const mic1Req = getSettingText(gear, ["mic_1", "mic 1", "mic1"]);
    const mic2Req = getSettingText(gear, ["mic_2", "mic 2", "mic2"]);
    const speakerReq = getSettingText(gear, [
      "speaker",
      "speaker type",
      "speaker swap",
    ]);

    const isStockSpeaker =
      !speakerReq ||
      ["stock", "original", "default", "none"].includes(
        speakerReq.toLowerCase().trim()
      );

    const isVerifiedCab =
      getVerifiedCabs().some((v) => scoreNames(gear.name, v.aliases)) ||
      findAT5Gear(gear.name, "cab") !== undefined;

    const isVerifiedSpeaker =
      isStockSpeaker ||
      getVerifiedSpeakers().some((v) => scoreNames(speakerReq, v.aliases));
    const isVerifiedMic1 =
      !mic1Req ||
      getVerifiedMics().some((v) => scoreNames(mic1Req, v.aliases));
    const isVerifiedMic2 =
      !mic2Req ||
      getVerifiedMics().some((v) => scoreNames(mic2Req, v.aliases));

    if (isVerifiedCab && isVerifiedSpeaker && isVerifiedMic1 && isVerifiedMic2) {
      finalReason = "Included with verified cab, speaker, and mic GUIDs.";
    } else if (exported) {
      const issues = [];
      if (!isVerifiedCab) issues.push("Cab");
      if (!isVerifiedSpeaker) issues.push("Speaker");
      if (!isVerifiedMic1) issues.push("Mic 1");
      if (!isVerifiedMic2) issues.push("Mic 2");
      finalReason = `Included (Check: Unverified ${issues.join(", ")}. Exported using generic template.)`;
    }
  } else {
    attrs = cleanXmlAttrString(
      buildMappedParameterAttrs(gear.name, group, gear.settings ?? {})
    );

    if (group === "amp") {
      attrs = ensureBrit8000Sensitivity(guid, attrs);
    }
  }

  return {
    original_name: pair.raw.name,
    normalized_name: gear.name,
    type: gear.type,
    resolved_guid: guid,
    slot_section: section,
    slot_index: index,
    original_index: pair.originalIndex,
    original_settings: pair.raw.settings ?? {},
    normalized_settings: gear.settings ?? {},
    exported_settings: attrs,
    exported,
    reason: finalReason,
  };
};

export const getExportDebugData = (
  result: ToneResult,
  signalChain?: SignalChainElement[]
): ExportDebugData => {
  const rawInput = signalChain ?? result.signal_chain ?? [];
  const normalizedChain = normaliseSignalChain(rawInput);

  const pairs: ChainPair[] = normalizedChain.map((normalized, index) => ({
    raw: rawInput[index],
    normalized,
    originalIndex: index,
  }));

  const exportedChain: ExportDebugItem[] = [];
  const skippedGear: ExportDebugItem[] = [];
  const exportedPairKeys = new Set<string>();

  const pairKey = (pair: ChainPair) =>
    `${pair.originalIndex}:${pair.raw.type}:${pair.raw.name}`;

  const markExported = (
    pair: ChainPair,
    section: string,
    index: number,
    group: "amp" | "cab" | "stomp" | "rack",
    reason = "Included"
  ) => {
    exportedPairKeys.add(pairKey(pair));
    exportedChain.push(makeDebugItem(pair, section, index, group, true, reason));
  };

  const pedalPairs = pairs.filter((p) => p.normalized.type === "pedal");
  const ampPairs = pairs.filter((p) => p.normalized.type === "amp");
  const cabPairs = pairs.filter((p) => p.normalized.type === "cab");
  const rackPairs = pairs.filter((p) => p.normalized.type === "rack");

  const preAmpPairs = pedalPairs.filter((p) => !isPostAmpRack(p.normalized));
  const stompA1 = preAmpPairs.slice(0, 6);
  const stompB1 = preAmpPairs.slice(6, 12);
  const stompStereo: ChainPair[] = [];

  const rackMerged = [
    ...rackPairs,
    ...pedalPairs.filter((p) => isPostAmpRack(p.normalized)),
  ]
    .filter((p) => isVerifiedRackGear(p.normalized))
    .slice(0, 6);

  stompA1.forEach((pair, i) => markExported(pair, "StompA1", i, "stomp"));
  stompStereo.forEach((pair, i) =>
    markExported(pair, "StompStereo", i, "stomp")
  );
  stompB1.forEach((pair, i) => markExported(pair, "StompB1", i, "stomp"));

  ampPairs.slice(0, 3).forEach((pair, i) =>
    markExported(pair, `Amp${String.fromCharCode(65 + i)}`, 0, "amp")
  );

  cabPairs.slice(0, 1).forEach((pair) =>
    markExported(pair, "CabA", 0, "cab")
  );

  rackMerged.slice(0, 2).forEach((pair, i) => markExported(pair, "RackA", i, "rack"));
  rackMerged.slice(2, 4).forEach((pair, i) => markExported(pair, "RackB", i - 2, "rack"));
  rackMerged.slice(4, 6).forEach((pair, i) => markExported(pair, "RackC", i - 4, "rack"));

  pairs.forEach((pair) => {
    if (exportedPairKeys.has(pairKey(pair))) return;

    const gear = pair.normalized;
    let reason = "Skipped: exceeded slot limit or unverified gear category.";
    let group: "amp" | "cab" | "stomp" | "rack" = "stomp";

    if (gear.type === "amp") {
      group = "amp";
      reason = "Skipped: only AmpA/AmpB/AmpC are available.";
    } else if (gear.type === "cab") {
      group = "cab";
      reason = "Skipped: only CabA is currently exported.";
    } else if (
      gear.type === "rack" ||
      (gear.type === "pedal" && isPostAmpRack(gear))
    ) {
      group = "rack";

      if (!isVerifiedRackGear(gear)) {
        reason =
          "Skipped: unverified rack gear. Only verified Parametric/Graphic EQ and select compressors are currently exported to RackA.";
      } else {
        reason = "Skipped: RackA only supports two verified rack slots.";
      }
    } else if (gear.type === "pedal") {
      group = "stomp";
      reason = "Skipped: stomp slot limit reached.";
    }

    skippedGear.push(makeDebugItem(pair, "None", -1, group, false, reason));
  });

  return {
    raw_input_chain: rawInput,
    exported_chain: exportedChain,
    skipped_gear: skippedGear,
    exported_xml_summary: `AT5 Preset with ${exportedChain.length} active gear slots.`,
  };
};

export const getExportData = (
  result: ToneResult,
  signalChain?: SignalChainElement[]
): Uint8Array => {
  const chainToExport = signalChain ?? result.signal_chain;
  const xmlContent = generateXML({ ...result, signal_chain: chainToExport });
  return new TextEncoder().encode(xmlContent);
};

export const exportAt5p = (
  result: ToneResult,
  signalChain?: SignalChainElement[],
  filename?: string
) => {
  const data = getExportData(result, signalChain);
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;

  const safeName =
    filename ??
    `TT_${(result.tone_summary?.style ?? "Preset")
      .substring(0, 24)
      .replace(/[^a-z0-9]/gi, "_")}.at5p`;

  link.download = safeName.endsWith(".at5p") ? safeName : `${safeName}.at5p`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};