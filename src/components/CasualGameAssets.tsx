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
          <stop offset="0%" stopColor="#FFF455" />
          <stop offset="55%" stopColor="#FFB800" />
          <stop offset="100%" stopColor="#EB7100" />
        </linearGradient>
        <linearGradient id="coinRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF9E00" />
          <stop offset="100%" stopColor="#B04300" />
        </linearGradient>
      </defs>

      {/* 3D Extruded Coin Shadow & Rim */}
      <ellipse
        cx="20"
        cy="21.5"
        rx="16.2"
        ry="15.5"
        fill="url(#coinRimGrad)"
        stroke="#141824"
        strokeWidth="3"
      />

      {/* Main Coin Golden Face */}
      <ellipse
        cx="19.5"
        cy="18.5"
        rx="15.5"
        ry="14.8"
        fill="url(#coinFaceGrad)"
        stroke="#141824"
        strokeWidth="2.8"
      />

      {/* Inner Recessed Gold Ring with 4 Clockwork Notches */}
      <ellipse
        cx="19.5"
        cy="18.5"
        rx="11.2"
        ry="10.6"
        fill="#F08300"
        stroke="#FFEC75"
        strokeWidth="1.6"
      />

      {/* Top-Left Specular Shine */}
      <path
        d="M 10 12 A 12 11 0 0 1 25 8.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeOpacity="0.88"
      />

      {/* Embossed Dollar '$' Symbol */}
      <text
        x="19.5"
        y="23.5"
        textAnchor="middle"
        fill="#FFF58C"
        stroke="#A83E00"
        strokeWidth="1.3"
        paintOrder="stroke fill"
        fontFamily="Fredoka, Outfit, sans-serif"
        fontWeight="700"
        fontSize="16"
      >
        $
      </text>

      {/* Optional Overlapping Lime-Green '+' Badge (Bottom-Right of Coin) */}
      {showPlusBadge && (
        <g transform="translate(21, 21)">
          <path
            d="M 6 1.5 H 11.5 V 6 H 16 V 11.5 H 11.5 V 16 H 6 V 11.5 H 1.5 V 6 H 6 Z"
            fill="#5CE619"
            stroke="#141824"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path
            d="M 6.8 2.8 H 10.7 V 6.8 H 14.7 V 9.2 H 10.7 V 6.8"
            fill="none"
            stroke="#C4FF9E"
            strokeWidth="1.2"
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
      title="Coin Bank & $1.99 Coin Store"
      aria-label={`Open Coin Pack Store, ${bolts} Coins`}
    >
      {/* Left Overlapping 3D Gold Coin with Green '+' Badge */}
      <div className="relative z-10 -mr-3.5 flex items-center justify-center transition-transform group-hover:scale-105">
        <GoldDollarCoinSvg size={isSmall ? 28 : 34} showPlusBadge />
      </div>

      {/* Crisp White Rounded Pill Track with Thick Black Outline & Brass Rivet Dot */}
      <div
        className={`bg-white border-[2.6px] border-[#141824] rounded-xl shadow-[0_3.5px_0_#141824,inset_0_-3px_0_#CBD5E1] flex items-center justify-end gap-1 ${
          isSmall ? 'pl-4 pr-2.5 py-0.5 min-w-[66px]' : 'pl-5 pr-3.5 py-0.5 min-w-[84px]'
        }`}
      >
        <span
          className={`font-game-display font-bold text-[#111318] tabular-nums tracking-tight leading-tight ${
            isSmall ? 'text-xs' : 'text-[15px]'
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
          <stop offset="0%" stopColor="#FFF066" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="chestRoyalWoodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B66FF" />
          <stop offset="100%" stopColor="#1D3EC2" />
        </linearGradient>
      </defs>

      {/* Radial Golden Glow when Ready or Opened */}
      {(isReady || isOpened) && (
        <circle
          cx="36"
          cy="36"
          r="33"
          fill={isOpened ? '#5CE619' : '#FDE047'}
          fillOpacity="0.26"
        />
      )}

      {/* 3D Chest Base Shadow */}
      <rect
        x="10"
        y="34"
        width="52"
        height="28"
        rx="8"
        fill="#0D121F"
        stroke="#141824"
        strokeWidth="2.8"
      />

      {/* Chest Lower Royal-Blue & Brass Vault Body */}
      <rect
        x="10"
        y="31"
        width="52"
        height="27"
        rx="7"
        fill="url(#chestRoyalWoodGrad)"
        stroke="#141824"
        strokeWidth="2.8"
      />
      {/* Brass Vertical Straps */}
      <rect
        x="18"
        y="31"
        width="7"
        height="27"
        fill="url(#chestBrassGrad)"
        stroke="#141824"
        strokeWidth="2"
      />
      <rect
        x="47"
        y="31"
        width="7"
        height="27"
        fill="url(#chestBrassGrad)"
        stroke="#141824"
        strokeWidth="2"
      />

      {/* Overflowing Gold Coins inside when Opened */}
      {isOpened && (
        <g>
          <circle cx="27" cy="27" r="7" fill="#FFD700" stroke="#141824" strokeWidth="2" />
          <circle cx="36" cy="24" r="8" fill="#FFF066" stroke="#141824" strokeWidth="2" />
          <circle cx="45" cy="27" r="7" fill="#FFB800" stroke="#141824" strokeWidth="2" />
        </g>
      )}

      {/* Domed 3D Chest Lid (Tilted open if isOpened) */}
      <g transform={isOpened ? 'translate(0, -8) rotate(-8 36 24)' : ''}>
        <path
          d="M 10 32 C 10 16, 62 16, 62 32 Z"
          fill="url(#chestBrassGrad)"
          stroke="#141824"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        <path
          d="M 17 26 C 24 19, 48 19, 55 26"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
      </g>

      {/* Center Star-Keyhole Escutcheon Lock Plate */}
      <rect
        x="29"
        y="27"
        width="14"
        height="16"
        rx="4"
        fill="url(#chestBrassGrad)"
        stroke="#141824"
        strokeWidth="2.4"
      />
      <circle cx="36" cy="33.5" r="2.6" fill="#141824" />
      <rect x="34.8" y="34.5" width="2.4" height="4.5" fill="#141824" />
    </svg>
  );
};

