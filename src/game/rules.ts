export type PinColor = 'crimson' | 'amber' | 'emerald' | 'azure' | 'violet';

export type TactileThemeId = 'stained_glass' | 'knit_yarn' | 'retro_gadget';

export interface TactileThemeSpec {
  id: TactileThemeId;
  name: string;
  shortLabel: string;
  generationTag: string;
  pinNoun: string;
  plateNoun: string;
  clearEffectLabel: string;
  description: string;
  boardTintHex: number;
  frameStrokeHex: number;
}

export const TACTILE_THEMES: Record<TactileThemeId, TactileThemeSpec> = {
  stained_glass: {
    id: 'stained_glass',
    name: 'Stained Glass & Brass Clasps',
    shortLabel: 'Stained Glass',
    generationTag: '3rd-Gen Mosaic',
    pinNoun: 'Brass Clasp',
    plateNoun: 'Mosaic Pane',
    clearEffectLabel: 'Crystal Chime & Shatter',
    description:
      'Pull glowing brass clasps holding translucent stained-glass mosaic pieces that chime and shatter when cleared.',
    boardTintHex: 0x111728,
    frameStrokeHex: 0xf59e0b,
  },
  knit_yarn: {
    id: 'knit_yarn',
    name: 'Tactile Yarn & Sewing Pins',
    shortLabel: 'Knit & Yarn',
    generationTag: '3rd-Gen Textile',
    pinNoun: 'Sewing Pin',
    plateNoun: 'Fabric Ribbon',
    clearEffectLabel: 'Wool Unravel Physics',
    description:
      'Pull pearl-headed sewing pins holding layered woven fabric ribbons and yarn spools that unravel with physics.',
    boardTintHex: 0x181326,
    frameStrokeHex: 0xf43f5e,
  },
  retro_gadget: {
    id: 'retro_gadget',
    name: 'Retro Console & Bento Unpack',
    shortLabel: 'Gadget Bento',
    generationTag: '3rd-Gen Toy/Bento',
    pinNoun: 'Chrono Fastener',
    plateNoun: 'Translucent Shell',
    clearEffectLabel: 'Tactile Shell Release',
    description:
      'Unpin layered translucent parts of atomic-purple retro game consoles, mechanical watches, and puzzle bento boxes.',
    boardTintHex: 0x0f1722,
    frameStrokeHex: 0x38bdf8,
  },
};

export interface ColorPaletteEntry {
  id: PinColor;
  name: string;
  shortLabel: string;
  hex: string;
  numHex: number;
  lightHex: string;
  darkHex: string;
  borderHex: string;
  textHex: string;
}

export const PIN_COLORS: Record<PinColor, ColorPaletteEntry> = {
  crimson: {
    id: 'crimson',
    name: 'Ruby Stained / Crimson',
    shortLabel: 'CRM',
    hex: '#F43F5E',
    numHex: 0xf43f5e,
    lightHex: '#FDA4AF',
    darkHex: '#9F1239',
    borderHex: '#FB7185',
    textHex: '#FFE4E6',
  },
  amber: {
    id: 'amber',
    name: 'Sunlit Amber / Brass',
    shortLabel: 'AMB',
    hex: '#F59E0B',
    numHex: 0xf59e0b,
    lightHex: '#FDE68A',
    darkHex: '#92400E',
    borderHex: '#FBBF24',
    textHex: '#FEF3C7',
  },
  emerald: {
    id: 'emerald',
    name: 'Jade Crystal / Emerald',
    shortLabel: 'EMR',
    hex: '#10B981',
    numHex: 0x10b981,
    lightHex: '#6EE7B7',
    darkHex: '#065F46',
    borderHex: '#34D399',
    textHex: '#D1FAE5',
  },
  azure: {
    id: 'azure',
    name: 'Sapphire Glass / Azure',
    shortLabel: 'AZR',
    hex: '#38BDF8',
    numHex: 0x38bdf8,
    lightHex: '#BAE6FD',
    darkHex: '#075985',
    borderHex: '#7DD3FC',
    textHex: '#E0F2FE',
  },
  violet: {
    id: 'violet',
    name: 'Amethyst Atomic / Violet',
    shortLabel: 'VLT',
    hex: '#A855F7',
    numHex: 0xa855f7,
    lightHex: '#D8B4FE',
    darkHex: '#581C87',
    borderHex: '#C084FC',
    textHex: '#F3E8FF',
  },
};

export const LAYER_CATEGORIES: readonly number[] = [0x0001, 0x0002, 0x0004, 0x0008] as const;

export const MAX_BUFFER_SLOTS = 5;
export const BOOSTED_BUFFER_SLOTS = 7;
export const TOOLBOX_CAPACITY = 3;
export const OCCLUSION_THRESHOLD = 0.25;

export interface PreLevelBoosterLoadout {
  extraBufferHoles: boolean; // Expands 5-Hole Buffer -> 7-Hole Buffer
  dualToolbox: boolean; // Activates 2 simultaneous toolboxes
}

/**
 * Rule 2: Per-Layer Collision Filtering
 * Assign each layer (0..3) a distinct Matter.js collisionFilter.category (0x0001, 0x0002, 0x0004, 0x0008)
 * and set its collisionFilter.mask to match only its own category.
 */
export function getLayerCollisionCategory(layerIndex: number): number {
  const clamped = Math.max(0, Math.min(3, Math.floor(layerIndex)));
  return LAYER_CATEGORIES[clamped];
}

export function getLayerCollisionFilter(layerIndex: number): {
  category: number;
  mask: number;
  group: number;
} {
  const category = getLayerCollisionCategory(layerIndex);
  return {
    category,
    mask: category,
    group: 0,
  };
}

/**
 * Rule 3: Pin & Pendulum Physics
 * While a plate has 2+ pins, lock its rotation (Infinity inertia).
 * When only 1 pin remains on a plate, unlock its inertia/rotation so gravity makes it swing like a pendulum.
 * When 0 pins remain, it falls freely under gravity.
 */
export interface PlatePhysicsState {
  mode: 'locked' | 'pendulum' | 'freefall';
  inertia: number;
  inverseInertia: number;
  angularDamping: number;
}

export function computePlatePhysicsMode(
  attachedPinCount: number,
  baseInertia: number = 4200
): PlatePhysicsState {
  const safeInertia = baseInertia > 0 && Number.isFinite(baseInertia) ? baseInertia : 4200;
  if (attachedPinCount >= 2) {
    return {
      mode: 'locked',
      inertia: Infinity,
      inverseInertia: 0,
      angularDamping: 0.9,
    };
  }
  if (attachedPinCount === 1) {
    return {
      mode: 'pendulum',
      inertia: safeInertia,
      inverseInertia: 1 / safeInertia,
      angularDamping: 0.015,
    };
  }
  return {
    mode: 'freefall',
    inertia: safeInertia,
    inverseInertia: 1 / safeInertia,
    angularDamping: 0.005,
  };
}

/**
 * Rule 4: Tap Occlusion Check
 * Before allowing a player to tap a pin on a lower layer, check if any plate on a higher layer
 * overlaps more than 25% of the pin's circular area.
 */
export interface PinGeometry {
  id: string;
  x: number;
  y: number;
  radius: number;
  layerIndex: number;
}

export interface PlateGeometry {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // in radians
  layerIndex: number;
  shape?: 'rect' | 'pill' | 'chamfer';
  cleared?: boolean;
}

/**
 * Checks if a world point (px, py) lies inside a rotated plate geometry.
 */
export function isPointInsidePlate(px: number, py: number, plate: PlateGeometry): boolean {
  if (plate.cleared) return false;
  const dx = px - plate.x;
  const dy = py - plate.y;
  const cos = Math.cos(-plate.angle);
  const sin = Math.sin(-plate.angle);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const halfW = plate.width / 2;
  const halfH = plate.height / 2;

  if (Math.abs(localX) > halfW || Math.abs(localY) > halfH) {
    return false;
  }

  if (plate.shape === 'pill') {
    const r = Math.min(halfW, halfH);
    if (halfW >= halfH) {
      const coreHalfW = halfW - r;
      if (Math.abs(localX) <= coreHalfW) return Math.abs(localY) <= halfH;
      const cx = localX > 0 ? coreHalfW : -coreHalfW;
      return (localX - cx) ** 2 + localY ** 2 <= r * r;
    } else {
      const coreHalfH = halfH - r;
      if (Math.abs(localY) <= coreHalfH) return Math.abs(localX) <= halfW;
      const cy = localY > 0 ? coreHalfH : -coreHalfH;
      return localX ** 2 + (localY - cy) ** 2 <= r * r;
    }
  }

  return true;
}

