
export interface KnobDefinition {
  name: string;
  min: number;
  max: number;
  unit: string;
}

export interface GearItem {
  id: string;
  category: string;
  name: string;
  knobs?: (string | KnobDefinition)[];
  realId?: string;
  paramSuffix?: string;
}

export const AMP_MANIFEST: GearItem[] = [
  { id: "amp_57_bandmaster", category: "amp", name: "'57 Bandmaster" },
  { id: "amp_57_champ", category: "amp", name: "'57 Champ" },
  { id: "amp_65_princeton", category: "amp", name: "'65 Princeton" },
  { id: "amp_57_custom_champ", category: "amp", name: "'57 Custom Champ" },
  { id: "amp_57_custom_deluxe", category: "amp", name: "'57 Custom Deluxe" },
  { id: "amp_57_custom_pro_amp", category: "amp", name: "'57 Custom Pro-Amp" },
  { 
    id: "amp_57_custom_twin_amp", 
    category: "amp", 
    name: "'57 Custom Twin-Amp",
    knobs: [
      { name: "Volume", min: 0, max: 12, unit: "" },
      { name: "Treble", min: 0, max: 12, unit: "" },
      { name: "Middle", min: 0, max: 12, unit: "" },
      { name: "Bass", min: 0, max: 12, unit: "" },
      { name: "Presence", min: 0, max: 12, unit: "" }
    ]
  },
  { id: "amp_65_super_reverb", category: "amp", name: "'65 Super Reverb" },
  { id: "amp_53_bassman", category: "amp", name: "'53 Bassman" },
  { id: "amp_57_deluxe", category: "amp", name: "'57 Deluxe" },
  { id: "amp_59_bassman", category: "amp", name: "'59 Bassman" },
  { id: "amp_64_vibroverb_custom", category: "amp", name: "'64 Vibroverb Custom" },
  { id: "amp_65_deluxe_reverb", category: "amp", name: "'65 Deluxe Reverb" },
  { id: "amp_65_twin_reverb", category: "amp", name: "'65 Twin Reverb" },
  { id: "amp_122", category: "amp", name: "122" },
  { id: "amp_122a", category: "amp", name: "122A" },
  { id: "amp_147", category: "amp", name: "147" },
  { id: "amp_3300w", category: "amp", name: "3300W" },
  { id: "amp_360bass_preamp", category: "amp", name: "360Bass Preamp" },
  { id: "amp_ad_200", category: "amp", name: "AD 200" },
  { 
    id: "amp_ad_30", 
    category: "amp", 
    name: "AD 30",
    knobs: [
      { name: "Gain 1", min: 0, max: 10, unit: "" },
      { name: "Bass 1", min: 0, max: 10, unit: "" },
      { name: "Middle 1", min: 0, max: 10, unit: "" },
      { name: "Treble 1", min: 0, max: 10, unit: "" },
      { name: "Master 1", min: 0, max: 10, unit: "" },
      { name: "Gain 2", min: 0, max: 10, unit: "" },
      { name: "Bass 2", min: 0, max: 10, unit: "" },
      { name: "Middle 2", min: 0, max: 10, unit: "" },
      { name: "Treble 2", min: 0, max: 10, unit: "" },
      { name: "Master 2", min: 0, max: 10, unit: "" }
    ]
  },
  { 
    id: "amp_afd_100", 
    category: "amp", 
    name: "AFD 100",
    knobs: [
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Master", min: 0, max: 10, unit: "" },
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "AFD/34 Mode", min: 0, max: 1, unit: "" }
    ]
  },
  { id: "amp_american_clean_mkiii", category: "amp", name: "American Clean MKIII" },
  { id: "amp_american_lead_mkiii", category: "amp", name: "American Lead MKIII" },
  { id: "amp_american_tube_clean_1", category: "amp", name: "American Tube Clean 1" },
  { id: "amp_american_tube_clean_2", category: "amp", name: "American Tube Clean 2" },
  { id: "amp_american_tube_vintage", category: "amp", name: "American Tube Vintage" },
  { id: "amp_american_vintage_b", category: "amp", name: "American Vintage B" },
  { id: "amp_american_vintage_d", category: "amp", name: "American Vintage D" },
  { id: "amp_american_vintage_t", category: "amp", name: "American Vintage T" },
  { id: "amp_bassman_300", category: "amp", name: "Bassman 300" },
  { 
    id: "amp_bm_30", 
    category: "amp", 
    name: "BM 30",
    knobs: [
      { name: "Volume", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Cut", min: 0, max: 10, unit: "" }
    ]
  },
  { 
    id: "amp_bm_dk", 
    category: "amp", 
    name: "BM DK",
    knobs: [
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Tone", min: 0, max: 10, unit: "" },
      { name: "Volume", min: 0, max: 10, unit: "" }
    ]
  },
  { id: "amp_boston_100", category: "amp", name: "Boston 100" },
  { 
    id: "amp_brit_8000", 
    category: "amp", 
    name: "Brit 8000", 
    realId: "8fe96936-5178-4950-9b80-d89c32534bad",
    paramSuffix: "_JCM800AT4",
    knobs: [
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Master", min: 0, max: 10, unit: "" },
      { name: "Pre Amp", min: 0, max: 10, unit: "" }
    ] 
  },
  { id: "amp_brit_9000", category: "amp", name: "Brit 9000" },
  { id: "amp_brit_silver", category: "amp", name: "Brit Silver" },
  { id: "amp_brit_valve_pre", category: "amp", name: "Brit Valve Pre" },
  { id: "amp_british_blue_tube_30tb", category: "amp", name: "British Blue Tube 30TB" },
  { id: "amp_british_copper_tube_30tb", category: "amp", name: "British Copper Tube 30TB" },
  { id: "amp_british_lead_s100", category: "amp", name: "British Lead S100" },
  { 
    id: "amp_british_tube_lead_1", 
    category: "amp", 
    name: "British Tube Lead 1",
    realId: "fb5fc82f-a926-4591-87d2-168906fd79d3",
    paramSuffix: "_BritishTubeLead1"
  },
  { id: "amp_british_tube_lead_2", category: "amp", name: "British Tube Lead 2" },
  { id: "amp_california_tweed", category: "amp", name: "California Tweed" },
  { id: "amp_champion_600", category: "amp", name: "Champion 600" },
  { id: "amp_custom_modern_hi_gain", category: "amp", name: "Custom Modern Hi-Gain" },
  { id: "amp_custom_solid_state_clean", category: "amp", name: "Custom Solid State Clean" },
  { id: "amp_custom_solid_state_fuzz", category: "amp", name: "Custom Solid State Fuzz" },
  { id: "amp_custom_solid_state_lead", category: "amp", name: "Custom Solid State Lead" },
  { 
    id: "amp_darrell_100", 
    category: "amp", 
    name: "Darrell 100",
    knobs: [
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Master", min: 0, max: 10, unit: "" },
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Resonance", min: 0, max: 10, unit: "" }
    ]
  },
  { 
    id: "amp_dual_rectifier", 
    category: "amp", 
    name: "MESA Dual Rectifier",
    knobs: [
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Master", min: 0, max: 10, unit: "" },
      { name: "Gain", min: 0, max: 10, unit: "" }
    ]
  },
  { 
    id: "amp_triple_rectifier", 
    category: "amp", 
    name: "MESA Triple Rectifier",
    knobs: [
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Master", min: 0, max: 10, unit: "" },
      { name: "Gain", min: 0, max: 10, unit: "" }
    ]
  },
  { 
    id: "amp_dual_terror", 
    category: "amp", 
    name: "Orange Dual Terror",
    knobs: [
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Tone", min: 0, max: 10, unit: "" },
      { name: "Volume", min: 0, max: 10, unit: "" }
    ]
  },
  { id: "amp_e650", category: "amp", name: "E650" },
  { id: "amp_g37_studio12", category: "amp", name: "G37/Studio12" },
  { id: "amp_german_34", category: "amp", name: "German 34" },
  { id: "amp_green_ba250", category: "amp", name: "Green BA250" },
  { id: "amp_hiamps", category: "amp", name: "HiAmp" },
  { 
    id: "amp_jazz_amp_120", 
    category: "amp", 
    name: "Jazz Amp 120",
    realId: "ac08939a-32bf-496c-96ac-5d6c530abf14",
    paramSuffix: "_JC120AT4",
    knobs: [
      { name: "Bright", min: 0, max: 1, unit: "" },
      { name: "Volume", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Distortion", min: 0, max: 10, unit: "" },
      { name: "Reverb", min: 0, max: 10, unit: "" },
      { name: "Vibrato/Chorus", min: 0, max: 2, unit: "" }
    ]
  },
  { id: "amp_jazz_amp_120_cfh", category: "amp", name: "Jazz Amp 120 CFH" },
  { id: "amp_jca100h", category: "amp", name: "JCA100H" },
  { id: "amp_jca20h", category: "amp", name: "JCA20H" },
  { 
    id: "amp_jcm_slash", 
    category: "amp", 
    name: "JCM Slash",
    knobs: [
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Master", min: 0, max: 10, unit: "" },
      { name: "Gain", min: 0, max: 10, unit: "" }
    ]
  },
  { id: "amp_jh_1200", category: "amp", name: "JH 1200" },
  { id: "amp_jh_gold", category: "amp", name: "JH Gold" },
  { id: "amp_mark_iic_plus", category: "amp", name: "Mark IIC+" },
  { 
    id: "amp_mark_iii", 
    category: "amp", 
    name: "MESA Mark III",
    knobs: [
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Fat", min: 0, max: 1, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Master", min: 0, max: 10, unit: "" },
      { name: "Lead Drive", min: 0, max: 10, unit: "" }
    ]
  },
  { 
    id: "amp_mark_iv", 
    category: "amp", 
    name: "MESA Mark IV",
    knobs: [
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Lead Master", min: 0, max: 10, unit: "" }
    ]
  },
  { id: "amp_mark_v", category: "amp", name: "Mark V" },
  { id: "amp_maz_18_jr", category: "amp", name: "MAZ 18 Jr." },
  { id: "amp_mb_150_s", category: "amp", name: "MB 150 S" },
  { id: "amp_metal_clean_t", category: "amp", name: "Metal Clean T" },
  { id: "amp_metal_lead_t", category: "amp", name: "Metal Lead T" },
  { id: "amp_metal_lead_v", category: "amp", name: "Metal Lead V" },
  { id: "amp_metal_lead_w", category: "amp", name: "Metal Lead W" },
  { id: "amp_mh_500_metalhead", category: "amp", name: "MH-500 Metalhead" },
  { id: "amp_miniplex_20", category: "amp", name: "MiniPlex 20" },
  { id: "amp_modern_tube_lead", category: "amp", name: "Modern Tube Lead" },
  { id: "amp_new_york_b750", category: "amp", name: "New York B750" },
  { id: "amp_or_50", category: "amp", name: "OR 50" },
  { id: "amp_or_120", category: "amp", name: "OR-120" },
  { id: "amp_powerball", category: "amp", name: "Powerball" },
  { id: "amp_pro_junior", category: "amp", name: "Pro Junior" },
  { id: "amp_red_pig", category: "amp", name: "Red Pig" },
  { 
    id: "amp_rockerverb_50", 
    category: "amp", 
    name: "Orange Rockerverb 50",
    knobs: [
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Volume", min: 0, max: 10, unit: "" }
    ]
  },
  { 
    id: "amp_sld_100", 
    category: "amp", 
    name: "Soldano SLO-100",
    knobs: [
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Master", min: 0, max: 10, unit: "" },
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Depth", min: 0, max: 10, unit: "" }
    ]
  },
  { 
    id: "amp_satch_vm", 
    category: "amp", 
    name: "Satch VM",
    knobs: [
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Volume", min: 0, max: 10, unit: "" },
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Resonance", min: 0, max: 10, unit: "" }
    ]
  },
  { id: "amp_silverplate_50", category: "amp", name: "SilverPlate 50" },
  { id: "amp_silvertwelve", category: "amp", name: "SilverTwelve" },
  { id: "amp_sj50", category: "amp", name: "SJ50" },
  { 
    id: "amp_sld_100", 
    category: "amp", 
    name: "SLD 100",
    knobs: [
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Master", min: 0, max: 10, unit: "" },
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Depth", min: 0, max: 10, unit: "" }
    ]
  },
  { id: "amp_solid_state_bass_preamp", category: "amp", name: "Solid State Bass Preamp" },
  { id: "amp_super_sonic", category: "amp", name: "Super-Sonic" },
  { id: "amp_svx_15n", category: "amp", name: "SVX-15N" },
  { id: "amp_svx_15r", category: "amp", name: "SVX-15R" },
  { id: "amp_svx_4b", category: "amp", name: "SVX-4B" },
  { id: "amp_svx_500", category: "amp", name: "SVX-500" },
  { 
    id: "amp_svx_cl", 
    category: "amp", 
    name: "SVX-CL",
    knobs: [
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Mid", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Master", min: 0, max: 10, unit: "" }
    ]
  },
  { id: "amp_svx_pro", category: "amp", name: "SVX-PRO" },
  { id: "amp_svx_vr", category: "amp", name: "SVX-VR" },
  { id: "amp_tbp_1", category: "amp", name: "TBP-1" },
  { id: "amp_thd_bi_valve", category: "amp", name: "THD Bi-Valve" },
  { id: "amp_thunderverb_200", category: "amp", name: "Thunderverb 200" },
  { id: "amp_tiny_terror", category: "amp", name: "Tiny Terror" },
  { id: "amp_transatlantic_ta_30", category: "amp", name: "TransAtlantic TA-30" },
  { id: "amp_triple_crown", category: "amp", name: "Triple Crown" },
  { 
    id: "amp_triple_rectifier", 
    category: "amp", 
    name: "Triple Rectifier",
    knobs: [
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Middle", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Output", min: 0, max: 10, unit: "" },
      { name: "Gain", min: 0, max: 10, unit: "" }
    ]
  },
  { id: "amp_tube_vintage_combo", category: "amp", name: "Tube Vintage Combo" },
  { id: "amp_v3m", category: "amp", name: "V3M" },
  { id: "amp_vhandcraft_4", category: "amp", name: "VHandcraft 4" },
  { id: "amp_vibro_king", category: "amp", name: "Vibro-King" },
  { id: "amp_vintage_metal_lead", category: "amp", name: "Vintage Metal Lead" },
  { id: "amp_z_wreck", category: "amp", name: "Z Wreck" }
];

