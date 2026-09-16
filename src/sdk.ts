// Thin wrapper around the YouTube Playables SDK with local fallbacks so the game
// runs identically on a plain web host (GitHub Pages etc.) and inside YouTube.

const LOCAL_KEY = 'wizard-1v1s-save';

function hasSdk(): boolean {
  return typeof ytgame !== 'undefined' && !!ytgame;
}

export const inPlayables = (): boolean => hasSdk() && ytgame.IN_PLAYABLES_ENV === true;

/** Fallback used when the rewarded-ad API is unavailable (set by the UI layer). */
let fallbackRewardedAd: (() => Promise<boolean>) | null = null;
export function setFallbackRewardedAd(fn: () => Promise<boolean>): void {
  fallbackRewardedAd = fn;
}

export function firstFrameReady(): void {
  if (hasSdk()) {
    try { ytgame.game.firstFrameReady(); } catch { /* no-op outside YouTube */ }
  }
}

export function gameReady(): void {
  if (hasSdk()) {
    try { ytgame.game.gameReady(); } catch { /* no-op outside YouTube */ }
  }
}

export async function loadData(): Promise<string | null> {
  if (inPlayables()) {
    try {
      const s = await ytgame.game.loadData();
      return s || null;
    } catch {
      return null;
    }
  }
  try {
    return localStorage.getItem(LOCAL_KEY);
  } catch {
    return null;
  }
}

let saveChain: Promise<void> = Promise.resolve();
/** Saves are serialised so a later save can never overtake an earlier one. */
export function saveData(data: string): Promise<void> {
  saveChain = saveChain.then(async () => {
    if (inPlayables()) {
      try { await ytgame.game.saveData(data); } catch { /* best effort */ }
      return;
    }
    try { localStorage.setItem(LOCAL_KEY, data); } catch { /* private mode etc. */ }
  });
  return saveChain;
}

export function isAudioEnabled(): boolean {
  // Outside YouTube the no-op SDK reports audio as disabled; only trust it inside Playables.
  if (inPlayables()) {
    try { return ytgame.system.isAudioEnabled(); } catch { /* fall through */ }
  }
  return true;
}

export function onAudioEnabledChange(cb: (enabled: boolean) => void): void {
  if (inPlayables()) {
    try { ytgame.system.onAudioEnabledChange(cb); } catch { /* ignore */ }
  }
}

export function onPause(cb: () => void): void {
  if (hasSdk()) {
    try { ytgame.system.onPause(cb); } catch { /* ignore */ }
  }
}

export function onResume(cb: () => void): void {
  if (hasSdk()) {
    try { ytgame.system.onResume(cb); } catch { /* ignore */ }
  }
}

export async function sendScore(value: number): Promise<void> {
  if (!inPlayables()) return;
  try { await ytgame.engagement.sendScore({ value: Math.floor(value) }); } catch { /* best effort */ }
}

/** Returns true when the player earned the reward. */
export async function requestRewardedAd(rewardId: string): Promise<boolean> {
  if (inPlayables()) {
    try {
      return await ytgame.ads.requestRewardedAd(rewardId);
    } catch {
      return false;
    }
  }
  if (fallbackRewardedAd) return fallbackRewardedAd();
  return false;
}
