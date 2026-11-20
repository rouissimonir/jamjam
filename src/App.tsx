import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Phaser from 'phaser';
import { ScrewJamScene, SceneCallbacks, SceneTelemetry } from './game/ScrewJamScene.ts';
import {
  UnpackingQueueState,
  createInitialQueueState,
  routeTappedPin,
  swapActiveWithNextToolbox,
  triggerMoltenWildcard,
  clearBufferSlotsForRevive,
  PinColor,
  TactileThemeId,
  TACTILE_THEMES,
  PreLevelBoosterLoadout,
  HapticIntensity,
  HAPTIC_INTENSITY_SPECS,
  GravityNudgeDirection,
  ComboFeverState,
  createInitialComboFeverState,
  updateComboFeverOnTap,
  SCREW_CHEST_REWARD_BOLTS,
  FinialSkinId,
  FINIAL_SKINS,
  StoryProgressState,
  createInitialStoryProgress,
  advanceStoryChapterStep,
  getStoryClearBonusBolts,
  getArtisanCompanionLine,
  STORY_CHAPTERS,
  computeLiveHeirloomUnboxingState,
  AtelierStationTierMap,
  computeAtelierActivePerks,
  undoBufferedPinFromQueue,
  formatLocalDateKey,
  computeDailyCourierStreak,
  generateDailyDispatchLevel,
  DAILY_DISPATCH_REWARD_BOLTS,
  HeirloomId,
  HEIRLOOM_ORDER,
  ParcelStarRating,
  ParcelMasteryEvaluation,
  computeParcelStarRating,
  computeArchivistRank,
  CommissionId,
  CommissionProgressStats,
  evaluateRoyalCommissions,
} from './game/rules.ts';
import {
  loadArchivistState,
  saveArchivistState,
  clearArchivistState,
  SAVE_SCHEMA_VERSION,
} from './game/storage.ts';
import { LEVELS, CAPGO_OTA_BONUS_LEVELS, LevelConfig } from './game/levels.ts';
import { GameHUD } from './components/GameHUD.tsx';
import { LiveHeirloomStage } from './components/LiveHeirloomStage.tsx';
import { DesktopCurioLedger } from './components/DesktopCurioLedger.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import { AlmostWonModal } from './components/AlmostWonModal.tsx';
import { WaxSealCeremonyModal } from './components/WaxSealCeremonyModal.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { WorkshopModal, RenovationStation } from './components/WorkshopModal.tsx';
import { LevelSelectModal } from './components/LevelSelectModal.tsx';
import { CurioPedestalModal } from './components/CurioPedestalModal.tsx';
import { soundManager } from './game/audio.ts';
import { haptics } from './game/haptics.ts';
import { capacitorBridge, CapgoBundleState } from './game/capacitorBridge.ts';
import { Eye, Magnet, Scissors, Play, RotateCcw, Wind, Flame } from 'lucide-react';

type AppState = 'title' | 'playing' | 'paused' | 'gameover';

const INITIAL_STATIONS: RenovationStation[] = [
  {
    id: 'workbench',
    name: 'Oiled Walnut Archivist Desk',
    category: 'Foundation',
    level: 2,
    maxLevel: 5,
    cost: 40,
    description: 'Hand-rubbed walnut courier desk inlaid with brass rules and burgundy velvet parcel trays.',
    perk: '+15% Gold Crown rewards on parcel clears',
  },
  {
    id: 'drill',
    name: 'Heirloom Brass Wax Signet Press',
    category: 'Sealing',
    level: 1,
    maxLevel: 5,
    cost: 50,
    description: 'Heated crimson-lacquer melter and engraved signet stamps for crisp wax seal reliefs.',
    perk: 'Crisp lacquered wax seal embossing',
  },
  {
    id: 'anodizing',
    name: 'Parisian Silk & Satin Loom',
    category: 'Textiles',
    level: 1,
    maxLevel: 5,
    cost: 60,
    description: 'Jacquard ribbon loom weaving double-gold crimson, ochre guild stripe, and emerald herringbone.',
    perk: 'Unlocks Royal Wax, Kyoto Silk & Venetian Velvet desks',
  },
  {
    id: 'magnet',
    name: 'Gilded Tailoring Scissors Set',
    category: 'Tools',
    level: 2,
    maxLevel: 5,
    cost: 75,
    description: 'Precision brass-handled shears for lifting tucked satin ribbons when pegs run low.',
    perk: 'Rescue Offer expands Brass Rack to 7 pegs + clears 2',
  },
  {
    id: 'blueprint',
    name: 'Candlelit Parchment Lightbox',
    category: 'Inspection',
    level: 3,
    maxLevel: 5,
    cost: 100,
    description: 'Warm translucent viewing glass for inspecting hidden overlapping ribbon knots.',
    perk: 'Unlocks Backlight [X] & Candle Fan [E] inspection',
  },
];

const THEME_CYCLE: TactileThemeId[] = ['stained_glass', 'knit_yarn', 'retro_gadget'];
const UNDO_COST_CROWNS = 15;

function mergePersistedStations(
  saved?: Array<{ id: string; level: number; cost: number }>
): RenovationStation[] {
  if (!saved || saved.length === 0) return INITIAL_STATIONS;
  const map = new Map(saved.map((s) => [s.id, s]));
  return INITIAL_STATIONS.map((base) => {
    const match = map.get(base.id);
    if (!match) return base;
    return {
      ...base,
      level: Math.max(1, Math.min(base.maxLevel, match.level)),
      cost: Math.max(10, match.cost),
    };
  });
}

