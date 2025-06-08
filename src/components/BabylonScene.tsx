// components/BabylonScene.tsx
"use client";

import React, { memo, useEffect, useRef } from "react";
import { useGameState } from "../hooks/useGameState";
import { useDeviceOrientation } from "../hooks/useDeviceOrientation";
import { useBabylonGame } from "../hooks/useBabylonGame";
import { GameUI, PermissionButton, GameOverModal } from "../components/GameUi";

const BabylonScene = memo(() => {
  const {
    orientation,
    setOrientation,
    permissionGranted,
    setPermissionGranted,
    enemyCount,
    setEnemyCount,
    hp,
    updateHp,
    hits,
    updateHits,
    gameOver,
    setGameOver,
    isSubmitting,
    gameOverRef,
    hpRef,
    hitsRef,
    maxEnemies,
    restartGame,
  } = useGameState();

  const { requestPermission } = useDeviceOrientation();

  const { canvasRef } = useBabylonGame({
    permissionGranted,
    gameOver,
    maxEnemies,
    updateHp,
    updateHits,
    setEnemyCount,
    setOrientation,
    gameOverRef,
    hpRef,
    hitsRef,
    setGameOver,
  });

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setPermissionGranted(granted);
  };

  // useRefで初期値をnullにし、useEffect内で初期化
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  const playBgm = () => {
    if (!bgmRef.current) return;
    
    const audio = bgmRef.current;
    audio.loop = true;
    audio.volume = 0.3;

    const handler = () => {
      audio
        .play()
        .then(() => {
          console.log("✅ BGM再生成功");
        })
        .catch((e) => {
          console.warn("BGM再生エラー:", e);
        });
      document.removeEventListener("click", handler);
    };

    document.addEventListener("click", handler);
  };

  const stopBgm = () => {
    const audio = bgmRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    console.log("🛑 BGM停止");
  };

  // useEffect内でAudioオブジェクトを初期化（クライアントサイドでのみ実行）
  useEffect(() => {
    // ブラウザ環境でのみAudioオブジェクトを作成
    if (typeof window !== 'undefined') {
      bgmRef.current = new Audio("/image/bgm1.mp3");
      playBgm();
    }

    return () => {
      stopBgm();
      // クリーンアップ時にAudioオブジェクトを削除
      if (bgmRef.current) {
        bgmRef.current = null;
      }
    };
  }, []);

  return (
    <>
      {/* センサー許可ボタン */}
      {!permissionGranted && (
        <PermissionButton onRequestPermission={handleRequestPermission} />
      )}

      {/* ゲームオーバーモーダル */}
      {gameOver && (
        <GameOverModal
          hits={hits}
          isSubmitting={isSubmitting}
          onRestart={restartGame}
        />
      )}

      {/* メインキャンバス */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100vh", display: "block" }}
      />

      {/* ゲームUI */}
      <GameUI
        hp={hp}
        hits={hits}
        enemyCount={enemyCount}
        maxEnemies={maxEnemies}
        orientation={orientation}
        gameOver={gameOver}
      />
    </>
  );
});

BabylonScene.displayName = "BabylonScene";

export default BabylonScene;