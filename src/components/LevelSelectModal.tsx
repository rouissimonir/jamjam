import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Map as MapIcon,
  List,
  Check,
  Play,
  Trophy,
  Vibrate,
  CloudDownload,
  Calendar,
  Star,
  ScrollText,
} from 'lucide-react';
import { LevelConfig } from '../game/levels.ts';
import { haptics } from '../game/haptics.ts';
import {
  computeProgressionMapSummary,
  HapticIntensity,
  HAPTIC_INTENSITY_ORDER,
  HAPTIC_INTENSITY_SPECS,
  PIN_COLORS,
  getHeirloomForLevel,
  ParcelStarRating,
  EvaluatedCommission,
  CommissionId,
} from '../game/rules.ts';

interface LevelSelectModalProps {
  levels: LevelConfig[];
  currentLevelId: number;
  clearedLevelIds: number[];
  levelStarsById?: Record<number, ParcelStarRating>;
  commissions?: EvaluatedCommission[];
  onClaimCommission?: (id: CommissionId) => void;
  hapticIntensity: HapticIntensity;
  onSelectHapticIntensity: (intensity: HapticIntensity) => void;
  onSelectLevel: (level: LevelConfig) => void;
  onClose: () => void;
  dailyLevel?: LevelConfig;
  dailyCompletedToday?: boolean;
  dailyStreak?: number;
  onSelectDailyDispatch?: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  levels,
  currentLevelId,
  clearedLevelIds,
  levelStarsById = {},
  commissions = [],
  onClaimCommission,
  hapticIntensity,
  onSelectHapticIntensity,
  onSelectLevel,
  onClose,
  dailyLevel,
  dailyCompletedToday = false,
  dailyStreak = 0,
  onSelectDailyDispatch,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'quests'>('map');
  const [previewLevelId, setPreviewLevelId] = useState<number>(currentLevelId);

  const totalEarnedStars = useMemo(
    () => Object.values(levelStarsById).reduce((acc, s) => acc + s, 0),
    [levelStarsById]
  );
  const claimableCount = useMemo(
    () => commissions.filter((c) => c.claimable).length,
    [commissions]
  );

  const summary = useMemo(
    () =>
      computeProgressionMapSummary(
        levels.map((l) => l.id),
        clearedLevelIds,
        currentLevelId
      ),
    [levels, clearedLevelIds, currentLevelId]
  );

  const previewLevel = useMemo(
    () => levels.find((l) => l.id === previewLevelId) || levels[0],
    [levels, previewLevelId]
  );
  const previewHeirloom = useMemo(
    () => getHeirloomForLevel(previewLevel.id),
    [previewLevel.id]
  );

  const rowSpacing = 90;
  const chapterHeaderGap = 42;
  const topPadding = 76;
  const getNodeY = (idx: number, chapterIndex: number) =>
    topPadding + idx * rowSpacing + chapterIndex * chapterHeaderGap;

  const lastNode = summary.nodes[summary.nodes.length - 1];
  const svgHeight = lastNode
    ? getNodeY(summary.nodes.length - 1, lastNode.chapterIndex) + 64
    : 520;