export const STOMP_MANIFEST: GearItem[] = [
  { id: "stomp_10_band_graphic", category: "stomp", name: "10 Band Graphic" },
  { id: "stomp_6_band_eq", category: "stomp", name: "6 Band EQ" },
  { id: "stomp_7_band_graphic", category: "stomp", name: "7 Band Graphic" },
  { id: "stomp_acoustic_sim", category: "stomp", name: "Acoustic Sim" },
  { id: "stomp_ampless", category: "stomp", name: "Ampless" },
  { id: "stomp_analog_chorus", category: "stomp", name: "Analog Chorus" },
  { id: "stomp_analog_delay", category: "stomp", name: "Analog Delay" },
  { id: "stomp_analog_flanger", category: "stomp", name: "Analog Flanger" },
  { id: "stomp_bass_wah", category: "stomp", name: "Bass Wah" },
  { id: "stomp_big_pig", category: "stomp", name: "Big Pig" },
  { id: "stomp_booster", category: "stomp", name: "Booster" },
  { id: "stomp_chorus", category: "stomp", name: "Chorus" },
  { id: "stomp_chorus_1", category: "stomp", name: "Chorus-1" },
  { id: "stomp_class_fuzz", category: "stomp", name: "Class Fuzz" },
  { id: "stomp_compressor", category: "stomp", name: "Compressor" },
  { id: "stomp_contour_wah", category: "stomp", name: "Contour Wah" },
  { id: "stomp_crusher", category: "stomp", name: "Crusher" },
  { id: "stomp_dcomp", category: "stomp", name: "Dcomp" },
  { id: "stomp_delay", category: "stomp", name: "Delay" },
  { 
    id: "stomp_dime_noise_gate", 
    category: "stomp", 
    name: "Dime Noise Gate",
    knobs: [
      { name: "Threshold", min: -80, max: 0, unit: "dB" },
      { name: "Release", min: 10, max: 500, unit: "ms" }
    ]
  },
  { 
    id: "stomp_dime_wah", 
    category: "stomp", 
    name: "Dime Wah",
    knobs: [
      { name: "Wah", min: 0, max: 100, unit: "%" },
      { name: "Range", min: 0, max: 5, unit: "" }
    ]
  },
  { id: "stomp_diode_overdrive", category: "stomp", name: "Diode Overdrive" },
  { 
    id: "stomp_distortion", 
    category: "stomp", 
    name: "Distortion",
    realId: "33671239-012b-4221-a3f2-870020188981",
    knobs: [
      { name: "Distortion", min: 0, max: 10, unit: "" },
      { name: "Filter", min: 0, max: 10, unit: "" },
      { name: "Volume", min: 0, max: 10, unit: "" }
    ]
  },
  { id: "stomp_echoman", category: "stomp", name: "EchoMan" },
  { id: "stomp_electric_flanger", category: "stomp", name: "Electric Flanger" },
  { id: "stomp_envelope_filter_1", category: "stomp", name: "Envelope Filter" },
  { id: "stomp_ep_tape_echo", category: "stomp", name: "EP Tape Echo" },
  { id: "stomp_feedback", category: "stomp", name: "Feedback" },
  { id: "stomp_fender_63_reverb", category: "stomp", name: "Fender® ’63 Reverb" },
  { id: "stomp_fender_blender", category: "stomp", name: "Fender® Blender" },
  { id: "stomp_fender_compressor", category: "stomp", name: "Fender® Compressor" },
  { id: "stomp_fender_fuzz_wah", category: "stomp", name: "Fender® Fuzz Wah" },
  { id: "stomp_fender_phaser", category: "stomp", name: "Fender® Phaser" },
  { id: "stomp_fender_tape_echo", category: "stomp", name: "Fender® Tape Echo" },
  { id: "stomp_fender_tremolo", category: "stomp", name: "Fender® Tremolo" },
  { id: "stomp_fender_volume", category: "stomp", name: "Fender® Volume" },
  { id: "stomp_fender_wah", category: "stomp", name: "Fender® Wah" },
  { id: "stomp_flanger", category: "stomp", name: "Flanger" },
  { id: "stomp_flanger_doubler", category: "stomp", name: "Flanger Doubler" },
  { id: "stomp_fox_phaser", category: "stomp", name: "FOX Phaser" },
  { id: "stomp_fuzz_age", category: "stomp", name: "Fuzz Age" },
  { id: "stomp_fuzz_age_2", category: "stomp", name: "Fuzz Age 2" },
  { id: "stomp_fuzzone", category: "stomp", name: "FuzzOne" },
  { id: "stomp_gate", category: "stomp", name: "Gate" },
  { id: "stomp_harmonator", category: "stomp", name: "Harmonator" },
  { id: "stomp_lfo_filter", category: "stomp", name: "LFO Filter" },
  { id: "stomp_may_wah", category: "stomp", name: "May Wah" },
  { id: "stomp_metal_distortion", category: "stomp", name: "Metal Distortion" },
  { id: "stomp_metal_distortion_2", category: "stomp", name: "Metal Distortion 2" },
  { id: "stomp_metal_flanger", category: "stomp", name: "Metal Flanger" },
  { id: "stomp_nirvana", category: "stomp", name: "Nirvana" },
  { 
    id: "stomp_noise_gate", 
    category: "stomp", 
    name: "Noise Gate", 
    realId: "0455f997-43ca-4c9b-9269-286a19d10d48",
    knobs: [
      { name: "Threshold", min: -100, max: 0, unit: "dB" },
      { name: "Release", min: 20, max: 1500, unit: "ms" },
      { name: "Depth", min: -100, max: -20, unit: "dB" }
    ] 
  },
  { id: "stomp_nu_tron_iii", category: "stomp", name: "Nu-Tron III" },
  { id: "stomp_ocd", category: "stomp", name: "OCD" },
  { id: "stomp_octa_v", category: "stomp", name: "Octa-V" },
  { id: "stomp_octav", category: "stomp", name: "Octav" },
  { id: "stomp_octoblue", category: "stomp", name: "OctoBlue" },
  { id: "stomp_opto_tremolo", category: "stomp", name: "Opto Tremolo" },
  { id: "stomp_overdrive", category: "stomp", name: "Overdrive" },
  { 
    id: "stomp_overscream", 
    category: "stomp", 
    name: "OverScream", 
    realId: "fa1de2e2-102b-4edf-b3b5-23ceaeddedf0",
    knobs: [
      { name: "Drive", min: 0, max: 10, unit: "" },
      { name: "Tone", min: 0, max: 10, unit: "" },
      { name: "Level", min: 0, max: 10, unit: "" }
    ] 
  },
  { 
    id: "stomp_parametric_eq", 
    category: "stomp", 
    name: "Parametric EQ",
    knobs: [
      { name: "Band 1 Frequency", min: 20, max: 20000, unit: "Hz" },
      { name: "Band 1 Q", min: 0.1, max: 8.0, unit: "" },
      { name: "Band 1 Gain", min: -15.0, max: 15.0, unit: "dB" },
      { name: "Band 2 Frequency", min: 20, max: 20000, unit: "Hz" },
      { name: "Band 2 Q", min: 0.1, max: 8.0, unit: "" },
      { name: "Band 2 Gain", min: -15.0, max: 15.0, unit: "dB" }
    ]
  },
  { id: "stomp_phaze_nine", category: "stomp", name: "Phaze Nine" },
  { id: "stomp_phazer_10", category: "stomp", name: "Phazer 10" },
  { id: "stomp_pinnacle_deluxe", category: "stomp", name: "Pinnacle Deluxe" },
  { id: "stomp_pitch_shifter", category: "stomp", name: "Pitch Shifter" },
  { id: "stomp_power_grid", category: "stomp", name: "Power Grid" },
  { id: "stomp_pre_eq_3", category: "stomp", name: "Pre EQ 3" },
  { id: "stomp_prodrive", category: "stomp", name: "PROdrive" },
  { id: "stomp_red_special", category: "stomp", name: "Red Special" },
  { id: "stomp_rezo", category: "stomp", name: "Rezo" },
  { id: "stomp_right_fuzz", category: "stomp", name: "Right Fuzz" },
  { id: "stomp_satch_distortion", category: "stomp", name: "Satch Distortion" },
  { id: "stomp_satch_octave", category: "stomp", name: "Satch Octave" },
  { id: "stomp_satch_overdrive", category: "stomp", name: "Satch Overdrive" },
  { id: "stomp_satch_wah", category: "stomp", name: "Satch Wah" },
  { id: "stomp_seek_trem", category: "stomp", name: "Seek Trem" },
  { id: "stomp_seek_wah", category: "stomp", name: "Seek Wah" },
  { id: "stomp_small_phazer", category: "stomp", name: "Small Phazer" },
  { id: "stomp_shape_shifter", category: "stomp", name: "Shape Shifter" },
  { id: "stomp_sste_solid_state_tape_echo", category: "stomp", name: "SSTE - Solid State Tape Echo" },
  { id: "stomp_star_gate", category: "stomp", name: "Star Gate" },
  { id: "stomp_step_filter", category: "stomp", name: "Step Filter" },
  { id: "stomp_step_slicer", category: "stomp", name: "Step Slicer" },
  { id: "stomp_svx_compressor", category: "stomp", name: "SVX Compressor" },
  { id: "stomp_svx_oct", category: "stomp", name: "SVX-OCT" },
  { id: "stomp_svx_od", category: "stomp", name: "SVX-OD" },
  { id: "stomp_svx_volume", category: "stomp", name: "SVX Volume" },
  { id: "stomp_swell", category: "stomp", name: "Swell" },
  { id: "stomp_t_rex_moller", category: "stomp", name: "T-Rex Moller" },
  { id: "stomp_t_rex_mudhoney", category: "stomp", name: "T-Rex Mudhoney" },
  { id: "stomp_t_rex_replica", category: "stomp", name: "T-Rex Replica" },
  { id: "stomp_tap_delay", category: "stomp", name: "Tap Delay" },
  { id: "stomp_the_ambassador", category: "stomp", name: "The Ambass’dor" },
  { id: "stomp_treble_booster", category: "stomp", name: "Treble Booster" },
  { id: "stomp_tube_overdrive", category: "stomp", name: "Tube Overdrive" },
  { id: "stomp_uni_v", category: "stomp", name: "Uni-V" },
  { id: "stomp_varidiode_plus", category: "stomp", name: "VariDiode+" },
  { id: "stomp_volume", category: "stomp", name: "Volume" },
  { id: "stomp_wah", category: "stomp", name: "Wah" },
  { id: "stomp_wah_10", category: "stomp", name: "Wah 10" },
  { id: "stomp_wah_46", category: "stomp", name: "Wah 46" },
  { id: "stomp_wah_47", category: "stomp", name: "Wah 47" },
  { id: "stomp_wahdist", category: "stomp", name: "WahDist" },
  { id: "stomp_wharmonator", category: "stomp", name: "Wharmonator" },
  { id: "stomp_x_chorus", category: "stomp", name: "X-Chorus" },
  { id: "stomp_xs_fuzz", category: "stomp", name: "XS Fuzz" },
  { id: "stomp_x_drive", category: "stomp", name: "X-DRIVE" },
  { id: "stomp_x_time", category: "stomp", name: "X-TIME" },
  { id: "stomp_x_space", category: "stomp", name: "X-SPACE" },
  { id: "stomp_x_vibe", category: "stomp", name: "X-VIBE" }
];

