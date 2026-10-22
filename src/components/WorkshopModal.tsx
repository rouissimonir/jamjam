import React, { useState } from 'react';
import {
  Wrench,
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
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'atelier' | 'monetization' | 'aso'>(initialTab);
  const [otaStatus, setOtaStatus] = useState<string>(
    otaSynced
      ? `Capgo OTA ${capgoState.version} · Level 11 Vault Active`
      : `Capgo Ready · ${capgoState.bundleId}`
  );
  const [isUpdatingOta, setIsUpdatingOta] = useState(false);

  const handleTriggerCapgoOta = async () => {
    if (isUpdatingOta || otaSynced) return;
    setIsUpdatingOta(true);
    setOtaStatus('Capgo: Checking production-ios channel...');
    haptics.lightTap();

    const updated = await capacitorBridge.syncLiveOtaLevelPack((pct) => {
      setOtaStatus(`Capgo: Downloading v1.3.4-atelier (${pct}%)...`);
    });

    setIsUpdatingOta(false);
    onSyncCapgoOta();
    setOtaStatus(`Capgo OTA ${updated.version} Installed · Lv.11 Ready`);
    soundManager.playWorkshopUpgrade();
    haptics.plateRelease();
  };

  const totalLevels = stations.reduce((acc, s) => acc + s.level, 0);
  const maxPossibleLevels = stations.reduce((acc, s) => acc + s.maxLevel, 0);
  const progressPercent = Math.round((totalLevels / maxPossibleLevels) * 100);

  return (
    <div
      className="absolute inset-x-0 top-9 bottom-0 z-50 bg-[#090D16]/96 flex flex-col justify-between p-2.5 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workshop-modal-title"
    >
      <div className="w-full h-full bg-[#151C2A] border border-amber-500/50 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-[#101622] border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-amber-500/15 text-amber-400 rounded-lg shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="workshop-modal-title" className="text-xs font-bold text-white tracking-tight truncate">
                Atelier, 30% IAP Economy & ASO Lab
              </h2>
              <span className="text-[10px] text-slate-400 font-mono tabular-nums block truncate">
                Restoration: {progressPercent}% · {adsRemovedPermanently ? 'VIP Ad-Free' : 'Standard Tier'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-[#0D121C] border border-amber-500/40 rounded-lg px-2 py-1 text-amber-400 text-xs font-mono tabular-nums font-bold">
              <Sparkles className="w-3 h-3" />
              <span>{bolts}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close Workshop"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Tab Navigation: Atelier | 3rd-Gen & $1.99 IAP | ASO 1,600c */}
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-[#0D121C] border-b border-slate-800">
          <button
            onClick={() => {
              haptics.lightTap();
              setActiveTab('atelier');
            }}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'atelier'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-3 h-3 shrink-0" />
            <span>Lv.10 Atelier</span>
          </button>

          <button
            onClick={() => {
              haptics.lightTap();
              setActiveTab('monetization');
            }}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'monetization'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3 h-3 shrink-0" />
            <span>3rd-Gen & IAP</span>
          </button>

          <button
            onClick={() => {
              haptics.lightTap();
              setActiveTab('aso');
            }}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'aso'
                ? 'bg-sky-400 text-slate-950'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3 h-3 shrink-0" />
            <span>ASO (1,600c)</span>
          </button>
        </div>

        {/* TAB 1: Level 10 Atelier Renovation */}
        {activeTab === 'atelier' && (
          <>
            <div className="p-2.5 bg-[#1A2233] border-b border-amber-500/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/40 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    Level 10 Master Blueprint
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">
                    6 interlocking plates across 4 depth layers · +250 Bolts
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  haptics.lightTap();
                  onLaunchLevel10();
                }}
                data-start="true"
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-transform active:scale-95 whitespace-nowrap shrink-0"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play Lv.10</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {/* Wool Craze-Style Episodic Story Chapter Restoration Card */}
              {(() => {
                const chapter = STORY_CHAPTERS[themeId];
                const currentSpec = chapter.stages[storyStage];
                const nextSpec = storyStage < 3 ? chapter.stages[(storyStage + 1) as 1 | 2 | 3] : null;
                const canAffordNext = Boolean(nextSpec && bolts >= nextSpec.costBolts);
                return (
                  <div className="bg-[#111723] border border-amber-500/40 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ArtisanAvatarSvg themeId={themeId} size={32} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-amber-300 truncate">
                            {chapter.actLabel} · {chapter.chapterTitle}
                          </div>
                          <div className="text-[10px] font-mono text-slate-300 truncate">
                            {chapter.artisanName} ({chapter.artisanTitle}) · Stage {storyStage}/3
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                        {storyStage === 3 ? 'MASTERPIECE!' : '+100$ GOAL'}
                      </span>
                    </div>

                    <StorySceneIllustrationSvg themeId={themeId} stage={storyStage} />

                    <p className="text-[10px] text-slate-300 leading-snug">
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
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 cursor-pointer'
                            : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>
                          Restore Stage {storyStage + 1}/3: {nextSpec.title} ({nextSpec.costBolts} Bolts)
                          {storyStage + 1 === 3 ? ' -> +100 $ Bonus!' : ''}
                        </span>
                      </button>
                    ) : (
                      <div className="text-[10px] font-mono font-bold text-emerald-300 text-center py-1 bg-emerald-950/40 rounded-lg border border-emerald-500/40">
                        Masterpiece Restored! (+100 $ Claimed & +15 $ Clear Perk Active)
                      </div>
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
                    className="bg-[#111723] border border-slate-800 rounded-xl p-2.5 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-100 block truncate">
                          {station.name}
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono tabular-nums">
                          {station.category} · Tier {station.level}/{station.maxLevel}
                        </span>
                      </div>

                      {isMaxed ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Maxed</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onUpgradeStation(station.id)}
                          disabled={!canAfford}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-bold transition-transform whitespace-nowrap shrink-0 ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <Hammer className="w-3 h-3" />
                          <span>Renovate ({station.cost})</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">{station.description}</p>

                    <div className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span>{station.perk}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: Pillar A (3rd-Gen Themes), Pillar B (Pre-Level Boosters), Pillar C (30% Revenue IAP & Mob Control Rule) */}
        {activeTab === 'monetization' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Pillar A: 3rd-Gen Tactile Themes */}
            <div className="bg-[#111723] border border-slate-800 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>A. 3rd-Generation Tactile Themes</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400">Lower CPI / High CTR</span>
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
                          ? 'bg-amber-500/15 border-amber-400 text-white'
                          : 'bg-[#0D121C] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {spec.name} · <span className="text-amber-300">{spec.clearEffectLabel}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{spec.description}</p>
                      </div>
                      {active && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toolsmith Finial Skins Bench */}
            <div className="bg-[#111723] border border-slate-800 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>Toolsmith Finial Skins</span>
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
                          : 'bg-[#0D121C] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{spec.shortLabel}</div>
                        <div className="text-[10px] text-amber-400 font-mono">
                          +{spec.extraClearBolts} $ Clear Bonus
                        </div>
                      </div>
                      {active && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pillar B: Royal Match-Style Pre-Level Boosters */}
            <div className="bg-[#111723] border border-slate-800 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  B. Pre-Level Boosters (Win Streak Protection)
                </span>
                <span className="text-[10px] font-mono text-sky-400">2.5D + Loadout</span>
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
                      : 'bg-[#0D121C] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>7-Hole Buffer</span>
                    {boosters.extraBufferHoles && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    +2 extra holding buffer holes from turn 1.
                  </p>
                </button>

                <button
                  onClick={() => {
                    haptics.lightTap();
                    onToggleBooster('dualToolbox');
                  }}
                  className={`p-2 rounded-xl border text-left transition-colors ${
                    boosters.dualToolbox
                      ? 'bg-sky-500/15 border-sky-400 text-sky-200'
                      : 'bg-[#0D121C] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Dual-Toolbox</span>
                    {boosters.dualToolbox && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    2 active toolboxes open simultaneously.
                  </p>
                </button>
              </div>
            </div>

            {/* Pillar C: The "30% Revenue" Monetization Formula + Mob Control Rule */}
            <div className="bg-[#111723] border border-emerald-500/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">
                  C. "30% Revenue" Formula ($1.99 Coin Pack + Fail Offer)
                </span>
                <span className="text-[10px] font-mono text-amber-300">Top-10 Hybrid Meta</span>
              </div>

              <p className="text-[11px] text-slate-300 leading-snug">
                Pairs the high-converting <strong>Almost Won Fail Offer (+2 Buffer Space)</strong> with the <strong>$1.99 Pocket Coin Pack</strong> and Mob Control&apos;s permanent ad-removal incentive:
              </p>

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
                  <span>$1.99 Pocket Pack (+500 Bolts + Boosters)</span>
                </span>
                <span className="font-mono">$1.99</span>
              </button>

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {adsRemovedPermanently
                    ? 'Active: Forced Interstitial & Banner Ads Permanently Removed!'
                    : 'Rule: Any IAP purchase permanently removes forced interstitial & banner ads.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Pillar D (ASO Uncrowded Keyword Clusters & 10-Locale U.S. Cross-Localization Hack) */}
        {activeTab === 'aso' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            <div className="bg-[#111723] border border-sky-500/40 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300">
                  D. Uncrowded ASO Keyword Clusters
                </span>
                <span className="text-[10px] font-mono text-emerald-400">10 Locales = 1,600 Chars</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-snug">
                Avoids saturated bidding wars against Rollic/iKame (&quot;screw puzzle&quot;) by indexing mid-competition 3rd-Gen visual clusters across all 10 U.S.-indexed App Store locales:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {TARGET_KEYWORD_CLUSTERS.map((c) => (
                  <div
                    key={c.cluster}
                    className="bg-[#0D121C] border border-slate-800 rounded-lg px-2 py-1 flex items-center gap-1.5"
                  >
                    <span className="text-[10px] font-bold text-amber-300 whitespace-nowrap">
                      {c.cluster}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
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
                  className="bg-[#111723] border border-slate-800 rounded-xl p-2 flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white">
                      {loc.localeCode} · <span className="text-slate-400 font-normal">{loc.localeName}</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400">
                      {loc.keywordField100.length}/100 chars
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-300 font-medium truncate">
                    {loc.title30} — {loc.subtitle30}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 bg-[#0B0F17] rounded px-1.5 py-1 truncate">
                    {loc.keywordField100}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capgo Live OTA Level Updater Footer */}
        <div className="p-2.5 bg-[#0D121C] border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <RefreshCw
              className={`w-3.5 h-3.5 text-sky-400 shrink-0 ${isUpdatingOta ? 'animate-spin' : ''}`}
            />
            <span className="text-[10px] text-slate-300 font-mono truncate">{otaStatus}</span>
          </div>

          <button
            onClick={handleTriggerCapgoOta}
            disabled={isUpdatingOta || otaSynced}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 transition-colors whitespace-nowrap ${
              otaSynced
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700'
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
