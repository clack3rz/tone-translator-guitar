
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileJson, 
  Copy, 
  Download, 
  Database, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Info,
  X,
  XCircle,
  ChevronRight,
  ChevronDown,
  Settings,
  CloudUpload,
  RefreshCw,
  Edit2,
  Check,
  Save,
  LogIn,
  ShieldCheck,
  Server,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  parseAt5pPreset, 
  generateCataloguePatch, 
  generateTypeScriptEntry, 
  generateNormalizerAlias, 
  generateVerifiedParameterEntry,
  generateProtocolSnippet
} from '../services/at5PresetImporter';
import { ImportResults, DetectedGear, CataloguePatch, DetectedProtocol, GearType } from '../types/at5ImportTypes';
import { at5DatabaseService } from '../services/at5DatabaseService';
import { auth, signInWithGoogle } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { refreshCatalog, getAt5Catalog } from '../services/at5Catalog';
import { 
  refreshProtocols, 
  getVerifiedCabs, 
  getVerifiedMics, 
  getVerifiedSpeakers
} from '../services/at5VerifiedProtocols';
import { AT5CatalogItem } from '../types';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'known': return 'text-green-400';
    case 'new': return 'text-blue-400 font-bold';
    case 'possible_match': return 'text-yellow-400';
    case 'parameter_update': return 'text-purple-400';
    case 'conflict': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'known': return <CheckCircle2 className="w-4 h-4" />;
    case 'new': return <Info className="w-4 h-4" />;
    case 'possible_match': return <Search className="w-4 h-4" />;
    case 'conflict': return <AlertCircle className="w-4 h-4" />;
    default: return <Settings className="w-4 h-4" />;
  }
};

const normalizeGuid = (guid: any) => {
  if (typeof guid !== 'string') return String(guid);
  return guid.toLowerCase().replace(/-/g, '').trim();
};

const isGuid = (val: any) => {
  if (typeof val !== 'string') return false;
  // Standard UUID format: 8-4-4-4-12 hex chars or 32 hex chars
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const hex32Regex = /^[0-9a-f]{32}$/i;
  return uuidRegex.test(val.trim()) || hex32Regex.test(val.trim());
};

const resolveGuidName = (
  guid: any, 
  tweakedProtocolNames: Record<string, string>, 
  paramName?: string,
  gearGuid?: string,
  tweakedProtocolParamNames?: Record<string, Record<string, string>>
) => {
  if (!isGuid(guid)) return String(guid);
  const normalizedGuid = normalizeGuid(guid);

  // 1. Check for instance-specific parameter override (e.g. this specific SpeakerModel0 on this Cab)
  if (gearGuid && paramName) {
    const instanceOverrides = tweakedProtocolParamNames?.[gearGuid];
    if (instanceOverrides && instanceOverrides[paramName] !== undefined) {
      return instanceOverrides[paramName];
    }
  }

  // 2. Check for global GUID override
  if (tweakedProtocolNames[normalizedGuid] !== undefined) {
    return tweakedProtocolNames[normalizedGuid];
  }

  const catalog = getAt5Catalog();
  const known = catalog.find(i => normalizeGuid(i.guid) === normalizedGuid);
  if (known) return known.displayName;
  
  // Check protocols - match first alias if found
  const mic = getVerifiedMics().find(m => normalizeGuid(m.guid) === normalizedGuid);
  if (mic) return mic.aliases[0] || "Verified Mic";

  const speaker = getVerifiedSpeakers().find(m => normalizeGuid(m.guid) === normalizedGuid);
  if (speaker) return speaker.aliases[0] || "Verified Speaker";

  const cab = getVerifiedCabs().find(m => normalizeGuid(m.guid) === normalizedGuid);
  if (cab) return cab.aliases[0] || "Verified Cabinet";
  
  const cleanGuid = guid.trim();
  const short = cleanGuid.includes("-") ? cleanGuid.split("-")[0] : cleanGuid.substring(0, 8);
  let type = "Gear";
  const pName = paramName?.toLowerCase() || "";
  if (pName.includes("speaker")) type = "Speaker";
  else if (pName.includes("mic")) type = "Mic";
  else if (pName.includes("cab")) type = "Cab/Model";

  return `Unknown ${type} (${short})`;
};

interface GearRowProps {
  gear: DetectedGear;
  idx: number;
  expandedGear: string | null;
  setExpandedGear: (val: string | null) => void;
  tweakedNames: Record<string, string>;
  setTweakedNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  tweakedAliases: Record<string, string>; // Comma separated string
  setTweakedAliases: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  tweakedParams: Record<string, Record<string, string>>;
  setTweakedParams: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
  tweakedParamNames: Record<string, Record<string, string>>;
  setTweakedParamNames: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
  tweakedProtocolNames: Record<string, string>;
  setTweakedProtocolNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  tweakedProtocolParamNames: Record<string, Record<string, string>>;
  setTweakedProtocolParamNames: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
  tweakedGuids: Record<string, string>;
  setTweakedGuids: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  committedGuids: Set<string>;
  isCommitting: string | null;
  handleCommitToDb: (gear: DetectedGear, name: string, aliases: string) => Promise<void>;
  isExpertMode?: boolean;
  onRefreshChain?: () => void;
}