// Precompute uniform sunflower disk samples inside unit circle for accurate area integration
const DISK_SAMPLE_COUNT = 64;
const UNIT_DISK_SAMPLES: ReadonlyArray<{ u: number; v: number }> = (() => {
  const pts: Array<{ u: number; v: number }> = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < DISK_SAMPLE_COUNT; i++) {
    const r = Math.sqrt((i + 0.5) / DISK_SAMPLE_COUNT);
    const theta = i * goldenAngle;
    pts.push({ u: r * Math.cos(theta), v: r * Math.sin(theta) });
  }
  return pts;
})();

export interface OcclusionResult {
  occluded: boolean;
  overlapRatio: number;
  occludingPlateIds: string[];
}

export function calculatePinOcclusion(
  pin: PinGeometry,
  plates: ReadonlyArray<PlateGeometry>,
  threshold: number = OCCLUSION_THRESHOLD
): OcclusionResult {
  const higherPlates = plates.filter(
    (p) => !p.cleared && p.layerIndex > pin.layerIndex
  );

  if (higherPlates.length === 0) {
    return { occluded: false, overlapRatio: 0, occludingPlateIds: [] };
  }

  let coveredPoints = 0;
  const occludingSet = new Set<string>();

  for (let i = 0; i < UNIT_DISK_SAMPLES.length; i++) {
    const sample = UNIT_DISK_SAMPLES[i];
    const wx = pin.x + sample.u * pin.radius;
    const wy = pin.y + sample.v * pin.radius;

    let pointCovered = false;
    for (let j = 0; j < higherPlates.length; j++) {
      const plate = higherPlates[j];
      if (isPointInsidePlate(wx, wy, plate)) {
        pointCovered = true;
        occludingSet.add(plate.id);
      }
    }
    if (pointCovered) {
      coveredPoints++;
    }
  }

  const overlapRatio = coveredPoints / UNIT_DISK_SAMPLES.length;
  return {
    occluded: overlapRatio > threshold,
    overlapRatio,
    occludingPlateIds: Array.from(occludingSet),
  };
}

/**
 * Rule 5: Toolbox & 5-Hole (or Boosted 7-Hole) Buffer State Machine
 * Supports Royal Match-style Pre-Level Boosters (Dual-Toolbox & +2 Extra Buffer Holes).
 */
export interface ToolboxSlot {
  id: string;
  color: PinColor;
  pins: PinColor[]; // max 3
}

export interface BufferPin {
  id: string;
  color: PinColor;
}

export const MOLTEN_COMBO_TARGET = 3;

export interface UnpackingQueueState {
  activeToolbox: ToolboxSlot | null;
  secondaryToolbox: ToolboxSlot | null; // Active when Dual-Toolbox booster is equipped
  dualToolboxActive: boolean;
  maxBufferSlots: number; // 5 default, 7 when Extra Buffer booster or Fail Offer is used
  toolboxQueue: ToolboxSlot[]; // index 0 is nextToolbox preview
  holdingBuffer: BufferPin[];
  completedBoxes: number;
  totalBoxes: number;
  swapUsed: boolean; // Competitive Feature 2A: 1-use per level Active <-> Next Toolbox tactical swap
  directMatchStreak: number; // Competitive Feature 2B: Consecutive direct toolbox matches without buffering
  moltenWildcardReady: boolean; // True when directMatchStreak >= 3; next pin of ANY color matches activeToolbox!
  status: 'playing' | 'victory' | 'almost_won_fail';
  lastAction:
    | 'matched_box'
    | 'buffered'
    | 'box_completed'
    | 'buffer_overflow'
    | 'swapped_box'
    | 'molten_wildcard'
    | 'none';
}

export function createInitialQueueState(
  toolboxColors: PinColor[],
  boosters?: Partial<PreLevelBoosterLoadout>
): UnpackingQueueState {
  const boxes: ToolboxSlot[] = toolboxColors.map((color, idx) => ({
    id: `box-${idx + 1}-${color}`,
    color,
    pins: [],
  }));

  const dualActive = Boolean(boosters?.dualToolbox);
  const maxSlots = boosters?.extraBufferHoles ? BOOSTED_BUFFER_SLOTS : MAX_BUFFER_SLOTS;

  const first = boxes.shift() ?? null;
  const second = dualActive ? (boxes.shift() ?? null) : null;

  return {
    activeToolbox: first,
    secondaryToolbox: second,
    dualToolboxActive: dualActive,
    maxBufferSlots: maxSlots,
    toolboxQueue: boxes,
    holdingBuffer: [],
    completedBoxes: 0,
    totalBoxes: toolboxColors.length,
    swapUsed: false,
    directMatchStreak: 0,
    moltenWildcardReady: false,
    status: first === null ? 'victory' : 'playing',
    lastAction: 'none',
  };
}

/**
 * Advances active/secondary toolboxes if full (3/3) and drains matching pins from the holding buffer.
 */
function advanceAndDrainToolboxes(state: UnpackingQueueState): UnpackingQueueState {
  let currentActive = state.activeToolbox
    ? { ...state.activeToolbox, pins: [...state.activeToolbox.pins] }
    : null;
  let currentSecondary = state.secondaryToolbox
    ? { ...state.secondaryToolbox, pins: [...state.secondaryToolbox.pins] }
    : null;
  const queue = state.toolboxQueue.map((b) => ({ ...b, pins: [...b.pins] }));
  const buffer = [...state.holdingBuffer];
  let completed = state.completedBoxes;
  let lastAction = state.lastAction;

  let progressed = true;
  while (progressed) {
    progressed = false;

    // 1. Drain matching pins from buffer into primary activeToolbox
    if (currentActive) {
      while (currentActive.pins.length < TOOLBOX_CAPACITY) {
        const matchIdx = buffer.findIndex((b) => b.color === currentActive!.color);
        if (matchIdx === -1) break;
        const [matchedPin] = buffer.splice(matchIdx, 1);
        currentActive.pins.push(matchedPin.color);
      }

      if (currentActive.pins.length >= TOOLBOX_CAPACITY) {
        completed++;
        lastAction = 'box_completed';
        currentActive = queue.shift() ?? null;
        progressed = true;
      }
    }

    // 2. Drain matching pins from buffer into secondaryToolbox (when Dual-Toolbox is active)
    if (currentSecondary) {
      while (currentSecondary.pins.length < TOOLBOX_CAPACITY) {
        const matchIdx = buffer.findIndex((b) => b.color === currentSecondary!.color);
        if (matchIdx === -1) break;
        const [matchedPin] = buffer.splice(matchIdx, 1);
        currentSecondary.pins.push(matchedPin.color);
      }

      if (currentSecondary.pins.length >= TOOLBOX_CAPACITY) {
        completed++;
        lastAction = 'box_completed';
        currentSecondary = queue.shift() ?? null;
        progressed = true;
      }
    }

    // Promote secondary to primary if primary is empty and secondary exists
    if (!currentActive && currentSecondary) {
      currentActive = currentSecondary;
      currentSecondary = state.dualToolboxActive ? (queue.shift() ?? null) : null;
      progressed = true;
    }
  }

  const isVictory = currentActive === null && currentSecondary === null && queue.length === 0;
  const isOverflow = !isVictory && buffer.length >= state.maxBufferSlots;

  return {
    ...state,
    activeToolbox: currentActive,
    secondaryToolbox: currentSecondary,
    toolboxQueue: queue,
    holdingBuffer: buffer,
    completedBoxes: completed,
    totalBoxes: state.totalBoxes,
    status: isVictory ? 'victory' : isOverflow ? 'almost_won_fail' : 'playing',
    lastAction: isOverflow ? 'buffer_overflow' : lastAction,
  };
}

