import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import {
  HapticIntensity,
  HAPTIC_INTENSITY_ORDER,
  HAPTIC_INTENSITY_SPECS,
  scaleVibrationPattern,
  resolveImpactTier,
} from './rules.ts';

type HapticListener = (intensity: HapticIntensity, lastPulseLabel: string) => void;

/**
 * Native Capacitor Haptics wrapper with configurable Haptic Intensity ('off' | 'light' | 'medium' | 'heavy')
 * and web vibration + visual micro-recoil fallbacks.
 */
class HapticsManager {
  private hasNativeCapacitor = false;
  private intensity: HapticIntensity = 'medium';
  private listeners: Set<HapticListener> = new Set();

  constructor() {
    this.detectEnvironment();
  }

  private detectEnvironment() {
    try {
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
      ) {
        this.hasNativeCapacitor = true;
      }
    } catch {
      this.hasNativeCapacitor = false;
    }
  }

  public getIntensity(): HapticIntensity {
    return this.intensity;
  }

  public getIntensitySpec() {
    return HAPTIC_INTENSITY_SPECS[this.intensity];
  }

  public setIntensity(next: HapticIntensity) {
    this.intensity = next;
    const spec = HAPTIC_INTENSITY_SPECS[next];
    this.notifyListeners(`Haptics: ${spec.shortLabel} (${spec.percentLabel})`);
    if (next !== 'off') {
      void this.pinPull();
    }
  }

  public cycleIntensity(): HapticIntensity {
    const idx = HAPTIC_INTENSITY_ORDER.indexOf(this.intensity);
    const next = HAPTIC_INTENSITY_ORDER[(idx + 1) % HAPTIC_INTENSITY_ORDER.length];
    this.setIntensity(next);
    return next;
  }

  public subscribe(listener: HapticListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(pulseLabel: string) {
    this.listeners.forEach((cb) => cb(this.intensity, pulseLabel));
  }

  private mapTierToCapacitorStyle(tier: 'light' | 'medium' | 'heavy'): ImpactStyle {
    if (tier === 'light') return ImpactStyle.Light;
    if (tier === 'heavy') return ImpactStyle.Heavy;
    return ImpactStyle.Medium;
  }

  /**
   * Crisp light tap when hovering or selecting
   */
  async lightTap() {
    const tier = resolveImpactTier('light', this.intensity);
    if (tier === 'off') return;
    try {
      await Haptics.impact({ style: this.mapTierToCapacitorStyle(tier) });
    } catch {
      this.fallbackVibrate(scaleVibrationPattern(10, this.intensity));
    }
  }

  /**
   * Medium crisp vibration when pulling/unscrewing an unblocked pin
   */
  async pinPull() {
    const tier = resolveImpactTier('medium', this.intensity);
    if (tier === 'off') return;
    const spec = HAPTIC_INTENSITY_SPECS[this.intensity];
    this.notifyListeners(`Taptic ${spec.shortLabel} · Pin Pull`);
    try {
      await Haptics.impact({ style: this.mapTierToCapacitorStyle(tier) });
    } catch {
      this.fallbackVibrate(scaleVibrationPattern(25, this.intensity));
    }
  }

  /**
   * Heavy satisfying bump when a plate breaks free and falls
   */
  async plateRelease() {
    const tier = resolveImpactTier('heavy', this.intensity);
    if (tier === 'off') return;
    const spec = HAPTIC_INTENSITY_SPECS[this.intensity];
    this.notifyListeners(`Taptic ${spec.shortLabel} · Shatter`);
    try {
      await Haptics.impact({ style: this.mapTierToCapacitorStyle(tier) });
    } catch {
      this.fallbackVibrate(scaleVibrationPattern([18, 28, 24], this.intensity));
    }
  }

  /**
   * Success notification when a 3-slot toolbox is completed
   */
  async boxCompleted() {
    if (this.intensity === 'off') return;
    try {
      if (this.intensity === 'heavy') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      this.fallbackVibrate(scaleVibrationPattern([30, 45, 45], this.intensity));
    }
  }

  /**
   * Warning error buzz when tapping an occluded/blocked pin
   */
  async occludedBlocked() {
    if (this.intensity === 'off') return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      this.fallbackVibrate(scaleVibrationPattern([50, 35, 50], this.intensity));
    }
  }

  /**
   * Heavy failure buzz on buffer overflow ('Almost Won!' fail state)
   */
  async failState() {
    if (this.intensity === 'off') return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      this.fallbackVibrate(scaleVibrationPattern([80, 50, 100], this.intensity));
    }
  }

  private fallbackVibrate(pattern: number | number[]) {
    if (pattern === 0) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Silent catch for unsupported browsers
    }
  }
}

export const haptics = new HapticsManager();
