import catalogJson from "../data/amplitube5_gear_catalog.json";
import { AT5CatalogItem, AT5GearGroup } from "../types";
import { at5DatabaseService } from "./at5DatabaseService";
import { AT5_VERIFIED_GEAR } from "./at5VerifiedParameterOverrides";

export const AT5_EMPTY_SLOT_GUID = "773b8ea7-b54a-4a3c-99df-ffbbf6d29271";

const JSON_CATALOG: AT5CatalogItem[] = (catalogJson as any[]).map(item => ({
  group: item.group,
  guid: item.guid,
  slot: item.slot,
  displayName: item.display_name,
  otherNames: item.other_observed_names,
  usedInPresets: item.used_in_presets,
  examplePresets: item.example_presets,
  knobs: item.knobs,
  paramSuffix: item.paramSuffix
}));

const VERIFIED_CATALOG_ADDITIONS: AT5CatalogItem[] = AT5_VERIFIED_GEAR.map(v => ({
  displayName: v.name,
  guid: v.realId || "",
  group: v.category as AT5GearGroup,
  slot: v.preferredSection || "",
  otherNames: v.aliases,
  knobs: v.params.map(p => ({
    name: p.friendlyName,
    type: "range" as const,
    min: p.min,
    max: p.max,
    default: String(p.defaultValue ?? "")
  }))
})).filter(item => item.guid !== "");

