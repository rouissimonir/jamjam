# Royal Post: Wax & Ribbon
## Comprehensive Game Architecture & Feature Documentation

> **Blue-Ocean iOS App Store Niche:** *Wax Seal & Satin Ribbon Unboxing*  
> **Tech Stack:** React 19, TypeScript, Phaser 4 (WebGL + Canvas), Matter.js Physics Engine, Tailwind CSS, Lucide Icons, Web Audio ASMR Synthesizer, Capacitor 7 (iOS Native), Capgo Live OTA Updates.

---

## 1. Executive Summary & Four Locked-In Pillars

**Royal Post: Wax & Ribbon** is a warm tactile luxury iOS hybrid-casual puzzle game built around an untapped App Store category — cracking lacquered wax seals, peeling layered satin ribbons, and watching antique royal heirlooms come alive in real time on an oiled-walnut archivist desk.

1. **Untapped Blue-Ocean Niche (*Wax Seal & Satin Ribbon Unboxing*):** Replaces generic industrial screws/bolts with embossed sealing wax stamps, silk ribbon weave patterns (color-blind safe), and heirloom parcels from Paris, Kyoto, and Venice.
2. **Strategic Zero-Timer Pressure Loop:** Zero countdown clock. Spatial tension comes from the **5-Peg Brass Ribbon Rack** (buffer dock), **Active 3-Spool Velvet Bobbin**, one-per-parcel **Bobbin Swap (`[S]`)**, **Golden Scissors (`[W]`)**, and the **"One Ribbon Short!"** bailout offer.
3. **Always-Visible Live Centerpiece Heirloom Unboxing Stage:** Positioned directly above the parcel board so players watch the heirloom transform on **every single matched ribbon and completed bobbin** (`0% Sealed Parcel` → `Wax Seal Cracked` → `Velvet Lid Ajar` → `100% Awakened Heirloom`).
4. **Warm Tactile Luxury & Crisp ASMR Audio-Haptics:** Oiled walnut (`#16100E`), burgundy velvet (`#2A1B18`), cream parchment (`#F5EFE6`), burnished gold (`#F59E0B`), `Fraunces` editorial serif + `Plus Jakarta Sans` + `JetBrains Mono`, paired with procedural Web Audio ASMR soundscapes and scaled iOS CoreHaptics.

---

## 2. Core Game Loop & Physics Mechanics

### 2.1 Four Discrete Ribbon Depth Strata (`0..3`)
- **Matter.js Bitmask Isolation:**
  - `Stratum 0`: Category `0x0001`, Mask `0x0001` (deepest ribbon base)
  - `Stratum 1`: Category `0x0002`, Mask `0x0002`
  - `Stratum 2`: Category `0x0004`, Mask `0x0004`
  - `Stratum 3`: Category `0x0008`, Mask `0x0008` (top foreground ribbon)
- Ribbons only collide with ribbons on the exact same stratum; released ribbons glide downward cleanly off the parcel without snagging on underlying layers.

### 2.2 Seal & Ribbon Swing Physics
- **$\ge 2$ Wax Seals Remaining on Ribbon:** `mode = 'locked'` (`Inertia = Infinity`).
- **1 Wax Seal Remaining:** `mode = 'pendulum'`. The final wax seal becomes a pivot bearing so the satin ribbon swings naturally under gravity.
- **0 Wax Seals Remaining:** `mode = 'freefall'`. The ribbon peels cleanly off the parcel mat and awards **+15 Crowns**.

### 2.3 Overlap Occlusion Rule ($>25\%$)
- Tapping a wax seal tests polygon overlap against all non-cleared ribbons on higher depth strata.
- If overlapping ribbons cover $>25\%$ of the seal surface, extraction is blocked with a muted leather thump (`playBlockedThud`), crimson flash on the blocking ribbon, and subtle double haptic buzz.

### 2.4 5-Second Candlelight Visual Hint System (`evaluateIdleMovableHints`)
- After **5.0 seconds (`IDLE_HINT_DELAY_MS = 5000`)** of player inactivity during active play, the engine highlights all unoccluded, unlocked, un-waxed movable seals:
  - **Active Bobbin Matches (`MATCH`):** Warm candlelight gold pulsing halo (`#FBBF24`) with animated downward chevron (`▼`).
  - **Free Movable Seals (`FREE`):** Soft emerald velvet aura (`#10B981`).
  - Updates the header badge (`Hint: X Free Seals`) and resets immediately on any click or action.

---

## 3. Tactile Parcel Hazards

