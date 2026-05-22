
import { XMLParser } from "fast-xml-parser";
import { getAt5Catalog } from "./at5Catalog";
import { 
  getVerifiedCabs, 
  getVerifiedMics, 
  getVerifiedSpeakers 
} from "./at5VerifiedProtocols";
import { 
  ImportResults, 
  DetectedGear, 
  CataloguePatch, 
  GearType, 
  CatalogueStatus,
  ParameterImport,
  DetectedProtocol
} from "../types/at5ImportTypes";

const AT5_EMPTY_SLOT_GUID = "773b8ea7-b54a-4a3c-99df-ffbbf6d29271";

const normalizeGuid = (guid: any): string => {
  if (typeof guid !== 'string') return String(guid || '').toLowerCase().replace(/-/g, '').trim();
  return guid.toLowerCase().replace(/-/g, '').trim();
};

export async function parseAt5pPreset(file: File): Promise<ImportResults> {
  const text = await file.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });

  const catalog = getAt5Catalog();

  try {
    const jsonObj = parser.parse(text);
    const root = jsonObj.Preset;

    if (!root) {
      return {
        sourceFileName: file.name,
        detectedGear: [],
        warnings: [],
        errors: ["Invalid AmpliTube 5 preset: Missing <Preset> root element."],
      };
    }

    const detectedGear: DetectedGear[] = [];
    const detectedProtocols: DetectedProtocol[] = [];
    const warnings: string[] = [];

    // Sections to scan
    const sections = [
      { name: "StompA1", type: "pedal", count: 6 },
      { name: "StompA2", type: "pedal", count: 6 },
      { name: "StompStereo", type: "pedal", count: 3 },
      { name: "StompB1", type: "pedal", count: 6 },
      { name: "StompB2", type: "pedal", count: 6 },
      { name: "StompB3", type: "pedal", count: 6 },
      { name: "AmpA", type: "amp", count: 1 },
      { name: "AmpB", type: "amp", count: 1 },
      { name: "AmpC", type: "amp", count: 1 },
      { name: "CabA", type: "cab", count: 1 },
      { name: "CabB", type: "cab", count: 1 },
      { name: "CabC", type: "cab", count: 1 },
      { name: "RackA", type: "rack", count: 2 },
      { name: "RackB", type: "rack", count: 2 },
      { name: "RackC", type: "rack", count: 2 },
      { name: "RackDI", type: "rack", count: 2 },
      { name: "RackMaster", type: "rack", count: 6 },
    ];

    for (const section of sections) {
      const node = root[section.name];
      if (!node) continue;

      for (let i = 0; i < section.count; i++) {
        let guid = "";
        let slotNode: any = null;

        if (section.type === "amp") {
          guid = node.Model;
          slotNode = node.Amp;
        } else if (section.type === "cab") {
          guid = node.CabModel;
          slotNode = node.Cab;
        } else {
          guid = node[`Stomp${i}`];
          slotNode = node[`Slot${i}`];
        }

        if (!guid || normalizeGuid(guid) === normalizeGuid(AT5_EMPTY_SLOT_GUID)) continue;

        console.log(`[Import] Section: ${section.name}, Type: ${section.type}, Raw GUID: ${guid}`);

        // Handle case where XML parser might return literal "null" or "undefined" as strings
        if (String(guid).toLowerCase() === "null" || String(guid).toLowerCase() === "undefined") {
          warnings.push(`Detected null/undefined GUID at ${section.name}/Slot${i}. This is usually a corrupt or placeholder slot.`);
          continue;
        }

        // For Cabs, we extract attributes from the parent node too (like SpeakerModel)
        const cabContext = section.type === "cab" ? node : null;
        const gear = analyzeGear(guid, slotNode, section.type as GearType, `${section.name}/Slot${i}`, cabContext);
        detectedGear.push(gear);

        // Sub-scanning for Cabinet components (Mics, Speakers)
        if (section.type === "cab") {
          const mic0 = slotNode?.Mic0Model;
          const mic1 = slotNode?.Mic1Model;
          
          const normalizedGuid = normalizeGuid(guid);
          if (!getVerifiedCabs().some(c => normalizeGuid(c.guid) === normalizedGuid)) {
            const existingProto = getVerifiedCabs().find(c => normalizeGuid(c.guid) === normalizedGuid);
            detectedProtocols.push({
              type: "cab_alias",
              guid: guid,
              suggestedName: gear.displayName,
              sourcePreset: file.name,
              status: "new",
              existingAliases: existingProto?.aliases
            });
          }

          const normalizedMic0 = mic0 ? normalizeGuid(mic0) : "";
          const existingMic0 = mic0 ? getVerifiedMics().find(m => normalizeGuid(m.guid) === normalizedMic0) : null;
          if (mic0 && !existingMic0) {
            detectedProtocols.push({
              type: "mic",
              guid: mic0,
              suggestedName: slotNode.Mic0Name || `Unknown Mic (${mic0.substring(0, 8)})`,
              sourcePreset: file.name,
              status: "new"
            });
          } else if (mic0 && existingMic0) {
             // In expert mode we might want to see verified protocols too if we ever allow editing them here
          }

          const normalizedMic1 = mic1 ? normalizeGuid(mic1) : "";
          const existingMic1 = mic1 ? getVerifiedMics().find(m => normalizeGuid(m.guid) === normalizedMic1) : null;
          if (mic1 && !existingMic1) {
            detectedProtocols.push({
              type: "mic",
              guid: mic1,
              suggestedName: slotNode.Mic1Name || `Unknown Mic (${mic1.substring(0, 8)})`,
              sourcePreset: file.name,
              status: "new"
            });
          }

          // Scan for speakers in BOTH nodes (AmpliTube uses both depending on preset version)
          for (let s = 0; s < 4; s++) {
            const spkInSlot = slotNode?.[`SpeakerModel${s}`];
            const spkInNode = node?.[`SpeakerModel${s}`];
            const spk = spkInSlot || spkInNode;
            
            const normalizedSpk = spk ? normalizeGuid(spk) : "";
            const existingSpk = spk ? getVerifiedSpeakers().find(v => normalizeGuid(v.guid) === normalizedSpk) : null;
            if (spk && !existingSpk) {
              detectedProtocols.push({
                type: "speaker",
                guid: spk,
                suggestedName: `Unknown Speaker (${spk.substring(0, 8)})`,
                sourcePreset: file.name,
                status: "new"
              });
            }
          }
        }
      }
    }

    return {
      sourceFileName: file.name,
      detectedGear: [...new Map(detectedGear.map(g => [g.modelGuid, g])).values()], // Deduplicate by GUID
      detectedProtocols: [...new Map(detectedProtocols.map(p => [p.guid, p])).values()], // Deduplicate by GUID
      warnings,
      errors: [],
    };

  } catch (error) {
    return {
      sourceFileName: file.name,
      detectedGear: [],
      warnings: [],
      errors: [`Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`],
    };
  }
}

