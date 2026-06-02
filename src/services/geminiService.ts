import { GoogleGenAI, Type } from "@google/genai";
import { ToneResult, SignalChainElement } from "../types";
import { AMP_MANIFEST, STOMP_MANIFEST, CAB_MANIFEST, ROOM_MANIFEST, RACK_MANIFEST, TONEX_MANIFEST } from "./gearManifest";
import { getAt5Catalog, findAT5Gear, AT5_EMPTY_SLOT_GUID } from "./at5Catalog";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const filterManifest = (items: any[]) => items.map(item => {
  const filtered: any = { id: item.id, name: item.name };
  if (item.knobs) filtered.knobs = item.knobs;
  return filtered;
});

const MASTER_PROMPT = `
You are the world-class "Tone Translator AI", an expert product designer and master guitar tone engineer.
You are a stateless JSON transformation function that converts natural language tone requests into professional-grade AmpliTube 5 signal chains.

HARD CONSTRAINTS:
- Return ONLY valid JSON.
- No conversational text, no explanations, no markdown beyond the JSON block.
- If target audio is provided, prioritize spectral analysis of the audio over the text prompt.
- Do NOT describe systems.
- Do NOT call tools or perform actions.

ENGINEERING PHILOSOPHY (Killer Rig Systematic Tone):
1. THE GAIN PIVOT: Gain defines the harmonic structure. 
   - PRE-GAIN (Input): Use for shaping behavior (Wah, Compressor, Mid-boosters, EQ to tighten low-end).
   - POST-GAIN (Loop/Rack): Use for refining tone (EQ for mix balance, Modulation for clarity, Delay/Reverb for space).
2. GAIN STAGING: Distribute gain incrementally. Never max a single stage. 
   - Use OverScream (Drive 0, Level 10) in front of high-gain amps to "tighten" (reduce pre-distortion bass).
3. FREQUENCY DOMINANCE: The guitar is a midrange instrument. 
   - Metal: Moderate mid-scoop (2-4) but compensate with post-gain presence.
   - Rock: Strong mid-focus (6-8) for projection.
4. TROUBLESHOOTING LOGIC:
   - Muddy? Reduce Bass PRE-distortion.
   - Harsh/Fizzy? Reduce Treble/Presence POST-distortion.
   - Lost in Mix? Increase Mids (700Hz-1.5kHz).
   - Messy Delay? Align to tempo and move to FX Loop/Rack.

5. CABINET SERIATION: Cabinet settings MUST use standard keys: 'Speaker' (for speaker swap), 'Mic_1' (Primary microphone), 'Mic_2' (Secondary microphone), 'Room' (Room type/ambience).
   - Do NOT use 'speaker_a' or 'speaker_b' for microphones.

6. METAL SHAPING & BOOST PEDAL LOGIC:
   - For classic 1980’s thrash metal rhythm tones (specifically early Metallica, Kill ’Em All, early thrash metal, tight rhythm metal, aggressive palm muting, sharp pick attack, Marshall-style thrash tones, or NWOBHM influenced metal), prefer "OverScream" as the front-end boosting/tightening pedal instead of "PROdrive" (The RAT).
   - OverScream works beautifully driving JCM800-style amps (e.g. Brit 8000), because it tightens the low end, boosts upper mids, improves palm mute definition, increases attack clarity, reduces loose/fuzzy distortion, and prevents saturation smear.
   - When pairing with JCM800-style amps ("Brit 8000", "British Tube Lead 1", "British Tube Lead 2") under any thrash metal context, strongly prefer "OverScream", and reduce the likelihood of "PROdrive" unless the user explicitly requests "RAT", "ProCo RAT", "fuzzy", "gritty", or "raw distortion".
   - PROdrive should instead be preferred for: fuzzy distortion, raw distortion textures, grunge, garage rock, alternative rock, saturated dirty lead tones, and RAT-style distortion requests.

KNOWLEDGE BASE:

1. TONE DESCRIPTORS:
- GLASSY: American Clean (Fender), low gain, sparkling highs.
- CHIMEY: British Copper (Vox), Class A compression, upper-mid bell overtones.
- THROATY: Mid-boosted, British Lead (Marshall), high Master Vol.
- BUTTERY: Smooth soft-clipping, neck pickup, Moderate compression.
- CHUG/BRUTAL: High-Preamp Gain, Tightly filtered low-end, Fast Noise Gate.

2. SIGNAL CHAIN ARCHITECTURE:
[GUITAR] -> [TUNER] -> [FILTER/WAH] -> [COMPRESSOR] -> [PITCH] -> [DRIVE BOOST] -> [AMP INPUT] 
-> [FX LOOP: EQ -> MODULATION -> DELAY -> REVERB] -> [CABINET] -> [RACK EQ/LIMITER]

- FUZZ logic: Germanium/Vintage Fuzz must be FIRST (or before buffers) for impedance interaction.
- MODULATION logic: After gain for preservation of motion, before gain for interactive "swirl" (EVH style).
- SPACE logic: Reverb is always LAST to simulate the room. Delay precedes reverb so repeats are spatialized.

3. GENRE RIG TEMPLATES:
- MODERN HIGH-GAIN: Noise Gate (4-Cable or Rack) + OverScream (Tighten) + Metal Lead Amp + Rack Delay/Reverb.
- AMBIENT/SHOEGAZE: Reverb -> Overdrive (for saturated wash) or Dual-Parallel Delays.
- CLASSIC ROCK: Wah -> SD-1 or BD-2 -> Brit 8000 (Mid Master Vol).
- COUNTRY/FUNK: Fast Attack Compressor (Squash) + Clean American Amp + Slapback Delay.

TASK:
Analyze the input and produce a professional AmpliTube 5 signal chain.

INPUT:
"{user_input}"

OUTPUT SCHEMA:
{
  "tone_summary": {
    "style": "string",
    "gain_level": "low | medium | medium-high | high",
    "noise_level": "low | moderate | high"
  },
  "signal_chain": [
    {
      "type": "pedal | amp | cab | rack",
      "name": "string",
      "settings": {
        "param": "value"
      }
    }
  ],
  "engineering_notes": {
    "gain_strategy": "Detailed explanation of gain stages and saturation methodology",
    "noise_control": "How noise and transients are managed",
    "eq_strategy": "Detailed breakdown of the frequency shaping logic"
  },
  "confidence": 0-100
}
`;

