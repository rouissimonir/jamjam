import titleHeroArt from '../assets/images/royal_post_title_art_1795099782585.jpg';
import songbirdArt from '../assets/images/heirloom_songbird_art_1795099781870.jpg';
import watchArt from '../assets/images/heirloom_watch_art_1795099781885.jpg';
import teaChestArt from '../assets/images/heirloom_teachest_art_1795099782102.jpg';
import orreryArt from '../assets/images/heirloom_orrery_art_1795099781759.jpg';
import type { HeirloomId } from './rules.ts';

/**
 * Bundled client-side museum & title key-art assets for Royal Post: Wax & Ribbon.
 * Imported only by React UI components so Node unit tests remain pure and fast.
 */
export const TITLE_HERO_ARTWORK = titleHeroArt;

export const HEIRLOOM_ARTWORK: Record<HeirloomId, string> = {
  songbird_egg: songbirdArt,
  astral_watch: watchArt,
  kyoto_tea_chest: teaChestArt,
  botanical_orrery: orreryArt,
};
