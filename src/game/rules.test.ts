import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLayerCollisionCategory,
  getLayerCollisionFilter,
  computePlatePhysicsMode,
  calculatePinOcclusion,
  createInitialQueueState,
  routeTappedPin,
  swapActiveWithNextToolbox,
  triggerMoltenWildcard,
  clearBufferSlotsForRevive,
  scaleVibrationPattern,
  resolveImpactTier,
  computeProgressionMapSummary,
  computeGravityNudgeImpulse,
  computeLayerExplodeOffset,
  computeBezierFlightPoint,
  computeSpecularSweepOffset,
  computeFeatureUnlockProgress,
  computeScrewPassCount,
  computeAtelierMasteryTrophy,
  evaluatePinKeyLock,
  createInitialComboFeverState,
  updateComboFeverOnTap,
  computeScrewPassChestState,
  FINIAL_SKINS,
  FINIAL_SKIN_ORDER,
  createInitialFrostMap,
  evaluatePinFrostTap,
  decrementFrostForSharedPlatePins,
  evaluatePinChainLink,
  createInitialStoryProgress,
  advanceStoryChapterStep,
  getStoryClearBonusBolts,
  getArtisanCompanionLine,
  STORY_CHAPTERS,
  IDLE_HINT_DELAY_MS,
  evaluateIdleMovableHints,
  getHeirloomForLevel,
  computeLiveHeirloomUnboxingState,
  HEIRLOOM_ORDER,
  computeAtelierActivePerks,
  undoBufferedPinFromQueue,
  formatLocalDateKey,
  computeDailyCourierStreak,
  generateDailyDispatchLevel,
  computeParcelStarRating,
  computeArchivistRank,
  evaluateRoyalCommissions,
  formatShareableDispatchCard,
} from './rules.ts';
import type { PinColor } from './rules.ts';
import {
  serializeArchivistState,
  deserializeArchivistState,
  SAVE_SCHEMA_VERSION,
} from './storage.ts';
import { LEVELS, CAPGO_OTA_BONUS_LEVELS } from './levels.ts';

test('Rule 2: Per-Layer Collision Filtering assigns distinct categories and isolated self-masks', () => {
  const f0 = getLayerCollisionFilter(0);
  const f1 = getLayerCollisionFilter(1);
  const f2 = getLayerCollisionFilter(2);
  const f3 = getLayerCollisionFilter(3);

  assert.equal(f0.category, 0x0001);
  assert.equal(f0.mask, 0x0001);
  assert.equal(f1.category, 0x0002);
  assert.equal(f1.mask, 0x0002);
  assert.equal(f2.category, 0x0004);
  assert.equal(f2.mask, 0x0004);
  assert.equal(f3.category, 0x0008);
  assert.equal(f3.mask, 0x0008);

  // Layer 2 does not collide with Layers 0 or 1
  assert.equal((f2.category & f0.mask) !== 0, false);
  assert.equal((f2.category & f1.mask) !== 0, false);
  assert.equal((f2.category & f2.mask) !== 0, true);
  assert.equal(getLayerCollisionCategory(99), 0x0008);
});

test('Rule 3: Pin & Pendulum Physics locks inertia at 2+ pins and unlocks pendulum swing at 1 pin', () => {
  const twoPins = computePlatePhysicsMode(2, 5000);
  assert.equal(twoPins.mode, 'locked');
  assert.equal(twoPins.inertia, Infinity);
  assert.equal(twoPins.inverseInertia, 0);

  const threePins = computePlatePhysicsMode(3, 5000);
  assert.equal(threePins.mode, 'locked');
  assert.equal(threePins.inertia, Infinity);

  const onePin = computePlatePhysicsMode(1, 5000);
  assert.equal(onePin.mode, 'pendulum');
  assert.equal(onePin.inertia, 5000);
  assert.equal(onePin.inverseInertia, 1 / 5000);

  const zeroPins = computePlatePhysicsMode(0, 5000);
  assert.equal(zeroPins.mode, 'freefall');
  assert.equal(zeroPins.inertia, 5000);
});

test('Rule 4: Tap Occlusion Check blocks pins with >25% overlap from higher layers only', () => {
  const pin = { id: 'pin-1', x: 100, y: 100, radius: 14, layerIndex: 1 };

  // Lower layer plate directly over pin should NOT occlude
  const lowerPlateResult = calculatePinOcclusion(pin, [
    { id: 'plate-0', x: 100, y: 100, width: 120, height: 60, angle: 0, layerIndex: 0 },
  ]);
  assert.equal(lowerPlateResult.occluded, false);
  assert.equal(lowerPlateResult.overlapRatio, 0);

  // Same layer plate should NOT occlude
  const sameLayerResult = calculatePinOcclusion(pin, [
    { id: 'plate-1', x: 100, y: 100, width: 120, height: 60, angle: 0, layerIndex: 1 },
  ]);
  assert.equal(sameLayerResult.occluded, false);

  // Higher layer plate directly covering pin (>25% area) MUST occlude
  const higherCoveredResult = calculatePinOcclusion(pin, [
    { id: 'plate-2', x: 100, y: 100, width: 120, height: 60, angle: 0, layerIndex: 2 },
  ]);
  assert.equal(higherCoveredResult.occluded, true);
  assert.ok(higherCoveredResult.overlapRatio > 0.9);
  assert.deepEqual(higherCoveredResult.occludingPlateIds, ['plate-2']);

  // Higher layer plate barely grazing the edge (<25% area) should NOT occlude
  const grazingResult = calculatePinOcclusion(pin, [
    { id: 'plate-grazing', x: 171, y: 100, width: 120, height: 60, angle: 0, layerIndex: 3 },
  ]);
  assert.equal(grazingResult.occluded, false);
  assert.ok(grazingResult.overlapRatio <= 0.25);
});

