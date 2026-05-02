export interface Knob {
  name: string;
  value: number | string; // 0-10 or specific setting
  midiCC?: number; // Suggested MIDI Control Change number
}

export interface GearLink {
  id: string;
  type: 'Stomp' | 'Amp' | 'Cab' | 'Room' | 'EQ' | 'Rack' | 'TONEX';
  model: string;
  knobs: Knob[];
  description?: string;
}

export interface ToneSummary {
  style: string;
  gain_level: 'low' | 'medium' | 'medium-high' | 'high';
  noise_level: 'low' | 'moderate' | 'high';
}

export interface SignalChainElement {
  type: 'pedal' | 'amp' | 'cab' | 'rack';
  name: string;
  settings: Record<string, string | number>;
}

export interface EngineeringNotes {
  gain_strategy: string;
  noise_control: string;
  eq_strategy: string;
}

export interface ToneResult {
  tone_summary: ToneSummary;
  signal_chain: SignalChainElement[];
  engineering_notes: EngineeringNotes;
  confidence: number;
  midiPC?: number;
  
  // Legacy fields for backward compatibility during transition if needed
  // but we will primarily use the above
  signalChain?: GearLink[]; 
}

export type AT5GearGroup =
  | "amp"
  | "cab"
  | "stomp"
  | "rack"
  | "room"
  | "tonex"
  | string;

export interface KnobMember {
  name: string;
  type: "range" | "switch" | "selector";
  min?: number;
  max?: number;
  options?: string[];
  default?: number | string;
  unit?: string;
}

export interface AT5CatalogItem {
  group: AT5GearGroup;
  guid: string;
  slot: string;
  displayName: string;
  otherNames?: string[];
  usedInPresets?: number;
  examplePresets?: string[];
  knobs?: KnobMember[]; // Changed string[] to KnobMember[]
  paramSuffix?: string;
}
