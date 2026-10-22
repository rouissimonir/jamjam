import React from 'react';
import {
  AlertCircle,
  Magnet,
  RotateCcw,
  Wrench,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { soundManager } from '../game/audio.ts';
import { haptics } from '../game/haptics.ts';
import { GoldCoinPill, GoldDollarCoinSvg } from './CasualGameAssets.tsx';

interface AlmostWonModalProps {
  onRevive: (expandBufferSlots: boolean) => void;
  onBuyStarterPackAndRevive: () => void;
  onRestart: () => void;
  onOpenWorkshop: () => void;
  bolts: number;
  winStreak: number;
  adsRemovedPermanently: boolean;
  remainingPlates: number;
  completedBoxes: number;
  totalBoxes: number;
}

export const AlmostWonModal: React.FC<AlmostWonModalProps> = ({
  onRevive,
  onBuyStarterPackAndRevive,
  onRestart,
  onOpenWorkshop,
  bolts,
  winStreak,
  adsRemovedPermanently,
  remainingPlates,
  completedBoxes,
  totalBoxes,
}) => {
  const reviveCost = 30;
  const canAffordRevive = bolts >= reviveCost;

  React.useEffect(() => {
    soundManager.playAlmostWonFail();
    haptics.failState();
  }, []);

  return (
    <div
      className="absolute inset-x-0 top-9 bottom-0 z-50 bg-[#2C2E36]/95 flex flex-col justify-between p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="almost-won-title"
    >
      {/* Top Bar with Coin Pill */}
      <div className="w-full flex items-center justify-between">
        {winStreak > 0 ? (
          <div className="px-3 py-1 rounded-xl bg-orange-500 border-2 border-[#141824] text-slate-950 text-xs font-game-display font-bold flex items-center gap-1 shadow-[0_3px_0_#141824]">
            <Flame className="w-3.5 h-3.5 fill-slate-950" />
            <span>Save {winStreak}x Streak!</span>
          </div>
        ) : (
          <span />
        )}
        <GoldCoinPill bolts={bolts} onClick={onOpenWorkshop} />
      </div>

      {/* Main 3D Card */}
      <div className="w-full max-w-sm mx-auto bg-gradient-to-b from-[#232D42] to-[#161D2B] border-[3px] border-[#141824] rounded-3xl p-4 shadow-[0_8px_0_#0D111A,0_16px_30px_rgba(0,0,0,0.65)] flex flex-col gap-3 text-center my-auto">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 border-[2.5px] border-[#141824] shadow-[0_4px_0_#9F1239] flex items-center justify-center text-white">
            <AlertCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div>
          <h2
            id="almost-won-title"
            className="font-game-display text-2xl font-bold text-game-outline tracking-tight"
          >
            ALMOST WON!
          </h2>
          <p className="text-xs text-slate-200 mt-1 font-medium">
            Unlock +2 Extra Buffer Holes (7-Hole Dock) & clear 2 pins to finish this blueprint!
          </p>
        </div>

        {/* Progress-Toward-Goal Metrics */}
        <div className="grid grid-cols-3 gap-2 bg-[#0F1522] border-2 border-[#141824] rounded-2xl p-2.5 shadow-inner">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Boxes Packed</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-400">
              {completedBoxes}/{totalBoxes}
            </span>
          </div>
          <div className="flex flex-col border-x border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Pieces Left</span>
            <span className="text-sm font-bold font-mono tabular-nums text-rose-400">
              {remainingPlates}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Coins Bank</span>
            <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
              {bolts}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          {/* Offer 1: The "Fail" Offer (+2 Extra Buffer Space + Clear 2 Pins) */}
          <button
            onClick={() => {
              if (canAffordRevive) {
                haptics.plateRelease();
                soundManager.playWorkshopUpgrade();
                onRevive(true);
              }
            }}
            disabled={!canAffordRevive}
            className={`w-full py-2.5 px-3 rounded-2xl font-game-display font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
              canAffordRevive
                ? 'btn-3d-blue text-game-outline-sm cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border-2 border-slate-700'
            }`}
          >
            <Magnet className="w-4 h-4 shrink-0" />
            <span>+2 Holes & Clear 2</span>
            <span className="inline-flex items-center gap-1 ml-1">
              <span>{reviveCost}</span>
              <GoldDollarCoinSvg size={20} />
            </span>
          </button>

          {/* Offer 2: The $1.99 Coin & Fail Rescue Pack (30% Revenue Formula + Mob Control Rule) */}
          <button
            onClick={() => {
              haptics.boxCompleted();
              soundManager.playWorkshopUpgrade();
              onBuyStarterPackAndRevive();
            }}
            className="btn-3d-green w-full py-2.5 px-3 rounded-2xl font-game-display font-bold text-sm text-game-outline-sm flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <GoldDollarCoinSvg size={22} />
            <span>$1.99 Pack: +500 Coins + Revive</span>
          </button>

          {/* Mob Control Rule Guarantee */}
          <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>
              {adsRemovedPermanently
                ? 'VIP Ad-Free Atelier Active (Forced Ads Removed)'
                : 'Any IAP permanently removes forced interstitial & banner ads'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                haptics.lightTap();
                onRestart();
              }}
              data-start="true"
              className="btn-3d-slate flex-1 py-2 px-3 rounded-xl font-game-display font-bold text-xs text-slate-100 flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Try Again</span>
            </button>

            <button
              onClick={() => {
                haptics.lightTap();
                onOpenWorkshop();
              }}
              className="btn-3d-slate flex-1 py-2 px-3 rounded-xl font-game-display font-bold text-xs text-amber-300 flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Workshop</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-32 h-1 bg-slate-400/50 rounded-full mx-auto" />
    </div>
  );
};
