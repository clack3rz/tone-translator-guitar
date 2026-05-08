
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
  modelGuid?: string;
  catalogueStatus: CatalogueStatus;
  parameters: ParameterImport[];
  importRecommendation: string;
  rawXmlPath?: string;
  isEnabled: boolean;
}

export interface ImportResults {
  sourceFileName: string;
  detectedGear: DetectedGear[];
  warnings: string[];
  errors: string[];
}

export interface CataloguePatch {
  newGear: DetectedGear[];
  updatedGear: DetectedGear[];
  conflicts: DetectedGear[];
  requiresManualReview: DetectedGear[];
}
