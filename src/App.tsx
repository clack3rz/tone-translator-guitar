import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Upload, 
  Settings2, 
  Zap, 
  Speaker, 
  Mic2, 
  Waves,
  ChevronRight,
  Info,
  Loader2,
  Guitar,
  Server,
  Box,
  Sliders,
  Home,
  Cpu,
  Download,
  Activity,
  ArrowRight,
  Copy,
  Check,
  Target,
  FileJson,
  ShieldCheck
} from 'lucide-react';
import { translateTone } from './services/geminiService';
import { ToneResult, GearLink, SignalChainElement } from './types';
import { parseAt5p, comparePresets, PresetData } from './services/presetParser';
import { exportAt5p, getExportData, getExportDebugData } from './services/presetExporter';
import { GearSilhouette } from './components/GearSilhouette';
import { ConsoleMixer } from './components/ConsoleMixer';
import { TopologyMap } from './components/TopologyMap';
import { 
  AMP_MANIFEST, 
  STOMP_MANIFEST, 
  CAB_MANIFEST, 
  ROOM_MANIFEST, 
  RACK_MANIFEST,
  TONEX_MANIFEST,
  KnobDefinition 
} from './services/gearManifest';
import { getGearIdentity } from './services/gearIdentity';

const Knob = ({ name, value, midiCC, min = 0, max = 10, unit = "" }: { name: string; value: number | string; midiCC?: number; min?: number; max?: number; unit?: string }) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value as string);
  const isNumeric = !isNaN(numericValue as number);
  const isSelection = max === min;
  const isToggle = min === 0 && max === 1 && !unit && !name.toLowerCase().includes('distance');
  
  // Calculate rotation based on min/max
  const range = max - min;
  const normalizedValue = isNumeric && range !== 0 ? ((numericValue as number) - min) / range : 0;
  const rotation = normalizedValue * 270 - 135;

  let displayValue = value;
  if (isToggle) {
    displayValue = numericValue >= 0.5 ? 'ON' : 'OFF';
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`knob-container relative ${isSelection ? 'border-gear-accent/40 bg-gear-accent/5' : ''} ${isToggle ? 'scale-90 opacity-80' : ''}`}>
        {!isSelection && isNumeric ? (
          <div 
            className="knob-indicator" 
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isToggle ? (
              <div className={`w-2 h-2 rounded-full ${numericValue >= 0.5 ? 'bg-gear-accent shadow-[0_0_8px_rgba(255,165,0,0.6)]' : 'bg-gray-800'}`} />
            ) : (
              <Settings2 className={`w-4 h-4 ${isSelection ? 'text-gear-accent' : 'text-gear-accent/30'}`} />
            )}
          </div>
        )}
        <div className={`knob-center relative z-10 ${isSelection ? 'bg-gear-accent/20 border-gear-accent/30' : ''} ${isToggle ? 'bg-black/40' : ''}`} />
        <div className="absolute inset-0 rounded-full border border-gear-border/30 pointer-events-none" />
      </div>
      <span className="text-[7.5px] uppercase font-mono text-gray-400 group-hover:text-white transition-colors leading-none mt-1 text-center truncate w-14">{name}</span>
      <span className="text-[10px] font-bold leading-none text-center max-w-[80px] truncate text-white mt-0.5">
        {displayValue}{isNumeric && !isToggle && !String(value).includes(unit) && unit}
      </span>
      {midiCC !== undefined && (
        <span className="text-[7px] font-mono text-gear-accent/80 font-bold mt-0.5">CC:{midiCC}</span>
      )}
    </div>
  );
};

const SignalConnector = () => (
  <div className="signal-connection shrink-0">
    <div className="signal-line" />
    <div className="signal-dot shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
  </div>
);