export const CAB_MANIFEST: GearItem[] = [
  { id: "cab_1x10_65_princeton", category: "cab", name: "1x10 '65 Princeton" },
  { id: "cab_1x12_65_deluxe_reverb", category: "cab", name: "1x12 '65 Deluxe Reverb" },
  { id: "cab_2x12_65_twin_reverb", category: "cab", name: "2x12 '65 Twin Reverb" },
  { id: "cab_4x10_59_bassman", category: "cab", name: "4x10 '59 Bassman" },
  { id: "cab_4x12_1960av_sl", category: "cab", name: "4x12 1960AV SL" },
  { 
    id: "cab_4x12_brit_8000", 
    category: "cab", 
    name: "4x12 Brit 8000",
    realId: "7c0b8ce1-cbb4-4e5b-9973-a572143ddb2b",
    knobs: [
      { name: "Mic 1 Model", min: 0, max: 0, unit: "" }, // Selection
      { name: "Mic 1 Vol", min: -201, max: 6, unit: "dB" },
      { name: "Mic 1 Pan", min: -100, max: 100, unit: "%" },
      { name: "Mic 1 X", min: 0.085, max: 0.65, unit: "" },
      { name: "Mic 1 Y", min: 0.085, max: 0.65, unit: "" },
      { name: "Mic 1 Distance", min: 0, max: 1, unit: "" },
      { name: "Mic 1 Speaker", min: 1, max: 4, unit: "" },
      { name: "Mic 1 Mute", min: 0, max: 1, unit: "" },
      { name: "Mic 1 Solo", min: 0, max: 1, unit: "" },
      { name: "Mic 1 Phase", min: 0, max: 1, unit: "" },
      { name: "Mic 2 Model", min: 0, max: 0, unit: "" }, // Selection
      { name: "Mic 2 Vol", min: -201, max: 6, unit: "dB" },
      { name: "Mic 2 Pan", min: -100, max: 100, unit: "%" },
      { name: "Mic 2 X", min: 0.085, max: 0.65, unit: "" },
      { name: "Mic 2 Y", min: 0.085, max: 0.65, unit: "" },
      { name: "Mic 2 Distance", min: 0, max: 1, unit: "" },
      { name: "Mic 2 Speaker", min: 1, max: 4, unit: "" },
      { name: "Mic 2 Mute", min: 0, max: 1, unit: "" },
      { name: "Mic 2 Solo", min: 0, max: 1, unit: "" },
      { name: "Mic 2 Phase", min: 0, max: 1, unit: "" },
      { name: "Cabinet Size", min: 0.8, max: 1.2, unit: "x" },
      { name: "Speakers", min: 0, max: 0, unit: "" } // Selection
    ]
  },
  { 
    id: "cab_custom_ir", 
    category: "cab", 
    name: "Custom IR Loader",
    knobs: [
      { name: "IR Slot 1", min: 0, max: 1, unit: "" },
      { name: "IR Slot 2", min: 0, max: 1, unit: "" },
      { name: "Mix", min: 0, max: 100, unit: "%" },
      { name: "HPF", min: 20, max: 1000, unit: "Hz" },
      { name: "LPF", min: 1, max: 20, unit: "kHz" }
    ]
  },
  { id: "cab_4x12_closed_vintage", category: "cab", name: "4x12 Closed Vintage" }
];

