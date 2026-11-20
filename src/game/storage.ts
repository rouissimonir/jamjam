import {
  CommissionProgressStats,
  FinialSkinId,
  HapticIntensity,
  ParcelStarRating,
  PreLevelBoosterLoadout,
  StoryProgressState,
  TactileThemeId,
  createInitialStoryProgress,
} from './rules.ts';

export const SAVE_SCHEMA_VERSION = 2;
export const ARCHIVIST_STORAGE_KEY = 'royal_post_archivist_ledger_v1';

export interface PersistedStationTier {
  id: string;
  level: number;
  cost: number;
}

export interface PersistedArchivistState {
  version: number;
  bolts: number;
  clearedLevelIds: number[];
  levelStarsById: Record<number, ParcelStarRating>;
  winStreak: number;
  themeId: TactileThemeId;
  finialSkinId: FinialSkinId;
  hapticIntensity: HapticIntensity;
  adsRemovedPermanently: boolean;
  preLevelBoosters: PreLevelBoosterLoadout;
  stations: PersistedStationTier[];
  storyProgress: StoryProgressState;
  totalScrewsCollected: number;
  screwChestsClaimed: number;
  dailyCompletedDates: string[];
  commissionStats: CommissionProgressStats;
  claimedCommissionIds: string[];
  muted: boolean;
}

const VALID_THEMES: ReadonlySet<string> = new Set([
  'stained_glass',
  'knit_yarn',
  'retro_gadget',
]);
const VALID_FINIALS: ReadonlySet<string> = new Set([
  'royal_brass',
  'star_keyhole',
  'tesla_coil',
  'pearl_loom',
]);
const VALID_HAPTICS: ReadonlySet<string> = new Set(['off', 'light', 'medium', 'heavy']);

export function serializeArchivistState(state: PersistedArchivistState): string {
  return JSON.stringify({
    ...state,
    version: SAVE_SCHEMA_VERSION,
  });
}

