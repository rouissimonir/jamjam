import React, { useState } from 'react';
import { X, Volume2, Sparkles, Eye } from 'lucide-react';
import {
  HEIRLOOM_CATALOG,
  HEIRLOOM_ORDER,
  HeirloomId,
} from '../game/rules.ts';
import { HEIRLOOM_ARTWORK } from '../game/artwork.ts';
import { soundManager } from '../game/audio.ts';
import { haptics } from '../game/haptics.ts';

interface CurioPedestalModalProps {
  heirloomId: HeirloomId;
  unlockedCount: number;
  onSelectHeirloom: (id: HeirloomId) => void;
  onClose: () => void;
}

const CURIO_INTERACTION_META: Record<
  HeirloomId,
  { actionLabel: string; activeNote: string; chimeName: string }
> = {
  songbird_egg: {
    actionLabel: 'Wind Songbird Key',
    activeNote: 'Golden wings flutter as the Parisian celesta chimes.',
    chimeName: 'Celesta Songbird Trill',
  },
  astral_watch: {
    actionLabel: 'Advance Astrolabe',
    activeNote: 'Brass escapement ticks and the Venetian moons align.',
    chimeName: 'Horology Escapement Bell',
  },
  kyoto_tea_chest: {
    actionLabel: 'Lift Lacquer Lid',
    activeNote: 'Warm kintsugi steam rises with a paulownia wood chime.',
    chimeName: 'Kintsugi Wood & Porcelain',
  },
  botanical_orrery: {
    actionLabel: 'Spin Brass Rings',
    activeNote: 'Pressed-gold orchids orbit beneath the glass cloche.',
    chimeName: 'Celestial Glass Harp',
  },
};

/**
 * Interactive Curio Inspection Pedestal.
 * Displays bespoke museum heirloom studio art + animated clockwork anatomy with ASMR music-box chimes.
 */
