// src/services/at5CabinetKnowledge.ts
// Abstract decision-making guidelines for Tone Translator's cabinet and speaker selection.

export const AT5_CABINET_SPEAKER_KNOWLEDGE = `
CABINET AND SPEAKER SELECTION ENGINE RULE BOOK
==============================================

Cabinet and speaker selection is a foundational tone-design decision. The amp is the tone engine; the cabinet is the tone voice, and the speaker is the tone character.

1. TT CABINET SELECTION STRATEGY & STEPS:
   a. Determine Style/Genre first.
   b. Determine required low-end behavior (loose vs. tight, deep vs. focused).
   c. Determine cabinet construction (Open Back, Closed Back, Semi-Open).
   d. Determine cabinet size (1x12, 2x12, 4x12).
   e. Determine speaker family (Vintage 30, Greenback, G12T-75, Jensen, EV).
   f. Verify amp and cabinet compatibility (British to British, American to American, High-Gain to closed-back, etc.).
   g. Select cabinet and swap speakers before selecting microphones.
   h. Treat speaker choice as equally important as amp choice.

2. AT5 HARDWARE MAPPING DIRECTORY:
   Use the guidelines below to translate abstract choices into exact hardware names in the "cab" signal chain element.

   CABINET MAPPINGS:
   -----------------
   - "2x12 '65 Twin Reverb": Open-back Fender-style combo cabinet. Clean, sparkly, wide-dispersion.
   - "1x12 '65 Deluxe Reverb": Open-back compact American combo cabinet. Focused, dynamic, organic clean/edge of breakup.
   - "1x10 '65 Princeton": Standard open-back vintage clean low-power combo cabinet.
   - "4x10 '59 Bassman": Open-back vintage tweed cabinet with raw responsive midrange voice.
   - "2x12 Jazz": Sealed/ported cabinet designed for ultra-clean, transparent, high-headroom jazz and stereo chorus tones.
   - "4x12 Brit 8000": The standard Marshall-style closed-back cabinet. Great for rock, hard rock, 80s metal.
   - "4x12 1960AV SL": Standard vintage-voiced British slant 4x12 cabinet.
   - "4x12 Recto Traditional Slant": Mesa-style heavy closed-back cabinet. Massive low-end projection, punchy, extremely tight.
   - "4x12 Closed 75 C": Large enclosed heavy cabinet used for high-gain thrash and modern metal. High focus.
   - "4x12 Closed Vintage": Warm, punchy vintage-voiced closed-back cabinet.

   SPEAKER MAPPINGS (for "Speaker" parameter):
   -------------------------------------------
   - "Brit Green" (Greenback): Cellestion G12M. Warm mids, softer highs, vintage compression, organic overdrive. Essential for classic rock and blues rock.
   - "Brit V1" / "Brit V2" (Vintage 30): Celestion Vintage 30. Aggressive upper mids, tight low end, high mix penetration. Default for hard rock, metal, thrash, and modern metal.
   - "Brit 75" (G12T-75): Celestion G12T-75. Scooped mids, deep bass, extended bite. Excellent for 1980s hair metal and early thrash.
   - "American 12C" (Jensen C12Q) / "American 12K" (Jensen C12K): Pristine clean headroom, sparkly highs, open and detailed americana clean voice. Pair with Fender-style setups.
   - "EV Darkness" (EVM-12L): Electro-Voice. Ultra-high headroom, neutral frequency, massive low-end authority, zero speaker distortion under high gain. Best for precision technical metal.
   - "Jazz 12" (Roland JC-120): Flat, high-fidelity response speaker. Only pair with clean solid-state amps.

3. CABINET CONSTRUCTION CHARACTERISTICS:
   - OPEN BACK (Sparkly, Airy, Spacious, Three-Dimensional, Loose Low End, Bright Room Ambience):
     * Dispersion is wide and interacts with the room. Mids are organic, highs have air, bass is loose and deep but not punchy.
     * Use For: Clean, Blues, Country, Vintage Rock, Americana, and any low to medium-gain sounds.
     * Mappings: Prefer "2x12 '65 Twin Reverb", "1x12 '65 Deluxe Reverb", or "4x10 '59 Bassman".
     * Default Speaker: "American 12C" or "American 12K".
   - CLOSED BACK (Tight, Focused, Aggressive, Punchy, Controlled, Powerful):
     * Highly directional projection with immense low-end punch, tight attack, and focused midrange. Perfect for high-gain compression.
     * Use For: Hard Rock, Heavy Rock, Thrash Metal, Modern Metal, and high-gain solos.
     * Mappings: Prefer "4x12 Recto Traditional Slant", "4x12 Brit 8000", or "4x12 Closed 75 C".
     * Default Speaker: "Brit V1", "Brit V2" (for midrange cut) or "EV Darkness" (for high-gain low-end tracking).
   - SEMI-OPEN / PORTED:
     * Balanced compromise. Controlled bass but with more air than fully sealed cabinets.
     * Mappings: "2x12 Jazz", "4x12 Closed Vintage".

4. CABINET SIZING LOGIC:
   - 1x12: Focused, vintage, tight but limited low-end weight. Ideal for blues recording, low-power combos, and edge-of-breakup slide.
   - 2x12: Balanced, versatile. Decent low-end authority, excellent midrange articulation, highly responsive. Perfect for classic rock, fusion, and hard rock.
   - 4x12: Maximum projection, deep low-end shelf, wide soundstage, powerful midrange authority. The absolute default starting point for Thrash, Heavy Metal, Arena Rock, and Modern Metal.

5. GENRE / AUDIO PAIRINGS:
   - Blues: Open-back 1x12 ("1x12 '65 Deluxe Reverb") + Jensen speaker ("American 12C").
   - Country/Americana: Open-back Fender-style combo ("2x12 '65 Twin Reverb" or "1x12 '65 Deluxe Reverb") + Jensen speaker ("American 12C").
   - Classic Rock (e.g. Plexi, JTM45): 2x12 or British 4x12 ("4x12 Brit 8000") + Greenback speaker ("Brit Green").
   - Hard Rock (e.g. JCM800, AFD): Closed-back British 4x12 ("4x12 Brit 8000") + Celestion Vintage 30 ("Brit V1" / "Brit V2") or Greenback ("Brit Green").
   - 1980s Heavy Metal / Hair Metal: Marshall-style 4x12 ("4x12 Brit 8000") + Celestion G12T-75 ("Brit 75") or Vintage 30 ("Brit V1").
   - Thrash Metal: Closed-back 4x12 ("4x12 Closed 75 C" or "4x12 Brit 8000") + Vintage 30 speaker ("Brit V1"). Focuses on extreme pick attack speed, solid palm mutes, and sharp mid cut.
   - Modern Metal / High-Gain (e.g. Dual Rectifier, SLO-100, Peavey 5150): Mesa closed-back 4x12 ("4x12 Recto Traditional Slant") + Vintage 30 speaker ("Brit V1") or Electro-Voice speaker ("EV Darkness") for ultra-fast tracking and solid low-end focus.
`;
