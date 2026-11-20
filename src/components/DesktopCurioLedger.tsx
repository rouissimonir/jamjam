import React from 'react';
import {
  LiveHeirloomUnboxingState,
  HEIRLOOM_ORDER,
  HEIRLOOM_CATALOG,
  PIN_COLORS,
  PinColor,
  TactileThemeId,
  TACTILE_THEMES,
  HeirloomId,
  ArchivistRankProgress,
  EvaluatedCommission,
  CommissionId,
} from '../game/rules.ts';
import { LevelConfig } from '../game/levels.ts';
import { Check, Sparkles, BookOpen, Award, Keyboard, Star, ScrollText } from 'lucide-react';

interface DesktopCurioLedgerProps {
  currentLevel: LevelConfig;
  unboxingState: LiveHeirloomUnboxingState;
  clearedLevelIds: number[];
  themeId: TactileThemeId;
  bolts: number;
  winStreak: number;
  dailyStreak?: number;
  archivistRank?: ArchivistRankProgress;
  totalStars?: number;
  commissions?: EvaluatedCommission[];
  onClaimCommission?: (id: CommissionId) => void;
  onInspectCurio?: (heirloomId: HeirloomId) => void;
  onOpenWorkshop: () => void;
  onOpenLevelSelect: () => void;
}

const COLOR_KEYS: PinColor[] = ['crimson', 'amber', 'emerald', 'azure', 'violet'];

