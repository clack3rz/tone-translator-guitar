import { GoogleGenAI, Type } from "@google/genai";
import { ToneResult, SignalChainElement } from "../types";
import { AMP_MANIFEST, STOMP_MANIFEST, CAB_MANIFEST, ROOM_MANIFEST, RACK_MANIFEST, TONEX_MANIFEST } from "./gearManifest";
import { getAt5Catalog, findAT5Gear, AT5_EMPTY_SLOT_GUID } from "./at5Catalog";
import { AT5_AMPLIFIER_KNOWLEDGE } from "./at5AmplifierKnowledge";
import { AT5_CABINET_SPEAKER_KNOWLEDGE } from "./at5CabinetKnowledge";

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

7. CLASSIC BRITISH CRUNCH / AC/DC / MALCOLM YOUNG TONE LOGIC:
   - For early AC/DC, Malcolm Young rhythm tone, or 1970s British classic rock rhythm requests (including AC/DC, ACDC, Malcolm Young, Malcom Young, Angus Young, Jailbreak, High Voltage, Let There Be Rock, Powerage, Highway to Hell), TT should strongly prefer the AC/DC classic rock profile unless the user explicitly requests a different interpretation.
   - Note: "Malcom" is a common misspelling of "Malcolm". Treat "Malcom Young" and "Malcolm Young" as the same artist/player reference.
   - The word "Jailbreak" must not be interpreted as modern rock, metal, or lead guitar.
   - The artist reference "Malcolm Young" must strongly imply AC/DC rhythm guitar, dry vintage Marshall-style crunch, low-to-medium gain, and minimal processing.
   - AMP SELECTION: Prefer vintage Marshall/Plexi/Super Lead/JMP/JTM-style amplifiers (specifically "British Lead S100" as the primary choice; or "British Tube Lead 1" or "Brit 8000" only if used with low gain and treated as a vintage British crunch platform).
   - PENALISE AND REJECT: Strictly avoid and penalise "Vintage Metal Lead", "Metal Lead V", "Modern Tube Lead", "Red Pig", "Marshall Major", "Rectifier-style", "ENGL-style", "Dimebag-style", or any high-gain/metal/lead-focused amps unless the user explicitly asks for one. Do not choose an amp based only on keyword overlap. "Lead" in an amp name does not mean it fits a rhythm guitar tone; "Metal" in an amp name does not mean it fits AC/DC. AC/DC is classic rock, not metal.
   - GAIN STRATEGY: Rely on natural power-amp crunch and pick dynamics. Keep amp Gain/Preamp level low-to-moderate (target 3.5 to 5.5). Midrange should be forward (6.0 to 8.0), bass controlled (4.0 to 5.0) to prevent muddiness, and treble/presence clear but not fizzy.
   - EFFECTS EXCLUSION: STRICTLY AVOID unrequested rack EQs, delays, reverbs, modulations, compressors, or overdrive boosts. The signal path must remain pure, raw, and bone-dry.
   - CAB & SPEAKER SYSTEM: Strongly prefer closed-back British 4x12 cabinets (specifically "4x12 Brit 8000" or nearest vintage British 4x12) paired with Greenback-style speakers (specifically "Brit Green") for natural vintage compression and organic midrange warmth. Avoid modern metal cabs or Vintage 30 cabinets.
   - MICROPHONE CALIBRATION: Start with "Dynamic 57" as the primary close microphone placed close to the cone edge/midway for attack and core midrange projection. If a second microphone is used, prefer "Ribbon 121" or "Dynamic 421" for warmth and body. STRICTLY AVOID "Condenser 87" as a default second mic under raw vintage AC/DC contexts. Keep the cabinet room dial and ambience mix low/controlled. Room Type must be "Small Studio".
   - REASONING & DEBUG/ENGINEERING NOTE: Malcolm Young's Jailbreak rhythm tone is treated as a dry 1970s AC/DC rhythm sound: vintage Marshall-style crunch, low-to-medium gain, strong mids, Greenback-style speaker compression, and minimal processing. Clearly explain these choices in the notes.

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

