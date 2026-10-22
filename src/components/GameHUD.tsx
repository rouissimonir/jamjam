import React from 'react';
import {
  UnpackingQueueState,
  PIN_COLORS,
  TactileThemeId,
  TACTILE_THEMES,
  HapticIntensity,
  HAPTIC_INTENSITY_SPECS,
  ComboFeverState,
} from '../game/rules.ts';
import { LevelConfig } from '../game/levels.ts';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Wrench,
  Pause,
  Flame,
  Palette,
  Vibrate,
  Map as MapIcon,
  ArrowLeftRight,
} from 'lucide-react';
import { soundManager } from '../game/audio.ts';
import { GoldCoinPill } from './CasualGameAssets.tsx';

interface GameHUDProps {
  queueState: UnpackingQueueState;
  currentLevel: LevelConfig;
  bolts: number;
  winStreak: number;
  comboState?: ComboFeverState;
  themeId: TactileThemeId;
  hapticIntensity: HapticIntensity;
  onCycleHapticIntensity: () => void;
  onCycleTheme: () => void;
  onSwapToolbox: () => void;
  onTriggerMoltenWildcard: () => void;
  onRestart: () => void;
  onPause: () => void;
  onOpenWorkshop: () => void;
  onOpenLevelSelect: () => void;
  onOpenCoinStore: () => void;
}

interface TactilePinSocketProps {
  filled: boolean;
  hex?: string;
  borderHex?: string;
  themeId: TactileThemeId;
  sizeClass?: string;
  isBonusSlot?: boolean;
}

const TactilePinSocket: React.FC<TactilePinSocketProps> = ({
  filled,
  hex = '#F59E0B',
  borderHex = '#FDE68A',
  themeId,
  sizeClass = 'w-6 h-6',
  isBonusSlot = false,
}) => {
  return (
    <svg
      viewBox="0 0 28 28"
      className={`${sizeClass} shrink-0 transition-transform duration-150 ${
        filled ? 'scale-105' : 'scale-95'
      }`}
      aria-hidden="true"
    >
      {/* Recessed Outer Machined Socket Bore with 3D Rim */}
      <circle cx="14" cy="14.8" r="12.2" fill="#060911" />
      <circle
        cx="14"
        cy="14"
        r="12.2"
        fill="#0D1320"
        stroke={filled ? borderHex : isBonusSlot ? '#F59E0B' : '#26334A'}
        strokeWidth="2.2"
      />
      {!filled ? (
        <>
          <circle
            cx="14"
            cy="14"
            r="7.5"
            fill="#090D16"
            stroke={isBonusSlot ? '#B45309' : '#334155'}
            strokeWidth="1.4"
          />
          <line x1="10" y1="14" x2="18" y2="14" stroke="#475569" strokeWidth="1.5" />
          <line x1="14" y1="10" x2="14" y2="18" stroke="#475569" strokeWidth="1.5" />
        </>
      ) : themeId === 'stained_glass' ? (
        <>
          {/* 8-Prong Brass Cathedral Clasp + Faceted Jewel */}
          <circle cx="14" cy="14" r="10.8" fill="#FBBF24" stroke="#141824" strokeWidth="1.4" />
          <circle cx="14" cy="14" r="8.4" fill={hex} />
          <polygon
            points="14,6.5 20.5,14 14,21.5 7.5,14"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.65"
            strokeWidth="1.2"
          />
          <circle cx="14" cy="3.2" r="1.4" fill="#FEF08A" />
          <circle cx="14" cy="24.8" r="1.4" fill="#FEF08A" />
          <circle cx="3.2" cy="14" r="1.4" fill="#FEF08A" />
          <circle cx="24.8" cy="14" r="1.4" fill="#FEF08A" />
          <circle cx="10.8" cy="10.5" r="2.3" fill="#FFFFFF" fillOpacity="0.92" />
        </>
      ) : themeId === 'knit_yarn' ? (
        <>
          {/* Glossy Mother-of-Pearl Haberdashery Pin */}
          <circle cx="14" cy="14" r="10.4" fill={hex} stroke="#141824" strokeWidth="1.6" />
          <circle cx="14" cy="14" r="6.8" fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.1" />
          <circle cx="10.5" cy="10.2" r="2.6" fill="#FFFFFF" fillOpacity="0.95" />
          <circle cx="17.2" cy="17.2" r="1.4" fill="#FFFFFF" fillOpacity="0.55" />
        </>
      ) : (
        <>
          {/* Precision CNC Anodized Chrono Hex Fastener */}
          <circle cx="14" cy="14" r="10.5" fill={hex} stroke="#141824" strokeWidth="1.6" />
          <circle cx="14" cy="14" r="3.8" fill="#0F172A" />
          <line x1="14" y1="8.5" x2="14" y2="19.5" stroke="#0F172A" strokeWidth="1.8" />
          <line x1="8.5" y1="14" x2="19.5" y2="14" stroke="#0F172A" strokeWidth="1.8" />
          <circle cx="14" cy="14" r="1.6" fill="#FBBF24" />
          <circle cx="10.5" cy="10.5" r="2" fill="#FFFFFF" fillOpacity="0.88" />
        </>
      )}
    </svg>
  );
};

