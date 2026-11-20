import React, { useState, useMemo } from 'react';
import { RotateCcw, Award, Zap, X, Check, Sparkles, Star, Share2 } from 'lucide-react';
import { soundManager } from '../game/audio.ts';
import { haptics } from '../game/haptics.ts';
import { LevelConfig } from '../game/levels.ts';
import {
  TactileThemeId,
  computeFeatureUnlockProgress,
  computeAtelierMasteryTrophy,
  computeScrewPassChestState,
  computeLiveHeirloomUnboxingState,
  FinialSkinId,
  FINIAL_SKINS,
  FINIAL_SKIN_ORDER,
  STORY_CHAPTERS,
  HeirloomId,
  ParcelMasteryEvaluation,
  ArchivistRankProgress,
  formatShareableDispatchCard,
} from '../game/rules.ts';
import {
  GoldCoinPill,
  GoldDollarCoinSvg,
  BrassScrewChestSvg,
  ArtisanAvatarSvg,
  StorySceneIllustrationSvg,
} from './CasualGameAssets.tsx';
import { LiveHeirloomStage } from './LiveHeirloomStage.tsx';

interface VictoryModalProps {
  currentLevel: LevelConfig;
  bolts: number;
  clearedLevelIds: number[];
  rewardBolts: number;
  clearTimeSeconds: number;
  themeId?: TactileThemeId;
  totalScrewsCollected?: number;
  screwChestsClaimed?: number;
  onClaimScrewChest?: () => void;
  finialSkinId?: FinialSkinId;
  onSelectFinialSkin?: (skinId: FinialSkinId) => void;
  storyStage?: 0 | 1 | 2 | 3;
  onAdvanceStoryStage?: () => void;
  onNextLevel: () => void;
  onRestart: () => void;
  onOpenWorkshop: () => void;
  onOpenCoinStore: () => void;
  onAddBonusBolts?: (extraBolts: number) => void;
  onInspectCurio?: (heirloomId: HeirloomId) => void;
  hasNextLevel: boolean;
  parcelMastery?: ParcelMasteryEvaluation;
  archivistRank?: ArchivistRankProgress;
  peakRackUsed?: number;
  maxRackSlots?: number;
  dailyStreak?: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  currentLevel,
  bolts,
  clearedLevelIds,
  rewardBolts,
  clearTimeSeconds,
  themeId = 'stained_glass',
  totalScrewsCollected = 54,
  screwChestsClaimed = 0,
  onClaimScrewChest,
  finialSkinId = 'royal_brass',
  onSelectFinialSkin,
  storyStage = 1,
  onAdvanceStoryStage,
  onNextLevel,
  onRestart,
  onOpenWorkshop,
  onOpenCoinStore,
  onAddBonusBolts,
  onInspectCurio,
  hasNextLevel,
  parcelMastery,
  archivistRank,
  peakRackUsed = 1,
  maxRackSlots = 5,
  dailyStreak = 0,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [isOverclocked, setIsOverclocked] = useState(false);
  const [bonusAdded, setBonusAdded] = useState(0);
  const [showFeatureVault, setShowFeatureVault] = useState(false);
  const [chestJustOpened, setChestJustOpened] = useState(false);
  const [stampedStars, setStampedStars] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  const earnedStars = parcelMastery?.stars ?? 3;

