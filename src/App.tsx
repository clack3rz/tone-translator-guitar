import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import AT5SignalChainView from "./components/AT5SignalChainView";
import { AT5GearImportPanel } from './components/AT5GearImportPanel';
import { CatalogueManager } from './components/CatalogueManager';
import { 
  Music, 
  Upload, 
  Zap, 
  Speaker, 
  Waves,
  ChevronRight,
  Info,
  Loader2,
  Guitar,
  Server,
  Box,
  Sliders,
  Cpu,
  Download,
  Activity,
  Copy,
  Check,
  Target,
  Mic2,
  FileJson,
  ShieldCheck,
  SlidersHorizontal,
  Gauge,
  Cable,
  Cuboid,
  X,
  LogIn,
  User,
  Database,
  RefreshCw
} from 'lucide-react';
import { translateTone } from './services/geminiService';
import { ToneResult } from './types';
import { parseAt5p, PresetData } from './services/presetParser';
import { getExportData, getExportDebugData } from './services/presetExporter';
import { GearSilhouette } from './components/GearSilhouette';
import { 
  KnobDefinition 
} from './services/gearManifest';
import { getGearIdentity } from './services/gearIdentity';
import { auth, signInWithGoogle } from './services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { refreshCatalog } from './services/at5Catalog';
import { refreshProtocols } from './services/at5VerifiedProtocols';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [targetAudioFile, setTargetAudioFile] = useState<File | null>(null);
  const [recordingAudioFile, setRecordingAudioFile] = useState<File | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [toneResult, setToneResult] = useState<ToneResult | null>(null);
  const [activeGearId, setActiveGearId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userPreset, setUserPreset] = useState<PresetData | null>(null);
  const [diffs, setDiffs] = useState<string[]>([]);
  const [activeVariation, setActiveVariation] = useState<'primary' | 'v1' | 'v2'>('primary');
  const [isCopied, setIsCopied] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState('');
  const [useValidationRecipes, setUseValidationRecipes] = useState(false);
  const [isChainViewOpen, setIsChainViewOpen] = useState(false);
  const [isAdvancedDebugOpen, setIsAdvancedDebugOpen] = useState(false);
  const [isGearToolOpen, setIsGearToolOpen] = useState(false);
  const [gearToolTab, setGearToolTab] = useState<'discovery' | 'catalogue'>('discovery');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isDbRefreshing, setIsDbRefreshing] = useState(false);
  const [dbVersion, setDbVersion] = useState(0);
  const [catalogueSearchOverride, setCatalogueSearchOverride] = useState<string | undefined>(undefined);

  const handleRefreshChain = useCallback(async () => {
    setIsDbRefreshing(true);
    await Promise.all([refreshCatalog(), refreshProtocols()]);
    setDbVersion(prev => prev + 1);
    setIsDbRefreshing(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    // Initial data refresh
    const initDb = async () => {
      setIsDbRefreshing(true);
      await Promise.all([refreshCatalog(), refreshProtocols()]);
      setIsDbRefreshing(false);
    };
    initDb();

    return () => unsubscribe();
  }, []);
 
  const currentChain = React.useMemo(() => {
    if (!toneResult) return [];
    return toneResult.signal_chain || [];
  }, [toneResult]);

  const exportDebugData = React.useMemo(() => {
    if (!toneResult) return null;
    try {
      return getExportDebugData(toneResult, currentChain);
    } catch (e) {
      console.error("Failed to generate export debug data:", e);
      return null;
    }
  }, [toneResult, currentChain, dbVersion]);

  const handleGearClick = (link: any, index: number) => {
    setActiveGearId(`${link.name}-${index}`);
    
    if (!exportDebugData) return;

    // Match exactly by original index for stable debugging
    const item = [...(exportDebugData.exported_chain || []), ...(exportDebugData.skipped_gear || [])].find(
      (d) => d.original_index === index
    );

    if (item) {
      const cardId = `at5-chain-card-${item.slot_section}-${item.slot_index}-${item.normalized_name}`;
      const element = document.getElementById(cardId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        // Add a temporary highlight class or handling
        element.classList.add('ring-2', 'ring-gear-accent', 'ring-offset-4', 'ring-offset-black');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-gear-accent', 'ring-offset-4', 'ring-offset-black');
        }, 2000);
      }
    }
  };

  const getGearStatus = useCallback((link: any, index: number) => {
    if (!exportDebugData) return 'normal';
    
    // Match by original index for 1:1 parity with the debug chain
    const item = [...(exportDebugData.exported_chain || []), ...(exportDebugData.skipped_gear || [])].find(
      (d) => d.original_index === index
    );
    
    if (!item) return 'normal';
    if (!item.exported) return 'skipped';
    
    const isCheck = 
      item.reason.toLowerCase().includes("check") ||
      item.reason.toLowerCase().includes("warning") ||
      item.reason.toLowerCase().includes("caution") ||
      item.reason.toLowerCase().includes("fallback") ||
      (item.exported_settings && item.exported_settings.includes("undefined")) ||
      (item.exported_settings === null && item.type !== "cab");
      
    if (isCheck) return 'check';
    return 'pass';
  }, [exportDebugData]);

  const initiateExport = () => {
    if (!toneResult) return;
    const defaultName = `TT_${toneResult.tone_summary.style.substring(0, 15).replace(/[^a-z0-9]/gi, '_')}`;
    setExportFilename(defaultName);
    setIsExportModalOpen(true);
  };

  const handleExport = async (customName: string) => {
    if (!toneResult) return;

    setIsTranslating(true);

    try {
      const data = getExportData(toneResult, currentChain);

      const finalName = customName.endsWith(".at5p")
        ? customName
        : `${customName}.at5p`;

      const blob = new Blob([data], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = finalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      setError("Preset Export failed. Please try again.");
    } finally {
      setIsTranslating(false);
      setIsExportModalOpen(false);
    }
  };

  const copyManifestAsText = () => {
    if (!toneResult) return;
    
    let text = `AMPLITUBE 5 TONE ARCHITECTURE MANIFEST\n`;
    text += `======================================\n\n`;
    
    currentChain.forEach((link, idx) => {
      text += `${idx + 1}. ${link.name.toUpperCase()} [${link.type}]\n`;
      text += `--------------------------------------\n`;
      
      Object.entries(link.settings).forEach(([name, value]) => {
        text += `${name.padEnd(20)} : ${value}\n`;
      });
      text += `\n`;
    });

    text += `CONFIDENCE: ${toneResult.confidence}%\n`;
    text += `ENGINE: V2.0_MASTER\n`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const onTargetDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setTargetAudioFile(acceptedFiles[0]);
    }
  }, []);

  const onRecordingDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setRecordingAudioFile(acceptedFiles[0]);
    }
  }, []);

  const onPresetDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const text = await file.text();
      try {
        const parsed = parseAt5p(text);
        setUserPreset(parsed);
        if (toneResult) {
          // Compare logic might need update
          setDiffs(["Analysis completed with new engine"]);
        }
      } catch (err) {
        setError('Failed to parse Amplitube preset file.');
      }
    }
  }, [toneResult]);

  const { getRootProps: getTargetRootProps, getInputProps: getTargetInputProps, isDragActive: isTargetDragActive } = useDropzone({
    onDrop: onTargetDrop,
    accept: { 'audio/*': [] },
    multiple: false,
  });

  const { getRootProps: getRecordingRootProps, getInputProps: getRecordingInputProps, isDragActive: isRecordingDragActive } = useDropzone({
    onDrop: onRecordingDrop,
    accept: { 'audio/*': [] },
    multiple: false,
  });

  const { 
    getRootProps: getPresetRootProps, 
    getInputProps: getPresetInputProps, 
    isDragActive: isPresetDragActive 
  } = useDropzone({
    onDrop: onPresetDrop,
    accept: { 
      '.at5p': ['.at5p'],
      'text/plain': ['.txt']
    },
    multiple: false,
  });

  const handleTranslate = async () => {
    if (!prompt && !targetAudioFile && !recordingAudioFile) {
      setError('Please provide a description or at least one audio file.');
      return;
    }

    setIsTranslating(true);
    setError(null);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const toBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({ base64, mimeType: file.type });
          };
          reader.readAsDataURL(file);
        });
      };

      const targetData = targetAudioFile ? await toBase64(targetAudioFile) : undefined;
      const recordingData = recordingAudioFile ? await toBase64(recordingAudioFile) : undefined;

      const toneResponse = await translateTone(
        prompt || "Synchronizing tone architecture based on providing reference.",
        targetData,
        recordingData,
        userPreset,
        controller.signal,
        youtubeUrl || undefined,
        useValidationRecipes
      );
      setToneResult(toneResponse);
      
      if (userPreset) {
        // Compare logic might need update but we'll try to find a proxy
        setDiffs(["Analysis completed with new engine"]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || (err instanceof Error && err.message.includes('abort'))) {
        console.log('Analysis aborted by user');
        return;
      }
      if (err instanceof Error && err.message.includes('TimeoutError')) {
        setError('Analysis timed out. The tone might be too complex or the service is busy. Please try again.');
        return;
      }
      if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED') {
        setError('Rate limit exceeded. Please wait a moment and try again.');
        return;
      }
      console.error(err);
      setError('Failed to translate tone. Please check your connection and try again.');
    } finally {
      setIsTranslating(false);
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setIsTranslating(false);
      setAbortController(null);
    }
  };

  const copyExportDebug = () => {
    if (!toneResult) return;
    const debug = getExportDebugData(toneResult, currentChain);
    navigator.clipboard.writeText(JSON.stringify(debug, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const exportDebugJson = () => {
    if (!toneResult) return;
    const debug = getExportDebugData(toneResult, currentChain);
    const data = JSON.stringify(debug, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `debug_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleJumpToCatalogue = (guid: string) => {
    setCatalogueSearchOverride(guid);
    setGearToolTab('catalogue');
    setIsGearToolOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden selection:bg-gear-accent/30 font-sans">
      {/* 1. TOP-TIER: Header & Global Controls */}
      <header className="h-[60px] border-b border-white/10 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gear-accent rounded flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Guitar className="text-black w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold tracking-tight leading-none">Tone Translator</h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Amplitube AI // V2.0 MASTER</p>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-12 flex items-center gap-3 px-6">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the tone (e.g. Master of Puppets bridge...)"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-16 py-2 text-xs focus:border-gear-accent outline-none transition-all placeholder:text-gray-600 font-mono"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {prompt && (
                <button 
                  onClick={() => setPrompt('')}
                  className="p-1 hover:bg-white/10 rounded-full transition-all active:scale-90"
                  title="Clear description"
                >
                  <X className="w-3 h-3 text-gray-500 hover:text-white" />
                </button>
              )}
              <Sliders className="w-3.5 h-3.5 text-gray-700" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer group shrink-0">
            <div 
              className={`w-7 h-4 rounded-full p-0.5 transition-colors relative border border-white/10 ${useValidationRecipes ? 'bg-gear-accent' : 'bg-white/5'}`}
            >
              <div className={`w-2.5 h-2.5 bg-white rounded-full transition-transform ${useValidationRecipes ? 'translate-x-3' : 'translate-x-0'}`} />
            </div>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-tighter group-hover:text-gray-300 select-none">Recipes</span>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={useValidationRecipes} 
              onChange={(e) => setUseValidationRecipes(e.target.checked)} 
            />
          </label>

          <button 
            onClick={handleTranslate}
            disabled={isTranslating}
            className="px-6 py-2 bg-gear-accent hover:bg-yellow-500 text-black font-bold text-[10px] rounded-lg transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 shadow-[0_0_20px_rgba(245,158,11,0.2)] uppercase tracking-widest"
          >
            {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {isTranslating ? "ANALYZING..." : "GENERATE"}
          </button>
        </div>

          <div className="flex items-center gap-4">
            <div className="w-px h-4 bg-white/10" />
          <div className="text-[9px] font-mono text-gray-500 uppercase flex items-center gap-2 pr-2">
            <div className={`w-1.5 h-1.5 ${isDbRefreshing ? 'bg-amber-500' : 'bg-green-500'} rounded-full animate-pulse`} />
            {isDbRefreshing ? 'Syncing DB...' : 'Cloud Ready'}
          </div>

          <div className="w-px h-4 bg-white/10 mx-2" />

          {user ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsGearToolOpen(!isGearToolOpen)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all text-[10px] font-mono uppercase tracking-tighter ${isGearToolOpen ? 'bg-gear-accent text-black border-gear-accent shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
              >
                <Database className="w-3 h-3" />
                Discovery
              </button>

              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 group hover:border-gear-accent/50 transition-colors">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full border border-white/20" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-3 h-3 text-gray-500" />
              )}
              <span className="text-[10px] font-mono text-gray-400 group-hover:text-white transition-colors">{user.displayName?.split(' ')[0]}</span>
              <button onClick={() => auth.signOut()} className="text-[8px] text-gray-600 hover:text-red-400 transition-colors ml-1 uppercase">Out</button>
            </div>
          </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[10px] font-mono text-gray-400 hover:text-white transition-all uppercase tracking-tighter"
            >
              <LogIn className="w-3 h-3 text-gear-accent" />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* 2. TOP-TIER: Signal Ribbon */}
      {toneResult && (
        <div className="bg-black/80 border-b border-white/5 px-12 py-2 flex items-center gap-4 shrink-0 overflow-x-auto scrollbar-hide">
          <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mr-2">Tone Iterations:</span>
          <button 
            onClick={() => { setActiveVariation('primary'); setActiveGearId(null); }}
            className={`px-3 py-1 rounded text-[10px] font-bold transition-all uppercase tracking-tighter ${activeVariation === 'primary' ? 'bg-gear-accent text-black scale-105 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
          >
            Studio Reference
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsChainViewOpen(!isChainViewOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all uppercase tracking-widest font-bold text-[9px] ${
                isChainViewOpen 
                  ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                  : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
              }`}
            >
              <Activity className="w-3 h-3" />
              Inspect Chain
            </button>
            <button 
              onClick={handleRefreshChain}
              disabled={isDbRefreshing}
              className="group p-1.5 hover:bg-white/10 rounded-md transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10"
              title="Refresh Chain (Re-run analysis against updated database)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDbRefreshing ? 'animate-spin text-gear-accent' : ''}`} />
            </button>

            <button 
              onClick={initiateExport}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gear-accent/30 text-gear-accent font-bold text-[9px] hover:bg-gear-accent hover:text-black transition-all uppercase tracking-widest shadow-lg shadow-black/20"
            >
              <Download className="w-3 h-3" />
              EXPORT .AT5P
            </button>
          </div>
        </div>
      )}
      <section className="min-h-[140px] border-b border-white/10 relative bg-[#0a0a0a] shrink-0 py-6">
        <div className={`absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 pointer-events-none z-0 transition-colors duration-500 ${
          'bg-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.5)]'
        }`} />
        
        <div className="flex items-center flex-wrap gap-y-10 gap-x-12 px-12 h-full relative z-10">
          {!toneResult && (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-[10px] text-gray-700 uppercase tracking-[0.6em] animate-pulse font-mono text-center">Awaiting Input Signal Initialization...</p>
            </div>
          )}
          {currentChain.map((link, i) => {
            const isActive = (activeGearId === `${link.name}-${i}`) || (!activeGearId && i === 0);
            const status = getGearStatus(link, i);
            
            // Status colors
            const statusColorClass = {
              pass: 'text-green-400',
              check: 'text-amber-400',
              skipped: 'text-red-400',
              normal: 'text-gray-500 hover:text-white'
            }[status];

            const statusBorderClass = {
              pass: 'border-green-500/30',
              check: 'border-amber-500/30',
              skipped: 'border-red-500/30',
              normal: 'border-white/10 hover:border-white/40'
            }[status];

            // Meaningful Gear Icons
            const nameL = link.name.toLowerCase();
            let NodeIcon = {
              pedal: Waves,
              amp: Speaker,
              cab: Box,
              rack: SlidersHorizontal
            }[link.type] || Box;

            if (nameL.includes('gate') || nameL.includes('noise')) NodeIcon = Activity;
            if (nameL.includes('over') || nameL.includes('scream') || nameL.includes('dist')) NodeIcon = Zap;
            if (link.type === 'rack' && (nameL.includes('eq') || nameL.includes('graphic'))) NodeIcon = Sliders;
            if (link.type === 'pedal' && nameL.includes('boost')) NodeIcon = Gauge;

            return (
              <div key={`${link.name}-${i}`} className="flex flex-col items-center gap-2 group">
                <div className="flex flex-col items-center mb-1">
                  <span className="text-[10px] font-bold text-white uppercase tracking-tight text-center max-w-[120px] truncate" title={link.name}>
                    {link.name}
                  </span>
                  <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">{link.type}</span>
                </div>
                <button 
                  onClick={() => handleGearClick(link, i)}
                  className={`relative w-[70px] h-[70px] bg-[#111] border rounded-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    isActive 
                      ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110 z-20 bg-[#1a1a1a]' 
                      : statusBorderClass
                  }`}
                >
                  <div className={`absolute -top-2.5 -left-2.5 w-5 h-5 rounded bg-black border ${isActive ? 'border-gear-accent' : 'border-white/10'} flex items-center justify-center`}>
                    <span className="text-[8px] font-mono text-gray-500">{i + 1}</span>
                  </div>
                  <NodeIcon className={`w-7 h-7 transition-all ${isActive ? 'text-white' : statusColorClass}`} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="p-8">
          {isGearToolOpen ? (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setGearToolTab('discovery')}
                      className={`text-2xl font-display font-bold tracking-tight transition-all ${gearToolTab === 'discovery' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      Gear Discovery
                    </button>
                    <div className="w-px h-6 bg-white/10" />
                    <button 
                      onClick={() => setGearToolTab('catalogue')}
                      className={`text-2xl font-display font-bold tracking-tight transition-all ${gearToolTab === 'catalogue' ? 'text-white border-b-2 border-purple-500 pb-1' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      Catalogue
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-mono">
                    {gearToolTab === 'discovery' ? 'Sync unknown gear directly to the cloud' : 'Search and edit existing verified gear records'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleRefreshChain}
                    disabled={isDbRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    {isDbRefreshing ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <RefreshCw className="w-4 h-4 text-blue-400" />}
                    Refresh Chain & DB
                  </button>
                  <button 
                    onClick={() => setIsGearToolOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {gearToolTab === 'discovery' ? (
                <>
                  <AT5GearImportPanel onRefreshChain={handleRefreshChain} />
                  
                  <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-xl flex gap-4">
                    <Info className="w-5 h-5 text-blue-400 shrink-0" />
                    <div className="text-xs text-gray-400 space-y-2">
                      <p className="font-bold text-blue-300">How to update the System:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Upload an <span className="text-white">.at5p</span> preset containing the gear you want to add.</li>
                        <li>The system will identify <span className="text-blue-400">New Gear</span> or <span className="text-cyan-400">New Protocols</span>.</li>
                        <li>Click <span className="text-white font-bold">COMMIT</span> on any row to save it to the Cloud Database.</li>
                        <li>Once committed, the "Brain" will automatically recognize this gear in future tone generations.</li>
                      </ol>
                    </div>
                  </div>
                </>
              ) : (
                <CatalogueManager 
                  onRefresh={handleRefreshChain} 
                  initialSearch={catalogueSearchOverride} 
                />
              )}
            </div>
          ) : toneResult ? (
            <div className="max-w-6xl mx-auto space-y-12">
              {exportDebugData && (
                <AT5SignalChainView 
                  debugData={exportDebugData} 
                  onJumpToCatalogue={handleJumpToCatalogue} 
                />
              )}
              
              {/* Engineering Strategy & Quick Debug (Always Visible) */}
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <section>
                  <h4 className="text-[10px] font-mono text-gray-500 uppercase mb-4 tracking-[0.25em] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gear-accent" />
                    Engineering Strategy
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                      <p className="text-[8px] text-gray-600 uppercase font-mono mb-2 tracking-widest">Gain Strategy</p>
                      <p className="text-[11px] text-gray-400 italic leading-relaxed">
                        {toneResult.engineering_notes?.gain_strategy}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                      <p className="text-[8px] text-gray-600 uppercase font-mono mb-2 tracking-widest">Noise Control</p>
                      <p className="text-[11px] text-gray-400 italic leading-relaxed">
                        {toneResult.engineering_notes?.noise_control}
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                      <p className="text-[8px] text-gray-600 uppercase font-mono mb-2 tracking-widest">EQ Strategy</p>
                      <p className="text-[11px] text-gray-400 italic leading-relaxed">
                        {toneResult.engineering_notes?.eq_strategy}
                      </p>
                    </div>
                  </div>

                  {toneResult.engineering_notes?.amplifier_debug && (
                    <div className="mt-6 p-6 rounded-2xl bg-[#090d16]/30 border border-cyan-500/10 hover:border-cyan-500/20 transition-all font-mono">
                      <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]" />
                        Amplifier Selection & Calibration Engine (TT-02 Reference)
                      </p>
                      <div className="text-[10px] text-gray-400 leading-relaxed whitespace-pre-line space-y-2">
                        {toneResult.engineering_notes?.amplifier_debug}
                      </div>
                    </div>
                  )}
                </section>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={copyExportDebug}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-gray-400 hover:text-white transition-all uppercase tracking-widest font-bold shadow-lg shadow-black/20"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {isCopied ? "COPIED" : "COPY DEBUG JSON"}
                  </button>
                  <button 
                    onClick={exportDebugJson}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-gray-400 hover:text-white transition-all uppercase tracking-widest font-bold shadow-lg shadow-black/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    EXPORT DEBUG JSON
                  </button>
                </div>
              </div>

              {/* Advanced Debug Section (Collapsed Raw Data) */}
              <div className="border-t border-white/10 pt-10">
                <button 
                  onClick={() => setIsAdvancedDebugOpen(!isAdvancedDebugOpen)}
                  className="flex items-center gap-2 text-[10px] font-mono text-gray-600 uppercase tracking-[0.25em] hover:text-gray-400 transition-colors py-2"
                >
                  <Activity className={`w-3.5 h-3.5 transition-transform duration-300 ${isAdvancedDebugOpen ? 'rotate-90 text-gear-accent' : ''}`} />
                  Advanced Debug {isAdvancedDebugOpen ? '(-)' : '(+)'}
                </button>

                <AnimatePresence>
                  {isAdvancedDebugOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-8 mt-6"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.25em] flex items-center gap-2">
                            <Cpu className="w-3.5 h-3.5 text-gear-accent" />
                            RAW GEMINI TONE PLAN
                          </h3>
                        </div>
                        <pre style={{ color: "#4ade80", fontSize: "11px" }} className="bg-black/80 p-6 rounded-2xl border border-white/5 font-mono overflow-auto max-h-[600px] shadow-2xl">
                          {JSON.stringify(toneResult, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-24 opacity-40">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center mb-8">
                 <Music className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-gray-500 font-display font-bold text-xl uppercase tracking-widest mb-3">Modular Engine Offline</h3>
              <p className="text-[10px] text-gray-600 uppercase leading-relaxed tracking-[0.25em] font-mono max-w-sm">
                Provide a tone description or reference signal to initialize signal chain synthesis.
              </p>
            </div>
          )}
        </div>
      </main>


      {/* FOOTER: System Status Bar */}
      <footer className="h-[35px] border-t border-white/10 shrink-0 bg-[#050505] flex items-center justify-between px-8 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full shadow-[0_0_8px_#f59e0b]" />
            <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Signal Connection: Secured</span>
          </div>
          <div className="w-px h-3 bg-white/5" />
          <div className="text-[9px] font-mono text-gray-700 uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Core Clock: 128.00 BPM // Phase Locked
          </div>
        </div>
        <div className="flex items-center gap-6 text-[9px] font-mono text-gray-500 uppercase">
          {toneResult && `CONFIDENCE: ${toneResult.confidence}% // V2.0_MASTER`}
        </div>
        <div className="flex items-center gap-6">
          <div className="text-[9px] font-mono text-gray-800 uppercase tracking-[0.6em] font-bold">
            Tone Translator // Pro Edition 2026
          </div>
        </div>
      </footer>

      {/* Export Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsExportModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-gear-card border border-gear-accent/30 rounded-2xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(255,165,0,0.15)]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-gear-accent/20 rounded-lg flex items-center justify-center border border-gear-accent/30">
                  <Download className="text-gear-accent w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white tracking-tight">Export Preset</h3>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Amplitube 5 (.at5p) Specification</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2 tracking-widest pl-1">Preset Filename</label>
                  <div className="relative">
                    <input 
                      autoFocus
                      type="text" 
                      value={exportFilename}
                      onChange={(e) => setExportFilename(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleExport(exportFilename)}
                      className="w-full bg-gear-bg border border-gear-border rounded-xl px-4 py-3 text-sm focus:border-gear-accent focus:ring-1 focus:ring-gear-accent outline-none text-white font-mono"
                      placeholder="My_Awesome_Tone"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-600">.AT5P</span>
                  </div>
                </div>
                
                <div className="bg-gear-accent/5 rounded-lg p-3 border border-gear-accent/10">
                  <div className="flex gap-2">
                    <Info className="w-3 h-3 text-gear-accent shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-gear-accent/80 leading-relaxed italic">
                        { 'showSaveFilePicker' in window 
                          ? "Modern Browser Detected: The system will attempt to show a location picker." 
                          : "Legacy Browser: The file will save directly to your Downloads folder." }
                      </p>
                      <p className="text-[9px] text-gray-500 font-mono leading-tight">
                        PRO TIP: If the location picker doesn't appear, try opening this app in a <strong>New Tab</strong> to bypass iframe security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-3 rounded-xl border border-gear-border text-gray-400 font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleExport(exportFilename)}
                  className="px-4 py-3 rounded-xl bg-gear-accent text-black font-bold text-xs uppercase tracking-widest hover:bg-yellow-500 transition-colors shadow-lg shadow-gear-accent/20"
                >
                  Save Preset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Removed Debug Panel (now integrated into main) */}
    </div>
  );
}

