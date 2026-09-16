# Wizard 1v1s

A wizard duelling game built as a **YouTube Playable**. Dodge left or right, draw glyphs to cast spells that lock on by themselves, beat 100 progressively harder wizards with a boss every 5 levels. Vanilla TypeScript, three.js for the arena with Blender-made GLB models rendered PS2-style (textured low-poly, vertex lighting, low internal resolution), a 16-bit pixel UI (Jersey 10 font, CRT scanlines), synthesised audio, ~1.3 MB total.

## Gameplay

- **Three lanes.** The enemy telegraphs which lane a bolt is aimed at (red strip), then fires. Tap the dodge buttons, swipe the arena, or use the arrow keys / A / D to change lane.
- **Draw to cast.** Every spell has a single-stroke glyph. Draw it on the pad and the spell fires at the enemy. Tap a spell in the strip to see its glyph at the size it needs. Unclear strokes fizzle without costing mana, and the stronger the spell the larger and cleaner the stroke must be (Spark spans a third of the pad, Meteor four fifths), so a tiny scribble cannot spam heavy spells.
- **Mana** regenerates over time; expensive spells hit harder. A few utility spells also have cooldowns.
- **Stamina** is spent by every dodge (30 of 100 by default) and regenerates quickly. Run dry and you are "out of breath" until it refills. The Endurance upgrade and the boots gear slot raise stamina, its regen, or lower the dodge cost.
- **24 spells:** 5 starters (Spark, Fireball, Ice Shard, Ward, Mend), 19 in the shop. Attacks, shields, heals, a mirror shell, a phase step, freezes, slows, damage-over-time, mana restore, and heavy hitters like Meteor and Void Rift.
- **Flow:** title screen, then a 100-tile level map (cleared, next, locked, bosses marked), then the battle. Shop and training are one tap from the title.
- **Loadout** of 6 slots (up to 10 with the Grimoire upgrade). Only equipped spells are recognised, which keeps drawing accurate.
- **Enemies** scale in health, damage and cast speed with level. From level 6 they fire double-lane bolts, from level 12 homing seekers (dodge late, or shield/reflect/phase), bosses add barrages, self-heals and shields. Ten enemy tiers with their own arena palette.
- **Bosses** every 5 levels, 20 named bosses up to Archmage Zorvath at level 100. Bosses fight in their own Lava Sanctum arena (obsidian floor, lava channels, obelisks, colossi and a throne).
- **Arenas:** regular levels rotate through the Castle Courtyard, the Ruined Glade and the Crystal Cavern; each is a separate GLB stage swapped at battle start.
- **Outfits:** every enemy is dressed per level from six hat styles (pointy, hood, crown, horns, wide, turban), six skin tones, hue-shifted tier robes, four trim colours, beard on or off and cape on or off, so neighbouring levels never look the same. Bosses wear crowns or horns.
- **Shop** after every level: spells, 8 character upgrades, 20 pieces of gear in 4 slots (wand, robe, charm, boots) with painted tier emblems, rewarded ads for coins, and a training tab.
- **Training** fights a dummy with endless health, shows damage and DPS, and can be switched to fight back for dodge practice.
- **Coins** come from wins (bosses pay triple, replays 60%, losses 25%) and from rewarded ads (reward scales with your best level).

## Play locally

```bash
npm install
npm run dev
```

Open http://localhost:5174. Outside YouTube the Playables SDK is a no-op, saves go to `localStorage`, and the rewarded ad is replaced by a 3-second demo overlay.

## Build

```bash
npm run build
```

Output goes to `dist/` with relative asset paths (Vite `base: './'`). three.js is split into its own chunk so every file stays under the 512 KiB "should" limit.

## Produce the Playables ZIP

```bash
npm run bundle
```

Creates `wizard-1v1s-playable.zip` from `dist/` (index.html at the root). Upload this in the Playables Developer Portal once your channel is onboarded.

## Host publicly (needed for the Playables interest form)

