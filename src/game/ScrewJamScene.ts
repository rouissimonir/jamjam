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

const PARTICLE_POOL_SIZE = 84;
const SHOCKWAVE_POOL_SIZE = 16;

export class ScrewJamScene extends Phaser.Scene {
  private levelConfig!: LevelConfig;
  private callbacks!: SceneCallbacks;
  private plates: Map<string, RuntimePlate> = new Map();
  private pins: Map<string, RuntimePin> = new Map();
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private particleGraphics!: Phaser.GameObjects.Graphics;
  private particlePool: PooledParticle[] = [];
  private shockwavePool: PooledShockwave[] = [];
  private flyingPins: ActiveFlyingPin[] = [];
  private elapsedSec: number = 0;
  private isInteracting: boolean = false;
  private xrayMode: boolean = false;
  private explodePeek: boolean = false;
  private explodeFactor: number = 0;
  private nudgePulseAlpha: number = 0;
  private nudgeDirection: GravityNudgeDirection = 'right';
  private themeId: TactileThemeId = 'stained_glass';
  private finialSkinId: FinialSkinId = 'royal_brass';
  private removedPinIds: Set<string> = new Set();
  private spatialTiltEnabled: boolean = true;
  private tiltX: number = 0.35; // 2.5D spatial tilt (-1..1)
  private tiltY: number = 0.45;
  private levelCompletedTriggered: boolean = false;
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
  }

  init(data?: {
    levelConfig?: LevelConfig;
    callbacks?: SceneCallbacks;
    xrayMode?: boolean;
    themeId?: TactileThemeId;
    finialSkinId?: FinialSkinId;
    spatialTiltEnabled?: boolean;
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
    this.explodePeek = false;
    this.explodeFactor = 0;
    this.nudgePulseAlpha = 0;
    this.elapsedSec = 0;
    this.plates.clear();
    this.pins.clear();
    this.removedPinIds.clear();
    this.flyingPins = [];
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

  /**
   * Competitive Feature 1B: Layer Explode Peek (2.5D Hold/Toggle Layer Separation)
   * Separates the 4 stacked layers outward so players can inspect hidden pins and overlaps.
   */
  public setExplodePeek(enabled: boolean) {
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

    // Outer cast-iron bezel shadow
    this.boardGraphics.fillStyle(0x070a10, 0.92);
    this.boardGraphics.fillRoundedRect(x - 4, y - 2, width + 8, height + 8, 20);

    // Theme-tuned tactile surface
    this.boardGraphics.fillStyle(themeSpec.boardTintHex, 0.98);
    this.boardGraphics.fillRoundedRect(x, y, width, height, 16);

    // Outer frame stroke
    this.boardGraphics.lineStyle(2.5, 0x475569, 0.85);
    this.boardGraphics.strokeRoundedRect(x, y, width, height, 16);

    // Inner recessed theme rule hairline
    this.boardGraphics.lineStyle(1.2, themeSpec.frameStrokeHex, 0.3);
    this.boardGraphics.strokeRoundedRect(x + 8, y + 8, width - 16, height - 16, 12);

    // Corner mounting clasps/pins on the frame
    const corners = [
      { cx: x + 16, cy: y + 16 },
      { cx: x + width - 16, cy: y + 16 },
      { cx: x + 16, cy: y + height - 16 },
      { cx: x + width - 16, cy: y + height - 16 },
    ];
    for (const c of corners) {
      this.boardGraphics.fillStyle(0x334155, 1);
      this.boardGraphics.fillCircle(c.cx, c.cy, 5);
      this.boardGraphics.lineStyle(1, themeSpec.frameStrokeHex, 0.7);
      this.boardGraphics.strokeCircle(c.cx, c.cy, 5);
      this.boardGraphics.fillStyle(0x0f172a, 1);
      this.boardGraphics.fillCircle(c.cx, c.cy, 2);
    }

    // Tactile pegboard / embroidery / PCB grid
    for (let hx = x + 30; hx <= x + width - 30; hx += 30) {
      for (let hy = y + 33; hy <= y + height - 30; hy += 30) {
        this.boardGraphics.fillStyle(0x0b0f17, 0.95);
        this.boardGraphics.fillCircle(hx, hy, 4.2);
        this.boardGraphics.lineStyle(0.8, 0x263248, 0.7);
        this.boardGraphics.strokeCircle(hx, hy, 4.5);
      }
    }

    // Bottom drop-chute hazard hatching zone (where freed plates fall out)
    const chuteY = y + height - 22;
    this.boardGraphics.fillStyle(0x0b0f17, 0.75);
    this.boardGraphics.fillRoundedRect(x + 28, chuteY, width - 56, 12, 4);
    this.boardGraphics.lineStyle(1, themeSpec.frameStrokeHex, 0.35);
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
      // Rule 4: High-Craft Recessed Security Cage for Occluded Pins
      g.fillStyle(0x060911, 0.92);
      g.fillCircle(0, 2.5, r + 2.5);

      // Dimmed inner pin core trapped behind steel cage
      g.fillStyle(colorEntry.numHex, 0.36);
      g.fillCircle(0, 0, r - 1.5);

      // Outer gunmetal lock ring + 4 cardinal security clamps
      g.lineStyle(2.2, 0x64748b, 0.85);
      g.strokeCircle(0, 0, r);
      for (let a = 0; a < 4; a++) {
        const rad = (a * Math.PI) / 2;
        const cx = Math.cos(rad) * r;
        const cy = Math.sin(rad) * r;
        g.fillStyle(0x94a3b8, 0.9);
        g.fillCircle(cx, cy, 2.2);
      }

      // High-contrast recessed X-bar lock + ruby warning core
      g.lineStyle(2.2, 0xfda4af, 0.75);
      g.lineBetween(-r * 0.44, -r * 0.44, r * 0.44, r * 0.44);
      g.lineBetween(-r * 0.44, r * 0.44, r * 0.44, -r * 0.44);
      g.fillStyle(0xf43f5e, 0.9);
      g.fillCircle(0, 0, 2.8);

      if (this.xrayMode || this.explodePeek) {
        pin.badgeText.setText(`L${pin.def.layerIndex}·${Math.round(pin.overlapRatio * 100)}%`);
        pin.badgeText.setVisible(true);
      } else {
        pin.badgeText.setVisible(false);
      }
    } else if (this.themeId === 'stained_glass') {
      // 3rd-Gen Theme 1: Scalloped 8-Prong Brass Cathedral Clasp + Faceted Jewel Cabochon
      g.fillStyle(0x000000, 0.52);
      g.fillCircle(1.5, 4, r + 2);

      // Outer antique gold bezel ring
      g.fillStyle(0xd97706, 1);
      g.fillCircle(0, 1, r + 1);
      g.fillStyle(0xfbbf24, 1);
      g.fillCircle(0, 0, r + 0.5);

      // 8 radial jewelers' filigree prongs around perimeter
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const px = Math.cos(a) * (r + 0.5);
        const py = Math.sin(a) * (r + 0.5);
        g.fillStyle(0xfef08a, 0.95);
        g.fillCircle(px, py, 2);
      }

      // Deep jewel cabochon base + inner bright facet table
      g.fillStyle(colorEntry.numHex, 1);
      g.fillCircle(0, 0, r - 2.2);

      // Inner diamond crystal facet lines
      g.lineStyle(1.2, 0xffffff, 0.45);
      g.strokeCircle(0, 0, r - 5.2);
      g.lineBetween(-r + 4, 0, r - 4, 0);
      g.lineBetween(0, -r + 4, 0, r - 4);

      // 4-point cathedral specular star glint
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(-3.2, -3.2, 2.6);
      g.lineStyle(1.4, 0xffffff, 0.9);
      g.lineBetween(-6.5, -3.2, 0.2, -3.2);
      g.lineBetween(-3.2, -6.5, -3.2, 0.2);
      g.fillStyle(0xfef08a, 0.75);
      g.fillCircle(3.2, 3.2, 1.5);
    } else if (this.themeId === 'knit_yarn') {
      // 3rd-Gen Theme 2: Mother-of-Pearl Haberdashery Pin + Wrapped Embroidery Thread Loop
      g.fillStyle(0x000000, 0.48);
      g.fillCircle(1.5, 4.2, r + 1.5);

      // Stitched embroidery thread loop figure-8 tail underneath collar
      g.lineStyle(2.2, colorEntry.numHex, 0.95);
      g.strokeCircle(-4.5, 4.5, 4.2);
      g.strokeCircle(4.5, 4.5, 4.2);

      // Polished silver needle collar
      g.fillStyle(0xe2e8f0, 0.98);
      g.fillCircle(0, 2.2, r - 2.5);

      // Glossy spherical pearl pin head
      g.fillStyle(colorEntry.numHex, 1);
      g.fillCircle(0, 0, r);

      // Outer satin lustre ring + inner pearl halo
      g.lineStyle(2, 0xffffff, 0.72);
      g.strokeCircle(0, 0, r - 1.4);
      g.lineStyle(1, 0xffffff, 0.35);
      g.strokeCircle(0, -1, r - 4.2);

      // Dual curved pearl specular highlights
      g.fillStyle(0xffffff, 0.94);
      g.fillCircle(-4, -4, 3.4);
      g.fillStyle(0xffffff, 0.55);
      g.fillCircle(-1.2, -5.8, 1.6);
      g.fillStyle(0xffffff, 0.48);
      g.fillCircle(3.8, 3.8, 1.8);
    } else {
      // 3rd-Gen Theme 3: Precision CNC Anodized Chrono Hex-Cap Fastener
      g.fillStyle(0x000000, 0.52);
      g.fillCircle(1.5, 4, r + 1.8);

      // Brushed titanium base flange with 6 knurled perimeter notches
      g.fillStyle(0x334155, 0.98);
      g.fillCircle(0, 1.5, r + 1);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        g.fillStyle(0x94a3b8, 0.9);
        g.fillCircle(Math.cos(a) * r, Math.sin(a) * r, 2.1);
      }

      // Anodized color cap
      g.fillStyle(colorEntry.numHex, 1);
      g.fillCircle(0, 0, r - 1);

      // Gold watchmaker escapement ring
      g.lineStyle(2, 0xfef08a, 0.8);
      g.strokeCircle(0, 0, r - 2.4);

      // Recessed precision tri-wing socket + center jewel bearing
      g.fillStyle(0x0f172a, 0.9);
      g.fillCircle(0, 0, 4.2);
      g.lineStyle(2.4, 0x0f172a, 0.92);
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
        g.lineBetween(0, 0, Math.cos(a) * (r * 0.54), Math.sin(a) * (r * 0.54));
      }
      g.fillStyle(0xfbbf24, 1);
      g.fillCircle(0, 0, 1.8);

      // Crisp CNC chamfer highlight
      g.fillStyle(0xffffff, 0.82);
      g.fillCircle(-3.6, -3.6, 2.3);
    }

    // Toolsmith Finial Skin Center Emblem & Star-Keyhole Clasp / Padlock Overlays
    const isPadlocked = Boolean(
      pin.def.lockedByKeyPinId && !this.removedPinIds.has(pin.def.lockedByKeyPinId)
    );
    const isKeyPin = Boolean(pin.def.isKeyPin);
    const finialSpec = FINIAL_SKINS[this.finialSkinId] || FINIAL_SKINS.royal_brass;

    if (!pin.occluded && this.finialSkinId !== 'royal_brass') {
      g.lineStyle(1.8, finialSpec.bezelHex, 0.9);
      g.strokeCircle(0, 0, r + 2.2);
      g.fillStyle(finialSpec.coreHex, 0.95);
      g.fillCircle(0, 0, 2.6);
    }

    if (isPadlocked) {
      // 3D Brass Clockwork Padlock Collar & Keyhole Slot
      g.lineStyle(2.6, 0xf59e0b, 0.96);
      g.strokeCircle(0, 0, r + 2.8);
      g.fillStyle(0x141824, 0.88);
      g.fillRoundedRect(-7, -5, 14, 11, 3);
      g.lineStyle(1.8, 0xfbbf24, 1);
      g.strokeRoundedRect(-7, -5, 14, 11, 3);
      // Padlock Shackle Arc above
      g.lineStyle(2.2, 0xfde047, 1);
      g.beginPath();
      g.arc(0, -5, 4.5, Math.PI, 0, false);
      g.strokePath();
      // Keyhole center dot
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(0, -0.5, 1.8);
      pin.badgeText.setText('LOCK');
      pin.badgeText.setVisible(true);
    } else if (isKeyPin) {
      // 3D Golden Star-Keyhole Clasp Crown Emblem
      g.lineStyle(2.4, 0xffe033, 0.98);
      g.strokeCircle(0, 0, r + 3.2);
      // 4 Golden Star Crown Points
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        g.fillStyle(0xffe033, 1);
        g.fillCircle(Math.cos(a) * (r + 3.2), Math.sin(a) * (r + 3.2), 2.4);
      }
      // Center Golden Key Emblem
      g.fillStyle(0x141824, 0.82);
      g.fillCircle(0, 0, 5.2);
      g.fillStyle(0xffd700, 1);
      g.fillCircle(0, -1.2, 3.2);
      g.fillRect(-1.2, 1, 2.4, 3.8);
      pin.badgeText.setText('KEY');
      pin.badgeText.setVisible(true);
    } else if (!pin.occluded) {
      if (this.xrayMode || this.explodePeek) {
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
    if (changed) {
      this.emitTelemetry();
    }
  }

  private handlePinTap(pin: RuntimePin) {
    if (pin.removed || this.isInteracting) return;

    const { occluded, overlapRatio } = this.checkPinOcclusion(pin);
    pin.occluded = occluded;
    pin.overlapRatio = overlapRatio;
    this.renderPinHead(pin);

    if (occluded) {
      haptics.occludedBlocked();
      soundManager.playBlockedThud();
      this.spawnParticles(pin.def.x, pin.def.y, 0xf43f5e, 8, 'shard');
      this.spawnShockwave(pin.def.x, pin.def.y, 0xf43f5e, 8, 34, 0.26, 2.5);

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

    this.pullPin(pin);
  }

  private pullPin(pin: RuntimePin) {
    const lockEval = evaluatePinKeyLock(
      pin.def.id,
      this.levelConfig.pins,
      this.removedPinIds
    );
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

    // If this pin is a Golden Star-Key Clasp, unlock its linked Padlocked Pins with a golden burst!
    if (lockEval.isKeyPin && lockEval.unlockedPinIds.length > 0) {
      soundManager.playKeyUnlockChime();
      for (const unlockedId of lockEval.unlockedPinIds) {
        const targetLockedPin = this.pins.get(unlockedId);
        if (targetLockedPin && !targetLockedPin.removed) {
          this.renderPinHead(targetLockedPin);
          this.spawnParticles(targetLockedPin.def.x, targetLockedPin.def.y, 0xffe033, 18, 'shard');
          this.spawnShockwave(targetLockedPin.def.x, targetLockedPin.def.y, 0xffe033, 12, 52, 0.38, 3.2);
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
        const colorEntry = PIN_COLORS[plate.def.color] || PIN_COLORS.amber;
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
      pendulumPlates,
      clearedPlates,
      totalPlates: plateItems.length,
    });
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05);
    this.elapsedSec += dt;

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

    // Update pooled particles + shockwave rings + kinetic shockwave overlay
    this.updateAndRenderParticles(dt);

    // Periodically re-evaluate occlusions as pendulum plates swing
    if (this.game.loop.frame % 5 === 0) {
      this.updateAllPinOcclusions();
    }
  }

  private updateAndRenderParticles(dt: number) {
    this.particleGraphics.clear();

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
    const radius = Math.min(16, halfH);

    // Pillar B + Feature 1B: 2.5D Spatial Depth Parallax + Layer Explode Peek offset per layer (0..3)
    const explodeOffset = computeLayerExplodeOffset(
      layerIndex,
      this.explodeFactor,
      this.spatialTiltEnabled,
      this.tiltX,
      this.tiltY
    );
    const layerParallaxX = explodeOffset.offsetX;
    const layerParallaxY = explodeOffset.offsetY;

    // When Layer Explode Peek is active, draw a CAD assembly tether line from true position to exploded plate position
    if (this.explodeFactor > 0.05) {
      g.lineStyle(1.5, 0x38bdf8, 0.65 * this.explodeFactor);
      g.lineBetween(position.x, position.y, position.x + layerParallaxX, position.y + layerParallaxY);
      g.fillStyle(0x38bdf8, 0.8 * this.explodeFactor);
      g.fillCircle(position.x, position.y, 3);
    }

    g.save();
    g.translateCanvas(position.x + layerParallaxX, position.y + layerParallaxY);
    g.rotateCanvas(angle);

    // 1. Layer-scaled ambient drop shadow onto lower layers
    const shadowOffsetX = 2 + layerIndex * 1.8 - layerParallaxX * 0.25;
    const shadowOffsetY = 4.5 + layerIndex * 2.8 - layerParallaxY * 0.25;
    g.fillStyle(0x000000, this.xrayMode ? 0.16 : (0.38 + layerIndex * 0.06) * explodeOffset.alphaMultiplier);
    g.fillRoundedRect(-halfW + shadowOffsetX, -halfH + shadowOffsetY, width, height, radius);

    // 2. 2.5D Extruded Side Thickness Rim (spatial toy/object depth + exploded boost)
    const extrusionDepth = 4.2 + layerIndex * 0.7 + explodeOffset.extrusionBoost;
    g.fillStyle(
      this.themeId === 'stained_glass' ? 0x451a03 : 0x0f172a,
      this.xrayMode ? 0.35 : 0.86 * explodeOffset.alphaMultiplier
    );
    g.fillRoundedRect(-halfW, -halfH + extrusionDepth, width, height, radius);

    // 3. Theme-Specific Translucent Body
    const rawBaseAlpha = this.xrayMode
      ? layerIndex === 0
        ? 0.55
        : 0.24
      : this.themeId === 'stained_glass'
      ? 0.74 + layerIndex * 0.04
      : 0.82 + layerIndex * 0.04;
    const baseAlpha = rawBaseAlpha * explodeOffset.alphaMultiplier;
    g.fillStyle(colorEntry.numHex, baseAlpha);
    g.fillRoundedRect(-halfW, -halfH, width, height, radius);

    // 4. Dynamic 2.5D Specular Light Sweep + Theme-Specific Artisanal Surface Details
    if (!this.xrayMode) {
      const sweep = computeSpecularSweepOffset(this.tiltX, this.tiltY, this.elapsedSec + layerIndex * 0.6, width);
      const sx = Phaser.Math.Clamp(sweep.sweepCenterX, -halfW + 18, halfW - 18);
      g.fillStyle(0xffffff, sweep.shimmerAlpha * explodeOffset.alphaMultiplier);
      g.fillRoundedRect(
        sx - sweep.bandWidth * 0.5,
        -halfH + 3,
        sweep.bandWidth,
        height - 6,
        Math.min(8, radius * 0.5)
      );

      if (this.themeId === 'stained_glass') {
        // Cathedral Stained-Glass Mosaic Mullions + Soldered Gold Nodes
        g.lineStyle(1.5, 0xfde68a, 0.48);
        g.lineBetween(-halfW * 0.58, -halfH, -halfW * 0.18, halfH);
        g.lineBetween(halfW * 0.18, -halfH, halfW * 0.58, halfH);
        g.lineBetween(-halfW * 0.38, 0, halfW * 0.38, 0);
        g.fillStyle(0xfef08a, 0.75);
        g.fillCircle(-halfW * 0.38, 0, 2.2);
        g.fillCircle(halfW * 0.38, 0, 2.2);

        const rimColor =
          plate.blockFlashAlpha > 0.05
            ? 0xf43f5e
            : this.explodeFactor > 0.1
            ? 0x38bdf8
            : plate.mode === 'pendulum'
            ? 0xfef08a
            : 0xfbbf24;
        g.lineStyle(plate.blockFlashAlpha > 0.05 ? 3.2 : 2.3, rimColor, 0.92);
        g.strokeRoundedRect(-halfW, -halfH, width, height, radius);
      } else if (this.themeId === 'knit_yarn') {
        // Woven Chevron Textile Ribbon + Stitched Hem Border
        g.lineStyle(1.3, 0xffffff, 0.32);
        for (let cx = -halfW + 14; cx < halfW - 14; cx += 14) {
          g.lineBetween(cx - 4, -5, cx, 0);
          g.lineBetween(cx, 0, cx - 4, 5);
          g.lineBetween(cx + 2, -5, cx + 6, 0);
          g.lineBetween(cx + 6, 0, cx + 2, 5);
        }
        const rimColor =
          plate.blockFlashAlpha > 0.05
            ? 0xf43f5e
            : this.explodeFactor > 0.1
            ? 0x38bdf8
            : 0xffffff;
        g.lineStyle(2.1, rimColor, 0.78);
        g.strokeRoundedRect(-halfW, -halfH, width, height, radius);
      } else {
        // Retro Console Polycarbonate Shell + Gold PCB Bus & IC Solder Pads
        g.lineStyle(1.4, 0xfef08a, 0.44);
        g.lineBetween(-halfW + 18, -3, halfW - 18, -3);
        g.lineBetween(-halfW + 26, 4, halfW - 26, 4);
        g.fillStyle(0xfef08a, 0.75);
        g.fillCircle(-halfW + 18, -3, 2.2);
        g.fillCircle(halfW - 18, -3, 2.2);
        g.fillCircle(0, 4, 2.2);

        const rimColor =
          plate.blockFlashAlpha > 0.05
            ? 0xf43f5e
            : this.explodeFactor > 0.1
            ? 0x38bdf8
            : 0xffffff;
        g.lineStyle(2.1, rimColor, 0.72);
        g.strokeRoundedRect(-halfW, -halfH, width, height, radius);
      }

      // Top Specular Bevel Highlight Strip
      g.fillStyle(0xffffff, 0.24 * explodeOffset.alphaMultiplier);
      g.fillRoundedRect(-halfW + 8, -halfH + 3.5, Math.max(16, width - 16), 6.5, 3.2);
    } else {
      g.lineStyle(2, 0xffffff, 0.75);
      g.strokeRoundedRect(-halfW, -halfH, width, height, radius);
    }

    // 5. Physical Machined Grommets / Eyelets + Pendulum Tension Ring
    for (let i = 0; i < plate.holeOffsets.length; i++) {
      const hole = plate.holeOffsets[i];
      const isOccupied = plate.attachedPinIds.has(hole.pinId);

      g.fillStyle(0x0b0f17, isOccupied ? 0.58 : 0.94);
      g.fillCircle(hole.localX, hole.localY, 10.5);

      g.lineStyle(
        1.8,
        this.themeId === 'stained_glass' ? 0xfbbf24 : 0xffffff,
        isOccupied ? 0.45 : 0.72
      );
      g.strokeCircle(hole.localX, hole.localY, 11);

      // When plate is in 1-pin pendulum mode, pulse a golden kinetic pivot ring around the active pin hole
      if (isOccupied && plate.mode === 'pendulum') {
        const pulseRadius = 14.5 + Math.sin(this.elapsedSec * 7) * 1.8;
        g.lineStyle(1.8, 0xfef08a, 0.85);
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