1. **Double-Dipped Wax Crust (`WAX×2` → `WAX×1` → `Cracked!`):** Seals encased in hardened wax layers cannot be peeled directly. Peeling another seal on the **same ribbon** cracks the crust by 1 (`playFrostCrackChime`), awarding **+10 Crowns** when shattered.
2. **Signet Crest & Brass Clasp (`SIGNET` & `LOCK`):** Clasp-locked seals require pulling their paired golden **Signet Crest** seal first, triggering a harmonic brass unlock chime (`playKeyUnlockChime`) and **+15 Crowns**.
3. **Tied Satin Bow-Knot (`BOW`):** Two seals joined by a braided satin cord (`chainedWithPinId`). Once both seals are uncovered and unlocked, tapping either unties **both simultaneously** with a double silk-whisper pull (`playChainReleaseChime`) and **+15 Crowns**.

---

## 4. Live Centerpiece Heirloom Unboxing Engine (`LiveHeirloomStage.tsx`)

Pure state derivation lives in `src/game/rules.ts` (`HEIRLOOM_CATALOG`, `getHeirloomForLevel`, `computeLiveHeirloomUnboxingState`):
- **4 Bespoke Animated Heirlooms:**
  1. `songbird_egg` — *Imperial Songbird Egg* (Parisian Atelier)
  2. `astral_watch` — *Venetian Astral Watch* (Venetian Horology)
  3. `kyoto_tea_chest` — *Kyoto Lacquer Tea Chest* (Kyoto Silk Studio)
  4. `botanical_orrery` — *Botanical Brass Orrery* (Grand Archive)
- **4 Progressive Live Transformation Stages:**
  - **Stage 0 (`0%`):** *Sealed Parcel* — Bound in taut satin ribbons & intact crimson wax seal.
  - **Stage 1 (`1%–49%`):** *Wax Seal Cracked* — Wax fractures into shards; ribbons slacken.
  - **Stage 2 (`50%–99%`):** *Velvet Lid Ajar* — Ribbons untied; gold candlelight spills from inside the heirloom case.
  - **Stage 3 (`100%`):** *Awakened Heirloom* — Lid opens wide and the keepsake rises into view with a celesta unboxing chord.
- **Desktop Archivist Desk Split (`lg:`):** Pairs the interactive parcel desk on the left with `DesktopCurioLedger.tsx` on the right (active parcel dossier, 4-stage live checklist, Royal Curio Gallery shelf, color-blind Ribbon Weave Key, and keyboard shortcuts).

---

## 5. Strategic 5-Peg Brass Rack & Tactile Tools

- **Active 3-Spool Velvet Bobbin:** Collects 3 matching satin ribbons, awards **+20 Crowns**, and triggers a live stage pulse on the centerpiece heirloom.
- **5-Peg Brass Ribbon Rack:** Holds unmatched ribbons safely with automatic drain whenever a matching bobbin advances to active.
- **Bobbin Swap (`[S]`):** Once per parcel, swaps the Active Bobbin with the Next Bobbin while preserving wound ribbons and immediately draining matching pegs.
- **Golden Scissors (`[W]`):** Charges after 3 direct ribbon matches; snips a ribbon on the rack or board directly onto the active bobbin.
- **Tactile Desk Tools:** **Tilt Parcel (`[G]`)**, **Layer Peek (`[E]`)**, **Silk Loupe (`[X]`)**, **Silk Magnet (25 Crowns)**, and **Rack Clear (30 Crowns)**.
- **"One Ribbon Short!" Bailout:** Triggered cleanly only when the 5-Peg Rack overflows with zero legal moves, offering a +2 Peg Brass Extension & 2-Ribbon Silk Drain.

---

## 6. Three Tactile Atelier Worlds & Companion Archivists

| World | Theme ID | Archivist Companion | Signature Curio |
| --- | --- | --- | --- |
| **Royal Wax** | `stained_glass` | **Camille Beaumont** (*Royal Archivist*) | Imperial Songbird Egg |
| **Kyoto Silk** | `knit_yarn` | **Haruto Sato** (*Master Silk Binder*) | Kyoto Lacquer Tea Chest |
| **Venetian** | `retro_gadget` | **Lorenzo Bellini** (*Master Horologist*) | Venetian Astral Watch |

Each ribbon color carries a distinct **color-blind weave stitch motif** (`Crimson · Diagonal Twill`, `Royal · Herringbone`, `Gold · Diamond Weave`, `Emerald · Satin Dotted`, `Plum · Brocade Cross`) rendered directly onto the Phaser canvas and indexed in the Desktop Curio Ledger.

---

## 7. Procedural ASMR Web Audio & CoreHaptics

