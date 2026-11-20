import Phaser from 'phaser';
import {
  PinColor,
  PIN_COLORS,
  TactileThemeId,
  TACTILE_THEMES,
  getLayerCollisionFilter,
  computePlatePhysicsMode,
  calculatePinOcclusion,
  PlateGeometry,
  PinGeometry,
  GravityNudgeDirection,
  computeGravityNudgeImpulse,
  computeLayerExplodeOffset,
  computeBezierFlightPoint,
  computeSpecularSweepOffset,
  evaluatePinKeyLock,
  FinialSkinId,
  FINIAL_SKINS,
  createInitialFrostMap,
  evaluatePinFrostTap,
  decrementFrostForSharedPlatePins,
  evaluatePinChainLink,
  IDLE_HINT_DELAY_MS,
  evaluateIdleMovableHints,
  HintPinCandidate,
} from './rules.ts';
import { LEVELS, LevelConfig, LevelPlateDef, LevelPinDef } from './levels.ts';
import { haptics } from './haptics.ts';
import { soundManager } from './audio.ts';

export interface PlateTelemetryItem {
  id: string;
  layerIndex: number;
  color: PinColor;
  pinCount: number;
  mode: 'locked' | 'pendulum' | 'freefall' | 'cleared';
  categoryHex: string;
}

export interface SceneTelemetry {
  plates: PlateTelemetryItem[];
  remainingPins: number;
  occludedPins: number;
  movablePins: number;
  idleHintActive: boolean;
  hintedPinIds: string[];
  pendulumPlates: number;
  clearedPlates: number;
  totalPlates: number;
}

export interface SceneCallbacks {
  onPinTapped: (pinId: string, color: PinColor) => void;
  onOccludedPinTapped: (pinId: string, color: PinColor, overlapRatio: number) => void;
  onPlateCleared: (plateId: string) => void;
  onLevelComplete: () => void;
  onTelemetryChange?: (telemetry: SceneTelemetry) => void;
  onKeyUnlocked?: (keyPinId: string, unlockedPinIds: string[], bonusBolts: number) => void;
  onPadlockedPinTapped?: (pinId: string, blockingKeyPinId: string) => void;
  onFrostedPinTapped?: (pinId: string, remainingFrost: number) => void;
  onFrostUpdated?: (crackedPinIds: string[], shatteredPinIds: string[], bonusBolts: number) => void;
  onChainBlockedPinTapped?: (pinId: string, partnerPinId: string, reason: string) => void;
  onChainDoublePulled?: (primaryPinId: string, partnerPinId: string, bonusBolts: number) => void;
  onIdleHintChanged?: (
    active: boolean,
    movablePinIds: string[],
    recommendedPinId: string | null
  ) => void;
}

interface DrillHoleOffset {
  pinId: string;
  localX: number;
  localY: number;
}

interface RuntimePlate {
  def: LevelPlateDef;
  body: MatterJS.BodyType;
  graphics: Phaser.GameObjects.Graphics;
  baseInertia: number;
  attachedPinIds: Set<string>;
  constraints: Map<string, MatterJS.ConstraintType>;
  holeOffsets: DrillHoleOffset[];
  mode: 'locked' | 'pendulum' | 'freefall' | 'cleared';
  cleared: boolean;
  blockFlashAlpha: number;
}

interface RuntimePin {
  def: LevelPinDef;
  container: Phaser.GameObjects.Container;
  headGraphics: Phaser.GameObjects.Graphics;
  badgeText: Phaser.GameObjects.Text;
  occluded: boolean;
  overlapRatio: number;
  removed: boolean;
  radius: number;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
  shape: 'circle' | 'shard' | 'star';
}

interface PooledShockwave {
  active: boolean;
  x: number;
  y: number;
  startRadius: number;
  endRadius: number;
  life: number;
  maxLife: number;
  color: number;
  lineWidth: number;
}

interface ActiveFlyingPin {
  container: Phaser.GameObjects.Container;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  elapsed: number;
  duration: number;
  colorHex: number;
  trailTimer: number;
}

interface PooledCallout {
  active: boolean;
  text: Phaser.GameObjects.Text;
  startY: number;
  life: number;
  maxLife: number;
}

interface AmbientMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  radius: number;
}

const PARTICLE_POOL_SIZE = 96;
const SHOCKWAVE_POOL_SIZE = 18;
const CALLOUT_POOL_SIZE = 8;
const AMBIENT_MOTE_COUNT = 20;

export class ScrewJamScene extends Phaser.Scene {
  private levelConfig!: LevelConfig;
  private callbacks!: SceneCallbacks;
  private plates: Map<string, RuntimePlate> = new Map();
  private pins: Map<string, RuntimePin> = new Map();
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private particleGraphics!: Phaser.GameObjects.Graphics;
  private particlePool: PooledParticle[] = [];
  private shockwavePool: PooledShockwave[] = [];
  private calloutPool: PooledCallout[] = [];
  private ambientMotes: AmbientMote[] = [];
  private flyingPins: ActiveFlyingPin[] = [];
  private elapsedSec: number = 0;
  private hitstopSec: number = 0;
  private cameraTrauma: number = 0;
  private isInteracting: boolean = false;
  private xrayMode: boolean = false;
  private explodePeek: boolean = false;
  private explodeFactor: number = 0;
  private nudgePulseAlpha: number = 0;
  private nudgeDirection: GravityNudgeDirection = 'right';
  private themeId: TactileThemeId = 'stained_glass';
  private finialSkinId: FinialSkinId = 'royal_brass';
  private removedPinIds: Set<string> = new Set();
  private frostMap: Record<string, number> = {};
  private lastActionTimestampMs: number = performance.now();
  private idleHintDelayMs: number = IDLE_HINT_DELAY_MS;
  private idleHintActive: boolean = false;
  private movableHintPinIds: Set<string> = new Set();
  private preferredHintPinIds: Set<string> = new Set();
  private recommendedHintPinId: string | null = null;
  private activeToolboxColors: PinColor[] = [];
  private spatialTiltEnabled: boolean = true;
  private tiltX: number = 0.35; // 2.5D spatial tilt (-1..1)
  private tiltY: number = 0.45;
  private levelCompletedTriggered: boolean = false;
  private firstTapCoachText: Phaser.GameObjects.Text | null = null;
  private boardBounds = { x: 20, y: 24, width: 360, height: 506 };

