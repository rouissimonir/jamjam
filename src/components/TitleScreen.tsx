import React, { useEffect } from 'react';
import {
  Play,
  Wrench,
  Map as MapIcon,
  Check,
  Vibrate,
} from 'lucide-react';
import { soundManager } from '../game/audio.ts';
import { haptics } from '../game/haptics.ts';
import {
  TactileThemeId,
  TACTILE_THEMES,
  PreLevelBoosterLoadout,
  HapticIntensity,
  HAPTIC_INTENSITY_ORDER,
  HAPTIC_INTENSITY_SPECS,
} from '../game/rules.ts';
import { GoldCoinPill } from './CasualGameAssets.tsx';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenWorkshop: () => void;
  onOpenLevelSelect: () => void;
  bolts: number;
  workshopProgress: number;
  themeId: TactileThemeId;
  onSelectTheme: (theme: TactileThemeId) => void;
  boosters: PreLevelBoosterLoadout;
  onToggleBooster: (key: keyof PreLevelBoosterLoadout) => void;
  hapticIntensity: HapticIntensity;
  onSelectHapticIntensity: (intensity: HapticIntensity) => void;
  adsRemovedPermanently: boolean;
}

const THEME_IDS: TactileThemeId[] = ['stained_glass', 'knit_yarn', 'retro_gadget'];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenWorkshop,
  onOpenLevelSelect,
  bolts,
  workshopProgress,
  themeId,
  onSelectTheme,
  boosters,
  onToggleBooster,
  hapticIntensity,
  onSelectHapticIntensity,
  adsRemovedPermanently,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        haptics.pinPull();
        soundManager.playPinUnscrew();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  const activeTheme = TACTILE_THEMES[themeId];
  const activeHaptics = HAPTIC_INTENSITY_SPECS[hapticIntensity];

  return (
    <div className="absolute inset-x-0 top-9 bottom-0 z-40 bg-gradient-to-b from-[#172034]/98 via-[#0F1523]/98 to-[#0B0F1A]/99 flex flex-col justify-between px-4 pt-2 pb-3 select-none">
      {/* Top Bar: Unboxed Metadata on Left + 3D Gold '$' Coin Pill on Right */}
      <div className="flex items-center justify-between text-xs text-slate-200">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span>iOS Capacitor</span>
          <span aria-hidden="true">·</span>
          <span>Atelier {workshopProgress}%</span>
          {adsRemovedPermanently && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-bold">Ad-Free</span>
            </>
          )}
        </div>

        <GoldCoinPill
          bolts={bolts}
          size="sm"
          onClick={() => onOpenWorkshop()}
        />
      </div>

      {/* Hero Centerpiece & Custom 3D Casual-Hit Inline SVG Emblem */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="relative mb-1.5">
          <svg
            width="244"
            height="100"
            viewBox="0 0 250 108"
            className="mx-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"
            role="img"
            aria-label="Glass Unpin: 3rd-Gen Tactile Atelier Emblem"
          >
            <defs>
              <linearGradient id="titleGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF347" />
                <stop offset="50%" stopColor="#FFC400" />
                <stop offset="100%" stopColor="#FF8500" />
              </linearGradient>
            </defs>

            {/* Layered 2.5D Translucent Stained-Glass & Brass Backing Plates */}
            <rect
              x="30"
              y="6"
              width="190"
              height="94"
              rx="20"
              fill="#111827"
              stroke="#141824"
              strokeWidth="3"
            />
            {/* Tilted Ruby & Emerald Stained-Glass Mosaic Wings behind Crest */}
            <rect
              x="16"
              y="16"
              width="68"
              height="70"
              rx="14"
              transform="rotate(-7 50 51)"
              fill="#F43F5E"
              fillOpacity="0.38"
              stroke="#FBBF24"
              strokeWidth="2"
            />
            <rect
              x="166"
              y="16"
              width="68"
              height="70"
              rx="14"
              transform="rotate(7 200 51)"
              fill="#10B981"
              fillOpacity="0.38"
              stroke="#FBBF24"
              strokeWidth="2"
            />

            {/* Main Octagonal 3D Atelier Plaque */}
            <path
              d="M 46 10 L 204 10 L 238 53 L 204 96 L 46 96 L 12 53 Z"
              fill="#182236"
              stroke="#141824"
              strokeWidth="4.5"
            />
            <path
              d="M 46 10 L 204 10 L 238 53 L 204 96 L 46 96 L 12 53 Z"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="2.4"
            />

            {/* Left Faceted Ruby Cathedral Clasp */}
            <circle cx="33" cy="53" r="11.5" fill="#FBBF24" stroke="#141824" strokeWidth="2.2" />
            <circle cx="33" cy="53" r="8.2" fill="#F43F5E" />
            <circle cx="30" cy="50" r="2.4" fill="#FFFFFF" fillOpacity="0.95" />

            {/* Right Faceted Emerald Cathedral Clasp */}
            <circle cx="217" cy="53" r="11.5" fill="#FBBF24" stroke="#141824" strokeWidth="2.2" />
            <circle cx="217" cy="53" r="8.2" fill="#10B981" />
            <circle cx="214" cy="50" r="2.4" fill="#FFFFFF" fillOpacity="0.95" />

            {/* 3D Extruded Golden Title Lockup */}
            <text
              x="125"
              y="52"
              textAnchor="middle"
              fill="#8C3800"
              stroke="#141824"
              strokeWidth="6"
              paintOrder="stroke fill"
              fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
              fontWeight="900"
              fontSize="24"
              letterSpacing="1.5"
            >
              GLASS UNPIN
            </text>
            <text
              x="125"
              y="49"
              textAnchor="middle"
              fill="url(#titleGoldGrad)"
              stroke="#141824"
              strokeWidth="4.5"
              paintOrder="stroke fill"
              fontFamily="'Titan One', 'Fredoka', 'Outfit', sans-serif"
              fontWeight="900"
              fontSize="24"
              letterSpacing="1.5"
            >
              GLASS UNPIN
            </text>

            <text
              x="125"
              y="74"
              textAnchor="middle"
              fill="#FFFFFF"
              stroke="#141824"
              strokeWidth="3"
              paintOrder="stroke fill"
              fontFamily="Fredoka, Outfit, sans-serif"
              fontWeight="700"
              fontSize="11.5"
              letterSpacing="2"
            >
              3RD-GEN TACTILE JAM
            </text>
          </svg>
        </div>

        <p className="text-[11px] text-slate-300 max-w-xs leading-snug mb-2">
          {activeTheme.description}
        </p>

        {/* Pillar A: 3rd-Generation Tactile Theme Selector */}
        <div className="w-full max-w-xs mb-2 bg-[#141C2E] border-2 border-[#0E1320] rounded-2xl p-2 shadow-[0_4px_0_#090D16]">
          <div className="text-[10px] font-game-display font-bold text-amber-300 uppercase tracking-wider mb-1.5 text-left px-0.5">
            3rd-Gen Tactile Theme
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {THEME_IDS.map((id) => {
              const spec = TACTILE_THEMES[id];
              const isSelected = themeId === id;
              return (
                <button
                  key={id}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    haptics.lightTap();
                    onSelectTheme(id);
                  }}
                  className={`py-1.5 px-2 rounded-xl font-game-display text-[11px] font-bold transition-all truncate border-2 ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#FFE042] to-[#FFA200] border-[#141824] text-slate-950 shadow-[0_3px_0_#B45309]'
                      : 'bg-[#1D2840] border-[#111520] text-slate-200 hover:text-white shadow-[0_3px_0_#0D121D]'
                  }`}
                >
                  {spec.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Haptic Intensity 4-Tier Selector */}
        <div className="w-full max-w-xs mb-2 bg-[#141C2E] border-2 border-[#0E1320] rounded-2xl p-2 shadow-[0_4px_0_#090D16]">
          <div className="flex items-center justify-between text-[10px] font-game-display font-bold text-slate-300 uppercase tracking-wider mb-1.5 px-0.5">
            <span className="flex items-center gap-1">
              <Vibrate className="w-3 h-3 text-amber-400" />
              <span>Haptic Intensity</span>
            </span>
            <span className="text-amber-300 font-mono">{activeHaptics.percentLabel}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {HAPTIC_INTENSITY_ORDER.map((tier) => {
              const spec = HAPTIC_INTENSITY_SPECS[tier];
              const isSelected = hapticIntensity === tier;
              return (
                <button
                  key={tier}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectHapticIntensity(tier);
                  }}
                  className={`py-1 px-1.5 rounded-xl border-2 text-[11px] font-bold font-mono transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#47C4FF] to-[#249BFF] border-[#141824] text-slate-950 shadow-[0_3px_0_#1D58E8]'
                      : 'bg-[#1D2840] border-[#111520] text-slate-300 hover:text-white shadow-[0_3px_0_#0D121D]'
                  }`}
                  aria-pressed={isSelected}
                >
                  {spec.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pillar B: Royal Match-Style Pre-Level Boosters (Protect Win Streak) */}
        <div className="w-full max-w-xs mb-2.5 bg-[#141C2E] border-2 border-[#0E1320] rounded-2xl p-2 shadow-[0_4px_0_#090D16]">
          <div className="text-[10px] font-game-display font-bold text-slate-300 uppercase tracking-wider mb-1.5 text-left px-0.5">
            Pre-Level Boosters (Streak Protection)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                haptics.lightTap();
                onToggleBooster('extraBufferHoles');
              }}
              className={`py-1.5 px-2.5 rounded-xl border-2 text-[11px] font-game-display font-bold flex items-center justify-between gap-1 transition-all ${
                boosters.extraBufferHoles
                  ? 'bg-gradient-to-b from-[#68F028] to-[#38C712] border-[#141824] text-slate-950 shadow-[0_3px_0_#1E8E0A]'
                  : 'bg-[#1D2840] border-[#111520] text-slate-200 hover:bg-[#24324F] shadow-[0_3px_0_#0D121D]'
              }`}
            >
              <span className="truncate">+2 Buffer Holes (7)</span>
              {boosters.extraBufferHoles && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3] shrink-0" />}
            </button>

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                haptics.lightTap();
                onToggleBooster('dualToolbox');
              }}
              className={`py-1.5 px-2.5 rounded-xl border-2 text-[11px] font-game-display font-bold flex items-center justify-between gap-1 transition-all ${
                boosters.dualToolbox
                  ? 'bg-gradient-to-b from-[#47C4FF] to-[#249BFF] border-[#141824] text-slate-950 shadow-[0_3px_0_#1D58E8]'
                  : 'bg-[#1D2840] border-[#111520] text-slate-200 hover:bg-[#24324F] shadow-[0_3px_0_#0D121D]'
              }`}
            >
              <span className="truncate">Dual-Toolbox (2x)</span>
              {boosters.dualToolbox && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3] shrink-0" />}
            </button>
          </div>
        </div>

        {/* Primary 3D CTA + Secondary 3D Actions */}
        <div className="w-full max-w-xs flex flex-col gap-2.5">
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              haptics.pinPull();
              soundManager.playPinUnscrew();
              onStartGame();
            }}
            data-start="true"
            className="btn-3d-green w-full py-2.5 px-6 rounded-2xl font-game-display font-bold text-base tracking-wide text-game-outline-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white text-white shrink-0 drop-shadow-[0_2px_0_#141824]" />
            <span>Start Blueprint</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                haptics.lightTap();
                onOpenWorkshop();
              }}
              className="btn-3d-slate flex-1 py-2 px-2.5 rounded-xl text-amber-300 font-game-display font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Workshop & ASO</span>
            </button>

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                haptics.lightTap();
                onOpenLevelSelect();
              }}
              className="btn-3d-slate flex-1 py-2 px-2.5 rounded-xl text-sky-300 font-game-display font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <MapIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Progression Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Single flat borderless control hint line in bottom safe margin */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="text-center text-[10px] text-slate-400 font-mono tracking-tight whitespace-nowrap">
          Tap Unpin · Tilt 2.5D · X X-Ray · P Pause · Space Start
        </div>
        <div className="w-32 h-1 bg-slate-600/70 rounded-full mx-auto" />
      </div>
    </div>
  );
};