export const CurioPedestalModal: React.FC<CurioPedestalModalProps> = ({
  heirloomId,
  unlockedCount,
  onSelectHeirloom,
  onClose,
}) => {
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'portrait' | 'mechanism'>('portrait');
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  const heirloom = HEIRLOOM_CATALOG[heirloomId];
  const meta = CURIO_INTERACTION_META[heirloomId];
  const currentIdx = HEIRLOOM_ORDER.indexOf(heirloomId);
  const isUnlocked = currentIdx < Math.max(1, unlockedCount);
  const portraitSrc = HEIRLOOM_ARTWORK[heirloomId];
  const showPortrait = viewMode === 'portrait' && Boolean(portraitSrc) && !imgFailed[heirloomId];

  const triggerCurioToy = () => {
    if (!isUnlocked) {
      haptics.occludedBlocked();
      soundManager.playBlockedThud();
      return;
    }

    setPulseCount((c) => c + 1);
    setIsAnimating(true);
    haptics.pinPull();

    if (heirloomId === 'songbird_egg') {
      soundManager.playSongbirdTrill();
    } else if (heirloomId === 'astral_watch') {
      soundManager.playWatchEscapement();
    } else if (heirloomId === 'kyoto_tea_chest') {
      soundManager.playLacquerChime();
    } else {
      soundManager.playOrreryHarp();
    }

    window.setTimeout(() => {
      setIsAnimating(false);
    }, 680);
  };

  const rotationDeg = (pulseCount * 45) % 360;

  return (
    <div
      className="absolute inset-x-0 top-8 bottom-0 z-50 bg-[#120B09]/96 flex items-center justify-center p-3 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="curio-pedestal-title"
    >
      <div className="w-full h-full max-h-[680px] bg-gradient-to-b from-[#261914] via-[#1C120F] to-[#140D0B] border border-[#613E2B] rounded-3xl flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#160F0C] border-b border-[#432B20]">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-300 font-bold">
              Curio Inspection Pedestal
            </div>
            <h2
              id="curio-pedestal-title"
              className="font-game-display text-base font-bold text-[#FDF6EC] truncate"
            >
              {heirloom.name}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                haptics.lightTap();
                setViewMode((v) => (v === 'portrait' ? 'mechanism' : 'portrait'));
              }}
              className="px-2 py-1 rounded-lg bg-[#251814] border border-[#523526] text-[10px] font-mono font-bold text-amber-200 hover:border-amber-400/70 inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              aria-label="Toggle Museum Portrait and Clockwork Mechanism View"
            >
              <Eye className="w-3 h-3 text-amber-400" />
              <span>{viewMode === 'portrait' ? 'Anatomy' : 'Portrait'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Curio Pedestal"
              className="p-1.5 text-[#CDBAA8] hover:text-white rounded-xl hover:bg-[#2F1F19] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Curio Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 px-3 py-2 bg-[#18100D] border-b border-[#3D261C]">
          {HEIRLOOM_ORDER.map((id, idx) => {
            const spec = HEIRLOOM_CATALOG[id];
            const active = id === heirloomId;
            const unlocked = idx < Math.max(1, unlockedCount);
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  haptics.lightTap();
                  setPulseCount(0);
                  onSelectHeirloom(id);
                }}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-game-display font-bold truncate border transition-colors ${
                  active
                    ? 'bg-amber-400 border-[#24140B] text-[#1C110C]'
                    : unlocked
                    ? 'bg-[#251814] border-[#493022] text-[#E6D5C3] hover:text-white'
                    : 'bg-[#170F0D] border-[#2E1E17] text-[#8E7665]'
                }`}
              >
                {spec.name.split(' ').slice(-1)[0]}
              </button>
            );
          })}
        </div>

        {/* Interactive Centerpiece Pedestal Stage */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 relative overflow-hidden">
          <button
            type="button"
            onClick={triggerCurioToy}
            aria-label={`${meta.actionLabel} on ${heirloom.name}`}
            className="group relative w-[256px] h-[256px] rounded-[24px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 cursor-pointer"
          >
            {showPortrait ? (
              <div
                className={`relative w-full h-full rounded-[22px] overflow-hidden border-[2px] transition-transform duration-300 shadow-[0_16px_32px_rgba(0,0,0,0.75)] ${
                  isAnimating
                    ? 'scale-[1.04] border-amber-300 shadow-[0_0_28px_rgba(251,191,36,0.45)]'
                    : 'border-[#6B442B] group-hover:scale-[1.015]'
                }`}
              >
                <img
                  src={portraitSrc}
                  alt={`${heirloom.name} museum keepsake portrait`}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setImgFailed((prev) => ({ ...prev, [heirloomId]: true }))
                  }
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    !isUnlocked ? 'grayscale brightness-50' : ''
                  }`}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120A08]/85 via-transparent to-transparent"
                />
                {isAnimating && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 border-2 border-amber-300/90 rounded-[20px] animate-unbox-pulse"
                  />
                )}
                <div className="pointer-events-none absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[10px] font-mono text-amber-200 whitespace-nowrap">
                  <span>{isUnlocked ? 'Tap heirloom to chime' : 'Locked Royal Vault'}</span>
                  {pulseCount > 0 && (
                    <span className="tabular-nums text-[#FEF08A] font-bold">
                      {pulseCount}×
                    </span>
                  )}
                </div>
              </div>
            ) : (
            <svg
              viewBox="0 0 200 185"
              className="w-52 h-48 overflow-visible drop-shadow-[0_14px_24px_rgba(0,0,0,0.72)]"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="pedestalCandleGlow" cx="50%" cy="46%" r="52%">
                  <stop
                    offset="0%"
                    stopColor="#FEF08A"
                    stopOpacity={isAnimating ? '0.62' : '0.32'}
                  />
                  <stop offset="65%" stopColor={heirloom.jewelHex} stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#140D0B" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="pedestalGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FEF08A" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#92400E" />
                </linearGradient>
              </defs>

              <circle cx="100" cy="86" r="84" fill="url(#pedestalCandleGlow)" />

              {/* Oiled Walnut & Velvet Display Plinth */}
              <ellipse cx="100" cy="158" rx="68" ry="12" fill="#0A0605" fillOpacity="0.8" />
              <rect x="44" y="138" width="112" height="20" rx="8" fill="#3B1A1E" stroke="#F59E0B" strokeWidth="1.6" />
              <rect x="52" y="143" width="96" height="4" rx="2" fill="#FDE68A" fillOpacity="0.45" />

              {/* 1. Imperial Songbird Egg */}
              {heirloomId === 'songbird_egg' && (
                <g transform="translate(100, 96)">
                  <ellipse cx="0" cy="36" rx="20" ry="6" fill="url(#pedestalGoldGrad)" />
                  <ellipse cx="0" cy="6" rx="34" ry="42" fill="#BE123C" stroke="url(#pedestalGoldGrad)" strokeWidth="3.2" />
                  <path d="M -32 8 Q 0 -6 32 8" fill="none" stroke="#FEF08A" strokeWidth="2.4" />
                  <path d="M -27 -10 Q 0 -22 27 -10" fill="none" stroke="#FDE68A" strokeWidth="1.8" strokeDasharray="4 3" />
                  {/* Singing Clockwork Songbird */}
                  <g
                    className="transition-transform duration-300"
                    style={{
                      transform: isAnimating
                        ? 'translate(0px, -48px) scale(1.12)'
                        : 'translate(0px, -38px) scale(1)',
                    }}
                  >
                    <path
                      d="M -10 0 Q -34 -24 -12 -18 Z"
                      fill="#FDE047"
                      stroke="#78350F"
                      strokeWidth="1.5"
                      style={{
                        transform: isAnimating ? 'rotate(-18deg)' : 'rotate(0deg)',
                        transformOrigin: '-8px 0px',
                      }}
                    />
                    <path
                      d="M 10 0 Q 34 -24 12 -18 Z"
                      fill="#FDE047"
                      stroke="#78350F"
                      strokeWidth="1.5"
                      style={{
                        transform: isAnimating ? 'rotate(18deg)' : 'rotate(0deg)',
                        transformOrigin: '8px 0px',
                      }}
                    />
                    <circle cx="0" cy="0" r="14" fill="url(#pedestalGoldGrad)" stroke="#78350F" strokeWidth="2" />
                    <path d="M 11 -2 L 22 -6 L 13 5 Z" fill="#FEF08A" />
                    <circle cx="5" cy="-3" r="2.2" fill="#1C1411" />
                  </g>
                  {isAnimating && (
                    <g stroke="#FEF08A" strokeWidth="2" fill="none" strokeLinecap="round">
                      <path d="M 28 -52 C 36 -46, 36 -38, 28 -32" />
                      <path d="M -28 -52 C -36 -46, -36 -38, -28 -32" />
                    </g>
                  )}
                </g>
              )}

              {/* 2. Venetian Astral Watch */}
              {heirloomId === 'astral_watch' && (
                <g transform="translate(100, 88)">
                  <circle cx="0" cy="-49" r="9" fill="none" stroke="url(#pedestalGoldGrad)" strokeWidth="4" />
                  <circle cx="0" cy="0" r="44" fill="#172554" stroke="url(#pedestalGoldGrad)" strokeWidth="5" />
                  <circle cx="0" cy="0" r="33" fill="none" stroke="#FDE68A" strokeWidth="1.8" strokeDasharray="5 4" />
                  <circle cx="0" cy="0" r="21" fill="none" stroke="#93C5FD" strokeWidth="1.5" />
                  <g
                    className="transition-transform duration-500"
                    style={{ transform: `rotate(${rotationDeg}deg)` }}
                  >
                    <line x1="0" y1="0" x2="0" y2="-28" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
                    <line x1="0" y1="0" x2="20" y2="8" stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" />
                    <circle cx="22" cy="-16" r="4" fill="#FEF08A" />
                  </g>
                  <circle cx="0" cy="0" r="6" fill="#38BDF8" stroke="#FEF08A" strokeWidth="2" />
                </g>
              )}

              {/* 3. Kyoto Lacquer Tea Chest */}
              {heirloomId === 'kyoto_tea_chest' && (
                <g transform="translate(100, 98)">
                  {/* Urushi Tea Bowl */}
                  <path
                    d="M -36 0 C -36 28, -20 38, 0 38 C 20 38, 36 28, 36 0 Z"
                    fill="#064E3B"
                    stroke="url(#pedestalGoldGrad)"
                    strokeWidth="3"
                  />
                  <ellipse cx="0" cy="0" rx="36" ry="9" fill="#10B981" stroke="#FEF08A" strokeWidth="2" />
                  <path d="M -14 8 L -3 20 L 8 14 L 16 30" fill="none" stroke="#FEF08A" strokeWidth="2.6" strokeLinecap="round" />
                  {/* Floating Urushi Lid */}
                  <g
                    className="transition-transform duration-500"
                    style={{
                      transform: isAnimating
                        ? 'translate(0px, -42px) rotate(-6deg)'
                        : 'translate(0px, -22px)',
                    }}
                  >
                    <rect x="-40" y="-12" width="80" height="14" rx="5" fill="#7F1D1D" stroke="#F59E0B" strokeWidth="2" />
                    <circle cx="0" cy="-15" r="5" fill="url(#pedestalGoldGrad)" />
                  </g>
                  {/* Rising Kintsugi Steam */}
                  <g
                    stroke="#FEF08A"
                    strokeWidth="2.2"
                    fill="none"
                    strokeLinecap="round"
                    opacity={isAnimating ? 0.95 : 0.45}
                  >
                    <path d="M -12 -14 Q -18 -28 -8 -40" />
                    <path d="M 8 -14 Q 16 -28 6 -42" />
                  </g>
                </g>
              )}

              {/* 4. Grand Botanical Orrery */}
              {heirloomId === 'botanical_orrery' && (
                <g transform="translate(100, 96)">
                  <path
                    d="M -40 36 L -40 -2 A 40 40 0 0 1 40 -2 L 40 36 Z"
                    fill="#3B0764"
                    fillOpacity="0.48"
                    stroke="#E9D5FF"
                    strokeWidth="2.4"
                  />
                  <g
                    className="transition-transform duration-500"
                    style={{ transform: `rotate(${rotationDeg}deg)` }}
                  >
                    <ellipse cx="0" cy="2" rx="30" ry="12" fill="none" stroke="#F59E0B" strokeWidth="2" />
                    <ellipse cx="0" cy="2" rx="12" ry="30" fill="none" stroke="#FDE047" strokeWidth="1.6" />
                    <circle cx="28" cy="2" r="5" fill="#34D399" stroke="#FEF08A" strokeWidth="1.2" />
                    <circle cx="-26" cy="2" r="4.5" fill="#C084FC" stroke="#FEF08A" strokeWidth="1.2" />
                  </g>
                  <line x1="0" y1="36" x2="0" y2="-10" stroke="#34D399" strokeWidth="3" />
                  <circle cx="0" cy="-10" r="10" fill="url(#pedestalGoldGrad)" stroke="#FEF08A" strokeWidth="2" />
                </g>
              )}
            </svg>
            )}
          </button>

          <div className="text-center max-w-xs mt-1 space-y-1">
            <div className="text-[11px] font-mono text-amber-300">
              {heirloom.origin} · {heirloom.era}
            </div>
            <p className="text-xs text-[#DECBB9] leading-relaxed">
              {pulseCount > 0 ? meta.activeNote : heirloom.loreNote}
            </p>
            {!isUnlocked && (
              <p className="text-[11px] font-mono text-rose-300">
                Unseal more Royal Post parcels to unlock this keepsake.
              </p>
            )}
          </div>
        </div>

        {/* Footer Primary Interactive Toy Control */}
        <div className="px-4 py-3 bg-[#160F0C] border-t border-[#432B20] flex flex-col gap-2">
          <button
            type="button"
            onClick={triggerCurioToy}
            disabled={!isUnlocked}
            className={`w-full py-2.5 px-4 rounded-2xl font-game-display font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-transform active:scale-95 ${
              isUnlocked
                ? 'btn-3d-amber text-[#1C110C] cursor-pointer'
                : 'bg-[#251814] border border-[#422B20] text-[#8A7362] cursor-not-allowed'
            }`}
          >
            <Volume2 className="w-4 h-4 shrink-0" />
            <span>{isUnlocked ? meta.actionLabel : 'Locked Keepsake'}</span>
            {pulseCount > 0 && isUnlocked && (
              <span className="font-mono text-xs tabular-nums opacity-80">
                ({pulseCount}×)
              </span>
            )}
          </button>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#B8A18D]">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{meta.chimeName}</span>
            </span>
            <span>{heirloom.ribbonMaterial}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
