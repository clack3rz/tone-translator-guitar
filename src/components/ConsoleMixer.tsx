import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, Volume2, Mic2, Waves } from 'lucide-react';

interface ConsoleMixerProps {
  mic1Vol?: string | number;
  mic2Vol?: string | number;
  roomVol?: string | number;
  mic1Pan?: string | number;
  mic2Pan?: string | number;
  mic1Name?: string;
  mic2Name?: string;
}

export const ConsoleMixer: React.FC<ConsoleMixerProps> = ({ 
  mic1Vol = -6, 
  mic2Vol = -12, 
  roomVol = -18,
  mic1Pan = 0,
  mic2Pan = 0,
  mic1Name = "MIC 1",
  mic2Name = "MIC 2"
}) => {
  const parseVol = (v: any) => {
    const val = parseFloat(String(v));
    // Normalize -201 (mute) to 6dB scale for visual
    if (val <= -200) return 0;
    // Map -60 to 6dB range to 0-100%
    return Math.min(Math.max(((val + 60) / 66) * 100, 5), 100);
  };

  const channels = [
    { name: mic1Name, vol: mic1Vol, pan: mic1Pan, color: 'text-gear-accent', icon: <Mic2 className="w-3 h-3" /> },
    { name: mic2Name, vol: mic2Vol, pan: mic2Pan, color: 'text-indigo-400', icon: <Mic2 className="w-3 h-3" /> },
    { name: 'ROOM', vol: roomVol, pan: 0, color: 'text-amber-400', icon: <Waves className="w-3 h-3" /> }
  ];

  return (
    <div className="bg-black/40 border border-gear-border/50 rounded-xl p-4 shadow-inner">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="w-3 h-3 text-gear-accent" />
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Studio Console Mixer</span>
      </div>

      <div className="flex justify-between gap-6">
        {channels.map((ch, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-3">
            {/* Pan Knob (Mini) */}
            <div className="flex flex-col items-center gap-1 mb-1">
              <span className="text-[8px] text-gray-600 font-mono">PAN</span>
              <div className="w-4 h-4 rounded-full border border-gray-800 relative bg-black shadow-inner">
                <div 
                  className="absolute top-0 left-1/2 w-0.5 h-1.5 bg-gear-accent/40 -translate-x-1/2 origin-bottom"
                  style={{ transform: `translateX(-50%) rotate(${parseFloat(String(ch.pan)) * 1.5}deg)` }}
                />
              </div>
            </div>

            {/* Fader Track */}
            <div className="w-full h-32 bg-black/60 rounded-full relative border border-white/5 flex flex-col items-center py-2">
              <div className="absolute inset-0 flex flex-col items-center justify-between py-4 pointer-events-none opacity-20">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="w-4 h-[1px] bg-white/20" />
                ))}
              </div>
              
              {/* The Fader Knob */}
              <motion.div 
                initial={{ bottom: '0%' }}
                animate={{ bottom: `${parseVol(ch.vol)}%` }}
                transition={{ type: 'spring', damping: 20 }}
                className="absolute w-8 h-4 bg-gear-card border border-gear-border rounded shadow-lg z-10 flex flex-col items-center justify-center gap-0.5 group cursor-pointer"
              >
                <div className="w-4 h-[1px] bg-white/10" />
                <div className="w-4 h-[1px] bg-gear-accent/50" />
                <div className="w-4 h-[1px] bg-white/10" />
              </motion.div>
            </div>

            {/* Labels */}
            <div className="flex flex-col items-center gap-0.5">
              <div className={`p-1 rounded bg-black/40 ${ch.color} mb-1`}>
                {ch.icon}
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight text-center">{ch.name}</span>
              <span className="text-[8px] font-mono text-gear-accent">{ch.vol}dB</span>
            </div>
          </div>
        ))}

        {/* Master Meter */}
        <div className="flex flex-col items-center gap-3 border-l border-white/5 pl-6">
           <span className="text-[8px] text-gray-600 font-mono mb-1">LEVEL</span>
           <div className="w-6 h-32 bg-black/60 rounded border border-white/5 relative overflow-hidden flex flex-col-reverse p-0.5 gap-0.5">
             {[...Array(12)].map((_, j) => (
               <div 
                key={j} 
                className={`w-full h-1.5 rounded-sm ${j > 9 ? 'bg-red-500/40' : j > 7 ? 'bg-amber-500/40' : 'bg-gear-accent/20'}`} 
               />
             ))}
           </div>
           <div className="flex flex-col items-center">
             <Volume2 className="w-3 h-3 text-gray-500 mb-1" />
             <span className="text-[9px] font-bold text-gray-500">MASTER</span>
           </div>
        </div>
      </div>
    </div>
  );
};
