import './style.css';
import * as sdk from './sdk';
import { pauseAudio, resumeAudio, setAudioEnabled } from './audio';
import { parseSave } from './save';
import { UI, showSplash } from './ui';
import { preloadModels } from './scene';
import { GLYPHS } from './glyphs';
import { Recognizer } from './recognizer';
import { SPELLS, SPELL_BY_ID, enemyForLevel } from './data';
import { Battle } from './battle';
import { computeStats, defaultSave } from './save';

// Dev-only hook for testing glyph recognition and simulating battles from the console.
if (import.meta.env.DEV) {
  (window as unknown as { __wiz: unknown }).__wiz = { GLYPHS, Recognizer, SPELLS, SPELL_BY_ID, enemyForLevel, Battle, computeStats, defaultSave };
}

async function boot(): Promise<void> {
  const root = document.getElementById('app') as HTMLElement;

  // The boot text is already painted; tell YouTube we are drawing.
  requestAnimationFrame(() => sdk.firstFrameReady());

  setAudioEnabled(sdk.isAudioEnabled());
  sdk.onAudioEnabledChange(on => setAudioEnabled(on));

  const splashDone = showSplash(root);
  const [raw] = await Promise.all([
    sdk.loadData(),
    preloadModels(),
    document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve(),
  ]);
  const save = parseSave(raw);

  const ui = new UI(root, save, () => { void sdk.saveData(JSON.stringify(save)); });
  if (import.meta.env.DEV) (window as unknown as { __wiz: { ui: UI } }).__wiz.ui = ui;
  sdk.setFallbackRewardedAd(() => ui.showFakeAd());

  sdk.onPause(() => {
    pauseAudio();
    ui.onPause();
    void sdk.saveData(JSON.stringify(save));
  });
  sdk.onResume(() => {
    resumeAudio();
    ui.onResume();
  });

  await splashDone;
  ui.showMenu();
  // The menu is interactive now.
  requestAnimationFrame(() => sdk.gameReady());
}

void boot();