test('Rule 5: Toolbox routing, auto-drain from 5-hole buffer, and Almost Won fail state', () => {
  let state = createInitialQueueState(['crimson', 'amber']);
  assert.equal(state.activeToolbox?.color, 'crimson');
  assert.equal(state.toolboxQueue[0]?.color, 'amber');

  // Tap 2 non-matching amber pins -> go into holding buffer
  state = routeTappedPin(state, 'p1', 'amber');
  state = routeTappedPin(state, 'p2', 'amber');
  assert.equal(state.holdingBuffer.length, 2);
  assert.equal(state.activeToolbox?.pins.length, 0);

  // Tap 3 matching crimson pins -> completes crimson toolbox, activates amber toolbox, and auto-drains the 2 amber pins from buffer!
  state = routeTappedPin(state, 'p3', 'crimson');
  state = routeTappedPin(state, 'p4', 'crimson');
  state = routeTappedPin(state, 'p5', 'crimson');

  assert.equal(state.completedBoxes, 1);
  assert.equal(state.activeToolbox?.color, 'amber');
  assert.equal(state.activeToolbox?.pins.length, 2);
  assert.equal(state.holdingBuffer.length, 0);

  // Fill all 5 buffer slots with non-matching pins -> triggers 'almost_won_fail'
  state = routeTappedPin(state, 'b1', 'emerald');
  state = routeTappedPin(state, 'b2', 'azure');
  state = routeTappedPin(state, 'b3', 'violet');
  state = routeTappedPin(state, 'b4', 'emerald');
  assert.equal(state.status, 'playing');
  state = routeTappedPin(state, 'b5', 'azure');
  assert.equal(state.holdingBuffer.length, 5);
  assert.equal(state.status, 'almost_won_fail');

  // Revive clears 2 buffer slots and restores playing state
  state = clearBufferSlotsForRevive(state, 2);
  assert.equal(state.holdingBuffer.length, 3);
  assert.equal(state.status, 'playing');
});

test('Rule 1 & 5: All 10 campaign levels + Capgo OTA levels have exact 3-pin toolbox color parity and valid layers', () => {
  const allLevels = [...LEVELS, ...CAPGO_OTA_BONUS_LEVELS];
  assert.equal(LEVELS.length, 10);

  for (const level of allLevels) {
    const requiredByBox: Record<PinColor, number> = {
      crimson: 0,
      amber: 0,
      emerald: 0,
      azure: 0,
      violet: 0,
    };
    for (const boxColor of level.toolboxColors) {
      requiredByBox[boxColor] += 3;
    }

    const actualPins: Record<PinColor, number> = {
      crimson: 0,
      amber: 0,
      emerald: 0,
      azure: 0,
      violet: 0,
    };
    for (const pin of level.pins) {
      assert.ok(pin.layerIndex >= 0 && pin.layerIndex <= 3, `Invalid pin layer in level ${level.id}`);
      actualPins[pin.color] += 1;
    }

    assert.deepEqual(
      actualPins,
      requiredByBox,
      `Pin color count mismatch in Level ${level.id} (${level.name})`
    );
  }
});

test('Pillar B & C: Pre-Level Boosters (Dual-Toolbox & 7-Hole Buffer) and Fail Offer +2 Buffer Expansion', () => {
  let state = createInitialQueueState(['crimson', 'amber', 'emerald'], {
    dualToolbox: true,
    extraBufferHoles: true,
  });

  assert.equal(state.dualToolboxActive, true);
  assert.equal(state.maxBufferSlots, 7);
  assert.equal(state.activeToolbox?.color, 'crimson');
  assert.equal(state.secondaryToolbox?.color, 'amber');
  assert.equal(state.toolboxQueue[0]?.color, 'emerald');

  // Tapping an 'amber' pin routes directly into secondaryToolbox instead of clogging buffer!
  state = routeTappedPin(state, 'p-amb-1', 'amber');
  assert.equal(state.holdingBuffer.length, 0);
  assert.equal(state.secondaryToolbox?.pins.length, 1);

  // Fill 5 buffer slots with non-matching 'violet' pins -> still 'playing' because maxBufferSlots is 7!
  for (let i = 0; i < 5; i++) {
    state = routeTappedPin(state, `v-${i}`, 'violet');
  }
  assert.equal(state.holdingBuffer.length, 5);
  assert.equal(state.status, 'playing');

  // Test standard 5-slot fail offer expanding to 7 slots on revive
  let unboosted = createInitialQueueState(['crimson', 'amber']);
  for (let i = 0; i < 5; i++) {
    unboosted = routeTappedPin(unboosted, `u-${i}`, 'violet');
  }
  assert.equal(unboosted.status, 'almost_won_fail');
  assert.equal(unboosted.maxBufferSlots, 5);

  const revivedWithExtraSlots = clearBufferSlotsForRevive(unboosted, 2, 2);
  assert.equal(revivedWithExtraSlots.status, 'playing');
  assert.equal(revivedWithExtraSlots.maxBufferSlots, 7);
  assert.equal(revivedWithExtraSlots.holdingBuffer.length, 3);
});

test('Haptic Intensity scaling and Visual Progression Map node computation', () => {
  assert.equal(scaleVibrationPattern(25, 'off'), 0);
  assert.equal(scaleVibrationPattern(25, 'light'), 15);
  assert.equal(scaleVibrationPattern(25, 'medium'), 25);
  assert.equal(scaleVibrationPattern(25, 'heavy'), 36);

  assert.equal(resolveImpactTier('medium', 'off'), 'off');
  assert.equal(resolveImpactTier('medium', 'light'), 'light');
  assert.equal(resolveImpactTier('medium', 'heavy'), 'heavy');

  const summary = computeProgressionMapSummary(
    LEVELS.map((l) => l.id),
    [1, 2, 5],
    3
  );
  assert.equal(summary.totalCount, 10);
  assert.equal(summary.clearedCount, 3);
  assert.equal(summary.completionPercent, 30);
  assert.equal(summary.unlockedMilestones, 1);
  assert.equal(summary.nodes[0].status, 'cleared');
  assert.equal(summary.nodes[2].status, 'current');
  assert.equal(summary.nodes[4].isMilestone, true);
});

