import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Hammer,
  RefreshCw,
  X,
  Play,
  Layers,
  ShieldCheck,
  Download,
  Globe,
  ShoppingBag,
  Palette,
  Check,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { soundManager } from '../game/audio.ts';
import { haptics } from '../game/haptics.ts';
import { capacitorBridge, CapgoBundleState } from '../game/capacitorBridge.ts';
import {
  TactileThemeId,
  TACTILE_THEMES,
  PreLevelBoosterLoadout,
  FinialSkinId,
  FINIAL_SKINS,
  FINIAL_SKIN_ORDER,
  STORY_CHAPTERS,
  AtelierActivePerks,
  HeirloomId,
} from '../game/rules.ts';
import {
  US_CROSS_LOCALIZATION_LOCALES,
  TARGET_KEYWORD_CLUSTERS,
} from '../game/asoConfig.ts';
import {
  ArtisanAvatarSvg,
  StorySceneIllustrationSvg,
} from './CasualGameAssets.tsx';

export interface RenovationStation {
  id: string;
  name: string;
  category: string;
  level: number;
  maxLevel: number;
  cost: number;
  description: string;
  perk: string;
}

interface WorkshopModalProps {
  bolts: number;
  stations: RenovationStation[];
  onUpgradeStation: (stationId: string) => void;
  onLaunchLevel10: () => void;
  otaSynced: boolean;
  capgoState: CapgoBundleState;
  onSyncCapgoOta: () => void;
  themeId: TactileThemeId;
  onSelectTheme: (theme: TactileThemeId) => void;
  finialSkinId?: FinialSkinId;
  onSelectFinialSkin?: (skinId: FinialSkinId) => void;
  storyStage?: 0 | 1 | 2 | 3;
  onAdvanceStoryStage?: () => void;
  boosters: PreLevelBoosterLoadout;
  onToggleBooster: (key: keyof PreLevelBoosterLoadout) => void;
  adsRemovedPermanently: boolean;
  onPurchaseStarterCoinPack: () => void;
  initialTab?: 'atelier' | 'monetization' | 'aso';
  activePerks?: AtelierActivePerks;
  activeHeirloomId?: HeirloomId;
  onInspectCurio?: (heirloomId: HeirloomId) => void;
  onResetProgress?: () => void;
  onClose: () => void;
}

const THEME_IDS: TactileThemeId[] = ['stained_glass', 'knit_yarn', 'retro_gadget'];