export default function App() {
  const isVictoryQueryPreview = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('victory') === '1';
  }, []);

  const hydratedSave = useMemo(() => {
    if (isVictoryQueryPreview) return null;
    return loadArchivistState();
  }, [isVictoryQueryPreview]);

  const todayDateKey = useMemo(() => formatLocalDateKey(new Date()), []);
  const dailyLevel = useMemo(() => generateDailyDispatchLevel(todayDateKey), [todayDateKey]);

  const [gameState, setGameState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('victory') === '1') {
        return 'gameover';
      }
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  });

  const [capgoState, setCapgoState] = useState<CapgoBundleState>(() =>
    capacitorBridge.getState()
  );
  const [otaSynced, setOtaSynced] = useState<boolean>(false);
  const availableLevels = useMemo(
    () => (otaSynced ? [...LEVELS, ...CAPGO_OTA_BONUS_LEVELS] : LEVELS),
    [otaSynced]
  );

  const [themeId, setThemeId] = useState<TactileThemeId>(
    () => hydratedSave?.themeId ?? 'stained_glass'
  );
  const [hapticIntensity, setHapticIntensity] = useState<HapticIntensity>(
    () => hydratedSave?.hapticIntensity ?? haptics.getIntensity()
  );
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(
    () => hydratedSave?.muted ?? soundManager.getMuted()
  );
  const [spatialTiltEnabled] = useState<boolean>(true);
  const [preLevelBoosters, setPreLevelBoosters] = useState<PreLevelBoosterLoadout>(
    () =>
      hydratedSave?.preLevelBoosters ?? {
        extraBufferHoles: false,
        dualToolbox: false,
      }
  );
  const [winStreak, setWinStreak] = useState<number>(() => hydratedSave?.winStreak ?? 2);
  const [adsRemovedPermanently, setAdsRemovedPermanently] = useState<boolean>(
    () => hydratedSave?.adsRemovedPermanently ?? false
  );
  const [workshopInitialTab, setWorkshopInitialTab] = useState<'atelier' | 'monetization' | 'aso'>('atelier');

  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const requestedLvl = Number(params.get('level'));
      if (requestedLvl > 0) {
        const match = LEVELS.find((l) => l.id === requestedLvl);
        if (match) return match;
      }
      if (params.get('victory') === '1') {
        return LEVELS.find((l) => l.id === 5) || LEVELS[0];
      }
    }
    return LEVELS[0];
  });

  const [clearedLevelIds, setClearedLevelIds] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('victory') === '1') {
        return [1, 2, 3, 4, 5];
      }
    }
    return hydratedSave?.clearedLevelIds ?? [];
  });

  const [dailyCompletedDates, setDailyCompletedDates] = useState<string[]>(
    () => hydratedSave?.dailyCompletedDates ?? []
  );

  const [levelStarsById, setLevelStarsById] = useState<Record<number, ParcelStarRating>>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('victory') === '1') {
        return { 1: 3, 2: 3, 3: 2, 4: 3, 5: 3 };
      }
    }
    return hydratedSave?.levelStarsById ?? {};
  });

  const [commissionStats, setCommissionStats] = useState<CommissionProgressStats>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('victory') === '1') {
        return {
          ribbonsUnsealed: 24,
          waxSealsBroken: 3,
          threeStarParcels: 2,
          silkRushTriggers: 1,
        };
      }
    }
    return (
      hydratedSave?.commissionStats ?? {
        ribbonsUnsealed: 0,
        waxSealsBroken: 0,
        threeStarParcels: 0,
        silkRushTriggers: 0,
      }
    );
  });

  const [claimedCommissionIds, setClaimedCommissionIds] = useState<string[]>(
    () => hydratedSave?.claimedCommissionIds ?? []
  );

  const [peakRackUsedThisRun, setPeakRackUsedThisRun] = useState<number>(() =>
    isVictoryQueryPreview ? 2 : 0
  );
  const [revivesUsedThisRun, setRevivesUsedThisRun] = useState<number>(0);
  const [lastParcelMastery, setLastParcelMastery] = useState<ParcelMasteryEvaluation>(() =>
    computeParcelStarRating(isVictoryQueryPreview ? 2 : 0, 0, 5)
  );

  const [queueState, setQueueState] = useState<UnpackingQueueState>(() =>
    createInitialQueueState(
      currentLevel.toolboxColors,
      hydratedSave?.preLevelBoosters ?? { extraBufferHoles: false, dualToolbox: false }
    )
  );
  const [bolts, setBolts] = useState<number>(() => hydratedSave?.bolts ?? 130);
  const [stations, setStations] = useState<RenovationStation[]>(() =>
    mergePersistedStations(hydratedSave?.stations)
  );
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [explodePeek, setExplodePeek] = useState<boolean>(false);
  const [nudgeStep, setNudgeStep] = useState<number>(0);
  const [freeUndosRemaining, setFreeUndosRemaining] = useState<number>(1);
  const [showWorkshop, setShowWorkshop] = useState<boolean>(false);
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [inspectedHeirloomId, setInspectedHeirloomId] = useState<HeirloomId | null>(null);
  const [modalType, setModalType] = useState<'none' | 'almost_won' | 'seal_ceremony' | 'victory'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('victory') === '1') {
        return 'victory';
      }
    }
    return 'none';
  });
  const [occlusionToast, setOcclusionToast] = useState<string | null>(null);
  const [islandBanner, setIslandBanner] = useState<string>('Royal Post · Wax & Ribbon');
  const [telemetry, setTelemetry] = useState<SceneTelemetry | null>(null);
  const [levelStartTime, setLevelStartTime] = useState<number>(() => Date.now());
  const [clearTimeSeconds, setClearTimeSeconds] = useState<number>(12);
  const [comboState, setComboState] = useState<ComboFeverState>(() =>
    createInitialComboFeverState()
  );
  const [totalScrewsCollected, setTotalScrewsCollected] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('victory') === '1') {
        return 54;
      }
    }
    return hydratedSave?.totalScrewsCollected ?? 47;
  });
  const [screwChestsClaimed, setScrewChestsClaimed] = useState<number>(
    () => hydratedSave?.screwChestsClaimed ?? 0
  );
  const [finialSkinId, setFinialSkinId] = useState<FinialSkinId>(
    () => hydratedSave?.finialSkinId ?? 'royal_brass'
  );
  const [storyProgress, setStoryProgress] = useState<StoryProgressState>(
    () => hydratedSave?.storyProgress ?? createInitialStoryProgress()
  );
  const [artisanLine, setArtisanLine] = useState<string>(() => {
    const initialTheme = hydratedSave?.themeId ?? 'stained_glass';
    return `${STORY_CHAPTERS[initialTheme].artisanName}: "Tap unsealed ribbons to wind them onto your velvet bobbin!"`;
  });
  const [matchPulseKey, setMatchPulseKey] = useState<number>(0);
  const [lastMatchedColor, setLastMatchedColor] = useState<PinColor | null>(null);

  const activePerks = useMemo(() => {
    const getTier = (id: keyof AtelierStationTierMap) =>
      stations.find((s) => s.id === id)?.level ?? 1;
    return computeAtelierActivePerks({
      workbench: getTier('workbench'),
      drill: getTier('drill'),
      anodizing: getTier('anodizing'),
      magnet: getTier('magnet'),
      blueprint: getTier('blueprint'),
    });
  }, [stations]);

  const dailyCompletedToday = dailyCompletedDates.includes(todayDateKey);
  const dailyStreak = useMemo(
    () => computeDailyCourierStreak(dailyCompletedDates, todayDateKey),
    [dailyCompletedDates, todayDateKey]
  );
  const unlockedHeirloomCount = Math.min(
    HEIRLOOM_ORDER.length,
    Math.max(1, clearedLevelIds.length + (dailyCompletedDates.length > 0 ? 1 : 0))
  );

  const totalStars = useMemo(
    () => Object.values(levelStarsById).reduce((acc, s) => acc + s, 0),
    [levelStarsById]
  );

  const archivistRank = useMemo(
    () =>
      computeArchivistRank(
        totalStars,
        totalScrewsCollected,
        dailyCompletedDates.length
      ),
    [totalStars, totalScrewsCollected, dailyCompletedDates.length]
  );

  const evaluatedCommissions = useMemo(
    () => evaluateRoyalCommissions(commissionStats, claimedCommissionIds),
    [commissionStats, claimedCommissionIds]
  );

  const claimableCommissionsCount = useMemo(
    () => evaluatedCommissions.filter((c) => c.claimable).length,
    [evaluatedCommissions]
  );

  const phaserContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneCallbacksRef = useRef<SceneCallbacks | null>(null);
  const victoryTriggeredRef = useRef<boolean>(false);
  const peakRackRef = useRef<number>(isVictoryQueryPreview ? 2 : 0);
  const revivesUsedRef = useRef<number>(0);
  const prevUnboxingStageRef = useRef<number>(0);
  const gameStateRef = useRef<AppState>(gameState);
  gameStateRef.current = gameState;

  // Live Centerpiece Heirloom Unboxing State (Updates on every single matched ribbon!)
  const liveUnboxing = useMemo(() => {
    if (modalType === 'victory' || modalType === 'seal_ceremony') {
      return computeLiveHeirloomUnboxingState(
        currentLevel.toolboxColors.length,
        0,
        0,
        currentLevel.toolboxColors.length,
        currentLevel.id
      );
    }
    return computeLiveHeirloomUnboxingState(
      queueState.completedBoxes,
      queueState.activeToolbox?.pins.length ?? 0,
      queueState.secondaryToolbox?.pins.length ?? 0,
      queueState.totalBoxes,
      currentLevel.id
    );
  }, [
    modalType,
    currentLevel.toolboxColors.length,
    queueState.completedBoxes,
    queueState.activeToolbox?.pins.length,
    queueState.secondaryToolbox?.pins.length,
    queueState.totalBoxes,
    currentLevel.id,
  ]);

  // Apply persisted audio/haptics preferences once on mount
  useEffect(() => {
    if (hydratedSave?.muted !== undefined) {
      soundManager.setMuted(hydratedSave.muted);
    }
    if (hydratedSave?.hapticIntensity) {
      haptics.setIntensity(hydratedSave.hapticIntensity);
    }
  }, [hydratedSave]);

  // Play ascending musical chime whenever the Live Centerpiece Heirloom advances an unboxing stage
  useEffect(() => {
    if (gameState !== 'playing') {
      prevUnboxingStageRef.current = liveUnboxing.unboxingStage;
      return;
    }
    if (liveUnboxing.unboxingStage > prevUnboxingStageRef.current) {
      soundManager.playStageAdvanceChime(liveUnboxing.unboxingStage);
    }
    prevUnboxingStageRef.current = liveUnboxing.unboxingStage;
  }, [gameState, liveUnboxing.unboxingStage]);

  // Auto-save persistent local archivist ledger whenever key state updates
  useEffect(() => {
    if (isVictoryQueryPreview) return;
    saveArchivistState({
      version: SAVE_SCHEMA_VERSION,
      bolts,
      clearedLevelIds,
      winStreak,
      themeId,
      finialSkinId,
      hapticIntensity,
      adsRemovedPermanently,
      preLevelBoosters,
      stations: stations.map((s) => ({ id: s.id, level: s.level, cost: s.cost })),
      storyProgress,
      totalScrewsCollected,
      screwChestsClaimed,
      dailyCompletedDates,
      muted: isAudioMuted,
      levelStarsById,
      commissionStats,
      claimedCommissionIds,
    });
  }, [
    isVictoryQueryPreview,
    bolts,
    clearedLevelIds,
    winStreak,
    themeId,
    finialSkinId,
    hapticIntensity,
    adsRemovedPermanently,
    preLevelBoosters,
    stations,
    storyProgress,
    totalScrewsCollected,
    screwChestsClaimed,
    dailyCompletedDates,
    isAudioMuted,
    levelStarsById,
    commissionStats,
    claimedCommissionIds,
  ]);

  // Sync Candlelight Idle Hint delay perk to Phaser whenever Atelier Lightbox upgrades
  useEffect(() => {
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    scene?.setIdleHintDelayMs(activePerks.idleHintDelayMs);
  }, [activePerks.idleHintDelayMs]);

  useEffect(() => {
    const unsubscribeCapgo = capacitorBridge.subscribe(setCapgoState);
    const unsubscribeHaptics = haptics.subscribe((nextIntensity, pulseLabel) => {
      setHapticIntensity(nextIntensity);
      setIslandBanner(pulseLabel);
    });
    capacitorBridge.initialize().catch(() => {});
    return () => {
      unsubscribeCapgo();
      unsubscribeHaptics();
    };
  }, []);

  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  const workshopProgress = useMemo(() => {
    const total = stations.reduce((acc, s) => acc + s.level, 0);
    const max = stations.reduce((acc, s) => acc + s.maxLevel, 0);
    return Math.round((total / max) * 100);
  }, [stations]);

  const triggerVictoryOnce = useCallback(() => {
    if (victoryTriggeredRef.current) return;
    victoryTriggeredRef.current = true;
    const elapsed = Math.max(1, Math.round((Date.now() - levelStartTime) / 1000));
    setClearTimeSeconds(elapsed);

    const mastery = computeParcelStarRating(
      peakRackRef.current,
      revivesUsedRef.current,
      queueState.maxBufferSlots
    );
    setLastParcelMastery(mastery);
    setPeakRackUsedThisRun(peakRackRef.current);
    setRevivesUsedThisRun(revivesUsedRef.current);

    if (mastery.stars === 3) {
      setCommissionStats((prev) => ({
        ...prev,
        threeStarParcels: prev.threeStarParcels + 1,
      }));
    }

    let dailyFirstClearBonus = 0;
    if (currentLevel.isDaily && currentLevel.dailyDateKey) {
      const dateKey = currentLevel.dailyDateKey;
      if (!dailyCompletedDates.includes(dateKey)) {
        dailyFirstClearBonus = DAILY_DISPATCH_REWARD_BOLTS;
        setDailyCompletedDates((prev) => (prev.includes(dateKey) ? prev : [...prev, dateKey]));
      }
    } else {
      setClearedLevelIds((prev) =>
        prev.includes(currentLevel.id) ? prev : [...prev, currentLevel.id]
      );
      setLevelStarsById((prev) => {
        const existing = prev[currentLevel.id] ?? 0;
        if (mastery.stars <= existing) return prev;
        return { ...prev, [currentLevel.id]: mastery.stars };
      });
    }

    setWinStreak((s) => s + 1);
    const finialBonus = FINIAL_SKINS[finialSkinId]?.extraClearBolts || 0;
    const storyBonus = getStoryClearBonusBolts(storyProgress, themeId);
    const baseClearCrowns = currentLevel.isDaily
      ? dailyFirstClearBonus > 0
        ? dailyFirstClearBonus
        : 25
      : currentLevel.rewardBolts;
    const totalClearCrowns =
      Math.round(
        (baseClearCrowns + finialBonus + storyBonus) * activePerks.crownRewardMultiplier
      ) + mastery.starBonusCrowns;
    setBolts((b) => b + totalClearCrowns);
    setArtisanLine(getArtisanCompanionLine(themeId, 'victory'));
    setIslandBanner(currentLevel.isDaily ? 'Daily Dispatch Sealed!' : 'Break Final Wax Seal!');
    setGameState('gameover');
    setModalType('seal_ceremony');
  }, [
    activePerks.crownRewardMultiplier,
    currentLevel.dailyDateKey,
    currentLevel.id,
    currentLevel.isDaily,
    currentLevel.rewardBolts,
    dailyCompletedDates,
    finialSkinId,
    levelStartTime,
    queueState.maxBufferSlots,
    storyProgress,
    themeId,
  ]);

  const handlePinTapped = useCallback(
    (pinId: string, color: PinColor) => {
      const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
        | ScrewJamScene
        | undefined;
      setTotalScrewsCollected((count) => count + 1);
      setCommissionStats((prev) => ({
        ...prev,
        ribbonsUnsealed: prev.ribbonsUnsealed + 1,
      }));
      setComboState((prevCombo) => {
        const nextCombo = updateComboFeverOnTap(prevCombo, Date.now());
        soundManager.playPinUnscrew(nextCombo.pitchFactor, nextCombo.streakCount);
        if (!prevCombo.isFever && nextCombo.isFever) {
          setCommissionStats((prev) => ({
            ...prev,
            silkRushTriggers: prev.silkRushTriggers + 1,
          }));
          scene?.celebrateCanvasCallout('SILK RUSH 3x!', '#FDE047', true);
        }
        if (nextCombo.bonusBoltsEarned > 0) {
          const boostedBonus = nextCombo.bonusBoltsEarned + activePerks.waxAndComboBonusCrowns;
          setBolts((b) => b + boostedBonus);
          setIslandBanner(
            nextCombo.isFever
              ? `SILK RUSH ${nextCombo.streakCount}x! +${boostedBonus}`
              : `Combo ${nextCombo.streakCount}x +${boostedBonus}`
          );
        } else {
          setIslandBanner('Silk Ribbon Pulled');
        }
        return nextCombo;
      });

      setQueueState((prev) => {
        const next = routeTappedPin(prev, pinId, color);
        if (next.holdingBuffer.length > peakRackRef.current) {
          peakRackRef.current = next.holdingBuffer.length;
          setPeakRackUsedThisRun(next.holdingBuffer.length);
        }
        const newlyChargedWildcard = !prev.moltenWildcardReady && next.moltenWildcardReady;

        if (next.lastAction === 'box_completed') {
          soundManager.playBoxCompleted();
          haptics.boxCompleted();
          scene?.celebrateCanvasCallout('BOBBIN WOUND +20', '#FDE047', true);
          setBolts((b) => b + 20);
          setMatchPulseKey((k) => k + 1);
          setLastMatchedColor(color);
          setArtisanLine(
            `${STORY_CHAPTERS[themeId].artisanName}: "Bobbin complete! Watch the heirloom box open!"`
          );
          setIslandBanner(
            newlyChargedWildcard ? 'Golden Scissors Ready!' : 'Bobbin Wound +20'
          );
        } else if (next.lastAction === 'matched_box') {
          soundManager.playDepositPin(true);
          setMatchPulseKey((k) => k + 1);
          setLastMatchedColor(color);
          if (newlyChargedWildcard) {
            soundManager.playMoltenWildcard();
            scene?.celebrateCanvasCallout('GOLDEN SCISSORS!', '#FBBF24', false);
            setIslandBanner('Golden Scissors [W] Ready!');
          }
        } else if (next.lastAction === 'buffered') {
          soundManager.playDepositPin(false);
        }

        if (next.status === 'almost_won_fail') {
          setIslandBanner(`Rack Full ${next.holdingBuffer.length}/${next.maxBufferSlots}`);
          setGameState('gameover');
          setModalType('almost_won');
        } else if (next.status === 'victory') {
          triggerVictoryOnce();
        }

        return next;
      });
    },
    [activePerks.waxAndComboBonusCrowns, themeId, triggerVictoryOnce]
  );

  const handleOccludedPinTapped = useCallback(
    (_pinId: string, _color: PinColor, overlapRatio: number) => {
      const percent = Math.round(overlapRatio * 100);
      setIslandBanner(`Tucked Under (${percent}%)`);
      setOcclusionToast(
        `Tucked Ribbon! An overlapping ribbon covers ${percent}% of this wax seal.`
      );
      setTimeout(() => {
        setOcclusionToast(null);
      }, 2200);
    },
    []
  );

  const handleKeyUnlocked = useCallback(
    (_keyPinId: string, unlockedPinIds: string[], bonusBolts: number) => {
      if (bonusBolts > 0) {
        setBolts((b) => b + bonusBolts);
      }
      setArtisanLine(getArtisanCompanionLine(themeId, 'key_unlocked'));
      setIslandBanner(`SIGNET Freed +${bonusBolts}!`);
      setOcclusionToast(
        `Royal Signet Unlatched! ${unlockedPinIds.length} Crest Lock freed (+${bonusBolts} Crowns)`
      );
      setTimeout(() => {
        setOcclusionToast(null);
      }, 2200);
    },
    [themeId]
  );

  const handlePadlockedPinTapped = useCallback(
    (_pinId: string, _blockingKeyPinId: string) => {
      setIslandBanner('Crest Locked · Pull SIGNET');
      setOcclusionToast(
        'Royal Crest Lock! Pull the golden SIGNET seal on the parcel first to unlock.'
      );
      setTimeout(() => {
        setOcclusionToast(null);
      }, 2200);
    },
    []
  );

  const handleFrostedPinTapped = useCallback(
    (_pinId: string, remainingFrost: number) => {
      setArtisanLine(getArtisanCompanionLine(themeId, 'ice_blocked'));
      setIslandBanner(`Hard Wax WAX×${remainingFrost}!`);
      setOcclusionToast(
        `Thick Sealing Wax (WAX×${remainingFrost})! Pull another clasp on the same ribbon to crack the wax.`
      );
      setTimeout(() => {
        setOcclusionToast(null);
      }, 2200);
    },
    [themeId]
  );

  const handleFrostUpdated = useCallback(
    (crackedPinIds: string[], shatteredPinIds: string[], bonusBolts: number) => {
      const brokenCount = crackedPinIds.length + shatteredPinIds.length;
      if (brokenCount > 0) {
        setCommissionStats((prev) => ({
          ...prev,
          waxSealsBroken: prev.waxSealsBroken + brokenCount,
        }));
      }
      const totalBonus = bonusBolts > 0 ? bonusBolts + activePerks.waxAndComboBonusCrowns : 0;
      if (totalBonus > 0) {
        setBolts((b) => b + totalBonus);
      }
      if (shatteredPinIds.length > 0) {
        setArtisanLine(getArtisanCompanionLine(themeId, 'ice_shattered'));
        setIslandBanner(`Wax Shattered +${totalBonus}!`);
        setOcclusionToast(
          `Sealing Wax Shattered! Clasp freed cleanly (+${totalBonus} Crowns)`
        );
        setTimeout(() => {
          setOcclusionToast(null);
        }, 2000);
      } else if (crackedPinIds.length > 0) {
        setArtisanLine(getArtisanCompanionLine(themeId, 'ice_cracked'));
        setIslandBanner('Wax Cracked -> WAX×1');
      }
    },
    [activePerks.waxAndComboBonusCrowns, themeId]
  );

  const handleChainBlockedPinTapped = useCallback(
    (_pinId: string, _partnerPinId: string, _reason: string) => {
      setArtisanLine(getArtisanCompanionLine(themeId, 'chain_blocked'));
      setIslandBanner('Tied Bow · Free Twin');
      setOcclusionToast(
        'Tied Satin Bow (BOW)! Uncover both linked clasps first so the bow unties together.'
      );
      setTimeout(() => {
        setOcclusionToast(null);
      }, 2200);
    },
    [themeId]
  );

  const handleChainDoublePulled = useCallback(
    (_primaryPinId: string, _partnerPinId: string, bonusBolts: number) => {
      if (bonusBolts > 0) {
        setBolts((b) => b + bonusBolts);
      }
      setArtisanLine(getArtisanCompanionLine(themeId, 'chain_pulled'));
      setIslandBanner(`Satin Bow Untied +${bonusBolts}!`);
      setOcclusionToast(
        `Tied Satin Bow Untied! Both paired clasps slid free together (+${bonusBolts} Crowns)`
      );
      setTimeout(() => {
        setOcclusionToast(null);
      }, 2200);
    },
    [themeId]
  );

  const handlePlateCleared = useCallback(
    (_plateId: string) => {
      setBolts((b) => b + 15);
      const spec = TACTILE_THEMES[themeId];
      setIslandBanner(`${spec.plateNoun} Freed +15`);
    },
    [themeId]
  );

  const handleLevelComplete = useCallback(() => {
    triggerVictoryOnce();
  }, [triggerVictoryOnce]);

  const handleIdleHintChanged = useCallback(
    (active: boolean, movablePinIds: string[], _recommendedPinId: string | null) => {
      if (gameStateRef.current !== 'playing') return;
      if (active && movablePinIds.length > 0) {
        setArtisanLine(getArtisanCompanionLine(themeId, 'idle_hint'));
        setIslandBanner(`Hint: ${movablePinIds.length} Free Seals`);
      }
    },
    [themeId]
  );

  sceneCallbacksRef.current = {
    onPinTapped: handlePinTapped,
    onOccludedPinTapped: handleOccludedPinTapped,
    onPlateCleared: handlePlateCleared,
    onLevelComplete: handleLevelComplete,
    onTelemetryChange: setTelemetry,
    onKeyUnlocked: handleKeyUnlocked,
    onPadlockedPinTapped: handlePadlockedPinTapped,
    onFrostedPinTapped: handleFrostedPinTapped,
    onFrostUpdated: handleFrostUpdated,
    onChainBlockedPinTapped: handleChainBlockedPinTapped,
    onChainDoublePulled: handleChainDoublePulled,
    onIdleHintChanged: handleIdleHintChanged,
  };

  useEffect(() => {
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    const colors: PinColor[] = [];
    if (queueState.activeToolbox?.color) colors.push(queueState.activeToolbox.color);
    if (queueState.secondaryToolbox?.color) colors.push(queueState.secondaryToolbox.color);
    scene?.setActiveToolboxColors(colors);
  }, [queueState.activeToolbox?.color, queueState.secondaryToolbox?.color]);

  const initPhaserGame = useCallback(
    (
      level: LevelConfig,
      initialXray: boolean,
      initialTheme: TactileThemeId,
      initialTilt: boolean,
      initialFinialSkin: FinialSkinId = 'royal_brass',
      initialIdleHintDelayMs: number = 5000
    ) => {
      if (!phaserContainerRef.current) return;

      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: phaserContainerRef.current,
        width: 400,
        height: 540,
        transparent: true,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: 'matter',
          matter: {
            gravity: { x: 0, y: 1.45 },
            enableSleeping: false,
            debug: false,
          },
        },
        scene: [],
      };

      const game = new Phaser.Game(config);
      phaserGameRef.current = game;

      game.events.once('ready', () => {
        game.scene.add('ScrewJamScene', ScrewJamScene, true, {
          levelConfig: level,
          xrayMode: initialXray,
          themeId: initialTheme,
          finialSkinId: initialFinialSkin,
          spatialTiltEnabled: initialTilt,
          idleHintDelayMs: initialIdleHintDelayMs,
          activeToolboxColors: level.toolboxColors.slice(0, 1),
          callbacks: {
            onPinTapped: (pinId: string, color: PinColor) =>
              sceneCallbacksRef.current?.onPinTapped(pinId, color),
            onOccludedPinTapped: (pinId: string, color: PinColor, ratio: number) =>
              sceneCallbacksRef.current?.onOccludedPinTapped(pinId, color, ratio),
            onPlateCleared: (plateId: string) =>
              sceneCallbacksRef.current?.onPlateCleared(plateId),
            onLevelComplete: () => sceneCallbacksRef.current?.onLevelComplete(),
            onTelemetryChange: (t: SceneTelemetry) =>
              sceneCallbacksRef.current?.onTelemetryChange?.(t),
            onKeyUnlocked: (keyId: string, unlockedIds: string[], bonus: number) =>
              sceneCallbacksRef.current?.onKeyUnlocked?.(keyId, unlockedIds, bonus),
            onPadlockedPinTapped: (pinId: string, keyId: string) =>
              sceneCallbacksRef.current?.onPadlockedPinTapped?.(pinId, keyId),
            onFrostedPinTapped: (pinId: string, rem: number) =>
              sceneCallbacksRef.current?.onFrostedPinTapped?.(pinId, rem),
            onFrostUpdated: (cracked: string[], shattered: string[], bonus: number) =>
              sceneCallbacksRef.current?.onFrostUpdated?.(cracked, shattered, bonus),
            onChainBlockedPinTapped: (pinId: string, partnerId: string, reason: string) =>
              sceneCallbacksRef.current?.onChainBlockedPinTapped?.(pinId, partnerId, reason),
            onChainDoublePulled: (pId: string, partnerId: string, bonus: number) =>
              sceneCallbacksRef.current?.onChainDoublePulled?.(pId, partnerId, bonus),
            onIdleHintChanged: (
              active: boolean,
              movableIds: string[],
              recId: string | null
            ) => sceneCallbacksRef.current?.onIdleHintChanged?.(active, movableIds, recId),
          },
        });
      });
    },
    []
  );

  const loadLevel = useCallback(
    (level: LevelConfig, boostersOverride?: PreLevelBoosterLoadout) => {
      const activeBoosters = boostersOverride ?? preLevelBoosters;
      victoryTriggeredRef.current = false;
      peakRackRef.current = 0;
      revivesUsedRef.current = 0;
      prevUnboxingStageRef.current = 0;
      setPeakRackUsedThisRun(0);
      setRevivesUsedThisRun(0);
      setLevelStartTime(Date.now());
      setComboState(createInitialComboFeverState());
      setFreeUndosRemaining(1);
      setCurrentLevel(level);
      const nextQueue = createInitialQueueState(level.toolboxColors, activeBoosters);
      setQueueState(nextQueue);
      setMatchPulseKey(0);
      setLastMatchedColor(null);
      setModalType('none');
      setShowLevelSelect(false);
      setShowWorkshop(false);
      setInspectedHeirloomId(null);
      setExplodePeek(false);
      setGameState('playing');
      setIslandBanner(
        level.isDaily
          ? `Daily Dispatch · ${level.dailyDateKey || todayDateKey}`
          : `Parcel #${level.id} · ${TACTILE_THEMES[themeId].shortLabel}`
      );

      const initialColors: PinColor[] = [];
      if (nextQueue.activeToolbox?.color) initialColors.push(nextQueue.activeToolbox.color);
      if (nextQueue.secondaryToolbox?.color) initialColors.push(nextQueue.secondaryToolbox.color);

      const existingScene = phaserGameRef.current?.scene.getScene(
        'ScrewJamScene'
      ) as ScrewJamScene | undefined;
      if (existingScene) {
        existingScene.scene.restart({
          levelConfig: level,
          xrayMode,
          themeId,
          finialSkinId,
          spatialTiltEnabled,
          idleHintDelayMs: activePerks.idleHintDelayMs,
          activeToolboxColors: initialColors,
          callbacks: {
            onPinTapped: (pinId: string, color: PinColor) =>
              sceneCallbacksRef.current?.onPinTapped(pinId, color),
            onOccludedPinTapped: (pinId: string, color: PinColor, ratio: number) =>
              sceneCallbacksRef.current?.onOccludedPinTapped(pinId, color, ratio),
            onPlateCleared: (plateId: string) =>
              sceneCallbacksRef.current?.onPlateCleared(plateId),
            onLevelComplete: () => sceneCallbacksRef.current?.onLevelComplete(),
            onTelemetryChange: (t: SceneTelemetry) =>
              sceneCallbacksRef.current?.onTelemetryChange?.(t),
            onKeyUnlocked: (keyId: string, unlockedIds: string[], bonus: number) =>
              sceneCallbacksRef.current?.onKeyUnlocked?.(keyId, unlockedIds, bonus),
            onPadlockedPinTapped: (pinId: string, keyId: string) =>
              sceneCallbacksRef.current?.onPadlockedPinTapped?.(pinId, keyId),
            onFrostedPinTapped: (pinId: string, rem: number) =>
              sceneCallbacksRef.current?.onFrostedPinTapped?.(pinId, rem),
            onFrostUpdated: (cracked: string[], shattered: string[], bonus: number) =>
              sceneCallbacksRef.current?.onFrostUpdated?.(cracked, shattered, bonus),
            onChainBlockedPinTapped: (pinId: string, partnerId: string, reason: string) =>
              sceneCallbacksRef.current?.onChainBlockedPinTapped?.(pinId, partnerId, reason),
            onChainDoublePulled: (pId: string, partnerId: string, bonus: number) =>
              sceneCallbacksRef.current?.onChainDoublePulled?.(pId, partnerId, bonus),
            onIdleHintChanged: (
              active: boolean,
              movableIds: string[],
              recId: string | null
            ) => sceneCallbacksRef.current?.onIdleHintChanged?.(active, movableIds, recId),
          },
        });
      } else {
        initPhaserGame(
          level,
          xrayMode,
          themeId,
          spatialTiltEnabled,
          finialSkinId,
          activePerks.idleHintDelayMs
        );
      }
    },
    [
      activePerks.idleHintDelayMs,
      finialSkinId,
      initPhaserGame,
      preLevelBoosters,
      spatialTiltEnabled,
      themeId,
      todayDateKey,
      xrayMode,
    ]
  );

  const bootParamsRef = useRef({
    level: currentLevel,
    themeId,
    spatialTiltEnabled,
    finialSkinId,
    idleHintDelayMs: activePerks.idleHintDelayMs,
  });

  useEffect(() => {
    const boot = bootParamsRef.current;
    initPhaserGame(
      boot.level,
      false,
      boot.themeId,
      boot.spatialTiltEnabled,
      boot.finialSkinId,
      boot.idleHintDelayMs
    );
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [initPhaserGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (
        (e.key === 'Escape' || e.key.toLowerCase() === 'p') &&
        modalType === 'none' &&
        !showWorkshop &&
        !showLevelSelect
      ) {
        setGameState((prev) => {
          if (prev === 'playing') return 'paused';
          if (prev === 'paused') return 'playing';
          return prev;
        });
      } else if (e.key.toLowerCase() === 'x' && gameState === 'playing') {
        setXrayMode((prev) => {
          const next = !prev;
          const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
            | ScrewJamScene
            | undefined;
          scene?.setXrayMode(next);
          setIslandBanner(next ? 'Backlight: ON' : 'Backlight: OFF');
          return next;
        });
      } else if (e.key.toLowerCase() === 'e' && gameState === 'playing') {
        setExplodePeek((prev) => {
          const next = !prev;
          const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
            | ScrewJamScene
            | undefined;
          scene?.setExplodePeek(next);
          setIslandBanner(next ? 'Candle Fan: L0–L3' : 'Candle Fan: Normal');
          return next;
        });
      } else if (e.key.toLowerCase() === 'g' && gameState === 'playing') {
        const dirs: GravityNudgeDirection[] = ['right', 'left', 'up'];
        setNudgeStep((step) => {
          const dir = dirs[step % dirs.length];
          const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
            | ScrewJamScene
            | undefined;
          const res = scene?.triggerGravityNudge(dir);
          setIslandBanner(
            res && res.nudgedPlates > 0
              ? `Shake ${dir.toUpperCase()} · ${res.nudgedPlates} Ribbons`
              : `Desk Shake (${dir.toUpperCase()})`
          );
          return step + 1;
        });
      } else if (e.key.toLowerCase() === 's' && gameState === 'playing') {
        setQueueState((prev) => {
          if (prev.swapUsed || prev.toolboxQueue.length === 0) return prev;
          const swapped = swapActiveWithNextToolbox(prev);
          soundManager.playToolboxSwap();
          haptics.plateRelease();
          setMatchPulseKey((k) => k + 1);
          setIslandBanner('Swapped Active <-> Next Bobbin');
          if (swapped.status === 'victory') {
            triggerVictoryOnce();
          }
          return swapped;
        });
      } else if (e.key.toLowerCase() === 'w' && gameState === 'playing') {
        setQueueState((prev) => {
          if (!prev.moltenWildcardReady) return prev;
          const next = triggerMoltenWildcard(prev);
          soundManager.playMoltenWildcard();
          haptics.boxCompleted();
          setBolts((b) => b + 15);
          setMatchPulseKey((k) => k + 1);
          setIslandBanner('Golden Scissors! +15');
          if (next.status === 'victory') {
            triggerVictoryOnce();
          }
          return next;
        });
      } else if (e.key.toLowerCase() === 'z' && gameState === 'playing') {
        handleUndoLastRackPin();
      } else if (e.key.toLowerCase() === 'r' && gameState === 'playing') {
        loadLevel(currentLevel);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLevel, gameState, loadLevel, modalType, showLevelSelect, showWorkshop, triggerVictoryOnce, queueState, freeUndosRemaining, bolts]);

  const handleSelectTheme = (nextTheme: TactileThemeId) => {
    setThemeId(nextTheme);
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    scene?.setTheme(nextTheme);
    setArtisanLine(
      `${STORY_CHAPTERS[nextTheme].artisanName}: "${STORY_CHAPTERS[nextTheme].chapterTitle} awaits unboxing!"`
    );
    setIslandBanner(`Desk: ${TACTILE_THEMES[nextTheme].shortLabel}`);
  };

  const handleAdvanceStoryStage = () => {
    const res = advanceStoryChapterStep(storyProgress, themeId, bolts);
    if (!res.advanced) return;
    setStoryProgress(res.updatedProgress);
    setBolts(res.nextBolts);
    setArtisanLine(getArtisanCompanionLine(themeId, 'story_restored'));
    if (res.masterpieceJustCompleted) {
      setIslandBanner(`Heirloom Restored! +${res.bonusBoltsAwarded}`);
    } else {
      setIslandBanner(`Curio Stage ${res.newStage}/3 Restored!`);
    }
  };

  const handleSelectFinialSkin = (nextSkin: FinialSkinId) => {
    setFinialSkinId(nextSkin);
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    scene?.setFinialSkin(nextSkin);
    setIslandBanner(`Stamp: ${FINIAL_SKINS[nextSkin].shortLabel}`);
  };

  const handleClaimScrewChest = () => {
    setScrewChestsClaimed((c) => c + 1);
    setBolts((b) => b + SCREW_CHEST_REWARD_BOLTS);
    setIslandBanner(`Wax Chest +${SCREW_CHEST_REWARD_BOLTS}!`);
  };

  const handleCycleTheme = () => {
    haptics.lightTap();
    const idx = THEME_CYCLE.indexOf(themeId);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    handleSelectTheme(next);
  };

  const handleSelectHapticIntensity = (next: HapticIntensity) => {
    haptics.setIntensity(next);
    setHapticIntensity(next);
    const spec = HAPTIC_INTENSITY_SPECS[next];
    setIslandBanner(`Haptics: ${spec.shortLabel} (${spec.percentLabel})`);
  };

  const handleCycleHapticIntensity = () => {
    const next = haptics.cycleIntensity();
    setHapticIntensity(next);
  };

  const handleToggleBooster = (key: keyof PreLevelBoosterLoadout) => {
    setPreLevelBoosters((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setQueueState(createInitialQueueState(currentLevel.toolboxColors, updated));
      return updated;
    });
  };

  const handleToggleXray = () => {
    haptics.lightTap();
    setXrayMode((prev) => {
      const next = !prev;
      const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
        | ScrewJamScene
        | undefined;
      scene?.setXrayMode(next);
      setIslandBanner(next ? 'Backlight: ON' : 'Backlight: OFF');
      return next;
    });
  };

  const handleToggleExplodePeek = () => {
    haptics.lightTap();
    setExplodePeek((prev) => {
      const next = !prev;
      const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
        | ScrewJamScene
        | undefined;
      scene?.setExplodePeek(next);
      setIslandBanner(next ? 'Candle Fan: L0–L3' : 'Candle Fan: Normal');
      return next;
    });
  };

  const handleGravityNudge = () => {
    if (gameState !== 'playing') return;
    const dirs: GravityNudgeDirection[] = ['right', 'left', 'up'];
    const dir = dirs[nudgeStep % dirs.length];
    setNudgeStep((s) => s + 1);
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    const res = scene?.triggerGravityNudge(dir);
    if (res && res.nudgedPlates > 0) {
      setIslandBanner(`Shake ${dir.toUpperCase()} · ${res.nudgedPlates} Ribbons`);
    } else {
      setIslandBanner(`Desk Shake (${dir.toUpperCase()})`);
    }
  };

  const handleSwapToolbox = () => {
    if (gameState !== 'playing') return;
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    scene?.resetIdleTimer();
    setQueueState((prev) => {
      if (prev.swapUsed || prev.toolboxQueue.length === 0) return prev;
      const next = swapActiveWithNextToolbox(prev);
      soundManager.playToolboxSwap();
      haptics.plateRelease();
      setMatchPulseKey((k) => k + 1);
      setIslandBanner('Swapped Active <-> Next Bobbin');
      if (next.status === 'victory') {
        triggerVictoryOnce();
      }
      return next;
    });
  };

  const handleTriggerMoltenWildcard = () => {
    if (gameState !== 'playing') return;
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    scene?.resetIdleTimer();
    setQueueState((prev) => {
      if (!prev.moltenWildcardReady) return prev;
      const next = triggerMoltenWildcard(prev);
      soundManager.playMoltenWildcard();
      haptics.boxCompleted();
      setBolts((b) => b + 15);
      setMatchPulseKey((k) => k + 1);
      setIslandBanner('Golden Scissors! +15');
      if (next.status === 'victory') {
        triggerVictoryOnce();
      }
      return next;
    });
  };

  const handleMagnetBooster = () => {
    if (bolts < 25 || gameState !== 'playing') return;
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    scene?.resetIdleTimer();
    const preferredColor = queueState.activeToolbox?.color;
    if (scene?.triggerMagnetPull(preferredColor)) {
      setBolts((b) => Math.max(0, b - 25));
      setIslandBanner('Silk Pull -25');
    }
  };

  const handleDrainBufferBooster = () => {
    const clearCost = activePerks.rackClearCost;
    if (bolts < clearCost || queueState.holdingBuffer.length === 0) return;
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    scene?.resetIdleTimer();
    haptics.plateRelease();
    soundManager.playWorkshopUpgrade();
    setBolts((b) => (b - clearCost >= 0 ? b - clearCost : 0));
    setQueueState((prev) => clearBufferSlotsForRevive(prev, 2, 0));
    setIslandBanner(`Rack Cleared -2 Pegs (-${clearCost})`);
  };

  const canUndoRackPin =
    gameState === 'playing' &&
    queueState.holdingBuffer.length > 0 &&
    (freeUndosRemaining > 0 || bolts >= UNDO_COST_CROWNS);

  const handleUndoLastRackPin = () => {
    if (gameState !== 'playing' || queueState.holdingBuffer.length === 0) return;
    const isFree = freeUndosRemaining > 0;
    if (!isFree && bolts < UNDO_COST_CROWNS) return;

    const undoRes = undoBufferedPinFromQueue(queueState);
    if (!undoRes.undone || !undoRes.restoredPinId) return;

    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    const restored = scene?.restoreBufferedPin(undoRes.restoredPinId);
    if (!restored) return;

    soundManager.playWaxRestampUndo();
    haptics.lightTap();
    if (isFree) {
      setFreeUndosRemaining((c) => Math.max(0, c - 1));
    } else {
      setBolts((b) => Math.max(0, b - UNDO_COST_CROWNS));
    }
    setQueueState(undoRes.nextQueueState);
    setIslandBanner(isFree ? 'Wax Re-Stamped (Free Undo)' : `Wax Re-Stamped (-${UNDO_COST_CROWNS}c)`);
  };

  const handleStartDailyDispatch = () => {
    loadLevel(dailyLevel);
  };

  const handleClaimCommission = (id: CommissionId) => {
    const target = evaluatedCommissions.find((c) => c.id === id);
    if (!target || !target.claimable) return;
    soundManager.playCommissionClaim();
    haptics.boxCompleted();
    setClaimedCommissionIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setBolts((b) => b + target.rewardCrowns);
    setIslandBanner(`Commission +${target.rewardCrowns} Crowns!`);
  };

  const handleResetProgress = () => {
    clearArchivistState();
    setBolts(130);
    setClearedLevelIds([]);
    setDailyCompletedDates([]);
    setLevelStarsById({});
    setCommissionStats({
      ribbonsUnsealed: 0,
      waxSealsBroken: 0,
      threeStarParcels: 0,
      silkRushTriggers: 0,
    });
    setClaimedCommissionIds([]);
    setWinStreak(0);
    setThemeId('stained_glass');
    setFinialSkinId('royal_brass');
    setHapticIntensity('medium');
    haptics.setIntensity('medium');
    soundManager.setMuted(false);
    setIsAudioMuted(false);
    setAdsRemovedPermanently(false);
    setPreLevelBoosters({ extraBufferHoles: false, dualToolbox: false });
    setStations(INITIAL_STATIONS);
    setStoryProgress(createInitialStoryProgress());
    setTotalScrewsCollected(0);
    setScrewChestsClaimed(0);
    setShowWorkshop(false);
    setIslandBanner('Archivist Ledger Reset');
    loadLevel(LEVELS[0], { extraBufferHoles: false, dualToolbox: false });
  };

  const handleStartGame = () => {
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    scene?.resetIdleTimer();
    peakRackRef.current = 0;
    revivesUsedRef.current = 0;
    prevUnboxingStageRef.current = 0;
    setPeakRackUsedThisRun(0);
    setRevivesUsedThisRun(0);
    setLevelStartTime(Date.now());
    setFreeUndosRemaining(1);
    setQueueState(createInitialQueueState(currentLevel.toolboxColors, preLevelBoosters));
    setGameState('playing');
  };

  const handleRestartLevel = () => {
    haptics.lightTap();
    loadLevel(currentLevel);
  };

  const handleNextLevel = () => {
    const idx = availableLevels.findIndex((l) => l.id === currentLevel.id);
    if (idx >= 0 && idx + 1 < availableLevels.length) {
      loadLevel(availableLevels[idx + 1]);
    } else {
      setModalType('none');
      setWorkshopInitialTab('atelier');
      setShowWorkshop(true);
    }
  };

  const handleRevive = (expandBufferSlots: boolean) => {
    revivesUsedRef.current += 1;
    setRevivesUsedThisRun(revivesUsedRef.current);
    setBolts((b) => Math.max(0, b - 30));
    setQueueState((prev) => clearBufferSlotsForRevive(prev, 2, expandBufferSlots ? 2 : 0));
    setModalType('none');
    setGameState('playing');
    setIslandBanner('7-Peg Brass Rack Unlocked!');
  };

  const handlePurchaseStarterCoinPack = () => {
    setBolts((b) => b + 500);
    setAdsRemovedPermanently(true);
    setPreLevelBoosters({ extraBufferHoles: true, dualToolbox: true });
    setIslandBanner('$1.99 Pack · Ads Removed!');
  };

  const handleBuyStarterPackAndRevive = () => {
    revivesUsedRef.current += 1;
    setRevivesUsedThisRun(revivesUsedRef.current);
    setBolts((b) => b + 500);
    setAdsRemovedPermanently(true);
    setQueueState((prev) => clearBufferSlotsForRevive(prev, 3, 2));
    setModalType('none');
    setGameState('playing');
    setIslandBanner('VIP Ad-Free + 7-Peg Rack');
  };

  const handleUpgradeStation = (stationId: string) => {
    const target = stations.find((s) => s.id === stationId);
    if (!target || target.level >= target.maxLevel || bolts < target.cost) {
      haptics.occludedBlocked();
      soundManager.playBlockedThud();
      return;
    }
    soundManager.playWorkshopUpgrade();
    haptics.boxCompleted();
    setBolts((b) => b - target.cost);
    setStations((prev) =>
      prev.map((s) =>
        s.id === stationId
          ? { ...s, level: s.level + 1, cost: Math.round(s.cost * 1.45) }
          : s
      )
    );
  };

  const handleLaunchLevel10 = () => {
    const lvl10 = availableLevels.find((l) => l.id === 10) || availableLevels[0];
    loadLevel(lvl10);
  };

  const remainingPlatesCount = telemetry
    ? telemetry.totalPlates - telemetry.clearedPlates
    : currentLevel.plates.length;

  return (
    <main className="h-[100dvh] w-full bg-[radial-gradient(circle_at_50%_18%,#2E1D16_0%,#160F0C_62%,#0B0705_100%)] text-[#F8F3EC] flex items-center justify-center p-0 sm:p-4 overflow-hidden font-sans select-none">
      {/* Desktop Balanced 2-Column Archivist Desk Split | Mobile Full-Bleed Portrait */}
      <div className="w-full h-full flex items-center justify-center lg:gap-6 max-w-[1040px]">
        {/* Primary Interactive Walnut Parcel Desk Frame */}
        <div className="relative w-full h-full sm:w-[412px] sm:h-[868px] sm:max-h-[96dvh] bg-[#18100D] sm:rounded-[40px] sm:border-[6px] sm:border-[#4A3022] sm:shadow-[0_24px_70px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(253,230,138,0.2)] flex flex-col justify-between overflow-hidden shrink-0">
          {/* Compact Top Courier Status Bar */}
          <div className="w-full pt-[max(0.3rem,env(safe-area-inset-top))] px-5 pb-1 bg-[#120B09] flex items-center justify-between text-[11px] font-semibold text-[#DECBB9] shrink-0">
            <span className="font-mono tabular-nums tracking-tight w-12">9:41</span>

            <div className="h-5 px-3 rounded-full bg-[#241713] border border-[#4D3224] flex items-center justify-center shadow-inner">
              <span className="text-[10px] font-mono text-amber-300 truncate max-w-[160px]">
                {islandBanner}
              </span>
            </div>

            <div className="w-12 flex items-center justify-end gap-1.5 text-[10px] font-mono text-[#CDBAA8]">
              <span>iOS</span>
              <div className="w-4 h-2.5 rounded-xs border border-[#8C684A] p-0.5 flex items-center">
                <div className="w-full h-full bg-amber-400 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Top HUD: Header + Active Velvet Bobbin + 5/7-Peg Brass Rack */}
          <GameHUD
            queueState={queueState}
            currentLevel={currentLevel}
            bolts={bolts}
            winStreak={winStreak}
            comboState={comboState}
            idleHintActive={Boolean(telemetry?.idleHintActive)}
            movablePinsCount={telemetry?.movablePins ?? 0}
            themeId={themeId}
            hapticIntensity={hapticIntensity}
            onCycleHapticIntensity={handleCycleHapticIntensity}
            onCycleTheme={handleCycleTheme}
            onSwapToolbox={handleSwapToolbox}
            onTriggerMoltenWildcard={handleTriggerMoltenWildcard}
            onRestart={handleRestartLevel}
            onPause={() => setGameState((s) => (s === 'playing' ? 'paused' : 'playing'))}
            onOpenWorkshop={() => {
              setWorkshopInitialTab('atelier');
              setShowWorkshop(true);
            }}
            onOpenLevelSelect={() => setShowLevelSelect(true)}
            onOpenCoinStore={() => {
              setWorkshopInitialTab('monetization');
              setShowWorkshop(true);
            }}
            canUndo={canUndoRackPin}
            freeUndosRemaining={freeUndosRemaining}
            undoCost={UNDO_COST_CROWNS}
            onUndoLastRackPin={handleUndoLastRackPin}
            onMuteChange={(muted) => setIsAudioMuted(muted)}
          />

          {/* Always-Visible Live Centerpiece Heirloom Unboxing Stage */}
          <LiveHeirloomStage
            unboxingState={liveUnboxing}
            matchPulseKey={matchPulseKey}
            artisanLine={artisanLine}
            lastMatchedColor={lastMatchedColor}
            onInspectCurio={() => setInspectedHeirloomId(liveUnboxing.heirloom.id)}
            compact
          />

          {/* Occlusion / Hazard Notice */}
          {occlusionToast && (
            <div
              role="status"
              className="absolute top-[258px] left-3 right-3 z-30 bg-[#3B1018] border border-rose-400/80 rounded-xl px-3 py-2 text-rose-100 text-xs text-center font-medium shadow-lg pointer-events-none"
            >
              {occlusionToast}
            </div>
          )}

          {/* Phaser 3 + Matter.js Interactive 4-Layer Satin Ribbon Board */}
          <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden min-h-0">
            {explodePeek && (
              <div
                role="status"
                className="absolute top-1.5 inset-x-4 z-20 bg-[#261813]/95 border border-amber-400/75 rounded-xl px-3 py-1 flex items-center justify-between text-[10px] font-mono text-amber-200 shadow-lg pointer-events-none"
              >
                <span className="font-bold text-amber-300">CANDLE FAN [E]</span>
                <span>L0..L3 FANNED · TAP SEAL</span>
              </div>
            )}
            <div
              ref={phaserContainerRef}
              className="w-full h-full flex items-center justify-center"
              data-testid="phaser-board"
              data-idle-hint={telemetry?.idleHintActive ? 'active' : 'waiting'}
              data-movable-pins={telemetry?.movablePins ?? 0}
            />
          </div>

          {/* Bottom Tactile Archivist Tool Bar */}
          <footer className="w-full px-2.5 pt-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] bg-gradient-to-b from-[#231713] to-[#140D0B] border-t-[2px] border-[#432B20] flex flex-col gap-1.5 shrink-0">
            <div className="grid grid-cols-5 gap-1.5">
              <button
                onClick={handleGravityNudge}
                className={`py-1.5 px-1 rounded-2xl text-[10px] font-game-display font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                  telemetry && telemetry.pendulumPlates > 0
                    ? 'btn-3d-amber text-[#1C110C]'
                    : 'btn-3d-slate text-[#F8F3EC]'
                }`}
                aria-label="Shake Parcel"
                title="Shake Parcel [G]: Swing 1-seal ribbons away from hidden clasps"
              >
                <Wind
                  className={`w-3.5 h-3.5 shrink-0 ${
                    telemetry && telemetry.pendulumPlates > 0 ? 'text-[#1C110C]' : 'text-amber-400'
                  }`}
                />
                <span className="whitespace-nowrap">
                  {telemetry && telemetry.pendulumPlates > 0
                    ? `Shake (${telemetry.pendulumPlates})`
                    : 'Shake [G]'}
                </span>
              </button>

              <button
                onClick={handleToggleExplodePeek}
                className={`py-1.5 px-1 rounded-2xl text-[10px] font-game-display font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                  explodePeek
                    ? 'btn-3d-blue text-white'
                    : 'btn-3d-slate text-[#F8F3EC]'
                }`}
                aria-pressed={explodePeek}
                aria-label="Candle Layer Fan"
                title="Candle Fan [E]: Separate L0–L3 ribbon layers outward"
              >
                <Flame className={`w-3.5 h-3.5 shrink-0 ${explodePeek ? 'text-amber-200' : 'text-amber-400'}`} />
                <span className="whitespace-nowrap">Candle [E]</span>
              </button>

              <button
                onClick={handleToggleXray}
                className={`py-1.5 px-1 rounded-2xl text-[10px] font-game-display font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                  xrayMode
                    ? 'btn-3d-blue text-white'
                    : 'btn-3d-slate text-[#F8F3EC]'
                }`}
                aria-pressed={xrayMode}
                aria-label="Parchment Backlight"
                title="Backlight [X]: Illuminate ribbons to inspect buried wax seals"
              >
                <Eye className={`w-3.5 h-3.5 shrink-0 ${xrayMode ? 'text-amber-200' : 'text-amber-300'}`} />
                <span className="whitespace-nowrap">Light [X]</span>
              </button>

              <button
                onClick={handleMagnetBooster}
                disabled={bolts < 25}
                className={`py-1.5 px-1 rounded-2xl text-[10px] font-game-display font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                  bolts >= 25
                    ? 'btn-3d-slate text-amber-300'
                    : 'bg-[#1A110E] border-2 border-[#312018] text-[#6E594C] cursor-not-allowed'
                }`}
                aria-label="Silk Pull 25 Crowns"
              >
                <Magnet className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Pull 25</span>
              </button>

              <button
                onClick={handleDrainBufferBooster}
                disabled={bolts < activePerks.rackClearCost || queueState.holdingBuffer.length === 0}
                className={`py-1.5 px-1 rounded-2xl text-[10px] font-game-display font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                  bolts >= activePerks.rackClearCost && queueState.holdingBuffer.length > 0
                    ? 'btn-3d-slate text-emerald-300'
                    : 'bg-[#1A110E] border-2 border-[#312018] text-[#6E594C] cursor-not-allowed'
                }`}
                aria-label={`Clear 2 Rack Pegs ${activePerks.rackClearCost} Crowns`}
              >
                <Scissors className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Clear {activePerks.rackClearCost}</span>
              </button>
            </div>

            <div className="w-28 h-1 bg-[#4F3527] rounded-full mx-auto" />
          </footer>

          {/* Title Screen Overlay */}
          {gameState === 'title' && (
            <TitleScreen
              onStartGame={handleStartGame}
              onOpenWorkshop={() => {
                setWorkshopInitialTab('monetization');
                setShowWorkshop(true);
              }}
              onOpenLevelSelect={() => setShowLevelSelect(true)}
              bolts={bolts}
              workshopProgress={workshopProgress}
              themeId={themeId}
              onSelectTheme={handleSelectTheme}
              boosters={preLevelBoosters}
              onToggleBooster={handleToggleBooster}
              hapticIntensity={hapticIntensity}
              onSelectHapticIntensity={handleSelectHapticIntensity}
              adsRemovedPermanently={adsRemovedPermanently}
              dailyDateKey={todayDateKey}
              dailyCompletedToday={dailyCompletedToday}
              dailyStreak={dailyStreak}
              onStartDailyDispatch={handleStartDailyDispatch}
              archivistRank={archivistRank}
              totalStars={totalStars}
              claimableCommissionsCount={claimableCommissionsCount}
            />
          )}

          {/* Pause Modal */}
          {gameState === 'paused' && (
            <div
              className="absolute inset-x-0 top-8 bottom-0 z-50 bg-[#120B09]/94 flex items-center justify-center p-4 select-none"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pause-modal-title"
            >
              <div className="w-full max-w-xs bg-gradient-to-b from-[#2B1C17] to-[#1A110E] border-[2.5px] border-[#613E2B] rounded-3xl p-5 shadow-[0_8px_0_#0B0705,0_18px_36px_rgba(0,0,0,0.8)] flex flex-col gap-3 text-center">
                <h2
                  id="pause-modal-title"
                  className="font-game-display text-xl font-bold text-[#FDF6EC]"
                >
                  PARCEL PAUSED
                </h2>
                <p className="text-xs text-[#DECBB9] font-medium">
                  {currentLevel.name} · {queueState.completedBoxes}/{queueState.totalBoxes} Bobbins Wound
                </p>
                <button
                  onClick={() => setGameState('playing')}
                  className="btn-3d-blue w-full py-2.5 px-4 rounded-2xl text-white font-game-display font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>Resume Unboxing</span>
                </button>
                <button
                  onClick={handleRestartLevel}
                  className="btn-3d-slate w-full py-2.5 px-4 rounded-2xl text-[#FDF6EC] font-game-display font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-Tie Parcel</span>
                </button>
                <button
                  onClick={() => setGameState('title')}
                  className="w-full py-2 px-4 rounded-xl text-[#CDBAA8] hover:text-white text-xs font-game-display font-bold"
                >
                  Return to Title Desk
                </button>
              </div>
            </div>
          )}

          {/* One Ribbon Short Rescue Modal */}
          {modalType === 'almost_won' && (
            <AlmostWonModal
              onRevive={handleRevive}
              onBuyStarterPackAndRevive={handleBuyStarterPackAndRevive}
              onRestart={() => {
                setWinStreak(0);
                handleRestartLevel();
              }}
              onOpenWorkshop={() => {
                setModalType('none');
                setWorkshopInitialTab('monetization');
                setShowWorkshop(true);
              }}
              bolts={bolts}
              winStreak={winStreak}
              adsRemovedPermanently={adsRemovedPermanently}
              remainingPlates={remainingPlatesCount}
              completedBoxes={queueState.completedBoxes}
              totalBoxes={queueState.totalBoxes}
            />
          )}

          {/* Interactive Grand Wax-Seal Break Ceremony */}
          {modalType === 'seal_ceremony' && (
            <WaxSealCeremonyModal
              heirloom={liveUnboxing.heirloom}
              parcelName={currentLevel.name}
              isDaily={currentLevel.isDaily}
              onComplete={() => {
                setIslandBanner('Heirloom Unboxed!');
                setModalType('victory');
              }}
            />
          )}

          {/* Grand Heirloom Unboxing Victory Modal */}
          {modalType === 'victory' && (
            <VictoryModal
              currentLevel={currentLevel}
              bolts={bolts}
              clearedLevelIds={clearedLevelIds}
              rewardBolts={currentLevel.rewardBolts}
              clearTimeSeconds={clearTimeSeconds}
              themeId={themeId}
              totalScrewsCollected={totalScrewsCollected}
              screwChestsClaimed={screwChestsClaimed}
              onClaimScrewChest={handleClaimScrewChest}
              finialSkinId={finialSkinId}
              onSelectFinialSkin={handleSelectFinialSkin}
              storyStage={storyProgress.stageByTheme[themeId]}
              onAdvanceStoryStage={handleAdvanceStoryStage}
              onNextLevel={handleNextLevel}
              onRestart={handleRestartLevel}
              onOpenWorkshop={() => {
                setModalType('none');
                setWorkshopInitialTab('atelier');
                setShowWorkshop(true);
              }}
              onOpenCoinStore={() => {
                setModalType('none');
                setWorkshopInitialTab('monetization');
                setShowWorkshop(true);
              }}
              onAddBonusBolts={(extra) => setBolts((b) => b + extra)}
              onInspectCurio={(id) => setInspectedHeirloomId(id)}
              parcelMastery={lastParcelMastery}
              archivistRank={archivistRank}
              peakRackUsed={peakRackUsedThisRun}
              maxRackSlots={queueState.maxBufferSlots}
              dailyStreak={dailyStreak}
              hasNextLevel={
                !currentLevel.isDaily &&
                availableLevels.findIndex((l) => l.id === currentLevel.id) <
                  availableLevels.length - 1
              }
            />
          )}

          {/* Royal Curio Gallery & Atelier Modal */}
          {showWorkshop && (
            <WorkshopModal
              bolts={bolts}
              stations={stations}
              onUpgradeStation={handleUpgradeStation}
              onLaunchLevel10={handleLaunchLevel10}
              otaSynced={otaSynced}
              capgoState={capgoState}
              onSyncCapgoOta={() => {
                setOtaSynced(true);
                setIslandBanner('Capgo OTA v1.3.4');
              }}
              themeId={themeId}
              onSelectTheme={handleSelectTheme}
              finialSkinId={finialSkinId}
              onSelectFinialSkin={handleSelectFinialSkin}
              storyStage={storyProgress.stageByTheme[themeId]}
              onAdvanceStoryStage={handleAdvanceStoryStage}
              boosters={preLevelBoosters}
              onToggleBooster={handleToggleBooster}
              adsRemovedPermanently={adsRemovedPermanently}
              onPurchaseStarterCoinPack={handlePurchaseStarterCoinPack}
              initialTab={workshopInitialTab}
              activePerks={activePerks}
              activeHeirloomId={liveUnboxing.heirloom.id}
              onInspectCurio={(id) => {
                setShowWorkshop(false);
                setInspectedHeirloomId(id);
              }}
              onResetProgress={handleResetProgress}
              onClose={() => setShowWorkshop(false)}
            />
          )}

          {/* Royal Dispatch Map Modal */}
          {showLevelSelect && (
            <LevelSelectModal
              levels={availableLevels}
              currentLevelId={currentLevel.id}
              clearedLevelIds={clearedLevelIds}
              levelStarsById={levelStarsById}
              commissions={evaluatedCommissions}
              onClaimCommission={handleClaimCommission}
              hapticIntensity={hapticIntensity}
              onSelectHapticIntensity={handleSelectHapticIntensity}
              onSelectLevel={(lvl) => loadLevel(lvl)}
              dailyLevel={dailyLevel}
              dailyCompletedToday={dailyCompletedToday}
              dailyStreak={dailyStreak}
              onSelectDailyDispatch={handleStartDailyDispatch}
              onClose={() => setShowLevelSelect(false)}
            />
          )}

          {/* Interactive Curio Inspection Pedestal Modal */}
          {inspectedHeirloomId && (
            <CurioPedestalModal
              heirloomId={inspectedHeirloomId}
              unlockedCount={unlockedHeirloomCount}
              onSelectHeirloom={(id) => setInspectedHeirloomId(id)}
              onClose={() => setInspectedHeirloomId(null)}
            />
          )}
        </div>

        {/* Desktop Balanced Right-Column Archivist Desk Ledger */}
        <DesktopCurioLedger
          currentLevel={currentLevel}
          unboxingState={liveUnboxing}
          clearedLevelIds={clearedLevelIds}
          themeId={themeId}
          bolts={bolts}
          winStreak={winStreak}
          dailyStreak={dailyStreak}
          archivistRank={archivistRank}
          totalStars={totalStars}
          commissions={evaluatedCommissions}
          onClaimCommission={handleClaimCommission}
          onInspectCurio={(id) => setInspectedHeirloomId(id)}
          onOpenWorkshop={() => {
            setWorkshopInitialTab('atelier');
            setShowWorkshop(true);
          }}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
        />
      </div>
    </main>
  );
}
