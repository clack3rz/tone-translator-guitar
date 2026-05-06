// src/services/presetExporter.ts
// Deterministic AT5 .at5p XML exporter. Do not call Gemini to serialize presets.

import { normaliseSignalChain } from "./at5SignalChainNormalizer";
import { ToneResult, SignalChainElement } from "../types";
import { AT5_EMPTY_SLOT_GUID, findAT5GearGuid } from "./at5Catalog";
import {
  buildMappedParameterAttrs,
  resolveVerifiedOrManifestRealId,
} from "./at5ParameterManifest";

const DEFAULT_AMP_GUID = "8fe96936-5178-4950-9b80-d89c32534bad"; // Brit 8000 / JCM800
const DEFAULT_CAB_GUID = "7c0b8ce1-cbb4-4e5b-9973-a572143ddb2b"; // 4x12 Brit 8000
const DEFAULT_SPEAKER_GUID = "e372dd04b11d49588c290fbe341e97ca"; // Brit 75
const DEFAULT_MIC0_GUID = "1e41acc4-85af-4e84-bee4-eabc0be5fef1"; // Dynamic 57
const DEFAULT_MIC1_GUID = "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb"; // Condenser 87

const VERIFIED_CAB_GUIDS = [
  { guid: "7c0b8ce1-cbb4-4e5b-9973-a572143ddb2b", aliases: ["4x12 brit 8000", "4x12 brit 800", "4x12 british 8000", "4x12 british 800", "4x12 british 30", "4x12 brit 75"] },
  { guid: "c4ea21cc-6444-4779-9eee-62d4bc085410", aliases: ["4x12 closed 75 c", "4x12 closed 75c", "4x12 modern m", "4x12 modern m 1", "4x12 modern m1"] },
  { guid: "67f95a0d-34e8-4206-b321-3e57c8d1b407", aliases: ["4x12 modern closed", "4x12 closed modern", "modern closed 4x12"] },
];

const VERIFIED_SPEAKER_GUIDS = [
  { guid: "e372dd04b11d49588c290fbe341e97ca", aliases: ["brit 75", "british 75", "g12t 75", "celestion g12t 75", "75"] },
  { guid: "a56188a9a6bc4373903dbbde779548f1", aliases: ["brit green", "greenback", "greenback g12m", "g12m", "celestion greenback", "celestion g12m"] },
];

const VERIFIED_MIC_GUIDS = [
  { guid: "1e41acc4-85af-4e84-bee4-eabc0be5fef1", aliases: ["dynamic 57", "57", "sm57"] },
  { guid: "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb", aliases: ["condenser 87", "87", "u87"] },
  { guid: "0f35a776-f6db-403d-930f-6b7f42fed749", aliases: ["condenser 414", "414", "c414"] },
  { guid: "cf06582b-4b26-42ce-9491-e00e7ab2481e", aliases: ["ribbon 121", "121", "r121"] },
];

const VERIFIED_RACK_NAMES = [
  "parametric eq",
  "graphic eq",
  "10 band graphic",
  "black 76",
  "fender compressor",
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
  return (
    resolveVerifiedOrManifestRealId(gearName, category) ??
    findAT5GearGuid(gearName, category, fallbackGuid)
  );
};

const isDriveOrGate = (gear: SignalChainElement) => {
  const n = gear.name.toLowerCase();

  return [
    "gate",
    "noise",
    "scream",
    "overdrive",
    "distortion",
    "boost",
    "drive",
    "fuzz",
  ].some((x) => n.includes(x));
};

const isStereoMod = (gear: SignalChainElement) => {
  const n = gear.name.toLowerCase();

  return ["chorus", "flanger", "phaser", "stereo", "dimension"].some((x) =>
    n.includes(x)
  );
};

const isPostAmpRack = (gear: SignalChainElement) => {
  const n = gear.name.toLowerCase();

  return ["delay", "reverb", "eq", "compressor", "limiter", "rack"].some((x) =>
    n.includes(x)
  );
};

const isVerifiedRackGear = (gear: SignalChainElement) => {
  const n = gear.name.toLowerCase();
  return VERIFIED_RACK_NAMES.some((name) => n.includes(name));
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
        .includes(key.toLowerCase().replace(/[^a-z0-9]/g, ""))
    )
  );

  return String(found?.[1] ?? "");
};

const normaliseLookup = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const scoreNames = (query: string, candidates: string[]) => {
  const q = normaliseLookup(query);
  if (!q) return 0;

  return candidates.some((candidate) => {
    const c = normaliseLookup(candidate);
    return c.includes(q) || q.includes(c);
  })
    ? 1
    : 0;
};

