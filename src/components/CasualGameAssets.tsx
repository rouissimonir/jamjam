import React from 'react';
import {
  FeatureUnlockProgress,
  AtelierMasteryTrophy,
  TactileThemeId,
} from '../game/rules.ts';

interface GoldDollarCoinSvgProps {
  size?: number;
  showPlusBadge?: boolean;
  className?: string;
}

export const GoldDollarCoinSvg: React.FC<GoldDollarCoinSvgProps> = ({
  size = 30,
  showPlusBadge = false,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`shrink-0 overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="coinFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="48%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="coinRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>

      {/* Antique Burnished Gold Medallion Shadow & Rim */}
      <ellipse
        cx="20"
        cy="21.2"
        rx="15.8"
        ry="15.2"
        fill="url(#coinRimGrad)"
        stroke="#22120B"
        strokeWidth="2.4"
      />

      {/* Main Burnished Gold Coin Face */}
      <ellipse
        cx="19.5"
        cy="18.6"
        rx="15.2"
        ry="14.6"
        fill="url(#coinFaceGrad)"
        stroke="#22120B"
        strokeWidth="2.2"
      />

      {/* Inner Engraved Filigree Ring */}
      <ellipse
        cx="19.5"
        cy="18.6"
        rx="11.2"
        ry="10.7"
        fill="#B45309"
        fillOpacity="0.48"
        stroke="#FEF08A"
        strokeOpacity="0.85"
        strokeWidth="1.2"
      />

      {/* Top-Left Specular Sheen */}
      <path
        d="M 10.5 12.2 A 11.8 11 0 0 1 25 8.8"
        fill="none"
        stroke="#FFFBEB"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeOpacity="0.82"
      />

      {/* Embossed Royal Crown Emblem */}
      <path
        d="M 13.5 22.8 L 12.6 15.8 L 16.5 18.8 L 19.5 14 L 22.5 18.8 L 26.4 15.8 L 25.5 22.8 Z"
        fill="#FEF9C3"
        stroke="#78350F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <rect x="13.5" y="23.2" width="12" height="1.8" rx="0.8" fill="#FDE047" stroke="#78350F" strokeWidth="0.8" />

      {/* Optional Warm Crimson & Gold '+' Wax Charm Badge */}
      {showPlusBadge && (
        <g transform="translate(22, 22)">
          <circle
            cx="8"
            cy="8"
            r="7.4"
            fill="#9F1239"
            stroke="#22120B"
            strokeWidth="2"
          />
          <circle
            cx="8"
            cy="8"
            r="5.6"
            fill="none"
            stroke="#FDE68A"
            strokeWidth="0.9"
            strokeOpacity="0.7"
          />
          <path
            d="M 8 4.6 V 11.4 M 4.6 8 H 11.4"
            stroke="#FEF9C3"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
};

interface GoldCoinPillProps {
  bolts: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const GoldCoinPill: React.FC<GoldCoinPillProps> = ({
  bolts,
  onClick,
  size = 'md',
  pulse = false,
}) => {
  const isSmall = size === 'sm';
  return (
    <button
      type="button"
      onClick={(e) => {
        e.currentTarget.blur();
        onClick?.(e);
      }}
      className={`group relative inline-flex items-center select-none transition-transform active:scale-95 ${
        pulse ? 'scale-110' : ''
      }`}
      title="Royal Crown Treasury & Wax Packs"
      aria-label={`Open Royal Treasury, ${bolts} Crowns`}
    >
      {/* Left Overlapping Burnished Gold Crown Medallion */}
      <div className="relative z-10 -mr-3 flex items-center justify-center transition-transform group-hover:scale-105">
        <GoldDollarCoinSvg size={isSmall ? 26 : 32} showPlusBadge />
      </div>

      {/* Warm Espresso Velvet & Antique Gold Plaque */}
      <div
        className={`bg-[#241713] border border-[#8C5B38] hover:border-[#D97706] rounded-xl shadow-[0_2px_0_#120B09,inset_0_1px_0_rgba(254,240,138,0.16)] flex items-center justify-end gap-1 transition-colors ${
          isSmall ? 'pl-4 pr-2.5 py-0.5 min-w-[64px]' : 'pl-4.5 pr-3 py-0.5 min-w-[78px]'
        }`}
      >
        <span
          className={`font-mono font-bold text-[#FEF08A] tabular-nums tracking-tight leading-tight ${
            isSmall ? 'text-xs' : 'text-[14px]'
          }`}
        >
          {Math.round(bolts)}
        </span>
      </div>
    </button>
  );
};

interface BlueScrewMedallionProps {
  count: number;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const BlueScrewMedallion: React.FC<BlueScrewMedallionProps> = ({
  count,
  onClick,
  size = 'md',
  className = '',
}) => {
  const isSmall = size === 'sm';
  const dim = isSmall ? 40 : 68;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex flex-col items-center group focus:outline-none transition-transform active:scale-95 ${className}`}
      title="Extracted Screw Pass Collector"
      aria-label={`Extracted Screws Collected: ${count}`}
    >
      <svg
        width={dim}
        height={dim + (isSmall ? 6 : 10)}
        viewBox="0 0 78 88"
        className="overflow-visible drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]"
      >
        <defs>
          <radialGradient id="blueMedallionGrad" cx="35%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#6E94FF" />
            <stop offset="55%" stopColor="#3B66FF" />
            <stop offset="100%" stopColor="#1D3EC2" />
          </radialGradient>
          <linearGradient id="screwMetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#DBE4F0" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="brassRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF066" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* Outer Royal-Blue Circular Medallion with 3D Extruded Lip */}
        <circle
          cx="39"
          cy="39"
          r="33"
          fill="#152C88"
          stroke="#141720"
          strokeWidth="3.2"
        />
        <circle
          cx="39"
          cy="36"
          r="32.5"
          fill="url(#blueMedallionGrad)"
          stroke="#141720"
          strokeWidth="3.2"
        />

        {/* Inner Precision Gold-Brass Filigree Ring */}
        <circle
          cx="39"
          cy="36"
          r="27.5"
          fill="none"
          stroke="url(#brassRimGrad)"
          strokeWidth="1.5"
          strokeOpacity="0.65"
          strokeDasharray="5 3"
        />

        {/* Top-Left Specular Rim Arc */}
        <path
          d="M 16 24 A 26 26 0 0 1 57 15"
          fill="none"
          stroke="#A6C0FF"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeOpacity="0.82"
        />

        {/* Cast Shadow Under Tilted 3D Screw */}
        <ellipse
          cx="42"
          cy="43"
          rx="14"
          ry="17"
          transform="rotate(18 42 43)"
          fill="#0E1745"
          fillOpacity="0.6"
        />

        {/* Tilted 3D Isometric Silver & Gold Phillips Screw */}
        <g
          transform="translate(39, 37) rotate(16)"
          className="group-hover:scale-105 transition-transform"
        >
          {/* Threaded Shaft Ribs (Bottom to Top) */}
          <ellipse
            cx="0"
            cy="15"
            rx="5.5"
            ry="3"
            fill="url(#screwMetalGrad)"
            stroke="#141720"
            strokeWidth="2.2"
          />
          <ellipse
            cx="0"
            cy="10.5"
            rx="6.8"
            ry="3.4"
            fill="url(#screwMetalGrad)"
            stroke="#141720"
            strokeWidth="2.2"
          />
          <ellipse
            cx="0"
            cy="5.5"
            rx="7.8"
            ry="3.8"
            fill="url(#screwMetalGrad)"
            stroke="#141720"
            strokeWidth="2.2"
          />
          <ellipse
            cx="0"
            cy="0.5"
            rx="8.4"
            ry="4"
            fill="url(#screwMetalGrad)"
            stroke="#141720"
            strokeWidth="2.2"
          />

          {/* Domed 3D Screw Cap Collar */}
          <ellipse
            cx="0"
            cy="-6"
            rx="15.5"
            ry="9.5"
            fill="#94A3B8"
            stroke="#141720"
            strokeWidth="2.6"
          />
          {/* Domed 3D Screw Cap Top */}
          <ellipse
            cx="0"
            cy="-8.5"
            rx="15"
            ry="8.8"
            fill="url(#screwMetalGrad)"
            stroke="#141720"
            strokeWidth="2.4"
          />

          {/* Recessed Phillips Cross Slot (+) with Golden Atelier Core */}
          <path
            d="M -7.5 -8.5 L 7.5 -8.5 M 0 -13 L 0 -4"
            stroke="#1E293B"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle cx="0" cy="-8.5" r="2.2" fill="#FBBF24" />
        </g>

        {/* Bottom Overlapping White Count Pill */}
        <rect
          x="19"
          y="61"
          width="40"
          height="20"
          rx="6.5"
          fill="#FFFFFF"
          stroke="#141720"
          strokeWidth="2.6"
        />
        <rect x="21" y="76" width="36" height="3" rx="1.5" fill="#CBD5E1" />
        <text
          x="39"
          y="75.5"
          textAnchor="middle"
          fill="#111318"
          fontFamily="Fredoka, Outfit, sans-serif"
          fontWeight="700"
          fontSize="14.5"
        >
          {count}
        </text>
      </svg>
    </button>
  );
};

