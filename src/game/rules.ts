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
    name: 'Royal Crimson Wax & Satin',
    shortLabel: 'Royal Wax',
    generationTag: 'Parisian Atelier',
    pinNoun: 'Wax Seal',
    plateNoun: 'Satin Ribbon',
    clearEffectLabel: 'Brittle Wax Crack & Silk Zip',
    description:
      'Crack glossy crimson wax seals and untie overlapping satin ribbons to unbox imperial heirlooms live on an oiled walnut desk.',
    boardTintHex: 0x1c1411,
    frameStrokeHex: 0xd97706,
  },
  knit_yarn: {
    id: 'knit_yarn',
    name: 'Kyoto Silk & Gold Leaf',
    shortLabel: 'Kyoto Silk',
    generationTag: 'Imperial Lacquer',
    pinNoun: 'Silk Clasp',
    plateNoun: 'Brocade Sash',
    clearEffectLabel: 'Silk Unspool & Gold Leaf',
    description:
      'Unlace woven obi brocade sashes and lacquer seals wrapped around treasured Kyoto tea chests and gilded fans.',
    boardTintHex: 0x1a1216,
    frameStrokeHex: 0xe11d48,
  },
  retro_gadget: {
    id: 'retro_gadget',
    name: 'Venetian Velvet & Brass',
    shortLabel: 'Venetian Velvet',
    generationTag: 'Grand Dispatch',
    pinNoun: 'Signet Seal',
    plateNoun: 'Velvet Strap',
    clearEffectLabel: 'Velvet Release & Chime',
    description:
      'Release burgundy velvet straps and engraved brass signets guarding rare Venetian pocket watches and astral orreries.',
    boardTintHex: 0x14161f,
    frameStrokeHex: 0xf59e0b,
  },
};

export type RibbonWeavePattern =
  | 'double_gold'
  | 'guild_stripe'
  | 'herringbone'
  | 'pearl_dash'
  | 'scallop_lace';