export const GameHUD: React.FC<GameHUDProps> = ({
  queueState,
  currentLevel,
  bolts,
  winStreak,
  comboState,
  themeId,
  hapticIntensity,
  onCycleHapticIntensity,
  onCycleTheme,
  onSwapToolbox,
  onTriggerMoltenWildcard,
  onRestart,
  onPause,
  onOpenWorkshop,
  onOpenLevelSelect,
  onOpenCoinStore,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());

  const handleToggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const activeBox = queueState.activeToolbox;
  const secondaryBox = queueState.secondaryToolbox;
  const nextBox = queueState.toolboxQueue[0] || null;
  const remainingBoxes =
    (activeBox ? 1 : 0) +
    (secondaryBox ? 1 : 0) +
    queueState.toolboxQueue.length;
  const activeColor = activeBox ? PIN_COLORS[activeBox.color] : null;
  const secondaryColor = secondaryBox ? PIN_COLORS[secondaryBox.color] : null;
  const nextColor = nextBox ? PIN_COLORS[nextBox.color] : null;
  const themeSpec = TACTILE_THEMES[themeId];
  const hapticSpec = HAPTIC_INTENSITY_SPECS[hapticIntensity];
  const maxSlots = queueState.maxBufferSlots;
  const slotIndices = Array.from({ length: maxSlots }, (_, idx) => idx);

  const compactHapticCode =
    hapticIntensity === 'off'
      ? '0%'
      : hapticIntensity === 'light'
      ? 'L'
      : hapticIntensity === 'medium'
      ? 'M'
      : 'H';

  return (
    <div className="w-full px-2.5 pt-1.5 pb-1 flex flex-col gap-1.5 select-none pointer-events-auto">
      {/* Top 3D Clockwork Atelier Header Plaque: Left Map/Atelier | Center Outlined 'Level X' | Right 3D Gold Coin Pill + Pause */}
      <header className="relative flex flex-col gap-1 bg-gradient-to-b from-[#253047] to-[#171E2E] border-[2.5px] border-[#111520] rounded-2xl px-2.5 py-1.5 shadow-[0_4px_0_#0D111A,inset_0_1.5px_0_rgba(255,255,255,0.22)]">
        {/* Corner Brass Atelier Rivet Studs */}
        <span className="pointer-events-none absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-400/80 border border-black" />
        <span className="pointer-events-none absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400/80 border border-black" />

        <div className="flex items-center justify-between gap-2">
          {/* Left: Map & Atelier 3D Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenLevelSelect();
              }}
              className="btn-3d-slate px-2 py-1 rounded-xl flex items-center gap-1 text-amber-300 font-game-display font-bold text-[11px]"
              aria-label={`Open Visual Progression Map, current ${currentLevel.name}`}
            >
              <MapIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Map</span>
            </button>

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenWorkshop();
              }}
              className="btn-3d-amber text-slate-950 font-game-display font-bold text-[11px] px-2 py-1 rounded-xl flex items-center gap-1 whitespace-nowrap shrink-0"
              aria-label="Workshop"
            >
              <Wrench className="w-3 h-3 shrink-0" />
              <span>Atelier</span>
            </button>
          </div>

          {/* Center: Chunky Outlined 'Level X' Title matching Reference Image */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenLevelSelect();
            }}
            className="flex flex-col items-center justify-center min-w-0 px-1 group"
            title={`${currentLevel.name} · Tap to view Saga Map`}
          >
            <span className="font-game-display font-bold text-[19px] leading-none text-game-outline-sm tracking-tight group-hover:scale-105 transition-transform whitespace-nowrap">
              Level {currentLevel.id}
            </span>
          </button>

          {/* Right: 3D Gold '$' Coin Pill + Pause Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <GoldCoinPill
              bolts={bolts}
              size="sm"
              onClick={() => onOpenCoinStore()}
            />

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              tabIndex={-1}
              className="btn-3d-slate p-1.5 text-slate-100 hover:text-white rounded-xl shrink-0"
              aria-label="Pause Game"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sub-Row: Box Progress + Combo Fever Indicator + Tactile Quick Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-[10px]">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono min-w-0">
            <span className="font-bold text-amber-300 tabular-nums shrink-0">
              {queueState.completedBoxes}/{queueState.totalBoxes} Crates
            </span>
            <span aria-hidden="true">·</span>
            {comboState && comboState.streakCount >= 2 ? (
              <span
                className={`font-bold tabular-nums truncate ${
                  comboState.isFever ? 'text-emerald-400' : 'text-sky-300'
                }`}
              >
                {comboState.isFever
                  ? `FEVER ${comboState.streakCount}x (+5$)`
                  : `Combo ${comboState.streakCount}x (+2$)`}
              </span>
            ) : (
              <span className="truncate max-w-[130px] text-slate-300">
                {themeSpec.shortLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Haptic Intensity Quick Cycler */}
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleHapticIntensity();
              }}
              className={`px-1.5 py-0.5 rounded-lg border text-[9px] font-mono font-bold flex items-center gap-0.5 transition-colors shrink-0 ${
                hapticIntensity === 'off'
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-[#101624] hover:bg-slate-800 border-amber-500/40 text-amber-300'
              }`}
              title={`Haptic Intensity: ${hapticSpec.label} (${hapticSpec.percentLabel})`}
              aria-label={`Cycle Haptic Intensity, current ${hapticSpec.shortLabel}`}
            >
              <Vibrate className="w-2.5 h-2.5 shrink-0" />
              <span>{compactHapticCode}</span>
            </button>

            {/* 3rd-Gen Theme Quick Switcher */}
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleTheme();
              }}
              className="px-1.5 py-0.5 text-sky-300 hover:text-white bg-[#101624] hover:bg-slate-800 border border-sky-500/40 rounded-lg transition-colors flex items-center gap-0.5 text-[9px] font-mono font-bold shrink-0"
              title={`3rd-Gen Theme: ${themeSpec.name} (Tap to switch)`}
              aria-label="Switch 3rd-Gen Tactile Theme"
            >
              <Palette className="w-2.5 h-2.5" />
              <span>Theme</span>
            </button>

            {/* Mute Toggle */}
            <button
              onClick={handleToggleMute}
              tabIndex={-1}
              className="p-1 text-slate-300 hover:text-white bg-[#101624] hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors shrink-0"
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? (
                <VolumeX className="w-3 h-3 text-rose-400" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
            </button>

            {/* Restart Level */}
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              tabIndex={-1}
              className="p-1 text-slate-300 hover:text-white bg-[#101624] hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors shrink-0"
              aria-label="Restart Level"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Rule 5 & Pillar B: 3D Riveted Active 3-Slot Colored Crate (+ Dual-Toolbox Booster) + Next Swap Box */}
      <div className="flex items-stretch gap-1.5">
        {/* Primary Active 3-Slot Toolbox Crate */}
        <div
          className="relative flex-1 bg-[#182030] border-[2.5px] rounded-2xl px-2.5 py-1.5 shadow-[0_4px_0_#0C101A,inset_0_2px_0_rgba(255,255,255,0.25)] flex items-center justify-between gap-1.5 transition-colors min-w-0"
          style={{
            borderColor: activeColor ? activeColor.borderHex : '#334155',
            backgroundColor: activeColor ? `${activeColor.darkHex}66` : '#182030',
          }}
        >
          {/* Corner Brass Crate Rivets */}
          <span className="pointer-events-none absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-300/80 border border-black" />
          <span className="pointer-events-none absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-300/80 border border-black" />

          <div className="flex flex-col min-w-0 pl-1">
            <div className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/70 shrink-0 shadow-sm"
                style={{ backgroundColor: activeColor?.hex || '#94A3B8' }}
              />
              <span className="font-game-display text-[11px] font-bold text-white tracking-wide whitespace-nowrap">
                {secondaryBox ? 'Crate 1' : 'Active Crate'}
              </span>
              {queueState.moltenWildcardReady && (
                <span className="px-1.5 py-0.2 rounded-md bg-orange-500 border border-black text-slate-950 text-[9px] font-black tracking-tight whitespace-nowrap animate-pulse">
                  WILD!
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-bold font-mono whitespace-nowrap"
              style={{ color: activeColor?.lightHex || '#94A3B8' }}
            >
              {activeColor ? `${activeColor.shortLabel} ${activeBox?.pins.length ?? 0}/3` : 'Done'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0" aria-label="Active Toolbox Slots">
            {[0, 1, 2].map((slotIdx) => {
              const hasPin = Boolean(activeBox && slotIdx < activeBox.pins.length);
              return (
                <TactilePinSocket
                  key={slotIdx}
                  filled={hasPin}
                  hex={activeColor?.hex}
                  borderHex={activeColor?.borderHex}
                  themeId={themeId}
                  sizeClass={secondaryBox ? 'w-5 h-5' : 'w-6 h-6'}
                />
              );
            })}
          </div>
        </div>

        {/* Secondary Active Toolbox (Visible when Dual-Toolbox Booster is active) */}
        {secondaryBox && secondaryColor && (
          <div
            className="flex-1 bg-[#182030] border-[2.5px] rounded-2xl px-2.5 py-1.5 shadow-[0_4px_0_#0C101A,inset_0_2px_0_rgba(255,255,255,0.25)] flex items-center justify-between gap-1.5 transition-colors min-w-0"
            style={{
              borderColor: secondaryColor.borderHex,
              backgroundColor: `${secondaryColor.darkHex}66`,
            }}
          >
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/60 shrink-0"
                  style={{ backgroundColor: secondaryColor.hex }}
                />
                <span className="font-game-display text-[11px] font-bold text-amber-300 tracking-wide whitespace-nowrap">
                  Crate 2
                </span>
              </div>
              <span
                className="text-[10px] font-bold font-mono whitespace-nowrap"
                style={{ color: secondaryColor.lightHex }}
              >
                {secondaryColor.shortLabel} {secondaryBox.pins.length}/3
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0" aria-label="Secondary Toolbox Slots">
              {[0, 1, 2].map((slotIdx) => {
                const hasPin = slotIdx < secondaryBox.pins.length;
                return (
                  <TactilePinSocket
                    key={slotIdx}
                    filled={hasPin}
                    hex={secondaryColor.hex}
                    borderHex={secondaryColor.borderHex}
                    themeId={themeId}
                    sizeClass="w-5 h-5"
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Next Toolbox Preview + Tactical 1-Per-Level Swap Button */}
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onSwapToolbox();
          }}
          disabled={queueState.swapUsed || !nextBox}
          aria-label={
            queueState.swapUsed
              ? 'Toolbox Swap Used'
              : 'Swap Active and Next Toolbox [S]'
          }
          title={
            queueState.swapUsed
              ? '1-per-level Toolbox Swap already used'
              : 'Swap Active Toolbox with Next Toolbox [S] (Auto-drains matching buffer pins!)'
          }
          className={`${
            secondaryBox ? 'w-20' : 'w-28'
          } rounded-2xl px-2 py-1 flex flex-col justify-between shrink-0 text-left transition-all border-[2.5px] ${
            !queueState.swapUsed && nextBox
              ? 'bg-[#1D2840] hover:bg-[#24324F] border-amber-400 shadow-[0_4px_0_#0C101A,inset_0_1.5px_0_rgba(255,255,255,0.22)] cursor-pointer active:translate-y-0.5'
              : 'bg-[#141B29] border-[#111520] shadow-[0_4px_0_#0C101A] cursor-default'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-[9px] w-full">
            <span
              className={`inline-flex items-center gap-0.5 font-mono font-bold whitespace-nowrap ${
                !queueState.swapUsed && nextBox ? 'text-amber-300' : 'text-slate-400'
              }`}
            >
              <ArrowLeftRight className="w-2.5 h-2.5 shrink-0" />
              <span>{queueState.swapUsed ? 'Swapped' : 'Swap [S]'}</span>
            </span>
            <span className="font-mono text-slate-400 tabular-nums">
              +{Math.max(0, remainingBoxes - (secondaryBox ? 2 : 1))}
            </span>
          </div>
          {nextBox && nextColor ? (
            <div className="flex items-center justify-between gap-1 mt-0.5 w-full">
              <span
                className="text-[11px] font-bold font-mono tracking-tight"
                style={{ color: nextColor.lightHex }}
              >
                Next:{nextColor.shortLabel}
              </span>
              {!secondaryBox && (
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="w-2 h-2 rounded-full border border-black/50"
                      style={{ backgroundColor: nextColor.hex }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Final</span>
          )}
        </button>
      </div>

      {/* Rule 5 & Feature 2B: 3D Brass-Rimmed 5-Hole (or Boosted 7-Hole) Peg-Rail Dock + Molten Combo Meter */}
      <div className="relative bg-gradient-to-b from-[#182133] to-[#111724] border-[2.5px] border-[#111520] rounded-2xl px-2.5 py-1.5 shadow-[0_4px_0_#0A0E17,inset_0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-between gap-2">
        <span className="pointer-events-none absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-400/70 border border-black" />
        <span className="pointer-events-none absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-400/70 border border-black" />

        <div className="flex flex-col min-w-0 pl-1">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-game-display text-[11px] font-bold text-white tracking-wide">
              {maxSlots}-Hole Rail
            </span>
            <span className="text-[10px] font-mono font-bold tabular-nums text-amber-300">
              {queueState.holdingBuffer.length}/{maxSlots}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerMoltenWildcard();
              }}
              disabled={!queueState.moltenWildcardReady}
              aria-label={
                queueState.moltenWildcardReady
                  ? 'Trigger Molten Wildcard [W]'
                  : `Molten Combo ${queueState.directMatchStreak} of 3`
              }
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-mono font-bold border transition-all ${
                queueState.moltenWildcardReady
                  ? 'bg-orange-500 hover:bg-orange-400 border-black text-slate-950 cursor-pointer shadow-[0_2px_0_#000,0_0_10px_rgba(249,115,22,0.5)] active:translate-y-0.5'
                  : queueState.directMatchStreak > 0
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 cursor-default'
                  : 'bg-slate-800/90 border-slate-700 text-slate-400 cursor-default'
              }`}
              title="Pull 3 matching pins in a row without buffering to charge a Molten Wildcard [W]!"
            >
              <Flame className="w-2.5 h-2.5 shrink-0" />
              <span>
                {queueState.moltenWildcardReady
                  ? 'Wild [W]!'
                  : `Forge ${queueState.directMatchStreak}/3`}
              </span>
            </button>
          </div>
          <span className="text-[10px] text-slate-300 truncate">
            {queueState.moltenWildcardReady ? (
              <span className="text-orange-300 font-semibold">
                Tap Wild [W] to forge 1 pin into Active Crate!
              </span>
            ) : queueState.holdingBuffer.length === maxSlots - 1 ? (
              <span className="text-amber-400 font-semibold">1 slot left before Fail Offer!</span>
            ) : queueState.holdingBuffer.length >= maxSlots ? (
              <span className="text-rose-400 font-semibold">Buffer Full — Almost Won!</span>
            ) : (
              `Streak ${winStreak}x · Auto-drains ${themeSpec.pinNoun.toLowerCase()}s`
            )}
          </span>
        </div>

        {/* Dynamic 5 or 7 Neutral Holding Sockets */}
        <div
          className="flex items-center gap-1 shrink-0"
          aria-label={`${maxSlots}-Hole Holding Buffer Slots`}
        >
          {slotIndices.map((slotIdx) => {
            const pin = queueState.holdingBuffer[slotIdx];
            const pinColor = pin ? PIN_COLORS[pin.color] : null;
            const isBonusSlot = slotIdx >= 5;

            return (
              <TactilePinSocket
                key={slotIdx}
                filled={Boolean(pinColor)}
                hex={pinColor?.hex}
                borderHex={pinColor?.borderHex}
                themeId={themeId}
                sizeClass="w-6 h-6"
                isBonusSlot={isBonusSlot}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
