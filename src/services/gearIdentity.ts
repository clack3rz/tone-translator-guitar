/**
 * Mapping of Amplitube Gear IDs to their real-world counterparts.
 * Based on community sources and manual identification.
 */
export const GEAR_IDENTITIES: Record<string, string> = {
  // AMPS
  'amp_british_lead_s100': 'Marshall 1959 JTM100 Super Lead',
  'amp_british_800': 'Marshall JCM800 2203',
  'amp_british_copper_30': 'Vox AC30 Top Boost',
  'amp_jazz_amp_120': 'Roland JC-120 Jazz Chorus',
  'amp_american_clean_mkiii': 'Mesa/Boogie Mark III',
  'amp_dual_rectifier': 'Mesa/Boogie Dual Rectifier',
  'amp_triple_rectifier': 'Mesa/Boogie Triple Rectifier',
  'amp_soldano_slo100': 'Soldano SLO-100',
  'amp_fender_twin_reverb': 'Fender Twin Reverb \'65',
  'amp_fender_deluxe_reverb': 'Fender Deluxe Reverb \'65',
  'amp_fender_bassman': 'Fender Bassman \'59',
  'amp_orange_ad30': 'Orange AD30HTC',
  'amp_orange_rockerverb': 'Orange Rockerverb 50 MKII',
  'amp_peavey_5150': 'Peavey 5150',
  'amp_dumble_overdrive': 'Dumble Overdrive Special',
  'amp_diesel_v4': 'Diezel VH4',
  'amp_bogner_ecstasy': 'Bogner Ecstasy',

  // STOMPS
  'stomp_overscream': 'Ibanez Tube Screamer TS9',
  'stomp_diode_overdrive': 'Boss SD-1 Super Overdrive',
  'stomp_fuzz_age': 'Arbiter Fuzz Face',
  'stomp_distortion': 'ProCo RAT',
  'stomp_chorus_1': 'Boss CE-1 Chorus Ensemble',
  'stomp_analog_chorus': 'Boss CE-2 Chorus',
  'stomp_electric_flanger': 'Electro-Harmonix Electric Mistress',
  'stomp_nu_tremolo': 'Vox Tremolo',
  'stomp_phaser_90': 'MXR Phase 90',
  'stomp_uni_v_vib': 'Univox Uni-Vibe',
  'stomp_compressor': 'MXR Dyna Comp',
  'stomp_octave': 'Tycobrahe Octavia',
  'stomp_whammy': 'DigiTech Whammy',
  'stomp_wah_46': 'Vox V846 Wah',

  // RACK / EQ
  'rack_white_2a': 'Teletronix LA-2A Leveling Amplifier',
  'rack_classic_76': 'UREI 1176LN Limiting Amplifier',
  'rack_vintage_eq': 'Pultec EQP-1A Program Equalizer',
  'rack_british_eq': 'Neve 1073 EQ',
  'rack_parametric_eq': 'GML 8200 Parametric EQ',
  'rack_black_76': 'Universal Audio 1176LN',
  
  // CAB / ROOM
  'cab_british_4x12': 'Marshall 1960A 4x12',
  'cab_american_2x12': 'Fender Twin Reverb 2x12',
  'cab_vintage_4x12': 'Vox V212BN 2x12',
  'cab_oversize_4x12': 'Mesa/Boogie Rectifier 4x12'
};

/**
 * Gets the legacy identification name for a gear ID.
 */
export function getGearIdentity(id: string): string | null {
  const lowerId = id.toLowerCase().replace(/-/g, '_');
  
  // Try direct match
  if (GEAR_IDENTITIES[lowerId]) return GEAR_IDENTITIES[lowerId];

  // Try partial match for dynamic IDs (e.g., amp-british-800-something)
  for (const [key, value] of Object.entries(GEAR_IDENTITIES)) {
    if (lowerId.includes(key)) return value;
  }

  // Common patterns
  if (lowerId.includes('british')) {
    if (lowerId.includes('800')) return 'Marshall JCM800 Style';
    if (lowerId.includes('lead')) return 'Marshall Plexi Style';
    if (lowerId.includes('copper')) return 'Vox AC Style';
  }
  if (lowerId.includes('american')) {
    if (lowerId.includes('clean')) return 'Fender/Mesa Clean Style';
    if (lowerId.includes('high_gain')) return 'Modern High Gain Style';
  }

  return null;
}