export interface ColorPaletteEntry {
  id: PinColor;
  name: string;
  shortLabel: string;
  weavePattern: RibbonWeavePattern;
  weaveLabel: string;
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
    name: 'Royal Crimson Satin',
    shortLabel: 'CRM',
    weavePattern: 'double_gold',
    weaveLabel: 'Double-Gold Edge',
    hex: '#E11D48',
    numHex: 0xe11d48,
    lightHex: '#FDA4AF',
    darkHex: '#881337',
    borderHex: '#FB7185',
    textHex: '#FFE4E6',
  },
  amber: {
    id: 'amber',
    name: 'Sunlit Ochre Silk',
    shortLabel: 'OCH',
    weavePattern: 'guild_stripe',
    weaveLabel: 'Guild Stripe',
    hex: '#D97706',
    numHex: 0xd97706,
    lightHex: '#FDE68A',
    darkHex: '#78350F',
    borderHex: '#FBBF24',
    textHex: '#FEF3C7',
  },
  emerald: {
    id: 'emerald',
    name: 'Imperial Emerald Velvet',
    shortLabel: 'EMR',
    weavePattern: 'herringbone',
    weaveLabel: 'Herringbone Stitch',
    hex: '#059669',
    numHex: 0x059669,
    lightHex: '#6EE7B7',
    darkHex: '#064E3B',
    borderHex: '#34D399',
    textHex: '#D1FAE5',
  },
  azure: {
    id: 'azure',
    name: 'Ultramarine Silk',
    shortLabel: 'ULT',
    weavePattern: 'pearl_dash',
    weaveLabel: 'Pearl Dash Weave',
    hex: '#2563EB',
    numHex: 0x2563eb,
    lightHex: '#93C5FD',
    darkHex: '#1E3A8A',
    borderHex: '#60A5FA',
    textHex: '#DBEAFE',
  },
  violet: {
    id: 'violet',
    name: 'Byzantine Plum Satin',
    shortLabel: 'PLM',
    weavePattern: 'scallop_lace',
    weaveLabel: 'Scallop Lace Trim',
    hex: '#9333EA',
    numHex: 0x9333ea,
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
    name: 'Guild Brass Signet',
    shortLabel: 'Guild Brass',
    perkLabel: 'Classic Royal Post Seal Impression',
    unlockRequirementLabel: 'Starter Archivist Stamp',
    costBolts: 0,
    bezelHex: 0xfbbf24,
    coreHex: 0xfef08a,
    extraClearBolts: 5,
  },
  star_keyhole: {
    id: 'star_keyhole',
    name: 'Sovereign Crown Stamp',
    shortLabel: 'Crown Stamp',
    perkLabel: '+10 Gold Crowns on every Parcel Unboxed',
    unlockRequirementLabel: 'Royal Dispatch Seal',
    costBolts: 60,
    bezelHex: 0xf59e0b,
    coreHex: 0xb91c3a,
    extraClearBolts: 10,
  },
  tesla_coil: {
    id: 'tesla_coil',
    name: 'Venetian Astral Crest',
    shortLabel: 'Astral Crest',
    perkLabel: '+15 Gold Crowns & Sapphire Shimmer',
    unlockRequirementLabel: 'Astronomer Archive Seal',
    costBolts: 90,
    bezelHex: 0x60a5fa,
    coreHex: 0xdbeafe,
    extraClearBolts: 15,
  },
  pearl_loom: {
    id: 'pearl_loom',
    name: 'Imperial Rose Wax',
    shortLabel: 'Rose Wax',
    perkLabel: '+20 Gold Crowns & Velvet Filigree',
    unlockRequirementLabel: 'Grand Curio Seal',
    costBolts: 120,
    bezelHex: 0xe11d48,
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
  | 'idle_hint'
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
    actLabel: 'Archive I · Parisian Dispatch',
    chapterTitle: 'The Imperial Songbird Egg',
    artisanName: 'Colette Moreau',
    artisanTitle: 'Chief Royal Archivist',
    urgentHook:
      'Pull Royal Crimson satin ribbons to fracture the brittle WAX×2 seal, release the Signet Crest, and unbox the Duchess’s jewel-encrusted Songbird Egg!',
    accentHex: '#F59E0B',
    stages: [
      {
        stage: 0,
        title: 'Wax-Bound Velvet Parcel',
        caption: 'Heavy crimson sealing wax and tight satin bows guard the antique Parisian keepsake box.',
        costBolts: 0,
        perkSummary: 'Awaiting Wax Unsealing',
      },
      {
        stage: 1,
        title: 'Gilded Velvet Case',
        caption: 'Outer satin ribbons curl away, exposing hand-stitched burgundy velvet and brass corner clasps.',
        costBolts: 35,
        perkSummary: '+5 Crowns Archive Bonus on Parcel Clears',
      },
      {
        stage: 2,
        title: 'Filigree Enamel Shell',
        caption: 'The hinged velvet lid opens to reveal crimson guilloché enamel gleaming with warm candlelight.',
        costBolts: 45,
        perkSummary: '+10 Crowns Curator Bonus on Parcel Clears',
      },
      {
        stage: 3,
        title: 'Awakened Songbird Heirloom',
        caption: 'Jeweled petals bloom wide as the golden clockwork songbird rises and chimes across the desk!',
        costBolts: 50,
        perkSummary: 'Heirloom Curated (+100 Crowns Bonus & +15 Clear Perk)',
      },
    ],
  },
  knit_yarn: {
    themeId: 'knit_yarn',
    actLabel: 'Archive II · Kyoto Courier',
    chapterTitle: 'The Kyoto Lacquer Tea Chest',
    artisanName: 'Haruka Sato',
    artisanTitle: 'Master Silk Conservator',
    urgentHook:
      'Untie the woven silk sashes and twin knotted bows (BOW) to lift the urushi lacquer lid and awaken the golden kintsugi tea service.',
    accentHex: '#E11D48',
    stages: [
      {
        stage: 0,
        title: 'Silk-Tied Paulownia Box',
        caption: 'Crisp hand-dyed obi ribbons and twin knots secure the fragile courier parcel.',
        costBolts: 0,
        perkSummary: 'Awaiting Silk Unlacing',
      },
      {
        stage: 1,
        title: 'Gold-Leaf Tissue Fold',
        caption: 'Translucent washi paper unfolds cleanly, glinting with flakes of hammered gold leaf.',
        costBolts: 35,
        perkSummary: '+5 Crowns Silk Bonus on Parcel Clears',
      },
      {
        stage: 2,
        title: 'Urushi Vermilion Chest',
        caption: 'Polished black-and-vermilion lacquer catches the lantern glow as its brass clasp clicks open.',
        costBolts: 45,
        perkSummary: '+10 Crowns Lacquer Bonus on Parcel Clears',
      },
      {
        stage: 3,
        title: 'Gilded Matcha Masterpiece',
        caption: 'The antique kintsugi tea bowl and golden whisk sit gleaming inside the velvet-lined chest!',
        costBolts: 50,
        perkSummary: 'Heirloom Curated (+100 Crowns Bonus & +15 Clear Perk)',
      },
    ],
  },
  retro_gadget: {
    themeId: 'retro_gadget',
    actLabel: 'Archive III · Venetian Vault',
    chapterTitle: 'The Venetian Astral Pocket Watch',
    artisanName: 'Lorenzo Bellini',
    artisanTitle: 'Keeper of Royal Seals',
    urgentHook:
      'Break the Royal Signet lock (SIGNET) and wind the velvet straps onto wooden bobbins to uncover the spinning celestial pocket watch.',
    accentHex: '#60A5FA',
    stages: [
      {
        stage: 0,
        title: 'Diplomatic Sealed Satchel',
        caption: 'Embossed brass signets and ultramarine velvet straps lock the Venetian courier case.',
        costBolts: 0,
        perkSummary: 'Awaiting Signet Break',
      },
      {
        stage: 1,
        title: 'Saffian Leather Case',
        caption: 'Gold-tooled calfskin flaps fall open, showing the cushioned sapphire presentation tray.',
        costBolts: 35,
        perkSummary: '+5 Crowns Vault Bonus on Parcel Clears',
      },
      {
        stage: 2,
        title: 'Engraved Brass Hunter Lid',
        caption: 'The spring-loaded watch cover pops open with a crisp horological click.',
        costBolts: 45,
        perkSummary: '+10 Crowns Astral Bonus on Parcel Clears',
      },
      {
        stage: 3,
        title: 'Spinning Celestial Orrery',
        caption: 'Twin golden astrolabe rings and sapphire moonphase dials turn effortlessly in candlelight!',
        costBolts: 50,
        perkSummary: 'Heirloom Curated (+100 Crowns Bonus & +15 Clear Perk)',
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
      return `${chapter.artisanName}: "Thick sealing wax (WAX) locks that clasp! Pull another clasp on the same ribbon strap to fracture the wax."`;
    case 'ice_cracked':
      return `${chapter.artisanName}: "Hairline crack in the wax seal! One more ribbon pull on that strap will shatter it clean!"`;
    case 'ice_shattered':
      return `${chapter.artisanName}: "Wax seal shattered (+10 Crowns)! That satin clasp is free to wind!"`;
    case 'chain_blocked':
      return `${chapter.artisanName}: "Tied Satin Bow (BOW)! Uncover both knotted ends so they untie and spool together."`;
    case 'chain_pulled':
      return `${chapter.artisanName}: "Satin Bow untied (+15 Crowns)! Both ribbons wound smoothly in tandem!"`;
    case 'key_unlocked':
      return `${chapter.artisanName}: "Signet Seal released (+15 Crowns)! The linked Royal Crest clasp just unlocked!"`;
    case 'combo_fever':
      return `${chapter.artisanName}: "Silky rhythm! Every ribbon wound pulls the heirloom parcel wider open!"`;
    case 'buffer_danger':
      return `${chapter.artisanName}: "Brass Rack nearly full! Try Bobbin Swap [S] or Golden Scissors [W]!"`;
    case 'idle_hint':
      return `${chapter.artisanName}: "Candlelight Hint: Golden shimmer marks unblocked ribbon clasps ready to unwind."`;
    case 'story_restored':
      return `${chapter.artisanName}: "Behold—${chapter.chapterTitle} gleams like new in the Royal Curio Cabinet!"`;
    case 'victory':
    default:
      return `${chapter.artisanName}: "Parcel unboxed! The heirloom inside is awakened and catalogued in your Curio Gallery."`;
  }
}

/**
 * 5-Second Idle Visual Hint System:
 * Highlights all potentially movable pins (pins with no >25% occlusion and no active hazard block)
 * when the player remains idle for >= 5,000ms (5 seconds), prioritizing pins that match the active crate
 * or unlock a Star-Keyhole padlock.
 */
export const IDLE_HINT_DELAY_MS = 5000;
export const IDLE_HINT_DELAY_SEC = 5;

export interface HintPinCandidate {
  id: string;
  color: PinColor;
  layerIndex: number;
  occluded: boolean;
  removed?: boolean;
  isKeyPin?: boolean;
  lockedByKeyPinId?: string;
  chainedWithPinId?: string;
}

export interface IdleHintEvaluation {
  idleHintActive: boolean;
  idleElapsedMs: number;
  movablePinIds: string[];
  preferredMatchPinIds: string[];
  recommendedPinId: string | null;
}

export function evaluateIdleMovableHints(
  pins: ReadonlyArray<HintPinCandidate>,
  removedPinIds: ReadonlySet<string>,
  frostMap: Record<string, number>,
  idleElapsedMs: number,
  activeToolboxColors: ReadonlyArray<PinColor> = [],
  thresholdMs: number = IDLE_HINT_DELAY_MS
): IdleHintEvaluation {
  const occludedPinIds = new Set<string>();
  for (const pin of pins) {
    if (!pin.removed && !removedPinIds.has(pin.id) && pin.occluded) {
      occludedPinIds.add(pin.id);
    }
  }

  const activeColorSet = new Set<PinColor>(activeToolboxColors);
  const movableCandidates: HintPinCandidate[] = [];

  for (const pin of pins) {
    if (pin.removed || removedPinIds.has(pin.id)) continue;
    // Must have no occlusion (>25% overlap from higher layers)
    if (pin.occluded) continue;

    // Must not be padlocked by an unremoved KEY pin
    const lockEval = evaluatePinKeyLock(pin.id, pins, removedPinIds);
    if (!lockEval.allowed) continue;

    // Must not be encased in Crystal Frost (ICE)
    const frostEval = evaluatePinFrostTap(pin.id, frostMap);
    if (!frostEval.allowed) continue;

    // Must not be tethered to an occluded/padlocked/frosted Twin Chain partner
    const chainEval = evaluatePinChainLink(
      pin.id,
      [...pins] as PinChainCandidate[],
      removedPinIds,
      occludedPinIds,
      frostMap
    );
    if (!chainEval.allowed) continue;

    movableCandidates.push(pin);
  }

  // Sort movable pins: preferred (matches active crate color or isKeyPin) first, then highest layerIndex first
  movableCandidates.sort((a, b) => {
    const aPref = activeColorSet.has(a.color) || Boolean(a.isKeyPin) ? 1 : 0;
    const bPref = activeColorSet.has(b.color) || Boolean(b.isKeyPin) ? 1 : 0;
    if (bPref !== aPref) return bPref - aPref;
    return b.layerIndex - a.layerIndex;
  });

  const movablePinIds = movableCandidates.map((p) => p.id);
  const preferredMatchPinIds = movableCandidates
    .filter((p) => activeColorSet.has(p.color) || Boolean(p.isKeyPin))
    .map((p) => p.id);
  const recommendedPinId = preferredMatchPinIds[0] ?? movablePinIds[0] ?? null;
  const safeElapsed = Math.max(0, Math.floor(idleElapsedMs));
  const idleHintActive = safeElapsed >= thresholdMs && movablePinIds.length > 0;

  return {
    idleHintActive,
    idleElapsedMs: safeElapsed,
    movablePinIds,
    preferredMatchPinIds,
    recommendedPinId,
  };
}

/**
 * Royal Post: Wax & Ribbon — Live Centerpiece Heirloom Unboxing Engine
 * Maps EVERY individual ribbon wound into an active bobbin + every completed 3-ribbon bobbin
 * to an immediate real-time unboxing progress percentage (0..100) and 4 physical visual stages
 * rendered live right above the parcel board!
 */
export type HeirloomId = 'songbird_egg' | 'astral_watch' | 'kyoto_tea_chest' | 'botanical_orrery';

export interface HeirloomSpec {
  id: HeirloomId;
  name: string;
  origin: string;
  era: string;
  ribbonMaterial: string;
  boxAccentHex: string;
  jewelHex: string;
  stageLabels: [string, string, string, string];
  loreNote: string;
}

export const HEIRLOOM_ORDER: HeirloomId[] = [
  'songbird_egg',
  'astral_watch',
  'kyoto_tea_chest',
  'botanical_orrery',
];

export const HEIRLOOM_CATALOG: Record<HeirloomId, HeirloomSpec> = {
  songbird_egg: {
    id: 'songbird_egg',
    name: 'Imperial Songbird Egg',
    origin: 'Parisian Royal Post',
    era: '1894 · Guilloché Enamel',
    ribbonMaterial: 'Royal Crimson Satin',
    boxAccentHex: '#E11D48',
    jewelHex: '#FBBF24',
    stageLabels: [
      'Sealed Parcel',
      'Wax Seal Cracked',
      'Velvet Lid Ajar',
      'Songbird Awakened',
    ],
    loreNote:
      'Commissioned for the Grand Duchess—hidden beneath crimson ribbons sits a golden clockwork songbird inside ruby enamel petals.',
  },
  astral_watch: {
    id: 'astral_watch',
    name: 'Venetian Astral Watch',
    origin: 'Venetian Envoy Vault',
    era: '1878 · Brass & Sapphire',
    ribbonMaterial: 'Ultramarine Velvet',
    boxAccentHex: '#2563EB',
    jewelHex: '#60A5FA',
    stageLabels: [
      'Diplomatic Seal',
      'Leather Flap Lifted',
      'Hunter Cover Open',
      'Astrolabe Spinning',
    ],
    loreNote:
      'A pocket planetarium sealed in midnight silk whose concentric brass rings align the moons of Venice.',
  },
  kyoto_tea_chest: {
    id: 'kyoto_tea_chest',
    name: 'Kyoto Lacquer Tea Chest',
    origin: 'Imperial Silk Courier',
    era: '1902 · Urushi & Gold Leaf',
    ribbonMaterial: 'Emerald Brocade Sash',
    boxAccentHex: '#059669',
    jewelHex: '#FDE047',
    stageLabels: [
      'Brocade Wrapped',
      'Gold Tissue Peeled',
      'Lacquer Lid Raised',
      'Kintsugi Bowl Gleaming',
    ],
    loreNote:
      'A paulownia courier chest housing a gold-seamed kintsugi tea bowl wrapped in hand-woven silk.',
  },
  botanical_orrery: {
    id: 'botanical_orrery',
    name: 'Grand Botanical Orrery',
    origin: 'Vienna Conservatory',
    era: '1889 · Pressed Gold & Glass',
    ribbonMaterial: 'Byzantine Plum Satin',
    boxAccentHex: '#9333EA',
    jewelHex: '#34D399',
    stageLabels: [
      'Crested Keepsake',
      'Ribbons Curled Free',
      'Glass Dome Revealed',
      'Golden Blooms Orbiting',
    ],
    loreNote:
      'An enchanted clockwork herbarium sealed under three wax crests whose brass orchids turn in warm candlelight.',
  },
};

export function getHeirloomForLevel(levelId: number): HeirloomSpec {
  const safeIdx = Math.max(0, Math.floor(levelId - 1)) % HEIRLOOM_ORDER.length;
  return HEIRLOOM_CATALOG[HEIRLOOM_ORDER[safeIdx]];
}

export interface LiveHeirloomUnboxingState {
  heirloom: HeirloomSpec;
  woundRibbons: number;
  totalRibbons: number;
  completedBobbins: number;
  totalBobbins: number;
  progressPercent: number; // 0..100 continuous per ribbon wound
  unboxingStage: 0 | 1 | 2 | 3; // 0: Wrapped, 1: Wax Broken, 2: Lid Ajar, 3: Awakened
  stageLabel: string;
  lidOpenRatio: number; // 0..1 smooth hinge factor
  ribbonPeelRatio: number; // 0..1 smooth ribbon untuck factor
}

export function computeLiveHeirloomUnboxingState(
  completedBobbins: number,
  activeBobbinPins: number,
  secondaryBobbinPins: number,
  totalBobbins: number,
  levelId: number
): LiveHeirloomUnboxingState {
  const heirloom = getHeirloomForLevel(levelId);
  const safeTotalBobbins = Math.max(1, Math.floor(totalBobbins));
  const totalRibbons = safeTotalBobbins * TOOLBOX_CAPACITY;
  const rawWound =
    Math.max(0, Math.floor(completedBobbins)) * TOOLBOX_CAPACITY +
    Math.max(0, Math.floor(activeBobbinPins)) +
    Math.max(0, Math.floor(secondaryBobbinPins));
  const woundRibbons = Math.min(totalRibbons, rawWound);
  const progressPercent = Math.min(100, Math.round((woundRibbons / totalRibbons) * 100));

  let unboxingStage: 0 | 1 | 2 | 3 = 0;
  if (progressPercent >= 100 || completedBobbins >= safeTotalBobbins) {
    unboxingStage = 3;
  } else if (progressPercent >= 58) {
    unboxingStage = 2;
  } else if (progressPercent >= 16) {
    unboxingStage = 1;
  }

  const ribbonPeelRatio = Math.min(1, Number((progressPercent / 60).toFixed(3)));
  const lidOpenRatio =
    progressPercent <= 30
      ? 0
      : Math.min(1, Number(((progressPercent - 30) / 70).toFixed(3)));

  return {
    heirloom,
    woundRibbons,
    totalRibbons,
    completedBobbins: Math.min(safeTotalBobbins, Math.max(0, Math.floor(completedBobbins))),
    totalBobbins: safeTotalBobbins,
    progressPercent,
    unboxingStage,
    stageLabel: heirloom.stageLabels[unboxingStage],
    lidOpenRatio,
    ribbonPeelRatio,
  };
}

/**
 * ============================================================================
 * v2 PURE RULES: ACTIVE ATELIER PERKS, WAX RE-STAMP UNDO & DAILY ROYAL DISPATCH
 * ============================================================================
 */

export interface AtelierStationTierMap {
  workbench: number;
  drill: number;
  anodizing: number;
  magnet: number;
  blueprint: number;
}

export interface AtelierActivePerks {
  crownRewardMultiplier: number; // e.g., 1.1x at tier 2, 1.4x at tier 5
  waxAndComboBonusCrowns: number; // +3 per drill tier above 1
  rackClearCost: number; // 30 -> 25 -> 20 -> 15
  idleHintDelayMs: number; // 5000ms down to 3200ms with Candlelit Lightbox
}

export function computeAtelierActivePerks(
  tiers: Partial<AtelierStationTierMap>
): AtelierActivePerks {
  const workbench = Math.max(1, Math.min(5, Math.floor(tiers.workbench ?? 1)));
  const drill = Math.max(1, Math.min(5, Math.floor(tiers.drill ?? 1)));
  const magnet = Math.max(1, Math.min(5, Math.floor(tiers.magnet ?? 1)));
  const blueprint = Math.max(1, Math.min(5, Math.floor(tiers.blueprint ?? 1)));

  return {
    crownRewardMultiplier: Number((1 + (workbench - 1) * 0.1).toFixed(2)),
    waxAndComboBonusCrowns: (drill - 1) * 3,
    rackClearCost: Math.max(15, 30 - (magnet - 1) * 5),
    idleHintDelayMs: Math.max(3200, IDLE_HINT_DELAY_MS - (blueprint - 1) * 450),
  };
}

export interface UndoBufferedPinResult {
  undone: boolean;
  restoredPinId: string | null;
  nextQueueState: UnpackingQueueState;
}

/**
 * Gently peels the specified (or most recent) buffered ribbon off the 5-Peg Brass Rack
 * so it can be re-stamped onto its satin ribbon on the board.
 */
export function undoBufferedPinFromQueue(
  state: UnpackingQueueState,
  targetPinId?: string
): UndoBufferedPinResult {
  if (state.holdingBuffer.length === 0) {
    return { undone: false, restoredPinId: null, nextQueueState: state };
  }

  let removeIdx = state.holdingBuffer.length - 1;
  if (targetPinId) {
    const found = state.holdingBuffer.findIndex((p) => p.id === targetPinId);
    if (found < 0) {
      return { undone: false, restoredPinId: null, nextQueueState: state };
    }
    removeIdx = found;
  }

  const removed = state.holdingBuffer[removeIdx];
  const nextBuffer = [
    ...state.holdingBuffer.slice(0, removeIdx),
    ...state.holdingBuffer.slice(removeIdx + 1),
  ];

  return {
    undone: true,
    restoredPinId: removed.id,
    nextQueueState: {
      ...state,
      holdingBuffer: nextBuffer,
      status: state.status === 'almost_won_fail' ? 'playing' : state.status,
      lastAction: 'buffered',
    },
  };
}

export const DAILY_DISPATCH_REWARD_BOLTS = 100;

export function formatLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeDailyCourierStreak(
  completedDateKeys: readonly string[],
  referenceDateKey: string
): number {
  const set = new Set(completedDateKeys);
  if (set.size === 0) return 0;

  const parseDateKey = (key: string): Date => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
  };

  const toKey = (dt: Date): string => formatLocalDateKey(dt);

  const cursor = parseDateKey(referenceDateKey);
  if (!set.has(referenceDateKey)) {
    // Allow streak to stay alive if yesterday was completed and today is pending
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(toKey(cursor))) return 0;
  }

  let streak = 0;
  while (set.has(toKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function hashSeedString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GeneratedDailyLevelPin {
  id: string;
  x: number;
  y: number;
  color: PinColor;
  layerIndex: number;
  attachedPlateIds: string[];
  isKeyPin?: boolean;
  lockedByKeyPinId?: string;
  frostLayers?: number;
  chainedWithPinId?: string;
}

export interface GeneratedDailyLevelPlate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  layerIndex: number;
  color: PinColor;
  shape: 'pill';
  pinIds: string[];
}

export interface GeneratedDailyLevelConfig {
  id: number;
  name: string;
  subtitle: string;
  difficulty: 'Artisan' | 'Master';
  description: string;
  toolboxColors: PinColor[];
  plates: GeneratedDailyLevelPlate[];
  pins: GeneratedDailyLevelPin[];
  rewardBolts: number;
  isDaily: true;
  dailyDateKey: string;
}

const DAILY_DISPATCH_CITIES = [
  'Parisian Envoy',
  'Kyoto Silk Courier',
  'Venetian Gondola Post',
  'Vienna Royal Archive',
  'Prague Velvet Seal',
  'Florence Wax Guild',
];

const ALL_PIN_COLORS: PinColor[] = ['crimson', 'amber', 'emerald', 'azure', 'violet'];

/**
 * Deterministic date-seeded Daily Royal Courier Dispatch generator.
 * Guarantees:
 * - Strict 3-pin parity for every bobbin color (pins per color === 3 * toolbox count)
 * - Exact bidirectional consistency between plate.pinIds and pin.attachedPlateIds
 * - Valid depth layers (0..3) and non-deadlocking hazards (WAX×2, SIGNET/LOCK, BOW)
 */
export function generateDailyDispatchLevel(dateKey: string): GeneratedDailyLevelConfig {
  const seed = hashSeedString(`royal-post-daily:${dateKey}`);
  const rand = mulberry32(seed);

  // Pick 4 distinct satin colors from the 5-color palette deterministically
  const pool = [...ALL_PIN_COLORS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selectedColors = pool.slice(0, 4);
  // Queue order matches top-down unwrap ergonomics (top strata earlier in queue)
  const toolboxColors: PinColor[] = [
    selectedColors[3],
    selectedColors[2],
    selectedColors[1],
    selectedColors[0],
  ];

  // 4 layered satin ribbon templates with gentle seeded angle/offset variation
  const layouts = [
    { x: 200, y: 372, width: 238, height: 48, angle: Math.round((rand() - 0.5) * 14), layerIndex: 0 },
    { x: 168 + Math.round((rand() - 0.5) * 16), y: 306, width: 192, height: 46, angle: 24 + Math.round((rand() - 0.5) * 12), layerIndex: 1 },
    { x: 232 + Math.round((rand() - 0.5) * 16), y: 298, width: 192, height: 46, angle: -24 + Math.round((rand() - 0.5) * 12), layerIndex: 2 },
    { x: 200, y: 228, width: 222, height: 46, angle: Math.round((rand() - 0.5) * 18), layerIndex: 3 },
  ];

  const plates: GeneratedDailyLevelPlate[] = [];
  const pins: GeneratedDailyLevelPin[] = [];

  layouts.forEach((tpl, layerIdx) => {
    const plateId = `daily-${dateKey}-plate-${layerIdx}`;
    const color = selectedColors[layerIdx];
    const rad = (tpl.angle * Math.PI) / 180;
    const offsets = [-72, 0, 72];
    const pinIds: string[] = [];

    offsets.forEach((offset, pIdx) => {
      const pinId = `daily-${dateKey}-pin-${layerIdx}-${pIdx}`;
      pinIds.push(pinId);
      const px = Math.round(tpl.x + Math.cos(rad) * offset);
      const py = Math.round(tpl.y + Math.sin(rad) * offset);
      pins.push({
        id: pinId,
        x: Math.max(46, Math.min(354, px)),
        y: Math.max(66, Math.min(480, py)),
        color,
        layerIndex: tpl.layerIndex,
        attachedPlateIds: [plateId],
      });
    });

    plates.push({
      id: plateId,
      x: tpl.x,
      y: tpl.y,
      width: tpl.width,
      height: tpl.height,
      angle: tpl.angle,
      layerIndex: tpl.layerIndex,
      color,
      shape: 'pill',
      pinIds,
    });
  });

  // Assign balanced, guaranteed-solvable hazards:
  // 1) Top layer (layer 3) center seal is SIGNET; layer 1 center seal is LOCKed by it
  const signetPin = pins.find((p) => p.id === `daily-${dateKey}-pin-3-1`);
  const lockedPin = pins.find((p) => p.id === `daily-${dateKey}-pin-1-1`);
  if (signetPin && lockedPin) {
    signetPin.isKeyPin = true;
    lockedPin.lockedByKeyPinId = signetPin.id;
  }

  // 2) Layer 2 outer seal carries WAX×2 (cracked when its 2 sibling seals on layer 2 are pulled)
  const waxPin = pins.find((p) => p.id === `daily-${dateKey}-pin-2-2`);
  if (waxPin) {
    waxPin.frostLayers = 2;
  }

  // 3) Base layer (layer 0) outer seals form a Tied Satin Bow pair (BOW)
  const bowLeft = pins.find((p) => p.id === `daily-${dateKey}-pin-0-0`);
  const bowRight = pins.find((p) => p.id === `daily-${dateKey}-pin-0-2`);
  if (bowLeft && bowRight) {
    bowLeft.chainedWithPinId = bowRight.id;
    bowRight.chainedWithPinId = bowLeft.id;
  }

  const cityTitle = DAILY_DISPATCH_CITIES[seed % DAILY_DISPATCH_CITIES.length];
  const dailyId = 900 + (seed % 99);

  return {
    id: dailyId,
    name: `Daily Dispatch · ${cityTitle}`,
    subtitle: `Sealed Courier · ${dateKey}`,
    difficulty: seed % 2 === 0 ? 'Artisan' : 'Master',
    description:
      'Today’s wax-sealed royal pouch—crack the WAX×2 crust, release the SIGNET clasp, and untie the twin BOW pair.',
    toolboxColors,
    plates,
    pins,
    rewardBolts: DAILY_DISPATCH_REWARD_BOLTS,
    isDaily: true,
    dailyDateKey: dateKey,
  };
}

// ============================================================================
// TOP-10 RETENTION & MASTERY ENGINE (Stars, Archivist Ranks, Commissions, Share)
// ============================================================================

export type ParcelStarRating = 1 | 2 | 3;

export interface ParcelMasteryEvaluation {
  stars: ParcelStarRating;
  headline: string;
  detail: string;
  starBonusCrowns: number;
}

/**
 * Deterministic 3-Star Wax Mastery Rating (Zero-Timer Strategic Discipline).
 * - 3 Stars: Zero revives AND peak rack usage <= 3 pegs
 * - 2 Stars: Zero revives (peak rack usage 4+) OR 1 revive with clean finish
 * - 1 Star: Completed after multiple rescues
 */
export function computeParcelStarRating(
  peakRackUsed: number,
  revivesUsed: number,
  maxRackSlots: number = 5
): ParcelMasteryEvaluation {
  const safePeak = Math.max(0, Math.floor(peakRackUsed));
  const safeRevives = Math.max(0, Math.floor(revivesUsed));
  const threeStarThreshold = Math.max(3, maxRackSlots - 2);

  if (safeRevives === 0 && safePeak <= threeStarThreshold) {
    return {
      stars: 3,
      headline: 'Royal Grand Seal',
      detail: `Flawless ribbon order · Peak rack ${safePeak}/${maxRackSlots}`,
      starBonusCrowns: 30,
    };
  }

  if (safeRevives === 0 || (safeRevives === 1 && safePeak <= maxRackSlots)) {
    return {
      stars: 2,
      headline: 'Gilded Envoy Seal',
      detail:
        safeRevives === 0
          ? `Zero revives · Peak rack ${safePeak}/${maxRackSlots}`
          : 'Recovered cleanly with Brass Rack rescue',
      starBonusCrowns: 15,
    };
  }

  return {
    stars: 1,
    headline: 'Parcel Delivered',
    detail: 'Heirloom safely unboxed and cataloged',
    starBonusCrowns: 0,
  };
}

export interface ArchivistRankSpec {
  tier: number;
  title: string;
  minScore: number;
  crestColor: string;
}

export const ARCHIVIST_RANKS: ReadonlyArray<ArchivistRankSpec> = [
  { tier: 1, title: 'Novice Sorter', minScore: 0, crestColor: '#D6B898' },
  { tier: 2, title: 'Satin Apprentice', minScore: 40, crestColor: '#34D399' },
  { tier: 3, title: 'Velvet Courier', minScore: 110, crestColor: '#38BDF8' },
  { tier: 4, title: 'Master Signet', minScore: 220, crestColor: '#FBBF24' },
  { tier: 5, title: 'Keeper of Curios', minScore: 360, crestColor: '#F43F5E' },
  { tier: 6, title: 'Grand Royal Archivist', minScore: 540, crestColor: '#FDE047' },
];

export interface ArchivistRankProgress {
  currentRank: ArchivistRankSpec;
  nextRank: ArchivistRankSpec | null;
  score: number;
  progressPercent: number;
  pointsToNext: number;
}

/**
 * Computes the player's prestige Royal Archivist Rank from Mastery Stars,
 * unsealed ribbons, and completed Daily Royal Dispatches.
 */
export function computeArchivistRank(
  totalStars: number,
  totalRibbonsUnsealed: number,
  dailyDispatchesCompleted: number
): ArchivistRankProgress {
  const score =
    Math.max(0, Math.floor(totalStars)) * 18 +
    Math.max(0, Math.floor(totalRibbonsUnsealed)) * 1 +
    Math.max(0, Math.floor(dailyDispatchesCompleted)) * 35;

  let idx = 0;
  for (let i = 0; i < ARCHIVIST_RANKS.length; i++) {
    if (score >= ARCHIVIST_RANKS[i].minScore) {
      idx = i;
    }
  }

  const currentRank = ARCHIVIST_RANKS[idx];
  const nextRank = idx + 1 < ARCHIVIST_RANKS.length ? ARCHIVIST_RANKS[idx + 1] : null;

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      score,
      progressPercent: 100,
      pointsToNext: 0,
    };
  }

  const span = Math.max(1, nextRank.minScore - currentRank.minScore);
  const gained = Math.max(0, score - currentRank.minScore);
  const progressPercent = Math.max(4, Math.min(100, Math.round((gained / span) * 100)));

  return {
    currentRank,
    nextRank,
    score,
    progressPercent,
    pointsToNext: Math.max(0, nextRank.minScore - score),
  };
}