const getMicId = (name: string) => {
  const n = name.toLowerCase();

  if (n.includes("121") || n.includes("ribbon")) {
    return "cf06582b-4b26-42ce-9491-e00e7ab2481e";
  }

  if (n.includes("414")) {
    return "0f35a776-f6db-403d-930f-6b7f42fed749";
  }

  if (n.includes("87") || n.includes("condenser")) {
    return "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb";
  }

  return "1e41acc4-85af-4e84-bee4-eabc0be5fef1";
};

const resolveCabGuid = (name?: string) => {
  if (!name) return DEFAULT_CAB_GUID;
  return VERIFIED_CAB_GUIDS.find(v => scoreNames(name, v.aliases))?.guid ?? DEFAULT_CAB_GUID;
};

const resolveSpeakerGuid = (name?: string) => {
  if (!name) return DEFAULT_SPEAKER_GUID;
  return VERIFIED_SPEAKER_GUIDS.find(v => scoreNames(name, v.aliases))?.guid ?? DEFAULT_SPEAKER_GUID;
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

  const stompB1 = pedals.filter(isDriveOrGate).slice(0, 6);
  const stompStereo = pedals.filter(isStereoMod).slice(0, 3);
  const stompA1 = pedals
    .filter((g) => !isDriveOrGate(g) && !isStereoMod(g) && !isPostAmpRack(g))
    .slice(0, 6);

  const rackA = [...explicitRacks, ...pedals.filter(isPostAmpRack)]
    .filter(isVerifiedRackGear)
    .slice(0, 2);

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
    buildRackSection("RackA", rackA, 2),

    `    <RackB Bypass="0" Mute="0" OutputVolume="1" Stomp0="${AT5_EMPTY_SLOT_GUID}" Stomp1="${AT5_EMPTY_SLOT_GUID}">\r\n        <Slot0 />\r\n        <Slot1 />\r\n    </RackB>`,
    `    <RackC Bypass="0" Mute="0" OutputVolume="1" Stomp0="${AT5_EMPTY_SLOT_GUID}" Stomp1="${AT5_EMPTY_SLOT_GUID}">\r\n        <Slot0 />\r\n        <Slot1 />\r\n    </RackC>`,
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
  const guid =
    group === "cab"
      ? resolveCabGuid(gear.name)
      : resolveGuid(gear.name, group, getFallbackGuidForGroup(group));

  let attrs = "";
  let finalReason = reason;

  if (group === "cab") {
    attrs = buildCabDebugAttrs(gear);

    const mic1Req = getSettingText(gear, ["mic_1", "mic 1", "mic1"]);
    const mic2Req = getSettingText(gear, ["mic_2", "mic 2", "mic2"]);
    const speakerReq = getSettingText(gear, ["speaker", "speaker type", "speaker swap"]);

    const isVerifiedCab = VERIFIED_CAB_GUIDS.some((v) =>
      scoreNames(gear.name, v.aliases)
    );
    const isVerifiedSpeaker =
      !speakerReq ||
      VERIFIED_SPEAKER_GUIDS.some((v) => scoreNames(speakerReq, v.aliases));
    const isVerifiedMic1 =
      !mic1Req ||
      VERIFIED_MIC_GUIDS.some((v) => scoreNames(mic1Req, v.aliases));
    const isVerifiedMic2 =
      !mic2Req ||
      VERIFIED_MIC_GUIDS.some((v) => scoreNames(mic2Req, v.aliases));

    if (isVerifiedCab && isVerifiedSpeaker && isVerifiedMic1 && isVerifiedMic2) {
      finalReason = "Included with verified cab, speaker, and mic GUIDs.";
    } else if (exported) {
      finalReason =
        "Included (Caution: Requested speaker/mic name not yet mapped to verified AT5 GUID; exported using safe verified template.)";
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

  const stompB1 = pedalPairs.filter((p) => isDriveOrGate(p.normalized)).slice(0, 6);
  const stompStereo = pedalPairs
    .filter((p) => isStereoMod(p.normalized))
    .slice(0, 3);
  const stompA1 = pedalPairs
    .filter(
      (p) =>
        !isDriveOrGate(p.normalized) &&
        !isStereoMod(p.normalized) &&
        !isPostAmpRack(p.normalized)
    )
    .slice(0, 6);

  const rackA = [
    ...rackPairs,
    ...pedalPairs.filter((p) => isPostAmpRack(p.normalized)),
  ]
    .filter((p) => isVerifiedRackGear(p.normalized))
    .slice(0, 2);

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

  rackA.forEach((pair, i) => markExported(pair, "RackA", i, "rack"));

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