const GearRow: React.FC<GearRowProps> = React.memo(({ 
  gear, 
  idx, 
  expandedGear, 
  setExpandedGear,
  tweakedNames,
  setTweakedNames,
  tweakedAliases,
  setTweakedAliases,
  tweakedParams,
  setTweakedParams,
  tweakedParamNames,
  setTweakedParamNames,
  tweakedProtocolNames,
  setTweakedProtocolNames,
  tweakedProtocolParamNames,
  setTweakedProtocolParamNames,
  tweakedGuids,
  setTweakedGuids,
  committedGuids,
  isCommitting,
  handleCommitToDb,
  isExpertMode = false,
  onRefreshChain
}) => {
  const isUnknown = (name: string) => name.toLowerCase().includes("unknown");

  const isExpanded = expandedGear === `${gear.modelGuid}-${idx}`;
  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState("");
  
  const [isEditingAliases, setIsEditingAliases] = useState(false);
  const [localAliases, setLocalAliases] = useState("");

  const [editingParamValue, setEditingParamValue] = useState<string | null>(null);
  const [localParamValue, setLocalParamValue] = useState("");
  
  const [editingParamKey, setEditingParamKey] = useState<string | null>(null);
  const [localParamKey, setLocalParamKey] = useState("");

  const [editingProtocolGuid, setEditingProtocolGuid] = useState<string | null>(null);
  const [editingProtocolParam, setEditingProtocolParam] = useState<string | null>(null);
  const [localProtocolName, setLocalProtocolName] = useState("");

  const [isEditingGuid, setIsEditingGuid] = useState(false);
  const [localGuid, setLocalGuid] = useState("");

  const [showAliasesMap, setShowAliasesMap] = useState<Record<string, boolean>>({});

  const toggleAliases = (guid: string) => {
    setShowAliasesMap(prev => ({ ...prev, [guid]: !prev[guid] }));
  };

  const gearGuidNormalized = normalizeGuid(gear.modelGuid);
  const displayName = tweakedNames[gearGuidNormalized] || gear.displayName;
  const currentGuid = tweakedGuids[gear.modelGuid] || gear.modelGuid;
  const displayAliases = tweakedAliases[gearGuidNormalized] || (gear.existingAliases?.join(', ') || "");
  const isCommitted = committedGuids.has(gearGuidNormalized) || committedGuids.has(gear.modelGuid) || gear.catalogueStatus === 'known';
  const isActuallyNew = gear.catalogueStatus === 'new' || gear.catalogueStatus === 'parameter_update' || gear.catalogueStatus === 'possible_match';
  
  const canEdit = !isCommitted || isExpertMode;
  
  const currentParams = (gear.parameters || []).map(p => {
    const overriddenName = tweakedParamNames[gearGuidNormalized]?.[p.name] ?? p.name;
    const overriddenValue = tweakedParams[gearGuidNormalized]?.[p.name] ?? p.value;
    return {
      ...p,
      displayName: overriddenName,
      value: overriddenValue
    };
  });

  const hasUnknownParams = currentParams.some(p => {
    const val = String(p.value ?? "");
    if (!isGuid(val)) return false;
    return isUnknown(resolveGuidName(val, tweakedProtocolNames, p.name, gearGuidNormalized, tweakedProtocolParamNames));
  });

  // Handle name edit start
  const startEditingName = () => {
    if (!canEdit) return;
    setLocalName(displayName);
    setIsEditing(true);
  };

  const saveName = () => {
    setTweakedNames(prev => ({ ...prev, [gearGuidNormalized]: localName }));
    setIsEditing(false);
  };

  const startEditingGuid = () => {
    if (!canEdit) return;
    setLocalGuid(currentGuid);
    setIsEditingGuid(true);
  };

  const saveGuid = () => {
    setTweakedGuids(prev => ({ ...prev, [gear.modelGuid]: localGuid }));
    setIsEditingGuid(false);
  };

  const startEditingAliases = () => {
    if (!canEdit) return;
    setLocalAliases(displayAliases);
    setIsEditingAliases(true);
  };

  const saveAliases = () => {
    setTweakedAliases(prev => ({ ...prev, [gearGuidNormalized]: localAliases }));
    setIsEditingAliases(false);
  };

  // Handle param value edit
  const startEditingParamValue = (name: string, value: string) => {
    if (!canEdit) return;
    setEditingParamValue(name);
    setLocalParamValue(value);
  };

  const saveParamValue = () => {
    if (editingParamValue) {
      setTweakedParams(prev => ({
        ...prev,
        [gearGuidNormalized]: {
          ...(prev[gearGuidNormalized] || {}),
          [editingParamValue]: localParamValue
        }
      }));
    }
    setEditingParamValue(null);
  };

  // Handle param name edit (the key/label)
  const startEditingParamKey = (originalName: string, currentDisplayName: string) => {
    if (!canEdit) return;
    setEditingParamKey(originalName);
    setLocalParamKey(currentDisplayName);
  };

  const saveParamKey = () => {
    if (editingParamKey) {
      setTweakedParamNames(prev => ({
        ...prev,
        [gearGuidNormalized]: {
          ...(prev[gearGuidNormalized] || {}),
          [editingParamKey]: localParamKey
        }
      }));
    }
    setEditingParamKey(null);
  };

  const startEditingProtocol = (guid: string, currentName: string, paramName: string) => {
    if (!canEdit) return;
    setEditingParamValue(null);
    setEditingParamKey(null);
    setEditingProtocolParam(paramName);
    setEditingProtocolGuid(normalizeGuid(guid));
    const cleanName = currentName.startsWith('Unknown') 
      ? currentName.split(' (')[0] 
      : currentName;
    setLocalProtocolName(cleanName);
  };

  const saveProtocolName = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (editingProtocolGuid && editingProtocolParam) {
      const pName = editingProtocolParam;
      const val = localProtocolName.trim();
      
      // Always update global as well, as it's the most common intent
      setTweakedProtocolNames(prev => ({
        ...prev,
        [editingProtocolGuid]: val
      }));

      // Update this specific slot in this specific gear instance
      setTweakedProtocolParamNames(prev => ({
        ...prev,
        [gearGuidNormalized]: {
          ...(prev[gearGuidNormalized] || {}),
          [pName]: val
        }
      }));
    }
    
    // Tiny delay to ensure propagation
    setTimeout(() => {
      setEditingProtocolGuid(null);
      setEditingProtocolParam(null);
    }, 10);
  };

  const groupParameters = (params: any[]) => {
    if (gear.gearType !== 'cab') return { 'Detected Parameters': params };

    const groups: Record<string, any[]> = {
      'Cab': [],
      'Speakers': [],
      'Room': [],
      'Mic 0': [],
      'Mic 1': [],
      'Others': []
    };

    params.forEach(p => {
      const name = p.name;
      if (name.includes('Room') || name.includes('Environment') || name.includes('Ambience')) {
        groups['Room'].push(p);
      } else if (name.includes('SpeakerModel')) {
        groups['Speakers'].push(p);
      } else if (name.includes('Mic0')) {
        groups['Mic 0'].push(p);
      } else if (name.includes('Mic1')) {
        groups['Mic 1'].push(p);
      } else if (name.includes('CabModel') || name.includes('IRDecimation') || name.includes('HighLevel')) {
        groups['Cab'].push(p);
      } else {
        groups['Others'].push(p);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(k => {
      if (groups[k].length === 0) delete groups[k];
    });

    return groups;
  };

  const parameterGroups = groupParameters(currentParams);

  const handleCommit = () => {
    const finalGear = { 
      ...gear, 
      modelGuid: currentGuid,
      parameters: currentParams 
    };
    handleCommitToDb(finalGear, displayName, displayAliases);
  };

  return (
    <React.Fragment>
      <tr className={`hover:bg-white/[0.02] transition-colors group ${isActuallyNew && !isCommitted ? 'bg-blue-500/5' : ''}`}>
        <td className="px-4 py-3">
          <div className="flex flex-col">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input 
                  autoFocus
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="bg-black border border-gear-accent/50 rounded px-2 py-0.5 text-xs text-white outline-none font-medium w-full max-w-[150px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') setIsEditing(false);
                    }}
                  />
                  <div className="flex items-center gap-1">
                    <button onClick={saveName} className="p-1 hover:bg-white/10 rounded text-green-400">
                      <Check className="w-3 h-3" />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-white/10 rounded text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isActuallyNew && !isCommitted ? 'text-blue-300' : 'text-white'}`}>{displayName}</span>
                {canEdit && (
                  <button 
                    onClick={startEditingName}
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded text-gray-500"
                    title="Tweak Display Name"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1.5 mt-0.5">
              {gear.gearType} 
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              {gear.slotType}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wide ${getStatusColor(gear.catalogueStatus)}`}>
              {getStatusIcon(gear.catalogueStatus)}
              {isCommitted ? 'VERIFIED' : gear.catalogueStatus.replace('_', ' ')}
            </div>
            {(hasUnknownParams) && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[9px] font-bold text-amber-400 border border-amber-500/20 uppercase tracking-widest animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.2)]">
                {isCommitted ? 'FLAGGED: UNKNOWN COMPONENTS' : 'Needs Review'}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {isEditingGuid ? (
              <div className="flex items-center gap-1">
                <input 
                  autoFocus
                  type="text"
                  value={localGuid}
                  onChange={(e) => setLocalGuid(e.target.value)}
                  className="bg-black border border-blue-500/50 rounded px-2 py-0.5 text-[10px] text-white outline-none font-mono w-[180px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveGuid();
                    if (e.key === 'Escape') setIsEditingGuid(false);
                  }}
                />
                <button onClick={saveGuid} className="p-1 hover:bg-white/10 rounded text-green-400">
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group/guid">
                <code 
                  className={`text-[10px] font-mono bg-white/5 px-2 py-1 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-white/10 hover:text-blue-300' : 'text-gray-500'}`}
                  onClick={startEditingGuid}
                  title={canEdit ? "Click to edit GUID" : ""}
                >
                  {currentGuid.substring(0, 20)}...
                </code>
                {canEdit && (
                  <button 
                    onClick={startEditingGuid}
                    className="p-1 opacity-0 group-hover/guid:opacity-100 transition-opacity hover:bg-white/10 rounded text-gray-600"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-3">
            {onRefreshChain && (
              <button 
                onClick={onRefreshChain}
                className="p-1.5 hover:bg-white/10 rounded-md text-blue-400/70 hover:text-blue-400 transition-colors"
                title="Refresh Signal Chain"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {isCommitted && !isExpertMode ? (
              <div className="flex flex-col items-center justify-center text-green-500/50">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[8px] uppercase mt-0.5 whitespace-nowrap">Database Sync</span>
              </div>
            ) : (
              <button 
                onClick={handleCommit}
                disabled={isCommitting === gear.modelGuid}
                className={`flex items-center gap-2 mx-auto px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all disabled:opacity-50 border ${
                  isCommitted 
                    ? 'bg-red-500/20 hover:bg-red-600 text-red-200 hover:text-white border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                    : 'bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-black border-blue-500/30'
                }`}
              >
                {isCommitting === gear.modelGuid ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
                {isCommitted ? 'Force Update Cloud' : 'Commit to Cloud'}
              </button>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <button 
            onClick={() => setExpandedGear(isExpanded ? null : `${gear.modelGuid}-${idx}`)}
            className="p-1.5 hover:bg-white/10 rounded-md text-gray-500 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
      </tr>
      
      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan={5} className="bg-white/[0.02] p-0 border-x border-white/5">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2 font-mono tracking-widest">Import Recommendation</h4>
                        <p className="text-xs text-gray-300 bg-black/40 p-3 rounded-md border border-white/5 italic shadow-inner">
                          "{gear.importRecommendation}"
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] uppercase font-bold text-gray-500 font-mono tracking-widest">Aliases (ID Matching)</h4>
                          {canEdit && !isEditingAliases && (
                            <button 
                              onClick={startEditingAliases}
                              className="text-[9px] text-blue-400 hover:text-white transition-colors flex items-center gap-1 uppercase"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              Edit Aliases
                            </button>
                          )}
                        </div>

                        {isEditingAliases ? (
                          <div className="space-y-2">
                            <textarea 
                              autoFocus
                              value={localAliases}
                              onChange={(e) => setLocalAliases(e.target.value)}
                              className="w-full bg-black border border-blue-500/30 rounded-md p-2 text-xs text-blue-100 font-mono focus:border-blue-500 outline-none h-20 shadow-inner"
                              placeholder="e.g. Vintage Overdrive, Tubescreamer, Green Pedal"
                            />
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] text-gray-500 italic">Separate multiple aliases with commas</p>
                              <div className="flex gap-2">
                                <button onClick={() => setIsEditingAliases(false)} className="px-2 py-1 text-[9px] text-gray-500 hover:text-white uppercase font-bold">Cancel</button>
                                <button onClick={saveAliases} className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[9px] uppercase font-bold hover:bg-blue-500 hover:text-black transition-all">Save Aliases</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-black/30 border border-white/5 p-3 rounded-md min-h-[40px]">
                              {displayAliases ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {displayAliases.split(',').map((a, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300/80 text-[10px] border border-blue-500/10 font-mono">
                                      {a.trim()}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-700 italic">No custom aliases defined (only Display Name will match)</span>
                              )}
                            </div>
                            
                            {gear.existingAliases && gear.existingAliases.length > 0 && !tweakedAliases[gear.modelGuid] && (
                             <div className="flex flex-col gap-2">
                               <button 
                                 onClick={() => toggleAliases(gear.modelGuid)}
                                 className="flex items-center gap-1.5 text-[8px] uppercase font-bold text-green-500/70 tracking-widest hover:text-green-400 transition-colors"
                               >
                                 <ShieldCheck className="w-3 h-3" />
                                 {showAliasesMap[gear.modelGuid] ? 'Hide Active Aliases' : `View ${gear.existingAliases.length} Active Aliases`}
                               </button>
                               
                               {showAliasesMap[gear.modelGuid] && (
                                 <div className="flex flex-wrap gap-1 px-3 py-2 bg-green-500/5 border border-green-500/20 rounded-md">
                                   {(gear.existingAliases || []).map((a, i) => (
                                     <span key={i} className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400/80 text-[8px] border border-green-500/10 font-mono">
                                       {a}
                                     </span>
                                   ))}
                                 </div>
                               )}
                             </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2 font-mono tracking-widest">Technical Info</h4>
                      <div className="space-y-1.5 text-[10px] font-mono text-gray-400">
                        <div className="flex justify-between border-b border-white/5 pb-1 items-start">
                          <span>Full GUID:</span>
                          <div className="flex flex-col items-end">
                            <span className="text-gray-300 leading-tight">{gear.modelGuid}</span>
                            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tight">{displayName}</span>
                          </div>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span>XML Path:</span>
                          <span className="text-gray-300">{gear.rawXmlPath}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>State:</span>
                          <span className={gear.isEnabled ? "text-green-400" : "text-gray-500"}>
                            {gear.isEnabled ? "Enabled / Active" : "Bypassed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                       <h4 className="text-[13px] uppercase font-bold text-blue-400 font-mono tracking-[0.2em] flex items-center gap-3">
                        <span className="w-1.5 h-4 bg-blue-500 rounded-sm" />
                        Detected Parameters (Snapshot)
                       </h4>
                       <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em] font-bold bg-white/5 px-2 py-1 rounded">
                        {canEdit ? "MODIFICATION ENABLED" : "LOCKED / READ-ONLY"}
                      </p>
                    </div>

                    {Object.entries(parameterGroups).map(([groupName, groupParams]) => {
                      const isModelGroup = groupName.toLowerCase().includes('model') || 
                                         groupName.toLowerCase().includes('speaker') || 
                                         groupName.toLowerCase().includes('mic') ||
                                         groupName.toLowerCase().includes('cab');
                      
                      return (
                        <div key={groupName} className="space-y-3">
                          {groupName !== 'Detected Parameters' && (
                            <div className="flex items-center gap-3 ml-1">
                              <h5 className="text-[11px] uppercase font-bold text-gray-300 tracking-widest whitespace-nowrap">{groupName}</h5>
                              <div className="h-px bg-white/10 w-full" />
                            </div>
                          )}
                          <div className={`grid gap-3 ${isModelGroup ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
                            {(groupParams || []).map((p, pidx) => {
                              const isLongValue = typeof p.value === 'string' && p.value.length >= 20;
                              
                              return (
                                <div key={pidx} className={`bg-white/[0.04] border border-white/10 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group/param transition-all ${canEdit ? 'hover:border-blue-500/50 hover:bg-white/[0.06] shadow-xl hover:shadow-blue-500/5' : ''}`}>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      {editingParamKey === p.name ? (
                                        <div className="flex items-center gap-1 w-full">
                                          <input
                                            autoFocus
                                            type="text"
                                            value={localParamKey}
                                            onChange={(e) => setLocalParamKey(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveParamKey()}
                                            className="bg-black/50 border border-purple-500/50 rounded px-2 py-1 text-xs text-purple-200 font-medium w-full outline-none shadow-inner"
                                          />
                                          <button onClick={saveParamKey} className="p-1 hover:bg-green-500/20 text-green-400 rounded">
                                            <Check className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <span 
                                          onClick={() => startEditingParamKey(p.name, p.displayName || p.name)}
                                          className={`text-[11px] text-gray-300 truncate group-hover/param:text-white transition-colors uppercase font-mono font-bold tracking-tight ${canEdit ? 'cursor-pointer hover:text-purple-400' : ''}`} 
                                          title={`Original: ${p.name}`}
                                        >
                                          {p.displayName || p.name}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className={`flex items-center ${isLongValue ? 'w-full sm:w-auto sm:min-w-[70%]' : 'shrink-0'}`}>
                                      {editingParamValue === p.name ? (
                                        <div className="flex flex-col gap-2 w-full">
                                          <div className="flex items-center gap-1 w-full">
                                            <input
                                              autoFocus
                                              type="text"
                                              value={localParamValue}
                                              onChange={(e) => setLocalParamValue(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveParamValue();
                                                if (e.key === 'Escape') setEditingParamValue(null);
                                              }}
                                              className={`bg-black/50 border border-blue-500/50 rounded px-2 py-1.5 text-sm text-blue-300 font-mono text-right outline-none font-bold shadow-inner flex-1`}
                                            />
                                            <button onClick={saveParamValue} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded transition-colors">
                                              <Check className="w-4 h-4" />
                                            </button>
                                          </div>
                                          {typeof p.value === 'string' && p.value.length >= 30 && (
                                            <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 rounded px-2 py-1">
                                              <span className="text-[8px] uppercase font-bold text-blue-400 shrink-0">GUID Match</span>
                                              <span className="text-[9px] text-gray-500 font-mono truncate">{p.value}</span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (editingProtocolGuid && editingProtocolParam === p.name && typeof p.value === 'string' && editingProtocolGuid === normalizeGuid(p.value)) ? (
                                        <div className="flex items-center gap-2 w-full">
                                          <input
                                            autoFocus
                                            type="text"
                                            value={localProtocolName}
                                            onChange={(e) => setLocalProtocolName(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') saveProtocolName(e);
                                              if (e.key === 'Escape') setEditingProtocolGuid(null);
                                            }}
                                            className="bg-black/50 border border-purple-500/50 rounded px-2 py-1.5 text-sm text-purple-200 outline-none font-bold w-full text-right shadow-inner"
                                            placeholder="Friendly Name..."
                                          />
                                          <div className="flex items-center gap-1">
                                            <button onClick={(e) => saveProtocolName(e)} className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded transition-colors" title="Save Name">
                                              <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingProtocolGuid(null); }} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition-colors" title="Cancel">
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                    ) : (
                                      <div 
                                        className={`transition-all px-3 py-2 rounded-md flex flex-col items-end shadow-sm w-full ${canEdit ? 'text-blue-200 cursor-pointer hover:bg-blue-500/30 bg-blue-500/10 hover:shadow-blue-500/10' : 'text-gray-100 bg-white/5'}`}
                                      >
                                        {typeof p.value === 'string' && p.value.length >= 30 ? (
                                          <div className="flex flex-col items-end w-full">
                                            <div 
                                              className={`flex items-center gap-2 group/label w-full justify-end px-2 py-1 rounded transition-colors ${canEdit ? 'cursor-pointer hover:bg-purple-500/20' : ''}`}
                                              onClick={(e) => {
                                                if (!canEdit) return;
                                                e.stopPropagation();
                                                startEditingProtocol(
                                                  p.value as string, 
                                                  resolveGuidName(p.value, tweakedProtocolNames, p.name, gearGuidNormalized, tweakedProtocolParamNames),
                                                  p.name
                                                );
                                              }}
                                              title={canEdit ? "Edit Friendly Name for this Model" : ""}
                                            >
                                              {canEdit && <Edit2 className="w-2.5 h-2.5 text-purple-400 opacity-60 group-hover/label:opacity-100" />}
                                              <span className={`text-sm font-bold leading-none transition-colors truncate ${canEdit ? 'text-purple-300 group-hover/label:text-white' : 'text-blue-100'}`}>
                                                {resolveGuidName(p.value, tweakedProtocolNames, p.name, gearGuidNormalized, tweakedProtocolParamNames)}
                                              </span>
                                            </div>
                                            <div 
                                              className={`text-[10px] text-gray-300 font-mono tracking-tighter opacity-90 group-hover/param:opacity-100 font-medium bg-black/40 px-2 py-1 rounded leading-relaxed break-all text-right w-full mt-1.5 transition-all ${canEdit ? 'cursor-pointer hover:bg-blue-500/20 hover:text-blue-200' : ''}`}
                                              onClick={(e) => {
                                                if (!canEdit) return;
                                                e.stopPropagation();
                                                startEditingParamValue(p.name, String(p.value));
                                              }}
                                              title={canEdit ? "Edit Raw GUID Value" : ""}
                                            >
                                              {p.value}
                                            </div>
                                          </div>
                                        ) : (
                                          <span 
                                            className="text-[13px] font-mono font-black leading-none py-1 text-blue-200 w-full text-right"
                                            onClick={() => startEditingParamValue(p.name, String(p.value))}
                                          >
                                            {p.value}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </React.Fragment>
  );
});

interface ProtocolRowProps {
  protocol: DetectedProtocol;
  committedGuids: Set<string>;
  isCommitting: string | null;
  handleCommitProtocolToDb: (protocol: DetectedProtocol, finalName: string, aliases: string) => Promise<void>;
  isExpertMode?: boolean;
  tweakedProtocolNames: Record<string, string>;
  setTweakedProtocolNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  tweakedGuids: Record<string, string>;
  setTweakedGuids: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const ProtocolRow: React.FC<ProtocolRowProps> = ({ 
  protocol, 
  committedGuids, 
  isCommitting, 
  handleCommitProtocolToDb,
  isExpertMode = false,
  tweakedProtocolNames,
  setTweakedProtocolNames,
  tweakedGuids,
  setTweakedGuids
}) => {
  const normalizedProtocolGuid = normalizeGuid(protocol.guid);
  const currentGuid = tweakedGuids[protocol.guid] || protocol.guid;
  const isCommitted = committedGuids.has(normalizedProtocolGuid) || committedGuids.has(protocol.guid.toLowerCase()) || committedGuids.has(protocol.guid);
  const [isEditing, setIsEditing] = useState(false);
  
  const [isEditingGuid, setIsEditingGuid] = useState(false);
  const [localGuid, setLocalGuid] = useState("");

  // Try tweaked name first, then suggested
  const currentTweakedName = tweakedProtocolNames[normalizedProtocolGuid];
  const baseName = currentTweakedName || protocol.suggestedName;

  // Clean up "Unknown Speaker (GUID)" to just "Unknown Speaker" for editing
  const initialName = baseName.startsWith('Unknown') 
    ? baseName.split(' (')[0] 
    : baseName;

  const [localName, setLocalName] = useState(initialName);

  // Sync if tweakedProtocolNames changes externally or current suggested name changes
  useEffect(() => {
    setLocalName(baseName.startsWith('Unknown') ? baseName.split(' (')[0] : baseName);
  }, [currentTweakedName, protocol.suggestedName]);

  const [localAliases, setLocalAliases] = useState(protocol.existingAliases?.join(', ') || "");
  const [isEditingAliases, setIsEditingAliases] = useState(false);

  const isUnknown = localName.toLowerCase().includes('unknown');
  const canEditName = !isCommitted || isExpertMode;
  const canVerify = !isUnknown;

  const startEditingName = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canEditName) return;
    setIsEditing(true);
  };

  const saveName = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const val = localName.trim();
    if (val) {
      setTweakedProtocolNames(prev => ({
        ...prev,
        [normalizedProtocolGuid]: val
      }));
    }
    setIsEditing(false);
  };
  
  const saveAliases = () => {
    setIsEditingAliases(false);
  };

  const startEditingGuid = () => {
    if (!canEditName) return;
    setLocalGuid(currentGuid);
    setIsEditingGuid(true);
  };

  const saveGuid = () => {
    setTweakedGuids(prev => ({ ...prev, [protocol.guid]: localGuid }));
    setIsEditingGuid(false);
  };

  const handleCommit = () => {
    const finalProtocol = { ...protocol, guid: currentGuid };
    handleCommitProtocolToDb(finalProtocol, localName, localAliases);
  };

  const aliasesArray = localAliases.split(',').map(a => a.trim()).filter(Boolean);

  return (
    <React.Fragment>
    <tr className="bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input 
                autoFocus
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="bg-black border border-cyan-400/50 rounded px-2 py-1 text-xs text-cyan-200 outline-none font-medium w-full max-w-[200px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <div className="flex items-center gap-1">
                <button onClick={saveName} className="p-1 px-1.5 bg-green-500/20 hover:bg-green-500/40 rounded text-green-400 transition-colors" title="Confirm">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-1 px-1.5 bg-red-500/20 hover:bg-red-500/40 rounded text-red-400 transition-colors" title="Cancel">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span 
                  onClick={startEditingName}
                  className={`font-medium ${isUnknown ? 'text-red-400' : 'text-cyan-200'} ${canEditName ? 'cursor-pointer hover:text-white' : ''}`}
                >
                  {localName}
                </span>
                {canEditName && (
                  <button 
                    onClick={startEditingName}
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded text-cyan-500"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-cyan-500 uppercase flex items-center gap-1.5 mt-0.5">
                {protocol.type === 'mic' ? 'Microphone' : 'Speaker'} Protocol
                {isUnknown && <span className="text-red-500/80 lowercase italic font-mono ml-1">(! needs valid name)</span>}
              </span>
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center">
          <button 
            onClick={() => setIsEditingAliases(!isEditingAliases)}
            className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wide text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            {aliasesArray.length > 0 ? `${aliasesArray.length} Aliases` : 'Set Aliases'}
          </button>
          {aliasesArray.length > 0 && !isEditingAliases && (
             <div className="text-[8px] text-cyan-600 truncate max-w-[100px] mt-0.5">
               {aliasesArray.join(', ')}
             </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {isEditingGuid ? (
          <div className="flex items-center gap-1">
            <input 
              autoFocus
              type="text"
              value={localGuid}
              onChange={(e) => setLocalGuid(e.target.value)}
              className="bg-black border border-cyan-400/50 rounded px-2 py-0.5 text-[10px] text-white outline-none font-mono w-[180px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveGuid();
                if (e.key === 'Escape') setIsEditingGuid(false);
              }}
            />
            <button onClick={saveGuid} className="p-1 hover:bg-white/10 rounded text-green-400">
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 group/guid">
            <code 
              className={`text-[10px] font-mono bg-cyan-500/5 px-2 py-1 rounded transition-colors ${canEditName ? 'cursor-pointer hover:bg-cyan-500/10 hover:text-cyan-200' : 'text-cyan-500/60'}`}
              onClick={startEditingGuid}
              title={canEditName ? "Click to edit GUID" : ""}
            >
              {currentGuid.substring(0, 20)}...
            </code>
            {canEditName && (
              <button 
                onClick={startEditingGuid}
                className="p-1 opacity-0 group-hover/guid:opacity-100 transition-opacity hover:bg-white/10 rounded text-cyan-600"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {isCommitted && !isExpertMode ? (
          <div className="text-cyan-400 flex justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        ) : (
          <button 
            onClick={handleCommit}
            disabled={isCommitting === protocol.guid || !canVerify}
            className={`flex items-center gap-2 mx-auto px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isUnknown ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-cyan-400/10 hover:bg-cyan-400 text-cyan-400 hover:text-black'
            }`}
          >
            {isCommitting === protocol.guid ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
            {isCommitted ? 'Re-Verify' : 'Verify'}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded border border-cyan-400/20 uppercase tracking-widest lowercase">protocol</span>
      </td>
    </tr>
    {isEditingAliases && (
      <tr className="bg-cyan-900/10">
        <td colSpan={5} className="px-4 py-3 border-x border-cyan-500/20">
          <div className="flex flex-col gap-2 p-2">
            <label className="text-[9px] uppercase font-bold text-cyan-500/70 font-mono tracking-widest">Protocol Aliases (Comma Separated)</label>
            <div className="flex gap-3">
              <input 
                autoFocus
                type="text"
                value={localAliases}
                onChange={(e) => setLocalAliases(e.target.value)}
                placeholder="e.g. SM57, Dynamic 57, Studio Mic"
                className="flex-1 bg-black/40 border border-cyan-500/30 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveAliases();
                  if (e.key === 'Escape') setIsEditingAliases(false);
                }}
              />
              <button onClick={saveAliases} className="px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-black rounded text-[10px] uppercase font-bold transition-all border border-cyan-500/30">
                Confirm
              </button>
            </div>
            <p className="text-[9px] text-cyan-700 italic">Adding aliases helps the system match this GUID even if the name changes in the preset XML.</p>
          </div>
        </td>
      </tr>
    )}
    </React.Fragment>
  );
};

export const AT5GearImportPanel: React.FC<{ onRefreshChain?: () => void }> = ({ onRefreshChain }) => {
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCommitting, setIsCommitting] = useState<string | null>(null); // Track which GUID is being saved
  const [expandedGear, setExpandedGear] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  // Tweak State
  const [tweakedNames, setTweakedNames] = useState<Record<string, string>>({});
  const [tweakedAliases, setTweakedAliases] = useState<Record<string, string>>({});
  const [tweakedParams, setTweakedParams] = useState<Record<string, Record<string, string>>>({});
  const [tweakedParamNames, setTweakedParamNames] = useState<Record<string, Record<string, string>>>({});
  const [tweakedProtocolNames, setTweakedProtocolNames] = useState<Record<string, string>>({});
  const [tweakedProtocolParamNames, setTweakedProtocolParamNames] = useState<Record<string, Record<string, string>>>({});
  const [tweakedGuids, setTweakedGuids] = useState<Record<string, string>>({});
  const [committedGuids, setCommittedGuids] = useState<Set<string>>(new Set());
  const [isExpertMode, setIsExpertMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    
    // Refresh catalog and protocols on mount
    refreshCatalog();
    refreshProtocols();

    return unsub;
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setTweakedNames({});
    setTweakedParams({});
    setTweakedParamNames({});
    setCurrentFile(file);
    try {
      const results = await parseAt5pPreset(file);
      setImportResults(results);
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyDebugJson = () => {
    if (!importResults) return;
    navigator.clipboard.writeText(JSON.stringify(importResults, null, 2));
    setCopyFeedback("Copied!");
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const exportDebugJson = () => {
    if (!importResults) return;
    const blob = new Blob([JSON.stringify(importResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `at5_import_debug_${importResults.sourceFileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCommitToDb = async (gear: DetectedGear, name: string, aliases: string) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    const gearNormalizedId = normalizeGuid(gear.modelGuid);
    const currentName = name || gear.displayName;
    const finalAliases = aliases ? aliases.split(',').map(a => a.trim()).filter(Boolean) : [];
    setIsCommitting(gear.modelGuid);
    
    try {
      const item: AT5CatalogItem = {
        group: gear.gearType as any,
        guid: gear.modelGuid,
        slot: gear.slotType,
        displayName: currentName,
        otherNames: finalAliases,
        knobs: (gear.parameters || []).map(p => {
          // 1. Resolve final parameter name
          const finalName = tweakedParamNames[gearNormalizedId]?.[p.name] ?? p.name;
          
          // 2. Resolve final parameter value (usually the GUID for protocols)
          const rawValue = tweakedParams[gearNormalizedId]?.[p.name] ?? p.value;
          const finalValue = rawValue;
          
          // 3. Resolve display name for the value if it's a GUID
          let valDisplayName = undefined;
          if (typeof finalValue === 'string' && finalValue.length >= 30) {
            valDisplayName = resolveGuidName(
              finalValue, 
              tweakedProtocolNames, 
              p.name, 
              gearNormalizedId, 
              tweakedProtocolParamNames
            );
          }
          
          return {
            name: finalName,
            type: "range",
            min: p.min ?? 0,
            max: p.max ?? 10,
            default: finalValue as any,
            suggestedValueName: valDisplayName
          };
        }),
        paramSuffix: gear.importRecommendation.includes("_") 
          ? gear.importRecommendation.split(' ')[0] 
          : "_param"
      };

      await at5DatabaseService.saveGearItem(item);
      setCommittedGuids(prev => new Set(prev).add(gearNormalizedId));
      await refreshCatalog();
      if (currentFile) {
        const results = await parseAt5pPreset(currentFile);
        setImportResults(results);
      }
      if (onRefreshChain) onRefreshChain();
      setCopyFeedback(`Committed: ${currentName}`);
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err) {
      console.error("Database commit failed", err);
    } finally {
      setIsCommitting(null);
    }
  };

  const handleCommitProtocolToDb = async (protocol: DetectedProtocol, finalName: string, aliases: string) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    const finalAliases = [
      finalName.toLowerCase(),
      ...(aliases ? aliases.split(',').map(a => a.trim().toLowerCase()).filter(Boolean) : [])
    ];
    // Remove duplicates
    const uniqueAliases = Array.from(new Set(finalAliases));

    setIsCommitting(protocol.guid);
    try {
      const typeMap = { 
        'cab': 'cabs', 
        'cab_alias': 'cabs',
        'mic': 'mics', 
        'speaker': 'speakers' 
      } as const;
      const type = typeMap[protocol.type as keyof typeof typeMap];
      
      if (!type) {
        console.error("Unknown protocol type:", protocol.type);
        throw new Error(`Unknown protocol type: ${protocol.type}`);
      }
      
      await at5DatabaseService.saveVerifiedMapping(type, {
        guid: protocol.guid,
        aliases: uniqueAliases
      });

      setCommittedGuids(prev => new Set(prev).add(protocol.guid));
      await refreshProtocols();
      if (currentFile) {
        const results = await parseAt5pPreset(currentFile);
        setImportResults(results);
      }
      if (onRefreshChain) onRefreshChain();
      setCopyFeedback(`Verified: ${finalName}`);
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err) {
      console.error("Protocol commit failed", err);
    } finally {
      setIsCommitting(null);
    }
  };

  const handleSeedDatabase = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    setIsAnalyzing(true);
    setCopyFeedback("Initializing Cloud...");
    
    try {
      await at5DatabaseService.seedDatabase(
        getAt5Catalog(),
        {
          cabs: getVerifiedCabs(),
          speakers: getVerifiedSpeakers(),
          mics: getVerifiedMics()
        }
      );
      setCopyFeedback("Cloud Database Seeded!");
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err) {
      console.error("Seeding failed", err);
      setCopyFeedback("Seeding Failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="at5-gear-import" className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight uppercase">AT5 Gear Import</h2>
            <p className="text-xs text-gray-500 mt-0.5">Analysis level 1: Gear identity & parameter mapping</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpertMode(!isExpertMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all border ${
              isExpertMode 
                ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
            }`}
            title={isExpertMode ? "Expert mode: Enabled (Verified gear unlocked)" : "Expert mode: Disabled (Verified gear locked)"}
          >
            {isExpertMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            Expert Override
          </button>

          <div className="flex items-center gap-2">
            {!importResults && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-tighter">Database Status:</span>
                {copyFeedback ? (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${copyFeedback.includes('Failed') ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-green-500/10 text-green-400 border border-green-500/30'}`}>
                    {copyFeedback.includes('Failed') ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {copyFeedback}
                  </div>
                ) : (
                  <button 
                    onClick={handleSeedDatabase}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gear-accent/10 hover:bg-gear-accent text-gear-accent hover:text-black text-[10px] rounded-md transition-colors font-bold uppercase border border-gear-accent/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] disabled:opacity-50"
                    title="Populate Cloud Catalogue with static system data"
                  >
                    {isAnalyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Server className="w-3 h-3" />}
                    {isAnalyzing ? "Seeding..." : "Seed Cloud Database"}
                  </button>
                )}
              </div>
            )}
            {importResults && (
              <>
              <button 
                onClick={copyDebugJson}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-gray-300 rounded-md transition-colors"
                title="Copy Debug JSON"
              >
                {copyFeedback ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copyFeedback || "Copy Debug"}
              </button>
              <button 
                onClick={exportDebugJson}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-gray-300 rounded-md transition-colors"
                title="Export Debug JSON"
              >
                <Download className="w-3.5 h-3.5" />
                Export Debug
              </button>
            </>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-md transition-all shadow-lg active:scale-95"
          >
            <Upload className="w-4 h-4" />
            ANALYSE PRESET
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".at5p"
            className="hidden"
          />
        </div>
      </div>
    </div>

    <div className="p-6">
        {!importResults && !isAnalyzing && (
          <div className="text-center py-12 px-4 border-2 border-dashed border-white/5 rounded-xl bg-white/[0.01]">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-1">No Preset Loaded</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Upload a known-good AmpliTube 5 .at5p preset that contains missing or skipped gear. TT will inspect the preset and prepare catalogue entries.
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin mb-4">
              <Settings className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-gray-400">Parsing XML and comparing against catalogue...</p>
          </div>
        )}

        {importResults && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {(() => {
              const totalItems = (importResults.detectedGear?.length || 0) + (importResults.detectedProtocols?.length || 0);
              const verifiedItems = (importResults.detectedGear?.filter(g => g.catalogueStatus === 'known' || committedGuids.has(g.modelGuid)).length || 0) + 
                                   (importResults.detectedProtocols?.filter(p => committedGuids.has(p.guid))?.length || 0);
              const allVerified = totalItems > 0 && verifiedItems === totalItems;
              
              if (allVerified && !isExpertMode) return null;

              return (
                <div className={`p-4 rounded-xl flex items-center justify-between border transition-all ${isExpertMode ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]' : 'bg-blue-500/10 border-blue-500/20'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isExpertMode ? 'bg-red-500/20 border-red-500/20' : 'bg-blue-500/20 border-blue-500/20'}`}>
                      {isExpertMode ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CloudUpload className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold uppercase tracking-tight leading-none mb-1 ${isExpertMode ? 'text-red-500' : 'text-white'}`}>
                        {isExpertMode ? "Expert Override Unlocked" : "New Gear Identified"}
                      </h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                        {isExpertMode ? "Verified database entries are now editable and syncable" : "Click Commit on blue rows to sync with Cloud Database"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {importResults.errors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3 text-sm text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>{importResults.errors.join(", ")}</div>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 uppercase tracking-widest font-mono">
              <div className="flex items-center gap-6">
                <span>File: <span className="text-gray-300 font-bold">{importResults.sourceFileName}</span></span>
                <span>Inventory: <span className="text-gray-300 font-bold">{(importResults.detectedGear || []).length} units</span></span>
              </div>
            </div>

            <div className="overflow-hidden border border-white/10 rounded-lg bg-white/[0.01]">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Gear / Type</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold">Model GUID</th>
                    <th className="px-4 py-3 font-semibold text-center">Cloud Commit</th>
                    <th className="px-4 py-3 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(importResults.detectedGear || []).map((gear, idx) => (
                    <GearRow 
                      key={`gear-${gear.modelGuid}-${idx}`} 
                      gear={gear} 
                      idx={idx} 
                      expandedGear={expandedGear} 
                      setExpandedGear={setExpandedGear}
                      tweakedNames={tweakedNames}
                      setTweakedNames={setTweakedNames}
                      tweakedAliases={tweakedAliases}
                      setTweakedAliases={setTweakedAliases}
                      tweakedParams={tweakedParams}
                      setTweakedParams={setTweakedParams}
                      tweakedParamNames={tweakedParamNames}
                      setTweakedParamNames={setTweakedParamNames}
                      tweakedProtocolNames={tweakedProtocolNames}
                      setTweakedProtocolNames={setTweakedProtocolNames}
                      tweakedProtocolParamNames={tweakedProtocolParamNames}
                      setTweakedProtocolParamNames={setTweakedProtocolParamNames}
                      tweakedGuids={tweakedGuids}
                      setTweakedGuids={setTweakedGuids}
                      committedGuids={committedGuids}
                      isCommitting={isCommitting}
                      handleCommitToDb={handleCommitToDb}
                      isExpertMode={isExpertMode}
                      onRefreshChain={onRefreshChain}
                    />
                  ))}
                  {importResults.detectedProtocols?.map((protocol, idx) => (
                    <ProtocolRow 
                      key={`proto-${protocol.guid}-${idx}`} 
                      protocol={protocol} 
                      committedGuids={committedGuids}
                      isCommitting={isCommitting}
                      handleCommitProtocolToDb={handleCommitProtocolToDb}
                      isExpertMode={isExpertMode}
                      tweakedProtocolNames={tweakedProtocolNames}
                      setTweakedProtocolNames={setTweakedProtocolNames}
                      tweakedGuids={tweakedGuids}
                      setTweakedGuids={setTweakedGuids}
                    />
                  ))}
                </tbody>
              </table>
            </div>
        </motion.div>
      )}
      </div>
    </div>
  );
};