test('Feature 1: Kinetic Gravity Nudge and Layer Explode Peek pure calculations', () => {
  // Locked plates (2+ pins) must not move on gravity nudge
  const lockedImpulse = computeGravityNudgeImpulse('locked', 150, 200, 'right');
  assert.equal(lockedImpulse.affected, false);
  assert.equal(lockedImpulse.angularVelocityDelta, 0);
  assert.equal(lockedImpulse.velocityX, 0);

  // Pendulum plates (1 pin) receive strong angular velocity kick in the requested direction
  const pendulumRight = computeGravityNudgeImpulse('pendulum', 150, 200, 'right');
  assert.equal(pendulumRight.affected, true);
  assert.ok(pendulumRight.angularVelocityDelta > 0.1);
  assert.ok(pendulumRight.velocityX > 0);

  const pendulumLeft = computeGravityNudgeImpulse('pendulum', 150, 200, 'left');
  assert.equal(pendulumLeft.affected, true);
  assert.ok(pendulumLeft.angularVelocityDelta < -0.1);
  assert.ok(pendulumLeft.velocityX < 0);

  // Layer Explode Peek separates L0 and L3 in opposite directions and increases translucency on top layers
  const unexplodedL3 = computeLayerExplodeOffset(3, 0, false, 0, 0);
  assert.equal(unexplodedL3.offsetX, 0);
  assert.equal(unexplodedL3.offsetY, 0);
  assert.equal(unexplodedL3.alphaMultiplier, 1);

  const explodedL0 = computeLayerExplodeOffset(0, 1, false, 0, 0);
  const explodedL3 = computeLayerExplodeOffset(3, 1, false, 0, 0);
  assert.ok(explodedL0.offsetX < 0 && explodedL0.offsetY > 0);
  assert.ok(explodedL3.offsetX > 0 && explodedL3.offsetY > 0);
  assert.ok(explodedL3.alphaMultiplier < explodedL0.alphaMultiplier);
  assert.ok(explodedL3.extrusionBoost > explodedL0.extrusionBoost);
});

test('Feature 2: Active <-> Next Toolbox Swap Once and Molten Combo Wildcard', () => {
  let state = createInitialQueueState(['crimson', 'amber', 'emerald']);
  assert.equal(state.swapUsed, false);
  assert.equal(state.directMatchStreak, 0);
  assert.equal(state.moltenWildcardReady, false);

  // Buffer 2 amber pins while activeToolbox is crimson
  state = routeTappedPin(state, 'a1', 'amber');
  state = routeTappedPin(state, 'a2', 'amber');
  assert.equal(state.holdingBuffer.length, 2);
  assert.equal(state.activeToolbox?.color, 'crimson');

  // Use tactical 1-per-level Swap: active (crimson) swaps with next (amber), and the 2 buffered amber pins auto-drain!
  state = swapActiveWithNextToolbox(state);
  assert.equal(state.swapUsed, true);
  assert.equal(state.activeToolbox?.color, 'amber');
  assert.equal(state.activeToolbox?.pins.length, 2);
  assert.equal(state.holdingBuffer.length, 0);
  assert.equal(state.toolboxQueue[0]?.color, 'crimson');

  // Calling swapActiveWithNextToolbox a second time in the same level is a no-op
  const secondSwapAttempt = swapActiveWithNextToolbox(state);
  assert.equal(secondSwapAttempt.activeToolbox?.color, 'amber');

  // Pull 3 direct-matching pins in a row (1 amber to finish amber box + 2 crimson) -> charges Molten Combo Wildcard!
  state = routeTappedPin(state, 'a3', 'amber');
  assert.equal(state.completedBoxes, 1);
  assert.equal(state.activeToolbox?.color, 'crimson');
  assert.equal(state.directMatchStreak, 1);

  state = routeTappedPin(state, 'c1', 'crimson');
  state = routeTappedPin(state, 'c2', 'crimson');
  assert.equal(state.directMatchStreak, 3);
  assert.equal(state.moltenWildcardReady, true);
  assert.equal(state.activeToolbox?.pins.length, 2);

  // Buffer a non-matching 'emerald' pin, then activate Molten Wildcard [W]:
  // It transmutes the buffered 'emerald' pin to complete the 'crimson' activeToolbox AND credits the 'emerald' box in queue!
  state = routeTappedPin(state, 'e1', 'emerald');
  assert.equal(state.holdingBuffer.length, 1);
  assert.equal(state.moltenWildcardReady, true);

  state = triggerMoltenWildcard(state);
  assert.equal(state.moltenWildcardReady, false);
  assert.equal(state.directMatchStreak, 0);
  assert.equal(state.completedBoxes, 2);
  assert.equal(state.activeToolbox?.color, 'emerald');
  assert.equal(state.activeToolbox?.pins.length, 1);
  assert.equal(state.holdingBuffer.length, 0);
});