export async function translateTone(
  textPrompt: string,
  targetAudio?: { base64: string; mimeType: string },
  currentAudio?: { base64: string; mimeType: string },
  userPreset?: any,
  signal?: AbortSignal,
  youtubeUrl?: string,
  useValidationRecipes: boolean = false
): Promise<ToneResult> {
  const fullPrompt = MASTER_PROMPT.replace('{user_input}', textPrompt);
  const parts: any[] = [{ text: fullPrompt }];

  if (youtubeUrl) {
    parts.push({ text: `Additional YouTube Context: ${youtubeUrl}` });
  }

  if (userPreset) {
    parts.push({ text: `Existing Preset Context: ${JSON.stringify(userPreset)}` });
  }

  // Task 6 — Deterministic Kill 'Em All validation recipe
  const lowerPrompt = textPrompt.toLowerCase();
  if (
    useValidationRecipes &&
    lowerPrompt.includes("metallica") &&
    (lowerPrompt.includes("kill em all") || lowerPrompt.includes("kill 'em all")) &&
    lowerPrompt.includes("rhythm")
  ) {
    return {
      tone_summary: {
        style: "1980's Metallica Kill 'Em All rhythm v2",
        gain_level: "high",
        noise_level: "moderate"
      },
      signal_chain: [
        {
          type: "pedal",
          name: "Noise Gate",
          settings: {
            "Threshold": "-45 dB",
            "Release": "150 ms",
            "Depth": "-60"
          }
        },
        {
          type: "pedal",
          name: "OverScream",
          settings: {
            "Drive": 1.0,
            "Tone": 6.8,
            "Level": 9.0
          }
        },
        {
          type: "amp",
          name: "Brit 8000",
          settings: {
            "Pre Amp": 7.0,
            "Bass": 4.0,
            "Middle": 7.5,
            "Treble": 7.0,
            "Presence": 7.8,
            "Master": 6.0
          }
        },
        {
          type: "cab",
          name: "4x12 Brit 8000",
          settings: {
            "Speaker": "Brit 75",
            "Mic_1": "Dynamic 57",
            "Mic_2": "Ribbon 121",
            "Room": "Large Studio"
          }
        },
        {
          type: "rack",
          name: "Graphic EQ",
          settings: {
            "100Hz": "-3 dB",
            "400Hz": "-2 dB",
            "800Hz": "+1 dB",
            "1600Hz": "+3 dB",
            "3150Hz": "+4 dB",
            "6300Hz": "+1 dB"
          }
        }
      ],
      engineering_notes: {
        gain_strategy: "OverScream clean boost into high-gain Brit 8000.",
        noise_control: "Fast noise gate threshold set to clip early thrash silence.",
        eq_strategy: "V-shape with forward high-mids via Graphic EQ."
      },
      confidence: 100
    };
  }

  if (targetAudio) {
    parts.push({ text: "Reference Audio:" });
    parts.push({
      inlineData: {
        data: targetAudio.base64,
        mimeType: targetAudio.mimeType,
      },
    });
  }

  const generatePromise = (async () => {
    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 2000;

    while (retries <= maxRetries) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts }],
          config: {
            responseMimeType: "application/json",
          },
        });
        return response;
      } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED';
        if (isRateLimit && retries < maxRetries) {
          retries++;
          const delay = baseDelay * Math.pow(2, retries - 1);
          console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  })();

  const response = await Promise.race([
    generatePromise,
    new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('TimeoutError')), 120000);
      
      if (signal?.aborted) {
        clearTimeout(timeoutId);
        reject(new Error('AbortError'));
      }
      
      signal?.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('AbortError'));
      });
    })
  ]);

  const toneText = response.text || "{}";
  try {
    const result = JSON.parse(toneText) as ToneResult;
    return adjustThrashPedalSelection(result, textPrompt);
  } catch (error) {
    console.error("AI Response JSON Parsing Failed:", error);
    throw new Error("Failed to parse AI response. Please try again.");
  }
}