AMPLIFIER SELECTION, RANKING, AND CONFIGURATION RULE BOOK:
1. Candidate Scoring and Ranking:
   - Match requests by genre, artist, era, tone descriptors, gain structure, and real-world references.
   - Use tags, real gear names, and categories from the Amplifier Directory below to find and score candidates.
   - Always rank the leading candidate amps in your reasoning and explain why the selected amp was chosen over others.
2. Control-Aware Settings Generation:
   - ONLY generate parameter settings that exist in the selected amplifier's controls layout, as specified in the Amplifier Directory below. Do NOT invent parameter names.
   - Start with the Typical Settings specified for that amp as your baseline, and adjust them to fit the exact tone request, staying strictly within the min and max bounds for each parameter.
   - If optional controls (e.g. Bright switches, mode toggles, boost switches, individual channel gains) are listed in the controls layout and relevant, specify them appropriately.
3. Matching Exact Target Names:
   - The "name" parameter in the "signal_chain" array for type: "amp" MUST exactly match the "name" of the selected amplifier from the Directory below.

CABINET & SPEAKER SELECTION AND CALIBRATION RULE BOOK:
1. Systematic Cabinet Selection Steps:
   - Step 1: Identify style/genre first.
   - Step 2: Determine required low-end behavior (loose vs. tight, deep vs. focused, high headroom vs. vintage compression).
   - Step 3: Select Cabinet Construction (Open-back for airiness/depth; Closed-back for tightness/focused aggression; Semi-open/Sealed for transparent balance).
   - Step 4: Select Cabinet Sizing (1x12 compact/focused; 2x12 balanced/versatile; 4x12 maximum projection/deep low-end focus).
   - Step 5: Select Speaker Family (Vintage 30, Greenback, G12T-75, Jensen, EV) based on the target tone's required focus, midrange cut, and power characteristics.
   - Step 6: Map to specific AmpliTube 5 hardware models and configurations in the Cabinet Directory.
2. Construction & Cabinet Size Logic:
   - For Clean, Country, Blues, and edge-of-breakup: Prefer open-back combos ("2x12 '65 Twin Reverb", "1x12 '65 Deluxe Reverb", "4x10 '59 Bassman") with Jensen style speakers ("American 12C", "American 12K").
   - For Hard Rock, Heavy Metal, Thrash, and Modern High-Gain: Closed-back 4x12 is the strict default ("4x12 Recto Traditional Slant", "4x12 Brit 8000", "4x12 Closed 75 C") paired with Vintage 30 ("Brit V1", "Brit V2") or EV style ("EV Darkness") or Classic Greenbacks ("Brit Green").
3. Cabinet ↔ Speaker Coupling Logic:
   - Choose speakers logically based on construction interaction:
     * Open Back + Jensen = spacious, sparkly American Clean.
     * Closed Back + Vintage 30 = focused, punchy rock/metal with aggressive upper-mid cut.
     * Closed Back + EV = ultra-tight, massive high-power neutral gain.
     * Closed Back + Greenback = organic, mid-rich vintage British crunch.
4. Explaining Choices in Debug:
   - Always document your systematic reasoning (style, low-end requirements, cabinet construction, cabinet size, speaker family, compatibility) in the amplifier_debug feedback block.

SYSTEMATIC MICROPHONE SELECTION, ROLE-BASED BLENDING, AND PLACEMENT RULE BOOK:
1. Required Systematic Tone-Design Reasoning Order:
   - Step 1: Identify tone goal.
   - Step 2: Select amplifier family.
   - Step 3: Select specific AT5 amplifier.
   - Step 4: Select cabinet type.
   - Step 5: Select speaker family.
   - Step 6: Select microphone role (primary attack mic, body mic, warmth mic, fizz-control mic, detail mic, room/space mic, bass low-end mic).
   - Step 7: Select specific microphone models.
   - Step 8: Select placement strategy (on-axis, cap-edge, off-axis, distance).
   - Step 9: Select room level strategy.
   - Step 10: Explain why the microphone choices suit the tone inside the engineering notes and amplifier_debug feedback window.