test('Asset & Animation Math: Quadratic Bezier Pin Extraction Arc and 2.5D Specular Sweep', () => {
  const start = computeBezierFlightPoint(120, 320, 180, 16, 0);
  assert.equal(start.x, 120);
  assert.equal(start.y, 320);
  assert.equal(start.alpha, 1);

  const mid = computeBezierFlightPoint(120, 320, 180, 16, 0.5);
  assert.ok(mid.x < 150); // Bows outward to the left since startX <= 200
  assert.ok(mid.y < 168); // Arcs higher than linear midpoint
  assert.ok(mid.scaleY > 1); // Stretches along flight path

  const end = computeBezierFlightPoint(120, 320, 180, 16, 1);
  assert.equal(end.x, 180);
  assert.equal(end.y, 16);
  assert.equal(end.alpha, 0);
  assert.equal(end.angleDeg, 540);

  const sweepLeft = computeSpecularSweepOffset(-0.8, 0, 0, 200);
  const sweepRight = computeSpecularSweepOffset(0.8, 0, 0, 200);
  assert.ok(sweepLeft.sweepCenterX < 0);
  assert.ok(sweepRight.sweepCenterX > 0);
  assert.ok(sweepRight.bandWidth >= 14);
  assert.ok(sweepRight.shimmerAlpha >= 0.08 && sweepRight.shimmerAlpha <= 0.35);
});