export function routeTappedPin(
  state: UnpackingQueueState,
  pinId: string,
  pinColor: PinColor
): UnpackingQueueState {
  if (state.status !== 'playing' || !state.activeToolbox) {
    return state;
  }

  const nextState: UnpackingQueueState = {
    ...state,
    activeToolbox: {
      ...state.activeToolbox,
      pins: [...state.activeToolbox.pins],
    },
    secondaryToolbox: state.secondaryToolbox
      ? {
          ...state.secondaryToolbox,
          pins: [...state.secondaryToolbox.pins],
        }
      : null,
    toolboxQueue: state.toolboxQueue.map((b) => ({ ...b, pins: [...b.pins] })),
    holdingBuffer: [...state.holdingBuffer],
  };

  // Match Primary Active Toolbox
  if (nextState.activeToolbox && nextState.activeToolbox.color === pinColor) {
    nextState.activeToolbox.pins.push(pinColor);
    const nextStreak = nextState.directMatchStreak + 1;
    nextState.directMatchStreak = nextStreak;
    if (nextStreak >= MOLTEN_COMBO_TARGET) {
      nextState.moltenWildcardReady = true;
    }
    nextState.lastAction = 'matched_box';
    return advanceAndDrainToolboxes(nextState);
  }

  // Match Secondary Active Toolbox (Royal Match-style Dual-Toolbox Pre-Level Booster)
  if (nextState.secondaryToolbox && nextState.secondaryToolbox.color === pinColor) {
    nextState.secondaryToolbox.pins.push(pinColor);
    const nextStreak = nextState.directMatchStreak + 1;
    nextState.directMatchStreak = nextStreak;
    if (nextStreak >= MOLTEN_COMBO_TARGET) {
      nextState.moltenWildcardReady = true;
    }
    nextState.lastAction = 'matched_box';
    return advanceAndDrainToolboxes(nextState);
  }

  // Non-matching pin goes into the neutral holding buffer and resets direct-match combo streak
  nextState.directMatchStreak = 0;
  if (nextState.holdingBuffer.length < nextState.maxBufferSlots) {
    nextState.holdingBuffer.push({ id: pinId, color: pinColor });
    nextState.lastAction = 'buffered';
  }

  return advanceAndDrainToolboxes(nextState);
}

/**
 * Competitive Feature 2B: Molten Combo Wildcard Activation
 * Once the player pulls 3 matching pins in a row without buffering (`moltenWildcardReady === true`),
 * activating Molten Wildcard superheats 1 pin from the holding buffer (if any) into a matching pin
 * for the Active Toolbox (and credits its original box in the queue), or forges a direct wildcard pin
 * into the Active Toolbox!
 */
export function triggerMoltenWildcard(state: UnpackingQueueState): UnpackingQueueState {
  if (
    state.status !== 'playing' ||
    !state.moltenWildcardReady ||
    !state.activeToolbox
  ) {
    return state;
  }

  const currentActive: ToolboxSlot = {
    ...state.activeToolbox,
    pins: [...state.activeToolbox.pins, state.activeToolbox.color],
  };
  const nextQueue = state.toolboxQueue.map((b) => ({ ...b, pins: [...b.pins] }));
  const nextBuffer = [...state.holdingBuffer];

  // If there is a non-matching pin clogging the holding buffer, transmute it and credit its native box!
  if (nextBuffer.length > 0) {
    const transmuted = nextBuffer.pop()!;
    const targetBox = nextQueue.find(
      (b) => b.color === transmuted.color && b.pins.length < TOOLBOX_CAPACITY
    );
    if (targetBox) {
      targetBox.pins.push(transmuted.color);
    }
  }

  return advanceAndDrainToolboxes({
    ...state,
    activeToolbox: currentActive,
    toolboxQueue: nextQueue,
    holdingBuffer: nextBuffer,
    directMatchStreak: 0,
    moltenWildcardReady: false,
    lastAction: 'molten_wildcard',
  });
}

/**
 * Competitive Feature 2A: Active <-> Next Toolbox "Swap Once" Tactical Action
 * Swaps the current Active Toolbox with the Next Toolbox (toolboxQueue[0]) once per level,
 * preserving any pins already inside Active Toolbox and immediately auto-draining matching buffer pins!
 */
export function swapActiveWithNextToolbox(state: UnpackingQueueState): UnpackingQueueState {
  if (
    state.status !== 'playing' ||
    state.swapUsed ||
    !state.activeToolbox ||
    state.toolboxQueue.length === 0
  ) {
    return state;
  }

  const currentActive: ToolboxSlot = {
    ...state.activeToolbox,
    pins: [...state.activeToolbox.pins],
  };
  const nextQueue = state.toolboxQueue.map((b) => ({ ...b, pins: [...b.pins] }));
  const promotedBox = nextQueue.shift()!;
  nextQueue.unshift(currentActive);

  return advanceAndDrainToolboxes({
    ...state,
    activeToolbox: promotedBox,
    toolboxQueue: nextQueue,
    swapUsed: true,
    lastAction: 'swapped_box',
  });
}

/**
 * Emergency Workshop Magnet / Revive action: clears up to `countToClear` pins from the holding buffer
 * and optionally expands `maxBufferSlots` (for the "30% Revenue" Fail Offer: +2 Extra Buffer Holes).
 */
export function clearBufferSlotsForRevive(
  state: UnpackingQueueState,
  countToClear: number = 2,
  expandExtraBufferSlots: number = 0
): UnpackingQueueState {
  const buffer = [...state.holdingBuffer];
  const queue = state.toolboxQueue.map((b) => ({ ...b, pins: [...b.pins] }));
  let removed = 0;

  while (buffer.length > 0 && removed < countToClear) {
    const pin = buffer.pop()!;
    removed++;
    const targetBox = queue.find(
      (b) => b.color === pin.color && b.pins.length < TOOLBOX_CAPACITY
    );
    if (targetBox) {
      targetBox.pins.push(pin.color);
    }
  }

  const nextMaxBuffer = Math.min(
    BOOSTED_BUFFER_SLOTS,
    state.maxBufferSlots + Math.max(0, expandExtraBufferSlots)
  );

  return advanceAndDrainToolboxes({
    ...state,
    maxBufferSlots: nextMaxBuffer,
    toolboxQueue: queue,
    holdingBuffer: buffer,
    status: 'playing',
    lastAction: 'matched_box',
  });
}

/**
 * Haptic Intensity Engine (iOS Taptic Engine & Web Vibration Scaling)
 */
export type HapticIntensity = 'off' | 'light' | 'medium' | 'heavy';

export interface HapticIntensitySpec {
  id: HapticIntensity;
  label: string;
  shortLabel: string;
  percentLabel: string;
  multiplier: number;
  shakeScale: number;
  description: string;
}

export const HAPTIC_INTENSITY_ORDER: HapticIntensity[] = ['off', 'light', 'medium', 'heavy'];

export const HAPTIC_INTENSITY_SPECS: Record<HapticIntensity, HapticIntensitySpec> = {
  off: {
    id: 'off',
    label: 'Silent / Off',
    shortLabel: 'Off',
    percentLabel: '0%',
    multiplier: 0,
    shakeScale: 0,
    description: 'Zero Taptic vibration pulses for silent late-night play.',
  },
  light: {
    id: 'light',
    label: 'Subtle Taptic',
    shortLabel: 'Light',
    percentLabel: '60%',
    multiplier: 0.6,
    shakeScale: 0.55,
    description: 'Gentle micro-ticks on brass clasp pulls and ribbon releases.',
  },
  medium: {
    id: 'medium',
    label: 'Balanced Atelier',
    shortLabel: 'Medium',
    percentLabel: '100%',
    multiplier: 1.0,
    shakeScale: 1.0,
    description: 'Standard iOS Core Haptics tuned for stained-glass & yarn physics.',
  },
  heavy: {
    id: 'heavy',
    label: 'Overdrive Taptic',
    shortLabel: 'Heavy',
    percentLabel: '145%',
    multiplier: 1.45,
    shakeScale: 1.4,
    description: 'Maximum mechanical punch on every pin extraction and crystal shatter.',
  },
};

