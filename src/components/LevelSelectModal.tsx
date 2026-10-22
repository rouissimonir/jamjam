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
} from 'lucide-react';
import { LevelConfig } from '../game/levels.ts';
import { haptics } from '../game/haptics.ts';
import {
  computeProgressionMapSummary,
  HapticIntensity,
  HAPTIC_INTENSITY_ORDER,
  HAPTIC_INTENSITY_SPECS,
  PIN_COLORS,
} from '../game/rules.ts';

interface LevelSelectModalProps {
  levels: LevelConfig[];
  currentLevelId: number;
  clearedLevelIds: number[];
  hapticIntensity: HapticIntensity;
  onSelectHapticIntensity: (intensity: HapticIntensity) => void;
  onSelectLevel: (level: LevelConfig) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  levels,
  currentLevelId,
  clearedLevelIds,
  hapticIntensity,
  onSelectHapticIntensity,
  onSelectLevel,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [previewLevelId, setPreviewLevelId] = useState<number>(currentLevelId);

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
      className="absolute inset-x-0 top-9 bottom-0 z-50 bg-[#090D16]/97 flex items-center justify-center p-2.5 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-blueprint-title"
    >
      <div className="w-full h-full bg-[#141B29] border border-slate-700/90 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Top Modal Header with Map / List Toggle */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0F1520] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MapIcon className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 id="select-blueprint-title" className="text-xs font-extrabold text-white truncate">
              Visual Progression Map
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-[#182132] border border-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => {
                  haptics.lightTap();
                  setViewMode('map');
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors ${
                  viewMode === 'map'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
                aria-label="Visual Saga Map View"
              >
                <MapIcon className="w-3 h-3" />
                <span>Saga Map</span>
              </button>
              <button
                onClick={() => {
                  haptics.lightTap();
                  setViewMode('list');
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
                aria-label="Blueprint List View"
              >
                <List className="w-3 h-3" />
                <span>List</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close Progression Map"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Campaign Progress Summary + Haptic Intensity Bar */}
        <div className="px-3.5 py-2 bg-[#111723] border-b border-slate-800/90 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span>
                Campaign: <strong className="text-white font-mono">{summary.clearedCount}/{summary.totalCount}</strong> Cleared
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 font-mono font-bold">
                {summary.completionPercent}%
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <Trophy className="w-3 h-3" />
              <span>{summary.unlockedMilestones}/2 Chests</span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(8, summary.completionPercent)}%` }}
            />
          </div>

          {/* Haptic Intensity 4-Tier Selector */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 shrink-0">
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
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-[#172030] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    aria-pressed={active}
                  >
                    {spec.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Body: Visual Serpentine Saga Map OR Blueprint List */}
        {viewMode === 'map' ? (
          <div className="flex-1 overflow-y-auto relative bg-[#0D131F] px-3 py-3">
            {/* Winding SVG Blueprint Saga Map */}
            <div className="relative w-full" style={{ height: `${svgHeight}px` }}>
              <svg
                width="100%"
                height={svgHeight}
                viewBox={`0 0 320 ${svgHeight}`}
                preserveAspectRatio="none"
                className="absolute inset-0 pointer-events-none"
              >
                {/* Subtle Blueprint Grid Lines */}
                {Array.from({ length: Math.ceil(svgHeight / 40) }, (_, idx) => (
                  <line
                    key={idx}
                    x1="0"
                    y1={idx * 40}
                    x2="320"
                    y2={idx * 40}
                    stroke="#1E293B"
                    strokeWidth="0.6"
                    strokeDasharray="3 5"
                  />
                ))}

                {/* Connecting Bezier Path Segments between Level Nodes */}
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
                    <g key={`edge-${node.levelId}`}>
                      <path
                        d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                        fill="none"
                        stroke={isPathActive ? '#F59E0B' : '#334155'}
                        strokeWidth={isPathActive ? '4' : '2.5'}
                        strokeDasharray={isPathActive ? 'none' : '6 6'}
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Chapter Dividers & Interactive Level Nodes */}
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
                        className="absolute left-1 right-1 flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#162032] border border-slate-700/80 text-[10px] font-mono text-slate-300 shadow-sm pointer-events-none"
                        style={{ top: `${Math.max(4, yPos - 64)}px` }}
                      >
                        <span className="font-bold text-amber-300">{node.chapterTitle}</span>
                        <span>Lv.{lvl.id}–{Math.min(levels.length, lvl.id + 2)}</span>
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
                      aria-label={`Map Node ${lvl.name}, ${
                        isCleared ? 'Cleared' : isCurrent ? 'Current Blueprint' : lvl.difficulty
                      }`}
                    >
                      {/* Node Medallion */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-transform ${
                          isSelected ? 'scale-110' : 'group-hover:scale-105'
                        } ${
                          isCleared
                            ? 'bg-emerald-950 border-2 border-emerald-400 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                            : isCurrent
                            ? 'bg-amber-500 border-2 border-amber-200 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.55)]'
                            : isSelected
                            ? 'bg-[#1F2B42] border-2 border-sky-400 text-white'
                            : 'bg-[#172133] border-2 border-slate-600 text-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-0.5">
                          {isCleared ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          ) : lvl.isOtaBonus ? (
                            <CloudDownload className="w-3.5 h-3.5 text-sky-400" />
                          ) : node.isMilestone ? (
                            <Trophy
                              className={`w-3.5 h-3.5 ${
                                isCurrent ? 'text-slate-950' : 'text-amber-400'
                              }`}
                            />
                          ) : null}
                          <span className="text-xs font-extrabold font-mono tabular-nums">
                            {lvl.id}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono font-bold ${
                            isCurrent ? 'text-slate-900' : 'text-amber-400'
                          }`}
                        >
                          +{lvl.rewardBolts}
                        </span>
                      </div>

                      {/* Compact Node Label Plate */}
                      <div
                        className={`mt-1 px-2 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap transition-colors ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-[#111826]/95 border-slate-800 text-slate-300'
                        }`}
                      >
                        {lvl.name.replace(/^Level \d+:\s*/, '')}
                        {node.milestoneLabel ? ` · ${node.milestoneLabel}` : ''}
                      </div>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          /* Classic Detailed Blueprint List View */
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {levels.map((lvl) => {
              const isSelected = lvl.id === previewLevel.id;
              const isCleared = clearedLevelIds.includes(lvl.id);

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
                      ? 'bg-amber-950/35 border-amber-500/80 shadow-md'
                      : 'bg-[#121824] border-slate-800 hover:border-slate-700 hover:bg-[#182030]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-amber-400' : 'text-slate-100'
                      }`}
                    >
                      {lvl.name}
                    </span>

                    <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-amber-400 shrink-0">
                      <Sparkles className="w-3 h-3" />
                      <span>+{lvl.rewardBolts}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>{lvl.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lvl.plates.length} Plates</span>
                    <span aria-hidden="true">·</span>
                    <span>{lvl.pins.length} Pins</span>
                    {lvl.isOtaBonus && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-sky-400 font-semibold">Capgo OTA</span>
                      </>
                    )}
                    {isCleared && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-400 font-semibold">Cleared</span>
                      </>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                    {lvl.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Selected Node Inspector & Launch CTA */}
        <div className="px-3.5 py-2.5 bg-[#0F1520] border-t border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-white truncate">
                {previewLevel.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              <span>{previewLevel.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span>{previewLevel.plates.length} Plates</span>
              <span aria-hidden="true">·</span>
              <div className="flex items-center gap-1">
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
            className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Lv.{previewLevel.id}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