export const ROOM_MANIFEST: GearItem[] = [
  { 
    id: "room_amp_closet", 
    category: "room", 
    name: "Amp Closet",
    knobs: [
      { name: "Room Mic", min: 0, max: 0, unit: "" },
      { name: "Volume", min: -201, max: 6, unit: "dB" },
      { name: "Width", min: 0, max: 100, unit: "%" }
    ]
  },
  { 
    id: "room_bathroom", 
    category: "room", 
    name: "Bathroom",
    knobs: [
      { name: "Room Mic", min: 0, max: 0, unit: "" },
      { name: "Volume", min: -201, max: 6, unit: "dB" },
      { name: "Width", min: 0, max: 100, unit: "%" }
    ]
  },
  { 
    id: "room_garage", 
    category: "room", 
    name: "Garage",
    knobs: [
      { name: "Room Mic", min: 0, max: 0, unit: "" },
      { name: "Volume", min: -201, max: 6, unit: "dB" },
      { name: "Width", min: 0, max: 100, unit: "%" }
    ]
  },
  { 
    id: "room_hall", 
    category: "room", 
    name: "Hall",
    knobs: [
      { name: "Room Mic", min: 0, max: 0, unit: "" },
      { name: "Volume", min: -201, max: 6, unit: "dB" },
      { name: "Width", min: 0, max: 100, unit: "%" }
    ]
  },
  { 
    id: "room_large_studio", 
    category: "room", 
    name: "Large Studio",
    knobs: [
      { name: "Room Mic", min: 0, max: 0, unit: "" },
      { name: "Volume", min: -201, max: 6, unit: "dB" },
      { name: "Width", min: 0, max: 100, unit: "%" }
    ]
  },
  { 
    id: "room_mid_studio", 
    category: "room", 
    name: "Mid Studio",
    knobs: [
      { name: "Room Mic", min: 0, max: 0, unit: "" },
      { name: "Volume", min: -201, max: 6, unit: "dB" },
      { name: "Width", min: 0, max: 100, unit: "%" }
    ]
  },
  { 
    id: "room_small_studio", 
    category: "room", 
    name: "Small Studio",
    knobs: [
      { name: "Room Mic", min: 0, max: 0, unit: "" },
      { name: "Volume", min: -201, max: 6, unit: "dB" },
      { name: "Width", min: 0, max: 100, unit: "%" }
    ]
  }
];

