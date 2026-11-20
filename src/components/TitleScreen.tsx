import React, { useEffect, useState } from 'react';
import {
  Play,
  Award,
  Map as MapIcon,
  Check,
  Vibrate,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Star,
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
  ArchivistRankProgress,
} from '../game/rules.ts';
import { TITLE_HERO_ARTWORK } from '../game/artwork.ts';
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
  dailyDateKey?: string;
  dailyCompletedToday?: boolean;
  dailyStreak?: number;
  onStartDailyDispatch?: () => void;
  archivistRank?: ArchivistRankProgress;
  totalStars?: number;
  claimableCommissionsCount?: number;
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
  dailyDateKey,
  dailyCompletedToday = false,
  dailyStreak = 0,
  onStartDailyDispatch,
  archivistRank,
  totalStars = 0,
  claimableCommissionsCount = 0,
}) => {
  const [prepOpen, setPrepOpen] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        haptics.pinPull();
        soundManager.playPinUnscrew(1.0, 2);
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  const activeTheme = TACTILE_THEMES[themeId];
  const activeHaptics = HAPTIC_INTENSITY_SPECS[hapticIntensity];
  const activeBoosterCount =
    (boosters.extraBufferHoles ? 1 : 0) + (boosters.dualToolbox ? 1 : 0);

  return (
    <div className="absolute inset-x-0 top-8 bottom-0 z-40 bg-gradient-to-b from-[#1E130F] via-[#150D0B] to-[#0E0806] flex flex-col justify-between px-4 pt-2.5 pb-3 select-none overflow-y-auto">
      {/* Top Quiet Archivist Metadata + Gold Crowns */}
      <div className="flex items-center justify-between text-xs text-[#E6D5C3] shrink-0">
        <div className="flex items-center gap-1.5 font-mono text-[10.5px] min-w-0">
          <span className="text-amber-300 font-bold truncate">
            {archivistRank ? archivistRank.currentRank.title : 'Royal Post'}
          </span>
          <span aria-hidden="true" className="text-[#785745]">·</span>
          <span className="inline-flex items-center gap-0.5 tabular-nums text-amber-200 shrink-0">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{totalStars}</span>
          </span>
          {adsRemovedPermanently && (
            <>
              <span aria-hidden="true" className="text-[#785745]">·</span>
              <span className="text-emerald-300 font-bold shrink-0">Ad-Free</span>
            </>
          )}
        </div>

        <GoldCoinPill
          bolts={bolts}
          size="sm"
          onClick={() => onOpenWorkshop()}
        />
      </div>

      {/* Main Focal Stage: Illustrated Key-Art Hero + Title Crest + Actions */}
      <div className="flex flex-col items-center text-center my-auto py-2 gap-3">
        {/* Framed Candlelit Key-Art Showcase with Royal Post Lockup */}
        <div className="relative w-full max-w-[352px] rounded-[24px] overflow-hidden border-[2px] border-[#6B442B] shadow-[0_16px_38px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(254,240,138,0.28)] bg-[#231510]">
          {!heroImgError ? (
            <img
              src={TITLE_HERO_ARTWORK}
              alt="Candlelit Parisian royal post parcel tied with crimson and emerald satin ribbons and sealed with a ruby-gold wax crest"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="w-full h-[290px] object-cover object-center block"
            />
          ) : (
            <div className="w-full h-[290px] bg-gradient-to-b from-[#3B1F17] via-[#261510] to-[#170D0A]" />
          )}

          {/* Measured Vignette Scrim for 4.5:1+ Typography Contrast */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#120A08]/88 via-transparent to-[#120A08]/94"
          />

          {/* Top-Anchored Royal Post Gold-Foil Display Lockup */}
          <div className="absolute inset-x-0 top-0 pt-3.5 px-4 flex flex-col items-center">
            <h1 className="font-game-titan font-extrabold text-[32px] leading-none tracking-tight text-[#FEF08A] drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]">
              ROYAL POST
            </h1>
            <div className="mt-1 text-[10.5px] font-mono font-bold tracking-[0.32em] text-[#FDF6EC]/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
              WAX &amp; RIBBON
            </div>
          </div>

          {/* Bottom-Anchored Editorial Tagline (Clean, Unboxed, Single-Line) */}
          <div className="absolute inset-x-0 bottom-0 pb-3 px-4 flex flex-col items-center">
            <p className="text-[11.5px] font-medium text-[#F5E6D3] leading-snug whitespace-nowrap drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
              Unwind satin ribbons · Crack wax seals
            </p>
            <div className="mt-1 flex items-center gap-2 text-[9.5px] font-mono text-amber-200/95">
              <span>Zero Timer</span>
              <span aria-hidden="true">·</span>
              <span>ASMR Haptics</span>
              <span aria-hidden="true">·</span>
              <span>Curio {workshopProgress}%</span>
            </div>
          </div>
        </div>

        {/* Primary CTA + Daily Royal Dispatch + Secondary Desk Actions */}
        <div className="w-full max-w-[348px] flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              haptics.pinPull();
              soundManager.playPinUnscrew(1.0, 2);
              onStartGame();
            }}
            data-start="true"
            className="btn-3d-blue w-full py-3 px-6 rounded-2xl font-game-display font-bold text-[17px] tracking-wide text-game-outline-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white text-white shrink-0" />
            <span>Unseal Parcel</span>
          </button>

          {onStartDailyDispatch && (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                haptics.pinPull();
                soundManager.playPinUnscrew(1.12, 4);
                onStartDailyDispatch();
              }}
              className={`w-full py-2.5 px-3.5 rounded-2xl border-2 flex items-center justify-between gap-2 transition-all cursor-pointer ${
                dailyCompletedToday
                  ? 'bg-[#1D241C] border-emerald-500/55 text-emerald-200 hover:bg-[#232D22] shadow-[0_3px_0_#0A120B]'
                  : 'bg-[#2B1B15] border-amber-400/80 text-[#FDF6EC] hover:bg-[#37221A] shadow-[0_3px_0_#0E0806]'
              }`}
              aria-label={`Play Daily Royal Dispatch for ${dailyDateKey || 'today'}`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="flex flex-col text-left leading-tight min-w-0">
                  <span className="font-game-display font-bold text-xs text-[#FDF6EC] truncate">
                    Daily Royal Dispatch
                  </span>
                  <span className="text-[10px] font-mono text-[#CDBAA8] truncate">
                    {dailyDateKey || 'Today'} · Streak {dailyStreak}d
                  </span>
                </span>
              </span>
              <span
                className={`font-mono font-bold text-[10.5px] px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap ${
                  dailyCompletedToday
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-400 text-[#1C110C]'
                }`}
              >
                {dailyCompletedToday ? 'Delivered ✓' : '+100 Crowns'}
              </span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.currentTarget.blur();
                haptics.lightTap();
                onOpenWorkshop();
              }}
              className="btn-3d-slate flex-1 py-2.5 px-3 rounded-xl text-amber-200 font-game-display font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Curio Atelier</span>
            </button>

            <button
              onClick={(e) => {
                e.currentTarget.blur();
                haptics.lightTap();
                onOpenLevelSelect();
              }}
              className="btn-3d-slate flex-1 py-2.5 px-3 rounded-xl text-[#F8F3EC] font-game-display font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <MapIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Dispatch Map{claimableCommissionsCount > 0 ? ` (${claimableCommissionsCount})` : ''}
              </span>
            </button>
          </div>

          {/* Collapsible Atelier Prep Strip (Keeps Hero Clean while keeping Desk/Haptics/Boosters 1 tap away) */}
          <div className="w-full rounded-2xl border border-[#493022] bg-[#1F1410] overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                haptics.lightTap();
                setPrepOpen((v) => !v);
              }}
              aria-expanded={prepOpen}
              className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-[#291B15] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-[11px] font-mono text-[#E6D5C3] min-w-0 truncate">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-200 shrink-0">Atelier Prep</span>
                <span aria-hidden="true" className="text-[#785745]">·</span>
                <span className="truncate text-[#CDBAA8]">
                  {activeTheme.shortLabel} · Haptics {activeHaptics.shortLabel}
                  {activeBoosterCount > 0 ? ` · ${activeBoosterCount} Boost` : ''}
                </span>
              </span>
              {prepOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#B8A18D] shrink-0" />
              )}
            </button>

            {prepOpen && (
              <div className="px-3 pb-3 pt-1.5 border-t border-[#3A251B] flex flex-col gap-2.5">
                {/* Desk Finish */}
                <div>
                  <div className="text-[9.5px] font-mono font-bold text-amber-300 uppercase tracking-wider mb-1 text-left">
                    Atelier Desk Finish
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
                          className={`py-1.5 px-1 rounded-xl font-game-display text-[10.5px] font-bold transition-all whitespace-nowrap border ${
                            isSelected
                              ? 'bg-amber-400 border-[#24140B] text-[#1C110C]'
                              : 'bg-[#2A1C16] border-[#422B20] text-[#E6D5C3] hover:text-white'
                          }`}
                        >
                          {spec.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ASMR Haptics */}
                <div>
                  <div className="flex items-center justify-between text-[9.5px] font-mono font-bold text-[#DECBB9] uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-1">
                      <Vibrate className="w-3 h-3 text-amber-400" />
                      <span>ASMR Haptics</span>
                    </span>
                    <span className="text-amber-300">{activeHaptics.percentLabel}</span>
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
                          className={`py-1 px-1.5 rounded-xl border text-[10.5px] font-bold font-mono transition-all ${
                            isSelected
                              ? 'bg-[#E11D48] border-[#FDA4AF]/60 text-white'
                              : 'bg-[#2A1C16] border-[#422B20] text-[#DECBB9] hover:text-white'
                          }`}
                          aria-pressed={isSelected}
                        >
                          {spec.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pre-Parcel Boosters */}
                <div>
                  <div className="text-[9.5px] font-mono font-bold text-[#DECBB9] uppercase tracking-wider mb-1 text-left">
                    Pre-Parcel Boosters
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={(e) => {
                        e.currentTarget.blur();
                        haptics.lightTap();
                        onToggleBooster('extraBufferHoles');
                      }}
                      className={`py-1.5 px-2 rounded-xl border text-[10.5px] font-game-display font-bold flex items-center justify-between gap-1 transition-all ${
                        boosters.extraBufferHoles
                          ? 'bg-emerald-700 border-emerald-400 text-white'
                          : 'bg-[#2A1C16] border-[#422B20] text-[#E6D5C3]'
                      }`}
                    >
                      <span className="truncate">+2 Pegs (7-Rack)</span>
                      {boosters.extraBufferHoles && <Check className="w-3.5 h-3.5 text-white stroke-[3] shrink-0" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.currentTarget.blur();
                        haptics.lightTap();
                        onToggleBooster('dualToolbox');
                      }}
                      className={`py-1.5 px-2 rounded-xl border text-[10.5px] font-game-display font-bold flex items-center justify-between gap-1 transition-all ${
                        boosters.dualToolbox
                          ? 'bg-amber-400 border-[#24140B] text-[#1C110C]'
                          : 'bg-[#2A1C16] border-[#422B20] text-[#E6D5C3]'
                      }`}
                    >
                      <span className="truncate">Dual Bobbin (2x)</span>
                      {boosters.dualToolbox && <Check className="w-3.5 h-3.5 text-[#1C110C] stroke-[3] shrink-0" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Single flat borderless control hint line */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="text-center text-[10px] text-[#B8A18D] font-mono tracking-tight whitespace-nowrap">
          Tap Unseal · G Shake · E Candle · Z Undo · Space Start
        </div>
        <div className="w-28 h-1 bg-[#4F3527] rounded-full mx-auto" />
      </div>
    </div>
  );
};
