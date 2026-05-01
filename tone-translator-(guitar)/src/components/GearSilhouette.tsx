import React from 'react';

interface SilhouetteProps {
  type: string;
  model: string;
  className?: string;
}

export const GearSilhouette: React.FC<SilhouetteProps> = ({ type, model, className = "" }) => {
  const isHighGain = model.toLowerCase().includes('rectifier') || model.toLowerCase().includes('5150') || model.toLowerCase().includes('high gain');
  const isVintage = model.toLowerCase().includes('fender') || model.toLowerCase().includes('59') || model.toLowerCase().includes('vintage');

  const renderSilhouette = () => {
    const uniqueId = React.useId().replace(/:/g, '');
    
    switch (type) {
      case 'Stomp':
      case 'EQ':
        if (type === 'EQ' || model.toLowerCase().includes('eq')) {
          // Rack EQ look - High End / Studio Grade
          return (
            <svg viewBox="0 0 120 40" className={`w-full h-full ${className}`}>
              <defs>
                <linearGradient id={`grad-rack-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a1a1a" />
                  <stop offset="100%" stopColor="#0a0a0a" />
                </linearGradient>
              </defs>
              {/* Main Chassis */}
              <rect x="5" y="5" width="110" height="30" fill={`url(#grad-rack-${uniqueId})`} stroke="#333" strokeWidth="0.5" />
              {/* Rack Ears */}
              <rect x="0" y="5" width="5" height="30" fill="#222" />
              <rect x="115" y="5" width="5" height="30" fill="#222" />
              {/* Metal Screws */}
              <circle cx="2.5" cy="10" r="1.2" fill="#444" />
              <circle cx="2.5" cy="30" r="1.2" fill="#444" />
              <circle cx="117.5" cy="10" r="1.2" fill="#444" />
              <circle cx="117.5" cy="30" r="1.2" fill="#444" />
              {/* Faceplate Details */}
              <rect x="15" y="10" width="90" height="20" rx="1" fill="#111" stroke="#222" strokeWidth="0.5" />
              {/* Faders */}
              {[25, 35, 45, 55, 65, 75, 85, 95].map((x, i) => (
                <g key={i}>
                  <line x1={x} y1="12" x2={x} y2="28" stroke="#333" strokeWidth="1" />
                  <rect x={x - 2} y={15 + (i % 3) * 3} width="4" height="2" fill="var(--color-gear-accent)" opacity="0.8" />
                </g>
              ))}
              {/* Vents */}
              <line x1="105" y1="12" x2="110" y2="12" stroke="#444" strokeWidth="0.5" />
              <line x1="105" y1="15" x2="110" y2="15" stroke="#444" strokeWidth="0.5" />
            </svg>
          );
        }
        
        // Generic Pedal Look - Drive/Stomp
        const pedalColor = model.toLowerCase().includes('drive') || model.toLowerCase().includes('scream') ? 'var(--color-gear-accent)' : '#222';
        return (
          <svg viewBox="0 0 50 80" className={`w-14 h-22 ${className}`}>
            <defs>
              <linearGradient id={`grad-pedal-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={pedalColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {/* Box Body */}
            <rect x="5" y="5" width="40" height="70" rx="4" fill={`url(#grad-pedal-${uniqueId})`} stroke="#444" strokeWidth="1" />
            {/* Control Region */}
            <rect x="10" y="12" width="30" height="25" rx="2" fill="#000" fillOpacity="0.3" stroke="#333" strokeWidth="0.5" />
            {/* Knobs */}
            <circle cx="18" cy="20" r="4" fill="#222" stroke="#444" strokeWidth="0.5" />
            <circle cx="32" cy="20" r="4" fill="#222" stroke="#444" strokeWidth="0.5" />
            <circle cx="25" cy="30" r="3" fill="#222" stroke="#444" strokeWidth="0.5" />
            {/* Footswitch */}
            <circle cx="25" cy="62" r="8" fill="#1a1a1a" stroke="#444" strokeWidth="1.5" />
            <circle cx="25" cy="62" r="3" fill="#333" />
            {/* Power LED */}
            <circle cx="25" cy="45" r="2" fill="var(--color-gear-accent)" className="animate-pulse shadow-lg" />
          </svg>
        );

      case 'Amp':
        return (
          <svg viewBox="0 0 120 50" className={`w-full h-full ${className}`}>
            <defs>
              <pattern id={`pattern-tolex-${uniqueId}`} width="4" height="4" patternUnits="userSpaceOnUse">
                <rect width="4" height="4" fill="#0c0c0c" />
                <circle cx="1" cy="1" r="0.5" fill="#151515" />
              </pattern>
            </defs>
            {/* Outer Head Shell */}
            <rect x="2" y="2" width="116" height="46" rx="3" fill={`url(#pattern-tolex-${uniqueId})`} stroke="#000" strokeWidth="1" />
            {/* Front Panel Recess */}
            <rect x="10" y="10" width="100" height="30" rx="1" fill="#1a1a1a" />
            {/* Gold/Silver Faceplate */}
            <rect x="12" y="22" width="96" height="15" rx="0.5" fill={isVintage ? '#b5a642' : '#2a2a2a'} fillOpacity={isVintage ? '0.2' : '0.8'} stroke="#333" strokeWidth="0.5" />
            {/* Grille Cloth Area */}
            <rect x="15" y="12" width="90" height="8" rx="0.5" fill="#000" fillOpacity="0.5" />
            {/* Knobs */}
            {[20, 32, 44, 56, 68, 80, 92].map((x, i) => (
              <circle key={i} cx={x} cy="30" r="3" fill="#000" stroke="#444" strokeWidth="0.5" />
            ))}
            {/* Inputs/Switches */}
            <rect x="102" y="27" width="4" height="6" fill="#444" rx="0.5" />
            {/* Leather Handle */}
            <path d="M45 2 L45 0 Q60 -4 75 0 L75 2" fill="none" stroke="#222" strokeWidth="3" />
          </svg>
        );

      case 'Cab':
        return (
          <svg viewBox="0 0 80 80" className={`w-20 h-20 ${className}`}>
            <defs>
              <linearGradient id={`grad-cab-${uniqueId}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#050505" />
              </linearGradient>
            </defs>
            {/* Corner Protectors */}
            <rect x="5" y="5" width="70" height="70" rx="8" fill="#000" />
            {/* Main Cabinet */}
            <rect x="8" y="8" width="64" height="64" rx="2" fill={`url(#grad-cab-${uniqueId})`} stroke="#111" strokeWidth="1" />
            {/* Mesh/Grille */}
            <rect x="12" y="12" width="56" height="56" rx="1" fill="#000" fillOpacity="0.6" />
            {/* Speaker Silhouettes (Generic 4x12 Feel) */}
            <circle cx="26" cy="26" r="10" fill="#111" fillOpacity="0.5" stroke="#222" strokeWidth="0.5" />
            <circle cx="54" cy="26" r="10" fill="#111" fillOpacity="0.5" stroke="#222" strokeWidth="0.5" />
            <circle cx="26" cy="54" r="10" fill="#111" fillOpacity="0.5" stroke="#222" strokeWidth="0.5" />
            <circle cx="54" cy="54" r="10" fill="#111" fillOpacity="0.5" stroke="#222" strokeWidth="0.5" />
            {/* Mic Pulse (Active VIR) */}
            <circle cx="40" cy="40" r="5" fill="var(--color-gear-accent)" fillOpacity="0.1" className="animate-ping" />
            <circle cx="40" cy="40" r="2" fill="var(--color-gear-accent)" opacity="0.4" />
          </svg>
        );

      case 'Room':
        return (
          <svg viewBox="0 0 80 80" className={`w-20 h-20 ${className}`}>
            {/* Studio Floor Perspective */}
            <path d="M10 60 L40 75 L70 60 L70 20 L40 5 L10 20 Z" fill="#111" fillOpacity="0.3" stroke="#333" strokeWidth="1" />
            <path d="M10 20 L40 35 L70 20 M40 35 L40 75" fill="none" stroke="#222" strokeWidth="0.8" />
            {/* Sound Diffusers / Panels */}
            <rect x="50" y="25" width="10" height="25" fill="#222" stroke="#444" strokeWidth="0.5" transform="skewY(15)" />
            <rect x="20" y="25" width="10" height="25" fill="#222" stroke="#444" strokeWidth="0.5" transform="skewY(-15)" />
            {/* Floating Ambience Circles */}
            <circle cx="40" cy="20" r="12" fill="none" stroke="var(--color-gear-accent)" strokeOpacity="0.1" className="animate-pulse" />
          </svg>
        );

      case 'Rack':
        return (
          <svg viewBox="0 0 120 30" className={`w-full h-full ${className}`}>
            <rect x="0" y="0" width="120" height="30" fill="#111" rx="2" />
            <rect x="5" y="5" width="110" height="20" fill="#000" rx="1" stroke="#222" strokeWidth="0.5" />
            {/* VU Meter */}
            <rect x="15" y="8" width="20" height="14" rx="1" fill="#1a1a1a" stroke="#333" />
            <line x1="17" y1="20" x2="33" y2="10" stroke="var(--color-gear-accent)" strokeWidth="1" strokeOpacity="0.6" className="animate-pulse" />
            {/* Knobs */}
            <circle cx="50" cy="15" r="4" fill="#222" stroke="#444" strokeWidth="0.5" />
            <circle cx="65" cy="15" r="4" fill="#111" stroke="#333" strokeWidth="0.5" />
            {/* Digital Display */}
            <rect x="85" y="10" width="25" height="10" rx="0.5" fill="#0a0a0a" stroke="#222" />
            <path d="M88 15 L95 15 M90 12 L90 18" stroke="var(--color-gear-accent)" strokeWidth="0.5" strokeOpacity="0.4" />
          </svg>
        );

      case 'TONEX':
        return (
          <svg viewBox="0 0 100 80" className={`w-24 h-20 ${className}`}>
            <rect x="5" y="5" width="90" height="70" rx="5" fill="#151515" stroke="#333" strokeWidth="1" />
            {/* Premium Glass Screen */}
            <rect x="15" y="15" width="70" height="25" rx="2" fill="#000" stroke="var(--color-gear-accent)" strokeWidth="0.5" strokeOpacity="0.2" />
            {/* AI Modeling Waveform */}
            <path d="M20 27 Q30 35 40 27 T60 27 T80 27" fill="none" stroke="var(--color-gear-accent)" strokeWidth="1" strokeOpacity="0.8" className="animate-pulse" />
            {/* Modern Control Layout */}
            <circle cx="25" cy="55" r="8" fill="#222" stroke="#444" strokeWidth="1.5" />
            <circle cx="75" cy="55" r="8" fill="#222" stroke="#444" strokeWidth="1.5" />
            <rect x="45" y="50" width="10" height="10" rx="1" fill="#222" stroke="#444" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 30 30" className={`w-8 h-8 ${className}`}>
            <rect x="5" y="5" width="20" height="20" fill="currentColor" fillOpacity="0.1" />
          </svg>
        );
    }
  };

  return (
    <div className="flex items-center justify-center text-gear-accent/40 w-full hover:text-gear-accent/60 transition-colors duration-500">
      {renderSilhouette()}
    </div>
  );
};