export function scaleVibrationPattern(
  pattern: number | number[],
  intensity: HapticIntensity
): number | number[] {
  const mult = HAPTIC_INTENSITY_SPECS[intensity].multiplier;
  if (mult <= 0) {
    return 0;
  }
  if (typeof pattern === 'number') {
    return Math.max(4, Math.round(pattern * mult));
  }
  return pattern.map((val, idx) =>
    // Scale vibration on-pulses (even indices), keep pause intervals crisp
    idx % 2 === 0 ? Math.max(4, Math.round(val * mult)) : Math.max(10, Math.round(val * 0.9))
  );
}

export function resolveImpactTier(
  baseTier: 'light' | 'medium' | 'heavy',
  intensity: HapticIntensity
): 'off' | 'light' | 'medium' | 'heavy' {
  if (intensity === 'off') return 'off';
  if (intensity === 'light') {
    return baseTier === 'heavy' ? 'medium' : 'light';
  }
  if (intensity === 'heavy') {
    return baseTier === 'light' ? 'medium' : 'heavy';
  }
  return baseTier;
}

/**
 * Visual Progression Map / Saga Trail Pure Computation
 */
export interface ProgressionMapNode {
  levelId: number;
  chapterIndex: number;
  chapterTitle: string;
  xPercent: number; // 18..82 serpentine horizontal position
  yOrder: number;
  status: 'cleared' | 'current' | 'available';
  isMilestone: boolean;
  milestoneLabel?: string;
}

export interface ProgressionMapSummary {
  nodes: ProgressionMapNode[];
  clearedCount: number;
  totalCount: number;
  completionPercent: number;
  unlockedMilestones: number;
}

const CHAPTER_TITLES = [
  'Ch.1 · Stained Glass Foundations',
  'Ch.2 · Pendulum & Loom Mechanics',
  'Ch.3 · 4-Layer Artisan Chronometers',
  'Ch.4 · Grand Atelier & Capgo OTA Vault',
];

export function computeProgressionMapSummary(
  levelIds: number[],
  clearedLevelIds: number[],
  currentLevelId: number
): ProgressionMapSummary {
  const clearedSet = new Set(clearedLevelIds);
  // Serpentine X coordinates (%) for a winding vertical blueprint trail
  const serpentineX = [24, 52, 76, 50, 24, 52, 76, 48, 24, 50, 74, 50];

  const nodes: ProgressionMapNode[] = levelIds.map((id, idx) => {
    const chapterIndex = Math.min(3, Math.floor(idx / 3));
    const isCleared = clearedSet.has(id);
    const isCurrent = id === currentLevelId;
    const isMilestone = id === 5 || id === 10 || id === 12;

    let milestoneLabel: string | undefined;
    if (id === 5) milestoneLabel = 'Artisan Chest';
    else if (id === 10) milestoneLabel = 'Lv.10 Grand Atelier';
    else if (id === 12) milestoneLabel = 'Capgo OTA Vault';

    return {
      levelId: id,
      chapterIndex,
      chapterTitle: CHAPTER_TITLES[chapterIndex],
      xPercent: serpentineX[idx % serpentineX.length],
      yOrder: idx,
      status: isCleared ? 'cleared' : isCurrent ? 'current' : 'available',
      isMilestone,
      milestoneLabel,
    };
  });

  const clearedCount = levelIds.filter((id) => clearedSet.has(id)).length;
  const totalCount = levelIds.length;
  const completionPercent =
    totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;
  const unlockedMilestones = nodes.filter(
    (n) => n.isMilestone && n.status === 'cleared'
  ).length;

  return {
    nodes,
    clearedCount,
    totalCount,
    completionPercent,
    unlockedMilestones,
  };
}

/**
 * Competitive Feature 1A: Kinetic Gravity Nudge Pure Physics Calculation
 * Applies a directional torque and velocity impulse to 1-pin pendulum plates and 0-pin freefall plates
 * so players can swing hanging plates away from occluded pins underneath without spending coins.
 */
export type GravityNudgeDirection = 'left' | 'right' | 'up';

export interface GravityNudgeImpulse {
  affected: boolean;
  angularVelocityDelta: number;
  velocityX: number;
  velocityY: number;
}

export function computeGravityNudgeImpulse(
  mode: 'locked' | 'pendulum' | 'freefall' | 'cleared',
  plateCenterX: number,
  boardCenterX: number = 200,
  direction: GravityNudgeDirection = 'right'
): GravityNudgeImpulse {
  if (mode === 'locked' || mode === 'cleared') {
    return {
      affected: false,
      angularVelocityDelta: 0,
      velocityX: 0,
      velocityY: 0,
    };
  }

  const dirSign =
    direction === 'left'
      ? -1
      : direction === 'right'
      ? 1
      : plateCenterX <= boardCenterX
      ? -1
      : 1;

  if (mode === 'pendulum') {
    return {
      affected: true,
      angularVelocityDelta: dirSign * 0.145,
      velocityX: dirSign * 4.2,
      velocityY: direction === 'up' ? -4.8 : -2.2,
    };
  }

  // Freefall plate gets a stronger lateral/upward jolt to clear jams
  return {
    affected: true,
    angularVelocityDelta: dirSign * 0.09,
    velocityX: dirSign * 5.5,
    velocityY: -3.5,
  };
}

/**
 * Competitive Feature 1B: Layer Explode Peek (2.5D Hold/Toggle Layer Separation)
 * Separates layers L0..L3 outward along distinct radial vectors so players can inspect
 * lower-layer pins and plate overlaps without blind guessing.
 */
export interface LayerExplodeOffset {
  offsetX: number;
  offsetY: number;
  alphaMultiplier: number;
  extrusionBoost: number;
}

const EXPLODE_LAYER_VECTORS: ReadonlyArray<{ vx: number; vy: number }> = [
  { vx: -28, vy: 22 },  // L0 (bottom layer shifts down-left)
  { vx: -12, vy: -18 }, // L1 (mid-low layer shifts up-left)
  { vx: 16, vy: -24 },  // L2 (mid-high layer shifts up-right)
  { vx: 30, vy: 18 },   // L3 (top layer shifts down-right)
];

export function computeLayerExplodeOffset(
  layerIndex: number,
  explodeFactor: number, // 0..1
  spatialTiltEnabled: boolean,
  tiltX: number,
  tiltY: number
): LayerExplodeOffset {
  const clampedLayer = Math.max(0, Math.min(3, Math.floor(layerIndex)));
  const clampedFactor = Math.max(0, Math.min(1, explodeFactor));

  const baseParallaxX = spatialTiltEnabled ? tiltX * (clampedLayer + 1) * 2.2 : 0;
  const baseParallaxY = spatialTiltEnabled ? tiltY * (clampedLayer + 1) * 2.2 : 0;

  const vec = EXPLODE_LAYER_VECTORS[clampedLayer];
  const offsetX = baseParallaxX + vec.vx * clampedFactor;
  const offsetY = baseParallaxY + vec.vy * clampedFactor;

  // Higher layers become slightly more translucent during Explode Peek so L0/L1 pins shine through
  const alphaMultiplier =
    clampedFactor > 0
      ? 1 - clampedFactor * (0.12 + clampedLayer * 0.08)
      : 1;

  return {
    offsetX,
    offsetY,
    alphaMultiplier: Math.max(0.45, alphaMultiplier),
    extrusionBoost: clampedFactor * (3 + clampedLayer * 1.5),
  };
}

/**
 * High-Craft Animation Math: Quadratic Bezier Pin Extraction Flight Trajectory
 * Computes the curved flight path, squash-and-stretch scale envelope, and spin angle
 * as an extracted 2.5D pin arcs from its board grommet into the top Toolbox / Buffer dock.
 */
export interface BezierFlightPoint {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  angleDeg: number;
  alpha: number;
}