export function deserializeArchivistState(
  raw: string | null | undefined
): Partial<PersistedArchivistState> | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;

    const result: Partial<PersistedArchivistState> = {
      version: SAVE_SCHEMA_VERSION,
    };

    if (typeof parsed.bolts === 'number' && Number.isFinite(parsed.bolts) && parsed.bolts >= 0) {
      result.bolts = Math.round(parsed.bolts);
    }

    if (Array.isArray(parsed.clearedLevelIds)) {
      result.clearedLevelIds = Array.from(
        new Set(
          parsed.clearedLevelIds.filter(
            (id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0
          )
        )
      );
    }

    if (parsed.levelStarsById && typeof parsed.levelStarsById === 'object') {
      const rawStars = parsed.levelStarsById as Record<string, unknown>;
      const starsMap: Record<number, ParcelStarRating> = {};
      for (const [k, v] of Object.entries(rawStars)) {
        const levelId = Number(k);
        if (Number.isInteger(levelId) && levelId > 0 && (v === 1 || v === 2 || v === 3)) {
          starsMap[levelId] = v;
        }
      }
      result.levelStarsById = starsMap;
    }

    if (
      typeof parsed.winStreak === 'number' &&
      Number.isFinite(parsed.winStreak) &&
      parsed.winStreak >= 0
    ) {
      result.winStreak = Math.floor(parsed.winStreak);
    }

    if (typeof parsed.themeId === 'string' && VALID_THEMES.has(parsed.themeId)) {
      result.themeId = parsed.themeId as TactileThemeId;
    }

    if (typeof parsed.finialSkinId === 'string' && VALID_FINIALS.has(parsed.finialSkinId)) {
      result.finialSkinId = parsed.finialSkinId as FinialSkinId;
    }

    if (typeof parsed.hapticIntensity === 'string' && VALID_HAPTICS.has(parsed.hapticIntensity)) {
      result.hapticIntensity = parsed.hapticIntensity as HapticIntensity;
    }

    if (typeof parsed.adsRemovedPermanently === 'boolean') {
      result.adsRemovedPermanently = parsed.adsRemovedPermanently;
    }

    if (parsed.preLevelBoosters && typeof parsed.preLevelBoosters === 'object') {
      const b = parsed.preLevelBoosters as Record<string, unknown>;
      result.preLevelBoosters = {
        extraBufferHoles: Boolean(b.extraBufferHoles),
        dualToolbox: Boolean(b.dualToolbox),
      };
    }

    if (Array.isArray(parsed.stations)) {
      result.stations = parsed.stations
        .filter(
          (item): item is PersistedStationTier =>
            Boolean(item) &&
            typeof item === 'object' &&
            typeof (item as PersistedStationTier).id === 'string' &&
            typeof (item as PersistedStationTier).level === 'number' &&
            typeof (item as PersistedStationTier).cost === 'number'
        )
        .map((item) => ({
          id: item.id,
          level: Math.max(1, Math.min(5, Math.floor(item.level))),
          cost: Math.max(10, Math.round(item.cost)),
        }));
    }

    if (parsed.storyProgress && typeof parsed.storyProgress === 'object') {
      const base = createInitialStoryProgress();
      const sp = parsed.storyProgress as Record<string, unknown>;
      const rawStages = (sp.stageByTheme ?? {}) as Record<string, unknown>;
      const clampStage = (val: unknown, fallback: 0 | 1 | 2 | 3): 0 | 1 | 2 | 3 => {
        if (val === 0 || val === 1 || val === 2 || val === 3) return val;
        return fallback;
      };
      const rawClaimed = (sp.masterpieceClaimedByTheme ?? {}) as Record<string, unknown>;
      result.storyProgress = {
        stageByTheme: {
          stained_glass: clampStage(rawStages.stained_glass, base.stageByTheme.stained_glass),
          knit_yarn: clampStage(rawStages.knit_yarn, base.stageByTheme.knit_yarn),
          retro_gadget: clampStage(rawStages.retro_gadget, base.stageByTheme.retro_gadget),
        },
        masterpieceClaimedByTheme: {
          stained_glass: Boolean(rawClaimed.stained_glass),
          knit_yarn: Boolean(rawClaimed.knit_yarn),
          retro_gadget: Boolean(rawClaimed.retro_gadget),
        },
      };
    }

    if (
      typeof parsed.totalScrewsCollected === 'number' &&
      Number.isFinite(parsed.totalScrewsCollected) &&
      parsed.totalScrewsCollected >= 0
    ) {
      result.totalScrewsCollected = Math.floor(parsed.totalScrewsCollected);
    }

    if (
      typeof parsed.screwChestsClaimed === 'number' &&
      Number.isFinite(parsed.screwChestsClaimed) &&
      parsed.screwChestsClaimed >= 0
    ) {
      result.screwChestsClaimed = Math.floor(parsed.screwChestsClaimed);
    }

    if (Array.isArray(parsed.dailyCompletedDates)) {
      result.dailyCompletedDates = Array.from(
        new Set(
          parsed.dailyCompletedDates.filter(
            (d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
          )
        )
      );
    }

    if (parsed.commissionStats && typeof parsed.commissionStats === 'object') {
      const cs = parsed.commissionStats as Record<string, unknown>;
      const safeNum = (v: unknown) =>
        typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
      result.commissionStats = {
        ribbonsUnsealed: safeNum(cs.ribbonsUnsealed),
        waxSealsBroken: safeNum(cs.waxSealsBroken),
        threeStarParcels: safeNum(cs.threeStarParcels),
        silkRushTriggers: safeNum(cs.silkRushTriggers),
      };
    }

    if (Array.isArray(parsed.claimedCommissionIds)) {
      result.claimedCommissionIds = Array.from(
        new Set(
          parsed.claimedCommissionIds.filter((id): id is string => typeof id === 'string')
        )
      );
    }

    if (typeof parsed.muted === 'boolean') {
      result.muted = parsed.muted;
    }

    return result;
  } catch {
    return null;
  }
}

export function loadArchivistState(): Partial<PersistedArchivistState> | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return deserializeArchivistState(window.localStorage.getItem(ARCHIVIST_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveArchivistState(state: PersistedArchivistState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(ARCHIVIST_STORAGE_KEY, serializeArchivistState(state));
  } catch {
    // Ignore storage quota or private-browsing errors gracefully
  }
}

export function clearArchivistState(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(ARCHIVIST_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