const MANUAL_CATALOG_ADDITIONS: AT5CatalogItem[] = [
  // STOMPS (from PDF p.2-5)
  { displayName: "Compressor", guid: "", group: "stomp", slot: "Slot" }, // Dyncomp style usually
  { displayName: "Dcomp", guid: "", group: "stomp", slot: "Slot", otherNames: ["Dcomp", "Dyna Comp", "Dyna-Comp"] },
  { displayName: "Fender Compressor", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "SVX Compressor", guid: "", group: "stomp", slot: "Slot" },
  
  // RACK (from PDF p.17-18)
  { displayName: "Compressor", guid: "", group: "rack", slot: "Rack" }, // Multi-band or high-end rack
  { displayName: "Black 76", guid: "aecfbde7-4f23-44ca-9f58-b0a110f0ea7a", group: "rack", slot: "Rack", otherNames: ["1176", "FET Limiter", "Black 76 FET Limiter"] },
  { displayName: "76 Compressor", guid: "aecfbde7-4f23-44ca-9f58-b0a110f0ea7a", group: "rack", slot: "Rack", otherNames: ["Black 76"] },
  { displayName: "Tube Compressor", guid: "", group: "rack", slot: "Rack" },
  
  { displayName: "6 Band EQ", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "7 Band Graphic", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "10 Band Graphic", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Acoustic Sim", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Analog Flanger", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Big Pig", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Booster", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Chorus-1", guid: "2a9ef349-fb29-4e66-99a9-cc66d10192cc", group: "stomp", slot: "Slot" },
  { displayName: "Class Fuzz", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Contour Wah", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Crusher", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "DDelay", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Delay", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Dime Noise Gate", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Dime Wah", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Diode Overdrive", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "EchoMan", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Electric Flanger", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Fender Blender", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Fender Compressor", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Fender Fuzz Wah", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Fender Phaser", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Fender Tape Echo", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Fender Tremolo", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Flanger Doubler", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "FOX Phaser", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Fuzz Age", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Nu-Tron III", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "OCD", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "Pinnacle Deluxe", guid: "55776d65-4d61-4c6c-6772-74735265636b", group: "stomp", slot: "Slot" },
  { displayName: "SSTE - Solid State Tape Echo", guid: "", group: "stomp", slot: "Slot" },
  { displayName: "T-Rex Replica", guid: "", group: "stomp", slot: "Slot" },
  
  // RACK (from PDF p.17-18)
  { displayName: "AM Modulator", guid: "", group: "rack", slot: "Rack" },
  { displayName: "AutoPan", guid: "", group: "rack", slot: "Rack" },
  { displayName: "EQ 81", guid: "", group: "rack", slot: "Rack" },
  { displayName: "Filter C", guid: "", group: "rack", slot: "Rack" },
  { displayName: "Filter M", guid: "", group: "rack", slot: "Rack" },
  { displayName: "Filter O", guid: "", group: "rack", slot: "Rack" },
  { displayName: "Filter R", guid: "", group: "rack", slot: "Rack" },
  { displayName: "Saturator-X", guid: "", group: "rack", slot: "Rack" },
  { displayName: "VC-670", guid: "", group: "rack", slot: "Rack" },
  { displayName: "Vintage Program EQ 1A", guid: "", group: "rack", slot: "Rack" },
  { displayName: "White-2A", guid: "", group: "rack", slot: "Rack" },
];

// Initial hybrid catalog
let CURRENT_CATALOG: AT5CatalogItem[] = [
  ...JSON_CATALOG,
  ...VERIFIED_CATALOG_ADDITIONS,
  ...MANUAL_CATALOG_ADDITIONS
];

export const getAt5Catalog = () => CURRENT_CATALOG;

/**
 * Merges Firestore data into the local catalog
 */
export async function refreshCatalog() {
  try {
    const dbCatalog = await at5DatabaseService.getCatalogue();
    
    // Create a map by unique identifier (GUID or name+group) to deduplicate, with DB items taking priority
    const mergedMap = new Map<string, AT5CatalogItem>();
    
    const addToMap = (item: AT5CatalogItem, fromDb = false) => {
      // Normalize group for consistency (Pedal/Stomp merging)
      const normalizedGroup = item.group.toLowerCase() === "pedal" ? "stomp" : item.group.toLowerCase();
      item.group = normalizedGroup as AT5GearGroup;

      if (fromDb) {
        item.isDbRecord = true;
      }

      const nameKey = `name:${normalise(item.displayName)}:${normalizedGroup}`;
      const guidKey = item.guid && item.guid.trim() !== "" ? item.guid.toLowerCase() : null;

      // Determine the primary key: GUID if present, otherwise group-relative normalized name
      const key = guidKey || nameKey;
      
      // If we are adding a database record with a valid GUID, let's see if we have an existing 
      // name-based record (e.g., from MANUAL_CATALOG_ADDITIONS with guid = "") and remove it, 
      // so we don't have duplicated or shadowed entries.
      if (fromDb && guidKey) {
        mergedMap.delete(nameKey);
      }
      
      const existing = mergedMap.get(key);
      
      // We overwrite if it's from the Database (DB overrides system) or if no record exists yet
      if (!existing || fromDb) {
        mergedMap.set(key, item);
      }
    };

    // Static base
    [...JSON_CATALOG, ...VERIFIED_CATALOG_ADDITIONS, ...MANUAL_CATALOG_ADDITIONS].forEach(item => addToMap(item, false));
    
    // DB overrides
    if (dbCatalog && dbCatalog.length > 0) {
      dbCatalog.forEach(item => addToMap(item, true));
    }
    
    CURRENT_CATALOG = Array.from(mergedMap.values());
    console.log(`Catalogue refreshed: ${CURRENT_CATALOG.length} items (Hybrid)`);
    return CURRENT_CATALOG;
  } catch (error) {
    console.error("Failed to refresh catalogue from DB", error);
    return CURRENT_CATALOG;
  }
}

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const scoreItem = (item: AT5CatalogItem, query: string, requestedGroup: AT5GearGroup): number => {
  const q = normalise(query);
  const names = [
    item.displayName,
    ...(item.otherNames ?? []),
    ...(item.examplePresets ?? []),
    item.guid,
  ].map(normalise);

  let score = 0;

  for (const name of names) {
    if (!name) continue;
    if (name === q) score += 1000;
    else if (name.includes(q)) score += 250;
    else if (q.includes(name)) score += 150;

    for (const token of q.split(" ")) {
      if (token.length >= 3 && name.includes(token)) score += 20;
    }
  }

  // CRITICAL: Penalty for type mismatch
  if (item.group !== requestedGroup) {
     score -= 2000; 
  }

  score += Math.min(item.usedInPresets ?? 0, 50);

  // Bonus for having a real GUID
  if (item.guid && item.guid.length > 10) {
    score += 500;
  }

  // Avoid fake / previously hallucinated ids.
  if (item.guid && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.guid)) {
    score -= 10000;
  }

  return score;
};

export function findAT5Gear(
  query: string | undefined,
  group: AT5GearGroup
): AT5CatalogItem | undefined {
  if (!query) return undefined;

  const catalog = getAt5Catalog() || [];
  
  // Try strict match first
  const match = catalog
    .map((item) => ({ item, score: scoreItem(item, query, group) }))
    .filter((x) => x.score > 400) // Threshold remains high
    .sort((a, b) => b.score - a.score)[0]?.item;

  return match;
}

export function findAT5GearGuid(
  query: string | undefined,
  group: AT5GearGroup
): string | undefined {
  return findAT5Gear(query, group)?.guid || undefined;
}