function analyzeGear(guid: string, slotNode: any, gearType: GearType, xmlPath: string, cabNode: any = null): DetectedGear {
  const catalog = getAt5Catalog();
  const normalizedGuid = normalizeGuid(guid);
  const catalogItem = catalog.find(item => normalizeGuid(item.guid) === normalizedGuid);
  
  const parameters: ParameterImport[] = [];
  
  // Combine attributes from both nodes if it's a cab
  const combinedAttributes = cabNode ? { ...cabNode, ...slotNode } : slotNode;

  if (combinedAttributes) {
    Object.entries(combinedAttributes).forEach(([key, value]) => {
      // Skip internal attributes or child objects
      if (["Bypass", "FullScreen", "GUILoadComplete", "Cab", "Amp"].includes(key)) return;
      if (typeof value === "object") return; 

      parameters.push({
        name: key,
        value: value as string | number,
        rangeStatus: "unknown"
      });
    });
  }

  const isEnabled = slotNode?.Bypass === "0" || slotNode?.Bypass === undefined;

  let displayName = catalogItem?.displayName || `Unknown ${gearType}`;
  let status: CatalogueStatus = catalogItem ? "known" : "new";
  let recommendation = catalogItem ? "Gear already in catalogue." : "New gear detected. Add to catalogue?";

  // If we don't have a display name but we have parameters, try to infer it
  if (!catalogItem && parameters.length > 0) {
    // Some logic to infer name from parameter suffixes if any
    const suffixes = parameters.map(p => {
      const parts = p.name.split("_");
      return parts.length > 1 ? parts[1] : null;
    }).filter(Boolean);

    if (suffixes.length > 0) {
      const mostCommon = [...new Set(suffixes)].sort((a, b) => 
        suffixes.filter(v => v === b).length - suffixes.filter(v => v === a).length
      )[0];
      
      if (mostCommon) {
        // Try to match by suffix
        const catalog = getAt5Catalog();
        const matchBySuffix = catalog.find(item => item.paramSuffix === `_${mostCommon}`);
        if (matchBySuffix) {
          status = "possible_match";
          displayName = matchBySuffix.displayName;
          recommendation = `GUID mismatch but parameter suffix matches "${matchBySuffix.displayName}". Check GUID update?`;
        } else {
          displayName = mostCommon.replace(/([A-Z])/g, ' $1').trim();
        }
      }
    }
  }

  return {
    displayName,
    normalizedName: displayName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
    gearType,
    slotType: xmlPath.split("/")[0],
    modelGuid: guid,
    catalogueStatus: status,
    parameters,
    importRecommendation: recommendation,
    rawXmlPath: xmlPath,
    isEnabled,
    existingAliases: catalogItem?.otherNames
  };
}

