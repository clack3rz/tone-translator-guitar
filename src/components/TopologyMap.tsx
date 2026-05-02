import React from 'react';
import { GitCommit, GitPullRequest, GitMerge } from 'lucide-react';

interface TopologyMapProps {
  type?: 'Serial' | 'AB Parallel' | 'DI Blend';
}

export const TopologyMap: React.FC<TopologyMapProps> = ({ type = 'Serial' }) => {
  const isParallel = type !== 'Serial';

  return (
    <div className="bg-black/40 border border-gear-border/50 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {type === 'Serial' ? <GitCommit className="w-3 h-3 text-gear-accent" /> : <GitPullRequest className="w-3 h-3 text-gear-accent" />}
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Routing Topology</span>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${isParallel ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-gear-accent/10 border-gear-accent/30 text-gear-accent'}`}>
          {type.toUpperCase()}
        </span>
      </div>

      <div className="relative h-12 flex items-center justify-center">
        {type === 'Serial' ? (
          <div className="flex items-center gap-6">
            <div className="w-4 h-4 rounded-full border border-gear-accent shadow-[0_0_10px_rgba(59,130,245,0.4)]" />
            <div className="w-20 h-[2px] bg-gradient-to-r from-gear-accent to-gear-accent/40" />
            <div className="w-4 h-4 rounded-full border border-gear-accent/40" />
            <div className="w-20 h-[2px] bg-gradient-to-r from-gear-accent/40 to-transparent" />
          </div>
        ) : type === 'AB Parallel' ? (
          <div className="flex items-center w-full max-w-[200px] relative">
            <div className="w-4 h-4 rounded-full border border-gear-accent z-10 bg-gear-bg" />
            {/* Split */}
            <svg className="absolute left-2 w-full h-12 overflow-visible" viewBox="0 0 100 40">
              <path d="M0 20 L20 20 Q30 20 30 10 L80 10" fill="none" stroke="var(--color-gear-accent)" strokeWidth="1.5" strokeOpacity="0.4" />
              <path d="M0 20 L20 20 Q30 20 30 30 L80 30" fill="none" stroke="var(--color-gear-accent)" strokeWidth="1.5" strokeOpacity="0.4" />
              <circle cx="85" cy="10" r="3" fill="var(--color-gear-accent)" opacity="0.6" />
              <circle cx="85" cy="30" r="3" fill="var(--color-gear-accent)" opacity="0.6" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center w-full max-w-[200px] relative">
             {/* DI Blend Look */}
             <div className="w-4 h-4 rounded-full border border-gear-accent z-10 bg-gear-bg" />
             <svg className="absolute left-2 w-full h-12 overflow-visible" viewBox="0 0 100 40">
              <path d="M0 20 L40 20 L90 20" fill="none" stroke="var(--color-gear-accent)" strokeWidth="1.5" strokeOpacity="0.6" />
              <path d="M10 20 Q20 20 20 35 L90 35" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="2 2" />
              <circle cx="95" cy="20" r="2" fill="var(--color-gear-accent)" />
              <text x="30" y="38" fill="white" fillOpacity="0.3" fontSize="6px" fontFamily="monospace">DI DRY PATH</text>
            </svg>
          </div>
        )}
      </div>

      <p className="text-[8px] text-gray-600 font-mono italic leading-none text-center">
        {type === 'Serial' ? 'PURE SIGNAL INTEGRITY - ZERO PHASE SHIFT' : 
         type === 'AB Parallel' ? 'COMPLEX CHARACTER BLENDING - AHEAD OF MIX' : 
         'DI FOUNDATION - MAX LOW-END RECOVERY'}
      </p>
    </div>
  );
};