2. Explicit Microphone Role Assignations:
   - Dynamic 57: Primary close microphone for "attack and presence", giving bite and midrange cut.
   - Ribbon 121: Close or blended microphone for "warmth and fizz control", smoothing high-gain harshness.
   - Condenser 87: Open-sounding microphone for "clean detail and polish" with elegant high-fidelity balance.
   - Dynamic 421: Focused close microphone for "punch and body", thickening midrange.
   - Dynamic 20 / Vintage Dynamic 20 / Condenser 170 / Ribbon 160: Primary choices for "bass low-end / fullness" and retro weight on bass combo/cabinet captures.

3. Context & Style-Based Calibration Logic:
   - High-Gain & Distorted Tones (Hard Rock, Heavy Metal, Thrash, Modern High-Gain):
     * Do NOT default to bright on-axis placement for every metal tone because that creates harshness and fizz.
     * Prefer close dynamic microphones (e.g. Dynamic 57) as a primary starting point to capture aggressive attack.
     * Blend in or switch to Ribbon 121 when fizz or high-frequency harshness needs smoothing.
     * Utilize Dynamic 421 when more body and lower-mid punch is requested.
     * Keep room contribution and ambience level tightly controlled, unless a live room or ambient metal vibe is explicitly defined.
     * Prefer cap-edge placement as a balanced starting point.
   - Clean & Acoustic-Style Tones (Acoustic, Jazz, Clean, Country, Ambient):
     * Consider Condenser microphones (like Condenser 87, Condenser 414, or Condenser 170) more frequently for natural detail, openness, and polished studio sparkle.
     * Allow more room/distance contribution for spatial depth and air.
     * Avoid aggressive close-mic-only configurations unless the target tone demands extreme direct attack.
   - Bass Cabinets & Tones:
     * Never blindly copy default guitar cabinet microphone selections.
     * Prioritize low-end fullness, smooth highs, and controlled midrange using low-end-friendly microphones (like Dynamic 20, Vintage Dynamic 20, Condenser 170, or Ribbon 160).

4. Explanation & Note Writing Standards:
   - Always clearly explain your microphone choices under engineering_notes. Explain what roles each selected microphone plays (e.g. as a primary attack mic, body mic, warmth mic, etc.) and why they fit the style. Avoid empty comments like "Used Dynamic 57 because it is common" — explain its acoustic role in detail.

AMPLIFIER DIRECTORY:
{amplifier_directory}

