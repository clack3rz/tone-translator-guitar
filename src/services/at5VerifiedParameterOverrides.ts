// src/services/at5VerifiedParameterOverrides.ts
// Verified from known-good AT5 reference presets. This file should be preferred over
// broad/fuzzy catalogue matches whenever a gear item is known here.

export type AT5Category = "amp" | "stomp" | "rack" | "cab" | "studio" | string;

export interface VerifiedParamDef {
  friendlyName: string;
  xmlName: string;
  min: number;
  max: number;
  unit?: string;
  aliases?: string[];
  defaultValue?: number | string;
  /** Converts AI/debug-friendly values into the AT5 XML value. */
  transform?:
    | "dbThresholdToLinear"
    | "khzToHzIfNeeded"
    | "noiseGateDepth"
    | "black76InputOutput"
    | "black76Ratio";
}

export interface VerifiedGearDef {
  name: string;
  category: AT5Category;
  realId?: string;
  aliases?: string[];
  preferredSection?: string;
  params: VerifiedParamDef[];
}

export const AT5_VERIFIED_GEAR: VerifiedGearDef[] = [
  {
    name: "Brit 8000",
    category: "amp",
    realId: "8fe96936-5178-4950-9b80-d89c32534bad",
    aliases: ["jcm800", "jcm 800", "marshall jcm800", "brit 8000 jcm800 style"],
    preferredSection: "AmpA",
    params: [
      { friendlyName: "Sensitivity", xmlName: "Sensitivity_JCM800AT4", min: 0, max: 1, defaultValue: "1", aliases: ["sensitivity", "hi lo", "input"] },
      { friendlyName: "Presence", xmlName: "Presence_JCM800AT4", min: 0, max: 10, aliases: ["presence"] },
      { friendlyName: "Bass", xmlName: "Bass_JCM800AT4", min: 0, max: 10, aliases: ["bass", "low"] },
      { friendlyName: "Middle", xmlName: "Middle_JCM800AT4", min: 0, max: 10, aliases: ["middle", "mid"] },
      { friendlyName: "Treble", xmlName: "Treble_JCM800AT4", min: 0, max: 10, aliases: ["treble", "high"] },
      { friendlyName: "Master", xmlName: "Master_JCM800AT4", min: 0, max: 10, aliases: ["master", "volume", "output"] },
      { friendlyName: "Pre Amp", xmlName: "PreAmp_JCM800AT4", min: 0, max: 10, aliases: ["preamp_gain", "pre_amp", "preamp", "gain", "drive"] },
    ],
  },
  {
    name: "British Tube Lead 1",
    category: "amp",
    realId: "fb5fc82f-a926-4591-87d2-168906fd79d3",
    aliases: [
      "British Tube Lead 1",
      "British Lead S100",
      "British Lead S",
      "British Lead S (JCM800)",
      "British Lead S100 (JCM800)",
      "British Lead 100",
      "Marshall S100",
    ],
    preferredSection: "AmpA",
    params: [
      { friendlyName: "Gain", xmlName: "Gain_BritishTubeLead1", min: 0, max: 10, defaultValue: 5.3, aliases: ["gain", "preamp", "preamp_gain", "pre amp", "drive"] },
      { friendlyName: "Bass", xmlName: "Bass_BritishTubeLead1", min: 0, max: 10, defaultValue: 6.2, aliases: ["bass"] },
      { friendlyName: "Mid", xmlName: "Mid_BritishTubeLead1", min: 0, max: 10, defaultValue: 6.7, aliases: ["middle", "mid"] },
      { friendlyName: "Treble", xmlName: "Treble_BritishTubeLead1", min: 0, max: 10, defaultValue: 6.3, aliases: ["treble"] },
      { friendlyName: "Presence", xmlName: "Presence_BritishTubeLead1", min: 0, max: 10, defaultValue: 6.5, aliases: ["presence"] },
      { friendlyName: "Reverb", xmlName: "Reverb_BritishTubeLead1", min: 0, max: 10, defaultValue: 0.2, aliases: ["reverb"] },
      { friendlyName: "Volume", xmlName: "Volume_BritishTubeLead1", min: 0, max: 10, defaultValue: 5.7, aliases: ["master", "master_volume", "volume", "output"] },
    ],
  },
  {
    name: "Noise Gate",
    category: "stomp",
    realId: "0455f997-43ca-4c9b-9269-286a19d10d48",
    aliases: ["gate", "hard gate"],
    preferredSection: "StompB1",
    params: [
      { friendlyName: "Threshold", xmlName: "Threshold", min: 0.00001, max: 1, unit: "linear", aliases: ["threshold", "gate", "noise threshold"], transform: "dbThresholdToLinear" },
      { friendlyName: "Release", xmlName: "Release", min: 20, max: 1500, unit: "ms", aliases: ["release", "decay"] },
      { friendlyName: "Depth", xmlName: "Depth", min: -100, max: -20, unit: "dB", aliases: ["depth", "reduction"], transform: "noiseGateDepth" },
    ],
  },
  {
    name: "OverScream",
    category: "stomp",
    realId: "fa1de2e2-102b-4edf-b3b5-23ceaeddedf0",
    aliases: ["over scream", "tube screamer", "screamer", "overdrive boost"],
    preferredSection: "StompB1",
    params: [
      { friendlyName: "Drive", xmlName: "Drive", min: 0, max: 10, aliases: ["drive", "gain"] },
      { friendlyName: "Tone", xmlName: "Tone", min: 0, max: 10, aliases: ["tone"] },
      { friendlyName: "Level", xmlName: "Level", min: 0, max: 10, aliases: ["level", "volume", "output"] },
    ],
  },
  {
    name: "Compressor",
    category: "stomp",
    realId: "5478981b-b18a-469f-81e7-a3e228cc9d50",
    preferredSection: "StompB1",
    params: [
      { friendlyName: "Comp", xmlName: "Comp", min: 0, max: 100, aliases: ["comp", "compression", "amount", "sustain"] },
      { friendlyName: "Level", xmlName: "Level", min: 0.177828, max: 5.62341, aliases: ["level", "volume", "output"] },
    ],
  },
  {
    name: "Delay",
    category: "stomp",
    realId: "e11b1dc5-1f7d-42ad-af30-0539b3646b3c",
    preferredSection: "StompB1",
    params: [
      { friendlyName: "Delay", xmlName: "Delay", min: 62, max: 2000, unit: "ms", aliases: ["delay", "time", "delay_time"] },
      { friendlyName: "Feedback", xmlName: "Feedback", min: 0, max: 100, aliases: ["feedback", "repeats"] },
      { friendlyName: "Level", xmlName: "Level", min: 0, max: 10, aliases: ["level", "mix", "volume"] },
      { friendlyName: "BPM Sync", xmlName: "BPMSync", min: 0, max: 1, aliases: ["bpm_sync", "sync"] },
    ],
  },
  {
    name: "Parametric EQ",
    category: "rack",
    realId: "7511f3f3-cac1-476f-a1da-089556f62f58",
    preferredSection: "RackA",
    params: [
      { friendlyName: "Freq 1", xmlName: "Freq1", min: 20, max: 20000, unit: "Hz", aliases: ["freq_1", "frequency_1", "low_shelf", "low_freq"], transform: "khzToHzIfNeeded" },
      { friendlyName: "Gain 1", xmlName: "Gain1", min: -15, max: 15, unit: "dB", aliases: ["gain_1", "low_gain", "low_shelf_gain", "low_shelf"] },
      { friendlyName: "Q 1", xmlName: "Q1", min: 0.1, max: 8, aliases: ["q_1", "q1", "band_1_q"] },
      { friendlyName: "Freq 2", xmlName: "Freq2", min: 20, max: 20000, unit: "Hz", aliases: ["freq_2", "frequency_2", "high_mid", "high_mid_freq"], transform: "khzToHzIfNeeded" },
      { friendlyName: "Gain 2", xmlName: "Gain2", min: -15, max: 15, unit: "dB", aliases: ["gain_2", "high_mid_gain", "high_mid"] },
      { friendlyName: "Q 2", xmlName: "Q2", min: 0.1, max: 8, aliases: ["q_2", "q2", "band_2_q"] },
    ],
  },
  {
    name: "'63 Reverb",
    category: "stomp",
    realId: "ad9d0a70-7a59-4fef-ace5-c592764e3749",
    aliases: ["63 reverb", "spring reverb", "fender 63 reverb"],
    preferredSection: "StompB1",
    params: [
      { friendlyName: "Dwell", xmlName: "Dwell", min: 0, max: 10, aliases: ["dwell", "decay"] },
      { friendlyName: "Mixer", xmlName: "Mixer", min: 0, max: 10, aliases: ["mixer", "mix", "level"] },
      { friendlyName: "Tone", xmlName: "Tone", min: 0, max: 10, aliases: ["tone"] },
    ],
  },
  {
    name: "4x12 Closed 75 C",
    category: "cab",
    realId: "c4ea21cc-6444-4779-9eee-62d4bc085410",
    aliases: ["4x12 british 30", "v30", "v30 speakers", "4x12 v30", "british 30", "closed 75"],
    preferredSection: "CabA",
    params: [],
  },
  {
    name: "4x12 Brit 8000",
    category: "cab",
    realId: "7c0b8ce1-cbb4-4e5b-9973-a572143ddb2b",
    aliases: ["4x12 brit 8000", "brit 8000 cab", "jcm800 cab"],
    preferredSection: "CabA",
    params: [],
  },
  {
    name: "Graphic EQ",
    category: "rack",
    realId: "b66b51c2-d9a3-4909-b7e0-cd1e51636e97",
    aliases: ["10 Band Graphic", "Graphic Equalizer", "graphic_eq"],
    preferredSection: "RackA",
    params: [
      { friendlyName: "Band 20", xmlName: "Band20", min: -15, max: 15, defaultValue: 0, aliases: ["20Hz", "20 hz"] },
      { friendlyName: "Band 25", xmlName: "Band25", min: -15, max: 15, defaultValue: 0, aliases: ["25Hz", "25 hz"] },
      { friendlyName: "Band 31", xmlName: "Band31", min: -15, max: 15, defaultValue: 0, aliases: ["31Hz", "31 hz", "31.5Hz", "31.5 hz"] },
      { friendlyName: "Band 40", xmlName: "Band40", min: -15, max: 15, defaultValue: 0, aliases: ["40Hz", "40 hz"] },
      { friendlyName: "Band 50", xmlName: "Band50", min: -15, max: 15, defaultValue: 0, aliases: ["50Hz", "50 hz"] },
      { friendlyName: "Band 63", xmlName: "Band63", min: -15, max: 15, defaultValue: 0, aliases: ["63Hz", "63 hz"] },
      { friendlyName: "Band 80", xmlName: "Band80", min: -15, max: 15, defaultValue: 0, aliases: ["80Hz", "80 hz"] },
      { friendlyName: "Band 100", xmlName: "Band100", min: -15, max: 15, defaultValue: 0, aliases: ["100Hz", "100 hz"] },
      { friendlyName: "Band 125", xmlName: "Band125", min: -15, max: 15, defaultValue: 0, aliases: ["125Hz", "125 hz"] },
      { friendlyName: "Band 160", xmlName: "Band160", min: -15, max: 15, defaultValue: 0, aliases: ["160Hz", "160 hz"] },
      { friendlyName: "Band 200", xmlName: "Band200", min: -15, max: 15, defaultValue: 0, aliases: ["200Hz", "200 hz"] },
      { friendlyName: "Band 250", xmlName: "Band250", min: -15, max: 15, defaultValue: 0, aliases: ["250Hz", "250 hz"] },
      { friendlyName: "Band 315", xmlName: "Band315", min: -15, max: 15, defaultValue: 0, aliases: ["315Hz", "315 hz", "320Hz", "320 hz"] },
      { friendlyName: "Band 400", xmlName: "Band400", min: -15, max: 15, defaultValue: 0, aliases: ["400Hz", "400 hz"] },
      { friendlyName: "Band 500", xmlName: "Band500", min: -15, max: 15, defaultValue: 0, aliases: ["500Hz", "500 hz"] },
      { friendlyName: "Band 630", xmlName: "Band630", min: -15, max: 15, defaultValue: 0, aliases: ["630Hz", "630 hz"] },
      { friendlyName: "Band 800", xmlName: "Band800", min: -15, max: 15, defaultValue: 0, aliases: ["800Hz", "800 hz"] },
      { friendlyName: "Band 1000", xmlName: "Band1000", min: -15, max: 15, defaultValue: 0, aliases: ["1000Hz", "1000 hz", "1kHz", "1 khz"] },
      { friendlyName: "Band 1250", xmlName: "Band1250", min: -15, max: 15, defaultValue: 0, aliases: ["1250Hz", "1250 hz", "1.25kHz", "1.25 khz"] },
      { friendlyName: "Band 1600", xmlName: "Band1600", min: -15, max: 15, defaultValue: 0, aliases: ["1600Hz", "1600 hz", "1.6kHz", "1.6 khz"] },
      { friendlyName: "Band 2000", xmlName: "Band2000", min: -15, max: 15, defaultValue: 0, aliases: ["2000Hz", "2000 hz", "2kHz", "2 khz"] },
      { friendlyName: "Band 2500", xmlName: "Band2500", min: -15, max: 15, defaultValue: 0, aliases: ["2500Hz", "2500 hz", "2.5kHz", "2.5 khz"] },
      { friendlyName: "Band 3150", xmlName: "Band3150", min: -15, max: 15, defaultValue: 0, aliases: ["3150Hz", "3150 hz", "3.15kHz", "3.15 khz", "3.2kHz", "3.2 khz"] },
      { friendlyName: "Band 4000", xmlName: "Band4000", min: -15, max: 15, defaultValue: 0, aliases: ["4000Hz", "4000 hz", "4kHz", "4 khz"] },
      { friendlyName: "Band 5000", xmlName: "Band5000", min: -15, max: 15, defaultValue: 0, aliases: ["5000Hz", "5000 hz", "5kHz", "5 khz"] },
      { friendlyName: "Band 6300", xmlName: "Band6300", min: -15, max: 15, defaultValue: 0, aliases: ["6300Hz", "6300 hz", "6.3kHz", "6.3 khz", "6.4kHz", "6.4 khz"] },
      { friendlyName: "Band 8000", xmlName: "Band8000", min: -15, max: 15, defaultValue: 0, aliases: ["8000Hz", "8000 hz", "8kHz", "8 khz"] },
      { friendlyName: "Band 10000", xmlName: "Band10000", min: -15, max: 15, defaultValue: 0, aliases: ["10000Hz", "10000 hz", "10kHz", "10 khz"] },
      { friendlyName: "Band 12500", xmlName: "Band12500", min: -15, max: 15, defaultValue: 0, aliases: ["12500Hz", "12500 hz", "12.5kHz", "12.5 khz"] },
      { friendlyName: "Band 16000", xmlName: "Band16000", min: -15, max: 15, defaultValue: 0, aliases: ["16000Hz", "16000 hz", "16kHz", "16 khz"] },
      { friendlyName: "Band 20000", xmlName: "Band20000", min: -15, max: 15, defaultValue: 0, aliases: ["20000Hz", "20000 hz", "20kHz", "20 khz"] },
      { friendlyName: "Out Level", xmlName: "OutLevel", min: -15, max: 15, defaultValue: 0 },
      { friendlyName: "Mode", xmlName: "Mode_GraphicEQ", min: 0, max: 2, defaultValue: "Low", aliases: ["eq_mode"] },
    ],
  },
  {
    name: "Black 76",
    category: "rack",
    realId: "aecfbde7-4f23-44ca-9f58-b0a110f0ea7a",
    aliases: [
      "Black 76",
      "76 Compressor",
      "FET Compressor",
      "FET Limiter",
      "Black 76 FET Limiter",
    ],
    preferredSection: "RackA",
    params: [
      { friendlyName: "Input", xmlName: "Input", min: 0.0000112202, max: 1, defaultValue: 0.0251189, aliases: ["gain", "input"], transform: "black76InputOutput" },
      { friendlyName: "Ratio", xmlName: "Ratio", min: 0, max: 4, defaultValue: 0, aliases: ["ratio"], transform: "black76Ratio" },
      { friendlyName: "Attack", xmlName: "Attack", min: 1, max: 7, defaultValue: 4.78 },
      { friendlyName: "Release", xmlName: "Release", min: 1, max: 7, defaultValue: 6.24 },
      { friendlyName: "Output", xmlName: "Output", min: 0.0000112202, max: 1, defaultValue: 0.251189, aliases: ["output", "volume", "level"], transform: "black76InputOutput" },
    ],
  },
  {
    name: "Fender Compressor",
    category: "rack",
    realId: "7307c816-856f-438b-a381-45edf43bee0b",
    preferredSection: "RackA",
    params: [
      { friendlyName: "Switch", xmlName: "Switch", min: 0, max: 3, aliases: ["mode", "intensity"] },
      { friendlyName: "Out Level", xmlName: "OutLevel", min: 0.177828, max: 5.62341, aliases: ["volume"] },
      { friendlyName: "Volume", xmlName: "Volume", min: 0, max: 1 },
    ],
  },
  {
    name: "Tube Compressor",
    category: "rack",
    realId: "d0211742-18e6-4fdb-9efa-3d72e4ae515b",
    preferredSection: "RackA",
    params: [
      { friendlyName: "Drive", xmlName: "Drive", min: 0.177828, max: 5.62341 },
      { friendlyName: "Attack", xmlName: "Attack", min: 12, max: 80 },
      { friendlyName: "Release", xmlName: "Release", min: 50, max: 1400 },
      { friendlyName: "Ratio", xmlName: "Ratio", min: 1.5, max: 4.5 },
      { friendlyName: "Out Level", xmlName: "OutLevel", min: 0.177828, max: 5.62341 },
    ],
  },
];
