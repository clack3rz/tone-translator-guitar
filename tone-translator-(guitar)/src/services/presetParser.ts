
import { XMLParser } from "fast-xml-parser";

export interface PresetData {
  metadata: {
    source: string;
    presetName: string;
    genre?: string;
  };
  signalChain: any[];
}

export function parseAt5p(xmlContent: string): PresetData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const jsonObj = parser.parse(xmlContent);
  const root = jsonObj.Preset;

  if (!root) {
    throw new Error("Invalid Amplitube 5 preset file (Missing Preset root)");
  }

  const signalChain: any[] = [];

  // 1. Stomps (StompB1)
  const stompB1 = root.StompB1;
  if (stompB1) {
    // Noise Gate
    if (stompB1.Slot0 && stompB1.Slot0.Threshold !== undefined) {
      signalChain.push({
        type: "Stomp",
        model: "Noise Gate",
        knobs: [
          { name: "Threshold", value: stompB1.Slot0.Threshold },
          { name: "Release", value: stompB1.Slot0.Release },
          { name: "Depth", value: stompB1.Slot0.Depth },
        ],
      });
    }
    // Overdrive
    if (stompB1.Slot1 && stompB1.Slot1.Drive !== undefined) {
      signalChain.push({
        type: "Stomp",
        model: "Overdrive",
        knobs: [
          { name: "Drive", value: stompB1.Slot1.Drive },
          { name: "Tone", value: stompB1.Slot1.Tone },
          { name: "Level", value: stompB1.Slot1.Level },
        ],
      });
    }
  }

  // 2. Amp (AmpA)
  const ampA = root.AmpA;
  if (ampA && ampA.Amp) {
    const ampParams = ampA.Amp;
    const keys = Object.keys(ampParams).filter(k => k.includes("_"));
    
    // Dynamically extract model name from keys like "Gain_BritishTubeLead1"
    let detectedModel = "Unknown Amp";
    if (keys.length > 0) {
      const parts = keys[0].split("_");
      if (parts.length > 1) detectedModel = parts[1].replace(/([A-Z])/g, ' $1').trim();
    }

    signalChain.push({
      type: "Amp",
      model: detectedModel,
      knobs: keys.map(k => ({ 
        name: k.split("_")[0], 
        value: ampParams[k] 
      })),
    });
  }

  // 3. Cab (CabA)
  const cabA = root.CabA;
  if (cabA) {
    const cabKnobs: any[] = [];
    if (cabA.Cab) {
      if (cabA.Cab.Mic1Level !== undefined) cabKnobs.push({ name: "Mic 1", value: cabA.Cab.Mic1Level });
      if (cabA.Cab.Mic2Level !== undefined) cabKnobs.push({ name: "Mic 2", value: cabA.Cab.Mic2Level });
    }

    signalChain.push({
      type: "Cab",
      model: "4x12 Brit 8000", // Simplified mapping for demo
      knobs: cabKnobs,
    });
    
    // 4. Room (Inside CabA)
    if (cabA.Cab && cabA.Cab.RoomType) {
      signalChain.push({
        type: "Room",
        model: cabA.Cab.RoomType,
        knobs: [
          { name: "High Level", value: cabA.Cab.HighLevel }
        ],
      });
    }
  }

  // 5. EQ (RackA)
  const rackA = root.RackA;
  if (rackA && rackA.Slot0 && rackA.Slot0.Freq1 !== undefined) {
    signalChain.push({
      type: "EQ",
      model: "Parametric EQ",
      knobs: [
        { name: "Freq1", value: rackA.Slot0.Freq1 },
        { name: "Gain1", value: rackA.Slot0.Gain1 },
      ],
    });
  }

  return {
    metadata: {
      source: "at5p",
      presetName: root.GUID || "Unknown Preset",
      genre: root.MetaInfo?.Style,
    },
    signalChain,
  };
}

export function comparePresets(aiResult: any, userPreset: PresetData) {
  const diffs: string[] = [];
  
  const aiChain = aiResult.signal_chain || [];
  const userChain = userPreset.signalChain || [];

  // Helper to map type names
  const mapType = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pedal' || t === 'stomp') return 'stomp';
    if (t === 'amp') return 'amp';
    if (t === 'cab') return 'cab';
    if (t === 'rack' || t === 'eq') return 'rack';
    return t;
  };

  const aiMapped = aiChain.map((g: any) => ({ ...g, mappedType: mapType(g.type) }));
  const userMapped = userChain.map((g: any) => ({ ...g, mappedType: mapType(g.type) }));

  const types = ["stomp", "amp", "cab", "rack"];

  types.forEach(type => {
    const aiBlocks = aiMapped.filter((b: any) => b.mappedType === type);
    const userBlocks = userMapped.filter((b: any) => b.mappedType === type);

    if (aiBlocks.length !== userBlocks.length) {
      diffs.push(`${type.toUpperCase()} count mismatch: AI suggested ${aiBlocks.length}, Preset has ${userBlocks.length}.`);
    }

    const maxLen = Math.max(aiBlocks.length, userBlocks.length);
    for (let i = 0; i < maxLen; i++) {
      const aiB = aiBlocks[i];
      const userB = userBlocks[i];
      
      if (aiB && userB) {
        const aiName = aiB.name || aiB.model || "";
        const userName = userB.model || userB.name || "";
        const isExactMatch = aiName.toLowerCase() === userName.toLowerCase();
        
        if (!isExactMatch) {
          diffs.push(`${type.toUpperCase()} mismatch: AI suggested "${aiName}", Preset has "${userName}".`);
        }

        // Compare settings/knobs
        if (aiB.settings && userB.knobs) {
          Object.entries(aiB.settings).forEach(([name, val]: [string, any]) => {
            const userKnob = userB.knobs.find((uk: any) => uk.name.toLowerCase().includes(name.toLowerCase()));
            if (userKnob) {
              const aiVal = parseFloat(String(val));
              const userVal = parseFloat(String(userKnob.value));
              if (!isNaN(aiVal) && !isNaN(userVal) && Math.abs(aiVal - userVal) > 1.5) {
                diffs.push(`${aiName} ${name} delta: AI suggested ${aiVal}, Preset has ${userVal.toFixed(1)}.`);
              }
            }
          });
        }
      }
    }
  });

  return diffs;
}
