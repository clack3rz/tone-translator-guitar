
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Database, 
  Edit2, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw, 
  Trash2,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { AT5CatalogItem } from '../types';
import { getAt5Catalog, refreshCatalog } from '../services/at5Catalog';
import { 
  getVerifiedCabs, 
  getVerifiedMics, 
  getVerifiedSpeakers, 
  refreshProtocols 
} from '../services/at5VerifiedProtocols';
import { at5DatabaseService } from '../services/at5DatabaseService';
import { auth } from '../services/firebase';

interface CatalogueManagerProps {
  onRefresh?: () => void;
  initialSearch?: string;
}

type ManagedItem = {
  id: string;
  guid: string;
  displayName: string;
  group: string;
  aliases: string[];
  type: 'gear' | 'protocol';
  subType?: 'cabs' | 'speakers' | 'mics';
  raw: any;
  isDbRecord?: boolean;
};

export const CatalogueManager: React.FC<CatalogueManagerProps> = ({ onRefresh, initialSearch }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [items, setItems] = useState<ManagedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null); // Unique ID
  const [editForm, setEditForm] = useState<{ guid: string; displayName: string; aliases: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null); // Unique ID

  // Custom iframe-friendly modal dialog state
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const showAlert = (title: string, message: string) => {
    setDialog({
      isOpen: true,
      type: 'alert',
      title,
      message
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm
    });
  };

  const loadItems = () => {
    const gear = (getAt5Catalog() || []).map(item => ({
      id: `gear-${item.guid || item.displayName}`,
      guid: item.guid,
      displayName: item.displayName,
      group: item.group,
      aliases: item.otherNames || [],
      type: 'gear' as const,
      isDbRecord: item.isDbRecord,
      raw: item
    }));

    const cabs = (getVerifiedCabs() || []).map(item => ({
      id: `protocol-cabs-${item.guid}`,
      guid: item.guid,
      displayName: (item.aliases && item.aliases[0]) || 'Unknown Cabinet',
      group: 'protocol:cab',
      aliases: item.aliases || [],
      type: 'protocol' as const,
      subType: 'cabs' as const,
      isDbRecord: item.isDbRecord,
      raw: item
    }));

    const speakers = (getVerifiedSpeakers() || []).map(item => ({
      id: `protocol-speakers-${item.guid}`,
      guid: item.guid,
      displayName: (item.aliases && item.aliases[0]) || 'Unknown Speaker',
      group: 'protocol:speaker',
      aliases: item.aliases || [],
      type: 'protocol' as const,
      subType: 'speakers' as const,
      isDbRecord: item.isDbRecord,
      raw: item
    }));

    const mics = (getVerifiedMics() || []).map(item => ({
      id: `protocol-mics-${item.guid}`,
      guid: item.guid,
      displayName: (item.aliases && item.aliases[0]) || 'Unknown Mic',
      group: 'protocol:mic',
      aliases: item.aliases || [],
      type: 'protocol' as const,
      subType: 'mics' as const,
      isDbRecord: item.isDbRecord,
      raw: item
    }));

    // Explicit deduplication check for React keys and GUIDs
    const seenIds = new Set<string>();
    const seenGuids = new Set<string>();
    const uniqueItems: ManagedItem[] = [];

    // Prioritize gear catalog items
    gear.forEach(item => {
      const guidNorm = item.guid ? item.guid.toLowerCase().trim() : '';
      if (guidNorm) {
        seenGuids.add(guidNorm);
      }
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueItems.push(item);
      }
    });

    // Process mapping records with secondary deduplication
    [...cabs, ...speakers, ...mics].forEach(item => {
      const guidNorm = item.guid ? item.guid.toLowerCase().trim() : '';
      
      if (guidNorm && seenGuids.has(guidNorm)) {
        // GUID already exists as a gear record - merge aliases and skip double-display
        const existingGear = uniqueItems.find(g => g.guid && g.guid.toLowerCase().trim() === guidNorm);
        if (existingGear) {
          const combinedAliases = Array.from(new Set([...(existingGear.aliases || []), ...(item.aliases || [])]));
          existingGear.aliases = combinedAliases;
          if (item.subType) {
            existingGear.subType = item.subType;
          }
          if (item.isDbRecord) {
            existingGear.isDbRecord = true;
          }
        }
        console.warn(`Deduplicated cross-table GUID reference: ${item.guid}. Merged options into catalog view.`);
        return;
      }

      if (guidNorm) {
        seenGuids.add(guidNorm);
      }

      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueItems.push(item);
      } else {
        console.warn(`Duplicate ID detected in CatalogueManager: ${item.id}. Filtering out to prevent React key collision.`);
      }
    });

    setItems(uniqueItems);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    
    // 1. Apply Gear Type filtering
    if (selectedType !== 'all') {
      result = result.filter(item => {
        const group = item.group.toLowerCase();
        if (selectedType === 'amp') return group === 'amp';
        if (selectedType === 'cab') return group === 'cab' || group === 'protocol:cab';
        if (selectedType === 'speaker') return group === 'protocol:speaker';
        if (selectedType === 'mic') return group === 'protocol:mic';
        if (selectedType === 'stomp') return group === 'stomp';
        if (selectedType === 'rack') return group === 'rack';
        if (selectedType === 'room') return group === 'room';
        return false;
      });
    }

    // 2. Apply search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.displayName.toLowerCase().includes(s) || 
        item.guid.toLowerCase().includes(s) ||
        item.aliases.some(n => n.toLowerCase().includes(s))
      );
    }
    
    return result;
  }, [items, selectedType, searchTerm]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([refreshCatalog(), refreshProtocols()]);
    loadItems();
    setIsLoading(false);
    if (onRefresh) onRefresh();
  };

  const startEditing = (item: ManagedItem) => {
    setEditingItem(item.id);
    setEditForm({ 
      guid: item.guid, 
      displayName: item.displayName,
      aliases: item.aliases.join(', ')
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm(null);
  };

  const proceedSave = async (originalItem: ManagedItem) => {
    if (!editForm) return;
    setIsSaving(true);
    try {
      const guidChanged = editForm.guid !== originalItem.guid;
      const finalAliases = editForm.aliases.split(',').map(a => a.trim()).filter(Boolean);

      if (originalItem.type === 'gear') {
        const updatedItem: AT5CatalogItem = {
          ...originalItem.raw,
          guid: editForm.guid,
          displayName: editForm.displayName,
          otherNames: finalAliases
        };

        await at5DatabaseService.saveGearItem(updatedItem);
        if (guidChanged) {
          await at5DatabaseService.deleteGearItem(originalItem.guid);
        }

        // Propagate changes to the verified mapping collection (e.g. verified_cabs)
        const finalSubType = originalItem.subType || (
          (originalItem.group?.toLowerCase() === 'cab' || originalItem.group?.toLowerCase() === 'cabinet')
            ? 'cabs'
            : undefined
        );

        if (finalSubType) {
          const updatedMapping = {
            guid: editForm.guid,
            aliases: finalAliases
          };
          await at5DatabaseService.saveVerifiedMapping(finalSubType, updatedMapping);
          if (guidChanged) {
            await at5DatabaseService.deleteVerifiedMapping(finalSubType, originalItem.guid);
          }
        }
      } else if (originalItem.type === 'protocol' && originalItem.subType) {
        const updatedMapping = {
          guid: editForm.guid,
          aliases: finalAliases
        };

        await at5DatabaseService.saveVerifiedMapping(originalItem.subType, updatedMapping);
        if (guidChanged) {
          await at5DatabaseService.deleteVerifiedMapping(originalItem.subType, originalItem.guid);
        }
      }

      await handleRefresh();
      setEditingItem(null);
      setEditForm(null);
    } catch (err) {
      console.error("Failed to save changes:", err);
      showAlert("SAVE FAILED", "Error saving changes. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveChanges = async (originalItem: ManagedItem) => {
    if (!editForm) return;

    if (!auth.currentUser) {
      showAlert(
        "AUTHENTICATION REQUIRED",
        "You must be Signed In to save changes or create Cloud DB overrides. Please click the 'Sign In' button at the top right of the application first."
      );
      return;
    }

    // Check for GUID collisions in the current items list
    const collision = items.find(i => 
      i.guid.toLowerCase() === editForm.guid.toLowerCase() && 
      i.guid.toLowerCase() !== originalItem.guid.toLowerCase()
    );

    if (collision) {
      showAlert(
        "CRITICAL ERROR: GUID CONFLICT",
        `GUID Conflict detected. "${editForm.guid}" belongs to another record: "${collision.displayName}" [${collision.group}]. Each gear item must have a unique primary key.`
      );
      return;
    }

    // Check for "Cross-Classification" conflicts (v.bad scenario)
    const crossConflict = items.find(i => 
      i.guid.toLowerCase() === editForm.guid.toLowerCase() && 
      i.type !== originalItem.type
    );

    if (crossConflict) {
      showConfirm(
        "GUID WARNING",
        `GUID "${editForm.guid}" is already used in a DIFFERENT classification: "${crossConflict.displayName}" [${crossConflict.group}]. Sharing GUIDs across Gear and Protocols is highly discouraged. Proceed anyway?`,
        () => {
          proceedSave(originalItem);
        }
      );
      return;
    }

    await proceedSave(originalItem);
  };

  const handleDeleteOverride = async (item: ManagedItem) => {
    if (!auth.currentUser) {
      showAlert(
        "AUTHENTICATION REQUIRED",
        "You must be Signed In to delete cloud overrides."
      );
      return;
    }

    if (!item.isDbRecord) {
      showAlert(
        "SYSTEM RECORD PROTECTED",
        "This is a System Record (hardcoded in the application) and cannot be deleted from the Cloud. If you want to modify it, try editing it to create a Cloud override."
      );
      return;
    }
    
    showConfirm(
      "CONFIRM DELETION",
      `Are you sure you want to remove this Cloud override for "${item.displayName}"? This will revert the item to its static/default state if it exists.`,
      async () => {
        setIsLoading(true);
        try {
          if (item.type === 'gear') {
            await at5DatabaseService.deleteGearItem(item.guid);
          } else if (item.type === 'protocol' && item.subType) {
            await at5DatabaseService.deleteVerifiedMapping(item.subType, item.guid);
          }
          // Trigger a deep refresh
          await refreshCatalog();
          await refreshProtocols();
          loadItems(); 
        } catch (err) {
          console.error("Delete failed:", err);
          showAlert("DELETE FAILED", "Delete failed. Check console for details.");
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Settings className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight uppercase">Catalogue Management</h2>
            <p className="text-xs text-gray-500 mt-0.5">Search and edit all gear and protocol identifiers</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-1 max-w-xl mx-8">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
             <input 
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search Name, GUID, or Alias..."
               className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs focus:border-purple-500 outline-none transition-all placeholder:text-gray-700 font-mono"
             />
           </div>

           <select
             value={selectedType}
             onChange={(e) => setSelectedType(e.target.value)}
             className="bg-white/5 border border-white/15 hover:border-purple-500 text-xs font-mono text-gray-300 hover:text-white rounded-lg px-3 py-2 outline-none cursor-pointer transition-colors"
           >
             <option value="all" className="bg-[#0a0a0a] text-xs">ALL TYPES</option>
             <option value="amp" className="bg-[#0a0a0a] text-xs">AMPS</option>
             <option value="cab" className="bg-[#0a0a0a] text-xs">CABINETS</option>
             <option value="speaker" className="bg-[#0a0a0a] text-xs">SPEAKERS</option>
             <option value="mic" className="bg-[#0a0a0a] text-xs">MICROPHONES</option>
             <option value="stomp" className="bg-[#0a0a0a] text-xs">STOMP PEDALS</option>
             <option value="rack" className="bg-[#0a0a0a] text-xs">RACK EFFECTS</option>
             <option value="room" className="bg-[#0a0a0a] text-xs">ROOM ENVIRONMENTS</option>
           </select>

           <button 
             onClick={handleRefresh}
             disabled={isLoading}
             className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors shrink-0"
             title="Reload all data from Cloud"
           >
             <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
           </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-black/60 backdrop-blur-sm text-gray-400 text-[10px] uppercase tracking-wider sticky top-0 z-10 border-b border-white/5 text-center">
              <tr>
                <th className="px-6 py-3 font-semibold text-left">Display Name / Aliases</th>
                <th className="px-6 py-3 font-semibold text-left">Internal GUID Identifier</th>
                <th className="px-6 py-3 font-semibold">Classification</th>
                <th className="px-6 py-3 font-semibold text-right pr-12">Action Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <Search className="w-12 h-12 mb-4" />
                      <p className="text-sm font-mono uppercase tracking-[0.2em]">No results for "{searchTerm}"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isEditing = editingItem === item.id;
                  const isExpanded = expandedItem === item.id;
                  
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={`hover:bg-white/[0.03] transition-colors group ${isEditing ? 'bg-purple-500/10' : ''}`}>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input 
                                autoFocus
                                type="text"
                                value={editForm?.displayName || ''}
                                onChange={(e) => setEditForm(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                                placeholder="Display Name"
                                className="bg-black border border-purple-500/50 rounded px-2 py-1.5 text-sm text-white outline-none w-full shadow-inner"
                              />
                               <input 
                                type="text"
                                value={editForm?.aliases || ''}
                                onChange={(e) => setEditForm(prev => prev ? { ...prev, aliases: e.target.value } : null)}
                                placeholder="Aliases (comma separated)"
                                className="bg-black border border-purple-500/30 rounded px-2 py-1 text-[10px] text-gray-400 outline-none w-full font-mono shadow-inner"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className={`font-bold tracking-tight ${item.type === 'protocol' ? 'text-cyan-200' : 'text-white'}`}>{item.displayName}</span>
                              <div className="flex flex-wrap gap-1">
                                {item.aliases.slice(0, 5).map((alias, i) => (
                                  <span key={i} className="text-[9px] text-gray-500 bg-white/5 px-1 rounded font-mono border border-white/5">{alias}</span>
                                ))}
                                {item.aliases.length > 5 && <span className="text-[9px] text-gray-600 font-mono">+{item.aliases.length - 5}</span>}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input 
                              type="text"
                              value={editForm?.guid || ''}
                              onChange={(e) => setEditForm(prev => prev ? { ...prev, guid: e.target.value } : null)}
                              className="bg-black border border-purple-500/50 rounded px-2 py-1.5 text-xs text-purple-200 outline-none font-mono w-[300px] shadow-inner"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <code className={`text-[10px] font-mono px-2 py-1 rounded border ${item.type === 'protocol' ? 'text-cyan-500/80 bg-cyan-500/5 border-cyan-500/10' : 'text-gray-400 bg-white/5 border-white/5'}`}>
                                {item.guid}
                              </code>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border uppercase ${
                              item.type === 'protocol' 
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]' 
                                : 'bg-white/10 text-gray-300 border-white/10'
                            }`}>
                              {item.group.replace('protocol:', 'PROT: ')}
                            </span>
                            {item.isDbRecord ? (
                              <span className="text-[8px] text-purple-400/60 font-mono uppercase">Cloud (DB)</span>
                            ) : (
                              <span className="text-[8px] text-gray-600 font-mono uppercase">System</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {isEditing ? (
                               <>
                                 <button 
                                   onClick={() => saveChanges(item)}
                                   disabled={isSaving}
                                   className="p-2.5 bg-purple-500 hover:bg-purple-400 text-black rounded-lg transition-all shadow-lg active:scale-95"
                                 >
                                   {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                 </button>
                                 <button 
                                   onClick={cancelEditing}
                                   className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-500"
                                 >
                                   <X className="w-4 h-4" />
                                 </button>
                               </>
                             ) : (
                               <>
                                 <button 
                                   onClick={() => startEditing(item)}
                                   className="p-2.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-purple-400 transition-all active:scale-95"
                                   title="Edit record"
                                 >
                                   <Edit2 className="w-4 h-4" />
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteOverride(item)}
                                   className={`p-2.5 hover:bg-white/10 rounded-lg transition-all active:scale-95 ${
                                     item.isDbRecord ? 'text-gray-500 hover:text-red-400' : 'text-gray-800 cursor-not-allowed opacity-30'
                                   }`}
                                   title={item.isDbRecord ? "Delete cloud override" : "System record - can't delete"}
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                                 <button 
                                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                  className={`p-2.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-all ${isExpanded ? 'bg-white/10 text-white' : ''}`}
                                >
                                  {isExpanded ? <ChevronDown className="w-4 h-4 text-purple-400" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                               </>
                             )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="bg-black/40 backdrop-blur-md px-8 py-6 border-l-4 border-purple-500/50 shadow-inner">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                               <div className="space-y-4">
                                 <div>
                                   <h4 className="text-[10px] text-gray-600 uppercase font-black mb-2 tracking-[0.2em]">Record Source</h4>
                                   <div className={`text-[10px] uppercase font-bold ${item.type === 'protocol' ? 'text-cyan-500' : 'text-purple-500'}`}>
                                     {item.type === 'gear' ? 'Catalogue Object' : `${item.subType?.toUpperCase()} Schema`}
                                   </div>
                                 </div>
                                 <div>
                                   <h4 className="text-[10px] text-gray-600 uppercase font-black mb-2 tracking-[0.2em]">Total Aliases</h4>
                                   <div className="text-xl font-display font-bold text-white leading-none">
                                     {item.aliases.length}
                                   </div>
                                 </div>
                                </div>
                               
                               <div className="col-span-2">
                                 <h4 className="text-[10px] text-gray-600 uppercase font-black mb-3 tracking-[0.2em]">Parameter Profile</h4>
                                 {item.type === 'gear' && item.raw.knobs ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      {item.raw.knobs.slice(0, 12).map((k: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded px-2 py-1">
                                          <span className="text-[9px] text-gray-500 font-mono truncate mr-2">{k.name}</span>
                                          <span className="text-[8px] text-purple-400 uppercase font-bold">{k.type}</span>
                                        </div>
                                      ))}
                                    </div>
                                 ) : (
                                   <div className="text-[10px] text-gray-500 italic opacity-50 font-mono">
                                     Protocol matching is based on alias fuzzy scoring.
                                   </div>
                                 )}
                               </div>

                               <div className="flex flex-col justify-end items-end gap-3">
                                  <div className="text-right">
                                    <h4 className="text-[10px] text-gray-600 uppercase font-black mb-1 tracking-[0.2em]">Database Status</h4>
                                    <div className="flex items-center gap-1.5 justify-end">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                                      <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest leading-none">Healthy Sync</span>
                                    </div>
                                  </div>
                                  <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 text-[9px] text-purple-300 italic leading-relaxed text-right">
                                    Identified in {(item.raw.usedInPresets || 0)} training samples.
                                  </div>
                               </div>

                              {(item.group === 'cab' || item.group === 'protocol:cab') && (
                                <div className="col-span-2 md:col-span-4 mt-6 pt-6 border-t border-white/5 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                                    <h4 className="text-[10px] text-purple-400 uppercase font-black tracking-[0.2em]">Associated Mic & Speaker Coupling Gear Details (Parity Specs)</h4>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                                      <h5 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Coupled Speakers</h5>
                                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 text-left">
                                        {getVerifiedSpeakers().map((spk) => (
                                          <div key={spk.guid} className="flex flex-col bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded p-2 gap-0.5 transition-colors">
                                            <div className="flex justify-between items-center gap-2">
                                              <span className="text-[11px] font-bold text-white font-sans">{spk.aliases[0]}</span>
                                              <code className="text-[8px] text-cyan-400 font-mono bg-cyan-950/20 px-1 rounded truncate select-all">{spk.guid}</code>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                              {spk.aliases.slice(1).map((a, idx) => (
                                                <span key={idx} className="text-[8px] text-gray-500 font-mono bg-white/5 px-1 rounded">{a}</span>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                                      <h5 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Coupled Microphones</h5>
                                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 text-left">
                                        {getVerifiedMics().map((mic) => (
                                          <div key={mic.guid} className="flex flex-col bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded p-2 gap-0.5 transition-colors">
                                            <div className="flex justify-between items-center gap-2">
                                              <span className="text-[11px] font-bold text-white font-sans">{mic.aliases[0]}</span>
                                              <code className="text-[8px] text-cyan-400 font-mono bg-cyan-950/20 px-1 rounded truncate select-all">{mic.guid}</code>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                              {mic.aliases.slice(1).map((a, idx) => (
                                                <span key={idx} className="text-[8px] text-gray-500 font-mono bg-white/5 px-1 rounded">{a}</span>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2 font-sans text-left">
                                      <h5 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cabinet Positioning Parameters</h5>
                                      <div className="text-[10px] text-gray-400 space-y-2 leading-relaxed font-mono">
                                        <div>
                                          <span className="text-purple-400">SpeakerModel0-3</span>: Points to Speaker GUID to change speaker model of the 4 slots.
                                        </div>
                                        <div>
                                          <span className="text-purple-400">Mic0Model / Mic1Model</span>: Holds standard verified Microphone GUIDs.
                                        </div>
                                        <div>
                                          <span className="text-cyan-400">Mic0Distance / Mic1Distance</span>: Mic distance 0.0 (near) to 1.0 (far) from grill.
                                        </div>
                                        <div>
                                          <span className="text-cyan-400">Mic0XAxis / Mic1XAxis</span>: Placement from speaker cap (0.0) to edge (1.0).
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[10px] text-gray-600 uppercase tracking-widest leading-relaxed">
            Atomic changes: renaming a GUID creates a new record and migrates the metadata.
          </p>
        </div>
        <div className="text-[10px] text-gray-700 font-mono">
          MASTER_REGISTRY // v3.0_SECURE
        </div>
      </div>

      <AnimatePresence>
        {dialog && dialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="custom-dialog-container">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (dialog.type === 'alert') {
                  setDialog(null);
                }
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              id="dialog-backdrop"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative w-full max-w-sm bg-[#0E0E10] border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 p-6 flex flex-col gap-4 text-left"
              id="dialog-content"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${dialog.type === 'confirm' ? 'bg-amber-500/10 text-amber-400' : 'bg-purple-500/10 text-purple-400'}`}>
                  {dialog.type === 'confirm' ? (
                    <AlertCircle className="w-5 h-5" id="confirm-icon" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" id="alert-icon" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-sans" id="dialog-title">
                    {dialog.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-2 font-mono leading-relaxed break-words whitespace-pre-wrap" id="dialog-desc">
                    {dialog.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                {dialog.type === 'confirm' ? (
                  <>
                    <button
                      onClick={() => {
                        setDialog(null);
                      }}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-all active:scale-95"
                      id="confirm-cancel-btn"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const { onConfirm } = dialog;
                        setDialog(null);
                        if (onConfirm) onConfirm();
                      }}
                      className={`px-4 py-2 rounded-lg text-black text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg ${
                        dialog.title.toLowerCase().includes('delete')
                          ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20'
                          : 'bg-purple-500 hover:bg-purple-400 shadow-purple-500/20'
                      }`}
                      id="confirm-action-btn"
                    >
                      {dialog.title.toLowerCase().includes('delete') ? 'Confirm Deletion' : 'Confirm'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setDialog(null);
                    }}
                    className="px-5 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-black text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-purple-500/20"
                    id="alert-close-btn"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
