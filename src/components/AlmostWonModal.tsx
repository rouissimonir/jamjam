import React from 'react';
import {
  AlertCircle,
  Scissors,
  RotateCcw,
  Award,
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
      className="absolute inset-x-0 top-8 bottom-0 z-50 bg-[#140D0B]/95 flex flex-col justify-between p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="almost-won-title"
    >
      {/* Top Bar with Streak & Crowns */}
      <div className="w-full flex items-center justify-between">
        {winStreak > 0 ? (
          <div className="px-3 py-1 rounded-xl bg-amber-400 border-2 border-[#26160D] text-[#1A0E09] text-xs font-game-display font-bold flex items-center gap-1 shadow-[0_3px_0_#78350F]">
            <Flame className="w-3.5 h-3.5 fill-[#1A0E09]" />
            <span>Save {winStreak}x Streak!</span>
          </div>
        ) : (
          <span />
        )}
        <GoldCoinPill bolts={bolts} onClick={onOpenWorkshop} />
      </div>

      {/* Main Warm Mahogany & Velvet Rescue Card */}
      <div className="w-full max-w-sm mx-auto bg-gradient-to-b from-[#2E1E19] to-[#1D1310] border-[2.5px] border-[#6B442A] rounded-3xl p-4 shadow-[0_8px_0_#0D0806,0_18px_36px_rgba(0,0,0,0.75)] flex flex-col gap-3 text-center my-auto">
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#E11D48] border-[2px] border-[#4C0519] shadow-[0_4px_0_#881337] flex items-center justify-center text-white">
            <AlertCircle className="w-6 h-6 stroke-[2.4]" />
          </div>
        </div>

        <div>
          <h2
            id="almost-won-title"
            className="font-game-display text-2xl font-bold text-[#FDF6EC] tracking-tight"
          >
            ONE RIBBON SHORT!
          </h2>
          <p className="text-xs text-[#DECBB9] mt-1 font-medium">
            Add +2 Extra Brass Pegs (7-Peg Rack) &amp; clear 2 parked ribbons to finish unboxing this heirloom!
          </p>
        </div>

        {/* Parcel Progress Metrics */}
        <div className="grid grid-cols-3 gap-2 bg-[#160F0C] border border-[#472E21] rounded-2xl p-2.5 shadow-inner">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#B8A18D] uppercase font-bold">Bobbins</span>
            <span className="text-sm font-bold font-mono tabular-nums text-amber-300">
              {completedBoxes}/{totalBoxes}
            </span>
          </div>
          <div className="flex flex-col border-x border-[#3B251B]">
            <span className="text-[10px] text-[#B8A18D] uppercase font-bold">Ribbons Left</span>
            <span className="text-sm font-bold font-mono tabular-nums text-rose-300">
              {remainingPlates}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#B8A18D] uppercase font-bold">Crowns</span>
            <span className="text-sm font-bold font-mono tabular-nums text-emerald-300">
              {bolts}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
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
                : 'bg-[#211612] text-[#7D6656] cursor-not-allowed border-2 border-[#3A261C]'
            }`}
          >
            <Scissors className="w-4 h-4 shrink-0" />
            <span>+2 Brass Pegs &amp; Clear 2</span>
            <span className="inline-flex items-center gap-1 ml-1">
              <span>{reviveCost}</span>
              <GoldDollarCoinSvg size={20} />
            </span>
          </button>

          <button
            onClick={() => {
              haptics.boxCompleted();
              soundManager.playWorkshopUpgrade();
              onBuyStarterPackAndRevive();
            }}
            className="btn-3d-green w-full py-2.5 px-3 rounded-2xl font-game-display font-bold text-sm text-game-outline-sm flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <GoldDollarCoinSvg size={22} />
            <span>$1.99 Pack: +500 Crowns + Unseal</span>
          </button>

          <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>
              {adsRemovedPermanently
                ? 'VIP Ad-Free Atelier Active'
                : 'Any starter pack permanently removes forced ads'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                haptics.lightTap();
                onRestart();
              }}
              data-start="true"
              className="btn-3d-slate flex-1 py-2 px-3 rounded-xl font-game-display font-bold text-xs text-[#FDF6EC] flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Re-Tie Parcel</span>
            </button>

            <button
              onClick={() => {
                haptics.lightTap();
                onOpenWorkshop();
              }}
              className="btn-3d-slate flex-1 py-2 px-3 rounded-xl font-game-display font-bold text-xs text-amber-200 flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Award className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Curio Gallery</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-28 h-1 bg-[#4F3527] rounded-full mx-auto" />
    </div>
  );
};