test('computeFeatureUnlockProgress and computeScrewPassCount match Level Completed UI specs', () => {
  const lvl5 = computeFeatureUnlockProgress(5, [1, 2, 3, 4, 5]);
  assert.equal(lvl5.current, 5);
  assert.equal(lvl5.target, 10);
  assert.equal(lvl5.ratioPercent, 50);
  assert.equal(lvl5.label, '5 / 10');
  assert.ok(lvl5.featureName.length > 0);

  const lvl10 = computeFeatureUnlockProgress(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(lvl10.current, 10);
  assert.equal(lvl10.ratioPercent, 100);
  assert.equal(lvl10.label, '10 / 10');

  assert.equal(computeScrewPassCount(5, 0), 15);
  assert.equal(computeScrewPassCount(4, 3), 15);
});

test('computeAtelierMasteryTrophy computes 3-star clockwork rating, theme relic title, and 2x overclock reward', () => {
  const fastClear = computeAtelierMasteryTrophy(
    5,
    18,
    ['crimson', 'emerald', 'azure', 'amber'],
    'stained_glass',
    10
  );
  assert.equal(fastClear.stars, 3);
  assert.equal(fastClear.relicTitle, 'Solstice Halo Vitrail');
  assert.equal(fastClear.baseClaimBolts, 10);
  assert.equal(fastClear.overclockedClaimBolts, 20);
  assert.equal(fastClear.gemHexes.length, 4);

  const slowClear = computeAtelierMasteryTrophy(
    2,
    95,
    ['crimson', 'emerald'],
    'retro_gadget',
    10
  );
  assert.equal(slowClear.stars, 1);
  assert.equal(slowClear.relicTitle, 'Billet Titanium Gyroscope');
});

test('Recommended Feature 1: evaluatePinKeyLock enforces Star-Keyhole Clasp padlock and awards +15 unlock bonus', () => {
  const pins = [
    { id: 'pin-padlocked', lockedByKeyPinId: 'pin-key' },
    { id: 'pin-key', isKeyPin: true },
    { id: 'pin-normal' },
  ];
  const removed = new Set<string>();

  // Padlocked pin is blocked before key pin is pulled
  const blockedEval = evaluatePinKeyLock('pin-padlocked', pins, removed);
  assert.equal(blockedEval.allowed, false);
  assert.equal(blockedEval.isPadlocked, true);
  assert.equal(blockedEval.blockingKeyPinId, 'pin-key');

  // Pulling key pin is allowed, unlocks 'pin-padlocked', and awards +15 bonus coins
  const keyEval = evaluatePinKeyLock('pin-key', pins, removed);
  assert.equal(keyEval.allowed, true);
  assert.equal(keyEval.isKeyPin, true);
  assert.deepEqual(keyEval.unlockedPinIds, ['pin-padlocked']);
  assert.equal(keyEval.keyBonusBolts, 15);

  // Once key pin is removed, padlocked pin becomes unlocked and extractable
  removed.add('pin-key');
  const unlockedEval = evaluatePinKeyLock('pin-padlocked', pins, removed);
  assert.equal(unlockedEval.allowed, true);
  assert.equal(unlockedEval.isPadlocked, false);
  assert.equal(unlockedEval.blockingKeyPinId, null);
});

test('Recommended Feature 2: updateComboFeverOnTap builds 1x -> 2x -> 3x FEVER streak and harmonic pitch', () => {
  let combo = createInitialComboFeverState();
  assert.equal(combo.streakCount, 0);
  assert.equal(combo.multiplier, 1);
  assert.equal(combo.isFever, false);

  combo = updateComboFeverOnTap(combo, 1000);
  assert.equal(combo.streakCount, 1);
  assert.equal(combo.multiplier, 1);
  assert.equal(combo.pitchFactor, 1.0);
  assert.equal(combo.bonusBoltsEarned, 0);

  // Second tap within 3.2s window -> 2x streak (+2 bonus coins)
  combo = updateComboFeverOnTap(combo, 2500);
  assert.equal(combo.streakCount, 2);
  assert.equal(combo.multiplier, 2);
  assert.equal(combo.isFever, false);
  assert.equal(combo.pitchFactor, 1.08);
  assert.equal(combo.bonusBoltsEarned, 2);

  // Third tap within 3.2s window -> 3x FEVER! (+5 bonus coins)
  combo = updateComboFeverOnTap(combo, 4200);
  assert.equal(combo.streakCount, 3);
  assert.equal(combo.multiplier, 3);
  assert.equal(combo.isFever, true);
  assert.equal(combo.pitchFactor, 1.16);
  assert.equal(combo.bonusBoltsEarned, 5);

  // Slow tap after 5 seconds resets streak back to 1x
  combo = updateComboFeverOnTap(combo, 9500);
  assert.equal(combo.streakCount, 1);
  assert.equal(combo.multiplier, 1);
  assert.equal(combo.isFever, false);
});

test('Recommended Feature 3 & 4: computeScrewPassChestState and FINIAL_SKINS specs', () => {
  const partialChest = computeScrewPassChestState(35, 0);
  assert.equal(partialChest.isReadyToClaim, false);
  assert.equal(partialChest.currentProgressInTier, 35);
  assert.equal(partialChest.ratioPercent, 70);
  assert.equal(partialChest.label, '35 / 50');

  const readyChest = computeScrewPassChestState(54, 0);
  assert.equal(readyChest.isReadyToClaim, true);
  assert.equal(readyChest.currentProgressInTier, 50);
  assert.equal(readyChest.ratioPercent, 100);
  assert.equal(readyChest.rewardBolts, 75);

  const afterClaim = computeScrewPassChestState(54, 1);
  assert.equal(afterClaim.isReadyToClaim, false);
  assert.equal(afterClaim.currentProgressInTier, 4);
  assert.equal(afterClaim.label, '4 / 50');

  assert.equal(FINIAL_SKIN_ORDER.length, 4);
  assert.ok(FINIAL_SKINS.star_keyhole.extraClearBolts > FINIAL_SKINS.royal_brass.extraClearBolts);
});

test('Tier-2 Hazard 1: Crystal Frost Caps (ICE) block extraction until shared-plate pins crack and shatter the frost', () => {
  const pins = [
    { id: 'p1', attachedPlateIds: ['plate-a'], frostLayers: 2 },
    { id: 'p2', attachedPlateIds: ['plate-a'] },
    { id: 'p3', attachedPlateIds: ['plate-a'] },
    { id: 'p4', attachedPlateIds: ['plate-b'] },
  ];
  const removed = new Set<string>();
  let frostMap = createInitialFrostMap(pins);

  assert.equal(frostMap['p1'], 2);
  assert.equal(evaluatePinFrostTap('p1', frostMap).allowed, false);
  assert.equal(evaluatePinFrostTap('p1', frostMap).remainingFrost, 2);

  // Pulling p4 on a different plate does not crack p1
  removed.add('p4');
  const step0 = decrementFrostForSharedPlatePins('p4', pins, frostMap, removed);
  frostMap = step0.nextFrostMap;
  assert.equal(frostMap['p1'], 2);
  assert.equal(step0.crackedPinIds.length, 0);

  // Pulling p2 on the same plate cracks p1 from ICE×2 -> ICE×1
  removed.add('p2');
  const step1 = decrementFrostForSharedPlatePins('p2', pins, frostMap, removed);
  frostMap = step1.nextFrostMap;
  assert.equal(frostMap['p1'], 1);
  assert.deepEqual(step1.crackedPinIds, ['p1']);
  assert.equal(step1.shatteredPinIds.length, 0);
  assert.equal(evaluatePinFrostTap('p1', frostMap).allowed, false);

  // Pulling p3 on the same plate shatters p1 (ICE×1 -> 0) and awards +10 bonus bolts
  removed.add('p3');
  const step2 = decrementFrostForSharedPlatePins('p3', pins, frostMap, removed);
  frostMap = step2.nextFrostMap;
  assert.equal(frostMap['p1'], 0);
  assert.deepEqual(step2.shatteredPinIds, ['p1']);
  assert.equal(step2.bonusBolts, 10);
  assert.equal(evaluatePinFrostTap('p1', frostMap).allowed, true);
});

test('Tier-2 Hazard 2: Twin Brass Chain-Link Clasps (CHAIN) require both twins clear and award +15 double-pull bonus', () => {
  const pins: { id: string; color: PinColor; chainedWithPinId?: string }[] = [
    { id: 'c1', color: 'amber', chainedWithPinId: 'c2' },
    { id: 'c2', color: 'amber', chainedWithPinId: 'c1' },
  ];
  const removed = new Set<string>();
  const occluded = new Set<string>(['c2']);

  // Blocked while partner c2 is occluded
  const blockedEval = evaluatePinChainLink('c1', pins, removed, occluded, {});
  assert.equal(blockedEval.allowed, false);
  assert.equal(blockedEval.isChained, true);
  assert.equal(blockedEval.partnerPinId, 'c2');
  assert.equal(blockedEval.blockedReason, 'partner_occluded');

  // Once c2 is un-occluded, pulling c1 is allowed and auto-pulls c2 with +15 bonus
  occluded.delete('c2');
  const clearEval = evaluatePinChainLink('c1', pins, removed, occluded, {});
  assert.equal(clearEval.allowed, true);
  assert.equal(clearEval.isChained, true);
  assert.equal(clearEval.partnerPinId, 'c2');
  assert.equal(clearEval.chainBonusBolts, 15);
});

test('Wool Craze Tactile Storytelling: advanceStoryChapterStep advances stages 1 -> 2 -> 3 and awards +100 Masterpiece Bonus', () => {
  let progress = createInitialStoryProgress();
  assert.equal(progress.stageByTheme.stained_glass, 1);
  assert.equal(getStoryClearBonusBolts(progress, 'stained_glass'), 5);

  // Advance from Stage 1 -> Stage 2 (cost 45 bolts)
  const step2 = advanceStoryChapterStep(progress, 'stained_glass', 130);
  assert.equal(step2.advanced, true);
  assert.equal(step2.newStage, 2);
  assert.equal(step2.nextBolts, 85);
  assert.equal(step2.masterpieceJustCompleted, false);
  progress = step2.updatedProgress;
  assert.equal(getStoryClearBonusBolts(progress, 'stained_glass'), 10);

  // Advance from Stage 2 -> Stage 3 Masterpiece (cost 50 bolts, awards +100 Masterpiece Treasury Bonus!)
  const step3 = advanceStoryChapterStep(progress, 'stained_glass', step2.nextBolts);
  assert.equal(step3.advanced, true);
  assert.equal(step3.newStage, 3);
  assert.equal(step3.masterpieceJustCompleted, true);
  assert.equal(step3.bonusBoltsAwarded, 100);
  assert.equal(step3.nextBolts, 85 - 50 + 100); // 135
  progress = step3.updatedProgress;
  assert.equal(getStoryClearBonusBolts(progress, 'stained_glass'), 15);

  // Verify Artisan Companion lines include the artisan name for each theme
  assert.ok(getArtisanCompanionLine('stained_glass', 'ice_shattered').includes(STORY_CHAPTERS.stained_glass.artisanName));
  assert.ok(getArtisanCompanionLine('knit_yarn', 'chain_pulled').includes(STORY_CHAPTERS.knit_yarn.artisanName));
  assert.ok(getArtisanCompanionLine('retro_gadget', 'key_unlocked').includes(STORY_CHAPTERS.retro_gadget.artisanName));
});

test('5-Second Idle Visual Hint System: evaluateIdleMovableHints highlights unoccluded movable pins after 5000ms idle', () => {
  const candidates = [
    { id: 'pin-free-amber', color: 'amber' as PinColor, layerIndex: 1, occluded: false },
    { id: 'pin-match-crimson', color: 'crimson' as PinColor, layerIndex: 2, occluded: false },
    { id: 'pin-occluded', color: 'crimson' as PinColor, layerIndex: 0, occluded: true },
    { id: 'pin-padlocked', color: 'crimson' as PinColor, layerIndex: 2, occluded: false, lockedByKeyPinId: 'pin-key' },
    { id: 'pin-key', color: 'azure' as PinColor, layerIndex: 1, occluded: true, isKeyPin: true },
    { id: 'pin-frosted', color: 'crimson' as PinColor, layerIndex: 2, occluded: false },
    { id: 'pin-chained-a', color: 'emerald' as PinColor, layerIndex: 2, occluded: false, chainedWithPinId: 'pin-chained-b' },
    { id: 'pin-chained-b', color: 'emerald' as PinColor, layerIndex: 0, occluded: true, chainedWithPinId: 'pin-chained-a' },
  ];

  const removed = new Set<string>();
  const frostMap = { 'pin-frosted': 2 };

  // 1. Before 5000ms (at 4900ms), idleHintActive is false, though movablePinIds are accurately computed
  const before5s = evaluateIdleMovableHints(
    candidates,
    removed,
    frostMap,
    4900,
    ['crimson'],
    IDLE_HINT_DELAY_MS
  );
  assert.equal(before5s.idleHintActive, false);
  assert.deepEqual(before5s.movablePinIds, ['pin-match-crimson', 'pin-free-amber']);
  assert.deepEqual(before5s.preferredMatchPinIds, ['pin-match-crimson']);
  assert.equal(before5s.recommendedPinId, 'pin-match-crimson');

  // 2. At 5000ms (5 seconds idle), idleHintActive transitions to true and excludes occluded/padlocked/frosted/chain-blocked pins
  const at5s = evaluateIdleMovableHints(
    candidates,
    removed,
    frostMap,
    5000,
    ['crimson'],
    IDLE_HINT_DELAY_MS
  );
  assert.equal(at5s.idleHintActive, true);
  assert.deepEqual(at5s.movablePinIds, ['pin-match-crimson', 'pin-free-amber']);
  assert.equal(at5s.recommendedPinId, 'pin-match-crimson');

  // 3. Once pin-chained-b is un-occluded, both chained pins become movable
  candidates[7].occluded = false;
  const afterUnoccludeChain = evaluateIdleMovableHints(
    candidates,
    removed,
    frostMap,
    5200,
    ['crimson'],
    IDLE_HINT_DELAY_MS
  );
  assert.equal(afterUnoccludeChain.idleHintActive, true);
  assert.ok(afterUnoccludeChain.movablePinIds.includes('pin-chained-a'));
  assert.ok(afterUnoccludeChain.movablePinIds.includes('pin-chained-b'));
});

test('Royal Post Live Centerpiece Unboxing Engine: advances progress and 4 stages on every ribbon match', () => {
  // Parcel 1 maps to Imperial Songbird Egg; cycles cleanly across all 4 royal heirlooms
  assert.equal(getHeirloomForLevel(1).id, HEIRLOOM_ORDER[0]);
  assert.equal(getHeirloomForLevel(2).id, HEIRLOOM_ORDER[1]);
  assert.equal(getHeirloomForLevel(5).id, HEIRLOOM_ORDER[0]);

  // 2-bobbin parcel = 6 total ribbons
  const s0 = computeLiveHeirloomUnboxingState(0, 0, 0, 2, 1);
  assert.equal(s0.progressPercent, 0);
  assert.equal(s0.unboxingStage, 0);
  assert.equal(s0.lidOpenRatio, 0);

  // First single ribbon match immediately advances progress (1/6 = 17%) into Stage 1 (Wax Seal Cracked)
  const s1 = computeLiveHeirloomUnboxingState(0, 1, 0, 2, 1);
  assert.equal(s1.woundRibbons, 1);
  assert.equal(s1.progressPercent, 17);
  assert.equal(s1.unboxingStage, 1);

  // First full bobbin + 1 ribbon into second bobbin (4/6 = 67%) hinges Velvet Lid Ajar (Stage 2)
  const s2 = computeLiveHeirloomUnboxingState(1, 1, 0, 2, 1);
  assert.equal(s2.progressPercent, 67);
  assert.equal(s2.unboxingStage, 2);
  assert.ok(s2.lidOpenRatio > 0.5);

  // Final bobbin completed (6/6 = 100%) awakens the animated heirloom masterpiece (Stage 3)
  const s3 = computeLiveHeirloomUnboxingState(2, 0, 0, 2, 1);
  assert.equal(s3.progressPercent, 100);
  assert.equal(s3.unboxingStage, 3);
  assert.equal(s3.lidOpenRatio, 1);
  assert.equal(s3.ribbonPeelRatio, 1);
});

test('v2 Active Atelier Perks: scales Crown multiplier, Wax/Combo bonus, Rack Clear discount, and Hint delay cleanly', () => {
  const base = computeAtelierActivePerks({
    workbench: 1,
    drill: 1,
    anodizing: 1,
    magnet: 1,
    blueprint: 1,
  });
  assert.equal(base.crownRewardMultiplier, 1);
  assert.equal(base.waxAndComboBonusCrowns, 0);
  assert.equal(base.rackClearCost, 30);
  assert.equal(base.idleHintDelayMs, IDLE_HINT_DELAY_MS);

  const upgraded = computeAtelierActivePerks({
    workbench: 5,
    drill: 4,
    anodizing: 3,
    magnet: 4,
    blueprint: 5,
  });
  assert.ok(upgraded.crownRewardMultiplier > 1.3);
  assert.ok(upgraded.waxAndComboBonusCrowns >= 5);
  assert.ok(upgraded.rackClearCost < 30 && upgraded.rackClearCost >= 15);
  assert.ok(upgraded.idleHintDelayMs < IDLE_HINT_DELAY_MS && upgraded.idleHintDelayMs >= 2600);
});

test('v2 Wax Re-Stamp Undo: pops last or targeted rack pin and clears almost_won_fail cleanly', () => {
  let state = createInitialQueueState(['crimson', 'emerald']);
  state = routeTappedPin(state, 'p1', 'amber');
  state = routeTappedPin(state, 'p2', 'azure');
  state = routeTappedPin(state, 'p3', 'violet');
  state = routeTappedPin(state, 'p4', 'amber');
  state = routeTappedPin(state, 'p5', 'azure');
  assert.equal(state.status, 'almost_won_fail');
  assert.equal(state.holdingBuffer.length, 5);

  // Undo last buffered pin restores playing state and returns pin p5
  const undoLast = undoBufferedPinFromQueue(state);
  assert.equal(undoLast.undone, true);
  assert.equal(undoLast.restoredPinId, 'p5');
  assert.equal(undoLast.nextQueueState.status, 'playing');
  assert.equal(undoLast.nextQueueState.holdingBuffer.length, 4);

  // Undo specific targeted pin p2
  const undoTarget = undoBufferedPinFromQueue(undoLast.nextQueueState, 'p2');
  assert.equal(undoTarget.undone, true);
  assert.equal(undoTarget.restoredPinId, 'p2');
  assert.equal(undoTarget.nextQueueState.holdingBuffer.length, 3);
  assert.equal(
    undoTarget.nextQueueState.holdingBuffer.some((p) => p.id === 'p2'),
    false
  );
});

test('v2 Daily Royal Dispatch Generator: deterministic & exact 3-pin parity across 30 consecutive dates', () => {
  const baseDate = new Date(2026, 4, 1); // May 1, 2026
  for (let offset = 0; offset < 30; offset++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + offset);
    const dateKey = formatLocalDateKey(d);
    const dailyA = generateDailyDispatchLevel(dateKey);
    const dailyB = generateDailyDispatchLevel(dateKey);

    // Deterministic for same date
    assert.deepEqual(dailyA, dailyB);
    assert.equal(dailyA.isDaily, true);
    assert.equal(dailyA.dailyDateKey, dateKey);
    assert.equal(dailyA.pins.length, dailyA.toolboxColors.length * 3);

    // Exact 3-pin color parity matching bobbin queue
    const colorCounts = new Map<string, number>();
    for (const pin of dailyA.pins) {
      colorCounts.set(pin.color, (colorCounts.get(pin.color) || 0) + 1);
      assert.ok(pin.layerIndex >= 0 && pin.layerIndex <= 3);
      assert.ok(pin.attachedPlateIds.length >= 1);
      for (const pid of pin.attachedPlateIds) {
        const plate = dailyA.plates.find((pl) => pl.id === pid);
        assert.ok(plate, `Daily ${dateKey} pin ${pin.id} references missing plate ${pid}`);
        assert.ok(plate.pinIds.includes(pin.id));
      }
    }
    const expectedCounts = new Map<string, number>();
    for (const color of dailyA.toolboxColors) {
      expectedCounts.set(color, (expectedCounts.get(color) || 0) + 3);
    }
    assert.deepEqual(colorCounts, expectedCounts);
  }
});

