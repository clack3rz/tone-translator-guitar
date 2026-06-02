// src/services/at5VerifiedProtocols.ts

import { at5DatabaseService } from "./at5DatabaseService";
import { auth } from "./firebase";

export interface VerifiedMapping {
  guid: string;
  aliases: string[];
  isDbRecord?: boolean;
}

let VERIFIED_CAB_GUIDS: VerifiedMapping[] = [
  { guid: "c4ea21cc-6444-4779-9eee-62d4bc085410", aliases: ["4x12 Closed 75 C", "4x12 Closed 75c", "4x12 british 30", "v30", "v30 speakers", "4x12 v30", "british 30", "closed 75", "4x12 closed 75 c", "4x12 closed 75c"] },
  { guid: "67f95a0d-34e8-4206-b321-3e57c8d1b407", aliases: ["4x12 Modern Closed", "4x12 Closed Modern", "Modern Closed 4x12"] },
  { guid: "849b3340-9e28-411f-9faf-e99b7b2bfb36", aliases: ["4x12 Recto Traditional Slant", "4x12 Recto Traditional", "4x12 Recto", "Mesa Recto 4x12", "4x12 Mesa Recto Traditional", "4x12 Mesa Recto Traditional Slant", "Recto Traditional"] },
  { guid: "fb5fc82f-a926-4591-87d2-168906fd79d3", aliases: ["4x12 British Lead S100", "British Lead S100", "British Tube Lead 1", "British Lead S", "British Lead S (JCM800)", "British Lead S100 (JCM800)", "4x12 British Tube Lead 1"] },
  { guid: "f7902634-12e9-4a2d-9f9a-bcd22781cdab", aliases: ["2x12 Jazz", "2x12 Jazz Amp", "Jazz 2x12", "Jazz Cabinet 2x12"] },
];

let VERIFIED_SPEAKER_GUIDS: VerifiedMapping[] = [
  { guid: "e372dd04b11d49588c290fbe341e97ca", aliases: ["Brit 75", "British 75", "G12T-75", "Celestion G12T-75", "75", "Brit75", "Stock"] },
  { guid: "a56188a9a6bc4373903dbbde779548f1", aliases: ["Brit Green", "Greenback", "Greenback G12M", "G12M", "Celestion Greenback", "Celestion G12M", "Green", "Stock"] },
  { guid: "2dc1a3c46a204deba9cd5e939ae1e1fa", aliases: ["Vintage 30", "Celestion V30", "V30", "Recto V30", "Vintage30", "Brit V30", "Stock"] },
  { guid: "9422a3d95e6b4c63bc6db15fcbd99f09", aliases: ["Brit Vintage 16B", "Vintage 30", "Celestion V30", "V30", "Recto V30", "Vintage30", "Brit V30", "Stock"] },
  { guid: "b413c57dca9541778646330ee16375c5", aliases: ["Brit Vintage 16A", "Brit V30", "Vintage 30", "V30", "Stock"] },
  { guid: "f755dce5b3004aae8b07adac9da35705", aliases: ["Jazz 12", "Jazz12", "Stock"] },
  { guid: "942153d281fb4b089fc20e07a34e9ca7", aliases: ["Brit 80", "British 80", "Brit80", "Stock"] },
];

let VERIFIED_MIC_GUIDS: VerifiedMapping[] = [
  { guid: "1e41acc4-85af-4e84-bee4-eabc0be5fef1", aliases: ["Dynamic 57", "SM57", "57", "Dynamic 57 (On)", "Dynamic 57 (Off)"] },
  { guid: "9e444286-cab4-46a4-bfa3-a6d55b3ffcfb", aliases: ["Condenser 87", "U87", "87", "Condenser 87 (On)", "Condenser 87 (Off)"] },
  { guid: "0f35a776-f6db-403d-930f-6b7f42fed749", aliases: ["Condenser 414", "C414", "414", "Condenser 414 (On)", "Condenser 414 (Off)"] },
  { guid: "b216abec-6fae-4fcd-95fd-c89aacf60ee2", aliases: ["dynamic 421", "MD 421", "421", "Sennheiser 421", "Dynamic 421", "MD421"] },
  { guid: "cf06582b-4b26-42ce-9491-e00e7ab2481e", aliases: ["Ribbon 121", "R121", "121"] },
];