`.github/workflows/pages.yml` builds and deploys `dist/` to GitHub Pages on every push to `main`.

1. Create a GitHub repository and push this folder to `main`.
2. In the repository, open Settings -> Pages and set **Source** to **GitHub Actions** (the workflow token cannot do this by itself).
3. After the workflow finishes, the game is live at `https://<user>.github.io/<repo>/`.

## Playables compliance checklist

| Requirement | How it is met |
|---|---|
| SDK loaded first | `<script src="https://www.youtube.com/game_api/v1">` is the first script in `index.html` |
| `firstFrameReady` / `gameReady` | Called in `src/main.ts` after the boot text paints and after the menu is interactive |
| Cloud save only via `saveData`/`loadData` | `src/sdk.ts`; saved on every purchase, battle end and on pause; old formats parsed defensively in `src/save.ts` |
| Pause/resume via SDK callbacks | `src/main.ts` + `UI.onPause/onResume`; the battle loop freezes while paused |
| Audio follows YouTube mute | `isAudioEnabled` / `onAudioEnabledChange` gate the shared AudioContext in `src/audio.ts`; no mute button |
| Rewarded ads only through YouTube | `ytgame.ads.requestRewardedAd('coins')` from the shop's Coins tab |
| `sendScore` | Highest level cleared, sent when it improves; matches the save |
| No external calls | No analytics or CDNs; the Jersey 10 font (OFL), logo and GLB models are bundled; textures are drawn on canvas at boot; all audio is synthesised; the only network request is the SDK itself |
| All aspect ratios 9:32 to 32:9 | Portrait stacks arena over controls, landscape puts controls in a side panel; the 3D camera widens its field of view on tall screens |
| Touch + mouse + keyboard | Pointer events for drawing and dodging, arrow keys / A / D dodge, Esc closes overlays and leaves training |
| No exit button, no external links | None present |
| Bundle size | ~2.3 MB uncompressed, 11 files, largest file 528 KB (three.js, slightly over the 512 KiB "should" guideline); stage models are 491, 291, 183 and 364 KB and the wizard 262 KB |

## Project layout

- `src/data.ts` - spells, upgrades, equipment, enemy tiers, bosses, level curve, economy
- `src/glyphs.ts` - the 24 stroke templates and the glyph icon painter
- `src/recognizer.ts` - $1 unistroke recogniser (no rotation invariance, uniform scaling, stroke smoothing)
- `src/battle.ts` - battle simulation (pure logic, emits events)
- `src/scene.ts` - three.js arena: GLB wizard with swappable hats, four stage models, sky dome, projectiles, particles, lane telegraphs
- `src/icons.ts` - pixel-art emblems for gear tiers and upgrades
- `src/textures.ts` - procedural 64x64 nearest-filtered textures (stone, wood, cloth, gold, banner, roof) for the PS2 look
- `src/ui.ts` - screens, HUD, draw pad, shop, training, result, fake ad
- `src/save.ts` - save format, parsing and derived player stats
- `src/audio.ts` - WebAudio synth for all effects and the generative music loop
- `src/sdk.ts` - YouTube Playables SDK wrapper with local fallbacks

## Art

The wizard and the four arenas are Blender models exported as GLB (`src/assets/models/`), built with `bpy` scripts through the Blender MCP: a robed wizard with six hat variants (`Hat_*` nodes toggled at runtime), cape, beard, belt and a claw-topped staff on an `ArmPivot` node the game rotates to cast; the castle courtyard, ruined glade, crystal cavern and lava sanctum, each merged into one mesh per material. Materials are named (`Robe`, `Hat`, `Trim`, `Banner`, ...) so the game recolours them per enemy tier at runtime. If a model fails to load the scene falls back to primitives. Gear and upgrade emblems are painted on canvas in `src/icons.ts`.

To change the models, rebuild them in Blender and export again with `use_selection`, `export_apply`, Y-up, no textures; keep each file under 512 KiB.