  return (
    <div
      className="absolute inset-x-0 top-8 bottom-0 z-50 bg-[#120B09]/97 flex items-center justify-center p-2.5 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-blueprint-title"
    >
      <div className="w-full h-full bg-[#1E1411] border border-[#5A3A28] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#160F0C] border-b border-[#432B20] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MapIcon className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 id="select-blueprint-title" className="font-game-display text-sm font-bold text-[#FDF6EC] truncate">
              Royal Dispatch Map
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-[#261914] border border-[#4E3224] rounded-lg p-0.5">
              <button
                onClick={() => {
                  haptics.lightTap();
                  setViewMode('map');
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors ${
                  viewMode === 'map'
                    ? 'bg-amber-400 text-[#1C110C]'
                    : 'text-[#DECBB9] hover:text-white'
                }`}
                aria-label="Route Map View"
              >
                <MapIcon className="w-3 h-3" />
                <span>Route</span>
              </button>
              <button
                onClick={() => {
                  haptics.lightTap();
                  setViewMode('list');
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-amber-400 text-[#1C110C]'
                    : 'text-[#DECBB9] hover:text-white'
                }`}
                aria-label="Parcel List View"
              >
                <List className="w-3 h-3" />
                <span>Parcels</span>
              </button>
              <button
                onClick={() => {
                  haptics.lightTap();
                  setViewMode('quests');
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors ${
                  viewMode === 'quests'
                    ? 'bg-amber-400 text-[#1C110C]'
                    : claimableCount > 0
                    ? 'text-emerald-300 hover:text-white'
                    : 'text-[#DECBB9] hover:text-white'
                }`}
                aria-label="Royal Commissions View"
              >
                <ScrollText className="w-3 h-3" />
                <span>Quests{claimableCount > 0 ? ` (${claimableCount})` : ''}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-[#CDBAA8] hover:text-white rounded-lg hover:bg-[#2F1F19] transition-colors"
              aria-label="Close Dispatch Map"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Campaign Progress Summary + Haptics */}
        <div className="px-3.5 py-2 bg-[#18100D] border-b border-[#3F281E] flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-[#DECBB9] font-medium">
              <span>
                Parcels:{' '}
                <strong className="text-[#FDF6EC] font-mono tabular-nums">
                  {summary.clearedCount}/{summary.totalCount}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-300 font-mono font-bold tabular-nums inline-flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{totalEarnedStars}/{summary.totalCount * 3}</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-300">
              <Trophy className="w-3 h-3" />
              <span>{summary.unlockedMilestones}/2 Vaults</span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-[#2A1B16] rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(8, summary.completionPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#BFA894] shrink-0">
              <Vibrate className="w-3 h-3 text-amber-400" />
              <span>Haptics:</span>
            </div>
            <div className="grid grid-cols-4 gap-1 flex-1">
              {HAPTIC_INTENSITY_ORDER.map((tier) => {
                const spec = HAPTIC_INTENSITY_SPECS[tier];
                const active = hapticIntensity === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => onSelectHapticIntensity(tier)}
                    className={`py-1 px-1.5 rounded-lg border text-[10px] font-bold font-mono transition-colors ${
                      active
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                        : 'bg-[#241713] border-[#3F281E] text-[#B8A18D] hover:text-white'
                    }`}
                    aria-pressed={active}
                  >
                    {spec.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {dailyLevel && onSelectDailyDispatch && (
            <button
              type="button"
              onClick={() => {
                haptics.pinPull();
                onSelectDailyDispatch();
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-[#271813] hover:bg-[#332018] border border-amber-400/70 flex items-center justify-between gap-2 text-left transition-colors"
              aria-label={`Launch ${dailyLevel.name}`}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-game-display font-bold text-[#FDF6EC] truncate">
                  {dailyLevel.name}
                </span>
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-300 shrink-0 whitespace-nowrap">
                {dailyCompletedToday ? `Done · ${dailyStreak}d` : `+${dailyLevel.rewardBolts} Crowns`}
              </span>
            </button>
          )}
        </div>

        {/* Main Body */}
        {viewMode === 'map' ? (
          <div className="flex-1 overflow-y-auto relative bg-[#160F0C] px-3 py-3">
            <div className="relative w-full" style={{ height: `${svgHeight}px` }}>
              <svg
                width="100%"
                height={svgHeight}
                viewBox={`0 0 320 ${svgHeight}`}
                preserveAspectRatio="none"
                className="absolute inset-0 pointer-events-none"
              >
                {Array.from({ length: Math.ceil(svgHeight / 40) }, (_, idx) => (
                  <line
                    key={idx}
                    x1="0"
                    y1={idx * 40}
                    x2="320"
                    y2={idx * 40}
                    stroke="#34221A"
                    strokeWidth="0.6"
                    strokeDasharray="3 5"
                  />
                ))}

                {summary.nodes.map((node, idx) => {
                  if (idx === summary.nodes.length - 1) return null;
                  const nextNode = summary.nodes[idx + 1];
                  const x1 = (node.xPercent / 100) * 320;
                  const y1 = getNodeY(idx, node.chapterIndex);
                  const x2 = (nextNode.xPercent / 100) * 320;
                  const y2 = getNodeY(idx + 1, nextNode.chapterIndex);
                  const midY = (y1 + y2) / 2;
                  const isPathActive =
                    node.status === 'cleared' || nextNode.status === 'current';

                  return (
                    <path
                      key={`edge-${node.levelId}`}
                      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                      fill="none"
                      stroke={isPathActive ? '#F59E0B' : '#523729'}
                      strokeWidth={isPathActive ? '4' : '2.5'}
                      strokeDasharray={isPathActive ? 'none' : '6 6'}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {summary.nodes.map((node, idx) => {
                const lvl = levels.find((l) => l.id === node.levelId)!;
                const yPos = getNodeY(idx, node.chapterIndex);
                const isSelected = previewLevel.id === lvl.id;
                const isCurrent = lvl.id === currentLevelId;
                const isCleared = clearedLevelIds.includes(lvl.id);
                const showChapterBanner = idx % 3 === 0;

                return (
                  <React.Fragment key={lvl.id}>
                    {showChapterBanner && (
                      <div
                        className="absolute left-1 right-1 flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#251814] border border-[#523526] text-[10px] font-mono text-[#E6D5C3] shadow-sm pointer-events-none"
                        style={{ top: `${Math.max(4, yPos - 64)}px` }}
                      >
                        <span className="font-bold text-amber-300">{node.chapterTitle}</span>
                        <span>Parcel {lvl.id}–{Math.min(levels.length, lvl.id + 2)}</span>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        haptics.lightTap();
                        setPreviewLevelId(lvl.id);
                      }}
                      onDoubleClick={() => {
                        haptics.pinPull();
                        onSelectLevel(lvl);
                      }}
                      style={{
                        left: `${node.xPercent}%`,
                        top: `${yPos}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute z-10 flex flex-col items-center group focus:outline-none"
                      aria-label={`Parcel ${lvl.name}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-transform ${
                          isSelected ? 'scale-110' : 'group-hover:scale-105'
                        } ${
                          isCleared
                            ? 'bg-emerald-950 border-2 border-emerald-400 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                            : isCurrent
                            ? 'bg-[#E11D48] border-2 border-amber-300 text-white shadow-[0_0_20px_rgba(225,29,72,0.5)]'
                            : isSelected
                            ? 'bg-[#36231B] border-2 border-amber-400 text-white'
                            : 'bg-[#261914] border-2 border-[#5A3A28] text-[#E6D5C3] hover:border-amber-400/70'
                        }`}
                      >
                        <div className="flex items-center gap-0.5">
                          {isCleared ? (
                            <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                          ) : lvl.isOtaBonus ? (
                            <CloudDownload className="w-3.5 h-3.5 text-amber-300" />
                          ) : node.isMilestone ? (
                            <Trophy className="w-3.5 h-3.5 text-amber-300" />
                          ) : null}
                          <span className="text-xs font-extrabold font-mono tabular-nums">
                            {lvl.id}
                          </span>
                        </div>
                        {isCleared && levelStarsById[lvl.id] ? (
                          <span className="text-[9px] leading-none text-[#FDE047] tracking-tighter">
                            {'★'.repeat(levelStarsById[lvl.id])}
                            {'☆'.repeat(3 - levelStarsById[lvl.id])}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-amber-200">
                            +{lvl.rewardBolts}
                          </span>
                        )}
                      </div>

                      <div
                        className={`mt-1 px-2 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap transition-colors ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-[#1C120F]/95 border-[#472E21] text-[#DECBB9]'
                        }`}
                      >
                        {lvl.name.replace(/^Parcel \d+:\s*/, '')}
                      </div>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'quests' ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#160F0C]">
            <div className="text-[10.5px] font-mono text-[#CDBAA8] px-0.5">
              Complete Royal Courier Commissions to earn bonus Gold Crowns.
            </div>
            {commissions.map((comm) => (
              <div
                key={comm.id}
                className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  comm.claimable
                    ? 'bg-[#2B1D14] border-amber-400/80'
                    : comm.claimed
                    ? 'bg-[#18211A] border-emerald-500/40'
                    : 'bg-[#211612] border-[#3E271D]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-game-display font-bold text-[#FDF6EC]">
                      {comm.title}
                    </div>
                    <p className="text-[10.5px] text-[#BFA894] mt-0.5">{comm.description}</p>
                  </div>
                  {comm.claimable && onClaimCommission ? (
                    <button
                      type="button"
                      onClick={() => onClaimCommission(comm.id)}
                      className="btn-3d-amber px-2.5 py-1 rounded-xl text-[10.5px] font-mono font-extrabold text-[#1C110C] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Claim +{comm.rewardCrowns}
                    </button>
                  ) : (
                    <span
                      className={`text-[10px] font-mono font-bold whitespace-nowrap shrink-0 ${
                        comm.claimed ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      {comm.claimed ? 'Claimed ✓' : `+${comm.rewardCrowns}c`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#140C09] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        comm.completed ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.max(4, comm.progressPercent)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-[#E6D5C3]">
                    {comm.current}/{comm.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#160F0C]">
            {levels.map((lvl) => {
              const isSelected = lvl.id === previewLevel.id;
              const isCleared = clearedLevelIds.includes(lvl.id);
              const earnedStars = levelStarsById[lvl.id];
              const lvlHeirloom = getHeirloomForLevel(lvl.id);

              return (
                <button
                  key={lvl.id}
                  onClick={() => {
                    haptics.lightTap();
                    setPreviewLevelId(lvl.id);
                    onSelectLevel(lvl);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-colors flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-[#2E1E18] border-amber-400/80 shadow-md'
                      : 'bg-[#211612] border-[#3E271D] hover:border-[#63402C]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-game-display font-bold ${
                        isSelected ? 'text-amber-300' : 'text-[#FDF6EC]'
                      }`}
                    >
                      {lvl.name}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] font-mono tabular-nums text-amber-300 shrink-0">
                      {earnedStars ? (
                        <span className="text-[#FDE047]">
                          {'★'.repeat(earnedStars)}
                          {'☆'.repeat(3 - earnedStars)}
                        </span>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>+{lvl.rewardBolts}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10.5px] text-[#CDBAA8]">
                    <span className="text-amber-200/90 font-semibold">{lvlHeirloom.name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lvl.plates.length} Ribbons</span>
                    <span aria-hidden="true">·</span>
                    <span>{lvl.pins.length} Seals</span>
                    {isCleared && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-300 font-semibold">Unboxed</span>
                      </>
                    )}
                  </div>

                  <p className="text-[11px] text-[#B8A18D] leading-snug mt-0.5">
                    {lvl.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Selected Parcel Inspector & Launch CTA */}
        <div className="px-3.5 py-2.5 bg-[#160F0C] border-t border-[#432B20] flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-game-display font-bold text-[#FDF6EC] truncate">
                {previewLevel.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#CDBAA8] mt-0.5">
              <span className="truncate">{previewHeirloom.name}</span>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1 shrink-0">
                {previewLevel.toolboxColors.map((c, i) => (
                  <span
                    key={`${c}-${i}`}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PIN_COLORS[c].hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              haptics.pinPull();
              onSelectLevel(previewLevel);
            }}
            className="btn-3d-blue py-2 px-3.5 rounded-xl text-white font-game-display font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Unseal #{previewLevel.id}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
