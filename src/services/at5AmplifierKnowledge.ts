// src/services/at5AmplifierKnowledge.ts
// Derived from TT_02_Amplifiers.md (pages 230-379 of AmpliTube 5 reference documentation)

export interface AmpControlSchema {
  name: string;
  min: number;
  max: number;
  description?: string;
}

export interface AmplifierDef {
  name: string; // Exact Display Name in AT5
  realGear: string;
  category: string;
  toneNotes: string;
  defaultUsage: string;
  typicalSettings: { [key: string]: number | string };
  tags: string[];
  controls: AmpControlSchema[];
}

export const AT5_AMPLIFIER_KNOWLEDGE: AmplifierDef[] = [
  {
    name: "American Clean MKIII",
    realGear: "Mesa/Boogie® Mark III™ Combo (Clean Channel)",
    category: "AmpliTube Clean",
    toneNotes: "Sparkling clean with a touch of crunch when revved. Signature sound on many stages around the world.",
    defaultUsage: "Clean to edge-of-breakup foundation: choose when the request needs clarity, pedals, reverb/tremolo character, or vintage clean response.",
    typicalSettings: { "Volume": 4, "Bright": 1, "Treble": 6, "Bass": 5, "Middle": 5, "Master": 5, "Presence": 6, "Reverb": 3 },
    tags: ["american", "clean", "crunch", "high-gain", "mesa-family", "metal"],
    controls: [
      { name: "Volume", min: 0, max: 10, description: "sets the volume of the clean preamp. Push closer to 10 for sweet crunch." },
      { name: "Bright", min: 0, max: 1, description: "boosts brilliance especially when Volume is low." },
      { name: "Treble", min: 0, max: 10 },
      { name: "Shift", min: 0, max: 1, description: "modifies the frequencies where the Bass control works." },
      { name: "Bass", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Master", min: 0, max: 10, description: "sent to power amp; turn up to saturate and produce power amp crunch." },
      { name: "Rhythm 2", min: 0, max: 1, description: "preamp has more gain for extremely musical/sweet crunch." },
      { name: "Deep", min: 0, max: 1, description: "extends the bass response of the amplifier." },
      { name: "EQ", min: 0, max: 1, description: "enables the graphic EQ." },
      { name: "Presence", min: 0, max: 10, description: "makes the amp more present and brighter." },
      { name: "Reverb", min: 0, max: 10 }
    ]
  },
  {
    name: "American Tube Clean 1",
    realGear: "Fender® Super Reverb®",
    category: "AmpliTube Clean",
    toneNotes: "Clean to dirty iconic American amp. Ideal for clean and crunchy rhythm, rock, country, blues, and anything requiring vintage clean that gets dirty when pushed.",
    defaultUsage: "Clean to edge-of-breakup foundation: choose when the request needs clarity, pedals, reverb/tremolo character, or vintage clean response.",
    typicalSettings: { "Volume": 4, "Bass": 5, "Middle": 5, "Treble": 6, "Presence": 5, "Spring Reverb": 3 },
    tags: ["american", "clean", "crunch", "fender-family", "vintage"],
    controls: [
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "American Tube Clean 2",
    realGear: "Fender® DeLuxe Reverb® ’65",
    category: "AmpliTube Clean",
    toneNotes: "Smaller combo amp delivering a warm and glassy American clean tone.",
    defaultUsage: "Clean to edge-of-breakup foundation: choose when the request needs clarity, pedals, reverb/tremolo character, or vintage clean response.",
    typicalSettings: { "Volume": 4, "Bass": 5, "Middle": 5, "Treble": 6, "Presence": 4, "Spring Reverb": 3 },
    tags: ["american", "clean", "fender-family", "vintage"],
    controls: [
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Custom Solid State Clean",
    realGear: "Generic Solid State Jazz Amp",
    category: "AmpliTube Clean",
    toneNotes: "Extremely clean, uncolored signal. Sparkling tone ideal for jazz and clean pedals.",
    defaultUsage: "Clean to edge-of-breakup foundation: choose when the request needs clarity, pedals, reverb/tremolo character, or vintage clean response.",
    typicalSettings: { "Volume": 5, "Bass": 5, "Treble": 5, "Presence": 4, "Spring Reverb": 2 },
    tags: ["clean"],
    controls: [
      { name: "Bass", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Jazz Amp 120",
    realGear: "Roland® JC-120™",
    category: "AmpliTube Clean",
    toneNotes: "Ultra clean with fantastic analog chorus and vibrato unit. Highly valued by metal players in studios for dead-clean parts.",
    defaultUsage: "Clean to edge-of-breakup foundation: choose when the request needs clarity, pedals, reverb/tremolo character, or vintage clean response.",
    typicalSettings: { "Volume": 4, "Bright": 0, "Treble": 5, "Middle": 6, "Bass": 4, "Distortion": 0, "Reverb": 2, "Vib/Chorus": 2 },
    tags: ["clean"],
    controls: [
      { name: "Bright", min: 0, max: 1 },
      { name: "Volume", min: 0, max: 10 },
      { name: "Distortion", min: 0, max: 10 },
      { name: "Reverb", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Vib/Off/Chorus", min: 0, max: 2, description: "0: Off, 1: Vibrato, 2: Chorus" },
      { name: "Speed", min: 0, max: 10 },
      { name: "Depth", min: 0, max: 10 }
    ]
  },
  {
    name: "Metal Clean T",
    realGear: "Mesa/Boogie® Triple Rectifier® (Clean Channel)",
    category: "AmpliTube Clean",
    toneNotes: "Detailed, well defined, high headroom clean. Ideal starting point for massive clean or using pedals for high gain.",
    defaultUsage: "Clean to edge-of-breakup foundation: choose when the request needs clarity, pedals, reverb/tremolo character, or vintage clean response.",
    typicalSettings: { "Gain": 4, "Bass": 5, "Middle": 5, "Treble": 6, "Presence": 6, "Spring Reverb": 2, "Volume": 6 },
    tags: ["american", "clean", "high-gain", "mesa-family", "metal"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "American Tube Vintage",
    realGear: "Fender® Bassman®",
    category: "AmpliTube Crunch",
    toneNotes: "Originally a bass amp, but became one of the most popular American crunch and clean guitar amps ever. Very versatile.",
    defaultUsage: "Clean to crunch foundation; full of low-end authority and organic power tube saturation.",
    typicalSettings: { "Volume": 5, "Bass": 6, "Middle": 5, "Treble": 6, "Presence": 5, "Spring Reverb": 2 },
    tags: ["american", "bass", "clean", "crunch", "fender-family", "vintage"],
    controls: [
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Brit Valve Pre",
    realGear: "Marshall® JMP-1™ tube preamp",
    category: "AmpliTube Crunch",
    toneNotes: "Scultps marshall tones, straightforward dual OD and clean channels, classic Marshall MIDI rack character.",
    defaultUsage: "Rock and metal preamp foundation: tight, focused Marshall crunch and screaming leads.",
    typicalSettings: { "Gain": 6, "Bass": 5, "Middle": 6, "Treble": 6, "Presence": 5, "Clean 1": 0, "OD1": 1, "Output Level": 7 },
    tags: ["bass", "british", "classic-rock", "crunch", "hard-rock", "marshall-family"],
    controls: [
      { name: "Gain", min: 0, max: 20 },
      { name: "Bass", min: -6, max: 6 },
      { name: "Middle", min: -6, max: 6 },
      { name: "Treble", min: -6, max: 6 },
      { name: "Presence", min: -6, max: 6 },
      { name: "OD1", min: 0, max: 1 },
      { name: "OD2", min: 0, max: 1 },
      { name: "Bass Shift", min: 0, max: 1 },
      { name: "Clean 1", min: 0, max: 1 },
      { name: "Clean 2", min: 0, max: 1 },
      { name: "Output Level", min: 0, max: 10 }
    ]
  },
  {
    name: "British Blue Tube 30TB",
    realGear: "Vox® AC30™ Top Boost - Blue Panel",
    category: "AmpliTube Crunch",
    toneNotes: "Legendary British chime. Chimey rhythm, classic rock, early metal, and bell overtones used by the Liverpool quartet.",
    defaultUsage: "Rock/crunch/lead foundation check: chimey, bright, responsive VOX chime.",
    typicalSettings: { "Volume": 5, "Bass": 5, "Treble": 6, "Cut": 3, "Spring Reverb": 2 },
    tags: ["british", "chime", "classic-rock", "clean", "crunch", "hard-rock", "marshall-family", "vox-family"],
    controls: [
      { name: "Bass", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Cut", min: 1, max: 10, description: "cuts high frequencies when turned down" },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "British Copper 30TB",
    realGear: "Vox® AC30™ - Copper Panel",
    category: "AmpliTube Crunch",
    toneNotes: "Accurate model of non-top boost copper AC30 with top-boost toggle, normal and brilliant volumes.",
    defaultUsage: "British vibe, chime, edge-of-breakup and highly interactive clean-to-rock tones.",
    typicalSettings: { "Normal": 3, "Brilliant": 6, "Vib -Trem": 0, "Top Boost": 1, "Bass": 5, "Treble": 6, "Tone": 5, "Speed": 5 },
    tags: ["british", "chime", "classic-rock", "clean", "crunch", "hard-rock", "marshall-family", "vox-family"],
    controls: [
      { name: "Normal", min: 0, max: 10, description: "Sets the volume level for the Normal channel" },
      { name: "Brilliant", min: 0, max: 10, description: "Sets the volume level for the Brilliant channel" },
      { name: "Vib -Trem", min: 0, max: 10 },
      { name: "Top Boost", min: 0, max: 1 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Tone", min: 0, max: 10 },
      { name: "Speed", min: 0, max: 10 }
    ]
  },
  {
    name: "HiAmp",
    realGear: "Hiwatt® DR103™ Head",
    category: "AmpliTube Crunch",
    toneNotes: "Full-bodied warm clean and huge clean-headroom crunch of the 70s rock performances. Loud and clear.",
    defaultUsage: "Loud, high-headroom rock crunch or absolute platform for high-power clean grit.",
    typicalSettings: { "Normal Volume": 4, "Bright Volume": 6, "Bass": 5, "Treble": 6, "Middle": 6, "Presence": 5, "Master Volume": 6 },
    tags: ["british", "classic-rock", "clean", "crunch", "hard-rock", "hiwatt-family", "loud-clean", "marshall-family"],
    controls: [
      { name: "Normal Volume", min: 1, max: 10 },
      { name: "Bright Volume", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Master Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Tube Vintage Combo",
    realGear: "Supro® Late ‘50s combo",
    category: "AmpliTube Crunch",
    toneNotes: "Small vintage amp, big in tone. Beautifully simple mid-focused vintage dirt.",
    defaultUsage: "Vintage low-wattage compression, blues overdrive and raw vintage rock grit.",
    typicalSettings: { "Presence": 6, "Spring Reverb": 2, "Volume": 7 },
    tags: ["crunch"],
    controls: [
      { name: "Presence", min: 0, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "American Lead MKIII",
    realGear: "Mesa/Boogie® Mark III™ Combo (Lead Channel)",
    category: "AmpliTube Lead",
    toneNotes: "Aggressive California crunch or smooth sustaining, liquid lead sounds. Renowned 5-band EQ option.",
    defaultUsage: "American high gain, singing fusion leads and heavy progressive metal crunch (Petrucci style).",
    typicalSettings: { "Lead Drive": 7, "Volume": 6, "Master": 5, "Treble": 6, "Bass": 4, "Middle": 5, "Presence": 6, "EQ": 1, "Reverb": 2 },
    tags: ["american", "clean", "crunch", "high-gain", "lead", "mesa-family", "metal"],
    controls: [
      { name: "Lead Drive", min: 0, max: 10 },
      { name: "Volume", min: 0, max: 10 },
      { name: "Master", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Bright", min: 0, max: 1 },
      { name: "Shift (Bass)", min: 0, max: 1 },
      { name: "Shift (Treble)", min: 0, max: 1 },
      { name: "Rhythm 2", min: 0, max: 1 },
      { name: "Deep", min: 0, max: 1 },
      { name: "EQ", min: 0, max: 1 },
      { name: "Presence", min: 0, max: 10 },
      { name: "Reverb", min: 0, max: 10 }
    ]
  },
  {
    name: "Brit 8000",
    realGear: "Marshall® JCM800™ head",
    category: "AmpliTube Lead",
    toneNotes: "Defining tone of the 80s heavy rock. Hotter front end, iconic punchy midrange, fantastic when driven with OD.",
    defaultUsage: "Hard rock, 80s heavy metal and boosted thrash metal rhythm foundation.",
    typicalSettings: { "Pre Amp Volume": 7, "Bass": 5, "Middle": 7, "Treble": 6, "Presence": 6, "Master Volume": 6, "Sensitivity": 1 },
    tags: ["british", "classic-rock", "hard-rock", "lead", "marshall-family"],
    controls: [
      { name: "Sensitivity", min: 0, max: 1, description: "Low / High inputs toggle" },
      { name: "Presence", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Master Volume", min: 0, max: 10 },
      { name: "Pre Amp Volume", min: 0, max: 10 }
    ]
  },
  {
    name: "Brit 9000",
    realGear: "Marshall® JCM900™ head",
    category: "AmpliTube Lead",
    toneNotes: "Evolution of JCM800. Dual channel, dual reverb, fearsom and screaming lead tones with extra preamp saturation.",
    defaultUsage: "90s rock, punk, and higher-gain alternative rock and heavy metal rhythms.",
    typicalSettings: { "Pre Amp Volume": 7, "Gain Sensitivity": 6, "Bass": 4, "Middle": 6, "Treble": 6, "Presence": 6, "Master Volume": 5 },
    tags: ["british", "classic-rock", "clean", "hard-rock", "lead", "marshall-family"],
    controls: [
      { name: "Presence", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Master Volume", min: 0, max: 10 },
      { name: "Gain Sensitivity", min: 0, max: 10 },
      { name: "Pre Amp Volume", min: 0, max: 10 },
      { name: "Power Level", min: 0, max: 1 }
    ]
  },
  {
    name: "Brit Silver",
    realGear: "Marshall® Jubilee™ head",
    category: "AmpliTube Lead",
    toneNotes: "Recreates AFD/Slash rock vibes. 3-mode preamp (clean, Rhythm Clip, Lead), beautiful midrange compression.",
    defaultUsage: "Guns N' Roses, classic hard rock, Slash-style high mid leads with singing sustain.",
    typicalSettings: { "Input Gain": 6, "Lead Master": 6, "Bass": 5, "Middle": 7, "Treble": 5, "Presence": 6, "Output Master": 5, "Pull Channel": 1, "Pull Rhythm Clip": 0 },
    tags: ["british", "classic-rock", "clean", "hard-rock", "lead", "marshall-family"],
    controls: [
      { name: "Presence", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Output Master", min: 0, max: 10 },
      { name: "Pull Channel", min: 0, max: 1, description: "0: Clean, 1: Lead" },
      { name: "Lead Master", min: 0, max: 10 },
      { name: "Input Gain", min: 0, max: 10 },
      { name: "Pull Rhythm Clip", min: 0, max: 1 }
    ]
  },
  {
    name: "British Tube Lead 1",
    realGear: "Marshall® JCM800™ head (alternative voicing)",
    category: "AmpliTube Lead",
    toneNotes: "Go-to amp for a variety of heavy rock and tube saturated classic tone.",
    defaultUsage: "Heavy generic 80s rock and Marshall-fueled tube overdrive.",
    typicalSettings: { "Gain": 6.5, "Bass": 5, "Middle": 6.5, "Treble": 6, "Presence": 6, "Volume": 5.5 },
    tags: ["british", "classic-rock", "hard-rock", "lead", "marshall-family"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "British Tube Lead 2",
    realGear: "Marshall® JCM900™ head (alternative voicing)",
    category: "AmpliTube Lead",
    toneNotes: "Grittier, a bit more aggressive tone than Lead 1. Great for screaming leads and heavy crunch.",
    defaultUsage: "Grungy rock, heavy rhythms, and screaming high mids.",
    typicalSettings: { "Gain": 7, "Bass": 4.5, "Middle": 6, "Treble": 6.5, "Presence": 6, "Volume": 5 },
    tags: ["british", "classic-rock", "crunch", "hard-rock", "lead", "marshall-family"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Custom Modern Hi-Gain",
    realGear: "Classic AmpliTube high-gain model",
    category: "AmpliTube Lead",
    toneNotes: "Saturated, over-the-edge modern metal distortion.",
    defaultUsage: "High-gain modern lead, shred solos and tight heavy palm-mutes.",
    typicalSettings: { "Gain": 7.5, "Bass": 5, "Middle": 5, "Treble": 6, "Presence": 7, "Volume": 5 },
    tags: ["lead"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Custom Solid State Fuzz",
    realGear: "60s fuzz amp simulation",
    category: "AmpliTube Lead",
    toneNotes: "Distinct, buzzy and heavily compressed 60s fuzz tone.",
    defaultUsage: "Psychedelic garage rock, fuzz solos, and classic buzzy riffs.",
    typicalSettings: { "Gain": 8, "Bass": 4, "Treble": 7, "Presence": 5, "Volume": 6 },
    tags: ["lead"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Custom Solid State Lead",
    realGear: "Solid state high-gain lead model",
    category: "AmpliTube Lead",
    toneNotes: "Darker, stable solid state lead tone. Excels at high-gain leads at any volume level.",
    defaultUsage: "Dark rock leads, stable solid-state sustain, and direct high gain.",
    typicalSettings: { "Gain": 7, "Bass": 5, "Treble": 5, "Presence": 5, "Volume": 6 },
    tags: ["lead"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "German 34",
    realGear: "Bogner® Ecstasy XTC 3534",
    category: "AmpliTube Lead",
    toneNotes: "Boutique EL34 sound from crystalline cleans to raging boutique liquid distortion. 3 channels.",
    defaultUsage: "Versatile boutique channel-switching check: soft green cleans, crunch blue rhythm, red screaming lead.",
    typicalSettings: { "Gain 1": 6, "Vol. 1": 5, "Treble": 5, "Middle": 5, "Bass": 5, "CH. Select": 1, "Boost": 1, "Presence": 6 },
    tags: ["bogner-family", "boutique", "clean", "high-gain", "lead"],
    controls: [
      { name: "Vol. 1", min: 0, max: 10 },
      { name: "Gain 1", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "CH. Select", min: 0, max: 2, description: "0: Green, 1: Blue, 2: Red" },
      { name: "Boost", min: 0, max: 1 },
      { name: "N/B1/B2 Switch", min: 0, max: 2, description: "Bright mode: Normal, Bright1, Bright2" },
      { name: "Presence", min: 0, max: 10 }
    ]
  },
  {
    name: "MiniPlex 20",
    realGear: "Friedman® Pink Taco PT-20",
    category: "AmpliTube Lead",
    toneNotes: "Super versatile EL84-powered brown sound. Harmonically rich, loves overdrive pedals.",
    defaultUsage: "Brown sound classic/hard-rock rhythm and saturated boutique crunch (Friedman style).",
    typicalSettings: { "Gain": 7.5, "Master": 5, "Treble": 5.5, "Middle": 6, "Bass": 4.5, "S": 1 },
    tags: ["brown-sound", "friedman-family", "hot-rodded", "lead"],
    controls: [
      { name: "Bass", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Master", min: 0, max: 10 },
      { name: "Gain", min: 0, max: 10 },
      { name: "S", min: 0, max: 2, description: "Gain structure switch" }
    ]
  },
  {
    name: "Metal Lead T",
    realGear: "MESA/Boogie® Triple Rectifier® (Lead Channel)",
    category: "AmpliTube Lead",
    toneNotes: "Tightest bass and fastest response even at extreme speeds. Essential for thrash, speed, and modern metal.",
    defaultUsage: "Searing modern thrash rhythm and heavy progressive drop-tuned riffs.",
    typicalSettings: { "Gain": 7, "Bass": 4, "Middle": 5.5, "Treble": 6, "Presence": 6.5, "Volume": 5.5 },
    tags: ["american", "bass", "clean", "high-gain", "lead", "mesa-family", "metal"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Metal Lead V",
    realGear: "Peavey® 5150® 100W head (Lead Channel)",
    category: "AmpliTube Lead",
    toneNotes: "The ultimate modern metal workhorse. Saturated gain, biting upper mids, and deep bottom-end resonance.",
    defaultUsage: "Modern metal chugs, melodic death metal, post-hardcore and EVH-style heavy overdrive.",
    typicalSettings: { "Gain": 6.5, "Bass": 5, "Middle": 6, "Treble": 5.5, "Bottom": 6, "Volume": 5 },
    tags: ["clean", "lead"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Bottom", min: 1, max: 10, description: "Speaker bottom-end resonance" },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Metal Lead W",
    realGear: "Randall® Warhead™",
    category: "AmpliTube Lead",
    toneNotes: "Pure metal mayhem. Heavy, biting solid state push with ultra-sharp attack and direct scoop.",
    defaultUsage: "90s Pantera/Dimebag thrash rhythms, scooped metal mayhem, and aggressive palm-mutes.",
    typicalSettings: { "Gain": 7.5, "Bass": 4.5, "Middle": 4, "Treble": 6.5, "Bottom": 6, "Volume": 5.5 },
    tags: ["lead"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Bottom", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Modern Tube Lead",
    realGear: "Mesa-Boogie® Dual Rectifier® (Lead Channel)",
    category: "AmpliTube Lead",
    toneNotes: "Benchmark modern high-gain tone. Intensely saturated, aggressive, with legendary liquid Recto voice.",
    defaultUsage: "Iconic nu-metal, post-grunge, and modern drop-tuned metal wall of sound.",
    typicalSettings: { "Gain": 7, "Bass": 4, "Middle": 5.5, "Treble": 6, "Presence": 6.5, "Volume": 5 },
    tags: ["american", "crunch", "high-gain", "lead", "mesa-family", "metal"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "Red Pig",
    realGear: "Marshall® Major™ head 200W 'Pig'",
    category: "AmpliTube Lead",
    toneNotes: "200W KT88-powered stage dragon. Ritchie Blackmore/Jimmy Page rock projection.",
    defaultUsage: "Classic 70s stadium rock, massive clean-to-crunch Marshall voice with incredible headroom.",
    typicalSettings: { "Volume 1": 6, "Volume 2": 0, "1-2 Switch": 0, "Bridge": 1, "Bass": 5, "Middle": 6, "Treble": 5, "Presence": 5 },
    tags: ["british", "classic-rock", "hard-rock", "lead", "marshall-family"],
    controls: [
      { name: "Presence", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Volume 1", min: 0, max: 10, description: "Bright input level" },
      { name: "Volume 2", min: 0, max: 10, description: "Normal input level" },
      { name: "1-2 Switch", min: 0, max: 1 },
      { name: "Bridge", min: 0, max: 1, description: "enables channel bridging for extra drive" }
    ]
  },
  {
    name: "SilverPlate 50",
    realGear: "PRS® Archon 50",
    category: "AmpliTube Lead",
    toneNotes: "Versatile boutique American model. Sparkling cleans and rapid high-gain aggression combined.",
    defaultUsage: "Boutique hard rock, modern progressive lead and crystalline dynamic platform.",
    typicalSettings: { "Volume": 7, "Master": 5, "Treble": 5.5, "Middle": 6, "Bass": 4.5, "Presence": 6, "Depth": 5, "Lead/Clean Selector": 0 },
    tags: ["clean", "lead"],
    controls: [
      { name: "Presence", min: 0, max: 10 },
      { name: "Depth", min: 0, max: 10 },
      { name: "Volume", min: 0, max: 10 },
      { name: "Master", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Lead/Clean Selector", min: 0, max: 1 }
    ]
  },
  {
    name: "SLD 100",
    realGear: "Soldano® SLO-100™ Head Model",
    category: "AmpliTube Lead",
    toneNotes: "Icon of boutique high-gain tube distortion. Pure rich harmonics, unmatched singing lead sustain.",
    defaultUsage: "80s/90s boutique hard rock, screaming solo leads and pristine crunch (Soldano style).",
    typicalSettings: { "Overdrive Preamp": 6.5, "Overdrive Master": 5, "Bass": 5, "Middle": 6.5, "Treble": 5.5, "Presence": 7, "Crunch-Clean": 1, "Overdrive-Normal": 1 },
    tags: ["american", "high-gain", "hot-rodded", "lead", "mesa-family", "metal", "soldano-family"],
    controls: [
      { name: "Bright-Normal", min: 0, max: 1 },
      { name: "Crunch-Clean", min: 0, max: 1 },
      { name: "Normal Preamp", min: 1, max: 11 },
      { name: "Overdrive Preamp", min: 1, max: 11 },
      { name: "Bass", min: 1, max: 11 },
      { name: "Middle", min: 1, max: 11 },
      { name: "Treble", min: 1, max: 11 },
      { name: "Normal Master", min: 1, max: 11 },
      { name: "Overdrive Master", min: 1, max: 11 },
      { name: "Presence", min: 1, max: 11 },
      { name: "Overdrive-Normal", min: 0, max: 1 }
    ]
  },
  {
    name: "VHandcraft 4",
    realGear: "Diezel VH4",
    category: "AmpliTube Lead",
    toneNotes: "Articulate, thick German heavy tones. Meaty and ultra-defined wall of sound.",
    defaultUsage: "Drop-tuned progressive metal, monumental modern rock chugs, and high precision palm-mutes (Tool style).",
    typicalSettings: { "Gain": 7, "Channel Volume": 5, "Treble": 5.5, "Middle": 6, "Bass": 5, "Deep": 6, "Presence": 6, "Master Volume": 4.5 },
    tags: ["diezel-family", "high-gain", "lead", "modern-metal", "tight"],
    controls: [
      { name: "Gain", min: 0, max: 10 },
      { name: "Channel Volume", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Deep", min: 0, max: 10, description: "active bass control centered at 80Hz" },
      { name: "Presence", min: 0, max: 10 },
      { name: "Master Volume", min: 0, max: 10 }
    ]
  },
  {
    name: "Vintage Metal Lead",
    realGear: "Marshall® JMP100™ head",
    category: "AmpliTube Lead",
    toneNotes: "Classic Aussie hard rock and 70s metal. Raw and biting mid-focused saturation.",
    defaultUsage: "AC/DC-style rock rhythms and vintage Marshall-fueled crunch.",
    typicalSettings: { "Gain": 6.5, "Bass": 5.5, "Middle": 6, "Treble": 6, "Presence": 6, "Volume": 5 },
    tags: ["british", "classic-rock", "hard-rock", "lead", "marshall-family"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "360Bass Preamp",
    realGear: "Acoustic® 360™ Bass Preamp",
    category: "AmpliTube Bass",
    toneNotes: "Classic solid-state rock bass. Built-in fuzz, highly definable sound.",
    defaultUsage: "Classic rock bass and psychedelic bass fuzz with low-end authority.",
    typicalSettings: { "Volume": 5, "Bass": 6, "Treble": 5, "Range": 2, "Effect": 5, "Fuzz": 0 },
    tags: ["bass"],
    controls: [
      { name: "Bright", min: 0, max: 1 },
      { name: "Volume", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Range", min: 1, max: 5 },
      { name: "Effect", min: 0, max: 10 },
      { name: "Fuzz", min: 0, max: 1 },
      { name: "Gain", min: 0, max: 10 },
      { name: "Attack", min: 0, max: 10 }
    ]
  },
  {
    name: "Green BA250",
    realGear: "Trace Elliot® AH250™ Head",
    category: "AmpliTube Bass",
    toneNotes: "Warm solid-state power, sought after preamp, famous 'Middle Cut' toggle.",
    defaultUsage: "Pulsing modern rock bass, slap bass with defined mid-scoop (Trace Elliot style).",
    typicalSettings: { "Gain": 5, "Graphic Equalization": 1, "Middle Cut Pre-Shaping": 1, "Balance": 5, "Level": 6 },
    tags: ["bass"],
    controls: [
      { name: "Graphic Equalization", min: 0, max: 1 },
      { name: "Middle Cut Pre-Shaping", min: 0, max: 1 },
      { name: "Gain", min: 0, max: 10 },
      { name: "Balance", min: 0, max: 10 },
      { name: "Level", min: 0, max: 10 }
    ]
  },
  {
    name: "New York B750",
    realGear: "Aguilar® DB750",
    category: "AmpliTube Bass",
    toneNotes: "Tube preamp + MOSFET output. Wide frequency response, perfect for low-tuned or 5/6-string basses.",
    defaultUsage: "Modern deep bass punch, massive low-end authority suitable for drop tunings.",
    typicalSettings: { "Gain": 5, "Bright": 1, "Treble": 6, "Mid": 5, "Bass": 6, "Deep": 1, "Master": 6 },
    tags: ["bass"],
    controls: [
      { name: "Gain", min: 0, max: 10 },
      { name: "Bright", min: 0, max: 1 },
      { name: "Treble", min: 0, max: 12 },
      { name: "Mid", min: 0, max: 12 },
      { name: "Bass", min: 0, max: 12 },
      { name: "Deep", min: 0, max: 1 },
      { name: "Master", min: 0, max: 10 }
    ]
  },
  {
    name: "Solid State Bass Preamp",
    realGear: "Generic solid-state bass preamp",
    category: "AmpliTube Bass",
    toneNotes: "Clean, stable solid-state bass. Cleans up beautifully and drives just as hard.",
    defaultUsage: "Clean DI foundation and consistent solid-state bass utility.",
    typicalSettings: { "Gain": 5, "Bass": 5, "Middle": 5, "Treble": 5, "Presence": 4, "Volume": 6 },
    tags: ["bass", "clean"],
    controls: [
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Middle", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Presence", min: 1, max: 10 },
      { name: "Spring Reverb", min: 1, max: 10 },
      { name: "Volume", min: 1, max: 10 }
    ]
  },
  {
    name: "SVX-500",
    realGear: "Ampeg® BA500® Model",
    category: "AmpliTube SVX",
    toneNotes: "High-quality solid-state bass amp with defined modern sonic fingerprint. Built-in limiter option.",
    defaultUsage: "Modern solid-state Ampeg bass definitions, detailed slap, and contemporary rock bass.",
    typicalSettings: { "Gain": 5.5, "Bass": 5, "Ultra Mid": 5.5, "Treble": 5, "Master": 6, "Limit": 1, "EQ On": 0 },
    tags: ["bass", "svx"],
    controls: [
      { name: "Mute", min: 0, max: 1 },
      { name: "Pad", min: 0, max: 1 },
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Ultra Mid", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Master", min: 1, max: 10 },
      { name: "Limit", min: 0, max: 1 },
      { name: "EQ On", min: 0, max: 1 }
    ]
  },
  {
    name: "SVX-15R",
    realGear: "Ampeg® B15R Portaflex “Flip Top”® Model",
    category: "AmpliTube SVX",
    toneNotes: "Vintage flip-top style tube bass. Creamy, warm, highly sought-after records favorite.",
    defaultUsage: "Old-school motown bass, vintage rock, blues and creamy tube bass compression.",
    typicalSettings: { "Gain": 5, "Bass": 6, "Mid": 5.5, "Frequency": 3, "Treble": 5, "Master": 5.5, "Ultra Hi/Lo": 1 },
    tags: ["bass", "svx"],
    controls: [
      { name: "Ultra Hi/Lo", min: 0, max: 2, description: "0: None, 1: Ultra Hi, 2: Ultra Lo" },
      { name: "Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Mid", min: 1, max: 10 },
      { name: "Frequency", min: 1, max: 5 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Master", min: 1, max: 10 }
    ]
  },
  {
    name: "SVX-CL",
    realGear: "Ampeg® SVT CLASSIC® Model",
    category: "AmpliTube SVX",
    toneNotes: "The undisputed heavyweight of rock bass. Warm, punchy, harmonically rich rock workhorse.",
    defaultUsage: "Classic rock bass, stadium growl, high gain bass drive, and legendary SVT rock tone.",
    typicalSettings: { "Gain": 5, "Bass": 6.5, "Midrange": 6, "Frequency": 3, "Treble": 5, "Master": 6 },
    tags: ["american", "bass", "high-gain", "mesa-family", "metal", "svx"],
    controls: [
      { name: "Gain", min: 0, max: 10 },
      { name: "Ultra Hi/Lo", min: 0, max: 2 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Midrange", min: 0, max: 10 },
      { name: "Frequency", min: 1, max: 5 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Master", min: 0, max: 10 }
    ]
  },
  {
    name: "SVX-PRO",
    realGear: "Ampeg® SVT-4 PRO® Model",
    category: "AmpliTube SVX",
    toneNotes: "High-end bass hybrid. Tube preamp with solid-state power. Ultra-wide sound spectrum.",
    defaultUsage: "Modern rock and metal bass with dynamic compression and extensive frequency options.",
    typicalSettings: { "Gain": 5.5, "Comp": 4.5, "Bass": 5, "Midrange": 5.5, "Frequency": 3, "Treble": 5.5, "Master": 6 },
    tags: ["bass", "svx"],
    controls: [
      { name: "Mute", min: 0, max: 1 },
      { name: "dB Pad", min: 0, max: 1 },
      { name: "Gain", min: 1, max: 10 },
      { name: "Compression", min: 0, max: 10 },
      { name: "Ultra Hi/Lo", min: 0, max: 2 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Midrange", min: 0, max: 10 },
      { name: "Frequency", min: 1, max: 5 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Limit Defeat", min: 0, max: 1 },
      { name: "Bright", min: 0, max: 1 },
      { name: "Master", min: 0, max: 10 }
    ]
  },
  {
    name: "SVX-VR",
    realGear: "Ampeg® SVT-VR® Model",
    category: "AmpliTube SVX",
    toneNotes: "Vintage reassurance of early 70s Blue-Line SVT head. Absolute raw tube rock workhorse.",
    defaultUsage: "SVT style vintage bassgrowl, 70s rock bass, and maximum warm tube saturation.",
    typicalSettings: { "Volume": 5.5, "Bass": 6, "Midrange": 6, "Treble": 5, "Freq": 2, "Ultra-Hi": 1 },
    tags: ["bass", "svx"],
    controls: [
      { name: "Combine Channel", min: 0, max: 2 },
      { name: "Normal/Bright", min: 0, max: 1 },
      { name: "Ultra-Hi", min: 0, max: 1 },
      { name: "Freq Selector", min: 1, max: 3 },
      { name: "Bass-Cut", min: 0, max: 2 },
      { name: "Volume", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Midrange", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 }
    ]
  },
  {
    name: "SVX-4B",
    realGear: "Ampeg® V-4B® Model",
    category: "AmpliTube SVX",
    toneNotes: "Reissue of the 1971 V-4B 100W all-tube legend. Creamy classic tube bass grind.",
    defaultUsage: "Grungy bass, vintage 70s/90s indie bass drive, and unmistakable tube compression.",
    typicalSettings: { "Gain": 5, "Bass": 6, "Midrange": 5.5, "Treble": 5, "Freq": 2, "Ultra Hi": 1 },
    tags: ["bass", "svx"],
    controls: [
      { name: "Ultra Lo", min: 0, max: 1 },
      { name: "Freq Switch", min: 1, max: 3 },
      { name: "Ultra Hi", min: 0, max: 1 },
      { name: "Gain", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Midrange", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Master", min: 0, max: 10 }
    ]
  },
  {
    name: "SVX-15N",
    realGear: "Ampeg® HERITAGE B-15N® Model",
    category: "AmpliTube SVX",
    toneNotes: "Flexible Baxandall EQ and cathode bias options. Features 1964 and 1966 channels.",
    defaultUsage: "Legendary studio bass, ultimate recorded vintage low-end warmth.",
    typicalSettings: { "Volume": 5, "Bass": 5.5, "Treble": 5, "Channel Select": 0, "Bias Switch": 0 },
    tags: ["bass", "svx"],
    controls: [
      { name: "Channel Select", min: 0, max: 1, description: "0: 1964 Ch, 1: 1966 Ch" },
      { name: "Bias Switch", min: 0, max: 1, description: "0: Cathode bias, 1: Fixed bias" },
      { name: "Volume", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 }
    ]
  },
  {
    name: "AmpliTube TONEX",
    realGear: "IK Multimedia TONEX amp Tone Model host",
    category: "AmpliTube TONEX",
    toneNotes: "Tone model player bringing captures of real amps into AmpliTube 5 ecosystem.",
    defaultUsage: "High precision modeling, direct album tone replications, and parallel blending.",
    typicalSettings: { "Gain": 5.5, "Bass": 5, "Mid": 5, "Treble": 5, "Presence": 5, "Depth": 5, "Mix": 100, "Volume": 6 },
    tags: ["tonex"],
    controls: [
      { name: "Post EQ", min: 0, max: 1 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Bass Freq", min: 75, max: 600 },
      { name: "Mid", min: 0, max: 10 },
      { name: "Mid Freq", min: 150, max: 5000 },
      { name: "Mid Q", min: 0.2, max: 3.0 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Treble Freq", min: 1000, max: 4000 },
      { name: "Presence", min: 0, max: 10 },
      { name: "Depth", min: 0, max: 10 },
      { name: "Mix", min: 0, max: 100 },
      { name: "Gain", min: 0, max: 10 },
      { name: "Volume", min: 0, max: 10 }
    ]
  },
  {
    name: "BM 30",
    realGear: "Brian May’s VOX® AC30™",
    category: "Brian May",
    toneNotes: "Highly customized Vox AC30. Crystal clear chiming overtones or pushed screaming treble dynamic saturation.",
    defaultUsage: "Queen-style melodic lead harmonies, chiming bright classic rock rhythm.",
    typicalSettings: { "Volume": 6, "Treble": 5, "Middle": 6, "Bass": 4.5, "Cut": 3 },
    tags: ["british", "chime", "clean", "crunch", "vox-family"],
    controls: [
      { name: "Volume", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Cut", min: 0, max: 10 }
    ]
  },
  {
    name: "BM DK",
    realGear: "the custom “Deacy” Amp with variable battery power",
    category: "Brian May",
    toneNotes: "SmallJohn Deacon designed battery combo producing direct woodwinds and brass guitar textures.",
    defaultUsage: "Niche orchestra layers, unique lo-fi fuzz lines, and vintage small box textures.",
    typicalSettings: { "Gain": 7, "Tone": 5, "Volume": 6 },
    tags: ["bass"],
    controls: [
      { name: "Gain", min: 0, max: 10 },
      { name: "Tone", min: 0, max: 10 },
      { name: "Volume", min: 0, max: 10 }
    ]
  },
  {
    name: "V3M",
    realGear: "Carvin® V3M™ Head Model",
    category: "Carvin",
    toneNotes: "Extremely versatile 50W head. Pristine clean or deep massive metal crunch.",
    defaultUsage: "Multi-genre rock/metal flexibility with extreme shaping controls.",
    typicalSettings: { "Drive": 6.5, "Volume": 5, "Presence": 6, "Bass": 5, "Mid": 5.5, "Treble": 5.5, "EQX": 1, "Intense / Thick": 1, "Master Volume": 6 },
    tags: ["bass", "clean", "crunch"],
    controls: [
      { name: "Drive", min: 0, max: 10 },
      { name: "Volume", min: 0, max: 10 },
      { name: "Presence", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Mid", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "EQX", min: 0, max: 1 },
      { name: "Intense / Thick", min: 0, max: 2 },
      { name: "Bright / Soak", min: 0, max: 2 },
      { name: "Master Volume", min: 0, max: 10 },
      { name: "Master Reverb", min: 0, max: 10 }
    ]
  },
  {
    name: "Darrell 100",
    realGear: "Randall® RG 100 ES™",
    category: "Dimebag Darrell CFH Collection",
    toneNotes: "The iconic solid state metal head used by Dimebag for Cowboys From Hell. Cutting, scooped, razor-sharp edge.",
    defaultUsage: "Cowboys From Hell metal chugs, razor scooped hard rock, and sharp solid-state gain slices.",
    typicalSettings: { "Gain": 7.5, "Master": 5, "Bass": 6, "Mid": 3.5, "Treble": 7, "Presence": 6.5, "Pull": 1, "Channel": 1 },
    tags: ["dimebag", "metal", "pantera", "solid-state"],
    controls: [
      { name: "Reverb", min: 0, max: 10 },
      { name: "Presence", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Mid", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Pull", min: 0, max: 1, description: "Clips diodes for extra chunk." },
      { name: "Master", min: 0, max: 10 },
      { name: "Gain", min: 0, max: 10 },
      { name: "Channel", min: 0, max: 1 }
    ]
  },
  {
    name: "MAZ 18 Jr.",
    realGear: "Dr. Z Amplification MAZ 18 Jr.",
    category: "Dr. Z Amplification",
    toneNotes: "EL84 touch-sensitive boutique tone. Bigger sound than 18W lets on with active Master configuration.",
    defaultUsage: "Touch-sensitive blues crunch, country bite, and organic boutique pickup projection.",
    typicalSettings: { "Volume": 5.5, "Bass": 5, "Middle": 6, "Treble": 5.5, "Cut": 4, "Master": 6 },
    tags: ["american", "high-gain", "mesa-family", "metal"],
    controls: [
      { name: "Volume", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Reverb", min: 0, max: 10 },
      { name: "Cut", min: 0, max: 10 },
      { name: "Master", min: 0, max: 10 }
    ]
  },
  {
    name: "Z Wreck",
    realGear: "Dr. Z Amplification® Z Wreck™ Head Model",
    category: "Dr. Z Amplification",
    toneNotes: "Twangs and rocks, unbelievable touch dynamics. Rolled tone control gives glassy clean without harshness.",
    defaultUsage: "Dynamic clean platform or rich twangy country breakup.",
    typicalSettings: { "Volume": 4.5, "Treble": 5, "Bass": 5, "Cut": 3 },
    tags: ["clean", "crunch"],
    controls: [
      { name: "Cut", min: 0, max: 10 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Volume", min: 0, max: 10 }
    ]
  },
  {
    name: "E650",
    realGear: "ENGL® E650™ Head Model",
    category: "Engl",
    toneNotes: "German high-gain design. Hi/Lo gain ranges, contour and bright toggles for immense mid definition.",
    defaultUsage: "German progressive thrash, ultra-tight metal chugs, and highly articulate rhythm riffing.",
    typicalSettings: { "Lead": 6.5, "Bass": 4.5, "Middle": 6, "Treble": 5.5, "Contour": 1, "Clean/Lead": 1 },
    tags: ["engl-family", "high-gain", "modern-metal", "tight"],
    controls: [
      { name: "Gain Lo/Hi", min: 0, max: 1 },
      { name: "Clean/Lead", min: 0, max: 1 },
      { name: "Clean", min: 0, max: 10 },
      { name: "Lead", min: 0, max: 10 },
      { name: "Bright", min: 0, max: 1 },
      { name: "Bass", min: 0, max: 10 },
      { name: "Middle", min: 0, max: 10 },
      { name: "Treble", min: 0, max: 10 },
      { name: "Lead Presence", min: 0, max: 10 },
      { name: "Lead Volume", min: 0, max: 10 },
      { name: "Contour", min: 0, max: 1 }
    ]
  },
  {
    name: "Powerball",
    realGear: "ENGL® Powerball™ Head Model",
    category: "Engl",
    toneNotes: "Immense modern high-gain power. Unique Open/Focused midrange voicing and multi-mode options.",
    defaultUsage: "Slamming modern extreme metal, deathcore rhythm, and focused modern high-gain wall of sound.",
    typicalSettings: { "CH II Gain": 6.5, "Bass": 4.5, "Mid-Focused": 6, "Treble": 5.5, "D.-Punch": 6, "Open/Focused": 1 },
    tags: ["clean", "crunch", "engl-family", "high-gain", "modern-metal", "tight"],
    controls: [
      { name: "CH I/II", min: 0, max: 1 },
      { name: "Open/Focused", min: 0, max: 1 },
      { name: "Gain Lo/Hi", min: 0, max: 1 },
      { name: "Presence", min: 1, max: 10 },
      { name: "D.-Punch", min: 1, max: 10 },
      { name: "Master", min: 1, max: 10 },
      { name: "CH II Gain", min: 1, max: 10 },
      { name: "Bass", min: 1, max: 10 },
      { name: "Mid-Open", min: 1, max: 10 },
      { name: "Mid-Focused", min: 1, max: 10 },
      { name: "Treble", min: 1, max: 10 }
    ]
  }
];

export function findKnownAmp(nameOrAlias: string): AmplifierDef | undefined {
  const norm = nameOrAlias.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
  
  // Direct match exact display name first
  const exact = AT5_AMPLIFIER_KNOWLEDGE.find(a => 
    a.name.toLowerCase().replace(/[^a-z0-9]+/g, "") === norm
  );
  if (exact) return exact;

  // Search in tags / aliases or real gear reference substring
  return AT5_AMPLIFIER_KNOWLEDGE.find(a => {
    const rgNorm = a.realGear.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (rgNorm.includes(norm) || norm.includes(rgNorm)) return true;
    
    const tagMatch = a.tags.some(t => t.toLowerCase().replace(/[^a-z0-9]+/g, "") === norm);
    if (tagMatch) return true;

    return false;
  });
}
