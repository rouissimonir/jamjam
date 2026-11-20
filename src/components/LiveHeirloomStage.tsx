import React from 'react';
import {
  LiveHeirloomUnboxingState,
  PIN_COLORS,
  PinColor,
} from '../game/rules.ts';
import { Sparkles } from 'lucide-react';

interface LiveHeirloomStageProps {
  unboxingState: LiveHeirloomUnboxingState;
  matchPulseKey: number;
  artisanLine?: string;
  lastMatchedColor?: PinColor | null;
  onInspectCurio?: () => void;
  compact?: boolean;
}

const HeirloomIllustration: React.FC<{
  state: LiveHeirloomUnboxingState;
  accentHex: string;
}> = ({ state, accentHex }) => {
  const { heirloom, unboxingStage, lidOpenRatio, ribbonPeelRatio } = state;
  const peelX = ribbonPeelRatio * 24;
  const lidLiftY = lidOpenRatio * 18;
  const lidTiltDeg = -lidOpenRatio * 24;
  const revealOpacity = unboxingStage >= 2 ? 0.65 + lidOpenRatio * 0.35 : unboxingStage === 1 ? 0.25 : 0;
  const heirloomLiftY = unboxingStage >= 3 ? -8 : unboxingStage === 2 ? -3 : 4;

  return (
    <svg
      viewBox="0 -14 112 90"
      className="w-[96px] h-[74px] shrink-0 overflow-visible"
      role="img"
      aria-label={`${heirloom.name} — ${state.stageLabel} (${state.progressPercent}%)`}
    >
      <defs>
        <radialGradient id={`heirloomGlow-${heirloom.id}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity={unboxingStage >= 2 ? '0.78' : '0.28'} />
          <stop offset="55%" stopColor={heirloom.jewelHex} stopOpacity={unboxingStage >= 2 ? '0.32' : '0.08'} />
          <stop offset="100%" stopColor="#16100E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="boxParchmentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F8F1E3" />
          <stop offset="100%" stopColor="#DFCFB5" />
        </linearGradient>
        <linearGradient id="boxVelvetLidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4A1D24" />
          <stop offset="100%" stopColor="#2A1216" />
        </linearGradient>
        <linearGradient id="guildGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Candlelight Aura Behind Parcel */}
      <ellipse cx="56" cy="40" rx="50" ry="30" fill={`url(#heirloomGlow-${heirloom.id})`} />

      {/* Ground Walnut Cast Shadow */}
      <ellipse cx="56" cy="67" rx="37" ry="6.5" fill="#0B0706" fillOpacity="0.72" />

      {/* Back Velvet Box Interior Wall */}
      <rect
        x="22"
        y="34"
        width="68"
        height="31"
        rx="6"
        fill="#1D0E10"
        stroke="#78350F"
        strokeWidth="1.4"
      />

      {/* Rising Inner Heirloom Object (Visible as Lid Opens at Stage 2 & Awakened at Stage 3) */}
      <g
        transform={`translate(56, ${35 + heirloomLiftY})`}
        opacity={Math.min(1, revealOpacity)}
        className="transition-all duration-500"
      >
        {heirloom.id === 'songbird_egg' && (
          <g>
            {/* Faberge Pedestal + Enameled Egg */}
            <ellipse cx="0" cy="15" rx="9" ry="3" fill="url(#guildGoldGrad)" />
            <ellipse cx="0" cy="4" rx="12" ry="15" fill="#BE123C" stroke="#FBBF24" strokeWidth="1.8" />
            <path d="M -11 4 Q 0 -2 11 4" fill="none" stroke="#FEF08A" strokeWidth="1.4" />
            <path d="M -9 -3 Q 0 -9 9 -3" fill="none" stroke="#FDE68A" strokeWidth="1.1" strokeDasharray="2 2" />
            {/* Golden Clockwork Songbird Rising on Stage 3 */}
            {unboxingStage >= 2 && (
              <g transform={unboxingStage === 3 ? 'translate(0, -14)' : 'translate(0, -7)'}>
                <circle cx="0" cy="0" r="5.5" fill="url(#guildGoldGrad)" stroke="#78350F" strokeWidth="1" />
                <path d="M 4 -1 L 9 -3 L 5 2 Z" fill="#FDE68A" />
                <path d="M -4 -1 Q -12 -9 -3 -7 Z" fill="#FBBF24" stroke="#78350F" strokeWidth="0.7" />
                <circle cx="2" cy="-1.5" r="0.9" fill="#1C1411" />
              </g>
            )}
          </g>
        )}

        {heirloom.id === 'astral_watch' && (
          <g>
            {/* Brass Hunter Case + Concentric Sapphire Astrolabe */}
            <circle cx="0" cy="3" r="15" fill="#1E3A8A" stroke="url(#guildGoldGrad)" strokeWidth="2.4" />
            <circle
              cx="0"
              cy="3"
              r="10.5"
              fill="none"
              stroke="#FDE68A"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
            <circle cx="0" cy="3" r="6" fill="none" stroke="#93C5FD" strokeWidth="1.1" />
            <circle cx="0" cy="3" r="2.6" fill="#FBBF24" />
            <circle cx="7" cy="-2" r="1.8" fill="#FEF08A" />
            <line x1="0" y1="3" x2="0" y2="-6" stroke="#FEF08A" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="0" y1="3" x2="6" y2="5" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" />
            {/* Pocket Watch Crown */}
            <circle cx="0" cy="-14.5" r="3.2" fill="none" stroke="#FBBF24" strokeWidth="1.6" />
          </g>
        )}

        {heirloom.id === 'kyoto_tea_chest' && (
          <g>
            {/* Kintsugi Lacquer Tea Bowl with Gold Seam & Steam */}
            <path
              d="M -15 -1 C -15 11, -8 15, 0 15 C 8 15, 15 11, 15 -1 Z"
              fill="#064E3B"
              stroke="#F59E0B"
              strokeWidth="1.6"
            />
            <ellipse cx="0" cy="-1" rx="15" ry="4" fill="#10B981" stroke="#FDE68A" strokeWidth="1.2" />
            {/* Gold Kintsugi Lightning Seam */}
            <path d="M -5 2 L -1 7 L 3 5 L 6 12" fill="none" stroke="#FEF08A" strokeWidth="1.6" strokeLinecap="round" />
            {unboxingStage >= 2 && (
              <g stroke="#FDE68A" strokeOpacity="0.8" strokeWidth="1.2" fill="none" strokeLinecap="round">
                <path d="M -5 -7 Q -7 -12 -4 -16" />
                <path d="M 3 -8 Q 6 -13 2 -17" />
              </g>
            )}
          </g>
        )}

        {heirloom.id === 'botanical_orrery' && (
          <g>
            {/* Glass Cloche Dome + Golden Botanical Blooms */}
            <path
              d="M -14 14 L -14 1 A 14 14 0 0 1 14 1 L 14 14 Z"
              fill="#3B0764"
              fillOpacity="0.55"
              stroke="#D8B4FE"
              strokeWidth="1.4"
            />
            <rect x="-16" y="13" width="32" height="4" rx="2" fill="url(#guildGoldGrad)" />
            <line x1="0" y1="13" x2="0" y2="-4" stroke="#34D399" strokeWidth="1.6" />
            <circle cx="0" cy="-5" r="4.2" fill="#FBBF24" stroke="#FEF08A" strokeWidth="1" />
            <circle cx="-7" cy="2" r="3" fill="#34D399" />
            <circle cx="7" cy="4" r="3" fill="#C084FC" />
          </g>
        )}

        {/* Stage 3 Awakened Starburst Glints */}
        {unboxingStage === 3 && (
          <g fill="#FEF08A">
            <circle cx="-21" cy="-14" r="2" />
            <circle cx="22" cy="-12" r="2.2" />
            <circle cx="0" cy="-23" r="1.8" />
          </g>
        )}
      </g>

      {/* Front Cream Parchment & Velvet Keepsake Box Body */}
      <rect
        x="20"
        y="38"
        width="72"
        height="28"
        rx="6"
        fill="url(#boxParchmentGrad)"
        stroke="#92400E"
        strokeWidth="1.8"
      />
      {/* Brass Guild Corner Filigree */}
      <path d="M 24 42 L 30 42 M 24 42 L 24 48" stroke="#B45309" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 88 42 L 82 42 M 88 42 L 88 48" stroke="#B45309" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 24 62 L 30 62 M 24 62 L 24 56" stroke="#B45309" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 88 62 L 82 62 M 88 62 L 88 56" stroke="#B45309" strokeWidth="1.4" strokeLinecap="round" />

      {/* Vertical Cross Satin Ribbon on Front Body (Fades & Peels Back as Ribbons Unwind) */}
      <g opacity={Math.max(0.15, 1 - ribbonPeelRatio * 0.85)}>
        <rect
          x="50"
          y="38"
          width="12"
          height="28"
          fill={accentHex}
          stroke="#FDE68A"
          strokeWidth="0.9"
        />
      </g>

      {/* Hinged Presentation Box Lid (Lifts & Tilts Open on Stage 2–3) */}
      <g
        transform={`translate(20, ${30 - lidLiftY}) rotate(${lidTiltDeg}, 0, 10)`}
        className="transition-transform duration-500"
      >
        <rect
          x="-2"
          y="0"
          width="76"
          height="13"
          rx="4.5"
          fill="url(#boxVelvetLidGrad)"
          stroke="#F59E0B"
          strokeWidth="1.5"
        />
        {/* Horizontal Ribbon Band Across Lid (Splits Left/Right as ribbonPeelRatio rises) */}
        {ribbonPeelRatio < 0.95 && (
          <>
            <rect
              x={Math.max(-2, 0 - peelX * 0.35)}
              y="3.5"
              width={Math.max(6, 36 - peelX)}
              height="6"
              rx="2"
              fill={accentHex}
              stroke="#FDE68A"
              strokeWidth="0.7"
            />
            <rect
              x={Math.min(70, 38 + peelX)}
              y="3.5"
              width={Math.max(6, 36 - peelX)}
              height="6"
              rx="2"
              fill={accentHex}
              stroke="#FDE68A"
              strokeWidth="0.7"
            />
          </>
        )}
      </g>

      {/* Center Glossy Crimson Wax Seal (Intact at Stage 0, Cracked/Shattered at Stage 1+) */}
      {unboxingStage === 0 ? (
        <g transform="translate(56, 39)">
          <circle cx="0" cy="1.2" r="9.5" fill="#450A0A" />
          <circle cx="0" cy="0" r="9" fill="#E11D48" stroke="#FDA4AF" strokeWidth="1.3" />
          <circle cx="0" cy="0" r="6" fill="none" stroke="#FDE68A" strokeWidth="1" strokeDasharray="2 1.5" />
          <path d="M -2.5 2 L 0 -3 L 2.5 2 L 0 0.8 Z" fill="#FEF08A" />
          <circle cx="-3" cy="-3" r="1.6" fill="#FFFFFF" fillOpacity="0.6" />
        </g>
      ) : unboxingStage === 1 ? (
        /* Cracked Two-Half Wax Seal */
        <g transform="translate(56, 39)">
          <path d="M -8 -2 A 8 8 0 0 1 -1 -8 L -2 8 A 8 8 0 0 1 -8 -2 Z" fill="#E11D48" stroke="#FDA4AF" strokeWidth="1" transform="translate(-3, -1) rotate(-12)" />
          <path d="M 1 -8 A 8 8 0 0 1 8 2 L 2 8 A 8 8 0 0 1 1 -8 Z" fill="#BE123C" stroke="#FDA4AF" strokeWidth="1" transform="translate(4, 1) rotate(14)" />
          <circle cx="-11" cy="-9" r="1.8" fill="#FB7185" />
          <circle cx="12" cy="-7" r="1.5" fill="#FDE68A" />
        </g>
      ) : null}
    </svg>
  );
};

export const LiveHeirloomStage: React.FC<LiveHeirloomStageProps> = ({
  unboxingState,
  matchPulseKey,
  artisanLine,
  lastMatchedColor,
  onInspectCurio,
  compact = false,
}) => {
  const accentHex = lastMatchedColor
    ? PIN_COLORS[lastMatchedColor].hex
    : unboxingState.heirloom.boxAccentHex;

  return (
    <section
      key={`stage-wrap-${unboxingState.heirloom.id}`}
      data-testid="live-heirloom-stage"
      data-heirloom-id={unboxingState.heirloom.id}
      data-unbox-stage={unboxingState.unboxingStage}
      data-unbox-percent={unboxingState.progressPercent}
      className={`w-full px-2.5 ${compact ? 'pb-0.5' : 'pb-1'} select-none pointer-events-auto`}
      aria-label={`Live Heirloom Unboxing Stage: ${unboxingState.heirloom.name}, ${unboxingState.progressPercent}% unboxed`}
    >
      <div
        onClick={onInspectCurio}
        role={onInspectCurio ? 'button' : undefined}
        tabIndex={onInspectCurio ? 0 : undefined}
        onKeyDown={(e) => {
          if (onInspectCurio && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onInspectCurio();
          }
        }}
        className={`relative w-full rounded-2xl border-[2px] border-[#5A3A28] bg-gradient-to-r from-[#261915] via-[#2D1D18] to-[#231713] px-2.5 py-1.5 shadow-[0_4px_0_#100A08,inset_0_1px_0_rgba(253,230,138,0.18)] flex items-center gap-2.5 overflow-visible ${
          onInspectCurio ? 'cursor-pointer hover:border-amber-400/70 transition-colors' : ''
        }`}
      >
        {/* Subtle Gold Corner Hairlines */}
        <span className="pointer-events-none absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-300/70" />
        <span className="pointer-events-none absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-300/70" />

        {/* Live Animated Heirloom Box Centerpiece (Micro-bounces on every ribbon match!) */}
        <div
          key={matchPulseKey}
          className={`shrink-0 ${matchPulseKey > 0 ? 'animate-unbox-pulse' : ''}`}
        >
          <HeirloomIllustration state={unboxingState} accentHex={accentHex} />
        </div>

        {/* Right Live Narrative & Progress Meter */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                <h2 className="font-game-display font-bold text-[13px] text-[#FDF6EC] leading-tight truncate">
                  {unboxingState.heirloom.name}
                </h2>
              </div>
              <div className="text-[10px] font-mono text-amber-300/95 font-semibold truncate">
                {unboxingState.stageLabel} · {unboxingState.woundRibbons}/{unboxingState.totalRibbons} Wound
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="font-mono font-extrabold text-[13px] tabular-nums text-[#FDE68A] leading-none block">
                {unboxingState.progressPercent}%
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-amber-200/70">
                Stage {unboxingState.unboxingStage}/3
              </span>
            </div>
          </div>

          {/* Warm Gold-Foil Progress Bar with 4 Stage Notches */}
          <div className="relative w-full h-2 rounded-full bg-[#140D0B] border border-[#4A2E20] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FEF08A] transition-all duration-300"
              style={{ width: `${Math.max(4, unboxingState.progressPercent)}%` }}
            />
            <span className="pointer-events-none absolute top-0 bottom-0 left-[25%] w-[1px] bg-[#16100E]/60" />
            <span className="pointer-events-none absolute top-0 bottom-0 left-[58%] w-[1px] bg-[#16100E]/60" />
          </div>

          {/* Concise Archivist Narrative Line */}
          <p className="text-[10px] text-[#E6D5C3] leading-tight truncate">
            {artisanLine || unboxingState.heirloom.loreNote}
          </p>
        </div>
      </div>
    </section>
  );
};