interface NewFeatureProgressBarProps {
  progress: FeatureUnlockProgress;
  onClick?: () => void;
}

export const NewFeatureProgressBar: React.FC<NewFeatureProgressBarProps> = ({
  progress,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center group focus:outline-none transition-transform active:scale-98"
      title={`${progress.featureName}: ${progress.featureDescription}`}
      aria-label={`New Feature Progress ${progress.label}: ${progress.featureName}`}
    >
      {/* Left Section: NEW FEATURE Label + Glossy Progress Bar */}
      <div className="flex flex-col items-start -mr-2 z-10">
        <span className="font-game-display font-bold text-[12px] tracking-wide uppercase text-game-outline-sm pl-1 mb-0.5">
          NEW FEATURE
        </span>

        {/* Outer White-Framed Progress Trough */}
        <div className="w-[144px] h-[31px] bg-white border-[2.6px] border-[#141824] rounded-l-xl shadow-[0_4px_0_#94A3B8,0_6.5px_0_#141824] p-[3px] flex items-center relative">
          {/* Inner Slate-Blue Track */}
          <div className="w-full h-full bg-[#7E96B5] rounded-l-lg overflow-hidden relative flex items-center">
            {/* Glossy Lime-Green Progress Fill */}
            <div
              className="h-full bg-gradient-to-b from-[#72FA2F] via-[#53E018] to-[#3DC20B] rounded-l-md transition-all duration-500 relative"
              style={{ width: `${Math.max(15, progress.ratioPercent)}%` }}
            >
              {/* Top Specular White Bar Highlight */}
              <div className="absolute top-[2px] left-1.5 right-1.5 h-[4px] bg-white/60 rounded-full" />
            </div>

            {/* Centered Outlined '5 / 10' Text */}
            <span className="absolute inset-0 flex items-center justify-center font-game-display font-bold text-[13.5px] tabular-nums text-game-outline-sm">
              {progress.label}
            </span>
          </div>
        </div>
      </div>

      {/* Right Docked 3D Feature Icon Frame (Rounded Square with Tilted Golden Star-Keyhole Clasp) */}
      <div className="relative z-20 w-[64px] h-[64px] bg-white border-[2.8px] border-[#141824] rounded-[16px] shadow-[0_4px_0_#94A3B8,0_6.5px_0_#141824,0_10px_18px_rgba(0,0,0,0.45)] p-[5px] flex items-center justify-center">
        {/* Inner Slate-Blue Recessed Cushion */}
        <div className="w-full h-full bg-gradient-to-b from-[#94ABC7] to-[#7B93B2] border-[2px] border-white/85 rounded-[11px] shadow-inner flex items-center justify-center relative overflow-hidden">
          {/* Corner Mini Brass Pins */}
          <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-300 border border-slate-900" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-300 border border-slate-900" />
          <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-300 border border-slate-900" />
          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-300 border border-slate-900" />

          {/* Tilted 3D Golden-Orange Star Keyhole / Clasp Emblem */}
          <svg
            width="42"
            height="42"
            viewBox="0 0 48 48"
            className="overflow-visible drop-shadow-[0_3px_4px_rgba(0,0,0,0.38)] group-hover:scale-110 transition-transform"
            aria-hidden="true"
          >
            <g transform="translate(24, 24) rotate(24)">
              {/* Bottom Keyhole Stem */}
              <rect
                x="-6.5"
                y="4"
                width="13"
                height="14"
                rx="5"
                fill="#F58200"
                stroke="#141824"
                strokeWidth="2.4"
              />
              {/* Main Circular Golden Head */}
              <circle
                cx="0"
                cy="-4"
                r="13.5"
                fill="#FFB800"
                stroke="#141824"
                strokeWidth="2.4"
              />
              {/* Top Specular Highlight on Golden Head */}
              <path
                d="M -8 -11 A 10 10 0 0 1 7 -12"
                fill="none"
                stroke="#FFF394"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              {/* Inner Recessed Orange Star */}
              <polygon
                points="0,-13 2.8,-6.8 9.5,-6 4.5,-1.5 6,5 0,1.5 -6,5 -4.5,-1.5 -9.5,-6 -2.8,-6.8"
                fill="#EA580C"
                stroke="#FFF066"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>
      </div>
    </button>
  );
};