export const RACK_MANIFEST: GearItem[] = [
  {
    id: "rack_white_2a",
    category: "rack",
    name: "White 2A (Levelling Amp)",
    knobs: [
      { name: "Gain", min: 0, max: 100, unit: "" },
      { name: "Peak Reduction", min: 0, max: 100, unit: "" }
    ]
  },
  {
    id: "rack_black_76",
    category: "rack",
    name: "Black 76 (FET Limiter)",
    realId: "e5a6190f-9031-4a30-8041-36ba95f9a2e1",
    knobs: [
      { name: "Input", min: 0, max: 100, unit: "" },
      { name: "Output", min: 0, max: 100, unit: "" },
      { name: "Attack", min: 0.02, max: 0.8, unit: "ms" },
      { name: "Release", min: 50, max: 1100, unit: "ms" },
      { name: "Ratio", min: 4, max: 20, unit: "" }
    ]
  },
  {
    id: "rack_vintage_eq_1a",
    category: "rack",
    name: "Vintage EQ-1A (Tube EQ)",
    realId: "7511f3f3-cac1-476f-a1da-089556f62f58",
    knobs: [
      { name: "Low Freq", min: 20, max: 100, unit: "Hz" },
      { name: "Low Boost", min: 0, max: 10, unit: "" },
      { name: "Low Atten", min: 0, max: 10, unit: "" },
      { name: "High Freq", min: 3, max: 16, unit: "kHz" },
      { name: "High Boost", min: 0, max: 10, unit: "" },
      { name: "High Atten", min: 0, max: 10, unit: "" }
    ]
  },
  {
    id: "rack_saturator_x",
    category: "rack",
    name: "Saturator-X",
    knobs: [
      { name: "Input", min: -24, max: 24, unit: "dB" },
      { name: "Output", min: -24, max: 24, unit: "dB" },
      { name: "Drive", min: 0, max: 10, unit: "" },
      { name: "Magic Eye", min: 0, max: 0, unit: "" } // Indicator
    ]
  },
  {
    id: "rack_quad_comp",
    category: "rack",
    name: "Quad Comp (Multiband Compressor)",
    knobs: [
      { name: "Low Threshold", min: -60, max: 0, unit: "dB" },
      { name: "Low Ratio", min: 1, max: 10, unit: "" },
      { name: "Mid Low Threshold", min: -60, max: 0, unit: "dB" },
      { name: "Mid High Threshold", min: -60, max: 0, unit: "dB" },
      { name: "High Threshold", min: -60, max: 0, unit: "dB" }
    ]
  },
  {
    id: "rack_parametric_eq",
    category: "rack",
    name: "Parametric EQ",
    realId: "f453a992-127e-4050-a92c-63e77f0d067c",
    knobs: [
      { name: "Freq 1", min: 20, max: 20000, unit: "Hz" },
      { name: "Gain 1", min: -15, max: 15, unit: "dB" },
      { name: "Q 1", min: 0.1, max: 10, unit: "" },
      { name: "Freq 2", min: 20, max: 20000, unit: "Hz" },
      { name: "Gain 2", min: -15, max: 15, unit: "dB" },
      { name: "Q 2", min: 0.1, max: 10, unit: "" }
    ]
  }
];

export const TONEX_MANIFEST: GearItem[] = [
  {
    id: "tonex_amp_model",
    category: "tonex",
    name: "TONEX Amp Model (AI Capture)",
    knobs: [
      { name: "Gain", min: 0, max: 10, unit: "" },
      { name: "Bass", min: 0, max: 10, unit: "" },
      { name: "Mid", min: 0, max: 10, unit: "" },
      { name: "Treble", min: 0, max: 10, unit: "" },
      { name: "Presence", min: 0, max: 10, unit: "" },
      { name: "Depth", min: 0, max: 10, unit: "" },
      { name: "Volume", min: 0, max: 10, unit: "" }
    ]
  },
  {
    id: "tonex_stomp_model",
    category: "tonex",
    name: "TONEX Stomp Model (AI Capture)",
    knobs: [
      { name: "Gain/Drive", min: 0, max: 10, unit: "" },
      { name: "Tone", min: 0, max: 10, unit: "" },
      { name: "Level", min: 0, max: 10, unit: "" }
    ]
  }
];