export type CommissionId =
  | 'ribbon_weaver'
  | 'wax_breaker'
  | 'three_star_courier'
  | 'silk_rush_virtuoso';

export interface CommissionProgressStats {
  ribbonsUnsealed: number;
  waxSealsBroken: number;
  threeStarParcels: number;
  silkRushTriggers: number;
}

export interface CommissionSpec {
  id: CommissionId;
  title: string;
  description: string;
  target: number;
  rewardCrowns: number;
  statKey: keyof CommissionProgressStats;
}

export const ROYAL_COMMISSIONS: ReadonlyArray<CommissionSpec> = [
  {
    id: 'ribbon_weaver',
    title: 'Satin Ribbon Weaver',
    description: 'Unseal 18 satin ribbons onto velvet bobbins',
    target: 18,
    rewardCrowns: 50,
    statKey: 'ribbonsUnsealed',
  },
  {
    id: 'wax_breaker',
    title: 'Master Wax Breaker',
    description: 'Crack or shatter 3 hardened WAX seals',
    target: 3,
    rewardCrowns: 60,
    statKey: 'waxSealsBroken',
  },
  {
    id: 'three_star_courier',
    title: 'Flawless Envoy',
    description: 'Earn a 3-Star Royal Grand Seal on any parcel',
    target: 1,
    rewardCrowns: 75,
    statKey: 'threeStarParcels',
  },
  {
    id: 'silk_rush_virtuoso',
    title: 'Silk Rush Virtuoso',
    description: 'Trigger a 3× Silk Rush combo chain',
    target: 1,
    rewardCrowns: 80,
    statKey: 'silkRushTriggers',
  },
];