  React.useEffect(() => {
    soundManager.playBoxCompleted();
    haptics.boxCompleted();
    const timers: number[] = [];
    for (let i = 1; i <= earnedStars; i++) {
      const t = window.setTimeout(() => {
        setStampedStars(i);
        soundManager.playStarStamp(i - 1);
      }, 220 * i);
      timers.push(t);
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [earnedStars]);

  const featureProgress = useMemo(
    () => computeFeatureUnlockProgress(currentLevel.id, clearedLevelIds),
    [currentLevel.id, clearedLevelIds]
  );

  const chestState = useMemo(
    () => computeScrewPassChestState(totalScrewsCollected, screwChestsClaimed),
    [totalScrewsCollected, screwChestsClaimed]
  );

  const awakenedUnboxing = useMemo(
    () =>
      computeLiveHeirloomUnboxingState(
        currentLevel.toolboxColors.length,
        0,
        0,
        currentLevel.toolboxColors.length,
        currentLevel.id
      ),
    [currentLevel.id, currentLevel.toolboxColors.length]
  );

  const trophy = useMemo(
    () =>
      computeAtelierMasteryTrophy(
        currentLevel.id,
        clearTimeSeconds,
        currentLevel.toolboxColors,
        themeId,
        10
      ),
    [currentLevel.id, clearTimeSeconds, currentLevel.toolboxColors, themeId]
  );

  const claimDisplayAmount = isOverclocked
    ? trophy.overclockedClaimBolts
    : trophy.baseClaimBolts;

  const handleToggleOverclock = () => {
    if (isClaiming) return;
    haptics.pinPull();
    soundManager.playPinUnscrew(1.2);
    setIsOverclocked((prev) => !prev);
  };

  const handleClaimChestReward = () => {
    if (!chestState.isReadyToClaim) return;
    haptics.boxCompleted();
    soundManager.playWorkshopUpgrade();
    setChestJustOpened(true);
    onClaimScrewChest?.();
  };

  const handleClaimAndContinue = () => {
    if (isClaiming) return;
    setIsClaiming(true);
    haptics.boxCompleted();
    soundManager.playWorkshopUpgrade();
    setBonusAdded(claimDisplayAmount);
    onAddBonusBolts?.(claimDisplayAmount);

    setTimeout(() => {
      if (hasNextLevel) {
        onNextLevel();
      } else {
        onOpenWorkshop();
      }
    }, 440);
  };

  return (
    <div
      className="absolute inset-x-0 top-8 bottom-0 z-50 bg-[radial-gradient(circle_at_50%_38%,#3D231B_0%,#241511_58%,#130B09_100%)] flex flex-col justify-between px-4 pt-3 pb-4 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-modal-title"
    >
      {/* Subtle Gold Guild Compass Watermark Rings */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle
          cx="200"
          cy="360"
          r="150"
          fill="none"
          stroke="#FDE68A"
          strokeWidth="1.2"
          strokeDasharray="6 6"
        />
        <circle
          cx="200"
          cy="360"
          r="215"
          fill="none"
          stroke="#D97706"
          strokeWidth="1"
          strokeDasharray="3 8"
        />
      </svg>

      {/* Top Section: Parcel Number + Gold Crowns + Grand Unboxing Crest */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="relative w-full flex items-center justify-center min-h-[36px]">
          <h2
            id="victory-modal-title"
            className="font-game-display font-bold text-[22px] tracking-tight text-[#FDF6EC] leading-none"
          >
            Parcel {currentLevel.id}
          </h2>

          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <GoldCoinPill
              bolts={bolts + bonusAdded}
              onClick={() => onOpenCoinStore()}
              pulse={isClaiming || chestJustOpened}
            />
          </div>
        </div>

        {/* Gold-Foil Grand Unboxing Banner + Staggered 3-Star Wax Mastery Crest */}
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center gap-2 mb-1.5" aria-label={`Earned ${earnedStars} out of 3 Royal Wax Stars`}>
            {[1, 2, 3].map((idx) => {
              const lit = idx <= stampedStars;
              return (
                <div
                  key={idx}
                  className={`transition-all duration-300 ${
                    lit ? 'scale-110 opacity-100' : 'scale-75 opacity-30'
                  }`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      lit
                        ? 'fill-[#FDE047] text-[#F59E0B] drop-shadow-[0_0_12px_rgba(251,191,36,0.75)]'
                        : 'fill-[#2A1B16] text-[#6B4A38]'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <div className="font-game-display font-extrabold text-[28px] leading-tight text-transparent bg-clip-text bg-gradient-to-b from-[#FEF08A] via-[#F59E0B] to-[#D97706] drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)]">
            HEIRLOOM UNBOXED!
          </div>
          <p className="text-[11px] text-[#E6D5C3] mt-0.5">
            {parcelMastery ? parcelMastery.headline : 'Royal Grand Seal'} · {awakenedUnboxing.heirloom.name}
          </p>
        </div>
      </div>

      {/* Centerpiece: Awakened 100% Live Heirloom Stage + Parcel Metrics Card */}
      <div className="relative z-10 w-full flex flex-col items-center gap-2.5 my-auto">
        <div className="w-[calc(100%+1.25rem)] -mx-2.5">
          <LiveHeirloomStage
            unboxingState={awakenedUnboxing}
            matchPulseKey={currentLevel.id}
            artisanLine="Tap this heirloom to inspect its museum portrait & chimes!"
            onInspectCurio={() => {
              haptics.lightTap();
              if (onInspectCurio) {
                onInspectCurio(awakenedUnboxing.heirloom.id);
              } else {
                setShowFeatureVault(true);
              }
            }}
          />
        </div>

        {/* Clean Tactile Summary Plaque */}
        <div className="w-full rounded-2xl border-[2px] border-[#5C3A27] bg-[#211511]/95 p-3 shadow-[0_6px_0_#0E0806] flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-[#B8A18D]">Ribbons</span>
              <span className="font-mono font-extrabold text-base tabular-nums text-amber-300">
                {awakenedUnboxing.totalRibbons}
              </span>
            </div>
            <div className="flex flex-col border-x border-[#3F281E]">
              <span className="text-[10px] font-mono uppercase text-[#B8A18D]">Peak Rack</span>
              <span className="font-mono font-extrabold text-base tabular-nums text-emerald-300">
                {peakRackUsed}/{maxRackSlots}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-[#B8A18D]">Parcel Bonus</span>
              <span className="font-mono font-extrabold text-base tabular-nums text-[#FDE68A]">
                +{rewardBolts + (parcelMastery?.starBonusCrowns ?? 0)}
              </span>
            </div>
          </div>

          {/* Archivist Rank Progress Strip */}
          {archivistRank && (
            <div className="bg-[#160F0C] border border-[#472E21] rounded-xl px-2.5 py-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-amber-300 font-bold">
                  {archivistRank.currentRank.title}
                </span>
                <span className="text-[#CDBAA8] tabular-nums">
                  {archivistRank.nextRank
                    ? `${archivistRank.pointsToNext} pts to ${archivistRank.nextRank.title}`
                    : 'Max Rank'}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#2A1B16] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#FDE047] rounded-full transition-all duration-300"
                  style={{ width: `${archivistRank.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Wax Stamp Collector Progress Bar */}
          <button
            type="button"
            onClick={() => {
              haptics.lightTap();
              setShowFeatureVault(true);
            }}
            className="w-full text-left bg-[#160F0C] hover:bg-[#1D1310] border border-[#472E21] rounded-xl p-2 flex items-center justify-between gap-2 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-amber-300 font-bold">
                  Wax Stamp Pass Chest
                </span>
                <span className="text-[#FDF6EC] font-bold tabular-nums">
                  {chestState.label}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#2A1B16] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-[#D97706] to-[#FEF08A] rounded-full"
                  style={{ width: `${Math.max(10, chestState.ratioPercent)}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-300 shrink-0">
              {chestState.isReadyToClaim ? 'CLAIM!' : '+75'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Section: Claim Crowns CTA + 2X Wax Bonus + Quiet Secondary Actions */}
      <div className="relative z-10 w-full flex flex-col items-center gap-3">
        {isClaiming && (
          <div className="pointer-events-none absolute inset-x-0 bottom-14 flex items-center justify-center">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="absolute animate-coin-fly"
                style={{ animationDelay: `${idx * 65}ms` }}
              >
                <GoldDollarCoinSvg size={26} />
              </div>
            ))}
          </div>
        )}

        <div className="w-full flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={handleClaimAndContinue}
            data-start="true"
            aria-label={`Claim ${claimDisplayAmount} Crowns and Continue to Next Parcel`}
            className="btn-3d-blue flex-1 h-[54px] rounded-2xl flex items-center justify-center gap-2 cursor-pointer select-none px-4"
          >
            <span className="font-game-display font-bold text-[17px] text-game-outline-sm whitespace-nowrap">
              {hasNextLevel ? 'Next Parcel' : 'Curio Gallery'}
            </span>
            <span className="inline-flex items-center gap-1 font-mono font-extrabold text-base text-[#FEF08A] tabular-nums">
              +{claimDisplayAmount}
              <GoldDollarCoinSvg size={22} />
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleOverclock}
            aria-pressed={isOverclocked}
            title="Double Royal Wax Seal Reward"
            className={`${
              isOverclocked ? 'btn-3d-green' : 'btn-3d-amber'
            } h-[54px] px-3 rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none shrink-0`}
          >
            <span className="flex items-center gap-1 font-game-display font-bold text-[12px] text-[#1C110C] leading-none">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>{isOverclocked ? '2X SEAL!' : '2X WAX'}</span>
            </span>
            <span className="font-mono font-bold text-[9.5px] text-[#2A1810] mt-0.5">
              {isOverclocked ? '+20 Crowns' : 'Bonus'}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              haptics.lightTap();
              const shareText = formatShareableDispatchCard({
                parcelTitle: currentLevel.name,
                heirloomName: awakenedUnboxing.heirloom.name,
                stars: earnedStars,
                isDaily: currentLevel.isDaily,
                dailyDateKey: currentLevel.dailyDateKey,
                dailyStreak,
                rankTitle: archivistRank?.currentRank.title || 'Royal Archivist',
                peakRackUsed,
                maxRackSlots,
              });
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(shareText).catch(() => {});
              }
              soundManager.playCommissionClaim();
              setShareCopied(true);
              window.setTimeout(() => setShareCopied(false), 2400);
            }}
            className={`${
              shareCopied ? 'btn-3d-blue text-white' : 'btn-3d-slate text-amber-200'
            } px-2.5 py-1.5 rounded-xl text-[11px] font-game-display font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer`}
          >
            {shareCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
            <span>{shareCopied ? 'Sealed & Copied!' : 'Share Seal'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.lightTap();
              onRestart();
            }}
            className="btn-3d-slate px-2.5 py-1.5 rounded-xl text-[11px] font-game-display font-bold text-[#FDF6EC] flex items-center gap-1 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Replay</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.lightTap();
              setShowFeatureVault(true);
            }}
            className={`${
              chestState.isReadyToClaim ? 'btn-3d-green text-white' : 'btn-3d-slate text-amber-200'
            } px-2.5 py-1.5 rounded-xl text-[11px] font-game-display font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer`}
          >
            <span>{chestState.isReadyToClaim ? 'Chest Ready!' : `Seals ${chestState.label}`}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.lightTap();
              onOpenWorkshop();
            }}
            className="btn-3d-slate px-2.5 py-1.5 rounded-xl text-[11px] font-game-display font-bold text-amber-300 flex items-center gap-1 whitespace-nowrap cursor-pointer"
          >
            <Award className="w-3 h-3" />
            <span>Curio</span>
          </button>
        </div>
      </div>

      {/* Wax Stamp Vault & Heirloom Chapter Modal */}
      {showFeatureVault && (
        <div
          className="absolute inset-0 z-30 bg-[#120B09]/95 flex items-center justify-center p-3.5"
          role="dialog"
          aria-modal="true"
          aria-label="Royal Wax Vault and Heirloom Restoration"
        >
          <div className="w-full max-w-[348px] bg-gradient-to-b from-[#2A1C17] to-[#1A110E] border-[2.5px] border-[#613E2B] rounded-3xl p-4 shadow-[0_10px_0_#0B0705,0_20px_40px_rgba(0,0,0,0.85)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-game-display font-bold text-base text-[#FDF6EC]">
                ROYAL WAX VAULT
              </span>
              <button
                type="button"
                onClick={() => setShowFeatureVault(false)}
                aria-label="Close Vault Modal"
                className="btn-3d-slate p-1.5 rounded-xl text-[#E6D5C3] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wax Stamp Collector Chest */}
            <div className="bg-[#160F0C] border border-[#472E21] rounded-2xl p-3 flex items-center justify-between gap-3">
              <BrassScrewChestSvg
                isReady={chestState.isReadyToClaim}
                isOpened={chestJustOpened}
                size={54}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-game-display font-bold text-amber-300">
                  <span>Wax Stamp Chest</span>
                  <span className="font-mono text-[#FDF6EC]">{chestState.label}</span>
                </div>
                <div className="w-full h-2 bg-[#2A1B16] rounded-full overflow-hidden my-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#D97706] to-[#FEF08A] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(10, chestState.ratioPercent)}%` }}
                  />
                </div>
                {chestState.isReadyToClaim ? (
                  <button
                    type="button"
                    onClick={handleClaimChestReward}
                    className="btn-3d-green w-full py-1.5 px-3 rounded-xl font-game-display font-bold text-xs text-white cursor-pointer"
                  >
                    OPEN CHEST (+{chestState.rewardBolts} Crowns)
                  </button>
                ) : (
                  <span className="text-[10px] text-[#CDBAA8] font-medium block">
                    {chestJustOpened
                      ? `Claimed +${chestState.rewardBolts} Crowns! Unseal more parcels to refill.`
                      : `Break ${chestState.targetPerChest - chestState.currentProgressInTier} more wax seals for +${chestState.rewardBolts} Crowns`}
                  </span>
                )}
              </div>
            </div>

            {/* Heirloom Chapter Restoration */}
            {(() => {
              const chapter = STORY_CHAPTERS[themeId];
              const currentSpec = chapter.stages[storyStage];
              const nextSpec = storyStage < 3 ? chapter.stages[(storyStage + 1) as 1 | 2 | 3] : null;
              const canAffordNext = Boolean(nextSpec && bolts + bonusAdded >= nextSpec.costBolts);
              return (
                <div className="bg-[#160F0C] border border-[#472E21] rounded-2xl p-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ArtisanAvatarSvg themeId={themeId} size={30} />
                      <div className="min-w-0">
                        <div className="font-game-display font-bold text-xs text-amber-300 truncate">
                          {chapter.chapterTitle}
                        </div>
                        <div className="text-[10px] font-mono text-[#CDBAA8] truncate">
                          {chapter.artisanName} · Stage {storyStage}/3
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-300 shrink-0">
                      {storyStage === 3 ? 'RESTORED!' : '+100 GOAL'}
                    </span>
                  </div>

                  <StorySceneIllustrationSvg themeId={themeId} stage={storyStage} />

                  <p className="text-[10px] text-[#DECBB9] leading-snug">
                    {currentSpec.caption}
                  </p>

                  {nextSpec ? (
                    <button
                      type="button"
                      disabled={!canAffordNext}
                      onClick={() => {
                        if (!canAffordNext) return;
                        haptics.boxCompleted();
                        soundManager.playWorkshopUpgrade();
                        onAdvanceStoryStage?.();
                      }}
                      className={`w-full py-1.5 px-3 rounded-xl font-game-display font-bold text-xs flex items-center justify-center gap-1.5 ${
                        canAffordNext
                          ? 'btn-3d-amber text-[#1C110C] cursor-pointer'
                          : 'bg-[#261914] border border-[#422B20] text-[#8E7665] cursor-not-allowed'
                      }`}
                    >
                      <span>
                        Restore Stage {storyStage + 1}/3: {nextSpec.title} ({nextSpec.costBolts} Crowns)
                      </span>
                    </button>
                  ) : (
                    <div className="text-[10px] font-mono font-bold text-emerald-300 text-center py-1 bg-emerald-950/40 rounded-lg border border-emerald-500/40">
                      Heirloom Restored (+15 Crowns Perk Active!)
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Wax Seal Stamp Skin Selector */}
            <div className="bg-[#160F0C] border border-[#472E21] rounded-2xl p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-game-display font-bold text-amber-200">
                <span>Wax Seal Stamp Crest</span>
                <span className="font-mono text-[10px] text-amber-300">
                  {FINIAL_SKINS[finialSkinId].perkLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {FINIAL_SKIN_ORDER.map((skinId) => {
                  const spec = FINIAL_SKINS[skinId];
                  const active = finialSkinId === skinId;
                  return (
                    <button
                      key={skinId}
                      type="button"
                      onClick={() => {
                        haptics.lightTap();
                        soundManager.playPinUnscrew(1.15);
                        onSelectFinialSkin?.(skinId);
                      }}
                      className={`py-1.5 px-2 rounded-xl border text-left text-[11px] font-game-display font-bold flex items-center justify-between gap-1 transition-all ${
                        active
                          ? 'bg-amber-400 border-[#24140B] text-[#1C110C]'
                          : 'bg-[#251814] border-[#422B20] text-[#E6D5C3] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{spec.shortLabel}</span>
                      {active ? (
                        <Check className="w-3.5 h-3.5 text-[#1C110C] stroke-[3] shrink-0" />
                      ) : (
                        <span className="font-mono text-[9px] text-amber-300">
                          +{spec.extraClearBolts}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[10px] text-[#B8A18D] text-center font-mono">
              {featureProgress.featureName} · WAX×2 · SIGNET · BOW Active
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
