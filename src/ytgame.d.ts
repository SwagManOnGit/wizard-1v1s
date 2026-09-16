// Minimal type surface for the YouTube Playables SDK (https://www.youtube.com/game_api/v1).
// The real SDK is loaded by a <script> tag in index.html and becomes the global `ytgame`.
declare namespace ytgame {
  const IN_PLAYABLES_ENV: boolean;
  const SDK_VERSION: string;

  namespace game {
    function firstFrameReady(): void;
    function gameReady(): void;
    function loadData(): Promise<string>;
    function saveData(data: string): Promise<void>;
  }

  namespace system {
    function isAudioEnabled(): boolean;
    function onAudioEnabledChange(cb: (enabled: boolean) => void): () => void;
    function onPause(cb: () => void): () => void;
    function onResume(cb: () => void): () => void;
    function getLanguage(): Promise<string>;
  }

  namespace engagement {
    function sendScore(score: { value: number }): Promise<void>;
  }

  namespace ads {
    function requestInterstitialAd(): Promise<void>;
    function requestRewardedAd(rewardId: string): Promise<boolean>;
  }

  namespace health {
    function logError(): void;
    function logWarning(): void;
  }
}