test('v2 Daily Courier Streak: counts consecutive days including yesterday-alive and stops at gaps', () => {
  assert.equal(computeDailyCourierStreak([], '2026-05-10'), 0);
  assert.equal(computeDailyCourierStreak(['2026-05-10'], '2026-05-10'), 1);
  assert.equal(
    computeDailyCourierStreak(['2026-05-08', '2026-05-09', '2026-05-10'], '2026-05-10'),
    3
  );
  // Streak stays alive if completed yesterday even before finishing today
  assert.equal(
    computeDailyCourierStreak(['2026-05-08', '2026-05-09'], '2026-05-10'),
    2
  );
  // Gap breaks streak
  assert.equal(
    computeDailyCourierStreak(['2026-05-06', '2026-05-07'], '2026-05-10'),
    0
  );
});

test('v2 Local Archivist Save Serialization: round-trips cleanly and rejects corrupted payloads', () => {
  const payload = {
    version: SAVE_SCHEMA_VERSION,
    bolts: 420,
    clearedLevelIds: [1, 2, 3],
    winStreak: 5,
    themeId: 'knit_yarn' as const,
    finialSkinId: 'star_keyhole' as const,
    hapticIntensity: 'heavy' as const,
    adsRemovedPermanently: true,
    preLevelBoosters: { extraBufferHoles: true, dualToolbox: false },
    stations: [{ id: 'workbench', level: 4, cost: 85 }],
    storyProgress: createInitialStoryProgress(),
    totalScrewsCollected: 92,
    screwChestsClaimed: 2,
    dailyCompletedDates: ['2026-05-09', '2026-05-10'],
    muted: true,
    levelStarsById: { 1: 3 as const, 2: 2 as const },
    commissionStats: {
      ribbonsUnsealed: 24,
      waxSealsBroken: 3,
      threeStarParcels: 1,
      silkRushTriggers: 2,
    },
    claimedCommissionIds: ['ribbon_weaver'],
  };

  const json = serializeArchivistState(payload);
  const restored = deserializeArchivistState(json);
  assert.ok(restored);
  assert.equal(restored.bolts, 420);
  assert.deepEqual(restored.clearedLevelIds, [1, 2, 3]);
  assert.equal(restored.themeId, 'knit_yarn');
  assert.equal(restored.finialSkinId, 'star_keyhole');
  assert.deepEqual(restored.dailyCompletedDates, ['2026-05-09', '2026-05-10']);
  assert.equal(restored.muted, true);
  assert.deepEqual(restored.levelStarsById, { 1: 3, 2: 2 });
  assert.equal(restored.commissionStats?.ribbonsUnsealed, 24);
  assert.deepEqual(restored.claimedCommissionIds, ['ribbon_weaver']);

  // Corrupted JSON or invalid enum values are safely handled
  assert.equal(deserializeArchivistState('{not valid json'), null);
  const partial = deserializeArchivistState(
    JSON.stringify({ bolts: -50, themeId: 'invalid_theme', dailyCompletedDates: ['bad', '2026-05-10'] })
  );
  assert.ok(partial);
  assert.equal(partial.bolts, undefined);
  assert.equal(partial.themeId, undefined);
  assert.deepEqual(partial.dailyCompletedDates, ['2026-05-10']);
});

