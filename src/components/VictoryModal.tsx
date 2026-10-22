import React, { useState, useMemo } from 'react';
import { RotateCcw, Wrench, Zap, X, Check } from 'lucide-react';
import { soundManager } from '../game/audio.ts';
import { haptics } from '../game/haptics.ts';
import { LevelConfig } from '../game/levels.ts';
import {
  TactileThemeId,
  computeFeatureUnlockProgress,
  computeScrewPassCount,
  computeAtelierMasteryTrophy,
  computeScrewPassChestState,
  FinialSkinId,
  FINIAL_SKINS,
  FINIAL_SKIN_ORDER,
} from '../game/rules.ts';
import {
  GoldCoinPill,
  GoldDollarCoinSvg,
  BlueScrewMedallion,
  NewFeatureProgressBar,
  LevelCompletedBannerSvg,
  AtelierMasterpieceShowcaseSvg,
  BrassScrewChestSvg,
} from './CasualGameAssets.tsx';

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
  onNextLevel: () => void;
  onRestart: () => void;
  onOpenWorkshop: () => void;
  onOpenCoinStore: () => void;
  onAddBonusBolts?: (extraBolts: number) => void;
  hasNextLevel: boolean;
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
  onNextLevel,
  onRestart,
  onOpenWorkshop,
  onOpenCoinStore,
  onAddBonusBolts,
  hasNextLevel,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [isOverclocked, setIsOverclocked] = useState(false);
  const [bonusAdded, setBonusAdded] = useState(0);
  const [showFeatureVault, setShowFeatureVault] = useState(false);
  const [chestJustOpened, setChestJustOpened] = useState(false);

  React.useEffect(() => {
    soundManager.playBoxCompleted();
    haptics.boxCompleted();
  }, []);

  const featureProgress = useMemo(
    () => computeFeatureUnlockProgress(currentLevel.id, clearedLevelIds),
    [currentLevel.id, clearedLevelIds]
  );

  const screwPassCount = useMemo(
    () => computeScrewPassCount(currentLevel.toolboxColors.length, 3),
    [currentLevel.toolboxColors.length]
  );

  const chestState = useMemo(
    () => computeScrewPassChestState(totalScrewsCollected, screwChestsClaimed),
    [totalScrewsCollected, screwChestsClaimed]
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
      className="absolute inset-x-0 top-9 bottom-0 z-50 bg-[radial-gradient(circle_at_50%_42%,#6B7487_0%,#495061_62%,#2C3240_100%)] flex flex-col justify-between px-4 pt-4 pb-5 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-modal-title"
    >
      {/* Subtle Clockwork Blueprint Concentric Rings & Corner Brass Rivets */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle
          cx="200"
          cy="390"
          r="155"
          fill="none"
          stroke="#FDE047"
          strokeWidth="1.2"
          strokeDasharray="6 6"
        />
        <circle
          cx="200"
          cy="390"
          r="225"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="1"
          strokeDasharray="3 8"
        />
      </svg>

      {/* Top Section: Header Row + Upper-Third 'LEVEL COMPLETED' Banner + Progression Row */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Top Row: Centered 'Level X' Outlined Title + Top-Right 3D Gold Coin Pill */}
        <div className="relative w-full flex items-center justify-center min-h-[40px]">
          <h2
            id="victory-modal-title"
            className="font-game-display font-bold text-[25px] tracking-normal text-game-outline leading-none"
          >
            Level {currentLevel.id}
          </h2>

          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <GoldCoinPill
              bolts={bolts + bonusAdded}
              onClick={() => onOpenCoinStore()}
              pulse={isClaiming || chestJustOpened}
            />
          </div>
        </div>

        {/* Giant 2-Line 3D Extruded Golden-Orange Banner over 5 Brass-Collared Screw Holes */}
        <div className="w-full mt-3 mb-1 animate-float-bounce">
          <LevelCompletedBannerSvg />
        </div>

        {/* Progression Row: Left 3D Blue Screw Medallion ('15') + Right 'NEW FEATURE' ('5 / 10') Bar */}
        <div className="w-full flex items-center justify-between pl-1 pr-4 mt-0.5">
          <BlueScrewMedallion
            count={screwPassCount}
            onClick={() => {
              haptics.lightTap();
              setShowFeatureVault(true);
            }}
          />

          <NewFeatureProgressBar
            progress={featureProgress}
            onClick={() => {
              haptics.lightTap();
              setShowFeatureVault(true);
            }}
          />
        </div>
      </div>

      {/* Center Section: Bespoke 3D Clockwork Atelier Masterpiece Relic & 3-Star Gear Showcase */}
      <div className="relative z-10 w-full flex items-center justify-center my-auto">
        <AtelierMasterpieceShowcaseSvg
          trophy={trophy}
          themeId={themeId}
          clearTimeSeconds={clearTimeSeconds}
          screwCount={screwPassCount}
          totalBoxes={currentLevel.toolboxColors.length}
          isOverclocked={isOverclocked}
          onTapShowcase={handleToggleOverclock}
        />
      </div>

      {/* Bottom Section: Iconic Chunky 3D Sky-Blue Claim Button [ 10 ($) ] + 2x Gear Overclock & Atelier Actions */}
      <div className="relative z-10 w-full flex flex-col items-center gap-3.5 mb-1">
        {/* Flying Gold Coins Burst when Claiming */}
        {isClaiming && (
          <div className="pointer-events-none absolute inset-x-0 bottom-14 flex items-center justify-center">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="absolute animate-coin-fly"
                style={{ animationDelay: `${idx * 65}ms` }}
              >
                <GoldDollarCoinSvg size={28} />
              </div>
            ))}
          </div>
        )}

        {/* Primary CTA Row: Chunky 3D Sky-Blue Claim Button [ 10 ($) / 20 ($) ] */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleClaimAndContinue}
            data-start="true"
            aria-label={`Claim ${claimDisplayAmount} Coins and Continue to Next Level`}
            className="btn-3d-blue w-[156px] h-[56px] rounded-[16px] flex items-center justify-center gap-2.5 cursor-pointer select-none"
          >
            <span className="font-game-display font-bold text-[28px] tabular-nums text-game-outline leading-none">
              {claimDisplayAmount}
            </span>
            <GoldDollarCoinSvg size={29} />
          </button>

          {/* Unique Clockwork 2x Gear Overclock Booster Button */}
          <button
            type="button"
            onClick={handleToggleOverclock}
            aria-pressed={isOverclocked}
            title="Spin Clockwork Overclock Gears to Double Coin Claim (20 $)"
            className={`${
              isOverclocked ? 'btn-3d-green' : 'btn-3d-amber'
            } h-[56px] px-3.5 rounded-[16px] flex flex-col items-center justify-center cursor-pointer select-none`}
          >
            <span className="flex items-center gap-1 font-game-display font-bold text-[13px] text-game-outline-sm leading-none">
              <Zap className="w-3.5 h-3.5 fill-amber-200 text-white shrink-0" />
              <span>{isOverclocked ? '2X ACTIVE!' : '2X GEAR'}</span>
            </span>
            <span className="font-mono font-bold text-[10px] text-slate-950 mt-0.5">
              {isOverclocked ? '+20 $ Ready' : `Boost +${rewardBolts}`}
            </span>
          </button>
        </div>

        {/* Quiet Secondary Controls for Replay, Screw Chest Vault, & Workshop Atelier */}
        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              haptics.lightTap();
              onRestart();
            }}
            className="btn-3d-slate px-3 py-1.5 rounded-xl text-[11px] font-game-display font-bold text-slate-100 flex items-center gap-1.5"
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
              chestState.isReadyToClaim ? 'btn-3d-green text-game-outline-sm' : 'btn-3d-slate text-sky-300'
            } px-3 py-1.5 rounded-xl text-[11px] font-game-display font-bold flex items-center gap-1.5`}
          >
            <span>{chestState.isReadyToClaim ? 'Chest Ready!' : `Screws ${chestState.label}`}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.lightTap();
              onOpenWorkshop();
            }}
            className="btn-3d-slate px-3 py-1.5 rounded-xl text-[11px] font-game-display font-bold text-amber-300 flex items-center gap-1.5"
          >
            <Wrench className="w-3 h-3" />
            <span>Atelier ({bolts + bonusAdded})</span>
          </button>
        </div>
      </div>

      {/* Interactive 3D Screw Pass Chest & Star-Keyhole Feature Vault Modal (Opened via Medallion, Progress Bar, or Chest Button) */}
      {showFeatureVault && (
        <div
          className="absolute inset-0 z-30 bg-[#0A0E17]/92 flex items-center justify-center p-3.5"
          role="dialog"
          aria-modal="true"
          aria-label="Screw Pass Chest & Star-Keyhole Feature Vault"
        >
          <div className="w-full max-w-[348px] bg-gradient-to-b from-[#232E45] to-[#141B2B] border-[3px] border-[#141824] rounded-3xl p-4 shadow-[0_10px_0_#0B0F18,0_20px_40px_rgba(0,0,0,0.85)] flex flex-col gap-3">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <span className="font-game-display font-bold text-base text-game-outline-sm">
                ATELIER VAULT & CHEST
              </span>
              <button
                type="button"
                onClick={() => setShowFeatureVault(false)}
                aria-label="Close Vault Modal"
                className="btn-3d-slate p-1.5 rounded-xl text-slate-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: 3D Brass Screw Pass Collector Chest (50 Screws -> +75 Coins) */}
            <div className="bg-[#111726] border-2 border-[#141824] rounded-2xl p-3 flex items-center justify-between gap-3">
              <BrassScrewChestSvg
                isReady={chestState.isReadyToClaim}
                isOpened={chestJustOpened}
                size={58}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-game-display font-bold text-amber-300">
                  <span>Screw Pass Chest</span>
                  <span className="font-mono text-white">{chestState.label}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 border border-slate-950 rounded-full overflow-hidden my-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#5CE619] to-[#38C712] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(10, chestState.ratioPercent)}%` }}
                  />
                </div>
                {chestState.isReadyToClaim ? (
                  <button
                    type="button"
                    onClick={handleClaimChestReward}
                    className="btn-3d-green w-full py-1.5 px-3 rounded-xl font-game-display font-bold text-xs text-game-outline-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>OPEN CHEST (+{chestState.rewardBolts} $)</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-300 font-medium block">
                    {chestJustOpened
                      ? `Claimed +${chestState.rewardBolts} $ Coins! Extract more screws to refill.`
                      : `Extract ${chestState.targetPerChest - chestState.currentProgressInTier} more screws to unlock +${chestState.rewardBolts} $`}
                  </span>
                )}
              </div>
            </div>

            {/* Section 2: Star-Keyhole Clasp (NEW FEATURE 5 / 10) Blueprint Preview */}
            <div className="bg-[#111726] border-2 border-[#141824] rounded-2xl p-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-game-display font-bold text-xs text-amber-300">
                  {featureProgress.featureName} ({featureProgress.label})
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  LIVE ON BOARD
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Pulling a golden <strong className="text-amber-300">KEY</strong> clasp on the board automatically unlocks any <strong className="text-amber-200">LOCK</strong> padlock pin and awards <strong className="text-emerald-300">+15 $ Bonus Coins</strong>!
              </p>
            </div>

            {/* Section 3: Toolsmith Bench Finial Skin Selector */}
            <div className="bg-[#111726] border-2 border-[#141824] rounded-2xl p-2.5 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-game-display font-bold text-sky-300">
                <span>Toolsmith Finial Skin</span>
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
                      className={`py-1.5 px-2 rounded-xl border-2 text-left text-[11px] font-game-display font-bold flex items-center justify-between gap-1 transition-all ${
                        active
                          ? 'bg-gradient-to-b from-[#FFE042] to-[#FFA200] border-[#141824] text-slate-950 shadow-[0_2.5px_0_#92400E]'
                          : 'bg-[#1B253B] border-[#111520] text-slate-200 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{spec.shortLabel}</span>
                      {active ? (
                        <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3] shrink-0" />
                      ) : (
                        <span className="font-mono text-[9px] text-amber-300">
                          +{spec.extraClearBolts}$
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