export function computeBezierFlightPoint(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  progress: number // 0..1
): BezierFlightPoint {
  const t = Math.max(0, Math.min(1, progress));
  const invT = 1 - t;

  // Lateral curve direction bows away from center (200) for a dramatic Toy/Atelier arc
  const bowDirection = startX <= 200 ? -1 : 1;
  const controlX = (startX + targetX) * 0.5 + bowDirection * 54;
  const controlY = Math.min(startY, targetY) - 48;

  const x = invT * invT * startX + 2 * invT * t * controlX + t * t * targetX;
  const y = invT * invT * startY + 2 * invT * t * controlY + t * t * targetY;

  // Squash on initial pluck (t < 0.18), stretch mid-flight, then settle into socket
  let scaleX = 1;
  let scaleY = 1;
  if (t < 0.18) {
    const p = t / 0.18;
    scaleX = 1 + 0.28 * Math.sin(p * Math.PI);
    scaleY = 1 - 0.22 * Math.sin(p * Math.PI);
  } else {
    const p = (t - 0.18) / 0.82;
    const envelope = Math.sin(p * Math.PI);
    scaleX = 1 - 0.12 * envelope - 0.25 * p;
    scaleY = 1 + 0.26 * envelope - 0.25 * p;
  }

  const angleDeg = t * 540;
  const alpha = t > 0.88 ? Math.max(0, 1 - (t - 0.88) / 0.12) : 1;

  return {
    x,
    y,
    scaleX: Number(scaleX.toFixed(4)),
    scaleY: Number(scaleY.toFixed(4)),
    angleDeg,
    alpha: Number(alpha.toFixed(4)),
  };
}

/**
 * High-Craft Asset Math: 2.5D Refractive Specular Light Sweep across Translucent Plates
 * Drives a dynamic light sheen across stained-glass, yarn, and polycarbonate plates
 * based on pointer/device 2.5D tilt and ambient shimmer time.
 */
export interface SpecularSweepSpec {
  sweepCenterX: number;
  bandWidth: number;
  shimmerAlpha: number;
}

export function computeSpecularSweepOffset(
  tiltX: number,
  tiltY: number,
  timeSec: number,
  plateWidth: number
): SpecularSweepSpec {
  const clampedTiltX = Math.max(-1, Math.min(1, tiltX));
  const clampedTiltY = Math.max(-1, Math.min(1, tiltY));
  const ambientWave = Math.sin(timeSec * 2.1) * 0.18;
  const normalizedPos = Math.max(
    -0.85,
    Math.min(0.85, clampedTiltX * 0.65 + clampedTiltY * 0.25 + ambientWave)
  );
  const sweepCenterX = normalizedPos * (plateWidth * 0.42);
  const bandWidth = Math.max(14, Math.min(36, plateWidth * 0.18));
  const shimmerAlpha = Number(
    (0.16 + 0.1 * Math.abs(clampedTiltX) + 0.05 * Math.cos(timeSec * 3.4)).toFixed(4)
  );

  return {
    sweepCenterX,
    bandWidth,
    shimmerAlpha: Math.max(0.08, Math.min(0.35, shimmerAlpha)),
  };
}

/**
 * 3D Casual-Hit UI Progression Math: "NEW FEATURE" Unlock Bar & Screw Pass Medallion
 * Matches the reference Level Completed UI ("NEW FEATURE 5 / 10" + 3D Star Keyhole + Blue Screw Medallion "15").
 */
export interface FeatureUnlockProgress {
  current: number;
  target: number;
  ratioPercent: number;
  label: string;
  featureName: string;
  featureDescription: string;
}

export function computeFeatureUnlockProgress(
  levelId: number,
  clearedLevelIds: number[] = []
): FeatureUnlockProgress {
  const target = 10;
  const uniqueCleared = new Set(clearedLevelIds).size;
  const rawProgress = Math.max(1, levelId, uniqueCleared);
  const current = ((rawProgress - 1) % target) + 1;
  const ratioPercent = Math.round((current / target) * 100);

  const tierIndex = Math.floor((rawProgress - 1) / target);
  const features = [
    {
      name: 'Star Keyhole Clasp',
      description: 'Unlocks Golden Star Keyhole Pins & +15 Bonus Coins per clear',
    },
    {
      name: 'Chromatic Prism Kiln',
      description: 'Unlocks Diamond Refractive Stained-Glass Shards',
    },
  ];
  const activeFeature = features[tierIndex % features.length];

  return {
    current,
    target,
    ratioPercent,
    label: `${current} / ${target}`,
    featureName: activeFeature.name,
    featureDescription: activeFeature.description,
  };
}

export function computeScrewPassCount(
  completedBoxesInCurrentLevel: number,
  bonusScrewsBanked: number = 0
): number {
  const boxes = Math.max(0, Math.floor(completedBoxesInCurrentLevel));
  const banked = Math.max(0, Math.floor(bonusScrewsBanked));
  return Math.max(3, boxes * 3 + banked);
}

export interface AtelierMasteryTrophy {
  stars: 1 | 2 | 3;
  relicTitle: string;
  relicSubtitle: string;
  parTimeSeconds: number;
  baseClaimBolts: number;
  overclockedClaimBolts: number;
  gemHexes: string[];
}

export function computeAtelierMasteryTrophy(
  levelId: number,
  clearTimeSeconds: number,
  toolboxColors: PinColor[],
  themeId: TactileThemeId = 'stained_glass',
  baseClaimBolts: number = 10
): AtelierMasteryTrophy {
  const boxCount = Math.max(1, toolboxColors.length);
  const parTimeSeconds = boxCount * 14;
  const clampedTime = Math.max(1, Math.round(clearTimeSeconds));

  let stars: 1 | 2 | 3 = 3;
  if (clampedTime > parTimeSeconds * 1.65) {
    stars = 1;
  } else if (clampedTime > parTimeSeconds * 1.15) {
    stars = 2;
  }

  const stainedTitles = [
    'Cathedral Rose Prism',
    'Tiffany Sunburst Lantern',
    'Aurelia Crown Rosette',
    'Byzantine Ruby Reliquary',
    'Solstice Halo Vitrail',
  ];
  const yarnTitles = [
    'Savile Row Golden Loom',
    'Velvet Haberdashery Crest',
    'Cashmere Tapestry Spool',
    'Bespoke Silk Brocade',
    'Artisan Quilt Medallion',
  ];
  const gadgetTitles = [
    'Chrono Escapement Core',
    'Billet Titanium Gyroscope',
    'Tourbillon Brass Caliber',
    'Sub-Zero Horology Drive',
    'Cyber-Deck Synchro Rotor',
  ];

  const idx = Math.max(0, levelId - 1) % 5;
  const relicTitle =
    themeId === 'stained_glass'
      ? stainedTitles[idx]
      : themeId === 'knit_yarn'
      ? yarnTitles[idx]
      : gadgetTitles[idx];

  const relicSubtitle =
    themeId === 'stained_glass'
      ? 'Lead-Camed Stained Glass Masterwork'
      : themeId === 'knit_yarn'
      ? 'Hand-Stitched Couture Fastener Weave'
      : 'Precision CNC Horology Assembly';

  const uniqueColors = Array.from(new Set(toolboxColors));
  const gemHexes = (uniqueColors.length > 0 ? uniqueColors : (['crimson', 'amber', 'emerald', 'azure'] as PinColor[]))
    .slice(0, 5)
    .map((colorId) => PIN_COLORS[colorId]?.hex || '#F59E0B');

  const safeBase = Math.max(5, Math.floor(baseClaimBolts));

  return {
    stars,
    relicTitle,
    relicSubtitle,
    parTimeSeconds,
    baseClaimBolts: safeBase,
    overclockedClaimBolts: safeBase * 2,
    gemHexes,
  };
}

/**
 * Recommended Feature 1: Star-Keyhole Clasp & Padlock Pin Hazard Mechanics
 * Certain pins on the board are Padlocked (`lockedByKeyPinId`) by a Golden Star-Key Clasp (`isKeyPin`).
 * Tapping a Padlocked Pin while its Key Pin is still on the board blocks extraction.
 * Pulling the Golden Star-Key Clasp unlocks all linked Padlocked Pins and awards +15 Bonus Coins!
 */
export interface KeyLockPinSpec {
  id: string;
  isKeyPin?: boolean;
  lockedByKeyPinId?: string;
}

export interface KeyLockEvaluation {
  allowed: boolean;
  isPadlocked: boolean;
  blockingKeyPinId: string | null;
  isKeyPin: boolean;
  unlockedPinIds: string[];
  keyBonusBolts: number;
}

export const KEY_UNLOCK_BONUS_BOLTS = 15;