export const LevelCompletedBannerSvg: React.FC = () => {
  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none">
      <svg
        viewBox="0 0 380 124"
        className="w-full max-w-[360px] h-auto overflow-visible drop-shadow-[0_7px_14px_rgba(0,0,0,0.45)]"
        role="img"
        aria-label="LEVEL COMPLETED"
      >
        <defs>
          {/* Golden-Yellow to Rich Orange Vertical Gradient */}
          <linearGradient id="goldTitleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF536" />
            <stop offset="52%" stopColor="#FFB800" />
            <stop offset="100%" stopColor="#FF7E00" />
          </linearGradient>
          {/* Deep 3D Extruded Bottom Lip Gradient */}
          <linearGradient id="goldExtrudeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D95B00" />
            <stop offset="100%" stopColor="#7C2D00" />
          </linearGradient>
          {/* Brass Socket Bezel Gradient */}
          <linearGradient id="socketBrassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="55%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        {/* Left & Right Flanking 3D Brass & Ruby/Emerald Clockwork Gear Rosettes */}
        <g transform="translate(52, 36)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="-2.5"
              y="-16"
              width="5"
              height="6"
              rx="1.5"
              transform={`rotate(${deg})`}
              fill="url(#socketBrassGrad)"
              stroke="#1E1308"
              strokeWidth="1.5"
            />
          ))}
          <circle cx="0" cy="0" r="12" fill="url(#socketBrassGrad)" stroke="#1E1308" strokeWidth="2.4" />
          <circle cx="0" cy="0" r="7.5" fill="#F43F5E" stroke="#1E1308" strokeWidth="1.6" />
          <circle cx="-2.2" cy="-2.2" r="2.2" fill="#FFFFFF" fillOpacity="0.9" />
        </g>
        <g transform="translate(328, 36)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="-2.5"
              y="-16"
              width="5"
              height="6"
              rx="1.5"
              transform={`rotate(${deg})`}
              fill="url(#socketBrassGrad)"
              stroke="#1E1308"
              strokeWidth="1.5"
            />
          ))}
          <circle cx="0" cy="0" r="12" fill="url(#socketBrassGrad)" stroke="#1E1308" strokeWidth="2.4" />
          <circle cx="0" cy="0" r="7.5" fill="#10B981" stroke="#1E1308" strokeWidth="1.6" />
          <circle cx="-2.2" cy="-2.2" r="2.2" fill="#FFFFFF" fillOpacity="0.9" />
        </g>

        {/* 5 Recessed 3D Brass-Rimmed Screw-Holes behind 'LEVEL' */}
        {[114, 152, 190, 228, 266].map((cx, i) => (
          <g key={i}>
            {/* Outer Machined Brass Collar */}
            <circle
              cx={cx}
              cy="54"
              r="10.5"
              fill="#3F4454"
              stroke="url(#socketBrassGrad)"
              strokeWidth="2.2"
            />
            {/* Deep Threaded Bore */}
            <circle cx={cx} cy="53.5" r="7.5" fill="#1A1E29" />
            <circle
              cx={cx}
              cy="53.5"
              r="5.2"
              fill="none"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          </g>
        ))}

        {/* ==================== LINE 1: "LEVEL" ==================== */}
        {/* 3D Dark-Brown Bottom Extrusion */}
        <text
          x="190"
          y="53"
          textAnchor="middle"
          fontFamily="'Fredoka', 'Outfit', sans-serif"
          fontWeight="700"
          fontSize="54"
          letterSpacing="1.5"
          fill="url(#goldExtrudeGrad)"
          stroke="#231105"
          strokeWidth="8"
          strokeLinejoin="round"
          paintOrder="stroke fill"
        >
          LEVEL
        </text>
        {/* Main Golden-Orange Face */}
        <text
          x="190"
          y="48"
          textAnchor="middle"
          fontFamily="'Fredoka', 'Outfit', sans-serif"
          fontWeight="700"
          fontSize="54"
          letterSpacing="1.5"
          fill="url(#goldTitleGrad)"
          stroke="#231105"
          strokeWidth="5.5"
          strokeLinejoin="round"
          paintOrder="stroke fill"
        >
          LEVEL
        </text>

        {/* ==================== LINE 2: "COMPLETED" ==================== */}
        {/* 3D Dark-Brown Bottom Extrusion */}
        <text
          x="190"
          y="109"
          textAnchor="middle"
          fontFamily="'Fredoka', 'Outfit', sans-serif"
          fontWeight="700"
          fontSize="50"
          letterSpacing="1"
          fill="url(#goldExtrudeGrad)"
          stroke="#231105"
          strokeWidth="8"
          strokeLinejoin="round"
          paintOrder="stroke fill"
        >
          COMPLETED
        </text>
        {/* Main Golden-Orange Face */}
        <text
          x="190"
          y="104"
          textAnchor="middle"
          fontFamily="'Fredoka', 'Outfit', sans-serif"
          fontWeight="700"
          fontSize="50"
          letterSpacing="1"
          fill="url(#goldTitleGrad)"
          stroke="#231105"
          strokeWidth="5.5"
          strokeLinejoin="round"
          paintOrder="stroke fill"
        >
          COMPLETED
        </text>
      </svg>
    </div>
  );
};