- **`src/game/audio.ts`:** Synthesizes crisp tactile foley with zero audio file bloat — bandpass-filtered **brittle wax crack (`1.8kHz–3.2kHz`)**, **silky satin ribbon whisper**, **tailoring scissors snip**, **antique mahogany music-box celesta unboxing chord**, and ascending combo fever harmonies.
- **`src/game/haptics.ts`:** Configurable CoreHaptics / Taptic Engine intensity (`off`, `light`, `medium`, `heavy`) mapped to wax cracks, ribbon pulls, bobbin completions, and blocked overlaps.

---

## 8. iOS Native Pipeline & 10-Locale Blue-Ocean ASO

- **Capacitor 7 (`capacitor.config.ts`):** Configured with `appId: 'com.royalpost.waxribbon'`, `appName: 'Royal Post: Wax & Ribbon'`, and `#16100E` oiled-walnut native launch backdrop.
- **Capgo Live OTA (`capacitorBridge.ts`):** Delivers bonus vault parcels (e.g. *Parcel 11: Imperial Envoy Vault*) over the air.
- **10-Locale U.S. Cross-Localization (`asoConfig.ts`):** Indexes 1,600 characters across `en-US`, `es-MX`, `ar`, `zh-Hans`, `zh-Hant`, `fr-CA`, `ko`, `pt-BR`, `ru`, and `vi` targeting low-competition high-intent clusters (`wax seal puzzle`, `asmr unbox`, `satin ribbon sort`, `gift unwrap cozy`, `no timer sort`).

---

## 9. v2 Retention & Tactile Luxury Enhancements

- **Persistent Local Archivist Ledger (`src/game/storage.ts`):** Versioned offline `localStorage` auto-save (`royal_post_archivist_ledger_v1`) persisting Gold Crowns, cleared parcels, win streak, Atelier tiers, desk finish, Wax Stamp Crest, story restoration chapters, daily courier dates, and audio/haptics settings, plus a two-step **Reset Progress** control inside the Curio Atelier.
- **Active Atelier Station Perks (`computeAtelierActivePerks`):** Every Atelier upgrade now drives live gameplay math — Crown reward multiplier (`x1.00..x1.45`), Wax/Combo bonus Crowns (`+0..+12`), discounted Rack Clear cost (`30 → 15 Crowns`), and faster Candlelight Idle Hints (`5.0s → 2.6s`).
- **Interactive Curio Inspection Pedestal (`CurioPedestalModal.tsx`):** Tapping any cataloged heirloom in the Desktop Curio Ledger, Live Heirloom Stage, Curio Atelier, or Victory screen opens a dark-velvet pedestal where players wind, spin, or lift each heirloom with bespoke animations and procedural ASMR music-box chimes (`playSongbirdTrill`, `playWatchEscapement`, `playLacquerChime`, `playOrreryHarp`).
- **Grand Wax-Seal Break Ceremony (`WaxSealCeremonyModal.tsx`):** Interactive 1-tap (or `Space`/`Enter`) crimson wax-seal crack ritual with shard particles and crisp crack acoustics (`playGrandWaxSealCrack`) between finishing the final bobbin and unveiling the 100% Awakened Heirloom Victory screen.
- **Deterministic Daily Royal Dispatch (`generateDailyDispatchLevel`):** Date-seeded (`YYYY-MM-DD`) daily parcel with guaranteed 3-ribbon bobbin parity, Daily Courier Streak tracking (`computeDailyCourierStreak`), and **+100 Crowns** first-clear reward.
- **Wax Re-Stamp Undo (`undoBufferedPinFromQueue` & `restoreBufferedPin`):** 1× free undo per parcel (then 15 Crowns) triggered via HUD or `[Z]` that gently re-stamps the last buffered seal from the 5-Peg Brass Rack back onto its satin ribbon with Matter.js constraint restoration and soft press foley (`playWaxRestampUndo`).

---

## 10. Verification & Testing

- **Deterministic Unit Test Suite (25 Tests):**
  ```bash
  npx --yes tsx --test src/game/rules.test.ts
  ```
  Covers collision layer bitmasks, pendulum inertia, $>25\%$ overlap occlusion, 5-peg rack routing & auto-drain, `WAX×2`, `SIGNET`/`LOCK`, `BOW` double extraction, Combo Fever pitch scaling, 5-second Candlelight Idle Hints, Story Chapters, Live Centerpiece Heirloom Unboxing (`0% → 50% → 100%`), Active Atelier Perks, Wax Re-Stamp Undo, 30-day Daily Royal Dispatch parity & determinism, Daily Courier Streaks, and Local Save serialization safety.
- **URL Testing Hooks:**
  - `http://localhost:3000/?autostart=1` — Jumps directly into Parcel 1 active gameplay.
  - `http://localhost:3000/?victory=1` — Opens Parcel 5 Victory & Awakened Heirloom view.
  - `http://localhost:3000/?level=N` — Launches directly into Parcel `N` (`1..11`).
