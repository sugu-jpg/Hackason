export function playExplosionSE() {
    const audio = new Audio("/image/8bit_shoot1.mp3"); // ← または外部URLもOK
    audio.volume = 1.0;
    audio.play().catch((e) => {
      console.warn("音の再生に失敗しました", e);
    });
  }
  