interface AtelierMasterpieceShowcaseSvgProps {
  trophy: AtelierMasteryTrophy;
  themeId: TactileThemeId;
  clearTimeSeconds: number;
  screwCount: number;
  totalBoxes: number;
  isOverclocked: boolean;
  onTapShowcase: () => void;
}

export const AtelierMasterpieceShowcaseSvg: React.FC<
  AtelierMasterpieceShowcaseSvgProps
> = ({
  trophy,
  themeId,
  clearTimeSeconds,
  screwCount,
  totalBoxes,
  isOverclocked,
  onTapShowcase,
}) => {
  const starAngles = [-26, 0, 26];

  return (
    <div className="relative w-full flex flex-col items-center justify-center my-auto select-none">
      {/* Interactive 3D Clockwork Stained-Glass / Yarn / Chrono Relic */}
      <button
        type="button"
        onClick={onTapShowcase}
        className="group relative flex flex-col items-center justify-center focus:outline-none transition-transform active:scale-95 cursor-pointer"
        title="Tap to Spin Clockwork Atelier Relic!"
        aria-label={`Masterpiece Unlocked: ${trophy.relicTitle}, ${trophy.stars} of 3 Stars`}
      >
        <svg
          width="248"
          height="214"
          viewBox="0 0 260 224"
          className="overflow-visible drop-shadow-[0_14px_24px_rgba(0,0,0,0.55)]"
        >
          <defs>
            <radialGradient id="relicSpotlightGrad" cx="50%" cy="48%" r="52%">
              <stop
                offset="0%"
                stopColor={isOverclocked ? '#FDE047' : '#38BDF8'}
                stopOpacity="0.42"
              />
              <stop
                offset="60%"
                stopColor={isOverclocked ? '#F59E0B' : '#6366F1'}
                stopOpacity="0.14"
              />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="brassFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF37A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>

            <linearGradient id="pedestalSlateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#26334D" />
              <stop offset="100%" stopColor="#141C2E" />
            </linearGradient>
          </defs>

          {/* Soft Golden / Cyan Radial Atelier Spotlight */}
          <circle cx="130" cy="108" r="104" fill="url(#relicSpotlightGrad)" />

          {/* Background Rotating Left Brass Horology Gear */}
          <g transform="translate(66, 108)">
            <g className={isOverclocked ? 'animate-gear-fast' : 'animate-gear-slow'}>
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <rect
                  key={deg}
                  x="-5"
                  y="-44"
                  width="10"
                  height="12"
                  rx="2.5"
                  transform={`rotate(${deg})`}
                  fill="url(#brassFrameGrad)"
                  stroke="#141824"
                  strokeWidth="2"
                />
              ))}
              <circle
                cx="0"
                cy="0"
                r="35"
                fill="url(#brassFrameGrad)"
                stroke="#141824"
                strokeWidth="2.8"
              />
              <circle cx="0" cy="0" r="22" fill="#1A2336" stroke="#141824" strokeWidth="2.2" />
            </g>
          </g>

          {/* Background Counter-Rotating Right Brass Horology Gear */}
          <g transform="translate(194, 108)">
            <g className={isOverclocked ? 'animate-gear-fast' : 'animate-gear-reverse'}>
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <rect
                  key={deg}
                  x="-5"
                  y="-44"
                  width="10"
                  height="12"
                  rx="2.5"
                  transform={`rotate(${deg})`}
                  fill="url(#brassFrameGrad)"
                  stroke="#141824"
                  strokeWidth="2"
                />
              ))}
              <circle
                cx="0"
                cy="0"
                r="35"
                fill="url(#brassFrameGrad)"
                stroke="#141824"
                strokeWidth="2.8"
              />
              <circle cx="0" cy="0" r="22" fill="#1A2336" stroke="#141824" strokeWidth="2.2" />
            </g>
          </g>

          {/* ==================== TOP 3-STAR CLOCKWORK RATING ARC ==================== */}
          {starAngles.map((angle, idx) => {
            const earned = idx < trophy.stars;
            const rad = ((angle - 90) * Math.PI) / 180;
            const sx = 130 + Math.cos(rad) * 82;
            const sy = 108 + Math.sin(rad) * 82;
            return (
              <g
                key={idx}
                transform={`translate(${sx}, ${sy}) rotate(${angle})`}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="15"
                  fill={earned ? '#1E293B' : '#0F172A'}
                  stroke="#141824"
                  strokeWidth="2.6"
                />
                <polygon
                  points="0,-11 3.2,-3.5 11.2,-2.6 5.2,2.8 6.8,10.6 0,6.6 -6.8,10.6 -5.2,2.8 -11.2,-2.6 -3.2,-3.5"
                  fill={earned ? '#FFD700' : '#475569'}
                  stroke="#141824"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {earned && (
                  <circle cx="-2.5" cy="-3.5" r="2" fill="#FFFFFF" fillOpacity="0.9" />
                )}
              </g>
            );
          })}

          {/* ==================== CENTRAL 3D STAINED-GLASS / ATELIER RELIC ==================== */}
          {/* 3D Extruded Shadow Rim */}
          <circle
            cx="130"
            cy="113"
            r="58"
            fill="#0F1420"
            stroke="#141824"
            strokeWidth="3.5"
          />

          {/* Outer Octagonal/Circular Brass Cathedral Bezel */}
          <circle
            cx="130"
            cy="107"
            r="57"
            fill="url(#brassFrameGrad)"
            stroke="#141824"
            strokeWidth="3.2"
          />

          {/* Inner Dark Lead-Came Cathedral Window / Horology Dial */}
          <circle
            cx="130"
            cy="107"
            r="48"
            fill="#131B2E"
            stroke="#141824"
            strokeWidth="2.8"
          />

          {/* Stained-Glass Radial Petals / Yarn Weave / Chrono Sectors */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const hex = trophy.gemHexes[i % trophy.gemHexes.length] || '#F43F5E';
            return (
              <g key={deg} transform={`translate(130, 107) rotate(${deg})`}>
                <path
                  d="M 0 0 L -18 -42 A 45 45 0 0 1 18 -42 Z"
                  fill={hex}
                  fillOpacity={themeId === 'stained_glass' ? '0.82' : '0.72'}
                  stroke="#141824"
                  strokeWidth="2.2"
                />
                {/* Inner Refractive Specular Facet Line */}
                <line
                  x1="0"
                  y1="-12"
                  x2="0"
                  y2="-39"
                  stroke="#FFFFFF"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* 6 Perimeter Extracted 3D Gem-Socket Fasteners around the Relic */}
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const px = 130 + Math.cos(rad) * 35;
            const py = 107 + Math.sin(rad) * 35;
            const hex = trophy.gemHexes[i % trophy.gemHexes.length] || '#3B82F6';
            return (
              <g key={deg} transform={`translate(${px}, ${py})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="8.5"
                  fill="#FBBF24"
                  stroke="#141824"
                  strokeWidth="2"
                />
                <circle cx="0" cy="0" r="5.8" fill={hex} />
                <circle cx="-1.8" cy="-1.8" r="1.8" fill="#FFFFFF" fillOpacity="0.92" />
              </g>
            );
          })}

          {/* Center Golden Crown Screw Hub */}
          <circle
            cx="130"
            cy="107"
            r="16"
            fill="url(#brassFrameGrad)"
            stroke="#141824"
            strokeWidth="2.8"
          />
          <circle
            cx="130"
            cy="107"
            r="10.5"
            fill="#1E293B"
            stroke="#FEF08A"
            strokeWidth="1.5"
          />
          <path
            d="M 124.5 107 L 135.5 107 M 130 101.5 L 130 112.5"
            stroke="#FBBF24"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* ==================== 3D BRASS & SLATE PEDESTAL PLAQUE ==================== */}
          <rect
            x="12"
            y="165"
            width="236"
            height="46"
            rx="14"
            fill="#0D121F"
          />
          <rect
            x="12"
            y="160"
            width="236"
            height="46"
            rx="14"
            fill="url(#pedestalSlateGrad)"
            stroke="#141824"
            strokeWidth="2.8"
          />
          {/* Inner Brass Pinstripe */}
          <rect
            x="16"
            y="164"
            width="228"
            height="38"
            rx="10"
            fill="none"
            stroke="#F59E0B"
            strokeOpacity="0.45"
            strokeWidth="1.4"
          />
          {/* 4 Corner Brass Rivets on Pedestal */}
          <circle cx="23" cy="170" r="2.5" fill="#FBBF24" stroke="#141824" strokeWidth="1" />
          <circle cx="237" cy="170" r="2.5" fill="#FBBF24" stroke="#141824" strokeWidth="1" />
          <circle cx="23" cy="196" r="2.5" fill="#FBBF24" stroke="#141824" strokeWidth="1" />
          <circle cx="237" cy="196" r="2.5" fill="#FBBF24" stroke="#141824" strokeWidth="1" />

          {/* Relic Masterpiece Title */}
          <text
            x="130"
            y="180"
            textAnchor="middle"
            fill="#FDE047"
            stroke="#141824"
            strokeWidth="2.6"
            paintOrder="stroke fill"
            fontFamily="Fredoka, Outfit, sans-serif"
            fontWeight="700"
            fontSize="13.5"
          >
            {trophy.relicTitle}
          </text>

          {/* Blueprint Telemetry Subline */}
          <text
            x="130"
            y="196"
            textAnchor="middle"
            fill="#E2E8F0"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="700"
            fontSize="9"
          >
            {`CLEAR ${Math.max(1, Math.round(clearTimeSeconds))}s · ${screwCount} SCREWS · ${totalBoxes}/${totalBoxes} CRATES`}
          </text>
        </svg>
      </button>
    </div>
  );
};

interface BrassScrewChestSvgProps {
  isReady: boolean;
  isOpened: boolean;
  size?: number;
}

export const BrassScrewChestSvg: React.FC<BrassScrewChestSvgProps> = ({
  isReady,
  isOpened,
  size = 64,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      className="shrink-0 overflow-visible drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="chestBrassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="chestMahoganyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7C2D12" />
          <stop offset="100%" stopColor="#431407" />
        </linearGradient>
      </defs>

      {/* Warm Candlelight Glow when Ready or Opened */}
      {(isReady || isOpened) && (
        <circle
          cx="36"
          cy="36"
          r="33"
          fill={isOpened ? '#34D399' : '#FDE047'}
          fillOpacity="0.24"
        />
      )}

      {/* Mahogany Treasury Base Shadow */}
      <rect
        x="10"
        y="34"
        width="52"
        height="27"
        rx="8"
        fill="#160C09"
        stroke="#24130D"
        strokeWidth="2.4"
      />

      {/* Lower Oiled Mahogany Treasury Box */}
      <rect
        x="10"
        y="31"
        width="52"
        height="26"
        rx="7"
        fill="url(#chestMahoganyGrad)"
        stroke="#24130D"
        strokeWidth="2.4"
      />
      {/* Burnished Gold Vertical Ribbons */}
      <rect
        x="18"
        y="31"
        width="6.5"
        height="26"
        fill="url(#chestBrassGrad)"
        stroke="#24130D"
        strokeWidth="1.8"
      />
      <rect
        x="47.5"
        y="31"
        width="6.5"
        height="26"
        fill="url(#chestBrassGrad)"
        stroke="#24130D"
        strokeWidth="1.8"
      />

      {/* Overflowing Royal Crowns inside when Opened */}
      {isOpened && (
        <g>
          <circle cx="27" cy="27" r="6.8" fill="#F59E0B" stroke="#24130D" strokeWidth="1.8" />
          <circle cx="36" cy="24" r="7.8" fill="#FEF08A" stroke="#24130D" strokeWidth="1.8" />
          <circle cx="45" cy="27" r="6.8" fill="#D97706" stroke="#24130D" strokeWidth="1.8" />
        </g>
      )}

      {/* Domed Brass & Velvet Lid (Tilted open if isOpened) */}
      <g transform={isOpened ? 'translate(0, -8) rotate(-8 36 24)' : ''}>
        <path
          d="M 10 32 C 10 16, 62 16, 62 32 Z"
          fill="url(#chestBrassGrad)"
          stroke="#24130D"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M 17 26 C 24 19, 48 19, 55 26"
          fill="none"
          stroke="#FFFBEB"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.78"
        />
      </g>

      {/* Center Crimson Wax Seal Clasp */}
      <circle
        cx="36"
        cy="34"
        r="8.5"
        fill="#BE123C"
        stroke="#24130D"
        strokeWidth="2.2"
      />
      <circle
        cx="36"
        cy="34"
        r="5.8"
        fill="none"
        stroke="#FDA4AF"
        strokeWidth="1.1"
        strokeOpacity="0.8"
      />
      <path
        d="M 33.2 35.8 L 32.8 32.2 L 34.8 33.6 L 36 31.4 L 37.2 33.6 L 39.2 32.2 L 38.8 35.8 Z"
        fill="#FEF08A"
      />
    </svg>
  );
};

/**
 * Expressive Royal Archivist Companion Medallion Portrait
 * (Camille Beaumont, Haruto Sato, or Lorenzo Bellini)
 */
export const ArtisanAvatarSvg: React.FC<{
  themeId: 'stained_glass' | 'knit_yarn' | 'retro_gadget';
  size?: number;
}> = ({ themeId, size = 36 }) => {
  const accentColor =
    themeId === 'stained_glass'
      ? '#E11D48'
      : themeId === 'knit_yarn'
      ? '#D97706'
      : '#0EA5E9';
  const hairColor =
    themeId === 'stained_glass'
      ? '#5C2C1D'
      : themeId === 'knit_yarn'
      ? '#1E1B18'
      : '#64748B';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="shrink-0 overflow-visible select-none"
      aria-hidden="true"
    >
      {/* Antique Brass & Velvet Medallion Frame */}
      <circle
        cx="24"
        cy="25.2"
        r="20.8"
        fill="#140C09"
        stroke="#22120B"
        strokeWidth="2.4"
      />
      <circle
        cx="24"
        cy="23.5"
        r="20.6"
        fill="#D97706"
        stroke="#22120B"
        strokeWidth="2.2"
      />
      <circle
        cx="24"
        cy="23.5"
        r="17.4"
        fill="#2A1B16"
        stroke="#22120B"
        strokeWidth="1.8"
      />

      {/* Archivist Velvet Coat */}
      <path
        d="M 11 38 C 13 30, 35 30, 37 38"
        fill={accentColor}
        stroke="#22120B"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Head & Warm Portrait */}
      <circle
        cx="24"
        cy="22"
        r="9.2"
        fill="#FDE6C4"
        stroke="#22120B"
        strokeWidth="2"
      />

      {/* Hair */}
      <path
        d="M 14.5 21 C 14.5 12, 33.5 12, 33.5 21 C 30 16.5, 18 16.5, 14.5 21 Z"
        fill={hairColor}
        stroke="#22120B"
        strokeWidth="1.8"
      />

      {/* Eyes & Warm Smile */}
      <circle cx="20.6" cy="22.2" r="1.35" fill="#22120B" />
      <circle cx="27.4" cy="22.2" r="1.35" fill="#22120B" />
      <path
        d="M 21 26 C 22.5 27.6, 25.5 27.6, 27 26"
        fill="none"
        stroke="#22120B"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      {/* Theme-Specific Archivist Prop (Wax Seal Loupe / Gold Ribbon Scissors / Horology Monocle) */}
      {themeId === 'stained_glass' && (
        <circle
          cx="27.5"
          cy="22"
          r="3.6"
          fill="#FEF08A"
          fillOpacity="0.28"
          stroke="#F59E0B"
          strokeWidth="1.7"
        />
      )}
      {themeId === 'knit_yarn' && (
        <g>
          <line
            x1="11.5"
            y1="13"
            x2="19.5"
            y2="17.5"
            stroke="#FEF08A"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="11.5" cy="12.5" r="2.5" fill="#E11D48" stroke="#22120B" strokeWidth="1.4" />
        </g>
      )}
      {themeId === 'retro_gadget' && (
        <circle
          cx="20.5"
          cy="22"
          r="3.7"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.9"
        />
      )}
    </svg>
  );
};

/**
 * Interactive 3-Stage Royal Curio Chapter Unboxing Scene Illustration
 * Renders progressive heirloom unveiling from Stage 0 (Wax-Sealed) -> Stage 3 (Awakened Curio)
 */
export const StorySceneIllustrationSvg: React.FC<{
  themeId: 'stained_glass' | 'knit_yarn' | 'retro_gadget';
  stage: 0 | 1 | 2 | 3;
}> = ({ themeId, stage }) => {
  return (
    <svg
      width="100%"
      height="96"
      viewBox="0 0 280 96"
      className="rounded-xl overflow-hidden border border-[#5B3A29] shadow-inner select-none"
      aria-label={`Royal Curio Chapter Stage ${stage} of 3`}
    >
      <defs>
        <linearGradient id="storyDeskWarm" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={stage >= 2 ? '#341D17' : '#211410'} />
          <stop
            offset="100%"
            stopColor={
              stage === 3
                ? '#5C2C16'
                : stage >= 1
                ? '#2A1914'
                : '#160E0B'
            }
          />
        </linearGradient>
        <radialGradient id="storyCandleGlow" cx="50%" cy="50%" r="58%">
          <stop
            offset="0%"
            stopColor={stage === 3 ? '#FDE047' : stage >= 1 ? '#F59E0B' : '#B45309'}
            stopOpacity={stage === 0 ? '0.2' : stage === 3 ? '0.58' : '0.36'}
          />
          <stop offset="100%" stopColor="#160E0B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Warm Oiled Walnut & Velvet Alcove Backdrop */}
      <rect x="0" y="0" width="280" height="96" fill="url(#storyDeskWarm)" />
      <circle cx="140" cy="48" r="92" fill="url(#storyCandleGlow)" />
      {/* Gold Foil Arch Trim */}
      <rect
        x="6"
        y="6"
        width="268"
        height="84"
        rx="8"
        fill="none"
        stroke="#F59E0B"
        strokeOpacity={stage >= 2 ? '0.45' : '0.22'}
        strokeWidth="1.2"
      />

      {/* STAGE 0-2: Crimson Satin Ribbons Crossing the Alcove (untied as stage rises) */}
      {stage < 3 && (
        <g opacity={stage === 0 ? 0.92 : stage === 1 ? 0.55 : 0.28}>
          <path d="M 0 18 L 62 18" stroke="#E11D48" strokeWidth="7" />
          <path d="M 218 18 L 280 18" stroke="#E11D48" strokeWidth="7" />
          <circle cx="38" cy="18" r="8" fill="#BE123C" stroke="#22120B" strokeWidth="1.8" />
          <circle cx="242" cy="18" r="8" fill="#BE123C" stroke="#22120B" strokeWidth="1.8" />
        </g>
      )}

      {/* ACT I: Parisian Imperial Songbird Egg in Velvet Display Case */}
      {themeId === 'stained_glass' && (
        <g transform="translate(140, 52)">
          {/* Velvet Pedestal */}
          <rect x="-46" y="18" width="92" height="16" rx="5" fill="#4C1D24" stroke="#22120B" strokeWidth="2" />
          <rect x="-40" y="21" width="80" height="3" rx="1.5" fill="#F59E0B" fillOpacity="0.6" />
          {/* Lower Gilded Egg Shell */}
          <path
            d="M -22 18 C -24 -6, -14 -24, 0 -24 C 14 -24, 24 -6, 22 18 Z"
            fill={stage >= 1 ? '#D97706' : '#573B2D'}
            stroke="#22120B"
            strokeWidth="2.2"
          />
          {/* Crimson & Emerald Enamel Band */}
          <path
            d="M -21 4 L 21 4"
            stroke={stage >= 1 ? '#E11D48' : '#78350F'}
            strokeWidth="5"
          />
          {/* Stage 2+: Hinged Upper Dome Lifting + Jewel Crest */}
          {stage >= 2 && (
            <g transform={stage === 3 ? 'translate(14, -18) rotate(24)' : 'translate(6, -8) rotate(12)'}>
              <path
                d="M -18 0 C -18 -18, 18 -18, 18 0 Z"
                fill="#F59E0B"
                stroke="#22120B"
                strokeWidth="2"
              />
              <circle cx="0" cy="-16" r="3.5" fill="#FEF08A" stroke="#22120B" strokeWidth="1.4" />
            </g>
          )}
          {/* Stage 3: Awakened Golden & Emerald Songbird Rising */}
          {stage === 3 && (
            <g transform="translate(0, -16)">
              <path d="M -24 -2 C -40 -14, -36 4, -14 4 Z" fill="#FDE047" stroke="#22120B" strokeWidth="1.6" />
              <path d="M 24 -2 C 40 -14, 36 4, 14 4 Z" fill="#FDE047" stroke="#22120B" strokeWidth="1.6" />
              <ellipse cx="0" cy="0" rx="11" ry="8" fill="#10B981" stroke="#22120B" strokeWidth="1.8" />
              <circle cx="0" cy="-1" r="3.5" fill="#FEF08A" />
            </g>
          )}
        </g>
      )}

      {/* ACT II: Kyoto Lacquer Tea Chest & Silk Kumihimo Cords */}
      {themeId === 'knit_yarn' && (
        <g transform="translate(140, 52)">
          {/* Urushi Lacquer Chest Body */}
          <rect
            x="-52"
            y="-12"
            width="104"
            height="42"
            rx="6"
            fill={stage >= 1 ? '#7F1D1D' : '#3B1815'}
            stroke="#22120B"
            strokeWidth="2.2"
          />
          {/* Gold Kintsugi Seam & Brass Corner Clasps */}
          <path
            d="M -46 8 L -14 2 L 10 14 L 44 4"
            fill="none"
            stroke={stage >= 1 ? '#FDE047' : '#78350F'}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect x="-52" y="-12" width="12" height="10" fill="#F59E0B" stroke="#22120B" strokeWidth="1.6" />
          <rect x="40" y="-12" width="12" height="10" fill="#F59E0B" stroke="#22120B" strokeWidth="1.6" />
          {/* Stage 2+: Open Lacquer Lid & Rising Porcelain Tea Bowl */}
          {stage >= 2 && (
            <g>
              <rect
                x="-54"
                y={stage === 3 ? '-34' : '-24'}
                width="108"
                height="11"
                rx="4"
                fill="#991B1B"
                stroke="#F59E0B"
                strokeWidth="1.6"
              />
              <path
                d="M -18 -12 C -18 2, 18 2, 18 -12 Z"
                fill="#F5EFE6"
                stroke="#22120B"
                strokeWidth="1.8"
              />
              <path d="M -8 -12 L 4 -4" stroke="#F59E0B" strokeWidth="1.6" />
            </g>
          )}
          {/* Stage 3: Rising Steam & Sakura Blossoms */}
          {stage === 3 && (
            <g>
              <circle cx="-72" cy="-6" r="7" fill="#FDA4AF" stroke="#22120B" strokeWidth="1.5" />
              <circle cx="72" cy="-6" r="7" fill="#FDA4AF" stroke="#22120B" strokeWidth="1.5" />
              <path d="M -4 -18 Q -8 -26 0 -32 M 6 -18 Q 10 -26 4 -32" fill="none" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}

      {/* ACT III: Venetian Astral Chronometer in Velvet Case */}
      {themeId === 'retro_gadget' && (
        <g transform="translate(140, 50)">
          {/* Velvet Case Rim & Brass Pocket Watch */}
          <circle
            cx="0"
            cy="0"
            r="31"
            fill="#1D120F"
            stroke={stage >= 1 ? '#F59E0B' : '#6B442A'}
            strokeWidth="3.2"
          />
          <circle
            cx="0"
            cy="0"
            r="24"
            fill={stage >= 2 ? '#1E3A8A' : '#2B1B17'}
            stroke="#FDE047"
            strokeOpacity="0.65"
            strokeWidth="1.6"
          />
          {/* Celestial Dial Rings & Brass Hands */}
          {stage >= 1 && (
            <g>
              <circle cx="0" cy="0" r="14" fill="none" stroke="#F59E0B" strokeWidth="1.6" strokeDasharray="3 3" />
              <line x1="0" y1="0" x2="0" y2="-16" stroke="#FEF08A" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="0" y1="0" x2="12" y2="6" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
          {/* Center Sapphire Tourbillon */}
          <circle
            cx="0"
            cy="0"
            r="5.5"
            fill={stage >= 2 ? '#38BDF8' : '#A8A29E'}
            stroke="#22120B"
            strokeWidth="1.6"
          />
          {/* Stage 3: Golden Astral Rays & Chime Arcs */}
          {stage === 3 && (
            <g stroke="#FEF08A" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M -52 -16 C -62 -6, -62 6, -52 16" />
              <path d="M 52 -16 C 62 -6, 62 6, 52 16" />
              <circle cx="-42" cy="-20" r="3" fill="#FEF08A" />
              <circle cx="42" cy="-20" r="3" fill="#FEF08A" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
};