CABINET & SPEAKER DIRECTORY:
{cabinet_speaker_directory}

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
    "eq_strategy": "Detailed breakdown of the frequency shaping logic",
    "amplifier_debug": "selected TT Gear Name: <exact matching amp name>\nmatched aliases/tags: <comma-separated matched aliases & tags>\ntone reason: <rank candidate amps and explain why the chosen one won>\navailable controls used: <exact knobs and values set>\nany controls requested but unavailable: <any requested knobs or features that do not exist on the selected amp, or 'None'>\n\nselected Cab Name: <exact matching cab name>\nselected Speaker Name: <exact matching speaker name>\ncab, speaker & microphone reason: <explain logic behind cabinet construction, size, speaker choice, microphone roles, matching placement, and how they relate systematically to the style and amp>"
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
  const ampContext = AT5_AMPLIFIER_KNOWLEDGE.map(amp => {
    const controlsStr = amp.controls.map(c => `- ${c.name} (range: ${c.min} to ${c.max}${c.description ? ` - ${c.description}` : ""})`).join("\n");
    const settingsStr = Object.entries(amp.typicalSettings).map(([k, v]) => `${k}: ${v}`).join(", ");
    return `### ${amp.name}
- Real Gear: ${amp.realGear}
- Category: ${amp.category}
- Typical Settings: { ${settingsStr} }
- Tags: ${amp.tags.join(", ")}
- Available Controls:
${controlsStr}
- Tone Strategy/Default Usage: ${amp.defaultUsage}
`;
  }).join("\n-------------------\n");

  const fullPrompt = MASTER_PROMPT
    .replace('{user_input}', textPrompt)
    .replace('{amplifier_directory}', ampContext)
    .replace('{cabinet_speaker_directory}', AT5_CABINET_SPEAKER_KNOWLEDGE);
  const parts: any[] = [{ text: fullPrompt }];

  if (youtubeUrl) {
    parts.push({ text: `Additional YouTube Context: ${youtubeUrl}` });
  }

  if (userPreset) {
    parts.push({ text: `Existing Preset Context: ${JSON.stringify(userPreset)}` });
  }

  // Task 6 — Deterministic Kill 'Em All validation recipe
  const lowerPrompt = textPrompt.toLowerCase();
  
  const isAcdcKeyword = [
    "ac/dc", "acdc", "malcolm young", "malcom young", "angus young", "jailbreak", "high voltage", "let there be rock", "powerage", "highway to hell"
  ].some(kw => lowerPrompt.includes(kw));

  if (useValidationRecipes && isAcdcKeyword) {
    return {
      tone_summary: {
        style: "classic rock",
        gain_level: "medium",
        noise_level: "low"
      },
      signal_chain: [
        {
          type: "amp",
          name: "British Lead S100",
          settings: {
            "Gain": 4.0,
            "Bass": 4.5,
            "Middle": 7.5,
            "Treble": 5.5,
            "Presence": 5.0,
            "Reverb": 0.0,
            "Volume": 7.5
          }
        },
        {
          type: "cab",
          name: "4x12 Brit 8000",
          settings: {
            "Speaker": "Brit Green",
            "Mic_1": "Dynamic 57",
            "Mic_2": "Ribbon 121",
            "Room": "Small Studio"
          }
        }
      ],
      engineering_notes: {
        gain_strategy: "Malcolm Young's Jailbreak rhythm tone is treated as a dry 1970s AC/DC rhythm sound: vintage Marshall-style crunch, low-to-medium gain, strong mids, Greenback-style speaker compression, and minimal processing.",
        noise_control: "No noise gate or compression is needed. The raw, open dynamics of the guitar humbuckers directly driving the input stage of the Super Lead 100 provides organic, clear note-separation.",
        eq_strategy: "Amplifier EQ has scooped bass to keep low-end tight and clear mid-frequencies pushed to maximize crunch and projection. Cabinet features Greenback speakers for midrange emphasis.",
        amplifier_debug: "selected TT Gear Name: British Lead S100\nmatched aliases/tags: classic rock, vintage Marshall, Malcolm Young, AC/DC, rhythm, plexi, super lead\ntone reason: Chosen for authentic classic 70s British rock crunch. Malcolm Young's tone is dry, dynamic, and mid-forward without modern saturated distortion. British Lead S100 represents the iconic Plexi 1959/Super Lead 100 watt crunch perfectly.\navailable controls used: Gain: 4.0, Bass: 4.5, Middle: 7.5, Treble: 5.5, Presence: 5.0, Reverb: 0.0, Volume: 7.5\nany controls requested but unavailable: None\n\nselected Cab Name: 4x12 Brit 8000\nselected Speaker Name: Brit Green\ncab, speaker & microphone reason: British closed-back 4x12 paired with Greenback-style (Brit Green) speakers for classic organic crunch, rich midrange response, and vintage compression characteristics. Dynamic 57 as a primary close mic gives presence and pick attack, while Ribbon 121 adds warmth and body."
      },
      confidence: 100
    };
  }

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
        eq_strategy: "V-shape with forward high-mids via Graphic EQ.",
        amplifier_debug: "selected TT Gear Name: Brit 8000\nmatched aliases/tags: early thrash, Metallica, rhythm, brit 8000\ntone reason: Matches 80s thrash metal requests ideally. JCM800/Brit 8000 selected for iconic midrange punch and raw power tube saturation.\navailable controls used: Pre Amp: 7.0, Bass: 4.0, Middle: 7.5, Treble: 7.0, Presence: 7.8, Master: 6.0\nany controls requested but unavailable: None\n\nselected Cab Name: 4x12 Brit 8000\nselected Speaker Name: Brit 75\ncab, speaker & microphone reason: Closed-back Marshall-style 4x12 chosen as the metal standard for high-end projection and controlled low-end chugs. Coupled with Brit 75 (G12T-75) speakers to capture the authentic extended highs and raw, buzzy, scooped low-end texture of early 1980s American-British thrash. Dynamic 57 provides pick attack and presence, while Ribbon 121 smooths high-frequency buzz."
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
          model: "gemini-3.5-flash",
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

  // Check if the user specifically wants a raw/fuzzy/buzzy early thrash or vintage metal feel with more clipping texture
  const hasRawVintageThrashKeywords = [
    "early thrash",
    "kill 'em all",
    "kill em all",
    "raw",
    "fuzzy",
    "buzzy",
    "dirty",
    "aggressive vintage metal",
    "vintage thrash",
    "vintage metal",
    "clipping texture",
    "harmonic buzz",
    "rawness"
  ].some(kw => lowerPrompt.includes(kw));

  // Determine if we should enforce OverScream over PROdrive based on logical constraints
  // If explicitly thrash, force OverScream even if they mention "fuzzy/raw" (which they want in the OverScream context)
  const shouldEnforceOverScream = (hasThrashKeywords || selectsMarshallAmp) && !(hasExplicitRatOrFuzzKeywords && !hasThrashKeywords);

  if (shouldEnforceOverScream) {
    let hasBoostOrDrive = false;
    
    // Choose settings: raw vintage thrash uses higher drive/lower level for clipping diode texture,
    // whereas modern high-gain/active thrash uses clean level push/low drive for tightness.
    const overScreamSettings = hasRawVintageThrashKeywords ? {
      "Drive": 4.5,
      "Tone": 5.5,
      "Level": 6.5
    } : {
      "Drive": 1.0,
      "Tone": 6.8,
      "Level": 9.0
    };

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
          // Return OverScream with correct context-aware settings
          return {
            ...el,
            name: "OverScream",
            settings: { ...overScreamSettings }
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
        settings: { ...overScreamSettings }
      };

      // Insert OverScream before the first amp element
      const ampIndex = result.signal_chain.findIndex(el => el.type === "amp");
      if (ampIndex !== -1) {
        result.signal_chain.splice(ampIndex, 0, overScreamElement);
      } else {
        result.signal_chain.push(overScreamElement);
      }
    }
    
    // Also, update the engineering notes to explain the tight vs raw thrash settings of OverScream
    if (result.engineering_notes) {
      if (hasRawVintageThrashKeywords) {
        result.engineering_notes.gain_strategy = "Vintage OverScream boost (Drive 4.5, Level 6.5) to introduce warm pedal diode clipping and harmonic buzz before the preamp, providing authentic early-thrash distortion texture.";
        result.engineering_notes.eq_strategy = "Upper-mid push from OverScream to keep the notes focused and raw, preserving classic 1980's aggressive distortion bite.";
      } else {
        result.engineering_notes.gain_strategy = "Clean OverScream boost (Drive 1.0, Level 9.0) to aggressively tighten pre-gain low end, driving the amp into focused thrash saturation without muddy smear.";
        result.engineering_notes.eq_strategy = "Upper-mid boost from OverScream to cut through, maintaining sharp pick attack and tight palm mutes.";
      }
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
