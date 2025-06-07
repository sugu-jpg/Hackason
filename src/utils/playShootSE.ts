export function playShootSE() {
    const audio = new Audio("/image/bullet.mp3"); // 🎧 public/sounds に配置
    audio.volume = 0.6;
    audio.play().catch((e) => {
      console.warn("銃撃SEの再生失敗:", e);
    });
  }
  