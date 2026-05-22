
export type GearType = "pedal" | "amp" | "cab" | "rack" | "unknown";

export type CatalogueStatus = 
  | "known" 
  | "new" 
  | "possible_match" 
  | "parameter_update" 
  | "conflict";

export interface ParameterImport {
  name: string;
  value: number | string | boolean;
  min?: number;
  max?: number;
  rangeStatus: "known" | "unknown" | "inferred";
}

export interface DetectedGear {
  displayName: string;
  normalizedName: string;
  gearType: GearType;
  slotType?: string;
  modelGuid: string;
  catalogueStatus: CatalogueStatus;
  parameters: ParameterImport[];
  importRecommendation: string;
  rawXmlPath?: string;
  isEnabled: boolean;
  existingAliases?: string[];
}

export interface ImportResults {
  sourceFileName: string;
  detectedGear: DetectedGear[];
  detectedProtocols?: DetectedProtocol[];
  warnings: string[];
  errors: string[];
}

export interface CataloguePatch {
  newGear: DetectedGear[];
  updatedGear: DetectedGear[];
  conflicts: DetectedGear[];
  newProtocols: DetectedProtocol[]; // New: Mic/Speaker mappings
  requiresManualReview: (DetectedGear | DetectedProtocol)[];
}

export type ProtocolType = "mic" | "speaker" | "cab_alias";

export interface DetectedProtocol {
  type: ProtocolType;
  guid: string;
  suggestedName: string;
  sourcePreset?: string;
  status: CatalogueStatus;
  existingAliases?: string[];
}