export const getVerifiedCabs = () => VERIFIED_CAB_GUIDS;
export const getVerifiedSpeakers = () => VERIFIED_SPEAKER_GUIDS;
export const getVerifiedMics = () => VERIFIED_MIC_GUIDS;

// Helper to merge lists
const merge = (local: VerifiedMapping[], remote: VerifiedMapping[]) => {
  const map = new Map<string, VerifiedMapping>();
  
  // Load local mappings first
  local.forEach(m => {
    const key = m.guid.toLowerCase().replace(/-/g, '').trim();
    map.set(key, { ...m, guid: m.guid.toLowerCase(), isDbRecord: false });
  });

  // Merge remote overriding mappings securely
  remote.forEach(m => {
    if (!m.guid) return;
    
    // Auto-clean bad modern aliases from the 4x12 Closed 75 C cabinet GUID on the fly:
    if (m.guid.toLowerCase() === "c4ea21cc-6444-4779-9eee-62d4bc085410" && m.aliases) {
      m.aliases = m.aliases.filter(alias => {
        const lower = alias.toLowerCase();
        return !lower.includes("modern");
      });
    }

    const key = m.guid.toLowerCase().replace(/-/g, '').trim();
    const existing = map.get(key);

    const hasGoodRemoteAlias = m.aliases && m.aliases.length > 0 && m.aliases.some(alias => 
      alias &&
      !alias.toLowerCase().startsWith("unknown speaker") && 
      !alias.toLowerCase().startsWith("unknown mic") && 
      !alias.toLowerCase().startsWith("unknown cabinet") && 
      !alias.toLowerCase().startsWith("unknown gear")
    );

    if (existing) {
      if (hasGoodRemoteAlias) {
        // Only overwrite aliases if the database has a concrete correct alias specified
        map.set(key, { 
          ...existing, 
          aliases: m.aliases, 
          isDbRecord: true 
        });
      } else {
        // Keep correct local aliases but register as synchronized
        map.set(key, { 
          ...existing, 
          isDbRecord: true 
        });
      }
    } else {
      // Not in local, register as is
      map.set(key, { 
        ...m, 
        guid: m.guid.toLowerCase(), 
        aliases: m.aliases || [], 
        isDbRecord: true 
      });
    }
  });

  return Array.from(map.values());
};

export async function refreshProtocols() {
  try {
    const dbCabs = await at5DatabaseService.getVerifiedMappings('cabs');
    const dbSpeakers = await at5DatabaseService.getVerifiedMappings('speakers');
    const dbMics = await at5DatabaseService.getVerifiedMappings('mics');

    // Filter and sanitize any stale database documents during refresh:
    dbCabs.forEach(c => {
      if (c.guid.toLowerCase() === "c4ea21cc-6444-4779-9eee-62d4bc085410" && c.aliases) {
        const cleaned = c.aliases.filter(alias => !alias.toLowerCase().includes("modern"));
        if (cleaned.length !== c.aliases.length) {
          c.aliases = cleaned;
          // If signed in, automatically save the cleaned list to self-heal the database!
          if (auth.currentUser) {
            at5DatabaseService.saveVerifiedMapping('cabs', c).catch(err => {
              console.error("Auto self-heal failed:", err);
            });
          }
        }
      }
    });

    if (dbCabs.length > 0) {
      const merged = merge(VERIFIED_CAB_GUIDS, dbCabs);
      VERIFIED_CAB_GUIDS.length = 0;
      VERIFIED_CAB_GUIDS.push(...merged);
    }
    if (dbSpeakers.length > 0) {
      const merged = merge(VERIFIED_SPEAKER_GUIDS, dbSpeakers);
      VERIFIED_SPEAKER_GUIDS.length = 0;
      VERIFIED_SPEAKER_GUIDS.push(...merged);
    }
    if (dbMics.length > 0) {
      const merged = merge(VERIFIED_MIC_GUIDS, dbMics);
      VERIFIED_MIC_GUIDS.length = 0;
      VERIFIED_MIC_GUIDS.push(...merged);
    }

    console.log("Protocols refreshed from database (mutated in-place)");
  } catch (error) {
    console.error("Failed to refresh protocols", error);
  }
}