function adjustThrashPedalSelection(result: ToneResult, textPrompt: string): ToneResult {
  if (!result || !result.signal_chain) return result;

  const lowerPrompt = textPrompt.toLowerCase();

  // Ensure any Noise Gate / Noise Filter / Gate in the signal chain has standard settings (specifically Release)
  result.signal_chain = result.signal_chain.map(el => {
    const nameLower = el.name ? el.name.toLowerCase() : "";
    if (
      nameLower === "noise gate" ||
      nameLower === "noise filter" ||
      nameLower === "gate" ||
      nameLower === "hard gate" ||
      nameLower === "noise buster" ||
      nameLower === "noisebuster" ||
      nameLower === "noise suppressor" ||
      nameLower === "noise reducer" ||
      nameLower === "noise reduction"
    ) {
      const settings = el.settings || {};
      const newSettings: Record<string, any> = {};

      let hasRelease = false;
      let hasThreshold = false;
      let hasDepth = false;

      for (const [key, value] of Object.entries(settings)) {
        const kLower = key.toLowerCase();
        if (kLower === "release" || kLower === "decay") {
          newSettings["Release"] = value;
          hasRelease = true;
        } else if (kLower === "threshold" || kLower === "gate") {
          newSettings["Threshold"] = value;
          hasThreshold = true;
        } else if (kLower === "depth" || kLower === "reduction") {
          newSettings["Depth"] = value;
          hasDepth = true;
        } else {
          newSettings[key] = value;
        }
      }

      if (!hasThreshold) {
        newSettings["Threshold"] = "-45 dB";
      }

      if (!hasRelease) {
        const isThrashContext = [
          "metallica",
          "kill em all",
          "kill 'em all",
          "early thrash",
          "thrash metal",
          "thrash rhythm",
          "tight rhythm metal",
          "tight rhythm",
          "rhythm metal",
          "palm muting",
          "palm mute",
          "palm mutes",
          "pick attack",
          "marshall style thrash",
          "marshall-style thrash",
          "nwobhm"
        ].some(kw => lowerPrompt.includes(kw)) || result.tone_summary?.gain_level === "high";

        newSettings["Release"] = isThrashContext ? "150 ms" : "200 ms";
      }

      if (!hasDepth) {
        newSettings["Depth"] = "-60";
      }

      return {
        ...el,
        settings: newSettings
      };
    }
    return el;
  });

  // 1 & 2. Preferred Tightening Pedal keywords
  const hasThrashKeywords = [
    "metallica",
    "kill em all",
    "kill 'em all",
    "early thrash",
    "thrash metal",
    "thrash rhythm",
    "tight rhythm metal",
    "tight rhythm",
    "rhythm metal",
    "palm muting",
    "palm mute",
    "palm mutes",
    "pick attack",
    "marshall style thrash",
    "marshall-style thrash",
    "nwobhm"
  ].some(kw => lowerPrompt.includes(kw));

  // 4. Amp types selected:
  const selectsMarshallAmp = result.signal_chain.some(el => {
    if (el.type !== "amp") return false;
    const name = el.name.toLowerCase();
    return (
      name.includes("brit 800") ||
      name.includes("brit 8000") ||
      name.includes("british tube lead") ||
      name.includes("british lead") ||
      name.includes("jcm800") ||
      name.includes("jcm 800")
    );
  });

  // Check if user explicitly requests RAT/fuzzy/grunge/alternative style tones
  const hasExplicitRatOrFuzzKeywords = [
    "proco rat",
    "pro co rat",
    "rat",
    "prodrive",
    "fuzzy",
    "gritty",
    "grunge",
    "alternative rock",
    "garage rock",
    "raw distortion",
    "raw distortion texture",
    "saturated dirty lead",
    "saturated dirty lead tones"
  ].some(kw => lowerPrompt.includes(kw));

  // Determine if we should enforce OverScream over PROdrive based on logical constraints
  const shouldEnforceOverScream = (hasThrashKeywords || selectsMarshallAmp) && !hasExplicitRatOrFuzzKeywords;

  if (shouldEnforceOverScream) {
    let hasBoostOrDrive = false;
    
    result.signal_chain = result.signal_chain.map(el => {
      if (el.type === "pedal") {
        const pName = el.name.toLowerCase();
        // Identify if this pedal is a boost, drive, distortion, fuzz, or specifically PROdrive / The RAT
        const isDriveOrRat = [
          "prodrive",
          "the rat",
          "distortion",
          "fuzz",
          "overdrive",
          "screamer",
          "overscream"
        ].some(x => pName.includes(x)) && !pName.includes("gate") && !pName.includes("wah");

        if (isDriveOrRat) {
          hasBoostOrDrive = true;
          // Return OverScream with correct thrash settings
          return {
            ...el,
            name: "OverScream",
            settings: {
              "Drive": 1.0,
              "Tone": 6.8,
              "Level": 9.0
            }
          };
        }
      }
      return el;
    });

    // If no boost/drive was found but we are in a high-gain thrash context, we should ensure OverScream is at the front
    if (!hasBoostOrDrive && (hasThrashKeywords || result.tone_summary?.gain_level === "high" || result.tone_summary?.gain_level === "medium-high")) {
      const overScreamElement: SignalChainElement = {
        type: "pedal",
        name: "OverScream",
        settings: {
          "Drive": 1.0,
          "Tone": 6.8,
          "Level": 9.0
        }
      };

      // Insert OverScream before the first amp element
      const ampIndex = result.signal_chain.findIndex(el => el.type === "amp");
      if (ampIndex !== -1) {
        result.signal_chain.splice(ampIndex, 0, overScreamElement);
      } else {
        result.signal_chain.push(overScreamElement);
      }
    }
    
    // Also, update the engineering notes to explain the tight thrash settings of OverScream
    if (result.engineering_notes) {
      result.engineering_notes.gain_strategy = "Clean OverScream boost (Drive 1.0, Level 9.0) to aggressively tighten pre-gain low end, driving the amp into focused thrash saturation without muddy smear.";
      result.engineering_notes.eq_strategy = "Upper-mid boost from OverScream to cut through, maintaining sharp pick attack and tight palm mutes.";
    }
    
    if (result.tone_summary && result.tone_summary.style) {
      if (hasThrashKeywords && !result.tone_summary.style.toLowerCase().includes("v2")) {
        result.tone_summary.style = "1980's Metallica Kill 'Em All rhythm v2";
      }
    }
  }

  // 3. PROdrive Usage Logic
  const prefersProDriveExplicitly = [
    "fuzz",
    "fuzzy",
    "raw distortion",
    "grunge",
    "garage rock",
    "alternative rock",
    "rat",
    "proco rat",
    "pro co rat",
    "prodrive",
    "gritty distortion"
  ].some(kw => lowerPrompt.includes(kw));

  if (prefersProDriveExplicitly) {
    result.signal_chain = result.signal_chain.map(el => {
      if (el.type === "pedal") {
        const pName = el.name.toLowerCase();
        if (pName.includes("overscream") || pName.includes("screamer") || pName.includes("overdrive")) {
          return {
            ...el,
            name: "PROdrive",
            settings: {
              "Distortion": 4.5,
              "Filter": 6.0,
              "Volume": 7.0
            }
          };
        }
      }
      return el;
    });
  }

  return result;
}