test('v3 Top-10 3-Star Wax Mastery Rating: rewards rack discipline and zero-revive clears deterministically', () => {
  const threeStar = computeParcelStarRating(2, 0, 5);
  assert.equal(threeStar.stars, 3);
  assert.equal(threeStar.headline, 'Royal Grand Seal');
  assert.equal(threeStar.starBonusCrowns, 30);

  const twoStarTightRack = computeParcelStarRating(4, 0, 5);
  assert.equal(twoStarTightRack.stars, 2);
  assert.equal(twoStarTightRack.starBonusCrowns, 15);

  const twoStarSingleRevive = computeParcelStarRating(5, 1, 5);
  assert.equal(twoStarSingleRevive.stars, 2);

  const oneStarMultiRevive = computeParcelStarRating(5, 2, 5);
  assert.equal(oneStarMultiRevive.stars, 1);
  assert.equal(oneStarMultiRevive.starBonusCrowns, 0);
});

test('v3 Top-10 Royal Archivist Rank Progression: scales cleanly from Novice Sorter to Grand Royal Archivist', () => {
  const novice = computeArchivistRank(0, 0, 0);
  assert.equal(novice.currentRank.tier, 1);
  assert.equal(novice.currentRank.title, 'Novice Sorter');
  assert.ok(novice.nextRank !== null);
  assert.equal(novice.pointsToNext, 40);

  const master = computeArchivistRank(10, 45, 1); // 180 + 45 + 35 = 260
  assert.equal(master.currentRank.tier, 4);
  assert.equal(master.currentRank.title, 'Master Signet');
  assert.ok(master.progressPercent >= 4 && master.progressPercent <= 100);

  const grand = computeArchivistRank(25, 100, 3); // 450 + 100 + 105 = 655
  assert.equal(grand.currentRank.tier, 6);
  assert.equal(grand.currentRank.title, 'Grand Royal Archivist');
  assert.equal(grand.nextRank, null);
  assert.equal(grand.progressPercent, 100);
  assert.equal(grand.pointsToNext, 0);
});

