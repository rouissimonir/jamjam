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
} from './game/rules.ts';
import { LEVELS, CAPGO_OTA_BONUS_LEVELS, LevelConfig } from './game/levels.ts';
import { GameHUD } from './components/GameHUD.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import { AlmostWonModal } from './components/AlmostWonModal.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { WorkshopModal, RenovationStation } from './components/WorkshopModal.tsx';
import { LevelSelectModal } from './components/LevelSelectModal.tsx';
import { soundManager } from './game/audio.ts';
import { haptics } from './game/haptics.ts';
import { capacitorBridge, CapgoBundleState } from './game/capacitorBridge.ts';
import { Eye, Magnet, Wrench, Play, RotateCcw, Wind, Layers } from 'lucide-react';

type AppState = 'title' | 'playing' | 'paused' | 'gameover';

const INITIAL_STATIONS: RenovationStation[] = [
  {
    id: 'workbench',
    name: 'Cast-Iron Atelier Workbench',
    category: 'Foundation',
    level: 2,
    maxLevel: 5,
    cost: 40,
    description: 'Solid oiled teak top with inlaid brass measurement rule and anti-vibration damping.',
    perk: '+15% Brass Bolt rewards on level clears',
  },
  {
    id: 'drill',
    name: 'Precision Column Drill Press',
    category: 'Tooling',
    level: 1,
    maxLevel: 5,
    cost: 50,
    description: 'High-torque geared spindle for chamfering stained-glass & acrylic holes with sub-mm precision.',
    perk: 'Precision machined clasp bevels',
  },
  {
    id: 'anodizing',
    name: 'Stained-Glass & Anodizing Kiln',
    category: 'Finishing',
    level: 1,
    maxLevel: 5,
    cost: 60,
    description: 'Thermal crystal kiln and color bath creating vibrant ruby, sapphire, and sunlit amber panes.',
    perk: 'Unlocks 3rd-Gen Stained Glass & Yarn Themes',
  },
  {
    id: 'magnet',
    name: 'Magnetic Pin Extractor Rig',
    category: 'Emergency',
    level: 2,
    maxLevel: 5,
    cost: 75,
    description: 'Neodymium overhead gantry for extracting trapped pins when holding buffers near capacity.',
    perk: 'Fail Offer expands buffer to 7 slots + clears 2',
  },
  {
    id: 'blueprint',
    name: 'Architectural Blueprint Table',
    category: 'Design',
    level: 3,
    maxLevel: 5,
    cost: 100,
    description: 'Backlit drafting glass for inspecting complex 4-layer plate overlap trajectories.',
    perk: 'Unlocks X-Ray Layer Occlusion Loupe',
  },
];

const THEME_CYCLE: TactileThemeId[] = ['stained_glass', 'knit_yarn', 'retro_gadget'];