export function evaluatePinKeyLock(
  targetPinId: string,
  allPins: ReadonlyArray<KeyLockPinSpec>,
  removedPinIds: ReadonlySet<string>
): KeyLockEvaluation {
  const target = allPins.find((p) => p.id === targetPinId);
  if (!target) {
    return {
      allowed: false,
      isPadlocked: false,
      blockingKeyPinId: null,
      isKeyPin: false,
      unlockedPinIds: [],
      keyBonusBolts: 0,
    };
  }

  if (target.lockedByKeyPinId && !removedPinIds.has(target.lockedByKeyPinId)) {
    return {
      allowed: false,
      isPadlocked: true,
      blockingKeyPinId: target.lockedByKeyPinId,
      isKeyPin: Boolean(target.isKeyPin),
      unlockedPinIds: [],
      keyBonusBolts: 0,
    };
  }

  const isKeyPin = Boolean(target.isKeyPin);
  const unlockedPinIds = isKeyPin
    ? allPins
        .filter((p) => p.lockedByKeyPinId === target.id && !removedPinIds.has(p.id))
        .map((p) => p.id)
    : [];

  return {
    allowed: true,
    isPadlocked: false,
    blockingKeyPinId: null,
    isKeyPin,
    unlockedPinIds,
    keyBonusBolts: unlockedPinIds.length > 0 ? KEY_UNLOCK_BONUS_BOLTS : 0,
  };
}

/**
 * Recommended Feature 2: Combo Fever Streak Multiplier & Harmonic Chime Pitch
 * Fast consecutive pin extractions (<= 3,200ms apart) build a Clockwork Fever Streak (1x -> 2x -> 3x FEVER!),
 * pitching up the glass harmonic chime and dropping bonus Gold Coins on every extraction.
 */
export const COMBO_FEVER_WINDOW_MS = 3200;
export const COMBO_FEVER_THRESHOLD = 3;

export interface ComboFeverState {
  streakCount: number;
  multiplier: 1 | 2 | 3;
  isFever: boolean;
  pitchFactor: number; // 1.0 .. 1.5 harmonic scale
  bonusBoltsEarned: number;
  lastTapTimestampMs: number | null;
}

export function createInitialComboFeverState(): ComboFeverState {
  return {
    streakCount: 0,
    multiplier: 1,
    isFever: false,
    pitchFactor: 1.0,
    bonusBoltsEarned: 0,
    lastTapTimestampMs: null,
  };
}

export function updateComboFeverOnTap(
  prev: ComboFeverState,
  nowTimestampMs: number
): ComboFeverState {
  const withinWindow =
    prev.lastTapTimestampMs !== null &&
    nowTimestampMs - prev.lastTapTimestampMs >= 0 &&
    nowTimestampMs - prev.lastTapTimestampMs <= COMBO_FEVER_WINDOW_MS;

  const nextStreak = withinWindow ? prev.streakCount + 1 : 1;
  const isFever = nextStreak >= COMBO_FEVER_THRESHOLD;
  const multiplier: 1 | 2 | 3 = nextStreak >= 3 ? 3 : nextStreak === 2 ? 2 : 1;

  // Semitone-inspired harmonic pitch climb (capped at 1.48x so it stays musical)
  const stepIndex = Math.min(6, nextStreak - 1);
  const pitchFactor = Number((1 + stepIndex * 0.08).toFixed(2));

  const bonusBoltsEarned = multiplier === 3 ? 5 : multiplier === 2 ? 2 : 0;

  return {
    streakCount: nextStreak,
    multiplier,
    isFever,
    pitchFactor,
    bonusBoltsEarned,
    lastTapTimestampMs: nowTimestampMs,
  };
}

/**
 * Recommended Feature 3: Screw Pass Collector Chest (50-Screw Milestone)
 * Every extracted pin adds to the player's Screw Pass bank. Every 50 screws unlocks a 3D Brass Chest
 * containing +75 Gold Coins.
 */
export const SCREW_CHEST_TARGET = 50;
export const SCREW_CHEST_REWARD_BOLTS = 75;

export interface ScrewPassChestState {
  totalScrews: number;
  chestsClaimed: number;
  currentProgressInTier: number;
  targetPerChest: number;
  ratioPercent: number;
  isReadyToClaim: boolean;
  rewardBolts: number;
  label: string;
}

export function computeScrewPassChestState(
  totalScrews: number,
  chestsClaimed: number = 0
): ScrewPassChestState {
  const safeTotal = Math.max(0, Math.floor(totalScrews));
  const safeClaimed = Math.max(0, Math.floor(chestsClaimed));
  const availableScrews = Math.max(0, safeTotal - safeClaimed * SCREW_CHEST_TARGET);
  const isReadyToClaim = availableScrews >= SCREW_CHEST_TARGET;
  const currentProgressInTier = isReadyToClaim
    ? SCREW_CHEST_TARGET
    : availableScrews % SCREW_CHEST_TARGET;
  const ratioPercent = Math.min(
    100,
    Math.round((currentProgressInTier / SCREW_CHEST_TARGET) * 100)
  );

  return {
    totalScrews: safeTotal,
    chestsClaimed: safeClaimed,
    currentProgressInTier,
    targetPerChest: SCREW_CHEST_TARGET,
    ratioPercent,
    isReadyToClaim,
    rewardBolts: SCREW_CHEST_REWARD_BOLTS,
    label: `${currentProgressInTier} / ${SCREW_CHEST_TARGET}`,
  };
}

/**
 * Recommended Feature 4: Toolsmith Bench (Custom 3D Finial & Screwdriver Skins)
 */
export type FinialSkinId = 'royal_brass' | 'star_keyhole' | 'tesla_coil' | 'pearl_loom';

export interface FinialSkinSpec {
  id: FinialSkinId;
  name: string;
  shortLabel: string;
  perkLabel: string;
  unlockRequirementLabel: string;
  costBolts: number;
  bezelHex: number;
  coreHex: number;
  extraClearBolts: number;
}

export const FINIAL_SKIN_ORDER: FinialSkinId[] = [
  'royal_brass',
  'star_keyhole',
  'tesla_coil',
  'pearl_loom',
];

export const FINIAL_SKINS: Record<FinialSkinId, FinialSkinSpec> = {
  royal_brass: {
    id: 'royal_brass',
    name: 'Royal Brass Phillips',
    shortLabel: 'Royal Brass',
    perkLabel: 'Standard Clockwork Extraction',
    unlockRequirementLabel: 'Starter Toolsmith Finial',
    costBolts: 0,
    bezelHex: 0xfbbf24,
    coreHex: 0xfef08a,
    extraClearBolts: 5,
  },
  star_keyhole: {
    id: 'star_keyhole',
    name: 'Star-Keyhole Sovereign',
    shortLabel: 'Star-Key',
    perkLabel: '+10 Bonus Coins on every Level Clear',
    unlockRequirementLabel: 'New Feature Signature Clasp',
    costBolts: 60,
    bezelHex: 0xffb800,
    coreHex: 0xea580c,
    extraClearBolts: 10,
  },
  tesla_coil: {
    id: 'tesla_coil',
    name: 'Tesla Chrono Arc',
    shortLabel: 'Tesla Arc',
    perkLabel: '+15 Bonus Coins & Cyan Arc Shockwaves',
    unlockRequirementLabel: 'Horology Masterwork Finial',
    costBolts: 90,
    bezelHex: 0x38bdf8,
    coreHex: 0xe0f2fe,
    extraClearBolts: 15,
  },
  pearl_loom: {
    id: 'pearl_loom',
    name: 'Savile Rose Brooch',
    shortLabel: 'Rose Brooch',
    perkLabel: '+20 Bonus Coins & Ruby Filigree Halo',
    unlockRequirementLabel: 'Grand Atelier Couture Finial',
    costBolts: 120,
    bezelHex: 0xf43f5e,
    coreHex: 0xfda4af,
    extraClearBolts: 20,
  },
};

/**
 * Tier-2 Board Hazard 1: Crystal Frost Caps (`ICE×2` -> `ICE×1` -> `Shattered!`)
 * A pin encased in winter crystal frost cannot be extracted directly until sibling pins sharing
 * at least one attached plate are extracted to crack and shatter its frost shell.
 */
export const FROST_SHATTER_BONUS_BOLTS = 10;

export interface PinFrostCandidate {
  id: string;
  attachedPlateIds: string[];
  frostLayers?: number;
}