test('v3 Top-10 Royal Courier Commissions: computes completion, claimability, and claimed state', () => {
  const evaluated = evaluateRoyalCommissions(
    {
      ribbonsUnsealed: 22,
      waxSealsBroken: 1,
      threeStarParcels: 1,
      silkRushTriggers: 0,
    },
    ['ribbon_weaver']
  );

  const weaver = evaluated.find((c) => c.id === 'ribbon_weaver');
  assert.ok(weaver);
  assert.equal(weaver.completed, true);
  assert.equal(weaver.claimed, true);
  assert.equal(weaver.claimable, false);

  const envoy = evaluated.find((c) => c.id === 'three_star_courier');
  assert.ok(envoy);
  assert.equal(envoy.completed, true);
  assert.equal(envoy.claimed, false);
  assert.equal(envoy.claimable, true);

  const wax = evaluated.find((c) => c.id === 'wax_breaker');
  assert.ok(wax);
  assert.equal(wax.completed, false);
  assert.equal(wax.claimable, false);
  assert.equal(wax.current, 1);
});

test('v3 Top-10 Shareable Dispatch Stamp Card: produces crisp spoiler-free summary with stars and streak', () => {
  const card = formatShareableDispatchCard({
    parcelTitle: 'Parcel 5 · Sovereign Keepsake',
    heirloomName: 'Imperial Songbird Egg',
    stars: 3,
    isDaily: true,
    dailyDateKey: '2026-05-12',
    dailyStreak: 4,
    rankTitle: 'Master Signet',
    peakRackUsed: 2,
    maxRackSlots: 5,
  });

  assert.ok(card.includes('Royal Post · Daily Dispatch (2026-05-12)'));
  assert.ok(card.includes('★★★  Imperial Songbird Egg Unboxed'));
  assert.ok(card.includes('Rack Discipline: 2/5 pegs · Master Signet · 4d Streak'));
});




