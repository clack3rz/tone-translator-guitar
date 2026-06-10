// src/services/at5VerifiedProtocols.ts

import { at5DatabaseService } from "./at5DatabaseService";
import { auth } from "./firebase";

export interface VerifiedMapping {
  guid: string;
  aliases: string[];
  brand?: string;
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
  { guid: "a1a8c3d4b5f64c63bc6db15fcbd99f10", brand: "Celestion", aliases: ["Brit 100", "Celestion G12K-100", "G12K-100", "Celestion G12K 100", "G12K 100", "Stock"] },
  { guid: "e372dd04b11d49588c290fbe341e97ca", brand: "Celestion", aliases: ["Brit 75", "British 75", "Celestion G12T-75", "G12T-75", "75", "Celestion G12T 75", "G12T 75", "Brit75", "Stock"] },
  { guid: "942153d281fb4b089fc20e07a34e9ca7", brand: "Celestion", aliases: ["Brit 80", "British 80", "Celestion G12-80", "G12-80", "Celestion G12 80", "G12 80", "Classic Lead 80", "Celestion Classic Lead 80", "Brit80", "Stock"] },
  { guid: "b2da3c46a204deba9cd5e939ae1e1fa", brand: "Celestion", aliases: ["Brit Alnico B", "Celestion G12 T530 (Alnico) Blue", "Celestion G12 T530 Blue", "Celestion Alnico Blue", "G12 T530 Blue", "Alnico Blue", "Stock"] },
  { guid: "c3ea3c46a204deba9cd5e939ae1e1f2b", brand: "Celestion", aliases: ["Brit Alnico G", "Celestion Gold (Alnico)", "Celestion Gold Alnico", "Celestion Gold", "Gold Alnico", "Gold", "Stock"] },
  { guid: "d4fa3c46a204deba9cd5e939ae1e1f3c", brand: "Celestion", aliases: ["Brit Alnico S", "Celestion G12 T652 B025", "Celestion G12 T652", "G12 T652", "Goodmans Audiom 60", "Audiom 60", "Stock"] },
  { guid: "e50a3c46a204deba9cd5e939ae1e1f4d", brand: "Celestion", aliases: ["Brit Anniversary 1", "Celestion G12H (70th) Anniversary", "G12H 70th Anniversary", "Celestion G12H Anniversary", "G12H Anniversary", "Stock"] },
  { guid: "f61a3c46a204deba9cd5e939ae1e1f5e", brand: "Celestion", aliases: ["Brit Anniversary 2", "Celestion G12H (70th) Anniversary", "Celestion G12H", "Anniversary 2", "Stock"] },
  { guid: "a11a3c46a204deba9cd5e939ae1e1f6f", brand: "Celestion", aliases: ["Brit Darkness", "Celestion Black Shadow C90", "Mesa Boogie C90", "Mesa Black Shadow", "Black Shadow C90", "MC-90", "Stock"] },
  { guid: "a56188a9a6bc4373903dbbde779548f1", brand: "Celestion", aliases: ["Brit Green", "Greenback", "Greenback G12M", "G12M", "Celestion Greenback", "Celestion G12M", "Green", "G12M-25", "Stock"] },
  { guid: "b12c3d4b5f64c63bc6db15fcbd99f11a", brand: "Celestion", aliases: ["Brit Silver", "Celestion V12-60", "V12-60", "Celestion V12 60", "Stock"] },
  { guid: "c23d4b5f64c63bc6db15fcbd99f12b", brand: "Celestion", aliases: ["Brit T12G", "Celestion G12T", "G12T", "Marshall Valvestate Speaker", "Stock"] },
  { guid: "2dc1a3c46a204deba9cd5e939ae1e1fa", brand: "Celestion", aliases: ["Brit V1", "Celestion Vintage 30", "Vintage 30", "Celestion V30", "V30", "Mesa Custom Vintage 30", "Mesa V30", "Stock"] },
  { guid: "d34e4b5f64c63bc6db15fcbd99f13c", brand: "Celestion", aliases: ["Brit V2", "Celestion Vintage 30", "Vintage 30", "Celestion V30", "V30", "Mesa Custom 8 Ohm", "Stock"] },
  { guid: "e45f4b5f64c63bc6db15fcbd99f14d", brand: "Celestion", aliases: ["Brit V3", "Celestion Vintage 30", "Marshall Vintage 30", "Marshall 70 watt", "Stock"] },
  { guid: "b413c57dca9541778646330ee16375c5", brand: "Celestion", aliases: ["Brit Vintage 16A", "Celestion Vintage 30", "Vintage 30", "V30", "Vintage 30 China", "Stock"] },
  { guid: "9422a3d95e6b4c63bc6db15fcbd99f09", brand: "Celestion", aliases: ["Brit Vintage 16B", "Celestion Vintage 30", "Vintage 30", "V30", "Vintage 30 UK", "Stock"] },
  { guid: "f56a4b5f64c63bc6db15fcbd99f15e", brand: "Celestion", aliases: ["Brit Vintage 8", "Celestion Vintage 30", "Vintage 30 8 Ohm", "Stock"] },
  { guid: "a1c3d4b5f64c63bc6db15fcbd99f16f", brand: "Jensen", aliases: ["American 12C", "Jensen C12Q", "C12Q", "Jensen C12Q Speaker", "American Clean Speaker", "Stock"] },
  { guid: "b1d3d4b5f64c63bc6db15fcbd99f17a", brand: "Jensen", aliases: ["American 12K", "Jensen C12K", "C12K", "Jensen C12K Speaker", "Deluxe Reverb Speaker", "Stock"] },
  { guid: "c1e3d4b5f64c63bc6db15fcbd99f18b", brand: "Jensen", aliases: ["American Alnico", "Jensen P12Q", "P12Q", "Alnico Jensen P12Q", "Stock"] },
  { guid: "d1f3d4b5f64c63bc6db15fcbd99f19c", brand: "Jensen", aliases: ["American J40", "Jensen Blackbird", "Blackbird 40", "Blackbird", "Stock"] },
  { guid: "e20a3c46a204deba9cd5e939ae1e1e0a", brand: "Jensen", aliases: ["American J100", "Jensen Jet", "Jensen Jet Series", "Stock"] },
  { guid: "f31b4b5f64c63bc6db15fcbd99f20a", brand: "VHT", aliases: ["American Bulldog", "VHT G-100-E", "G-100-E", "Stock"] },
  { guid: "a42b4b5f64c63bc6db15fcbd99f21b", brand: "JBL", aliases: ["California Red", "JBL D120F", "D120F", "JBL D120", "Stock"] },
  { guid: "b53c4b5f64c63bc6db15fcbd99f22c", brand: "Fender", aliases: ["Custom Fender", "Fender Special Design", "Custom Eminence", "Fender Eminence", "Stock"] },
  { guid: "c64d4b5f64c63bc6db15fcbd99f23d", brand: "Carvin", aliases: ["CV GT12-16", "Carvin GT12-16", "GT12-16", "GT12 16", "Stock"] },
  { guid: "d75e4b5f64c63bc6db15fcbd99f24e", brand: "Randall", aliases: ["Darrell Panther", "Randall Jaguar", "Jaguar Speaker", "Jaguar", "Stock"] },
  { guid: "e86f4b5f64c63bc6db15fcbd99f25f", brand: "Electro-Voice", aliases: ["EV Darkness", "Electro-Voice EVM-12L Black Shadow", "Electro-Voice EVM-12L", "EVM-12L", "EV Darkness Black Shadow", "Stock"] },
  { guid: "f97a5b5f64c63bc6db15fcbd99f26a", brand: "Fane", aliases: ["HiAmp", "Fane 122231", "Fane Speaker", "HiAmp Fane", "Stock"] },
  { guid: "f755dce5b3004aae8b07adac9da35705", brand: "Roland", aliases: ["Jazz 12", "Jazz12", "Roland JC-120 Speaker", "Roland JC120 Speaker", "JC120 Speaker", "Stock"] },
  { guid: "b28c5b5f64c63bc6db15fcbd99f27b", brand: "Peavey", aliases: ["Metal V 1200", "Peavey Sheffield 1200", "Sheffield 1200", "Peavey Sheffield", "Metal V Peavey", "Stock"] },
  { guid: "c39d5b5f64c63bc6db15fcbd99f28c", brand: "Fisher", aliases: ["Silver Alnico", "Fisher 12-4L", "Fisher 12 4L", "Silver Alnico Fisher", "Stock"] },
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