export interface FrostUpdateResult {
  nextFrostMap: Record<string, number>;
  crackedPinIds: string[];
  shatteredPinIds: string[];
  bonusBolts: number;
}

export function createInitialFrostMap(pins: PinFrostCandidate[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of pins) {
    if (p.frostLayers && p.frostLayers > 0) {
      map[p.id] = Math.floor(p.frostLayers);
    }
  }
  return map;
}

export function evaluatePinFrostTap(
  targetPinId: string,
  frostMap: Record<string, number>
): { allowed: boolean; remainingFrost: number } {
  const rem = frostMap[targetPinId] ?? 0;
  if (rem > 0) {
    return { allowed: false, remainingFrost: rem };
  }
  return { allowed: true, remainingFrost: 0 };
}

export function decrementFrostForSharedPlatePins(
  pulledPinId: string,
  allPins: PinFrostCandidate[],
  currentFrostMap: Record<string, number>,
  removedPinIds: ReadonlySet<string>
): FrostUpdateResult {
  const pulledPin = allPins.find((p) => p.id === pulledPinId);
  if (!pulledPin) {
    return {
      nextFrostMap: { ...currentFrostMap },
      crackedPinIds: [],
      shatteredPinIds: [],
      bonusBolts: 0,
    };
  }

  const sharedPlateSet = new Set(pulledPin.attachedPlateIds);
  const nextFrostMap: Record<string, number> = { ...currentFrostMap };
  const crackedPinIds: string[] = [];
  const shatteredPinIds: string[] = [];

  for (const pin of allPins) {
    if (pin.id === pulledPinId || removedPinIds.has(pin.id)) continue;
    const currentLayers = nextFrostMap[pin.id] ?? 0;
    if (currentLayers <= 0) continue;

    // Check if this frosted pin shares at least one plate with the pulled pin (or is on the same layer if plate cleared)
    const sharesPlate = pin.attachedPlateIds.some((pid) => sharedPlateSet.has(pid));
    if (sharesPlate) {
      const updated = Math.max(0, currentLayers - 1);
      nextFrostMap[pin.id] = updated;
      if (updated === 0) {
        shatteredPinIds.push(pin.id);
      } else {
        crackedPinIds.push(pin.id);
      }
    }
  }

  return {
    nextFrostMap,
    crackedPinIds,
    shatteredPinIds,
    bonusBolts: shatteredPinIds.length * FROST_SHATTER_BONUS_BOLTS,
  };
}

/**
 * Tier-2 Board Hazard 2: Twin Brass Chain-Link Clasps (`CHAIN`)
 * Two pins linked by a taut brass watchmaker chain (`chainedWithPinId`) must BOTH be un-occluded,
 * unlocked, and unfrosted before either can be pulled. Pulling either pin automatically extracts
 * its linked twin in a synchronized double extraction (+15 $ Chain Bonus)!
 */
export const CHAIN_LINK_BONUS_BOLTS = 15;

export interface PinChainCandidate {
  id: string;
  color: PinColor;
  chainedWithPinId?: string;
  lockedByKeyPinId?: string;
}

export interface PinChainEvaluation {
  allowed: boolean;
  isChained: boolean;
  partnerPinId: string | null;
  partnerPinColor: PinColor | null;
  blockedReason: 'partner_occluded' | 'partner_padlocked' | 'partner_frosted' | null;
  chainBonusBolts: number;
}

export function evaluatePinChainLink(
  targetPinId: string,
  allPins: PinChainCandidate[],
  removedPinIds: ReadonlySet<string>,
  occludedPinIds: ReadonlySet<string>,
  frostMap: Record<string, number> = {}
): PinChainEvaluation {
  const target = allPins.find((p) => p.id === targetPinId);
  if (!target || !target.chainedWithPinId) {
    return {
      allowed: true,
      isChained: false,
      partnerPinId: null,
      partnerPinColor: null,
      blockedReason: null,
      chainBonusBolts: 0,
    };
  }

  const partner = allPins.find((p) => p.id === target.chainedWithPinId);
  if (!partner || removedPinIds.has(partner.id)) {
    return {
      allowed: true,
      isChained: false,
      partnerPinId: null,
      partnerPinColor: null,
      blockedReason: null,
      chainBonusBolts: 0,
    };
  }

  // Check if partner is padlocked
  if (partner.lockedByKeyPinId && !removedPinIds.has(partner.lockedByKeyPinId)) {
    return {
      allowed: false,
      isChained: true,
      partnerPinId: partner.id,
      partnerPinColor: partner.color,
      blockedReason: 'partner_padlocked',
      chainBonusBolts: 0,
    };
  }

  // Check if partner is frosted
  if ((frostMap[partner.id] ?? 0) > 0) {
    return {
      allowed: false,
      isChained: true,
      partnerPinId: partner.id,
      partnerPinColor: partner.color,
      blockedReason: 'partner_frosted',
      chainBonusBolts: 0,
    };
  }

  // Check if partner is occluded (>25% covered by a higher layer plate)
  if (occludedPinIds.has(partner.id)) {
    return {
      allowed: false,
      isChained: true,
      partnerPinId: partner.id,
      partnerPinColor: partner.color,
      blockedReason: 'partner_occluded',
      chainBonusBolts: 0,
    };
  }

  return {
    allowed: true,
    isChained: true,
    partnerPinId: partner.id,
    partnerPinColor: partner.color,
    blockedReason: null,
    chainBonusBolts: CHAIN_LINK_BONUS_BOLTS,
  };
}

/**
 * Wool Craze-Inspired Tactile Storytelling Engine:
 * 3-Act Episodic Restoration Chapters + Reactive Artisan Companion
 */
export const STORY_CHAPTER_COMPLETION_BONUS_BOLTS = 100;

export type ArtisanEventType =
  | 'level_start'
  | 'ice_blocked'
  | 'ice_cracked'
  | 'ice_shattered'
  | 'chain_blocked'
  | 'chain_pulled'
  | 'key_unlocked'
  | 'combo_fever'
  | 'buffer_danger'
  | 'victory'
  | 'story_restored';

export interface StoryStageSpec {
  stage: 0 | 1 | 2 | 3;
  title: string;
  caption: string;
  costBolts: number; // cost to advance TO this stage (0 for stage 0)
  perkSummary: string;
}

export interface StoryChapterSpec {
  themeId: TactileThemeId;
  actLabel: string;
  chapterTitle: string;
  artisanName: string;
  artisanTitle: string;
  urgentHook: string;
  accentHex: string;
  stages: [StoryStageSpec, StoryStageSpec, StoryStageSpec, StoryStageSpec];
}