export default function App() {
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

  // Pillar A: 3rd-Generation Tactile Theme (Default: Stained Glass & Brass Clasps)
  const [themeId, setThemeId] = useState<TactileThemeId>('stained_glass');

  // Haptic Intensity ('off' | 'light' | 'medium' | 'heavy')
  const [hapticIntensity, setHapticIntensity] = useState<HapticIntensity>(() =>
    haptics.getIntensity()
  );

  // Pillar B: 2.5D Spatial Depth Tilt + Royal Match-style Pre-Level Boosters + Win Streak
  const [spatialTiltEnabled, setSpatialTiltEnabled] = useState<boolean>(true);
  const [preLevelBoosters, setPreLevelBoosters] = useState<PreLevelBoosterLoadout>({
    extraBufferHoles: false,
    dualToolbox: false,
  });
  const [winStreak, setWinStreak] = useState<number>(2);

  // Pillar C: "30% Revenue" Monetization + Mob Control Permanent Ad-Removal Rule
  const [adsRemovedPermanently, setAdsRemovedPermanently] = useState<boolean>(false);
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
    return [];
  });
  const [queueState, setQueueState] = useState<UnpackingQueueState>(() =>
    createInitialQueueState(LEVELS[0].toolboxColors)
  );
  const [bolts, setBolts] = useState<number>(130);
  const [stations, setStations] = useState<RenovationStation[]>(INITIAL_STATIONS);
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [explodePeek, setExplodePeek] = useState<boolean>(false);
  const [nudgeStep, setNudgeStep] = useState<number>(0);
  const [showWorkshop, setShowWorkshop] = useState<boolean>(false);
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'none' | 'almost_won' | 'victory'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('victory') === '1') {
        return 'victory';
      }
    }
    return 'none';
  });
  const [occlusionToast, setOcclusionToast] = useState<string | null>(null);
  const [islandBanner, setIslandBanner] = useState<string>('3rd-Gen · Stained Glass');
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
    return 47;
  });
  const [screwChestsClaimed, setScrewChestsClaimed] = useState<number>(0);
  const [finialSkinId, setFinialSkinId] = useState<FinialSkinId>('royal_brass');

  const phaserContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneCallbacksRef = useRef<SceneCallbacks | null>(null);
  const victoryTriggeredRef = useRef<boolean>(false);

  // Initialize Capacitor & Capgo CapacitorUpdater.notifyAppReady() + Haptics listener on boot
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

  // Sync document.body.dataset.state for ultra-mode compliance
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
    setClearedLevelIds((prev) =>
      prev.includes(currentLevel.id) ? prev : [...prev, currentLevel.id]
    );
    setWinStreak((s) => s + 1);
    const finialBonus = FINIAL_SKINS[finialSkinId]?.extraClearBolts || 0;
    setBolts((b) => b + currentLevel.rewardBolts + finialBonus);
    setIslandBanner('Haptics: Success');
    setGameState('gameover');
    setModalType('victory');
  }, [currentLevel.id, currentLevel.rewardBolts, finialSkinId, levelStartTime]);

  const handlePinTapped = useCallback(
    (pinId: string, color: PinColor) => {
      setTotalScrewsCollected((count) => count + 1);
      setComboState((prevCombo) => {
        const nextCombo = updateComboFeverOnTap(prevCombo, Date.now());
        soundManager.playPinUnscrew(nextCombo.pitchFactor);
        if (nextCombo.bonusBoltsEarned > 0) {
          setBolts((b) => b + nextCombo.bonusBoltsEarned);
          setIslandBanner(
            nextCombo.isFever
              ? `FEVER ${nextCombo.streakCount}x! +${nextCombo.bonusBoltsEarned}$`
              : `Combo ${nextCombo.streakCount}x +${nextCombo.bonusBoltsEarned}$`
          );
        } else {
          setIslandBanner('Haptics: ImpactMedium');
        }
        return nextCombo;
      });

      setQueueState((prev) => {
        const next = routeTappedPin(prev, pinId, color);
        const newlyChargedWildcard = !prev.moltenWildcardReady && next.moltenWildcardReady;

        if (next.lastAction === 'box_completed') {
          soundManager.playBoxCompleted();
          haptics.boxCompleted();
          setBolts((b) => b + 20);
          setIslandBanner(
            newlyChargedWildcard ? 'Molten Combo Ready!' : 'Toolbox Packed +20'
          );
        } else if (next.lastAction === 'matched_box') {
          soundManager.playDepositPin(true);
          if (newlyChargedWildcard) {
            soundManager.playMoltenWildcard();
            setIslandBanner('Molten Combo 3/3 Ready!');
          }
        } else if (next.lastAction === 'buffered') {
          soundManager.playDepositPin(false);
        }

        if (next.status === 'almost_won_fail') {
          setIslandBanner(`Buffer Full ${next.holdingBuffer.length}/${next.maxBufferSlots}`);
          setGameState('gameover');
          setModalType('almost_won');
        } else if (next.status === 'victory') {
          triggerVictoryOnce();
        }

        return next;
      });
    },
    [triggerVictoryOnce]
  );

  const handleOccludedPinTapped = useCallback(
    (_pinId: string, _color: PinColor, overlapRatio: number) => {
      const percent = Math.round(overlapRatio * 100);
      setIslandBanner(`Occluded ${percent}% (>25%)`);
      setOcclusionToast(
        `Blocked! Higher layer piece overlaps ${percent}% of clasp (>25% threshold)`
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
      setIslandBanner(`KEY Unlocked +${bonusBolts}$!`);
      setOcclusionToast(
        `Star-Keyhole Unlocked! ${unlockedPinIds.length} Padlock Clasp freed (+${bonusBolts} $)`
      );
      setTimeout(() => {
        setOcclusionToast(null);
      }, 2200);
    },
    []
  );

  const handlePadlockedPinTapped = useCallback(
    (_pinId: string, _blockingKeyPinId: string) => {
      setIslandBanner('Padlocked! Pull KEY');
      setOcclusionToast(
        'Padlocked Clasp! Extract the golden KEY pin on the board first to unlock.'
      );
      setTimeout(() => {
        setOcclusionToast(null);
      }, 2200);
    },
    []
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

  sceneCallbacksRef.current = {
    onPinTapped: handlePinTapped,
    onOccludedPinTapped: handleOccludedPinTapped,
    onPlateCleared: handlePlateCleared,
    onLevelComplete: handleLevelComplete,
    onTelemetryChange: setTelemetry,
    onKeyUnlocked: handleKeyUnlocked,
    onPadlockedPinTapped: handlePadlockedPinTapped,
  };

  const initPhaserGame = useCallback(
    (
      level: LevelConfig,
      initialXray: boolean,
      initialTheme: TactileThemeId,
      initialTilt: boolean
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
          finialSkinId: 'royal_brass',
          spatialTiltEnabled: initialTilt,
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
      setLevelStartTime(Date.now());
      setComboState(createInitialComboFeverState());
      setCurrentLevel(level);
      setQueueState(createInitialQueueState(level.toolboxColors, activeBoosters));
      setModalType('none');
      setShowLevelSelect(false);
      setShowWorkshop(false);
      setExplodePeek(false);
      setGameState('playing');
      setIslandBanner(`Lv.${level.id} · ${TACTILE_THEMES[themeId].shortLabel}`);

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
          },
        });
      } else {
        initPhaserGame(level, xrayMode, themeId, spatialTiltEnabled);
      }
    },
    [finialSkinId, initPhaserGame, preLevelBoosters, spatialTiltEnabled, themeId, xrayMode]
  );

  // Mount Phaser game once on startup
  useEffect(() => {
    initPhaserGame(LEVELS[0], false, 'stained_glass', true);
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [initPhaserGame]);

  // Keyboard shortcuts: Escape/P for Pause, X for X-Ray, R for Restart
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
          return next;
        });
      } else if (e.key.toLowerCase() === 'e' && gameState === 'playing') {
        setExplodePeek((prev) => {
          const next = !prev;
          const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
            | ScrewJamScene
            | undefined;
          scene?.setExplodePeek(next);
          setIslandBanner(next ? 'Layer Explode: L0–L3' : 'Layer Explode: Normal');
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
              ? `Nudge ${dir.toUpperCase()} · ${res.nudgedPlates} Swung`
              : `Kinetic Pulse (${dir.toUpperCase()})`
          );
          return step + 1;
        });
      } else if (e.key.toLowerCase() === 's' && gameState === 'playing') {
        setQueueState((prev) => {
          if (prev.swapUsed || prev.toolboxQueue.length === 0) return prev;
          const swapped = swapActiveWithNextToolbox(prev);
          soundManager.playToolboxSwap();
          haptics.plateRelease();
          setIslandBanner('Swapped Active <-> Next');
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
          setIslandBanner('Molten Wildcard! +15');
          if (next.status === 'victory') {
            triggerVictoryOnce();
          }
          return next;
        });
      } else if (e.key.toLowerCase() === 'r' && gameState === 'playing') {
        loadLevel(currentLevel);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLevel, gameState, loadLevel, modalType, showLevelSelect, showWorkshop, triggerVictoryOnce]);

  const handleSelectTheme = (nextTheme: TactileThemeId) => {
    setThemeId(nextTheme);
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    scene?.setTheme(nextTheme);
    setIslandBanner(`3rd-Gen: ${TACTILE_THEMES[nextTheme].shortLabel}`);
  };

  const handleSelectFinialSkin = (nextSkin: FinialSkinId) => {
    setFinialSkinId(nextSkin);
    const scene = phaserGameRef.current?.scene.getScene('ScrewJamScene') as
      | ScrewJamScene
      | undefined;
    scene?.setFinialSkin(nextSkin);
    setIslandBanner(`Finial: ${FINIAL_SKINS[nextSkin].shortLabel}`);
  };

  const handleClaimScrewChest = () => {
    setScrewChestsClaimed((c) => c + 1);
    setBolts((b) => b + SCREW_CHEST_REWARD_BOLTS);
    setIslandBanner(`Screw Chest +${SCREW_CHEST_REWARD_BOLTS}$!`);
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
      setIslandBanner(next ? 'X-Ray Loupe: ON' : 'X-Ray Loupe: OFF');
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
      setIslandBanner(next ? 'Layer Explode: L0–L3' : 'Layer Explode: Normal');
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
      setIslandBanner(`Nudge ${dir.toUpperCase()} · ${res.nudgedPlates} Swung`);
    } else {
      setIslandBanner(`Kinetic Pulse (${dir.toUpperCase()})`);
    }
  };

  const handleSwapToolbox = () => {
    if (gameState !== 'playing') return;
    setQueueState((prev) => {
      if (prev.swapUsed || prev.toolboxQueue.length === 0) return prev;
      const next = swapActiveWithNextToolbox(prev);
      soundManager.playToolboxSwap();
      haptics.plateRelease();
      setIslandBanner('Swapped Active <-> Next');
      if (next.status === 'victory') {
        triggerVictoryOnce();
      }
      return next;
    });
  };

  const handleTriggerMoltenWildcard = () => {
    if (gameState !== 'playing') return;
    setQueueState((prev) => {
      if (!prev.moltenWildcardReady) return prev;
      const next = triggerMoltenWildcard(prev);
      soundManager.playMoltenWildcard();
      haptics.boxCompleted();
      setBolts((b) => b + 15);
      setIslandBanner('Molten Wildcard! +15');
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
    const preferredColor = queueState.activeToolbox?.color;
    if (scene?.triggerMagnetPull(preferredColor)) {
      setBolts((b) => Math.max(0, b - 25));
      setIslandBanner('Magnet Pull -25');
    }
  };

  const handleDrainBufferBooster = () => {
    if (bolts < 30 || queueState.holdingBuffer.length === 0) return;
    haptics.plateRelease();
    soundManager.playWorkshopUpgrade();
    setBolts((b) => Math.max(0, b - 30));
    setQueueState((prev) => clearBufferSlotsForRevive(prev, 2, 0));
    setIslandBanner('Buffer Drained -2');
  };

  const handleStartGame = () => {
    setLevelStartTime(Date.now());
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

  // Pillar C: The "Fail" Offer (+2 Extra Buffer Space + Clear 2 Pins)
  const handleRevive = (expandBufferSlots: boolean) => {
    setBolts((b) => Math.max(0, b - 30));
    setQueueState((prev) => clearBufferSlotsForRevive(prev, 2, expandBufferSlots ? 2 : 0));
    setModalType('none');
    setGameState('playing');
    setIslandBanner('7-Hole Buffer Unlocked!');
  };

  // Pillar C: $1.99 Pocket Coin Pack + Mob Control Permanent Ad-Removal Rule
  const handlePurchaseStarterCoinPack = () => {
    setBolts((b) => b + 500);
    setAdsRemovedPermanently(true);
    setPreLevelBoosters({ extraBufferHoles: true, dualToolbox: true });
    setIslandBanner('$1.99 Pack · Ads Removed!');
  };

  const handleBuyStarterPackAndRevive = () => {
    setBolts((b) => b + 500);
    setAdsRemovedPermanently(true);
    setQueueState((prev) => clearBufferSlotsForRevive(prev, 3, 2));
    setModalType('none');
    setGameState('playing');
    setIslandBanner('VIP Ad-Free + 7-Hole Dock');
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
    <main className="h-[100dvh] w-full bg-[#070A10] text-slate-100 flex items-center justify-center p-0 sm:p-3 overflow-hidden font-sans select-none">
      {/* Native iOS Capacitor Device Shell (Full-bleed on mobile/iOS WebView, Titanium iPhone 16 Pro frame on desktop preview) */}
      <div className="relative w-full h-full sm:w-[404px] sm:h-[868px] sm:max-h-[96dvh] bg-[#121824] sm:rounded-[48px] sm:border-[7px] sm:border-[#27303F] sm:shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col justify-between overflow-hidden">
        {/* iOS Status Bar + Dynamic Island */}
        <div className="w-full pt-[max(0.35rem,env(safe-area-inset-top))] px-5 pb-1 bg-[#0E131D] flex items-center justify-between text-[11px] font-semibold text-slate-200 shrink-0">
          <span className="font-mono tabular-nums tracking-tight w-12">9:41</span>

          {/* iOS Dynamic Island Pill */}
          <div className="h-6 px-3.5 rounded-full bg-black border border-slate-800/90 flex items-center justify-center gap-2 shadow-inner">
            <span className="text-[10px] font-mono text-amber-400 truncate max-w-[145px]">
              {islandBanner}
            </span>
          </div>

          {/* iOS Right System Icons (5G + Battery) */}
          <div className="w-12 flex items-center justify-end gap-1.5 text-[10px] font-mono text-slate-300">
            <span>5G</span>
            <div className="w-5 h-2.5 rounded-xs border border-slate-400 p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
            </div>
          </div>
        </div>

        {/* Top HUD: Header + Active 3-Slot Toolbox (+ Dual Box & Swap) + 5/7-Hole Buffer */}
        <GameHUD
          queueState={queueState}
          currentLevel={currentLevel}
          bolts={bolts}
          winStreak={winStreak}
          comboState={comboState}
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
        />

        {/* Occlusion Warning Banner */}
        {occlusionToast && (
          <div
            role="status"
            className="absolute top-44 left-3 right-3 z-30 bg-rose-950 border border-rose-500/80 rounded-xl px-3 py-2 text-rose-100 text-xs text-center font-medium shadow-lg pointer-events-none"
          >
            {occlusionToast}
          </div>
        )}

        {/* Phaser 3 + Matter.js Interactive 4-Layer Canvas */}
        <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden min-h-0">
          {explodePeek && (
            <div
              role="status"
              className="absolute top-2 inset-x-4 z-20 bg-[#0E1729]/95 border border-sky-400/70 rounded-xl px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-sky-200 shadow-lg pointer-events-none"
            >
              <span className="font-bold text-sky-300">CAD EXPLODE PEEK [E]</span>
              <span>L0..L3 SEPARATED · TAP PIN</span>
            </div>
          )}
          <div
            ref={phaserContainerRef}
            className="w-full h-full flex items-center justify-center"
            data-testid="phaser-board"
          />
        </div>

        {/* Bottom iOS Tactile 3D Booster Bar: Gravity Nudge + Layer Explode + X-Ray + Magnet + Clear 2 */}
        <footer className="w-full px-2.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-gradient-to-b from-[#171F30] to-[#0E131D] border-t-[2.5px] border-[#0A0E17] flex flex-col gap-2 shrink-0">
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={handleGravityNudge}
              className={`py-1.5 px-1 rounded-2xl text-[10px] font-game-display font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                telemetry && telemetry.pendulumPlates > 0
                  ? 'btn-3d-amber text-slate-950'
                  : 'btn-3d-slate text-slate-100'
              }`}
              aria-label="Kinetic Gravity Nudge"
              title="Kinetic Gravity Nudge [G]: Swing 1-pin pendulum plates away from occluded pins"
            >
              <Wind
                className={`w-3.5 h-3.5 shrink-0 ${
                  telemetry && telemetry.pendulumPlates > 0 ? 'text-slate-950' : 'text-amber-400'
                }`}
              />
              <span className="whitespace-nowrap">
                {telemetry && telemetry.pendulumPlates > 0
                  ? `Nudge (${telemetry.pendulumPlates})`
                  : 'Nudge [G]'}
              </span>
            </button>

            <button
              onClick={handleToggleExplodePeek}
              className={`py-1.5 px-1 rounded-2xl text-[10px] font-game-display font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                explodePeek
                  ? 'btn-3d-blue text-game-outline-sm'
                  : 'btn-3d-slate text-slate-100'
              }`}
              aria-pressed={explodePeek}
              aria-label="Layer Explode Peek"
              title="Layer Explode Peek [E]: Separate L0–L3 layers outward to inspect hidden pins"
            >
              <Layers className={`w-3.5 h-3.5 shrink-0 ${explodePeek ? 'text-white' : 'text-sky-400'}`} />
              <span className="whitespace-nowrap">Explode [E]</span>
            </button>

            <button
              onClick={handleToggleXray}
              className={`py-1.5 px-1 rounded-2xl text-[10px] font-game-display font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                xrayMode
                  ? 'btn-3d-blue text-game-outline-sm'
                  : 'btn-3d-slate text-slate-100'
              }`}
              aria-pressed={xrayMode}
              aria-label="X-Ray Loupe"
            >
              <Eye className={`w-3.5 h-3.5 shrink-0 ${xrayMode ? 'text-white' : 'text-indigo-400'}`} />
              <span className="whitespace-nowrap">X-Ray [X]</span>
            </button>

            <button
              onClick={handleMagnetBooster}
              disabled={bolts < 25}
              className={`py-1.5 px-1 rounded-2xl text-[10px] font-game-display font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                bolts >= 25
                  ? 'btn-3d-slate text-amber-300'
                  : 'bg-slate-900 border-2 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              aria-label="Magnet Booster 25 Bolts"
            >
              <Magnet className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Magnet 25</span>
            </button>

            <button
              onClick={handleDrainBufferBooster}
              disabled={bolts < 30 || queueState.holdingBuffer.length === 0}
              className={`py-1.5 px-1 rounded-2xl text-[10px] font-game-display font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                bolts >= 30 && queueState.holdingBuffer.length > 0
                  ? 'btn-3d-slate text-emerald-300'
                  : 'bg-slate-900 border-2 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              aria-label="Clear 2 Buffer Slots 30 Bolts"
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Clear 30</span>
            </button>
          </div>

          {/* iOS Native Home Indicator Bar */}
          <div className="w-32 h-1 bg-slate-600/70 rounded-full mx-auto" />
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
          />
        )}

        {/* Pause Modal */}
        {gameState === 'paused' && (
          <div
            className="absolute inset-x-0 top-9 bottom-0 z-50 bg-[#090D16]/94 flex items-center justify-center p-4 select-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
          >
            <div className="w-full max-w-xs bg-gradient-to-b from-[#232D42] to-[#161D2B] border-[3px] border-[#141824] rounded-3xl p-5 shadow-[0_8px_0_#0D111A,0_16px_30px_rgba(0,0,0,0.75)] flex flex-col gap-3 text-center">
              <h2
                id="pause-modal-title"
                className="font-game-display text-xl font-bold text-game-outline"
              >
                WORKSHOP PAUSED
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {currentLevel.name} · {queueState.completedBoxes}/{queueState.totalBoxes} Toolboxes Packed
              </p>
              <button
                onClick={() => setGameState('playing')}
                className="btn-3d-green w-full py-2.5 px-4 rounded-2xl text-game-outline-sm font-game-display font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Resume Assembly</span>
              </button>
              <button
                onClick={handleRestartLevel}
                className="btn-3d-slate w-full py-2.5 px-4 rounded-2xl text-slate-100 font-game-display font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Blueprint</span>
              </button>
              <button
                onClick={() => setGameState('title')}
                className="w-full py-2 px-4 rounded-xl text-slate-300 hover:text-white text-xs font-game-display font-bold"
              >
                Return to Title Screen
              </button>
            </div>
          </div>
        )}

        {/* 'Almost Won!' Fail State Hook Modal (Pillar C: Fail Offer + $1.99 Pack + Mob Control Rule) */}
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

        {/* Victory Modal (3D Clockwork Atelier LEVEL COMPLETED Screen) */}
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
            hasNextLevel={
              availableLevels.findIndex((l) => l.id === currentLevel.id) <
              availableLevels.length - 1
            }
          />
        )}

        {/* Workshop Renovation, 3rd-Gen IAP Economy & ASO Modal */}
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
            boosters={preLevelBoosters}
            onToggleBooster={handleToggleBooster}
            adsRemovedPermanently={adsRemovedPermanently}
            onPurchaseStarterCoinPack={handlePurchaseStarterCoinPack}
            initialTab={workshopInitialTab}
            onClose={() => setShowWorkshop(false)}
          />
        )}

        {/* Visual Progression Map & Blueprint Level Select Modal */}
        {showLevelSelect && (
          <LevelSelectModal
            levels={availableLevels}
            currentLevelId={currentLevel.id}
            clearedLevelIds={clearedLevelIds}
            hapticIntensity={hapticIntensity}
            onSelectHapticIntensity={handleSelectHapticIntensity}
            onSelectLevel={(lvl) => loadLevel(lvl)}
            onClose={() => setShowLevelSelect(false)}
          />
        )}
      </div>
    </main>
  );
}
