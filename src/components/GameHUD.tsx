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
  Award,
  Pause,
  Scissors,
  Palette,
  Vibrate,
  Map as MapIcon,
  ArrowLeftRight,
  Undo2,
} from 'lucide-react';
import { soundManager } from '../game/audio.ts';
import { GoldCoinPill } from './CasualGameAssets.tsx';

interface GameHUDProps {
  queueState: UnpackingQueueState;
  currentLevel: LevelConfig;
  bolts: number;
  winStreak: number;
  comboState?: ComboFeverState;
  idleHintActive?: boolean;
  movablePinsCount?: number;
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
  canUndo?: boolean;
  freeUndosRemaining?: number;
  undoCost?: number;
  onUndoLastRackPin?: () => void;
  onMuteChange?: (muted: boolean) => void;
}

interface SatinBobbinSpoolProps {
  filled: boolean;
  hex?: string;
  lightHex?: string;
  borderHex?: string;
  sizeClass?: string;
  isBonusSlot?: boolean;
  mode?: 'bobbin' | 'peg';
}

const SatinBobbinSpool: React.FC<SatinBobbinSpoolProps> = ({
  filled,
  hex = '#E11D48',
  lightHex = '#FDA4AF',
  borderHex = '#FBBF24',
  sizeClass = 'w-6 h-6',
  isBonusSlot = false,
  mode = 'bobbin',
}) => {
  if (mode === 'bobbin') {
    return (
      <svg
        viewBox="0 0 28 28"
        className={`${sizeClass} shrink-0 transition-transform duration-150 ${
          filled ? 'scale-105' : 'scale-95'
        }`}
        aria-hidden="true"
      >
        {/* Turned Mahogany & Brass Spool Flanges */}
        <rect x="4" y="2.5" width="20" height="4.2" rx="2" fill="#B45309" stroke="#160E0C" strokeWidth="1.2" />
        <rect x="4" y="21.3" width="20" height="4.2" rx="2" fill="#92400E" stroke="#160E0C" strokeWidth="1.2" />
        <rect x="6" y="3.2" width="16" height="1.2" rx="0.6" fill="#FDE68A" fillOpacity="0.65" />

        {!filled ? (
          <>
            {/* Empty Turned Wooden Bobbin Core */}
            <rect x="8.5" y="6.8" width="11" height="14.4" rx="1.5" fill="#2A1B16" stroke="#5C3A24" strokeWidth="1" />
            <line x1="14" y1="8.5" x2="14" y2="19.5" stroke="#784C32" strokeWidth="1.2" strokeDasharray="2 2" />
          </>
        ) : (
          <>
            {/* Wound Satin Ribbon Thread Core with Specular Sheen */}
            <rect x="6.5" y="6.7" width="15" height="14.6" rx="2.5" fill={hex} stroke="#160E0C" strokeWidth="1.1" />
            <line x1="7.5" y1="10.2" x2="20.5" y2="10.2" stroke={lightHex} strokeOpacity="0.55" strokeWidth="1.1" />
            <line x1="7.5" y1="14" x2="20.5" y2="14" stroke="#FEF08A" strokeOpacity="0.65" strokeWidth="1.1" />
            <line x1="7.5" y1="17.8" x2="20.5" y2="17.8" stroke={lightHex} strokeOpacity="0.45" strokeWidth="1.1" />
            <rect x="9" y="7.5" width="3.5" height="13" rx="1.5" fill="#FFFFFF" fillOpacity="0.28" />
          </>
        )}
      </svg>
    );
  }

  // Brass Ribbon Rack Peg Socket (for 5-Peg or 7-Peg Rack)
  return (
    <svg
      viewBox="0 0 28 28"
      className={`${sizeClass} shrink-0 transition-transform duration-150 ${
        filled ? 'scale-105' : 'scale-95'
      }`}
      aria-hidden="true"
    >
      <circle cx="14" cy="14.8" r="11.8" fill="#0F0907" />
      <circle
        cx="14"
        cy="14"
        r="11.5"
        fill="#1E1310"
        stroke={filled ? borderHex : isBonusSlot ? '#F59E0B' : '#573928'}
        strokeWidth="2"
      />
      {!filled ? (
        <>
          <circle
            cx="14"
            cy="14"
            r="5.5"
            fill="#140C09"
            stroke={isBonusSlot ? '#D97706' : '#785038'}
            strokeWidth="1.4"
          />
          <circle cx="14" cy="14" r="2.2" fill="#A16207" />
        </>
      ) : (
        <>
          {/* Parked Wax Seal & Folded Satin Ribbon Loop */}
          <circle cx="14" cy="14" r="9.8" fill={hex} stroke="#160E0C" strokeWidth="1.4" />
          <circle cx="14" cy="14" r="6.8" fill="none" stroke="#FDE68A" strokeOpacity="0.78" strokeWidth="1.2" />
          <path d="M 11.5 16 L 14 10.5 L 16.5 16 L 14 14.4 Z" fill="#FEF08A" />
          <circle cx="10.6" cy="10.4" r="2" fill="#FFFFFF" fillOpacity="0.72" />
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
  idleHintActive = false,
  movablePinsCount = 0,
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
  canUndo = false,
  freeUndosRemaining = 1,
  undoCost = 15,
  onUndoLastRackPin,
  onMuteChange,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());

  React.useEffect(() => {
    setIsMuted(soundManager.getMuted());
  }, [currentLevel.id]);

  const handleToggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const next = soundManager.toggleMute();
    setIsMuted(next);
    onMuteChange?.(next);
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
    <div className="w-full px-2.5 pt-1 pb-1 flex flex-col gap-1.5 select-none pointer-events-auto">
      {/* Top Oiled-Walnut & Brass Archivist Header Plaque */}
      <header className="relative flex flex-col gap-1 bg-gradient-to-b from-[#2C1E19] to-[#1D1310] border-[2px] border-[#523526] rounded-2xl px-2.5 py-1.5 shadow-[0_4px_0_#0F0907,inset_0_1px_0_rgba(253,230,138,0.18)]">
        <span className="pointer-events-none absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-300/75" />
        <span className="pointer-events-none absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-300/75" />

        <div className="flex items-center justify-between gap-2">
          {/* Left: Dispatch Map & Curio Gallery */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenLevelSelect();
              }}
              className="btn-3d-slate px-2 py-1 rounded-xl flex items-center gap-1 text-amber-200 font-game-display font-bold text-[11px] whitespace-nowrap shrink-0"
              aria-label={`Open Royal Dispatch Map, current ${currentLevel.name}`}
            >
              <MapIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Map</span>
            </button>

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenWorkshop();
              }}
              className="btn-3d-amber text-[#1C110C] font-game-display font-bold text-[11px] px-2 py-1 rounded-xl flex items-center gap-1 whitespace-nowrap shrink-0"
              aria-label="Open Royal Curio Atelier"
            >
              <Award className="w-3 h-3 shrink-0" />
              <span>Curio</span>
            </button>
          </div>

          {/* Center: Parcel Title in Fraunces Serif */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenLevelSelect();
            }}
            className="flex flex-col items-center justify-center min-w-0 px-1 group"
            title={`${currentLevel.name} · Tap to view Royal Dispatch Map`}
          >
            <span className="font-game-display font-bold text-[18px] leading-none text-[#FDF6EC] drop-shadow-[0_2px_0_#140C09] tracking-tight group-hover:text-amber-200 transition-colors whitespace-nowrap">
              {currentLevel.isDaily ? 'Daily Post' : `Parcel ${currentLevel.id}`}
            </span>
          </button>

          {/* Right: Gold Crowns Pill + Pause */}
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
              className="btn-3d-slate p-1.5 text-[#F8F3EC] hover:text-amber-200 rounded-xl shrink-0"
              aria-label="Pause Game"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Compact Status & Tactile Quick Controls Row */}
        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#432B20] text-[9.5px]">
          <div className="flex items-center gap-1 text-[#DECBB9] font-mono min-w-0 tracking-tight">
            <span className="font-bold text-amber-300 tabular-nums shrink-0">
              {queueState.completedBoxes}/{queueState.totalBoxes} Bobbins
            </span>
            <span aria-hidden="true" className="text-[#785745]">·</span>
            {comboState && comboState.streakCount >= 2 ? (
              <span
                className={`font-bold tabular-nums whitespace-nowrap shrink-0 ${
                  comboState.isFever ? 'text-emerald-300' : 'text-amber-200'
                }`}
              >
                {comboState.isFever
                  ? `SILK RUSH ${comboState.streakCount}x`
                  : `Combo ${comboState.streakCount}x`}
              </span>
            ) : idleHintActive && movablePinsCount > 0 ? (
              <span
                className="font-bold tabular-nums text-amber-300 whitespace-nowrap shrink-0"
                data-testid="hud-idle-hint-indicator"
              >
                Hint: {movablePinsCount} Free
              </span>
            ) : (
              <span className="truncate max-w-[104px] text-[#CDBAA8]">
                {themeSpec.shortLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleHapticIntensity();
              }}
              className={`px-1.5 py-0.5 rounded-lg border text-[9px] font-mono font-bold flex items-center gap-0.5 transition-colors shrink-0 ${
                hapticIntensity === 'off'
                  ? 'bg-[#170F0D] border-[#38241A] text-[#856B5B]'
                  : 'bg-[#170F0D] hover:bg-[#2A1B16] border-amber-500/45 text-amber-300'
              }`}
              title={`Haptic Intensity: ${hapticSpec.label} (${hapticSpec.percentLabel})`}
              aria-label={`Cycle Haptic Intensity, current ${hapticSpec.shortLabel}`}
            >
              <Vibrate className="w-2.5 h-2.5 shrink-0" />
              <span>{compactHapticCode}</span>
            </button>

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleTheme();
              }}
              className="px-1.5 py-0.5 text-amber-200 hover:text-white bg-[#170F0D] hover:bg-[#2A1B16] border border-[#613E2B] rounded-lg transition-colors flex items-center gap-0.5 text-[9px] font-mono font-bold shrink-0"
              title={`Atelier Desk Theme: ${themeSpec.name}`}
              aria-label="Switch Desk Theme"
            >
              <Palette className="w-2.5 h-2.5 text-amber-400" />
              <span>Desk</span>
            </button>

            <button
              onClick={handleToggleMute}
              tabIndex={-1}
              className="p-1 text-[#DECBB9] hover:text-white bg-[#170F0D] hover:bg-[#2A1B16] border border-[#4D3224] rounded-lg transition-colors shrink-0"
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? (
                <VolumeX className="w-3 h-3 text-rose-400" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              tabIndex={-1}
              className="p-1 text-[#DECBB9] hover:text-white bg-[#170F0D] hover:bg-[#2A1B16] border border-[#4D3224] rounded-lg transition-colors shrink-0"
              aria-label="Restart Parcel"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Active 3-Spool Velvet Bobbin Tray (+ Dual Bobbin Booster) + Bobbin Swap [S] */}
      <div className="flex items-stretch gap-1.5">
        <div
          className={`relative flex-1 bg-[#261815] border-[2px] rounded-2xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 transition-all min-w-0 ${
            comboState?.isFever
              ? 'ring-1 ring-amber-300/85 shadow-[0_4px_0_#100A08,0_0_18px_rgba(251,191,36,0.38),inset_0_1.5px_0_rgba(254,240,138,0.45)]'
              : 'shadow-[0_4px_0_#100A08,inset_0_1.5px_0_rgba(255,248,235,0.16)]'
          }`}
          style={{
            borderColor: comboState?.isFever
              ? '#FDE047'
              : activeColor
              ? activeColor.borderHex
              : '#573928',
            backgroundColor: activeColor ? `${activeColor.darkHex}7A` : '#261815',
          }}
        >
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full border border-amber-200/60 shrink-0 shadow-sm"
                style={{ backgroundColor: activeColor?.hex || '#D97706' }}
              />
              <span className="font-game-display text-[11px] font-bold text-[#FDF6EC] tracking-wide whitespace-nowrap">
                {secondaryBox ? 'Bobbin 1' : 'Active Bobbin'}
              </span>
              {queueState.moltenWildcardReady && (
                <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-[#1C110C] text-[9px] font-black tracking-tight whitespace-nowrap animate-pulse">
                  SNIP!
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-bold font-mono whitespace-nowrap"
              style={{ color: activeColor?.lightHex || '#E6D5C3' }}
            >
              {activeColor ? `${activeColor.shortLabel} ${activeBox?.pins.length ?? 0}/3` : 'Unboxed'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0" aria-label="Active Velvet Bobbin Spools">
            {[0, 1, 2].map((slotIdx) => {
              const hasPin = Boolean(activeBox && slotIdx < activeBox.pins.length);
              return (
                <SatinBobbinSpool
                  key={slotIdx}
                  filled={hasPin}
                  hex={activeColor?.hex}
                  lightHex={activeColor?.lightHex}
                  borderHex={activeColor?.borderHex}
                  sizeClass={secondaryBox ? 'w-5 h-5' : 'w-6 h-6'}
                  mode="bobbin"
                />
              );
            })}
          </div>
        </div>

        {/* Secondary Active Bobbin (Dual Velvet Bobbin Booster) */}
        {secondaryBox && secondaryColor && (
          <div
            className="flex-1 bg-[#261815] border-[2px] rounded-2xl px-2 py-1.5 shadow-[0_4px_0_#100A08,inset_0_1.5px_0_rgba(255,248,235,0.16)] flex items-center justify-between gap-1 transition-colors min-w-0"
            style={{
              borderColor: secondaryColor.borderHex,
              backgroundColor: `${secondaryColor.darkHex}7A`,
            }}
          >
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-amber-200/60 shrink-0"
                  style={{ backgroundColor: secondaryColor.hex }}
                />
                <span className="font-game-display text-[11px] font-bold text-amber-200 whitespace-nowrap">
                  Bobbin 2
                </span>
              </div>
              <span
                className="text-[10px] font-bold font-mono whitespace-nowrap"
                style={{ color: secondaryColor.lightHex }}
              >
                {secondaryColor.shortLabel} {secondaryBox.pins.length}/3
              </span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0" aria-label="Secondary Bobbin Spools">
              {[0, 1, 2].map((slotIdx) => (
                <SatinBobbinSpool
                  key={slotIdx}
                  filled={slotIdx < secondaryBox.pins.length}
                  hex={secondaryColor.hex}
                  lightHex={secondaryColor.lightHex}
                  borderHex={secondaryColor.borderHex}
                  sizeClass="w-5 h-5"
                  mode="bobbin"
                />
              ))}
            </div>
          </div>
        )}

        {/* Next Bobbin Preview + Tactical 1-Per-Parcel Swap Button */}
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onSwapToolbox();
          }}
          disabled={queueState.swapUsed || !nextBox}
          aria-label={
            queueState.swapUsed
              ? 'Bobbin Swap Used'
              : 'Swap Active and Next Bobbin [S]'
          }
          title={
            queueState.swapUsed
              ? '1-per-parcel Bobbin Swap already used'
              : 'Swap Active Bobbin with Next Bobbin [S] (Auto-winds matching rack ribbons!)'
          }
          className={`${
            secondaryBox ? 'w-20' : 'w-28'
          } rounded-2xl px-2 py-1 flex flex-col justify-between shrink-0 text-left transition-all border-[2px] ${
            !queueState.swapUsed && nextBox
              ? 'bg-[#2C1D17] hover:bg-[#38251E] border-amber-400/90 shadow-[0_4px_0_#100A08] cursor-pointer active:translate-y-0.5'
              : 'bg-[#1D1411] border-[#422B20] shadow-[0_4px_0_#100A08] cursor-default'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-[9px] w-full">
            <span
              className={`inline-flex items-center gap-0.5 font-mono font-bold whitespace-nowrap ${
                !queueState.swapUsed && nextBox ? 'text-amber-300' : 'text-[#9F8875]'
              }`}
            >
              <ArrowLeftRight className="w-2.5 h-2.5 shrink-0" />
              <span>{queueState.swapUsed ? 'Swapped' : 'Swap [S]'}</span>
            </span>
            <span className="font-mono text-[#BFA894] tabular-nums">
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
            <span className="text-[10px] text-[#9F8875] font-medium whitespace-nowrap">Final</span>
          )}
        </button>
      </div>

      {/* 5-Peg (or Boosted 7-Peg) Brass Ribbon Rack + Golden Scissors [W] + Wax Re-Stamp Undo [Z] */}
      <div className="relative bg-gradient-to-b from-[#251814] to-[#1A110E] border-[2px] border-[#4E3224] rounded-2xl px-2.5 py-1.5 shadow-[0_4px_0_#0E0806,inset_0_2px_4px_rgba(0,0,0,0.55)] flex flex-col gap-1">
        {/* Row 1: Rack Title + Snip + Undo */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
            <span className="font-game-display text-[11px] font-bold text-[#FDF6EC] tracking-wide">
              {maxSlots}-Peg Rack
            </span>
            <span className="text-[10px] font-mono font-bold tabular-nums text-amber-300">
              {queueState.holdingBuffer.length}/{maxSlots}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerMoltenWildcard();
              }}
              disabled={!queueState.moltenWildcardReady}
              aria-label={
                queueState.moltenWildcardReady
                  ? 'Use Golden Scissors [W]'
                  : `Golden Scissors ${queueState.directMatchStreak} of 3`
              }
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-mono font-bold border transition-all whitespace-nowrap ${
                queueState.moltenWildcardReady
                  ? 'bg-amber-400 hover:bg-amber-300 border-[#26160D] text-[#1A0E09] cursor-pointer shadow-[0_2px_0_#000] active:translate-y-0.5'
                  : queueState.directMatchStreak > 0
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 cursor-default'
                  : 'bg-[#170F0D] border-[#432B20] text-[#9E8774] cursor-default'
              }`}
              title="Wind 3 matching ribbons in a row to charge Golden Scissors [W]!"
            >
              <Scissors className="w-2.5 h-2.5 shrink-0" />
              <span>
                {queueState.moltenWildcardReady
                  ? 'Snip [W]!'
                  : `Snip ${queueState.directMatchStreak}/3`}
              </span>
            </button>
            {onUndoLastRackPin && (
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onUndoLastRackPin();
                }}
                disabled={!canUndo}
                aria-label={
                  freeUndosRemaining > 0
                    ? 'Wax Re-Stamp Undo last rack pin free [Z]'
                    : `Wax Re-Stamp Undo last rack pin for ${undoCost} Crowns [Z]`
                }
                title={
                  freeUndosRemaining > 0
                    ? 'Wax Re-Stamp Undo [Z]: Return last rack seal back onto its ribbon (1 Free per parcel)'
                    : `Wax Re-Stamp Undo [Z]: Return last rack seal to ribbon (${undoCost} Crowns)`
                }
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-mono font-bold border transition-all whitespace-nowrap ${
                  canUndo
                    ? 'bg-[#2C1D17] hover:bg-[#3A271E] border-amber-400/70 text-amber-200 cursor-pointer active:translate-y-0.5'
                    : 'bg-[#170F0D] border-[#38241A] text-[#7D6657] cursor-default'
                }`}
              >
                <Undo2 className="w-2.5 h-2.5 shrink-0" />
                <span>{freeUndosRemaining > 0 ? 'Undo Free' : `Undo ${undoCost}`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status Hint + 5 or 7 Brass Holding Pegs */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9.5px] text-[#D3BFA9] truncate min-w-0">
            {queueState.moltenWildcardReady ? (
              <span className="text-amber-300 font-semibold">
                Tap Snip [W] to wind 1 ribbon!
              </span>
            ) : queueState.holdingBuffer.length === maxSlots - 1 ? (
              <span className="text-amber-300 font-semibold">1 peg left — pick carefully!</span>
            ) : queueState.holdingBuffer.length >= maxSlots ? (
              <span className="text-rose-300 font-semibold">Rack Full — One Ribbon Short!</span>
            ) : (
              `No timer · Streak ${winStreak}x`
            )}
          </span>

          <div
            className="flex items-center gap-1 shrink-0"
            aria-label={`${maxSlots}-Peg Brass Ribbon Rack`}
          >
            {slotIndices.map((slotIdx) => {
              const pin = queueState.holdingBuffer[slotIdx];
              const pinColor = pin ? PIN_COLORS[pin.color] : null;
              const isBonusSlot = slotIdx >= 5;

              return (
                <SatinBobbinSpool
                  key={slotIdx}
                  filled={Boolean(pinColor)}
                  hex={pinColor?.hex}
                  lightHex={pinColor?.lightHex}
                  borderHex={pinColor?.borderHex}
                  sizeClass={maxSlots > 5 ? 'w-5 h-5' : 'w-6 h-6'}
                  isBonusSlot={isBonusSlot}
                  mode="peg"
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