export const STORY_CHAPTERS: Record<TactileThemeId, StoryChapterSpec> = {
  stained_glass: {
    themeId: 'stained_glass',
    actLabel: 'Act I · Vitrail Sanctuary',
    chapterTitle: 'The Frozen Solstice Conservatory',
    artisanName: 'Clara Vance',
    artisanTitle: 'Master Glassmaker',
    urgentHook:
      'Winter frost (ICE) has sealed the cathedral greenhouse! Crack the frosted clasps and reglaze the rose arch before the starlight orchids freeze.',
    accentHex: '#F59E0B',
    stages: [
      {
        stage: 0,
        title: 'Frostbound Lancet Arch',
        caption: 'Bitter winter wind blows through shattered leaded panes and frozen brass clasps.',
        costBolts: 0,
        perkSummary: 'Awaiting Hearth Reglazing',
      },
      {
        stage: 1,
        title: 'Amber Brazier & Lower Petals',
        caption: 'Warm amber stained glass seals the lower draft and kindles the brass conservatory hearth.',
        costBolts: 35,
        perkSummary: '+5 $ Warmth Bonus on Level Clears',
      },
      {
        stage: 2,
        title: 'Solar Keyhole Crown',
        caption: 'Golden star-keyhole filigree focuses sunlight across the frosted greenhouse ribs.',
        costBolts: 45,
        perkSummary: '+10 $ Solar Prism Bonus on Level Clears',
      },
      {
        stage: 3,
        title: 'Radiant Solstice Sanctuary',
        caption: 'The cathedral rose window blazes in full vitrail splendor as rare clockwork orchids bloom!',
        costBolts: 50,
        perkSummary: 'Masterpiece Complete (+100 $ Chapter Treasury + +15 $ Clear Bonus)',
      },
    ],
  },
  knit_yarn: {
    themeId: 'knit_yarn',
    actLabel: 'Act II · Wool Craze Loom',
    chapterTitle: 'The Snowbound Haberdashery Tapestry',
    artisanName: 'Nora Lind',
    artisanTitle: 'Royal Tapestry Weaver',
    urgentHook:
      'Tangled brass chains (CHAIN) and frost have jammed the grand loom! Unpin the twin silk bobbins to weave the Sun-Spun Tapestry for the snowbound village.',
    accentHex: '#F43F5E',
    stages: [
      {
        stage: 0,
        title: 'Tangled & Drafty Loom',
        caption: 'Snapped warp threads and chained bobbins leave the royal tapestry unfinished in the cold.',
        costBolts: 0,
        perkSummary: 'Awaiting Warp Threading',
      },
      {
        stage: 1,
        title: 'Golden Merino Warp Restrung',
        caption: 'Taut golden wool warp threads shimmer across the polished mahogany loom frame.',
        costBolts: 35,
        perkSummary: '+5 $ Loom Bonus on Level Clears',
      },
      {
        stage: 2,
        title: 'Crimson Rose Satin Stitch',
        caption: 'Mother-of-pearl pins guide plush crimson and emerald wool into the central crest.',
        costBolts: 45,
        perkSummary: '+10 $ Haberdashery Bonus on Level Clears',
      },
      {
        stage: 3,
        title: 'The Sun-Spun Royal Tapestry',
        caption: 'The finished golden wool tapestry radiates cozy warmth throughout the entire atelier!',
        costBolts: 50,
        perkSummary: 'Masterpiece Complete (+100 $ Chapter Treasury + +15 $ Clear Bonus)',
      },
    ],
  },
  retro_gadget: {
    themeId: 'retro_gadget',
    actLabel: 'Act III · Horology Tower',
    chapterTitle: 'The Dormant Songbird Automaton',
    artisanName: 'Viktor Kestrel',
    artisanTitle: 'Grand Horologist',
    urgentHook:
      'The 100-year-old Astral Songbird has been padlocked (LOCK) since the Great Freeze. Free the chained gears to wind its mainspring and hear it sing!',
    accentHex: '#38BDF8',
    stages: [
      {
        stage: 0,
        title: 'Silent Brass Songbird',
        caption: 'Frozen escapement gears and locked mainsprings keep the mechanical nightingale mute.',
        costBolts: 0,
        perkSummary: 'Awaiting Mainspring Winding',
      },
      {
        stage: 1,
        title: 'Coiled Copper Mainspring',
        caption: 'The primary barrel ticks back to life, warming the walnut and brass chassis.',
        costBolts: 35,
        perkSummary: '+5 $ Escapement Bonus on Level Clears',
      },
      {
        stage: 2,
        title: 'Sapphire Tourbillon Heart',
        caption: 'Precision jewel bearings spin inside the songbird chest with harmonic resonance.',
        costBolts: 45,
        perkSummary: '+10 $ Chrono Bonus on Level Clears',
      },
      {
        stage: 3,
        title: 'The Singing Astral Nightingale',
        caption: 'Golden clockwork wings spread wide as crystalline chime melodies echo across the city!',
        costBolts: 50,
        perkSummary: 'Masterpiece Complete (+100 $ Chapter Treasury + +15 $ Clear Bonus)',
      },
    ],
  },
};

export interface StoryProgressState {
  stageByTheme: Record<TactileThemeId, 0 | 1 | 2 | 3>;
  masterpieceClaimedByTheme: Record<TactileThemeId, boolean>;
}

export function createInitialStoryProgress(): StoryProgressState {
  return {
    stageByTheme: {
      stained_glass: 1,
      knit_yarn: 1,
      retro_gadget: 1,
    },
    masterpieceClaimedByTheme: {
      stained_glass: false,
      knit_yarn: false,
      retro_gadget: false,
    },
  };
}

export interface AdvanceStoryResult {
  updatedProgress: StoryProgressState;
  nextBolts: number;
  advanced: boolean;
  newStage: 0 | 1 | 2 | 3;
  masterpieceJustCompleted: boolean;
  bonusBoltsAwarded: number;
}

export function advanceStoryChapterStep(
  progress: StoryProgressState,
  themeId: TactileThemeId,
  currentBolts: number
): AdvanceStoryResult {
  const currentStage = progress.stageByTheme[themeId] ?? 0;
  if (currentStage >= 3) {
    return {
      updatedProgress: progress,
      nextBolts: currentBolts,
      advanced: false,
      newStage: 3,
      masterpieceJustCompleted: false,
      bonusBoltsAwarded: 0,
    };
  }

  const nextStage = (currentStage + 1) as 1 | 2 | 3;
  const chapter = STORY_CHAPTERS[themeId];
  const nextStageSpec = chapter.stages[nextStage];
  if (currentBolts < nextStageSpec.costBolts) {
    return {
      updatedProgress: progress,
      nextBolts: currentBolts,
      advanced: false,
      newStage: currentStage,
      masterpieceJustCompleted: false,
      bonusBoltsAwarded: 0,
    };
  }

  const masterpieceJustCompleted =
    nextStage === 3 && !progress.masterpieceClaimedByTheme[themeId];
  const bonusBoltsAwarded = masterpieceJustCompleted
    ? STORY_CHAPTER_COMPLETION_BONUS_BOLTS
    : 0;

  const updatedProgress: StoryProgressState = {
    stageByTheme: {
      ...progress.stageByTheme,
      [themeId]: nextStage,
    },
    masterpieceClaimedByTheme: {
      ...progress.masterpieceClaimedByTheme,
      [themeId]: progress.masterpieceClaimedByTheme[themeId] || masterpieceJustCompleted,
    },
  };

  return {
    updatedProgress,
    nextBolts: currentBolts - nextStageSpec.costBolts + bonusBoltsAwarded,
    advanced: true,
    newStage: nextStage,
    masterpieceJustCompleted,
    bonusBoltsAwarded,
  };
}

export function getStoryClearBonusBolts(
  progress: StoryProgressState,
  themeId: TactileThemeId
): number {
  const stage = progress.stageByTheme[themeId] ?? 0;
  if (stage === 3) return 15;
  if (stage === 2) return 10;
  if (stage === 1) return 5;
  return 0;
}

export function getArtisanCompanionLine(
  themeId: TactileThemeId,
  event: ArtisanEventType
): string {
  const chapter = STORY_CHAPTERS[themeId];
  switch (event) {
    case 'level_start':
      return chapter.urgentHook;
    case 'ice_blocked':
      return `${chapter.artisanName}: "That clasp is sealed in winter frost (ICE)! Pull another pin on the same plate first to crack the ice."`;
    case 'ice_cracked':
      return `${chapter.artisanName}: "The winter frost is cracking! One more pull on that plate will shatter the ice!"`;
    case 'ice_shattered':
      return `${chapter.artisanName}: "Frost shattered (+10 $)! The clasp is warm and ready to extract!"`;
    case 'chain_blocked':
      return `${chapter.artisanName}: "Those twin clasps are chained together (CHAIN)! Uncover both pins so they can unscrew as a pair."`;
    case 'chain_pulled':
      return `${chapter.artisanName}: "Twin Chain-Link released (+15 $)! Both synchronized clasps extracted at once!"`;
    case 'key_unlocked':
      return `${chapter.artisanName}: "Brilliant! That golden KEY clasp unlocked the sealed padlock (+15 $)!"`;
    case 'combo_fever':
      return `${chapter.artisanName}: "Combo Fever! Your workshop rhythm is warming the entire sanctuary!"`;
    case 'buffer_danger':
      return `${chapter.artisanName}: "Careful—our 5-Hole Rail is nearly full! Use Crate Swap [S] or Magnet [25$]!"`;
    case 'story_restored':
      return `${chapter.artisanName}: "Look how warm and radiant the ${chapter.chapterTitle} looks now!"`;
    case 'victory':
    default:
      return `${chapter.artisanName}: "Masterful extraction! Let's use these coins to restore the next stage of ${chapter.chapterTitle}!"`;
  }
}
