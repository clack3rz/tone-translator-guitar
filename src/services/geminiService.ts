import { GoogleGenAI, Type } from "@google/genai";
import { ToneResult } from "../types";
import { AMP_MANIFEST, STOMP_MANIFEST, CAB_MANIFEST, ROOM_MANIFEST, RACK_MANIFEST, TONEX_MANIFEST } from "./gearManifest";
import { AT5_CATALOG, findAT5Gear, AT5_EMPTY_SLOT_GUID } from "./at5Catalog";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const filterManifest = (items: any[]) => items.map(item => {
  const filtered: any = { id: item.id, name: item.name };
  if (item.knobs) filtered.knobs = item.knobs;
  return filtered;
});

const MASTER_PROMPT = `
You are a stateless JSON transformation function.

You exist ONLY to transform input into a structured guitar signal chain.

HARD CONSTRAINTS:
- Return ONLY valid JSON
- No explanations
- No text outside JSON
- Do NOT describe systems
- Do NOT call tools or perform actions

TASK:
Analyze the requested guitar tone and produce a complete AmpliTube 5 signal chain.

SIGNAL CHAIN CONSTRAINTS:
- Use a maximum of 57 models total.
- Typical layout order: Noise Gate → Stomp FX → Amp → Cabinet → Rack FX.
- Multiple signal paths are possible (Single, 2-way Split, 3-way Split, Parallel).
- Specific Signal chain slots:
  - Stomps: Before the amp.
  - Amp: Preamp + Power amp.
  - Cab section: Cabinet + Mics + Room.
  - Rack/Master: After the cabinet/Mixer.

ENGINEERING LOGIC (from manual):
- Use Noise Gate at the start if gain is high.
- Overdrive is often used as a boost (low drive, high level) to tighten the low end of high-gain amps.
- Use Compressor to even out dynamics or add sustain.
- Cab Link: Usually preferred to match the cabinet to the amplifier model.
- Mixer: Balance Mic 1 (typically a Dynamic 57 on-axis), Mic 2 (typically a Ribbon 121 or Condenser 87 off-axis), Room, and DI signals.
- Speaker Swap: For specialized tones, consider swapping speakers (e.g., using Greenbacks in a 1960 cab for vintage crunch).

GENRE SPECIFIC RULES:
- Early Thrash Metal: Use Overdrive as a clean boost (Drive 0-2, high Volume) to tighten low end. Keep amp gain medium to medium-high. Prioritize forward mids (do not scoop). Avoid distortion pedals/fuzziness.
- Modern Metal: Use higher gain amps. Implement tight low-end filtering and high compression. Noise gate is MANDATORY. More traditional "scooped" EQ profile.
- Classic Rock: Lower gain settings. Disable noise gate. Focus on dynamic response. Use amp saturation instead of pedals for primary drive.
- Blues: Low gain, highly touch-sensitive/dynamic. No noise gate. Warm midrange and smooth, rounded highs.

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
    "gain_strategy": "string",
    "noise_control": "string",
    "eq_strategy": "string"
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
  youtubeUrl?: string
): Promise<ToneResult> {
  const fullPrompt = MASTER_PROMPT.replace('{user_input}', textPrompt);
  const parts: any[] = [{ text: fullPrompt }];

  if (youtubeUrl) {
    parts.push({ text: `Additional YouTube Context: ${youtubeUrl}` });
  }

  if (userPreset) {
    parts.push({ text: `Existing Preset Context: ${JSON.stringify(userPreset)}` });
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
    const result = JSON.parse(toneText);
    return result as ToneResult;
  } catch (error) {
    console.error("AI Response JSON Parsing Failed:", error);
    throw new Error("Failed to parse AI response. Please try again.");
  }
}