export function generateCataloguePatch(results: ImportResults): CataloguePatch {
  const catalog = getAt5Catalog();
  const newGear = results.detectedGear.filter(g => g.catalogueStatus === "new");
  const updatedGear = results.detectedGear.filter(g => g.catalogueStatus === "parameter_update" || g.catalogueStatus === "possible_match");
  const newProtocols = results.detectedProtocols || [];
  
  // Checking for conflicts (same name but different GUID or vice-versa)
  const conflicts: DetectedGear[] = [];
  results.detectedGear.forEach(gear => {
    const existing = catalog.find(c => c.displayName.toLowerCase() === gear.displayName.toLowerCase());
    if (existing && existing.guid.toLowerCase() !== gear.modelGuid?.toLowerCase()) {
      conflicts.push(gear);
    }
    
    // Check for GUID conflict with a different name
    const existingByGuid = catalog.find(c => c.guid.toLowerCase() === gear.modelGuid?.toLowerCase());
    if (existingByGuid && existingByGuid.displayName.toLowerCase() !== gear.displayName.toLowerCase()) {
      conflicts.push(gear);
    }
  });

  return {
    newGear,
    updatedGear,
    conflicts: [...new Set(conflicts)],
    newProtocols,
    requiresManualReview: [...newGear, ...updatedGear, ...conflicts, ...newProtocols]
  };
}

export function generateProtocolSnippet(protocol: DetectedProtocol): string {
  const listName = {
    mic: "VERIFIED_MIC_GUIDS",
    speaker: "VERIFIED_SPEAKER_GUIDS",
    cab_alias: "VERIFIED_CAB_GUIDS"
  }[protocol.type];

  const comment = `// For ${listName} in at5VerifiedProtocols.ts`;
  return `  ${comment}\n  { guid: "${protocol.guid}", aliases: ["${protocol.suggestedName.toLowerCase()}"] },`;
}

export function generateTypeScriptEntry(gear: DetectedGear): string {
  const nameParts = gear.displayName.split(' ');
  const lastWord = nameParts[nameParts.length - 1].replace(/[^a-zA-Z0-9]/g, '');
  const suffix = gear.parameters.length > 0 ? gear.parameters[0].name.split('_')[1] || lastWord : lastWord;
  
  return `  {
    displayName: "${gear.displayName}",
    guid: "${gear.modelGuid}",
    group: "${gear.gearType === 'pedal' ? 'stomp' : gear.gearType}",
    slot: "${gear.slotType || ''}",
    paramSuffix: "_${suffix}", 
    knobs: [
${gear.parameters.slice(0, 8).map(p => `      { name: "${p.name}", type: "range", min: 0, max: 10, default: ${typeof p.value === 'number' ? p.value : `"${p.value}"`} },`).join('\n')}
    ]
  },`;
}

export function generateVerifiedParameterEntry(gear: DetectedGear): string {
  return `  {
    name: "${gear.displayName}",
    category: "${gear.gearType === 'pedal' ? 'stomp' : gear.gearType}",
    realId: "${gear.modelGuid}",
    preferredSection: "${gear.slotType || 'StompB1'}",
    params: [
${gear.parameters.map(p => `      { friendlyName: "${p.name}", xmlName: "${p.name}", min: 0, max: 10, aliases: ["${p.name.toLowerCase()}"] },`).join('\n')}
    ],
  },`;
}

export function generateNormalizerAlias(gear: DetectedGear): string {
  const normalized = gear.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `  "${normalized}": "${gear.displayName}",`;
}