const GearCard = ({ link }: { link: SignalChainElement }) => {
  const Icon = {
    pedal: Waves,
    amp: Speaker,
    cab: Box,
    rack: Server
  }[link.type] || Box;

  const renderKnobs = () => {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(link.settings).map(([name, value], i) => (
          <Knob 
            key={`knob-${link.name}-${i}`} 
            name={name} 
            value={value as any}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      layout
      className={`hardware-card hardware-card-screws-bottom shrink-0 shadow-2xl ${
        link.type === 'cab' || link.type === 'rack' ? 'min-w-[340px]' : 'min-w-[200px]'
      }`}
    >
      <div className="flex items-center justify-between mb-3 border-b border-gear-border/50 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-gear-bg/50 border border-gear-border">
            <Icon className="w-3.5 h-3.5 text-gear-accent" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest leading-none mb-0.5">{link.type.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex gap-1.5 px-4">
          <div className="led-indicator led-on" />
        </div>
      </div>
      
      <h3 className="text-xs font-display font-bold mb-3 text-white line-clamp-1 uppercase tracking-tight">{link.name}</h3>
      
      {/* Visual Depiction Wrapper */}
      <div className="mb-4 bg-gear-bg/30 rounded-lg p-6 border border-gear-border/20 flex items-center justify-center min-h-[90px] overflow-hidden relative shadow-inner group/silhouette">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
        <GearSilhouette type={link.type as any} model={link.name} />
      </div>
      
      {renderKnobs()}
    </motion.div>
  );
};

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
 
  const getCurrentChain = () => {
    if (!toneResult) return [];
    // Variations are handled differently now or not at all in the new schema
    return toneResult.signal_chain;
  };

  const currentChain = getCurrentChain();
  const activeGear = currentChain.find(l => l.name === activeGearId) || currentChain[0];

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
      const data = getExportData(toneResult, getCurrentChain());

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
        youtubeUrl || undefined
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
    const debug = getExportDebugData(toneResult, getCurrentChain());
    navigator.clipboard.writeText(JSON.stringify(debug, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const exportDebugJson = () => {
    if (!toneResult) return;
    const debug = getExportDebugData(toneResult, getCurrentChain());
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

  const getSettingsString = (link: SignalChainElement) => {
    return Object.entries(link.settings).slice(0, 4).map(([n, v]) => `${n}: ${v}`).join(' | ');
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
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-xs focus:border-gear-accent outline-none transition-all placeholder:text-gray-600 font-mono"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Sliders className="w-3.5 h-3.5 text-gray-700" />
            </div>
          </div>
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
          {toneResult && (
            <button 
              onClick={initiateExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gear-accent/30 text-gear-accent font-bold text-[10px] hover:bg-gear-accent hover:text-black transition-all uppercase tracking-widest"
            >
              <Download className="w-3.5 h-3.5" />
              EXPORT .AT5P
            </button>
          )}
          <div className="w-px h-4 bg-white/10" />
          <div className="text-[9px] font-mono text-gray-500 uppercase flex items-center gap-2 pr-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            System Live
          </div>
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
        </div>
      )}
      <section className="h-[140px] border-b border-white/10 relative bg-[#0a0a0a] shrink-0">
        <div className={`absolute top-1/2 left-0 w-full h-[2.5px] -translate-y-1/2 pointer-events-none z-0 transition-colors duration-500 ${
          'bg-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.8)]'
        }`} />
        
        <div className="flex items-center gap-12 px-12 h-full overflow-x-auto scrollbar-hide relative z-10">
          {!toneResult && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[10px] text-gray-700 uppercase tracking-[0.6em] animate-pulse font-mono">Awaiting Input Signal Initialization...</p>
            </div>
          )}
          {currentChain.map((link, i) => {
            const isActive = (activeGearId === link.name) || (!activeGearId && i === 0);
            const NodeIcon = {
              pedal: Waves,
              amp: Speaker,
              cab: Box,
              rack: Server
            }[link.type] || Box;

            return (
              <div key={link.name} className="flex items-center gap-12 group h-full">
                <button 
                  onClick={() => setActiveGearId(link.name)}
                  className={`relative w-[75px] h-[75px] bg-[#111] border rounded-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 group ${
                    isActive 
                      ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-110 z-20 bg-[#1a1a1a]' 
                      : 'border-white/10 hover:border-white/40'
                  }`}
                >
                  <div className={`absolute -top-3 -left-3 w-6 h-6 rounded-full bg-black border ${isActive ? 'border-gear-accent' : 'border-white/10'} flex items-center justify-center`}>
                    <span className="text-[8px] font-mono text-gray-500">{i + 1}</span>
                  </div>
                  <NodeIcon className={`w-8 h-8 transition-all ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono text-gray-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {link.name}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <main className="flex-1 flex flex-col min-h-0">
        {/* 3. MIDDLE-TIER: Technical Manifest */}
        <section className="h-[200px] bg-black/40 border-b border-white/5 overflow-y-auto shrink-0 scrollbar-thin">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-[#050505] z-30 shadow-md">
              <tr className="border-b border-white/10">
                <th className="px-8 py-2 text-[10px] font-mono text-gray-600 uppercase tracking-widest w-24">Index</th>
                <th className="px-8 py-2 text-[10px] font-mono text-gray-600 uppercase tracking-widest w-[30%]">Hardware Model</th>
                <th className="px-8 py-2 text-[10px] font-mono text-gray-600 uppercase tracking-widest w-40">System Type</th>
                <th className="px-8 py-2 text-[10px] font-mono text-gray-600 uppercase tracking-widest italic">Live Status / Parameter Digest</th>
              </tr>
            </thead>
            <tbody>
              {toneResult && currentChain.map((link, i) => (
                <tr 
                  key={`manifest-${link.name}`}
                  onClick={() => setActiveGearId(link.name)}
                  className={`group border-b border-white/[0.03] cursor-pointer transition-colors ${
                    (activeGearId === link.name || (!activeGearId && i === 0)) ? 'bg-gear-accent/[0.08]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <td className="px-8 py-3 text-xs font-mono text-gray-600 tracking-tighter">0{i + 1} // AD_L</td>
                  <td className="px-8 py-3 font-display font-bold text-xs uppercase group-hover:text-gear-accent transition-colors tracking-tight">
                    {link.name}
                  </td>
                  <td className="px-8 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono border border-white/10 px-2 py-0.5 rounded text-gray-500 uppercase">
                        {link.type}
                      </span>
                      {i === 0 && <span className="w-1.5 h-1.5 bg-gear-accent rounded-full animate-pulse shadow-[0_0_5px_var(--color-gear-accent)]" />}
                    </div>
                  </td>
                  <td className="px-8 py-3 text-[10px] font-mono text-gray-500 tracking-tight truncate opacity-80 group-hover:opacity-100 italic">
                    {getSettingsString(link)}
                  </td>
                </tr>
              ))}
              {!toneResult && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-gray-800 text-[10px] font-mono uppercase tracking-[0.5em]">
                    Rig architecture not initialized.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* 4. BOTTOM-TIER: Gear Inspector */}
        <section className="flex-1 bg-[#080808] relative min-h-0 flex overflow-hidden">
          {/* Metadata Sidebar (Vertical Real Estate Utilization) */}
          <div className="w-[320px] border-r border-white/5 p-8 bg-black/20 overflow-y-auto shrink-0 scrollbar-hide">
             <div className="mb-10">
               <h3 className="text-[10px] font-mono text-gray-600 uppercase mb-4 tracking-[0.25em] flex items-center gap-2">
                 <Activity className="w-3.5 h-3.5 text-gear-accent" />
                 Rig Intelligence
               </h3>
               <div className="bg-white/[0.02] rounded-xl p-5 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 uppercase font-mono">Engine Version</span>
                    <span className="text-[9px] font-bold text-gear-accent font-mono">PRO_1.5</span>
                  </div>
                   <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-500 uppercase font-mono">Confidence Level</span>
                      <span className="text-[9px] font-bold text-white font-mono">
                        {toneResult ? toneResult.confidence : "0"}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gear-accent" 
                        initial={{ width: 0 }}
                        animate={{ width: toneResult ? `${toneResult.confidence}%` : 0 }}
                      />
                    </div>
                  </div>
                  <div className="h-px bg-white/5" />
                  <p className="text-[11px] text-gray-400 italic font-serif leading-relaxed line-clamp-6 opacity-70 hover:opacity-100 transition-opacity cursor-default">
                    {toneResult?.engineering_notes.gain_strategy || "Awaiting source analysis for tone architectural generation."}
                  </p>
               </div>
             </div>

             <div className="space-y-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[9px] font-mono text-gray-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                      <Target className="w-3 h-3 text-red-500" />
                      1. Target Reference
                    </h4>
                    <div 
                      {...getTargetRootProps()} 
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        isTargetDragActive ? 'border-gear-accent bg-gear-accent/[0.03]' : 'border-white/5 hover:border-white/10 active:border-gear-accent/40'
                      }`}
                    >
                      <input {...getTargetInputProps()} />
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2 border border-white/10 group-hover:border-gear-accent/20">
                        <Mic2 className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tight truncate max-w-[180px] mx-auto">
                        {targetAudioFile ? targetAudioFile.name : "Isolated Track"}
                      </p>
                    </div>
                    {targetAudioFile && (
                      <button 
                        onClick={() => setTargetAudioFile(null)}
                        className="mt-2 text-[8px] text-gray-600 hover:text-red-400 uppercase font-mono tracking-widest block mx-auto underline underline-offset-2"
                      >
                        Clear Target
                      </button>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[9px] font-mono text-gray-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                       <Activity className="w-3 h-3 text-blue-500" />
                       2. Current Recording
                    </h4>
                    <div 
                      {...getRecordingRootProps()} 
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        isRecordingDragActive ? 'border-gear-accent bg-gear-accent/[0.03]' : 'border-white/5 hover:border-white/10 active:border-gear-accent/40'
                      }`}
                    >
                      <input {...getRecordingInputProps()} />
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-2 border border-white/10 group-hover:border-gear-accent/20">
                        <Waves className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tight truncate max-w-[180px] mx-auto">
                        {recordingAudioFile ? recordingAudioFile.name : "Amplitube Out"}
                      </p>
                    </div>
                    {recordingAudioFile && (
                      <button 
                        onClick={() => setRecordingAudioFile(null)}
                        className="mt-2 text-[8px] text-gray-600 hover:text-red-400 uppercase font-mono tracking-widest block mx-auto underline underline-offset-2"
                      >
                        Clear Recording
                      </button>
                    )}
                  </div>

                  {userPreset ? (
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-[9px] font-mono text-gray-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                         <FileJson className="w-3 h-3 text-gear-accent" />
                         3. Base Preset (.at5p)
                      </h4>
                      <div className="bg-gear-accent/5 rounded-lg p-3 border border-gear-accent/10 mb-2">
                        <p className="text-[9px] text-gear-accent font-bold uppercase truncate">{userPreset.metadata.presetName}</p>
                      </div>
                      <button 
                        onClick={() => { setUserPreset(null); setDiffs([]); }}
                        className="text-[8px] text-gray-600 hover:text-red-400 transition-colors uppercase font-mono tracking-widest underline underline-offset-2"
                      >
                        Remove Preset
                      </button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-[9px] font-mono text-gray-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                         <FileJson className="w-3 h-3 text-gray-600" />
                         3. Base Preset (Optional)
                      </h4>
                      <div 
                        {...getPresetRootProps()} 
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                          isPresetDragActive ? 'border-gear-accent bg-gear-accent/[0.03]' : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        <input {...getPresetInputProps()} />
                        <p className="text-[8px] text-gray-600 uppercase font-bold tracking-tight">Drop .at5p file here</p>
                      </div>
                    </div>
                  )}

                  {toneResult?.tone_summary && (
                    <div className="pt-6 border-t border-white/5">
                      <h4 className="text-[10px] font-mono text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                         <Activity className="w-3.5 h-3.5 text-gear-accent" />
                         Spectral Analysis
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {Object.entries(toneResult.tone_summary).map(([key, val]) => (
                          <div key={key}>
                            <p className="text-[7px] text-gray-600 uppercase font-mono mb-0.5">{key.replace('_', ' ')}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {toneResult?.engineering_notes && (
                    <div className="pt-6 border-t border-white/5">
                      <h4 className="text-[10px] font-mono text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                         <ShieldCheck className="w-3.5 h-3.5 text-gear-accent" />
                         Engineering Strategy
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[8px] text-gray-600 uppercase font-mono mb-2 tracking-tighter">Gain Strategy</p>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-white/5 rounded text-[9px] text-gray-400 border border-white/5 line-clamp-2">
                              {toneResult.engineering_notes.gain_strategy}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-[8px] text-gray-600 uppercase font-mono mb-1">Noise Control</p>
                          <p className="text-[9px] text-gray-400">
                             {toneResult.engineering_notes.noise_control}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] text-gray-600 uppercase font-mono mb-1">EQ Strategy</p>
                          <p className="text-[9px] text-gray-400">
                             {toneResult.engineering_notes.eq_strategy}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {diffs.length > 0 && (
                    <div className="pt-6 border-t border-white/5">
                      <h4 className="text-[10px] font-mono text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                         <Zap className="w-3.5 h-3.5 text-gear-accent" />
                         Tuning Deltas
                      </h4>
                      <div className="space-y-3">
                        {diffs.map((delta, i) => (
                          <div key={i} className="flex gap-2">
                             <div className="w-1 h-1 rounded-full bg-gear-accent mt-1.5 shrink-0" />
                             <p className="text-[10px] text-gray-500 leading-relaxed italic">{delta}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
             </div>
          </div>

          {/* Large Focused Inspector View */}
          <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.03)_0%,transparent_70%)] relative">
             <div className="h-full flex items-center justify-center">
               <AnimatePresence mode="wait">
                 {activeGear ? (
                   <motion.div
                     key={activeGear.name}
                     initial={{ opacity: 0, scale: 0.97, y: 15 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.97, y: 15 }}
                     transition={{ duration: 0.3, ease: "easeOut" }}
                     className="w-full max-w-2xl px-12 pb-24"
                   >
                     <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
                        <div>
                          <div className="flex items-center gap-4">
                             <span className="text-gray-800 font-mono text-3xl font-black">
                              0{(currentChain.findIndex(i => i.name === activeGear.name) || 0) + 1}
                            </span>
                            <div>
                              <h2 className="text-3xl font-display font-bold text-white tracking-tighter uppercase mb-1">
                                {activeGear.name}
                              </h2>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-gear-accent/80 uppercase tracking-[0.2em] font-bold">Hardware Focus</span>
                                <div className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest italic">{activeGear.type}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="flex flex-col items-end">
                              <span className="text-[9px] font-mono text-gray-700 uppercase leading-none mb-1.5 tracking-widest">Signal Unity</span>
                              <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                 <motion.div 
                                    className="h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" 
                                    initial={{ width: 0 }}
                                    animate={{ width: "92%" }}
                                 />
                              </div>
                           </div>
                           <button onClick={copyManifestAsText} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-gear-accent/40 hover:bg-gear-accent/5 transition-all text-gray-500 hover:text-gear-accent">
                             {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                           </button>
                        </div>
                     </div>

                     <div className="scale-110 origin-top">
                        <GearCard link={activeGear} />
                     </div>
                   </motion.div>
                 ) : (
                   <div className="flex flex-col items-center justify-center text-center max-w-sm">
                     <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center mb-8 bg-black/40">
                        <Cpu className="w-10 h-10 text-gray-800 animate-pulse" />
                     </div>
                     <h3 className="text-gray-600 font-display font-bold text-xl uppercase tracking-widest mb-3">Modular Isolation</h3>
                     <p className="text-[10px] text-gray-700 uppercase leading-relaxed tracking-[0.25em] font-mono">Select a hardware node from the master signal ribbon above to initialize the gear inspector.</p>
                   </div>
                 )}
               </AnimatePresence>
             </div>
          </div>
        </section>
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

      {/* Debug Panel */}
      {toneResult && (
        <div className="bg-[#050505] p-8 border-t border-white/10 shrink-0 overflow-auto max-h-[600px] space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.25em] flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-gear-accent" />
                RAW GEMINI TONE PLAN
              </h3>
            </div>
            <pre style={{ color: "lime", fontSize: "11px" }} className="bg-black/50 p-4 rounded border border-white/5 font-mono overflow-auto">
              {JSON.stringify(toneResult, null, 2)}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.25em] flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                AT5 EXPORT DEBUG
              </h3>
              <div className="flex gap-4">
                <button 
                  onClick={copyExportDebug}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-mono text-gray-400 hover:text-white transition-all uppercase tracking-widest"
                >
                  <Copy className="w-3 h-3" />
                  {isCopied ? "COPIED" : "COPY DEBUG"}
                </button>
                <button 
                  onClick={exportDebugJson}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-mono text-gray-400 hover:text-white transition-all uppercase tracking-widest"
                >
                  <Download className="w-3 h-3" />
                  EXPORT DEBUG JSON
                </button>
              </div>
            </div>
            <pre style={{ color: "#3b82f6", fontSize: "11px" }} className="bg-black/50 p-4 rounded border border-white/5 font-mono overflow-auto">
              {JSON.stringify(getExportDebugData(toneResult, getCurrentChain()), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