export const WorkshopModal: React.FC<WorkshopModalProps> = ({
  bolts,
  stations,
  onUpgradeStation,
  onLaunchLevel10,
  otaSynced,
  capgoState,
  onSyncCapgoOta,
  themeId,
  onSelectTheme,
  finialSkinId = 'royal_brass',
  onSelectFinialSkin,
  storyStage = 1,
  onAdvanceStoryStage,
  boosters,
  onToggleBooster,
  adsRemovedPermanently,
  onPurchaseStarterCoinPack,
  initialTab = 'atelier',
  activePerks,
  activeHeirloomId = 'songbird_egg',
  onInspectCurio,
  onResetProgress,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'atelier' | 'monetization' | 'aso'>(initialTab);
  const [confirmReset, setConfirmReset] = useState(false);
  const [otaStatus, setOtaStatus] = useState<string>(
    otaSynced
      ? `Capgo OTA ${capgoState.version} · Parcel 11 Vault Active`
      : `Capgo Ready · ${capgoState.bundleId}`
  );
  const [isUpdatingOta, setIsUpdatingOta] = useState(false);

  const handleTriggerCapgoOta = async () => {
    if (isUpdatingOta || otaSynced) return;
    setIsUpdatingOta(true);
    setOtaStatus('Capgo: Checking production-ios channel...');
    haptics.lightTap();

    const updated = await capacitorBridge.syncLiveOtaLevelPack((pct) => {
      setOtaStatus(`Capgo: Downloading v1.3.4-royalpost (${pct}%)...`);
    });

    setIsUpdatingOta(false);
    onSyncCapgoOta();
    setOtaStatus(`Capgo OTA ${updated.version} Installed · Parcel 11 Ready`);
    soundManager.playWorkshopUpgrade();
    haptics.plateRelease();
  };

  const totalLevels = stations.reduce((acc, s) => acc + s.level, 0);
  const maxPossibleLevels = stations.reduce((acc, s) => acc + s.maxLevel, 0);
  const progressPercent = Math.round((totalLevels / maxPossibleLevels) * 100);

  return (
    <div
      className="absolute inset-x-0 top-8 bottom-0 z-50 bg-[#120B09]/96 flex flex-col justify-between p-2.5 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workshop-modal-title"
    >
      <div className="w-full h-full bg-[#1E1411] border border-[#613E2B] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-[#160F0C] border-b border-[#432B20]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-amber-500/15 text-amber-400 rounded-lg shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="workshop-modal-title" className="font-game-display text-sm font-bold text-[#FDF6EC] tracking-tight truncate">
                Royal Curio Gallery &amp; Atelier
              </h2>
              <span className="text-[10px] text-[#CDBAA8] font-mono tabular-nums block truncate">
                Cabinet: {progressPercent}% · {adsRemovedPermanently ? 'VIP Ad-Free' : 'Standard Tier'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-[#251814] border border-amber-500/45 rounded-lg px-2 py-1 text-amber-300 text-xs font-mono tabular-nums font-bold">
              <Sparkles className="w-3 h-3" />
              <span>{bolts}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#CDBAA8] hover:text-white rounded-lg hover:bg-[#2F1F19] transition-colors"
              aria-label="Close Curio Gallery"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-[#160F0C] border-b border-[#432B20]">
          <button
            onClick={() => {
              haptics.lightTap();
              setActiveTab('atelier');
            }}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
              activeTab === 'atelier'
                ? 'bg-amber-400 text-[#1C110C]'
                : 'text-[#DECBB9] hover:bg-[#2A1B16]'
            }`}
          >
            <Award className="w-3 h-3 shrink-0" />
            <span>Curio Atelier</span>
          </button>

          <button
            onClick={() => {
              haptics.lightTap();
              setActiveTab('monetization');
            }}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
              activeTab === 'monetization'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-[#DECBB9] hover:bg-[#2A1B16]'
            }`}
          >
            <ShoppingBag className="w-3 h-3 shrink-0" />
            <span>Wax &amp; Packs</span>
          </button>

          <button
            onClick={() => {
              haptics.lightTap();
              setActiveTab('aso');
            }}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
              activeTab === 'aso'
                ? 'bg-[#E11D48] text-white'
                : 'text-[#DECBB9] hover:bg-[#2A1B16]'
            }`}
          >
            <Globe className="w-3 h-3 shrink-0" />
            <span>iOS ASO</span>
          </button>
        </div>

        {/* TAB 1: Curio Atelier & Heirloom Restoration */}
        {activeTab === 'atelier' && (
          <>
            <div className="p-2.5 bg-[#261914] border-b border-amber-500/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/40 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-game-display font-bold text-[#FDF6EC] truncate">
                    Parcel 10: Grand Clockwork Reliquary
                  </div>
                  <p className="text-[10px] text-[#CDBAA8] truncate">
                    6 layered satin ribbons across 4 depth strata · +250 Crowns
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  haptics.lightTap();
                  onLaunchLevel10();
                }}
                data-start="true"
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#1C110C] font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Unseal #10</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-[#160F0C]">
              {activePerks && (
                <div className="bg-[#231713] border border-[#523526] rounded-xl p-2 grid grid-cols-4 gap-1 text-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-[#B8A18D]">Crowns</span>
                    <span className="text-[11px] font-mono font-bold text-amber-300 tabular-nums">
                      x{activePerks.crownRewardMultiplier.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-[#3D271C]">
                    <span className="text-[9px] font-mono text-[#B8A18D]">Wax/Combo</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-300 tabular-nums">
                      +{activePerks.waxAndComboBonusCrowns}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-[#3D271C]">
                    <span className="text-[9px] font-mono text-[#B8A18D]">Rack Clear</span>
                    <span className="text-[11px] font-mono font-bold text-amber-200 tabular-nums">
                      {activePerks.rackClearCost}c
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-[#3D271C]">
                    <span className="text-[9px] font-mono text-[#B8A18D]">Hint Glow</span>
                    <span className="text-[11px] font-mono font-bold text-amber-200 tabular-nums">
                      {(activePerks.idleHintDelayMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              )}
              {(() => {
                const chapter = STORY_CHAPTERS[themeId];
                const currentSpec = chapter.stages[storyStage];
                const nextSpec = storyStage < 3 ? chapter.stages[(storyStage + 1) as 1 | 2 | 3] : null;
                const canAffordNext = Boolean(nextSpec && bolts >= nextSpec.costBolts);
                return (
                  <div className="bg-[#231713] border border-amber-500/45 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ArtisanAvatarSvg themeId={themeId} size={32} />
                        <div className="min-w-0">
                          <div className="text-xs font-game-display font-bold text-amber-300 truncate">
                            {chapter.actLabel} · {chapter.chapterTitle}
                          </div>
                          <div className="text-[10px] font-mono text-[#DECBB9] truncate">
                            {chapter.artisanName} ({chapter.artisanTitle}) · Stage {storyStage}/3
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-300 shrink-0">
                        {storyStage === 3 ? 'EXHIBITED!' : '+100 GOAL'}
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
                        className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-transform ${
                          canAffordNext
                            ? 'bg-amber-400 hover:bg-amber-300 text-[#1C110C] active:scale-95 cursor-pointer'
                            : 'bg-[#2C1D17] border border-[#493022] text-[#8E7665] cursor-not-allowed'
                        }`}
                      >
                        <span>
                          Restore Stage {storyStage + 1}/3: {nextSpec.title} ({nextSpec.costBolts} Crowns)
                        </span>
                      </button>
                    ) : (
                      <div className="text-[10px] font-mono font-bold text-emerald-300 text-center py-1 bg-emerald-950/40 rounded-lg border border-emerald-500/40">
                        Curio Restored (+100 Crowns Claimed &amp; +15 Clear Perk Active)
                      </div>
                    )}
                    {onInspectCurio && (
                      <button
                        type="button"
                        onClick={() => {
                          haptics.lightTap();
                          onInspectCurio(activeHeirloomId);
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-[#2E1E17] hover:bg-[#3A271E] border border-amber-400/55 text-amber-200 font-game-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Inspect &amp; Play Curio Pedestal</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {stations.map((station) => {
                const isMaxed = station.level >= station.maxLevel;
                const canAfford = bolts >= station.cost;

                return (
                  <div
                    key={station.id}
                    className="bg-[#211612] border border-[#422B20] rounded-xl p-2.5 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-game-display font-bold text-[#FDF6EC] block truncate">
                          {station.name}
                        </span>
                        <span className="text-[10px] text-amber-300 font-mono tabular-nums">
                          {station.category} · Tier {station.level}/{station.maxLevel}
                        </span>
                      </div>

                      {isMaxed ? (
                        <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Maxed</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onUpgradeStation(station.id)}
                          disabled={!canAfford}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-bold transition-transform whitespace-nowrap shrink-0 ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 text-[#1C110C] active:scale-95'
                              : 'bg-[#2B1D17] text-[#826A5A] border border-[#432C21] cursor-not-allowed'
                          }`}
                        >
                          <Hammer className="w-3 h-3" />
                          <span>Upgrade ({station.cost})</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-[#CDBAA8] leading-snug">{station.description}</p>

                    <div className="text-[10px] font-medium text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span>{station.perk}</span>
                    </div>
                  </div>
                );
              })}

              {onResetProgress && (
                <div className="bg-[#1C120F] border border-[#3E271D] rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-game-display font-bold text-[#E6D5C3]">
                      Archivist Ledger Save
                    </div>
                    <p className="text-[9.5px] text-[#A8917D] leading-snug">
                      Auto-saved locally offline. Reset to start fresh from Parcel 1.
                    </p>
                  </div>
                  {confirmReset ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="px-2 py-1 rounded-lg bg-[#2C1D17] text-[#DECBB9] text-[10px] font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          haptics.plateRelease();
                          setConfirmReset(false);
                          onResetProgress();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                      >
                        Confirm Reset
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        haptics.lightTap();
                        setConfirmReset(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2A1B16] hover:bg-[#3A241C] border border-[#523526] text-rose-300 text-[10px] font-bold shrink-0 whitespace-nowrap"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Progress</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: Desk Finishes, Wax Stamp Crests, Pre-Parcel Boosters & Royal Pack */}
        {activeTab === 'monetization' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#160F0C]">
            <div className="bg-[#211612] border border-[#422B20] rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-game-display font-bold text-[#FDF6EC] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Atelier Desk Finishes</span>
                </span>
                <span className="text-[10px] font-mono text-amber-300">Tactile Themes</span>
              </div>

              <div className="space-y-1.5">
                {THEME_IDS.map((id) => {
                  const spec = TACTILE_THEMES[id];
                  const active = themeId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        haptics.lightTap();
                        onSelectTheme(id);
                      }}
                      className={`w-full text-left p-2 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                        active
                          ? 'bg-amber-500/15 border-amber-400 text-[#FDF6EC]'
                          : 'bg-[#170F0D] border-[#3B251B] text-[#DECBB9] hover:border-[#5C3A27]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {spec.name} · <span className="text-amber-300">{spec.clearEffectLabel}</span>
                        </div>
                        <p className="text-[10px] text-[#B8A18D] truncate">{spec.description}</p>
                      </div>
                      {active && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#211612] border border-[#422B20] rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-game-display font-bold text-[#FDF6EC] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Wax Seal Stamp Crests</span>
                </span>
                <span className="text-[10px] font-mono text-amber-300">
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
                      className={`p-2 rounded-xl border text-left transition-colors flex items-center justify-between gap-1 ${
                        active
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : 'bg-[#170F0D] border-[#3B251B] text-[#DECBB9] hover:border-[#5C3A27]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{spec.shortLabel}</div>
                        <div className="text-[10px] text-amber-300 font-mono">
                          +{spec.extraClearBolts} Crowns
                        </div>
                      </div>
                      {active && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#211612] border border-[#422B20] rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-game-display font-bold text-[#FDF6EC]">
                  Pre-Parcel Boosters
                </span>
                <span className="text-[10px] font-mono text-emerald-300">Zero Timer</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    haptics.lightTap();
                    onToggleBooster('extraBufferHoles');
                  }}
                  className={`p-2 rounded-xl border text-left transition-colors ${
                    boosters.extraBufferHoles
                      ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200'
                      : 'bg-[#170F0D] border-[#3B251B] text-[#DECBB9]'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>7-Peg Rack</span>
                    {boosters.extraBufferHoles && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-[#B8A18D] mt-0.5">
                    +2 brass holding pegs from turn 1.
                  </p>
                </button>

                <button
                  onClick={() => {
                    haptics.lightTap();
                    onToggleBooster('dualToolbox');
                  }}
                  className={`p-2 rounded-xl border text-left transition-colors ${
                    boosters.dualToolbox
                      ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                      : 'bg-[#170F0D] border-[#3B251B] text-[#DECBB9]'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Dual Bobbin</span>
                    {boosters.dualToolbox && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-[#B8A18D] mt-0.5">
                    Wind 2 velvet bobbins simultaneously.
                  </p>
                </button>
              </div>
            </div>

            <div className="bg-[#211612] border border-emerald-500/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-game-display font-bold text-emerald-300">
                  Royal Courier Starter Pack
                </span>
                <span className="text-[10px] font-mono text-amber-300">Permanent Ad-Free</span>
              </div>

              <button
                onClick={() => {
                  haptics.boxCompleted();
                  soundManager.playWorkshopUpgrade();
                  onPurchaseStarterCoinPack();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-between shadow-md transition-transform active:scale-95"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>$1.99 Royal Pack (+500 Crowns + Boosters)</span>
                </span>
                <span className="font-mono">$1.99</span>
              </button>

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-medium pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {adsRemovedPermanently
                    ? 'Active: All forced interstitial & banner ads permanently removed!'
                    : 'Any IAP purchase permanently removes forced interstitial & banner ads.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ASO Keyword Clusters */}
        {activeTab === 'aso' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#160F0C]">
            <div className="bg-[#211612] border border-amber-500/40 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-game-display font-bold text-amber-300">
                  Blue-Ocean iOS App Store Positioning
                </span>
                <span className="text-[10px] font-mono text-emerald-300">10 Locales</span>
              </div>
              <p className="text-[10px] text-[#DECBB9] leading-snug">
                Targets untapped Wax Seal, Satin Ribbon &amp; Luxury ASMR Unboxing keyword clusters across 10 U.S.-indexed App Store locales:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {TARGET_KEYWORD_CLUSTERS.map((c) => (
                  <div
                    key={c.cluster}
                    className="bg-[#170F0D] border border-[#3B251B] rounded-lg px-2 py-1 flex items-center gap-1.5"
                  >
                    <span className="text-[10px] font-bold text-amber-300 whitespace-nowrap">
                      {c.cluster}
                    </span>
                    <span className="text-[9px] font-mono text-[#B8A18D]">
                      Diff {c.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              {US_CROSS_LOCALIZATION_LOCALES.map((loc) => (
                <div
                  key={loc.localeCode}
                  className="bg-[#211612] border border-[#3B251B] rounded-xl p-2 flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#FDF6EC]">
                      {loc.localeCode} · <span className="text-[#B8A18D] font-normal">{loc.localeName}</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-300">
                      {loc.keywordField100.length}/100 chars
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-medium truncate">
                    {loc.title30} — {loc.subtitle30}
                  </div>
                  <div className="text-[9px] font-mono text-[#CDBAA8] bg-[#160F0C] rounded px-1.5 py-1 truncate">
                    {loc.keywordField100}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capgo Live OTA Footer */}
        <div className="p-2.5 bg-[#160F0C] border-t border-[#432B20] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <RefreshCw
              className={`w-3.5 h-3.5 text-amber-400 shrink-0 ${isUpdatingOta ? 'animate-spin' : ''}`}
            />
            <span className="text-[10px] text-[#DECBB9] font-mono truncate">{otaStatus}</span>
          </div>

          <button
            onClick={handleTriggerCapgoOta}
            disabled={isUpdatingOta || otaSynced}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 transition-colors whitespace-nowrap ${
              otaSynced
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                : 'bg-[#2B1D17] hover:bg-[#3A271E] text-amber-200 border border-[#5C3A27]'
            }`}
          >
            <Download className="w-3 h-3" />
            <span>{otaSynced ? 'OTA Synced' : 'Capgo OTA'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
