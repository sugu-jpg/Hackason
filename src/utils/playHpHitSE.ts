// src/utils/playHpHitSE.ts
export function playHpHitSE() {
    const audio = new Audio("/image/hitnabe.mp3"); // 公開フォルダに配置しておく
    audio.volume = 1.0;
    audio.play().catch((e) => {
      console.warn("HP減少SEの再生失敗:", e);
    });
  }
  