import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { HeirloomSpec } from '../game/rules.ts';
import { soundManager } from '../game/audio.ts';
import { haptics } from '../game/haptics.ts';

interface WaxSealCeremonyModalProps {
  heirloom: HeirloomSpec;
  parcelName: string;
  isDaily?: boolean;
  onComplete: () => void;
}

/**
 * Interactive 1-Tap Grand Wax-Seal Break Ceremony.
 * Fires between clearing the final satin ribbon and revealing the 100% Awakened Heirloom.
 */
export const WaxSealCeremonyModal: React.FC<WaxSealCeremonyModalProps> = ({
  heirloom,
  parcelName,
  isDaily = false,
  onComplete,
}) => {
  const [cracked, setCracked] = useState(false);

  const handleBreakSeal = useCallback(() => {
    if (cracked) return;
    setCracked(true);
    soundManager.playGrandWaxSealCrack();
    haptics.boxCompleted();
    window.setTimeout(() => {
      onComplete();
    }, 520);
  }, [cracked, onComplete]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleBreakSeal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleBreakSeal]);

  return (
    <div
      className="absolute inset-x-0 top-8 bottom-0 z-50 bg-[radial-gradient(circle_at_50%_44%,#412219_0%,#21130F_58%,#120A08_100%)] flex flex-col items-center justify-between px-5 py-7 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ceremony-title"
    >
      {/* Top Quiet Archivist Header */}
      <div className="text-center">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-300 font-bold">
          {isDaily ? 'Daily Royal Dispatch · Final Seal' : 'All Satin Ribbons Wound'}
        </div>
        <h2
          id="ceremony-title"
          className="font-game-display font-bold text-2xl text-[#FDF6EC] mt-1 leading-tight"
        >
          {cracked ? 'Royal Seal Broken!' : 'Break the Grand Seal'}
        </h2>
        <p className="text-xs text-[#DECBB9] mt-1">
          {parcelName} · {heirloom.name}
        </p>
      </div>

      {/* Interactive Tactile Crimson Wax Seal Centerpiece */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        <button
          type="button"
          onClick={handleBreakSeal}
          aria-label="Break the Grand Wax Seal to reveal the heirloom"
          className={`group relative w-52 h-52 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 cursor-pointer transition-transform duration-300 ${
            cracked ? 'scale-110' : 'hover:scale-105 active:scale-95'
          }`}
        >
          {/* Ambient Candlelight Halo */}
          <div
            className={`absolute inset-2 rounded-full transition-opacity duration-300 ${
              cracked
                ? 'bg-amber-300/35 opacity-100 scale-125'
                : 'bg-amber-500/20 opacity-85 animate-pulse'
            }`}
          />

          <svg
            viewBox="0 0 180 180"
            className="relative z-10 w-48 h-48 overflow-visible drop-shadow-[0_14px_28px_rgba(0,0,0,0.75)]"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="grandWaxGrad" cx="35%" cy="30%" r="72%">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="42%" stopColor="#E11D48" />
                <stop offset="85%" stopColor="#9F1239" />
                <stop offset="100%" stopColor="#4C0519" />
              </radialGradient>
              <linearGradient id="grandGoldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="55%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>

            {/* Crossed Satin Ribbon Stubs beneath Seal */}
            <rect x="8" y="76" width="164" height="28" rx="4" fill="#7F1D1D" stroke="#F59E0B" strokeWidth="1.5" opacity={cracked ? 0.35 : 0.9} />
            <rect x="76" y="8" width="28" height="164" rx="4" fill="#7F1D1D" stroke="#F59E0B" strokeWidth="1.5" opacity={cracked ? 0.35 : 0.9} />

            {/* Left Half of Grand Wax Seal (Splits left on crack) */}
            <g
              className="transition-all duration-500"
              style={{
                transform: cracked ? 'translate(-22px, -10px) rotate(-18deg)' : 'translate(0, 0)',
                opacity: cracked ? 0.35 : 1,
                transformOrigin: '90px 90px',
              }}
            >
              <path
                d="M 90 22 C 52 22, 22 52, 22 90 C 22 128, 52 158, 90 158 L 84 128 L 94 102 L 82 74 L 93 48 Z"
                fill="url(#grandWaxGrad)"
                stroke="#3A0714"
                strokeWidth="3"
              />
              <path
                d="M 90 36 A 54 54 0 0 0 90 144"
                fill="none"
                stroke="url(#grandGoldFoil)"
                strokeWidth="2.4"
                strokeOpacity="0.82"
              />
              <circle cx="62" cy="60" r="8" fill="#FFFFFF" fillOpacity="0.28" />
            </g>

            {/* Right Half of Grand Wax Seal (Splits right on crack) */}
            <g
              className="transition-all duration-500"
              style={{
                transform: cracked ? 'translate(22px, 10px) rotate(18deg)' : 'translate(0, 0)',
                opacity: cracked ? 0.35 : 1,
                transformOrigin: '90px 90px',
              }}
            >
              <path
                d="M 90 22 L 93 48 L 82 74 L 94 102 L 84 128 L 90 158 C 128 158, 158 128, 158 90 C 158 52, 128 22, 90 22 Z"
                fill="url(#grandWaxGrad)"
                stroke="#3A0714"
                strokeWidth="3"
              />
              <path
                d="M 90 36 A 54 54 0 0 1 90 144"
                fill="none"
                stroke="url(#grandGoldFoil)"
                strokeWidth="2.4"
                strokeOpacity="0.82"
              />
            </g>

            {/* Embossed Royal Post Crown Crest */}
            <g
              className="transition-all duration-300"
              style={{
                opacity: cracked ? 0 : 1,
                transform: cracked ? 'scale(1.25)' : 'scale(1)',
                transformOrigin: '90px 90px',
              }}
            >
              <path
                d="M 66 104 L 62 74 L 78 88 L 90 66 L 102 88 L 118 74 L 114 104 Z"
                fill="url(#grandGoldFoil)"
                stroke="#4C0519"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <rect x="66" y="106" width="48" height="7" rx="3" fill="#FEF08A" stroke="#4C0519" strokeWidth="1.6" />
            </g>

            {/* Glowing Golden Burst & Wax Shards on Crack */}
            {cracked && (
              <g>
                <circle cx="90" cy="90" r="24" fill="#FEF08A" fillOpacity="0.85" />
                <polygon points="90,14 96,42 84,42" fill="#FDE047" />
                <polygon points="90,166 96,138 84,138" fill="#FDE047" />
                <polygon points="14,90 42,84 42,96" fill="#FDE047" />
                <polygon points="166,90 138,84 138,96" fill="#FDE047" />
                <polygon points="38,44 52,56 42,64" fill="#E11D48" />
                <polygon points="142,136 128,124 138,116" fill="#E11D48" />
              </g>
            )}
          </svg>
        </button>

        <p className="text-xs font-mono text-amber-200 mt-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{cracked ? 'Lifting velvet lid...' : 'Tap the Wax Seal or press Space'}</span>
        </p>
      </div>

      {/* Primary Action CTA + Quiet Skip */}
      <div className="w-full max-w-xs flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleBreakSeal}
          disabled={cracked}
          className="btn-3d-amber w-full py-3 px-5 rounded-2xl font-game-display font-bold text-sm text-[#1C110C] cursor-pointer whitespace-nowrap"
        >
          {cracked ? 'Awakening Heirloom...' : 'Crack Royal Wax Seal'}
        </button>
      </div>
    </div>
  );
};
