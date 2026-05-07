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
const DEFAULT_SPEAKER_GUID = "e372dd04b11d49588c290fbe341e97ca";

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
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case '"': return "&quot;";
      case "'": return "&apos;";
      default: return c;
    }
  });

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
  return ["gate", "noise", "scream", "overdrive", "distortion", "boost", "drive", "fuzz"].some((x) => n.includes(x));
};

const isStereoMod = (gear: SignalChainElement) => {
  const n = gear.name.toLowerCase();
  return ["chorus", "flanger", "phaser", "stereo", "dimension"].some((x) => n.includes(x));
};

const isPostAmpRack = (gear: SignalChainElement) => {
  const n = gear.name.toLowerCase();
  return ["delay", "reverb", "eq", "compressor", "limiter", "rack"].some((x) => n.includes(x));
};

const emptySlots = (count: number) =>
  Array.from({ length: count }, (_, i) => `        <Slot${i} />`).join("\r\n");

const emptySlotAttrs = (count: number) =>
  Array.from({ length: count }, (_, i) => `Stomp${i}=\"${AT5_EMPTY_SLOT_GUID}\"`).join(" ");

const buildStompSection = (
  sectionName: string,
  gears: SignalChainElement[],
  count: number,
  group: "stomp" | "rack" = "stomp"
) => {
  const slotAttrs = Array.from({ length: count }, (_, i) => {
    const gear = gears[i];
    const guid = gear ? resolveGuid(gear.name, group, AT5_EMPTY_SLOT_GUID) : AT5_EMPTY_SLOT_GUID;
    return `Stomp${i}="${guid}"`;
  }).join(" ");

  const slots = Array.from({ length: count }, (_, i) => {
    const gear = gears[i];
    if (!gear) return `        <Slot${i} />`;

    const attrs = buildMappedParameterAttrs(gear.name, group, gear.settings ?? {});

    return `        <Slot${i} Bypass="0" FullScreen="0"${attrs ? " " + attrs : ""} />`;
  }).join("\r\n");

  return `    <${sectionName} Bypass="0" Mute="0" OutputVolume="1" ${slotAttrs}>\r\n${slots}\r\n    </${sectionName}>`;
};

const buildRackSection = (sectionName: string, gears: SignalChainElement[], count = 2) => {
  const slotAttrs = Array.from({ length: count }, (_, i) => {
    const gear = gears[i];
    const guid = gear ? resolveGuid(gear.name, "rack", AT5_EMPTY_SLOT_GUID) : AT5_EMPTY_SLOT_GUID;
    return `Stomp${i}=\"${guid}\"`;
  }).join(" ");

  const slots = Array.from({ length: count }, (_, i) => {
    const gear = gears[i];
    if (!gear) return `        <Slot${i} />`;

    const attrs = buildMappedParameterAttrs(gear.name, "rack", gear.settings ?? {});
    return `        <Slot${i} Bypass=\"0\" FullScreen=\"0\"${attrs ? " " + attrs : ""} />`;
  }).join("\r\n");

  return `    <${sectionName} Bypass=\"0\" Mute=\"0\" OutputVolume=\"1\" ${slotAttrs}>\r\n${slots}\r\n    </${sectionName}>`;
};

const buildAmpSection = (section: "A" | "B" | "C", amp?: SignalChainElement) => {
  const ampName = amp?.name ?? "Brit 8000";
  const ampGuid = resolveGuid(ampName, "amp", DEFAULT_AMP_GUID);

  let ampAttrs = buildMappedParameterAttrs(ampName, "amp", amp?.settings ?? {});

  if (!ampAttrs && ampGuid === DEFAULT_AMP_GUID) {
    ampAttrs = 'Sensitivity_JCM800AT4="1" Presence_JCM800AT4="5" Bass_JCM800AT4="5" Middle_JCM800AT4="5" Treble_JCM800AT4="6" Master_JCM800AT4="5" PreAmp_JCM800AT4="5"';
  }

  // Brit 8000 reference presets include Sensitivity. Add it if absent.
  if (ampGuid === DEFAULT_AMP_GUID && !ampAttrs.includes("Sensitivity_JCM800AT4")) {
    ampAttrs = `Sensitivity_JCM800AT4=\"1\" ${ampAttrs}`.trim();
  }

  return `    <Amp${section} Bypass=\"0\" Mute=\"0\" OutputVolume=\"1\" Model=\"${ampGuid}\">\r\n        <Amp ${ampAttrs} />\r\n    </Amp${section}>`;
};

