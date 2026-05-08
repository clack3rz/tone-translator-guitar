
import { XMLParser } from "fast-xml-parser";
import { AT5_CATALOG } from "./at5Catalog";
import { 
  ImportResults, 
  DetectedGear, 
  CataloguePatch, 
  GearType, 
  CatalogueStatus,
  ParameterImport
} from "../types/at5ImportTypes";

const AT5_EMPTY_SLOT_GUID = "773b8ea7-b54a-4a3c-99df-ffbbf6d29271";

export async function parseAt5pPreset(file: File): Promise<ImportResults> {
  const text = await file.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });

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

        if (!guid || guid === AT5_EMPTY_SLOT_GUID) continue;

        const gear = analyzeGear(guid, slotNode, section.type as GearType, `${section.name}/Slot${i}`);
        detectedGear.push(gear);
      }
    }

    return {
      sourceFileName: file.name,
      detectedGear,
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

function analyzeGear(guid: string, slotNode: any, gearType: GearType, xmlPath: string): DetectedGear {
  const catalogItem = AT5_CATALOG.find(item => item.guid.toLowerCase() === guid.toLowerCase());
  
  const parameters: ParameterImport[] = [];
  if (slotNode) {
    Object.entries(slotNode).forEach(([key, value]) => {
      // Skip internal attributes
      if (["Bypass", "FullScreen", "GUILoadComplete"].includes(key)) return;
      if (typeof value === "object") return; // Skip Nested nodes

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
        const matchBySuffix = AT5_CATALOG.find(item => item.paramSuffix === `_${mostCommon}`);
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
    isEnabled
  };
}

export function generateCataloguePatch(results: ImportResults): CataloguePatch {
  const newGear = results.detectedGear.filter(g => g.catalogueStatus === "new");
  const updatedGear = results.detectedGear.filter(g => g.catalogueStatus === "parameter_update" || g.catalogueStatus === "possible_match");
  
  // Checking for conflicts (same name but different GUID or vice-versa)
  const conflicts: DetectedGear[] = [];
  results.detectedGear.forEach(gear => {
    const existing = AT5_CATALOG.find(c => c.displayName.toLowerCase() === gear.displayName.toLowerCase());
    if (existing && existing.guid.toLowerCase() !== gear.modelGuid?.toLowerCase()) {
      conflicts.push(gear);
    }
  });

  return {
    newGear,
    updatedGear,
    conflicts,
    requiresManualReview: [...newGear, ...updatedGear, ...conflicts]
  };
}