export interface EvaluatedCommission extends CommissionSpec {
  current: number;
  completed: boolean;
  claimed: boolean;
  claimable: boolean;
  progressPercent: number;
}

export function evaluateRoyalCommissions(
  stats: CommissionProgressStats,
  claimedIds: readonly string[]
): EvaluatedCommission[] {
  const claimedSet = new Set(claimedIds);
  return ROYAL_COMMISSIONS.map((spec) => {
    const rawCurrent = Math.max(0, Math.floor(stats[spec.statKey] ?? 0));
    const current = Math.min(spec.target, rawCurrent);
    const completed = rawCurrent >= spec.target;
    const claimed = claimedSet.has(spec.id);
    const progressPercent = Math.min(100, Math.round((current / spec.target) * 100));
    return {
      ...spec,
      current,
      completed,
      claimed,
      claimable: completed && !claimed,
      progressPercent,
    };
  });
}

export interface DispatchShareCardInput {
  parcelTitle: string;
  heirloomName: string;
  stars: ParcelStarRating;
  isDaily?: boolean;
  dailyDateKey?: string;
  dailyStreak?: number;
  rankTitle: string;
  peakRackUsed: number;
  maxRackSlots: number;
}

/**
 * Generates a crisp, spoiler-free Royal Post Wax Seal Summary Card for iOS share sheet / clipboard.
 */
export function formatShareableDispatchCard(input: DispatchShareCardInput): string {
  const starRow = '★'.repeat(input.stars) + '☆'.repeat(3 - input.stars);
  const header = input.isDaily
    ? `Royal Post · Daily Dispatch (${input.dailyDateKey || 'Today'})`
    : `Royal Post · ${input.parcelTitle}`;
  const streakPart =
    input.dailyStreak && input.dailyStreak > 0 ? ` · ${input.dailyStreak}d Streak` : '';

  return [
    header,
    `${starRow}  ${input.heirloomName} Unboxed`,
    `Rack Discipline: ${input.peakRackUsed}/${input.maxRackSlots} pegs · ${input.rankTitle}${streakPart}`,
  ].join('\n');
}