const getSettingText = (gear: SignalChainElement | undefined, keys: string[]) => {
  if (!gear) return "";
  const found = Object.entries(gear.settings ?? {}).find(([k]) =>
    keys.some((key) => k.toLowerCase().replace(/[^a-z0-9]/g, "").includes(key.toLowerCase().replace(/[^a-z0-9]/g, "")))
  );
  return String(found?.[1] ?? "");
};

const getMicId = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("414")) return "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb";
  if (n.includes("87") || n.includes("condenser")) return "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb";
  if (n.includes("121") || n.includes("ribbon")) return "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb";
  return "1e41acc4-85af-4e84-bee4-eabc0be5fef1"; // Dynamic 57 default
};

const getRoomType = (cab?: SignalChainElement) => {
  const room = getSettingText(cab, ["room", "room_type"]);
  if (/small/i.test(room)) return "Small Studio";
  if (/medium|mid/i.test(room)) return "Mid Studio";
  if (/large/i.test(room)) return "Large Studio";
  return "Large Studio";
};

const buildCabSection = (section: "A" | "B" | "C", cab?: SignalChainElement) => {
  const cabGuid = resolveGuid(cab?.name, "cab", DEFAULT_CAB_GUID);
  const mic0 = getMicId(getSettingText(cab, ["mic_1", "mic 1", "mic1"]));
  const roomType = getRoomType(cab);

  // Mic1Model always safe 414/87 style or user requested
  const mic1 = "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb";

  return `    <Cab${section} Bypass="0" Mute="0" CabModel="${cabGuid}" SpeakerModel0="${DEFAULT_SPEAKER_GUID}" SpeakerModel1="${DEFAULT_SPEAKER_GUID}" SpeakerModel2="${DEFAULT_SPEAKER_GUID}" SpeakerModel3="${DEFAULT_SPEAKER_GUID}" IRDecimation="1">\r\n        <Cab HighLevel="0.77" RoomType="${roomType}" RoomMicType="Condenser 87" Mic0Model="${mic0}" Mic1Model="${mic1}" Mic0Angle="0" Mic1Angle="0" Mic0XAxis="0" Mic1XAxis="0.16" Mic0YAxis="0" Mic1YAxis="0.41" Mic0Distance="0" Mic1Distance="0.13" Mic0Speaker="0" Mic1Speaker="1" GUILoadComplete="0" />\r\n    </Cab${section}>`;
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
  const stompA1 = pedals.filter((g) => !isDriveOrGate(g) && !isStereoMod(g) && !isPostAmpRack(g)).slice(0, 6);
  
  // Restriction: Only verified rack gear.
  const verifiedRackNames = ["parametric eq", "graphic eq", "10 band graphic", "black 76", "fender compressor", "tube compressor"];
  
  const rackA = [
    ...explicitRacks,
    ...pedals.filter(isPostAmpRack),
  ]
    .filter((g) => verifiedRackNames.some(name => g.name.toLowerCase().includes(name)))
    .slice(0, 2);

  const description = escapeXml(result.engineering_notes?.gain_strategy ?? result.tone_summary?.style ?? "Tone Translator preset");
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
  original_settings: Record<string, string | number>;
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

export const getExportDebugData = (result: ToneResult, signalChain?: SignalChainElement[]): ExportDebugData => {
  const rawInput = signalChain ?? result.signal_chain ?? [];
  const normalizedChain = normaliseSignalChain(rawInput);
  
  const debugItems: ExportDebugItem[] = [];
  const skippedItems: ExportDebugItem[] = [];

  const pedals = normalizedChain.filter((g) => g.type === "pedal");
  const amps = normalizedChain.filter((g) => g.type === "amp");
  const cabs = normalizedChain.filter((g) => g.type === "cab");
  const explicitRacks = normalizedChain.filter((g) => g.type === "rack");

  const stompB1 = pedals.filter(isDriveOrGate).slice(0, 6);
  const stompStereo = pedals.filter(isStereoMod).slice(0, 3);
  const stompA1 = pedals.filter((g) => !isDriveOrGate(g) && !isStereoMod(g) && !isPostAmpRack(g)).slice(0, 6);
  
  const verifiedRackNames = ["parametric eq", "graphic eq", "10 band graphic", "black 76", "fender compressor", "tube compressor"];

  const rackA = [
    ...explicitRacks,
    ...pedals.filter(isPostAmpRack),
  ]
    .filter((g) => verifiedRackNames.some(name => g.name.toLowerCase().includes(name)))
    .slice(0, 2);

  // Helper to map gear to debug item
  const mapToDebug = (
    gear: SignalChainElement, 
    originalIndex: number, 
    section: string, 
    index: number, 
    group: "amp" | "cab" | "stomp" | "rack",
    isExported: boolean,
    reason: string
  ): ExportDebugItem => {
    const originalGear = rawInput[normalizedChain.indexOf(gear)];
    const guid = resolveGuid(gear.name, group, group === "amp" ? DEFAULT_AMP_GUID : group === "cab" ? DEFAULT_CAB_GUID : AT5_EMPTY_SLOT_GUID);
    const attrs = buildMappedParameterAttrs(gear.name, group === "amp" ? "amp" : group === "cab" ? "cab" : group, gear.settings ?? {});

    return {
      original_name: originalGear?.name ?? gear.name,
      normalized_name: gear.name,
      type: gear.type,
      resolved_guid: guid,
      slot_section: section,
      slot_index: index,
      original_settings: originalGear?.settings ?? {},
      exported_settings: attrs,
      exported: isExported,
      reason: reason
    };
  };

  // Process exports
  stompA1.forEach((g, i) => debugItems.push(mapToDebug(g, normalizedChain.indexOf(g), "StompA1", i, "stomp", true, "Included")));
  stompStereo.forEach((g, i) => debugItems.push(mapToDebug(g, normalizedChain.indexOf(g), "StompStereo", i, "stomp", true, "Included")));
  stompB1.forEach((g, i) => debugItems.push(mapToDebug(g, normalizedChain.indexOf(g), "StompB1", i, "stomp", true, "Included")));
  
  amps.slice(0, 3).forEach((g, i) => debugItems.push(mapToDebug(g, normalizedChain.indexOf(g), `Amp${String.fromCharCode(65 + i)}`, 0, "amp", true, "Included")));
  cabs.slice(0, 1).forEach((g, i) => debugItems.push(mapToDebug(g, normalizedChain.indexOf(g), "CabA", 0, "cab", true, "Included")));
  
  rackA.forEach((g, i) => debugItems.push(mapToDebug(g, normalizedChain.indexOf(g), "RackA", i, "rack", true, "Included")));

  // Identify skipped
  normalizedChain.forEach((g) => {
    const isExported = debugItems.some(item => 
      item.normalized_name === g.name && 
      JSON.stringify(item.original_settings) === JSON.stringify(rawInput[normalizedChain.indexOf(g)]?.settings) &&
      item.exported === true
    );

    if (!isExported) {
      let reason = "Skipped: exceeded slot limit or unverified gear category.";
      if (g.type === "rack" || (g.type === "pedal" && isPostAmpRack(g))) {
        if (!verifiedRackNames.some(name => g.name.toLowerCase().includes(name))) {
          reason = "Skipped: unverified rack gear. Only verified Parametric/Graphic EQ and select compressors are currently exported to RackA.";
        } else {
          reason = "Skipped: RackA only supports two verified rack slots.";
        }
      }
      skippedItems.push(mapToDebug(g, normalizedChain.indexOf(g), "None", -1, g.type as any, false, reason));
    }
  });

  const xmlSummary = `AT5 Preset with ${debugItems.length} active gear slots.`;

  return {
    raw_input_chain: rawInput,
    exported_chain: debugItems,
    skipped_gear: skippedItems,
    exported_xml_summary: xmlSummary
  };
};

export const getExportData = (result: ToneResult, signalChain?: SignalChainElement[]): Uint8Array => {
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
  const safeName = filename ?? `TT_${(result.tone_summary?.style ?? "Preset").substring(0, 24).replace(/[^a-z0-9]/gi, "_")}.at5p`;
  link.download = safeName.endsWith(".at5p") ? safeName : `${safeName}.at5p`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