export const DesktopCurioLedger: React.FC<DesktopCurioLedgerProps> = ({
  currentLevel,
  unboxingState,
  clearedLevelIds,
  themeId,
  bolts,
  winStreak,
  dailyStreak = 0,
  archivistRank,
  totalStars = 0,
  commissions = [],
  onClaimCommission,
  onInspectCurio,
  onOpenWorkshop,
  onOpenLevelSelect,
}) => {
  const { heirloom, unboxingStage, progressPercent } = unboxingState;
  const themeSpec = TACTILE_THEMES[themeId];
  const unlockedCount = Math.min(HEIRLOOM_ORDER.length, Math.max(1, clearedLevelIds.length));

  // Highlight first claimable commission, otherwise first uncompleted commission
  const featuredCommission =
    commissions.find((c) => c.claimable) ||
    commissions.find((c) => !c.claimed) ||
    commissions[0] ||
    null;

  return (
    <aside
      aria-label="Royal Post Archivist Desk Ledger"
      className="hidden lg:flex w-[348px] xl:w-[376px] h-[868px] max-h-[96dvh] flex-col justify-between rounded-[32px] border-[3px] border-[#4A3022] bg-gradient-to-b from-[#231814] via-[#1B120F] to-[#140D0B] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(253,230,138,0.16)] text-[#F8F3EC] select-none overflow-hidden"
    >
      {/* Top Archivist Masthead */}
      <div className="flex flex-col gap-2.5 min-h-0">
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#3D271C]">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-400 font-bold truncate">
              Royal Post Dispatch Ledger
            </div>
            <h1 className="font-game-display font-bold text-2xl text-[#FDF6EC] leading-tight mt-0.5">
              Wax &amp; Ribbon
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#CDBAA8]">
              <span className="truncate">{themeSpec.shortLabel} · Parcel #{currentLevel.id}</span>
              {archivistRank && (
                <>
                  <span aria-hidden="true" className="text-[#6F5342]">·</span>
                  <span
                    className="font-mono font-bold truncate"
                    style={{ color: archivistRank.currentRank.crestColor }}
                  >
                    {archivistRank.currentRank.title}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-flex items-center justify-end gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold tabular-nums">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>{totalStars}★</span>
            </div>
            <div className="font-mono font-extrabold text-lg tabular-nums text-amber-300 leading-tight">
              {bolts}c
            </div>
            <div className="text-[10px] font-mono text-emerald-300">
              Streak {winStreak}x{dailyStreak > 0 ? ` · ${dailyStreak}d` : ''}
            </div>
          </div>
        </div>

        {/* Active Heirloom Dossier Card */}
        <div className="rounded-2xl border border-[#523526] bg-[#281B16] p-3 shadow-inner flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-wider text-amber-300 font-bold">
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Active Parcel Dossier</span>
            </span>
            <span className="text-[11px] font-mono font-bold tabular-nums text-[#FDE68A]">
              {progressPercent}%
            </span>
          </div>

          <div>
            <div className="font-game-display font-bold text-[15px] text-[#FDF6EC] leading-tight">
              {heirloom.name}
            </div>
            <div className="text-[10.5px] font-mono text-[#D2B9A1]">
              {heirloom.origin} · {heirloom.era}
            </div>
          </div>

          <p className="text-[11px] text-[#DECBB9] leading-snug line-clamp-2">
            {heirloom.loreNote}
          </p>

          {/* 4-Stage Live Unboxing Checklist */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {heirloom.stageLabels.map((label, idx) => {
              const completed = unboxingStage > idx || (idx === 3 && unboxingStage === 3);
              const active = unboxingStage === idx;
              return (
                <div
                  key={label}
                  className={`px-2 py-1 rounded-xl border text-[10.5px] flex items-center gap-1.5 transition-colors ${
                    completed
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : active
                      ? 'bg-amber-950/50 border-amber-400/80 text-amber-200'
                      : 'bg-[#19110E] border-[#382319] text-[#9A8472]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0 ${
                      completed
                        ? 'bg-emerald-500 text-slate-950'
                        : active
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-[#2C1D17] text-[#A48B78]'
                    }`}
                  >
                    {completed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                  </span>
                  <span className="truncate font-medium">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Royal Curio Cabinet Shelf */}
        <div className="rounded-2xl border border-[#442C20] bg-[#1F1511] p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-wider text-amber-300 font-bold">
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>Royal Curio Gallery</span>
            </span>
            <span className="text-[10.5px] font-mono text-[#CDBAA8] tabular-nums">
              {unlockedCount}/{HEIRLOOM_ORDER.length} Cataloged
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {HEIRLOOM_ORDER.map((id, idx) => {
              const item = HEIRLOOM_CATALOG[id];
              const isCurrent = id === heirloom.id;
              const isCataloged = idx < unlockedCount || isCurrent;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => (onInspectCurio ? onInspectCurio(id) : onOpenWorkshop())}
                  aria-label={`Inspect ${item.name} in Curio Pedestal`}
                  className={`text-left px-2 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#34211A] border-amber-400/80 text-[#FDF6EC]'
                      : isCataloged
                      ? 'bg-[#251914] border-[#4F3325] text-[#E5D4C3] hover:border-amber-500/60'
                      : 'bg-[#170F0D] border-[#2E1E17] text-[#8B7564] hover:border-[#4F3325]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/40"
                      style={{ backgroundColor: item.boxAccentHex }}
                    />
                    <span className="text-[10.5px] font-game-display font-bold leading-tight truncate">
                      {item.name.replace(/^Imperial |^Venetian |^Grand |^Kyoto /, '')}
                    </span>
                  </div>
                  <div className="text-[9.5px] font-mono text-[#B9A38E] truncate mt-0.5">
                    {isCurrent ? 'Unboxing · Inspect' : isCataloged ? 'Tap to Inspect' : item.origin}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Royal Courier Commission Highlight */}
        {featuredCommission && (
          <div
            className={`rounded-2xl border p-2.5 flex flex-col gap-1.5 transition-colors ${
              featuredCommission.claimable
                ? 'border-amber-400/80 bg-gradient-to-r from-[#342016] to-[#231610]'
                : 'border-[#442C20] bg-[#1F1511]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                <ScrollText className="w-3.5 h-3.5 shrink-0" />
                <span>Royal Commission</span>
              </span>
              {featuredCommission.claimable && onClaimCommission ? (
                <button
                  type="button"
                  onClick={() => onClaimCommission(featuredCommission.id)}
                  className="px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#1C110C] text-[10px] font-mono font-extrabold shadow-sm cursor-pointer active:translate-y-0.5"
                >
                  Claim +{featuredCommission.rewardCrowns}c
                </button>
              ) : (
                <span className="text-[10px] font-mono font-bold tabular-nums text-[#DECBB9]">
                  {featuredCommission.claimed
                    ? 'Claimed ✓'
                    : `${featuredCommission.current}/${featuredCommission.target} · +${featuredCommission.rewardCrowns}c`}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 leading-tight">
              <span className="text-[11.5px] font-game-display font-bold text-[#FDF6EC]">
                {featuredCommission.title}
              </span>
              <span className="text-[10.5px] text-[#C7B29E]">
                {featuredCommission.description}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#130C09] overflow-hidden border border-[#3A241A]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  featuredCommission.claimable || featuredCommission.claimed
                    ? 'bg-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-300'
                }`}
                style={{ width: `${featuredCommission.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Accessible Satin Weave Pattern Key */}
        <div className="rounded-2xl border border-[#442C20] bg-[#1F1511] p-2.5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider text-[#D2B9A1] font-bold">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Ribbon Weave Key</span>
            </span>
            <span className="text-[9.5px] text-[#9F8875]">Color-Safe</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {COLOR_KEYS.map((colorKey) => {
              const entry = PIN_COLORS[colorKey];
              return (
                <div
                  key={colorKey}
                  className="flex items-center justify-between text-[10px] px-2 py-0.5 rounded-lg bg-[#160F0C] border border-[#312018]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-amber-200/50 shrink-0"
                      style={{ backgroundColor: entry.hex }}
                    />
                    <span className="font-mono font-bold text-[#F5E8DA] shrink-0">
                      {entry.shortLabel}
                    </span>
                    <span className="text-[#C7B29E] whitespace-nowrap">
                      {entry.name.replace(/^Royal |^Imperial |^Byzantine |^Sunlit /, '')}
                    </span>
                  </div>
                  <span className="text-[9.5px] font-mono text-amber-300/90 shrink-0 ml-2 whitespace-nowrap">
                    {entry.weaveLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Desk Controls & Parcel Map Quick Button */}
      <div className="pt-2.5 border-t border-[#3D271C] flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center justify-between gap-2 text-[9.5px] font-mono text-[#BFA894]">
          <span className="inline-flex items-center gap-1 whitespace-nowrap shrink-0">
            <Keyboard className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Keys</span>
          </span>
          <span className="whitespace-nowrap truncate">G Shake · E Fan · X Light · Z Undo · S Swap</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenLevelSelect}
            className="btn-3d-slate py-2 px-3 rounded-xl text-xs font-game-display font-bold text-amber-200 whitespace-nowrap"
          >
            Dispatch Map
          </button>
          <button
            type="button"
            onClick={onOpenWorkshop}
            className="btn-3d-amber py-2 px-3 rounded-xl text-xs font-game-display font-bold text-[#1C110C] whitespace-nowrap"
          >
            Curio Atelier
          </button>
        </div>
      </div>
    </aside>
  );
};