  constructor() {
    super({ key: 'ScrewJamScene' });
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      this.particlePool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        vAngle: 0,
        life: 0,
        maxLife: 1,
        color: 0xf59e0b,
        size: 3,
        shape: 'circle',
      });
    }
    for (let i = 0; i < SHOCKWAVE_POOL_SIZE; i++) {
      this.shockwavePool.push({
        active: false,
        x: 0,
        y: 0,
        startRadius: 8,
        endRadius: 48,
        life: 0,
        maxLife: 0.35,
        color: 0xfbbf24,
        lineWidth: 2.5,
      });
    }
    for (let i = 0; i < AMBIENT_MOTE_COUNT; i++) {
      this.ambientMotes.push({
        x: 34 + ((i * 53) % 332),
        y: 44 + ((i * 79) % 452),
        vx: (i % 2 === 0 ? 1 : -1) * (4 + (i % 5) * 1.4),
        vy: -(5 + (i % 4) * 1.8),
        phase: i * 0.72,
        radius: 1.1 + (i % 3) * 0.65,
      });
    }
  }

  init(data?: {
    levelConfig?: LevelConfig;
    callbacks?: SceneCallbacks;
    xrayMode?: boolean;
    themeId?: TactileThemeId;
    finialSkinId?: FinialSkinId;
    spatialTiltEnabled?: boolean;
    activeToolboxColors?: PinColor[];
    idleHintDelayMs?: number;
  }) {
    if (data?.levelConfig) {
      this.levelConfig = data.levelConfig;
    } else if (!this.levelConfig) {
      this.levelConfig = LEVELS[0];
    }
    if (data?.callbacks) {
      this.callbacks = data.callbacks;
    } else if (!this.callbacks) {
      this.callbacks = {
        onPinTapped: () => {},
        onOccludedPinTapped: () => {},
        onPlateCleared: () => {},
        onLevelComplete: () => {},
      };
    }
    this.xrayMode = Boolean(data?.xrayMode);
    if (data?.themeId) {
      this.themeId = data.themeId;
    }
    if (data?.finialSkinId) {
      this.finialSkinId = data.finialSkinId;
    }
    if (typeof data?.spatialTiltEnabled === 'boolean') {
      this.spatialTiltEnabled = data.spatialTiltEnabled;
    }
    if (typeof data?.idleHintDelayMs === 'number' && data.idleHintDelayMs >= 1500) {
      this.idleHintDelayMs = data.idleHintDelayMs;
    }
    this.activeToolboxColors = data?.activeToolboxColors
      ? [...data.activeToolboxColors]
      : this.levelConfig.toolboxColors.length > 0
      ? [this.levelConfig.toolboxColors[0]]
      : [];
    this.explodePeek = false;
    this.explodeFactor = 0;
    this.nudgePulseAlpha = 0;
    this.elapsedSec = 0;
    this.hitstopSec = 0;
    this.cameraTrauma = 0;
    this.lastActionTimestampMs = performance.now();
    this.idleHintActive = false;
    this.movableHintPinIds.clear();
    this.preferredHintPinIds.clear();
    this.recommendedHintPinId = null;
    this.plates.clear();
    this.pins.clear();
    this.removedPinIds.clear();
    this.frostMap = createInitialFrostMap(this.levelConfig.pins);
    this.flyingPins = [];
    this.calloutPool = [];
    this.firstTapCoachText = null;
    this.isInteracting = false;
    this.levelCompletedTriggered = false;
    for (let i = 0; i < this.particlePool.length; i++) {
      this.particlePool[i].active = false;
    }
    for (let i = 0; i < this.shockwavePool.length; i++) {
      this.shockwavePool[i].active = false;
    }
  }

  create() {
    // 1. Draw 3rd-Gen tactile board backdrop
    this.boardGraphics = this.add.graphics();
    this.createTactileBoard();

    // 2. Setup Matter world bounds and gravity
    this.matter.world.setBounds(0, -100, 400, 760, 40, false, false, false, false);

    // 3. Spawn plates and pins from level config
    this.spawnLevelElements();

    // 4. Dedicated top-level particle layer
    this.particleGraphics = this.add.graphics();
    this.particleGraphics.setDepth(100);

    // 4B. Zero-GC Pooled Floating Callout Texts (for instant tactile canvas reward feedback)
    this.calloutPool = [];
    for (let i = 0; i < CALLOUT_POOL_SIZE; i++) {
      const txt = this.add.text(200, 260, '', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#FEF08A',
        stroke: '#1A0E0A',
        strokeThickness: 4,
      });
      txt.setOrigin(0.5, 0.5);
      txt.setDepth(130);
      txt.setVisible(false);
      this.calloutPool.push({
        active: false,
        text: txt,
        startY: 260,
        life: 0,
        maxLife: 0.78,
      });
    }

    // 4C. Zero-Popup First-Tap Diegetic Coach for Parcel 1 only (vanishes on first tap!)
    if (this.levelConfig.id === 1 && !this.levelConfig.isDaily) {
      this.firstTapCoachText = this.add.text(135, 224, 'TAP TO UNWIND', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#1C110C',
        backgroundColor: '#FDE047',
        padding: { x: 6, y: 3 },
      });
      this.firstTapCoachText.setOrigin(0.5, 0.5);
      this.firstTapCoachText.setDepth(125);
    }

    // 5. Interactive 2.5D spatial tilt pointer tracking (Pillar B: Toy/Object Spatial Inspection)
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.spatialTiltEnabled) return;
      const nx = (pointer.x - 200) / 200; // -1..1
      const ny = (pointer.y - 270) / 270; // -1..1
      this.tiltX = Phaser.Math.Clamp(nx * 0.85, -1, 1);
      this.tiltY = Phaser.Math.Clamp(ny * 0.85, -1, 1);
    });

    // 6. Initial occlusion pass and telemetry broadcast
    this.updateAllPinOcclusions();
    this.emitTelemetry();
  }

  public celebrateCanvasCallout(label: string, colorHex: string = '#FEF08A', addShake: boolean = false) {
    this.spawnCallout(200, 128, label, colorHex);
    if (addShake) {
      this.addCameraTrauma(0.32);
    }
  }

  private addCameraTrauma(amount: number) {
    this.cameraTrauma = Math.min(1, this.cameraTrauma + amount);
  }

  private triggerHitstop(durationSec: number) {
    this.hitstopSec = Math.max(this.hitstopSec, durationSec);
  }

  private spawnCallout(x: number, y: number, label: string, colorHex: string = '#FEF08A') {
    for (let i = 0; i < this.calloutPool.length; i++) {
      const c = this.calloutPool[i];
      if (!c.active) {
        c.active = true;
        c.life = 0;
        c.maxLife = 0.82;
        c.startY = Math.max(48, Math.min(480, y - 18));
        c.text.setText(label);
        c.text.setColor(colorHex);
        c.text.setPosition(Math.max(70, Math.min(330, x)), c.startY);
        c.text.setScale(0.72);
        c.text.setAlpha(1);
        c.text.setVisible(true);
        return;
      }
    }
  }

  public setXrayMode(enabled: boolean) {
    this.xrayMode = enabled;
    for (const pin of this.pins.values()) {
      if (!pin.removed) {
        this.renderPinHead(pin);
      }
    }
  }

  public setTheme(themeId: TactileThemeId) {
    this.themeId = themeId;
    if (this.boardGraphics) {
      this.createTactileBoard();
    }
    for (const pin of this.pins.values()) {
      if (!pin.removed) {
        this.renderPinHead(pin);
      }
    }
  }

  public setFinialSkin(finialSkinId: FinialSkinId) {
    this.finialSkinId = finialSkinId;
    for (const pin of this.pins.values()) {
      if (!pin.removed) {
        this.renderPinHead(pin);
      }
    }
  }

  public setSpatialTiltEnabled(enabled: boolean) {
    this.spatialTiltEnabled = enabled;
    if (enabled) {
      this.tiltX = 0.45;
      this.tiltY = 0.55;
    } else {
      this.tiltX = 0;
      this.tiltY = 0;
    }
  }

  public setActiveToolboxColors(colors: PinColor[]) {
    this.activeToolboxColors = [...colors];
    this.refreshIdleHintEvaluation(false);
  }

  public setIdleHintDelayMs(delayMs: number) {
    this.idleHintDelayMs = Math.max(1500, Math.round(delayMs));
    this.refreshIdleHintEvaluation(false);
  }

  public resetIdleTimer() {
    this.lastActionTimestampMs = performance.now();
    if (this.idleHintActive) {
      this.idleHintActive = false;
      for (const pin of this.pins.values()) {
        if (!pin.removed) {
          this.renderPinHead(pin);
        }
      }
      this.callbacks.onIdleHintChanged?.(false, [], null);
      this.emitTelemetry();
    }
  }

  private refreshIdleHintEvaluation(allowActivate: boolean) {
    const candidates: HintPinCandidate[] = [];
    for (const pin of this.pins.values()) {
      candidates.push({
        id: pin.def.id,
        color: pin.def.color,
        layerIndex: pin.def.layerIndex,
        occluded: pin.occluded,
        removed: pin.removed,
        isKeyPin: pin.def.isKeyPin,
        lockedByKeyPinId: pin.def.lockedByKeyPinId,
        chainedWithPinId: pin.def.chainedWithPinId,
      });
    }

    const idleElapsedMs = Math.max(0, performance.now() - this.lastActionTimestampMs);
    const evalRes = evaluateIdleMovableHints(
      candidates,
      this.removedPinIds,
      this.frostMap,
      idleElapsedMs,
      this.activeToolboxColors,
      this.idleHintDelayMs
    );

    this.movableHintPinIds = new Set(evalRes.movablePinIds);
    this.preferredHintPinIds = new Set(evalRes.preferredMatchPinIds);
    this.recommendedHintPinId = evalRes.recommendedPinId;

    if (allowActivate && evalRes.idleHintActive && !this.idleHintActive) {
      this.idleHintActive = true;
      for (const pin of this.pins.values()) {
        if (!pin.removed) {
          this.renderPinHead(pin);
        }
      }
      if (this.recommendedHintPinId) {
        const recPin = this.pins.get(this.recommendedHintPinId);
        if (recPin && !recPin.removed) {
          this.spawnShockwave(recPin.container.x, recPin.container.y, 0xfbbf24, 10, 48, 0.42, 3.0);
        }
      }
      this.callbacks.onIdleHintChanged?.(
        true,
        evalRes.movablePinIds,
        evalRes.recommendedPinId
      );
      this.emitTelemetry();
    } else if (!evalRes.idleHintActive && this.idleHintActive) {
      this.idleHintActive = false;
      for (const pin of this.pins.values()) {
        if (!pin.removed) {
          this.renderPinHead(pin);
        }
      }
      this.callbacks.onIdleHintChanged?.(false, [], null);
      this.emitTelemetry();
    }
  }

  /**
   * Competitive Feature 1B: Layer Explode Peek (2.5D Hold/Toggle Layer Separation)
   * Separates the 4 stacked layers outward so players can inspect hidden pins and overlaps.
   */
  public setExplodePeek(enabled: boolean) {
    this.resetIdleTimer();
    this.explodePeek = enabled;
    this.explodeFactor = enabled ? 1 : 0;
    soundManager.playLayerExplode(enabled);
    for (const pin of this.pins.values()) {
      if (!pin.removed) {
        const offset = computeLayerExplodeOffset(
          pin.def.layerIndex,
          this.explodeFactor,
          this.spatialTiltEnabled,
          this.tiltX,
          this.tiltY
        );
        pin.container.setPosition(
          pin.def.x + offset.offsetX,
          pin.def.y + offset.offsetY
        );
        this.renderPinHead(pin);
      }
    }
  }

  /**
   * Competitive Feature 1A: Kinetic Gravity Nudge
   * Applies a directional torque/velocity kick to pendulum (1-pin) and freefall plates
   * to swing them out of the way of occluded lower-layer pins.
   */
  public triggerGravityNudge(direction: GravityNudgeDirection = 'right'): {
    nudgedPlates: number;
    direction: GravityNudgeDirection;
  } {
    this.resetIdleTimer();
    this.nudgeDirection = direction;
    this.nudgePulseAlpha = 1;
    soundManager.playGravityNudge();
    haptics.plateRelease();

    let nudgedPlates = 0;
    for (const plate of this.plates.values()) {
      if (plate.cleared) continue;
      const impulse = computeGravityNudgeImpulse(
        plate.mode,
        plate.body.position.x,
        200,
        direction
      );
      if (impulse.affected) {
        nudgedPlates++;
        this.matter.body.setAngularVelocity(
          plate.body,
          plate.body.angularVelocity + impulse.angularVelocityDelta
        );
        this.matter.body.setVelocity(plate.body, {
          x: plate.body.velocity.x + impulse.velocityX,
          y: plate.body.velocity.y + impulse.velocityY,
        });
        const colorEntry = PIN_COLORS[plate.def.color] || PIN_COLORS.amber;
        this.spawnParticles(
          plate.body.position.x,
          plate.body.position.y,
          colorEntry.numHex,
          12,
          'shard'
        );
      } else {
        // Locked plates emit a subtle structural spark at their center when the board is nudged
        this.spawnParticles(plate.body.position.x, plate.body.position.y, 0x38bdf8, 5, 'circle');
      }
    }

    // Camera micro-jolt for tactile physical feedback
    const shakeX = direction === 'left' ? -4 : direction === 'right' ? 4 : 0;
    const shakeY = direction === 'up' ? -4 : 2;
    this.cameras.main.scrollX = shakeX;
    this.cameras.main.scrollY = shakeY;
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: 0,
      scrollY: 0,
      duration: 160,
      ease: 'Back.easeOut',
    });

    this.updateAllPinOcclusions();
    this.emitTelemetry();
    return { nudgedPlates, direction };
  }

  /**
   * Booster: Magnetically extracts 1 pin matching the target color (or any unremoved pin)
   * directly from the board, even if occluded by a higher layer.
   */
  public triggerMagnetPull(preferredColor?: PinColor): boolean {
    const activePins = Array.from(this.pins.values()).filter((p) => !p.removed);
    if (activePins.length === 0) return false;

    const targetPin =
      (preferredColor ? activePins.find((p) => p.def.color === preferredColor && !p.occluded) : null) ||
      (preferredColor ? activePins.find((p) => p.def.color === preferredColor) : null) ||
      activePins.find((p) => !p.occluded) ||
      activePins[0];

    if (!targetPin) return false;

    this.spawnParticles(targetPin.def.x, targetPin.def.y, 0x38bdf8, 16, 'shard');
    this.pullPin(targetPin);
    return true;
  }

  /**
   * Wax Re-Stamp Undo: gently returns a buffered pin from the 5-Peg Brass Rack
   * back onto its satin ribbon on the board and restores its Matter.js constraint.
   */
  public restoreBufferedPin(pinId: string): boolean {
    const existingPin = this.pins.get(pinId);
    if (!existingPin || !existingPin.removed) return false;

    // Cancel any active flight animation targeting this pin's container
    for (let i = this.flyingPins.length - 1; i >= 0; i--) {
      if (this.flyingPins[i].container === existingPin.container) {
        this.flyingPins.splice(i, 1);
      }
    }

    this.removedPinIds.delete(pinId);

    // Recreate pin container if it was destroyed after reaching the top rack
    let restoredPin: RuntimePin;
    if (!existingPin.container || !existingPin.container.scene) {
      this.createPin(existingPin.def);
      restoredPin = this.pins.get(pinId)!;
    } else {
      existingPin.removed = false;
      existingPin.container.setPosition(existingPin.def.x, existingPin.def.y);
      existingPin.container.setScale(1);
      existingPin.container.setAngle(0);
      existingPin.container.setAlpha(1);
      existingPin.container.setDepth(existingPin.def.layerIndex * 10 + 6);
      restoredPin = existingPin;
    }

    // Re-attach Matter.js constraints to any non-cleared plates this pin belonged to
    for (const plateId of restoredPin.def.attachedPlateIds) {
      const plate = this.plates.get(plateId);
      if (!plate || plate.cleared) continue;

      if (!plate.attachedPinIds.has(pinId)) {
        plate.attachedPinIds.add(pinId);
      }
      if (!plate.constraints.has(pinId)) {
        const dx = restoredPin.def.x - plate.body.position.x;
        const dy = restoredPin.def.y - plate.body.position.y;
        const constraint = this.matter.constraint.create({
          bodyA: plate.body,
          pointA: { x: dx, y: dy },
          pointB: { x: restoredPin.def.x, y: restoredPin.def.y },
          stiffness: 1,
          length: 0,
        });
        this.matter.world.add(constraint);
        plate.constraints.set(pinId, constraint);
      }
      this.updatePlatePhysicsMode(plate, true);
    }

    this.renderPinHead(restoredPin);
    this.tweens.add({
      targets: restoredPin.container,
      scale: { from: 1.32, to: 1 },
      duration: 210,
      ease: 'Back.easeOut',
    });

    const colorEntry = PIN_COLORS[restoredPin.def.color] || PIN_COLORS.amber;
    this.spawnShockwave(restoredPin.def.x, restoredPin.def.y, 0xfbbf24, 28, 8, 0.28, 2.8);
    this.spawnParticles(restoredPin.def.x, restoredPin.def.y, colorEntry.numHex, 12, 'circle');

    this.updateAllPinOcclusions();
    this.resetIdleTimer();
    this.emitTelemetry();
    return true;
  }

  private spawnShockwave(
    x: number,
    y: number,
    color: number,
    startRadius: number = 10,
    endRadius: number = 46,
    maxLife: number = 0.32,
    lineWidth: number = 2.6
  ) {
    for (let i = 0; i < this.shockwavePool.length; i++) {
      const sw = this.shockwavePool[i];
      if (!sw.active) {
        sw.active = true;
        sw.x = x;
        sw.y = y;
        sw.startRadius = startRadius;
        sw.endRadius = endRadius;
        sw.life = 0;
        sw.maxLife = maxLife;
        sw.color = color;
        sw.lineWidth = lineWidth;
        return;
      }
    }
  }

  private spawnParticles(
    x: number,
    y: number,
    color: number,
    count: number,
    shape: 'circle' | 'shard' | 'star' = 'circle'
  ) {
    let spawned = 0;
    for (let i = 0; i < this.particlePool.length && spawned < count; i++) {
      const p = this.particlePool[i];
      if (!p.active) {
        const angle = (Math.PI * 2 * spawned) / count + (Math.random() - 0.5) * 0.45;
        const speed = 65 + Math.random() * 135;
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 42;
        p.angle = Math.random() * Math.PI * 2;
        p.vAngle = (Math.random() - 0.5) * 14;
        p.life = 0;
        p.maxLife = 0.34 + Math.random() * 0.24;
        p.color = color;
        p.size = shape === 'shard' ? 4.5 + Math.random() * 3.8 : 2.8 + Math.random() * 2.2;
        p.shape = shape;
        spawned++;
      }
    }
  }

  private createTactileBoard() {
    const { x, y, width, height } = this.boardBounds;
    const themeSpec = TACTILE_THEMES[this.themeId] || TACTILE_THEMES.stained_glass;
    this.boardGraphics.clear();

    // Outer oiled-walnut desk tray shadow
    this.boardGraphics.fillStyle(0x0b0705, 0.94);
    this.boardGraphics.fillRoundedRect(x - 4, y - 2, width + 8, height + 8, 22);

    // Warm espresso-walnut / imperial lacquer desk mat
    this.boardGraphics.fillStyle(themeSpec.boardTintHex, 0.98);
    this.boardGraphics.fillRoundedRect(x, y, width, height, 18);

    // Subtle recessed dark-velvet parcel table mat glow
    this.boardGraphics.fillStyle(0x271915, 0.62);
    this.boardGraphics.fillRoundedRect(x + 10, y + 10, width - 20, height - 34, 12);

    // Centered Luxury Cream-Parchment Parcel Envelope Silhouette behind the ribbons
    const envX = x + 32;
    const envY = y + 66;
    const envW = width - 64;
    const envH = height - 134;
    this.boardGraphics.fillStyle(0x0d0806, 0.45);
    this.boardGraphics.fillRoundedRect(envX + 3, envY + 5, envW, envH, 14);
    this.boardGraphics.fillStyle(0x30211a, 0.82);
    this.boardGraphics.fillRoundedRect(envX, envY, envW, envH, 14);
    this.boardGraphics.lineStyle(1.4, 0xd4a373, 0.28);
    this.boardGraphics.strokeRoundedRect(envX, envY, envW, envH, 14);
    // Subtle envelope diagonal folded flap seams
    this.boardGraphics.lineStyle(1, 0xfde68a, 0.12);
    this.boardGraphics.lineBetween(envX + 8, envY + 8, envX + envW * 0.5, envY + envH * 0.44);
    this.boardGraphics.lineBetween(envX + envW - 8, envY + 8, envX + envW * 0.5, envY + envH * 0.44);
    this.boardGraphics.lineBetween(envX + 8, envY + envH - 8, envX + envW * 0.5, envY + envH * 0.56);
    this.boardGraphics.lineBetween(envX + envW - 8, envY + envH - 8, envX + envW * 0.5, envY + envH * 0.56);

    // Subtle engraved Royal Post circular cancellation postmark in upper-right corner of envelope
    const stampX = envX + envW - 34;
    const stampY = envY + 32;
    this.boardGraphics.lineStyle(1.1, 0xf59e0b, 0.24);
    this.boardGraphics.strokeCircle(stampX, stampY, 17);
    this.boardGraphics.strokeCircle(stampX, stampY, 12.5);
    this.boardGraphics.lineBetween(stampX - 28, stampY - 4, stampX - 16, stampY - 4);
    this.boardGraphics.lineBetween(stampX - 30, stampY, stampX - 17, stampY);
    this.boardGraphics.lineBetween(stampX - 28, stampY + 4, stampX - 16, stampY + 4);

    // Outer burnished mahogany-gold bezel stroke
    this.boardGraphics.lineStyle(2.5, 0x6b442a, 0.92);
    this.boardGraphics.strokeRoundedRect(x, y, width, height, 18);

    // Inner gold-foil double hairline inlay
    this.boardGraphics.lineStyle(1.3, themeSpec.frameStrokeHex, 0.45);
    this.boardGraphics.strokeRoundedRect(x + 8, y + 8, width - 16, height - 16, 13);

    // Corner engraved brass parcel rivets
    const corners = [
      { cx: x + 16, cy: y + 16 },
      { cx: x + width - 16, cy: y + 16 },
      { cx: x + 16, cy: y + height - 16 },
      { cx: x + width - 16, cy: y + height - 16 },
    ];
    for (const c of corners) {
      this.boardGraphics.fillStyle(0x78350f, 1);
      this.boardGraphics.fillCircle(c.cx, c.cy, 5.2);
      this.boardGraphics.lineStyle(1.2, 0xfbbf24, 0.85);
      this.boardGraphics.strokeCircle(c.cx, c.cy, 5.2);
      this.boardGraphics.fillStyle(0xfef08a, 0.9);
      this.boardGraphics.fillCircle(c.cx - 1.2, c.cy - 1.2, 1.5);
    }

    // Subtle brass pin-board eyelet perforations across the walnut mat
    for (let hx = x + 30; hx <= x + width - 30; hx += 30) {
      for (let hy = y + 33; hy <= y + height - 36; hy += 30) {
        this.boardGraphics.fillStyle(0x110b09, 0.62);
        this.boardGraphics.fillCircle(hx, hy, 3.1);
        this.boardGraphics.lineStyle(0.7, 0x5c3a24, 0.36);
        this.boardGraphics.strokeCircle(hx, hy, 3.6);
      }
    }

    // Bottom satin ribbon drop chute (where untied ribbons glide free)
    const chuteY = y + height - 22;
    this.boardGraphics.fillStyle(0x120b09, 0.85);
    this.boardGraphics.fillRoundedRect(x + 28, chuteY, width - 56, 12, 5);
    this.boardGraphics.lineStyle(1.1, 0xd97706, 0.45);
    for (let sx = x + 36; sx < x + width - 36; sx += 16) {
      this.boardGraphics.lineBetween(sx, chuteY + 2, sx + 6, chuteY + 10);
    }
  }

  private spawnLevelElements() {
    const sortedPlates = [...this.levelConfig.plates].sort((a, b) => a.layerIndex - b.layerIndex);

    for (const plateDef of sortedPlates) {
      this.createPlate(plateDef);
    }

    for (const pinDef of this.levelConfig.pins) {
      this.createPin(pinDef);
    }

    // Attach pins to their plates using Matter.Constraint (stiffness: 1, length: 0)
    for (const pinDef of this.levelConfig.pins) {
      for (const plateId of pinDef.attachedPlateIds) {
        const plate = this.plates.get(plateId);
        if (!plate) continue;

        plate.attachedPinIds.add(pinDef.id);

        const rad = Phaser.Math.DegToRad(plateDefAngle(plate.def));
        const dx = pinDef.x - plate.body.position.x;
        const dy = pinDef.y - plate.body.position.y;
        const localX = dx * Math.cos(-rad) - dy * Math.sin(-rad);
        const localY = dx * Math.sin(-rad) + dy * Math.cos(-rad);

        plate.holeOffsets.push({
          pinId: pinDef.id,
          localX,
          localY,
        });

        const matterGlobal = Phaser.Physics.Matter as unknown as {
          Matter?: { Constraint: { create: (options: unknown) => MatterJS.ConstraintType } };
          Constraint?: { create: (options: unknown) => MatterJS.ConstraintType };
        };
        const constraintFactory = matterGlobal.Matter?.Constraint || matterGlobal.Constraint;
        const constraint = constraintFactory!.create({
          bodyA: plate.body,
          pointA: { x: dx, y: dy },
          pointB: { x: pinDef.x, y: pinDef.y },
          stiffness: 1,
          length: 0,
        });

        this.matter.world.add(constraint);
        plate.constraints.set(pinDef.id, constraint);
      }
    }

    // Apply Rule 3: Pin & Pendulum Physics
    for (const plate of this.plates.values()) {
      this.updatePlatePhysicsMode(plate, true);
    }
  }

  private createPlate(plateDef: LevelPlateDef) {
    const colFilter = getLayerCollisionFilter(plateDef.layerIndex);
    const rad = Phaser.Math.DegToRad(plateDef.angle || 0);

    const body = this.matter.add.rectangle(
      plateDef.x,
      plateDef.y,
      plateDef.width,
      plateDef.height,
      {
        chamfer: { radius: 16 },
        angle: rad,
        friction: 0.08,
        frictionAir: 0.012,
        restitution: 0.2,
        collisionFilter: colFilter, // Rule 2: Per-Layer Collision Filtering
      }
    );

    const baseInertia = body.inertia;
    const graphics = this.add.graphics();
    graphics.setDepth(plateDef.layerIndex * 10 + 2);

    const runtimePlate: RuntimePlate = {
      def: plateDef,
      body,
      graphics,
      baseInertia,
      attachedPinIds: new Set(),
      constraints: new Map(),
      holeOffsets: [],
      mode: 'locked',
      cleared: false,
      blockFlashAlpha: 0,
    };

    this.plates.set(plateDef.id, runtimePlate);
  }

  private createPin(pinDef: LevelPinDef) {
    const pinRadius = 14;
    const container = this.add.container(pinDef.x, pinDef.y);
    container.setDepth(pinDef.layerIndex * 10 + 6);

    const headGraphics = this.add.graphics();
    container.add(headGraphics);

    const badgeText = this.add.text(0, -21, '', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '9px',
      color: '#F8FAFC',
      backgroundColor: '#0F172ACC',
      padding: { x: 3, y: 1 },
    });
    badgeText.setOrigin(0.5, 0.5);
    badgeText.setVisible(false);
    container.add(badgeText);

    // Generous 44x44px touch target (radius 22) for mobile ergonomics
    const hitZone = this.add.circle(0, 0, 22, 0x000000, 0.001);
    hitZone.setInteractive({ useHandCursor: true });
    container.add(hitZone);

    const runtimePin: RuntimePin = {
      def: pinDef,
      container,
      headGraphics,
      badgeText,
      occluded: false,
      overlapRatio: 0,
      removed: false,
      radius: pinRadius,
    };

    this.renderPinHead(runtimePin);

    hitZone.on('pointerdown', () => this.handlePinTap(runtimePin));
    hitZone.on('pointerover', () => {
      if (!runtimePin.removed && !runtimePin.occluded) {
        haptics.lightTap();
        this.tweens.add({
          targets: container,
          scale: 1.14,
          duration: 110,
          ease: 'Back.easeOut',
        });
      }
    });
    hitZone.on('pointerout', () => {
      if (!runtimePin.removed) {
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 110,
          ease: 'Cubic.easeOut',
        });
      }
    });

    this.pins.set(pinDef.id, runtimePin);
  }

  private renderPinHead(pin: RuntimePin) {
    const g = pin.headGraphics;
    g.clear();

    const colorEntry = PIN_COLORS[pin.def.color] || PIN_COLORS.amber;
    const r = pin.radius;

    if (pin.occluded) {
      // Rule 4: Recessed Dark Bronze Seal Cage for Occluded Ribbons
      g.fillStyle(0x110a08, 0.92);
      g.fillCircle(0, 2.5, r + 2.5);

      g.fillStyle(colorEntry.numHex, 0.34);
      g.fillCircle(0, 0, r - 1.5);

      // Antique bronze retaining ring + 4 cardinal clasps
      g.lineStyle(2.2, 0x8c684a, 0.85);
      g.strokeCircle(0, 0, r);
      for (let a = 0; a < 4; a++) {
        const rad = (a * Math.PI) / 2;
        g.fillStyle(0xb68b60, 0.9);
        g.fillCircle(Math.cos(rad) * r, Math.sin(rad) * r, 2.1);
      }

      // High-contrast crossed ribbon pin-lock indicator
      g.lineStyle(2.1, 0xfda4af, 0.78);
      g.lineBetween(-r * 0.42, -r * 0.42, r * 0.42, r * 0.42);
      g.lineBetween(-r * 0.42, r * 0.42, r * 0.42, -r * 0.42);
      g.fillStyle(0xe11d48, 0.9);
      g.fillCircle(0, 0, 2.6);

      if (this.xrayMode || this.explodePeek) {
        pin.badgeText.setText(`L${pin.def.layerIndex}·${Math.round(pin.overlapRatio * 100)}%`);
        pin.badgeText.setVisible(true);
      } else {
        pin.badgeText.setVisible(false);
      }
    } else if (this.themeId === 'stained_glass') {
      // Theme 1 (Royal Wax): 3D Glossy Lacquered Wax Seal Medallion with Scalloped Drip Rim
      g.fillStyle(0x0b0605, 0.58);
      g.fillCircle(1.5, 4.2, r + 2.2);

      // Organic scalloped poured-wax edge nodules
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const dripR = i % 2 === 0 ? r + 0.6 : r - 0.3;
        g.fillStyle(colorEntry.numHex, 0.96);
        g.fillCircle(Math.cos(a) * (dripR - 3.2), Math.sin(a) * (dripR - 3.2), 4.6);
      }

      // Main lacquered wax disc + raised stamped outer lip
      g.fillStyle(colorEntry.numHex, 1);
      g.fillCircle(0, 0, r);
      g.lineStyle(2, 0xfde68a, 0.78);
      g.strokeCircle(0, 0, r - 2.6);

      // Embossed Royal Post Fleur-de-Lis / Crown Crest in warm guild gold
      g.fillStyle(0xfef08a, 0.92);
      g.fillTriangle(-3.5, 2.5, 3.5, 2.5, 0, -4.5);
      g.fillCircle(-3.6, 0.5, 1.5);
      g.fillCircle(3.6, 0.5, 1.5);

      // Glossy warm candlelight specular crescent
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(-3.8, -3.8, 2.5);
      g.fillStyle(0xfef08a, 0.6);
      g.fillCircle(3.5, 3.5, 1.4);
    } else if (this.themeId === 'knit_yarn') {
      // Theme 2 (Kyoto Silk): Gilded Silk Knot Clasp & Mother-of-Pearl Button
      g.fillStyle(0x0b0605, 0.5);
      g.fillCircle(1.5, 4.2, r + 1.8);

      // Braided silk mizuhiki loop bow beneath button
      g.lineStyle(2.2, 0xfbbf24, 0.92);
      g.strokeCircle(-4.6, 4.2, 4.2);
      g.strokeCircle(4.6, 4.2, 4.2);

      // Lacquered silk button body + gold rim
      g.fillStyle(colorEntry.numHex, 1);
      g.fillCircle(0, 0, r);
      g.lineStyle(1.8, 0xfef08a, 0.85);
      g.strokeCircle(0, 0, r - 1.5);

      // Mother-of-pearl inner shine
      g.fillStyle(0xffffff, 0.92);
      g.fillCircle(-3.8, -3.8, 3.1);
      g.fillStyle(0xfef08a, 0.65);
      g.fillCircle(3.2, 3.2, 1.6);
    } else {
      // Theme 3 (Venetian Velvet): Engraved Antique Brass Signet Stud with Enamel Dome
      g.fillStyle(0x0b0605, 0.54);
      g.fillCircle(1.5, 4, r + 2);

      // Burnished brass bezel ring with 6 milgrain beads
      g.fillStyle(0xb45309, 1);
      g.fillCircle(0, 1.2, r + 1.2);
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(0, 0, r + 0.5);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        g.fillStyle(0xfef08a, 0.95);
        g.fillCircle(Math.cos(a) * r, Math.sin(a) * r, 1.9);
      }

      // Recessed enamel color medallion
      g.fillStyle(colorEntry.numHex, 1);
      g.fillCircle(0, 0, r - 2.4);
      g.lineStyle(1.4, 0xfef08a, 0.72);
      g.strokeCircle(0, 0, r - 5);

      // Center gilded compass star
      g.fillStyle(0xfef08a, 0.95);
      g.fillCircle(0, 0, 2.2);
      g.fillStyle(0xffffff, 0.84);
      g.fillCircle(-3.4, -3.4, 2.2);
    }

    // Wax Seal Stamp Skin + Interactive Parcel Hazard Overlays (WAX×2, SIGNET, LOCK, BOW)
    const isPadlocked = Boolean(
      pin.def.lockedByKeyPinId && !this.removedPinIds.has(pin.def.lockedByKeyPinId)
    );
    const isKeyPin = Boolean(pin.def.isKeyPin);
    const remainingFrost = this.frostMap[pin.def.id] ?? 0;
    const isChained = Boolean(
      pin.def.chainedWithPinId && !this.removedPinIds.has(pin.def.chainedWithPinId)
    );
    const finialSpec = FINIAL_SKINS[this.finialSkinId] || FINIAL_SKINS.royal_brass;

    if (!pin.occluded && this.finialSkinId !== 'royal_brass') {
      g.lineStyle(1.8, finialSpec.bezelHex, 0.9);
      g.strokeCircle(0, 0, r + 2.2);
      g.fillStyle(finialSpec.coreHex, 0.95);
      g.fillCircle(0, 0, 2.5);
    }

    if (remainingFrost > 0) {
      // Thick Hardened Sealing Wax Coat (WAX×2 -> cracks to WAX×1 -> shatters)
      g.fillStyle(0x9f1239, remainingFrost >= 2 ? 0.68 : 0.42);
      g.fillCircle(0, 0, r + 3.6);
      g.lineStyle(remainingFrost >= 2 ? 2.6 : 1.8, 0xfda4af, 0.95);
      g.strokeCircle(0, 0, r + 3.4);
      // Fracture crack lines on hardened wax crust
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 + (remainingFrost === 1 ? 0.35 : 0);
        g.lineStyle(1.5, 0xfef08a, remainingFrost === 1 ? 0.95 : 0.7);
        g.lineBetween(
          Math.cos(a) * (r * 0.28),
          Math.sin(a) * (r * 0.28),
          Math.cos(a) * (r + 2.8),
          Math.sin(a) * (r + 2.8)
        );
      }
      pin.badgeText.setText(`WAX×${remainingFrost}`);
      pin.badgeText.setVisible(true);
    } else if (isPadlocked) {
      // Royal Crest Lock Collar (LOCK)
      g.lineStyle(2.6, 0xf59e0b, 0.96);
      g.strokeCircle(0, 0, r + 2.8);
      g.fillStyle(0x2a1410, 0.92);
      g.fillRoundedRect(-7, -5, 14, 11, 3);
      g.lineStyle(1.8, 0xfbbf24, 1);
      g.strokeRoundedRect(-7, -5, 14, 11, 3);
      g.lineStyle(2.2, 0xfde047, 1);
      g.beginPath();
      g.arc(0, -5, 4.5, Math.PI, 0, false);
      g.strokePath();
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(0, -0.5, 1.8);
      pin.badgeText.setText('LOCK');
      pin.badgeText.setVisible(true);
    } else if (isKeyPin) {
      // Golden Royal Signet Ring Clasp (SIGNET)
      g.lineStyle(2.5, 0xffe033, 0.98);
      g.strokeCircle(0, 0, r + 3.2);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        g.fillStyle(0xffe033, 1);
        g.fillCircle(Math.cos(a) * (r + 3.2), Math.sin(a) * (r + 3.2), 2.4);
      }
      g.fillStyle(0x2a1410, 0.88);
      g.fillCircle(0, 0, 5.4);
      g.fillStyle(0xffd700, 1);
      g.fillCircle(0, -1.2, 3.2);
      g.fillRect(-1.2, 1, 2.4, 3.8);
      pin.badgeText.setText('SIGNET');
      pin.badgeText.setVisible(true);
    } else if (isChained) {
      // Tied Twin Satin Bow Knot Collar (BOW)
      g.lineStyle(2.4, 0xfde68a, 0.96);
      g.strokeCircle(0, 0, r + 2.8);
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(-r - 1.8, 0, 3);
      g.fillCircle(r + 1.8, 0, 3);
      pin.badgeText.setText('BOW');
      pin.badgeText.setVisible(true);
    } else if (!pin.occluded) {
      if (this.idleHintActive && this.movableHintPinIds.has(pin.def.id)) {
        const isPref = this.preferredHintPinIds.has(pin.def.id);
        pin.badgeText.setText(isPref ? 'MATCH' : 'FREE');
        pin.badgeText.setVisible(true);
      } else if (this.xrayMode || this.explodePeek) {
        pin.badgeText.setText(`L${pin.def.layerIndex}`);
        pin.badgeText.setVisible(true);
      } else {
        pin.badgeText.setVisible(false);
      }
    }
  }

  private checkPinOcclusion(pin: RuntimePin): { occluded: boolean; overlapRatio: number } {
    const pinGeom: PinGeometry = {
      id: pin.def.id,
      x: pin.def.x,
      y: pin.def.y,
      radius: pin.radius,
      layerIndex: pin.def.layerIndex,
    };

    const plateGeoms: PlateGeometry[] = Array.from(this.plates.values()).map((p) => ({
      id: p.def.id,
      x: p.body.position.x,
      y: p.body.position.y,
      width: p.def.width,
      height: p.def.height,
      angle: p.body.angle,
      layerIndex: p.def.layerIndex,
      shape: p.def.shape,
      cleared: p.cleared,
    }));

    const result = calculatePinOcclusion(pinGeom, plateGeoms);
    return { occluded: result.occluded, overlapRatio: result.overlapRatio };
  }

  private updateAllPinOcclusions() {
    let changed = false;
    for (const pin of this.pins.values()) {
      if (pin.removed) continue;
      const { occluded, overlapRatio } = this.checkPinOcclusion(pin);
      if (pin.occluded !== occluded || Math.abs(pin.overlapRatio - overlapRatio) > 0.05) {
        pin.occluded = occluded;
        pin.overlapRatio = overlapRatio;
        this.renderPinHead(pin);
        changed = true;
      }
    }
    this.refreshIdleHintEvaluation(false);
    if (changed) {
      this.emitTelemetry();
    }
  }

  private handlePinTap(pin: RuntimePin) {
    if (pin.removed || this.isInteracting) return;
    this.resetIdleTimer();

    const { occluded, overlapRatio } = this.checkPinOcclusion(pin);
    pin.occluded = occluded;
    pin.overlapRatio = overlapRatio;
    this.renderPinHead(pin);

    if (occluded) {
      haptics.occludedBlocked();
      soundManager.playBlockedThud();
      this.spawnParticles(pin.def.x, pin.def.y, 0xf43f5e, 8, 'shard');
      this.spawnShockwave(pin.def.x, pin.def.y, 0xf43f5e, 8, 34, 0.26, 2.5);
      this.spawnCallout(pin.def.x, pin.def.y, 'TUCKED', '#FDA4AF');

      // Highlight the upper-layer plates that are physically occluding this pin
      for (const plate of this.plates.values()) {
        if (!plate.cleared && plate.def.layerIndex > pin.def.layerIndex) {
          const dx = Math.abs(plate.body.position.x - pin.def.x);
          const dy = Math.abs(plate.body.position.y - pin.def.y);
          if (dx <= plate.def.width * 0.55 + pin.radius && dy <= plate.def.height * 0.55 + pin.radius) {
            plate.blockFlashAlpha = 1;
          }
        }
      }

      this.tweens.add({
        targets: pin.container,
        x: pin.container.x + 5,
        duration: 36,
        yoyo: true,
        repeat: 3,
        ease: 'Linear',
      });

      this.callbacks.onOccludedPinTapped(pin.def.id, pin.def.color, overlapRatio);
      return;
    }

    // Check Star-Keyhole Clasp Padlock state
    const lockEval = evaluatePinKeyLock(
      pin.def.id,
      this.levelConfig.pins,
      this.removedPinIds
    );
    if (!lockEval.allowed && lockEval.isPadlocked && lockEval.blockingKeyPinId) {
      haptics.occludedBlocked();
      soundManager.playBlockedThud();
      this.spawnParticles(pin.def.x, pin.def.y, 0xfbbf24, 10, 'shard');
      this.spawnShockwave(pin.def.x, pin.def.y, 0xfbbf24, 10, 38, 0.3, 2.8);

      // Highlight the Golden Star-Key Pin that unlocks this padlock
      const keyPin = this.pins.get(lockEval.blockingKeyPinId);
      if (keyPin && !keyPin.removed) {
        this.spawnShockwave(keyPin.def.x, keyPin.def.y, 0xffe033, 8, 44, 0.36, 3.0);
        this.tweens.add({
          targets: keyPin.container,
          scale: 1.28,
          duration: 130,
          yoyo: true,
          repeat: 1,
          ease: 'Back.easeOut',
        });
      }

      this.tweens.add({
        targets: pin.container,
        x: pin.container.x + 5,
        duration: 36,
        yoyo: true,
        repeat: 3,
        ease: 'Linear',
      });

      this.callbacks.onPadlockedPinTapped?.(pin.def.id, lockEval.blockingKeyPinId);
      return;
    }

    // Check Tier-2 Hazard 1: Crystal Frost Cap (ICE×2 / ICE×1)
    const frostEval = evaluatePinFrostTap(pin.def.id, this.frostMap);
    if (!frostEval.allowed) {
      haptics.occludedBlocked();
      soundManager.playFrostCrackChime(false);
      this.spawnParticles(pin.def.x, pin.def.y, 0x38bdf8, 12, 'shard');
      this.spawnShockwave(pin.def.x, pin.def.y, 0x38bdf8, 10, 38, 0.28, 2.8);
      this.tweens.add({
        targets: pin.container,
        x: pin.container.x + 5,
        duration: 36,
        yoyo: true,
        repeat: 3,
        ease: 'Linear',
      });
      this.callbacks.onFrostedPinTapped?.(pin.def.id, frostEval.remainingFrost);
      return;
    }

    // Check Tier-2 Hazard 2: Twin Brass Chain-Link Clasp (CHAIN)
    const occludedSet = new Set<string>();
    for (const p of this.pins.values()) {
      if (!p.removed && p.occluded) {
        occludedSet.add(p.def.id);
      }
    }
    const chainEval = evaluatePinChainLink(
      pin.def.id,
      this.levelConfig.pins,
      this.removedPinIds,
      occludedSet,
      this.frostMap
    );
    if (!chainEval.allowed && chainEval.partnerPinId) {
      haptics.occludedBlocked();
      soundManager.playBlockedThud();
      this.spawnParticles(pin.def.x, pin.def.y, 0xfbbf24, 10, 'shard');
      const partnerPin = this.pins.get(chainEval.partnerPinId);
      if (partnerPin && !partnerPin.removed) {
        this.spawnShockwave(partnerPin.def.x, partnerPin.def.y, 0xfbbf24, 10, 42, 0.34, 2.8);
        this.tweens.add({
          targets: partnerPin.container,
          scale: 1.24,
          duration: 120,
          yoyo: true,
          repeat: 1,
          ease: 'Back.easeOut',
        });
      }
      this.callbacks.onChainBlockedPinTapped?.(
        pin.def.id,
        chainEval.partnerPinId,
        chainEval.blockedReason || 'partner_occluded'
      );
      return;
    }

    this.pullPin(pin, false);
  }

  private pullPin(pin: RuntimePin, isChainPartnerPull: boolean = false) {
    const lockEval = evaluatePinKeyLock(
      pin.def.id,
      this.levelConfig.pins,
      this.removedPinIds
    );
    const occludedSet = new Set<string>();
    for (const p of this.pins.values()) {
      if (!p.removed && p.occluded) {
        occludedSet.add(p.def.id);
      }
    }
    const chainEval = evaluatePinChainLink(
      pin.def.id,
      this.levelConfig.pins,
      this.removedPinIds,
      occludedSet,
      this.frostMap
    );

    if (this.firstTapCoachText) {
      this.firstTapCoachText.setVisible(false);
    }

    pin.removed = true;
    this.removedPinIds.add(pin.def.id);
    haptics.pinPull();

    const colorEntry = PIN_COLORS[pin.def.color] || PIN_COLORS.amber;
    const finialSpec = FINIAL_SKINS[this.finialSkinId] || FINIAL_SKINS.royal_brass;
    const startX = pin.container.x;
    const startY = pin.container.y;

    this.spawnParticles(
      startX,
      startY,
      colorEntry.numHex,
      16,
      this.themeId === 'stained_glass' ? 'shard' : 'circle'
    );
    this.spawnShockwave(
      startX,
      startY,
      this.finialSkinId === 'royal_brass' ? colorEntry.numHex : finialSpec.bezelHex,
      10,
      44,
      0.28,
      2.8
    );

    // Crack or shatter Hardened Sealing Wax (WAX×2 -> WAX×1 -> Shatter) on sibling pins!
    const frostUpdate = decrementFrostForSharedPlatePins(
      pin.def.id,
      this.levelConfig.pins,
      this.frostMap,
      this.removedPinIds
    );
    this.frostMap = frostUpdate.nextFrostMap;
    if (frostUpdate.crackedPinIds.length > 0 || frostUpdate.shatteredPinIds.length > 0) {
      const didShatter = frostUpdate.shatteredPinIds.length > 0;
      soundManager.playFrostCrackChime(didShatter);
      if (didShatter) {
        this.triggerHitstop(0.045);
        this.addCameraTrauma(0.45);
      } else {
        this.addCameraTrauma(0.2);
      }
      for (const pid of [...frostUpdate.crackedPinIds, ...frostUpdate.shatteredPinIds]) {
        const targetPin = this.pins.get(pid);
        if (targetPin && !targetPin.removed) {
          this.renderPinHead(targetPin);
          this.spawnParticles(targetPin.def.x, targetPin.def.y, didShatter ? 0xfda4af : 0xfbbf24, 18, 'shard');
          this.spawnShockwave(targetPin.def.x, targetPin.def.y, 0xfbbf24, 10, 48, 0.34, 3.0);
          this.spawnCallout(
            targetPin.def.x,
            targetPin.def.y,
            didShatter ? `SHATTER +${frostUpdate.bonusBolts}` : 'WAX CRACK!',
            didShatter ? '#FDE047' : '#FDA4AF'
          );
          this.tweens.add({
            targets: targetPin.container,
            scale: 1.2,
            duration: 130,
            yoyo: true,
            ease: 'Back.easeOut',
          });
        }
      }
      this.callbacks.onFrostUpdated?.(
        frostUpdate.crackedPinIds,
        frostUpdate.shatteredPinIds,
        frostUpdate.bonusBolts
      );
    }

    // If this pin is a Golden Signet Seal, unlock its linked Crest Locks with hitstop & golden burst!
    if (lockEval.isKeyPin && lockEval.unlockedPinIds.length > 0) {
      soundManager.playKeyUnlockChime();
      this.triggerHitstop(0.045);
      this.addCameraTrauma(0.42);
      for (const unlockedId of lockEval.unlockedPinIds) {
        const targetLockedPin = this.pins.get(unlockedId);
        if (targetLockedPin && !targetLockedPin.removed) {
          this.renderPinHead(targetLockedPin);
          this.spawnParticles(targetLockedPin.def.x, targetLockedPin.def.y, 0xffe033, 20, 'shard');
          this.spawnShockwave(targetLockedPin.def.x, targetLockedPin.def.y, 0xffe033, 12, 54, 0.38, 3.2);
          this.spawnCallout(
            targetLockedPin.def.x,
            targetLockedPin.def.y,
            `SIGNET +${lockEval.keyBonusBolts}`,
            '#FEF08A'
          );
          this.tweens.add({
            targets: targetLockedPin.container,
            scale: 1.22,
            duration: 140,
            yoyo: true,
            ease: 'Back.easeOut',
          });
        }
      }
      this.callbacks.onKeyUnlocked?.(
        pin.def.id,
        lockEval.unlockedPinIds,
        lockEval.keyBonusBolts
      );
    }

    // Detach pin constraints from all connected plates
    for (const plate of this.plates.values()) {
      if (plate.attachedPinIds.has(pin.def.id)) {
        plate.attachedPinIds.delete(pin.def.id);
        const constraint = plate.constraints.get(pin.def.id);
        if (constraint) {
          this.matter.world.remove(constraint);
          plate.constraints.delete(pin.def.id);
        }
        this.updatePlatePhysicsMode(plate, false);
      }
    }

    // Route pin immediately so HUD updates with zero perceived latency
    this.callbacks.onPinTapped(pin.def.id, pin.def.color);
    this.updateAllPinOcclusions();
    this.emitTelemetry();

    // Launch extracted 2.5D pin along a quadratic Bezier arc into the top Toolbox / Buffer dock
    pin.container.setDepth(110);
    pin.badgeText.setVisible(false);
    const targetX = 140 + ((pin.def.x + pin.def.layerIndex * 29) % 120);
    const targetY = 12;

    this.flyingPins.push({
      container: pin.container,
      startX,
      startY,
      targetX,
      targetY,
      elapsed: 0,
      duration: 0.28,
      colorHex: colorEntry.numHex,
      trailTimer: 0,
    });

    // If this pin has an active Tied Satin Bow partner, auto-pull the twin simultaneously!
    if (!isChainPartnerPull && chainEval.isChained && chainEval.partnerPinId) {
      const partnerPin = this.pins.get(chainEval.partnerPinId);
      if (partnerPin && !partnerPin.removed) {
        soundManager.playChainReleaseChime();
        this.triggerHitstop(0.04);
        this.addCameraTrauma(0.38);
        this.spawnCallout(
          (startX + partnerPin.def.x) * 0.5,
          (startY + partnerPin.def.y) * 0.5,
          `TWIN BOW +${chainEval.chainBonusBolts}`,
          '#6EE7B7'
        );
        this.pullPin(partnerPin, true);
        this.callbacks.onChainDoublePulled?.(
          pin.def.id,
          partnerPin.def.id,
          chainEval.chainBonusBolts
        );
      }
    }
  }

  /**
   * Rule 3: Pin & Pendulum Physics + 3rd-Gen Theme Release Effects
   */
  private updatePlatePhysicsMode(plate: RuntimePlate, isInitial: boolean) {
    if (plate.cleared) return;

    const pinCount = plate.attachedPinIds.size;
    const physicsMode = computePlatePhysicsMode(pinCount, plate.baseInertia);
    plate.mode = physicsMode.mode;

    const matterBody = plate.body as unknown as {
      inertia: number;
      inverseInertia: number;
    };
    matterBody.inertia = physicsMode.inertia;
    matterBody.inverseInertia = physicsMode.inverseInertia;

    if (physicsMode.mode === 'locked') {
      this.matter.body.setAngularVelocity(plate.body, 0);
    } else if (physicsMode.mode === 'pendulum') {
      const nudge = (plate.body.position.x <= 200 ? 1 : -1) * 0.012;
      this.matter.body.setAngularVelocity(plate.body, nudge);
      if (!isInitial) {
        soundManager.playPlateClack();
      }
    } else if (physicsMode.mode === 'freefall') {
      if (!isInitial) {
        haptics.plateRelease();
        this.addCameraTrauma(0.34);
        const colorEntry = PIN_COLORS[plate.def.color] || PIN_COLORS.amber;
        this.spawnCallout(plate.body.position.x, plate.body.position.y, 'RIBBON FREE +15', '#FEF08A');
        this.spawnShockwave(
          plate.body.position.x,
          plate.body.position.y,
          colorEntry.numHex,
          16,
          68,
          0.38,
          3.2
        );
        if (this.themeId === 'stained_glass') {
          soundManager.playCrystalShatter();
          this.spawnParticles(plate.body.position.x, plate.body.position.y, colorEntry.numHex, 24, 'shard');
        } else if (this.themeId === 'knit_yarn') {
          soundManager.playYarnUnravel();
          this.spawnParticles(plate.body.position.x, plate.body.position.y, colorEntry.numHex, 20, 'circle');
        } else {
          soundManager.playPlateClack();
          this.spawnParticles(plate.body.position.x, plate.body.position.y, colorEntry.numHex, 18, 'shard');
        }
      }
    }
  }

  private emitTelemetry() {
    if (!this.callbacks.onTelemetryChange) return;
    const plateItems: PlateTelemetryItem[] = Array.from(this.plates.values()).map((p) => {
      const cat = 1 << p.def.layerIndex;
      return {
        id: p.def.id,
        layerIndex: p.def.layerIndex,
        color: p.def.color,
        pinCount: p.attachedPinIds.size,
        mode: p.cleared ? 'cleared' : p.mode,
        categoryHex: `0x000${cat.toString(16)}`,
      };
    });

    let remainingPins = 0;
    let occludedPins = 0;
    for (const pin of this.pins.values()) {
      if (!pin.removed) {
        remainingPins++;
        if (pin.occluded) occludedPins++;
      }
    }

    const clearedPlates = plateItems.filter((p) => p.mode === 'cleared').length;
    const pendulumPlates = plateItems.filter((p) => p.mode === 'pendulum').length;
    this.callbacks.onTelemetryChange({
      plates: plateItems,
      remainingPins,
      occludedPins,
      movablePins: this.movableHintPinIds.size,
      idleHintActive: this.idleHintActive,
      hintedPinIds: Array.from(this.movableHintPinIds),
      pendulumPlates,
      clearedPlates,
      totalPlates: plateItems.length,
    });
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05);
    this.elapsedSec += dt;

    // Decaying trauma^2 micro-camera shake (always ticks smoothly in real dt)
    if (this.cameraTrauma > 0.005) {
      const shake = this.cameraTrauma * this.cameraTrauma * 5.2;
      this.cameras.main.scrollX = (Math.sin(this.elapsedSec * 78) * 0.7 + (Math.random() - 0.5) * 0.6) * shake;
      this.cameras.main.scrollY = (Math.cos(this.elapsedSec * 64) * 0.7 + (Math.random() - 0.5) * 0.6) * shake;
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.6);
    } else if (this.cameraTrauma > 0) {
      this.cameraTrauma = 0;
      this.cameras.main.scrollX = 0;
      this.cameras.main.scrollY = 0;
    }

    // Update pooled floating canvas callouts
    for (let i = 0; i < this.calloutPool.length; i++) {
      const c = this.calloutPool[i];
      if (!c.active) continue;
      c.life += dt;
      if (c.life >= c.maxLife) {
        c.active = false;
        c.text.setVisible(false);
        continue;
      }
      const p = c.life / c.maxLife;
      const easeOut = 1 - Math.pow(1 - p, 3);
      c.text.setY(c.startY - easeOut * 34);
      const scale = p < 0.18 ? 0.72 + (p / 0.18) * 0.42 : 1.14 - (p - 0.18) * 0.22;
      c.text.setScale(scale);
      c.text.setAlpha(p > 0.65 ? Math.max(0, 1 - (p - 0.65) / 0.35) : 1);
    }

    // Animate Parcel 1 first-tap diegetic coach cleanly
    if (this.firstTapCoachText && this.firstTapCoachText.visible) {
      const pin4 = this.pins.get('l1-pin-4');
      if (pin4 && !pin4.removed && this.removedPinIds.size === 0) {
        const bob = Math.sin(this.elapsedSec * 4.5) * 3.5;
        this.firstTapCoachText.setPosition(pin4.container.x + 8, pin4.container.y - 34 + bob);
      } else {
        this.firstTapCoachText.setVisible(false);
      }
    }

    // Brief sim-level hitstop freeze on heavy wax breaks & signet unlocks
    if (this.hitstopSec > 0) {
      this.hitstopSec = Math.max(0, this.hitstopSec - dt);
      this.updateAndRenderParticles(dt);
      return;
    }

    // 5-Second Idle Visual Hint Timer (tracks wall-clock milliseconds via performance.now())
    if (!this.levelCompletedTriggered) {
      this.refreshIdleHintEvaluation(true);
    }

    // Smoothly interpolate explodeFactor towards target
    const targetExplode = this.explodePeek ? 1 : 0;
    if (Math.abs(this.explodeFactor - targetExplode) > 0.01) {
      this.explodeFactor = Phaser.Math.Linear(this.explodeFactor, targetExplode, Math.min(1, dt * 14));
    } else {
      this.explodeFactor = targetExplode;
    }

    if (this.nudgePulseAlpha > 0) {
      this.nudgePulseAlpha = Math.max(0, this.nudgePulseAlpha - dt * 2.8);
    }

    // Update plates
    for (const plate of this.plates.values()) {
      if (plate.cleared) continue;

      if (plate.blockFlashAlpha > 0) {
        plate.blockFlashAlpha = Math.max(0, plate.blockFlashAlpha - dt * 3.2);
      }

      if (plate.body.position.y > 610) {
        plate.cleared = true;
        plate.mode = 'cleared';
        plate.graphics.clear();
        this.matter.world.remove(plate.body);
        this.callbacks.onPlateCleared(plate.def.id);
        this.updateAllPinOcclusions();
        this.emitTelemetry();
        this.checkAllPlatesCleared();
        continue;
      }

      this.renderPlate(plate);
    }

    // Keep unremoved pins locked in 1:1 register with their layer's 2.5D tilt & explode offset
    for (const pin of this.pins.values()) {
      if (pin.removed) continue;
      const offset = computeLayerExplodeOffset(
        pin.def.layerIndex,
        this.explodeFactor,
        this.spatialTiltEnabled,
        this.tiltX,
        this.tiltY
      );
      pin.container.setPosition(
        pin.def.x + offset.offsetX,
        pin.def.y + offset.offsetY
      );
    }

    // Animate extracted pins along their quadratic Bezier flight arc to the top dock
    for (let i = this.flyingPins.length - 1; i >= 0; i--) {
      const fp = this.flyingPins[i];
      fp.elapsed += dt;
      fp.trailTimer += dt;
      const progress = Math.min(1, fp.elapsed / fp.duration);
      const pt = computeBezierFlightPoint(
        fp.startX,
        fp.startY,
        fp.targetX,
        fp.targetY,
        progress
      );
      fp.container.setPosition(pt.x, pt.y);
      fp.container.setScale(pt.scaleX, pt.scaleY);
      fp.container.setAngle(pt.angleDeg);
      fp.container.setAlpha(pt.alpha);

      if (fp.trailTimer >= 0.032 && progress < 0.88) {
        fp.trailTimer = 0;
        this.spawnParticles(pt.x, pt.y, fp.colorHex, 2, 'circle');
      }

      if (progress >= 1) {
        this.spawnShockwave(fp.targetX, fp.targetY + 8, fp.colorHex, 6, 28, 0.22, 2.2);
        fp.container.destroy();
        this.flyingPins.splice(i, 1);
      }
    }

    // Update pooled particles + shockwave rings + ambient candlelight motes + 5s idle hint halos
    this.updateAndRenderParticles(dt);

    // Periodically re-evaluate occlusions as pendulum plates swing
    if (this.game.loop.frame % 5 === 0) {
      this.updateAllPinOcclusions();
    }
  }

  private updateAndRenderParticles(dt: number) {
    this.particleGraphics.clear();

    // Gentle Ambient Candlelight Gold Dust Motes drifting over the oiled walnut desk
    for (let i = 0; i < this.ambientMotes.length; i++) {
      const m = this.ambientMotes[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.y < 36) {
        m.y = 508;
        m.x = 34 + ((i * 67 + Math.round(this.elapsedSec * 19)) % 332);
      }
      if (m.x < 30) m.x = 368;
      if (m.x > 370) m.x = 32;
      const flicker = 0.14 + 0.18 * (0.5 + 0.5 * Math.sin(this.elapsedSec * 2.2 + m.phase));
      this.particleGraphics.fillStyle(0xfef08a, flicker);
      this.particleGraphics.fillCircle(m.x, m.y, m.radius);
    }

    // Render Tied Gold-Threaded Satin Bow Cord between paired BOW seals
    const drawnPairs = new Set<string>();
    for (const pin of this.pins.values()) {
      if (pin.removed || !pin.def.chainedWithPinId) continue;
      const partner = this.pins.get(pin.def.chainedWithPinId);
      if (!partner || partner.removed) continue;
      const pairKey = [pin.def.id, partner.def.id].sort().join('--');
      if (drawnPairs.has(pairKey)) continue;
      drawnPairs.add(pairKey);

      const x1 = pin.container.x;
      const y1 = pin.container.y;
      const x2 = partner.container.x;
      const y2 = partner.container.y;

      // Rich silk shadow + braided crimson-gold ribbon tether
      this.particleGraphics.lineStyle(6.2, 0x1a0c0a, 0.78);
      this.particleGraphics.lineBetween(x1, y1 + 2.5, x2, y2 + 2.5);
      this.particleGraphics.lineStyle(3.8, 0xe11d48, 0.94);
      this.particleGraphics.lineBetween(x1, y1, x2, y2);
      this.particleGraphics.lineStyle(1.4, 0xfef08a, 0.95);
      this.particleGraphics.lineBetween(x1, y1, x2, y2);

      // Center satin bow knot medallion
      const mx = (x1 + x2) * 0.5;
      const my = (y1 + y2) * 0.5;
      this.particleGraphics.fillStyle(0xf59e0b, 0.98);
      this.particleGraphics.fillCircle(mx - 5, my, 3.6);
      this.particleGraphics.fillCircle(mx + 5, my, 3.6);
      this.particleGraphics.fillStyle(0xfef08a, 1);
      this.particleGraphics.fillCircle(mx, my, 3.2);
    }

    // Render 5-Second Idle Visual Hint System: Pulsing 2.5D Halos & Compass Reticles on Movable (Unoccluded) Pins
    if (this.idleHintActive && this.movableHintPinIds.size > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(this.elapsedSec * 6.5);
      for (const pinId of this.movableHintPinIds) {
        const pin = this.pins.get(pinId);
        if (!pin || pin.removed || pin.occluded) continue;

        const px = pin.container.x;
        const py = pin.container.y;
        const r = pin.radius;
        const isPreferred = this.preferredHintPinIds.has(pinId);
        const isRecommended = this.recommendedHintPinId === pinId;

        const primaryHaloHex = isPreferred ? 0xfbbf24 : 0x10b981;
        const innerRingHex = isPreferred ? 0xfef08a : 0x6ee7b7;

        // 1. Expanding outer sonar hint aura
        const outerRadius = r + 5.5 + pulse * 6.5;
        const outerAlpha = (0.86 - pulse * 0.48) * (isPreferred ? 1 : 0.85);
        this.particleGraphics.lineStyle(isPreferred ? 2.8 : 2.2, primaryHaloHex, outerAlpha);
        this.particleGraphics.strokeCircle(px, py, outerRadius);

        // 2. Crisp inner target collar
        this.particleGraphics.lineStyle(2.2, innerRingHex, 0.94);
        this.particleGraphics.strokeCircle(px, py, r + 3.4);

        // 3. 4 rotating compass diamond pips around circumference (non-hue-only geometric affordance)
        for (let k = 0; k < 4; k++) {
          const theta = this.elapsedSec * 2.1 + (k * Math.PI) / 2;
          const tx = px + Math.cos(theta) * (r + 4.2);
          const ty = py + Math.sin(theta) * (r + 4.2);
          this.particleGraphics.fillStyle(innerRingHex, 0.96);
          this.particleGraphics.fillCircle(tx, ty, isPreferred ? 2.4 : 1.9);
        }

        // 4. Bouncing golden target chevron above recommended / crate-matching movable pins
        if (isPreferred || isRecommended) {
          const chevronY = py - r - 18 - pulse * 3.5;
          this.particleGraphics.fillStyle(0xfbbf24, 0.98);
          this.particleGraphics.fillTriangle(
            px - 5.5,
            chevronY - 5,
            px + 5.5,
            chevronY - 5,
            px,
            chevronY + 2
          );
          this.particleGraphics.lineStyle(1.2, 0x0f172a, 0.95);
          this.particleGraphics.strokeTriangle(
            px - 5.5,
            chevronY - 5,
            px + 5.5,
            chevronY - 5,
            px,
            chevronY + 2
          );
        }
      }
    }

    // Render Kinetic Gravity Nudge directional shockwave arc when active
    if (this.nudgePulseAlpha > 0.02) {
      this.particleGraphics.lineStyle(2.5, 0x38bdf8, this.nudgePulseAlpha * 0.75);
      const radius = 50 + (1 - this.nudgePulseAlpha) * 140;
      this.particleGraphics.strokeCircle(200, 285, radius);

      // Directional kinetic vector chevrons
      const dirX = this.nudgeDirection === 'left' ? -1 : this.nudgeDirection === 'right' ? 1 : 0;
      const cx = 200 + dirX * 55;
      this.particleGraphics.lineStyle(2, 0xfbbf24, this.nudgePulseAlpha * 0.9);
      this.particleGraphics.strokeCircle(cx, 285, 18);
    }

    // Render expanding pooled shockwave rings
    for (let i = 0; i < this.shockwavePool.length; i++) {
      const sw = this.shockwavePool[i];
      if (!sw.active) continue;
      sw.life += dt;
      if (sw.life >= sw.maxLife) {
        sw.active = false;
        continue;
      }
      const p = sw.life / sw.maxLife;
      const eased = 1 - Math.pow(1 - p, 3);
      const currentRadius = sw.startRadius + (sw.endRadius - sw.startRadius) * eased;
      const alpha = (1 - p) * 0.85;
      this.particleGraphics.lineStyle(sw.lineWidth * (1 - p * 0.5), sw.color, alpha);
      this.particleGraphics.strokeCircle(sw.x, sw.y, currentRadius);
    }

    // Render pooled particles (rotating diamond shards & glowing sparks)
    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.angle += p.vAngle * dt;

      const progress = p.life / p.maxLife;
      const alpha = 1 - progress;
      this.particleGraphics.fillStyle(p.color, alpha);
      if (p.shape === 'shard') {
        const s = p.size * (1 - progress * 0.3);
        this.particleGraphics.save();
        this.particleGraphics.translateCanvas(p.x, p.y);
        this.particleGraphics.rotateCanvas(p.angle);
        this.particleGraphics.fillRect(-s / 2, -s * 0.7, s, s * 1.4);
        this.particleGraphics.fillStyle(0xffffff, alpha * 0.65);
        this.particleGraphics.fillRect(-s * 0.2, -s * 0.4, s * 0.4, s * 0.5);
        this.particleGraphics.restore();
      } else {
        const r = p.size * (1 - progress * 0.4);
        this.particleGraphics.fillCircle(p.x, p.y, r);
        this.particleGraphics.fillStyle(0xffffff, alpha * 0.5);
        this.particleGraphics.fillCircle(p.x - r * 0.25, p.y - r * 0.25, r * 0.4);
      }
    }
  }

  private renderPlate(plate: RuntimePlate) {
    const g = plate.graphics;
    g.clear();

    const { position, angle } = plate.body;
    const { width, height, layerIndex, color } = plate.def;
    const colorEntry = PIN_COLORS[color] || PIN_COLORS.amber;

    const halfW = width / 2;
    const halfH = height / 2;
    const radius = Math.min(14, halfH);

    // 2.5D Spatial Depth Parallax + Candlelight Layer Explode offset (L0..L3)
    const explodeOffset = computeLayerExplodeOffset(
      layerIndex,
      this.explodeFactor,
      this.spatialTiltEnabled,
      this.tiltX,
      this.tiltY
    );
    const layerParallaxX = explodeOffset.offsetX;
    const layerParallaxY = explodeOffset.offsetY;

    if (this.explodeFactor > 0.05) {
      g.lineStyle(1.5, 0xfbbf24, 0.65 * this.explodeFactor);
      g.lineBetween(position.x, position.y, position.x + layerParallaxX, position.y + layerParallaxY);
      g.fillStyle(0xfef08a, 0.85 * this.explodeFactor);
      g.fillCircle(position.x, position.y, 3);
    }

    g.save();
    g.translateCanvas(position.x + layerParallaxX, position.y + layerParallaxY);
    g.rotateCanvas(angle);

    // 1. Warm espresso cast shadow onto lower ribbon layers
    const shadowOffsetX = 2 + layerIndex * 1.8 - layerParallaxX * 0.25;
    const shadowOffsetY = 4.8 + layerIndex * 2.8 - layerParallaxY * 0.25;
    g.fillStyle(0x0b0604, this.xrayMode ? 0.16 : (0.44 + layerIndex * 0.06) * explodeOffset.alphaMultiplier);
    g.fillRoundedRect(-halfW + shadowOffsetX, -halfH + shadowOffsetY, width, height, radius);

    // 2. Cream-Parchment Backing Thickness Lip underneath each satin ribbon
    const extrusionDepth = 4.0 + layerIndex * 0.65 + explodeOffset.extrusionBoost;
    g.fillStyle(0xd8c3a5, this.xrayMode ? 0.28 : 0.88 * explodeOffset.alphaMultiplier);
    g.fillRoundedRect(-halfW, -halfH + extrusionDepth, width, height, radius);

    // 3. Woven Satin Ribbon Body (Translucent under Backlight [X])
    const rawBaseAlpha = this.xrayMode
      ? layerIndex === 0
        ? 0.56
        : 0.26
      : 0.92;
    const baseAlpha = rawBaseAlpha * explodeOffset.alphaMultiplier;
    g.fillStyle(colorEntry.numHex, baseAlpha);
    g.fillRoundedRect(-halfW, -halfH, width, height, radius);

    // 4. Candlelight Satin Sheen + Color-Blind Woven Stitch Patterns
    if (!this.xrayMode) {
      const sweep = computeSpecularSweepOffset(this.tiltX, this.tiltY, this.elapsedSec + layerIndex * 0.6, width);
      const sx = Phaser.Math.Clamp(sweep.sweepCenterX, -halfW + 18, halfW - 18);
      g.fillStyle(0xfffbeb, sweep.shimmerAlpha * 0.95 * explodeOffset.alphaMultiplier);
      g.fillRoundedRect(
        sx - sweep.bandWidth * 0.5,
        -halfH + 3,
        sweep.bandWidth,
        height - 6,
        Math.min(7, radius * 0.5)
      );

      // Unique Color-Blind Woven Textile Stitch Patterns per Ribbon Color
      const insetX = Math.max(12, halfW - 14);
      const stitchY = Math.max(5, halfH - 7);
      if (colorEntry.weavePattern === 'double_gold') {
        // Royal Crimson: Double Gold-Thread Selvedge Rails
        g.lineStyle(1.4, 0xfde68a, 0.72);
        g.lineBetween(-insetX, -stitchY, insetX, -stitchY);
        g.lineBetween(-insetX, stitchY, insetX, stitchY);
        g.lineStyle(0.9, 0xfef08a, 0.42);
        g.lineBetween(-insetX + 6, -stitchY + 3, insetX - 6, -stitchY + 3);
        g.lineBetween(-insetX + 6, stitchY - 3, insetX - 6, stitchY - 3);
      } else if (colorEntry.weavePattern === 'guild_stripe') {
        // Sunlit Ochre: Center Woven Guild Stripe
        g.fillStyle(0xfffbeb, 0.22);
        g.fillRect(-insetX, -4, insetX * 2, 8);
        g.lineStyle(1.3, 0x78350f, 0.52);
        g.lineBetween(-insetX, -4, insetX, -4);
        g.lineBetween(-insetX, 4, insetX, 4);
      } else if (colorEntry.weavePattern === 'herringbone') {
        // Imperial Emerald: Stitched Herringbone Chevron Weave
        g.lineStyle(1.3, 0xa7f3d0, 0.55);
        for (let cx = -halfW + 16; cx < halfW - 16; cx += 14) {
          g.lineBetween(cx - 4, -5, cx + 1, 0);
          g.lineBetween(cx + 1, 0, cx - 4, 5);
        }
      } else if (colorEntry.weavePattern === 'pearl_dash') {
        // Ultramarine: Stitched Pearl-Dash Embroidery
        g.fillStyle(0xe0f2fe, 0.72);
        for (let cx = -halfW + 18; cx < halfW - 16; cx += 16) {
          g.fillRoundedRect(cx - 4, -1.5, 8, 3, 1.5);
        }
      } else {
        // Byzantine Plum: Scallop Lace Diamond Trim
        g.lineStyle(1.3, 0xf3e8ff, 0.6);
        for (let cx = -halfW + 18; cx < halfW - 18; cx += 18) {
          g.strokeCircle(cx, 0, 4.2);
        }
      }

      // Gold-stitched ribbon selvedge border
      const rimColor =
        plate.blockFlashAlpha > 0.05
          ? 0xfda4af
          : this.explodeFactor > 0.1
          ? 0xfef08a
          : plate.mode === 'pendulum'
          ? 0xfef08a
          : 0xf59e0b;
      g.lineStyle(plate.blockFlashAlpha > 0.05 ? 3.2 : 2.1, rimColor, 0.9);
      g.strokeRoundedRect(-halfW, -halfH, width, height, radius);

      // Soft satin top bevel highlight
      g.fillStyle(0xfffbeb, 0.2 * explodeOffset.alphaMultiplier);
      g.fillRoundedRect(-halfW + 8, -halfH + 3, Math.max(16, width - 16), 5.5, 2.8);
    } else {
      g.lineStyle(2, 0xfef08a, 0.78);
      g.strokeRoundedRect(-halfW, -halfH, width, height, radius);
    }

    // 5. Burnished Brass Ribbon Grommets + Pendulum Pivot Aura
    for (let i = 0; i < plate.holeOffsets.length; i++) {
      const hole = plate.holeOffsets[i];
      const isOccupied = plate.attachedPinIds.has(hole.pinId);

      g.fillStyle(0x140c09, isOccupied ? 0.56 : 0.92);
      g.fillCircle(hole.localX, hole.localY, 10.2);

      g.lineStyle(1.8, 0xfbbf24, isOccupied ? 0.5 : 0.85);
      g.strokeCircle(hole.localX, hole.localY, 10.8);

      if (isOccupied && plate.mode === 'pendulum') {
        const pulseRadius = 14.5 + Math.sin(this.elapsedSec * 7) * 1.8;
        g.lineStyle(1.8, 0xfef08a, 0.88);
        g.strokeCircle(hole.localX, hole.localY, pulseRadius);
      }
    }

    g.restore();
  }

  private checkAllPlatesCleared() {
    if (this.levelCompletedTriggered) return;
    let allCleared = true;
    for (const plate of this.plates.values()) {
      if (!plate.cleared) {
        allCleared = false;
        break;
      }
    }
    if (allCleared) {
      this.levelCompletedTriggered = true;
      this.callbacks.onLevelComplete();
    }
  }
}

function plateDefAngle(def: LevelPlateDef): number {
  return def.angle || 0;
}
